"""Audit: corrected numbers for the fixed IS_best book. Corrections: liquidity cap on current dollar equity, fresh $100k
start per window, CMS stops on 1m path with 1% stop slippage, CMS entry slippage 0.5% (variants: entry +15m)."""
import sys; sys.path.insert(0, "/home/user/yazilim/research/crypto_events_audit"); sys.path.insert(0, "/home/user/yazilim/research/crypto_events")
import pandas as pd, port_fix as PF, exec1m as X, trades as T, combo, port
pd.set_option("display.width", 250)
unl = T.unlock_trades(0.10, 10, 3, 1.0)
cms0 = [t for k in combo.BOOKS["IS_best"][1:] for t in combo.gen(k)]
V = {"A repo trades": unl + cms0,
     "B 1m path, entry slip .5%, stop slip 1%": unl + X.cms_book(None, 0.005, 0.01),
     "C as B but entry +15m": unl + X.cms_book(15, 0.005, 0.01),
     "D as B but entry slip 1%": unl + X.cms_book(None, 0.01, 0.01)}
rows = {}
for nm, trs in V.items():
    for s in [0.1, 0.2]:
        d = PF.both(trs, s, 2.0, 1); rows[f"{nm} | s={s}"] = {k: v for k, v in d.items() if not k.startswith("_")}
        if nm.startswith("B"):
            r = d["_OOS_r"]; print(nm, s, "OOS monthly %:", (((1 + r).resample("ME").prod() - 1) * 100).round(1).to_dict())
            L = pd.DataFrame(r.attrs["log"], columns=["tag", "sym", "d", "n", "ret", "frac"]); L["c"] = L.n * L.ret
            m = L.groupby(L.d.dt.to_period("M")).c.sum(); print("OOS share of trade P&L from Mar-May 2026 entries:", round(m.loc["2026-03":"2026-05"].sum() / m.sum(), 2))
            for K in [5, 10]:
                top = set(L.nlargest(K, "c").apply(lambda x: (x.sym, x.d), axis=1))
                d2 = PF.both([t for t in trs if (t["sym"], t["d0"]) not in top or t["d0"] < pd.Timestamp("2025-10-17")], s, 2.0, 1)
                rows[f"{nm} | s={s} drop top-{K} OOS trades"] = {k: v for k, v in d2.items() if not k.startswith("_")}
old = T.FEE; T.FEE = 0.003
trs = T.unlock_trades(0.10, 10, 3, 1.0) + X.cms_book(None, 0.005, 0.01)
for s in [0.1, 0.2]:
    d = PF.both(trs, s, 2.0, 1); rows[f"B + cost 0.3%/side | s={s}"] = {k: v for k, v in d.items() if not k.startswith("_")}
T.FEE = old
print(pd.DataFrame(rows).T.to_string())
