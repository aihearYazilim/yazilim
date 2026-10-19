"""Per-entry unit (1x) strangle returns under audit variants."""
from common import R
import numpy as np, pandas as pd
from bs import bs_price, bs_delta
TICK, FEE, DFEE = 0.0001, 0.0003, 0.00015
ch = R.ch

def cost_leg(mark, S0, S, K, isc, half):
    fee = min(FEE * S0, 0.125 * mark)
    intr = max(S - K, 0) if isc else max(K - S, 0)
    dfee = min(DFEE * S, 0.125 * intr) if intr > 0 else 0.0
    return mark - half - fee - intr - dfee

def interp_strangle(e, d=.3, h=0.05, volpts=0.0):
    """original model (continuous strike, interpolated smile); volpts>0 -> sell at IV - volpts (no % spread)."""
    S, S0, F, T = e["S"], e["S0"], e["F"], e["T"]
    tot = 0
    for isc, dl in ((False, -d), (True, d)):
        K = e["sm"].strike(dl, isc); v = float(e["sm"].iv(K))
        mark = float(bs_price(F, K, T, v, isc)) * S0 / F
        if volpts:
            bid = float(bs_price(F, K, T, max(v - volpts, 0.01), isc)) * S0 / F
            half = max(mark - bid, TICK * S0)
        else:
            half = max(h * mark, TICK * S0)
        tot += cost_leg(mark, S0, S, K, isc, half)
    return tot / S0

_G = {k: g for k, g in ch.groupby(["cur", "day", "expiry"])}
def listed_strangle(e, d=.3, h=0.05, volpts=0.0, tick_round=True):
    """nearest LISTED strike (that has a mark in the snapshot) by its own mark-IV delta; premium = its actual coin mark."""
    g = _G.get((e["cur"], e["day"], e["expiry"]))
    S, S0, F, T = e["S"], e["S0"], e["F"], e["T"]
    tot, info = 0, []
    for isc, dl in ((False, -d), (True, d)):
        x = g[g.cp == ("C" if isc else "P")]
        x = x[(x.strike > F) if isc else (x.strike < F)]
        if len(x) == 0: return np.nan, None
        dd = bs_delta(F, x.strike.values, T, x.miv.values, isc)
        i = int(np.argmin(np.abs(dd - dl))); row = x.iloc[i]
        if abs(dd[i] - dl) > 0.12: return np.nan, None   # no usable listed strike near target
        K = row.strike; coin = row.mark_price
        mark = coin * S0
        if volpts:
            bidc = float(bs_price(F, K, T, max(row.miv - volpts, 0.01), isc)) / F
            half = max((coin - bidc) * S0, TICK * S0)
        else:
            half = max(h * mark, TICK * S0)
        tot += cost_leg(mark, S0, S, K, isc, half)
        info.append((K, float(dd[i]), row.miv))
    return tot / S0, info

def series_from(unit, size=2, filt=True, lo="2021-04-01", hi="2026-10-17"):
    """unit: DataFrame day,expiry,cur,r,on -> weekly 50/50 portfolio returns (same aggregation as final.py)."""
    r = np.where(unit.on if filt else True, unit.r * size, 0.0)
    y = pd.DataFrame({"day": unit.day, "expiry": unit.expiry, "r": r}).dropna()
    s = y.groupby("day").agg(expiry=("expiry", "first"), r=("r", "mean")); s["r"] = s.r.clip(lower=-1)
    return s[(s.index >= lo) & (s.index < hi)]

def stats(s):
    if len(s) < 3: return {}
    eq = (1 + s.r).cumprod()
    days = (pd.Timestamp(s.expiry.iloc[-1]) - pd.Timestamp(s.index[0])).days
    geo = eq.iloc[-1] ** (30.44 / days) - 1 if eq.iloc[-1] > 0 else -1
    dd = (eq / eq.cummax().clip(lower=1) - 1).min()
    m = (1 + s.r).groupby(pd.to_datetime(s.expiry).dt.to_period("M")).prod() - 1
    return dict(geo=geo, dd=dd, worst_m=m.min(), worst_wk=s.r.min(), n_act=int((s.r != 0).sum()), n=len(s))

def build_unit(fn, **kw):
    rows = []
    for e in R.ENT["W"]:
        if not np.isfinite(e["S"]): continue
        f = R.FEAT[(e["cur"], e["day"])]
        r = fn(e, **kw); r = r[0] if isinstance(r, tuple) else r
        rows.append(dict(day=e["day"], expiry=e["expiry"], cur=e["cur"], r=r, on=f["dvol"] > f["dvmed"]))
    return pd.DataFrame(rows)
