"""Continuous daily excess returns (settlement to settlement, roll 5 days before expiry into next) for VİOP futures."""
import numpy as np, pandas as pd
from common import H
def cont(df, roll=5):
    df = df.sort_values(["date","expiry"]); out = {}; cur = None
    piv = df.pivot_table(index="date", columns="expiry", values="settle")
    dates = piv.index; r = []
    for i in range(1, len(dates)):
        d0, d1 = dates[i-1], dates[i]
        exps = [e for e in piv.columns if (e - d0).days >= roll and not np.isnan(piv.loc[d0, e])]
        if not exps: r.append(np.nan); continue
        e = min(exps); p0, p1 = piv.loc[d0, e], piv.loc[d1, e]
        r.append(p1/p0-1 if not np.isnan(p1) else np.nan)
    return pd.Series(r, index=dates[1:])
if __name__ == "__main__":
    g = pd.read_csv(H/"raw/viop_gold.csv", parse_dates=["date","expiry"]); u = pd.read_csv(H/"raw/viop_usd.csv", parse_dates=["date","expiry"])
    R = pd.DataFrame({"xautry": cont(g[g.root=="F_XAUTRYM"]), "xauusd": cont(g[g.root=="F_XAUUSD"]), "usdtry": cont(u[u.root=="F_USDTRY"])})
    R.to_pickle(H/"raw/cont.pkl"); print(R.describe())
