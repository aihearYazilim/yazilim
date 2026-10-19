"""v5 sleeves (no funds): BIST-C (bist_all fixed config c_all/ew20/top20/21d, lag1 primary, lag0 sensitivity) re-simulated
with idle cash (regime off / unfilled slots) in the OVERNIGHT bank account (deposit_v5 'ON', net of stopaj) instead of
the PPF; MM column replaced by the ON deposit return and a D32 column (no-break 32-day deposit, standalone reference).
KELLY (lev_trend B, USD collateral, pre-tax) kept as is (no TL fund involved).  Output results/sleeves_v5.pkl."""
import sys, pathlib
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; ROOT = H.parents[1]
sys.path.insert(0, str(H)); sys.path.insert(0, str(ROOT / "research/bist_all")); sys.path.insert(0, str(ROOT / "src"))
sys.dont_write_bytecode = True
import common as BC, signals as SG
import deposit_v5 as DP
from sleeves_v2 import CFG, to_bday

OUT = H / "results"


def build():
    P = BC.load_all(); S = SG.build(P); R = SG.regimes(P)
    days = P["days"]
    P["cash"] = DP.on_bday(pd.DatetimeIndex(days))       # overnight deposit, calendar-day accrual, net of stopaj
    sl = pd.read_pickle(OUT / "sleeves_v2.pkl")[["KELLY", "C_L1", "C_L0"]].rename(columns={"C_L1": "C_L1_ppf", "C_L0": "C_L0_ppf"})
    for lag in (0, 1):
        r = BC.simulate(P, S[CFG["sig"]], top=CFG["top"], rebalance=CFG["reb"], regime=R[CFG["reg"]], lag=lag)
        sl[f"C_L{lag}"] = to_bday(r, sl.index)
        print("lag", lag, BC.summarize(r))
    sl["ON"] = DP.on_bday(sl.index)
    d = DP.Deposit(sl.index, "D32"); d.deposit(1.0, 0); v = [1.0]
    for i in range(1, len(sl)): d.step(i); v.append(d.value())
    sl["D32"] = pd.Series(v, sl.index).pct_change().fillna(0)
    sl.to_pickle(OUT / "sleeves_v5.pkl")
    return sl


if __name__ == "__main__":
    sl = build()
    for a, b in [("2022-01-01", "2025-10-16"), ("2025-10-17", "2026-10-16")]:
        x = sl.loc[a:b]; d = (x.index[-1] - x.index[0]).days
        print(a, ((1 + x).prod() ** (30.4375 / d) - 1).round(4).to_dict())
