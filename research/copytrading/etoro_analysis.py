"""eToro copy-trading: point-in-time selection on monthly gain histories.

Data: raw/copytrading/etoro_hist.jsonl (monthly % gain per user, back to inception),
      universe = users that TODAY are Popular Investors or have >=1 copier (survivor-biased upward).
Selection: uses only months <= 2025-09 (strictly before OOS start 2025-10-17).
OOS months: 2025-10 .. 2026-09 (12 full months; ~2 weeks earlier than the official window,
            selection info still strictly pre-OOS). Also reported: 2025-11..2026-10(partial).
Walk-forward: same fixed rule re-applied every month (top-N re-picked each month from data up to prior month);
              IS = 2019-01..2025-09, rule chosen by IS only.
Costs (copier): no profit share on eToro (PIs paid by eToro); copy-replication slippage 0.10%/month,
                USD<->TRY conversion ~1% round trip amortised over 12m (0.083%/month), re-selection turnover
                cost 0.2% per unit turnover (closing/opening copies at market). Tax variant: 20% on positive annual USD profit.
"""
import json, itertools, numpy as np, pandas as pd

RAW = '/home/user/yazilim/raw/copytrading'
FX = pd.read_csv('/home/user/yazilim/data/bist/USDTRY.csv', index_col=0, parse_dates=True)['close']
fxm = FX.resample('ME').last()
fx_ret = fxm.pct_change()
fx_ret.index = fx_ret.index.to_period('M')

SLIP_M = 0.0010 + 0.00083
SWITCH = 0.002


def load():
    rows = {}
    for l in open(f'{RAW}/etoro_hist.jsonl'):
        x = json.loads(l)
        if not x['monthly']:
            continue
        s = {}
        for m in x['monthly']:
            if m.get('isSimulation'):
                continue
            s[pd.Period(m['start'][:7], 'M')] = m['gain'] / 100
        rows[x['cid']] = pd.Series(s)
    R = pd.DataFrame(rows).sort_index()
    R = R.reindex(pd.period_range(R.index.min(), R.index.max(), freq='M'))
    # inside a user's life a missing month = 0; before first / after last = NaN
    first = R.apply(lambda c: c.first_valid_index())
    last = R.apply(lambda c: c.last_valid_index())
    for c in R.columns:
        R.loc[first[c]:last[c], c] = R.loc[first[c]:last[c], c].fillna(0)
    return R


def metric(win, kind):
    eq = (1 + win).cumprod()
    dd = (1 - eq / eq.cummax()).max()
    if kind == 'ret12':
        v = (1 + win.iloc[-12:]).prod() - 1
    elif kind == 'sharpe24':
        w = win.iloc[-24:]
        v = w.mean() / w.std(ddof=1)
    elif kind == 'calmar24':
        w = win.iloc[-24:]
        v = ((1 + w).prod() ** (12 / 24) - 1) / max((1 - (1 + w).cumprod() / (1 + w).cumprod().cummax()).max(), 0.02)
    return v, dd


_CACHE = {}


def _scores(R, t, kind, hist_req):
    key = (t, kind, hist_req)
    if key in _CACHE:
        return _CACHE[key]
    win = R.loc[:t].iloc[-hist_req:]
    ok = (win.notna().all() & (len(win) == hist_req)).values
    W = win.values[:, ok]
    cols = win.columns[ok]
    eq = np.cumprod(1 + W, axis=0)
    dd = (1 - eq / np.maximum.accumulate(eq, axis=0)).max(axis=0)
    if kind == 'ret12':
        v = np.prod(1 + W[-12:], axis=0) - 1
    elif kind == 'sharpe24':
        w = W[-24:]
        v = w.mean(0) / np.maximum(w.std(0, ddof=1), 1e-4)
    else:
        w = W[-24:]
        e = np.cumprod(1 + w, axis=0)
        d24 = (1 - e / np.maximum.accumulate(e, axis=0)).max(axis=0)
        v = (e[-1] ** 0.5 - 1) / np.maximum(d24, 0.02)
    _CACHE[key] = (cols, v, dd)
    return _CACHE[key]


def select(R, t, kind, ddcap, n, hist_req):
    """t = last month whose data may be used."""
    cols, v, dd = _scores(R, t, kind, hist_req)
    m = np.ones(len(cols), bool) if ddcap is None else dd <= ddcap
    if m.sum() == 0:
        return []
    s = pd.Series(v[m], index=cols[m]).sort_values(ascending=False)
    return list(s.index[:n])


def run(R, months, kind, ddcap, n, hist_req, rebalance=True, fixed=None):
    out, prev = [], set()
    for m in months:
        t = m - 1
        if fixed is not None:
            picks = fixed
        elif rebalance or not prev:
            picks = select(R, t, kind, ddcap, n, hist_req)
        else:
            picks = list(prev)
        if not picks:
            out.append(0.0); continue
        r = R.loc[m, picks]
        # a lead that disappeared from the data: treat its month as -100%? we only see survivors; use 0 if NaN
        r = r.fillna(0.0)
        turn = len(set(picks) ^ prev) / max(len(picks), 1) if prev else 1.0
        out.append(r.mean() - SLIP_M - SWITCH * turn)
        prev = set(picks)
    return pd.Series(out, index=months)


