"""Audit: OOS distribution of 4-sleeve books whose sleeves are random draws from IS-reasonable configs
(short, stop set, sleeve IS Sharpe > 0.5 at s=.2,G=2,hedge=1), simulated with the ORIGINAL port.sim (s=.2,G=2,hedge=1)."""
import sys; sys.path.insert(0, "/home/user/yazilim/research/crypto_events")
import pandas as pd, numpy as np, ast, pickle
from multiprocessing import Pool
import trades as T, port, combo
G = pd.concat([pd.read_csv("/home/user/yazilim/research/crypto_events/grid_UNL.csv"), pd.read_csv("/home/user/yazilim/research/crypto_events/grid_CMS.csv")])
x = G[(G.s == 0.2) & (G.G == 2) & (G.hedge == 1) & ~G.key.str.contains("None") & (G.IS_sh > 0.5)].copy()
x["k"] = x.key.apply(ast.literal_eval)
x = x[x.k.apply(lambda k: k[0] == "UNL" or k[2] == -1)]
x["sl"] = x.k.apply(lambda k: "UNL" if k[0] == "UNL" else k[1])
x = x[x.sl.isin(["UNL", "MON", "DEL", "LIST"])]
POOL = {sl: list(g.k) for sl, g in x.groupby("sl")}
print({k: len(v) for k, v in POOL.items()})
def gen(k): return k, combo.gen(k)
def run(keys):
    trs = [t for k in keys for t in TR[k]]
    d = port.report(port.sim(trs, 0.2, 2.0, 1), "2022-01-01"); return dict(keys=str(keys), IS_sh=d["IS_sh"], IS_usd=d["IS_usd"], OOS_usd=d["OOS_usd"], OOS_try=d["OOS_try"], OOS_dd=d["OOS_dd"])
if __name__ == "__main__":
    allk = [k for v in POOL.values() for k in v]
    with Pool(4) as p: TR = dict(p.map(gen, allk))
    rng = np.random.default_rng(0)
    books = [tuple(POOL[sl][rng.integers(len(POOL[sl]))] for sl in ["UNL", "MON", "DEL", "LIST"]) for _ in range(300)]
    with Pool(4) as p: R = pd.DataFrame(p.map(run, books))
    R.to_csv("randbooks.csv", index=False)
    print(R[["IS_sh", "IS_usd", "OOS_usd", "OOS_try", "OOS_dd"]].describe(percentiles=[.05, .25, .5, .75, .95]).round(2).to_string())
    from scipy.stats import spearmanr
    print("rank corr IS_sh vs OOS_usd across books:", round(spearmanr(R.IS_sh, R.OOS_usd).correlation, 2))
    print("share of books with OOS_usd >= 10:", (R.OOS_usd >= 10).mean(), " >=5:", (R.OOS_usd >= 5).mean())
