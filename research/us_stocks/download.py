"""Download daily OHLCV+adjclose from Yahoo chart API for all S&P500 members since 2004 (PIT list from fja05680/sp500)."""
import pandas as pd, requests, json, time, pathlib, sys, concurrent.futures as cf
R = pathlib.Path(__file__).parent / "raw"
OUT = R / "px"; OUT.mkdir(exist_ok=True, parents=True)
H = {"User-Agent": "Mozilla/5.0"}

def tickers():
    d = pd.read_csv(R / "membership/sp500_hist.csv", parse_dates=["date"])
    s = set()
    for t in d[d.date >= "2004-01-01"].tickers: s |= set(t.split(","))
    cur = pd.read_html(R / "membership/wiki_sp500.html")[0]["Symbol"].tolist()
    s |= set(cur)
    return sorted(s) + ["SPY", "QQQ", "SH", "RSP", "MTUM", "USMV", "^IRX", "TRY=X", "SSO", "UPRO"]

def fetch(t):
    f = OUT / (t.replace("^", "_").replace("=", "_") + ".csv")
    if f.exists(): return t, "cached"
    y = t.replace(".", "-")
    url = f"https://query2.finance.yahoo.com/v8/finance/chart/{y}?period1=1072915200&period2=1792540800&interval=1d&events=div,split"
    for k in range(4):
        try:
            r = requests.get(url, headers=H, timeout=30)
            if r.status_code == 404: return t, "404"
            if r.status_code != 200: time.sleep(2 + 3 * k); continue
            j = r.json()["chart"]["result"][0]
            ts = j.get("timestamp")
            if not ts: return t, "empty"
            q = j["indicators"]["quote"][0]
            adj = j["indicators"].get("adjclose", [{}])[0].get("adjclose", q["close"])
            df = pd.DataFrame({"open": q["open"], "high": q["high"], "low": q["low"], "close": q["close"],
                               "adjclose": adj, "volume": q["volume"]},
                              index=pd.to_datetime(ts, unit="s").normalize())
            df.index.name = "date"
            df = df[~df.index.duplicated(keep="last")].dropna(subset=["close"])
            df.to_csv(f)
            return t, len(df)
        except Exception as e:
            time.sleep(2 + 3 * k); err = str(e)
    return t, "fail"

if __name__ == "__main__":
    ts = tickers(); print(len(ts))
    res = {}
    with cf.ThreadPoolExecutor(6) as ex:
        for t, r in ex.map(fetch, ts):
            res[t] = r
    json.dump(res, open(R / "download_log.json", "w"), indent=0)
    print(pd.Series({k: (v if isinstance(v, str) else "ok") for k, v in res.items()}).value_counts())
