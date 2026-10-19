# Türkiye altın piyasası sapmaları — rapor
Veri: VİOP bültenleri (XAUTRYM, XAUUSD, USDTRY, 2017-2026), BIST ALTIN.S1 (2022-11+), Yahoo GC=F. 201 kombinasyon.
- VİOP üçgeni (XAUTRYM vs XAUUSD×USDTRY): medyan sapma 9 bp, maliyet sonrası ~0.
- ALTIN.S1 primi OOS'ta +%78'e kadar çıktı ama sertifika fizikten yaratılamıyor ve açığa satılamıyor → yakalanamaz.
- Altın + kısa USDTRY taşıması: altın kur şoklarını hedge etmiyor (OOS %1.12, DD -24%).

| # | Strateji (IS'te seçildi) | IS aylık | OOS aylık | OOS maxDD |
|---|---|---|---|---|
| 1 | Banka gram altın + kısa VİOP XAUTRYM (sentetik TL mevduat) | 2.00 | 2.55 | -0.2% |
| 2 | ALTIN.S1 + kısa XAUTRYM, prim < 1.06'da gir | 4.40 | 2.14 (0 işlem) | 0 |
| 3 | VİOP üçgen yakınsaması | 0.91 | 2.00 | -0.4% |
Not: #1 bu raporun mevduat referansını (%2.14) geçiyor ama TOP3'teki 3 ay bono↔mevduat nakit kolunun (%2.86) altında kalıyor → nakit kolunu iyileştirmiyor.
Sonuç: hedeflere ulaşılamadı.
