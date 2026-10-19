"""Stress on the OOS path, as combo/stress_v5.py, with the upgraded cash leg.
(a) USDTRY jump j in {10%, 15%} at the 5th VİOP day of each OOS month (11 runs) - identical to v5; NEW: at the same
    moment the TL yield curve (3m, 6m, 2y) jumps +10pp (j=10%) / +15pp (j=15%) and stays (Mar-2025-type rate shock),
    which marks the T-bill book (and VİOP-posted bills) down and raises the bid-ask cost of forced sales.
(b) crypto May-2021 crash (4 weeks), identical to v5."""
import sys, pathlib, json
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; ROOT = H.parents[1]
sys.path.insert(0, str(H)); sys.path.insert(0, str(ROOT / "research/combo")); sys.dont_write_bytecode = True
import combo_cash as CC
import combo_v5 as V
import combo_v4 as V4
import combo_v3 as V3
import stress_v5 as S5
import cashlib as CL

CFG = []
for Lm, lab in ((5, "#1 IV L5"), (3, "#3 IV L3")):
    for C in CC.CAPS:
        for cash, viop in (("D32", "nema0"), ("D32", "nema1"), ("BEST3", "nema0"), ("BEST3", "nema1"),
                           ("BEST3", "dibs0"), ("BEST3", "dibs1")):
            CFG.append(dict(label=f"{lab} {cash} {viop}", Lm=Lm, C=C, w=CC.W5[Lm], cash=cash, viop=viop))


def run(js=(0.10, 0.15)):
    D = V.prep(V.OOS0, V.OOS1, 2); idx = D["idx"]
    fd = sorted(x for x in V4.F0.date.unique() if pd.Timestamp(x) >= V.OOS0)
    s = pd.Series(fd, index=fd); jds = s.groupby(s.dt.to_period("M")).apply(lambda q: q.iloc[min(4, len(q) - 1)]).values[:-1]
    A0 = {Lm: V4.carry_arrays(idx, Lm) for Lm in (3, 5)}; M0 = CL.market(idx)
    rows = []
    def rec(cf, kind, j, jd, e, t, dg):
        st = V.stats(e, t)
        rows.append(dict(label=cf["label"], C=cf["C"], kind=kind, j=j, jd=jd, geo=st["geo"], dd=st["maxdd_mtm"], ddc=st["maxdd"],
                         worst=st["worst_m"], nliq=dg["nliq"], ncall=dg["ncall"]))
    for cf in CFG:
        e, t, dg = CC.sim(D, A0[cf["Lm"]], cf["C"], cf["w"], cf["cash"], cf["viop"], M=M0); rec(cf, "base", 0, None, e, t, dg)
    for j in js:
        for jd in jds:
            jd = pd.Timestamp(jd); F, dd = S5.shocked(jd, j); ii = idx.searchsorted(jd)
            M = dict(M0)
            for c in ("y3", "y6", "y24"): a = M0[c].copy(); a[ii:] += j; M[c] = a
            Dj = dict(D); fx = D["fx"].copy(); fx[ii:] *= 1 + 0.43 * j; Dj["fx"] = fx
            AJ = {Lm: V4.carry_arrays(idx, Lm, F, dd) for Lm in (3, 5)}
            for cf in CFG:
                e, t, dg = CC.sim(Dj, AJ[cf["Lm"]], cf["C"], cf["w"], cf["cash"], cf["viop"], M=M,
                                  shocks=dict(cshock=(ii, -j), kshock=(ii, -j / 2)))
                rec(cf, "usdtry+rates", j, jd, e, t, dg)
    OW = V3.OW; exp_i = np.where(D["start"] >= 0)[0]
    months = pd.Series(exp_i, index=idx[exp_i]).groupby(idx[exp_i].to_period("M")).first().values[:-1]
    for first in months:
        k0 = list(exp_i).index(first); sel = exp_i[k0:k0 + 4]; owk = {}
        for i, dmay in zip(sel, S5.MAY):
            row = OW.loc[pd.Timestamp(dmay)]; owk[i] = (row["r2"], row["trough2"], D["start"][i])
        for cf in CFG:
            e, t, dg = CC.sim(D, A0[cf["Lm"]], cf["C"], cf["w"], cf["cash"], cf["viop"], M=M0, shocks=dict(owk=owk))
            rec(cf, "crypto_may21", 0, idx[first], e, t, dg)
    return pd.DataFrame(rows)


if __name__ == "__main__":
    R = run(); R.to_csv(H / "results/stress_cash_runs.csv", index=False)
    g = R.groupby(["label", "C", "kind", "j"], sort=False)
    S = pd.DataFrame({"geo_med": g.geo.median() * 100, "geo_worst": g.geo.min() * 100, "dd_med": g.dd.median() * 100,
                      "dd_worst": g.dd.min() * 100, "ddc_med": g.ddc.median() * 100, "worstm": g.worst.min() * 100,
                      "liq_runs": g.nliq.apply(lambda x: int((x > 0).sum())), "n": g.size()})
    S.to_csv(H / "results/stress_cash.csv")
    pd.set_option("display.width", 250); pd.set_option("display.max_rows", 500)
    print(S.round(2).to_string()); print("stress sims:", len(R))
