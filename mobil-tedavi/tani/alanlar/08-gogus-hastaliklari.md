# Göğüs Hastalıkları — Aile hekimi için telefonla tanı/triyaj fikirleri

> Hazırlayan: Göğüs hastalıkları araştırma ajanı (BRIEF-3). Tarih: 2026-10-26.
> Not: Bu turda paylaşılan web arama kotası (WebSearch) erken doldu; kalan doğrulamalar doğrudan kaynak sayfalardan (Europe PMC API, WHO TB veri tabanı, ClinicalTrials.gov) yapıldı. Doğrulanamayan sayılar **[doğrulanmadı]** ile işaretlidir.

## 0. Önce dürüst sınırlar (bu alanda telefonun yapamadıkları)

| İddia | Gerçek durum | Kaynak |
|---|---|---|
| **Kamera ile SpO2 (oksijen satürasyonu)** | Güvenilir değil. Sağlıklı çocuklarda kamera tabanlı uygulamanın test-tekrar güvenilirliği (ICC) **−0,24**, uyum sınırları −4,1/+3,5 puan; hipoksisi olan hasta hiç test edilmemiş. Tek grup, 6 gönüllülük indüklenmiş hipoksi çalışmasında ortalama mutlak hata **%5** SpO2, <%90 için duyarlılık %81 / özgüllük %79. Klinik karar için **kullanılmamalı**; ASM'de parmak pulse oksimetre zaten var (brief kuralı gereği "elle giriş" sayılır). | Tomlinson 2018 Telemed J E Health; Hoffman 2022 npj Digit Med |
| **Telefon göğse dayalı oskültasyon** | Stetoskop düzeyinde değil. 134 hastada telefon mikrofonu vs stetoskop uyumu %85 ama kappa **0,35** (zayıf). Kalp sesleri düşük frekansta zayıf. | Ferreira-Cardoso 2021 (Lung auscultation using the smartphone) |
| **Mikrofon spirometri — mutlak FEV1/FVC (litre)** | Güvenilir değil. Yerleşik mikrofonla FEV1 RMSE ~0,5 L, FVC sapması ~%28; FEV1 ~%35 (Reis 2025, J Bras Pneumol). Yalnızca **FEV1/FVC oranı** makul (r=0,81; MAE %4–7,6). | Reis 2025; 2017 J Bras Pneumol (n=26); Chung 2019; Rahman 2020 PerCom |
| **Öksürük sesinden TB** | Araştırma düzeyinde, bağımsız dış doğrulamada zayıf: CODA TB DREAM Challenge öksürük-tek AUROC **0,69–0,74**, %80 duyarlılıkta özgüllük %55; Peru dış doğrulaması (Zimmer 2026, Sci Rep) AUROC **0,48–0,62**. | Jaganath 2025 OFID; Zimmer 2026 |
| **Uyku apnesi ASM muayenesinde** | Gece kaydı gerekir; muayenede yapılamaz. Hasta-uygulaması olarak SleepCheck (ResApp/Pfizer) CE/TGA/FDA 510(k): AHI≥15 için duyarlılık %88,3, özgüllük %80, AUC 0,92 (Tiron 2020). | Tiron 2020 J Thorac Dis |

## 1. Aile hekiminin bu alanda en sık karşılaştığı tanı/sevk kararları (envanter)

