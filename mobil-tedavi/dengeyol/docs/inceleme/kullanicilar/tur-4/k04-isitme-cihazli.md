# Tur 4 (son) — k04: Kemal, 66, işitme cihazlı (Pixel 7)

## 1. Ben kimim, ne yapmaya çalıştım
Emekli teknisyenim. İki kulağımda orta-ileri işitme kaybı var, Bluetooth işitme cihazı kullanıyorum; yatarken cihaz kayıyor ya
da ıslık çalıyor. Sol arka kanal BPPV tanım var. 3. turdaki isteklerimi kendim kontrol ettim. Sonra boş bir telefonla
kurulumdan manevra sonrasına kadar her şeyi baştan yaptım. Bu tur `http://localhost:4181/` üzerinde yapıldı.

## 2. Yaşadıklarım
Nasıl denedim: Pixel 7 öykünümü kullandım, demo modu kapalıydı. Gerçek sensör yolunu `devicemotion` olaylarıyla taklit ettim.
Konuşma hızı **Çok yavaş** (0,65). Sahte yavaş TTS kullandım; bu hızda 6,5 harf/s.

- **Kurulum:**
  - Onam ekranında "Olası yan etkiler" ve "Seçenekleriniz" birer satıra indirilmiş, ayrıntısı dokununca açılıyor.
  - "Titreşimleri tanı"da 11 desen var, yeni olanı "Altı kesik vuruş: durun, yanlış taraf". Hepsini tek tek çaldım; her biri yazdığı ritmi verdi.
- **Güvenlik soruları (14):** Sesli metinler 3. turla aynı uzunlukta.
  - İlk soru 29 s, ortostatik soru 21 s, kulak sorusu 25 s, "BPPV'den farklı mı" 29 s sürüyor.
  - Sentezde bu sorular "klinik ekibin kararı" olarak bırakılmış.
- **Seçenekli ekranlar:** Artık soru ve seçeneklerin yalnız kısa adları okunuyor, alt açıklamalar okunmuyor.
  - Alt tip ekranı 37 s'den 33 s'ye indi.
  - Süre ekranı 42 s'den 28 s'ye indi.
  - Taraf ekranı 44 s'den 23 s'ye indi.
- **Hazırlık:** Ekran açılınca kısa hâli okunuyor (19 s). İşitme cihazı notunun hemen altında **"Titreşimleri tanı"** var ve
  yerinde açılıyor. Yeni "yanlış taraf" titreşimini burada denedim; akış sıfırlanmadı.
- **Testler:** 2. ve 3. turda düzelen her şey yerinde duruyor:
  - Her adımda "doğru" titreşimi yönerge bittikten sonra geliyor.
  - Oturuş cümlesi kesilmeden tam okunuyor.
  - Ara ve karar ekranlarında "iki kısa" titreşim var.
  - Ara dinlenmede süresi geçmiş sayım okunmuyor.
- **Epley sol:**
  - **Kayma:** Cihaz ıslık çalınca düzeltirken başım kaydı. Vızıltı ve düzeltme cümlesi geldi. Geri döndüğümde 0,4 s içinde "1 uzun" titreşim geldi ve hemen "Tamam" denildi; eski ipucu silindi.
  - **Yanlış taraf:** 4. adımda yanlışlıkla sol yanıma yuvarlandım. **0,2 s içinde** "altı kesik vuruş" titreşimi ve "Dur! Yanlış taraf." (3 s) geldi. Ardından "Önce sırtüstüne dönün, sonra bütün vücudunuzla sağ yanınıza dönün." dendi. Ekranda kırmızı kutuda "DUR — yanlış taraf… HASTANIN SAĞ YANINA (yüzüstünden değil)" yazıyordu.
  - Sesi duymasam da altı kesik vuruşu tanırdım. Ama sırtüstüne geldiğimde "şimdi doğru yana" diyen bir titreşim gelmedi (5 s sessizlik). Doğru yana geçince "1 uzun" ve "Tamam" geldi.
  - **Duraklatma:** Geri tuşuna bastım; ses artık eylemle başlıyor: "Duraklatıldı. Devam için ekrana iki saniye basılı tutun." Bütün metin yine 198 harf, yani 31 s. Basılı tutunca devam etti; kalıcı sonuçlu düğmeler artık bir onay daha istiyor.
- **Manevra sonrası:**
  - Telefon alnımdayken yalnız "Telefonu alnınızdan alın ve ekrana bakın." dendi.
  - Telefon elimdeyken soru 36 s sürdü (önceki turda 50 s).
  - Dinlenme cümlesi 33 s'den 12 s'ye indi: "On dakika oturun; tutunarak kalkın. Saat 13:39 civarında tekrar test edeceğiz."
- **İşitme cihazım çıktı ve ekrana kazara dokundum:**
  - Ritmi bilen Kemal: 15. saniyede kısa-kısa-UZUN'u tanıdı ve dokundu. Manevra tamamlandı, kilit açılmadı.
  - Ritmi bilmeyen Kemal: 2. dakikada durdurma ve hekim kilidi geldi; kırmızı çizgi korunuyor. Son hatırlatma kısalmış (10,8 s), durdurma cümlesinden önce bitiyor.
