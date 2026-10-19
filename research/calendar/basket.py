"""Eşit ağırlıklı likit sepet (bülten, kote olmayanlar dahil, 2019-04+): TOM, ön-tatil, gece/gün içi. Hisse maliyeti %0.24/taraf."""
import numpy as np, pandas as pd
import common as c
from scan import signals
B = c.basket_bulletin(50)
m = c.market()
idx = B.index
# takvim: bülten günleri gerçek takvim (Yahoo boşlukları yok)
F = c.features(idx, c.holidays(idx)); S = signals(F)
cash = c.cash_per_day(idx)
IS = (idx < c.OOS_START); OOS = (idx >= c.OOS_START) & (idx <= c.OOS_END)
def ov(sig, r, cost):
    s = sig.astype(float); tr = s.diff().abs().fillna(0); return s * (r - cash) - tr * cost
rows = []
for nm in ["tom_L2_F4", "tom_L2_F5", "tom_L0_F4", "tom_L1_F3", "prehol_any", "prehol2_any", "mpc_post1", "dow_Wed"]:
    for cost_nm, cost in [("stock", c.STK_COST), ("zero", 0.0)]:
        o = ov(S[nm], B.bk, cost)
        rows.append(dict(sig=nm, cost=cost_nm, IS_mean_in_bp=(B.bk - cash)[IS & S[nm].values].mean() * 1e4,
                         IS_ann=o[IS].sum() / (IS.sum() / 252) * 100, OOS_ann=o[OOS].sum() / (OOS.sum() / 252) * 100,
                         IS_SR=o[IS].mean() / o[IS].std() * np.sqrt(252)))
R = pd.DataFrame(rows); print(R.round(2).to_string(index=False))
print("\nBasket overnight / intraday mean bp (IS 2019-04..2025-10 | OOS):")
for col in ["bk_on", "bk_id", "bk"]:
    print(col, round(B[col][IS].mean() * 1e4, 1), round(B[col][OOS].mean() * 1e4, 1))
# XU030 (Yahoo) aynı dönem
j = m.index[(m.index >= idx[0])]
print("XU030 on/id same period IS:", round(m.x30_on[j][j < c.OOS_START].mean() * 1e4, 1), round(m.x30_id[j][j < c.OOS_START].mean() * 1e4, 1))
