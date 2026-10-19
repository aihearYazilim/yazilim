"""Hyperliquid hourly funding history (public info API)."""
import json, urllib.request, time, pathlib, sys, pandas as pd
D = pathlib.Path(__file__).parent / "data" / "hl"; D.mkdir(parents=True, exist_ok=True)
COINS = sys.argv[1].split(",")
def post(body):
    for i in range(8):
        try:
            req = urllib.request.Request("https://api.hyperliquid.xyz/info", json.dumps(body).encode(), {"Content-Type": "application/json"})
            return json.loads(urllib.request.urlopen(req, timeout=60).read())
        except Exception as e:
            time.sleep(5 * (i + 1))
    raise RuntimeError("fail")
for c in COINS:
    out = D / f"{c}.csv"
    if out.exists(): continue
    rows, t = [], 1683000000000
    while True:
        r = post({"type": "fundingHistory", "coin": c, "startTime": t})
        if not r: break
        rows += [(x["time"], float(x["fundingRate"])) for x in r]
        nt = r[-1]["time"] + 1
        if len(r) < 500 or nt <= t: break
        t = nt
        time.sleep(1.0)
    pd.DataFrame(rows, columns=["ts", "rate"]).drop_duplicates("ts").to_csv(out, index=False)
    print(c, len(rows), flush=True)
