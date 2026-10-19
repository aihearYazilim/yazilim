"""Regime gates for the Binance event-short book (audit scenario B trades: UNL daily + MON/DEL/LIST on 1m path,
entry slip 0.5%, stop slip 1%, fee 0.2%/side, real funding, BTC hedge, G=2, corrected port_fix sim with fresh $100k per
window). A gate maps ex-ante information (data through day d0-1 close only) to a per-trade size s in {0, 0.1, 0.2}."""
import sys, pathlib, pickle, pandas as pd, numpy as np
H = pathlib.Path(__file__).parent; R = H.parent
sys.path.insert(0, str(R / "crypto_events2")); import common as C
T, PF = C.T, C.PF
IDX = T.IDX; POS = T.POS
D = pickle.load(open(R / "crypto_events2/raw/trades.pkl", "rb"))
TRS = D["unl"] + D["bcms"]
for i, t in enumerate(TRS): t["id"] = i
WIN = [("IS", "2022-01-01", "2025-10-16"), ("OOS", "2025-10-17", "2026-10-16")]

# ---------------- portfolio sim with per-trade size (copy of port_fix.sim; only change: n = s_tr*eq) -------------
def sim(trs, sizes, G=2.0, start="2022-01-01", end="2025-10-16", cap0=100_000.0, liq=0.01, hedge_cost=0.001):
    st, en = pd.Timestamp(start), pd.Timestamp(end); btc_r, btc_f = PF.btc_r, PF.btc_f
    by_day = {}
    for tr in trs:
        if st <= tr["d0"] <= en and sizes.get(tr["id"], 0) > 0: by_day.setdefault(tr["d0"], []).append(tr)
    eq = 1.0; out = np.zeros(len(IDX)); open_ = []; hed = 0.0; log = []
    for t, d in enumerate(IDX):
        if d < st: continue
        eq0 = eq; pnl = 0.0; keep = []
        for p in open_:
            tr, n, lc = p; path = tr["pd"]
            if d in path: c = path[d]; pnl += n * (c - lc); p[2] = c
            if d < tr["dend"]: keep.append(p)
        open_ = keep
        if t > 0: pnl += hed * (btc_r[t] - btc_f[t])
        gross = sum(abs(p[1]) * (1 - p[2]) for p in open_)
        for tr in by_day.get(d, []):
            if any(p[0]["sym"] == tr["sym"] for p in open_): continue
            s = sizes[tr["id"]]; n = s * eq0
            frac = min(1.0, liq * tr["vol"] / (cap0 * eq0) / s)
            if frac < 0.2: continue
            n *= frac
            if gross + n > G * eq0 + 1e-12: continue
            c = tr["pd"].get(d, None); c0 = c if c is not None else -T.FEE
            pnl += n * c0; p = [tr, n, c0]
            if len(tr["pd"]) > 1 or tr["dend"] > d: open_.append(p)
            gross += n; log.append((tr["tag"], tr["sym"], d, n, tr["ret"], frac, s))
        eq = eq0 + pnl
        net = sum(p[1] * p[0]["side"] for p in open_); tgt = -net
        eq -= abs(tgt - hed) * hedge_cost; hed = tgt
        if eq <= 0: out[t] = -1; break
        out[t] = eq / eq0 - 1
        if d > en and not open_: break
    r = pd.Series(out, IDX)[st:]; r.attrs["log"] = log
    return r
for t in TRS:
    t["pd"] = t["path"].to_dict(); t["dend"] = t["path"].index[-1]; t["ret"] = float(t["path"].iloc[-1])

def stats(r, a, b):
    e = (1 + r[a:b]).cumprod(); m = e.resample("ME").last(); m = pd.concat([pd.Series([1.0], [e.index[0]]), m]); mr = m.pct_change().dropna()
    geo = e.iloc[-1] ** (1 / len(mr)) - 1; dd = (e / e.cummax() - 1).min()
    x = r[a:b]; sr = x.mean() / x.std() if x.std() > 0 else 0.0
    return dict(geo=round(geo * 100, 2), dd=round(dd * 100, 1), worst=round(mr.min() * 100, 1), sr=sr, mr=mr)
