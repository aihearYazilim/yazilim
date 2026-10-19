"""Cash-and-carry: long ALTIN.S1 (Darphane gold certificate, 0.01 g) + short VİOP F_XAUTRYM (1 g), held to expiry and
rolled (S1 kept, only futures rolled) while the signal is on; otherwise net TL deposit.
Signal on day t (S1 close/ask & futures settle), executed t+1: S1 bought at ask / sold at bid (+ comm), futures at settle
+ slip + comm. Margin 12% of futures notional in VİOP (earns nothing), S1 sized so S1 value + margin + 3% buffer = equity.
Signal: annualized basis (F/ (100*S1_ask))^(365/dte)-1  minus ref  > h,  ref = net deposit rate or XAUTRYM calendar rate."""
import itertools, numpy as np, pandas as pd
from common import H, OOS0, OOS1, rep, policy
s1 = pd.read_pickle(H/"raw/s1.pkl")
g = pd.read_csv(H/"raw/viop_gold.csv", parse_dates=["date","expiry"]); g = g[g.root=="F_XAUTRYM"]
cur = pd.read_pickle(H/"raw/curve.pkl")
F = {(r.date, r.expiry): r.settle for r in g.itertuples()}
EXP = g.groupby("date").expiry.apply(lambda x: sorted(x)).to_dict()
dates = pd.DatetimeIndex(sorted(set(s1.index) & set(EXP)))
s1 = s1.reindex(dates)
s1["close"] = s1.close.where(s1.close > 0).ffill()
ok = (s1.ask > 0) & (s1.bid > 0)
hs = ((s1.ask - s1.bid)/(s1.ask+s1.bid)).where(ok & (s1.ask >= s1.bid))
hs = hs.where(hs < 0.02).fillna(hs.rolling(20, min_periods=1).median()).fillna(0.002)
# limit-up (ask==0) -> cannot buy; limit-down (bid==0) -> cannot sell
CANBUY = (s1.ask.fillna(0) > 0).values; CANSELL = (s1.bid.fillna(0) > 0).values
ASK = (s1.close*(1+hs)).values; BID = (s1.close*(1-hs)).values; CL = s1.close.values
# premium ratio: S1*100 / spot implied by front XAUTRYM discounted at XAUTRYM calendar rate
def _ratio():
    out = []
    for i, d in enumerate(dates):
        e = [x for x in EXP[d] if (x-d).days >= 3][0]; c = cur.xautry_impl.get(d, np.nan)
        c = 0.4 if np.isnan(c) else c
        out.append(CL[i]*100/(F[(d, e)]/(1+c)**((e-d).days/365)))
    return np.array(out)
RATIO = _ratio()
DEP = (policy(dates)*0.85).values
CAL = cur.xautry_impl.reindex(dates).ffill().values
gap = np.r_[1, np.diff(dates.values).astype("timedelta64[D]").astype(int)]
def pick(d, m):
    e = [x for x in EXP[d] if (x-d).days >= m]; return e[0] if e else None
def run(ref="dep", h=0.0, m=10, sig=None, cB=1.4e-3, cV=3e-4, slipV=2e-4, margin=0.12, buf=0.03, always=False):
    cash, q, fut, eqs, ntr = 1.0, 0.0, None, [], 0   # q = grams held via S1 ; fut = dict(exp, g, px)
    want = False
    for i, d in enumerate(dates):
        # mark futures
        if fut is not None:
            px = F.get((d, fut["exp"]))
            if px is not None: cash -= fut["g"]*(px - fut["px"]); fut["px"] = px
        eq = cash + q*CL[i]*100
        # execute yesterday's decision at today's prices
        if want and q == 0 and CANBUY[i]:
            tgt = eq/(1+margin+buf); q = tgt/(ASK[i]*100); cost = q*ASK[i]*100*cB
            cash -= q*ASK[i]*100 + cost; ntr += 1
            e = pick(d, m); fut = dict(exp=e, g=q, px=F[(d, e)]); cash -= q*fut["px"]*(cV+slipV)
        elif not want and q > 0 and CANSELL[i]:
            cash += q*BID[i]*100*(1-cB); q = 0.0
            if fut is not None and fut["exp"] > d: cash -= fut["g"]*fut["px"]*(cV+slipV)
            fut = None
        # expiry: final settlement already marked; roll if still wanted
        if fut is not None and fut["exp"] <= d:
            fut = None
            if q > 0:
                e = pick(d, m); fut = dict(exp=e, g=q, px=F[(d, e)]); cash -= q*fut["px"]*(cV+slipV)
        # interest on free cash (cash minus margin) ; cash can carry futures P&L
        free = cash - (margin*fut["g"]*fut["px"] if fut else 0)
        if free > 0: cash += free*((1+DEP[i])**(gap[i]/365)-1)
        eq = cash + q*CL[i]*100; eqs.append(eq)
        # signal
        e = pick(d, m)
        if sig is not None:
            want = sig(i, q > 0)
        elif always: want = True
        elif e is None or np.isnan(ASK[i]): want = want
        else:
            dte = (e-d).days
            ann = (F[(d, e)]/(ASK[i]*100))**(365/max(dte, 1)) - 1
            r = DEP[i] if ref == "dep" else CAL[i]
            if np.isnan(r): r = DEP[i]
            want = (ann - r) > h if q == 0 else (ann - r) > h - 0.02   # 2pp hysteresis to stay
    return pd.Series(eqs, index=dates), ntr
if __name__ == "__main__":
    out = []
    for m in [10, 30]:
        eq, n = run(m=m, always=True); r = rep(eq, f"always_m{m}"); r["n"] = n; out.append(r)
    for ref, h, m in itertools.product(["dep","cal"], [-0.05, 0, 0.02, 0.05, 0.10, 0.20], [10, 30]):
        eq, n = run(ref, h, m); r = rep(eq, f"{ref}_h{h}_m{m}"); r["n"] = n; out.append(r)
    dep = pd.Series(np.cumprod((1+DEP)**(gap/365)), index=dates); out.append(rep(dep, "deposit"))
    df = pd.DataFrame(out); print(df.to_string()); df.to_csv(H/"raw/cc_grid.csv", index=False)
    print("sample:", dates.min(), dates.max(), len(dates))
def prem_rule(lo, hi):
    return lambda i, held: (RATIO[i] < hi) if held else (RATIO[i] < lo)
def prem_q(ql, qh, w=250):
    R = pd.Series(RATIO)
    L = R.rolling(w, min_periods=120).quantile(ql).values; U = R.rolling(w, min_periods=120).quantile(qh).values
    return lambda i, held: False if np.isnan(L[i]) else ((RATIO[i] < U[i]) if held else (RATIO[i] < L[i]))
