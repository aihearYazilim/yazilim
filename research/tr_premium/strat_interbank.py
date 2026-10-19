"""(1) Physical round-trip arbitrage bank-USD <-> USDT/TRY (both directions), daily, with transit delay.
   (2) USDT vs TRY money-market timing on the USDT premium (z-score).
   (3) Carry baselines: MMF, USDT, USDT+earn."""
import itertools, sys, numpy as np, pandas as pd
sys.path.insert(0, "/home/user/yazilim/src")
from engine import cash_rate_daily
from lib import *
P = hourly()
yd = pd.read_csv("/home/user/yazilim/data/bist/USDTRY.csv", index_col=0, parse_dates=True)["close"]
yd = yd[yd.index >= "2020-10-01"]
def at23(s):
    x = s[s.index.hour == 23]; x.index = x.index.normalize().tz_localize(None); return x
bt = at23(P["bt_USDTTRY"].close); bn = at23(P["bn_USDTTRY"].close)
D = pd.DataFrame({"ib": yd, "bt": bt, "bn": bn}).dropna()
D = D[D.index >= "2021-01-01"]
D["prem"] = np.log(D.bt / D.ib)
cash = cash_rate_daily(D.index)          # daily-compounded TRY MMF per calendar day
gap = pd.Series(D.index, D.index).diff().dt.days.fillna(1)
mmf = (1 + cash) ** gap - 1             # MMF return over each row-to-row interval
IS = D.index < "2025-10-17"; OOSm = (D.index >= "2025-10-17") & (D.index < "2026-10-17")
def geo(r, mask):
    eq = (1 + r[mask]).cumprod(); eq.index = pd.DatetimeIndex(eq.index).tz_localize("UTC")
    g, mr = monthly_geo(pd.concat([pd.Series([1.0], [eq.index[0] - pd.Timedelta(days=1)]), eq]))
    return g * 100, ((eq / eq.cummax()) - 1).min() * 100, mr.min() * 100
# ---------- (1) round trips ----------
# A: buy USD at bank (day t+1 price + bank spread + BSMV), wire abroad, buy USDT, send to TR exchange, sell at t+3.
# B: buy USDT on TR exchange at t (+1h, use t close), send abroad, sell for USD, wire home, sell USD at bank at t+3.
COST_A = 0.005 + 0.002 + 0.0012 + 0.001 + 0.0002 + 0.0015   # bank spread, BSMV, SWIFT out, ext. fee, TRC20, BtcTurk  = 1.09%
COST_B = 0.0015 + 0.0002 + 0.001 + 0.0015 + 0.005           # BtcTurk, TRC20, ext., SWIFT in, bank spread = 0.92%
def roundtrip(direction, k, hold=3):
    r = mmf.copy() * 0; pos_until = -1; trades = 0
    ib, btv, pr = D.ib.values, D.bt.values, D.prem.values
    out = mmf.values.copy()
    i = 0; n = len(D)
    while i < n - hold - 1:
        sig = pr[i] > k if direction == "A" else pr[i] < -k
        if sig:
            if direction == "A": g = np.log(btv[i + 1 + hold] / ib[i + 1]) - COST_A
            else:                 g = np.log(ib[i + hold] / btv[i]) - COST_B
            span = slice(i + 1, i + 1 + hold)
            out[span] = 0.0; out[i + hold] = np.expm1(g)   # capital in transit earns nothing
            trades += 1; i += hold + 1
        else:
            i += 1
    return pd.Series(out, D.index), trades
rows = []
for d, k in itertools.product("AB", [0.005, 0.01, 0.015, 0.02, 0.03]):
    r, n = roundtrip(d, k)
    ni = int(((r.index < "2025-10-17") & (r != mmf)).sum())
    rows.append(dict(test="roundtrip " + d, k=k, IS=geo(r, IS)[0], OOS=geo(r, OOSm)[0], OOSdd=geo(r, OOSm)[1], worstm=geo(r, OOSm)[2],
                     trades=n, trades_OOS=int((D.prem[OOSm] > k).sum() if d == "A" else (D.prem[OOSm] < -k).sum())))
# ---------- (3) baselines ----------
usdt = D.bt.pct_change().fillna(0)
earn = (1.04) ** (gap / 365) - 1
for name, r in [("MMF only", mmf), ("USDT on BtcTurk", usdt), ("USDT + 4%/y earn", (1 + usdt) * (1 + earn) - 1)]:
    rows.append(dict(test=name, k=np.nan, IS=geo(r, IS)[0], OOS=geo(r, OOSm)[0], OOSdd=geo(r, OOSm)[1], worstm=geo(r, OOSm)[2], trades=0))
# ---------- (2) timing: hold USDT when premium z < -z0 (USDT cheap vs interbank), else MMF ----------
FEE = 0.0017
for L, z0, side in itertools.product([20, 60, 120], [0.5, 1.0, 1.5, 2.0], ["cheap", "rich"]):
    m = D.prem.rolling(L).mean(); sd = D.prem.rolling(L).std(); z = (D.prem - m) / sd
    w = (z < -z0) if side == "cheap" else (z > z0)   # 'rich' = momentum: premium rising (TRY stress) -> hold USDT
    w = w.astype(float).shift(1).fillna(0)          # decide at t, hold from t (exec next row)
    r = w * usdt + (1 - w) * mmf - w.diff().abs().fillna(0) * FEE
    rows.append(dict(test=f"timing {side}", k=f"L{L} z{z0}", IS=geo(r, IS)[0], OOS=geo(r, OOSm)[0], OOSdd=geo(r, OOSm)[1],
                     worstm=geo(r, OOSm)[2], trades=int(w.diff().abs().sum())))
R = pd.DataFrame(rows)
pd.set_option("display.width", 200)
print(R.round(3).to_string(index=False))
print("combos:", len(R))
print("premium bt vs interbank by year (bp):", (D.prem.groupby(D.index.year).agg(["mean", "median", lambda v: (v > 0.011).mean()]) * [1e4, 1e4, 100]).round(1).to_string())
R.to_csv(RAW / "interbank_grid.csv", index=False)