| Durum | ASM'de sıklık (kaba) | Bugün nasıl karar veriyor | Yaygın hata/eksik | Telefon sensörü ne katabilir | Mevcut ürün/araştırma |
|---|---|---|---|---|---|
| **Akut öksürük / ASYE (alt solunum yolu enfeksiyonu) erişkin** — pnömoni mi, bronşit mi? | Solunum yakınmaları birinci basamak başvurularının en büyük grubu; Türkiye'de ASM'ye özgü oransal veri bulunamadı **[doğrulanmadı]**; Hac ortamında Türk hastalarda acil tanılarının %49'u solunum (BMC Emerg Med 2026 — dolaylı) | Anamnez, ateş, oskültasyon, SpO2; grafi dışarıda | Gereksiz antibiyotik (ASYE'de en sık), pnömoninin atlanması (yaşlı, KOAH'lı) | Öksürük sesi sınıflandırma; kamera solunum sayısı; PPG nabız | ResAppDx-EU (CE, erişkin+çocuk, Türkiye'de pazarda değil); Pfizer satın aldı (2022) |
| **Çocukta ASYE: pnömoni / bronşiyolit / krup / astım atağı — bugün hastaneye mi?** | <5 yaş çocuk başvurularında solunum enfeksiyonu en sık neden; WHO: hızlı solunum + göğüs çekilmesi tedavi/sevk ölçütü | Sayarak solunum hızı (çoğu kez sayılmıyor), göğüs çekilmesi gözle, SpO2 | Solunum sayısının sayılmaması/yanlış sayılması; göğüs çekilmesinin deneyimsiz gözle kaçması; gereksiz acil sevki | **Kamera ile solunum sayısı + göğüs çekilmesi fazı** (MAE 1,8/dk); öksürük sesi (krup PPA %85, bronşiyolit %84, pnömoni %87, astım %97) | Lucy 2021 Physiol Meas (video); Porter 2019 Respir Res (ResApp); RRate (dokunarak sayma, var); AIRR projesi (devam ediyor) |
| **KOAH (kronik tıkayıcı akciğer hastalığı) şüphesi — spirometre yokken** | Türkiye ≥40 yaş KOAH prevalansı ~%19 (BOLD Adana, Kocabaş 2006) **[doğrulanmadı — abstract erişilemedi]**; çoğunluğu tanısız | Sigara öyküsü + semptom; spirometri için hastaneye sevk → çoğu gitmiyor | Büyük tanı açığı; "kronik bronşit" diye geçiştirme; astım-KOAH karışması | **Mikrofon zorlu ekspirasyon → FEV1/FVC oranı** (yalnızca oran) + anket | SpiroSmart 2012 (ortalama hata %5,1, n=52, iPhone 4S); Chung 2019 (oran MAE 4,1); Wen 2025 (ekshalasyon+öksürük sesinden KOAH riski, n=530) — ürün yok |
| **KOAH alevlenmesi — ayakta mı, hastaneye mi?** | KOAH'lılarda yılda 0,5–3 alevlenme (genel bilgi) | Anthonisen ölçütleri, SpO2, muayene | Hafif alevlenmenin kaçırılması ya da her kötüleşmeye antibiyotik+steroid | Öksürük sesi + 3 soru algoritması (PPA %82,6, NPA %91) | Claxton 2021 npj Digit Med (ResApp algoritması; ürünleşmedi) |
| **Astım kontrolü / atak şiddeti** | Türkiye'de erişkinde ~2,7 milyon izlenen astımlı (2016–22, Turk J Med Sci 2026) | ACT anketi, PEF-metre (ASM'de nadir) | Kontrolsüz astımın izlemde kalması | Mikrofon zorlu ekspirasyon (oran/eğri), hırıltı tespiti | Hırıltı AI (Pais-Cunha 2026: doğruluk %87, F1 %61 — zayıf) |
| **Boğmaca (pertussis) şüphesi** | Avrupa'da 2024 artış; Türkiye verisi **[doğrulanmadı]** | Klinik (paroksizm, whoop, kusma), PCR dışarıda | Geç tanı → bebek teması, salgın | Öksürük nöbeti ses kaydı: whoop tespiti | Pramono 2016 PLoS One (n=38; tüm olgular doğru, yanlış tanı yok — küçük örneklem) |
| **TB taraması** | Türkiye insidansı **13/100.000 (2024), ~11.000 olgu/yıl** (WHO estimates; 2015'te 21) — düşük insidans | 2 hafta+ öksürük → balgam/grafi; VSD'ye sevk | Geç tanı ama temel sorun ses değil, erişim | Öksürük sesi AI | CODA TB (2025); Hyfe araştırma uygulaması — ürün yok |
| **Dispne (nefes darlığı) triyajı — acile mi?** | Sık; kalp/akciğer/anksiyete ayrımı | Solunum sayısı, SpO2, nabız, konuşma güçlüğü | Solunum sayısı en az ölçülen vital bulgu | Kamera solunum sayısı; konuşma akıcılığı (kanıt yok); PPG nabız | Kanıt: solunum sayısı için var; konuşma-dispne için bulunamadı |
| **Horlama / uyku apnesi** | Erişkinde OUA %10–20 (genel bilgi) | STOP-BANG → uyku laboratuvarı | Uzun bekleme | Gece mikrofon (hasta evde) | **SleepCheck zaten var** (CE/TGA/FDA) |
| **Sigara içen risk (akciğer kanseri, KOAH)** | Türkiye'de erişkin sigara ~%28 (genel bilgi) | Anket | Tarama BT programı yok | Sensör katkısı yok → anket (brief: ana hedef değil) | — |

## 2. Proje fikirleri (telefon tek başına, hekim kullanır)

### Fikir 1: "NefesSay" — çocukta pnömoni triyajı: kamera ile solunum sayısı + göğüs çekilmesi + öksürük sesi (WHO/IMCI)
- **Klinik soru:** "Bu 2 ay–5 yaş arası öksüren/ateşli çocukta hızlı solunum ya da göğüs çekilmesi var mı → antibiyotik + evde izlem mi, bugün hastaneye sevk mi?"
- **Hasta akışı:** Çocuk ASYE, <5 yaş başvurularının en büyük nedeni; WHO/IMCI'de pnömoni sınıflaması tamamen solunum sayısı (2–12 ay ≥50/dk, 1–5 yaş ≥40/dk) ve göğüs çekilmesine dayanır. Türkiye'de ASM'de yıllık sayı için güvenilir kaynak bulunamadı **[doğrulanmadı]**; günde 60–100 hastalık ASM'de kış aylarında günde 5–15 çocuk ASYE gerçekçi.
- **Telefonda nasıl çalışır:** Hekim çocuğun üstünü açtırır (annesinin kucağında olabilir), arka kamera 30–60 sn göğüs-karın videosu çeker. Uygulama: (a) RGB/optik akış ile solunum dalgası → solunum sayısı; (b) göğüs alt kesimi ile karın hareketinin **faz farkı** → göğüs çekilmesi (pnömonide 143°±24 vs sağlıklıda 52°±33); (c) isteğe bağlı 5 öksürük kaydı → krup/bronşiyolit/pnömoni/astım olasılığı; (d) hekim ateş, yaş, beslenme/emme, uykuya meyil, stridor gibi IMCI tehlike işaretlerini 6 kutuya tıklar. Çıktı: "Pnömoni yok / Pnömoni (ayakta tedavi) / Ağır pnömoni — sevk" + sayısal solunum hızı + video klip (dosyaya kaydedilebilir). Süre ≤2 dk.
- **Kanıt:** Lucy ve ark. 2021 (Physiol Meas; Dakka): telefon kamerası videosundan solunum sayısı **MAE 1,8/dk** (18–105/dk aralığı), göğüs çekilmesi fazı anlamlı fark (p<0,001) — küçük örneklem, deep learning yok, Bangladeş. RRate (dokunarak sayma) WHO ARI timer'dan daha doğru (%10,6 vs %14,8 hata). Öksürük bileşeni: Porter 2019 (n=585, 29 gün–12 yaş, iPhone): pnömoni PPA %87/NPA %85, krup %85/%82, bronşiyolit %84/%81, astım %97/%91; referans standart pediatrist paneli. ABD SMARTCOUGH-C ön sonuçlarında gürültü/önceden tedavi nedeniyle performans düştü (şirket açıklaması). Kamera+öksürük **birleşiminin** doğruluğuna dair çalışma yok → "kanıt yok, bileşen kanıtı var".
- **Mevcut uygulamalar:** ResAppDx-EU (öksürük, CE; Türkiye'de yok; Pfizer sonrası ticari durum belirsiz, v2.0 ED çalışmaları ClinicalTrials.gov'da 2023–24 kayıtlı); RRate (dokunma, sensör değil); AIRR (Malaria Consortium, video AI, sonuç yok); Dhaka grubu prototip (ürün yok). **Fark:** solunum sayısı + göğüs çekilmesini kameradan nesnel ölçen ve IMCI'ye bağlayan hekim uygulaması yok.
- **Teknik zorluklar + çözüm:** Hareketli çocuk → hareket dengeleme, 10 sn'lik en stabil pencereleri seçme, kalite skoru ("yeniden çek"); ışık → dokulu bölge takibi (optik akış) RGB'den daha dayanıklı; cihaz çeşitliliği → 30 fps yeterli; Türkçe veri gerekmez (görüntü), öksürük modeli için Türkiye'de pediatri kliniğinden etiketli veri toplamak gerekir; ağlayan çocukta öksürük kaydı alınamaz → öksürük modülü isteğe bağlı.
- **Regülasyon:** MDR Kural 11 — tanı/tedavi kararına bilgi sağlayan yazılım → en az **IIa**; "ağır pnömoni/sevk" kararı ciddi kötüleşme riski taşıdığı için **IIb** olabilir. Konumlandırma: "IMCI sayım/gözlem yardımcısı — karar hekimindir". KVKK: çocuk videosu özel nitelikli sağlık verisi; cihazda işleme, video saklanmıyor, yalnız sayısal çıktı.
- **Riskler:** Yanlış negatif (düşük sayım → ağır pnömoninin eve gönderilmesi) → sayım aralığı eşiğe yakınsa "elle 60 sn say" uyarısı; tehlike işaretleri her zaman algoritmayı ezer. Yanlış pozitif → gereksiz acil sevki (maliyet düşük, zarar az).
- **Puan:** Teknik 7 | Kanıt 6 | Etki 9 | Yenilik 7 | Düşük risk 6 | İş akışı 8 | **TOPLAM 43/60**

### Fikir 2: "SesSpiro" — spirometresiz KOAH/astım ön eleme: mikrofon zorlu ekspirasyon → FEV1/FVC oranı + sigara/semptom anketi
- **Klinik soru:** "Bu 40+ yaş, sigara içen, nefes darlığı/kronik öksürüğü olan hastada hava yolu tıkanıklığı (FEV1/FVC <0,70) olasılığı yüksek mi → spirometri için göğüs hastalıklarına sevk edeyim mi, yoksa izleyeyim mi?"
- **Hasta akışı:** BOLD Adana (Kocabaş 2006): ≥40 yaşta KOAH prevalansı ~%19 (erkek ~%28) **[doğrulanmadı]**; BOLD küresel: 41 merkezde kronik hava akımı kısıtlılığı %10 (Knox-Brown 2025, n=28.604). Olguların büyük çoğunluğu tanısız (küresel literatürde %70–90, genel bilgi). ASM'de spirometre neredeyse hiç yok; sevk edilen hastanın önemli bölümü spirometriye gitmiyor.
- **Telefonda nasıl çalışır:** Hekim telefonu hastanın ağzından ~30 cm, ekran hastaya dönük tutar; hasta 3 kez derin nefes alıp **zorlu, uzun** üfler (hekim koçluk eder, uygulama "6 saniye tamamla" sayacı gösterir). Mikrofon kaydı → zarf (envelope) tabanlı akış tahmini → akım-zaman eğrisi → **FEV1/FVC oranı** ve FEV1'in %1'e düştüğü ekspirasyon süresi (FET), eğri konkavlığı. Mutlak litre değeri **verilmez** (kanıt yetersiz). Çıktı: "Tıkanıklık olasılığı: düşük / orta / yüksek" + CAT/mMRC + paket-yıl → GOLD vaka bulma skoru → "spirometri sevk öner / 6 ay sonra tekrar". Astımlı hastada aynı manevra ile hekim ofisinde "kontrol" izlemi (oran ve eğri trendi). Süre ≤2 dk.
- **Kanıt:** SpiroSmart (Larson 2012, UbiComp, n=52, iPhone 4S): yaygın ölçütlerde klinik spirometreye göre ortalama hata **%5,1**, ağırlıklı sağlıklı gönüllü; pulmonologlar obstrüksiyon derecesini ayırt edebildi. SpiroCall (2016): akustik kalite düşük telefon hattından bile benzer sonuç [ayrıntı doğrulanmadı]. 2017 Brezilya (n=26, 13 KOAH): yalnız FEV1/FVC oranı anlamlı (r=0,81; FEV1 r=0,28). Chung 2019 (n=13): oran MAE 4,1. Rahman 2020 (PerCom): zorlu ekspirasyon tespiti F1 %96,7, FEV1/FVC MAE %7,6. Reis 2025 (J Bras Pneumol, derin öğrenme, Samsung yerleşik mikrofon): FEV1 RMSE ~0,5 L — **mutlak hacimler güvenilmez**. Wen 2025 (n=530): ekshalasyon+öksürük sesinden FEV1/FVC<0,7 riski, XGBoost precision 0,98 / recall 0,89 (tek merkez, dış doğrulama yok). Referans standart: klinik spirometre. Sonuç: oran için "orta düzey araştırma kanıtı", KOAH tanısı için "kanıt yok"; **tarama/sevk önceliklendirme** olarak gerçekçi.
- **Mevcut uygulamalar:** SpiroSmart/SpiroCall (UW araştırma, ürün yok); ticari "akıllı telefon spirometresi" uygulamalarının tamamı Bluetooth türbinli cihaz gerektirir (MIR Smart One, Spirobank, NuvoAir — **ek donanım, kapsam dışı**). Mikrofon-tek, hekim odaklı, GOLD vaka bulma anketiyle birleşik ürün yok.
- **Teknik zorluklar + çözüm:** Mikrofon frekans yanıtı cihaza göre değişir → cihaz-bağımsız özellikler (bağıl zarf, oran), her modelde 1 kez beyaz gürültü kalibrasyonu; ağız-telefon mesafesi → ön kamera ile yüz mesafesi tahmini; ortam gürültüsü (ASM) → 2 kayıt tutarlılığı (ATS/ERS tekrarlanabilirlik mantığı ile %10 farkta tekrar); hastanın manevra kalitesi → hekim koçluğu + "erken kesme/ öksürük" algılama; Türkçe veri gerekmez; Türkiye'de spirometre eşli 300–500 hastalık kalibrasyon seti şart.
- **Regülasyon:** MDR Kural 11 → **IIa** (tanı kararına bilgi). "Tarama/sevk önceliklendirme, spirometri yerine geçmez" etiketlemesi zorunlu. KVKK: ses kaydı biyometrik sayılabilir → cihazda işleme, ham ses saklanmaz.
- **Riskler:** Yanlış negatif → KOAH'lının sevk edilmemesi; ancak bugünkü durumda zaten sevk edilmiyor, net zarar düşük; semptom/paket-yıl yüksekse oran ne olursa olsun sevk önerilir. Yanlış pozitif → gereksiz spirometri sevki (ucuz, zararsız). Astımda "kontrol" izlemi için mutlak FEV1 verilmediğinden hekime yanlış güven verme riski — arayüzde oran+eğri yalnızca trend amaçlı.
- **Puan:** Teknik 6 | Kanıt 6 | Etki 9 | Yenilik 7 | Düşük risk 7 | İş akışı 7 | **TOPLAM 42/60**

### Fikir 3: "AlevlenmeKontrol" — KOAH'lıda alevlenme ve sevk kararı: 5 öksürük + 3 soru + kamera solunum sayısı + PPG nabız
- **Klinik soru:** "Bu bilinen KOAH'lı hasta alevlenmede mi; alevlenmedeyse ağır mı (hastane) yoksa ayakta antibiyotik/steroid ile izlenebilir mi?"
- **Hasta akışı:** Türkiye'de KOAH'lı hastaların önemli kısmı ASM'de reçete yenilemeye geliyor; GOLD'a göre orta-ağır KOAH'ta yılda ortalama 1–2 alevlenme (genel bilgi). ASM'de alevlenme değerlendirmesi semptom bazlı, nesnel ölçüm yok.
- **Telefonda nasıl çalışır:** (1) Hekim 3 soruyu tıklar (yaş, ateş, yeni/artan öksürük — Claxton algoritması girdileri) + balgam rengi/miktarı (Anthonisen); (2) hasta 5 kez öksürür, mikrofon kaydeder (30 sn); (3) 30 sn göğüs videosu → solunum sayısı; (4) 30 sn parmak-PPG → nabız. Çıktı: "Alevlenme olasılığı yüksek/düşük" + şiddet bayrakları (solunum ≥30/dk, nabız ≥110, konuşamıyor, bilinç) → "ayakta tedavi / acile sevk". ≤2,5 dk.
- **Kanıt:** Claxton 2021 (npj Digit Med; ResApp algoritması; n=86 alevlenme, 78 stabil; referans uzman klinik değerlendirme): alevlenme varlığı PPA **%82,6** (%72,9–89,9), yokluğu NPA **%91,0** (%82,4–96,3); hafif olgularda PPA %79,2. Acemi kullanıcı yapabiliyor. Tek çalışma, tek ülke (Avustralya), prospektif. Ses tabanlı 3 gün öncesinden tahmin (TACTICAS, Maastricht, n=73) → erken aşama. Şiddet eşikleri için sensör kanıtı: solunum sayısı kamera MAE 1,8/dk (çocukta), erişkinde ayrı doğrulama **kanıt yok**.
- **Mevcut uygulamalar:** ResApp'in algoritması yayınlandı ama ürün olarak piyasaya çıkmadı (Pfizer satın alması sonrası sessizlik); myCOPD, Propeller vb. hasta izlem uygulamaları semptom günlüğü (sensör yok). **Fark:** hekim muayenesinde öksürük sesi + vital sensör ile alevlenme ve şiddet triyajı yapan ürün yok.
- **Teknik zorluklar + çözüm:** Öksürük modeli Türkiye verisiyle yeniden eğitilmeli/valide edilmeli (ses özellikleri dil bağımsız ama kayıt ortamı farklı); ASM gürültüsü → gürültü kapısı; yaşlı hastada zorla öksürtme güçlüğü → spontan öksürük kabul.
- **Regülasyon:** MDR Kural 11 → **IIa/IIb** (sevk kararı); KVKK ses verisi.
- **Riskler:** Yanlış negatif → ağır alevlenmenin ayakta izlenmesi (şiddet bayrakları algoritmayı ezer → risk azalır). Yanlış pozitif → gereksiz steroid/antibiyotik; bugün zaten yüksek olan gereksiz kullanımı azaltma potansiyeli de var.
- **Puan:** Teknik 7 | Kanıt 5 | Etki 7 | Yenilik 6 | Düşük risk 6 | İş akışı 7 | **TOPLAM 38/60**

### Fikir 4: "DispneTriyaj" — erişkin nefes darlığında acil/ayakta ayrımı: kamera solunum sayısı + cümle-sayma konuşma testi + PPG nabız/ritim + kırmızı bayraklar
- **Klinik soru:** "Bu nefes darlığıyla gelen erişkin bugün acile mi gitmeli?"
- **Hasta akışı:** Dispne birinci basamakta sık, nedenleri heterojen (KOAH, astım, kalp yetmezliği, anksiyete, PE). Solunum sayısı en çok atlanan vital bulgu (genel bilgi).
- **Telefonda nasıl çalışır:** 30 sn göğüs videosu → solunum sayısı; mikrofonla "1'den 30'a kadar tek nefeste say" → sayılan sayı ve nefes kesme sayısı; 30 sn PPG → nabız + düzensizlik (AF: zaten var olan yöntem, FibriCheck tipi); hekim 8 kırmızı bayrak tıklar (göğüs ağrısı, senkop, bilinç, ortopne, bacak şişliği, ateş, hemoptizi, SpO2 — pulse oksimetreden elle). Çıktı: NEWS2-benzeri skor + "acil / 24 saat içinde / planlı".
- **Kanıt:** Solunum sayısı kamera: çocukta MAE 1,8/dk (Lucy 2021); erişkinde rPPG tabanlı temassız sistemler "mükemmel uyum" bildiriyor (dental ortam, n=499, 2026; sayısal yok). Konuşma/sayma testinin dispne şiddetiyle ilişkisi: literatürde klinik "sayma testi" tanımlı ama **telefon mikrofonuyla doğrulama bulunamadı → kanıt yok**. PPG nabız: iyi doğrulanmış.
- **Mevcut uygulamalar:** NEWS2 hesaplayıcılar (anket); solunum sayısı için ürün yok (hekim uygulaması olarak). **Fark:** sensörle solunum sayısı ve konuşma kesintisi ölçümü.
- **Teknik zorluklar:** Erişkinde giysi üstünden solunum hareketi düşük genlikli → omuz/boyun bölgesi takibi; Türkçe sayma kaydı için konuşma bölütleme (Türkçe veri gerekir).
- **Regülasyon:** IIa; "karar desteği". **Riskler:** Yanlış negatif ciddi (PE/MI kaçırma) → kırmızı bayraklar algoritmayı ezer; yanlış pozitif → gereksiz acil.
- **Puan:** Teknik 6 | Kanıt 4 | Etki 7 | Yenilik 5 | Düşük risk 5 | İş akışı 7 | **TOPLAM 34/60**

### Fikir 5: "WhoopTespit" — boğmaca şüphesinde öksürük nöbeti ses analizi (ebeveyn kaydı + hekim analizi)
- **Klinik soru:** "Bu 2 haftadır paroksizmal öksüren çocuk/erişkin boğmaca mı → PCR + makrolid + temas profilaksisi + bildirim?"
- **Hasta akışı:** Avrupa'da 2024'te boğmaca olgularında büyük artış; Türkiye'de bildirim sayıları **[doğrulanmadı]**. ASM'de nöbet muayenede nadiren görülür; ebeveyn evde telefonla kaydeder.
- **Telefonda nasıl çalışır:** Hekim, ebeveynin telefonundaki nöbet videosunu/sesini uygulamaya aktarır (ya da muayenede kayıt). Algoritma: öksürük tespiti → paroksizm (≥5 ardışık öksürük, aralıksız) → inspiratuar **whoop** tespiti → boğmaca olasılığı. Çıktı: "whoop var/yok, paroksizm uzunluğu" + klinik soru seti (kusma, apne, aşı durumu, yaş<1). ≤1 dk analiz.
- **Kanıt:** Pramono 2016 (PLoS One, n=38): öksürük tespiti doğruluk %92/PPV %97; tüm boğmaca olguları doğru, yanlış pozitif yok — **çok küçük örneklem, tek çalışma, prospektif değil**. Genel öksürük tespiti: Hyfe uyarılmış seslerde duyarlılık %91, özgüllük %98. Pediatrik öksürük tespiti: doğruluk %99,7 ama duyarlılık %47,6 (Maastricht) → ölçütlere dikkat.
- **Mevcut uygulamalar:** Yok (Hyfe CoughPro öksürük sayar, sınıflandırmaz). **Fark:** whoop/paroksizm tespiti.
- **Teknik zorluklar:** Ebeveyn kayıt kalitesi; bebekte whoop olmayabilir (apne); Türkiye'de etiketli boğmaca ses seti yok → VSD/pediatri ile prospektif toplama şart.
- **Regülasyon:** IIa. **Riskler:** Yanlış negatif → bebek teması, geç tedavi; yanlış pozitif → gereksiz makrolid (zarar düşük).
- **Puan:** Teknik 7 | Kanıt 3 | Etki 5 | Yenilik 8 | Düşük risk 6 | İş akışı 6 | **TOPLAM 35/60**

### Fikir 6: "HırıltıDinle" — küçük çocukta telefon göğse dayalı hırıltı (wheeze) tespiti ve astım atağı şiddeti
- **Klinik soru:** "Bu hırıltılı çocukta bronkodilatör sonrası hırıltı kayboldu mu; atak şiddeti eve göndermeye uygun mu?"
- **Telefonda nasıl çalışır:** Telefon mikrofonu 4 göğüs noktasına 10'ar sn dayanır; AI hırıltı var/yok ve hırıltı yüzdesi; bronkodilatör öncesi/sonrası karşılaştırma.
- **Kanıt:** Pais-Cunha 2026 (Eur J Pediatr; n=217 çocuk, 2.020 kayıt, %74'ü kalite ölçütünü geçti; referans 2 kör etiketleyici): doğruluk %87 ama **F1 %61**; daha eski telefon algoritması duyarlılık %71,4 / özgüllük %88,9 ("günlük pratik için yetersiz"). Özel cihazlar (Japon ev tipi wheeze cihazı) %96/%98 ama ek donanım. Telefon oskültasyonu genel kappa 0,35.
- **Mevcut:** Araştırma var, ürün yok (ek donanımlı: StethoMe, Wheezo — kapsam dışı). **Fark:** donanımsız.
- **Zorluklar:** Ağlayan çocuk, ortam gürültüsü, kayıtların %26'sı kalitesiz; hekim kulağı (stetoskopla) zaten daha iyi → **hekime değer katması şüpheli**.
- **Regülasyon:** IIa. **Riskler:** Yanlış negatif atak sonrası eve gönderme.
- **Puan:** Teknik 5 | Kanıt 3 | Etki 5 | Yenilik 5 | Düşük risk 5 | İş akışı 6 | **TOPLAM 29/60**

### Fikir 7: "ÖksürükSınıf-TR" — erişkin akut öksürükte pnömoni/bronşit/astım/KOAH ayrımı (ResAppDx benzeri, Türkiye verisi)
- **Klinik soru:** "Bu öksüren erişkinde pnömoni olasılığı antibiyotik/grafi gerektirecek kadar yüksek mi?"
- **Nasıl çalışır:** 5 öksürük + 4 semptom sorusu → olasılık.
- **Kanıt:** Erişkinde ResApp şirket verisi (n=322 çalışma; PPA %90–100, NPA %89–96 şirket açıklaması, hakemli pnömoni-özgü yayın bulunamadı); çocukta Porter 2019 hakemli. ABD çalışmasında gerçek dünya gürültüsüyle düşüş. Cureus 2025 sistematik derleme (6 çalışma, n 65–585): duyarlılık %82–94, özgüllük %71–91.
- **Mevcut:** **ResAppDx-EU zaten var (CE)**; Türkiye'de pazarda değil ve Pfizer sonrası ticari gelecek belirsiz; ClinicalTrials.gov'da v2.0 ED çalışmaları (NCT06156462/NCT06156436) devam ediyor. Brief kuralı 4: aynı işi yapan ürün var → yalnız "Türkiye'de erişilemiyor" farkıyla **önerilmez**; Fikir 1 ve 3 içinde modül olarak yer alıyor.
- **Puan:** Teknik 7 | Kanıt 6 | Etki 7 | Yenilik 2 | Düşük risk 6 | İş akışı 8 | **TOPLAM 36/60** (yenilik düşük → elenenlere yakın)

## 3. Alanın en iyi 3 fikri ve gerekçe

1. **NefesSay — çocuk pnömoni triyajı (43/60).** WHO/IMCI'nin tamamı iki nesnel bulguya dayanır (solunum sayısı, göğüs çekilmesi) ve ikisi de ASM'de ya sayılmıyor ya da subjektif. Kamera ile ölçüm için hakemli doğruluk verisi var (MAE 1,8/dk), göğüs çekilmesi faz analizi ilk kanıtı sunuyor, öksürük modülü için 585 çocukluk hakemli çalışma var. Hiçbir ürün bu üçünü hekim için birleştirmiyor. Kararın değeri yüksek (sevk/antibiyotik), yanlış pozitifin zararı düşük.
2. **SesSpiro — spirometresiz obstrüksiyon ön elemesi (42/60).** Türkiye'de KOAH prevalansı yüksek, tanı açığı büyük, ASM'de spirometre yok. Mikrofondan **yalnız FEV1/FVC oranı** istemek dürüst ve kanıtlı (r≈0,81; MAE %4–8); mutlak FEV1 vaat edilmez. Tüm ticari rakipler Bluetooth türbin ister (kapsam dışı); donanımsız, hekim odaklı ürün yok. Kalibrasyon seti gerektirir ama regülasyon yolu net (IIa, tarama).
3. **AlevlenmeKontrol — KOAH alevlenme/şiddet (38/60).** Tek ama prospektif ve hakemli bir çalışma (PPA %82,6 / NPA %91) algoritmanın yapılabilir olduğunu gösteriyor ve ResApp bunu ürünleştirmedi. Mevcut KOAH hastasında yinelenen bir karar olduğu için ASM'de kullanım sıklığı yüksek; şiddet bayraklarıyla güvenlik ağı kurulabilir.

## 4. Elenenler

- **Kamera SpO2:** Güvenilir değil (ICC −0,24; MAE %5) — ASM'de pulse oksimetre var → **yapılamaz/değer katmaz**.
- **TB öksürük taraması:** Bağımsız dış doğrulamada AUROC 0,48–0,74; Türkiye insidansı 13/100.000 → ASM'de PPV %1'in altında; TB'de sorun ses değil balgam/grafi erişimi → **kanıt zayıf + Türkiye'ye uygun değil**.
- **Uyku apnesi mikrofon:** **SleepCheck zaten var** (CE/TGA/FDA 510(k), duyarlılık %88 / özgüllük %80); muayenede yapılamaz, hasta evde kullanır.
- **Erişkin öksürük sınıflandırma (ResAppDx klonu):** **Zaten var** (CE); Türkiye'de olmaması tek fark → önerilmez, modül olarak Fikir 1/3'te.
- **Öksürük sayımı (Hyfe CoughPro/CoughMonitor):** **Zaten var** (duyarlılık %90,4; 1,03 yanlış pozitif/saat); tanı değil izlem.
- **Telefon göğse dayalı oskültasyon (kalp/akciğer sesleri, krepitan):** Kappa 0,35; hekimin stetoskopu daha iyi → **hekime değer katmıyor**.
- **Hırıltı tespiti (Fikir 6):** F1 %61 → **kanıt yetersiz**; stetoskop varken değer düşük.
- **Mikrofon spirometride mutlak FEV1/FVC (litre):** RMSE 0,5 L → **yapılamaz**; yalnız oran (Fikir 2).
- **Sigara içen risk hesaplayıcı / astım kontrol anketi (ACT) / mMRC-CAT:** Salt anket → **brief ana hedefi değil**, zaten var (MDCalc, ACT).
- **Konuşma/ses ile KOAH alevlenme öngörüsü (TACTICAS):** n=73, erken aşama, günlük kayıt gerektirir (hasta uygulaması) → **kanıt yok/hekim kullanımına uymuyor**.
- **Ses biyobelirteçleriyle dispne şiddeti:** Telefon doğrulaması bulunamadı → **kanıt yok** (Fikir 4'te yalnızca yardımcı bileşen).

## 5. Kaynaklar (URL; doğrulanmayanlar işaretli)

**Öksürük sınıflandırma / ResApp**
- Porter P et al. A prospective multicentre study testing the diagnostic accuracy of an automated cough sound centred analytic system… Respir Res 2019;20:81. PMID 31167662 — https://doi.org/10.1186/s12931-019-1046-6 (Europe PMC özetinden doğrulandı: n=585; PPA/NPA astım 97/91, pnömoni 87/85, LRTD 83/82, krup 85/82, bronşiyolit 84/81)
- Sharan RV, Abeyratne UR, Swarnkar VR, Porter P. Automatic Croup Diagnosis Using Cough Sound Recognition. IEEE Trans Biomed Eng 2019. PMID 29993458 (eğitim 364 / test 115; duyarlılık %92,3, özgüllük %85,3 — doğrulandı)
- Claxton S et al. Identifying acute exacerbations of COPD using patient-reported symptoms and cough feature analysis. npj Digit Med 2021;4:107 — https://pmc.ncbi.nlm.nih.gov/articles/PMC8253790 (PPA %82,6; NPA %91,0 — doğrulandı)
- ResApp SMARTCOUGH-C ön sonuçları (şirket açıklaması) — https://biotechdispatch.com.au/news/resapp-reports-preliminary-top-line-results-from-smartcough-c-st
- ResApp erişkin PPA/NPA %90–100 / %89–96 (şirket, ASX açıklaması) — https://www.asx.com.au/asxpdf/20170622/pdf/43k3bng1v1x56g.pdf **[hakemli değil]**
- Health Technology Wales TER198 ResAppDx-EU değerlendirmesi — https://healthtechnology.wales/wp-content/uploads/2020/03/TER198-ResAppDx-EU.pdf
- ClinicalTrials.gov NCT06156462 (erişkin ED, ResAppDx v2.0) — https://clinicaltrials.gov/study/NCT06156462 ; NCT06156436 (pediatrik) — https://clinicaltrials.gov/study/NCT06156436
- Pfizer–ResApp satın alması (2022) — https://pharmaphorum.com/news/pfizer-makes-bid-for-resapp-and-its-respiratory-diagnosis-apps/
- Abdelhalim et al. 2025 Cureus sistematik derleme (6 çalışma; duyarlılık %82–94, özgüllük %71–91) — Europe PMC özetinden **[URL doğrulanmadı]**

**Boğmaca**
- Pramono RX, Imtiaz SA, Rodriguez-Villegas E. A Cough-Based Algorithm for Automatic Diagnosis of Pertussis. PLoS One 2016. PMID 27583523 (n=38 — doğrulandı)

**Öksürük sayımı (Hyfe)**
- Hyfe CoughMonitor çok merkezli doğrulama, Sci Rep 2025 (duyarlılık %90,4; 1,03 FP/saat) — https://hyfe.ai/publication/validation-of-the-hyfe-cough-monitoring-system-a-multicenter-clinical-study ; NCT05723159
- Hyfe Cough Tracker uyarılmış sesler, F1000Research 2022 — https://f1000research.com/articles/11-730
- Maastricht pediatrik öksürük algoritması (doğruluk %99,7, duyarlılık %47,6) — https://cris.maastrichtuniversity.nl/en/publications/development-and-technical-validation-of-a-smartphone-based-pediat

**Mikrofon spirometri**
- Larson EC et al. SpiroSmart. UbiComp 2012 — https://homes.cs.washington.edu/~shwetak/papers/SpiroSmart.CR.Final.pdf (n=52, ortalama hata %5,1)
- SpiroCall (UW, 2016) — https://ubicomplab.cs.washington.edu/publications/spirosmart **[ayrıntılar doğrulanmadı]**
- J Bras Pneumol 2017 (n=26; yalnız FEV1/FVC r=0,81) — https://www.jornaldepneumologia.com.br/details/4137/en-US
- Chung H et al. Remote PFT monitoring via smartphone built-in microphone. 2019 (n=13; oran MAE 4,12) — Europe PMC özeti
- Rahman et al. PerCom 2020 (FEV1/FVC MAE %7,57) — https://staff.itee.uq.edu.au/jaga/proceedings/percom2020/papers/p147-rahman.pdf
- Reis et al. Pulmonary function estimation using smartphone audio and deep learning. J Bras Pneumol 2025 — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12602046/ (FEV1 RMSE ~0,5 L)
- Wen et al. 2025 ekshalasyon+öksürük ile KOAH riski (n=530) — Europe PMC özeti **[URL doğrulanmadı]**
- Knox-Brown et al. BOLD 2025 (n=28.604; %10 kronik hava akımı kısıtlılığı) — Europe PMC özeti
- Kocabaş A et al. BOLD Adana 2006 (≥40 yaş KOAH ~%19) — **[doğrulanmadı; özet erişilemedi]**

**Solunum sayısı / göğüs çekilmesi**
- Lucy FK et al. Video based non-contact monitoring of respiratory rate and chest indrawing in children with pneumonia. Physiol Meas 2021. PMID 34715683 — https://doi.org/10.1088/1361-6579/ac34eb (MAE 1,8/dk; faz 143° vs 52°)
- RRate vs WHO ARI timer — https://research-collection.ethz.ch/handle/20.500.11850/110872
- AIRR projesi (Malaria Consortium) — https://malariaconsortium.org/publications/1394/using-artificial-intelligence-on-mobile-devices-to-determine-respiratory-rate-airr

**Hırıltı / oskültasyon**
- Pais-Cunha et al. Wheeze detection in real-world pediatric care: AI applied to smartphone lung auscultation. Eur J Pediatr 2026. PMID 42118398 — https://link.springer.com/article/10.1007/s00431-026-07036-9 (doğruluk %87, F1 %61)
- Ferreira-Cardoso et al. Lung Auscultation Using the Smartphone — Feasibility Study. Int J Med Sci 2021;18:1415 — https://medsci.org/v18p1415.htm (n=134, kappa 0,35)
- EMJ 2021 "Digital support for wheeze detection" (duyarlılık %71,4 / özgüllük %88,9) — https://www.emjreviews.com/wp-content/uploads/2021/10/Digital-Support-for-Wheeze-Detection-in-Young-Children.pdf

**TB**
- Jaganath D et al. CODA TB DREAM Challenge. Open Forum Infect Dis 2025. PMID 41064697 (n=2.143, 7 ülke; AUROC 0,69–0,74)
- Zimmer et al. Sci Rep 2026, Peru dış doğrulaması (n=303; AUROC 0,48–0,62) — Europe PMC özeti
- "Why ML-based cough models do not generalize" (arXiv 2025) — https://arxiv.org/pdf/2608.25846
- WHO TB estimates, Türkiye (e_inc_100k 2024=13; 2015=21; olgu ~11.000) — https://extranet.who.int/tme/generateCSV.asp?ds=estimates&iso2=TR (indirildi, doğrulandı)

**SpO2**
- Tomlinson S et al. Accuracy of Smartphone-Based Pulse Oximetry Compared with Hospital-Grade… Telemed J E Health 2018;24(7) (n=81; kamera uygulaması ICC −0,24) — Europe PMC özeti
- Hoffman JS et al. Smartphone camera oximetry in an induced hypoxemia study. npj Digit Med 2022 (MAE %5; n=6) — https://www.darkdaily.com/2023/08/21/study-finds-smartphones-can-be-as-accurate-as-pulse-oximeters-at-reading-blood-oxygen-saturation/ (ikincil kaynak)

**Uyku apnesi**
- Tiron R et al. Screening for OSA with novel hybrid acoustic smartphone app technology. J Thorac Dis 2020 (test n=120; AHI≥15 duyarlılık %88,3, özgüllük %80, AUC 0,92)
- SleepCheckRx FDA 510(k) — https://blue-harvest.mobihealthnews.com/news/anz/resapp-gets-510k-clearance-mobile-sleep-apnoea-test-sleepcheck

**Epidemiyoloji / diğer**
- Asthma data in Türkiye 2016–2022 (≈2,7 milyon izlenen erişkin). Turk J Med Sci 2026. PMID 42058994
- Türkiye ASM'de solunum başvuru oranı, boğmaca bildirim sayıları, KOAH alevlenme sıklığı — **[doğrulanmadı; arama kotası doldu]**
