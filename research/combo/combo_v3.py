"""v3: TRY-based 3-sleeve portfolio for a Turkish investor.
  IPO  : IPO participation (research/ipo rule fixed on IS: R = max(5k, 3 x avg per-person TL of previous 6 IPOs),
         per-person lots, sell when the limit-up streak breaks), collateral = money-market fund (PPF) PLEDGED
         (PPF keeps earning; allocation paid out of PPF at first_trade-1). Sleeve value = PPF + live IPO positions.
  OPT  : Deribit weekly BTC+ETH 30-delta short strangle, DVOL > 365d median, AUDITED realistic version
         (options_audit/a5b: one cross-margined USDC account, standard margin, partial liquidation, k=2), size 1x/2x.
         USD -> TRY with daily USDTRY close; idle USDC earns 0. Weekly P&L booked on the expiry Friday.
         Tax: 20% of the sleeve's positive TRY P&L per calendar year (incl. FX gain, no loss carry-forward),
         deducted at year end and at window end. FX conversion cost 0.2% on every TRY<->USD transfer.
  C    : BIST-C (bist_all fixed config, lag1), 0.14% per transfer in/out.
Rebalance to target weights on the last Friday of each month (option expiry day, positions flat);
only free PPF (not pledged / not in live IPOs) can be moved out of the IPO sleeve.
Weights (IS only, 2022-01-03..2025-10-16 / sleeve IS history):
  EQ: 1/3 each;  IV: inverse weekly vol (TRY) of each sleeve over its own IS history;
  SH: max Sharpe (weekly excess over PPF) of the full combined IS simulation on a 0.1 simplex grid (66 points) per cell.
The full grid is also run OOS for the neighbour-robustness check only (never for selection).
Intra-week MTM drawdown: each week's trough = equity at entry Friday + OPT holding x worst hourly MTM (a8 logic,
min with realised result when partially liquidated); combined with daily close-to-close drawdown."""
import sys, pathlib, itertools, json
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; OUT = H / "results"
sys.path.insert(0, str(H))
import combo as CB

ROOT = H.parents[1]
SL = pd.read_pickle(OUT / "sleeves_v2.pkl")
FX = pd.read_csv(ROOT / "data/bist/USDTRY.csv", index_col=0, parse_dates=True).close
OW = pd.read_csv(OUT / "opt_weekly_v3.csv", index_col=0)
OW.index = pd.to_datetime(OW.index); OW["expiry"] = pd.to_datetime(OW.expiry)
IS0, IS1, OOS0, OOS1 = CB.IS0, CB.IS1, CB.OOS0, CB.OOS1
FEE_C, FEE_O, TAU = 0.0014, 0.002, 0.20
CAPS = [100_000, 500_000, 1_000_000, 5_000_000]; ACCS = [1, 2, 4]; SIZES = [1, 2]


def grid(step=0.1):
    n = int(round(1 / step)); out = []
    for i in range(n + 1):
        for j in range(n + 1 - i):
            out.append((round(i * step, 2), round(j * step, 2), round((n - i - j) * step, 2)))
    return out          # (w_ipo, w_opt, w_c)


def prep(a, b, size):
    idx = SL.index[(SL.index >= a - pd.offsets.BDay(1)) & (SL.index <= b)]
    fx = FX.reindex(idx.union(FX.index)).ffill().reindex(idx).values
    ru = np.zeros(len(idx)); tr_ = np.zeros(len(idx)); start = np.full(len(idx), -1)
    for d, row in OW.iterrows():
        e = row.expiry
        if e < idx[0] or e > idx[-1] or d < idx[0]: continue      # whole week must be inside the window
        i = idx.searchsorted(e); i0 = idx.searchsorted(d)
        if i < len(idx) and idx[i] == e:
            ru[i] = row[f"r{size}"]; tr_[i] = row[f"trough{size}"]; start[i] = i0
    fri = np.array([(d.weekday() == 4) for d in idx])
    reb = np.zeros(len(idx), bool)
    for i in range(len(idx)):
        if fri[i] and (idx[i] + pd.Timedelta(days=7)).month != idx[i].month: reb[i] = True
    return dict(idx=idx, fx=fx, ru=ru, trough=tr_, start=start, reb=reb,
                mm=SL.MM.reindex(idx).fillna(0).values, c=SL.C_L1.reindex(idx).fillna(0).values)


