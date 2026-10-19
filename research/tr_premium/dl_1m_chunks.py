"""Chunked (per-month files) 1-minute USDTTRY download, BtcTurk + Binance, 2025-01..2026-10. Resumable."""
import sys, time, pandas as pd
from download import get, RAW
D = RAW / "m1"; D.mkdir(exist_ok=True)
months = pd.date_range("2025-01-01", "2026-10-01", freq="MS", tz="UTC")
def month(m):
    t0, t1 = int(m.timestamp()), int(min(m + pd.offsets.MonthBegin(1), pd.Timestamp("2026-10-17", tz="UTC")).timestamp())
    f = D / f"bt_{m:%Y%m}.csv"
    if not f.exists():
        fr = []
        for t in range(t0, t1, 8000 * 60):
            d = get(ua=True, url=f"https://graph-api.btcturk.com/v1/klines/history?symbol=USDTTRY&resolution=1&from={t}&to={min(t+8000*60, t1)}")
            if d.get("s") == "ok": fr.append(pd.DataFrame({"t": d["t"], "close": d["c"], "vol": d["v"]}))
        pd.concat(fr).drop_duplicates("t").to_csv(f, index=False)
    f = D / f"bn_{m:%Y%m}.csv"
    if not f.exists():
        rows, t = [], t0 * 1000
        while t < t1 * 1000:
            d = get(f"https://data-api.binance.vision/api/v3/klines?symbol=USDTTRY&interval=1m&limit=1000&startTime={t}&endTime={t1*1000-1}")
            if not d: break
            rows += [(r[0] // 1000, float(r[4]), float(r[5])) for r in d]; t = d[-1][0] + 60000
        pd.DataFrame(rows, columns=["t", "close", "vol"]).to_csv(f, index=False)
    print(m.date(), flush=True)
for m in months[int(sys.argv[1]):int(sys.argv[2])]:
    month(m)
