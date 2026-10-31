# Tur 5 · k08 · Odyolog Zeynep (36, devlet hastanesi, klinisyen modu)

## 1. Ben kimim, ne yapmaya çalıştım
Aynı odyoloğum: günde ~8 hasta görüyor, hasta başına 15 dakikam var, VNG/Frenzel kullanıyorum. 4. kullanımdaki isteklerimi kendi gözümle
kontrol ettim:
- profilde ses kipi ve ilk testte hiç söz okunmaması
- Safari'de açılan ev raporu bağlantısı için kopyalama yönergesi ve düğmesi
- ev dönemi eklenince basılı raporda reçete+QR+imza bloğunun bölünmemesi
- dönem etiketi

Aynı senaryoları iPhone 13 öykünümünde, demo sensörle ve gerçek hızda (:4182) tekrarladım. Bu kez hastanın atağını da gerçekten yaşattım:
1. H1'de verdiğim reçetenin QR bağlantısını hasta telefonunda açtım ve kurulumu yaptım.
2. "Baş dönmem başladı" dedim, 14 güvenlik sorusunu yanıtladım, "muayeneden beri hiç geçmedi" seçeneğiyle reçeteli kısa yoldan Epley yaptım.
3. Manevrada baş dönmesini işaretledim, ardından 1. saat tekrar testini yaptım (negatif).
4. Rapordaki QR bağlantısını kendi telefonuma aktardım.

## 2. Yaşadıklarım (kısa günlük)
- **Profil:** Yeni alan "Testlerde sesli yönerge: Kısa / Açık / Kapalı", altında kısa açıklamasıyla. H3 (VNG) için profilde "Kapalı"
  seçtim (+1 dokunuş, bir kez). **İlk testte de, sonrakilerde de tek söz okunmadı** (`speech.json` boş), alt yazı hiç görünmedi.
  Üst çubukta ses simgesi "×" gösteriyor.
- **Üst çubuk:** Ses simgesi ve "Ekranı çevir" 44×44 px ve tam görünüyor, başlık 2 satır. 10 test ekranında ölçtüm, hepsi aynı.
- **H1, sağ arka kanal: 6,6 dk, 42 dokunuş.** Gecikme ve süre yine işaretlerimden doğru doldu (5 s / 18 s). Kısa seste yanlış pozisyonda
  yalnız "Hastanın sağına." diyor.
- **Hastanın gerçek atağı (hasta telefonu):**
  - Reçete kartında hasta kodu, tanı, doz ve "13 Kasım 2026 tarihine kadar (dahil)" görünüyor.
  - Akış 14 güvenlik sorusu, kısa yol sorusu, kalibrasyon, Epley ve "İyiyim" sırasıyla ilerledi. 1 saat sonraki tekrar test negatif çıktı.
  - Rapor kartı "Reçete dönemi 31 Ekim – 13 Kasım: 1 atak, 1 manevra · hasta kodu 2026-104857" diyor.
- **Ev raporunu aktarma:**
  - **Safari yolu:** Bağlantıyı boş bir tarayıcıda açtım (iPhone kamerası böyle açar). Özetin altında şu yönerge çıktı: "DengeYol'u ana
    ekrandan kullanıyorsanız bağlantıyı kopyalayıp … yapıştırın; burada klinisyen modunu açarsanız hastalarınız iki yere bölünür."
    "Bağlantıyı kopyala" düğmesi panoya aynı bağlantıyı koydu. "Klinisyen modunda devam et" ikinci sırada duruyor.
  - **Uygulamaya ekleme:** Bağlantıyı "Hastanın ev raporu" alanına yapıştırdım: **3 s, 6 dokunuş.**
    - Özette manevranın adımları var. Hastanın evdeki baş dönmesi Epley 2. adımında: gecikme 7 s, süre 17 s.
    - "Kendi başına · sonrası: iyi" ve "reçeteli kısa yol (taraf testi yapılmadı)" bilgileri de var.
    - Hasta kodu ve reçeteyi veren muayene hazır seçili geldi.
  - İkinci kez açınca "zaten eklendi", bozuk bağlantıda net hata mesajı.
- **Basılı rapor (ev dönemi ekli):** 2 sayfa. 1. sayfada muayene ve ev dönemi özeti, 2. sayfada **reçete, QR ve imza tek blok, bölünmemiş**.
  Başlık: "Ev dönemi · 31.10.2026 – 31.10.2026 (rapor tarihi) · reçete geçerliliği 13.11.2026 dahil". Doğru.
- **HBYS notu:** Ev dönemi tek satır; içinde "reçete kodu 3a6193cc (bu muayenenin reçetesi)" var. Ancak satır "son atak: şu anki atak
  (sürüyor)" diye bitiyor, oysa 1. saat tekrar testi negatifti. Atak yalnız ertesi sabah testi bekleniyor diye açık.
