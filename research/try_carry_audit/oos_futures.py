import numpy as np, pandas as pd
from audit_lib import *
from reproduce import model, I0, d
pd.set_option("display.width", 220)
F = futures_panel()
polc, effc = corrected_rates(d)
fdates = sorted(F.date.unique())
fdates = [pd.Timestamp(x) for x in fdates]
def fut_run(L, ppf, start, lag=1, **kw):
    ds = [x for x in fdates if x >= pd.Timestamp(start)]
    return run_futures(F, ds, L, ppf, lag=lag, **kw)
rows = []
def add(name, nav, Lh, extra=""):
    o = mstats(nav, OOS_START, OOS_END)
    rows.append(dict(variant=name, OOS_geo13=o["geo"], OOS_geo_per_month=o["geo12"], OOS_tot=o["tot"], OOS_dd=o["dd"],
                     OOS_worst=o["worst"], avgL=Lh.loc[OOS_START:].mean()))
oos0 = "2025-10-16"
for Lmax in [8, 5, 3]:
    L0 = signals(d, d.pol, d.cpi, Lmax=Lmax)
    a = model(L0, d.pol.values, d.pol.values, i0=I0); add(f"{Lmax}x A model, original inputs", a[0], a[1])
    Lc = signals(d, polc, d.cpi, Lmax=Lmax)
    b = model(Lc, polc.values, polc.values, i0=I0); add(f"{Lmax}x B model, decision-dated policy", b[0], b[1])
    Le = signals(d, effc, d.cpi, Lmax=Lmax)
    c = model(Le, effc.values, effc.values, i0=I0); add(f"{Lmax}x C model, eff.funding for filter/PPF/carry", c[0], c[1])
    for lag in [0, 1]:
        nav, Lh, nl, nr = fut_run(L0, d.pol * 0.9, oos0, lag=lag); add(f"{Lmax}x D VIOP actual, orig filter, PPF .9pol, lag{lag}", nav, Lh)
    nav, Lh, nl, nr = fut_run(Lc, polc * 0.9, oos0); add(f"{Lmax}x E VIOP actual, corr policy filter, PPF .9pol, lag1", nav, Lh)
    nav, Lh, nl, nr = fut_run(Le, effc * 0.9, oos0); add(f"{Lmax}x F VIOP actual, eff-rate filter, PPF .9eff, lag1", nav, Lh)
    nav, Lh, nl, nr = fut_run(Lc, polc * 0.82, oos0); add(f"{Lmax}x G VIOP actual, corr filter, PPF .82pol (17.5% stopaj+fee), lag1", nav, Lh)
    Lnf = signals(d, polc, d.cpi, Lmax=Lmax, real_th=None)
    nav, Lh, nl, nr = fut_run(Lnf, polc * 0.9, oos0); add(f"{Lmax}x H VIOP actual, NO real filter, lag1", nav, Lh)
R = pd.DataFrame(rows); print(R.round(2).to_string(index=False))
R.to_csv("oos_variants.csv", index=False)
# monthly decomposition for 8x D vs A
L0 = signals(d, d.pol, d.cpi)
a = model(L0, d.pol.values, d.pol.values, i0=I0)[0]
nav = fut_run(L0, d.pol * 0.9, oos0, lag=0)[0]
m = pd.DataFrame({"model": a.resample("ME").last(), "viop": nav.resample("ME").last()})
m = pd.concat([pd.DataFrame({"model": [1.0], "viop": [1.0]}, index=[pd.Timestamp("2025-10-15")]), m]).pct_change().dropna() * 100
print(m.round(2).to_string())
