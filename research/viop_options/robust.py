"""entry-day sweep (0..9th trading day), 50/50 combo of XU030 put sleeve + USDTRY call sleeve, jump stress."""
import sim, pandas as pd, numpy as np
DX = sim.Data('XU030'); DU = sim.Data('USDTRY')
cfg = {'A': (DX, dict(struct='P', delta=0.15, L=5, filt='vrp', mode='hold')),
       'A2': (DX, dict(struct='P', delta=0.10, L=8, filt='vrp', mode='hold')),
       'Aroll': (DX, dict(struct='P', delta=0.10, L=8, filt='vrp', mode='roll')),
       'B': (DU, dict(struct='C', delta=0.5, L=8, filt='real')),
       'B5': (DU, dict(struct='C', delta=0.5, L=5, filt='real')),
       'B25': (DU, dict(struct='C', delta=0.25, L=8, filt='real')),
       'B3': (DU, dict(struct='C', delta=0.5, L=3, filt='real'))}
f = lambda s: (round(s['geo'] * 100, 2), round(s['dd'] * 100, 1), round(s['worst'] * 100, 1))
eqs = {}
for k, (D, p) in cfg.items():
    rows = []
    for ed in range(10):
        e = sim.run(D, entry_day=ed, **p); eqs[(k, ed)] = e
        rows.append((ed,) + f(sim.stats(e, None, '2025-10-16')) + f(sim.stats(e, '2025-10-17', '2026-10-16')))
    r = pd.DataFrame(rows, columns=['ed', 'is_geo', 'is_dd', 'is_worst', 'oos_geo', 'oos_dd', 'oos_worst'])
    print(k, p); print(r.to_string(index=False)); print(' mean', r.mean().round(2).to_dict())
# combos (daily-rebalanced 50/50 of sleeves; ignores cross-margin)
for a, b in [('A', 'B5'), ('A', 'B3'), ('A2', 'B'), ('A', 'B')]:
    rows = []
    for ed in range(10):
        ea, eb = eqs[(a, ed)], eqs[(b, ed)]
        idx = ea.index.intersection(eb.index)
        r = 0.5 * ea.reindex(idx).pct_change().fillna(0) + 0.5 * eb.reindex(idx).pct_change().fillna(0)
        e = (1 + r).cumprod()
        rows.append((ed,) + f(sim.stats(e, None, '2025-10-16')) + f(sim.stats(e, '2025-10-17', '2026-10-16')))
    r = pd.DataFrame(rows, columns=['ed', 'is_geo', 'is_dd', 'is_worst', 'oos_geo', 'oos_dd', 'oos_worst'])
    print('COMBO', a, b); print(r.to_string(index=False)); print(' mean', r.mean().round(2).to_dict())
pd.to_pickle(eqs, 'data/robust_eqs.pkl')