def stats(r_usd, months, tax=0.0):
    r_try = (1 + r_usd) * (1 + fx_ret.reindex(months).fillna(0)) - 1
    if tax:
        # simple: annual 20% on positive USD gain, charged at year end of the window
        g = (1 + r_usd).prod() - 1
        if g > 0:
            adj = (1 + g * (1 - tax)) / (1 + g)
            r_try = r_try.copy(); r_try.iloc[-1] = (1 + r_try.iloc[-1]) * adj - 1
    eq = (1 + r_try).cumprod()
    return dict(geo_try=(eq.iloc[-1]) ** (1 / len(eq)) - 1,
                geo_usd=((1 + r_usd).prod()) ** (1 / len(r_usd)) - 1,
                mdd=(eq / eq.cummax().clip(lower=1.0) - 1).min(), worst=r_try.min())


if __name__ == '__main__':
    R = load()
    print('users', R.shape[1], 'with >=24m pre-OOS:', (R.loc[:'2025-09'].notna().sum() >= 24).sum())
    OOS = pd.period_range('2025-10', '2026-09', freq='M')
    OOS2 = pd.period_range('2025-11', '2026-10', freq='M')
    IS = pd.period_range('2019-01', '2025-09', freq='M')
    grid = list(itertools.product(['ret12', 'sharpe24', 'calmar24'], [None, 0.2, 0.3], [1, 3, 5, 10, 20], [24, 36]))
    res = []
    for kind, ddcap, n, h in grid:
        ris = run(R, IS, kind, ddcap, n, h)
        roos = run(R, OOS, kind, ddcap, n, h)
        # buy-and-hold variant: picks fixed at 2025-09
        picks = select(R, pd.Period('2025-09', 'M'), kind, ddcap, n, h)
        rbh = run(R, OOS, kind, ddcap, n, h, fixed=picks)
        rbh2 = run(R, OOS2, kind, ddcap, n, h, fixed=picks)
        s_is = stats(ris, IS); s_o = stats(roos, OOS); s_bh = stats(rbh, OOS); s_bh2 = stats(rbh2, OOS2)
        s_tax = stats(rbh, OOS, tax=0.2)
        res.append(dict(kind=kind, ddcap=ddcap, n=n, hist=h, IS_try=s_is['geo_try'], IS_usd=s_is['geo_usd'],
                        WF_OOS_try=s_o['geo_try'], WF_OOS_usd=s_o['geo_usd'], WF_mdd=s_o['mdd'],
                        BH_OOS_try=s_bh['geo_try'], BH_OOS_usd=s_bh['geo_usd'], BH_mdd=s_bh['mdd'],
                        BH_worst=s_bh['worst'], BH_try_tax=s_tax['geo_try'], BH2_try=s_bh2['geo_try'],
                        picks=','.join(map(str, picks[:5]))))
    df = pd.DataFrame(res)
    pd.set_option('display.width', 250); pd.set_option('display.max_columns', 30)
    df.to_csv(f'{RAW}/etoro_grid.csv', index=False)
    num = df.select_dtypes('number').columns.drop(['n', 'hist'])
    print(df.drop(columns='picks').assign(**{c: (df[c] * 100).round(2) for c in num}).to_string())
    print('combos', len(df))
    best = df.sort_values('IS_try', ascending=False).iloc[0]
    print('BEST BY IS (walk-forward):\n', best)
    print('BEST BY IS with n>=5:\n', df[df.n >= 5].sort_values('IS_try', ascending=False).iloc[0])
    print('rules with WF OOS TRY >=5.3%:', (df.WF_OOS_try >= 0.053).sum(), ' >=10%:', (df.WF_OOS_try >= 0.10).sum(),
          ' median WF OOS TRY', round(df.WF_OOS_try.median(), 4), ' max', round(df.WF_OOS_try.max(), 4))
    last = R.apply(lambda c: c.last_valid_index())
    print('universe users whose history stops before 2026-09:', (last < pd.Period('2026-09', 'M')).sum())
    # benchmark: equal weight of all eligible (>=24m pre-OOS, active 2025-09) users, no selection
    elig = R.columns[(R.loc[:'2025-09'].iloc[-24:].notna().all())]
    ew = R.loc[OOS, elig].fillna(0).mean(axis=1) - SLIP_M
    print('EW all eligible', len(elig), stats(ew, OOS))
    med = R.loc[OOS, elig].fillna(0)
    print('median user OOS geo usd', (((1 + med).prod()) ** (1 / 12) - 1).median())
    print('share users OOS geo usd >= 10%/m', ((((1 + med).prod()) ** (1 / 12) - 1) >= 0.10).mean(),
          '>=5.3%', ((((1 + med).prod()) ** (1 / 12) - 1) >= 0.053).mean())
