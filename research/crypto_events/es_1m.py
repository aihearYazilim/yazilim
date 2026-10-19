"""Minute-level event study: entry at open of the minute starting >= ts + lag minutes (lag=1,2,5,15,60).
Return to close at entry + h minutes. Shows how much of the move is gone by the time a bot / human can trade."""
import pandas as pd, numpy as np, pathlib
H = pathlib.Path(__file__).parent
E = pd.read_csv(H / "cms_events.csv", parse_dates=["ts"])
def k(sym, ts):
    fs = [H / f"raw/k1m/{sym}_{(ts.normalize()+pd.Timedelta(days=i)).strftime('%Y-%m-%d')}.csv" for i in (0, 1)]
    ds = [pd.read_csv(f) for f in fs if f.exists()]
    if not ds: return None
    x = pd.concat(ds); x["ts"] = x.ts.where(x.ts < 1e14, x.ts // 1000)
    x.index = pd.to_datetime(x.ts, unit="ms"); return x[~x.index.duplicated()].sort_index()
LAGS = [0, 1, 2, 5, 15, 60]; HS = [5, 30, 60, 240, 1440]
rows = []
for _, e in E.iterrows():
    x = k(e.sym, e.ts)
    if x is None or len(x) == 0: continue
    base = e.ts.floor("min")
    if base not in x.index: continue
    pre = x.open[base]
    r = dict(type=e.type, sym=e.sym, ts=e.ts, oos=e.ts >= pd.Timestamp("2025-10-17"))
    for L in LAGS:
        t0 = base + pd.Timedelta(minutes=L + 1)   # first minute fully after announcement minute + lag
        if t0 not in x.index: continue
        p0 = x.open[t0]
        r[f"m{L}"] = p0 / pre - 1   # move already happened before entry
        for h in HS:
            t1 = t0 + pd.Timedelta(minutes=h - 1)
            if t1 in x.index: r[f"L{L}_{h}"] = x.close[t1] / p0 - 1
    rows.append(r)
R = pd.DataFrame(rows); R.to_csv(H / "es_1m.csv", index=False)
pd.set_option("display.width", 250)
cols = [f"m{L}" for L in LAGS]
print("move already done before entry (mean %), by lag (minutes after announcement minute)")
print((R.groupby(["type", "oos"])[cols].mean() * 100).round(1).to_string())
for L in [0, 1, 5]:
    print(f"== lag {L}: mean % return after entry (horizon minutes); count")
    print((R.groupby(["type", "oos"])[[f"L{L}_{h}" for h in HS]].mean() * 100).round(2).join(R.groupby(["type", "oos"]).size().rename("n")).to_string())
