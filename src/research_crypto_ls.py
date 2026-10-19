"""Kripto: uzun/kısa (vadeli işlem) trend stratejileri. Kısa pozisyon fonlama maliyeti varsayımı."""
import sys, itertools, numpy as np, pandas as pd
sys.path.insert(0, __import__("os").path.dirname(__file__))
from engine import load, panel, backtest, stats

close = panel(load("crypto")).loc["2019-06-01":]
END = close.index[-1]; OOS = END - pd.Timedelta(days=365); IS0 = pd.Timestamp("2020-06-01")
FEE = 0.0005 + 0.0005  # vadeli taker %0.05 + kayma
FUND = 0.10            # yıllık ~%10 fonlama (uzun ya da kısa, kötümser)
rows = []
def run(name, w):
    gross_exp = w.abs().sum(axis=1)
    eq = backtest(w, close, fee=FEE)
    # fonlama maliyetini brüt pozisyona göre düş
    r = eq.pct_change().fillna(0) - gross_exp.shift(1).fillna(0) * FUND / 365
    eq = (1 + r).cumprod()
    d = {"strateji": name}
    d.update({"IS_" + k: v for k, v in stats(eq, IS0, OOS).items()})
    d.update({"OOS_" + k: v for k, v in stats(eq, OOS, END).items()})
    rows.append(d)

for a in ["BTC", "ETH"]:
    c = close[a]
    for n, lev in itertools.product([20, 50, 100, 200], [1, 2]):
        w = pd.DataFrame(0.0, index=close.index, columns=close.columns)
        w[a] = np.where(c > c.rolling(n).mean(), lev, -lev)
        run(f"{a} uzun/kısa SMA{n} x{lev}", w)
# kesitsel uzun/kısa: en güçlü 5 al, en zayıf 5 sat
for lb, rb in itertools.product([14, 30, 60], [7, 14]):
    mom = close / close.shift(lb) - 1
    mom = mom.where(close.notna().rolling(120).sum() >= 120)
    w = pd.DataFrame(0.0, index=close.index, columns=close.columns); last = None
    for i, d in enumerate(close.index):
        if i % rb == 0:
            row = mom.loc[d].dropna(); cur = pd.Series(0.0, index=close.columns)
            if len(row) >= 10:
                cur[row.nlargest(5).index] = 0.1; cur[row.nsmallest(5).index] = -0.1
            last = cur
        w.loc[d] = last
    run(f"Kesitsel L/S lb{lb} rb{rb}", w)

df = pd.DataFrame(rows); pd.set_option("display.width", 250)
cols = ["strateji","IS_aylik_geo_%","IS_maxDD_%","OOS_aylik_geo_%","OOS_toplam_%","OOS_>=%10_ay","OOS_en_kotu_ay_%","OOS_maxDD_%"]
print(df[cols].sort_values("OOS_aylik_geo_%", ascending=False).to_string(index=False))
df.to_csv(__import__("pathlib").Path(__file__).resolve().parents[1] / "results/crypto_ls_grid.csv", index=False)
