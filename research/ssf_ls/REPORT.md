# VİOP pay vadeli long/short BIST — rapor
2017-2026 VİOP bültenleri (2.402 gün, 64 dayanak), likiditeye göre kayma, roll maliyeti, %20 teminat, ~720 test.

| # | Strateji (IS'te seçildi) | IS aylık | OOS aylık (teminata mevduat faizi / faiz yok) | OOS maxDD | OOS en kötü ay |
|---|---|---|---|---|---|
| 1 | 52h zirve top/bottom 8, aylık, beta-nötr (XU030 hedge), 2x | %2.42 | %4.02 / %1.94 | -31% | -21.5% |
| 2 | c_all top/bottom 8, aylık, beta-nötr, 1x | %1.94 | %3.06 / %0.99 | -7.4% | -0.3% |
| 3 | Walk-forward L/S (12 ay Sharpe, 2x) | %2.07 | %4.04 (pencereye çok duyarlı) | -28% | -13% |

Getirinin çoğu teminat faizi; L/S alfa ~+1-2/ay ve IS'te -44…-64% düşüşler. Kapasite ~10M TL. BIST-C vadeli ile spot'tan kötü (%0.8-1.6).
Sonuç: hedeflere ulaşılamadı; TOP3 değişmez.
