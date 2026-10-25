# Spor Hekimliği — Cihazla tedavi edilen hastalıklar ve telefonla tedavi fikirleri

> Yöntem notu: 25 Ekim 2026'da 21 web araması yapıldı; "doğrulandı" ibaresi bu aramalarda teyit edilen kaynakları gösterir. Teyit edilemeyen rakam ve adlar **"doğrulanmadı"** diye işaretlendi; uydurma kaynak yoktur.
> Kısaltmalar: SRC = spora bağlı sarsıntı (concussion, hafif beyin sarsıntısı), ÖÇB = ön çapraz bağ, PFA = patellofemoral ağrı (diz kapağı önü ağrısı, "koşucu dizi"), EIB = egzersize bağlı bronkokonstriksiyon (egzersiz astımı), HRV = kalp hızı değişkenliği, PPG = fotopletismografi (kamera-flaş ile nabız), IMU = ivmeölçer+jiroskop, LESS = Landing Error Scoring System (iniş hatası puanlama sistemi), BCTT = Buffalo Concussion Treadmill Test (Buffalo sarsıntı koşu bandı testi), ESWT = ekstrakorporeal şok dalga tedavisi, GCT = yer temas süresi, RPE = algılanan zorlanma (Borg).
>
> **Fizik sınırı (net):** Telefon **soğuk/kompresyon** (Game Ready, pnömatik kriyo-kompresyon), **şok dalgası** (ESWT), **elektrik akımı** (NMES/TENS), **ısı**, **ultrason** üretemez. Spor hekimliğinde cihazla yapılan işin büyük kısmı zaten **egzersiz reçetesi, motor öğrenme, ritmik uyarı ve biofeedback**tir; bu yüzden alan, "telefon tek başına" açısından **yüksek verimli** bir alandır. Telefonun gerçek araçları: IMU (kadans, adım, denge, salınım), kamera (poz tahmini, baş/göz takibi, PPG ile nabız/HRV), hoparlör/titreşim (metronom, ritmik uyarı), mikrofon (nefes/öksürük/hırıltı), bildirim + kapalı döngü yazılım.

## 1. Alanda cihazla tedavi edilen hastalıklar (envanter)