- **H2, yatay kanal: 8,7 dk, 57 dokunuş.**
- **H3, VNG ile sensörsüz, ses kapalı: 6,4 dk, 49 dokunuş.** Reçete kilidi elle tanıyla da kapalı kaldı.
- **H4/H5:** Elle girişte ön seçim yok, çok kanallı kilit çalışıyor, torsiyonla taraf önerisi doğru.
- Konsol hatası yok.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | — | iPhone'da QR / Safari | **4. kullanımdaki isteğim: karşılandı.** Kayıtsız tarayıcıda "ana ekrandan kullanıyorsanız kopyalayıp yapıştırın; aksi halde hastalarınız iki yere bölünür" yönergesi ve "Bağlantıyı kopyala" düğmesi var; düğme aynı bağlantıyı panoya koyuyor. | — | Evet (gerçek hasta raporuyla) |
| 2 | — | Ses kipi | **4. kullanımdaki isteğim: karşılandı.** Profilde Kısa/Açık/Kapalı seçilebiliyor. "Kapalı"da ilk testte de tek söz okunmuyor, alt yazı yok. | — | Evet (`s3/speech.json` boş) |
| 3 | — | Basılı rapor, ev dönemi ekli | **4. kullanımdaki isteğim: karşılandı.** Reçete+QR+imza bloğu bölünmüyor; ev dönemi basılı raporda kısa özet olarak çıkıyor. | — | Evet (`h1b-yazdir.pdf`) |
| 4 | — | Ev dönemi başlığı | **4. kullanımdaki isteğim: karşılandı.** "31.10–31.10 (rapor tarihi) · reçete geçerliliği 13.11.2026 dahil". | — | Evet |
| 5 | Düşük | Düzeltme ipucu varken gösterge | **4. kullanımdaki isteğim: karşılanmadı.** İpucu ve sayı kartı gösterilirken 390×664 ekranda baş göstergesi ve sayaç halkası alttaki "Nistagmus BAŞLADI" alanının altına kısmen giriyor. Sentezde bu madde yok. | İpucu varken sayı kartı tek satıra insin ya da gösterge küçülsün; sayaç halkası tamamen görünsün. | Evet (`ipucu-ekran.png`) |
| 6 | Düşük | Ev dönemi satırı (HBYS ve özet), yeni | 1. saat tekrar testi negatif olduğu halde "son atak: şu anki atak (sürüyor)" yazıyor. Kontrol muayenesinde bunu "baş dönmesi sürüyor" diye okuyabilirim. | Bu durumda "atak açık: 1. saat tekrar testi negatif, sabah testi bekleniyor" yazsın; "sürüyor" yalnız belirti sürüyorsa kullanılsın. | Evet (gerçek hasta akışı) |

**Bilimsel doğruluk:** Yeni klinik kural yok. Önceki kurallar aynı ve doğru:
- Torsiyonla taraf (Bárány 2015).
- ≥1 dk yanıtta reçete kilidi.
- Yatay kanal taraf kuralı.
- Klinik Epley ve BBQ adımlarında 30 s.

Ev dönemi verisi "hasta beyanı" diye ayrılıyor. Evde manevra sırasında işaretlenen gecikme ve süre bana gerçekten yararlı.

## 4. Sevdiklerim
1. **Kapalı döngü:** Reçeteyi QR'la veriyorum. Hasta evde güvenlik sorularıyla, doz ve tarafı kilitli olarak manevrasını yapıyor. Kontrolde
   ev dönemi 3 saniyede muayeneme ve HBYS notuma giriyor. Hiçbir veri bir sunucuya gitmiyor.
2. **Güvenlik:** Bulguya bağlı reçete kilidi, uyarılar ve "olası/tipik" ayrımı. Elle tanı benim kararım olarak kaydediliyor ama riskli
   hastaya ev reçetesi çıkmıyor.
3. **Hasta başı ergonomi:** Profilden ses kipi, kısa yön ipuçları, düzgün üst çubuk. Tipik arka kanal ~6,5 dk, yatay kanal ~9 dk.

## 5. Memnuniyet: **9/10** (7 → 8 → 9 → 9 → 9)
4. turdaki isteklerimden dördü karşılandı. Kalan iki sorun düşük önemde ve yalnız ekran ya da metin düzeyinde. 10 vermememin nedeni,
gerçek iPhone sensörüyle kalibrasyonun ve alındaki yerleşimin hâlâ öykünümde denenmiş olması.

**Bu sürümü klinikte kullanır mıyım: Evet (koşullu).** Koşulum, gerçek iPhone'da birkaç hastalık pilotla sensör kalibrasyonunun ve açı
ölçümünün doğrulanması (VNG'li sensörsüz kullanımda bu koşul yok; bugün kullanırım). Tanı ve tedavi kararı bende kalır, uygulama karar
desteği, zamanlayıcı ve kayıt aracı olur. Yakınlarıma ve meslektaşlarıma "odyolog/hekim tanısı ve QR reçetesiyle" öneririm.
