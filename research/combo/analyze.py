"""all_results.csv -> rapor tabloları (results/tables.md)."""
import pathlib, numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; OUT = H / "results"
r = pd.read_csv(OUT / "all_results.csv")
w = r.pivot_table(index=["group", "sleeve", "mode", "tau", "C", "accounts"], columns="period",
                  values=["geo", "maxdd", "worst_m", "m10", "neg_m", "pnl_tl", "coll_frac", "ipo_frac"]).reset_index()
w.columns = ["_".join([c for c in col if c]) for col in w.columns]
w.to_csv(OUT / "summary_wide.csv", index=False)
pct = lambda x: f"{x*100:.2f}"
L = []
def md(df, floatfmt=None):
    if not isinstance(df.index, pd.RangeIndex):
        df = df.reset_index()
    cols = [" ".join(map(str, c)) if isinstance(c, tuple) else str(c) for c in df.columns]
    L.append("| " + " | ".join(cols) + " |"); L.append("|" + "---|" * len(cols))
    for row in df.itertuples(index=False):
        L.append("| " + " | ".join(str(x) for x in row) + " |")
    L.append("")
REAL = {("MM", "pledge"): "evet", ("MM", "cash"): "evet", ("BIST", "sell"): "evet",
        ("BIST", "pledge"): "kurum-bağımlı", ("KELLY", "sell"): "evet*", ("KELLY", "pledge"): "hayır",
        ("MIX_IV", "sell"): "evet*", ("MIX_IV", "pledge"): "hayır", ("MIX_SH", "sell"): "evet*",
        ("MIX_SH", "pledge"): "hayır"}
m = w[w.group == "main"].copy()
m["cell"] = (m.C // 1000).astype(str) + "k/" + m.accounts.astype(str)
order = [f"{c}k/{k}" for c in (100, 250, 500, 1000) for k in (1, 2, 4)]
for col, title in [("geo_IS", "IS aylık geo %"), ("geo_OOS", "OOS aylık geo %"), ("maxdd_OOS", "OOS maxDD %"),
                   ("worst_m_OOS", "OOS en kötü ay %"), ("maxdd_IS", "IS maxDD %"), ("coll_frac_OOS", "OOS ort. teminat payı % (özsermayeye)")]:
    t = m.pivot_table(index=["sleeve", "mode"], columns="cell", values=col)[order] * 100
    L.append(f"### {title} (sermaye/hesap sayısı)\n"); md(t.round(2))
# hedefler
o = m
L.append(f"### Hedefler (ana ızgara, {len(m)} kombinasyon)\n")
L.append(f"* OOS >= %10/ay: **{(o.geo_OOS >= 0.10).sum()}**; OOS >= %5.3/ay: **{(o.geo_OOS >= 0.053).sum()}**; "
         f"IS ve OOS ikisi de >= %5.3: **{((o.geo_OOS >= 0.053) & (o.geo_IS >= 0.053)).sum()}**\n")
hit = o[o.geo_OOS >= 0.053].copy()
hit["real"] = [REAL[(s, md_)] for s, md_ in zip(hit.sleeve, hit["mode"])]
t = hit[["sleeve", "mode", "cell", "real", "geo_IS", "geo_OOS", "maxdd_OOS", "worst_m_OOS"]].sort_values("geo_OOS", ascending=False)
for c in ["geo_IS", "geo_OOS", "maxdd_OOS", "worst_m_OOS"]: t[c] = (t[c] * 100).round(2)
L.append("OOS >= %5.3 olanlar:\n"); md(t)
# varyant seçimi: 12 hücrenin IS ortalaması (OOS'a bakmadan)
v = m.groupby(["sleeve", "mode"]).agg(IS_mean=("geo_IS", "mean"), OOS_mean=("geo_OOS", "mean"),
                                      OOS_dd_mean=("maxdd_OOS", "mean")).reset_index()
v["real"] = [REAL[(s, md_)] for s, md_ in zip(v.sleeve, v["mode"])]
v = v.sort_values("IS_mean", ascending=False)
v["IS_rank_all"] = range(1, len(v) + 1)
for c in ["IS_mean", "OOS_mean", "OOS_dd_mean"]: v[c] = (v[c] * 100).round(2)
L.append("### Varyant sıralaması: 12 sermaye/hesap hücresinin IS ortalaması (seçim kuralı, OOS'a bakılmadan)\n"); md(v)
v.to_csv(OUT / "variant_rank.csv", index=False)
# referans: arzsız kollar
ref = w[w.group.isin(["noIPO", "noIPO_tax0"])][["group", "sleeve", "tau", "geo_IS", "geo_OOS", "maxdd_IS", "maxdd_OOS", "worst_m_OOS", "m10_OOS", "neg_m_OOS"]].copy()
for c in ["geo_IS", "geo_OOS", "maxdd_IS", "maxdd_OOS", "worst_m_OOS"]: ref[c] = (ref[c] * 100).round(2)
L.append("### Arzsız kollar (referans)\n"); md(ref)
# arz katkısı TL (OOS): kombine - arzsız aynı kol
base = w[w.group == "noIPO"].set_index("sleeve")
rows = []
for _, x in m.iterrows():
    b = base.loc[x.sleeve]
    rows.append(dict(sleeve=x.sleeve, mode=x["mode"], cell=x.cell,
                     ipo_addon_pp=(x.geo_OOS - b.geo_OOS) * 100,
                     ipo_addon_TL=x.pnl_tl_OOS - b.pnl_tl_OOS / 1e6 * x.C))
a = pd.DataFrame(rows)
L.append("### Arz katkısı OOS: kombine aylık geo − aynı kolun arzsız aylık geo (puan)\n")
md(a.pivot_table(index=["sleeve", "mode"], columns="cell", values="ipo_addon_pp")[order].round(2))
# duyarlılık: vergi
s0 = w[w.group == "sens_tax0"].copy(); s0["cell"] = (s0.C // 1000).astype(str) + "k/" + s0.accounts.astype(str)
L.append("### Duyarlılık: KELLY vergisi %0 (OOS aylık geo %)\n")
md((s0.pivot_table(index=["sleeve", "mode"], columns="cell", values="geo_OOS")[order] * 100).round(2))
L.append("IS aylık geo % (vergi %0):\n")
md((s0.pivot_table(index=["sleeve", "mode"], columns="cell", values="geo_IS")[order] * 100).round(2))
# duyarlılık: BIST dengeleme günü
sp = w[w.group == "sens_phase"].copy(); sp["cell"] = (sp.C // 1000).astype(str) + "k/" + sp.accounts.astype(str)
bm = m[m.sleeve == "BIST"]
allp = pd.concat([bm, sp])
L.append("### Duyarlılık: BIST haftalık dengeleme günü (phase 0 = kanonik), OOS / IS aylık geo %, 100k/1 ve 1M/1\n")
t = allp[allp.cell.isin(["100k/1", "1000k/1", "100k/4"])].pivot_table(index=["sleeve", "mode"], columns="cell", values=["geo_IS", "geo_OOS"]) * 100
md(t.round(2))
open(OUT / "tables.md", "w").write("\n".join(L))
print("\n".join(L))
