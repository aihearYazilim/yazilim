"""Bank gold account + short VİOP XAUTRYM (rolled 5d before expiry) = synthetic TL deposit at the gold-futures carry.
Spot gram gold proxy = Yahoo GC=F x USDTRY=X / 31.1035 (COMEX front and close-time mismatch -> daily noise only; the
long-run return is pinned by the futures basis). Bank spread s (round trip), BSMV 0.2% on purchases. Gold weight w,
rest cash at VİOP (margin 12% of notional earns nothing, excess earns net deposit). Rebalance when free cash < 3% or > 35%
of equity (pays half-spread on traded gold). Variant 'switch': hold only when XAUTRYM calendar rate - net deposit > h."""
import itertools, numpy as np, pandas as pd
from common import H, rep, policy
from contret import cont
g = pd.read_csv(H/"raw/viop_gold.csv", parse_dates=["date","expiry"]); g = g[g.root=="F_XAUTRYM"]
fr = cont(g)                                   # short-futures daily return (settle-to-settle, roll 5d)
y = pd.read_pickle(H/"raw/yahoo.pkl").dropna()
import sys
if "--yahoo" in sys.argv:
    spot = (y.gc*y.usdtry/31.1035)
else:   # unbiased spot proxy: front XAUTRYM discounted at XAUTRYM calendar rate (Yahoo GC=F continuous has roll jumps ~ +0.3%/mo bias)
    _c = pd.read_pickle(H/"raw/curve.pkl").xautry_impl
    _g = g[(g.expiry-g.date).dt.days >= 3].sort_values(["date","expiry"]).groupby("date").head(1).set_index("date")
    spot = _g.settle/(1+_c.reindex(_g.index).ffill().fillna(0.15))**((_g.expiry-_g.index).dt.days/365)
idx = fr.index.intersection(spot.index)
sr = spot.reindex(fr.index).ffill().pct_change().reindex(idx)  # gold spot return
fr = fr.reindex(idx); dep = (policy(idx)*0.85).values
cal = pd.read_pickle(H/"raw/curve.pkl").xautry_impl.reindex(idx).ffill().values
gap = np.r_[1, np.diff(idx.values).astype("timedelta64[D]").astype(int)]
def run(s=0.015, w=0.75, cV=3e-4, slip=2e-4, h=None, bsmv=0.002):
    G, Cs, eqs, on = 0.0, 1.0, [], False   # G gold value (marked at mid), Cs cash incl. futures P&L; futures notional = G
    for i in range(len(idx)):
        if on:
            Cs -= G*fr.values[i]; G *= 1+sr.values[i]
            # roll cost every ~42 trading days (2 legs)
            Cs -= G*2*(cV+slip)/42
        free = Cs - 0.12*G
        if free > 0: Cs += free*((1+dep[i])**(gap[i]/365)-1)
        eq = G*(1 - s/2) + Cs          # liquidation value (bank bid)
        want = True if h is None else (cal[i] - dep[i] > h if not np.isnan(cal[i]) else on)
        if want and not on:
            G = w*eq; Cs = eq - G*(1+s/2+bsmv) - G*(cV+slip); on = True
        elif not want and on:
            Cs += G*(1-s/2) - G*(cV+slip); G = 0; on = False
        elif on:
            e = G + Cs
            if Cs/e < 0.03 + 0.12*G/e or Cs/e > 0.35:
                tgt = w*e; d = tgt - G
                Cs -= d + abs(d)*(s/2) + (bsmv*d if d > 0 else 0) + abs(d)*(cV+slip); G = tgt
        eqs.append(G*(1-s/2) + Cs)
    return pd.Series(eqs, index=idx)
if __name__ == "__main__":
    out = []
    for s, w in itertools.product([0.01, 0.02, 0.03], [0.70, 0.80]):
        out.append(rep(run(s, w), f"always_s{s}_w{w}"))
    for s, h in itertools.product([0.01, 0.02], [0.0, 0.05, 0.10]):
        out.append(rep(run(s, 0.75, h=h), f"switch_s{s}_h{h}"))
    out.append(rep(pd.Series(np.cumprod((1+dep)**(gap/365)), index=idx), "deposit"))
    df = pd.DataFrame(out); print(df.to_string()); df.to_csv(H/"raw/bank_cc.csv", index=False)
    c = pd.DataFrame({"cal": cal, "dep": dep}, index=idx); print((c.resample("YE").median()*100).round(1).T)
