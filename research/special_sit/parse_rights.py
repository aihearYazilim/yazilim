"""Bedelli sermaye artırımı: rüçhan kullanım fiyatı (K), kullanım başlangıç/bitiş, oran -> rights_events.csv"""
import re, os, pandas as pd, pathlib
H = pathlib.Path(__file__).parent
def num(s): return float(s.replace(".", "").replace(",", "."))
b = pd.read_csv(H/"raw/rights_disc_list.csv")
rows = []
for _, r in b.iterrows():
    p = H/f"raw/disc/{r.disclosureIndex}.txt"
    if not p.exists(): continue
    t = p.read_text()
    m1 = re.search(r"Rüçhan Hakkı Kullanımı Başlangıç Tarihi (\d\d\.\d\d\.\d{4})", t); m2 = re.search(r"Rüçhan Hakkı Kullanımı Bitiş Tarihi (\d\d\.\d\d\.\d{4})", t)
    if not m1: continue
    for g in re.finditer(r"([A-Z0-9]{4,6}), (TR[A-Z0-9]{10}) ([\d.,]+) ([\d.,]+) ([\d.,]+) ([\d.,]+) ", t):
        try:
            rows.append({"ticker": g.group(1), "ts": pd.to_datetime(r.publishDate, dayfirst=True), "start": pd.to_datetime(m1.group(1), dayfirst=True),
                         "end": pd.to_datetime(m2.group(1), dayfirst=True) if m2 else pd.NaT, "ratio%": num(g.group(5)), "K": num(g.group(6)), "idx": r.disclosureIndex})
        except ValueError: pass
R = pd.DataFrame(rows).sort_values("ts")
R = R.groupby(["ticker", "start"]).agg(first_ts=("ts", "min"), end=("end", "first"), K=("K", "first"), K_last=("K", "last"), ratio=("ratio%", "first")).reset_index()
R = R[R.K < 1000]  # ayrıştırma hatası (tutar okunmuş)
R.to_csv(H/"rights_events.csv", index=False)
print(len(R)); print(R.K.describe()); print(R.groupby(R.start.dt.year).size())
