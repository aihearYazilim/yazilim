"""Final candidates: leverage 1-4x, collateral dep/0, slippage x1.5, trades, turnover, capacity, monthly OOS."""
import numpy as np, pandas as pd
import sa, pairs, holding, wf
D = sa.load(); sa.prep(D)
pd.set_option("display.width", 250)
C = {
    "H1 KCHOL-NAV": (holding.run, dict(books=("KCHOL",), F=504, W=120, ze=2.0, zx=0.0, zs=4.0, ts=20, wmode="ret")),
    "H2 KCHOL+SAHOL": (holding.run, dict(books=("KCHOL", "SAHOL"), F=252, W=120, ze=2.0, zx=0.0, zs=4.0, ts=60, wmode="ret")),
    "P1 pairs dist-grp": (pairs.run, dict(method="dist", cand="grp", F=126, Tt=63, N=5, ze=2.5, zx=0.0, zs=3.0, ts=60, zmode="roll60")),
}
rows = []; monthly = {}
for name, (fn, p) in C.items():
    for lev in [1, 2, 3, 4]:
        for coll in ["dep", "0"]:
            for sm in ([1.0, 1.5] if coll == "dep" else [1.0]):
                r, i = fn(D, gross=float(lev), coll=coll, slip_mult=sm, details=True, **p)
                o = (r.index >= sa.OOS_START)
                d = sa.summ(r.loc["2018-01-01":], dict(name=name, lev=lev, coll=coll, slip=sm, ntr=i["ntr"],
                            tov_mo=round(float(i["tov"].mean() * 21), 2),
                            ntr_oos=None, cap_MTL=round(sa.capacity(D, i["W"]) / 1e6, 1)))
                rows.append(d)
                if coll == "dep" and sm == 1.0:
                    monthly[(name, lev)] = ((1 + r[o]).resample("ME").prod() - 1)
for lev in [1, 2, 3, 4]:
    for coll in [True, False]:
        r, _ = wf.chain("H", 24, 5, "sharpe", lev=lev, coll=coll)
        if not coll:
            pass
        d = sa.summ(r.loc["2019-01-01":], dict(name="WF holding L24 top5 sharpe", lev=lev, coll="dep" if coll else "0", slip=1.0))
        rows.append(d)
        if coll:
            monthly[("WF", lev)] = (1 + r[r.index >= sa.OOS_START]).resample("ME").prod() - 1
df = pd.DataFrame(rows)
print(df.to_string())
df.to_csv(sa.H / "out/final.csv", index=False)
print((pd.DataFrame(monthly) * 100).round(1).to_string())
# number of trades in OOS for the fixed ones at 2x
for name, (fn, p) in C.items():
    r, i = fn(D, gross=2.0, details=True, **p)
    tv = i["tov"]; print(name, "OOS turnover/mo", round(float(tv[tv.index >= sa.OOS_START].mean() * 21), 2),
                         "entries IS+OOS", i["ntr"])
