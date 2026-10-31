# Tur 4 (son) · k08 · Odyolog Zeynep (36, devlet hastanesi, klinisyen modu)

## 1. Ben kimim, ne yapmaya çalıştım
Aynı odyoloğum: günde ~8 hasta görüyor, hasta başına 15 dakikam var, VNG/Frenzel kullanıyorum. 3. kullanımdaki isteklerimi kendi gözümle
kontrol ettim:
- 390 px'te üst çubuk
- "kapalı" seste tam sessizlik ve alt yazının gizlenmesi

Yeni özelliği, hastanın ev raporunu QR/bağlantıyla muayeneye eklemeyi de denedim. Aynı senaryoları iPhone 13 öykünümünde, demo sensörle ve
gerçek hızda (sunucu :4181) tekrarladım:
- H1: sağ arka kanal + reçete, ardından hastanın ev dönemi raporu
- H2: yatay kanal
- H3: VNG ile sensörsüz, ses kapalı
- H4: çok kanallı, elle giriş
- H5: iki taraflı Dix-Hallpike

## 2. Yaşadıklarım (kısa günlük)
- **Üst çubuk (390 px, 7 test ekranında ölçtüm):** Ses düğmesi artık 44×44 px'lik bir simge, üstündeki rozet K / A / × diye
  durumu gösteriyor. aria-label kipi söylüyor ("Sesli yönerge: Ses: kısa…"). "Ekranı çevir" 44×44 px, x=334–378, tamamen görünüyor.
  Başlık her testte 2 satır ("Dix-Hallpike · sağ — Adım 2/3"). Yatay kaydırma yok. İstediğim gibi.
- **H1, sağ arka kanal: 6,6 dk, 42 dokunuş** (3. tur: 6,6 dk / 42). Kısa seste konuşma: "Sırtüstü, baş hastanın sağına 45° ve sarkık.",
  "Pozisyon doğru", sayım.
  - Ayrıca hastanın başını yanlış tuttum (düz, sarkmasız). 5 s arayla yalnız **"Hastanın sağına."** dedi.
  - Ekranda "← Başı HASTANIN SAĞINA biraz daha çevirin" ve açı sayıları göründü. Kısa, yerinde.
