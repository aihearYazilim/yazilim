# Tur 5 · k09 · KBB uzmanı (Doç. Dr. Serkan, 52, nörootoloji polikliniği)

## 1. Ben kimim, ne yapmaya çalıştım
Aynı KBB uzmanıyım. Bu tur sunucu `localhost:4182` (derleme `index-C7Ruw0lc.js`). Önce 4. raporumdaki dört isteğin
karşılanıp karşılanmadığını kontrol ettim. Sonra iki ayrı telefonla (Pixel 7 öykünümü) kapalı döngüyü yeniden yaşadım:
1. Klinisyen telefonunda muayene, tanı ve QR reçete.
2. Hasta telefonunda reçeteyi içe aktarma ve gerçek hızda (timeScale 1) atak.
3. 1. saat tekrar testi, ardından rapor QR'ı.
4. Klinisyen telefonunda içe aktarma ve muayeneye "ev dönemi" olarak ekleme; HBYS notu.

Ayrıca şunları denedim: 4. turdaki eski derlemeyle üretilmiş bir rapor bağlantısı, yanlış hasta seçimi, bozuk ve yanlış türde
bağlantılar, yapıştırma alanı, iki ataklı (biri hekime yönlendirilmiş) kurgulanmış bir reçete dönemi.

## 2. Yaşadıklarım (kısa günlük)
- **Reçete ve atak:** Değişmemiş ve sorunsuz. "Farklı mı?" sorusu seste ölçütüyle okunuyor: "…yatarken ya da kalkarken başlayan ve
  saniyeler süren baş dönmesinden farklı mı?". Epley ve erken tekrar testi tamamlandı. Bitiş metnine "Uyku pozisyonu kısıtlaması ya
  da boyunluk gerekmez" cümlesi eklenmiş. Bu, AAO-HNSF 2017'nin işlem sonrası postür kısıtlaması önermeme tavsiyesiyle uyumlu.
- **Rapor QR'ı → klinisyen:** Başlık artık "Ev dönemi · 31.10.2026 – 31.10.2026 (rapor tarihi) · reçete geçerliliği 13.11.2026
  dahil". Adım başlıkları tarafıyla yazılıyor: "Oturuş, baş sağa 45°", "Sırtüstü, baş sola 45°", "Sol yan, burun yere". Hiçbir
  yerde "{Aya}" kalmamış.
- **Eski bağlantı:** 4. turda eski derlemeyle (index-BLYbGM8f) üretilmiş rapor bağlantısını yeni sürümde açtım. Başlıklar onda da
  doğru ("sağa", "sola", "Sol yan"), çünkü çözümleme açılırken yapılıyor.
