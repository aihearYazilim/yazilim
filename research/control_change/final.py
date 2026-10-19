"""Seçilen kurallar için aylık seri ve özet (results/final_*.csv)."""
import pickle, pandas as pd
from cc_common import OOS_START, OOS_END, IS_START, stats
H = __import__("pathlib").Path(__file__).parent
L = pickle.load(open(H/"results"/"grid_logs.pkl", "rb"))
sel = ["spa h=0.02 K=5 HMAX=15 cap=100000", "spa h=0.02 K=5 HMAX=15 cap=1000000",
       "spa h=-0.99 K=1 HMAX=15 cap=100000", "spa h=-0.99 K=1 HMAX=15 cap=1000000",
       "early h=-0.99 K=1 HMAX=15 cap=100000", "early h=-0.99 K=1 HMAX=15 cap=1000000"]
out = {}
for s in sel:
    eq = L[s][0]; m = eq.resample("ME").last().pct_change().dropna() * 100
    out[s] = m.round(2)
M = pd.DataFrame(out); M.to_csv(H/"results"/"final_monthly.csv")
pd.set_option("display.width", 250)
print(M.loc[OOS_START - pd.Timedelta(days=20):].to_string())
for s in sel:
    eq = L[s][0]; a = stats(eq, IS_START, OOS_START - pd.Timedelta(days=1)); b = stats(eq, OOS_START, OOS_END); print(s, a, b)
