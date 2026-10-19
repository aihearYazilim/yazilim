"""Cost/capital/delay/sub-period sensitivity for the IS-chosen candidates."""
import pandas as pd, numpy as np, lib, signals as sg, pead
D = lib.build_panel(); S = sg.prep(D); P = D["P"]
dates = S["adj"].index
ME = [d for d in lib.month_ends(dates) if pd.Timestamp("2005-01-01") <= d <= pd.Timestamp(lib.OOS_END)]
def rep(name, eq, tr):
    o = {"name": name}
    for tag, a, b in (("IS10-17", "2010-01-01", "2017-12-31"), ("IS18-25", "2018-01-01", lib.IS_END), ("IS10", lib.IS_START, lib.IS_END), ("OOS", lib.OOS_START, lib.OOS_END)):
        s = lib.stats_m(eq, a, b); o[tag + "_geo"] = round(s["geo"] * 100, 2)
    s = lib.stats_m(eq, lib.IS_START, lib.IS_END); o["IS_dd"] = round(s["maxdd"] * 100, 1); o["IS_worst"] = round(s["worst"] * 100, 1)
    s = lib.stats_m(eq, lib.OOS_START, lib.OOS_END); o["OOS_dd"] = round(s["maxdd"] * 100, 1); o["OOS_worst"] = round(s["worst"] * 100, 1)
    t = lib.try_eq(eq, D["usdtry"], lib.OOS_START, lib.OOS_END); s = lib.stats_m(t, lib.OOS_START, lib.OOS_END)
    o["OOS_TRY_geo"] = round(s["geo"] * 100, 2); o["OOS_TRY_dd"] = round(s["maxdd"] * 100, 1); o["OOS_TRY_worst"] = round(s["worst"] * 100, 1)
    t0 = lib.try_eq(eq, D["usdtry"], lib.OOS_START, lib.OOS_END, tax=0); o["OOS_TRY_pretax"] = round(lib.stats_m(t0, lib.OOS_START, lib.OOS_END)["geo"] * 100, 2)
    t = lib.try_eq(eq, D["usdtry"], "2016-10-17", lib.IS_END); o["IS17_TRY_geo"] = round(lib.stats_m(t, "2016-10-17", lib.IS_END)["geo"] * 100, 2)
    o["turn_yr_x"] = round(tr.loc[lib.IS_START:lib.OOS_END].sum() / 16.8, 1)
    print(o, flush=True); return o
rows = []
cands = {"lowvol63_N20": (sg.vol(S, 63), True, 20), "mom126_N10": (sg.mom(S, 126), False, 10), "mom252_N10": (sg.mom(S, 252), False, 10)}
for nm, (sc, asc, N) in cands.items():
    for filt in (0, 1):
        w = sg.topn(sc, S["elig"], ME, N, S["regime"] if filt else None, ascending=asc)
        for lev in (1.0, 2.0):
            for slip, cap in ((3, 100_000), (5, 100_000), (5, 25_000)):
                eq, tr = lib.simulate(w, ME, P, D["irx"], lev=lev, slip_bp=slip, capital=cap)
                rows.append(rep(f"{nm}|f{filt}|L{lev}|slip{slip}|cap{cap//1000}k", eq, tr))
ev = pead.load_events(set(S["adj"].columns)); ev = ev[(ev.date >= "2005-01-01") & (ev.date <= lib.OOS_END)]
for delay in (0, 1, 2):
    W, rd = pead.build(D, S, ev, 0.04, 0, 60, 20, 0, delay=delay)
    for lev in (1.0, 2.0):
        for slip, cap in ((3, 100_000), (5, 25_000)):
            eq, tr = lib.simulate(W, rd, P, D["irx"], lev=lev, band=0.02, slip_bp=slip, capital=cap)
            rows.append(rep(f"pead_thr4_H60_K20|delay{delay}|L{lev}|slip{slip}|cap{cap//1000}k", eq, tr))
pd.DataFrame(rows).to_csv(lib.R / "sensitivity.csv", index=False)
