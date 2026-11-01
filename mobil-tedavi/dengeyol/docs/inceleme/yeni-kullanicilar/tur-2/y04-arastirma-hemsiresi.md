# y04 — Selin, klinik araştırma hemşiresi (tur 2)

## 1. Ben kimim, ne yapmaya çalıştım
34 yaşındayım, DengeYol çalışmasının koordinatör hemşiresiyim. Yeni sürümü baştan sona yeniden kullandım: iki kurulum
(reçetesiz katılımcı, ardından Ayarlar'dan katılımcı numarası; klinisyen reçetesiyle QR kurulum) ve tur 1'deki dört katılımcı
(P1 tanılı-reçeteli, P2 tanısız iki taraf +, P3 uyarıyı aşan, P4 kırmızı bayrak + devam). Kontrol muayenesinde dördünün
ev raporunu (v3) klinisyen modunda aldım, HBYS notunu kopyaladım ve çalışma CSV'sini indirdim. Ortam: iPhone 13 öykünümü,
Demo modu ×20, cümleler zamanlı kaydeden sahte ses motoru. Önce `tur-1/00-SENTEZ.md` dosyasını okudum.

## 2. Akış günlüğü (⚠ = duraksadım)
**Kurulum**
- Reçetesiz: karşılama ("Hekim tanınız olmasa da kullanabilirsiniz") → "Hastayım" → onam → "Başla": **3 dokunuş**.
  "Başla" onay işaretlenmeden soluk ve basılamıyor. Katılımcı no için Ayarlar → "Klinik çalışma" → alan: **+2 dokunuş**.
  ⚠1 Numara alanı kurulum ekranında yok, Ayarlar'da. Ben bilerek girdim; katılımcı kendi başına kurarsa unutulur.
- Reçeteyle: klinisyen 9 dokunuş (kanal seçimi eklendi, gerekçe en az 10 karakter). Reçete ekranında artık "Hastaya söyleyin
  (iPhone): önce Ana Ekrana Ekle, sonra bağlantıyı açın" adımları var. Katılımcı tarafında **3 dokunuş**.
  Katılımcının kartında "Hekim uyarıya rağmen verdi" satırı da görünüyor. Gerçek süre (ana ekran adımıyla) tahminen **~4 dk**.
- ⚠2 Reçetede "Gün sayısı" hâlâ 3 seçili geliyor, geçerlilik 14 gün.

**Katılımcılar** ("Başım dönüyor"dan manevra başlayana dek dokunuş)
| Katılımcı | Akış | Dokunuş | Tur 1 |
|---|---|---|---|
| P1 | güvenlik → "muayeneden beri geçmedi" → hazırlık → tanıtma → sağ Epley | 5 | 5 |
| P2 | alt tip → iki test → Karar (5 seçenek) → **"Başlat" ekranı yok**, sol Epley hemen başladı | 7 | 8 |
| P3 | boyun uyarısı → test → Epley'de 2 dk+ baş dönmesi "Devam et" → aynı gün 2. Epley | 8 (+2) | 8 (+3) |
| P4 | "çift görme" → **"doğru mu?" onayı** → 112 uyarısı (cümle bitene dek "Yine de" basılamaz) → supine roll → BBQ roll | 9 | 8 |
- Ses: P1 45 cümle/2042 kr, P2 78/3589, P4 92/3915, P3 (2 manevra) 119/6083. Ses ile ekran uyumlu.
  Güvenlik listesi 1270–1348 kr ile tur 1'den daha uzun (≈1100'dü).
- P3: "Devam et"e bastıktan 0,3 s sonra baş dönmesini bitirmek için yaptığım dokunuş sayılmadı (çift dokunuş koruması).
  Uyarı ikinci kez geldi. Doğru davranış ama bilmeyen kişi şaşırabilir. 1,6 s sonra dokununca sorun olmadı.

