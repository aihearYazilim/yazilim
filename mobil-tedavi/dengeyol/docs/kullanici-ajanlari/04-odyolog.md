# 04-odyolog: Odyolog Elif (devlet hastanesi odyoloji kliniği)

## 1. Kim olduğum ve denediğim akışlar
Günde 10–15 vertigo hastası görüyorum, hasta başına 10–15 dakikam var. Bazen VNG gözlüğüm var, bazen nistagmusa çıplak gözle
bakıyorum. Telefon hastanın alnında duruyor. Bir elimle hastanın başını tutuyorum, ekrana öbür elimle (bazen eldivenle) dokunuyorum.
Dix-Hallpike, supine roll, Epley, Semont, BBQ ve Gufoni'yi biliyorum. Uygulamadan beklentim zaman kazandırması ve kayıt tutması.
Tanıyı bana öğretmesini beklemiyorum.

Denediğim akışlar (Playwright, Pixel 7 ve iPhone SE, demo sensör, ×20 hız). Betikler ve ekran görüntüleri
`scratchpad/personas/04-odyolog/` altında (`run1.mjs`, `run2.mjs`, `r1-*.png`, `r2-*.png`, `run1.log`, `run2.log`):
- İlk açılış → rol → profil → yeni muayene (kod boş) → sensörlü sağ Dix-Hallpike (kalibrasyon, nistagmus işaretleme)
  → sol Dix-Hallpike (işaretsiz) → supine roll → tanı önerisi → onay → Epley → tekrar test → QR reçete → rapor ve yazdırma
  görünümü → liste. **Toplam 32 dokunuş**; buna profil ve 5 bulgu formu dahil.
- Gün içinde 4 muayene (iki tanesi aynı kodla), listeden hasta bulma.
- Elle bulgu girişi (5 test), yanlış öneri senaryoları: tek tarafta şiddet unutuldu, iki taraflı DH, tanısız reçete,
  onaydan sonra bulgunun değişmesi, DH'de yatay nistagmus.
- Sensörsüz mod (VNG ya da sensör yok), iPhone SE'de yatar adımın arama fazı.
- Okuduğum kod: `Exam.tsx`, `FindingForm.tsx`, `ClinicianHome.tsx`, `diagnosis.ts`, `protocols.ts`, `RunnerView.tsx`,
  `runner.ts` (ses metinleri), `Calibrate.tsx`.

## 2. En büyük 3 engel
1. **Yürütücüde işim olan düğmeler ekranın altında, görünmüyor.** Pixel 7'de "Adımı bitir" (y=735) ve θ/φ kartı, 108 px
   yüksekliğindeki "Nistagmus BAŞLADI" alanının arkasında kalıyor (`r1-10-dh-yatar-adim.png`). iPhone SE'de "Pozisyon doğru
   (elle onay)" y=775'te, ekran yüksekliği ise 568 (`r2-14-H-se-arama.png`). Düğmeye ulaşmak için kaydırmam gerekiyor ama
   bir elim hastanın başında, eldiveniyle alında kaydırmak mümkün değil. Bunun üstüne Dix-Hallpike'ta 60 s gözlem ve 20 s
   oturma zorunlu. Nistagmus 15 s'de bitse de 95 s bekliyorum. Bir hastada DH sağ+sol, roll, Epley ve tekrar test yalnız
   sayaçlarla yaklaşık 11 dakika sürüyor. 10–15 dakikalık randevuya sığmıyor.
2. **Tanı önerisi bazı durumlarda kendinden emin ama yanlış ya da eskimiş.**
   - Apogeotropik roll'da sağa şiddet 2 girdim, solu girmeyi unuttum (varsayılan 0). Uygulama **"Sol yatay kanal BPPV, tipik"**
     dedi ve Gufoni-apo önerdi (`r2-04`). Unutulan bir alan bu yüzden yanlış tarafa manevra demek.
   - Tanıyı onayladım, sonra sağ DH bulgusunu "saf aşağı vuran" olarak düzelttim. Santral uyarısı kırmızı çıktı ama
     **"Onaylı tanı: Sağ arka kanal BPPV / Tedaviye geç"** kartı yeşil olarak yerinde kaldı (`r2-08-E-bayat-tani.png`).
   - İki taraflı DH önerisini onayladım (taraf yok). Tedavi sekmesi tarafı sessizce **"Sağ"** seçti ve "Epley (sağ) başlat"
     gösterdi (`r2-05`, `Exam.tsx:432`).
   - Tanı girmeden Reçete sekmesinde "Sağ"ı seçip **ev Epley reçetesi üretebildim** (`r2-07`, `Exam.tsx:584`).
