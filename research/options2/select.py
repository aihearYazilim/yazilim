"""Pre-declared IS selection over all weekly BTC+ETH configs (E1,E2,E3,E5,E6): max IS geo subject to
IS intraweek-MTM maxDD >= cap, no ruin, IM never binding; margin STD (and separately PM)."""
import pandas as pd, numpy as np
pd.set_option("display.width", 250)
R = []
for t in ("e1", "e2", "e3", "e5", "e6"):
    d = pd.read_csv(f"raw/res_{t}.csv"); d["exp"] = t; R.append(d)
d = pd.concat(R, ignore_index=True)
print("total configs:", len(d), "+ e4 alts:", len(pd.read_csv("raw/res_e4.csv")))
d["margin"] = d["margin"].fillna("STD")
d = d[~d.name.str.startswith("D1") & ~d.name.str.startswith("B14")]
d = d[~d.name.str.contains("COST")]
cols = ["exp", "name", "IS_geo", "IS22_geo", "IS_dd_mtm", "IS_worst_wk", "IS_liq", "OOS_geo", "OOS_geo_try", "OOS_dd_mtm", "OOS_worst_wk", "OOS_worst_m", "OOS_liq"]
for m in ("STD", "PM"):
    for cap in (-0.40, -0.50, -0.60, -0.75):
        x = d[(d.margin == m) & (d.IS_dd_mtm >= cap) & (d.IS_geo > -1) & (d.IS_imcut.fillna(0) == 0)]
        x = x[~x.name.str.match(r"^(atm|dvol&|vrp|ts|rr|fund|basis|none)")]   # filters lacking 2021 history -> DD not comparable
        print(f"\n{m} cap {cap}: top 3"); print(x.sort_values("IS_geo", ascending=False)[cols].head(3).round(4).to_string(index=False))