- **Ev dönemi raporu (H1'in devamı):** Hastanın telefonunda reçeteli bir atak oluşturdum (Epley, tekrar test negatif). Raporun sonundaki
  "Hekime QR kodla gösterin" kartından bağlantıyı aldım. Kendi telefonumda ana ekrandaki "Hastanın ev raporu" alanına yapıştırdım:
  **4 s, 6 dokunuş.**
  - Özet okunur. Reçete kodunu tanıyıp "bu hastaya 31 Ekim muayenesinde verdiğiniz reçete" yazıyor. Hasta kodu (2026-104857) zaten
    seçili geldi, muayene de seçili geldi.
  - "Hasta beyanıdır; klinik bulgu yerine geçmez" notu var.
  - Ekledikten sonra HBYS notuna tek satır geldi: "Ev dönemi (…QR ile aktarıldı): … 1 atak · 1 manevra · son tekrar test … baş dönmesi
    gelmedi · son atak: düzeldi".
  - Aynı bağlantıyı ikinci kez açınca "zaten eklendi" diyor, bozuk bağlantıyı reddediyor.
  - Bağlantıyı boş bir tarayıcıda açınca özet okunuyor ve "klinisyen modunu açın" öneriliyor. Hiçbir veri bir yere gitmiyor.
- **H2, yatay kanal: 8,7 dk, 57 dokunuş.** BBQ'da "A" (açık) seçince uzun cümleler geldi. Değişiklik yok, iyi.
- **H3, VNG ile sensörsüz, ses kapalı: 50 dokunuş.** Betiğimdeki bir bekleme hatası ~90 s ekledi; bunu çıkarınca ~5,8 dk.
  - "×" seçtikten sonra üç testin hiçbirinde tek kelime söylenmedi, "Başlıyoruz" da yok. Alt yazı hiç görünmedi.
  - Ama ilk testte kipi değiştirebilmem için önce runner'ın açılması gerekiyor. Bu yüzden "Başlıyoruz. Oturuş, baş hastanın sağına 45°."
    bir kez okundu. Ses kipi profilde seçilemiyor.
- **H4/H5:** Elle giriş, çok kanallı kilit ve torsiyonla taraf önerisi aynı ve doğru. Konsol hatası yok.
- **Rapor:** HBYS notları 923–1195 karakter. PDF'ler tek sayfa. Yalnız ev dönemi eklenince basılı rapor 2 sayfaya çıkıyor ve reçete,
  QR ve imza 2. sayfada kalıyor.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | — | Test ekranı üst çubuğu | **3. kullanımdaki isteğim: karşılandı.** Ses simgesi 44 px ve K/A/× rozetli; "Ekranı çevir" 44×44 px ve tamamen görünür (sağ kenar 378/390); başlık 2 satır; yatay taşma yok. | — | Evet (7 runner ekranında ölçüm) |
| 2 | — | "Kapalı" ses | **3. kullanımdaki isteğim: kısmen.** Kapalıyken tam sessizlik var ("Başlıyoruz" dahil). Ses kipini profilde/ayarlarda seçme isteğim yapılmamış; ilk testte kipi değiştirene kadar iki cümle okunuyor. | Ses kipi klinisyen profilinde ("gözlem yöntemi"nin yanında) ya da test başlamadan önceki "Başlat" ekranında da seçilebilsin. | Evet (`speech.json`) |
| 3 | — | Kapalıyken alt yazı | **3. kullanımdaki isteğim: karşılandı.** Alt yazı gizli; eski adım cümlesi görünmüyor. | — | Evet (H3, 3 adım) |
| 4 | Düşük | Ev dönemi raporu + iPhone | Hasta QR'ı iPhone kamerasıyla okutulunca bağlantı Safari'de açılır. iOS'ta ana ekrana eklenmiş uygulamanın kayıtları Safari'den ayrıdır. Ekran "bu telefonda klinisyen modunu açın" diyor; bu yolu izlersem Safari'de ikinci, boş bir klinisyen kaydı açarım ve hastalarım iki yere bölünür. | Klinisyen kaydı bulunmayan tarayıcıda şu cümle görünsün: "DengeYol'u ana ekrandan kullanıyorsanız bağlantıyı kopyalayıp uygulamadaki 'Hastanın ev raporu' alanına yapıştırın". Bağlantıyı kopyala düğmesi de olsun. | Kısmen (ekran doğrulandı; iOS depolama ayrımı öykünümde denenemez) |
| 5 | Düşük | Basılı rapor, ev dönemi ekliyken | Rapor 2 sayfaya çıkıyor; reçete, QR ve imza 2. sayfada yalnız kalıyor. | Ev dönemi bölümü basılı raporda kısa özet olsun (tek satır başlık ve atak sayısı) ya da reçete+imza bloğu sayfa sonunda bölünmesin (`break-inside: avoid`). | Evet (`h1b-yazdir.pdf`) |
| 6 | Düşük | Ev dönemi başlığı | "Ev dönemi · 31.10.2026 – 13.11.2026" yazıyor ama rapor 31.10'da oluşturulmuş. Bitiş tarihi reçete geçerliliği, ev dönemi değil. | Başlıkta "Reçete dönemi (… dahil) · rapor tarihi 31.10.2026" yazsın ya da dönem bitişi rapor tarihi olsun. | Evet |
| 7 | Düşük | Sensörlü modda düzeltme ipucu | İpucu ve sayı kartı gösterilirken 390×664 ekranda baş göstergesi ve sayaç halkası alttaki "Nistagmus BAŞLADI" alanının altına kısmen giriyor. | İpucu varken sayı kartı daralsın ya da gösterge ipucunun yanına alınsın. | Evet (`ipucu-ekran.png`, demo panel kapalı) |

**Bilimsel doğruluk:** Bu turda yeni klinik kural yok. Önceki kurallar aynı ve doğru: torsiyonla taraf belirleme (Bárány 2015), ≥1 dk yanıtta
reçete kilidi, yatay kanal taraf kuralı, klinisyen modunda BBQ ve Epley için 30 s. Ev dönemi raporu "hasta beyanı" diye işaretleniyor;
klinik bulgu gibi sunulmuyor, bu doğru.

## 4. Sevdiklerim
1. **Güvenlik:** Reçete kilidi bulguya bağlı ve elle tanıyla aşılamıyor. Uyarılar ve "olası/tipik" ayrımı yerinde.
2. **Kayıt:** Bulgu formu klinik dilde, yöntem hazır geliyor. HBYS notu kısa, satır satır. Ev dönemi tek satırla ve reçete koduyla
   eşleşerek nota giriyor. Kontrol muayenesinde "evde ne oldu" sorusunun cevabı 4 saniyede elimde, üstelik ağsız.
3. **Hasta başı:** Kısa ses ("Hastanın sağına."), düzgün üst çubuk, ekranı çevirme. Tipik arka kanal ~6,5 dk, yatay kanal ~9 dk.

## 5. Memnuniyet: **9/10** (7 → 8 → 9 → 9)
Bütün kritik ve yüksek önemli isteklerim karşılandı. Kalan sorunlar düşük önemli: iPhone'da QR'ın Safari'de açılması, ev dönemi
eklenince 2 sayfa, ses kipinin profilde olmaması. Bunlar 10'u engelliyor.

**Bu sürümü klinikte kullanır mıyım: Evet (koşullu).** Koşulum, uygulamanın gerçek iPhone'da sensör kalibrasyonu ve bir haftalık pilotla
doğrulanması. Tanı ve tedavi kararı bende kalır, uygulama karar desteği ve kayıt aracı olur. Yakınlarıma ve meslektaşlarıma da
"odyolog/hekim tanısı ve reçetesiyle" öneririm.
