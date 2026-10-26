# Onkoloji — Aile hekimi için telefonla tanı/triyaj fikirleri

> Not: Bu oturumda web arama kotası ilk 6 aramadan sonra doldu; kalan doğrulamalar Europe PMC API, PMC tam metin ve GLOBOCAN PDF üzerinden yapıldı. Doğrulanamayan rakamlar "(doğrulanmadı)" ile işaretlidir.

## 0. Çerçeve: aile hekimi ve kanser

Türkiye'de 2024'te 235.949 yeni kanser olgusu ve 113.805 kanser ölümü tahmin edilmiştir (GLOBOCAN 2024, Türkiye bilgi formu). En sık görülenler akciğer (37.846), meme (25.080), kolorektal (21.172), prostat (18.749), tiroid (18.291), mesane (13.771), mide (12.914); bu rapordaki fikirlerle doğrudan ilgili bölgeler: pankreas 6.110, larinks 3.832, serviks 2.577, dudak/ağız boşluğu 2.166, melanom 1.716, Hodgkin lenfoma 1.694, lösemi 6.546. Kaba hesapla ülke genelinde ~27.000 aile hekimliği birimine (doğrulanmadı) yılda ortalama ~9 yeni kanser düşer; İngiltere verisi de tam zamanlı bir pratisyenin yılda ~8 yeni kanserle karşılaştığını söyler (NICE NG12 arka plan; doğrulanmadı). Yani aile hekimi için kanser **nadir ama yüksek bedelli** bir karardır: çoğu başvuru benign'dir, atlanan tek olgu geç evre demektir, gereksiz sevk ise zaten tıkalı onkoloji/KBB/gastro polikliniklerini daha da doldurur.

Telefonun bu alanda gerçekten katkı sağlayabildiği yerler **yüzeyde görülebilen** (ağız mukozası, sklera, boyun kitlesi, cilt) ya da **duyulabilen** (ses) bulgulardır. Meme, tiroid, serviks, mesane, kemik gibi derin ya da görüntüleme gerektiren organlarda telefon tek başına **hiçbir şey ölçemez**; aşağıda bunlar dürüstçe elenmiştir.

## 1. Aile hekiminin bu alanda en sık karşılaştığı tanı/sevk kararları (envanter)

