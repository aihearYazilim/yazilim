"""Equity-index option premium selling: synthetic BS pricing on VIX/VIX9D (+skew), daily MTM, margin.
All P&L expressed per unit of notional (underlying S0 * contracts); leverage applied later.
No look-ahead: entry uses close data of entry day; MTM uses each day's OHLC + vol index of that day."""
import pathlib, numpy as np, pandas as pd
from math import erf
_verf = np.vectorize(erf)
class norm:
    @staticmethod
    def cdf(x):
        x = np.asarray(x, dtype=float)
        # Abramowitz-Stegun-free: use erf via numpy-friendly approximation
        return 0.5 * (1 + _erf(x / np.sqrt(2)))
    @staticmethod
    def ppf(p):
        from statistics import NormalDist
        return NormalDist().inv_cdf(float(p))
def _erf(x):
    # W. J. Cody-quality approximation (max err ~1.2e-7), vectorised
    t = 1.0 / (1.0 + 0.5 * np.abs(x))
    y = 1 - t * np.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))))
    return np.where(x >= 0, y, -y)

D = pathlib.Path(__file__).parent / "data"
OOS0, OOS1 = "2025-10-17", "2026-10-16"
Q_DIV = {"SPX": 0.017, "NDX": 0.008}


def rd(sym):
    return pd.read_csv(D / f"{sym}.csv", index_col=0, parse_dates=True)


def load(und="SPX", proxy_k=1.10):
    """Daily frame: S OHLC, ATM vol index (30d) OHLC, 9-day vol (real or proxy), T-bill rate."""
    S = rd("GSPC" if und == "SPX" else "NDX")[["open", "high", "low", "close"]]
    v30 = rd("VIX" if und == "SPX" else "VXN")[["high", "close"]] / 100
    vix = rd("VIX")[["high", "close"]] / 100
    v9 = rd("VIX9D")["close"] / 100
    irx = rd("IRX")["close"] / 100
    df = S.join(v30.rename(columns={"high": "vh", "close": "v"}), how="inner")
    df = df.join(vix["close"].rename("vix"), how="left").join(v9.rename("v9raw"), how="left")
    df["r"] = irx.reindex(df.index).ffill().fillna(0.02)
    df = df.loc["1999-06-01":].copy()
    # VIX9D proxy (pre-2011 / NDX): ratio VIX9D/VIX regressed on log(VIX / its 63d mean), fit on IS 2011..2025-10-16
    x = np.log(df.vix / df.vix.rolling(63, min_periods=20).mean())
    y = np.log(df.v9raw / df.vix)
    m = (df.index < OOS0) & y.notna() & x.notna()
    b, a = np.polyfit(x[m], y[m], 1)
    ratio_hat = np.exp(a + b * x).fillna(np.exp(a))
    ratio = (df.v9raw / df.vix)
    df["v9real"] = ratio.notna()
    ratio = ratio.where(ratio.notna(), ratio_hat * proxy_k).clip(0.6, 1.8)
    df["ratio9"] = ratio
    df["v9"] = df.v * df.ratio9
    df["rv20"] = np.log(df.close).diff().rolling(20).std() * np.sqrt(252)
    df["vmed"] = df.v.rolling(252, min_periods=120).median()
    df["sma200"] = df.close.rolling(200).mean()
    return df


def bs(F, K, T, sig, r, isc):
    sig = np.maximum(sig, 1e-4); T = np.maximum(T, 1e-6)
    d1 = (np.log(F / K) + 0.5 * sig * sig * T) / (sig * np.sqrt(T)); d2 = d1 - sig * np.sqrt(T)
    df = np.exp(-r * T)
    c = df * (F * norm.cdf(d1) - K * norm.cdf(d2))
    p = df * (K * norm.cdf(-d2) - F * norm.cdf(-d1))
    return np.where(isc, c, p)


class Model:
    """IV(K) = atm * max(floor, 1 - s*z + c*z^2) with z = ln(K/F)/(atm sqrt T); atm = a * volindex."""

    def __init__(self, aM=0.92, aW=0.92, s=0.30, c=0.04, floor=0.75):
        self.aM, self.aW, self.s, self.c, self.floor = aM, aW, s, c, floor

    def atm(self, v30, v9, T):
        # interpolate tenors: <=9d use 9d index, >=30d use 30d index, linear in between
        w = np.clip((T * 365 - 9) / 21, 0, 1)
        a = self.aW + (self.aM - self.aW) * w
        return a * (w * v30 + (1 - w) * v9)

    def iv(self, K, F, T, atm):
        z = np.log(K / F) / (atm * np.sqrt(T))
        return atm * np.maximum(self.floor, 1 - self.s * z + self.c * z * z)

    def price(self, K, S, T, atm, r, q, isc):
        F = S * np.exp((r - q) * T)
        return bs(F, K, T, self.iv(K, F, T, atm), r, isc)

    def strike_for_delta(self, S, T, atm, r, q, delta, isc):
        """|delta| target (forward delta, e^-qT ignored)."""
        F = S * np.exp((r - q) * T)
        K = F
        for _ in range(40):
            sig = self.iv(K, F, T, atm)
            if isc:  # N(d1)=delta
                d1 = norm.ppf(delta)
            else:    # N(d1)-1 = -delta
                d1 = norm.ppf(1 - delta)
            K_new = F * np.exp(-d1 * sig * np.sqrt(T) + 0.5 * sig * sig * T)
            if abs(K_new - K) < 1e-6 * F: K = K_new; break
            K = 0.5 * K + 0.5 * K_new
        return K


