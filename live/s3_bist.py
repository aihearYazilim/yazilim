"""3) BIST-C: c_all = z(mom252_21) + z(h52) + z(lowvol60) + 0.5 z(rev5), en iyi 20, eşit ağırlık, 21 işlem gününde bir,
rejim ew20 (likit evren eşit ağırlıklı endeks > SMA20; değilse gecelik mevduat), lag 1.
research/bist_all/{download,common,signals}.py ve combo/sleeves_v2.CFG ile birebir aynı hesap (yalnızca gerekli sinyaller kopyalandı).
Likidite filtresi: 20g medyan TL ciro >= max(5e6, 100*1e6/20) = 5 milyon TL ve >= 120 işlem günü geçmiş.
Z-skorları (araştırmadaki gibi) TÜM evren üzerinden hesaplanır, uygunluk filtresi sonra uygulanır.
"""
import re, html, time, pathlib, concurrent.futures as cf
import numpy as np, pandas as pd
import config as C, fetch as FX

ROOT = pathlib.Path(__file__).resolve().parents[1]
UNI = FX.CACHE / "bist_universe.csv"


def universe():
    if UNI.exists(): return pd.read_csv(UNI)
    src = ROOT / "data/bist_all/_universe.csv"            # araştırmadaki liste (varsa)
    if src.exists():
        df = pd.read_csv(src)
    else:   # research/bist_all/download.universe ile aynı kaynak
        h = FX.get("https://www.isyatirim.com.tr/tr-tr/analiz/hisse/Sayfalar/Temel-Degerler-Ve-Oranlar.aspx").decode("utf-8", "ignore")
        rows = re.findall(r'hisse=([A-Z0-9]+)">\1</a></td><td>([^<]*)</td><td>([^<]*)</td>', h)
        df = pd.DataFrame(rows, columns=["ticker", "name", "sector"]).drop_duplicates("ticker")
        for c in ("name", "sector"): df[c] = df[c].map(lambda s: html.unescape(s).strip())
    df.to_csv(UNI, index=False)
    return df


def download(tickers, workers=8):
    def one(t):
        try:
            j = FX.yahoo_chart(f"{t}.IS", "2y", max_age_h=10, sub="bist")
            return t, FX.yahoo_bist_df(j)
        except Exception:
            return t, None
    out = {}
    with cf.ThreadPoolExecutor(workers) as ex:
        for t, df in ex.map(one, tickers):
            if df is not None and len(df) >= 60: out[t] = df
    return out


def panel(D, uni, now_ist):
    """research/bist_all/common.load_all ile aynı temizlik."""
    xu = D["XU100"]["close"]
    days = xu.dropna().index
    # seans kapanmadan (18:30 İstanbul) bugünün barı kullanılmaz
    if len(days) and days[-1] >= pd.Timestamp(now_ist.date()) and now_ist.hour * 60 + now_ist.minute < 18 * 60 + 30:
        days = days[:-1]
    stocks = [t for t in D if t not in ("XU100",)]
    col = lambda k: pd.DataFrame({t: D[t][k] for t in stocks}).reindex(days)
    raw = col("close"); vol = col("volume").fillna(0)
    adj = pd.DataFrame({t: D[t]["adj_ratio"] if "adj_ratio" in D[t] else pd.Series(1.0, D[t].index) for t in stocks}).reindex(days).ffill()
    traded = raw.notna() & (vol > 0); rawf = raw.ffill()
    rret = rawf.pct_change(fill_method=None)
    lim = 0.10
    bad = rret.abs().gt(lim + 0.012)
    aret = (rawf * adj).pct_change(fill_method=None).where(~bad, 0.0).fillna(0.0).clip(-0.25, 0.25)
    px = (1 + aret).cumprod().where(rawf.notna())
    turn = (raw * vol).where(traded, 0.0)
    lim_up = rret.ge(lim - 0.005) & ~bad
    return dict(days=days, px=px, ret=aret, turn=turn, traded=traded, raw=rawf, lim_up=lim_up)


def _z(df):
    m = df.mean(axis=1); s = df.std(axis=1)
    return df.sub(m, axis=0).div(s.replace(0, np.nan), axis=0).clip(-3, 3)


def score_regime(P):
    px, ret, turn = P["px"], P["ret"], P["turn"]
    mom = px.shift(21) / px.shift(252) - 1
    h52 = px / px.rolling(252, min_periods=200).max()
    lowvol = -ret.rolling(60, min_periods=40).std()
    rev5 = -(px / px.shift(5) - 1)
    sc = _z(mom) + _z(h52) + _z(lowvol) + 0.5 * _z(rev5)
    liq = turn.rolling(20, min_periods=10).median() >= 5e6
    ew = (1 + ret.where(liq.shift(1, fill_value=False)).mean(axis=1).fillna(0)).cumprod()
    sma = ew.rolling(20).mean()
    B = C.BIST
    need = max(B["min_turn"], 100 * B["research_capital"] / B["top"])
    elig = (turn.rolling(20, min_periods=10).median() >= need) & (P["traded"].cumsum() >= B["min_hist"])
    return sc, sc.where(elig), ew, sma, elig


