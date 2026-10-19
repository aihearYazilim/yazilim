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


def fetch_all(flt, users, lo=-100.0, hi=1e7, depth=0):
    """Rankings pages only reach 1500 rows -> recursively split by (LastTwoYears) gain range."""
    rng = f'&gainmin={lo}&gainmax={hi}'
    d = get(BASE + flt + rng + '&page=1')
    if not d:
        return
    tot = d['TotalRows']
    if tot > 1500 and depth < 25:
        mid = (lo + hi) / 2 if hi < 1e6 else max(lo + 50, 100)
        if hi >= 1e6 and lo >= 100: mid = lo * 4
        fetch_all(flt, users, lo, mid, depth + 1)
        fetch_all(flt, users, mid + 0.001, hi, depth + 1)
        return
    page = 1
    while True:
        for it in d.get('Items') or []:
            it['_src'] = flt
            users.setdefault(it['CustomerId'], it)
        if page * 500 >= min(tot, 1500):
            break
        page += 1
        d = get(BASE + flt + rng + f'&page={page}')
        if not d:
            break


def universe():
    users = {}
    for flt in ['&popularinvestor=true', '&copiersmin=1']:
        fetch_all(flt, users)
        print(flt, len(users), flush=True)
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
