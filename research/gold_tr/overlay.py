"""'Short USDTRY (TL carry) + long gold' futures overlays on top of TL deposit. Daily rebal to fixed weights
(cost on turnover + roll: comm 3bp + slip 2bp/side). Grid chosen on IS only (< 2025-10-17)."""
import itertools, numpy as np, pandas as pd
from common import H, OOS0, dep_daily, rep
R = pd.read_pickle(H/"raw/cont.pkl").dropna()
cash = pd.Series(np.asarray(dep_daily(R.index)), index=R.index)
C = 5e-4
def run(hedge, wc, wg, margin=0.10):
    wv = {"usdtry": -wc, hedge: wg}
    gross = sum(w*R[k] for k, w in wv.items())
    # drift turnover approx: |w|*|r| per leg + roll every ~21 (usd) / 42 (gold) trading days (2 sides)
    to = sum(abs(w)*R[k].abs() for k, w in wv.items()) + abs(wc)*2/21 + abs(wg)*2/42
    net = gross - to*C + cash*max(0.0, 1 - margin*(abs(wc)+abs(wg)))
    eq = (1+net).cumprod()
    return eq
res = []
for h, wc, wg in itertools.product(["xauusd","xautry"], [0,1,2,3,4,5], [0,0.25,0.5,1,2]):
    eq = run(h, wc, wg); r = rep(eq, f"{h}_c{wc}_g{wg}"); res.append(r)
df = pd.DataFrame(res).drop_duplicates(subset=["IS_geo","OOS_geo","IS_dd"])
df["IS_ok"] = df.IS_dd > -35
print(df.sort_values("IS_geo", ascending=False).to_string()); df.to_csv(H/"raw/overlay_grid.csv", index=False)
