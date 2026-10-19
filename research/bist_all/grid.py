"""Tüm kombinasyonları koş, günlük net getirileri kaydet (walk-forward seçim için)."""
import itertools, pickle, time, pathlib, os
import numpy as np, pandas as pd
from multiprocessing import Pool
import common as C, signals as SG

OUT = pathlib.Path(__file__).resolve().parent / "out"
OUT.mkdir(exist_ok=True)
P = C.load_all(); S = SG.build(P); R = SG.regimes(P)

TOPS = [5, 10, 20]
REBS = [1, 5, 21]
LAG = int(os.environ.get("LAG", "0"))

def job(key):
    sig, reg, top, reb = key
    r, tov = C.simulate(P, S[sig], top=top, rebalance=reb, regime=R[reg], lag=LAG, return_details=True)
    return key, r, tov

if __name__ == "__main__":
    keys = list(itertools.product(S.keys(), R.keys(), TOPS, REBS))
    print(len(keys), "kombinasyon", flush=True)
    t = time.time()
    rets, tovs = {}, {}
    with Pool(os.cpu_count()) as p:
        for i, (k, r, tv) in enumerate(p.imap_unordered(job, keys, chunksize=4)):
            rets[k] = r; tovs[k] = tv
            if i % 100 == 0:
                print(i, round(time.time() - t), flush=True)
    R_ = pd.DataFrame(rets); T_ = pd.DataFrame(tovs)
    pickle.dump((R_, T_), open(OUT / f"grid_lag{LAG}.pkl", "wb"))
    rows = []
    for k in R_.columns:
        d = dict(zip(["sig", "reg", "top", "reb"], k)); d.update(C.summarize(R_[k], T_[k])); rows.append(d)
    df = pd.DataFrame(rows).sort_values("IS_geo", ascending=False)
    df.to_csv(OUT / f"grid_lag{LAG}.csv", index=False)
    pd.set_option("display.width", 250)
    print(df.head(30).to_string(index=False))
    print("OOS'ta en iyi 10 (sadece bilgi; seçimde KULLANILMAZ):")
    print(df.sort_values("OOS_geo", ascending=False).head(10).to_string(index=False))
