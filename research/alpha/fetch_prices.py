import re,json,urllib.request,time,os,datetime as dt
R='/home/user/yazilim/research/alpha/raw/'
os.makedirs(R+'kl',exist_ok=True)
T=json.load(open(R+'alpha_tokens.json'))['data']
A=json.load(open(R+'a123_historydata.json'))['airdrops']
idx={(t['contractAddress'].lower(),str(t['chainId'])):t for t in T}
idx2={t['contractAddress'].lower():t for t in T}
def get(u):
    for k in range(3):
        try:
            r=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'})
            return json.load(urllib.request.urlopen(r,timeout=60))
        except Exception as e: err=e; time.sleep(2)
    raise err
miss=0
for a in A:
    ca=a['contract_address'].lower()
    t=idx.get((ca,str(a['chain_id']))) or idx2.get(ca)
    if not t: miss+=1; print('nomatch',a['token']); continue
    hm=(a.get('time') or '16:00')
    if not re.match(r'^\d{1,2}:\d{2}$',hm.strip()): hm='16:00'
    hm=hm.strip()
    ts=dt.datetime.strptime(a['date']+' '+hm,'%Y-%m-%d %H:%M').replace(tzinfo=dt.timezone(dt.timedelta(hours=8)))
    st=int(ts.timestamp()*1000)
    fn=R+f"kl/{a['token']}_{a['date']}.json".replace('/','_').replace(' ','_')
    if os.path.exists(fn): continue
    u=f"https://www.binance.com/bapi/defi/v1/public/alpha-trade/klines?symbol={t['alphaId']}USDT&interval=1h&limit=200&startTime={st-3600000}"
    d=get(u)['data']
    # also daily for 30 days
    u2=f"https://www.binance.com/bapi/defi/v1/public/alpha-trade/klines?symbol={t['alphaId']}USDT&interval=1d&limit=40&startTime={st-86400000*2}"
    d2=get(u2)['data']
    json.dump({'alphaId':t['alphaId'],'claim_ms':st,'h':d,'d':d2,'mulPoint':t.get('mulPoint')},open(fn,'w'))
    time.sleep(0.2)
print('miss',miss)
