"""Build OHLC+volume panels for all Binance USDT-M perps (incl. delisted) from research/carry data,
plus Oct-2026 daily rows (oct_raw.pkl). Funding from carry panels (Oct reconstructed there)."""
import pathlib, pandas as pd, numpy as np, sys
C = pathlib.Path(__file__).resolve().parents[1] / "carry"
sys.path.insert(0, str(C))
import lib
OUT = pathlib.Path(__file__).parent / "nl_panels.pkl"
raw = pd.read_pickle(C / "data" / "oct_raw.pkl")
F = {f: {} for f in ["open", "high", "low", "close", "qvol"]}
for p in (C / "data" / "perp").glob("*.csv"):
    k = pd.read_csv(p)
    k["ts"] = k.ts.where(k.ts < 1e14, k.ts // 1000)
    k.index = pd.to_datetime(k.ts, unit="ms").dt.normalize()
    rows = raw.get(p.stem, {}).get("perp", [])
    if rows:
        o = pd.DataFrame([(int(r[0]), *map(float, r[1:5]), float(r[7])) for r in rows],
                         columns=["ts", "open", "high", "low", "close", "qvol"])
        o["ts"] = o.ts.where(o.ts < 1e14, o.ts // 1000)
        o.index = pd.to_datetime(o.ts, unit="ms").dt.normalize()
        k = pd.concat([k, o])
    k = k[~k.index.duplicated(keep="first")].sort_index()
    for f in F:
        F[f][p.stem] = k[f]
idx = pd.date_range("2019-09-01", "2026-10-17", freq="D")
P = {f: pd.DataFrame(v).reindex(idx) for f, v in F.items()}
P["fund"] = lib.P()["fund"].reindex(index=idx, columns=P["close"].columns).fillna(0.0)
pd.to_pickle(P, OUT)
print({k: v.shape for k, v in P.items()}, P["close"].last_valid_index())
