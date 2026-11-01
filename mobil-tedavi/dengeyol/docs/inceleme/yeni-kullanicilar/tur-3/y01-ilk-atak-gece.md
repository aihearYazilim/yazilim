# y01 — İlk atak, gece 03:00 (Ayşe, 52, muhasebeci) · tur-3 (3. kullanım)

## 1. Ben kimim, ne yapmaya çalıştım
Yine Ayşe: gece kalkarken dünya dönüyor, midem bulanıyor, tanım yok; uzun yazı okumam, büyük düğmeye basarım. Son sürümü
baştan sona kullandım. 2. kullanımdaki isteklerimi tur-2 sentezinden (M1-1, M1-3, M1-6, M1-7, M1-8, M1-9, M2-2, M2-6)
kendi gözümle denetledim.

Yöntem öncekiyle aynı: iPhone 13, demo sensör, ×1 gerçek hız, gerçek süreli sahte Türkçe ses, cümleler zamanıyla kayıtlı.
Üç tam koşu yaptım, hepsi ilk açılıştan başladı:
- **gerçek:** sağda baş dönmesi işaretledim.
- **negatif:** test baş dönmesi yapmadı, karar ekranına geldim.
- **hızlı:** çift dokunuş, geri tuşu, manevranın ortasında sayfayı yeniden yükleme.

Ayrıca kısa denemeler yaptım:
- "Kusma"yı işaretleyip uyarıyı aşma.
- Yarıda bırakmanın iki yolu (×20 hızla): aynı sayfayı yenilemek ve ana ekrandan yeniden açmak.

Betikler: `scratchpad/yeni-kullanicilar/tur-3/y01-ilk-atak-gece/`.

## 2. Akış günlüğü (gerçek koşu)
| sn | Ekran | Ne oldu |
|---|---|---|
| 0 | Karşılama | "Tanınız olmasa da kullanabilirsiniz". Ses büyük düğmeyi gösteriyor. |
| 6 | Kurulum | Kutu hemen Başla'nın üstünde, Başla soluk. Kutu → Başla. |
| 16 | Ana ekran | Tertemiz: büyük "Başım dönüyor", altında yalnız küçük "Doktorum tanı koydu" bağlantısı. Kulak düğmeleri ve "tanı girilmedi" paragrafı kalkmış. Hiç duraksamadım. |
| 17 | Güvenlik listesi | ⚠ Açılış sesi artık **24,5 s** (tur-2'de 8 s), bütün maddeleri sayıyor. Ses bitsin diye bekledim, "Hiçbiri yok" diyebilmem 30 s sürdü. Kusma maddesi gündelik dilde. |
| 48 | "Ne başlatıyor?" | Seçenekler numaralı (1-2-3). Kolay. |
| 59 | Hazırlık | "Hazırım" altta sabit; ayrıntılar katlı. |
| 73 | Telefonu tanıtma | "Başla" artık altta, ses de "ekranın altındaki Başla" diyor. Sonra 40 s dokunuşsuz. |
| 126 | Testler | Giriş cümlesi artık kesilmiyor. Yeni bir cümle de var: "Yatağın ortasında oturun; düşmemek için kenara yakın olmayın" (yalnız biri için iyi). Ekranda "Baş dönmesi testi · sağ", "SAĞINIZ / SOLUNUZ". |
| 444 | Geçiş | "Sağ tarafta baş dönmesi oldu…" → dokundum. |
| 463 | **Manevra başladı** | Başlık "Manevra · sağ", adım adları gündelik ("Oturun, başınızı sağa çevirin"). |
| 741 | Sonrası | Seçenekler numaralı ve yüzlü (🙂 😐 🤢 ⚠️). 😐 Hafif → "normaldir… Tekrar testi 23:26". |
| 762 | Bitiş / ana ekran | Tek satır: **"Tekrar testi 23:26 — uyanınca 'Başım dönüyor'a basın"**, saat bir kez. Ana ekranda da aynı satır. |

**Ölçümler (tur-1 → tur-2 → tur-3)**
| | tur-1 | tur-2 | tur-3 gerçek | tur-3 negatif | tur-3 hızlı |
|---|---|---|---|---|---|
| İlk açılış → manevra | 414 s | 424 s | **463 s** | 490 s | 361 s |
| Dokunuş (manevraya kadar) | 11 + kaydırma | 10 | **10** | 10 + karar | 14 |
| "Bilemedim" anı | 3 | 0 | **0** | 0 | 0 |

+39 s'nin neredeyse tamamı güvenlik listesinin uzayan açılış sesi; dinlemeden basan kişide süre tur-2 ile aynı (hızlı koşu
361 s). Manevraya dek okunacak ekran metni ~5.400 harf.

**Negatif koşu:**
- Ses: "Telefonu alnınızdan alın ve ekrana bakın. **Önerim: iki tarafa sırayla manevra.**"
- Ekranda tek büyük düğme ("Hangi yan bilmiyorum…"); öteki 4 seçenek "Başka seçenekler (4)" altında katlı.
- Bastım. Bu kez yerleştirme sesli ("Telefonun arkasını alnınıza yaslayın… Kıpırdamayın… Tavana bakın… Tamam"), sonra sağ
  ve sol manevra yapıldı.
