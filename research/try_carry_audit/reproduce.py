import numpy as np, pandas as pd
from audit_lib import *
d = panel(); idx = d.index; days, me, qe = calendar(idx)
M = d.close.values; Hh = d.high.values
def model(L, pol_mmf, pol_carry, tax=0.10, lag=0, i0=0):
    mmf = (1 + 0.9 * pol_mmf / 100) ** (days / 365) - 1
    carry = (pol_carry / 100 - BASIS / 100 - d.fed.values / 100) * days / 365
    sl = slice(i0, None)
    nav, Lh, nl = run_model(M[sl], Hh[sl], mmf[sl], carry[sl], L.values[sl], me[sl], qe[sl], tax, lag)
    return pd.Series(nav, idx[sl]), pd.Series(Lh, idx[sl]), nl
I0 = int(np.searchsorted(idx, pd.Timestamp(OOS_START))) - 1
if __name__ == "__main__":
    L = signals(d, d.pol, d.cpi)
    a = model(L, d.pol.values, d.pol.values); b = model(L, d.pol.values, d.pol.values, i0=I0)
    print("IS", mstats(a[0], IS_START, IS_END)); print("OOS", mstats(b[0], OOS_START, OOS_END), "avgL", b[1].iloc[1:].mean())
