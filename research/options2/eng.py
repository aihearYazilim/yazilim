"""Generic short-vol portfolio engine on real Deribit data (daily morning chains, delivery prices, DVOL)
with hourly (Binance 1h high/low/close) mark-to-market, Deribit-like margin + partial liquidation,
optional long wings / longer-dated hedges and hourly perp delta-hedging.

Conventions
- Account: one USD(C) collateral account, BTC and ETH sleeves each 50% of equity; notional coins per active
  sleeve = size * 0.5 * Equity / S0.  Idle cash earns 0.
- Entry at 09:00 UTC on entry day (spot = Binance 1h open at 09:00), prices from that morning's chain smile
  (Deribit marks 08:05-10:00, log-moneyness).  Settlement at Deribit delivery price (08:00 UTC expiry day).
- Costs: half-spread max(h*mark, ticks*TICK*S0), fee min(0.03% S0, 12.5% mark), delivery fee 0.015% capped.
- Intraperiod revaluation: BS at hourly low/high/close with each leg's anchor IV * (1 + k*|ln S/S_anchor|).
- Margin STD: MM = sum_short N*(0.075*S) + short liability (longs give no margin relief but count in equity);
  IM(short) = max(0.15 - OTM/S, 0.10)*S + mark ; entry size is cut to fit IM <= equity (recorded).
  Margin PM: MM = worst loss over spot shocks +-12% BTC / +-14% ETH (5 pts) with vol*1.3 (incl. longs & perp);
  IM = 1.25*MM at entry.
- Liquidation: if equity < MM at a corner: partial (q kept) as in the audit (a5b): close (1-q) of every
  leg: shorts at 1.10x value + 0.19% notional, longs at 0.90x value.
"""
import pathlib, numpy as np, pandas as pd, datetime as dt
from fbs import bs, delta as bsdelta, strike_for_delta
D = pathlib.Path(__file__).parent
ROOT = D.parents[1]
OOS0 = "2025-10-17"; OOS1 = "2026-10-17"
TICK = 0.0001; FEE = 0.0003; DFEE = 0.00015
SHOCK = {"BTC": 0.12, "ETH": 0.14, "SOL": 0.18, "XRP": 0.18, "AVAX": 0.2}

# ---------------- data ----------------
_CACHE = {}
def data():
    if _CACHE: return _CACHE
    ch = pd.read_pickle(D / "raw" / "chains_daily.pkl")
    ch["day"] = ch["day"].astype(str)
    H = {c: pd.read_csv(ROOT / "data/crypto_1h" / f"{c}.csv", index_col=0, parse_dates=True) for c in ("BTC", "ETH")}
    deliv = {c: pd.read_csv(ROOT / "research/options/data" / f"deliv_{c.lower()}_usd.csv").set_index("date").delivery_price for c in ("BTC", "ETH")}
    dv = {}
    for c in ("BTC", "ETH"):
        x = pd.read_csv(ROOT / "research/options/data" / f"dvol_{c}.csv"); x.index = pd.to_datetime(x.date); dv[c] = x.close
    px = {c: pd.read_csv(ROOT / "data/crypto" / f"{c}.csv", index_col=0, parse_dates=True).close for c in ("BTC", "ETH")}
    fund = {}
    for c in ("BTC", "ETH"):
        f = pd.read_csv(D / "raw" / f"funding_{c}.csv"); f.index = pd.to_datetime(f.timestamp, unit="ms").dt.floor("h")
        fund[c] = f.interest_1h.groupby(level=0).last()
    import pickle
    smf = D / "raw" / "smiles.pkl"
    if smf.exists():
        SM, EXP = pickle.load(open(smf, "rb"))
        _CACHE.update(ch=ch, H=H, deliv=deliv, dv=dv, px=px, fund=fund, SM=SM, EXP=EXP); return _CACHE
    SM = {}
    for (cur, day, ex), g in ch.groupby(["cur", "day", "expiry"], observed=True, sort=False):
        o = g[((g.cp == "P") & (g.x <= 0.02)) | ((g.cp == "C") & (g.x >= -0.02))]
        if len(o) < 3: continue
        s = o.groupby("x").miv.median().sort_index()
        SM[(cur, day, ex)] = (s.index.values, s.values, float(np.median(g.b)), float(np.median(g["T"])))
    EXP = {}
    for (cur, day, ex) in SM: EXP.setdefault((cur, day), []).append(ex)
    for k in EXP: EXP[k].sort()
    pickle.dump((SM, EXP), open(smf, "wb"))
    _CACHE.update(ch=ch, H=H, deliv=deliv, dv=dv, px=px, fund=fund, SM=SM, EXP=EXP)
    return _CACHE

