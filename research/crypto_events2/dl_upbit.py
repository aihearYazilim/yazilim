"""Upbit KRW-market listing times (proxy). The Upbit notice API is Cloudflare-blocked from this IP, so the event time is
the FIRST traded 1h candle of each currently-listed KRW-X market (trading start; the notice usually precedes it by
~0.5-3h). Survivorship: markets already delisted from Upbit are missing. Saves raw/upbit_krw_first.csv."""
import json, time, pathlib, urllib.request, pandas as pd
R = pathlib.Path(__file__).parent / "raw"
def get(u):
    for i in range(6):
        try:
            x = json.loads(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=30).read())
            time.sleep(0.13); return x
        except Exception as e: err = e; time.sleep(1 + 2 * i)
    raise err
mk = [m["market"] for m in get("https://api.upbit.com/v1/market/all") if m["market"].startswith("KRW-")]
rows = []
for m in mk:
    w = get(f"https://api.upbit.com/v1/candles/weeks?market={m}&count=200")
    while len(w) == 200:
        w2 = get(f"https://api.upbit.com/v1/candles/weeks?market={m}&count=200&to={w[-1]['candle_date_time_utc']}")
        if not w2: break
        w += w2
    wk0 = pd.Timestamp(w[-1]["candle_date_time_utc"])
    d = get(f"https://api.upbit.com/v1/candles/days?market={m}&count=10&to={(wk0 + pd.Timedelta(days=8)).strftime('%Y-%m-%dT%H:%M:%S')}")
    d0 = min(pd.Timestamp(x["candle_date_time_utc"]) for x in d)
    h = get(f"https://api.upbit.com/v1/candles/minutes/60?market={m}&count=30&to={(d0 + pd.Timedelta(days=1)).strftime('%Y-%m-%dT%H:%M:%S')}")
    h0 = min(pd.Timestamp(x["candle_date_time_utc"]) for x in h)
    rows.append((m, m[4:], h0)); print(m, h0, flush=True) if len(rows) % 50 == 0 else None
pd.DataFrame(rows, columns=["market", "tok", "first_1h"]).to_csv(R / "upbit_krw_first.csv", index=False)
print(len(rows))
