import json,urllib.request,time,sys
out=[]
for cat in [48,49,93,128,161]:
    for p in range(1,200):
        u=f"https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId={cat}&pageNo={p}&pageSize=50"
        try: d=json.load(urllib.request.urlopen(u,timeout=60))['data']['catalogs'][0]
        except Exception as e: print(cat,p,e); break
        arts=d['articles']
        if not arts: break
        for a in arts: a['cat']=cat
        out+=arts
        if arts[-1]['releaseDate']<1730000000000: break
        time.sleep(0.25)
    print(cat,len(out),flush=True)
json.dump(out,open('raw/cms_list.json','w'))
