"""(a) Pairs trading on SSF.  Formation F days -> select N pairs (distance SSD or Engle-Granger ADF t-stat) from
candidate set (within GROUPS, or all pairs); trade for Tt days, then re-form (pairs not re-selected are closed).
Spread s = LPa - beta*LPb (dist: beta=1 on normalised log prices). z modes: 'form' (formation mean/sd),
'roll60' (rolling 60d mean/sd), 'kal' (Kalman dynamic alpha/beta, z = innovation / sqrt(innov. variance)).
Rules on z_t (settles to t): enter |z|>ze (short spread if z>0), exit when z back within zx of 0 (crossing),
stop when |z|>zs adverse, time stop after ts days; after stop/time stop no re-entry until |z|<ze.
Trades executed at settle t+1.  Pair gross = gross/N split 1:beta between legs."""
import numpy as np, pandas as pd, itertools
import sa

FORM_CACHE = {}


def adf_t(e):
    de = np.diff(e); el = e[:-1]
    y = de[1:]; X = np.column_stack([el[1:], de[:-1], np.ones(len(y))])
    b, *_ = np.linalg.lstsq(X, y, rcond=None)
    res = y - X @ b; s2 = res @ res / (len(y) - 3)
    cov = s2 * np.linalg.inv(X.T @ X)
    return b[0] / np.sqrt(cov[0, 0]), b[0]


def candidates(D, cand, names):
    s = set(names)
    if cand == "all":
        return list(itertools.combinations(sorted(s), 2))
    out = set()
    for g in sa.GROUPS.values():
        for a, b in itertools.combinations(g, 2):
            if a in s and b in s:
                out.add(tuple(sorted((a, b))))
    return sorted(out)


def form(D, tf, F, method, cand, N, gross, maxper=2):
    key = (tf, F, method, cand, N, gross)
    if key in FORM_CACHE:
        return FORM_CACHE[key]
    LP = D["LP"]; unds = D["unds"]
    win = LP.iloc[tf - F + 1: tf + 1]
    ok = win.notna().mean() >= 0.95
    leg = sa.LIQ_X * D["capser"].iloc[tf] * gross / N
    ok &= D["medval"].iloc[tf].fillna(0) >= leg
    ok &= pd.Series(D["has"][tf], index=unds)
    names = [u for u in unds if ok[u]]
    W = win[names].ffill().bfill()
    res = []
    for a, b in candidates(D, cand, names):
        x = W[a].values; y = W[b].values
        if method == "dist":
            sp = (x - x[0]) - (y - y[0])
            res.append((np.sum(sp ** 2), a, b, 1.0, (x[0] - y[0])))
        else:
            X = np.column_stack([y, np.ones(len(y))])
            (beta, al), *_ = np.linalg.lstsq(X, x, rcond=None)
            if not (0.3 <= beta <= 3):
                continue
            e = x - beta * y - al
            t, g = adf_t(e)
            if t > -3.04 or g >= 0:
                continue
            hl = -np.log(2) / np.log(1 + g)
            if not (2 <= hl <= 60):
                continue
            res.append((t, a, b, beta, al))
    res.sort(key=lambda r: r[0])
    sel = []; cnt = {}
    for r in res:
        if cnt.get(r[1], 0) >= maxper or cnt.get(r[2], 0) >= maxper:
            continue
        sel.append(r); cnt[r[1]] = cnt.get(r[1], 0) + 1; cnt[r[2]] = cnt.get(r[2], 0) + 1
        if len(sel) >= N:
            break
    FORM_CACHE[key] = sel
    return sel


def kalman_z(x, y, delta=1e-4, ve=1e-3):
    n = len(x); th = np.zeros(2); P = np.eye(2); Vw = delta / (1 - delta) * np.eye(2)
    z = np.full(n, np.nan); bet = np.full(n, np.nan)
    for i in range(n):
        if np.isnan(x[i]) or np.isnan(y[i]):
            continue
        R = P + Vw; h = np.array([y[i], 1.0])
        yhat = h @ th; Q = h @ R @ h + ve; e = x[i] - yhat
        z[i] = e / np.sqrt(Q)
        K = R @ h / Q; th = th + K * e; P = R - np.outer(K, h) @ R
        bet[i] = th[0]
    return z, bet


