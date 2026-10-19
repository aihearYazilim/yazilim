import sim, sys, json, pandas as pd, numpy as np
pd.set_option('display.width', 250)
root = sys.argv[1]; p = json.loads(sys.argv[2])
D = sim.Data(root)
eq, tr, mg, lev = sim.run(D, ret_trades=True, **p)
f = lambda s: {k: round(float(v), 4) for k, v in s.items()}
print('BASE', p); print(' IS', f(sim.stats(eq, None, '2025-10-16')), '\n OOS', f(sim.stats(eq, '2025-10-17', '2026-10-16')))
op = [t for t in tr if t[1] == 'open']; cl = [t for t in tr if t[1] == 'close']
oos_op = [t for t in op if t[0] >= sim.OOS0]
print(' trades total', len(op), 'OOS', len(oos_op), 'margin closes', sum(1 for t in cl if t[2] == 'margin'))
y = eq.resample('YE').last(); print(' yearly:', (y.pct_change().fillna(y.iloc[0] - 1)).round(3).to_dict())
me = eq.resample('ME').last(); mr = me.pct_change()
print(' OOS months:', mr[(mr.index > '2025-10-31') & (mr.index <= '2026-10-31')].round(3).values)
print(' avg lev OOS', lev[lev.index >= sim.OOS0][lev > 0].mean().round(2), 'max margin/eq', (mg / eq).max().round(2))
mult = sim.MULT[root]
for cap in (1e6, 5e6):
    need = []
    for t in oos_op:
        for (cp, K, q, px, dl, qty, oi, F) in t[2]:
            if q < 0: need.append((abs(q) * cap / mult, qty, oi))
    need = np.array(need)
    if len(need): print(f' capacity {cap/1e6:.0f}M: contracts/trade median {np.median(need[:,0]):.0f}, strike day volume median {np.median(need[:,1]):.0f}, OI median {np.median(need[:,2]):.0f}')
print(' OOS entries:', [(str(t[0].date()), [(cp, K, round(dl, 2), int(qty), int(oi)) for (cp, K, q, px, dl, qty, oi, F) in t[2]]) for t in oos_op])
for name, kw in [('h=0.05', dict(h=0.05)), ('h=0.20', dict(h=0.20)), ('nema=0', dict(nema=0.0)), ('tax=0', dict(tax=0.0)),
                 ('margin scan x1.5', dict(a_mult=1.5)), ('entry day 3', dict(entry_day=2)), ('entry day 6', dict(entry_day=5)),
                 ('liq=vol5', dict(liq='vol5')), ('liq=any', dict(liq='any')), ('dep-3pp', dict(shift=-3.0)), ('mindte 25', dict(mindte=25))]:
    q = dict(p); q.update(kw)
    e2 = sim.run(D, **q)
    print(f' {name:16s} IS', f(sim.stats(e2, None, '2025-10-16')), ' OOS', f(sim.stats(e2, '2025-10-17', '2026-10-16')))
eq.to_pickle(f'data/eq_{root}_{p["struct"]}_{p["delta"]}_{p["L"]}_{p["filt"]}_{p.get("mode","hold")}.pkl')
