"""Pay geri alım olayları: ticker için >=90 gün sessizlikten sonra ilk 'payların geri alınması' bildirimi."""
import json, glob, pathlib, pandas as pd
H = pathlib.Path(__file__).parent
rows = []
for f in sorted(glob.glob(str(H/"raw"/"kap"/"buyback_*.json"))): rows += json.load(open(f))
k = pd.DataFrame(rows); k = k[k.stockCodes.notna()]
k["ts"] = pd.to_datetime(k.publishDate, format="%d.%m.%Y %H:%M:%S")
k["ticker"] = k.stockCodes.str.split(",").str[0].str.strip()
k = k.sort_values("ts"); ev = []
for t, g in k.groupby("ticker"):
    last = None
    for ts in g.ts:
        if last is None or (ts - last).days >= 90: ev.append((t, ts))
        last = ts
B = pd.DataFrame(ev, columns=["ticker", "start"]); B = B[B.start >= "2019-06-01"]
B.to_csv(H/"buyback_events.csv", index=False); print(len(B)); print(B.groupby(B.start.dt.to_period("Q")).size().to_string())
