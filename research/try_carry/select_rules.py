"""Seçim: yalnızca IS sütunları (2005-01..2025-10-16). Önceden tanımlı kurallar + komşu sağlamlığı + walk-forward."""
import numpy as np, pandas as pd, ast
pd.set_option("display.width", 250); pd.set_option("display.max_columns", 40)
R = pd.read_csv("grid.csv")
Z = np.load("grid_monthly.npz"); MR = Z["mr"].astype(float); months = pd.DatetimeIndex(Z["months"])
COLS = ["sizing", "trend", "real", "ptr", "stop", "IS", "IS_dd", "IS_worst", "IS_sh", "avgL_IS",
        "OOS", "OOS_dd", "OOS_worst", "avgL_OOS", "trades_OOS", "stops_IS", "liq_IS"]

# ---- komşu sağlamlığı: her boyutta bir adım değişen konfigürasyonların IS geo medyanı ve minimumu
dims = ["sizing", "trend", "real", "ptr", "stop"]
for c in dims:
    R[c] = R[c].astype(object).where(R[c].notna(), "None").astype(str)
order = {c: list(dict.fromkeys(R[c])) for c in dims}


def sz_tuple(s):
    k, a, b, w = s.split(":"); return (k, float(a), b, w)


def neighbors_sizing(s):
    k, a, b, w = s.split(":")
    if k == "fix":
        Ls = [1, 2, 3, 4, 5, 6, 8]; i = Ls.index(int(float(a)))
        return [f"fix:{Ls[j]}:None:None" for j in (i - 1, i + 1) if 0 <= j < len(Ls)]
    tv = [0.1, 0.15, 0.2, 0.3]; lm = [3, 5, 8]; ws = [20, 60]
    i, j, l = tv.index(float(a)), lm.index(int(b)), ws.index(int(w))
    out = []
    for di in (-1, 1):
        if 0 <= i + di < 4: out.append(f"vt:{tv[i+di]}:{b}:{w}")
        if 0 <= j + di < 3: out.append(f"vt:{a}:{lm[j+di]}:{w}")
    out.append(f"vt:{a}:{b}:{ws[1-l]}")
    return out


def nb_vals(c, v):
    if c == "sizing":
        return neighbors_sizing(v)
    L = order[c]; i = L.index(v)
    if c == "trend":   # (n,k): komşu = aynı n farklı k, aynı k farklı n, ya da None<->(*)
        if v == "None": return []
        n, k = ast.literal_eval(v)
        ns, ks = [5, 20, 60], [0.5, 1.0, 2.0]
        out = [str((ns[j], k)) for j in (ns.index(n) - 1, ns.index(n) + 1) if 0 <= j < 3]
        out += [str((n, ks[j])) for j in (ks.index(k) - 1, ks.index(k) + 1) if 0 <= j < 3]
        return out
    return [L[j] for j in (i - 1, i + 1) if 0 <= j < len(L)]


key = R.set_index(dims)["IS"]
kd = key.to_dict()
nmed, nmin = [], []
for _, r in R.iterrows():
    vals = []
    for c in dims:
        for v in nb_vals(c, r[c]):
            t = tuple(v if cc == c else r[cc] for cc in dims)
            if t in kd: vals.append(kd[t])
    nmed.append(np.median(vals) if vals else np.nan); nmin.append(np.min(vals) if vals else np.nan)
R["nb_med"] = nmed; R["nb_min"] = nmin
R.to_csv("grid_with_nb.csv", index=False)

rules = {
    "R1 max IS geo": R.sort_values("IS", ascending=False).index[0],
    "R2 max IS geo | IS maxDD>=-50%": R[R.IS_dd >= -50].sort_values("IS", ascending=False).index[0],
    "R3 max IS geo | IS maxDD>=-25%, worst ay>=-15%":
        R[(R.IS_dd >= -25) & (R.IS_worst >= -15)].sort_values("IS", ascending=False).index[0],
    "R4 max komşu medyanı IS geo | IS maxDD>=-50%": R[R.IS_dd >= -50].sort_values("nb_med", ascending=False).index[0],
    "R5 max komşu medyanı | maxDD>=-25%": R[R.IS_dd >= -25].sort_values("nb_med", ascending=False).index[0],
    "R6 max IS Calmar (geo/|dd|), avgL>=1": R[R.avgL_IS >= 1].assign(c=lambda x: x.IS / -x.IS_dd).sort_values("c", ascending=False).index[0],
}
print("=== Önceden tanımlı IS seçim kuralları ===")
S = R.loc[list(rules.values()), COLS + ["nb_med", "nb_min"]]; S.insert(0, "rule", list(rules.keys()))
print(S.round(2).to_string(index=False))

print("\n=== IS geo ilk 15 (bilgi) ===")
print(R.sort_values("IS", ascending=False)[COLS + ["nb_med"]].head(15).round(2).to_string(index=False))

# ---- Walk-forward: her ay sonu, o güne kadarki (2005'ten genişleyen) aylık getirilerle en iyi konfig -> sonraki ay
def wf(start="2010-01-31", dd_lim=-50, look=None):
    out = []; picks = []
    prev = -1
    for i, m in enumerate(months):
        if m < pd.Timestamp(start) or i + 1 >= len(months):
            continue
        lo = 0 if look is None else max(0, i + 1 - look)
        X = MR[:, lo:i + 1]
        eq = np.cumprod(1 + X, axis=1)
        geo = eq[:, -1] ** (1 / X.shape[1]) - 1
        dd = (eq / np.maximum.accumulate(eq, axis=1) - 1).min(axis=1) * 100
        sc = np.where(dd >= dd_lim, geo, -9)
        j = int(np.argmax(sc)); picks.append((months[i + 1], j))
        r = MR[j, i + 1]
        if j != prev and prev >= 0:
            r -= 0.0005 * 2 * 5   # konfig değişimi: kaba geçiş maliyeti (~5x nominal, iki yön)
        out.append((months[i + 1], r)); prev = j
    s = pd.Series(dict(out))
    return s, picks


def sstats(s, a, b):
    x = s.loc[a:b]; eq = (1 + x).cumprod()
    return dict(geo=(eq.iloc[-1] ** (1 / len(x)) - 1) * 100, dd=((eq / eq.cummax()) - 1).min() * 100,
                worst=x.min() * 100, n=len(x))


print("\n=== Walk-forward (aylık yeniden seçim; OOS ayları = 2025-11..2026-10, ay sonu bazlı) ===")
for name, kw in [("WF genişleyen, dd>=-50", dict(dd_lim=-50)), ("WF genişleyen, dd>=-25", dict(dd_lim=-25)),
                 ("WF son 60 ay, dd>=-50", dict(dd_lim=-50, look=60)), ("WF son 36 ay, dd>=-30", dict(dd_lim=-30, look=36))]:
    s, picks = wf(**kw)
    a = sstats(s, "2010-02", "2025-10"); b = sstats(s, "2025-11", "2026-10")
    last = [R.loc[j, ["sizing", "trend", "real", "ptr", "stop"]].tolist() for _, j in picks[-12:]]
    nuniq = len(set(j for _, j in picks))
    print(name, "IS(2010-02..2025-10) geo %.2f dd %.1f worst %.1f | OOS geo %.2f dd %.1f worst %.1f | farklı konfig %d"
          % (a["geo"], a["dd"], a["worst"], b["geo"], b["dd"], b["worst"], nuniq))
    print("   OOS seçimleri:", sorted(set(map(str, last))))
