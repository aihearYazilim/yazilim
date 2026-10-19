"""Capacity: re-run configs with capital x cap_mult (liquidity filter: position <= 2% of 20d median SSF value)."""
import pandas as pd, ls
D = ls.data(); rows = []
for nm, c in [("A h52 K8 m bn", dict(sig="h52", K=8, reb=21, mode="bn")),
              ("D c_all K8 m bn", dict(sig="c_all", K=8, reb=21, mode="bn"))]:
    for cm in [0.25, 1, 5, 10, 25, 50]:
        r, d = ls.simulate(D, gross=2, cap_mult=cm, start="2018-01-01", details=True, **c)
        rows.append(dict(cfg=nm, capital_MTL=cm, **ls.summ(r), oos_elig=round(d["nelig"].loc[ls.OOS_START:].mean(), 1)))
print(pd.DataFrame(rows).to_string(index=False))
