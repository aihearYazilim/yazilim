"""COMBO v6 — all protocol-valid sleeves, TRY investor, no funds, no IPOs.

Sleeves (parameters fixed before 2025-10-17 by their own studies; only sleeve WEIGHTS are chosen here, on IS only):
  TL  : upgraded cash leg (cash_upgrade: 'BEST3' = 3m T-bill ladder vs 32-day deposit, higher net yield at each routing;
        VİOP collateral 'dibs0'/'dibs1' = up to 50% of IM in 0-1y DİBS at 97%, rest TL cash earning nema 0 / ON-deposit)
        + try_carry R3 audited short USDTRY VİOP futures overlay, Lmax 3 or 5 (identical mechanics to combo_cash.sim).
  OPT : Deribit BTC+ETH weekly 40d strangle + monthly 10d protective put, 2x, standard margin (options2 #1), USD,
        min contract sizes (0.1 BTC / 1 ETH), 20% tax on yearly positive TRY P&L, 0.2% FX/transfer cost.
  C   : BIST-C lag1 with overnight-deposit fallback (sleeves_v5.C_L1), 0.14% per transfer.
  XU  : VİOP XU030 20d/5d put spread 5x, IV>252d median, hold (viop_options #1), entry day 0 (1..9 as robustness),
        own VİOP cash earns nema 1 / 0 consistent with the TL leg's VİOP assumption; 10% quarterly stopaj inside.
        CAPACITY: sleeve equity capped at XCAP = 1,000,000 TL x XU030(t)/XU030(2025-10-16) at each rebalance (capacity
        is ~1M TL today and scales with the index level / TL size of the market); the excess stays in the TL leg.
        0.3% cost per TL moved in/out (re-sizing the spread at the bid/ask).
  EVT : crypto event-short book, audit scenario B, s=0.10 (USD, Binance perps), satellite weight <= 10%,
        20% tax on yearly positive TRY P&L, 0.2% transfer cost.
Month-end (last Friday) rebalance; flows go through the TL cash book.
Common window: IS 2022-01-01..2025-10-16 (all sleeves have data), OOS 2025-10-17..2026-10-16.
"""
import sys, pathlib, itertools, json, time
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; OUT = H / "results"; ROOT = H.parents[1]
sys.path.insert(0, str(H)); sys.path.insert(0, str(ROOT / "research/cash_upgrade")); sys.dont_write_bytecode = True
import combo_v5 as V
import combo_cash as CC
import cashlib as CL

S6 = pd.read_pickle(OUT / "sleeves_v6.pkl")
IM, MAINT, TC, SLIP, TAXF, CSIZE = V.IM, V.MAINT, V.TC, V.SLIP, V.TAXF, V.CSIZE
FEE_C, FEE_O, TAU = V.FEE_C, V.FEE_O, V.TAU
FEE_X, FEE_E = 0.003, 0.002
VC_LO, VC_MID, VC_HI = V.VC_LO, V.VC_MID, V.VC_HI
DIBS_VAL = CC.DIBS_VAL
XCAP = 1_000_000.0
IS0, IS1, OOS0, OOS1 = V.IS0, V.IS1, V.OOS0, V.OOS1
OPT0 = "C mh10P 40d 2x STD"; OPT_SIZE = {"C mh10P 40d 2x STD": 2, "A' mh10P 30d 2x STD": 2, "B' mh10P 35d 3x STD": 3}
SPREAD = 0.0025


def prep6(a, b, opt=OPT0, xu_ed=0, xu_nema=1.0, evt="B_s0.1"):
    D = V.prep(a, b, 2); idx = D["idx"]
    T = S6["opt"][opt]
    ru = np.zeros(len(idx)); tr_ = np.zeros(len(idx)); start = np.full(len(idx), -1)
    for d, row in T.iterrows():
        e = row.expiry
        if e < idx[0] or e > idx[-1] or d < idx[0]: continue
        i = idx.searchsorted(e); i0 = idx.searchsorted(d)
        if i < len(idx) and idx[i] == e: ru[i] = row.r; tr_[i] = row.trough; start[i] = i0
    D.update(ru=ru, trough=tr_, start=start, size=OPT_SIZE[opt])
    xe = S6["xu"][(xu_ed, xu_nema)]
    x = xe.reindex(idx.union(xe.index)).ffill().reindex(idx)
    D["x"] = x.pct_change().fillna(0).values
    D["xgap"] = S6["xugap"].get((xu_ed, xu_nema), S6["xugap"][(xu_ed, 1.0)])
    er = S6["evt"][evt]; ce = (1 + er).cumprod()
    c = ce.reindex(idx.union(ce.index)).ffill().reindex(idx).fillna(1.0)
    D["e"] = c.pct_change().fillna(0).values
    xu = pd.read_csv(ROOT / "data/bist/XU030.csv", index_col=0, parse_dates=True).close
    xu = xu[~xu.index.duplicated()]
    D["xcapf"] = (xu.reindex(idx.union(xu.index)).ffill().reindex(idx) / xu.asof(IS1)).values
    D["on_c"] = V.SL.ON.reindex(idx).fillna(0).values
    D["M"] = CL.market(idx, 0.0)
    D["key"] = (opt, xu_ed, xu_nema, evt)
    return D


