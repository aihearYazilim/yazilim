"""Run the LP parameter grid on every fetched pool. Saves daily equity (USD) per config + decomposition.
python3 run_grid.py [pool ...]
"""
import sys, os, json, itertools, glob
import numpy as np, pandas as pd
from load import load_pool, binance_1h, funding, HERE
import sim

START = pd.Timestamp('2022-01-01', tz='UTC')
WIDTHS = [1.01, 1.02, 1.03, 1.05, 1.10, 1.20, 1.50]
RULES = [0, 1, 2, 3]          # 0 monthly reset only, 1 recenter on exit, 2 recenter after 24h out, 3 exit or monthly
HEDGES = [0, 1]
SWAP_COST = 0.0015            # protocol spot cost per swapped notional (DEX fee+slippage+MEV; conservative)
PERP_COST = 0.0010            # protocol futures cost per traded notional
HEDGE_THR = 0.05              # re-hedge when delta drift > 5% of LP value
MFRAC = 0.25                  # share of capital kept as perp margin when hedged
CAPITAL = 100_000.0
DCOLS = ['fees', 'market', 'il', 'perp', 'funding', 'swapgas', 'perpcost']
GAS_UNITS = 450_000           # remove+collect+swap+mint on mainnet
CHAIN_GAS_USD = {'arb': 0.25, 'base': 0.10, 'bsc': 0.30}


def hourly_funding(sym, idx):
    b = funding(sym)
    hl = pd.read_csv(f'/home/user/yazilim/research/carry/data/hl/{sym}.csv')
    hl['t'] = pd.to_datetime(hl['ts'] // 1000 * 1000, unit='ms', utc=True).dt.floor('h')
    hl = hl.groupby('t')['rate'].sum()
    s = b.reindex(idx).fillna(0.0)
    after = idx > b.index.max()
    s[after] = hl.reindex(idx[after]).fillna(0.0).values
    return s.values


def gas_series(meta, df):
    ch = meta['chain']
    if ch != 'eth':
        return np.full(len(df), CHAIN_GAS_USD[ch])
    g = pd.read_csv(f'{HERE}/raw/eth_gas_daily.csv', parse_dates=['date']).set_index('date')['gwei']
    g.index = g.index.tz_localize('UTC') if g.index.tz is None else g.index
    gw = g.reindex(df.index.floor('D')).ffill().bfill().values + 1.0  # + priority fee
    eth = binance_1h('ETH')['close'].reindex(df.index, method='ffill').values
    return GAS_UNITS * gw * 1e-9 * eth


def prep(key):
    df, meta = load_pool(key)
    df = df[df.index >= START]
    # intrahour range of the pool price, from pool endpoints + Binance high/low for USD pairs
    pprev = np.r_[df['p'].values[0], df['p'].values[:-1]]
    lo = np.minimum(pprev, df['p'].values); hi = np.maximum(pprev, df['p'].values)
    risky = meta['risky']
    if len(risky) == 1:
        side, sym = risky[0]
        b = binance_1h(sym).reindex(df.index - pd.Timedelta(hours=1))  # candle covering (t-1h, t]
        H, Lw, C = b['high'].values, b['low'].values, b['close'].values
        ok = np.isfinite(H) & np.isfinite(C)
        p = df['p'].values
        if side == 0:  # p proportional to risky USD price
            bh, bl = p * H / C, p * Lw / C
        else:
            bh, bl = p * C / Lw, p * C / H
        hi = np.where(ok, np.maximum(hi, bh), hi); lo = np.where(ok, np.minimum(lo, bl), lo)
    f0 = np.zeros(len(df)); f1 = np.zeros(len(df)); r0 = r1 = False
    for side, sym in risky:
        if side == 0: f0 = hourly_funding(sym, df.index); r0 = True
        else: f1 = hourly_funding(sym, df.index); r1 = True
    idx = df.index
    newmonth = np.r_[False, (idx[1:].month != idx[:-1].month)]
    gas = gas_series(meta, df)
    return df, meta, dict(lo=lo, hi=hi, f0=f0, f1=f1, r0=r0, r1=r1, newmonth=newmonth, gas=gas)


def run_pool(key, swap_cost=SWAP_COST, perp_cost=PERP_COST, tag=''):
    df, meta, x = prep(key)
    # start once pool has meaningful liquidity
    start = int(np.argmax(df['liq'].values > 0))
    eqs = {}; decs = {}
    for k, rule, hedge in itertools.product(WIDTHS, RULES, HEDGES):
        eq, dec = sim.run(df['p'].values, x['lo'], x['hi'], df['d0'].values, df['d1'].values, df['liq'].values,
                          df['u0'].values, df['u1'].values, x['gas'], x['f0'], x['f1'], x['newmonth'], start,
                          k, rule, hedge, x['r0'], x['r1'], swap_cost, perp_cost, HEDGE_THR, MFRAC, CAPITAL, 24)
        name = f'{key}|k{k}|r{rule}|h{hedge}'
        eqs[name] = eq
        decs[name] = pd.DataFrame(dec, index=df.index, columns=DCOLS).resample('1D').last()
    E = pd.DataFrame(eqs, index=df.index)
    E = E.resample('1D').last()
    os.makedirs(f'{HERE}/out', exist_ok=True)
    E.to_pickle(f'{HERE}/out/eq_{key}{tag}.pkl')
    D = pd.concat(decs, axis=1)
    D.to_pickle(f'{HERE}/out/dec_{key}{tag}.pkl')
    return E, D


if __name__ == '__main__':
    keys = sys.argv[1:] or [os.path.basename(f)[6:-4] for f in glob.glob(f'{HERE}/raw/chain_*.csv')]
    for k in keys:
        E, D = run_pool(k)
        print(k, E.shape)
