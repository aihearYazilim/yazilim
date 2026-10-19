"""HYPOTHETICAL (not executable for retail: no ALTIN.S1 securities lending found): short ALTIN.S1 + long XAUTRYM when
premium ratio > hi, cover when < lo. Notional w=0.5 of equity, borrow fee 10%/yr, BIST comm 0.14% + half spread,
VİOP 0.05%/side. Thresholds IS-chosen."""
import itertools, numpy as np, pandas as pd
from common import rep
import cc_bt as C
from contret import cont
fr = cont(C.g).reindex(C.dates).fillna(0).values
sr = pd.Series(C.CL, index=C.dates).pct_change().fillna(0).values
def run(hi, lo, w=0.5, borrow=0.10):
    eq, on, out = 1.0, False, []
    for i in range(len(C.dates)):
        r = ((1+C.DEP[i])**(C.gap[i]/365)-1)
        if on: r += w*(fr[i]-sr[i]) - w*borrow*C.gap[i]/365
        eq *= 1+r
        x = C.RATIO[i]
        if not on and x > hi and C.CANSELL[i]: on = True; eq *= 1 - w*(0.0014+0.0005+0.0005)
        elif on and x < lo and C.CANBUY[i]: on = False; eq *= 1 - w*(0.0014+0.0005+0.0005)
        out.append(eq)
    return pd.Series(out, index=C.dates)
res = [rep(run(hi, lo), f"short_hi{hi}_lo{lo}") for hi, lo in itertools.product([1.10, 1.15, 1.20], [1.02, 1.05, 1.08])]
print(pd.DataFrame(res).to_string())
