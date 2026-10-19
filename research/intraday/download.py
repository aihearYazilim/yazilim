"""Binance spot 1h/4h klines (2020-01-01 onward) -> data/crypto_{1h,4h}/SYM.csv"""
import sys, time, json, pathlib, urllib.request, pandas as pd
from concurrent.futures import ThreadPoolExecutor
ROOT = pathlib.Path(__file__).resolve().parents[2] / "data"
SYMS = ["BTC","ETH","SOL","BNB","XRP","DOGE","ADA","AVAX","LINK","LTC","DOT","TRX","BCH","ATOM","ETC","XLM","NEAR","UNI","FIL"]
START = int(pd.Timestamp("2020-01-01", tz="UTC").timestamp()*1000)
END = int(pd.Timestamp("2026-10-17", tz="UTC").timestamp()*1000)
def get(url):
    for i in range(6):
        try:
            with urllib.request.urlopen(url, timeout=30) as r: return json.loads(r.read())
        except Exception as e:
            time.sleep(2*(i+1)); err = e
    raise err
def dl(sym, iv):
    out = ROOT / f"crypto_{iv}" / f"{sym}.csv"
    if out.exists(): return sym, iv, "exists"
    rows, t = [], START
    while t < END:
        k = get(f"https://data-api.binance.vision/api/v3/klines?symbol={sym}USDT&interval={iv}&startTime={t}&limit=1000")
        if not k: break
        rows += k; t = k[-1][0] + 1
        if len(k) < 1000: break
    df = pd.DataFrame(rows, columns="ot o h l c v ct qv n tb tq x".split())
    idx = pd.to_datetime(df.ot.astype("int64"), unit="ms").values
    df = pd.DataFrame({"open":df.o.astype(float).values,"high":df.h.astype(float).values,"low":df.l.astype(float).values,
                       "close":df.c.astype(float).values,"volume":df.v.astype(float).values,"quote_volume":df.qv.astype(float).values},
                      index=pd.DatetimeIndex(idx))
    df = df[df.index < pd.Timestamp("2026-10-17")]
    df.index.name = "time"; df.to_csv(out); return sym, iv, len(df)
if __name__ == "__main__":
    jobs = [(s, iv) for iv in ["4h","1h"] for s in SYMS]
    with ThreadPoolExecutor(6) as ex:
        for r in ex.map(lambda a: dl(*a), jobs): print(r, flush=True)
