"""50/50 daily-rebalanced sleeves: XU030 put spread + USDTRY carry (futures, futures+5d call), entry-day sweep."""
import sim, pandas as pd, numpy as np
DX = sim.Data('XU030'); DU = sim.Data('USDTRY')
f = lambda s: (round(s['geo'] * 100, 2), round(s['dd'] * 100, 1), round(s['worst'] * 100, 1))
PS = dict(struct='PS', delta=0.20, wing=0.05, L=5, filt='ivhi', mode='hold')
for name, pu in [('F5', dict(struct='F', L=5, filt='real')), ('FC5', dict(struct='FC', wing=0.05, L=5, filt='real')),
                 ('FC8', dict(struct='FC', wing=0.05, L=8, filt='real'))]:
    for wx in (0.5,):
        rows = []
        for ed in range(10):
            ea = sim.run(DX, entry_day=ed, **PS); eb = sim.run(DU, entry_day=ed, **pu)
            idx = ea.index.intersection(eb.index)
            r = wx * ea.reindex(idx).pct_change().fillna(0) + (1 - wx) * eb.reindex(idx).pct_change().fillna(0)
            e = (1 + r).cumprod()
            rows.append(f(sim.stats(e, None, '2025-10-16')) + f(sim.stats(e, '2025-10-17', '2026-10-16')) + f(sim.stats(eb, '2025-10-17', '2026-10-16')))
        r = np.array(rows)
        print(name, wx, 'ed0 IS/OOS', rows[0][:6], '| mean IS geo', r[:, 0].mean().round(2), 'IS dd min', r[:, 1].min(), 'OOS geo mean', r[:, 3].mean().round(2),
              'min', r[:, 3].min(), 'OOS dd min', r[:, 4].min(), 'worst month', r[:, 5].min(), '| carry-alone OOS mean', r[:, 6].mean().round(2))
