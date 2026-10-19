"""TL cash-leg upgrade: direct DİBS (T-bills, 2y fixed coupon bond) vs 32-day deposit, as a lot-based book.

DATA (raw/): worldgovernmentbonds.com historical API (Turkey 3m, 6m, 2y; daily; 3m/6m from 2021-05, 2y from 2015).
  Convention check vs Gedik DİBS bulletin 17.07.2025 and Treasury auction 11.08.2026: the series are SIMPLE annual
  yields (bills: simple = 'basit'; 2y: semiannual bond-equivalent 'basit'), but the 2y/5y feed intermittently prints
  the COMPOUND figure (c = (1+s/2)^2-1) for 1-3 days -> repaired (choose the convention closer to an 11-day median).
  All marks then use a trailing 7-day (bills) / 5-day (2y) median (no look-ahead). The wgb 3m/6m bills are ~1-1.5pp BELOW the bulletin
  secondary yields on 17.07.2025 (conservative).
TAX: DİBS interest & sale gains of individuals: 0% stopaj for bonds/bills ACQUIRED 22.12.2021-31.12.2026 (Yapı Kredi
  2026 tax table; extensions by Presidential decrees, latest published 01.08.2025), otherwise 10%.
  Deposits: deposit_v5 stopaj table (5% -> 17.5%).
PRODUCTS (lots):
  D : 32-day term deposit, rate = deposit_v5 table (+premium pp gross), locked; break forfeits accrued interest.
  B : zero-coupon T-bill of tenor k months bought at mid simple yield - s/2 (ask), marked at mid, sold at mid + s/2.
  L : 2y fixed-coupon par bond (semiannual coupon = ask yield at purchase), priced with the 2y yield, sold at bid.
ROUTING MODES (where new money / matured lots go):
  'D32'   : deposits only (v5 baseline, but new money starts its own 32-day term).
  'BILLk' : T-bill ladder of k months (k=3 or 6) - new money buys k-month bills, maturities roll into k-month bills.
  'BESTk' : at each routing moment compare NET simple rates known today: D32 net-of-stopaj vs k-month bill
            ask yield x (1 - DİBS tax) -> pick the higher (no fitted parameter).
  overlay dur=(X, ease): at month ends, if real policy rate (pol - CPI yoy, both as known) > X and easing, the whole
  free book (bills, matured deposits) moves into the 2y bond; when the rule switches off, the bond is sold.
Withdrawals: bills first (bid), then bond (bid), then deposits with the least accrued interest first (forfeit).
"""
import sys, pathlib
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; ROOT = H.parents[1]
sys.path.insert(0, str(ROOT / "research/combo")); sys.path.insert(0, str(ROOT / "research/try_carry_audit"))
sys.dont_write_bytecode = True
import deposit_v5 as DP
import audit_lib as AL

DIBS0_DATE = pd.Timestamp("2021-12-22")


def load_yields():
    d = pd.read_csv(H / "raw/tr_yields_wgb.csv", index_col=0, parse_dates=True)
    d = d[d.index.dayofweek < 5][["y3m", "y6m", "y24m"]]
    out = {}
    for c in d:
        s = d[c].dropna()
        if c == "y24m":
            alt = 200 * (np.sqrt(1 + s / 100) - 1)
            m = s.rolling(11, center=True, min_periods=3).median()
            s = s.where((s - m).abs() <= (alt - m).abs(), alt)
        out[c] = s.rolling(7 if c != "y24m" else 5, min_periods=1).median()   # trailing: robust to <=3-day bad prints
    return pd.DataFrame(out)


Y = load_yields()
PANEL = AL.panel(); POLC, EFFC = AL.corrected_rates(PANEL)


def market(idx, prem=0.0):
    """per-day arrays on idx: yields (fraction), deposit net rate, stopaj, policy, eff, cpi, real, ease flags."""
    def al(s):
        return s.reindex(idx.union(s.index)).ffill().reindex(idx).values
    M = dict(idx=idx)
    M["y3"] = al(Y.y3m) / 100; M["y6"] = al(Y.y6m) / 100; M["y24"] = al(Y.y24m) / 100
    M["dep_g"] = DP.gross(idx, prem).values
    M["stop"] = DP.stopaj(idx).values
    M["dep_n"] = M["dep_g"] * (1 - M["stop"])
    M["on_n"] = DP.net_rate(idx, "ON").values
    pol = al(POLC); eff = al(EFFC); cpi = al(PANEL.cpi)
    M["pol"] = pol; M["eff"] = eff; M["real"] = (pol - cpi) / 100
    # easing definitions (known at t): E1 last policy decision was a cut; E2 effective funding below its level 3m ago
    ps = POLC.copy(); ch = ps.diff().replace(0, np.nan).ffill()
    M["ease1"] = al(ch) < 0
    es = EFFC.copy(); M["ease2"] = al(es - es.shift(63)) < 0
    M["days"] = np.r_[0, (idx[1:] - idx[:-1]).days].astype(float)
    M["me"] = np.r_[idx[1:].month != idx[:-1].month, True]
    return M


