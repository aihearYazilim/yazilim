"""Triangle convergence arbitrage on VİOP: XAUTRYM (TL/g) vs XAUUSD (USD/oz) x USDTRY, same expiry.
Signal on day-t settlement deviation; execution at t+1 settlement + slippage + commission on all 3 legs.
Exit when deviation reverts inside X bp (paid exit) or at expiry (cash-settled, no exit cost). USD leg re-hedged daily.
Capital: earns net deposit (policy x 0.85) on part not used as margin (margin = 30% of gold notional for 3 legs)."""
import itertools, numpy as np, pandas as pd
from common import H, OOS0, OOS1, dep_daily, rep
a = pd.read_pickle(H/"raw/tri.pkl"); a = a[a.dte >= 0]
c = a[a.dte >= 5].sort_values(["date","expiry"]).groupby("date").head(1).set_index("date")
dates = pd.DatetimeIndex(sorted(a.date.unique()))
A = {(r.date, r.expiry): (r.settle_t, r.settle_u, r.settle, r.dev_bp) for r in a.itertuples()}
CASH = np.asarray(dep_daily(dates))
def run(E, X, L=2.0, comm=3e-4, slip=(2e-4, 2e-4, 1e-4), margin=0.30, cash=True):
    eq = 1.0; out = []; pos = None; pend = None; trades = []
    for i, d in enumerate(dates):
        e0 = eq
        if pos is not None and (d, pos["exp"]) in A:
            T, U, K, _ = A[(d, pos["exp"])]; g, s = pos["g"], pos["s"]
            eq += s*(g*(T-pos["T"]) - g/31.1035*(pos["U"]*(K-pos["K"]) + (U-pos["U"])*K))
            # daily rehedge of USD leg (h = g*U/31.1035 USD)
            h = g*U/31.1035; eq -= abs(h-pos["h"])*K*(comm+slip[2])
            pos.update(T=T, U=U, K=K, h=h)
            if pend == "exit" and pos["exp"] > d:
                eq -= g*T*(comm+slip[0]) + g/31.1035*U*K*(2*comm+slip[1]+slip[2]); pos["pnl"] = eq; trades.append(pos); pos = None
            elif pos["exp"] <= d:
                trades.append(pos); pos = None
        if pend is not None and pend != "exit" and (d, pend[1]) in A:
            T, U, K, _ = A[(d, pend[1])]; g = L*eq/T
            eq -= g*T*(comm+slip[0]) + g/31.1035*U*K*(2*comm+slip[1]+slip[2])
            pos = dict(s=pend[0], g=g, exp=pend[1], T=T, U=U, K=K, h=g*U/31.1035, d0=d)
        pend = None
        if cash: eq += e0*CASH[i]*(1 - (margin*L if pos is not None else 0))
        out.append(eq)
        if pos is None and d in c.index:
            dv = c.loc[d, "dev_bp"]
            if abs(dv) > E: pend = (1 if dv < 0 else -1, c.loc[d, "expiry"])
        elif pos is not None and X > -900 and (d, pos["exp"]) in A:
            dv = A[(d, pos["exp"])][3]
            if -pos["s"]*dv < X: pend = "exit"
    return pd.Series(out, index=dates), trades
if __name__ == "__main__":
    res = []
    Es = [5, 10, 15, 20, 25, 30, 40, 50]; Xs = [0, 5, -999]
    for E, X in itertools.product(Es, Xs):
        eq, tr = run(E, X); r = rep(eq, f"E{E}_X{X}"); eqs, _ = run(E, X, cash=False); r2 = rep(eqs)
        r.update(spread_IS=r2["IS_geo"], spread_OOS=r2["OOS_geo"], spread_OOS_dd=r2["OOS_dd"], n=len(tr),
                 n_oos=sum(t["d0"] >= OOS0 for t in tr)); res.append(r)
    df = pd.DataFrame(res); print(df.to_string()); df.to_csv(H/"raw/tri_grid.csv", index=False)
    cash_only = rep(pd.Series(np.cumprod(1+CASH), index=dates), "deposit only"); print(cash_only)
