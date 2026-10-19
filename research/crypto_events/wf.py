"""Walk-forward combined book. Each month M and each sleeve (UNL, MON, DEL, LIST), pick the parameter set with the best
trailing-24-month daily Sharpe of its stand-alone series (s=0.2,G=2,hedge=1), only if that Sharpe > 0; take that
candidate's trades with entry in M. Union of selected trades -> portfolio sim. OOS months never see their own data."""
import sys, pathlib, itertools, pandas as pd, numpy as np
from multiprocessing import Pool
H = pathlib.Path(__file__).parent; sys.path.insert(0, str(H))
import trades as T, port
CANDS = {"UNL": [("UNL", thr, N, M, st) for thr in [0.02, 0.03, 0.05, 0.10] for N in [3, 5, 7, 10, 14] for M in [0, 1, 3] for st in [0.3, 0.5, 1.0]]}
for ty in ["MON", "DEL", "LIST"]:
    CANDS[ty] = [("CMS", ty, -1, h, st) for h in [4, 24, 72, 168, 336, 720] for st in [0.2, 0.5]]
def gen(k): return T.unlock_trades(*k[1:]) if k[0] == "UNL" else T.cms_trades(*k[1:])
def one(k):
    trs = gen(k); return k, trs, port.sim(trs, 0.2, 2.0, 1)
if __name__ == "__main__":
    allk = [k for v in CANDS.values() for k in v]
    with Pool(8) as p: res = p.map(one, allk)
    TR = {k: t for k, t, _ in res}; SR = {k: r for k, _, r in res}
    months = pd.period_range("2022-01", "2026-10", freq="M")
    picks, chosen = {}, []
    for m in months:
        t0 = m.start_time
        for sl, ks in CANDS.items():
            best, bsc = None, 0.0
            for k in ks:
                x = SR[k][(SR[k].index < t0) & (SR[k].index >= t0 - pd.DateOffset(months=24))]
                if (x != 0).sum() < 60 or x.std() == 0: continue
                sc = x.mean() / x.std()
                if sc > bsc: best, bsc = k, sc
            picks[(str(m), sl)] = best
            if best: chosen += [t for t in TR[best] if t["d0"].to_period("M") == m]
    pd.to_pickle(dict(picks=picks), H / "raw/wf_picks.pkl")
    pd.set_option("display.width", 250)
    rows = []
    for s, G in itertools.product([0.1, 0.2, 0.3], [2.0, 3.0]):
        r = port.sim(chosen, s, G, 1); d = port.report(r, "2022-01-01"); d.update(s=s, G=G); rows.append(d)
        if (s, G) == (0.2, 2.0):
            pd.to_pickle(r, H / "raw/wf_series.pkl")
            rt = (1 + r) * (1 + port.fx) - 1
            print("WF s=0.2 G=2 monthly OOS (USD/TRY):")
            print(pd.DataFrame({"usd": (1 + r).resample("ME").prod() - 1, "try": (1 + rt).resample("ME").prod() - 1})["2025-10":].round(3).T.to_string())
            L = pd.DataFrame(r.attrs["log"], columns=["tag", "sym", "d", "n", "ret", "frac"])
            print(L[L.d >= "2025-10-17"].groupby("tag").agg(n=("ret", "size"), mean=("ret", "mean"), hit=("ret", lambda x: (x > 0).mean())).round(3))
    print(pd.DataFrame(rows).to_string())
    pk = pd.Series(picks).unstack()
    print(pk.loc["2025-10":].to_string())
    print("distinct picks per sleeve:", pk.nunique().to_dict())
