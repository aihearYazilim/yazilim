import json,urllib.request,re,os,sys,time
R='/home/user/yazilim/research/alpha/raw/'
def walk(n):
    if isinstance(n,dict):
        s=n.get('text','') if n.get('node')=='text' else ''
        for c in n.get('child',[]) or []: s+=walk(c)
        if n.get('tag') in ('p','li','h2','h3','tr','br','div'): s+='\n'
        if n.get('tag') in ('td','th'): s+=' | '
        return s
    if isinstance(n,list): return ''.join(walk(x) for x in n)
    return ''
A=json.load(open(R+'cms_list.json'))+json.load(open('/home/user/yazilim/research/airdrop/raw/cms_articles.json'))
pat=sys.argv[1]
seen=set()
for a in A:
    if a['code'] in seen or not re.search(pat,a['title']): continue
    seen.add(a['code'])
    fn=R+'articles/'+a['code']+'.txt'
    if not os.path.exists(fn):
        u=f"https://www.binance.com/bapi/composite/v1/public/cms/article/detail/query?articleCode={a['code']}"
        d=json.load(urllib.request.urlopen(u,timeout=60))['data']
        try: txt=walk(json.loads(d['body']))
        except Exception: txt=re.sub('<[^>]+>',' ',d['body'])
        open(fn,'w').write(a['title']+'\n'+str(a['releaseDate'])+'\n'+txt); time.sleep(0.3)
    print(fn)
