"""Evaluate grid results: IS/OOS monthly geo (USD, TRY), maxDD, worst month, IS-only selection and walk-forward."""
import glob, os, sys
import numpy as np, pandas as pd
from load import usdtry, HERE

OOS0 = pd.Timestamp('2025-10-17', tz='UTC'); OOS1 = pd.Timestamp('2026-10-17', tz='UTC')
BORROW = 0.07  # USD borrow cost p.a. for leverage overlay (Aave USDC variable ~5-9%)


def anchors(first):
    a = pd.date_range('2021-12-17', '2026-10-17', freq='MS', tz='UTC') + pd.Timedelta(days=16)
    return a[a >= first]


def period_returns(eq):
    """eq: daily equity series (USD). returns per 17th->17th period."""
    eq = eq.dropna()
    eq = eq[eq.index < OOS1 + pd.Timedelta(days=1)]
    if len(eq) < 40: return pd.Series(dtype=float)
    a = anchors(eq.index[0] + pd.Timedelta(days=1))
    v = eq.reindex(a, method='ffill')
    r = v.pct_change().dropna()
    return r


def to_try(r):
    u = usdtry()
    a = r.index
    prev = a - pd.DateOffset(months=1)
    ut = u.reindex(a, method='ffill').values; up = u.reindex(prev, method='ffill').values
    return (1 + r) * ut / up - 1


def geo(r):
    r = r.dropna()
    return (np.prod(1 + r) ** (1 / len(r)) - 1) if len(r) else np.nan


def maxdd(eq):
    eq = eq.dropna()
    return (eq / eq.cummax() - 1).min()


def load_all(tag=''):
    E = []
    for f in sorted(glob.glob(f'{HERE}/out/eq_*{tag}.pkl')):
        if tag == '' and f.endswith('_low.pkl'): continue
        E.append(pd.read_pickle(f))
    return pd.concat(E, axis=1)


def lever(r, lev):
    return lev * r - (lev - 1) * BORROW / 12


def summarize(E):
    rows = []
    for c in E.columns:
        r = period_returns(E[c])
        if len(r) == 0: continue
        ri = r[r.index <= OOS0]; ro = r[(r.index > OOS0) & (r.index <= OOS1)]
        rt = to_try(r); rti = rt[rt.index <= OOS0]; rto = rt[(rt.index > OOS0)]
        eo = E[c][(E.index >= OOS0) & (E.index < OOS1)]
        rows.append(dict(cfg=c, n_is=len(ri), is_usd=geo(ri), oos_usd=geo(ro), is_try=geo(rti), oos_try=geo(rto),
                         oos_dd=maxdd(eo), oos_worst=ro.min() if len(ro) else np.nan,
                         is_dd=maxdd(E[c][E.index < OOS0])))
    return pd.DataFrame(rows).set_index('cfg')


def walk_forward(E, lookback=24, min_hist=6, cands=None):
    R = pd.DataFrame({c: period_returns(E[c]) for c in (cands or E.columns)})
    R = R[R.index <= OOS1]
    out = []; picks = []
    for t in R.index:
        hist = R[R.index < t].tail(lookback)
        ok = hist.count() >= min_hist
        if not ok.any(): continue
        g = (np.log1p(hist.loc[:, ok].clip(lower=-0.99))).mean()
        best = g.idxmax()
        out.append((t, R.loc[t, best])); picks.append((t, best))
    s = pd.Series(dict(out)).dropna()
    return s, pd.Series(dict(picks))


if __name__ == '__main__':
    E = load_all()
    S = summarize(E)
    S.to_csv(f'{HERE}/out/summary.csv')
    pd.set_option('display.width', 250); pd.set_option('display.max_rows', 500)
    print('combos', len(S))
    print(S.sort_values('is_usd', ascending=False).head(25).round(4))
    print(S.sort_values('oos_usd', ascending=False).head(10).round(4))


def timed(eq, look=14, cost=0.00125):
    """Regime filter: be in the LP strategy on day t only if its trailing `look`-day return > 0 (known at t-1);
    else hold USD cash (0%). Entry/exit cost `cost` of capital each switch."""
    r = eq.pct_change().fillna(0.0)
    sig = (eq / eq.shift(look) - 1).shift(1) > 0
    sw = sig.astype(int).diff().abs().fillna(0)
    rr = np.where(sig, r, 0.0) - sw * cost
    out = (1 + pd.Series(rr, index=eq.index)).cumprod()
    out[eq.isna()] = np.nan
    return out
