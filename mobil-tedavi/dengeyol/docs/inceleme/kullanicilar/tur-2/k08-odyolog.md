# Tur 2 · k08 · Odyolog Zeynep (36, devlet hastanesi, klinisyen modu)

## 1. Ben kimim, ne yapmaya çalıştım
Aynı odyoloğum: günde ~8 hasta görüyor, hasta başına 15 dakikam var, VNG/Frenzel kullanıyorum. 1. turdaki 12 isteğimin karşılanıp
karşılanmadığını kendi gözümle kontrol ettim. Aynı 4 senaryoyu iPhone 13 öykünümünde, demo sanal sensörle ve gerçek hızda yeniden
yaptım: H1 sağ arka kanal, H2 yatay kanal geotropik, H3 VNG ile sensörsüz ≥1 dk yanıt, H4 çok kanallı (elle giriş) ve geri tuşu.
Bir de H5'i ekledim: iki taraflı pozitif Dix-Hallpike, tarafı torsiyon yönüyle belirleme.

## 2. Yaşadıklarım (kısa günlük)
- **H1, sağ arka kanal: 6,6 dk, 43 dokunuş** (1. tur: 6,5 dk, 39). Fark, yeni isteğe bağlı alanlardan geliyor: torsiyon, gözlem yöntemi
  ve "oturunca ters nistagmus" (+4 dokunuş). Gecikme 4 s ve süre 18 s yine doğru doldu.
  - Torsiyon alanı yalnız torsiyonel tip seçilince açılıyor.
  - İkinci testte gözlem yöntemi "Frenzel" hazır geldi; muayene içinde hatırlanıyor.
  - Hasta kodu artık başlığın altında tam yazıyor: **2026-104857**.
  - Reçete ekranı geçerliliği söylüyor ("14 gün, 14.11.2026'ya kadar"), reçete kodunu gösteriyor ve QR'ı görünür alana kaydırıyor.
- **H2, yatay kanal geotropik: 8,7 dk, 57 dokunuş** (1. tur: 10,4 dk). BBQ adımları artık 30 s, toplam **4 dk 21 s** (önce 6 dk 6 s).
  Kalan sürede tekrar supine roll da 15 dakikaya sığıyor.
- **H3, VNG ile sensörsüz: 6,4 dk, 50 dokunuş.**
  - Ekranda "Zamanlayıcıyla yap" ve "Telefon alna konmaz; zamanlayıcı olarak kullanılır" yazıyor. Doğru olan bu.
  - Formda "Yorulmadı" ve serbest not ("VNG kaydı: yorulmayan, 75 s; santral bulgu yok") yazdım. Öneri artık torsiyon ve yorulmayı
    da gerekçe olarak sayıyor.
  - Kilidi yine aşmayı denedim: "Tanıyı elle gir"de hiçbir şey önceden seçili gelmiyor. "Kanalolitiazis" seçince form içinde hemen
    kırmızı uyarı çıktı: "bulguyla çelişiyor; tanıyı kaydedebilirsiniz, ev reçetesi kilitli kalır".
  - Kaydettim, Reçete sekmesi **kilitli kaldı**. Kararım bana ait ama hastayı riske atamıyorum. Tam istediğim buydu.
  - HBYS notunda şunlar var:
    - "Tanı: Sağ arka kanal BPPV — kanalolitiazis (elle)"
    - "Karar desteği önerisi: … kupulolitiazis (olası). Klinisyen tanıyı elle girdi."
    - Kilit gerekçesi.
- **H4/H5, elle giriş ve hatalar:**
  - "Elle gir" açılınca hiçbir şey seçili değil ve Kaydet kapalı.
  - Çok kanallı uyarısı ve reçete kilidi yerinde.
  - Kalibrasyon ekranında geri tuşu artık muayenede bırakıyor.
  - H5'te iki Dix-Hallpike de pozitif ve torsiyon ikisinde de sağ kulağa: öneri "Sağ arka kanal BPPV (iki taraflı yanıt; taraf torsiyona
    göre), olası" oldu. Ek uyarı da veriyor: "manevradan sonra iki tarafı yeniden test edin". Doğru ve temkinli.
