"""Pairs / stat-arb on liquid Binance perps (both legs perps; funding and 0.10%/trade per leg included).
Each month-start t0: universe = top-U perps by trailing 30d volume (data < t0); formation window F days before t0:
OLS log(a) = c + b log(b); Engle-Granger ADF t-stat on residual (numpy), keep pairs with t < -3.4 and half-life 1..30d,
take N most negative. Trade during the month: z = (resid - mean_F)/std_F computed with frozen formation params;
enter |z|>z_in, exit |z|<z_out or |z|>z_stop, close all at month end. Positions: $ per leg = E/N (dollar-neutral, a vs b)."""
import itertools, numpy as np, pandas as pd, lib

def adf_t(x):
    dx = np.diff(x); xl = x[:-1] - x[:-1].mean()
    b = (xl @ (dx - dx.mean())) / (xl @ xl)
    res = dx - dx.mean() - b * xl
    se = np.sqrt(res @ res / (len(dx) - 2) / (xl @ xl))
    return b / se, (-np.log(2) / np.log(1 + b) if -1 < b < 0 else np.inf)

def run(F=180, N=5, z_in=2.0, z_out=0.5, z_stop=4.0, U=25, E=1.0):
    p = lib.P()
    px, vol = p["perp"], p["perpvol"]
    lp = np.log(px)
    idx = px.index
    W = pd.DataFrame(0.0, index=idx, columns=px.columns)
    for m in pd.period_range("2020-06", idx.max().to_period("M"), freq="M"):
        t0 = m.start_time
        hist = lp.loc[(idx < t0) & (idx >= t0 - pd.Timedelta(days=F))]
        if len(hist) < F * 0.9: continue
        v = vol.loc[(idx < t0) & (idx >= t0 - pd.Timedelta(days=30))].median()
        full = hist.notna().all()
        uni = v[full].nlargest(U).index
        cand = []
        for a, b in itertools.combinations(uni, 2):
            y, x = hist[a].values, hist[b].values
            beta = np.cov(y, x)[0, 1] / x.var(ddof=1)
            if beta <= 0: continue
            r = y - beta * x
            t, hl = adf_t(r)
            if t < -3.4 and 1 <= hl <= 30:
                cand.append((t, a, b, beta, r.mean(), r.std()))
        cand.sort()
        used = set(); pairs = []
        for c in cand:
            if c[1] in used or c[2] in used: continue
            pairs.append(c); used |= {c[1], c[2]}
            if len(pairs) == N: break
        days = idx[(idx >= t0) & (idx <= m.end_time)]
        for t, a, b, beta, mu, sd in pairs:
            z = ((lp.loc[days, a] - beta * lp.loc[days, b]) - mu) / sd
            pos, out = 0, []
            for d, zz in z.items():
                if np.isnan(zz): pos = 0
                elif pos == 0 and abs(zz) > z_in and abs(zz) < z_stop: pos = -np.sign(zz)
                elif pos != 0 and (abs(zz) < z_out or abs(zz) > z_stop or np.sign(zz) == pos): pos = 0
                out.append(pos)
            s = pd.Series(out, index=days, dtype=float)
            s.iloc[-1] = 0.0  # flat at month end
            W.loc[days, a] += s * E / N
            W.loc[days, b] -= s * E / N
    return lib.run(W)

GRID = dict(F=[90, 180], N=[5, 10], z_in=[1.5, 2.0, 2.5])
if __name__ == "__main__":
    import pickle, pathlib
    res = {k: run(*k) for k in itertools.product(*GRID.values())}
    pickle.dump(res, open(pathlib.Path(__file__).parent / "data" / "pairs_grid.pkl", "wb"))
    df = pd.DataFrame([dict(key=k, **lib.summarize(v)) for k, v in res.items()])
    print(df.drop(columns=["name", "lev", "ncomb"]).to_string())
