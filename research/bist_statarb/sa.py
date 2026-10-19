"""BIST statistical arbitrage on VİOP single-stock futures (SSF) - common data + weight-based simulator.

Data: research/ssf_ls continuous front-month SSF (raw/cont_r3.pkl, roll 3 trading days before expiry), spot
limit flags / betas from research/bist_all, overnight deposit (net of stopaj) from deposit_v5 for collateral.
Prices for signals: futures total-return index LP = cumsum(log(1+fret)) (settle-to-settle, roll gaps removed).
Timing: a signal uses settles up to and including t; the trade is executed at the settle of t+1 (EXEC_LAG=1),
P&L from t+2.  (settle ~ last-10-min VWAP; the signal is only known after the session -> next settlement.)
Costs: commission 0.04% + slippage by 20d median futures TL value (>=200M 0.10%, >=50M 0.15%, >=10M 0.20%,
else 0.30%; tiers in OOS-money terms), rolls charged 2x|w| at the same rate. Delisted contract -> 0.30% forced close.
Limit moves: spot close at +limit blocks increasing a weight, at -limit blocks decreasing it (that day).
Margin: IM 20%; gross > 1/(0.75 IM) -> scale back to target at cost (not binding at <=4x).
Collateral: equity earns `coll` = 'dep' (overnight deposit net) or 0.
Liquidity: each leg notional <= 2% of 20d median SSF TL value (LIQ_X=50) at capital 1M TL (CPI-deflated pre-OOS).
"""
import sys, pathlib, pickle, numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; ROOT = H.parents[1]
sys.path.insert(0, str(ROOT / "research/ssf_ls")); sys.path.insert(0, str(ROOT / "src"))
sys.dont_write_bytecode = True
from engine import stats

OOS_START = pd.Timestamp("2025-10-17"); OOS_END = pd.Timestamp("2026-10-16"); IS_START = pd.Timestamp("2018-01-01")
COMM = 0.0004; IM = 0.20; LIQ_X = 50; CAP = 1_000_000

GROUPS = {
    "banks": ["AKBNK", "GARAN", "YKBNK", "ISCTR", "HALKB", "VAKBN", "SKBNK", "TSKB"],
    "holdings": ["KCHOL", "SAHOL", "DOHOL", "ALARK", "ENKAI", "TKFEN"],
    "koc": ["KCHOL", "TUPRS", "FROTO", "TOASO", "ARCLK", "YKBNK"],
    "sabanci": ["SAHOL", "AKBNK", "AKSEN", "ENJSA", "CIMSA", "TURSG"],
    "steel": ["EREGL", "KRDMD", "BRSAN"],
    "metals": ["TRALT", "TRMET", "KRDMD", "EREGL"],
    "aviation": ["THYAO", "PGSUS", "TAVHL"],
    "telecom": ["TCELL", "TTKOM"],
    "retail": ["BIMAS", "MGROS", "SOKM"],
    "auto": ["FROTO", "TOASO", "DOAS", "KARSN", "ARCLK"],
    "energy": ["AKSEN", "ENJSA", "ODAS", "ALARK", "ASTOR", "KONTR"],
    "petchem": ["TUPRS", "PETKM", "SASA"],
    "food": ["AEFES", "CCOLA", "ULKER"],
    "gyo": ["EKGYO", "ISGYO", "TRGYO"],
    "agri": ["GUBRF", "HEKTS", "ALKIM"],
    "cement": ["CIMSA", "OYAKC"],
    "isbank": ["ISCTR", "SISE", "TSKB", "ISGYO", "ISFIN"],
}


def cap_series(days):
    import ls
    return ls.cap_series(days)


def load():
    p = H / "raw/D.pkl"
    if p.exists():
        return pickle.load(open(p, "rb"))
    import ls
    D0 = ls.data()
    D = {k: D0[k] for k in ["days", "unds", "fret", "roll", "fset", "medval", "lim_up", "lim_dn", "beta", "dep_on", "xret",
                            "xroll", "ret"]}
    D["capser"] = ls.cap_series(D["days"])
    pickle.dump(D, open(p, "wb"))
    return D