- **Ses:** Klinisyen modunda telefon yine benim cümlelerimi hastanın alnından okuyor ("…Nistagmusu gözleyin; başlangıç ve bitişi
  işaretleyin", "Süre doldu; belirti sürüyor"). Bu değişmemiş.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | — | Reçete kilidi (`core/diagnosis.ts` `rxFindingLock`) | **1. kullanımdaki isteğim: karşılandı.** ≥1 dk yanıtta elle "kanalolitiazis" tanısı kaydediliyor ama reçete kilitli kalıyor. Uyarı elle tanı formunda anında çıkıyor. Kilit gerekçesi ve özgün öneri HBYS notuna yazılıyor. Tekrar test bulgusu da kilide dahil. | — | Evet (H3 gerçek hız) |
| 2 | — | Elle gir | **1. kullanımdaki isteğim: karşılandı.** Ön seçim yok, Kaydet seçim yapılana kadar kapalı. Elle tanıda kanal, taraf ve mekanizmanın hiçbiri önceden seçili değil. | — | Evet |
| 3 | — | Başlıkta hasta kodu | **1. kullanımdaki isteğim: karşılandı.** "Hasta kodu 2026-104857" ayrı satırda, kesilmeden yazıyor. | — | Evet |
| 4 | — | BBQ süresi | **1. kullanımdaki isteğim: karşılandı.** Klinisyen modunda adım başına 30 s; BBQ 6:06'dan 4:21'e indi. | — | Evet (gerçek hız) |
| 5 | — | Bulgu formu | **1. kullanımdaki isteğim: karşılandı.** Torsiyon yönü, yorulma, oturunca ters nistagmus, gözlem yöntemi ve 200 karakterlik not var; ek alanlar katlanır olduğu için form kalabalıklaşmamış. Torsiyon iki taraflı yanıtta tarafı belirliyor. Spontan nistagmus için ayrı alan yok ama "Sırtüstü nötr" bulgusu bu işi görüyor. | — | Evet |
| 6 | — | HBYS notu | **1. kullanımdaki isteğim: karşılandı.** Her test ayrı satırda. Mekanizma, "öneri X, klinisyen Y", gözlem yöntemi, reçete kodu ve geçerlilik yazıyor. | (Bkz. yeni sorun 13) | Evet (`hbys-notu.txt`) |
| 7 | Orta | Klinisyen modunda ses (`core/runner.ts` `stepSpeech`) | **1. kullanımdaki isteğim: karşılanmadı.** Klinisyene yönelik uzun cümleler hastanın alnından yüksek sesle okunuyor; "Pozisyon doğru" sesi cümleyi 3 s içinde kesiyor. Sentezde bu isteğe yer verilmemiş. | Klinisyen modunda varsayılan olarak yalnız bip ya da kısa söz ("yat", "otur", "süre doldu") olsun; muayene ekranında "Sesli yönerge: açık/kısa/kapalı" anahtarı bulunsun. | Evet (`speech.json`) |
| 8 | — | Sensörsüz mod metinleri | **1. kullanımdaki isteğim: karşılandı.** "Zamanlayıcıyla yap"; "Telefon alna konmaz; zamanlayıcı olarak kullanılır." | — | Evet |
| 9 | Düşük | Nistagmus işaretleme pratikliği | **1. kullanımdaki isteğim: kısmen.** Sensörsüz modda telefon elde zamanlayıcı olarak kullanılıyor (iyi). Kılavuzda "VNG değerini doğrudan forma yazın" yolu açıkça anlatılmıyor. | Kılavuzun klinisyen bölümüne bir cümle eklensin. | Kısmen |
| 10 | — | Reçete QR | **1. kullanımdaki isteğim: karşılandı.** Reçete oluşunca QR görünür alana kayıyor; reçete kodu ve geçerlilik de yazıyor. | — | Evet |
| 11 | — | Kalibrasyonda geri tuşu | **1. kullanımdaki isteğim: karşılandı.** Muayeneden çıkarmıyor. | — | Evet |
| 12 | — | Yazdırma | **1. kullanımdaki isteğim: karşılandı.** Rapor, reçete, QR ve imza A4'te tek sayfaya sığıyor. | (Bkz. yeni sorun 15) | Evet (PDF) |
| 13 | Düşük | HBYS notu, yeni | Not uzadı: H2'de 19 satır ve 1835 karakter. Manevranın her adımı için θ/φ sapma istatistikleri HBYS'de gereksiz. "Gözlem yöntemi: Frenzel" en üstte yazıyor ve her test satırında "gözlem: Frenzel" diye tekrar ediyor. | HBYS notu kısa olsun: manevra tek satır (adım süreleri ve sırasındaki nistagmus); açı istatistikleri yalnız yazdırılan raporda kalsın. Yöntem yalnız farklıysa satırda yazılsın. | Evet |
| 14 | Düşük | Gözlem yöntemi, yeni | Profilde "VNG/Frenzel kullanıyorum" işaretli olduğu halde her yeni hastanın ilk formunda yöntem boş geliyor (H3). Bu, hasta başına 1 fazla dokunuş demek. | Muayenedeki ilk form, profildeki ya da son muayenedeki yöntemle dolu gelsin. | Evet (`real3.log`) |
| 15 | Düşük | Yazdır/PDF, yeni | Chromium PDF çıktısında içerik 1. sayfada, ama 2. sayfa boş basılıyor (4 raporun hepsinde). | Yazdırma CSS'inde son öğeden sonra sayfa sonu/yükseklik taşmasını giderin. Safari'de ayrıca kontrol edin. | Evet (Chromium; Safari denenmedi) |

**Bilimsel doğruluk:** Yeni eklenen kurallarda hata görmedim.
- Torsiyon yönüne göre taraf: Arka kanal BPPV'de üst kutup etkilenen kulağa vurur (Bárány 2015, von Brevern ve ark., J Vestib Res 25:105).
  İki taraflı yanıtta öneri "olası" kalıyor ve tekrar test istiyor.
- ≥1 dk yanıtta kupulolitiazis ya da santral pozisyonel nistagmus ayırıcı tanısı yerinde.
- Yatay kanal manevralarında klinisyen modunda 30 s'lik adım süresi, AAO-HNSF 2017'deki "pozisyon başına nistagmus sönene kadar"
  ifadesiyle uyumlu.

## 4. Sevdiklerim
1. **Reçete kilidi bulguya bağlı:** Elle tanı benim kararım olarak kaydediliyor, ama ≥1 dk yanıtta ya da çok kanallıda hasta eve
   reçeteyle gitmiyor. Gerekçesi de notta.
2. **Bulgu formu ve HBYS notu artık klinik dilde:** Torsiyon, yorulma, ters nistagmus, yöntem ve not var; not satır satır.
   Forma 1–4 ek dokunuş ekliyor, süreyi uzatmıyor.
3. **Zaman:** BBQ 30 s'ye indi, yatay kanal hastası da 15 dakikaya sığıyor. Gecikme ve süre otomatik doğru doluyor; geri tuşu güvenli.

## 5. Memnuniyet: **8/10** (1. tur: 7/10)
1. turdaki güvenlik ve kayıt sorunlarının tamamı düzelmiş. Arka ve yatay kanal hastalarında klinikte kullanırım. Puanı kısan,
hastanın alnından klinisyen cümlelerinin okunması ve HBYS notunun gereğinden uzun olması. Meslektaşlarıma öneririm.
