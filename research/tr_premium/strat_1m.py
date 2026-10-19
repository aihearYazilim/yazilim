"""1-minute (2025-01..2026-10) check of BtcTurk vs Binance USDT/TRY spread MR (execution 1 or 2 minutes after signal)."""
import itertools, sys, numpy as np, pandas as pd
from lib import *
from strat_spread import run, summarize
def rd(pfx):
    df = pd.concat(pd.read_csv(f) for f in sorted((RAW / "m1").glob(pfx + "_*.csv"))).drop_duplicates("t")
    return pd.Series(df.close.values, pd.to_datetime(df.t, unit="s", utc=True)).sort_index()
a = rd("bt"); b = rd("bn")   # 2025-01..2026-10-16 only (IS = 2025-01-01..2025-10-16)
# BtcTurk graph bars may be missing in quiet minutes -> ffill at most 5 min
idx = b.index
a = a.reindex(idx).ffill(limit=5)
s = np.log(a / b).dropna()
print("1m spread bp quantiles by year:\n", (s.groupby(s.index.year).quantile([.01, .05, .5, .95, .99]).unstack() * 1e4).round(1))
rows = []
for fee in [0.0017, 0.0005]:
    for k, L, ex, lag in itertools.product([10, 20, 30, 50], [60, 1440], [0, 0.5], [1, 2]):
        pnl, n = run(s, 2, k, L, ex, fee, lag)
        gi, go, dd, wm = summarize(pnl)
        rows.append(dict(fee=fee, k=k, L=L, ex=ex, lag=lag, IS=gi, OOS=go, OOSdd=dd, worstm=wm, trades=n))
        print(rows[-1], flush=True)
R = pd.DataFrame(rows); R.to_csv(RAW / "spread_1m_grid.csv", index=False)
for fee, g in R.groupby("fee"):
    print(fee, g.loc[g.IS.idxmax()].round(3).to_dict())
