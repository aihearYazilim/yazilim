"""v4: COLLATERAL STACKING. One account holds money-market fund (PPF) units that serve simultaneously as
  (a) IPO subscription collateral (pledge, v3 rule), and
  (b) VİOP margin collateral for a SHORT VİOP USDTRY futures overlay (rule R3 of try_carry, AUDITED real-futures
      version: try_carry_audit/audit_lib.run_futures logic, corrected policy dates, lag 1, Takasbank initial
      margin 11% of notional, maintenance 8.25% = 0.75 x 11%),
  plus optional Deribit (opt_weekly_v3, audited) and BIST-C sleeves exactly as in combo_v3.

Collateral facts used (see report): VİOP accepts fund units as non-cash collateral with a valuation coefficient
(QNB Invest list: equity-umbrella fund units 89%, debt-umbrella 92%; Takasbank table lists money-market umbrella
fund units at 97% for the equity market) and >= 50% of the margin requirement must be TL CASH. We therefore test
haircut h in {10%, 20%} on posted PPF and the 50%-TL-cash rule (cash earns 'nema' = nema x PPF yield, nema in {0, 1}).
A PPF unit can be in ONE place at a time: free PPF -> either pledged to an IPO subscription (blocked until
allocation day) or posted to VİOP (Pv). Margin calls can only be met from FREE (unblocked, unposted) PPF.

Daily order (business days of the sleeves panel, end-of-day unless stated):
  1. accrue PPF (SL.MM), VİOP cash (nema x MM), BIST-C, Deribit (as v3), IPO MTM; Deribit tax at year end.
  2. futures day: intraday check at the held contract's HIGH. If posted collateral value
     CV = Vc - loss + min((1-h)Pv, 0.5 IM) < 8.25% x notional -> margin call: restore to IM (11%) from free PPF;
     if free PPF is insufficient (blocked by IPO pledges / spent) -> PARTIAL forced close at high x (1+0.5%) down to the
     size the remaining collateral supports at IM. Otherwise P&L = -N (settle - prev settle) into VİOP cash.
  3. IPO exits / allocation payments (cash leaves the PPF on first_trade-1, pledge released).
  4. quarterly 10% stopaj on positive futures P&L (debited from VİOP cash).
  5. month-end sleeve rebalance (v3), only free PPF may leave the IPO/PPF sleeve.
  6. futures: roll (cost), R3 target L[t-1] x B where B = PPF sleeve value (PPF + VİOP cash + live IPO shares),
     rebalance band as audit, integer contracts of 1,000 USD, size capped by non-blocked resources.
  7. collateral sweep: Vc -> 0.5 IM (cash), Pv -> 0.5 IM/(1-h) (posted PPF); excess VİOP cash back to PPF.
  8. new IPO subscriptions: R_eff = min(R, PPF - pledged - Pv)   (VİOP has priority over IPO).
"""
import sys, pathlib, itertools, json, re
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; OUT = H / "results"
sys.path.insert(0, str(H)); sys.path.insert(0, str(H.parent / "try_carry_audit"))
sys.dont_write_bytecode = True
import combo as CB
import combo_v3 as V3
import audit_lib as AL

IM, MAINT, TC, SLIP, TAXF, CSIZE = 0.11, 0.0825, 0.0005, 0.005, 0.10, 1000.0
D_PANEL = AL.panel(); POLC, _ = AL.corrected_rates(D_PANEL)
F0 = AL.futures_panel()
F0 = F0[F0.code.str.match(r"F_USDTRY\d{4}$")]
W3 = json.load(open(OUT / "weights_v3.json"))


