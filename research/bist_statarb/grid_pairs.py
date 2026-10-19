import itertools, sys, pandas as pd, numpy as np
from multiprocessing import Pool
import sa, pairs
D = sa.load(); sa.prep(D)
G = []
for m, c, F, Tt, N, ze, zx, zs, ts, zm in itertools.product(["dist", "coint"], ["grp", "all"], [126, 252], [21, 63],
                                                          [5, 10], [1.5, 2.0, 2.5], [0.0, 0.5], [3.0, 4.0], [20, 60],
                                                          ["form", "roll60", "kal"]):
    if m == "dist" and zm == "kal":
        continue
    G.append(dict(method=m, cand=c, F=F, Tt=Tt, N=N, ze=ze, zx=zx, zs=zs, ts=ts, zmode=zm))


def job(p):
    try:
        r, i = pairs.run(D, gross=2.0, **p)
        d = sa.summ(r, i); d.update(p); return d
    except Exception as e:
        d = dict(p); d["err"] = str(e); return d


if __name__ == "__main__":
    print(len(G), flush=True)
    with Pool(4) as pool:
        res = pool.map(job, G, chunksize=8)
    pd.DataFrame(res).to_csv(sa.H / "out/grid_pairs.csv", index=False)
