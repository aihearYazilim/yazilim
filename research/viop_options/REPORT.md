# VİOP opsiyon prim satışı (XU030 ve USDTRY) — rapor
2.403 tam VİOP bülteni (2017-2026), 7.78M satır; Black-76 ile IV, ölçülmüş spread (%10 baz), Takasbank tarzı teminat, %10 stopaj. 4.230 + ~450 test.

| # | Strateji (IS'te sabit) | IS aylık | IS maxDD | OOS aylık (giriş günü 1 / 1-10 ort.) | OOS maxDD | Kapasite |
|---|---|---|---|---|---|---|
| 1 | XU030 20Δ/5Δ put spread, 5x, IV > 252g medyan, vadeye kadar | %2.10 | -31% | %5.60 / %4.15 | -11% | ~1M TL |
| 2 | USDTRY kısa vadeli 5x + uzun 5Δ call, reel faiz > %5 | %2.14 | -42% | %5.29 / %4.85 | -1.4% | >10M TL |
| 3 | XU030 15Δ short put, 5x, IV > RV | %2.32 | -27% | %5.58 / %1.57 | -9…-41% | ~1M TL |
| ref | Gecelik mevduat | %1.57 | 0 | %2.25 | 0 | |

USDTRY call satışı taşıma için hedge değil (daha kötü taşıma). 5Δ call koruması ayda 1-1.5 puan maliyetle sıçrama kaybını kısmen sınırlıyor (+%10: -50% → -33…-41%).
Sonuç: %10 yok; %5.3 yalnızca giriş gününe bağlı tekil koşularda. TOP3 değişmez.
