import json, urllib.request, pandas as pd, pathlib
D = pathlib.Path(__file__).parent / "data"
for idx in ("btc_usd", "eth_usd"):
    out, off = [], 0
    while True:
        r = json.loads(urllib.request.urlopen(f"https://www.deribit.com/api/v2/public/get_delivery_prices?index_name={idx}&offset={off}&count=1000").read())["result"]
        out += r["data"]; off += len(r["data"])
        if off >= r["records_total"] or not r["data"]: break
    pd.DataFrame(out).sort_values("date").to_csv(D / f"deliv_{idx}.csv", index=False); print(idx, len(out), out[-1])
