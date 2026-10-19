# Volatil çiftlerde likidite sağlama / AMM piyasa yapıcılığı — rapor
Gerçek zincir üstü saatlik havuz durumu (9 havuz: Ethereum, Arbitrum, Base, BSC; feeGrowthGlobal ile kesin ücret geliri), gerçek gas, fonlama. ~3.470 kombinasyon.
Yapısal bulgu: tüm havuzlarda LP ücret geliri ≈ kalıcı olmayan kayıp/LVR (oran 0.8-1.08); hedge sonrası kalan çoğunlukla fonlama taşıması.

| # | Strateji (IS'te seçildi) | IS USD/ay | OOS USD/ay | OOS TRY/ay | OOS maxDD |
|---|---|---|---|---|---|
| 1 | WBTC/ETH 0.3% ±50%, delta hedge'li | +0.48 | +0.11 | 1.51 | -0.24% |
| 2 | WBTC/ETH 0.05% ±50%, hedge'li | +0.39 | +0.09 | 1.49 | -0.41% |
| 3 | Arbitrum WETH/USDC ±50%, hedge'li | +0.36 | -0.26 | 1.14 | -3.7% |
| IS en iyi hedge'siz | Arbitrum ±20% | +2.87 | -0.89 | 0.49 | -32% |

Sonuç: hedeflere ulaşılamadı; TL mevduatın (%2.63) altında. Yön bırakıldı.
