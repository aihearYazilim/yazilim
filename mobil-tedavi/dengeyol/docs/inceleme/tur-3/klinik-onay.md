# Tur 3: Son klinik onay (kod: klinik-onay)

## 1. Kapsam
- Bakış açısı: pilottan önce son klinik onay (nörootoloji). Okunan kod: `core/safety.ts`, `core/diagnosis.ts`, `core/protocols.ts`, `core/runner.ts` (baş dönmesi işaretleri, `holdComplete`), `state/episodes.ts`, `EpisodeFlow.tsx`, `PatientHome.tsx`, `Onboarding.tsx`, `Exam.tsx` (reçete kapısı). Belgeler: KLINIK-PROTOKOL, RISK-ANALIZI, KULLANIM-KILAVUZU, PROTOKOL-TABLOSU, KLINIK-INCELEME; tur-1 ve tur-2 klinik raporları.
- Betikler (`vite-node`, depo değişmedi): `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/inceleme/tur-3/klinik-onay/dx.ts` (32 tanı senaryosu), `dose.ts` (doz penceresi, reçete kısa yolu, kusma sonrası akış), `pt.ts` (protokol tablosunu geçici dosyaya yeniden üretip farkı aldı). Birim testleri: 180/180 geçti.
- Kaynak doğrulama: Kim HJ ve ark. JAMA Neurol 2023;80:244–250, PMC10011937 tam metni (Box: 6 soru; Tablo 1; dışlama ölçütleri; birincil sonlanım). Playwright çalıştırılmadı; akış bulguları kod okuması ve betiklere dayanıyor.

## 2. Hasta modu karar ağacı
İşaretler: ✔ gerekçesi uygun · ⚠ zarar riski · ⛔ tedaviyi gereksiz engelliyor (bulgu numarası parantezde).
```
KAPI: onam + (hekim tanısı beyanı | reçete) + profil kanalı ≠ HC + kontrendikasyon yok ─ değilse KİLİT (GATE_TEXT) ✔
  (Profilde "yatay kanal" bir kez işaretlenirse kapı kalıcı kapanır; nükste kanal değişir. Tutucu, kabul edilebilir.)
Bekleyen yönlendirme ─> "Önce hekiminizle görüşün" (iki adımlı beyan) ✔
"Baş dönmem başladı"
 1 Kırmızı bayrak, 11 soru (6 saat geçerli): acil 5 ─> 112 + kilit │ hekim 6 ─> kilit ✔ (metin sorunları #14)
 2 Reçeteli kısa yol: reçete ≤14 gün ve reçeteden sonra kapanmış atak yok ─> alt tip ve taraf testi YOK, 5'e ⚠(#3)
 3 Alt tip S1 "en çok ne başlatıyor": yatıp-kalkma │ yatakta dönme ─> onay ─> HC: hekim + kilit ✔ │ emin değilim ✔
   Alt tip S2 "dönme hissi süresi": <1 dk ✔ │ >1 dk ─> hekim + kilit ⛔(#1) │ bilmiyorum ─> teste ✔
 4 Taraf sorusu (yalnız sıra: şüphesiz taraf önce ✔) ─> Hazırlık ─> (ilk kez) tanıtma ─> yerleştirme
   DH-1 (60 s pencere; 120 s'de güvenlik durdurması) ─> 30 s dinlenme ─> DH-2
   ├ güvenlik durdurması, dalga ≥60 s ya da bitişi işaretlenmemiş ─> ATYPICAL_LONG: hekim + kilit ✔
   ├ ikisi de negatif ─> 1. kez: ertesi sabah taraf testi ✔ │ 2. kez: atak kapanır, kilit yok ✔
   ├ tek taraf pozitif ─> reçete tarafıyla çelişki: SIDE_CONFLICT kilit ✔ │ değilse TEDAVİ ✔
   └ iki taraf pozitif ─> "hangisi şiddetli?" ─> reçete yoksa her yanıtta BOTH_SIDES kilit (soru boşa; #5)
                          eşit: kilit ✔ │ reçete tarafından farklı: kilit ✔ │ reçete tarafı: TEDAVİ ✔
 5 Doz (14 günlük pencere, tüm ataklar + deneme): günde 3 / 3 gün / 9; reçeteyle 7 gün / 21
   günlük sınır ─> dur ✔ │ gün ya da toplam sınır ─> hekim + kilit ✔ — ancak TESTLERDEN SONRA denetleniyor ⚠(#2)
 6 Manevra (Epley; reçeteyle Semont): pozisyon başına 45 s, işaretli baş dönmesinden sonra +30 s ✔
   120 s ─> durdurma + kilit ✔ │ tek dalga ≥60 s (tamamlanan ya da yarıda kalan manevrada) ─> hekim + kilit ✔
 7 "Şu an nasılsınız?": iyi/hafif ─> 10 dk dinlenme, 1 saatte test ✔ │ kusma ─> "bugün tekrarlamayın" ama engel yok ⚠(#4)
   nörolojik belirti ─> 112 + kilit ✔ (ekranda yinelenen paragraf, #6)
 8 1. saat tekrar testi (yalnız tedavi edilen tarafta DH): ≥60 s ─> kilit ✔ │ pozitif ─> yeniden 5 ✔ │ negatif ─> sabah testi ✔
 9 Sabah testi (06:00'dan sonra; bayraklar yeniden sorulur): pozitif ─> 5 │ negatif ─> "düzelmiş", atağı kapat ✔
10 3 gün işlemsiz atak kendiliğinden kapanır ✔ │ 30 günde ≥3 atak ─> hekim ve D vitamini önerisi ✔
```
Klinik gerekçe özeti:
- Kim 2023'ün yapısı (alt tip soruları, her nükste yeniden belirleme, çok kanallı tutulumu dışlama) doğru uyarlanmış.
- Hasta modunda ≥60 s eşiği Bárány 2015 kanalolitiazis ölçütüyle uyumlu.
- Yatay kanal ve iki taraflı pozitiflikte hekime yönlendirme tutucu bir seçim. Kim 2023'te yatay kanal evde tedavi edilmişti; uygulama bunu bilinçli olarak yapmıyor (KLINIK-PROTOKOL §6). Bu bir kısıtlama, hata sayılmamalı.