def run(sizes):
    out = {}; ser = {}
    for nm, a, b in WIN:
        r = sim(TRS, sizes, start=a, end=b); rt = (1 + r) * (1 + PF.fx[r.index]) - 1
        u = stats(r, a, b); tt = stats(rt, a, b)
        out.update({f"{nm}_usd": u["geo"], f"{nm}_try": tt["geo"], f"{nm}_dd": u["dd"], f"{nm}_worst": u["worst"],
                    f"{nm}_sr": round(u["sr"] * np.sqrt(365), 2), f"{nm}_n": len(r.attrs["log"])})
        ser[nm] = r
    o = ser["OOS"]; m = (1 + o).resample("ME").prod() - 1
    out["OOS_25-10..26-02"] = round(((1 + o["2025-10-17":"2026-02-28"]).prod() - 1) * 100, 1)
    out["OOS_26-03..05"] = round(((1 + o["2026-03-01":"2026-05-31"]).prod() - 1) * 100, 1)
    out["OOS_26-06..10"] = round(((1 + o["2026-06-01":"2026-10-16"]).prod() - 1) * 100, 1)
    out["IS_25-01..05"] = round(((1 + ser["IS"]["2025-01-01":"2025-05-31"]).prod() - 1) * 100, 1)
    return out, ser

# ---------------- ex-ante signals: value at day d uses information through d-1 close ----------------
def _shift(s): return s.reindex(IDX).shift(1)
# shadow book: every trade at unit notional, daily P&L increments (known at each day's close)
def shadow_daily():
    inc = pd.Series(0.0, IDX)
    for t in TRS:
        p = t["path"]; d = p.diff(); d.iloc[0] = p.iloc[0]; inc = inc.add(d.reindex(IDX).fillna(0), fill_value=0)
    return inc
SH = shadow_daily()
CL = pd.DataFrame([(t["dend"], t["ret"]) for t in TRS], columns=["dend", "ret"])
def own_mtm(N): return _shift(SH.rolling(N, min_periods=1).sum())
def own_closed(N):
    s = CL.groupby("dend").ret.sum().reindex(IDX).fillna(0); return _shift(s.rolling(N, min_periods=1).sum())
def own_hit(N, minn=3):
    w = (CL.ret > 0).astype(float).groupby(CL.dend).sum().reindex(IDX).fillna(0).rolling(N, min_periods=1).sum()
    n = CL.groupby("dend").ret.size().reindex(IDX).fillna(0).rolling(N, min_periods=1).sum()
    return _shift((w / n).where(n >= minn))
CE = T.CE
def evt(N, types=("MON", "DEL", "FDEL")):
    e = CE[CE.type.isin(types)]; c = e.groupby(e.ts.dt.normalize()).sym.nunique().reindex(IDX).fillna(0)
    return _shift(c.rolling(N, min_periods=1).sum())
alts = [c for c in T.C.columns if c != "BTCUSDT"]
Ca = T.C[alts].where(T.V[alts] > 0)
def breadth(M):
    ma = Ca.rolling(M, min_periods=M).mean(); ok = ma.notna() & Ca.notna()
    n = ok.sum(axis=1).astype(float); return _shift(((Ca > ma) & ok).sum(axis=1) / n.where(n >= 10))
_ar = Ca.pct_change(fill_method=None).clip(-0.5, 0.5)
ALT = np.log1p(_ar.mean(axis=1).fillna(0)).cumsum(); BTC = np.log(T.C["BTCUSDT"])
# volume-weighted alt index (prior-day quote volume weights) as a crude dominance-type proxy
_w = T.V[alts].shift(1).where(_ar.notna()); ALTV = np.log1p((_ar * _w).sum(axis=1) / _w.sum(axis=1)).fillna(0).cumsum()
def altbtc(N, vw=False):
    a = ALTV if vw else ALT; return _shift((a - a.shift(N)) - (BTC - BTC.shift(N)))
Fa = T.F[alts].where(T.V[alts] > 0)
def mkt_fund(N): return _shift(Fa.mean(axis=1).rolling(N, min_periods=1).mean())
def exp_q(x, q):   # expanding quantile of the signal's own past (no look-ahead), from 180 obs
    return x.expanding(180).quantile(q).shift(1)
def trade_fund(t, N):
    i = POS[t["d0"]]; f = T.F[t["sym"]].values[max(0, i - N):i]; return float(np.nanmean(f)) if len(f) else np.nan
