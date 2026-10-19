# Kombine portföy v2: Halka arz (A) + BIST kolu "C" (bist_all) ve C/KELLY karışımı — Rapor

Protokol: `research/PROTOCOL.md`. IS = 2022-01-01..2025-10-16, OOS = 2025-10-17..2026-10-16, her pencere sıfırdan.
Simülatör, arz kuralı, maliyetler, vergi ve teminat modelleri v1 ile aynı (`REPORT.md`, `combo.py`); sadece kol değişti.

## Kısa sonuç
* **%10/ay OOS: 0/72** (lag1 36 + lag0 36, sell modu; pledge duyarlılığı dahil 0/144).
* **%5.3/ay OOS (birincil lag1): 7/36**, hepsi 100k/2–4 hesap ve MIX_IV 250k/4 (hesap başı 25k–62.5k TL); 7'si IS'te de ≥%5.3.
  **Tek hesapta ve 500k/1M toplam sermayede hiçbiri.** lag0'da 9/36.
* C kolu v1 BIST momentum/KELLY kollarına göre **çok daha düşük risk** (OOS maxDD -4..-8% vs -20..-36%), getiri benzer
  ya da biraz düşük: 1M/1 OOS arz+C(lag1) %2.83, arz+MIX_IV %3.19 vs v1 arz+PPF %2.61, arz+BIST-mom %2.82, arz+KELLY %3.43.
* C(lag1) arzsız OOS %2.67 ≈ PPF %2.45 (+0.2 puan). Gecikme etkisi büyük: lag0 %3.55 → lag1 %2.67 (OOS), IS'te fark yok.

## İlk 3 (seçim: 12 hücrenin IS ortalaması, lag1, OOS'a bakmadan) — sell modu, net TL

| # | Kombinasyon | IS aylık (100k/1 · 100k/4 · 1M/1) | **OOS aylık** (100k/1 · 100k/4 · 1M/1) | **OOS maxDD** (100k/1 · 100k/4 · 1M/1) | OOS en kötü ay | lag0 OOS (aynı hücreler) |
|---|---|---|---|---|---|---|
| 1 | Arz + MIX_IV (75.3% C / 24.7% KELLY, ters-oynaklık) | 6.27 · 6.88 · 6.01 | **4.66 · 7.94 · 3.19** | -6.3 · -5.0 · -7.4 | -1.8 · -1.6 · -3.6 | 5.27 · 8.41 · 3.86 |
| 2 | Arz + MIX_SH (85% C / 15% KELLY, IS max-Sharpe) | 6.06 · 6.67 · 5.74 | **4.49 · 7.75 · 3.07** | -4.5 · -3.9 · -6.9 | -0.7 · -0.6 · -3.0 | 5.23 · 8.35 · 3.84 |
| 3 | Arz + C (lag1) | 5.69 · 6.32 · 5.30 | **4.18 · 7.43 · 2.83** | -6.0 · -4.4 · -7.6 | -1.1 · +0.9 · -5.0 | 4.98 · 8.04 · 3.71 |
| ref v1 | Arz + PPF (fon teminatı) | 3.10 · 4.44 · 2.14 | 3.99 · 7.40 · 2.61 | -0.4 · -1.1 · 0.0 | +1.3 | |

Karışım ağırlıkları yalnızca IS günlük getirileriyle seçildi (lag başına ayrı): lag1 ters-oynaklık w_C=0.753, IS max-Sharpe
w_C=0.85 (Sharpe eğrisi 0.75–0.90 arasında düz → komşular sağlam; `results/mix_weight_IS_grid_v2.csv`); lag0: 0.750 / 0.80.

**Uyarılar:** (1) KELLY bileşeni küçük hesaplarda kontrat büyüklüğü nedeniyle uygulanamaz (v1 notu; burada payı %15–25,
hesap başı 25k TL'de 4–6k TL'lik 4x kaldıraçlı 13 varlıklı sepet → gerçekte yok). Tamamen uygulanabilir olan #3 (Arz + C).
(2) C kolu 617 hisselik bugünkü BIST evreninden (hayatta kalma yanlılığı) ve tek sabit konfigürasyondur; bist_all'da ~3.866
kombinasyondan biri. (3) Sell modunda küçük hesapta özsermayenin ~%11–28'i talep dönemlerinde PPF'de bekler.

