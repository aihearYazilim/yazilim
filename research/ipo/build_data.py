"""IPO tablosu + Yahoo fiyatlarını birleştirir; split düzeltmesini geri alır (ham TL fiyat).
Çıktı: ipos.csv (IPO başına bilgiler), prices/<TICKER>.csv (ham OHLCV)"""
import json, pathlib, numpy as np, pandas as pd
H = pathlib.Path(__file__).parent
R = H / "raw" / "yahoo"; P = H / "prices"; P.mkdir(exist_ok=True)
ipo = pd.read_csv(H / "ipos_raw.csv")
# eksik sonuç satırlarını "Yurt İçi Gerçek Kişi"/"Yurtiçi Bireysel" varyantlarıyla tekrar doldur
import re, html
def lines(tk):
    s = open(H/"raw"/"detail"/f"{tk}.html", encoding="utf-8").read()
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", s, flags=re.S)
    t = html.unescape(re.sub(r"<[^>]+>", "\n", t))
    return [l.strip() for l in t.split("\n") if l.strip()]
def num(s):
    try: return float(s.replace(".", "").replace(",", "."))
    except: return None
pat = re.compile(r"^Yurt ?[İi]çi (Bireysel|Gerçek Kişi)", re.I)
for i, r in ipo.iterrows():
    if pd.isna(r.retail_people):
        L = lines(r.ticker)
        for j, l in enumerate(L):
            if pat.match(l) and j+3 < len(L) and L[j+3].startswith("%"):
                a, b = num(L[j+1]), num(L[j+2])
                if a and b: ipo.loc[i, ["retail_people", "retail_lots"]] = [a, b]; break
rows = []
for i, r in ipo.iterrows():
    f = R / f"{r.ticker}.json"
    try:
        d = json.load(open(f))["chart"]["result"][0]; ts = d["timestamp"]
    except Exception:
        ipo.loc[i, "price_ok"] = False; continue
    q = d["indicators"]["quote"][0]
    idx = pd.to_datetime(np.array(ts) + 10800, unit="s").normalize()
    df = pd.DataFrame({k: q[k] for k in ["open", "high", "low", "close", "volume"]}, index=idx).dropna()
    df = df[~df.index.duplicated(keep="last")]
    # split düzeltmesini geri al: tarih < split tarihi olanlar * oran
    fac = pd.Series(1.0, index=df.index)
    for s in d.get("events", {}).get("splits", {}).values():
        sd = pd.to_datetime(s["date"] + 10800, unit="s").normalize()
        fac[fac.index < sd] *= s["numerator"] / s["denominator"]
    for c in ["open", "high", "low", "close"]: df[c] = df[c] * fac
    df["volume"] = df["volume"] / fac
    df.to_csv(P / f"{r.ticker}.csv")
    first = df.index[0]
    ipo.loc[i, "yahoo_first"] = first.date().isoformat()
    ipo.loc[i, "d1_close_over_offer"] = df.close.iloc[0] / r.price if r.price else np.nan
    ipo.loc[i, "price_ok"] = True
ipo["share_lots"] = np.floor(ipo.retail_lots / ipo.retail_people)
ipo["share_tl"] = ipo.share_lots * ipo.price
ipo.to_csv(H / "ipos.csv", index=False)
print(ipo[["ticker", "first_trade", "yahoo_first", "d1_close_over_offer", "share_lots", "share_tl"]].to_string())
