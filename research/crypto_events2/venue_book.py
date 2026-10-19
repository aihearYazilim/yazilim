"""Fixed-parameter books (no re-optimisation): IS_best params DEL 72h/stop20%, LIST 720h/stop20%, short at open of first
1h bar after announcement, 1m stop path, entry slip 0.5%, stop slip 1%, fee 0.2%/side, Binance funding, s in {0.1,0.2},
G=2, BTC hedge. Corrected portfolio sim (audit port_fix): liquidity cap on current equity, fresh $100k each window."""
import sys, pathlib, pandas as pd, numpy as np, pickle
H = pathlib.Path(__file__).parent; sys.path.insert(0, str(H))
import common as C
pd.set_option("display.width", 250); pd.set_option("display.max_rows", 500)
WIN = [("IS", "2022-01-01", "2025-10-16"), ("OOS", "2025-10-17", "2026-10-16")]
YEARS = [("2020", "2020-01-01", "2020-12-31"), ("2021", "2021-01-01", "2021-12-31"), ("2022", "2022-01-01", "2022-12-31"),
         ("2023", "2023-01-01", "2023-12-31"), ("2024", "2024-01-01", "2024-12-31"), ("2025<10-17", "2025-01-01", "2025-10-16"),
         ("OOS a 25-10..26-02", "2025-10-17", "2026-02-28"), ("OOS b 26-03..05", "2026-03-01", "2026-05-31"), ("OOS c 26-06..10", "2026-06-01", "2026-10-16")]
def table(books, wins, ss=(0.1, 0.2)):
    rows = []
    for nm, trs in books.items():
        for s in ss:
            row = {"book": nm, "s": s}
            for w, a, b in wins:
                d, _ = C.window(trs, a, b, s)
                row[f"{w}_usd"] = d["usd"]; row[f"{w}_try"] = d["try_"]; row[f"{w}_dd"] = d["dd"]; row[f"{w}_n"] = d["n"]
            rows.append(row)
    return pd.DataFrame(rows)
def monthly(trs, a, b, s):
    _, r = C.window(trs, a, b, s); rt = (1 + r) * (1 + C.fx[r.index]) - 1
    return pd.DataFrame({"usd%": ((1 + r).resample("ME").prod() - 1) * 100, "try%": ((1 + rt).resample("ME").prod() - 1) * 100}).round(1)
if __name__ == "__main__":
    unl, bcms = C.binance_book()
    E = C.load_events(); EI = E[~E.overlap.astype(bool)]
    V = {k: C.venue_trades(g) for k, g in E.groupby("venue")}
    VI = {k: C.venue_trades(g) for k, g in EI.groupby("venue")}
    VT = {f"{v}_{t}": C.venue_trades(g) for (v, t), g in EI.groupby(["venue", "type"])}
    pickle.dump(dict(unl=unl, bcms=bcms, V=V, VI=VI, VT=VT), open(H / "raw/trades.pkl", "wb"))
    print("venue trades (all / independent):", {k: (len(V[k]), len(VI.get(k, []))) for k in V})
    allv = [t for v in VI.values() for t in v]
    books = {"BINANCE IS_best (audit B)": unl + bcms, "BINANCE CMS only": bcms, "UNL only": unl}
    for k, v in VT.items(): books[f"{k} (indep)"] = v
    for k, v in VI.items(): books[f"{k} DEL+LIST (indep)"] = v
    for k, v in V.items(): books[f"{k} DEL+LIST (all)"] = v
    books["ALL non-Binance (indep)"] = allv
    books["BINANCE book + non-Binance"] = unl + bcms + allv
    T1 = table(books, WIN); print(T1.to_string())
    T1.to_csv(H / "book_isoos.csv", index=False)
    T2 = table({k: books[k] for k in ["BINANCE IS_best (audit B)", "BINANCE CMS only", "UNL only", "ALL non-Binance (indep)"]}, YEARS, ss=(0.2,))
    T2.to_csv(H / "book_years.csv", index=False)
    cols = [c for c in T2.columns if c.endswith("_usd") or c.endswith("_n")]
    print(T2[["book", "s"] + cols].to_string())
    print(T2[["book", "s"] + [c for c in T2.columns if c.endswith("_dd") or c.endswith("_try")]].to_string())
    print("Binance book s=0.2 monthly OOS:"); print(monthly(unl + bcms, "2025-10-17", "2026-10-16", 0.2).T.to_string())
    print("Binance book s=0.1 monthly OOS:"); print(monthly(unl + bcms, "2025-10-17", "2026-10-16", 0.1).T.to_string())
    print("ALL non-Binance s=0.2 monthly 2024-01..:"); print(monthly(allv, "2024-01-01", "2026-10-16", 0.2).T.to_string())
