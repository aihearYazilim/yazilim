import json,urllib.request,time,os,datetime as dt
R='/home/user/yazilim/research/airdrop/raw/'
B='https://data-api.binance.vision/api/v3/klines'
def get(sym,interval,start=None,limit=1000,end=None):
    u=f"{B}?symbol={sym}&interval={interval}&limit={limit}"+(f"&startTime={start}" if start is not None else "")+(f"&endTime={end}" if end else "")
    try: return json.load(urllib.request.urlopen(u,timeout=60))
    except Exception as e: return None
ev=json.load(open('/home/user/yazilim/research/airdrop/events_raw.json'))
lp=json.load(open(R+'launchpool_listV3.json'))['data']['completed']['list']
syms=set()
for e in ev:
    for s in e['syms']: syms.add(s)
for x in lp: syms.add(x['rebateCoin'])
syms|={'BB','LISTA','SOLV','KERNEL'}
for s in sorted(syms):
    fn=R+f'klines/{s}_1h.json'
    if os.path.exists(fn): continue
    got=None
    for q in ['USDT','FDUSD','USDC','BNB']:
        k=get(s+q,'1h',start=0,limit=1000)
        if k: got=(q,k); break
    if not got: print('NO DATA',s); continue
    q,k=got
    # also daily first 400 days
    d=get(s+q,'1d',start=0,limit=1000)
    json.dump({'quote':q,'h1':k,'d1':d},open(fn,'w'))
    print(s,q,dt.datetime.utcfromtimestamp(k[0][0]/1000),len(k))
    time.sleep(0.2)
# BNB daily and hourly full
out=[];st=1483228800000
while True:
    k=get('BNBUSDT','1d',start=st)
    if not k: break
    out+=k; st=k[-1][0]+1
    if len(k)<1000: break
json.dump(out,open(R+'klines/BNBUSDT_1d.json','w')); print('BNB',len(out))
