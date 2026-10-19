"""v5 stress on the OOS path (no funds / no IPOs).
(a) USDTRY jump (Mar-2025 type, as stress_v4): at the 5th VİOP trading day of each OOS month (11 runs) the futures
    intraday high = prev settle x (1+j), all settles/highs from then on x (1+0.43j), spot in the signal panel x (1+0.43j);
    Deribit sleeve USDTRY conversion x (1+0.43j) from that day; BIST-C -j on the jump day; KELLY -j/2 on the jump day
    (crude: its USDTRY/XU030 exposure is not reconstructed). j in {10%, 15%}.
(b) Crypto crash (May-2021 type): the 4 weekly option results of the entries 2021-04-30..2021-05-21 (2x: -13.7%, +1.5%,
    -52.2% with partial liquidation, +13.6%; same rows for 1x) and their intra-week troughs replace 4 consecutive OOS
    weeks starting at the first expiry of each OOS month (11 runs); KELLY daily returns of 2021-05-03..2021-05-28 replace
    the same 4 weeks (KELLY holds crypto).
"""
import sys, pathlib
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; OUT = H / "results"
sys.path.insert(0, str(H)); sys.dont_write_bytecode = True
import combo_v5 as V
import combo_v4 as V4
import combo_v3 as V3

def shocked(jd, j):          # copy of stress_v4.shocked (that module loads IPO data at import)
    k = 0.43 * j
    F = V4.F0.copy(); m = F.date >= jd
    for c in ["settle", "high", "low", "open", "close"]:
        F.loc[m, c] = F.loc[m, c] * (1 + k)
    prevd = F.date[F.date < jd].max()
    ps = V4.F0[V4.F0.date == prevd].set_index("code").settle
    mm = F.date == jd
    F.loc[mm, "high"] = np.maximum(F.loc[mm, "high"].values, F.loc[mm, "code"].map(ps).values * (1 + j))
    dd = V4.D_PANEL.copy(); dd.loc[dd.index >= jd, "close"] *= (1 + k)
    return F, dd


MAY = ["2021-04-30", "2021-05-07", "2021-05-14", "2021-05-21"]


def run(configs, js=(0.10, 0.15)):
    Ds = {sz: V.prep(V.OOS0, V.OOS1, sz) for sz in (1, 2)}
    idx = Ds[1]["idx"]
    fd = sorted(x for x in V4.F0.date.unique() if pd.Timestamp(x) >= V.OOS0)
    s = pd.Series(fd, index=fd); jds = s.groupby(s.dt.to_period("M")).apply(lambda q: q.iloc[min(4, len(q) - 1)]).values[:-1]
    A0 = {Lm: V4.carry_arrays(idx, Lm) for Lm in (3, 5)}
    rows = []; cache = {}
    def rec(cf, kind, j, jd, e, t, dg):
        st = V.stats(e, t)
        rows.append(dict(label=cf["label"], C=cf["C"], kind=kind, j=j, jd=jd, geo=st["geo"], dd=st["maxdd_mtm"],
                         ddc=st["maxdd"], worst=st["worst_m"], nliq=dg["nliq"], ncall=dg["ncall"]))
    for cf in configs:
        e, t, dg = V.sim(Ds[cf["sz"]], A0[cf["Lm"]], cf["C"], cf["w"], cf["prod"], cf["nema"]); rec(cf, "base", 0, None, e, t, dg)
    # (a) jumps
    for j in js:
        for jd in jds:
            jd = pd.Timestamp(jd); F, dd = shocked(jd, j); ii = idx.searchsorted(jd)
            for cf in configs:
                key = (j, jd, cf["Lm"])
                if key not in cache: cache[key] = V4.carry_arrays(idx, cf["Lm"], F, dd)
                D = dict(Ds[cf["sz"]]); fx = D["fx"].copy(); fx[ii:] *= 1 + 0.43 * j; D["fx"] = fx
                e, t, dg = V.sim(D, cache[key], cf["C"], cf["w"], cf["prod"], cf["nema"],
                                 shocks=dict(cshock=(ii, -j), kshock=(ii, -j / 2)))
                rec(cf, "usdtry_jump", j, jd, e, t, dg)
        cache = {}
    # (b) crypto crash
    OW = V3.OW; KL = V.SL.KELLY
    kmay = KL.loc["2021-05-03":"2021-05-28"].values
    for sz in (1, 2):
        D = Ds[sz]; exp_i = np.where(D["start"] >= 0)[0]
        months = pd.Series(exp_i, index=idx[exp_i]).groupby(idx[exp_i].to_period("M")).first().values[:-1]
        for first in months:
            k0 = list(exp_i).index(first); sel = exp_i[k0:k0 + 4]
            owk = {}
            for i, dmay in zip(sel, MAY):
                row = OW.loc[pd.Timestamp(dmay)]; owk[i] = (row[f"r{sz}"], row[f"trough{sz}"], D["start"][i])
            i_a = D["start"][sel[0]] + 1; kk = np.zeros(len(idx)); L = min(len(kmay), len(idx) - i_a)
            for cf in [c for c in configs if c["sz"] == sz]:
                D2 = dict(D); kr = D["k"].copy(); kr[i_a:i_a + L] = kmay[:L]; D2["k"] = kr
                e, t, dg = V.sim(D2, A0[cf["Lm"]], cf["C"], cf["w"], cf["prod"], cf["nema"], shocks=dict(owk=owk))
                rec(cf, "crypto_may21", 0, idx[first], e, t, dg)
    return pd.DataFrame(rows)


def summarize(R):
    g = R.groupby(["label", "C", "kind", "j"])
    return pd.DataFrame({"geo_med": g.geo.median(), "geo_worst": g.geo.min(), "dd_med": g.dd.median(), "dd_worst": g.dd.min(),
                         "worstm_worst": g.worst.min(), "liq_runs": g.nliq.apply(lambda x: int((x > 0).sum())), "n": g.size()})


if __name__ == "__main__":
    import json
    cfgs = json.load(open(OUT / "stress_cfgs_v5.json"))
    for c in cfgs: c["w"] = tuple(c["w"])
    R = run(cfgs); R.to_csv(OUT / "stress_v5_runs.csv", index=False)
    S = summarize(R); S.to_csv(OUT / "stress_v5.csv")
    pd.set_option("display.width", 250); pd.set_option("display.max_rows", 500)
    print((S * 1).round(4).to_string())
