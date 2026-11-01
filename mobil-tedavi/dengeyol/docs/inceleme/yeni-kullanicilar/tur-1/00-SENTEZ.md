# Yeni kullanıcı turu 1 — sentez ve düzeltmeler

Puanlar (sezgisellik / memnuniyet): y01 ilk atak gece 6/7 · y02 seksen yaş 5/6 · y07 bulantılı 5/5 · y03 Türkçesi zayıf 5/6 · y04 araştırma hemşiresi 7/4 · y05 acil hekimi 7/5 ·
y06 okumayan genç 6/6 · y08 aile hekimi 7/7.

Ortak bulgular (birden çok kişi): rapor yanlış test/manevra adı yazıyor (y04, y06); talimat pozisyona varınca kesiliyor,
"dokunun" duyulmuyor (y03, y06, y08); uyarılarda dolu renkli düğme "Yine de …" (y03, y05, y06); kurulumda "Başla"
kapalıyken etkin görünüyor (y03, y06); araştırma kaydı yanlış/ham kodlu ve klinisyene ulaşmıyor (y04, y05, y06).

İlke (proje sahibi): kilit yok, cesur karar; ama **önerilen yol her zaman büyük dolu düğme**, aşma ikincil düğme ve kayıt.

## L1 — Yürütücü ve ses (core/runner.ts, ui/screens/patient/RunnerView*, platform/speech.ts)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Yüksek | Pozisyona hızlı varınca adım talimatı kesilmesin: "Baş dönmesi başlarsa ekrana dokunun" adımın başında söylensin; varışta kısa hatırlatma ("Buradasınız. Baş dönerse dokunun.") | y03, y06 |
| 2 | Yüksek | Duraklatma sonrası "Devam et"ten ~1 s içinde baş dönmesi dokunuşu sayılmasın (çift dokunuş sahte kayıt) | y06 |
| 3 | Orta | Klinisyen testinde "Oturuş, baş sağa 45°" adımı hasta zaten oturuyorken "Pozisyon doğru" ile 0,3 s'de kesilmesin; baş çevirme komutu bitsin | y08 |
| 4 | Orta | Güvenlik bekleme ekranında (uzun baş dönmesi) "Durdur" birincil, "Devam et" ikincil | y03, y05 |

## L1 ek (y07)
| 5 | Kritik | Duraklatma ve uzun baş dönmesi uyarısında "Kusacak gibiyseniz başınızı kaldırıp yana dönün ya da oturun." | y07 |
| 7 | Yüksek | Testte hızlı çift dokunuşta baş dönmesi açık kalıyor ve 2 dk sonra yanlış güvenlik duraklatması; açık baş dönmesinde 30 s sonra "Geçtiyse dokunun" hatırlatması | y02 |
| 6 | Yüksek | Uzun baş dönmesi uyarısı ve duraklatmada ekrana bakmadan seçim (2 sn basılı tut = Durdur), sesle anlatılır; "Kendimi kötü hissediyorum" seste de | y07 |

## L2 — Hasta akışı ve ekranlar (EpisodeFlow.tsx, Onboarding.tsx, PatientHome.tsx, flowText.ts, onboardingText.ts, Controls.tsx)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Kritik | Manevra sonrası "Yeni belirti" (inme) seçilip aşılınca olağan "tamamlandı" ekranı, "hafif baş dönmesi normaldir", tekrar testi ve hatırlatıcı gösterilmesin; kalıcı kırmızı 112 şeridi; ana ekranda da | y05 |
| 2 | Yüksek | Bütün uyarılarda güvenli seçenek dolu birincil düğme, "Yine de …" çerçeveli ikincil. Kırmızı bayrakta 112 cümlesi bitene dek (en az 5 s) "Yine de devam et" basılamaz, ses kesilmez; yürütücüye kısa kırmızı hatırlatma | y03, y05, y06 |
| 3 | Orta | Kurulumda "Başla" onay işaretlenmeden soluk; tek onay kutusu ya da açıkça ayrılmış; karşılamada "tanı aldığım" ifadesi "tanınız olmasa da kullanabilirsiniz" | y03, y06 |
| 4 | Orta | Hazırlıkta "Hazırım" ekranın altında sabit görünür; "Tekrar dinle" ikincil | y06 |
| 5 | Orta | Test/manevra başlıkları Türkçe: "Sırtüstü baş çevirme testi", "Yatakta dönme manevrası (BBQ roll)" | y06 |
| 6 | Orta | Güvenlik listesi gündelik dille, maddelere simge; açılış kilidinde seçenekler gri görünmesin (kilit görünmez olsun ya da "dinleyin…" etiketi) ; akışta "daha yavaş konuş" düğmesi | y03 |
| 9 | Yüksek | Güvenlik listesinde işaretlenen madde sesle söylenir; 112 uyarısından önce "Bunu mu işaretlediniz?" (yanlış dokunuş koruması, kilit değil); "Listeyi dinle" üstte | y02 |
| 8 | Yüksek | Test tetiklemeyince karar ekranı tek büyük önerilen düğme ("Hangi yan bilmiyorum → iki tarafa sırayla"); seçimden sonra manevra doğrudan; ikinci "Kim yapıyor" yok. Hazırlıkta ayrıntılar katlanır. Onay "Başla"nın hemen üstünde | y01 |
| 7 | Orta | Test tetiklemediyse tek cümle: "Test baş dönmesi yapmadı; BPPV olmayabilir" + yine de manevra seçeneği | y05 |

