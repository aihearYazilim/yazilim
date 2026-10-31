# Tur 2 · k09 · KBB uzmanı (Doç. Dr. Serkan, 52, nörootoloji polikliniği)

## 1. Ben kimim, ne yapmaya çalıştım
Aynı KBB uzmanıyım ve uygulamayı ikinci kez değerlendiriyorum. 1. turdaki 12 isteğimin karşılanıp karşılanmadığını kendi gözümle
kontrol ettim. Ardından akışı baştan sona yeniden yaşadım: klinisyen olarak muayene, tanı ve QR reçete; hasta olarak reçeteyi
içe aktarma ve gerçek hızda (timeScale 1) bir Epley atağı. Sınır durumlarını da denedim. Cihaz Pixel 7 öykünümüydü, sensör demo.

## 2. Yaşadıklarım (kısa günlük)
- **Klinisyen:** Muayene başlığında artık "Hasta kodu NO-2611" yazıyor. Bulgu formuna gözlem yöntemi (VNG/Frenzel/çıplak göz) ve not
  eklenmiş; nörootolojide işime yarar. Tanı önerisi ve kupulolitiazis kilidi aynı. Elle tanı girince de kilit aşılmıyor ("Tanı elle
  değiştirilse de ev reçetesi verilmez"); çok doğru.
- **Reçete formu:** "Geçerlilik: 14 gün, 14.11.2026 tarihine kadar. Testsiz kısa yol yalnız muayene edilen baş dönmesi sürerken…"
  yazıyor ve "Reçete kodu: 83635d6f" eklenmiş. Aynı satırlar basılı raporda ve HBYS notunda da var. HBYS notu artık satır satır;
  her pozisyonda θ ve φ (sarkma) sapması yazıyor. Poliklinik notu olarak doğrudan kullanılabilir.
- **Hasta, reçete kartı:** Hasta kodu, geçerlilik tarihi, "Bu bağlantı imzasızdır… yalnız muayenede elden verilen QR'ı kabul
  edin" uyarısı ve "ev manevrası talimatıdır" ifadesi var. 20 günlük reçetede "SÜRESİ DOLDU" ve ne olacağı açıkça yazıyor.
- **Kurulum:** Konuşma hızı denemesi gelmiş. Onam metni neredeyse aynı kalmış: hâlâ "kendi sorumluluğumdadır" diyor, riskler ve
  seçenekler yok.
- **Atak (gerçek hız, ~5,5 dk):** 14 kırmızı bayrak sorusu soruluyor (nörolojik soru üçe bölünmüş, ortostatik soru eklenmiş).
  Seçenekler de sesli okunuyor; "same" sorusu 19 s, kan sulandırıcı sorusu 18 s sürüyor ve toplam yük arttı. Sonra "muayeneden beri
  geçmedi" → tanıtma → Epley. Oturuş adımında "Başınızı sağa çevirdiyseniz öyle kalın" diyor; sensörle doğrulanamayan adım için
  dürüst bir cümle. Baş dönmesinde "Dokunmazsanız 105 saniye sonra durdurup sizi hekime yönlendireceğim" uyarısı çok iyi. Bitişte
  10 dk dinlenme sayacı ve "kalkarken tutunun, gece ışığı açın" hatırlatması var.
- **Rapor:** İlk satır "Hasta kodu NO-2611 · reçete 31 Ekim 2026 · Doç. Dr. Serkan K., Üniv. Hast. KBB Nörootoloji". Her adım tek
  satırda: "48 s · hedefte %100 · sapma … · sarkma ort. 28° · baş dönmesi: gecikme 15 s (pozisyona gelişten), süre 18 s". Altında
  tanım cümlesi var. "kendi başına / yakını yaptırdı" ve duraklatma sayısı da yazıyor.
- **Hata denemeleri:** Kulak sorusuna "Evet" → durdurma ekranı ani işitme kaybında "BUGÜN KBB" diyor (AAO-HNSF 2019 ani SNHL
  kılavuzuyla uyumlu). Rapordaki "Durum" artık Türkçe cümle; ham kod kalmamış. Ortostatik soruya "Evet" → aile hekimi/dahiliye
  yönlendirmesi ve kilit. Geri tuşu duraklatıyor; ekrana bakmadan "2 s basılı tut → devam" var. Duraklatma ekranına "Pozisyona
  gelemiyorum / boynum ağrıyor" eklenmiş. Bitişi işaretlenmeyen dönmede 2 dk'da durduruyor; raporda "bitişi işaretlenmedi" yazıyor.
- **Sınır günü:** 17 Ekim tarihli reçeteyi 31 Ekim'de açtım. Kart "31 Ekim 2026 tarihine kadar (14 gün) · SÜRESİ DOLDU" diyor:
  aynı gün hem "o güne kadar geçerli" hem "doldu" (aşağıda #N1).

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | — | 1. kullanımdaki isteğim #1 (imzasız reçete) | **Kısmen.** Kartta açık "imzasız" uyarısı var; reçete kodu klinisyen raporunda ve HBYS notunda. Ama kod **hasta raporunda yok**, bu yüzden gelen raporun benim reçeteme ait olduğunu doğrulayamıyorum. Elle üretilmiş "Prof. Dr. Herhangi Biri" bağlantısı hâlâ kabul ediliyor (gerekçe 00-SENTEZ'de, kabul ediyorum). | Hasta raporunun başlık satırına "reçete kodu 83635d6f" eklenmeli; HBYS'deki kodla eşleşsin. | Evet |
| 2 | — | 1. kullanımdaki isteğim #2 (raporda hasta kimliği) | **Karşılandı.** Reçete v2 hasta kodunu taşıyor; rapor "Hasta kodu · reçete tarihi · klinisyen" satırıyla başlıyor. | — | Evet |
| 3 | — | 1. kullanımdaki isteğim #3 (hekime geri bildirim döngüsü) | **Kısmen.** Atak kapandıktan sonra 24 saat ana ekranda "Raporu hekime gönder" kartı var (kod incelemesi). Reçetenin son gününde hatırlatma yok; rapor QR'ı ile klinisyen moduna aktarma 3. tura kaldı. | Reçete bitiminde bir kez "Raporunuzu Doç. Dr. …'a gönderin" hatırlatması; klinisyen modunda içe aktarma. | Kısmen |
| 4 | — | 1. kullanımdaki isteğim #4 (belirti sütunu) | **Karşılandı.** Satır "gecikme X s (pozisyona gelişten), süre Y s" diyor ve tanım cümlesi var. **Düzeltme:** 1. turdaki "~1 s sonra işaretledim ama 17 s görünüyor" gözlemim hatalıydı. Demo baş, yönerge konuşulurken pozisyona geliyordu; uygulamanın hesapladığı gecikme doğruydu. | — | Evet |
| 5 | — | 1. kullanımdaki isteğim #5 (ham iç kodlar) | **Karşılandı.** "ear" yerine soru metni, "VERTIGO_TOO_LONG" yerine Türkçe cümle geliyor. | — | Evet |
| 6 | — | 1. kullanımdaki isteğim #6 (geçerlilik klinisyene görünsün) | **Karşılandı.** Reçete formunda, QR kartında, basılı raporda ve HBYS notunda tarih ve kısa yol kuralı var. Ancak #N1'e bakın. | — | Evet |
| 7 | — | 1. kullanımdaki isteğim #7 (ortostatik kırmızı bayrak) | **Karşılandı**, ifade sorunu var (#N2). | — | Evet |
| 8 | — | 1. kullanımdaki isteğim #8 (onam metni) | **Kısmen.** Reçete kartında "ev manevrası talimatıdır" ifadesi var. Onamda hâlâ "kendi sorumluluğumdadır" yazıyor; riskler (bulantı/kusma, düşme, geçici kötüleşme, kanal değişimi) ve seçenekler (klinikte manevra, kendiliğinden düzelme) yok. Onam sürümü raporda görünmüyor. | 4–5 satırlık risk/seçenek özeti; "onam tarihi ve sürümü" rapora. | Evet |
| 9 | — | 1. kullanımdaki isteğim #9 (tanı tarihi) | **Karşılanmadı.** Tanı tarihi hâlâ isteğe bağlı (`Onboarding.tsx:317`). | Tanı yılı zorunlu; eski tanıda bir kez uyarı (kilidi gevşetmeden). | Evet (kod) |
| 10 | — | 1. kullanımdaki isteğim #10 (süresi dolmuş reçete kartı) | **Karşılandı.** "SÜRESİ DOLDU" ve sonuçları yazıyor. | — | Evet |
| 11 | — | 1. kullanımdaki isteğim #11 (rapor özeti) | **Karşılanmadı.** Reçeteli kısa yolun kullanıldığı ve 14 günlük toplam manevra sayısı raporda yok. | "Kısa yol: evet (hasta 'muayeneden beri geçmedi' dedi) · bu dönemde 1/15 manevra". | Evet |
| 12 | — | 1. kullanımdaki isteğim #12 (aşırı yönlendirme ölçümü) | Pilot konusu; uygulamada değişiklik beklenmiyordu. Yeni sorular bu yükü artırıyor (#N2, #N3). | — | — |
| N1 | Orta | Geçerlilik sınırı: `state/episodes.ts` `rxActive`, `examReport.ts:213-226`, `PatientHome.tsx:449` | "14.11.2026 tarihine kadar" yazıyor ama reçete 14.11 00:00'da bitiyor. Muayeneden 14 gün sonraki gün kartta "31 Ekim tarihine kadar · SÜRESİ DOLDU" aynı anda görünüyor. Hasta da hekim de son günü yanlış anlar. `examReport.ts:213` yorumu "son geçerli gün" diyor, kod ise o günün başında bitiriyor. | Ya son geçerli günü yazın ("13.11.2026 dahil") ya da o günü de geçerli sayın. Hasta ve klinisyen ekranı aynı tarihi göstermeli. | Evet |
| N2 | Orta | Ortostatik soru: `core/safety.ts:77-82` | "Ayağa kalkınca gözleriniz kararıyor ya da bayılacak gibi oluyor musunuz?" BPPV hastası da yataktan kalkarken baş dönmesi ve "bayılacak gibi" bulantı yaşar. Ayırıcı nitelik olan dönme hissinin yokluğu sorulmuyor, bu yüzden gereksiz yönlendirme ve kilit riski var. Durdurma ekranındaki alt satır "hekiminize ya da odyoloğunuza" diyor, gerekçe metni "aile hekimi/dahiliye". | "Etrafın dönmesi OLMADAN, ayağa kalkınca gözlerin kararması ya da bayılacak gibi olma" diye sorulmalı; alt satır gerekçeyle uyumlu olmalı. Soru kalmalı, yalnız ifade daraltılmalı. | Evet |
| N3 | Düşük | `neuroGait` (`safety.ts:54`) | "Yürüyemeyecek kadar dengeniz bozuldu mu?" 112'ye yönlendiriyor. Şiddetli BPPV atağının ilk dakikalarında hasta "evet" diyebilir. Gövde ataksisi önemli bir inme bulgusu, soru kalmalı. | "Baş dönmesi geçtiği hâlde / başınızı kıpırdatmadan dururken de yürüyemiyor musunuz?" niteleyicisi. | Kod + metin |
| N4 | Orta | Belgeler: `docs/RISK-ANALIZI.md:8`, `docs/KLINIK-PROTOKOL.md:71-73` | Belgelerde hâlâ "11 kırmızı bayrak" ve eski soru listesi var; ortostatik ve bölünmüş nörolojik sorular yok. RISK #2'deki "yanlış taraf Epley zararsız" ifadesi değişmemiş. Tasarım dosyası koddan ayrılmış durumda. | Belgeleri 14 soruya göre güncelleyin (kaynak: AAO-HNSF 2017 ayırıcı tanı). RISK #2'yi "genellikle zararsız; kanal değişimi bildirilmiştir" yapın. | Evet |
| N5 | Düşük | Kırmızı bayrak süresi | 14 soru ve sesli okunan seçenekler, atak anında hasta için yaklaşık 2–2,5 dk ek yük demek. Güvenlik için kabul edilebilir, ama "same" (19 s) ve kan sulandırıcı (18 s) soruları kısaltılabilir. | İlaç listesini sesli okumada kısaltın ("aspirin dahil kan sulandırıcı"); ekranda tam liste kalsın. | Evet (konuşma kaydı) |

## 4. Sevdiklerim
1. Klinisyen tarafındaki izlenebilirlik: hasta kodu, reçete kodu, geçerlilik ve kısa yol kuralı HBYS notunda; adım başına θ/φ
   sapması; kupulolitiazis kilidinin elle tanıyla da aşılamaması.
2. Hasta raporunun tek satırlık adım özetleri ve iç kod bırakmayan Türkçe "Durum" cümlesi. Hekim olarak kararı bu raporla verebilirim.
3. Güvenlik akışının sözlü dürüstlüğü: "Dokunmazsanız 105 saniye sonra durdurup sizi hekime yönlendireceğim", doğrulanamayan oturuş
   adımında "çevirdiyseniz öyle kalın", ani işitme kaybında "BUGÜN KBB".

## 5. Memnuniyet
**8/10 (1. turda 7).** İsteklerimin çoğu doğru uygulanmış ve raporla hastayı kendi kaydımla eşleştirebiliyorum. Puanı düşüren
eksikler: onam metni, rapordaki reçete kodu, tarih sınırındaki bir günlük belirsizlik ve belgelerin koddan geri kalması.

**Hastalarıma önerir miyim?** Evet, koşullu olarak ve bu kez daha rahat. Yalnız kendi muayene ettiğim, tek taraflı arka kanal
kanalolitiazisi doğrulanmış, kontrendikasyonu olmayan hastalara, muayenede elden QR ile öneririm. Koşullarım şunlar: etik kurul
onaylı pilot (cihaz onayı yok, gerçek telefonda açı doğruluğu henüz ölçülmedi), yazılı aydınlatılmış onam ve 7. gün rapor kontrolü.
Pilotta yönlendirme oranını ölçmek istiyorum. Reçetesiz genel kullanım için hâlâ hayır.
