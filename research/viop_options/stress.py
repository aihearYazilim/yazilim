"""instantaneous jump stress on OOS open positions: re-price legs with Black-76 at F*(1+j), IV x1.5; report worst/median loss as % equity."""
import sim, lib, numpy as np, pandas as pd
def stress(D, p, jumps):
    eq, tr, mg, lev = sim.run(D, ret_trades=True, **p)
    opens = [t for t in tr if t[1] == 'open' and t[0] >= sim.OOS0]
    out = {}
    for j in jumps:
        losses = []
        for t in opens:
            d = t[0]; loss = 0.0
            for (cp, K, q, px, dl, qty, oi, F) in t[2]:
                exp = [x for x in D.byday[d].exp.unique() if (x - d).days >= 20][0] if cp != 'F' else None
                T = 25 / 365
                if cp == 'F': loss += q * F * j
                else:
                    iv = D.byday[d][(D.byday[d].cp == cp) & (D.byday[d].K == K)].iv.iloc[0]
                    new = float(lib.b76(np.array([F * (1 + j)]), np.array([K]), np.array([T]), np.array([iv * 1.5]), np.array([cp]))[0])
                    loss += q * (new - px)
            losses.append(loss)  # q already per unit equity at entry
        out[j] = (round(min(losses) * 100, 1), round(np.median(losses) * 100, 1))
    return out
DU = sim.Data('USDTRY'); DX = sim.Data('XU030')
for name, D, p, js in [('F 8x real', DU, dict(struct='F', L=8, filt='real'), (0.05, 0.10, 0.15)),
                       ('F 5x real', DU, dict(struct='F', L=5, filt='real'), (0.05, 0.10, 0.15)),
                       ('F+5d call 8x real', DU, dict(struct='FC', wing=0.05, L=8, filt='real'), (0.05, 0.10, 0.15)),
                       ('F+5d call 5x real', DU, dict(struct='FC', wing=0.05, L=5, filt='real'), (0.05, 0.10, 0.15)),
                       ('short ATM call 8x real', DU, dict(struct='C', delta=0.5, L=8, filt='real'), (0.05, 0.10, 0.15)),
                       ('short 25d call 8x real', DU, dict(struct='C', delta=0.25, L=8, filt='real'), (0.05, 0.10, 0.15)),
                       ('XU030 15d put 5x vrp', DX, dict(struct='P', delta=0.15, L=5, filt='vrp', mode='hold'), (-0.10, -0.15, -0.20)),
                       ('XU030 10d put 8x vrp', DX, dict(struct='P', delta=0.10, L=8, filt='vrp', mode='hold'), (-0.10, -0.15, -0.20)),
                       ('XU030 15/5d put spread 5x ivhi', DX, dict(struct='PS', delta=0.20, wing=0.05, L=5, filt='ivhi', mode='hold'), (-0.10, -0.15, -0.20))]:
    print(name, '(worst, median) equity P&L % per jump:', stress(D, p, js))
