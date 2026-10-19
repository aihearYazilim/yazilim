import sys, time, pandas as pd, eng, strat
fx = eng.fx()
for margin in sys.argv[1:]:
    t=time.time()
    sim = eng.Sim(eng.sched_weekly(), strat.strangle(strat.f_dvol()), size=2.0, k=2.0, margin=margin)
    r = sim.run(); r.to_pickle(f"raw/t_base_{margin}.pkl")
    print(margin, round(time.time()-t), "s")
    for nm, lo, hi in (("IS", "2021-04-01", eng.OOS0), ("OOS", eng.OOS0, eng.OOS1)):
        print(nm, {k: round(v, 4) for k, v in eng.stats(r, lo, hi, fx).items()})
