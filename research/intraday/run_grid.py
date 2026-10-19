"""Compute daily net-return series for every strategy combination (all freqs/universes/modes/params).
Output: out/grid.npz (ret_L{1,2,3,5}, minpath, trades, turn) + out/combos.csv
"""
import sys, itertools, numpy as np, pandas as pd
from multiprocessing import Pool
sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent))
import lib

MODES = ["LS", "LO", "SO"]
UNIS = list(lib.UNIVERSES)

def tasks():
    T = []
    for fq in ["1h", "4h"]:
        for lb in [12, 24, 48, 96, 168, 336, 720]:
            if fq == "4h" and lb < 24: continue
            T.append((fq, "tsmom", dict(lb=lb)))
        for f, s in [(6, 24), (12, 48), (24, 96), (48, 192), (96, 384), (168, 672)]:
            if fq == "4h" and f < 12: continue
            T.append((fq, "ema", dict(f=f, s=s)))
        for n in [24, 48, 96, 168, 336, 720]:
            T.append((fq, "donchian", dict(n=n)))
        for n in [6, 14, 24]:
            for lo, hi in [(20, 80), (30, 70)]:
                T.append((fq, "rsi", dict(n=n, lo=lo, hi=hi)))
        for n in [24, 48, 168]:
            for k in [1.5, 2.0, 2.5]:
                T.append((fq, "boll", dict(n=n, k=k)))
        for k in [1, 4, 12, 24]:
            if fq == "4h" and k < 4: continue
            T.append((fq, "reversal", dict(k=k)))
        for thr in [1.0, 1.3]:
            for lb in [48, 168]:
                for la in ["MR", "flat"]:
                    for o in ["trend_hi", "trend_lo"]:
                        T.append((fq, "volregime", dict(thr=thr, lb=lb, low_action=la, orient=o)))
        for kind in ["E1", "E2", "E3"]:
            T.append((fq, "ensemble", dict(kind=kind)))
        for lb in [1, 4, 12, 24, 72, 168, 336]:
            if fq == "4h" and lb < 4: continue
            for d in ["mom", "rev"]:
                T.append((fq, "xs", dict(lb=lb, direction=d)))
    for b in ["hod", "dow", "how"]:
        for W in [180, 365, 730]:
            for thr in [1.0, 2.0, 3.0]:
                T.append(("1h", "season", dict(bucket=b, W=W, thr=thr)))
    return T

DATA = {}
def get(fq):
    if fq not in DATA: DATA[fq] = lib.load(fq)
    return DATA[fq]

SIGF = {"tsmom": lib.sig_tsmom, "ema": lib.sig_ema, "donchian": lib.sig_donchian, "rsi": lib.sig_rsi,
        "boll": lib.sig_boll, "reversal": lib.sig_reversal, "volregime": lib.sig_volregime, "ensemble": lib.sig_ensemble}

def run(task):
    fq, fam, p = task
    D = get(fq); res = []
    if fam == "xs":
        cols = lib.UNIVERSES["ALL19"]
        w = lib.weights_xs(D, fq, cols, **p)
        jobs = [("ALL19", "MN", w)]
    elif fam == "season":
        jobs = []
        for u in ["BTC", "MAJ3", "ALL19"]:
            cols = lib.UNIVERSES[u]
            s = lib.sig_season(D, fq, cols, **p)
            for m in ["LS", "LO", "SO"]:
                jobs.append((u, m, lib.to_weights(lib.apply_mode(s, m), D, fq, cols)))
    else:
        s_all = SIGF[fam](D, fq, **p)
        jobs = []
        for u in UNIS:
            cols = lib.UNIVERSES[u]
            for m in MODES:
                jobs.append((u, m, lib.to_weights(lib.apply_mode(s_all[cols], m), D, fq, cols)))
    for u, m, w in jobs:
        cols = list(w.columns)
        arr = lib.bar_arrays(w, D, fq, cols)
        days, out = lib.daily_from_bars(w.index, fq, *arr)
        name = f"{fq}|{fam}|{u}|{m}|" + ",".join(f"{k}={v}" for k, v in p.items())
        res.append((name, fq, fam, u, m, str(p), days, out))
    return res

if __name__ == "__main__":
    T = tasks()
    print(len(T), "tasks", flush=True)
    with Pool(4) as pool:
        allres = []
        for i, r in enumerate(pool.imap_unordered(run, T)):
            allres += r
            if i % 20 == 0: print(i, len(allres), flush=True)
    allres.sort(key=lambda x: x[0])
    days = allres[0][6]
    meta = pd.DataFrame([dict(name=a[0], freq=a[1], family=a[2], universe=a[3], mode=a[4], params=a[5]) for a in allres])
    meta.to_csv("/home/user/yazilim/research/intraday/out/combos.csv", index=False)
    store = {f"ret_L{L}": np.array([a[7][L] for a in allres], dtype=np.float32) for L in lib.LEVS}
    for k in ["minpath", "trades", "turn"]:
        store[k] = np.array([a[7][k] for a in allres], dtype=np.float32)
    store["days"] = days.values.astype("datetime64[D]").astype(str)
    np.savez_compressed("/home/user/yazilim/research/intraday/out/grid.npz", **store)
    print("combos", len(meta))
