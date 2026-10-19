"""Hand-worked trades: print units and P&L for a few strangle entries."""
from common import R
import numpy as np, pandas as pd
from bs import bs_price, bs_delta
W = R.ENT["W"]
print([ (e["cur"],e["day"]) for e in W if not np.isfinite(e["S"])])
pick = [e for e in W if e["day"] in ("2022-06-10","2024-03-01","2025-11-14","2026-02-06")]
for e in pick:
    F,T,S0,S = e["F"],e["T"],e["S0"],e["S"]
    f = R.FEAT[(e["cur"],e["day"])]
    print(f"\n{e['cur']} {e['day']}->{e['expiry']} S0={S0:.2f} F={F:.2f} T={T*365:.3f}d settle={S:.2f} move={S/S0-1:+.3%} DVOL(d-1)={f['dvol']:.1f} med365={f['dvmed']:.1f} filter={'ON' if f['dvol']>f['dvmed'] else 'off'}")
    tot = 0
    for isc, dlt in ((False,-.3),(True,.3)):
        K = e["sm"].strike(dlt, isc); v = float(e["sm"].iv(K))
        coin = float(bs_price(F,K,T,v,isc))/F       # premium per option in coin (Deribit convention)
        usd = coin*S0
        payoff_coin = (max(S-K,0) if isc else max(K-S,0))/S   # coin paid at expiry per option
        s,_,mark,_ = R.leg(e,K,isc,S,0.05,0.0)
        print(f"  {'C' if isc else 'P'} K={K:.1f} iv={v:.3f} delta={float(bs_delta(F,K,T,v,isc)):+.3f} prem={coin:.5f} coin = ${usd:.2f}; payoff={payoff_coin:.5f} coin = ${payoff_coin*S:.2f}; "
              f"coin-P&L/opt={coin-payoff_coin:+.5f}; code USD P&L/opt={s:+.2f} (gross {usd-payoff_coin*S:+.2f})")
        tot += s
    print(f"  strangle 1x ret = {tot/S0:+.4%}, 2x = {2*tot/S0:+.4%}; code trade_ret 2x = {R.trade_ret(e,'strangle',.3,2,0.05,0.0):+.4%}")
