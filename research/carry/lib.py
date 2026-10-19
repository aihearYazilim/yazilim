"""Market-neutral backtest helpers (no look-ahead).
Convention: weights at row t are decided at close of UTC day t (00:00 of t+1) using data <= t,
and earn day t+1 price return and funding fund[t+1] (settled in (t+1 00:00, t+2 00:00]).
Perp weight w>0 long, w<0 short; perp position PAYS w*funding (short receives)."""
import sys, pathlib, numpy as np, pandas as pd
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "src"))
from engine import stats  # noqa
import panels

OOS_START, OOS_END = "2025-10-17", "2026-10-16"
IS_START = "2020-01-01"
FEE_PERP, FEE_SPOT = 0.0010, 0.0015   # protocol: futures 0.10%/trade, spot 0.15%/trade (fee+slippage)
BORROW = 0.08                         # annual USDT borrow cost for spot exposure above equity

_P = None
def P():
    global _P
    if _P is None:
        _P = panels.build()
        oct_ = pathlib.Path(__file__).parent / "data" / "panels_oct.pkl"
        if oct_.exists():
            o = pd.read_pickle(oct_)
            _P = {k: pd.concat([v, o[k].reindex(columns=v.columns)]).sort_index() for k, v in _P.items()}
            _P = {k: v[~v.index.duplicated(keep="first")] for k, v in _P.items()}
    return _P

def rets(px):
    r = px.pct_change(fill_method=None)
    return r.clip(-0.95, 5.0).fillna(0.0)

def run(wp=None, ws=None, fee_perp=FEE_PERP, fee_spot=FEE_SPOT, borrow=BORROW, extra=None):
    """Return daily net return series (index = day of P&L)."""
    p = P()
    idx = p["perp"].index
    net = pd.Series(0.0, index=idx)
    gross_spot = pd.Series(0.0, index=idx)
    for w, px, fee, isperp in [(wp, p["perp"], fee_perp, True), (ws, p["spot"], fee_spot, False)]:
        if w is None:
            continue
        w = w.reindex(index=idx).fillna(0.0)
        cols = w.columns[(w != 0).any()]
        w = w[cols]
        r = rets(px.reindex(columns=cols))
        wl = w.shift(1).fillna(0.0)
        pnl = (wl * r).sum(1)
        if isperp:
            f = p["fund"].reindex(columns=cols).fillna(0.0)
            pnl -= (wl * f).sum(1)
        else:
            gross_spot = wl.abs().sum(1)
        drift = wl * (1 + r)
        turn = (w - drift).abs().sum(1)
        net += pnl - turn * fee
    net -= (gross_spot - 1).clip(lower=0) * borrow / 365
    return net

def eq(net):
    return (1 + net).cumprod()

def summarize(net, name="", lev=None, ncomb=None, is_start=IS_START):
    e = eq(net)
    s_is = stats(e, is_start, "2025-10-16")
    s_oos = stats(e, OOS_START, OOS_END)
    return dict(name=name, IS_geo=s_is.get("aylik_geo_%"), IS_dd=s_is.get("maxDD_%"),
                OOS_geo=s_oos.get("aylik_geo_%"), OOS_dd=s_oos.get("maxDD_%"),
                OOS_worst=s_oos.get("en_kotu_ay_%"), OOS_neg=s_oos.get("negatif_ay"), lev=lev, ncomb=ncomb)

def walk_forward(cands, train_months=24, min_months=6, metric="geo", switch_cost=0.0, start=IS_START):
    """cands: dict name -> daily net series (each computed causally). For every calendar month M,
    pick the candidate with the best trailing performance over the train window ending before M,
    then use its returns in M. Returns (chained net series, picks)."""
    df = pd.DataFrame(cands).fillna(0.0)
    months = pd.period_range(pd.Timestamp(start).to_period("M"), df.index.max().to_period("M"), freq="M")
    out, picks, prev = [], {}, None
    for m in months:
        t0 = m.start_time
        tr = df.loc[(df.index < t0) & (df.index >= t0 - pd.DateOffset(months=train_months))]
        # only candidates with enough live history
        live = (tr != 0).sum() >= min_months * 21
        if live.sum() == 0:
            continue
        if metric == "geo":
            sc = np.log1p(tr).sum()
        else:  # sharpe
            sc = tr.mean() / tr.std().replace(0, np.nan)
        sc = sc[live].dropna()
        best = sc.idxmax()
        seg = df.loc[(df.index >= t0) & (df.index <= m.end_time), best].copy()
        if prev is not None and best != prev and len(seg):
            seg.iloc[0] -= switch_cost
        out.append(seg); picks[str(m)] = best; prev = best
    return pd.concat(out), picks
