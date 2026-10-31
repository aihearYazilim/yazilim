# Tur 3 · k03 · İlk atak, kaygılı kullanıcı (Murat, 45, iPhone 13)

## 1. Ben kimim, ne yapmaya çalıştım
Murat'ım. Hayatımda ilk kez yatakta dönünce dünya döndü. Kulağımda hafif ve yeni bir çınlama, biraz da bulantı var.
2. turdaki isteklerimin karşılanıp karşılanmadığına kendi gözümle baktım. Uygulamayı boş bir telefonda olduğu gibi baştan kurdum: önce tanısız,
sonra "hekim sağ arka kanal dedi, tanı son 2 hafta içinde" diye. Deneme manevrasını gerçek hızda yaptım. Gerçek atak akışını uyguladım.
Kulak sorusunun kilidini denedim. Taraf çelişkisini üç durumda denedim: tanı yakın tarihli, "Daha önce" seçilmiş, ve aynı kayıtla 40 gün sonra.
(Playwright, iPhone 13 öykünümü, Demo modu, sahte Türkçe sesle ses kaydı. Betikler ve ekran görüntüleri:
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-3/k03-ilk-atak-kaygili/`)

## 2. Yaşadıklarım
1. **Kurulum:** Onam ekranına "Olası yan etkiler" ve "Seçenekleriniz" eklenmiş. "Kristal oynaması çoğu zaman haftalar içinde kendiliğinden de geçer;
   beklemek de bir seçenektir" cümlesi beni rahatlattı. Ama ekran epey uzadı. Yazı boyutu, ses hızı, kimler kullanabilir, acil kartı, reçete, yan etkiler,
   seçenekler, yakını seçeneği ve onay kutusu art arda geliyor.
2. **Tanısız kapı:** Aciliyet kartı artık **kurulumdaki kapı ekranında da** görünüyor. Altında "Muayenede hekime söyleyecekleriniz" listesi var.
   "Listeyi kaydet / gönder" düğmesi listeyi panoya kopyaladı. Hekime ne söyleyeceğimi artık biliyorum.
   Uygunluk listesi de sesli okunuyor.
3. **"Hekim sağ dedi":** "Tanı ne zaman kondu?" sorusu geldi: Son 2 hafta içinde / Daha önce (2 haftadan uzun süre önce) / Tarihi biliyorum.
   Seçim yapmadan Devam etkin değil ve nedenini yazıyor. "Son 2 hafta içinde"yi seçtim.
4. **Deneme 1 (kulak "Evet"):** Durdurma ekranında önce aciliyet, sonra "Yukarıdaki aciliyete göre bir KBB hekimine başvurun" yazıyor. Açık.
5. **Deneme 2 (gerçek hız, ~6,5 dk):** Kulak sorusunun altında yeni bir açıklama var: "Bir KBB hekimi bu kulak belirtinize baktıysa ve o günden beri
   artmadıysa artık yeni sayılmaz: Hayır deyin." Hekimim baktı ve çınlama artmadı, bu yüzden gönül rahatlığıyla "Hayır" dedim.
   Evet/Hayır düğmeleri soru okunurken kısa süre kilitli kalıyor; düşünmeden basamıyorum, bu iyi.
   Manevra yönergeleri kısalmış ("yarıya kadar") ve hiçbir cümle kesilmedi.
6. **Gerçek atak, kulak "Evet":** Kilit kartında "Durdurma nedeni: yeni kulak belirtisi…" yazıyor. Ayrıca hekime sorulacak hazır bir cümle var.
   "Hekimimle görüştüm"den sonraki yeni atakta aynı soru yine geliyor, ama açıklamasıyla birlikte. Artık ne yanıtlayacağımı biliyorum.
   Ana ekrandaki 112 kartı tam belirti listesini sayıyor.
7. **Gerçek atak, kulak "Hayır":** 14 soru, alt tip, süre, "hangi kulağınız alttayken", sol test ve sağ test geldi. Sonra Epley sağ yapıldı.
   Manevra sonrası bulantı açıklaması ve 10 dakikalık sayaç çıktı. Rapor anlaşılır. Sorun yaşamadım.
8. **Taraf çelişkisi:**
   - "Son 2 hafta içinde" seçiliyken: manevra yapılmadı, hekime yönlendirildim. Raporda "son 2 hafta içinde, tarih girilmemiş" ve uyuşmazlık satırı var.
   - "Daha önce" seçiliyken: tek cümlelik kısa bir uyarı geldi ("Hekiminiz sağ demişti, test sol gösterdi…"), "Bitir" düğmesiyle çakışma yok.
9. **40 gün sonra yeni atak (aynı kayıt):** Uygulama tanıyı doğru biçimde eski saydı ve yalnız uyardı. Ama "Bilgilerimi düzenle"yi açınca
   "Tanı ne zaman kondu?" sorusunda hâlâ **"Son 2 hafta içinde"** seçili görünüyor.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | — | 2. kullanımdaki isteğim #1 (hekime götürülecek not, kapıda aciliyet kartı): **karşılandı** | Kapı ekranında aciliyet kartı ve paylaşılabilir "hekime söyleyecekleriniz" listesi var. Liste yalnız soru olarak kopyalanıyor ("…"); yanıtları başka yerde yazmam gerekiyor. | (İsteğe bağlı) Yanıtları uygulamada doldurup paylaşabileyim. | Evet (a-06, a-07, pano çıktısı) |
| 2 | — | 2. kullanımdaki isteğim #2 (tarih boşken taraf çelişkisi): **karşılandı** | Tanı zamanı zorunlu seçim oldu. "Son 2 hafta içinde" seçilince çelişki hekime yönlendiriyor. | — | Evet (b-01, c3-07, c3-08) |
| 3 | — | 2. kullanımdaki isteğim #3 (kısa taraf uyarısı): **karşılandı** | Tek cümle, ilk atakta "tekrarlayan" denmiyor, "Bitir" düğmesiyle çakışmıyor. | — | Evet (c4-07) |
| 4 | — | 2. kullanımdaki isteğim #4 (kulak sorusu kilit kartı): **karşılandı** | Kilit kartında durdurma nedeni, hekime sorulacak cümle ve sorunun KBB değerlendirmesinden sonra nasıl yanıtlanacağı yazıyor. Aynı açıklama sorunun altında da var. | — | Evet (c1-04, c1-09) |
| 5 | — | 2. kullanımdaki isteğim #5 (112 kartında tam liste): **karşılandı** | Ana ekrandaki kart tam acil belirti listesini sayıyor. | — | Evet (c1-04, c2-13) |
| 6 | — | 2. kullanımdaki isteğim #6 (sesli okumada "/"): **karşılandı** | Ses kaydında "/" yok; "yüzde, kolda…", "Aspirin dahil kan sulandırıcı…" diye okunuyor. | — | Evet (c2-ses.txt; gerçek ses motoruyla değil) |
| 7 | Düşük | Kurulum > Tanınız (düzenleme), "Tanı ne zaman kondu?" | 40 gün sonra düzenleme ekranında hâlâ "Son 2 hafta içinde" seçili. Uygulama arka planda doğru biçimde "eski" sayıyor, ama ekran yanlış bilgi veriyor. Kaygılı biri "hâlâ 2 hafta mı sayılıyor?" diye kafa yorar. | 14 gün geçince seçim kendiliğinden "Daha önce"ye dönsün, ya da yanında "31 Ekim'de seçildi" yazsın. | Evet (e-01, e-02) |
| 8 | Düşük | Kurulum ilk ekranı (onam) | Ekran çok uzadı. Acil kartından onay kutusuna kadar uzun bir kaydırma var. "Baş dönmesi sırasında düşebilirsiniz" gibi cümleler arka arkaya gelince ilk okumada ürkütüyor. | "Olası yan etkiler" ve "Seçenekleriniz" katlanabilir kutu olsun ve onay metninin hemen üstünde dursun. Acil kartı görünür kalsın. | Evet (a-02) |

1. ve 2. turdaki bütün isteklerim karşılandı. Kalan iki madde yalnız kozmetik.

## 4. Sevdiklerim
- **Tanısız kişiye yol gösterme:** "tehlikeli değildir" cümlesi, dört aciliyet basamağı, "beklemek de bir seçenektir" ve hekime söyleyeceklerim listesi.
  İlk atağın korkusunu en çok azaltan şeyler bunlar.
- **Kulak sorusunda dürüst yanıtın bir yolu var:** kilit kartında neden ve hekime sorulacak cümle, sorunun altında da KBB değerlendirmesinden sonra nasıl yanıtlanacağı yazıyor.
  Soruyu atlatmak için "Hayır" demek zorunda kalmıyorum.
- **Taraf çelişkisinde güvenli davranış:** Tanı yakın tarihliyse hekime yönlendiriyor, eskiyse kısa uyarı veriyor. Tanı zamanının seçilmeden geçilememesi bu davranışı güvenceye alıyor.

## 5. Memnuniyet
**9/10** (1. turda 6, 2. turda 8). Uygulama tanısızken beni durdurup nereye gideceğimi söylüyor, tanı aldıktan sonra da güvenle yönlendiriyor.
Kulak ve taraf konusundaki bütün endişelerim giderildi. Bir puanı yalnız kurulumun uzunluğu ve 40 gün sonra hâlâ "Son 2 hafta" görünmesi yüzünden kırdım.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Evet.** Tanısı olmayan yakınıma da veririm, çünkü uygulama onu
manevraya sokmadan hekime yönlendiriyor. Tanı aldıktan sonra da evde güvenle kullanılabilir. (Araştırma prototipi olduğu uyarısı ve hekim tanısı şartı açıkça görünüyor.)
