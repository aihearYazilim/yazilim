import sys; sys.path.insert(0, "/home/user/yazilim/research/crypto_events")
import pandas as pd, numpy as np, port, combo
trs = pd.read_pickle("/tmp/claude-0/-home-user-yazilim/a66947cc-639f-5d8d-a420-2cd980a6f6a1/scratchpad/base_trs.pkl")
r = port.sim(trs, 0.2, 2.0, 1); eq = (1 + r).cumprod()
L = pd.DataFrame(r.attrs["log"], columns=["tag", "sym", "d", "n", "ret", "frac"])
key = {(t["sym"], t["d0"]): t for t in trs}
days = [pd.Timestamp(x) for x in sys.argv[1:]]
for D in days:
    print("== day", D.date(), "book ret", round(r[D], 3))
    rows = []
    for _, l in L.iterrows():
        t = key.get((l.sym, l.d))
        if t is None: continue
        p = t["path"]
        if D in p.index and p.index[0] <= D:
            prev = p[p.index < D].iloc[-1] if (p.index < D).any() else 0
            rows.append((l.tag, l.sym, l.d.date(), round(l.n / eq[D - pd.Timedelta(days=1)], 3), round(p[D] - prev, 3)))
    R = pd.DataFrame(rows, columns=["tag", "sym", "entry", "w", "dpath"]); R["contrib"] = R.w * R.dpath
    print(R.sort_values("contrib").to_string())
