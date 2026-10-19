"""Audit copy of port.sim with fixes: (1) liquidity cap uses CURRENT dollar equity (cap0*eq), not fixed $100k;
(2) each evaluation window starts fresh with $cap0 at its start date (IS from 2022-01-01, OOS from 2025-10-17),
only trades entered inside the window are taken; (3) optional mark-to-market gross (notional*(1+loss)) for the cap."""
import sys, pathlib, pandas as pd, numpy as np
H = pathlib.Path("/home/user/yazilim/research/crypto_events"); sys.path.insert(0, str(H)); sys.path.insert(0, str(H.parents[1] / "src"))
import trades as T, port
from engine import stats
IDX = T.IDX; btc_r = port.btc_r; btc_f = port.btc_f; fx = port.fx

def sim(trs, s=0.2, G=2.0, hedge=1, start="2022-01-01", end="2025-10-16", cap0=100_000.0, liq=0.01, mtm_gross=True, hedge_cost=0.001):
    st, en = pd.Timestamp(start), pd.Timestamp(end)
    by_day = {}
    for tr in trs:
        if st <= tr["d0"] <= en: by_day.setdefault(tr["d0"], []).append(tr)
    eq = 1.0; out = np.zeros(len(IDX)); open_ = []; hed = 0.0; log = []
    for t, d in enumerate(IDX):
        if d < st: continue
        eq0 = eq; pnl = 0.0; keep = []
        for p in open_:
            tr, n, lc = p; path = tr["path"]
            if d in path.index:
                c = path[d]; pnl += n * (c - lc); p[2] = c
            if d < path.index[-1]: keep.append(p)
        open_ = keep
        if hedge and t > 0: pnl += hed * (btc_r[t] - btc_f[t])
        gross = sum(abs(p[1]) * ((1 - p[2]) if mtm_gross else 1) for p in open_)
        for tr in by_day.get(d, []):
            if any(p[0]["sym"] == tr["sym"] for p in open_): continue
            n = s * eq0
            lim = liq * tr["vol"] / (cap0 * eq0)
            frac = min(1.0, lim / s) if s > 0 else 0
            if frac < 0.2: continue
            n *= frac
            if gross + n > G * eq0 + 1e-12: continue
            c = tr["path"].get(d, None)
            pnl += n * (c if c is not None else -T.FEE)
            p = [tr, n, c if c is not None else -T.FEE]
            if len(tr["path"]) > 1 or tr["path"].index[-1] > d: open_.append(p)
            gross += n; log.append((tr["tag"], tr["sym"], d, n, float(tr["path"].iloc[-1]), frac))
        eq = eq0 + pnl
        if hedge:
            net = sum(p[1] * p[0]["side"] for p in open_); tgt = -net
            eq -= abs(tgt - hed) * hedge_cost; hed = tgt
        if eq <= 0: out[t] = -1; break
        out[t] = eq / eq0 - 1
        if d > en and not open_: break
    r = pd.Series(out, IDX)[st:]
    r.attrs["log"] = log
    return r

def st_(x, a, b):
    s_ = stats((1 + x).cumprod(), a, b); return s_.get("aylik_geo_%"), s_.get("maxDD_%"), s_.get("en_kotu_ay_%")

def both(trs, s=0.2, G=2.0, hedge=1, **kw):
    """IS window 2022-01-01..2025-10-16 and OOS 2025-10-17..2026-10-16, each starting fresh at cap0.
    Trades still open at the window end are marked to the window end (stats cut at end)."""
    out = {}
    for nm, a, b in [("IS", "2022-01-01", "2025-10-16"), ("OOS", "2025-10-17", "2026-10-16")]:
        r = sim(trs, s, G, hedge, a, b, **kw)
        rt = (1 + r) * (1 + fx[r.index]) - 1
        u = st_(r, a, b); tt = st_(rt, a, b)
        out.update({f"{nm}_usd": u[0], f"{nm}_try": tt[0], f"{nm}_dd": u[1], f"{nm}_worst": u[2], f"{nm}_n": len(r.attrs["log"])})
        out[f"_{nm}_r"] = r
    return out
