"""Independent re-implementation of try_carry R3 with (a) model carry, (b) ACTUAL VİOP futures settlement prices.
Does not import the original package (avoids writing numba caches there); reads its panel.csv read-only."""
import pathlib, numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent
ORIG = H.parent / "try_carry"
IS_START, IS_END, OOS_START, OOS_END = "2005-01-03", "2025-10-16", "2025-10-17", "2026-10-16"
MAINT, TC, ROLL, BASIS = 0.075, 0.0005, 0.0004, 1.0

# ---- corrected policy/effective funding path (decision dates; effective next business day) 2023-06+
# sources: TCMB PPK press releases; 2026 repo-auction pause 2026-03-01..2026-08-23 => AOFM ~ O/N lending 40%
POL_DECISIONS = [("2023-06-22", 15), ("2023-07-20", 17.5), ("2023-08-24", 25), ("2023-09-21", 30), ("2023-10-26", 35),
                 ("2023-11-23", 40), ("2023-12-21", 42.5), ("2024-01-25", 45), ("2024-03-21", 50), ("2024-12-26", 47.5),
                 ("2025-01-23", 45), ("2025-03-06", 42.5), ("2025-04-17", 46), ("2025-07-24", 43), ("2025-09-11", 40.5),
                 ("2025-10-23", 39.5), ("2025-12-11", 38), ("2026-01-22", 37)]
# effective funding (AOFM) overrides: 2025-03-20 emergency (O/N lending 46, repo paused) ; 2026-03 pause (40)
EFF_OVR = [("2025-03-21", "2025-04-17", 46.0), ("2026-03-02", "2026-08-24", 40.0)]


def panel():
    d = pd.read_csv(ORIG / "data/panel.csv", index_col=0, parse_dates=True).loc[:OOS_END]
    return d


def corrected_rates(d):
    """returns (pol_corr, eff_corr) in % : before 2023-06-23 original monthly table shifted +1 month
    (i.e. never before the decision), after that exact decision dates (+1 day)."""
    pol0 = d["pol"]
    shifted = pol0.copy()
    shifted[:] = pol0.reindex(d.index - pd.DateOffset(months=1), method="ffill").values
    shifted = shifted.fillna(pol0)
    s = pd.Series(np.nan, d.index)
    for dt, v in POL_DECISIONS:
        s[s.index > pd.Timestamp(dt)] = v
    pol = shifted.where(d.index <= pd.Timestamp("2023-06-22"), s).ffill()
    eff = pol.copy()
    for a, b, v in EFF_OVR:
        eff[(eff.index >= a) & (eff.index < b)] = v
    return pol, eff


def signals(d, pol, cpi, tv=0.30, Lmax=8, w=20, real_th=0.05):
    lr = np.log(d["close"]).diff().fillna(0)
    vol = lr.rolling(w).std() * np.sqrt(260)
    L = (tv / vol).clip(upper=Lmax).fillna(0)
    if real_th is not None:
        L = L * ((pol - cpi) / 100 > real_th).astype(float)
    return L


def run_model(M, Hh, mmf, carry, L, month_end, q_end, tax=0.10, lag=0, maint=MAINT):
    """pure-python copy of sim.run with stop=0 (R3 has no stop)."""
    n = len(M); nav = np.ones(n); Lh = np.zeros(n); N = 0.0; v = 1.0; qp = 0.0; nl = 0
    for t in range(1, n):
        if v <= 0: nav[t] = 0; continue
        fut = 0.0; exited = False
        if N > 0:
            worst = v - N * (Hh[t] - M[t - 1])
            if worst < maint * N * Hh[t]:
                fut = -N * (Hh[t] * 1.005 - M[t - 1]); N = 0.0; exited = True; nl += 1
            else:
                fut = -N * (M[t] - M[t - 1]) + N * M[t - 1] * carry[t]
        v = v * (1 + mmf[t]) + fut; qp += fut
        if v <= 0: nav[t] = 0; v = 0; continue
        if N > 0 and month_end[t]: v -= N * M[t] * ROLL
        if q_end[t]:
            if qp > 0: v -= tax * qp
            qp = 0.0
        tgt = L[t - lag] if t - lag >= 0 else 0.0
        cur = N * M[t] / v
        if (tgt == 0 and N > 0) or abs(tgt - cur) > max(0.1, 0.2 * tgt) or (tgt > 0 and N == 0 and not exited):
            newN = tgt * v / M[t]; v -= abs(newN - N) * M[t] * TC; N = newN
        nav[t] = v; Lh[t] = N * M[t] / v
    return nav, Lh, nl


