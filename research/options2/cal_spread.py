"""Effective half-spread from real Deribit trades (trade price vs Deribit mark at the trade), by bucket:
 - 1DTE (expiry next day) 20-40 delta: taker SELL (what a seller gets)
 - 7DTE 20-40 delta taker SELL (reference, audit found ~ <5%)
 - 7DTE 3-12 delta taker BUY (wing cost), 25-45DTE 3-12 delta taker BUY (monthly hedge)
Reported in % of mark and in ticks (0.0001 coin)."""
import json, gzip, pathlib, numpy as np, pandas as pd, datetime as dt
from fbs import delta
D = pathlib.Path(__file__).parent
MON = {m: i + 1 for i, m in enumerate("JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split())}
rows = []
for cur in ("BTC", "ETH"):
    for f in sorted((D / "raw/daily" / cur).glob("*.json.gz"))[::3]:
        tr = json.load(gzip.open(f, "rt"))
        if not tr: continue
        x = pd.DataFrame(tr, columns=["ts", "inst", "price", "mark", "iv", "idx", "amt", "dirn"])
        p = x.inst.str.split("-", expand=True)
        ex = [dt.datetime(2000 + int(s[-2:]), MON[s[-5:-2]], int(s[:-5]), 8) for s in p[1]]
        x["T"] = (pd.Series(ex) - pd.to_datetime(x.ts, unit="ms")).dt.total_seconds().values / 31536000
        x["K"] = p[2].astype(float); x["isc"] = p[3] == "C"
        x["dlt"] = np.abs(delta(x.idx.values, x.K.values, x["T"].values, x.iv.values / 100, x.isc.values))
        x["dte"] = x["T"] * 365; x["cur"] = cur; x["year"] = f.name[:4]
        rows.append(x)
X = pd.concat(rows)
X["rel"] = (X.price - X.mark) / X.mark; X["ticks"] = (X.price - X.mark) / 0.0001
def bucket(r):
    if r.dte < 1.2 and 0.2 <= r.dlt <= 0.4: return "1DTE_30d"
    if 6 <= r.dte <= 7.5 and 0.2 <= r.dlt <= 0.4: return "7DTE_30d"
    if 6 <= r.dte <= 7.5 and 0.03 <= r.dlt <= 0.12: return "7DTE_wing"
    if 12 <= r.dte <= 15 and 0.2 <= r.dlt <= 0.4: return "14DTE_30d"
    if 25 <= r.dte <= 45 and 0.03 <= r.dlt <= 0.12: return "M_wing"
    return None
X = X[(X.dte < 46)]
X["b"] = [bucket(r) for r in X[["dte", "dlt"]].itertuples()]
X = X[X.b.notna()]
side = {"1DTE_30d": "sell", "7DTE_30d": "sell", "14DTE_30d": "sell", "7DTE_wing": "buy", "M_wing": "buy"}
X = X[[d == side[b] for d, b in zip(X.dirn, X.b)]]
pd.set_option("display.width", 200)
print(X.groupby(["b", "cur"]).agg(n=("rel", "size"), med_rel=("rel", "median"), mean_rel=("rel", "mean"),
      med_ticks=("ticks", "median"), med_mark=("mark", "median")).round(4).to_string())
print(X.groupby(["b", "year"]).agg(n=("rel", "size"), med_rel=("rel", "median"), med_ticks=("ticks", "median")).round(4).to_string())
