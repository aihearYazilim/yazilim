"""IS (2020-01..2025-10-16) üzerinde kural ızgarası; OOS sadece raporlamak için hesaplanır (seçimde kullanılmaz)."""
import itertools, pickle, numpy as np, pandas as pd
from sim import *
E = load_events(); px = load_px(set(E.ticker))
xu = pd.read_csv(H.parents[1]/"data"/"bist"/"XU100.csv", index_col=0, parse_dates=True)["close"]
xu_ok = (xu > xu.rolling(50).mean())
exits = {"start": [("H", h) for h in [5, 10, 20, 40, 60, 90, 120]] + [("appr", 0), ("appr", 1), ("appr", 3), ("ex", 0), ("ex", 5)],
         "appr": [("H", h) for h in [3, 5, 10, 20, 40]] + [("ex", 0), ("ex", 5)],
         "ex": [("H", h) for h in [3, 5, 10, 20, 40, 60]]}
res = []; curves = {}
for anchor, ex_list in exits.items():
    for ex_rule, mf in itertools.product(ex_list, [False, True]):
        sch = schedule(E, px, anchor, ex_rule, xu_ok=xu_ok if mf else None)
        for K, stop in itertools.product([5, 10, 20], [None, 0.15]):
            eq, tr = simulate(sch, px, K=K, stop=stop)
            a = stats(eq, "2020-01-01", "2025-10-16"); b = stats(eq, "2025-10-17", "2026-10-16")
            ntr_is = int((tr.entry < OOS_START).sum()); ntr_oos = int((tr.entry >= OOS_START).sum())
            key = (anchor, f"{ex_rule[0]}{ex_rule[1]}", mf, K, stop)
            curves[key] = eq
            res.append(dict(anchor=anchor, exit=f"{ex_rule[0]}{ex_rule[1]}", mkt=mf, K=K, stop=stop,
                            IS_geo=a["aylik_geo_%"], IS_dd=a["maxDD_%"], IS_worst=a["en_kotu_ay_%"], IS_n=ntr_is,
                            IS_trade_mean=round(tr[tr.entry < OOS_START].ret.mean() * 100, 2),
                            OOS_geo=b["aylik_geo_%"], OOS_dd=b["maxDD_%"], OOS_worst=b["en_kotu_ay_%"], OOS_n=ntr_oos,
                            OOS_trade_mean=round(tr[tr.entry >= OOS_START].ret.mean() * 100, 2)))
            print(res[-1], flush=True)
R = pd.DataFrame(res); R.to_csv(H/"results"/"grid.csv", index=False)
pickle.dump(curves, open(H/"results"/"curves.pkl", "wb"))
