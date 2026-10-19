"""E1: tail protection on the weekly DVOL-filtered 30d strangle: same-expiry long wings (iron condor /
put-only broken wing) or a monthly 5-10d long put / strangle hedge; sizes 2-6x; STD and PM margin."""
import exp
structs = [("base", {})]
for w in (0.03, 0.05, 0.08, 0.10, 0.15):
    for side in ("both", "put"):
        structs.append((f"wing{w}_{side}", dict(wing=w, wing_side=side)))
for hd in (0.05, 0.10):
    for side in ("P", "PC"):
        for ratio in (0.5, 1.0):
            structs.append((f"mh{hd}_{side}_r{ratio}", dict(mhedge=hd, mhedge_side=side, mhedge_ratio=ratio)))
C = []
for sn, sp in structs:
    for size in (2, 3, 4, 5, 6):
        for m in ("STD", "PM"):
            p = dict(sp, size=float(size), margin=m); C.append((f"{sn}|s{size}|{m}", p))
print(len(C), "configs")
df = exp.run_all(C, "e1")
