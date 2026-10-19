"""v5: NO FUNDS, NO IPOs (user constraints 2026-10-18). TRY-measured portfolio for a Turkish investor.

Sleeves (all parameters fixed before 2025-10-17; nothing re-fitted here except the sleeve weights, chosen on IS only):
  TL  : bank deposit (deposit_v5: 32-day term 'D32' with break penalty, or overnight 'ON'), with an optional SHORT
        VİOP USDTRY futures overlay = try_carry R3 AUDITED version (real VİOP settlement/high prices, corrected policy
        dates, lag 1, vol target 30%, real-rate filter > 5%, Lmax 3 or 5). Collateral is ALL TL CASH at VİOP
        (bank deposits cannot be pledged at Takasbank): initial margin 11% of notional, maintenance 8.25%.
        VİOP cash earns 'nema' = 0 or the overnight deposit net rate (both tested). Cash band at VİOP: top up to 1.25 IM
        when < IM (from the deposit, breaking the term if D32), sweep down to 1.25 IM when > 1.75 IM.
        Intraday margin check at the contract HIGH; shortfall the deposit cannot cover -> partial forced close at
        high x 1.005. 0.05% per side, 10% quarterly stopaj on positive futures P&L, 1,000 USD contracts.
  OPT : Deribit BTC+ETH weekly 30-delta short strangle, DVOL > 365d median, audited standard-margin version
        (results/opt_weekly_v3.csv), 1x / 2x notional, USD (idle USDC 0%), 20% tax on yearly positive TRY P&L,
        0.2% FX cost per transfer. NEW: minimum contract sizes (BTC options 0.1 BTC, ETH options 1 ETH): weekly return
        scaled by the realisable fraction 0.5*floor(Nb/0.1)*0.1/Nb + 0.5*floor(Ne/1)/Ne at the entry Friday.
  C   : BIST-C lag1 (bist_all fixed config), idle cash in the overnight deposit (sleeves_v5.C_L1), 0.14% per transfer.
  K   : optional lev_trend 'B' quarter-Kelly multi-asset (USD collateral), 20% yearly tax, 0.15% per transfer.
Month-end (last Friday) rebalance to target weights; flows to/from the TL sleeve go through the deposit.
Weights (IS only): EQ; IV = inverse weekly TRY vol of each sleeve's own IS history; SH = max weekly Sharpe (excess over
the D32 deposit) of the combined IS simulation on a 0.1 simplex grid. Full grid also run OOS for neighbour robustness.
"""
import sys, pathlib, itertools, json, time
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; OUT = H / "results"; ROOT = H.parents[1]
sys.path.insert(0, str(H)); sys.path.insert(0, str(H.parent / "try_carry_audit")); sys.dont_write_bytecode = True
import combo_v3 as V3
import combo_v4 as V4
import deposit_v5 as DP

SL = pd.read_pickle(OUT / "sleeves_v5.pkl")
IM, MAINT, TC, SLIP, TAXF, CSIZE = V4.IM, V4.MAINT, V4.TC, V4.SLIP, V4.TAXF, V4.CSIZE
FEE_C, FEE_O, FEE_K, TAU = 0.0014, 0.002, 0.0015, 0.20
BTC = pd.read_csv(ROOT / "data/crypto/BTC.csv", index_col=0, parse_dates=True).close
ETH = pd.read_csv(ROOT / "data/crypto/ETH.csv", index_col=0, parse_dates=True).close
IS0, IS1, OOS0, OOS1 = V3.IS0, V3.IS1, V3.OOS0, V3.OOS1
VC_LO, VC_MID, VC_HI = 1.0, 1.25, 1.75


def prep(a, b, size, shift=0.0):
    D = V3.prep(a, b, size)
    idx = D["idx"]
    D["c"] = SL.C_L1.reindex(idx).fillna(0).values
    D["k"] = SL.KELLY.reindex(idx).fillna(0).values
    D["dref"] = SL.D32.reindex(idx).fillna(0).values
    D["btc"] = BTC.reindex(idx.union(BTC.index)).ffill().reindex(idx).values
    D["eth"] = ETH.reindex(idx.union(ETH.index)).ffill().reindex(idx).values
    D["size"] = size; D["shift"] = shift
    D["ron"] = DP.net_rate(idx, "ON", shift).values
    D["days"] = np.r_[0, (idx[1:] - idx[:-1]).days].astype(float)
    return D


