"""Tam metinlerden kontrol değişikliği bildirimlerini sınıflandır -> cc_disclosures.csv"""
import re, pathlib, pandas as pd, numpy as np
H = pathlib.Path(__file__).parent
D = pd.read_pickle(H/"raw/oda_all.pkl").set_index("disclosureIndex")
def body(t):
    i = t.find("Açıklamalar Explanations"); t = t[i+24:] if i >= 0 else t
    j = t.find("Yukarıdaki açıklamalarımızın"); t = t[:j] if j > 0 else t
    return t
SELF = r"(şirketimiz|bankamız|ortaklığımız|şirketin|şirket)(in|ın|ımız)?\b"
AGR = re.compile(r"(pay|hisse)[^.;]{0,120}?(devir|devr|satış|satın alı|alım|alış)[^.;]{0,60}?(sözleşme|anlaşma|agreement)[^.;]{0,160}?(imzala|akdedil|imza altına|signed|tamamlan)|share purchase agreement|pay devir sözleşmesi", re.I)
CTRL = re.compile(r"yönetim kontrol|kontrolün(ün)? (el )?değiş|kontrol değişikliğ|pay alım teklifi|çağrı yükümlülüğ|zorunlu pay alım|ha[kâ]kim ortak|ha[kâ]kimiyet|yönetim hakimiyet|ana ortak|change of control|mandatory tender|imtiyazlı|% ?[5-9]\d[,.]?\d*|%100|tamamını|tamamının|çoğunluk", re.I)
NEG = re.compile(r"(niyet mektubu|görüşme|müzakere|ön protokol|mutabakat zaptı|letter of intent|due diligence|inceleme süreci|satış süreci|stratejik (ortak|yatırımcı)|teklif (alındı|alınmış|mektubu)|bağlayıcı olmayan)", re.I)
CANCEL = re.compile(r"(fesh|feshed|feshi|sona er|iptal|vazgeç|gerçekleşmeyecek|gerçekleşmemiş|sonlandır|olumsuz sonuç|rescind|terminat|uzlaşı sağlanamam|anlaşma sağlanamam|cayma)", re.I)
EXEMPT = re.compile(r"muaf", re.I)
CLOSE = re.compile(r"(pay devri|pay devir işlemi|hisse devri|devir işlemi|satış işlemi|pay satış işlemi|kapanış|closing)[^.;]{0,120}?(tamamlan|gerçekleştiril|gerçekleşmiş|completed)", re.I)
APPR = re.compile(r"rekabet kurulu|rekabet kurumu|bddk|epdk|spk[^.]{0,50}onay", re.I)
PRICE = re.compile(r"(pay|hisse) başına[^.;]{0,60}?(\d[\d.]*,\d+|\d+)\s*(TL|Türk Lirası|ABD Doları|USD|Avro|EUR|Euro)|(\d[\d.]*,\d+|\d+)\s*(TL|Türk Lirası|ABD Doları|USD|Avro|EUR)[^.;]{0,40}?(pay|hisse) başına|1 TL nominal değerli (?:beher )?(?:pay|hisse)[^.;]{0,40}?(\d[\d.]*,\d+|\d+)\s*(TL|ABD Doları|USD|Avro|EUR)", re.I)
def num(s):
    s = s.strip().rstrip('.')
    return float(s.replace('.', '').replace(',', '.')) if ',' in s else float(s.replace('.', '')) if s.count('.') > 1 else float(s)
def _main():
    rows = []
    for f in (H/"raw/disc").glob("*.txt"):
        i = int(f.stem)
        if i not in D.index: continue
        t = body(f.read_text()); tl = t.lower(); r = D.loc[i]
        agr = bool(AGR.search(t)); ctrl = bool(CTRL.search(t)); self_ = bool(re.search(SELF + r"[^.;]{0,60}(sermaye|pay|hisse|ortak)", tl))
        if not ((agr or NEG.search(t) or CLOSE.search(t) or EXEMPT.search(t)) and ctrl and self_): continue
        pm = PRICE.search(t); pr = cur = None
        if pm:
            g = [x for x in pm.groups() if x]
            try:
                nums = [x for x in g if re.match(r"\d", x)]; pr = num(nums[0]); cur = [x for x in g if re.match(r"[A-Za-zT]", x) and x.lower() not in ("pay", "hisse")][0]
            except Exception: pass
        rows.append({"idx": i, "ts": pd.to_datetime(r.publishDate, format="%d.%m.%Y %H:%M:%S"), "filer": r.stockCodes, "subject": r.subject,
                     "summary": (r.summary or "").strip()[:120], "agr": agr, "neg": bool(NEG.search(t)), "cancel": bool(CANCEL.search(t)),
                     "exempt": bool(EXEMPT.search(t)), "closed": bool(CLOSE.search(t)), "tender": "pay alım teklif" in tl or "çağrı" in tl,
                     "price": pr, "cur": cur, "text": t[:1500]})
    X = pd.DataFrame(rows).sort_values("ts"); X.to_csv(H/"cc_disclosures.csv", index=False)
    print(len(X), X.agr.sum(), X.filer.nunique())
    
if __name__ == "__main__": _main()
