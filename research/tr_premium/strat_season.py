"""Hour-of-week seasonality of USDT/TRY (Binance & BtcTurk): hold USDT during a weekly window, else TRY MMF.
Windows chosen on IS only. Cost 0.15%+0.02% per side; MMF accrual lost while in USDT."""
import itertools, sys, numpy as np, pandas as pd
sys.path.insert(0, "/home/user/yazilim/src")
from engine import POLICY
from lib import *
P = hourly()
px = P["bt_USDTTRY"].close
px = px[px.index >= "2021-01-01"]
r = px.pct_change().fillna(0)
pol = pd.Series(np.nan, px.index)
for k, v in sorted(POLICY.items()): pol[pol.index >= pd.Timestamp(k + "-01", tz="UTC")] = v
mmf_h = (1 + pol.ffill() * 0.9 / 100) ** (1 / 8760) - 1
how = px.index.dayofweek * 24 + px.index.hour
isx = px.index < OOS0
excess = (r - mmf_h)
prof = excess[isx].groupby(how[isx]).mean() * 1e4
print("IS mean excess return of USDT over MMF by weekday (bp per hour, summed over day):")
print(prof.groupby(prof.index // 24).sum().round(2).to_string())
o = excess[~isx & (px.index < OOS1)]; po = o.groupby(how[~isx & (px.index < OOS1)]).mean() * 1e4
print("OOS same:"); print(po.groupby(po.index // 24).sum().round(2).to_string())
FEE = 0.0017
rows = []
for start, dur in itertools.product(range(0, 168, 6), [6, 12, 24, 48, 72]):
    hrs = (np.arange(start, start + dur) % 168)
    w = pd.Series(np.isin(how, hrs).astype(float), px.index)
    # w at bar t means hold during bar t (decided in advance: calendar rule, no look-ahead)
    net = w * r + (1 - w) * mmf_h - w.diff().abs().fillna(0) * FEE
    eq = (1 + net).cumprod()
    gi, _ = monthly_geo(eq[isx]); oos = eq[~isx & (eq.index < OOS1)]; go, mr = monthly_geo(oos / oos.iloc[0])
    rows.append(dict(start=start, dur=dur, IS=gi * 100, OOS=go * 100, OOSdd=((oos / oos.cummax()) - 1).min() * 100, worstm=mr.min() * 100))
R = pd.DataFrame(rows).sort_values("IS", ascending=False)
eqm = (1 + mmf_h).cumprod(); gm, _ = monthly_geo(eqm[isx]); om = eqm[~isx & (eqm.index < OOS1)]; gom, _ = monthly_geo(om / om.iloc[0])
print(f"MMF-only hourly accrual: IS {gm*100:.3f} OOS {gom*100:.3f}; combos {len(R)}")
print(R.head(8).round(3).to_string(index=False))
R.to_csv(RAW / "season_grid.csv", index=False)
