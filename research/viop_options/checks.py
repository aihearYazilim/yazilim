import pandas as pd, numpy as np
for root in ['XU030','USDTRY']:
    o=pd.read_pickle(f'data/opt_{root}.pkl')
    e=o[o.date==o.exp]
    intr=np.where(e.cp=='C',np.maximum(e.F-e.K,0),np.maximum(e.K-e.F,0))
    print(root,'expiry-day rows',len(e),'max |settle-intrinsic|/F',np.nanmax(np.abs(e.px-intr)/e.F), 'F nan',e.F.isna().sum())
    # liquidity: fraction of strikes w/ qty>0, by moneyness bucket, T in 15-45 days
    x=o[(o['T']*365>=15)&(o['T']*365<=70)&o.iv.notna()].copy()
    x['ad']=x.delta.abs().round(1)
    x['traded']=x.qty>0
    x['y']=x.date.dt.year
    print(x[x.date>='2023-01-01'].groupby(['cp','ad']).agg(ftr=('traded','mean'),q=('qty','mean'),oi=('oi','mean'),prem=('prem','mean')).to_string())
    # spread proxy: close vs settle for traded options
    t=x[(x.qty>0)&(x.pclose>0)]
    t['rel']=(t.pclose-t.px).abs()/t.px
    t['relv']=((t.vwap/(1000 if root=='USDTRY' else 1))-t.px).abs()/t.px
    print('rel |close-settle|/settle median by y:'); print(t.groupby(['y']).agg(rc=('rel','median'),rv=('relv','median'),n=('rel','size')).to_string())
    print(t[t.date>='2024-01-01'].groupby('ad').agg(rc=('rel','median'),rv=('relv','median'),n=('rel','size')).to_string())
