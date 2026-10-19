"""Multi-coin 'rebalancing bot' (Binance-style portfolio bot) on ALT20 and MAJ6, hourly closes from 1m data.
Coin share x of capital split equally across coins, rest USDT. Rebalance: periodic (H hours) or threshold
(any coin's weight deviates from target by > th relative). Taker 0.1% + slippage (0.05% majors/0.1% alts) on turnover."""
import numpy as np, pandas as pd, itertools
from lib import *
from sweep import IS_W
from analyze import FXP, ODAYS, oos_metrics

def hourly(sym):
    z = np.load(RAW / f"{sym}_1m.npz")
    s = pd.Series(z["c"], index=pd.to_datetime(z["t"] * 60, unit="s"))
    return s.resample("1h").last()

def sim(px, a, b, x, mode, par, fee):
    P = px.loc[a:b - pd.Timedelta(hours=1)]
    P = P.loc[:, P.iloc[0].notna() & (px.loc[:a].notna().sum() > 24 * 90)].ffill()
    R = P.values; n = R.shape[1]; tw = x / n
    units = tw / R[0] * (1 - fee); cash = 1 - x
    eq = np.empty(len(R)); last = 0
    for i in range(len(R)):
        v = units * R[i]; E = cash + v.sum(); eq[i] = E
        due = (mode == 0 and i - last >= par) or (mode == 1 and np.any(np.abs(v / E - tw) > par * tw))
        if due and i > 0:
            tgt = tw * E / R[i]; trade = np.abs(tgt - units) * R[i]
            cost = trade.sum() * fee
            units = tgt; cash = E * (1 - x) - cost; last = i
            eq[i] = cash + (units * R[i]).sum()
    return pd.Series(eq, index=P.index).resample("1D").last()

def main():
    res = []
    for name, syms, slip in [("ALT20", ALTS, 0.001), ("MAJ6", MAJ, 0.0005)]:
        px = pd.DataFrame({s: hourly(s) for s in syms})
        fee = 0.001 + slip
        grid = [(x, 0, h) for x in (1.0, 0.5) for h in (10**9, 24, 168, 720)] + \
               [(x, 1, th) for x in (1.0, 0.5) for th in (0.05, 0.1, 0.2, 0.4)]
        for x, mode, par in grid:
            gs = []
            for k, a in enumerate(IS_W):
                e = sim(px, a, a + pd.DateOffset(months=12), x, mode, par, fee)
                gs.append(e.iloc[-1] ** (1 / 12) - 1)
            e = sim(px, OOS0, OOS1, x, mode, par, fee)
            om = oos_metrics(e.reindex(ODAYS).ffill().values)
            res.append(dict(uni=name, x=x, mode=["periodic_h", "thresh"][mode], par=par, is_med=np.median(gs),
                            is_min=min(gs), **om))
            print(res[-1], flush=True)
    pd.DataFrame(res).to_csv(HERE / "out_basket_rebal.csv", index=False)

if __name__ == "__main__":
    main()
