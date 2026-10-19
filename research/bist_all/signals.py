"""Kesitsel sinyaller. Hepsi t ve öncesi veriyle hesaplanır (rolling / shift>=0)."""
import numpy as np, pandas as pd


def _z(df):
    m = df.mean(axis=1); s = df.std(axis=1)
    return df.sub(m, axis=0).div(s.replace(0, np.nan), axis=0).clip(-3, 3)


def build(P):
    px, ret, turn = P["px"], P["ret"], P["turn"]
    S = {}
    for lb, sk in [(21, 0), (63, 0), (126, 0), (126, 21), (252, 21), (252, 0)]:
        S[f"mom{lb}_{sk}"] = px.shift(sk) / px.shift(lb) - 1
    S["h52"] = px / px.rolling(252, min_periods=200).max()
    S["h26"] = px / px.rolling(126, min_periods=100).max()
    for k in [1, 5, 10]:
        S[f"rev{k}"] = -(px / px.shift(k) - 1)
    t5 = turn.rolling(5).mean(); t60 = turn.rolling(60, min_periods=40).mean()
    brk20 = px >= px.rolling(20).max() * 0.999
    S["volbrk20"] = np.log((t5 + 1) / (t60 + 1)).where(brk20)
    brk55 = px >= px.rolling(55).max() * 0.999
    S["volbrk55"] = np.log((t5 + 1) / (t60 + 1)).where(brk55)
    S["lowvol60"] = -ret.rolling(60, min_periods=40).std()
    S["lowvol120"] = -ret.rolling(120, min_periods=80).std()
    S["small"] = -np.log(turn.rolling(60, min_periods=40).median() + 1)
    # sektör rotasyonu: sektör ortalama 63g momentumu + hisse içi momentum (küçük ağırlık)
    sec = P["sector"]
    m63 = S["mom63_0"]
    secm = m63.T.groupby(sec).transform("median").T
    S["sector63"] = secm.rank(axis=1, pct=True) + 0.1 * m63.rank(axis=1, pct=True)
    m126 = S["mom126_0"]
    secm2 = m126.T.groupby(sec).transform("median").T
    S["sector126"] = secm2.rank(axis=1, pct=True) + 0.1 * m126.rank(axis=1, pct=True)
    # tavan serisi: son k günde tavan sayısı (+ yakınlık bonusu); hiç yoksa NaN
    up = P["lim_up"].astype(float)
    for k in [3, 5, 10]:
        cnt = up.rolling(k).sum()
        rec = sum(up.shift(i) * (0.5 ** i) for i in range(k)) / 10
        S[f"tavan{k}"] = (cnt + rec).where(cnt > 0)
    # birleşik skorlar (kesitsel z-skor toplamı)
    S["c_mom_h52"] = _z(S["mom252_21"]) + _z(S["h52"])
    S["c_mom_lowvol"] = _z(S["mom252_21"]) + _z(S["lowvol60"])
    S["c_h52_lowvol"] = _z(S["h52"]) + _z(S["lowvol60"])
    S["c_mom_rev"] = _z(S["mom126_21"]) + 0.5 * _z(S["rev5"])
    S["c_all"] = _z(S["mom252_21"]) + _z(S["h52"]) + _z(S["lowvol60"]) + 0.5 * _z(S["rev5"])
    S["c_mom_small"] = _z(S["mom126_21"]) + _z(S["small"])
    return S


def regimes(P):
    x = P["xu"]["XU100"].ffill()
    R = {"none": None}
    for n in [50, 100, 200]:
        R[f"sma{n}"] = x > x.rolling(n).mean()
    # küçük/orta hisse rejimi: likit evrenin eşit ağırlıklı endeksi > SMA50, ve genişlik
    liq = P["turn"].rolling(20, min_periods=10).median() >= 5e6
    ew = (1 + P["ret"].where(liq.shift(1).fillna(False)).mean(axis=1).fillna(0)).cumprod()
    R["ew50"] = ew > ew.rolling(50).mean()
    R["ew20"] = ew > ew.rolling(20).mean()
    above = (P["px"] > P["px"].rolling(50).mean()).where(liq)
    R["breadth50"] = above.mean(axis=1) > 0.5
    return R
