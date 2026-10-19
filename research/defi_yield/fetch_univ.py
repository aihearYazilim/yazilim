import json, subprocess, os, time
d=json.load(open('raw/pools.json'))['data']
u=[p for p in d if p.get('stablecoin') and p.get('exposure')=='single' and p['tvlUsd']>=2e7 and (p.get('count') or 0)>=300]
u.sort(key=lambda p:-p['tvlUsd']); u=u[:250]
json.dump([{k:p[k] for k in ('pool','project','chain','symbol','tvlUsd','count','poolMeta')} for p in u],open('raw/univ_meta.json','w'),indent=0)
os.makedirs('raw/univ',exist_ok=True)
for p in u:
    f=f"raw/univ/{p['pool']}.json"
    if os.path.exists(f) and os.path.getsize(f)>500: continue
    subprocess.run(['curl','-sS','-m','60','-o',f,f"https://yields.llama.fi/chart/{p['pool']}"]); time.sleep(0.2)
print(len(u))
