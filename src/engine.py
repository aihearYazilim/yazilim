"""Basit, sapmasız (look-ahead olmayan) portföy backtest motoru.

Ağırlıklar t günü kapanışında belirlenir, t+1 getirisine uygulanır.
Maliyet = ciro (turnover) x (komisyon + kayma). Vergi yıllık pozitif kâra uygulanır.
"""
import pathlib, numpy as np, pandas as pd

DATA = pathlib.Path(__file__).resolve().parents[1] / "data"

# Yaklaşık TCMB politika faizi (yıllık %), ay başından itibaren geçerli
POLICY = {"2016-01":7.5,"2017-01":8.0,"2018-06":17.75,"2018-09":24,"2019-07":19.75,"2019-09":16.5,
          "2019-10":14,"2019-12":12,"2020-01":11.25,"2020-02":10.75,"2020-03":9.75,"2020-04":8.75,
          "2020-05":8.25,"2020-09":10.25,"2020-11":15,"2020-12":17,"2021-03":19,"2021-09":18,
          "2021-10":16,"2021-11":15,"2021-12":14,"2022-08":13,"2022-09":12,"2022-10":10.5,"2022-11":9,
          "2023-02":8.5,"2023-06":15,"2023-07":17.5,"2023-08":25,"2023-09":30,"2023-10":35,"2023-11":40,
          "2023-12":42.5,"2024-01":45,"2024-03":50,"2024-12":47.5,"2025-01":45,"2025-03":42.5,
          "2025-04":46,"2025-07":43,"2025-09":40.5,"2025-10":39.5,"2025-12":38,"2026-01":37}

def load(market, min_rows=200):
    px = {}
    for f in sorted((DATA / market).glob("*.csv")):
        df = pd.read_csv(f, index_col=0, parse_dates=True)
        if len(df) >= min_rows:
            px[f.stem] = df
    return px

def panel(px, field="close"):
    return pd.DataFrame({k: v[field] for k, v in px.items()}).sort_index()

def cash_rate_daily(index, annual=None):
    """TRY nakit getirisi (para piyasası fonu ~ politika faizi * 0.9 net)."""
    s = pd.Series(np.nan, index=index)
    for k, v in sorted(POLICY.items()):
        s[s.index >= pd.Timestamp(k + "-01")] = v
    s = s.ffill().fillna(10.0) * 0.9 / 100  # ~%10 stopaj/fon gideri sonrası
    return (1 + s) ** (1 / 365) - 1

def backtest(weights, close, fee=0.001, cash_ret=None, lev_cost=0.0, tax=0.0):
    """weights: tarih x varlık (t kapanışında hedef). Kalan kısım nakitte durur."""
    weights = weights.reindex(close.index).fillna(0.0)
    rets = close.pct_change(fill_method=None).fillna(0.0)
    w = weights.shift(1).fillna(0.0)
    gross = (w * rets).sum(axis=1)
    invested = w.sum(axis=1)
    cash_w = (1 - invested)
    if cash_ret is not None:
        gross += cash_w.clip(lower=0) * cash_ret.reindex(close.index).fillna(0)
    # kaldıraç (>1) finansman maliyeti, günlük
    gross -= (invested - 1).clip(lower=0) * lev_cost / 365
    # ağırlıkların fiyatla kayması sonrası gerçekleşen ciro
    drift = w * (1 + rets)
    drift = drift.div((1 + gross).replace(0, np.nan), axis=0).fillna(0)
    turnover = (weights - drift).abs().sum(axis=1)
    net = gross - turnover * fee
    eq = (1 + net).cumprod()
    if tax > 0:
        eq = apply_tax(eq, tax)
    return eq

def apply_tax(eq, tax):
    """Her takvim yılı sonunda o yılın pozitif kârından vergi düş."""
    out, level, prev_end = [], 1.0, 1.0
    yr = eq.index.year
    r = eq.pct_change().fillna(eq.iloc[0] - 1)
    vals = []
    for y in sorted(set(yr)):
        rr = r[yr == y]
        path = level * (1 + rr).cumprod()
        gain = path.iloc[-1] - level
        if gain > 0:
            path.iloc[-1] -= gain * tax
        vals.append(path)
        level = path.iloc[-1]
    return pd.concat(vals)

def stats(eq, start=None, end=None):
    e = eq.loc[start:end]
    if len(e) < 20:
        return {}
    e = e / e.iloc[0]
    m = e.resample("ME").last()
    m = pd.concat([pd.Series([1.0], index=[e.index[0]]), m])
    mr = m.pct_change().dropna()
    months = len(mr)
    total = e.iloc[-1] - 1
    geo = (1 + total) ** (1 / max(months, 1)) - 1
    dd = (e / e.cummax() - 1).min()
    return {"toplam_%": round(total * 100, 1), "aylik_geo_%": round(geo * 100, 2),
            "aylar": months, ">=%10_ay": int((mr >= 0.10).sum()), "negatif_ay": int((mr < 0).sum()),
            "en_kotu_ay_%": round(mr.min() * 100, 1), "maxDD_%": round(dd * 100, 1)}
