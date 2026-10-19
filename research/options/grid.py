"""Full grid: unit-size trade returns cached per (tenor, strat, delta), then filters x size x currency."""
import itertools, pickle, sys, numpy as np, pandas as pd
from run import *
H = float(sys.argv[1]) if len(sys.argv) > 1 else 0.05
SKEW = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
TAG = f"h{H}_sk{SKEW}"
STRATS = {"csp": ([.05, .10, .15, .20, .25, .30], [1, 2, 3]),
          "strangle": ([.05, .10, .15, .20, .25, .30], [0.5, 1, 2]),
          "cc": ([.05, .10, .15, .20, .25, .30], [1]),
          "pspread": ([.10, .15, .20, .25, .30], [0.1, 0.2, 0.3]),
          "condor": ([.10, .15, .20, .25, .30], [0.1, 0.2, 0.3]),
          "dhs": ([.5], [0.5, 1, 2])}
FILTS = ["none", "dvhi", "up", "vrp", "up_vrp", "up200"]
unit = {}
for t in ("W", "M"):
    for strat, (ds, _) in STRATS.items():
        for d in ds:
            rows = []
            for e in ENT[t]:
                r = trade_ret(e, strat, d, 1.0, H, SKEW)
                f = FEAT[(e["cur"], e["day"])]
                rows.append(dict(day=e["day"], expiry=e["expiry"], cur=e["cur"], r=r, **{k: passes(f, k) for k in FILTS}))
            unit[(t, strat, d)] = pd.DataFrame(rows)
print("unit done", flush=True)
res, ser = [], {}
for (t, strat, d), df in unit.items():
    for sz in STRATS[strat][1]:
        for filt in FILTS:
            for cur in ("BTC", "ETH", "BOTH"):
                x = df if cur == "BOTH" else df[df.cur == cur]
                r = np.where(x[filt], x.r * (1 if strat == "cc" else sz), 0.0)
                y = pd.DataFrame({"day": x.day, "expiry": x.expiry, "r": r}).dropna()
                s = y.groupby("day").agg(expiry=("expiry", "first"), r=("r", "mean"))
                s["r"] = s.r.clip(lower=-1)
                key = (t, strat, d, sz, filt, cur); ser[key] = s
                a = stat(s, "2021-04-01", OOS0); b = stat(s, OOS0, "2026-10-17")
                res.append(dict(tenor=t, strat=strat, delta=d, size=sz, filt=filt, cur=cur,
                                **{"is_" + k: v for k, v in a.items()}, **{"oos_" + k: v for k, v in b.items()}))
R = pd.DataFrame(res); R.to_csv(f"results_{TAG}.csv", index=False)
pickle.dump(ser, open(f"data/series_{TAG}.pkl", "wb"))
print(len(R), "combos")
pd.set_option("display.width", 250); pd.set_option("display.max_columns", 30)
cols = ["tenor", "strat", "delta", "size", "filt", "cur", "is_geo", "is_dd", "is_worst_m", "oos_geo", "oos_dd", "oos_worst_m", "oos_n"]
print(R.sort_values("is_geo", ascending=False)[cols].head(30).round(4).to_string())
print(R.sort_values("is_geo", ascending=False).groupby("strat").head(3)[cols].round(4).to_string())