## Değişiklikler / mutabakat
* Kol C = `bist_all/common.simulate(P, signals.build(P)['c_all'], top=20, rebalance=21, regime=regimes(P)['ew20'], lag)`
  aynen. Orijinal (düzeltmesiz) çıktı rapordakiyle birebir: lag0 OOS %2.92 / maxDD -7.3, lag1 %2.07 / -8.3 (engine.stats).
* Düzeltme: bist_all motoru nakdi işlem günü başına 1/365 faizlendiriyordu (PPF OOS %1.54 görünmesinin nedeni). Takvim
  günü bileşik faizle: lag0 OOS %3.28, lag1 %2.45 (engine.stats; bu raporun gün-bazlı ay sayımıyla %3.55 / %2.67).
  C kolu rejim kapalıyken çoğunlukla nakitte olduğu için bu düzeltme önemli; v1 ile tutarlılık için zorunlu.
* Kol giriş/çıkış maliyeti %0.14 (BIST). Vergi: BIST pay %0 stopaj; KELLY tau=%20 yıllık; PPF politika×0.9.
* Kombinasyon sayısı (v2): 2 lag × 3 kol × 12 hücre × 2 mod (sell birincil, pledge duyarlılık) = 144 + 6 arzsız referans
  = 150 simülasyon; + 2×21 karışım ağırlık adayı. v1 ile birlikte 446 simülasyon.

## Tüm tablolar

#### Arzsız kollar (net, takvim-günü faiz düzeltmeli)

| lag | sleeve | geo_IS | geo_OOS | maxdd_IS | maxdd_OOS | worst_m_OOS |
|---|---|---|---|---|---|---|
| C_L0 | C | 5.14 | 3.55 | -13.6 | -7.04 | -4.17 |
| C_L0 | MIX_IV | 5.89 | 3.69 | -14.2 | -6.61 | -3.51 |
| C_L0 | MIX_SH | 5.75 | 3.68 | -13.41 | -6.2 | -2.05 |
| C_L1 | C | 5.25 | 2.67 | -14.9 | -8.01 | -5.45 |
| C_L1 | MIX_IV | 5.97 | 3.01 | -15.35 | -7.83 | -3.88 |
| C_L1 | MIX_SH | 5.71 | 2.89 | -15.05 | -7.25 | -3.52 |

#### [main] IS aylık geo %

| lag | sleeve | 100k/1 | 100k/2 | 100k/4 | 250k/1 | 250k/2 | 250k/4 | 500k/1 | 500k/2 | 500k/4 | 1000k/1 | 1000k/2 | 1000k/4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C_L0 | C | 5.67 | 6.15 | 6.36 | 5.37 | 5.58 | 5.96 | 5.25 | 5.37 | 5.58 | 5.2 | 5.25 | 5.37 |
| C_L0 | MIX_IV | 6.26 | 6.69 | 6.91 | 6.04 | 6.19 | 6.5 | 5.97 | 6.04 | 6.19 | 5.93 | 5.97 | 6.04 |
| C_L0 | MIX_SH | 6.15 | 6.59 | 6.81 | 5.92 | 6.08 | 6.4 | 5.84 | 5.92 | 6.08 | 5.79 | 5.84 | 5.92 |
| C_L1 | C | 5.69 | 6.1 | 6.32 | 5.43 | 5.61 | 5.93 | 5.34 | 5.43 | 5.61 | 5.3 | 5.34 | 5.43 |
| C_L1 | MIX_IV | 6.27 | 6.66 | 6.88 | 6.1 | 6.22 | 6.47 | 6.04 | 6.1 | 6.22 | 6.01 | 6.04 | 6.1 |
| C_L1 | MIX_SH | 6.06 | 6.45 | 6.67 | 5.85 | 5.99 | 6.27 | 5.78 | 5.85 | 5.99 | 5.74 | 5.78 | 5.85 |

#### [main] OOS aylık geo %

