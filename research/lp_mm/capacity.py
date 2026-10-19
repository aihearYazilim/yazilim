"""Capacity: OOS pool LP fee revenue/day and active-liquidity depth expressed as $ in a +-5% band."""
import sys, numpy as np, pandas as pd
from run_grid import prep
from sol_approx import vcenter
from evaluate import OOS0, OOS1
for key in sys.argv[1:]:
    df, meta, x = prep(key)
    o = (df.index >= OOS0) & (df.index < OOS1)
    feeL = (df['d0'] * df['u0'] + df['d1'] * df['u1']).values
    fees_day = (feeL * df['liq'].values)[o].sum() / (o.sum() / 24)
    depth5 = (df['liq'].values * vcenter(df['p'].values, 1.05) * df['u1'].values)[o].mean()
    print(f'{key:24s} OOS LP fees/day ${fees_day/1e3:8.1f}k   active depth as +-5% band ${depth5/1e6:7.1f}M   '
          f'$100k share {1e5/depth5*100:.2f}%')
