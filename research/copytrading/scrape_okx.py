"""OKX copy-trading (public API v5): all currently listed SWAP lead traders + 365-day daily cumulative pnlRatio.
Output raw/copytrading/okx_list.jsonl, okx_hist.jsonl"""
import json, time, sys, urllib.request, os
from concurrent.futures import ThreadPoolExecutor

RAW = '/home/user/yazilim/raw/copytrading'
O = 'https://www.okx.com/api/v5/copytrading'


def get(url):
    for k in range(6):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            d = json.load(urllib.request.urlopen(req, timeout=40))
            if d.get('code') == '0':
                return d['data']
            print('code', d.get('code'), d.get('msg'), file=sys.stderr); time.sleep(2 * (k + 1))
        except Exception as e:
            print('err', e, file=sys.stderr); time.sleep(2 * (k + 1))
    return None


def main():
    leads = {}
    page = 1
    while True:
        d = get(f'{O}/public-lead-traders?instType=SWAP&sortType=overview&limit=20&page={page}')
        if not d:
            break
        for r in d[0]['ranks']:
            r.pop('traderInsts', None)
            leads[r['uniqueCode']] = r
        if page >= int(d[0]['totalPage']):
            break
        page += 1
        time.sleep(0.25)
    with open(f'{RAW}/okx_list.jsonl', 'w') as f:
        for r in leads.values():
            f.write(json.dumps(r) + '\n')
    print('leads', len(leads), flush=True)

    def one(u):
        time.sleep(0.3)
        return {'u': u, 'pnl': get(f'{O}/public-pnl?instType=SWAP&uniqueCode={u}&lastDays=4'),
                'stats': get(f'{O}/public-stats?instType=SWAP&uniqueCode={u}&lastDays=4')}
    with open(f'{RAW}/okx_hist.jsonl', 'w') as f, ThreadPoolExecutor(2) as ex:
        for i, r in enumerate(ex.map(one, list(leads))):
            f.write(json.dumps(r) + '\n')
            if i % 500 == 0:
                print(i, flush=True)
    print('done')


if __name__ == '__main__':
    main()
