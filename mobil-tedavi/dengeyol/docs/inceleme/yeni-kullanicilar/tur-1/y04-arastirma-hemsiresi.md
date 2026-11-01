# y04 — Selin, klinik araştırma hemşiresi (tur 1)

## 1. Ben kimim, ne yapmaya çalıştım
34 yaşındayım, üniversite hastanesinde DengeYol çalışmasının koordinatör hemşiresiyim. İşim, katılımcıya uygulamayı
5 dakikada kurdurmak ve kontrol muayenesinde evde olanları (manevralar, aşılan uyarılar yani "araştırma kaydı",
uygulamanın kararları) eksiksiz toplamak. iPhone 13 öykünümünde (Demo modu, ×20, sahte ses motoru, cümleler zamanlı kayıtlı)
4 katılımcıyı oynadım, sonra klinisyen modunda hepsinin ev raporunu QR bağlantısıyla aldım ve HBYS notunu kopyaladım.

## 2. Akış günlüğü (⚠ = duraksadım/karıştı)
**Kurulum (katılımcıya yaptırma)**
- A) Reçetesiz, sıfırdan: karşılama (631 kr) → "Hastayım" → tek ekran onam (1244 kr) → onay → "Başla" → ana ekran. **3 dokunuş.**
  Ses yok. Okutursam ~2 dk, ben anlatırsam ~1 dk. Çok iyi.
- B) Reçeteyle: klinisyende hasta kodu "DY-001" + reçete (tanı onaysız → "Yine de reçete yaz", taraf + gerekçe): 8 dokunuş.
  Katılımcı bağlantıyı açar → reçete kartı (1027 kr) → kabul → onam → Başla: **3 dokunuş**, profil ve hasta kodu kendiliğinden doldu.
- ⚠1 iPhone: kart "önce ana ekrana ekleyin, sonra bağlantıyı orada yeniden açın" diyor. Ana ekrandaki uygulama Safari'deki kaydı
  görmüyor. Uygulamanın içinde kamera yok, bağlantıyı yapıştırmak gerekiyor. Katılımcıya bunu ayrıca göstermem gerekti.
  Gerçekte kurulum süresi: QR okutma, ana ekrana ekleme, yeniden açma, yapıştırma ve onam ile **~4–5 dk** (tahmin). 5 dakikaya ancak sığıyor.
- ⚠2 Reçetede "Gün sayısı" 3 seçili geliyor, geçerlilik ise 14 gün. Protokolde gün sayısını her seferinde elle denetlemem gerekiyor.

**Katılımcılar evde** ("Başım dönüyor"dan manevra başlayana dek dokunuş; makine süresi ×20)
| Katılımcı | Akış | Dokunuş | Kayda geçenler |
|---|---|---|---|
| P1 tanılı + reçeteli | güvenlik "Hiçbiri yok" → "muayeneden beri geçmedi" → hazırlık → tanıtma → sağ Epley | 5 | reçeteli kısa yol; aşma yok |
| P2 tanısız, iki taraf + | alt tip → sağ+sol test → **Karar ekranı (5 seçenek)** → "Başlat" → sol Epley | 8 | NO_DIAGNOSIS, APP_DECISION, REFER_BOTH_SIDES |
| P3 uyarıyı aşan (boyun) | kontrendikasyon "Yine de" → test → Epley'de 2 dk+ baş dönmesi "Devam et" → aynı gün 2. Epley ("Yine de manevra yap") | 8 (+3) | CONTRAINDICATION, VERTIGO_TOO_LONG, EARLY_REPEAT |
| P4 kırmızı bayrak + devam | "çift görme/konuşma" işaretli → 112 uyarısı → "Yine de devam et" → "yatakta dönünce" → supine roll → BBQ roll | 8 | RED_FLAG, SUBTYPE, APP_DECISION |
- Okunacak/dinlenecek metin: güvenlik listesi tek başına **1073–1148 kr**. Bir atakta ses: P1 46 cümle/1904 kr, P2 84/3680,
  P4 91/3431, P3 (2 manevra) 126/5882. Ses ekranla uyumluydu; kesilen cümleler benim ×20 hızlı dokunuşumdandı.
