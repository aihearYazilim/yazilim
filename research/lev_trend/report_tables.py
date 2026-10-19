"""REPORT.md için özet tablolar: kaldıraç seviyesine göre kanonik stratejiler, ilk 3 aday, Sharpe gereksinimi."""
import pickle, numpy as np, pandas as pd
import common as cm, lt_strategies as st
U = cm.load(); pre = st.Pre(U)
res = pickle.load(open(cm.HERE / "grid.pkl", "rb"))
O0, O1, IS0, IS1 = cm.OOS_START, cm.OOS_END, "2018-01-02", cm.IS_END
cash = U["cash"]["TRY"]

def lev(W, a, b):
    g = W.shift(1).loc[a:b].abs().sum(axis=1)
    return round(g.mean(), 2), round(g.max(), 2)

def line(label, r, W=None, to=None, n=1, istart=IS0):
    si, so = cm.mstats(r, istart, IS1), cm.mstats(r, O0, O1)
    ex_i = (r - cash).loc[istart:IS1]; ex_o = (r - cash).loc[O0:O1]
    tot = so["toplam_%"] / 100
    after_tax = ((1 + tot * (0.8 if tot > 0 else 1)) ** (1 / 12) - 1) * 100
    d = dict(strateji=label, IS_geo=si["aylik_geo_%"], IS_dd=si["maxDD_%"], IS_Sh=round(ex_i.mean() / ex_i.std() * np.sqrt(260), 2),
             OOS_geo=so["aylik_geo_%"], OOS_geo_vergi20=round(after_tax, 2), OOS_dd=so["maxDD_%"], OOS_worst=so["en_kotu_ay_%"],
             OOS_Sh=round(ex_o.mean() / ex_o.std() * np.sqrt(260), 2), OOS_vol=round(r.loc[O0:O1].std() * np.sqrt(260) * 100))
    if W is not None:
        d["lev_ort"], d["lev_max"] = lev(W, O0, O1)
    if to is not None:
        d["ciro_OOS_x"] = round(to.loc[O0:O1].sum(), 1)
    d["komb"] = n
    return d

rows = []
# 1) Kaldıraç sorusu: önceden tanımlanmış kanonik konfigürasyonlar (seçim yok)
for T in [0.2, 0.4, 0.6, 0.8]:
    for name, raw in [("ENS|ALL", None), ("TSMOM|ALL|L=ens|ls", st.tsmom(pre, st.UNIV["ALL"], "ens", False)),
                      ("RP|ALL|sma200", st.riskparity(pre, st.UNIV["ALL"], "sma200"))]:
        key = (f"{name}|T={T}|Lmax=10", "TRY")
        r, to = res[key]
        W = pre.scale_to_vol(raw, T, 10) if raw is not None else None
        rows.append(line(f"{name} T={T:.0%} Lmax10", r, W, to))
for L_, f in [(252, 0.25), (252, 0.5), (252, 1.0)]:
    key = (f"KELLY|ALL|L={L_}|f={f}|Lmax=10", "TRY"); r, to = res[key]
    rows.append(line(f"KELLY|ALL f={f} Lmax10", r, st.kelly(pre, st.UNIV["ALL"], L_, f, 10), to))
K = pd.DataFrame(rows)
pd.set_option("display.width", 250); pd.set_option("display.max_columns", 30)
print("== Kaldıraç/hedef oynaklık (kanonik, seçimsiz, TRY bazlı) ==\n", K.to_string(index=False))
K.to_csv(cm.HERE / "table_leverage.csv", index=False)

# 2) Adaylar
keys = [k for k in res if not k[0].startswith("REF")]
R = pd.DataFrame({k: res[k][0] for k in keys}); Lg = np.log1p(R.clip(lower=-0.999))
mend = R.resample("ME").last().index
def weights_of(k):
    p = k[0].split("|")
    if p[0] == "KELLY":
        return st.kelly(pre, st.UNIV[p[1]], int(p[2][2:]), float(p[3][2:]), int(p[4][5:]))
    return None
