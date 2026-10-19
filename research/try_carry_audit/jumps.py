import numpy as np, pandas as pd
from audit_lib import *
d = panel(); polc, effc = corrected_rates(d)
real_on = ((polc - d.cpi) / 100 > 0.05)
prev = d.close.shift(1)
hi = d.high / prev - 1; cl = d.close / prev - 1
# use regime known at t-1 (position held into day t)
on = real_on.shift(1).fillna(False)
X = pd.DataFrame({"on": on, "hi": hi, "cl": cl}).dropna()
for nm, sub in [("all IS 2005-2025-10", X.loc[:IS_END]), ("real>5 regime IS", X.loc[:IS_END][X.loc[:IS_END].on]),
                ("real>5 regime OOS", X.loc[OOS_START:][X.loc[OOS_START:].on])]:
    n = len(sub); yrs = n / 260
    print(f"{nm}: days {n} (~{yrs:.1f} yrs)", {f">={k}%": int((sub.hi >= k / 100).sum()) for k in [2, 3, 4.7, 5, 7, 10, 15]},
          "max hi %.1f%%" % (sub.hi.max() * 100))
on_days = X.loc[:IS_END][X.loc[:IS_END].on]
print("real>5 IS jump days >=3% high:"); print((on_days[on_days.hi >= 0.03] * 100).round(2).to_string())
# regime spells
sp = real_on.astype(int).diff().fillna(0)
print("regime switches on:", list(real_on.index[sp == 1].date)); print("off:", list(real_on.index[sp == -1].date))
# 20-day forward max adverse move (close) during on-regime: drawdown risk for 8x
fwd = (d.close.rolling(20).max().shift(-19) / d.close - 1)
print("on-regime: P(20d max rise >=5%)", (fwd[real_on.loc[:IS_END].reindex(fwd.index).fillna(False)] >= 0.05).mean().round(3))
print("\n--- conditional on low realised vol (L target at 8x cap) ---")
lr = np.log(d.close).diff(); vol = lr.rolling(20).std() * np.sqrt(260)
Lt = (0.30 / vol).clip(upper=8)
Y = pd.DataFrame({"L": Lt.shift(1), "hi": hi, "cl": cl, "on": on}).dropna().loc[:OOS_END]
for lo in [7.5, 5, 3]:
    s = Y[Y.L >= lo]
    print(f"L>={lo}: days {len(s)}", {f">={k}%": int((s.hi >= k / 100).sum()) for k in [1, 2, 3, 4.7, 7, 10]},
          "max %.1f%%" % (s.hi.max() * 100), "dates>=3%:", [x.date().isoformat() for x in s.index[s.hi >= 0.03]])
s = Y[(Y.L >= 7.5)]
print("days at cap by year:", s.groupby(s.index.year).size().to_dict())
# loss at 8x when hit: forced close at high*1.005 vs at threshold
for j in [0.05, 0.075, 0.10, 0.15]:
    print(f"jump +{j:.0%}: 8x loss if filled at the jump price {-8*(j+0.005)*100:.0f}% NAV; 5x {-5*(j+0.005)*100:.0f}%; 3x {-3*(j+0.005)*100:.0f}%")
