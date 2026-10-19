"""Cross-exchange funding spread: Binance USDT-M vs Hyperliquid perps (same coin, opposite sides).
Signal = trailing L-day mean of (HL daily funding - Binance daily funding). For top-K coins by |signal| (> thr annualised):
spread>0 -> short HL perp, long Binance perp (and vice versa). P&L includes both legs' price returns
(cross-exchange basis), both fundings and 0.10%/trade per leg. E = notional per leg / total equity."""
import itertools, pathlib, numpy as np, pandas as pd, lib
D = pathlib.Path(__file__).parent / "data"
DAY = 86400000

def load_hl():
    F, PX = {}, {}
    for f in (D / "hl").glob("*.csv"):
        x = pd.read_csv(f)
        if x.empty: continue
        day = (x.ts - 1) // DAY * DAY
        s = x.groupby(day).rate.sum(); s.index = pd.to_datetime(s.index, unit="ms")
        n = x.groupby(day).rate.count(); s[n.reindex(s.index) < 20] = np.nan  # incomplete days
        F[f.stem + "USDT"] = s
        k = pd.read_csv(D / "hl_px" / f.name); k.index = pd.to_datetime(k.ts, unit="ms").dt.normalize()
        PX[f.stem + "USDT"] = k.close
    return pd.DataFrame(F), pd.DataFrame(PX)

def run(L, K, thr, H, E=1.0, fee=lib.FEE_PERP):
    p = lib.P()
    fh, ph = load_hl()
    cols = [c for c in fh.columns if c in p["perp"].columns]
    idx = p["perp"].index[p["perp"].index >= "2023-05-15"]
    fh, ph = fh.reindex(idx)[cols], ph.reindex(idx)[cols]
    fb, pb = p["fund"].reindex(idx)[cols], p["perp"].reindex(idx)[cols]
    spread = (fh - fb).rolling(L, min_periods=L).mean()
    ok = ph.notna() & pb.notna() & spread.notna()
    sig = spread.where(ok)
    rk = sig.abs().rank(axis=1, ascending=False, method="first")
    sel = (rk <= K) & (sig.abs() > thr / 365)
    w_hl = -np.sign(sig).where(sel, 0).fillna(0) * E / K      # short HL when HL funding richer
    reb = pd.Series(np.arange(len(idx)) % H == 0, index=idx)
    w_hl = w_hl.where(reb, np.nan).ffill().fillna(0.0)
    w_hl = w_hl.where(ok, 0.0)
    w_bn = -w_hl
    net = pd.Series(0.0, index=idx)
    for w, px, f in [(w_hl, ph, fh), (w_bn, pb, fb)]:
        r = lib.rets(px); wl = w.shift(1).fillna(0)
        net += (wl * (r - f.fillna(0))).sum(1) - (w - wl * (1 + r)).abs().sum(1) * fee
    return net

GRID = dict(L=[3, 7, 14, 30], K=[1, 3, 5], thr=[0.0, 0.10, 0.25], H=[1, 7])
if __name__ == "__main__":
    import pickle
    res = {k: run(*k) for k in itertools.product(*GRID.values())}
    pickle.dump(res, open(D / "xex_grid.pkl", "wb"))
    df = pd.DataFrame([dict(key=k, **lib.summarize(v, is_start="2023-06-01")) for k, v in res.items()]).sort_values("IS_geo", ascending=False)
    print(df.drop(columns=["name", "lev", "ncomb"]).to_string())
