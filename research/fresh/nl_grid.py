import sys, pathlib, itertools, pandas as pd, numpy as np
from multiprocessing import Pool
H = pathlib.Path(__file__).parent; sys.path.insert(0, str(H)); sys.path.insert(0, str(H.parents[1] / "src"))
import nl_sim
from engine import stats
fx = pd.read_csv(H.parents[1] / "data/bist/USDTRY.csv", index_col=0, parse_dates=True)["close"]
fx = fx.reindex(nl_sim.IDX).ffill().pct_change().fillna(0)
GRID = list(itertools.product([1, 3, 7], [14, 30, 60, 90], [None, 1.0, 0.5, 0.3], [0.05, 0.10, 0.20], [1.0, 2.0, 3.0], [0, 1], [0, 1]))
def st(r, a, b):
    s = stats((1 + r).cumprod(), a, b); return s.get("aylik_geo_%"), s.get("maxDD_%"), s.get("en_kotu_ay_%")
def one(g):
    L, Hd, stop, s, G, hedge, nt = g
    r = nl_sim.sim(L, Hd, stop, s, G, hedge, nt)
    rt = (1 + r) * (1 + fx) - 1
    d = r["2020-01-15":"2025-10-16"]
    sh = d.mean() / d.std() * np.sqrt(365) if d.std() > 0 else np.nan
    isg, isdd, _ = st(rt, "2020-01-15", "2025-10-16"); oog, oodd, oow = st(rt, "2025-10-17", "2026-10-16")
    ug = st(r, "2025-10-17", "2026-10-16")[0]
    return dict(L=L, H=Hd, stop=stop, s=s, G=G, hedge=hedge, newtok=nt, IS_sharpe_usd=sh, IS_geo_try=isg, IS_dd=isdd,
                OOS_geo_try=oog, OOS_geo_usd=ug, OOS_dd=oodd, OOS_worst=oow)
if __name__ == "__main__":
    with Pool(8) as p: rows = p.map(one, GRID, chunksize=8)
    df = pd.DataFrame(rows); df.to_csv(H / "nl_grid.csv", index=False)
    print(len(df), "combos")
    print(df.sort_values("IS_sharpe_usd", ascending=False).head(15).round(2).to_string())
    print(df.describe().round(2).to_string())
