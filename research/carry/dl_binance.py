"""Download Binance USDT-M funding history + perp 1d klines + spot 1d klines from data.binance.vision."""
import urllib.request, re, io, zipfile, pathlib, sys, concurrent.futures as cf, pandas as pd
D = pathlib.Path(__file__).parent / "data"
S3 = "https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?prefix={}&delimiter=/"
BASE = "https://data.binance.vision/"

def get(url, tries=4):
    for i in range(tries):
        try:
            return urllib.request.urlopen(url, timeout=60).read()
        except Exception as e:
            err = e
    raise err

def listing(prefix, key="Key"):
    out, marker = [], ""
    while True:
        x = get(S3.format(prefix) + (f"&marker={marker}" if marker else "")).decode()
        items = re.findall(f"<{key}>([^<]*)</{key}>", x)
        if key == "Prefix":
            items = [i for i in items if i != prefix]
        out += items
        if "<IsTruncated>true" in x and items:
            marker = items[-1]
        else:
            return out

def read_zip(url):
    z = zipfile.ZipFile(io.BytesIO(get(url)))
    raw = z.read(z.namelist()[0]).decode()
    return raw

def fetch_symbol(kind, sym):
    out = D / kind / f"{sym}.csv"
    if out.exists():
        return
    if kind == "funding":
        pre = f"data/futures/um/monthly/fundingRate/{sym}/"
    elif kind == "perp":
        pre = f"data/futures/um/monthly/klines/{sym}/1d/"
    else:
        pre = f"data/spot/monthly/klines/{sym}/1d/"
    keys = [k for k in listing(pre) if k.endswith(".zip")]
    rows = []
    for k in keys:
        raw = read_zip(BASE + k)
        for line in raw.strip().splitlines():
            p = line.split(",")
            if not p[0][:1].isdigit():
                continue
            rows.append(p)
    if not rows:
        return
    out.parent.mkdir(parents=True, exist_ok=True)
    if kind == "funding":
        df = pd.DataFrame([(int(r[0]), float(r[2])) for r in rows], columns=["ts", "rate"]).drop_duplicates("ts").sort_values("ts")
    else:
        df = pd.DataFrame([(int(r[0]), float(r[1]), float(r[2]), float(r[3]), float(r[4]), float(r[7])) for r in rows],
                          columns=["ts", "open", "high", "low", "close", "qvol"])
        df["ts"] = df.ts.where(df.ts < 1e14, df.ts // 1000)  # spot 2025+ uses microseconds
        df = df.drop_duplicates("ts").sort_values("ts")
    df.to_csv(out, index=False)

if __name__ == "__main__":
    kind = sys.argv[1]
    syms_file = D / "um_symbols.txt"
    if not syms_file.exists():
        p = listing("data/futures/um/monthly/fundingRate/", key="Prefix")
        syms = sorted(x.rstrip("/").split("/")[-1] for x in p)
        syms_file.write_text("\n".join(syms))
    syms = [s for s in syms_file.read_text().split() if s.endswith("USDT")]
    if len(sys.argv) > 2:
        syms = [s for s in syms if s in set(pd.read_csv(sys.argv[2]).iloc[:, 0])] if sys.argv[2].endswith(".csv") else syms
    with cf.ThreadPoolExecutor(24) as ex:
        futs = {ex.submit(fetch_symbol, kind, s): s for s in syms}
        for i, f in enumerate(cf.as_completed(futs)):
            try:
                f.result()
            except Exception as e:
                print("ERR", futs[f], e, flush=True)
            if i % 50 == 0:
                print(kind, i, len(syms), flush=True)
