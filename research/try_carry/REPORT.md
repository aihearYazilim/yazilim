# Risk yönetimli kaldıraçlı TL taşıma (PPF + VİOP USDTRY kısa) — rapor özeti
2005-2026 veri, ~14.900 kombinasyon, gün içi high ile MTM, %7.5 bakım teminatı, %10 stopaj.

| # | Kural (IS'te seçildi) | IS aylık | IS maxDD | OOS aylık (13 kova/12 ay) | OOS maxDD | Ort. kaldıraç OOS |
|---|---|---|---|---|---|---|
| 1 | R3: vol hedefi %30, max 8x, reel faiz > %5 | %1.83 | -22% | %8.94 / %9.72 | -2.3% | 5.44 |
| 2 | R6: vol %30 (60g), max 8x, trend + faiz düşmemiş | %1.17 | -63% | %5.85 / %6.35 | -2.6% | 4.02 |
| 3 | R2: sabit 5x, trend + faiz 6 ayda düşmemiş | %2.07 | -45% | %3.54 / %3.84 | -1.6% | 1.41 |
| ref | Koşulsuz 8x | iflas | -100% | %10.54 | | |
| ref | PPF | %1.06 | 0 | %2.25 | 0 | |

R3 hassasiyet: reel eşik %4 → IS maxDD -41%; %6 → OOS %6.84; max 5x → OOS %6.42. Walk-forward zincirleri IS'te PPF'yi geçemedi.
Asıl risk sıçrama: 8x'te +%4.7 kur sıçraması zorla kapatma; Mart-2025 tipi şok ≈ -%91.
