"""Experiment runner: CONFIGS = list of (name, dict(params)); run in parallel (fork), save stats + series."""
import sys, os, time, pickle, multiprocessing as mp, numpy as np, pandas as pd
import eng, strat
FX = eng.fx()
PER = (("IS", "2021-04-01", eng.OOS0), ("IS22", "2022-01-01", eng.OOS0), ("OOS", eng.OOS0, eng.OOS1))

def make(p):
    filt = p.get("filt") or strat.f_dvol()
    tenor = p.get("tenor", 7)
    if tenor == 1: sch = eng.sched_daily(start=p.get("start", "2021-04-01"))
    elif tenor == 14: sch = eng.sched_weekly(start=p.get("start", "2021-04-02"), step=14, expiry_days=14)
    else: sch = eng.sched_weekly(start=p.get("start", "2021-04-02"))
    b = strat.strangle(filt, d=p.get("d", 0.3), tenor=tenor, wing=p.get("wing"), wing_ratio=p.get("wing_ratio", 1.0),
                       wing_side=p.get("wing_side", "both"), put_only=p.get("put_only", False),
                       mhedge=p.get("mhedge"), mhedge_ratio=p.get("mhedge_ratio", 1.0), mhedge_side=p.get("mhedge_side", "P"))
    return eng.Sim(sch, b, size=p.get("size", 2.0), k=p.get("k", 2.0), margin=p.get("margin", "STD"),
                   h=p.get("h", 0.05), ticks=p.get("ticks", 1.0), hedge=p.get("hedge"), hedge_fee=p.get("hedge_fee", 0.0005),
                   wing_h=p.get("wing_h"), wing_ticks=p.get("wing_ticks"))

CONFIGS = []
def work(i):
    name, p = CONFIGS[i]
    t = time.time()
    try:
        r = make(p).run()
    except Exception as e:
        import traceback; traceback.print_exc(); return None
    out = dict(name=name, secs=round(time.time() - t, 1))
    out.update({k: v for k, v in p.items() if k != "filt"})
    for nm, lo, hi in PER:
        for k, v in eng.stats(r, lo, hi, FX).items(): out[f"{nm}_{k}"] = v
    return out, r

def run_all(configs, tag, procs=3):
    global CONFIGS
    CONFIGS = configs
    ctx = mp.get_context("fork")
    rows, series = [], {}
    with ctx.Pool(procs) as pool:
        for res in pool.imap_unordered(work, range(len(configs))):
            if res is None: continue
            o, r = res; rows.append(o); series[o["name"]] = r
            print(o["name"], round(o.get("IS_geo", np.nan), 4), round(o.get("IS_dd_mtm", np.nan), 3), round(o.get("OOS_geo", np.nan), 4), flush=True)
    df = pd.DataFrame(rows)
    df.to_csv(eng.D / "raw" / f"res_{tag}.csv", index=False)
    pickle.dump(series, open(eng.D / "raw" / f"ser_{tag}.pkl", "wb"))
    return df