# ---------------------------------------------------------------- futures arrays on the sleeve calendar
def carry_arrays(idx, Lmax, F=None, d=None):
    F = F0 if F is None else F; d = D_PANEL if d is None else d
    L = AL.signals(d, POLC, d.cpi, Lmax=Lmax)
    fd = [x for x in sorted(F.date.unique()) if idx[0] - pd.Timedelta(days=10) <= x <= idx[-1]]
    fd = [pd.Timestamp(x) for x in fd]
    by = {x: g.set_index("code") for x, g in F[F.date.isin(fd)].groupby("date")}
    Lv = L.reindex(fd).fillna(0).values
    front = {}
    for x in fd:
        g = by[x]; c = g[(g.expiry - x).dt.days > 4].sort_values("expiry"); front[x] = c.index[0]
    n = len(idx); pos = {x: k for k, x in enumerate(fd)}
    A = dict(open=np.zeros(n, bool), p0=np.zeros(n), hi=np.zeros(n), st=np.zeros(n), roll=np.zeros(n, bool),
             rollpx=np.zeros(n), px=np.zeros(n), tgt=np.zeros(n))
    for i, x in enumerate(idx):
        k = pos.get(x)
        if k is None or k == 0: continue
        dp = fd[k - 1]; held = front[dp]; g = by[x]
        A["open"][i] = True; A["p0"][i] = by[dp].loc[held, "settle"]
        if held in g.index:
            r = g.loc[held]; st = r.settle; hi = max(r.high if r.high > 0 else st, st)
        else:
            st = hi = A["p0"][i]
        A["st"][i] = st; A["hi"][i] = hi
        fr = front[x]; A["px"][i] = g.loc[fr, "settle"]
        if fr != held and held in g.index:
            A["roll"][i] = True; A["rollpx"][i] = g.loc[held, "settle"] + g.loc[fr, "settle"]
        A["tgt"][i] = Lv[k - 1]
    return A


