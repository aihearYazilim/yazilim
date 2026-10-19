"""Numba simulators for retail 'passive income' crypto bots on Binance 1m klines.

Fill model (conservative, order-of-high/low independent):
  * only orders resting at the START of a bar can fill in that bar; a counter-order created by a
    fill is placed at bar close and can fill from the next bar on (no intrabar round trips);
  * a limit order fills only if price trades THROUGH it by eps (default 2 bp), at the limit price;
  * market orders (init buys, stops, re-centering, DCA base orders) pay taker fee + slippage at the close;
  * futures: funding charged every 8h on the position notional, liquidation if equity at the
    bar's worst extreme (post-fill position) < 0.5% maintenance margin -> equity 0, bot dead.
Equity is recorded at each UTC day's last minute.
"""
import numpy as np
from numba import njit

MM = 0.005  # maintenance margin rate


@njit(cache=True)
def _levels(P, lo, hi, n, geo):
    p = np.empty(n + 1)
    if geo:
        r = (hi / lo) ** (1.0 / n)
        for k in range(n + 1):
            p[k] = lo * r ** k
    else:
        d = (hi - lo) / n
        for k in range(n + 1):
            p[k] = lo + d * k
    return p


@njit(cache=True)
def _range(P, day, d0, dH, dL, dC, rng_type, rng_par):
    """Grid range from data strictly before `day` plus current price P."""
    j = day - d0
    if rng_type == 0:  # trailing N-day high/low
        N = int(rng_par)
        hi = -1.0
        lo = 1e30
        for k in range(max(0, j - N), j):
            if dH[k] == dH[k]:
                hi = max(hi, dH[k]); lo = min(lo, dL[k])
        if hi < 0:
            hi = P * 1.1; lo = P * 0.9
        hi = max(hi, P * 1.02); lo = min(lo, P * 0.98)
    elif rng_type == 1:  # +- k * ATR14% (daily)
        s = 0.0; m = 0
        for k in range(max(0, j - 14), j):
            if dH[k] == dH[k]:
                s += (dH[k] - dL[k]) / dC[k]; m += 1
        atr = s / m if m > 0 else 0.04
        w = rng_par * atr
        hi = P * (1 + w); lo = P * max(1 - w, 0.05)
    else:  # fixed +- pct
        hi = P * (1 + rng_par); lo = P * max(1 - rng_par, 0.05)
    return lo, hi


