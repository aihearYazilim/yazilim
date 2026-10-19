"""Build per-event table: reward tokens per BNB, listing time, sale prices under fixed rules.
Rules fixed ex-ante (no parameter search on OOS):
  sale price variants: H1 = close of first 1h candle; H1VW = mean(OHLC) of first 1h candle;
                       D1 = close 24h after listing (hour 24 close); D7 = close 7d after listing.
Denominator (total eligible BNB): Binance Launchpool BNB pool 'totalInvestAmount' (Simple Earn BNB is
auto-enrolled in Launchpool since 2024/2025), linearly interpolated in time between launchpool events.
"""
import json, os, datetime as dt, numpy as np, pandas as pd
R = '/home/user/yazilim/research/airdrop/raw/'
OUT = '/home/user/yazilim/research/airdrop/'
UTC = dt.timezone.utc
def ts(ms): return pd.Timestamp(int(ms), unit='ms')

lp = json.load(open(R + 'launchpool_listV3.json'))['data']['completed']['list']
ev_raw = json.load(open(OUT + 'events_raw.json'))

# BNB denominator series
den = []
for x in lp:
    for p in x['projects']:
        if p['asset'] == 'BNB':
            den.append((ts(x['investStartTime']), float(p['totalInvestAmount'])))
den = pd.Series(dict(den)).sort_index()
den = den[den.index >= '2023-01-01']
# drop DOGS (11.2M) outlier? keep raw but note; use rolling median of neighbours for robustness
def denom(t):
    t = pd.Timestamp(t)
    s = den.copy()
    if t <= s.index[0]: return s.iloc[0]
    if t >= s.index[-1]: return s.iloc[-1]
    x = s.index.astype('int64'); return float(np.interp(t.value, x, s.values))

# BNB daily
b = json.load(open(R + 'klines/BNBUSDT_1d.json'))
bnb = pd.Series({ts(k[0]): float(k[4]) for k in b})

def klines(sym):
    fn = R + f'klines/{sym}_1h.json'
    if not os.path.exists(fn): return None
    d = json.load(open(fn))
    h = pd.DataFrame([[ts(k[0]), float(k[1]), float(k[2]), float(k[3]), float(k[4]), float(k[7])] for k in d['h1']],
                     columns=['t', 'o', 'h', 'l', 'c', 'qv']).set_index('t')
    dd = pd.DataFrame([[ts(k[0]), float(k[4]), float(k[7])] for k in (d['d1'] or [])], columns=['t', 'c', 'qv']).set_index('t')
    q = d['quote']
    if q == 'BNB':  # convert to USD
        h[['o', 'h', 'l', 'c']] = h[['o', 'h', 'l', 'c']].mul(bnb.reindex(h.index.floor('D')).values, axis=0)
        h['qv'] = h['qv'] * bnb.reindex(h.index.floor('D')).values
        dd['c'] = dd['c'] * bnb.reindex(dd.index).values; dd['qv'] = dd['qv'] * bnb.reindex(dd.index).values
    return q, h, dd

