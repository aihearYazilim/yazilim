"""Robustness of the DVOL-regime filter + leverage curve, weekly CSP / strangle. Also per-year breakdown."""
import sys, pickle, numpy as np, pandas as pd
from run import *
H = float(sys.argv[1]) if len(sys.argv) > 1 else 0.05
SK = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
dvd = {c: dv[c].copy() for c in dv}
for c in dvd: dvd[c].index = pd.to_datetime(dvd[c].index)
def dvq(cur, day, look, q):
    d = pd.Timestamp(day) - pd.Timedelta(days=1); x = dvd[cur].loc[:d]
    return x.iloc[-1] > x.iloc[-look:].quantile(q)
FL = [(l, q) for l in (180, 365, 730) for q in (0.4, 0.5, 0.6)]
rows = []
for strat, ds in [("csp", [.2, .3, .4]), ("strangle", [.2, .3, .4])]:
    for d in ds:
        for e in ENT["W"]:
            r = trade_ret(e, strat, d, 1.0, H, SK)
            rows.append(dict(strat=strat, delta=d, day=e["day"], expiry=e["expiry"], cur=e["cur"], r=r,
                             **{f"q{l}_{q}": dvq(e["cur"], e["day"], l, q) for l, q in FL}))
U = pd.DataFrame(rows); U.to_pickle(f"data/ext_unit_h{H}_sk{SK}.pkl")
res = []
for (strat, d), g in U.groupby(["strat", "delta"]):
    for l, q in FL + [(0, 0)]:
        col = f"q{l}_{q}"
        for sz in (1, 2, 3, 4, 5, 6):
            for cur in ("BTC", "ETH", "BOTH"):
                x = g if cur == "BOTH" else g[g.cur == cur]
                on = x[col] if l else True
                y = pd.DataFrame({"day": x.day, "expiry": x.expiry, "r": np.where(on, x.r * sz, 0.0)}).dropna()
                s = y.groupby("day").agg(expiry=("expiry", "first"), r=("r", "mean")); s["r"] = s.r.clip(lower=-1)
                a = stat(s, "2021-04-01", OOS0); b = stat(s, OOS0, "2026-10-17")
                res.append(dict(strat=strat, delta=d, look=l, q=q, size=sz, cur=cur, **{"is_" + k: v for k, v in a.items()}, **{"oos_" + k: v for k, v in b.items()}))
R = pd.DataFrame(res); R.to_csv(f"ext_h{H}_sk{SK}.csv", index=False); print(len(R), "combos")
