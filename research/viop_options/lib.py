"""Shared: option panel with matching futures, Black-76 IV/delta, rates."""
import numpy as np, pandas as pd, sys, pathlib
from scipy.stats import norm
D = pathlib.Path('/home/user/yazilim/research/viop_options')
sys.path.insert(0, '/home/user/yazilim/research/combo'); sys.path.insert(0, '/home/user/yazilim/src')
import deposit_v5 as dep, engine

def b76(F, K, T, s, cp, df=1.0):
    s = np.maximum(s, 1e-6); T = np.maximum(T, 1e-6)
    d1 = (np.log(F / K) + 0.5 * s * s * T) / (s * np.sqrt(T)); d2 = d1 - s * np.sqrt(T)
    c = df * (F * norm.cdf(d1) - K * norm.cdf(d2)); p = df * (K * norm.cdf(-d2) - F * norm.cdf(-d1))
    return np.where(cp == 'C', c, p)

def delta76(F, K, T, s, cp):
    s = np.maximum(s, 1e-6); T = np.maximum(T, 1e-6)
    d1 = (np.log(F / K) + 0.5 * s * s * T) / (s * np.sqrt(T))
    return np.where(cp == 'C', norm.cdf(d1), norm.cdf(d1) - 1)

def strike_for_delta(F, T, s, delta, cp):
    """strike whose Black-76 delta (abs) = delta, given vol s."""
    s = np.maximum(s, 1e-6); sq = s * np.sqrt(T)
    d1 = norm.ppf(delta) if cp == 'C' else -norm.ppf(delta)
    return F * np.exp(-d1 * sq + 0.5 * sq * sq)

def implied_vol(price, F, K, T, cp, df):
    lo = np.full(len(price), 1e-3); hi = np.full(len(price), 5.0)
    for _ in range(60):
        mid = 0.5 * (lo + hi); v = b76(F, K, T, mid, cp, df)
        hi = np.where(v > price, mid, hi); lo = np.where(v > price, lo, mid)
    iv = 0.5 * (lo + hi)
    intr = df * np.where(cp == 'C', np.maximum(F - K, 0), np.maximum(K - F, 0))
    iv[(price <= intr + 1e-9) | (iv > 4.9)] = np.nan
    return iv

def tl_rate(idx):
    """gross annual simple TL rate (deposit table + pre-2022 policy fallback) used for discounting."""
    return dep.gross(pd.DatetimeIndex(idx)).values

def build(root):
    """root in XU030 / USDTRY. returns options with F (same-expiry futures settle), T, df, iv, delta."""
    df = pd.read_pickle(D / 'data/all.pkl')
    oroot = 'XU030' if root == 'XU030' else 'USDTRYK'
    o = df[(df.kind == 'O') & (df.root == oroot)].copy()
    f = df[(df.kind == 'F') & (df.root == root)][['date', 'exp', 'settle', 'close', 'qty', 'oi']]
    f = f.rename(columns={'settle': 'F', 'close': 'Fclose', 'qty': 'Fqty', 'oi': 'Foi'})
    o = o.merge(f, on=['date', 'exp'], how='left')
    if root == 'USDTRY': o['K'] = o['K'] / 1000.0; o['px'] = o['settle'] / 1000.0; o['pclose'] = o['close'] / 1000.0
    else: o['px'] = o['settle']; o['pclose'] = o['close']
    o['T'] = (o['exp'] - o['date']).dt.days / 365.0
    rd = pd.Series(tl_rate(o['date'].unique()), index=o['date'].unique())
    o['r'] = o['date'].map(rd)
    o['dfac'] = 1 / (1 + o['r'] * o['T'])
    ok = o['F'].notna() & (o['T'] > 0) & (o['px'] > 0)
    o['iv'] = np.nan
    o.loc[ok, 'iv'] = implied_vol(o.loc[ok, 'px'].values, o.loc[ok, 'F'].values, o.loc[ok, 'K'].values,
                                  o.loc[ok, 'T'].values, o.loc[ok, 'cp'].values, o.loc[ok, 'dfac'].values)
    o['delta'] = delta76(o['F'].values, o['K'].values, o['T'].values, o['iv'].fillna(0.3).values, o['cp'].values)
    return o, f

def fut_cont(root):
    """front futures settle series (for realized vol): roll to next on expiry date."""
    df = pd.read_pickle(D / 'data/all.pkl')
    f = df[(df.kind == 'F') & (df.root == root)]
    f = f[f.exp > f.date].sort_values(['date', 'exp'])
    front = f.groupby('date').first()
    # daily log return using same contract (prev settle field)
    ret = np.log(front['settle'] / front['prev'])
    return front, ret
