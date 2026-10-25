# Endokrinoloji, Metabolizma ve Obezite — Cihazla tedavi edilen hastalıklar ve telefonla tedavi fikirleri

> Not: Bu raporda web ile doğrulanan kaynaklar bölüm 5'te URL ile verilmiştir. Arama bütçesi dolduğu için doğrulanamayan
> çalışma/ürün adları metinde **(doğrulanmadı)** olarak işaretlenmiştir; bunlar uydurma değil, ancak bu oturumda teyit edilememiştir.

## 0. Önce kritik tespit: Telefon kamerasıyla (PPG) glukoz ölçümü MÜMKÜN DEĞİLDİR

Bu alanın neredeyse tüm cihazları (CGM, pompa, kapalı döngü, hipoglisemi alarmı) **kan şekerini ölçmeye** dayanır. Telefonun
ölçmesi beklenen tek aday kamera-PPG'dir (parmağı flaşa/kameraya bastırıp nabız dalgasını okumak). Bu yöntemle glukoz ölçümü
fizik ve kanıt açısından **yapılamaz**:

| Gerekçe | Açıklama |
|---|---|
| Fizik: dalga boyu | Telefon kamerası görünür ışık (yaklaşık 400–700 nm) algılar, önünde kızılötesi kesici filtre vardır. Glukozun ayırt edici absorpsiyon bantları yakın/orta kızılötesindedir (yaklaşık 1500–1800 nm ve 2100–2300 nm, overtone/kombinasyon bantları) ve orada bile su absorpsiyonunun altında zayıf kalır. Görünür bantta glukoza özgü sinyal yoktur. |
| Fizik: derişim | Kanda glukoz ~5 mmol/L; su ~55 mol/L. 10.000 kat daha derişik bir ortamda, tek dalga boyunda, nabız kaynaklı hacim değişimi (PPG) üzerinden glukoz ayrıştırılamaz. PPG dalga şeklindeki değişimler kalp hızı, HRV, vazomotor ton, cilt sıcaklığı, basınç ve hareketten kaynaklanır; glukozla korelasyon gösteren modeller bu karıştırıcıları (ör. yemek sonrası otonom yanıt) öğrenir, glukozu değil. |
| Kanıt: çalışmalar | Bulunan çalışmalar 16–25 kişilik, in-sample, çapraz doğrulaması zayıf; en iyimser rapor R²=0,88 ve ortalama mutlak hata 14,5 mg/dL (küçük örneklem). Klinik karar için gerekli ISO 15197 ölçütü (%95 ölçümün ±15 mg/dL / ±%15 içinde olması; doğrulanmadı — standart adı bilinir, bu oturumda teyit edilmedi) bağımsız kohortta hiçbir telefon-PPG çalışmasında gösterilmemiştir. UCSF'nin telefon-PPG çalışması glukoz ölçmez, "diyabet var/yok" sınıflar ve ~%80 doğruluktadır. |
| Regülasyon | FDA 21 Şubat 2024 güvenlik bildirimi: cildi delmeden glukoz ölçtüğünü iddia eden hiçbir akıllı saat/yüzük yetkilendirilmemiştir; yanlış okuma yanlış insülin dozuna ve ağır hipoglisemiye yol açabilir. Telefon kamerası, saat optik sensöründen daha kötü koşullardadır (sabit temas yok, tek LED, otomatik pozlama). |
| Ticari iddialar | "Anlık diyabet testi" tarzı uygulamaların "açlık glukozu kadar duyarlı" iddiaları hakemli değildir; kaynak şirketin kendisidir. |

**Sonuç:** Telefon glukozu ölçemez; telefonun insülin dozu önermesi (ölçüm olmadan) tehlikelidir. Bu alanda telefonun
**yapılabilir alanı**, zaten kanıtı olan **davranışsal ve zamanlama müdahalelerini** (yemek sonrası hareket, oturmayı bölme, uyku,
ilaç zamanlaması, ayak bakımı davranışı) sensörle **doğrulayıp tam zamanında tetiklemektir**. Ölçüm gerekiyorsa telefon, dış
CGM'nin ekranı olur (bu zaten var: Dexcom/Libre uygulamaları) — bu BRIEF kurallarına göre "ek donanım" sayılır ve çekirdek fikir olamaz.

## 1. Alanda cihazla tedavi edilen hastalıklar (envanter)

