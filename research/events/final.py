"""Seçilen (yalnız IS ile) 3 kuralın IS/OOS raporu + OOS aylık getiriler."""
import numpy as np, pandas as pd
from sim import *
E = load_events(); B = pd.read_csv(H/"buyback_events.csv", parse_dates=["start"])
B["ratio"] = np.nan; B["appr2"] = pd.NaT; B["ex_date"] = pd.NaT
px = load_px(set(E.ticker) | set(B.ticker))
xu = pd.read_csv(H.parents[1]/"data"/"bist"/"XU100.csv", index_col=0, parse_dates=True)["close"]; xu_ok = xu > xu.rolling(50).mean()
cfg = {
 "A bedelsiz: ilk bildirim -> SPK onayı+1 gün sat (XU100>SMA50, K=5, stop %15)": (E, "start", ("appr", 1), True, 5, 0.15),
 "B geri alım: program başı -> 60 gün (K=10, stop %15)": (B, "start", ("H", 60), False, 10, 0.15),
 "C bedelsiz: SPK onayı -> bölünme günü sat (XU100>SMA50, K=10)": (E, "appr", ("ex", 0), True, 10, None),
}
rows = []; mon = {}
for name, (ev, an, ex, mf, K, stop) in cfg.items():
    sch = schedule(ev, px, an, ex, xu_ok=xu_ok if mf else None)
    for cap in [100_000, 1_000_000]:
        eq, tr = simulate(sch, px, K=K, stop=stop, capital=cap)
        a = stats(eq, "2020-01-01", "2025-10-16"); b = stats(eq, "2025-10-17", "2026-10-16")
        o = tr[tr.entry >= OOS_START]
        rows.append(dict(strateji=name, sermaye=cap, IS_geo=a["aylik_geo_%"], IS_dd=a["maxDD_%"], IS_worst=a["en_kotu_ay_%"],
                         IS_n=int((tr.entry < OOS_START).sum()), OOS_geo=b["aylik_geo_%"], OOS_dd=b["maxDD_%"], OOS_worst=b["en_kotu_ay_%"],
                         OOS_n=len(o), OOS_win=round((o.ret > 0).mean(), 2), OOS_trade_mean=round(o.ret.mean() * 100, 2)))
        if cap == 1_000_000:
            e = eq.loc["2025-10-16":]; mon[name[:1]] = (e.resample("ME").last().pct_change() * 100).round(1)
            tr.to_csv(H/"results"/f"trades_{name[0]}.csv", index=False)
R = pd.DataFrame(rows); R.to_csv(H/"results"/"final.csv", index=False); print(R.to_string())
idx = pd.date_range("2019-07-01", "2026-10-16"); mm = (1 + cash_rate_daily(idx)).cumprod()
x = xu
print("MM", stats(mm, "2020-01-01", "2025-10-16")["aylik_geo_%"], stats(mm, "2025-10-17", "2026-10-16")["aylik_geo_%"])
print("XU100", stats(x, "2020-01-01", "2025-10-16"), stats(x, "2025-10-17", "2026-10-16"))
print(pd.DataFrame(mon).to_string())
