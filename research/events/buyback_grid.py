"""Pay geri alım programı başlangıcı -> H gün tut. IS seçimi, OOS rapor."""
import itertools, numpy as np, pandas as pd
from sim import *
B = pd.read_csv(H/"buyback_events.csv", parse_dates=["start"])
B["ratio"] = np.nan; B["appr2"] = pd.NaT; B["ex_date"] = pd.NaT
px = load_px(set(B.ticker))
xu = pd.read_csv(H.parents[1]/"data"/"bist"/"XU100.csv", index_col=0, parse_dates=True)["close"]
xu_ok = (xu > xu.rolling(50).mean())
res = []
for h, mf in itertools.product([3, 5, 10, 20, 40, 60], [False, True]):
    sch = schedule(B, px, "start", ("H", h), xu_ok=xu_ok if mf else None)
    for K, stop in itertools.product([5, 10, 20], [None, 0.15]):
        eq, tr = simulate(sch, px, K=K, stop=stop)
        a = stats(eq, "2020-01-01", "2025-10-16"); b = stats(eq, "2025-10-17", "2026-10-16")
        res.append(dict(anchor="buyback", exit=f"H{h}", mkt=mf, K=K, stop=stop, IS_geo=a["aylik_geo_%"], IS_dd=a["maxDD_%"],
                        IS_worst=a["en_kotu_ay_%"], IS_n=int((tr.entry < OOS_START).sum()),
                        IS_trade_mean=round(tr[tr.entry < OOS_START].ret.mean() * 100, 2),
                        OOS_geo=b["aylik_geo_%"], OOS_dd=b["maxDD_%"], OOS_worst=b["en_kotu_ay_%"],
                        OOS_n=int((tr.entry >= OOS_START).sum()), OOS_trade_mean=round(tr[tr.entry >= OOS_START].ret.mean() * 100, 2)))
R = pd.DataFrame(res); R.to_csv(H/"results"/"buyback_grid.csv", index=False)
print(len(px), "ticker fiyatlı;", len(R), "kombinasyon"); print(R.sort_values("IS_geo", ascending=False).head(12).to_string())