| Hastalık | Kullanılan cihaz | Etki mekanizması | Telefon üretebilir mi? | Not |
|---|---|---|---|---|
| SRC — akut dönem (ilk 10 gün) | **Buffalo protokolü**: koşu bandı/bisiklet ile BCTT (semptom eşiği kalp hızı bulunur) + **göğüs kayışı nabız monitörü** ile evde eşiğin %80–90'ında günlük 20 dk aerobik egzersiz | Semptom-altı aerobik egzersiz → otonom/serebrovasküler düzenlenme; "kademeli maruz bırakma" | **Zayıf ama anlamlı** (eşik testi kamera-PPG + RPE + IMU kadans ile; sürekli nabız yok) | Leddy 2019 JAMA Pediatr RCT (n=103, 13–18 yaş): toparlanma medyan 13 vs 17 gün (p=0,009) — doğrulandı. Leddy 2021 Lancet Child Adolesc Health: kalıcı semptom riski %48 azaldı — doğrulandı. 2023 sistematik derleme: reçeteli egzersiz toparlanmayı ~5 gün kısaltıyor — doğrulandı. Bezherano 2020 (Clin J Sport Med): nabız monitörsüz reçete yöntemi tarif ediliyor — varlığı doğrulandı, içeriği doğrulanmadı. |
| SRC — kalıcı semptom (>10 gün; baş dönmesi, boyun ağrısı) | Fizyoterapist eşliğinde **servikovestibüler rehabilitasyon**; VOR (vestibülo-oküler refleks) x1/x2 egzersizleri, bakış sabitleme, denge; **VestAid** tablet uygulaması (Pittsburgh, kamera ile baş-göz hareketi; NCT06683417, henüz kayıt almıyor) | Vestibüler/okülomotor egzersiz → santral kompanzasyon, adaptasyon; motor öğrenme | **Birebir/zayıf** (ekran hedef + ön kamera baş açısı/hızı; göz takibi düşük çözünürlüklü) | Schneider 2014 BJSM RCT (n=31): 8 haftada spora dönüş olasılığı 10,27 kat (GA 1,51–69,56; geniş aralık) — doğrulandı. 2022 RCT derlemesi (PMC9819464): doz belirsiz — doğrulandı. Akıllı telefon RCT'si **yok**; "Eye Rehab" ticari uygulama kanıtsız — doğrulandı. |
| SRC — değerlendirme | **Sway Medical** (FDA 510(k) Class II; telefon ivmeölçeri ile denge/reaksiyon), C3 Logix (doğrulanmadı) | Ölçüm/izleme (tedavi değil) | **Birebir** (zaten telefon) | Sway 2013'ten beri FDA onaylı — doğrulandı. Yalnızca ölçüm; BRIEF'e göre tek başına hedef değil. |
| ÖÇB yaralanması — **birincil/ikincil önleme** | Nöromüsküler eğitim programları (**FIFA 11+**, PEP, Sportsmetrics); laboratuvarda 3D hareket analizi (Vicon), **OpenCap** (telefon tabanlı markersız 3D), Kinect tabanlı gerçek zamanlı geri bildirim | Motor öğrenme: iniş/kesme mekaniğinin (diz valgusu, düşük diz fleksiyonu) düzeltilmesi; kuvvet; pliyometrik | **Birebir** (program yönlendirme) + **zayıf ama anlamlı** (2D poz tahmini ile valgus/fleksiyon geri bildirimi) | Webster & Hewett 2018 (meta-analizlerin meta-analizi, 8 MA): tüm ÖÇB yaralanmalarında %50 azalma (OR 0,50; 0,41–0,59) — doğrulandı. Etki, uyuma (adherence) bağlı — doğrulandı. Kinect gerçek zamanlı geri bildirim: diz abdüksiyonu 6,16° azaldı, fleksiyon 13° arttı (n=24 kadın) — doğrulandı. OpenPose ile otomatik LESS: MAE 1,23, r=0,63, duyarlılık 0,82 — doğrulandı. OpenCap vs Vicon ICC 0,884 (n=10) — doğrulandı. Dijital FIFA 11+ (n=55) yüz yüze ile eşdeğer performans — doğrulandı. **Hurtblocker** (iOS) kamera ile iniş testi yapıyor, validasyon yok — doğrulandı. |
| ÖÇB rekonstrüksiyonu sonrası rehabilitasyon | Fizyoterapi, izokinetik dinamometre, NMES (elektriksel kas uyarımı), **UPSCALER** uygulaması (maliyet çalışması) | Kuvvet, nöromüsküler kontrol, motor öğrenme; NMES: akım | Egzersiz: **birebir**; NMES: **hayır** | UPSCALER validasyonu yok — doğrulandı. Dinamometre yerine telefon kuvvet ölçemez. |
| Lateral ayak bileği burkulması (tekrar riski %30+) | Denge tahtası (wobble board), köpük zemin, ev tabanlı propriyoseptif program; bantlama/breys; **"Versterk je enkel / Strengthen your ankle"** uygulaması (Hollanda) | Propriyoseptif/denge eğitimi → motor öğrenme, peroneal reaksiyon süresi | **Birebir** (yönlendirme) + **zayıf ama anlamlı** (IMU ile postural salınım biofeedback'i) | Hupperets 2009 BMJ RCT (n=522): 8 hafta ev programı; tekrar %22 vs %33, NNT 9, risk −35% — doğrulandı. **van Reijen 2016–2018**: uygulama vs kitapçık (n=220): uyum %73 vs %77, tekrar HR 1,13 (0,56–2,27) → uygulama kitapçığı geçemedi — doğrulandı. **Ders:** "egzersiz listesi gösteren uygulama" zaten var ve ek faydası yok; fark ancak kapalı döngü biofeedback ile olur. |
| Aşil / patellar tendinopati | **Eksantrik yükleme** (Alfredson topuk düşürme 3×15, günde 2, 12 hafta), ağır-yavaş direnç (HSR), **ESWT** cihazı, lazer | Mekanotransdüksiyon (tendon hücrelerinin yüke yanıtı), kollajen yeniden yapılanması; ESWT: mekanik şok dalgası | Eksantrik: **birebir** (yönlendirme, tempo, ağrı izleme); ESWT/lazer: **hayır** | 2012 sistematik derleme: eksantrik egzersiz ilk basamak; ESWT vs eksantrik 16. hafta VISA-A fark yok (SMD −0,55; −2,21–1,11) — doğrulandı. ESWT midporsiyonda eksantriğe eşdeğer, insersiyonelde üstün (kısa dönem) — doğrulandı. |
| Kas zorlanması (hamstring vb.) | **Game Ready** / pnömatik kriyo-kompresyon, soğuk-kompresyon sargısı; erken yükleme protokolleri | Soğuk: vazokonstriksiyon, ağrı; kompresyon: ödem | **Hayır** (soğuk/basınç). Erken progresif yükleme koçluğu: **birebir** | Kriyo-kompresyon kanıtı zayıf: 178 makaleden 3'ü dahil; soğuk+kompresyon "toplamsal değil" — doğrulandı. Bayer 2017 NEJM erken vs geç rehabilitasyon (spora dönüş 3 hafta kısa) — doğrulanmadı. Taklit edilen cihazın kanıtı zaten zayıf. |
| Aşırı antrenman / yetersiz toparlanma | **Whoop, Oura, Polar** vb. HRV izleme + "recovery" puanı; **HRV4Training** (telefon kamerası PPG ile HRV, antrenman tavsiyesi) | Biofeedback: sabah HRV ile antrenman yükü ayarlama (ölç→müdahale) | **Birebir** (kamera PPG; HRV4Training zaten yapıyor) | Plews 2017 IJSPP: kamera PPG vs Polar H7 vs EKG — doğrulandı. Bağımsız karşılaştırmada kamera PPG hatası ~%5 — doğrulandı (üreticinin aktarımıyla). Javaloyes 2019 (n=17 bisikletçi): HRV güdümlü grup içinde iyileşme, gruplar arası fark yok — doğrulandı. Meta-analiz: VO2max üzerinde küçük etki (ES 0,40; gruplar arası 0,19) — doğrulandı. Whoop/Oura puanı için RCT **yok** — doğrulandı. **"Zaten var"** (HRV4Training). |
| Koşucu dizi (PFA), tibial stres sendromu, koşu yaralanmaları | **Metronom/kadans eğitimi** (adım sayısı +%5–10), GPS saat, koşu bandı + **ayna/kamera ile yürüyüş yeniden eğitimi**, kuvvet platformu | Motor öğrenme: adım sıklığı ↑ → adım uzunluğu, diz yükü (PFJ stres), kalça addüksiyonu ↓; dış odaklı geri bildirim | **Birebir** (metronom + IMU kadans) | Bramah 2019 AJSM (n=12, vaka serisi, kontrolsüz): +%10 kadans, tek seans; 3 ayda ağrı/fonksiyon iyi — doğrulandı. 2022 Frontiers (n=68): +%10 kadans ile anında yanıt %35 — doğrulandı. NCT07176819 (n=44) RCT sürüyor — doğrulandı. Willy 2012 ayna geri bildirimi (n=10): kalça addüksiyonu ↓ (ES 0,69–2,91), 3 ayda kalıcı — doğrulandı. **Mevcut uygulamalar:** Runcadence (kadans düşünce metronom devreye giriyor), Runo, TrailMix, RunningOn, FeetBeat; Runkeeper (kadans gösterir) — doğrulandı. Ochy (10 sn video → form analizi, bağımsız validasyon yok) ve OnForm (iskelet bindirme, koç aracı) **ölçer, tedavi etmez** — doğrulandı. |
| Sporcu bel ağrısı | Core stabilizasyon, McKenzie, TENS, breys | Egzersiz/motor kontrol; TENS: akım | Egzersiz: **birebir**; TENS: **hayır** | Algoloji raporunda (19) ele alındı; burada tekrar edilmedi. |
| Uyku / toparlanma | Işık terapisi kutusu, uyku takip bilekliği, **CBT-I** dijital terapötikler (Sleepio, Somryst) | Kronobiyoloji, davranışsal | **Birebir** (CBT-I zaten yazılım) / ışık: **zayıf** (ekran 500–1500 nit, 10.000 lux değil) | Mah 2011 Sleep (n=11 basketbolcu, kontrolsüz): uyku +111 dk, sprint ve atış isabeti +%9 — doğrulandı. Sporcuya özgü uyku uzatma uygulaması RCT'si bulunamadı. CBT-I alanı "zaten var". |
| Dehidrasyon | İdrar rengi kartı, idrar özgül ağırlığı refraktometresi, ter testi; **GSSI Labs** uygulaması (NCT07005895, fizibilite) | Ölçüm → sıvı reçetesi | **Zayıf** (kamera kolorimetri; aydınlatma/kalibrasyon sorunu) | Telefon fotoğrafıyla idrar rengi: 5 telefon × 5 aydınlatma, "Mavi" kanal eşik 170 duyarlılık >%90 (klinik hasta, sporcu değil) — doğrulandı. Sporcu validasyonu yok — doğrulandı. Ağırlıklı ölçüm; tedavi kısmı "su iç" tavsiyesi. |
| EIB (egzersiz astımı) | Spirometre (FEV1), inhaler (ilaç), **yapılandırılmış ısınma** (refrakter dönem), yüz maskesi/ısı değiştirici | Yüksek yoğunluklu ısınma → 1–3 saat refrakter dönem (bronkokonstriksiyon azalır); nefes eğitimi | Isınma koçluğu: **birebir**; ilaç/maske: **hayır**; FEV1 ölçümü mikrofonla: **zayıf** (araştırma düzeyi) | Stickland 2012 sistematik derleme (7 RCT): yüksek/değişken yoğunluklu ısınma FEV1 düşüşünü azaltıyor — doğrulandı. Mickleborough 2007: astımlıların ~yarısı refrakter oluyor — doğrulandı. Prevalans: astımlıların %90'ına kadar, genel toplumda >%10 — doğrulandı (2005 derleme). |

Mekanizma özeti: Bu alandaki cihazların **%70'i egzersiz/motor öğrenme/ritmik uyarı/biofeedback** mekanizmasıyla çalışır (telefon: birebir veya zayıf-anlamlı). **Soğuk, kompresyon, şok dalgası, akım, ilaç** → telefon yapamaz.

## 2. Proje fikirleri (telefon tek başına)

### Fikir 1: "Eşik Koşusu" — Sarsıntı sonrası semptom-altı aerobik egzersiz (Buffalo protokolü) telefonla
- **Hedef hastalık ve hasta sayısı:** Spora bağlı sarsıntı, akut dönem (ilk 2–10 gün). ABD'de yıllık 1,6–3,8 milyon spor/rekreasyon sarsıntısı (Langlois 2006, CDC — doğrulanmadı). Türkiye için kayıt yok; amatör+okul sporu için kaba tahmin on binler/yıl (doğrulanmadı). Dünya: milyonlar/yıl.
- **Taklit edilen cihaz ve mekanizma:** BCTT (koşu bandı + nabız monitörü ile semptom eşiği) + evde göğüs kayışı ile eşiğin %80–90'ında 20 dk/gün aerobik egzersiz. Mekanizma: kademeli semptom-altı aerobik yük → otonom/serebral kan akımı düzenlenmesi, erken aktivasyon.
- **Telefonda nasıl çalışır:**
  1. **Eşik testi (ev, 10–15 dk):** Hasta yerinde yürüme/merdiven/adım tahtası benzeri kademeli egzersiz yapar; telefon hoparlörü metronomla kadansı her 2 dakikada %10 artırır (IMU ile adım sayımı doğrulanır). Her kademe sonunda 15 sn **parmak kamera-PPG** ile nabız + ekranda semptom VAS (0–10). Semptom ≥3 puan artınca test durur: **eşik kadansı ve eşik nabzı** kaydedilir.
  2. **Günlük seans (20 dk, 2–4 hafta):** Metronom + IMU kadans kapalı döngüsü ile eşiğin %80–90'ında yürüyüş/hafif koşu (kadans, nabzın pratik vekili). Her 5 dakikada 15 sn durup PPG nabız kontrolü; nabız eşiği aşarsa tempo düşürülür, semptom artarsa seans biter. RPE de kaydedilir.
  3. Her 2–3 günde eşik yeniden test edilir ve doz güncellenir; 2 hafta sonra klinisyene özet rapor (spora dönüş kararını klinisyen verir).
  - Sensör/çıkış: IMU (adım/kadans), kamera+flaş (PPG), hoparlör/titreşim (metronom), ekran (VAS, uyarı).
- **Kanıt:** Cihaz/protokol: 2 RCT (Leddy 2019, 2021) + 2023 sistematik derleme — **güçlü**. Telefon versiyonu: **yok**. Nabız monitörsüz reçete yöntemi Bezherano 2020'de tarif ediliyor (içerik doğrulanmadı) → klinik olarak kabul edilebilir bir yol.
- **Mevcut uygulamalar:** Sway (ölçüm), C3 Logix (ölçüm, doğrulanmadı), "concussion" uygulamaları (semptom günlüğü). **Tedavi dozunu belirleyip kapalı döngüde uygulayan telefon uygulaması bulunamadı.** Fark: eşik testi + dozlu egzersiz + otomatik doz güncelleme, ek donanımsız.
- **Teknik zorluklar ve çözüm:** (a) Egzersiz sırasında sürekli nabız yok → kadans vekili + aralıklı PPG; kadans–nabız ilişkisi hastaya özgü kalibre edilir (eşik testi sırasında eşleştirilir). (b) Parmak PPG hareketle bozulur → 15 sn durağan ölçüm, sinyal kalite indeksi. (c) Telefon cebinde/elde: adım sayımı cep konumunda güvenilir, kadans hatası <%2 (ayakkabı sensörü çalışması; telefon için doğrulanmadı). (d) Koşu bandı yok → yerinde yürüme/merdiven; eşik "kadans" cinsinden tanımlanır.
- **Regülasyon:** Tedavi dozu belirlediği için SaMD **Sınıf IIa (CE-MDR)**, FDA Class II (De Novo olası), TİTCK Sınıf IIa. **Klinik çalışma gerekir** (non-inferiority: telefon dozu vs göğüs kayışı dozu; sonra toparlanma süresi RCT).
- **Riskler / kontrendikasyonlar:** Semptom alevlenmesi (eşik aşımı); yapısal beyin hasarı/kanama dışlanmadan kullanılmamalı (hekim onayı şart); boyun yaralanması; 13 yaş altı kanıt yok; nöbet geçmişi. Fotosensitivite riski yok (flaş parmakta).
- **Puanlama:** Teknik 8 | Kanıt 7 | Etki 7 | Yenilik 8 | Düşük risk 7 | **TOPLAM 37/50**

### Fikir 2: "Adım Kapalı Döngü" — PFA/koşucu dizi için IMU kadans + ağrı güdümlü yürüyüş yeniden eğitimi
- **Hedef hastalık ve hasta sayısı:** Patellofemoral ağrı ve kadans-duyarlı koşu yaralanmaları (tibial stres, iliotibial bant). Koşucularda yıllık yaralanma oranı %20–79 (van Gent 2007 — doğrulanmadı); PFA, koşu yaralanmalarının en sık olanı (doğrulanmadı). Türkiye: İstanbul Yarı Maratonu 17.300 kayıt, İzmir 5.000+ (doğrulandı); düzenli koşucu kaba tahmin 1–2 milyon (doğrulanmadı). Dünya: yüz milyonlarca koşucu.
- **Taklit edilen cihaz ve mekanizma:** Klinik koşu bandı + metronom + GPS saat ile "+%10 kadans" eğitimi; mekanizma motor öğrenme (adım uzunluğu ↓ → patellofemoral eklem yükü ↓, kalça addüksiyonu ↓).
- **Telefonda nasıl çalışır:** Telefon bel/cep; IMU dikey ivmeden gerçek zamanlı kadans. Protokol: 1) 2 koşuda tercih edilen kadans ölçülür; 2) hedef = +%7,5–10; 3) **adaptif metronom**: kadans hedefin ±3 spm dışına çıkınca hoparlör/titreşim ile devreye girer, içindeyken susar (fading — motor öğrenmede geri bildirimin azaltılması); 4) 6 hafta, haftada 3 koşu, metronom süresi haftada %20 azaltılır; 5) **ağrı kapalı döngüsü**: koşu sonrası ağrı VAS >3 veya ertesi sabah ağrı artışı → mesafe %20 düşer, kadans artışı korunur; 6) yer temas süresi (GCT) ve dikey salınım tahmini ikincil göstergedir (cep konumunda hata ~50 ms → yalnızca eğilim için).
- **Kanıt:** Cihaz: Bramah 2019 (vaka serisi, n=12), 2022 Frontiers (n=68, anlık), Willy/Davis çalışmaları; RCT NCT07176819 sürüyor — **orta**. Telefon versiyonu: Bramah zaten metronom+saat kullandı; kapalı döngü telefon RCT'si **yok**.
- **Mevcut uygulamalar:** Runcadence (kadans düşünce metronom — en yakın; iPhone+Watch), Runo, TrailMix, RunningOn, FeetBeat, Garmin/Runkeeper kadans ekranı — doğrulandı. **Fark:** Bunlar metronom/ölçüm; önerilen ürün **ağrıya göre dozlanan 6 haftalık klinik protokol + fading + yaralanmaya özgü hedef** (PFA için kadans, tibial stres için GCT) içerir. Yenilik orta.
- **Teknik zorluklar ve çözüm:** Cep/bel konumunda adım algılama sağlam (yürüyüşte pocket MAE <50 ms — doğrulandı; koşu için telefon validasyonu doğrulanmadı) → pik algılama + otokorelasyon; müzikle birlikte çalma için ses karıştırma; pil (IMU düşük güç).
- **Regülasyon:** Sağlıklı yaşam/düşük risk; tanı konmuş PFA için "egzersiz yönlendirme" → CE Sınıf I / FDA genel sağlık istisnası olası; TİTCK Sınıf I. Klinik çalışma: pazarlama iddiası için RCT önerilir, zorunlu değil.
- **Riskler:** Kadans artışı baldır/Aşil yükünü artırır (Aşil tendinopatisi olanlarda dikkat); ani >%10 artış önerilmez; trafikte kulaklıksız hoparlör kullanımı güvenli.
- **Puanlama:** Teknik 9 | Kanıt 7 | Etki 7 | Yenilik 5 | Düşük risk 9 | **TOPLAM 37/50**

