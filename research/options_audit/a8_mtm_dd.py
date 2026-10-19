"""Intra-week mark-to-market drawdown (no liquidation), combined account, k=2 vol shock, hourly low/high."""
from common import R
import numpy as np, pandas as pd
from a5b_margin_xm import legs_of, liab, H
from variants import stats
OOS0 = "2025-10-17"
def worst(entries, size, k=2.0):
    if not entries: return 0.0
    P = [legs_of(e, size, 0.5) for e in entries]; cash = 1.0 + sum(p["N"]*p["prem"] for p in P)
    exp = pd.Timestamp(entries[0]["expiry"]) + pd.Timedelta(hours=8)
    paths = [H[p["e"]["cur"]].loc[pd.Timestamp(entries[0]["day"])+pd.Timedelta(hours=9): exp-pd.Timedelta(hours=1)] for p in P]
    idx = paths[0].index
    for x in paths[1:]: idx = idx.intersection(x.index)
    w = 0.0
    for ts in idx:
        tau = (exp - (ts + pd.Timedelta(hours=1))).total_seconds()/(365*86400)
        for c in ("low", "high"):
            w = min(w, cash - sum(liab(p, path.loc[ts, c], tau, k) for p, path in zip(P, paths)) - 1.0)
    return w
by = {}
for e in R.ENT["W"]:
    if np.isfinite(e["S"]): by.setdefault(e["day"], []).append(e)
s = pd.read_csv("xm_s2_k2.0_PM.csv", index_col=0)   # 2x, no liquidations occurred -> equals hold-to-expiry
for size in (2, 3):
    s = pd.read_csv(f"xm_s{size}_k2.0_PM.csv", index_col=0) if size == 2 else None
    rows = []
    for day, es in sorted(by.items()):
        act = [e for e in es if R.FEAT[(e["cur"], day)]["dvol"] > R.FEAT[(e["cur"], day)]["dvmed"]]
        rows.append((day, worst(act, size)))
    W = pd.Series(dict(rows))
    from variants import series_from
    U = pd.read_pickle("units.pkl")["orig: interp, 5% half-spread"]
    ser = series_from(U, size, True)
    for lo, hi, nm in (("2021-04-01", OOS0, "IS"), (OOS0, "2026-10-17", "OOS")):
        x = ser[(ser.index >= lo) & (ser.index < hi)]; w = W.reindex(x.index).fillna(0)
        eq_start = (1 + x.r).cumprod().shift(1).fillna(1.0)
        trough = eq_start * (1 + w); peak = np.maximum((1 + x.r).cumprod().cummax().shift(1).fillna(1.0), 1)
        print(f"size {size} {nm}: weekly-close maxDD {stats(x)['dd']:.3f} | intra-week MTM maxDD {(trough/peak - 1).min():.3f} | worst intra-week MTM {w.min():.3f}")
