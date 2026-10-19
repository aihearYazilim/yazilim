"""Aday kuralların kriz dönemleri, yıllık getirileri ve hassasiyet testleri."""
import numpy as np, pandas as pd, sim
import grid as G
pd.set_option("display.width", 250); pd.set_option("display.max_columns", 40)

CANDS = {
    "R3 vt30%/max8x/w20 + reel>5%": (("vt", 0.30, 8, 20), None, 0.05, None, 0.0),
    "R6 vt30%/max8x/w60 + trend(60,2) + ptr63": (("vt", 0.30, 8, 60), (60, 2.0), None, (63, 0.0), 0.0),
    "R2 fix5x + trend(20,1) + ptr126": (("fix", 5, None, None), (20, 1.0), None, (126, 0.0), 0.0),
    "R1 fix8x + reel>5%": (("fix", 8, None, None), None, 0.05, None, 0.0),
    "fix3x koşulsuz": (("fix", 3, None, None), None, None, None, 0.0),
    "fix5x koşulsuz": (("fix", 5, None, None), None, None, None, 0.0),
    "fix8x koşulsuz": (("fix", 8, None, None), None, None, None, 0.0),
}
EPIS = {"2006 May-Haz": ("2006-05-01", "2006-07-31"), "2008 Eki-Kas": ("2008-09-15", "2008-12-31"),
        "2011 Ağu-Eki": ("2011-07-15", "2011-11-30"), "2013 May-2014 Oca": ("2013-05-01", "2014-02-15"),
        "2015 Ağu-Eyl": ("2015-07-15", "2015-10-15"), "2016 Tem darbe": ("2016-07-10", "2016-08-15"),
        "2018 May-Ağu": ("2018-05-01", "2018-09-15"), "2020 Ağu-Kas": ("2020-07-15", "2020-11-10"),
        "2021 Kas-Ara": ("2021-09-20", "2021-12-31"), "2023 Haz": ("2023-05-25", "2023-08-31"),
        "2025 Mar": ("2025-03-10", "2025-04-30")}


def L_of(c):
    sz, tr, rl, pt, st = c
    return G.sizing(sz) * (G.trend_ok(tr) & G.real_ok(rl) & G.ptr_ok(pt)).astype(float), st


def episode_dd(nav, a, b):
    s = pd.Series(nav, G.idx).loc[pd.Timestamp(a) - pd.Timedelta(days=3):b]
    if s.iloc[0] <= 0: return np.nan
    e = s / s.iloc[0]
    return min(((e / e.cummax()) - 1).min(), e.min() - 1) * 100


if __name__ == "__main__":
    rows, yrs = [], {}
    for name, c in CANDS.items():
        L, st = L_of(c)
        res = G.evaluate(L, st)
        r = G.row_stats(res); r["name"] = name
        nav = res[0][0]
        for k, (a, b) in EPIS.items():
            r[k] = episode_dd(nav, a, b)
        rows.append(r)
        s = pd.Series(nav, G.idx)
        y = s.resample("YE").last().pct_change() * 100
        y.iloc[0] = (s.resample("YE").last().iloc[0] - 1) * 100
        yrs[name] = y
    R = pd.DataFrame(rows).set_index("name")
    print("=== Ana metrikler (vergi %10 çeyreklik stopaj, lag0) ===")
    print(R[["IS", "IS_dd", "IS_worst", "IS_sh", "avgL_IS", "OOS", "OOS_dd", "OOS_worst", "avgL_OOS",
             "trades_IS", "trades_OOS", "liq_IS"]].round(2).to_string())
    print("\n=== Kriz dönemi en büyük düşüş % (dönem içi, 2005'ten sürekli koşu) ===")
    print(R[list(EPIS)].round(1).T.to_string())
    print("\n=== Yıllık getiri % ===")
    Y = pd.DataFrame(yrs); Y.index = Y.index.year
    print(Y.round(1).to_string())

    print("\n=== Hassasiyet (R3) ===")
    base = CANDS["R3 vt30%/max8x/w20 + reel>5%"]
    L, st = L_of(base)
    out = []
    def add(lbl, res):
        r = G.row_stats(res); out.append(dict(test=lbl, IS=r["IS"], IS_dd=r["IS_dd"], OOS=r["OOS"], OOS_dd=r["OOS_dd"],
                                              OOS_worst=r["OOS_worst"], avgL_OOS=r["avgL_OOS"]))
    add("baz (stopaj %10)", G.evaluate(L, st))
    add("stopaj %0", G.evaluate(L, st, tax=0.0))
    add("1 gün ek gecikme", G.evaluate(L, st, lag=1))
    for th in [0.03, 0.04, 0.06, 0.07]:
        Lx = G.sizing(base[0]) * G.real_ok(th).astype(float); add(f"reel eşik {th}", G.evaluate(Lx, st))
    for tv in [0.2, 0.25, 0.4]:
        Lx = G.sizing(("vt", tv, 8, 20)) * G.real_ok(0.05).astype(float); add(f"vol hedef {tv}", G.evaluate(Lx, st))
    for lm in [5, 6, 10]:
        Lx = G.sizing(("vt", 0.3, lm, 20)) * G.real_ok(0.05).astype(float); add(f"max kaldıraç {lm}", G.evaluate(Lx, st))
    # maliyet / baz / teminat varyantları: modül sabitlerini değiştirip yeniden derle değil, girdileri ölçekle
    U = G.U
    for lbl, kw in [("baz 3 puan (ima faizi pol-3)", dict(carry=U["carry"] - 0.02 * np.r_[1, np.diff(G.idx).astype('timedelta64[D]').astype(float)] / 365)),
                    ("PPF = 0.8*politika", dict(mmf=(1 + 0.8 * U["pol"]) ** (np.r_[1, np.diff(G.idx).astype('timedelta64[D]').astype(float)] / 365) - 1))]:
        args = dict(M=G.M, H=U["H"], mmf=U["mmf"], carry=U["carry"]); args.update(kw)
        def rr(i0):
            sl = slice(i0, None)
            return sim.run(args["M"][sl], args["H"][sl], args["mmf"][sl], args["carry"][sl], L.values.astype(float)[sl],
                           U["month_end"][sl], U["q_end"][sl], st, G.CD, 0.10, 0)
        add(lbl, (rr(0), rr(G.I0)))
    for s_ in [0.02, 0.03, 0.05]:
        add(f"stop {s_}", G.evaluate(L, s_))
    print(pd.DataFrame(out).round(2).to_string(index=False))
