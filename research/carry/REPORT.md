# Kripto piyasa-nötr / carry araştırması — rapor
OOS = 2025-10-17..2026-10-16 (seçimde kullanılmadı). IS = 2021-01..2025-10-16. Net aylık geo, USDT.
Maliyet: perp %0.10, spot %0.15, gerçek fonlama, spot >1x için %8/yıl borç. Veri: data.binance.vision (896 perp, delist dahil), Hyperliquid (28 coin). 456 kombinasyon.

| strateji | seçim | IS aylık | OOS aylık | OOS maxDD | OOS en kötü ay |
|---|---|---|---|---|---|
| Cash & carry BTC/ETH | WF | %0.81 | +%0.06 | -0.9% | -0.5% |
| Yüksek fonlamalı perp short + spot long | WF | %0.57 | -%0.17 | -2.2% | -0.5% |
| Binance vs Hyperliquid fonlama farkı | sabit | %1.23 | -%0.33 | -4.2% | -4.2% |
| Pairs stat-arb | sabit | %0.26 | -%2.07 | -34% | -10% |
| Yüksek fonlama short vs BTC long | sabit | %4.00 | -%9.07 | -86% | -63% |
| Fonlama long/short perp | sabit | %3.34 | -%14.41 | -91% | -71% |

Kaldıraç her şeyi OOS'ta kötüleştirdi (ör. Binance-HL 10x: IS +%12.6/ay, OOS -%4.0/ay — overfitting örneği).
Kusursuz geriye bakış tavanı: OOS brüt fonlama %0.91/ay → %10/ay için >11x kaldıraç gerekir.
Sonuç: hedeflere ulaşılamadı; BTC/ETH fonlaması 2025-26'da yıllık ~%2-3'e düştü.
