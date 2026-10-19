"""Walk-forward selection over the xs (240) and xs+pead (672) pools; prints IS chain / OOS chain."""
import pandas as pd, numpy as np, lib, wf
D = lib.build_panel(); u = D["usdtry"].resample("ME").last()
pools = {"xs": pd.read_pickle(lib.R / "xs_eqs.pkl")}
pools["xs+pead"] = {**pools["xs"], **pd.read_pickle(lib.R / "pead_eqs.pkl")}
rows = []
for pn, eqs in pools.items():
    M = wf.monthly(eqs); M = M[M.index >= "2008-01-31"]
    levs = {k: float(k.split("|L")[1]) for k in eqs}
    for W in (12, 24, 36, 60):
        for met in ("sharpe", "geo"):
            r, p = wf.wf(M, W, met, levs=levs)
            ris = r["2010-01":"2025-09"]; ro = r["2025-11":"2026-10"]
            rt = (1 + ro) * (1 + u.pct_change().reindex(ro.index)) - 1
            g = np.prod(1 + rt); gt = (1 + (g - 1) * 0.8) ** (1 / len(rt)) - 1
            e = (1 + ro).cumprod()
            rows.append(dict(pool=pn, W=W, metric=met, IS_geo=round((np.prod(1 + ris) ** (1 / len(ris)) - 1) * 100, 2),
                             OOS_geo=round((np.prod(1 + ro) ** (1 / len(ro)) - 1) * 100, 2), OOS_dd=round((e / e.cummax() - 1).min() * 100, 1),
                             OOS_worst=round(ro.min() * 100, 1), OOS_TRY_net=round(gt * 100, 2), top_pick=p["2025-11":].value_counts().index[0]))
df = pd.DataFrame(rows); df.to_csv(lib.R / "wf_results.csv", index=False); print(df.to_string())
