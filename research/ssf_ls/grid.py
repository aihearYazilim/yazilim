"""Grid over signal x K x rebalance x book type at gross 2x, lag 0, collateral earns overnight deposit.
Saves daily returns of every config to out/grid_returns.pkl and the summary to out/grid.csv."""
import itertools, multiprocessing as mp, pandas as pd, ls

SIGS = ["c_all", "c_mom_h52", "c_h52_lowvol", "c_mom_lowvol", "c_mom_rev", "mom252_21", "h52", "lowvol60", "rev5",
        "mom126_21"]
KS = [3, 5, 8]
REBS = [5, 10, 21]
MODES = [("dn", None), ("bn", None), ("lx", None), ("loh", "ew20"), ("lor", "ew20"), ("lo", None)]
D = None


def run(cfg):
    sig, K, reb, (mode, reg) = cfg
    r, d = ls.simulate(D, sig=sig, K=K, reb=reb, mode=mode, regime=reg, gross=2.0, details=True, start="2018-01-01")
    s = ls.summ(r, dict(sig=sig, K=K, reb=reb, mode=mode, turn_yr=round(d["tov"].mean() * 252, 1),
                        ncall=d["ncall"]))
    return f"{sig}|{K}|{reb}|{mode}", r, s


if __name__ == "__main__":
    D = ls.data()
    cfgs = list(itertools.product(SIGS, KS, REBS, MODES))
    with mp.get_context("fork").Pool(4) as p:
        res = p.map(run, cfgs, chunksize=4)
    R = pd.DataFrame({k: r for k, r, _ in res})
    R.to_pickle(ls.H / "out/grid_returns.pkl")
    T = pd.DataFrame([s for _, _, s in res])
    T.to_csv(ls.H / "out/grid.csv", index=False)
    print(len(cfgs), "configs")
    pd.set_option("display.width", 200)
    for m in T["mode"].unique():
        print(T[T["mode"] == m].sort_values("IS", ascending=False).head(8).to_string(index=False))
