"""raw/thb/*.csv.gz -> panel.parquet (tüm pay + rüçhan hakkı kuponları, hayatta kalma yanlılığı yok)."""
import glob, gzip, io, pathlib, pandas as pd
H = pathlib.Path(__file__).parent
cols = {"TARIH": "date", "ISLEM  KODU": "code", "ENSTRUMAN TIPI": "itype", "PAZAR": "mkt", "OZSERMAYE HALI": "ca",
        "ONCEKI KAPANIS FIYATI": "pc", "ACILIS FIYATI": "o", "EN DUSUK FIYAT": "lo", "EN YUKSEK FIYAT": "hi",
        "KAPANIS FIYATI": "c", "A.O.F": "v", "TOPLAM ISLEM HACMI": "val", "REFERANS FIYAT": "ref", "GECICI DURDURMA": "halt"}
out = []
for f in sorted(glob.glob(str(H/"raw/thb/*.csv.gz"))):
    s = gzip.open(f, "rt", encoding="utf8").read().splitlines()
    hdr = s[0].split(";"); body = "\n".join(s[2:])
    d = pd.read_csv(io.StringIO(body), sep=";", header=None, names=hdr + [f"x{i}" for i in range(80 - len(hdr))], dtype=str, index_col=False)
    d = d[[c for c in cols if c in d.columns]].rename(columns=cols)
    d["date"] = pathlib.Path(f).name[:8]; out.append(d)
P = pd.concat(out, ignore_index=True)
P["date"] = pd.to_datetime(P.date, format="%Y%m%d")
missing = [c for c in cols.values() if c not in P.columns]; print("missing", missing)
for c in ["pc", "o", "lo", "hi", "c", "v", "val", "ref"]:
    P[c] = pd.to_numeric(P[c].str.replace(",", "."), errors="coerce")
P["sym"] = P.code.str.split(".").str[0]; P["suf"] = P.code.str.split(".").str[1]
P.to_pickle(H/"panel.pkl")
print(P.shape, P.date.min(), P.date.max(), P.suf.value_counts().to_dict())
