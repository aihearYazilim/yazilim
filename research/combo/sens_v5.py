"""v5 sensitivity for candidate portfolios: deposit-rate table shifted -3/+3 pp, Deribit lot rounding off, VİOP cash
band; monthly OOS returns of candidates."""
import sys, pathlib, json
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; OUT = H / "results"
sys.path.insert(0, str(H)); sys.dont_write_bytecode = True
import combo_v5 as V, combo_v4 as V4
cf = json.load(open(OUT / "stress_cfgs_v5.json"))
rows = []; mon = {}
for shift in (0.0, -3.0, 3.0):
    D = {(p, sz): V.prep(a, b, sz, shift) for p, (a, b) in {"IS": (V.IS0, V.IS1), "OOS": (V.OOS0, V.OOS1)}.items() for sz in (1, 2)}
    A = {(p, Lm): V4.carry_arrays(D[(p, 1)]["idx"], Lm) for p in ("IS", "OOS") for Lm in (3, 5)}
    for c in cf:
        for p in ("IS", "OOS"):
            for lots in ([True, False] if shift == 0 else [True]):
                e, t, dg = V.sim(D[(p, c["sz"])], A[(p, c["Lm"])], c["C"], tuple(c["w"]), c["prod"], c["nema"], lots=lots)
                s = V.stats(e, t)
                rows.append(dict(label=c["label"], C=c["C"], shift=shift, lots=lots, period=p, geo=s["geo"] * 100,
                                 maxdd=s["maxdd"] * 100, maxdd_mtm=s["maxdd_mtm"] * 100, worst_m=s["worst_m"] * 100,
                                 neg_m=s["neg_m"], ntr=dg["ntr"], lotmult=dg["lotmult"], penalty=dg["penalty"], avgL=dg["avgL"]))
                if shift == 0 and lots and p == "OOS":
                    m = e.resample("ME").last(); m = pd.concat([pd.Series([e.iloc[0]], [e.index[0]]), m]).pct_change().dropna()
                    mon[(c["label"], c["C"])] = m * 100
R = pd.DataFrame(rows); R.to_csv(OUT / "sens_v5.csv", index=False)
pd.set_option("display.width", 250); pd.set_option("display.max_rows", 500)
print(R.pivot_table(index=["label", "C"], columns=["period", "shift", "lots"], values="geo").round(2).to_string())
print(R[(R["shift"] == 0) & R.lots].pivot_table(index=["label", "C"], columns="period", values=["maxdd", "maxdd_mtm", "worst_m", "neg_m", "lotmult"]).round(2).to_string())
M = pd.DataFrame(mon); M.to_csv(OUT / "monthly_oos_v5.csv")
print(M.round(2).T.to_string())
