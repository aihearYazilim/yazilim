# Tur 5 · k03 · İlk atak, kaygılı kullanıcı (Murat, 45, iPhone 13)

## 1. Ben kimim, ne yapmaya çalıştım
Murat'ım. Hayatımda ilk kez yatakta dönünce dünya döndü. Kulağımda hafif ve yeni bir çınlama, biraz da bulantı var.
4. turdaki isteklerimin karşılanıp karşılanmadığına kendi gözümle baktım. Uygulamayı boş bir telefonda olduğu gibi baştan kurdum
(sunucu `http://localhost:4182/`): önce tanısız, sonra "hekim sağ arka kanal dedi, son 2 hafta içinde" diye. Deneme manevrasını gerçek hızda yaptım.
Gerçek atak akışını kulak sorusuna "Evet" ve "Hayır" diyerek ayrı ayrı uyguladım. Taraf çelişkisini iki durumda denedim: tanı yakın tarihli ve "Daha önce".
Aynı kayıtla 0, 7, 15, 16 ve 40 gün sonra düzenleme ekranına baktım.
(Playwright, iPhone 13 öykünümü, Demo modu, sahte Türkçe sesle ses kaydı. Betikler ve ekran görüntüleri:
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-5/k03-ilk-atak-kaygili/`)

## 2. Yaşadıklarım
1. **Kurulum:** Uygunluk ekranı artık önce kısa bir giriş okuyor ("…hiçbiri uymuyorsa en alttaki seçeneği işaretleyin. Maddelerin hepsini dinlemek için
   Tekrar dinle'ye dokunun"). Uzun listeyi dinlemek zorunda kalmadım. Onam bölümleri katlanmış hâlde ve acil kartı görünüyor.
2. **Tanısız kapı:** Aciliyet kartı ve "Muayenede hekime söyleyecekleriniz" listesi aynı. Liste yine panoya kopyalanıyor ve yine yalnız sorulardan oluşuyor.
3. **"Hekim sağ dedi":** "Son 2 hafta içinde"yi seçince altında hemen şu yazdı: "**Bugün (31 Ekim 2026) seçildi; 15 Kasım 2026 tarihine kadar 'son 2 hafta'
   sayılır, sonra kendiliğinden 'Daha önce' olur.**" Ne zaman ne olacağını baştan bilmek beni rahatlattı.
4. **Zaman geçince:** Aynı kayıtla düzenleme ekranına baktım.
   - 7. gün: "24 Ekim 2026 tarihinde seçildi; 08 Kasım 2026 tarihine kadar…"
   - 15. gün: "…31 Ekim 2026 tarihine kadar…"
   - 16. gün: seçim "Daha önce" olmuş.
   - 40. gün: seçim "Daha önce" ve şu açıklama yazıyor: "21 Eylül 2026 tarihinde 'Son 2 hafta içinde' seçmiştiniz…"

   Yeni atakta taraf çelişkisinde de yalnız kısa uyarı geldi. Gün sayımı tutarlı.
5. **Deneme manevrası (gerçek hız, ~6 dk):** Kulak sorusunda "Evet" dedim, onay ekranından sonra durdurma ekranında KBB aciliyeti geldi.
   İkinci denemede manevra yönergelerinden hiçbiri kesilmedi.
6. **Gerçek atak, kulak "Evet":** Kilit kartında durdurma nedeni, hekime sorulacak cümle ve KBB sonrası açıklaması duruyor. Bir önceki turla aynı ve tutarlı.
7. **Gerçek atak, kulak "Hayır":** Akış sorunsuz: 14 soru, iki taraflı test, Epley sağ. Manevra sonu metnine yeni bir cümle eklenmiş: "**Uyku pozisyonu
   kısıtlaması ya da boyunluk gerekmez.**" İnternette okuduğum "gece dik yatmalı mıyım?" sorusunu yanıtladı.
   Raporda hekime göstermek için QR bölümü var.
8. **Taraf çelişkisi:** "Son 2 hafta içinde" seçiliyken uygulama hekime yönlendirdi. "Daha önce" seçiliyken tek cümlelik bir uyarıyla manevra önerdi.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | — | 4. kullanımdaki isteğim #2 ("Son 2 hafta içinde" seçim tarihi süre dolmadan da görünsün): **karşılandı** | Seçim yapılır yapılmaz hem seçildiği gün hem de "son 2 hafta" sayılacağı son gün yazıyor. 16. günde seçim kendiliğinden "Daha önce" oluyor. | — | Evet (f-sinir.mjs çıktısı: 0/7/15/16. gün; e-01) |
| 2 | Düşük | 4. kullanımdaki isteğim #1 ("hekime söyleyecekleriniz" listesini uygulamada yanıtlama): **karşılanmadı** (sentezde bilerek sonraki sürüme bırakıldı) | Liste yalnız sorulardan oluşuyor ve "…" ile kopyalanıyor. Bu listede QR yok. | Sonraki sürümde soruların altına kısa yanıt alanı ve atak raporundaki gibi bir QR eklensin. | Evet (pano çıktısı) |
| 3 | — | 4. kullanımdaki isteğim #3 (gerçek telefonda doğrulama ve pilot): **yazılım dışı** | Bu turda da demo sensör ve sahte sesle denedim. | Gerçek iPhone ve Android'de açı, Türkçe ses ve titreşim doğrulaması; etik kurullu pilot. | — |
| 4 | Düşük | Kurulum > Tanınız, tarih metni | Tarih "08 Kasım 2026" diye başında sıfırla yazılıyor. Diğer ekranlarda "31 Ekim 2026" biçimi kullanılıyor. | Gün başında sıfır olmadan yazılsın: "8 Kasım 2026". | Evet (f-sinir.mjs, 7. gün) |

Bu turda önemli bir yeni sorun bulmadım. Kırmızı çizgiler (tanı şartı, kırmızı bayraklar, doz sınırı, yönlendirme kilidi) yerinde.
Taraf çelişkisinde güvenli yöndeki davranış ve kulak sorusundaki durdurma korunuyor. Ses kaydında görülen kesintilerin hepsi betiğimin hızlı
dokunuşlarından ya da demo modundan kaynaklanıyor; gerçek hızda yaptığım deneme manevrasında hiçbir yönerge kesilmedi.

## 4. Sevdiklerim
- **Tanısız kişiye yol gösterme:** "tehlikeli değildir" cümlesi, dört aciliyet basamağı ve hekime söyleyeceklerim listesi.
- **Tanı zamanının açıkça anlatılması:** Seçtiğim gün ve "son 2 hafta" sayılacağı son gün baştan yazıyor; süre dolunca seçim kendiliğinden değişiyor.
  Taraf çelişkisinde yakın tarihli tanı hekime yönlendiriyor.
- **Manevra sonrası sakinleştirici bilgiler:** bulantının beklenen bir durum olduğu, 10 dakikalık sayaç, "uyku kısıtlaması ya da boyunluk gerekmez" cümlesi
  ve hekime göstermek için QR.

## 5. Memnuniyet
**9/10** (turlar boyunca 6 → 8 → 9 → 9 → 9). İlk atağın korkusunda beni sakinleştirip doğru yere yönlendiriyor, tanı aldıktan sonra da güvenle yönetiyor.
Kalan isteklerim konfor ve biçim düzeyinde. Son puanı gerçek telefonda yapılacak doğrulamaya bırakıyorum.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Evet, bir koşulla.** Manevra kısmı yalnız hekim ya da odyolog muayenesiyle
BPPV tanısı alındıktan sonra kullanılmalı. Tanısızken uygulama yalnız aciliyet kartı ve hekime söylenecekler listesi için kullanılır; uygulama bu ayrımı
zaten zorunlu kılıyor. Ayrıca gerçek telefonda açı ve ses doğrulaması ile pilot, kullanımın yaygınlaştırılmasından önce yapılmalı.
