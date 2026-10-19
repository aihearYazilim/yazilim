"""Aday kontrol değişikliği bildirimleri (tam metin regex) -> cand.csv + epizot listesi (gözden geçirme için)."""
import re, pathlib, pandas as pd, numpy as np
from classify import body
H = pathlib.Path(__file__).parent
D = pd.read_pickle(H/"raw/oda_all.pkl").set_index("disclosureIndex")
OWN = re.compile(r"(şirketimiz|bankamız|ortaklığımız|holdingimiz|şirket)\w*\s+(?:\S+\s+){0,4}?(?:sermaye|pay|hisse|ortak|hissedar)|ortaklarımız|hissedarlarımız|hissedarımız|ortağımız|pay sahiplerimiz|ana ortaklığımız|hakim ortağımız|hâkim ortağımız|ödenmiş sermayesinde|çıkarılmış sermayesinde|pay alım teklif", re.I)
XFER = re.compile(r"devir|devr|satış|satın al|devral|alım satım|pay alım|hisse alım|share purchase|sale and purchase", re.I)
CTRL = re.compile(r"pay alım teklif|çağrı|yönetim kontrol|kontrol(?:ün)? değiş|kontrolü|imtiyazlı|% ?(?:[5-9]\d|100)\b|% ?(?:[5-9]\d)[,.]\d|hakim ortak|hâkim ortak|ana ortak|çoğunluk|mandatory tender|control", re.I)
rows = []
for f in (H/"raw/disc").glob("*.txt"):
    i = int(f.stem)
    if i not in D.index: continue
    r = D.loc[i]
    if r.subject not in ("Özel Durum Açıklaması (Genel)", "Haber ve Söylentilere İlişkin Açıklama", "Olağan Dışı Fiyat ve Miktar Hareketleri"): continue
    t = body(f.read_text())
    tr = t.split(" In contradiction")[0]
    if not (OWN.search(tr) and XFER.search(tr) and CTRL.search(tr)): continue
    rows.append({"idx": i, "ts": pd.to_datetime(r.publishDate, format="%d.%m.%Y %H:%M:%S"), "filer": r.stockCodes,
                 "summary": (r.summary or "").strip().replace("\n", " ")[:110], "text": re.sub(r"\s+", " ", tr.replace("oda_ExplanationTextBlock|", ""))[:2500]})
X = pd.DataFrame(rows).sort_values("ts").reset_index(drop=True)
X["ep"] = 0; ep = 0; last = {}
for k, r in X.iterrows():
    key = r.filer
    if key not in last or (r.ts - last[key][1]).days > 270: ep += 1; last[key] = (ep, r.ts)
    X.at[k, "ep"] = last[key][0]; last[key] = (last[key][0], r.ts)
X.to_csv(H/"cand.csv", index=False)
print(len(X), X.ep.nunique())
