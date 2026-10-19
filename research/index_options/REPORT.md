# Endeks opsiyonu prim satışı (SPX/NDX) — rapor
IS 2000-2025-10-16, OOS son 12 ay. Cboe PUT/WPUT/BXN endeksleriyle kalibre edilmiş BS modeli, gün içi MTM ve Reg-T/PM teminat. ~4.300 kombinasyon.
Kripto'daki "IV yüksekken sat" avantajı endekslerde TERS çalışıyor (krizler yüksek VIX'te kümeleniyor): VIX>medyan filtresi hücrelerin %89'unda IS'i kötüleştirdi.

| # | Strateji (IS'te seçildi) | IS aylık USD | IS maxDD | OOS aylık USD | OOS aylık TRY | OOS maxDD |
|---|---|---|---|---|---|---|
| 1 | NDX haftalık 10Δ short put, 3x | %1.11 | -32% | %0.97 | %2.39 | -7.6% |
| 2 | SPX aylık ATM put-write, VIX9D/VIX<1 ve SPX>SMA200, 3x | %1.02 | -34% | %2.65 | %4.09 | -15% |
| 3 | NDX haftalık 20Δ short put, 2x | %0.96 | -31% | %0.65 | %2.07 | -9.6% |
| ref | Kripto analoğu SPX strangle VIX>medyan 2x | -%0.60 | -91% | %0.89 | %2.31 | -10% |
| ref | TRY PPF | | | | %2.45 | 0 |

Sonuç: hedeflere ulaşılamadı; beklenti ~%0.6-1.1/ay USD, -30…-45% düşüş. Ölçeklenebilir ama avantaj küçük. TOP3 değişmez.
