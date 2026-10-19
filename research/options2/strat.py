"""Strategy builders + filters for eng.Sim."""
import numpy as np, pandas as pd
import eng
from eng import data, price_leg, dvol_feat

# ---------- filters (all use data up to day-1 or the morning chain of `day`, decided before 09:00 entry) ----------
FEAT = None
def feats():
    global FEAT
    if FEAT is None:
        FEAT = pd.read_pickle(eng.D / "raw" / "feats.pkl")
    return FEAT

def f_dvol(look=365, q=0.5):
    def f(cur, day):
        dv = data()["dv"][cur]; d = pd.Timestamp(day) - pd.Timedelta(days=1); x = dv.loc[:d]
        return float(x.iloc[-1]) > float(x.iloc[-look:].quantile(q))
    return f

def f_none(cur, day): return True

def f_feat(col, op=">", ref="med365", thr=0.0, base=None):
    """col compared to its own trailing 365d median (ref='med365') or to constant thr (ref='const').
    base: optional other filter ANDed."""
    def f(cur, day):
        if base is not None and not base(cur, day): return False
        F = feats()
        try: row = F.loc[(cur, day)]
        except KeyError: return False
        x = row[col]; r = row[col + "_med365"] if ref == "med365" else thr
        if not (np.isfinite(x) and np.isfinite(r)): return False
        return x > r if op == ">" else x < r
    return f

# ---------- builders ----------
def find_exp(cur, day, days, tol=0):
    ex = data()["EXP"].get((cur, day), [])
    tgt = pd.Timestamp(day) + pd.Timedelta(days=days, hours=8)
    for e in ex:
        if abs((e - tgt).total_seconds()) <= tol * 86400: return e
    return None

def strangle(filt, d=0.30, tenor=7, wing=None, wing_ratio=1.0, wing_side="both", put_only=False,
             mhedge=None, mhedge_ratio=1.0, mhedge_side="P"):
    """short d-delta strangle expiring day+tenor; optional same-expiry long wings at delta `wing`;
    optional longer-dated (monthly ~28-42d) long hedge bought when no hedge is alive (mhedge = delta)."""
    alive = {}
    def b(cur, day, t0, S0):
        if not filt(cur, day): return []
        ex = find_exp(cur, day, tenor)
        if ex is None: return []
        out = []
        sides = [(False, -d)] if put_only else [(False, -d), (True, d)]
        for isc, dl in sides:
            lg = price_leg(cur, day, ex, dl, isc, t0, S0)
            if lg is None: return []
            out.append((-1, 1.0, lg))
        if wing:
            ws = {"both": [False, True], "put": [False], "call": [True]}[wing_side]
            for isc in ws:
                if put_only and isc: continue
                lg = price_leg(cur, day, ex, wing if isc else -wing, isc, t0, S0)
                if lg is None: return []
                # never buy a wing inside the short strike
                ks = [o[2]["K"] for o in out if o[2]["isc"] == isc][0]
                if (isc and lg["K"] <= ks) or ((not isc) and lg["K"] >= ks): continue
                out.append((+1, wing_ratio, lg))
        if mhedge and alive.get(cur, pd.Timestamp(0)) <= t0:
            exs = [e for e in data()["EXP"].get((cur, day), []) if 25 <= (e - t0).days <= 45]
            if exs:
                e2 = exs[-1] if len(exs) == 1 else min(exs, key=lambda e: abs((e - t0).days - 30))
                for isc in ([False] if mhedge_side == "P" else [True] if mhedge_side == "C" else [False, True]):
                    lg = price_leg(cur, day, e2, mhedge if isc else -mhedge, isc, t0, S0)
                    if lg is not None: out.append((+1, mhedge_ratio, lg))
                alive[cur] = e2
        return out
    return b