| Durum | ASM'de sıklık (kaynaklı, kaba) | Bugün nasıl karar veriyor | Hangi hata/eksik yaygın | Telefon sensörü bu karara ne katabilir | Mevcut ürün/araştırma |
|---|---|---|---|---|---|
| Şüpheli cilt lezyonu (melanom/BCC/SCC) | Melanom 1.716/yıl TR (GLOBOCAN 2024); ASM'de cilt lezyonu şikâyeti çok sık | ABCDE, çıplak göz; "emin değilsem dermatolojiye" | Gereksiz sevk yüksek; nodüler melanom atlanır | Fotoğraf + AI sınıflandırma (dermatoloji ajanı yazıyor); onkoloji perspektifinden yalnız **sevk aciliyeti** (hızlı büyüyen, kanayan, ülsere → 2 hafta) | SkinVision (CE, hasta için, zaten var); dermatoskopsuz AI çalışmaları |
| Ağız içi beyaz/kırmızı lezyon, iyileşmeyen ülser | Dudak/ağız boşluğu 2.166/yıl TR; Türkiye'de rutin diş muayenesinde beyaz lezyon %2,2, prekanseröz lezyon ~%4 (iki Türk çalışması; arama özeti) | Gözle bakış; ">3 hafta iyileşmeyen → KBB/diş hekimi" | Sigara + Maraş otu kullananlarda displazi çok yüksek (84 Maraş otu kullanıcısının 67'sinde displazi; Bakaris 2007) ama ASM'de ağız içi rutin bakılmıyor | Arka kamera + flaş ile mukoza fotoğrafı → OPMD/kanser olasılığı → sevk (Fikir 1) | MeMoSA (araştırma, Malezya/İngiltere), Birur/Biocon (Hindistan, çift-görüntü cihaz), Lin 2021 vb. — Türkiye'de ürün yok |
| Meme kitlesi | Meme 25.080/yıl TR; ASM'de meme yakınması sık | Palpasyon + yaş + KETEM mamografi | Telefon kitleyi **ölçemez/göremez** | Yalnız risk anketi (Gail/Tyrer-Cuzick zaten var) | iPrevent, Tyrer-Cuzick hesaplayıcılar (doğrulanmadı) — elendi |
| Servikal tarama | Serviks 2.577/yıl TR; HPV-DNA taraması KETEM | Smear/HPV | Lenssiz görüntüleme imkânsız | Yok | MobileODT EVA (cihaz gerekir) — elendi |
| Tiroid nodülü | Tiroid 18.291/yıl TR (aşırı tanı sorunu) | Palpasyon → USG | USG olmadan karar yok | Yok | — elendi |
| Lenfadenopati (boyun/aksilla/inguinal) | ASM'de sık (çoğu enfeksiyöz); Hodgkin 1.694 + NHL + lösemi 6.546/yıl TR | Palpasyonla boyut/kıvam, "2–4 hafta izle" | İzlem sırasında boyut öznel; "büyüdü mü?" belirsiz; sabit >1,5–2 cm, >4–6 hafta → sevk kuralı uygulanmıyor | Fotoğraf + referans ölçek ile standart boyut ve zaman serisi (Fikir 3) | Lenf nodu için kanıt bulunamadı; yara ölçüm uygulamaları (imitoMeasure vb., doğrulanmadı) benzer teknik |
| İstemsiz kilo kaybı / kaşeksi | Kanser için ~%1–3 PPV (Hamilton CAPER serisi; doğrulanmadı) | Tartı, öykü | Önceki ağırlık bilinmiyor; kas kaybı gözden kaçıyor | Kamera antropometri (yağ/kas tahmini) + IMU yürüme/otur-kalk (Fikir 4) | npj Digit Med 2022 (DXA'ya karşı); kanser popülasyonunda kanıt yok |
| Anemi (demir eksikliği, >60 yaş) | Kolorektal 21.172/yıl TR; DEA + yaş → GI kanser kırmızı bayrağı | Hemogram (ASM'de ucuz, hızlı) | Hemogram istenmiyor ya da sonuç takip edilmiyor | Konjonktiva/tırnak fotoğrafı ile Hb tahmini (gastro/hemato ajanıyla çakışıyor) | Mannino 2018 (Nat Commun), PNAS 2025 gerçek dünya; Brown 2021 konjonktiva — elendi (hemogram üstün) |
| Kemik ağrısı / metastaz kırmızı bayrak | Prostat/meme/akciğer metastazı; ASM'de kas-iskelet ağrısı çok sık | Kırmızı bayrak anketi (gece ağrısı, kanser öyküsü, >50 yaş) | Red flag sorulmuyor | Anket (sensör değeri yok); IMU antaljik yürüyüş için kanıt yok | MDCalc tipi — elendi |
| Kanser hastasında ateş (febril nötropeni) | Kemoterapi alan hastada ateş = acil; ASM'ye nadiren gelir | "Kemoterapi + ≥38 °C → acil" tek kural | Kural biliniyor; hasta gecikiyor | Kamera-PPG nabız, video solunum sayısı — kararı değiştirmez | OncsCare (NHS, semptom triyajı 2026); UKONS — elendi |
| Ses kısıklığı >3 hafta | Larinks 3.832/yıl TR (erkekte baskın); ses kısıklığının larinks kanseri PPV'si >40 yaşta ~%2–3 (Shephard 2013; doğrulanmadı) | Öykü, "3 hafta geçmediyse KBB" | Hasta süreyi bilmiyor; hekim larinksi göremiyor | Mikrofon: sürdürülmüş /a/ → akustik AI (Fikir 5) | Emory ve Tayvan basın açıklamaları, sistematik derleme 2026 — ürün yok |
| Hematüri | Mesane 13.771 + böbrek 5.923/yıl TR | Görünür hematüri → üroloji; mikroskopik → idrar tetkiki | — | Telefon idrarda eritrositi göremez; görünür kan zaten karar | Elendi |
| Kaşıntı/sarılık (pankreas, biliyer) | Pankreas 6.110/yıl TR; >60 yaş ağrısız sarılık PPV pankreas kanseri için yüksek (Stapley 2012; doğrulanmadı) | Gözle sklera; bilirubin dış laboratuvar | Hafif sarılık (bil 2–3 mg/dl) loş odada atlanır | Sklera fotoğrafı ile bilirubin tahmini + kırmızı bayrak anketi (Fikir 2) | BiliScreen 2017 (kutu gerekir), Diagnostics 2023 (aksesuarsız) — ürün yok |
| Kanser tarama karar desteği | KETEM: meme/serviks/kolorektal | AHBS/e-Nabız hatırlatma (doğrulanmadı) | Katılım düşük | Sensör yok | Zaten var — elendi |
| Kemoterapi yan etki triyajı | Kemoterapi alan hastada ASM başvurusu | Anket/CTCAE | ePRO ile sağkalım 5 ay uzar (Basch 2017, JAMA; 766 hasta, 31,2 vs 26,0 ay, HR 0,83) | Hasta uygulaması; hekim-telefon değil | Kaiku Health, Noona (doğrulanmadı), OncsCare — zaten var, elendi |

## 2. Proje fikirleri (telefon tek başına, hekim kullanır)

### Fikir 1: AğızBak — ağız içi lezyon fotoğrafından OPMD/kanser sevk triyajı

- **Klinik soru:** "Bu ağız içi beyaz/kırmızı lezyon ya da iyileşmeyen ülser potansiyel malign (OPMD — oral potansiyel malign bozukluk: lökoplaki, eritroplaki, liken planus, oral submüköz fibrozis) ya da kanser mi; bugün 2 hafta içinde KBB/çene cerrahisine mi göndereyim, yoksa 3 hafta sonra kendim mi bakayım?" Hedef karar: hızlı sevk / 3 hafta izlem / rutin diş hekimi.
- **Hasta akışı:** Türkiye'de yılda 2.166 dudak/ağız boşluğu kanseri (GLOBOCAN 2024). Diş kliniğinde taranan 5.000 Türk hastanın %2,2'sinde beyaz lezyon; 2.000 kişilik başka seride prekanseröz lezyon %4 (arama özeti; birincil makaleler bu oturumda açılamadı). Güneydoğu'da Maraş otu (ağız içi dumansız tütün) kullanıcılarında 84 örneğin 67'sinde displazi saptanmış (Bakaris 2007, Toxicol Mech Methods). Aile hekimi sigara içen her hastada ağız içine bakmıyor; bu uygulama 20 saniyelik bakışı "ölçüme" çevirir. Dünyada lökoplakinin yıllık malign dönüşümü ~%1–3 (doğrulanmadı).
- **Telefonda nasıl çalışır:** Arka kamera + flaş, makro moda yakın mesafe (8–12 cm), dil basacağı/ikinci elle yanak ekartasyonu; uygulama ekranda "yanak mukozası / dil yan kenarı / ağız tabanı / damak / dudak" rehber çerçeveleri gösterir, odak ve parlaklık kalitesini otomatik kontrol eder (bulanık/aşırı pozlu kareyi reddeder). 4–6 kare; cihaz üzerinde (on-device) CNN/ViT modeli lezyonu kutular, "normal / benign (aft, travmatik) / düşük riskli OPMD / yüksek riskli OPMD / kanser şüphesi" sınıfı verir. Ek olarak 5 soruluk kısa anket (sigara, Maraş otu/nargile, alkol, >3 hafta süre, ağrı/kanama/indürasyon). Çıktı: trafik ışığı + sevk metni ("2 hafta içinde KBB; biyopsi önerilir") + fotoğrafın sevk notuna eklenmesi. Toplam ≤90 saniye.
- **Kanıt (akıllı telefon):**
  - Lin ve ark. 2021, *J Biomed Opt* — 1.448 akıllı telefon fotoğrafı (iPhone 11/12, IQOO U1, 360 N7Pro, yerel kamera uygulaması, aksesuarsız), 5 sınıf; test setinde makro duyarlılık %83,0, özgüllük %96,6; kanser sınıfı için AUC 0,946 (GA 0,923–0,970), F1 0,90. Tek merkez, retrospektif, kanser sınıfında yalnız 65 görüntü.
  - *Cancers* 2023 (Talwar ve ark.) — akıllı telefon OPMD taraması: DenseNet201 F1 0,84 (iç test), **dış test setinde F1 0,73** — genellenebilirlik düşüşü net.
  - Ferro ve ark. 2022, *Sci Rep* meta-analiz — klinik fotoğraf dâhil bakım noktası ML sınıflandırması için havuzlanmış AUROC 0,935 (31 çalışma).
  - *Oral Diseases* 2025 kapsam derlemesi + meta-analiz — havuzlanmış duyarlılık 0,86 (GA 0,80–0,91), özgüllük 0,67 (GA 0,58–0,75).
  - Birur ve ark. 2022, *Sci Rep* saha validasyonu (Hindistan, 5.025 kişi, 32.128 görüntü) — telefon-içi CNN (MobileNet) duyarlılık %82, bulut VGG19 %87; **saha sağlık çalışanının çıplak göz değerlendirmesi yalnız %60** (uzmandan teletanıya karşı); teletanı uzmanlara karşı %95/%84. Not: bu sistem beyaz ışık + otofloresan çift görüntü cihazı kullanır (ek donanım); yalnız beyaz-ışık telefon fotoğrafı için Lin 2021 ve Talwar 2023 geçerli.
  - Khanna ve ark. 2025, *Cancer* (Varanasi, 10.101 yüksek riskli kişi): saha çalışanı + uzaktan uzman duyarlılığı "orta", özgüllük "yüksek" (sayı verilmemiş).
  - Referans standart: biyopsi/histopatoloji (Birur) ya da uzman klinik tanı (Lin, Talwar).
- **Mevcut uygulamalar/araştırmalar ve fark:** MeMoSA (Mobile Mouth Screening Anywhere; Haron 2020, *Telemed J E Health*; 2026'da 30.039 görüntülük beş ülkeli veri seti yayımlandı) — teletıp/uzaktan uzman yorumu, otomatik AI değil, ticari ürün değil. Biocon/Birur "Oncogrid" — Hindistan, çift-görüntü cihaz, saha çalışanı odaklı. Türkiye'de ya da aile hekimi için hiçbir ürün yok; fark: aksesuarsız, cihaz-içi model, Maraş otu/nargile risk anketiyle birleşik, sevk notu üretimi, Türkçe.
- **Teknik zorluklar + çözüm:** (1) Işık: ağız içi karanlık, flaş yansıması → flaş zorunlu, polarize filtre yok, bu yüzden yansıma maskeleme ve çoklu kare seçimi. (2) Cihaz çeşitliliği → renk normalizasyonu, dudak/diş beyazına göre iç kalibrasyon; dış validasyon F1 düşüşü (0,84→0,73) bunun kanıtı. (3) Türkçe/Türk popülasyon verisi yok → MeMoSA açık veri setiyle ön eğitim, ASM'lerden prospektif Türk veri seti (KBB biyopsi altın standart) gerekir. (4) Sınıf dengesizliği: kanser görüntüleri az → "yüksek riskli OPMD + kanser" tek "sevk" sınıfında birleştirilip duyarlılık öncelenir.
- **Regülasyon:** MDR Kural 11 — sevk kararı için tanısal bilgi sağlar; yanlış negatif "ciddi kötüleşme" riski taşıdığından **IIb** olasıdır; "hekimin kararını destekleyen triyaj aracı, nihai karar hekimde" konumlandırmasıyla IIa savunulabilir. TİTCK (MDR uyumlu). KVKK: ağız fotoğrafı sağlık verisi (özel nitelikli) + biyometrik olmayan; cihazda işleme, buluta yüklenmeme, açık rıza.
- **Riskler:** Yanlış negatif → erken lökoplaki/erken SCC "benign" görülür, 3 hafta değil aylarca gecikir; önlem: ">3 hafta süren her lezyon modelden bağımsız sevk" kuralı sabit. Yanlış pozitif → aft/travmatik ülser/liken planus için KBB yükü; özgüllük 0,67 havuz değeri bunun ciddi olduğunu gösterir; önlem: eşik ayarı, "2 hafta sonra tekrar fotoğraf" opsiyonu.
- **Puan:** Teknik 7 | Kanıt 7 | Etki 6 | Yenilik 6 | Düşük risk 6 | İş akışına uyum 8 | **TOPLAM 40/60**

### Fikir 2: SkleraBil — sklera fotoğrafından sarılık kantifikasyonu + pankreas/biliyer kırmızı bayrak sevki

- **Klinik soru:** "Bu yaşlı hastanın kaşıntı/koyu idrar/halsizlik yakınması subklinik sarılıkla birlikte mi (bilirubin ≥2–3 mg/dl) — yani bugün acil/2 hafta içinde gastro-onkoloji görüntülemesine (USG/BT) mi göndereyim?" Hedef karar: aynı gün bilirubin + USG / 2 haftalık hızlı sevk / rutin.
- **Hasta akışı:** Pankreas kanseri Türkiye'de 6.110 yeni olgu, 5.813 ölüm/yıl (GLOBOCAN 2024) — en öldürücü kanserlerden biri; ağrısız sarılık en sık ilk bulgudur. Birinci basamakta >60 yaşta sarılığın pankreas kanseri PPV'si ~%20 olarak bildirilmiştir (Stapley 2012, *Br J Cancer*; doğrulanmadı). ASM'de kaşıntı, halsizlik, iştahsızlık çok sık; sarılık ise loş odada ve koyu tenlilerde gözden kaçar.
- **Telefonda nasıl çalışır:** Ön/arka kamera, flaş kapalı, gün ışığı ya da oda ışığı; hasta yukarı bakar, alt sklera açığa çıkar; uygulama sklera bölgesini segmente eder, iris/cilt rengine göre otomatik beyaz dengesi yapar, sarılık indeksi (örn. b* kanalı) hesaplar ve tahmini bilirubin aralığı verir ("<2 / 2–5 / >5 mg/dl"). Sonra 6 soru: >50 yaş, kilo kaybı, koyu idrar/açık dışkı, kaşıntı, yeni diyabet, sırt ağrısı. Çıktı: "sarılık olası + kırmızı bayrak → aynı gün bilirubin, ALP/GGT, USG; 2 hafta içinde gastroenteroloji". Süre ≤60 saniye.
- **Kanıt:**
  - *Diagnostics* 2023 (trans-konjunktival optik görüntüleme, iPhone SE 1. nesil, **aksesuarsız**, normal beyaz ışık): 26 sarılıklı erişkin (bil ≥3 mg/dl) + 25 kontrol; duyarlılık %81, özgüllük %80, AUROC 0,842; bilirubinle korelasyon rS 0,528. Küçük örneklem, tek cihaz.
  - BiliScreen (Mariakakis 2017, Univ. Washington, 70 kişi): 3B basılı kutu ile r=0,89, ortalama hata −0,09±2,76 mg/dl, tarama duyarlılığı %89,7, özgüllük %96,8 — **kutu aksesuar gerektirir**, kutusuz (kalibrasyon gözlüğüyle) performans daha düşüktür; 2017'den sonra ürünleşme/validasyon bulunamadı.
  - Referans standart: serum total bilirubin.
  - Pankreas kanserini saptama kanıtı yok; sadece bilirubin tahmini kanıtı var.
- **Mevcut uygulamalar ve fark:** BiliScreen araştırma prototipi; yenidoğan için BiliCam/renk kartı uygulamaları var (ek kart). Erişkin, aksesuarsız, kırmızı-bayrak anketiyle birleşik, hekim-kullanımlı ürün yok. Fark: "sarılık var mı" değil, "sarılık + risk → sevk yolu" çıktısı.
- **Teknik zorluklar + çözüm:** Ortam ışığı ve cihaz beyaz dengesi ana sorun → iç referans (dişler ya da hastanın alt göz kapağı derisi), çoklu ışık altında tekrar isteme, cihaz başına ofset kalibrasyonu; pingekula/kızarıklık segmentasyonu; koyu skleralı yaşlılar (yağ birikimi) yanlış pozitif; Türkiye'de prospektif validasyon (ASM + acil, serum bilirubinle) şart.
- **Regülasyon:** MDR Kural 11 → IIa (tanısal bilgi; kararı hekim verir, laboratuvar doğrular). KVKK: göz fotoğrafı biyometrik veri sayılabilir → iris bölgesini cihazda maskeleyip yalnız sklera piksellerini işleme, görüntüyü saklamama.
- **Riskler:** Yanlış negatif → "sklera normal" diye bilirubin istenmez; önlem: anket kırmızı bayrağı tek başına laboratuvar istetir, görüntü yalnız "ek" sinyaldir. Yanlış pozitif → gereksiz bilirubin tetkiki (ucuz, zararsız) ve USG; kabul edilebilir.
- **Puan:** Teknik 6 | Kanıt 5 | Etki 5 | Yenilik 6 | Düşük risk 7 | İş akışına uyum 9 | **TOPLAM 38/60**

### Fikir 3: NodÖlç — lenfadenopati fotoğraf-ölçüm ve zaman serisi ile sevk kuralı

- **Klinik soru:** "Bu boyun/aksiller/inguinal lenf nodu 4–6 haftada küçüldü mü, sabit mi, büyüdü mü; sabit ≥1,5–2 cm ve risk faktörleri varsa hematoloji/KBB'ye (lenfoma, baş-boyun metastazı) sevk mi?" Hedef karar: 2 haftalık sevk (USG + İİAB/eksizyonel biyopsi) / 4 hafta izlem.
- **Hasta akışı:** Lenfadenopati ASM'de çok sık, çoğu reaktif. Türkiye'de Hodgkin 1.694, lösemi 6.546/yıl (GLOBOCAN 2024); NHL sayısı bu oturumda PDF'ten çıkarılamadı. Birinci basamakta lenfadenopatinin lenfoma PPV'si <%2 (Shephard 2015; doğrulanmadı) — yani değer, çoğunluğu güvenle izlerken persistan olanı atlamamakta.
- **Telefonda nasıl çalışır:** Arka kamera; nodül bölgesine 2 cm'lik standart referans (uygulamayla basılan kare etiket ya da 1 TL madeni para — 2,3 cm) konur, hekim hafif ekartasyonla nodülü sınırlarıyla işaretler; uygulama referansa göre uzun/kısa aks (mm) hesaplar, fotoğrafı tarih damgasıyla saklar; 2–4 hafta sonra aynı açıyla tekrar (ekranda önceki fotoğrafın yarı saydam şablonu). LiDAR'lı telefonlarda (bazı iPhone Pro modelleri) kabarıklık/hacim tahmini — telefonun kendi özelliği, ek donanım değil. Anket: >40 yaş, B semptomları, ağrısız/sert/fikse, supraklaviküler yerleşim, sigara-alkol (baş-boyun), gece terlemesi. Çıktı: boyut grafiği + "izle / sevk" kuralı (örn. 6 haftada küçülmeyen ≥1,5 cm veya supraklaviküler/sert → sevk). Süre ≤60 saniye/vizit.
- **Kanıt:** Lenf nodu boyutunun akıllı telefon fotoğrafından ölçümüne dair **kanıt bulunamadı** (Europe PMC taraması: eşleşme yok). Dolaylı: referans-ölçekli yara ölçüm uygulamaları (imitoMeasure, Tissue Analytics vb.) klinikte kullanılıyor, mm düzeyinde hata bildiriliyor (doğrulanmadı). Palpasyonla boyut tahmininin kendisi de özneldir. Referans standart: USG uzun/kısa aks.
- **Mevcut uygulamalar ve fark:** Lenfadenopati için ürün yok. Fark: palpasyon bulgusunu objektif seriye çevirir; sevk mektubuna ölçekli fotoğraf ekler. Sınır: derin/küçük (<1 cm) nodüller cilt üzerinden görülmez; aksilla/inguinal zor.
- **Teknik zorluklar + çözüm:** Nodül sınırı ciltte belirsiz → hekim manuel işaretleme + referans ölçek; açı/perspektif hatası → referans etiketin düzlemine homografi düzeltmesi; her vizitte aynı poz → şablon üst üste bindirme. Türkçe veri gerekmez (ölçüm geometrik), ama USG'ye karşı doğrulama çalışması şart.
- **Regülasyon:** Ölçüm + izlem kuralı → MDR Kural 11 IIa; "ölçüm aracı ve kılavuz hatırlatıcı" konumlandırması. KVKK: boyun fotoğrafı yüz içerebilir → yüzü kırpma.
- **Riskler:** Yanlış negatif → yüzeyden görülmeyen derin nodül "küçük" sanılır; önlem: fikse/sert/supraklaviküler nodül boyuttan bağımsız sevk. Yanlış pozitif → USG (ucuz) — düşük bedel.
- **Puan:** Teknik 7 | Kanıt 2 | Etki 6 | Yenilik 7 | Düşük risk 6 | İş akışına uyum 7 | **TOPLAM 35/60**

### Fikir 4: KasKayıp — kamera antropometri + IMU fonksiyon testiyle kaşeksi/sarkopeni ve "açıklanamayan kilo kaybı" sevk önceliği

- **Klinik soru:** "Bu hastanın kilo kaybı gerçek (kas kaybı eşlik eden) ve açıklanamayan mı; kanser şüphesi için 2 hafta içinde tetkik paketine (hemogram, CRP, kalsiyum, LDH, akciğer grafisi, USG, FIT) mi alayım?" Hedef karar: hızlı tetkik/sevk vs. diyet-takip.
- **Hasta akışı:** Birinci basamakta istemsiz kilo kaybının kanser PPV'si ~%1–3, yaşla artar (Nicholson 2018 BMJ; doğrulanmadı). Türkiye'de mide 12.914, pankreas 6.110, akciğer 37.846 — kaşeksiyle gelen kanserler.
- **Telefonda nasıl çalışır:** (a) Kamera: ayakta ön+yan tam boy fotoğraf → vücut yağ yüzdesi ve apendiküler kas kütlesi tahmini (görsel vücut kompozisyonu); baldır çevresi tahmini (SARC-CalF taraması için <31–33 cm). (b) IMU: telefon cepte/elde 5 kez otur-kalk süresi ve 4 m yürüme hızı (<0,8 m/sn sarkopeni eşiği). (c) Anket SARC-F + kilo kaybı miktarı/süresi + kırmızı bayraklar. Çıktı: "kas kaybı var + açıklanamayan kayıp → hızlı tetkik paketi". Süre ~3 dakika (sınırda).
- **Kanıt:** Majmudar ve ark. 2022, *npj Digit Med* — 134 sağlıklı erişkinde 2B telefon fotoğrafından vücut yağ yüzdesi, DXA'ya karşı anlamlı yanlılık yok, BIA'dan daha iyi; apendiküler yağsız kütle için çapraz-doğrulanmış RMSE kadınlarda 1,78 kg, erkeklerde 1,50 kg (ikinci rapor). **Kanser/kaşeksi popülasyonunda validasyon yok.** Smartphone IMU ile yürüme hızı/otur-kalk: Sensors 2025 (300 yaşlı, kırılganlık; yalnız R² bildirilmiş); sarkopeni için doğruluk verisi bulunamadı. Referans standart: DXA/BT L3 kas indeksi.
- **Mevcut uygulamalar ve fark:** Spren, Amazon Halo (kapatıldı) gibi tüketici vücut kompozisyon uygulamaları (DXA'ya karşı %2,6 MAE — şirket açıklaması, hakemli değil). Hekim-kullanımlı, kanser kırmızı bayrağına bağlı ürün yok.
- **Teknik zorluklar + çözüm:** ASM'de hastayı soyundurma/odada 4 m mesafe güçlüğü; kıyafet üzerinden tahmin hatası; ASM'de zaten tartı+mezura var → **telefonun kattığı tek şey kas/yağ ayrımı ve fonksiyonel hız**, bu da pahalı değil ama marjinal. Çözüm: yalnız "kilo kaybı" yakınmasıyla gelen hastada kullanım.
- **Regülasyon:** IIa (risk sınıflama). KVKK: tam boy fotoğraf tanımlayıcı → cihazda siluet çıkarıp görüntüyü silme.
- **Riskler:** Yanlış negatif → "kas korunmuş" diye tetkik gecikir; önlem: kilo kaybı >%5/6 ay her durumda tetkik. Yanlış pozitif → fazla tetkik; kabul edilebilir.
- **Puan:** Teknik 5 | Kanıt 3 | Etki 5 | Yenilik 7 | Düşük risk 6 | İş akışına uyum 5 | **TOPLAM 31/60**

### Fikir 5: SesLarinks — 10 saniyelik /a/ kaydından larinks kitle olasılığı ve KBB sevk aciliyeti

- **Klinik soru:** "Bu ses kısıklığı organik larinks lezyonu (kitle/malignite) ile uyumlu mu; 3 hafta kuralını beklemeden mi KBB'ye (laringoskopi) göndereyim?" Hedef karar: hızlı KBB sevki / 3 hafta izlem.
- **Hasta akışı:** Larinks kanseri Türkiye'de 3.832 yeni olgu/yıl, erkeklerde baskın (GLOBOCAN 2024). Birinci basamakta ses kısıklığı yaygın (ÜSYE, reflü, aşırı kullanım); >40 yaşta ses kısıklığının larinks kanseri PPV'si ~%2,7 (Shephard 2013; doğrulanmadı). Aile hekimi larinksi göremez; tek aracı "3 hafta" kuralıdır.
- **Telefonda nasıl çalışır:** Mikrofon, sessiz oda, 15 cm mesafe; sürdürülmüş /a/ 5 sn ×2 + 10 sn okuma cümlesi; akustik öznitelikler (jitter, shimmer, HNR, CPP) + derin model → "normal / benign lezyon / kitle şüphesi"; ortam gürültüsü ölçülüp eşik üstüyse kayıt reddedilir. Anket: sigara-alkol, >3 hafta, disfaji, boyun kitlesi, hemoptizi. Çıktı: sevk aciliyeti. Süre ≤60 sn.
- **Kanıt:** Verma ve ark. 2026, *Medical Sciences* sistematik derleme (18 çalışma): patolojik-normal ayrımı %96–98 doğruluk; **malign–benign ayrımı %81–88 doğruluk, AUC 0,63–0,91**; çoğu stüdyo mikrofonu, akıllı telefon belirtilmemiş. Mairesse 2026 bütünleştirici derleme: iç doğruluk %88–99, kanser özgül değil. Interspeech 2023 (Leeds): gürültü eklenince doğruluk %81,2 → %63,8. Emory (Law) "larinks kitlesi ~%93" ve Tayvan uygulaması ">%80" yalnız basın açıklaması, hakemli validasyon yok; 2025 Leeds tezi alanın "ad hoc, kod/veri paylaşılmıyor" olduğunu söyler. Referans standart: laringoskopi/biyopsi. **Akıllı telefon kaydıyla prospektif birinci basamak çalışması yok.**
- **Mevcut uygulamalar ve fark:** Ürün yok (Emory ve Tayvan prototipleri). KBB ajanı disfoni genelini yazıyor; buradaki fark "malignite olasılığı → sevk aciliyeti" dar odağı. Dürüst not: 3 hafta kuralı zaten ucuz ve güvenli; sensörün katkısı kuralın atlanmasını önlemek ve ağır sigara içicide süreyi kısaltmaktır.
- **Teknik zorluklar + çözüm:** Mikrofon/cihaz farkı, ASM gürültüsü (kabul eşiği), Türkçe fonetik standardizasyon (sürdürülmüş ünlü dilden bağımsız — avantaj), kadınlarda ayırt edici öznitelik zayıf (Frontiers ön çalışması). Türk KBB kliniklerinde laringoskopi eşleştirmeli telefon kayıt veri seti gerekir.
- **Regülasyon:** IIa/IIb (kanser sevk kararı). KVKK: ses kaydı biyometrik olabilir → öznitelik çıkarıp ham sesi silme.
- **Riskler:** Yanlış negatif → "ses normal" diye sevk gecikmesi; önlem: >3 hafta kuralı modelden bağımsız. Yanlış pozitif → laringoskopi (düşük riskli, KBB yükü).
- **Puan:** Teknik 7 | Kanıt 4 | Etki 4 | Yenilik 7 | Düşük risk 5 | İş akışına uyum 9 | **TOPLAM 36/60**

## 3. Alanın en iyi 3 fikri ve gerekçe

1. **AğızBak (40/60).** Tek fikir ki akıllı telefonla, aksesuarsız, çok merkezli/ meta-analitik kanıt var (AUC 0,93–0,95; havuzlanmış duyarlılık 0,86) ve saha verisi çıplak gözün (%60) modelden (%82–87) belirgin kötü olduğunu gösteriyor. Türkiye'de sigara + Maraş otu + nargile yükü yüksek, aile hekimi ağız içine bakmıyor, ürün yok. Zayıf nokta: dış validasyonda düşüş ve özgüllük; Türk prospektif veri seti şart.
2. **SkleraBil (38/60).** Aksesuarsız telefonla erişkin sarılık saptama kanıtı küçük ama var (dy %81/öz %80, AUROC 0,84); karar (bilirubin + USG) ucuz ve geri dönüşlü; iş akışı 30 saniye. Pankreas kanserinin ölümcüllüğü, atlanan subklinik sarılığın bedelini yükseltir. Zayıf nokta: tek küçük çalışma, ışık kalibrasyonu.
3. **SesLarinks (36/60).** Sensör tamamen telefonun kendisi, 60 saniye, Türkiye'de larinks kanseri sık; ancak kanıt laboratuvar düzeyinde ve gürültüye hassas; klinik değer "3 hafta kuralı"na eklenen marjinal kazanç. NodÖlç (35/60) kanıt sıfır olduğu için üçüncü sıraya giremedi, ama teknik olarak en kolay ve en az riskli olan odur; bir validasyon çalışması puanını hızla yükseltebilir.

## 4. Elenenler

- **Meme kitlesi:** Telefon palpe edilen kitleyi göremez/ölçemez; termal/ultrason ek donanım gerekir. Risk anketleri (Gail, Tyrer-Cuzick, iPrevent) zaten var → sensör değeri yok.
- **Servikal tarama:** Lenssiz servikal görüntüleme imkânsız; MobileODT EVA ek cihazdır; HPV-DNA KETEM'de var.
- **Tiroid nodülü:** USG olmadan karar yok; telefon hiçbir şey ölçemez.
- **Anemi (konjonktiva/tırnak):** Kanıt var (Mannino 2018: dy %97, ±2,4 g/dl; PNAS 2025 gerçek dünya dy %89/öz %93; konjonktiva Brown 2021 doğrulamada %73/%73) ama ASM'de hemogram ucuz/hızlı ve kanser kırmızı bayrağı ferritin/Hb düzeyi ister; gastro/hemato ajanının alanı → onkolojide önerilmedi.
- **Kemik ağrısı/metastaz kırmızı bayrak:** Salt anket; IMU antaljik yürüyüş için kanıt yok; hekime sensörle değer katmıyor.
- **Kanser hastasında ateş/nötropeni triyajı:** Karar tek kuralla verilir (kemoterapi + ≥38 °C → acil); kamera-PPG nabız / video solunum sayısı kararı değiştirmez; OncsCare/UKONS triyajı hasta tarafında zaten var.
- **Hematüri:** Görünür hematüri zaten sevk kararıdır; mikroskopik hematüriyi telefon göremez (idrar şeridi okuyucu kutu gerekir — Healthy.io).
- **Kanser tarama karar desteği:** KETEM/AHBS hatırlatma ve kılavuz hesaplayıcıları var; sensör yok → zaten var.
- **Kemoterapi yan etki triyajı (ePRO):** Basch 2017 (sağkalım +5 ay) kanıtlı, Kaiku/Noona/OncsCare ürünleri var; hasta uygulamasıdır, hekim-telefon değil → zaten var.
- **Cilt kanseri:** Dermatoloji ajanının alanı; SkinVision (CE) var; onkoloji açısından yalnız "hızlı büyüyen/kanayan/ülsere → 2 hafta" sevk kuralı eklenir.
- **Kaşeksi (Fikir 4) ana listeye alındı ama düşük puan:** kanser popülasyonunda kanıt yok, ASM'de tartı zaten var.

## 5. Kaynaklar

- GLOBOCAN 2024 Türkiye bilgi formu (IARC, Eylül 2026 sürümü): https://gco.iarc.who.int/media/globocan/factsheets/populations/792-turkiye-fact-sheet.pdf — doğrulandı (PDF metni çıkarıldı)
- Lin H ve ark. Automatic detection of oral cancer in smartphone-based images using deep learning for early diagnosis. J Biomed Opt 2021;26(8):086007. https://pmc.ncbi.nlm.nih.gov/articles/PMC8397787/ — doğrulandı
- Talwar V ve ark. AI-Assisted Screening of Oral Potentially Malignant Disorders Using Smartphone-Based Photographic Images. Cancers 2023;15:4120. https://cdn.iiit.ac.in/cdn/cvit.iiit.ac.in/images/ConferencePapers/2023/cancers-15-04120.pdf — özet doğrulandı (Europe PMC)
- Ferro A, Kotecha S, Fan K. Machine learning in point-of-care automated classification of oral potentially malignant and malignant disorders: systematic review and meta-analysis. Sci Rep 2022. — özet doğrulandı (Europe PMC)
- Automated detection of oral malignant lesions using deep learning: scoping review and meta-analysis. Oral Diseases 2025. — özet doğrulandı (Europe PMC)
- Birur NP ve ark. Field validation of deep learning based Point-of-Care device for early detection of oral malignant and potentially malignant disorders. Sci Rep 2022. — özet doğrulandı (Europe PMC)
- Khanna ve ark. A prospective study on diagnostic accuracy of technology-enabled early detection of oral cancer… rural India. Cancer 2025. — özet doğrulandı
- Haron N ve ark. m-Health for Early Detection of Oral Cancer in LMICs (MeMoSA). Telemed J E Health 2020; MeMoSA dataset, Sci Data 2026. — özet doğrulandı
- Bakaris S ve ark. Ki-67 protein expression in smokeless tobacco (Maras powder)-induced oral mucosal lesions. Toxicol Mech Methods 2007. — özet doğrulandı
- Prevalence and distribution of oral mucosal lesions in an adult Turkish population (5.000 hasta, beyaz lezyon %2,2). https://pubmed.ncbi.nlm.nih.gov/19300376/ — arama özeti, birincil metin açılamadı (doğrulanmadı)
- Prevalence of oral precancerous lesions in a selected Turkish population (2.000 hasta, %4). https://avesis.ankara.edu.tr/yayin/5d92d604-a9f6-4fb1-87ab-26b6281a6f0f — doğrulanmadı
- Identification and Quantification of Jaundice by Trans-Conjunctiva Optical Imaging Using a Human Brain-like Algorithm. Diagnostics (Basel) 2023. — özet doğrulandı (Europe PMC)
- Mariakakis A ve ark. BiliScreen: Smartphone-Based Scleral Jaundice Monitoring for Liver and Pancreatic Disorders. IMWUT 2017. https://ubicomplab.cs.washington.edu/pdfs/biliscreen.pdf — doğrulandı (arama özeti)
- Mannino RG ve ark. Smartphone app for non-invasive detection of anemia using only patient-sourced photos. Nat Commun 2018;9:4924. — özet doğrulandı
- Mannino RG ve ark. Real-world implementation of an AI-augmented anemia-screening smartphone app. PNAS 2025. — özet doğrulandı
- Prediction of anemia from palpebral conjunctiva smartphone images (Brown Univ., 2021). https://hcplive.com/view/smartphone-app-accurate-anemia-detection-conjunctival-images — arama özeti
- Basch E ve ark. Overall Survival Results of a Trial Assessing Patient-Reported Outcomes for Symptom Monitoring During Routine Cancer Treatment. JAMA 2017;318:197–198. https://pmc.ncbi.nlm.nih.gov/articles/PMC5817466/ — doğrulandı
- Majmudar MD ve ark. Smartphone camera based assessment of adiposity: a validation study. npj Digit Med 2022. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9243018/ — arama özeti doğrulandı
- Smartphone-Based Digital Lifelogging for frailty (300 yaşlı). Sensors 2025. — özet doğrulandı (Europe PMC)
- Verma ve ark. Early Detection of Glottic Cancer Through Machine Learning and Acoustic Voice Analysis: A Systematic Review. Medical Sciences 2026. — özet doğrulandı (Europe PMC)
- Mairesse ve ark. Diagnostic Accuracy of AI in Laryngeal Disorders: An Integrative Review. J Pers Med 2026. — özet doğrulandı
- Leeds, Interspeech 2023 (gürültüde %81,2→%63,8): https://eprints.whiterose.ac.uk/id/eprint/202716/ — arama özeti
- Emory Univ. larinks kitlesi ses AI (~%93, basın): https://www.beckershospitalreview.com/oncology/ai-detects-cancer-via-human-voice-what-to-know — hakemli değil
- Tayvan ses uygulaması (>%80, basın): https://itbrief.co.uk/story/ai-app-accurately-detects-laryngeal-cancer-using-voice-data — hakemli değil
- OncsCare dijital semptom triyajı, JMIR Cancer 2026. — özet doğrulandı
- Spren vücut kompozisyonu basın açıklaması: https://insider.fitt.co/press-release/spren-achieves-gold-standard-body-composition-accuracy-using-only-your-phone-camera/ — hakemli değil
- Hamilton/CAPER birinci basamak PPV çalışmaları (Shephard 2013 larinks; Stapley 2012 pankreas; Shephard 2015 lenfoma; Nicholson 2018 kilo kaybı) — bu oturumda açılamadı, **doğrulanmadı**
- NICE NG12 Suspected cancer: recognition and referral — doğrulanmadı
- Türkiye aile hekimliği birim sayısı (~27.000) — doğrulanmadı
