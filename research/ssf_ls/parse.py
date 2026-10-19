"""Parse filtered VİOP bulletins (raw/viop/f_YYYYMMDD.csv) -> long panel of single-stock futures (SSF) and
BIST30 index futures. Output raw/ssf_panel.pkl (all contracts, all days).
Columns: date, code, und, expiry, settle, prev_settle (exchange-adjusted for corporate actions), open, low, high,
close, vwap, value (TL traded), qty (contracts), ntr (trades), oi (open interest, contracts).
"""
import glob, pathlib, pandas as pd
H = pathlib.Path(__file__).resolve().parent
rows = []
for f in sorted(glob.glob(str(H / "raw/viop/f_*.csv"))):
    with open(f, encoding="cp1254", errors="replace") as fh:
        for i, ln in enumerate(fh):
            if i < 2:
                continue
            p = ln.rstrip("\n").split(";")
            if len(p) < 22:
                continue
            if p[4] == "SSF" or p[1].startswith("F_XU030"):
                rows.append(p[:22])
cols = ["date", "code", "name", "mkt", "seg", "typ", "cls", "und", "expiry", "settle", "prev_settle", "chg", "open",
        "low", "high", "close", "vwap", "value", "prem", "qty", "ntr", "oi"]
df = pd.DataFrame(rows, columns=cols)
for c in ["settle", "prev_settle", "open", "low", "high", "close", "vwap", "value", "qty", "ntr", "oi"]:
    df[c] = pd.to_numeric(df[c].str.replace(",", "."), errors="coerce")
df["date"] = pd.to_datetime(df["date"]); df["expiry"] = pd.to_datetime(df["expiry"])
df["und"] = df["und"].str.replace(".E", "", regex=False)
df.loc[df.code.str.startswith("F_XU030"), "und"] = "XU030"
df = df.drop_duplicates(["date", "code"]).sort_values(["date", "und", "expiry"])
keep = ["date", "code", "und", "expiry", "settle", "prev_settle", "open", "low", "high", "close", "vwap", "value",
        "qty", "ntr", "oi"]
df[keep].to_pickle(H / "raw/ssf_panel.pkl")
print(df.shape, df.date.min(), df.date.max(), df.date.nunique(), df.und.nunique())