# ---------------------------------------------------------------- one account
def sim(D, ev, A, cap, w, h=0.2, nema=0.0, cash_rule=True, ipo=True, carry=True, tau=V3.TAU, cshock=None,
        im=IM, maint=MAINT):
    idx, fx, ru, mm, cr = D["idx"], D["fx"], D["ru"], D["mm"], D["c"].copy()
    if cshock is not None: cr[cshock[0]] += cshock[1]
    pos0, ev_sub, ev_alloc, ev_exit = ev if ipo else ({}, {}, {}, {})
    pos = {k: dict(v, live=False, value=0.0) for k, v in pos0.items()}
    wi, wo, wc = w; n = len(idx)
    Hm = cap * wi; Ho = cap * wo * (1 - V3.FEE_O); Hc = cap * wc * (1 - V3.FEE_C); reserved = 0.0
    Vc = 0.0; Pv = 0.0; N = 0.0; qp = 0.0
    pnl_o = 0.0; ncall = nliq = ntr = 0; futpnl = 0.0; levsum = 0.0; levn = 0; blocked_days = 0
    eq = np.empty(n); eq[0] = Hm + Ho + Hc; ho_end = np.empty(n); ho_end[0] = Ho; elo = np.full(n, np.nan)
    yr = idx.year.values; csh = 0.5 if cash_rule else 0.0
    dead = False
    for i in range(1, n):
        if dead: eq[i] = 0.0; ho_end[i] = 0; continue
        g = fx[i] / fx[i - 1] * (1 + ru[i]) - 1
        pnl_o += Ho * g; Ho *= 1 + g; Hm *= 1 + mm[i]; Vc *= 1 + (nema * mm[i] if Vc > 0 else mm[i]); Hc *= 1 + cr[i]
        Pv *= 1 + mm[i]; reserved_val = reserved
        for p in pos.values():
            if p["live"] and np.isfinite(p["px"][i]): p["value"] = p["lots_eff"] * p["px"][i]
        if i == n - 1 or yr[i + 1] != yr[i]:
            if pnl_o > 0 and tau > 0: Ho -= tau * pnl_o
            pnl_o = 0.0
        # ---- 2. futures P&L with intraday margin check
        fut = 0.0
        if carry and A["open"][i] and N > 0:
            p0, hi, st = A["p0"][i], A["hi"][i], A["st"][i]
            IMh = im * N * hi
            CVh = Vc - N * (hi - p0) + min((1 - h) * Pv, (1 - csh) * IMh if cash_rule else 1e18)
            elo_i = -N * (hi - st)
            if CVh < maint * N * hi:
                ncall += 1
                need = IMh - CVh; free = max(0.0, Hm - Pv - reserved)
                if free >= need:
                    Hm -= need; Vc += need; fut = -N * (st - p0)
                else:
                    Hm -= free; Vc += free; CV = CVh + free
                    Nk = max(0.0, np.floor(CV / (im * hi) / CSIZE) * CSIZE) if CV > 0 else 0.0
                    Nk = min(Nk, N)
                    fut = -(N - Nk) * (hi * (1 + SLIP) - p0) - Nk * (st - p0) - (N - Nk) * hi * TC
                    N = Nk; nliq += 1; elo_i = 0.0
            else:
                fut = -N * (st - p0)
            Vc += fut; qp += fut; futpnl += fut
        else:
            elo_i = 0.0
        # ---- 3. IPO exits / allocations
        for tk in ev_exit.get(i, []):
            p = pos[tk]
            if not p["live"]: continue
            Hm += p["lots_eff"] * p["exit_px"] * (1 - CB.FEE_IPO); p["live"] = False; p["value"] = 0.0
        for tk in ev_alloc.get(i, []):
            p = pos[tk]
            if "R_eff" not in p: continue
            cost = p["lots_eff"] * p["price"] * (1 + CB.FEE_IPO)
            reserved -= p["R_eff"]; Hm -= cost; p["paid"] = cost
            p["live"] = p["lots_eff"] > 0; p["value"] = p["lots_eff"] * p["price"]
        reserved = max(reserved, 0.0)
        # ---- 4. futures tax (quarterly)
        if i == n - 1 or idx[i + 1].quarter != idx[i].quarter or yr[i + 1] != yr[i]:
            if qp > 0: Vc -= TAXF * qp
            qp = 0.0
        iv = sum(p["value"] for p in pos.values() if p["live"])
        # ---- 5. month-end sleeve rebalance (v3)
        if D["reb"][i]:
            tot = Hm + Vc + Ho + Hc + iv
            dc = wc * tot - Hc; do = wo * tot - Ho
            cost = abs(dc) * V3.FEE_C + abs(do) * V3.FEE_O
            dm = -(dc + do) - cost
            fr = Hm - reserved - Pv
            if dm < 0 and fr + dm < 0:
                s = max(fr, 0.0) / (-dm); dc *= s; do *= s; dm = -(dc + do) - (abs(dc) * V3.FEE_C + abs(do) * V3.FEE_O)
            Hc += dc - abs(dc) * V3.FEE_C; Ho += do - abs(do) * V3.FEE_O; Hm += -(dc + do)
        # ---- 6. futures roll / target
        if carry and A["open"][i]:
            px = A["px"][i]
            if N > 0 and A["roll"][i]: Vc -= N * A["rollpx"][i] * TC
            B = Hm + Vc + iv
            tgt = A["tgt"][i]; cur = N * px / B if B > 0 else 0.0
            if (tgt == 0 and N > 0) or (tgt > 0 and abs(tgt - cur) > max(0.1, 0.2 * tgt)):
                newN = tgt * B / px
                res_ = Vc + Hm - reserved                       # non-blocked resources
                per = im * px * (csh + (1 - csh) / (1 - h))     # resources needed per USD notional at IM
                newN = min(newN, max(res_, 0.0) / per)
                newN = np.floor(newN / CSIZE) * CSIZE
                if newN != N:
                    Vc -= abs(newN - N) * px * TC; N = newN; ntr += 1
            # ---- 7. collateral sweep
            if N > 0:
                IMn = im * N * px; vt = csh * IMn; pt = (IMn - vt) / (1 - h)
                avail = Hm - reserved
                if Vc > vt: Hm += Vc - vt; Vc = vt
                else:
                    dcash = min(vt - Vc, max(avail, 0.0)); Hm -= dcash; Vc += dcash
                Pv = min(pt, max(Hm - reserved, 0.0))
                levsum += N * px / max(B, 1e-9); levn += 1
            else:
                Hm += Vc; Vc = 0.0; Pv = 0.0
        # ---- 8. new IPO subscriptions (only from free PPF)
        for tk in ev_sub.get(i, []):
            p = pos[tk]
            Reff = max(0.0, min(p["R"], Hm - reserved - Pv))
            if Reff < p["R"] - 1e-6 and N > 0: blocked_days += 1
            p["lots_eff"] = min(p["lots"], np.floor(Reff / p["price"])); p["R_eff"] = Reff; reserved += Reff
        eq[i] = Hm + Vc + Ho + Hc + iv; ho_end[i] = Ho
        elo[i] = eq[i] + elo_i
        if eq[i] <= 0: dead = True; eq[i] = 0.0
    st = D["start"]; tro = np.full(n, np.nan); pk = np.maximum.accumulate(eq)
    for i in np.where(st >= 0)[0]:
        i0 = st[i]; tro[i] = (eq[i0] + ho_end[i0] * D["trough"][i]) / pk[i0] - 1
    lo = elo / np.maximum.accumulate(eq) - 1
    tro = np.fmin(tro, lo)
    return (pd.Series(eq, index=idx), pd.Series(tro, index=idx),
            dict(ncall=ncall, nliq=nliq, ntr=ntr, futpnl=futpnl, avgL=levsum / max(levn, 1), ipo_short=blocked_days))


