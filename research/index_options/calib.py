"""Calibrate ATM-IV/VIX ratios and skew so cost-free 1x replicas match CBOE PUT, WPUT, PUTY, CNDR (IS only)."""
import sys, numpy as np, pandas as pd, itertools
sys.path.insert(0, '.')
import lib
df = lib.load('SPX', proxy_k=1.10)
def cboe(s):
    x = pd.read_csv(lib.D / f'cboe_{s}.csv', index_col=0, parse_dates=True).iloc[:, 0]
    return x[x > 0]
END = '2025-10-16'
def cagr(s, a, b):
    s = s.loc[a:b]; return (s.iloc[-1] / s.iloc[0]) ** (365.25 / (s.index[-1] - s.index[0]).days) - 1
specs = {'PUT': ('M', [(False, 0.5)], '2007-01-19'), 'WPUT': ('W', [(False, 0.5)], '2006-02-03'),
         'PUTY': ('M', [(False, 'k0.98')], '2000-01-21'),
         'CNDR': ('M', [(False, 0.20), (True, 0.20), (False, 0.05, -1), (True, 0.05, -1)], '2000-01-21')}
mode = sys.argv[1] if __name__ == "__main__" else None
rows = []
if mode == 'atm':
    for a in [0.80, 0.85, 0.90, 0.95, 1.00]:
        m = lib.Model(aM=a, aW=a)
        for nm in ['PUT', 'WPUT']:
            ten, legs, st = specs[nm]
            tr = lib.build_trades(df, m, ten, legs, cost=False)
            eq, _ = lib.simulate(tr, 1.0, [True] * len(tr))
            c = cboe(nm); eq = eq.loc[st:END]
            cb = c.reindex(eq.index, method='ffill')
            rm, rc = eq.pct_change().dropna(), cb.pct_change().dropna()
            rows.append((nm, a, round(cagr(eq, st, END) * 100, 2), round(cagr(cb, st, END) * 100, 2), round(rm.corr(rc), 3), round(rm.std()/rc.std(), 2)))
            print(rows[-1], flush=True)
elif mode == "skew":
    aM, aW = float(sys.argv[2]), float(sys.argv[3])
    for s, c, fl in itertools.product([0.15, 0.25, 0.35, 0.45], [0.0, 0.05, 0.10], [0.75]):
        m = lib.Model(aM=aM, aW=aW, s=s, c=c, floor=fl)
        res = [s, c]
        for nm in ['PUTY', 'CNDR']:
            ten, legs, st = specs[nm]
            tr = lib.build_trades(df, m, ten, legs, cost=False)
            eq, _ = lib.simulate(tr, 1.0, [True] * len(tr))
            cb = cboe(nm).reindex(eq.loc[st:END].index, method='ffill')
            res += [nm, round(cagr(eq, st, END) * 100, 2), round(cagr(cb, st, END) * 100, 2)]
        print(res, flush=True)
