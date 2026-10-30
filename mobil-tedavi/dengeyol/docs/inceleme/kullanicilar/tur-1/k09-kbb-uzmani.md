# Tur 1 · k09 · KBB uzmanı (Doç. Dr. Serkan, 52, nörootoloji polikliniği)

## 1. Ben kimim, ne yapmaya çalıştım
Üniversite hastanesinde nörootoloji polikliniği yürüten KBB uzmanıyım. Evde kendi kendine Epley'e olumlu bakıyorum (AAO-HNSF 2017,
Cochrane 2014), ama hasta güvenliği ve medikolegal sorumluluk konusunda şüpheciyim. Pixel 7'de (öykünüm, demo sensör) önce
klinisyen olarak muayene, tanı ve reçete akışını, sonra hasta olarak reçeteyi içe aktarıp bir atağı **gerçek hızda** (timeScale 1)
baştan sona yaşadım. KLINIK-PROTOKOL ve RISK-ANALIZI belgelerini okudum, ilgili kaynak kodunu inceledim.

## 2. Yaşadıklarım (kısa günlük)
- **Klinisyen kurulumu:** Ad/kurum, "VNG/Frenzel kullanıyorum" seçeneği var; bunu sevdim (ben Frenzel'le bakarım). Hasta kodu
  kullanılıyor, ad sorulmuyor (KVKK açısından iyi).
- **Sağ Dix-Hallpike (sensörlü):** Kalibrasyon ~25 s, sesli yönergeler net ("Hastanın başını geriye yatırıp tavana baktırın").
  Bulgu formunda nistagmus tipi önceden seçili gelmiyor; bilinçli seçim istemesi doğru. Sol DH ve roll testini elle negatif girdim.
- **Tanı:** "Sağ arka kanal BPPV (kanalolitiazis) · tipik", gerekçeler (gecikme 4 s, süre 22 s) ve "Bu öneri neye dayanmaz"
  kutusu (HINTS, öykü, işitme değerlendirilmez) dürüst. Klinikte Epley 30 s/pozisyon; rapordaki hedef sapma tablosu güzel.
- **Reçete:** Taraf yalnız onaylı tanıdan geliyor (ters taraf riski yok). Günde 1–3, gün 1/3/5/7, not. 3×5 gün seçtim, QR çıktı
  (bağlantı 355 karakter, QR yoğun ama okunur). Formu değiştirince QR gizleniyor, geri alınca dönüyor. **Reçete ekranında
  "14 gün geçerli / şu tarihe kadar" ve "testsiz kısa yol yalnız bu atak için" bilgisi yok**; bunu hastanın ana ekranında gördüm.
- **Güvenlik denemeleri:** Gecikmesiz 75 s arka kanal yanıtı → "kupulolitiazis (olası)" + santral uyarısı, reçete **engellendi**.
  Nistagmussuz pozisyonel vertigo → "belirsiz", reçete yalnız ek onay kutusuyla. Doğru tasarım.
- **HBYS notu:** Düz metin, ICD-10 H81.1 önerisi, tanının karar desteğinden gelip benim onayladığım yazıyor. Geçerlilik tarihi yok.
- **Hasta: reçete içe aktarma** → kart açık ve anlaşılır; onam → kontrendikasyonlar ("Hiçbiri" açıkça işaretlenmeli) → ana
  ekranda "13 Kasım 2026 tarihine kadar geçerli". 11 kırmızı bayrak sorusu sesli okunuyor (her biri 5–12 s).
- "Muayeneden beri hiç geçmedi" dedim → taraf testi atlanıp doğrudan sağ Epley. Tanıtma 28 s; sonra dokunmadan akış.
- **Gerçek hızda Epley (~4,5 dk):** Her yönerge pozisyon süresi başlamadan bitti, hiçbiri kesilmedi. Sarkık pozisyonda baş dönmesini
  ~18 s işaretledim → "Geçti olarak işaretlendi. 30 saniye daha bekleyin." Ardından 45/45/60 s. Son oturuşta "Acele etmeyin".
  Sonrasında "Şu an nasılsınız?", 1 saat sonrası için tekrar testi saati ve takvim hatırlatıcısı. Ardışık kısıtlama önerilmiyor
  (AAO-HNSF 2017 ile uyumlu).
- **Hata denemeleri:** Manevrada geri tuşu → duraklatıyor ("Olduğunuz yerde kalın"), "Baş dönmesi geçti / Devam et / Kendimi
  kötü hissediyorum" seçenekleri var. Baş dönmesini işaretleyip bitirmeyi "unuttum" → hatırlatmalar, 2 dk'da manevra durdu ve
  hekime yönlendirdi. Kulak sorusuna "Evet" → onay ekranı → yönlendirme → yeni atak kilitli; iki adımlı "hekimim söyledi" onayı var.
- **Hasta raporu (hekime gidecek):** Adım adım süre, hedefte kalma, sapma, belirti aralıkları. Ama aşağıdaki eksikler var.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Yüksek | Reçete içe aktarma; `core/prescription.ts:4-8`, `PrescriptionImport.tsx:31` | Elle üretilmiş, "Prof. Dr. Herhangi Biri" imzalı bir bağlantı sorunsuz kabul edildi; tanı kapısını açıp 7 gün/21 manevra verdi. Klinisyen modu da kimlik istemiyor, adımı herkes yazabilir. Bu bir medikolegal açık (adıma sahte talimat). | Kurumsal sürümde imzalı reçete (kurum anahtarı); o zamana kadar kartta "Bu bağlantı imzasızdır; yalnız muayenede elden aldığınız QR'ı kabul edin" uyarısı ve reçete kodunun yazılı rapora/HBYS notuna basılması (hekim doğrulayabilsin). | Evet (Playwright, A2) |
| 2 | Yüksek | Hasta raporu `History.tsx:84-103`; `prescription.ts:12-26` | Raporda hastayı tanıtan hiçbir şey yok (hasta kodu, doğum yılı); reçetede de hasta kodu taşınmıyor. WhatsApp'tan gelen raporu poliklinikteki NO-2611 kaydıyla eşleştiremem. | Reçeteye klinisyenin hasta kodunu ekleyin; hasta raporunun ilk satırı "Hasta kodu NO-2611 · reçete 30.10.2026 Doç. Dr. …" olsun. | Evet |
| 3 | Yüksek | Hekime geri bildirim (genel) | Hastanın sonucunu yalnız hasta "Hekime gönder"e basarsa öğreniyorum; reçete bitince ya da atak kapanınca hatırlatma yok, klinisyen modunda raporu alıp muayeneye bağlama yolu yok. | Reçetenin son gününde ve atak kapanınca hastaya "Raporu hekiminize gönderin" hatırlatması; raporun sonuna kısa bir QR/kod (ağsız) → klinisyen modunda "Hasta raporunu içe aktar" ile ilgili muayeneye "Kontrol" olarak eklensin. | Kısmen (kod incelemesi) |
| 4 | Orta | Hasta raporu "Belirti" sütunu `History.tsx:185` | Pozisyona girdikten ~1 s sonra işaretlediğim baş dönmesi raporda "17–35 s" görünüyor (adım başlangıcından, yönerge süresi dahil). Hekim bunu 17 s gecikme diye okur; gecikme tanısal bir özelliktir. Uzun dönmede "17–? s". | `vertigoSummary` (`runner.ts:763`) zaten pozisyona ulaşmaya göre hesaplıyor: sütunu "gecikme 1 s · süre 18 s" yazın; bitmeyende "≥2 dk, bitişi işaretlenmedi". | Evet |
| 5 | Orta | Rapor "Durum" `History.tsx:231-234`, `EpisodeFlow.tsx:373, 520` | Ham iç kodlar rapora yazılıyor: "Hekime yönlendirildi (ear)", "(VERTIGO_TOO_LONG)". | Tüm `endNote` değerlerini Türkçe cümleye çevirin (kırmızı bayrak id'si → soru metni). | Evet |
| 6 | Orta | Reçete formu `Exam.tsx:675-725`; HBYS notu | Klinisyen 14 günlük geçerliliği, bitiş tarihini ve "testsiz kısa yol yalnız bu atak için" kuralını reçete ekranında, basılı raporda ve HBYS notunda görmüyor. Ne yazdığımı tam bilmeliyim. | Reçete özetine "Geçerlilik: 13.11.2026'ya kadar · sonraki nükste uygulama iki tarafı test eder" satırı; aynısı HBYS notuna ve yazdırılan rapora. | Evet |
| 7 | Orta | Kırmızı bayraklar `core/safety.ts:26-108` | Yaşlıda en sık BPPV taklitçisi olan ortostatik hipotansiyon/presenkop yok ("cardiac" yalnız bayılmayı soruyor). AAO-HNSF 2017 (Bhattacharyya, Otolaryngol Head Neck Surg 2017;156(3S):S1-S47) ayırıcı tanıda ortostatik hipotansiyonu sayar. | "Baş dönmesi yalnız ayağa kalkınca, gözlerin kararması ya da bayılacak gibi olmayla mı geliyor?" sorusu (hekime yönlendirsin). | Kod incelemesi |
| 8 | Orta | Onam metni `Onboarding.tsx:185` | "Kendi sorumluluğumda" ifadesi hekimin sorumluluğunu kaldırmaz; metinde manevranın riskleri (bulantı/kusma, düşme, geçici kötüleşme, kanal değişimi) ve seçenekleri (klinikte manevra, kendiliğinden düzelme) yok. Hasta Hakları Yönetmeliği'ndeki aydınlatılmış onam için yetersiz. | 4–5 satırlık risk/seçenek özeti; onam tarihi ve metin sürümü rapora yazılsın. "Reçete" yerine "ev manevrası talimatı" (yasal reçeteyle karışmasın). | Evet (metin okundu) |
| 9 | Orta | Kendi beyanlı tanı yolu `Onboarding.tsx:244` | Reçetesiz kullanımda tanı tarihi isteğe bağlı; yıllar önceki bir tanı da kapıyı açıyor. | Tanı yılını zorunlu yapın; çok eski tanıda (ör. >2 yıl) bir kez "hekiminizle görüşmeniz önerilir" uyarısı gösterin (kilidi gevşetmeden). | Evet (kod) |
| 10 | Düşük | Süresi geçmiş reçete kartı `PrescriptionImport.tsx` | 20 günlük reçetede kart uyarı vermeden "kabul et" diyor; süresi geçtiğini yalnız ana ekran söylüyor. | Kartta "Bu reçetenin süresi doldu; yalnız tanı bilgisi kaydedilir, doz varsayılana döner" notu. | Evet |
| 11 | Düşük | Hasta raporu | Reçeteli kısa yolun kullanıldığı (hasta "muayeneden beri geçmedi" dedi, taraf testi yapılmadı) ve alt tip yanıtları raporda yok. 14 günlük toplam doz özeti de yok. | Raporun başına tek satırlık özet: "Kısa yol: evet · bu dönemde 1/15 manevra · 1. saat testi: —". | Evet |
| 12 | Düşük | Aşırı yönlendirme (tasarım) | Reçetesiz atakta iki taraf da "pozitif" ise doğrudan hekime; tek taraflı arka kanalda karşı taraf DH'da da hafif sersemlik sık. Bitişi işaretlemeyi unutmak da 2 dk'da kilide gidiyor. | Kuralı gevşetmeyin; pilotta yönlendirme oranını ve nedenini ölçün (RISK #16). Raporda "neden yönlendirildi" açık yazılsın (#5). | Hayır (tasarım değerlendirmesi) |

**Bilimsel not:** Günde 3 manevra dozu için KLINIK-INCELEME "birincil kaynaktan doğrulanamadı" diyor. Radtke A ve ark.
Neurology 1999;53:1358–1360'ta modifiye Epley'in hasta tarafından günde 3 kez, 24 saat pozisyonel baş dönmesi olmayana kadar
yapılması istenmişti (tam metinle doğrulanmalı). Bu, `MAX_PRESCRIBED_DOSE` (3/gün, 7 gün) ve "sabah testi negatifse kapat"
kuralıyla uyumlu. Protokolde bilimsel hata görmedim: apogeotropikte zayıf tarafın hasta oluşu, arka kanal kupulolitiazisinin
Bárány 2015'te "gelişmekte olan" sayılması, D vitamini kaynağı (Jeong SH ve ark. Neurology 2020) doğru. RISK #2'deki "yanlış
taraf Epley zararsız" ifadesi "genellikle zararsız; kanal değişimi bildirilmiştir" olarak yumuşatılmalı.

**Parametreler hakkındaki görüşüm:** Günde ≤3 ve ≤7 gün klinik olarak makul (Radtke 1999/2004). 14 günlük geçerlilik doğru bir
seçim, çünkü nükste taraf/tip değişebiliyor (Kim 2023). Kupulolitiazis ve çok kanallı tutulumda reçetenin engellenmesi bence şart.
Kırmızı bayraklar AAO-HNSF 2017 ayırıcı tanısını (AVS/inme, Ménière/VM, ani SNHL, travma) büyük ölçüde karşılıyor; ortostatik
soru eksik (#7). Yönlendirme ölçütleri eksik yönlendirmeye değil, bilinçli olarak aşırı yönlendirmeye eğilimli. Bunu doğru
buluyorum ama ölçülmeli.

## 4. Sevdiklerim
1. Reçete kapıları: taraf yalnız onaylı tanıdan, bulgu değişince tanı ve QR geçersiz, kupulolitiazis/çok kanallıda reçete yok,
   uyarılı/belirsiz tanıda ek onay. **Bunlar bozulmasın.**
2. Hasta güvenliği zinciri: her seansta kırmızı bayrak + "Yanlış dokundum" onayı, 2 dk'da durdurma, yönlendirme kilidi ve iki adımlı
   açılış, ataklar arası ortak doz sayımı, geri tuşunun duraklatması.
3. Gerçek hızda sesli akış: yönergeler pozisyon süresinden önce bitiyor, baş dönmesine göre süre uzuyor, son oturuşta "Acele
   etmeyin" deniyor. HBYS notu da ICD önerisiyle doğrudan kullanılabilir.

## 5. Memnuniyet
**7/10.** Klinik mantık ve güvenlik kapıları kılavuzlarla uyumlu ve özenli. Ama hastanın sonucunu güvenilir biçimde öğrenip
kaydıma bağlayamıyorum ve reçete imzasız, bu yüzden sorumluluğu taşıyacak durumda değilim.

**Hastalarıma önerir miyim?** Evet, koşullu olarak. Yalnız kendi muayene ettiğim, Dix-Hallpike ile tek taraflı arka kanal
kanalolitiazisi doğrulanmış, kontrendikasyonu olmayan ve yanında yardımcı olan hastalara, muayenede elden verdiğim QR ile öneririm.
Koşullarım: (a) etik kurul onaylı bir pilot çalışma kapsamında olması (cihaz onayı yok, gerçek telefonda açı doğruluğu henüz
ölçülmedi); (b) yazılı bilgilendirme ve onam; (c) 7. gün telefon/rapor kontrolü. Genel önerim veya reçetesiz kullanım için şimdilik
hayır. #1–#3 çözülürse polikliniğimde rutin kullanmayı düşünürüm.
