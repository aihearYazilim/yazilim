"""combo_v5 with an upgraded TL cash leg (copy of combo_v5.sim; only the cash book and the VİOP collateral yield change).
cash  : 'D32'  deposits only (new engine; new money starts its own 32-day term - slightly stricter than v5)
        'BEST3' 3-month T-bill ladder vs D32, pick higher known net effective yield at each routing (DİBS 0% stopaj)
        prem  : +pp gross on the deposit rate (best-bank / promotional deposits)
        spread: bill bid-ask in simple yield (round trip), 25bp base, 100bp = retail bank-channel stress
viop  : 'nema0' VİOP TL cash earns 0 | 'nema1' earns the ON-deposit net rate (v5 assumption ~ Takasbank nema after
        6.25% Takasbank cut + stopaj) | 'dibsX' up to 50% of the IM requirement posted as 3m T-bills (Takasbank/QNB:
        DİBS 0-1y valuation 97%, non-TL collateral <= 50% of requirement); that part earns the bill yield (mid - s/2),
        counts at 97% in the margin check; the rest earns nema X.
Everything else (sleeves, carry rule R3, margin mechanics, rebalancing, taxes, Deribit lots) identical to combo_v5."""
import sys, pathlib, json, itertools, time
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; ROOT = H.parents[1]
sys.path.insert(0, str(H)); sys.path.insert(0, str(ROOT / "research/combo")); sys.dont_write_bytecode = True
import combo_v5 as V
import cashlib as CL

IM, MAINT, TC, SLIP, TAXF, CSIZE = V.IM, V.MAINT, V.TC, V.SLIP, V.TAXF, V.CSIZE
FEE_C, FEE_O, FEE_K, TAU = V.FEE_C, V.FEE_O, V.FEE_K, V.TAU
VC_LO, VC_MID, VC_HI = V.VC_LO, V.VC_MID, V.VC_HI
DIBS_VAL = 0.97


