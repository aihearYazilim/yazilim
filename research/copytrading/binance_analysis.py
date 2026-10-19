"""Binance Futures copy trading: walk-forward lead selection INSIDE the OOS window.

Data limitation: Binance only exposes the last 365 days of daily cumulative ROI (window starts 2025-10-20),
and only for leads that are still listed today (survivors; leads closed during the year are missing).
So a pre-2025-10-17 point-in-time ranking is NOT possible. What we can do protocol-compliantly:
  every 30 days, rank leads using only the trailing L days (inside the window) and copy top-N for the next 30 days.
The first selection happens at 2025-10-20 + L, so the evaluated period is shorter than 12 months.
Copier costs: profit share (lead's actual rate, default 10%) on positive gains per 30d period (HWM-like per period),
              copy slippage drag per day (scenarios), switching cost 0.1% per unit turnover.
Returns are converted to TRY with USDTRY.
"""
import json, itertools, numpy as np, pandas as pd, sys

RAW = '/home/user/yazilim/raw/copytrading'
FX = pd.read_csv('/home/user/yazilim/data/bist/USDTRY.csv', index_col=0, parse_dates=True)['close']
OOS_END = pd.Timestamp('2026-10-16')


def load():
    cum = {}
    for l in open(f'{RAW}/binance_roi.jsonl'):
        x = json.loads(l)
        if not x['roi']:
            continue
        s = pd.Series({pd.Timestamp(t, unit='ms').normalize(): v for t, v in x['roi']})
        s = s[~s.index.duplicated(keep='last')].sort_index()
        cum[x['pid']] = s
    C = pd.DataFrame(cum).sort_index()
    C = C.loc[:OOS_END]
    # daily return from cumulative ROI (%): before the lead's first non-zero ROI it is NaN (not yet live)
    W = 1 + C / 100
    R = W / W.shift(1) - 1
    first_nz = (C != 0).idxmax()
    for c in R.columns:
        f = first_nz[c]
        if (C[c] != 0).any():
            R.loc[:f - pd.Timedelta(days=1), c] = np.nan
            R.loc[f - pd.Timedelta(days=1), c] = 0.0 if f > C.index[0] else np.nan
        else:
            R[c] = np.nan
    R = R.clip(lower=-1.0)
    # once wiped out (cum ROI <= -100) further returns are meaningless -> 0 (stays at zero)
    dead = (W <= 0.0001).cummax()
    R[dead.shift(1).fillna(False).astype(bool)] = 0.0
    return C, R


def details():
    d = {}
    try:
        for l in open(f'{RAW}/binance_detail.jsonl'):
            x = json.loads(l)
            d[x['pid']] = x['detail']
    except FileNotFoundError:
        pass
    return d


def scores(R, t, L, kind):
    win = R.loc[:t].iloc[-L:]
    ok = win.notna().all()
    w = win.loc[:, ok]
    eq = (1 + w).cumprod()
    ret = eq.iloc[-1] - 1
    mdd = (1 - eq / eq.cummax()).max()
    if kind == 'roi':
        sc = ret
    elif kind == 'sharpe':
        sc = w.mean() / w.std().clip(lower=1e-4)
    elif kind == 'calmar':
        sc = ret / mdd.clip(lower=0.02)
    return sc, mdd


def run(R, det, L, kind, ddcap, n, slip_day, start_offset=0, hold=30):
    dates = R.index
    i0 = L + start_offset
    out, prev = [], set()
    while i0 + 1 < len(dates):
        t = dates[i0]
        sc, mdd = scores(R, t, L, kind)
        if ddcap is not None:
            sc = sc[mdd <= ddcap]
        picks = list(sc.sort_values(ascending=False).index[:n])
        seg = R.iloc[i0 + 1:i0 + 1 + hold][picks].fillna(0.0)
        if len(seg) == 0:
            break
        per = []
        for p in picks:
            g = (1 + seg[p]).prod() - 1
            ps = float(det.get(p, {}).get('profitSharingRate') or 10) / 100
            g_net = g - ps * max(g, 0)
            g_net = (1 + g_net) * (1 - slip_day) ** len(seg) - 1
            per.append(max(g_net, -1))
        turn = len(set(picks) ^ prev) / max(len(picks), 1) if prev else 1.0
        r = np.mean(per) - 0.001 * turn if per else 0.0
        out.append((seg.index[0], seg.index[-1], r))
        prev = set(picks)
        i0 += hold
    return pd.DataFrame(out, columns=['start', 'end', 'r_usd'])


def to_try(df):
    fx0 = FX.asof(df['start'] - pd.Timedelta(days=1)).values if len(df) else []
    fx1 = FX.asof(df['end']).values if len(df) else []
    df = df.copy()
    df['r_try'] = (1 + df['r_usd']) * (np.array(fx1) / np.array(fx0)) - 1
    return df


def summ(df):
    days = (df['end'].iloc[-1] - df['start'].iloc[0]).days + 1
    eq = (1 + df['r_try']).cumprod()
    eq_u = (1 + df['r_usd']).cumprod()
    m = 30.44 / days
    return dict(n_per=len(df), days=days, geo_m_try=eq.iloc[-1] ** m - 1 if eq.iloc[-1] > 0 else -1,
                geo_m_usd=eq_u.iloc[-1] ** m - 1 if eq_u.iloc[-1] > 0 else -1,
                mdd_per=(eq / eq.cummax() - 1).min(), worst=df['r_try'].min(), best=df['r_try'].max())


if __name__ == '__main__':
    C, R = load()
    det = details()
    print('leads with data', R.shape[1], 'live at window start', R.iloc[1].notna().sum(), 'days', len(R))
    grid = list(itertools.product([30, 60, 90], ['roi', 'sharpe', 'calmar'], [None, 0.3], [1, 3, 5, 10, 20]))
    res = []
    for L, kind, ddc, n in grid:
        for slip in [0.0, 0.0005, 0.0015]:
            df = to_try(run(R, det, L, kind, ddc, n, slip))
            s = summ(df)
            res.append(dict(L=L, kind=kind, ddcap=ddc, n=n, slip_day=slip, **s))
    out = pd.DataFrame(res)
    out.to_csv(f'{RAW}/binance_grid.csv', index=False)
    pd.set_option('display.width', 250)
    o = out.copy()
    for c in ['geo_m_try', 'geo_m_usd', 'mdd_per', 'worst', 'best']:
        o[c] = (o[c] * 100).round(2)
    print(o[o.slip_day == 0.0005].to_string())
    print('combos (rules x slip scenarios)', len(out), 'rules', len(grid))
    for s in [0.0, 0.0005, 0.0015]:
        x = out[out.slip_day == s]
        print(f'slip {s}: median rule geo_m_try {x.geo_m_try.median()*100:.2f}%, best {x.geo_m_try.max()*100:.2f}%,'
              f' share>=10% {(x.geo_m_try>=0.10).mean():.2f}, share>=5.3% {(x.geo_m_try>=0.053).mean():.2f}')
