"""Olay bazında tablo: duyuru, 6 ay ort., devir fiyatı, tahmini teklif E, ilk AOF, E/AOF-1, sonuç ve 'her koşulda al' getirisi."""
import pandas as pd, numpy as np, sys
from sim import *
pd.set_option("display.width", 250); pd.set_option("display.max_rows", 200)
out = []
for ev in ["spa", "early"]:
    D = load(ev)
    for _, g in D.iterrows():
        I = deal_info(g)
        if I is None: out.append(dict(ev=ev, sym=g.sym, ann=g.ann_ts, note="nodata")); continue
        s = I["s"]; d0 = idx[I["j0"]] if I["j0"] < len(idx) else None
        v0 = s.v.get(d0, np.nan) if d0 is not None else np.nan
        t, why = trade(g, h=-0.99, K=1, HMAX=15)
        out.append(dict(ev=ev, sym=g.sym, ann=g.ann_ts.strftime("%Y-%m-%d %H:%M"), oos=g.ann_ts >= OOS_START, pre=round(I["pre_close"], 3), a6=round(I["a6"], 3) if I["a6"]==I["a6"] else np.nan,
                        tp=round(I["tp"], 3) if I["tp"]==I["tp"] else np.nan, E=round(I["E"], 3), vwap0=round(v0, 3), gap_E_vs_vwap=round(100*(I["E"]/v0-1), 1) if v0==v0 else np.nan,
                        outcome=g.outcome, tender=g.tender_price, why=why if t is None else t["why"], ret_all=round(100*t["ret"], 1) if t else np.nan, days=t["days"] if t else np.nan))
R = pd.DataFrame(out); R.to_csv(H/"results"/"deal_table.csv", index=False)
print(R.to_string())
