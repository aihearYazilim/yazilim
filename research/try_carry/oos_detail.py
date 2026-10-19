"""R3 OOS aylık dökümü, kaldıraç ve sıçrama stres testi."""
import numpy as np, pandas as pd, grid as G
from analyze import CANDS, L_of
L, st = L_of(CANDS["R3 vt30%/max8x/w20 + reel>5%"])
nav, Lh, ntr, ns, nl = G._run(L, st, 0.10, 0, G.CD, G.I0)
ix = G.idx[G.I0:]
s = pd.Series(nav, ix); lh = pd.Series(Lh, ix)
m = s.resample("ME").last(); m = pd.concat([pd.Series([1.0], [ix[0]]), m]).pct_change().dropna() * 100
print(pd.DataFrame({"ay_%": m.round(2), "ort_kaldıraç": lh.resample("ME").mean().round(2).values[:len(m)]}).to_string())
lr = pd.Series(G.lr, G.idx)
print("OOS USDTRY yıllık vol %:", round(lr.loc["2025-10-17":].std() * np.sqrt(260) * 100, 2))
print("OOS kur değişimi %:", round((G.S.loc["2026-10-16"] / G.S.loc["2025-10-16"] - 1) * 100, 2))
print("max kaldıraç OOS:", round(lh.max(), 2))
# sıçrama stres: günlük kapanış ve gün içi high sıçramaları (tarihsel en büyük 8)
H = pd.Series(G.U["H"], G.idx); jump_hi = H / G.S.shift(1) - 1; jump_c = G.S.pct_change()
top = jump_hi.sort_values(ascending=False).head(8)
for d, j in top.items():
    jc = jump_c.loc[d]
    L8 = 8.0
    print(d.date(), f"high +{j*100:.1f}%  kapanış +{jc*100:.1f}%  -> 8x kayıp: kapanış {-L8*jc*100:.0f}%, high {max(-L8*j*100, -100):.0f}% (bakım teminatı %7.5 -> zorla kapatma eşiği +%{(1/L8-0.075)/(1+0.075)*100:.1f})")
