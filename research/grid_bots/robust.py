"""Neighbour-smoothed IS selection: score = median IS geo-mean over {combo + its 1-step neighbours}
(any liquidation in any IS window counts as -100%). Pure IS; OOS reported after."""
import numpy as np, pandas as pd
from report import M, UNIS, neighbours, full, params
rows=[]; allr=[]
for u in UNIS:
    m = M[u]
    sm = np.array([np.median(np.r_[m.is_gm.values[j], m.is_gm.values[neighbours(j)]]) for j in range(len(m))])
    mn = np.array([np.min(np.r_[m.is_gm.values[j], m.is_gm.values[neighbours(j)]]) for j in range(len(m))])
    m = m.assign(sm=sm, nbmin=mn); M[u] = m
    allr.append(m)
    for f, g in m.groupby("fam"):
        j = int(g.sort_values(["sm", "is_gm"], ascending=False).cid.iloc[0])
        r = full(u, j); r["sm"] = g.loc[j, "sm"]; r["nbmin"] = g.loc[j, "nbmin"]; r["params"] = params(j)
        nb = neighbours(j); r["nb_oos_try_med"] = m.oos_geo_try.values[nb].median() if hasattr(m.oos_geo_try.values[nb],'median') else np.median(m.oos_geo_try.values[nb])
        r["nb_oos_try_min"] = np.min(m.oos_geo_try.values[nb])
        rows.append(r)
s = pd.DataFrame(rows)
pd.set_option("display.width", 300)
print(s[["uni","fam","sm","nbmin","is_gm","oos_usd","oos_try","oos_dd","oos_worst_try","oos_negm","oos_total","oos_gridprofit","nb_oos_try_med","nb_oos_try_min"]].round(4).to_string())
for _, r in s.iterrows(): print(r.uni, r.fam, "|", r.params)
s.to_csv("out_selected_robust.csv", index=False)
A = pd.concat(allr).sort_values("sm", ascending=False).head(10)
print("\nGLOBAL top-10 by neighbour-smoothed IS score")
t = pd.DataFrame([dict(**full(r.uni, int(r.cid)), sm=r.sm, nbmin=r.nbmin, params=params(int(r.cid))) for _, r in A.iterrows()])
print(t[["uni","fam","sm","nbmin","is_gm","oos_usd","oos_try","oos_dd","oos_worst_try","oos_total","oos_gridprofit"]].round(4).to_string())
for p in t.params: print("  ", p)
t.to_csv("out_global_robust.csv", index=False)
