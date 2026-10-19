"""variance risk premium: ATM IV (nearest expiry, 15-70 DTE) vs realized vol to expiry on same-expiry futures."""
import pandas as pd, numpy as np
out={}
for root in ['XU030','USDTRY']:
    o=pd.read_pickle(f'data/opt_{root}.pkl')
    fut=o[['date','exp','F']].drop_duplicates()
    x=o[(o['T']*365>=15)&(o['T']*365<=70)&o.iv.notna()]
    x=x[x.exp==x.groupby('date').exp.transform('min')]
    x=x.assign(m=np.abs(np.log(x.K/x.F)))
    atm=x.sort_values('m').groupby(['date','cp']).head(2).groupby('date').agg(iv=('iv','mean'),exp=('exp','first'),F=('F','first'))
    # realized
    rv=[]
    for d,r in atm.iterrows():
        s=fut[(fut.exp==r.exp)&(fut.date>=d)].sort_values('date')
        lr=np.diff(np.log(s.F.values))
        rv.append(np.sqrt(np.mean(lr**2)*252) if len(lr)>=5 else np.nan)
        # straddle P&L proxy
    atm['rv']=rv
    atm['FT']=[fut[(fut.exp==r.exp)&(fut.date==r.exp)].F.mean() for d,r in atm.iterrows()]
    atm['vrp']=atm.iv-atm.rv
    atm.to_pickle(f'data/atm_{root}.pkl')
    g=atm.groupby(atm.index.year).agg(iv=('iv','median'),rv=('rv','median'),vrp=('vrp','median'),pos=('vrp',lambda v:(v>0).mean()))
    print(root); print(g.round(3).to_string())
    print('IS (<2025-10-17) mean vrp', atm[atm.index<'2025-10-17'].vrp.mean().round(3),'OOS',atm[atm.index>='2025-10-17'].vrp.mean().round(3))
