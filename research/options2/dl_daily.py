"""Daily 08:05-10:00 UTC option trade snapshots (BTC, ETH) from history.deribit.com, every calendar day
2021-04-01..2026-10-16. Gives every listed expiry's marks each morning (1DTE dailies, weeklies, term structure)."""
import json, gzip, time, pathlib, sys, urllib.request, datetime as dt
from concurrent.futures import ThreadPoolExecutor
D = pathlib.Path(__file__).parent / "raw" / "daily"
def get(url, tries=8):
    for i in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                return json.loads(r.read())["result"]
        except Exception as e:
            print("retry", e, file=sys.stderr); time.sleep(2 + 3 * i)
    raise RuntimeError(url)
def snap(job):
    cur, day = job
    f = D / cur / f"{day}.json.gz"
    if f.exists(): return
    t0 = int(dt.datetime(day.year, day.month, day.day, 8, 5, tzinfo=dt.timezone.utc).timestamp() * 1000)
    t1 = t0 + 2 * 3600 * 1000 - 5 * 60 * 1000
    trades, s = [], t0
    for _ in range(15):
        r = get(f"https://history.deribit.com/api/v2/public/get_last_trades_by_currency_and_time?currency={cur}&kind=option&start_timestamp={s}&end_timestamp={t1}&count=1000&sorting=asc")
        tr = r["trades"]; trades += tr
        if not r["has_more"] or not tr: break
        s = tr[-1]["timestamp"] + 1
    keep = [[t["timestamp"], t["instrument_name"], t["price"], t["mark_price"], t["iv"], t["index_price"], t["amount"], t["direction"]] for t in trades]
    f.parent.mkdir(parents=True, exist_ok=True)
    with gzip.open(f, "wt") as g: json.dump(keep, g)
if __name__ == "__main__":
    jobs, d = [], dt.date(2021, 4, 1)
    while d <= dt.date(2026, 10, 16):
        for c in ("BTC", "ETH"): jobs.append((c, d))
        d += dt.timedelta(days=1)
    with ThreadPoolExecutor(8) as ex:
        for i, _ in enumerate(ex.map(snap, jobs)):
            if i % 200 == 0: print(i, len(jobs), jobs[i], flush=True)
    print("done")
