import time, numpy as np, pandas as pd
from lib import *; from sim import *
c = Coin("BTC")
i0,i1 = c.win(OOS0, OOS1)
print(c.t[i0], pd.to_datetime(c.t[i0]*60,unit='s'), pd.to_datetime(c.t[i1-1]*60,unit='s'))
for args in [(0,50,True,0,30,1.0,0,0,0.0,0),(0,50,True,0,30,1.0,1,2,0.05,0),(3,50,True,1,4,3.0,1,2,0.05,0),(1,50,True,1,4,3.0,1,2,0.05,0),(2,50,True,1,4,3.0,1,2,0.05,0)]:
    mode=args[0]; spot=mode==0
    ft,fr=(c.ft_empty,c.fr_empty) if spot else (c.ft,c.fr)
    fm,ftk=(0.001,0.001) if spot else (0.0002,0.0005)
    t0=time.time()
    r=grid_sim(c.t,c.o,c.h,c.l,c.c,i0,i1,c.d0,c.dH,c.dL,c.dC,ft,fr,*args,fm,ftk,0.0005,0.0002,0.0001)
    s=to_series(r[0],c.days(i0,i1)); st=stats(s); stt=stats(s,try_=True)
    print(args, f"{time.time()-t0:.2f}s", {k:round(v,4) for k,v in st.items()}, "TRY geo",round(stt['geo'],4), "gridprofit",round(r[1][-1],4),"fills",r[2],"fees",round(r[3],4),"fund",round(r[4],4),"dead",r[5],"rest",r[6])
t0=time.time()
r=dca_sim(c.t,c.o,c.h,c.l,c.c,i0,i1,c.ft_empty,c.fr_empty,False,1.0,1.5,6,0.015,1.2,0.015,0.0,1.0,0.001,0.001,0.0005,0.0002,0.0001)
s=to_series(r[0],c.days(i0,i1)); print("dca",time.time()-t0, stats(s), r[1][-1], r[2:])
r=rebal_sim(c.t,c.o,c.h,c.l,c.c,i0,i1,0,0.5,0.01,0.001,0.0002)
s=to_series(r[0],c.days(i0,i1)); print("rebal", stats(s), r[1:])
print("hold", c.c[i1-1]/c.c[i0])