@njit(cache=True)
def grid_sim(t, o, h, l, c, i0, i1, d0, dH, dL, dC, ft, fr,
             mode, n, geo, rng_type, rng_par, lev, exit_up, exit_dn, sl, rec_days,
             fee_m, fee_t, slip, eps, fdefault):
    """mode 0 spot long grid, 1 futures long, 2 futures short, 3 futures neutral.
    exit_up: 0 wait, 1 restart when close > top.  exit_dn: 0 wait (no stop), 1 stop at lo*(1-sl) then
    restart after 1 day, 2 stop at lo*(1-sl) and restart immediately.  rec_days>0: forced re-centering.
    Returns daily equity (start=1), grid profit cum, n_fills, fees, funding, liquidated, n_restarts."""
    ndays = t[i1 - 1] // 1440 - t[i0] // 1440 + 1
    eq_d = np.full(ndays, np.nan)
    gp_d = np.full(ndays, np.nan)
    day_first = t[i0] // 1440
    cash = 1.0; pos = 0.0
    gprofit = 0.0; fees = 0.0; fund = 0.0; nfill = 0; nrest = 0
    dead = False
    p = np.empty(n + 1); q = np.zeros(n); typ = np.zeros(n, np.int64); st = np.zeros(n, np.int64)
    need_init = True; wait_until = -1; t_init = 0
    fi = 0
    while fi < len(ft) and ft[fi] < t[i0]:
        fi += 1
    fees_spot = mode == 0
    for i in range(i0, i1):
        ti = t[i]
        if dead:
            eq_d[ti // 1440 - day_first] = 0.0
            continue
        # funding at 8h boundaries
        if not fees_spot:
            rate = 0.0
            while fi < len(ft) and ft[fi] <= ti:
                rate += fr[fi]; fi += 1
            if fi >= len(ft) and ti % 480 == 0 and ti > ft[len(ft) - 1] + 1:
                rate += fdefault
            if rate != 0.0 and pos != 0.0:
                f = pos * o[i] * rate
                cash -= f; fund += f
        if need_init:
            if ti >= wait_until:
                P = c[i]
                lo, hi = _range(P, ti // 1440, d0, dH, dL, dC, rng_type, rng_par)
                p[:] = _levels(P, lo, hi, n, geo)
                eqv = cash + pos * P
                inv = eqv * lev
                tgt = 0.0
                for g in range(n):
                    q[g] = inv / n / p[g] if geo else inv / n / P
                    st[g] = 0
                    if p[g] <= P < p[g + 1]:
                        typ[g] = 0  # skipped gap containing price
                        continue
                    above = p[g] > P
                    if mode == 0 or mode == 1:
                        typ[g] = 1
                        if above:
                            st[g] = 1; tgt += q[g]
                    elif mode == 2:
                        typ[g] = -1
                        if not above:
                            st[g] = 1; tgt -= q[g]
                    else:
                        if above:
                            typ[g] = -1
                        else:
                            typ[g] = 1
                dq = tgt - pos
                if dq != 0.0:
                    px = P * (1 + slip) if dq > 0 else P * (1 - slip)
                    cash -= dq * px
                    fe = abs(dq) * px * fee_t
                    cash -= fe; fees += fe
                    pos = tgt
                need_init = False; t_init = ti; nrest += 1
            eq_d[ti // 1440 - day_first] = cash + pos * c[i]
            gp_d[ti // 1440 - day_first] = gprofit
            continue
        lo_i = l[i]; hi_i = h[i]
        # candidate gaps
        g0 = np.searchsorted(p, lo_i) - 1
        g1 = np.searchsorted(p, hi_i) + 1
        if g0 < 0:
            g0 = 0
        if g1 > n:
            g1 = n
        if g0 < g1:
            # snapshot of bar-start states
            for g in range(g0, g1):
                tg = typ[g]
                if tg == 0:
                    continue
                s = st[g]
                if tg == 1:
                    if s == 0 and lo_i <= p[g] * (1 - eps):
                        cash -= q[g] * p[g]; pos += q[g]
                        fe = q[g] * p[g] * fee_m; cash -= fe; fees += fe
                        st[g] = 2; nfill += 1
                    elif s == 1 and hi_i >= p[g + 1] * (1 + eps):
                        cash += q[g] * p[g + 1]; pos -= q[g]
                        fe = q[g] * p[g + 1] * fee_m; cash -= fe; fees += fe
                        gprofit += q[g] * (p[g + 1] - p[g]) - q[g] * (p[g + 1] + p[g]) * fee_m
                        st[g] = 3; nfill += 1
                else:
                    if s == 0 and hi_i >= p[g + 1] * (1 + eps):
                        cash += q[g] * p[g + 1]; pos -= q[g]
                        fe = q[g] * p[g + 1] * fee_m; cash -= fe; fees += fe
                        st[g] = 2; nfill += 1
                    elif s == 1 and lo_i <= p[g] * (1 - eps):
                        cash -= q[g] * p[g]; pos += q[g]
                        fe = q[g] * p[g] * fee_m; cash -= fe; fees += fe
                        gprofit += q[g] * (p[g + 1] - p[g]) - q[g] * (p[g + 1] + p[g]) * fee_m
                        st[g] = 3; nfill += 1
            for g in range(g0, g1):  # 2 -> in position, 3 -> re-armed (effective next bar)
                if st[g] == 2:
                    st[g] = 1
                elif st[g] == 3:
                    st[g] = 0
        # liquidation (futures)
        if not fees_spot:
            e_lo = cash + pos * lo_i; e_hi = cash + pos * hi_i
            if min(e_lo, e_hi) < MM * abs(pos) * (lo_i if e_lo < e_hi else hi_i):
                dead = True; cash = 0.0; pos = 0.0
                eq_d[ti // 1440 - day_first] = 0.0
                continue
        C = c[i]
        restart = False; cool = False
        if C > p[n] and exit_up == 1:
            restart = True
        if exit_dn > 0 and C < p[0] * (1 - sl):
            restart = True
            if exit_dn == 1:
                cool = True
        if mode == 2 and exit_dn > 0 and C > p[n] * (1 + sl):  # short grid stop above
            restart = True; cool = exit_dn == 1
        if rec_days > 0 and ti - t_init >= rec_days * 1440:
            restart = True
        if restart:
            if pos != 0.0:
                px = C * (1 - slip) if pos > 0 else C * (1 + slip)
                cash += pos * px
                fe = abs(pos) * px * fee_t; cash -= fe; fees += fe
                pos = 0.0
            need_init = True
            wait_until = ti + 1440 if cool else ti + 1
        eq_d[ti // 1440 - day_first] = cash + pos * C
        gp_d[ti // 1440 - day_first] = gprofit
    return eq_d, gp_d, nfill, fees, fund, dead, nrest, abs(pos) * c[i1 - 1]


@njit(cache=True)
def dca_sim(t, o, h, l, c, i0, i1, ft, fr, futures, so_ratio, vs, m, dev, ss, tp, sl, lev,
            fee_m, fee_t, slip, eps, fdefault):
    """3Commas-style long DCA bot. Base order B at market, m safety orders (limit) at cumulative
    deviations dev*(1+ss+..+ss^(k)), size B*so_ratio*vs^k, TP limit at avg*(1+tp), optional stop sl
    (from avg, 0=none, restart after 1 day). Total possible notional = lev * equity at deal start.
    Returns daily equity, realized deal profit cum, n_deals, fees, funding, dead, n_stops."""
    ndays = t[i1 - 1] // 1440 - t[i0] // 1440 + 1
    eq_d = np.full(ndays, np.nan); rp_d = np.full(ndays, np.nan)
    day_first = t[i0] // 1440
    cash = 1.0; qty = 0.0; cost = 0.0
    realized = 0.0; fees = 0.0; fund = 0.0; ndeal = 0; nstop = 0; dead = False
    tot = 1.0; sk = 1.0
    for k in range(m):
        tot += so_ratio * sk; sk *= vs
    so_px = np.empty(m); so_q = np.empty(m)
    nxt = 0; open_ = False; wait_until = -1
    fi = 0
    while fi < len(ft) and ft[fi] < t[i0]:
        fi += 1
    for i in range(i0, i1):
        ti = t[i]
        if dead:
            eq_d[ti // 1440 - day_first] = 0.0
            continue
        if futures:
            rate = 0.0
            while fi < len(ft) and ft[fi] <= ti:
                rate += fr[fi]; fi += 1
            if fi >= len(ft) and ti % 480 == 0 and ti > ft[len(ft) - 1] + 1:
                rate += fdefault
            if rate != 0.0 and qty != 0.0:
                f = qty * o[i] * rate; cash -= f; fund += f
        if not open_:
            if ti >= wait_until:
                P = c[i]; eqv = cash
                B = eqv * lev / tot
                px = P * (1 + slip)
                qb = B / px
                fe = B * fee_t
                cash -= B + fe; fees += fe
                qty = qb; cost = B + fe
                cum = 0.0; sk = 1.0; st = 1.0
                for k in range(m):
                    cum += dev * st; st *= ss
                    so_px[k] = P * max(1 - cum, 0.01)
                    so_q[k] = B * so_ratio * sk / so_px[k]; sk *= vs
                nxt = 0; open_ = True
            eq_d[ti // 1440 - day_first] = cash + qty * c[i]
            rp_d[ti // 1440 - day_first] = realized
            continue
        avg = cost / qty
        tpp = avg * (1 + tp)
        filled = False
        while nxt < m and l[i] <= so_px[nxt] * (1 - eps):
            v = so_q[nxt] * so_px[nxt]
            fe = v * fee_m
            cash -= v + fe; fees += fe; qty += so_q[nxt]; cost += v + fe
            nxt += 1; filled = True
        if (not filled) and h[i] >= tpp * (1 + eps):
            v = qty * tpp; fe = v * fee_m
            cash += v - fe; fees += fe
            realized += v - fe - cost
            qty = 0.0; cost = 0.0; open_ = False; ndeal += 1
            wait_until = ti + 1
        if futures and qty > 0:
            e = cash + qty * l[i]
            if e < MM * qty * l[i]:
                dead = True; eq_d[ti // 1440 - day_first] = 0.0
                continue
        if open_ and sl > 0 and c[i] <= (cost / qty) * (1 - sl):
            px = c[i] * (1 - slip); v = qty * px; fe = v * fee_t
            cash += v - fe; fees += fe; realized += v - fe - cost
            qty = 0.0; cost = 0.0; open_ = False; nstop += 1; ndeal += 1
            wait_until = ti + 1440
        eq_d[ti // 1440 - day_first] = cash + qty * c[i]
        rp_d[ti // 1440 - day_first] = realized
    return eq_d, rp_d, ndeal, fees, fund, dead, nstop, qty * c[i1 - 1]


@njit(cache=True)
def rebal_sim(t, o, h, l, c, i0, i1, cv, w, r, fee_m, eps):
    """Single-coin rebalancing ('infinity') ladder bot, spot. Geometric ladder step r around the last
    trade price. cv=0: constant proportion (coin weight w, Binance 'rebalancing'); cv=1: constant coin
    value V0 = w*equity0 (Binance 'infinity grid', buys stop when cash is exhausted).
    Only orders resting at bar start fill; path order O->L->H->C if close>=open else O->H->L->C.
    Returns daily equity, n_fills, fees, 'grid profit' proxy (sum of |trade| * r/2)."""
    ndays = t[i1 - 1] // 1440 - t[i0] // 1440 + 1
    eq_d = np.full(ndays, np.nan)
    day_first = t[i0] // 1440
    P0 = c[i0]
    N = w / (P0 * (1 + 0.001)); cash = 1.0 - w
    fees = w * 0.001; nfill = 0; gp = 0.0
    V0 = w
    ref = P0
    for i in range(i0, i1):
        up_first = c[i] < o[i]
        ref0 = ref
        last = ref0
        for leg in range(2):
            goup = (leg == 0) == up_first
            k = 1
            while k < 400:
                P = ref0 * (1 + r) ** k if goup else ref0 * (1 + r) ** (-k)
                if goup and h[i] < P * (1 + eps):
                    break
                if (not goup) and l[i] > P * (1 - eps):
                    break
                tgt = (cash + N * P) * w if cv == 0 else V0
                if goup:
                    dv = N * P - tgt
                    if dv > 0:
                        cash += dv * (1 - fee_m); fees += dv * fee_m; N -= dv / P; nfill += 1; gp += dv * r / 2
                        last = P
                else:
                    dv = tgt - N * P
                    if dv > cash / (1 + fee_m):
                        dv = cash / (1 + fee_m)
                    if dv > 1e-9:
                        cash -= dv * (1 + fee_m); fees += dv * fee_m; N += dv / P; nfill += 1; gp += dv * r / 2
                    last = P
                k += 1
        ref = last
        eq_d[t[i] // 1440 - day_first] = cash + N * c[i]
    return eq_d, nfill, fees, gp, N * c[i1 - 1]