rows = []
def add(typ, sym, pool_bnb, den_bnb, t_ann, t_sale_min, note=''):
    k = klines(sym)
    if k is None:
        rows.append(dict(type=typ, token=sym, note='NO PRICE DATA')); return
    q, h, dd = k
    first = h.index[0]
    t0 = max(first, pd.Timestamp(t_sale_min).floor('h')) if t_sale_min is not None else first
    hh = h[h.index >= t0]
    if len(hh) < 200:  # need data beyond the first 1000h stored -> fetch around sale time
        import urllib.request
        sym_q = sym + q
        u = f"https://data-api.binance.vision/api/v3/klines?symbol={sym_q}&interval=1h&limit=400&startTime={int(t0.value//10**6)}"
        cf = R + f'klines/{sym}_at_{int(t0.value//10**9)}.json'
        if os.path.exists(cf): kk = json.load(open(cf))
        else:
            import time
            for _ in range(5):
                try: kk = json.load(urllib.request.urlopen(u, timeout=60)); break
                except Exception: time.sleep(3)
            json.dump(kk, open(cf, 'w'))
        hh = pd.DataFrame([[ts(k[0]), float(k[1]), float(k[2]), float(k[3]), float(k[4]), float(k[7])] for k in kk],
                          columns=['t', 'o', 'h', 'l', 'c', 'qv']).set_index('t')
        if q == 'BNB':
            hh[['o','h','l','c']] = hh[['o','h','l','c']].mul(bnb.reindex(hh.index.floor('D')).ffill().values, axis=0)
    if len(hh) < 170:
        pass
    r1 = hh.iloc[0]
    p_h1 = r1.c; p_h1vw = (r1.o + r1.h + r1.l + r1.c) / 4
    p_d1 = hh.c.iloc[min(23, len(hh) - 1)]
    p_d7 = hh.c.iloc[min(167, len(hh) - 1)]
    vol1h = r1.qv; vol24 = hh.qv.iloc[:24].sum()
    per_bnb = pool_bnb / den_bnb
    bp = bnb[bnb.index <= t0.floor('D')].iloc[-1]
    rows.append(dict(type=typ, token=sym, quote=q, announce=pd.Timestamp(t_ann), listing=first, sale_t=t0,
                     pool_tokens_bnb=pool_bnb, den_bnb=den_bnb, tokens_per_bnb=per_bnb, bnb_px=bp,
                     open1=r1.o, p_h1=p_h1, p_h1vw=p_h1vw, p_d1=p_d1, p_d7=p_d7,
                     usd_per_bnb_h1=per_bnb * p_h1, usd_per_bnb_d1=per_bnb * p_d1,
                     yld_h1=per_bnb * p_h1 / bp, yld_h1vw=per_bnb * p_h1vw / bp, yld_d1=per_bnb * p_d1 / bp,
                     yld_d7=per_bnb * p_d7 / bp, pool_usd_h1=pool_bnb * p_h1, vol1h=vol1h, vol24=vol24, note=note))

# 1) Launchpool (BNB pool only) from API -- exact pool & total BNB
lp_sale = {}
for e in ev_raw:
    if e['type'] == 'launchpool' and e['listing']:
        lp_sale[e['syms'][0]] = e['listing'][0][1]
for x in lp:
    st = ts(x['investStartTime'])
    if st < pd.Timestamp('2023-01-01'): continue
    for p in x['projects']:
        if p['asset'] == 'BNB':
            add('launchpool', x['rebateCoin'], float(p['rebateTotalAmount']), float(p['totalInvestAmount']),
                ts(x['warmingStartTime'] or x['investStartTime']), None)

# 2) HODLer airdrops + megadrops from announcements
for e in ev_raw:
    if e['type'] == 'launchpool': continue
    t_ann = pd.Timestamp(e['announce'])
    for sym in e['syms']:
        key = 'CAT' if sym == '1000CAT' else sym
        if key not in e['rewards']: continue
        pool = e['rewards'][key] / (1000 if sym == '1000CAT' else 1)
        cont = 'Continues' in e['title']
        if e['type'] == 'megadrop':
            # Megadrop: score from LOCKED BNB x quest multiplier; assume BNB-lock-only user gets
            # pool/den (no quest boost), i.e. half credit relative to den assumption -> haircut 0.5
            add('megadrop', sym, pool * 0.5, denom(t_ann), t_ann, None, 'pool x0.5 quest dilution assumption')
        else:
            # tokens arrive within 4h of announcement; sale at max(listing, announce+4h)
            add('hodler' + ('_cont' if cont else ''), sym, pool, denom(t_ann), t_ann, t_ann + pd.Timedelta(hours=4))
# BB megadrop (title not 'Introducing'): 420M BB megadrop total (Binance announcement 2024-04-18), listed 2024-05-13
add('megadrop', 'BB', 168e6 * 0.5, denom('2024-05-13'), pd.Timestamp('2024-05-13'), None, 'pool 168M from announcement; x0.5')

df = pd.DataFrame(rows)
df = df.sort_values('sale_t').reset_index(drop=True)
df.to_csv(OUT + 'events.csv', index=False)
pd.set_option('display.width', 250); pd.set_option('display.max_rows', 300)
print(df[['type', 'token', 'quote', 'sale_t', 'tokens_per_bnb', 'bnb_px', 'usd_per_bnb_h1', 'yld_h1', 'yld_d1', 'yld_d7', 'pool_usd_h1', 'vol1h', 'vol24', 'note']].to_string())
