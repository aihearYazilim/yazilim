"""v6 robustness for the IS-chosen weights (weights_v6.json), OOS (and IS) re-run with neighbouring SLEEVE variants,
weights unchanged:  XU entry day 1..9 (instead of the 1st VİOP day of the month), option sleeve 30d-2x / 35d-3x hedged
instead of 40d-2x, event book s=0.05 / entry +15 min instead of B s=0.10, XU capacity 0.5M / 2M instead of 1M.
Weight neighbours (grid points within +-0.1 of each weight) are read from all_results_v6.csv in analyze_v6.py."""
import sys, pathlib, json, itertools
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; OUT = H / "results"
sys.path.insert(0, str(H)); sys.dont_write_bytecode = True
import combo_v6 as C6

VARS = [("base", {}, 1.0)] + [(f"xu_ed{k}", dict(xu_ed=k), 1.0) for k in range(1, 10)] + \
       [("opt_30d2x", dict(opt="A' mh10P 30d 2x STD"), 1.0), ("opt_35d3x", dict(opt="B' mh10P 35d 3x STD"), 1.0),
        ("evt_s0.05", dict(evt="B_s0.05"), 1.0), ("evt_+15m", dict(evt="C15_s0.1"), 1.0),
        ("xcap_0.5M", {}, 0.5), ("xcap_2M", {}, 2.0)]


def job(args):
    name, kw, xc = args
    W = json.load(open(OUT / "weights_v6.json")); rows = []
    for per, (a, b) in {"IS": (C6.IS0, C6.IS1), "OOS": (C6.OOS0, C6.OOS1)}.items():
        Ds = {}
        for nema in (1.0, 0.0):
            k = dict(kw);
            if k.get("xu_ed", 0) and nema == 0.0: k["xu_ed"] = k["xu_ed"]
            Ds[nema] = C6.prep6(a, b, xu_nema=nema, **k)
        A = {Lm: C6.V.V4.carry_arrays(Ds[1.0]["idx"], Lm) for Lm in (3, 5)}
        for key, ws in W.items():
            Cap, Lm, viop = key.split("|"); Cap = int(Cap); Lm = int(Lm)
            for sch, w in ws.items():
                if sch == "vols": continue
                D = Ds[1.0 if viop.endswith("1") else 0.0]
                e, t, dg = C6.sim(D, A[Lm], Cap, tuple(w), viop, xcap=C6.XCAP * xc)
                s = C6.stats(e, t)
                rows.append(dict(var=name, period=per, C=Cap, Lmax=Lm, viop=viop, scheme=sch, geo=s["geo"],
                                 maxdd_mtm=s["maxdd_mtm"], worst_m=s["worst_m"]))
    return rows


if __name__ == "__main__":
    import multiprocessing as mp
    with mp.Pool(4) as p: out = p.map(job, VARS)
    R = pd.DataFrame([r for o in out for r in o]); R.to_csv(OUT / "robust_v6.csv", index=False)
    print("robust sims:", len(R))
