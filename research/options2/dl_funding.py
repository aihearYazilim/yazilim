"""Deribit perpetual hourly funding (interest_1h) BTC/ETH 2021-01..2026-10."""
import json, time, pathlib, urllib.request, datetime as dt, pandas as pd
D = pathlib.Path(__file__).parent / "raw"
for inst in ("BTC-PERPETUAL", "ETH-PERPETUAL"):
    out = []; s = dt.datetime(2021, 1, 1, tzinfo=dt.timezone.utc)
    while s < dt.datetime(2026, 10, 18, tzinfo=dt.timezone.utc):
        e = s + dt.timedelta(days=30)
        u = f"https://www.deribit.com/api/v2/public/get_funding_rate_history?instrument_name={inst}&start_timestamp={int(s.timestamp()*1000)}&end_timestamp={int(e.timestamp()*1000)}"
        for i in range(6):
            try: r = json.loads(urllib.request.urlopen(u, timeout=60).read())["result"]; break
            except Exception as ex: time.sleep(3)
        out += r; s = e
    df = pd.DataFrame(out).drop_duplicates("timestamp").sort_values("timestamp")
    df.to_csv(D / f"funding_{inst[:3]}.csv", index=False); print(inst, len(df), df.iloc[0].to_dict())
