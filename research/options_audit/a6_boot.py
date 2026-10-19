"""Bootstrap OOS weeks (iid and 4-week block), IS-based resampling of 52-week windows, rolling 52w history,
and tail-week attribution of the DVOL filter."""
from common import R
import numpy as np, pandas as pd
from variants import series_from, stats
U = pd.read_pickle("units.pkl")
OOS0 = "2025-10-17"; rng = np.random.default_rng(7); B = 20000
def geo_m(r, weeks): return np.prod(1 + r, axis=-1) ** (30.44 / (7 * weeks)) - 1
def mdd(r):
    eq = np.cumprod(1 + r, axis=-1); pk = np.maximum.accumulate(np.maximum(eq, 1), axis=-1); return (eq / pk - 1).min(axis=-1)
res = []
for name in ["orig: interp, 5% half-spread", "LISTED strike+actual mark, 5%", "interp, half-spread 2 vol pt"]:
    for sz in (2, 3):
        s_all = series_from(U[name], sz, True); o = s_all[s_all.index >= OOS0].r.values; i = s_all[s_all.index < OOS0].r.values
        n = len(o)
        bi = o[rng.integers(0, n, (B, n))]
        nb = int(np.ceil(n / 4)); st = rng.integers(0, n - 3, (B, nb)); bb = np.concatenate([o[st + j][:, :, None] for j in range(4)], axis=2).reshape(B, -1)[:, :n]
        ii = i[rng.integers(0, len(i), (B, 52))]
        # block bootstrap from IS (4-week blocks) to keep vol clustering
        st2 = rng.integers(0, len(i) - 3, (B, 13)); ib = np.concatenate([i[st2 + j][:, :, None] for j in range(4)], axis=2).reshape(B, -1)
        q = lambda x: np.percentile(x, [5, 50, 95]).round(4).tolist()
        res.append(dict(variant=name, size=sz, oos_point=round(geo_m(o, n), 4),
                        oos_iid_5_50_95=q(geo_m(bi, n)), oos_block_5_50_95=q(geo_m(bb, n)), P_oos_lt0=round((geo_m(bi, n) < 0).mean(), 3),
                        IS52w_iid_5_50_95=q(geo_m(ii, 52)), IS52w_block_5_50_95=q(geo_m(ib, 52)),
                        P_IS52w_ge_oos=round((geo_m(ib, 52) >= geo_m(o, n)).mean(), 3),
                        IS52w_block_maxDD_5_50=np.percentile(mdd(ib), [5, 50]).round(3).tolist()))
pd.set_option("display.width", 250); pd.set_option("display.max_colwidth", 60)
print(pd.DataFrame(res).to_string())
# rolling 52-week windows over full history, 2x orig
s = series_from(U["orig: interp, 5% half-spread"], 2, True)
r = s.r.values; w = np.array([geo_m(r[j:j+52], 52) for j in range(len(r) - 51)])
print("\nrolling 52w monthly geo (2x orig, full history): min %.4f p10 %.4f median %.4f p90 %.4f; share < 0: %.2f" % (w.min(), *np.percentile(w, [10, 50, 90]), (w < 0).mean()))
# tail attribution of the filter (unit 1x per sleeve trade)
u = U["orig: interp, 5% half-spread"].dropna()
u["yr"] = u.day.str[:4]
print("\nper-trade unit return, filter ON vs OFF, by year (mean %, n):")
print(u.groupby(["yr", "on"]).r.agg(["mean", "size"]).unstack().mul([100, 100, 1, 1]).round(2))
on, off = u[u.on].r, u[~u.on].r
print("ON mean %.3f%% median %.3f%%; OFF mean %.3f%% median %.3f%%" % (on.mean()*100, on.median()*100, off.mean()*100, off.median()*100))
print("OFF mean excl. worst 5 trades: %.3f%%; ON mean excl. best 5: %.3f%%" % (off.sort_values().iloc[5:].mean()*100, on.sort_values().iloc[:-5].mean()*100))
print("worst 10 trades overall (1x):"); print(u.sort_values("r").head(10)[["cur", "day", "r", "on"]].round(4).to_string())
# winsorised check: fraction of weeks positive
print("hit rate ON %.2f OFF %.2f" % ((on > 0).mean(), (off > 0).mean()))
