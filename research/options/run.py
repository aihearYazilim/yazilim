import itertools, pickle, pathlib, sys, numpy as np, pandas as pd, datetime as dt
from bt import *
from bs import bs_delta

ch, deliv, dv, px, hpx = load()
ENT = {t: build_entries(ch, t) for t in ("W", "M")}

def feats(cur, day):
    d = pd.Timestamp(day) - pd.Timedelta(days=1)
    p = px[cur].loc[:d]; dvs = dv[cur]; dvs.index = pd.to_datetime(dvs.index); dvv = dvs.loc[:d]
    rv30 = np.log(p).diff().iloc[-30:].std() * np.sqrt(365) * 100
    return dict(dvol=dvv.iloc[-1], dvmed=dvv.iloc[-365:].median(), up=p.iloc[-1] > p.iloc[-50:].mean(),
                up200=p.iloc[-1] > p.iloc[-200:].mean(), rv30=rv30)

FEAT = {}
for t in ENT:
    for e in ENT[t]:
        k = (e["cur"], e["day"])
        if k not in FEAT: FEAT[k] = feats(*k)
        e["S"] = float(deliv[e["cur"]].get(e["expiry"], np.nan))

def passes(f, filt):
    if filt == "none": return True
    if filt == "dvhi": return f["dvol"] > f["dvmed"]
    if filt == "up": return f["up"]
    if filt == "vrp": return f["dvol"] > f["rv30"]
    if filt == "up_vrp": return f["up"] and f["dvol"] > f["rv30"]
    if filt == "up200": return f["up200"]

def hedge_pnl(e, K, v, n_side=1.0):
    """P&L (USD per 1 straddle) of holding +delta(straddle) units hedge, rebalanced every 8h? -> daily at 08:00."""
    cur = e["cur"]; t0 = pd.Timestamp(e["day"]) + pd.Timedelta(hours=8); t1 = pd.Timestamp(e["expiry"]) + pd.Timedelta(hours=8)
    s = hpx[cur].loc[t0:t1]; s = s[s.index.hour == 8]
    if len(s) < 2: return np.nan
    pnl, hprev = 0.0, 0.0
    S = s.values
    for i in range(len(S) - 1):
        T = max((t1 - s.index[i]).total_seconds() / (365 * 86400), 1e-6)
        dlt = float(bs_delta(S[i], K, T, v, True) + bs_delta(S[i], K, T, v, False))
        hpos = dlt  # short straddle delta = -dlt; hedge +dlt
        pnl -= PERP_FEE * abs(hpos - hprev) * S[i]
        pnl += hpos * (S[i + 1] - S[i]); hprev = hpos
    pnl -= PERP_FEE * abs(hprev) * S[-1]
    return pnl

def trade_ret(e, strat, d, size, h, skew):
    S, F = e["S"], e["F"]; S0 = e["S0"]
    if not np.isfinite(S): return np.nan
    if strat == "csp":
        K = e["sm"].strike(-d, False); s, _, _, _ = leg(e, K, False, S, h, skew); return size * s / K
    if strat == "strangle":
        Kp = e["sm"].strike(-d, False); Kc = e["sm"].strike(d, True)
        return size * (leg(e, Kp, False, S, h, skew)[0] + leg(e, Kc, True, S, h, skew)[0]) / S0
    if strat == "cc":
        Kc = e["sm"].strike(d, True); return (S - e["S0"]) / e["S0"] + leg(e, Kc, True, S, h, skew)[0] / e["S0"]
    if strat in ("pspread", "condor"):
        sides = [False] if strat == "pspread" else [False, True]
        pnl, credit, width = 0.0, 0.0, 0.0
        for isc in sides:
            K1 = e["sm"].strike(d if isc else -d, isc); K2 = e["sm"].strike((d if isc else -d) / 3, isc)
            s1, _, m1, _ = leg(e, K1, isc, F if not isc else F, h, skew)  # payoff-free for credit calc (S=F gives intr=0 when OTM)
            _, b2, m2, _ = leg(e, K2, isc, F, h, skew)
            credit += s1 + b2 if (K1 < F if not isc else K1 > F) else np.nan
            ps1 = leg(e, K1, isc, S, h, skew)[0]; pb2 = leg(e, K2, isc, S, h, skew)[1]
            pnl += ps1 + pb2; width = max(width, abs(K1 - K2))
        ml = width - credit
        if not np.isfinite(credit) or credit <= 0 or ml <= 0: return 0.0
        return size * pnl / ml
    if strat == "dhs":  # delta-hedged short ATM straddle, size = notional leverage
        K = F; v = float(e["sm"].iv(K))
        p = leg(e, K, False, S, h, skew)[0] + leg(e, K, True, S, h, skew)[0]
        hp = hedge_pnl(e, K, v)
        return size * (p + hp) / S0

def series(tenor, cur, strat, d, size, filt, h=0.05, skew=0.0):
    rows = []
    for e in ENT[tenor]:
        if cur != "BOTH" and e["cur"] != cur: continue
        f = FEAT[(e["cur"], e["day"])]
        r = trade_ret(e, strat, d, size, h, skew) if passes(f, filt) else 0.0
        rows.append((e["day"], e["expiry"], e["cur"], r))
    df = pd.DataFrame(rows, columns=["day", "expiry", "cur", "r"]).dropna()
    s = df.groupby("day").agg(expiry=("expiry", "first"), r=("r", "mean"))  # BOTH -> 50/50
    s["r"] = s.r.clip(lower=-1.0)
    return s

def monthly(s):
    m = (1 + s.r).groupby(pd.to_datetime(s.expiry).dt.to_period("M")).prod() - 1
    return m

def stat(s, a, b):
    x = s[(s.index >= a) & (s.index < b)]
    if len(x) < 3: return {}
    eq = (1 + x.r).cumprod()
    days = (pd.Timestamp(x.expiry.iloc[-1]) - pd.Timestamp(x.index[0])).days
    geo = eq.iloc[-1] ** (30.44 / max(days, 1)) - 1 if eq.iloc[-1] > 0 else -1
    dd = (eq / eq.cummax().clip(lower=1) - 1).min()
    m = monthly(x)
    return dict(geo=geo, dd=dd, worst_m=m.min(), worst_t=x.r.min(), n=int((x.r != 0).sum()), months=len(m))
