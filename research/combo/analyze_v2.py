"""all_results_v2.csv -> results/tables_v2.md"""
import pathlib, pandas as pd
OUT = pathlib.Path(__file__).resolve().parent / "results"
r = pd.read_csv(OUT / "all_results_v2.csv")
w = r.pivot_table(index=["group", "lag", "sleeve", "mode", "C", "accounts"], columns="period",
                  values=["geo", "maxdd", "worst_m", "m10", "neg_m", "coll_frac"]).reset_index()
w.columns = ["_".join([c for c in col if c]) for col in w.columns]
w["cell"] = (w.C // 1000).astype(str) + "k/" + w.accounts.astype(str)
w.to_csv(OUT / "summary_wide_v2.csv", index=False)
order = [f"{c}k/{k}" for c in (100, 250, 500, 1000) for k in (1, 2, 4)]
L = []
def md(df):
    df = df.reset_index()
    cols = [str(c) for c in df.columns]
    L.append("| " + " | ".join(cols) + " |"); L.append("|" + "---|" * len(cols))
    for row in df.itertuples(index=False):
        L.append("| " + " | ".join(str(x) for x in row) + " |")
    L.append("")
ref = w[w.group == "noIPO"][["lag", "sleeve", "geo_IS", "geo_OOS", "maxdd_IS", "maxdd_OOS", "worst_m_OOS"]].set_index(["lag", "sleeve"])
L.append("#### Arzsız kollar (net, takvim-günü faiz düzeltmeli)\n"); md((ref * 100).round(2))
for grp in ["main", "sens_pledge"]:
    m = w[w.group == grp]
    for col, t in [("geo_IS", "IS aylık geo %"), ("geo_OOS", "OOS aylık geo %"), ("maxdd_OOS", "OOS maxDD %"),
                   ("worst_m_OOS", "OOS en kötü ay %")]:
        L.append(f"#### [{grp}] {t}\n")
        md((m.pivot_table(index=["lag", "sleeve"], columns="cell", values=col)[order] * 100).round(2))
m = w[w.group == "main"]
for lag in ["C_L1", "C_L0"]:
    x = m[m.lag == lag]
    L.append(f"* {lag} (sell): OOS >= %10: **{(x.geo_OOS >= .10).sum()}/{len(x)}**, OOS >= %5.3: **{(x.geo_OOS >= .053).sum()}/{len(x)}** "
             f"({', '.join(sorted(set(x[x.geo_OOS >= .053].sleeve + ' ' + x[x.geo_OOS >= .053].cell)))}); "
             f"IS ve OOS >= %5.3: {((x.geo_OOS >= .053) & (x.geo_IS >= .053)).sum()}\n")
v = m.groupby(["lag", "sleeve"]).agg(IS_mean=("geo_IS", "mean"), OOS_mean=("geo_OOS", "mean"), OOS_dd_mean=("maxdd_OOS", "mean"))
L.append("#### Varyant sıralaması (12 hücre IS ortalaması; seçim kuralı)\n"); md((v * 100).round(2).sort_values(["lag", "IS_mean"], ascending=[False, False]))
open(OUT / "tables_v2.md", "w").write("\n".join(L)); print("\n".join(L))
