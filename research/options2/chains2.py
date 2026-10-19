"""Daily chains from raw/daily snapshots (08:05-10:00 UTC). Each instrument: first trade's Deribit mark.
Mark IV computed per row against that trade's own index (F_row = index_row * F/S basis of its expiry),
so smiles are in log-moneyness and not polluted by spot drift inside the 2h window.
Output: chains_daily.pkl  (cur, day, expiry, dte, strike, cp, x=ln(K/F), miv, mark_coin, n_tr)."""
import json, gzip, pathlib, datetime as dt, numpy as np, pandas as pd, sys
from concurrent.futures import ProcessPoolExecutor
from fbs import iv as fiv
D = pathlib.Path(__file__).parent
MON = {m: i + 1 for i, m in enumerate("JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split())}
def pexp(s):
    return dt.datetime(2000 + int(s[-2:]), MON[s[-5:-2]], int(s[:-5]), 8, 0)

def one(path):
    cur, day = path.parent.name, path.name[:10]
    tr = json.load(gzip.open(path, "rt"))
    if not tr: return None
    df = pd.DataFrame(tr, columns=["ts", "inst", "price", "mark", "iv", "idx", "amt", "dirn"]).sort_values("ts")
    n = df.groupby("inst").size()
    f = df.groupby("inst").first().reset_index(); f["n_tr"] = f.inst.map(n).values
    p = f.inst.str.split("-", expand=True)
    f["expiry"] = [pexp(s) for s in p[1]]; f["strike"] = p[2].astype(float); f["cp"] = p[3]
    f["t"] = pd.to_datetime(f.ts, unit="ms")
    f["T"] = (f.expiry - f.t).dt.total_seconds() / (365 * 86400)
    f = f[f["T"] > 0.5 / 365].copy()
    S = float(df.idx.median())
    out = []
    for ex, g in f.groupby("expiry"):
        # basis ratio F/S from put-call parity on same-strike pairs (coin marks, inverse): F = K/(1-(C-P))
        pp = g[g.cp == "P"].set_index("strike"); cc = g[g.cp == "C"].set_index("strike")
        j = pp[["mark", "idx"]].join(cc[["mark", "idx"]], lsuffix="p", rsuffix="c", how="inner")
        j = j[(j.index > .9 * S) & (j.index < 1.1 * S)]
        if len(j):
            Fs = j.index.values / (1 - (j.markc - j.markp).values); ratio = float(np.median(Fs / ((j.idxp + j.idxc).values / 2)))
        else:
            ratio = np.nan
        g = g.copy(); g["ratio"] = ratio; out.append(g)
    f = pd.concat(out)
    # sanitize ratio: annualised basis within [-20%, +60%]; else fill by interpolation on T
    b = np.log(f.ratio) / f["T"]
    ok = np.isfinite(b) & (b > -0.2) & (b < 0.6)
    f.loc[~ok, "ratio"] = np.nan
    eb = f.groupby("expiry").agg(T=("T", "median"), r=("ratio", "first"))
    eb["b"] = np.log(eb.r) / eb["T"]
    bfill = eb.b.dropna().median() if eb.b.notna().any() else 0.0
    eb["b"] = eb.b.fillna(bfill)
    f["b"] = f.expiry.map(eb.b)
    f["F"] = f.idx * np.exp(f.b * f["T"])
    f["has_fwd"] = f.ratio.notna()
    isc = (f.cp == "C").values
    f["miv"] = fiv(f["mark"].values * f.F.values, f.F.values, f.strike.values, f["T"].values, isc)
    f = f[np.isfinite(f.miv) & (f.miv > 0.05) & (f.miv < 5)]
    f["x"] = np.log(f.strike / f.F)
    f["cur"] = cur; f["day"] = day; f["S"] = S
    f["dte"] = (f.expiry - pd.Timestamp(day)).dt.days
    return f[["cur", "day", "expiry", "dte", "strike", "cp", "x", "miv", "mark", "idx", "b", "has_fwd", "T", "t", "S", "n_tr"]]

if __name__ == "__main__":
    files = sorted((D / "raw" / "daily").glob("*/*.json.gz"))
    with ProcessPoolExecutor(4) as ex:
        res = [r for r in ex.map(one, files, chunksize=20) if r is not None]
    ch = pd.concat(res, ignore_index=True)
    ch["cp"] = ch.cp.astype("category"); ch["cur"] = ch.cur.astype("category")
    ch.to_pickle(D / "raw" / "chains_daily.pkl")
    print(len(ch), ch.groupby("cur", observed=True).day.nunique())
