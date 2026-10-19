"""New-listing perp short basket (Binance USDT-M, incl. delisted). Daily, no look-ahead:
decision at close of day t (UTC), entry at close t; P&L from t+1. Costs: 0.10% fee + 0.10% slippage per side,
real funding (short receives +funding), stop-loss on daily high (fill at max(open, stop)*(1+slip)).
Liquidity: position <= 1% of entry-day quote volume at $100k base capital. Margin USDT earns 0.
Output: daily USD net returns; TRY conversion in nl_grid."""
import pandas as pd, numpy as np, pathlib, sys
H = pathlib.Path(__file__).parent
P = pd.read_pickle(H / "nl_panels.pkl")
sys.path.insert(0, str(H.parents[0] / "carry")); import lib
SPOT = lib.P()["spot"]
EXCL = ["DOM", "DEFIUSDT", "USDCUSDT", "BUSDUSDT", "FDUSD", "TUSD", "USDPUSDT", "BTCSTUSDT"]
syms = [s for s in P["close"].columns if "_" not in s and not any(x in s for x in EXCL)]
IDX = P["close"].index
C = P["close"][syms].ffill(limit=5); O = P["open"][syms]; Hh = P["high"][syms]; V = P["qvol"][syms].fillna(0); F = P["fund"][syms].fillna(0)
first = P["close"][syms].apply(lambda s: s.first_valid_index())
last = P["close"][syms].apply(lambda s: s.last_valid_index())
sfirst = SPOT.apply(lambda s: s.first_valid_index())
first = first[first >= pd.Timestamp("2020-01-15")]   # panel starts 2019-09 -> earlier = not new
NEWTOK = {s: (s not in sfirst.index) or pd.isna(sfirst.get(s)) or sfirst[s] >= first[s] - pd.Timedelta(days=30) for s in first.index}
Ca, Oa, Ha, Va, Fa = (x.values for x in (C, O, Hh, V, F))
col = {s: i for i, s in enumerate(syms)}
pos_of = {d: i for i, d in enumerate(IDX)}
btc = P["close"]["BTCUSDT"].ffill().values; btcf = P["fund"]["BTCUSDT"].fillna(0).values
FEE = 0.002  # fee + slip per side
CAP0 = 100_000.0

def sim(L=1, Hd=30, stop=None, s=0.1, G=2.0, hedge=0, newtok=0, vmin=0.0):
    ent = {}
    for sym, d0 in first.items():
        if newtok and not NEWTOK[sym]: continue
        i0 = pos_of[d0] + L
        if i0 < len(IDX): ent.setdefault(i0, []).append(sym)
    eq = 1.0; out = np.zeros(len(IDX)); posl = []  # [j, units_notional_ratio(entry notional/price), entry_px, exit_i]
    hedge_n = 0.0
    lastI = {s: pos_of[last[s]] for s in first.index}
    for t in range(1, len(IDX)):
        eq_prev = eq; pnl = 0.0; keep = []
        for p in posl:
            j, u, ep, xi = p
            p0 = Ca[t-1, j]; 
            if t > lastI[syms[j]]:   # delisted: closed at last close (already marked)
                pnl -= u * p0 * FEE; continue
            c1 = Ca[t, j]; hi = Ha[t, j]; op = Oa[t, j]
            if np.isnan(c1): keep.append(p); continue
            if stop is not None and not np.isnan(hi) and hi >= ep * (1 + stop):
                px = max(op if not np.isnan(op) else ep*(1+stop), ep * (1 + stop))
                pnl += u * (p0 - px) + u * p0 * Fa[t, j] - u * px * FEE; continue
            pnl += u * (p0 - c1) + u * p0 * Fa[t, j]
            if t >= xi: pnl -= u * c1 * FEE; continue
            keep.append(p)
        posl = keep
        if hedge:
            rb = 0.0 if np.isnan(btc[t-1]) else btc[t] / btc[t-1] - 1
            pnl += hedge_n * (rb - btcf[t])
        eq += pnl
        if eq <= 0: out[t] = -1; out[t+1:] = 0; return pd.Series(out, IDX)
        # new entries at close t
        gross = sum(p[1] * Ca[t, p[0]] for p in posl if not np.isnan(Ca[t, p[0]]))
        if gross > G * eq:   # de-lever existing book back to the gross cap
            k = G * eq / gross
            for p in posl: p[1] *= k
            eq -= (gross - G * eq) * FEE; gross = G * eq
        for sym in ent.get(t, []):
            j = col[sym]; px = Ca[t, j]
            if np.isnan(px): continue
            n = s * eq
            if gross + n > G * eq + 1e-12: continue
            if s * CAP0 > 0.01 * Va[t, j] or Va[t, j] < vmin: continue   # fixed 100k$ book (protocol)
            posl.append([j, n / px, px, t + Hd]); gross += n; eq -= n * FEE
        if hedge:
            tgt = gross; eq -= abs(tgt - hedge_n * (1 + rb)) * 0.001; hedge_n = tgt
        out[t] = eq / eq_prev - 1
    return pd.Series(out, IDX)
