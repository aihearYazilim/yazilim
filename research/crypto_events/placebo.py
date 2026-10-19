"""Placebo: same symbols / sides / holding periods / stops, but event dates shifted by a random +-30..120 days
(daily bars, entry at close). Compares with the real-event book built the same daily way.
If the edge were just 'short alts in a bear market', placebo would match the real book."""
import sys, pathlib, numpy as np, pandas as pd
H = pathlib.Path(__file__).parent; sys.path.insert(0, str(H))
import trades as T, port, combo
def daily_version(keys, shift_rng=None):
    out = []
    for k in keys:
        if k[0] == "UNL":
            _, thr, N, M, st = k
            ev = [(e.sym, T.POS.get(e.day), -N, M) for _, e in T.UE[T.UE.pct >= thr].iterrows()]
        else:
            _, ty, sd, h, st = k
            ev = [(e.sym, T.POS.get(e.ts.normalize()), 0, max(1, h // 24)) for _, e in T.CE[T.CE.type == ty].iterrows()]
        for sym, i, a, b in ev:
            if i is None: continue
            if shift_rng is not None:
                i = i + int(shift_rng.choice([-1, 1]) * shift_rng.integers(30, 121))
            if i + a < 1 or i + b >= len(T.IDX): continue
            if np.isnan(T.C[sym].values[i + a]): continue
            tr = T.daily_trade(sym, -1, i + a, i + b, st)
            if tr: tr["tag"] = k[1] if k[0] == "CMS" else "UNL"; out.append(tr)
    return out
if __name__ == "__main__":
    book = sys.argv[1] if len(sys.argv) > 1 else "IS_best"
    keys = combo.BOOKS[book]
    real = port.report(port.sim(daily_version(keys), 0.2, 2.0, 1), combo.IS0)
    print("REAL (daily-entry version)", book, real)
    rows = []
    for seed in range(20):
        rng = np.random.default_rng(seed)
        rows.append(port.report(port.sim(daily_version(keys, rng), 0.2, 2.0, 1), combo.IS0))
    P = pd.DataFrame(rows)
    print("PLACEBO x20:"); print(P[["IS_usd", "IS_dd", "OOS_usd", "OOS_dd", "n"]].describe().round(2).to_string())