3. **Aynı hastayı tekrar bulamıyorum, kâğıt dosyaya da düzgün ekleyemiyorum.** Listede arama yok, yalnız son 50 muayene
   görünüyor. Aynı kodla ikinci muayene açınca ikinci bir hasta kaydı oluşuyor ("P-1001" iki kez, `run2.log`). Kod sonradan
   değiştirilemiyor. "Bu hastaya yeni muayene" düğmesi yok. Kod boş bırakılınca verilen "H-003" hastane protokol numarasıyla
   eşleşmiyor. Yazdırılan raporda üst sekmeler ve "Kalibrasyonu sıfırla / Listeye dön" düğmeleri de basılıyor. Reçetenin
   içeriği (taraf, manevra, doz) ve QR raporda yok, yalnız "reçete verildi" yazıyor (`r1-32-rapor-print.png`). Telefonu
   olmayan ya da QR okutamayan yaşlı hastaya kâğıt QR veremiyorum.

## 3. Bulgular tablosu

| # | Ekran/yer | Sorun (gözlenen) | Öneri (somut) | Etki | Emek |
|---|---|---|---|---|---|
| 1 | Yürütücü, klinisyen (`RunnerView.tsx:495-536`) | "Adımı bitir", "Elle onay" ve θ/φ kartı kaydırmadan görünmüyor (Pixel 7, SE) | Klinisyen modunda başlık ve yönergeyi ilk 3 s'den sonra tek satıra indir. Altta, pad'in hemen üstüne sabit bir çubuk koy: `[Elle onay] [Adımı bitir ›]` (her biri ≥56 px). θ/φ'yi göstergenin içine taşı | Yüksek | M |
| 2 | Yürütücü, nistagmus alanı (`RunnerView.tsx:545`) | Alan telefonun alt kenarında, yani hastanın gözlerinin hemen üstünde. Dokunurken elim gözleri kapatıyor. Çıplak gözle bakarken bulguyu kaçırırım | Klinisyen modunda gözlem adımlarında **ekranın tamamı** başlat/bitir alanı olsun (pad yalnız görsel durum göstersin). Kazara dokunuşa karşı mevcut debounce yeterli | Yüksek | S |
| 3 | DH gözlem süresi (`protocols.ts` dh-lie 60 s, dh-up 20 s) | Nistagmus bitince de sayaç sürüyor. Bitiş işaretlenince erken geçiş yok | Klinisyen modunda "BİTTİ" işaretlenince büyük bir "Sonraki adıma geç" düğmesi göster. Hiç işaret yoksa 30 s'den sonra "Nistagmus yok → bitir" seçeneği çıksın. Hasta modundaki süreler değişmesin | Yüksek | S |
| 4 | Roll şiddeti (`FindingForm.tsx:221`, `diagnosis.ts:188-209`) | Şiddet her taraf için ayrı ekranda 0–3 seçiliyor, varsayılan 0. Unutulursa yanlış taraf "tipik" çıkıyor | Nistagmus varken 0 seçeneğini kaldır, şiddet zorunlu olsun. Daha iyisi: roll bitince tek bir soru sor: **"Hangi tarafta daha güçlü? Sağ / Sol / Eşit / Emin değilim"**. "Emin değilim" seçilirse taraf belirsiz kalsın ve güven "belirsiz" olsun | Yüksek | S |
| 5 | Onaylı tanı (`Exam.tsx:411`) | Bulgu değişince onaylı tanı ve "Tedaviye geç" yerinde kalıyor | Tanıyı bulgu sürümüyle birlikte sakla. Bulgu değişirse kartı sarıya çevir ("Bulgular onaydan sonra değişti, tanıyı yeniden onaylayın"), Tedavi/Reçete'yi kilitle | Yüksek | S |
| 6 | Tedavi tarafı (`Exam.tsx:432`) | Tanıda taraf yoksa varsayılan "Sağ" | Varsayılan `null` olsun. Taraf seçilmeden yanlı manevra düğmeleri pasif kalsın ("Önce taraf seçin") | Yüksek | S |
| 7 | Reçete (`Exam.tsx:584`) | Tanı yokken ya da canal=null (subjektif BPPV) iken ev reçetesi üretilebiliyor | Reçeteyi yalnız onaylı **arka kanal** tanısında aç. Tanı yoksa "Önce Tanı sekmesinde arka kanal tanısını onaylayın ya da elle girin" de ve düğmeyi kapat (kırmızı çizgi: hekim tanısı) | Yüksek | S |
| 8 | Bulgu formu, sensörsüz ya da işaretsiz test (`Exam.tsx:126`) | İşaret yoksa "Yok" önceden seçili geliyor. Elim meşgul olduğu için işaretleyemediysem tek dokunuşla yanlış negatif kaydediliyor | Önceden seçim yapma. En üste büyük bir **"Negatif (nistagmus yok)"** düğmesi koy (yine tek dokunuş ama bilinçli). Başlıkta "İşaret yapılmadı" yazsın | Orta | S |
| 9 | Bulgu formu seçenekleri (`FindingForm.tsx:4`) | Her test için aynı 7 seçenek aynı sırada. Roll'da yatay seçenekler 4. ve 5. sırada, form kaydırma istiyor (`r1-13`) | Teste göre sırala. DH: Yok / Yukarı+torsiyonel / Aşağı+torsiyonel / Yatay / Diğer. Roll: Yok / Geotropik / Apogeotropik / Diğer. Kalanları "Diğer desenler ▾" altına al | Orta | S |
| 10 | Bulgu formu, eksik klinik alanlar | Yorulma, oturunca ters yönlü nistagmus ve torsiyon yönü kaydedilmiyor. Bunlar rapora yazmak istediğim bilgiler | İsteğe bağlı, tek satırlık segmentler ekle: "Yorulma: var/yok/bakılmadı", "Oturunca ters dönüş: var/yok". Torsiyon için "üst kutup alttaki kulağa / üstteki kulağa". Varsayılan "bakılmadı" olsun, hız düşmesin | Orta | M |
| 11 | Tanı gerekçesi (`diagnosis.ts:113`) | "olası" etiketinin nedeni yazmıyor (gecikme 32 s > 20 s, `r1-20`). Negatif testler de gerekçede görünmüyor | Gerekçeye neden satırı ekle: "Gecikme 32 s (>20 s, tipik değil) → olası". Destekleyen negatifleri de yaz: "Sol DH ve roll negatif". Kaynak satırı: "Bárány 2015 PC-BPPV ölçütü: 4/5 sağlandı" | Orta | S |
| 12 | Tekrar test (`Exam.tsx:500`) | Tekrar test bulgusu öneriye girmiyor. Apogeotropik → geotropik dönüşüm görülünce bir sonraki manevra önerilmiyor (KLINIK-INCELEME 1.e) | Tekrar testi de `suggestDiagnosis`'e ver: "Tekrar testte geotropiğe dönüştü → aynı taraf BBQ/Gufoni-geo". Negatifse "Tedavi başarılı, ev reçetesi gerekli mi?" diye sor | Orta | M |
| 13 | Liste (`ClinicianHome.tsx:135`) | Arama yok, en fazla 50 kayıt, aynı kod iki ayrı hasta | Listenin üstüne "Kod ara" kutusu. Kod yazarken eşleşen hasta varsa "P-1001 kayıtlı: bu hastaya yeni muayene aç" öner. Listeyi bugün / önceki günler diye grupla | Yüksek | M |
| 14 | Muayene başlığı | Kod sonradan değiştirilemiyor. Otomatik "H-003" protokol numarasıyla eşleşmiyor | Başlıktaki koda dokununca düzenlenebilsin ("Kodu sonra eklerim" akışı) | Orta | S |
| 15 | Rapor yazdırma (`styles.css:896`, `Exam.tsx:763`) | Sekmeler, "Kalibrasyonu sıfırla" ve "Listeye dön" çıktıya basılıyor. Reçete ayrıntısı ve QR yok. İmza alanı yok | `.seg` ve alt düğmeler `no-print` olsun. Rapora "Ev reçetesi: SAĞ arka kanal · Epley · günde ≤3, 3 gün" ve QR eklensin. Altına "Ad soyad / imza / kaşe" satırı. A4'te tek sayfa | Yüksek | S |
| 16 | Reçete (`Exam.tsx:648`) | QR yalnız ekranda. Kâğıda basılamıyor | "Hasta için yazdır" düğmesi: QR, taraf, manevra, doz ve "her seansta güvenlik soruları" notu A5 ya da A4'ün yarısında | Orta | S |
| 17 | Kalibrasyon, klinisyen (`Calibrate.tsx:157-184`) | Başlık klinisyene sesleniyor ama madde listesi ve ekranlar hastaya ("alnınıza", "başınızı geriye yatırıp", `r2-10`) | Klinisyen metinleri: "Telefonu hastanın alnına yaslayın", "Hasta tavana baksın". Aşama başlıkları da öyle | Orta | S |
| 18 | Sensörsüz/VNG (`Exam.tsx:70`) | VNG gözlüğü alnı kapattığı için telefon alına konamıyor. "Sensörsüz" seçimi her muayenede sıfırlanıyor ve düğme kalibrasyon ekranının en altında, kaydırma gerekiyor | Profil kartına kalıcı bir ayar ekle: "Varsayılan: Sensörlü / Sensörsüz (VNG, Frenzel)". Sensörsüzde testler doğrudan zamanlayıcıyla başlasın | Yüksek | S |
| 19 | θ/φ sayıları (`RunnerView.tsx:498`) | "θ -135° (hedef -135±15°)" işaret kuralını bilmeden anlamsız. φ'nin de klinik adı yok | Klinik dile çevir: "Baş: sola 45° dönük ✓ (hedef 35–55°)", "Sarkma: 28° ✓ (15–40°)", "Yüz yere 45° ✓". Ham θ/φ'yi raporun ek bölümüne taşı | Orta | S |
| 20 | Sesli yönerge, klinisyen (`runner.ts:216,238`) | Klinisyen metninin tamamı sesli okunuyor (ör. "...yatak düzleminin 20–30° altına sarkar..."). Uzun, hastanın önünde 3. şahıs konuşuyor. Her 15 s'de "15 saniye. 45 saniye kaldı" | Klinisyen modunda sesi kısalt: adım başlığı ("Sağ Dix-Hallpike: yatırın"), "Pozisyon doğru", son 10 s'de tek uyarı. Uzun metin yalnız ekranda kalsın | Orta | S |
| 21 | Hedef boyutları (eldiven) | Gün sayısı segmenti 37×44 px, sekmeler 71×44 px, onay kutusu 13×13 (`run1.log`) | Segmentleri en az 48 px yükseklik ve 56 px genişlikle yap. Gün seçimini 2 satıra böl. Onay kutusunu 60 px'lik `choice check` satırına çevir | Orta | S |
| 22 | Sekme akışı | Testler bitince "Tanıya geç" yok. Reçete sonrası "Rapor" yok. Gezinme hep üstteki küçük sekmelerle | Her sekmenin altına bağlama göre büyük bir "Sonraki: Tanı ›" düğmesi koy. Sekmede tamamlanma işareti olsun (Testler ✓ 5/5) | Orta | S |
| 23 | Rapor (`Exam.tsx:711`, 751) | "Doğum yılı / cinsiyet: — / -", "Ort./maks θ hata 0.1° / 0°" (ortalama maksimumdan büyük). Tekrar testin saati yok | "-" yerine "belirtilmedi" yaz. Yuvarlamayı düzelt. Tekrar test satırına saat ve "Epley sonrası" bilgisini ekle | Düşük | S |
| 24 | Muayene notu (`types.ts` `notes?`) | Alan veri modelinde var, arayüzde yok. Öykü ya da özel durumu yazamıyorum | Tanı sekmesine 1 satırlık "Klinik not" alanı ekle. Rapora da yansısın | Düşük | S |
| 25 | Yürütücü, hasta modu metni (`RunnerView.tsx:344`) | Metin "ekranın herhangi bir yerine dokunun" diyor, ama yalnız alttaki alan dokunuşa tepki veriyor | Ya #2'deki tam ekran dokunuşu hasta moduna da uygula ya da metni "alttaki geniş alana" diye değiştir | Orta | S |

