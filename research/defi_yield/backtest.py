"""DeFi / stablecoin yield strategies backtest. USD daily returns -> 17th-anchored months -> TRY.
Rules/params chosen on IS (< 2025-10-17) only. OOS 2025-10-17..2026-10-16."""
import sys, json, itertools, numpy as np, pandas as pd
sys.path.insert(0,'/home/user/yazilim/research/defi_yield')
from load import llama, usdtry, RAW, OOS0, OOS1
D=pd.date_range('2022-11-01','2026-10-16')
def S(k): return llama(k).reindex(D)
apy={k:S(k) for k in ['susde','aave_usdc','aave_usdt','comp_usdc','sdai','susds','fluid_usdc']}
# --- benchmark USDC lending rate = Aave v3 USDC, fill pre-2023-02 with Compound v3 USDC
usdc=apy['aave_usdc'].fillna(apy['comp_usdc'])
# Borrow rate proxy (DefiLlama borrow history is paywalled): borrow = 1.25*supply + 0.3 (current snapshot ratio 1.19-1.30)
borrow_usdt=1.25*apy['aave_usdt'].fillna(usdc)+0.3
borrow_usdc=1.25*usdc+0.3
fx=usdtry().reindex(D).ffill()
# ---------------- tail-risk haircuts (annual, % of exposure), expected-loss style
HC_SUSDE=2.0   # Ethena: custody/exchange/neg-funding/depeg; Oct-2025 Binance-only USDe 0.65 print
HC_BLUE=0.5    # Aave/Compound blue-chip lending smart-contract risk
HC_PT=2.5      # Ethena + Pendle contract
HC_HLP=1.5     # Hyperliquid chain/validator/oracle manipulation (JELLY Mar-25 etc) beyond realised PnL
HC_ROT=3.0     # mid-tier protocols (Stream/xUSD, Elixir deUSD Nov-25 type losses)
def daily(a,hc=0.0): return (a.fillna(0)-hc)/100/365
# --------------- monthly periods anchored on the 17th
def months(r):
    st=pd.Timestamp('2023-01-17'); out=[]
    while st< OOS1:
        en=st+pd.DateOffset(months=1)-pd.Timedelta(days=1)
        seg=r.loc[st:en]
        if len(seg)>0 and seg.notna().all(): out.append((st,np.prod(1+seg.values)-1))
        st=st+pd.DateOffset(months=1)
    return pd.Series(dict(out))
def to_try(m):
    f=pd.Series({s:fx.asof(s+pd.DateOffset(months=1)-pd.Timedelta(days=1))/fx.asof(s-pd.Timedelta(days=1)) for s in m.index})
    return (1+m)*f-1-0.004/12   # TRY<->USDT round trip 0.4% amortised over 12m
def geo(x): return (np.prod(1+x)**(1/len(x))-1)*100 if len(x) else np.nan
def stats(r,start=None):
    m=months(r)
    if start is not None: m=m[m.index>=start]
    IS=m[m.index<OOS0]; OO=m[m.index>=OOS0]
    t=to_try(OO); eq=np.cumprod(1+OO.values); dd=(eq/np.maximum.accumulate(np.r_[1,eq])[1:]-1).min()*100
    teq=np.cumprod(1+t.values); tdd=(teq/np.maximum.accumulate(np.r_[1,teq])[1:]-1).min()*100
    return dict(IS_n=len(IS),IS_usd=geo(IS),IS_try=geo(to_try(IS)),OOS_usd=geo(OO),OOS_try=geo(t),
                OOS_mdd_usd=min(dd,0),OOS_worst_usd=OO.min()*100,OOS_mdd_try=min(tdd,0),OOS_worst_try=t.min()*100)
# --------------- decision helper: monthly decision on day before period start using trailing window
def month_starts():
    return [s for s in pd.date_range('2023-01-17','2026-10-17',freq='MS')+pd.Timedelta(days=16)]
def regime(signal_ok):
    """signal_ok: function(date)->state ; returns daily state series held for the month"""
    st=pd.Series(index=D,dtype=object)
    for s in month_starts():
        en=s+pd.DateOffset(months=1)
        st.loc[s:en-pd.Timedelta(days=1)]=signal_ok(s-pd.Timedelta(days=1))
    return st
