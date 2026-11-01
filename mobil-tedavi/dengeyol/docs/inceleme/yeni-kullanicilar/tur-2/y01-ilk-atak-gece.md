# y01 — İlk atak, gece 03:00 (Ayşe, 52, muhasebeci) · tur-2 (2. kullanım)

## 1. Ben kimim, ne yapmaya çalıştım
Yine Ayşe'yim: gece kalkarken dünya dönüyor, midem bulanıyor, tanım yok. Uzun yazı okumam, büyük düğmeye basarım. Yeni
sürümü baştan sona kullandım, 1. kullanımdaki isteklerimi (tur-1 sentezi: L2-3, L2-4, L2-8, L3-3, L3-9, L5-3, L5-4) kendi
gözümle denetledim.

Yöntem tur-1 ile aynı: iPhone 13 öykünümü, demo sensör, ×1 gerçek hız, gerçek süreli sahte Türkçe ses (cümleler zamanıyla
kaydedildi). Kayıt bozulmadan, ilk açılıştan başlayan üç tam koşu yaptım:
- **gerçek:** sağda 20 s baş dönmesi işaretledim.
- **negatif:** testte baş dönmesi gelmedi, karar ekranına düştüm.
- **hızlı:** konuşmayı beklemedim, çift dokundum, geri tuşuna bastım, manevranın 3. adımında uygulamayı kapatıp açtım.

Ayrıca iki kısa deneme yaptım: "kusma" maddesini işaretleyip uyarıyı aşmak ve düğmelerin kaydırmadan görünüp görünmediğini ölçmek.
Betikler: `scratchpad/yeni-kullanicilar/tur-2/y01-ilk-atak-gece/`.