class Smile:
    def __init__(self, key):
        x, v, b, T = data()["SM"][key]
        self.x, self.v, self.b = x, v, b
    def iv(self, x):  # flat extrapolation
        return np.interp(x, self.x, self.v)
    def strike(self, F, T, d, isc, clamp=True):
        K = F
        for _ in range(30):
            K = float(strike_for_delta(F, T, float(self.iv(np.log(K / F))), d, isc))
        if clamp:   # never price outside quoted moneyness range (wings): use farthest quoted strike
            x = np.clip(np.log(K / F), self.x.min(), self.x.max()); K = F * np.exp(x)
        return K

# ---------------- features / filters ----------------
def dvol_feat(cur, day, look=365):
    dv = data()["dv"][cur]; d = pd.Timestamp(day) - pd.Timedelta(days=1)
    x = dv.loc[:d]
    return float(x.iloc[-1]), float(x.iloc[-look:].median())

def spot_at(cur, ts):
    H = data()["H"][cur]
    try: return float(H.at[ts, "open"])
    except KeyError:
        i = H.index.searchsorted(ts); return float(H.close.iloc[max(i - 1, 0)])

# ---------------- position helpers ----------------
def price_leg(cur, day, ex, K_or_delta, isc, t0, S0, by_delta=True):
    """returns dict(K, v, mark(USD per coin), T, ex) using the smile of (cur, day, ex)."""
    key = (cur, day, ex)
    if key not in data()["SM"]: return None
    sm = Smile(key)
    T = (pd.Timestamp(ex) - t0).total_seconds() / (365 * 86400)
    if T <= 0: return None
    F = S0 * np.exp(sm.b * T)
    K = sm.strike(F, T, K_or_delta, isc) if by_delta else K_or_delta
    v = float(sm.iv(np.log(K / F)))
    m = float(bs(F, K, T, v, isc))
    return dict(K=K, v=v, mark=m, T=T, ex=pd.Timestamp(ex), isc=isc, F=F, b=sm.b)

def trade_cost(mark, S0, h, ticks):
    return max(h * mark, ticks * TICK * S0) + min(FEE * S0, 0.125 * mark)

def settle_cash(qty, K, isc, S):
    """cash flow to holder of qty (signed) options at settlement price S, incl. delivery fee on ITM."""
    intr = max(S - K, 0) if isc else max(K - S, 0)
    if intr <= 0: return 0.0
    return qty * intr - abs(qty) * min(DFEE * S, 0.125 * intr)

