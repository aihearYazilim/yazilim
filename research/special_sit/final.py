"""Seçilen kurallar (h=1%, IS'te sabitlendi) için IS/OOS aylık seri, kapasite ve PPF farkı."""
import pandas as pd, numpy as np
from common_ss import *
import rights_sim as RS, tof_sim as TS
idx = days(); r = cash_rate_daily(idx[(idx >= IS_START) & (idx <= OOS_END)])
ppf, _ = simulate([], 1_000_000)   # yalnız PPF (motorla aynı takvim-günü faiz)
rows = []
for name, T in [("rights_hedged_h1", RS.trades(0.01, True)), ("rights_unhedged_h1", RS.trades(0.01, False)), ("tof_post_h1", TS.trades(0.01, "post"))]:
    for cap in [100_000, 1_000_000, 10_000_000]:
        eq, log = simulate(T, cap, max_frac=0.25 if "rights" in name else 0.5, liq=0.01)
        rr = report(eq, log, f"{name} cap={cap}")
        L = pd.DataFrame(log); 
        rr["avg_trade_TL"] = round(L.amt.mean()) if len(L) else 0
        rr["OOS_excess_vs_PPF_%/ay"] = round(100 * ((eq.loc[OOS_START:].iloc[-1] / eq.loc[:OOS_START].iloc[-1]) ** (1/12) - (ppf.loc[OOS_START:].iloc[-1] / ppf.loc[:OOS_START].iloc[-1]) ** (1/12)), 2)
        rows.append(rr); print(rr, flush=True)
        if cap == 1_000_000:
            m = eq.resample("ME").last().pct_change().dropna(); m.to_csv(H/"results"/f"monthly_{name}.csv")
pd.DataFrame(rows).to_csv(H/"results"/"final.csv", index=False)
p = ppf; print("PPF IS", stats(p, IS_START, OOS_START - pd.Timedelta(days=1))["aylik_geo_%"], "OOS", stats(p, OOS_START, OOS_END)["aylik_geo_%"])
