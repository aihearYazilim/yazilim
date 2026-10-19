"""E6: neighbourhood + cost robustness of the hedged family (monthly long put hedge, 1:1 / 0.5) and wing variants:
short delta 0.25/0.3/0.35/0.4, size 2/3/4, STD & PM; wing/hedge cost stress (half-spread 10%, 2-tick minimum)."""
import exp
C = []
for d in (0.25, 0.3, 0.35, 0.4):
    for hd, r in ((0.1, 1.0), (0.05, 1.0), (0.1, 0.5)):
        for size in (2, 3, 4):
            for m in ("STD", "PM"):
                C.append((f"mh{hd}_P_r{r}|d{d}|s{size}|{m}", dict(d=d, mhedge=hd, mhedge_side="P", mhedge_ratio=r, size=float(size), margin=m)))
for nm, p in (("mh0.1_P_r1.0", dict(mhedge=0.1, mhedge_side="P", mhedge_ratio=1.0)), ("wing0.08_put", dict(wing=0.08, wing_side="put")),
              ("wing0.1_both", dict(wing=0.1)), ("base", {})):
    for size in (2, 3):
        for m in ("STD", "PM"):
            C.append((f"{nm}|COST|s{size}|{m}", dict(p, size=float(size), margin=m, wing_h=0.10, wing_ticks=2.0, h=0.07)))
print(len(C)); exp.run_all(C, "e6")
