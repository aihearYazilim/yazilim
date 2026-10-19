"""Risk yönetimli kaldıraçlı TL taşıma: TL para piyasası fonu (teminat) + VİOP USDTRY vadeli KISA.

Muhasebe (TRY NAV, günlük, iş günü):
  - Teminat NAV tamamen PPF'de: getiri = 0.9*politika (engine.cash_rate_daily ile aynı varsayım), takvim günü.
  - Kısa vadeli: N USD nominal. Gün P&L = -N*(M_t - M_{t-1}) + N*M_{t-1}*(r_TRY - basis - r_USD)*gün/365
    (vadeli fiyatı faiz farkını içerir; basis = 1 puan, VİOP ima faizinin politikanın biraz altında olması).
  - Gün içi risk: bar high'ı (24 saat FX) ile MTM. Teminat < bakım teminatı (nominalin %7.5'i) olursa
    high fiyatından +%0.5 kaymayla zorla kapatma. NAV<=0 iflas.
  - Stop-loss: iz süren; seviye = (girişten beri en düşük işaret)*(1+s). High >= seviye ise seviye*(1+%0.5) dan çıkış,
    sonra cd iş günü bekleme.
  - Kaldıraç kararı t-1 gün sonu verisiyle, t-1 işaretinden (+kayma) uygulanır; t gününün getirisi kazanılır.
    lag=1 seçeneği: bir gün daha gecikme.
  - Maliyet: işlem görülen nominalin %0.05'i (komisyon+kayma), ay sonu vade devri nominalin %0.04'ü.
    Yeniden dengeleme bandı: |hedef-mevcut kaldıraç| > max(0.1, 0.2*hedef) veya hedef 0.
  - Vergi: vadeli kâra çeyreklik pozitif net kâr üzerinden %10 stopaj (tax=0.10) ya da %0 (tax=0).
  - Başlangıç teminatı %10 -> kaldıraç üst sınırı 8x (teminatın %80'i).
"""
import numpy as np, pandas as pd, pathlib
from numba import njit
HERE = pathlib.Path(__file__).resolve().parent
IS_START, IS_END = "2005-01-03", "2025-10-16"
OOS_START, OOS_END = "2025-10-17", "2026-10-16"
BASIS = 1.0
MAINT = 0.075
TC = 0.0005
ROLL = 0.0004


def load():
    d = pd.read_csv(HERE / "data/panel.csv", index_col=0, parse_dates=True)
    d = d.loc[:OOS_END]
    idx = d.index
    days = np.r_[1, (idx[1:] - idx[:-1]).days].astype(float)
    M = d["close"].values; H = d["high"].values
    pol = d["pol"].values / 100; fed = d["fed"].values / 100; cpi = d["cpi"].values / 100
    mmf = (1 + 0.9 * pol) ** (days / 365) - 1
    carry = (pol - BASIS / 100 - fed) * days / 365
    lr = np.r_[0, np.diff(np.log(M))]
    month_end = np.r_[idx[1:].month != idx[:-1].month, True]
    q_end = np.r_[(idx[1:].quarter != idx[:-1].quarter) | (idx[1:].year != idx[:-1].year), True]
    return dict(idx=idx, M=M, H=H, pol=pol, fed=fed, cpi=cpi, mmf=mmf, carry=carry, lr=lr,
                month_end=month_end, q_end=q_end, df=d)


@njit(cache=True)
def run(M, H, mmf, carry, Ltgt, month_end, q_end, stop, cd, tax, lag):
    n = len(M)
    nav = np.ones(n)
    Lh = np.zeros(n)
    N = 0.0; v = 1.0; dead = False
    low_since = 1e18; cool = 0; qpnl = 0.0; ntr = 0; nstop = 0; nliq = 0
    for t in range(1, n):
        if dead:
            nav[t] = 0.0; continue
        # --- gün t: pozisyon N (t-1 sonunda kuruldu)
        fut = 0.0
        exited = False
        if N > 0:
            # gün içi zorla kapatma kontrolü (high)
            worst = v - N * (H[t] - M[t - 1])
            if worst < MAINT * N * H[t]:
                fut = -N * (H[t] * 1.005 - M[t - 1]); N = 0.0; exited = True; nliq += 1; cool = cd
            elif stop > 0 and H[t] >= low_since * (1 + stop):
                lvl = max(low_since * (1 + stop), M[t - 1])
                fut = -N * (lvl * 1.005 - M[t - 1]) + N * M[t - 1] * carry[t] * 0.5
                N = 0.0; exited = True; nstop += 1; cool = cd
            else:
                fut = -N * (M[t] - M[t - 1]) + N * M[t - 1] * carry[t]
        v = v * (1 + mmf[t]) + fut
        qpnl += fut
        if v <= 0:
            dead = True; nav[t] = 0.0; continue
        if N > 0:
            low_since = min(low_since, M[t])
            if month_end[t]:
                v -= N * M[t] * ROLL
        if q_end[t]:
            if qpnl > 0:
                v -= tax * qpnl
            qpnl = 0.0
        # --- karar: t sonu bilgisi (Ltgt[t-lag]) ile hedef
        if cool > 0:
            cool -= 1
            tgt = 0.0
        else:
            tgt = Ltgt[t - lag] if t - lag >= 0 else 0.0
        cur = N * M[t] / v
        if (tgt == 0.0 and N > 0) or abs(tgt - cur) > max(0.1, 0.2 * tgt) or (tgt > 0 and N == 0.0 and not exited):
            newN = tgt * v / M[t]
            v -= abs(newN - N) * M[t] * TC
            if N == 0.0 and newN > 0:
                low_since = M[t]
            N = newN; ntr += 1
        nav[t] = v
        Lh[t] = N * M[t] / v
    return nav, Lh, ntr, nstop, nliq


def mstats(nav, idx, start, end):
    s = pd.Series(nav, idx).loc[start:end]
    if len(s) < 20 or s.iloc[0] <= 0:
        return dict(geo=-100.0, dd=-100.0, worst=-100.0, sharpe=0.0)
    e = s / s.iloc[0]
    m = e.resample("ME").last()
    m = pd.concat([pd.Series([1.0], index=[e.index[0] - pd.Timedelta(days=1)]), m])
    mr = m.pct_change().dropna()
    months = len(mr)
    tot = e.iloc[-1]
    geo = (tot ** (1 / months) - 1) * 100 if tot > 0 else -100.0
    dd = ((e / e.cummax()) - 1).min() * 100
    r = e.pct_change().dropna()
    sh = r.mean() / (r.std() + 1e-12) * np.sqrt(260)
    return dict(geo=geo, dd=dd, worst=mr.min() * 100, sharpe=sh)