## 4. Hızlı kazanımlar (öncelik sırasıyla)
1. **#5 ve #6**: Bulgu değişince onaylı tanıyı geçersiz say. Tedavi tarafında varsayılan "Sağ"ı kaldır.
2. **#4**: Roll şiddeti için tek soru: "Hangi tarafta daha güçlü?" Ya da nistagmus varken 0 seçeneğini kaldır.
3. **#7**: Reçeteyi yalnız onaylı arka kanal tanısında aç.
4. **#2**: Klinisyen gözlem adımında tam ekran başlat/bitir dokunuşu.
5. **#1 ve #3**: Altta sabit `[Elle onay] [Adımı bitir]` çubuğu. "BİTTİ" işaretlenince "Sonraki adıma geç".
6. **#18**: Kalıcı "Sensörsüz (VNG/Frenzel)" varsayılanı.
7. **#15**: Yazdırmada sekme ve düğmeleri gizle. Reçete ayrıntısı, QR ve imza satırını rapora ekle.
8. **#8**: Bulgu formunda "Yok" önceden seçili gelmesin, yerine büyük "Negatif" düğmesi olsun.

## 5. Önerilen yeni metinler

| Yer | Önce | Sonra |
|---|---|---|
| Nistagmus alanı (klinisyen) | "Nistagmus / belirti BAŞLADI" | "Ekrana dokun: nistagmus BAŞLADI" (aktifken: "Ekrana dokun: BİTTİ") |
| Bitiş sonrası (yeni) | — | "Nistagmus bitti (süre 18 s). [Sonraki adıma geç ›]" |
| Bulgu formu başlığı, işaretsiz | "Sağ Dix-Hallpike" (Yok seçili) | "Sağ Dix-Hallpike · işaret yapılmadı" + üstte büyük [Negatif: nistagmus yok] |
| Roll sonrası (yeni) | Şiddet 0/1/2/3 (her taraf ayrı) | "Yatay nistagmus hangi tarafta daha güçlüydü? [Sağ] [Sol] [Eşit] [Emin değilim]" |
| Bayat tanı (yeni) | "Onaylı tanı: Sağ arka kanal BPPV · Tedaviye geç" | "Bulgular onaydan sonra değişti. Önceki tanı: Sağ arka kanal BPPV. Yeniden değerlendirip onaylayın." |
| Tedavi tarafı (yeni) | Sağ seçili | "Etkilenen taraf: seçilmedi. Manevrayı başlatmak için tarafı seçin." |
| Reçete, tanı yok | "Önce arka kanal tanısını onaylayın ya da tarafı aşağıdan seçin." | "Ev reçetesi yalnız onaylı arka kanal BPPV tanısıyla verilir. Tanı sekmesinde öneriyi onaylayın ya da tanıyı elle girin." |
| Tanı gerekçesi | "Gecikme 32 s." | "Gecikme 32 s (tipik: 1–20 s) → güven: olası." |
| Kalibrasyon maddeleri (klinisyen) | "...alnınıza yaslayın; dik oturun..." / "Ardından başınızı geriye yatırıp tavana bakın." | "Ses gelince telefonu hastanın alnına yaslayın; hasta dik otursun, karşıya baksın." / "Ardından hasta başını geriye yatırıp tavana baksın." |
| Kalibrasyon aşama başlığı | "Telefonu alnınıza yaslayın" / "Tavana bakın" | "Telefonu hastanın alnına yaslayın" / "Hasta tavana baksın" |
| Ses, klinisyen adım girişi | "Baş sağa 45° çevrili kalarak hasta hızla sırtüstü yatırılır; baş yatak düzleminin 20–30° altına sarkar. Nistagmusu gözleyin..." | "Sağ Dix-Hallpike. Yatırın." |
| Ses, klinisyen sayaç | "15 saniye. 45 saniye kaldı." (her 15 s) | Yalnız "10 saniye kaldı." ve "Süre doldu." |
| θ/φ kartı | "θ -135° (hedef -135±15°) φ 3°" | "Baş: sola dönük, yüz yere 45° ✓ · Sarkma 3° ✓" |
| Alt düğme | "Kalibrasyonu sıfırla (yeni hasta yerleşimi)" | "Telefonu yeniden tanıt (yerinden oynadıysa)" |