def third_fridays(idx):
    out = []
    for (y, m), g in pd.Series(idx, index=idx).groupby([idx.year, idx.month]):
        tf = pd.Timestamp(y, m, 1) + pd.offsets.WeekOfMonth(week=2, weekday=4)
        c = g[g <= tf]
        if len(c): out.append(c.iloc[-1])
    return pd.DatetimeIndex(out)


def roll_dates(idx, tenor):
    if tenor == "W":
        s = pd.Series(idx, index=idx)
        return pd.DatetimeIndex(s.groupby(idx.to_period("W-FRI")).last().values)
    return third_fridays(idx)


def half_spread(prem, date, S):
    """index points per option. Modern (2012+) SPX: ~0.05-0.10 pts or 3% of premium.
    Pre-2012 (pre-penny/weekly liquidity): 0.10 pts or 5%. Scaled with index level to stay
    comparable (tick ~ fixed pts; we use max with level-scaled floor)."""
    modern = date >= pd.Timestamp("2012-01-01")
    floor = (0.05 if modern else 0.10) * max(1.0, S / 4000)
    pct = 0.03 if modern else 0.05
    return np.maximum(floor, pct * prem)


COMM = 0.013  # index points / option: ~$0.65 broker + ~$0.60 SPX exchange fee per contract (x100)


def regt_req(S, K, prem, isc):
    """Reg-T short index option margin per option (index pts)."""
    otm = np.where(isc, np.maximum(K - S, 0), np.maximum(S - K, 0))
    return prem + np.maximum(0.15 * S - otm, 0.10 * (np.where(isc, S, K)))


def build_trades(df, model, tenor, legs, und="SPX", cost=True):
    """legs: list of (isc, delta) short options, 1 unit each per 1 unit underlying notional (S0).
    Settlement at expiry-day close (SPXW PM-settled; monthly AM-SOQ approximated by close).
    Returns list of dicts with per-unit-notional (fraction of S0) arrays."""
    q = Q_DIV[und]
    rolls = roll_dates(df.index, tenor)
    rolls = rolls[rolls >= df.index[0] + pd.Timedelta(days=260)]
    idx = df.index
    A = {c: df[c].values for c in ["close", "low", "high", "v", "vh", "v9", "r", "ratio9", "vmed", "rv20", "sma200", "vix"]}
    pos = {d: i for i, d in enumerate(idx)}
    trades = []
    for d0, d1 in zip(rolls[:-1], rolls[1:]):
        i0, i1 = pos[d0], pos[d1]
        S0, r = A["close"][i0], A["r"][i0]
        T0 = (d1 - d0).days / 365
        atm0 = model.atm(A["v"][i0], A["v9"][i0], T0)
        prem, Ks, entry_cost = 0.0, [], 0.0
        qty = []
        for leg in legs:
            isc, dl = leg[0], leg[1]
            qn = leg[2] if len(leg) > 2 else 1.0
            if isinstance(dl, str):
                K = S0 * float(dl[1:])
            else:
                K = S0 if dl >= 0.5 else model.strike_for_delta(S0, T0, atm0, r, q, dl, isc)
            K = round(K / 5) * 5
            p = float(model.price(K, S0, T0, atm0, r, q, isc))
            Ks.append((isc, K)); prem += qn * p; qty.append(qn)
            if cost: entry_cost += abs(qn) * (float(half_spread(p, d0, S0)) + COMM)
        Karr = np.array([K for _, K in Ks]); Carr = np.array([isc for isc, _ in Ks]); Qarr = np.array(qty)
        n = i1 - i0
        mtm_c, mtm_w, req_w, req_pm = np.zeros(n), np.zeros(n), np.zeros(n), np.zeros(n)
        for j in range(1, n + 1):
            k = i0 + j
            T = (d1 - idx[k]).days / 365
            Tt = max(T, 0.5 / 365)
            if j == n:
                Sx = A["close"][k]
                v = float(np.sum(Qarr * np.where(Carr, np.maximum(Sx - Karr, 0), np.maximum(Karr - Sx, 0))))
                mtm_c[j-1] = mtm_w[j-1] = v
                lv = np.where(Carr, np.maximum(Sx - Karr, 0), np.maximum(Karr - Sx, 0)); atm = model.atm(A["v"][k], A["v"][k]*A["ratio9"][k], Tt)
            else:
                cands = []
                for Sx_, vol in ((A["close"][k], A["v"][k]), (A["low"][k], A["vh"][k]), (A["high"][k], A["v"][k])):
                    atm_ = model.atm(vol, vol * A["ratio9"][k], Tt)
                    lv_ = model.price(Karr, Sx_, Tt, atm_, A["r"][k], q, Carr)
                    cands.append((float((Qarr * lv_).sum()), Sx_, atm_, lv_))
                mtm_c[j-1] = cands[0][0]
                w = max(cands, key=lambda t: t[0])
                mtm_w[j-1] = w[0]; Sx, atm, lv = w[1], w[2], w[3]
            lv = np.where(Qarr > 0, lv, 0.0)  # Reg-T: long wings ignored (conservative)
            reqs = np.where(Qarr > 0, regt_req(Sx, Karr, lv, Carr), 0.0)
            im = int(np.argmax(reqs))
            req_w[j-1] = reqs[im] + lv.sum() - lv[im]
            pmv = 0.0
            for mv in (-0.08, -0.04, 0.0, 0.03, 0.06):
                a2 = atm * (1 + max(-mv, 0) * 3)
                pmv = max(pmv, float((Qarr * model.price(Karr, Sx * (1 + mv), Tt, a2, A["r"][k], q, Carr)).sum()))
            req_pm[j-1] = max(pmv - lv.sum(), 0.00375 * len(Ks) * Sx) + lv.sum()
        trades.append(dict(d0=d0, d1=d1, S0=S0, prem=prem / S0, cost=entry_cost / S0, payoff=mtm_c[-1] / S0,
                           mtm_c=mtm_c / S0, mtm_w=mtm_w / S0, req=req_w / S0, req_pm=req_pm / S0,
                           dates=idx[i0 + 1:i1 + 1], r=r, Ks=Ks, atm0=atm0, v0=A["v"][i0], v9=A["v9"][i0],
                           vix=A["vix"][i0], vmed=A["vmed"][i0], rv=A["rv20"][i0], sma=A["sma200"][i0],
                           ratio9=A["ratio9"][i0]))
    return trades


