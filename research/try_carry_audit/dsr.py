import numpy as np, pandas as pd
from statistics import NormalDist
class norm:
    cdf=staticmethod(lambda x: NormalDist().cdf(x)); ppf=staticmethod(lambda p: NormalDist().inv_cdf(p))
def skew(x): x=np.asarray(x); return ((x-x.mean())**3).mean()/x.std()**3
def kurtosis(x, fisher=False): x=np.asarray(x); return ((x-x.mean())**4).mean()/x.std()**4
from audit_lib import *
from reproduce import model, d
R = pd.read_csv(ORIG / "grid.csv")
L = signals(d, d.pol, d.cpi)
nav = model(L, d.pol.values, d.pol.values)[0].loc[IS_START:IS_END]
days, _, _ = calendar(d.index)
ppf = pd.Series((1 + 0.9 * d.pol.values / 100) ** (days / 365) - 1, d.index).loc[IS_START:IS_END]
r = nav.pct_change().dropna(); ex = (r - ppf.reindex(r.index)).values
sr_d = ex.mean() / ex.std(); T = len(ex)
print("R3 IS daily excess-over-PPF SR %.4f  annual %.2f ; total-return SR (as reported) %.2f" % (sr_d, sr_d * np.sqrt(260), r.mean() / r.std() * np.sqrt(260)))
sk, ku = skew(ex), kurtosis(ex, fisher=False); print("skew %.2f kurt %.1f T %d" % (sk, ku, T))
# trials SR variance: grid reported total-return SR; convert crude: use cross-sectional std of IS_sh (annual) as proxy
N = len(R); V = (R.IS_sh.replace([np.inf, -np.inf], np.nan).dropna() / np.sqrt(260)).var()
g = 0.5772156649
for Neff in [N, 1000, 100]:
    sr0 = np.sqrt(V) * ((1 - g) * norm.ppf(1 - 1 / Neff) + g * norm.ppf(1 - 1 / (Neff * np.e)))
    z = (sr_d - sr0) * np.sqrt(T - 1) / np.sqrt(1 - sk * sr_d + (ku - 1) / 4 * sr_d ** 2)
    print(f"N_eff={Neff}: SR0(daily)={sr0:.4f} (annual {sr0*np.sqrt(260):.2f}) DSR={norm.cdf(z):.3f}")
# plain PSR of excess SR > 0
z0 = sr_d * np.sqrt(T - 1) / np.sqrt(1 - sk * sr_d + (ku - 1) / 4 * sr_d ** 2); print("PSR(excess SR>0) = %.3f" % norm.cdf(z0))
# IS excess monthly
m = nav.resample("ME").last().pct_change().dropna(); pm = (1 + ppf).resample("ME").prod() - 1
print("IS months with exposure: %.0f%%" % (100 * (L.loc[IS_START:IS_END] > 0).mean()))
print("IS geo excess over PPF per month: %.2f%%" % (((1 + m).prod() / (1 + pm.reindex(m.index)).prod()) ** (1 / len(m)) * 100 - 100))
