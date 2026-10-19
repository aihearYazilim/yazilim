"""Walk-forward seçim. Her ay sonu (t), yalnızca t ve öncesindeki günlük net getirilerle
grid içinden en iyi konfigürasyon seçilir ve t+1..sonraki ay sonu uygulanır.
Konfigürasyon değişiminde tam ciro varsayımıyla 2 x %0.14 ek maliyet düşülür (muhafazakâr).
Ayrıca 'dondurulmuş' seçim: 2025-10-16'ya kadarki veriyle seçilip OOS boyunca sabit tutulur."""
import pickle, pathlib, sys, os
import numpy as np, pandas as pd
import common as C

OUT = pathlib.Path(__file__).resolve().parent / "out"
LAG = int(os.environ.get("LAG", "0"))
R, T = pickle.load(open(OUT / f"grid_lag{LAG}.pkl", "rb"))
R = R.loc[:C.OOS_END]
days = R.index
pre_oos_last = days[days < C.OOS_START][-1]
month_ends = pd.Series(days, index=days).groupby(days.to_period("M")).last().values
dec = sorted(set([d for d in month_ends if d >= pd.Timestamp("2020-12-01")] + [pre_oos_last]))
dec = [pd.Timestamp(d) for d in dec if d < days[-1]]

FAMILIES = {
    "ALL": lambda k: True,
    "momentum": lambda k: k[0].startswith("mom") or k[0] in ("h52", "h26"),
    "reversal": lambda k: k[0].startswith("rev"),
    "volbrk": lambda k: k[0].startswith("volbrk"),
    "lowvol": lambda k: k[0].startswith("lowvol"),
    "small": lambda k: k[0] == "small",
    "sector": lambda k: k[0].startswith("sector"),
    "tavan": lambda k: k[0].startswith("tavan"),
    "combo": lambda k: k[0].startswith("c_"),
}

def metric_v(x, kind):
    """x: (gün, konfig) numpy. Vektörel metrik."""
    if kind == "geo":
        return np.prod(1 + x, axis=0)
    if kind == "sharpe":
        return x.mean(0) / (x.std(0) + 1e-12)
    eq = np.cumprod(1 + x, axis=0); dd = (eq / np.maximum.accumulate(eq, axis=0) - 1).min(0)
    return (eq[-1] - 1) / (np.abs(dd) + 0.05)

def metric(r, kind):
    if kind == "geo":
        return (1 + r).prod()
    if kind == "sharpe":
        return r.mean() / (r.std() + 1e-12)
    if kind == "calmar":
        eq = (1 + r).cumprod(); dd = (eq / eq.cummax() - 1).min()
        return ((1 + r).prod() - 1) / (abs(dd) + 0.05)

def chain(cols, look_m=24, kind="geo", k=1):
    sub = R[cols]
    out = pd.Series(0.0, index=days); picks = {}
    prev = None
    for i, d in enumerate(dec):
        lo = d - pd.DateOffset(months=look_m)
        win = sub.loc[lo:d]
        # yeterli geçmiş: pencerenin %90'ı dolu olmalı
        if win.index[0] > lo + pd.Timedelta(days=40):
            continue
        mv = metric_v(win.values, kind)
        ranked = [cols[j] for j in np.argsort(-mv, kind="stable")]
        best = ranked[0] if k == 1 else tuple(ranked[:k])
        nxt = dec[i + 1] if i + 1 < len(dec) else days[-1] + pd.Timedelta(days=1)
        seg = (days > d) & (days <= nxt)
        out[seg] = sub.loc[seg, best] if k == 1 else sub.loc[seg, list(best)].mean(axis=1)
        if prev is not None and best != prev:
            first = days[seg][0]
            ch = 1.0 if k == 1 else len(set(best) - set(prev)) / k
            out[first] -= 2 * C.FEE * ch
        picks[d] = best; prev = best
    return out, picks

def frozen(cols, look_m=24, kind="geo"):
    win = R[cols].loc[pre_oos_last - pd.DateOffset(months=look_m):pre_oos_last]
    mv = metric_v(win.values, kind)
    return cols[int(np.argmax(mv))]

if __name__ == "__main__":
    rows = []
    allcols = list(R.columns)
    for fam, f in FAMILIES.items():
        cols = [c for c in allcols if f(c)]
        for look in [12, 24, 36]:
            for kind in ["geo", "sharpe", "calmar"]:
                r, picks = chain(cols, look, kind)
                eq = (1 + r).cumprod()
                i = C.stats(eq, "2021-01-01", C.OOS_START); o = C.stats(eq, C.OOS_START, C.OOS_END)
                fb = frozen(cols, look, kind)
                fo = C.stats((1 + R[fb]).cumprod(), C.OOS_START, C.OOS_END)
                fi = C.stats((1 + R[fb]).cumprod(), C.IS_START, C.OOS_START)
                oos_picks = [p for d, p in picks.items() if d >= pre_oos_last]
                rows.append(dict(family=fam, n_cfg=len(cols), look=look, metric=kind,
                                 WF_IS_geo=i.get("aylik_geo_%"), WF_OOS_geo=o.get("aylik_geo_%"),
                                 WF_OOS_dd=o.get("maxDD_%"), WF_OOS_worst=o.get("en_kotu_ay_%"),
                                 n_switch_oos=len(set(oos_picks)),
                                 frozen_cfg="|".join(map(str, fb)), frozen_IS_geo=fi.get("aylik_geo_%"),
                                 frozen_OOS_geo=fo.get("aylik_geo_%"), frozen_OOS_dd=fo.get("maxDD_%"),
                                 frozen_OOS_worst=fo.get("en_kotu_ay_%")))
                print(rows[-1], flush=True)
    df = pd.DataFrame(rows)
    df.to_csv(OUT / f"wf_lag{LAG}.csv", index=False)
    pd.set_option("display.width", 300); pd.set_option("display.max_columns", 30)
    print(df.to_string(index=False))

    # ensemble: her ay geçmişe göre en iyi k konfigürasyonun eşit ağırlıklı karışımı (sleeve)
    erows = []
    for fam in ["ALL", "momentum", "combo", "sector", "lowvol"]:
        cols = [c for c in allcols if FAMILIES[fam](c)]
        for look in [12, 24, 36]:
            for kind in ["geo", "sharpe", "calmar"]:
                for k in [5, 10, 20]:
                    r, picks = chain(cols, look, kind, k)
                    eq = (1 + r).cumprod()
                    i = C.stats(eq, "2021-01-01", C.OOS_START); o = C.stats(eq, C.OOS_START, C.OOS_END)
                    erows.append(dict(family=fam, look=look, metric=kind, k=k, WF_IS_geo=i.get("aylik_geo_%"),
                                      WF_OOS_geo=o.get("aylik_geo_%"), WF_OOS_dd=o.get("maxDD_%"),
                                      WF_OOS_worst=o.get("en_kotu_ay_%")))
    e = pd.DataFrame(erows); e.to_csv(OUT / f"wf_ens_lag{LAG}.csv", index=False)
    print(e.sort_values("WF_IS_geo", ascending=False).to_string(index=False))
    print(e[["WF_IS_geo", "WF_OOS_geo"]].describe())