- **Toplam:** Oturum 21,5 dakika sürdü, bunun 17,3 dakikası konuşma (106 cümle). Soru ve seçim bölümü 7 dakika.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| — | — | **3. kullanımdaki isteklerim** | | | |
| 1 | Orta→ | Seçenekli ekranlar | **Karşılandı** (istediğim ikinci yol). Soru ve seçeneklerin kısa adları okunuyor, alt açıklamalar okunmuyor: 37–44 s'den 23–33 s'ye indi. | — | Evet (`r2-log.json` 319–403 s) |
| 1b | Orta→ | Kırmızı bayrak sesli biçimi | **Kısmen.** Ortostatik (21 s), kulak (25 s) ve "farklı mı" (29 s) soruları aynı kaldı. Sentezde klinik karar olarak bırakılmış; gerekçeyi anlıyorum. | Bkz. 4. | Evet |
| 2 | Düşük→ | Duraklatma sesi | **Karşılandı.** Eylem ilk cümlede söyleniyor. Metnin tamamı hâlâ 31 s. | Bkz. 6. | Evet (1071 s) |
| 3 | Düşük→ | Hazırlıkta "Titreşimleri tanı" | **Karşılandı.** Yerinde açılıyor ve akışı bozmuyor. | — | Evet (`r2-07-hazirlik-titresim.png`) |
| — | — | **Yeni özellik kontrolü** | | | |
| — | — | Yanlış taraf | **Çalışıyor.** 0,2 s'de kendine özgü titreşim ve kısa "Dur! Yanlış taraf.", ardından ne yapılacağı söyleniyor; ekranda kırmızı kutu var. | — | Evet (1051–1055 s) |
| — | — | **Kalan ya da yeni sorunlar** | | | |
| 4 | Orta | Kırmızı bayrak soruları (sesli biçim) | Çok yavaş hızda dört soru 21–29 s sürüyor. Sonunu kaçırınca "Tekrar dinle"ye basıyorum ve süre ikiye katlanıyor. | Klinik ekip onaylarsa "… sayılmaz" açıklamaları yalnız ekranda kalsın, sesli soru gövdesi ≤ 12 s olsun. | Evet |
| 5 | Düşük | Yanlış taraftan sırtüstüne dönüş | Sırtüstüne geldiğimde bir şey söylenmiyor ve titreşim gelmiyor. Sesi duymayan biri "sırtüstüne geldim, şimdi doğru yana dönebilirim" bilgisini alamıyor. | Sırtüstüne dönülünce "2 uzun" (hareket et) titreşimi ve kısa "Tamam, şimdi sağ yanınıza." | Evet (1061–1066 s arası sessiz) |
| 6 | Düşük | Duraklatma sesinin uzunluğu | 198 harf, 31 s. Eylem başta olduğu için sorun küçük, ama boyun ağrısı ve "Pozisyona gelemiyorum" bölümü yatarken uzun geliyor. | İlk iki cümleden sonrası "Tekrar dinle"ye ya da 10 s sonraki ikinci bir okumaya bırakılsın. | Evet |

## 4. Sevdiklerim
- Titreşimlerin artık eksiksiz bir dili var: hareket et, doğru, bozuldu, adım bitti, bitti, hazırsan dokun, işaretli, geçti,
  duraklatıldı, yanlış taraf ve dur. İşitme cihazım çıksa bile manevrayı güvenle bitirebiliyorum.
- Yönergenin gerçek bitişini bekleme, kaymadan dönüşte hemen "Tamam", telefon alnımdayken yalnız tek bir kısa cümle.
- Kırmızı çizgiler hiç gevşemedi; benim için yapılan her değişiklik onları bozmadan eklenmiş.

## 5. Memnuniyet: 9,5/10 (6 → 8 → 9 → 9,5)
İşitme cihazlı biri için istediğim her şey ya yapıldı ya da gerekçeyle bırakıldı. Kalan iki konu küçük: birkaç uzun güvenlik
sorusu ve yanlış taraftan sırtüstüne dönünce gelmeyen titreşim.

**Bu sürümü bir yakınıma önerir miyim: Evet. Koşulu:** ilk kurulumda "Titreşimleri tanı" bir kez birlikte denensin; işitme
cihazı Bluetooth ile bağlıyken "Sesi dene" ile ses kontrol edilsin. Titreşimlerin alında gerçekten ayırt edilebildiği de gerçek
bir telefonda bir kez doğrulansın (bu denemede ancak kayıtla doğruladım).

---
Kanıtlar: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-4/k04-isitme-cihazli/`
- `r1-*`: kurulum.
- `r2-*`: gerçek sensör yolu, tam atak; kayma, yanlış taraf ve duraklatma dahil.
- `b-*`, `b2-*`: işitme cihazı çıktı senaryosu, sırasıyla ritmi bilmeyen ve bilen Kemal.
- `*-log.json` dosyaları `analiz.cjs` ile okunur.
