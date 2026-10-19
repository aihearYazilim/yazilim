"""eToro: build a universe (current Popular-Investor flag OR >=1 copier) and fetch each user's
full monthly gain history (sapi/userstats/gain/cid/{cid}/history).
Monthly history goes back to account inception -> point-in-time selection on pre-OOS months is possible.
Survivorship: universe is defined with CURRENT flags (PI / copiers) -> upward bias; accounts closed are absent.
Outputs raw/copytrading/etoro_universe.jsonl, raw/copytrading/etoro_hist.jsonl"""
import json, time, sys, urllib.request, os
from concurrent.futures import ThreadPoolExecutor

RAW = '/home/user/yazilim/raw/copytrading'
BASE = ('https://www.etoro.com/sapi/rankings/rankings/?client_request_id=x&blocked=false&bonusonly=false'
        '&copyblock=false&istestaccount=false&optin=true&period=LastTwoYears&sort=-copiers&pagesize=500')


def get(url):
    for k in range(5):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            return json.load(urllib.request.urlopen(req, timeout=40))
        except Exception as e:
            print('err', url[-60:], e, file=sys.stderr); time.sleep(3 * (k + 1))
    return None


def universe():
    users = {}
    for flt in ['&popularinvestor=true', '&copiersmin=1']:
        page = 1
        while True:
            d = get(BASE + flt + f'&page={page}')
            if not d or not d.get('Items'):
                break
            for it in d['Items']:
                it['_src'] = flt
                users.setdefault(it['CustomerId'], it)
            if page * 500 >= d['TotalRows']:
                break
            page += 1
    with open(f'{RAW}/etoro_universe.jsonl', 'w') as f:
        for u in users.values():
            f.write(json.dumps(u) + '\n')
    print('universe', len(users))
    return users


def hist(cid):
    d = get(f'https://www.etoro.com/sapi/userstats/gain/cid/{cid}/history?IncludeSimulation=false')
    return cid, d


def main():
    users = universe()
    done = set()
    fn = f'{RAW}/etoro_hist.jsonl'
    if os.path.exists(fn):
        for line in open(fn):
            done.add(json.loads(line)['cid'])
    todo = [c for c in users if c not in done]
    with open(fn, 'a') as f, ThreadPoolExecutor(4) as ex:
        for i, (cid, d) in enumerate(ex.map(hist, todo)):
            if d is not None:
                f.write(json.dumps({'cid': cid, 'monthly': d.get('monthly'), 'yearly': d.get('yearly')}) + '\n')
            if i % 500 == 0:
                print(i, len(todo), flush=True)
    print('done')


if __name__ == '__main__':
    main()
