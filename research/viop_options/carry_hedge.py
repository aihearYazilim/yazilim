"""USDTRY: short futures (carry) vs short futures + long OTM call (jump hedge) vs short calls, real-rate filter. + jump stress."""
import sim, pandas as pd, numpy as np, itertools
D = sim.Data('USDTRY')
rows = []
f = lambda s: (round(s['geo'] * 100, 2), round(s['dd'] * 100, 1), round(s['worst'] * 100, 1))
for st, w, L, filt in itertools.product(['F', 'FC'], [None, 0.05, 0.1, 0.2], [3, 5, 8], ['real', 'none']):
    if (st == 'F') != (w is None): continue
    res = []
    for ed in (0, 2, 4, 6, 8):
        e = sim.run(D, struct=st, wing=w, L=L, filt=filt, entry_day=ed)
        res.append(f(sim.stats(e, None, '2025-10-16')) + f(sim.stats(e, '2025-10-17', '2026-10-16')))
    r = np.array(res)
    rows.append(dict(struct=st, wing=w, L=L, filt=filt, is_geo0=r[0, 0], oos_geo0=r[0, 3], oos_dd0=r[0, 4], is_dd0=r[0, 1],
                     is_geo_mean=r[:, 0].mean().round(2), oos_geo_mean=r[:, 3].mean().round(2), oos_dd_min=r[:, 4].min(), is_dd_min=r[:, 1].min()))
    print(rows[-1], flush=True)
pd.DataFrame(rows).to_csv('carry_hedge.csv', index=False)
