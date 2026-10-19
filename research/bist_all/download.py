"""Tüm BIST evrenini indir.
1) Ticker+sektör listesi: isyatirim 'Temel Değerler ve Oranlar' sayfası (güncel listelenen ~630 hisse).
   NOT: bu liste BUGÜN işlem gören hisseleri içerir -> delist olmuş hisseler yok (survivorship bias).
2) Yahoo v8 chart API, range=10y, interval=1d. Throttle + 429 retry.
Çıktı: data/bist_all/<TICKER>.csv (open,high,low,close,volume — Yahoo 'close' temettü/bölünme
düzeltmesi için adjclose oranı ile OHLC ölçeklenir), data/bist_all/_universe.csv (ticker,name,sector)
"""
import re, sys, time, json, pathlib, urllib.request, html
import pandas as pd

OUT = pathlib.Path(__file__).resolve().parents[2] / "data" / "bist_all"
OUT.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0"}

def get(url, tries=6):
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            time.sleep(5 * (k + 1) if e.code == 429 else 2)
        except Exception:
            time.sleep(2 * (k + 1))
    return None

def universe():
    f = OUT / "_universe.csv"
    if f.exists():
        return pd.read_csv(f)
    h = get("https://www.isyatirim.com.tr/tr-tr/analiz/hisse/Sayfalar/Temel-Degerler-Ve-Oranlar.aspx").decode("utf-8", "ignore")
    rows = re.findall(r'hisse=([A-Z0-9]+)">\1</a></td><td>([^<]*)</td><td>([^<]*)</td>', h)
    df = pd.DataFrame(rows, columns=["ticker", "name", "sector"]).drop_duplicates("ticker")
    df["name"] = df["name"].map(lambda s: html.unescape(s).strip())
    df["sector"] = df["sector"].map(lambda s: html.unescape(s).strip())
    df.to_csv(f, index=False)
    return df

def fetch(t):
    f = OUT / f"{t}.csv"
    if f.exists():
        return "skip"
    raw = get(f"https://query2.finance.yahoo.com/v8/finance/chart/{t}.IS?range=10y&interval=1d&events=div%2Csplit")
    if raw is None:
        return "fail"
    j = json.loads(raw)
    res = (j.get("chart") or {}).get("result")
    if not res:
        return "empty"
    r = res[0]
    ts = r.get("timestamp")
    if not ts:
        return "empty"
    q = r["indicators"]["quote"][0]
    df = pd.DataFrame({k: q.get(k) for k in ["open", "high", "low", "close", "volume"]},
                      index=pd.to_datetime(ts, unit="s").tz_localize("UTC").tz_convert("Europe/Istanbul").normalize().tz_localize(None))
    adj = r["indicators"].get("adjclose", [{}])[0].get("adjclose")
    if adj is not None:
        ratio = pd.Series(adj, index=df.index) / df["close"]
        df["adj_ratio"] = ratio
    df = df[~df.index.duplicated(keep="last")].dropna(subset=["close"])
    df.to_csv(f)
    return len(df)

if __name__ == "__main__":
    u = universe()
    tickers = list(u["ticker"]) + ["XU100", "XU030", "XUTUM"]
    print(len(tickers), "ticker")
    for i, t in enumerate(tickers):
        s = fetch(t)
        if s != "skip":
            time.sleep(0.35)
        if i % 50 == 0:
            print(i, t, s, flush=True)