| Hastalık | Kullanılan cihaz | Etki mekanizması | Telefon bu mekanizmayı üretebilir mi? | Not |
|---|---|---|---|---|
| Tip 1 diyabet (T1D) | İnsülin pompası (Medtronic MiniMed, Tandem t:slim, Omnipod) | İlaç (insülin) salımı, subkutan | **Hayır** (ilaç salımı) | — |
| T1D | CGM (Dexcom G6/G7, FreeStyle Libre 2/3, Guardian) | Deri altı enzimatik glukoz sensörü → ölçüm + alarm | **Hayır** (ölçüm); alarm/ekran kısmı zaten telefon uygulamasında | Bkz. bölüm 0 |
| T1D | Kapalı döngü / AID (Control-IQ, MiniMed 780G, Omnipod 5, CamAPS FX) | CGM ölçümü → algoritma → insülin dozu | **Hayır** (hem ölçüm hem salım dış cihaz) | Algoritma telefonda çalışabilir ama anlamı yok |
| T1D/T2D insülin kullanan | Akıllı insülin kalemi (InPen) + bolus hesaplayıcı uygulamalar | Doz hesaplama, hatırlatma | **Birebir** (yazılım kısmı) | Zaten var: InPen app, Insulia (doğrulanmadı), mySugr bolus hesaplayıcı (CE) |
| T1D/T2D | Karbonhidrat sayımı için yemek fotoğrafı uygulamaları (SNAQ, GoCARB araştırma prototipi — doğrulanmadı) | Görsel tanıma → porsiyon tahmini | **Birebir** (kamera) | Zaten var; tek başına "tedavi" değil |
| Tip 2 diyabet (T2D) | Dijital terapötik: BlueStar (Welldoc, FDA 510(k), 11 kez genişletilmiş) | Davranışsal koçluk, ilaç uyumu, glukoz günlüğü geri bildirimi | **Birebir** | Şirket iddiası A1c −1,7 ila −2,0 (bağımsız teyit yok); 2 RCT var (Quinn 2011 cluster RCT — doğrulanmadı). Türkiye'de yok |
| T2D / prediyabet | Dijital DPP (Omada, Noom, Virta, Liva) | Yaşam tarzı/kilo kaybı koçluğu | **Birebir** | Omada RCT (n=599): kilo −5,5 vs −2,1 %, A1c farkı küçük (~0,08) |
| T2D | Zamanlı egzersiz (yemek sonrası yürüyüş, oturmayı bölme) — cihaz yok, klinik öneri | Kas glukoz alımı (insülinden bağımsız GLUT4 translokasyonu) | **Birebir** (IMU + bildirim) | Fikir 1–2'nin temeli |
| Gestasyonel diyabet | CGM; telefonla glukoz günlüğü (GDm-Health, İngiltere — doğrulanmadı) | Ölçüm + uzaktan izlem | Ölçüm: **hayır**; davranış: **birebir** | Fikir 1'in alt grubu |
| Hipoglisemi (gece) | CGM alarmları ("Urgent Low Soon"), Dexcom Follow; diyabet alarm köpeği | Ölçüm → alarm; ter/nefes kokusu | **Hayır** (ölçüm); zamanlı uyandırma: **zayıf** | Bilek mikro-tremor ivmeölçer yaklaşımı yetersiz bulundu (2017 abstract) |
| Ağrılı diyabetik nöropati | TENS (Sensus/Quell, NeuroMetrix; FDA 2012/OTC) | Elektrik akımı ile kapı kontrolü/analjezi | **Hayır** (akım) | Kanıt zayıf, çoğu şirket kaynaklı |
| Ağrılı diyabetik nöropati | Omurilik stimülasyonu 10 kHz (Nevro HFX, FDA 2021, SENZA-PDN — doğrulanmadı) | Elektrik nöromodülasyon | **Hayır** | — |
| Diyabetik nöropati (duyu) | MIRE / Anodyne (kızılötesi, FDA 1994 "dolaşım/ağrı") | Fotobiyomodülasyon 890 nm | **Hayır** (telefonda kızılötesi yok) | Kanıt zayıf (Li 2008 derleme) |
| Diyabetik nöropati (denge/düşme) | Denge platformları, vibrasyon tabanlıklar | Motor öğrenme / duyusal ikame | **Zayıf ama anlamlı** (IMU ile denge egzersizi yönlendirme) | Rehabilitasyon alanıyla çakışır |
| Diyabetik ayak ülseri önleme | Podimetrics SmartMat (sıcaklık matı), Siren çorap, Orpyx tabanlık | Cilt sıcaklık asimetrisi >2,2 °C → yük boşaltma uyarısı (kapalı döngü) | **Zayıf** (kızılötesi yok; kamera ile renk/şekil izlemi mümkün) | SmartMat: %97 duyarlılık, 37 gün öncü süre; yanlış pozitif %57 (n=129). Sonuç verileri şirket destekli |
| Diyabetik ayak ülseri (aktif) | Total kontakt alçı, yük boşaltma botu, negatif basınç (NPWT), hiperbarik O2 | Basınç kaldırma, mekanik | Basınç: **hayır**; **yük boşaltma davranışına uyum**: **birebir** (adım bütçesi) | Fikir 3 |
| Diyabetik ayak | Fotoğraf tabanlı öz-izlem uygulamaları (MyFootCare; Johns Hopkins NCT05579743 RCT devam ediyor) | Görsel izlem | **Birebir** | Henüz yalnızca fizibilite verisi (n=12) |
| Obezite | İntragastrik balon (Orbera), endoskopik sleeve, bariatrik cerrahi | Mekanik tokluk / anatomik | **Hayır** | — |
| Obezite | Plenity (yutulan hidrojel, FDA de novo 2019 — doğrulanmadı) | Mide hacmi | **Hayır** | — |
| Obezite | vBloc/Maestro vagal blokaj (FDA 2015 — doğrulanmadı) | Elektrik | **Hayır** | — |
| Obezite | Mandometer (yeme hızı geri bildirim tabağı — doğrulanmadı) | Biofeedback: yavaş yeme | **Zayıf ama anlamlı** (kamera/haptik ile yeme ritmi) | Fikir 5 |
| Obezite / tıkınırcasına yeme | Dijital BDT uygulamaları (Noom, Recovery Record — doğrulanmadı) | Davranışsal terapi | **Birebir** | Zaten var |
| Osteoporoz | Tüm vücut titreşimi (WBV: Juvent, Marodyne LIV; 30 Hz, ~0,3 g, ayakta) | Mekanik yükleme → osteojenik sinyal | **Hayır** (telefon motoru tüm vücudu titreştiremez) | Meta-analizler: etki küçük/tutarsız, düşük kanıt kesinliği |
| Osteoporoz | Darbe/direnç egzersizi (LIFTMOR — doğrulanmadı) | Mekanik yükleme | **Zayıf ama anlamlı** (IMU ile darbe sayımı/şiddeti) | Fikir 6 |
| Hipotiroidi | Cihaz yok; levotiroksin (ilaç) | — | İlaç zamanlaması/uyum: **birebir** | Fikir 4 |
| Tiroid nodülü / hipertiroidi | Radyofrekans/lazer ablasyon, radyoaktif iyot | Isı / radyasyon | **Hayır** | — |
| PCOS (polikistik over) | Cihaz yok; lazer epilasyon (hirsutizm), ovaryan drilling (cerrahi) | Isı / cerrahi | **Hayır**; yaşam tarzı DTx: **birebir** | PCOS yaşam tarzı uygulamaları var (Allara vb. — doğrulanmadı) |
| Diyabetik retinopati tarama | Fundus kamerası + yapay zekâ (IDx-DR) | Görüntüleme | **Hayır** (telefon kamerasıyla fundus için adaptör gerekir) | Tarama; tedavi değil |

