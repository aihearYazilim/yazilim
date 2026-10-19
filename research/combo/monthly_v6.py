"""v6: OOS monthly path and IS rolling-12m distribution of the selected portfolios (weights from weights_v6.json)."""
import sys, pathlib, json
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; OUT = H / "results"; sys.path.insert(0, str(H)); sys.dont_write_bytecode = True
import combo_v6 as C6
W = json.load(open(OUT / "weights_v6.json"))
PICK = [("IV5 L5", 5, "dibs1", "IV5"), ("SH5 L5", 5, "dibs1", "SH5"), ("IV5 L3", 3, "dibs1", "IV5"), ("IV4 L5", 5, "dibs1", "IV4")]
C6.init(); rows = {}; roll = []
for lab, Lm, viop, sch in PICK:
    for C in C6.CAPS:
        w = tuple(W[f"{C}|{Lm}|{viop}"][sch])
        for per in ("IS", "OOS"):
            e, t, dg = C6.sim(C6.DD[(per, 1.0)], C6.AA[(per, Lm)], C, w, viop)
            m = e.resample("ME").last(); m = pd.concat([pd.Series([e.iloc[0]], [e.index[0]]), m[m.index > e.index[0]]]).pct_change().dropna()
            if per == "OOS": rows[f"{lab} {C//10**6}M"] = (m * 100).round(2)
            else:
                g = [(np.prod(1 + m.iloc[i:i + 12].values)) ** (1 / 12) - 1 for i in range(len(m) - 11)]
                roll.append(dict(cfg=f"{lab} {C//10**6}M", p10=np.percentile(g, 10) * 100, med=np.median(g) * 100,
                                 p90=np.percentile(g, 90) * 100, frac53=np.mean(np.array(g) >= 0.053), worst12=min(g) * 100,
                                 trades_fut=dg["ntr"], calls=dg["ncall"], liq=dg["nliq"]))
M = pd.DataFrame(rows); M.index = M.index.strftime("%Y-%m"); M.to_csv(OUT / "monthly_oos_v6.csv")
pd.set_option("display.width", 250)
print(M.to_string()); print(pd.DataFrame(roll).round(2).to_string(index=False))
