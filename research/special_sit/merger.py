"""Sabit değişim oranlı birleşmeler (devralınan ve devralan ikisi de borsada).
Hedgeli spread: 1 hedef pay al, oran*devralan açığa sat. Giriş: oranın KAP'ta ilk yayımından sonraki ilk seans AOF;
çıkış: hedefin son işlem günü AOF (her iki bacak). Açığa satış ödünç maliyeti yıllık %5 varsayımı."""
import numpy as np, pandas as pd
from common_ss import *
PAIRS = [  # hedef, devralan, oran, oran ilk yayım, not
 ("ANACM", "SISE", 0.88239, "2020-04-27 20:02"), ("DENCM", "SISE", 0.33089, "2020-04-27 20:02"),
 ("TRKCM", "SISE", 0.67615, "2020-04-27 20:02"), ("SODA", "SISE", 1.15997, "2020-04-27 20:02"),
 ("ASLAN", "MRDIN", 6.16545574, "2020-05-15 16:30"), ("BOLUC", "MRDIN", 0.95992901, "2020-05-15 16:30"),
 ("UNYEC", "MRDIN", 1.06748908, "2020-05-15 16:30"), ("ADANA", "MRDIN", 2.08110304, "2020-05-15 16:30"),
 ("ADBGR", "MRDIN", 1.47448659, "2020-05-15 16:30"), ("ADNAC", "MRDIN", 0.29795106, "2020-05-15 16:30"),
 ("HALKS", "TURSG", 0.5786, "2020-07-14 01:02"), ("OLMK", "MNDTR", 0.60574162, "2022-06-30 20:52")]
idx = days(); c = FEE + SLIP; rows = []
for tg, aq, ratio, ts in PAIRS:
    a = series(tg + ".E"); b = series(aq + ".E")
    if len(b) == 0 and aq == "MRDIN": b = series("OYAKC.E")
    if len(a) == 0 or len(b) == 0: rows.append({"target": tg, "acq": aq, "note": "fiyat yok"}); continue
    j = entry_idx(pd.Timestamp(ts), idx); d0 = idx[j]
    a = a[a.index >= d0]; b = b.reindex(a.index)
    last = a.index[-1]
    sp = (ratio * b.c - a.c) / a.c
    L = a.v.iloc[0] * (1 + c); Sh = ratio * b.v.iloc[0] * (1 - c)
    Lx = a.v.iloc[-1] * (1 - c); Shx = ratio * b.v.iloc[-1] * (1 + c)
    days_ = (last - d0).days
    pnl = (Lx - L) + (Sh - Shx) - Sh * 0.05 * days_ / 365
    rows.append({"target": tg, "acq": aq, "ratio": ratio, "entry": d0.date(), "last_trade": last.date(), "days": days_,
                 "spread_entry%": round(100 * sp.iloc[0], 2), "spread_max%": round(100 * sp.max(), 2), "spread_min%": round(100 * sp.min(), 2),
                 "spread_last%": round(100 * sp.iloc[-1], 2), "hedged_ret_on_long%": round(100 * pnl / L, 2),
                 "ann%": round(100 * ((1 + pnl / L) ** (365 / max(days_, 1)) - 1), 1), "tgt_med_TLvol_M": round(a.val.median() / 1e6, 2)})
R = pd.DataFrame(rows); pd.set_option("display.width", 250); print(R.to_string())
R.to_csv(H/"results"/"merger_pairs.csv", index=False)