### Klinik terminoloji notları
- **"Kanalitiyazis / Kupulolitiyazis"** (`diagnosis.ts`, `Exam.tsx:386`): Türkçe literatürde "kanalolitiazis" ve
  "kupulolitiazis" yazılır. Araya "y" girmez, kök de "kanalo-"dur.
- **"Semont (kurtarıcı) manevrası"**: "liberatory" sözcüğünün düz çevirisi. Klinikte "Semont (serbestleştirici/liberatuar)
  manevrası" ya da yalnız "Semont manevrası" denir.
- **"eğilme-öne eğilme / bow and lean"** (`diagnosis.ts:215`): ifade kendini tekrarlıyor. Doğrusu "öne eğilme–geriye
  eğilme (bow and lean) testi".
- **"boş nokta"** (`diagnosis.ts:99`): "null nokta" (nistagmusun söndüğü baş pozisyonu). Sırtüstü nötr pozisyondaki
  nistagmus için yerleşik terim "psödospontan nistagmus" ya da "yatma (lying-down) nistagmusu".
- **"Gecikme"**: kabul edilir. Raporda "latans (gecikme)" yazmak hekim okuru için daha tanıdık.
- **"Yukarı vuran + torsiyonel"**: doğru, ama torsiyon yönü eksik. PC-BPPV için "üst kutup alttaki kulağa vuran" yazılmalı.
  İki taraflı DH pozitifliğinde tarafı ayırmanın tek yolu bu.