def wf(pool, win, score):
    out = pd.Series(0.0, index=R.index); Wout = None; picks = {}
    for i, me in enumerate(mend[:-1]):
        lo = me - pd.DateOffset(months=win)
        if lo < pd.Timestamp(IS0): continue
        h = Lg.loc[lo:me, pool]
        sc = h.sum() if score == "geo" else h.mean() / (h.std() + 1e-12)
        b = sc.idxmax(); nxt = (R.index > me) & (R.index <= mend[i + 1])
        out[nxt] = R.loc[nxt, b]; picks[me] = b
    return out, picks
kpool = [k for k in keys if k[0].startswith("KELLY")]
r, pk = wf(kpool, 36, "sharpe")
Wc = pd.DataFrame(0.0, index=R.index, columns=st.UNIV["ALL"])
cache = {}
for i, me in enumerate(mend[:-1]):
    if me not in pk: continue
    b = pk[me]
    if b not in cache: cache[b] = weights_of(b)
    nxt = (R.index > me) & (R.index <= mend[i + 1])
    w = cache[b].reindex(columns=Wc.columns, fill_value=0)
    Wc.loc[nxt] = w.loc[nxt].values
cand = [line("A) WF Kelly-havuzu, 36a pencere, Sharpe skoru", r, Wc, None, len(kpool), "2020-01-01")]
for k in [("KELLY|ALL|L=252|f=0.25|Lmax=4", "USD"), ("KELLY|AGGR|L=252|f=0.25|Lmax=10", "USD"),
          ("KELLY|NOCRY|L=252|f=0.25|Lmax=4", "TRY"), ("KELLY|VIOP|L=252|f=0.25|Lmax=10", "TRY")]:
    rr, to = res[k]
    cand.append(line("|".join(k), rr, weights_of(k), to, 1))
pool_all = keys
r2, _ = wf(pool_all, 36, "sharpe")
cand.append(line("WF tüm havuz (1072), 36a, Sharpe", r2, None, None, len(pool_all), "2020-01-01"))
for n in ["REF|TL PPF", "REF|GC_F 1x", "REF|SPY 1x", "REF|TQQQ 1x"]:
    cand.append(line(n, res[(n, "TRY")][0]))
C = pd.DataFrame(cand)
print("\n== Adaylar ==\n", C.to_string(index=False))
C.to_csv(cm.HERE / "table_candidates.csv", index=False)
e = cm.eq_of(r.loc[O0:O1]); m = e.resample("ME").last(); m = pd.concat([pd.Series([1.0]), m.reset_index(drop=True)])
print("A OOS aylık:", (m.pct_change().dropna() * 100).round(1).tolist())
print("A OOS ort. ağırlık:", Wc.shift(1).loc[O0:O1].mean().round(2).to_dict())

# 3) Sharpe gereksinimi (sürekli zaman, Kelly büyüme formülü g = r + S*sig - sig^2/2)
rc = 12 * np.log(1 + cm.mstats(cash, O0, O1)["aylik_geo_%"] / 100)
out = []
for tgt in [0.10, 0.053]:
    G = 12 * np.log(1 + tgt)
    row = {"hedef_aylik": f"{tgt:.1%}", "gereken_log_buyume": round(G, 3), "TL_nakit_log": round(rc, 3),
           "tam_Kelly_min_Sharpe": round(np.sqrt(2 * (G - rc)), 2), "yarim_Kelly_Sharpe": round(np.sqrt((G - rc) / 0.375), 2)}
    for s in [0.2, 0.4, 0.6, 0.8]:
        row[f"Sh@vol{int(s*100)}"] = round((G - rc + s * s / 2) / s, 2)
    out.append(row)
print("\n== Gereken Sharpe ==\n", pd.DataFrame(out).to_string(index=False))
pd.DataFrame(out).to_csv(cm.HERE / "table_sharpe_needed.csv", index=False)
