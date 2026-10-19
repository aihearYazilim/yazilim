"""Annualized decomposition (fraction of starting capital per year, non-compounded) IS vs OOS for configs."""
import sys, glob, pandas as pd, numpy as np
from evaluate import OOS0, OOS1
from load import HERE
def decomp(key, cfgs=None):
    D = pd.read_pickle(f'{HERE}/out/dec_{key}.pkl'); E = pd.read_pickle(f'{HERE}/out/eq_{key}.pkl')
    rows = []
    for c in (cfgs or E.columns):
        d = D[c]; e = E[c]
        for nm, a, b in (('IS', d.index[0], OOS0), ('OOS', OOS0, OOS1)):
            da = d[(d.index >= a) & (d.index < b)].dropna()
            if len(da) < 30: continue
            yrs = (da.index[-1] - da.index[0]).days / 365
            eqm = e.reindex(da.index).mean()   # normalize by average equity
            x = (da.iloc[-1] - da.iloc[0]) / eqm / yrs
            rows.append(dict(cfg=c, per=nm, **x.round(3).to_dict()))
    return pd.DataFrame(rows)
if __name__ == '__main__':
    pd.set_option('display.width', 250); pd.set_option('display.max_rows', 500)
    key = sys.argv[1]; flt = sys.argv[2] if len(sys.argv) > 2 else ''
    E = pd.read_pickle(f'{HERE}/out/eq_{key}.pkl')
    print(decomp(key, [c for c in E.columns if flt in c]).to_string())