- ⚠3 P2: iki taraf pozitif. "Hangisi daha şiddetli" sorulmadı, uygulama süreye bakıp sol dedi. Sonra telefon alından iniyor,
  5 seçenekli Karar ekranı ve ardından "Başlat" geliyor. Katılımcı iki ek ekran görüyor.

**Kontrol muayenesi (klinisyen modu)**
- QR bağlantısını açma → "ev dönemi olarak ekle": reçeteli P1'de kod eşleşti, **1 dokunuş**. Reçetesizlerde "kodsuz" çıktı;
  "Yeni hasta" seçip kodu elle yazdım (4 işlem). ⚠4 Dört katılımcıda bile karıştırma riski var, kimlik doğrulaması yok.
- ⚠5 **Klinisyen ekranında ve HBYS notunda araştırma kaydı hiç yok.** P4'ün kırmızı bayrağı ve devamı, P3'ün boyun uyarısı,
  2 dk aşımı ve erken tekrarı, tanısız kullanım ve uygulamanın karar gerekçesi görünmüyor. P4 klinisyene "temiz" bir atak
  gibi geliyor. Bunları ancak katılımcının telefonundaki raporu tek tek okuyarak yazabildim. Kodda da durum bu:
  `HomeEpisode` (core/reportShare.ts) içinde overrides, güvenlik yanıtları ve test türü alanı yok.
- ⚠6 P4'ün supine roll testi klinisyen ekranında "Taraf testi: Sağ: baş dönmesi…" diye çıkıyor. Hangi test olduğu yazmıyor.
- HBYS notunda ev dönemi tek satır ve aşma sayısı yok.
- Dışa aktarım: yalnız "Yedeği indir (JSON)" var. Katılımcının telefonundaki yedek eksiksiz, aşmalar dahil. Klinisyendeki
  yedek yalnız bağlantıyı saklıyor. Çalışma için CSV ya da tablo yok.

