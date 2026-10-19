"""Ortak veri + backtest altyapısı (kaldıraçlı trend / risk-parite).

Muhasebe modeli (TRY bazlı yatırımcı, vadeli/teminat mantığı):
  NAV TRY cinsinden. Teminat nakitte (base='TRY': TL para piyasası fonu, engine.cash_rate_daily;
  base='USD': USD mevduat ~ fed funds - %0.5, USDTRY ile TL'ye çevrilir).
  Her pozisyonun katkısı = w_i * fazla_getiri_i (TL'ye çevrilmiş P&L):
    - VİOP XU030 vadeli : r_XU030 - TL fonlama (politika faizi)      [fiyat endeksi, temettü yok -> muhafazakâr]
    - VİOP USDTRY vadeli: r_USDTRY - (politika - USD faiz)           [forward primi]
    - GC/SI/CL/HG=F     : sürekli vadeli fiyat getirisi (zaten fazla getiri) - %0.5/yıl, P&L * (1+r_fx)
    - SPY/QQQ/TQQQ/TLT/IEF/EEM: toplam getiri - %5/yıl USD fonlama, P&L * (1+r_fx)
    - BTC/ETH           : r - %10/yıl fonlama (perp), P&L * (1+r_fx)
  Açığa satış: -w * (aynı fazla getiri) (fonlama işareti simetrik; muhafazakâr değil ama küçük).
  İşlem maliyeti (ciro başına): vadeli/ETF %0.05, kripto %0.10. Haftalık yeniden dengeleme, drift izlenir.
  NAV günlük -%100'ü aşarsa iflas (NAV=0, kalır).
"""
import sys, pathlib, numpy as np, pandas as pd
ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))
import engine  # noqa

HERE = pathlib.Path(__file__).resolve().parent
OOS_START, OOS_END = "2025-10-17", "2026-10-16"
IS_END = "2025-10-16"

# Yaklaşık ABD politika faizi (yıllık %), ay başından geçerli
FED = {"2016-01": 0.4, "2016-12": 0.65, "2017-03": 0.9, "2017-06": 1.15, "2017-12": 1.4, "2018-03": 1.65,
       "2018-06": 1.9, "2018-09": 2.15, "2018-12": 2.4, "2019-08": 2.15, "2019-09": 1.9, "2019-11": 1.6,
       "2020-03": 0.1, "2022-03": 0.35, "2022-05": 0.85, "2022-06": 1.6, "2022-07": 2.35, "2022-09": 3.1,
       "2022-11": 3.85, "2022-12": 4.35, "2023-02": 4.6, "2023-03": 4.85, "2023-05": 5.1, "2023-07": 5.35,
       "2024-09": 4.85, "2024-11": 4.6, "2024-12": 4.35, "2025-09": 4.1, "2025-10": 3.85, "2025-12": 3.6}

USD_ETF = ["SPY", "QQQ", "TQQQ", "TLT", "IEF", "EEM"]
USD_FUT = ["GC_F", "SI_F", "CL_F", "HG_F"]
CRYPTO = ["BTC", "ETH"]
TRY_FUT = ["XU030", "USDTRY"]
ALL = TRY_FUT + USD_FUT + USD_ETF + CRYPTO


def _rate_series(table, idx):
    s = pd.Series(np.nan, index=idx)
    for k, v in sorted(table.items()):
        s[s.index >= pd.Timestamp(k + "-01")] = v
    return s.ffill().bfill() / 100


