"""Equal-capital portfolios of the IS-selected bots (no OOS information used)."""
import numpy as np, pandas as pd
from lib import *
from analyze import ODAYS, oos_metrics
O = {u: np.load(RAW / f"oos_{u}.npy") for u in MAJ + ["ALT20"]}
for name, f in [("IS-best", "out_selected.csv"), ("robust", "out_selected_robust.csv")]:
    s = pd.read_csv(f)
    for fam in ["ALL", "grid", "fgrid", "dca", "rebal"]:
        g = s if fam == "ALL" else s[s.fam == fam]
        eq = np.mean([O[r.uni][int(r.cid)].astype(float) for _, r in g.iterrows()], axis=0)
        m = oos_metrics(eq)
        print(f"{name:8s} {fam:6s} n={len(g):2d}  OOS USD {m['oos_usd']:+.4f}  TRY {m['oos_try']:+.4f}  maxDD {m['oos_dd']:+.3f}  worst month TRY {m['oos_worst_try']:+.3f}  neg months {m['oos_negm']}")
