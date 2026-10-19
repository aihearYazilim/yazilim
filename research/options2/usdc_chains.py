"""SOL/XRP/AVAX (USDC-linear) Deribit options: per day smiles from trades in the 24h BEFORE 09:00 UTC
(no look-ahead), each row's mark IV vs its own index (F = index, linear Black-76, b=0).
Also measures effective taker-sell half-spread for 20-40 delta weeklies.  Output raw/usdc_smiles.pkl."""
import json, gzip, pathlib, datetime as dt, numpy as np, pandas as pd, pickle
from fbs import iv as fiv, delta as fdelta
D = pathlib.Path(__file__).parent
MON = {m: i + 1 for i, m in enumerate("JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split())}
X = []
for f in sorted((D / "raw/usdc").glob("*.json.gz")):
    x = pd.DataFrame(json.load(gzip.open(f, "rt")), columns=["ts", "inst", "price", "mark", "iv", "idx", "amt", "dirn"])
    X.append(x)
X = pd.concat(X, ignore_index=True)
p = X.inst.str.split("-", expand=True)
X["u"] = p[0].str.replace("_USDC", ""); X = X[X.u.isin(["SOL", "XRP", "AVAX"])].copy(); p = p.loc[X.index]
X["ex"] = [dt.datetime(2000 + int(s[-2:]), MON[s[-5:-2]], int(s[:-5]), 8) for s in p[1]]
X["K"] = p[2].str.replace("d", ".").astype(float); X["isc"] = p[3] == "C"
X["t"] = pd.to_datetime(X.ts, unit="ms"); X["T"] = (X.ex - X.t).dt.total_seconds() / 31536000
X = X[X["T"] > 0.5 / 365]
X["miv"] = fiv(X.mark.values, X.idx.values, X.K.values, X["T"].values, X.isc.values)
X = X[np.isfinite(X.miv) & (X.miv > 0.05) & (X.miv < 5)]
X["x"] = np.log(X.K / X.idx)
X["dlt"] = np.abs(fdelta(X.idx.values, X.K.values, X["T"].values, X.miv.values, X.isc.values))
print(X.groupby("u").agg(n=("ts", "size"), first=("t", "min"), last=("t", "max")))
# spreads
w = X[(X["T"] * 365 > 5) & (X["T"] * 365 < 8) & (X.dlt > 0.2) & (X.dlt < 0.4) & (X.dirn == "sell")]
print("taker sell 20-40d weekly (price-mark)/mark:\n", w.assign(rel=(w.price - w.mark) / w.mark).groupby("u").rel.describe().round(4))
w = X[(X["T"] * 365 > 5) & (X["T"] * 365 < 8) & (X.dlt > 0.03) & (X.dlt < 0.12) & (X.dirn == "buy")]
print("taker buy 3-12d weekly:\n", w.assign(rel=(w.price - w.mark) / w.mark).groupby("u").rel.describe().round(4))
SM, EXP = {}, {}
X["d0"] = X.t.dt.floor("D")
days = pd.date_range("2024-04-01", "2026-10-16", freq="D")
for u, g in X.groupby("u"):
    g = g.sort_values("t")
    for d in days:
        t0 = d + pd.Timedelta(hours=9)
        win = g[(g.t >= t0 - pd.Timedelta(hours=24)) & (g.t < t0)]
        if len(win) == 0: continue
        last = win.groupby("inst").last()
        for ex, h in last.groupby("ex"):
            o = h[((~h.isc) & (h.x <= 0.02)) | (h.isc & (h.x >= -0.02))]
            if len(o) < 3: continue
            s = o.groupby("x").miv.median().sort_index()
            T = (ex - t0).total_seconds() / 31536000
            key = (u, d.strftime("%Y-%m-%d"), pd.Timestamp(ex))
            SM[key] = (s.index.values, s.values, 0.0, T)
            EXP.setdefault(key[:2], []).append(key[2])
for k in EXP: EXP[k].sort()
pickle.dump((SM, EXP), open(D / "raw/usdc_smiles.pkl", "wb"))
cnt = pd.Series([k[0] for k in SM]).value_counts(); print(cnt)
