"""Data loading, windows, stats (USD and TRY) for the grid/DCA bot study."""
import pathlib, numpy as np, pandas as pd
HERE = pathlib.Path(__file__).resolve().parent
RAW = HERE / "raw"
ROOT = HERE.parents[1]
MAJ = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE"]
ALTS = ["ADA", "AVAX", "LINK", "LTC", "DOT", "TRX", "BCH", "ATOM", "ETC", "XLM", "NEAR", "UNI", "FIL",
        "AAVE", "ALGO", "HBAR", "ICP", "INJ", "VET", "SHIB"]
OOS0, OOS1 = pd.Timestamp("2025-10-17"), pd.Timestamp("2026-10-17")  # [OOS0, OOS1)
# IS: 15 rolling 12-month windows starting quarterly 2021-04-17 .. 2024-10-17 (last ends 2025-10-16)
IS_STARTS = [pd.Timestamp("2021-04-17") + pd.DateOffset(months=3 * k) for k in range(15)]

def mins(ts):
    return int(pd.Timestamp(ts).value // 60_000_000_000)

class Coin:
    def __init__(self, sym):
        z = np.load(RAW / f"{sym}_1m.npz")
        self.sym = sym
        self.t, self.o, self.h, self.l, self.c = z["t"], z["o"], z["h"], z["l"], z["c"]
        self.qv = z["qv"]
        day = self.t // 1440
        self.d0 = int(day[0])
        nd = int(day[-1]) - self.d0 + 1
        df = pd.DataFrame({"d": day - self.d0, "h": self.h, "l": self.l, "c": self.c})
        g = df.groupby("d")
        self.dH = np.full(nd, np.nan); self.dL = np.full(nd, np.nan); self.dC = np.full(nd, np.nan)
        idx = g.h.max().index.values
        self.dH[idx] = g.h.max().values; self.dL[idx] = g.l.min().values; self.dC[idx] = g.c.last().values
        f = RAW / f"{sym}_funding.csv"
        if f.exists():
            fd = pd.read_csv(f)
            col = "calc_time" if "calc_time" in fd else fd.columns[0]
            rc = "last_funding_rate" if "last_funding_rate" in fd else fd.columns[-1]
            fd = fd.sort_values(col)
            self.ft = (fd[col].values.astype(np.int64) // 60000)
            self.fr = fd[rc].values.astype(np.float64)
        else:
            self.ft = np.array([0], np.int64); self.fr = np.array([0.0])
        self.ft_empty = np.zeros(0, np.int64); self.fr_empty = np.zeros(0)

    def win(self, a, b):
        """minute indices for [a, b) ; None if insufficient data (needs 90 days history before a)."""
        ma, mb = mins(a), mins(b)
        if self.t[0] > ma - 90 * 1440 or self.t[-1] < mb - 1440:
            return None
        return int(np.searchsorted(self.t, ma)), int(np.searchsorted(self.t, mb))

    def days(self, i0, i1):
        d = pd.to_datetime(np.arange(self.t[i0] // 1440, self.t[i1 - 1] // 1440 + 1) * 86400, unit="s")
        return d

_FX = None
def usdtry():
    global _FX
    if _FX is None:
        fx = pd.read_csv(ROOT / "data/bist/USDTRY.csv", index_col=0, parse_dates=True)["close"]
        _FX = fx.reindex(pd.date_range(fx.index[0], "2026-10-20")).ffill()
    return _FX

def to_series(eq, days):
    s = pd.Series(eq, index=days).ffill().fillna(1.0)
    return s

def stats(eq, start=None, try_=False):
    """eq: daily pd.Series, equity normalized to capital 1 at window start (pre-start = 1)."""
    e = eq.copy()
    if try_:
        fx = usdtry().reindex(e.index).ffill()
        e = e * fx / fx.iloc[0]
    e = pd.concat([pd.Series([1.0], index=[e.index[0] - pd.Timedelta(days=1)]), e])
    start = e.index[0] + pd.Timedelta(days=1)
    months = []
    k = 0
    while True:
        a = start + pd.DateOffset(months=k); b = start + pd.DateOffset(months=k + 1)
        if b > e.index[-1] + pd.Timedelta(days=1):
            break
        va = e.loc[:a - pd.Timedelta(days=1)].iloc[-1]; vb = e.loc[:b - pd.Timedelta(days=1)].iloc[-1]
        months.append(vb / va - 1 if va > 0 else -1.0)
        k += 1
    nm = max(len(months), 1)
    tot = e.iloc[-1]
    geo = (max(tot, 1e-9)) ** (1 / nm) - 1 if tot > 0 else -1.0
    dd = (e / e.cummax() - 1).min()
    return dict(geo=geo, tot=tot - 1, dd=dd, worst=min(months) if months else np.nan,
                negm=int(sum(m < 0 for m in months)), nm=nm)
