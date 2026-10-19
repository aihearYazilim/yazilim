"""Hyperliquid daily candles (close) for cross-exchange basis P&L."""
import json, urllib.request, time, pathlib, sys, pandas as pd
D = pathlib.Path(__file__).parent / "data" / "hl_px"; D.mkdir(parents=True, exist_ok=True)
for c in sys.argv[1].split(","):
    body = {"type": "candleSnapshot", "req": {"coin": c, "interval": "1d", "startTime": 1683000000000, "endTime": 1792400000000}}
    req = urllib.request.Request("https://api.hyperliquid.xyz/info", json.dumps(body).encode(), {"Content-Type": "application/json"})
    r = json.loads(urllib.request.urlopen(req, timeout=60).read())
    pd.DataFrame([(x["t"], float(x["c"]), float(x["v"]) * float(x["c"])) for x in r], columns=["ts", "close", "qvol"]).to_csv(D / f"{c}.csv", index=False)
    print(c, len(r)); time.sleep(2)
