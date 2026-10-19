# Combo v5: fon yok, halka arz yok — TL bazında özet
Boşta TL: 32 günlük vadeli mevduat (D32) ya da gecelik hesap; mevduat faizi basın verilerinden yeniden kuruldu; stopaj tarihçesi (%5 → %17.5).
VİOP teminatı TL nakit (mevduat teminat olamaz); nema = 0 ya da mevduat faizi. Deribit minimum kontrat dikkate alındı. ~36.000 simülasyon.
%10: 0/288 (tüm grid 0/16.896, max %6.18). %5.3: 15/288, hepsi Lmax 5 + nema = mevduat faizi.

| # | Portföy (TL taşıma+mevduat / Deribit / BIST-C) | OOS aylık 250k / 1M / 5M (nema var) | nema yok | +%10 / +%15 kur sıçraması (medyan kapanış DD) |
|---|---|---|---|---|
| 1 | Ters-vol, Lmax 5: 76 / 7 / 17 | 5.21 / 5.36 / 5.55 | 4.28 / 4.40 / 4.60 | -16.5% / -38% (12'nin 9'unda zorla kapatma) |
| 2 | IS max-Sharpe, Lmax 5 | 5.44 / 4.81 / 5.46 | 4.49 / 4.05 / 4.56 | -16…-19% / -35…-42% |
| 3 | Ters-vol, Lmax 3 (güvenli): 83 / 5 / 12 | 4.31 / 4.35 / 4.55 | 3.67 / 3.70 / 3.90 | -10.6% / -16%, zorla kapatma yok |
| ref | Sadece 32 gün mevduat | 2.63 | | 0 |
