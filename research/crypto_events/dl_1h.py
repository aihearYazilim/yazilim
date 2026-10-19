"""Download Binance USDT-M perp 1h klines (data.binance.vision monthly zips; daily zips for the latest month)
for every CMS event symbol, covering [event-3d, event+35d]. Saved raw/k1h/{SYM}.csv (ts ms open time)."""
import io, zipfile, urllib.request, pathlib, concurrent.futures as cf, pandas as pd
H = pathlib.Path(__file__).parent; R = H / "raw/k1h"; R.mkdir(parents=True, exist_ok=True)
B = "https://data.binance.vision/data/futures/um/{}/klines/{}/1h/{}-1h-{}.zip"
E = pd.read_csv(H / "cms_events.csv", parse_dates=["ts"])
need = {}
for s, ts in zip(E.sym, E.ts):
    for d in pd.date_range(ts - pd.Timedelta(days=3), ts + pd.Timedelta(days=35), freq="D"):
        if d > pd.Timestamp("2026-10-17"): break
        need.setdefault(s, set()).add(d)
def get(u):
    try:
        z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(u, timeout=60).read()))
        return z.read(z.namelist()[0]).decode()
    except Exception:
        return None
def one(s):
    out = R / f"{s}.csv"
    if out.exists(): return s, "skip"
    rows = []
    months = sorted({d.strftime("%Y-%m") for d in need[s]})
    for m in months:
        raw = get(B.format("monthly", s, s, m))
        if raw is None:   # current month / missing -> daily files
            for d in sorted(x for x in need[s] if x.strftime("%Y-%m") == m):
                r2 = get(B.format("daily", s, s, d.strftime("%Y-%m-%d")))
                if r2: rows += [l.split(",") for l in r2.strip().splitlines() if l[:1].isdigit()]
        else:
            rows += [l.split(",") for l in raw.strip().splitlines() if l[:1].isdigit()]
    if not rows: return s, "none"
    df = pd.DataFrame([(int(r[0]), *map(float, r[1:6]), float(r[7])) for r in rows],
                      columns=["ts", "open", "high", "low", "close", "vol", "qvol"]).drop_duplicates("ts").sort_values("ts")
    df.to_csv(out, index=False); return s, len(df)
with cf.ThreadPoolExecutor(16) as ex:
    for s, n in ex.map(one, list(need)):
        if n in ("none",): print("NONE", s)
print("done", len(need))
