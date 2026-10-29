# 06 — İşitme kaybı ve erişilebilirlik (Hasan Bey, 64)

## 1. Kim olduğum ve ne denedim
İki kulağında ileri işitme kaybı olan, işitme cihazı kullanan 64 yaşında bir odyoloji hastasıyım. Yatarken cihazımı
çıkarıyorum ya da cihaz yastığa değip ötüyor. Gözüm biraz zayıf, elim titriyor. Telefon alnımdayken ekranı göremiyorum,
sesli yönergeleri de çoğu zaman duyamıyorum.

Denenen akışlar (Playwright, `http://localhost:4180/`, demo sensör). Ekran görüntüleri ve betikler
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/personas/06-isitme-erisilebilirlik/` klasöründe:
- Kurulumda "sesli yönergeleri duyamıyorum" kutusunu dürüstçe işaretledim, sonra ana ekrana döndüm (`03-isitme-kapi-kilit.png`, `04-isitme-ana-kilitli.png`).
- Tam akışı (kırmızı bayrak, kalibrasyon, Epley) üç kez çalıştırdım: **Pixel 7**, **iPhone** (`navigator.vibrate` kaldırılarak)
  ve **Çok büyük yazı + koyu tema + hareket azaltma**. Her ses, ton ve titreşim olayını zaman damgasıyla kaydettim (`cues-android.json`, `cues-iphone.json`).
- Titreyen el denemeleri: kırmızı bayrakta çift dokunuş, alışkanlıkla hep "Hayır" deme, ekranın ortasına ve sol üstüne
  kör dokunuş, baş dönmesi düğmesine 250 ms arayla iki dokunuş (gerçek hız, `run2.mjs`).
- Erişilebilirlik denetimi: her ekranda `ariaSnapshot()` (`aria-*.yml`), WCAG kontrast hesabı, 44 px altındaki hedefler ve Tab sırası.

## 2. En büyük 3 engel
1. **Kurulum beni dürüst cevabım yüzünden tamamen dışarıda bırakıyor, bir yol da göstermiyor.** `hearing` kontrendikasyonu
   (`src/core/safety.ts:150`) işaretlenince kapı kapanıyor ve yalnızca genel bir metin çıkıyor: "İşaretlediğiniz durum nedeniyle… hekiminize danışın".
   Yardımcıyla yapma, Bluetooth üzerinden işitme cihazına ses aktarma ya da kulaklık gibi seçenekler hiç sunulmuyor. Bunun
   aksine `mobility` maddesi "yanımda yardım edecek kimse yok" koşuluyla yazılmış. Sonuç: odyoloji hastalarının çoğu ya
   uygulamayı bırakacak ya da kutuyu işaretlemeden, hiçbir uyarlama olmadan devam edecek. İkincisi daha tehlikeli.
2. **Ses duyulmayınca manevrada "ne yapmalıyım" ve "ne zaman" bilgisi yok, iPhone'da neredeyse hiçbir şey kalmıyor.**
   Kayıtlara göre Epley'de 20 sesli mesaja karşılık Android'de yalnız 8 titreşim, iPhone'da 0 titreşim var. **Yeni adımın
   başladığını, düzeltme ipuçlarını, sayımı, "süre doldu ama baş dönmesi sürüyor" uyarısını ve duraklatmayı yalnız ses bildiriyor.**
   Pozisyon bozulunca Android'de 3 kısa titreşim geliyor, iPhone'da ise yalnız ses. Kalibrasyonun "tavana bakın" adımında
   da ne ton ne titreşim var (`Calibrate.tsx:114`). Bu yüzden duymayan kullanıcı ne zaman başını kaldıracağını bilemiyor ve ölçüm başarısız oluyor.
3. **Titreyen el, yanlış kayıtlara ve yönlendirme kilidine yol açıyor; bunu fark etmenin bir yolu da yok.**
   - Kırmızı bayrak sorularında "Hayır"a 120 ms arayla iki kez dokundum. Uygulama `continuous` ve `neuro` sorularını birden
     geçti, yani inme sorusu okunmadan yanıtlandı. Sebep, sorunun dokununca hemen değişmesi ve düğmenin aynı yerde kalması (`EpisodeFlow.tsx:429-436`).
   - Son soruda (`same`) güvenli yanıt "Evet". Önceki 10 soruda "Hayır" dedikten sonra alışkanlıkla yine "Hayır"a bastım.
     Atak hekime yönlendirildi ve yeni atak "Önce hekiminizle görüşün" kilidine düştü (`30-aliskanlik-hayir.png`, `31-kilit-sonra.png`).
   - Hazır ekranı "ekranın **herhangi bir yerine** dokunun" diyor (`RunnerView.tsx:344`). Oysa ekranın ortasına dokunmak
     hiçbir şey yapmıyor, yalnız alttaki düğme çalışıyor. Sol üste kör dokunuş ise **sessizce duraklatıyor**. Duraklama sırasında
     ne titreşim ne ton var ve 3 sn sonra bile ekran duraklatılmış haldeydi (`32-kazara-duraklat.png`). Duymayan hasta, durmuş bir sayaçla yatmaya devam eder.
   - Baş dönmesinin başlangıcı ve bitişi aynı 30 ms titreşimle bildiriliyor, ton da yok (`runner.ts:404,416`). Ne işaretlediğimi
     ayırt edemedim. Açık kalan bir işaret "bitişi işaretlenmedi" sonucuyla hekime yönlendirme üretti (demo koşusu, `12-android-sonrasi.png`).

## 3. Bulgular tablosu
| # | Ekran/yer | Sorun (gözlenen) | Öneri (somut) | Etki | Emek |
|---|---|---|---|---|---|
| 1 | Kurulum › kontrendikasyon (`safety.ts:150`) | "Duyup takip etmekte güçlük" kutusu işaretlenince kapı tamamen kapanıyor ve yol gösterilmiyor (`03-…png`). | Bunu kontrendikasyondan çıkarıp **uyarlama sorusuna** dönüştürün: "Sesli yönergeleri nasıl duyacaksınız?" Seçenekler: [Yanımda yardımcı olacak] [İşitme cihazıma Bluetooth ile aktarılıyor / kulaklık takacağım] [Duyamayacağım, yardımcım da yok]. Kapı yalnız üçüncü seçenekte kapansın ve "odyoloğunuzla birlikte yapın, odyolog modu" yönlendirmesi göstersin. | Yüksek | M |
| 2 | Kurulum › duyma kontrolü | "Sesi dene" (`Settings.tsx:280`) gerçekten duyulup duyulmadığını ölçmüyor. | **Duyma testi:** Telefon alında, hasta yatar konumdayken bir sayı söylensin ("dört"). Hasta, büyük düğmeli 1–4 seçeneğinden duyduğunu seçsin. Test her atak başında, yardımcı seçilmemişse zorunlu olsun. | Yüksek | M |
| 3 | Yürütücü › yeni adım (`runner.ts:startStep`) | Yeni adımın başlaması yalnız sesle bildiriliyor, titreşim ya da ton yok. | Ayırt edilebilir bir "**şimdi hareket et**" işareti ekleyin: titreşim `[500,250,500]`, ton olarak iki pes bip. | Yüksek | S |
| 4 | Yürütücü › pozisyon bozuldu, telefon kaydı | iPhone'da yalnız ses. Android'de 3 kısa titreşim var ama tekrarlamıyor. | `drift` ve `shock` olaylarına ton ekleyin. Düzelene kadar 3 sn'de bir titreşim ve ton tekrarlansın. | Yüksek | S |
| 5 | Yürütücü › arama | Yaklaşma sesi yalnız tonla veriliyor (`tones.ts:setGuidance`), titreşimde karşılığı yok. | Android'de aynı yakınlık değeriyle sıklaşan kısa titreşim verin (Ayarlar: "Yaklaşma titreşimi"). | Orta | S |
| 6 | Yürütücü › baş dönmesi işareti (`runner.ts:404,416`) | Başlangıç ve bitiş için aynı 30 ms titreşim var, ton yok. Fark edilemiyor. | Başlangıç: 2 kısa titreşim ve pes ton. Bitiş: 1 uzun titreşim ve tiz ton. Süre 30 ms yerine ≥150 ms olsun. | Yüksek | S |
| 7 | Yürütücü › duraklat (`RunnerView.tsx:451`, `runner.ts:332`) | Kör dokunuş sessizce duraklatıyor. Duraklatıldığını bildiren titreşim ya da ton yok. Odak alttaki düğmede kalıyor. | Hasta modunda duraklatmak için **1,5 sn basılı tutma** gereksin. Duraklayınca 4 kısa titreşim ve ton gelsin, 10 sn'de bir tekrarlansın. Diyalog açılınca odak "Devam et"e taşınsın. | Yüksek | S |
| 8 | Yürütücü › "herhangi bir yere dokunun" (`RunnerView.tsx:344`) | Söz verilen davranış yok: ekran ortasına dokunmak bir şey yapmıyor. | Hasta modunda yürütücünün gövdesinin tamamını baş dönmesi alanı yapın (başlık ve duraklatma hariç). Ya da metni "**ekranın alt yarısına** dokunun" diye düzeltin. | Yüksek | S |
| 9 | Yürütücü › bitiş | Adım bitti ve manevra bitti için aynı `stepDone` titreşimi kullanılıyor. | "Manevra bitti" için ayrı kalıp: `[800,200,200,200,800]`. | Orta | S |
| 10 | Yürütücü › "Süre doldu ama baş dönmesi sürüyor" (`runner.ts:668`) | Yalnız sesle bildiriliyor. Duymayan hasta bitişi işaretlemiyor ve atak gereksiz yere hekime yönlendiriliyor. | Bu uyarıya da titreşim ve ton ekleyin, 10 sn'de bir tekrarlansın. | Yüksek | S |
| 11 | Kalibrasyon (`Calibrate.tsx:96,114`) ve başlangıç kontrolü (`RunnerView.tsx:247,259`) | "Alnınıza yaslayın" ve "tavana bakın" komutları yalnız sesle veriliyor. | Komutlara titreşim ve ton ekleyin. Giriş listesine şunu yazın: "**2. titreşim/biplerde tavana bakın**". | Yüksek | S |
| 12 | Tonlar (`tones.ts`) | Ses kazancı 0,18 (yaklaşma sesi 0,12), frekanslar 880–1320 Hz. Yaşa bağlı işitme kaybında tizler ilk kaybolur. | Ayarlara "**Uyarı sesi yüksekliği**" (0,2–0,8) ve "**Pes uyarı sesleri**" (300–600 Hz) ekleyin. Uyarıları perdeyle değil **ritimle** ayırın, titreşim diliyle aynı ritimler olsun. | Yüksek | S |
| 13 | iOS sessiz anahtar | Web Audio tonları iOS'ta sessiz anahtarla susar. iPhone'da elde kalan tek kanal da kaybolabilir. | Destekleyen Safari'de `navigator.audioSession.type='playback'` ayarlayın. Hazır ekranında "Sessiz anahtar kapalı mı?" kontrolü gösterin. Faz B'deki yerel iOS titreşimini bu grup için öne alın. | Yüksek | S |
| 14 | Yürütücü (hasta modu) ekranı | Düzeltme ipucu ("Başınızı biraz daha sağa çevirin") ekranda **görünmüyor**, yalnız klinisyen modunda yazıyor (`RunnerView.tsx:495-517`). Yardımcı neyin yanlış olduğunu okuyamıyor. | **Altyazı satırı** ekleyin: söylenen her cümle büyük harfle ekranda kalsın ("Son söylenen: …"). Yardımcı da, sonradan bakan hasta da okuyabilir. | Yüksek | S |
| 15 | Hazır ekranı › yardımcı | Yardımcı için bir mod yok. Kılavuzda yalnız "yanında biri olması önerilir" yazıyor (`KULLANIM-KILAVUZU.md:31`). | "**Yardımcıyla yapıyorum**" anahtarı ekleyin: büyük yazılı yönergeler (`clinician` metinleri sade Türkçeye çevrilerek), görünür ipucu, yardımcı için anlaşmalı el işareti ("Baş dönmesi başlayınca elinizi kaldırın, yardımcınız dokunsun"). | Yüksek | M |
| 16 | Hazır ekranı › görsel önizleme | Yalnızca yatak çizimi ve teknik bir özet var ("kanalit repozisyon", "Dix-Hallpike pozisyonundan… 90°"). Manevrayı adım adım görmenin yolu yok. | Hazır ekranına ve deneme manevrasına "**Adımları resimle gör**" ekleyin: her adım için çizim, kısa başlık, bekleme süresi ve o adımın titreşim işareti. Bir de yazdırılabilir **başucu kartı**. | Yüksek | M |
| 17 | Titreşim dili | Kalıplar hiçbir yerde öğretilmiyor. "Telefon titreyecek" deniyor, o kadar. | Ayarlara ve deneme manevrasına "**Titreşim/bip dili**" kartı ekleyin: 5 işaret, her birinin yanında "Dene" düğmesi. Deneme manevrasında bu kart zorunlu ilk adım olsun. | Yüksek | S |
| 18 | Hazır ekranı (iPhone) | Metin "telefon titreyecek" diyor, altında da "titreşim desteklenmiyor" yazıyor (`17-iphone-manevra-hazir.png`). Çelişkili, ikinci not da soluk (kontrast 4,12). | iPhone'da metni değiştirin (bkz. §5). Uyarıyı turuncu kart olarak gösterin. | Orta | S |
| 19 | Kırmızı bayrak (`EpisodeFlow.tsx:429`) | Çift dokunuş iki soruyu birden geçiyor (`continuous` → `headache`). | Soru değişince yanıt düğmelerini **600 ms** pasif tutun (görsel olarak da belli olsun). Düğmeler bu sırada ekranda aynı yerde durmasın. | Yüksek | S |
| 20 | Kırmızı bayrak › `same` (`safety.ts`) | Güvenli yanıtın yönü yalnız bu soruda tersine dönüyor ("Evet"), alışkanlıkla "Hayır" kilit üretiyor. | Soruyu aynı yöne çevirin: "Bu baş dönmesi, hekiminizin daha önce BPPV dediği baş dönmesinden **farklı** mı?" (Evet → durdur). Durdurma kuralı aynen kalır. | Yüksek | S |
| 21 | Kırmızı bayrak › durdurucu yanıt | Tek bir yanlış dokunuş atağı hekime ya da acile yönlendirilmiş olarak kaydediyor. | Durdurucu yanıttan sonra bir onay ekranı gösterin: "‘Evet’ dediniz: <soru>. Doğru mu?" [Evet, doğru] [Yanlış dokundum]. Durdurma onaylanınca aynen uygulanır. | Orta | S |
| 22 | Kırmızı bayrak › `ear` | Kalıcı işitme kaybı olan kişi "İşitme kaybı var mı?" sorusunda tereddüt ediyor. | Soruya şu açıklamayı ekleyin: "Uzun süredir bilinen işitme kaybınız sayılmaz; **yeni ya da birden kötüleşen** işitme kaybını soruyoruz (cihazla bile daha az duyuyorsanız)". | Orta | S |
| 23 | Ana ekran › "Düzenle" bağlantısı | Dokunma hedefi 22 px yüksekliğinde, WCAG 2.5.8'in 24 px sınırının altında. | `btn secondary` düğmesine çevirin (≥48 px). | Orta | S |
| 24 | Ayarlar › onay kutuları | Yerel onay kutuları 13×13 px, az gören biri için zor seçiliyor (`29-ayarlar.png`). | `choice check` bileşenini kullanın (24 px işaret, 60 px satır). | Orta | S |
| 25 | Kontrast (açık tema) | `--muted` rengi `--surface-2` üzerinde 4,20:1 ("Soru 1/11", "Başlat'a basınca…", "Çene göğse"). Seçenek alt yazıları 3,86:1. "Pozisyon aranıyor" pilli 4,46:1. | `--muted`'ı `#5b6676`, `--warn`'ı `#9a4a06` yapın. | Orta | S |
| 26 | Kontrast (koyu tema) | Ana ekrandaki "112" düğmesinde beyaz yazı `#f87171` üzerinde **2,77:1**. | Koyu temada `.btn.danger` için metni `#1a0505` yapın ya da arka planı `#b91c1c` yapın. | Orta | S |
| 27 | Erişilebilirlik ağacı | `HangBar` (`Gauges.tsx:114`) ve `StepDots` öğelerinde `aria-label`, rolü olmayan `div` üzerinde, dolayısıyla okunmuyor. HoldRing "— pozisyon" diye okunuyor. | `role="img"` ya da `role="progressbar"` ve `aria-valuenow` ekleyin. Halka için anlamlı etiket: "Sayaç: 30 saniye kaldı". | Düşük | S |
| 28 | Kurulum › pasif "Devam" | Düğme, onay kutusu işaretlenmeden pasif kalıyor ve nedeni yazmıyor (kontrast 1,62). | Altına "Devam için yukarıdaki kutuyu işaretleyin" notu ekleyin. | Düşük | S |
| 29 | Hareket azaltma | `prefers-reduced-motion` doğru uygulanmış (`styles.css:919`), baş dönmesi düğmesindeki nabız animasyonu duruyor. **Olumlu.** | Ayarlara uygulama içi "Animasyonları azalt" anahtarı da ekleyin. | Düşük | S |
| 30 | Çok büyük yazı | Yürütücüde gösterge ve sayaç, baş dönmesi düğmesinin altında kalıyor (`26-xlarge-…png`). Yardımcı sayacı göremiyor. | Büyük yazıda talimatı 2 satıra kısaltıp "devamı" bağlantısı koyun. Sayaç halkasını başlığın yanına taşıyın. | Orta | S |

