"""Walk-forward: each calendar month pick the combo with best trailing-N-month geo (only trades already settled), trade it next month."""
import pickle, sys, numpy as np, pandas as pd
TAG = sys.argv[1] if len(sys.argv) > 1 else "h0.05_sk0.0"
ser = pickle.load(open(f"data/series_{TAG}.pkl", "rb"))
OOS0 = pd.Timestamp("2025-10-17")
keys = list(ser)
big = {k: s.assign(d=pd.to_datetime(s.index), x=pd.to_datetime(s.expiry)) for k, s in ser.items()}
def geo(r, months):
    t = np.prod(1 + r)
    return t ** (1 / months) - 1 if t > 0 else -1
def run(look, subset=None, months0="2023-04-01"):
    ks = [k for k in keys if subset is None or subset(k)]
    out = []
    for m in pd.date_range(months0, "2026-10-01", freq="MS"):
        best, bk = -9, None
        for k in ks:
            s = big[k]; w = s[(s.d >= m - pd.DateOffset(months=look)) & (s.x < m)]
            if len(w) < 3: continue
            g = geo(w.r.values, look)
            if g > best: best, bk = g, k
        s = big[bk]; nxt = s[(s.d >= m) & (s.d < m + pd.DateOffset(months=1)) & (s.d <= "2026-10-09")]
        for _, row in nxt.iterrows(): out.append((row.d, row.x, row.r, bk))
    df = pd.DataFrame(out, columns=["d", "x", "r", "k"])
    return df
def summ(df, a, b):
    x = df[(df.d >= a) & (df.d < b)]
    eq = (1 + x.r).cumprod(); days = (x.x.max() - x.d.min()).days
    m = (1 + x.r).groupby(x.x.dt.to_period("M")).prod() - 1
    return dict(geo=eq.iloc[-1] ** (30.44 / days) - 1, dd=(eq / eq.cummax().clip(lower=1) - 1).min(), worst_m=m.min(), n=len(x))
if __name__ == "__main__":
    for look in (12, 24):
        for name, sub in [("all", None), ("defined_risk", lambda k: k[1] in ("pspread", "condor")),
                          ("csp_only", lambda k: k[1] == "csp"), ("unlev", lambda k: k[3] <= 1 and k[1] not in ("pspread", "condor"))]:
            df = run(look, sub)
            print(look, name, "pre-OOS WF(2023-04..2025-10):", {k: round(v, 4) for k, v in summ(df, "2023-04-01", OOS0).items()},
                  "| OOS:", {k: round(v, 4) for k, v in summ(df, OOS0, "2026-10-17").items()})
            print("   OOS picks:", df[df.d >= OOS0].k.drop_duplicates().tolist()[:6])