### Fikir 3: "İniş Koçu" — Kamera poz tahmini ile sıçrama-iniş mekaniği kapalı döngü geri bildirimi (ÖÇB riski)
- **Hedef hastalık ve hasta sayısı:** ÖÇB yaralanması önleme (özellikle genç kadın futbol/basketbol/hentbol/voleybol sporcuları) ve rekonstrüksiyon sonrası spora dönüş. Yıllık insidans toplumda %0,05'e kadar, profesyonel futbol/basketbolda %0,15–3,7 (sistematik derleme — doğrulandı). Türkiye: ~85 milyon × %0,03–0,05 ≈ 25–40 bin/yıl (kaba); ABD ~200.000/yıl (doğrulanmadı). Dünya: milyon/yıl mertebesi (kaba).
- **Taklit edilen cihaz ve mekanizma:** Laboratuvar 3D hareket analizi + Kinect gerçek zamanlı geri bildirim + FIFA 11+ programı. Mekanizma: motor öğrenme (diz valgusu ↓, diz/kalça fleksiyonu ↑, yumuşak iniş) + nöromüsküler kuvvet.
- **Telefonda nasıl çalışır:** 1) Haftada 1 **test**: telefon yere 3 m uzağa, diz hizasına; önden (frontal, valgus = FPPA açısı) ve yandan (sagital, diz fleksiyonu) ikişer düşme-sıçraması, 60–120 fps (slow-motion). Cihaz üstü poz tahmini (MediaPipe/BlazePose) ile otomatik **LESS-benzeri puan**; 2) **gerçek zamanlı antrenman**: her inişte ekran rengi + sesli ton (valgus eşiği aşılınca "düşük" ton, iyi iniş "yüksek" ton); 3) 6–8 hafta, haftada 3 × 15 dk FIFA 11+ tabanlı program (video yönlendirme, IMU ile tekrar sayımı); 4) iniş puanına göre program ilerletilir (kapalı döngü). İsteğe bağlı: iniş sesi şiddeti mikrofonla ölçülür ("sessiz iniş" geri bildirimi).
- **Kanıt:** Cihaz: Webster & Hewett 2018 — ÖÇB %50 azalma (güçlü); Kinect gerçek zamanlı geri bildirim valgus −6° (n=24) — doğrulandı. Otomatik LESS (OpenPose) MAE 1,23, duyarlılık 0,82 — doğrulandı. OpenCap–Vicon ICC 0,88 (n=10) — doğrulandı. **Telefon poz tahmini ile geri bildirim antrenmanının ÖÇB yaralanmasını azalttığına dair çalışma yok.**
- **Mevcut uygulamalar:** Hurtblocker (iOS, kamera ile iniş testi; validasyon yok) — doğrulandı; Ochy/OnForm (koşu/golf form analizi, ölçüm); Uplift Labs/Kemtai (aramada çıkmadı, doğrulanmadı). **Fark:** test + gerçek zamanlı ton geri bildirimi + dozlanmış önleme programı tek döngüde; takım/antrenör paneli. Yenilik orta (ölçen var, tedavi eden kapalı döngü yok).
- **Teknik zorluklar ve çözüm (fizik sınırları):** (a) 2D tek kamera → frontal düzlemde valgus **sistematik olarak küçümsenir** (MediaPipe; doğrulandı); çözüm: eşiği mutlak derece değil kişiye göre değişim (Δ) olarak koy; (b) sagital fleksiyon hatası yürüyüşte 3–4°, çömelmede 6–14° (doğrulandı) → sıkı giysi, yan görünüm, sabit mesafe talimatı; (c) 30 fps'de yer teması 2–3 kare → 120 fps zorunlu; (d) hem frontal hem sagital aynı anda olmaz → iki ayrı test; (e) cihaz üstü çıkarım gecikmesi 30–60 ms → ton geri bildirimi iniş sonrası 100 ms içinde verilir (yeterli, "knowledge of results").
- **Regülasyon:** Önleme/spor performansı → düşük risk, CE Sınıf I / genel sağlık; ÖÇB sonrası spora dönüş kararı için kullanılırsa **Sınıf IIa** ve klinik validasyon gerekir.
- **Riskler:** Düşme-sıçrama egzersizi akut yaralanmada yapılmaz; yanlış güven (düşük puan = "güvende" yanılgısı); çocuklarda yetişkin gözetimi.
- **Puanlama:** Teknik 7 | Kanıt 6 | Etki 8 | Yenilik 6 | Düşük risk 8 | **TOPLAM 35/50**

