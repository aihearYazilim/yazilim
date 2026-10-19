"""Strateji ağırlık üreticileri. Hepsi sadece t ve öncesi veriyi kullanır."""
import numpy as np, pandas as pd

def buy_hold(close, names):
    w = pd.DataFrame(0.0, index=close.index, columns=close.columns)
    avail = close[names].notna()
    w[names] = avail.div(avail.sum(axis=1), axis=0).fillna(0)
    return w

def trend_single(close, name, n=50, lev=1.0):
    w = pd.DataFrame(0.0, index=close.index, columns=close.columns)
    c = close[name]
    w[name] = np.where(c > c.rolling(n).mean(), lev, 0.0)
    return w

def momentum_rotation(close, lookback=30, top=3, rebalance=7, regime=None, regime_n=50,
                      lev=1.0, min_hist=120, abs_filter=True, vol_scale=False):
    """Kesitsel momentum: her `rebalance` günde son `lookback` getirisi en yüksek `top` varlık.
    regime: rejim filtresi için varlık (ör. BTC / XU100). Rejim kapalıysa nakit."""
    mom = close / close.shift(lookback) - 1
    hist_ok = close.notna().rolling(min_hist).sum() >= min_hist
    mom = mom.where(hist_ok)
    if regime is not None:
        rc = close[regime] if isinstance(regime, str) else regime
        on = rc > rc.rolling(regime_n).mean()
    else:
        on = pd.Series(True, index=close.index)
    vol = close.pct_change(fill_method=None).rolling(30).std()
    w = pd.DataFrame(0.0, index=close.index, columns=close.columns)
    last = None
    for i, d in enumerate(close.index):
        if i % rebalance == 0:
            row = mom.loc[d].dropna()
            if abs_filter:
                row = row[row > 0]
            pick = row.nlargest(top).index if on.loc[d] else []
            cur = pd.Series(0.0, index=close.columns)
            if len(pick):
                if vol_scale:
                    iv = 1 / vol.loc[d, pick]
                    cur[pick] = (iv / iv.sum()).values * lev
                else:
                    cur[pick] = lev / top  # boş kalan slotlar nakit
            last = cur
        if last is not None:
            w.loc[d] = last
    return w

def donchian_basket(close, high_n=20, low_n=10, names=None, lev=1.0):
    """Her varlıkta N-gün zirve kırılımında gir, M-gün dip kırılımında çık. Eşit sermaye dilimi."""
    names = names or list(close.columns)
    c = close[names]
    hi = c.rolling(high_n).max().shift(1)
    lo = c.rolling(low_n).min().shift(1)
    pos = pd.DataFrame(np.nan, index=c.index, columns=names)
    pos[c > hi] = 1.0
    pos[c < lo] = 0.0
    pos = pos.ffill().fillna(0)
    n_live = c.notna().sum(axis=1).clip(lower=1)
    w = pd.DataFrame(0.0, index=close.index, columns=close.columns)
    w[names] = pos.div(n_live, axis=0) * lev
    return w
