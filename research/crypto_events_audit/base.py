"""Audit: reproduce IS_best book, trade log, monthly concentration."""
import sys, pathlib, pandas as pd, numpy as np
H = pathlib.Path("/home/user/yazilim/research/crypto_events"); sys.path.insert(0, str(H))
import trades as T, port, combo
pd.set_option("display.width", 250); pd.set_option("display.max_rows", 500)
trs = [t for k in combo.BOOKS["IS_best"] for t in combo.gen(k)]
pd.to_pickle(trs, "/tmp/claude-0/-home-user-yazilim/a66947cc-639f-5d8d-a420-2cd980a6f6a1/scratchpad/base_trs.pkl")
for s in [0.1, 0.2]:
    r = port.sim(trs, s, 2.0, 1); print(s, port.report(r, "2022-01-01"))
    if s == 0.2:
        L = pd.DataFrame(r.attrs["log"], columns=["tag", "sym", "d", "n", "ret", "frac"]); L["c"] = L.n * L.ret
        L.to_csv("log_s20.csv", index=False)
        m = (1 + r).resample("ME").prod() - 1
        print((m["2025-10":] * 100).round(1).to_string())
        O = L[L.d >= "2025-10-17"]
        print(O.groupby("tag").agg(n=("ret", "size"), mean=("ret", "mean"), hit=("ret", lambda x: (x > 0).mean()), contrib=("c", "sum")).round(3))
        print(O.groupby([O.d.dt.to_period("M"), "tag"]).c.sum().unstack().round(3).to_string())
        print(O.nlargest(15, "c").to_string()); print(O.nsmallest(8, "c").to_string())
