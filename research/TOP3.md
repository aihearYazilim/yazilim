# En iyi 3 strateji — kullanıcı kısıtlarıyla (fon yok, halka arz yok)
OOS = son 12 ay 2025-10-17..2026-10-16, net TL, ağırlıklar yalnızca öncesi veriyle seçildi (Combo v6). Referans: 3 ay bono↔mevduat %2.86/ay.
Kollar: TL taşıma (VİOP USDTRY kısa, vol hedefi %30, yalnızca reel faiz > %5; serbest nakit 3 ay bono↔32 gün mevduat, VİOP teminatının ≤%50'si DİBS) / Deribit BTC+ETH 40Δ strangle + 10Δ koruma putu 2x (DVOL > 365g medyan) / BIST-C / XU030 20Δ-5Δ put spread 5x (IV > 252g medyan) / kripto olay kısaları (s=0.1).

| # | Ağırlıklar (Taşıma / Deribit / BIST-C / XU030 / Olay) | Son 12 ay aylık 1M / 5M / 10M (VİOP nema var) | Nemasız | Gerçekçi beklenti | Risk |
|---|---|---|---|---|---|
| 1 | **Lmax 5: 63 / 9 / 17 / 12 / 0** (yasal gri alan yok) | **5.41 / 5.66 / 5.69** | 4.92 / 5.09 / 5.12 | ~%3.5-4.5 | OOS maxDD -1.7%, zarar eden ay yok; +%10 kur -19%, +%15 -34% (zorla kapatma) |
| 2 | **Lmax 5: 57 / 8 / 15 / 11 / 10** (olay kitabı Türkiye'de gri alan) | **5.49 / 5.65 / 5.70** | 5.06 / 5.22 / 5.26 | ~%3.5-4.5 | +%10 kur -17%, +%15 -30% |
| 3 | **Lmax 3 (güvenli): 64 / 6 / 12 / 8 / 10** | **4.67 / 4.92 / 4.95** | 4.33 / 4.59 / 4.61 | ~%3.3-4 | +%15 kur kapanışta -13%, zorla kapatma yok |

Aylık %10 net: protokole uygun hiçbir kombinasyonda bulunamadı (~180.000 test, 33 yön).
