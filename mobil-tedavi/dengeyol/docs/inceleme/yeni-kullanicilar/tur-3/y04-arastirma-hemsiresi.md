# y04 — Selin, klinik araştırma hemşiresi (tur 3)

## 1. Ben kimim, ne yapmaya çalıştım
34 yaşındayım, DengeYol çalışmasının koordinatör hemşiresiyim. Önce `tur-2/00-SENTEZ.md` dosyasını okudum, sonra son sürümü
baştan sona yeniden kullandım:
- **Kurulum:** reçetesiz kurulumda katılımcı numarasını kurulum ekranında girdim, Ayarlar'da "belirti şiddetini sor" seçeneğini açtım.
  Klinisyen reçetesiyle QR kurulumunu da yaptım.
- **Katılımcılar:** aynı dört kişi (P1 tanılı-reçeteli, P2 tanısız iki taraf +, P3 uyarıyı aşan, P4 kırmızı bayrak + devam),
  bu kez belirti şiddeti (VAS) yanıtlarıyla.
- **Klinisyen tarafı:** dört ev raporunu aldım, HBYS notunu kopyaladım, CSV'yi indirip sütunlarını inceledim.

Ortam: iPhone 13 öykünümü, Demo modu ×20, sahte ses motoru (cümleler zamanlı kayıtlı).

## 2. Akış günlüğü (⚠ = duraksadım)
**Kurulum**
- Reçetesiz: karşılama → "Hastayım" → onam ekranındaki katlanır "Çalışma katılımcı no (isteğe bağlı)" kutusu (+2 dokunuş)
  → onay → "Başla": **5 dokunuş**. Numara Ayarlar'da da görünüyor. "Belirti şiddetini sor" seçeneği Ayarlar'da tek kutu (+2).
- Reçeteyle: klinisyen 9 dokunuş, katılımcı 3 dokunuş. Klinisyen ekranındaki süre metni artık tek cümle: "3 gün, günde en çok
  3 manevra. Reçete 14.11.2026 tarihine kadar (dahil) geçerli."
  ⚠1 Katılımcının reçete kartında hâlâ iki süre yan yana: "en fazla 3 gün" ve "Geçerlilik … (14 gün)". "Gün sayısı" yine 3 seçili geliyor.
- Gerçek kurulum süresi (iPhone ana ekran adımıyla) tahminen ~4 dk. 5 dakikaya rahat sığıyor.

**Katılımcılar** ("Başım dönüyor"dan manevra başlayana dek dokunuş; VAS sorusu +1 dokunuş getiriyor)
| Katılımcı | Akış | Dokunuş | VAS önce/sonra |
|---|---|---|---|
| P1 | güvenlik → VAS → "muayeneden beri geçmedi" → hazırlık → tanıtma → sağ Epley | 6 | 6 / 2 |
| P2 | VAS → alt tip → iki test → **Karar: tek büyük "1 Devam et: sol taraf"** (diğerleri katlı) → Epley | 8 | 8 / 3 |
| P3 | boyun uyarısı → VAS → test → Epley'de 2 dk+ "Devam et" → aynı gün 2. Epley | 9 (+3) | 9 / geçti |
| P4 | "çift görme" → "doğru mu?" → 112 uyarısı → VAS → supine roll → BBQ roll | 10 | 5 / 5 |
- VAS ekranı kısa (128 kr). Sesi "Sıfır yok, on en kötü. Bir sayıya dokunun ya da Geç'e basın" diyor; "Geç" var.
  Yürütücü başlıkları artık gündelik dilde ("Oturun, başınızı sağa çevirin"). Güvenlik listesinin ilk sesi kısa (318–338 kr).
- P2: önerilen seçeneği seçmek artık aşma sayılmıyor. Kayıtta "kullanıcının seçimi: Uygulamanın önerisi seçildi — sol taraf"
  (USER_CHOICE) bilgi satırı olarak duruyor, "Uyarıya rağmen devam: yok".
- ⚠2 P3'te iki manevra yapıldı ve VAS "sonra" iki kez soruldu. Kayıtta atak başına tek alan var (`Episode.vas.after`):
  ikinci yanıt birincinin üzerine yazılır (kodda `vas[when] = v`). Hangi manevranın sonrası olduğu bilinmiyor.

**Hasta raporu:** "Kayıt: 0.1.0 · k1 · DEMO MODU", katılımcı no, doğru test ve manevra adları ve üç grup araştırma kaydı duruyor.
⚠3 Belirti şiddeti hasta raporunda (atak ve dönem raporu) yok, yalnız klinisyende ve CSV'de görünüyor.

**Kontrol muayenesi**
- QR açılınca P4'ün ilk satırı: "Kırmızı bayrak aşıldı: çift görme… işaretlendi, uyarıya rağmen devam edildi (demo kaydı)".
  Öneri satırı: "Bu rapor demo… Kayıt gerçek olsaydı öneri: önce nörolojik değerlendirme yapın…". Her atakta
  "Belirti şiddeti (0–10): başta 8, manevradan sonra 3" yazıyor. Reçeteli P1 1 dokunuşla, diğerleri ~4 işlemle eklendi.