**Hasta raporu:** "Kayıt: DengeYol 0.1.0 · karar kuralları k1 · DEMO MODU" satırı ve "Çalışma katılımcı no: DY-004" var.
P4 için doğru yazıyor: "Sırtüstü baş çevirme testi (supine roll)", "Başı sağa çevirince…", "Manevra: BBQ roll (yatakta dönme
manevrası)" ve "işaretlendi, uyarı gösterildi, devam edildi ('doğru mu?' sorusunda onaylandı)". Araştırma kaydı üç grupta:
"Uyarıya rağmen devam (N)", "Uygulamanın kararları", "Seçimler ve bilgi kayıtları". Ham kod yok, "1. saat tekrar testi"
Türkçe yazılmış.

**Kontrol muayenesi**
- QR açılınca: rapordaki "Çalışma katılımcı no" görünüyor ve "Yeni hasta kaydı (kod DY-00x)" kendiliğinden seçili geliyor.
  Reçeteli P1 1 dokunuşla, diğerleri doğrulayıp eklemeyle ~4 işlemde eklendi. Varsayılan "Yeni kontrol muayenesi aç".
- **Araştırma kaydı bölümü** ekranda: sürüm, demo, kontrendikasyon, işaretli güvenlik sorusu, aşma sayısı ve listesi,
  uygulama kararları. P4'ün kırmızı bayrağı artık açıkça görünüyor. Üstte "Öneri: demo modunda üretildi" uyarısı var.
- HBYS notunda tek satırda "uyarıya rağmen devam: 3 (kontrendikasyon, 2 dakikayı aşan baş dönmesi, tekrar testi beklenmeden
  manevra); kontrendikasyon: Boyun sorunu; uygulama kararı: 1; DEMO MODU; katılımcı no DY-003; sürüm" yazıyor. Yeterli.
- **CSV**: tek dokunuş, 85 ms, 25 satır. Sütunlar: katılımcı no, kod, olay (atak/test/manevra/aşma/uygulama kararı/bilgi/
  güvenlik sorusu), kod, taraf, ayrıntı, demo, sürüm. Excel için `;` ayırıcılı.
- ⚠3 CSV'de gecikme ve süre yalnız serbest metinde ("gecikme 12 s, süre 13 s"). Manevra satırında adım düzeyi baş dönmesi yok:
  P3'ün 153 s'lik baş dönmesi yalnız aşma satırının metninde geçiyor. Zaman dilimi yok. Analiz için sütunları elle ayıklamam gerekiyor.
- ⚠4 Klinisyen ekranında P4'ün karar gerekçesi kısaltılmış ("…geotropik varsayım)." sonrası yok); CSV'de de öyle, hasta
  raporunda tam.
- ⚠5 Klinisyen "Son muayeneler" listesinde ev dönemi eklenen muayene "0 manevra" diyor, oysa evde 2 manevra yapılmış.

