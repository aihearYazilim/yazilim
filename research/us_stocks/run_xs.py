"""Grid of cross-sectional anomalies (mom, 52wh, lowvol, reversal, composite) x N x regime filter x leverage."""
import itertools, numpy as np, pandas as pd, lib, signals as sg, pickle, sys
D = lib.build_panel(); S = sg.prep(D); P = D["P"]
dates = S["adj"].index
ME = [d for d in lib.month_ends(dates) if d >= pd.Timestamp("2005-01-01")]
WE = [d for d in lib.week_ends(dates) if d >= pd.Timestamp("2005-01-01")]
ME = [d for d in ME if d <= pd.Timestamp(lib.OOS_END)]; WE = [d for d in WE if d <= pd.Timestamp(lib.OOS_END)]
el = S["elig"]
scores = {}
for L in (126, 252): scores[f"mom{L}"] = (sg.mom(S, L), False, "M")
scores["hi52"] = (sg.hi52(S), False, "M")
for L in (63, 252): scores[f"lowvol{L}"] = (sg.vol(S, L), True, "M")
for L in (5, 10): scores[f"rev{L}w"] = (sg.rev(S, L), True, "W")
scores["rev21m"] = (sg.rev(S, 21), True, "M")
comp = sg.zrank(sg.mom(S, 252), el) + sg.zrank(sg.hi52(S), el) + sg.zrank(-sg.vol(S, 63), el)
scores["comp_mom_hi_lv"] = (comp, False, "M")
comp2 = sg.zrank(sg.mom(S, 252), el) + sg.zrank(-sg.vol(S, 252), el)
scores["comp_mom_lv"] = (comp2, False, "M")
rows = []; eqs = {}
for (name, (sc, asc, fr)), N, filt in itertools.product(scores.items(), (10, 20, 30, 50), (0, 1)):
    rd = ME if fr == "M" else WE
    w = sg.topn(sc, el, rd, N, S["regime"] if filt else None, ascending=asc)
    for lev in (1.0, 1.5, 2.0):
        eq, tr = lib.simulate(w, rd, P, D["irx"], lev=lev)
        key = f"{name}|N{N}|f{filt}|L{lev}"
        eqs[key] = eq
        row = dict(key=key, fam=name, N=N, filt=filt, lev=lev)
        for tag, a, b in (("IS05", "2005-01-01", lib.IS_END), ("IS10", lib.IS_START, lib.IS_END), ("OOS", lib.OOS_START, lib.OOS_END)):
            s = lib.stats_m(eq, a, b)
            for k, v in s.items(): row[f"{tag}_{k}"] = v
        for tag, a, b in (("IS17TRY", "2016-10-17", lib.IS_END), ("OOSTRY", lib.OOS_START, lib.OOS_END)):
            s = lib.stats_m(lib.try_eq(eq, D["usdtry"], a, b), a, b)
            for k, v in s.items(): row[f"{tag}_{k}"] = v
        row["turn_yr"] = tr.loc[lib.IS_START:lib.IS_END].sum() / 15.8
        rows.append(row)
        print(key, round(row["IS10_geo"] * 100, 2), round(row["OOS_geo"] * 100, 2), round(row["OOSTRY_geo"] * 100, 2), flush=True)
df = pd.DataFrame(rows); df.to_csv(lib.R / "xs_grid.csv", index=False)
pd.to_pickle(eqs, lib.R / "xs_eqs.pkl")
