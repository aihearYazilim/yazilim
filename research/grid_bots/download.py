"""Binance spot 1m klines (data.binance.vision archives) + USDT-M funding -> raw/*.npz
Months 2021-01..2026-09 monthly zips, 2026-10-01..16 daily zips."""
import io, zipfile, pathlib, urllib.request, time, sys
import numpy as np, pandas as pd
from concurrent.futures import ThreadPoolExecutor
RAW = pathlib.Path(__file__).resolve().parent / "raw"
MAJ = ["BTC","ETH","SOL","BNB","XRP","DOGE"]
ALTS = ["ADA","AVAX","LINK","LTC","DOT","TRX","BCH","ATOM","ETC","XLM","NEAR","UNI","FIL",
        "AAVE","ALGO","HBAR","ICP","INJ","VET","SHIB"]
B = "https://data.binance.vision/data"
def get(url):
    for i in range(5):
        try:
            with urllib.request.urlopen(url, timeout=60) as r: return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            time.sleep(2*(i+1))
        except Exception:
            time.sleep(2*(i+1))
    return None
def parse(z):
    with zipfile.ZipFile(io.BytesIO(z)) as zf:
        a = np.loadtxt(zf.open(zf.namelist()[0]), delimiter=",", usecols=(0,1,2,3,4,7), ndmin=2,
                       converters=None, comments=None, skiprows=0, dtype=np.float64) if True else None
    return a
def parse_safe(z):
    with zipfile.ZipFile(io.BytesIO(z)) as zf:
        df = pd.read_csv(zf.open(zf.namelist()[0]), header=None, usecols=[0,1,2,3,4,7])
    if not np.issubdtype(df[0].dtype, np.number):  # header row present
        df = df[pd.to_numeric(df[0], errors="coerce").notna()].astype(float)
    t = df[0].values.astype(np.int64)
    t = np.where(t > 10**14, t // 1000, t)
    return np.column_stack([t // 60000, df[1].values, df[2].values, df[3].values, df[4].values, df[7].values]).astype(np.float64)
def months():
    return [f"{y}-{m:02d}" for y in range(2021, 2027) for m in range(1, 13) if f"{y}-{m:02d}" <= "2026-09"]
def klines(sym):
    out = RAW / f"{sym}_1m.npz"
    if out.exists(): return sym, "exists"
    urls = [f"{B}/spot/monthly/klines/{sym}USDT/1m/{sym}USDT-1m-{m}.zip" for m in months()]
    urls += [f"{B}/spot/daily/klines/{sym}USDT/1m/{sym}USDT-1m-2026-10-{d:02d}.zip" for d in range(1, 17)]
    parts = []
    for u in urls:
        z = get(u)
        if z: parts.append(parse_safe(z))
    a = np.concatenate(parts); a = a[np.argsort(a[:, 0], kind="stable")]
    _, ix = np.unique(a[:, 0], return_index=True); a = a[ix]
    np.savez_compressed(out, t=a[:, 0].astype(np.int64), o=a[:, 1], h=a[:, 2], l=a[:, 3], c=a[:, 4], qv=a[:, 5].astype(np.float32))
    return sym, len(a)
def funding(sym):
    out = RAW / f"{sym}_funding.csv"
    if out.exists(): return sym, "exists"
    rows = []
    for m in months():
        z = get(f"{B}/futures/um/monthly/fundingRate/{sym}USDT/{sym}USDT-fundingRate-{m}.zip")
        if not z: continue
        with zipfile.ZipFile(io.BytesIO(z)) as zf:
            df = pd.read_csv(zf.open(zf.namelist()[0]))
        rows.append(df)
    if not rows: return sym, 0
    df = pd.concat(rows)
    df.to_csv(out, index=False); return sym, len(df)
if __name__ == "__main__":
    syms = MAJ + ALTS
    with ThreadPoolExecutor(8) as ex:
        for r in ex.map(funding, syms): print("fund", r, flush=True)
        for r in ex.map(klines, syms): print("1m", r, flush=True)
