"""Bedelsiz episodları: KAP bildirimleri (başlangıç/başvuru/SPK onayı) + İş Yatırım (bölünme tarihi, oran).
Episode = ticker için ilk 'bedelsiz' bildirimi (hak kullanım/tescil/dağıtım tipi hariç), açık episode yokken.
Kapanış = İş Yatırım bedelsiz bölünme tarihi (başlangıçtan sonra ilk) ya da yoksa 'beklemede/iptal'.
Not: canlıda uygulanabilir — karar t'de, işlem t+1 (yayın saatinden bağımsız, hep ertesi seans)."""
import json, glob, pathlib, re, numpy as np, pandas as pd
H = pathlib.Path(__file__).parent
rows = []
for f in sorted(glob.glob(str(H/"raw"/"kap"/"ca_*.json"))): rows += json.load(open(f))
k = pd.DataFrame(rows)
k["s"] = k.summary.fillna("").str.lower()
k["ts"] = pd.to_datetime(k.publishDate, format="%d.%m.%Y %H:%M:%S")
k = k[k.s.str.contains("bedelsiz") & k.stockCodes.notna()].copy()
k["ticker"] = k.stockCodes.str.split(",").str[0].str.strip()
def typ(s):
    if "geri çek" in s or "vazgeç" in s or "iptal" in s: return "cancel"
    if "onay" in s or "izni" in s or "onaylan" in s: return "approval"
    if "hak kullan" in s or "pay alma" in s or "başlangıç" in s or "dağıtım tarih" in s or "tescil" in s or "kullanım tarih" in s or "ihraç gün" in s or "aktarıl" in s: return "post"
    if "başvur" in s: return "application"
    return "decision"
k["type"] = k.s.map(typ)
k = k.sort_values("ts")
# İş Yatırım bölünme tarihleri
ex = {}
for f in glob.glob(str(H/"raw"/"isy_sermaye"/"*.json")):
    t = pathlib.Path(f).stem; L = []
    for x in json.loads(open(f).read() or "[]"):
        r = (x["SHHE_BDSZ_IK_ORAN"] or 0) + (x["SHHE_BDSZ_TM_ORAN"] or 0)
        if r > 0 and x["SHHE_TARIH"] > 0:
            L.append((pd.to_datetime(x["SHHE_TARIH"] + 3*3600*1000, unit="ms").normalize(), r, x["SHHE_BDLI_ORAN"] or 0))
    ex[t] = sorted(L)
ep = []
for t, g in k.groupby("ticker"):
    g = g.sort_values("ts"); exs = ex.get(t, []); cur = None
    for _, r in g.iterrows():
        d = r.ts
        if cur is not None and (cur["ex_date"] is not pd.NaT and cur["ex_date"] is not None and d.normalize() >= cur["ex_date"]):
            cur = None
        if cur is not None and cur["ex_date"] is None and (d - cur["start"]).days > 450:
            cur = None
        if cur is None:
            if r.type in ("post", "approval", "cancel"):
                continue  # başlangıcı veri aralığından önce olan ya da kar payı kaynaklı
            nx = [e for e in exs if e[0] > d.normalize() and (e[0] - d.normalize()).days <= 450]
            cur = {"ticker": t, "start": d, "start_type": r.type, "start_summary": r.summary.strip()[:90],
                   "ex_date": nx[0][0] if nx else None, "ratio": nx[0][1] if nx else np.nan, "bedelli": nx[0][2] if nx else np.nan,
                   "application": pd.NaT, "approval": pd.NaT, "post": pd.NaT, "cancel": pd.NaT, "n_disc": 0}
            ep.append(cur)
        cur["n_disc"] += 1
        if r.type == "application" and pd.isna(cur["application"]): cur["application"] = d
        if r.type == "approval" and pd.isna(cur["approval"]): cur["approval"] = d
        if r.type == "post" and pd.isna(cur["post"]): cur["post"] = d
        if r.type == "cancel" and pd.isna(cur["cancel"]): cur["cancel"] = d
E=pd.DataFrame(ep)
E["ex_date"] = pd.to_datetime(E.ex_date)
E = E[E.start >= "2019-06-01"].reset_index(drop=True)
E.to_csv(H/"bedelsiz_events.csv", index=False)
print(len(E), "episode;", E.ex_date.notna().sum(), "tamamlanan;", E.approval.notna().sum(), "onaylı")
print(E.groupby(E.start.dt.year).agg(n=("ticker","size"), done=("ex_date", lambda s: s.notna().sum()), med_ratio=("ratio","median")))
d = (E.ex_date - E.start).dt.days; print("başlangıç->bölünme gün (medyan, p10, p90):", d.median(), d.quantile(.1), d.quantile(.9))
d = (E.approval - E.start).dt.days; print("başlangıç->onay gün:", d.median(), d.quantile(.1), d.quantile(.9))
d = (E.ex_date - E.approval).dt.days; print("onay->bölünme gün:", d.median(), d.quantile(.1), d.quantile(.9))
