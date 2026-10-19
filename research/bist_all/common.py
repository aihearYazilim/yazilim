"""Tüm-BIST araştırma altyapısı: veri temizliği, sinyaller, tavan/taban kısıtlı backtest.

Zaman kuralı: skor[t] yalnızca t kapanışı ve öncesini kullanır. Pozisyon t kapanışında
(kapanış seansı) alınır, getiri t+1'den itibaren işler. lag=1 ise skor[t-1] ile t'de işlem yapılır
(daha muhafazakâr). Tavanda (ham kapanış getirisi >= limit-0.5pp) kapanan hisse ALINAMAZ,
tabanda kapanan hisse SATILAMAZ. Komisyon+kayma %0.14 işlem değeri üzerinden.
Boştaki TL engine.cash_rate_daily ile para piyasası getirisi kazanır.
"""
import sys, pathlib, numpy as np, pandas as pd
ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))
from engine import cash_rate_daily, stats  # noqa

DATA = ROOT / "data" / "bist_all"
FEE = 0.0014
CAPITAL = 1_000_000          # TL, likidite kısıtı için (pozisyon <= günlük cironun %1'i)
OOS_START = pd.Timestamp("2025-10-17")
OOS_END = pd.Timestamp("2026-10-16")
IS_START = pd.Timestamp("2019-01-01")
LIMIT_CHANGE = pd.Timestamp("2020-03-09")   # BIST fiyat marjı: öncesi ±%20, sonrası ±%10

_cache = {}

def load_all(start="2017-01-01"):
    if "P" in _cache:
        return _cache["P"]
    uni = pd.read_csv(DATA / "_universe.csv")
    C, O, H, L, V, A = {}, {}, {}, {}, {}, {}
    for f in sorted(DATA.glob("*.csv")):
        if f.stem.startswith("_"):
            continue
        df = pd.read_csv(f, index_col=0, parse_dates=True)
        df = df[df.index >= start]
        if len(df) < 60:
            continue
        C[f.stem] = df["close"]; O[f.stem] = df["open"]; H[f.stem] = df["high"]
        L[f.stem] = df["low"]; V[f.stem] = df["volume"]
        A[f.stem] = df["adj_ratio"] if "adj_ratio" in df else pd.Series(1.0, index=df.index)
    close = pd.DataFrame(C).sort_index()
    idx_cols = [c for c in ["XU100", "XU030", "XUTUM"] if c in close]
    xu = close[idx_cols].ffill()
    stocks = [c for c in close.columns if c not in idx_cols]
    # yalnızca BIST işlem günleri: XU100'ün olduğu günler
    days = xu["XU100"].dropna().index
    days = days[days <= OOS_END]
    raw = close.loc[days, stocks]
    vol = pd.DataFrame(V).loc[days, stocks].fillna(0)
    adj = pd.DataFrame(A).loc[days, stocks].ffill()
    traded = raw.notna() & (vol > 0)
    rawf = raw.ffill()
    rret = rawf.pct_change(fill_method=None)
    lim = pd.Series(np.where(days < LIMIT_CHANGE, 0.20, 0.10), index=days)
    # temizlik: fiyat marjını aşan hareketler = düzeltilmemiş bedelsiz/bölünme veya veri hatası -> 0
    bad = rret.abs().gt(lim + 0.012, axis=0)
    # temettü düzeltmeli getiri (adjclose oranındaki değişim)
    aret = (rawf * adj).pct_change(fill_method=None)
    aret = aret.where(~bad, 0.0).fillna(0.0).clip(-0.25, 0.25)
    px = (1 + aret).cumprod().where(rawf.notna())          # temiz düzeltilmiş fiyat endeksi
    turn = (raw * vol).where(traded, 0.0)                 # TL ciro
    lim_up = rret.ge(lim - 0.005, axis=0) & ~bad
    lim_dn = rret.le(-(lim - 0.005), axis=0) & ~bad
    sector = uni.set_index("ticker")["sector"].reindex(stocks).fillna("Diğer")
    P = dict(days=days, stocks=stocks, ret=aret, px=px, raw=rawf, turn=turn, traded=traded,
             lim_up=lim_up, lim_dn=lim_dn, xu=xu.loc[days], sector=sector, bad=bad,
             vol=vol, high=pd.DataFrame(H).loc[days, stocks], open=pd.DataFrame(O).loc[days, stocks],
             cash=cash_rate_daily(days))
    _cache["P"] = P
    return P