def lot_mult(usd, btc, eth, size):
    if usd <= 0: return 0.0
    nb = size * 0.5 * usd / btc; ne = size * 0.5 * usd / eth
    fb = np.floor(nb / 0.1 + 1e-9) * 0.1 / nb; fe = np.floor(ne + 1e-9) / ne
    return 0.5 * fb + 0.5 * fe


def sim(D, A, cap, w, product="D32", nema=0.0, carry=True, lots=True, shocks=None):
    """w = (w_tl, w_opt, w_c, w_k). shocks: dict(cshock=(i, r), kshock=(i, r), owk={i_expiry: (r, trough, start)})."""
    idx, fx, ru, cr, kr = D["idx"], D["fx"], D["ru"].copy(), D["c"].copy(), D["k"].copy()
    trough = D["trough"].copy(); start = D["start"].copy()
    if shocks:
        if "cshock" in shocks: cr[shocks["cshock"][0]] += shocks["cshock"][1]
        if "kshock" in shocks: kr[shocks["kshock"][0]] += shocks["kshock"][1]
        for i, (r, t, s0) in shocks.get("owk", {}).items(): ru[i] = r; trough[i] = t; start[i] = s0
    n = len(idx); wt, wo, wc, wk = w
    dep = DP.Deposit(idx, product, D["shift"])
    dep.deposit(cap * wt, 0)
    Ho = cap * wo * (1 - FEE_O); Hc = cap * wc * (1 - FEE_C); Hk = cap * wk * (1 - FEE_K)
    Vc = 0.0; N = 0.0; qp = 0.0; pnl_o = 0.0; pnl_k = 0.0
    ncall = nliq = ntr = 0; futpnl = 0.0; levsum = 0.0; levn = 0; taxo = 0.0
    eq = np.empty(n); eq[0] = dep.value() + Ho + Hc + Hk; ho_end = np.empty(n); ho_end[0] = Ho; elo = np.full(n, np.nan)
    mult = np.ones(n); yr = idx.year.values; dead = False
    ron, days = D["ron"], D["days"]
    for i in range(1, n):
        if dead: eq[i] = 0.0; ho_end[i] = 0.0; continue
        # ---- 1. accrue
        dep.step(i)
        if Vc > 0: Vc *= (1 + nema * ron[i] / 365) ** days[i]
        m = 1.0
        if ru[i] != 0 and lots and start[i] >= 0:
            i0 = start[i]; m = lot_mult(ho_end[i0] / fx[i0], D["btc"][i0], D["eth"][i0], D["size"])
        mult[i] = m
        g = fx[i] / fx[i - 1] * (1 + ru[i] * m) - 1
        pnl_o += Ho * g; Ho *= 1 + g; Hc *= 1 + cr[i]; pnl_k += Hk * kr[i]; Hk *= 1 + kr[i]
        if i == n - 1 or yr[i + 1] != yr[i]:
            if pnl_o > 0: Ho -= TAU * pnl_o; taxo += TAU * pnl_o
            if pnl_k > 0: Hk -= TAU * pnl_k
            pnl_o = pnl_k = 0.0
        # ---- 2. futures P&L, intraday margin check at HIGH
        elo_i = 0.0
        if carry and A["open"][i] and N > 0:
            p0, hi, st = A["p0"][i], A["hi"][i], A["st"][i]
            CVh = Vc - N * (hi - p0); elo_i = -N * (hi - st)
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
        # ---- 3. quarterly futures stopaj
        if i == n - 1 or idx[i + 1].quarter != idx[i].quarter or yr[i + 1] != yr[i]:
            if qp > 0: Vc -= TAXF * qp
            qp = 0.0
        # ---- 4. month-end rebalance (flows through the deposit)
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
        # ---- 5. futures roll / target
        if carry and A["open"][i]:
            px = A["px"][i]
            if N > 0 and A["roll"][i]: Vc -= N * A["rollpx"][i] * TC
            B = dep.value() + Vc
            tgt = A["tgt"][i]; cur = N * px / B if B > 0 else 0.0
            if (tgt == 0 and N > 0) or (tgt > 0 and abs(tgt - cur) > max(0.1, 0.2 * tgt)):
                newN = min(tgt * B / px, max(B, 0.0) / (IM * VC_MID * px))
                newN = np.floor(newN / CSIZE) * CSIZE
                if newN != N: Vc -= abs(newN - N) * px * TC; N = newN; ntr += 1
            # ---- 6. VİOP cash band
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
    om = mult[ru != 0]
    return (pd.Series(eq, idx), pd.Series(tro, idx),
            dict(ncall=ncall, nliq=nliq, ntr=ntr, futpnl=futpnl, avgL=levsum / max(levn, 1), penalty=dep.penalty,
                 taxo=taxo, lotmult=float(np.mean(om)) if len(om) else np.nan))


