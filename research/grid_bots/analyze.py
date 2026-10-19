"""Selection on IS only, report OOS. Universes: each major alone, ALT20 basket (equal capital, 1/20 each)."""
import sys, numpy as np, pandas as pd
from lib import *
from sweep import combos, IS_W

C = combos()
FAM = np.array([f for f, _ in C])
nd = (OOS1 - OOS0).days
ODAYS = pd.date_range(OOS0, periods=nd)
fx = usdtry()

def fx_pts(a):
    return np.array([fx.loc[:a + pd.DateOffset(months=k) - pd.Timedelta(days=1)].iloc[-1] for k in range(13)])
FXP = np.array([fx_pts(a) for a in IS_W]); FXP = FXP / FXP[:, :1]

def load(universe):
    syms = [universe] if universe in MAJ else ALTS
    isp, oos, oosgp, diag = [], [], [], []
    for s in syms:
        z = np.load(RAW / f"sweep_{s}.npz")
        isp.append(z["isp"]); oos.append(z["oos"]); oosgp.append(z["oosgp"]); diag.append(z["diag"])
    isp = np.nanmean(np.stack(isp), axis=0)  # mean across coins of equity points (nan windows skipped)
    oos = np.stack(oos).astype(float)
    oos = pd.DataFrame(np.nanmean(oos, axis=0).T, index=ODAYS).ffill().fillna(1.0).values.T
    oosgp = np.nanmean(np.stack(oosgp).astype(float), axis=0)
    diag = np.stack(diag)
    return isp, oos, oosgp, diag

def is_metrics(isp):
    end = isp[:, :, 12]
    g = np.where(end > 0, np.maximum(end, 1e-9) ** (1 / 12) - 1, -1.0)
    gt = np.where(end > 0, np.maximum(end * FXP[None, :, 12], 1e-9) ** (1 / 12) - 1, -1.0)
    mret = isp[:, :, 1:] / isp[:, :, :-1] - 1
    gm = np.where(np.nanmin(end, 1) > 0, np.exp(np.nanmean(np.log(np.maximum(end, 1e-12)), 1) / 12) - 1, -1.0)
    return dict(is_gm=gm, is_med=np.nanmedian(g, 1), is_mean=np.nanmean(g, 1), is_min=np.nanmin(g, 1),
                is_try_med=np.nanmedian(gt, 1), is_pos=np.nanmean(g > 0, 1), is_worstm=np.nanmin(mret, axis=(1, 2)))

def oos_metrics(eq):
    s = pd.Series(eq, index=ODAYS)
    a = stats(s); b = stats(s, try_=True)
    return dict(oos_usd=a["geo"], oos_try=b["geo"], oos_dd=a["dd"], oos_dd_try=b["dd"], oos_worst=a["worst"],
                oos_worst_try=b["worst"], oos_negm=a["negm"])

def table(universe):
    isp, oos, oosgp, diag = load(universe)
    m = pd.DataFrame(is_metrics(isp))
    m["fam"] = FAM; m["uni"] = universe; m["cid"] = np.arange(len(C))
    m["oos_end"] = oos[:, -1]
    m["oos_gp"] = oosgp[:, -1]
    m["dead_frac"] = diag[:, :, 3].mean(0)
    m["fills"] = diag[:, :, 0].mean(0)
    return m, oos

def params(cid):
    f, p = C[cid]
    return f + " " + " ".join(f"{k}={v}" for k, v in p.items())

if __name__ == "__main__":
    unis = sys.argv[1:] or MAJ + ["ALT20"]
    allm = []
    for u in unis:
        m, oos = table(u)
        # OOS daily metrics for all combos (vectorised geo; full stats for top lists)
        m["oos_geo_usd"] = np.where(m.oos_end > 0, np.maximum(m.oos_end, 1e-9) ** (1 / 12) - 1, -1)
        fxr = fx.reindex(ODAYS).ffill().values; fxr = fxr / fx.loc[:OOS0 - pd.Timedelta(days=1)].iloc[-1]
        m["oos_geo_try"] = np.where(m.oos_end > 0, np.maximum(m.oos_end * fxr[-1], 1e-9) ** (1 / 12) - 1, -1)
        m.to_pickle(RAW / f"metrics_{u}.pkl")
        np.save(RAW / f"oos_{u}.npy", oos.astype(np.float32))
        allm.append(m)
        print(u, "done", flush=True)
