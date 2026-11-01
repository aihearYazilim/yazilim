# y05 — Dr. Emre, acil tıp uzmanı (tur-3)

**Ben kimim:** 41 yaşında acil tıp uzmanıyım, gece vardiyasındayım. Üçüncü kez geldim ve son derlemeyi baştan sona kullandım:
- **Klinisyen:** muayene başı kontrol, DH, tanı, Epley, QR; santral örüntü; "nörolojik bulgu VAR" olan hasta.
- **Hasta:** reçeteli taburculuk; tanısız + inme belirtisi; yürütücüdeki 112 hatırlatması; yeni belirtiden sonra yeniden
  başlatma; test tetiklemedi.
- **Ev raporu:** klinisyende açılış.

Cihaz iPhone 13 öykünümü, demo sensör, sahte ses kaydı. Betikler: scratchpad `yeni-kullanicilar/tur-3/y05-acil-hekimi/`.

## Akış günlüğü
1. **Karşılama:** "Klinisyenim" → "Hekim misiniz?" onayı → profil. Değişiklik yok, sorunsuz.
2. **Muayene açılışı:** Testlerin üstünde **"Teste başlamadan — Üç kısa kontrol"** var: spontan nistagmus, nörolojik bulgu,
   boyun; her biri Yok/Var, bir de "Üçü de yok". "Uyarıdır; testleri engellemez" yazıyor. Kontrolü atlayıp doğrudan "Telefonla
   yap"a bastım; engellemedi, doğru.
   "Telefon alında nasıl durur, işareti nasıl koyarım?" yardımı kısa ve işe yarar: bant, parmak boğumuyla dokunma, işaret
   konamazsa elle yazma.
3. **Hızlı akış (×1):** kalibrasyon 28 sn → sağ DH ("Gözlemi bitir") → sol DH elle → "Sıradaki: Tanı" → onay. Onaydan sonra
   artık **"Onaylandı ✓ / Geri al"** görünüyor. Sonra Epley, Reçete ("Testsiz kısa yol nedir?" yardımı açılıyor; süre tek
   cümle: "3 gün, günde en çok 3. Reçete 14.11 dahil geçerli") ve QR.
   **Yeni muayeneden onaylı tanıya 80 sn / 18 dokunuş; QR ~245 sn.** İkinci hastada "Önceki kalibrasyonu kullan" geliyor.
4. **"Nörolojik bulgu VAR" + "Spontan nistagmus VAR":**
   - Testler sekmesinde kırmızı uyarı çıkıyor: "santral neden düşünün; acil nörolojik değerlendirme… HINTS…". İçerik iyi.
   - Sağ DH'ye tipik bulgu girdim. **Tanı sekmesi "Sağ arka kanal BPPV — tipik" öneriyor; kontrolden tek söz yok.**
   - Tedavi sekmesinde uyarı yok.
   - **Reçete uyarısız ve gerekçesiz çıktı;** hasta kartında düz "SAĞ kulak — BPPV" var, "hekim uyarıya rağmen" satırı yok.
   - Kontrolün yanıtı yalnız rapora ve HBYS notuna geçiyor ("nörolojik bulgu VAR").
   - ⚠ *Duraksama 1:* "Bu kontrol neye yaradı?" Tur-1'de santral nistagmusta yaşadığım sorun burada tekrar ediyor: uyarı tek
     sekmede kalıyor, işi yaptığım Tanı/Tedavi/Reçete sekmelerine taşınmıyor.
