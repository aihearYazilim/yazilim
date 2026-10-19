"""For each currently-listed Binance lead portfolio:
 phase 1: 365D daily cumulative ROI chart (starts ~2025-10-20 = OOS start)  -> binance_roi.jsonl
 phase 2: for leads with ROI history before 2026-08-01: detail (startTime, profit share, copier stats)
          + 365D cumulative PNL chart                                         -> binance_detail.jsonl
"""
import json, time, sys, urllib.request, os
from concurrent.futures import ThreadPoolExecutor

RAW = '/home/user/yazilim/raw/copytrading'
B = 'https://www.binance.com/bapi/futures/v1'
CUT = 1785542400000  # 2026-08-01


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


def roi(pid):
    r = get(f'{B}/public/future/copy-trade/lead-portfolio/chart-data?portfolioId={pid}&timeRange=365D&dataType=ROI')
    return {'pid': pid, 'roi': [[x['dateTime'], x['value']] for x in (r or [])], 'ok': r is not None}


def detail(pid):
    det = get(f'{B}/friendly/future/copy-trade/lead-portfolio/detail?portfolioId={pid}') or {}
    pnl = get(f'{B}/public/future/copy-trade/lead-portfolio/chart-data?portfolioId={pid}&timeRange=365D&dataType=PNL')
    return {'pid': pid, 'detail': {k: det.get(k) for k in KEEP}, 'pnl': [[x['dateTime'], x['value']] for x in (pnl or [])]}


def phase(fn, func, pids, threads=6):
    done = set()
    if os.path.exists(fn):
        done = {json.loads(l)['pid'] for l in open(fn)}
    todo = [p for p in pids if p not in done]
    with open(fn, 'a') as f, ThreadPoolExecutor(threads) as ex:
        for i, r in enumerate(ex.map(func, todo)):
            f.write(json.dumps(r) + '\n')
            if i % 500 == 0:
                print(fn[-25:], i, len(todo), flush=True)


def main():
    pids = [json.loads(l)['leadPortfolioId'] for l in open(f'{RAW}/binance_list.jsonl')]
    phase(f'{RAW}/binance_roi.jsonl', roi, pids)
    early = []
    for l in open(f'{RAW}/binance_roi.jsonl'):
        x = json.loads(l)
        nz = [t for t, v in x['roi'] if v != 0]
        if nz and min(nz) < CUT:
            early.append(x['pid'])
    print('phase2', len(early), flush=True)
    phase(f'{RAW}/binance_detail.jsonl', detail, early)
    print('done')


if __name__ == '__main__':
    main()
