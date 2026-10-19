"""Walk-forward: every bot is (re)started fresh on the 17th of each month (positions liquidated at month end).
Per coin: monthly gross ratio for every combo, months 2021-04-17 .. 2026-09-17 (66 months).
Selection at month m uses only months < m (trailing L months geo-mean); OOS chain = months 2025-10-17 .. 2026-09-17."""
import sys, numpy as np, pandas as pd
from lib import *
from sweep import combos, run

MONTHS = [pd.Timestamp("2021-04-17") + pd.DateOffset(months=k) for k in range(66)]

def main(sym):
    c = Coin(sym)
    slip = 0.0005 if sym in MAJ else 0.001
    C = combos()
    R = np.full((len(C), len(MONTHS)), np.nan)
    wins = [c.win(a, a + pd.DateOffset(months=1)) for a in MONTHS]
    for j, (fam, p) in enumerate(C):
        for k, ij in enumerate(wins):
            if ij is None:
                continue
            out = run(c, fam, p, ij[0], ij[1], slip=slip)
            e = pd.Series(out[0]).ffill().values[-1]
            fut = (fam == "fgrid") or (fam == "dca" and p["fut"])
            R[j, k] = e - out[6] * ((0.0005 if fut else 0.001) + slip)  # month-end market close of inventory
    np.save(RAW / f"wf_{sym}.npy", R)
    print(sym, "wf done", flush=True)

if __name__ == "__main__":
    for s in sys.argv[1:]:
        main(s)
