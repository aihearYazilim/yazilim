import numpy as np
from math import sqrt
_erf = np.vectorize(__import__("math").erf)
def N(x): return 0.5 * (1 + _erf(np.asarray(x, float) / sqrt(2)))
def bs_price(F, K, T, v, isc):
    F, K, T, v = map(lambda a: np.asarray(a, float), (F, K, T, v))
    sd = v * np.sqrt(T); d1 = (np.log(F / K) + 0.5 * sd * sd) / sd; d2 = d1 - sd
    c = F * N(d1) - K * N(d2)
    return np.where(isc, c, c - F + K)
def bs_delta(F, K, T, v, isc):
    sd = np.asarray(v) * np.sqrt(T); d1 = (np.log(np.asarray(F) / K) + 0.5 * sd * sd) / sd
    return np.where(isc, N(d1), N(d1) - 1)
def strike_for_delta(F, T, v, delta, isc):
    """K such that BS delta = delta (put delta negative)."""
    sd = v * np.sqrt(T)
    from statistics import NormalDist
    nd = NormalDist()
    d1 = nd.inv_cdf(delta) if isc else nd.inv_cdf(1 + delta)
    return F * np.exp(-d1 * sd + 0.5 * sd * sd)
def implied_vol(P, F, K, T, isc, lo=0.01, hi=5.0, it=60):
    P, F, K, T = map(lambda a: np.asarray(a, float), (P, F, K, T))
    a = np.full(P.shape, lo); b = np.full(P.shape, hi)
    intr = np.where(isc, np.maximum(F - K, 0), np.maximum(K - F, 0))
    for _ in range(it):
        m = 0.5 * (a + b); p = bs_price(F, K, T, m, isc)
        hiside = p > P; b = np.where(hiside, m, b); a = np.where(hiside, a, m)
    out = 0.5 * (a + b)
    bad = (P <= intr + 1e-12) | (P >= np.where(isc, F, K)) | (out > hi - 0.01)
    return np.where(bad, np.nan, out)
