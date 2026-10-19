import sys, pathlib, pandas as pd, numpy as np
from multiprocessing import Pool
H = pathlib.Path(__file__).parent; sys.path.insert(0, str(H)); sys.path.insert(0, str(H.parents[0] / "carry")); sys.path.insert(0, str(H.parents[1] / "src"))
import nl_sim, nl_grid, lib
from engine import stats
def ser(g): return nl_sim.sim(*g)
if __name__ == "__main__":
    with Pool(4) as p: S = p.map(ser, nl_grid.GRID, chunksize=16)
    D = pd.DataFrame({str(g): s for g, s in zip(nl_grid.GRID, S)})
    D.to_pickle(H / "nl_series.pkl")
    fx = nl_grid.fx
    for tm, met in [(24, "sharpe"), (36, "sharpe"), (24, "geo"), (12, "sharpe")]:
        ch, picks = lib.walk_forward(D, train_months=tm, metric=met, start="2021-01-01")
        rt = (1 + ch) * (1 + fx.reindex(ch.index)) - 1
        e = (1 + rt).cumprod()
        a = stats(e, "2022-01-01", "2025-10-16"); b = stats(e, "2025-10-17", "2026-10-16")
        print(f"WF {tm}m {met}: IS(2022-25) {a.get('aylik_geo_%')} dd {a.get('maxDD_%')} | OOS {b.get('aylik_geo_%')} dd {b.get('maxDD_%')} worst {b.get('en_kotu_ay_%')}")
        print("  OOS picks:", sorted(set(v for k, v in picks.items() if k >= "2025-10")))
    best = (1, 60, 0.5, 0.2, 2.0, 1, 0)
    r = D[str(best)]; rt = (1 + r) * (1 + fx) - 1; e = (1 + rt).cumprod(); eu = (1 + r).cumprod()
    print("best yearly USD:", eu.resample("YE").last().pct_change().round(3).tolist())
    m = eu.resample("ME").last().pct_change()
    print("OOS months USD:", m["2025-10":].round(3).tolist())
