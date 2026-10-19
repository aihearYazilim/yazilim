"""Olay çalışması (sadece görmek için; kural seçimi IS ile). Ortalama/medyan kümülatif getiri (düzeltilmiş)."""
import numpy as np, pandas as pd
from common import *
E = load_events(); px = load_px(set(E.ticker))
xu = pd.read_csv(H.parents[1]/"data"/"bist"/"XU100.csv", index_col=0, parse_dates=True)["close"] if (H.parents[1]/"data"/"bist"/"XU100.csv").exists() else None
def path(t, ts, K=(-20, 120), anchor="vwap"):
    o = px.get(t)
    if o is None or pd.isna(ts): return None
    j = entry_day(ts, o.index)
    if j >= len(o) or j + K[0] < 1: return None
    base = o.v.iloc[j] if anchor == "vwap" else o.c.iloc[j - 1]
    r = {}
    for k in range(K[0], K[1] + 1):
        if 0 <= j + k < len(o): r[k] = o.c.iloc[j + k] / base - 1
    return pd.Series(r)
for per, m in [("IS", E.start < OOS_START), ("OOS", E.start >= OOS_START)]:
    for col in ["start", "appr2", "ex_date"]:
        sub = E[m & E[col].notna()]
        P = pd.DataFrame({i: path(r.ticker, r[col] if col != "ex_date" else r[col] - pd.Timedelta(hours=1), anchor="prev")
                          for i, r in sub.iterrows()}).T
        P = P.dropna(axis=1, thresh=10).dropna(how="all")
        ks = [k for k in [-20, -10, -5, -1, 0, 1, 2, 3, 5, 10, 20, 40, 60, 90, 120] if k in P.columns]
        print(f"\n{per} anchor={col} n={len(P)} (getiri: olay-öncesi kapanış -> k. gün kapanışı)")
        print(pd.DataFrame({"mean%": P[ks].mean() * 100, "median%": P[ks].median() * 100, "hit": (P[ks] > 0).sum() / P[ks].notna().sum()}).round(1).T.to_string())
