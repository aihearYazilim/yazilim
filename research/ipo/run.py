"""Tüm simülasyonları çalıştırır, sonuçları results/ altına yazar."""
import pathlib, itertools
import numpy as np, pandas as pd
import simulate as S

H = pathlib.Path(__file__).resolve().parent
OUT = H / "results"; OUT.mkdir(exist_ok=True)
IS0, IS1 = pd.Timestamp("2022-01-01"), pd.Timestamp("2025-10-16")
rows = S.ipo_table()
used = pd.DataFrame([{k: v for k, v in r.items() if k != "px"} for r in rows])
used.to_csv(H / "ipos_used.csv", index=False)
print("IPO:", len(rows))

NS = [1, 2, 3, 5, 10, 999]
VARS = ["nextvwap", "close"]
lines = []
# ---------- Strateji A: işlem başı istatistikler ----------
gridA = []
for N, v in itertools.product(NS, VARS):
    tr = S.ipo_trades(rows, N, v)
    for name, a, b in [("IS", IS0, IS1), ("OOS", S.OOS0, S.OOS1)]:
        t = tr[(tr.first_trade >= a) & (tr.first_trade <= b)]
        gridA.append(dict(N=N, var=v, period=name, n=len(t), mean_ret=t.ret.mean(), med_ret=t.ret.median(),
                          pnl_per_acct=t.pnl.sum(), cost_per_acct=t.cost.sum()))
gridA = pd.DataFrame(gridA); gridA.to_csv(OUT / "gridA.csv", index=False)
isA = gridA[gridA.period == "IS"].sort_values("pnl_per_acct", ascending=False)
bestN, bestV = int(isA.iloc[0].N), isA.iloc[0]["var"]
print(gridA.to_string())
print("IS'te seçilen A parametresi:", bestN, bestV)

trA = S.ipo_trades(rows, bestN, bestV)
trA.to_csv(OUT / "tradesA.csv", index=False)

# ---------- Strateji A: sermaye üzerinden aylık getiri ----------
resA = []
eqs = {}
for C, acc, blk in itertools.product([100_000, 500_000, 1_000_000], [1, 4], ["cash", "fund"]):
    for name, a, b in [("IS", IS0, IS1), ("OOS", S.OOS0, S.OOS1)]:
        eq = S.equity_A(trA, C, acc, blk, a, b)
        eqs[(C, acc, blk, name)] = eq
        st = S.stats(eq, a, b)
        resA.append(dict(C=C, accounts=acc, block=blk, period=name, **st))
for name, a, b in [("IS", IS0, IS1), ("OOS", S.OOS0, S.OOS1)]:
    cash_only = S.equity_A(trA.iloc[0:0], 1_000_000, 1, "fund", a, b)
    resA.append(dict(C="cash-only", accounts=0, block="-", period=name, **S.stats(cash_only, a, b)))
resA = pd.DataFrame(resA); resA.to_csv(OUT / "resA.csv", index=False)
print(resA.to_string())

# yıllık (takvim yılı) aylık geo, C=100k, 1 ve 4 hesap
yr = []
for key in [(100_000, 1, "cash"), (100_000, 4, "cash"), (500_000, 1, "cash"), (1_000_000, 1, "cash")]:
    for y in [2022, 2023, 2024, 2025, "OOS"]:
        a, b = (S.OOS0, S.OOS1) if y == "OOS" else (pd.Timestamp(f"{y}-01-01"), pd.Timestamp(f"{y}-12-31"))
        eq = S.equity_A(trA, *key, a, b)
        st = S.stats(eq, a, b)
        yr.append(dict(C=key[0], accounts=key[1], block=key[2], year=y, **st))
yr = pd.DataFrame(yr); yr.to_csv(OUT / "yearlyA.csv", index=False); print(yr.to_string())

# IPO başı TL kâr (hesap başı) yıllara göre
trA["year"] = trA.first_trade.dt.year
trA["oos"] = (trA.first_trade >= S.OOS0) & (trA.first_trade <= S.OOS1)
peryear = trA.groupby("year").agg(n=("pnl", "size"), pnl_tl=("pnl", "sum"), avg_ret=("ret", "mean"),
                                  avg_alloc_tl=("cost", "mean"), avg_streak=("streak", "mean"))
peryear.loc["OOS"] = [trA.oos.sum(), trA[trA.oos].pnl.sum(), trA[trA.oos].ret.mean(),
                      trA[trA.oos].cost.mean(), trA[trA.oos].streak.mean()]
peryear.to_csv(OUT / "peryearA.csv"); print(peryear.to_string())

# OOS aylık TL kâr (1 hesap)
oosm = trA[trA.oos].groupby(trA[trA.oos].exit_date.dt.to_period("M")).pnl.sum()
oosm.to_csv(OUT / "oos_monthly_pnl_A.csv"); print(oosm)

# ---------- Strateji B: ikincil piyasa ilk gün ----------
gridB = []
for N, v, w in itertools.product(NS, VARS, [0.25, 0.5, 1.0]):
    tr = S.secondary_trades(rows, N, v)
    for name, a, b in [("IS", IS0, IS1), ("OOS", S.OOS0, S.OOS1)]:
        eq = S.equity_B(tr, 1_000_000, w, a, b)
        t = tr[(tr.entry_date >= a) & (tr.entry_date <= b)]
        st = S.stats(eq, a, b)
        gridB.append(dict(N=N, var=v, w=w, period=name, n=len(t), mean_ret=t.ret.mean(),
                          win=(t.ret > 0).mean(), **st))
gridB = pd.DataFrame(gridB); gridB.to_csv(OUT / "gridB.csv", index=False)
isB = gridB[gridB.period == "IS"].sort_values("geo_month", ascending=False)
b = isB.iloc[0]; print("IS'te seçilen B:", b.N, b["var"], b.w)
selB = gridB[(gridB.N == b.N) & (gridB["var"] == b["var"]) & (gridB.w == b.w)]
selB.to_csv(OUT / "selB.csv", index=False)
print(gridB.to_string())
trB = S.secondary_trades(rows, int(b.N), b["var"]); trB.to_csv(OUT / "tradesB.csv", index=False)
for C in [100_000, 500_000, 1_000_000]:
    print("B", C, S.stats(S.equity_B(trB, C, b.w, IS0, IS1), IS0, IS1),
          S.stats(S.equity_B(trB, C, b.w, S.OOS0, S.OOS1), S.OOS0, S.OOS1))

# ---------- Hesap sayısı x sermaye ızgarası (OOS, A) ----------
acc_grid = []
for C in [50_000, 100_000, 250_000, 500_000, 1_000_000]:
    for acc in [1, 2, 4, 6, 8, 10]:
        for name, a, b in [("IS", IS0, IS1), ("OOS", S.OOS0, S.OOS1)]:
            st = S.stats(S.equity_A(trA, C, acc, "cash", a, b), a, b)
            acc_grid.append(dict(C=C, accounts=acc, period=name, geo_month=st["geo_month"], total=st["total"]))
acc_grid = pd.DataFrame(acc_grid); acc_grid.to_csv(OUT / "accounts_grid.csv", index=False)
print(acc_grid.pivot_table(index=["period", "C"], columns="accounts", values="geo_month").round(4).to_string())
