import json,urllib.request,time,os,datetime as dt,re
R='/home/user/yazilim/research/alpha/raw/'
os.makedirs(R+'gt',exist_ok=True)
A=json.load(open(R+'a123_historydata.json'))['airdrops']
NET={'8453':'base','56':'bsc','1':'eth','146':'sonic','501':'solana','784':'sui-network'}
def get(u):
    for k in range(4):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0','Accept':'application/json'}),timeout=60))
        except Exception as e: err=e; time.sleep(6)
    raise err
import glob
need=[]
for a in A:
    f=R+f"kl/kl_{a['token']}_{a['date']}.json"
    bad=True
    if os.path.exists(f):
        d=json.load(open(f))
        if d['h'] and (int(d['h'][0][0])-d['claim_ms'])/3.6e6<=72: bad=False
    if bad: need.append(a)
print(len(need))
for a in need:
    fn=R+f"gt/{a['token']}_{a['date']}.json"
    if os.path.exists(fn): continue
    net=NET.get(str(a['chain_id']))
    if not net: print('nonet',a['token'],a['chain_id']); continue
    hm=(a.get('time') or '16:00').strip()
    if not re.match(r'^\d{1,2}:\d{2}$',hm): hm='16:00'
    ts=int(dt.datetime.strptime(a['date']+' '+hm,'%Y-%m-%d %H:%M').replace(tzinfo=dt.timezone(dt.timedelta(hours=8))).timestamp())
    try:
        p=get(f"https://api.geckoterminal.com/api/v2/networks/{net}/tokens/{a['contract_address']}/pools?page=1")['data']
        time.sleep(2.2)
        if not p: print('nopool',a['token']); continue
        pool=p[0]['attributes']['address']
        base_is=p[0]['relationships']['base_token']['data']['id'].split('_',1)[1].lower()==a['contract_address'].lower()
        o=get(f"https://api.geckoterminal.com/api/v2/networks/{net}/pools/{pool}/ohlcv/hour?before_timestamp={ts+48*3600}&limit=60&currency=usd&token={'base' if base_is else 'quote'}")
        time.sleep(2.2)
        json.dump({'claim_s':ts,'pool':pool,'ohlcv':o['data']['attributes']['ohlcv_list']},open(fn,'w'))
        print('ok',a['token'],len(o['data']['attributes']['ohlcv_list']))
    except Exception as e: print('err',a['token'],e)
