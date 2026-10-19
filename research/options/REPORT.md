# BTC/ETH opsiyon primi satışı (Deribit) — rapor
Gerçek Deribit verisi: 2021-03..2026-10 her Cuma opsiyon mark fiyatları (~106k), gerçek smile/skew, resmi teslim fiyatları, DVOL.
Maliyet: prim %5 yarım spread, %0.03 opsiyon ücreti (prim %12.5 tavanlı), teslim ücreti, hedge %0.10. Vadeye kadar tutulur, vergi yok.
3.780 kombinasyon seçimde; ek 3.240 hassasiyet koşusu.

| # | Strateji (IS'te sabitlendi; haftalık, BTC+ETH 50/50, 30Δ, sadece DVOL > 365g medyan) | IS aylık | IS maxDD | OOS aylık USD | OOS aylık TRY | OOS maxDD |
|---|---|---|---|---|---|---|
| 1 | Short strangle 2x nominal | %4.24 | -40% | **%5.62** | %7.08 | -7.9% |
| 2 | Short strangle 3x | %5.91 | -57% | %8.40 | %9.90 | -11.9% |
| 3 | Short put 2x | %3.09 | -37% | %3.14 | %4.56 | -13% |
| ref | Strangle 4x (~Kelly, ÖNERİLMEZ) | %7.15 | -72% | %11.16 | %12.7 | -16% |
| ref | Strangle 2x filtresiz | -%2.77 | -82% | -%1.57 | | -47% |

Filtresiz prim satışı maliyet sonrası zararda. DVOL-rejim filtresi her yıl tutarlı fark yaratıyor (komşu parametreler de pozitif).
Uyarılar: OOS'ta sadece 23 aktif hafta; OOS > IS (şans payı); >2x'te hafta içi teminat çağrısı modellenmedi; beklenti IS ~%4/ay USD, -%40 düşüş olasılığı.
