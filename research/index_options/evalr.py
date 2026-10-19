"""Evaluate all combos: structure x filter x leverage x margin regime. IS = <2025-10-17, OOS = 2025-10-17..2026-10-16.
USD equity (T-bill - 0.5% on cash), converted to TRY with USDTRY."""
import sys, pickle, itertools, pathlib, numpy as np, pandas as pd
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import lib

OOS0, OOS1 = pd.Timestamp(lib.OOS0), pd.Timestamp(lib.OOS1)
FX = pd.read_csv(pathlib.Path(__file__).resolve().parents[2] / "data/bist/USDTRY.csv", index_col=0, parse_dates=True).close

FILTERS = {
    "none": lambda t: True,
    "vmed": lambda t: t["v0"] > t["vmed"],                      # 30d IV > trailing 252d median
    "ts": lambda t: t["ratio9"] < 1.0,                          # VIX9D/VIX < 1 (contango)
    "vrp": lambda t: t["v0"] - t["rv"] > 0.0,                   # IV - RV20 > 0
    "vrp3": lambda t: t["v0"] - t["rv"] > 0.03,
    "trend": lambda t: t["S0"] > t["sma"],                      # index > SMA200
    "vmed_ts": lambda t: t["v0"] > t["vmed"] and t["ratio9"] < 1.0,
    "vmed_vrp": lambda t: t["v0"] > t["vmed"] and t["v0"] - t["rv"] > 0.0,
    "ts_vrp": lambda t: t["ratio9"] < 1.0 and t["v0"] - t["rv"] > 0.0,
    "ts_trend": lambda t: t["ratio9"] < 1.0 and t["S0"] > t["sma"],
    "vrp_trend": lambda t: t["v0"] - t["rv"] > 0.0 and t["S0"] > t["sma"],
    "vmed_ts_vrp": lambda t: t["v0"] > t["vmed"] and t["ratio9"] < 1.0 and t["v0"] - t["rv"] > 0.0,
}
LEVS = [1.0, 1.5, 2.0, 3.0]
MARGINS = ["regt", "pm"]


def path_stats(dd, a, b, fx=False):
    d = dd.loc[a:b].copy()
    if len(d) < 5: return {}
    # anchor at value just before the window
    prev = dd.loc[:a - pd.Timedelta(days=1)]
    e0 = prev["close"].iloc[-1] if len(prev) else d["close"].iloc[0]
    if fx:
        f = FX.reindex(dd.index.union(FX.index)).ffill()
        f0 = f.loc[:a - pd.Timedelta(days=1)].iloc[-1] if len(prev) else f.loc[d.index[0]]
        d["close"] = d["close"] * f.reindex(d.index).values / f0
        d["worst"] = d["worst"] * f.reindex(d.index).values / f0
    c = pd.concat([pd.Series([e0], index=[a - pd.Timedelta(days=1)]), d["close"]])
    months = (b - a).days / 30.4375 if b <= d.index[-1] + pd.Timedelta(days=5) else (d.index[-1] - a).days / 30.4375
    geo = (c.iloc[-1] / e0) ** (1 / months) - 1 if c.iloc[-1] > 0 else -1.0
    peak = c.cummax().reindex(d.index)
    mdd = (np.minimum(d["worst"], d["close"]) / peak - 1).min()
    mdd_close = (c / c.cummax() - 1).min()
    me = c.resample("ME").last()
    me = pd.concat([pd.Series([e0]), me.reset_index(drop=True)])
    worst_m = (me.pct_change().dropna()).min()
    return dict(geo=geo, mdd=mdd, mdd_close=mdd_close, worst_m=worst_m)


def run_one(trades, flt, L, margin, cash_spread=0.005):
    act = [bool(FILTERS[flt](t)) and not (np.isnan(t["vmed"]) or np.isnan(t["rv"]) or np.isnan(t["sma"])) for t in trades]
    eq, dd = lib.simulate(trades, L, act, margin=margin, cash_spread=cash_spread, daily=True)
    first = trades[0]["d0"]
    IS = path_stats(dd, first + pd.Timedelta(days=1), OOS0 - pd.Timedelta(days=1))
    OOS = path_stats(dd, OOS0 + pd.Timedelta(days=1), OOS1)
    OOS_TRY = path_stats(dd, OOS0 + pd.Timedelta(days=1), OOS1, fx=True)
    n_is = sum(a for a, t in zip(act, trades) if t["d0"] < OOS0)
    n_oos = sum(a for a, t in zip(act, trades) if t["d0"] >= OOS0)
    # margin calls
    return dict(IS_geo=IS.get("geo"), IS_mdd=IS.get("mdd"), IS_worst_m=IS.get("worst_m"),
                OOS_geo=OOS.get("geo"), OOS_mdd=OOS.get("mdd"), OOS_worst_m=OOS.get("worst_m"),
                OOS_TRY_geo=OOS_TRY.get("geo"), OOS_TRY_mdd=OOS_TRY.get("mdd"),
                n_IS=n_is, n_OOS=n_oos, ruined=bool(eq.iloc[-1] <= 0) or eq.min() <= 0.01), dd


def yearly(dd):
    c = dd["close"].resample("YE").last()
    return c.pct_change()


if __name__ == "__main__":
    rows = []
    for f in sys.argv[1:]:
        res = pickle.load(open(lib.D / f"trades_{f}.pkl", "rb"))
        for key, trades in res.items():
            for flt, L, mg in itertools.product(FILTERS, LEVS, MARGINS):
                r, _ = run_one(trades, flt, L, mg)
                rows.append(dict(und=key[0], ten=key[1], struct=key[2], delta=key[3], flt=flt, L=L, margin=mg, **r))
            print(key, flush=True)
    out = pd.DataFrame(rows)
    out.to_csv(lib.D.parent / f"results_{"_".join(sys.argv[1:])}.csv", index=False)
    print(len(out), "combos")
