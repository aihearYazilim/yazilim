import sys; sys.path.insert(0, "/home/user/yazilim/research/crypto_events_audit"); sys.path.insert(0, "/home/user/yazilim/research/crypto_events")
import pandas as pd, port_fix as PF, combo, trades as T
pd.set_option("display.width", 250)
trs = [t for k in combo.BOOKS["IS_best"] for t in combo.gen(k)]
rows = {}
for s in [0.1, 0.2]:
    for cap in [100_000, 25_000]:
        for mtm in [False, True]:
            d = PF.both(trs, s, 2.0, 1, cap0=cap, mtm_gross=mtm); rows[f"s={s} cap={cap/1e3:.0f}k mtmGross={mtm}"] = {k: v for k, v in d.items() if not k.startswith("_")}
print(pd.DataFrame(rows).T.to_string())
d = PF.both(trs, 0.2, 2.0, 1)
for nm in ["IS", "OOS"]:
    r = d[f"_{nm}_r"]; m = (1 + r).resample("ME").prod() - 1
    print(nm, "yearly:", ((1 + r).resample("YE").prod() - 1).round(3).to_dict())
