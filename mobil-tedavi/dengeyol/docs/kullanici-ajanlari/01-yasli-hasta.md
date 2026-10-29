# 01 — Yaşlı hasta: Ayşe Hanım (72)

## 1. Kim olduğum ve denediğim akışlar

72 yaşında emekli öğretmenim. Pixel 7 kullanıyorum, yakın gözlüğüyle okuyorum, yazıyı büyütmeyi bilmiyorum, biraz da az
işitiyorum. KBB hekimi sağ arka kanal BPPV tanısı koydu. Sabah yataktan kalkarken başım döndü, midem bulanıyor, korkuyorum
ve evde yalnızım. Uygulamanın ayarlarına girmem.

Denediğim akışlar: Playwright, `devices['Pixel 7']` (412×839), demo sensör, ×20 hız. Söylenen her metni yakalamak için
`speechSynthesis.speak` kaydedildi.
Betik: `…/scratchpad/personas/01-yasli-hasta/ayse.mjs`, ekran görüntüleri: `…/personas/01-yasli-hasta/shots/`.
- Normal, Büyük ve Çok büyük yazıyla baştan sona: karşılama → kurulum (4 ekran) → ana ekran → 11 güvenlik sorusu →
  telefonu tanıtma → taraf onayı → Epley (2. adımda baş dönmesini işaretleme) → "Şu an nasılsınız?" → aktif atak ekranı
  (`normal-*`, `large-*`, `xlarge-*`).
- Hatalı ya da yarıda kalan durumlar:
  - Nörolojik soruya "Evet" (`redflag-01..03`).
  - Son soruda alışkanlıkla "Hayır" (`redflag-04`).
  - Baş dönmesinin geçtiğini işaretlemeyi unutma (`forget-01..03`).
  - Duraklatma menüsü ve Android geri tuşu (`interrupt-*`).
  - Kurulumda "sesli yönergeleri duymakta güçlük" maddesini işaretleme (`hearing-*`).
  - Deneme manevrası.
- Ölçümler:
  - Yazı boyutu ve kontrast: `getComputedStyle`.
  - Dokunma alanı: `boundingBox`.
  - Manevrada ekranın ortasına dokunma (`check.mjs`).

## 2. En büyük 3 engel

1. **Son güvenlik sorusunda yanıtın yönü tersine dönüyor; tek yanlış dokunuş uygulamayı kilitliyor.** İlk 10 soruda
   güvenli yanıt "Hayır". 11. soruda ("…aynı mı?") güvenli yanıt "Evet". Baş dönerken 10 kez üst üste "Hayır"a basan biri
   11. soruda da "Hayır"a basıyor. Sonuç "Manevra yapmayın" ekranı oluyor, atak "yönlendirildi" olarak kapanıyor ve bir
   sonraki denemede "Önce hekiminizle görüşün" kilidi çıkıyor (`redflag-04`, `redflag-03`; `safety.ts:94-100`,
   `EpisodeFlow.tsx:84,397-415`). Sorular sesle de okunmuyor. 11 soru ve 151 kelimeyi bulantılı haldeyken gözlükle okumam
   gerekiyor.
2. **"Baş dönmesi başladıysa dokunun" alanı, alnımdaki telefonda bulunamayacak kadar küçük ve sesli söz yanlış.**
   Ekrandaki ve sesli metin "ekranın **herhangi bir yerine** dokunun" diyor (`RunnerView.tsx:344`; protokol metinleri
   "ekrana dokunun"). Oysa yalnız alttaki 380×108 px'lik kutu çalışıyor, bu da ekranın %11,9'u. Ekranın ortasına dokununca
   hiçbir şey olmadı (`check.mjs`: `aria-pressed=false`). Telefon alnımdayken alt kenar kaşımın hizasında oluyor, dokunduğum
   yer çoğunlukla ortası. "Geçti" diye ikinci kez dokunmayı unutursam 120 sn sonra manevra güvenlik gerekçesiyle duruyor,
   atak hekime yönlendirilmiş sayılıyor ve uygulama kilitleniyor (`forget-01..03`; `runner.ts:473-487`). Bu süre içinde
   yalnız bir kez hatırlatma geliyor: "Süre doldu ama baş dönmesi sürüyor".
