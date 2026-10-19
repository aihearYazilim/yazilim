"""Cost / fill-model sensitivity of selected combos (OOS only)."""
import numpy as np, pandas as pd, sys
import sweep
from lib import *
from analyze import ODAYS, oos_metrics, params
C = sweep.combos()
sel = pd.concat([pd.read_csv("out_selected.csv").assign(sel="IS-best"), pd.read_csv("out_selected_robust.csv").assign(sel="robust")])
VAR = {"base": dict(fs=0.001, fm=0.0002, ft=0.0005, eps=0.0002), "bnb": dict(fs=0.00075, fm=0.00018, ft=0.00045, eps=0.0002),
       "protocol": dict(fs=0.0015, fm=0.001, ft=0.001, eps=0.0002), "touch": dict(fs=0.001, fm=0.0002, ft=0.0005, eps=0.0),
       "eps5bp": dict(fs=0.001, fm=0.0002, ft=0.0005, eps=0.0005)}
coins = {}
def coin(s):
    if s not in coins: coins[s] = Coin(s)
    return coins[s]
rows = []
for _, r in sel.drop_duplicates(["uni", "cid"]).iterrows():
    fam, p = C[int(r.cid)]
    syms = [r.uni] if r.uni in MAJ else ALTS
    out = dict(uni=r.uni, fam=fam, sel=r.sel, params=params(int(r.cid)))
    for vn, v in VAR.items():
        sweep.EPS = v["eps"]
        eqs = []
        for s in syms:
            c = coin(s); i0, i1 = c.win(OOS0, OOS1)
            eq = sweep.run(c, fam, p, i0, i1, fee_spot=v["fs"], fee_fm=v["fm"], fee_ft=v["ft"], slip=0.0005 if s in MAJ else 0.001)[0]
            eqs.append(pd.Series(eq).ffill().fillna(1.0).values[:len(ODAYS)])
        out[vn] = oos_metrics(np.mean(eqs, 0))["oos_try"]
    rows.append(out); print(out, flush=True)
pd.DataFrame(rows).to_csv("out_sens.csv", index=False)