def simulate(trades, L, active, margin="regt", cash_spread=0.0, liq_extra=0.10, daily=False):
    """Compound equity over trades. active: bool array per trade (filter, decided at entry with entry-day data).
    Short options sized L x equity notional. Cash earns T-bill - cash_spread. Margin call -> liquidate at worst
    intraday mark (+liq_extra of option value). Returns trade-level equity + daily (worst & close) path."""
    E = 1.0
    eq, rows = [], []
    for t, act in zip(trades, active):
        dt_days = (t["d1"] - t["d0"]).days
        rc = max(t["r"] - cash_spread, 0) * dt_days / 365
        if not act:
            E *= 1 + rc
            eq.append(E)
            if daily:
                for d in t["dates"]: rows.append((d, E, E))
            continue
        base = E * (1 + L * (t["prem"] - t["cost"]))
        req = t["req"] if margin == "regt" else t["req_pm"]
        out = None
        n = len(t["dates"])
        for j in range(n):
            frac = (j + 1) / n
            cash_int = E * rc * frac
            ew = base - E * L * t["mtm_w"][j] + cash_int
            ec = base - E * L * t["mtm_c"][j] + cash_int
            if j < n - 1 and ew < E * L * req[j]:
                # margin call: liquidate at worst mark + extra spread
                out = base - E * L * t["mtm_w"][j] * (1 + liq_extra) + cash_int
                if daily: rows.append((t["dates"][j], max(out, 0), max(out, 0)))
                break
            if daily: rows.append((t["dates"][j], ew, ec))
        if out is None:
            out = base - E * L * t["payoff"] + E * rc
        E = max(out, 0.0)
        eq.append(E)
        if E <= 0:
            break
    s = pd.Series(eq, index=[t["d1"] for t in trades[:len(eq)]])
    dd = pd.DataFrame(rows, columns=["date", "worst", "close"]).set_index("date") if daily else None
    return s, dd


def monthly_geo(eq_daily_close, start, end):
    e = eq_daily_close.loc[start:end]
    if len(e) < 5: return np.nan
    # include starting value from previous point
    prev = eq_daily_close.loc[:start]
    e0 = prev.iloc[-2] if len(prev) > 1 and prev.index[-1] >= pd.Timestamp(start) else (prev.iloc[-1] if len(prev) else e.iloc[0])
    months = (pd.Timestamp(e.index[-1]) - pd.Timestamp(start)).days / 30.4375
    return (e.iloc[-1] / e0) ** (1 / months) - 1
