"""Parse Borsa Istanbul VİOP daily bulletins -> USDTRY cash-settled futures panel (F_USDTRYmmyy)."""
import glob, pathlib, io, pandas as pd
H = pathlib.Path(__file__).resolve().parent
files = sorted(glob.glob(str(H / "viop_usd/u_*.csv"))) + sorted(glob.glob(str(H / "viop_raw/viop_*.csv")))
rows = []
for f in files:
    try:
        txt = open(f, encoding="cp1254", errors="replace").read()
    except Exception:
        continue
    if not txt.startswith("TARIH"):
        continue
    lines = txt.splitlines()
    hdr = lines[0].split(";")
    for ln in lines[1:]:
        p = ln.split(";")
        if len(p) < 20 or not p[1].startswith("F_USDTRY"):
            continue
        rows.append(p[:len(hdr)])
cols = ["date", "code", "name", "mkt", "seg", "typ", "cls", "und", "expiry", "settle", "prev_settle", "chg", "open",
        "low", "high", "close", "vwap", "value", "prem", "qty", "ntr", "oi"]
df = pd.DataFrame([r[:22] for r in rows], columns=cols)
for c in ["settle", "prev_settle", "open", "low", "high", "close", "vwap", "value", "qty", "oi"]:
    df[c] = pd.to_numeric(df[c].str.replace(",", "."), errors="coerce")
df["date"] = pd.to_datetime(df["date"]); df["expiry"] = pd.to_datetime(df["expiry"])
df = df.drop_duplicates(["date", "code"]).sort_values(["date", "expiry"])
df[["date", "code", "expiry", "settle", "prev_settle", "open", "low", "high", "close", "value", "qty", "oi"]].to_csv(
    H / "viop_usdtry_fut.csv", index=False)
print(df.shape, df.date.min(), df.date.max(), df.date.nunique())