### Fikir 4: "Refrakter Isınma" — EIB için zamanlanmış yüksek yoğunluklu ısınma + mikrofonla hırıltı/öksürük kapalı döngüsü
- **Hedef hastalık ve hasta sayısı:** Egzersize bağlı bronkokonstriksiyon. Genel toplumda >%10, astımlıların %90'ına kadar; dayanıklılık/kış/su sporcularında daha sık — doğrulandı. Türkiye: 85 milyonun %10'u = ~8 milyon potansiyel (kaba); dünya: yüz milyonlar.
- **Taklit edilen cihaz ve mekanizma:** Spirometre ile takip + yapılandırılmış ısınma (ilaç dışı). Mekanizma: yüksek yoğunluklu aralıklı ısınma → 1–3 saatlik refrakter dönem (bronkokonstriksiyon azalır; katekolamin/prostaglandin aracılı).
- **Telefonda nasıl çalışır:** 1) Sporcu müsabaka/antrenman saatini girer; uygulama 15–25 dk önce **8×30 sn yüksek yoğunluk / 90 sn dinlenme** (Stickland'daki değişken yoğunluk protokolü) ısınmayı metronom/sesli komutla yönetir, IMU/GPS ile tempo doğrular; 2) **mikrofon kapalı döngüsü**: ısınma sonrası ve egzersiz sonrası 60 sn'lik "zorlu nefes verme + öksürük" kaydı; öksürük sayısı ve ekspiratuar hırıltı (wheeze) spektral imzası izlenir; hırıltı/öksürük artışı → bir sonraki seansta ısınma yoğunluğu/süresi ayarlanır, hekime "inhaler planını gözden geçir" uyarısı; 3) soğuk/kuru havada burun nefesi + nefes kontrolü eğitimi (ekran rehberli); 4) 4–8 hafta izlem.
- **Kanıt:** Cihaz/ısınma: Stickland 2012 (7 RCT) — **orta-güçlü**; refrakterlik ~%50 hastada — doğrulandı. Telefon versiyonu: **yok**. Mikrofonla FEV1 (SpiroSmart tipi) araştırma düzeyi, klinik onaylı değil — doğrulanmadı.
- **Mevcut uygulamalar:** Astım günlüğü/inhaler hatırlatıcı uygulamalar (Propeller — sensör gerektirir), nefes egzersizi uygulamaları. **EIB'ye özgü zamanlanmış refrakter ısınma + ses geri bildirimi uygulaması bulunamadı.**
- **Teknik zorluklar ve çözüm:** Hırıltı algılama ortam gürültüsüne duyarlı → sakin ortamda 60 sn ölçüm, cihaz üstü model, yalnız eğilim; FEV1'in kendisi iddia edilmez (ölçüm aracı değil, "kendi kendine izleme"). Isınmanın kendisi EIB'yi tetikleyebilir → ilk seanslar hekim gözetiminde, inhaler elde.
- **Regülasyon:** Isınma koçu: düşük risk, CE Sınıf I. Hırıltı analizi "semptom izleme" olarak Sınıf I–IIa; tanı iddiası yoksa klinik çalışma zorunlu değil, ancak önerilir.
- **Riskler:** Kontrolsüz astımda yüksek yoğunluklu ısınma atak tetikleyebilir → ACT (astım kontrol testi) <20 ise kullanılmaz; ilaç yerine geçmez uyarısı.
- **Puanlama:** Teknik 8 | Kanıt 6 | Etki 6 | Yenilik 8 | Düşük risk 7 | **TOPLAM 35/50**

