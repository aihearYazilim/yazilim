"""Audit: CMS trades re-simulated with 1m data for the first ~1-2 days (entry at announcement + L minutes,
stop checks on 1m bars, slippage on entry and stops), hourly afterwards. Returns trades compatible with port.sim."""
import sys, pathlib, pandas as pd, numpy as np
H = pathlib.Path("/home/user/yazilim/research/crypto_events"); sys.path.insert(0, str(H))
import trades as T
_M = {}
def k1m(sym, ts):
    key = (sym, ts.normalize())
    if key not in _M:
        fs = [H / f"raw/k1m/{sym}_{(ts.normalize()+pd.Timedelta(days=i)).strftime('%Y-%m-%d')}.csv" for i in (0, 1)]
        ds = [pd.read_csv(f) for f in fs if f.exists() and f.stat().st_size > 40]
        if not ds: _M[key] = None
        else:
            x = pd.concat(ds); x["ts"] = x.ts.where(x.ts < 1e14, x.ts // 1000)
            x.index = pd.to_datetime(x.ts, unit="ms"); _M[key] = x[~x.index.duplicated()].sort_index()[["open", "high", "low", "close"]]
    return _M[key]

def trade(sym, ts, hold_h, stop, lag_min=None, slip_in=0.0, slip_stop=0.0, side=-1, fee=None, path1m=True):
    """lag_min=None -> original entry (open of first full hour bar >= ts). Otherwise open of minute floor(ts)+lag+1."""
    FEE = T.FEE if fee is None else fee
    try: kh = T.k1h(sym)
    except FileNotFoundError: return None
    km = k1m(sym, ts) if path1m else None
    t_in = ts.ceil("h") if lag_min is None else ts.floor("min") + pd.Timedelta(minutes=lag_min + 1)
    t_end = (ts.ceil("h") if lag_min is None else t_in) + pd.Timedelta(hours=hold_h)   # exclusive
    bars = []
    if km is not None and len(km):
        m = km[(km.index >= t_in) & (km.index < t_end)]
        if len(m): bars.append(m.assign(dur=1))
        cut = (km.index[-1] + pd.Timedelta(minutes=1)).ceil("h")
    else:
        if lag_min is not None and t_in != t_in.ceil("h"): return None   # need 1m data for intra-hour entry
        cut = t_in
    h = kh[(kh.index >= max(cut, t_in.ceil("h"))) & (kh.index < t_end)][["open", "high", "low", "close"]]
    if len(h): bars.append(h.assign(dur=60))
    if not bars: return None
    B = pd.concat(bars).sort_index()
    if B.index[0] - t_in > pd.Timedelta(minutes=1) and lag_min is not None: return None
    p0 = B.open.iloc[0] * (1 + side * slip_in)   # short sells lower
    f = T.F[sym]; lvl = p0 * (1 - side * stop) if stop is not None else None
    cum = -FEE; out = {}; prev = p0; day = B.index[0].normalize(); first = True
    for t, r in B.iterrows():
        d = t.normalize()
        if d != day: out[day] = cum; day = d
        if first or (t.hour == 0 and t.minute == 0):
            frac = 1.0 if (t.hour == 0 and t.minute == 0) else (24 - t.hour - t.minute / 60) / 24
            cum -= side * f.get(d, 0.0) * frac * prev / p0; first = False
        if lvl is not None and ((side < 0 and r.high >= lvl) or (side > 0 and r.low <= lvl)):
            px = (max(r.open, lvl) if side < 0 else min(r.open, lvl)) * (1 - side * slip_stop)
            cum += side * (px - prev) / p0 - FEE * px / p0; out[d] = cum
            return dict(sym=sym, side=side, d0=B.index[0].normalize(), path=pd.Series(out), vol=T._vol(sym, T.POS[B.index[0].normalize()]), stopped=True)
        cum += side * (r.close - prev) / p0; prev = r.close
    cum -= FEE * prev / p0; out[day] = cum
    return dict(sym=sym, side=side, d0=B.index[0].normalize(), path=pd.Series(out), vol=T._vol(sym, T.POS[B.index[0].normalize()]), stopped=False,
                trunc=(B.index[-1] + pd.Timedelta(minutes=int(B.dur.iloc[-1]))) < t_end - pd.Timedelta(hours=1))

BOOK = {"MON": (168, 0.5), "DEL": (72, 0.2), "LIST": (720, 0.2)}
def cms_book(lag_min=None, slip_in=0.0, slip_stop=0.0, path1m=True, fee=None):
    out = []
    for _, e in T.CE[T.CE.type.isin(list(BOOK))].iterrows():
        hh, st = BOOK[e.type]
        tr = trade(e.sym, e.ts, hh, st, lag_min, slip_in, slip_stop, path1m=path1m, fee=fee)
        if tr: tr["tag"] = e.type; tr["ts"] = e.ts; out.append(tr)
    return out
