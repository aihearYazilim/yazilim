"""Summaries for the EM carry cross-section (reads results_all.csv / series.pkl from sim.py, panels from data/)."""
import pathlib, warnings, numpy as np, pandas as pd
warnings.filterwarnings("ignore")
import sim

H = pathlib.Path(__file__).resolve().parent
df = pd.read_csv(H / "results_all.csv")
S = pd.read_pickle(H / "series.pkl")
OTHERS = [c for c in sim.CCYS if c != "TRY"]
pd.set_option("display.width", 250); pd.set_option("display.max_rows", 500); pd.set_option("display.max_columns", 50)


def active_years(name, f, Lm, mt=0.075, hi="high"):
    r = S[(name, f, Lm, mt, hi)]
    held = (r.abs() > 1e-9)
    fr = held.groupby(r.index.year).mean()
    return ",".join(f"{y % 100:02d}" for y, v in fr.items() if v > 0.10)


def yearly(name, f, Lm, mt=0.075, hi="high"):
    r = S[(name, f, Lm, mt, hi)]
    held = (r.abs() > 1e-9).groupby(r.index.year).mean()
    y = (1 + r).groupby(r.index.year).prod() - 1
    return " ".join(f"{a % 100:02d}:{b * 100:+.0f}" for a, b in y.items() if held[a] > 0.05)


def main_table(Lm, mt=0.075, hi="high"):
    b = df[(df.filt == "r5") & (df.Lmax == Lm) & (df.maint == mt) & (df.high == hi)].copy()
    b["active"] = [active_years(n, "r5", Lm, mt, hi) for n in b.name]
    b["jump"] = b.jump.round(1).astype(str) + " (" + b.jump_date.fillna("-").astype(str) + ")"
    cols = ["name", "start", "end", "act_yrs", "active", "ann_ex", "sharpe", "sharpe_act", "maxdd", "jump", "nliq", "ruined", "avgL_act"]
    return b[cols].round(2)


def pooled(f, Lm, mt=0.075, hi="high", names=OTHERS):
    b = df[(df.filt == f) & (df.Lmax == Lm) & (df.maint == mt) & (df.high == hi) & df.name.isin(names)]
    act = b[b.act_yrs > 0.25]
    # pooled active-day returns (all currencies stacked) + monthly-clustered t-stat
    rs = []
    for n in names:
        r = S[(n, f, Lm, mt, hi)]
        rs.append(r[r.abs() > 1e-9])
    st = pd.concat(rs)
    m = st.groupby([st.index.to_period("M")]).sum()   # sum of daily returns across ccys within a month
    tstat = m.mean() / (m.std() / np.sqrt(len(m)))
    # equal-weight portfolio across currencies (average of available currencies' daily excess returns)
    W = pd.concat({n: S[(n, f, Lm, mt, hi)] for n in names}, axis=1)
    ew = W.mean(axis=1, skipna=True).fillna(0)
    E = (1 + ew).cumprod()
    ew_ann = (E.iloc[-1] ** (260 / len(E)) - 1) * 100
    ew_sh = ew.mean() / ew.std() * np.sqrt(260)
    ew_dd = (E / E.cummax() - 1).min() * 100
    # equal-weight among ACTIVE legs only (capital split across currencies whose filter is on)
    A = W.where(W.abs() > 1e-9)
    ewa = A.mean(axis=1, skipna=True).fillna(0)
    Ea = (1 + ewa).cumprod()
    return dict(filt=f, Lmax=Lm, maint=mt, high=hi, n_ccy=len(b), n_active=len(act),
                tot_active_yrs=round(b.act_yrs.sum(), 1),
                mean_sharpe=b.sharpe.mean(), median_sharpe=b.sharpe.median(),
                mean_sharpe_act=act.sharpe_act.mean(), median_sharpe_act=act.sharpe_act.median(),
                frac_profitable=(act.ann_ex > 0).mean(), n_ruined=int(b.ruined.sum()), n_liq=int(b.nliq.sum()),
                pooled_active_sharpe=st.mean() / st.std() * np.sqrt(260), pooled_tstat_monthly=tstat,
                pooled_active_ann_mean=st.mean() * 260 * 100,
                ew_ann=ew_ann, ew_sharpe=ew_sh, ew_maxdd=ew_dd,
                ewact_ann=(Ea.iloc[-1] ** (260 / len(Ea)) - 1) * 100, ewact_sharpe=ewa.mean() / ewa.std() * np.sqrt(260),
                ewact_maxdd=(Ea / Ea.cummax() - 1).min() * 100)


