"""Walk-forward selection across a pool of configs: each month pick best trailing-W metric, hold next month."""
import numpy as np, pandas as pd, lib
def monthly(eqs):
    return pd.DataFrame({k: v.resample("ME").last() for k, v in eqs.items()}).pct_change()
def wf(M, W=36, metric="sharpe", switch_cost=0.003, levs=None):
    out = []; prev = None; picks = []
    for i in range(W, len(M)):
        h = M.iloc[i - W:i]
        if metric == "sharpe": sc = h.mean() / h.std()
        else: sc = np.log1p(h).sum()
        sc = sc.dropna()
        k = sc.idxmax(); r = M.iloc[i][k]
        if prev is not None and k != prev: r -= switch_cost * (levs[k] if levs else 1)
        out.append(r); picks.append(k); prev = k
    return pd.Series(out, index=M.index[W:]), pd.Series(picks, index=M.index[W:])
def eq_from_m(r):
    return (1 + r.fillna(0)).cumprod()
