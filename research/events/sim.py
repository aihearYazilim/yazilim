"""Olay-güdümlü portföy simülasyonu (günlük). Her olay: giriş günü, çıkış günü (ticker'ın kendi işlem günleri).
Giriş/çıkış fiyatı = gün VWAP (düzeltilmiş). Tavan kilitli gün alınamaz (ertesi güne kayar, max_wait gün),
taban kilitli gün satılamaz (ertesi güne kayar). Pozisyon = özsermaye/K, ayrıca <= %1 x 20g ort. TL hacim.
Boş nakit para piyasası (engine.cash_rate_daily). Maliyet: komisyon %0.14 + kayma %0.10, her yön."""
import numpy as np, pandas as pd
from common import *

def schedule(E, px, anchor="start", exit_rule=("H", 20), max_wait=3, min_ratio=0, xu_ok=None):
    """Her olay için (ticker, giriş_tarihi, çıkış_tarihi) listesi."""
    out = []
    for _, r in E.iterrows():
        o = px.get(r.ticker)
        if o is None: continue
        idx = o.index
        if anchor == "start": ts = r.start
        elif anchor == "appr": ts = r.appr2
        elif anchor == "ex": ts = r.ex_date - pd.Timedelta(hours=1) if pd.notna(r.ex_date) else pd.NaT
        if pd.isna(ts): continue
        if min_ratio and pd.notna(r.ratio) and r.ratio < min_ratio: continue
        j = entry_day(ts, idx)
        # tavan kilitli ise bekle
        w = 0
        while j < len(idx) and o.lockup.iloc[j] and w < max_wait: j += 1; w += 1
        if j >= len(idx) or o.lockup.iloc[j]: continue
        if xu_ok is not None:
            d0 = idx[j]; ok = xu_ok.asof(d0 - pd.Timedelta(days=1))
            if not ok: continue
        kind, val = exit_rule
        if kind == "H": x = j + val
        elif kind in ("appr", "ex"):   # olay günü (ertesi seans) + val gün, en geç cap gün
            evt = r.appr2 if kind == "appr" else (r.ex_date - pd.Timedelta(hours=1) if pd.notna(r.ex_date) else pd.NaT)
            cap = 250
            x = entry_day(evt, idx) + val if pd.notna(evt) else j + cap
            x = min(max(x, j + 1), j + cap)
        x = min(x, len(idx) - 1)
        if x <= j: continue
        out.append((r.ticker, idx[j], idx[x], r.start))
    return out

_CACHE = {}
def _fast(px):
    k = id(px)
    if k not in _CACHE:
        F = {t: dict(c=o.c.to_dict(), v=o.v.to_dict(), dn=o.lockdn.to_dict(), v20=o.vol20.to_dict()) for t, o in px.items()}
        # takvim: İş Yatırım (BIST resmi seans günleri) tarihlerinin birleşimi; Yahoo yedeği tarih kaydırmalarını dışarıda tutar
        cal = pd.DatetimeIndex(sorted(set().union(*[set(o.index) for t, o in px.items() if (H/"prices"/f"{t}.csv").exists()])))
        _CACHE[k] = (F, cal)
    return _CACHE[k]

def simulate(sched, px, K=10, capital=1_000_000, start="2019-07-01", end="2026-10-16", cost=FEE + SLIP, liq=0.01, stop=None, tp=None):
    F, cal = _fast(px)
    cal = cal[(cal >= start) & (cal <= end)]
    cr = cash_rate_daily(pd.date_range(cal[0] - pd.Timedelta(days=10), cal[-1]))
    crc = (1 + cr).cumprod()
    ent = {}
    for s in sched: ent.setdefault(s[1], []).append(s)
    cash = capital; pos = {}  # id -> [ticker, units, exit_date, last_price, entry_px, entry_date]
    eq = []; trades = []; prev = None; nid = 0
    for d in cal:
        if prev is not None:
            cash *= crc[d] / crc[prev]
        for pid in list(pos):
            t, u, xd, lp, ep, ed = pos[pid]; f = F[t]
            if d >= xd and d in f["c"] and not f["dn"][d]:
                cash += u * f["v"][d] * (1 - cost)
                trades.append((t, ed, d, f["v"][d] / ep * (1 - cost) ** 2 - 1)); del pos[pid]
        for (t, ed, xd, st) in ent.get(d, []):
            if len(pos) >= K: continue
            if any(p[0] == t for p in pos.values()): continue
            f = F[t]
            equity = cash + sum(p[1] * F[p[0]]["c"].get(d, p[3]) for p in pos.values())
            amt = equity / K
            v20 = f["v20"].get(d, np.nan)
            if liq and v20 == v20: amt = min(amt, liq * v20)   # TL: günlük hacmin %1'i
            amt = min(amt, cash)
            if amt <= 0: continue
            u = amt * (1 - cost) / f["v"][d]; cash -= amt
            pos[nid] = [t, u, xd, f["c"][d], f["v"][d], d]; nid += 1
        val = 0
        for p in pos.values():
            c = F[p[0]]["c"].get(d)
            if c is not None:
                p[3] = c
                if (stop and c < p[4] * (1 - stop)) or (tp and c > p[4] * (1 + tp)):
                    p[2] = min(p[2], d + pd.Timedelta(days=1))
            val += p[1] * p[3]
        eq.append(cash + val); prev = d
    eq = pd.Series(eq, index=cal) / capital
    return eq, pd.DataFrame(trades, columns=["ticker", "entry", "exit", "ret"])
