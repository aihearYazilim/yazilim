"""Full parameter sweep of grid / futures-grid / DCA / rebalancing bots per coin.
IS: 8 fresh-start 12-month windows (starts 2021-04-17 + 6k months, k=0..7; last ends 2025-10-16).
OOS: one fresh start 2025-10-17 .. 2026-10-16 (never used for selection).
Output raw/sweep_{SYM}.npz : IS monthly equity points [combo, 8, 13], OOS daily equity [combo, days], diagnostics."""
import sys, itertools, numpy as np, pandas as pd
from lib import *
from sim import grid_sim, dca_sim, rebal_sim

IS_W = [pd.Timestamp("2021-04-17") + pd.DateOffset(months=6 * k) for k in range(8)]
EPS = 0.0002
FDEF = 0.0001

def combos():
    C = []
    ranges = [(0, 7), (0, 14), (0, 30), (0, 60), (1, 2), (1, 4), (1, 8), (2, 0.1), (2, 0.2), (2, 0.4)]
    exits = [(0, 0, 0.0), (1, 0, 0.0), (1, 2, 0.0), (1, 1, 0.05), (0, 1, 0.05)]
    for n, geo, rg, ex, rec in itertools.product([10, 20, 40, 80, 150], [1, 0], ranges, exits, [0, 30]):
        C.append(("grid", dict(mode=0, n=n, geo=geo, rt=rg[0], rp=rg[1], lev=1.0, eu=ex[0], ed=ex[1], sl=ex[2], rec=rec)))
    ranges_f = [(0, 14), (0, 30), (0, 60), (1, 2), (1, 4), (1, 8)]
    exits_f = [(0, 0, 0.0), (1, 0, 0.0), (1, 2, 0.0), (1, 1, 0.05)]
    for mode, lev, n, rg, ex, rec in itertools.product([1, 2, 3], [2.0, 3.0, 5.0], [20, 50, 150], ranges_f, exits_f, [0, 30]):
        C.append(("fgrid", dict(mode=mode, n=n, geo=1, rt=rg[0], rp=rg[1], lev=lev, eu=ex[0], ed=ex[1], sl=ex[2], rec=rec)))
    for lev, sr, vs, m, dev, ss, tp, sl in itertools.product([1.0, 2.0, 3.0], [1.0, 2.0], [1.0, 1.5, 2.0], [3, 6, 10],
                                                            [0.01, 0.02, 0.04], [1.0, 1.3], [0.01, 0.02, 0.04], [0.0, 0.15]):
        C.append(("dca", dict(fut=lev > 1, sr=sr, vs=vs, m=m, dev=dev, ss=ss, tp=tp, sl=sl, lev=lev)))
    for cv, w, r in itertools.product([0, 1], [0.3, 0.5, 0.7], [0.005, 0.01, 0.02, 0.04, 0.08]):
        C.append(("rebal", dict(cv=cv, w=w, r=r)))
    return C

def run(c, fam, p, i0, i1, fee_spot=0.001, fee_fm=0.0002, fee_ft=0.0005, slip=0.0005):
    if fam == "grid" or fam == "fgrid":
        spot = p["mode"] == 0
        ft, fr = (c.ft_empty, c.fr_empty) if spot else (c.ft, c.fr)
        fm, ftk = (fee_spot, fee_spot) if spot else (fee_fm, fee_ft)
        r = grid_sim(c.t, c.o, c.h, c.l, c.c, i0, i1, c.d0, c.dH, c.dL, c.dC, ft, fr, p["mode"], p["n"], bool(p["geo"]),
                     p["rt"], float(p["rp"]), p["lev"], p["eu"], p["ed"], p["sl"], p["rec"], fm, ftk, slip, EPS, FDEF)
        return r[0], r[1], r[2], r[3], r[4], r[5], r[7]
    if fam == "dca":
        fut = p["fut"]
        ft, fr = (c.ft, c.fr) if fut else (c.ft_empty, c.fr_empty)
        fm, ftk = (fee_fm, fee_ft) if fut else (fee_spot, fee_spot)
        r = dca_sim(c.t, c.o, c.h, c.l, c.c, i0, i1, ft, fr, fut, p["sr"], p["vs"], p["m"], p["dev"], p["ss"], p["tp"],
                    p["sl"], p["lev"], fm, ftk, slip, EPS, FDEF)
        return r[0], r[1], r[2], r[3], r[4], r[5], r[7]
    r = rebal_sim(c.t, c.o, c.h, c.l, c.c, i0, i1, p["cv"], p["w"], p["r"], fee_spot, EPS)
    return r[0], np.full(len(r[0]), r[3]), r[1], r[2], 0.0, False, r[4]

def points(eq, day_first, start):
    """equity at end of day before start + k months, k=0..12 (k=0 -> 1.0)"""
    s = pd.Series(eq).ffill().fillna(1.0).values
    out = np.ones(13)
    for k in range(1, 13):
        d = (start + pd.DateOffset(months=k)).value // 86_400_000_000_000 - 1 - day_first
        out[k] = s[min(d, len(s) - 1)]
    return out

def main(sym, slip=None):
    c = Coin(sym)
    if slip is None:
        slip = 0.0005 if sym in MAJ else 0.001
    C = combos()
    nC = len(C)
    isp = np.full((nC, len(IS_W), 13), np.nan)
    isgp = np.full((nC, len(IS_W)), np.nan)
    wins = [c.win(a, a + pd.DateOffset(months=12)) for a in IS_W]
    o0, o1 = c.win(OOS0, OOS1)
    nd = (OOS1 - OOS0).days
    oos = np.full((nC, nd), np.nan, np.float32); oosgp = np.full((nC, nd), np.nan, np.float32)
    diag = np.zeros((nC, 4))
    for j, (fam, p) in enumerate(C):
        for w, (a, ij) in enumerate(zip(IS_W, wins)):
            if ij is None:
                continue
            eq, gp, *_ = run(c, fam, p, ij[0], ij[1], slip=slip)
            df_ = c.t[ij[0]] // 1440
            isp[j, w] = points(eq, df_, a)
            isgp[j, w] = pd.Series(gp).ffill().fillna(0).values[-1]
        eq, gp, nf, fe, fu, dead, _ = run(c, fam, p, o0, o1, slip=slip)
        m = min(nd, len(eq))
        oos[j, :m] = eq[:m]; oosgp[j, :m] = gp[:m]
        diag[j] = [nf, fe, fu, dead]
    np.savez_compressed(RAW / f"sweep_{sym}.npz", isp=isp, isgp=isgp, oos=oos, oosgp=oosgp, diag=diag)
    print(sym, "done", nC, flush=True)

if __name__ == "__main__":
    for s in sys.argv[1:]:
        main(s)
