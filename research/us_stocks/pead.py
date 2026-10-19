"""Post-earnings-announcement drift. Events from Nasdaq earnings calendar (date, EPS surprise %).
Reaction = adj[d+1]/adj[d-1]-1 minus SPY same window (covers BMO and AMC since timing unknown).
Signal known at close d+1; ENTRY at close d+1+delay (delay=1 default, conservative). Hold H trading days.
Slots: each position 1/K of equity (x lev); first-come; regime filter optional (no new entries when SPY<SMA200)."""
import json, itertools, numpy as np, pandas as pd, lib, signals as sg
def load_events(cols):
    f = lib.R / "events.pkl"
    if f.exists(): return pd.read_pickle(f)
    rows = []
    for p in sorted((lib.R / "earn").glob("*.json")):
        for r in json.load(open(p)):
            sym = r.get("symbol", "").replace("/", ".").replace("-", ".")
            if sym not in cols: continue
            try: su = float(r.get("surprise"))
            except Exception: su = np.nan
            rows.append((pd.Timestamp(p.stem), sym, su))
    ev = pd.DataFrame(rows, columns=["date", "sym", "surprise"]).drop_duplicates(["date", "sym"])
    ev.to_pickle(f); return ev

def build(D, S, ev, thr, need_pos, H, K, filt, delay=1):
    adj = S["adj"]; dates = adj.index; di = {d: i for i, d in enumerate(dates)}
    n = len(dates); cols = list(adj.columns); ci = {c: j for j, c in enumerate(cols)}
    A = adj.values; spy = adj["SPY"].values; el = S["elig"].values; reg = S["regime"].values
    starts = []
    for d, s, su in ev.itertuples(index=False):
        i = dates.searchsorted(d)
        if i < 1 or i + 1 + delay >= n: continue
        j = ci[s]
        if not el[i - 1, j]: continue
        r = A[i + 1, j] / A[i - 1, j] - 1 - (spy[i + 1] / spy[i - 1] - 1)
        if not np.isfinite(r) or r < thr: continue
        if need_pos and not (su > 0): continue
        e = i + 1 + delay
        if filt and not reg[e]: continue
        starts.append((e, j, r))
    starts.sort()
    W = np.zeros((n, len(cols))); active = []  # (exit_idx, j)
    by = {}
    for e, j, r in starts: by.setdefault(e, []).append((r, j))
    for i in range(n):
        active = [(x, j) for x, j in active if x > i]
        if i in by:
            held = {j for _, j in active}
            for r, j in sorted(by[i], reverse=True):
                if len(active) >= K: break
                if j in held: continue
                active.append((i + H, j)); held.add(j)
        for _, j in active: W[i, j] = 1.0 / K
    W = pd.DataFrame(W, index=dates, columns=cols)
    ch = (W.diff().abs().sum(1) > 0)
    return W, list(dates[ch.values])

if __name__ == "__main__":
    D = lib.build_panel(); S = sg.prep(D); P = D["P"]
    ev = load_events(set(S["adj"].columns)); print(len(ev), ev.date.min(), ev.date.max())
    ev = ev[(ev.date >= "2005-01-01") & (ev.date <= lib.OOS_END)]
    rows = []; eqs = {}
    for thr, pos, H, K, filt in itertools.product((-1.0, 0.02, 0.04, 0.06), (0, 1), (20, 40, 60), (10, 20, 30), (0, 1)):
        W, rd = build(D, S, ev, thr, pos, H, K, filt)
        for lev in (1.0, 1.5, 2.0):
            eq, tr = lib.simulate(W, rd, P, D["irx"], lev=lev, band=0.02)
            key = f"pead|thr{thr}|pos{pos}|H{H}|K{K}|f{filt}|L{lev}"; eqs[key] = eq
            row = dict(key=key, thr=thr, pos=pos, H=H, K=K, filt=filt, lev=lev)
            for tag, a, b in (("IS05", "2005-01-01", lib.IS_END), ("IS10", lib.IS_START, lib.IS_END), ("OOS", lib.OOS_START, lib.OOS_END)):
                for k, v in lib.stats_m(eq, a, b).items(): row[f"{tag}_{k}"] = v
            for tag, a, b in (("IS17TRY", "2016-10-17", lib.IS_END), ("OOSTRY", lib.OOS_START, lib.OOS_END)):
                for k, v in lib.stats_m(lib.try_eq(eq, D["usdtry"], a, b), a, b).items(): row[f"{tag}_{k}"] = v
            row["turn_yr"] = tr.loc[lib.IS_START:lib.IS_END].sum() / 15.8
            row["expo"] = W.sum(1).loc[lib.IS_START:lib.IS_END].mean()
            rows.append(row)
        print(key, round(row["IS10_geo"]*100, 2), round(row["OOS_geo"]*100, 2), round(row["expo"], 2), flush=True)
    pd.DataFrame(rows).to_csv(lib.R / "pead_grid.csv", index=False); pd.to_pickle(eqs, lib.R / "pead_eqs.pkl")