def slip(mv):
    return np.where(mv >= 2e8, 0.0010, np.where(mv >= 5e7, 0.0015, np.where(mv >= 1e7, 0.0020, 0.0030)))


def prep(D):
    if "LP" in D:
        return D
    fr = D["fret"]
    D["LP"] = np.log1p(fr.fillna(0)).cumsum().where(fr.notna())
    cf = (D["capser"] / CAP).values[:, None]
    D["smult"] = slip(np.nan_to_num(D["medval"].values) / cf) + COMM
    D["has"] = D["fset"].notna().values
    return D


def simulate(D, tgt, act, coll="dep", start="2017-09-01", slip_mult=1.0, details=False, gross_scale=1.0, comm=COMM):
    """tgt: T x n target weights (fraction of equity) valid when act[t, j] is True (executed at settle t).
    Names with act False keep their drifted weight.  Returns daily net returns."""
    prep(D)
    days = D["days"]; T, n = tgt.shape
    fr = D["fret"].values; roll = D["roll"].values
    up = D["lim_up"].fillna(False).values; dn = D["lim_dn"].fillna(False).values
    has = D["has"]
    sm = (D["smult"] - COMM) * slip_mult + comm
    cr = D["dep_on"].values if coll == "dep" else np.zeros(T)
    t0 = days.searchsorted(pd.Timestamp(start))
    w = np.zeros(n)
    out = np.zeros(T); tov = np.zeros(T); gr = np.zeros(T); WH = np.zeros((T, n)) if details else None
    tg = np.nan_to_num(tgt) * gross_scale
    for t in range(t0, T):
        if t > t0:
            r = np.nan_to_num(fr[t])
            g = (w * r).sum() + cr[t]
            w = w * (1 + r) / (1 + g)
            g -= (np.abs(w) * roll[t] * 2 * sm[t]).sum()
            out[t] = g
            lost = (w != 0) & ~has[t]
            if lost.any():
                out[t] -= (np.abs(w[lost]) * 0.003).sum(); w[lost] = 0
        a = act[t].copy()
        if np.abs(w).sum() > 1 / (0.75 * IM):
            a[:] = True
        if a.any():
            new = w.copy(); new[a] = tg[t, a]
            new[~has[t]] = 0
            inc = new > w; dec = new < w
            new[inc & up[t]] = w[inc & up[t]]
            new[dec & dn[t]] = w[dec & dn[t]]
            dw = np.abs(new - w)
            out[t] -= (dw * sm[t]).sum(); tov[t] = dw.sum()
            w = new
        gr[t] = np.abs(w).sum()
        if details:
            WH[t] = w
    s = pd.Series(out, index=days).iloc[t0:]
    if details:
        return s, dict(tov=pd.Series(tov, index=days).iloc[t0:], gross=pd.Series(gr, index=days).iloc[t0:], W=WH)
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


def collat_only(D, coll="dep"):
    """benchmark: pure collateral interest (no positions)."""
    T = len(D["days"]); n = len(D["unds"])
    return simulate(D, np.zeros((T, n)), np.zeros((T, n), bool), coll=coll)


def capacity(D, WH, start=OOS_START, end=OOS_END):
    """median over OOS days with positions of the capital (TL) at which the largest |w_j| / (2% of 20d median SSF
    value) binds; returned in OOS money."""
    days = D["days"]; m = (days >= start) & (days <= end)
    W = np.abs(WH[m]); mv = np.nan_to_num(D["medval"].values[m])
    with np.errstate(divide="ignore", invalid="ignore"):
        c = np.where(W > 1e-6, mv / sa_liq() / W, np.inf).min(axis=1)
    c = c[np.isfinite(c)]
    return float(np.median(c)) if len(c) else np.nan


def sa_liq():
    return LIQ_X
