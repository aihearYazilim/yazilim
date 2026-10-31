# Tur 4 (son) · k09 · KBB uzmanı (Doç. Dr. Serkan, 52, nörootoloji polikliniği)

## 1. Ben kimim, ne yapmaya çalıştım
Aynı KBB uzmanıyım; bu son değerlendirme (sunucu `localhost:4181`). Üç turdur istediğim kapalı döngüyü iki ayrı telefonla
(iki ayrı tarayıcı bağlamı, Pixel 7 öykünümü) baştan sona yaşadım:
1. Klinisyen telefonunda muayene (Frenzel, elle bulgu), tanı ve QR reçete.
2. Hasta telefonunda reçeteyi içe aktarma ve atak (gerçek hız, timeScale 1).
3. 1. saat tekrar testi (zaman kaydırarak), hasta raporu ve rapor QR'ı.
4. Klinisyen telefonunda rapor bağlantısını açma, muayeneye "ev dönemi" olarak ekleme ve HBYS notu.

Ayrıca bozuk ve yanlış türde bağlantıları, yanlış hasta seçimini, aynı raporun iki kez eklenmesini ve reçete dönemi raporunu
(kurgulanmış iki ataklı veriyle) denedim.

## 2. Yaşadıklarım (kısa günlük)
- **Reçete:** Önceki turdaki gibi sorunsuz. "Geçerlilik: 14 gün, 13.11.2026 dahil … Reçete kodu: 443c91d0".
- **Atak:** "Farklı mı?" sorusunun sesli biçimi artık şöyle: "…hekiminizin daha önce kristal oynaması dediği, **yatarken ya da
  kalkarken başlayan ve saniyeler süren** baş dönmesinden farklı mı?" Ölçüt geri gelmiş. Epley gerçek hızda sorunsuz geçti.
  Erken tekrar testi "Baş dönmesi gelmedi → yarın sabah bir kez daha" diyor.
- **Hasta raporu ve QR:** Raporun başında "Hekiminize QR kodla gösterin" kartı var: "Reçete dönemi 31 Ekim – 13 Kasım: 1 atak,
  1 manevra · hasta kodu NO-2611", "Kodu büyüt" ve "Hekim bağlantısını kopyala" düğmeleri. Bağlantı 391 karakter; QR ekranda net.
  Öykünümde kamera olmadığı için QR'ı okutmadım; bağlantıyı kopyalayıp klinisyen telefonunda açtım.
- **Klinisyen içe aktarma:** "Ev dönemi · 31.10.2026 – 13.11.2026" başlıklı ekran açıldı. Şunları gösteriyor:
  - Rapordaki hasta kodu ve reçete kodu, yanında "bu hastaya 31 Ekim 12:21 muayenesinde verdiğiniz reçete" eşleşmesi.
  - Tek satır sonuç: "1 atak · 1 manevra (1 tamamlandı) · son tekrar test erken (1. saat), sağ: baş dönmesi gelmedi".
  - Atak satırında "reçeteli kısa yol (taraf testi yapılmadı)".
  - Adım tablosu ve altında "hastanın kendi telefonundaki kayıttır (hasta beyanı); klinik muayene bulgusu yerine geçmez" notu.
    Medikolegal açıdan tam istediğim ifade.
- **Hasta ve muayene seçimi:** "NO-2611 — rapordaki kodla aynı" kendiliğinden seçili geliyor; muayene listesinde "bu reçeteyi veren
  muayene" işaretli. NO-2612'yi seçince kırmızı "Rapordaki hasta kodu (NO-2611) seçtiğiniz hastanın kodundan (NO-2612) farklı"
  uyarısı ve reçete kodu uyuşmazlık notu çıkıyor; doğru hastaya dönünce ikisi de kayboluyor.