- Raporda "Uyarıya rağmen devam: **yok**". "Seçimler" altında "kullanıcının seçimi: Uygulamanın önerisi seçildi".

**Hata denemeleri:**
- ✓ Çift dokunuş (150 ms) listeyi atlatmıyor.
- ✓ Kusma uyarısı yeni gündelik cümleyle; "Yanlış dokundum, listeye dön" eklenmiş.
- ✓ Geri tuşu manevrayı duraklatıyor; ekranda "SAĞINIZ / SOLUNUZ".
- ✓ Yarıda bırakıp **ana ekrandan açınca** "Bugün: 0 manevra tamamlandı, 1 yarıda kaldı" yazıyor. "Başım dönüyor"a basınca
  soruyor: "**Manevra 3. adımda yarıda kaldı.** Baştan yapalım mı? Hazırlık yeniden sorulmaz… / Bugünlük bitir".
- ✗ Manevra sayfasını **olduğu gibi yenileyince** (Safari sekmeyi yeniden yüklediğinde) soru gelmiyor: Hazırlık baştan
  geliyor. Rapora "yarıda kaldı (3. adımda)" yine yazılıyor.

## 3. 2. kullanımdaki isteklerim
| Tur-2 # | İsteğim | Sonuç |
|---|---|---|
| 1 | Yarıda kalan manevra açılışta sorulsun, hazırlık atlansın (M1-7) | **kısmen**: ana ekrandan açınca soru ve atlama ✓. Manevra sayfası yenilenince soru yok, Hazırlık baştan. |
| 2 | Önerilen düğme "aşma" sayılmasın; karar ekranında "Önerim: …" (M1-3, M1-6) | **karşılandı** (rapor, ses, katlı seçenekler) |
| 3 | Karar ekranında ilk ses öneriyi söylesin | **karşılandı** |
| 4 | Yürütücüde gündelik dil (M2-2) | **karşılandı** ("Manevra · sağ", "SAĞINIZ / SOLUNUZ", "Oturun, başınızı sağa çevirin"). Göstergede hâlâ "sağa 45°" yazıyor; çok küçük. |
| 5 | Bitiş ve ana ekranda tek satır sonraki adım, saat bir kez (M1-8) | **karşılandı** |
| 6 | Tanısız ana ekranda kulak kutusu olmasın (M1-1) | **karşılandı** (yalnız "Doktorum tanı koydu" bağlantısı) |
| 7 | Kusma uyarısı gündelik dilde (M1-9) | **karşılandı** |
| 8 | Demo modunda yerleştirme sesli olsun (M2-6) | **karşılandı** (test giriş cümlesi de artık kesilmiyor) |

## 4. Kalan ve yeni sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Orta | Yarıda bırakma, aynı sayfa yenilenince | Manevra adresinde sayfa yeniden yüklenince "yarıda kaldı" sorusu yok; Hazırlık ve yerleştirme baştan. Ana ekrandan açınca doğru çalışıyor. | Atak sayfası açılırken de yarım manevra kaydı varsa önce aynı "3. adımda yarıda kaldı — Baştan yapalım / Bugünlük bitir" sorusu gelsin. | Evet (hızlı koşu + iki yol denemesi) |
| 2 | Orta | Güvenlik listesi açılış sesi | 8 s'den 24,5 s'ye çıktı (bütün maddeler okunuyor). Sesi dinleyen kişi için manevraya +30 s. Gece korkmuş biri için uzun. | Açılışta tek cümle (~8 s): "Listede şu an olan bir şey varsa işaretleyin; yoksa Hiçbiri yok'a dokunun." Maddelerin okunuşu "Listeyi dinle"de kalsın. | Evet (ses kaydı) |
| 3 | Düşük | Bitiş ekranı | Tek satır sonraki adım var ama üstünde ~400 harflik paragraf (bulantı, kusma, 10 dk oturma, kalkış) duruyor. | En üstte iki kısa satır ("10 dakika oturun." ve "Tekrar testi 23:26…"); paragraf "Ayrıntıyı dinle / oku" altında katlı olsun. | Evet |
| 4 | Düşük | Yürütücü göstergesi | Başlıklar gündelik, ama göstergede "sağa 45°" kalmış. | "sağa yarıya kadar". | Evet |
| 5 | Düşük | Ana ekran › Tekrar testi kartı | Üstteki tek satırın altında aynı bilgi kartta yeniden ("saati yukarıda"). | Kart kalksın ya da yalnız "Takvime ekle" düğmesi kalsın. | Evet |

Test sınırları: "Ekran açık tutulamıyor" uyarısı headless tarayıcıdan geliyor.

## 5. Puan
- **Sezgisellik: 9/10** (6 → 8 → 9). Baştan sona hiçbir yerde ne yapacağımı düşünmedim. Karar ekranı artık "önerim şu, büyük
  düğmeye bas" diyor. Yarıda bırakınca soruyor; kelimeler benim dilimde.
- **Genel memnuniyet: 8/10** (7 → 8 → 8). Her şey yerli yerinde. Yine de güvenlik listesinin uzun okunuşu ve 7–8 dakikalık
  toplam süre gece yarısı sabrımı zorluyor.
- **Bir yakınıma önerir miyim / kullanır mıyım:** Kullanırım; yalnız yaşayan annem için de gönül rahatlığıyla öneririm.
