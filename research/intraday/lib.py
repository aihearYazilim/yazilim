"""Intraday crypto research library: data, signals, cost-aware PnL.

Conventions (no look-ahead): signal/weight w_t is computed from data up to and including bar t's close,
applied to bar t+1's close-to-close return. Costs: |w_t - w_{t-1}| * cost; funding 10%/yr on short notional
and on long notional above 1x. All per-bar quantities stored at leverage 1, scaled linearly by L later.
"""
import pathlib, numpy as np, pandas as pd

DATA = pathlib.Path(__file__).resolve().parents[2] / "data"
SYMS = ["BTC","ETH","SOL","BNB","XRP","DOGE","ADA","AVAX","LINK","LTC","DOT","TRX","BCH","ATOM","ETC","XLM","NEAR","UNI","FIL"]
UNIVERSES = {"BTC": ["BTC"], "ETH": ["ETH"], "SOL": ["SOL"], "MAJ3": ["BTC","ETH","SOL"], "ALL19": SYMS}
COST = {"1h": 0.0010 + 0.0003, "4h": 0.0010 + 0.0002}   # fee + slippage per unit turnover
FUND = 0.10                                             # per year on short / >1x long notional
FH = {"1h": 1, "4h": 4}
VOL_TARGET = 0.5   # per-coin annualised vol target (base leverage ~1x gross)
VOL_CAP = 3.0

def load(freq):
    idx = pd.date_range("2020-01-01", "2026-10-16 23:00", freq=freq)
    P = {f: {} for f in ["open","high","low","close"]}
    for s in SYMS:
        df = pd.read_csv(DATA / f"crypto_{freq}" / f"{s}.csv", index_col=0, parse_dates=True)
        df = df[~df.index.duplicated()].reindex(idx)
        first = df.close.first_valid_index()
        c = df.close.ffill(); c[c.index < first] = np.nan
        P["close"][s] = c
        for f in ["open","high","low"]:
            x = df[f].fillna(c); P[f][s] = x
    return {k: pd.DataFrame(v) for k, v in P.items()}

def h2b(hours, freq):
    return max(1, int(round(hours / FH[freq])))

def vol_scale(C, freq):
    """per-coin VOL_TARGET / sigma (EWM, hl 7d), updated once per day (00:00) to limit turnover."""
    r = C.pct_change(fill_method=None)
    bpy = 365 * 24 / FH[freq]
    sig = np.sqrt(r.pow(2).ewm(halflife=h2b(24*7, freq), min_periods=h2b(24*7, freq)).mean() * bpy)
    sc = (VOL_TARGET / sig).clip(upper=VOL_CAP)
    daily = sc.where(pd.Series(sc.index.hour == 0, index=sc.index), axis=0)
    return daily.ffill()

_VS = {}
def vol_scale_cached(D, freq, cols):
    key = (id(D), freq)
    if key not in _VS: _VS[key] = vol_scale(D["close"], freq)
    return _VS[key][cols]

def machine(ent, ext):
    s = pd.DataFrame(np.nan, index=ent.index, columns=ent.columns)
    s = s.mask(ext, 0.0).mask(ent, 1.0)
    return s.ffill().fillna(0.0)

def apply_mode(s, mode):
    if mode == "LS": return s
    if mode == "LO": return s.clip(lower=0)
    if mode == "SO": return s.clip(upper=0)
    raise ValueError(mode)

# ---------------- signal families (per coin, in [-1,1]) ----------------
def sig_tsmom(D, freq, lb):
    C = D["close"]; return np.sign(C / C.shift(h2b(lb, freq)) - 1).fillna(0)

def sig_ema(D, freq, f, s):
    C = D["close"]
    return np.sign(C.ewm(span=h2b(f, freq)).mean() - C.ewm(span=h2b(s, freq)).mean()).fillna(0)

