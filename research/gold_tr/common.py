import pathlib, sys, numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(H.parents[1]/"src"))
from engine import POLICY, stats
OOS0, OOS1 = pd.Timestamp("2025-10-17"), pd.Timestamp("2026-10-16")
def policy(index):
    s = pd.Series(np.nan, index=index)
    for k, v in sorted(POLICY.items()):
        s[s.index >= pd.Timestamp(k + "-01")] = v
    return s.ffill().fillna(10.0)/100
def dep_daily(index, mult=0.85):
    """net TL deposit: policy x 0.85 (17.5% withholding approx, protocol) -> daily compounding per calendar day gap"""
    r = policy(index)*mult
    gap = pd.Series(index, index=index).diff().dt.days.fillna(1).values
    return (1+r)**(gap/365)-1
def rep(eq, name=""):
    a = stats(eq, None, OOS0 - pd.Timedelta(days=1)); b = stats(eq, OOS0, OOS1)
    return {"name": name, "IS_geo": a.get("aylik_geo_%"), "IS_dd": a.get("maxDD_%"), "OOS_geo": b.get("aylik_geo_%"),
            "OOS_dd": b.get("maxDD_%"), "OOS_worst": b.get("en_kotu_ay_%"), "OOS_neg": b.get("negatif_ay")}
