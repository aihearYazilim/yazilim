"""Empirical effective half-spread for ~30-delta weekly options from actual Deribit trades
(trade price vs mark price at time of trade). Taker 'sell' trades hit the bid = what a seller gets."""
from common import R, ORIG
import json, numpy as np, pandas as pd, datetime as dt
from bs import bs_delta, bs_price
rows = []
for cur in ("BTC","ETH"):
    for f in sorted((ORIG/"data/snap"/cur).glob("*.json")):
        tr = json.loads(f.read_text())
        if not tr: continue
        d = dt.date.fromisoformat(f.stem); tgt = (d+dt.timedelta(days=7))
        tag = f"{tgt.day}{tgt.strftime('%b').upper()}{tgt.strftime('%y')}"
        for t in tr:
            p = t["instrument_name"].split("-")
            if p[1] != tag: continue
            rows.append(dict(cur=cur, day=f.stem, K=float(p[2]), cp=p[3], price=t["price"], mark=t["mark_price"], iv=t["iv"],
                             S=t["index_price"], amt=t["amount"], dirn=t["direction"]))
X = pd.DataFrame(rows)
T = 7/365
X["delta"] = bs_delta(X.S.values, X.K.values, T, X.iv.values/100, (X.cp=="C").values)
X = X[(X.delta.abs()>0.2)&(X.delta.abs()<0.4)].copy()
X["rel"] = (X.price - X.mark)/X.mark
X["vega_coin"] = (bs_price(X.S.values, X.K.values, T, X.iv.values/100+0.01, (X.cp=="C").values) - bs_price(X.S.values, X.K.values, T, X.iv.values/100, (X.cp=="C").values))/X.S.values
X["volpts"] = (X.price - X.mark)/X.vega_coin
X["year"] = X.day.str[:4]
print("n trades 20-40 delta weekly:", len(X))
g = X.groupby(["cur","dirn"])
print(g.agg(n=("rel","size"), med_rel=("rel","median"), mean_rel=("rel","mean"), med_volpts=("volpts","median"), p75_volpts=("volpts", lambda s: s.quantile(.25 if s.mean()<0 else .75)), mark_coin=("mark","median")).round(4))
print("\nTaker SELL (seller hits bid) by year: median (price-mark)/mark and vol pts")
s = X[X.dirn=="sell"]
print(s.groupby(["cur","year"]).agg(n=("rel","size"), med_rel=("rel","median"), med_volpts=("volpts","median"), mark=("mark","median")).round(4))
# 1 vol point as % of premium
print("\n1 vol point as fraction of 30d weekly premium (median):", (X.vega_coin/X.mark).groupby(X.cur).median().round(4).to_dict())
X.to_pickle("spread_trades.pkl")
