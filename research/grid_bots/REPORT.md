# Kripto grid / DCA / rebalancing botları — rapor
1 dakikalık Binance verisi (2021-2026, 26 coin), muhafazakâr dolum modeli, gerçek fonlama ve tasfiye. ~30.030 seçim adayı.
OOS (ayı yılı: BTC -%24, ETH -%38) hindsight dağılımı (TRY/ay medyan): spot grid -1.6, rebalancing -0.2, vadeli grid -3.5 (%26 tasfiye), DCA -2.6 (%22 tasfiye).
"Grid kârı" yanılsaması: OOS'ta kombinasyonların %96'sı pozitif grid kârı gösterirken yalnızca %12'si toplamda kârda.

| # | Bot (IS'te seçildi) | IS USD/ay | OOS USD / TRY | OOS maxDD |
|---|---|---|---|---|
| 1 | ETH vadeli nötr grid 3x | 3.13 | 2.13 / 3.56 | -12% |
| 2 | ETH vadeli DCA 2x | 3.48 | 2.15 / 3.59 | -33% |
| 3 | DOGE spot DCA | 3.81 | 1.97 / 3.40 | -3% |
| kırılgan | XRP 3x vadeli DCA (IS #1) | 10.6 | 4.75 / 6.22 | -88% |

Walk-forward seçim kaldıraçlı kazananları seçip tasfiyeye götürüyor. Sonuç: hedeflere ulaşılamadı; TOP3'e eklenmez.
