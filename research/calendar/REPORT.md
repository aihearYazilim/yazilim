# BIST takvim / akış anomalileri — rapor
XU030 2010-2026 (IS 2010..2025-10-16), sepet testleri 2019+ bülten paneli. ~112 test, Bonferroni |t|>3.45.
- Tek Bonferroni'yi geçen etki: gece (kapanış→açılış) > gün içi (+15.8 bp/gün, t=13.3) — ama vadeli maliyetleri sonrası IS +%0.11/ay, OOS -%1.7/ay. Sadece uygulama ipucu: kapanışta al, açılışta sat.
- Ay dönümü (son 2 + ilk 4 gün): IS t≈2.3, PPF'ye +%0.6/ay; OOS ~0; deflated Sharpe olasılığı 0.07.
- TCMB, TÜFE, MSCI, vade, çeyrek sonu, bayram, Eylül-Ekim, temettü sezonu: anlamsız.

| # | Kural (IS'te sabit) | IS aylık | OOS aylık | OOS maxDD |
|---|---|---|---|---|
| 1 | Ay dönümü, Çarşamba ve TCMB sonrası hariç | %1.68 | %2.19 | -6% |
| 2 | Ay dönümü, düz | %1.62 | %2.19 | -6% |
| 3 | Walk-forward ay dönümü | %1.42 | %2.48 | -7% |
| ref | PPF | %1.04 | %2.25 | 0 |
Sonuç: hedeflere ulaşılamadı; eklenmeye değer bir zamanlama katmanı yok.