def ytenor(M, i, T):
    """mid simple yield for tenor T (years) on day i: flat y3m below 0.25, linear 0.25->0.5 (y6m), 0.5->2 (y24m)."""
    y3, y6, y24 = M["y3"][i], M["y6"][i], M["y24"][i]
    if np.isnan(y3): y3 = y6 = M["dep_g"][i]          # pre-2021-05 fallback (only bills; not used in combo IS)
    if np.isnan(y6): y6 = y3
    if T <= 0.25: return y3
    if T <= 0.5: return y3 + (y6 - y3) * (T - 0.25) / 0.25
    return y6 + (y24 - y6) * min(1.0, (T - 0.5) / 1.5)


def bond_price(y, c, T):
    """dirty price per 1 nominal of a semiannual coupon bond, simple BEY y, remaining T years (accrued incl.)."""
    if T <= 0: return 1.0
    n = int(np.ceil(T * 2 - 1e-9)); tf = T * 2 - (n - 1)          # periods to next coupon = tf (0..1]
    k = np.arange(n) + tf; v = (1 + y / 2) ** (-k)
    return float((c / 2 * v).sum() + v[-1])


class CashBook:
    def __init__(self, M, mode="D32", k=3, spread=0.0025, dur=None, dur_spread=0.0030):
        self.M = M; self.mode = mode; self.k = k; self.s = spread; self.dur = dur; self.ds = dur_spread
        self.D = []; self.B = []; self.L = []; self.penalty = 0.0; self.cost = 0.0; self.i = 0
        self.dur_on = False; self.ndur = 0
        self.t = (M["idx"] - M["idx"][0]).days.values / 365.0

    # ------------------------------------------------------------ helpers
    def dibs_tax(self, buy_i):
        return 0.0 if self.M["idx"][buy_i] >= DIBS0_DATE else 0.10

    def prefer_bill(self, i):
        if self.mode.startswith("BILL"): return True
        if self.mode == "D32": return False
        T = self.k / 12; yb = ytenor(self.M, i, T) - self.s / 2
        yb *= 1 - (0.0 if self.M["idx"][i] >= DIBS0_DATE else 0.10)
        # compare effective annual (compound) net yields: bill rolled every T vs deposit rolled every 32 days
        return (1 + yb * T) ** (1 / T) > (1 + self.M["dep_n"][i] * DP.TERM / 365) ** (365 / DP.TERM)

    def buy_bill(self, x, i, T=None):
        T = self.k / 12 if T is None else T
        y = ytenor(self.M, i, T) - self.s / 2
        mt = round(self.t[i] + T, 6)
        for b in self.B:                                             # merge with a lot of the same maturity/tax status
            if b[1] == mt and self.dibs_tax(b[3]) == self.dibs_tax(i):
                b[0] += x * (1 + y * T); b[2] += x; return
        self.B.append([x * (1 + y * T), mt, x, i])                  # face, maturity time, cost, buy day

    def buy_dep(self, x, i):
        for d in self.D:
            if d[3] == 0.0 and d[2] == self.M["dep_n"][i]: d[0] += x; return
        self.D.append([x, 0.0, self.M["dep_n"][i], 0.0])            # principal, accrued, net rate, age(days)

    def buy_bond(self, x, i):
        y = ytenor(self.M, i, 2.0) - self.ds / 2
        # par bond at ask: coupon = ask yield, notional = x
        self.L.append([x, y, self.t[i] + 2.0, x, i])                # notional, coupon, maturity, cost, buy day

    def route(self, x, i, initial=False):
        if x <= 1e-9: return
        if self.dur_on: self.buy_bond(x, i); return
        if self.prefer_bill(i):
            if initial and self.k > 1:
                for j in range(1, self.k + 1): self.buy_bill(x / self.k, i, j / 12)
            else: self.buy_bill(x, i)
        else: self.buy_dep(x, i)

    def bill_val(self, b, i, side=0.0):
        T = max(b[1] - self.t[i], 0.0)
        if T <= 1e-9: return b[0]
        return b[0] / (1 + (ytenor(self.M, i, T) + side) * T)

    def bond_val(self, l, i, side=0.0):
        T = max(l[2] - self.t[i], 0.0)
        return l[0] * bond_price(ytenor(self.M, i, T) + side, l[1], T)

    # ------------------------------------------------------------ interface (same as deposit_v5.Deposit)
    def value(self):
        i = self.i
        return (sum(d[0] + d[1] for d in self.D) + sum(self.bill_val(b, i) for b in self.B)
                + sum(self.bond_val(l, i) for l in self.L))

    def deposit(self, x, i, initial=False):
        self.i = i; self.route(x, i, initial)

    def step(self, i):
        self.i = i; M = self.M; dd = M["days"][i]; free = 0.0
        nd = []
        for d in self.D:                                              # deposits: accrue / mature
            left = dd
            while left > 0:
                take = min(left, DP.TERM - d[3]); d[1] += d[0] * d[2] * take / 365; d[3] += take; left -= take
                if d[3] >= DP.TERM - 1e-9:
                    d[0] += d[1]; d[1] = 0.0; d[3] = 0.0
                    if self.mode == "D32" and not self.dur_on: d[2] = M["dep_n"][i]
                    else: free += d[0]; d[0] = 0.0; break
            if d[0] > 0: nd.append(d)
        self.D = nd
        nb = []
        for b in self.B:                                              # bills: redeem at face
            if b[1] <= self.t[i] + 1e-9:
                g = b[0] - b[2]; free += b[0] - self.dibs_tax(b[3]) * max(g, 0)
            else: nb.append(b)
        self.B = nb
        nl = []
        for l in self.L:                                              # bond coupons (semiannual) & maturity
            T0 = l[2] - (self.t[i] - dd / 365); T1 = l[2] - self.t[i]
            npay = int(np.ceil(T0 * 2 - 1e-9)) - int(np.ceil(max(T1, 0) * 2 - 1e-9))
            if npay > 0: free += npay * l[0] * l[1] / 2 * (1 - self.dibs_tax(l[4]))
            if T1 <= 1e-9: free += l[0]
            else: nl.append(l)
        self.L = nl
        # month-end duration rule
        if self.dur is not None and M["me"][i]:
            X, ease = self.dur
            on = bool(M["real"][i] > X and (M["ease1"][i] if ease == 1 else M["ease2"][i]) and not np.isnan(M["y24"][i]))
            if on and not self.dur_on:
                self.dur_on = True; self.ndur += 1
                for b in self.B: free += self._sell_bill(b, i)
                self.B = []
            elif not on and self.dur_on:
                self.dur_on = False
                for l in self.L: free += self._sell_bond(l, i)
                self.L = []
        self.route(free, i)

    def _q_bill(self, b, i):
        v = self.bill_val(b, i, self.s / 2); g = v - b[2]
        return v - self.dibs_tax(b[3]) * max(g, 0), self.bill_val(b, i) - v

    def _q_bond(self, l, i):
        v = self.bond_val(l, i, self.ds / 2); g = v - l[3]
        return v - self.dibs_tax(l[4]) * max(g, 0), self.bond_val(l, i) - v

    def _sell_bill(self, b, i):
        p, c = self._q_bill(b, i); self.cost += c; return p

    def _sell_bond(self, l, i):
        p, c = self._q_bond(l, i); self.cost += c; return p

    def withdraw(self, x, i):
        """deliver x TL: sell bills (pro-rata), then bond, then break deposits (least accrued first)."""
        self.i = i
        if x <= 0: return 0.0
        out = 0.0
        for book, q in ((self.B, self._q_bill), (self.L, self._q_bond)):
            if out >= x - 1e-9 or not book: continue
            qq = [q(z, i) for z in book]; tot = sum(a for a, _ in qq)
            if tot <= 0: continue
            f = min(1.0, (x - out) / tot); self.cost += f * sum(c for _, c in qq)
            for z in book:
                z[0] *= (1 - f); z[2 if len(z) == 4 else 3] *= (1 - f)
            out += f * tot
            book[:] = [z for z in book if z[0] > 1e-6]
        if out < x - 1e-9 and self.D:
            self.D.sort(key=lambda d: d[1] / max(d[0], 1e-9))
            for d in self.D:
                need = x - out
                if need <= 1e-9: break
                f = min(1.0, need / d[0]) if d[0] > 0 else 1.0
                self.penalty += d[1] * f; take = d[0] * f
                d[0] -= take; d[1] -= d[1] * f; out += take
            self.D = [d for d in self.D if d[0] > 1e-6]
        return out


def run_standalone(idx, **kw):
    """value path of 1 TL in the book (no flows)."""
    prem = kw.pop("prem", 0.0)
    M = market(idx, prem); bk = CashBook(M, **kw); bk.i = 0; bk.deposit(1.0, 0, initial=True)
    v = np.empty(len(idx)); v[0] = bk.value()
    for i in range(1, len(idx)):
        bk.step(i); v[i] = bk.value()
    return pd.Series(v, idx), bk
