"""v6 analysis: scheme table, weight-neighbour robustness (grid points with every weight within +-0.10 of the chosen
weights, same cell), sleeve-variant robustness (robust_v6.csv), OOS monthly path of the selected portfolios."""
import sys, pathlib, json
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; OUT = H / "results"
sys.path.insert(0, str(H)); sys.dont_write_bytecode = True
pd.set_option("display.width", 250); pd.set_option("display.max_rows", 500); pd.set_option("display.max_columns", 50)
R = pd.read_csv(OUT / "all_results_v6.csv"); W = json.load(open(OUT / "weights_v6.json"))
cols = ["w_tl", "w_opt", "w_c", "w_xu", "w_evt"]
G = R[R.scheme == "grid"]; Gi = G[G.period == "IS"].reset_index(drop=True); Go = G[G.period == "OOS"].reset_index(drop=True)
rows = []
for key, ws in W.items():
    C, Lm, viop = key.split("|"); C = int(C); Lm = int(Lm)
    m = (Gi.C == C) & (Gi.Lmax == Lm) & (Gi.viop == viop)
    gi, go = Gi[m], Go[m]
    for sch, w in ws.items():
        if sch == "vols": continue
        w = np.array(w)
        sel = R[(R.C == C) & (R.Lmax == Lm) & (R.viop == viop) & (R.scheme == sch)].set_index("period")
        nb = (np.abs(gi[cols].values - w).max(axis=1) <= 0.10 + 1e-9)
        o = go[nb]
        rows.append(dict(C=C, Lmax=Lm, viop=viop, scheme=sch, w="/".join(f"{x:.2f}" for x in w),
                         IS_geo=sel.loc["IS", "geo"] * 100, IS_dd=sel.loc["IS", "maxdd_mtm"] * 100,
                         OOS_geo=sel.loc["OOS", "geo"] * 100, OOS_dd=sel.loc["OOS", "maxdd_mtm"] * 100,
                         OOS_worst=sel.loc["OOS", "worst_m"] * 100, OOS_negm=sel.loc["OOS", "neg_m"],
                         nb_n=int(nb.sum()), nb_OOS_min=o.geo.min() * 100, nb_OOS_med=o.geo.median() * 100,
                         nb_OOS_max=o.geo.max() * 100, nb_frac53=(o.geo >= 0.053).mean(), nb_IS_med=gi[nb].geo.median() * 100,
                         nb_ISdd_min=gi[nb].maxdd_mtm.min() * 100))
T = pd.DataFrame(rows); T.to_csv(OUT / "schemes_v6.csv", index=False)
print(T.round(2).to_string(index=False))
# robust sleeve variants
p = OUT / "robust_v6.csv"
if p.exists():
    B = pd.read_csv(p)
    o = B[B.period == "OOS"]
    P = o.pivot_table(index=["C", "Lmax", "viop", "scheme"], columns="var", values="geo") * 100
    xu = P[[f"xu_ed{k}" for k in range(1, 10)] + ["base"]]
    S = pd.DataFrame({"base": P["base"], "xu_ed_mean(0-9)": xu.mean(axis=1), "xu_ed_min": xu.min(axis=1),
                      "opt30d2x": P["opt_30d2x"], "opt35d3x": P["opt_35d3x"], "evt_s.05": P["evt_s0.05"], "evt+15m": P["evt_+15m"],
                      "xcap.5M": P["xcap_0.5M"], "xcap2M": P["xcap_2M"]})
    S["all_min"] = P.min(axis=1); S["frac53"] = (P >= 5.3).mean(axis=1)
    S.to_csv(OUT / "robust_v6_summary.csv")
    print(S.round(2).to_string())
    i = B[B.period == "IS"].pivot_table(index=["C", "Lmax", "viop", "scheme"], columns="var", values="geo") * 100
    print("IS geo range across sleeve variants:"); print(pd.DataFrame({"min": i.min(axis=1), "max": i.max(axis=1)}).round(2).to_string())