## 4. Hızlı kazanımlar (öncelik sırasıyla, her biri yarım günden az)
1. **Sese bağlı her uyarıya titreşim ve ton ekleyin:** yeni adım (#3), pozisyon bozuldu ve telefon kaydı (#4), "süre doldu ama
   baş dönmesi sürüyor" (#10), kalibrasyonda "tavana bak" (#11), duraklatma (#7). Değişiklik `runner.ts` ve `Calibrate.tsx` içinde birkaç `cues.push` satırı.
2. **Baş dönmesi işaretinin başlangıç ve bitişini ayırın** (#6). Başlangıç ve bitiş için ayrı kalıp ve ton kullanın, süreyi ≥150 ms yapın.
3. **Kazara duraklatmayı önleyin** (#7): hasta modunda basılı tutma isteyin. Duraklayınca tekrarlayan titreşim ve ton verin.
4. **Kırmızı bayrak sorularında 600 ms giriş kilidi ve `same` sorusunun yönü** (#19, #20). Güvenlik kuralları aynen kalır.
5. **Altyazı satırı** (#14): son söylenen cümle ve düzeltme ipucu ekranda büyük yazıyla kalsın.
6. **Uyarı sesi yüksekliği ve pes ton seçeneği**, ayrıca iOS'ta `audioSession` (#12, #13).
7. **"Herhangi bir yere dokunun" sözünü doğru yapın** (#8): baş dönmesi alanını büyütün.
8. **Kontrast belirteçleri ve küçük hedefler** (#23, #25, #26): `styles.css` içinde 3 renk değişikliği, ayrıca "Düzenle" düğmesi.

Hızlı kazanım sayılmayan ama bu kullanıcı kitlesi için en değerli iş: **#1 ve #2, kontrendikasyonun yerine uyarlama sorusu ve
duyma testi; #15 yardımcı modu; #16 adım adım resimli önizleme.** Bu üçü olmadan odyoloji kliniklerinin hastaları ya dışarıda kalır ya da korumasız kullanır.

## 5. Önerilen yeni metinler (önce → sonra)
**Kontrendikasyon maddesi** (`safety.ts:150`)
- Önce: "Telefondan gelen sesli yönergeleri duyup takip etmekte güçlük çekiyorum."
- Sonra: Bu madde kontrendikasyon listesinden çıkar ve ayrı bir ekran olur.
  > **Sesli yönergeleri nasıl duyacaksınız?** Manevrada telefon alnınızda olur, ekranı göremezsiniz. Yönergeler sesle, bip sesiyle ve (Android'de) titreşimle gelir.
  > ( ) Telefonun sesini rahat duyarım.
  > ( ) İşitme cihazım telefona Bluetooth ile bağlanıyor ya da kulaklık takacağım. *Yan yatarken yastık tarafındaki cihazı çıkarın; üstte kalan kulaktaki cihaz yeterlidir.*
  > ( ) Duymakta zorlanırım; yanımda bir yardımcı olacak. *Yardımcınız ekranı okuyup size gösterecek.*
  > ( ) Duymakta zorlanırım ve yanımda kimse olmayacak. → *Bu durumda manevrayı odyoloğunuzla birlikte yapın. Odyoloğunuz DengeYol'un odyolog modunu kullanabilir.*

**Duyma testi** (yeni; atak başında, yardımcı seçilmemişse)
> Telefonu alnınıza yaslayın ve sırtüstü uzanın. Birazdan bir sayı söyleyeceğim. Doğrulunca duyduğunuz sayıya dokunun. [1] [2] [3] [4]
> Yanlışsa: "Sesi yeterince duyamadınız. Sesi açın, işitme cihazınızı bağlayın ya da yardımcınızla yapın."

**Hazır ekranı kartı** (`RunnerView.tsx:344`)
- Önce: "Her adımı sesli anlatacağım. Doğru pozisyona gelince "Tamam, böyle kalın" diyeceğim ve telefon titreyecek. Baş dönmesi başlarsa ekranın herhangi bir yerine dokunun, geçince yeniden dokunun."
- Sonra (Android): "Her adımı sesle anlatacağım. Duyamazsanız şu işaretleri izleyin: **2 uzun titreşim = şimdi sıradaki harekete geçin · 1 uzun = doğru, böyle kalın · tekrarlayan kısa titreşim = pozisyon bozuldu · 5 kısa = adım bitti.** Baş dönmesi başlarsa ekranın alt yarısına dokunun, geçince yine dokunun."
- Sonra (iPhone): "Bu telefonda titreşim yok. Uyarılar **ses ve bip sesleriyle** gelir: 2 pes bip = sıradaki harekete geçin, yükselen bip = doğru, böyle kalın. Duymakta zorlanıyorsanız **işitme cihazınızı Bluetooth ile bağlayın ya da yardımcınızla yapın.** Sessiz anahtarın kapalı olduğundan emin olun."

**Kalibrasyon giriş listesi, 3. madde** (`Calibrate.tsx:160`)
- Önce: "Ardından başınızı geriye yatırıp tavana bakın."
- Sonra: "Telefon kısa titreyince ya da **ikinci bip serisini** duyunca başınızı geriye yatırıp tavana bakın; ikinci titreşime kadar öyle kalın."

**Kırmızı bayrak `same`**
- Önce: "Bu baş dönmesi, daha önce hekiminizin BPPV tanısı koyduğu baş dönmesiyle aynı mı? …" (Hayır → durdur)
- Sonra: "Bu baş dönmesi, daha önce hekiminizin BPPV dediği baş dönmesinden **farklı** mı? (BPPV: yatarken, yatakta dönerken ya da yukarı bakarken başlar, kısa sürer.)" (Evet → durdur)

**Kırmızı bayrak `ear`**
- Sonra: "**Yeni** başlayan ya da **birden kötüleşen** işitme kaybı (işitme cihazınızla bile daha az duyuyorsanız), yeni kulak çınlaması, kulak ağrısı ya da akıntısı var mı? Yıllardır bilinen işitme kaybınız sayılmaz."

**Duraklatma sesi** (`runner.ts:332`)
- Önce: "Duraklatıldı." (yalnız ses)
- Sonra: "Duraklatıldı. Devam etmek için ekrandaki Devam düğmesine dokunun." Ses, 4 kısa titreşim ve ton birlikte gelsin, 10 sn'de bir tekrarlansın.

**Baş dönmesi işareti** (`runner.ts:409`)
- Önce: "Baş dönmesi işaretlendi. Gözlerinizi açık tutmaya çalışın ve pozisyonu bozmayın. Geçince ekrana tekrar dokunun." (21 kelime)
- Sonra: "Baş dönmesi işaretlendi. Kıpırdamayın. Geçince yine dokunun." (Kısa cümleler işitme cihazıyla daha kolay anlaşılır. Göz önerisi deneme manevrasında öğretilebilir.)

**Hazır ekranı özeti** (`protocol.summary`, hasta modu)
- Önce: "Arka kanal BPPV tedavisi. Dix-Hallpike pozisyonundan başlayarak baş 90° karşı tarafa…"
- Sonra: "4 hareket, toplam yaklaşık 4 dakika: 1) Oturup başınızı sağa çevirin. 2) Sırtüstü yatın. 3) Başınızı sola çevirin. 4) Sola dönün, yüzünüz yere baksın. Sonra oturun. [Adımları resimle gör]"

## 6. Yapmamamız gerekenler
- **İşitme maddesini hiçbir uyarlama koymadan silmeyin.** Kapı gevşerse duymayan, ekranı da göremeyen kullanıcı yatarken hiçbir
  geri bildirim almaz. Kapıyı kaldırmak yerine yardımcı, Bluetooth ya da duyma testi koşulları getirin.
- **Yönü titreşimle anlatmaya çalışmayın** ("sağa 2, sola 3 titreşim"). Baş dönmesi sırasında sayı saymak gerçekçi değil.
  Titreşim yalnız **ne zaman** bilgisini taşısın (hareket et, kal, bozuldu, bitti). **Ne yapılacağı** bilgisi önceden resimli önizlemeyle ve yardımcıyla öğrenilsin.
- **Çok sayıda titreşim kalıbı eklemeyin.** 5 kalıbın üstü akılda kalmaz ve yaşlı biri için birbirine karışır. Kalıpları ritimle ayırın, tonlarla aynı ritmi kullanın.
- **Yanıp sönen ekran ya da flaş ışığı kullanmayın.** Ekran dışa bakıyor ve hasta görmüyor. Baş dönmesi olan biri için de rahatsız edici ve tetikleyici olabilir.
- **Hasta modunda baş dönmesi alanını küçültmeyin, birden çok küçük düğme eklemeyin.** Titreyen el ve kör dokunuş için tek, büyük ve basılı tutma gerektirmeyen bir alan kalmalı.
  Basılı tutma yalnız duraklatma gibi kazara tetiklenmemesi gereken işlerde kullanılsın.
- **Konuşmayı hızlandırıp kısaltmak için uyarı cümlelerinden güvenlik içeriğini çıkarmayın** ("yavaşça oturun", "baş dönmesi geçene kadar bekleyin").
  Kısaltın ama anlamı koruyun.
- **Altyazıyı yalnız hasta moduyla sınırlamayın.** Odyolog modunda da işitme cihazlı hasta ekranı klinisyenle birlikte görebilir.