def sig_donchian(D, freq, n):
    C, H, L = D["close"], D["high"], D["low"]
    nb, xb = h2b(n, freq), max(1, h2b(n, freq) // 2)
    up, dn = H.rolling(nb).max().shift(1), L.rolling(nb).min().shift(1)
    xup, xdn = H.rolling(xb).max().shift(1), L.rolling(xb).min().shift(1)
    lg = machine(C > up, C < xdn); sh = machine(C < dn, C > xup)
    return lg - sh

def rsi(C, n):
    d = C.diff(); g = d.clip(lower=0).ewm(alpha=1/n, min_periods=n).mean(); l = (-d.clip(upper=0)).ewm(alpha=1/n, min_periods=n).mean()
    return 100 - 100 / (1 + g / l)

def sig_rsi(D, freq, n, lo, hi):
    R = rsi(D["close"], n)
    lg = machine(R < lo, R > 50); sh = machine(R > hi, R < 50)
    return lg - sh

def zscore(C, nb):
    m = C.rolling(nb).mean(); sd = C.rolling(nb).std()
    return (C - m) / sd

def sig_boll(D, freq, n, k):
    z = zscore(D["close"], h2b(n, freq))
    lg = machine(z < -k, z > 0); sh = machine(z > k, z < 0)
    return lg - sh

def sig_reversal(D, freq, k):
    C = D["close"]; kb = h2b(k, freq)
    r = C / C.shift(kb) - 1
    sd = C.pct_change(fill_method=None).rolling(h2b(24*7, freq)).std() * np.sqrt(kb)
    return (-(r / sd) / 2).clip(-1, 1).fillna(0)

def sig_volregime(D, freq, thr, lb, low_action, orient):
    C = D["close"]; r = C.pct_change(fill_method=None)
    vs = r.pow(2).ewm(halflife=h2b(12, freq)).mean(); vl = r.pow(2).ewm(halflife=h2b(24*30, freq)).mean()
    ratio = np.sqrt(vs / vl)
    trend = sig_tsmom(D, freq, lb)
    alt = (-zscore(C, h2b(48, freq)) / 2).clip(-1, 1).fillna(0) if low_action == "MR" else 0 * trend
    hi = ratio > thr
    if orient == "trend_hi":
        return trend.where(hi, alt).fillna(0)
    return trend.where(~hi, alt).fillna(0)

def sig_ensemble(D, freq, kind):
    tl = [24, 48, 96, 168, 336, 720]
    e1 = sum(sig_tsmom(D, freq, l) for l in tl) / len(tl)
    if kind == "E1": return e1
    ema = sum(sig_ema(D, freq, f, 4*f) for f in [6, 24, 96]) / 3
    don = sum(sig_donchian(D, freq, n) for n in [48, 168, 720]) / 3
    e2 = (e1 + ema + don) / 3
    if kind == "E2": return e2
    mr = sum((-zscore(D["close"], h2b(n, freq)) / 2).clip(-1, 1).fillna(0) for n in [24, 48, 168]) / 3
    return 0.5 * e2 + 0.5 * mr

def sig_season(D, freq, cols, bucket, W, thr):
    """Walk-forward seasonality: bucket mean/t-stat of equal-weight universe return over prior W days only."""
    C = D["close"][cols]
    r = C.pct_change(fill_method=None).mean(axis=1).fillna(0)
    idx = r.index
    if bucket == "hod":
        M = r.groupby([idx.normalize(), idx.hour]).sum().unstack()        # day x hour
        n = W
        mu = M.rolling(n, min_periods=n // 2).mean().shift(1)
        sd = M.rolling(n, min_periods=n // 2).std().shift(1)
        t = mu / sd * np.sqrt(n)
        sig = np.sign(mu).where(t.abs() > thr, 0).fillna(0)
        st = sig.stack(); st.index = pd.DatetimeIndex([d + pd.Timedelta(hours=int(h)) for d, h in st.index])
        out = st.reindex(idx).fillna(0)
    elif bucket == "dow":
        dr = (1 + r).groupby(idx.normalize()).prod() - 1                   # daily
        wk = dr.index.to_period("W-SUN").start_time
        M = pd.Series(dr.values, index=[wk, dr.index.dayofweek]).unstack()  # week x dow
        n = max(4, W // 7)
        mu = M.rolling(n, min_periods=n // 2).mean().shift(1)
        sd = M.rolling(n, min_periods=n // 2).std().shift(1)
        t = mu / sd * np.sqrt(n)
        sig = np.sign(mu).where(t.abs() > thr, 0).fillna(0)
        st = sig.stack(); st.index = pd.DatetimeIndex([w + pd.Timedelta(days=int(d)) for w, d in st.index])
        out = st.reindex(idx.normalize()).fillna(0); out.index = idx
    else:  # how: hour-of-week
        wk = idx.to_period("W-SUN").start_time
        key = idx.dayofweek * 24 + idx.hour
        M = pd.Series(r.values, index=[wk, key]).groupby(level=[0, 1]).sum().unstack()
        n = max(4, W // 7)
        mu = M.rolling(n, min_periods=n // 2).mean().shift(1)
        sd = M.rolling(n, min_periods=n // 2).std().shift(1)
        t = mu / sd * np.sqrt(n)
        sig = np.sign(mu).where(t.abs() > thr, 0).fillna(0)
        st = sig.stack(); st.index = pd.DatetimeIndex([w + pd.Timedelta(hours=int(k)) for w, k in st.index])
        out = st.reindex(idx).fillna(0)
    # bucket signal for bar t+1 must be held during bar t+1 -> weight at bar t = signal of bar t+1's bucket.
    # The bucket statistics are from prior days/weeks only, so knowing the next bar's clock slot is not look-ahead.
    out = out.shift(-1).fillna(0)
    return pd.DataFrame({c: out for c in C.columns})

def weights_xs(D, freq, cols, lb, direction, frac=0.3):
    C = D["close"][cols]
    lbb = h2b(lb, freq); R = h2b(min(lb, 24), freq)
    ret = C / C.shift(lbb) - 1
    rk = ret.rank(axis=1, pct=True)
    n = ret.notna().sum(axis=1)
    lg = (rk >= 1 - frac + 1e-9) & (n >= 5).values[:, None]
    sh = (rk <= frac) & (n >= 5).values[:, None]
    w = lg.div(lg.sum(axis=1).replace(0, np.nan), axis=0).fillna(0) * 0.5 - sh.div(sh.sum(axis=1).replace(0, np.nan), axis=0).fillna(0) * 0.5
    if direction == "rev": w = -w
    keep = np.arange(len(w)) % R == 0
    w = w.where(pd.Series(keep, index=w.index), np.nan).ffill().fillna(0)
    return w

def to_weights(sig, D, freq, cols):
    """per-coin vol-targeted weight / number of available coins."""
    C = D["close"][cols]
    sc = vol_scale_cached(D, freq, cols)
    avail = C.notna() & sc.notna()
    n = avail.sum(axis=1).replace(0, np.nan)
    w = (sig[cols] * sc).where(avail, 0).div(n, axis=0).fillna(0)
    return w

# ---------------- PnL ----------------
def bar_arrays(w, D, freq, cols):
    """Return per-bar (gross, turnover, short, long, worst-intrabar) at L=1, plus sign-change trade count."""
    C = D["close"][cols]; H = D["high"][cols]; Lo = D["low"][cols]
    W = w.values; Wp = np.vstack([np.zeros((1, W.shape[1])), W[:-1]])   # weight held during bar t
    c = C.values; cp = np.vstack([c[:1], c[:-1]])
    with np.errstate(invalid="ignore", divide="ignore"):
        r = np.nan_to_num(c / cp - 1)
        hi = np.nan_to_num(H.values / cp - 1); lo = np.nan_to_num(Lo.values / cp - 1)
    gross = (Wp * r).sum(1)
    worst = (np.where(Wp > 0, Wp * lo, Wp * hi)).sum(1)
    turn = np.abs(W - Wp).sum(1)                      # trade at close of bar t
    short = (-np.clip(Wp, None, 0)).sum(1); long = np.clip(Wp, 0, None).sum(1)
    sgn = np.sign(np.round(W, 6)); sgp = np.sign(np.round(Wp, 6))
    trades = (sgn != sgp).sum(1)
    return gross, turn, short, long, worst, trades

LEVS = [1, 2, 3, 5]

def daily_from_bars(index, freq, gross, turn, short, long, worst, trades):
    """Aggregate to UTC days. Returns dict: ret[L] (daily net), minpath (intraday worst cum gross at L=1), trades."""
    day = index.normalize()
    days, starts = np.unique(day.values, return_index=True)
    cost = COST[freq]; fb = FUND / (365 * 24 / FH[freq])
    out = {}
    for L in LEVS:
        rb = L * gross - L * turn * cost - fb * (L * short + np.maximum(L * long - 1, 0))
        lr = np.log1p(np.maximum(rb, -0.999999))
        out[L] = np.expm1(np.add.reduceat(lr, starts))
    # intraday path at L=1 (simple-sum approx): min over bars of cum gross before bar + worst intrabar
    cum = np.cumsum(gross); cs = np.r_[0, cum[:-1]]
    base = cs[starts]; before = cs - np.repeat(base, np.diff(np.r_[starts, len(cs)]))
    out["minpath"] = np.minimum.reduceat(np.minimum(before + worst, 0), starts)
    out["trades"] = np.add.reduceat(trades, starts)
    out["turn"] = np.add.reduceat(turn, starts)
    return pd.DatetimeIndex(days), out
