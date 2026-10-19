# BIST olay-güdümlü stratejiler (bedelsiz + geri alım) — rapor
Veri: KAP API (462 bedelsiz epizodu, 711 geri alım olayı, delist/iptal dahil), İş Yatırım + Yahoo fiyatları. 384 kombinasyon.
Maliyet %0.14 + %0.10 kayma, VWAP giriş/çıkış, tavan/taban kilidi, likidite sınırı, boşta para PPF.

| # | Kural (IS'te seçildi) | IS aylık | IS maxDD | OOS aylık | OOS maxDD |
|---|---|---|---|---|---|
| 1 | Bedelsiz ilk duyuruda al (XU100>SMA50), SPK onayı+1 gün sat, K=5, %15 stop | %4.22 | -46% | %0.95 | -10% |
| 2 | Geri alım başlangıcında al, 60 gün tut, K=10, %15 stop | %4.36 | -34% | %1.22 | -13% |
| 3 | SPK onayında al, bölünme günü sat, K=10 | %3.07 | -13% | %0.94 | -9% |
| ref | PPF | %1.64 | 0 | %2.25 | 0 |
| ref | XU100 | %3.18 | -32% | %1.07 | -22.5% |

Olay çalışması: "bedelsiz rallisi" sağa çarpık piyango; IS medyan fazla getiri -%2.2, OOS -%19.2. IS ve OOS sıralaması ilişkisiz (korelasyon 0.03).
Sonuç: hedefler karşılanmadı; hiçbir IS-seçimli kural OOS'ta PPF'yi geçemedi.