def stats(eq, tro):
    return V4.stats(eq, tro)


def sharpe_wk(eq, D):
    wk = eq[eq.index.weekday == 4]; r = wk.pct_change().dropna()
    m = pd.Series(D["dref"], index=D["idx"]); mw = (1 + m).cumprod()[wk.index].pct_change().dropna()
    x = r - mw
    return x.mean() / x.std() * np.sqrt(52) if x.std() > 0 else 0.0


def grid(k, step=0.1):
    n = int(round(1 / step)); out = []
    for c in itertools.product(range(n + 1), repeat=k - 1):
        if sum(c) <= n: out.append(tuple(round(x * step, 2) for x in c) + (round((n - sum(c)) * step, 2),))
    return out


def iv_weights(Dis, A, Lm, size, k4):
    """inverse weekly TRY vol per sleeve over its own IS history (all < 2025-10-17)."""
    e, _, _ = sim(Dis, A, 1e6, (1, 0, 0, 0), "D32", 0.0, True, lots=False)       # TL sleeve, IS window
    rt = e[e.index.weekday == 4].pct_change().dropna()
    o = V3.OW[(V3.OW.index >= "2021-04-01") & (V3.OW.expiry < OOS0)]
    f0 = V3.FX.asof(o.index); f1 = V3.FX.asof(o.expiry)
    ro = (1 + o[f"r{size}"].values) * (f1.values / f0.values) - 1
    def wkv(s, a):
        x = (1 + s.loc[a:IS1]).cumprod(); x = x[x.index.weekday == 4].pct_change().dropna(); return x.std()
    v = [rt.std(), np.std(ro), wkv(SL.C_L1, "2018-06-04")] + ([wkv(SL.KELLY, "2018-06-04")] if k4 else [])
    inv = 1 / np.array(v); w = inv / inv.sum()
    return tuple(np.round(w, 4)) + (() if k4 else (0.0,)), v


CAPS = [250_000, 1_000_000, 5_000_000]; LMAX = [3, 5]; SIZES = [1, 2]; NEMA = [0.0, 1.0]; PRODS = ["D32", "ON"]


