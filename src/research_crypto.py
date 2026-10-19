import itertools, sys, pandas as pd
sys.path.insert(0, __import__("os").path.dirname(__file__))
from engine import load, panel, backtest, stats
import strategies as S

px = load("crypto")
close = panel(px).loc["2019-06-01":]
END = close.index[-1]
OOS = END - pd.Timedelta(days=365)
IS0 = pd.Timestamp("2020-06-01")
FEE = 0.001 + 0.0005  # Binance taker %0.1 + kayma %0.05
TAX = 0.0  # mevcut mevzuatta kriptoya özel stopaj yok; senaryo için ayrıca 0.10 test edilir
print("veri sonu:", END.date(), "OOS başlangıç:", OOS.date())

rows = []
def run(name, w, lev_cost=0.0):
    eq = backtest(w, close, fee=FEE, lev_cost=lev_cost)
    r = {"strateji": name}
    r.update({"IS_" + k: v for k, v in stats(eq, IS0, OOS).items()})
    r.update({"OOS_" + k: v for k, v in stats(eq, OOS, END).items()})
    rows.append(r)

run("BTC al-tut", S.buy_hold(close, ["BTC"]))
run("ETH al-tut", S.buy_hold(close, ["ETH"]))
run("Eşit ağırlık sepet", S.buy_hold(close, list(close.columns)))
for n in [20, 50, 100, 200]:
    run(f"BTC trend SMA{n}", S.trend_single(close, "BTC", n))
    run(f"BTC trend SMA{n} 2x", S.trend_single(close, "BTC", n, lev=2.0), lev_cost=0.10)
for lb, top, rb, rn in itertools.product([7, 14, 30, 60, 90], [1, 3, 5], [7, 14], [50, 100]):
    run(f"Momentum lb{lb} top{top} rb{rb} BTC>SMA{rn}",
        S.momentum_rotation(close, lb, top, rb, regime="BTC", regime_n=rn))
for h, l in [(20, 10), (55, 20), (100, 50)]:
    run(f"Donchian {h}/{l}", S.donchian_basket(close, h, l))

df = pd.DataFrame(rows)
df.to_csv(pathlib := __import__("pathlib").Path(__file__).resolve().parents[1] / "results/crypto_grid.csv", index=False)
pd.set_option("display.width", 250); pd.set_option("display.max_rows", 200)
cols = ["strateji","IS_aylik_geo_%","IS_maxDD_%","OOS_aylik_geo_%","OOS_toplam_%","OOS_>=%10_ay","OOS_en_kotu_ay_%","OOS_maxDD_%"]
print(df[cols].sort_values("IS_aylik_geo_%", ascending=False).to_string(index=False))
