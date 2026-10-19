from common import R, ORIG
import numpy as np, pandas as pd, datetime as dt
ch, deliv, dv, px, h = R.ch, R.deliv, R.dv, R.px, R.hpx
W = R.ENT["W"]
print("weekly entries", len(W), {c: sum(e["cur"]==c for e in W) for c in ("BTC","ETH")})
# missing weeks
days = pd.date_range("2021-03-26","2026-10-09",freq="7D").strftime("%Y-%m-%d")
for c in ("BTC","ETH"):
    have = {e["day"] for e in W if e["cur"]==c}
    miss = [d for d in days if d not in have]
    print(c, "missing weekly entries:", len(miss), miss[:40])
# entry timestamps
et = pd.to_datetime(ch.entry_ts, format="ISO8601")
print("entry ts hour range:", et.dt.hour.min(), et.dt.hour.max(), "min minute at 08h:", et[et.dt.hour==8].dt.minute.min())
# DVOL semantics: ts = candle open 00:00 UTC of 'date'; close = value at next 00:00
d = R.dv["BTC"]; print(d.head(3))
# delivery vs binance hourly price at 08:00 (open of 08:00 candle)
hh = {c: pd.read_csv(ORIG.parents[1]/"data/crypto_1h"/f"{c}.csv", index_col=0, parse_dates=True) for c in ("BTC","ETH")}
for c in ("BTC","ETH"):
    rel = []
    for e in W:
        if e["cur"]!=c or not np.isfinite(e["S"]): continue
        t = pd.Timestamp(e["expiry"]) + pd.Timedelta(hours=7, minutes=0)
        if t in hh[c].index:
            p = hh[c].loc[t, "close"]   # 07:00 candle close = price at 08:00
            rel.append(e["S"]/p - 1)
    rel = np.array(rel); print(c, "deliv vs binance 08:00: n", len(rel), "median", np.median(rel).round(5), "max abs", np.abs(rel).max().round(4))
    # entry S0 vs binance 08:00 on entry day
    rel=[]
    for e in W:
        if e["cur"]!=c: continue
        t = pd.Timestamp(e["day"]) + pd.Timedelta(hours=8)
        if t in hh[c].index: rel.append(e["S0"]/hh[c].loc[t,"close"]-1)
    rel=np.array(rel); print(c, "S0 vs binance 08-09h close: median", np.median(rel).round(5), "p99 abs", np.quantile(np.abs(rel),.99).round(4))
# NaN settlements
print("entries with NaN S:", sum(not np.isfinite(e["S"]) for e in W))
# T distribution
print("T days:", pd.Series([e["T"]*365 for e in W]).describe().round(3).to_dict())
