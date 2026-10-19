"""v6 stress on the OOS path (configs from results/stress_cfgs_v6.json).
(a) USDTRY jump j in {10%, 15%} at the 5th VİOP day of each OOS month (11 runs), as cash_upgrade/stress_cash.py:
    futures intraday high = prev settle x (1+j), settles/highs after x (1+0.43j), signal-panel spot x (1+0.43j),
    TL curve (3m/6m/2y) +j (10/15pp) and stays; USD sleeves (Deribit, event book) converted at FX x (1+0.43j);
    BIST-C -j on the jump day (if invested); XU030 put-spread sleeve: instantaneous XU030 gap of -j re-priced with
    Black-76 at IV x1.5 on the position held that day (sleeves_v6 gap table).
(b) Crypto crash (May-2021 type): the 4 weekly option results of entries 2021-04-30..2021-05-21 of the v6 option sleeve
    (40d + 10d put, 2x, with their intraweek troughs) replace 4 consecutive OOS weeks from the first expiry of each OOS
    month (11 runs); the event book's worst 20-business-day IS stretch is injected over the same 4 weeks (the book had no
    data in May 2021; it is BTC-hedged, so this is a conservative stand-in).
(c) XU030 -15% gap at the 5th VİOP day of each OOS month (11 runs): put-spread sleeve re-priced at -15%/IV x1.5,
    BIST-C -15% (if invested); USDTRY/crypto unchanged."""
import sys, pathlib, json
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; OUT = H / "results"; ROOT = H.parents[1]
sys.path.insert(0, str(H)); sys.path.insert(0, str(ROOT / "research/cash_upgrade")); sys.dont_write_bytecode = True
import combo_v6 as C6
import combo_v5 as V
import stress_v5 as S5
import cashlib as CL

MAY = S5.MAY


def invested(D, ii):
    lo = max(ii - 3, 1)
    return float(np.any(np.abs(D["c"][lo:ii + 1] - D["on_c"][lo:ii + 1]) > 1e-6))


def xgap(D, ii, g):
    t = D["xgap"]; col = min(t.columns, key=lambda c: abs(c - g))
    v = t[col].asof(D["idx"][ii]); return float(v) * abs(g / col)


def run(CFG, js=(0.10, 0.15)):
    DD = {nema: C6.prep6(C6.OOS0, C6.OOS1, xu_nema=nema) for nema in (1.0, 0.0)}
    DI = C6.prep6(C6.IS0, C6.IS1)
    idx = DD[1.0]["idx"]
    fd = sorted(x for x in V.V4.F0.date.unique() if pd.Timestamp(x) >= C6.OOS0)
    s = pd.Series(fd, index=fd); jds = s.groupby(s.dt.to_period("M")).apply(lambda q: q.iloc[min(4, len(q) - 1)]).values[:-1]
    A0 = {Lm: V.V4.carry_arrays(idx, Lm) for Lm in (3, 5)}
    rows = []
    def rec(cf, kind, j, jd, e, t, dg):
        st = C6.stats(e, t)
        rows.append(dict(label=cf["label"], C=cf["C"], kind=kind, j=j, jd=jd, geo=st["geo"], dd=st["maxdd_mtm"], ddc=st["maxdd"],
                         worst=st["worst_m"], nliq=dg["nliq"], ncall=dg["ncall"]))
    Dn = lambda cf: DD[1.0 if cf["viop"].endswith("1") else 0.0]
    for cf in CFG:
        e, t, dg = C6.sim(Dn(cf), A0[cf["Lm"]], cf["C"], cf["w"], cf["viop"]); rec(cf, "base", 0, None, e, t, dg)
    # (a) USDTRY + rates jump
    for j in js:
        for jd in jds:
            jd = pd.Timestamp(jd); F, dd = S5.shocked(jd, j); ii = idx.searchsorted(jd)
            AJ = {Lm: V.V4.carry_arrays(idx, Lm, F, dd) for Lm in (3, 5)}
            for cf in CFG:
                D0 = Dn(cf); D = dict(D0)
                M = dict(D0["M"])
                for c in ("y3", "y6", "y24"): a = D0["M"][c].copy(); a[ii:] += j; M[c] = a
                D["M"] = M; fx = D0["fx"].copy(); fx[ii:] *= 1 + 0.43 * j; D["fx"] = fx
                sh = dict(cshock=(ii, -j * invested(D0, ii)), xshock=(ii, xgap(D0, ii, -j)))
                e, t, dg = C6.sim(D, AJ[cf["Lm"]], cf["C"], cf["w"], cf["viop"], shocks=sh)
                rec(cf, "usdtry+rates+xu", j, jd, e, t, dg)
    # (b) crypto May-2021
    T = C6.S6["opt"][C6.OPT0]
    ce = pd.Series(np.cumprod(1 + DI["e"]), DI["idx"]); r20 = ce / ce.shift(20) - 1; k = int(np.nanargmin(r20.values))
    eseq = DI["e"][k - 19:k + 1]
    for cf in CFG:
        D = Dn(cf); exp_i = np.where(D["start"] >= 0)[0]
        months = pd.Series(exp_i, index=idx[exp_i]).groupby(idx[exp_i].to_period("M")).first().values[:-1]
        for first in months:
            k0 = list(exp_i).index(first); sel = exp_i[k0:k0 + 4]; owk = {}
            for i, dmay in zip(sel, MAY):
                row = T.loc[pd.Timestamp(dmay)]; owk[i] = (row.r, row.trough, D["start"][i])
            sh = dict(owk=owk, eseq=(D["start"][sel[0]] + 1, eseq))
            e, t, dg = C6.sim(D, A0[cf["Lm"]], cf["C"], cf["w"], cf["viop"], shocks=sh)
            rec(cf, "crypto_may21", 0, idx[first], e, t, dg)
    # (c) XU030 -15% gap
    for jd in jds:
        jd = pd.Timestamp(jd); ii = idx.searchsorted(jd)
        for cf in CFG:
            D = Dn(cf)
            sh = dict(cshock=(ii, -0.15 * invested(D, ii)), xshock=(ii, xgap(D, ii, -0.15)))
            e, t, dg = C6.sim(D, A0[cf["Lm"]], cf["C"], cf["w"], cf["viop"], shocks=sh)
            rec(cf, "xu030_gap15", 0.15, jd, e, t, dg)
    return pd.DataFrame(rows), float(r20.iloc[k])


if __name__ == "__main__":
    CFG = json.load(open(OUT / "stress_cfgs_v6.json"))
    for c in CFG: c["w"] = tuple(c["w"])
    R, ew = run(CFG); R.to_csv(OUT / "stress_v6_runs.csv", index=False)
    g = R.groupby(["label", "C", "kind", "j"], sort=False)
    S = pd.DataFrame({"geo_med": g.geo.median() * 100, "geo_worst": g.geo.min() * 100, "dd_med": g.dd.median() * 100,
                      "dd_worst": g.dd.min() * 100, "ddc_med": g.ddc.median() * 100, "worstm": g.worst.min() * 100,
                      "liq_runs": g.nliq.apply(lambda x: int((x > 0).sum())), "n": g.size()})
    S.to_csv(OUT / "stress_v6.csv")
    pd.set_option("display.width", 250); pd.set_option("display.max_rows", 500)
    print("event-book worst 20d IS stretch:", round(ew * 100, 1), "%")
    print(S.round(2).to_string()); print("stress sims:", len(R))
