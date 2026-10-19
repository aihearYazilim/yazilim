"""Kural ızgarası (ex ante): olay türü x h x K x HMAX; portföy 100k ve 1M TL, likidite %1, pozisyon başı en fazla özsermayenin %25'i, boşta para PPF.
Seçim yalnız IS (2019-01..2025-10-16) aylık geo ile; OOS raporlanır."""
import pandas as pd, numpy as np, itertools
from sim import *
rows = []; logs = {}
for ev, h, K, HM in itertools.product(["spa", "early"], [-0.99, -0.3, -0.2, -0.1, 0.0, 0.02, 0.05, 0.1], [1, 5], [6, 15]):
    D = load(ev); T = []; reasons = {}
    for _, g in D.iterrows():
        t, why = trade(g, h=h, K=K, HMAX=HM)
        if t: T.append(t)
        reasons[why] = reasons.get(why, 0) + 1
    for cap in [100_000, 1_000_000]:
        eq, log = simulate(T, cap, max_frac=0.25, liq=0.01)
        r = report(eq, log, f"{ev} h={h} K={K} HMAX={HM} cap={cap}")
        r.update(ev=ev, h=h, K=K, HMAX=HM, cap=cap, n_sig=len(T), n_sig_oos=sum(t["d0"] >= OOS_START for t in T),
                 deals=",".join(sorted({o["deal"] + ("*" if o["d0"] >= OOS_START else "") for o in log})))
        rows.append(r); logs[r["label"]] = (eq, log)
R = pd.DataFrame(rows); R.to_csv(H/"results"/"grid.csv", index=False)
pd.set_option("display.width", 250); pd.set_option("display.max_rows", 300); pd.set_option("display.max_colwidth", 60)
print(R[["label", "n_sig", "n_sig_oos", "n_IS", "n_OOS", "IS_geo%", "IS_maxDD%", "OOS_geo%", "OOS_maxDD%", "OOS_worst%", "pnl_IS_TL", "pnl_OOS_TL"]].to_string())
import pickle; pickle.dump({k: (v[0], [{kk: vv for kk, vv in o.items() if kk != "path"} for o in v[1]]) for k, v in logs.items()}, open(H/"results"/"grid_logs.pkl", "wb"))
