"""Fetch hourly on-chain state of Uniswap-v3-style pools via public archive RPCs.
For each hour t (UTC, on the hour): block number, sqrtPriceX96, tick, active liquidity,
feeGrowthGlobal0X128, feeGrowthGlobal1X128.  feeGrowthGlobal = cumulative LP fees per unit of
in-range liquidity (protocol fee already removed) -> exact fee income per unit L, incl. JIT dilution.
Usage: python3 fetch_chain.py <pool_key>
Output raw/chain_<key>.csv
"""
import json, sys, time, os, itertools, bisect
import requests
import numpy as np, pandas as pd

# (url, max batch, min seconds between requests)
RPC = {
 'eth': [('https://rpc.mevblocker.io', 100, 0.2), ('https://eth-mainnet.public.blastapi.io', 100, 0.2)],
 'arb': [('https://arbitrum-one.public.blastapi.io', 100, 0.2), ('https://arb-pokt.nodies.app', 10, 0.3)],
 'base': [('https://mainnet.base.org', 20, 1.05), ('https://base-pokt.nodies.app', 10, 0.5),
          ('https://base.drpc.org', 3, 0.3), ('https://base.meowrpc.com', 3, 0.3), ('https://gateway.tenderly.co/public/base', 3, 0.5)],
 'bsc': [('https://bsc-mainnet.public.blastapi.io', 100, 0.2)],
}
POOLS = {
 'eth_usdc_weth_005': ('eth', '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640'),
 'eth_usdc_weth_03':  ('eth', '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8'),
 'eth_wbtc_weth_005': ('eth', '0x4585FE77225b41b697C938B018E2Ac67Ac5a20c0'),
 'eth_wbtc_weth_03':  ('eth', '0xCBCdF9626bC03E24f779434178A73a0B4bad62eD'),
 'eth_weth_usdt_03':  ('eth', '0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36'),
 'arb_weth_usdc_005': ('arb', '0xC6962004f452bE9203591991D15f6b388e09E8D0'),
 'arb_weth_usdce_005':('arb', '0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443'),
 'arb_wbtc_weth_005': ('arb', '0x2f5e87C9312fa29aed5c179E456625D79015299c'),
 'base_weth_usdc_005':('base','0xd0b53D9277642d899DF5C87A3966A349A798F224'),
 'base_weth_usdc_03': ('base','0x6c561B446416E1A00E8E93E221854d6eA4171372'),
 'bsc_pcs_usdt_wbnb_005': ('bsc','0x36696169C63e42cd08ce11f5deeBbCeBae652050'),
}
START = pd.Timestamp('2022-01-01', tz='UTC')
END = pd.Timestamp('2026-10-17', tz='UTC')
S = requests.Session()
_rr = {}

import threading, queue

def _post(ep, body):
    r = S.post(ep, json=body, timeout=60)
    js = r.json()
    if isinstance(js, dict):
        raise RuntimeError(str(js)[:200])
    bad = [x for x in js if 'error' in x and 'execution reverted' not in str(x['error'])]
    if bad:
        raise RuntimeError(str(bad[0]['error'])[:200])
    return js

def rpc_batch(chain, calls, bmax=None):
    """Parallel over endpoints; each endpoint thread takes chunks of its own batch size."""
    out = [None]*len(calls)
    pending = queue.Queue()
    for i in range(len(calls)):
        pending.put(i)
    fails = {}
    def worker(ep, bm, gap):
        sess = requests.Session(); err = 0
        while True:
            idx = []
            while len(idx) < bm:
                try: idx.append(pending.get_nowait())
                except queue.Empty: break
            if not idx: return
            body = [{'jsonrpc': '2.0', 'id': j, 'method': calls[j][0], 'params': calls[j][1]} for j in idx]
            t = time.time()
            try:
                r = sess.post(ep, json=body, timeout=60); js = r.json()
                if isinstance(js, dict): raise RuntimeError(str(js)[:150])
                got = set()
                for x in js:
                    if 'error' in x and 'execution reverted' not in str(x['error']): continue
                    out[x['id']] = x.get('result'); got.add(x['id'])
                miss = [j for j in idx if j not in got]
                for j in miss: pending.put(j)
                if miss: raise RuntimeError(f'{len(miss)} missing')
                err = 0
            except Exception as e:
                for j in idx:
                    if out[j] is None: pending.put(j)
                err += 1
                if err > 30:
                    print('endpoint gave up', ep, str(e)[:120], flush=True); return
                time.sleep(min(0.5*err, 10))
            dt = time.time() - t
            if dt < gap: time.sleep(gap - dt)
    for rnd in range(5):
        ths = [threading.Thread(target=worker, args=e) for e in RPC[chain]]
        [t.start() for t in ths]; [t.join() for t in ths]
        if pending.empty(): break
        print('round', rnd, 'pending', pending.qsize(), flush=True)
    if not pending.empty():
        raise RuntimeError('rpc failed')
    return out

def latest(chain):
    return int(rpc_batch(chain, [('eth_blockNumber', [])])[0], 16)

