"""Audit: CMS trades whose perp stops trading during the holding window; overlap DEL vs FDEL; funding in squeezes."""
import sys; sys.path.insert(0, "/home/user/yazilim/research/crypto_events")
import pandas as pd, numpy as np, trades as T
pd.set_option("display.width", 250); pd.set_option("display.max_rows", 200)
CE = T.CE; F = T.CE[T.CE.type == "FDEL"]
BOOK = {"MON": 168, "DEL": 72, "LIST": 720}
rows = []
for _, e in CE[CE.type.isin(list(BOOK))].iterrows():
    k = T.k1h(e.sym); t0 = e.ts.ceil("h"); t1 = t0 + pd.Timedelta(hours=BOOK[e.type])
    last = k.index[-1]
    fd = F[(F.sym == e.sym) & (F.ts >= e.ts - pd.Timedelta(days=1)) & (F.ts <= t1)]
    lvp = T.LV[e.sym]
    if last < t1 - pd.Timedelta(hours=1) and last < pd.Timestamp("2026-10-16") or len(fd):
        rows.append(dict(type=e.type, sym=e.sym, ann=e.ts, planned_exit=t1, last_1h_bar=last, panel_last=lvp, fdel_ann=fd.ts.min() if len(fd) else None))
R = pd.DataFrame(rows); print(R.to_string())
print("DEL events:", (CE.type == "DEL").sum(), " with FDEL of same sym within window:", R[(R.type == "DEL") & R.fdel_ann.notna()].shape[0])
# funding stats over CMS/UNL holding windows: worst daily funding paid by shorts
f = T.F
w = []
for _, e in CE[CE.type.isin(list(BOOK))].iterrows():
    x = f[e.sym][e.ts.normalize(): e.ts.normalize() + pd.Timedelta(hours=BOOK[e.type])]
    w.append(dict(type=e.type, sym=e.sym, ts=e.ts, fsum=x.sum(), fmin=x.min()))
W = pd.DataFrame(w); print(W.groupby("type")[["fsum", "fmin"]].describe().round(4).T.to_string())
print(W.nsmallest(8, "fsum").to_string())