## 3. Bulgular

| # | Önem | Yer | Sorun (gözlem) | Öneri (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | **Yüksek** | `EpisodeFlow.tsx:747–760` (alt tip S2) | Hasta "1 dakikadan uzun" derse ölçüm yapılmadan hekime yönlendiriliyor ve atak kilitleniyor. Kim 2023'te bu soru (S6) yalnız yatay kanalda geotropik ile apogeotropiği ayırmak için soruluyor, dışlama ölçütü değil. Kim'in BPPV tarama sorusu "<3 dakika" (S3). Hastalar süreyi sık sık fazla tahmin eder; ardından gelen taraf testi süreyi dokunuşla zaten ölçüyor (≥60 s olursa kilit). Bu dal tipik arka kanal hastasını gereksiz yere kilitliyor. | Seçenekler "1 dakikadan kısa", "1–3 dakika", "3 dakikadan uzun", "bilmiyorum" olsun. Yalnız ">3 dk" hekime yönlendirsin. "1–3 dk" ve "bilmiyorum" teste gitsin; ölçülen ≥60 s kuralı aynen kalsın. Pilotta S2 yanıtı ile ölçülen süre karşılaştırılsın. | Evet (kod; PMC10011937 Box) |
| 2 | Orta | `EpisodeFlow.tsx:173–183`, `:319–331`, `:384`; `PatientHome.tsx:97` | Gün ve toplam doz sınırı yalnız manevradan hemen önce denetleniyor. Betikte 14 gün içinde 3 ayrı günde manevra yapmış hastanın yeni atağı en başta `DAY_LIMIT` durumunda. Hasta yine de 11 soruyu ve iki provokatif Dix-Hallpike'ı (baş dönmesi, düşme, bulantı) yaşıyor, ancak sonra reddediliyor. | Atak başlarken `doseFor` çağrılsın. Gün ya da toplam sınır doluysa test yapılmadan yönlendirme ekranı gösterilsin ("son 2 haftada çok sayıda atak"). Ana ekran düğmesi de bunu göstersin. | Evet (`dose.ts`: `DAY_LIMIT`, day 1) |
| 3 | Orta | `episodes.ts:48–53`, `EpisodeFlow.tsx:169`, `:298` | Reçeteli kısa yol, reçeteden 11 gün sonra uygulamada açılan ilk atakta da işliyor (betikte `true`). Bu atak klinikte tedavi edilmiş BPPV'nin nüksü olabilir; o zaman hem alt tip soruları hem taraf testi atlanır. Tur-2 #3 önerisindeki "≤3 gün" ya da "geçip yeniden mi başladı?" sorusu uygulanmamış. | Kısa yol reçete tarihinden en çok 3 gün sonrasına kadar geçerli olsun. Ya da önce "Muayeneden sonra baş dönmeniz tamamen geçip yeniden mi başladı?" diye sorulsun; "Evet" yanıtı tam akışa götürsün. | Evet (`dose.ts`) |
| 4 | Orta | `EpisodeFlow.tsx:936–943`; `episodes.ts:189–191` | "Kusma ya da şiddetli bulantı" yanıtında "Bugün manevrayı tekrarlamayın" deniyor. Ancak 1 saat sonra tekrar testi hazır görünüyor (betik: `early-retest ready`); test pozitif çıkarsa aynı gün yeniden manevra öneriliyor. Metin ile akış çelişiyor. | `afterSymptoms==='severe'` ise o gün manevra ve tekrar testi kapansın, sonraki adım sabah testi olsun. Kusma tekrar ederse yönlendirme (tur-2 #10) değerlendirilsin. | Evet (`dose.ts`) |
| 5 | Orta | `safety.ts:307–308`, `:320–321`; `EpisodeFlow.tsx:851–866` | İki taraf pozitif ve reçete yokken "Hangisi daha şiddetli?" sorusunun her yanıtı `BOTH_SIDES` ile kilitliyor. Soru boşa soruluyor ve hastaya telefonu alnından indirtiyor. Hasta "sağ daha şiddetli" dese bile metin "benzer baş dönmesi oldu" diyor; yanlış. | `knownSide` yoksa soru atlansın ve doğrudan yönlendirilsin. Metin: "İki tarafa yattığınızda da baş dönmesi oldu. Bu, yatay kanal ya da iki taraflı BPPV olabilir…" | Evet (kod) |
| 6 | Düşük | `EpisodeFlow.tsx:638–643` | Acil ekranında (manevra sonrası nörolojik belirti) "Yeni bir nörolojik belirti bildirdiniz…" paragrafı iki kez yazılıyor; en kritik ekranda özensiz görünüyor. | Yinelenen blok silinsin. | Evet (kod) |
| 7 | Orta | `diagnosis.ts:111–121` (senaryo 8) | Sol Dix-Hallpike girilmeden sağ arka kanal "tipik" çıkıyor; ev reçetesi açılıyor. İki taraflı arka kanal dışlanmamış oluyor; Kim 2023 iki taraflı tutulumu dışlamıştı. | "Tipik" için iki Dix-Hallpike'ın da girilmiş olması şart olsun. Yoksa sonuç "olası" olsun ve "karşı taraf test edilmedi" uyarısı verilsin. | Evet (betik) |
| 8 | Düşük | `diagnosis.ts:141–154` (senaryo 32) | İki taraflı arka kanal dalında süre ve gecikme kuralları uygulanmıyor: bir tarafta 80 s süren yanıt "belirsiz" çıkıyor, ≥1 dk ya da gecikmesizlik uyarısı verilmiyor. | Süre ve gecikme uyarıları her taraf için iki taraflı dalda da üretilsin. | Evet (betik) |
| 9 | Düşük | `diagnosis.ts` (senaryo 26, 27); `FindingForm.tsx:5–13` | Form, roll testinde dikey-torsiyonel nistagmus girilmesine izin veriyor (senaryo 27). Dix-Hallpike'ta yatay nistagmus görülüp roll testi negatif olabiliyor (senaryo 26). İki durumda da öneri ve uyarı çıkmıyor, klinisyen boş bir ekran görüyor. | Uyarı eklensin: "Test düzlemiyle uyumsuz nistagmus: diğer kanal ya da santral; testi tekrarlayın." | Evet (betik) |
| 10 | Düşük | `diagnosis.ts:121` (senaryo 7) | 35 s gecikme "olası" sonucunu veriyor, ama gerekçede bu gecikmenin neden tipik sayılmadığı yazmıyor. | Gerekçeye "Gecikme >20 s (tipik değil)" satırı eklensin. | Evet (betik) |
| 11 | Düşük | `docs/PROTOKOL-TABLOSU.md` | Tablo koddan yeniden üretilmemiş. Semont kanıt notu hâlâ yalnız "Sınıf I" diyor; Radtke 2004'teki ev uygulaması kısıtı eksik. Epley ve Dix-Hallpike özgün kaynakları yok, adım başlıkları da koddakinden farklı. Süre ve açı değerleri doğru. | `npm run docs:protocols` çalıştırılsın. Birim testi tablonun güncel olduğunu denetlesin. | Evet (`pt.ts` farkı) |
| 12 | Düşük | `KULLANIM-KILAVUZU.md` B.6; `KLINIK-PROTOKOL.md` §4.5 | Belgeler "reçete yalnız o atak için geçerli" diyor. Oysa 14 gün boyunca bütün ataklarda reçetedeki yüksek doz (7 gün/21) ve taraf çelişkisi kuralı uygulanıyor (`doseLimitsFor`, `recentKnownSide`). | Şöyle yazılsın: "Testsiz kısa yol yalnız o atak için; doz ve taraf denetimi 14 gün geçerli." | Evet (kod) |
| 13 | Düşük | `safety.ts:319`; `EpisodeFlow.tsx:753` | `ATYPICAL_LONG` metni alt tip sorusunda da kullanılıyor ve "ya da bitişi işaretlenmedi" diyor; o noktada ortada işaret yok. Hiçbir `REFER_TEXT` acil belirtileri anmıyor; uzun pozisyonel baş dönmesi santral nedenli olabilir. | Alt tip sorusu için ayrı metin yazılsın. `ATYPICAL_LONG` metnine "Konuşma bozukluğu, güçsüzlük ya da çift görme olursa 112" eklensin. | Evet |
| 14 | Düşük | `safety.ts:29`, `:50`, `:57`, `:92` | Kırmızı bayrak metinleri (hiçbiri daraltılmadan): **continuous** "sürekli devam ediyor" fazla sözcük içeriyor; "baş dönmesi" sözcüğü BPPV sonrası sık görülen kalıntı sersemliği de kapsıyor, bu da gereksiz 112 aramasına yol açabilir. **cardiac** "oldu mu" sorusunda zaman yok; yıllar önceki bayılma da 112'ye götürür. **anticoag** iki soruyu birleştiriyor ve dilbilgisi bozuk ("kullanıyorsunuz ve … var mı"). **fever** "alamıyor musunuz" sorusuna verilen "Evet, var" etiketi uymuyor. | Önerilen metinler: "Hiç kıpırdamadan dururken de etrafın dönmesi ya da şiddetli dengesizlik saatlerdir sürüyor mu?" · "Bu baş dönmesiyle birlikte göğüs ağrısı, çarpıntı ya da bayılma oldu mu?" · "Kan sulandırıcı kullanıyorsanız: yeni bir baş ağrınız var mı ya da yakında başınızı çarptınız mı?" · ateş sorusunda etiket "Evet". | Evet |
| 15 | Düşük | `safety.ts:263–264`; `EpisodeFlow.tsx:394` | `DAY_LIMIT` metni "(gün sayısı)" diye garip bir ek taşıyor. Ayrıca sınır üç ayrı kısa atak yüzünden dolduğunda "baş dönmeniz uzun sürdü" demek yanlış. Tek tetiklenmeyen testin metni hem "yarın test edelim" hem "hekime başvurun" diyor. | `DAY_LIMIT`: "Son 2 haftada evde manevra için önerilen gün sayısı doldu. Hekiminize başvurun…" Tetiklenmeme metni: "Yarın sabah yeniden test edelim. Bu arada yatakta dönerken baş dönmesi sürerse hekiminize başvurun." | Evet |
| 16 | Düşük | `EpisodeFlow.tsx:457`, `:472–474`, `:480` | Denemede 120 s güvenlik durdurması ve ≥60 s dalga hiçbir kayıt ya da kilit bırakmıyor; tur-2 #6'nın bu kısmı uygulanmamış. Gerçek akış testleri bu durumu yakalar, bu yüzden risk düşük. | Denemede güvenlik durdurması olursa yönlendirme kaydı ve kilit oluşsun. | Evet (kod) |

**Tur-2 düzeltmelerinin doğrulanması** (tur-2 klinik-guvenlik numaraları)
| Tur-2 # | Sonuç | Not |
|---|---|---|
| 1 Doz döngüsü | Doğrulandı | 14 günlük pencere, tüm ataklar ve deneme birlikte sayılıyor. Yan etki: sınır geç denetleniyor (#2). |
| 2 Kim S4 | Doğrulandı | Soru karşılaştırmalı; "dönme" seçeneği onay ekranına, oradan kilide gidiyor. |
| 3 Reçete kısa yolu | **Kısmen** | "Yalnız ilk atak" eklendi; süre sınırı 14 gün kaldı (#3). |
| 4 Zincirde yer kontrolü | Doğrulandı (kod) | `CHAIN_MOUNT_TOLERANCE_DEG = 12`. |
| 5, 7, 8, 11, 12, 13, 14, 16 | Doğrulandı | Yarıda kalan manevrada ≥60 s; iki kez tetiklenmemede kilit yok; hastanın kendi girdiği tanı kullanılmıyor; en uzun tek dalga; çok kanal ve kupulolitiazis reçete kapısı; ICD önerisi yalnız uyarısız tanıda; yerel tarih; iki adımlı onay. |
| 6 Deneme | **Kısmen** | Baş dönmesi gerçek akışa yönlendiriyor ve doza sayılıyor; güvenlik durdurmasında kilit yok (#16). |
| 10 Belirti ayrımı | **Kısmen** | Nörolojik belirti 112'ye götürüyor; kusma yanıtı aynı gün tekrarı engellemiyor (#4). |
| 15 Belgeler | **Kısmen** | RISK ve PROTOKOL güncel; PROTOKOL-TABLOSU eski (#11); reçete kapsamı yanlış anlatılıyor (#12). |

## 4. Klinisyen modu: `suggestDiagnosis` (32 senaryo)
Kısaltmalar: g = gecikme (s), s = süre (s), Ş = şiddet. Sütunlar: Öneri [güven] · Manevra · Uyarı · Çok kanal (ÇK). Değerlendirme: ✔ doğru, ✖ sorunlu.
| # | Girdi | Öneri [güven] | Manevra | Uyarı | ÇK | Değ. |
|---|---|---|---|---|---|---|
| 1 | Sağ DH yukarı+tors, g5 s20 | Sağ PC kanalolitiazis [tipik] | Epley | — | H | ✔ |
| 2 | Sol DH aynı | Sol PC [tipik] | Epley | — | H | ✔ |
| 3 | Sağ PC, gecikme yok | Sağ PC [olası] | Epley | — | H | ✔ |
| 4 | Sağ PC, s75 | Sağ PC kupulolitiazis [olası] | Semont | ≥1 dk, santral dışla | H | ✔ |
| 5 | Sağ PC, g0 s20 | Sağ PC [olası] | Epley | gecikmesiz | H | ✔ |
| 6 | Sağ PC, g0 s90 | PC kupulolitiazis [olası] | Semont | ≥1 dk + gecikmesiz | H | ✔ |
| 7 | Sağ PC, g35 s20 | Sağ PC [olası] | Epley | — | H | ✖ gerekçe yok (#10) |
| 8 | Sağ PC, sol DH girilmedi | Sağ PC [**tipik**] | Epley | — | H | ✖ (#7) |
| 9 | İki DH yukarı+tors | İki taraflı DH pozitif [belirsiz] | taraf yok | — | H | ✔ |
| 10 | Sağ DH aşağı+tors | Ön kanal [olası] | Yacovino | santral dışla | H | ✔ |
| 11 | Saf aşağı vuran g0 s90 | — | — | santral, MR | H | ✔ |
| 12 | Roll geo Ş3/Ş1, s30 | Sağ HC geo [tipik] | BBQ | — | H | ✔ |
| 13 | Roll geo Ş2/Ş2 | HC geo, taraf belirsiz | — | — | H | ✔ |
| 14 | Roll geo yalnız sağda | HC geo, taraf belirsiz | — | — | H | ✔ |
| 15 | Roll geo Ş3/Ş1, s80 | Sağ HC geo [olası] | BBQ | hafif kupula | H | ✔ |
| 16 | Roll apo Ş1/Ş3, s90 | Sağ HC apo (zayıf taraf) [tipik] | Gufoni-apo | — | H | ✔ |
| 17 | Roll apo Ş1/Ş3, s30 | Sağ HC apo [olası] | Gufoni-apo | — | H | ✔ |
| 18 | Senaryo 16 + nötrde nistagmus | Sağ HC apo [olası] | Gufoni-apo | nötr nistagmus, atipik | H | ✔ |
| 19 | Roll sağda geo, solda apo | HC tutarsız [belirsiz] | — | santral | H | ✔ |
| 20 | Sağ PC + roll geo | PC [olası] ‖ HC [olası] | — | çok kanallı | E | ✔ |
| 21 | Sağ PC + sol aşağı+tors | PC ‖ ön kanal [olası] | — | çok kanal + santral | E | ✔ |
| 22 | Nistagmus yok, sağ DH baş dönmesi | Nistagmussuz PV, sağ PC [belirsiz] | Epley (ek onayla) | — | H | ✔ |
| 23 | Nistagmus yok, iki DH baş dönmesi | Nistagmussuz PV [belirsiz] | — | — | H | ✔ |
| 24 | Tamamen negatif | — (negatif=E) | — | — | H | ✔ |
| 25 | DH'de yatay nistagmus, roll yok | — | — | roll testi yapın | H | ✔ |
| 26 | DH'de yatay nistagmus, roll negatif | — | — | — | H | ✖ (#9) |
| 27 | Roll'da yukarı+tors | — | — | — | H | ✖ (#9) |
| 28 | Sol DH "atipik", g0 s120 | — | — | BPPV dışı | H | ✔ |
| 29 | Roll apo Ş2, sol Ş0 | HC apo, taraf belirsiz | — | — | H | ✔ (form Ş0'ı engelliyor) |
| 30 | Sağ PC g5, süre yok | Sağ PC [olası] | Epley | — | H | ✔ |
| 31 | Sağ PC tipik + sol DH yalnız baş dönmesi | Sağ PC [tipik] | Epley | — | H | ✔ |
| 32 | İki DH pozitif, biri s80 | İki taraflı [belirsiz] | — | **yok** | H | ✖ (#8) |

Ölçütler genel olarak doğru: Bárány 2015'te geotropikte güçlü taraf, apogeotropikte zayıf taraf hastadır; PC kupulolitiaziste Semont önce gelir; ön kanal ve saf aşağı vuran nistagmusta santral uyarısı verilir.

## 5. Kaldırılabilecekler
- İki taraf pozitif ve reçete yokken "Hangisi daha şiddetli?" ekranı (#5).
- Acil ekranındaki yinelenen paragraf (#6).
- Tetiklenmeyen test metnindeki "Kristaller kendiliğinden yerine oturmuş olabilir" cümlesi; varsayım içeriyor ve aynı metindeki "hekime başvurun" ile çelişiyor (#15).

## 6. Pilot çalışma için öneri (koşullar)
- **Düzenleme ve etik:**
  - Tıbbi amaçlı yazılım olduğundan, tıbbi cihaz klinik araştırması olarak TİTCK başvurusu ve Klinik Araştırmalar Etik Kurulu onayı alınmalı. Bu sınıflandırma "doğrulanmadı"; düzenleyici uzman teyit etmeli.
  - Gerekenler: bilgilendirilmiş onam, KVKK aydınlatması, araştırma ekibine 7/24 ulaşma numarası, ciddi advers olay bildirimi ve durdurma kuralı. Durdurma kuralı: gözden kaçmış santral olay, düşmeye bağlı yaralanma ya da önceden belirlenen orandan fazla acil başvurusu.
- **Dahil etme:**
  - ≥18 yaş.
  - Klinikte VNG ya da Frenzel ile belgelenmiş, tek taraflı arka kanal kanalolitiazisi; ilk atak değil ya da klinikte tanı ve tedavi görmüş.
  - Kendi akıllı telefonu olmalı; Türkçe sesli okuma çalışmalı; yatağa yatıp kalkabilmeli.
- **Dışlama:**
  - Uygulamanın kontrendikasyon listesi.
  - Muayenede çok kanallı, iki taraflı, yatay ya da ön kanal tutulumu; kupulolitiazis.
  - Santral bulgu.
  - Meniere hastalığı, vestibüler migren ya da başka bir eşlik eden vestibülopati.
  - Son 1 ayda kafa travması.
  - Bilişsel bozukluk (ör. MoCA <21); bu eşik bir öneridir.
- **Aşama A (klinikte, gözetimli):**
  - Hasta uygulama akışını klinikte yapar; klinisyen aynı anda VNG ya da Frenzel ile izler.
  - Ölçülecekler:
    - Belirtiye dayalı taraf testinin nistagmusa göre duyarlılığı ve özgüllüğü (en kritik doğrulanmamış varsayım).
    - Dokunuşla ölçülen süre ile nistagmus süresi arasındaki fark.
    - Hedef açıda kalma yüzdesi ve θ hatası.
    - Tanıtmanın başarısızlık oranı (≥65 yaş alt grubu ayrıca).
- **Aşama B (evde):**
  - Birincil sonlanım: pozisyonel baş dönmesinin düzelmesi; Kim 2023'teki gibi 1–3. günde, tedaviyi bilmeyen kişinin yaptığı telefon görüşmesiyle.
  - Objektif doğrulama: 7. gün kontrolünde Dix-Hallpike nistagmusunun negatif olması.
  - İkincil sonlanımlar:
    - Yönlendirme oranı ve nedenleri (`endNote`).
    - Gereksiz yönlendirme: klinikte tipik arka kanal BPPV bulunan yönlendirilmiş hastaların oranı. Hedef ≈%28'den belirgin yüksek olmaması (Kim 2023 başarısızlık oranı).
    - 30 ve 90 günde nüks, acil başvurusu, düşme ve santral tanı.
    - Advers olaylar: boyun ağrısı, kusma, kanal değişimi.
    - Uyum (protokolün tamamlanması), SUS kullanılabilirlik puanı.
  - Örneklem: tek kollu uygulanabilirlik çalışması için 40–60 hasta. Etkinlik için basılı yönerge kontrollü bir RKÇ sonraki aşamada yapılmalı.

## 7. En önemli 5 madde
1. **Yüksek (#1):** Alt tip süre sorusunda "1 dakikadan uzun" yanıtı ölçüm yapılmadan hastayı kilitliyor. Kim 2023 bu soruyu yatay kanal alt tipini ayırmak için kullanır, dışlamak için değil. Eşik ">3 dk" olsun; 1–3 dk yanıtı teste gitsin, ölçülen ≥60 s kuralı kalsın.
2. **Orta (#2):** Gün ve toplam doz sınırı provokatif testlerden sonra denetleniyor. Dolmuş sınırda hasta iki Dix-Hallpike'ı boşuna yaşıyor; denetim atak başına alınsın.
3. **Orta (#3):** Reçeteli kısa yol 14 gün boyunca alt tip sorularını ve taraf testini atlıyor; ≤3 gün ya da "geçip yeniden mi başladı?" sorusuyla sınırlansın.
4. **Orta (#4, #5):** Kusma sonrası "bugün tekrarlamayın" uyarısı uygulanmıyor. Reçetesiz iki taraf pozitiflikte "hangisi şiddetli?" sorusu boşuna soruluyor ve metni yanlış.
5. **Orta/Düşük (#7–#9, #11, #6):** Tanı önerisinde tek taraflı muayene "tipik" sayılıyor; iki taraflı dalda süre uyarısı yok; uyumsuz desenlerde ekran boş kalıyor. PROTOKOL-TABLOSU eski. Acil ekranında paragraf yineleniyor.

## Yayına hazır mı: **Koşullu**
- Genel yayına hazır değil.
- Etik kurul ve TİTCK onaylı, klinisyen gözetimli pilot için klinik onay **koşullu olarak verilebilir**. Koşullar:
  - #1–#5 düzeltilmeli.
  - #6 ve #11 düzeltilmeli.
  - Pilot önce gözetimli Aşama A ile başlamalı.
- Gerekçe:
  - Kırmızı çizgilerin hepsi kodda çalışıyor: ilk atak kilidi, kırmızı bayraklar, 14 günlük doz penceresi, ≥60 s ve 120 s kuralları, yönlendirme kilidi.
  - Hastaya doğrudan zarar verecek bir dal bulunmadı; yanlış taraf Epley'i etkisiz ama zararsızdır.
  - Kalan sorunlar gereksiz kilit ve provokasyon ile metin tutarlılığı.
  - Belirtiye dayalı taraf testinin geçerliliği hiç ölçülmedi; evde yaygın kullanımdan önce Aşama A verisi şart.
