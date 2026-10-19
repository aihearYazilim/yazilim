"""Download hourly (and optional 1m) data: Binance TRY pairs, BtcTurk graph-api, Yahoo USDTRY=X hourly."""
import json, sys, time, pathlib, urllib.request, pandas as pd
RAW = pathlib.Path(__file__).resolve().parent / "raw"
RAW.mkdir(exist_ok=True)
START = int(pd.Timestamp("2021-01-01", tz="UTC").timestamp())
END = int(pd.Timestamp("2026-10-17", tz="UTC").timestamp())

def get(url, ua=False):
    for k in range(5):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"} if ua else {})
            return json.load(urllib.request.urlopen(req, timeout=60))
        except Exception as e:
            print("retry", url, e); time.sleep(2 + 3 * k)
    raise RuntimeError(url)

def binance(sym, interval="1h"):
    out = RAW / f"bn_{sym}_{interval}.csv"
    if out.exists(): return
    step = {"1h": 3600, "1m": 60}[interval] * 1000
    t, rows = START * 1000, []
    while t < END * 1000:
        d = get(f"https://data-api.binance.vision/api/v3/klines?symbol={sym}&interval={interval}&limit=1000&startTime={t}&endTime={END*1000}")
        if not d:
            t += 1000 * step; continue
        rows += d; t = d[-1][0] + step
    df = pd.DataFrame(rows).iloc[:, [0, 1, 2, 3, 4, 5, 7, 8]]
    df.columns = ["t", "open", "high", "low", "close", "vol", "qvol", "n"]
    df["t"] = pd.to_datetime(df.t, unit="ms", utc=True)
    df.drop_duplicates("t").to_csv(out, index=False); print(sym, interval, len(df))

def btcturk(sym, res=60):
    out = RAW / f"bt_{sym}_{res}.csv"
    if out.exists(): return
    span = res * 60 * 8000
    frames, t = [], START
    while t < END:
        d = get(ua=True, url=f"https://graph-api.btcturk.com/v1/klines/history?symbol={sym}&resolution={res}&from={t}&to={min(t+span, END)}")
        if d.get("s") == "ok":
            frames.append(pd.DataFrame({k: d[k] for k in "tohlcv"}))
        t += span
        time.sleep(0.3)
    df = pd.concat(frames).drop_duplicates("t").sort_values("t")
    df.columns = ["t", "open", "high", "low", "close", "vol"]
    df["t"] = pd.to_datetime(df.t, unit="s", utc=True)
    df.to_csv(out, index=False); print(sym, res, len(df))

def yahoo_hourly(sym="USDTRY=X"):
    d = get(f"https://query2.finance.yahoo.com/v8/finance/chart/{sym}?interval=60m&range=730d", ua=True)["chart"]["result"][0]
    q = d["indicators"]["quote"][0]
    df = pd.DataFrame({"t": pd.to_datetime(d["timestamp"], unit="s", utc=True), **{k: q[k] for k in ["open", "high", "low", "close"]}})
    df.to_csv(RAW / f"yh_{sym.replace('=','')}_1h.csv", index=False); print(sym, len(df))

if __name__ == "__main__":
    what = sys.argv[1:] or ["bn", "bt", "yh"]
    if "bn" in what:
        for s in ["USDTTRY", "BTCTRY", "ETHTRY", "BTCUSDT", "ETHUSDT", "BUSDTRY", "FDUSDTRY", "USDCTRY", "EURUSDT"]:
            try: binance(s)
            except Exception as e: print("fail", s, e)
    if "bt" in what:
        for s in ["USDTTRY", "BTCTRY", "ETHTRY", "BTCUSDT", "USDCTRY"]:
            try: btcturk(s)
            except Exception as e: print("fail", s, e)
    if "yh" in what:
        yahoo_hourly()
    if "bn1m" in what:
        binance("USDTTRY", "1m")
    if "bt1m" in what:
        btcturk("USDTTRY", 1)
