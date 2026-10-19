"""Pay alım teklifi bildirimlerinden deal tablosu: hedef, fiyat, tür, başlangıç/bitiş, ilk bilinme zamanı."""
import json, glob, re, pathlib, pandas as pd, numpy as np
H = pathlib.Path(__file__).parent
def num(s):
    s = s.strip().rstrip('.').replace('TL', '').strip()
    return float(s.replace('.', '').replace(',', '.')) if ',' in s else float(s)
def dt(s):
    return pd.to_datetime(s.replace('/', '.'), format="%d.%m.%Y", errors="coerce")
rows = []
for f in sorted(glob.glob(str(H/"raw/kap/tof*.json"))):
    for r in json.load(open(f)):
        p = H/"raw/disc"/f"{r['disclosureIndex']}.txt"
        if not p.exists(): continue
        t = p.read_text()
        d = {"idx": r["disclosureIndex"], "ts": pd.to_datetime(r["publishDate"], format="%d.%m.%Y %H:%M:%S"),
             "filer": r["stockCodes"], "summary": (r["summary"] or "")[:100], "src": pathlib.Path(f).stem.split("_")[0]}
        m = re.search(r"İlgili Şirketler \[?([A-Z0-9, ]+?)\]? (?:İşlem Türü|İlgili Fonlar|Türkçe)", t)
        d["related"] = m.group(1).replace(" ", "") if m else ""
        m = re.search(r"İşlem Türü (Zorunlu|Gönüllü)", t) or re.search(r"(Zorunlu|Gönüllü) [Pp]ay [Aa]lım", t)
        d["kind"] = m.group(1) if m else ""
        # fiyat: tablo satırı  "..., TICKER, TRxxxxxxxxxx <Nevi> Değil - 7,40111" ya da bilgi formu "Tender Offer Price (TRY) 6,09 TL"
        prices = re.findall(r"([A-Z0-9]{3,6}), (TR[A-Z0-9]{10}) (?:Hamiline|Nâma|Nama|Paya|[A-Za-zÂâİı]+) Değil[^\d]{0,30}?(\d[\d.]*,\d+|\d+)\b", t)
        if prices:
            d["target"] = prices[0][0]; d["price"] = num(prices[0][2]); d["n_classes"] = len({p[0] for p in prices})
        else:
            m = re.search(r"Tender Offer Price \(TRY\) ([\d.,]+)", t)
            if m:
                try: d["price"] = num(m.group(1))
                except: pass
            d["target"] = d["related"].split(",")[0] if d["related"] else ""
        m = re.search(r"Başlangıç Tarihi (?:Beginning Date of Tender Offer )?(\d\d[./]\d\d[./]\d{4})", t); d["start"] = dt(m.group(1)) if m else pd.NaT
        m = re.search(r"Bitiş Tarihi (?:Ending Date of Tender Offer )?(\d\d[./]\d\d[./]\d{4})", t); d["end"] = dt(m.group(1)) if m else pd.NaT
        m = re.search(r"Belirlenmesinde Esas Alınan Tarih (?:The Date Based on the Determination of the Shareholders and Share Amounts to Benefit from the Takeover Bid )?(\d\d[./]\d\d[./]\d{4})", t)
        d["record"] = dt(m.group(1)) if m else pd.NaT
        d["fund_cap"] = bool(re.search(r"fon miktarını aşmamak|en fazla [\d.,]+ (?:TL nominal|adet)|azami", t))
        d["pay_next_day"] = "1. iş günü" in t
        rows.append(d)
D = pd.DataFrame(rows).sort_values("ts")
D.to_csv(H/"tof_disclosures.csv", index=False)
print(len(D), D.price.notna().sum(), D.start.notna().sum())
# deal = (target, start) ; first-known = ilk bildirim (fiyat + tarih)
ok = D[D.price.notna() & D.start.notna() & (D.target != "")]
deals = ok.groupby(["target", "start"]).agg(first_ts=("ts", "min"), end=("end", "max"), price=("price", "first"),
          price_last=("price", "last"), kind=("kind", "first"), fund_cap=("fund_cap", "max"), record=("record", "min"), n=("idx", "size"),
          classes=("n_classes", "max"), related=("related", "first"), summary=("summary", "first")).reset_index()
deals.to_csv(H/"tof_deals.csv", index=False)
pd.set_option("display.width", 250); pd.set_option("display.max_rows", 300)
print(deals[["target", "start", "end", "first_ts", "price", "price_last", "kind", "fund_cap", "n", "classes"]])
