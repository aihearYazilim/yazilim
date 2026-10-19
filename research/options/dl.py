"""Download Deribit DVOL (daily) and option trade snapshots on Fridays 08:00-10:00 UTC
(history.deribit.com), BTC & ETH, 2021-03-26 .. 2026-10-16."""
import json, time, pathlib, sys, urllib.request, datetime as dt
import pandas as pd
D = pathlib.Path(__file__).parent / "data"
def get(url, tries=5):
    for i in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                return json.loads(r.read())["result"]
        except Exception as e:
            print("retry", e, file=sys.stderr); time.sleep(2 + 3 * i)
    raise RuntimeError(url)

def dvol(cur):
    out = []
    end = int(dt.datetime(2026, 10, 18).timestamp() * 1000)
    start = int(dt.datetime(2021, 3, 1).timestamp() * 1000)
    while True:
        r = get(f"https://www.deribit.com/api/v2/public/get_volatility_index_data?currency={cur}&start_timestamp={start}&end_timestamp={end}&resolution=1D")
        out += r["data"]
        if not r.get("continuation"): break
        end = r["continuation"]
    df = pd.DataFrame(out, columns=["ts", "open", "high", "low", "close"]).drop_duplicates("ts").sort_values("ts")
    df["date"] = pd.to_datetime(df.ts, unit="ms").dt.date
    df.to_csv(D / f"dvol_{cur}.csv", index=False); print(cur, len(df))

def snap(cur, day):
    f = D / "snap" / cur / f"{day}.json"
    if f.exists(): return
    t0 = int(dt.datetime(day.year, day.month, day.day, 8, 5, tzinfo=dt.timezone.utc).timestamp() * 1000)
    t1 = t0 + 2 * 3600 * 1000 - 5 * 60 * 1000
    trades, s = [], t0
    for _ in range(10):
        r = get(f"https://history.deribit.com/api/v2/public/get_last_trades_by_currency_and_time?currency={cur}&kind=option&start_timestamp={s}&end_timestamp={t1}&count=1000&sorting=asc")
        tr = r["trades"]; trades += tr
        if not r["has_more"] or not tr: break
        s = tr[-1]["timestamp"] + 1
    keep = [{k: t[k] for k in ("timestamp", "instrument_name", "price", "mark_price", "iv", "index_price", "amount", "direction")} for t in trades]
    f.parent.mkdir(parents=True, exist_ok=True); f.write_text(json.dumps(keep))

if __name__ == "__main__":
    for c in ("BTC", "ETH"): dvol(c)
    d = dt.date(2021, 3, 26)
    days = []
    while d <= dt.date(2026, 10, 16):
        days.append(d); d += dt.timedelta(days=7)
    for c in ("BTC", "ETH"):
        for i, day in enumerate(days):
            snap(c, day)
            if i % 25 == 0: print(c, day, flush=True)
