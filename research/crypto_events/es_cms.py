"""Event study for Binance CMS events (hourly). Entry = open of first 1h bar starting at/after announcement.
Returns (raw and BTC-beta-1 adjusted) to close of bar at entry+h. Funding ignored here (handled in sim)."""
import pandas as pd, numpy as np, pathlib
H = pathlib.Path(__file__).parent
E = pd.read_csv(H / "cms_events.csv", parse_dates=["ts"])
def load(s):
    k = pd.read_csv(H / f"raw/k1h/{s}.csv"); k["ts"] = k.ts.where(k.ts < 1e14, k.ts // 1000)
    k.index = pd.to_datetime(k.ts, unit="ms"); return k[~k.index.duplicated()]
BTC = load("BTCUSDT")
HZ = [1, 4, 12, 24, 72, 168, 336, 720]
rows = []
for _, e in E.iterrows():
    try: k = load(e.sym)
    except FileNotFoundError: continue
    t0 = e.ts.ceil("h")
    if t0 not in k.index: continue
    i0 = k.index.get_loc(t0); p0 = k.open.iloc[i0]
    b0 = BTC.open.get(t0, np.nan)
    pre = k.open.iloc[i0] / k.open.iloc[max(0, i0 - 24)] - 1
    r = dict(type=e.type, sym=e.sym, ts=e.ts, oos=e.ts >= pd.Timestamp("2025-10-17"), pre24=pre)
    for h in HZ:
        t1 = t0 + pd.Timedelta(hours=h - 1)
        if t1 in k.index:
            r[f"r{h}"] = k.close[t1] / p0 - 1
            r[f"a{h}"] = r[f"r{h}"] - (BTC.close.get(t1, np.nan) / b0 - 1)
    rows.append(r)
R = pd.DataFrame(rows); R.to_csv(H / "es_cms.csv", index=False)
def summ(g, pre="r"):
    out = {}
    for h in HZ:
        x = g[f"{pre}{h}"].dropna()
        out[f"{h}h"] = f"{x.mean()*100:+.1f}/{x.median()*100:+.1f} t{x.mean()/x.std()*np.sqrt(len(x)) if len(x)>2 else 0:+.1f}"
    out["n"] = len(g); return pd.Series(out)
pd.set_option("display.width", 250)
for pre in ["r", "a"]:
    print("== mean/median % (", "raw" if pre == "r" else "minus BTC", ")")
    print(R.groupby(["type", "oos"]).apply(summ, pre=pre).to_string())
print(R.groupby(["type", "oos"]).pre24.describe()[["mean", "50%"]])
