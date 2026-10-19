"""BIST-C (c_all, ew20 regime) implemented with SSF futures: long top K; regime off -> flat ('lor') or
hedged with XU030 future to beta 0 ('loh'); gross 1-2x; collateral dep / zero; lag 0/1."""
import pandas as pd, ls
D = ls.data(); rows = []
for K in [5, 10, 15, 20]:
    for mode in ["lor", "loh"]:
        for g in [1, 1.5, 2]:
            for coll in ["dep", "zero"]:
                for lag in [0, 1]:
                    r, d = ls.simulate(D, sig="c_all", K=K, reb=21, mode=mode, regime="ew20", gross=g, coll=coll,
                                       lag=lag, start="2018-01-01", details=True)
                    rows.append(dict(K=K, mode=mode, gross=g, coll=coll, lag=lag, **ls.summ(r),
                                     turn_yr=round(d["tov"].loc["2020":].mean() * 252, 1)))
T = pd.DataFrame(rows); pd.set_option("display.width", 200)
T.to_csv(ls.H / "out/bistc_fut.csv", index=False)
print(T[(T.coll == "dep") & (T.lag == 1)].to_string(index=False))
print(T[(T.coll == "zero") & (T.lag == 1) & (T.gross == 1)].to_string(index=False))