def calendar(idx):
    days = np.r_[1, (idx[1:] - idx[:-1]).days].astype(float)
    me = np.r_[idx[1:].month != idx[:-1].month, True]
    qe = np.r_[(idx[1:].quarter != idx[:-1].quarter) | (idx[1:].year != idx[:-1].year), True]
    return days, me, qe


# ---------------- actual futures
def futures_panel(roll_bd=2):
    F = pd.read_csv(H / "viop_usdtry_fut.csv", parse_dates=["date", "expiry"])
    F = F[F.settle > 0]
    return F


def run_futures(F, dates, L, ppf_rate, tax=0.10, lag=1, roll_cal=4, maint=MAINT, tc=TC, slip=0.005, jump=None):
    """Short the front contract (roll into next when <= roll_cal calendar days to expiry) at SETTLEMENT prices.
    L: leverage target series indexed by date (decision uses L[t-lag] known at t-lag, executed at settle t).
    ppf_rate: annual % series (PPF yield on full NAV). Intraday forced close if contract HIGH breaches maintenance.
    jump: optional dict {date: pct} to inject a stress jump on that day."""
    by = {d: g.set_index("code") for d, g in F.groupby("date")}
    dates = [d for d in dates if d in by]
    n = len(dates); nav = np.ones(n); Lh = np.zeros(n)
    v = 1.0; N = 0.0; held = None; qp = 0.0; nl = 0; nroll = 0
    Lv = L.reindex(dates).fillna(0).values
    rr = ppf_rate.reindex(dates, method="ffill").values / 100
    for t in range(1, n):
        d, dp = dates[t], dates[t - 1]
        g = by[d]
        days = (d - dp).days
        mmf = (1 + rr[t]) ** (days / 365) - 1
        fut = 0.0; exited = False
        if N > 0:
            if held not in g.index:  # expired (cash-settled) -> settle at last price; should not happen with roll
                held = None; N = 0.0
            else:
                row = g.loc[held]; p0 = by[dp].loc[held, "settle"]
                hi = row.high if row.high > 0 else row.settle
                hi = max(hi, row.settle)
                st = row.settle
                if jump and d in jump:
                    hi = max(hi, p0 * (1 + jump[d])); st = max(st, p0 * (1 + jump[d] * 0.6))
                worst = v - N * (hi - p0)
                if worst < maint * N * hi:
                    fut = -N * (hi * (1 + slip) - p0); N = 0.0; exited = True; nl += 1
                else:
                    fut = -N * (st - p0)
        v = v * (1 + mmf) + fut; qp += fut
        if v <= 0:
            nav[t:] = 0; break
        if q_end_flag(dates, t):
            if qp > 0: v -= tax * qp
            qp = 0.0
        # roll / choose contract
        cands = g[(g.index.str.match(r"F_USDTRY\d{4}$")) & ((g.expiry - d).dt.days > roll_cal)].sort_values("expiry")
        front = cands.index[0]
        tgt = Lv[t - lag] if t - lag >= 0 else 0.0
        if N > 0 and held != front:
            # roll at settlement: close held, open front (same USD notional)
            v -= N * (g.loc[held, "settle"] + g.loc[front, "settle"]) * tc; held = front; nroll += 1
        px = g.loc[front, "settle"]
        cur = N * px / v
        if (tgt == 0 and N > 0) or abs(tgt - cur) > max(0.1, 0.2 * tgt) or (tgt > 0 and N == 0 and not exited):
            newN = tgt * v / px; v -= abs(newN - N) * px * tc; N = newN; held = front
        nav[t] = v; Lh[t] = N * px / v
    return pd.Series(nav, dates), pd.Series(Lh, dates), nl, nroll


def q_end_flag(dates, t):
    if t + 1 >= len(dates): return True
    a, b = dates[t], dates[t + 1]
    return (a.quarter != b.quarter) or (a.year != b.year)


def mstats(s, a, b):
    s = s.loc[a:b]
    if len(s) < 5 or s.iloc[0] <= 0: return dict(geo=-100, geo12=-100, dd=-100, worst=-100, tot=0)
    e = s / s.iloc[0]
    m = e.resample("ME").last(); m = pd.concat([pd.Series([1.0], [e.index[0] - pd.Timedelta(days=1)]), m])
    mr = m.pct_change().dropna(); tot = e.iloc[-1]
    yrs = (e.index[-1] - e.index[0]).days / 365.25
    return dict(geo=(tot ** (1 / len(mr)) - 1) * 100 if tot > 0 else -100,
                geo12=(tot ** (1 / (12 * yrs)) - 1) * 100 if tot > 0 else -100,
                dd=((e / e.cummax()) - 1).min() * 100, worst=mr.min() * 100, tot=tot)
