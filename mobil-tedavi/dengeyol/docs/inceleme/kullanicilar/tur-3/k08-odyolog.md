# Tur 3 · k08 · Odyolog Zeynep (36, devlet hastanesi, klinisyen modu)

## 1. Ben kimim, ne yapmaya çalıştım
Aynı odyoloğum: günde ~8 hasta görüyor, hasta başına 15 dakikam var, VNG/Frenzel kullanıyorum. 2. kullanımdaki isteklerimi kendi gözümle
kontrol ettim: klinisyen ses düğmesi, kısa HBYS notu, hazır gelen gözlem yöntemi, PDF'deki boş sayfa, kılavuzdaki VNG yolu. Aynı 5 senaryoyu
yeniden yaptım (iPhone 13 öykünümü, demo sensör, gerçek hız):
- H1: sağ arka kanal, ses "kısa"
- H2: yatay kanal geotropik, BBQ'da ses "açık"
- H3: VNG ile sensörsüz, ≥1 dk yanıt, ses "kapalı"
- H4: çok kanallı, bulgular elle girildi
- H5: iki taraflı pozitif Dix-Hallpike, taraf torsiyonla

## 2. Yaşadıklarım (kısa günlük)
- **Profil:** Yeni bir alan var: "Bulgu formunda gözlem yöntemi hazır gelsin" (VNG / Frenzel / Çıplak göz / Son muayenedeki). H1'de Frenzel'i,
  H3'te VNG'yi seçtim (+1 dokunuş, bir kez). Sonraki bütün formlarda yöntem hazır geldi. H2'de "Son muayenedeki" seçiliydi; önceki
  muayenenin Frenzel'i geldi.
- **H1, sağ arka kanal: 6,6 dk, 42 dokunuş** (2. tur: 6,6 dk / 43). Gecikme ve süre yine işaretlerimden doğru doldu.
  - "Ses: kısa" varsayılan. Telefon artık yalnız adım adını hastaya göre söylüyor ("Sırtüstü, baş hastanın sağına 45° ve sarkık.").
    Ardından "Pozisyon doğru", "45 saniye kaldı", "Adım tamam" geliyor.
  - Uzun klinisyen cümleleri ve "Nistagmusu gözleyin…" artık okunmuyor. Hasta başında ses çok daha sakin.