def sim(D, A, cap, w, cash="D32", viop="nema0", prem=0.0, spread=0.0025, carry=True, lots=True, shocks=None, M=None):
    idx, fx, ru, cr, kr = D["idx"], D["fx"], D["ru"].copy(), D["c"].copy(), D["k"].copy()
    trough = D["trough"].copy(); start = D["start"].copy()
    if shocks:
        if "cshock" in shocks: cr[shocks["cshock"][0]] += shocks["cshock"][1]
        if "kshock" in shocks: kr[shocks["kshock"][0]] += shocks["kshock"][1]
        for i, (r, t, s0) in shocks.get("owk", {}).items(): ru[i] = r; trough[i] = t; start[i] = s0
    n = len(idx); wt, wo, wc, wk = w
    M = CL.market(idx, prem) if M is None else M
    dep = CL.CashBook(M, mode=cash, k=3, spread=spread); dep.i = 0
    dep.deposit(cap * wt, 0, initial=True)
    nema = 1.0 if viop.endswith("1") else 0.0; dibs = viop.startswith("dibs")
    ybill = np.nan_to_num(M["y3"] - spread / 2, nan=0.0)
    Ho = cap * wo * (1 - FEE_O); Hc = cap * wc * (1 - FEE_C); Hk = cap * wk * (1 - FEE_K)
    Vc = 0.0; N = 0.0; qp = 0.0; pnl_o = 0.0; pnl_k = 0.0
    ncall = nliq = ntr = 0; futpnl = 0.0; levsum = 0.0; levn = 0; taxo = 0.0
    eq = np.empty(n); eq[0] = dep.value() + Ho + Hc + Hk; ho_end = np.empty(n); ho_end[0] = Ho; elo = np.full(n, np.nan)
    mult = np.ones(n); yr = idx.year.values; dead = False
    ron, days = D["ron"], D["days"]
    for i in range(1, n):
        if dead: eq[i] = 0.0; ho_end[i] = 0.0; continue
        dep.step(i)
        if Vc > 0:
            IMp = IM * N * A["px"][i - 1]          # >= 50% of the requirement must stay TL cash
            bpart = min(max(Vc - 0.5 * IMp, 0.0), 0.5 * IMp / DIBS_VAL) if (dibs and N > 0 and IMp > 0) else 0.0
            Vc = bpart * (1 + ybill[i] / 365) ** days[i] + (Vc - bpart) * (1 + nema * ron[i] / 365) ** days[i]
        else: bpart = 0.0
        m = 1.0
        if ru[i] != 0 and lots and start[i] >= 0:
            i0 = start[i]; m = V.lot_mult(ho_end[i0] / fx[i0], D["btc"][i0], D["eth"][i0], D["size"])
        mult[i] = m
        g = fx[i] / fx[i - 1] * (1 + ru[i] * m) - 1
        pnl_o += Ho * g; Ho *= 1 + g; Hc *= 1 + cr[i]; pnl_k += Hk * kr[i]; Hk *= 1 + kr[i]
        if i == n - 1 or yr[i + 1] != yr[i]:
            if pnl_o > 0: Ho -= TAU * pnl_o; taxo += TAU * pnl_o
            if pnl_k > 0: Hk -= TAU * pnl_k
            pnl_o = pnl_k = 0.0
        elo_i = 0.0
        if carry and A["open"][i] and N > 0:
            p0, hi, st = A["p0"][i], A["hi"][i], A["st"][i]
            hc = (1 - DIBS_VAL) * bpart
            CVh = Vc - hc - N * (hi - p0); elo_i = -N * (hi - st)
            if CVh < MAINT * N * hi:
                ncall += 1; need = IM * N * hi - CVh
                got = dep.withdraw(need, i); Vc += got; CV = CVh + got
                if got >= need - 1e-6:
                    fut = -N * (st - p0)
                else:
                    Nk = min(N, max(0.0, np.floor(CV / (IM * hi) / CSIZE) * CSIZE) if CV > 0 else 0.0)
                    fut = -(N - Nk) * (hi * (1 + SLIP) - p0) - Nk * (st - p0) - (N - Nk) * hi * TC
                    N = Nk; nliq += 1; elo_i = 0.0
            else:
                fut = -N * (st - p0)
            Vc += fut; qp += fut; futpnl += fut
        if i == n - 1 or idx[i + 1].quarter != idx[i].quarter or yr[i + 1] != yr[i]:
            if qp > 0: Vc -= TAXF * qp
            qp = 0.0
        if D["reb"][i]:
            tot = dep.value() + Vc + Ho + Hc + Hk
            dc, do, dk = wc * tot - Hc, wo * tot - Ho, wk * tot - Hk
            cost = abs(dc) * FEE_C + abs(do) * FEE_O + abs(dk) * FEE_K
            dm = -(dc + do + dk) - cost
            if dm < 0 and -dm > dep.value():
                s = dep.value() / (-dm); dc *= s; do *= s; dk *= s
                cost = abs(dc) * FEE_C + abs(do) * FEE_O + abs(dk) * FEE_K; dm = -(dc + do + dk) - cost
            if dm < 0: dep.withdraw(-dm, i)
            else: dep.deposit(dm, i)
            Hc += dc - abs(dc) * FEE_C; Ho += do - abs(do) * FEE_O; Hk += dk - abs(dk) * FEE_K
        if carry and A["open"][i]:
            px = A["px"][i]
            if N > 0 and A["roll"][i]: Vc -= N * A["rollpx"][i] * TC
            B = dep.value() + Vc
            tgt = A["tgt"][i]; cur = N * px / B if B > 0 else 0.0
            if (tgt == 0 and N > 0) or (tgt > 0 and abs(tgt - cur) > max(0.1, 0.2 * tgt)):
                newN = min(tgt * B / px, max(B, 0.0) / (IM * VC_MID * px))
                newN = np.floor(newN / CSIZE) * CSIZE
                if newN != N: Vc -= abs(newN - N) * px * TC; N = newN; ntr += 1
            if N > 0:
                IMn = IM * N * px
                if Vc < VC_LO * IMn: Vc += dep.withdraw(VC_MID * IMn - Vc, i)
                elif Vc > VC_HI * IMn: dep.deposit(Vc - VC_MID * IMn, i); Vc = VC_MID * IMn
                levsum += N * px / max(B, 1e-9); levn += 1
            elif Vc > 0:
                dep.deposit(Vc, i); Vc = 0.0
        eq[i] = dep.value() + Vc + Ho + Hc + Hk; ho_end[i] = Ho; elo[i] = eq[i] + elo_i
        if eq[i] <= 0: dead = True; eq[i] = 0.0
    tro = np.full(n, np.nan); pk = np.maximum.accumulate(eq)
    for i in np.where(start >= 0)[0]:
        i0 = start[i]; tro[i] = (eq[i0] + ho_end[i0] * trough[i] * mult[i]) / pk[i0] - 1
    tro = np.fmin(tro, elo / pk - 1)
    return (pd.Series(eq, idx), pd.Series(tro, idx),
            dict(ncall=ncall, nliq=nliq, ntr=ntr, futpnl=futpnl, avgL=levsum / max(levn, 1), penalty=dep.penalty,
                 billcost=dep.cost, taxo=taxo))


