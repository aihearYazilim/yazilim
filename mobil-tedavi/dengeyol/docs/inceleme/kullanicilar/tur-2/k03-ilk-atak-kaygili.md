# Tur 2 · k03 · İlk atak, kaygılı kullanıcı (Murat, 45, iPhone 13)

## 1. Ben kimim, ne yapmaya çalıştım
Murat'ım. Hayatımda ilk kez dün gece yatakta dönünce dünya döndü, korktum. Kulağımda hafif ve yeni bir çınlama, biraz da bulantı var.
1. turdaki isteklerimin karşılanıp karşılanmadığına kendi gözümle baktım. Uygulamayı boş bir telefonda olduğu gibi baştan kurdum: önce tanısız,
sonra "hekim sağ arka kanal dedi" diye. Deneme manevrasını gerçek hızda yaptım. Gerçek atak akışını uyguladım. Kulak sorusunda kararsız kaldım.
Taraf çelişkisini iki biçimde yeniden denedim: tanı tarihini girerek ve girmeden.
(Playwright, iPhone 13 öykünümü, Demo modu, sahte Türkçe sesle ses kaydı. Betikler ve ekran görüntüleri:
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-2/k03-ilk-atak-kaygili/`)

## 2. Yaşadıklarım
1. **Kurulum:** Onay metni artık "...yalnız hekim tanısıyla **kullanılabilir**" diyor. Tanım olmadığı hâlde dürüstçe işaretleyebildim.
   Yeni konuşma hızı seçimi iyi. "Kimler kullanabilir" bölümünde "en çok bir dakika" ifadesi açık.
2. **Tanısız kilit:** Kurulumdaki kapı ekranı hâlâ yalnız "önce hekime danışın" diyor. Ana ekrana dönünce **"İlk kez baş dönmesi: ne yapmalı?"**
   kartı çıktı. "Tehlikeli değildir, muayenede birkaç dakikalık manevrayla çoğunlukla düzelir" cümlesi beni gerçekten sakinleştirdi.
   Dört basamak var: 112 / bugün acil / bugün KBB / birkaç gün içinde KBB. "Yanında hafif bulantı ya da çınlama olabilir" satırı tam benim durumum.
   Nereye ve ne zaman gideceğimi ilk kez net öğrendim. Deneme manevrasını adresten açınca da artık gerçek neden ve aynı kart görünüyor.
3. **"Hekim sağ dedi":** "Bilgilerimi düzenle" doğrudan "Tanınız" adımını açtı. Onay korunmuştu. Evet / Arka kanal / Sağ kulak / bugünün tarihi girdim.
4. **Deneme 1 (kulak "Evet"):** Durdurma ekranı artık ne yapacağımı söylüyor: ani işitme kaybı ya da dolgunluk varsa BUGÜN KBB'ye,
   yalnız çınlama varsa birkaç gün içinde KBB'ye. Olmayan rapordan söz edilmiyor. "Tekrar dinle" düğmesi var.
5. **Deneme 2 (gerçek hız, ~5,7 dk):** Yüzde güçsüzlük ve kulak sorularında önce "Evet"e dokundum, sonra "Yanlış dokundum" ile döndüm. Sorun olmadı.
   Telefonu tanıtırken "zorlamadan, rahat olduğunuz kadar geriye yatırın" deniyor, kaygılı biri için iyi bir cümle. Manevrada hiçbir cümle kesilmedi.
   "Nasılsınız?" sorusu seçenekleriyle birlikte sesli okundu.
6. **Gerçek atak, kulak "Evet":** Hekime yönlendirildim, kulak sorusu raporda açıkça yazıyor. "Hekimimle görüştüm" ile kilidi açtım.
   Yeni atakta **aynı soru yine geldi.** KBB'ye gitmiş olsam da çınlamam hâlâ "yeni". Bu durumda ne yanıtlayacağımı hiçbir ekran söylemiyor.
7. **Gerçek atak, kulak "Hayır":** 14 soru, ardından alt tip sorusu geldi. Yatay kanal seçeneği artık "**Sırtüstü yatarken** sağa-sola dönünce ya da başımı
   çevirince" diyor. Taraf sorusu da "Hangi yanınıza yatınca (**hangi kulağınız alttayken**)" diye soruyor. Geçen turdaki karışıklık büyük ölçüde gitti.
   Testler arası dinlenmenin nedeni söyleniyor. Sağ test pozitif çıktı, Epley sağ yapıldı. Manevra sonunda "hafif bulantı birkaç saat sürebilir" dendi
   ve 10 dakikalık dinlenme sayacı çıktı. Bulantısı olan biri olarak çok rahatladım. Rapor anlaşılır.
8. **Taraf çelişkisi, tarih girilmiş:** Hekim "sağ" dedi, test solu gösterdi. Manevra yapılmadı, hekime yönlendirildim.
   Raporda "Taraf uyuşmazlığı" satırı var. Doğru davranış.
9. **Taraf çelişkisi, tarih boş:** Tanı tarihi "isteğe bağlı" olduğu için boş bıraktım; tanıyı bugün almıştım. Uygulama tanıyı eski saydı.
   Yalnız bir uyarı verdi ve **sol Epley'i yine de yaptı.** Uyarı metni çok uzun ve "Tekrarlayan atakta taraf değişebilir" diyor, oysa bu benim ilk atağım.
   Vazgeçmek için telefonu alından alıp "Bitir"e basılı tutmam gerekiyor. Bu uzun metin ekranda "Bitir" düğmesinin üstüne biniyor.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Yüksek | 1. kullanımdaki isteğim #1 (tanısız ilk atakta yol gösterme): **kısmen** | Aciliyet basamakları ve sakinleştirici açıklama geldi, çok iyi. Hekime götürülecek not yok. Kurulumdaki kapı ekranında bu kart görünmüyor. | Kapı ekranında da aynı kartı göster. Tanısız kişiye "hekime söyleyecekleriniz" listesi verilsin (ne zaman başladı, ne kadar sürdü, hangi hareket, kulak belirtisi, bulantı), paylaşılabilir olsun. | Evet (a-06, a-07, a-08) |
| 2 | Yüksek | 1. kullanımdaki isteğim #2 (taraf çelişkisi): **kısmen**. `state/episodes.ts` `dxSideCheck` | Tarih girilince doğru biçimde yönlendiriyor. Tarih boşsa tanı "eski" sayılıyor, yalnız uyarı veriliyor ve karşı tarafa manevra yapılıyor. Tarih isteğe bağlı olduğu için bugün tanı alan biri kolayca bu yola düşüyor. | Tarih boşsa tanı yakın tarihli sayılsın ve hekime yönlendirsin. Ya da kurulumda tarih yerine zorunlu bir seçim olsun: "Son 2 hafta içinde / Daha önce". | Evet (c3-07, c3-08; c4-07…c4-12) |
| 3 | Orta | Eski tanı uyarı ekranı (chainGate) | Metin çok uzun, telefon alındayken dinlenmesi zor. İlk atakta da "Tekrarlayan atakta" diyor. Uzun metin "Bitir basılı tut" düğmesinin üstüne biniyor. | Kısa bir uyarı yeterli: "Hekiminiz sağ demişti, test sol gösterdi. Manevra yapmak istemiyorsanız 'Bitir'i basılı tutun." Ayrıntı rapora yazılsın. Metin düğmeyle çakışmasın. | Evet (c4-07) |
| 4 | Orta | 1. kullanımdaki isteğim #3 (kulak sorusu): **kısmen**. `core/safety.ts` `ear` | Soru artık YENİ/ani belirtiye odaklı. Durdurma ekranı aciliyeti (bugün KBB / birkaç gün içinde KBB) açık söylüyor. Ama KBB değerlendirmesinden sonra aynı soru yine geliyor. Çınlama hâlâ "yeni" olan kişinin ne yanıtlayacağı belirsiz. "Hekimimle görüştüm" sorusu kulak belirtisini anmıyor. | Soru ve durdurma kalsın. Kilit kartında hangi yanıt yüzünden durdurulduğu yazsın ve hekime sorulacak cümle önerilsin. KBB değerlendirmesinden sonra soruyu nasıl yanıtlayacağını klinik ekip belirleyip ekranda söylesin. | Evet (b-06, c1-02…c1-08) |
| 5 | — | 1. kullanımdaki isteğim #4 (onay metni): **karşılandı** | "...yalnız hekim tanısıyla kullanılabilir" | — | Evet (a-02) |
| 6 | — | 1. kullanımdaki isteğim #5 (alt tip ve taraf ifadeleri): **karşılandı** | "Sırtüstü yatarken…" ve "hangi kulağınız alttayken" ifadeleri anlaşılır. Küçük bir not: "sağa-sola dönünce" sözü yan dönmeyle hâlâ karıştırılabilir, ama onay ekranı bunu yakalıyor. | — | Evet (c2-03…c2-06) |
| 7 | — | 1. kullanımdaki isteğim #6 (denemede olmayan rapor): **karşılandı** | Denemede rapordan söz edilmiyor. Gerçek atakta "Raporu göster" var. | — | Evet (b-06, c1-02) |
| 8 | — | 1. kullanımdaki isteğim #7 ("önce kurulumu tamamlayın"): **karşılandı** | Adresten açınca gerçek neden ve aciliyet kartı görünüyor. | — | Evet (a-08) |
| 9 | Düşük | 1. kullanımdaki isteğim #8 (acil belirti listeleri): **kısmen** | Tanısızın kartı ve kurulum listesi tutarlı. Ana ekrandaki 112 kartı hâlâ 3 belirti sayıyor. | 112 kartına "tüm acil belirtiler" bağlantısı ya da kısa tam liste eklensin. | Evet (a-07, c2-13) |
| 10 | — | 1. kullanımdaki isteğim #9 (düzenlemede onay): **karşılandı** | Onay korunuyor, düzenleme doğrudan "Tanınız" adımını açıyor. | — | Evet (a-09) |
| 11 | Düşük | Sesli okunan metinler | "yüzde/kolda", "aspirin/Coraspin" gibi eğik çizgili ifadeler sesli okunuyor. Gerçek ses motoru "/" işaretini "bölü" diye okuyabilir. | Okunan metinlerde "/" yerine "ya da" ya da virgül kullanılsın. | Hayır (sahte ses motoru; metin kaydı b-ses.txt, c2-ses.txt) |

Not: Demo modunda "Önce sol, sonra sağ tarafı test ediyoruz. Başlıyoruz…" cümlesi gerçek hızda da yarıda kesiliyor (d-ses.txt). Kod bu durumda,
gerçek sensörde konuşmanın bitişini bekliyor. Bu yüzden bunu yalnız demo moduna özgü sayıp tabloya almadım.

## 4. Sevdiklerim
- **"İlk kez baş dönmesi: ne yapmalı?" kartı:** "tehlikeli değildir" cümlesi ve dört aciliyet basamağı. Korkumu en çok azaltan şey bu oldu.
- **Durdurma ekranlarının ne yapacağımı söylemesi:** kulak için "bugün KBB / birkaç gün içinde KBB", yakın tarihli tanıyla taraf çelişkisinde hekime yönlendirme
  ve raporda "Taraf uyuşmazlığı" satırı.
- **Manevra sonrası bulantı açıklaması ve 10 dakikalık dinlenme sayacı.** Ayrıca deneme manevrası gerçek hızda kesintisiz, sakin bir sesle ilerliyor.

## 5. Memnuniyet
**8/10** (1. turda 6/10). İlk atak korkusunda artık beni sakinleştiriyor ve nereye, ne kadar acil gideceğimi açıkça söylüyor.
Tam puan vermiyorum, çünkü tanı tarihi boş kalınca hekimimin söylediği tarafın tersine yine manevra yapılıyor. Kulak çınlamasında da ne yanıtlayacağım hâlâ belirsiz.
Bir yakınıma şöyle öneririm: "ilk atakta karttaki basamaklara göre hekime git, tanı alınca kullan."