- **H2, yatay kanal: 8,8 dk, 57 dokunuş.** BBQ başında sesi "açık"a aldım: uzun cümleler geri geldi ("Hasta aynı yönde dönerek
  yüzüstü…"). Seçim bir sonraki teste de taşındı. Gerektiğinde seçebilmek iyi.
- **H3, VNG ile sensörsüz: 6,4 dk, 51 dokunuş** (+2'si ses düğmesi).
  - "Ses: kapalı"da test sırasında konuşma kesildi.
  - Yine de her test başında "Başlıyoruz." deniyor. İlk adımın cümlesi de ben düğmeye basamadan okundu.
  - Kapalıyken alt yazı, 2. adımdayken 1. adımın cümlesini ("Oturuş, baş hastanın sağına 45°") hoparlör simgesiyle göstermeye
    devam etti.
  - Reçete kilidi elle "kanalolitiazis" tanısında da yerinde.
- **Üst çubuk:** "Ses: kısa" düğmesi eklenince test başlığı ("Dix-Hallpike · sağ — Adım 2/3") 5 satıra sarıyor. **"Ekranı çevir"
  düğmesi sağ kenardan taşıyor:** iPhone 13'te 390 px'lik ekranda düğme x=371–397 arasında ve 26 px'e sıkışmış, yarısı görünmüyor.
  Dix-Hallpike'ta hastanın başucunda durduğum için bu düğmeye ihtiyacım var.
- **HBYS notu:** 12 satır, 886–1194 karakter (önce 1835). Manevra tek satır ("adım süreleri 5, 43, 30, 30, 30 s · nistagmus: 2. adımda
  gecikme 6 s, süre 8 s"). Yöntem bir kez yazılıyor. Açı istatistikleri yalnız basılı raporda. Tam istediğim gibi.
- **PDF:** 4 raporun dördü de tek A4 sayfa, boş sayfa yok.
- **Kılavuz:** B.3'te "VNG ile (sensörsüz)" paragrafı forma VNG değerini yazma yolunu ve ses düğmesini anlatıyor.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | — | Klinisyen sesi (`core/runner.ts` `stepSpeech`, `RunnerView` ses düğmesi) | **2. kullanımdaki isteğim: karşılandı.** Varsayılan "kısa": hastaya göre adım adı, sayım ve uyarılar; "açık" ve "kapalı" da çalışıyor; seçim kalıcı. (Kalan küçük kusurlar 7. ve 8. satırda.) | — | Evet (`speech.json`, 3 kip) |
| 2 | — | HBYS notu | **2. kullanımdaki isteğim: karşılandı.** Kısa: manevra tek satır, yöntem bir kez, açı istatistikleri yalnız PDF'te; 12 satır, ~900–1200 karakter. | — | Evet (`hbys-notu.txt`) |
| 3 | — | Gözlem yöntemi | **2. kullanımdaki isteğim: karşılandı.** Profilde seçilen ya da son muayenedeki yöntem her formda hazır geliyor. | — | Evet (H1, H2, H3) |
| 4 | — | Yazdır/PDF | **2. kullanımdaki isteğim: karşılandı.** Boş 2. sayfa yok; rapor, manevra tablosu, reçete, QR ve imza tek A4 sayfada. | — | Evet (Chromium PDF; Safari denenmedi) |
| 5 | — | Kılavuz, VNG yolu | **2. kullanımdaki isteğim: karşılandı.** `KULLANIM-KILAVUZU.md` B.3'te VNG değerini forma yazma yolu, hazır gelen yöntem ve ses düğmesi anlatılıyor. | — | Evet |
| 6 | Orta | Test ekranı üst çubuğu (`RunnerView.tsx` ~775–815) | Yeni, ses düğmesi eklenince ortaya çıktı. "Ses: kısa" yazılı düğme yer kaplıyor: başlık 5 satıra sarıyor ve **⟲ Ekranı çevir düğmesi sağdan taşıyor** (26 px genişlik, x=371–397 / 390). Başucunda dururken çevirme düğmesine güvenemiyorum. | Ses düğmesi yalnız simge olsun (durum aria-label'da, simge üstünde k/a/x işareti) ya da çubuğun ikinci satırına insin. Çevir düğmesi ≥44 px ve tamamen görünür kalsın. Başlık en çok 2 satır olsun. | Evet (ölçüm + ekran, sensörlü ve sensörsüz) |
| 7 | Düşük | Ses: kapalı | Tamamen sessiz değil: her test başında "Başlıyoruz." deniyor. Ayar yalnız test ekranında olduğu için ilk adımın cümlesi değiştiremeden okunuyor. | "Kapalı"da yalnız bip ve titreşim olsun. Ses kipi profilde, "gözlem yöntemi"nin yanında da seçilebilsin. | Evet (H3 `speech.json`) |
| 8 | Düşük | Ses kapalıyken alt yazı | 2. adımdayken alt yazı hâlâ 1. adımın cümlesi ("Oturuş, baş hastanın sağına 45°") ve yanında hoparlör simgesi var. Bu, söyleniyormuş izlenimi veriyor. | Ses kapalıyken alt yazı gizlensin ya da her adımda o adımın başlığıyla güncellensin. | Evet (H3 ekran 04) |

**Bilimsel doğruluk:** Bu sürümde yeni klinik kural görmedim. Önceki kurallar aynı ve doğru:
- Torsiyonla taraf: üst kutup etkilenen kulağa vurur (Bárány 2015).
- ≥1 dk yanıtta reçete kilidi.
- Yatay kanal taraf kuralı.

Kısa seste "hastanın sağına/soluna" söyleniyor; bu, başucunda duran klinisyen için yön karışıklığını azaltıyor.

## 4. Sevdiklerim
1. **Reçete kilidi bulguya bağlı ve elle tanıyla aşılamıyor:** Kararım kaydediliyor, hasta riskli durumda eve reçeteyle gitmiyor.
   Gerekçe de HBYS notunda.
2. **Kayıt:** Bulgu formu klinik dilde ve gözlem yöntemi hazır geliyor. HBYS notu kısa ve satır satır; tek sayfa PDF'te QR ve imza var.
3. **Zaman ve ses:** Tipik arka kanal ~6,5 dk, yatay kanal ~9 dk. Kısa seste hasta yalnız gereken komutu duyuyor.

## 5. Memnuniyet: **9/10** (1. tur 7, 2. tur 8)
2. turdaki isteklerimin hepsi karşılanmış ve iş akışı 15 dakikaya rahatça sığıyor. Puanı tam vermememin nedeni, ses düğmesinin
üst çubuğu daraltıp çevirme düğmesini taşırması.

**Bu sürümü klinikte kullanır mıyım: Evet.** Arka ve yatay kanal BPPV hastalarımda kendi telefonumla kullanırım. VNG'li hastalarda da
zamanlayıcı ve kayıt aracı olarak kullanırım.
