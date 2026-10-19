"""Selection report: per universe x family, pick max IS score (compounded geo-mean across 8 fresh-start
12m IS windows; any liquidation -> -100%), report OOS (USD, TRY), grid-profit decomposition, neighbours."""
import numpy as np, pandas as pd
from lib import *
from analyze import C, ODAYS, oos_metrics, params
from sweep import combos

UNIS = MAJ + ["ALT20"]
M = {u: pd.read_pickle(RAW / f"metrics_{u}.pkl") for u in UNIS}
O = {u: np.load(RAW / f"oos_{u}.npy") for u in UNIS}
# parameter grids for neighbour search
vals = {}
for f, p in C:
    for k, v in p.items():
        vals.setdefault((f, k), set()).add(v)
vals = {k: sorted(v) for k, v in vals.items()}
key = {}
for j, (f, p) in enumerate(C):
    key[(f, tuple(sorted(p.items())))] = j

def neighbours(j):
    f, p = C[j]; out = []
    for k, v in p.items():
        L = vals[(f, k)]
        if len(L) < 2 or k == "fut":
            continue
        i = L.index(v)
        for ii in (i - 1, i + 1):
            if 0 <= ii < len(L):
                q = dict(p); q[k] = L[ii]
                if f == "dca":
                    q["fut"] = q["lev"] > 1
                jj = key.get((f, tuple(sorted(q.items()))))
                if jj is not None:
                    out.append(jj)
    return out

def full(u, j):
    m = M[u].loc[j]
    om = oos_metrics(O[u][j].astype(float))
    return dict(uni=u, fam=m.fam, cid=j, is_gm=m.is_gm, is_med=m.is_med, is_min=m.is_min, is_try_med=m.is_try_med,
                **om, oos_total=m.oos_end - 1, oos_gridprofit=m.oos_gp, dead=m.dead_frac, fills=m.fills)

rows, nb = [], []
for u in UNIS:
    m = M[u]
    for f, g in m.groupby("fam"):
        j = int(g.sort_values(["is_gm", "is_med"], ascending=False).cid.iloc[0])
        r = full(u, j); r["params"] = params(j)
        ns = neighbours(j)
        nm = m.loc[ns]
        r["nb_n"] = len(ns); r["nb_is_gm_med"] = nm.is_gm.median(); r["nb_oos_try_med"] = nm.oos_geo_try.median()
        r["nb_oos_try_min"] = nm.oos_geo_try.min()
        rows.append(r)
sel = pd.DataFrame(rows)
pd.set_option("display.width", 300); pd.set_option("display.max_colwidth", 120)
cols = ["uni", "fam", "is_gm", "is_med", "is_min", "oos_usd", "oos_try", "oos_dd", "oos_worst_try", "oos_negm",
        "oos_total", "oos_gridprofit", "dead", "nb_n", "nb_is_gm_med", "nb_oos_try_med", "nb_oos_try_min"]
print(sel[cols].round(4).to_string())
for _, r in sel.iterrows():
    print(r.uni, r.fam, "|", r.params)
sel.to_csv(HERE / "out_selected.csv", index=False)

# global IS ranking (all universes x combos) -> top 10 by IS, with OOS
allm = pd.concat([M[u] for u in UNIS])
top = allm.sort_values("is_gm", ascending=False).head(10)
print("\nGLOBAL top-10 by IS geo-mean:")
tr = pd.DataFrame([dict(**full(r.uni, int(r.cid)), params=params(int(r.cid))) for _, r in top.iterrows()])
print(tr[["uni", "fam", "is_gm", "is_med", "is_min", "oos_usd", "oos_try", "oos_dd", "oos_worst_try", "oos_gridprofit", "oos_total"]].round(4).to_string())
for p in tr.params: print("  ", p)
tr.to_csv(HERE / "out_global_top.csv", index=False)

# hindsight distribution (NOT valid for selection)
print("\nHindsight OOS distribution (TRY monthly geo) per family, all universes:")
for f, g in allm.groupby("fam"):
    q = g.oos_geo_try
    print(f"{f:6s} n={len(g):6d}  median {q.median():+.4f}  p90 {q.quantile(.9):+.4f}  max {q.max():+.4f}  "
          f">=5.3%: {(q >= .053).sum():5d}  >=10%: {(q >= .10).sum():4d}  liquidated(any coin) {(g.dead_frac > 0).mean():.3f}")
print("combos total:", len(allm))
# grid profit vs total, all spot/futures grids
g = allm[allm.fam.isin(["grid", "fgrid"]) & (allm.dead_frac == 0)]
print("\nGrid bots OOS: share with positive 'grid profit' %.3f, share with positive total PnL %.3f, share gp>0 & total<0 %.3f" % (
    (g.oos_gp > 0).mean(), (g.oos_end > 1).mean(), ((g.oos_gp > 0) & (g.oos_end < 1)).mean()))
print("median grid profit %.3f  median total %.3f" % (g.oos_gp.median(), (g.oos_end - 1).median()))
