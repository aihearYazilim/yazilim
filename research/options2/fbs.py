"""Fast vectorised Black-76 (USD) helpers."""
import numpy as np
from scipy.special import ndtr, ndtri

def bs(F, K, T, v, isc):
    F, K, T, v = (np.asarray(a, float) for a in (F, K, T, v))
    T = np.maximum(T, 1e-9); v = np.maximum(v, 1e-4)
    sd = v * np.sqrt(T); d1 = (np.log(F / K) + 0.5 * sd * sd) / sd; d2 = d1 - sd
    c = F * ndtr(d1) - K * ndtr(d2)
    return np.where(isc, c, c - F + K)

def delta(F, K, T, v, isc):
    F, K, T, v = (np.asarray(a, float) for a in (F, K, T, v))
    T = np.maximum(T, 1e-9); v = np.maximum(v, 1e-4)
    sd = v * np.sqrt(T); d1 = (np.log(F / K) + 0.5 * sd * sd) / sd
    return np.where(isc, ndtr(d1), ndtr(d1) - 1)

def strike_for_delta(F, T, v, d, isc):
    sd = v * np.sqrt(T)
    d1 = ndtri(d) if isc else ndtri(1 + d)
    return F * np.exp(-d1 * sd + 0.5 * sd * sd)

def iv(P, F, K, T, isc, lo=0.01, hi=6.0, it=60):
    P, F, K, T = (np.asarray(a, float) for a in (P, F, K, T))
    a = np.full(P.shape, lo); b = np.full(P.shape, hi)
    for _ in range(it):
        m = 0.5 * (a + b); p = bs(F, K, T, m, isc)
        up = p > P; b = np.where(up, m, b); a = np.where(up, a, m)
    out = 0.5 * (a + b)
    intr = np.where(isc, np.maximum(F - K, 0), np.maximum(K - F, 0))
    bad = (P <= intr + 1e-12) | (out > hi - 0.01) | (out < lo + 0.001)
    return np.where(bad, np.nan, out)