def regime_buckets(names, Lmax=3):
    """Path-independent test: daily vol-targeted carry return r_t = L_{t-1} * (-(M_t/M_{t-1}-1) + carry_t),
    L = min(Lmax, 30%/sigma20) always on; bucket by the regime known at t-1 (real rate <=0, 0..5, >5)."""
    rows = []
    allr = []
    for n in names:
        ccy = "TRY" if n.startswith("TRY") else n
        a, b = sim.SAMPLES.get(n, (None, None)) if n in sim.SAMPLES else sim.EXTRA[n][1:]
        p = sim.load(ccy, a, b)
        L = sim.signal(p, "unc", Lmax)
        days = pd.Series(np.r_[1, (p.index[1:] - p.index[:-1]).days], p.index)
        carry = (p.pol - p.us - 1) / 100 * days / 365
        valid = (p.gap == 0) & (p.gap.shift(1) == 0)
        r = (L.shift(1) * (-(p.close / p.close.shift(1) - 1) + carry)).where(valid)
        real = (p.pol - p.cpi).shift(1)
        bucket = pd.cut(real, [-1e9, 0, 5, 1e9], labels=["real<=0", "0<real<=5", "real>5"])
        x = pd.DataFrame({"r": r, "b": bucket})
        if a: x = x.loc[a:]
        x = x.dropna()
        x["ccy"] = n
        allr.append(x)
        for bk, g in x.groupby("b", observed=True):
            mm = g.r.groupby(g.index.to_period("M")).sum()
            rows.append(dict(ccy=n, bucket=bk, yrs=len(g) / 260, ann_mean=g.r.mean() * 260 * 100,
                             sharpe=g.r.mean() / g.r.std() * np.sqrt(260),
                             t=mm.mean() / (mm.std() / np.sqrt(len(mm))) if len(mm) > 2 else np.nan))
    X = pd.concat(allr)
    pooled_rows = []
    for bk, g in X.groupby("b", observed=True):
        mm = g.groupby([g.index.to_period("M"), "ccy"]).r.sum().groupby(level=0).mean()
        pooled_rows.append(dict(ccy="POOLED", bucket=bk, yrs=len(g) / 260, ann_mean=g.r.mean() * 260 * 100,
                                sharpe=g.r.mean() / g.r.std() * np.sqrt(260),
                                t=mm.mean() / (mm.std() / np.sqrt(len(mm)))))
    return pd.DataFrame(rows), pd.DataFrame(pooled_rows)


if __name__ == "__main__":
    for Lm in (3, 5):
        print(f"\n######## R3 rule (real>5pp), Lmax={Lm}, maint 7.5%, filtered high ########")
        print(main_table(Lm).to_string(index=False))
    print("\n######## yearly excess returns while active (r5, Lmax=3) ########")
    for n in sim.CCYS + ["TRY18"]:
        y = yearly(n, "r5", 3)
        if y: print(f"{n:6s} {y}")
    print("\n######## Filter comparison: Sharpe (full period) / ann excess %, maint 7.5% ########")
    for Lm in (3, 5):
        b = df[(df.Lmax == Lm) & (df.maint == 0.075) & (df.high == "high")]
        t = b.pivot(index="name", columns="filt", values="sharpe").round(2)
        e = b.pivot(index="name", columns="filt", values="ann_ex").round(1)
        a = b.pivot(index="name", columns="filt", values="act_yrs").round(1)
        lq = b.pivot(index="name", columns="filt", values="nliq")
        out = pd.concat({"sharpe": t, "ann_ex": e, "act_yrs": a, "nliq": lq}, axis=1)
        print(f"-- Lmax={Lm}"); print(out.reindex(sim.CCYS + ["TRY18", "TRYall"]).to_string())
    print("\n######## Pooled across the 13 non-TRY currencies ########")
    P = []
    for f in ["r5", "r0", "c0", "unc"]:
        for Lm in (3, 5):
            for mt in (0.075, 0.0825):
                for hi in ("high", "high_raw"):
                    P.append(pooled(f, Lm, mt, hi))
    P = pd.DataFrame(P)
    print(P.round(3).to_string(index=False))
    P.to_csv(H / "pooled.csv", index=False)
    print("\n######## Regime buckets (path-independent, always-on vol-targeted carry, Lmax=3) ########")
    per, pool = regime_buckets(OTHERS)
    print(per.round(2).pivot(index="ccy", columns="bucket", values=["yrs", "ann_mean", "sharpe", "t"]).to_string())
    print("POOLED non-TRY:"); print(pool.round(3).to_string(index=False))
    per2, pool2 = regime_buckets(["TRY", "TRY18"])
    print("TRY:"); print(per2.round(2).to_string(index=False))
    # leave-BRL-out (BRL dominates real>5 years)
    _, pool3 = regime_buckets([c for c in OTHERS if c != "BRL"])
    print("POOLED non-TRY ex-BRL:"); print(pool3.round(3).to_string(index=False))
    print("\n######## Execution lag 1 day (decide on t mark, trade t+1 mark), r5 ########")
    rows = []
    for n in sim.CCYS + ["TRY18"]:
        ccy, a_, b_ = (n,) + sim.SAMPLES[n] if n in sim.SAMPLES else sim.EXTRA[n]
        p = sim.load(ccy, a_, b_)
        for Lm in (3, 5):
            r, _ = sim.evaluate(p, "r5", Lm, 0.075, "high", a_, lag=1)
            rows.append(dict(name=n, Lmax=Lm, ann_ex=r["ann_ex"], sharpe=r["sharpe"], maxdd=r["maxdd"], nliq=r["nliq"]))
    print(pd.DataFrame(rows).pivot(index="name", columns="Lmax", values=["ann_ex", "sharpe", "maxdd", "nliq"]).round(2).to_string())
    print("\n######## Robustness of r5 per currency: maint 8.25% and raw (unfiltered) highs ########")
    b = df[(df.filt == "r5")]
    print(b.pivot_table(index="name", columns=["Lmax", "maint", "high"], values="ann_ex").round(1).reindex(sim.CCYS + ["TRY18"]).to_string())
    print(b.pivot_table(index="name", columns=["Lmax", "maint", "high"], values="nliq").reindex(sim.CCYS + ["TRY18"]).to_string())