def simulate(P, score, top=10, rebalance=5, regime=None, lag=0, min_turn=5e6, min_hist=120,
             fee=FEE, start="2018-06-01", return_details=False, weight="equal", hold_rank_buffer=1.0):
    """Long-only top-N, eşit ağırlık. score: DataFrame (yüksek=iyi), NaN=uygun değil.
    regime: bool Series (True=yatırım). hold_rank_buffer>1: mevcut pozisyon top*buffer içindeyse tut.
    Döner: günlük net getiri Series (ve ayrıntılar)."""
    days = P["days"]
    ret = P["ret"].values
    up = P["lim_up"].values; dn = P["lim_dn"].values; tr = P["traded"].values
    cash = P["cash"].values
    med_turn = P["turn"].rolling(20, min_periods=10).median()
    hist = P["traded"].cumsum()
    need = max(min_turn, 100 * CAPITAL / top)
    elig = (med_turn >= need) & (hist >= min_hist)
    sc = score.where(elig)
    if lag:
        sc = sc.shift(lag)
    scv = sc.values
    reg = np.ones(len(days), bool) if regime is None else \
        regime.reindex(days).shift(lag).fillna(False).astype(bool).values
    t0 = days.searchsorted(pd.Timestamp(start))
    n = len(P["stocks"])
    w = np.zeros(n)          # mevcut ağırlıklar (özsermaye oranı)
    out = np.zeros(len(days)); tov = np.zeros(len(days))
    for t in range(t0, len(days)):
        # 1) t günü getirisi (t-1 kapanışında tutulan w ile)
        if t > t0:
            r = ret[t]
            cw = 1 - w.sum()
            g = (w * r).sum() + max(cw, 0) * cash[t]
            w = w * (1 + r) / (1 + g)
            out[t] = g
        # 2) t kapanışında yeniden dengeleme
        # rejim GÜNLÜK kontrol edilir: rejim değişince hemen yeniden dengele
        if (t - t0) % rebalance == 0 or (t > t0 and reg[t] != reg[t - 1]):
            tgt = np.zeros(n)
            if reg[t]:
                row = scv[t]
                ok = ~np.isnan(row)
                if ok.any():
                    idx = np.where(ok)[0]
                    order = idx[np.argsort(-row[idx], kind="stable")]
                    if hold_rank_buffer > 1:
                        keep_lim = int(round(top * hold_rank_buffer))
                        held = set(np.where(w > 1e-9)[0])
                        keep = [i for i in order[:keep_lim] if i in held][:top]
                        rest = [i for i in order if i not in keep][: top - len(keep)]
                        pick = np.array(keep + rest, dtype=int)
                    else:
                        pick = order[:top]
                    tgt[pick] = 1.0 / top
            # kısıtlar: tavandaki/işlem görmeyen alınamaz, tabandaki/işlem görmeyen satılamaz
            buy_block = up[t] | ~tr[t]
            sell_block = dn[t] | ~tr[t]
            new = tgt.copy()
            inc = new > w; dec = new < w
            new[inc & buy_block] = w[inc & buy_block]
            new[dec & sell_block] = w[dec & sell_block]
            if new.sum() > 1:
                # tutulmak zorunda olanlar sabit, kalan alımlar ölçeklenir
                fixed = (dec & sell_block) | ~inc
                free = ~fixed
                room = 1 - new[fixed].sum()
                if new[free].sum() > 0:
                    new[free] = new[free] * max(room, 0) / new[free].sum()
            t_o = np.abs(new - w).sum()
            tov[t] = t_o
            out[t] -= t_o * fee
            w = new
    s = pd.Series(out, index=days).iloc[t0:]
    if return_details:
        return s, pd.Series(tov, index=days).iloc[t0:]
    return s


def eq_from(r):
    return (1 + r).cumprod()


def summarize(r, tov=None):
    eq = eq_from(r)
    i = stats(eq, IS_START, OOS_START)
    o = stats(eq, OOS_START, OOS_END)
    d = {"IS_geo": i.get("aylik_geo_%"), "IS_dd": i.get("maxDD_%"), "OOS_geo": o.get("aylik_geo_%"),
         "OOS_dd": o.get("maxDD_%"), "OOS_worst": o.get("en_kotu_ay_%"), "OOS_tot": o.get("toplam_%")}
    if tov is not None:
        d["turn_yr"] = round(tov.loc[IS_START:].mean() * 252, 1)  # yıllık tek yön ciro (x özsermaye)
    return d