def load():
    px = {}
    for n in TRY_FUT:
        px[n] = pd.read_csv(ROOT / "data/bist" / f"{n}.csv", index_col=0, parse_dates=True)["close"]
    for n in USD_FUT + USD_ETF:
        px[n] = pd.read_csv(HERE / "data" / f"{n}.csv", index_col=0, parse_dates=True)["close"]
    for n in CRYPTO:
        px[n] = pd.read_csv(ROOT / "data/crypto" / f"{n}.csv", index_col=0, parse_dates=True)["close"]
    idx = pd.bdate_range("2016-10-18", OOS_END)
    P = pd.DataFrame({k: v[~v.index.duplicated()].reindex(idx.union(v.index)).ffill().reindex(idx)
                      for k, v in px.items()})
    # kaynak verisi başlamadan önceki ffill'i engelle (zaten NaN kalır)
    R = P.pct_change(fill_method=None)
    # CL=F Nisan 2020 negatif fiyat: fiyat<=0 olan günlerin getirilerini 0 yap
    bad = (P["CL_F"] <= 0) | (P["CL_F"].shift(1) <= 0)
    R.loc[bad, "CL_F"] = 0.0
    fx = R["USDTRY"].fillna(0)
    pol = _rate_series(engine.POLICY, idx)            # TL politika faizi
    fed = _rate_series(FED, idx)
    d = lambda a: (1 + a) ** (1 / 260) - 1            # iş günü bazında
    X = pd.DataFrame(index=idx)
    X["XU030"] = R["XU030"] - d(pol)
    X["USDTRY"] = R["USDTRY"] - (d(pol) - d(fed))
    for n in USD_FUT:
        X[n] = (R[n] - d(0.005)) * (1 + fx)
    for n in USD_ETF:
        X[n] = (R[n] - d(0.05)) * (1 + fx)
    for n in CRYPTO:
        X[n] = (R[n] - d(0.10)) * (1 + fx)
    X = X.where(R.notna())                            # veri yokken NaN
    # drift için kullanılan fiyat getirisi (TL P&L ölçeği)
    D = R.copy()
    for n in USD_FUT + USD_ETF + CRYPTO:
        D[n] = (1 + R[n]) * (1 + fx) - 1
    cash_try = engine.cash_rate_daily(idx).values      # takvim günü bazlı -> iş gününe çevir
    cash_try = pd.Series((1 + cash_try) ** (365 / 260) - 1, index=idx)
    cash_usd = (1 + d((fed - 0.005).clip(lower=0))) * (1 + fx) - 1
    cost = pd.Series({n: (0.001 if n in CRYPTO else 0.0005) for n in ALL})
    return dict(P=P, R=R, X=X, D=D, cash={"TRY": cash_try, "USD": cash_usd}, cost=cost, idx=idx,
                pol=pol, fed=fed)


def backtest(W, U, cash, rebal_every=5, ruin=True):
    """W: hedef ağırlık (t kapanışında bilinen), t+1'den uygulanır. Haftalık yeniden dengeleme.
    Döner: günlük net getiri serisi, ciro serisi."""
    X = U["X"][W.columns].fillna(0).values
    Dr = U["D"][W.columns].fillna(0).values
    c = U["cost"][W.columns].values
    cr = cash.values
    Wt = W.fillna(0).values
    n, m = Wt.shape
    w = np.zeros(m)
    out = np.zeros(n); to = np.zeros(n)
    dead = False
    for t in range(1, n):
        if dead:
            continue
        # gün t getirisi, t-1 sonunda tutulan w ile
        r = cr[t] + (w * X[t]).sum()
        if ruin and r <= -0.999:
            out[t] = -0.999; dead = True; continue
        out[t] = r
        w = w * (1 + Dr[t]) / (1 + r)
        if t % rebal_every == 0 or (t == 1):
            tgt = Wt[t]
            tr = np.abs(tgt - w)
            cst = (tr * c).sum()
            out[t] = (1 + out[t]) * (1 - cst) - 1
            to[t] = tr.sum()
            w = tgt.copy()
    return pd.Series(out, index=W.index), pd.Series(to, index=W.index)


def eq_of(r):
    return (1 + r).cumprod()


def mstats(r, start, end):
    e = eq_of(r.loc[start:end])
    s = engine.stats(e)
    x = r.loc[start:end]
    s["sharpe_raw"] = round(x.mean() / (x.std() + 1e-12) * np.sqrt(260), 2)
    return s
