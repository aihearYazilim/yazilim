"""BIST: TL bazında, nakit para piyasası fonunda (~politika faizi) bekler."""
import sys, itertools, pandas as pd
sys.path.insert(0, __import__("os").path.dirname(__file__))
from engine import load, panel, backtest, stats, cash_rate_daily
import strategies as S

px = load("bist")
close = panel(px).loc["2018-01-01":]
idx = close.pop("XU100"); close.pop("XU030"); usd = close.pop("USDTRY")
close = close.ffill(limit=5); idx = idx.ffill()
END = close.index[-1]; OOS = END - pd.Timedelta(days=365); IS0 = pd.Timestamp("2019-01-01")
FEE = 0.0004 + 0.001   # aracı kurum ~binde 0.4 (BSMV dahil) + kayma %0.1
cash = cash_rate_daily(close.index)
print("veri sonu:", END.date())
rows = []
def run(name, w, use_cash=True):
    eq = backtest(w, close, fee=FEE, cash_ret=cash if use_cash else None)
    d = {"strateji": name}
    d.update({"IS_" + k: v for k, v in stats(eq, IS0, OOS).items()})
    d.update({"OOS_" + k: v for k, v in stats(eq, OOS, END).items()})
    rows.append(d)

zero = pd.DataFrame(0.0, index=close.index, columns=close.columns)
run("Para piyasası fonu (faiz)", zero)
cl2 = close.copy(); cl2["XU100"] = idx
eqx = backtest(S.buy_hold(cl2, ["XU100"]), cl2, fee=0)
d = {"strateji": "XU100 al-tut"}; d.update({"IS_"+k:v for k,v in stats(eqx, IS0, OOS).items()}); d.update({"OOS_"+k:v for k,v in stats(eqx, OOS, END).items()}); rows.append(d)
run("Eşit ağırlık tüm hisseler", S.buy_hold(close, list(close.columns)), use_cash=False)
for lb, top, rb, rn in itertools.product([20, 60, 120, 250], [3, 5, 10], [5, 21], [50, 100, 0]):
    reg = idx if rn else None
    run(f"Momentum lb{lb} top{top} rb{rb} " + (f"XU100>SMA{rn}" if rn else "filtresiz"),
        S.momentum_rotation(close, lb, top, rb, regime=reg, regime_n=rn or 50, min_hist=250))
for lb, top in itertools.product([60, 120], [5, 10]):
    run(f"Düşük-vol momentum lb{lb} top{top}", S.momentum_rotation(close, lb, top, 21, regime=idx, regime_n=100, min_hist=250, vol_scale=True))
for h, l in [(20, 10), (55, 20), (100, 50)]:
    run(f"Donchian {h}/{l}", S.donchian_basket(close, h, l))

df = pd.DataFrame(rows); pd.set_option("display.width", 250); pd.set_option("display.max_rows", 300)
cols = ["strateji","IS_aylik_geo_%","IS_maxDD_%","OOS_aylik_geo_%","OOS_toplam_%","OOS_>=%10_ay","OOS_en_kotu_ay_%","OOS_maxDD_%"]
print(df[cols].sort_values("IS_aylik_geo_%", ascending=False).to_string(index=False))
df.to_csv(__import__("pathlib").Path(__file__).resolve().parents[1] / "results/bist_grid.csv", index=False)
print("\nUSDTRY son 12 ay %:", round((usd.loc[OOS:].dropna().iloc[-1] / usd.loc[OOS:].dropna().iloc[0] - 1) * 100, 1))