def sim(D, A, cap, w, viop="dibs1", carry=True, lots=True, shocks=None, M=None, xcap=XCAP):
    """w = (w_tl, w_opt, w_c, w_xu, w_evt). shocks: cshock/xshock/eshock=(i, r) additive one-day returns,
    owk={i_expiry: (r, trough, start)}, eseq=(i0, array) replaces event returns from i0."""
    idx, fx = D["idx"], D["fx"]
    ru, cr, xr, er = D["ru"].copy(), D["c"].copy(), D["x"].copy(), D["e"].copy()
    trough = D["trough"].copy(); start = D["start"].copy()
    if shocks:
        if "cshock" in shocks: cr[shocks["cshock"][0]] += shocks["cshock"][1]
        if "xshock" in shocks: xr[shocks["xshock"][0]] = (1 + xr[shocks["xshock"][0]]) * (1 + shocks["xshock"][1]) - 1
        if "eshock" in shocks: er[shocks["eshock"][0]] += shocks["eshock"][1]
        if "eseq" in shocks:
            i0, arr = shocks["eseq"]; L = min(len(arr), len(er) - i0); er[i0:i0 + L] = arr[:L]
        for i, (r, t, s0) in shocks.get("owk", {}).items(): ru[i] = r; trough[i] = t; start[i] = s0
    n = len(idx); wt, wo, wc, wx, we = w
    M = D["M"] if M is None else M
    dep = CL.CashBook(M, mode="BEST3", k=3, spread=SPREAD); dep.i = 0
    nema = 1.0 if viop.endswith("1") else 0.0; dibs = viop.startswith("dibs")
    ybill = np.nan_to_num(M["y3"] - SPREAD / 2, nan=0.0)
    xcf = D["xcapf"]
    x0 = min(wx * cap, xcap * xcf[0])
    dep.deposit(cap * wt + (wx * cap - x0), 0, initial=True)
    Ho = cap * wo * (1 - FEE_O); Hc = cap * wc * (1 - FEE_C); Hx = x0 * (1 - FEE_X); He = cap * we * (1 - FEE_E)
    Vc = 0.0; N = 0.0; qp = 0.0; pnl_o = 0.0; pnl_e = 0.0
    ncall = nliq = ntr = 0; futpnl = 0.0; levsum = 0.0; levn = 0; taxo = 0.0
    eq = np.empty(n); eq[0] = dep.value() + Ho + Hc + Hx + He; ho_end = np.empty(n); ho_end[0] = Ho; elo = np.full(n, np.nan)
    mult = np.ones(n); yr = idx.year.values; dead = False
    ron, days = D["ron"], D["days"]
    for i in range(1, n):
        if dead: eq[i] = 0.0; ho_end[i] = 0.0; continue
        dep.step(i)
        if Vc > 0:
            IMp = IM * N * A["px"][i - 1]
            bpart = min(max(Vc - 0.5 * IMp, 0.0), 0.5 * IMp / DIBS_VAL) if (dibs and N > 0 and IMp > 0) else 0.0
            Vc = bpart * (1 + ybill[i] / 365) ** days[i] + (Vc - bpart) * (1 + nema * ron[i] / 365) ** days[i]
        else: bpart = 0.0
        m = 1.0
        if ru[i] != 0 and lots and start[i] >= 0:
            i0 = start[i]; m = V.lot_mult(ho_end[i0] / fx[i0], D["btc"][i0], D["eth"][i0], D["size"])
        mult[i] = m
        g = fx[i] / fx[i - 1] * (1 + ru[i] * m) - 1
        pnl_o += Ho * g; Ho *= 1 + g
        ge = fx[i] / fx[i - 1] * (1 + er[i]) - 1
        pnl_e += He * ge; He *= 1 + ge
        Hc *= 1 + cr[i]; Hx *= 1 + xr[i]
        Hx = max(Hx, 0.0); He = max(He, 0.0)
        if i == n - 1 or yr[i + 1] != yr[i]:
            if pnl_o > 0: Ho -= TAU * pnl_o; taxo += TAU * pnl_o
            if pnl_e > 0: He -= TAU * pnl_e; taxo += TAU * pnl_e
            pnl_o = pnl_e = 0.0
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
            tot = dep.value() + Vc + Ho + Hc + Hx + He
            dc, do, dx, de = wc * tot - Hc, wo * tot - Ho, min(wx * tot, xcap * xcf[i]) - Hx, we * tot - He
            fees = lambda: abs(dc) * FEE_C + abs(do) * FEE_O + abs(dx) * FEE_X + abs(de) * FEE_E
            dm = -(dc + do + dx + de) - fees()
            if dm < 0 and -dm > dep.value():
                s = dep.value() / (-dm); dc *= s; do *= s; dx *= s; de *= s
                dm = -(dc + do + dx + de) - fees()
            if dm < 0: dep.withdraw(-dm, i)
            else: dep.deposit(dm, i)
            Hc += dc - abs(dc) * FEE_C; Ho += do - abs(do) * FEE_O; Hx += dx - abs(dx) * FEE_X; He += de - abs(de) * FEE_E
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
        eq[i] = dep.value() + Vc + Ho + Hc + Hx + He; ho_end[i] = Ho; elo[i] = eq[i] + elo_i
        if eq[i] <= 0: dead = True; eq[i] = 0.0
    tro = np.full(n, np.nan); pk = np.maximum.accumulate(eq)
    for i in np.where(start >= 0)[0]:
        i0 = start[i]; tro[i] = (eq[i0] + ho_end[i0] * trough[i] * mult[i]) / pk[i0] - 1
    tro = np.fmin(tro, elo / pk - 1)
    return (pd.Series(eq, idx), pd.Series(tro, idx),
            dict(ncall=ncall, nliq=nliq, ntr=ntr, futpnl=futpnl, avgL=levsum / max(levn, 1), penalty=dep.penalty, taxo=taxo))


