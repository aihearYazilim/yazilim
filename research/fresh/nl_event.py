import pandas as pd, numpy as np
P = pd.read_pickle("nl_panels.pkl"); c = P["close"]; f = P["fund"]; h = P["high"]
cols = [s for s in c.columns if "_" not in s and not any(x in s for x in ["DOM", "DEFIUSDT", "USDCUSDT", "BUSDUSDT", "FDUSD", "TUSD"])]
btc = c["BTCUSDT"]
rows = []
for s in cols:
    x = c[s].dropna()
    if len(x) < 3: continue
    d0 = x.index[0]
    if d0 < pd.Timestamp("2020-01-15"): continue  # pre-panel coins, not "new"
    for L in [1]:
        for H in [30, 60, 90]:
            if len(x) <= L: continue
            e = x.index[L]; xe = x.iloc[L]
            end = min(e + pd.Timedelta(days=H), x.index[-1])
            r = x.asof(end) / xe - 1
            fs = f[s].loc[e + pd.Timedelta(days=1):end].sum()
            rb = btc.asof(end) / btc.asof(e) - 1
            mx = h[s].loc[e + pd.Timedelta(days=1):end].max() / xe - 1
            rows.append(dict(sym=s, d0=d0, H=H, r=r, fund=fs, rbtc=rb, maxup=mx, delisted=end < pd.Timestamp("2026-10-01") and end == x.index[-1]))
E = pd.DataFrame(rows); E["yr"] = E.d0.dt.year
E["short_pnl"] = -E.r + E.fund
E["short_hedged"] = -E.r + E.rbtc + E.fund
g = E.groupby(["H", "yr"]).agg(n=("r", "size"), med_r=("r", "median"), mean_short=("short_pnl", "mean"),
    mean_hedged=("short_hedged", "mean"), hit=("short_pnl", lambda v: (v > 0).mean()), p95up=("maxup", lambda v: v.quantile(.95)), fund=("fund", "mean"))
print(g.round(3).to_string())
E.to_csv("nl_events.csv", index=False)
