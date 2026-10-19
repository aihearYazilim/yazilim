"""Rüçhan hakkı kuponu (X.R) vs pay (X.E) fiyatlaması.
Teorik kupon değeri = S - K (K: rüçhan kullandırma fiyatı, KAP'tan; yoksa nominal 1 TL varsayılır, işaretlenir).
Kural (a priori): t-1 kapanışında  edge = S*(1-c) - K - C*(1+c)  >  h*(C+K)  ise t günü kupon AOF'tan alınır, hemen kullanılır (K ödenir).
  A) Hedgesiz: yeni pay t+3 iş günü AOF'tan satılır (pay teslimi gecikmesi).  Ara değerleme: pay kapanışı.
  B) Hedgeli (elinde pay olan / açığa satış): aynı gün t pay AOF'tan satılır; sermaye t+3'e kadar bağlı.
c = FEE+SLIP her bacakta. Likidite: kupon günlük TL hacminin %1'i."""
import numpy as np, pandas as pd
from common_ss import *
P = panel(); idx = days()
RE = pd.read_csv(H/"rights_events.csv", parse_dates=["start", "end", "first_ts"]) if (H/"rights_events.csv").exists() else pd.DataFrame()
C = P[P.suf == "R"].copy(); S = P[P.suf == "E"].set_index(["sym", "date"])
c = FEE + SLIP
def K_of(sym, d):
    if len(RE):
        m = RE[(RE.ticker == sym) & (RE.start - pd.Timedelta(days=5) <= d) & (RE.end.fillna(RE.start + pd.Timedelta(days=20)) + pd.Timedelta(days=5) >= d)]
        if len(m): return float(m.K.iloc[0]), float(m.ratio.iloc[0]) / 100, True
    return np.nan, np.nan, False
rows = []
for code, g in C.groupby("code"):
    sym = code.split(".")[0]
    g = g.set_index("date").sort_index()
    for d, x in g.iterrows():
        if (sym, d) not in S.index: continue
        s = S.loc[(sym, d)]
        if isinstance(s, pd.DataFrame): s = s.iloc[0]
        K, r, known = K_of(sym, d)
        rows.append({"code": code, "sym": sym, "date": d, "C_c": x.c, "C_v": x.v, "C_val": x.val, "S_c": s.c, "S_v": s.v, "K": K, "r": r, "K_known": known})
X = pd.DataFrame(rows).sort_values(["code", "date"])
# 1 kupon = 1 TL nominal eski paya bağlı hak = r adet yeni pay alma hakkı (r = kullanım oranı)
X["theo"] = X.r * (X.S_c - X.K)
X["disc_close%"] = 100 * (X.theo - X.C_c) / (X.r * X.S_c)
X["edge_close"] = (X.r * (X.S_c * (1 - c) - X.K) - X.C_c * (1 + c)) / (X.C_c * (1 + c) + X.r * X.K)
X["edge_vwap"] = (X.r * (X.S_v * (1 - c) - X.K) - X.C_v * (1 + c)) / (X.C_v * (1 + c) + X.r * X.K)
X = X[X.K_known & (X.C_c > 0) & (X.S_c > 0)]
X.to_csv(H/"results"/"rights_coupon_days.csv", index=False)
print("kupon-gün:", len(X), "kupon:", X.code.nunique(), "K bilinen oran:", round(X.K_known.mean(), 2))
print(X.groupby(X.date.dt.year).agg(n=("code", "size"), cups=("code", "nunique"), med_disc=("disc_close%", "median"),
      med_edge_vw=("edge_vwap", "median"), frac_pos=("edge_vwap", lambda s: (s > 0).mean())).round(3))
def trades(h=0.01, hedged=False, lag=3, only_known=False):
    T = []
    for code, g in X.groupby("code"):
        g = g.set_index("date")
        sym = code.split(".")[0]; ss = S.loc[sym] if sym in S.index.get_level_values(0) else None
        if ss is None: continue
        ss = ss[~ss.index.duplicated()]
        ds = list(g.index)
        for i in range(1, len(ds)):
            prev, d = g.iloc[i - 1], g.iloc[i]
            if only_known and not d.K_known: continue
            if not (prev.edge_close > h and d.C_v > 0 and d.S_v > 0): continue
            cost = d.C_v * (1 + c) + d.r * d.K
            k = idx.searchsorted(ds[i]); dx = idx[min(k + lag, len(idx) - 1)]
            if hedged:
                v = d.r * d.S_v * (1 - c) / cost
                path = pd.Series(v, index=idx[(idx >= ds[i]) & (idx <= dx)])
            else:
                sp = d.r * ss.c.loc[ds[i]:dx] / cost
                if dx not in ss.index or len(sp) == 0: continue
                sp.iloc[-1] = d.r * ss.v.loc[dx] * (1 - c) / cost
                path = sp
            T.append({"d0": ds[i], "path": path, "liq_tl": d.C_val, "key": code, "code": code})
    return T
if __name__ == "__main__":
    out = []
    for hedged in [False, True]:
        for h in [0.0, 0.01, 0.02, 0.05]:
            T = trades(h, hedged)
            r1 = [p["path"].iloc[-1] - 1 for p in T]
            for cap in [100_000, 1_000_000]:
                eq, log = simulate(T, cap, max_frac=0.25, liq=0.01)
                rr = report(eq, log, f"rights hedged={hedged} h={h} cap={cap}"); rr["mean_trade%"] = round(100*np.mean(r1), 2) if r1 else None
                out.append(rr); print(rr, flush=True)
    pd.DataFrame(out).to_csv(H/"results"/"rights_grid.csv", index=False)
