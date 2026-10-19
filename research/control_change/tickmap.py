"""Panel kod zinciri: kod değişikliklerini fiyat sürekliliği ile bul (B'nin son günü + 1..5 seans = C'nin ilk günü ve C.pc_ilk ≈ B.c_son).
Çıktı: tickmap.csv (old, new, date)."""
import pandas as pd, numpy as np, pathlib
from cc_common import panel, days
H = pathlib.Path(__file__).parent
P = panel(); P = P[P.suf == "E"]
idx = days()
g = P.sort_values("date").groupby("sym")
first = P.sort_values("date").drop_duplicates("sym").set_index("sym")
first_d = g.date.min(); last_d = g.date.max()
rows = []
for c in first_d.index:
    f = first_d[c]
    if f <= idx[0]: continue
    k = idx.get_loc(f)
    cand = last_d[(last_d < f) & (last_d >= idx[max(k - 6, 0)])].index
    pc = first.loc[c, "pc"] if pd.notna(first.loc[c, "pc"]) and first.loc[c, "pc"] > 0 else first.loc[c, "c"]; tol = 0.005 if pd.notna(first.loc[c, "pc"]) and first.loc[c, "pc"] > 0 else 0.12
    best = None
    for b in cand:
        lc = P[(P.sym == b) & (P.c > 0)].sort_values("date").c
        if len(lc) == 0: continue
        r = pc / lc.iloc[-1]
        if abs(r - 1) < tol and (best is None or abs(r - 1) < best[1]): best = (b, abs(r - 1))
    if best: rows.append({"old": best[0], "new": c, "date": f})
M = pd.DataFrame(rows); M.to_csv(H/"tickmap.csv", index=False); print(M.to_string())
