"""Unlock events from DefiLlama emission datasets. Event = calendar day (UTC) with cliff unlocks (category !=
noncirculating) for a token with a Binance USDT-M perp. pct = cliff tokens / total unlocked supply the day before
(all sections, incl. 'noncirculating' -> conservative denominator)."""
import json, pathlib, pandas as pd, numpy as np
H = pathlib.Path(__file__).parent
rows = []
for slug, sym in json.load(open(H / "raw/emis_map.json")):
    p = H / "raw/emis" / f"{slug}.json"
    if not p.exists(): continue
    d = json.load(open(p))
    if sym in ("BTC", "ETH", "BNB", "DOGE", "LTC", "TRX"): continue
    secs = d["documentedData"]["data"]
    tot = None
    for s in secs:
        x = pd.Series({pd.to_datetime(r["timestamp"], unit="s").normalize(): r["unlocked"] for r in s["data"]})
        x = x[~x.index.duplicated()]
        tot = x if tot is None else tot.add(x, fill_value=0)
    tot = tot.sort_index()
    nonc = set(d.get("categories", {}).get("noncirculating", []))
    ev = {}
    for e in d["metadata"].get("events", []):
        if e["unlockType"] != "cliff" or e.get("category") == "noncirculating": continue
        if any(n.lower() in e["description"].lower() for n in nonc): continue
        ts = pd.to_datetime(float(e["timestamp"]), unit="s")
        n = sum(map(float, e["noOfTokens"]))
        k = ts.normalize()
        a = ev.setdefault(k, [ts, 0.0, set()]); a[1] += n; a[2].add(e.get("category"))
    for k, (ts, n, cats) in ev.items():
        prev = tot[tot.index < k]
        if len(prev) == 0 or prev.iloc[-1] <= 0: continue
        rows.append(dict(sym=sym + "USDT", slug=slug, ts=ts, day=k, tokens=n, circ=prev.iloc[-1], pct=n / prev.iloc[-1],
                         cats=",".join(sorted(map(str, cats)))))
E = pd.DataFrame(rows).sort_values("ts")
E = E[(E.day >= "2020-01-01") & (E.day <= "2026-10-16")]
E.to_csv(H / "unlock_events.csv", index=False)
print(len(E), (E.pct >= .02).sum(), E[E.pct >= .02].groupby(E.day.dt.year).size().to_dict())
print(E[E.pct >= .02].tail(20).to_string())
