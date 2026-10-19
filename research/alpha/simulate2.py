"""Extensions: (a) claim filter: claim only if observed value at claim (first-hour VWAP * amount) >= X;
(b) walk-forward choice of daily points p each month from trailing 3 months; (c) phase-2 threshold optimistic variant."""
import pandas as pd,numpy as np,sys
sys.path.insert(0,'/home/user/yazilim/research/alpha')
from simulate import prep,bal_pts,periods,summ,d
def sim2(e,pfun,K,c_is,c_oos,q=1.0,X=0,start='2025-04-10',end='2026-10-17',thr_col='thr'):
    days=pd.date_range(start,end,freq='D')[:-1]
    oos0=pd.Timestamp('2025-10-17'); b=bal_pts(K)
    earned={}; spent=[]
    evd={k:g for k,g in e.sort_values('claim_ms').groupby('day')}
    rows=[]
    for D in days:
        p=pfun(D); v=max(p-b,0)
        tot=sum(earned.get(D-pd.Timedelta(days=i),0) for i in range(1,16))
        tot-=sum(s for (dd,s) in spent if D-pd.Timedelta(days=15)<dd<=D)
        inc=0.0;n=0
        if D in evd:
            for _,r in evd[D].iterrows():
                sig=r.val1 if not np.isnan(r.val1) else r.net
                if r.type=='tge' and not np.isnan(r.val1): sig=r.val1-(r.cost if not np.isnan(r.cost) else 0)
                if tot>=r[thr_col] and sig>=X:
                    frac=min(1.0,K/(3*r.bnb)) if r.type=='tge' else 1.0
                    val=r.net if r.type!='tge' else (r.net+6.0)*frac-6.0
                    inc+=q*val; n+=q; spent.append((D,15*q)); tot-=15*q
        earned[D]=p
        c=(c_oos if D>=oos0 else c_is)/1e4*(2**v if v>0 else 0)
        rows.append((D,inc,c,n))
    return pd.DataFrame(rows,columns=['day','gross','cost','claims']).set_index('day')
if __name__=='__main__':
    out=[]
    e=prep('val24')
    for K in [1000,3000,10000,20000]:
      for cs in [(1.5,2.0),(3.75,5.0)]:
        # (a) fixed p, filter X
        for X in [0,20,40,60]:
            for p in range(13,21):
                r=sim2(e,lambda D,p=p:p,K,*cs,X=X); P=periods(r,K); s=summ(P)
                s.update(mode='fixed',K=K,p=p,X=X,c_oos=cs[1]); out.append(s)
            # phase-2 threshold variant for best-case
            for p in range(13,21):
                r=sim2(e,lambda D,p=p:p,K,*cs,X=X,thr_col='thr2'); P=periods(r,K); s=summ(P)
                s.update(mode='fixed_thr2',K=K,p=p,X=X,c_oos=cs[1]); out.append(s)
    R=pd.DataFrame(out); R.to_csv('/home/user/yazilim/research/alpha/results2.csv',index=False); print(len(R))
