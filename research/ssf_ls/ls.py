"""Long-short / long-hedged BIST strategies on VİOP single-stock futures (SSF).

Timing: signals from SPOT data (research/bist_all, adjusted close) at close of t (lag=0) or t-1 (lag=1);
futures positions are set at the t settlement price (VİOP settle ~ last-10-min VWAP, close-equivalent), P&L from t+1
on the held contract (settle/prev_settle). Positions drift with prices between rebalances.
Universe at t: underlyings with a listed SSF (held front contract) AND spot score AND liquidity:
  20d median TL traded value of all SSF months of that underlying >= LIQ_X * target position notional
  (LIQ_X = 50 -> position <= 2% of daily futures value; capital CAP TL nominal).
Limit moves: a spot close at the +limit blocks buying (incl. covering shorts), a close at -limit blocks selling
(incl. opening shorts) on that day (VİOP SSF have the same daily price limits as the underlying).
Costs per unit of notional traded: commission COMM (0.04%) + slippage by 20d median futures value
  >=200M TL 0.10%, >=50M 0.15%, >=10M 0.20%, else 0.30%. Roll: on the roll day each open SSF position is closed
  and re-opened in the next month -> 2x |w| traded at the same rate (conservative, calendar spreads are cheaper).
XU030 index-future hedge: 0.02% + 0.03% per unit, roll cost 2x.
Collateral: whole equity is TL cash collateral; earns `coll` daily rate series (0 or overnight deposit net of stopaj).
Margin: initial margin IM (20% of notional, Takasbank PSR for liquid names ~15-25%); if the drifted gross notional
exceeds equity/(0.75*IM) (maintenance breach) the book is cut back to the target gross at cost on that day.
"""
import sys, pathlib, numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; ROOT = H.parents[1]
sys.path.insert(0, str(ROOT / "research/bist_all")); sys.path.insert(0, str(ROOT / "research/combo"))
sys.path.insert(0, str(ROOT / "src")); sys.path.insert(0, str(H))
sys.dont_write_bytecode = True
import common as BC, signals as SG, deposit_v5 as DP, build as B
from engine import stats

COMM = 0.0004; IM = 0.20; CAP = 1_000_000; LIQ_X = 50
# capital is 1M TL in OOS money; earlier years deflated by approx. annual TÜFE (Dec/Dec, TÜİK) so that the liquidity
# filter is equally strict in real terms (a nominal 1M TL in 2018 would be ~15x larger in real terms).
CPI_YOY = {2017: .119, 2018: .203, 2019: .118, 2020: .146, 2021: .361, 2022: .643, 2023: .648, 2024: .444,
           2025: .31, 2026: .25}


def cap_series(days):
    lvl = {}; x = 1.0
    for y in sorted(CPI_YOY):
        x *= 1 + CPI_YOY[y]; lvl[y] = x
    s = pd.Series([lvl[d.year] / (1 + CPI_YOY[d.year]) * (1 + CPI_YOY[d.year]) ** (d.dayofyear / 365) for d in days],
                  index=days)
    return CAP * s / s.loc[OOS_START:].iloc[0]
OOS_START, OOS_END, IS_START = BC.OOS_START, BC.OOS_END, pd.Timestamp("2018-01-01")

_D = {}


