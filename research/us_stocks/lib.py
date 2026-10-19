"""US S&P500 individual-stock anomaly backtests. Panel, point-in-time universe, cost-aware simulator, TRY/tax stats."""
import pathlib, numpy as np, pandas as pd, sys
HERE = pathlib.Path(__file__).parent
R = HERE / "raw"
sys.path.insert(0, str(HERE.parents[1] / "src"))
from engine import apply_tax

IS_START, IS_END = "2010-01-01", "2025-10-16"
OOS_START, OOS_END = "2025-10-17", "2026-10-16"
EXTRA = ["SPY", "QQQ", "SH", "RSP", "MTUM", "USMV", "_IRX", "TRY_X", "SSO", "UPRO"]

def build_panel():
    f = R / "panel.pkl"
    if f.exists(): return pd.read_pickle(f)
    fr = {}
    for p in sorted((R / "px").glob("*.csv")):
        d = pd.read_csv(p, index_col=0, parse_dates=True)
        fr[p.stem] = d
    spy = fr["SPY"].index
    idx = spy[spy >= "2004-01-01"]
    P = {k: pd.DataFrame({t: d[k] for t, d in fr.items() if t not in ("_IRX", "TRY_X")}).reindex(idx)
         for k in ["open", "close", "adjclose", "volume", "high", "low"]}
    # bad ticks: daily adj return beyond +-60% with reversal -> treat as NaN (rare Yahoo glitches)
    # point-in-time membership
    m = pd.read_csv(R / "membership/sp500_hist.csv", parse_dates=["date"]).set_index("date")
    cols = P["close"].columns
    mem = pd.DataFrame(False, index=m.index, columns=cols)
    for d, t in m.tickers.items():
        s = [x for x in t.split(",") if x in cols]
        mem.loc[d, s] = True
    mem = mem.reindex(idx, method="ffill").fillna(False).astype(bool)
    irx = fr["_IRX"]["close"].reindex(idx).ffill() / 100
    usd = fr["TRY_X"]["close"].reindex(idx).ffill()
    u2 = pd.read_csv(HERE.parents[1] / "data/bist/USDTRY.csv", index_col=0, parse_dates=True)["close"].reindex(idx).ffill()
    usdtry = u2.where(u2.notna(), usd)
    out = dict(P=P, mem=mem, irx=irx, usdtry=usdtry)
    pd.to_pickle(out, f)
    return out

def stats_m(eq, start, end):
    e = eq.loc[start:end]
    e = e / e.iloc[0]
    m = e.resample("ME").last()
    m = pd.concat([pd.Series([1.0], index=[e.index[0] - pd.Timedelta(days=1)]), m])
    mr = m.pct_change().dropna()
    n = len(mr)
    geo = e.iloc[-1] ** (1 / n) - 1
    dd = (e / e.cummax() - 1).min()
    return dict(geo=geo, maxdd=dd, worst=mr.min(), months=n, neg=(mr < 0).mean(),
                sharpe=mr.mean() / mr.std() * np.sqrt(12) if mr.std() > 0 else 0)

def try_eq(eq_usd, usdtry, start, end, tax=0.20):
    e = eq_usd.loc[start:end]
    e = e / e.iloc[0] * usdtry.reindex(e.index).ffill() / usdtry.reindex(e.index).ffill().iloc[0]
    return apply_tax(e, tax) if tax else e

def simulate(target, rebal, P, irx, capital=100_000, slip_bp=3.0, lev=1.0, comm_ps=0.005, comm_min=1.0,
             spread_borrow=0.015, cash_haircut=0.005, band=0.0):
    """target: DataFrame (dates x tickers) of target weights (sum<=1, scaled by lev) at close of rebal dates.
    Trades at close of the signal day (MOC) -- returns from next day. Commission IB fixed-like: $0.005/sh, min $1, cap 1% value.
    Margin interest on borrowed = IRX + 1.5%; idle cash earns IRX - 0.5% (>=0).
    Returns daily equity (USD, scaled to 1) and annual turnover series."""
    adj = P["adjclose"]; cl = P["close"]
    dates = adj.index
    ret = adj.pct_change(fill_method=None).fillna(0.0).clip(-0.9, 3.0).values
    clv = cl.ffill().values
    cols = adj.columns
    tgt = target.reindex(columns=cols).fillna(0.0) * lev
    tdates = set(tgt.index)
    tpos = {d: i for i, d in enumerate(tgt.index)}
    tv = tgt.values
    rb = set(rebal)
    w = np.zeros(len(cols)); eq = capital
    out = np.empty(len(dates)); turn = np.zeros(len(dates))
    rf = irx.reindex(dates).ffill().fillna(0).values
    for i in range(len(dates)):
        if i > 0:
            r = ret[i]
            inv = w.sum()
            g = (w * r).sum()
            cash = 1 - inv
            g += (cash * max(rf[i - 1] - cash_haircut, 0) if cash > 0 else cash * (rf[i - 1] + spread_borrow)) / 360 * \
                 (dates[i] - dates[i - 1]).days
            eq_new = eq * (1 + g)
            w = w * (1 + r) * eq / eq_new if eq_new > 0 else w * 0
            eq = eq_new
        d = dates[i]
        if d in rb and d in tdates:
            nw = tv[tpos[d]].copy()
            if band > 0:
                keep = (np.abs(nw - w) < band) & (nw > 0) & (w > 0)
                nw[keep] = w[keep]
            dw = nw - w
            tr = np.abs(dw)
            m = tr > 1e-6
            if m.any():
                val = tr[m] * eq
                px = clv[i][m]
                px = np.where(np.isfinite(px) & (px > 0), px, 50.0)
                comm = np.minimum(np.maximum(val / px * comm_ps, comm_min), 0.01 * val)
                cost = comm.sum() + val.sum() * slip_bp / 1e4
                eq -= cost
                turn[i] = tr.sum()
            w = nw.copy() * 1.0
        out[i] = eq
        if eq <= 0:
            out[i:] = 1e-9; break
    return pd.Series(out / capital, index=dates), pd.Series(turn, index=dates)

def month_ends(dates):
    s = pd.Series(dates, index=dates)
    return list(s.groupby([dates.year, dates.month]).max())

def week_ends(dates):
    s = pd.Series(dates, index=dates)
    iso = dates.isocalendar()
    return list(s.groupby([iso.year.values, iso.week.values]).max())
