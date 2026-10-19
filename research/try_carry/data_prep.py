"""Veri hazırlığı: Yahoo USDTRY=X günlük OHLC (2005+), TL efektif fonlama faizi, Fed faizi, TÜFE yıllık.
Çıktı: data/panel.csv (iş günü indeksli)."""
import json, pathlib, sys, numpy as np, pandas as pd
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "src"))
import engine  # noqa

# TL efektif fonlama / politika faizi (yıllık %), ay başından geçerli.
# 2005-2010: TCMB O/N borçlanma (politika) faizi; 2010-05+: 1 hafta repo, ancak 2011-2018 koridor döneminde
# efektif ortalama fonlama maliyeti (AOFM) yaklaşık değerleri kullanılır (forward primini bu belirler).
# 2016+ engine.POLICY (araştırmadaki ortak tablo) ile aynı, 2017-2018 AOFM düzeltmesi hariç.
TRY_PRE = {"2005-01": 18.0, "2005-03": 17.0, "2005-04": 16.0, "2005-06": 14.5, "2005-09": 14.0, "2005-12": 13.5,
           "2006-04": 13.25, "2006-06": 15.25, "2006-07": 17.5, "2007-09": 17.25, "2007-10": 16.75, "2007-11": 16.25,
           "2007-12": 15.75, "2008-01": 15.5, "2008-02": 15.25, "2008-05": 15.75, "2008-06": 16.25, "2008-07": 16.75,
           "2008-11": 16.25, "2008-12": 15.0, "2009-01": 13.0, "2009-02": 11.5, "2009-03": 10.5, "2009-04": 9.75,
           "2009-05": 9.25, "2009-06": 8.75, "2009-07": 8.25, "2009-08": 7.75, "2009-09": 7.25, "2009-10": 6.75,
           "2009-11": 6.5, "2010-05": 7.0, "2010-12": 6.5, "2011-01": 6.25, "2011-08": 5.75, "2011-10": 9.5,
           "2011-11": 10.5, "2012-03": 9.0, "2012-06": 7.0, "2012-09": 5.75, "2013-01": 5.5, "2013-04": 5.0,
           "2013-05": 4.6, "2013-07": 6.0, "2013-08": 7.0, "2014-01": 9.0, "2014-02": 10.0, "2014-05": 9.5,
           "2014-06": 8.75, "2014-07": 8.4, "2015-01": 7.9, "2015-03": 8.2, "2015-08": 8.8, "2016-01": 8.8,
           "2016-06": 8.6, "2016-10": 8.3, "2017-01": 8.5, "2017-02": 9.9, "2017-03": 11.0, "2017-04": 11.9,
           "2017-11": 12.25, "2017-12": 12.75, "2018-05": 15.0, "2018-06": 17.75}
POLICY = dict(TRY_PRE)
for k, v in engine.POLICY.items():
    if k >= "2018-09":
        POLICY[k] = v

# TÜFE yıllık % (TÜİK). FRED CPALTT01TRM659N 2025-04'e kadar; sonrası elle (TÜİK açıklamaları, haber kaynakları;
# 2026-05 = %32.61 DİSK bülteninden, teyitsiz).
CPI_TAIL = {"2025-05": 35.41, "2025-06": 35.05, "2025-07": 33.52, "2025-08": 32.95, "2025-09": 33.29,
            "2025-10": 32.87, "2025-11": 31.07, "2025-12": 30.89, "2026-01": 30.65, "2026-02": 31.53,
            "2026-03": 30.87, "2026-04": 32.37, "2026-05": 32.61, "2026-06": 32.11, "2026-07": 31.75,
            "2026-08": 31.51, "2026-09": 29.73}


def step(table, idx):
    s = pd.Series(np.nan, index=idx)
    for k, v in sorted(table.items()):
        s[s.index >= pd.Timestamp(k + "-01")] = v
    return s.ffill()


def build():
    j = json.load(open(HERE / "data/raw_USDTRY.json"))["chart"]["result"][0]
    q = j["indicators"]["quote"][0]
    ts = pd.to_datetime(j["timestamp"], unit="s") + pd.Timedelta(hours=2)
    df = pd.DataFrame({k: q[k] for k in ["open", "high", "low", "close"]}, index=ts.normalize())
    df = df[~df.index.duplicated(keep="last")].dropna()
    # Yahoo FX günlük barı: 2011+ 'close' bayat (≈open). Gün sonu işareti = bir SONRAKİ barın open'ı
    # (2005-2010'da close ile aynı). Bar D'nin high'ı M[D-1] -> M[D] aralığını kapsar.
    df["mark"] = df["open"].shift(-1).fillna(df["close"])
    # hafta sonu barlarını sonraki pazartesiye kat (VİOP kapalı; risk pazartesi realize olur)
    bd = df.index.where(df.index.dayofweek < 5, df.index + pd.offsets.BDay(1))
    g = df.groupby(bd)
    df = pd.DataFrame({"open": g["open"].first(), "high_raw": g["high"].max(), "low": g["low"].min(),
                       "close": g["mark"].last()})
    prev = df["close"].shift(1).fillna(df["open"])
    lo, hi = np.maximum(prev, df["close"]), None
    df["high"] = np.minimum(np.maximum(df["high_raw"], lo), lo * 1.25)   # bariz hata sınırı
    idx = pd.bdate_range(df.index[0], "2026-10-16")
    df = df.reindex(idx).ffill()
    fred = pd.read_csv(HERE / "data/fred_FEDFUNDS.csv", index_col=0, parse_dates=True).iloc[:, 0]
    fed = fred.reindex(idx.union(fred.index)).ffill().reindex(idx)
    pol = step(POLICY, idx)
    cpi = pd.read_csv(HERE / "data/fred_CPALTT01TRM659N.csv", index_col=0, parse_dates=True).iloc[:, 0].dropna()
    cpi = pd.concat([cpi, pd.Series({pd.Timestamp(k + "-01"): v for k, v in CPI_TAIL.items()})])
    cpi = cpi[~cpi.index.duplicated(keep="first")].sort_index()
    # Yayın gecikmesi: ay m TÜFE'si m+1'in 3'ünde açıklanır -> m+1 ayının 5'inden itibaren kullan
    cpi_avail = cpi.copy(); cpi_avail.index = cpi_avail.index + pd.DateOffset(months=1) + pd.Timedelta(days=4)
    cpi_d = cpi_avail.reindex(idx.union(cpi_avail.index)).ffill().reindex(idx)
    df["pol"] = pol; df["fed"] = fed; df["cpi"] = cpi_d
    df.to_csv(HERE / "data/panel.csv")
    return df


if __name__ == "__main__":
    d = build()
    print(d.head()); print(d.tail())
    hr = d["high"] / np.maximum(d["close"], d["close"].shift(1)) - 1
    print("En büyük high sapmaları:\n", hr.sort_values().tail(25))
    # mevcut veriyle karşılaştır
    b = pd.read_csv(HERE.parents[1] / "data/bist/USDTRY.csv", index_col=0, parse_dates=True)["close"]
    c = pd.concat([d["close"], b], axis=1, keys=["yh", "bist"]).dropna()
    print("max |fark| %:", (c.yh / c.bist - 1).abs().max() * 100, "n", len(c))
