# Yeni kullanıcı turu 2 — sentez ve düzeltmeler

Puanlar (sezgisellik / memnuniyet, tur 1 → tur 2): y01 6/7 → **8/8** · y02 5/6 → **7/7** · y03 5/6 → **7/8** ·
y04 7/4 → **8/7** · y05 7/5 → **8/7** · y06 6/6 → **8/8** · y07 5/5 → **7/7** · y08 7/7 → **8/8**.
Ortalama sezgisellik 6,0 → **7,6**, memnuniyet 5,75 → **7,5**. "Ne yapacağımı bilemedim" anları her kişide azaldı
(y01 3→0, y06 3→0, y03 10→5, y08 7→2). Tur 1 Kritik'lerinin hepsi karşılandı (manevra sonrası inme ekranı, rapor adı,
araştırma kaydının klinisyene ulaşması, yanlışlıkla klinisyen modu, kusma yönergesi).

Yeni Kritik: ana ekrandaki "Sağ kulak / Sol kulak" düğmeleri onaysız ve sessiz "hekim tanısı" kaydediyor; tek taraf testi
tetiklemeyince uygulama o tarafa manevra öneriyor → yanlış dokunuş yanlış tarafa manevraya götürür (y02, y06; y01, y03).

## M1 — Hasta akışı ve ana ekran (PatientHome.tsx, EpisodeFlow.tsx, Onboarding.tsx, flowText.ts, safety.ts metinleri)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Kritik | Kulak düğmeleri: "Doktorum tanı koydu" bağlantısının arkasına; seçince sesli onay "Sol kulak dediniz, doğru mu? Evet / Hayır"; "Doktor söylemedi" kartı kapatır (Ayarlar'a götürmez), "Tanı girilmedi" cümlesi kalkar | y02, y06, y03, y01 |
| 2 | Kritik | Tek taraf testi tetiklemediyse önerilen büyük düğme "Öbür tarafı da test et"; bilinen tarafa körlemesine manevra önerilmez (ikincil seçenek kalır) | y02 |
| 3 | Yüksek | Uygulamanın önerdiği düğmeye basmak "uyarı aşma" sayılmaz (kayıt APP_DECISION/USER_CHOICE); karar ekranında ilk ses "Önerim: …" | y01 |
| 4 | Yüksek | 112 dışı güvenlik maddesi (ör. boyun) uyarı ekranında "Yanlış dokundum, listeye dön"; geri alınan yanıt raporda "düzeltildi" ya da hiç | y02 |
| 5 | Yüksek | Yeni nörolojik belirtiden sonra "Başım dönüyor" → "Yeni belirti bildirdiniz: manevra önerilmiyor, önce 112/hekim"; manevra ikincil | y05 |
| 6 | Orta | Test negatif karar ekranında tek büyük önerilen düğme, diğerleri "Başka seçenekler" altında katlı | y02, y01 |
| 7 | Orta | Yarıda kalan manevra açılışta sorulsun: "n. adımda yarıda kaldı. Baştan yapalım mı? / Bugünlük bitir"; hazırlık atlanır | y01 |
| 8 | Orta | Günlük sayı: durdurulan/yarım/kötü hissedilen manevralar "2/3"ü doldurmaz ya da ayrı yazılır; ana ekran ve bitişte tek satır sonraki adım ("Tekrar testi 05:55 — uyanınca 'Başım dönüyor'a basın"), saat bir kez | y07, y01, y03 |
| 9 | Orta | Kusma uyarısı listedeki yeni gündelik cümleyi kullansın; güvenlik listesinin ilk sesi kısa (~20 s) | y01, y07, y03 |
| 10 | Düşük | "Şu an nasılsınız?" seçeneklerine numara (1-2-3) ve yüz simgesi | y03, y06 |
| 11 | Orta | İsteğe bağlı belirti şiddeti (0–10): Ayarlar'da "Araştırma: belirti şiddetini sor" açıksa atak başında ve manevradan sonra tek satırlık 0–10 seçimi; `Episode.vas?: { before?: number; after?: number }`; kapalıysa hiç görünmez. Kurulumda katlanır "Çalışma katılımcı no" (isteğe bağlı) | y04 |

