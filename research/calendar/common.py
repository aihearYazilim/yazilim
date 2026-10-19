"""Ortak: endeks verisi (2005+), nakit (PPF) getirisi, takvim özellikleri, likit sepet getirileri."""
import pathlib, sys, numpy as np, pandas as pd
H = pathlib.Path(__file__).parent
ROOT = H.parents[1]
sys.path.insert(0, str(ROOT / "src"))
import engine
from engine import stats

IS_START = pd.Timestamp("2010-01-01"); OOS_START = pd.Timestamp("2025-10-17"); OOS_END = pd.Timestamp("2026-10-16")
FUT_COST = 0.0003 + 0.0002          # VİOP XU030 vadeli, taraf başı
STK_COST = 0.0014 + 0.0010          # hisse, taraf başı

# 2016 öncesi politika/PPF faizi engine'de yok -> yaklaşık ortalama fonlama faizi (TCMB ağırlıklı ort. fonlama, yıllık %)
PRE2016 = {"2005-01": 15.0, "2006-01": 13.5, "2006-07": 17.0, "2007-09": 16.5, "2008-06": 16.5, "2008-12": 15.0,
           "2009-03": 11.0, "2009-07": 8.5, "2010-01": 7.0, "2011-10": 9.0, "2012-06": 7.0, "2013-01": 5.5,
           "2013-08": 7.0, "2014-01": 10.0, "2014-06": 8.5, "2015-01": 8.5}
engine.POLICY = {**PRE2016, **engine.POLICY}

def load_index(sym):
    y = pd.read_csv(H / f"raw/{sym}.csv", index_col=0, parse_dates=True)
    b = pd.read_csv(ROOT / f"data/bist/{sym}.csv", index_col=0, parse_dates=True)
    b = b[b.index > y.index[-1]]
    d = pd.concat([y, b[y.columns]]).sort_index()
    return d.loc["2005-01-01":OOS_END]

def cash_per_day(idx):
    """PPF getirisi, iki işlem günü arası takvim günü sayısı kadar bileşik (gün t: t-1 kapanış -> t kapanış)."""
    cal = pd.date_range(idx[0] - pd.Timedelta(days=10), idx[-1])
    rd = engine.cash_rate_daily(cal)
    g = np.log1p(rd).cumsum()
    g = g.reindex(idx)
    out = np.expm1(g.diff())
    out.iloc[0] = rd.iloc[-1] * 0 + rd.loc[idx[0]]
    return out

def market():
    x30 = load_index("XU030"); x100 = load_index("XU100")
    idx = x30.index.intersection(x100.index)
    x30, x100 = x30.loc[idx], x100.loc[idx]
    df = pd.DataFrame(index=idx)
    for nm, x in [("x30", x30), ("x100", x100)]:
        df[nm] = x.close.pct_change()
        df[nm + "_on"] = x.open / x.close.shift() - 1      # gece (close->open)
        df[nm + "_id"] = x.close / x.open - 1              # gün içi (open->close)
    df["cash"] = cash_per_day(idx)
    return df.iloc[1:]

# ---------------- takvim -----------------
RAMAZAN = ["2005-11-03","2006-10-23","2007-10-12","2008-09-30","2009-09-20","2010-09-09","2011-08-30","2012-08-19",
           "2013-08-08","2014-07-28","2015-07-17","2016-07-05","2017-06-25","2018-06-15","2019-06-04","2020-05-24",
           "2021-05-13","2022-05-02","2023-04-21","2024-04-10","2025-03-30","2026-03-20"]
KURBAN = ["2005-01-20","2006-01-10","2006-12-31","2007-12-20","2008-12-08","2009-11-27","2010-11-16","2011-11-06",
          "2012-10-25","2013-10-15","2014-10-04","2015-09-24","2016-09-12","2017-09-01","2018-08-21","2019-08-11",
          "2020-07-31","2021-07-20","2022-07-09","2023-06-28","2024-06-16","2025-06-06","2026-05-27"]
def holidays(idx):
    """İşlem görmeyen hafta içi günler -> tür. Bayram = Ramazan/Kurban 1. gününden -2..+9 gün içinde (uzatmalar dahil);
    sabit tarihli resmi tatiller; geri kalan eksik günler 'gap' (Yahoo veri boşluğu, ör. 25 Aralık) -> tatil sayılmaz."""
    wd = pd.bdate_range(idx[0], idx[-1])
    miss = wd.difference(idx)
    fixed = {(1, 1): "newyear", (4, 23): "nat", (5, 1): "nat", (5, 19): "nat", (8, 30): "nat",
             (10, 29): "nat", (10, 28): "nat"}
    bay = [(pd.Timestamp(d), "ramazan") for d in RAMAZAN] + [(pd.Timestamp(d), "kurban") for d in KURBAN]
    out = {}
    for d in miss:
        t = fixed.get((d.month, d.day))
        if (d.month, d.day) == (7, 15) and d.year >= 2017: t = "nat"
        for b, nm in bay:
            if -2 <= (d - b).days <= 9: t = nm
        if t: out[d] = t
    return pd.Series(out)

