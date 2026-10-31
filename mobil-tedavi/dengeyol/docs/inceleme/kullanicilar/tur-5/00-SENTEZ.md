# Kullanıcı turu 5 — sentez ve düzeltmeler

Puanlar (1 → 2 → 3 → 4 → 5. tur): k01 7→8→8,5→9→9,5 · k02 7→8→9→9,5→9,5 · k03 6→8→9→9→9 · k04 6→8→9→9,5→9,5 ·
k05 6→7→8→9→9 · k06 7→8→8→9→9 · k07 5→8→9→9→9 · k08 7→8→9→9→9 · k09 7→8→9→9→9 · k10 7→8→9→9→9,5.
Ortalama 6,5 → 7,9 → 8,75 → 9,1 → **9,2**. Hiçbir kullanıcı yeni Kritik/Yüksek sorun bulmadı.
"Önerir miyim / klinikte kullanır mıyım": **Evet** k01, k02, k03, k04, k06, k07, k08 (sensörlü kullanım gerçek iPhone pilotuna
bağlı), k10 · **Koşullu** k05 (ilk kurulum bir yakınla), k09 (etik kurullu pilot, Faz A doğrulama). Ortak koşul yazılım dışı:
gerçek Android/iPhone'da açı, ses ve titreşim doğrulaması ve pilot.

Turda hemen düzeltilen geri adım: kısa duraklatma sesinden düşen "Boynunuz ağrıyorsa yavaşça oturun" cümlesi geri geldi (k07).

## H1 — Yürütücü (runner.ts, evaluator.ts, RunnerView.tsx)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Düşük | Sırtüstü sınırında gecikme payı: yanlış taraf ≥30°, sırtüstüne dönmüş sayılmak ≤20° ve ~1 s; "Tamam, şimdi …" ancak o zaman; kısa yanlış taraf uyarısının bastırılması arada gerçek sırtüstü dönüşü yoksa uygulanmaz | k02 |
| 2 | Düşük | Ulaşılan en iyi açı başın durağan olduğu anlardan (savrulma 2–6° yüksek gösteriyor) | k07 |
| 3 | Düşük | Yanlış taraf ipucuna da 3. tekrardan sonra seyrekleşme (ilk "Dur!" aynen) | k10 |
| 4 | Düşük | Düzeltme ipucu varken 390×664'te baş göstergesi ve sayaç işaret alanının altında kalmasın | k08 |

## H2 — Hasta akışı ve rapor (EpisodeFlow.tsx, Onboarding.tsx, reportText.ts, flowText.ts, onboardingText.ts, PatientHome.tsx)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Orta | Taraf testinde ve tekrar testinde "Kendimi kötü hissediyorum" da manevradaki "Dinlenin" ekranına ve sesine gider (dinlenme, su, hekim, acil belirtide 112); raporda "kendini iyi hissetmedi" | k01 |
| 2 | Düşük–Orta | Uygunluk listesinin kısa sesli girişine "Emin değilseniz o maddeyi işaretleyin ve doktorunuza sorun." | k05 |
| 3 | Düşük | Raporda kural yerine olay: "hedef açıya yüzüstünden geçilerek gelindi; kabul edilmedi"; yakını modunda yardımcı kartı listede olanı tekrarlamaz; "Şu an nasılsınız?" sesli okunuşu kısalır ("Yeni belirti" listesi kalır); tarihlerde baştaki sıfır yok ("8 Kasım") | k02, k01, k03 |

## H3 — Klinisyen, ev raporu ve testler (clinician/*, core/reportShare.ts, e2e/run-e2e.mjs)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Düşük–Orta | Klinisyen içe aktarma ekranı ve HBYS satırı önce son atağın sonucunu yazar; açık atakta "atak açık: 1. saat tekrar testi negatif, sabah testi bekleniyor" ("sürüyor" değil) | k09, k08 |
| 2 | Düşük | Dönem tarihleri her yerde ayrı adlarla: "Reçete 16.10 (geçerlilik 29.10 dahil) · ataklar 17.10–25.10 · rapor 31.10" | k09 |
| 3 | Düşük | Klinisyen tablosunda "önce yanlış taraf" yerine yüzüstünden gelmede "yüzüstünden gelme reddedildi"; e2e: içe aktarılan ev raporu başlıklarında "{" olmadığı; seçenek ekranlarında çift dokunuş kilidi ve 1. soruda düğmelerin görünür alanda kalması | k10, k06 |

## Yapılmayanlar
- Güvenlik sorularının sesli gövdesinin kısaltılması, "bilinen/değişmeyen" belirti ayrımı (k04, k05, k07): klinik ekip kararı.
- Taraf sorusunda "geçen sefer" notu, hazırlık listesini katlama, "hekime söyleyecekleriniz" yanıt alanı, reçetesiz "Tanınız" ekranının sesli okunması (k06, k03, k05): sonraki sürüm.
- Gerçek telefonda doğrulama ve pilot: yazılım dışı.

## Uygulama durumu
H1–H3'ün bütün maddeleri uygulandı ve birleştirildi. 485 birim testi ve 23/23 uçtan uca senaryo geçiyor. Açık kalan: ev raporu
QR biçimine "yüzüstünden gelme" ve testte durdurma bilgisinin eklenmesi (eski klinisyen sürümleri yeni biçimi reddedeceği için
biçim sürümü 2 gerekir; bir sonraki sürüme bırakıldı).
