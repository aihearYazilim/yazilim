"""Combined event book: union of IS-selected sleeves (stop mandatory, IS Sharpe at s=0.2,G=2,hedge=1 > 1.0).
Sizing (s, G, hedge) chosen on IS only. Also a 'robust-centre' variant (pre-registered neighbourhood centre)."""
import sys, pathlib, itertools, pandas as pd, numpy as np
H = pathlib.Path(__file__).parent; sys.path.insert(0, str(H))
import trades as T, port
IS0 = "2022-01-01"
BOOKS = {
  "IS_best": [("UNL", 0.10, 10, 3, 1.0), ("CMS", "MON", -1, 168, 0.5), ("CMS", "DEL", -1, 72, 0.2), ("CMS", "LIST", -1, 720, 0.2)],
  "IS_best_noLIST": [("UNL", 0.10, 10, 3, 1.0), ("CMS", "MON", -1, 168, 0.5), ("CMS", "DEL", -1, 72, 0.2)],
  "centre": [("UNL", 0.05, 7, 1, 0.5), ("CMS", "MON", -1, 72, 0.5), ("CMS", "DEL", -1, 72, 0.5)],
  "UNL_only_IS": [("UNL", 0.10, 10, 3, 1.0)],
}
def gen(k): return T.unlock_trades(*k[1:]) if k[0] == "UNL" else T.cms_trades(*k[1:])
if __name__ == "__main__":
    rows, series = [], {}
    for name, keys in BOOKS.items():
        trs = [t for k in keys for t in gen(k)]
        for s, G, hd in itertools.product([0.1, 0.2, 0.3, 0.5], [1.0, 2.0, 3.0, 4.0], [0, 1]):
            r = port.sim(trs, s, G, hd)
            d = port.report(r, IS0); d.update(book=name, s=s, G=G, hedge=hd,
                n_oos=sum(1 for t in trs if t["d0"] >= pd.Timestamp("2025-10-17")))
            rows.append(d); series[(name, s, G, hd)] = r
    df = pd.DataFrame(rows); df.to_csv(H / "combo_grid.csv", index=False); pd.to_pickle(series, H / "raw/combo_series.pkl")
    pd.set_option("display.width", 250)
    print(len(df), "combos")
    for name in BOOKS:
        x = df[df.book == name]
        print(x.sort_values("IS_sh", ascending=False).head(3).to_string())
        print(x[(x.hedge == 1)].pivot_table(index="s", columns="G", values=["IS_try", "OOS_try", "OOS_dd"]).round(1).to_string())
