"""Portfolio of event trades. Day-level accounting. Each new trade gets notional s*equity(prev close), capped by
liquidity (<=1% of 7d avg daily quote volume at CAP0=$100k base) and gross cap G*equity. One open trade per symbol.
Optional BTC hedge: hold BTC perp with notional = -(net alt exposure), rebalanced daily, 0.1%/side, real funding."""
import pandas as pd, numpy as np, sys, pathlib
H = pathlib.Path(__file__).parent; sys.path.insert(0, str(H.parents[1] / "src"))
from engine import stats
import trades as T
IDX = T.IDX
CAP0 = 100_000.0
fx = pd.read_csv(H.parents[1] / "data/bist/USDTRY.csv", index_col=0, parse_dates=True)["close"].reindex(IDX).ffill().pct_change().fillna(0)
btc_r = T.C["BTCUSDT"].pct_change().fillna(0).values; btc_f = T.F["BTCUSDT"].values

def sim(trs, s=0.2, G=2.0, hedge=0, cap0=CAP0, liq=0.01):
    by_day = {}
    for tr in trs: by_day.setdefault(tr["d0"], []).append(tr)
    eq = 1.0; out = np.zeros(len(IDX)); open_ = []   # [trade, notional, last_cum]
    hed = 0.0; nt = 0; used_frac = []; log = []
    for t, d in enumerate(IDX):
        eq0 = eq; pnl = 0.0; keep = []
        for p in open_:
            tr, n, lc = p; path = tr["path"]
            if d in path.index:
                c = path[d]; pnl += n * (c - lc); p[2] = c
            if d < path.index[-1]: keep.append(p)
        open_ = keep
        if hedge and t > 0:
            pnl += hed * (btc_r[t] - btc_f[t])
        # new entries (entered during/at close of day d; their first mark is at d close, included above if d0==d)
        gross = sum(abs(p[1]) for p in open_)
        for tr in by_day.get(d, []):
            if any(p[0]["sym"] == tr["sym"] for p in open_): continue
            n = s * eq0
            lim = liq * tr["vol"] / cap0     # fraction-of-equity cap from liquidity
            frac = min(1.0, lim / s) if s > 0 else 0
            if frac < 0.2: continue          # too illiquid (<20% of target size)
            n *= frac
            if gross + n > G * eq0 + 1e-12: continue
            c = tr["path"].get(d, None)
            pnl += n * (c if c is not None else -T.FEE)
            p = [tr, n, c if c is not None else -T.FEE]
            if len(tr["path"]) > 1 or tr["path"].index[-1] > d: open_.append(p)
            gross += n; nt += 1; used_frac.append(frac); log.append((tr['tag'], tr['sym'], d, n, float(tr['path'].iloc[-1]), frac))
        eq = eq0 + pnl
        if hedge:
            net = sum(p[1] * p[0]["side"] for p in open_)  # alt net exposure (neg for shorts)
            tgt = -net
            eq -= abs(tgt - hed * (1 + (btc_r[t+1] if False else 0))) * 0.001
            hed = tgt
        if eq <= 0: out[t] = -1; break
        out[t] = eq / eq0 - 1
    r = pd.Series(out, IDX)
    r.attrs["ntrades"] = nt; r.attrs["log"] = log; r.attrs["avg_size_frac"] = float(np.mean(used_frac)) if used_frac else np.nan
    return r

def report(r, start="2020-01-15"):
    rt = (1 + r) * (1 + fx) - 1
    def st(x, a, b):
        s_ = stats((1 + x).cumprod(), a, b); return s_.get("aylik_geo_%"), s_.get("maxDD_%"), s_.get("en_kotu_ay_%"), s_.get("negatif_ay")
    d = r[start:"2025-10-16"]
    sh = d.mean() / d.std() * np.sqrt(365) if d.std() > 0 else np.nan
    i_u = st(r, start, "2025-10-16"); i_t = st(rt, start, "2025-10-16")
    o_u = st(r, "2025-10-17", "2026-10-16"); o_t = st(rt, "2025-10-17", "2026-10-16")
    return dict(IS_sh=round(sh, 2), IS_usd=i_u[0], IS_try=i_t[0], IS_dd=i_u[1], OOS_usd=o_u[0], OOS_try=o_t[0],
                OOS_dd=o_u[1], OOS_worst_usd=o_u[2], OOS_negm=o_u[3], n=r.attrs.get("ntrades"),
                n_oos=None)
