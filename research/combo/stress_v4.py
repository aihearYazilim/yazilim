"""v4 jump stress on the OOS path (as try_carry_audit/stress.py): Mar-2025-type shock injected at the 5th trading day
of each OOS month (11 runs): VİOP USDTRY futures intraday high = prev settle x (1+j), all settles/highs from that day
on x (1+0.43j) (level persists), spot close in the signal panel x (1+0.43j) (vol/leverage reacts).
Consistent cross-sleeve shock: Deribit sleeve's USDTRY conversion x (1+0.43j) from that day (USD assets gain in TRY),
BIST-C sleeve -j on the jump day (Mar-2025: BIST100 -16% in 3 days). Live IPO shares are NOT shocked (optimistic).
j in {10%, 15%}. Margin calls can only be met from free PPF; IPO-pledged units are blocked."""
import sys, pathlib, itertools
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; OUT = H / "results"
sys.path.insert(0, str(H)); sys.dont_write_bytecode = True
import combo as CB, combo_v3 as V3, combo_v4 as V

tr, pxs = CB.load_ipos()


def shocked(jd, j):
    k = 0.43 * j
    F = V.F0.copy(); m = F.date >= jd
    for c in ["settle", "high", "low", "open", "close"]:
        F.loc[m, c] = F.loc[m, c] * (1 + k)
    prevd = F.date[F.date < jd].max()
    ps = V.F0[V.F0.date == prevd].set_index("code").settle
    mm = F.date == jd
    F.loc[mm, "high"] = np.maximum(F.loc[mm, "high"].values, F.loc[mm, "code"].map(ps).values * (1 + j))
    dd = V.D_PANEL.copy(); dd.loc[dd.index >= jd, "close"] *= (1 + k)
    return F, dd


def run_stress(configs, js=(0.10, 0.15)):
    """configs: list of dicts(C, k, sz, Lm, h, nema, w, label, carry=True). returns DataFrame."""
    Ds = {sz: V3.prep(V3.OOS0, V3.OOS1, sz) for sz in (1, 2)}
    ev = V3.ipo_events(tr, pxs, Ds[1]["idx"])
    idx = Ds[1]["idx"]
    fd = sorted(x for x in V.F0.date.unique() if pd.Timestamp(x) >= V3.OOS0)
    s = pd.Series(fd, index=fd); jds = s.groupby(s.dt.to_period("M")).apply(lambda q: q.iloc[min(4, len(q) - 1)]).values[:-1]
    cache = {}; rows = []
    for j in js:
        for jd in jds:
            jd = pd.Timestamp(jd); F, dd = shocked(jd, j)
            for cf in configs:
                key = (j, jd, cf["Lm"])
                if key not in cache: cache[key] = V.carry_arrays(idx, cf["Lm"], F, dd)
                D = dict(Ds[cf["sz"]]); fx = D["fx"].copy(); ii = idx.searchsorted(jd)
                fx[ii:] *= 1 + 0.43 * j; D["fx"] = fx
                e, t, dg = V.sim(D, ev, cache[key], cf["C"] / cf["k"], cf["w"], cf["h"], cf["nema"],
                                 carry=cf.get("carry", True), ipo=cf.get("ipo", True), cshock=(ii, -j))
                st = V.stats(e * cf["k"], t)
                rows.append(dict(label=cf["label"], C=cf["C"], k=cf["k"], j=j, jd=jd, geo=st["geo"], dd=st["maxdd_mtm"], ddc=st["maxdd"],
                                 worst=st["worst_m"], nliq=dg["nliq"], ncall=dg["ncall"]))
    return pd.DataFrame(rows)


def summarize(R):
    g = R.groupby(["label", "C", "k", "j"])
    return pd.DataFrame({"geo_med": g.geo.median(), "geo_worst": g.geo.min(), "dd_med": g.dd.median(), "dd_worst": g.dd.min(), "ddclose_med": g.ddc.median(), "ddclose_worst": g.ddc.min(),
                         "worstm_worst": g.worst.min(), "liq_runs": g.nliq.apply(lambda x: int((x > 0).sum())), "n": g.size()})


if __name__ == "__main__":
    cfgs = []
    for C, k in [(100_000, 4), (100_000, 1), (1_000_000, 1), (5_000_000, 1)]:
        for Lm in (3, 5):
            cfgs.append(dict(label=f"P1 PPF+IPO+carry {Lm}x", C=C, k=k, sz=1, Lm=Lm, h=0.2, nema=0.0, w=(1, 0, 0)))
            cfgs.append(dict(label=f"SH4 .7/.1/.2 opt2x +carry {Lm}x", C=C, k=k, sz=2, Lm=Lm, h=0.2, nema=0.0, w=(0.7, 0.1, 0.2)))
            cfgs.append(dict(label=f"EQ opt2x +carry {Lm}x", C=C, k=k, sz=2, Lm=Lm, h=0.2, nema=0.0, w=(1/3, 1/3, 1/3)))
        cfgs.append(dict(label="ref v3 EQ opt2x no carry", C=C, k=k, sz=2, Lm=3, h=0.2, nema=0.0, w=(1/3, 1/3, 1/3), carry=False))
        cfgs.append(dict(label="ref PPF+IPO no carry", C=C, k=k, sz=1, Lm=3, h=0.2, nema=0.0, w=(1, 0, 0), carry=False))
    for Lm in (3, 5):
        cfgs.append(dict(label=f"ref carry only {Lm}x", C=1_000_000, k=1, sz=1, Lm=Lm, h=0.2, nema=0.0, w=(1, 0, 0), ipo=False))
    R = run_stress(cfgs); R.to_csv(OUT / "stress_v4_runs.csv", index=False)
    S = summarize(R); S.to_csv(OUT / "stress_v4.csv")
    pd.set_option("display.width", 250); pd.set_option("display.max_rows", 500)
    print(S.round(2).to_string())