def trail(x,d,w): return x.loc[d-pd.Timedelta(days=w-1):d].mean()
COMBOS=0
res={}
# ===== S1 benchmarks
res['B_aave_usdc']=dict(r=daily(usdc,HC_BLUE),start=None)
res['B_susde_hold']=dict(r=daily(apy['susde'],HC_SUSDE),start=pd.Timestamp('2024-03-17'))
res['B_sdai_susds']=dict(r=daily(apy['sdai'].where(apy['susds'].isna(),apy['susds']),HC_BLUE),start=None)
COMBOS+=3
# ===== S2 switch sUSDe vs USDC lending
SW_COST=0.0010+0.0002  # DEX swap (avoid 7d cooldown) + gas
def switch(X,W):
    st=regime(lambda d: 'S' if (d>=pd.Timestamp('2024-03-01') and trail(apy['susde'],d,W)>trail(usdc,d,W)+X) else 'U')
    r=np.where(st=='S',daily(apy['susde'],HC_SUSDE),daily(usdc,HC_BLUE))
    r=pd.Series(r,index=D); ch=(st!=st.shift()).fillna(False)&st.shift().notna()
    r[ch]-=SW_COST; return r,st
for X in (0,2,4):
    for W in (7,30):
        r,st=switch(X,W); res[f'SW_X{X}_W{W}']=dict(r=r,start=pd.Timestamp('2024-03-17')); COMBOS+=1
# ===== S3 sUSDe loop on Aave/Morpho, borrow USDT; enter only if trailing carry>Y
def loop(L,Y,W=7):
    carry=apy['susde']-borrow_usdt
    st=regime(lambda d: 'L' if (d>=pd.Timestamp('2024-03-01') and trail(carry,d,W)>Y) else 'U')
    lr=(L*apy['susde']-(L-1)*borrow_usdt-L*HC_SUSDE)/100/365
    r=pd.Series(np.where(st=='L',lr.fillna(0),daily(usdc,HC_BLUE)),index=D)
    ch=(st!=st.shift()).fillna(False)&st.shift().notna()
    r[ch]-=0.0007*L+0.0003   # flash-loan/DEX swap cost on full leveraged notional + gas
    return r,st
for L in (2,3,5):
    for Y in (0,3,6):
        r,st=loop(L,Y); res[f'LOOP_L{L}_Y{Y}']=dict(r=r,start=pd.Timestamp('2024-03-17')); COMBOS+=1
# ===== S4 Pendle PT ladder (sUSDe/USDe), hold to expiry, optional leverage borrowing USDC
meta=json.load(open(RAW+'pendle_meta.json'))
pt={}
for x in meta:
    if x['name'] not in ('sUSDe','USDe'): continue
    rr=json.load(open(RAW+f"pendle_{x['address']}.json")).get('results',[])
    if not rr: continue
    df=pd.DataFrame(rr); df.index=pd.to_datetime(df.timestamp).dt.tz_localize(None).dt.normalize()
    pt[x['address']]=dict(exp=pd.Timestamp(x['expiry'][:10]),df=df)
def pendle(L,minTVL=2e7,dmin=30,dmax=180,cost=0.0015):
    r=pd.Series(daily(usdc,HC_BLUE).values,index=D); d=pd.Timestamp('2024-03-17'); trades=0
    while d<OOS1:
        best=None
        for a,x in pt.items():
            df=x['df']; days=(x['exp']-d).days
            if not(dmin<=days<=dmax): continue
            prev=df.loc[:d-pd.Timedelta(days=1)]
            if len(prev)<3: continue
            row=prev.iloc[-1]
            if row.tvl<minTVL: continue
            if best is None or row.impliedApy>best[1]: best=(a,row.impliedApy,x['exp'])
        if best is None:
            d=d+pd.Timedelta(days=7); continue
        a,imp,exp=best; trades+=1
        seg=r.loc[d:exp-pd.Timedelta(days=1)].index
        dr=np.log1p(imp)/365   # PT accretes at implied (continuous) rate to par
        pr=L*(np.exp(dr)-1)-(L-1)*borrow_usdc.loc[seg].fillna(5)/100/365-L*HC_PT/100/365
        r.loc[seg]=pr.values
        r.loc[d]-=cost*L+0.0003
        d=exp
    return r,trades
