import sys, numpy as np, pandas as pd
sys.path.insert(0, '.')
import lib
from calib import cboe, cagr, specs, df
for nm, grid in [('PUT', [0.86, 0.87, 0.88]), ('WPUT', [0.81, 0.82, 0.83, 0.84])]:
    for a in grid:
        m = lib.Model(aM=a, aW=a)
        ten, legs, st = specs[nm]
        tr = lib.build_trades(df, m, ten, legs, cost=False)
        eq, _ = lib.simulate(tr, 1.0, [True] * len(tr))
        cb = cboe(nm).reindex(eq.index, method='ffill')
        out = [nm, a]
        for a0, b0 in [(st, '2011-01-01'), ('2011-01-01', '2018-01-01'), ('2018-01-01', '2025-10-16'), (st, '2025-10-16'), ('2025-10-17', '2026-10-16')]:
            out += [f'{a0[:4]}-{b0[:4]}', round(cagr(eq, a0, b0) * 100, 1), round(cagr(cb, a0, b0) * 100, 1)]
        print(out, flush=True)
