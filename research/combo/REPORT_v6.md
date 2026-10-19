# Combo v6: tüm protokole uygun kollar — özet
Kollar: TL taşıma (R3, gerçek VİOP, bono↔mevduat nakit + DİBS teminat), Deribit korumalı strangle 2x, BIST-C, XU030 put spread (~1M TL kapasite), kripto olay kitabı (s=0.1, ≤%10). ~24.800 simülasyon.
%10: 0/10.296 (max %6.48, %100 taşıma L5). %5.3: yalnızca Lmax 5 + VİOP nakit teminatına nema ödenmesiyle, komşularda sağlam.

| # | Portföy (TL taşıma+nakit / Deribit / BIST-C / XU030 PS / Olay) | OOS aylık 1M / 5M / 10M (nema var) | nemasız | IS aylık | OOS maxDD | +%10 / +%15 kur (medyan MTM DD) |
|---|---|---|---|---|---|---|
| 1 | IV4, Lmax 5: 63/9/17/12/0 | 5.41 / 5.66 / 5.69 | 4.92 / 5.09 / 5.12 | 3.80-3.91 | -1.7% | -19% / -34% |
| 2 | IV5, Lmax 5: 57/8/15/11/10 | 5.49 / 5.65 / 5.70 | 5.06 / 5.22 / 5.26 | 3.94-4.07 | -2.1% | -17% / -30% |
| 3 | IV5, Lmax 3: 64/6/12/8/10 | 4.67 / 4.92 / 4.95 | 4.33 / 4.59 / 4.61 | 3.67-3.76 | -1.5% | -18% / -27% (zorla kapatma yok) |

OOS'ta 13 ayın hiçbiri negatif değil. IS içi 12 aylık pencerelerin medyanı ~%3.6-3.7/ay → son 12 ay iyi bir yıl. Gerçekçi beklenti ~%3.5-4.5/ay.