| lag | sleeve | 100k/1 | 100k/2 | 100k/4 | 250k/1 | 250k/2 | 250k/4 | 500k/1 | 500k/2 | 500k/4 | 1000k/1 | 1000k/2 | 1000k/4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C_L0 | C | 4.98 | 6.1 | 8.04 | 4.15 | 4.71 | 5.67 | 3.86 | 4.15 | 4.71 | 3.71 | 3.86 | 4.15 |
| C_L0 | MIX_IV | 5.27 | 6.45 | 8.41 | 4.36 | 4.98 | 6.01 | 4.03 | 4.36 | 4.98 | 3.86 | 4.03 | 4.36 |
| C_L0 | MIX_SH | 5.23 | 6.39 | 8.35 | 4.33 | 4.94 | 5.95 | 4.01 | 4.33 | 4.94 | 3.84 | 4.01 | 4.33 |
| C_L1 | C | 4.18 | 5.39 | 7.43 | 3.3 | 3.9 | 4.93 | 2.99 | 3.3 | 3.9 | 2.83 | 2.99 | 3.3 |
| C_L1 | MIX_IV | 4.66 | 5.9 | 7.94 | 3.71 | 4.35 | 5.43 | 3.37 | 3.71 | 4.35 | 3.19 | 3.37 | 3.71 |
| C_L1 | MIX_SH | 4.49 | 5.72 | 7.75 | 3.56 | 4.19 | 5.25 | 3.23 | 3.56 | 4.19 | 3.07 | 3.23 | 3.56 |

#### [main] OOS maxDD %

| lag | sleeve | 100k/1 | 100k/2 | 100k/4 | 250k/1 | 250k/2 | 250k/4 | 500k/1 | 500k/2 | 500k/4 | 1000k/1 | 1000k/2 | 1000k/4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C_L0 | C | -3.9 | -3.4 | -3.04 | -5.3 | -3.98 | -3.6 | -6.17 | -5.3 | -3.98 | -6.6 | -6.17 | -5.3 |
| C_L0 | MIX_IV | -6.32 | -6.26 | -6.22 | -6.38 | -6.34 | -6.29 | -6.4 | -6.38 | -6.34 | -6.41 | -6.4 | -6.38 |
| C_L0 | MIX_SH | -5.05 | -5.0 | -4.96 | -5.12 | -5.06 | -5.02 | -5.19 | -5.12 | -5.06 | -5.69 | -5.19 | -5.12 |
| C_L1 | C | -5.98 | -5.44 | -4.4 | -6.62 | -6.07 | -5.66 | -7.24 | -6.62 | -6.07 | -7.63 | -7.24 | -6.62 |
| C_L1 | MIX_IV | -6.3 | -5.78 | -5.02 | -6.67 | -6.42 | -5.98 | -6.86 | -6.67 | -6.42 | -7.35 | -6.86 | -6.67 |
| C_L1 | MIX_SH | -4.54 | -4.28 | -3.91 | -5.63 | -4.6 | -4.38 | -6.44 | -5.63 | -4.6 | -6.85 | -6.44 | -5.63 |

#### [main] OOS en kötü ay %

| lag | sleeve | 100k/1 | 100k/2 | 100k/4 | 250k/1 | 250k/2 | 250k/4 | 500k/1 | 500k/2 | 500k/4 | 1000k/1 | 1000k/2 | 1000k/4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C_L0 | C | 0.71 | 1.05 | 0.83 | -2.23 | -0.27 | 1.06 | -3.2 | -2.23 | -0.27 | -3.69 | -3.2 | -2.23 |
| C_L0 | MIX_IV | -1.58 | -1.5 | -1.43 | -2.36 | -1.6 | -1.53 | -2.93 | -2.36 | -1.6 | -3.22 | -2.93 | -2.36 |
| C_L0 | MIX_SH | -1.04 | -0.97 | -0.92 | -1.09 | -1.05 | -1.0 | -1.47 | -1.09 | -1.05 | -1.76 | -1.47 | -1.09 |
| C_L1 | C | -1.1 | 0.3 | 0.9 | -3.71 | -1.97 | 0.15 | -4.58 | -3.71 | -1.97 | -5.02 | -4.58 | -3.71 |
| C_L1 | MIX_IV | -1.77 | -1.68 | -1.61 | -2.69 | -1.79 | -1.71 | -3.27 | -2.69 | -1.79 | -3.57 | -3.27 | -2.69 |
| C_L1 | MIX_SH | -0.7 | -0.64 | -0.6 | -1.32 | -0.72 | -0.67 | -2.42 | -1.32 | -0.72 | -2.97 | -2.42 | -1.32 |

