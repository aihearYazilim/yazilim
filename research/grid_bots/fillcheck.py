"""How much does bar resolution matter? Same conservative fill rule on 1m vs 1h bars (BTC/ETH OOS)."""
import numpy as np, pandas as pd
from lib import *; from sim import grid_sim
for s in ["BTC","ETH"]:
    c = Coin(s); i0, i1 = c.win(OOS0, OOS1)
    T = c.t[i0:i1]; hb = (T // 60) * 60
    df = pd.DataFrame({"t": hb, "o": c.o[i0:i1], "h": c.h[i0:i1], "l": c.l[i0:i1], "c": c.c[i0:i1]}).groupby("t").agg(o=("o","first"),h=("h","max"),l=("l","min"),c=("c","last"))
    th = df.index.values.astype(np.int64)
    for n, rp in [(20, 0.2), (80, 0.1), (150, 0.1), (150, 0.05)]:
        out = []
        for (t, o, h, l, cc) in [(c.t, c.o, c.h, c.l, c.c), (th, df.o.values, df.h.values, df.l.values, df.c.values)]:
            j0, j1 = (i0, i1) if len(t) == len(c.t) else (0, len(t))
            r = grid_sim(t, o, h, l, cc, j0, j1, c.d0, c.dH, c.dL, c.dC, c.ft_empty, c.fr_empty, 0, n, True, 2, rp, 1.0, 1, 2, 0.0, 0, 0.001, 0.001, 0.0005, 0.0002, 0.0)
            out.append((r[0][-1] - 1, r[1][-1], r[2]))
        print(s, f"n={n} +-{rp}", "1m: total %.3f gridprofit %.3f fills %d" % out[0], "| 1h: total %.3f gridprofit %.3f fills %d" % out[1])