def stats(eq, tro):
    """v3 stats (geo per 30.44 days, MTM dd incl. Deribit intra-week and futures intraday-high troughs);
    worst month fixed: v3 prepended a zero-length month when the window starts on a month end (IS 2021-12-31)."""
    s = V3.stats(eq, tro); s.pop("wk_r", None)
    m = eq.resample("ME").last()
    if m.index[0] <= eq.index[0]: m = m.iloc[1:]
    mr = pd.concat([pd.Series([eq.iloc[0]], index=[eq.index[0]]), m]).pct_change().dropna()
    s["worst_m"] = mr.min(); s["neg_m"] = int((mr < 0).sum()); s["months"] = len(mr)
    return s


CAPS = V3.CAPS; ACCS = V3.ACCS; SIZES = [1, 2]; LMAX = [3, 5]; HC = [0.10, 0.20]; NEMA = [0.0, 1.0]

if __name__ == "__main__":
    import time
    t0 = time.time()
    tr, pxs = CB.load_ipos()
    per_w = {"IS": (V3.IS0, V3.IS1), "OOS": (V3.OOS0, V3.OOS1)}
    Ds = {(per, sz): V3.prep(a, b, sz) for per, (a, b) in per_w.items() for sz in SIZES}
    EV = {per: V3.ipo_events(tr, pxs, Ds[(per, 1)]["idx"]) for per in per_w}
    AA = {(per, Lm): carry_arrays(Ds[(per, 1)]["idx"], Lm) for per in per_w for Lm in LMAX + [4]}
    pd.to_pickle(AA, OUT / "carry_arrays_v4.pkl")
    G = V3.grid(0.1); rows = []; nsim = 0

    def rec(C, k, sz, Lm, h, nema, w, per, scheme, carry=True, ipo=True, cash_rule=True):
        global nsim
        e, t, dg = sim(Ds[(per, sz)], EV[per], AA[(per, Lm)], C / k, w, h, nema, cash_rule, ipo, carry); nsim += 1
        s = stats(e * k, t)
        rows.append(dict(C=C, accounts=k, size=sz, Lmax=Lm, h=h, nema=nema, cash_rule=cash_rule, carry=carry, ipo=ipo,
                         w_ipo=w[0], w_opt=w[1], w_c=w[2], period=per, scheme=scheme,
                         sharpe=V3.sharpe_wk(e, Ds[(per, sz)]), geo=s["geo"], maxdd=s["maxdd"], maxdd_mtm=s["maxdd_mtm"],
                         worst_m=s["worst_m"], neg_m=s["neg_m"], **dg))
    # main grid: 0.1 weight simplex x capital x accounts x opt size x Lmax x haircut x nema, IS and OOS
    for C, k, sz, Lm, h, nema in itertools.product(CAPS, ACCS, SIZES, LMAX, HC, NEMA):
        for w in G:
            for per in per_w: rec(C, k, sz, Lm, h, nema, w, per, "grid")
        for sch in ("EQ", "IV", "SH"):
            w = tuple(W3[f"{C}|{k}|{sz}"][sch])
            for per in per_w: rec(C, k, sz, Lm, h, nema, w, per, sch)
        print(C, k, sz, Lm, h, nema, f"{time.time() - t0:.0f}s", flush=True)
    # references: no carry (= v3 engine), carry without IPO, no cash rule, Lmax 4 neighbour
    for C, k, sz in itertools.product(CAPS, ACCS, SIZES):
        for w in G:
            for per in per_w:
                rec(C, k, sz, 3, 0.2, 0.0, w, per, "nocarry", carry=False)
                for nema in NEMA:
                    rec(C, k, sz, 4, 0.2, nema, w, per, "grid")
                    rec(C, k, sz, 4, 0.1, nema, w, per, "grid")
    for C, k in itertools.product(CAPS, ACCS):
        for Lm, h, nema in itertools.product(LMAX + [4], HC, NEMA):
            for per in per_w:
                rec(C, k, 1, Lm, h, nema, (1, 0, 0), per, "carry_only", ipo=False)
                rec(C, k, 1, Lm, h, nema, (1, 0, 0), per, "nocashrule", cash_rule=False)
    res = pd.DataFrame(rows); res.to_csv(OUT / "all_results_v4.csv", index=False)
    print("simulations:", nsim, f"{time.time() - t0:.0f}s")
