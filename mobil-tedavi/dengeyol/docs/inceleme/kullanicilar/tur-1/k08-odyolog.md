# Tur 1 · k08 · Odyolog Zeynep (36, devlet hastanesi, klinisyen modu)

## 1. Ben kimim, ne yapmaya çalıştım
Günde ~8 baş dönmesi hastası gören, hasta başına 15 dakikam olan bir odyoloğum. VNG/Frenzel kullanıyor, manevraları elle yapıyorum.
Kendi telefonumu (iPhone 13 öykünümü, demo sanal sensör, gerçek hız ×1) klinisyen modunda arka arkaya 4 hastada kullandım:
H1 tipik sağ arka kanal, H2 sağ yatay kanal geotropik, H3 VNG ile sensörsüz ≥1 dk arka kanal yanıtı (kupulolitiazis şüphesi),
H4 çok kanallı (bulgular elle girildi) ve hata denemeleri. Sesli yönergeler sahte Türkçe sesle kaydedildi.

## 2. Yaşadıklarım (kısa günlük)
- **İlk kurulum (4 dokunuş, <10 s):** "Klinisyenim" → ad, kurum → Kaydet. VNG/Frenzel kutusu açıklamalı, sade.
- **H1, tipik sağ arka kanal: 6,5 dk, 39 dokunuş** (kalibrasyon 25 s, sağ DH 54 s, sol DH 68 s, Epley 170 s, tekrar DH 58 s, reçete ve not
  ~5 s). Demo sensör hastayı anında pozisyona soktuğu için gerçekte hastayı taşımakla ~8–9 dk sürer. 15 dakikaya sığıyor.
  Nistagmusu 3. saniyede "başladı", 18 s sonra "bitti" diye işaretledim. Formda gecikme **4 s**, süre **18 s** hazır geldi (sayaç
  pozisyona ilk girişten başlıyor, doğru). İşaretten sonra üstte "Gözlemi bitir → sonraki adım" yeşile döndü, beklemeden geçtim.
  Öneri "Sağ arka kanal BPPV (kanalolitiazis), tipik" çıktı. Onay, Tedaviye geç ve Epley (sağ) birer dokunuş. Reçete Epley, 3×3 gün
  varsayılanıyla tek dokunuşla oluştu, QR geldi, notu tek dokunuşla kopyaladım. Akış çok rahattı.
- **H2, yatay kanal geotropik: 10,4 dk, 56 dokunuş.** Sağ DH'de yatay geotropik girince Tanı sekmesi "supine roll yapın" dedi. Yerinde
  bir uyarı. Roll testinden sonra form üç kez art arda açıldı (nötr, sağ, sol). Şiddet zorunlu, açıklaması da formda yazıyor.
  "Sağ yatay kanal geotropik, tipik" önerisi çıktı, önerilen manevra BBQ roll + Gufoni-geo. **BBQ tek başına 6 dk 6 s sürdü** (7 adım × 45 s
  sabit). Tekrar teste vakit kalmadı. Reçete sekmesi "yalnız arka kanal" diye kilitliydi, doğru.
- **H3, VNG ile sensörsüz: 6,4 dk, 45 dokunuş.** Her adımda "Pozisyon doğru (elle onay)"a basmak gerekiyor (DH başına +3 dokunuş).
  Süre 75 s girince kırmızı uyarı geldi ("≥1 dk, kupulolitiazis olası, santral dışlayın") ve öneri Semont'u öne aldı. Reçete kilitliydi.
  Sonra **"Tanıyı elle gir"den "Arka kanal / Sağ / Kanalolitiazis" seçtim. Reçete formu açıldı.** Yalnız bir onay kutusu istiyor.
  Bulgu hâlâ 75 s'yi gösterirken 5 dokunuşla ev reçetesi verebildim.
- **H4, elle bulgu ve hatalar:** 5 bulguyu elle girmek 27 dokunuş sürdü. Çok kanallı uyarısı geldi, iki öneri "olası" çıktı, reçete kilitliydi.
  "Elle gir" formunda **"Yok" önceden seçili, Kaydet de etkin** geliyor. Onaydan sonra bir bulguyu değiştirince "tanıyı yeniden onaylayın"
  çıktı ve taraf sıfırlandı (iyi). Test sırasında geri tuşu testi duraklattı, bulgu kaybolmadı (iyi). Kalibrasyon ekranında geri tuşu
  beni muayeneden çıkarıp listeye attı.