**Ölçüm özeti:** kurulum 3 dokunuş (+2 katılımcı no), manevraya 5–9 dokunuş, rapor alma 1–4 işlem, CSV 1 dokunuş.
"Ne yapacağımı bilemedim" anı: **5** (tur 1'de 6), hiçbiri işimi durdurmadı.

## 3. 1. kullanımdaki isteklerim
| # | İstek (tur 1) | Durum | Gözlemim |
|---|---|---|---|
| 1 | Araştırma kaydı klinisyene ve HBYS'ye | **Karşılandı** | QR v3'te aşmalar, kırmızı bayrak, kontrendikasyon ve kararlar var; HBYS notunda sayılar var |
| 2 | Gerçek test/manevra adı | **Karşılandı** | supine roll, BBQ roll ve Dix-Hallpike hem hasta raporunda, hem klinisyende, hem CSV'de doğru |
| 3 | "DURDURULDU" → devam edildi | **Karşılandı** | Raporda ve CSV'de "işaretlendi_devam". (JSON yedekte `stopped: true` duruyor, aşağıda #6) |
| 4 | Ham kodlar Türkçe | **Karşılandı** | "çift görme, konuşma ya da yutma bozukluğu", "1. saat tekrar testi" |
| 5 | Karar ile aşma ayrı, tekrar yok | **Karşılandı** | Üç ayrı grup; P2'de karar bir satır, yönlendirme aşması bir satır |
| 6 | Demo ve sürüm damgası | **Karşılandı** | Rapor, QR, HBYS ve CSV'de "0.1.0/k1", demo=evet |
| 7 | Reçetesizde katılımcı no | **Karşılandı** (kısmen yerinde) | Ayarlar'da var, rapora ve QR'a giriyor, klinisyende eşleşiyor; kurulum ekranında yok |
| 8 | CSV dışa aktarım | **Kısmen** | Var ve kullanışlı; sayısal alanlar ayrı sütunda değil, adım düzeyi veri yok |
| 9 | VAS/DHI | **Karşılanmadı** | Hiçbir yerde şiddet ölçeği yok |
| 10 | iPhone kurulumu | **Kısmen** | Klinisyen ekranında adım adım talimat var; katılımcıda "panodaki reçeteyi yükle" yok |
| 11 | P2 karar akışı | **Kısmen** | "Başlat" ekranı kalktı. Hâlâ telefon alından iniyor, 5 seçenekli ekran geliyor, "hangisi şiddetli" sorulmuyor |
| 12 | Gün sayısı varsayılanı | **Karşılanmadı** | Hâlâ 3 |
| 13 | BBQ başında yanlış taraf uyarısı | Görülmedi | Bu turda çıkmadı |

## 4. Kalan sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Orta | CSV | Gecikme, süre, adım, tamamlanma ve sonrası yalnız `ayrinti` metninde; manevra satırında adım düzeyi baş dönmesi yok (P3'ün 153 s'si); zaman dilimi yok | Ayrı sütunlar: `gecikme_s`, `sure_s`, `adim`, `tamamlandi`, `durma_nedeni`, `sonrasi`, `en_uzun_bas_donmesi_s`; zaman ISO 8601 + saat dilimi | Evet |
| 2 | Orta | Araştırma alanları | Belirti şiddeti ölçeği yok | Atak başında ve manevradan sonra isteğe bağlı 0–10 sorusu; klinisyende DHI alanı; ikisi CSV'ye | Evet |
| 3 | Orta | Katılımcı no | Yalnız Ayarlar'da, katılımcı kendi kurarsa boş kalır | Kurulum ekranında isteğe bağlı alan ya da klinisyenin verdiği "çalışma QR"ı ile kendiliğinden dolsun | Evet |
| 4 | Düşük | Klinisyen, uygulama kararı | Gerekçe klinisyen ekranında ve CSV'de kısaltılmış | Hasta raporundaki tam cümle aktarılsın | Evet |
| 5 | Düşük | Klinisyen listesi | Ev dönemi eklenen muayene "0 manevra" diyor | "ev: 2 manevra, 3 aşma" yazsın | Evet |
| 6 | Düşük | JSON yedek | Devam edilen kırmızı bayrakta `redFlags.stopped: true` kalıyor | Ham veride de `continued` alanı ya da `stopped: false` olsun | Evet |
| 7 | Düşük | Reçete formu | "Gün sayısı" 3 seçili geliyor | Profilde çalışma protokolüne göre varsayılan ayarlanabilsin | Evet |
| 8 | Düşük | Güvenlik listesi | Metin 1270–1348 kr ile tur 1'den uzun | Maddeleri kısaltın; ayrıntı katlanır olsun | Evet |

## 5. Puanlar
- **Sezgisellik: 8/10** (tur 1: 7). Kurulum aynı kısalıkta, Başlat ekranı kalktı. Klinisyen tarafında aradığım her şey tek
  ekranda ve HBYS notunda.
- **Genel memnuniyet (araştırma koordinatörü olarak): 7/10** (tur 1: 4). Aşmalar, kararlar, demo ve sürüm artık
  klinisyene ulaşıyor ve CSV'ye giriyor. Analiz için sayısal sütunlar ve şiddet ölçeği eksik.
- **Kullanır mıyım:** Evet, pilot çalışmada veri toplama aracı olarak kullanırım. CSV'yi şimdilik elle ayıklarım.

Betikler/görüntüler: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/yeni-kullanicilar/tur-2/y04-arastirma-hemsiresi/`
