"""IS/OOS istatistikleri, IS'te dondurulmuş seçim ve aylık walk-forward seçim zincirleri."""
import pickle, numpy as np, pandas as pd
import sys
import common as cm
GRID = sys.argv[1] if len(sys.argv) > 1 else "grid.pkl"
TAG = GRID.replace(".pkl", "")

U = cm.load()
res = pickle.load(open(cm.HERE / GRID, "rb"))
IS0, IS1, O0, O1 = "2018-01-02", cm.IS_END, cm.OOS_START, cm.OOS_END
cash = U["cash"]["TRY"]
rows = []
for (name, base), (r, to) in res.items():
    s_is = cm.mstats(r, IS0, IS1); s_o = cm.mstats(r, O0, O1)
    ex = (r - cash).loc[IS0:IS1]
    W_lev = None
    rows.append(dict(name=name, base=base, fam=name.split("|")[0],
                     T=next((float(p[2:]) for p in name.split("|") if p.startswith("T=")), np.nan),
                     IS_geo=s_is["aylik_geo_%"], IS_dd=s_is["maxDD_%"], IS_worst=s_is["en_kotu_ay_%"],
                     IS_sh_ex=round(ex.mean() / (ex.std() + 1e-12) * np.sqrt(260), 2),
                     OOS_geo=s_o["aylik_geo_%"], OOS_dd=s_o["maxDD_%"], OOS_worst=s_o["en_kotu_ay_%"],
                     OOS_tot=s_o["toplam_%"], OOS_m10=s_o[">=%10_ay"],
                     OOS_sh_ex=round((r - cash).loc[O0:O1].mean() / ((r - cash).loc[O0:O1].std() + 1e-12) * np.sqrt(260), 2),
                     turnover_yr=round(to.loc[IS0:O1].sum() / ((pd.Timestamp(O1) - pd.Timestamp(IS0)).days / 365), 1)))
df = pd.DataFrame(rows)
df.to_csv(cm.HERE / f"all_configs_{TAG}.csv", index=False)
cand = df[df.fam != "REF"].copy()
print("kombinasyon sayısı (REF hariç):", len(cand))
pd.set_option("display.width", 250); pd.set_option("display.max_columns", 30); pd.set_option("display.max_colwidth", 60)
cols = ["name", "base", "IS_geo", "IS_dd", "IS_sh_ex", "OOS_geo", "OOS_dd", "OOS_worst", "OOS_sh_ex"]
print("\n== Referanslar ==\n", df[df.fam == "REF"][cols].to_string(index=False))
print("\n== IS'te en iyi 15 (aylık geo) -> OOS ==\n", cand.sort_values("IS_geo", ascending=False).head(15)[cols].to_string(index=False))
print("\n== IS excess-Sharpe en iyi 10 ==\n", cand.sort_values("IS_sh_ex", ascending=False).head(10)[cols].to_string(index=False))
print("\n== (sadece bilgi; seçim için KULLANILMAZ) OOS'ta en iyi 10 ==\n", cand.sort_values("OOS_geo", ascending=False).head(10)[cols].to_string(index=False))
print("\nOOS>=10%:", (cand.OOS_geo >= 10).sum(), " OOS>=5.3%:", (cand.OOS_geo >= 5.3).sum(), " IS>=10%:", (cand.IS_geo >= 10).sum())
print("\n== Hedef oynaklığa göre medyan (aile x T) ==")
print(cand.groupby(["fam", "T"])[["IS_geo", "IS_dd", "IS_sh_ex", "OOS_geo", "OOS_dd", "OOS_worst"]].median().round(2).to_string())

# ---------------- walk-forward ----------------
keys = [k for k in res if not k[0].startswith("REF")]
R = pd.DataFrame({k: res[k][0] for k in keys})
L = np.log1p(R.clip(lower=-0.999))
mend = R.resample("ME").last().index
def wf(pool, win, score="geo"):
    out = pd.Series(0.0, index=R.index); picks = []
    for i, me in enumerate(mend[:-1]):
        lo = me - pd.DateOffset(months=win)
        if lo < pd.Timestamp(IS0):
            continue
        hist = L.loc[lo:me, pool]
        sc = hist.sum() if score == "geo" else hist.mean() / (hist.std() + 1e-12)
        best = sc.idxmax()
        nxt = (R.index > me) & (R.index <= mend[i + 1])
        out[nxt] = R.loc[nxt, best]; picks.append((me.date(), best))
    return out, picks

def frozen(pool, score="geo"):
    hist = L.loc[IS0:IS1, pool]
    sc = hist.sum() if score == "geo" else hist.mean() / (hist.std() + 1e-12)
    return sc.idxmax()

summ = []
pools = {"tümü": keys}
for T in [0.2, 0.4, 0.6, 0.8]:
    pools[f"T={T}"] = [k for k in keys if f"|T={T}|" in k[0]]
pools["KELLY"] = [k for k in keys if k[0].startswith("KELLY")]
picks_store = {}
for pn, pool in pools.items():
    for win in [24, 36]:
        for scr in ["geo", "sharpe"]:
            r, pk = wf(pool, win, scr)
            s_is = cm.mstats(r, "2020-01-01", IS1); s_o = cm.mstats(r, O0, O1)
            oos_picks = [p for p in pk if str(p[0]) >= "2025-09-30"]
            picks_store[(pn, win, scr)] = oos_picks
            summ.append(dict(method=f"WF {pn} pencere={win}a skor={scr}", n=len(pool), IS_geo=s_is["aylik_geo_%"], IS_dd=s_is["maxDD_%"],
                             OOS_geo=s_o["aylik_geo_%"], OOS_dd=s_o["maxDD_%"], OOS_worst=s_o["en_kotu_ay_%"],
                             OOS_tot=s_o["toplam_%"], last_pick="|".join(oos_picks[-1][1]) if oos_picks else ""))
        for scr in ["geo", "sharpe"]:
            pass
    for scr in ["geo", "sharpe"]:
        b = frozen(pool, scr); r = R[b]
        s_is = cm.mstats(r, IS0, IS1); s_o = cm.mstats(r, O0, O1)
        summ.append(dict(method=f"DONDURULMUŞ IS-en-iyi {pn} skor={scr}", n=len(pool), IS_geo=s_is["aylik_geo_%"], IS_dd=s_is["maxDD_%"],
                         OOS_geo=s_o["aylik_geo_%"], OOS_dd=s_o["maxDD_%"], OOS_worst=s_o["en_kotu_ay_%"],
                         OOS_tot=s_o["toplam_%"], last_pick="|".join(b)))
S = pd.DataFrame(summ)
S.to_csv(cm.HERE / f"selection_results_{TAG}.csv", index=False)
print("\n== Seçim yöntemleri (OOS zinciri) ==\n", S.to_string(index=False))
pickle.dump(picks_store, open(cm.HERE / f"wf_picks_{TAG}.pkl", "wb"))
for k in [("tümü", 24, "geo"), ("tümü", 36, "sharpe")]:
    print(k, [(str(d), "|".join(p)) for d, p in picks_store[k]])
