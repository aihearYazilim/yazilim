"""Survivorship / realism diagnostics for Binance copy trading (currently listed leads only).
1) cohort counts of surviving leads by start month (age-structure proxy for closure hazard)
2) 365D lead ROI distribution among leads live for the whole OOS window
3) aggregate copier PnL vs lead PnL (list fields, 365D window)."""
import json, numpy as np, pandas as pd

RAW = '/home/user/yazilim/raw/copytrading'
lst = [json.loads(l) for l in open(f'{RAW}/binance_list.jsonl')]
L = pd.DataFrame(lst).set_index('leadPortfolioId')
D = {}
for l in open(f'{RAW}/binance_detail.jsonl'):
    x = json.loads(l); D[x['pid']] = x['detail']
start = {}
for l in open(f'{RAW}/binance_roi.jsonl'):
    x = json.loads(l)
    pid = x['pid']
    if pid in D and D[pid].get('startTime'):
        start[pid] = pd.Timestamp(D[pid]['startTime'], unit='ms')
    else:
        nz = [t for t, v in x['roi'] if v != 0]
        if nz:
            start[pid] = pd.Timestamp(min(nz), unit='ms')
st = pd.Series(start)
coh = st.dt.to_period('Q').value_counts().sort_index()
print('surviving leads by start quarter:\n', coh.to_string())
# survival proxy: per-quarter counts relative to the most recent complete quarter (assumes constant creation rate)
ref = coh.get(pd.Period('2026Q2'), np.nan)
print('ratio to 2026Q2 cohort:', (coh / ref).round(3).to_dict())

L['roi'] = L['roi'].astype(float)
L['pnl'] = L['pnl'].astype(float)
L['copierPnl'] = L['copierPnl'].astype(float)
L['aum'] = L['aum'].astype(float)
old = L.loc[L.index.isin(st[st < pd.Timestamp('2025-10-17')].index)]
print('\nleads listed now that started before OOS:', len(old), 'of', len(L))
print('365D lead ROI % quantiles (old leads):', old.roi.quantile([.05, .1, .25, .5, .75, .9, .95]).round(1).to_dict())
print('share old leads 365D ROI <= -90%:', round((old.roi <= -90).mean(), 3), ' < 0:', round((old.roi < 0).mean(), 3))
print('share all listed with 365D ROI <= -90%:', round((L.roi <= -90).mean(), 3))
print('\naggregate (all listed, 365D): lead PnL', round(L.pnl.sum()), ' copier PnL', round(L.copierPnl.sum()),
      ' AUM', round(L.aum.sum()))
print('copier PnL / AUM:', round(L.copierPnl.sum() / L.aum.sum(), 3))
print('share of leads with copierPnl<0 among leads with copiers and lead pnl>0:',
      round(((L.copierPnl < 0) & (L.pnl > 0) & (L.currentCopyCount > 0)).sum() / ((L.pnl > 0) & (L.currentCopyCount > 0)).sum(), 3))
full = (L.currentCopyCount >= L.maxCopyCount)
print('share of leads currently full (cannot be copied):', round(full.mean(), 3),
      ' among top-100 by 365D ROI:', round(full[L.roi.rank(ascending=False) <= 100].mean(), 3))
