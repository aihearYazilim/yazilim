"""DSR using the empirical dispersion of annualised IS Sharpe across all prior grids (crypto_events) + this gate grid."""
import sys, pathlib, pickle, pandas as pd, numpy as np
from scipy.stats import norm, skew, kurtosis
H = pathlib.Path(__file__).parent; R = H.parent / "crypto_events"
p = pd.concat([pd.read_csv(R / f).IS_sh for f in ["combo_grid.csv", "grid_CMS.csv", "grid_UNL.csv"]]).dropna()
G = pd.read_csv(H / "raw/grid.csv", index_col=0); SER = pickle.load(open(H / "raw/series.pkl", "rb"))
allsr = pd.concat([p, G.IS_sr]); N = 7050 + len(G); sd_ann = allsr.std(); V = (sd_ann / np.sqrt(365)) ** 2
em = 0.5772156649; sr0 = np.sqrt(V) * ((1 - em) * norm.ppf(1 - 1 / N) + em * norm.ppf(1 - 1 / (N * np.e)))
print(f"prior trials with IS_sh: {len(p)}; gate configs: {len(G)}; N={N}; SD(ann IS SR)={sd_ann:.2f}; SR0 (ann) = {sr0*np.sqrt(365):.2f}")
for k in ["UNGATED s=0.2", "UNGATED s=0.1", "EVT|N=90|hi_q0.5|10/20", "EVT|N=60|lo_q0.5|10/20", "TRDFUND|N=7|>0.0001|tri", "BREADTH|M=20|<0.5|0/20", "OWN_MTM|N=45|>0|0/20"]:
    for nm, a, b in [("IS", "2022-01-01", "2025-10-16"), ("OOS", "2025-10-17", "2026-10-16")]:
        r = SER[k][nm][a:b]; T = len(r); sr = r.mean() / r.std(); g3 = skew(r); g4 = kurtosis(r, fisher=False)
        den = np.sqrt(1 - g3 * sr + (g4 - 1) / 4 * sr ** 2)
        print(f"{k:28s} {nm:3s} SR_ann {sr*np.sqrt(365):5.2f}  PSR(0) {norm.cdf(sr*np.sqrt(T-1)/den):.3f}  DSR {norm.cdf((sr-sr0)*np.sqrt(T-1)/den):.3f}")
