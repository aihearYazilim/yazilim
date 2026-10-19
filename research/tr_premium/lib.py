import pathlib, numpy as np, pandas as pd
RAW = pathlib.Path(__file__).resolve().parent / "raw"
OOS0, OOS1 = pd.Timestamp("2025-10-17", tz="UTC"), pd.Timestamp("2026-10-17", tz="UTC")
def ld(name, col="close"):
    df = pd.read_csv(RAW / name, parse_dates=["t"]).set_index("t")
    return df
def hourly():
    P = {}
    for f in ["bn_USDTTRY_1h","bn_BTCTRY_1h","bn_ETHTRY_1h","bn_BTCUSDT_1h","bn_ETHUSDT_1h","bn_BUSDTRY_1h","bn_FDUSDTRY_1h","bn_USDCTRY_1h",
              "bt_USDTTRY_60","bt_BTCTRY_60","bt_ETHTRY_60","bt_BTCUSDT_60","bt_USDCTRY_60"]:
        d = ld(f + ".csv"); P[f.rsplit("_",1)[0]] = d
    return P
def monthly_geo(eq):
    m = eq.resample("ME").last()
    m = pd.concat([eq.iloc[:1], m])
    r = m.pct_change().dropna()
    n = len(r)
    return (eq.iloc[-1] / eq.iloc[0]) ** (1 / max(n, 1)) - 1, r
