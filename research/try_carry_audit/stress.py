"""Jump stress on the ACTUAL VİOP OOS path: inject a Mar-2025-type shock (intraday +j, settle +0.43j, level persists)
at each OOS month's 5th trading day; Takasbank maintenance 8.25% (=0.75*11% initial)."""
import numpy as np, pandas as pd
from audit_lib import *
d = panel(); polc, effc = corrected_rates(d)
F0 = futures_panel()
fd = [pd.Timestamp(x) for x in sorted(F0.date.unique()) if pd.Timestamp(x) >= pd.Timestamp("2025-10-16")]
months = pd.Series(fd, index=fd).groupby(pd.Series(fd, index=fd).dt.to_period("M")).apply(lambda s: s.iloc[min(4, len(s)-1)])
def shocked(jd, j):
    k = 0.43 * j
    F = F0.copy(); m = F.date >= jd
    for c in ["settle", "high", "low", "open", "close"]:
        F.loc[m, c] = F.loc[m, c] * (1 + k)
    # jump-day high = prev settle*(1+j)
    prevd = max(x for x in fd if x < jd)
    ps = F0[F0.date == prevd].set_index("code").settle
    mm = F.date == jd
    F.loc[mm, "high"] = F.loc[mm, "code"].map(ps).values * (1 + j)
    dd = d.copy(); dd.loc[dd.index >= jd, "close"] *= (1 + k)
    return F, dd
rows = []
for Lmax in [8, 5, 3]:
    for j in [0.05, 0.10, 0.15]:
        res = []
        for jd in months.values[:-1]:
            jd = pd.Timestamp(jd)
            F, dd = shocked(jd, j)
            L = signals(dd, polc, dd.cpi, Lmax=Lmax)
            for maint in [0.0825]:
                nav, Lh, nl, nr = run_futures(F, fd, L, polc * 0.9, lag=1, maint=maint, slip=0.005)
                st = mstats(nav, OOS_START, OOS_END); res.append((st["geo12"], st["dd"], nl))
        r = np.array(res)
        rows.append(dict(Lmax=Lmax, jump=j, OOS_permonth_median=np.median(r[:, 0]), OOS_permonth_worst=r[:, 0].min(),
                         maxDD_median=np.median(r[:, 1]), maxDD_worst=r[:, 1].min(), liquidations=int(r[:, 2].sum()), n=len(r)))
    nav, Lh, nl, nr = run_futures(F0, fd, signals(d, polc, d.cpi, Lmax=Lmax), polc * 0.9, lag=1, maint=0.0825)
    st = mstats(nav, OOS_START, OOS_END); rows.append(dict(Lmax=Lmax, jump=0, OOS_permonth_median=st["geo12"], maxDD_median=st["dd"]))
print(pd.DataFrame(rows).round(2).to_string(index=False))
