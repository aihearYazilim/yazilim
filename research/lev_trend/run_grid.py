"""Tüm parametre kombinasyonlarının günlük net getiri serilerini üretir (her biri nedensel)."""
import itertools, pickle, sys, time, numpy as np, pandas as pd
FLOOR = float(sys.argv[1]) if len(sys.argv) > 1 else 0.0   # 0.10 = post-hoc varyant (OOS atfı görüldükten sonra eklendi)
import common as cm, lt_strategies as st

U = cm.load()
t0 = time.time()
pre = st.Pre(U, floor=FLOOR)
print("pre", round(time.time() - t0, 1), "s")
TV = [0.2, 0.4, 0.6, 0.8]
LM = [4, 10]
BASES = ["TRY", "USD"]
res = {}

def add(name, W):
    for b in BASES:
        r, to = cm.backtest(W, U, U["cash"][b])
        res[(name, b)] = (r, to)

raws = {}
for u in ["ALL", "NOCRY", "VIOP"]:
    cols = st.UNIV[u]
    for L, lo in itertools.product([21, 63, 126, 252, "ens"], [True, False]):
        raws[f"TSMOM|{u}|L={L}|{'long' if lo else 'ls'}"] = st.tsmom(pre, cols, L, lo)
    for rg in ["none", "sma200"]:
        raws[f"RP|{u}|{rg}"] = st.riskparity(pre, cols, rg)
for u in ["ALL", "NOCRY", "VIOP", "AGGR"]:
    cols = st.UNIV[u]
    for L, k in itertools.product([126, 252], [2, 3, 5]):
        if u == "VIOP" and k == 5:
            continue
        raws[f"DUAL|{u}|L={L}|k={k}"] = st.dualmom(pre, cols, L, k)

scaled = {}
for name, raw in raws.items():
    for T, lm in itertools.product(TV, LM):
        W = pre.scale_to_vol(raw, T, lm)
        scaled[(name, T, lm)] = W
        add(f"{name}|T={T}|Lmax={lm}", W)
print("vol-target done", len(res), round(time.time() - t0, 1))

# Ensemble: TSMOM-ens(long/short) + RP-sma200 + DUAL L252 k3, eşit ağırlıklı ham sinyaller sonra vol hedefi
for u in ["ALL", "NOCRY", "VIOP"]:
    for T, lm in itertools.product(TV, LM):
        parts = [scaled[(f"TSMOM|{u}|L=ens|ls", T, lm)], scaled[(f"RP|{u}|sma200", T, lm)],
                 scaled[(f"DUAL|{u}|L=252|k=3", T, lm)]]
        raw = sum(p.reindex(columns=parts[0].columns, fill_value=0) for p in parts) / 3
        W = pre.scale_to_vol(raw, T, lm)
        add(f"ENS|{u}|T={T}|Lmax={lm}", W)

for u in ["ALL", "NOCRY", "VIOP", "AGGR"]:
    for L, f, lm in itertools.product([126, 252], [0.25, 0.5, 1.0], LM):
        W = st.kelly(pre, st.UNIV[u], L, f, lm)
        add(f"KELLY|{u}|L={L}|f={f}|Lmax={lm}", W)

# Pasif referanslar (parametresiz)
idx = U["idx"]
for n in ["XU030", "GC_F", "SPY", "TQQQ", "BTC"]:
    W = pd.DataFrame({n: 1.0}, index=idx)
    r, to = cm.backtest(W, U, U["cash"]["TRY"])
    res[(f"REF|{n} 1x", "TRY")] = (r, to)
r0 = U["cash"]["TRY"].copy(); r0.iloc[0] = 0
res[("REF|TL PPF", "TRY")] = (r0, r0 * 0)

print("total configs", len(res), round(time.time() - t0, 1))
pickle.dump(res, open(cm.HERE / ("grid.pkl" if FLOOR == 0 else f"grid_floor{FLOOR}.pkl"), "wb"))
