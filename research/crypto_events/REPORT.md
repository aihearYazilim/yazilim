# Kripto olay kısaları (Binance perp) — rapor + bağımsız denetim özeti
Olaylar: token kilit açılımları (DefiLlama), Binance Monitoring Tag / spot delist / spot listeleme duyuruları; duyurudan sonraki saat açılışında kısa, zorunlu stop, BTC hedge. ~7.050 parametre.
Orijinal iddia (s=%20/işlem, 2x): IS %7.55 USD, OOS %11.03 USD / %12.47 TRY.

Denetim düzeltmeleri: likidite sınırı hatası (özsermaye ~56x büyürken sınır sabit kalmış), 1 dakikalık stop + giriş kayması.
| Senaryo | s | IS USD/TRY | OOS USD/TRY | OOS maxDD |
|---|---|---|---|---|
| Düzeltilmiş + gerçekçi yürütme (B) | 0.2 | 5.76 / 8.43 | 9.20 / 10.61 | -32% |
| B | 0.1 | 3.69 / 6.31 | 4.84 / 6.19 | -17% |
| B, giriş +15 dk | 0.2 / 0.1 | | 7.22 / 3.93 USD | |
| B, ilk 10 OOS işlemi çıkarılınca | 0.2 / 0.1 | | 5.09 / 2.01 USD | |

- OOS işlem kârının ~%90'ı Mart-Mayıs 2026 girişlerinden; o ayları çıkarınca ~+%0.6/ay. Haziran-Eylül 2026 düz/negatif.
- Gerçek olay etkisi var (tarih kaydırma plasebosu zararda; günlük kapanışta giriş OOS %0.74) ama ilk saatlerde ve bot gerektiriyor.
- Seçim kirliliği: olay çalışması OOS ortalamalarını grid'den önce yazdırmış; %20 boyut IS-en iyi değil.
- Türkiye: SPK III-35/B.2 lisanslı yerli platformlarda türev/açığa satışı yasaklıyor; yabancı platformlar gri alan (erişim engeli riski). DEL/MON kolları çoğunlukla yalnız Binance'te.
Hüküm: protokolün "sağlam ≥%10" çıtasını geçmiyor; en fazla ~%10'luk uydu pozisyon.