- **"İki taraflı Dix-Hallpike pozitif (... ya da yanıltıcı yanıt)"**: "yanıltıcı yanıt" belirsiz. Öneri: "(çift taraflı arka
  kanal BPPV ya da karşı tarafta da tetiklenen tek taraflı BPPV)".
- **"Ort./maks |θ| hata"**: rapor okuyan hekim için jargon. Öneri: "Ortalama / en büyük baş açısı sapması".
- Protokol tanımları (DH sarkma 20–30°, roll'da 30° fleksiyon, Epley'de toplam 180°, Gufoni-geo/apo yönleri) bence
  doğru ve KLINIK-INCELEME ile uyumlu.

## 6. Yapmamamız gerekenler
- **Bulgu formunu uzun bir anket gibi zorunlu alanlarla doldurmayın** (VNG yavaş faz hızı, ayrıntılı torsiyon). Yorulma ve
  ters dönüş isteğe bağlı kalsın, varsayılanı "bakılmadı" olsun. Yoksa kâğıda dönerim.
- **Tanı önerisini otomatik onaylamayın.** "Tipik" öneride bile onayı tek dokunuşla ben vereyim. Öneri bulgudan hemen sonra
  kendiliğinden Tedavi'ye geçmesin.
- **Hasta adı ya da TC kimlik numarası istemeyin.** Kod ve protokol numarası yeterli. Hastanenin KVKK kuralı nedeniyle cihazda
  isim tutmak istemem.
- **Klinisyen modunda hasta modunun kilitlerini aynen uygulamayın** (ör. 120 s baş dönmesinde zorunlu durdurma, sabit
  bekleme süreleri). Uyarı versin, kararı bana bıraksın. Hasta modundaki kırmızı çizgiler ise olduğu gibi kalsın.
- **Her test öncesinde yeniden kalibrasyon ya da onay ekranı eklemeyin.** Hasta başına bir kalibrasyon yeterli.
- **Ekranı döndürme ya da yatay mod gibi otomatik davranışlar eklemeyin.** Telefon alında hareket ederken ekranın dönmesi
  okumayı bozar. Ters çevirme gerekiyorsa elle bir düğmeyle olsun.
- **Tek bir "akıllı" sihirbazla sekmeleri kaldırmayın.** Hasta önce manevrayı yaptırıp testi sonra girmemi isteyebilir.
  Sekmeler kalsın, yalnız "Sonraki ›" kısayolu eklensin.
