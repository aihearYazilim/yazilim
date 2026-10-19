"""Portfolio simulation of the fixed rule:
  Hold BNB in Simple Earn (auto-eligible for Launchpool / HODLer / Megadrop), sell every reward at the
  sale rule price, costs 0.15% fee + 0.35% slippage on reward sales (0.5% total).
  Variant U (unhedged): proceeds re-bought into BNB (0.15% fee).
  Variant H (hedged): capital C; BNB spot notional N = C/1.5, short BNB-USDT perp N with 0.5N USDT margin (2x);
     short PnL offsets BNB price; actual Binance funding (data.binance.vision); perp fee 0.10%, spot 0.15% at
     setup and on monthly rebalance; rewards accrue in USDT. Stress: funding cost fixed 10%/yr.
IS = 2023-01-01..2025-10-16, OOS = 2025-10-17..2026-10-16. Nothing is fitted; the sale rule (first-hour close)
was chosen a priori; neighbours (H1VW, D1, D7) reported.
"""
import json, glob, numpy as np, pandas as pd
D = '/home/user/yazilim/research/airdrop/'
ev = pd.read_csv(D + 'events.csv', parse_dates=['sale_t'])
ev = ev[ev.sale_t.notna()]
b = json.load(open(D + 'raw/klines/BNBUSDT_1d.json'))
bnb = pd.Series({pd.Timestamp(k[0], unit='ms'): float(k[4]) for k in b})
fr = pd.concat([pd.read_csv(f) for f in sorted(glob.glob(D + 'raw/funding/*.csv'))])
fr['t'] = pd.to_datetime(fr.calc_time, unit='ms')
fd = fr.set_index('t').last_funding_rate.astype(float).groupby(lambda t: t.floor('D')).sum()
days = pd.date_range('2023-01-01', '2026-10-16', freq='D')
fd = fd.reindex(days)
fd[fd.index > fd.last_valid_index()] = fd['2026-09-01':'2026-09-30'].mean()
fd = fd.fillna(0)
bnb = bnb.reindex(days).ffill()
COST_SALE = 0.0015 + 0.0035

def run(col='yld_h1', mode='U', stress_funding=None, types=None, denom_mult=1.0):
    e = ev.copy()
    if types: e = e[e.type.isin(types)]
    e['day'] = e.sale_t.dt.floor('D')
    y = (e.groupby('day')[col].sum() / denom_mult).reindex(days).fillna(0) * (1 - COST_SALE)
    nav = []
    if mode == 'U':
        q = 1.0 / bnb.iloc[0] * (1 - 0.0015)  # BNB qty for 1 USD
        for d in days:
            q += q * y[d] * (1 - 0.0015)          # reward value as BNB fraction, rebuy BNB
            nav.append(q * bnb[d])
    else:  # hedged
        C = 1.0 - 0.0025 / 1.5  # setup fees on N
        N = C / 1.5; last_px = bnb.iloc[0]; month = days[0].month
        for d in days:
            # spot and short cancel; earn funding on short: +rate*N ; stress: -10%/yr
            f = (fd[d] if stress_funding is None else -stress_funding / 365)
            C += f * N
            C += N * y[d]   # rewards on spot BNB (y is fraction of BNB value)
            if d.month != month:  # monthly rebalance N -> C/1.5
                month = d.month; newN = C / 1.5
                C -= abs(newN - N) * 0.0025; N = newN
            nav.append(C)
    return pd.Series(nav, index=days)

def stats(nav, a, b_):
    s = nav[a:b_]; s = s / s.iloc[0]
    n_m = (s.index[-1] - s.index[0]).days / 30.4375
    geo = s.iloc[-1] ** (1 / n_m) - 1
    dd = (s / s.cummax() - 1).min()
    # months anchored at OOS anchor day (17th)
    anchors = pd.date_range(s.index[0], s.index[-1], freq=pd.DateOffset(months=1))
    m = s.reindex(anchors, method='ffill').pct_change().dropna()
    return geo, dd, m.min() if len(m) else np.nan

if __name__ == '__main__':
    IS = ('2023-01-01', '2025-10-16'); OOS = ('2025-10-17', '2026-10-16')
    rows = []
    for col in ['yld_h1', 'yld_h1vw', 'yld_d1', 'yld_d7']:
        for mode in ['U', 'H']:
            nav = run(col, mode)
            gi, di, wi = stats(nav, *IS); go, do, wo = stats(nav, *OOS)
            rows.append([col, mode, gi, go, di, do, wo])
        nav = run(col, 'H', stress_funding=0.10)
        gi, di, wi = stats(nav, *IS); go, do, wo = stats(nav, *OOS)
        rows.append([col, 'H_fund-10%', gi, go, di, do, wo])
    # BNB buy & hold reference
    nb = bnb / bnb.iloc[0]
    gi, di, _ = stats(nb, *IS); go, do, wo = stats(nb, *OOS)
    rows.append(['-', 'BNB hold', gi, go, di, do, wo])
    # denominator sensitivity (HODLer pool could be ~25% larger than Launchpool BNB pool)
    nav = run('yld_h1', 'H', denom_mult=1.25); gi, di, _ = stats(nav, *IS); go, do, wo = stats(nav, *OOS)
    rows.append(['yld_h1', 'H den x1.25', gi, go, di, do, wo])
    out = pd.DataFrame(rows, columns=['sale', 'variant', 'IS_mgeo', 'OOS_mgeo', 'IS_maxDD', 'OOS_maxDD', 'OOS_worst_m'])
    pd.set_option('display.width', 200)
    print(out.to_string(float_format=lambda x: f'{x*100:7.2f}%'))
    out.to_csv(D + 'results.csv', index=False)
    # gross airdrop yield (fraction of BNB value) per year and per period
    ev['yr'] = ev.sale_t.dt.year
    print('\nGross reward yield on BNB value (sum of per-event yields, first-hour close), by year and type:')
    print((ev.pivot_table(index='yr', columns='type', values='yld_h1', aggfunc='sum') * 100).round(2))
    print((ev.pivot_table(index='yr', columns='type', values='yld_h1', aggfunc='count')))
    for nm, (a, b_) in {'IS': IS, 'OOS': OOS}.items():
        e = ev[(ev.sale_t >= a) & (ev.sale_t <= pd.Timestamp(b_) + pd.Timedelta(days=1))]
        yrs = (pd.Timestamp(b_) - pd.Timestamp(a)).days / 365.25
        print(f'{nm}: events={len(e)}  sum yld_h1={e.yld_h1.sum()*100:.2f}%  annualised={e.yld_h1.sum()/yrs*100:.2f}%/yr '
              f' monthly~{((1+e.yld_h1.sum())**(1/(12*yrs))-1)*100:.3f}%  USD per BNB={e.usd_per_bnb_h1.sum():.2f}')
    # funding by period
    for nm, (a, b_) in {'IS': IS, 'OOS': OOS}.items():
        print(nm, 'short-perp funding received, annualised: %.2f%%' % (fd[a:b_].sum() / ((pd.Timestamp(b_) - pd.Timestamp(a)).days / 365.25) * 100))
