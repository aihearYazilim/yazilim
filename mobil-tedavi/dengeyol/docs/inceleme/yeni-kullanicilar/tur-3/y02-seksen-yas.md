# y02 — Hüseyin, 81 yaşında (tur 3, 3. kullanım)

## 1. Ben kimim, ne yapmaya çalıştım
81 yaşında, yalnız yaşayan emekli çiftçiyim. Ellerim titrer, yazıyı zor okurum, sesle giderim. Telefonum Android (Pixel 7), yazı
"Çok büyük", ses "Yavaş". KBB hekimi "sağ kulakta kristal" demişti. Son sürümü baştan sona yeniden kullandım ve 2. kullanımdaki
isteklerime kendi gözümle baktım (tur-2/00-SENTEZ.md). Bu sefer özellikle kulak düğmelerinde ve güvenlik listesinde yanlış dokunuşu,
ayrıca karar ekranını denedim.

Yöntem: Playwright, Pixel 7, demo sensör, gerçek hız (×1). Sahte ses Yavaş hızda her cümleyi zamanıyla kaydetti. Betikler:
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/yeni-kullanicilar/tur-3/y02-seksen-yas/`. Çalıştırmalar:
- b1: baştan sona; araya güvenlik listesinde yanlış "boyun" dokunuşu ve geri alma girdi.
- b2: yanlışlıkla "Sol kulak" ve ikinci hata olarak "Evet"; yalnız sol test, dönme yok.
- b3: b2'nin devamı; önerilen "Sağ tarafı da test et" ve ardından taraf çelişkisi ekranı.
- a2, a3: kulak düğmesi onayı ve aynı noktaya çift dokunuş. a4: listede yanlış dokunuş ve kayıt.

## 2. Akış günlüğü (⚠ = duraksadım, ✓ = iyi)
1. **Karşılama** ✓: Konuşuyor, "üstteki büyük düğme" diyor. Dokundum.
2. **Kurulum** ✓: Kısa sesli özet var (~34 s). Kabul yazısı ve Başla alt alta duruyor.
3. **Ana ekran** ⚠: **Hâlâ sessiz.** "Başım dönüyor" kocaman. Altında "Doktorum tanı koydu" düğmesi var; okuyabildim çünkü kısa ve büyük
   yazılmış. Dokununca ses "Doktorunuz hangi kulak dedi? Sağ kulak, sol kulak ya da doktor söylemedi" dedi ✓. "Sağ kulak"a basınca
   "Sağ kulak dediniz, doğru mu?" diye sordu. "Evet"e bastım, "Sağ kulak kaydedildi" dedi ✓.
   - Titrek elle "Sol"a dokununca da aynı soru geliyor, "Hayır" ile dönülüyor (a2).
   - "Sol"un yerine 0,4 s arayla iki kez dokundum; "Evet" düğmesi tam o noktaya geliyor ama ikinci dokunuş sayılmadı ✓ (a3).
4. **Güvenlik soruları** ✓: Açılış sesi artık bütün maddeleri tek tek adıyla kısaca sayıyor (~33 s): "sürekli dönme, çift görme,
   … boyun incinmesi, ateş, çok kusma". Uzun listeyi dinlemem gerekmedi.
   - Titrek elim "boyun"a değdi, büyük düğmeye bastım. Uyarı ekranında artık **"Yanlış dokundum, listeye dön"** var, ona bastım ✓.
     Raporda bu "yanlış dokundum ile düzeltildi" diye yazıyor, "atak durduruldu" demiyor ✓.
   - ⚠ "İşaretlendi: Son bir ayda boynu…" cümlesi büyük düğmeye basınca 0,5 s'de kesildi.
   - ⚠ Listeye dönünce 33 s'lik açılış sesi baştan okundu.
5. **"Ne başlatıyor?"**, **Hazırlık** ✓: Hazırım altta sabit.
6. **Telefonu tanıtma** ✓: Ses konuşuyor ve "ekranın altındaki Başla" diyor; Başla artık altta sabit ve tam görünüyor.
7. **Test** ✓: "Hekiminizin dediği sağ tarafı test ediyoruz." İlk cümle "Yatağın ortasında oturun; düşmemek için kenara yakın olmayın."
   Bunu istemiştim, yalnız yaşayan biri için çok iyi. Başlıklar artık "Baş dönmesi testi · sağ" ve "SAĞINIZ" ✓. Başım döndü,
   dokundum, geçince yine dokundum.
8. **Karar ve Epley** ✓: "Sağ tarafta baş dönmesi oldu…", dokundum. Ekranda "Manevra · sağ — Adım 1/5". Ses ve ekran uyumlu.
9. **Sonrası** ✓: Seçenekler numaralı ve yüz simgeli, "1 🙂 İyiyim". Bitişte tek satır: "Tekrar testi 23:30 — uyanınca 'Başım
   dönüyor'a basın". ⚠ Ana ekranda aynı satır "23:29" diyor, bir dakika fark var.
10. **Rapor** ✓: "Uyarıya rağmen devam: yok". Ayrı başlıklarda uygulamanın kararı ve "yanlış dokundum ile düzeltildi" satırı var.

**Karar ekranı** (b2, b3) ✓: Kulak yanlışını "Evet" ile de onaylasam, sol test dönme yapmayınca ses "Önerim: sağ tarafı da test
etmek" diyor. Ekranda tek büyük düğme "1 Sağ tarafı da test et" var, diğerleri "Başka seçenekler (5)" altında katlı. Ona bastım, sağ
test edildi, dönme oldu.
- ⚠ Sonra "Taraf hekiminizin dediğinden farklı. Test sağ, hekiminiz sol demişti" ekranı geldi. 1. seçenek "Test tarafına devam
  (sağ)" doğru. Ama "Doktorum aslında sağ dedi, yanlış girmişim" diyebileceğim bir düğme yok. Yanlış "sol" kaydı yerinde kalıyor ve
  sesli bir "Önerim" de yok.

**Ölçümler** (b1, gerçek hız; boyun yanlışı ve geri alma dahil):
- İlk açılıştan manevranın ilk yönergesine **432 s (7,2 dk)**. Yanlış dokunuş olmasa ≈ 6,2 dk.
- Manevranın bitişi: ilk açılıştan 717 s (12 dk) sonra.
- Manevraya kadar 17 dokunuş, yanlışsız 14 ("Doktorum tanı koydu" ve "Evet" iki dokunuş ekledi). Rapora kadar 20.
- Konuşma: 72 cümle, 4622 harf, ≈ 7,6 dk.
- "Ne yapacağımı bilemedim" anı: **1** (tur 1'de 7, tur 2'de 3): sessiz ana ekranda neye basacağım. Çift hata senaryosunda buna
  "hekiminiz sol demişti" şaşkınlığı eklendi.

## 3. 2. kullanımdaki isteklerim
| # | 2. kullanımdaki isteğim | Durum | Kendi gözümle |
|---|---|---|---|
| 1 | Kulak düğmesinde yanlış dokunuşa sesli onay; tek taraf testi negatifse öneri "öbür tarafı test et" | **karşılandı** | "Sol kulak dediniz, doğru mu?" soruluyor, çift dokunuşa karşı korumalı. Negatif testte öneri "Sağ tarafı da test et" (a2, a3, b2) |
| 2 | 112 dışı maddede "Yanlış dokundum"; raporda "düzeltildi" | **karşılandı** | b1, a4 |
| 3 | Karar ekranında tek büyük düğme, gerisi katlı | **karşılandı** | "Başka seçenekler (5)" (b2) |
| 4 | Liste tek tek sorulsun; "İşaretlendi" cümlesi bitmeden düğme kilitli olsun | **kısmen** | Açılış sesi maddeleri kısaca sayıyor (≈ tek tek dinleme). Var/Yok sorusu yok; "İşaretlendi" cümlesi hâlâ 0,5 s'de kesiliyor |
| 5 | Telefonu tanıtmada Başla altta sabit | **karşılandı** | b1 |
| 6 | Ana ekran açılınca kısa konuşsun | **karşılanmadı** | Ana ekranda hiç ses yok |
| 7 | Noktasız, tekrarlı ses cümlesi düzelsin | **karşılandı** | Ses yalnız "Önerim: sağ tarafı da test etmek" diyor |
| 8 | Sade başlıklar; yalnız yaşayana güvenlik cümlesi | **karşılandı** | "Baş dönmesi testi · sağ", "Manevra · sağ", "SAĞINIZ"; "Yatağın ortasında oturun…" |

## 4. Kalan ve yeni sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Orta | Ana ekran | Ekran sessiz. "Doktorum tanı koydu" yalnız yazıyla duruyor; okuyamayan biri bilmez, iki taraf test edilir (+3 dk). | Açılınca bir kez söylesin: "Başınız dönüyorsa üstteki büyük düğmeye dokunun. Doktorunuz hangi kulak dediyse önce alttaki 'Doktorum tanı koydu'ya dokunun." | Evet (b1) |
| 2 | Orta | Taraf çelişkisi ekranı | Hekim tanısı yanlış girildiyse düzeltme yolu yok. Ekran "hekiminiz sol demişti" diyor, yanlış kayıt kalıyor, "Önerim" sesi yok. | Seçenek eklensin: "Yanlış girmişim, doktor sağ dedi: kaydı düzelt". Ses "Önerim: test tarafına devam" desin. | Evet (b3) |
| 3 | Düşük | Güvenlik listesi | "İşaretlendi…" cümlesi büyük düğmeye basınca 0,5 s'de kesiliyor. "Yanlış dokundum"dan sonra 33 s'lik açılış sesi baştan okunuyor. | Cümle bitene dek (≈ 2 s) büyük düğme kilitli olsun. Dönüşte yalnız "Düzeltildi. Başka yoksa Hiçbiri yok'a dokunun" desin. | Evet (b1) |
| 4 | Düşük | Bitiş ve ana ekran | Tekrar testi saati bitiş ekranında 23:30, ana ekranda 23:29. | Saat bir kez hesaplansın, iki ekranda aynı yazsın. | Evet (b1) |
| 5 | Düşük | Negatif test karar metni | Ekranda "Önce sağ tarafı da test edelim…" ile "baş dönmeniz kristal oynamasından olmayabilir" yan yana; ikisi çelişiyor gibi. | Tek taraf testinden sonra "kristal olmayabilir" cümlesi gösterilmesin, iki taraf da negatifse gösterilsin. | Evet (b2) |

Notlar:
- Demo modunda "Şu an nasılsınız?" sorusu telefon alından inmedikçe okunmuyor; kod bunu sensörle algılıyor, gerçek telefonda okunur.
  Ben 7 s sonra ekrandan "İyiyim"i seçtim.
- Kesilen başka yönerge duymadım.

## 5. Puanlar
- **Sezgisellik: 8/10** (5 → 7 → 8): Telefon alnıma konana kadar her ekran konuşuyor, ana ekran hariç. Düğmeler göründüğü yerde,
  titrek elimin her yanlışı soruluyor ya da geri alınabiliyor. Yanlış kulak bile beni artık yanlış tarafa götürmüyor.
- **Genel memnuniyet: 8/10** (6 → 7 → 8): Hekimin dediği kulağı sorup yalnız o tarafı test etti, 6 dakikada manevraya başladım.
  Rapor doğru ve hekime gösterilecek kadar düzgün.
- **Bir yakınıma önerir miyim / kullanır mıyım?** Evet, yalnızken de kullanırım. Yaşıtlarıma öneririm. Torunuma "ilk açışta
  'Doktorum tanı koydu'ya basıp sağ kulağı seç" demesini söylerim, çünkü ana ekran bunu sesle söylemiyor.