def data(roll_td=3):
    key = ("D", roll_td)
    if key in _D:
        return _D[key]
    P = BC.load_all()
    S = SG.build(P)
    W = B.load(roll_td)
    days = W["fret"].index.intersection(P["days"])
    unds = [u for u in W["fret"].columns if u != "XU030" and u in P["stocks"]]
    D = dict(days=days, unds=unds)
    for k in ["fret", "roll", "fvalall", "fset", "fexp", "fval", "oi"]:
        D[k] = W[k].reindex(index=days, columns=unds)
    D["roll"] = D["roll"].fillna(False).astype(bool)
    D["xret"] = W["fret"]["XU030"].reindex(days)
    D["xroll"] = W["roll"]["XU030"].reindex(days).fillna(False).astype(bool)
    for k in ["ret", "raw", "lim_up", "lim_dn", "traded", "turn"]:
        D[k] = P[k].reindex(index=days, columns=unds)
    D["S"] = {k: v.reindex(index=days, columns=unds) for k, v in S.items()}
    # spot betas vs XU030 (120d, t-information)
    xr = P["xu"]["XU030"].pct_change().reindex(days)
    sr = P["ret"].reindex(index=days, columns=unds)
    cov = sr.rolling(120, min_periods=60).cov(xr); var = xr.rolling(120, min_periods=60).var()
    D["beta"] = cov.div(var, axis=0).clip(0.2, 2.5)
    D["medval"] = D["fvalall"].fillna(0).rolling(20, min_periods=10).median()
    D["xu030_spot"] = P["xu"]["XU030"].reindex(days)
    D["ew_reg"] = SG.regimes(P)["ew20"].reindex(days).fillna(False)
    D["xu_reg"] = SG.regimes(P)["sma50"].reindex(days).fillna(False)
    D["dep_on"] = DP.on_bday(pd.DatetimeIndex(days))
    _D[key] = D
    return D


def zs(df):
    m = df.mean(axis=1); s = df.std(axis=1)
    return df.sub(m, axis=0).div(s.replace(0, np.nan), axis=0).clip(-3, 3)


COMPOSITES = {
    "c_all": [("mom252_21", 1), ("h52", 1), ("lowvol60", 1), ("rev5", 0.5)],
    "c_mom_h52": [("mom252_21", 1), ("h52", 1)],
    "c_h52_lowvol": [("h52", 1), ("lowvol60", 1)],
    "c_mom_lowvol": [("mom252_21", 1), ("lowvol60", 1)],
    "c_mom_rev": [("mom126_21", 1), ("rev5", 0.5)],
}


def score(D, name, elig):
    """score restricted to the eligible SSF universe; composites z-scored within that universe."""
    if name in COMPOSITES:
        out = None
        for k, wt in COMPOSITES[name]:
            z = zs(D["S"][k].where(elig)) * wt
            out = z if out is None else out + z
        return out.where(elig)
    return D["S"][name].where(elig)


def slip(mv):
    return np.where(mv >= 2e8, 0.0010, np.where(mv >= 5e7, 0.0015, np.where(mv >= 1e7, 0.0020, 0.0030)))


