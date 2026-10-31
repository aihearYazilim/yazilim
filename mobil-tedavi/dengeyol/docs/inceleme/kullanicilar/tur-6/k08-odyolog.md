# Tur 6 · k08 · Odyolog Zeynep (36, devlet hastanesi, klinisyen modu)

## 1. Ben kimim, ne yapmaya çalıştım
Aynı odyoloğum: günde ~8 hasta görüyor, hasta başına 15 dakikam var, VNG/Frenzel kullanıyorum. 5. kullanımdaki iki isteğimi kendi gözümle
kontrol ettim:
- ev dönemi satırında açık atak için "atak açık: 1. saat tekrar testi negatif, sabah testi bekleniyor"
- düzeltme ipucu varken 390×664'te baş göstergesi ve sayacın işaret alanının üstünde kalması

Aynı senaryoları iPhone 13 öykünümünde, demo sensörle ve gerçek hızda (:4183) tekrarladım:
- H1: sağ arka kanal + reçete; hasta telefonunda gerçek atak (QR reçete, 14 güvenlik sorusu, reçeteli kısa yol, Epley, 1. saat testi) ve
  ev raporunun aktarılması
- H2: yatay kanal
- H3: VNG ile sensörsüz, profilde ses kapalı
- H4: çok kanallı, elle giriş
- H5: iki taraflı Dix-Hallpike

## 2. Yaşadıklarım (kısa günlük)
- **Düzeltme ipucu ekranı (sensörlü, baş düz ve sarkmasız tutuldu):** Kısa seste yalnız "Hastanın sağına." deniyor. Ekranda ipucu ve sayı
  kartı tek satıra inmiş.
  - **Baş göstergesi ve sayaç halkası artık tamamen görünür:** gösterge alt kenarı y=503, işaret alanı y=590'dan başlıyor (ekran 664).
  - Altında baş sarkıklığı çubuğu da görünüyor.
- **H1, sağ arka kanal: 6,5 dk, 42 dokunuş.** Gecikme ve süre doğru doldu (5 s / 18 s). Reçete QR'ı tek dokunuş.
- **Hastanın gerçek atağı ve ev raporu:**
  - Hasta tarafı sorunsuz: 14 soru, "muayeneden beri hiç geçmedi", Epley (2. adımda baş dönmesi gecikme 11 s, süre 17 s), "İyiyim",
    1. saat tekrar testi negatif.
  - Bağlantıyı Safari'de açınca kopyalama yönergesi ve düğmesi çıktı, düğme aynı bağlantıyı panoya koydu.
  - Uygulamaya yapıştırınca **4 s, 6 dokunuşta** eklendi.
  - Özetin ilk satırı: **"Son atak (31.10) — atak açık: 1. saat tekrar testi negatif, sabah testi bekleniyor"**. HBYS satırı da aynı
    sözle başlıyor. "Sürüyor" yazmıyor. Tam istediğim gibi.
  - Başlık "Reçete 31.10 (geçerlilik 13.11 dahil) · atak 31.10 · rapor 31.10".
  - İkinci ekleme "zaten eklendi" diyor, bozuk bağlantı reddediliyor.
- **H2, yatay kanal: 8,7 dk, 57 dokunuş.** Üst çubuk düzgün: 44 px simgeler, başlık 2 satır.
- **H3, VNG ile sensörsüz, ses kapalı: 6,4 dk, 49 dokunuş.**
  - Profilde "Kapalı" seçili olduğu için hiçbir testte tek söz okunmadı, alt yazı yok.
  - ≥1 dk yanıtta elle "kanalolitiazis" tanısına rağmen reçete kilitli kaldı.
