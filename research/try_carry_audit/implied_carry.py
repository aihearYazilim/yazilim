"""Implied TRY-USD carry from actual VİOP USDTRY futures vs the model's (pol - 1pp - fed)."""
import pathlib, numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent
F = pd.read_csv(H / "viop_usdtry_fut.csv", parse_dates=["date", "expiry"])
P = pd.read_csv(H.parent / "try_carry/data/panel.csv", index_col=0, parse_dates=True)
F = F[F.settle > 0]
out = []
for d, g in F.groupby("date"):
    g = g[(g.expiry - d).dt.days >= 3].sort_values("expiry")
    if len(g) < 2: continue
    a, b = g.iloc[0], g.iloc[1]
    spread = np.log(b.settle / a.settle) * 365 / (b.expiry - a.expiry).days
    s = P["close"].asof(d) if d >= P.index[0] else np.nan
    # Yahoo 'close' for date d = next bar open (~ midnight); use avg of d and prev mark as crude 17:30 spot
    s2 = 0.5 * (P["close"].asof(d) + P["close"].asof(d - pd.Timedelta(days=1)))
    basis = np.log(a.settle / s2) * 365 / max((a.expiry - d).days, 1)
    out.append(dict(date=d, front=a.code, dte=(a.expiry - d).days, cal_spread=spread, front_basis=basis,
                    front_val=a.value, front_oi=a.oi))
X = pd.DataFrame(out).set_index("date")
X["pol"] = P["pol"].reindex(X.index, method="ffill") / 100
X["fed"] = P["fed"].reindex(X.index, method="ffill") / 100
X["model"] = X.pol - 0.01 - X.fed
X.to_csv(H / "implied_carry_daily.csv")
# continuous carry measure (log, annualised) vs model (simple). convert implied log -> simple-ish
M = X.resample("ME").agg({"cal_spread": "median", "front_basis": "median", "model": "mean", "pol": "mean", "fed": "mean"})
pd.set_option("display.width", 200)
print((M * 100).round(2).to_string())
print("\nOOS (2025-10-17..2026-10-16) mean: ")
o = X.loc["2025-10-17":"2026-10-16"]
print((o[["cal_spread", "front_basis", "model"]].mean() * 100).round(2))
