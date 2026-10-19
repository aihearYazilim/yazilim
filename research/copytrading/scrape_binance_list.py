"""Scrape the full Binance Futures copy-trading lead list (currently listed leads only).
Output: raw/copytrading/binance_list.jsonl (one lead per line, chartItems stripped)."""
import json, time, sys, urllib.request, os

OUT = '/home/user/yazilim/raw/copytrading/binance_list.jsonl'
URL = 'https://www.binance.com/bapi/futures/v1/friendly/future/copy-trade/home-page/query-list'


def post(body):
    for k in range(5):
        try:
            req = urllib.request.Request(URL, data=json.dumps(body).encode(),
                                         headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'})
            return json.load(urllib.request.urlopen(req, timeout=40))
        except Exception as e:
            print('err', e, file=sys.stderr); time.sleep(3 * (k + 1))
    return None


def main(time_range='365D', data_type='ROI', order='DESC'):
    seen = {}
    page = 1
    while True:
        d = post({"pageNumber": page, "pageSize": 30, "timeRange": time_range, "dataType": data_type,
                  "favoriteOnly": False, "hideFull": False, "nickname": "", "order": order, "userAsset": 0,
                  "portfolioType": "ALL", "useAiRecommended": False})
        if not d or not d.get('data') or not d['data'].get('list'):
            break
        for x in d['data']['list']:
            x.pop('chartItems', None)
            x['_page'] = page
            seen[x['leadPortfolioId']] = x
        total = d['data']['total']
        if page * 30 >= total:
            break
        page += 1
        time.sleep(0.3)
    with open(OUT, 'w') as f:
        for x in seen.values():
            f.write(json.dumps(x) + '\n')
    print('pages', page, 'unique', len(seen), 'total', total)


if __name__ == '__main__':
    main(*sys.argv[1:])
