"""Load hourly pool state + market data into aligned numpy arrays."""
import json, os
import numpy as np, pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = '/home/user/yazilim/data'
Q128 = 2**128
STABLE = {'0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
          '0xaf88d065e77c8cc2239327c5edb3a432268e5831', '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          '0x55d398326f99059ff775485246999027b3197955', '0xdac17f958d2ee523a2206206994597c13d831ec7'}
SYM = {'0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'ETH', '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': 'ETH',
       '0x4200000000000000000000000000000000000006': 'ETH', '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'BTC',
       '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f': 'BTC', '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': 'BNB'}
GAS = {'eth': 'eth', 'arb': 0.25, 'base': 0.10, 'bsc': 0.30}  # USD per rebalance on L2s (remove+swap+mint)


def binance_1h(sym):
    df = pd.read_csv(f'{DATA}/crypto_1h/{sym}.csv', parse_dates=['time'])
    df['time'] = df['time'].dt.tz_localize('UTC')
    return df.set_index('time')


def funding(sym):
    """Binance USDT-M funding (8h) -> hourly rate series (rate per hour, attributed to the hour ending at ts)."""
    f = pd.read_csv(f'/home/user/yazilim/research/carry/data/funding/{sym}USDT.csv')
    f['t'] = pd.to_datetime(f['ts'] // 1000 * 1000, unit='ms', utc=True).dt.floor('h')
    s = f.groupby('t')['rate'].sum()
    return s


def usdtry():
    u = pd.read_csv(f'{DATA}/bist/USDTRY.csv', index_col=0, parse_dates=True)['close']
    u.index = pd.to_datetime(u.index).tz_localize('UTC')
    return u


def load_pool(key):
    meta = json.load(open(f'{HERE}/raw/meta_{key}.json'))
    df = pd.read_csv(f'{HERE}/raw/chain_{key}.csv', dtype={'sqrtP': str, 'liq': str, 'fg0': str, 'fg1': str})
    df = df.drop_duplicates('ts').sort_values('ts').reset_index(drop=True)
    sq = np.array([int(x) for x in df['sqrtP']], dtype=object)
    p = np.array([float((s * s) / (2**192)) for s in sq])  # raw token1 per raw token0
    # fee growth deltas (mod 2^256), per unit raw L, in raw token units
    fg0 = [int(x) for x in df['fg0']]; fg1 = [int(x) for x in df['fg1']]
    d0 = np.zeros(len(df)); d1 = np.zeros(len(df))
    for i in range(1, len(df)):
        d0[i] = ((fg0[i] - fg0[i-1]) % 2**256) / Q128
        d1[i] = ((fg1[i] - fg1[i-1]) % 2**256) / Q128
    liq = np.array([float(x) for x in df['liq']])
    t = pd.to_datetime(df['ts'], unit='s', utc=True)
    out = pd.DataFrame({'p': p, 'd0': d0, 'd1': d1, 'liq': liq, 'block': df['block'].values}, index=t)
    # gaps: fee deltas spanning >1h are kept (accrued over the gap) -> fine for fees, flag
    t0, t1 = meta['token0'], meta['token1']
    # USD value of one raw unit of token0/token1
    if t1 in STABLE:
        u1 = np.full(len(out), 10.0 ** -meta['dec1']); u0 = out['p'].values * u1
        risky = [(0, SYM[t0])]
    elif t0 in STABLE:
        u0 = np.full(len(out), 10.0 ** -meta['dec0']); u1 = u0 / out['p'].values
        risky = [(1, SYM[t1])]
    else:  # both risky: token1 priced from Binance hourly close
        s1 = SYM[t1]; b = binance_1h(s1)['close'].reindex(out.index, method='ffill')
        u1 = b.values * 10.0 ** -meta['dec1']; u0 = out['p'].values * u1
        risky = [(0, SYM[t0]), (1, s1)]
    out['u0'] = u0; out['u1'] = u1
    # in-range helper: hourly high/low of the pool price proxied by Binance (USD pairs only)
    meta['risky'] = risky
    return out, meta
