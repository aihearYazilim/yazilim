# Combo v3: Halka arz + Deribit opsiyon (denetlenmiş) + BIST-C — TL bazında özet
3.312 simülasyon. OOS %10: hiçbiri (hindsight grid dahil, en iyi %8.71). OOS %5.3: 72'den 12'si, hepsi 100k TL'nin 2-4 hesaba bölündüğü hücreler; sağlam (komşu ağırlıklar da geçen) 3 tane, hepsi 100k/4.

| # | Portföy (Arz/Opsiyon/C) | OOS aylık 100k/1 · 100k/4 · 1M/1 · 5M/1 | OOS MTM maxDD | Mayıs-2021 stresi |
|---|---|---|---|---|
| 1 | Eşit 1/3, opsiyon 2x | 5.17 · 7.81 · 3.93 · 3.81 | -4.3…-6.4% | -24% |
| 2 | Eşit 1/3, opsiyon 1x | 4.39 · 7.15 · 3.09 · 2.96 | -2.1…-4.1% | -12% |
| 3 | Ters-vol, opsiyon 2x | 4.42 · 7.53 · 2.77 · 2.62 | -0.4…-2.0% | -2…-11% |

Deribit min. kontrat (0.1 BTC, 1 ETH) nedeniyle opsiyon kolu ~0.4-0.8M TL gerektirir → 100k hücreleri bu haliyle kurulamaz; kurulabilir ölçekte (≥1-2M TL) OOS ~%3.9/ay.
Vergi varsayımı: opsiyon kolu yıllık pozitif TL kârın %20'si.
