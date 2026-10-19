# Kripto saatlik/4 saatlik strateji araştırması — rapor
OOS = 2025-10-17..2026-10-16. 19 likit coin, 1h ve 4h, 2020-01..2026-10. Maliyet %0.10 + %0.02-0.03 kayma, şort ve >1x için %10/yıl fonlama, tasfiye kontrolü.
1.934 baz kombinasyon x 4 kaldıraç = 7.736 varyant; 5.040 walk-forward seçim kuralı.

| # | Strateji (IS Sharpe ile seçildi) | IS aylık | OOS aylık | OOS maxDD |
|---|---|---|---|---|
| 1 | Vol-rejim trend, 4h, 19 coin long-only, top-5 ort., L=1 | %1.01 | +%0.51 | -10% |
| 2 | Aynı, 36 ay pencere, top-1, L=1 / L=3 | %1.27 / %3.20 | +%0.79 / +%2.15 | -10% / -26% |
| 3 | Momentum ailesi, L=1 | %2.72 | -%0.70 | -32% |

Önceden sabitlenen varsayılan kural: OOS -%2.05/ay. IS getirisi en yüksek kural: IS %5.04 → OOS -%5.14 (overfitting).
Kaldıraç medyan OOS'u kötüleştirdi (L1 -%1.4, L5 -%11.6). Sık işlem yapan her aile maliyet sonrası zarar etti.
Geriye bakışla bile en iyi varyant %9.4/ay (L=5, -%50+ DD). Hedeflere protokole uygun ulaşılamadı.
