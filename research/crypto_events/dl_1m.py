"""1m perp klines for the announcement day and the next day of each CMS event (data.binance.vision daily zips;
monthly fallback). raw/k1m/{SYM}_{YYYY-MM-DD}.csv"""
import io, zipfile, urllib.request, pathlib, concurrent.futures as cf, pandas as pd
H = pathlib.Path(__file__).parent; R = H / "raw/k1m"; R.mkdir(parents=True, exist_ok=True)
E = pd.read_csv(H / "cms_events.csv", parse_dates=["ts"])
jobs = sorted({(s, (ts.normalize() + pd.Timedelta(days=k)).strftime("%Y-%m-%d")) for s, ts in zip(E.sym, E.ts) for k in (0, 1)
               if ts.normalize() + pd.Timedelta(days=k) <= pd.Timestamp("2026-10-17")})
def get(u):
    try:
        z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(u, timeout=60).read())); return z.read(z.namelist()[0]).decode()
    except Exception: return None
def one(j):
    s, d = j; out = R / f"{s}_{d}.csv"
    if out.exists(): return
    raw = get(f"https://data.binance.vision/data/futures/um/daily/klines/{s}/1m/{s}-1m-{d}.zip")
    if raw is None:
        m = get(f"https://data.binance.vision/data/futures/um/monthly/klines/{s}/1m/{s}-1m-{d[:7]}.zip")
        if m is None: print("MISS", s, d); return
        lines = [l for l in m.strip().splitlines() if l[:1].isdigit()]
        t0 = pd.Timestamp(d).value // 10**6; t1 = t0 + 86400000
        def tsv(l):
            v = int(l.split(",")[0]); return v // 1000 if v > 1e14 else v
        raw = "\n".join(l for l in lines if t0 <= tsv(l) < t1)
    rows = [l.split(",")[:6] for l in raw.strip().splitlines() if l[:1].isdigit()]
    pd.DataFrame(rows, columns=["ts", "open", "high", "low", "close", "vol"]).to_csv(out, index=False)
with cf.ThreadPoolExecutor(16) as ex: list(ex.map(one, jobs))
print(len(jobs))
