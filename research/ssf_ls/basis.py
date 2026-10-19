"""Is SSF basis fair? (1) implied annual simple rate of the front SSF vs spot close: (F/S-1)*365/d,
(2) realised drag: spot total return (dividend-adjusted) minus futures return of the continuous front series,
annualised per year, compared with the gross 1-3m TL deposit rate and the policy rate.
Uses only liquid underlyings (20d median futures value >= 10M TL real) and 5 <= d <= 45 calendar days."""
import numpy as np, pandas as pd, ls
from deposit_v5 import gross

D = ls.data()
days = D["days"]
F = D["fset"]; S = D["raw"].where(D["traded"])
dte = pd.DataFrame({u: (pd.to_datetime(D["fexp"][u]) - pd.Series(days, index=days)).dt.days for u in D["unds"]})
cf = ls.cap_series(days) / ls.CAP
liq = D["medval"].div(cf, axis=0) >= 1e7
imp = ((F / S - 1) * 365 / dte).where(liq & (dte >= 5) & (dte <= 45))
imp = imp.where(imp.abs() < 3)
m_imp = imp.median(axis=1).resample("ME").median()
dep = gross(m_imp.index)
pol = pd.Series(np.nan, index=m_imp.index)
import engine
for k, v in sorted(engine.POLICY.items()):
    pol[pol.index >= pd.Timestamp(k + "-01")] = v / 100
tab = pd.DataFrame({"implied": m_imp, "deposit_gross": dep.values, "policy": pol.ffill().values})
y = tab.groupby(tab.index.year).mean().round(3)
print("implied annual simple rate in front SSF (median of liquid names), yearly means of monthly medians")
print(y)
oos = tab.loc[ls.OOS_START:]
print("OOS mean implied %.3f deposit %.3f" % (oos.implied.mean(), oos.deposit_gross.mean()))
# realised drag: equal-weight liquid names, spot (div-adjusted) minus futures, annualised
fr = D["fret"].where(liq.shift(1).fillna(False).astype(bool))
sr = D["ret"].where(fr.notna())
dd = (sr.mean(axis=1) - fr.mean(axis=1)).fillna(0)
ann = dd.groupby(dd.index.year).mean() * 252
print("realised spot-minus-futures drag, annualised:", ann.round(3).to_dict())
print("OOS drag annualised: %.3f" % (dd.loc[ls.OOS_START:].mean() * 252))
tab.to_csv(ls.H / "out/basis_monthly.csv")
