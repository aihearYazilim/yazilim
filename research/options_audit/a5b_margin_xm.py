"""Cross-margined single USDC account (both sleeves share collateral) + PARTIAL liquidation
(Deribit reduces the position just enough to restore equity >= MM). Hourly high/low/close checks.
Same pricing/vol-shock model as a5_margin.py."""
from common import R, ORIG
import numpy as np, pandas as pd
from bs import bs_price
from variants import cost_leg, stats, TICK, FEE
from a5_margin import H, SHOCK

def legs_of(e, size, wsleeve, h=0.05, d=.3):
    S0, F, T = e["S0"], e["F"], e["T"]; legs = []; prem = 0
    for isc, dl in ((False, -d), (True, d)):
        K = e["sm"].strike(dl, isc); v = float(e["sm"].iv(K))
        m = float(bs_price(F, K, T, v, isc)) * S0 / F
        prem += m - max(h*m, TICK*S0) - min(FEE*S0, .125*m); legs.append((K, v, isc, m))
    return dict(e=e, legs=legs, N=size*wsleeve/S0, prem=prem)

def liab(p, Sx, tau, k, extra=1.0):
    S0 = p["e"]["S0"]; t = 0
    for K, v, isc, m in p["legs"]:
        t += float(bs_price(Sx, K, max(tau, 1e-6), v*(1+k*abs(np.log(Sx/S0)))*extra, isc))
    return p["N"] * t

def mm_of(p, Sx, tau, k, L, model):
    if model == "STD": return p["N"]*0.075*Sx*2 + L
    sh = SHOCK[p["e"]["cur"]]
    return max(liab(p, Sx*(1+s), tau, k, 1.3) for s in (-sh, -sh/2, 0, sh/2, sh)) - L

def week(entries, size, k, model):
    """entries: active (filter-on) entries this Friday. Equity 1.0, each sleeve weight 0.5. Returns portfolio return."""
    if not entries: return 0.0, 0
    P = [legs_of(e, size, 0.5) for e in entries]
    cash = 1.0 + sum(p["N"]*p["prem"] for p in P)
    exp = pd.Timestamp(entries[0]["expiry"]) + pd.Timedelta(hours=8)
    t0 = pd.Timestamp(entries[0]["day"]) + pd.Timedelta(hours=9); t1 = exp - pd.Timedelta(hours=1)
    paths = [H[p["e"]["cur"]].loc[t0:t1] for p in P]
    idx = paths[0].index
    for x in paths[1:]: idx = idx.intersection(x.index)
    nliq = 0
    for ts in idx:
        tau = (exp - (ts + pd.Timedelta(hours=1))).total_seconds()/(365*86400)
        # worst-case corner: evaluate each sleeve at its low and high, take combination with lowest equity-MM
        cands = []
        for corner in ("low", "high", "close"):
            Ls, MMs, Sxs = [], [], []
            for p, path in zip(P, paths):
                Sx = path.loc[ts, corner]; L = liab(p, Sx, tau, k)
                Ls.append(L); MMs.append(mm_of(p, Sx, tau, k, L, model) if p["N"] > 0 else 0); Sxs.append(Sx)
            cands.append((cash - sum(Ls) - sum(MMs), Ls, MMs, Sxs))
        slack, Ls, MMs, Sxs = min(cands, key=lambda c: c[0])
        if slack < 0:
            nliq += 1
            eq = cash - sum(Ls); MM = sum(MMs)
            c = sum(0.10*L + 0.0019*p["N"]*Sx*2 for L, p, Sx in zip(Ls, P, Sxs))   # cost of closing 100%
            q = max(0.0, (eq - c) / (MM - c)) if MM > c else 0.0
            q = min(q, 1.0) * 0.95                                            # small overshoot like Deribit's buffer
            # close (1-q) of every leg at stressed value +10% and fee
            for p, L, Sx in zip(P, Ls, Sxs):
                cash -= (1-q) * (1.10*L + 0.0019*p["N"]*Sx*2); p["N"] *= q
            if all(p["N"] == 0 for p in P) or q == 0: return cash - 1.0, nliq
    # settle remaining at Deribit delivery price
    for p in P:
        e = p["e"]; S = e["S"]
        for K, v, isc, m in p["legs"]:
            intr = max(S-K, 0) if isc else max(K-S, 0)
            cash -= p["N"] * (intr + (min(0.00015*S, .125*intr) if intr > 0 else 0))
    return cash - 1.0, nliq

def run(size, k, model):
    by = {}
    for e in R.ENT["W"]:
        if not np.isfinite(e["S"]): continue
        by.setdefault(e["day"], []).append(e)
    rows = []
    for day, es in sorted(by.items()):
        act = [e for e in es if R.FEAT[(e["cur"], e["day"])]["dvol"] > R.FEAT[(e["cur"], e["day"])]["dvmed"]]
        r, n = week(act, size, k, model) 
        rows.append(dict(day=day, expiry=es[0]["expiry"], r=max(r, -1), nliq=n))
    return pd.DataFrame(rows).set_index("day")

if __name__ == "__main__":
    import a5_margin
    OOS0 = "2025-10-17"; out = []
    for size in (2, 3):
        for k in (2.0, 4.0):
            for model in ("STD", "PM"):
                s = run(size, k, model)
                a = stats(s[s.index < OOS0]); b = stats(s[s.index >= OOS0])
                out.append(dict(size=size, k=k, model=model, liq_weeks_IS=int(((s.nliq > 0) & (s.index < OOS0)).sum()),
                                liq_weeks_OOS=int(((s.nliq > 0) & (s.index >= OOS0)).sum()),
                                IS_geo=a["geo"], IS_dd=a["dd"], OOS_geo=b["geo"], OOS_dd=b["dd"], OOS_worst_wk=b["worst_wk"]))
                s.to_csv(f"xm_s{size}_k{k}_{model}.csv")
                print(out[-1], flush=True)
    pd.set_option("display.width", 220); print(pd.DataFrame(out).round(4).to_string())
