"""Event study for venue events. Entry = open of first Binance-perp 1h bar at/after announcement; returns to close at
entry+h-1h; raw and minus BTC. Short-side P&L = -return. Also the Binance CMS events for reference."""
import sys, pathlib, pandas as pd, numpy as np
H = pathlib.Path(__file__).parent; sys.path.insert(0, str(H))
import common as C
HZ = [1, 4, 24, 72, 168, 720]
BTC = C.k1h("BTCUSDT")
# equal-weight Binance-perp alt index (daily, close-to-close, ex BTC, live symbols only) as a market baseline
_c = C.T.C.drop(columns=["BTCUSDT"]); _r = _c.pct_change(fill_method=None).where(C.T.V.drop(columns=["BTCUSDT"]) > 0).clip(-0.5, 0.5)
ALT = (1 + _r.mean(axis=1).fillna(0)).cumprod()
def es(E):
    rows = []
    for _, e in E.iterrows():
        try: k = C.k1h(e.sym)
        except FileNotFoundError: continue
        t0 = e.ts.ceil("h")
        if t0 not in k.index: continue
        p0 = k.open[t0]; b0 = BTC.open.get(t0, np.nan)
        r = dict(venue=e.venue, type=e.type, sym=e.sym, ts=e.ts, overlap=e.get("overlap", False), oos=e.ts >= pd.Timestamp("2025-10-17"))
        for h in HZ:
            t1 = t0 + pd.Timedelta(hours=h - 1)
            if t1 in k.index:
                r[f"r{h}"] = k.close[t1] / p0 - 1; r[f"a{h}"] = r[f"r{h}"] - (BTC.close.get(t1, np.nan) / b0 - 1)
                if h >= 24:   # minus alt index (daily granularity: day before entry -> day of exit)
                    d0 = t0.normalize() - pd.Timedelta(days=1); d1 = t1.normalize()
                    if d1 in ALT.index: r[f"x{h}"] = r[f"r{h}"] - (ALT[d1] / ALT[d0] - 1)
        rows.append(r)
    return pd.DataFrame(rows)
def summ(g, pre="a"):
    out = {"n": len(g)}
    for h in HZ:
        x = g[f"{pre}{h}"].dropna() if f"{pre}{h}" in g else pd.Series(dtype=float)
        x = x.clip(-1, 3)   # winsorise extreme squeezes
        out[f"{h}h"] = f"{x.mean()*100:+.1f}/{x.median()*100:+.1f} t{x.mean()/x.std()*np.sqrt(len(x)):+.1f}" if len(x) > 2 else ""
    return pd.Series(out)
if __name__ == "__main__":
    E = C.load_events()
    BE = pd.read_csv(H.parent / "crypto_events/cms_events.csv", parse_dates=["ts"]); BE = BE[BE.type.isin(["MON", "DEL", "LIST"])]; BE = BE[[C.tradable(a, b) for a, b in zip(BE.sym, BE.ts)]]; BE["venue"] = "BINANCE"; BE["overlap"] = False
    R = pd.concat([es(E), es(BE)]); R.to_csv(H / "es_venue.csv", index=False)
    pd.set_option("display.width", 250)
    R["period"] = np.where(R.oos, "OOS", "IS")
    for pre in ["a", "r", "x"]:
        print("== mean/median %, t (", {"a": "minus BTC", "r": "raw", "x": "minus EW alt index"}[pre], ") ; short P&L = minus these")
        print(R.groupby(["type", "venue"]).apply(summ, pre=pre).to_string())
        print(R.groupby(["type", "venue", "period"]).apply(summ, pre=pre).to_string())
    I = R[(R.venue != "BINANCE") & (~R.overlap.astype(bool))]
    print("== independent only (no Binance event on same sym +-7d), minus BTC")
    print(I.groupby(["type", "venue"]).apply(summ, pre="a").to_string())
    print(I.groupby(["type", "venue"]).apply(summ, pre="x").to_string())
    print(I.groupby(["type", "venue", "period"]).apply(summ, pre="a").to_string())