### Fikir 5: "Tendon Tempo" — Eksantrik/ağır-yavaş yükleme için IMU-kamera tempo + ağrı-izlem dozajı (tendinopati)
- **Hedef hastalık ve hasta sayısı:** Aşil ve patellar tendinopati. Koşucularda yaşam boyu Aşil tendinopatisi ~%50 (doğrulanmadı); atlayıcı sporlarda patellar tendinopati %14–45 (doğrulanmadı). Türkiye kaba: yüz binler.
- **Taklit edilen cihaz ve mekanizma:** Fizyoterapist eşliğinde eksantrik (Alfredson) / HSR programı; ESWT (telefon yapamaz). Mekanizma: mekanotransdüksiyon; tempo (3 sn eksantrik) ve progresif yük kritik.
- **Telefonda nasıl çalışır:** Telefon çorap/ayak bileği bandında veya yere konmuş kamera; IMU/poz tahmini ile topuk düşürme hızını ölçer, 3 sn eksantrik tempoyu metronomla dikte eder, hızlı/kontrolsüz inişi titreşimle uyarır; tekrar sayar. **Ağrı-izlem modeli** (Silbernagel: egzersiz ağrısı ≤5/10 kabul, ertesi sabah artış yok): günlük VAS'a göre yük/tekrar otomatik ilerler/geriler. 12 hafta, günde 2 × 3×15.
- **Kanıt:** Cihaz: eksantrik egzersiz ilk basamak (2012 derleme) — **orta-güçlü**. Telefon tempo geri bildirimi RCT'si **yok**.
- **Mevcut uygulamalar:** Physitrack, Kaia, "Achilles rehab" egzersiz listeleri (yönlendirme, ölçümsüz). **Fark:** tempo/hız ölçümü + ağrı-izlem dozaj algoritması. Yenilik düşük-orta.
- **Teknik zorluklar:** Telefonun ayağa sabitlenmesi (BRIEF: aksesuar yok → kamera modu tercih; bileğe takmak için çorap yeterli, aksesuar değil); poz tahmini ile ayak bileği açısı hatası 5–10°.
- **Regülasyon:** CE Sınıf I / genel sağlık; klinik çalışma zorunlu değil.
- **Riskler:** Tendon rüptürü şüphesinde kullanılmaz; insersiyonel tendinopatide basamak dışı düşürme ağrıyı artırır (program farkı).
- **Puanlama:** Teknik 9 | Kanıt 7 | Etki 6 | Yenilik 4 | Düşük risk 9 | **TOPLAM 35/50**