**Ölçüm özeti:** kurulum 3 dokunuş (reçeteyle de 3; iPhone'da ana ekran adımı ile ~4–5 dk). Manevraya 5–8 dokunuş.
Klinisyende rapor alma 1–4 işlem, ~30 s. "Ne yapacağımı bilemedim" anı: **6** (⚠1–⚠6).

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Kritik | Ev raporu QR → klinisyen ekranı, HBYS notu | Araştırma kaydı (aşmalar, kırmızı bayrak yanıtları, kontrendikasyon, uygulamanın kararı) aktarılmıyor. P4 kırmızı bayrağa rağmen devam etti, klinisyende görünmüyor | Bağlantıya `overrides` ve "evet" yanıtları girsin. Klinisyen ekranında ayrı "Araştırma kaydı" bölümü olsun, HBYS notuna "Uyarıya rağmen devam: 3 (RED_FLAG…)" satırı yazılsın | Evet (4 katılımcı) |
| 2 | Kritik | Hasta raporu, P4 | Supine roll yapıldı, rapor "Taraf testleri (belirtiyle **Dix-Hallpike**)" diyor. BBQ roll yapıldı, üstteki "Manevra" satırı **Epley** diyor (`Episode.protocolId` epley kalıyor) | Test ve manevra adı gerçekten yapılana göre yazılsın (`sideTests.canal`=HC ise "sırtüstü baş çevirme"); atak düzeyindeki manevra alanı güncellensin | Evet (ekran + kayıt) |
| 3 | Yüksek | Hasta raporu, P4 | Güvenlik soruları "**DURDURULDU** — çift görme…" yazıyor, oysa katılımcı devam etti (`redFlags.stopped: true`). Durum "sürüyor" | "İşaretlendi; 112 uyarısı gösterildi; katılımcı devam etti" yazılsın, `stopped` yalnız gerçekten durunca true olsun | Evet |
| 4 | Yüksek | Araştırma kaydı metni | Ham kodlar geçiyor: "güvenlik sorusu uyarısına rağmen devam edildi: **neuro**", "Sıradaki adım: **early-retest**" | Maddenin Türkçe adı ("çift görme / konuşma bozukluğu") ve "1. saat tekrar testi" yazılsın | Evet |
| 5 | Yüksek | Araştırma kaydı sınıflaması | APP_DECISION "bir uyarıya rağmen devam edildi" diye kullanıcı aşması gibi listeleniyor. P2'de aynı karar APP_DECISION ve REFER_BOTH_SIDES olarak iki satır yazılmış | "Uygulamanın kararları" ile "Kullanıcının aştığı uyarılar" ayrı listelensin. Her satırda kod, seçilen seçenek ve ilgili test/manevra kimliği olsun | Evet |
| 6 | Yüksek | Veri modeli / rapor | Demo modu ve uygulama/algoritma sürümü hiçbir kayıtta ve raporda yok. Eğitimde yapılan denemeyle gerçek tedavi ayırt edilemiyor | Her atağa ve manevraya `simulation`, uygulama sürümü ve karar kuralı sürümü yazılsın, raporda görünsün | Evet (kayıt alanları) |
| 7 | Yüksek | Kimlik | Reçetesiz katılımcının raporu kodsuz geliyor, klinisyen elle eşliyor | Hasta kurulumunda isteğe bağlı "Çalışma katılımcı no" alanı olsun, rapor ve QR'a girsin | Evet |
| 8 | Orta | Dışa aktarım | Yalnız JSON yedek var. Çok katılımcılı, satır satır (atak / test / manevra / aşma) CSV yok | Klinisyende "Çalışma verisini dışa aktar (CSV)": katılımcı no, zaman, olay türü, kod, ayrıntı | Evet |
| 9 | Orta | Eksik araştırma alanları | Başlangıç ve kontrolde belirti şiddeti (VAS/DHI), şikâyet süresi, yaş/cinsiyet (hasta tarafında) yok. Manevra sonrası yalnız 4 kategori | İsteğe bağlı 0–10 şiddet sorusu (atak başı ve sonrası), klinisyende DHI alanı | Evet (alanlar yok) |
| 10 | Orta | Kurulum, iPhone | Ana ekrandaki uygulama Safari kaydını görmüyor, reçete bağlantısını yeniden yapıştırmak gerekiyor | Reçete kartında "Bağlantıyı kopyala" düğmesi ve ana ekrandan açılınca "panodaki reçeteyi yükle" önerisi | Evet (metin), iOS davranışı öykünümde sınanamadı |
| 11 | Orta | P2 karar | İki taraf pozitifken "hangisi daha şiddetli" sorulmadan süreyle karar verildi, ardından 5 seçenekli Karar ekranı ve "Başlat" geldi | Karar telefon alındayken sesle söylensin, tek dokunuşla devam edilsin. Karar ölçütü ("süre 25 s > 13 s") kayda yazılsın | Evet |
| 12 | Düşük | Reçete formu | "Gün sayısı" 3 seçili geliyor, geçerlilik 14 gün | Çalışma için varsayılan gün sayısı profilde ayarlanabilsin | Evet |
| 13 | Düşük | BBQ roll başlangıcı | İlk koşuda testten hemen sonra "yanlış tarafa dönüldü" (POSITION_UNREACHABLE) uyarısı geldi | Test sonu ile manevra başı arasında "başınızı ortaya getirin" beklemesi | Hayır (2. koşuda olmadı; sanal baş kaynaklı olabilir) |

## 4. Puanlar
- **Sezgisellik: 7/10.** Katılımcı tarafında kurulum 3 dokunuş, akış kesintisiz ve ses ekranla uyumlu. Klinisyen tarafında
  rapor almak kolay ama aradığımı orada bulamıyorum.
- **Genel memnuniyet (araştırma koordinatörü olarak): 4/10.** Aşmalar yalnız katılımcının telefonunda okunabiliyor ve orada da
  yanlış etiketler (Dix-Hallpike/Epley, "DURDURULDU") ve ham kodlar var. Demo bayrağı ve sürüm yok, toplu dışa aktarım yok.
  Bu haliyle araştırma verisini güvenilir toplayamam.
- **Bir yakınıma önerir miyim / kullanır mıyım:** Hasta olarak bir yakınıma kurardım. Çalışmada veri toplama aracı olarak
  #1, #2 ve #6 düzelmeden kullanmam; şimdilik her kontrolde katılımcının telefonundan JSON yedeği alırım.

Betikler/görüntüler: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/yeni-kullanicilar/tur-1/y04-arastirma-hemsiresi/`