PT_TR={}
for L in (1,2,3,4):
    for mt in (2e7,5e7):
        r,tr=pendle(L,mt); res[f'PT_L{L}_tvl{int(mt/1e6)}M']=dict(r=r,start=pd.Timestamp('2024-03-17')); PT_TR[f'PT_L{L}_tvl{int(mt/1e6)}M']=tr; COMBOS+=1
# ===== S5 HLP
v=json.load(open(RAW+'hlp_vault.json')); h=dict(v['portfolio'])['allTime']
a=pd.Series({pd.Timestamp(t,unit='ms').normalize():float(x) for t,x in h['accountValueHistory']})
p=pd.Series({pd.Timestamp(t,unit='ms').normalize():float(x) for t,x in h['pnlHistory']})
hd=pd.DataFrame({'av':a,'pnl':p}); hd=hd[hd.av>1e5]; hd=hd[~hd.index.duplicated(keep='last')]
hr=pd.Series(0.0,index=D)
for (t0,r0),(t1,r1) in zip(hd.iloc[:-1].iterrows(),hd.iloc[1:].iterrows()):
    g=(r1.pnl-r0.pnl)/r0.av; n=(t1-t0).days
    if n>0: hr.loc[t0+pd.Timedelta(days=1):t1]=(1+g)**(1/n)-1
hr=hr-HC_HLP/100/365
res['HLP']=dict(r=hr,start=pd.Timestamp('2024-01-17')); COMBOS+=1
# ===== S6 rotation among universe pools (survivorship-biased: today's >=$20M pools)
um=json.load(open(RAW+'univ_meta.json'))
A={};T={}
for x in um:
    try: dd=json.load(open(RAW+f"univ/{x['pool']}.json"))['data']
    except Exception: continue
    df=pd.DataFrame(dd)
    if df.empty: continue
    df['date']=pd.to_datetime(df.timestamp).dt.tz_localize(None).dt.normalize()
    g=df.groupby('date').last()
    A[x['pool']]=g.apy.astype(float).reindex(D); T[x['pool']]=g.tvlUsd.astype(float).reindex(D)
A=pd.DataFrame(A); T=pd.DataFrame(T)
def rotation(N,minT,age,W=30):
    r=pd.Series(daily(usdc,HC_BLUE).values,index=D); prev=set(); picks={}
    for s in month_starts():
        if s>=OOS1: break
        d=s-pd.Timedelta(days=1)
        if d<D[0]+pd.Timedelta(days=age): continue
        hist=A.loc[d-pd.Timedelta(days=age):d]
        ok=hist.notna().sum()>=age*0.9
        tv=T.loc[d] if d in T.index else None
        ok&=(tv>=minT)
        sc=A.loc[d-pd.Timedelta(days=W-1):d].mean()[ok].clip(upper=40)  # cap reward spikes
        sc=sc.dropna().sort_values(ascending=False)[:N]
        en=s+pd.DateOffset(months=1)-pd.Timedelta(days=1)
        if len(sc)==0: prev=set(); continue
        seg=A.loc[s:en,sc.index].ffill().fillna(0)
        rr=((seg-HC_ROT)/100/365).mean(axis=1)
        r.loc[s:en]=rr.values
        new=set(sc.index); turn=len(new-prev)/max(N,1)
        r.loc[s]-=turn*0.0015      # bridge/gas/entry-exit
        prev=new; picks[s]=list(sc.index)
    return r,picks
for N in (1,3,5):
    for minT in (5e7,2e8):
        for age in (90,180):
            r,_=rotation(N,minT,age); res[f'ROT_N{N}_T{int(minT/1e6)}M_age{age}']=dict(r=r,start=pd.Timestamp('2023-07-17')); COMBOS+=1
rows=[]
for k,v in res.items():
    s=stats(v['r'],v['start']); s['name']=k; rows.append(s)
out=pd.DataFrame(rows).set_index('name').round(2)
pd.set_option('display.width',250)
print(out.to_string()); print('combos',COMBOS, 'PT trades',PT_TR)
out.to_csv('/home/user/yazilim/research/defi_yield/results.csv')
# monthly detail for chosen
import pickle; pickle.dump({k:months(v['r']) for k,v in res.items()},open('/home/user/yazilim/research/defi_yield/raw/monthly.pkl','wb'))
