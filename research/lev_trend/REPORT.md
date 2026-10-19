# Kaldıraçlı çok varlıklı trend / risk paritesi (TRY bazında) — Özet

- 2144 konfigürasyon (1072 ana + 1072 sonradan eklenen vol-tabanı; ikincisi kanıt sayılmaz), ~70 seçim yöntemi.
- OOS (2025-10-17..2026-10-16) aylık >=%10: **hiçbiri**. >=%5.3: sadece sonradan seçilmiş bir havuzdaki walk-forward varyantı (kanıt sayılmaz).

| # | Strateji | IS aylık | OOS aylık | OOS maxDD | OOS en kötü ay | Kaldıraç |
|---|---|---|---|---|---|---|
| A | WF, sadece Kelly havuzu, 36 ay pencere, Sharpe (havuz seçimi sonradan → geçersiz) | %8.59 | %8.19 | -58% | -25% | ~3.8x |
| B | Sabit, IS Sharpe'ı en iyi Kelly: tüm varlıklar, 252g, f=0.25, max 4x, USD baz | %6.95 | **%4.04** | -37% | -26% | 4x |
| C | Sabit, IS'in mutlak en iyisi: agresif evren Kelly, max 10x | %10.76 | %3.22 | -64% | -35% | 2.8–5.9x |

Kaldıraç artınca OOS sonuçları kötüleşti (trend ensemble 80% vol: IS %4.35 → OOS %-2.66).
Aylık %10 için gerekli Sharpe: ~1.3–1.5 (vol %130–150 ile); gerçekleşen OOS Sharpe trend ailesinde negatif.
Başarısızlık nedenleri: USDTRY vadeli taşıma maliyeti (risk paritesi buna aşırı ağırlık verdi), OOS'ta trend olmaması.
Detay: CSV ve kodlar bu klasörde.