def iv_weights(Dis, A, size, cash, prem, spread):
    """as combo_v5.iv_weights (IS only), TL sleeve simulated with the new cash leg, nema 0."""
    e, _, _ = sim(Dis, A, 1e6, (1, 0, 0, 0), cash, "nema0", prem, spread, lots=False)
    rt = e[e.index.weekday == 4].pct_change().dropna()
    o = V.V3.OW[(V.V3.OW.index >= "2021-04-01") & (V.V3.OW.expiry < V.OOS0)]
    f0 = V.V3.FX.asof(o.index); f1 = V.V3.FX.asof(o.expiry)
    ro = (1 + o[f"r{size}"].values) * (f1.values / f0.values) - 1
    x = (1 + V.SL.C_L1.loc["2018-06-04":V.IS1]).cumprod(); x = x[x.index.weekday == 4].pct_change().dropna()
    v = np.array([rt.std(), np.std(ro), x.std()]); inv = 1 / v; w = inv / inv.sum()
    return tuple(np.round(w, 4)) + (0.0,)


W5 = {5: (0.760, 0.071, 0.169, 0.0), 3: (0.826, 0.052, 0.123, 0.0)}      # v5 IV weights (size 2)
CASH = [("D32", 0.0, 0.0025), ("BEST3", 0.0, 0.0025), ("BEST3", 0.0, 0.0100), ("D32", 2.0, 0.0025), ("BEST3", 2.0, 0.0025)]
VIOP = ["nema0", "nema1", "dibs0", "dibs1"]
CAPS = [1_000_000, 5_000_000]

if __name__ == "__main__":
    t0 = time.time()
    DD = {per: V.prep(a, b, 2) for per, (a, b) in {"IS": (V.IS0, V.IS1), "OOS": (V.OOS0, V.OOS1)}.items()}
    AA = {(per, Lm): V.V4.carry_arrays(DD[per]["idx"], Lm) for per in DD for Lm in (3, 5)}
    MM = {(per, prem): CL.market(DD[per]["idx"], prem) for per in DD for prem in (0.0, 2.0)}
    rows = []; WW = {}
    for Lm, (cash, prem, sp) in itertools.product((5, 3), CASH):
        WW[(Lm, cash, prem, sp)] = iv_weights(DD["IS"], AA[("IS", Lm)], 2, cash, prem, sp)
    for Lm, C, (cash, prem, sp), viop, wname in itertools.product((5, 3), CAPS, CASH, VIOP, ("v5", "IVnew")):
        w = W5[Lm] if wname == "v5" else WW[(Lm, cash, prem, sp)]
        for per in ("IS", "OOS"):
            e, t, dg = sim(DD[per], AA[(per, Lm)], C, w, cash, viop, prem, sp, M=MM[(per, prem)])
            s = V.stats(e, t)
            rows.append(dict(Lmax=Lm, C=C, cash=cash, prem=prem, spread=sp, viop=viop, wname=wname, w_tl=w[0], w_opt=w[1],
                             w_c=w[2], period=per, geo=s["geo"] * 100, maxdd=s["maxdd_mtm"] * 100, worst_m=s["worst_m"] * 100,
                             neg_m=s["neg_m"], **dg))
    R = pd.DataFrame(rows); R.to_csv(H / "results/combo_cash.csv", index=False)
    pd.set_option("display.width", 250); pd.set_option("display.max_rows", 500)
    P = R.pivot_table(index=["Lmax", "wname", "cash", "prem", "spread", "viop"], columns=["period", "C"], values="geo").round(2)
    print(P.to_string()); print("sims:", len(R), f"{time.time() - t0:.0f}s")
    print({str(k): v for k, v in WW.items()})