## 2. Proje fikirleri (telefon tek başına)

### Fikir 1: "15 Dakika" — Yemek sonrası yürüyüş kapalı döngüsü
- **Hedef hastalık ve hasta sayısı:** T2D ve prediyabet; gestasyonel diyabet alt grubu. Türkiye'de 20–79 yaş 9,6 milyon diyabetli (IDF 2025), dünyada ~589 milyon (IDF Atlas 11. baskı). Prediyabet bunun üstüne (TURDEP-II'de bozulmuş glukoz toleransı ~%7,9 — doğrulanmadı).
- **Taklit edilen cihaz/mekanizma:** Kapalı döngü mantığı (ölç → müdahale), ama ölçülen şey glukoz değil, **yemek olayı ve sonrasındaki hareket**. Mekanizma: yemek sonrası ilk 30–60 dakikada hafif yürüyüş, kasın insülinden bağımsız glukoz alımını artırır; postprandiyal pikleri küçültür.
- **Telefonda nasıl çalışır:**
  1. **Yemek algılama (üç kanal, kullanıcı seçer):** (a) kameraya tek dokunuşla tabağın fotoğrafı (zaman damgası + kaba porsiyon/karbonhidrat sınıfı, kesin gram değil); (b) pasif: öğün saat penceresi + GPS (ev/iş/restoran) + telefon masada hareketsiz + ekran kapalı → "yemek yiyor olabilirsin" sorusu; (c) manuel tek buton.
  2. Yemek bitiminden 5–15 dk sonra bildirim + titreşim: "10 dakika yürü". Geri sayım, ekranda tempo (adım/dakika) göstergesi.
  3. **IMU doğrulama:** adım sayımı ve kadans; en az 8 dk ≥80 adım/dk ise "tamamlandı". Yürüyüş olmazsa 10 dk sonra ikinci, daha kısa seçenek: "3 dakika yerinde yürü / 10 kez otur-kalk".
  4. Haftalık geri bildirim: öğün başına yürüyüş oranı, akşam yemeği öncelikli (en büyük etki).
  5. Protokol: her ana öğün sonrası 10–15 dk, 12 hafta; sonra idame.
- **Kanıt:** Reynolds 2016 (Diabetologia, çapraz RCT, n=41 T2D): yemek sonrası 10 dk yürüyüş, zamanı serbest 30 dk yürüyüşe göre postprandiyal glukozu %12 düşürdü; akşam yemeğinde %22. Engeroff 2023 (Sports Medicine meta-analiz): yemeğe yakın başlanan egzersiz daha etkili, yemek–egzersiz aralığı anlamlı moderatör (−0,0151, p=0,001); yemek öncesi egzersiz anlamsız (SMD −0,13). Buffey 2022 (Sports Medicine meta-analiz, 7 çalışma): hafif yürüyüş molaları oturmaya göre glukozu %17 düşürdü. **Telefon tabanlı versiyon kanıtı:** doğrudan "IMU ile doğrulanmış yemek sonrası yürüyüş uygulaması" RCT'si bulunamadı → **yok**.
- **Mevcut uygulamalar:** Adım sayarlar, genel hareket hatırlatıcıları, CGM uygulamalarının "glukoz yükseliyor" bildirimleri (donanım gerekir), BlueStar/Omada genel koçluk. Yemek olayını algılayıp 15 dk penceresinde IMU ile doğrulanan yürüyüşü tetikleyen ve akşam yemeğine ağırlık veren tek amaçlı ürün bulunamadı (doğrulanmadı).
- **Teknik zorluklar / çözüm:** Yemek algılama yanlış pozitifleri → kullanıcı onayı + öğrenen zaman modeli. Telefon cepte değilse adım sayılmaz → "telefonu yanına al" tek şart; cep/el modu için IMU kalibrasyonu. Hava/ortam (apartman) → yerinde yürüyüş ve merdiven modu (barometre ile kat sayımı).
- **Regülasyon:** Genel sağlık/yaşam tarzı uygulaması olarak (FDA "general wellness", CE-MDR dışı) başlayabilir; "T2D'de postprandiyal glukozu düşürür" iddiası yapılırsa SaMD Sınıf I–IIa (CE-MDR), FDA Sınıf II (BlueStar emsal), TİTCK'da tıbbi cihaz yazılımı kaydı. Klinik çalışma: evet, CGM ile ölçülen 2 haftalık çapraz tasarım (Reynolds protokolü) yeterli ve ucuz.
- **Riskler:** Kalp yetmezliği/anjina hastasında yemek sonrası egzersiz talebi (Zonszein uyarısı) → tarama sorusu; insülin/sulfonilüre kullananlarda egzersiz hipoglisemisi → "insülin kullanıyorsan hekimine danış", hafif tempo. Diyabetik ayak ülseri olanda yürüyüş yasak → Fikir 3 ile ters kilit.
- **Puanlama:** Teknik 9 | Kanıt 7 | Etki 9 | Yenilik 6 | Düşük risk 9 | **TOPLAM 40/50**

