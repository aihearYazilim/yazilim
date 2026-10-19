import numpy as np, pandas as pd
from audit_lib import *
from reproduce import d, I0
pd.set_option("display.width", 250)
F = futures_panel(); polc, effc = corrected_rates(d)
idx = d.index; days, me, qe = calendar(idx); M = d.close.values; Hh = d.high.values
fd = [pd.Timestamp(x) for x in sorted(F.date.unique())]
def model(L, pol, maint, i0=0, ppf_mult=0.9, tax=0.10):
    mmf = (1 + ppf_mult * pol / 100) ** (days / 365) - 1
    carry = (pol / 100 - BASIS / 100 - d.fed.values / 100) * days / 365
    sl = slice(i0, None)
    nav, Lh, nl = run_model(M[sl], Hh[sl], mmf[sl], carry[sl], L.values[sl], me[sl], qe[sl], tax, 0, maint)
    return pd.Series(nav, idx[sl]), pd.Series(Lh, idx[sl]), nl
rows = []
for Lmax in [3, 5, 8]:
    L0 = signals(d, d.pol, d.cpi, Lmax=Lmax); Lc = signals(d, polc, d.cpi, Lmax=Lmax)
    a = model(L0, d.pol.values, 0.075); ao = model(L0, d.pol.values, 0.075, I0)
    b = model(Lc, polc.values, 0.0825); bo = model(Lc, polc.values, 0.0825, I0)
    s17 = [x for x in fd if x >= pd.Timestamp("2017-03-06")]
    fi = run_futures(F, s17, Lc, polc * 0.9, lag=1, maint=0.0825)
    fo = run_futures(F, [x for x in fd if x >= pd.Timestamp("2025-10-16")], Lc, polc * 0.9, lag=1, maint=0.0825)
    fo2 = run_futures(F, [x for x in fd if x >= pd.Timestamp("2025-10-16")], Lc, polc * 0.82, lag=1, maint=0.0825)
    mi17 = model(Lc, polc.values, 0.0825, int(np.searchsorted(idx, pd.Timestamp("2017-03-06"))))
    def S(s, a_, b_): st = mstats(s, a_, b_); return st
    for lab, isr, is17, oos in [("original (claimed)", a[0], None, ao[0]),
                                ("corrected timing+maint 8.25%, model carry", b[0], mi17[0], bo[0]),
                                ("ACTUAL VIOP futures, corrected, lag1, PPF .9pol", None, fi[0], fo[0]),
                                ("ACTUAL VIOP futures, corrected, lag1, PPF .82pol", None, None, fo2[0])]:
        r = dict(Lmax=Lmax, variant=lab)
        if isr is not None:
            s = S(isr, IS_START, IS_END); r.update(IS05_geo=s["geo"], IS05_dd=s["dd"], IS05_worst=s["worst"])
        if is17 is not None:
            s = S(is17, "2017-03-06", IS_END); r.update(IS17_geo=s["geo"], IS17_dd=s["dd"])
        s = S(oos, OOS_START, OOS_END); r.update(OOS_geo13=s["geo"], OOS_per_month=s["geo12"], OOS_x=s["tot"], OOS_dd=s["dd"], OOS_worst=s["worst"])
        rows.append(r)
R = pd.DataFrame(rows); print(R.round(2).to_string(index=False)); R.to_csv("final_table.csv", index=False)
