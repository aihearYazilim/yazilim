"""OKX copy trading (243 currently listed SWAP leads; public API exposes only listed leads, 365 days).
Descriptive OOS stats for leads that already existed before the OOS start (leadDays >= 368 on 2026-10-19),
i.e. what an 'age >= X' rule fixed pre-OOS would have produced -- survivors only (upper bound)."""
import json, numpy as np, pandas as pd

RAW = '/home/user/yazilim/raw/copytrading'
FX = pd.read_csv('/home/user/yazilim/data/bist/USDTRY.csv', index_col=0, parse_dates=True)['close']
lst = {json.loads(l)['uniqueCode']: json.loads(l) for l in open(f'{RAW}/okx_list.jsonl')}
rows = []
for l in open(f'{RAW}/okx_hist.jsonl'):
    x = json.loads(l)
    p = sorted(x['pnl'] or [], key=lambda r: int(r['beginTs']))
    if not p:
        continue
    meta = lst[x['u']]
    st = (x['stats'] or [{}])[0]
    t0 = pd.Timestamp(int(p[0]['beginTs']), unit='ms'); t1 = pd.Timestamp(int(p[-1]['beginTs']), unit='ms')
    R = float(p[-1]['pnlRatio'])
    days = (t1 - t0).days + 1
    fxr = FX.asof(t1) / FX.asof(t0)
    rows.append(dict(u=x['u'], leadDays=int(meta['leadDays']), aum=float(meta['aum']), days=days, roi=R,
                     geo_m_usd=(1 + R) ** (30.44 / days) - 1 if R > -1 else -1,
                     geo_m_try=((1 + R) * fxr) ** (30.44 / days) - 1 if R > -1 else -1,
                     copier_pnl=float(st.get('curCopyTraderPnl') or 0), invest=float(st.get('investAmt') or 0)))
df = pd.DataFrame(rows)
old = df[df.leadDays >= 368]
pd.set_option('display.width', 200)
print('leads', len(df), 'age>=368d (existed pre-OOS)', len(old))
print('leadDays distribution:', df.leadDays.describe().round(0).to_dict())
print('OLD leads OOS lead-ROI monthly geo (TRY) quantiles:', old.geo_m_try.quantile([.1, .25, .5, .75, .9]).round(4).to_dict())
print('OLD leads mean geo_m_try', round(old.geo_m_try.mean(), 4), 'EW portfolio 12m TRY monthly geo:',
      round(((1 + old.roi).mean() * FX.asof(pd.Timestamp('2026-10-16')) / FX.asof(pd.Timestamp('2025-10-20'))) ** (1 / 12) - 1, 4))
print('share old >=10%/m', (old.geo_m_try >= .10).mean().round(3), '>=5.3%', (old.geo_m_try >= .053).mean().round(3))
print('ALL listed: share >=10%/m', (df.geo_m_try >= .10).mean().round(3))
print('aggregate current-copier PnL / invest (all leads):', round(df.copier_pnl.sum() / df.invest.sum(), 3))
