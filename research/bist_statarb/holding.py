"""(b) Holding-company discount mean reversion: holding vs basket of its listed subsidiaries.
No share-count data -> 'NAV' basket weights estimated without look-ahead: every Tt days, non-negative least
squares of the holding's daily log returns (futures index) on the subsidiaries' returns over the last F days
(mode 'ret'), or NNLS on log levels (mode 'lvl').  Discount proxy s_t = LP_h - sum b_i LP_i; z = rolling (W)
standardised s.  Enter |z|>ze (z<0: holding cheap vs NAV -> long holding / short basket), exit at |z|<zx,
stop |z|>zs, time stop ts days.  Executed at settle t+1.  Gross per holding book = gross / (#holdings)."""
import numpy as np, pandas as pd
from scipy.optimize import nnls
import sa

HOLD = {"KCHOL": ["TUPRS", "FROTO", "TOASO", "ARCLK", "YKBNK"],
        "SAHOL": ["AKBNK", "AKSEN", "ENJSA", "CIMSA", "TURSG"],
        "ISCTR": ["SISE", "TSKB", "ISGYO", "ISFIN"]}


def run(D, books=("KCHOL", "SAHOL"), F=252, Tt=21, W=120, ze=2.0, zx=0.0, zs=4.0, ts=60, wmode="ret", gross=2.0,
        coll="dep", start_trade="2017-09-01", slip_mult=1.0, details=False, comm=sa.COMM):
    sa.prep(D)
    days = D["days"]; T = len(days); n = len(D["unds"]); col = {u: j for j, u in enumerate(D["unds"])}
    LPdf = D["LP"].ffill(); LP = LPdf.values; R = D["fret"].values
    tgt = np.zeros((T, n)); act = np.zeros((T, n), bool)
    gb = gross / len(books)
    t_first = max(F + W, days.searchsorted(pd.Timestamp(start_trade)) - 1)
    ntr = 0; held = []
    st = {h: dict(d=0, entry=0, w=None, cool=False) for h in books}
    beta = {}
    for t in range(t_first, T - 1):
        if (t - t_first) % Tt == 0:
            for h in books:
                subs = [s for s in HOLD[h] if np.isfinite(R[t - F + 1:t + 1, col[s]]).mean() > 0.95
                        and np.isfinite(LP[t - max(F, W) + 1:t + 1, col[s]]).all() and D["has"][t, col[s]]]
                lo = t - F + 1
                if wmode == "ret":
                    X = np.nan_to_num(R[lo:t + 1][:, [col[s] for s in subs]]); y = np.nan_to_num(R[lo:t + 1, col[h]])
                else:
                    X = LP[lo:t + 1][:, [col[s] for s in subs]]; y = LP[lo:t + 1, col[h]]
                    X = np.column_stack([X - X.mean(0)]); y = y - y.mean()
                b, _ = nnls(X, y) if len(subs) else (np.array([]), 0)
                beta[h] = (subs, b)
        ch = set()
        for h in books:
            subs, b = beta[h]
            if not len(subs) or b.sum() < 0.2:
                continue
            idx = [col[s] for s in subs]
            sp = LP[t - W + 1:t + 1, col[h]] - LP[t - W + 1:t + 1][:, idx] @ b
            if np.isnan(sp).any():
                continue
            z = (sp[-1] - sp.mean()) / sp.std()
            s = st[h]
            if s["d"] == 0:
                if s["cool"]:
                    if abs(z) < ze:
                        s["cool"] = False
                    continue
                if ze < abs(z) < zs:
                    d = -np.sign(z); bs = b.sum()
                    wv = np.zeros(n); wv[col[h]] = d * gb / (1 + bs); wv[idx] -= d * gb * b / (1 + bs)
                    s.update(d=d, entry=t, w=wv); ntr += 1; ch |= {h, *subs}
            else:
                d = s["d"]
                if d * z >= -zx or d * z <= -zs or t - s["entry"] >= ts:
                    held.append(t - s["entry"])
                    s["cool"] = not (d * z >= -zx)
                    ch |= {u for u in D["unds"] if s["w"][col[u]] != 0}
                    s.update(d=0, w=None)
        if ch:
            new = np.zeros(n)
            for h in books:
                if st[h]["w"] is not None:
                    new += st[h]["w"]
            idx = [col[u] for u in ch]
            tgt[t + 1, idx] = new[idx]; act[t + 1, idx] = True
    r = sa.simulate(D, tgt, act, coll=coll, slip_mult=slip_mult, details=details, comm=comm)
    info = dict(ntr=ntr, hold=float(np.mean(held)) if held else np.nan)
    if details:
        r, det = r; info.update(det)
    return r, info