#### [sens_pledge] IS aylık geo %

| lag | sleeve | 100k/1 | 100k/2 | 100k/4 | 250k/1 | 250k/2 | 250k/4 | 500k/1 | 500k/2 | 500k/4 | 1000k/1 | 1000k/2 | 1000k/4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C_L0 | C | 5.86 | 6.41 | 6.67 | 5.45 | 5.73 | 6.21 | 5.3 | 5.45 | 5.73 | 5.22 | 5.3 | 5.45 |
| C_L0 | MIX_IV | 6.59 | 7.13 | 7.36 | 6.19 | 6.46 | 6.93 | 6.05 | 6.19 | 6.46 | 5.97 | 6.05 | 6.19 |
| C_L0 | MIX_SH | 6.45 | 7.0 | 7.23 | 6.06 | 6.33 | 6.79 | 5.91 | 6.06 | 6.33 | 5.83 | 5.91 | 6.06 |
| C_L1 | C | 5.93 | 6.46 | 6.71 | 5.54 | 5.81 | 6.26 | 5.4 | 5.54 | 5.81 | 5.33 | 5.4 | 5.54 |
| C_L1 | MIX_IV | 6.64 | 7.16 | 7.39 | 6.26 | 6.52 | 6.97 | 6.12 | 6.26 | 6.52 | 6.05 | 6.12 | 6.26 |
| C_L1 | MIX_SH | 6.38 | 6.9 | 7.13 | 6.0 | 6.26 | 6.7 | 5.86 | 6.0 | 6.26 | 5.78 | 5.86 | 6.0 |

#### [sens_pledge] OOS aylık geo %

| lag | sleeve | 100k/1 | 100k/2 | 100k/4 | 250k/1 | 250k/2 | 250k/4 | 500k/1 | 500k/2 | 500k/4 | 1000k/1 | 1000k/2 | 1000k/4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C_L0 | C | 5.01 | 6.28 | 8.28 | 4.17 | 4.74 | 5.79 | 3.86 | 4.17 | 4.74 | 3.71 | 3.86 | 4.17 |
| C_L0 | MIX_IV | 5.1 | 6.33 | 8.29 | 4.28 | 4.84 | 5.86 | 3.99 | 4.28 | 4.84 | 3.84 | 3.99 | 4.28 |
| C_L0 | MIX_SH | 5.1 | 6.33 | 8.3 | 4.27 | 4.83 | 5.86 | 3.98 | 4.27 | 4.83 | 3.83 | 3.98 | 4.27 |
| C_L1 | C | 4.19 | 5.5 | 7.57 | 3.3 | 3.9 | 5.0 | 2.99 | 3.3 | 3.9 | 2.83 | 2.99 | 3.3 |
| C_L1 | MIX_IV | 4.47 | 5.74 | 7.74 | 3.62 | 4.2 | 5.25 | 3.32 | 3.62 | 4.2 | 3.17 | 3.32 | 3.62 |
| C_L1 | MIX_SH | 4.37 | 5.66 | 7.68 | 3.51 | 4.1 | 5.16 | 3.21 | 3.51 | 4.1 | 3.05 | 3.21 | 3.51 |

#### [sens_pledge] OOS maxDD %

| lag | sleeve | 100k/1 | 100k/2 | 100k/4 | 250k/1 | 250k/2 | 250k/4 | 500k/1 | 500k/2 | 500k/4 | 1000k/1 | 1000k/2 | 1000k/4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C_L0 | C | -5.18 | -4.03 | -3.41 | -6.16 | -5.44 | -4.44 | -6.6 | -6.16 | -5.44 | -6.82 | -6.6 | -6.16 |
| C_L0 | MIX_IV | -6.42 | -6.42 | -6.42 | -6.42 | -6.42 | -6.42 | -6.42 | -6.42 | -6.42 | -6.42 | -6.42 | -6.42 |
| C_L0 | MIX_SH | -5.26 | -5.26 | -5.26 | -5.66 | -5.26 | -5.26 | -5.88 | -5.66 | -5.26 | -6.03 | -5.88 | -5.66 |
| C_L1 | C | -6.59 | -5.52 | -4.34 | -7.27 | -6.81 | -5.95 | -7.57 | -7.27 | -6.81 | -7.79 | -7.57 | -7.27 |
| C_L1 | MIX_IV | -6.78 | -6.52 | -6.19 | -7.12 | -6.83 | -6.62 | -7.48 | -7.12 | -6.83 | -7.66 | -7.48 | -7.12 |
| C_L1 | MIX_SH | -5.88 | -4.88 | -4.88 | -6.7 | -6.15 | -5.06 | -6.98 | -6.7 | -6.15 | -7.11 | -6.98 | -6.7 |

