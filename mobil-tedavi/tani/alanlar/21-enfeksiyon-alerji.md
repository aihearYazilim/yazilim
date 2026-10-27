# Enfeksiyon Hastalıkları ve Alerji-İmmünoloji — Aile hekimi için telefonla tanı/triyaj fikirleri

> Hazırlayan: Enfeksiyon hastalıkları + alerji-immünoloji araştırma ajanı (BRIEF-3). Tarih: 2026-10-26.
> Yöntem: WebSearch (kota dolmadı, ~30 sorgu) + Europe PMC API ile özet doğrulama. PubMed sayfaları çerez engeline takıldı; özetler Europe PMC'den alındı. Doğrulanamayan sayılar **[doğrulanmadı]** ile işaretlidir. Doğruluk rakamları yalnızca gerçek çalışmalardan alınmıştır; çalışma bulunamayan yerlerde "kanıt yok" yazılmıştır.

## 0. Önce dürüst sınırlar (bu alanda telefonun yapamadıkları)

| İddia | Gerçek durum | Kaynak |
|---|---|---|
| Boğaz fotoğrafından "strep (A grubu beta hemolitik streptokok) var/yok" | Yayımlanan çalışmaların hiçbiri referans standart olarak **boğaz kültürü/hızlı antijen testi (HAT)** kullanmıyor; "şiddetli/eksüdatif farenjit vs normal" sınıflaması yapıyor. Eksüdalı viral farenjit (EBV, adenovirüs) fotoğrafta aynı görünür. Fotoğraf AI, Centor/McIsaac gibi bir **ön olasılık** aracıdır; kültürün yerini tutamaz. | Yoo 2020 (Eur Arch ORL), Askarian 2019 (Sensors), 2025 Avustralya ön-kavram çalışması |
| Öksürük sesinden COVID/grip/RSV ayrımı | COVID vs sağlıklı iç doğrulamada AUC 0,72–0,94; dış/zaman kaymalı doğrulamada belirgin düşüş (Omicron'da AUC "belirgin azalma"). Üç virüsü birbirinden ayıran yayımlanmış çalışma **bulunamadı**. ResApp'in COVID öksürük testi bağımsız tekrarda başarısız oldu (2022, şirket açıklaması) [doğrulanmadı]. | Santosh 2022 PeerJ CS; JMIR 2024 (Cambridge→Coswara/Virufy) |
| Öksürük sesinden TB | CODA TB DREAM (2.143 erişkin, 7 ülke): öksürük-tek AUROC **0,69–0,74**, %80 duyarlılıkta özgüllük %55; klinik veri eklenince 0,78–0,83. Zambiya ön baskısı (n=512, çok modlu) WHO hedefini (≥%90/≥%70) tek merkezde tutturdu, dış doğrulama yok. Türkiye düşük insidanslı (13/100.000). | Jaganath 2025 OFID; arXiv 2509.09746 |
| Termal kamera ile selülit | JAMA Dermatol 2024 çalışması iPad'e takılı termal kamera kullandı → **ek donanım, kapsam dışı**. Telefon RGB kamerası cilt sıcaklığını ölçemez. | Ko 2024 JAMA Dermatol |
| Kapiller dolum süresi (KDS) telefon videosu | Tek kayıtlı doğrulama çalışması (CRTApp, AP-HP, NCT07473869, 60 YBÜ hastası) henüz sonuç vermedi. Yayımlanmış telefon-KDS doğruluğu **kanıt yok**. | ClinicalTrials.gov |
| Uyuz: dermatoskopsuz "sillon (tünel)" görme | Telefon makro kamerası (çoğu Android'de 2–5 MP, 2–4 cm odak) sillonu bazen gösterir ama dermatoskopi (10×) düzeyinde değil; prospektif dermatoskopsuz telefon-fotoğraf doğruluğu **kanıt yok**. ScabAI (Türkiye, 500 görüntü) iç doğrulama. | KTÜN kaydı 2025; Yotsu 2023 PLoS NTD |
| Bit/sirke (pedikülozis) telefonla | Hakemli doğruluk çalışması **bulunamadı** (yalnız öğrenci proje önerisi). Islak tarama duyarlılık %90,5 vs gözle bakma %28,6 — referans yöntem ucuz ve ASM'de var. | Jahnke 2009 Arch Dermatol |
| SpO2 / tansiyon kamera ile | Güvenilir değil (göğüs raporu, bölüm 0). Ateşli hastada SpO2 için ASM'deki parmak pulse oksimetre kullanılır; uygulamaya elle girilir. | Tomlinson 2018; Hoffman 2022 |
| İdrar şeridi okuma | Healthy.io Dip UTI (CE; renk kartı, kutu yok), Dip.io (FDA 510(k)), Scanwell, uChek **zaten var**; şerit zaten sarf malzemesi. Brief kuralı: "Healthy.io — zaten var". Yeni ürün önerilmez. | Healthy.io; 360Dx |

## 1. Aile hekiminin bu alanda en sık karşılaştığı tanı/sevk kararları (envanter)

| Durum | ASM'de sıklık (kaba, kaynaklı) | Bugün nasıl karar veriyor | Yaygın hata/eksik | Telefon sensörü ne katabilir | Mevcut ürün/araştırma |
|---|---|---|---|---|---|
| **Boğaz ağrısı: strep mi, viral mi → antibiyotik/HAT?** | Türkiye'de aile hekimi reçetelerinin (~112 milyon/yıl) ~13,3 milyonu yalnız akut tonsillofarenjit; bu reçetelerin **%79,6'sında antibiyotik** (Çocuk Enf Derg 2017). ASM'de boğaz ağrısı en sık başvuru nedenlerinden (Uludağ ASM çalışması). | Gözle bakış + Centor/McIsaac (nadiren hesaplanır); HAT bazı ASM'lerde var (Kayseri: HAT negatif hastaya da antibiyotik yazılıyor) | Aşırı antibiyotik; Türkiye OECD'de birinci basamakta kişi başı en çok antibiyotik | Boğaz fotoğrafı AI (eksüda, tonsil ödemi, peteşi) + skor → "HAT yap / antibiyotik verme" | Yoo 2020; Askarian 2019; Avustralya 2025 — ürün yok |
| **Ateşli çocuk/erişkin: sepsis/ağır enfeksiyon kırmızı bayrak → acile mi?** | Ateş çocuk başvurularının en sık nedenlerinden; ASM'ye özgü Türkiye oranı **[doğrulanmadı]** | Ateş, nabız, genel görünüm; solunum sayısı **çoğu kez sayılmıyor**; NICE trafik ışığı/qSOFA nadiren | Solunum sayısı en az ölçülen vital bulgu; geç sevk; ya da her ateşe acil | **Kamera solunum sayısı**, PPG nabız, kapiller dolum videosu, IMCI/NEWS2/Loots skoru | Google 2022 (ön kamera, MAE 0,78/dk); Lucy 2021 (çocuk, MAE 1,8/dk); Loots 2022 BJGP (C 0,80) — ürün yok |
| **Döküntülü ateşli hastalık ayrımı (kızamık/kızamıkçık/suçiçeği/el-ayak-ağız/kızıl/roseola/mpox)** | Türkiye kızamık: 2022'de 127 → 2023'te **4.559** (TTB-AHEK; DSÖ farklı rakam verir), Ekim 2026 itibarıyla ~3.000 (Euronews/DSÖ) — salgın sürüyor | Klinik görünüm + aşı/temas öyküsü; serolojiyi İl Sağlık yapar | Kızamığın "viral döküntü" diye atlanması → bildirim/izolasyon gecikmesi; gereksiz izolasyon | Döküntü fotoğrafı AI + Koplik/enantem fotoğrafı + anket → bildirim/izolasyon kararı | Glock 2021 (kızamık); ITMA'INN 2025 (6 sınıf, %92); MPXV-CNN 2023; DermAssist (genel, CE I) — enfeksiyöz döküntü odaklı ürün yok |
| **Bacakta kızarıklık: selülit mi, DVT mi, staz dermatiti mi?** | Selülit tanılı hastaların **%30,5'i yanlış tanı** (Raff 2017, ABD yatan hasta) | Gözle, ısı, tek/çift taraflı; Wells skoru nadiren | Gereksiz antibiyotik/yatış; DVT'nin atlanması | Fotoğraf sınır işaretleme + 24–48 saat ölçülebilir karşılaştırma; ALT-70 + Wells anketi | ALT-70 (duy %98,8/özg %22); fotoğraf AI çalışması **yok** |
| **Yara enfeksiyonu (cerrahi/travmatik/diyabetik ayak)** | ASM'de pansuman/kontrol sık; sayı **[doğrulanmadı]** | Gözle (kızarıklık, akıntı, koku) | Erken enfeksiyonun atlanması ya da her kızarıklığa antibiyotik | Fotoğraf AI + alan ölçümü | RedScar (duy %100/özg %83, n=41; hasta uygulaması); Deepwound AUC 0,87; Swift/Tissue Analytics (yara ölçüm) — kısmen var |
| **İdrar yolu enfeksiyonu** | Kadınlarda yaşam boyu ~%50 (genel bilgi) | Semptom + şerit (ASM'de çoğunlukla var) | Asemptomatik bakteriüri tedavisi | Şerit fotoğraf okuma | **Zaten var** (Healthy.io, Scanwell, uChek) |
| **Kene teması/ısırığı sonrası ateş ve döküntü (KKKA, Lyme)** | KKKA: 2002–2024 toplam 15.148 olgu/721 ölüm; **2023: 590 olgu, 41 ölüm** (TBMM soru önergesi, SB verisi). Lyme Türkiye seroprevalansı **[bulunamadı]** | Öykü + endemik bölge; tam kan dışarıda | KKKA'da erken sevk hayati; eritema migrans'ın tinea/selülit sanılması | Eritema migrans fotoğraf AI; peteşi/ekimoz fotoğrafı; KKKA risk anketi | Burlina 2019 (AUC 0,95); Hossain 2022 — ürün yok |
| **Uyuz (skabiyez)** | Türkiye'de dermatoloji polikliniklerinde payı pandemi öncesi %0,5–0,9 → 2020–22'de **%3,1–4,4**; başka merkezde %1,66 → **%5,99** (2026) | Kaşıntı öyküsü + tipik yerleşim; dermatoskop ASM'de yok | Egzama/alerji diye aylarca tedavi; aile tedavisi atlanıyor → yeniden bulaş | Makro kamera lezyon fotoğrafı + IACS ölçütleri anketi | ScabAI (TR, iç doğrulama %96,7); Yotsu 2023 (>%70) — ürün yok |
| **Saçta bit/sirke** | Okul çocuklarında yaygın; Türkiye oranı **[doğrulanmadı]** | Gözle/tarakla | Sirke-kepek karışması | Makro kamera/video (kanıt yok) | **Kanıt yok** |
| **Alerjik rinit vs sinüzit** | ÜSYE grubunda sık | Semptom süresi/renk, yüz hassasiyeti | Gereksiz antibiyotik | Sensör katkısı yok (burun endoskopisi lens ister) | — |
| **Ürtiker/anjiyoödem; anafilaksi** | Ürtiker yaşam boyu %20 (genel bilgi) | Klinik; adrenalin kararı | Anafilakside gecikme | Fotoğraf ürtiker için gereksiz; anafilakside vital modül | CRUSE/UAS7 hasta uygulamaları var; WAOW veri tabanı planlı |
| **Aşı sonrası lokal reaksiyon vs apse/selülit** | Nadir | Gözle | Gereksiz antibiyotik | Fotoğraf ölçüm — kanıt yok | — |
| **Seyahat ateşi (sıtma, dengue, tifo)** | Türkiye'de ithal olgu az | Karar desteği var (CDC Yellow Book, Travax) | — | Sensör katkısı az (turnike-peteşi sayımı: kanıt yok) | **Zaten var** |
| **Hepatit/HIV risk karar desteği** | — | Kılavuz | — | Sensör yok | **Zaten var** (brief) |

## 2. Proje fikirleri (telefon tek başına, hekim kullanır)

### Fikir 1: "AteşTriyaj" — ateşli hastada sepsis/ağır enfeksiyon kırmızı bayrağı: kamera solunum sayısı + PPG nabız + kapiller dolum videosu + NEWS2/IMCI skoru
- **Klinik soru:** "Bu ateşli hasta (çocuk ya da erişkin) bugün acile/hastaneye mi gitmeli, yoksa ben antibiyotik/semptomatik tedavi ile izleyebilir miyim?"
- **Hasta akışı:** Ateş, ÜSYE ile birlikte ASM'nin en büyük başvuru grubudur; günde 60–100 hastalık bir ASM'de kış aylarında 10–20 ateşli hasta gerçekçidir (Türkiye'ye özgü oran **[doğrulanmadı]**). Hollanda nöbet-GP kohortunda (Loots 2022) ev ziyareti yapılan akut hastaların %42'si 72 saat içinde sepsis tanısı aldı — ASM'de oran çok daha düşük ama karar aynıdır.
- **Telefonda nasıl çalışır:** (1) Hekim ateşi (ASM termometresi), tansiyonu, SpO2'yi ve bilinç/genel görünüm kutularını elle girer (karar desteği). (2) **Arka kamera 30 sn göğüs-karın videosu** → solunum sayısı (optik akış; çocukta göğüs çekilmesi fazı). (3) **Parmak + flaş PPG 30 sn** → nabız (ritim düzensizliği uyarısı). (4) **Kapiller dolum videosu:** hekim sternum/parmak ucuna 5 sn bastırır, telefon 10 sn video çeker; algoritma renk geri dönüş süresini ölçer (deneysel modül, sonuç "ölçülemedi" diyebilir). Çıktı: çocukta IMCI/NICE trafik ışığı (hızlı solunum, çekilme, letarji), erişkinde NEWS2 ve Loots 6-değişkenli skor (yaş >65, ateş >38, SKB ≤110, nabız >110, SpO2 ≤95, bilinç) → "Yeşil: izle / Sarı: 24 saat kontrol / Kırmızı: bugün sevk" + ölçülen sayıların dosyaya yazılması. Toplam ≤2 dk.
- **Kanıt:** Solunum sayısı: Bae 2022 (Commun Med, Google; n=50, ön kamera, yüz/göğüs videosu) **MAE 0,78 ± 0,61 /dk**, kronik akciğer hastalarında da aynı; Lucy 2021 (Physiol Meas, Dakka, çocuk) MAE 1,8/dk, göğüs çekilmesi fazı pnömonide anlamlı farklı; Frontiers Med Technol 2025 (ticari kameralar) r≈0,91, RMSE 1,71. **Taşipne eşiği için duyarlılık/özgüllük çalışması yok.** Nabız: parmak-PPG nabız doğruluğu yerleşik (FibriCheck CE; genel bilgi). KDS: **kanıt yok** (CRTApp doğrulaması sürüyor). Skorlar: Loots 2022 BJGP C-istatistik **0,80** (0,75–0,84), iki acil servis popülasyonunda dış doğrulama sağlam; NEWS acil serviste qSOFA'dan daha duyarlı, qSOFA daha özgül (meta-analiz 2022, 26 çalışma, mortalite); NICE trafik ışığı acil serviste (n≈16.000) ciddi bakteriyel enfeksiyon için duyarlılık %85,8 / özgüllük %28,5; UK birinci basamakta (BJGP 2023, n=6.703) "ciddi hastalığı doğru saptayamıyor/dışlayamıyor". Referans standart: uzman panel sepsis tanısı (Loots), hastane tanısı (NICE). Birleşik "kamera + PPG + skor" paketinin birinci basamak doğruluğu **kanıt yok, bileşen kanıtı var.**
- **Mevcut uygulamalar/araştırmalar:** MDCalc/NEWS2 hesaplayıcıları (sensör yok); Google Fit solunum sayısı (tüketici, Pixel); RRate (dokunarak sayma); göğüs raporundaki "NefesSay" (çocuk pnömoni) ile sensör modülü ortaktır — **fark:** bu fikir tüm ateşli hastalara (erişkin dâhil) sepsis/sevk eşiği uygular; bileşenleri birleştiren hekim ürünü yok.
- **Teknik zorluklar + çözüm:** Hareketli çocuk → 10 sn'lik en stabil pencere seçimi, kalite skoru; ortam ışığı/ten rengi → PPG için flaş zorunlu, KDS için ten rengine göre normalize edilen ΔE ölçümü; cihaz çeşitliliği → 30 fps yeterli; Türkçe veri gerekmez (görüntü/PPG); Türkiye'de 300–500 ateşli hastada solunum sayısı için gözlemci referanslı kalibrasyon.
- **Regülasyon:** MDR Kural 11 — ciddi kötüleşme riskini ilgilendiren karar → **IIb** olası; "vital bulgu sayım yardımcısı + kılavuz skoru, karar hekimin" konumlandırması ile IIa savunulabilir. KVKK: video cihazda işlenir, saklanmaz; yalnız sayısal çıktı dosyaya yazılır.
- **Riskler:** Yanlış negatif (düşük sayım → septik hastanın eve gönderilmesi): eşiğe ±3/dk yakınsa "60 sn elle say" uyarısı; bilinç/bilinç bulanıklığı ve hipotansiyon algoritmayı her zaman ezer. Yanlış pozitif → gereksiz acil sevki (maliyet düşük). KDS modülü güvenilir olana kadar "ek bilgi" etiketiyle gösterilir, skora girmez.
- **Puan:** Teknik 7 | Kanıt 6 | Etki 9 | Yenilik 7 | Düşük risk 6 | İş akışı 8 | **TOPLAM 43/60**

### Fikir 2: "BoğazGöz" — boğaz fotoğrafı AI + Centor/McIsaac → "HAT yap / antibiyotik verme / peritonsiller apse sevk" kararı
- **Klinik soru:** "Bu boğaz ağrılı hastada A grubu streptokok olasılığı antibiyotik ya da HAT'ı haklı çıkaracak kadar yüksek mi; peritonsiller apse/epiglotit gibi sevk gerektiren bir durum var mı?"
- **Hasta akışı:** Türkiye'de aile hekimleri yılda ~13,3 milyon akut tonsillofarenjit reçetesi yazıyor; %79,6'sı antibiyotik (2017 verisi; 2020'de antibiyotik reçeteleme 2011'e göre %31 azaldı — TİTCK). Bursa ASM örnekleminde (Centor ≥1, n=158) kültür pozitifliği **%20,9**, HAT %13,3 — yani 5 hastadan 4'ü antibiyotiksiz iyileşir.
- **Telefonda nasıl çalışır:** Hekim abeslang ile dili bastırırken arka kamera + flaş ile 1–2 boğaz fotoğrafı çeker (uygulama uvula/tonsil çerçevesi gösterir, bulanıksa "yeniden çek"). Model: (a) tonsil ödemi/asimetri, eksüda, damak peteşisi, uvula deviasyonu segmentasyonu; (b) hekimin tıkladığı 4–5 soru (ateş ≥38, öksürük yok, ağrılı ön servikal LAP, yaş; isteğe bağlı FeverPAIN). Çıktı: "Strep olasılığı düşük/orta/yüksek → antibiyotik verme / HAT yap / HAT yoksa ampirik tedavi düşün" + **kırmızı bayrak:** uvula deviasyonu/tek taraflı tonsil şişliği (peritonsiller apse), trismus, stridor → sevk. ≤60 sn.
- **Kanıt:** Yoo 2020 (131 farenjit + 208 normal, **hasta çekimi** telefon fotoğrafı, CycleGAN artırma): ResNet50 ROC-AUC **0,988**, 4-kat çapraz doğrulamada doğruluk %95,3 — ama sınıf "şiddetli farenjit vs normal", referans standart klinisyen etiketi, kültür değil. Askarian 2019 (Sensors): doğruluk %93,75, duyarlılık %87,5, özgüllük %88 — **ek yansıma önleyici aparat** kullanıldı (kapsam dışı), küçük örneklem. Avustralya 2025 (Swin Transformer + BLIP-2, ön-kavram): doğruluk %97,1, AUC 0,993; referans standart özette belirtilmemiş [doğrulanmadı]. Healthcare Inform Res 2024 (343 görüntü, EfficientNet-B0) eksüdatif farenjit doğruluk %95,5. Centor/McIsaac birinci basamak meta-analizi (Willis 2020 BJGP): SROC AUC **0,69–0,71**, "yalnız orta ayrım; skor 0 dışlamaya yeter". **Sonuç:** fotoğraf AI'nin kültür/HAT referansıyla birinci basamakta doğruluğu **kanıt yok**; "eksüda/şiddet tespiti" için araştırma kanıtı güçlü ama bu strep'e eşit değil. Ürün bu nedenle "HAT'ı kim alsın" önceliklendirmesi olarak konumlanmalı.
- **Mevcut uygulamalar/araştırmalar:** Yukarıdaki araştırma grupları; ürün yok. Centor/McIsaac hesaplayıcıları var (sensör yok). HAT'ın kendisi ASM'de kısmen var (ek donanım değil, sarf; uygulama HAT'ı yorumlamaz). **Fark:** fotoğraf + skor + apse kırmızı bayrağı birleşik hekim aracı yok.
- **Teknik zorluklar + çözüm:** Flaş yansıması ve öğürme → 1 sn'lik çoklu çekim, en keskin kareyi seçme; ışık/renk → uvula/damak rengine göre normalizasyon; cihaz çeşitliliği → ImageNet önceden eğitilmiş + Türkiye ASM'lerinde **kültür/HAT eşli 1.000–2.000 fotoğraf** (bu veri seti dünyada yok; projenin asıl değeri bu); çocukta çekim güçlüğü → 2 denemede olmazsa yalnız skor.
- **Regülasyon:** MDR Kural 11 → **IIa** (tedavi kararına bilgi). Antibiyotik kararını değil "test önceliklendirmesini" hedeflediği belirtilir. KVKK: yüz görünmeyen boğaz fotoğrafı; cihazda işleme.
- **Riskler:** Yanlış negatif → strep'in tedavi edilmemesi (ARA riski Türkiye'de düşük ama sıfır değil); bu yüzden "düşük" çıktısında bile Centor ≥3 ise HAT önerilir. Yanlış pozitif → bugünkü %80 antibiyotik oranını artıramaz; aksine azaltma hedeflenir. Peritonsiller apse yanlış negatifi → hekimin muayenesi her zaman esas.
- **Puan:** Teknik 6 | Kanıt 4 | Etki 9 | Yenilik 6 | Düşük risk 6 | İş akışı 8 | **TOPLAM 39/60**

### Fikir 3: "UyuzBak" — makro kamera lezyon fotoğrafı + IACS klinik ölçüt anketi → uyuz olasılığı ve aile tedavisi kararı
- **Klinik soru:** "Bu kaşıntılı hasta uyuz mu (ailesiyle birlikte permetrin/ivermektin), yoksa egzama/ürtiker/böcek ısırığı mı?"
- **Hasta akışı:** Türkiye'de uyuz pandemi sonrası belirgin arttı: dermatoloji başvurularındaki payı %0,5–0,9'dan 2020–22'de %3,1–4,4'e (tek merkez, 2025), başka merkezde %1,66 (2019) → %5,99 (2026 yayını); Elazığ hastane verisi %0,95 → %1,99; Adana il verisi 2021'de zirve. ASM'de kaşıntılı hasta günde birkaç; uyuz çoğu kez önce ASM'ye gelir ve "alerji" diye kortikosteroid alır.
- **Telefonda nasıl çalışır:** Hekim parmak araları, el bileği iç yüzü, aksilla, göbek çevresi, genital bölgeden **makro/2× yakın fotoğraf** çeker (uygulama "makro lens varsa kullan" diyerek cihaz desteğine göre modu seçer; 3–5 fotoğraf). Model: sillon (tünel) + papül/vezikül + tipik yerleşim haritası skoru; isteğe bağlı "mürekkep testi" (ASM'de tükenmez kalem — rutin araç) fotoğrafı. Hekim IACS 2020 klinik ölçütlerini tıklar (kaşıntı, gece artışı, temaslıda kaşıntı, tipik dağılım). Çıktı: "Uyuz: olası / klinik tanı (IACS B/C) / olası değil" + "tüm ev halkını aynı gün tedavi et" hatırlatması + dermatoloji sevk ölçütü (kabuklu uyuz, bebek, tedaviye yanıtsızlık). ≤90 sn.
- **Kanıt:** ScabAI (Konya Teknik Üniv. kaydı, 2025; n=500 görüntü, yarı uyuz): doğruluk %96,7, duyarlılık %96, özgüllük %97,3 — **iç doğrulama, görüntü kaynağı (telefon/dermatoskop) belirsiz, hakemli dergi doğrulanmadı.** Yotsu 2023 (PLoS NTD; Fildişi Sahili/Gana, 1.709 görüntü, 506 hasta, 5 deri-NTD; ResNet-50): doğru tahmin **>%70**, koyu ten. Mendeley açık uyuz el fotoğrafı veri setleri (telefon, doğal/iç ışık) mevcut. Dermatoskopi-sız prospektif telefon doğruluğu **kanıt yok**; referans standart (mikroskopi/dermatoskopi) çalışması yok. IACS ölçütleri uzman uzlaşısı, doğruluk çalışması sınırlı.
- **Mevcut uygulamalar/araştırmalar:** ScabAI (araştırma); DermAssist/Aysa (genel dermatoloji, uyuz tek sınıf; Türkiye'de yok); teledermatoloji servisleri. **Fark:** uyuz-odaklı, IACS'ye bağlı, aile tedavisi kararı veren ve makro kamerayı kullanan hekim aracı yok.
- **Teknik zorluklar + çözüm:** Büyütme yok → makro moda sahip cihazlarda çekim, diğerlerinde 2× dijital + odak kilidi; sillon ince → segmentasyon yerine bölge-sınıflama; ten rengi/ışık → flaş + beyaz dengesi kartı gerekmez (ASM'de A4 kâğıt referans); Türkiye'de **dermatoskopi/mikroskopi eşli 800–1.500 fotoğraf** toplanmalı (dermatoloji poliklinikleriyle iş birliği; uyuz artışı veri toplamayı kolaylaştırır).
- **Regülasyon:** MDR Kural 11 → **IIa**. Konumlandırma: "klinik ölçüt yardımcısı". KVKK: genital bölge fotoğrafı özel nitelikli; cihazda işleme, saklama yok.
- **Riskler:** Yanlış negatif → bulaş sürer, aile tedavisi gecikir (bugünkü durumla aynı); yüksek klinik şüphede fotoğraf sonucu ne olursa olsun "ampirik tedavi düşün" denir. Yanlış pozitif → gereksiz permetrin (ucuz, güvenli) — düşük zarar.
- **Puan:** Teknik 6 | Kanıt 4 | Etki 7 | Yenilik 7 | Düşük risk 7 | İş akışı 8 | **TOPLAM 39/60**

### Fikir 4: "SınırTakip" — bacakta kızarıklık: selülit / DVT / staz dermatiti ayrımı için fotoğraf sınır işaretleme + ölçülebilir 24–48 saat karşılaştırma + ALT-70 ve Wells anketi
- **Klinik soru:** "Bu kızarık, şiş bacak selülit mi (antibiyotik), DVT mi (bugün Doppler/acil), yoksa staz dermatiti/kontakt dermatit mi (antibiyotik yok)?"
- **Hasta akışı:** Alt ekstremite selülit tanılı hastaların **%30,5'i** yanlış tanı (Raff 2017, n=259, yatan hasta); birinci basamakta oran **[doğrulanmadı]**. ASM'de haftada birkaç olgu; yaşlı, diyabetik, venöz yetmezlikli hastalarda tekrarlayıcı.
- **Telefonda nasıl çalışır:** Hekim kızarıklığın sınırını kalemle çizer (rutin uygulama), telefonla **referans nesneli (kredi kartı/ASM etiketi) fotoğraf** çeker; uygulama kızarıklık alanını (cm²) ve renk yoğunluğunu ölçer, sağ-sol bacak çevresini mezura ile elle girer. Anket: ALT-70 (asimetri, lökositoz — ASM'de yoksa boş, taşikardi [PPG ile], yaş ≥70) + Wells DVT. Çıktı: "Selülit olası / pseudoselülit olası / DVT olasılığı yüksek → Doppler" + **24–48 saat sonra aynı açıdan ikinci fotoğraf**: alan %X küçüldü/büyüdü → "antibiyotiğe yanıt var / sevk". ≤90 sn + kontrol.
- **Kanıt:** ALT-70: 0–2 puan ≥%83 pseudoselülit, ≥5 puan ≥%82 selülit (derivasyon); prospektif doğrulamada (Ko 2024, JAMA Dermatol, n=204) duyarlılık **%98,8, özgüllük %22**; termal + ALT-70 özgüllük %53,9 (termal kamera kapsam dışı). Fotoğraftan selülit/pseudoselülit ayrımı için deep learning çalışması **bulunamadı**; Burlina 2019'da selülit yalnız karıştırıcı sınıf. Alan ölçümü için yara-ölçüm uygulamalarının (Swift, imitoMeasure) referans nesneli doğruluğu yerleşik (genel bilgi, selülite özgü çalışma yok). DVT için sensör kanıtı **yok**; Wells anketi karar desteği.
- **Mevcut uygulamalar/araştırmalar:** imitoMeasure/Swift (yara alanı ölçümü, hekim); ALT-70 hesaplayıcı; **fark:** selülit sınır takibi + yanıt değerlendirmesi + DVT anketi birleşik ürün yok.
- **Teknik zorluklar + çözüm:** Açı/mesafe farkı → referans nesne + "ilk fotoğrafın hayalet katmanı"nı ekrana bindirme; koyu tende eritem → hemoglobin kanalı (RGB→a* ya da hb-melanin ayrıştırma); ışık → flaş zorunlu.
- **Regülasyon:** Ölçüm + anket; MDR Kural 11 → IIa. "Yanıt takibi aracı" olarak düşük risk savunulabilir.
- **Riskler:** Yanlış negatif DVT (ölümcül olabilir) → Wells ≥2 ya da tek taraflı şişlik >3 cm'de fotoğraf sonucu ne olursa olsun Doppler önerilir. Yanlış pozitif selülit → bugünkü %30 yanlış tanıyı artırmaz.
- **Puan:** Teknik 8 | Kanıt 3 | Etki 6 | Yenilik 7 | Düşük risk 7 | İş akışı 7 | **TOPLAM 38/60**

### Fikir 5: "KeneDöküntü" — kene ısırığı/temas sonrası: eritema migrans fotoğraf AI + KKKA risk anketi + peteşi/ekimoz fotoğrafı → doksisiklin / acil sevk kararı
- **Klinik soru:** "Kene teması olan bu hastada (a) eritema migrans var mı → doksisiklin; (b) KKKA erken belirtileri var mı → bugün hastane?"
- **Hasta akışı:** Türkiye KKKA: 2023'te 590 olgu/41 ölüm, 2024 ilk yarı 469/26 (SB verisi, TBMM belgesi); 2025 Ocak–Haziran 7.801 kene ısırığı başvurusu (Türk Veteriner Hekimler Birliği, TBMM önergesi). Lyme Türkiye'de nadir, seroprevalans verisi **bulunamadı**. ASM'ler endemik illerde (Tokat, Sivas, Çorum, Yozgat, Erzurum) kene ısırığının ilk adresi.
- **Telefonda nasıl çalışır:** Hekim ısırık/döküntü bölgesini fotoğraflar (referans nesneli). Model: eritema migrans vs tinea/zona/selülit/ısırık reaksiyonu; ikinci modül peteşi/ekimoz tespiti (gövde, ekstremite). Anket: ısırık tarihi, bölge, ateş, miyalji, kanama. Çıktı: "EM olası → doksisiklin, 2 hafta kontrol" / "KKKA uyumlu semptom (ısırıktan 1–9 gün sonra ateş+miyalji ± kanama) → bugün sevk + tam kan/trombosit" / "lokal reaksiyon → izle". ≤60 sn.
- **Kanıt:** Burlina 2019 (Comput Biol Med; 1.834 görüntü, çoğu internet + 63 çalışma katılımcısı, birinci basamak/acil): EM tespiti doğruluk **%86,5**, ROC-AUC **0,951**, kappa 0,71; tıp dışı insan panelinden daha iyi. Hossain 2022 (DAPPEM projesi, ResNet50): doğruluk %84,4, duyarlılık **%87,9**, özgüllük %80,7. Referans standart: klinisyen etiketi (seroloji değil). Peteşi fotoğraf AI: **kanıt yok** (turnike-peteşi sayımı için uygulama bulunamadı). KKKA için sensör kanıtı yok; anket karar desteği (SB KKKA algoritması).
- **Mevcut uygulamalar/araştırmalar:** DAPPEM (Fransa, EM uygulaması geliştirme aşaması); Johns Hopkins EM uygulaması (araştırma); Türkiye kene risk haritası projeleri. **Fark:** Türkiye'nin asıl sorunu olan KKKA'yı EM ile birleştiren hekim aracı yok.
- **Teknik zorluklar + çözüm:** EM'nin Türkiye'de nadirliği → model yabancı veriyle; ısırık reaksiyonu/selülit karıştırıcı sınıflar Türkiye'den toplanır; ten rengi.
- **Regülasyon:** IIa; KKKA modülü anket olduğundan düşük risk.
- **Riskler:** KKKA'da yanlış negatif ölümcül → anket pozitifse fotoğraf ne derse desin sevk. EM yanlış pozitifi → gereksiz doksisiklin (düşük zarar).
- **Puan:** Teknik 7 | Kanıt 6 | Etki 4 | Yenilik 7 | Düşük risk 6 | İş akışı 8 | **TOPLAM 38/60**

### Fikir 6: "DöküntüAyır-TR" — ateş + döküntü: kızamık/kızamıkçık/suçiçeği/el-ayak-ağız/kızıl/roseola/mpox fotoğraf AI + Koplik/enantem fotoğrafı + aşı-temas anketi → bildirim/izolasyon/sevk
- **Klinik soru:** "Bu ateşli döküntülü hasta bildirimi zorunlu bir hastalık (kızamık, kızamıkçık, mpox) mı; izolasyon ve numune gerekir mi; yoksa kendini sınırlayan viral ekzantem mi?"
- **Hasta akışı:** Türkiye kızamık salgını: 2023'te 4.559 olgu (bazı kaynaklarda 4.959), 2024'te yüksek seyir, Ekim 2026'da ~3.000 (kaynaklar çelişkili; **[doğrulanmadı]**); DSÖ Avrupa 2024'te 127.350 olgu (1997'den beri en yüksek). El-ayak-ağız ve suçiçeği çocuk ASM'lerinde her hafta. Mpox Türkiye'de nadir.
- **Telefonda nasıl çalışır:** Hekim 2–3 döküntü fotoğrafı (yüz/gövde/avuç-taban) + ağız içi fotoğrafı (Koplik, enantem, veziküller) çeker; anket: ateşin döküntüden kaç gün önce başladığı, aşı kartı, temas, konjonktivit/öksürük/koriza, LAP. Çıktı: olasılık sıralaması + "kızamık olası → bildirim, numune, izolasyon, temaslı aşı" / "suçiçeği → izlem" / "mpox olası → sevk" + kırmızı bayrak (peteşiyal döküntü + ateş → meningokok, bugün acil). ≤90 sn.
- **Kanıt:** Glock 2021 (arXiv, ResNet; >1.300 görüntü): kızamık vs diğer doğruluk %95,2, duyarlılık **%81,7**, özgüllük %97,1; ViT güncellemesi doğruluk %95,2 — internet görüntüleri, bağımsız tekrar yok (bir benchmark sayfası %73 veriyor). ITMA'INN 2025 (arXiv; mpox, el-ayak-ağız, suçiçeği, kızamık, inek çiçeği, sağlıklı; mobil MobileViT): doğruluk **%92**, F1 %92 — web görüntüleri. MPXV-CNN 2023 (Nat Med; 139.198 görüntü): duyarlılık 0,83–0,91, özgüllük 0,90–0,97, prospektif kohortta duyarlılık 0,89. HeHealth (mpox, genital, iç doğrulama) duyarlılık %90/özgüllük %87. Kızıl, roseola, kızamıkçık için çalışma **bulunamadı**. Hiçbiri PCR/seroloji referanslı prospektif telefon çalışması değil. Peteşi için kanıt yok.
- **Mevcut uygulamalar/araştırmalar:** Google DermAssist (288 durum, CE Sınıf I, Türkiye'de yok, hasta odaklı); Aysa/VisualDx (karar desteği, abonelik); **fark:** bildirim/izolasyon kararına bağlı, ateş zamanlaması anketi + enantem fotoğrafı ekleyen, Türkiye salgın bağlamında çalışan hekim aracı yok.
- **Teknik zorluklar + çözüm:** Web görüntüleriyle eğitilmiş modeller ASM'de düşer → Türkiye salgınından PCR eşli fotoğraf toplama (İl Sağlık ile); ten rengi/ışık; döküntü evresi (makülopapüler erken dönem belirsiz).
- **Regülasyon:** IIa; bildirim kararı hekimde.
- **Riskler:** Yanlış negatif kızamık → bulaş; anket (aşısız + ateş-koriza-konjonktivit + 3–4. gün döküntü) fotoğraftan bağımsız "bildir" der. Yanlış pozitif → gereksiz izolasyon/numune (düşük zarar, ama panik).
- **Puan:** Teknik 6 | Kanıt 4 | Etki 7 | Yenilik 6 | Düşük risk 5 | İş akışı 8 | **TOPLAM 36/60**

### Fikir 7: "YaraGöz" — cerrahi/travmatik/diyabetik yara enfeksiyonu: fotoğraf AI + alan ölçümü → antibiyotik/sevk
- **Klinik soru:** "Bu yara enfekte mi (antibiyotik, debridman için sevk) yoksa normal iyileşme mi?"
- **Hasta akışı:** ASM'de pansuman/yara kontrolü günlük rutin; diyabetik ayak Türkiye'de artan yük (sayı **[doğrulanmadı]**).
- **Telefonda nasıl çalışır:** Referans nesneli fotoğraf → kızarıklık halkası genişliği, akıntı/nekroz segmentasyonu, alan; seri takip. Çıktı: enfeksiyon olasılığı + IDSA/IWGDF şiddet sınıfı önerisi.
- **Kanıt:** RedScar (İspanya, abdominal cerrahi, pilot n=41): duyarlılık %100, özgüllük %83,1, kappa 0,82; çok merkezli 168 hastalık doğrulama protokolü 2025'te kayıtlı. Ruanda doğum sonrası yara (621 görüntü): görünür ışık AUC **0,86** (duy 0,83/özg 0,75); termal daha iyi (kapsam dışı). Deepwound (>1.000 telefon fotoğrafı): SSI AUC 0,87. Simülasyon çalışması: cerrahlar fotoğraf kullanınca özgüllük arttı, duyarlılık düştü. Diyabetik ayak enfeksiyonu için telefon AI kanıtı **zayıf**.
- **Mevcut uygulamalar/araştırmalar:** RedScar (hasta uygulaması, CE süreci), Swift Skin & Wound ve Tissue Analytics (klinik yara ölçüm/dokümantasyon, enfeksiyon kararı değil), imitoMeasure. **Fark sınırlı** — mevcut yara ölçüm ürünlerine enfeksiyon sınıflayıcı eklemek.
- **Teknik zorluklar + çözüm:** Pansuman kalıntıları, ışık; Türkiye'de ASM yara fotoğrafı veri seti yok.
- **Regülasyon:** IIa.
- **Riskler:** Yanlış negatif derin enfeksiyon (osteomiyelit) → sonda testi/klinik her zaman esas.
- **Puan:** Teknik 7 | Kanıt 5 | Etki 5 | Yenilik 4 | Düşük risk 6 | İş akışı 7 | **TOPLAM 34/60**

### Fikir 8: "BitBul" — saçlı deride bit/sirke: makro kamera + kısa video hareket tespiti
- **Klinik soru:** "Bu çocukta aktif bit enfestasyonu var mı (canlı bit) yoksa eski sirke/kepek mi?"
- **Hasta akışı:** Okul çocuklarında yaygın; ASM'ye okul yazısıyla gelir. Türkiye prevalansı **[doğrulanmadı]**.
- **Telefonda nasıl çalışır:** Ense/kulak arkası saç diplerine makro kamera 10 sn video; nesne tespiti (sirke: saça yapışık oval, kepek: serbest) + hareket büyütme ile canlı bit. Çıktı: "aktif / eski / bulunamadı — ıslak tarama yap".
- **Kanıt:** **Kanıt yok.** Yalnız öğrenci proje önerisi (Colorado School of Mines 2025). Referans yöntem ıslak tarama (duyarlılık %90,5) ucuz ve ASM'de yapılabilir.
- **Mevcut uygulamalar:** Yok.
- **Teknik zorluklar:** Koyu saçta kontrast, hareketli çocuk, makro odak.
- **Regülasyon:** I/IIa.
- **Riskler:** Yanlış negatif → okulda bulaş; yanlış pozitif → gereksiz permetrin.
- **Puan:** Teknik 5 | Kanıt 1 | Etki 4 | Yenilik 7 | Düşük risk 8 | İş akışı 6 | **TOPLAM 31/60**

## 3. Alanın en iyi 3 fikri ve gerekçe

1. **AteşTriyaj (43/60).** Ateşli hastada "bugün acile mi?" sorusu alanın en sık ve en değerli kararı; solunum sayısı kameradan ölçülebiliyor (MAE <2/dk, iki bağımsız çalışma), PPG nabız yerleşik, Loots/NEWS2/IMCI skorları doğrulanmış. Ürün yok. Sepsis kaçırmanın bedeli yüksek olduğu için "elle say" güvenlik kapısı ve skor-bağımsız kırmızı bayraklar şart. Göğüs raporundaki NefesSay ile ortak sensör modülü paylaşır; iki fikir tek platformda birleşebilir.
2. **BoğazGöz (39/60).** Etki en yüksek (yılda 13 milyon tonsillofarenjit reçetesi, %80 antibiyotik). Teknik olarak boğaz fotoğrafı sınıflama güçlü (AUC 0,99) ama **kültür referanslı kanıt yok**; projenin asıl değeri Türkiye'de HAT/kültür eşli fotoğraf veri seti oluşturmak. Doğru konumlandırma: "HAT önceliklendirme + peritonsiller apse bayrağı", strep tanısı değil.
3. **UyuzBak (39/60).** Türkiye'de uyuz 3–6 kat arttı, ASM'de "alerji" diye kaçırılıyor, aile tedavisi atlanıyor. Yanlış pozitifin zararı düşük (permetrin), yanlış negatif bugünkü durumdan kötü değil. Türkiye'de ScabAI ile başlamış yerli veri var; makro kameralı telefonlar yaygınlaşıyor. SınırTakip (38) ve KeneDöküntü (38) yakın takipte; KeneDöküntü endemik illerde pilot için güçlü aday ama Lyme'in nadirliği etkiyi düşürüyor.

## 4. Elenenler

- **İdrar şeridi fotoğraf okuma:** Zaten var (Healthy.io Dip UTI CE, Dip.io FDA, Scanwell, uChek); renk kartı var, kutu yok; fark yok.
- **COVID/grip/RSV öksürük sesi ayrımı:** Kanıt zayıf (dış doğrulamada AUC düşüyor; üçlü ayrım çalışması yok); antijen testleri ucuz; tedavi kararını değiştirmez.
- **TB öksürük sesi:** CODA TB AUROC 0,69–0,74 (WHO hedefinin altında); Türkiye düşük insidans (13/100.000); göğüs raporunda da elendi.
- **Hepatit/HIV risk karar desteği:** Zaten var; sensör yok.
- **Seyahat ateşi karar desteği:** Zaten var (CDC Yellow Book, Travax); turnike-peteşi sayımı için uygulama/kanıt yok, dengue Türkiye'de nadir.
- **Alerjik rinit vs sinüzit:** Sensör katkısı yok (burun endoskopisi lens ister); anket zaten var.
- **Ürtiker/anjiyoödem fotoğraf AI:** Ürtiker tanısı gözle kolay; deep learning çalışması yok (WAOW yalnız veri tabanı planı); UAS7/CRUSE hasta uygulamaları var. Ürtikeryal vaskülit (24 saat kalıcı lezyon) için zaman damgalı fotoğraf hekime küçük katkı — ayrı ürün değil, DöküntüAyır modülü olabilir.
- **Anafilaksi:** Acil algoritması/adrenalin dozu uygulamaları var; sensör zaman kaybettirir; AteşTriyaj'ın vital modülü yeterli.
- **Aşı sonrası lokal reaksiyon vs apse:** Nadir, kanıt yok, hekime değer katmıyor.
- **Astım-alerji:** Göğüs raporunda (SesSpiro/HırıltıDinle).
- **Termal kamera ile selülit/yara:** Ek donanım (FLIR/iPad eklentisi) → kapsam dışı.
- **Kapiller dolum tek başına ürün:** Kanıt yok (CRTApp sonuç bekliyor); AteşTriyaj içinde deneysel modül.
- **Boğaz fotoğrafı için yansıma önleyici aparat (Askarian 2019):** Ek donanım → kapsam dışı; aparatsız çalışma Yoo 2020 esas alındı.

## 5. Kaynaklar (URL; doğrulanmayanlar işaretli)

Boğaz / strep
- Yoo SH ve ark. 2020. Toward automated severe pharyngitis detection with smartphone camera using deep learning networks. Eur Arch Otorhinolaryngol (PMID 32871294). https://pubmed.ncbi.nlm.nih.gov/32871294/ (özet Europe PMC ile doğrulandı)
- Askarian B ve ark. 2019. Novel image processing method for detecting strep throat using smartphone. Sensors 19(15):3307. https://pmc.ncbi.nlm.nih.gov/articles/PMC6695774 (ek aparat kullanılmış)
- 2025. Towards AI-based strep throat detection and interpretation for remote Australian Indigenous communities (PMID 41012875). https://pubmed.ncbi.nlm.nih.gov/41012875/ (referans standart özette yok — [doğrulanmadı])
- Healthcare Informatics Research 2024, eksüdatif farenjit CNN (343 görüntü). https://doaj.org/article/9dc43a1df9d6404484df9bd9a5c7cc9d
- Willis BH ve ark. 2020. Comparison of Centor and McIsaac scores in primary care: meta-analysis. BJGP 70(693):e245. https://bjgp.org/content/70/693/e245
- Çocuk Enfeksiyon Dergisi 2017 — aile hekimi tonsillofarenjit reçeteleri (%79,58 antibiyotik). https://www.cocukenfeksiyondergisi.org/upload/documents/2017-01/2017-11-1-015-018.pdf
- Kayseri ASM hızlı antijen testi çalışması (TR Dizin). https://app.trdizin.gov.tr/makale/TkRVNU56QXhNUT09/
- Bursa ASM tonsillofarenjit tezi (Centor ≥1; kültür %20,88). https://acikerisim.uludag.edu.tr/items/0794f7a1-3fc2-4e50-8c50-76ba848f23e3
- NTV 2021 — antibiyotik reçeteleme %31 azaldı (TİTCK). https://www.ntv.com.tr/saglik/turkiyede-hekimlerin-antibiyotik-recetelemesi-yuzde-31-azaldi,6bm0drlGzkWWa7DdSIcbHQ

Ateş / sepsis / solunum sayısı
- Bae S ve ark. 2022. Prospective validation of smartphone-based heart rate and respiratory rate measurement algorithms. Commun Med. https://research.google/pubs/prospective-validation-of-smartphone-based-heart-rate-and-respiratory-rate-measurement-algorithms/
- Frontiers in Medical Technology 2025 — ticari kameralarla HR/RR. https://www.frontiersin.org/journals/medical-technology/articles/10.3389/fmedt.2025.1728913/full
- Lucy ve ark. 2021 Physiol Meas (çocuk solunum sayısı, göğüs çekilmesi) — göğüs raporu (08) üzerinden; bu turda yeniden doğrulanmadı.
- Loots FJ ve ark. 2022. New clinical prediction model for early recognition of sepsis in adult primary care patients. BJGP. https://bjgp.org/content/bjgp/early/2022/04/19/BJGP.2021.0520.full.pdf
- qSOFA/SIRS/NEWS meta-analizi 2022. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9012380/
- NEWS2 vs qSOFA acil servis. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6723972/
- De S ve ark. 2013 BMJ — NICE trafik ışığı acil servis doğrulaması. https://www.bmj.com/content/346/bmj.f866.full
- BJGP 2023 — NICE trafik ışığı UK birinci basamak (n=6.703). https://bjgp.org/content/72/719/e398
- CRTApp doğrulama protokolü NCT07473869 (sonuç yok). https://clinicaltrials.gov/study/NCT07473869
- Acil serviste elektronik KDS ve sepsis (DCR cihazı). https://ajemjournal.com/article/S0735-67572300252-8/fulltext

Döküntü / kızamık / mpox / Lyme
- Glock K ve ark. 2021. Measles rash identification using residual deep CNN / ViT. arXiv 2005.09112. https://arxiv.org/abs/2005.09112v3 (hakemsiz)
- ITMA'INN 2025 — mpox + benzer döküntüler mobil uygulama. arXiv 2505.19023. https://arxiv.org/pdf/2505.19023 (hakemsiz)
- Thieme AH ve ark. 2023. MPXV-CNN. Nat Med. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10033450/
- HeHealth mpox (Sex Health 2023). https://www.publish.csiro.au/SH/SH23197
- JMIR 2024 mpox vs sık lezyonlar. https://www.jmir.org/2024/1/e52490
- Burlina PM ve ark. 2019. Automated detection of erythema migrans ... via deep learning. Comput Biol Med (PMID 30654165). https://pubmed.ncbi.nlm.nih.gov/30654165/ (özet Europe PMC ile doğrulandı: doğruluk %86,53, AUC 0,951, kappa 0,71)
- Hossain ve ark. 2022 / DAPPEM (duy %87,9, özg %80,7). https://hal.inrae.fr/hal-03764950/document
- Burlina 2020 — tick-borne skin lesions. https://arxiv.org/pdf/2011.11459
- Cumhuriyet 2024 — kızamık 2022: 127 → 2023: 4.559 (TTB-AHEK). https://www.cumhuriyet.com.tr/saglik/kizamik-vakalari-40-kat-artti-ttb-ahek-baskani-kirimli-tekrar-salgin-2168464
- Euronews 2026-10-20 — Türkiye kızamık ~3.000. https://tr.euronews.com/2026/10/20/kizamik-salgini-turkiyede-vakalar-3-bine-ulasti-bangladeste-1200den-fazla-cocuk-oldu ([kaynaklar çelişkili — doğrulanmadı])
- UNICEF/DSÖ Avrupa 2024: 127.350 kızamık. https://www.unicef.org/turkiye/bas%C4%B1n-b%C3%BCltenleri/avrupa-b%C3%B6lgesinde-son-25-y%C4%B1l%C4%B1n-en-y%C3%BCksek-k%C4%B1zam%C4%B1k-vakas%C4%B1-kaydedildi-unicef
- Google DermAssist CE Sınıf I. https://blog.google/technology/health/derm-assist-preview-io-2021

KKKA / kene
- TBMM soru önergesi (SB verisi: 2002–2024 15.148 olgu/721 ölüm; 2023: 590/41). https://cdn.tbmm.gov.tr/KKBSPublicFile/D28/Y3/T7/WebOnergeMetni/a6059fe9-5a53-4ba9-9309-37f5e85b30cd.pdf
- Ergönül Ö, Klimik 2025 KKKA sunumu. https://www.klimik.org.tr/wp-content/uploads/2025/07/Onder-Ergonul-Kirim-Kongo-Kanamali-Atesi.pdf
- Turnike testi meta-analizi (dengue; duy %58/özg %71). https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4972435/

Selülit / yara
- Raff AB ve ark. 2017 — ALT-70 derivasyonu (%30,5 yanlış tanı). https://dash.harvard.edu/entities/publication/73120379-47e6-6bd4-e053-0100007fdf3b
- Ko LN ve ark. 2024 JAMA Dermatol — termal + ALT-70 prospektif (duy %98,8/özg %22). https://practicaldermatology.com/news/study-validates-thermal-imaging-alt-70-model-distinguishing-cellulitis-pseudocellulitis/2462541/
- RedScar pilot (duy %100/özg %83,13). https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11727995/ ; çok merkezli protokol PMID 40217661
- Ruanda yara enfeksiyonu görünür/termal (AUC 0,86/0,89). https://dash.harvard.edu/entities/publication/a7cc6d67-0d0a-47d5-8eff-4c80fd412b48
- Deepwound (AUC 0,87). https://sisna.org/?p=1545

Uyuz / bit
- ScabAI — KTÜN kaydı 2025 (500 görüntü; %96,7). https://gcris.ktun.edu.tr/entities/person/a3e327bd-4c3a-4e4a-9847-ff2f24af41f1 ([hakemli yayın doğrulanmadı])
- Yotsu RR ve ark. 2023. Deep learning for AI-based diagnosis of skin-related NTDs: pilot. PLoS NTD. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10449179/
- Mendeley uyuz telefon fotoğrafı veri seti. https://data.mendeley.com/datasets/mg6sb9b8x4
- Türkiye Parazitoloji Dergisi 2023 — pandemi döneminde uyuz salgını (Adana). https://turkiyeparazitolderg.org/articles/covid-19-pandemisi-sirasinda-skabiyez-salgini/doi/tpd.galenos.2023.44154
- Türkiye Parazitoloji Dergisi 2026 — tersiyer merkez %1,66 → %5,99. https://turkiyeparazitolderg.org/pdf/c1dc3a38-51db-436b-af33-1bc7522029b3/articles/tpd.galenos.2026.98704/78-85.pdf
- JIDC 2025 — dermatoloji kliniği %0,5–0,9 → %3,1–4,4. https://jidc.org/index.php/journal/article/download/39863952/3555/217877
- Jahnke C ve ark. 2009 — ıslak tarama vs gözle bakma. https://www.qxmd.com/r/19289764
- Bit uygulaması öğrenci önerisi (kanıt değil). https://cs-courses.mines.edu/csci370/FS2025F/Proposals/WirelessFitnessTechnologies.pdf

Öksürük / TB / COVID
- Jaganath D ve ark. 2025 — CODA TB DREAM Challenge. https://pmc.ncbi.nlm.nih.gov/articles/PMC10776005 ; https://medrxiv.org/content/10.1101/2024.03.27.24304980.full.pdf
- Zambiya ses temel modeli TB (ön baskı). https://arxiv.org/abs/2509.09746v1
- Santosh KC ve ark. 2022 — COVID öksürük sistematik derleme. https://peerj.com/articles/cs-958
- JMIR 2024 — COVID öksürük modelinin dış doğrulama/variant düşüşü. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10879967/

Ürtiker / idrar / diğer
- Smartphone photographs of chronic urticaria taken by patients (Dermatology 2024). https://karger.com/drm/article/240/3/357/869534
- WAOW projesi (veri tabanı planı). https://global-allergy.network/?p=2117
- Healthy.io Dip UTI (CE) / Dip.io (FDA). https://nocamels.com/2020/02/healthy-io-dip-uti/ ; https://www.360dx.com/node/35586
- Uludağ ASM başvuru nedenleri çalışması. https://acikerisim.uludag.edu.tr/items/cd8662f6-c082-4aaf-a1f0-0ab6e137b9ba
- Diyarbakır aile hekimliği ÜSYE antibiyotik müdahale çalışması. https://acikbilim.yok.gov.tr/handle/20.500.12812/111664
