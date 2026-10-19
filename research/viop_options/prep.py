import lib, pandas as pd, numpy as np
for root in ['XU030','USDTRY']:
    o,f=lib.build(root); o.to_pickle(f'data/opt_{root}.pkl')
    print(root, o.shape, o.iv.notna().mean())
    x=o[o['T']>0.02]; p=x.pivot_table(index=['date','exp','K'],columns='cp',values='px').dropna().reset_index()
    p=p.merge(x[['date','exp','F','dfac']].drop_duplicates(['date','exp']),on=['date','exp'])
    p=p[(p.K/p.F-1).abs()<0.03]; p['err']=(p.C-p.P-p.dfac*(p.F-p.K))/p.F
    print(p.groupby(p.date.dt.year).err.describe()[['count','mean','50%','std']])
    a=o[(o['T']>0.04)&(o['T']<0.12)&((o.K/o.F-1).abs()<0.03)]
    print(a.groupby(a.date.dt.year).iv.median())