## 2. Akış günlüğü (gerçek koşu; ⚠ = duraksadım)
| sn | Ekran | Ne oldu |
|---|---|---|
| 0 | Karşılama | Kart artık "…baş dönmesi için test ve manevra. **Tanınız olmasa da kullanabilirsiniz.**" Ses de "üstteki büyük düğmeye dokunun" diyor. Duraksamadım. |
| 5 | Kurulum | "Başla" soluk; hemen üstünde "Yukarıdaki metni okudum, kabul ediyorum" kutusu, ses de onu söylüyor. Kutu → Başla. (Betikte onaysız Başla'yı yine denedim; bir şey olmuyor, ses kutuyu gösteriyor.) Kurulum sesi 27 s uzun ama dokununca kesiliyor. |
| 14 | Ana ekran | Büyük "Başım dönüyor". Altına "Doktorunuz hangi kulak dedi? Sağ / Sol / Bilmiyorum" eklenmiş; doktorum yok, geçtim. |
| 15 | Güvenlik listesi | Simgeli, gündelik dil. Kusma maddesi: "Ateşim var ya da kusmaktan su bile içemiyorum — **bulantı ve bir iki kez kusma olağandır; sayılmaz**". Tereddüt etmedim. |
| 29 | "Ne başlatıyor?" | Aynı, kolay. |
| 40 | Hazırlık | Kısa liste; işitme cihazı, titreşimler ve "Kim yapıyor" katlanmış "Ayrıntılar"da. **"Hazırım" altta sabit**, ses "ekranın altındaki Hazırım". Kaydırmadım. |
| 54 | Telefonu tanıtma | Sesle 42 s, hiç dokunmadan. |
| 109 | Sağ test | Döndü, dokundum. 30 s sonra "Baş dönmesi sürüyor mu? Geçtiyse ekrana dokunun" hatırlatması geldi (iyi); dokununca kesildi. |
| 236–405 | Ara + sol test | Aynı, akıcı. |
| 406 | Geçiş | "Sağ tarafta baş dönmesi oldu. Şimdi sağ taraf için manevra… dokunun." |
| 424 | **Epley başladı** | 5 adım, ses + sayım. |
| 698 | Sonrası | "Hafif baş dönmesi ya da bulantı" → "normaldir… Tekrar testi 05:55". Bitiş → ana ekran → rapor. |

**Ölçümler (tur-1 → tur-2)**
| | tur-1 gerçek | tur-2 gerçek | tur-2 negatif | tur-2 hızlı |
|---|---|---|---|---|
| İlk açılış → manevra | 414 s | **424 s** | 444 s | 339 s |
| Dokunuş (manevraya kadar) | 11 + 1 kaydırma | **10**, kaydırma yok | 10 + karar | 14 |
| "Ne yapacağımı bilemedim" | 3 | **0** | 0 | 0 |

Manevraya kadar okunacak metin ~5.650 harf, ses 54 cümle (kesilen uzun kurulum cümlesi dahil). Süre değişmedi; zamanın çoğu
iki test (~5 dk) ve sesli yerleştirme.

**Negatif koşu:**
- Karar ekranında en üstte büyük dolu düğme: "**Hangi yan bilmiyorum: iki tarafa sırayla manevra**". Bastım.
- Manevra **doğrudan** başladı: ayrı "Başlat" ekranı ve ikinci "Kim yapıyor" sorusu yok; yalnız ~30 s yeniden yerleştirme var.
- Sağ Epley bitti. "Sıra öbür tarafta… dokunun" ekranından sonra sol Epley yapıldı. Toplam 17 dk.

**Hata denemeleri:**
- ✓ Çift dokunuş (150 ms) güvenlik listesini atlatmıyor.
- ✓ "Kusma" uyarısında "Yine de devam et (4)" geri sayımla kilitli; sonra kayda `RED_FLAG: fever` düştü.
- ✓ Geri tuşu manevrayı duraklatıyor; hazırlıkta geri tuşu → ana ekran, "kaldığınız yerden".
- ✗ Manevra ortasında kapatıp açınca rapora "**yarıda kaldı (3. adımda uygulama kapandı ya da yenilendi)**" yazıyor (yeni ✓).
  Ama açılışta yine Hazırlık baştan geliyor, Epley 1. adımdan başlıyor ve önce ~30 s yerleştirme var.

## 3. 1. kullanımdaki isteklerim
| Tur-1 # | İsteğim | Sonuç |
|---|---|---|
| 1 | "Hazırım" altta sabit, ayrıntılar katlanır | **karşılandı** (düğme 582–654/664 px; ses "ekranın altındaki") |
| 2 | Karar ekranında tek büyük önerilen düğme | **karşılandı** ("Hangi yan bilmiyorum" dolu ve en üstte). Not: "ekrana bakın"dan sonraki ilk 6 s'de seçenekler sesle okunmadı. |
| 3 | Karşılamada "tanınız olmasa da" | **karşılandı** |
| 4 | Onay kutusu "Başla"nın hemen üstünde | **karşılandı** (Başla soluk, ses kutuyu gösteriyor) |
| 5 | Raporda uygulama kararı ayrı; "uyarıya rağmen" ve "taraf seçilmedi" düzelsin | **kısmen**: "Uygulamanın kararları" ayrı başlık, gerçek koşuda aşma "yok" ✓. Ama negatif koşuda uygulamanın **önerdiği** büyük düğmeye bastığım hâlde "kullanıcının aştığı uyarılar: 1 — test baş dönmesi başlatmadığı hâlde manevraya geçildi" yazıyor. |
| 6 | Yarıda kalan manevra kayda geçsin + "baştan / bitir" sorusu | **kısmen**: kayıt ✓; açılışta soru yok, Hazırlık ve yerleştirme baştan. |
| 7 | Karar sonrası manevra zincirlensin | **karşılandı** |
| 8 | Kusma maddesine "bulantı olağan" satırı | **karşılandı**. Uyarı ekranı hâlâ eski cümleyi kullanıyor ("Ateş ya da su bile içilemeyecek kadar kusma…"). |
| 9 | Hasta modunda "HASTANIN SAĞI", "Dix-Hallpike · sağ" yerine gündelik dil | **karşılanmadı** |
| 10 | Bitişte test saati tek kez; ana ekranda "sıradaki adım" açık olsun | **karşılanmadı** (saat iki kez yazıyor; "Atağınızın sıradaki adımı gösterilir" duruyor) |

## 4. Kalan ve yeni sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Orta | Yarıda bırakma → yeniden açılış | Hazırlık baştan, Epley 1. adımdan; ~30 s yerleştirme. Neden baştan olduğunu söylemiyor. | Açılışta "Manevra 3. adımda yarıda kaldı. Baştan yapalım mı? / Bugünlük bitir" (sesli), sonra hazırlık atlanıp doğrudan yerleştirme. | Evet (hızlı koşu) |
| 2 | Orta | Rapor › Araştırma kaydı (negatif yol) | Önerilen düğmeyi seçmek "kullanıcının aştığı uyarı" sayılıyor; hekim beni uyarıyı aşmış sanacak. | Önerilen seçenek "Seçimler" altında yazılsın; aşma yalnız önerilmeyen seçenekte (ör. tek tarafa manevra) sayılsın. | Evet (rapor + kayıt) |
| 3 | Düşük | Karar ekranı sesi | "Telefonu alnınızdan alın ve ekrana bakın"dan sonraki 6 s'de ne önerildiği söylenmedi. | "Önerim: iki tarafa sırayla manevra. Büyük düğmeye dokunun." diye tek cümle. | Evet (ses kaydı) |
| 4 | Düşük | Yürütücü ekranı | "Epley · sağ", "Dix-Hallpike", "HASTANIN SAĞI / SOLU" | "Manevra · sağ", "Test · sağ", "SAĞINIZ / SOLUNUZ". | Evet |
| 5 | Düşük | Bitiş + ana ekran | Test saati iki kez; ana ekranda büyük düğme altında "Atağınızın sıradaki adımı gösterilir" belirsiz. | Tek satır: "Tekrar testi 05:55 — uyanınca 'Başım dönüyor'a basın". | Evet |
| 6 | Düşük | Ana ekran (tanısız) | Yeni "Doktorunuz hangi kulak dedi?" kutusu hekime gitmemiş kişiye fazladan metin. | Tanı yoksa tek satır "Hekim tanınız varsa girin" bağlantısı; kutu yalnız dokununca açılsın. | Evet |
| 7 | Düşük | Kusma uyarı ekranı | Liste gündelik dilde, uyarı eski dilde. | Uyarı da "Ateşiniz var ya da kusmaktan su içemiyorsunuz…" desin. | Evet |
| 8 | Düşük (yalnız demo) | Manevra öncesi yeniden yerleştirme | Demo modunda ekranda "Telefonu alnınıza yaslayın… Tavana bakın" yazarken ~30 s hiç ses yok. Gerçek modda konuşuyor olmalı, burada doğrulayamadım. | Demo modunda da yerleştirme cümleleri okunsun (araştırmada demo kullanan da olacak). | Kısmen (demo) |

Test sınırları: "Ekran açık tutulamıyor" uyarısı headless tarayıcıdan. Demo modunda yürütücü konuşmanın gerçek bitişini
değil, tahmini süreyi bekliyor.

## 5. Puan
- **Sezgisellik: 8/10** (tur-1: 6). Manevraya kadar hiçbir yerde duraksamadım; önceki üç takılma noktam (karşılama, onay
  kutusu, Hazırım) ve karar ekranı düzelmiş. Kalan pürüz: yarıda bırakınca baştan başlama, birkaç klinik kelime.
- **Genel memnuniyet: 8/10** (tur-1: 7). Ses beni korkuyla baş başa bırakmadı, baş dönmesi sürerken hatırlattı, bulantımı
  "olağan" diye açıkladı. Süre hâlâ 7 dakika ama nedenini biliyorum.
- **Bir yakınıma önerir miyim / kullanır mıyım:** Kullanırım; yalnız yaşayan annem için de öneririm.
