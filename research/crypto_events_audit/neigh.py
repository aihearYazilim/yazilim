"""Audit: neighbour-parameter books under the corrected sim (port_fix.both, s=0.2, G=2, hedge=1, $100k start per window)."""
import sys; sys.path.insert(0, "/home/user/yazilim/research/crypto_events_audit"); sys.path.insert(0, "/home/user/yazilim/research/crypto_events")
import pandas as pd, port_fix as PF, combo
pd.set_option("display.width", 250)
base = combo.BOOKS["IS_best"]
var = {"base": base}
for i, alt in [(0, ("UNL", 0.05, 10, 3, 1.0)), (0, ("UNL", 0.10, 7, 3, 1.0)), (0, ("UNL", 0.10, 14, 3, 1.0)), (0, ("UNL", 0.10, 10, 1, 1.0)), (0, ("UNL", 0.10, 10, 3, 0.5)),
               (1, ("CMS", "MON", -1, 72, 0.5)), (1, ("CMS", "MON", -1, 336, 0.5)), (1, ("CMS", "MON", -1, 168, 0.2)),
               (2, ("CMS", "DEL", -1, 24, 0.2)), (2, ("CMS", "DEL", -1, 168, 0.2)), (2, ("CMS", "DEL", -1, 72, 0.5)),
               (3, ("CMS", "LIST", -1, 336, 0.2)), (3, ("CMS", "LIST", -1, 720, 0.5))]:
    b = list(base); b[i] = alt; var[str(alt)] = b
for i, nm in enumerate(["no UNL", "no MON", "no DEL", "no LIST"]):
    var[nm] = [k for j, k in enumerate(base) if j != i]
rows = {}
for nm, keys in var.items():
    trs = [t for k in keys for t in combo.gen(k)]
    d = PF.both(trs, 0.2, 2.0, 1); rows[nm] = {k: v for k, v in d.items() if not k.startswith("_")}
print(pd.DataFrame(rows).T.to_string())