def ipo_events(tr, pxs, idx):
    n = len(idx); pos = {}; ev_sub, ev_alloc, ev_exit = {}, {}, {}
    t = tr[(tr.sub_start >= idx[0] + pd.offsets.BDay(1)) & (tr.sub_start <= idx[-1])]
    for _, r in t.iterrows():
        si = idx.searchsorted(r.sub_start) - 1; fi = idx.searchsorted(r.first_trade) - 1; xi = idx.searchsorted(r.exit_date)
        if si < 0: continue
        ev_sub.setdefault(si, []).append(r.ticker)
        if fi < n: ev_alloc.setdefault(fi, []).append(r.ticker)
        if xi < n: ev_exit.setdefault(xi, []).append(r.ticker)
        q = pxs[r.ticker]; q = q[~q.index.duplicated(keep="last")]
        px = q.reindex(idx.union(q.index)).ffill().reindex(idx).values
        pos[r.ticker] = dict(lots=r.lots, price=r.price, R=r.R, exit_px=r.exit_px, px=px)
    return pos, ev_sub, ev_alloc, ev_exit


def sim(D, ev, cap, w, tau=TAU):
    """one account. w = (w_ipo, w_opt, w_c). returns (equity, trough-equity per day (nan if none), diag)"""
    idx, fx, ru, mm, cr = D["idx"], D["fx"], D["ru"], D["mm"], D["c"]
    pos0, ev_sub, ev_alloc, ev_exit = ev
    pos = {k: dict(v, live=False, value=0.0) for k, v in pos0.items()}
    wi, wo, wc = w; n = len(idx)
    Hm = cap * wi; Ho = cap * wo * (1 - FEE_O); Hc = cap * wc * (1 - FEE_C); reserved = 0.0
    pnl_o = 0.0; taxpaid = 0.0; ipo_pnl = 0.0
    eq = np.empty(n); eq[0] = Hm + Ho + Hc; ho_end = np.empty(n); ho_end[0] = Ho
    yr = idx.year.values
    for i in range(1, n):
        g = fx[i] / fx[i - 1] * (1 + ru[i]) - 1
        pnl_o += Ho * g; Ho *= 1 + g; Hm *= 1 + mm[i]; Hc *= 1 + cr[i]
        for p in pos.values():
            if p["live"] and np.isfinite(p["px"][i]): p["value"] = p["lots_eff"] * p["px"][i]
        if i == n - 1 or yr[i + 1] != yr[i]:
            if pnl_o > 0 and tau > 0: Ho -= tau * pnl_o; taxpaid += tau * pnl_o
            pnl_o = 0.0
        for tk in ev_exit.get(i, []):
            p = pos[tk]
            if not p["live"]: continue
            pr = p["lots_eff"] * p["exit_px"] * (1 - CB.FEE_IPO); ipo_pnl += pr - p["paid"]
            p["live"] = False; p["value"] = 0.0; Hm += pr
        for tk in ev_alloc.get(i, []):
            p = pos[tk]
            if "R_eff" not in p: continue
            cost = p["lots_eff"] * p["price"] * (1 + CB.FEE_IPO)
            reserved -= p["R_eff"]; Hm -= cost; p["paid"] = cost
            p["live"] = p["lots_eff"] > 0; p["value"] = p["lots_eff"] * p["price"]
        for tk in ev_sub.get(i, []):
            p = pos[tk]
            Reff = max(0.0, min(p["R"], Hm - reserved))
            p["lots_eff"] = min(p["lots"], np.floor(Reff / p["price"])); p["R_eff"] = Reff; reserved += Reff
        iv = sum(p["value"] for p in pos.values() if p["live"])
        if D["reb"][i]:
            tot = Hm + Ho + Hc + iv
            dc = wc * tot - Hc; do = wo * tot - Ho
            cost = abs(dc) * FEE_C + abs(do) * FEE_O
            dm = -(dc + do) - cost
            if Hm + dm < reserved:                      # cannot release pledged PPF -> scale the move
                s = (Hm - reserved) / (-dm) if dm < 0 else 1.0
                dc *= s; do *= s; cost *= s; dm = -(dc + do) - cost
            Hc += dc - abs(dc) * FEE_C; Ho += do - abs(do) * FEE_O; Hm += -(dc + do)
        eq[i] = Hm + Ho + Hc + iv; ho_end[i] = Ho
    st = D["start"]; tro = np.full(n, np.nan); pk = np.maximum.accumulate(eq)
    for i in np.where(st >= 0)[0]:
        i0 = st[i]                                   # drawdown of the intra-week trough vs peak as of entry Friday
        tro[i] = (eq[i0] + ho_end[i0] * D["trough"][i]) / pk[i0] - 1
    return pd.Series(eq, index=idx), pd.Series(tro, index=idx), dict(tax=taxpaid, ipo_pnl=ipo_pnl)


def stats(eq, tro):
    s = CB.stats(eq, eq.index[0])
    st = tro.dropna()
    mtm = st.min() if len(st) else 0.0
    s["maxdd_mtm"] = min(s["maxdd"], mtm)
    wk = eq[eq.index.weekday == 4]; r = wk.pct_change().dropna()
    s["wk_r"] = r
    return s


