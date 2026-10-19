"""WF seçiminin pencere/skor komşuluğuna duyarlılığı (protokol madde 5) + OOS aylık getiriler."""
import pickle, sys, numpy as np, pandas as pd
import common as cm
GRID = sys.argv[1] if len(sys.argv) > 1 else "grid.pkl"
res = pickle.load(open(cm.HERE / GRID, "rb"))
O0, O1, IS0 = cm.OOS_START, cm.OOS_END, "2018-01-02"
keys = [k for k in res if not k[0].startswith("REF")]
R = pd.DataFrame({k: res[k][0] for k in keys}); L = np.log1p(R.clip(lower=-0.999))
mend = R.resample("ME").last().index
pools = {"tümü": keys, "KELLY": [k for k in keys if k[0].startswith("KELLY")],
         "volhedef": [k for k in keys if not k[0].startswith("KELLY")]}
def wf(pool, win, score):
    out = pd.Series(0.0, index=R.index); picks = {}
    for i, me in enumerate(mend[:-1]):
        lo = me - pd.DateOffset(months=win)
        if lo < pd.Timestamp(IS0): continue
        h = L.loc[lo:me, pool]
        sc = h.sum() if score == "geo" else h.mean() / (h.std() + 1e-12)
        b = sc.idxmax(); nxt = (R.index > me) & (R.index <= mend[i + 1])
        out[nxt] = R.loc[nxt, b]; picks[me] = b
    return out, picks
rows = []
for pn, pool in pools.items():
    for win in [12, 18, 24, 30, 36, 42, 48]:
        for scr in ["geo", "sharpe"]:
            r, pk = wf(pool, win, scr)
            s = cm.mstats(r, O0, O1); si = cm.mstats(r, "2022-01-01", cm.IS_END)
            rows.append(dict(pool=pn, win=win, score=scr, IS22_geo=si["aylik_geo_%"], IS22_dd=si["maxDD_%"],
                             OOS_geo=s["aylik_geo_%"], OOS_dd=s["maxDD_%"], OOS_worst=s["en_kotu_ay_%"]))
            if (pn, win, scr) == ("KELLY", 36, "sharpe"):
                e = cm.eq_of(r.loc[O0:O1]); m = e.resample("ME").last(); m = pd.concat([pd.Series([1.0]), m.reset_index(drop=True)])
                print("KELLY/36/sharpe OOS aylık %:", (m.pct_change().dropna() * 100).round(1).tolist())
                print("seçimler:", [(d.date().isoformat(), "|".join(p)) for d, p in pk.items() if d >= pd.Timestamp("2025-09-30")])
D = pd.DataFrame(rows); D.to_csv(cm.HERE / f"wf_robust_{GRID.replace('.pkl','')}.csv", index=False)
pd.set_option("display.width", 200)
print(D.to_string(index=False))
print("\nhavuz bazında OOS geo medyan:\n", D.groupby(["pool", "score"]).OOS_geo.describe()[["min", "50%", "max"]])
