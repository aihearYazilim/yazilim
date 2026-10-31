# Kullanıcı turu 6 — sentez ve düzeltmeler

Puanlar (1 → … → 6. tur): k01 7→8→8,5→9→9,5→9,5 · k02 7→8→9→9,5→9,5→**10** · k03 6→8→9→9→9→9 ·
k04 6→8→9→9,5→9,5→9,5 · k05 6→7→8→9→9→9 · k06 7→8→8→9→9→9 · k07 5→8→9→9→9→9,5 · k08 7→8→9→9→9→9,5 ·
k09 7→8→9→9→9→9,5 · k10 7→8→9→9→9,5→**10**. Ortalama 6,5 → 7,9 → 8,75 → 9,1 → 9,2 → **9,45**.
Hiçbir kullanıcı Kritik, Yüksek ya da Orta sorun bulmadı. Kararlar: **Evet** k01, k02, k03, k04, k06, k07, k08, k10 ·
**Koşullu** k05 (ilk kurulum bir yakınla), k09 (etik kurullu pilot, Faz A). Ortak koşul yazılım dışı: gerçek telefonda
açı, ses ve titreşim doğrulaması ve pilot.

## I1 — Hasta tarafı (EpisodeFlow.tsx, PatientHome.tsx, reportText.ts, flowText.ts, safety.ts metinleri)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Düşük | "Şu an nasılsınız?" kısa kalsın ama seçenekler ayırt edilsin: "Birinci: İyiyim. İkinci: … Dördüncü: Yeni belirti: …" (k05); seçince ses kesilmesi aynen (k04) | k05, k04 |
| 2 | Düşük | Durdurma ekranlarının sesi kısa biçimle başlasın (ör. ortostatik: "Manevra yapmayın. Birkaç gün içinde aile hekiminize gidin; yavaş kalkın, tutunun. Bayılırsanız 112."), ayrıntı ekranda ve "Ayrıntıyı dinle"de; "BPPV" seste "kristal oynaması" | k05, k07 |
| 3 | Düşük | Testte "kötü hissediyorum" ile durduktan sonra ana ekran kartına: "Son test, siz kötü hissettiğiniz için durdu. Kendinizi iyi hissettiğinizde yapın; geçmiyorsa hekiminize başvurun." | k01 |
| 4 | Düşük | Hastanın dönem raporu ve paylaşılan metin de adlandırılmış tarih dizisini kullansın ("reçete … (geçerlilik … dahil) · ataklar … · rapor …") | k09 |

## I2 — Yürütücü ve rapor açısı (runner.ts reachSummary)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Düşük | Baş hedefin alt sınırına gelip orada tutulamadığında rapor açıyı da yazsın: "baş hedefin alt sınırına (~15°) kadar geldi, orada tutulamadı" | k07 |

## I3 — Klinisyen, ev raporu biçimi ve testler (clinician/*, core/reportShare.ts, e2e/run-e2e.mjs)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Düşük | Ev raporu QR biçimi sürüm 2: "yüzüstünden gelme" ve testte durdurma bilgisini taşır; eski sürüm v2'yi görünce "uygulamayı güncelleyin" der; v1 okunmaya devam eder | k09, k02, k10 |
| 2 | Düşük | Ev dönemi satırında 1. saat test sonucu iki kez geçmesin; ev dönemi ekli basılı rapor sığıyorsa tek sayfa (sığmıyorsa bugünkü bölünmeyen davranış) | k08 |
| 3 | Düşük | Kalan davranışlar e2e kilidine: geri tuşunun önceki soruya dönmesi, alt tip yanıtlarının hatırlanması, gün sınırı kartı, arka plana alınca duraklatma, kapatırken uyarı; çift dokunuş testine "Süre" → taraf sorusu geçişi | k06 |

## Yapılmayanlar
- Güvenlik sorularının sesli gövdesinin kısaltılması ve "bilinen/değişmeyen" belirti ayrımı: klinik ekip kararı.
- Taraf sorusunda "geçen sefer" notu, hazırlık listesini katlama, "hekime söyleyecekleriniz" yanıt alanı, reçetesiz "Tanınız" ekranının sesli okunması: sonraki sürüm.
- Gerçek telefonda doğrulama ve pilot: yazılım dışı.
