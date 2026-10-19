"""Calibrate NDX ATM-IV / VXN ratio with Cboe BXN (NDX monthly ATM buy-write), IS only (2009-09..2025-10-16)."""
import sys, numpy as np, pandas as pd
sys.path.insert(0, '.')
import lib
from calib import cboe, cagr
df = lib.load('NDX', proxy_k=1.10)
bxn = cboe('BXN')
for a in [0.80, 0.84, 0.87, 0.90, 0.94]:
    m = lib.Model(aM=a, aW=0.80, s=0.20, c=0.0)
    tr = lib.build_trades(df, m, 'M', [(True, 0.5)], und='NDX', cost=False)
    eq, vals = 1.0, []
    for t in tr:
        S1 = t['S0'] * (1 + 0)  # placeholder
        i1 = df.index.get_loc(t['d1']); S1 = df.close.iloc[i1]
        T = (t['d1'] - t['d0']).days / 365
        eq *= S1 / t['S0'] + 0.008 * T + t['prem'] - t['payoff']
        vals.append((t['d1'], eq))
    s = pd.Series(dict(vals))
    cb = bxn.reindex(s.index, method='ffill')
    out = [a]
    for a0, b0 in [('2009-10-01', '2017-01-01'), ('2017-01-01', '2025-10-16'), ('2009-10-01', '2025-10-16'), ('2025-10-17', '2026-10-16')]:
        out += [f'{a0[:4]}-{b0[:4]}', round(cagr(s, a0, b0) * 100, 1), round(cagr(cb, a0, b0) * 100, 1)]
    r1, r2 = s.loc['2009-10':'2025-10-16'].pct_change().dropna(), cb.loc['2009-10':'2025-10-16'].pct_change().dropna()
    print(out, 'corr', round(r1.corr(r2), 3), flush=True)
