"""Trade generators. Each trade -> dict(sym, side, d0 (entry day Timestamp), path: pd.Series indexed by day with
cumulative P&L per 1 unit of entry notional at that day's close (incl. 0.2%/side fee+slip, real funding),
last index = exit day). Shorts: side=-1. Stop on daily (or hourly) high/low; fill at max(open, stop) for shorts."""
import pandas as pd, numpy as np, pathlib
H = pathlib.Path(__file__).parent
P = pd.read_pickle(H.parent / "fresh/nl_panels.pkl")
C, O, Hh, Lw, F, V = P["close"], P["open"], P["high"], P["low"], P["fund"].fillna(0), P["qvol"].fillna(0)
IDX = C.index; POS = {d: i for i, d in enumerate(IDX)}
FEE = 0.002
LV = C.apply(lambda s: s.last_valid_index())

def _vol(sym, i):
    return float(np.nanmean(V[sym].values[max(0, i - 7):i])) if i > 0 else 0.0

def daily_trade(sym, side, a, b, stop=None):
    """enter at close of day index a, exit at close of day index b."""
    c, o, h, l, f = (x[sym].values for x in (C, O, Hh, Lw, F))
    p0 = c[a]
    if np.isnan(p0): return None
    cum = -FEE; out = {IDX[a]: cum}; prev = p0
    lasti = POS[LV[sym]]
    for t in range(a + 1, b + 1):
        if t > lasti or np.isnan(c[t]):   # delisted / no data: exit at last price
            out[IDX[t - 1]] = cum - FEE * prev / p0; break
        if stop is not None:
            ext = h[t] if side < 0 else l[t]
            lvl = p0 * (1 - side * stop)
            if not np.isnan(ext) and ((side < 0 and ext >= lvl) or (side > 0 and ext <= lvl)):
                px = max(o[t], lvl) if side < 0 else min(o[t], lvl)
                cum += side * (px - prev) / p0 - side * f[t] * prev / p0 - FEE * px / p0
                out[IDX[t]] = cum; break
        cum += side * (c[t] - prev) / p0 - side * f[t] * prev / p0
        prev = c[t]
        if t == b: cum -= FEE * c[t] / p0
        out[IDX[t]] = cum
    return dict(sym=sym, side=side, d0=IDX[a], path=pd.Series(out), vol=_vol(sym, a))

_K = {}
def k1h(sym):
    if sym not in _K:
        k = pd.read_csv(H / f"raw/k1h/{sym}.csv"); k["ts"] = k.ts.where(k.ts < 1e14, k.ts // 1000)
        k.index = pd.to_datetime(k.ts, unit="ms"); _K[sym] = k[~k.index.duplicated()]
    return _K[sym]

def hourly_trade(sym, side, ts, hold_h, stop=None):
    """enter at open of first 1h bar starting at/after ts, exit at close of bar hold_h-1 hours later."""
    try: k = k1h(sym)
    except FileNotFoundError: return None
    t0 = ts.ceil("h")
    if t0 not in k.index: return None
    seg = k.loc[t0: t0 + pd.Timedelta(hours=hold_h - 1)]
    p0 = seg.open.iloc[0]; f = F[sym]
    lvl = p0 * (1 - side * stop) if stop is not None else None
    cum = -FEE; out = {}; prev = p0; day = t0.normalize()
    # entry-day funding fraction
    for t, r in seg.iterrows():
        d = t.normalize()
        if d != day:   # day rollover: mark previous day, add funding of new day (full day approx)
            out[day] = cum; day = d
        if t.hour == 0 or t == t0:
            frac = 1.0 if t.hour == 0 else (24 - t.hour) / 24
            cum -= side * f.get(d, 0.0) * frac * prev / p0
        if lvl is not None and ((side < 0 and r.high >= lvl) or (side > 0 and r.low <= lvl)):
            px = max(r.open, lvl) if side < 0 else min(r.open, lvl)
            cum += side * (px - prev) / p0 - FEE * px / p0; out[d] = cum
            return dict(sym=sym, side=side, d0=t0.normalize(), path=pd.Series(out), vol=_vol(sym, POS[t0.normalize()]))
        cum += side * (r.close - prev) / p0; prev = r.close
    cum -= FEE * prev / p0; out[day] = cum
    return dict(sym=sym, side=side, d0=t0.normalize(), path=pd.Series(out), vol=_vol(sym, POS[t0.normalize()]))

UE = pd.read_csv(H / "unlock_events.csv", parse_dates=["ts", "day"])
_fv = C.apply(lambda s: s.first_valid_index())
UE = UE[[s in C.columns and pd.notna(_fv[s]) and _fv[s] <= d - pd.Timedelta(days=30) for s, d in zip(UE.sym, UE.day)]]
UE = UE.sort_values("pct", ascending=False).drop_duplicates(["sym", "day"]).sort_values("day")

def unlock_trades(thr=0.05, N=7, M=0, stop=None, side=-1):
    out = []
    for _, e in UE[UE.pct >= thr].iterrows():
        i = POS.get(e.day)
        if i is None or i - N < 0 or i + M >= len(IDX) or i + M <= i - N: continue
        tr = daily_trade(e.sym, side, i - N, i + M, stop)
        if tr: tr["tag"] = "UNL"; out.append(tr)
    return out

CE = pd.read_csv(H / "cms_events.csv", parse_dates=["ts"])
def cms_trades(typ, side=-1, hold_h=72, stop=None):
    out = []
    for _, e in CE[CE.type == typ].iterrows():
        tr = hourly_trade(e.sym, side, e.ts, hold_h, stop)
        if tr: tr["tag"] = typ; out.append(tr)
    return out
