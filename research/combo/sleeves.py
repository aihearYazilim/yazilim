"""Kombine portföy için 'kol' (sleeve) günlük net getiri serileri, iş günü takviminde (bdate).

Hepsi nedensel: t kapanışında bilinen ağırlık t+1 getirisine uygulanır. Nakit/PPF faizi takvim günü
aralığına göre bileşiklenir (engine.backtest nakdi işlem günü başına 1/365 ile faizlendiriyordu -> düzeltildi).

  MM   : para piyasası fonu (PPF), engine.cash_rate_daily (politika x 0.9, net)
  BIST : momentum lb250 top3, 5 iş gününde bir (haftalık) yeniden dengeleme, XU100 > SMA50 değilse PPF.
         Maliyet %0.14/ciro (komisyon+kayma, protokol). Bireysel BIST pay kazancı stopajı %0.
  KELLY: lev_trend 'B' = KELLY|ALL|L=252|f=0.25|Lmax=4, USD teminat. lev_trend/grid.pkl'den alınır
         (vergi ÖNCESİ; vergi combo.py'de yıllık uygulanır).
"""
import sys, pathlib, pickle
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent
ROOT = H.parents[1]
sys.path.insert(0, str(ROOT / "src"))
import engine, strategies as ST

IDX = pd.bdate_range("2017-01-02", "2026-10-16")
FEE_BIST = 0.0014


def cash_bday(idx=IDX):
    """iş günü t'nin getirisi = önceki iş gününden t'ye kadar takvim günü kadar faiz"""
    cr = engine.cash_rate_daily(idx)
    gaps = pd.Series(idx, index=idx).diff().dt.days.fillna(1).values
    return pd.Series((1 + cr.values) ** gaps - 1, index=idx)


def bist_momentum(idx=IDX, lb=250, top=3, rb=5, regime_n=50, phase=0):
    """research_bist.py ile aynı kurulum (BIST işlem takvimi, 2018-01-01'den, ffill(limit=5)); tek fark:
    nakit faizi takvim günü aralığıyla bileşiklenir. phase: haftalık dengeleme gününü k gün kaydırır
    (sadece duyarlılık testi için)."""
    px = engine.load("bist")
    close = engine.panel(px).loc["2018-01-01":]
    xu = close.pop("XU100"); close.pop("XU030"); close.pop("USDTRY")
    close = close.ffill(limit=5); xu = xu.ffill()
    close = close.iloc[phase:]; xu = xu.iloc[phase:]
    w = ST.momentum_rotation(close, lb, top, rb, regime=xu, regime_n=regime_n, min_hist=250)
    rets = close.pct_change(fill_method=None).fillna(0.0)
    wl = w.shift(1).fillna(0.0)
    cr = engine.cash_rate_daily(close.index)
    gaps = pd.Series(close.index, index=close.index).diff().dt.days.fillna(1).values
    cash = pd.Series((1 + cr.values) ** gaps - 1, index=close.index)
    gross = (wl * rets).sum(axis=1) + (1 - wl.sum(axis=1)).clip(lower=0) * cash
    drift = (wl * (1 + rets)).div(1 + gross, axis=0)
    turnover = (w - drift).abs().sum(axis=1)
    net = gross - turnover * FEE_BIST
    # iş günü takvimine: panelde USDTRY kaynaklı Pazar satırları var (orijinal araştırmayla aynı kalsın diye
    # korunur); hafta sonu satırlarının getirisi sonraki iş gününe bileşiklenir. BIST tatili olan iş günlerinde
    # getiri 0 (faiz sonraki işlem gününde gün farkıyla gelir).
    key = pd.DatetimeIndex([d + pd.offsets.BDay(0) for d in net.index])
    net = (1 + net).groupby(key).prod() - 1
    return net.reindex(idx).fillna(0.0), w


def kelly_B():
    res = pickle.load(open(ROOT / "research/lev_trend/grid.pkl", "rb"))
    r, to = res[("KELLY|ALL|L=252|f=0.25|Lmax=4", "USD")]
    return r, to


def build():
    mm = cash_bday()
    b, w = bist_momentum()
    k, to = kelly_B()
    k = k.reindex(IDX).fillna(0.0)
    df = pd.DataFrame({"MM": mm, "BIST": b, "KELLY": k})
    for ph in range(1, 5):   # dengeleme günü duyarlılığı (seçim için kullanılmaz)
        df[f"BIST_ph{ph}"] = bist_momentum(phase=ph)[0]
    df.to_pickle(H / "results" / "sleeves.pkl")
    w.to_pickle(H / "results" / "bist_weights.pkl")
    return df


if __name__ == "__main__":
    df = build()
    for a, b_ in [("2022-01-01", "2025-10-16"), ("2025-10-17", "2026-10-16")]:
        for c in df:
            e = (1 + df[c].loc[a:b_]).cumprod()
            print(a, c, engine.stats(e))
