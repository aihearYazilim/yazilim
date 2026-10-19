"""v5 analysis: scheme table, hit rates, neighbour robustness (weights +-0.1 and parameter flips)."""
import sys, pathlib, json
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; OUT = H / "results"
pd.set_option("display.width", 260); pd.set_option("display.max_rows", 500); pd.set_option("display.max_columns", 40)
R = pd.read_csv(OUT / "all_results_v5.csv")
REF = pd.read_csv(OUT / "refs_v5.csv")
KEY = ["C", "Lmax", "size", "nema", "prod", "set"]
WC = ["w_tl", "w_opt", "w_c", "w_k"]
print("simulations (grid+schemes):", len(R), " refs:", len(REF))
print("IS-selectable configs (scheme rows, OOS):", len(R[(R.scheme != "grid") & (R.period == "OOS")]))
print("grid OOS points (robustness only):", len(R[(R.scheme == "grid") & (R.period == "OOS")]))

# refs
f = REF.copy(); f["geo"] *= 100; f["maxdd_mtm"] *= 100; f["worst_m"] *= 100
print(f.pivot_table(index=["ref", "prod", "nema"], columns=["period", "C"], values="geo").round(2).to_string())
print(f[f.period == "OOS"].pivot_table(index=["ref", "prod", "nema"], columns="C", values=["maxdd_mtm", "worst_m"]).round(1).to_string())

S = R[R.scheme != "grid"]
W = S.pivot_table(index=KEY + ["scheme"] + WC, columns="period", values=["geo", "sharpe", "maxdd_mtm", "worst_m"]).reset_index()
W.columns = ["_".join([c for c in col if c]) for col in W.columns]
for c in ["geo_IS", "geo_OOS", "maxdd_mtm_IS", "maxdd_mtm_OOS", "worst_m_OOS", "worst_m_IS"]: W[c] *= 100
W.to_csv(OUT / "schemes_v5.csv", index=False)
print("\nhit rates among IS-selectable scheme configs (OOS geo):")
print(" >=10%:", int((W.geo_OOS >= 10).sum()), "/", len(W), "  >=5.3%:", int((W.geo_OOS >= 5.3).sum()))
G = R[(R.scheme == "grid") & (R.period == "OOS")]
print("full grid OOS (not selectable):  >=10%:", int((G.geo >= .10).sum()), "/", len(G), "  >=5.3%:", int((G.geo >= .053).sum()),
      " max:", round(G.geo.max() * 100, 2))
print(G.loc[G.geo.nlargest(5).index, KEY + WC + ["geo", "maxdd_mtm", "worst_m"]].to_string())


def neigh(row, df):
    """OOS geo of weight-neighbours (move 0.1 between any two sleeves) inside the same cell."""
    g = df[(df.scheme == "grid") & (df.period == "OOS")]
    for k in KEY: g = g[g[k] == row[k]]
    w = np.array([row[c] for c in WC])
    d = np.abs(g[WC].values - w).sum(1)
    nb = g[(d > 1e-6) & (d <= 0.2 + 1e-6)]
    return nb.geo.median() * 100 if len(nb) else np.nan, nb.geo.min() * 100 if len(nb) else np.nan, len(nb)


def flips(row):
    """same scheme, one parameter flipped -> OOS geo."""
    out = {}
    for k, alt in [("Lmax", {3: 5, 5: 3}), ("size", {1: 2, 2: 1}), ("nema", {0.0: 1.0, 1.0: 0.0}), ("prod", {"D32": "ON", "ON": "D32"})]:
        q = W.copy()
        for kk in KEY + ["scheme"]:
            v = alt[row[kk]] if kk == k else row[kk]
            q = q[q[kk] == v]
        out[k] = round(q.geo_OOS.iloc[0], 2) if len(q) else np.nan
    return out


rows = []
for _, r in W.iterrows():
    if r.scheme == "EQ": med, mn, nn = np.nan, np.nan, 0
    else: med, mn, nn = neigh(r, R)
    rows.append(dict(r, nb_med=med, nb_min=mn, nb_n=nn, **{f"flip_{k}": v for k, v in flips(r).items()}))
X = pd.DataFrame(rows); X.to_csv(OUT / "schemes_robust_v5.csv", index=False)
cols = KEY + ["scheme"] + WC + ["geo_IS", "sharpe_IS", "maxdd_mtm_IS", "geo_OOS", "maxdd_mtm_OOS", "worst_m_OOS", "nb_med", "nb_min",
                                 "flip_Lmax", "flip_size", "flip_nema", "flip_prod"]
for s in ("EQ", "IV", "SH"):
    print(f"\n==== {s}")
    print(X[X.scheme == s][cols].sort_values(["set", "C", "Lmax", "size", "nema", "prod"]).round(2).to_string(index=False))
