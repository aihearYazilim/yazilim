"""Descriptive: premium of TRY crypto quotes vs interbank and vs cross-exchange."""
import numpy as np, pandas as pd
from lib import *
P = hourly()
c = pd.DataFrame({k: v["close"] for k, v in P.items()})
c = c[c.index >= "2021-01-01"]
yh = ld("yh_USDTRYX_1h.csv")["close"]
yd = pd.read_csv("/home/user/yazilim/data/bist/USDTRY.csv", index_col=0, parse_dates=True)["close"]
out = {}
# 1) BtcTurk vs Binance USDTTRY
s = np.log(c.bt_USDTTRY / c.bn_USDTTRY) * 1e4
# 2) Binance triangular: BTCTRY / (BTCUSDT*USDTTRY)
tri = np.log(c.bn_BTCTRY / (c.bn_BTCUSDT * c.bn_USDTTRY)) * 1e4
tri_e = np.log(c.bn_ETHTRY / (c.bn_ETHUSDT * c.bn_USDTTRY)) * 1e4
# 3) BtcTurk BTCTRY vs Binance BTCUSDT*USDTTRY (bt)
bt_tri = np.log(c.bt_BTCTRY / (c.bt_BTCUSDT * c.bt_USDTTRY)) * 1e4
x_btc = np.log(c.bt_BTCTRY / c.bn_BTCTRY) * 1e4
# 4) USDT vs interbank hourly (yahoo hourly, only ~2y)
yhh = yh.copy(); yhh.index = yhh.index.floor("h")
yhh = yhh[~yhh.index.duplicated(keep="last")]
ib = np.log(c.bn_USDTTRY / yhh.reindex(c.index)) * 1e4
# hourly yahoo stamps are bar open; binance index = bar open too; compare close-close same bar
ibt = np.log(c.bt_USDTTRY / yhh.reindex(c.index)) * 1e4
# daily vs yahoo daily close (yahoo daily close ~ 23:00 London) -> use binance 22:00 UTC bar close
d_bn = c.bn_USDTTRY[c.index.hour == 21]; d_bn.index = d_bn.index.normalize().tz_localize(None)
ibd = np.log(d_bn / yd.reindex(d_bn.index)).dropna() * 1e4
def desc(x, name):
    x = x.dropna()
    yr = x.groupby(x.index.year)
    print(f"\n== {name} (bp) n={len(x)}")
    print(pd.DataFrame({"mean": yr.mean(), "med": yr.median(), "absmean": yr.apply(lambda v: v.abs().mean()),
                        "p05": yr.quantile(.05), "p95": yr.quantile(.95), "|x|>30bp%": yr.apply(lambda v: (v.abs() > 30).mean() * 100),
                        "|x|>50bp%": yr.apply(lambda v: (v.abs() > 50).mean() * 100)}).round(1).to_string())
for x, n in [(s, "BtcTurk/Binance USDTTRY"), (tri, "Binance BTCTRY vs BTCUSDT*USDTTRY"), (tri_e, "Binance ETHTRY tri"),
             (bt_tri, "BtcTurk BTCTRY vs own BTCUSDT*USDTTRY"), (x_btc, "BtcTurk BTCTRY / Binance BTCTRY"),
             (ib, "Binance USDTTRY vs Yahoo USDTRY hourly"), (ibt, "BtcTurk USDTTRY vs Yahoo hourly"), (ibd, "Binance USDTTRY 21UTC vs Yahoo daily close")]:
    desc(x, n)
# premium vs interbank by hour of week (UTC), last 2y
hw = ib.dropna(); g = hw.groupby([hw.index.dayofweek, hw.index.hour]).median().unstack()
print("\nmedian Binance-USDT premium vs Yahoo by weekday (rows) x UTC hour, bp\n", g.iloc[:, ::3].round(0).to_string())
pd.DataFrame({"bt_bn": s, "tri": tri, "bt_tri": bt_tri, "x_btc": x_btc, "ib": ib, "ibt": ibt}).to_csv(RAW / "premia_1h.csv")