- **H4/H5:** Elle girişte ön seçim yok. Çok kanallı kilit ve torsiyonla taraf önerisi doğru.
- Konsol hatası yok. HBYS notları 923–1268 karakter.
- PDF'ler tek sayfa. Ev dönemi ekliyken 2 sayfa; reçete+QR+imza bölünmeden 2. sayfada.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | — | Ev dönemi satırı (içe aktarma ekranı + HBYS) | **5. kullanımdaki isteğim: karşılandı.** Açık atakta "atak açık: 1. saat tekrar testi negatif, sabah testi bekleniyor" yazıyor; satır bu sonuçla başlıyor. | — | Evet (gerçek hasta akışı) |
| 2 | — | Düzeltme ipucu varken ekran (390×664) | **5. kullanımdaki isteğim: karşılandı.** İpucu ve sayı kartı daraldı; gösterge (alt kenar y=503) ve sayaç halkası işaret alanının (üst kenar y=590) üstünde, tamamen görünür. | — | Evet (ölçüm + `ipucu-ekran.png`) |
| 3 | — | Gerçek iPhone pilotu | **5. kullanımdaki isteğim: karşılanmadı.** Yazılım dışı bir istek, öykünümde yapılamaz. Sensörlü kullanım için tek koşulum bu olarak kalıyor. | Birkaç hastalık pilot: alındaki yerleşim, kalibrasyon ve açı ölçümü gerçek cihazda doğrulansın. | Hayır (öykünüm) |
| 4 | Düşük | Ev dönemi satırı, yeni | Satır "1. saat tekrar testi negatif" diye başlıyor, birkaç kelime sonra "son tekrar test (31.10) erken (1. saat), sağ: baş dönmesi gelmedi" ile aynı bilgiyi tekrarlıyor. HBYS'de bir cümle fazla. | Baştaki sonuç cümlesi tekrar testi kapsıyorsa ikinci ifade düşsün. | Evet |
| 5 | Düşük | Basılı rapor, ev dönemi ekli | 1. sayfanın ~1/3'ü boş kalıyor ama reçete+QR+imza bloğu bütün olarak 2. sayfaya geçiyor (bölünmüyor, bu doğru). | Manevra tablosundaki açı sütunları ev dönemi varken daraltılarak ya da QR küçültülerek tek sayfaya sığdırma denensin. Sığmıyorsa bugünkü davranış kalsın. | Evet (`h1b-yazdir.pdf`) |

**Bilimsel doğruluk:** Yeni klinik kural yok. Önceki kurallar aynı ve doğru:
- Torsiyonla taraf (Bárány 2015).
- ≥1 dk yanıtta reçete kilidi.
- Yatay kanal taraf kuralı.
- Klinik Epley ve BBQ adımlarında 30 s.

"Atak açık; sabah testi bekleniyor" ifadesi uygulamanın kapanış kuralıyla (1. saat ve ertesi sabah iki negatif test) uyumlu.

## 4. Sevdiklerim
1. **Kapalı döngü:** Muayene, QR reçete, hastanın evde güvenli manevrası, kontrol muayenesine 4 saniyede ev dönemi. Hepsi ağsız,
   hasta kodu ve reçete koduyla eşleşerek ilerliyor.
2. **Güvenlik:** Bulguya bağlı reçete kilidi; uyarılar ve "olası/tipik" ayrımı; elle tanı benim kararım olarak kaydediliyor.
3. **Hasta başı ergonomi:** Profilden ses kipi, kısa yön ipucu, görünür gösterge ve sayaç, düzgün üst çubuk. Tipik arka kanal ~6,5 dk,
   yatay kanal ~9 dk.

## 5. Memnuniyet: **9,5/10** (7 → 8 → 9 → 9 → 9 → 9,5)
Yazılımla ilgili isteklerimin hepsi karşılandı. Kalan iki madde metin ve baskı düzeyinde. Tam puanı gerçek cihaz pilotundan sonra veririm.

**Bu sürümü klinikte kullanır mıyım: Evet (koşullu).**
- VNG/Frenzel ile sensörsüz kullanımda koşulsuz evet: zamanlayıcı, bulgu formu, tanı desteği, QR reçete ve HBYS notu için bugün kullanırım.
- Telefonu alna koyduğum sensörlü kullanımda koşulum, birkaç hastalık pilotla gerçek iPhone'da kalibrasyonun ve açı ölçümünün
  doğrulanması.
- Tanı ve tedavi kararı bende kalır.
- Meslektaşlarıma ve yakınlarıma "odyolog/hekim tanısı ve QR reçetesiyle" öneririm.