- **Ses:** Klinisyen modunda alındaki telefon benim yönergelerimi hastaya yüksek sesle okuyor ("Nistagmusu gözleyin…", "Süre doldu;
  belirti sürüyor"). Uzun cümle, "Pozisyon doğru" sesiyle 3 s içinde kesiliyor. Bana gerekmiyor, hastayı kaygılandırabilir.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Yüksek | Reçete, `clinician/Exam.tsx:627-639` (kilit yalnız `dx.mechanism`'a bakıyor) | DH yanıtı 75 s (≥1 dk) iken elle "kanalolitiazis" tanısıyla kupulolitiazis kilidi 5 dokunuş + 1 kutuyla aşıldı. Kılavuz "kupulolitiazis şüphesinde reçete verilmez" diyor. Reçeteli hasta 14 gün içinde testsiz kısa yolla manevraya girebilir; manevrada baş dönmesi sınırı 120 s, 75 s'lik yanıt durdurmaz. | Kilit bulguya da baksın: bir DH'de yukarı vuran yanıt ≥60 s ise elle tanı ne olursa olsun reçete verilmesin. En azından gerekçe metni zorunlu olsun ve rapora yazılsın. | Evet (H3 ekran 08, HBYS notu) |
| 2 | Orta | Elle gir, `Exam.tsx:231` (`emptyFinding()` → `nystagmus:'none'`) | "Yok" önceden seçili, Kaydet etkin. Tek dokunuşla yanlış negatif kaydedilebiliyor. Kılavuzla çelişiyor ("önceden seçili gelmez"). | Elle girişte de `nystagmusUnset: true` olsun, tip seçilmeden Kaydet kapalı kalsın. | Evet (elle-gir-form.png) |
| 3 | Orta | Muayene başlığı | "Muayene · 2026-1…" diye kesiliyor. Günde 8 hastanın protokol numarası aynı önekle başlıyor, ekranda hangi hasta olduğu ayırt edilemiyor. | Kodu tam (gerekirse ikinci satırda) ya da en azından son 4–6 haneyi gösterin. | Evet (tüm muayene ekranları) |
| 4 | Orta | BBQ roll, `core/protocols.ts` BBQ adımları (45 s, `clinicianMinHoldSec` yok) | Klinikte 6 dk sürüyor. H2 tekrar test olmadan 10,4 dk tuttu. Supine roll + BBQ + tekrar test 15 dakikayı aşıyor. | Epley'deki gibi klinisyen modunda adım başına 30 s (nistagmus sönünce geçiş zaten var). | Evet (gerçek hız ölçümü) |
| 5 | Orta | Bulgu formu, `FindingForm.tsx`, `types.ts:129` | Eksik alanlar: torsiyon/vuruş yönü (iki taraflı DH önerisi "torsiyon yönüne göre taraf belirleyin" diyor, `diagnosis.ts:198-200`, ama bunu girecek alan yok), yorulma, oturunca ters nistagmus (DH 3. adım gözleniyor ama kaydedilmiyor), spontan nistagmus, serbest not (`ClinicExam.notes` tipte var, arayüzde yok), gözlem yöntemi (VNG / Frenzel / çıplak göz). | Bu alanları isteğe bağlı ve katlanır biçimde ekleyin. En azından serbest not ve "gözlem: VNG/Frenzel" seçimi olsun. | Evet (kod + ekran) |
| 6 | Orta | HBYS notu, `Exam.tsx:777-808` | Tüm testler "·" ayraçlı tek uzun satırda. Elle tanıda seçtiğim mekanizma ("kanalolitiazis") notta yok. Önerinin kupulolitiazis olduğu ve benim değiştirdiğim de görünmüyor. Gözlem yöntemi yazmıyor. | Her test ayrı satırda olsun. Elle tanının etiketine mekanizma girsin, "öneri X idi, klinisyen Y" satırı eklensin, "VNG ile değerlendirildi" yazılsın. | Evet (s1/s3 hbys-notu.txt) |
| 7 | Orta | Klinisyen modunda ses, `core/runner.ts:226-228` | Klinisyene yönelik üçüncü şahıs cümleler hastanın alnından yüksek sesle okunuyor ("Nistagmusu gözleyin", "Süre doldu; belirti sürüyor"). Uzun cümle "Pozisyon doğru" sesiyle kesiliyor. | Klinisyen modunda varsayılan olarak yalnız bip ya da çok kısa sözler olsun; muayene ekranında "sesli yönerge" anahtarı bulunsun. | Evet (speech.json) |
| 8 | Düşük | Sensörsüz mod, `Exam.tsx:312,320` | VNG işaretliyken de "Telefonu hastanın alnına yaslayın" yazıyor, düğme "Telefonla yap" diyor. Her adımda elle onay gerekiyor. | VNG modunda metin "Zamanlayıcıyla yap" olsun. Elle onay ilk dokunuşta hem pozisyonu onaylasın hem sayacı başlatsın (şimdiki gibi); yönerge metni buna göre değişsin. | Evet |
| 9 | Düşük | Nistagmus işaretleme | DH sırasında iki elim hastanın başında. Alındaki telefona dokunmak başı oynatıyor, Frenzel kayışıyla da çakışıyor. Pratikte VNG'nin ölçtüğü sayıyı forma yazıyorum. | Formda "işaretlemedim, VNG değerini gireceğim" yolu olsun (zaten elle yazılabiliyor). Bunu kılavuzda belirtin. Telefonu alna koymadan zamanlayıcı modu varsayılan olsun. | Kısmen (tasarım değerlendirmesi) |
| 10 | Düşük | Reçete sekmesi | "Reçete oluştur"dan sonra QR ekranın altında kalıyor, hastaya göstermek için kaydırmak gerekiyor. | Oluşturunca QR'a kaydırın. | Evet (s1/20) |
| 11 | Düşük | Kalibrasyon ekranında geri tuşu | Muayeneden çıkıp listeye dönüyor (veri kaybı yok). | Geri tuşu muayenenin Testler sekmesine dönsün. | Evet |
| 12 | Düşük | Yazdır/PDF | A4'te 2 sayfa. Reçete, QR ve imza 2. sayfaya düşüyor. | Tablolar daraltılsın, imza ilk sayfada kalsın. | Evet (h1-yazdir.pdf) |

**Bilimsel doğruluk:** Gözden geçirdiğim kurallarda yanlış görmedim. Kontrol ettiklerim şunlar:
- Arka kanal deseni ve <1 dk / ≥1 dk ayrımı (von Brevern ve ark., Bárány 2015, J Vestib Res 25:105).
- Yatay kanal taraf kuralları (geotropikte şiddetli, apogeotropikte zayıf taraf; Bárány 2015, AAO-HNSF 2017).
- Supine roll'da baş ~30° fleksiyon (AAO-HNSF 2017).
- Gufoni-geo: sağlam yana yatış, 1 dk, sonra 2 dk burun yere (Kim 2012). Gufoni-apo burun-yukarı varyantı (Appiani 2005; Kim, Neurology 2012).
- Semont'ta baş sağlam tarafa 45° (AAO-HNSF 2017).
- Ön kanal ve arka kanal kupulolitiazisinin "gelişmekte olan" tanı sayılması (Bárány 2015).
- H81.1 kodu.

Tek tutarsızlık 5. satırdaki: uygulama taraf için torsiyon yönünü kullanmamı istiyor ama bunu kaydedecek alan yok.

## 4. Sevdiklerim
1. **Otomatik gecikme ve süre:** İşaretlerimden doğru doldu (4/18 s, sensörsüzde 1/75 s). Tip seçilmeden Kaydet kapalı. Bulgu
   değişince tanı ve reçete geçersiz sayılıyor.
2. **Tanı uyarıları ve kilitler:** DH'de yatay nistagmus görülünce "roll yap" diyor. ≥1 dk yanıtta santral uyarısı veriyor. Çok kanallıda
   reçete kilitleniyor. Uyarı varsa hiçbir öneri "tipik" sayılmıyor ve onay düğmesi turuncu.
3. **Akış ve not:** "Sıradaki: …" düğmesi ve üstte "Gözlemi bitir" var. Geri tuşu testi kapatmıyor, duraklatıyor. HBYS notu tek
   dokunuşla kopyalanıyor (ICD önerisiyle). Reçete QR'ı tek dokunuşla çıkıyor.

## 5. Memnuniyet: **7/10**
Tipik arka kanal hastası 15 dakikaya rahatça sığıyor ve tanı kuralları sağlam. Ancak elle tanıyla kupulolitiazis kilidinin aşılması,
önceden seçili "Yok" ve kesik hasta kodu düzelmeden klinikte günlük kullanıma geçmem. Yatay kanal hastalarında BBQ süresi de beni
zaman aşımına sokuyor. Meslektaşıma "arka kanal hastaları için deneyin" derim.
