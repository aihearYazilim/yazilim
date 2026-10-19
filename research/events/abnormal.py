"""Olay başına piyasa-düzeltilmiş getiri (hisse - XU100), maliyet öncesi. Giriş VWAP'ı ile çıkış VWAP'ı arası."""
import numpy as np, pandas as pd
from sim import *
E = load_events(); px = load_px(set(E.ticker))
xu = pd.read_csv(H.parents[1]/"data"/"bist"/"XU100.csv", index_col=0, parse_dates=True)["close"]
out = []
for legs in [("start", ("H", 1)), ("start", ("H", 20)), ("start", ("appr", 1)), ("appr", ("ex", 0)), ("ex", ("H", 20)), ("ex", ("H", 60))]:
    sch = schedule(E, px, legs[0], legs[1], max_wait=3)
    r = []
    for t, d0, d1, st in sch:
        o = px[t]; s = o.v[d1] / o.v[d0] - 1; m = xu.asof(d1) / xu.asof(d0 - pd.Timedelta(days=1)) - 1
        r.append((d0, s, s - m))
    R = pd.DataFrame(r, columns=["d", "ret", "abn"])
    for per, msk in [("IS", R.d < OOS_START), ("OOS", R.d >= OOS_START)]:
        x = R[msk]
        out.append(dict(leg=f"{legs[0]}->{legs[1][0]}{legs[1][1]}", per=per, n=len(x), mean_ret=round(x.ret.mean()*100, 2),
                        med_ret=round(x.ret.median()*100, 2), mean_abn=round(x.abn.mean()*100, 2), med_abn=round(x.abn.median()*100, 2),
                        hit_abn=round((x.abn > 0).mean(), 2)))
O = pd.DataFrame(out); O.to_csv(H/"results"/"abnormal.csv", index=False); print(O.to_string())
