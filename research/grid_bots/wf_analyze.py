"""Walk-forward chain: each month pick the combo with best trailing-L-month geo-mean (fresh monthly restarts),
apply to next month. OOS = the 12 months starting 2025-10-17. Universes: each major, ALT20 (equal-capital mean)."""
import numpy as np, pandas as pd
from lib import *
from wf import MONTHS
from sweep import combos
from analyze import params

C = combos(); FAM = np.array([f for f, _ in C])
fx = usdtry()
FXR = np.array([fx.loc[:a + pd.DateOffset(months=1) - pd.Timedelta(days=1)].iloc[-1] /
                fx.loc[:a - pd.Timedelta(days=1)].iloc[-1] for a in MONTHS])
K_OOS = MONTHS.index(OOS0)

def uni(u):
    return np.clip(_uni(u), 0, None)

def _uni(u):
    if u in MAJ:
        return np.load(RAW / f"wf_{u}.npy")
    return np.nanmean(np.stack([np.clip(np.load(RAW / f"wf_{s}.npy"), 0, None) for s in ALTS]), axis=0)

def chain(R, L, mask, k0, k1):
    out, picks = [], []
    lr = np.log(np.maximum(R, 1e-9))
    for k in range(k0, k1):
        sc = np.nanmean(lr[:, max(0, k - L):k], axis=1)
        sc[~mask] = -np.inf
        sc[np.isnan(sc)] = -np.inf
        j = int(np.argmax(sc)); picks.append(j); out.append(R[j, k])
    return np.array(out), picks

def summ(r, fxr):
    g = np.prod(r) ** (1 / len(r)) - 1
    gt = np.prod(r * fxr) ** (1 / len(r)) - 1
    eq = np.cumprod(r); dd = (eq / np.maximum.accumulate(np.r_[1, eq])[1:] - 1).min()
    return g, gt, min(dd, 0), (r * fxr - 1).min()

rows = []
for u in MAJ + ["ALT20"]:
    R = uni(u)
    for fam in ["ALL", "grid", "fgrid", "dca", "rebal"]:
        mask = np.ones(len(C), bool) if fam == "ALL" else FAM == fam
        for L in (6, 12, 24):
            ri, _ = chain(R, L, mask, 24, K_OOS)
            ro, picks = chain(R, L, mask, K_OOS, len(MONTHS))
            gi, gti, ddi, _ = summ(ri, FXR[24:K_OOS])
            go, gto, ddo, wo = summ(ro, FXR[K_OOS:])
            rows.append(dict(uni=u, fam=fam, L=L, is_wf_usd=gi, is_wf_try=gti, oos_usd=go, oos_try=gto,
                             oos_dd_monthly=ddo, oos_worst_try=wo, n_distinct_picks=len(set(picks)),
                             last_pick=params(picks[-1])))
d = pd.DataFrame(rows)
pd.set_option("display.width", 250); pd.set_option("display.max_colwidth", 90)
print(d.drop(columns="last_pick").round(4).to_string())
d.to_csv(HERE / "out_wf.csv", index=False)
print("WF meta-combos:", len(d), " underlying combos per universe:", len(C))
# meta-selection: which (fam, L) per universe was best on IS-WF? -> its OOS
print("\nMeta-selected (best IS-WF per universe):")
for u, g in d.groupby("uni"):
    r = g.sort_values("is_wf_usd", ascending=False).iloc[0]
    print(f"{u:6s} {r.fam:6s} L={r.L:2d}  IS-WF {r.is_wf_usd:+.4f}  OOS USD {r.oos_usd:+.4f}  TRY {r.oos_try:+.4f}  DD {r.oos_dd_monthly:+.3f}")
