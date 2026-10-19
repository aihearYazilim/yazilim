"""Parse cached VİOP daily bulletins (research/ssf_ls/raw/viop/f_*.csv, futures rows only) -> gold futures panel
raw/viop_gold.csv (F_XAUTRY*, F_XAUUSD*) and USDTRY futures raw/viop_usd.csv."""
import glob, pathlib, pandas as pd
H = pathlib.Path(__file__).resolve().parent
rows = []
for f in sorted(glob.glob(str(H.parent / "ssf_ls/raw/viop/f_*.csv"))):
    with open(f, encoding="cp1254", errors="replace") as fh:
        for i, ln in enumerate(fh):
            if i < 2: continue
            p = ln.rstrip("\n").split(";")
            if len(p) >= 22 and (p[1].startswith("F_XAU") or p[1].startswith("F_USDTRY")):
                rows.append(p[:22])
cols = ["date","code","name","mkt","seg","typ","cls","und","expiry","settle","prev_settle","chg","open","low","high",
        "close","vwap","value","prem","qty","ntr","oi"]
df = pd.DataFrame(rows, columns=cols)
for c in ["settle","prev_settle","open","low","high","close","vwap","value","qty","ntr","oi"]:
    df[c] = pd.to_numeric(df[c].str.replace(",", "."), errors="coerce")
df["date"] = pd.to_datetime(df["date"]); df["expiry"] = pd.to_datetime(df["expiry"])
df["root"] = df.code.str.extract(r"^(F_[A-Z]+)")[0]
df = df.drop_duplicates(["date","code"]).sort_values(["date","root","expiry"])
k = ["date","code","root","expiry","settle","prev_settle","open","low","high","close","vwap","value","qty","ntr","oi"]
df[df.code.str.startswith("F_XAU")][k].to_csv(H/"raw/viop_gold.csv", index=False)
df[df.code.str.startswith("F_USDTRY")][k].to_csv(H/"raw/viop_usd.csv", index=False)
g = df[df.code.str.startswith("F_XAU")]
print(g.groupby("root").agg(first=("date","min"), last=("date","max"), n=("date","nunique"), val=("value","sum")))
print(df.date.nunique(), df.date.min(), df.date.max())
