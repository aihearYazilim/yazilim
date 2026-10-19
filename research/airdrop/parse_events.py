import os,re,json,datetime as dt
R='/home/user/yazilim/research/airdrop/raw/'
ev=[]
def num(s): return float(s.replace(',',''))
for fn in sorted(os.listdir(R+'articles')):
    L=open(R+'articles/'+fn).read().replace('&nbsp;',' ')
    title,rel,body=L.split('\n',2)
    rel=int(rel)
    if 'HODLer' in title: typ='hodler'
    elif 'Megadrop' in title: typ='megadrop'
    else: typ='launchpool'
    sym=None
    m=re.search(r'Continues:.*?Earn (\S+) With',title) or re.search(r'Introducing .*?\(([A-Z0-9]+)\)',title)
    syms=re.findall(r'\(([0-9A-Z]+)\)',title.split('on Binance')[0])
    rewards={}
    for mm in re.finditer(r'(?:HODLer Airdrops|Launchpool|Megadrop) Token Rewards:\s*([\d,\.]+)\s*([0-9A-Z]*)',body):
        rewards[mm.group(2) or (syms[0] if syms else '?')]=num(mm.group(1))
    lists=re.findall(r'list ([0-9A-Z]+(?:\s*and\s*[0-9A-Z]+)?) at (\d{4}-\d{2}-\d{2} \d{2}:\d{2}) \(UTC\)',body)
    amended=re.findall(r'amended.*?list ([0-9A-Z]+) at (\d{4}-\d{2}-\d{2} \d{2}:\d{2})',body)
    snap=re.findall(r'from (\d{4}-\d{2}-\d{2}) \d{2}:\d{2} \(UTC\) to (\d{4}-\d{2}-\d{2})',body)
    ev.append(dict(type=typ,title=title[:120],announce=dt.datetime.utcfromtimestamp(rel/1000).strftime('%Y-%m-%d %H:%M'),syms=syms,rewards=rewards,listing=amended or lists,snap=snap[:1],code=fn[:-4]))
ev.sort(key=lambda e:e['announce'])
json.dump(ev,open('/home/user/yazilim/research/airdrop/events_raw.json','w'),indent=1)
for e in ev: print(e['announce'],e['type'],e['syms'],e['rewards'],e['listing'][:2],e['snap'])
