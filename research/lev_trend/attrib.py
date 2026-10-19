"""Sağlama: seçili konfigürasyonların OOS varlık bazında katkısı ve ortalama kaldıraç."""
import sys, numpy as np, pandas as pd, itertools
import common as cm, lt_strategies as st
U = cm.load(); pre = st.Pre(U)
O0, O1 = cm.OOS_START, cm.OOS_END
def show(label, W):
    Wl = W.shift(1).loc[O0:O1]
    contrib = (Wl * U["X"][W.columns].loc[O0:O1].fillna(0)).sum()
    print(f"\n{label}: ort. brüt kaldıraç OOS={Wl.abs().sum(axis=1).mean():.2f}  IS={W.loc['2018':cm.IS_END].abs().sum(axis=1).mean():.2f}")
    print("  OOS basit katkı (% NAV, cash hariç):", (contrib * 100).round(1).to_dict())
    print("  OOS ortalama ağırlık:", Wl.mean().round(2).to_dict())
show("RP|ALL|none|T=0.2|Lmax=4", pre.scale_to_vol(st.riskparity(pre, st.UNIV["ALL"], "none"), 0.2, 4))
show("TSMOM|ALL|L=252|long|T=0.2|Lmax=4", pre.scale_to_vol(st.tsmom(pre, st.UNIV["ALL"], 252, True), 0.2, 4))
show("TSMOM|ALL|L=ens|ls|T=0.4|Lmax=10", pre.scale_to_vol(st.tsmom(pre, st.UNIV["ALL"], "ens", False), 0.4, 10))
show("KELLY|VIOP|L=126|f=0.25|Lmax=10", st.kelly(pre, st.UNIV["VIOP"], 126, 0.25, 10))
print("\nOOS varlık fazla getirisi (TL, toplam %, 1x):", ((1+U["X"].loc[O0:O1]).prod()-1).mul(100).round(1).to_dict())
print("OOS varlık oynaklığı (yıllık %):", (U["X"].loc[O0:O1].std()*np.sqrt(260)*100).round(0).to_dict())
