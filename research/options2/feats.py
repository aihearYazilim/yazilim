"""Regime features per (cur, day) — every value uses only information available before day 09:00 UTC:
chain features come from the PREVIOUS day's morning chain; DVOL/RV from previous daily closes; funding up to 08:00.
Columns: dvol, rv30, vrp(=dvol-rv30), vrp_r(=dvol/rv30), atm7, atm30, ts(=atm7-atm30), ts_r(atm7/atm30),
rr25_7 (25d put IV - 25d call IV, 7d), rr25_30, fund7 (annualised mean hourly funding, 7d), basis (annualised ~90d),
and for each col its trailing 365-day median (<col>_med365, ending the day before)."""
import numpy as np, pandas as pd
import eng
from fbs import strike_for_delta
dd = eng.data()
rows = []
for (cur, day), exs in dd["EXP"].items():
    t0 = pd.Timestamp(day) + pd.Timedelta(hours=9)
    r = dict(cur=cur, cday=day)
    pts = []
    for e in exs:
        x, v, b, T = dd["SM"][(cur, day, e)]
        T = (e - t0).total_seconds() / 31536000
        if T <= 0.5 / 365: continue
        atm = float(np.interp(0.0, x, v)); pts.append((T, atm, e, b))
    if not pts: continue
    Ts = np.array([p[0] for p in pts]); A = np.array([p[1] for p in pts])
    w = A * A * Ts
    def atm_at(days):
        t = days / 365
        if t <= Ts.min(): return A[0]
        if t >= Ts.max(): return A[-1]
        return float(np.sqrt(np.interp(t, Ts, w) / t))
    r["atm7"], r["atm30"], r["atm90"] = atm_at(7), atm_at(30), atm_at(90)
    for tag, days in (("7", 7), ("30", 30)):
        i = int(np.argmin(np.abs(Ts - days / 365))); e = pts[i][2]
        sm = eng.Smile((cur, day, e)); T = Ts[i]
        Kp = sm.strike(1.0, T, -0.25, False, clamp=False); Kc = sm.strike(1.0, T, 0.25, True, clamp=False)
        r["rr25_" + tag] = float(sm.iv(np.log(Kp)) - sm.iv(np.log(Kc)))
    j = int(np.argmin(np.abs(Ts - 90 / 365))); r["basis"] = pts[j][3]
    rows.append(r)
C = pd.DataFrame(rows)
# shift chain features to next calendar day (use yesterday's chain)
C["day"] = (pd.to_datetime(C.cday) + pd.Timedelta(days=1)).dt.strftime("%Y-%m-%d")
out = []
for cur in ("BTC", "ETH"):
    c = C[C.cur == cur].set_index("day").drop(columns=["cur", "cday"])
    idx = pd.date_range("2021-04-02", "2026-10-17", freq="D")
    c.index = pd.to_datetime(c.index); c = c.reindex(idx).ffill(limit=3)
    dv = dd["dv"][cur]; px = dd["px"][cur]
    c["dvol"] = dv.reindex(idx - pd.Timedelta(days=1)).values
    lr = np.log(px).diff()
    rv = lr.rolling(30).std() * np.sqrt(365) * 100
    c["rv30"] = rv.reindex(idx - pd.Timedelta(days=1)).values
    c["vrp"] = c.dvol - c.rv30; c["vrp_r"] = c.dvol / c.rv30
    c["ts"] = c.atm7 - c.atm30; c["ts_r"] = c.atm7 / c.atm30
    f = dd["fund"][cur]
    f7 = f.rolling(24 * 7, min_periods=24).mean() * 24 * 365
    c["fund7"] = f7.reindex(idx + pd.Timedelta(hours=8), method="ffill").values
    for col in list(c.columns):
        med = c[col].rolling(365, min_periods=180).median().shift(1)
        if col == "dvol":   # dvol median as in the original rule: last 365 closes incl. yesterday
            med = c[col].rolling(365, min_periods=180).median()
        c[col + "_med365"] = med
    c["cur"] = cur; c.index = c.index.strftime("%Y-%m-%d"); c.index.name = "day"
    out.append(c.reset_index())
F = pd.concat(out).set_index(["cur", "day"]).sort_index()
F.to_pickle(eng.D / "raw" / "feats.pkl")
print(F.describe().T.round(3).to_string())
