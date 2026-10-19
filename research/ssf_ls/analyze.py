"""Selection (IS only), walk-forward chain, leverage / collateral / lag / cost sensitivity, neighbours, capacity."""
import numpy as np, pandas as pd, ls
pd.set_option("display.width", 220); pd.set_option("display.max_columns", 30)
D = ls.data()
R = pd.read_pickle(ls.H / "out/grid_returns.pkl")
T = pd.read_csv(ls.H / "out/grid.csv")
T["key"] = T.sig + "|" + T.K.astype(str) + "|" + T.reb.astype(str) + "|" + T["mode"]
OS, OE = ls.OOS_START, ls.OOS_END


def geo(r, a, b):
    x = r.loc[a:b]
    return ((1 + x).prod() ** (1 / max(1, len(x) / 21)) - 1) * 100


# ---------- 1. walk-forward: each month pick best trailing-24m config, apply next month ----------
def wf(cols, crit="sharpe", look=24, switch_cost=0.004):
    me = R.index.to_series().groupby(R.index.to_period("M")).last()
    out = []; prev = None; picks = []
    for i in range(look, len(me) - 1):
        a = me.iloc[i - look]; b = me.iloc[i]; nxt = R.loc[b:me.iloc[i + 1]].iloc[1:]
        h = R.loc[a:b, cols].iloc[1:]
        if crit == "sharpe":
            m = h.mean() / h.std().replace(0, np.nan)
        else:
            m = (1 + h).prod()
        best = m.idxmax()
        x = nxt[best].copy()
        if prev is not None and best != prev and len(x):
            x.iloc[0] -= switch_cost
        prev = best; picks.append((b, best)); out.append(x)
    return pd.concat(out), picks


print("=== walk-forward chains (gross 2x, collateral earns ON deposit) ===")
rows = []
for name, cols in [("LS (dn+bn)", T[T["mode"].isin(["dn", "bn"])].key.tolist()),
                   ("all modes", T.key.tolist()),
                   ("long-hedged (lx,loh,lor)", T[T["mode"].isin(["lx", "loh", "lor"])].key.tolist())]:
    for crit in ["sharpe", "ret"]:
        for look in [12, 24, 36]:
            r, p = wf(cols, crit, look)
            rows.append(dict(set=name, crit=crit, look=look, **ls.summ(r), last_pick=p[-1][1]))
W = pd.DataFrame(rows); print(W.to_string(index=False))
W.to_csv(ls.H / "out/wf.csv", index=False)

# ---------- 2. fixed configs chosen on IS ----------
cands = {
    "A_IS-best LS (h52 K8 m bn)": dict(sig="h52", K=8, reb=21, mode="bn"),
    "B_pre-registered c_all K5 m bn": dict(sig="c_all", K=5, reb=21, mode="bn"),
    "C_IS-best lor (c_all K3 m)": dict(sig="c_all", K=3, reb=21, mode="lor", regime="ew20"),
    "D_c_all K8 m bn": dict(sig="c_all", K=8, reb=21, mode="bn"),
}
print("\n=== fixed configs: gross x collateral x lag x cost ===")
rows = []
for nm, c in cands.items():
    for g in [1, 2, 3, 4]:
        for coll in ["dep", "zero"]:
            for lag in [0, 1]:
                for sm in [1.0, 2.0]:
                    if (lag == 1 or sm == 2.0) and (g != 2 or coll != "dep"):
                        continue
                    r, d = ls.simulate(D, gross=g, coll=coll, lag=lag, slip_mult=sm, details=True, start="2018-01-01", **c)
                    rows.append(dict(cfg=nm, gross=g, coll=coll, lag=lag, slip=sm, **ls.summ(r),
                                     turn_yr=round(d["tov"].loc["2020":].mean() * 252, 1), mcalls=d["ncall"]))
F = pd.DataFrame(rows); print(F.to_string(index=False)); F.to_csv(ls.H / "out/fixed.csv", index=False)

# ---------- 3. neighbours of A and B (gross 2, dep) ----------
print("\n=== neighbours (gross 2x, dep) ===")
for base in ["h52|8|21|bn", "c_all|5|21|bn"]:
    s, K, reb, m = base.split("|")
    nb = T[((T.sig == s) & (T["mode"].isin(["bn", "dn"]))) | ((T.K == int(K)) & (T.reb == int(reb)) & (T["mode"] == m))]
    print(base); print(nb[["key", "IS", "OOS", "OOS_dd", "OOS_worst"]].sort_values("key").to_string(index=False))

# ---------- 4. monthly OOS table + capacity for B and A at 2x ----------
for nm in ["A_IS-best LS (h52 K8 m bn)", "B_pre-registered c_all K5 m bn"]:
    c = cands[nm]
    r = ls.simulate(D, gross=2, start="2018-01-01", **c)
    m = (1 + r.loc[OS:OE]).groupby(r.loc[OS:OE].index.to_period("M")).prod() - 1
    print("\n", nm, "OOS monthly %:", (m * 100).round(1).to_dict())
    dep = D["dep_on"].loc[OS:OE]
    print("  OOS excess over ON deposit (monthly geo %%): %.2f" % (geo(r - D["dep_on"].reindex(r.index), OS, OE)))
    print("  IS 2020-01..2025-10 excess over deposit: %.2f" % geo(r - D["dep_on"].reindex(r.index), "2020-01-01", OS - pd.Timedelta(days=1)))
# capacity: OOS median 20d futures value of names in the eligible top/bottom set
mv = D["medval"].loc[OS:OE]
print("\nOOS SSF liquidity: median 20d median value (M TL) of all SSF underlyings: %.0f; 10th pct %.0f" %
      (mv.median().median() / 1e6, mv.median().quantile(0.1) / 1e6))
