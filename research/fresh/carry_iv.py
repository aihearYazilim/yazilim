"""TL carry (VİOP USDTRY front short on ACTUAL settlement prices, audit run_futures) — does VİOP USDTRY option
implied vol improve sizing / jump avoidance?  Window 2018-03-01..2025-10-16 IS (incl. Aug-2018, 2021, Mar-2025 shocks),
OOS 2025-10-17..2026-10-16. Cash on full NAV earns 0.85*policy (deposit/nema proxy). lag1 execution, maint 8.25%."""
import sys, pathlib, itertools, numpy as np, pandas as pd
sys.dont_write_bytecode = True
H = pathlib.Path(__file__).parent; R = H.parent
sys.path.insert(0, str(R / "try_carry_audit"))
from audit_lib import panel, corrected_rates, futures_panel, run_futures, mstats, OOS_START, OOS_END
d = panel(); polc, effc = corrected_rates(d)
F0 = futures_panel()
iv = pd.read_pickle(R / "viop_options/data/atm_USDTRY.pkl")["iv"]
iv = iv.reindex(d.index).ffill(limit=3)
lr = np.log(d["close"]).diff()
rv = lr.rolling(20).std() * np.sqrt(260)
real_ok = ((polc - d.cpi) / 100 > 0.05)
carry = (polc - d.fed) / 100
med = iv.rolling(252, min_periods=200).median()
START = "2018-03-01"
def L_of(size, tv, Lmax, filt, par):
    vol = rv if size == "rv" else iv
    L = (tv / vol).clip(upper=Lmax).fillna(0) * real_ok
    if filt == "ivmed": L = L * (iv <= par * med)
    if filt == "c2iv": L = L * (carry / iv >= par)
    if filt == "ivjump": L = L * (iv / iv.shift(5) - 1 < par)
    return L.fillna(0)
GRID = [(s, tv, Lm, f, p) for s, tvs in [("rv", [0.30]), ("iv", [0.45, 0.6, 0.75, 0.9])] for tv in tvs for Lm in [3, 5]
        for f, ps in [("none", [0]), ("ivmed", [1.0, 1.25, 1.5]), ("c2iv", [2, 3, 4]), ("ivjump", [0.2, 0.4])] for p in ps]
fd = [pd.Timestamp(x) for x in sorted(F0.date.unique()) if pd.Timestamp(x) >= pd.Timestamp(START)]
fdo = [x for x in fd if x >= pd.Timestamp("2025-10-16")]
def run(g, F=F0, dd=None, dates=None):
    L = L_of(*g) if dd is None else L_of_dd(g, dd)
    return run_futures(F, dates or fd, L, polc * 0.85, lag=1, maint=0.0825, slip=0.005)
if __name__ == "__main__":
    rows = []
    for g in GRID:
        nav, Lh, nl, nr = run(g)
        a = mstats(nav, START, "2025-10-16")
        navo, Lho, nlo, _ = run(g, dates=fdo); b = mstats(navo, OOS_START, OOS_END)
        yrs = nav.resample("YE").last().pct_change(); 
        rows.append(dict(size=g[0], tv=g[1], Lmax=g[2], filt=g[3], par=g[4], IS_geo=a["geo12"], IS_dd=a["dd"], IS_worst=a["worst"],
                         IS_liq=nl, OOS_geo=b["geo12"], OOS_dd=b["dd"], OOS_avgL=Lho.loc[OOS_START:].mean(), IS_avgL=Lh.mean()))
    df = pd.DataFrame(rows); df.to_csv(H / "carry_iv_grid.csv", index=False)
    pd.set_option("display.width", 250)
    print(len(df), "combos"); print(df.round(2).to_string(index=False))
