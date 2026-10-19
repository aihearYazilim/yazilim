import json, subprocess, os
m=json.load(open('raw/pendle_all.json'))['markets']
sel=[x for x in m if x['name'] in ('sUSDe','USDe','sDAI','sUSDS')]
meta=[]
for x in sel:
    f=f"raw/pendle_{x['address']}.json"
    if not os.path.exists(f):
        subprocess.run(['curl','-sS','-m','60','-o',f,f"https://api-v2.pendle.finance/core/v2/1/markets/{x['address']}/historical-data?time_frame=day"])
    meta.append(dict(name=x['name'],address=x['address'],expiry=x['expiry'],start=x['timestamp']))
json.dump(meta,open('raw/pendle_meta.json','w'),indent=1)
print(len(meta))
