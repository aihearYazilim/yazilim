"""Final candidates (rules fixed on IS) - detailed IS/OOS stats, monthly table, tail risk, TRY conversion."""
import numpy as np, pandas as pd
from run import stat, monthly, OOS0
U = pd.read_pickle("data/ext_unit_h0.05_sk0.0.pkl")
fx = pd.read_csv("../../data/bist/USDTRY.csv", index_col=0, parse_dates=True).close
CANDS = {"A strangle30 2x dvhi": ("strangle", .3, 2), "B strangle30 3x dvhi": ("strangle", .3, 3),
         "C csp30 2x dvhi": ("csp", .3, 2), "D strangle30 4x dvhi (IS~Kelly)": ("strangle", .3, 4),
         "E strangle30 1x dvhi": ("strangle", .3, 1), "ref strangle30 2x nofilter": ("strangle", .3, -2)}
for name, (st, d, sz) in CANDS.items():
    x = U[(U.strat == st) & (U.delta == d)]
    on = x["q365_0.5"] if sz > 0 else True
    y = pd.DataFrame({"day": x.day, "expiry": x.expiry, "r": np.where(on, x.r * abs(sz), 0.0)}).dropna()
    s = y.groupby("day").agg(expiry=("expiry", "first"), r=("r", "mean")); s["r"] = s.r.clip(lower=-1)
    a = stat(s, "2021-04-01", OOS0); b = stat(s, OOS0, "2026-10-17")
    i = s[s.index < OOS0]; o = s[s.index >= OOS0]
    act = (s.r != 0)
    m = monthly(o)
    # TRY: USD return + USDTRY change over OOS
    f0, f1 = fx.asof(pd.Timestamp(OOS0)), fx.asof(pd.Timestamp("2026-10-16"))
    eq = (1 + o.r).prod() * f1 / f0; days = (pd.Timestamp(o.expiry.iloc[-1]) - pd.Timestamp(o.index[0])).days
    print(f"\n== {name}")
    print(" IS :", {k: round(v, 4) for k, v in a.items()}, "worst week", round(i.r.min(), 4), "1% wk", round(i.r[i.r != 0].quantile(.01), 4))
    print(" OOS:", {k: round(v, 4) for k, v in b.items()}, "worst week", round(o.r.min(), 4), "active weeks", int((o.r != 0).sum()), "/", len(o))
    print(" OOS TRY monthly geo:", round(eq ** (30.44 / days) - 1, 4), "| USDTRY", round(f0, 2), "->", round(f1, 2))
    print(" OOS monthly:", " ".join(f"{p}:{v*100:+.1f}" for p, v in m.items()))
    yr = (1 + i.r).groupby(i.index.str[:4]).prod() - 1
    print(" IS yearly:", " ".join(f"{k}:{v*100:+.0f}%" for k, v in yr.items()))
