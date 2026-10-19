"""E3: regime filters (all fixed thresholds = own trailing 365d median or 0), weekly 30d strangle, 2x and 3x, STD margin."""
import exp, strat
dv = strat.f_dvol()
F = strat.f_feat
filts = {
 "dvol": dv, "none": strat.f_none,
 "dvol_q40": strat.f_dvol(q=0.4), "dvol_q60": strat.f_dvol(q=0.6), "dvol_l180": strat.f_dvol(look=180), "dvol_l730": strat.f_dvol(look=730),
 "vrp>med": F("vrp"), "vrp>0": F("vrp", ref="const", thr=0.0), "dvol&vrp>0": F("vrp", ref="const", thr=0.0, base=dv), "dvol&vrp>med": F("vrp", base=dv),
 "dvol&vrp<med": F("vrp", op="<", base=dv),
 "ts<med": F("ts", op="<"), "ts>med": F("ts"), "dvol&ts<med": F("ts", op="<", base=dv), "dvol&ts>med": F("ts", base=dv),
 "dvol&contango": F("ts", op="<", ref="const", thr=0.0, base=dv),
 "rr>med": F("rr25_30"), "dvol&rr>med": F("rr25_30", base=dv), "dvol&rr<med": F("rr25_30", op="<", base=dv),
 "fund>med": F("fund7"), "dvol&fund>med": F("fund7", base=dv), "dvol&fund<med": F("fund7", op="<", base=dv),
 "basis>med": F("basis"), "dvol&basis>med": F("basis", base=dv), "dvol&basis<med": F("basis", op="<", base=dv),
 "atm30>med": F("atm30"), "atm7>med": F("atm7"),
}
C = []
for fn, f in filts.items():
    for size in (2, 3):
        C.append((f"{fn}|s{size}", dict(filt=f, size=float(size), fname=fn)))
print(len(C)); exp.run_all(C, "e3")
