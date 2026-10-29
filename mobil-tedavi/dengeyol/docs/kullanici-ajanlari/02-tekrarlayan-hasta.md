# 02 — Tekrarlayan hasta (Mehmet Bey, 45, iPhone 13)

## 1. Kim olduğum ve ne denedim
Yoğun bir satış müdürüyüm. Yılda 2–3 kez **sol arka kanal** BPPV atağı geçiriyorum. Odyoloğum bir kez Epley yaptı ve QR reçete verdi.
Teknolojiyle aram iyi ama sabırsızım. Atak geldiğinde "hemen manevrayı yapayım, 5 dakikada bitsin" istiyorum. İkinci ve üçüncü kullanımda
aynı uzun yolu yeniden yürümek beni yoruyor.

Denediğim akışlar (Playwright, `devices['iPhone 13']`, demo sensör, **timeScale 1 = gerçek zaman**, sesli yönerge açık). Betikler ve ekran
görüntüleri `scratchpad/personas/02-tekrarlayan-hasta/` altında:
- **S1**: Reçete bağlantısıyla kurulum (sol, Epley, günde 3 / 3 gün) → ilk atak → 15 sn baş dönmesi işaretli Epley → bekleme ekranı → uygulamayı kapatıp yeniden açma.
- **S2**: 140 gün sonra ikinci atak (reçete ve eski atak kayıtlı) → Epley → 30 dk tekrar testi → ertesi sabah testi → Geçmiş → Rapor.
- **S3**: iPhone'a özgü durumlar: titreşim yok (`navigator.vibrate` silindi), hareket izni reddi (iOS `requestPermission` → `denied`),
  alındaki telefona ekranın ortasından körlemesine dokunma.

### Ölçümler (gerçek zaman; insan okuma süresi ayrıca tahmin edildi)
| Akış | Dokunuş | Makinenin beklettiği süre | Gerçekçi toplam (okuma dahil) |
|---|---|---|---|
| QR ile kurulum | 7 | ~3 sn | ~2 dk (11 maddelik uygunluk listesini okumak) |
| Atak: "Baş dönmem başladı" → manevranın 1. adımı | **16** (1 + 11 soru + 2 kalibrasyon + 1 taraf + 1 Başlat) | 33 sn (kalibrasyon 19 sn, Başlat → 1. adım 11 sn) | **1 dk 40 sn – 2 dk** (11 soru, 1069 karakter) |
| Epley'in kendisi (15 sn baş dönmesiyle) | 2 (baş dönmesi başladı / geçti) | **4 dk 43 sn** ("Başlıyoruz"dan "Manevra tamamlandı"ya kadar) | ~4 dk 45 sn |
| Atak oturumu toplamı | 20 | | **~6,5–7 dk** |
| 30 dk tekrar testi | 5 | 31 sn hazırlık + 2 dk 13 sn test | ~3 dk |
| Sabah testi | **16** (11 soru yeniden) | 32 sn + 2 dk 13 sn | ~3,5 dk |
| **Bir atak döngüsü** | **41** | | **~13 dk**, 3 tam kalibrasyon, 22 güvenlik sorusu |

