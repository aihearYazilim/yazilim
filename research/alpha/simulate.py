"""Binance Alpha Points simulation. Rules fixed ex ante:
- account earns constant p points/day = balance pts b(K) + volume pts v (needs counted buy volume 2^v USD/day)
- 15-day rolling total = earned over previous 15 days - 15 pts for each claim in previous 15 days
- claims every airdrop/TGE (greedy) when total >= phase-1 threshold; claim success prob q (expected-value accounting)
- sells reward over first 24h (VWAP) [alt: first hour VWAP]; sell haircut 1%
- TGE: pays amount*target_bnb/tge_total in BNB; needs 3 BNB commit (scaled down if capital smaller); +$6 BNB buy/sell cost
- unpriced events (7%) valued at the same-month median of priced events of same type
"""
import pandas as pd,numpy as np,datetime as dt,itertools,json,sys
d=pd.read_csv('/home/user/yazilim/research/alpha/events.csv')
d['dt']=pd.to_datetime(d.claim_ms,unit='ms')
d['day']=d.dt.dt.floor('D')
d['m']=d.date.str[:7]
bnb=json.load(open('/home/user/yazilim/research/alpha/raw/bnb_1d.json'))
bnbp={pd.Timestamp(int(k[0]),unit='ms').floor('D'):float(k[4]) for k in bnb}
def prep(valcol,tge_unknown_cost=0.15,haircut=0.01):
    e=d.copy()
    e['val']=e[valcol]*(1-haircut)
    istge=e.type=='tge'
    c=e.tge_cost.copy()
    c[istge & c.isna()]=e.loc[istge & c.isna(),'val']*tge_unknown_cost
    c[~istge]=0
    e['cost']=c+np.where(istge,6.0,0.0)
    e['net']=e.val-e.cost
    for (m,t),g in e.groupby(['m','type']):
        med=g.net.median()
        if np.isnan(med): med=e[e.m==m].net.median()
        e.loc[g.index[g.net.isna()],'net']=med
    e['bnb']=e.day.map(lambda x:bnbp.get(x,600.0))
    return e
def bal_pts(K):
    return 4 if K>=1e5 else 3 if K>=1e4 else 2 if K>=1e3 else 1 if K>=100 else 0
def sim(e,p,K,c_is,c_oos,q=1.0,start='2025-04-10',end='2026-10-17',thr_col='thr'):
    b=bal_pts(K); v=p-b
    if v<0: return None
    days=pd.date_range(start,end,freq='D')[:-1]
    oos0=pd.Timestamp('2025-10-17')
    earned={}; spent=[]  # (day, pts)
    ev=e.sort_values('claim_ms')
    evd={k:g for k,g in ev.groupby('day')}
    rows=[]
    for D in days:
        # points total before today's activity: last 15 completed days
        tot=sum(earned.get(D-pd.Timedelta(days=i),0) for i in range(1,16))
        tot-=sum(s for (dd,s) in spent if D-pd.Timedelta(days=15)<dd<=D)
        inc=0.0;n=0
        if D in evd:
            for _,r in evd[D].iterrows():
                if tot>=r[thr_col]:
                    frac=1.0
                    if r.type=='tge':
                        frac=min(1.0,K/(3*r.bnb))
                    val=r.net if r.type!='tge' else (r.net+6.0)*frac-6.0
                    inc+=q*val; n+=q
                    spent.append((D,15*q)); tot-=15*q
        earned[D]=p
        c=(c_oos if D>=oos0 else c_is)/1e4*(2**v if v>0 else 0)
        rows.append((D,inc,c,n))
    r=pd.DataFrame(rows,columns=['day','gross','cost','claims']).set_index('day')
    return r
def periods(r,K):
    # 17th-to-16th monthly periods
    out=[]
    s=pd.Timestamp('2025-04-17')
    while s<pd.Timestamp('2026-10-17'):
        n=s+pd.DateOffset(months=1)
        g=r[(r.index>=s)&(r.index<n)]
        out.append((s.date(),g.gross.sum(),g.cost.sum(),g.claims.sum()))
        s=n
    P=pd.DataFrame(out,columns=['start','gross','cost','claims'])
    P['net']=P.gross-P.cost; P['ret']=P.net/K
    P['oos']=pd.to_datetime(P.start)>=pd.Timestamp('2025-10-17')
    return P
def summ(P):
    res={}
    for k,g in [('IS',P[~P.oos]),('OOS',P[P.oos])]:
        res[k+'_net_mo']=g.net.mean(); res[k+'_ret_mo_arith']=g.ret.mean()
        res[k+'_ret_mo_geo']=np.prod(1+g.ret.clip(lower=-0.99))**(1/len(g))-1
        res[k+'_claims_mo']=g.claims.mean(); res[k+'_gross_mo']=g.gross.mean(); res[k+'_cost_mo']=g.cost.mean()
        res[k+'_worst_mo']=g.ret.min()
    return res
if __name__=='__main__':
    results=[]
    for valcol in ['val24','val1']:
        e=prep(valcol)
        for K in [1000,3000,10000,20000]:
            for p in range(12,22):
                for cs in [(1.5,2.0),(0.75,1.0),(3.75,5.0)]:
                    for q in [1.0,0.8]:
                        r=sim(e,p,K,cs[0],cs[1],q)
                        if r is None: continue
                        P=periods(r,K)
                        s=summ(P); s.update(valcol=valcol,K=K,p=p,c_is=cs[0],c_oos=cs[1],q=q)
                        results.append(s)
    R=pd.DataFrame(results)
    R.to_csv('/home/user/yazilim/research/alpha/results.csv',index=False)
    print(len(R))
