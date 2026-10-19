"""Otomatik olay tespiti: hedef şirketin kendi bildiriminde kontrol değişikliği / çağrı yükümlülüğü ilk açıklaması."""
import re, pandas as pd, pathlib
H = pathlib.Path(__file__).parent
X = pd.read_csv(H/"cand.csv", parse_dates=["ts"])
TENDER = re.compile(r"(zorunlu pay alım teklif|pay alım teklifinde bulunma (zorunluluğu|yükümlülüğü)|çağrı yükümlülüğ|zorunlu çağrı|pay alım teklifi yükümlülüğ|pay alım teklifi zorunluluğ)", re.I)
CTRLCH = re.compile(r"yönetim kontrolü(nün)? (el )?değiş|yönetim kontrolünü (ele )?(geçir|kazan|elde)|yönetim kontrolünün .{0,60}(geçmesi|devri|el değiştir)|kontrol değişikliğ|yönetim kontrolü .{0,60}(kazanıl|geçecek|geçmiş)", re.I)
NOCHG = re.compile(r"yönetim kontrolünde (herhangi bir )?değişiklik (olmamış|olmayacak|bulunmamakta|meydana gelmeyecek)|kontrol(ü|ünde) değiş(mey|mem)", re.I)
SPA = re.compile(r"(pay|hisse)[^.;]{0,150}?(devir|devr|satış|satın alı|alım|alış)[^.;]{0,80}?(sözleşme|anlaşma|mutabakat)[^.;]{0,200}?(imzala|akdedil|imza altına|varıl)|share purchase agreement|pay devir sözleşmesi", re.I)
MAJ = re.compile(r"% ?(?:[5-9]\d|100)(?:[,.]\d+)?\b|imtiyazlı|hakim ortak|hâkim ortak|ana ortak|tamamını|yönetim kurulu üyelerinin (çoğunluğunu|yarısından fazlasını)", re.I)
NEGS = re.compile(r"^\s*(\"?\s*)?(bağlı ortaklığımız|iştirakimiz|şirketimiz tarafından|şirketimizin (%\s?[\d,]+ (oranında )?)?(doğrudan |dolaylı )?bağlı ortaklığı|şirketimizin [%\d, ]+ oranında pay sahibi olduğu)|aracılığını yürüt|aracılığımızla|aracı kurum olarak", re.I)
NEGO = re.compile(r"görüşme|müzakere|niyet mektubu|ön protokol|mutabakat zaptı|letter of intent|bağlayıcı olmayan", re.I)
rows = []
for _, r in X.iterrows():
    t = r.text
    if NEGS.search(t[:400]) or NEGS.search(t): neg = True
    else: neg = False
    ten = bool(TENDER.search(t)); cc = bool(CTRLCH.search(t)) and not NOCHG.search(t)
    spa = bool(SPA.search(t)) and bool(MAJ.search(t))
    nego = bool(NEGO.search(t)) and bool(MAJ.search(t))
    if neg or not (ten or cc or spa or nego): continue
    rows.append(dict(idx=r.idx, ts=r.ts, filer=r.filer, ep=r.ep, ten=ten, cc=cc, spa=spa, nego=nego, summary=r.summary, text=t))
E = pd.DataFrame(rows)
E.to_csv(H/"cand_auto.csv", index=False)
print(len(E), E.ep.nunique())
