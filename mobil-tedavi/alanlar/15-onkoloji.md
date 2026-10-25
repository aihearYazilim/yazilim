# Onkoloji — Cihazla tedavi edilen hastalıklar ve telefonla tedavi fikirleri

> Not: Bu oturumda WebSearch kotası dolu olduğu için doğrulama, Europe PMC REST API ve PMC üzerinden doğrudan kaynak çekerek yapıldı. App Store / Google Play taraması yapılamadı; "mevcut uygulama" bilgileri literatürdeki RCT'ler ve bilinen ürünlerle sınırlıdır. Doğrulanamayan her iddia "doğrulanmadı" diye işaretlenmiştir.

Kısa çerçeve: Onkolojide cihazlar üç işi yapar: (1) tümöre doğrudan etki (TTFields), (2) toksisiteyi fiziksel olarak önleme (soğutma, lazer, kompresyon, elektrik), (3) semptomu davranışsal/bilişsel yoldan yönetme (ePRO, CBT-I, dijital terapötik, egzersiz). Telefon **1 ve 2'yi hiç yapamaz**; 3'ü birebir ya da güçlendirilmiş biçimde yapabilir. Bu alanın en güçlü kanıtı da zaten 3. gruptadır: Basch 2017'de ePRO semptom takibi metastatik hastada medyan sağkalımı 26,0 → 31,2 aya çıkardı (HR 0,83). Fikirler buna odaklanır.

## 1. Alanda cihazla tedavi edilen hastalıklar (envanter)

