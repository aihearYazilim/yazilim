"""Trade-level stats per sleeve/venue (per-trade net return incl. fees, slippage, funding; before sizing)."""
import sys, pathlib, pickle, pandas as pd, numpy as np
H = pathlib.Path(__file__).parent; sys.path.insert(0, str(H)); import common as C
D = pickle.load(open(H / "raw/trades.pkl", "rb"))
rows = []
for t in D["bcms"]: rows.append(("BINANCE_" + t["tag"], t["d0"], float(t["path"].iloc[-1]), t.get("stopped", False)))
for t in D["unl"]: rows.append(("BINANCE_UNL", t["d0"], float(t["path"].iloc[-1]), False))
for k, v in D["VI"].items():
    for t in v: rows.append((t["tag"], t["d0"], float(t["path"].iloc[-1]), t.get("stopped", False)))
L = pd.DataFrame(rows, columns=["tag", "d0", "ret", "stopped"])
L["per"] = np.where(L.d0 >= pd.Timestamp("2025-10-17"), "OOS", np.where(L.d0 >= pd.Timestamp("2022-01-01"), "IS", "pre22"))
g = L.groupby(["tag", "per"]).agg(n=("ret", "size"), mean=("ret", "mean"), median=("ret", "median"), hit=("ret", lambda x: (x > 0).mean()),
                                   stop=("stopped", "mean"), t=("ret", lambda x: x.mean() / x.std() * np.sqrt(len(x)) if len(x) > 2 else np.nan))
pd.set_option("display.width", 200); print((g.round(3)).to_string())
L.to_csv(H / "trade_log.csv", index=False)