- **Ekleme sonrası:** "Ev dönemi olarak ekle" → muayenenin rapor sekmesinde ev dönemi kartı ve "Ev dönemi raporunu kaldır"
  düğmesi var. HBYS notuna tek satır giriyor: "Ev dönemi (hastanın DengeYol raporu, QR ile aktarıldı): 31.10.2026 – 13.11.2026 ·
  reçete kodu 443c91d0 (bu muayenenin reçetesi) · 1 atak · 1 manevra … · son atak: şu anki atak (sürüyor)."
- **Ret denemeleri:** Hepsi doğru sonuç verdi.
  - Aynı bağlantıyı yeniden açınca "Bu rapor zaten eklendi".
  - Reçete bağlantısını rapor yoluna koyunca "Bu bir ev reçetesi bağlantısı, hasta raporu değil".
  - Sağlaması bozuk bağlantıda "bozulmuş ya da eksik"; yarıya kesik bağlantıda "okunamadı".
  - Yapıştırma alanına reçete bağlantısı ya da serbest metin girince "Bu bir hasta raporu bağlantısına benzemiyor".
  - Hasta telefonunda rapor bağlantısı açılınca "Bu sayfa hekiminiz içindir".
- **Reçete dönemi raporu (kurgulanmış veri):** Reçetenin süresi dolduktan sonra ana ekranda şu kart çıkıyor: "Reçete dönemi: 2 atak ·
  2 manevra (+1 yarım) · son sabah testi negatif · 1 atak hekime ya da acile yönlendirildi" ve "Dönem raporunu hekime gönder".
  Dönem raporu iki atağı da tek metinde, başta tek satır sonuçla veriyor. (#4 ve #5'e bakın.)

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | — | 3. kullanımdaki isteğim Y2 / #11 (raporun ağsız QR ya da bağlantıyla klinisyene aktarımı, muayeneye "ev dönemi") | **Karşılandı.** QR ve bağlantı var. Kod otomatik eşleşiyor, yanlış hastada kod uyuşmazlığı uyarısı çıkıyor, reçete kodu eşleşmesi gösteriliyor. Mükerrer ekleme engelli; reçete, bozuk ve kesik bağlantı ayrı ayrı açıklamalarla reddediliyor. HBYS'ye tek satır giriyor; kayıt "hasta beyanı" olarak etiketli. | — | Evet (iki cihazla uçtan uca; QR kamerayla değil, bağlantıyla) |
| 2 | — | 3. kullanımdaki isteğim Y1 (reçete dönemi raporu + tek satır sonuç) | **Karşılandı.** Kart dönemdeki bütün atakları açıyor ve başta tek satır sonuç var. Ufak düzeltmeler #4 ve #5'te. | — | Evet (kurgulanmış veri) |
| 3 | — | 3. kullanımdaki isteğim Y3 ("farklı mı?" sesli ölçüt) | **Karşılandı.** "Yatarken ya da kalkarken başlayan ve saniyeler süren" ifadesi seste var. | — | Evet (konuşma kaydı) |
| 4 | Orta | Klinisyendeki ev dönemi adım tablosu (sunulan derleme `index-BLYbGM8f.js`, 12:01) | Adım başlıklarında taraf yerine şablon belirteçleri çıkıyor: "Oturuş, baş {Aya} 45°", "Sırtüstü, baş {Hya} 45°", "{H} yan, burun yere". Hem içe aktarma ekranında hem muayene raporunda görüldü. Manevra satırında "Epley sağ" yazdığı için taraf bilgisi kaybolmuyor, ama tıbbi kayıtta kabul edilemez bir görünüm. Kaynakta sonradan bir düzeltme commit'i var (`4c9f392`, 12:26, `reportShare.ts:142` `stepTitle`), ancak sunulan derleme ondan önce yapılmış, bu yüzden düzeltmeyi gözümle göremedim. | Yeniden derleyip yayınlayın. Eski sürümle üretilmiş bağlantılar da çözülürken başlığı taraftan yeniden üretsin (çözücü zaten protokol ve tarafı biliyor). | Evet (hata). Düzeltme doğrulanamadı |
| 5 | Düşük | Dönem sonuç satırı: `reportText.ts:521-538` | Satır "son sabah testi negatif"i, sonraki atağın hekime yönlendirilmesinden önce yazıyor. Kartta önce "negatif" okunuyor, oysa dönemin son durumu yönlendirme. Hekim hızlı okurken yanlış izlenim edinebilir. | Önce son atağın sonucu ("son atak 25.10: hekime yönlendirildi — baş dönmesi >1 dk"), sonra test özeti. | Evet (kurgulanmış veri) |
| 6 | Düşük | Dönem raporu sayfası: `History.tsx:119-131` | Dönem raporunda yalnız metin paylaşımı var, QR kartı yok. QR yalnız tek atak raporunda; o QR dönemi kapsıyor ama hasta bunu bilmez. "Dönem raporunu hekime gönder"den gelen hasta muayenede gösterecek QR'ı arar. | Dönem raporuna da aynı `ReportQr` kartı. | Evet (kod + ekran) |
| 7 | Düşük | Yapıştırma alanı: `ReportImport.tsx:44-52` | Reçete bağlantısı yapıştırılınca genel "hasta raporuna benzemiyor" mesajı çıkıyor. Doğrudan açılınca ise daha açıklayıcı "Bu bir ev reçetesi bağlantısı" mesajı geliyor. | Yapıştırmada da reçete bağlantısını tanıyıp aynı mesajı verin. | Evet |

**Bilimsel kontrol:** Bu turda klinik içerik değişmedi; 14 soruluk tablo, doz ve geçerlilik kuralları 3. turda doğruladığım gibi.
Ev dönemi kaydının "hasta beyanı; klinik muayene bulgusu yerine geçmez" diye etiketlenmesi doğru bir epistemik ayrım. Belirtiye
dayalı evde değerlendirme nistagmus gözlemi değildir. Erken tekrar testinin "1. saat" olarak yazılması da protokolle uyumlu.
Yeni bir bilimsel hata görmedim.

## 4. Sevdiklerim
1. Kapalı döngü artık gerçekten kapalı. Reçete kodu klinisyen telefonundan hastaya, oradan rapora ve tekrar klinisyen kaydına ve
   HBYS'ye taşınıyor; yanlış hasta ve yanlış bağlantı açık uyarıyla yakalanıyor. Ağ olmadan, sunucu olmadan.
2. Hekim ekranındaki tek satır sonuç, kısa yol bilgisi ve "hasta beyanı" etiketi. Kontrol muayenesinde 10 saniyede karar
   verebiliyorum.
3. Dört tur boyunca güvenlik kapılarının hiç gevşememesi: kupulolitiazis/çok kanallı kilidi, 14 kırmızı bayrak, 2 dk durdurma,
   yönlendirme kilidi, "… dahil" geçerlilik.

## 5. Memnuniyet
**9/10 (7 → 8 → 9 → 9).** Bu turdaki asıl isteğim olan rapor aktarımı eksiksiz ve özenli. Puanı 10'dan alıkoyan, sunulan
derlemedeki "{Aya}" belirteçleri. Bu düzeltilmiş görünüyor ama yayında değil. Kalan engeller yine yazılımın dışında.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Koşullu.**
Koşullar:
- **(a) Hasta seçimi:** Yalnız kendi muayene ettiğim, tek taraflı arka kanal kanalolitiazisi Dix-Hallpike ile doğrulanmış,
  kontrendikasyonu olmayan hastalar; QR muayenede elden verilir.
- **(b) Pilot:** Etik kurul onaylı pilot çalışma içinde. Yazılı aydınlatılmış onam olur; reçete bitiminde ev dönemi QR'ı kontrol
  muayenesinde okutulur; yönlendirme oranı ve 1. hafta iyileşme ölçülür.
- **(c) Doğruluk:** Pilottan önce gerçek telefonlarda açı doğruluğu ölçülmüş (Faz A) olmalı.
- **(d) Derleme:** #4 düzeltilmiş derleme yayında olmalı.

Reçetesiz genel kullanım ve yakınlarıma klinik dışı öneri için bu koşullar sağlanana kadar hayır.
