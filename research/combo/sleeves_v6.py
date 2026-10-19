"""v6 sleeve inputs (all parameters fixed before 2025-10-17 by the source studies; nothing is fitted here).
OPT : options2 final_series (real Deribit chains, hourly MTM): BTC+ETH weekly strangle + monthly 10-delta protective put,
      standard margin.  Primary 'C mh10P 40d 2x STD'; neighbours "A' mh10P 30d 2x STD", "B' mh10P 35d 3x STD".
      Weekly rows: entry Friday, expiry Friday, r = Enext/E0-1 (USD, pre-tax), trough = minE/E0-1 (intraweek MTM).
XU  : viop_options sim.run XU030 20d/5d put spread, 5x, IV > 252d median, hold to expiry, entry day 0..9 of the month,
      nema 1 (VİOP cash earns ON deposit) and nema 0.  Daily settlement equity incl. 10% quarterly stopaj.
      Also a per-day gap-loss table: instantaneous XU030 futures gap g (-10%, -15%) re-priced with Black-76 at IV x1.5 on the
      position held that day, as fraction of sleeve equity (for stress tests).
EVT : crypto_events_audit scenario B (unlock + CMS book, 1m stops, entry slip 0.5%, stop slip 1%), 2x gross, BTC hedge;
      s=0.10 primary, neighbours s=0.05 and C (entry +15 min) s=0.10. IS window (2022-01-01..2025-10-16) and OOS window run
      separately (fresh start each, as in the audit), concatenated. Daily USD returns (calendar days), pre-tax, idle USD 0%.
Output: results/sleeves_v6.pkl"""
import sys, pathlib
import numpy as np, pandas as pd
H = pathlib.Path(__file__).resolve().parent; R = H.parent
sys.dont_write_bytecode = True
OUT = H / "results"
IS1 = pd.Timestamp("2025-10-16"); OOS0 = pd.Timestamp("2025-10-17")


def opt_tables():
    fs = pd.read_pickle(R / "options2/raw/final_series.pkl"); out = {}
    for k in ["C mh10P 40d 2x STD", "A' mh10P 30d 2x STD", "B' mh10P 35d 3x STD"]:
        r = fs[k]
        df = pd.DataFrame({"expiry": pd.to_datetime(r.end).dt.normalize().values,
                           "r": np.where(r.E0 > 0, r.Enext / r.E0 - 1, -1.0),
                           "trough": np.where(r.E0 > 0, np.minimum(r.minE / r.E0 - 1, 0), -1.0)},
                          index=pd.to_datetime(r.index).normalize())
        out[k] = df
    return out


def xu_tables():
    sys.path.insert(0, str(R / "viop_options")); import sim, lib
    D = sim.Data("XU030")
    P = dict(struct="PS", delta=0.20, wing=0.05, L=5, filt="ivhi", mode="hold")
    eqs = {}; gaps = {}
    for nema in (1.0, 0.0):
        for ed in range(10):
            eq, tr, mg, lev = sim.run(D, entry_day=ed, nema=nema, ret_trades=True, **P)
            eqs[(ed, nema)] = eq
            if ed in (0,) or nema == 1.0:
                gaps[(ed, nema)] = gap_table(D, eq, tr, lib)
    return eqs, gaps


def gap_table(D, eq, trades, lib, gs=(-0.10, -0.15)):
    """loss (fraction of sleeve equity) of an instantaneous XU030 gap g on each day's open position, IV x1.5."""
    dates = D.dates; out = pd.DataFrame(0.0, index=dates, columns=list(gs))
    ev = [(t[0], t[1], t[2]) for t in trades]
    for k, (d0, kind, info) in enumerate(ev):
        if kind != "open": continue
        d1 = next((e[0] for e in ev[k + 1:] if e[1] == "close"), dates[-1])
        g0 = D.byday[d0]
        legs = []
        for (cp, K, q, px, dl, qty, oi, F) in info:
            row = g0[(g0.cp == cp) & (g0.K == K) & (g0.px == px)]
            if row.empty: row = g0[(g0.cp == cp) & (g0.K == K)]
            legs.append((cp, K, q, row.exp.iloc[0], row.iv.iloc[0]))
        exp = legs[0][3]; e0 = eq[d0]
        for t in dates[(dates >= d0) & (dates < d1)]:
            F = D.F.get((t, exp));
            if F is None or not np.isfinite(F): continue
            T = max((exp - t).days, 1) / 365; et = eq[t]
            if et <= 0: continue
            for g in gs:
                loss = 0.0
                for cp, K, q, ex, iv in legs:
                    base = D.px.get((t, ex, cp, K))
                    if base is None or not np.isfinite(base):
                        base = float(lib.b76(np.array([F]), np.array([K]), np.array([T]), np.array([iv]), np.array([cp]))[0])
                    new = float(lib.b76(np.array([F * (1 + g)]), np.array([K]), np.array([T]), np.array([iv * 1.5]), np.array([cp]))[0])
                    loss += q * (new - base)
                out.loc[t, g] = max(loss * e0 / et, -1.0)        # q is per unit of entry equity
    return out


def evt_series():
    sys.path.insert(0, str(R / "crypto_events_audit")); sys.path.insert(0, str(R / "crypto_events"))
    import port_fix as PF, exec1m as X, trades as T
    unl = T.unlock_trades(0.10, 10, 3, 1.0)
    books = {"B": unl + X.cms_book(None, 0.005, 0.01), "C15": unl + X.cms_book(15, 0.005, 0.01)}
    out = {}
    for nm, s in [("B", 0.10), ("B", 0.05), ("C15", 0.10)]:
        d = PF.both(books[nm], s, 2.0, 1)
        r = pd.concat([d["_IS_r"].loc[:IS1], d["_OOS_r"].loc[OOS0:]])
        r.index = pd.DatetimeIndex(r.index).as_unit("ns")
        out[f"{nm}_s{s}"] = r
        print(nm, s, {k: v for k, v in d.items() if not k.startswith("_")})
    return out


if __name__ == "__main__":
    o = opt_tables()
    for k, v in o.items():
        for a, b in [("2022-01-01", IS1), (OOS0, "2026-10-16")]:
            x = v.loc[a:b]; print(k, a, "weekly geo->monthly %.4f" % ((1 + x.r).prod() ** (52 / 12 / len(x)) - 1), "min trough %.3f" % x.trough.min())
    ev = evt_series()
    xe, xg = xu_tables()
    pd.to_pickle(dict(opt=o, xu=xe, xugap=xg, evt=ev), OUT / "sleeves_v6.pkl")
    print("saved")