# ---------------- simulator ----------------
class Sim:
    """schedule: list of (entry_day 'YYYY-MM-DD', end_ts) ; builder(cur, day, t0, S0) -> list of leg specs
    [(sign, ratio, leg_dict)] per coin of base notional, or [] if not active.  ratio scales notional."""
    def __init__(self, schedule, builder, size=2.0, k=2.0, margin="STD", h=0.05, ticks=1.0, hedge=None,
                 hedge_fee=0.0005, curs=("BTC", "ETH"), wing_h=None, wing_ticks=None, cap_im=True):
        self.schedule, self.builder, self.size, self.k, self.margin = schedule, builder, size, k, margin
        self.h, self.ticks, self.hedge, self.hedge_fee, self.curs = h, ticks, hedge, hedge_fee, curs
        self.wing_h = h if wing_h is None else wing_h; self.wing_ticks = ticks if wing_ticks is None else wing_ticks
        self.cap_im = cap_im

    def run(self):
        dd = data(); H = dd["H"]
        cash = 1.0; legs = []    # leg: dict(cur, q(signed coins), K, isc, ex, v, Sa)
        rows = []
        for day, t_end in self.schedule:
            t0 = pd.Timestamp(day) + pd.Timedelta(hours=9)
            # 1) settle expired legs (expiry <= t0)
            keep = []
            for L in legs:
                if L["ex"] <= t0:
                    S = float(dd["deliv"][L["cur"]].get(L["ex"].strftime("%Y-%m-%d"), np.nan))
                    if not np.isfinite(S): S = spot_at(L["cur"], L["ex"])
                    cash += settle_cash(L["q"], L["K"], L["isc"], S)
                else: keep.append(L)
            legs = keep
            S0 = {c: spot_at(c, t0) for c in self.curs}
            # 2) re-anchor continuing legs to today's smile; value them
            for L in legs:
                key = (L["cur"], day, L["ex"])
                T = (L["ex"] - t0).total_seconds() / (365 * 86400)
                if key in dd["SM"]:
                    sm = Smile(key); F = S0[L["cur"]] * np.exp(sm.b * T); L["v"] = float(sm.iv(np.log(L["K"] / F))); L["b"] = sm.b
                L["Sa"] = S0[L["cur"]]
            def val(Ls, Sd, t, k=0.0, volx=1.0):
                tot = 0.0
                for L in Ls:
                    S = Sd[L["cur"]]; tau = max((L["ex"] - t).total_seconds() / (365 * 86400), 1e-7)
                    v = L["v"] * (1 + k * abs(np.log(S / L["Sa"]))) * volx
                    tot += L["q"] * float(bs(S * np.exp(L["b"] * tau), L["K"], tau, v, L["isc"])) * np.exp(-L["b"] * tau)
                return tot
            E0 = cash + val(legs, S0, t0)
            # 3) open new legs
            new, im_cut = [], 1.0
            for c in self.curs:
                specs = self.builder(c, day, t0, S0[c])
                if not specs: continue
                Nb = self.size * max(E0, 0) / S0[c] / len(self.curs)
                for sign, ratio, lg in specs:
                    new.append(dict(cur=c, q=sign * ratio * Nb, K=lg["K"], isc=lg["isc"], ex=lg["ex"], v=lg["v"], Sa=S0[c],
                                    mark=lg["mark"] * S0[c] / lg["F"], long=sign > 0, b=lg["b"]))
            if new and self.cap_im:
                im = self.im(legs + new, S0, t0, val)
                if im > E0 > 0:
                    im_cut = E0 / im
                    for L in new: L["q"] *= im_cut
            for L in new:
                h, tk = (self.wing_h, self.wing_ticks) if L["long"] else (self.h, self.ticks)
                cost = abs(L["q"]) * trade_cost(L["mark"], L["Sa"], h, tk)
                cash += -L["q"] * L["mark"] - cost
            legs = legs + new
            # 4) hourly path
            hrs = pd.date_range(t0, t_end - pd.Timedelta(hours=1), freq="h")
            minE, nliq, hp = np.inf, 0, {c: 0.0 for c in self.curs}
            hcost = 0.0
            if not self.hedge:
                cash, minE, nliq = self.path_vec(legs, cash, hrs, S0)
                legs = [L for L in legs if L["q"] != 0]
                hrs = []
            for ts in hrs:
                tm = ts + pd.Timedelta(hours=1)
                live = [L for L in legs if L["ex"] > ts]
                if not live and not any(hp.values()): continue
                cands = []
                for corner in ("low", "high", "close"):
                    Sd = {}
                    for c in self.curs:
                        try: Sd[c] = float(H[c].at[ts, corner])
                        except KeyError: Sd[c] = S0[c]
                    V = val(live, Sd, tm, self.k)
                    Eq = cash + V + sum(hp[c] * (Sd[c] - hS[c]) for c in self.curs if hp[c]) if any(hp.values()) else cash + V
                    mm = self.mm(live, Sd, tm, val, hp)
                    cands.append((Eq - mm, Eq, mm, Sd))
                slack, Eq, mm, Sd = min(cands, key=lambda z: z[0])
                minE = min(minE, Eq)
                if slack < 0 and self.margin != "NONE":
                    nliq += 1
                    # partial liquidation (audit a5b logic)
                    shortL = sum(-L["q"] * float(bs(Sd[L["cur"]], L["K"], max((L["ex"] - tm).total_seconds() / 31536000, 1e-7),
                                 L["v"] * (1 + self.k * abs(np.log(Sd[L["cur"]] / L["Sa"]))), L["isc"])) for L in live if L["q"] < 0)
                    cfull = 0.10 * shortL + sum(0.0019 * abs(L["q"]) * Sd[L["cur"]] for L in live if L["q"] < 0)
                    q = max(0.0, (Eq - cfull) / (mm - cfull)) if mm > cfull else 0.0
                    q = min(q, 1.0) * 0.95
                    for L in live:
                        S = Sd[L["cur"]]; tau = max((L["ex"] - tm).total_seconds() / 31536000, 1e-7)
                        p = float(bs(S, L["K"], tau, L["v"] * (1 + self.k * abs(np.log(S / L["Sa"]))), L["isc"]))
                        dq = (1 - q) * L["q"]
                        if dq < 0: cash -= -dq * (1.10 * p) + 0.0019 * (-dq) * S   # buy back shorts
                        else: cash += dq * 0.90 * p                                    # sell longs
                        L["q"] *= q
                    for c in self.curs:
                        if hp[c]:
                            cash += hp[c] * (Sd[c] - hS[c]) - 0.0019 * abs(hp[c]) * Sd[c] * (1 - q); hp[c] *= q; hS[c] = Sd[c]
                    if q == 0: legs = [L for L in legs if L not in live]
                # delta hedge at close
                if self.hedge:
                    if ts == hrs[0]: hS = {c: S0[c] for c in self.curs}
                    for c in self.curs:
                        try: Sc = float(H[c].at[ts, "close"])
                        except KeyError: continue
                        cash += hp[c] * (Sc - hS[c]); hS[c] = Sc
                        fr = dd["fund"][c].get(tm, 0.0)
                        cash -= hp[c] * Sc * (fr if np.isfinite(fr) else 0.0)
                        lc = [L for L in legs if L["cur"] == c and L["ex"] > tm]
                        net = 0.0
                        for L in lc:
                            tau = max((L["ex"] - tm).total_seconds() / 31536000, 1e-7)
                            net += L["q"] * float(bsdelta(Sc, L["K"], tau, L["v"] * (1 + self.k * abs(np.log(Sc / L["Sa"]))), L["isc"]))
                        tgt = -net
                        Nb = sum(abs(L["q"]) for L in lc if L["q"] < 0) / 2 or 1e-12
                        if abs(tgt - hp[c]) > self.hedge * Nb or (not lc and hp[c]):
                            if not lc: tgt = 0.0
                            cost = self.hedge_fee * abs(tgt - hp[c]) * Sc
                            cash -= cost; hcost += cost; hp[c] = tgt
                elif ts == hrs[0]:
                    hS = {c: S0[c] for c in self.curs}
            # close any perp hedge at period end (at last close)
            for c in self.curs:
                if hp[c]:
                    cash -= self.hedge_fee * abs(hp[c]) * hS[c]; hp[c] = 0.0
            # value at period end (next entry time) for reporting
            t1 = t_end
            for L in [L for L in legs if L["ex"] <= t1]:
                S = float(dd["deliv"][L["cur"]].get(L["ex"].strftime("%Y-%m-%d"), np.nan))
                if not np.isfinite(S): S = spot_at(L["cur"], L["ex"])
                cash += settle_cash(L["q"], L["K"], L["isc"], S)
            legs = [L for L in legs if L["ex"] > t1]
            S1 = {c: spot_at(c, t1) for c in self.curs}
            E1 = cash + val(legs, S1, t1)
            rows.append(dict(day=day, end=t1, E0=E0, E1=E1, minE=min(minE, E1), nliq=nliq, active=len(new) > 0,
                             im_cut=im_cut, hcost=hcost))
            if E1 <= 1e-6:
                cash = 0.0; legs = []
        out = pd.DataFrame(rows).set_index("day")
        out["Enext"] = out.E0.shift(-1).fillna(out.E1.iloc[-1])
        return out

    def path_vec(self, legs, cash, hrs, S0):
        dd = data(); n = len(hrs)
        if n == 0 or not legs: return cash, np.inf, 0
        tm = (hrs + pd.Timedelta(hours=1)).values
        SC = {}
        for c in self.curs:
            x = dd["H"][c].reindex(hrs)[["low", "high", "close"]].ffill().bfill()
            SC[c] = x.fillna(S0[c]).values if len(x.dropna()) else np.full((n, 3), S0[c])
        hv = hrs.values
        def prices(L, shock=0.0, volx=1.0):
            S = SC[L["cur"]] * (1 + shock)
            tau = np.maximum((np.datetime64(L["ex"]) - tm) / np.timedelta64(1, "s") / 31536000, 1e-7)[:, None]
            v = L["v"] * (1 + self.k * np.abs(np.log(S / L["Sa"]))) * volx
            P = bs(S * np.exp(L["b"] * tau), L["K"], tau, v, L["isc"]) * np.exp(-L["b"] * tau)
            dead = (hv >= np.datetime64(L["ex"]))
            if dead.any():
                Sx = float(dd["deliv"][L["cur"]].get(L["ex"].strftime("%Y-%m-%d"), np.nan))
                if not np.isfinite(Sx): Sx = S0[L["cur"]]
                P[dead] = settle_cash(1.0, L["K"], L["isc"], Sx) if L["q"] > 0 else -settle_cash(-1.0, L["K"], L["isc"], Sx)
            return P, dead
        start, minE, nliq = 0, np.inf, 0
        while start < n:
            act = [L for L in legs if L["q"] != 0]
            if not act: break
            PP = {id(L): prices(L) for L in act}
            V = sum(L["q"] * PP[id(L)][0] for L in act)
            if self.margin == "STD":
                MM = sum(np.where(PP[id(L)][1][:, None], 0.0, -L["q"] * (0.075 * SC[L["cur"]] + PP[id(L)][0])) for L in act if L["q"] < 0)
                MM = MM if not np.isscalar(MM) else np.zeros((n, 3))
            elif self.margin == "PM":
                MM = np.zeros((n, 3))
                for c in self.curs:
                    Lc = [L for L in act if L["cur"] == c]
                    if not Lc: continue
                    base = sum(L["q"] * PP[id(L)][0] for L in Lc); sh = SHOCK[c]; worst = np.zeros((n, 3))
                    for s_ in (-sh, -sh / 2, 0, sh / 2, sh):
                        vs = sum(L["q"] * prices(L, s_, 1.3)[0] for L in Lc)
                        worst = np.maximum(worst, base - vs)
                    MM += worst
            else:
                MM = np.full((n, 3), -np.inf)
            Eq = cash + V; slack = Eq - MM
            cb = np.argmin(slack, axis=1); r = np.arange(n)
            sl = slack[r, cb]; eqh = Eq[r, cb]
            br = np.where(sl[start:] < 0)[0]
            hb = start + br[0] if (len(br) and self.margin != "NONE") else n
            minE = min(minE, float(Eq[start:hb + 1 if hb < n else n].min()))
            if hb >= n: break
            nliq += 1; c_ = cb[hb]; eq_ = eqh[hb]; mm_ = MM[hb, c_]
            shortL = sum(-L["q"] * PP[id(L)][0][hb, c_] for L in act if L["q"] < 0)
            cfull = 0.10 * shortL + sum(0.0019 * -L["q"] * SC[L["cur"]][hb, c_] for L in act if L["q"] < 0)
            q = max(0.0, (eq_ - cfull) / (mm_ - cfull)) if mm_ > cfull else 0.0
            q = min(q, 1.0) * 0.95
            for L in act:
                if PP[id(L)][1][hb]: continue
                p = PP[id(L)][0][hb, c_]; S = SC[L["cur"]][hb, c_]; dq = (1 - q) * L["q"]
                if dq < 0: cash -= -dq * 1.10 * p + 0.0019 * (-dq) * S
                else: cash += dq * 0.90 * p
                L["q"] *= q
            start = hb + 1
        return cash, minE, nliq

    def im(self, Ls, Sd, t, val):
        if self.margin == "PM": return 1.25 * self.mm(Ls, Sd, t, val, {})
        tot = 0.0
        for L in Ls:
            if L["q"] < 0:
                S = Sd[L["cur"]]; otm = max((S - L["K"]) if not L["isc"] else (L["K"] - S), 0) / S
                tot += -L["q"] * (max(0.15 - otm, 0.10) * S + L["mark"])
        return tot

    def mm(self, Ls, Sd, t, val, hp):
        if self.margin == "NONE": return -np.inf
        if self.margin == "STD":
            tot = 0.0
            for L in Ls:
                if L["q"] < 0:
                    S = Sd[L["cur"]]; tau = max((L["ex"] - t).total_seconds() / 31536000, 1e-7)
                    p = float(bs(S, L["K"], tau, L["v"] * (1 + self.k * abs(np.log(S / L["Sa"]))), L["isc"]))
                    tot += -L["q"] * (0.075 * S + p)
            tot += sum(0.01 * abs(hp.get(c, 0)) * Sd[c] for c in Sd)
            return tot
        # PM: per currency worst loss over shocks, vol*1.3
        tot = 0.0
        for c in Sd:
            Lc = [L for L in Ls if L["cur"] == c]
            if not Lc and not hp.get(c): continue
            base = val(Lc, Sd, t, self.k)
            sh = SHOCK[c]; worst = 0.0
            for s in (-sh, -sh / 2, 0, sh / 2, sh):
                Sx = dict(Sd); Sx[c] = Sd[c] * (1 + s)
                loss = base - val(Lc, Sx, t, self.k, 1.3) - hp.get(c, 0) * Sd[c] * s
                worst = max(worst, loss)
            tot += worst
        return tot