def sharpe_wk(eq, D):
    wk = eq[eq.index.weekday == 4]; r = wk.pct_change().dropna()
    m = pd.Series(D["mm"], index=D["idx"]); mw = (1 + m).cumprod()[wk.index].pct_change().dropna()
    x = r - mw
    return x.mean() / x.std() * np.sqrt(52) if x.std() > 0 else 0.0


def iv_weights(tr, pxs, cap_acc, size):
    """inverse weekly vol (TRY) of each sleeve over its own IS history (all strictly before 2025-10-17)."""
    # OPT: full IS history from 2021-04 (includes May 2021); TRY
    fx = FX.copy()
    o = OW[(OW.index >= "2021-04-01") & (OW.expiry < OOS0)]
    f0 = fx.asof(o.index); f1 = fx.asof(o.expiry)
    ro = (1 + o[f"r{size}"].values) * (f1.values / f0.values) - 1
    # C: from first active day (2018-06) to IS end, weekly (Friday) compounded
    c = SL.C_L1.loc["2018-06-04":IS1]; rc = (1 + c).cumprod(); rc = rc[rc.index.weekday == 4].pct_change().dropna()
    # IPO+PPF standalone at 1/3 of account capital (IS window, the only IPO data)
    eq = CB.sim(tr, pxs, cap_acc / 3, {"MM": 1.0}, "pledge", 0.2, IS0, IS1, True)
    ri = eq[eq.index.weekday == 4].pct_change().dropna()
    v = np.array([ri.std(), np.std(ro), rc.std()]); inv = 1 / v
    return tuple(np.round(inv / inv.sum(), 4)), v


if __name__ == "__main__":
    tr, pxs = CB.load_ipos()
    Ds = {(per, sz): prep(a, b, sz) for per, a, b in [("IS", IS0, IS1), ("OOS", OOS0, OOS1)] for sz in SIZES}
    EV = {per: ipo_events(tr, pxs, Ds[(per, 1)]["idx"]) for per in ("IS", "OOS")}
    G = grid(0.1); rows = []; series = {}; W = {}
    nsim = 0
    for C, k, sz in itertools.product(CAPS, ACCS, SIZES):
        ca = C / k
        for w in G:
            for per in ("IS", "OOS"):
                e, t, dg = sim(Ds[(per, sz)], EV[per], ca, w); nsim += 1
                s = stats(e * k, t)
                rows.append(dict(C=C, accounts=k, size=sz, w_ipo=w[0], w_opt=w[1], w_c=w[2], period=per,
                                 sharpe=sharpe_wk(e, Ds[(per, sz)]), geo=s["geo"], maxdd=s["maxdd"],
                                 maxdd_mtm=s["maxdd_mtm"], worst_m=s["worst_m"], neg_m=s["neg_m"],
                                 tax_tl=dg["tax"] * k, ipo_pnl_tl=dg["ipo_pnl"] * k))
        # IS-only weight choices
        gi = pd.DataFrame([r for r in rows if r["C"] == C and r["accounts"] == k and r["size"] == sz and r["period"] == "IS"])
        b = gi.loc[gi.sharpe.idxmax()]
        w_sh = (b.w_ipo, b.w_opt, b.w_c)
        w_iv, vols = iv_weights(tr, pxs, ca, sz)
        W[(C, k, sz)] = dict(EQ=(1 / 3, 1 / 3, 1 / 3), IV=w_iv, SH=w_sh, vols=tuple(np.round(vols, 4)))
        for name, w in W[(C, k, sz)].items():
            if name == "vols": continue
            for per in ("IS", "OOS"):
                e, t, dg = sim(Ds[(per, sz)], EV[per], ca, w); nsim += 1
                s = stats(e * k, t)
                series[(name, C, k, sz, per)] = e * k
                rows.append(dict(C=C, accounts=k, size=sz, w_ipo=w[0], w_opt=w[1], w_c=w[2], period=per, scheme=name,
                                 sharpe=sharpe_wk(e, Ds[(per, sz)]), geo=s["geo"], maxdd=s["maxdd"],
                                 maxdd_mtm=s["maxdd_mtm"], worst_m=s["worst_m"], neg_m=s["neg_m"],
                                 tax_tl=dg["tax"] * k, ipo_pnl_tl=dg["ipo_pnl"] * k))
        print(C, k, sz, W[(C, k, sz)], flush=True)
    res = pd.DataFrame(rows); res.to_csv(OUT / "all_results_v3.csv", index=False)
    pd.to_pickle(series, OUT / "series_v3.pkl")
    json.dump({f"{c}|{k}|{s}": v for (c, k, s), v in W.items()}, open(OUT / "weights_v3.json", "w"), indent=1)
    print("simulations:", nsim)