def run(D, method="coint", cand="grp", F=252, Tt=21, N=5, ze=2.0, zx=0.0, zs=4.0, ts=40, zmode="form",
        gross=2.0, coll="dep", details=False, slip_mult=1.0, start_trade="2017-09-01", comm=sa.COMM):
    sa.prep(D)
    days = D["days"]; T = len(days); n = len(D["unds"]); col = {u: j for j, u in enumerate(D["unds"])}
    LP = D["LP"].ffill().values
    tgt = np.zeros((T, n)); act = np.zeros((T, n), bool)
    t_first = max(F, days.searchsorted(pd.Timestamp(start_trade)) - 1)
    gp = gross / N
    pos = {}       # (a,b) -> dict(d, entry, beta, cool)
    ntr = 0; held_days = []; legs_val = []
    cur = np.zeros(n)
    for tf in range(t_first, T - 1, Tt):
        sel = form(D, tf, F, method, cand, N, gross)
        newset = {(r[1], r[2]): r for r in sel}
        changed = set()
        for k in list(pos):
            if k not in newset:
                if pos[k]["d"] != 0:
                    changed |= {k[0], k[1]}; held_days.append(tf - pos[k]["entry"])
                del pos[k]
        # z series over [tf-F+1, tf+Tt]
        hi = min(T, tf + Tt + 1); lo = tf - F + 1
        zser = {}
        for k, r in newset.items():
            a, b = col[k[0]], col[k[1]]
            x = LP[lo:hi, a]; y = LP[lo:hi, b]
            if zmode == "kal":
                z, bet = kalman_z(x, y)
            else:
                beta = r[3]
                sp = x - beta * y if method != "dist" else x - y
                if zmode == "form":
                    m = np.nanmean(sp[:F]); s = np.nanstd(sp[:F])
                    z = (sp - m) / s
                else:
                    sps = pd.Series(sp); W = int(zmode[4:])
                    z = ((sps - sps.rolling(W, min_periods=W // 2).mean()) / sps.rolling(W, min_periods=W // 2).std()).values
                bet = np.full(len(z), beta)
            zser[k] = (z, bet)
            if k not in pos:
                pos[k] = dict(d=0, entry=0, beta=1.0, cool=False)
        if changed:
            pass
        # trading days: decisions at t in [tf, hi-2], executed at t+1
        for t in range(tf, hi - 1):
            ch = set(changed) if t == tf else set()
            for k, st in pos.items():
                z, bet = zser[k]; zt = z[t - lo]
                if np.isnan(zt):
                    continue
                if st["d"] == 0:
                    if st["cool"]:
                        if abs(zt) < ze:
                            st["cool"] = False
                        continue
                    if ze < abs(zt) < zs:
                        b_ = bet[t - lo] if method != "dist" else 1.0
                        if zmode == "kal" and not (0.3 <= b_ <= 3):
                            continue
                        st.update(d=-np.sign(zt), entry=t, beta=b_); ch |= {k[0], k[1]}; ntr += 1
                else:
                    d = st["d"]
                    ex = d * zt >= -zx
                    stop = d * zt <= -zs
                    tstop = t - st["entry"] >= ts
                    if ex or stop or tstop:
                        held_days.append(t - st["entry"])
                        st["d"] = 0; ch |= {k[0], k[1]}
                        if stop or tstop:
                            st["cool"] = True
            if ch:
                new = np.zeros(n)
                for k, st in pos.items():
                    if st["d"] != 0:
                        b_ = st["beta"]
                        new[col[k[0]]] += st["d"] * gp / (1 + b_)
                        new[col[k[1]]] -= st["d"] * gp * b_ / (1 + b_)
                idx = [col[u] for u in ch]
                tgt[t + 1, idx] = new[idx]; act[t + 1, idx] = True
    r = sa.simulate(D, tgt, act, coll=coll, slip_mult=slip_mult, details=details, comm=comm)
    info = dict(ntr=ntr, hold=float(np.mean(held_days)) if held_days else np.nan)
    if details:
        r, det = r
        info.update(det)
        info["tgt"] = tgt; info["act"] = act
    return r, info
