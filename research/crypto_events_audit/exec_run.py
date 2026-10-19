import sys; sys.path.insert(0, "/home/user/yazilim/research/crypto_events_audit"); sys.path.insert(0, "/home/user/yazilim/research/crypto_events")
import pandas as pd, numpy as np, exec1m as X, trades as T, port, combo
pd.set_option("display.width", 250)
unl = T.unlock_trades(0.10, 10, 3, 1.0)
def rep(trs, s=0.2):
    d = port.report(port.sim(trs, s, 2.0, 1), "2022-01-01"); return {k: d[k] for k in ["IS_usd", "IS_dd", "OOS_usd", "OOS_try", "OOS_dd", "OOS_worst_usd", "n"]}
orig = [t for k in combo.BOOKS["IS_best"][1:] for t in combo.gen(k)]
rows = {"orig (repo hourly)": rep(unl + orig)}
rows["orig entry, 1m stop path"] = rep(unl + X.cms_book(None))
rows["orig entry, 1m path, stop slip 1%"] = rep(unl + X.cms_book(None, 0, 0.01))
for L in [5, 15, 30, 60]:
    for si in [0.0, 0.005, 0.01]:
        rows[f"entry +{L}m slip_in {si:.1%} stop slip 1%"] = rep(unl + X.cms_book(L, si, 0.01))
print(pd.DataFrame(rows).T.to_string())
# coverage
a = X.cms_book(None); b = X.cms_book(5)
print("n trades orig/1m", len(orig), len(a), len(b))
