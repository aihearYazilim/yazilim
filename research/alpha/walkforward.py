import pandas as pd,numpy as np,sys
sys.path.insert(0,'/home/user/yazilim/research/alpha')
from simulate import prep,periods,summ
from simulate2 import sim2
e=prep('val24')
out=[]
for K in [int(x) for x in (sys.argv[1].split(",") if len(sys.argv)>1 else "1000,3000,10000,20000".split(","))]:
  for cs in [(0.75,1.0),(1.5,2.0),(3.75,5.0)]:
    Ps={p:periods(sim2(e,lambda D,p=p:p,K,*cs),K) for p in range(12,21)}
    starts=list(Ps[12].start)
    # choose p for period i by trailing 3 periods mean net (need >=2 past periods), default p=15
    choice={}
    for i,s in enumerate(starts):
        if i<2: choice[s]=15; continue
        lo=max(0,i-3)
        choice[s]=max(Ps, key=lambda p: Ps[p].net.iloc[lo:i].sum())
    ss=[pd.Timestamp(x) for x in starts]
    def pfun(D):
        k=[s for s in ss if s<=D]
        return choice[k[-1].date()] if k else 15
    r=sim2(e,pfun,K,*cs); P=periods(r,K); s=summ(P)
    s.update(K=K,c_is=cs[0],c_oos=cs[1],p_path=' '.join(str(choice[x]) for x in starts))
    out.append(s); print(K,cs,round(s['IS_ret_mo_geo'],4),round(s['OOS_ret_mo_geo'],4),round(s['OOS_net_mo'],1),s['p_path'])
    if K==10000 and cs==(1.5,2.0): P.to_csv('/home/user/yazilim/research/alpha/wf_periods_10k.csv',index=False)
    if K==1000 and cs==(1.5,2.0): P.to_csv('/home/user/yazilim/research/alpha/wf_periods_1k.csv',index=False)
pd.DataFrame(out).to_csv('/home/user/yazilim/research/alpha/results_wf%s.csv'%('_'+sys.argv[1] if len(sys.argv)>1 else ''),index=False)
