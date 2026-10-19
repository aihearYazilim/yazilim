from common import R
from variants import *
OOS0 = "2025-10-17"
V = {
 "orig: interp, 5% half-spread": (interp_strangle, dict(h=0.05)),
 "interp, half-spread 1 vol pt": (interp_strangle, dict(volpts=0.01)),
 "interp, half-spread 2 vol pt": (interp_strangle, dict(volpts=0.02)),
 "LISTED strike+actual mark, 5%": (listed_strangle, dict(h=0.05)),
 "LISTED, 1 vol pt": (listed_strangle, dict(volpts=0.01)),
 "LISTED, 2 vol pt": (listed_strangle, dict(volpts=0.02)),
}
U = {}
rows = []
for name, (fn, kw) in V.items():
    u = build_unit(fn, **kw); U[name] = u
    for sz in (1, 2, 3):
        a = stats(series_from(u, sz, True, "2021-04-01", OOS0)); b = stats(series_from(u, sz, True, OOS0))
        rows.append(dict(variant=name, size=sz, IS_geo=a["geo"], IS_dd=a["dd"], OOS_geo=b["geo"], OOS_dd=b["dd"], OOS_worst_m=b["worst_m"], OOS_act=b["n_act"], nan=int(u.r.isna().sum())))
T = pd.DataFrame(rows)
pd.set_option("display.width", 200)
print(T.round(4).to_string())
pd.to_pickle(U, "units.pkl")
# compare listed vs interp per trade
a, b = U["orig: interp, 5% half-spread"], U["LISTED strike+actual mark, 5%"]
d = (b.r - a.r)
print("\nlisted - interp per-trade unit return: mean %.5f median %.5f sd %.5f; on-filter mean %.5f" % (d.mean(), d.median(), d.std(), d[a.on].mean()))
# sample of listed picks
for e in R.ENT["W"][-6:-2]:
    print(e["cur"], e["day"], listed_strangle(e)[1], "interp K:", round(e["sm"].strike(-.3, False)), round(e["sm"].strike(.3, True)))
