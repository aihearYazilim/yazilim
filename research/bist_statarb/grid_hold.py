import itertools, pandas as pd
import sa, holding
D = sa.load(); sa.prep(D)
res = []
BK = {"K": ("KCHOL",), "S": ("SAHOL",), "I": ("ISCTR",), "KS": ("KCHOL", "SAHOL"), "KSI": ("KCHOL", "SAHOL", "ISCTR")}
for bk, F, W, ze, zx, zs, ts, wm in itertools.product(BK, [126, 252, 504], [60, 120, 252], [1.5, 2.0, 2.5], [0.0, 0.5],
                                                     [3.0, 4.0], [20, 60], ["ret", "lvl"]):
    r, i = holding.run(D, books=BK[bk], F=F, W=W, ze=ze, zx=zx, zs=zs, ts=ts, wmode=wm, gross=2.0)
    d = sa.summ(r, i); d.update(bk=bk, F=F, W=W, ze=ze, zx=zx, zs=zs, ts=ts, wmode=wm); res.append(d)
pd.DataFrame(res).to_csv(sa.H / "out/grid_hold.csv", index=False)
print(len(res))
