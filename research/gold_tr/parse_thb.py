"""raw/thb/*.csv -> raw/s1.pkl (ALTIN.S1 daily: close, bid, ask, vwap, value) and raw/etf_gold.pkl (gold ETFs, info only)."""
import glob, pandas as pd
from common import H
rows = []
for f in sorted(glob.glob(str(H/"raw/thb/*.csv"))):
    for ln in open(f, encoding="utf8", errors="replace").read().splitlines()[1:]:
        p = ln.split(";")
        if len(p) > 29: rows.append(p[:30])
df = pd.DataFrame(rows)
df = df.rename(columns={0:"date",1:"code",2:"name",7:"typ",16:"prev",17:"open",19:"low",20:"high",21:"close",24:"bid",25:"ask",26:"vwap",27:"value",28:"vol"})
df = df[["date","code","name","typ","prev","open","low","high","close","bid","ask","vwap","value","vol"]]
for c in ["prev","open","low","high","close","bid","ask","vwap","value","vol"]: df[c] = pd.to_numeric(df[c].str.replace(",", "."), errors="coerce")
df["date"] = pd.to_datetime(df.date, errors="coerce")
s1 = df[df.code=="ALTIN.S1"].drop_duplicates("date").set_index("date").sort_index()
s1.to_pickle(H/"raw/s1.pkl"); df[df.typ=="MSPOTETF"].to_pickle(H/"raw/etf.pkl")
print(s1.index.min(), s1.index.max(), len(s1)); print(s1.value.resample("YE").median())
print(df[df.typ.isin(["MSPOTEMS","MSPOTGMS"])].groupby(["code","name"]).date.agg(["min","max","count"]))
