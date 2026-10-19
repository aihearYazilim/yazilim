"""Robustness for the main books: drop-top-K trades, higher costs, delayed entry (+1h, +3h), capacity (cap0)."""
import sys, pathlib, pandas as pd, numpy as np
H = pathlib.Path(__file__).parent; sys.path.insert(0, str(H))
import trades as T, port, combo
def book_trades(name, lag_h=0):
    out = []
    for k in combo.BOOKS[name]:
        if k[0] == "UNL": out += T.unlock_trades(*k[1:])
        else:
            _, ty, sd, h, st = k
            for _, e in T.CE[T.CE.type == ty].iterrows():
                tr = T.hourly_trade(e.sym, sd, e.ts + pd.Timedelta(hours=lag_h), h, st)
                if tr: tr["tag"] = ty; out.append(tr)
    return out
def rep(r): d = port.report(r, combo.IS0); return {k: d[k] for k in ["IS_usd", "IS_dd", "OOS_usd", "OOS_try", "OOS_dd", "OOS_worst_usd", "n"]}
if __name__ == "__main__":
    pd.set_option("display.width", 250)
    for name in ["IS_best", "centre"]:
        rows = {}
        base = book_trades(name)
        r = port.sim(base, 0.2, 2.0, 1); rows["base s.2 G2 hedge"] = rep(r)
        rows["no BTC hedge"] = rep(port.sim(base, 0.2, 2.0, 0))
        L = pd.DataFrame(r.attrs["log"], columns=["tag", "sym", "d", "n", "ret", "frac"]); L["c"] = L.n * L.ret
        for K in [3, 5, 10]:
            top = set(L[L.d >= "2025-10-17"].nlargest(K, "c").apply(lambda x: (x.sym, x.d), axis=1))
            rows[f"drop top-{K} OOS trades"] = rep(port.sim([t for t in base if (t["sym"], t["d0"]) not in top], 0.2, 2.0, 1))
        for lag in [1, 3, 6]:
            rows[f"CMS entry +{lag}h"] = rep(port.sim(book_trades(name, lag), 0.2, 2.0, 1))
        old = T.FEE; T.FEE = 0.003
        rows["cost 0.3%/side"] = rep(port.sim(book_trades(name), 0.2, 2.0, 1)); T.FEE = old
        for cap in [250_000, 1_000_000]:
            rows[f"capital ${cap/1e3:.0f}k"] = rep(port.sim(base, 0.2, 2.0, 1, cap0=cap))
        print("==", name); print(pd.DataFrame(rows).T.to_string())
        m = (1 + r).resample("ME").prod() - 1; o = m["2025-11":"2026-09"]
        print("OOS geo excl. best 3 months (full months Nov-Sep):", round(((1 + o.sort_values()[:-3]).prod() ** (1 / 8) - 1) * 100, 2))
