"""Walk-forward selection over the saved pairs+holding grids (alpha series at 2x gross, collateral 0).
At each month end choose the top-k configs by trailing L-month metric (only past data), hold next month equal-weight.
Leverage lev: alpha scaled by lev/2 (costs are linear in notional); then + overnight deposit on collateral."""
import numpy as np, pandas as pd, itertools
import sa
D = sa.load(); sa.prep(D)
Z = np.load(sa.H / "raw/grid_rets.npz")
R = pd.DataFrame(Z["R"].T.astype(float), index=pd.to_datetime(Z["idx"], unit="us"), columns=Z["names"])
dep = sa.collat_only(D).reindex(R.index)                    # collateral-only daily return
M = (1 + R).resample("ME").prod() - 1
ld = np.log1p(R)


def chain(pool, L=24, k=1, metric="geo", lev=2.0, coll=True):
    cols = [c for c in R.columns if c.startswith(pool)] if pool != "A" else list(R.columns)
    me = M.index; out = pd.Series(0.0, index=R.index); picks = []
    for i in range(L, len(me) - 1):
        hist = M[cols].iloc[i - L + 1:i + 1]
        if metric == "geo":
            sc = np.log1p(hist).mean()
        else:
            sc = hist.mean() / (hist.std() + 1e-9)
        best = sc.sort_values(ascending=False).index[:k]
        nxt = (R.index > me[i]) & (R.index <= me[i + 1])
        out[nxt] = R.loc[nxt, best].mean(axis=1) * lev / 2
        picks.append(best[0])
    if coll:
        out = out + dep
    return out, picks


if __name__ == "__main__":
    rows = []; n = 0
    for pool, L, k, met in itertools.product(["P", "H", "A"], [12, 24, 36], [1, 5, 20], ["geo", "sharpe"]):
        r, pk = chain(pool, L, k, met); n += 1
        s = sa.summ(r.loc["2019-01-01":]); s.update(pool=pool, L=L, k=k, metric=met, nuniq=len(set(pk)))
        rows.append(s)
    df = pd.DataFrame(rows); pd.set_option("display.width", 250)
    print(df.sort_values("IS", ascending=False).to_string())
    print("combos", n)
    df.to_csv(sa.H / "out/wf.csv", index=False)
