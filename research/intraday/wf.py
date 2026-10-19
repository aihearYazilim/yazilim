"""Walk-forward selection over the grid. Parameters re-selected on the 17th of each month using ONLY the
prior W months of daily net returns; the chain of next-month returns is the reported result.
Also a 'frozen' variant: one selection at 2025-10-17 using data before it, held through the OOS year.
"""
import sys, itertools, numpy as np, pandas as pd
OUT = "/home/user/yazilim/research/intraday/out/"
G = np.load(OUT + "grid.npz"); meta = pd.read_csv(OUT + "combos.csv")
days = pd.DatetimeIndex(G["days"])
LEVS = [1, 2, 3, 5]
MP = G["minpath"].astype(np.float64)
RET = {}
for L in LEVS:
    r = G[f"ret_L{L}"].astype(np.float64)
    RET[L] = np.where(L * MP <= -0.95, -1.0, r)       # intraday liquidation (incl. maintenance margin) -> wiped
TR = G["trades"]
OOS0, OOS1 = pd.Timestamp("2025-10-17"), pd.Timestamp("2026-10-16")
IS0 = pd.Timestamp("2022-01-17")
REB = [pd.Timestamp(f"{y}-{m:02d}-17") for y in range(2021, 2027) for m in range(1, 13)]
REB = [d for d in REB if d <= OOS1]

def window_mask(d, months):
    if months == 0: return days < d                      # expanding window (all prior data)
    return (days >= d - pd.DateOffset(months=months)) & (days < d)

def score(R, mask, kind):
    x = R[:, mask]
    if kind == "sharpe":
        return x.mean(1) / (x.std(1) + 1e-12)
    if kind == "stable":                                   # min Sharpe of the two halves of the window
        h = x.shape[1] // 2
        a, b = x[:, :h], x[:, h:]
        return np.minimum(a.mean(1) / (a.std(1) + 1e-12), b.mean(1) / (b.std(1) + 1e-12))
    return np.log1p(np.maximum(x, -0.999999)).sum(1)      # 'geo': log growth

def select(d, idx, months, kind, K, lpol, frozen_all=False):
    m = (days < d) if frozen_all else window_mask(d, months)
    if m.sum() < 150: return None, None
    s = score(RET[1][idx], m, kind)
    top = idx[np.argsort(-s)[:K]]
    if lpol == "kelly":
        best, bL = -np.inf, 1
        for L in LEVS:
            port = RET[L][top][:, m].mean(0)
            g = np.log1p(np.maximum(port, -0.999999)).sum()
            if np.any(port <= -0.999): g = -np.inf
            if g > best: best, bL = g, L
        return top, bL
    return top, int(lpol)

def chain(idx, months, kind, K, lpol, frozen=False, frozen_all=False):
    rets = np.zeros(len(days)); trades = np.zeros(len(days)); picks = []
    for i, d in enumerate(REB):
        if frozen and d > OOS0: continue
        d_end = REB[i + 1] if i + 1 < len(REB) else OOS1 + pd.Timedelta(days=1)
        if frozen and d == OOS0: d_end = OOS1 + pd.Timedelta(days=1)
        top, L = select(d, idx, months, kind, K, lpol, frozen_all and d == OOS0)
        if top is None: continue
        per = (days >= d) & (days < d_end)
        rets[per] = RET[L][top][:, per].mean(0)
        trades[per] = TR[top][:, per].sum(0)
        picks.append((d.date(), L, [meta.name[t] for t in top]))
    return pd.Series(rets, index=days), pd.Series(trades, index=days), picks

def st(r, a, b):
    x = r[(r.index >= a) & (r.index <= b)]
    eq = (1 + x).cumprod()
    n = len(x)
    if n == 0 or eq.iloc[-1] <= 0: return dict(geo=-100.0, dd=-100.0, worst=-100.0)
    geo = eq.iloc[-1] ** (30.4375 / n) - 1
    dd = (eq / eq.cummax() - 1).min()
    # 17th-anchored months
    lab = [(t - pd.DateOffset(days=16)).to_period("M") for t in x.index]
    mr = (1 + x).groupby(lab).prod() - 1
    return dict(geo=round(geo * 100, 2), dd=round(dd * 100, 1), worst=round(mr.min() * 100, 1))

def evaluate(idx, months, kind, K, lpol, frozen=False, frozen_all=False):
    r, t, picks = chain(idx, months, kind, K, lpol, frozen, frozen_all)
    a, b = st(r, IS0, OOS0 - pd.Timedelta(days=1)), st(r, OOS0, OOS1)
    x = r[(r.index >= IS0) & (r.index < OOS0)]; a["sh"] = round(x.mean() / (x.std() + 1e-12) * np.sqrt(365), 2)
    ntr = int(t[(t.index >= OOS0)].sum())
    return dict(IS_sharpe=a["sh"], IS_geo=a["geo"], IS_dd=a["dd"], OOS_geo=b["geo"], OOS_dd=b["dd"], OOS_worst=b["worst"], OOS_trades=ntr), r, picks

def run_scope(item):
    sc, idx = item
    rows = []
    for months, kind, K, lpol in SPECS:
        for variant in ["monthlyWF", "frozenW"]:
            res, r, picks = evaluate(idx, months, kind, K, lpol, frozen=(variant != "monthlyWF"))
            rows.append(dict(scope=sc, n_combos=len(idx), window=months, score=kind, K=K, L=lpol, variant=variant, **res))
    return rows

SPECS = list(itertools.product([12, 24, 36, 0], ["sharpe", "geo", "stable"], [1, 5, 10], ["1", "2", "3", "5", "kelly"]))
if __name__ == "__main__":
    from multiprocessing import Pool
    allidx = np.arange(len(meta))
    scopes = {"ALL": allidx}
    for f in sorted(meta.family.unique()):
        scopes["fam:" + f] = np.where(meta.family == f)[0]
    for fq in ["1h", "4h"]:
        scopes["freq:" + fq] = np.where(meta.freq == fq)[0]
    scopes["LS_only"] = np.where(meta["mode"].isin(["LS", "MN"]))[0]
    with Pool(4) as p:
        rows = sum(p.map(run_scope, list(scopes.items())), [])
    df = pd.DataFrame(rows)
    df.to_csv(OUT + "wf_results.csv", index=False)
    print("selection specs evaluated:", len(df))
