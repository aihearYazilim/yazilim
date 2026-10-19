# Combo v4: teminat istifleme (PPF → halka arz teminatı + VİOP USDTRY kısa taşıma) — özet
42.912 simülasyon (960 IS'te seçilebilir), gerçek VİOP vadeli fiyatları, Takasbank teminat kuralları (%11 başlangıç, %8.25 bakım, %50 nakit kuralı, fon payı kesintisi %10/%20).
%10: 960'tan 4'ü (aynı konfig: P1, 100k/4, 5x, nakit teminata faiz) %10.18 — komşular %9.5-9.9 → sağlam değil. %5.3: 550 geçti, 410 sağlam.

| # | Portföy (IS'te sabit) | OOS 3x (100k/1·100k/4·1M·5M) | OOS 5x | +%10/+%15 kur sıçraması kapanış DD (100k/4 · 1M), 3x |
|---|---|---|---|---|
| 1 | P1: tamamı PPF + halka arz teminatı + istiflenmiş VİOP USDTRY kısa (R3) | 5.75 · 8.72 · 4.60 · 4.50 | 6.98 · 9.73 · 5.91 · 5.81 | -29%/-43% · -13%/-19% |
| 2 | SH4: IS max-Sharpe (~%70-80 arz, %10 Deribit 2x, %10-20 BIST-C) + taşıma | 5.76 · 8.51 · 4.45 · 4.34 | 6.76 · 8.97 · 5.37 · 5.28 | -19%/-29% · -11%/-17% |
| 3 | v3 eşit 1/3 + arz kısmına istiflenmiş taşıma | 5.75 · 7.81 · 4.60 · 4.50 | 6.10 · 8.09 · 5.06 · 4.95 | -12%/-19% · -10%/-13% |

Not: IS penceresinde (2022-2025) taşıma filtresi yalnızca ~6 ay açıktı → taşıma kolunun IS kanıtı zayıf; R3 seçiminde şans payı var.
