"""Out-of-sample cross-section test of the TRY carry leg rule R3 on other EM currencies.

Rule (fixed exactly as R3, no re-optimisation):
  target leverage L_t = min(Lmax, 0.30 / sigma20_t)   sigma20 = 20d realised vol of log(mark), annualised sqrt(260)
  x 1{ policy_t - CPIyoy_t > 5pp }                     (variants: >0pp, unconditional, nominal carry>0)
  Lmax in {3, 5}. Decision with day-t mark data, traded at the day-t mark (lag 0, as R3), rebalance band as R3.
Position: short USD/local futures (= long local ccy), notional N USD; collateral in local cash earning the policy rate.
  daily P&L (local ccy) = -N*(M_t - M_{t-1}) + N*M_{t-1}*(pol - us - 1pp)*days/365
  intraday MTM with the day's HIGH (adverse); forced liquidation if equity at the high < maint * N * high,
  executed at high*(1+0.5%) slippage. Costs 0.05% of traded notional; 0.04% monthly roll. No tax.
Metrics are in excess of local cash (NAV / cash index).
"""
import pathlib, sys, numpy as np, pandas as pd
from numba import njit

H = pathlib.Path(__file__).resolve().parent
D = H / "data"
TC, ROLL, BASIS = 0.0005, 0.0004, 1.0
CCYS = ["BRL", "ZAR", "MXN", "INR", "IDR", "RUB", "ARS", "COP", "CLP", "HUF", "PLN", "EGP", "KZT", "TRY"]


@njit(cache=False)
def run(M, Hh, mmf, carry, Lt, month_end, maint, gap):
    n = len(M)
    nav = np.ones(n); low = np.ones(n); Lh = np.zeros(n)
    N = 0.0; v = 1.0; nl = 0; ntr = 0; dead = False
    for t in range(1, n):
        if dead:
            nav[t] = 0.0; low[t] = 0.0; continue
        fut = 0.0; exited = False
        v0 = v * (1 + mmf[t])
        lo = v0
        if N > 0:
            worst = v - N * (Hh[t] - M[t - 1])
            lo = v0 - N * (Hh[t] - M[t - 1])
            if worst < maint * N * Hh[t]:
                fut = -N * (Hh[t] * 1.005 - M[t - 1]); N = 0.0; exited = True; nl += 1
                lo = min(lo, v0 + fut)
            else:
                fut = -N * (M[t] - M[t - 1]) + N * M[t - 1] * carry[t]
        v = v0 + fut
        if v <= 0:
            dead = True; nav[t] = 0.0; low[t] = 0.0; continue
        if N > 0 and month_end[t]:
            v -= N * M[t] * ROLL
        if gap[t] == 1:          # stale/bad mark: never trade at it, just hold
            nav[t] = v; low[t] = max(lo, 0.0); Lh[t] = N * M[t] / v
            continue
        tgt = Lt[t]
        cur = N * M[t] / v
        if (tgt == 0.0 and N > 0) or abs(tgt - cur) > max(0.1, 0.2 * tgt) or (tgt > 0 and N == 0.0 and not exited):
            newN = tgt * v / M[t]
            v -= abs(newN - N) * M[t] * TC
            N = newN; ntr += 1
        nav[t] = v; low[t] = max(lo, 0.0); Lh[t] = N * M[t] / v
    return nav, low, Lh, nl, ntr


def load(ccy, a=None, b=None):
    p = pd.read_csv(D / f"panel_{ccy}.csv", index_col=0, parse_dates=True)
    if a or b:
        # keep 60 days of warm-up before a for the vol window
        a0 = (pd.Timestamp(a) - pd.Timedelta(days=60)) if a else None
        p = p.loc[a0:b]
    return p


def signal(p, filt, Lmax, tv=0.30, w=20):
    lr = np.log(p["close"]).diff().fillna(0)
    vol = lr.rolling(w).std() * np.sqrt(260)
    L = (tv / vol.where(vol > 0)).clip(upper=Lmax)
    L = L.where(~(vol <= 0), float(Lmax))   # zero realised vol (hard peg / stale data) -> cap
    L = L.fillna(0.0)                       # warm-up
    # missing-data guard: flat if today has no bar or the 20d window has < 15 real observations
    valid = (1 - p["gap"]).rolling(w, min_periods=1).sum()
    L = L.where((p["gap"] == 0) & (valid >= 15), 0.0)
    real = p["pol"] - p["cpi"]
    if filt == "r5":
        L = L * (real > 5)
    elif filt == "r0":
        L = L * (real > 0)
    elif filt == "c0":
        L = L * (p["pol"] - p["us"] - BASIS > 0)
    elif filt == "unc":
        pass
    return L.astype(float)


