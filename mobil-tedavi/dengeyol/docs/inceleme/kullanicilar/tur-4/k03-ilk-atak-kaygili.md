# Tur 4 (son) · k03 · İlk atak, kaygılı kullanıcı (Murat, 45, iPhone 13)

## 1. Ben kimim, ne yapmaya çalıştım
Murat'ım. Hayatımda ilk kez yatakta dönünce dünya döndü. Kulağımda hafif ve yeni bir çınlama, biraz da bulantı var.
3. turdaki isteklerimin karşılanıp karşılanmadığına kendi gözümle baktım. Uygulamayı boş bir telefonda olduğu gibi baştan kurdum
(sunucu `http://localhost:4181/`): önce tanısız, sonra "hekim sağ arka kanal dedi, son 2 hafta içinde" diye. Deneme manevrasını gerçek hızda yaptım.
Gerçek atak akışını kulak sorusuna "Evet" ve "Hayır" diyerek ayrı ayrı uyguladım. Taraf çelişkisini iki durumda denedim: tanı yakın tarihli ve "Daha önce".
Aynı kayıtla 13–17 ve 40 gün sonra düzenleme ekranına ve yeni bir atağa baktım.
(Playwright, iPhone 13 öykünümü, Demo modu, sahte Türkçe sesle ses kaydı. Betikler ve ekran görüntüleri:
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-4/k03-ilk-atak-kaygili/`)

## 2. Yaşadıklarım
1. **Kurulum:** "Olası yan etkiler" ve "Seçenekleriniz" artık katlanabilir kutular. Kapalıyken de birer satırlık özetleri görünüyor
   ("Geçici baş dönmesi ve bulantı, düşme, nadiren kanal değişimi"). Ekran kısaldı ve ilk okumada ürkütmüyor. Acil kartı açık duruyor.
2. **Tanısız kapı:** Kapı ekranında da, ana ekranda da aciliyet kartı ve "Muayenede hekime söyleyecekleriniz" listesi var. Liste panoya kopyalanıyor.
3. **"Hekim sağ dedi":** Tanı zamanı seçimi zorunlu. "Son 2 hafta içinde" seçeneğinin altında yeni bir not var: "Hekiminiz '2 hafta önce' dediyse de bunu seçin."
4. **Deneme manevrası:** Bu turda iki kez yaptım. İlkinde kulak sorusunda "Evet"e dokundum. Onay ekranında en üstte "Yeni kulak belirtisi … var — doğru mu?",
   hemen altında "Evet, doğru" düğmesi var. Ne onayladığımı ilk bakışta gördüm. İkincisi gerçek hızda ~6 dk sürdü ve hiçbir yönerge kesilmedi.
5. **Gerçek atak, kulak "Evet":** Kilit kartında durdurma nedeni, hekime sorulacak cümle ve KBB sonrası açıklaması duruyor. "Hekimimle görüştüm"den
   sonraki yeni atakta soru açıklamasıyla birlikte yine geliyor. Akış tutarlı.
6. **Gerçek atak, kulak "Hayır":** Sorular, iki taraflı test ve Epley sağ sorunsuz ilerledi. Manevra sonu sesli metni kısalmış:
   "Hafif baş dönmesi normaldir. On dakika oturun; tutunarak kalkın…" Ekranda ayrıntı ve 10 dakikalık sayaç var.
   Raporda yeni bir **"Hekiminize QR kodla gösterin"** bölümü var; internet gerektirmiyor. Muayeneye götürmek için çok işime yarar.
7. **Taraf çelişkisi:** "Son 2 hafta içinde" seçiliyken uygulama hekime yönlendirdi. "Daha önce" seçiliyken tek cümlelik bir uyarıyla manevra önerdi.
   Bu, 3. turdaki davranışla aynı.
8. **Zaman geçince düzenleme ekranı:** 13, 14 ve 15. günde ekranda hâlâ "Son 2 hafta içinde" seçili. Kod bir gün güvenlik payı bırakıyor, yani bu bilerek böyle.
   16. günden sonra seçim "Daha önce" oluyor ve şu açıklama yazıyor: "21 Eylül 2026 tarihinde 'Son 2 hafta içinde' seçmiştiniz. Aradan 2 haftadan fazla
   geçtiği için tanınız artık 'Daha önce' sayılıyor…" 40 gün sonraki yeni atakta taraf çelişkisinde yalnız kısa uyarı geldi; bu, ekranla tutarlı.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | — | 3. kullanımdaki isteğim #1 ("Son 2 hafta içinde" seçimi 14 gün sonra düzenlemede): **karşılandı** | 16. günden sonra seçim "Daha önce" oluyor ve seçimin yapıldığı tarih yazıyor. 15. güne kadar süren bir günlük güvenlik payı tasarım gereği. Ekran ve uygulamanın davranışı tutarlı. | — | Evet (e-01, e-02, f-sinir.mjs çıktısı) |
| 2 | — | 3. kullanımdaki isteğim #2 (katlanabilir onam bölümleri): **karşılandı** | İki kutu da kapalı geliyor ve birer satırlık özetleri görünüyor. Acil kartı açık kalıyor. | — | Evet (a-02) |
| 3 | Düşük | 3. kullanımdaki isteğim #3 ("hekime söyleyecekleriniz" listesini uygulamada yanıtlama, isteğe bağlıydı): **karşılanmadı** | Liste hâlâ yalnız sorulardan oluşuyor ve "…" ile kopyalanıyor. Yanıtları başka bir uygulamaya yazmam gerekiyor. Atak raporunda olan QR bu listede yok. | Her sorunun altında kısa bir yanıt alanı olsun, yanıtlar telefonda kalsın. Liste, atak raporundaki gibi QR ya da paylaşımla hekime gösterilebilsin. | Evet (pano çıktısı) |
| 4 | Düşük | Kurulum > Tanınız (düzenleme) | Süre dolmadan önce (ilk 15 gün) "Son 2 hafta içinde" seçiminin ne zaman yapıldığı yazmıyor. Tarih yalnız süre dolunca görünüyor. | Seçimin yanında baştan "31 Ekim'de seçildi" yazsın. | Evet (f-sinir.mjs: 13–15. gün) |

Bu turda önemli bir yeni sorun bulmadım. Kırmızı çizgilerin hiçbiri (tanı şartı, kırmızı bayraklar, doz sınırı, yönlendirme kilidi) zayıflamamış;
taraf çelişkisinde güvenli yöndeki davranış korunuyor.

## 4. Sevdiklerim
- **Tanısız kişiye yol gösterme:** "tehlikeli değildir" cümlesi, dört aciliyet basamağı ve hekime söyleyeceklerim listesi. Kapı ekranında da, ana ekranda da görünüyor.
- **Hekime götürmek için raporda QR:** İnternet gerekmeden, muayenede hekime göstermek için.
- **Kulak sorusunda ve taraf çelişkisinde net ve dürüst yol:** Neden durdurulduğum, hekime ne soracağım ve sonraki atakta soruyu nasıl yanıtlayacağım yazıyor.
  Tanı zamanı seçimi ve 16. günde kendiliğinden "Daha önce"ye geçiş de tutarlı.

## 5. Memnuniyet
**9/10** (turlar boyunca 6 → 8 → 9 → 9). Kaygılı, tanısız biri olarak uygulama beni manevraya sokmadan sakinleştirip doğru yere yönlendirdi.
Tanı aldıktan sonra da güvenle kullanılıyor. 3. turdan bu yana yalnız küçük cilalar eklendi ve kalan isteklerim de kozmetik; puanım bu yüzden aynı kaldı.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Evet, bir koşulla.** Manevra kısmı yalnız hekim ya da odyolog tanısından sonra kullanılmalı.
Tanısızken uygulama yalnız "ne yapmalı" kartı ve hekime söyleneceklerin listesi için işe yarar. Uygulama bu ayrımı zaten zorunlu kılıyor, yani koşul
kullanıcıya bırakılmıyor. Ek not: Ben demo sensör ve sahte sesle denedim. Gerçek telefonda açı ve ses doğrulaması ile planlanan pilot yine gerekli.
