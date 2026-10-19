"""All USDC-settled (linear) option trades on Deribit 2024-04-01..2026-10-17 (SOL/XRP/AVAX/BNB/... _USDC)."""
import json, gzip, time, pathlib, sys, urllib.request, datetime as dt
D = pathlib.Path(__file__).parent / "raw" / "usdc"
def get(url, tries=8):
    for i in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                return json.loads(r.read())["result"]
        except Exception as e:
            print("retry", e, file=sys.stderr); time.sleep(2 + 3 * i)
    raise RuntimeError(url)
m = dt.date(2024, 3, 1)
while m <= dt.date(2026, 10, 1):
    nm = (m.replace(day=28) + dt.timedelta(days=4)).replace(day=1)
    f = D / f"{m:%Y-%m}.json.gz"
    if not f.exists():
        s = int(dt.datetime(m.year, m.month, 1, tzinfo=dt.timezone.utc).timestamp()*1000)
        e = int(dt.datetime(nm.year, nm.month, 1, tzinfo=dt.timezone.utc).timestamp()*1000) - 1
        out = []
        while True:
            r = get(f"https://history.deribit.com/api/v2/public/get_last_trades_by_currency_and_time?currency=USDC&kind=option&start_timestamp={s}&end_timestamp={e}&count=1000&sorting=asc")
            tr = r["trades"]; out += [[t["timestamp"], t["instrument_name"], t["price"], t["mark_price"], t["iv"], t["index_price"], t["amount"], t["direction"]] for t in tr]
            if not r["has_more"] or not tr: break
            s = tr[-1]["timestamp"] + 1
        with gzip.open(f, "wt") as g: json.dump(out, g)
        print(m, len(out), flush=True)
    m = nm
