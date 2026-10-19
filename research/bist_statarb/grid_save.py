"""Re-run the pairs + holding grids at gross 2 and save daily return series (for walk-forward selection)."""
import itertools, numpy as np, pandas as pd
from multiprocessing import Pool
import sa, pairs, holding
D = sa.load(); sa.prep(D)
BK = {"K": ("KCHOL",), "S": ("SAHOL",), "I": ("ISCTR",), "KS": ("KCHOL", "SAHOL"), "KSI": ("KCHOL", "SAHOL", "ISCTR")}
G = []
for m, c, F, Tt, N, ze, zx, zs, ts, zm in itertools.product(["dist", "coint"], ["grp", "all"], [126, 252], [21, 63],
                                                          [5, 10], [1.5, 2.0, 2.5], [0.0, 0.5], [3.0, 4.0], [20, 60],
                                                          ["form", "roll60", "kal"]):
    if m == "dist" and zm == "kal":
        continue
    G.append(("P", dict(method=m, cand=c, F=F, Tt=Tt, N=N, ze=ze, zx=zx, zs=zs, ts=ts, zmode=zm)))
for bk, F, W, ze, zx, zs, ts, wm in itertools.product(BK, [126, 252, 504], [60, 120, 252], [1.5, 2.0, 2.5], [0.0, 0.5],
                                                     [3.0, 4.0], [20, 60], ["ret", "lvl"]):
    G.append(("H", dict(books=BK[bk], F=F, W=W, ze=ze, zx=zx, zs=zs, ts=ts, wmode=wm)))


def job(g):
    k, p = g
    r, _ = (pairs.run if k == "P" else holding.run)(D, gross=2.0, coll="0", **p)
    return r.values.astype(np.float32)


if __name__ == "__main__":
    with Pool(4) as pool:
        R = pool.map(job, G, chunksize=8)
    idx = sa.collat_only(D).index
    np.savez_compressed(sa.H / "raw/grid_rets.npz", R=np.array(R), idx=idx.values.astype("int64"),
                        names=np.array([k + ":" + str(p) for k, p in G]))
    print("done", len(G))
