"""Binance USDT-M perp klines for venue events: 1h for [event-3d, event+35d] (monthly zips, daily fallback) and
1m for event day and next day. Same sources as crypto_events/dl_1h.py, dl_1m.py. raw/k1h/{SYM}.csv, raw/k1m/{SYM}_{day}.csv"""
import io, zipfile, urllib.request, pathlib, concurrent.futures as cf, pandas as pd, sys
H = pathlib.Path(__file__).parent; R1 = H / "raw/k1h"; RM = H / "raw/k1m"; R1.mkdir(parents=True, exist_ok=True); RM.mkdir(parents=True, exist_ok=True)
B = "https://data.binance.vision/data/futures/um/{}/klines/{}/1h/{}-1h-{}.zip"
E = pd.read_csv(H / (sys.argv[1] if len(sys.argv) > 1 else "venue_events.csv"), parse_dates=["ts"])
need = {}
for s, ts in zip(E.sym, E.ts):
    for d in pd.date_range(ts.normalize() - pd.Timedelta(days=3), ts + pd.Timedelta(days=35), freq="D"):
        if d > pd.Timestamp("2026-10-17"): break
        need.setdefault(s, set()).add(d)
need.setdefault("BTCUSDT", set()).update(d for v in need.values() for d in v)
def get(u):
    try:
        z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(u, timeout=60).read())); return z.read(z.namelist()[0]).decode()
    except Exception: return None
def one(s):
    out = R1 / f"{s}.csv"; have = set()
    old = None
    if out.exists():
        old = pd.read_csv(out); have = set(pd.to_datetime(old.ts.where(old.ts < 1e14, old.ts // 1000), unit="ms").dt.strftime("%Y-%m"))
    rows = []
    for m in sorted({d.strftime("%Y-%m") for d in need[s]} - have):
        raw = get(B.format("monthly", s, s, m))
        if raw is None:
            for d in sorted(x for x in need[s] if x.strftime("%Y-%m") == m):
                r2 = get(B.format("daily", s, s, d.strftime("%Y-%m-%d")))
                if r2: rows += [l.split(",") for l in r2.strip().splitlines() if l[:1].isdigit()]
        else: rows += [l.split(",") for l in raw.strip().splitlines() if l[:1].isdigit()]
    if not rows: return s, 0
    df = pd.DataFrame([(int(r[0]), *map(float, r[1:6]), float(r[7])) for r in rows], columns=["ts", "open", "high", "low", "close", "vol", "qvol"])
    if old is not None: df = pd.concat([old, df])
    df.drop_duplicates("ts").sort_values("ts").to_csv(out, index=False); return s, len(df)
with cf.ThreadPoolExecutor(16) as ex: list(ex.map(one, list(need)))
jobs = sorted({(s, (ts.normalize() + pd.Timedelta(days=k)).strftime("%Y-%m-%d")) for s, ts in zip(E.sym, E.ts) for k in (0, 1)
               if ts.normalize() + pd.Timedelta(days=k) <= pd.Timestamp("2026-10-16")})
def onem(j):
    s, d = j; out = RM / f"{s}_{d}.csv"
    if out.exists(): return
    raw = get(f"https://data.binance.vision/data/futures/um/daily/klines/{s}/1m/{s}-1m-{d}.zip")
    if raw is None:
        m = get(f"https://data.binance.vision/data/futures/um/monthly/klines/{s}/1m/{s}-1m-{d[:7]}.zip")
        if m is None: return
        t0 = pd.Timestamp(d).value // 10**6; t1 = t0 + 86400000
        tsv = lambda l: (lambda v: v // 1000 if v > 1e14 else v)(int(l.split(",")[0]))
        raw = "\n".join(l for l in m.strip().splitlines() if l[:1].isdigit() and t0 <= tsv(l) < t1)
    rows = [l.split(",")[:6] for l in raw.strip().splitlines() if l[:1].isdigit()]
    pd.DataFrame(rows, columns=["ts", "open", "high", "low", "close", "vol"]).to_csv(out, index=False)
with cf.ThreadPoolExecutor(16) as ex: list(ex.map(onem, jobs))
print("syms", len(need), "1m jobs", len(jobs), "1h files", len(list(R1.glob("*.csv"))), "1m files", len(list(RM.glob("*.csv"))))