def evaluate(p, filt, Lmax, maint=0.075, high="high", a=None, lag=0):
    idx = p.index
    days = np.r_[1, (idx[1:] - idx[:-1]).days].astype(float)
    M = p["close"].values; Hh = p[high].values
    pol = p["pol"].values / 100; us = p["us"].values / 100
    mmf = (1 + pol) ** (days / 365) - 1
    carry = (pol - us - BASIS / 100) * days / 365
    me = np.r_[idx[1:].month != idx[:-1].month, True]
    L = signal(p, filt, Lmax).shift(lag).fillna(0.0).values
    if a is not None:   # no positions before the evaluation start
        L = np.where(idx < pd.Timestamp(a), 0.0, L)
    nav, low, Lh, nl, ntr = run(M, Hh, mmf, carry, L, me, maint, p["gap"].values.astype(np.int64))
    s = slice(np.searchsorted(idx, pd.Timestamp(a)) if a is not None else 20, None)
    idx, nav, low, Lh, mmf = idx[s], nav[s], low[s], Lh[s], mmf[s]
    nav = nav / nav[0]; low = low / (nav[0] if nav[0] > 0 else 1)
    cash = np.cumprod(1 + np.r_[0, mmf[1:]])
    E = nav / cash
    El = np.r_[1.0, low[1:] / cash[1:]]
    rex = np.r_[0, E[1:] / np.where(E[:-1] > 0, E[:-1], np.nan) - 1]
    rex = np.nan_to_num(rex, nan=0.0)
    nyr = len(E) / 260
    ruined = E[-1] <= 0
    ann = (E[-1] ** (1 / nyr) - 1) * 100 if not ruined else -100.0
    sh = rex.mean() / (rex.std() + 1e-12) * np.sqrt(260)
    held = np.r_[False, Lh[:-1] > 0]          # position carried into day t
    sh_act = rex[held].mean() / (rex[held].std() + 1e-12) * np.sqrt(260) if held.sum() > 20 else np.nan
    peak = np.maximum.accumulate(E)
    dd = np.min(np.r_[El[1:] / peak[:-1], E / peak]) - 1
    jump = np.min(np.r_[0, El[1:] / np.where(E[:-1] > 0, E[:-1], np.nan) - 1][~np.isnan(np.r_[0, El[1:] / np.where(E[:-1] > 0, E[:-1], np.nan) - 1])])
    jd = idx[1:][np.nanargmin(El[1:] / np.where(E[:-1] > 0, E[:-1], np.nan))] if held.any() else None
    act_yrs = held.sum() / 260
    ex_series = pd.Series(rex, idx)
    return dict(start=idx[0].date(), end=idx[-1].date(), yrs=round(nyr, 1), act_yrs=round(act_yrs, 2),
                ann_ex=ann, sharpe=sh, sharpe_act=sh_act, maxdd=dd * 100, jump=jump * 100,
                jump_date=jd.date() if jd is not None and jump < 0 else None, nliq=nl, ntr=ntr,
                ruined=bool(ruined), avgL_act=float(Lh[Lh > 0].mean()) if (Lh > 0).any() else 0.0), ex_series


SAMPLES = {c: (None, None) for c in CCYS}
SAMPLES["TRY"] = ("2005-03-01", "2017-12-29")      # requested out-of-filter-window TRY test
SAMPLES["BRL"] = ("2005-11-01", None)                # Yahoo BRL=X has a 410-business-day hole 2004-08..2005-10
SAMPLES["RUB"] = ("2006-06-01", "2022-02-18")        # 92-day hole in 2006; stop before the 2022 sanctions
EXTRA = {"TRY18": ("TRY", "2018-01-02", "2026-10-16"), "TRYall": ("TRY", "2005-03-01", "2026-10-16")}


def all_runs(filters=("r5", "r0", "unc", "c0"), Lmaxes=(3, 5), maints=(0.075, 0.0825), highs=("high", "high_raw")):
    rows, series = [], {}
    targets = [(c, c) + SAMPLES[c] for c in CCYS] + [(k, v[0], v[1], v[2]) for k, v in EXTRA.items()]
    for name, ccy, a, b in targets:
        p = load(ccy, a, b)
        for f in filters:
            for Lm in Lmaxes:
                for mt in maints:
                    for hi in highs:
                        r, ex = evaluate(p, f, Lm, mt, hi, a)
                        r.update(name=name, filt=f, Lmax=Lm, maint=mt, high=hi)
                        rows.append(r)
                        series[(name, f, Lm, mt, hi)] = ex
    return pd.DataFrame(rows), series


if __name__ == "__main__":
    df, series = all_runs()
    df.to_csv(H / "results_all.csv", index=False)
    pd.to_pickle(series, H / "series.pkl")
    pd.set_option("display.width", 250); pd.set_option("display.max_rows", 500)
    base = df[(df.maint == 0.075) & (df.high == "high")]
    cols = ["name", "start", "end", "act_yrs", "ann_ex", "sharpe", "sharpe_act", "maxdd", "jump", "jump_date", "nliq", "ruined", "avgL_act"]
    for f in ["r5", "r0", "unc", "c0"]:
        for Lm in (3, 5):
            print(f"\n=== filter={f} Lmax={Lm} maint 7.5% filtered-high ===")
            print(base[(base.filt == f) & (base.Lmax == Lm)][cols].round(2).to_string(index=False))
