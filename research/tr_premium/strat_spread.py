"""Cross-exchange / triangular spread mean-reversion on hourly closes (inventory-based, no transfer latency).
Signal at close t, executed at close t+lag (lag>=1 is realistic for hourly data). Fees per leg per trade.
Return measured on the spread notional N; capital needed ~4N (USDT+TRY inventory on both venues) -> divide by CAPX."""
import itertools, numpy as np, pandas as pd, sys
from lib import *
P = hourly()
c = pd.DataFrame({k: v["close"] for k, v in P.items()}); c = c[c.index >= "2021-01-01"]
SPREADS = {
  "USDT bt/bn": (np.log(c.bt_USDTTRY / c.bn_USDTTRY), 2),
  "BTC bt/bn":  (np.log(c.bt_BTCTRY / c.bn_BTCTRY), 2),
  "ETH bt/bn":  (np.log(c.bt_ETHTRY / c.bn_ETHTRY), 2),
  "BTC tri bt": (np.log(c.bt_BTCTRY / (c.bt_BTCUSDT * c.bt_USDTTRY)), 3),
  "BTC tri bn": (np.log(c.bn_BTCTRY / (c.bn_BTCUSDT * c.bn_USDTTRY)), 3),
  "USDC/USDT bt": (np.log(c.bt_USDCTRY / c.bt_USDTTRY), 2),
  "USDC/USDT bn": (np.log(c.bn_USDCTRY / c.bn_USDTTRY), 2),
}
CAPX = 4.0
def run(s, legs, k, L, ex, fee, lag=1):
    s = s.dropna()
    m = s.rolling(L, min_periods=L // 2).median().shift(1)
    d = (s - m).values; pos = np.zeros(len(s)); p = 0
    kk, ee = k / 1e4, ex * k / 1e4
    for i in range(len(d)):
        x = d[i]
        if np.isnan(x): pos[i] = p; continue
        if p == 0:
            if x > kk: p = -1
            elif x < -kk: p = 1
        elif p == 1 and x > -ee: p = 0 if x < kk else -1
        elif p == -1 and x < ee: p = 0 if x > -kk else 1
        pos[i] = p
    pos = pd.Series(pos, s.index).shift(lag).fillna(0)
    ds = s.diff().fillna(0)
    pnl = pos.shift(1).fillna(0) * ds - pos.diff().abs().fillna(0) * legs * fee
    return pnl / CAPX, int(pos.diff().abs().fillna(0).sum())
def summarize(pnl):
    eq = (1 + pnl).cumprod()
    is_ = eq[eq.index < OOS0]; oos = eq[(eq.index >= OOS0) & (eq.index < OOS1)]
    gi, _ = monthly_geo(is_); go, r = monthly_geo(oos / oos.iloc[0])
    dd = (oos / oos.cummax() - 1).min()
    return gi * 100, go * 100, dd * 100, r.min() * 100
if __name__ == "__main__":
    fee = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0017   # 0.15% fee + 0.02% hourly slippage
    lag = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    rows = []
    for name, (s, legs) in SPREADS.items():
        for k, L, ex in itertools.product([10, 20, 30, 50, 80], [24, 168, 720], [0, 0.5]):
            pnl, n = run(s, legs, k, L, ex, fee, lag)
            gi, go, dd, wm = summarize(pnl)
            rows.append(dict(spread=name, k=k, L=L, ex=ex, IS=gi, OOS=go, OOSdd=dd, worstm=wm, trades=n))
    R = pd.DataFrame(rows)
    R.to_csv(RAW / f"spread_grid_fee{fee}_lag{lag}.csv", index=False)
    print(f"fee/leg={fee} lag={lag}h combos={len(R)}")
    best = R.loc[R.groupby("spread").IS.idxmax()]
    print(best.round(3).to_string(index=False))