### Fikir 2: "Otuz-Üç" — IMU ile sedanter davranış kırıcı (her 30 dk'da 3 dk)
- **Hedef hastalık ve hasta sayısı:** T2D, prediyabet, obezite, metabolik sendrom; masa başı çalışanlar. Türkiye'de erişkin obezite %32–35 (TURDEP-II), diyabet 9,6 milyon.
- **Taklit edilen cihaz/mekanizma:** Akıllı saat "ayağa kalk" uyarısı (donanım) ve klinik "oturmayı böl" önerisi. Mekanizma: uzun oturmanın bölünmesi postprandiyal glukoz ve insülini düşürür.
- **Telefonda nasıl çalışır:** IMU + ekran kullanımı + yakınlık sensörü ile "oturur durumda ve hareketsiz" durumunu sürekli sınıflar (telefon masada hareketsiz + kullanıcı etkileşimi var = oturuyor). 30 dk kesintisiz oturmada bildirim: 3 dk hafif yürüyüş **veya** 3 dk basit direnç (otur-kalk ×10, baldır kaldırma ×20). IMU ile sayım ve tamamlanma; yapılmadıysa sessiz erteleme, baskı yok. Günde 8–12 mola, süresiz kullanım; 12 haftada etkinlik ölçümü.
- **Kanıt:** Dempsey 2016 (Diabetes Care, T2D, n=24 — doğrulanmadı): her 30 dk'da 3 dk hafif yürüyüş veya basit direnç, 7 saat oturmaya göre glukoz iAUC'yi yaklaşık %39 azalttı. Buffey 2022 meta-analiz: yürüyüş molaları −%17 glukoz. **Telefon versiyonu kanıtı:** ofis çalışanlarında bildirim tabanlı oturma azaltma çalışmaları var ama IMU ile oturma algılayan, hastalık hedefli, glukoz sonuçlu telefon-yalnız RCT bulunamadı → **zayıf/yok**.
- **Mevcut uygulamalar:** "Stand Up!", "Stretchly" gibi sabit zamanlayıcılar (oturmayı algılamaz, aktiviteyi doğrulamaz); Apple Watch/Fitbit stand uyarısı (donanım). Fark: telefon-only algılama + direnç alternatifi + diyabet hedefli dozaj.
- **Teknik zorluklar / çözüm:** Telefon masada iken kullanıcının oturduğunun kesinliği yok → "ekranla etkileşim" ve bilgisayar/Bluetooth yakınlığıyla güven artırma; yanlışsa tek dokunuşla düzeltme. Pil: düşük frekanslı (10 Hz) ivmeölçer örnekleme, işletim sistemi aktivite API'leri.
- **Regülasyon:** Genel sağlık; hastalık iddiasında Sınıf I/IIa SaMD. Klinik çalışma: CGM'li çapraz tasarım önerilir.
- **Riskler:** Düşük. Ortostatik hipotansiyon olanlarda ani kalkış uyarısı; ülserli diyabetik ayakta yürüyüş yerine oturarak direnç.
- **Puanlama:** Teknik 9 | Kanıt 7 | Etki 8 | Yenilik 5 | Düşük risk 9 | **TOPLAM 38/50**

### Fikir 3: "Ayak Günlüğü" — Kamera ile renk/ülser takibi + IMU adım bütçesiyle yük boşaltma uyarısı
- **Hedef hastalık ve hasta sayısı:** Diyabetik ayak riski yüksek hastalar (nöropati + deformite veya iyileşmiş ülser). Diyabetlilerin yaşam boyu ülser riski %19–34 (Armstrong 2017 NEJM — doğrulanmadı); Türkiye'de 9,6 milyon diyabetlinin kabaca %15–25'i yüksek riskli (kaba tahmin).
- **Taklit edilen cihaz/mekanizma:** Podimetrics SmartMat/Siren çorap (sıcaklık asimetrisi → yük boşaltma). Telefonda kızılötesi yok, bu yüzden **termografi yapılamaz**; yerine (a) **renk/eritem/şişlik/nasır/su toplaması** görsel takibi ve (b) **adım bütçesi** ile yük boşaltma davranışı.
- **Telefonda nasıl çalışır:** Günde 1 kez, aynı konumda, flaş açık, ekrandaki şablona hizalanarak her iki ayak tabanı ve parmak aralarının fotoğrafı (telefon yere konur, zamanlayıcı, geniş açı; görme kaybı/obezite için sesli yönlendirme ve "bir yakın çeksin" modu — Iowa çalışması öz-fotoğraf yöntemlerini karşılaştırdı). Beyaz dengesi için ekranda gösterilen referans renk kartı yerine telefonun kendi ekranı (ikinci telefon yoksa) veya ambalaj beyazı kullanılır. Yapay zekâ: iki ayak arasında ve kişinin kendi tabanına göre kızarıklık/koyu renk/nasır/açık yara alanı değişimi; eşik aşılırsa "bu bölgeye yük bindirme, 24 saat sonra tekrar çek, iyileşmezse hekim". IMU ile günlük adım sayısı; uyarı durumunda "adım bütçesi" %50 azaltılır ve aşılınca titreşimle hatırlatır. Aktif ülserde (hekim onaylı) bütçe daha sıkı. Süre: sürekli; iyileşmiş ülserde en az 12 ay.
- **Kanıt:** Sıcaklık izlemi RCT'leri (Lavery 2007, Armstrong 2007 — doğrulanmadı): ülser insidansında anlamlı azalma. SmartMat: %97 duyarlılık, 37 gün öncü süre, yanlış pozitif %57 (n=129, 34 hafta); hastaneye yatış −%52, ülser nüksü −%91 (şirket destekli, kontrolsüz). Fotoğraf tabanlı öz-izlem: MyFootCare karma yöntem (n=12, 10/12 değerli buldu); Johns Hopkins NCT05579743 (n=120, randomize fizibilite, devam ediyor). Görsel renk değişiminin ülseri sıcaklık kadar erken yakaladığına dair kanıt **yok**; IMU adım bütçesiyle yük boşaltma uyumu için telefon kanıtı **yok** (Najafi grubunun aktivite izleme çalışmaları var — doğrulanmadı).
- **Mevcut uygulamalar:** MyFootCare (araştırma), çeşitli yara fotoğraf uygulamaları (klinik kullanım, hemşire çeker). Hiçbiri IMU adım bütçesiyle kapalı döngü kurmuyor (doğrulanmadı).
- **Teknik zorluklar / çözüm:** Tabanı kendi kendine fotoğraflama (obezite, görme kaybı, eklem kısıtlılığı) → yere konan telefon + zamanlayıcı + sesli hizalama; koyu ciltte eritem tespiti zor → kişi-içi değişim (kendi bazal fotoğrafı) kullan, mutlak renk değil; aydınlatma değişkenliği → flaş zorunlu, otomatik pozlama kilidi; yanlış pozitiflerin hekime yük olması → eşik yüksek, önce davranış (yük azalt) sonra hekim.
- **Regülasyon:** Ülser tespiti/uyarısı iddiası → SaMD Sınıf IIa (CE-MDR kural 11), FDA Sınıf II; TİTCK kayıt. Klinik çalışma: evet, 12 aylık ülser insidansı RCT'si gerekir (pahalı).
- **Riskler:** Yanlış güvence (yara var, uygulama görmedi) en ciddi risk → "uygulama muayenenin yerini tutmaz", şüphede hekim. Aşırı adım kısıtlaması → kas kaybı/metabolik kötüleşme → bütçe yalnızca uyarı döneminde.
- **Puanlama:** Teknik 6 | Kanıt 5 | Etki 7 | Yenilik 7 | Düşük risk 7 | **TOPLAM 32/50**

