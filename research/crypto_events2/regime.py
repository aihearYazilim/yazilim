"""Regime check: is the Binance book's P&L just short-alt beta? Monthly book return (s=0.2) vs EW alt-index-minus-BTC."""
import sys, pathlib, pickle, pandas as pd, numpy as np
H = pathlib.Path(__file__).parent; sys.path.insert(0, str(H)); import common as C
D = pickle.load(open(H / "raw/trades.pkl", "rb"))
c = C.T.C.drop(columns=["BTCUSDT"]); r = c.pct_change(fill_method=None).where(C.T.V.drop(columns=["BTCUSDT"]) > 0).clip(-0.5, 0.5)
alt = (1 + r.mean(axis=1).fillna(0)).cumprod(); btc = C.T.C["BTCUSDT"]
am = alt.resample("ME").last().pct_change() - btc.resample("ME").last().pct_change()
out = {}
for nm, trs in [("binance", D["unl"] + D["bcms"]), ("nonbinance", [t for v in D["VI"].values() for t in v])]:
    parts = []
    for a, b in [("2022-01-01", "2025-10-16"), ("2025-10-17", "2026-10-16")]:
        _, x = C.window(trs, a, b, 0.2); parts.append(((1 + x[a:b]).resample("ME").prod() - 1))
    out[nm] = pd.concat(parts).groupby(level=0).apply(lambda v: (1 + v).prod() - 1)
M = pd.DataFrame(out).join(am.rename("alt_minus_btc")).loc["2022-01":"2026-10"]
print((M.loc["2024-01":] * 100).round(1).T.to_string())
print("corr(book, alt-BTC) monthly 2022-01..2026-10:", M.corr().round(2).to_dict())
for nm in ["binance", "nonbinance"]:
    b = np.polyfit(M.alt_minus_btc, M[nm], 1); res = M[nm] - b[0] * M.alt_minus_btc
    print(nm, "beta to alt-BTC:", round(b[0], 2), "alpha %/mo:", round(b[1] * 100, 2), "| alpha 2026-06..10:", round(res.loc["2026-06":].mean() * 100, 2))