def block_ts(chain, blocks):
    res = rpc_batch(chain, [('eth_getBlockByNumber', [hex(b), False]) for b in blocks])
    return [int(r['timestamp'], 16) for r in res]

def blocks_for_times(chain, targets):
    """targets: sorted unix ts. iterative interpolation search; returns first block with ts>=target (approx)."""
    lb = latest(chain)
    anchors = {lb: block_ts(chain, [lb])[0]}
    lo = 1
    anchors[lo] = block_ts(chain, [lo])[0]
    # coarse grid
    grid = list(np.linspace(1, lb, 400).astype(int))
    for b, t in zip(grid, block_ts(chain, grid)):
        anchors[b] = t
    for it in range(6):
        bs = sorted(anchors); ts = [anchors[b] for b in bs]
        guess = []
        for T in targets:
            i = bisect.bisect_left(ts, T)
            if i == 0: guess.append(bs[0]); continue
            if i >= len(ts): guess.append(bs[-1]); continue
            b0, b1, t0, t1 = bs[i-1], bs[i], ts[i-1], ts[i]
            if b1 - b0 <= 1: continue
            g = int(b0 + (T-t0)*(b1-b0)/max(t1-t0, 1))
            g = min(max(g, b0+1), b1-1)
            if g not in anchors: guess.append(g)
        guess = sorted(set(guess))
        print(chain, 'iter', it, 'new anchors', len(guess), flush=True)
        if not guess: break
        for b, t in zip(guess, block_ts(chain, guess)):
            anchors[b] = t
        # stop when every target is within 120s of an anchor
        bs = sorted(anchors); ts = np.array([anchors[b] for b in bs])
        idx = np.searchsorted(ts, targets)
        idx = np.clip(idx, 0, len(ts)-1)
        err = np.abs(ts[idx]-np.array(targets))
        print('  max err s', err.max(), 'median', np.median(err), flush=True)
        if np.percentile(err, 99) < 300: break
    bs = sorted(anchors); ts = np.array([anchors[b] for b in bs])
    return bs, ts

def dec(h, signed=False, bits=256):
    v = int(h, 16)
    if signed and v >= 1 << (bits-1): v -= 1 << bits
    return v

def main(key):
    chain, addr = POOLS[key]
    os.makedirs('raw', exist_ok=True)
    meta = rpc_batch(chain, [('eth_call', [{'to': addr, 'data': d}, 'latest']) for d in ('0x0dfe1681', '0xd21220a7', '0xddca3f43')])
    t0 = '0x'+meta[0][-40:]; t1 = '0x'+meta[1][-40:]; fee = dec(meta[2])
    decs = rpc_batch(chain, [('eth_call', [{'to': t, 'data': '0x313ce567'}, 'latest']) for t in (t0, t1)])
    d0, d1 = dec(decs[0]), dec(decs[1])
    json.dump({'token0': t0, 'token1': t1, 'fee': fee, 'dec0': d0, 'dec1': d1, 'chain': chain, 'addr': addr},
              open(f'raw/meta_{key}.json', 'w'))
    print(key, t0, t1, fee, d0, d1, flush=True)
    hours = pd.date_range(START, END, freq='1h', inclusive='left')
    targ = [int(h.timestamp()) for h in hours]
    cache = f'raw/blocks_{chain}.npz'
    if chain == 'base':
        bs, ts = [0, 10**9], np.array([1686789347, 1686789347 + 2*10**9])
    elif os.path.exists(cache):
        z = np.load(cache); bs, ts = list(z['bs']), z['ts']
    else:
        bs, ts = blocks_for_times(chain, targ[::6])
        np.savez(cache, bs=np.array(bs), ts=ts)
    hb = np.interp(targ, ts, bs).astype(int)
    out = f'raw/chain_{key}.csv'
    done = set()
    if os.path.exists(out):
        done = set(pd.read_csv(out)['ts'])
    f = open(out, 'a')
    if not done: f.write('ts,block,sqrtP,tick,liq,fg0,fg1\n')
    t_start = {'base': 1693526400, 'arb': 0}.get(chain, 0)
    todo = [(T, int(b)) for T, b in zip(targ, hb) if T not in done and T >= t_start and b > 0]
    print('todo', len(todo), flush=True)
    CH = 1000
    for i in range(0, len(todo), CH):
        part = todo[i:i+CH]
        calls = []
        for T, b in part:
            for d in ('0x3850c7bd', '0x1a686502', '0xf3058399', '0x46141319'):
                calls.append(('eth_call', [{'to': addr, 'data': d}, hex(b)]))
        res = rpc_batch(chain, calls)
        for j, (T, b) in enumerate(part):
            s0, L, g0, g1 = res[4*j:4*j+4]
            if not s0 or s0 == '0x' or not L or L == '0x':
                continue
            sq = int(s0[2:66], 16); tick = dec(s0[66:130], signed=True)
            if sq == 0: continue
            f.write(f'{T},{b},{sq},{tick},{dec(L)},{dec(g0)},{dec(g1)}\n')
        f.flush()
        print(key, i, len(todo), time.strftime('%H:%M:%S'), flush=True)
    f.close()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    main(sys.argv[1])
