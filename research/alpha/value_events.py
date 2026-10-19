import json,os,re,urllib.request,time,datetime as dt,statistics as st,csv
R='/home/user/yazilim/research/alpha/raw/'
A=json.load(open(R+'a123_historydata.json'))['airdrops']
bnb={dt.datetime.utcfromtimestamp(int(k[0])/1000).date().isoformat():float(k[4]) for k in json.load(open(R+'bnb_1d.json'))}
os.makedirs(R+'spot',exist_ok=True)
def spot_h(sym,st_ms):
    fn=R+f'spot/{sym}_{st_ms}.json'
    if os.path.exists(fn): return json.load(open(fn))
    try: d=json.load(urllib.request.urlopen(f"https://data-api.binance.vision/api/v3/klines?symbol={sym}USDT&interval=1h&startTime={st_ms}&limit=48",timeout=30))
    except Exception: d=[]
    json.dump(d,open(fn,'w')); time.sleep(0.2); return d
rows=[]
for a in A:
    hm=(a.get('time') or '16:00').strip()
    if not re.match(r'^\d{1,2}:\d{2}$',hm): hm='16:00'
    t=dt.datetime.strptime(a['date']+' '+hm,'%Y-%m-%d %H:%M').replace(tzinfo=dt.timezone(dt.timedelta(hours=8)))
    cms=int(t.timestamp()*1000)
    try: amt=float(str(a['amount']).replace(',',''))
    except: amt=float('nan')
    pts=[int(x) for x in re.findall(r'\d+',str(a['points']))]
    src='';p1=p24=float('nan');lag=None
    f=R+f"kl/kl_{a['token']}_{a['date']}.json"
    bars=[]
    if os.path.exists(f):
        d=json.load(open(f)); bars+=[(int(k[0]),float(k[5]),float(k[7]),'a') for k in (d['h'] or []) if int(k[0])+3600000>cms]
    if a['spot_listed']:
        bars+=[(int(k[0]),float(k[5]),float(k[7]),'s') for k in spot_h(a['token'],cms-3600000) if int(k[0])+3600000>cms]
    bars=[b for b in bars if b[1]>0]
    if bars:
        t0=min(b[0] for b in bars); lag=(t0-cms)/3.6e6
        if lag<=400:
            src='+'.join(sorted(set(b[3] for b in bars)))
            b1=[b for b in bars if b[0]==t0]; p1=sum(b[2] for b in b1)/sum(b[1] for b in b1)
            w=[b for b in bars if b[0]<t0+24*3600000]; p24=sum(b[2] for b in w)/sum(b[1] for b in w)
    typ=a['type'] or 'grab'
    cost=0.0; cap_bnb=None
    if typ=='tge':
        try:
            tb=float(a['target_bnb']); tt=float(a['tge_total']); ab=float(a['actual_bnb'])
            px=bnb.get(a['date'],600)
            cost=amt*tb/tt*px
            cap_bnb=amt*ab/tt  # implied per-user commitment
        except Exception: cost=None
    rows.append(dict(token=a['token'],date=a['date'],claim_ms=cms,type=typ,thr=pts[0] if pts else None,thr2=pts[-1] if pts else None,
        amount=amt,src=src,lag_h=lag,p1=p1,p24=p24,val1=amt*p1,val24=amt*p24,tge_cost=cost,cap_bnb=cap_bnb,chain=a['chain_id']))
rows.sort(key=lambda r:r['claim_ms'])
with open('/home/user/yazilim/research/alpha/events.csv','w',newline='') as fh:
    w=csv.DictWriter(fh,fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
print(len(rows), sum(1 for r in rows if not r['src']))