**İkinci kullanım birinciyle birebir aynıydı** (S1 ve S2'de 16 dokunuş ve 33 sn). Uygulama hiçbir şeyi "hatırlayıp kısaltmıyor".
Kayıtlı kalibrasyon (`patient.calibration`) yazılıyor ama hiç kullanılmıyor (`EpisodeFlow.tsx:147`, `:486-491`).

## 2. En büyük 3 engel
1. **iPhone'da veri kaybı ve reçete kopukluğu.** QR'ı iPhone kamerasıyla okutunca bağlantı Safari'de açılır. Reçete Safari'nin
   `localStorage`'ına yazılır (`PrescriptionImport.tsx:25-41`, `store.ts`). Bu kullanıcı için iki bilinen WebKit davranışı devreye girer:
   (a) Safari, 7 gün etkileşim olmayan sitelerin betikle yazılmış depolamasını siler. Yılda 2–3 atak yaşayan biri sonraki atağa geldiğinde
   reçetesini, kurulumunu ve geçmişini kaybetmiş olur. (b) "Ana Ekrana Ekle" ile kurulan uygulamanın depolaması Safari'ninkinden ayrıdır.
   Bu yüzden Safari'de kabul edilen reçete ana ekran uygulamasında görünmez. Uygulamada "ana ekrana ekleyin" diyen tek bir satır yok
   (`grep` ile arandı) ve uygulama içinde "reçete bağlantısını yapıştır" seçeneği yok. Atak anında "Kuruluma başla" ekranını görmek
   (s1-06'nın reçetesiz hali) beni uygulamayı bıraktırır. *(Gerçek cihazda doğrulanmalı; WebKit'in bilinen politikası.)*
2. **Her atakta aynı 16 dokunuş ve iki kez "telefonu alnına koy".** 11 güvenlik sorusu tek tek gelir (s1-07). Ardından tam kalibrasyon
   yapılır ve sonunda "Başınızı düzeltip telefona bakabilirsiniz" denir (`Calibrate.tsx:133`). Telefonu indirip "Devam" ve "Evet, sol taraf"
   dokunuşlarını yaparım, "Başlat"a basarım. Hemen ardından ses yine "Telefonu ekranı dışa bakacak şekilde alnınıza yaslayın…" der
   (`RunnerView.tsx:247`). Konuşma kaydında bu iki cümle 0,8 sn arayla geldi (S1: 23.8 sn → 24.6 sn). Sabah testinde 11 soru yeniden sorulur.
3. **Hatırlatma yok, 30 dk ve sabah testi kaçar.** Bitiş ekranı yalnız "20:35 civarında ana ekrandan tekrar testini yapın" der (s1-14).
   Uygulama kapanınca (s1-16) hiçbir şey hatırlatmaz. Uygulama açık kalsa bile saat gelince ses çıkmaz, yalnız düğme belirir
   (`PatientHome.tsx:181-191`). Benim gibi biri iyileşince "Atak geçti, kapat"a basar. Bu düğme onay istemeden atağı kapatır
   (`PatientHome.tsx:262`) ve iki tekrar testi de yapılmamış olur.

## 3. Bulgular
| # | Ekran/yer | Sorun (gözlenen) | Öneri (somut) | Etki | Emek |
|---|---|---|---|---|---|
| 1 | Reçete içe aktarma, depolama (`PrescriptionImport.tsx:40`, `store.ts`) | iOS'ta reçete Safari'de kalıyor. 7 günlük silme ve PWA ile depolama ayrımı var. Ana ekrana ekleme rehberi yok. | Safari'de ve `!navigator.standalone` iken: reçete kabulünden sonra ve ana ekranda "iPhone'da kalıcı olması için: Paylaş → Ana Ekrana Ekle" kartı gösterilsin. Kart "Reçete kodunu kopyala" düğmesi içersin. Ana ekran uygulamasında "Reçete bağlantısını yapıştır" alanı olsun (Ana ekran ve Ayarlar). `navigator.storage.persist()` çağrılsın. | Yüksek | M |
| 2 | Güvenlik soruları (`EpisodeFlow.tsx:429-451`) | 11 ayrı ekran, 11 dokunuş, ~1 dk. Sabah testinde yine 11. | Üç ekran olsun: **(1) Acil belirtiler** (5 madde liste halinde: "Hiçbiri yok" / "Biri var") → (2) **Hekim gerektirenler** (5 madde, aynı düzen) → (3) **"Aynı baş dönmesi mi?"** sorusu. "Biri var" seçilince işaretleme listesi açılır ve aynı durdurma mantığı çalışır. Varsayılan yanıt olmaz, maddeler önceden işaretlenmez. | Yüksek | M |
| 3 | Kalibrasyon + Başlat (`EpisodeFlow.tsx:486-491`, `RunnerView.tsx:235-274`) | Her seansta tam kalibrasyon yapılıyor (19 sn, 2 dokunuş). Ardından ayrıca alına yerleştirme kontrolü geliyor (11 sn). Telefon iki kez alına konuyor. | Kayıtlı `calibration.sign` varsa ayrı "Telefonu tanıtma" ekranını atla. Başlat'tan sonra **tek sesli dizi** olsun: alına yasla → dik dur → **her zaman** tavana bak (yön ve ekran yönü yeniden hesaplanır) → manevra. "Tavana bak" adımı atlanmamalı, çünkü yalnız dik duruş ölçümü ekranın içe ya da dışa dönük olduğunu ayırt edemez. | Yüksek | M |
| 4 | Taraf onayı (`EpisodeFlow.tsx:176-184`, s1-11) | Kalibrasyondan sonra soruluyor. Telefonu alından indirmeyi gerektiren ek bir ekran. | Taraf onayını güvenlik sorularının hemen ardına, kalibrasyondan önceye taşı. İsteğe bağlı olarak "aynı mı" sorusuyla tek ekranda birleştir (bkz. §5). | Orta | S |
| 5 | Yürütücü, baş dönmesi alanı (`RunnerView.tsx:344`, `:545-560`, `styles.css:754`) | Metin "ekranın herhangi bir yerine dokunun" diyor. Oysa alan yalnız alttaki 108 px (664 px'lik ekranın %16'sı). S3'te ekranın ortasına dokunuş **kaydedilmedi** (`aria-pressed=false`, s3-02). | Hasta modunda, duraklat düğmesi dışında, `runner-body` üzerindeki her dokunuş `vertigoToggle` olsun. Duraklat yanlışlıkla basılmasın diye uzun basma (0,8 sn) istensin. Bu yapılamıyorsa metin "ekranın alt kısmına dokunun" olarak düzeltilsin. | Yüksek | S |
| 6 | Yürütücü hazır ekranı (s3-01) | iPhone'da aynı kutuda "telefon titreyecek" ve "Bu cihazda titreşim desteklenmiyor" birlikte yazıyor. | Titreşim yoksa ilk cümle "…diyeceğim ve kısa bir zil sesi çalacak" olsun. | Orta | S |
| 7 | Bekleme süresinin başlangıcı (`runner.ts:529-530`) | Sayaç yönerge konuşması bitene kadar başlamıyor. 1. adımda yatar pozisyon anında sağlandı ama "Tamam, böyle kalın" 17 sn sonra geldi (S1 konuşma kaydı 59.3 → 76.3 sn). Beş adımda toplam ~60 sn konuşma var, bunun ~40 sn'si boşa gidiyor. | Pozisyon doğrulandığı anda `holdSec` saymaya başlasın. "Tamam, böyle kalın" konuşma bitince söylensin ve adım konuşma bitmeden bitmesin. 45/60 sn bekleme ve 30 sn "geçtikten sonra" süreleri **aynen kalsın**. | Orta | M |
| 8 | Sesli yönergeler (protocols.ts Epley `say`) | İkinci kullanımda tam metinler uzun geliyor (1. adım 221 karakter ≈ 17 sn). Her adımda "dokunun… yeniden dokunun" tekrarlanıyor. | "Kısa yönerge" ayarı eklensin. Tamamlanmış ilk manevradan sonra varsayılan olarak açılsın. Metinler §5'te. | Orta | S |
| 9 | Adım arası ve sayım sesi (`runner.ts:288`, `:656`) | "Bu adım tamam. Bir sonraki hareket için hazır olun." dört kez aynen söyleniyor. "15 saniye. 30 saniye kaldı." cümlesinde iki sayı var, kulakla karışıyor. | "Tamam. Sırada: başı sağa çevirmek." ve "30 saniye kaldı." biçimine geçilsin. | Orta | S |
| 10 | Manevra sonu (`runner.ts:275` ↔ `EpisodeFlow.tsx:646`) | Ses "birkaç dakika" dinlenin diyor, ekran "10 dakika" diyor. Ekranı göremeyen kişi tekrar test saatini duymuyor. | Ses: "Manevra tamamlandı. On dakika oturarak dinlenin. Otuz dakika sonra, saat 20:35'te kısa bir test yapacağız." | Orta | S |
| 11 | 30 dk ve sabah hatırlatması (`PatientHome.tsx:177-221`, s1-14, s1-15) | Hiç hatırlatma yok. Sunucu olmadığı için Web Push da yok. | Bitiş ekranında ve sabah bekleme kartında **"Takvime hatırlatıcı ekle"** düğmesi olsun. Düğme cihazda `.ics` üretsin: 30 dk ve sabah 07:30 etkinlikleri, `VALARM` içinde. Bu ağ gerektirmez ve iPhone Takvim'i bildirim verir. Ek olarak, uygulama açık kalırsa saat gelince ton çalsın ve "Tekrar testi zamanı" denilsin. | Yüksek | M |
| 12 | "Atak geçti, kapat" (`PatientHome.tsx:262`) | Onay yok. İyileştiğini hisseden sabırsız kullanıcı tekrar testlerini atlar. | Tekrar testi bekliyorsa onay sorulsun: "Tekrar testi yapılmadı. Yine de kapatılsın mı?" Düğmenin adı "Teste gerek yok, atağı kapat" olsun. | Orta | S |
| 13 | Sabah testi sonucu (s2-08, s2-09) | Sabah testi negatif çıkınca "Ana ekrandan atağı kapatabilirsiniz" deniyor. Bu fazladan bir dokunuş, ayrıca ana ekranda iki ayrı kapat düğmesi var. | Sabah testi negatifse atak otomatik olarak "Düzeldi" kapansın ve "Geri al" bağlantısı gösterilsin. | Düşük | S |
| 14 | Tekrar testi kalibrasyonu (s2-03) | Manevradan 30 dk sonra aynı telefon, aynı kişi için yine 20 sn tam kalibrasyon yapılıyor. | Bulgu 3'teki tek sesli dizi burada da kullanılsın: Başlat → alına yasla → tavana bak → test. | Orta | S (3 yapılınca) |
| 15 | Hareket izni reddi (`Calibrate.tsx:79-85`, `:226-241`, s3-04) | iPhone'da çıkış yolu yok, yalnız "Geri" var. Metindeki "ayarlardan bu site için izni açın" yönergesi iOS'ta kolay bulunmuyor. | "Sayfayı yenile ve yeniden izin ver" düğmesi eklensin (`location.reload()`; sonraki dokunuşta iOS yeniden sorar). iPhone metni: "Hareket izni gerekli. Yenile'ye basın; çıkan pencerede **İzin Ver**'e dokunun." İzin ilk kurulumda bir kez, sakin bir anda istensin (§4). | Orta | S |
| 16 | Sessiz anahtar ve ses (`tones.ts`, `Calibrate.tsx:162`) | iPhone 13'te sessiz anahtar açıkken Web Audio tonları susar. Uyarı yalnız kalibrasyon girişinde küçük gri yazıyla var. | Ses motoru açılırken `navigator.audioSession.type = 'playback'` denensin (Safari 16.4+). Yürütücü hazır ekranında belirgin bir satır olsun: "iPhone'un yan tarafındaki sessiz düğmesi kapalı olmalı (turuncu çizgi görünmesin)." İlk "Başlıyoruz" sesinde ekranda "Sesi duymadıysanız durdurun" yazsın. | Yüksek | S |
| 17 | Ekranın kararması | iPhone'da varsayılan otomatik kilit 30 sn. 45 ve 60 sn'lik beklemelerde ekran kilitlenirse sayfa gizlenir ve manevra duraklar (`RunnerView.tsx:146-157`). Wake Lock desteği iOS sürümüne bağlı. | Wake Lock alınamazsa Başlat'tan önce kalın bir uyarı gösterilsin: "Ayarlar → Ekran ve Parlaklık → Otomatik Kilit: Asla (manevra bitince geri alın)". Duraklama olursa "Telefonun ekranı kapandı; devam etmek için ekrana bakın" diye sesli uyarı verilsin. | Orta | S |
| 18 | Ana ekran, atak yokken (s2-01) | İkinci kullanımda da büyük düğmenin alt yazısı "Güvenlik soruları → telefonu tanıtma → manevra". Süre ve taraf yazmıyor. | Tanıdık kullanıcıya şu gösterilsin: **"Sol Epley'i başlat"**, alt yazı "≈ 6 dk · 3 kısa soru grubu, sonra telefon alnına". | Orta | S |
| 19 | Geçmiş (s2-10) | Liste var ama özet yok. Tüm ataklar için tek rapor da yok. | Üstte özet kartı: "Son 12 ayda 2 atak · hep sol · ortalama 1 manevra · 1 günde düzeldi". Altında "Tüm geçmişi PDF yap" düğmesi. Sık nüks uyarısı da burada görünsün. | Orta | M |
| 20 | Rapor (s2-11, `History.tsx:169-193`) | Hasta için anlaşılmaz sütunlar var ("Ort. \|θ\| hata", "20–32 s"). Önemli bilgi (kaç manevra, hangi testte düzeldi) tabloların arasında kayboluyor. | En üste 3 satırlık hasta özeti konsun: "1 manevra · 30 dk testi: yok · sabah testi: yok → düzeldi". Adım tablosu "Klinisyen ayrıntısı" başlığı altında katlanır olsun. Baş dönmesi "yattıktan 20 sn sonra başladı, 12 sn sürdü" biçiminde yazılsın. | Düşük | S |
| 21 | Pozitif tekrar testi metni (`EpisodeFlow.tsx:384`) | "günde en fazla 3 manevra" sabit yazılmış. Reçete günde 1 ya da 2 diyebilir. | Metin `doseLimitsFor(profile).maxPerDay` değerinden üretilsin. | Düşük | S |
| 22 | Yürütücü hazır ekranı (s1-12) | En üstte teknik özet var ("kanalit repozisyon… baş 90° karşı tarafa…"). Başlat düğmesi uzun metnin altında. | İkinci kullanımdan itibaren özet ve "Ekranı görmeniz gerekmez" kutusu katlanır olsun. Görünür kalanlar: yastık çizimi, sessiz anahtar satırı ve Başlat. | Düşük | S |

## 4. Hızlı kazanımlar (öncelik sırasıyla, her biri yarım günden az)
1. **Baş dönmesi dokunuşu tüm ekranda çalışsın** (bulgu 5). Ekranı göremeyen kişi için tek kritik etkileşim bu.
2. **iPhone "Ana Ekrana Ekle" kartı ve `navigator.storage.persist()`** (bulgu 1'in rehber kısmı). Reçete kabulünden hemen sonra ve ana ekranda gösterilsin.
3. **Taraf onayını kalibrasyondan önceye taşı** (bulgu 4). Telefon bir kez daha az iner ve kalkar.
4. **`audioSession` + belirgin sessiz anahtar uyarısı + titreşim metni düzeltmesi** (bulgu 6, 16).
5. **"Takvime hatırlatıcı ekle" (.ics)** düğmesi, manevra bitişinde ve 30 dk testi negatif çıktığında (bulgu 11).
6. **"Atak geçti, kapat" için onay** (bulgu 12).
7. **Ses metinleri** (bulgu 9, 10): adım arası cümlede sıradaki hareketin adı, tek sayılı geri sayım, bitişte "10 dakika" ve test saati.
8. **Hareket izni reddinde "Yenile ve yeniden izin ver" düğmesi** (bulgu 15).

Bunlardan sonraki büyük kazanç (M): **gruplanmış güvenlik soruları + kayıtlı kalibrasyonla tek sesli yerleştirme dizisi + pozisyonda sayan
sayaç** (bulgu 2, 3, 7). Tahmini etki: manevraya kadar 16 dokunuş yerine 5, ~1 dk 50 sn yerine ~45 sn. Manevra 4:43 yerine ~4:05.
Atak oturumu ~7 dk yerine **~5 dk**. Güvenlik soruları, taraf onayı, "tavana bak" ölçümü, doz ve süre sınırları aynen kalır.

## 5. Önerilen yeni metinler
**Güvenlik soruları: üç grup** (maddeler `RED_FLAGS` metinleriyle aynı kalır, yalnız sunum değişir)
- Ekran 1 başlığı: *Önce: acil bir durum var mı?* — 5 acil madde listesi — düğmeler: **[Hiçbiri yok]** **[Biri ya da birkaçı var]**
- Ekran 2 başlığı: *Bunlardan biri var mı?* — 5 "hekime" maddesi — aynı iki düğme.
- Ekran 3 (aynı mı + taraf, isteğe bağlı birleşik):
  - Önce: "Bu baş dönmesi… aynı mı?" ardından ayrı ekranda "Baş dönmesi yine sol tarafa yattığınızda…"
  - Sonra: **"Bu baş dönmesi, odyoloğunuzun BPPV dediği baş dönmesiyle aynı mı: kısa süren ve yine SOL tarafa yatınca ya da dönünce başlayan?"**
    - "Evet, aynı ve sol taraf" → manevra
    - "Aynı ama taraftan emin değilim" → iki yönlü taraf testi
    - "Hayır, bu farklı" → `same` durdurması (hekim)

**Sesli yönergeler** (önce → sonra)
- Kalibrasyon sonu (`Calibrate.tsx:133`): "Kalibrasyon tamam. Başınızı düzeltip telefona bakabilirsiniz." → tek dizide: "Tamam, telefon tanındı. Telefonu alnınızda tutun; başlıyoruz."
- Adım arası (`runner.ts:288`): "Bu adım tamam. Bir sonraki hareket için hazır olun." → "Tamam. Sırada: başınızı sağa çevirmek." (sıradaki adımın `title` değeri)
- Sayım (`runner.ts:656`): "15 saniye. 30 saniye kaldı." → "30 saniye kaldı."
- Manevra sonu (`runner.ts:275`): "Manevra tamamlandı. Birkaç dakika oturarak dinlenin; ani baş hareketi yapmayın." → "Manevra tamamlandı. On dakika oturarak dinlenin. Saat 20:35'te kısa bir test yapacağız; hatırlatıcıyı ekrandan ekleyebilirsiniz."
- Kısa yönerge modu (ikinci kullanımdan itibaren; uzun metin Ayarlar'dan geri açılabilir):
  - ep-sit: "Yatağa oturun, yastık omuz hizasında. Başınızı sola, yarım omuz çevirin."
  - ep-1: "Başınız solda, hızla sırtüstü yatın; baş hafif sarksın. Baş dönerse ekrana dokunun."
  - ep-2: "Başı kaldırmadan yavaşça sağa çevirin."
  - ep-3: "Bütün vücutla sağ yanınıza dönün; burun yere baksın."
  - ep-4: "Sağ taraftan yavaşça oturun, çene hafif aşağı."

**Ekran metinleri**
- Yürütücü hazır ekranı (`RunnerView.tsx:344`): "…diyeceğim ve telefon titreyecek. Baş dönmesi başlarsa ekranın herhangi bir yerine dokunun…" → (iPhone) "…diyeceğim ve kısa bir zil çalacak. Baş dönmesi başlarsa telefona herhangi bir yerinden dokunun, geçince yeniden dokunun."
- Yeni satır: "iPhone: yan taraftaki sessiz düğmesi kapalı olmalı (turuncu çizgi görünmesin) ve ses açık olmalı."
- Manevra bitti (`EpisodeFlow.tsx:646`) altına düğme: **[Takvime hatırlatıcı ekle: 20:35 tekrar testi + yarın 07:30 sabah testi]**
- Ana ekran büyük düğme alt yazısı (`PatientHome.tsx:92`): "Güvenlik soruları → telefonu tanıtma → manevra" → "Sol Epley · yaklaşık 6 dakika · önce 3 kısa soru"
- Reçete kabulü sonrası (iPhone Safari): "Reçeteniz kaydedildi. **Bir sonraki atakta kaybolmaması için** DengeYol'u ana ekrana ekleyin: alttaki Paylaş düğmesi → *Ana Ekrana Ekle*. Ana ekrandaki DengeYol'u açınca reçetenizi bir kez daha yapıştırmanız gerekir." [Reçete kodunu kopyala]
- "Atak geçti, kapat" onayı: "30 dakika ve sabah testleri, kristallerin yerinde kalıp kalmadığını gösterir. Testi yapmadan kapatılsın mı?" [Teste devam] [Yine de kapat]
- Hareket izni reddi (iPhone): "Telefonun açıyı ölçebilmesi için hareket izni gerekli. **Yenile**'ye basın, ardından çıkan pencerede **İzin Ver**'e dokunun." [Yenile ve yeniden dene]

## 6. Yapmamamız gerekenler (bu kullanıcı için)
- **Güvenlik sorularını "geçen seferki gibi" diye önceden "Hayır" ile doldurmak ya da tanıdık kullanıcıda atlamak.** Gruplamak serbest; kaldırmak ya da varsayılan yanıt vermek değil.
- **Kayıtlı kalibrasyonla yalnız dik duruşu kontrol edip "tavana bak" adımını atlamak.** Telefon bu kez ekranı içe dönük takılırsa sağ/sol ters değerlendirilir.
- **Bekleme sürelerini (45/60 sn) ya da baş dönmesi sonrası 30 sn'yi "hızlı mod" adına kısaltmak, hasta moduna "adımı atla" eklemek.** Hız, konuşma ve tekrarlardan kazanılmalı.
- **Reçeteli kullanıcıda taraf onayını kaldırmak.** Bu soru taraf değişimini (yönlendirme) yakalayan tek kapı.
- **30 dk ve sabah testini isteğe bağlı göstermek ya da gizlemek.** Testler kalsın, yalnız hatırlatma kolaylaşsın.
- **Hatırlatma için hesap, bulut eşitleme ya da push sunucusu eklemek.** Takvim (.ics) ve cihaz içi çözümler yeterli.
- **Her açılışta "Deneme manevrası" önerisi ya da uzun tanıtım ekranları göstermek.** Tanıdık kullanıcı doğrudan büyük düğmeyi görmeli.