5. **Santral örüntü** (iki DH'de saf aşağı vuran): tur-2'deki gibi doğru davranıyor:
   - Tedavi ve Reçete uyarısı bulguyu adıyla söylüyor.
   - Gerekçe en az 10 karakter.
   - Hasta kartında "Hekim uyarıya rağmen verdi…" satırı var.

   Kartın tanı satırı ise hâlâ düz "BPPV".
6. **Hasta, reçeteli taburculuk (×1):** "Başım dönüyor"dan manevraya **39 sn, 6 dokunuş**. Kurulumda "Başla", onay
   işaretlenmeden soluk ve kapalı.
7. **Tanısız hasta + inme belirtisi:**
   - "doğru mu?" onayı → Acil uyarı. "Yine de devam et" çerçeveli ve sayaçlı (≈6 sn kapalı).
   - **Yürütücüde hatırlatma bu kez sonuna dek okundu** (7,6 sn, kesilmedi). Ardından gelen adım komutu bekledi.
   - **Yürütücü başlığının altında kırmızı "Acil belirti bildirdiniz: kötüleşirse durun ve 112'yi arayın"** satırı test
     boyunca görünüyor. Zincir karar ekranında da var.
8. **Manevra sonrası "Yeni belirti var" → aşıldı:**
   - "Yeni belirti bildirdiniz: 112'yi arayın" ekranı geliyor; "normaldir", tekrar testi ve hatırlatıcı yok.
   - Ana ekranda kırmızı şerit var: "Tekrar testi şimdilik önerilmiyor".
   - **Yeniden "Başım dönüyor": "Yeni belirti bildirdiniz: manevra önerilmiyor … önce 112 / hekim".** Dolu birincil düğme
     "Ana ekran (manevra yok)"; "Yine de manevra yap" çerçeveli. Tam istediğim gibi; çelişki kalktı.
9. **Ev raporu klinisyende:** ilk satır "**Manevra sonrası yeni nörolojik belirti bildirildi; 112 uyarısına yanıt yok ·
   Kırmızı bayrak aşıldı: yüzde/kolda güçsüzlük…**". Öneri satırı da demo kaydında bile klinik öneri veriyor: "santral neden
   dışlanmadan manevra önermeyin". Çok iyi.
10. **Test tetiklemedi:**
    - İki taraf negatifse tek büyük önerilen düğme "iki tarafa sırayla", diğerleri "Başka seçenekler (4)" altında. Ses "Önerim: …".
    - Hekim tanısı "sol kulak" iken test negatifse önerilen düğme "**Sağ tarafı da test et**"; körlemesine manevra yok.
    - Ana ekrandaki kulak seçimi artık "Doktorum tanı koydu"nun arkasında ve "Sol kulak dediniz, doğru mu?" onayı istiyor.
11. **Ses:**
    - "…baş ağrısı.." çift nokta hâlâ duruyor.
    - Klinisyende "Kalibrasyon tamam" 0,3 sn'de "Başlıyoruz" ile kesiliyor.
    - HBYS notunda eski "testsiz kısa yol yalnız muayene edilen baş dönmesi sürerken" cümlesi duruyor. ⚠ *Duraksama 2.*

**Ölçümler:**
- Klinisyen: onaylı tanıya 80 sn / 18 dokunuş; QR ~245 sn (Epley ~150 sn).
- Hasta: reçeteli 39 sn / 6 dokunuş.
- "Ne yapacağımı bilemedim" anı: **2** (tur-2'de 4, tur-1'de 6).
- Konsol hatası yok.

## 2. kullanımdaki isteklerim
- **#1** yürütücüde 112 hatırlatması: **karşılandı.** Ses kesilmiyor; başlığın altında kalıcı kırmızı satır var.
- **#2** yeni belirtiden sonra yeniden başlatma: **karşılandı.** "Manevra önerilmiyor"; önerilen yol dolu düğme, manevra ikincil.
- **#3** ev raporunun ilk satırı: **karşılandı.** Demo kaydında da klinik öneri veriyor.
- **#4** santral/periferik hızlı kontrol: **kısmen.** 3 maddelik kontrol ve uyarı var. Ama "VAR" yanıtı tanı önerisine,
  Tedavi'ye, Reçete'ye ve hasta kartına hiç yansımıyor.
- **#5** hasta kartında "Olası BPPV": **karşılanmadı.** Santral uyarılı kartın tanı satırı hâlâ düz "BPPV".
- **#6** "Testsiz kısa yol" cümlesi: **karşılandı.** Reçete ekranında yardım var, süre tek cümle; yalnız HBYS notunda eski
  cümle duruyor.
- **#7** onaydan sonra "Onaylandı ✓": **karşılandı.**
- **#8** ses temizliği: **karşılanmadı.** ".." ve "Kalibrasyon tamam" kesilmesi aynı.

## Sorunlar (yeni ya da kalan)
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Yüksek | Muayene başı kontrol → Tanı / Tedavi / Reçete / hasta kartı | "Nörolojik bulgu VAR" ve "spontan nistagmus VAR" iken tanı "tipik BPPV" öneriyor; Tedavi ve Reçete'de uyarı yok; reçete gerekçesiz çıkıyor; hasta kartı düz BPPV | Kontrolde "Var" varsa santral örüntüdeki gibi davransın: Tanı ve Tedavi'de kırmızı satır, Reçete'de "ev reçetesi önerilmiyor" + ≥10 karakter gerekçe, hasta kartında "Hekim uyarıya rağmen verdi: muayenede nörolojik bulgu" satırı | Evet (c3) |
| 2 | Düşük | Hastanın reçete kartı (santral ya da nörolojik uyarılı) | Tanı satırı düz "arka kanal kristal oynaması (BPPV)" | "Olası BPPV (hekim uyarısıyla)" | Evet (c2) |
| 3 | Düşük | HBYS notu | "testsiz kısa yol yalnız muayene edilen baş dönmesi sürerken" eski cümlesi | Reçete ekranındaki yeni tek cümleyle aynı olsun ya da notta hiç yer almasın | Evet (c3) |
| 4 | Düşük | Ses | "baş ağrısı.." çift nokta; klinisyende "Kalibrasyon tamam" 0,3 sn'de kesiliyor | Metin birleştirmeyi düzelt; kısa onay cümlesi bitsin | Evet |
| 5 | Düşük | Muayene başı kontrol kartı | Yanıtlanmazsa test bittikten sonra da Testler listesinin üstünde tam boy kalıyor | Bir test yapıldıktan sonra tek satıra küçülsün ("Kontrol yanıtlanmadı — aç") | Evet (c1) |

## Puanlar
- **Sezgisellik: 9/10** (tur-1: 7, tur-2: 8). Klinisyen akışında takılmadım: kontrol kartı, tutuş yardımı, "Sıradaki: Tanı",
  "Onaylandı ✓", kısa yol yardımı ve kalibrasyonu yeniden kullanma birlikte işliyor. Hasta tarafındaki her uyarı ekranında
  önerilen yol belli.
- **Genel memnuniyet: 8/10** (tur-1: 5, tur-2: 7). İnme belirtisiyle ilgili istediğim her şey yapılmış: aşma zor, yürütücüde
  hatırlatma var, yeniden başlatmada manevra önerilmiyor, ev raporunun ilk satırı alarmı söylüyor. Puanı düşüren tek şey
  1. madde: yeni güvenlik kontrolünün "Var" yanıtı reçeteye ve hasta kartına ulaşmıyor.
- **Bir yakınıma önerir miyim / kullanır mıyım:** Klinisyen modunu acilde her BPPV şüphesinde kullanırım. Reçeteli ya da
  tanılı hastama taburculukta öneririm. Tanısız hastaya da, uyarıları artık güvenilir olduğu için, "hekime görün" notuyla
  öneririm.
