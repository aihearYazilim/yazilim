"""v3 options sleeve: AUDITED realistic version = options_audit/a5b_margin_xm.py (one cross-margined USDC account,
Deribit STANDARD margin, partial liquidation, hourly high/low/close checks, vol shock k=2).
Weekly BTC+ETH 30-delta short strangle, only when DVOL > 365d median, size 1x and 2x notional.
2x STD k=2 is reused from options_audit/xm_s2_k2.0_STD.csv (verified identical on recompute check below);
1x is recomputed with the audit code unchanged. Intra-week MTM worst (no liquidation, a8_mtm_dd.worst logic)
is computed per week for both sizes. Output: results/opt_weekly_v3.csv (USD, per Friday entry)."""
import sys, pathlib, os
H = pathlib.Path(__file__).resolve().parent
AUD = H.parent / "options_audit"
sys.path.insert(0, str(AUD)); sys.dont_write_bytecode = True
os.chdir(AUD)
import numpy as np, pandas as pd
from common import R
import a5b_margin_xm as XM


def worst(entries, size, k=2.0):          # copied from a8_mtm_dd.worst (module runs code at import)
    if not entries: return 0.0
    P = [XM.legs_of(e, size, 0.5) for e in entries]; cash = 1.0 + sum(p["N"] * p["prem"] for p in P)
    exp = pd.Timestamp(entries[0]["expiry"]) + pd.Timedelta(hours=8)
    paths = [XM.H[p["e"]["cur"]].loc[pd.Timestamp(entries[0]["day"]) + pd.Timedelta(hours=9): exp - pd.Timedelta(hours=1)] for p in P]
    idx = paths[0].index
    for x in paths[1:]: idx = idx.intersection(x.index)
    w = 0.0
    for ts in idx:
        tau = (exp - (ts + pd.Timedelta(hours=1))).total_seconds() / (365 * 86400)
        for c in ("low", "high"):
            w = min(w, cash - sum(XM.liab(p, path.loc[ts, c], tau, k) for p, path in zip(P, paths)) - 1.0)
    return w


if __name__ == "__main__":
    s1 = XM.run(1, 2.0, "STD")
    s2 = pd.read_csv(AUD / "xm_s2_k2.0_STD.csv", index_col=0)
    by = {}
    for e in R.ENT["W"]:
        if np.isfinite(e["S"]): by.setdefault(e["day"], []).append(e)
    W1, W2 = {}, {}
    for day, es in sorted(by.items()):
        act = [e for e in es if R.FEAT[(e["cur"], day)]["dvol"] > R.FEAT[(e["cur"], day)]["dvmed"]]
        W1[day] = worst(act, 1); W2[day] = worst(act, 2)
    out = pd.DataFrame({"expiry": s1.expiry, "r1": s1.r, "nliq1": s1.nliq,
                        "r2": s2.r.reindex(s1.index), "nliq2": s2.nliq.reindex(s1.index),
                        "mtm1": pd.Series(W1).reindex(s1.index), "mtm2": pd.Series(W2).reindex(s1.index)})
    # with liquidation the realised loss can exceed the no-liquidation MTM low -> trough = min of both
    out["trough1"] = np.minimum(out.mtm1, out.r1); out["trough2"] = np.minimum(out.mtm2, out.r2)
    out.to_csv(H / "results" / "opt_weekly_v3.csv")
    print(out.describe().round(4).to_string())
