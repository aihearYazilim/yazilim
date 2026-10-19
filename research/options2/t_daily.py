import sys, time, pandas as pd, eng, strat
fx = eng.fx()
t=time.time()
sim = eng.Sim(eng.sched_daily(), strat.strangle(strat.f_dvol(), d=0.3, tenor=1), size=float(sys.argv[1]), k=2.0, margin="STD", h=0.07)
r = sim.run(); r.to_pickle("raw/t_daily.pkl")
print(round(time.time()-t), "s")
for nm, lo, hi in (("IS", "2021-04-01", eng.OOS0), ("IS22", "2022-01-01", eng.OOS0), ("OOS", eng.OOS0, eng.OOS1)):
    print(nm, {k: round(v, 4) for k, v in eng.stats(r, lo, hi, fx).items()})
r["y"]=r.index.str[:4]; r["pr"]=r.Enext/r.E0-1
print(r.groupby("y").agg(act=("active","sum"), m=("pr", lambda s: (1+s).prod()-1)))
