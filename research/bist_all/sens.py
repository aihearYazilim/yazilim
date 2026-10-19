"""Aday konfigürasyonlar için maliyet / gecikme / komşu duyarlılığı."""
import pandas as pd, common as C, signals as SG
P = C.load_all(); S = SG.build(P); R = SG.regimes(P)
rows = []
cands = [("h52", "sma100", 5, 21), ("h52", "sma100", 10, 21), ("h52", "sma100", 5, 5), ("h52", "sma50", 5, 21),
         ("h52", "sma200", 5, 21), ("h26", "sma100", 5, 21), ("c_all", "ew20", 20, 21), ("c_mom_h52", "sma100", 5, 5)]
for sig, reg, top, reb in cands:
    for fee in [0.0014, 0.003]:
        for lag in [0, 1]:
            r, tv = C.simulate(P, S[sig], top=top, rebalance=reb, regime=R[reg], lag=lag, fee=fee, return_details=True)
            d = dict(sig=sig, reg=reg, top=top, reb=reb, fee=fee, lag=lag); d.update(C.summarize(r, tv)); rows.append(d)
df = pd.DataFrame(rows); pd.set_option("display.width", 250)
print(df.to_string(index=False)); df.to_csv("out/sens.csv", index=False)
