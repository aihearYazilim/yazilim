"""Daily event study for token unlocks. Entry at close of day d-N (d = UTC unlock day), exit close of d+M.
Short return reported as -(price return) minus BTC-adjusted variant; funding (short receives) added."""
import pandas as pd, numpy as np, pathlib
H = pathlib.Path(__file__).parent
P = pd.read_pickle(H.parent / "fresh/nl_panels.pkl")
C = P["close"]; F = P["fund"]; V = P["qvol"]
E = pd.read_csv(H / "unlock_events.csv", parse_dates=["ts", "day"])
fv = C.apply(lambda s: s.first_valid_index())
E = E[[s in C.columns and pd.notna(fv[s]) and fv[s] <= d - pd.Timedelta(days=30) for s, d in zip(E.sym, E.day)]]
# merge same sym within 3 days -> keep largest
E = E.sort_values("pct", ascending=False).drop_duplicates(["sym", "day"])
pos = {d: i for i, d in enumerate(C.index)}
Ca, Fa, Va = C.values, F.values, V.values; btc = C["BTCUSDT"].values; col = {s: i for i, s in enumerate(C.columns)}
NS, MS = [1, 2, 3, 5, 7, 10, 14], [-1, 0, 1, 2, 3, 5, 7]
rows = []
for _, e in E.iterrows():
    j = col[e.sym]; i = pos.get(e.day)
    if i is None: continue
    r = dict(sym=e.sym, day=e.day, pct=e.pct, cats=e.cats, oos=e.day >= pd.Timestamp("2025-10-17"),
             vol=np.nanmean(Va[i-8:i-1, j]))
    for N in NS:
        for M in MS:
            a, b = i - N, i + M
            if b <= a or b >= len(C) or np.isnan(Ca[a, j]) or np.isnan(Ca[b, j]): continue
            pr = Ca[b, j] / Ca[a, j] - 1; br = btc[b] / btc[a] - 1
            fu = np.nansum(Fa[a+1:b+1, j])
            r[f"s{N}_{M}"] = -pr + fu; r[f"x{N}_{M}"] = -pr + br + fu
    rows.append(r)
R = pd.DataFrame(rows); R.to_csv(H / "es_unlock.csv", index=False)
print("events by thr:", {t: int((R.pct >= t).sum()) for t in [.01, .02, .05, .1]}, "OOS(>=2%):", int(((R.pct >= .02) & R.oos).sum()))
for thr in [.02, .05]:
    for k in ["s", "x"]:
        print(f"== thr {thr} {'short raw' if k=='s' else 'short minus BTC'} : mean% IS | OOS  (gross, incl funding)")
        G = R[R.pct >= thr]
        tab = pd.DataFrame({N: {M: (f"{G.loc[~G.oos, f'{k}{N}_{M}'].mean()*100:+.1f} | {G.loc[G.oos, f'{k}{N}_{M}'].mean()*100:+.1f}" if f'{k}{N}_{M}' in G else "") for M in MS} for N in NS})
        tab.index.name = "M\\N"; print(tab.to_string())
G = R[R.pct >= .02]
print("median/hit s7_0 IS,OOS:", G.loc[~G.oos, "s7_0"].median(), (G.loc[~G.oos, "s7_0"] > 0).mean(), G.loc[G.oos, "s7_0"].median(), (G.loc[G.oos, "s7_0"] > 0).mean())
print(G.groupby(G.day.dt.year).s7_0.agg(["mean", "median", "count"]))