## L3 — Kayıt, rapor, araştırma verisi (state/types.ts, state/overrides.ts, reportText.ts, core/reportShare.ts, HomeReportView.tsx, examReport.ts)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Kritik | Atak kaydı ve rapor gerçekte yapılan testi ve manevrayı yazsın (supine roll / BBQ roll; Dix-Hallpike / Epley yalnız yapıldıysa) | y04, y06 |
| 2 | Kritik | Araştırma kaydı klinisyene ulaşsın: ev raporu QR'ı (v3, v1/v2 okunur) aşmaları, kırmızı bayrak "evet"lerini, kontrendikasyonu, uygulama kararını, test türünü, demo modunu taşısın; klinisyende "Araştırma kaydı" bölümü; HBYS notunda aşma sayısı | y04, y05 |
| 3 | Yüksek | Uygulamanın kararları ile kullanıcının aştığı uyarılar ayrı listelensin; uyarı gösterilmeyen yerde "uyarıya rağmen" yazılmasın; tekrar eden aynı karar tek satır; manevraya girilmeden vazgeçilen tekrar aşma sayılmasın | y04, y06 |
| 4 | Yüksek | "DURDURULDU" yerine devam edilen bayrakta "işaretlendi, devam edildi"; ham kimlikler (neuro, neuroWeak, early-retest) Türkçe | y04, y05, y06 |
| 5 | Orta | Demo modu ve uygulama/algoritma sürümü her atağa ve rapora yazılsın | y04 |
| 6 | Orta | Reçetesiz kurulumda isteğe bağlı çalışma katılımcı numarası; ev raporunda taşınsın | y04 |
| 7 | Orta | Klinisyende katılımcı başına satır satır CSV dışa aktarım (atak, test, manevra, aşma); isteğe bağlı VAS (0–10) atak öncesi/sonrası | y04 |
| 9 | Yüksek | Karar ekranında seçilen taraf kayda "taraf seçilmedi" diye geçiyor; uygulama kapanınca yarım manevra kayda "yarıda kaldı (adım n)" yazılsın | y01 |
| 8 | Orta | Ev raporu varsayılan olarak yeni bir kontrol muayenesine eklensin; açılınca tek cümle klinik öneri | y08 |

## L4 — Klinisyen (Exam.tsx, FindingForm.tsx, core/prescription.ts, core/diagnosis.ts, examReport.ts)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Yüksek | Yatay kanal tanısında da ev reçetesi: reçete biçimi yatay kanal + BBQ roll (Gufoni isteğe bağlı) taşısın; hasta reçeteyle BBQ roll yapar; eski biçim okunur | y08, proje sahibi ilkesi |
| 2 | Yüksek | Santral örüntüde (saf aşağı vuran, atipik, ≥1 dk) Tedavi ve Reçete uyarısı bulguyu adıyla söylesin; gerekçe en az 10 karakter; hastanın QR kartında "Hekim uyarıya rağmen verdi" satırı | y05 |
| 3 | Orta | Tipik pozitif arka kanal bulgusundan sonra "Sıradaki: Tanı" (supine roll değil) | y08 |
| 4 | Orta | Bulgu formunda kısa "nasıl görünür" yardımı, "Emin değilim, baş dönmesi var" seçeneği; kanalolitiazis/kupulolitiazis açıklaması; supine roll formunda "Şiddet" açıklaması ve "Kaydet" neden kapalı | y08 |
| 5 | Orta | Reçete ekranında iPhone için "Önce Ana Ekrana Ekle, sonra bağlantıyı açın" talimatı | y04, y08 |
| 6 | Düşük | Aynı oturumda kalibrasyon yeni muayenede yeniden kullanılabilsin ("Önceki kalibrasyonu kullan") | y05 |

## L5 — Kötü an sonrası durum (L2 birleşince; PatientHome.tsx, EpisodeFlow.tsx)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Yüksek | Kusma bildiriminden sonra ana ekran doğru: "Bugün kusma bildirdiniz; manevra yok, sabah kısa test"; yanlış "son testte baş dönmesi gelmedi" ve "3/3 manevra" kalkar; tek tutarlı sabah saati; yeniden deneme uyarısının gerekçesi kusma, kayıt türü ayrı (`VOMITING`), `DOSE:DAILY_LIMIT` değil | y07 |
| 2 | Yüksek | "Kendimi kötü hissediyorum" ile durduktan ve "Durdur"dan sonra ana ekranda not; yeniden başlarken "Kusma/kötü hissetme geçti mi?" | y07 |
| 3 | Orta | Atak sırasında uygulamadan çıkıp dönünce yapılmış taraf testi kaybolmasın; manevra yarıda kaldıysa hazırlık baştan gelmesin, "kaldığınız yerden" | y07, y01 |
| 4 | Orta | Hazırlıktaki "Hazırım" ve kalibrasyondaki "Başla" için ekranın her yerine dokunmak yeterli (telefon alında); güvenlik listesinin sesli kısa okunuşu, kusma maddesi gündelik dille | y07 |
| 5 | Kritik | Karşılamada "Klinisyenim"e yanlış dokunuş klinisyen modunu kalıcı açıyor: "Hekim misiniz? Evet / Hayır, hastayım" onayı; klinisyen ana ekranında büyük "Hasta moduna dön" | y02 |
| 6 | Yüksek | Telefon alna konana kadar her ekran kısaca konuşsun (karşılama, kurulum, telefonu tanıtma girişi); "onay kutusu" yerine gündelik söz | y02 |
| 7 | Orta | Bilinen hekim tanısı tarafı (ör. "sağ kulak") ana ekranda/atak başında kolayca girilebilsin; girilince yalnız o taraf test edilir | y02 |
