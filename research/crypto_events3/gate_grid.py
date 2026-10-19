"""Grid of ex-ante regime gates on the fixed Binance event-short book. Every config is counted as a trial.
Saves raw/grid.csv (all metrics) and raw/series.pkl (IS/OOS daily return series per config)."""
import sys, pathlib, pickle, itertools, pandas as pd, numpy as np
H = pathlib.Path(__file__).parent; sys.path.insert(0, str(H)); import gate as g
TRS = g.TRS
def at(sig): return {t["id"]: sig.get(t["d0"], np.nan) for t in TRS}
CONDS = {}
def add(name, vals, fn): CONDS[name] = {i: bool(fn(v)) if not (isinstance(v, float) and np.isnan(v)) else False for i, v in vals.items()}
for N in [14, 21, 30, 45, 60, 90]:
    add(f"OWN_MTM|N={N}|>0", at(g.own_mtm(N)), lambda v: v > 0)
    add(f"OWN_CLOSED|N={N}|>0", at(g.own_closed(N)), lambda v: v > 0)
    h = at(g.own_hit(N))
    for th in [0.4, 0.5, 0.6]: add(f"OWN_HIT|N={N}|>{th}", h, lambda v, th=th: v > th)
for N in [14, 30, 60, 90]:
    x = g.evt(N)
    for q in [0.5, 0.67, 0.8]:
        d = at(x - g.exp_q(x, q))
        add(f"EVT|N={N}|hi_q{q}", d, lambda v: v > 0); add(f"EVT|N={N}|lo_q{q}", d, lambda v: v <= 0)
for M in [20, 50, 100]:
    b = at(g.breadth(M))
    for th in [0.3, 0.4, 0.5]:
        add(f"BREADTH|M={M}|<{th}", b, lambda v, th=th: v < th); add(f"BREADTH|M={M}|>={th}", b, lambda v, th=th: v >= th)
for N in [14, 30, 60, 90]:
    for vw in [False, True]:
        a = at(g.altbtc(N, vw)); k = "VW" if vw else "EW"
        add(f"ALTBTC_{k}|N={N}|<0", a, lambda v: v < 0); add(f"ALTBTC_{k}|N={N}|>0", a, lambda v: v > 0)
for N in [3, 7, 14, 30]:
    x = g.mkt_fund(N)
    for q in [0.5, 0.67]:
        d = at(x - g.exp_q(x, q))
        add(f"MKTFUND|N={N}|hi_q{q}", d, lambda v: v > 0); add(f"MKTFUND|N={N}|lo_q{q}", d, lambda v: v <= 0)
for N in [3, 7]:
    tf = {t["id"]: g.trade_fund(t, N) for t in TRS}
    for th in [0.0, 1e-4]:
        add(f"TRDFUND|N={N}|>{th}", tf, lambda v, th=th: v > th); add(f"TRDFUND|N={N}|<={th}", tf, lambda v, th=th: v <= th)
MODES = {"0/20": (0.0, 0.2), "10/20": (0.1, 0.2), "0/10": (0.0, 0.1)}
CFG = {"UNGATED s=0.2": {t["id"]: 0.2 for t in TRS}, "UNGATED s=0.1": {t["id"]: 0.1 for t in TRS}}
for c, cond in CONDS.items():
    for m, (lo, hi) in MODES.items(): CFG[f"{c}|{m}"] = {i: hi if v else lo for i, v in cond.items()}
    # tri-level 0/10/20: own-family -> + same-N hit>0.5; others -> + OWN_MTM(30)>0
    fam, N = c.split("|")[0], c.split("|")[1]
    if c.startswith("OWN_HIT"): continue
    B = CONDS[f"OWN_HIT|{N}|>0.5"] if fam in ("OWN_MTM", "OWN_CLOSED") else CONDS["OWN_MTM|N=30|>0"]
    CFG[f"{c}|tri"] = {i: 0.1 * (cond[i] + B[i]) for i in cond}
if __name__ == "__main__":
    rows, SER = [], {}
    for k, sz in CFG.items():
        o, ser = g.run(sz); o["cfg"] = k
        isd = [t for t in TRS if t["d0"] >= pd.Timestamp("2022-01-01")]
        o["IS_on%"] = round(100 * np.mean([sz[t["id"]] > 0 for t in isd if t["d0"] < pd.Timestamp("2025-10-17")]), 1)
        o["OOS_on%"] = round(100 * np.mean([sz[t["id"]] > 0 for t in isd if t["d0"] >= pd.Timestamp("2025-10-17")]), 1)
        rows.append(o); SER[k] = ser
    G = pd.DataFrame(rows).set_index("cfg"); G.to_csv(H / "raw/grid.csv"); pickle.dump(SER, open(H / "raw/series.pkl", "wb"))
    print("configs:", len(CFG), "conditions:", len(CONDS))