- **Dönem raporu (kurgu: 1. atak düzeldi, 2. atak sol tarafta >1 dk baş dönmesiyle yönlendirildi):**
  - Ana ekran kartı artık "Reçete dönemi: son atak (25 Ekim): hekime yönlendirildi · 2 atak · …" diye başlıyor.
  - Dönem raporunun ikinci satırı "Son atak (25 Ekim): hekime yönlendirildi — baş dönmesi bir dakikadan uzun sürdü…". Sayfada
    "Hekiminize QR kodla gösterin" kartı var.
  - Bu QR'ı klinisyen telefonunda açtım. İki atak, adım başlıkları tarafıyla geldi; ikinci atakta "Sol yan" yerine doğru biçimde
    "Sağ yan, burun yere" yazıyor (sol Epley'nin 4. adımı).
- **Klinisyen tarafının sonuç satırı:** Satır "2 atak · 3 manevra · 1 atakta hekime/acile yönlendirildi · son tekrar test (18.10)
  sabah … gelmedi" diyor. Son atağın sonucu hasta tarafındaki gibi en başta değil (#5).
- **Yapıştırma alanı:** Reçete bağlantısı girince "Bu bir ev reçetesi bağlantısı, hasta raporu değil. Hastanın raporu, uygulamadaki
  rapor ekranının sonundaki 'Hekime QR kodla gösterin' kartındadır." Açık ve yol gösterici. Serbest metinde "hasta raporu
  bağlantısına benzemiyor".
- **Ret ve güvenlik denemeleri:** 4. turdaki gibi sorunsuz.
  - Yanlış hasta (NO-2612) seçilince kırmızı kod uyuşmazlığı uyarısı ve reçete kodu notu çıkıyor.
  - Aynı rapor ikinci kez eklenemiyor ("zaten eklendi").
  - Reçete, bozuk ve kesik bağlantılar ayrı mesajlarla reddediliyor.
  - Hasta telefonunda rapor bağlantısı açılınca "bu sayfa hekiminiz içindir" diyor.
  - HBYS notuna tek satır ev dönemi giriyor ve geçerlilik tarihini de içeriyor.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | — | 4. kullanımdaki isteğim #4 (ev dönemi adım başlıklarında taraf) | **Karşılandı.** Yeni bağlantıda, eski sürümle üretilmiş bağlantıda ve sol taraflı manevrada başlıklar doğru. | — | Evet |
| 2 | — | 4. kullanımdaki isteğim #5 (dönem sonuç satırında önce son atak) | **Kısmen.** Hasta tarafında (ana ekran kartı ve dönem raporu) karşılandı. Klinisyenin içe aktarma ekranındaki satır ve HBYS satırı ise son atağın sonucuyla başlamıyor (#5). | — | Evet |
| 3 | — | 4. kullanımdaki isteğim #6 (dönem raporunda QR kartı) | **Karşılandı.** Sayfada QR kartı var; okutulan QR iki atağı da klinisyene aktarıyor. | — | Evet |
| 4 | — | 4. kullanımdaki isteğim #7 (yapıştırmada reçete bağlantısı mesajı) | **Karşılandı.** Açık mesaj veriyor ve raporun nerede olduğunu söylüyor. | — | Evet |
| 5 | Düşük | Klinisyendeki ev dönemi sonuç satırı ve HBYS satırı (`HomeReportView`, ev dönemi özeti) | Kurgu dönemde son atak yönlendirmeyle bitmişti. Klinisyen satırı "… 1 atakta hekime/acile yönlendirildi · son tekrar test (18.10) … gelmedi" diye bitiyor; "gelmedi" son okunan bilgi. Hekim için asıl karar bilgisi son atağın sonucu. | Hasta tarafındaki gibi "Son atak (25.10): hekime yönlendirildi — baş dönmesi >1 dk" önde olsun; aynısı HBYS satırına. | Evet (kurgulanmış veri) |
| 6 | Düşük | Dönem tarih aralığı | Aynı dönem üç yerde üç farklı aralıkla gösteriliyor: QR kartı ve klinisyen ekranı "17–26 Ekim" (atakların aralığı), hasta dönem raporu "16 Ekim – 29 Ekim ve sonrası, 31 Ekim'e kadar" (reçete dönemi + rapor tarihi). Hepsi "Reçete dönemi" ya da "Ev dönemi" etiketli; hekim hangisi olduğunu anlamak için düşünmek zorunda kalıyor. | Tek biçim: "Reçete 16.10 (geçerlilik 29.10 dahil) · ataklar 17.10–25.10 · rapor 31.10". | Evet |

**Bilimsel kontrol:**
- Bu turda klinik kural değişmedi.
- Yeni bitiş cümlesi ("uyku pozisyonu kısıtlaması ya da boyunluk gerekmez") doğru: AAO-HNSF 2017 (Bhattacharyya ve ark.,
  Otolaryngol Head Neck Surg 2017;156(3S):S1–S47) işlem sonrası postür kısıtlaması önermemeyi tavsiye eder.
- Ev dönemi kaydının "hasta beyanı; klinik muayene bulgusu yerine geçmez" etiketi korunmuş.
- Erken tekrar testi "1. saat" diye yazılıyor ve sabah testiyle ayrılıyor.
- Yeni bir bilimsel hata görmedim.

## 4. Sevdiklerim
1. Kapalı döngü uçtan uca ve ağsız çalışıyor: reçete kodu reçeteden hasta raporuna, oradan klinisyen kaydına ve HBYS'ye geçiyor;
   yanlış hasta ve yanlış bağlantı açıkça yakalanıyor. Eski sürümle üretilmiş bağlantılar da doğru okunuyor; geriye uyumluluk düşünülmüş.
2. Dönem raporu: tek ekranda bütün ataklar, en başta son atağın sonucu ve aynı sayfada QR.
3. Beş tur boyunca güvenlik çizgileri hiç gevşemedi; her turda klinik metin kılavuzlara biraz daha yaklaştı.

## 5. Memnuniyet
**9/10 (7 → 8 → 9 → 9 → 9).** Yazılım tarafında karar vermemi engelleyen bir sorun kalmadı; kalanlar düşük önemde metin tutarlılığı.
10 vermeyişimin nedeni yazılımın dışında: uygulama gerçek telefonlarda ve gerçek hastalarda henüz denenmedi.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Koşullu.**
Koşullar:
- **(a) Hasta seçimi:** Yalnız kendi muayene ettiğim, tek taraflı arka kanal kanalolitiazisi Dix-Hallpike ile doğrulanmış,
  kontrendikasyonu olmayan hastalar; QR muayenede elden verilir.
- **(b) Pilot:** Etik kurul onaylı pilot çalışma içinde. Yazılı aydınlatılmış onam olur; reçete bitiminde ev dönemi QR'ı kontrol
  muayenesinde okutulur; yönlendirme oranı ve 1. hafta iyileşme ölçülür.
- **(c) Doğruluk:** Pilottan önce gerçek Android ve iPhone'larda açı, ses ve titreşim doğrulanmış (Faz A) olmalı.

Bu koşullar sağlanınca polikliniğimde kullanırım. Reçetesiz genel kullanım ve klinik dışı öneri için o zamana kadar hayır.