def run_cell(args):
    C, Lm, sz, nema, prod, k4 = args
    Ds = {per: DD[(per, sz)] for per in ("IS", "OOS")}
    rows = []; G = GRID[k4]
    def one(w, per, scheme):
        wf = w if k4 else w + (0.0,)
        e, t, dg = sim(Ds[per], AA[(per, Lm)], C, wf, prod, nema)
        s = stats(e, t)
        rows.append(dict(C=C, Lmax=Lm, size=sz, nema=nema, prod=prod, set=4 if k4 else 3, w_tl=wf[0], w_opt=wf[1], w_c=wf[2],
                         w_k=wf[3], period=per, scheme=scheme, sharpe=sharpe_wk(e, Ds[per]), geo=s["geo"], maxdd=s["maxdd"],
                         maxdd_mtm=s["maxdd_mtm"], worst_m=s["worst_m"], neg_m=s["neg_m"], months=s["months"], **dg))
        return rows[-1]
    for w in G:
        for per in ("IS", "OOS"): one(w, per, "grid")
    gi = pd.DataFrame([r for r in rows if r["period"] == "IS"])
    b = gi.loc[gi.sharpe.idxmax()]; w_sh = (b.w_tl, b.w_opt, b.w_c) + ((b.w_k,) if k4 else ())
    w_iv, vols = iv_weights(Ds["IS"], AA[("IS", Lm)], Lm, sz, k4)
    w_eq = tuple([1 / (4 if k4 else 3)] * (4 if k4 else 3))
    W = dict(EQ=w_eq, IV=w_iv[:4 if k4 else 3], SH=w_sh)
    for name, w in W.items():
        for per in ("IS", "OOS"): one(tuple(w), per, name)
    return rows, {f"{C}|{Lm}|{sz}|{nema}|{prod}|{4 if k4 else 3}": {k: list(map(float, v)) for k, v in W.items()}}


DD = {}; AA = {}; GRID = {}


def init():
    for per, (a, b) in {"IS": (IS0, IS1), "OOS": (OOS0, OOS1)}.items():
        for sz in SIZES: DD[(per, sz)] = prep(a, b, sz)
        for Lm in LMAX: AA[(per, Lm)] = V4.carry_arrays(DD[(per, 1)]["idx"], Lm)
    GRID[False] = grid(3); GRID[True] = grid(4)


if __name__ == "__main__":
    import multiprocessing as mp
    t0 = time.time(); init()
    cells = list(itertools.product(CAPS, LMAX, SIZES, NEMA, PRODS, [False, True]))
    with mp.Pool(min(8, mp.cpu_count())) as pool:
        out = pool.map(run_cell, cells)
    rows = [r for o in out for r in o[0]]; W = {}
    for o in out: W.update(o[1])
    res = pd.DataFrame(rows); res.to_csv(OUT / "all_results_v5.csv", index=False)
    json.dump(W, open(OUT / "weights_v5.json", "w"), indent=1)
    # references: pure deposit, carry-only, single sleeves
    ref = []
    for per in ("IS", "OOS"):
        for prod in PRODS:
            for C in CAPS:
                for Lm in LMAX:
                    for nema in NEMA:
                        e, t, dg = sim(DD[(per, 1)], AA[(per, Lm)], C, (1, 0, 0, 0), prod, nema)
                        ref.append(dict(ref=f"carry {Lm}x only", C=C, prod=prod, nema=nema, period=per, **stats(e, t), **dg))
                e, t, dg = sim(DD[(per, 1)], AA[(per, 3)], C, (1, 0, 0, 0), prod, 0, carry=False)
                ref.append(dict(ref="deposit only", C=C, prod=prod, nema=0, period=per, **stats(e, t), **dg))
        for C in CAPS:
            for sz in SIZES:
                e, t, dg = sim(DD[(per, sz)], AA[(per, 3)], C, (0, 1, 0, 0), "D32", 0)
                ref.append(dict(ref=f"opt {sz}x only", C=C, prod="D32", nema=0, period=per, **stats(e, t), **dg))
            e, t, dg = sim(DD[(per, 1)], AA[(per, 3)], C, (0, 0, 1, 0), "D32", 0)
            ref.append(dict(ref="BIST-C only", C=C, prod="D32", nema=0, period=per, **stats(e, t), **dg))
            e, t, dg = sim(DD[(per, 1)], AA[(per, 3)], C, (0, 0, 0, 1), "D32", 0)
            ref.append(dict(ref="KELLY only", C=C, prod="D32", nema=0, period=per, **stats(e, t), **dg))
    R = pd.DataFrame(ref); R.to_csv(OUT / "refs_v5.csv", index=False)
    print("simulations:", len(res) + len(R), f"{time.time() - t0:.0f}s")