# ---------------- stats ----------------
def stats(r, lo, hi, fx=None):
    """r: DataFrame from Sim.run (index day, E0, E1, minE, end)."""
    x = r[(r.index >= lo) & (r.index < hi)]
    if len(x) < 2: return {}
    eq = x.Enext / x.E0.iloc[0]
    days = (pd.Timestamp(x.end.iloc[-1]) - pd.Timestamp(x.index[0]) - pd.Timedelta(hours=9)).days
    fin = float(eq.iloc[-1])
    geo = fin ** (30.44 / days) - 1 if fin > 0 else -1.0
    pk = np.maximum.accumulate(np.r_[1.0, eq.values[:-1]])
    pk2 = np.maximum.accumulate(np.r_[1.0, eq.values])[1:]
    dd_close = float((eq.values / pk2 - 1).min())
    mtm = (x.minE / x.E0.iloc[0]).values
    dd_mtm = float(np.minimum(mtm / pk - 1, eq.values / pk2 - 1).min())
    pr = (x.Enext / x.E0).where(x.E0 > 0, 0) - 1
    wk = (1 + pr).groupby(pd.to_datetime(x.index).to_period("W-THU")).prod() - 1
    mo = (1 + pr).groupby(pd.to_datetime(x.end).dt.to_period("M")).prod() - 1
    out = dict(geo=geo, dd=dd_close, dd_mtm=dd_mtm, worst_wk=float(wk.min()), worst_m=float(mo.min()),
               liq=int((x.nliq > 0).sum()), act=int(x.active.sum()), n=len(x), imcut=int((x.im_cut < 0.999).sum()))
    if fx is not None:
        f0 = float(fx.asof(pd.Timestamp(x.index[0]))); f1 = float(fx.asof(pd.Timestamp(x.end.iloc[-1])))
        out["geo_try"] = (fin * f1 / f0) ** (30.44 / days) - 1 if fin > 0 else -1.0
    return out

def fx():
    return pd.read_csv(ROOT / "data/bist/USDTRY.csv", index_col=0, parse_dates=True).close

# ---------------- schedules ----------------
def sched_weekly(start="2021-04-02", end="2026-10-16", step=7, expiry_days=7):
    d = pd.Timestamp(start); out = []
    while d + pd.Timedelta(days=expiry_days) <= pd.Timestamp(end) + pd.Timedelta(days=0):
        out.append((d.strftime("%Y-%m-%d"), d + pd.Timedelta(days=step, hours=9)))
        d += pd.Timedelta(days=step)
    return out

def sched_daily(start="2021-04-01", end="2026-10-16"):
    d = pd.Timestamp(start); out = []
    while d < pd.Timestamp(end):
        out.append((d.strftime("%Y-%m-%d"), d + pd.Timedelta(days=1, hours=9))); d += pd.Timedelta(days=1)
    return out
