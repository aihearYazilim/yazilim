"""Turn raw trade snapshots into per-entry option chains with mark IV (BS, F=index, r=0)."""
import json, pathlib, datetime as dt, numpy as np, pandas as pd
from bs import bs_price, implied_vol
D = pathlib.Path(__file__).parent / "data"
MON = {m: i + 1 for i, m in enumerate("JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split())}
def parse_exp(s):
    return dt.datetime(2000 + int(s[-2:]), MON[s[-5:-2]], int(s[:-5]), 8, 0, tzinfo=dt.timezone.utc)
rows = []
for cur in ("BTC", "ETH"):
    for f in sorted((D / "snap" / cur).glob("*.json")):
        tr = json.loads(f.read_text())
        if not tr: continue
        df = pd.DataFrame(tr).sort_values("timestamp")
        # use first 30 minutes as primary; take each instrument's earliest trade (mark at that time)
        first = df.groupby("instrument_name").first().reset_index()
        n = first.instrument_name.str.split("-", expand=True)
        first["expiry"] = n[1].map(parse_exp); first["strike"] = n[2].astype(float); first["cp"] = n[3]
        first["entry_ts"] = pd.to_datetime(first.timestamp, unit="ms", utc=True)
        first["T"] = (first.expiry - first.entry_ts).dt.total_seconds() / (365 * 86400)
        first = first[first["T"] > 1 / 365]
        first["cur"] = cur; first["day"] = f.stem
        rows.append(first[["cur", "day", "instrument_name", "expiry", "strike", "cp", "mark_price", "index_price", "T", "entry_ts", "iv"]])
ch = pd.concat(rows, ignore_index=True)
# forward per (cur, day, expiry) from put-call parity on inverse marks: F = K / (1 - (C - P)) (coin prices)
def fwd(g):
    p = g[g.cp == "P"].set_index("strike").mark_price; c = g[g.cp == "C"].set_index("strike").mark_price
    S = g.index_price.median(); j = pd.concat([p.groupby(level=0).first(), c.groupby(level=0).first()], axis=1, join="inner").dropna()
    j = j[(j.index > 0.85 * S) & (j.index < 1.15 * S)]
    if len(j) == 0: return np.nan
    Fs = j.index.values / (1 - (j.iloc[:, 1] - j.iloc[:, 0]).values)
    return float(np.median(Fs))
fw = ch.groupby(["cur", "day", "expiry"]).apply(fwd).rename("F").reset_index()
ch = ch.merge(fw, on=["cur", "day", "expiry"], how="left")
ch["S"] = ch.groupby(["cur", "day"]).index_price.transform("median")
ch["has_fwd"] = ch.F.notna()
ch["F"] = ch.F.fillna(ch.S)
F = ch.F.values; K = ch.strike.values; T = ch["T"].values; isc = (ch.cp == "C").values
ch["mark_usd"] = ch.mark_price * ch.F
ch["miv"] = implied_vol(ch.mark_usd.values, F, K, T, isc)
ch = ch[np.isfinite(ch.miv) & (ch.miv > 0.05) & (ch.miv < 4)]
ch["expiry"] = ch.expiry.dt.strftime("%Y-%m-%d")
ch.to_csv(D / "chains.csv.gz", index=False)
print(len(ch), ch.groupby("cur").day.nunique())
