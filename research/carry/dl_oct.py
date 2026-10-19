"""Fill 2026-10 (monthly archives end 2026-09): Binance daily perp/spot 1d klines and 1h premium-index klines
(used to reconstruct funding = avgPremium + clamp(0.01% - avgPremium, +-0.05%) per 8h).
Premium also downloaded for 2026-09-15..30 to validate the reconstruction against real funding."""
import pathlib, sys, io, zipfile, urllib.request, concurrent.futures as cf, datetime as dt, pandas as pd
D = pathlib.Path(__file__).parent / "data"
B = "https://data.binance.vision/data/"
def get(u):
    try:
        z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(u, timeout=60).read()))
        return z.read(z.namelist()[0]).decode()
    except Exception:
        return None
def rows(raw):
    return [l.split(",") for l in raw.strip().splitlines() if l[:1].isdigit()] if raw else []
days_oct = [(dt.date(2026, 10, 1) + dt.timedelta(i)).isoformat() for i in range(17)]
days_prem = [(dt.date(2026, 9, 15) + dt.timedelta(i)).isoformat() for i in range(33)]
def one(sym):
    out = {}
    for kind, path, days in [("perp", f"futures/um/daily/klines/{sym}/1d/{sym}-1d-", days_oct),
                             ("spot", f"spot/daily/klines/{sym}/1d/{sym}-1d-", days_oct),
                             ("prem", f"futures/um/daily/premiumIndexKlines/{sym}/1h/{sym}-1h-", days_prem)]:
        r = []
        for d in days:
            r += rows(get(B + path + d + ".zip"))
            if kind == "spot" and not r:
                break  # no spot market
        out[kind] = r
    return sym, out
if __name__ == "__main__":
    syms = pathlib.Path(sys.argv[1]).read_text().split()
    res = {}
    with cf.ThreadPoolExecutor(32) as ex:
        for i, (s, o) in enumerate(ex.map(one, syms)):
            res[s] = o
            if i % 25 == 0: print(i, flush=True)
    pd.to_pickle(res, D / "oct_raw.pkl")
