# parse option + XU030/USDTRY futures lines from gz bulletins into a pickle
import gzip, glob, re, pandas as pd, numpy as np, os
D='/home/user/yazilim/research/viop_options'
rows=[]
pat=re.compile(r'^O_(P_)?([A-Z0-9]+?)E(\d{2})(\d{2})([CP])([\d.]+)$')
for f in sorted(glob.glob(D+'/raw/opt/o_*.csv.gz')):
    with gzip.open(f,'rt',encoding='latin-1') as fh:
        for i,l in enumerate(fh):
            if i<2: continue
            p=l.rstrip('\n').split(';')
            if len(p)<22: continue
            code=p[1]
            try:
                r=dict(date=p[0],code=code,und=p[7],exp=p[8],settle=float(p[9] or 'nan'),prev=float(p[10] or 'nan'),
                   open=float(p[12] or 0),low=float(p[13] or 0),high=float(p[14] or 0),close=float(p[15] or 0),vwap=float(p[16] or 0),
                   value=float(p[17] or 0),prem=float(p[18] or 0),qty=float(p[19] or 0),ntr=float(p[20] or 0),oi=float(p[21] or 0))
            except ValueError: continue
            if code.startswith('O_'):
                m=pat.match(code)
                if not m: continue
                r['kind']='O'; r['root']=('P_' if m.group(1) else '')+m.group(2); r['cp']=m.group(5); r['K']=float(m.group(6))
            else:
                r['kind']='F'; r['root']='XU030' if 'XU030' in code else ('USDTRY' if code.startswith('F_USDTRY') else code); r['cp']=''; r['K']=np.nan
            rows.append(r)
df=pd.DataFrame(rows); df['date']=pd.to_datetime(df['date']); df['exp']=pd.to_datetime(df['exp'])
df.to_pickle(D+'/data/all.pkl')
print(df.shape); print(df.groupby(['kind','root']).size().sort_values().tail(40))
