"""E2: tenor — daily 1DTE (every day 09:00 -> next day 08:00), bi-weekly 14d (two phases), weekly delta neighbours.
Same DVOL > 365d-median filter. Daily half-spread 7% (measured ~6% on real taker sells)."""
import exp
C = []
for d in (0.15, 0.2, 0.3, 0.4):
    for size in (1, 2, 3):
        C.append((f"D1|d{d}|s{size}", dict(tenor=1, d=d, size=float(size), h=0.07)))
for d in (0.2, 0.3, 0.4):
    for size in (2, 3, 4):
        for ph, st in (("a", "2021-04-02"), ("b", "2021-04-09")):
            C.append((f"B14{ph}|d{d}|s{size}", dict(tenor=14, d=d, size=float(size), start=st)))
for d in (0.2, 0.25, 0.35, 0.4):
    for size in (2, 3):
        C.append((f"W|d{d}|s{size}", dict(d=d, size=float(size))))
print(len(C)); exp.run_all(C, "e2")