3. **Telefonu tanıtma adımı yalnız başıma doğru yapılamıyor.** Sesli yönerge 155 karakter, yani yaklaşık 12 sn sürüyor.
   Uygulama ise 7,5 sn bekleyip 3 sn geri sayıyor ve ses daha bitmeden ölçmeye başlıyor (`Calibrate.tsx:96-106`). Ben
   telefonu hâlâ alnıma yerleştirirken "Telefon ölçüm sırasında kıpırdadı" hatası çıkması çok olası. Ayrıca:
   - "Ekran dışa bakacak" sözünü anlamıyorum. Çizimde telefon yandan görünen yeşil bir çubuk; ekranın hangi yüzü olduğu
     belli değil (`normal-14`).
   - Telefonu manevra boyunca nasıl tutacağım hiç söylenmiyor: bir elle mi, bantla mı?
   - Tanıtma bitince "telefona bakabilirsiniz" deniyor. Ardından bir soru, uzun bir hazırlık ekranı ve "Başlat" geliyor,
     sonra telefonu **ikinci kez** alnıma koymam isteniyor (`RunnerView.tsx:247`).
   - Yastığı yerleştirme yönergesi telefon zaten alnımdayken veriliyor (`protocols.ts:271`).

## 3. Bulgular

| # | Ekran/yer | Sorun (gözlenen) | Öneri (somut) | Etki | Emek |
|---|---|---|---|---|---|
| 1 | Güvenlik sorusu 11 "same" (`safety.ts:95-100`) | Güvenli yanıtın yönü tersine dönüyor, alışkanlıkla basılan "Hayır" durdurup kilitliyor (`redflag-04`). | Bu soruyu en başa al ya da ayrı bir "onay" ekranı yap. Düğme etiketleri "Evet, aynı tür" / "Hayır, farklı" olsun. Diğer sorularda da "Hayır, yok" / "Evet, var" kullan. | Yüksek | S |
| 2 | Güvenlik soruları (`EpisodeFlow.tsx:429-451`) | 11 ayrı ekran ve 151 kelime, hiçbiri sesle okunmuyor. Evet/Hayır düğmeleri aynı görünüyor. | Soruları silmeden **3 ekrana grupla**: (a) acil belirtiler listesi (5 madde, "Hiçbiri yok" / "Biri var"), (b) hekime gerektiren belirtiler (5 madde), (c) "aynı baş dönmesi mi". Her ekran açılınca soruyu oku. Liste ekranında "Biri var"a basılınca hangisi olduğunu sor; kayıt ve rapor kesin kalsın. | Yüksek | M |
| 3 | Soru "anticoag" (`safety.ts:53-58`) | Koşullu ve bileşik soru. Aspirin kullanan ama başını çarpmamış biri ilk yarıya bakıp "Evet" der. | İkiye böl ya da şöyle yaz: "Kan sulandırıcı kullanıyorsanız: yeni bir baş ağrınız var mı ya da başınızı çarptınız mı? (Kullanmıyorsanız Hayır)". | Orta | S |
| 4 | Soru "fever" (`safety.ts:89`) | "…sıvı alamıyor musunuz?" olumsuz soru: "Hayır" mı "Evet" mi güvenli, belirsiz. Bulantılı kullanıcı için kritik. | Olumlu kur: "Bugün ateşiniz var mı ya da su içtiğinizde hemen kusuyor musunuz?" ("Evet" = durdur, diğerleriyle aynı yön). | Orta | S |
| 5 | Manevra – dokunma alanı (`RunnerView.tsx:545-560`, `styles.css:754`) | Yalnız alttaki %11,9'luk alan çalışıyor, ekranın ortasına dokunma yok sayılıyor. Metin "herhangi bir yerine" diyor. | Hasta modunda **ekranın tamamı** baş dönmesi düğmesi olsun. Duraklat yalnızca ✕/‖ ile açılsın (uzun basma ya da 2 sn basılı tutma). Kazara çift dokunuş için mevcut debounce yeterli. | Yüksek | S |
| 6 | "Geçti"yi işaretlemeyi unutma (`runner.ts:473-487, 663-670`) | 120 sn'de durdurma, yönlendirme ve kilit. Arada tek hatırlatma var (`forget-*`). | Durdurmayı koru. Baş dönmesi işaretliyken 30, 60 ve 90. sn'de sesle sor: "Baş dönmesi hâlâ sürüyor mu? Geçtiyse ekrana dokunun." Durdurma ekranına "Baş dönmem aslında geçmişti, dokunmayı unuttum" bilgisini rapora not düşen bir seçenek ekle; kilidi kaldırmasın, yalnız hekime bilgi versin. | Yüksek | S |
| 7 | Telefonu tanıtma zamanlaması (`Calibrate.tsx:96-121`, `RunnerView.tsx:247-250`) | Ses bitmeden ölçüm başlıyor: 155 kr ≈ 12 sn konuşmaya karşı 7,5 + 3 sn bekleme. "Tavana bakın"da da aynısı: 66 kr ≈ 5 sn konuşmaya karşı 3,2 sn bekleme. "Yavaş" konuşma hızında açık büyüyor. | Bekleme süresini sabit sayı yerine `utterance.onend` + 2 sn olarak hesapla (konuşma hızına duyarlı `estimateSpeechSec` de olur). Geri sayımı sesle söyle: "Üç, iki, bir". | Yüksek | S |
| 8 | Telefonu tanıtma – "ekran dışa" (`Calibrate.tsx:98,159`; `Illustrations.tsx:3`) | "Ekranı dışa bakacak" soyut bir ifade. Çizim yandan; ekran yüzü ayırt edilmiyor. | Metin: "Telefonun **arkasını** (kamera tarafını) alnınıza dayayın; ekran karşıdaki duvara baksın." Çizimi önden görünüş yap: alında telefon, ekranında büyük bir ok. | Yüksek | S |
| 9 | Telefonu tutma | Manevra boyunca telefonu nasıl tutacağım (el, bant) hiç söylenmiyor. Yatarken ve dönerken iki elim de lazım. | Tanıtma girişine bir satır ekle: "Telefonu bir elinizin avucuyla alnınıza bastırın; diğer elinizle yataktan destek alın. Varsa geniş bir saç bandı kullanın." | Orta | S |
| 10 | Akış sırası (`EpisodeFlow.tsx:183, 493-515`; `RunnerView.tsx:235-274`) | Tanıtma → "telefona bakın" → taraf sorusu → uzun hazırlık ekranı → Başlat → telefon tekrar alına. Telefon iki kez takılıyor, sesli yönerge bir kez daha geliyor. | Taraf onayını ve yatak/yastık hazırlığını tanıtmadan **önce** sor. Tanıtma "Kalibrasyon tamam" demeden doğrudan "Başlıyoruz"a bağlansın (telefon alında kalır). `checkMount` yalnız telefon alından alındıysa devreye girsin. | Yüksek | M |
| 11 | Epley 1. adım (`protocols.ts:271`) | Yastık yerleştirme yönergesi telefon alındayken veriliyor. | Yastık ve yatak hazırlığı tanıtmadan önceki hazırlık ekranına taşınsın; 1. adımın sesli metni kısalsın (bkz. §5). | Orta | S |
| 12 | Manevra hazır ekranı (`RunnerView.tsx:333-335`) | Başlık "Epley manevrası (kanalit repozisyon)", özette "Dix-Hallpike pozisyonu, 90°, gövdeyle birlikte…" gibi hekim dili var. Yatak çizimi normal yazıda 300×36 px, büyük yazıda **0 px** (görünmüyor) (`check.mjs`). | Hasta modunda başlık "Tedavi hareketleri (5 adım, yaklaşık 5 dakika)" olsun, özet gizlensin. `.illus` öğesine `flex-shrink:0` ver, çizim en az 120 px yüksekliğinde kalsın. | Orta | S |
| 13 | Sesli sayım (`runner.ts:649-658`) | "15 saniye. 30 saniye kaldı." aynı cümlede iki sayı var. Baş dönmesinin geçtiği işaretlenince "30 saniye daha bekleyin" deniyor, hemen ardından sayım "15 saniye kaldı" diyor (çelişki, `log-normal.txt`). | Yalnız "30 saniye kaldı" de. Kalan süreyi halkadaki gibi `max(kalanBekleme, baş dönmesi sonrası kalan)` üzerinden hesapla. | Orta | S |
| 14 | Sesli yönerge uzunluğu (`protocols.ts:283`) | 2. adım 221 kr ≈ 17 sn sürüyor. Asıl önemli bilgi ("başlarsa ekrana dokunun") en sonda, baş dönerken geliyor. | Kısa cümleler kur, önemli bilgi başta olsun; dokunma bilgisini ayrı ve kısa bir cümle olarak "Tamam, böyle kalın"dan sonra tekrarla (bkz. §5). | Orta | S |
| 15 | İşitme maddesi (`safety.ts:150`) | Hafif işitme kaybı olan ben bu maddeyi işaretleyince manevralar kapanıyor, gerekçe bile adıyla yazılmıyor (`hearing-01`). | Maddenin hemen yanına "Sesi dene" düğmesi koy; metin "Sesi en yükseğe açtığımda bile telefonun konuşmasını anlayamıyorum" olsun. Kapı ekranında hangi maddenin engel olduğunu adıyla yaz. | Orta | S |
| 16 | Uygunluk listesi (`Onboarding.tsx:264-290`) | 11 madde, 135 kelime, sayfa 1679 px (çok büyük yazıda 2173 px). Ankilozan spondilit, kifoskolyoz, karotis, instabilite gibi terimler var. "Hiçbiri" en altta kalıyor. | Halk diliyle yaz (bkz. §5). Gebelik ve 18 yaş maddelerini tek bir "Yaşınız" sorusundan türet. "Hiçbiri bana uymuyor" en üstte ve en altta olsun. | Orta | M |
| 17 | Kurulum 1 – onay (`Onboarding.tsx:190-200`) | Onay kutusu ekranın altında kalıyor; "Devam" soluk ve yapışık, metnin üstünü kapatıyor (`normal-03`). Devam neden basılmıyor, açıklanmıyor (beyaz/soluk yeşil kontrastı 2,35:1). | Ayrı onay kutusu yerine tek düğme: "Okudum, anladım – Devam". Ya da devre dışı düğmeye basılınca "Önce aşağıdaki kutuyu işaretleyin" deyip kutuya kaydır. | Orta | S |
| 18 | Yazı boyutu (`types.ts:138`, `styles.css:13,262`) | Varsayılan 17 px. `.small` 14,6 px ve gri `#6b7789` ile yazılıyor (kontrast 4,16:1, AA altı); önemli uyarılar bu stilde ("Sesi açık tutun…", "Başlat'a basınca…"). Yazı büyütme Ayarlar'da gizli. | Kurulumun ilk ekranında sor: "Yazılar rahat okunuyor mu? [Daha büyük yap]". `--muted` en az `#5a6577` olsun. Önemli uyarılar `.small muted` ile yazılmasın. | Orta | S |
| 19 | Ses kontrolü | Sesin açık olduğu ve duyulduğu hiç denetlenmiyor ("Sesi dene" yalnız Ayarlar'da). | Tanıtma girişinde: "Şimdi bir cümle söyleyeceğim. Duydunuz mu? [Evet, duydum] [Hayır]". "Hayır" seçilirse ses yükseltme yönergesi göster. | Yüksek | S |
| 20 | Durdurma sonrası ana ekran (`PatientHome.tsx:87-98`) | Yönlendirme ya da kilit sonrası ana ekran hâlâ büyük "Baş dönmem başladı" düğmesini gösteriyor; kilit ancak basınca çıkıyor (`forget-02`). | Kilit varken büyük düğmenin yerine "Hekiminizle görüşmeniz gerekiyor" kartı, rapor düğmesi ve 112 düğmesi gelsin. | Orta | S |
| 21 | "Atak geçti, kapat" (`PatientHome.tsx:262`) | Tek dokunuşla, onay sorulmadan atak kapanıyor. "Rapor"un hemen yanında. | Onay sor: "Atağı kapatmak istediğinize emin misiniz?" ya da düğmeyi alta, ayrı bir yere taşı. | Düşük | S |
| 22 | Kalibrasyon sonucu (`Calibrate.tsx:197-199`) | "Ekran yönü: dışa (önerilen). Eğiklik 0° (otomatik düzeltildi)" teknik dil. Ekran başlığı "Telefonu tanıtma", ses "Kalibrasyon tamam" diyor (iki ayrı ad). | Ekran ve ses: "Telefon başınızı tanıdı." Açı bilgisi yalnız klinisyen modunda gösterilsin. | Düşük | S |
| 23 | Manevra sonrası (`EpisodeFlow.tsx:646`) | "20:30 civarında tekrar testini yapın" yazıyor ama hatırlatma yok; yalnız yaşayan biri unutur. | "30 dakika sonra beni uyar" düğmesi ekle: sayfa açıksa ses ve titreşim, mümkünse yerel bildirim (sunucu gerekmez). | Orta | M |
| 24 | Ana ekran (`normal-09`) | Büyük düğme net. Ama alt yazı "Güvenlik soruları → telefonu tanıtma → manevra" ürkütücü ve teknik. "Deneme manevrası" baş dönmesi sırasında da aynı ağırlıkta görünüyor. | Alt yazı: "Size adım adım yardım edeceğim (yaklaşık 10 dakika)". Deneme düğmesi ikincil ve daha küçük olsun. | Düşük | S |
| 25 | Geri tuşu ve duraklatma (`interrupt-*`) | Android geri tuşu manevrayı onaysız kesip ana ekrana döndürüyor (kayıt "yarıda" düşüyor, "Ataka devam et" çıkıyor; makul). Duraklatma menüsü açık ve iyi. | Manevra sırasında geri tuşunu yakala ve duraklatma menüsünü aç (`popstate`). | Düşük | S |

## 4. Hızlı kazanımlar (öncelik sırasıyla, her biri yarım günden az)

1. Hasta modunda manevra ekranının **tamamını** baş dönmesi düğmesi yap (#5).
2. 11. sorunun düğmelerini "Evet, aynı tür" / "Hayır, farklı" yap ve tüm sorularda düğmeleri "Hayır, yok" / "Evet, var" diye
   etiketle (#1). Soru metnini ekrana gelince sesle oku (#2'nin S kısmı).
3. Telefonu tanıtmada ölçümü konuşmanın bitişine bağla, "üç, iki, bir"i sesle say (#7).
4. Baş dönmesi işaretliyken 30, 60 ve 90. sn'de "Geçtiyse dokunun" hatırlatması ekle (#6).
5. "Ekran dışa" yerine "telefonun arkası alnınıza değsin" de; telefonu nasıl tutacağımı söyle (#8, #9).
6. Tanıtma girişine "Beni duyuyor musunuz?" ses denetimini koy (#19).
7. Kurulumun ilk ekranında yazı büyütme seçeneği sun; `--muted` kontrastını yükselt; yatak çizimine `flex-shrink:0` ver
   (#18, #12).
8. Sesli sayımı "30 saniye kaldı" biçimine sadeleştir ve baş dönmesi sonrası bekleme ile tutarlı yap (#13).

## 5. Önerilen yeni metinler (önce → sonra)

**Güvenlik soruları – gruplu (her ekran sesle okunur)**
- Ekran 1. Önce: 5 ayrı acil soru. Sonra: "Şu an bunlardan **biri** var mı?
  • Yerinizden kıpırdamasanız da dakikalarca süren baş dönmesi
  • Çift görme, konuşma ya da yutma güçlüğü, yüzde/kolda/bacakta güçsüzlük ya da uyuşma
  • Yeni ve şiddetli baş ya da boyun ağrısı
  • Göğüs ağrısı, çarpıntı, bayılma
  • (Kan sulandırıcı kullanıyorsanız) yeni baş ağrısı ya da başınızı çarpma"
  Düğmeler: **[Hayır, hiçbiri yok]** **[Evet, biri var]**
- Ekran 2: hekime yönlendiren 5 madde, aynı biçimde.
- Ekran 3. Önce: "Bu baş dönmesi, daha önce hekiminizin BPPV tanısı koyduğu baş dönmesiyle aynı mı? (…)"
  Sonra: "Bu baş dönmesi, hekiminizin daha önce tedavi ettiğiyle **aynı türden** mi? Yatarken, yatakta dönerken ya da
  yukarı bakınca başlayıp kısa süren dönme." Düğmeler: **[Evet, aynı tür]** **[Hayır, farklı]**

**Telefonu tanıtma – giriş**
- Önce: "Telefon, başınızın açısını ölçmek için alnınıza yaslanacak. Önce 20 saniyelik kısa bir ayar yapacağız."
- Sonra: "Yatağınızın üstüne oturun. Telefonu alnınıza koyacağız ki başınızın nasıl durduğunu anlasın. Telefonun **arkası**
  alnınıza değsin, ekranı karşıya baksın. Bir elinizle alnınıza bastırın."

**Telefonu tanıtma – ses (Calibrate.tsx:98)**
- Önce: "Telefonu ekranı dışa bakacak şekilde alnınıza yaslayın. Telefonun üst kenarı başınızın tepesine doğru olsun. Dik
  oturun ve tam karşıya bakın. Kıpırdamayın."
- Sonra: "Telefonun arkasını alnınıza dayayın. Karşıya bakın. Hazır olunca saymaya başlayacağım." (2 sn) "Kıpırdamayın.
  Üç… iki… bir." (Ölçüm konuşma bittikten sonra başlar.)

**Tanıtma sonucu (Calibrate.tsx:133, 195-199)**
- Önce: "Kalibrasyon tamam. Başınızı düzeltip telefona bakabilirsiniz." / "Ekran yönü: dışa (önerilen)…"
- Sonra (akış yeniden sıralandıysa): "Telefon başınızı tanıdı. Telefonu alnınızda tutun, şimdi başlıyoruz."

**Hazırlık ekranı (RunnerView.tsx:344)**
- Önce: "…Baş dönmesi başlarsa ekranın herhangi bir yerine dokunun, geçince yeniden dokunun."
- Sonra: "Başınız dönerse **alnınızdaki telefona** bir kez dokunun. Geçince bir kez daha dokunun. Telefonun neresine
  dokunduğunuz önemli değil." (Ekranın tamamı düğme olduktan sonra.)

**Epley 1. adım – ses**
- Önce: "Yatağın üzerinde oturun. Yastığı, sırtüstü yattığınızda omuzlarınızın altına gelecek yere koyun. Başınızı sağa
  doğru yaklaşık 45 derece çevirin: çeneniz sağ omzunuza doğru yarı yolda olsun."
- Sonra (yastık hazırlığı önceki ekrana taşındıysa): "Başınızı sağa çevirin. Çeneniz sağ omzunuza doğru, yarı yola kadar."

**Epley 2. adım – ses**
- Önce: "Başınızın yönünü bozmadan hızla sırtüstü yatın. Başınız yastıktan geriye doğru hafifçe sarksın ve hâlâ sağa
  çevrili kalsın. Baş dönmesi olabilir, bu beklenen bir durumdur. Başlarsa ekrana dokunun, geçince yeniden dokunun."
- Sonra: "Şimdi hızla sırtüstü yatın. Başınız sağa dönük kalsın, yastıktan hafifçe geriye sarksın." Pozisyon tutunca:
  "Tamam, böyle kalın. Başınız dönebilir, bu normal. Dönerse telefona dokunun."

**Sayım (runner.ts:656)**
- Önce: "15 saniye. 30 saniye kaldı."
- Sonra: "30 saniye kaldı."

**Baş dönmesi sürerken hatırlatma (yeni, 30/60/90. sn)**
- "Başınız hâlâ dönüyor mu? Geçtiyse telefona bir kez dokunun."

**Kurulum – onay (Onboarding.tsx:199)**
- Önce: ayrı onay kutusu + soluk "Devam".
- Sonra: tek düğme: **"Okudum, anladım — Devam"**.

**Uygunluk listesi (safety.ts:130-151) – halk dili örnekleri**
- "Ankilozan spondilit, ağır romatoid artrit, ileri kamburluk (kifoskolyoz)…" → "Belimi, sırtımı ya da boynumu romatizma ya
  da kamburluk yüzünden rahat hareket ettiremiyorum."
- "Hekimimin bildiği ciddi şah damarı (karotis) darlığım ya da dengesiz kalp hastalığım var." → "Doktorum boynumdaki
  damarlarda ciddi daralma olduğunu ya da kalp hastalığımın kontrol altında olmadığını söyledi."
- "Telefondan gelen sesli yönergeleri duyup takip etmekte güçlük çekiyorum." → "Sesi en yükseğe açtığımda bile telefonun
  konuşmasını anlayamıyorum. [Sesi dene]"

**Ana ekran alt yazısı (PatientHome.tsx:92)**
- Önce: "Güvenlik soruları → telefonu tanıtma → manevra"
- Sonra: "Size adım adım, sesle yardım edeceğim (yaklaşık 10 dakika)."

## 6. Yapmamamız gerekenler (bu kullanıcı için)

- **Ses yerine ekrana dayanan yönlendirme eklemeyin.** Manevrada ekranı göremiyorum; kritik her bilgi sesle, kısa ve tek
  komut olarak gelmeli.
- **Kaydırma, kaydırarak onay ya da uzun basma gibi hareketler eklemeyin** (baş dönmesi işareti için). Tek dokunuş, her yer.
- **Soruları "hepsine Hayır" gibi tek düğmeye indirmeyin.** Gruplayın ama her grubu ayrı onaylatın ve okuyun; kırmızı
  bayraklar zayıflamamalı.
- **Ek kurulum adımı olarak hesap, PIN ya da bildirim izni gibi izin pencereleri çıkarmayın.** Bildirim izni yalnız
  "30 dk sonra uyar"a basınca istenmeli.
- **Ayarlar'a bağımlı çözümlerden kaçının.** Yazı büyütme, konuşma hızı ve ses testi akışın içinde sunulmalı; ben Ayarlar'a
  girmem.
- **Daha fazla teknik gösterge (açılar, grafikler) eklemeyin.** Hasta modunda sade metin ve büyük düğmeler yeter.
- **Hatayı yalnız kırmızı yazıyla bildirmeyin.** Her hata sesle okunmalı ve tek büyük "Tekrar dene" düğmesi olmalı.
