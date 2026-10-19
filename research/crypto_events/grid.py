"""Grid search. Selection metric: IS (2022-01-01..2025-10-16) daily Sharpe in USD. OOS reported, never used to select."""
import itertools, sys, pathlib, pandas as pd, numpy as np
from multiprocessing import Pool
H = pathlib.Path(__file__).parent; sys.path.insert(0, str(H))
import trades as T, port
IS0 = "2022-01-01"
SIZES = list(itertools.product([0.1, 0.2, 0.3], [1.0, 2.0, 3.0], [0, 1]))
def run_set(key):
    kind = key[0]
    trs = T.unlock_trades(*key[1:]) if kind == "UNL" else T.cms_trades(*key[1:])
    rows = []
    for s, G, hd in SIZES:
        r = port.sim(trs, s, G, hd)
        d = port.report(r, IS0); d.update(dict(key=str(key), s=s, G=G, hedge=hd,
              n_is=sum(1 for t in trs if pd.Timestamp(IS0) <= t["d0"] < pd.Timestamp("2025-10-17")),
              n_oos=sum(1 for t in trs if t["d0"] >= pd.Timestamp("2025-10-17"))))
        rows.append(d)
    return rows
if __name__ == "__main__":
    which = sys.argv[1]
    if which == "UNL":
        keys = [("UNL", thr, N, M, st) for thr in [0.02, 0.03, 0.05, 0.10] for N in [3, 5, 7, 10, 14] for M in [0, 1, 3] for st in [None, 0.3, 0.5, 1.0]]
    else:
        keys = [("CMS", ty, sd, h, st) for ty in ["MON", "DEL", "FDEL", "LIST"] for sd in [-1, 1] for h in [4, 24, 72, 168, 336, 720] for st in [None, 0.2, 0.5]]
    with Pool(8) as p: res = p.map(run_set, keys)
    df = pd.DataFrame([r for x in res for r in x]); df.to_csv(H / f"grid_{which}.csv", index=False)
    print(len(df), "combos")
