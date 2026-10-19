"""Merge 2026-10 daily data. Funding for Oct is reconstructed from Binance 1h premium-index klines:
per interval (8h or 4h, inferred from Sept real funding timestamps): P = linearly time-weighted mean of hourly premium (OHLC/4),
F = (P + clamp(0.01% - P, -0.05%, +0.05%)) * interval/8h, F capped at max(0.3%, max |Sept real rate|).
Validated against real Sept 15-30 funding."""
import pathlib, numpy as np, pandas as pd
D = pathlib.Path(__file__).parent / "data"
raw = pd.read_pickle(D / "oct_raw.pkl")
DAY = 86400000

def recon(rows, hours, cap=0.02):
    if not rows: return None
    df = pd.DataFrame([(int(r[0]), (float(r[1]) + float(r[2]) + float(r[3]) + float(r[4])) / 4) for r in rows], columns=["ts", "prem"]).drop_duplicates("ts").sort_values("ts")
    df["end"] = df.ts + 3600000
    iv = hours * 3600000
    df["slot"] = (df.end - 1) // iv * iv + iv   # settlement time
    def f(g):
        w = np.arange(1, len(g) + 1)
        P = (g.prem.values * w).sum() / w.sum()
        return float(np.clip((P + np.clip(0.0001 - P, -0.0005, 0.0005)) * hours / 8, -cap, cap))
    s = df.groupby("slot").apply(f, include_groups=False)
    day = (s.index - 1) // DAY * DAY
    out = s.groupby(day).sum(); out.index = pd.to_datetime(out.index, unit="ms")
    return out

def kl(rows):
    if not rows: return None
    k = pd.DataFrame([(int(r[0]), float(r[4]), float(r[7])) for r in rows], columns=["ts", "close", "qvol"])
    k["ts"] = k.ts.where(k.ts < 1e14, k.ts // 1000)
    k.index = pd.to_datetime(k.ts, unit="ms").dt.normalize()
    return k[~k.index.duplicated()]

F, Fv, P, PV, S, SV, err = {}, {}, {}, {}, {}, {}, []
for sym, o in raw.items():
    fr = D / "funding" / f"{sym}.csv"
    hours, cap = 8, 0.02
    real = None
    if fr.exists():
        r = pd.read_csv(fr); r = r[r.ts >= 1789430400000]  # >= 2026-09-15
        if len(r) > 3:
            hours = int(round(np.median(np.diff(r.ts)) / 3600000)) or 8
            cap = max(0.003 * hours / 8, r.rate.abs().max())  # cap from Sept observed range (past data)
        day = (r.ts - 1) // DAY * DAY
        real = r.groupby(day).rate.sum(); real.index = pd.to_datetime(real.index, unit="ms")
    rc = recon(o["prem"], hours, cap)
    if rc is not None:
        F[sym] = rc.loc["2026-10-01":]
        if real is not None:
            j = pd.concat([real, rc], axis=1, keys=["real", "rec"]).loc["2026-09-16":"2026-09-29"].dropna()
            if len(j) > 5: err.append((sym, j.real.mean(), j.rec.mean(), j.real.corr(j.rec)))
    k = kl(o["perp"]);  k is not None and (P.__setitem__(sym, k.close), PV.__setitem__(sym, k.qvol))
    k = kl(o["spot"]);  k is not None and (S.__setitem__(sym, k.close), SV.__setitem__(sym, k.qvol))
e = pd.DataFrame(err, columns=["sym", "real", "rec", "corr"])
print("validation Sept16-29 (daily funding sums), n=%d: median corr %.3f, mean real %.2e rec %.2e, MAE %.2e"
      % (len(e), e["corr"].median(), e.real.mean(), e.rec.mean(), (e.real - e.rec).abs().mean()))
idx = pd.date_range("2026-10-01", "2026-10-17")
res = dict(fund=pd.DataFrame(F), perp=pd.DataFrame(P), perpvol=pd.DataFrame(PV), spot=pd.DataFrame(S), spotvol=pd.DataFrame(SV))
res = {k: v.reindex(idx) for k, v in res.items()}
# last day (Oct 17) funding only partially settled; keep days fully settled: fund day d needs settlement at d+1 00:00
res["fund"].loc["2026-10-17"] = np.nan
pd.to_pickle(res, D / "panels_oct.pkl")
print({k: v.notna().sum(1).iloc[[0, -2, -1]].tolist() for k, v in res.items()})