| Hastalık / semptom | Kullanılan cihaz | Etki mekanizması | Telefon üretebilir mi? | Not |
|---|---|---|---|---|
| Kemoterapi bulantı-kusması (CINV) | Reliefband (P6 bileği elektrik akupunktur uyarımı, FDA 510(k) — üretici beyanı, bu oturumda belge doğrulanmadı); Sea-Band (basınç bandı) | PC6 noktasına elektriksel/mekanik uyarı → vagal modülasyon | **Hayır** (akım yok, basınç yok). Davranışsal kısım **birebir**: kendi parmağıyla akupresür rehberi, gevşeme, sistematik duyarsızlaştırma | Meta-analiz: PC6 elektrik uyarımı CINV'yi azaltıyor (Garcia 2021, Med Acupunct). Beklenti bulantısında sistematik duyarsızlaştırma RR 0,60 (Kobayashi 2024) |
| Kemoterapi periferik nöropatisi (CIPN) — önleme | Soğutma eldiveni/çorabı (Elasto-Gel vb.) | Soğukla damar daralması → paklitaksel el/ayağa daha az ulaşır | **Hayır** (soğutma yok) | Hanai 2018 JNCI: 36 hasta, dokunma duyusu kaybı el %80,6 → %27,8; öznel semptom %41,7 → %2,8 |
| CIPN — önleme (egzersiz) | Denetimli sensorimotor eğitim (SMT), tüm vücut vibrasyon platformu (WBV) | Nöromüsküler/proprioseptif eğitim; vibrasyonla duyusal uyarı | SMT **birebir** (IMU ile denge görevi yönlendirme); WBV **hayır** (genlik/kütle yok) | Streckmann 2024 JAMA Intern Med: 158 hasta; CIPN insidansı SMT %30,0 vs WBV %41,2 vs olağan bakım %70,6 (p=0,002) |
| CIPN — tedavi (ağrı) | Scrambler terapi (Calmare MC-5A, FDA 510(k)) | Cilt elektrotlarıyla "ağrısız" sinyal göndererek ağrı sinyalini maskeleme | **Hayır** | Kanıt tabanı tutarsız; sistematik derlemeler (Aldawahreh 2026; Cho 2026) küçük, heterojen çalışmalar bildiriyor |
| CIPN — tarama/izlem | Diyapazon (Rydel-Seiffer), monofilaman | Vibrasyon algı eşiği ölçümü | **Zayıf ama anlamlı**: telefon titreşim motoruyla vibrasyon eşiği (Adenekan 2026 J Diabetes Sci Technol; diyapazonla r=-0,43, diyabette) | Ölçüm tek başına tedavi değil; doz azaltma kapalı döngüsünün parçası olursa sayılır |
| Kemoterapi saç dökülmesi | Soğuk başlık sistemleri (Paxman, DigniCap; FDA cleared) | Kafa derisi soğutma → folikül kan akımı azalır | **Hayır** | Çok sayıda gözlemsel/RCT (ör. Kwok 2026 Sci Rep jinekolojik kanser RCT) |
| Lenfödem (meme kanseri sonrası, ~%20) | Pnömatik kompresyon pompası (Flexitouch vb.), kompresyon giysisi | Mekanik basınçla lenf drenajı | **Hayır** (basınç yok). Kendi-eliyle lenf drenajı, egzersiz, kol çevresi kamera ölçümü **zayıf** | IPC RCT'leri karışık (Newaz 2026; O'Donnell 2026 derleme) |
| Kansere bağlı yorgunluk | Egzersiz programları (gözetimli), parlak ışık kutusu (10.000 lux) | Fiziksel kapasite + sirkadiyen ritim düzenleme | Egzersiz koçluğu **birebir**; ışık **zayıf** (ekran 500–1500 nit; 10.000 lux için göz hizasında ~10 cm gerekir, pratik değil) | Mustian 2017 JAMA Oncol meta-analiz: egzersiz ES 0,30, psikolojik 0,27, ilaç 0,09 (anlamsız). Johnson 2018 J Cancer Surviv: parlak ışık, 28 gün, d=0,30 |
| Kanser ağrısı | TENS cihazı | Kapı-kontrol, elektriksel analjezi | **Hayır** (akım yok). Ağrı ePRO + opioid titrasyon koçluğu **birebir** | TENS kanıtı yetersiz (Cochrane; bu oturumda doğrulanmadı). ePAL app RCT (Kamdar 2024 JPSM): BPI 4,28 → 3,16; ağrı nedenli yatış %23,2 → %7,1 |
| Kansere bağlı uykusuzluk | Dijital CBT-I (SHUTi, Sleepio, Somryst — FDA onaylı olanlar var) | Uyku kısıtlama, uyaran kontrolü, bilişsel yeniden yapılandırma | **Birebir** | Zachariae 2018 JNCI: 255 meme kanseri sağkalanı, insomnia şiddeti d=1,17; Do 2026 JAMA Netw Open: kemoterapi sırasında kısa CBT-I ISI −2,19, 1.500 lux ışık gözlüğü anlamsız |
| Oral mukozit | Düşük seviye lazer / fotobiyomodülasyon (PBM, MASCC/ISOO kılavuzunda öneriliyor — kılavuz metni bu oturumda doğrulanmadı) | Kırmızı/kızılötesi ışıkla mitokondriyal uyarı, inflamasyon azalması | **Hayır** (flaş beyaz LED, terapötik dalga boyu ve enerji yoğunluğu yok). Ağız bakımı protokolü + kamera takibi **zayıf** | Hatırlatma uygulaması RCT'si: Rades RAREST-02 (baş-boyun RT toksisitesi) |
| Anksiyete / depresyon (kanser) | Dijital terapötik (CBSM uygulaması; Blue Note Therapeutics "attune" — ürün adı doğrulanmadı) | Bilişsel-davranışçı stres yönetimi | **Birebir** | Zion 2023 JCO Oncol Pract: 449 hasta, anksiyete ve depresyonda sham'a üstün; Taub 2024 J Consult Clin Psychol |
| Nefes darlığı (ileri evre) | El fanı (yüze hava akımı) | Trigeminal V2 soğuk-hava uyarımı | **Hayır** (hava akımı yok). Nefes teknikleri + anksiyete koçluğu **zayıf** | Galbraith 2010 JPSM crossover: yüze fan anlamlı (p=0,003); Yu 2026 meta-analiz: yalnız kısa vadeli etki (SMD −0,41) |
| Kemo-beyin (bilişsel bozukluk) | Web tabanlı bilişsel eğitim (Insight/BrainHQ) | Bilişsel egzersiz, nöroplastisite | **Birebir** | Bray 2017 JCO: 242 hasta, algılanan bilişsel bozukluk 6 ayda kalıcı iyileşme (p<0,001). Ürün zaten var |
| Semptom raporlama (ePRO) | Tablet/web ePRO sistemleri (Moovcare — CE, Fransa'da geri ödemeli; Kaiku Health; Noona; Cankado; Carevive — bazıları doğrulanmadı) | Erken semptom yakalama → erken müdahale → daha az yatış, daha uzun tedavi süresi | **Birebir** (hatta pasif sensörlerle **daha iyi**) | Basch 2017 JAMA: 766 hasta, medyan OS 31,2 vs 26,0 ay, HR 0,83; Denis 2017 JNCI (akciğer, web takip): 19,0 vs 12,0 ay, HR 0,32; PRO-TECT (Basch 2022 JAMA): fiziksel işlev, semptom kontrolü, HRQOL iyileşti; OS henüz yok |
| Sıcak basması (endokrin tedavi) | — (dijital hipnoz/CBT uygulamaları: Caria, Evia — Evia doğrulanmadı) | Bilişsel-davranışçı / hipnoz | **Birebir** | Duffecy 2025 JMIR mHealth: Caria, 149 kadın, sıcak basma şiddeti düştü (p=0,007); kansere özgü değil |
| Glioblastom | Optune (TTFields, 200 kHz alternatif elektrik alanı, kafa derisi elektrotları) | Mitoz sırasında tübülin dipol bozulması | **Hayır** | Stupp 2017 JAMA EF-14: medyan OS 20,9 vs 16,0 ay, HR 0,63 |
| Sol meme radyoterapisi — kalp koruma | Derin inspiryum nefes tutma (DIBH) sistemleri: ABC spirometre, yüzey kılavuzlu RT (SGRT) | Nefes tutmayla kalbi ışın alanından uzaklaştırma; hasta eğitimi gerektirir | Klinik sistemi **hayır**; **ev antrenmanı** kamera/IMU ile **zayıf ama anlamlı** | Lastrucci 2026 scoping: antrenman dozimetriyi, tekrarlanabilirliği ve kurulum süresini iyileştiriyor; Huybrechts 2026: bilişsel görev nefes tutmayı +15–19 s uzatıyor |
| Baş-boyun kanseri — trismus/disfaji | TheraBite çene cihazı, sEMG yutma biofeedback | Mekanik germe; kas biofeedback | Germe kuvveti **hayır**; egzersiz yönlendirme + kamera ağız açıklığı ölçümü **zayıf** | mHealth H&N rehabilitasyonu meta-analizi var (Xiao 2026) |

## 2. Proje fikirleri (telefon tek başına)

Ortak hasta havuzu: Dünya 2022'de ~20 milyon yeni kanser vakası, 9,7 milyon ölüm (Bray 2024, GLOBOCAN 2022). Türkiye: GLOBOCAN 2020'de ~234 bin yeni vaka (2022 rakamı bu oturumda doğrulanamadı; ~240 bin tahmini). Sistemik tedavi alanların oranı kabaca yarısı.

### Fikir 1: NÖBETÇİ — Pasif sensör + ePRO kapalı döngü semptom yönetimi
- **Hedef hastalık ve hasta sayısı:** Metastatik/sistemik tedavi gören tüm solid tümörler. Türkiye'de yılda ~100–120 bin kemoterapi/immünoterapi başlayan hasta; dünyada ~10 milyon (kaba tahmin, GLOBOCAN oranlarından).
- **Taklit edilen cihaz ve mekanizma:** Tablet/web ePRO sistemleri (Basch 2017 modeli). Mekanizma: haftalık semptom raporu → eşik aşımında hemşire uyarısı → erken müdahale (hidrasyon, antiemetik, doz ayarı) → daha az acil başvuru, kemoterapinin daha uzun sürdürülebilmesi → sağkalım.
- **Telefonda nasıl çalışır:** (a) Haftalık 12 soruluk PRO-CTCAE Türkçe anketi. (b) **Pasif katman**: adım sayısı (IMU; Brouwer 2025 JCO CCI: 7 gün içinde plansız yatışı AUC 0,88 ile öngörüyor; Manz 2024: her 1.000 adım düşüşü yatış/ölüm olasılığını %16 artırıyor), gece hareketsizlik (uyku), telefon kullanım ritmi, isteğe bağlı 30 sn kamera PPG (kalp hızı/HRV: ateş-dehidrasyon ipucu), kısa sesli günlükten konuşma enerjisi. (c) Anket cevaplanmasa bile pasif sinyal bozulunca uygulama "bugün nasılsın?" diye 3 soruluk mikro-anket açar; cevap yoksa hemşire paneline sarı bayrak. (d) Semptom eşiği aşılınca hasta tarafında standart öz-bakım kartı (ör. bulantı → antiemetik kullan + sıvı + 4 saatte tekrar sor) ve klinik tarafında uyarı. Günde 0–2 dk aktif kullanım, tedavi boyunca (6–12 ay).
- **Kanıt:** Cihaz/ePRO: Basch 2017 JAMA (OS 31,2 vs 26,0 ay, HR 0,83), Denis 2017 JNCI (19,0 vs 12,0 ay), PRO-TECT 2022 JAMA (HRQOL/semptom kontrolü, OS beklemede). Pasif sensör katmanı için öngörü kanıtı var (Brouwer 2025, Manz 2024), **müdahale RCT'si yok**. PROStep (Manz 2023) adım + PRO birleşimini denedi ama birincil sonlanım (hekimin anlama algısı) anlamsızdı; uyum anket %64, adım %53.
- **Mevcut uygulamalar:** Kaiku Health, Noona, Moovcare (CE, akciğer), Cankado, Carevive (bazıları Türkiye'de yok). Hepsi **aktif anket** temelli. Fark: pasif sinyal füzyonuyla "anketi doldurmayan hasta" problemini çözmek, Türkçe PRO-CTCAE, TİTCK-uyumlu hemşire paneli. ePRO'nun kendisi "zaten var"; pasif tetikleyici kapalı döngü yok.
- **Teknik zorluklar ve çözüm:** Telefon cepte değilse adım kaybolur → "telefonu taşıma oranı" ile normalize et, yalnız 3 günlük eğilim kullan. Yanlış pozitif → sarı/kırmızı iki kademe, kırmızı yalnız anket + pasif birlikte. Klinik tarafta kimin bakacağı → semptom hemşiresi iş akışı şart; bu uygulamanın değil, kurumun sorunu.
- **Regülasyon:** SaMD sınıf IIa (CE-MDR; klinik karar desteği), FDA muhtemelen Class II. Türkiye'de TİTCK ÜTS kaydı. Pasif tetikleyicinin RCT'si gerekir (sağkalım değil, acil başvuru/yatış sonlanımı yeterli).
- **Riskler:** Yanlış güven (uygulama "iyi" dedi diye acile gitmeme) → her ekranda "ateş ≥38 ise hemen ara" sabit uyarısı. Veri gizliliği (KVKK).
- **Puanlama:** Teknik 8 | Kanıt 8 | Etki 10 | Yenilik 6 | Düşük risk 7 | **TOPLAM 39/50**

### Fikir 2: BULANTI SAATİ — Beklenti bulantısı için kür-zamanlı sistematik duyarsızlaştırma
- **Hedef hastalık ve hasta sayısı:** Beklenti (antisipatuar) bulantı-kusma: orta-yüksek emetojenik kemoterapi alanların ~%20–30'u (MASCC/ESMO; Dupuis 2017). Türkiye'de yılda ~20–30 bin, dünyada ~2–3 milyon hasta.
- **Taklit edilen cihaz ve mekanizma:** Reliefband/P6 akupresür bandının **elektrik/basınç kısmı taklit edilemez**. Taklit edilen: klinikte psikologun uyguladığı sistematik duyarsızlaştırma (gevşeme + hiyerarşik hayali maruz bırakma) ve progresif kas gevşetme (PMR). Mekanizma: klasik koşullanmış bulantıyı söndürme + parasempatik aktivasyon.
- **Telefonda nasıl çalışır:** (1) Kür takvimi girilir; uygulama kürden 3 gün önce başlayan 10 dakikalık "söndürme" seansları planlar: hoparlörden yönlendirmeli PMR, titreşim motoruyla 6 nefes/dk haptik nefes ritmi (elde/cepte), ekranda kliniğe gidiş–damar yolu–ilaç kokusu hiyerarşisi için hayali maruz bırakma. (2) Kamera PPG ile seans başı/sonu HRV ölçülür; HRV artışı görülmeyen hastada seans uzatılır (biofeedback). (3) Kür günü klinikte 3 dakikalık "acil" protokol (gevşeme + kendi parmağıyla P6 akupresür rehberi — basıncı hasta kendisi uygular, telefon sadece noktayı ve süreyi gösterir). (4) Her kür sonrası bulantı günlüğü; koşullanma skoru düşmezse hekime "antiemetik ön-yükleme / lorazepam" önerisi bildirimi. 10 dk/gün, kür başına 4–5 gün, 4–6 kür.
- **Kanıt:** Cihaz/klinik: Kobayashi 2024 Int J Clin Oncol meta-analiz: sistematik duyarsızlaştırma beklenti bulantısı RR 0,60, kusma RR 0,54 (yüksek yanlılık riski, 2 çalışma); Hunter 2020 Cancer Med hemşire uygulamalı davranışsal müdahale RCT. Telefon versiyonu: **yok**. Yakın: "Managing at Home" ciddi oyun (Loerzel 2024, protokol; eğitim amaçlı, duyarsızlaştırma değil).
- **Mevcut uygulamalar:** Genel meditasyon/PMR uygulamaları (Calm, Headspace) kür takvimine bağlı değil ve maruz bırakma hiyerarşisi yok. Beklenti bulantısına özgü dijital terapötik **bulunamadı** (App Store taraması yapılamadı, doğrulanmadı).
- **Teknik zorluklar ve çözüm:** Kamera PPG klinikte titreme/ışıkla bozulur → PPG isteğe bağlı, çekirdek protokol sensörsüz çalışır. Hoparlör sesi kemoterapi salonunda rahatsız edebilir → metin+haptik mod.
- **Regülasyon:** Davranışsal dijital terapötik; CE-MDR sınıf I–IIa, FDA 510(k) muhtemel (Somryst emsali). Pilot RCT (n≈120, sonlanım: 3. kürde beklenti bulantısı insidansı) gerekir.
- **Riskler:** Düşük. Hayali maruz bırakma kaygıyı artırabilir → seans "durdur" tuşu; ağır psikiyatrik komorbidite dışlanır.
- **Puanlama:** Teknik 9 | Kanıt 6 | Etki 7 | Yenilik 8 | Düşük risk 9 | **TOPLAM 39/50**

### Fikir 3: DENGE KOÇU — CIPN önleme için evde sensorimotor eğitim + titreşim eşiği kapalı döngüsü
- **Hedef hastalık ve hasta sayısı:** Oksaliplatin, taksan, vinka alkaloidi alan hastalar (kolorektal, meme, akciğer, lenfoma): Türkiye'de yılda ~40–50 bin, dünyada ~4 milyon; CIPN insidansı %30–70, 6 ayda kalıcı ~%30.
- **Taklit edilen cihaz ve mekanizma:** (a) Soğutma eldiveni **taklit edilemez**. (b) Gözetimli sensorimotor eğitim (SMT, Streckmann 2024) **birebir**: kararsız zemin/tek ayak denge görevleri, haftada 2×15–30 dk. (c) WBV platformu **taklit edilemez**. (d) Diyapazon vibrasyon eşiği: telefon LRA motoruyla **zayıf ama anlamlı** ölçüm (Adenekan 2026).
- **Telefonda nasıl çalışır:** (1) Telefon göğüs cebinde ya da elde; IMU ile sallanma genliği ölçülür, ekran/ses "gözler kapalı, tek ayak, 30 sn" gibi progresif denge görevleri verir, başarıya göre zorluk artar (motor öğrenme). (2) Haftada bir "titreşim testi": telefon ayak başparmağına/parmak ucuna konur, artan genlikte titreşim verilir, hasta hissedince ekrana dokunur → eşik kaydedilir. (3) Eşik 2 ardışık testte bazalin >%X üstüne çıkarsa veya EORTC CIPN20 skoru artarsa hekime "doz gözden geçir" bildirimi (**kapalı döngü**: ölç → doz değiştir → kalıcı nöropati önle). 20 dk, haftada 3, kemoterapi süresince (3–6 ay).
- **Kanıt:** Cihaz/klinik: Streckmann 2024 JAMA Intern Med (CIPN %30,0 vs %70,6, n=158, gözetimli); Lin 2026 meta-analiz SMT olumlu. Telefon versiyonu: **yok** (ev tabanlı, uygulama yönlendirmeli SMT RCT'si bulunamadı). Vibrasyon eşiği için diyabet verisi var (Adenekan 2026), kanser hastasında **yok**.
- **Mevcut uygulamalar:** Genel denge/düşme önleme uygulamaları (ör. yaşlılar için) var; kemoterapi takvimli, nöropati-eşik kapalı döngülü uygulama **bulunamadı**.
- **Teknik zorluklar ve çözüm:** Telefon vibrasyon genliği modeller arası farklı → cihaz başı kalibrasyon ve yalnız hasta-içi değişim kullanma. Düşme riski → duvar/sandalye yanında yapma talimatı, IMU ani düşüş algılarsa seansı durdur.
- **Regülasyon:** Egzersiz kısmı sınıf I; doz önerisi bildirimi karar desteği olarak IIa (CE-MDR). Pilot RCT gerekir.
- **Riskler:** Düşme; ciddi nöropatisi olan hastada ileri görevler kapatılır. Vibrasyon eşiği yanlış negatifse hekim doz azaltmayı geciktirebilir → "yalnız destekleyici bilgi" etiketi.
- **Puanlama:** Teknik 7 | Kanıt 7 | Etki 8 | Yenilik 8 | Düşük risk 7 | **TOPLAM 37/50**

### Fikir 4: NEFES TUT ANTRENÖRÜ — Sol meme radyoterapisi öncesi evde DIBH eğitimi
- **Hedef hastalık ve hasta sayısı:** Sol meme/göğüs duvarı radyoterapisi alan hastalar (meme kanseri dünyada 2,3 milyon/yıl, yaklaşık yarısı sol taraf ve RT alır → ~800 bin; Türkiye ~12–15 bin/yıl). Ayrıca karaciğer/akciğer SBRT.
- **Taklit edilen cihaz ve mekanizma:** ABC spirometre ve SGRT kameraları (klinikte). Mekanizma: hastanın tekrarlanabilir, 20–30 sn derin nefes tutmayı öğrenmesi; eğitim alan hasta daha iyi dozimetri, daha kısa kurulum (Lastrucci 2026; Kefeli 2025 Support Care Cancer: koçluk LAD dozunu düşürdü).
- **Telefonda nasıl çalışır:** Telefon göğüs üstüne yatay konur; IMU (ivmeölçer) göğüs yükselmesini ölçer, ya da ön kamera göğüs/omuz hareketini izler. Ekranda hedef bant (klinikte belirlenen inspiryum derinliği, kaba kalibrasyon) ve geri sayım; hoparlörden "nefes al – tut – ver" komutları; nefes tutma sırasında ekranda basit bilişsel görev (Huybrechts 2026: bilişsel meşguliyet tutmayı +15–19 s uzatıyor). Günde 2×5 dk, simülasyondan önce 1–2 hafta.
- **Kanıt:** Cihaz: DIBH kalp dozu azaltması iyi kanıtlı; eğitimin faydası scoping review düzeyinde (12 çalışma, çoğu küçük). Telefon versiyonu: **yok** (literatürde uygulama tabanlı ev DIBH RCT'si bulunamadı; bazı kliniklerin video/broşürü var).
- **Mevcut uygulamalar:** Bilinen tüketici uygulaması **yok** (doğrulanmadı). Genel nefes egzersizi uygulamaları DIBH hedeflemiyor.
- **Teknik zorluklar ve çözüm:** IMU'nun mutlak hacim ölçmemesi → klinikte ABC/SGRT ile bir kez kalibre et; sadece tekrarlanabilirlik (varyasyon katsayısı) hedeflenir. Uyku/obez hastada sinyal zayıf → ön kamera yedeği.
- **Regülasyon:** Eğitim yazılımı, sınıf I (CE) / FDA genel sağlık; klinik karar vermiyor. Küçük RCT (sonlanım: simülasyon süresi, kalp ortalama dozu) yeterli.
- **Riskler:** Çok düşük. KOAH'ta baş dönmesi → oturarak yapma.
- **Puanlama:** Teknik 8 | Kanıt 5 | Etki 6 | Yenilik 8 | Düşük risk 9 | **TOPLAM 36/50**

### Fikir 5: IŞIK REÇETESİ — Yorgunluk için sabah ışık dozu ve aktivite ritmi koçluğu
- **Hedef hastalık ve hasta sayısı:** Kansere bağlı yorgunluk: tedavi sırasında %60–90, sağkalanlarda ~%30 kalıcı. Türkiye'de ~100 bin, dünyada ~10 milyon.
- **Taklit edilen cihaz ve mekanizma:** 10.000 lux parlak ışık kutusu (sirkadiyen ritim stabilizasyonu) + gözetimli egzersiz. Ekran **zayıf** (1.500 nit tepe, 30 cm'de kabaca 1.000–2.000 lux; Do 2026'da 1.500 lux gözlük genel popülasyonda etkisiz çıktı). Bu yüzden telefon ışık **üretmez**, ışık **reçeteler**: ortam ışığı sensörü ile günlük lux-saat ölçer ve kullanıcıyı sabah dış mekân ışığına (gölgede 10.000+ lux) yönlendirir.
- **Telefonda nasıl çalışır:** Ortam ışığı + GPS ile sabah 07–10 arası dış mekân dakikası sayılır; hedef 30 dk (Johnson 2018 protokolü). IMU ile adım/aktivite ve gece hareketsizlik ölçülür; rest-activity ritmi (Kleckner 2026 Chronobiol Int yorgunlukla ilişkili) hesaplanır. Düşük ritim günlerinde "sabah 20 dk yürüyüş + ışık" tek bildirim; aşırı-az aktivite günlerinde pacing önerisi. Haftalık yorgunluk (BFI) ile kapalı döngü. 4–8 hafta.
- **Kanıt:** Cihaz: Johnson 2018 (d=0,30, 81 hasta); egzersiz Mustian 2017 (ES 0,30). Telefon versiyonu: Untire uygulaması (Spahrkäs 2020/2022, n=799) yorgunlukta etkili ama psikoeğitim/CBT temelli; ışık-dozu ve ritim koçluğu yapan onkoloji uygulaması **bulunamadı**.
- **Mevcut uygulamalar:** Untire (CBT/psikoeğitim) **var** → bu fikir yalnızca ışık+ritim kapalı döngüsüyle farklıysa önerilmeli; aksi hâlde "zaten var".
- **Teknik zorluklar:** Ortam ışığı sensörü cepteyken ölçmez → GPS/konum ve zaman dilimiyle tahmin; kullanıcıdan "dışarıdayım" onayı.
- **Regülasyon:** Sınıf I / wellness; RCT küçük ölçekli yeterli.
- **Riskler:** Düşük; bipolar bozuklukta sabah ışığı mani tetikleyebilir → tarama sorusu.
- **Puanlama:** Teknik 8 | Kanıt 5 | Etki 7 | Yenilik 6 | Düşük risk 8 | **TOPLAM 34/50**

### Fikir 6: AĞIZ GÖZCÜSÜ — Mukozit için kamera derecelendirmeli ağız bakımı kapalı döngüsü
- **Hedef hastalık ve hasta sayısı:** Oral mukozit: baş-boyun RT'de ~%80, standart kemoterapide ~%40, kök hücre naklinde ~%75. Türkiye'de ~30 bin, dünyada ~3 milyon/yıl.
- **Taklit edilen cihaz ve mekanizma:** PBM lazer **taklit edilemez** (telefon flaşı beyaz LED, ~0 J/cm² terapötik enerji). Taklit edilen: hemşire ağız değerlendirmesi (WHO/OMAS skoru) + yapılandırılmış ağız bakımı protokolü (tuz-soda gargara, ağrı basamağı, beslenme) → erken ağrı/beslenme müdahalesi.
- **Telefonda nasıl çalışır:** Günde 1 arka kamera + flaş ağız içi fotoğrafı; yapay zekâ ile eritem/ülser alanı tahmini (öz-değerlendirme + fotoğraf). Günlük ağrı, yutma, kilo girişi. Skor eşiğinde: hasta için ağrı basamağı kartı, klinik için "beslenme konsültasyonu / opioid" uyarısı. Günde 3 dk, RT boyunca 7 hafta.
- **Kanıt:** Hatırlatma uygulaması RCT: Rades RAREST-02 (BMC Cancer 2022, baş-boyun RT akut toksisite; sonuç bu oturumda doğrulanmadı). Kamera derecelendirmesi için kanıt **yok**.
- **Mevcut uygulamalar:** Genel ePRO platformları mukozit modülü içerebilir; kamera derecelendirmeli kapalı döngü **bulunamadı**.
- **Teknik zorluklar:** Ağız içi fotoğraf kalitesi, ışık → rehberli çekim şablonu; sınıflandırıcı için etiketli veri gerekir.
- **Regülasyon:** Görüntü tabanlı derecelendirme karar desteği → IIa; validasyon çalışması gerekir.
- **Riskler:** Yanlış düşük skor → tedavi gecikmesi; skor yalnız hasta beyanıyla birlikte kullanılır.
- **Puanlama:** Teknik 6 | Kanıt 4 | Etki 6 | Yenilik 7 | Düşük risk 8 | **TOPLAM 31/50**

### Fikir 7: KÜR-UYKU — Kemoterapi döngüsüne uyarlanmış kısa CBT-I
- **Hedef:** Kemoterapi sırasında uykusuzluk (%40–60). Mevcut dijital CBT-I ürünleri (Sleepio, Somryst, SHUTi) **var**; Zachariae 2018 kansere özgü iCBT-I'nin etkisini gösterdi. Fark: kür günlerinde steroid kaynaklı uykusuzluğu ve gündüz yorgunluğu hesaba katan, uyku kısıtlamasını kür haftasında gevşeten takvim-uyarlı protokol (Do 2026: kemoterapi sırasında kısa CBT-I işe yarıyor). Yenilik düşük-orta; "zaten var" sınırında. İsteğe bağlı: Fikir 1'in modülü olarak.
- **Puanlama:** Teknik 9 | Kanıt 8 | Etki 7 | Yenilik 3 | Düşük risk 9 | **TOPLAM 36/50** (yenilik düşük olduğu için ilk 3'e girmez)

### Fikir 8: AĞRI DÖNGÜSÜ — Kanser ağrısı için ePAL benzeri opioid titrasyon koçluğu
- **Hedef:** İleri evre kanser ağrısı (%66). TENS **taklit edilemez**. ePAL (Kamdar 2024) ağrı skorunu 1,1 puan düşürdü, ağrı nedenli yatışı %23 → %7'ye indirdi; ancak ePAL ticari ürün değil (araştırma uygulaması). Türkçe, SUT-uyumlu, hekim onaylı kurtarma dozu kuralı ile Fikir 1'e modül olarak eklenmeli. Tek başına yenilik orta.
- **Puanlama:** Teknik 8 | Kanıt 7 | Etki 8 | Yenilik 5 | Düşük risk 5 (opioid) | **TOPLAM 33/50**

## 3. Alanın en iyi 3 fikri (sıralı) ve gerekçe

1. **Fikir 1 — NÖBETÇİ (pasif sensör + ePRO kapalı döngü), 39/50.** Onkolojide sağkalım etkisi gösterilmiş tek "yazılım" müdahalesi ePRO'dur (Basch 2017, Denis 2017). Telefon bunu tabletten daha iyi yapar: anket uyumu düştüğünde (PROStep'te %64) adım/uyku/PPG pasif sinyalleri açığı kapatır. Etki en yüksek, kanıt en güçlü; yenilik ePRO'nun kendisinde değil pasif tetikleyicide.
2. **Fikir 2 — BULANTI SAATİ, 39/50.** Reliefband'ın elektriği taklit edilemez ama beklenti bulantısı tamamen koşullanma kaynaklı; klinikte kanıtlı sistematik duyarsızlaştırmayı kür takvimine bağlı, haptik-nefes destekli, HRV geri bildirimli bir uygulamaya taşımak teknik olarak kolay, riski çok düşük ve pazarda yok.
3. **Fikir 3 — DENGE KOÇU (CIPN), 37/50.** Streckmann 2024'ün %70 → %30 insidans düşüşü büyük ama gözetimli fizyoterapi gerektiriyor; IMU yönlendirmeli ev versiyonu ölçeklenebilir. Telefon titreşim eşiği ile doz-ayarı uyarısı gerçek bir kapalı döngü ekler. Kanıt henüz telefon için yok, bu yüzden 3. sırada.

Fikir 4 (DIBH antrenörü) 36 puanla yakın; hasta havuzu daha dar olduğu için ilk 3 dışında kaldı.

## 4. "Yapılamaz" diye elenenler (bir satır gerekçe)

- **TTFields / Optune:** 200 kHz, 1–3 V/cm elektrik alanı; telefon elektrik alanı üretemez.
- **Soğuk başlık (Paxman, DigniCap):** Kafa derisini 18–22 °C'ye soğutma; telefonda soğutma yok.
- **Soğutma eldiveni/çorabı (CIPN, el-ayak sendromu):** Aynı gerekçe.
- **Fotobiyomodülasyon / düşük seviye lazer (mukozit):** 630–830 nm, 1–4 J/cm² gerekir; flaş beyaz LED, dalga boyu ve enerji yoğunluğu yok.
- **Pnömatik kompresyon (lenfödem):** 30–60 mmHg mekanik basınç; telefon basınç uygulayamaz.
- **TENS (kanser ağrısı) ve Scrambler terapi (CIPN):** Cilde elektrik akımı; telefon akım veremez.
- **Reliefband'ın elektriksel P6 uyarımı:** Aynı; yalnız kendi parmağıyla akupresür rehberi mümkün (Fikir 2 içinde).
- **El fanı (dispne):** Yüze hava akımı; telefon hava üretmez. Nefes/kaygı koçluğu yapılabilir ama kanıt kısa vadeli ve zayıf, ayrı fikir olarak önerilmedi.
- **10.000 lux ışık kutusu (yorgunluk/uyku):** Ekran 1.500 nit, göz hizasında ~10 cm'de ancak kısmen; Do 2026'da 1.500 lux bile etkisiz. Yalnız "ışık reçeteleme" (Fikir 5) mümkün.
- **Tüm vücut vibrasyon platformu (CIPN):** Telefon haptiği derin doku/kütle uyarımı yapamaz.
- **Elektrolarenks (larenjektomi sonrası ses):** Telefon titreşim motoru boyun dokusunu titreştirecek genliğe sahip değil; konuşma sentezi (AAC) zaten var.
- **TheraBite (trismus):** Mekanik germe kuvveti yok; egzersiz yönlendirme mümkün ama kanıt yok, ayrı fikir yapılmadı.
- **Kemo-beyin bilişsel eğitim ve genel dijital CBT-I / anksiyete DTx:** Teknik olarak birebir ama ürünler **zaten var** (Insight/BrainHQ; Sleepio/Somryst; CBSM uygulaması Zion 2023); fark yoksa önerilmedi.
- **Sıcak basması dijital hipnoz/CBT:** Caria RCT'si var (kansere özgü değil); meme kanseri için yerelleştirme yenilik sayılmaz.

## 5. Kaynaklar (URL)

- Basch E et al. Overall survival results of a trial assessing PROs for symptom monitoring. JAMA 2017. https://pmc.ncbi.nlm.nih.gov/articles/PMC5817466/
- Basch E et al. Effect of electronic symptom monitoring on PROs among patients with metastatic cancer (PRO-TECT). JAMA 2022;327:2413. https://doi.org/10.1001/jama.2022.9265
- Denis F et al. Randomized trial comparing a web-mediated follow-up with routine surveillance in lung cancer. JNCI 2017. https://doi.org/10.1093/jnci/djx029
- Hanai A et al. Effects of cryotherapy on objective and subjective symptoms of paclitaxel-induced neuropathy. JNCI 2018;110:141. https://doi.org/10.1093/jnci/djx178
- Streckmann F et al. Preventive effect of neuromuscular training on chemotherapy-induced neuropathy. JAMA Intern Med 2024;184:1046. https://doi.org/10.1001/jamainternmed.2024.2354
- Adenekan RAG et al. Smartphone-based app to assess diabetic peripheral neuropathy. J Diabetes Sci Technol 2026. (Europe PMC kaydı; DOI doğrulanmadı)
- Stupp R et al. Effect of tumor-treating fields plus maintenance temozolomide vs temozolomide alone (EF-14). JAMA 2017;318:2306. https://doi.org/10.1001/jama.2017.18718
- Kobayashi M et al. Non-pharmacological treatments for anticipatory nausea and vomiting: systematic review and meta-analysis. Int J Clin Oncol 2024;29:889. https://doi.org/10.1007/s10147-024-02510-9 (DOI doğrulanmadı)
- Hunter JJ et al. Randomized trial of nurse-administered behavioral interventions for anticipatory nausea and vomiting. Cancer Med 2020.
- Garcia GT et al. Electrical stimulation of PC6 for CINV: systematic review and meta-analysis. Med Acupunct 2021.
- Mustian KM et al. Comparison of pharmaceutical, psychological, and exercise treatments for cancer-related fatigue: meta-analysis. JAMA Oncol 2017;3:961. https://doi.org/10.1001/jamaoncol.2016.6914
- Johnson JA et al. Bright light therapy improves cancer-related fatigue in cancer survivors: RCT. J Cancer Surviv 2018. https://doi.org/10.1007/s11764-017-0659-3 (DOI doğrulanmadı)
- Do TT et al. Cognitive behavior vs bright light therapy for insomnia in women undergoing chemotherapy for breast cancer: RCT. JAMA Netw Open 2026;9(8).
- Zachariae R et al. Internet-delivered CBT for insomnia in breast cancer survivors: RCT. JNCI 2018. https://doi.org/10.1093/jnci/djx293
- Spahrkäs SS et al. How does the Untire app alleviate cancer-related fatigue? Psycho-Oncology 2022;31:970.
- Bray VJ et al. Evaluation of a web-based cognitive rehabilitation program (Insight) in cancer survivors. J Clin Oncol 2017;35:217. https://doi.org/10.1200/JCO.2016.67.8201
- Zion SR et al. Effects of a cognitive behavioral digital therapeutic on anxiety and depression in patients with cancer: RCT. JCO Oncol Pract 2023;19:1179.
- Kamdar M et al. A digital therapeutic application (ePAL) to manage pain in patients with advanced cancer: RCT. J Pain Symptom Manage 2024;68:261.
- Galbraith S et al. Does the use of a handheld fan improve chronic dyspnea? RCT crossover. J Pain Symptom Manage 2010;39:831.
- Yu T et al. Fan therapy for alleviating dyspnea in adults: systematic review and meta-analysis. J Clin Nurs 2026;35:3670.
- Brouwer CG et al. Machine learning-based prediction of clinical outcomes using smartphone step count data. JCO Clin Cancer Inform 2025;9.
- Manz CR et al. Association of remote PROs and step counts with hospitalization or death (PROStep secondary analysis). J Med Internet Res 2024. / Manz CR et al. PROStep RCT. JCO Oncol Pract 2023.
- Lastrucci A et al. Learning to breathe for radiation therapy: scoping review of DIBH training. Crit Rev Oncol Hematol 2026;223. https://doi.org/10.1016/j.critrevonc.2026.105313
- Huybrechts V et al. Prolonging breath-hold duration in radiotherapy using cognitive engagement. Clin Transl Radiat Oncol 2026.
- Kefeli AU et al. Patient coaching for DIBH decreases set-up duration and LAD dose. Support Care Cancer 2025.
- Duffecy J et al. Evaluating a mobile digital therapeutic (Caria) for vasomotor symptoms: RCT. JMIR mHealth uHealth 2025;13.
- Loerzel V et al. Serious gaming for CINV in older adults: RCT protocol. JMIR Res Protoc 2024.
- Rades D et al. RAREST-02 reminder app trial, head-and-neck radiotherapy. BMC Cancer 2022.
- Bray F et al. Global cancer statistics 2022: GLOBOCAN. CA Cancer J Clin 2024. https://doi.org/10.3322/caac.21834
- IARC Global Cancer Observatory, Türkiye fact sheet (2022 rakamları bu oturumda okunamadı). https://gco.iarc.who.int/today/
- Dupuis LL et al. 2016 updated MASCC/ESMO consensus recommendations: anticipatory nausea and vomiting. Support Care Cancer 2017.
- Europe PMC REST API (tüm doğrulamalar): https://www.ebi.ac.uk/europepmc/webservices/rest/search
