"""Sinyal/ağırlık üreticileri. Hepsi t günü kapanışına kadarki veriyle (look-ahead yok)."""
import numpy as np, pandas as pd

UNIV = {
    "ALL":   ["XU030", "USDTRY", "GC_F", "SI_F", "CL_F", "HG_F", "SPY", "QQQ", "TLT", "IEF", "EEM", "BTC", "ETH"],
    "NOCRY": ["XU030", "USDTRY", "GC_F", "SI_F", "CL_F", "HG_F", "SPY", "QQQ", "TLT", "IEF", "EEM"],
    "VIOP":  ["XU030", "USDTRY", "GC_F", "SI_F"],   # VİOP'ta işlem gören karşılıkları (endeks, dolar, altın, gümüş)
    "AGGR":  ["XU030", "USDTRY", "GC_F", "SI_F", "TQQQ", "BTC", "ETH"],
}


class Pre:
    """Ön-hesaplar: EWMA kovaryans (yarı ömür 40 gün), oynaklık, momentum."""
    def __init__(self, U, hl=40, floor=0.0):
        X = U["X"]; self.X = X; self.P = U["P"]; self.idx = X.index
        a = 1 - 0.5 ** (1 / hl)
        Xv = X.values; n, m = Xv.shape
        C = np.zeros((n, m, m)); c = np.zeros((m, m)); cnt = np.zeros((m, m))
        for t in range(n):
            x = Xv[t]
            ok = ~np.isnan(x)
            xx = np.where(ok, x, 0.0)
            o = np.outer(xx, xx); okk = np.outer(ok, ok)
            c = np.where(okk, (1 - a) * c + a * o, c)
            cnt += okk
            C[t] = np.where(cnt >= 120, c, np.nan)     # en az 120 gözlem
        if floor > 0:   # varlık oynaklık tabanı: kovaryansı korelasyonu koruyarak ölçekle
            sd = np.sqrt(np.einsum("tii->ti", C) * 260)
            f = np.where(sd < floor, floor / np.where(sd > 0, sd, np.nan), 1.0)
            C = C * f[:, :, None] * f[:, None, :]
        self.C = C
        self.vol = pd.DataFrame(np.sqrt(np.einsum("tii->ti", C) * 260), index=self.idx, columns=X.columns)
        self.cols = list(X.columns)
        lp = np.log(self.P)
        self.mom = {L: (lp - lp.shift(L)) for L in (21, 63, 126, 252)}
        self.sma200 = self.P.rolling(200).mean()

    def scale_to_vol(self, raw, target, lmax, every=5):
        """raw: ham ağırlıklar; ex-ante portföy oynaklığı = target olacak şekilde ölçekle, brüt kaldıraç<=lmax."""
        cols = list(raw.columns); ix = [self.cols.index(c) for c in cols]
        R = raw.fillna(0).values; out = np.full_like(R, np.nan)
        for t in range(0, len(R), every):
            w = R[t]
            if not np.any(w):
                out[t] = 0; continue
            C = self.C[t][np.ix_(ix, ix)]
            C = np.nan_to_num(C)
            v = np.sqrt(max(w @ C @ w * 260, 1e-12))
            k = target / v
            g = np.abs(w).sum() * k
            if g > lmax:
                k *= lmax / g
            out[t] = w * k
        return pd.DataFrame(out, index=raw.index, columns=cols).ffill().fillna(0)


def valid(pre, cols):
    """varlık için en az 252 gün geçmiş + oynaklık tahmini var mı"""
    v = pre.vol[cols].notna() & pre.mom[252][cols].notna()
    return v


def tsmom(pre, cols, L, long_only):
    if L == "ens":
        s = sum(np.sign(pre.mom[l][cols]) for l in (21, 63, 126, 252)) / 4
    else:
        s = np.sign(pre.mom[L][cols])
    if long_only:
        s = s.clip(lower=0)
    raw = s / pre.vol[cols]
    return raw.where(valid(pre, cols), 0)


def riskparity(pre, cols, regime):
    s = pd.DataFrame(1.0, index=pre.idx, columns=cols)
    if regime == "sma200":
        s = (pre.P[cols] > pre.sma200[cols]).astype(float)
    raw = s / pre.vol[cols]
    return raw.where(valid(pre, cols), 0)


def dualmom(pre, cols, L, k):
    m = pre.mom[L][cols].where(valid(pre, cols))
    radj = m / pre.vol[cols]
    rank = radj.rank(axis=1, ascending=False)
    s = ((rank <= k) & (m > 0)).astype(float)
    raw = s / pre.vol[cols]
    return raw.where(valid(pre, cols), 0)


def kelly(pre, cols, L, f, lmax, long_only=True):
    """Diyagonal Kelly: w = f * mu/sigma^2, mu = son L günün yıllık ort. fazla getirisi."""
    mu = pre.X[cols].rolling(L).mean() * 260
    var = pre.vol[cols] ** 2
    w = f * mu / var
    if long_only:
        w = w.clip(lower=0)
    w = w.where(valid(pre, cols), 0).fillna(0)
    g = w.abs().sum(axis=1)
    k = (lmax / g).clip(upper=1).fillna(1)
    w = w.mul(k, axis=0)
    # haftalık güncelle
    w.iloc[[i for i in range(len(w)) if i % 5]] = np.nan
    return w.ffill().fillna(0)
