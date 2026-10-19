"""ALTIN.S1 premium mean-reversion: long S1 + short XAUTRYM (gold-neutral) when S1 premium is low, exit when high.
Fixed thresholds and rolling-quantile thresholds; all chosen on IS (< 2025-10-17)."""
import itertools, numpy as np, pandas as pd
from common import rep, H
import cc_bt as C
out = []
for m in [10, 30]:
    eq, n = C.run(m=m, always=True); r = rep(eq, f"always_m{m}"); r["n"] = n; out.append(r)
    for lo, hi in itertools.product([0.98, 1.00, 1.02, 1.04, 1.06], [1.08, 1.10, 1.15, 1.20, 1.25]):
        eq, n = C.run(m=m, sig=C.prem_rule(lo, hi)); r = rep(eq, f"fix_lo{lo}_hi{hi}_m{m}"); r["n"] = n; out.append(r)
    for ql, qh in itertools.product([0.1, 0.2, 0.3], [0.7, 0.8, 0.9]):
        eq, n = C.run(m=m, sig=C.prem_q(ql, qh)); r = rep(eq, f"q{ql}_{qh}_m{m}"); r["n"] = n; out.append(r)
df = pd.DataFrame(out); pd.set_option("display.width", 200); print(df.to_string()); df.to_csv(H/"raw/prem_grid.csv", index=False)
