"""halkarz.com detay sayfalarını ayrıştırır -> ipos_raw.csv"""
import re, html, json, pathlib, csv
D = pathlib.Path(__file__).parent / "raw"
AY = {"ocak":1,"şubat":2,"mart":3,"nisan":4,"mayıs":5,"haziran":6,"temmuz":7,"ağustos":8,"eylül":9,"ekim":10,"kasım":11,"aralık":12}
def text(f):
    s = open(f, encoding="utf-8").read()
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", s, flags=re.S)
    t = html.unescape(re.sub(r"<[^>]+>", "\n", t))
    return [l.strip() for l in t.split("\n") if l.strip()]
def after(L, key):
    for i, l in enumerate(L):
        if l.startswith(key):
            return L[i+1] if i+1 < len(L) else ""
    return ""
def num(s):
    s = s.replace(".", "").replace(",", ".").replace("%", "")
    try: return float(s)
    except: return None
def parse_dates(s):
    # "7-8-9 Haziran 2023" or "29-30 Kasım, 1 Aralık 2023" or "28 Şubat, 1 Mart 2024"
    s = s.lower().replace(",", " ")
    toks = s.split(); yr = None
    for t in toks:
        if re.fullmatch(r"20\d\d", t): yr = int(t)
    days = []; pending = []
    for t in toks:
        if t in AY:
            for d in pending: days.append((AY[t], d))
            pending = []
        elif re.fullmatch(r"[\d\-]+", t) and not re.fullmatch(r"20\d\d", t):
            pending += [int(x) for x in t.split("-") if x]
    if not days or yr is None: return None, None
    # yıl geçişi (Aralık->Ocak)
    m0, d0 = days[0]; m1, d1 = days[-1]
    y0 = yr - 1 if m0 > m1 else yr
    return f"{y0}-{m0:02d}-{d0:02d}", f"{yr}-{m1:02d}-{d1:02d}"
def parse_one_date(s):
    m = re.search(r"(\d{1,2})\s+(\w+)\s+(20\d\d)", s.lower())
    if not m or m.group(2) not in AY: return None
    return f"{m.group(3)}-{AY[m.group(2)]:02d}-{int(m.group(1)):02d}"
rows = []
lst = json.load(open(D / "list.json"))
for yr, tk, url in lst:
    L = text(D / "detail" / f"{tk}.html")
    r = {"cat_year": yr, "ticker": tk}
    r["sub_text"] = after(L, "Halka Arz Tarihi")
    r["sub_start"], r["sub_end"] = parse_dates(r["sub_text"])
    pt = after(L, "Halka Arz Fiyatı")
    r["price_text"] = pt
    m = re.findall(r"[\d\.]+,\d+|\d+", pt)
    r["price"] = num(m[-1]) if m else None   # aralıkta son (üst) değer; kesin fiyat genelde tek
    r["method"] = after(L, "Dağıtım Yöntemi")
    r["lots_total"] = num(after(L, "Pay :").replace("Lot", "").strip())
    r["first_trade"] = parse_one_date(after(L, "Bist İlk İşlem Tarihi"))
    r["market"] = after(L, "Pazar :")
    # sonuç tablosu: Yurt İçi Bireysel, kişi, lot, oran
    r["retail_people"] = r["retail_lots"] = None
    for i, l in enumerate(L):
        if l == "Yurt İçi Bireysel" and i+3 < len(L):
            a, b = num(L[i+1]), num(L[i+2])
            if a and b and L[i+3].startswith("%"):
                r["retail_people"], r["retail_lots"] = a, b
                break
    rows.append(r)
keys = list(rows[0].keys())
with open(pathlib.Path(__file__).parent / "ipos_raw.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, keys); w.writeheader(); w.writerows(rows)
print(len(rows), sum(1 for r in rows if r["retail_people"]), sum(1 for r in rows if r["first_trade"]))
