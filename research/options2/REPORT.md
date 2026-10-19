# Kripto opsiyon stratejisini geliştirme — rapor
Gerçek Deribit verisi: 4.050 günlük snapshot, 628k mark (2021-04..2026-10), saatlik MTM, standart/portföy teminatı, ölçülmüş spread. 446 konfigürasyon.

Bulgular: tek gerçek iyileştirme aylık 10Δ koruma putu (maliyet ~0.5-1 puan/ay, Mayıs-2021 hafta içi düşüşünü -75% → -40/-50%). Aynı vade kanatları, günlük/2 haftalık vade, ek rejim filtreleri, SOL/XRP, saatlik delta hedge: başarısız.

| # | Varyant (IS'te seçildi) | IS aylık | IS hafta içi maxDD | OOS USD/ay | OOS TRY/ay | OOS maxDD |
|---|---|---|---|---|---|---|
| 1 | 40Δ strangle + aylık 10Δ put, 2x, standart teminat | %3.92 | -49.6% | %5.85 | %7.34 | -19% |
| 2 | 35Δ + 10Δ put, 3x, portföy teminatı | %5.08 | -59.6% | %7.98 | %9.50 | -25% |
| 3 | 30Δ + 10Δ put, 2x, portföy teminatı | %3.26 | -40.0% | %4.69 | %6.16 | -14% |
| ref | Korumasız 30Δ 2x (eski #1) | %3.34 | -72.3% | %5.64 | %7.13 | -16% |

IS içi 12 aylık pencereler (daha gerçekçi): #1 medyan %3.75/ay, yılların %10'u negatif; #2 medyan %4.6/ay.
