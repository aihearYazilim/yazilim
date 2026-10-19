"""Detail, sensitivity and walk-forward for the IS-selected candidates."""
import sys, pickle, pathlib, numpy as np, pandas as pd
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import lib, evalr

RES = {}
for u in ["SPX", "NDX"]:
    RES.update(pickle.load(open(lib.D / f"trades_{u}.pkl", "rb")))

CANDS = [  # (und, ten, struct, delta, filter, L) chosen on IS only (see results_*.csv ranking)
    ("NDX", "W", "put", 0.10, "none", 3.0),
    ("SPX", "M", "put", 0.50, "ts_trend", 3.0),
    ("NDX", "W", "put", 0.20, "none", 2.0),
    ("SPX", "W", "put", 0.20, "none", 2.0),
    ("SPX", "W", "strangle", 0.30, "vmed", 2.0),   # crypto-analog (DVOL>median strangle) for reference
]


def fmt(x): return "nan" if x is None or (isinstance(x, float) and np.isnan(x)) else f"{x*100:.2f}"


def detail():
    for c in CANDS:
        tr = RES[c[:4]]
        for L in sorted({c[5], 4.0, 5.0}):
            r, dd = evalr.run_one(tr, c[4], L, "regt")
            print(c[:5], L, {k: (fmt(v) if isinstance(v, float) else v) for k, v in r.items()})
            if L == c[5]:
                y = evalr.yearly(dd)
                print("  yearly:", " ".join(f"{d.year}:{v*100:.0f}" for d, v in y.dropna().items()))
                # OOS months in TRY
                f = evalr.FX.reindex(dd.index, method="ffill")
                m = (dd["close"] * f).resample("ME").last().loc["2025-10":"2026-10"].pct_change().dropna()
                print("  OOS TRY monthly:", " ".join(f"{v*100:.1f}" for v in m.values))


def sensitivity():

    rows = []
    variants = {"base": dict(s=0.20, aM=0.87, aW=0.80, cost=1.0),
                "skew0.10": dict(s=0.10, aM=0.87, aW=0.80, cost=1.0),
                "skew0.30": dict(s=0.30, aM=0.87, aW=0.80, cost=1.0),
                "atm-0.02": dict(s=0.20, aM=0.85, aW=0.78, cost=1.0),
                "atm+0.02": dict(s=0.20, aM=0.89, aW=0.82, cost=1.0),
                "cost2x": dict(s=0.20, aM=0.87, aW=0.80, cost=2.0)}
    for c in CANDS[:4]:
        und, ten, st, d, flt, L = c
        df = lib.load(und, proxy_k=1.10)
        legs = [(False, d)] + ([(True, d)] if st == "strangle" else [])
        for nm, v in variants.items():
            m = lib.Model(aM=v["aM"], aW=v["aW"], s=v["s"], c=0.0)
            old = lib.COMM
            hs = lib.half_spread
            if v["cost"] != 1.0:
                lib.half_spread = lambda p, dd, S, f=v["cost"], h=hs: f * h(p, dd, S)
                lib.COMM = old * v["cost"]
            tr = lib.build_trades(df, m, ten, legs, und=und)
            lib.half_spread, lib.COMM = hs, old
            r, _ = evalr.run_one(tr, flt, L, "regt")
            rows.append(dict(cand=str(c), var=nm, **{k: r[k] for k in ["IS_geo", "IS_mdd", "OOS_geo", "OOS_TRY_geo", "OOS_mdd"]}))
            print(rows[-1], flush=True)
    pd.DataFrame(rows).to_csv(lib.D.parent / "sensitivity.csv", index=False)


_CACHE = {}
def walkforward(L=2.0, look=60):
    """Each month: pick the combo (SPX/NDX x W/M x put/strangle x delta x filter, fixed L) with best trailing
    `look`-month geometric return (only past months), hold it next month. Chain = WF return."""
    keys = list(RES.keys())
    mon = _CACHE.setdefault(L, {})
    for k in (keys if not mon else []):
        for flt in evalr.FILTERS:
            act = [bool(evalr.FILTERS[flt](t)) and not (np.isnan(t["vmed"]) or np.isnan(t["rv"]) or np.isnan(t["sma"])) for t in RES[k]]
            eq, dd = lib.simulate(RES[k], L, act, margin="regt", cash_spread=0.005, daily=True)
            mon[(k, flt)] = dd["close"].resample("ME").last().pct_change()
    names = list(mon.keys())
    M = pd.DataFrame({i: mon[k] for i, k in enumerate(names)}).loc["2000-04":]
    M = M.fillna(0)
    lg = np.log1p(M.clip(lower=-0.99))
    trail = lg.rolling(look, min_periods=look).sum().shift(1)
    trail = trail.dropna(how="all")
    best = trail.idxmax(axis=1)
    wf = pd.Series([M.loc[d, best[d]] for d in trail.index], index=trail.index)
    fx = evalr.FX.resample("ME").last()
    wf_try = (1 + wf) * (fx / fx.shift(1)).reindex(wf.index) - 1
    def g(s): return (np.prod(1 + s)) ** (1 / len(s)) - 1
    is_ = wf.loc[:"2025-09"]; oos = wf.loc["2025-11":"2026-10"]  # month-end grid: OOS = Nov-25..Oct-26 (~ 12m)
    eq = (1 + wf).cumprod()
    print(f"WF L={L} look={look}: IS geo {g(is_)*100:.2f}%/m, IS maxDD(month-end) {(eq.loc[:'2025-09']/eq.loc[:'2025-09'].cummax()-1).min()*100:.1f}%, "
          f"OOS USD {g(oos)*100:.2f}%/m, OOS TRY {g(wf_try.loc['2025-11':'2026-10'])*100:.2f}%/m, worst OOS month {oos.min()*100:.1f}%")
    print("  OOS picks:", best.loc["2025-11":"2026-10"].map(lambda i: f"{names[i][0][0]}-{names[i][0][1]}-{names[i][0][2]}-{names[i][0][3]}-{names[i][1]}").value_counts().to_dict())
    return len(mon)


if __name__ == "__main__":
    what = sys.argv[1]
    if what == "detail": detail()
    if what == "sens": sensitivity()
    if what == "wf":
        for L in [2.0, 3.0]:
            for look in [24, 60]:
                n = walkforward(L, look)
        print("WF universe size", n)
