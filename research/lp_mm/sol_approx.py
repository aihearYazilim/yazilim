"""Approximate concentrated-LP simulation for pools without on-chain fee-growth history
(Orca / Raydium SOL-USDC, Aerodrome WETH-USDC): pool-level fee yield (DefiLlama apyBase = fees/TVL)
x concentration multiplier mult(k) calibrated IS-only on Uniswap pools where both are known.
Price path = Binance hourly; hedge = SOLUSDT/ETHUSDT perp funding.
"""
import json, itertools, os, sys
import numpy as np, pandas as pd
import sim
from load import binance_1h, HERE
from run_grid import hourly_funding, WIDTHS, RULES, HEDGES, SWAP_COST, PERP_COST, HEDGE_THR, MFRAC, CAPITAL, DCOLS, prep

CAL_END = pd.Timestamp('2025-10-17', tz='UTC')


def llama(key, col='apyBase'):
    d = pd.DataFrame(json.load(open(f'{HERE}/raw/llama_{key}.json'))['data'])
    d['t'] = pd.to_datetime(d['timestamp']).dt.tz_convert('UTC') if pd.to_datetime(d['timestamp']).dt.tz is not None \
        else pd.to_datetime(d['timestamp']).dt.tz_localize('UTC')
    d['t'] = d['t'].dt.floor('D')
    if col not in d: d[col] = 0.0
    d['apyBase'] = pd.to_numeric(d[col], errors='coerce')
    return d.groupby('t')[['apyBase', 'tvlUsd']].last()


def vcenter(p, k):
    return 2 * np.sqrt(p) * (1 - 1 / np.sqrt(k))  # value (numeraire units) per unit L at range centre


def calibrate(pairs=(('eth_usdc_weth_005', 'uni_eth_usdc_weth_005'), ('arb_weth_usdce_005', 'uni_arb_weth_usdc_005'),
                     ('base_weth_usdc_03', 'uni_base_weth_usdc_03'))):
    """mult(k) = fee rate per $ of an always-centred position / pool-level fee yield, IS only."""
    res = {}
    for ck, lk in pairs:
        if not os.path.exists(f'{HERE}/raw/chain_{ck}.csv'): continue
        df, meta, x = prep(ck)
        side = meta['risky'][0][0]
        # fee per unit L in USD, then per $ of centred position. Value per L in USD: vcenter(p_raw,k)*u1
        feeL = df['d0'] * df['u0'] + df['d1'] * df['u1']
        lam = llama(lk)['apyBase'] / 100 / 8760
        lam_h = lam.reindex(df.index.floor('D')).values
        m = (df.index < CAL_END) & np.isfinite(lam_h) & (lam_h > 0)
        for k in WIDTHS:
            v = vcenter(df['p'].values, k) * df['u1'].values
            r = feeL.values / v
            res.setdefault(k, []).append(r[m].sum() / lam_h[m].sum())
    return {k: float(np.median(v)) for k, v in res.items()}, res


def run_synth(name, lkey, sym, mult, start='2022-01-01', gas_usd=0.02, col='apyBase'):
    lam = llama(lkey, col)
    b = binance_1h(sym)
    b = b[b.index >= max(pd.Timestamp(start, tz='UTC'), lam.index[0])]
    idx = b.index
    p = b['close'].values.astype(float)
    hi = np.maximum(b['high'].values, np.r_[p[0], p[:-1]]); lo = np.minimum(b['low'].values, np.r_[p[0], p[:-1]])
    lam_h = (lam['apyBase'].fillna(0) / 100 / 8760).reindex(idx.floor('D')).ffill().fillna(0).values
    f0 = hourly_funding(sym, idx); f1 = np.zeros(len(idx))
    u0 = p.copy(); u1 = np.ones(len(idx))  # token0 = risky priced in USD, token1 = USD; raw p = USD per risky
    newmonth = np.r_[False, (idx[1:].month != idx[:-1].month)]
    gas = np.full(len(idx), gas_usd)
    liq = np.full(len(idx), 1e30)
    eqs, decs = {}, {}
    for k, rule, hedge in itertools.product(WIDTHS, RULES, HEDGES):
        d1 = lam_h * mult[k] * vcenter(p, k)
        eq, dec = sim.run(p, lo, hi, np.zeros(len(idx)), d1, liq, u0, u1, gas, f0, f1, newmonth, 0,
                          k, rule, hedge, True, False, SWAP_COST, PERP_COST, HEDGE_THR, MFRAC, CAPITAL, 24)
        c = f'{name}|k{k}|r{rule}|h{hedge}'
        eqs[c] = eq; decs[c] = pd.DataFrame(dec, index=idx, columns=DCOLS).resample('1D').last()
    E = pd.DataFrame(eqs, index=idx).resample('1D').last()
    E.to_pickle(f'{HERE}/out/eq_{name}.pkl')
    pd.concat(decs, axis=1).to_pickle(f'{HERE}/out/dec_{name}.pkl')
    return E


if __name__ == '__main__':
    mult, raw = calibrate()
    print('mult', mult, raw)
    json.dump({'mult': mult, 'raw': {str(k): v for k, v in raw.items()}}, open(f'{HERE}/out/mult.json', 'w'))
    run_synth('SYN_orca_sol_usdc', 'orca_sol_usdc', 'SOL', mult)
    run_synth('SYN_ray_sol_usdc_clmm', 'ray_sol_usdc_clmm', 'SOL', mult)
    run_synth('SYN_aero_weth_usdc_cl100', 'aero_weth_usdc_cl100', 'ETH', mult, gas_usd=0.10)
    run_synth('SYN_aero_weth_usdc_cl100_staked', 'aero_weth_usdc_cl100', 'ETH', mult, gas_usd=0.10, col='apyReward')
    print('done')
