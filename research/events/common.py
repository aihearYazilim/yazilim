import pathlib, sys, numpy as np, pandas as pd
H = pathlib.Path(__file__).parent
sys.path.insert(0, str(H.parents[1] / "src"))
from engine import cash_rate_daily, stats
OOS_START = pd.Timestamp("2025-10-17"); OOS_END = pd.Timestamp("2026-10-16")
FEE = 0.0014; SLIP = 0.0010   # tek yön

def _finish(o):
    bad = ~(o.v > 0); o.loc[bad, "v"] = o.c[bad]          # VWAP yoksa kapanış
    for k in ("lo", "hi"):
        b = ~(o[k] > 0); o.loc[b, k] = o.c[b]
    o["pc"] = o.c.shift(1)
    o["lockup"] = o.lo >= o.pc * 1.094      # tüm gün tavan kilitli -> alınamaz
    o["lockdn"] = o.hi <= o.pc * 0.906      # tüm gün taban kilitli -> satılamaz
    o["vol20"] = o.vol.rolling(20, min_periods=5).mean().shift(1)
    return o

def load_yahoo(t):
    """Yedek: data/bist_all (Yahoo, bölünme düzeltmeli; adj_ratio ile temettü). VWAP yerine (H+L+C)/3."""
    f = H.parents[1]/"data"/"bist_all"/f"{t}.csv"
    if not f.exists(): return None
    d = pd.read_csv(f, index_col=0, parse_dates=True).dropna(subset=["close"])
    d = d[d.close > 0]
    a = d.adj_ratio.fillna(1.0) if "adj_ratio" in d else 1.0
    o = pd.DataFrame({"c": d.close * a, "v": (d.high + d.low + d.close) / 3 * a, "lo": d.low * a, "hi": d.high * a,
                      "vol": d.volume * (d.high + d.low + d.close) / 3})
    return _finish(o)

def load_px(tickers=None):
    px = {}
    if tickers:
        for t in tickers:
            if not (H/"prices"/f"{t}.csv").exists():
                o = load_yahoo(t)
                if o is not None and len(o) > 30: px[t] = o
    for f in (H/"prices").glob("*.csv"):
        d = pd.read_csv(f, index_col=0, parse_dates=True)
        if len(d) < 30: continue
        d = d[(d.close_raw > 0) & (d.close_adj > 0)]
        fct = d.close_adj / d.close_raw
        o = pd.DataFrame({"c": d.close_adj, "v": d.vwap_raw * fct, "lo": d.low_raw * fct, "hi": d.high_raw * fct, "vol": d.vol_tl})
        px[f.stem] = _finish(o)
    return px

def load_events():
    E = pd.read_csv(H/"bedelsiz_events.csv", parse_dates=["start", "ex_date", "application", "approval", "post", "cancel"])
    E["appr2"] = E[["approval", "post"]].min(axis=1)   # SPK onayı ya da (yoksa) hak kullanım bildirimi
    return E

def entry_day(ts, idx):
    """bildirim zamanı -> ilk işlem günü (09:30'dan önce ise aynı gün, değilse ertesi gün)."""
    d = ts.normalize()
    if ts.hour * 60 + ts.minute < 9 * 60 + 30:
        j = idx.searchsorted(d)
    else:
        j = idx.searchsorted(d, side="right")
    return j