stats = V.stats
sharpe_wk = V.sharpe_wk


def core_grid(step=0.1):
    n = int(round(1 / step)); out = []
    for c in itertools.product(range(n + 1), repeat=3):
        if sum(c) <= n: out.append(tuple(round(x * step, 2) for x in c) + (round((n - sum(c)) * step, 2),))
    return out


WE = [0.0, 0.05, 0.10]


def full_grid():
    return [tuple(round((1 - we) * x, 4) for x in c) + (we,) for we in WE for c in core_grid()]


def iv_weights(Dis, A, viop):
    """inverse weekly TRY vol of each sleeve standalone over the common IS window (2022-01..2025-10-16)."""
    idx = Dis["idx"]; fri = idx.weekday == 4
    def wv(level): s = pd.Series(level, idx)[fri]; return s.pct_change().dropna().std()
    e, _, _ = sim(Dis, A, 1e6, (1, 0, 0, 0, 0), viop, lots=False)
    fx = Dis["fx"]
    o = np.cumprod(1 + Dis["ru"]) * fx
    v = np.array([wv(e.values), wv(o), wv(np.cumprod(1 + Dis["c"])), wv(np.cumprod(1 + Dis["x"])), wv(np.cumprod(1 + Dis["e"]) * fx)])
    inv = 1 / v
    w4 = inv[:4] / inv[:4].sum()
    w5 = inv / inv.sum()
    if w5[4] > 0.10: w5 = np.r_[(1 - 0.10) * inv[:4] / inv[:4].sum(), 0.10]
    return tuple(np.round(np.r_[w4, 0.0], 4)), tuple(np.round(w5, 4)), v


CAPS = [1_000_000, 5_000_000, 10_000_000]; LMAX = [3, 5]; VIOPS = ["dibs0", "dibs1"]
DD = {}; AA = {}; GRID = []


