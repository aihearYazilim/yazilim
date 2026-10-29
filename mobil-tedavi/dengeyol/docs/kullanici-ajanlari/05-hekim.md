# 05 — Hekim: Dr. Can, aile hekimi (yer yer KBB uzmanı bakışıyla)

## 1. Kim olduğum ve ne denedim
Aile hekimiyim. Muayene başına 5–7 dakikam var. BPPV'yi tanırım, Dix-Hallpike yaparım ama manevraları seyrek yaptığım için
açıdan ve süreden emin olamıyorum. Benim için iş şu: tanıyı hızla doğrulamak, gerekiyorsa Epley'i uygulamanın yönlendirmesiyle
yapmak, hastaya evde kullanacağı bir reçete (QR) vermek ve kayıt için bir çıktı almak.

Denediğim akışlar (iPhone 13 görünümü, demo sensör; betikler ve ekran görüntüleri
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/personas/05-hekim/` klasöründe):
- **İlk açılıştan QR'a kadar en kısa yol** (`flow.cjs`, ×20 hız ve **gerçek hız**): rol seçimi → profil → yeni muayene →
  sağ Dix-Hallpike telefonla yapılır (kalibrasyonla birlikte) → sol Dix-Hallpike "Elle gir" ile negatif girilir → tanı önerisi
  onaylanır → Epley (sağ) → reçete ve QR → rapor → yazdırma görünümü ve A4 PDF (`f-rapor.pdf`).
- **Hasta tarafı:** QR bağlantısıyla reçeteyi açtım, kabul ettim, kurulumu tamamladım, ana ekrana baktım (`f26`–`f31`).
- **Sevk gerektiren 6 desen** (`atypical.cjs`): saf aşağı vuran, gecikmesiz ve uzun süren yanıt, atipik desen, nistagmussuz
  vertigo, iki taraflı pozitif, Dix-Hallpike'ta yatay nistagmus. Her birinde tanı ekranına, reçeteye ve rapora baktım (`a1`–`a6`).

**Rol adı "odyolog" beni dışlıyor mu?** Giriş kartında "Odyolog / hekimim" yazdığı için doğru kartı buldum. Bunun dışında
gördüğüm her yerde yalnız odyolog geçiyor: başlık "Odyolog modu", örnek ad "Ör. Odyolog Ayşe Yılmaz", adres `#/odyolog`,
hastanın gördüğü başlık "**Odyolog reçetesi**" (benim adım altında yazsa bile), hasta ana ekranında "Odyologunuz size…".
İşimi engellemiyor ama hastam "odyoloğa mı gitmem gerekiyordu?" diye soruyor. Bu ad düzeltilmeli (bkz. #1).

## 2. En büyük 3 engel

1. **5–7 dakikaya sığmıyor.** Bunu gerçek hızda ölçtüm. Kalibrasyon yaklaşık 18 s sürüyor. Sağ Dix-Hallpike, pozisyon anında
   doğru olsa bile 101 s sürüyor (60 s gözlem, 20 s oturma, aradaki geçişler). Epley ölçümde **228 s** sürdü
   (yaklaşık 3,8 dk). Uygulama açılışından QR'a kadar, pozisyonlar anında doğru ve sol Dix-Hallpike elle girilmiş olsa bile,
   **353 s (yaklaşık 6 dk)** geçti. Gerçek bir hastayı her pozisyona getirmek adım başına 5–15 s daha ekler, yani yaklaşık **7 dk**.
   İki Dix-Hallpike'ı da telefonla yaparsam yaklaşık **8,5 dk**. Hastayı karşılama ve açıklama zamanı bunlara dahil değil. Dokunuş sayısı makul: profil
   kayıtlıyken "Yeni muayene"den QR'a **20 dokunuş**. Asıl kayıp sabit beklemelerde. Nistagmus 20 s'de bitse bile halka
   60 s'den geri sayıyor. "Adımı bitir" düğmesi var ama ilk görünen alanda değil, ancak kaydırınca çıkıyor. Ne zaman güvenle basılabileceği de
   yazmıyor (`RunnerView.tsx:533`). Her test bittiğinde Testler sekmesine dönüyorum. Sonraki adıma geçen bir "Sıradaki" düğmesi yok.
2. **Santral uyarı reçeteyi ve raporu durdurmuyor.** Bir taraf saf aşağı vuran, diğer taraf tipik arka kanal girdim (`a1-saf-asagi-tani.png`).
   Kırmızı uyarı çıkıyor ama hemen altındaki öneri yeşil "**tipik**" etiketli. Onaylayınca **QR reçete sorunsuz üretiliyor**, rapora
   uyarıdan **tek satır bile geçmiyor**. Gecikme 0 s ve süre 95 s olan yukarı vuran yanıt (`a2`) "kupulolitiyazis (olası)" diye
   öneriliyor. **Hiç uyarı yok**, ev reçetesi de veriliyor. Nedeni: gecikmesiz başlangıç uyarısı yalnız `!cupulo` olduğunda
   çalışıyor (`diagnosis.ts:130`). Benim gibi seyrek bakan bir hekim için en riskli yer burası.
3. **Uygulama manevrayı öğretmiyor, yalnız ölçüyor.** Adım metinleri doğru ve kısa (`protocols.ts` → `clinician`). Ama hiçbir
   adımda pozisyonu gösteren bir çizim yok. Tek görsel yatakta yastığın yeri ve o da hazır ekranında küçücük görünüyor
   (`f08-dh-hazir.png`). Ekran hastanın alnında: hasta yatınca ben başucundaysam yazı bana **ters** görünür. Gösterge "tepeden
   bakış" kuralıyla çiziliyor (`Gauges.tsx:3`), oysa dışa bakan ekranda **SAĞ etiketi hastanın sol yanına düşer** (geometriden
   çıkardım, gerçek cihazda doğrulanmalı). Açıdan emin olmayan biri için bu, yön hatası demek. Bir de şu var: Dix-Hallpike'ta iki
   elim hastanın başında. Alındaki telefonun "Nistagmus BAŞLADI" alanına dokunmak başı ve telefonu oynatıyor. Telefonu kimin
   tutacağı (hasta kendi eliyle mi?) hiçbir yerde yazmıyor.

## 3. Bulgular

| # | Ekran/yer | Sorun (gözlenen) | Öneri (somut) | Etki | Emek |
|---|---|---|---|---|---|
| 1 | Giriş, başlık, hasta reçetesi (`ClinicianHome.tsx:40,61`, `PrescriptionImport.tsx:45`, `PatientHome.tsx:51`) | Rol her yerde "odyolog". Hasta, aile hekiminden aldığı reçetede "Odyolog reçetesi" görüyor. | Ortak ad "**Klinisyen**" olsun: başlık "Klinisyen modu", reçete başlığı "Hekim / odyolog reçetesi" ya da yalnız "Ev manevrası reçetesi", örnek ad "Ör. Dr. Ayşe Yılmaz / Odyolog Ayşe Yılmaz". Hastaya giden metinlerde "Hekiminiz ya da odyologunuz". | Orta | S |
| 2 | Profil (`f02-profil.png`) | Ad ve kurum boşken de "Kaydet" çalışıyor. Bu durumda hastanın reçetesinde "Yazan" satırı hiç çıkmıyor ve hasta reçeteyi kimin verdiğini göremiyor (`PrescriptionImport.tsx:62`). Kurum örneği "KBB / Odyoloji" (ASM yok). | İlk reçeteden önce ad zorunlu olsun ("Reçetede adınız görünecek"). Örnek: "Ör. 5 No.lu ASM / … Hastanesi KBB". | Düşük | S |
| 3 | Kalibrasyon, klinisyen modu (`Calibrate.tsx:158-160`, `f06`) | Liste hekime "telefonu **alnınıza** yaslayın… **başınızı** geriye yatırın" diyor. Hasta metni yanlışlıkla hekime gösteriliyor. | Klinisyene ayrı liste: "1. Başla'ya dokunun. 2. Telefonu hastanın alnına, ekran dışa bakacak şekilde yerleştirin; hasta dik oturup karşıya baksın. 3. Hasta tavana baksın." | Orta | S |
| 4 | Kalibrasyon kapsamı (`Exam.tsx:69`) | Kalibrasyon yalnız muayenenin ekranında tutuluyor. Yeni muayenede ve sekme dışına çıkınca yeniden isteniyor (yaklaşık 18 s). | Aynı telefon ve aynı hasta için kalibrasyonu 10 dk boyunca muayene kaydında saklayın. Chip'e dokununca "yeniden kalibre et" çıksın. | Orta | M |
| 5 | Test ekranı, gözlem süresi (`protocols.ts:147`, `RunnerView.tsx:533`) | Dix-Hallpike gözlemi sabit 60 s. Nistagmus bitse de geri sayım sürüyor. "Adımı bitir" ve θ/φ sayıları göstergenin altında kalıyor. Telefon ekranında ilk görünen alanda yoklar. Görmek için alındaki telefonda adım alanını kaydırmak gerekiyor (`f09`, `f18`, `styles.css` `.runner-body` taşma kaydırması). | Klinisyen modunda "BİTTİ" işaretinden 10 s sonra büyük bir "**Gözlemi bitir (nistagmus sona erdi)**" düğmesi çıksın. Hiç nistagmus yoksa 30 s'de "Negatif, bitir" önerilsin. Bekleme sınırları hasta modunda olduğu gibi kalsın. | Yüksek | S |
| 6 | Akış (Testler → Tanı → Tedavi → Reçete) | Her bulgu kaydından sonra Testler sekmesine dönülüyor. Epley bitince Tedavi sekmesinde kalınıyor. Sonraki adımı her seferinde ben buluyorum. | Bağlama göre tek bir ana düğme: "Sol Dix-Hallpike'a geç" → "Tanı önerisini gör" → "Epley (sağ) başlat" → "Ev reçetesi ver". Ana ekrana bir de "**Hızlı arka kanal akışı**" (DH sağ/sol → öneri → Epley → QR) eklensin. | Yüksek | M |
| 7 | Çalışan test ve manevra ekranı (`f09`, `f18`) | Ekranda hiç pozisyon çizimi yok, yalnız metin ve daire gösterge var. Seyrek manevra yapan hekim "yüz yere 45°"yi gözünde canlandırmak zorunda kalıyor. | Her adım için küçük bir yandan/tepeden çizim (hasta, yatak, baş yönü; 5 Epley + 3 DH pozu, SVG). Hazır ekranında "Adımlar" önizlemesi, adım başına 1 satır ve 1 çizim. | Yüksek | M |
| 8 | Gösterge yönü (`Gauges.tsx:3,47`) | Gösterge tepeden bakışa göre çiziliyor. Ekran dışa baktığı için ekrandaki "SAĞ" hastanın sol yanına düşüyor. Başucunda duran hekim yazıyı ters okuyor. | Gerçek cihazda doğrulayın. Etiketler "HASTANIN SAĞI" olsun. Klinisyen için "**Ekranı 180° çevir** (başucundayım)" seçeneği eklensin. Çok kısa bir ses yönü de faydalı: "Başı biraz daha sağa". | Yüksek | S |
| 9 | Telefonu tutma, nistagmus işareti | İki elim başta. Telefonu kimin tutacağı yazmıyor. İşaret alanına dokunmak başı oynatıyor. | Hazır ekranına bir satır: "Telefonu hasta kendi eliyle alnına bastırsın; siz başı iki elle tutun." Nistagmus işaretlemek isteğe bağlı olsun: süre ve gecikme formda elle girilebiliyor. "İşaretlemeden bitir" metniyle bunu açıkça söyleyin. | Orta | S |
| 10 | Bulgu formu (`f10`, `Exam.tsx:125`) | "BAŞLADI/BİTTİ" ile belirti işaretlendiği halde "Hasta baş dönmesi bildirdi" kutusu boş geliyor. Nistagmus tipi seçilmeden Kaydet pasif, ama nedeni yazmıyor. | İşaret varsa kutu dolu gelsin. Test tarafına göre en olası tip ("Yukarı vuran + torsiyonel") ilk sırada ve vurgulu olsun (varsayılan seçili olmasın). | Orta | S |
| 11 | Tanı önerisi, güven etiketi (`f12-tani.png`) | Gecikme 35 s'de öneri "olası" diyor ama nedenini yazmıyor. Öneri yalnız pozisyon testlerine dayanıyor. Öykü, işitme, nörolojik muayene, supine roll yapılmadığı söylenmiyor. | Gerekçeye "Olası: gecikme >20 s (tipik 1–20 s)" eklensin. Her önerinin altına sabit bir **sınırlar kutusu**: "Bu öneri yalnız girilen pozisyon testi bulgularına dayanır. Öykü, nörolojik muayene ve işitme değerlendirilmedi. Yapılmayan testler: Supine roll." | Yüksek | S |
| 12 | Santral uyarı ile öneri (`a1`) | Kırmızı uyarı varken öneri yeşil "tipik" etiketli ve onay tek dokunuşla veriliyor. | Herhangi bir santral/atipik uyarı varsa: etiket "uyarı var" olsun, onay düğmesi "Uyarıyı okudum, yine de onayla" olsun, öneri kartı kırmızı çerçeveli olsun. | Yüksek | S |
| 13 | Gecikmesiz ve uzun yanıt (`diagnosis.ts:130`, `a2`) | Gecikme 0 s ve süre ≥60 s olunca uyarı yok, "kupulolitiyazis (olası)" önerisi ve ev reçetesi geliyor. | Gecikmesiz başlangıç uyarısı kupulolitiyazis şüphesinde de gösterilsin. Kupulolitiyazis önerisinde ev reçetesi varsayılan olarak kapalı olsun ("klinikte kontrol önerilir"). | Yüksek | S |
| 14 | Reçete, santral/atipik uyarıda (`Exam.tsx:555`) | Uyarı ne olursa olsun QR üretilebiliyor (`a1`, `a2`, `a4`). | Uyarı varken Reçete sekmesinin en üstünde uyarı metni ve "Sevk/ileri değerlendirme planlandıysa ev reçetesi vermeyin" yazsın. Reçete vermek için açık bir onay kutusu gereksin. Engelleme değil, bilinçli bir adım. | Yüksek | S |
| 15 | Sevk desteği | Uyarı metinleri doğru ("nörolojik değerlendirme ve gerekirse MR") ama hekime somut bir sevk aracı yok. | Uyarı varsa bir "**Sevk notu**" düğmesi: bulgular + uyarı + "Nöroloji/KBB'ye sevk" metni, kopyalanabilir ve yazdırılabilir. Tanı ekranında bir "Sevk ölçütleri" katlanır listesi: saf aşağı vuran, gecikmesiz/sönmeyen nistagmus, yön değiştiren nistagmus, eşlik eden nörolojik bulgu, ani işitme kaybı, 2 manevraya yanıtsızlık. | Yüksek | M |
| 16 | Rapor içeriği (`Exam.tsx:680-767`, `f-rapor.pdf`) | Raporda santral uyarılar, tanının kaynağı (öneri/elle), reçetenin dozu ve QR, tekrar test sonucu varsa planı yok. Tarihte **yıl yok** ("29 Ekim 19:59"), imza alanı yok. | Rapora şunlar eklensin: "Karar destek uyarıları", "Tanı: … (uygulama önerisi klinisyence onaylandı / elle)", "Ev reçetesi: sağ Epley, günde en fazla 3, 3 gün" + küçük QR, "Plan/sevk" serbest satırı, tam tarih (29.10.2026 19:59), "Hekim imza/kaşe" alanı, uygulama sürümü. | Yüksek | S |
| 17 | Yazdır / PDF (`f25-rapor-print.png`) | Baskıda sekme çubuğu ("Testler Tanı Tedavi…"), "Kalibrasyonu sıfırla" ve "Muayene listesine dön" çıkıyor. A4'te 2 sayfa tutuyor. | Bunlara `no-print` eklensin. Rapor A4'te tek sayfaya sığdırılsın (manevra adım tablosu baskıda tek satıra iner: "Epley sağ, 5/5 adım, hedefte %100"). | Orta | S |
| 18 | e-Nabız / HBYS'ye aktarma | Muayene notuna yapıştırılacak metin yok. Yalnız ekranda tablo ve PDF var. | "**Muayene notunu kopyala**" düğmesi. Düz metin, 5–6 satır, ICD-10 önerisiyle (H81.1 Benign paroksismal vertigo). Örnek metin aşağıda (§5). | Yüksek | S |
| 19 | Rapor tablosu (`f24-rapor.png`) | "Ort./maks \|θ\| hata" sütununda ortalama maksimumdan büyük çıkıyor ("0.1° / 0°"). Ortalama ondalıklı, maksimum tam sayıya yuvarlanıyor (`runner.ts` `recordStats`). | İkisi aynı biçimde yuvarlansın. Sütun adı "Açı sapması (ort./en çok)" olsun. | Düşük | S |
| 20 | Reçete formu (`f23-recete-qr.png`) | Doz seçenekleri iyi: günde 1/2/3, 1/3/5/7 gün, varsayılan 3×3. Ama "gün sayısı" atak başına mı, reçete süresi mi belli değil. Reçetenin bitiş tarihi yok, sonraki ataklarda da geçerli kalıyor. | Etiket "Her atakta en fazla … gün" olsun. Altına "Reçete sonraki ataklarda da kullanılır. Geçerlilik: [6 ay / 1 yıl / süresiz]" seçeneği gelsin (varsayılan 1 yıl). | Orta | M |
| 21 | Reçeteyi hastaya verme | QR yalnız hekimin telefon ekranında. Hastanın telefonu yoksa ya da kamerası okumuyorsa hasta eli boş çıkıyor. | "**Hasta bilgi kâğıdı yazdır**": A5 boyutunda QR, taraf, manevra, doz, "ne zaman bırakıp başvurmalı" listesi. Muayene notuyla aynı çıktıdan alınabilsin. | Yüksek | S |
| 22 | Hasta tarafı reçete ekranı (`f26`) | Hasta "Muayene tarihi: 2026-10-29" (ISO biçimi) görüyor. Başlık "Odyolog reçetesi". Doz satırı "en fazla 3 gün", atak başına olduğu yazmıyor. | "29 Ekim 2026". Başlık "Ev manevrası reçeteniz". Doz satırı: "Baş dönmesi tekrarladığında: günde en fazla 3 kez, en fazla 3 gün. Düzelmezse hekiminize başvurun." | Orta | S |
| 23 | Tedavi sekmesi (`f14-tedavi.png`) | Önerilen manevra kartında hekim için en gerekli bilgi yok: süre ve adım sayısı. | Kartta "5 adım · yaklaşık 4 dk" yazsın. Semont için "yaklaşık 3 dk, hızlı geçiş". | Düşük | S |
| 24 | Manevra sonrası | Tekrar test düğmeleri var, ama Epley'den sonra "kaç dk sonra tekrar test" ve "ikinci Epley ne zaman" yönlendirmesi yok. | Epley bitince: "İsterseniz 10 dk sonra Dix-Hallpike'ı tekrarlayın; pozitifse aynı seansta 1 kez daha Epley yapılabilir." | Düşük | S |

## 4. Hızlı kazanımlar (öncelik sırasıyla)
1. **Santral/atipik uyarıyı her yere taşıyın** (#12, #13, #14, #16): uyarı varsa "tipik" etiketi kalksın, onay ve reçete bilinçli
   bir adım olsun, uyarı rapora yazılsın. `diagnosis.ts:130` koşulundaki `!cupulo` kaldırılsın.
2. **"Muayene notunu kopyala"** (#18): HBYS'ye ve e-Nabız muayene notuna yapıştırılacak 5–6 satırlık düz metin.
3. **"Gözlemi bitir" düğmesi** (#5): nistagmus bittikten 10 s sonra büyük bir düğme. Her testte 20–40 s kazandırır.
4. **Sıradaki adım düğmesi** (#6): her ekranın altında tek bir bağlamsal "Sonraki" düğmesi.
5. **Sınırlar kutusu ve güven etiketinin gerekçesi** (#11).
6. **Yazdırma temizliği ve rapora reçete, tam tarih, imza alanı** (#16, #17).
7. **Ad değişikliği: "Klinisyen modu", "Ev manevrası reçetesi"** (#1, #22).
8. **Kalibrasyon metnini klinisyene göre yazın ve "ekranı 180° çevir" seçeneğini ekleyin** (#3, #8).

## 5. Önerilen yeni metinler

**Giriş kartı** (`Welcome.tsx:45-46`)
- Önce: "Odyolog / hekimim" · "Pozisyon testlerini ve manevraları açı ölçümüyle yapmak, bulguları kaydetmek ve hastaya ev reçetesi vermek istiyorum."
- Sonra: "**Hekim / odyoloğum**" · "Dix-Hallpike ve manevrayı açı ölçümüyle yapmak, tanı önerisi almak, hastaya QR ev reçetesi ve rapor vermek istiyorum."

**Klinisyen ana ekran başlığı ve örnek ad** (`ClinicianHome.tsx:40,61`)
- Önce: "Odyolog modu" · "Ör. Odyolog Ayşe Yılmaz"
- Sonra: "**Klinisyen modu**" · "Ör. Dr. Ayşe Yılmaz, Aile Hekimi"

**Kalibrasyon listesi, klinisyen** (`Calibrate.tsx:158-160`)
- Önce: "Sesli yönergeyle telefonu ekranı dışa bakacak şekilde alnınıza yaslayın; dik oturun, karşıya bakın." / "Ardından başınızı geriye yatırıp tavana bakın."
- Sonra: "Telefonu hastanın alnına, ekranı dışa bakacak şekilde yerleştirin (hasta kendi eliyle bastırabilir). Hasta dik oturup karşıya baksın." / "Sonra hasta başını geriye yatırıp tavana baksın."

**Test hazır ekranı, klinisyen** (`RunnerView.tsx:345`)
- Önce: "Pozisyon doğruysa gösterge yeşile döner ve sayaç başlar. Nistagmus başlangıç ve bitişini alttaki alana dokunarak işaretleyin."
- Sonra: "Hasta telefonu alnına bastırsın; siz başı iki elinizle tutun. Pozisyon doğru olunca gösterge yeşile döner. Nistagmusu işaretlemek isteğe bağlıdır; gecikme ve süreyi sonra formda da girebilirsiniz. Nistagmus bitince 'Gözlemi bitir'e basabilirsiniz."

**Tanı ekranı, sınırlar kutusu** (`Exam.tsx:353`)
- Önce: "Uygulama yalnızca öneri sunar. Tanı kararı klinisyene aittir."
- Sonra: "**Bu bir karar desteğidir, tanı değildir.** Öneri yalnız girdiğiniz pozisyon testi bulgularına dayanır (Bárány 2015). Öykü, nörolojik muayene, işitme ve spontan nistagmus değerlendirilmedi. Yapılmayan testler: {liste}. Tanı ve sevk kararı sizindir."

**Santral uyarı varken onay düğmesi**
- Önce: "Bu tanıyı onayla"
- Sonra: "Uyarıyı okudum — yine de bu tanıyı onayla"

**Reçete sekmesi, uyarı varken (yeni)**
- "Bu muayenede santral/atipik bulgu uyarısı var. Hastayı ileri değerlendirmeye yönlendirecekseniz ev reçetesi vermeyin. [ ] Uyarıyı değerlendirdim, ev reçetesi vermek istiyorum."

**Reçete formu doz etiketi** (`Exam.tsx:617,621`)
- Önce: "Günde en fazla" · "Gün sayısı"
- Sonra: "Her atakta günde en fazla" · "Her atakta en fazla … gün"

**Hasta reçete ekranı** (`PrescriptionImport.tsx:45,58`)
- Önce: "Odyolog reçetesi" · "Günde en fazla 3 kez, en fazla 3 gün" · "2026-10-29"
- Sonra: "Ev manevrası reçeteniz" · "Baş dönmesi tekrarladığında: günde en fazla 3 kez, en fazla 3 gün. Düzelmezse hekiminize başvurun." · "29 Ekim 2026"

**"Muayene notunu kopyala" çıktısı (yeni, örnek)**
```
29.10.2026 — Pozisyonel vertigo değerlendirmesi (DengeYol karar desteği)
Sağ Dix-Hallpike: yukarı vuran + torsiyonel nistagmus, gecikme 3 s, süre 20 s. Sol Dix-Hallpike: negatif.
Tanı: Sağ arka kanal BPPV (kanalitiyazis) — uygulama önerisi, hekim onayladı. ICD-10 önerisi: H81.1
Tedavi: Sağ Epley, 5/5 adım, sensörle doğrulandı. Tekrar test: yapılmadı.
Ev reçetesi: sağ Epley, her atakta günde en fazla 3, en fazla 3 gün (QR verildi).
Uyarılar: yok. Plan: 1 hafta sonra kontrol / düzelmezse KBB.
```

## 6. Yapmamamız gerekenler (bu kullanıcı için)
- **Tanı önerisini otomatik onaylamak ya da "tipik"te onayı atlatmak.** Hızlı olur ama sorumluluk hekimde. Tek dokunuşla onay yeterince hızlı.
- **Santral uyarıda reçeteyi tamamen kilitlemek.** Hekim gerekçesiyle karar verebilmeli. Doğru çözüm uyarıyı görünür kılmak, onayı bilinçli hale getirmek ve rapora yazmak.
- **Klinisyene hasta tarzı uzun sesli anlatım.** Muayenede ses kısa olmalı: "Adım tamam. Sıradaki adım." şu hâliyle iyi, uzatılmasın.
- **Hasta adı ya da TC kimlik numarası istemek.** Kod yaklaşımı doğru. e-Nabız entegrasyonu için ağ/sunucu da gerekmez, kopyala-yapıştır yeterli.
- **Hasta modundaki bekleme sürelerini ve doz sınırlarını, klinisyen için yapılan kısaltmalara bağlamak.** "Gözlemi bitir" yalnız klinisyen modunda olmalı.
- **Supine roll ya da tüm manevraları zorunlu akışa koymak.** Aile hekimi için varsayılan yol arka kanal olmalı, diğerleri "Tüm testler / Tüm manevralar" altında kalmalı.
