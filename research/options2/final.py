"""Detail for the selected variants: yearly, OOS monthly, MTM DD episodes, rolling-12m IS distribution."""
import numpy as np, pandas as pd, eng, exp
pd.set_option("display.width", 250)
FX = eng.fx()
V = {
 "REF base 2x PM": dict(size=2.0, margin="PM"),
 "REF base 2x STD": dict(size=2.0, margin="STD"),
 "A mh10P 30d 2x PM": dict(mhedge=0.1, mhedge_side="P", mhedge_ratio=1.0, size=2.0, margin="PM"),
 "A' mh10P 30d 2x STD": dict(mhedge=0.1, mhedge_side="P", mhedge_ratio=1.0, size=2.0, margin="STD"),
 "B mh10P 35d 3x PM": dict(d=0.35, mhedge=0.1, mhedge_side="P", mhedge_ratio=1.0, size=3.0, margin="PM"),
 "B' mh10P 35d 3x STD": dict(d=0.35, mhedge=0.1, mhedge_side="P", mhedge_ratio=1.0, size=3.0, margin="STD"),
 "C mh10P 40d 2x STD": dict(d=0.4, mhedge=0.1, mhedge_side="P", mhedge_ratio=1.0, size=2.0, margin="STD"),
}
out = {}
for nm, p in V.items():
    r = exp.make(p).run(); out[nm] = r
    pr = (r.Enext / r.E0 - 1).where(r.E0 > 0, -1)
    eq = (1 + pr).cumprod()
    yr = (1 + pr).groupby(pd.to_datetime(r.index).year).prod() - 1
    # rolling 52-week windows inside IS
    isr = pr[pr.index < eng.OOS0]
    roll = [(1 + isr.iloc[i:i + 52]).prod() ** (1 / 12) - 1 for i in range(0, len(isr) - 52)]
    mtm = (r.minE / r.E0 - 1)
    print(f"\n=== {nm}")
    for per, lo, hi in exp.PER:
        s = eng.stats(r, lo, hi, FX); print(per, {k: round(v, 4) if isinstance(v, float) else v for k, v in s.items()})
    print("year:", yr.round(3).to_dict())
    print("IS rolling-12m monthly geo: p5 %.4f p25 %.4f med %.4f p75 %.4f | frac<0 %.2f" % tuple(list(np.percentile(roll, [5, 25, 50, 75])) + [np.mean(np.array(roll) < 0)]))
    print("worst intraweek MTM weeks:", mtm.nsmallest(4).round(3).to_dict())
    o = r[r.index >= eng.OOS0]; po = pr[pr.index >= eng.OOS0]
    mo = (1 + po).groupby(pd.to_datetime(o.end).dt.to_period("M")).prod() - 1
    print("OOS monthly:", mo.round(3).to_dict())
    print("OOS active weeks:", int(o.active.sum()), "liq weeks:", int((o.nliq > 0).sum()))
pd.to_pickle(out, eng.D / "raw" / "final_series.pkl")
