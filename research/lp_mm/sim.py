"""Concentrated-liquidity LP simulator (Uniswap v3 math) on hourly on-chain fee growth.
Fees: my_L * dFeeGrowth(per unit L, from pool feeGrowthGlobal) * in-range fraction * dilution (liq/(liq+my_L)).
Price PnL: exact v3 token amounts at each hourly pool price. Optional delta hedge with perps.
"""
import numpy as np
from numba import njit


@njit(cache=True)
def amounts(L, p, pa, pb):
    if p <= pa:
        return L * (1.0/np.sqrt(pa) - 1.0/np.sqrt(pb)), 0.0
    if p >= pb:
        return 0.0, L * (np.sqrt(pb) - np.sqrt(pa))
    return L * (1.0/np.sqrt(p) - 1.0/np.sqrt(pb)), L * (np.sqrt(p) - np.sqrt(pa))


@njit(cache=True)
def frac_in(lo, hi, pa, pb):
    if hi <= lo * (1 + 1e-12):
        return 1.0 if (lo >= pa and lo <= pb) else 0.0
    a = max(lo, pa); b = min(hi, pb)
    if b <= a:
        return 0.0
    return np.log(b / a) / np.log(hi / lo)


@njit(cache=True)
def run(p, lo, hi, d0, d1, liq, u0, u1, gas, f0, f1, newmonth, start,
        k, rule, hedge, risky0, risky1, swap_cost, perp_cost, hedge_thr, mfrac, capital, outlag):
    """Returns equity (USD, start=1), and decomposition arrays (cumulative)."""
    n = len(p)
    eq = np.full(n, np.nan)
    dec = np.zeros((n, 7))  # fees, market(hodl), IL, perp pnl, funding, swap+gas cost, perp cost
    cum = np.zeros(7)
    m = mfrac if hedge else 0.0
    # open position at index start
    E = 1.0
    i = start
    cash = 0.0  # idle USD inside LP account (fees)
    M = m * E
    B = E - M
    pa = p[i] / k; pb = p[i] * k
    x1, y1 = amounts(1.0, p[i], pa, pb)
    v1 = x1 * u0[i] + y1 * u1[i]
    risky_val = (x1 * u0[i] if risky0 else 0.0) + (y1 * u1[i] if risky1 else 0.0)
    # buy risky part from USD (or for risky/risky pool buy both)
    c_open = swap_cost * (risky_val / v1) * B + gas[i] / capital
    B -= c_open; cum[5] -= c_open
    L = B / v1
    x, y = amounts(L, p[i], pa, pb)
    q0 = x if (hedge and risky0) else 0.0
    q1 = y if (hedge and risky1) else 0.0
    c = perp_cost * (q0 * u0[i] + q1 * u1[i])
    M -= c; cum[6] -= c
    eq[i] = x * u0[i] + y * u1[i] + cash + M
    outc = 0
    for h in range(i + 1, n):
        # --- accrue hour (h-1 -> h) with position set at end of h-1
        x0, y0 = amounts(L, p[h-1], pa, pb)
        fr = frac_in(lo[h], hi[h], pa, pb)
        Lraw = L * capital
        share = liq[h] / (liq[h] + Lraw) if liq[h] > 0 else 0.0
        fee = L * (d0[h] * u0[h] + d1[h] * u1[h]) * fr * share
        cash += fee
        x, y = amounts(L, p[h], pa, pb)
        hodl = x0 * (u0[h] - u0[h-1]) + y0 * (u1[h] - u1[h-1])
        dv = (x * u0[h] + y * u1[h]) - (x0 * u0[h-1] + y0 * u1[h-1])
        il = dv - hodl
        ppnl = -q0 * (u0[h] - u0[h-1]) - q1 * (u1[h] - u1[h-1])
        fund = q0 * u0[h] * f0[h] + q1 * u1[h] * f1[h]
        M += ppnl + fund
        cum[0] += fee; cum[1] += hodl; cum[2] += il; cum[3] += ppnl; cum[4] += fund
        # --- decisions at end of hour h (using info up to h)
        out = p[h] < pa or p[h] > pb
        outc = outc + 1 if out else 0
        do_re = False
        if rule == 0 and newmonth[h]:
            do_re = True
        elif rule == 1 and out:
            do_re = True
        elif rule == 2 and outc >= outlag:
            do_re = True
        elif rule == 3 and (out or newmonth[h]):
            do_re = True
        V = x * u0[h] + y * u1[h]
        if do_re:
            E = V + cash + M
            if E <= 0:
                eq[h:] = 0.0
                break
            cash = 0.0
            Mn = m * E
            Bn = E - Mn
            pa = p[h] / k; pb = p[h] * k
            xn1, yn1 = amounts(1.0, p[h], pa, pb)
            vn1 = xn1 * u0[h] + yn1 * u1[h]
            # swap notional on the risky legs (old holdings + idle USD -> new target)
            dA = (xn1 / vn1 * Bn - x) * u0[h] if risky0 else 0.0
            dB = (yn1 / vn1 * Bn - y) * u1[h] if risky1 else 0.0
            if dA * dB < 0:
                notional = max(abs(dA), abs(dB))
            else:
                notional = abs(dA) + abs(dB)
            cst = swap_cost * notional + gas[h] / capital
            Bn -= cst; cum[5] -= cst
            L = Bn / vn1
            M = Mn
            x, y = amounts(L, p[h], pa, pb)
            outc = 0
        # hedge adjust
        if hedge:
            t0 = x if risky0 else 0.0
            t1 = y if risky1 else 0.0
            dev = abs(t0 - q0) * u0[h] + abs(t1 - q1) * u1[h]
            Vl = x * u0[h] + y * u1[h]
            if do_re or dev > hedge_thr * Vl:
                c = perp_cost * dev
                M -= c; cum[6] -= c
                q0 = t0; q1 = t1
        eq[h] = x * u0[h] + y * u1[h] + cash + M
        dec[h] = cum
    return eq, dec