def features(idx, hol=None):
    """Her işlem günü d için özellikler. Pozisyon d-1 kapanışında açılır, d kapanışında ölçülür; hepsi önceden bilinir."""
    if hol is None: hol = holidays(idx)
    s = pd.Series(idx, index=idx)
    F = pd.DataFrame(index=idx)
    F["dow"] = idx.dayofweek
    F["month"] = idx.month
    ym = idx.to_period("M")
    g = s.groupby(ym)
    F["tdm"] = g.cumcount() + 1                        # ayın kaçıncı işlem günü (1..)
    F["tdm_rev"] = g.cumcount(ascending=False) + 1     # ay sonuna kalan (1 = son işlem günü)
    # tatil: d'den sonraki işlem günü ile d arasında hafta içi tatil var mı?
    nxt = pd.Series(idx[1:].tolist() + [pd.NaT], index=idx)
    prv = pd.Series([pd.NaT] + idx[:-1].tolist(), index=idx)
    def gap_types(a, b):
        if pd.isna(a) or pd.isna(b): return ""
        h = hol[(hol.index > a) & (hol.index < b)]
        return ",".join(sorted(set(h.values)))  # 'kurban','ramazan','nat','newyear' 
    nt = [gap_types(d, n) for d, n in zip(idx, nxt)]
    pt = [gap_types(p, d) for p, d in zip(prv, idx)]
    F["pre_hol"] = nt   # d bir tatilden hemen önceki işlem günü
    F["post_hol"] = pt  # d tatilden hemen sonraki işlem günü
    F["pre_hol2"] = pd.Series(nt, index=idx).shift(-1).fillna("").values  # tatilden 2 işlem günü önce
    F["pre_hol3"] = pd.Series(nt, index=idx).shift(-2).fillna("").values
    # çeyrek / yıl
    F["q_end"] = (F.tdm_rev == 1) & idx.month.isin([3, 6, 9, 12])
    F["q_first"] = (F.tdm == 1) & idx.month.isin([1, 4, 7, 10])
    F["y_end"] = (F.tdm_rev == 1) & (idx.month == 12)
    F["msci"] = (F.tdm_rev == 1) & idx.month.isin([2, 5, 8, 11])           # MSCI yeniden dengeleme ~ ay son iş günü
    F["expiry"] = (F.tdm_rev == 1) & idx.month.isin([2, 4, 6, 8, 10, 12])  # VİOP endeks vadesi (çift aylar son iş günü)
    # TCMB PPK
    mpc = pd.to_datetime(pd.read_csv(H / "mpc_dates.csv").mpc)
    pos = idx.searchsorted(mpc)
    m_on = np.zeros(len(idx), bool); m_on[pos[pos < len(idx)]] = True
    F["mpc"] = m_on
    F["mpc_pre1"] = np.roll(m_on, -1); F["mpc_pre2"] = np.roll(m_on, -2); F["mpc_post1"] = np.roll(m_on, 1)
    # TÜFE: ayın 3'ü (veya sonraki ilk işlem günü)
    cpi = pd.to_datetime([f"{p.year}-{p.month:02d}-03" for p in pd.period_range(idx[0], idx[-1], freq="M")])
    pos = idx.searchsorted(cpi)
    c_on = np.zeros(len(idx), bool); c_on[pos[pos < len(idx)]] = True
    F["cpi"] = c_on; F["cpi_pre1"] = np.roll(c_on, -1)
    return F

# --------------- likit sepetler ----------------
def basket_bulletin(n=50, look=60):
    """Bülten (2019+, kote olmayanlar dahil): her gün önceki 60 günlük ort. işlem hacmine göre en likit n pay, eşit ağırlık.
    Getiri: c/pc-1 (|r|>11% -> sermaye artırımı vb., atılır), gece o/pc-1, gün içi c/o-1."""
    P = pd.read_pickle(ROOT / "research/special_sit/panel.pkl")
    P = P[(P.suf == "E") & (P.itype == "MSPOTEQT") & (P.c > 0) & (P.pc > 0)]
    P = P.drop_duplicates(["date", "sym"])
    C = P.pivot(index="date", columns="sym", values="c"); PC = P.pivot(index="date", columns="sym", values="pc")
    O = P.pivot(index="date", columns="sym", values="o"); V = P.pivot(index="date", columns="sym", values="val")
    r = C / PC - 1; on = O / PC - 1; idr = C / O - 1
    bad = r.abs() > 0.11
    r = r.mask(bad); on = on.mask(bad | (on.abs() > 0.11) | (O <= 0)); idr = idr.mask(bad | (O <= 0))
    liq = V.rolling(look, min_periods=20).mean().shift(1)
    rk = liq.rank(axis=1, ascending=False)
    univ = rk <= n
    out = pd.DataFrame({"bk": r.where(univ).mean(axis=1), "bk_on": on.where(univ).mean(axis=1),
                        "bk_id": idr.where(univ).mean(axis=1)})
    return out.loc[out.index >= "2019-04-01"]
