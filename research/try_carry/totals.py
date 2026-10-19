"""OOS toplam getiri ve 12 aya bölünmüş aylık geo (engine.stats 13 kısmi ay sayar; ikisi de raporlanır)."""
import numpy as np, pandas as pd, grid as G
from analyze import CANDS, L_of
for name, c in CANDS.items():
    L, st = L_of(c)
    for tax in [0.10, 0.0]:
        nav = G._run(L, st, tax, 0, G.CD, G.I0)[0]
        s = pd.Series(nav, G.idx[G.I0:]); tot = s.iloc[-1] / s.iloc[0]
        print(f"{name:45s} stopaj {tax:.0%}: OOS toplam x{tot:.2f}  12-ay geo %{(tot**(1/12)-1)*100:.2f}  13-kova geo %{(tot**(1/13)-1)*100:.2f}")
