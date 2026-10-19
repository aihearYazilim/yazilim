import numpy as np, pandas as pd
from audit_lib import *
from reproduce import model, d
F = futures_panel(); polc, effc = corrected_rates(d)
fd = [pd.Timestamp(x) for x in sorted(F.date.unique())]
s0 = "2017-03-06"; i0 = int(np.searchsorted(d.index, pd.Timestamp(s0)))
rows = []
for Lmax in [8, 5, 3]:
    for nm, rl in [("R3 real>5", 0.05), ("no filter", None)]:
        L0 = signals(d, d.pol, d.cpi, Lmax=Lmax, real_th=rl)
        a = model(L0, d.pol.values, d.pol.values, i0=i0)
        Lc = signals(d, polc, d.cpi, Lmax=Lmax, real_th=rl)
        nav, Lh, nl, nr = run_futures(F, [x for x in fd if x >= pd.Timestamp(s0)], Lc, polc * 0.9, lag=1)
        for lab, s, lh in [("model/orig", a[0], a[1]), ("VIOP/corr,lag1", nav, Lh)]:
            st = mstats(s, s0, IS_END)
            rows.append(dict(cfg=f"{Lmax}x {nm}", src=lab, IS17_geo=st["geo"], IS17_dd=st["dd"], IS17_worst=st["worst"],
                             avgL=lh.loc[s0:IS_END].mean(), liq=nl if lab.startswith("VIOP") else a[2]))
        # yearly
        if Lmax == 8 and rl == 0.05:
            y = pd.DataFrame({"model": a[0].resample("YE").last(), "viop": nav.resample("YE").last()})
            print((y.pct_change() * 100).round(1).to_string())
print(pd.DataFrame(rows).round(2).to_string(index=False))
