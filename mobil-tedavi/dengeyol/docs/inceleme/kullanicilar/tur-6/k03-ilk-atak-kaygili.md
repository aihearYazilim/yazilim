# Tur 6 · k03 · İlk atak, kaygılı kullanıcı (Murat, 45, iPhone 13)

## 1. Ben kimim, ne yapmaya çalıştım
Murat'ım. Hayatımda ilk kez yatakta dönünce dünya döndü. Kulağımda hafif ve yeni bir çınlama, biraz da bulantı var.
5. turdaki isteklerimin karşılanıp karşılanmadığına kendi gözümle baktım. Uygulamayı boş bir telefonda olduğu gibi baştan kurdum
(sunucu `http://localhost:4183/`): önce tanısız, sonra "hekim sağ arka kanal dedi, son 2 hafta içinde" diye. Deneme manevrasını gerçek hızda yaptım.
Gerçek atak akışını kulak sorusuna "Evet" ve "Hayır" diyerek ayrı ayrı uyguladım. Taraf çelişkisini iki durumda denedim: tanı yakın tarihli ve "Daha önce".
Aynı kayıtla 0, 7, 15, 16 ve 40 gün sonra düzenleme ekranına baktım.
(Playwright, iPhone 13 öykünümü, Demo modu, sahte Türkçe sesle ses kaydı. Betikler ve ekran görüntüleri:
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-6/k03-ilk-atak-kaygili/`)

## 2. Yaşadıklarım
1. **Kurulum ve tanısız kapı:** Bir önceki turla aynı ve sorunsuz. Onam bölümleri katlanmış, uygunluk ekranı önce kısa bir giriş okuyor. Aciliyet kartı,
   "tehlikeli değildir" cümlesi ve hekime söyleyeceklerim listesi duruyor.
2. **"Hekim sağ dedi":** "Son 2 hafta içinde"yi seçince "Bugün (31 Ekim 2026) seçildi; 15 Kasım 2026 tarihine kadar…" yazdı.
   7. günde "**8 Kasım 2026**" yazıyor; artık başında sıfır yok. 15. günde seçim hâlâ "Son 2 hafta içinde", 16. günde "Daha önce".
   40. günde "21 Eylül 2026 tarihinde … seçmiştiniz" açıklaması çıkıyor. Bütün ekran metinlerinde başında sıfır olan tarih aradım, hiç bulamadım.
3. **Deneme manevrası (gerçek hız, ~6 dk):** Kulak sorusunda "Evet"i onaylayınca KBB aciliyetini söyleyen durdurma ekranı geldi.
   İkinci denemede manevra yönergelerinden hiçbiri kesilmedi.
4. **Gerçek atak, kulak "Evet":** Kilit kartında durdurma nedeni, hekime sorulacak cümle ve KBB sonrası açıklaması var.
   "Hekimimle görüştüm"den sonraki yeni atakta soru açıklamasıyla birlikte yine geliyor.
5. **Gerçek atak, kulak "Hayır":** 14 soru, iki taraflı test ve Epley sağ sorunsuz. Manevra sonrası bulantı açıklaması, 10 dakikalık sayaç ve
   "uyku pozisyonu kısıtlaması ya da boyunluk gerekmez" cümlesi duruyor. Raporda QR var.
6. **Taraf çelişkisi:** "Son 2 hafta içinde" seçiliyken hekime yönlendirildim. "Daha önce" seçiliyken ve 40 gün sonra tek cümlelik bir uyarıyla
   manevra önerildi ("Hekiminiz sağ demişti, test sol gösterdi…").

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | — | 5. kullanımdaki isteğim #3 (tarihlerde baştaki sıfır): **karşılandı** | "8 Kasım 2026" doğru yazılıyor. Bütün ekran metinlerinde baştaki sıfırlı tarih yok. | — | Evet (f-sinir.mjs çıktısı, bütün *-metinler.txt dosyalarında arama) |
| 2 | Düşük | 5. kullanımdaki isteğim #2 ("hekime söyleyecekleriniz" listesine yanıt alanı ve QR): **karşılanmadı** (sentezde bilerek sonraki sürüme bırakıldı) | Liste yalnız sorulardan oluşuyor ve "…" ile panoya kopyalanıyor. | Sonraki sürümde soruların altına yanıt alanı ve QR eklensin. | Evet (pano çıktısı) |
| 3 | — | 5. kullanımdaki isteğim #1 (gerçek telefonda doğrulama ve pilot): **yazılım dışı** | Bu turda da demo sensör ve sahte sesle denedim. | Gerçek iPhone ve Android'de açı, Türkçe ses ve titreşim doğrulaması; etik kurullu pilot. | — |

Bu turda yeni bir sorun bulmadım. Kırmızı çizgiler (tanı şartı, kırmızı bayraklar, doz sınırı, yönlendirme kilidi) ve taraf çelişkisindeki güvenli
yöndeki davranış korunuyor. Ses kaydında görülen kesintilerin hepsi betiğimin hızlı dokunuşlarından ya da demo modundan kaynaklanıyor.
Bir not: "Şu an nasılsınız?" sorusu, telefon alından alınıp ekrana dokunulunca okunuyor. Bu, önceki turlarda da böyleydi ve kasıtlı.

## 4. Sevdiklerim
- **Tanısız kişiye yol gösterme:** aciliyet kartı, "tehlikeli değildir" cümlesi ve hekime söyleyeceklerim listesi.
- **Tanı zamanının açıkça anlatılması:** Seçtiğim gün ve "son 2 hafta" sayılacağı son gün baştan yazıyor; süre dolunca seçim kendiliğinden değişiyor.
  Taraf çelişkisinde yakın tarihli tanı hekime yönlendiriyor.
- **Kulak sorusunda dürüst yanıtın bir yolu var:** durdurma nedeni, hekime sorulacak cümle ve KBB sonrası nasıl yanıtlanacağı yazıyor.

## 5. Memnuniyet
**9/10** (turlar boyunca 6 → 8 → 9 → 9 → 9 → 9). Kaygılı ve tanısız biri olarak beni manevraya sokmadan sakinleştirip doğru yere yönlendiriyor,
tanı aldıktan sonra da güvenle yönetiyor. Kalan tek yazılım isteğim isteğe bağlı bir konfor. Son puanı gerçek telefonda yapılacak doğrulamaya bırakıyorum.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Evet, bir koşulla.** Manevra kısmı yalnız hekim ya da odyolog muayenesiyle
BPPV tanısı alındıktan sonra kullanılmalı. Tanısızken yalnız aciliyet kartı ve hekime söylenecekler listesi için kullanılır; uygulama bu ayrımı zaten
zorunlu kılıyor. Yaygın kullanımdan önce gerçek telefonda açı ve ses doğrulaması ile pilot yapılmalı.