- HBYS notundaki tek satır kırmızı bayrakla başlıyor, aşma sayısı ve türleri, katılımcı no, demo ve sürüm var.
- "Son muayeneler": "DY-003 · tanı girilmedi · 0 manevra · **ev: 2 manevra, 3 aşma**". Aradığım buydu.
- **CSV** (tek dokunuş, 28 satır): `bas_donmesi; gecikme_s; sure_s; adim; adim_toplam; tamamlandi; durma_nedeni; sonrasi;
  en_uzun_bas_donmesi_s; vas_once; vas_sonra; karar; demo; surum` ayrı sütunlarda, zaman ISO 8601 ve saat dilimiyle.
  Taraf testi her taraf için ayrı satır (P2: sağ 23/14 s, sol 25/25 s, karar TREAT_L). P3'ün manevra satırında
  `en_uzun_bas_donmesi_s` 154. Karar gerekçesi tam.
- ⚠4 Zamanlar dakikaya yuvarlanmış (`22:14:00+00:00`). P3'te taraf testi, uygulamanın kararı, manevra ve 2 dk aşımı aynı
  dakikada; CSV'de manevra satırı kararın ve aşmanın önünde. Olay sırası kayboluyor, sıralama sütunu yok.
- Manevra satırında adım düzeyi gecikme yok; yalnız en uzun süre var. Analiz için çoğu zaman yeterli.

**Ölçüm özeti:** kurulum 5 dokunuş (katılımcı no dahil) ve ~4 dk. Manevraya 6–10 dokunuş (VAS dahil). Rapor alma 1–4 işlem.
CSV tek dokunuş. "Ne yapacağımı bilemedim" anı: **2** (VAS iki manevra; CSV sırası). Tur 2'de 5'ti.

## 3. 2. kullanımdaki isteklerim
| # | İstek (tur 2) | Durum | Gözlemim |
|---|---|---|---|
| 1 | CSV'de ayrı sayısal sütunlar, ISO zaman ve saat dilimi | **Karşılandı** | Bütün istediğim sütunlar var. Yeni sorun: dakika çözünürlüğü ve sıra (aşağıda #1) |
| 2 | VAS ve DHI | **Kısmen** | VAS Ayarlar'dan açılıyor, atak başında ve sonrasında soruluyor, klinisyende ve CSV'de var. DHI yok; VAS manevra başına değil |
| 3 | Katılımcı no kurulum ekranında | **Karşılandı** | Katlanır kutu, 2 dokunuş, Ayarlar'la eşleşiyor |
| 4 | Karar gerekçesi kısaltılmadan | **Karşılandı** | P4'ün tam cümlesi klinisyende ve CSV'de |
| 5 | "Son muayeneler" ev sayıları | **Karşılandı** | "ev: 2 manevra, 3 aşma" |
| 6 | JSON'da `stopped: true` | **Karşılanmadı** | P4'te hâlâ true; rapor ve CSV doğru, yalnız ham yedek yanıltıcı |
| 7 | Gün sayısı varsayılanı / tek süre | **Kısmen** | Klinisyen metni tek cümle oldu; katılımcı kartında iki süre var, varsayılan hâlâ 3 |
| 8 | Güvenlik listesi kısalsın | **Kısmen** | İlk ses kısa; ekrandaki liste 1270–1348 kr (klinik ekip kararı) |
| — | Öneri seçimi aşma sayılmasın (sentez M1-3) | **Karşılandı** | USER_CHOICE bilgi satırı; aşma sayısı 0 |

## 4. Kalan / yeni sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Orta | CSV / ev raporu biçimi | Zamanlar dakikaya yuvarlanmış; aynı dakikadaki olayların (test, karar, manevra, aşma) sırası kayboluyor | Atak içinde `sira` (olay sıra no) sütunu; mümkünse saniye | Evet (P3 satırları) |
| 2 | Orta | VAS | Atak başına tek "önce/sonra"; P3'te 2 manevradan sonra iki kez soruldu, tek alan | `vas_sonra` manevra satırına yazılsın (manevra başına), atak satırında yalnız `vas_once` | Kodda üzerine yazma; ekranda iki kez soruldu |
| 3 | Orta | Klinisyen | DHI ya da kontrol muayenesi PROM alanı yok | Muayene ekranında isteğe bağlı DHI toplam puanı; CSV'ye muayene satırı | Evet |
| 4 | Düşük | Hasta raporu | VAS katılımcının kendi raporunda yok | Atak raporunda "Belirti şiddeti: başta 6, sonra 2" satırı | Evet |
| 5 | Düşük | Reçete kartı (hasta) | "en fazla 3 gün" ve "(14 gün)" yan yana; "Gün sayısı" 3 seçili | Klinisyendeki tek cümle karta da gelsin; varsayılan profilden | Evet |
| 6 | Düşük | JSON yedek | Devam edilen kırmızı bayrakta `redFlags.stopped: true` | `stopped: false` ya da `continued: true` | Evet |

## 5. Puanlar
- **Sezgisellik: 9/10** (tur 1: 7, tur 2: 8). Kurulum, rapor alma ve dışa aktarım çok kısa. Karar ekranında tek önerilen
  düğme var, aradığımı klinisyen ekranında ilk satırda buluyorum.
- **Genel memnuniyet (araştırma koordinatörü olarak): 8/10** (tur 1: 4, tur 2: 7). CSV analize hazır; VAS, katılımcı no,
  demo ve sürüm geldi. Olay sırası, manevra başına VAS ve DHI eksik.
- **Kullanır mıyım:** Evet. Çalışmada birincil ev verisi aracı olarak kullanırım. Olay sırasını şimdilik elle denetlerim.

Betikler/görüntüler: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/yeni-kullanicilar/tur-3/y04-arastirma-hemsiresi/`