## M2 — Yürütücü, kalibrasyon, ses (core/runner.ts, RunnerView.tsx, core/protocols.ts, Calibrate.tsx)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Yüksek | Kırmızı bayrak aşıldıysa yürütücü başındaki 112 hatırlatması adım komutuyla kesilmesin (komut bekler); yürütücü başlığının altında kısa kırmızı satır | y05 |
| 2 | Orta | Hasta modunda yürütücü başlıkları gündelik: "Manevra · sağ", "SAĞINIZ / SOLUNUZ"; "Dix-Hallpike", "45°", "sırtüstünden 270°" yerine "Sağ yanınıza dönün" gibi; küçük harfle başlayan yönerge düzelsin | y01, y03, y06, y02 |
| 3 | Orta | Duraklatma sesi sayfa gizliyken söyleniyorsa dönüşte kısa tekrar ("Duraklatıldı. Devam et'e dokunun"); ses ile ekran uyumu ("2 sn basılı tutun" yalnız gerçekten öyle çalışan ekranda) | y06 |
| 4 | Orta | Duraklatmada "Kendimi kötü hissediyorum" ekrana bakmadan: 2 sn basılı tutma + sesli onay | y07 |
| 5 | Orta | Alındayken her yere dokunma (L5-4) y07'de çalışmadı: demo/gerçek yolda doğrula, çalışmıyorsa düzelt; kalibrasyon girişinde "Başla" altta sabit; kalibrasyonda baş geriye yatırma baş dönmesi olan için yumuşak ("yavaşça, rahat olduğu kadar") | y07, y02 |
| 6 | Düşük | Demo modunda test giriş cümlesi 3 s'de kesiliyor ve yerleştirme cümleleri sessiz: demo da konuşmanın bitişini beklesin | y01, y02, y03 |
| 7 | Orta | Yalnız yaşayan için "hızla yatın" öncesi tek cümle: "Yatağın ortasında yapın; düşmemek için kenara yakın olmayın." | y02 |

## M3 — Klinisyen ve araştırma verisi (Exam.tsx, FindingForm.tsx, examReport.ts, HomeReportView.tsx, studyCsv.ts, ClinicianHome.tsx)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Yüksek | Biten testin ölçümü ve bulgu formu sayfa yenilenince kaybolmasın (taslak saklanır) | y08 |
| 2 | Orta | Nistagmus/baş dönmesi işareti konduysa "Hasta baş dönmesi bildirdi" kendiliğinden işaretli | y08 |
| 3 | Orta | Muayene başında 3 maddelik güvenlik kontrolü (spontan nistagmus, nörolojik bulgu, boyun) — uyarı, kilit değil; telefonun alında tutuluşu ve işaret koyma için kısa yönerge | y08, y05 |
| 4 | Orta | Metinler: reçetede tek süre (gün sayısı ve geçerlilik karışmasın); onaydan sonra "Onaylandı ✓"; klinisyen ekranlarında hasta modu notları kalksın; subjektif BPPV metni Türkçe | y08, y05 |
| 5 | Orta | Ev raporu başlığı: kırmızı bayrak aşıldıysa ya da yeni nörolojik belirti varsa ilk satır bunu söyler; demo kaydında da klinik öneri (demo notuyla) | y05, y08 |
| 6 | Orta | CSV analize hazır: ayrı sütunlar (gecikme, süre, adım, tamamlanma, durma nedeni, en uzun baş dönmesi, VAS önce/sonra), zaman ISO + saat dilimi, karar gerekçesi kısaltılmadan; "Son muayeneler" ev dönemindeki manevra ve aşma sayısını göstersin | y04 |

## Yapılmayanlar
- Arapça dil desteği (y03): sonraki sürüm.
- Santral/periferik hızlı kontrol (HINTS) aracı (y05): klinik ekip kararı; M3-3 yalnız 3 maddelik başlangıç kontrolü.
- Güvenlik listesinin 5 maddeye indirilmesi (y03): klinik ekip kararı; yalnız sesli kısa okuma (M1-9).
