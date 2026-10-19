import sim, itertools, pandas as pd, numpy as np, sys
from multiprocessing import Pool
ROOT = sys.argv[1]
D = None
def init():
    global D; D = sim.Data(ROOT)
def job(p):
    eq = sim.run(D, **p)
    a = sim.stats(eq, None, '2025-10-16'); b = sim.stats(eq, '2025-10-17', '2026-10-16')
    r = dict(p); r.update({'is_geo': a['geo'], 'is_dd': a['dd'], 'is_worst': a['worst'], 'is_neg': a['negm'],
                           'oos_geo': b['geo'], 'oos_dd': b['dd'], 'oos_worst': b['worst'], 'oos_neg': b['negm']})
    return r
def params():
    out = []
    deltas = [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5]
    if ROOT == 'XU030':
        structs = ['P', 'S', 'PS', 'IC', 'C']; filts = ['none', 'ivhi', 'ivlo', 'vrp', 'trend', 'trend_vrp']; modes = ['hold', 'roll']
    else:
        structs = ['C', 'CS', 'P', 'S', 'IC']; filts = ['none', 'real', 'ivhi', 'ivlo', 'vrp', 'real_ivhi']; modes = ['hold']
    for st, dl, L, f, m in itertools.product(structs, deltas, [1, 2, 3, 5, 8], filts, modes):
        wings = [None] if st in ('P', 'S', 'C') else [w for w in (0.05, 0.1) if w < dl - 0.04]
        for w in wings:
            out.append(dict(struct=st, delta=dl, wing=w, L=L, filt=f, mode=m, h=0.10))
    return out
if __name__ == '__main__':
    ps = params(); print(len(ps), flush=True)
    with Pool(4, initializer=init) as pool:
        res = pool.map(job, ps, chunksize=20)
    pd.DataFrame(res).to_csv(f'grid_{ROOT}.csv', index=False)
