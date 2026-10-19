"""v4 tables. Selection only on IS; OOS grid used only for neighbour robustness."""
import sys, pathlib, json
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; OUT = H / "results"
sys.path.insert(0, str(H)); sys.dont_write_bytecode = True
pd.set_option("display.width", 250); pd.set_option("display.max_rows", 500)
res = pd.read_csv(OUT / "all_results_v4.csv")
for c in ["geo", "maxdd", "maxdd_mtm", "worst_m"]: res[c] *= 100
res["w"] = [f"{a:.2f}|{b:.2f}|{c:.2f}" for a, b, c in zip(res.w_ipo, res.w_opt, res.w_c)]
WS = lambda t: "|".join(f"{float(x):.2f}" for x in t)
WT = lambda s: tuple(float(x) for x in s.split("|"))
grid = res[res.scheme == "grid"]
K = ["C", "accounts", "size", "Lmax", "h", "nema"]
gi = grid[grid.period == "IS"].set_index(K + ["w"]).sort_index(); go = grid[grid.period == "OOS"].set_index(K + ["w"]).sort_index()


def neighbours(w):
    w = np.array(w) * 10
    if np.allclose(w, 10 / 3):
        return [tuple(np.round((np.full(3, 3) + np.eye(3)[j]) / 10, 1)) for j in range(3)]
    f = np.floor(w + 1e-9); r = int(round(10 - f.sum())); f[np.argsort(-(w - f))[:r]] += 1
    b = f / 10; out = []
    for i in range(3):
        for j in range(3):
            if i == j: continue
            x = b.copy(); x[i] += 0.1; x[j] -= 0.1
            if (x >= -1e-9).all(): out.append(tuple(np.round(x, 1)))
    return out


def nb_oos(C, k, sz, Lm, h, nema, w):
    vals = []
    for n in neighbours(w):
        vals.append(go.loc[(C, k, sz, Lm, h, nema, WS(n)), "geo"])
    h2 = 0.1 if h == 0.2 else 0.2
    wr = WS(np.round(np.array(w), 1)) if not np.allclose(np.array(w) * 10, 10 / 3) else WS((0.3, 0.3, 0.4))
    for key in [(C, k, sz, Lm, h2, nema, wr), (C, k, sz, 4, h, nema, wr)]:
        try: vals.append(go.loc[key, "geo"])
        except KeyError: pass
    return vals


rows = []
sch = res[res.scheme.isin(["EQ", "IV", "SH"])]
# add SH4 (IS max Sharpe on the stacked grid) and P1 = (1,0,0)
for key, g in gi.groupby(level=K):
    if key[3] == 4: continue
    g = g.reset_index()
    b = g.loc[g.sharpe.idxmax()]
    for name, w in [("SH4", b.w), ("P1", "1.00|0.00|0.00")]:
        rows.append(dict(zip(K, key), scheme=name, w=w))
for _, r in sch[sch.period == "IS"].iterrows():
    rows.append(dict(C=r.C, accounts=r.accounts, size=r["size"], Lmax=r.Lmax, h=r.h, nema=r.nema, scheme=r.scheme, w=r.w))
S = pd.DataFrame(rows)
out = []
for _, r in S.iterrows():
    key = (r.C, r.accounts, r["size"], r.Lmax, r.h, r.nema)
    if r.scheme in ("SH4", "P1"):
        a = gi.loc[key + (r.w,)]; o = go.loc[key + (r.w,)]
    else:
        m = sch[(sch.C == r.C) & (sch.accounts == r.accounts) & (sch["size"] == r["size"]) & (sch.Lmax == r.Lmax) &
                (sch.h == r.h) & (sch.nema == r.nema) & (sch.scheme == r.scheme)]
        a = m[m.period == "IS"].iloc[0]; o = m[m.period == "OOS"].iloc[0]
    nb = nb_oos(*key, WT(r.w))
    out.append(dict(r.to_dict(), IS_geo=a.geo, IS_dd=a.maxdd_mtm, IS_worst=a.worst_m, IS_sh=a.sharpe, OOS_geo=o.geo,
                    OOS_dd=o.maxdd_mtm, OOS_worst=o.worst_m, OOS_neg=o.neg_m, nliq_OOS=o.nliq, ncall_OOS=o.ncall,
                    ipo_cut=o.ipo_short, avgL=o.avgL, nb_min=min(nb), nb_med=float(np.median(nb)), n_nb=len(nb)))
T = pd.DataFrame(out)
T["pass10"] = T.OOS_geo >= 10; T["pass53"] = T.OOS_geo >= 5.3
T["rob10"] = T.pass10 & (T.nb_min >= 10); T["rob53"] = T.pass53 & (T.nb_min >= 5.3)
T.to_csv(OUT / "selected_v4.csv", index=False)

if __name__ == "__main__":
    print("simulation rows:", len(res), " grid configs (IS+OOS pairs):", len(res) // 2)
    print("IS-selectable configurations:", len(T))
    print("pass >=10%:", T.pass10.sum(), " robust:", T.rob10.sum(), "| pass >=5.3%:", T.pass53.sum(), " robust:", T.rob53.sum())
    print("OOS grid (hindsight) max geo:", go.geo.max(), go.geo.idxmax())
    print("OOS grid share >=10%:", (go.geo >= 10).mean(), " >=5.3:", (go.geo >= 5.3).mean())
    cols = ["C", "accounts", "size", "Lmax", "h", "nema", "scheme", "w", "IS_geo", "IS_dd", "IS_worst", "OOS_geo", "OOS_dd",
            "OOS_worst", "nb_min", "nb_med", "avgL", "ipo_cut", "nliq_OOS"]
    for sc in ["P1", "EQ", "SH4", "IV", "SH"]:
        x = T[(T.scheme == sc) & ((T["size"] == 2) | (sc == "P1")) & (T.h == 0.2) & (T.nema == 0.0)]
        if sc == "P1": x = x[x["size"] == 1]
        print(f"\n== {sc} (h=20%, nema=0)"); print(x[cols].round(2).to_string(index=False))
    print("\n== h/nema sensitivity for P1 and EQ, 100k/4")
    x = T[(T.C == 100000) & (T.accounts == 4) & (T.scheme.isin(["P1", "EQ"])) & ((T["size"] == 2) | (T.scheme == "P1"))]
    x = x[~((x.scheme == "P1") & (x["size"] == 2))]
    print(x[cols].round(2).to_string(index=False))
    print("\n== robust >= 5.3 list")
    print(T[T.rob53][cols].round(2).to_string(index=False))
    ref = res[res.scheme.isin(["nocarry", "carry_only", "nocashrule"])]
    print("\n== references (OOS / IS)")
    r1 = ref[(ref.scheme == "nocarry") & (ref.w.isin(["1.00|0.00|0.00", "0.30|0.30|0.40"])) & (ref["size"] == 2)]
    print(r1.pivot_table(index=["C", "accounts", "w"], columns="period", values="geo").round(2))
    r2 = ref[ref.scheme.isin(["carry_only", "nocashrule"])]
    print(r2.pivot_table(index=["scheme", "Lmax", "h", "nema", "C", "accounts"], columns="period", values=["geo", "maxdd_mtm"]).round(2).to_string())
