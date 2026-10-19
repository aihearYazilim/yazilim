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
    idx = pd.date_range('2025-10-19', OOS_END, freq='D')
    rets, closed_early = {}, []
    for pid, s in cum.items():
        s = s.loc[:OOS_END]
        if s.index[0] < pd.Timestamp('2025-10-19'):
            closed_early.append(pid)          # chart window ends before today -> inactive/closed lead
            s = s.loc['2025-10-19':]
            if len(s) < 2:
                continue
            w = 1 + s / 100
            r = (w / w.shift(1) - 1).iloc[1:]
        else:
            nz = s[s != 0]
            if nz.empty:
                continue
            f = nz.index[0]
            # day before first non-zero ROI = base 0 (for leads live at window start the chart is rebased to 0)
            base = pd.Series([0.0], index=[f - pd.Timedelta(days=1)])
            s2 = pd.concat([base, s.loc[f:]])
            w = 1 + s2 / 100
            r = (w / w.shift(1) - 1).iloc[1:]
            # once cumulative ROI <= -100% the account is wiped: later values meaningless
            dead = (w.iloc[1:] <= 1e-4).cummax().shift(1, fill_value=False)
            r[dead] = 0.0
        rets[pid] = r.clip(lower=-1.0).replace([np.inf, -np.inf], np.nan)
    R = pd.DataFrame(rets).reindex(idx)
    R = R.loc['2025-10-20':]
    R = R.loc[:, R.notna().any()]
    C = closed_early
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


def implied_capital(R):
    """Point-in-time size proxy: lead capital base ~ cumulative PNL / cumulative ROI (both from the 365D charts).
    Only available for leads with details (live before 2026-08); others -> NaN (fail any size filter)."""
    P = {}
    for l in open(f'{RAW}/binance_detail.jsonl'):
        x = json.loads(l)
        if x['pnl']:
            s = pd.Series({pd.Timestamp(t, unit='ms').normalize(): v for t, v in x['pnl']})
            P[x['pid']] = s[~s.index.duplicated(keep='last')]
    P = pd.DataFrame(P).reindex(R.index)
    cumroi = (1 + R.fillna(0)).cumprod() - 1
    cumroi = cumroi.reindex(columns=P.columns)
    K = P / cumroi.where(cumroi.abs() > 0.02)
    K = K.where(K > 0)
    return K.reindex(columns=R.columns)


KCAP = None


def scores(R, t, L, kind):
    win = R.loc[:t].iloc[-L:]
    ok = win.notna().all()
    if KCAP is not None:
        k = KMED.loc[t]
        ok = ok & (k >= KCAP).reindex(ok.index).fillna(False)
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


def run(R, det, L, kind, ddcap, n, slip_day, start_offset=0, hold=30, cap=None):
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
        if cap is not None:
            seg = seg.clip(upper=cap)
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
                mdd_per=(eq / eq.cummax().clip(lower=1.0) - 1).min(), worst=df['r_try'].min(), best=df['r_try'].max())


if __name__ == '__main__':
    C, R = load()
    det = details()
    print('leads with data', R.shape[1], 'live at window start', R.iloc[1].notna().sum(), 'days', len(R))
    K = implied_capital(R)
    KMED = K.rolling(30, min_periods=5).median()
    kc = float(sys.argv[1]) if len(sys.argv) > 1 else None
    KCAP = kc
    tag = '' if kc is None else f'_k{int(kc)}'
    grid = list(itertools.product([30, 60, 90], ['roi', 'sharpe', 'calmar'], [None, 0.3], [1, 3, 5, 10, 20]))
    res = []
    for L, kind, ddc, n in grid:
        for slip, cap in [(0.0, None), (0.0005, None), (0.0015, None), (0.0005, 0.3)]:
            df = to_try(run(R, det, L, kind, ddc, n, slip, cap=cap))
            s = summ(df)
            res.append(dict(L=L, kind=kind, ddcap=ddc, n=n, slip_day=slip, cap=cap, **s))
    out = pd.DataFrame(res)
    out.to_csv(f'{RAW}/binance_grid{tag}.csv', index=False)
    pd.set_option('display.width', 250)
    o = out.copy()
    for c in ['geo_m_try', 'geo_m_usd', 'mdd_per', 'worst', 'best']:
        o[c] = (o[c] * 100).round(2)
    print(o[(o.slip_day == 0.0005) & o.cap.isna()].to_string())
    print(o[(o.slip_day == 0.0005) & o.cap.notna()].to_string())
    # benchmark: equal weight of ALL leads live at each selection date (no ranking), same costs
    df = to_try(run(R, det, 30, 'roi', None, 100000, 0.0005)); print('EW all live leads', summ(df))
    df = to_try(run(R, det, 30, 'roi', None, 100000, 0.0005, cap=0.3)); print('EW all live leads cap', summ(df))
    print('combos (rules x slip scenarios)', len(out), 'rules', len(grid))
    for s, cp in [(0.0, None), (0.0005, None), (0.0015, None), (0.0005, 0.3)]:
        x = out[(out.slip_day == s) & ((out.cap == cp) if cp else out.cap.isna())]
        print(f'slip {s}: median rule geo_m_try {x.geo_m_try.median()*100:.2f}%, best {x.geo_m_try.max()*100:.2f}%,'
              f' share>=10% {(x.geo_m_try>=0.10).mean():.2f}, share>=5.3% {(x.geo_m_try>=0.053).mean():.2f}')
