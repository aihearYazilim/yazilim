"""Levered TRY carry sketch: collateral in TRY MMF + short USD/TRY notional L (synthetic forward priced at
covered interest parity: TRY MMF rate vs USD 4.5%). Instrument would be VIOP USDTRY futures (not crypto: there is no
TRY-funded USDT short for TR residents on crypto venues). Optional trend filter: carry only when USDTRY < its k-day max*(1+b)
or 20d vol < v. Leverage/filter chosen on IS only."""
import itertools, sys, numpy as np, pandas as pd
sys.path.insert(0, "/home/user/yazilim/src")
from engine import cash_rate_daily
from lib import monthly_geo
S = pd.read_csv("/home/user/yazilim/data/bist/USDTRY.csv", index_col=0, parse_dates=True)["close"]
S = S[S.index >= "2020-06-01"]
gap = pd.Series(S.index, S.index).diff().dt.days.fillna(1)
mmf = (1 + cash_rate_daily(S.index)) ** gap - 1
usd = (1.045) ** (gap / 365) - 1
pol = (1 + cash_rate_daily(S.index) / 0.9) ** gap - 1   # gross policy rate for forward points
ds = S.pct_change().fillna(0)
carry_unit = (pol - usd) - ds                            # P&L of short 1 USD notional per TRY of collateral
vol20 = np.log(S).diff().rolling(20).std() * np.sqrt(252)
IS = (S.index >= "2021-01-01") & (S.index < "2025-10-17"); OOS = (S.index >= "2025-10-17") & (S.index < "2026-10-17")
def ev(r, m):
    eq = (1 + r[m]).cumprod(); eq.index = eq.index.tz_localize("UTC")
    if (eq <= 0.05).any(): return -100, -100, -100
    g, mr = monthly_geo(pd.concat([pd.Series([1.0], [eq.index[0] - pd.Timedelta(days=1)]), eq]))
    return g * 100, ((eq / eq.cummax()) - 1).min() * 100, mr.min() * 100
rows = []
FEE = 0.0005   # VIOP commission+slippage per notional switch
for L, vmax in itertools.product([0, 1, 2, 3, 5], [None, 0.10, 0.15, 0.25]):
    on = pd.Series(1.0, S.index) if vmax is None else (vol20 < vmax).astype(float).shift(1).fillna(0)
    r = mmf + L * on * carry_unit - L * on.diff().abs().fillna(0) * FEE
    r = r.clip(lower=-1)
    gi = ev(r, IS); go = ev(r, OOS)
    rows.append(dict(L=L, volmax=vmax, IS=gi[0], ISdd=gi[1], OOS=go[0], OOSdd=go[1], worstm=go[2]))
R = pd.DataFrame(rows); print(R.round(2).to_string(index=False)); print("combos", len(R))
R.to_csv("raw/carry_grid.csv", index=False)
