"""Implied annual TL carry from XAUTRYM calendar (F2/F1) and USDTRY calendar; vs policy rate."""
import numpy as np, pandas as pd
from common import H, policy
g = pd.read_csv(H/"raw/viop_gold.csv", parse_dates=["date","expiry"]); u = pd.read_csv(H/"raw/viop_usd.csv", parse_dates=["date","expiry"])
def cal(df):
    df = df[(df.expiry-df.date).dt.days >= 5].sort_values(["date","expiry"])
    f1 = df.groupby("date").nth(0).set_index("date"); f2 = df.groupby("date").nth(1).set_index("date")
    x = f1[["expiry","settle"]].join(f2[["expiry","settle","qty"]], rsuffix="2").dropna()
    dd = (x.expiry2-x.expiry).dt.days
    return ((x.settle2/x.settle)**(365/dd)-1)
gt = cal(g[g.root=="F_XAUTRYM"]); gu = cal(g[g.root=="F_XAUUSD"]); ut = cal(u[u.root=="F_USDTRY"])
d = pd.DataFrame({"xautry_impl": gt, "xauusd_impl": gu, "usdtry_impl": ut}); d["policy"] = policy(d.index)
print((d.groupby(d.index.year).median()*100).round(1))
d.to_pickle(H/"raw/curve.pkl")
