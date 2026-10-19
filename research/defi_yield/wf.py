import pickle,numpy as np,pandas as pd,sys
sys.path.insert(0,'/home/user/yazilim/research/defi_yield')
from backtest import to_try, geo, OOS0
M=pd.DataFrame(pickle.load(open('/home/user/yazilim/research/defi_yield/raw/monthly.pkl','rb')))
M=M[M.index>=pd.Timestamp('2024-03-17')]
out=[];pick=[]
for i,d in enumerate(M.index):
    if d<OOS0: continue
    past=M[M.index<d].iloc[-12:]
    sc=past.apply(lambda c: np.prod(1+c.dropna())**(1/max(c.notna().sum(),1)) if c.notna().sum()>=9 else np.nan)
    b=sc.idxmax(); pick.append(b); out.append(M.loc[d,b])
o=pd.Series(out,index=M.index[M.index>=OOS0])
t=to_try(o)
print('WF picks',pick); print('WF OOS usd %.2f try %.2f worst usd %.2f'%(geo(o),geo(t),o.min()*100))
for k in ['HLP','PT_L4_tvl20M','PT_L1_tvl20M','B_sdai_susds','B_aave_usdc','B_susde_hold','LOOP_L5_Y0']:
    s=M[k][M.index>=OOS0]; tt=to_try(s)
    print(k,'USD',' '.join(f'{x*100:.2f}' for x in s),'| TRY',' '.join(f'{x*100:.2f}' for x in tt))
