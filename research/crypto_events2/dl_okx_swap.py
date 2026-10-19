"""OKX USDT-SWAP 1h candles for the Binance-book events (MON/DEL/LIST CMS events + UNL unlock entries) whose token has a
live OKX swap (current instrument list -> delisted OKX swaps are missed). Window [entry-2d, entry+31d] (UNL: [entry-1d,
entry+15d]). Saved as raw/okx_k1h/{BINANCE_SYM}.csv in the same column format as Binance 1h files (qvol = USD vol est)."""
import json, time, pathlib, urllib.request, sys, pandas as pd, numpy as np
H = pathlib.Path(__file__).parent; R = H / "raw/okx_k1h"; R.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(H)); import common as C
sw = {x["instId"]: x for x in json.load(open(H / "raw/okx_swap_instruments.json"))["data"] if x["instId"].endswith("-USDT-SWAP")}
def okx_id(sym):
    b = sym[:-4]
    for c in (b, b[4:] if b.startswith("1000") else None, b[3:] if b.startswith("1M") else None):
        if c and f"{c}-USDT-SWAP" in sw: return f"{c}-USDT-SWAP"
    return None
def get(u):
    for i in range(6):
        try:
            x = json.loads(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=30).read())
            time.sleep(0.12)
            if x.get("code") == "0": return x["data"]
            if x.get("code") == "51001": return []
        except Exception: pass
        time.sleep(1 + 2 * i)
    return []
def candles(inst, t0, t1):
    out = []; after = int(t1.value // 10**6)
    while True:
        d = get(f"https://www.okx.com/api/v5/market/history-candles?instId={inst}&bar=1H&limit=100&after={after}")
        if not d: break
        out += d; after = int(d[-1][0])
        if after <= t0.value // 10**6: break
    return out
if __name__ == "__main__":
    CE = C.T.CE[C.T.CE.type.isin(["MON", "DEL", "LIST"])]
    W = [(s, ts - pd.Timedelta(days=2), ts + pd.Timedelta(days=31)) for s, ts in zip(CE.sym, CE.ts)]
    for t in C.T.unlock_trades(*C.UNL[1:]):
        W.append((t["sym"], t["d0"] - pd.Timedelta(days=1), t["d0"] + pd.Timedelta(days=15)))
    W += [(s, ts - pd.Timedelta(days=2), ts + pd.Timedelta(days=31)) for s, ts in [("BTCUSDT", pd.Timestamp("2026-10-15"), None)][:0]]
    cov = {}
    for s, a, b in W:
        cov.setdefault(s, []).append((a, min(b, pd.Timestamp("2026-10-17"))))
    have = {s: okx_id(s) for s in cov}
    print("symbols", len(cov), "with live OKX swap", sum(1 for v in have.values() if v))
    for s, inst in have.items():
        if not inst or (R / f"{s}.csv").exists(): continue
        rows = []
        for a, b in cov[s]: rows += candles(inst, a, b)
        if not rows: continue
        ct = float(sw[inst]["ctVal"])
        df = pd.DataFrame([(int(r[0]), float(r[1]), float(r[2]), float(r[3]), float(r[4]), float(r[6]), float(r[7])) for r in rows],
                          columns=["ts", "open", "high", "low", "close", "vol", "qvol"]).drop_duplicates("ts").sort_values("ts")
        df.to_csv(R / f"{s}.csv", index=False)
    print("files", len(list(R.glob("*.csv"))))