### Fikir 4: "Aç Karnına" — Levotiroksin zamanlama ve etkileşim koçu
- **Hedef hastalık ve hasta sayısı:** Hipotiroidi (tiroid hormonu azlığı). Türkiye'de levotiroksin kullanan sayısı milyonlarla ifade edilir (kesin sayı doğrulanmadı); dünyada en sık reçete edilen ilaçlardan biri.
- **Taklit edilen cihaz/mekanizma:** Cihaz yok; mekanizma ilaç emiliminin zamanlamaya bağlılığı (açken, kahve/demir/kalsiyum/PPİ'den uzak). Yanlış zamanlama TSH dalgalanmasına ve doz artışına yol açar.
- **Telefonda nasıl çalışır:** Uyanma saatini IMU/ekran etkinliğinden öğrenir, ilaç alarmını o anda verir; alındı onayı; 30–60 dk "yeme/kahve" kilidi geri sayımı; kamera ile kahvaltı/kahve fotoğrafı veya tek dokunuş; demir/kalsiyum/çoklu vitamin saatini en az 4 saat ayırır; TSH sonucunu kullanıcı girer, uyum ile ilişkilendirir. Alternatif gece-yatmadan-önce protokolü (akşam yemeğinden ≥3 saat sonra) seçilebilir.
- **Kanıt:** Zamanlamanın TSH'yi etkilediğine dair RCT'ler var (Bolk 2010 Arch Intern Med, gece alımı — doğrulanmadı). Telefon uygulamasıyla uyum/TSH sonucu RCT'si bulunamadı → **yok**.
- **Mevcut uygulamalar:** Genel ilaç hatırlatıcıları (Medisafe, MyTherapy) saat verir ama uyanma algılama, kahve/demir kilidi ve TSH ilişkilendirmesi yapmaz (doğrulanmadı). Fark küçük ama gerçek.
- **Teknik zorluklar / çözüm:** Uyanma algısı hatası → alarm yedeği. Bildirim yorgunluğu → yalnızca 2 bildirim/gün.
- **Regülasyon:** Genel sağlık/ilaç uyum uygulaması, muhtemelen SaMD dışı veya Sınıf I; klinik çalışma zorunlu değil, TSH sonuçlu basit RCT önerilir.
- **Riskler:** Çok düşük; doz önerisi yapmaz.
- **Puanlama:** Teknik 9 | Kanıt 5 | Etki 6 | Yenilik 3 | Düşük risk 10 | **TOPLAM 33/50**

### Fikir 5: "Yavaş Lokma" — Kamera/haptik ile yeme hızı geri bildirimi (obezite)
- **Hedef hastalık ve hasta sayısı:** Obezite ve T2D'de kilo kontrolü. Türkiye'de erişkin obezite %32–35 (TURDEP-II, ~18–20 milyon kişi kaba tahmin); dünyada 1 milyarı aşkın (WHO 2022 — doğrulanmadı).
- **Taklit edilen cihaz/mekanizma:** Mandometer (tabak altı terazi, yeme hızı eğrisi geri bildirimi; çocuk obezitesinde RCT, Ford 2010 BMJ — doğrulanmadı). Mekanizma: yavaş yeme → tokluk sinyallerinin (GLP-1, PYY) yetişmesi → daha az alım. Robinson 2014 meta-analizi: yavaş yeme alımı azaltır (doğrulanmadı).
- **Telefonda nasıl çalışır:** Telefon masada, ön kamera ile yüz/çene hareketi ve el-ağız hareketi sayımı (lokma/dakika); hedefin üstünde hızlanınca ekran rengi ve kısa titreşimle "bekle" sinyali; çiğneme ritmi için hoparlörden sessiz metronom seçeneği. Kamera istemeyenler için yalnızca ritmik haptik pacing (lokma arası 20–30 sn). Günde 1–2 öğün, 8–12 hafta, hedef lokma hızı kademeli düşürülür.
- **Kanıt:** Cihaz (Mandometer) için RCT; telefon kamerasıyla lokma sayımı araştırma düzeyinde (video tabanlı lokma tespiti çalışmaları var — doğrulanmadı); kilo sonucu olan telefon RCT'si **yok**.
- **Mevcut uygulamalar:** Yavaş yeme zamanlayıcıları (basit sayaç; algılama yok), Noom (davranışsal, hız geri bildirimi yok). Kamera ile gerçek zamanlı lokma hızı geri bildirimi yapan ürün bulunamadı (doğrulanmadı).
- **Teknik zorluklar / çözüm:** Kamera açısı/mahremiyet → cihaz üstünde işleme, görüntü kaydedilmez; sosyal yemekte kullanım zor → ev yemekleri hedef; lokma tespiti doğruluğu → başlangıçta kullanıcı onayı ile kalibrasyon.
- **Regülasyon:** Genel sağlık; "obezite tedavisi" iddiasında Sınıf IIa SaMD. Klinik çalışma: 12 haftalık kilo RCT'si.
- **Riskler:** Yeme bozukluğu öyküsü (restriktif) olanlarda kontrendike; tarama sorusu.
- **Puanlama:** Teknik 6 | Kanıt 5 | Etki 8 | Yenilik 7 | Düşük risk 8 | **TOPLAM 34/50**

### Fikir 6: "Topuk Vuruşu" — IMU ile darbe yükleme egzersiz koçu (osteoporoz/osteopeni)
- **Hedef hastalık ve hasta sayısı:** Postmenopozal osteopeni/osteoporoz; Türkiye'de 50 yaş üstü kadınlarda osteoporoz ~%13–20 (FRACTURK — doğrulanmadı), dünyada ~200 milyon (doğrulanmadı).
- **Taklit edilen cihaz/mekanizma:** Tüm vücut titreşim platformu (WBV, 30 Hz, 0,3 g). **Telefon motoru bunu üretemez** (genlik mg düzeyi, kütle 200 g, vücuda iletim yok). Yerine aynı osteojenik ilke olan **darbe yüklemesi** (topuk düşürme, küçük sıçrama, merdiven) IMU ile dozlanır.
- **Telefonda nasıl çalışır:** Telefon kemer/cepte; IMU tepe ivmeyi (g) ölçer ve her darbeyi sayar; hedef günde 50 topuk düşürme/sıçrama, tepe ivme ≥2–3 g (kişiye göre), haftada 3–5 gün, 6–12 ay. Yetersiz şiddette "biraz daha sert" geri bildirimi; aşırı şiddette durdurma. Denge güvenliği için duvara tutunarak yapılır.
- **Kanıt:** WBV meta-analizleri (2023 Osteoporos Int: yüksek frekans-düşük genlikte anlamlı ama küçük etki; 2025: düşük kesinlik). Darbe/direnç egzersizi: LIFTMOR RCT (Watson 2018 JBMR, postmenopozal düşük kemik kütlesi, lomber BMD artışı — doğrulanmadı); Bassey 1994 topuk düşürme (doğrulanmadı). Telefon-IMU dozlu egzersiz RCT'si **yok**.
- **Mevcut uygulamalar:** Genel egzersiz uygulamaları; darbe şiddetini IMU ile ölçüp dozlayan osteoporoz uygulaması bulunamadı (doğrulanmadı).
- **Teknik zorluklar / çözüm:** Telefon konumuna göre ivme farkı → kalça/bel konumu standardı + kalibrasyon; kemik üzerindeki gerçek yük tahmini kaba.
- **Regülasyon:** Egzersiz uygulaması; "BMD artırır" iddiasında Sınıf IIa; 12 aylık DXA sonuçlu RCT pahalı.
- **Riskler:** Ağır osteoporoz/vertebra kırığı öyküsünde sıçrama kontrendike → yalnızca osteopeni/hafif osteoporoz ve hekim onayı; düşme riski.
- **Puanlama:** Teknik 8 | Kanıt 5 | Etki 6 | Yenilik 6 | Düşük risk 6 | **TOPLAM 31/50**

### Fikir 7: "Gece Nöbeti" — CGM'siz gece hipoglisemi risk-alarmı (T1D, MDI)
- **Hedef hastalık ve hasta sayısı:** CGM'ye erişemeyen T1D (çoklu doz insülin). Dünyada ~9 milyon T1D (WHO — doğrulanmadı); Türkiye'de CGM geri ödemesi sınırlı olduğundan önemli bir grup (sayı doğrulanmadı).
- **Taklit edilen cihaz/mekanizma:** CGM "Urgent Low Soon" alarmı. Telefon glukozu ölçemez; mikrofon/IMU ile terleme veya mikro-tremor algılaması yetersiz (bilek ivmeölçer 2017 abstract: "tek başına yeterli değil"; telefon daha da uzakta). Dolayısıyla mekanizma **risk tahmini + zamanlı uyandırma**: akşam insülin dozu, geç egzersiz, alkol, düşük yatma öncesi parmak ucu glukozu (kullanıcı girer) → risk puanı yüksekse 02:00–03:00 arası alarm; alarmı kapatmak için dokunmatik reaksiyon testi; yavaş/başarısız yanıtta "15 g karbonhidrat al" talimatı + 15 dk sonra yeniden test + yanıtsızsa yakınına otomatik arama/konum. Uyku hareketsizliği (IMU, telefon yatakta) ve nefes sesi (mikrofon) yalnızca "yanıt yok" kararını destekler.
- **Kanıt:** CGM alarmlarının gece hipoglisemisini azalttığı gösterilmiş (çok sayıda RCT; isimler doğrulanmadı). Hypo-METRICS (n=574): gece penceresi tanımı için uyku takibi gerekli. Telefon-yalnız risk-alarm yaklaşımının kanıtı **yok**.
- **Mevcut uygulamalar:** Dexcom Follow, Sugarmate (CGM gerekir). CGM'siz risk tabanlı uyandırma + reaksiyon testi + kaçış araması yapan ürün bulunamadı (doğrulanmadı).
- **Teknik zorluklar / çözüm:** Risk modeli kalibrasyonu (bireysel), uyku bölünmesi maliyeti → yalnızca yüksek riskli gecelerde; reaksiyon testinin uykululuk ile hipoglisemiyi ayırt edememesi → her durumda "parmak ucu ölç" talimatı.
- **Regülasyon:** Hipoglisemi ile ilgili iddia → SaMD Sınıf IIa/IIb; FDA Sınıf II; klinik çalışma şart.
- **Riskler:** Yanlış güvence (alarm çalmadı, hipoglisemi oldu) ciddi; kronik uyku bölünmesi. Bu yüzden yalnızca CGM'ye erişemeyenlere, "CGM yerine değil" uyarısıyla.
- **Puanlama:** Teknik 8 | Kanıt 3 | Etki 5 | Yenilik 6 | Düşük risk 5 | **TOPLAM 27/50**

### Fikir 8: "Işık ve Uyku Düzeni" — Ambiyans ışığı + uyku düzenliliği ile insülin direnci koçu
- **Hedef:** Prediyabet/T2D/obezite; vardiyalı çalışanlar.
- **Mekanizma:** Kısa/düzensiz uyku ve geç ışık maruziyeti insülin direncini artırır; uyku uzatma enerji alımını düşürür (Tasali 2022 JAMA Intern Med, −270 kcal/gün — doğrulanmadı).
- **Telefonda:** Ortam ışığı sensörü + ekran kullanımı ile akşam ışık maruziyeti ve yatış saati değişkenliği; sabah dış ışık hedefi (sensörle doğrulanan 10 dk >1000 lux), akşam ekran kısma, sabit kalkış alarmı. Süre: 8 hafta.
- **Kanıt:** Davranışsal uyku uzatma RCT'leri var; telefon-sensör doğrulamalı, glukoz sonuçlu çalışma **yok**.
- **Mevcut:** Uyku hijyeni uygulamaları (Sleep Cycle, CBT-i uygulamaları) çok; metabolik hedefli ışık-sensör doğrulamalı versiyon bulunamadı (doğrulanmadı). Fark zayıf.
- **Regülasyon:** Genel sağlık. **Riskler:** düşük.
- **Puanlama:** Teknik 8 | Kanıt 4 | Etki 6 | Yenilik 4 | Düşük risk 10 | **TOPLAM 32/50**

## 3. Alanın en iyi 3 fikri (sıralı) ve gerekçe
1. **Fikir 1 — Yemek sonrası yürüyüş kapalı döngüsü (40/50).** Kanıt üç bağımsız kaynakla (Reynolds 2016 RCT, Engeroff 2023 ve Buffey 2022 meta-analizleri) güçlü; telefonun tüm bileşenleri (kamera/zaman ile yemek olayı, IMU ile doğrulama, bildirim) hazır; hedef kitle Türkiye'de ~10 milyon, dünyada ~600 milyon; risk düşük; klinik doğrulama ucuz (CGM'li çapraz tasarım). Gestasyonel diyabet ve prediyabet aynı uygulamanın alt modülü olabilir.
2. **Fikir 2 — IMU sedanter kırıcı (38/50).** Aynı fizyolojik mekanizma, gün boyu çalışır; teknik olarak en kolay. Yenilik puanı daha düşük (zamanlayıcı uygulamaları ve saat uyarıları var), bu yüzden Fikir 1 ile **tek üründe** birleştirilmesi önerilir: "yemek sonrası 10 dk + her 30 dk'da 3 dk".
3. **Fikir 5 — Yeme hızı geri bildirimi (34/50).** Obezitede donanımsız gerçek bir mekanizma (Mandometer'in telefon versiyonu); etki potansiyeli yüksek, yenilik iyi. Kanıt ve kamera doğruluğu belirsiz olduğundan üçüncü sırada; Fikir 3 (ayak) etki olarak yakın ama teknik/kanıt zayıflığı ve yanlış güvence riski nedeniyle dördüncü.

## 4. "Yapılamaz" diye elenenler
- **Kamera-PPG ile glukoz ölçümü / "donanımsız CGM":** Görünür bantta glukoz sinyali yok, kanıt küçük örneklemli, FDA 2024 uyarısı (bölüm 0).
- **Telefonla insülin dozu/kapalı döngü (AID):** İlaç salımı ve ölçüm dış donanım gerektirir.
- **Telefon titreşimiyle tüm vücut titreşimi (osteoporoz):** 30 Hz/0,3 g tüm vücut yükü telefon motorundan (mg genlik, 200 g kütle) üretilemez.
- **Telefonla TENS/omurilik stimülasyonu (diyabetik nöropati ağrısı):** Elektrik akımı yok.
- **MIRE/Anodyne fotobiyomodülasyon:** 890 nm kızılötesi yok; flaş görünür ışık ve terapötik güç yoğunluğunda değil.
- **Kamera termografi ile diyabetik ayak sıcaklık asimetrisi:** Kızılötesi sensör yok; cilt sıcaklığı görünür görüntüden çıkarılamaz.
- **İntragastrik balon, hidrojel, vagal blokaj, bariatrik cerrahi (obezite):** Mekanik/elektriksel/cerrahi.
- **Tiroid RFA/radyoaktif iyot, PCOS lazer epilasyon/ovaryan drilling:** Isı/radyasyon/cerrahi.
- **Mikrofon/IMU ile gece hipoglisemi "tespiti":** Bilek ivmeölçerle bile yetersiz; telefon temas etmez. (Risk tabanlı uyandırma olarak Fikir 7'de sınırlı tutuldu.)
- **Fundus kamerası ile retinopati tarama:** Adaptör gerektirir; ayrıca tarama, tedavi değil.
- **"BlueStar/Omada benzeri genel diyabet koçu":** Zaten var; farkı yok, önerilmedi.

## 5. Kaynaklar (URL)
Doğrulananlar (bu oturumda arama ile görüldü):
- FDA uyarısı (Şubat 2024), akıllı saat/yüzük glukoz: https://www.healio.com/news/endocrinology/20240409/fda-avoid-using-smartwatches-smart-rings-to-measure-blood-glucose ; https://www.massdevice.com/fda-warning-smartwatches-measure-blood-glucose/
- Telefon-PPG glukoz küçük örneklemli çalışmalar: https://arxiv.org/pdf/1911.12619.pdf ; https://inderscience.com/offer.php?id=124189 ; https://iieta.org/download/file/fid/190071 ; UCSF diyabet sınıflama: https://www.freethink.com/articles/detect-diabetes ; ticari iddia örneği: https://argusfitness.com/apps/instant-diabetes-test/features
- Reynolds 2016 Diabetologia (Otago basın açıklaması ve haberler): https://www.otago.ac.nz/news/newsroom/short-walks-after-meals-may-prove-important-tool-in-managing-diabetes ; https://www.practiceupdate.com/content/advice-to-walk-after-meals-is-more-effective-for-lowering-postprandial-glycemia-in-t2dm-than-advice-that-does-not-specify-timing/45528
- Engeroff 2023 Sports Medicine meta-analiz: https://pubmed.ncbi.nlm.nih.gov/36715875/ ; yazar yanıtı: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10432346/
- Buffey 2022 Sports Medicine meta-analiz (haber özetleri): https://www.ksl.com/article/news/utah/health/just-2-minutes-of-walking-after-eating-can-help-blood-sugar-study-says/50468671
- BlueStar/Welldoc FDA 510(k) ve şirket iddiaları: https://www.welldoc.com/?p=3955 ; https://www.biospace.com/welldoc-s-award-winning-digital-health-solution-bluestar-adds-fda-clearance-for-use-in-type-1-diabetes
- Omada dijital DPP RCT: https://www.omadahealth.com/resource-center/effects-of-a-digital-diabetes-prevention-program-an-rct ; https://diatribe.org/node/42131 ; https://www.mobihealthnews.com/news/digital-diabetes-prevention-program-use-tied-weight-reduction-among-low-income-patients
- Podimetrics SmartMat: https://vascularnews.com/podimetrics-smartmat-predicting-diabetic-foot/ ; https://www.mobihealthnews.com/news/daily-foot-temperature-monitoring-leads-fewer-hospitalizations-amputations-and-more ; https://clinicaltrials.gov/study/NCT04345016
- MyFootCare karma yöntem çalışması: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10006972/ ; Johns Hopkins RCT: https://clinicaltrials.gov/study/NCT05579743 ; Iowa öz-fotoğraf çalışması: https://pmc.ncbi.nlm.nih.gov/articles/PMC7368528
- Diyabetik nöropati cihazları (Sensus/Quell/Anodyne): https://diatribe.org/issues/46/new-now-next/4 ; https://www.bcbsm.com/amslibs/content/dam/public/mpr/mprsearch/pdf/82722.pdf
- WBV meta-analizleri: https://pubmed.ncbi.nlm.nih.gov/36282343/ (2023) ; https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11540256/ (2024) ; https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12087579/ (2025) ; https://pubmed.ncbi.nlm.nih.gov/27145947/ (2016)
- Gece hipoglisemi, bilek mikro-tremor: https://ads-adea-2017.p.asnevents.com.au/days/2017-08-31/abstract/44604 ; Hypo-METRICS: https://discovery.dundee.ac.uk/en/publications/a-comparison-of-the-rates-of-clock-based-nocturnal-hypoglycemia-a/
- IDF Diabetes Atlas 2025, Türkiye 9,6 milyon: https://diabetesatlas.org/data-by-location/country/trkiye/ ; küresel: https://www.oedg.at/pdf/2025-IDF-Atlas-11th-Edition.pdf
- TURDEP-II diyabet/obezite: https://www.medikalakademi.com.tr/diyabet-insidans-turdep-prevalans/ ; https://www.medikalakademi.com.tr/obezite-prevelans-toplum-risk/

Doğrulanmadı (bilgi birikiminden; metinde işaretli): Dempsey 2016 Diabetes Care; Quinn 2011 Diabetes Care (BlueStar); Lavery 2007 / Armstrong 2007 sıcaklık izlemi RCT'leri; Armstrong 2017 NEJM ülser riski; Ford 2010 BMJ (Mandometer); Robinson 2014 yeme hızı meta-analizi; Watson 2018 LIFTMOR; Bassey 1994; Bolk 2010 levotiroksin zamanlaması; Tasali 2022 JAMA IM; Petersen 2021 SENZA-PDN; Plenity GLOW; ISO 15197:2013; WHO T1D ve obezite sayıları; FRACTURK.
