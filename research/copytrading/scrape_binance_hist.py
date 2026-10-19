"""For each currently-listed Binance lead portfolio: detail (startTime, status, profit share, copier stats)
and 365D daily cumulative ROI + PNL chart (starts ~2025-10-20 = OOS start).
Output raw/copytrading/binance_hist.jsonl"""
import json, time, sys, urllib.request, os
from concurrent.futures import ThreadPoolExecutor

RAW = '/home/user/yazilim/raw/copytrading'
B = 'https://www.binance.com/bapi/futures/v1'


def get(url):
    for k in range(5):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            d = json.load(urllib.request.urlopen(req, timeout=40))
            if d.get('code') == '000000':
                return d['data']
            print('code', d.get('code'), d.get('message'), file=sys.stderr); time.sleep(5 * (k + 1))
        except Exception as e:
            print('err', e, file=sys.stderr); time.sleep(3 * (k + 1))
    return None


KEEP = ['status', 'startTime', 'endTime', 'closedTime', 'profitSharingRate', 'totalCopyCount', 'closeLeadCount',
        'currentCopyCount', 'maxCopyCount', 'marginBalance', 'aumAmount', 'copierPnl', 'tag', 'badgeName',
        'portfolioType', 'lockPeriod', 'nickname', 'futuresType', 'initInvestAsset']


def one(pid):
    det = get(f'{B}/friendly/future/copy-trade/lead-portfolio/detail?portfolioId={pid}') or {}
    roi = get(f'{B}/public/future/copy-trade/lead-portfolio/chart-data?portfolioId={pid}&timeRange=365D&dataType=ROI')
    pnl = get(f'{B}/public/future/copy-trade/lead-portfolio/chart-data?portfolioId={pid}&timeRange=365D&dataType=PNL')
    return {'pid': pid, 'detail': {k: det.get(k) for k in KEEP},
            'roi': [[x['dateTime'], x['value']] for x in (roi or [])],
            'pnl': [[x['dateTime'], x['value']] for x in (pnl or [])]}


def main():
    pids = [json.loads(l)['leadPortfolioId'] for l in open(f'{RAW}/binance_list.jsonl')]
    fn = f'{RAW}/binance_hist.jsonl'
    done = set()
    if os.path.exists(fn):
        done = {json.loads(l)['pid'] for l in open(fn)}
    todo = [p for p in pids if p not in done]
    with open(fn, 'a') as f, ThreadPoolExecutor(4) as ex:
        for i, r in enumerate(ex.map(one, todo)):
            f.write(json.dumps(r) + '\n')
            if i % 500 == 0:
                print(i, len(todo), flush=True)
    print('done')


if __name__ == '__main__':
    main()
