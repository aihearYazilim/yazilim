"""Signal -> target weights for each anomaly. All signals use data up to and including close t (trade at close t, MOC)."""
import numpy as np, pandas as pd, lib

def prep(D):
    P = D["P"]; adj = P["adjclose"]; cl = P["close"]
    dv = (cl * P["volume"]).rolling(60, min_periods=40).median()
    hist = adj.notna().rolling(260, min_periods=1).sum()
    elig = D["mem"] & (dv > 1e7) & (cl > 5) & (hist >= 252)
    spy = adj["SPY"]
    regime = spy > spy.rolling(200).mean()
    return dict(adj=adj, elig=elig, regime=regime, ret=adj.pct_change(fill_method=None))

def topn(score, elig, dates, n, regime=None, ascending=False):
    """Equal-weight top-n by score at each date; zero when regime False."""
    sc = score.where(elig).loc[dates]
    rk = sc.rank(axis=1, ascending=ascending, method="first")
    w = (rk <= n).astype(float)
    w = w.div(w.sum(1).replace(0, np.nan), axis=0).fillna(0)
    if regime is not None:
        w = w.mul(regime.reindex(dates).astype(float), axis=0)
    return w

def mom(S, L=252, skip=21):
    a = S["adj"]; return a.shift(skip) / a.shift(L) - 1
def hi52(S, L=252):
    a = S["adj"]; return a / a.rolling(L, min_periods=200).max()
def vol(S, L=63):
    return S["ret"].rolling(L, min_periods=int(L * .8)).std()
def rev(S, L=5):
    a = S["adj"]; return a / a.shift(L) - 1
def zrank(x, elig):
    x = x.where(elig); return x.rank(axis=1, pct=True)
