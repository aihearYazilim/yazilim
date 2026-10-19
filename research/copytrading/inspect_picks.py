"""Show which leads a rule picks each period, with their realised period return and list metadata."""
import json, sys, pandas as pd
sys.argv += []
exec(open('/home/user/yazilim/research/copytrading/binance_analysis.py').read().split("if __name__")[0])
C, R = load()
lst = {json.loads(l)['leadPortfolioId']: json.loads(l) for l in open(f'{RAW}/binance_list.jsonl')}
det = details()
for L, kind, n in [(60, 'calmar', 1), (30, 'sharpe', 1), (30, 'sharpe', 3)]:
    print('RULE', L, kind, n)
    i0 = L
    while i0 + 1 < len(R):
        t = R.index[i0]
        sc, mdd = scores(R, t, L, kind)
        picks = list(sc.sort_values(ascending=False).index[:n])
        seg = R.iloc[i0 + 1:i0 + 31][picks].fillna(0)
        for p in picks:
            m = lst.get(p, {}); d = det.get(p, {})
            print(' ', t.date(), p, m.get('nickname'), 'trail', round((1 + R.loc[:t].iloc[-L:][p]).prod() - 1, 3),
                  'next', round((1 + seg[p]).prod() - 1, 3), 'aumNow', round(m.get('aum') or 0), 'copiers', m.get('currentCopyCount'),
                  '/', m.get('maxCopyCount'), 'ps', d.get('profitSharingRate'), 'status', d.get('status'))
        i0 += 30
