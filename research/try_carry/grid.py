"""Tam ızgara: boyutlama x trend filtresi x reel faiz filtresi x politika faizi trendi x stop-loss.
Her konfigürasyon IS (2005-01..2025-10-16) ve OOS (2025-10-17..2026-10-16) için hesaplanır;
seçim YALNIZCA IS sütunlarıyla (select.py)."""
import itertools, sys, time, numpy as np, pandas as pd
from sim import load, run, mstats, IS_START, IS_END, OOS_START, OOS_END

U = load()
idx, M, lr, pol, fed, cpi = U["idx"], U["M"], U["lr"], U["pol"], U["fed"], U["cpi"]
S = pd.Series(M, idx)
LR = pd.Series(lr, idx)
POL = pd.Series(pol, idx)
diff_ann = pd.Series(pol - fed, idx)

SIZING = [("fix", L, None, None) for L in [1, 2, 3, 4, 5, 6, 8]] + \
         [("vt", tv, Lm, w) for tv in [0.10, 0.15, 0.20, 0.30] for Lm in [3, 5, 8] for w in [20, 60]]
TREND = [None] + [(n, k) for n in [5, 20, 60] for k in [0.5, 1.0, 2.0]]
REAL = [None, -0.05, 0.0, 0.05]
PTR = [None, (63, 0.0), (126, 0.0)]
STOP = [0.0, 0.02, 0.03, 0.05]
CD = 10


def sizing(spec):
    kind, a, b, w = spec
    if kind == "fix":
        return pd.Series(float(a), idx)
    vol = LR.rolling(w).std() * np.sqrt(260)
    return (a / vol).clip(upper=b).fillna(0)


def trend_ok(spec):
    if spec is None:
        return pd.Series(True, idx)
    n, k = spec
    dep = np.log(S / S.shift(n)) * 260 / n          # yıllıklandırılmış kur artışı (log)
    return (dep < k * diff_ann).fillna(False)


def real_ok(th):
    if th is None:
        return pd.Series(True, idx)
    return pd.Series(pol - cpi > th, idx)


def ptr_ok(spec):
    if spec is None:
        return pd.Series(True, idx)
    n, d = spec
    return (POL - POL.shift(n) >= d - 1e-9).fillna(False)


I0 = int(np.searchsorted(idx, pd.Timestamp(OOS_START))) - 1   # OOS başlangıç NAV'ı = 2025-10-16 kapanışı


def _run(L, stop, tax, lag, cd, i0=0):
    sl = slice(i0, None)
    return run(M[sl], U["H"][sl], U["mmf"][sl], U["carry"][sl], L.values.astype(float)[sl], U["month_end"][sl],
               U["q_end"][sl], stop, cd, tax, lag)


def evaluate(L, stop, tax=0.10, lag=0, cd=CD):
    """IS: 2005'ten sürekli koşu. OOS: 2025-10-16'da NAV=1, düz pozisyonla yeniden başlatılan koşu
    (IS'te iflas eden kural OOS'ta da raporlanabilsin diye; sinyaller tam geçmişle hesaplanır)."""
    a = _run(L, stop, tax, lag, cd, 0)
    b = _run(L, stop, tax, lag, cd, I0)
    return a, b


def row_stats(res):
    (nav, Lh, ntr, nst, nlq), (nav2, Lh2, ntr2, nst2, nlq2) = res
    a = mstats(nav, idx, IS_START, IS_END); b = mstats(nav2, idx[I0:], OOS_START, OOS_END)
    oos = (idx >= OOS_START)
    return dict(IS=a["geo"], IS_dd=a["dd"], IS_worst=a["worst"], IS_sh=a["sharpe"],
                OOS=b["geo"], OOS_dd=b["dd"], OOS_worst=b["worst"], OOS_sh=b["sharpe"],
                avgL_IS=Lh[~oos].mean(), avgL_OOS=Lh2[1:].mean(), trades_IS=ntr - ntr2, trades_OOS=ntr2,
                stops_IS=nst, liq_IS=nlq, stops_OOS=nst2, liq_OOS=nlq2)


if __name__ == "__main__":
    t0 = time.time()
    cache_s = {s: sizing(s) for s in SIZING}
    cache_t = {s: trend_ok(s) for s in TREND}
    cache_r = {s: real_ok(s) for s in REAL}
    cache_p = {s: ptr_ok(s) for s in PTR}
    rows = []; MR = []
    me = pd.Series(1, idx).resample("ME").last().index
    for sz, tr, rl, pt, st in itertools.product(SIZING, TREND, REAL, PTR, STOP):
        L = cache_s[sz] * (cache_t[tr] & cache_r[rl] & cache_p[pt]).astype(float)
        res = evaluate(L, st)
        r = row_stats(res)
        MR.append(pd.Series(res[0][0], idx).resample("ME").last().pct_change().fillna(0).values.astype(np.float32))
        r.update(sizing=f"{sz[0]}:{sz[1]}:{sz[2]}:{sz[3]}", trend=str(tr), real=str(rl), ptr=str(pt), stop=st)
        rows.append(r)
    R = pd.DataFrame(rows)
    R.to_csv("grid.csv", index=False)
    np.savez_compressed("grid_monthly.npz", mr=np.array(MR), months=me.values.astype("datetime64[D]"))
    print(len(R), "kombinasyon", round(time.time() - t0), "sn")
