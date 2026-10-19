import sys, numpy as np, pandas as pd
sys.path.insert(0, '.')
import lib
from calib import cboe, cagr, specs
for k in [1.08, 1.10, 1.12]:
    df = lib.load('SPX', proxy_k=k)
    for a in [0.80, 0.81]:
        m = lib.Model(aM=0.87, aW=a)
        tr = lib.build_trades(df, m, 'W', [(False, 0.5)], cost=False)
        eq, _ = lib.simulate(tr, 1.0, [True] * len(tr))
        cb = cboe('WPUT').reindex(eq.index, method='ffill')
        out = [k, a]
        for a0, b0 in [('2006-02-03', '2011-01-01'), ('2011-01-01', '2018-01-01'), ('2018-01-01', '2025-10-16'), ('2006-02-03', '2025-10-16'), ('2025-10-17', '2026-10-16')]:
            out += [f'{a0[:4]}-{b0[:4]}', round(cagr(eq, a0, b0) * 100, 1), round(cagr(cb, a0, b0) * 100, 1)]
        print(out, flush=True)
