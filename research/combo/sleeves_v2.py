"""v2: BIST kolu 'C' (research/bist_all, sabit konfig): skor c_all = z(mom252_21)+z(h52)+z(lowvol60)+0.5 z(rev5),
rejim ew20 (likit EW endeks > SMA20, değilse PPF), top20, aylık (21 işlem günü) dengeleme. lag1 = birincil, lag0 = duyarlılık.

bist_all/common.simulate aynen kullanılır; tek düzeltme: P['cash'] satır başına 1/365 yerine takvim günü aralığıyla
bileşiklenir (orijinal motor nakdi eksik faizlendiriyordu; C kolu rejim kapalıyken nakitte durduğu için önemli).
Düzeltmesiz seriler mutabakat için ayrıca hesaplanır."""
import sys, pathlib
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent
ROOT = H.parents[1]
sys.path.insert(0, str(ROOT / "research/bist_all"))
import common as BC, signals as SG
import engine

OUT = H / "results"
CFG = dict(sig="c_all", reg="ew20", top=20, reb=21)


def to_bday(r, idx):
    key = pd.DatetimeIndex([d + pd.offsets.BDay(0) for d in r.index])
    r = (1 + r).groupby(key).prod() - 1
    return r.reindex(idx).fillna(0.0)


def build():
    P = BC.load_all(); S = SG.build(P); R = SG.regimes(P)
    out = {}
    for fix in [False, True]:
        if fix:
            days = P["days"]
            cr = engine.cash_rate_daily(days)
            gaps = pd.Series(days, index=days).diff().dt.days.fillna(1).values
            P["cash"] = pd.Series((1 + cr.values) ** gaps - 1, index=days)
        for lag in [0, 1]:
            r = BC.simulate(P, S[CFG["sig"]], top=CFG["top"], rebalance=CFG["reb"], regime=R[CFG["reg"]], lag=lag)
            out[(fix, lag)] = r
            print("cashfix" if fix else "orig", "lag", lag, BC.summarize(r))
    sl = pd.read_pickle(OUT / "sleeves.pkl")
    sl["C_L1"] = to_bday(out[(True, 1)], sl.index)
    sl["C_L0"] = to_bday(out[(True, 0)], sl.index)
    sl.to_pickle(OUT / "sleeves_v2.pkl")
    return sl


if __name__ == "__main__":
    sl = build()
    for a, b in [("2022-01-01", "2025-10-16"), ("2025-10-17", "2026-10-16")]:
        for c in ["MM", "C_L1", "C_L0", "KELLY"]:
            print(a, c, engine.stats((1 + sl[c].loc[a:b]).cumprod()))
