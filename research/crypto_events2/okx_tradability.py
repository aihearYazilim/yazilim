"""Is the Binance book tradable elsewhere? (1) coverage: share of Binance-book events whose token has a (currently live)
OKX USDT-swap / Bitget USDT-M contract; (2) for OKX-covered CMS events, re-price the same fixed-rule trade on OKX 1h
candles (hourly stop path, entry slip 0.5%, stop slip 1%, fee 0.2%/side, Binance funding) vs the identical trade on
Binance 1h candles; UNL: entry close day-10 -> exit close day+3 on both venues (UTC daily closes from 1h)."""
import sys, pathlib, json, pandas as pd, numpy as np
H = pathlib.Path(__file__).parent; sys.path.insert(0, str(H)); import common as C
pd.set_option("display.width", 220)
OK = H / "raw/okx_k1h"
bg = {x["symbol"] for x in json.load(open(H / "raw/bitget_usdt_contracts.json"))["data"]}
def okx_k(sym):
    k = pd.read_csv(OK / f"{sym}.csv"); k.index = pd.to_datetime(k.ts, unit="ms"); return k
CE = C.T.CE[C.T.CE.type.isin(["MON", "DEL", "LIST"])]
CE = CE[[C.tradable(s, t) for s, t in zip(CE.sym, CE.ts)]]
def bgc(s): return s in bg or (s.startswith("1000") and s[4:] in bg) or ("1000" + s) in bg
rows = []
binance_k1h = C.k1h
for _, e in CE.iterrows():
    hh, st = C.BOOK[e.type]
    C.T.k1h = binance_k1h; C._K.pop(e.sym, None)
    a = C.X.trade(e.sym, e.ts, hh, st, None, 0.005, 0.01, path1m=False)
    b = None
    if (OK / f"{e.sym}.csv").exists():
        C.T.k1h = lambda s, _k=okx_k(e.sym): _k
        b = C.X.trade(e.sym, e.ts, hh, st, None, 0.005, 0.01, path1m=False)
    C.T.k1h = binance_k1h
    rows.append(dict(tag=e.type, sym=e.sym, ts=e.ts, okx=(OK / f"{e.sym}.csv").exists(), bitget=bgc(e.sym),
                     r_bn=float(a["path"].iloc[-1]) if a else np.nan, r_okx=float(b["path"].iloc[-1]) if b else np.nan,
                     okx_qvol24=(okx_k(e.sym).loc[e.ts.ceil("h") - pd.Timedelta(hours=24): e.ts.ceil("h")].qvol.sum() if b else np.nan),
                     trade_okx=b))
C.T.k1h = binance_k1h
for t in C.T.unlock_trades(*C.UNL[1:]):
    s = t["sym"]; d0 = t["d0"]; d1 = t["path"].index[-1]
    rb = float(t["path"].iloc[-1]); ro = np.nan; tro = None
    if (OK / f"{s}.csv").exists():
        k = okx_k(s); cl = k.close.resample("D").last()
        if d0 in cl.index and d1 in cl.index and pd.notna(cl[d0]) and pd.notna(cl[d1]):
            ro = -(cl[d1] / cl[d0] - 1) - 0.004 - (rb - (-(C.T.C[s][d1] / C.T.C[s][d0] - 1) - 0.004))  # same funding adj. as Binance
            tro = dict(t); tro["path"] = t["path"] * 0 + np.nan; tro["path"].iloc[-1] = ro
            idx = t["path"].index; pr = cl.reindex(idx).ffill()
            tro["path"] = (t["path"] - (-(C.T.C[s].reindex(idx) / C.T.C[s][d0] - 1))) + (-(pr / cl[d0] - 1))
    rows.append(dict(tag="UNL", sym=s, ts=d0, okx=pd.notna(ro), bitget=bgc(s), r_bn=rb, r_okx=ro, okx_qvol24=np.nan, trade_okx=tro))
R = pd.DataFrame(rows); R["oos"] = R.ts >= pd.Timestamp("2025-10-17")
print("coverage (share of Binance-book events with a live venue contract):")
print(R.groupby(["tag", "oos"]).agg(n=("sym", "size"), okx=("okx", "mean"), bitget=("bitget", "mean")).round(2).to_string())
M = R.dropna(subset=["r_okx", "r_bn"])
print("paired trades, mean net return per trade (Binance price vs OKX price):")
print(M.groupby(["tag", "oos"]).agg(n=("sym", "size"), bn=("r_bn", "mean"), okx=("r_okx", "mean"),
      corr=("r_bn", lambda x: np.corrcoef(x, M.loc[x.index, "r_okx"])[0, 1] if len(x) > 2 else np.nan),
      med_okx_qvol24_musd=("okx_qvol24", lambda x: x.median() / 1e6)).round(3).to_string())
# book on the OKX-covered subset, priced on Binance vs OKX
okx_trs = [r.trade_okx for r in M.itertuples() if r.trade_okx is not None]
for t in okx_trs: t.setdefault("tag", "x")
keys = {(r.sym, r.ts.normalize() if r.tag != "UNL" else r.ts) for r in M.itertuples()}
bn_all = C.T.unlock_trades(*C.UNL[1:]) + C.X.cms_book(None, 0.005, 0.01, path1m=False)
bn_sub = [t for t in bn_all if (t["sym"], t["d0"]) in {(s, d.normalize()) for s, d in keys}]
for nm, trs in [("Binance price, OKX-covered subset", bn_sub), ("OKX price, same subset", okx_trs)]:
    for s in (0.1, 0.2):
        out = {w: C.window(trs, a, b, s)[0] for w, a, b in [("IS", "2022-01-01", "2025-10-16"), ("OOS", "2025-10-17", "2026-10-16")]}
        print(nm, s, {w: (d["usd"], d["try_"], d["dd"], d["n"]) for w, d in out.items()})
R.drop(columns=["trade_okx"]).to_csv(H / "okx_tradability.csv", index=False)
