"""Triangle: F_XAUTRYM (TL/gram) vs F_XAUUSD (USD/oz) x F_USDTRY (TL/USD) for the SAME expiry.
Fair: XAUTRYM = XAUUSD*USDTRY/31.1035 (both settle on expiry; small diff from settlement reference definitions)."""
import pathlib, pandas as pd, numpy as np
H = pathlib.Path(__file__).resolve().parent
g = pd.read_csv(H/"raw/viop_gold.csv", parse_dates=["date","expiry"])
u = pd.read_csv(H/"raw/viop_usd.csv", parse_dates=["date","expiry"])
u = u[u.root=="F_USDTRY"]
a = g[g.root=="F_XAUTRYM"].merge(g[g.root=="F_XAUUSD"], on=["date","expiry"], suffixes=("_t","_u"))
a = a.merge(u, on=["date","expiry"])
a["fair"] = a.settle_u*a.settle/31.1035
a["dev_bp"] = (a.settle_t/a.fair-1)*1e4
a["dte"] = (a.expiry-a.date).dt.days
a["rk"] = a.groupby("date").expiry.rank()
a.to_pickle(H/"raw/tri.pkl")
f = a[a.rk==1]
print(f.groupby(f.date.dt.year).dev_bp.describe().round(1))
# close-based (traded) deviation where all three traded
c = f.dropna(subset=["close_t","close_u","close"]); c = c[(c.qty_t>0)&(c.qty_u>0)&(c.qty>0)]
c = c.assign(dc=(c.close_t/(c.close_u*c.close/31.1035)-1)*1e4)
print(c.groupby(c.date.dt.year).dc.describe().round(1))
print(f[["dev_bp"]].abs().quantile([.5,.9,.99]))