def init(opt=OPT0, xu_ed=0, evt="B_s0.1"):
    for per, (a, b) in {"IS": (IS0, IS1), "OOS": (OOS0, OOS1)}.items():
        for nema in (1.0, 0.0):
            DD[(per, nema)] = prep6(a, b, opt, xu_ed, nema, evt)
        for Lm in LMAX: AA[(per, Lm)] = V.V4.carry_arrays(DD[(per, 1.0)]["idx"], Lm)
    GRID[:] = full_grid()


def run_cell(args):
    C, Lm, viop = args
    nema = 1.0 if viop.endswith("1") else 0.0
    rows = []
    def one(w, per, scheme):
        D = DD[(per, nema)]
        e, t, dg = sim(D, AA[(per, Lm)], C, w, viop)
        s = stats(e, t)
        rows.append(dict(C=C, Lmax=Lm, viop=viop, w_tl=w[0], w_opt=w[1], w_c=w[2], w_xu=w[3], w_evt=w[4], period=per,
                         scheme=scheme, sharpe=sharpe_wk(e, D), geo=s["geo"], maxdd=s["maxdd"], maxdd_mtm=s["maxdd_mtm"],
                         worst_m=s["worst_m"], neg_m=s["neg_m"], months=s["months"], **dg))
    for w in GRID:
        for per in ("IS", "OOS"): one(w, per, "grid")
    gi = pd.DataFrame([r for r in rows if r["period"] == "IS"])
    W = {}
    w4, w5, vols = iv_weights(DD[("IS", nema)], AA[("IS", Lm)], viop)
    W["EQ4"] = (0.25, 0.25, 0.25, 0.25, 0.0); W["EQ5"] = (0.225, 0.225, 0.225, 0.225, 0.10)
    W["IV4"] = w4; W["IV5"] = w5
    cols = ["w_tl", "w_opt", "w_c", "w_xu", "w_evt"]
    g4 = gi[gi.w_evt == 0]
    W["SH4"] = tuple(g4.loc[g4.sharpe.idxmax(), cols]); W["SH5"] = tuple(gi.loc[gi.sharpe.idxmax(), cols])
    ok4 = g4[g4.maxdd_mtm >= -0.25]; ok5 = gi[gi.maxdd_mtm >= -0.25]
    W["MG4"] = tuple(ok4.loc[ok4.geo.idxmax(), cols]); W["MG5"] = tuple(ok5.loc[ok5.geo.idxmax(), cols])
    for name, w in W.items():
        for per in ("IS", "OOS"): one(tuple(float(x) for x in w), per, name)
    return rows, {f"{C}|{Lm}|{viop}": {k: list(map(float, v)) for k, v in W.items()} | {"vols": list(map(float, vols))}}


if __name__ == "__main__":
    import multiprocessing as mp
    t0 = time.time(); init()
    cells = list(itertools.product(CAPS, LMAX, VIOPS))
    with mp.Pool(4) as pool:
        out = pool.map(run_cell, cells)
    rows = [r for o in out for r in o[0]]; W = {}
    for o in out: W.update(o[1])
    res = pd.DataFrame(rows); res.to_csv(OUT / "all_results_v6.csv", index=False)
    json.dump(W, open(OUT / "weights_v6.json", "w"), indent=1)
    # single-sleeve references on the common window
    ref = []
    for per in ("IS", "OOS"):
        for C in CAPS:
            for nm, w in [("TL only", (1, 0, 0, 0, 0)), ("OPT only", (0, 1, 0, 0, 0)), ("BIST-C only", (0, 0, 1, 0, 0)),
                          ("XU only", (0, 0, 0, 1, 0)), ("EVT only", (0, 0, 0, 0, 1))]:
                for Lm in (LMAX if nm == "TL only" else [3]):
                    for viop in VIOPS:
                        D = DD[(per, 1.0 if viop.endswith("1") else 0.0)]
                        e, t, dg = sim(D, AA[(per, Lm)], C, w, viop)
                        ref.append(dict(ref=nm, Lmax=Lm, C=C, viop=viop, period=per, **stats(e, t), **dg))
            D = DD[(per, 0.0)]
            e, t, dg = sim(D, AA[(per, 3)], C, (1, 0, 0, 0, 0), "nema0", carry=False)
            ref.append(dict(ref="cash leg only (BEST3)", Lmax=0, C=C, viop="-", period=per, **stats(e, t), **dg))
    R = pd.DataFrame(ref); R.to_csv(OUT / "refs_v6.csv", index=False)
    print("simulations:", len(res) + len(R), f"{time.time() - t0:.0f}s")