#### [sens_pledge] OOS en kötü ay %

| lag | sleeve | 100k/1 | 100k/2 | 100k/4 | 250k/1 | 250k/2 | 250k/4 | 500k/1 | 500k/2 | 500k/4 | 1000k/1 | 1000k/2 | 1000k/4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C_L0 | C | -1.54 | 0.91 | 1.24 | -3.12 | -2.07 | 0.03 | -3.64 | -3.12 | -2.07 | -3.91 | -3.64 | -3.12 |
| C_L0 | MIX_IV | -1.51 | -1.38 | -1.19 | -2.54 | -1.63 | -1.42 | -3.02 | -2.54 | -1.63 | -3.27 | -3.02 | -2.54 |
| C_L0 | MIX_SH | -0.98 | -0.87 | -0.72 | -1.06 | -1.01 | -0.91 | -1.55 | -1.06 | -1.01 | -1.79 | -1.55 | -1.06 |
| C_L1 | C | -2.78 | -0.12 | 0.22 | -4.38 | -3.31 | -1.18 | -4.92 | -4.38 | -3.31 | -5.18 | -4.92 | -4.38 |
| C_L1 | MIX_IV | -1.7 | -1.56 | -1.35 | -2.88 | -1.94 | -1.61 | -3.37 | -2.88 | -1.94 | -3.62 | -3.37 | -2.88 |
| C_L1 | MIX_SH | -0.83 | -0.57 | -0.44 | -2.44 | -1.37 | -0.6 | -2.98 | -2.44 | -1.37 | -3.25 | -2.98 | -2.44 |

* C_L1 (sell): OOS >= %10: **0/36**, OOS >= %5.3: **7/36** (C 100k/2, C 100k/4, MIX_IV 100k/2, MIX_IV 100k/4, MIX_IV 250k/4, MIX_SH 100k/2, MIX_SH 100k/4); IS ve OOS >= %5.3: 7

* C_L0 (sell): OOS >= %10: **0/36**, OOS >= %5.3: **9/36** (C 100k/2, C 100k/4, C 250k/4, MIX_IV 100k/2, MIX_IV 100k/4, MIX_IV 250k/4, MIX_SH 100k/2, MIX_SH 100k/4, MIX_SH 250k/4); IS ve OOS >= %5.3: 9

#### Varyant sıralaması (12 hücre IS ortalaması; seçim kuralı)

| lag | sleeve | IS_mean | OOS_mean | OOS_dd_mean |
|---|---|---|---|---|
| C_L1 | MIX_IV | 6.26 | 4.47 | -6.42 |
| C_L1 | MIX_SH | 6.03 | 4.32 | -5.24 |
| C_L1 | C | 5.63 | 4.04 | -6.3 |
| C_L0 | MIX_IV | 6.23 | 5.09 | -6.34 |
| C_L0 | MIX_SH | 6.11 | 5.05 | -5.13 |
| C_L0 | C | 5.59 | 4.84 | -4.73 |

## Dosyalar
* `sleeves_v2.py` → `results/sleeves_v2.pkl` (C_L1, C_L0 + v1 kolları)
* `combo_v2.py` (combo.py simülatörünü kullanır) → `results/all_results_v2.csv`, `results/series_v2.pkl`,
  `results/{daily,monthly}_returns_{IS,OOS}_v2.csv`, `results/mix_weight_IS_grid_v2.csv`, `results/mix_weights_v2.json`
* `analyze_v2.py` → `results/tables_v2.md`, `results/summary_wide_v2.csv`
* Çalıştırma: `python3 sleeves.py && python3 sleeves_v2.py && python3 combo_v2.py && python3 analyze_v2.py`
