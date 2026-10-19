"""v3 tables: EQ / IV / SH weight schemes x size 1x/2x x capital x accounts; robustness via 0.1-grid neighbours."""
import pathlib, json
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; OUT = H / "results"
res = pd.read_csv(OUT / "all_results_v3.csv")
OW = pd.read_csv(OUT / "opt_weekly_v3.csv", index_col=0)
grid = res[res.scheme.isna()].copy(); sch = res[res.scheme.notna()].copy()
key = ["C", "accounts", "size", "w_ipo", "w_opt", "w_c"]
gi = grid[grid.period == "IS"].set_index(key); go = grid[grid.period == "OOS"].set_index(key)


def neighbours(w):
    """grid points one 0.1 step away from the nearest grid point of w (move 0.1 between two sleeves)."""
    w = np.array(w) * 10
    if np.allclose(w, 10 / 3):                  # 1/3 each: the 3 nearest grid points
        return [tuple(np.round((np.full(3, 3) + np.eye(3)[j]) / 10, 1)) for j in range(3)], None
    f = np.floor(w); r = int(round(10 - f.sum())); f[np.argsort(-(w - f))[:r]] += 1   # largest remainder
    b = f / 10
    out = []
    for i in range(3):
        for j in range(3):
            if i == j: continue
            x = b.copy(); x[i] += 0.1; x[j] -= 0.1
            if (x >= -1e-9).all(): out.append(tuple(np.round(x, 1)))
    return out, tuple(np.round(b, 1))


def stress(w_opt, size):
    o = OW[OW.index < "2025-10-17"]
    return w_opt * o[f"trough{size}"].min()


rows = []
for (C, k, sz, s), g in sch.groupby(["C", "accounts", "size", "scheme"]):
    a = g[g.period == "IS"].iloc[0]; b = g[g.period == "OOS"].iloc[0]
    w = (a.w_ipo, a.w_opt, a.w_c)
    nb, _ = neighbours(w)
    nbo = [go.loc[(C, k, sz) + n, "geo"] for n in nb]
    nbi = [gi.loc[(C, k, sz) + n, "geo"] for n in nb]
    other = sch[(sch.C == C) & (sch.accounts == k) & (sch["size"] == 3 - sz) & (sch.scheme == s) & (sch.period == "OOS")].geo.iloc[0]
    rows.append(dict(scheme=s, size=sz, C=C, accounts=k, w_ipo=w[0], w_opt=w[1], w_c=w[2],
                     IS_geo=a.geo, IS_dd_mtm=a.maxdd_mtm, OOS_geo=b.geo, OOS_dd=b.maxdd, OOS_dd_mtm=b.maxdd_mtm,
                     OOS_worst_m=b.worst_m, OOS_neg_m=b.neg_m, OOS_tax_tl=b.tax_tl,
                     nb_OOS_min=min(nbo), nb_IS_min=min(nbi), other_size_OOS=other, stress_may21=stress(w[1], sz)))
T = pd.DataFrame(rows)
for th, nm in ((0.10, "10"), (0.053, "53")):
    T[f"oos{nm}"] = T.OOS_geo >= th
    T[f"robust{nm}"] = (T.OOS_geo >= th) & (T.IS_geo >= th) & (T.nb_OOS_min >= th)
T.to_csv(OUT / "summary_v3.csv", index=False)

pd.set_option("display.width", 250); pd.set_option("display.max_rows", 500)
f = T.copy()
for c in ["IS_geo", "IS_dd_mtm", "OOS_geo", "OOS_dd", "OOS_dd_mtm", "OOS_worst_m", "nb_OOS_min", "nb_IS_min", "other_size_OOS", "stress_may21"]:
    f[c] = (f[c] * 100).round(2)
f["cap"] = (f.C // 1000).astype(str) + "k/" + f.accounts.astype(str)
print(f[["scheme", "size", "cap", "w_ipo", "w_opt", "w_c", "IS_geo", "IS_dd_mtm", "OOS_geo", "OOS_dd", "OOS_dd_mtm",
         "OOS_worst_m", "OOS_neg_m", "nb_OOS_min", "other_size_OOS", "stress_may21", "oos53", "robust53"]].to_string(index=False))
print("\nscheme rows:", len(T), "| OOS>=10%:", int(T.oos10.sum()), "| OOS>=5.3%:", int(T.oos53.sum()),
      "| robust 5.3:", int(T.robust53.sum()), "| IS&OOS>=5.3:", int(((T.IS_geo >= .053) & T.oos53).sum()))
print(T[T.oos53][["scheme", "size", "C", "accounts", "IS_geo", "OOS_geo", "nb_OOS_min", "robust53"]].round(4).to_string(index=False))
# hindsight ceiling on the grid (NOT a selection, information only)
print("\nGrid OOS hindsight max per cell (information only):")
print(go.reset_index().groupby(["C", "accounts", "size"]).geo.max().unstack().mul(100).round(2).to_string())
print("grid points OOS>=10%:", int((go.geo >= .10).sum()), "/", len(go), "| OOS>=5.3%:", int((go.geo >= .053).sum()))
# IS-selected scheme ranking: mean IS geo across the 12 capital cells (selection rule as in v2)
rk = T.groupby(["scheme", "size"]).agg(IS_mean=("IS_geo", "mean"), OOS_mean=("OOS_geo", "mean"),
                                         OOS_ddm_mean=("OOS_dd_mtm", "mean"), IS_ddm_mean=("IS_dd_mtm", "mean")).sort_values("IS_mean", ascending=False)
print("\nranking (IS mean over 12 cells):"); print((rk * 100).round(2).to_string())
# options sleeve standalone (USD) for reconciliation with the audit
for sz in (1, 2):
    for lo, hi, nm in (("2021-04-01", "2025-10-17", "IS"), ("2025-10-17", "2026-10-17", "OOS")):
        x = OW[(OW.index >= lo) & (OW.index < hi)]
        eq = (1 + x[f"r{sz}"]).cumprod(); days = (pd.Timestamp(x.expiry.iloc[-1]) - pd.Timestamp(x.index[0])).days
        dd = (eq / eq.cummax().clip(lower=1) - 1).min()
        print(f"OPT {sz}x USD {nm}: geo {eq.iloc[-1] ** (30.44 / days) - 1:.4f} weekly-close dd {dd:.3f} worst wk {x[f'r{sz}'].min():.3f} "
              f"worst MTM wk {x[f'trough{sz}'].min():.3f} liq weeks {int((x[f'nliq{sz}'] > 0).sum())}")

# monthly OOS / IS series of the scheme portfolios
import combo as CB
S = pd.read_pickle(OUT / "series_v3.pkl")
for per in ("IS", "OOS"):
    pd.DataFrame({f"{s}|{sz}x|{c // 1000}k|{k}acc": CB.monthly(e) for (s, c, k, sz, p), e in S.items() if p == per}
                 ).to_csv(OUT / f"monthly_returns_{per}_v3.csv", float_format="%.6f")
m = pd.read_csv(OUT / "monthly_returns_OOS_v3.csv", index_col=0)
print((m[["EQ|2x|100k|4acc", "EQ|1x|100k|4acc", "IV|2x|100k|4acc", "EQ|2x|1000k|1acc", "EQ|2x|5000k|1acc"]] * 100).round(2).to_string())
T2 = pd.read_csv(OUT / "summary_v3.csv")
print(T2[(T2.C == 100000) & (T2.accounts == 4)][["scheme", "size", "OOS_tax_tl"]].to_string(index=False))