def calendar_phase(now_ist):
    """yeniden dengeleme takvimi: araştırmada t0 = 2018-06-01 ve her 21 'gün' (common.simulate).  Araştırma takviminde
    Yahoo kaynaklı birkaç tatil-günü artığı olduğundan faz, araştırmanın kendi son dengeleme gününe (config.BIST
    ['anchor']) sabitlenir ve sonrası gerçek XU100 işlem günleriyle sayılır.
    Döner: (son tam seans, bir sonraki dengelemeye kalan seans sayısı; 1 = bir sonraki seans)."""
    j = FX.yahoo_chart("XU100.IS", "2y", max_age_h=10, sub="bist")
    d = FX.yahoo_bist_df(j).index
    if len(d) and d[-1] >= pd.Timestamp(now_ist.date()) and now_ist.hour * 60 + now_ist.minute < 18 * 60 + 30:
        d = d[:-1]
    n = int((d > pd.Timestamp(C.BIST["anchor"])).sum())
    return d, C.BIST["rebalance"] - n % C.BIST["rebalance"]


def run(now_ist):
    uni = universe()
    tick = list(uni.ticker) + ["XU100"]
    t = time.time(); D = download(tick)
    D["XU100"] = FX.yahoo_bist_df(FX.yahoo_chart("XU100.IS", "2y", max_age_h=10, sub="bist"))
    P = panel(D, uni, now_ist)
    sc_all, sc, ew, sma, elig = score_regime(P)
    last = P["days"][-1]
    row = sc.loc[last].dropna().sort_values(ascending=False)
    top = row.index[:C.BIST["top"]]
    reg_now = bool(ew.loc[last] > sma.loc[last]); reg_prev = bool(ew.iloc[-2] > sma.iloc[-2])
    cal, days_to = calendar_phase(now_ist)
    nm = uni.set_index("ticker")
    tab = pd.DataFrame({"skor": row.loc[top].round(3), "fiyat": P["raw"].loc[last, top].round(2),
                        "ad": nm.name.reindex(top).str[:26], "sektör": nm.sector.reindex(top).str[:22],
                        "tavan": P["lim_up"].loc[last, top]})
    return dict(last=last, top=tab, reg=reg_now, reg_prev=reg_prev, ew=float(ew.loc[last]), sma=float(sma.loc[last]),
                n_dl=len(D), n_elig=int(elig.loc[last].sum()), days_to_reb=days_to, cal_last=cal[-1], secs=time.time() - t)


def report(R, capital=None, title=""):
    reb_now = R["days_to_reb"] == 1 or R["reg"] != R["reg_prev"]
    L = [f"--- 3) BIST-C {title}" + (f"(kol {capital:,.0f} TL) " if capital else "") + "---",
         f"  Veri: {R['n_dl']} sembol indirildi, son tam seans {R['last']:%Y-%m-%d}; likit+uygun hisse {R['n_elig']}",
         f"  Rejim ew20: EW endeks {R['ew']:.4f} vs SMA20 {R['sma']:.4f} -> {'AÇIK (hisse)' if R['reg'] else 'KAPALI (gecelik mevduat)'}"
         + (" [rejim bugün değişti -> sonraki seans kapanışında yeniden dengele]" if R["reg"] != R["reg_prev"] else ""),
         f"  21 günlük takvim: sonraki yeniden dengeleme son seanstan sonraki {R['days_to_reb']}. seansın kapanışında"
         f" (≈{(R['last'] + pd.offsets.BDay(R['days_to_reb'])):%Y-%m-%d}, resmi tatiller hariç değil)"
         + (" = SONRAKİ SEANS" if R["days_to_reb"] == 1 else "")
         + "  (lag 1: aşağıdaki liste son seans skorudur, işlem bir sonraki seans kapanışında)"]
    if not R["reg"]:
        L.append("  Rejim kapalı: tüm BIST-C kolu gecelik mevduatta; liste yalnızca bilgi amaçlı.")
    t = R["top"].copy()
    if capital and R["reg"]:
        per = capital / C.BIST["top"]
        t["TL"] = round(per); t["lot"] = np.floor(per / t.fiyat).astype(int)
    t["tavan"] = t.tavan.map({True: "TAVAN-alınamaz", False: ""})
    L.append("  " + t.to_string().replace("\n", "\n  "))
    if not reb_now:
        L.append("  Not: dengeleme günü değil -> mevcut portföy korunur; liste yalnızca izleme amaçlı.")
    return "\n".join(L)
