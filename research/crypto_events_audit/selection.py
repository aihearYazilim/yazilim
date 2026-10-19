"""Audit: multiple-testing. (a) per-sleeve IS->OOS rank correlation across grid configs (s=.2,G=2,hedge=1).
(b) OOS distribution of random 4-sleeve books built only from IS-reasonable sleeve configs (stop set, IS_sh>0.5).
(c) Deflated Sharpe Ratio of the chosen book."""
import sys; sys.path.insert(0, "/home/user/yazilim/research/crypto_events")
import pandas as pd, numpy as np, ast
from scipy.stats import spearmanr, norm, skew, kurtosis
pd.set_option("display.width", 250)
G = pd.concat([pd.read_csv("/home/user/yazilim/research/crypto_events/grid_UNL.csv"), pd.read_csv("/home/user/yazilim/research/crypto_events/grid_CMS.csv")])
G["k"] = G.key.apply(ast.literal_eval)
G["sleeve"] = G.k.apply(lambda k: "UNL" if k[0] == "UNL" else k[1])
x = G[(G.s == 0.2) & (G.G == 2) & (G.hedge == 1)]
for sl, g in x.groupby("sleeve"):
    rho = spearmanr(g.IS_sh, g.OOS_usd).correlation
    gs = g[~g.key.str.contains("None")]
    print(f"{sl}: n={len(g)} rank corr IS_sh vs OOS_usd = {rho:+.2f}; IS_sh>0.5&stop: n={(gs.IS_sh>0.5).sum()}, OOS_usd median {gs[gs.IS_sh>0.5].OOS_usd.median():.2f} (all-config median {g.OOS_usd.median():.2f})")
print("total grid rows", len(G), "+ combo 128")
# DSR
s = pd.read_pickle("/home/user/yazilim/research/crypto_events/raw/combo_series.pkl")[("IS_best", 0.2, 2.0, 1)]["2022-01-01":"2025-10-16"]
sr = s.mean() / s.std(); T_ = len(s); g3 = skew(s); g4 = kurtosis(s, fisher=False)
trial_sr = x.IS_sh / np.sqrt(365)   # per-day Sharpe of the sleeve trials
for N, V in [(7040, trial_sr.var()), (216, trial_sr.var()), (50, trial_sr.var())]:
    emax = np.sqrt(V) * ((1 - 0.5772) * norm.ppf(1 - 1 / N) + 0.5772 * norm.ppf(1 - 1 / (N * np.e)))
    z = (sr - emax) * np.sqrt(T_ - 1) / np.sqrt(1 - g3 * sr + (g4 - 1) / 4 * sr ** 2)
    print(f"DSR N={N}: daily SR={sr:.3f} (ann {sr*np.sqrt(365):.2f}), E[max SR]={emax:.3f}, skew={g3:.2f}, kurt={g4:.1f}, DSR prob={norm.cdf(z):.3f}")
# IS Sharpe by sub-period
for a, b in [("2022-01-01", "2023-12-31"), ("2024-01-01", "2024-12-31"), ("2025-01-01", "2025-10-16")]:
    y = s[a:b]; print(a, b, "ann SR", round(y.mean() / y.std() * np.sqrt(365), 2), "geo/mo %", round(((1 + y).prod() ** (30.44 / len(y)) - 1) * 100, 2))
