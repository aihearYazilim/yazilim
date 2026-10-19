"""(c) Residual short-term mean reversion on the SSF universe.
Residual returns (daily futures returns, information to t only):
  'mkt'   : r - cross-sectional mean of eligible names
  'sector': r - sector mean (sector of research/bist_all universe; sectors with <3 eligible names -> market mean)
  'pcaK'  : r minus its cross-sectional projection on the top-K PCA loadings of the past 252d correlation matrix
            (re-estimated every 21 days on eligible names)
Signal: S = sum of residuals over last L days ('ou': Avellaneda-Lee s-score of 60d cumulative residual, AR(1)).
Weights: linear  w = -zscore(S) scaled to gross (dollar-neutral), or 'rank' long bottom K / short top K.
Rebalance every h days at settle t+1 (all eligible names); optional 'band': only names whose |w_tgt - w| > band*gross/n.
"""
import numpy as np, pandas as pd
import sa

_RES = {}


def residuals(D, kind, minhist=126, gross=2.0, n_ref=20):
    key = kind
    if key in _RES:
        return _RES[key]
    sa.prep(D)
    days = D["days"]; T = len(days); unds = D["unds"]; n = len(unds)
    R = D["fret"].values
    hist = pd.DataFrame(np.isfinite(R)).rolling(252, min_periods=1).sum().values
    E = np.full((T, n), np.nan)
    if kind == "mkt":
        ok = np.isfinite(R) & (hist >= minhist)
        Rm = np.where(ok, R, np.nan)
        E = Rm - np.nanmean(Rm, axis=1, keepdims=True)
    elif kind == "sector":
        sec = pd.read_csv(sa.ROOT / "data/bist_all/_universe.csv").set_index("ticker")["sector"].reindex(unds).fillna("x")
        sec = sec.replace({"Elektrik Enerji Ürt.Teçh/Tesis Kurulum": "Elektrik Üretim", "Elektrik - Doğalgaz Dağıtım": "Elektrik Üretim",
                           "Madencilik": "Demir-Çelik Temel", "Petrol": "Kimyasal Ürün", "Endüstriyel Tekstil": "Kimyasal Ürün"}).values
        ok = np.isfinite(R) & (hist >= minhist)
        Rm = np.where(ok, R, np.nan)
        mk = np.nanmean(Rm, axis=1, keepdims=True)
        E = Rm - mk
        for s in set(sec):
            m = sec == s
            if m.sum() < 3:
                continue
            sub = Rm[:, m]; cnt = np.isfinite(sub).sum(1, keepdims=True)
            with np.errstate(all='ignore'):
                sm = np.where(cnt >= 3, np.nanmean(sub, axis=1, keepdims=True), mk)
            E[:, m] = sub - sm
    else:
        K = int(kind[3:])
        # second pass (clean): projection fixed for days (te, te+21]
        E = np.full((T, n), np.nan)
        for te in range(252, T, 21):
            win = R[te - 251:te + 1]
            good = np.isfinite(win).mean(0) >= 0.9
            names = np.where(good)[0]
            X = np.nan_to_num(win[:, names]); sd = X.std(0) + 1e-12
            Xs = (X - X.mean(0)) / sd
            ev, V = np.linalg.eigh(Xs.T @ Xs / len(Xs))
            L = V[:, -K:] * sd[:, None]           # loadings in return units
            Pj = np.eye(len(names)) - L @ np.linalg.pinv(L.T @ L) @ L.T
            for t in range(te + 1, min(T, te + 22)):
                r = R[t, names]; m = np.isfinite(r)
                if m.sum() < K + 5:
                    continue
                if m.all():
                    E[t, names] = Pj @ r
                else:
                    Lm = L[m]; rm = r[m]
                    E[t, names[m]] = rm - Lm @ np.linalg.lstsq(Lm, rm, rcond=None)[0]
    _RES[key] = E
    return E


def run(D, kind="pca3", L=5, h=5, wmode="lin", K=8, gross=2.0, band=0.0, coll="dep", start_trade="2018-01-01",
        slip_mult=1.0, details=False, ou=False, comm=sa.COMM, sign=1, lag0=False):
    sa.prep(D)
    days = D["days"]; T = len(days); n = len(D["unds"])
    E = residuals(D, kind)
    Ez = np.nan_to_num(E)
    if ou:
        cs = pd.DataFrame(Ez).rolling(60, min_periods=40)
        # OU s-score: X = cum residual over 60d; AR(1) fit X_{k+1}=a+bX_k; s=(X_t - m)/sigma_eq ; approx with
        # rolling mean/std of the 60d cumulative residual path
        X = pd.DataFrame(Ez).cumsum()
        S = ((X - X.rolling(60, min_periods=40).mean()) / X.rolling(60, min_periods=40).std()).values
    else:
        S = pd.DataFrame(Ez).rolling(L, min_periods=L).sum().values
    S = sign * np.where(np.isfinite(E), S, np.nan)
    per = D["capser"].values * gross / (2 * K if wmode == "rank" else 20)
    elig = D["has"] & (np.nan_to_num(D["medval"].values) >= sa.LIQ_X * per[:, None]) & np.isfinite(S)
    tgt = np.zeros((T, n)); act = np.zeros((T, n), bool)
    t0 = days.searchsorted(pd.Timestamp(start_trade))
    ntr = 0
    for t in range(t0 - 1, T - 1):
        if (t - t0 + 1) % h:
            continue
        m = elig[t]
        if m.sum() < 10:
            w = np.zeros(n)
        else:
            s = S[t, m]
            w = np.zeros(n)
            if wmode == "lin":
                z = (s - s.mean()) / (s.std() + 1e-12); z = np.clip(z, -3, 3); z -= z.mean()
                w[m] = -z / max(np.abs(z).sum(), 1e-9) * gross
            else:
                idx = np.where(m)[0]; o = idx[np.argsort(s)]
                k = min(K, len(o) // 2)
                w[o[:k]] = gross / 2 / k; w[o[-k:]] = -gross / 2 / k
        e = t if lag0 else t + 1
        tgt[e] = w; act[e] = True
        ntr += 1
    if band > 0:
        pass
    r = sa.simulate(D, tgt, act, coll=coll, slip_mult=slip_mult, details=details, comm=comm)
    info = dict(ntr=ntr)
    if details:
        r, det = r; info.update(det)
    return r, info
