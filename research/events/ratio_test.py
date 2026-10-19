"""Oran filtresi (bedelsiz oranı >= X; oran bilinmeyen/iptal olanlar geçer -> survivorship lehine değil). IS seçim."""
import itertools, pandas as pd
from sim import *
E = load_events(); px = load_px(set(E.ticker))
xu = pd.read_csv(H.parents[1]/"data"/"bist"/"XU100.csv", index_col=0, parse_dates=True)["close"]; xu_ok = xu > xu.rolling(50).mean()
res = []
for (ex, K, stop), mr in itertools.product([(("appr", 1), 5, 0.15), (("appr", 0), 5, 0.15), (("H", 120), 5, None), (("appr", 3), 5, None)], [100, 300, 500]):
    sch = schedule(E, px, "start", ex, min_ratio=mr, xu_ok=xu_ok)
    eq, tr = simulate(sch, px, K=K, stop=stop)
    a = stats(eq, "2020-01-01", "2025-10-16"); b = stats(eq, "2025-10-17", "2026-10-16")
    res.append(dict(exit=ex, K=K, stop=stop, min_ratio=mr, IS_geo=a["aylik_geo_%"], IS_dd=a["maxDD_%"], OOS_geo=b["aylik_geo_%"], OOS_dd=b["maxDD_%"],
                    OOS_worst=b["en_kotu_ay_%"], IS_n=int((tr.entry < OOS_START).sum()), OOS_n=int((tr.entry >= OOS_START).sum())))
R = pd.DataFrame(res); R.to_csv(H/"results"/"ratio_test.csv", index=False); print(R.to_string())