### Fikir 6: "Bilek Dengesi" — Ayak bileği burkulması için IMU postural salınım biofeedback'li 8 haftalık program
- **Hedef hastalık ve hasta sayısı:** Lateral ayak bileği burkulması sonrası tekrar önleme (tekrar %30'a kadar). ABD ~2 milyon/yıl (doğrulanmadı); kolej sporlarında tüm yaralanmaların %15'i — doğrulandı. Türkiye kaba: yüz binler/yıl.
- **Taklit edilen cihaz:** Denge tahtası + ev propriyoseptif programı (Hupperets 2009); Sway Balance (ölçüm). Mekanizma: propriyoseptif/denge motor öğrenme.
- **Telefonda nasıl çalışır:** Telefon göğüste iki elle tutulur veya ceptedir; IMU ile tek ayak duruşta salınım (RMS ivme) ölçülür; ekran/ses ile "sessiz dur" geri bildirimi, gözler kapalıyken ses geri bildirimi; zorluk otomatik ilerler (yumuşak zemin yerine gözler kapalı, baş çevirme, **ses ile rastgele pertürbasyon komutu**). 8 hafta, 3×/hafta, 10 dk. Haftalık salınım puanı ile ilerleme.
- **Kanıt:** Cihaz: Hupperets 2009 RCT (n=522) — **güçlü**. Uygulama: van Reijen (n=220) **egzersiz listesi uygulaması kitapçığı geçemedi** — doğrulandı. Biofeedback'li telefon versiyonu RCT'si **yok**.
- **Mevcut uygulamalar:** "Strengthen your ankle" (Hollanda; etkisiz), Sway (ölçüm, klinisyen lisansı). **Fark:** ölçüm-temelli ilerleme ve geri bildirim; van Reijen'in gösterdiği uyum sorununa oyunlaştırma ile yanıt. Kanıt riski: ek fayda gösterilmesi gerekir.
- **Teknik zorluklar:** Telefon vücutta sabit değil → göğüste tutma standardı; elde tutma kol hareketini de ölçer (gürültü) → düşük geçiren filtre, yalnız 0,1–2 Hz bant.
- **Regülasyon:** CE Sınıf I. **Riskler:** Akut dönemde (ilk 1 hafta) tek ayak denge yapılmaz; düşme riski → duvar yanında.
- **Puanlama:** Teknik 8 | Kanıt 6 | Etki 7 | Yenilik 5 | Düşük risk 8 | **TOPLAM 34/50**

### Fikir 7: "Akıllı Ayna" — Koşu bandında arkadan kamera ile pelvik düşüş/kalça addüksiyonu gerçek zamanlı geri bildirimi (PFA)
- **Hedef:** Kalça/pelvis kontrol bozukluğu olan PFA'lı koşucular (Willy 2012 popülasyonu). Sayı: Fikir 2'nin alt kümesi.
- **Taklit edilen cihaz:** Boy aynası + fizyoterapist sözlü geri bildirimi (Willy 2012), laboratuvar 3D analiz. Mekanizma: dış odaklı gerçek zamanlı geri bildirim ile motor öğrenme, 8 seans + fading.
- **Telefonda nasıl çalışır:** Telefon koşu bandının arkasına (spor salonu/ev bandı) kalça hizasına; poz tahmini ile iki kalça noktası arasındaki çizginin eğimi (kontralateral pelvik düşüş) ve diz-kalça-ayak bileği frontal açısı; eşik aşımında sesli ton; 8 seans, son 4 seansta geri bildirim azaltılır.
- **Kanıt:** Cihaz: Willy 2012 (n=10, kontrolsüz) — zayıf-orta. Telefon versiyonu: **yok**.
- **Mevcut uygulamalar:** Ochy (video sonrası rapor; gerçek zamanlı değil), OnForm (iskelet, manuel). **Fark:** gerçek zamanlı, tedavi protokollü.
- **Teknik zorluklar:** Pelvik düşüş 3–6°'lik farklar; MediaPipe kalça noktaları giysi/ışıkla kayar → kişi içi değişim ve 10 adımlık kayan ortalama; koşu bandı gerektirir (ev ekipmanı, telefona aksesuar değil).
- **Regülasyon:** CE Sınıf I. **Riskler:** Dikkat dağılmasıyla banttan düşme → yalnız ses geri bildirimi.
- **Puanlama:** Teknik 6 | Kanıt 6 | Etki 6 | Yenilik 8 | Düşük risk 8 | **TOPLAM 34/50**

### Fikir 8: "VOR Evde" — Sarsıntı sonrası vestibüler-okülomotor egzersizlerin ön kamera ile dozlanması
- **Hedef:** Kalıcı baş dönmesi/görsel semptomlu SRC (>10 gün). Sarsıntıların ~%30'u (doğrulanmadı).
- **Taklit edilen cihaz:** Klinik vestibüler rehabilitasyon, VestAid (tablet, araştırma). Mekanizma: VOR adaptasyonu, bakış sabitleme, habituasyon.
- **Telefonda nasıl çalışır:** Telefon göz hizasında masada; ekranda hedef harf; ön kamera yüz noktalarından baş yaw/pitch açısı ve frekansını ölçer; metronom 1→2 Hz ilerletir; hedefin okunabilirliği (hasta sesli söyler, mikrofon ASR ile doğrular) bozulursa hız düşer. 4–6 hafta, günde 3×2 dk.
- **Kanıt:** Cihaz: Schneider 2014 (n=31) — orta. Tablet (VestAid) RCT planlı, sonuç yok — doğrulandı. Telefon RCT'si yok.
- **Mevcut uygulamalar:** "Eye Rehab / Vision Therapy" (ticari, kanıtsız), VestAid (klinik araştırma). **Fark:** baş hızı ölçümüyle kapalı döngü dozlama. Yenilik orta (VestAid yakın).
- **Teknik zorluklar:** Göz takibi ön kamerada düşük çözünürlük → göz yerine baş hızı + okunabilirlik testi; semptom alevlenmesi.
- **Regülasyon:** CE Sınıf IIa olası (tedavi); klinik çalışma gerekir. **Riskler:** Servikal yaralanma, semptom provokasyonu; hekim yönlendirmesi şart.
- **Puanlama:** Teknik 7 | Kanıt 6 | Etki 6 | Yenilik 5 | Düşük risk 7 | **TOPLAM 31/50**

### Fikir 9: "Sporcu Uyku Uzatma" — Antrenman yüküne göre uyku hedefi ve kronoterapi
- Mah 2011 (n=11) tek kontrolsüz çalışma; CBT-I ve uyku uygulamaları (Sleepio, Somryst, Sleep Cycle) **zaten var**; sporcuya özgü fark küçük. Telefon: IMU/mikrofonla uyku tahmini + ekran ışığı sabah (zayıf, ~1000 lux yakın mesafe) + yatma uyarısı.
- **Puanlama:** Teknik 8 | Kanıt 5 | Etki 6 | Yenilik 3 | Düşük risk 9 | **TOPLAM 31/50** (önerilmez; "benzeri var").

## 3. Alanın en iyi 3 fikri (sıralı) ve gerekçe

1. **Fikir 1 — "Eşik Koşusu" (Buffalo protokolü telefonla), 37/50.** Taklit edilen protokolün 2 RCT'si var ve etki büyüklüğü klinik olarak anlamlı (4 gün erken toparlanma, kalıcı semptom −%48). Nabız monitörü yerine kadans + aralıklı kamera-PPG ile doz vermek fizik olarak mümkün; telefonla yapan ürün yok. Klinik validasyon (doz eşdeğerliği) şart, ama yol açık.
2. **Fikir 2 — "Adım Kapalı Döngü" (PFA kadans eğitimi), 37/50.** Teknik olarak en olgun (IMU kadans güvenilir), risk en düşük, kullanıcı tabanı en geniş. Yenilik puanı düşük (Runcadence/Runo var) ama ağrı-dozlu, fading'li klinik protokol farkı net. Kanıt vaka serisi düzeyinde; süren RCT (NCT07176819) sonuçlanınca güçlenebilir.
3. **Fikir 3 — "İniş Koçu" (ÖÇB iniş mekaniği), 35/50.** Etki potansiyeli en yüksek (nöromüsküler programlar ÖÇB'yi %50 azaltıyor; ameliyat+1 yıl kayıp önleniyor). Fizik sınırı gerçek (2D valgus küçümsemesi, 120 fps gereği) ama Δ-tabanlı geri bildirim ile aşılabilir; Kinect çalışması gerçek zamanlı geri bildirimin mekaniği anında düzelttiğini gösteriyor. Hurtblocker ölçüyor, kapalı döngü tedavi eden yok.

Fikir 4 (EIB ısınma) yenilik açısından en güçlü (35/50) ve ucuz bir RCT ile hızla kanıtlanabilir; dördüncü sırada not edilir.

## 4. "Yapılamaz" diye elenenler (bir satır gerekçe)

- **Kas yaralanmasında soğuk/kompresyon (Game Ready, kriyo-kompresyon):** Telefon soğuk ve basınç üretemez; ayrıca cihazın kanıtı da zayıf (178 makaleden 3'ü).
- **ESWT (şok dalga) ve lazer (tendinopati):** Mekanik şok dalgası/terapötik ışık dozu telefonda yok.
- **NMES/TENS (ÖÇB sonrası kuadriseps, bel ağrısı):** Elektrik akımı yok.
- **İzokinetik dinamometre / kuvvet platformu:** Telefon kuvvet ölçemez; yalnız hareket/zaman vekilleri.
- **HRV güdümlü antrenman (Whoop/Oura yerine kamera PPG):** **Zaten var** — HRV4Training telefon kamerasıyla aynı işi yapıyor (Plews 2017 validasyon); fark yok, önerilmez. Ayrıca HRV-güdümlü antrenmanın gruplar arası etkisi küçük (ES 0,19).
- **Dehidrasyon idrar rengi uygulaması:** Ölçüm ağırlıklı; GSSI Labs uygulaması zaten var; kamera kolorimetrisi aydınlatmaya bağımlı; tedavi kısmı "su iç"ten ibaret.
- **EIB'de inhaler/ısı-nem maskesi:** İlaç ve fiziksel hava koşullandırma telefonda yok.
- **Işık terapisiyle sirkadiyen ayarı (jet-lag/sporcu):** Ekran 500–1500 nit, 10.000 lux kutusu değil; yalnız "zayıf" destek (nöroloji/psikiyatri raporlarında ele alınmalı).
- **Mikrofonla spirometri (FEV1) tanısı:** Araştırma düzeyi, klinik onaylı değil; yalnız eğilim izleme olarak kullanılabilir.
- **Sarsıntıda yalnız ölçüm (Sway, C3 Logix benzeri):** Zaten var ve tedavi değil.

## 5. Kaynaklar (URL)

Sarsıntı:
- Leddy 2019 JAMA Pediatr (UB haberi): https://www.buffalo.edu/news/releases/2019/02/002.html
- Leddy 2021 Lancet Child Adolesc Health (UB haberi): https://www.buffalo.edu/news/releases/2021/09/040.html
- 2023 sistematik derleme (UB): https://www.buffalo.edu/news/releases/2023/06/Prescribed-exercise-after-sport-related-concussion-UB.html
- Bezherano/Leddy 2020 pratik yönetim (PDF): https://www.concussionalliance.org/s/Practical_Management__Prescribing_Subsymptom_LEDDY.pdf
- Schneider 2014 BJSM: https://bjsm.bmj.com/content/48/17/1294
- Vestibüler rehabilitasyon RCT derlemesi 2022: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9819464/
- VestAid (Pittsburgh): https://www.shrs.pitt.edu/?p=72861 ; https://ctv.veeva.com/study/effectiveness-of-vestaid-app
- VR okülomotor fizibilite NCT07709936: https://clinicaltrials.gov/study/NCT07709936
- Sway Medical: https://www.mobihealthnews.com/news/sway-nabs-750k-fda-cleared-balance-assessment-app ; https://apps.apple.com/app/id657932025

ÖÇB:
- Webster & Hewett 2018 (JOR, DOI 10.1002/jor.24043): https://mbevidencias.apm.org.br/vufind/Record/openalex-W2807861602/Description?lng=en
- OpenPose otomatik LESS (Appl Sci 2020): https://www.mdpi.com/2076-3417/10/3/892
- OpenCap LESS validasyonu (2026): https://www.citedrive.com/en/discovery/automated-less-scoring-using-opencap-validation-and-in-season-application-in-collegiate-basketball-athletes/
- OpenLESS (UCL): https://discovery.ucl.ac.uk/id/eprint/10210681/
- LESS güvenilirlik derlemesi: https://lida.sport-iat.de/ta/Record/4063897?lng=en
- Kinect gerçek zamanlı geri bildirim (valgus): https://pmc.ncbi.nlm.nih.gov/articles/PMC7093923
- iPad hareket analizi güvenilirliği (UNLV): https://digitalscholarship.unlv.edu/pt_fac_articles/73
- Dijital FIFA 11+ RCT (n=55): https://iris.uniupo.it/handle/11579/231943
- FIFA 11+ uyum derlemesi: https://pmc.ncbi.nlm.nih.gov/articles/PMC5599402
- UPSCALER uygulaması: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11160346/
- Hurtblocker (App Store): https://apps.apple.com/ca/app/id6747727133
- MediaPipe diz açısı doğruluğu (yürüyüş): https://link.springer.com/article/10.1007/s11548-024-03156-5 ; çömelme metrolojisi: https://api.crossref.org/works/10.3390%2FS23115101
- ÖÇB insidans derlemesi: https://sponet.de/sponet/Record/4026534

Ayak bileği:
- Hupperets 2009 BMJ (PEDro): https://search.pedro.org.au/search-results/record-detail/23915
- van Reijen protokol 2014: https://pmc.ncbi.nlm.nih.gov/articles/PMC3923004 ; maliyet-etkinlik 2018: https://www.bisp-surf.de/Record/PU201803001737 ; süreç değerlendirmesi JMIR 2018: https://rehab.jmir.org/2018/2/e13/PDF

Tendinopati / kas:
- Achilles konservatif tedavi meta-analizi: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3103008/
- Fizik tedaviler derlemesi 2012: https://pubmed.ncbi.nlm.nih.gov/22747701/
- ESWT alt ekstremite derlemesi: https://pubmed.ncbi.nlm.nih.gov/24817008/
- Kriyoterapi yumuşak doku derlemesi: https://journals.iium.edu.my/ijahs/index.php/IJAHS/article/download/690/662/3850 ; pnömatik kriyo-kompresyon hamstring: https://jssm.org/jssm-25-350.xml-abst

HRV / toparlanma:
- HRV4Training validasyon (Plews 2017): https://www.hrv4training.com/blog2/validation-paper-accepted-for-publication-in-the-international-journal-of-sports-physiology-and-performance-ppg-vs-polar-h7-vs-electrocardiogram
- Bağımsız validasyon özeti: https://www.hrv4training.com/blog2/independent-validation-of-hrv4training
- CameraHRV 2025 (Frontiers): https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2025.1707318/full
- Javaloyes 2019 IJSPP: https://pubmed.ncbi.nlm.nih.gov/31490431/
- HRV-güdümlü antrenman meta-analizi (IJERPH 2020): https://mdpi-res.com/d_attachment/ijerph/ijerph-17-07999/article_deploy/ijerph-17-07999.pdf
- HRV-güdümlü profesyonel sporcu protokolü: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7432021/

Koşu / kadans:
- Bramah 2019 AJSM: https://journals.sagepub.com/doi/10.1177/0363546519879693
- Frontiers 2022 anlık etki: https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2022.1048655/pdf
- NCT07176819: https://clinicaltrials.gov/study/NCT07176819
- Willy 2012 Clin Biomech: https://pubmed.ncbi.nlm.nih.gov/22917625/
- Runcadence: https://www.running-physio.com/runcadence ; Runo: https://apps.apple.com/us/app/runo-metronome-for-running/id6503224807 ; TrailMix: https://apps.apple.com/us/app/trailmix-pro-step-to-the-beat/id479650960 ; RunningOn: https://apps.apple.com/vu/app/runningon/id6763771998
- Ochy: https://apps.apple.com/us/app/-/id1531481638 ; https://www.englandathletics.org/about-us/our-partners/ochy/
- OnForm: https://apps.apple.com/US/app/id1490334045
- Cep/gövde ivmeölçer yürüyüş fazı: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6263943/ ; saat vs bağcık IMU: https://pubmed.ncbi.nlm.nih.gov/40942989/

EIB / uyku / dehidrasyon:
- Stickland 2012 ısınma derlemesi: https://pubmed.ncbi.nlm.nih.gov/21811185/
- EIB sporcularda 2005: https://pubmed.ncbi.nlm.nih.gov/16354868/
- Mah 2011 Sleep: https://pmc.ncbi.nlm.nih.gov/articles/PMC3119836/
- Telefon idrar kolorimetrisi (Digital Health 2023): https://pmc.ncbi.nlm.nih.gov/articles/PMC10474791 ; GSSI Labs NCT07005895: https://clinicaltrials.gov/study/NCT07005895

Türkiye katılımcı sayıları:
- İstanbul Yarı Maratonu 17.300 kayıt: https://www.cumhuriyet.com.tr/spor/turkiye-is-bankasi-21-istanbul-yari-maratonu-19-nisan-pazar-gunu-kosuluyor-2493820
- Maratonİzmir 5.000+: https://www.fanatik.com.tr/maratonizmir-5-bini-askin-katilimciyla-kosulacak-2511222
