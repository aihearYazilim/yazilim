"""Extra cuts: Binance book per-year at s=0.1; 2024-2025 monthly; OKX+Bitget combined (ex Upbit proxy)."""
import sys, pathlib, pickle, pandas as pd
H = pathlib.Path(__file__).parent; sys.path.insert(0, str(H)); import common as C, venue_book as VB
D = pickle.load(open(H / "raw/trades.pkl", "rb"))
pd.set_option("display.width", 250)
bk = D["unl"] + D["bcms"]
T = VB.table({"BINANCE IS_best (audit B)": bk}, VB.YEARS, ss=(0.1,))
print(T[["book", "s"] + [c for c in T.columns if c.endswith("_usd") or c.endswith("_dd")]].to_string())
for s in (0.1, 0.2):
    m = VB.monthly(bk, "2024-01-01", "2025-10-16", s)
    print(f"Binance book s={s} monthly USD% 2024-01..2025-10-16:"); print(m["usd%"].to_frame().T.to_string())
ob = D["VI"]["OKX"] + D["VI"]["BG"]
print(VB.table({"OKX+Bitget (indep, ex Upbit)": ob}, VB.WIN).to_string())
print(VB.table({"OKX+Bitget (indep, ex Upbit)": ob}, VB.YEARS, ss=(0.2,)).filter(regex="book|_usd|_n").to_string())
