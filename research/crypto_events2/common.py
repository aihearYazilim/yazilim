"""Shared helpers: reuse crypto_events/trades.py (daily panels, funding, unlock trades), audit exec1m.py (1m stop path,
slippage) and audit port_fix.py (corrected portfolio sim). Kline loaders are redirected to look in crypto_events2/raw
first, then the original crypto_events/raw."""
import sys, pathlib, pandas as pd, numpy as np
H = pathlib.Path(__file__).parent
sys.path.insert(0, str(H.parent / "crypto_events_audit")); sys.path.insert(0, str(H.parent / "crypto_events"))
import trades as T, exec1m as X, port_fix as PF, port
DIRS = [H / "raw", H.parent / "crypto_events/raw"]
_K = {}
def k1h(sym):
    if sym not in _K:
        ds = []
        for d in DIRS:
            f = d / f"k1h/{sym}.csv"
            if f.exists(): ds.append(pd.read_csv(f))
        if not ds: raise FileNotFoundError(sym)
        k = pd.concat(ds); k["ts"] = k.ts.where(k.ts < 1e14, k.ts // 1000)
        k = k.drop_duplicates("ts").sort_values("ts"); k.index = pd.to_datetime(k.ts, unit="ms"); _K[sym] = k
    return _K[sym]
_M = {}
def k1m(sym, ts):
    key = (sym, ts.normalize())
    if key not in _M:
        ds = []
        for i in (0, 1):
            day = (ts.normalize() + pd.Timedelta(days=i)).strftime("%Y-%m-%d")
            for d in DIRS:
                f = d / f"k1m/{sym}_{day}.csv"
                if f.exists() and f.stat().st_size > 40: ds.append(pd.read_csv(f)); break
        if not ds: _M[key] = None
        else:
            x = pd.concat(ds); x["ts"] = x.ts.where(x.ts < 1e14, x.ts // 1000)
            x.index = pd.to_datetime(x.ts, unit="ms"); _M[key] = x[~x.index.duplicated()].sort_index()[["open", "high", "low", "close"]]
    return _M[key]
T.k1h = k1h; X.k1m = k1m
BOOK = {"MON": (168, 0.5), "DEL": (72, 0.2), "LIST": (720, 0.2)}   # IS_best params (fixed, no re-optimisation)
UNL = ("UNL", 0.10, 10, 3, 1.0)
def venue_trades(E, slip_in=0.005, slip_stop=0.01, lag_min=None):
    out = []
    for _, e in E.iterrows():
        hh, st = BOOK[e.type]
        tr = X.trade(e.sym, e.ts, hh, st, lag_min, slip_in, slip_stop)
        if tr: tr["tag"] = f"{e.venue}_{e.type}"; tr["ts"] = e.ts; out.append(tr)
    return out
def binance_book(slip_in=0.005, slip_stop=0.01):
    """Audit scenario B: UNL daily + Binance CMS (MON/DEL/LIST) on 1m path with slippage."""
    return T.unlock_trades(*UNL[1:]), X.cms_book(None, slip_in, slip_stop)
fx = PF.fx
def window(trs, a, b, s, G=2.0, hedge=1):
    r = PF.sim(trs, s, G, hedge, a, b)
    rt = (1 + r) * (1 + fx[r.index]) - 1
    u = PF.st_(r, a, b); t = PF.st_(rt, a, b)
    return dict(usd=u[0], try_=t[0], dd=u[1], worst=u[2], n=len(r.attrs["log"])), r
def tradable(sym, ts, min_qvol=1e5):
    """Binance perp actually trading at the event: >= $100k quote volume in the 24 1h bars before entry and moving price
    (Binance keeps flat zero-volume bars for settled/delisted perps; the daily panel forward-fills them)."""
    try: k = k1h(sym)
    except FileNotFoundError: return False
    t0 = ts.ceil("h"); w = k[(k.index < t0) & (k.index >= t0 - pd.Timedelta(hours=24))]
    if t0 not in k.index or len(w) < 12: return False
    a = k.loc[t0: t0 + pd.Timedelta(hours=23)]
    return bool(w.qvol.sum() >= min_qvol and w.close.nunique() > 1 and a.close.nunique() > 1)
def load_events(path=None, independent_only=False):
    E = pd.read_csv(path or H / "venue_events.csv", parse_dates=["ts"])
    E = E[[tradable(s, t) for s, t in zip(E.sym, E.ts)]]
    if independent_only: E = E[~E.overlap.astype(bool)]
    return E
