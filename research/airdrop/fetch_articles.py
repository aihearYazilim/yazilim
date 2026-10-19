import json,urllib.request,re,os,time
R='/home/user/yazilim/research/airdrop/raw/'
A=json.load(open(R+'cms_articles.json'))
def walk(n):
    if isinstance(n,dict):
        s=n.get('text','') if n.get('node')=='text' else ''
        for c in n.get('child',[]) or []: s+=walk(c)
        if n.get('tag') in ('p','li','h2','h3','tr','br','div'): s+='\n'
        if n.get('tag') in ('td','th'): s+=' | '
        return s
    if isinstance(n,list): return ''.join(walk(x) for x in n)
    return ''
seen=set()
for a in A:
    t=a['title']
    if a['code'] in seen: continue
    seen.add(a['code'])
    if not (('HODLer Airdrops' in t and ('Introducing' in t or 'Continues' in t)) or ('Launchpool!' in t or 'on Binance Launchpool' in t) and 'Introducing' in t or ('Megadrop' in t and 'Introducing' in t)): continue
    fn=R+'articles/'+a['code']+'.txt'
    if os.path.exists(fn): continue
    u=f"https://www.binance.com/bapi/composite/v1/public/cms/article/detail/query?articleCode={a['code']}"
    d=json.load(urllib.request.urlopen(u,timeout=60))['data']
    try: txt=walk(json.loads(d['body']))
    except Exception: txt=re.sub('<[^>]+>',' ',d['body'])
    open(fn,'w').write(t+'\n'+str(a['releaseDate'])+'\n'+txt)
    time.sleep(0.3)
print(len(os.listdir(R+'articles')))
