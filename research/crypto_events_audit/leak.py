"""Audit: pre-announcement drift (60m/15m before release) and move from release to the repo's entry (next hourly open), 1m data."""
import sys; sys.path.insert(0, "/home/user/yazilim/research/crypto_events_audit"); sys.path.insert(0, "/home/user/yazilim/research/crypto_events")
import pandas as pd, numpy as np, exec1m as X, trades as T
pd.set_option("display.width", 250)
BTC = None
rows = []
for _, e in T.CE[T.CE.type.isin(["MON", "DEL", "LIST"])].iterrows():
    k = X.k1m(e.sym, e.ts)
    if k is None: continue
    b = e.ts.floor("min")
    g = lambda t: k.open.get(t, np.nan)
    r = dict(type=e.type, sym=e.sym, ts=e.ts, oos=e.ts >= pd.Timestamp("2025-10-17"),
             pre60=g(b) / g(b - pd.Timedelta(minutes=60)) - 1, pre15=g(b) / g(b - pd.Timedelta(minutes=15)) - 1,
             to5=g(b + pd.Timedelta(minutes=6)) / g(b) - 1, to_entry=g(e.ts.ceil("h")) / g(b) - 1,
             mins_to_entry=(e.ts.ceil("h") - e.ts) / pd.Timedelta(minutes=1))
    w = k[(k.index >= b + pd.Timedelta(minutes=1)) & (k.index < b + pd.Timedelta(minutes=6))]
    r["rng5"] = (w.high.max() - w.low.min()) / g(b) if len(w) else np.nan
    rows.append(r)
R = pd.DataFrame(rows)
print((R.groupby(["type", "oos"])[["pre60", "pre15", "to5", "to_entry", "rng5"]].agg(["mean", "median"]) * 100).round(2).to_string())
print(R.groupby("type").mins_to_entry.describe().round(1))
print("pre60 < -5%:", (R.pre60 < -0.05).groupby(R.type).mean().round(2).to_dict())
