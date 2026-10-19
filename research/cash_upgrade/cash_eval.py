"""Standalone cash-leg comparison (1 TL, no flows). IS 2022-01-01..2025-10-16 (+ long IS 2018-06..2025-10-16 for the
duration rule), OOS 2025-10-17..2026-10-16. Rule parameters (duration X, easing definition) chosen on IS only."""
import sys, pathlib, itertools
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; sys.path.insert(0, str(H)); sys.dont_write_bytecode = True
import cashlib as CL

W = {"IS": ("2022-01-01", "2025-10-16"), "OOS": ("2025-10-17", "2026-10-16"), "IS_long": ("2018-06-01", "2025-10-16")}


def st(v):
    d = (v.index[-1] - v.index[0]).days; geo = (v.iloc[-1] / v.iloc[0]) ** (30.4375 / d) - 1
    dd = (v / v.cummax() - 1).min()
    m = v.resample("ME").last(); mr = pd.concat([v.iloc[:1], m]).pct_change().dropna()
    return dict(geo=geo * 100, maxdd=dd * 100, worst_m=mr.min() * 100, neg_m=int((mr < 0).sum()))


rows = []
def run(per, label, **kw):
    a, b = W[per]; idx = pd.bdate_range(pd.Timestamp(a) - pd.offsets.BDay(1), b)
    v, bk = CL.run_standalone(idx, **kw)
    rows.append(dict(period=per, label=label, **{k: str(x) for k, x in kw.items()}, **st(v), ndur=bk.ndur,
                     cost=bk.cost, penalty=bk.penalty))
    return v

if __name__ == "__main__":
    for per in ("IS", "OOS"):
        for prem in (0.0, 2.0, 4.0): run(per, f"D32 +{prem}pp", mode="D32", prem=prem)
        for mode, k in itertools.product(["BILL", "BEST"], [3, 6]):
            for s in (0.0010, 0.0025, 0.0100): run(per, f"{mode}{k} s={s*1e4:.0f}bp", mode=mode + str(k), k=k, spread=s)
        for prem in (2.0, 4.0): run(per, f"BEST3 s=25bp D+{prem}pp", mode="BEST3", k=3, spread=0.0025, prem=prem)
        for X, e in itertools.product([0.0, 0.025, 0.05, 0.075, 0.10], [1, 2]):
            run(per, f"BEST3+DUR X={X} e{e}", mode="BEST3", k=3, spread=0.0025, dur=(X, e))
    for X, e in itertools.product([0.0, 0.025, 0.05, 0.075, 0.10], [1, 2]):
        run("IS_long", f"D32+DUR X={X} e{e}", mode="D32", dur=(X, e))
    run("IS_long", "D32", mode="D32")
    R = pd.DataFrame(rows); R.to_csv(H / "results/cash_eval.csv", index=False)
    pd.set_option("display.width", 250); pd.set_option("display.max_rows", 300)
    P = R.pivot_table(index="label", columns="period", values=["geo", "maxdd", "worst_m"]).round(3)
    print(P.to_string()); print("variants:", R.label.nunique(), "runs:", len(R))