def simulate(D, sig="c_all", K=5, reb=21, mode="dn", gross=2.0, lag=0, coll="dep", start="2017-06-01",
             slip_mult=1.0, comm=COMM, regime=None, min_names=6, details=False, cap_mult=1.0):
    """mode: 'dn' dollar-neutral L/S (long top K, short bottom K, each leg gross/2);
             'bn' beta-neutral: as dn plus XU030 future to zero net spot beta;
             'lo' long-only top K (gross) unhedged; 'loh' long top K, hedged with XU030 to beta 0 when regime off;
             'lor' long top K when regime on, flat (cash) when off;
             'lx' long top K + XU030 short always (beta-neutral 'alpha' book).
    regime: 'ew20' / 'sma50' (used by loh/lor)."""
    days = D["days"]; n = len(D["unds"])
    fr = D["fret"].values; roll = D["roll"].values; mv = D["medval"].values
    xr = D["xret"].fillna(0).values; xroll = D["xroll"].values
    up = D["lim_up"].fillna(False).values; dn_ = D["lim_dn"].fillna(False).values
    beta = D["beta"].values
    cr = D["dep_on"].values if coll == "dep" else np.zeros(len(days))
    reg = np.ones(len(days), bool)
    if regime:
        reg = (D["ew_reg"] if regime == "ew20" else D["xu_reg"]).shift(lag).fillna(False).values.astype(bool)
    has = D["fset"].notna().values
    long_only = mode in ("lo", "loh", "lor", "lx")
    per_pos = cap_series(days) * gross / (K if long_only else 2 * K) * cap_mult
    elig = (D["fset"].notna() & D["medval"].ge(LIQ_X * per_pos, axis=0) & D["S"]["mom252_21"].notna()
            & D["S"]["lowvol60"].notna())
    sc = score(D, sig, elig)
    if lag:
        sc = sc.shift(lag).where(elig)
    scv = sc.values
    t0 = days.searchsorted(pd.Timestamp(start))
    w = np.zeros(n); h = 0.0
    out = np.zeros(len(days)); tov = np.zeros(len(days)); gr = np.zeros(len(days)); ncall = 0
    cf = (cap_series(days) / CAP).values[:, None]          # slippage tiers in OOS-money (real) terms
    s_mult = slip(np.nan_to_num(mv) / cf) * slip_mult + comm
    for t in range(t0, len(days)):
        if t > t0:
            r = np.nan_to_num(fr[t])
            g = (w * r).sum() + h * xr[t] + cr[t]
            w = w * (1 + r) / (1 + g); h = h * (1 + xr[t]) / (1 + g)
            # roll costs (positions rolled at close of t into next month)
            rc = (np.abs(w) * roll[t] * 2 * s_mult[t]).sum() + (abs(h) * 2 * 0.0005 if xroll[t] else 0.0)
            g -= rc
            out[t] = g
            # contract disappeared (delisted SSF) -> forced close at last settle
            lost = (np.abs(w) > 0) & ~has[t]
            if lost.any():
                out[t] -= (np.abs(w[lost]) * 0.003).sum(); w[lost] = 0
        do = (t - t0) % reb == 0 or (regime and t > t0 and reg[t] != reg[t - 1])
        gsum = np.abs(w).sum() + abs(h)
        if not do and gsum > 1 / (0.75 * IM):
            do = True; ncall += 1
        if do:
            row = scv[t]; ok = ~np.isnan(row)
            tgt = np.zeros(n); th = 0.0
            if ok.sum() >= (min_names if not long_only else K):
                idx = np.where(ok)[0]
                order = idx[np.argsort(-row[idx], kind="stable")]
                if long_only:
                    on = reg[t] if mode in ("loh", "lor") else True
                    if on or mode == "loh":
                        tgt[order[:K]] = gross / K
                    if mode == "lor" and not on:
                        tgt[:] = 0
                    if mode == "lx" or (mode == "loh" and not on):
                        th = -np.nansum(tgt * np.nan_to_num(beta[t], nan=1.0))
                else:
                    k = min(K, len(order) // 2)
                    tgt[order[:k]] = gross / 2 / k
                    tgt[order[-k:]] = -gross / 2 / k
                    if mode == "bn":
                        th = -np.nansum(tgt * np.nan_to_num(beta[t], nan=1.0))
            # limit-move constraints
            new = tgt.copy()
            buy_block = up[t]; sell_block = dn_[t]
            inc = new > w; dec = new < w
            new[inc & buy_block] = w[inc & buy_block]
            new[dec & sell_block] = w[dec & sell_block]
            new[~has[t]] = 0
            dw = np.abs(new - w)
            c = (dw * s_mult[t]).sum() + abs(th - h) * 0.0005
            out[t] -= c; tov[t] = dw.sum() + abs(th - h)
            w = new; h = th
        gr[t] = np.abs(w).sum() + abs(h)
    s = pd.Series(out, index=days).iloc[t0:]
    if details:
        return s, dict(tov=pd.Series(tov, index=days).iloc[t0:], gross=pd.Series(gr, index=days).iloc[t0:],
                       ncall=ncall, nelig=elig.sum(axis=1))
    return s


def summ(r, extra=None):
    eq = (1 + r).cumprod()
    i = stats(eq, IS_START, OOS_START - pd.Timedelta(days=1)); o = stats(eq, OOS_START, OOS_END)
    d = dict(IS=i.get("aylik_geo_%"), IS_dd=i.get("maxDD_%"), IS_worst=i.get("en_kotu_ay_%"),
             OOS=o.get("aylik_geo_%"), OOS_dd=o.get("maxDD_%"), OOS_worst=o.get("en_kotu_ay_%"),
             OOS_neg=o.get("negatif_ay"))
    if extra:
        d.update(extra)
    return d
