# Risk analizi (ön, ISO 14971 yaklaşımıyla)

Bu belge bir başlangıç risk kaydıdır; resmi bir risk yönetim dosyası değildir. Klinik kullanım öncesinde klinik danışman ve
düzenleyici uzmanla tamamlanmalıdır.

| # | Tehlike / zarar | Olası neden | Azaltıcı önlem (uygulamada) | Kalan risk |
|---|---|---|---|---|
| 1 | Santral vertigo (inme) BPPV sanılıp tedavi gecikir | Hasta nüks sanıyor | İlk atakta kilit (hekim tanısı şart); her seansta 11 kırmızı bayrak sorusu (sürekli baş dönmesi, nörolojik belirti, baş ağrısı…), acil yanıtta 112 ekranı; uzun (>2 dk) baş dönmesinde durdurma; "aynı baş dönmesi mi?" sorusu | Var: kırmızı bayrağı olmayan santral olay; HINTS evde yapılamaz. Belgelenmiş, kabul edilmiş |
| 2 | Yanlış tarafa manevra | Hasta tarafı karıştırır | Hekim/reçete tarafı varsayılan; belirsizse iki yönlü test; hekim tarafıyla çelişkide hekime yönlendirme | Düşük; yanlış taraf Epley'i zararsız ama etkisizdir |
| 3 | Manevra sırasında düşme | Baş dönmesi, yataktan kalkış | Yatakta yapılır; son adım "yavaşça oturun, acele etmeyin", 60 s oturma; hareket kısıtlılığı/yardımcı yokluğu kontrendikasyon | Var; yardımcı önerilir |
| 4 | Boyun yaralanması | Boyun hastalığında ekstansiyon/rotasyon | Kontrendikasyon listesi (boyun, omurga, karotis, inme), yakın boyun travması kırmızı bayrağı | Düşük |
| 5 | Yanlış açı → etkisiz manevra | Telefon kayar, kalibrasyon hatalı, sensör gürültüsü | Her seans kalibrasyon; her manevra başında telefonun alındaki yerinin kontrolü (>10° fark → hızlı yeniden tanıtma); kararlılık kontrolü; 1 s onay; 2 s'den uzun sapmada sayaç durur; sarsıntıda duraklama; adım başı hedefte kalma yüzdesi raporlanır | **Ölçülmedi**: gerçek telefonlarda doğruluk (Faz A) |
| 6 | Aşırı tekrar | Hasta sürekli manevra yapar | Doz sınırları (günde 3; reçetesiz 3 gün / 9 manevra), ataklar arasında ortak ve kayan pencereyle sayılır (atak kapatıp açarak sıfırlanamaz); yarıda kalan manevra da sayılır; deneme günde 2; hekime yönlendirilen ataktan sonra "hekimimle görüştüm" onayı | Düşük; onay beyana dayalıdır |
| 7 | Ses duyulmuyor → hasta adımı kaçırır | Sessiz mod, Türkçe ses yok | Ayarlar'da ses testi; yaklaşma bip sesi; görsel gösterge yardımcıya görünür | Var (özellikle iOS sessiz anahtar); yerel uygulamada kayıtlı ses planlandı |
| 8 | iOS'ta titreşim yok | Safari titreşim API'sini desteklemez | Ses ve ton yedekleri; bilgi notu | Yerel uygulama sürümünde giderilir |
| 9 | Uygulama arka plana geçer, zamanlama bozulur | Telefon çağrısı, ekran kilidi | Ekran açık tutma (Wake Lock; geri gelince yeniden alınır, desteklenmiyorsa ekran zaman aşımı uyarısı); arka plana geçince otomatik duraklatma; çıkışta kayıt ve sayfa kapatma uyarısı | Düşük |
| 10 | Sahte/yanlış reçete | Bağlantı başkası tarafından üretilir | Reçete yalnız arka kanal + sınırlı doz açar; kırmızı bayraklar yine sorulur; "tanımadığınız kişiden gelen reçeteyi kabul etmeyin" uyarısı; sağlama toplamı yazım hatalarını yakalar | Sağlama toplamı imza değildir; kurumsal sürümde dijital imza önerilir |
| 11 | Kişisel sağlık verisi sızıntısı | Paylaşılan cihaz, yedek dosyası | Veri yalnız cihazda; ağ yok; klinisyen modunda hasta adı yerine kod; tüm verileri silme | Cihaz güvenliği kullanıcıya bağlı |
| 12 | Demo modunun gerçek tedavi sanılması | Ayar açık unutulur | Kalıcı "DEMO MODU · tedavi amaçlı değildir" şeridi | Düşük |

## Bilinen sınırlar
- Otururken başın 45° çevrilmesi sensörle doğrulanamaz; yatınca doğrulanır.
- Nistagmus gözlemi yok (hasta modunda yalnız belirti). Kanıt: Kim 2023 RKÇ belirtiye dayalı kendi kendine tedaviyi destekler.
- Yatay ve ön kanal yalnız klinisyen modunda.
- Gerçek telefon çeşitliliğinde (özellikle düşük segment Android) sensör kalitesi ölçülmedi.
