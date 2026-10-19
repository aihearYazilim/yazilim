import sim, pandas as pd, numpy as np
DX = sim.Data('XU030')
f = lambda s: (round(s['geo'] * 100, 2), round(s['dd'] * 100, 1), round(s['worst'] * 100, 1))
for p in [dict(struct='PS', delta=0.20, wing=0.05, L=5, filt='ivhi', mode='hold'),
          dict(struct='S', delta=0.15, L=2, filt='ivhi', mode='hold'),
          dict(struct='P', delta=0.15, L=5, filt='none', mode='hold'),
          dict(struct='P', delta=0.15, L=3, filt='vrp', mode='hold')]:
    rows = []
    for ed in range(10):
        e = sim.run(DX, entry_day=ed, **p)
        rows.append((ed,) + f(sim.stats(e, None, '2025-10-16')) + f(sim.stats(e, '2025-10-17', '2026-10-16')))
    r = pd.DataFrame(rows, columns=['ed', 'is_geo', 'is_dd', 'is_worst', 'oos_geo', 'oos_dd', 'oos_worst'])
    print(p, 'ed0:', rows[0], 'mean:', r.mean().round(2).to_dict(), 'min oos', r.oos_geo.min(), 'max oos', r.oos_geo.max())
