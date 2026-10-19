"""Daily mainnet base fee (gwei) at 12:00 UTC, from block headers (archive RPC)."""
import numpy as np, pandas as pd, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from fetch_chain import rpc_batch
z = np.load('raw/blocks_eth.npz'); bs, ts = z['bs'], z['ts']
days = pd.date_range('2022-01-01 12:00', '2026-10-16 12:00', freq='1D', tz='UTC')
blk = np.interp([d.timestamp() for d in days], ts, bs).astype(int)
# sample 24 blocks per day spread (every hour) for a daily mean
hours = pd.date_range('2022-01-01', '2026-10-17', freq='1h', tz='UTC', inclusive='left')
hb = np.interp([h.timestamp() for h in hours], ts, bs).astype(int)
res = rpc_batch('eth', [('eth_getBlockByNumber', [hex(int(b)), False]) for b in hb])
g = [int(r['baseFeePerGas'], 16) / 1e9 for r in res]
s = pd.Series(g, index=hours).resample('1D').mean()
pd.DataFrame({'date': s.index.tz_localize(None).date, 'gwei': s.values}).to_csv('raw/eth_gas_daily.csv', index=False)
print(s.describe()); print(s.resample('QE').mean())
