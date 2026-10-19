from common import R, ORIG
import pandas as pd, numpy as np
from variants import *
U0 = pd.read_pickle(ORIG/"data/ext_unit_h0.05_sk0.0.pkl")
x = U0[(U0.strat=="strangle")&(U0.delta==.3)].reset_index(drop=True)
u = pd.read_pickle("units.pkl")["orig: interp, 5% half-spread"]
m = x.merge(u, on=["day","cur"], how="outer", suffixes=("_o","_a"))
print(len(x), len(u), "r diff max", (m.r_o-m.r_a).abs().max(), "filter mismatch", (m["q365_0.5"]!=m.on).sum())
print(m[m["q365_0.5"]!=m.on][["day","cur","q365_0.5","on"]])
print(m[m.r_o.isna()|m.r_a.isna()][["day","cur","r_o","r_a"]])
