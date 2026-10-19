"""Ortak: bülten paneli, maliyet, portföy motoru (eşzamanlı işlemler, likidite sınırı, boşta para PPF)."""
import pathlib, sys, numpy as np, pandas as pd
H = pathlib.Path(__file__).parent
sys.path.insert(0, str(H.parents[1]/"src"))
from engine import cash_rate_daily, stats
OOS_START = pd.Timestamp("2025-10-17"); OOS_END = pd.Timestamp("2026-10-16"); IS_START = pd.Timestamp("2019-01-02")
FEE = 0.0014; SLIP = 0.0010
_P = None
def panel():
    global _P
    if _P is None: _P = pd.read_pickle(H/"panel.pkl")
    return _P
def series(code):
    P = panel(); d = P[P.code == code].set_index("date").sort_index()
    d = d[~d.index.duplicated()]
    return d
def days():
    return pd.DatetimeIndex(sorted(panel().date.unique()))
def entry_idx(ts, idx):
    """bildirim zamanı -> ilk işlem yapılabilir günün indeksi (09:30 öncesi aynı gün, sonra ertesi gün)"""
    d = ts.normalize()
    return idx.searchsorted(d) if ts.hour*60 + ts.minute < 9*60+30 else idx.searchsorted(d, side="right")

def simulate(trades, capital, max_frac=0.25, liq=0.01, start=IS_START, end=OOS_END):
    """trades: list of dict(d0: giriş günü, path: pd.Series (tarih -> 1 TL yatırımın değeri, maliyetler dahil, son gün nakde döner),
    liq_tl: giriş günü işlem hacmi TL). Sıralı: d0 aynı gün ise listedeki sıra.
    Pozisyon <= min(liq*hacim, max_frac*özsermaye, nakit). Kalan nakit PPF faizinde."""
    idx = days(); idx = idx[(idx >= start) & (idx <= end)]
    r = cash_rate_daily(idx)
    gaps = pd.Series(idx).diff().dt.days.fillna(1).values
    by_day = {}
    for t in trades: by_day.setdefault(t["d0"], []).append(t)
    cash = capital; open_ = []; eq = []; log = []
    for k, d in enumerate(idx):
        cash *= (1 + r.iloc[k]) ** gaps[k]
        # kapanan işlemler
        still = []
        for o in open_:
            if d >= o["exit"]:
                cash += o["amt"] * o["path"].iloc[-1]; o["pnl"] = o["amt"] * (o["path"].iloc[-1] - 1); log.append(o)
            else: still.append(o)
        open_ = still
        mtm = sum(o["amt"] * o["path"].asof(d) for o in open_)
        E = cash + mtm
        for t in by_day.get(d, []):
            used = sum(o["amt"] for o in open_ if o.get("key") == t.get("key")) if t.get("key") else 0.0
            amt = min(liq * t["liq_tl"], max_frac * E - used, cash)
            if amt < 1000: continue
            o = dict(t); o["amt"] = amt; o["exit"] = t["path"].index[-1]; cash -= amt; open_.append(o)
            if o["exit"] <= d:
                cash += amt * o["path"].iloc[-1]; o["pnl"] = amt * (o["path"].iloc[-1] - 1); log.append(o); open_.remove(o)
        mtm = sum(o["amt"] * o["path"].asof(d) for o in open_)
        eq.append(cash + mtm)
    return pd.Series(eq, index=idx) / capital, log

def report(eq, log, label=""):
    a = stats(eq, IS_START, OOS_START - pd.Timedelta(days=1)); b = stats(eq, OOS_START, OOS_END)
    L = pd.DataFrame(log) if log else pd.DataFrame(columns=["d0", "amt", "pnl"])
    nis = int((L.d0 < OOS_START).sum()) if len(L) else 0; noos = len(L) - nis
    pis = L[L.d0 < OOS_START].pnl.sum() if len(L) else 0; poos = L[L.d0 >= OOS_START].pnl.sum() if len(L) else 0
    return {"label": label, "IS_geo%": a.get("aylik_geo_%"), "IS_maxDD%": a.get("maxDD_%"), "OOS_geo%": b.get("aylik_geo_%"),
            "OOS_maxDD%": b.get("maxDD_%"), "OOS_worst%": b.get("en_kotu_ay_%"), "n_IS": nis, "n_OOS": noos,
            "pnl_IS_TL": round(pis), "pnl_OOS_TL": round(poos)}
