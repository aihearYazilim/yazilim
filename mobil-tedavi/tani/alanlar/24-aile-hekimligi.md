# Aile Hekimliği ve Halk Sağlığı — Aile hekimi için telefonla tanı/triyaj fikirleri (iş akışı perspektifi)

> Ajan notu: Bu turda ~40 web araması yapıldı. Aramanın ortasında oturum kotası doldu (10 arama hata verdi), kota
> açılınca 3 doğrulama araması daha yapıldı. Doğrulanamayan rakam ve ürünler **[doğrulanmadı]** olarak işaretli.
> Bu rapor branş raporlarını (01–20) **tekrar etmez**. Branş fikirlerini 10 dakikalık ASM muayenesinin akışına
> yerleştirir ve branşlar arası boşlukları doldurur: vital bulgu, sevk, ev ziyareti, toplu tarama ve veri saklama.
> Çakışan branş fikirlerine dosya numarasıyla atıf yapılır.

Kısaltmalar:
- **ASM**: Aile Sağlığı Merkezi.
- **AHBS**: Aile Hekimliği Bilgi Sistemi. Bakanlıkça onaylı, özel firmaların yazdığı muayene/izlem yazılımları.
- **HSYS**: Halk Sağlığı Yönetim Sistemi. Aşı, bulaşıcı hastalık bildirimi ve izlem modülleri burada.
- **e-Nabız**: Vatandaşın ve hekimin gördüğü ulusal kişisel sağlık kaydı.
- **Teletıp**: Bakanlığın radyoloji görüntü arşivi ve tele-raporlama sistemi.
- **ÜSYE**: Üst solunum yolu enfeksiyonu.
- **SS**: Solunum sayısı (dakikadaki nefes).
- **PPG**: Fotopletismografi. Parmak kameraya konduğunda flaş ışığıyla nabız dalgasının okunması.
- **rPPG**: Uzaktan, yani temassız yüz videosundan nabız okunması.
- **ASİE**: Aşı sonrası istenmeyen etki.
- **IWGDF**: Uluslararası Diyabetik Ayak Çalışma Grubu.
- **SaMD**: Tıbbi cihaz niteliğindeki yazılım.

## 1. Aile hekiminin en sık karşılaştığı tanı/sevk kararları (envanter)

### 1.1 Ölçek ve bağlam

- **Başvuru sayısı:** 2023'te aile hekimlerine 416,8 milyon başvuru yapıldı. Kişi başı hekime müracaat sayısı (tüm basamaklar) 11,4 oldu (Sağlık Bakanlığı verisi, CNN Türk haberi).
- **Hekim başına yük:** ~28 bin aile hekimi [doğrulanmadı] varsayılırsa hekim başına günde ~60 başvuru düşer. Bu, brifteki 60–100 hasta/gün ile uyumlu.
- **Hastaneye yönelim:** Başvuruların ~%65'i 2. ve 3. basamağa gidiyor (Sözcü haberi; yıl belirsiz [doğrulanmadı]).
- **Sevk zinciri:** Aile hekiminden sevk zorunluluğu kısa süre uygulandı, kalıcı olmadı (YÖK Açık Bilim tezi). Hasta ASM'yi "atlayabildiği" için sevk kararı bir kapı bekçiliği kararından çok **güven kararıdır**. Hekimin "ben izlerim" diyebilmesi için nesnel veriye ihtiyacı var.

### 1.2 En sık 20 tanı/başvuru nedeni

Türkiye geneli için ICD-10 dağılımı yayımlanmış bir çalışma bulunamadı. Kaynaklar şunlar:
- Ankara il merkezi tezi (Özdemir 2016, 156 aile hekimi): tam metin çekilemedi.
- Tek merkezli çalışmalar: OMÜ 2012–13 (6062 başvuru), Marmara Aile Hekimliği polikliniği, Uludağ Eğitim ASM 2019–20 (1725 hasta).

İlk 7 sıra bu çalışmalarla **doğrulandı**. 8–20 arası uluslararası birinci basamak dağılımları ve klinik deneyimden kaba sıralamadır **[doğrulanmadı]**.

Tablodaki "Branş" sütununda dosya numaraları geçer: 01 kardiyoloji, 02 nöroloji, 03 psikiyatri, 04 dermatoloji, 05 oftalmoloji, 06 KBB, 07 FTR/ortopedi, 08 göğüs, 09 gastroenteroloji, 12 kadın doğum, 13 pediatri, 14 geriatri, 15 onkoloji, 16 romatoloji, 18 uyku tıbbı, 20 nefroloji/hematoloji.

| # | Durum | ASM'de sıklık (kaynak) | Bugün nasıl karar veriyor | Yaygın hata/eksik | Telefon ne katabilir | Mevcut ürün/araştırma | Branş |
|---|---|---|---|---|---|---|---|
| 1 | Akut ÜSYE / farenjit / akut öksürük | 1. sıra (OMÜ, Marmara, Uludağ) | Öykü + boğaz bakısı; ateş; nadiren grafi | Gereksiz antibiyotik. Türkiye OECD'de birinci basamakta kişi başı antibiyotikte 1. sıra; aile hekimi reçetelerinin %23,9'unda antibiyotik var (2019) | Video ile SS ve PPG nabız (pnömoni dışlama), boğaz fotoğrafı | Google Fit SS/nabız (tüketici); boğaz AI araştırma | 06, 08 |
| 2 | "Genel tıbbi muayene", rapor, kontrol | 1–2. sıra (Uludağ) | Hızlı vital + form | Vital bulgular ölçülmeden yazılıyor | Tek akış vital paketi | Yok (hekim akışında) | — |
| 3 | Laboratuvar sonucu değerlendirme | 2–3. sıra (OMÜ, Uludağ) | e-Nabız / AHBS | — | Sensör katmıyor | — | — |
| 4 | Hipertansiyon izlemi | 2. sıra (Marmara); en sık kronik hastalık (Uludağ) | Manşon ölçümü | Yanlış teknik, beyaz önlük etkisi | Teknik denetimi (01 ManşonKoç) | Yok | 01 |
| 5 | Sağlıklı birey izlemi (periyodik muayene) | 3. sıra (Marmara) | Kontrol listesi | Taramalar atlanıyor (düşme, biliş, ayak, görme) | Çok testli "tur" | Parça parça var | 14 |
| 6 | Dislipidemi | 4. sıra (Marmara) | Lipid + risk skoru | — | Sensör katmıyor | SCORE2 hesaplayıcı (var) | — |
| 7 | Anemi | 3–5. sıra (OMÜ, Marmara) | Hemogram | Gebe ve bebekte tarama gecikmesi | Konjonktiva/tırnak fotoğrafı (20 SolukCam) | Araştırma | 20 |
| 8 | Tip 2 diyabet izlemi | Erişkinde %13,7 (TURDEP-II) | HbA1c; ayak muayenesi nadir | Nöropati ve ayak riski atlanıyor | Haptik + ayak fotoğrafı | Araştırma | 02, 04, 14, 19 |
| 9 | Kas-iskelet ağrısı (bel, boyun, diz, omuz) | Sık [doğrulanmadı] | Muayene; grafi/sevk | Ortopedi başvurularının %17,3'ü ASM'de yönetilebilir (2023 ortopedi çalışması) | IMU/kamera eklem hareket açıklığı, kırmızı bayrak | Gonyometre uygulamaları (var) | 07, 16, 19 |
| 10 | Deri şikâyetleri (döküntü, egzama, mantar, akne) | Sık [doğrulanmadı] | Bakı | Gereksiz dermatoloji sevki | Fotoğraf + e-konsültasyon | Teledermatoloji (dünyada var; Türkiye'de rutin yok) | 04 |
| 11 | Gastroenterit / dispepsi | Sık [doğrulanmadı] | Öykü, dehidratasyon bakısı | Dehidratasyonun abartılması ya da atlanması | Kapiller dolum, ortostatik nabız | Araştırma | 09, 20 |
| 12 | İdrar yolu enfeksiyonu | Sık [doğrulanmadı] | Semptom ± şerit | — | Şerit okuyucu kutu gerektirir (Healthy.io) | Var | — |
| 13 | Baş ağrısı / baş dönmesi | Orta | Öykü | Santral vertigo atlanıyor | Nistagmus videosu | Araştırma | 02, 06 |
| 14 | Depresyon / anksiyete / uykusuzluk | Orta | PHQ-9 nadiren | Somatik maskeleme | Ses biyobelirteci (araştırma) | Kintsugi vb. | 03 |
| 15 | Bebek-çocuk izlemi | Her bebek 0–1 yaşta çok sayıda izlem [doğrulanmadı: protokoldeki tam sayı] | Tartı, boy, gelişim formu | Sarılık, ambliyopi, otizm geç tanısı | Sklera/kırmızı refle/bakış | Peek, BiliCam (araştırma) | 13, 05 |
| 16 | Gebe izlemi | Gebe başına en az 4 izlem [doğrulanmadı] | TA, idrar, ödem | Preeklampsi geç fark ediliyor | Ödem fotoğrafı, karar motoru | Araştırma | 12 |
| 17 | 65+ yaşlı izlemi | 65+ nüfus ~%10 [doğrulanmadı] | Anket | Düşme, biliş, ortostatik hipotansiyon taranmıyor | IMU-TUG, saat çizme, ortostatik PPG | Sway, Lindera (var) | 14 |
| 18 | Evde sağlık / yatağa bağımlı | İl düzeyinde hastaların ~%48,5'i yatağa bağımlı (Kırklareli); İstanbul'da 21.410 dosya | Ziyarette göz kararı | Bası yarası evresi, deliryum, dehidratasyon kaçıyor → ambulansla acil başvurusu (%55,9) | Yara ölçümü, dikkat testi, SS | imitoMeasure (yara, var) | 14 |
| 19 | Aşı uygulaması ve aşı sonrası reaksiyon | Her aşı günü | ASİE vaka tanımları (lenfadenit ≥1,5 cm, abse, ciddi lokal reaksiyon) | Ölçüm yapılmadan "geçer" deniyor, bildirim eksik | Fotoğrafla çap/alan, seri karşılaştırma | Yok | — |
| 20 | Okul / iş sağlığı taramaları | Kampanya bazlı | Snellen, fısıltı, Adams | Zaman yok, nadiren yapılıyor | Tek oturum çoklu tarama | Peek, hearWHO, Scoliometer (var) | 05, 06, 07 |

### 1.3 Gereksiz sevk ve atlanan tanılar

**Gereksiz sevk:**
- Ortopedi başvurularının %17,3'ü ASM'de tanı alıp yönetilebilirdi. %51,4'ü ise yalnızca görüntüleme olmadığı için yönetilemiyor.
- Acil servise başvuranların %72,2'si birinci basamak veya poliklinik düzeyinde (İnönü tezi).
- Uzman hekimlerin %74,7'si sevk nedeni olarak aile hekiminin bilgi/deneyim eksikliğini görüyor (İstanbul şehir hastaneleri, 2023).

**Sık atlanan tanılar** (klinik bilgi ve branş raporlarından):
- Pnömoni ve sepsiste erken bulgu (SS ölçülmüyor)
- Ortostatik hipotansiyon
- Diyabetik nöropati ve ayak riski
- Erişkinde gizli sarılık ya da anemi
- Hipoaktif deliryum (evde)
- Çocukta ambliyopi
- Bası yarası evre ilerlemesi

**Ortak payda:** Birçok atlanan tanının kökü, **solunum sayısının hiç sayılmaması** ve **ölçümün belgelenmemesidir**. Bu iki eksik telefonla doğrudan kapatılabilir.

## 2. Proje fikirleri (telefon tek başına, hekim kullanır)

### Fikir 1: VitalAkış — 60–90 saniyelik tek akışta kamera-PPG nabız + ritim + video solunum sayısı (+ isteğe bağlı ortostatik mod) ve AHBS'ye yapılandırılmış aktarım

**Klinik soru ve hedef karar**
- Soru: "Bu hastanın vital bulguları (nabız, ritim, solunum sayısı) normal mi, değilse bugün acile mi?"
- Karar: acil sevk / aynı gün tetkik / evde izlem. Ayrıca 01, 08, 09, 12, 14 ve 20'deki branş algoritmalarına **ortak giriş verisi** sağlar.

**Hasta akışı**
- Yılda ~417 milyon ASM başvurusu var. Bunların akut yakınmalı kısmında (ÜSYE, ateş, nefes darlığı, gastroenterit; kabaca üçte bir [doğrulanmadı]) SS ve nabız kılavuz gereğidir ama pratikte nadiren sayılıyor.
- Dünyada birinci basamakta SS'nin ölçülmediği ya da "uydurulduğu" iyi bilinen bir sorun [doğrulanmadı: Türkiye verisi yok].

**Telefonda nasıl çalışır** (hekim telefonu tek eliyle tutar)
1. **Parmak-PPG, 30 sn:** Hasta işaret parmağını arka kamera + flaşa koyar. Nabız, düzensizlik indeksi (AF şüphesi) ve sinyal kalite skoru çıkar.
2. **Göğüs/omuz videosu, 30 sn (eş zamanlı):** Hekim telefonu 0,5–1 m'den hastanın göğsüne tutar. Optik akış ve poz kestirimiyle SS ölçülür. Konuşma sırasında ölçüm otomatik reddedilir. Mikrofon yalnızca konuşma var/yok tespiti yapar, ses kaydetmez.
3. **İsteğe bağlı ortostatik mod (+3 dk):** Yatar 1 dk → ayakta 1. ve 3. dk nabız. IMU kalkışı otomatik algılar. Tansiyon değerleri manşondan elle girilir (karar desteği bölümü).
4. **Çıktı:** "Yeşil / sarı / kırmızı" kartı.
   - Kurallar: SS ≥22 (qSOFA bileşeni), nabız >100 veya <50, düzensiz ritim, ayakta nabız artışı ≥30/dk.
   - Karta şunlar eklenir: ateş (elle girilir), bilinç sorusu (evet/hayır) ve kalite bayrağı.
   - Sonuç yapılandırılmış biçimde (FHIR Observation) AHBS'ye panoya kopyalanır ya da entegrasyonla aktarılır.

**Kanıt**
- **Google Health 2022** (Bae ve ark., *Communications Medicine*, prospektif):
  - Parmak-PPG nabız: MAPE (ortalama mutlak yüzde hata) %1,6 ± 4,3, n=95. Cilt tonu alt gruplarında fark yok.
  - Ön kamera videosundan SS: MAE (ortalama mutlak hata) 0,78 ± 0,61 nefes/dk, n=50. Kronik solunum hastalarında da benzer.
  - Referans: EKG/kapnografi ve manuel sayım. Bunlar hekimin gözle saymasından daha iyi doğruluk değerleri.
- **Sınır:** Bu çalışmada hasta kendini oturarak kaydetti. Hekimin elde tuttuğu telefonla, öksüren veya ateşli hastada doğrulama yok → **kanıt orta**.
- **Ortostatik telefon-PPG protokolü:** Yayımlanmış doğrulama bulunamadı (kanıt yok; ölçüm düzeyinde dolaylı kanıt var).
- **AF taraması:** FibriCheck ve benzerleri CE'li, kanıt güçlü (zaten var).

**Mevcut uygulamalar ve fark**
- **Zaten var:**
  - Google Fit: tüketiciye yönelik nabız + SS.
  - FibriCheck: AF.
  - Binah.ai, Lifelight, NuraLogix Anura: yüz-rPPG vital ölçüm SDK'ları [doğrulanmadı: güncel CE/FDA sınıfları].
  - Welltory: HRV.
- **Fark:**
  - Hepsi hasta veya kurumsal wellness için tasarlanmış. **Hekimin hastaya tuttuğu**, nabız + ritim + SS + ortostatiği tek akışta birleştiren, kılavuz eşikleriyle karar kartı üreten ve AHBS'ye yapılandırılmış veri bırakan ürün yok.
  - Ada, Isabel ve Kry'de **hiç sensör verisi yok**.
- **Yenilik:** Ölçümün kendisi değil; ölçümün iş akışına ve karara bağlanması.

**Teknik zorluklar ve çözüm**
- **Elde tutma titremesi:** IMU ile görüntü sabitleme, çerçeve dışı hareket reddi.
- **Kalın giysi:** Omuz-boyun hareketinden SS kestirimi, gerekirse "kalın giysi" uyarısı.
- **Soğuk parmak, düşük perfüzyon:** Kalite skoru düşükse "ölçülemedi" denir; tahmin yapılmaz.
- **Android cihaz çeşitliliği:** Flaş gücü ve kare hızı için cihaz profilleri tutulur.
- **Doğrulama planı:** Türk ASM'lerinde 300+ hastada manuel 60 sn sayım ve EKG ile karşılaştırma.

**Regülasyon**
- Vital ölçüm + triyaj → MDR Kural 11, **sınıf IIa** (kritik olmayan kararlara bilgi veren yazılım). Kırmızı kart "acil" diyorsa IIb'ye kayabilir. Bu nedenle "karar desteği, nihai karar hekimde" konumlandırması yapılır.
- KVKK: Video cihazda işlenir ve **hiç saklanmaz**. Yalnız sayılar kaydedilir (bkz. Fikir 7).

**Riskler**
- **Yanlış negatif (normal SS gösterip taşipneyi kaçırma):** En tehlikeli senaryo. Önlem: uygulama hekimin klinik izlenimini geçersiz kılmaz; düşük kalitede "sayınız" uyarısı verir.
- **Yanlış pozitif:** Gereksiz acil sevk. Eşikler kılavuz değerleri olduğu için düşük-orta.

**Puan:** Teknik 8 | Kanıt 6 | Etki 9 | Yenilik 6 | Düşük risk 7 | İş akışına uyum 9 | **TOPLAM 45/60**

---

### Fikir 2: AkutEnfeksiyon-Karar — akut öksürük/ÜSYE'de "pnömoni dışlama + antibiyotik gerekli mi" kartı (VitalAkış SS/nabız + boğaz fotoğrafı + Centor/McIsaac + ateş)

**Klinik soru ve hedef karar**
- Soru: "Bu akut öksürük/boğaz ağrısı hastasında pnömoni olasılığı akciğer grafisi gerektirecek kadar yüksek mi, antibiyotik gerekli mi?"
- Karar: antibiyotiksiz izlem + güvenlik ağı / grafi / antibiyotik / acil.

**Hasta akışı**
- ASM'de 1. sıradaki tanı (OMÜ, Marmara, Uludağ).
- Türkiye'de aile hekimi reçetelerinin %23,87'si antibiyotikli (2019; 2011'de %34,94). ÜSYE'de bu oranın genel orana yakın ya da iki katına çıktığı bildiriliyor (YÖK tezi [doğrulanmadı: tam yüzde]).
- Türkiye, birinci basamakta kişi başı antibiyotik tüketiminde OECD'de birinci sırada (Diyarbakır çalışmasının aktarımı).

**Telefonda nasıl çalışır**
1. VitalAkış ölçümü (60 sn).
2. Ateş elle girilir.
3. Akciğer muayenesi bulgusu (raller var/yok) hekimce işaretlenir.
4. Boğaz yakınması varsa flaşlı boğaz fotoğrafı ve eksüda/ödem AI işareti (06 BoğazGöz modülü) + Centor/McIsaac.
5. **Çıktı:**
   - "Vital normal + muayene normal → pnömoni çok düşük olasılık; grafi ve antibiyotik önerilmez."
   - Yazdırılabilir/SMS "güvenlik ağı" kartı: hangi bulguda geri gelinir.
   - ≤2 dk.

**Kanıt**
- **Karar kuralının kanıtı (sensörün değil):**
  - Metlay 1997 (JAMA): vital bulgu anormalliği yoksa pnömoni olasılığı belirgin düşer (aktarılan LR− ≈0,18 [orijinalden doğrulanmadı]).
  - **Marchello 2019** (JABFM, meta-analiz): normal vital bulgular (ateş, SS, nabız) için havuzlanmış LR− 0,24. Normal akciğer muayenesiyle birlikte LR− 0,10 → "pnömoni çok olası değil".
- **Sensör kanıtı:** SS/nabız için Fikir 1'deki kanıt geçerli.
- **Boğaz fotoğrafı AI'nın GAS (A grubu streptokok) için doğruluğu:** 06 raporuna bakınız. Hekim kullanımında bağımsız doğrulama sınırlı (kanıt zayıf).
- **Bu birleşik akışın klinik sonucu** (antibiyotik reçetesine etkisi): **kanıt yok**. Randomize küme çalışması gerekir.

**Mevcut uygulamalar ve fark**
- **Zaten var:**
  - Centor/McIsaac ve CRB-65 hesaplayıcıları (MDCalc).
  - ResApp/ResAppDx öksürük analizi (Pfizer satın aldı; ürün durumu belirsiz [doğrulanmadı]).
  - Ada: semptom denetleyicisi; vinyet çalışmasında ilk 3 tanı doğruluğu %70,5'e karşı hekimlerde %82,1. Çalışmayı Ada finanse etti.
- **Fark:** Hiçbiri ölçülen SS'yi pnömoni dışlama kuralına bağlamıyor. Fark, **sensörle ölçülmüş "normal vital" kanıtı** ve Türk akılcı ilaç hedefine bağlanması.

**Teknik zorluklar ve çözüm**
- Öksürük nöbeti SS ölçümünü bozar → konuşma/öksürük segmentleri reddedilir.
- Çocukta 13 NefesSay (yaşa göre WHO eşikleri) modülü kullanılır; bu fikir erişkin içindir.

**Regülasyon**
- Sınıf IIa (karar desteği).
- Antibiyotik önerisi veren kısım ulusal rehber (Akılcı İlaç) metniyle eşlenir.
- KVKK: Boğaz fotoğrafı tanı amaçlı saklanır (Fikir 7 kasası).

**Riskler**
- **Yanlış negatif:** Atipik pnömoni ya da yaşlıda ateşsiz pnömoni kaçabilir. Önlem: 65+, bağışıklığı baskılanmış ve KOAH hastaları için kural devre dışı kalır, "klinik karar" uyarısı verilir.
- **Yanlış pozitif:** Gereksiz grafi. Bugünkü uygulamadan kötü değil.

**Puan:** Teknik 7 | Kanıt 6 | Etki 9 | Yenilik 7 | Düşük risk 7 | İş akışına uyum 8 | **TOPLAM 44/60**

---

### Fikir 3: SevkÖncesi — branşa özgü "minimum sevk veri paketi" (rehberli fotoğraf/video + otomatik kalite kontrol + sensör ölçümü + kırmızı bayrak) ve uzmandan asenkron e-konsültasyon dönüşü

**Klinik soru ve hedef karar**
- Soru: "Bu hastayı uzmana göndermem gerekiyor mu, yoksa uzmanın yazılı önerisiyle ben mi yöneteyim? Gönderirsem uzmanın ilk vizitte karar verebileceği veri tam mı?"
- Karar: sevk / e-konsültasyon / ASM'de yönetim.

**Hasta akışı**
- Gereksiz sevk oranları:
  - Ortopedi başvurularının %17,3'ü ASM'de yönetilebilir.
  - Dermatolojide dünyada e-konsültasyonla önlenebilir sevk oranı ~%20–40.
- Türkiye'de hastalar doğrudan uzmana gidebildiği için gerçek kazanç iki yönlü:
  - Hekim "ben yönetirim" diyebilir.
  - Sevk edilen hasta tam veriyle gider.

**Telefonda nasıl çalışır**
1. Hekim branşı ve şikâyeti seçer: deri, göz önü, ağız, eklem, yara, yüz felci, yürüme bozukluğu, tremor vb.
2. Uygulama **rehberli çekim protokolü** açar. Örnek (deri): genel, orta ve yakın plan + ölçek referansı.
   - Kamera AI'ı bulanıklığı, pozlamayı ve çerçeveyi **gerçek zamanlı denetler**. Kötü fotoğraf gönderilemez.
3. İlgili sensör modülü varsa eklenir: tremor IMU (02), eklem açısı (07), yürüme videosu (14), VitalAkış.
4. 5–8 soruluk kırmızı bayrak anketi.
5. Paket iki yoldan gider:
   - (a) Hekimin bağlı olduğu ikinci basamağın uzmanına **asenkron e-konsültasyon** olarak. "Uzaktan Sağlık Hizmetlerinin Sunumu Hakkında Yönetmelik" (RG 10.02.2022/31746) konsültasyon ve ikinci görüşü tanımlıyor, ancak Bakanlıkça tescilli bir "uzaktan sağlık bilgi sistemi" şart koşuyor.
   - (b) Sevk mektubu ekinde. Hasta e-Nabız üzerinden uzmanla paylaşır.
6. Uzman 72 saat içinde "ASM'de şu tedavi / 2 haftada gör / bugün gönder" diye döner.
7. Hekimin elindeki süre: ≤2–3 dk.

**Kanıt**
- **PERFECT D** (Eminovic 2009, *Arch Dermatol*, küme randomize, Hollanda, 631 hasta): teledermatolojiyle önlenebilir yüz yüze konsültasyon %39,0'a karşı kontrol %18,3. Fark %20,7 (%95 GA 8,5–32,9).
- **Whited 2002** (ABD Gazileri, randomize): teledermatoloji kolunda hastaların %18,5'ine klinik vizit gerekmedi.
- **Champlain BASE e-Konsültasyon** (Kanada): beyin cerrahisinde e-konsültasyonların %57'sinde gereksiz yüz yüze sevk önlendi. e-Konsültasyonların yalnızca %3,4'ü planlanmamış sevke yol açtı.
- **TeleDerm** (Almanya, küme RCT, %15 sevk azalması hipotezi): sonuçları bulunamadı [doğrulanmadı].
- **Fotoğraf kalite AI'ının tanısal doğruluğa etkisi:** Dolaylı kanıt var (teledermatolojide kötü görüntü oranı yüksek [doğrulanmadı: oran]). Doğrudan çalışma yok.

**Mevcut uygulamalar ve fark**
- **Dünyada:**
  - Teledermatoloji platformları: Hollanda KSYOS, ABD VA, NHS e-RS içinde advice-and-guidance.
  - Kanada Champlain BASE / Ontario eConsult.
  - Babylon (2023'te iflas etti) ve Kry/Livi: hasta-doktor video görüşmesi. Branş protokollü sensör paketi ve hekimden hekime asenkron akış yok.
- **Türkiye'de:**
  - Teletıp: radyoloji görüntü arşivi ve radyologlar arası tele-konsültasyon.
  - Pandemide hasta destekli teledermatoloji pilotu (Atatürk Üniv., *Dermatol Ther* 2021).
  - **ASM–uzman arasında rutin, rehberli, fotoğraflı e-konsültasyon sistemi bulunamadı** [doğrulanmadı: Bakanlık içi pilotlar olabilir].
- **Fark:**
  1. Branşlar arası tek çatı.
  2. Telefonda gerçek zamanlı görüntü kalite denetimi.
  3. Sensör ölçümlerinin (IMU/PPG/video) pakete girmesi.
  4. Türkiye mevzuatına uygun akış.

**Teknik zorluklar ve çözüm**
- **Uzman tarafının teşviki:** Performans puanı ya da ücretlendirme yoksa uzman yanıt vermez. Bu, teknik değil politik bir engel; pilot için üniversite aile hekimliği–dermatoloji çifti seçilir.
- **Tescil:** Uzaktan sağlık bilgi sistemi tescili gerekli.
- **Görüntü kalite modeli:** Açık veri setleri (teledermatoloji kalite etiketleri) + Türkçe çok cilt tonlu veri.

**Regülasyon**
- Paketleme ve kalite kontrolü tek başına tıbbi cihaz sayılmayabilir (sınıf I / cihaz dışı).
- Kırmızı bayrak triyajı ve sensör modülleri eklenince IIa.
- KVKK: Hekimden hekime aktarım, KVKK md. 6 kapsamında tanı/tedavi amaçlı ve sır saklama yükümlülüğü altındaki kişilerce yapılabilir. Yurt dışı bulut kullanılmamalı (Fikir 7).

**Riskler**
- **Yanlış negatif:** Uzmanın fotoğraftan melanom ya da kanseri kaçırması. Önlem: belirli lezyonlarda "fotoğraf yetersiz → yüz yüze" kuralı.
- **Yanlış pozitif:** Az; uzman temkinli olup yine çağırabilir.
- **Sistem riski:** Yanıt gecikmesi. 72 saat sonra otomatik "normal sevk" önerilir.

**Puan:** Teknik 8 | Kanıt 7 | Etki 9 | Yenilik 7 | Düşük risk 8 | İş akışına uyum 6 | **TOPLAM 45/60**

---

### Fikir 4: EvZiyaret-Karar — yatağa bağımlı hastada 5 dakikalık "hastaneye mi, evde mi?" paketi (bası yarası ölçüm/evre + dikkat testi + SS/nabız + kapiller dolum + ağız mukozası fotoğrafı)

**Klinik soru ve hedef karar**
- Soru: "Bu evde bakım hastasında durum kötüleşmesi (sepsis, deliryum, dehidratasyon, ilerleyen bası yarası) var mı?"
- Karar: 112/acil sevk / aynı gün tetkik (evde kan alma) / evde tedavi ve 48 saat sonra kontrol.

**Hasta akışı**
- İstanbul'da tek bir ilde 21.410 evde sağlık dosyası var. Hastaların %55'i 66–85 yaşında, en sık grup nörolojik/psikiyatrik hastalıklar (%45).
- Kırklareli'nde 765 hastanın %48,5'i yatağa bağımlı. Acil başvurularının %55,9'u ambulansla yapılıyor.
- Aile hekimlerinin ev ziyareti sıklığı düşük (derleme). Evde bakım ödemesi alan 569.627 kişi var (2023; sosyal yardım verisi, sağlık hizmeti değil).

**Telefonda nasıl çalışır** (ziyareti yapan hekim veya hemşire, ~5 dk)
1. **Bası yarası:** Ölçek etiketiyle (cetvel sticker; ek cihaz değil) ya da derinlik kameralı telefonlarda etiketsiz ölçüm yapılır. Alan, evre önerisi (NPIAP) ve doku tipleri çıkar. Önceki ziyaretle hizalı karşılaştırma yapılır.
2. **Dikkat testi (Türkçe):** "Ayları geriye say" + ekran tabanlı dikkat görevi (DelApp mantığı; bkz. 03, 14).
3. **VitalAkış:** SS ve nabız.
4. **Kapiller dolum videosu:** Parmak ucuna 5 sn bası, flaşlı video ile renk dönüşüm süresi (20 KılcalDolum).
5. **Ağız mukozası ve dil fotoğrafı:** Kuruluk; kanıt zayıf.
6. **Çıktı:**
   - "Yeni deliryum + SS ≥22" → acil.
   - "Yara alanı 2 haftada ≥%20 büyüdü veya evre 3–4" → yara bakım sevki.
   - Rapor bakım verene sadeleştirilmiş dille verilir.

**Kanıt**
- **imitoMeasure** (Do Khac 2021, *JMIR mHealth*, omurilik yaralanmalı 61 bası yarası): asetat izlemeye göre geçerlik ICC 0,97, gözlemci içi 0,99, gözlemciler arası 0,98. Minimal saptanabilir değişim %17–35.
- **AI ile evreleme** (YOLOv4, 2022): genel doğruluk ~%63; evre 2 duyarlılığı ~%37 → **evrelemede kanıt zayıf**, ölçümde güçlü.
- **DelApp** (Tieges 2020, *PLoS ONE*, yatan yaşlı): AUC 0,89. Ev ortamında kanıt yok.
- **Telefonla kapiller dolum:**
  - Erişkin YBÜ'de CRTApp doğrulama çalışması kayıtlı ama sonuç yok (NCT07473869).
  - Çocuk normatif çalışması var (NCT05472116).
  - Yaşlıda dehidratasyon için **kanıt yok**.
- **Ağız kuruluğu fotoğrafı ile dehidratasyon:** **kanıt yok**.

**Mevcut uygulamalar ve fark**
- **Zaten var (yara ölçüm uygulamaları):** imitoMeasure, Swift Skin and Wound (Kanada; ticari, hastane/evde bakım hemşireliği), MOWA, Tissue Analytics (Net Health).
- **Türkiye'de:**
  - Hemşire uzaktan bası yarası izlem RCT'si (NCT06848049).
  - Bakım veren eğitim uygulaması (NCT07565233).
- **Fark:** Yara ölçümü tek başına zaten var. Fark, **yara + deliryum + vital + perfüzyonun tek "hastaneye mi" kararında** birleşmesi ve aile hekimi ev ziyareti akışına (HSYS/AHBS evde sağlık modülü) bağlanması.

**Teknik zorluklar ve çözüm**
- **Ev aydınlatması:** Flaş + beyaz referans kart (rutin kırtasiye, ek cihaz sayılmaz).
- **Konuşamayan hasta:** Dikkat testi yapılamaz → yalnız vital ve yara modülü çalışır.
- **İnternet yok:** Çevrimdışı çalışır, sonra senkronize eder.

**Regülasyon**
- Yara ölçümü sınıf I.
- Kötüleşme triyajı IIa.
- KVKK: Mahrem bölge fotoğrafları için yüz/kimlik içermeyen çekim kuralı ve şifreli kasa (Fikir 7).

**Riskler**
- **Yanlış negatif:** Hipoaktif deliryum veya sessiz sepsis kaçabilir. Önlem: bakım verene "yeni değişiklik var mı?" sorusu (Sophia Observation tarzı) zorunlu tutulur.
- **Yanlış pozitif:** Yaşlıyı gereksiz yere hastaneye taşıma. Bu ciddi zarar demek (deliryum, enfeksiyon). Eşikler muhafazakâr değil, dengeli seçilmeli.

**Puan:** Teknik 7 | Kanıt 5 | Etki 8 | Yenilik 7 | Düşük risk 6 | İş akışına uyum 6 | **TOPLAM 39/60**

---

### Fikir 5: DiyabetTur — yıllık diyabet izleminde 3 dakikalık ayak risk kategorisi (ayak fotoğrafı AI + haptik titreşim eşiği + IWGDF soruları) ve podiyatri/diyabetik ayak sevki

**Klinik soru ve hedef karar**
- Soru: "Bu diyabetlinin ayak risk kategorisi IWGDF 0, 1, 2 mi, 3 mü? Bugün ülser veya enfeksiyon var mı?"
- Karar: yıllık izlem / 3–6 ayda kontrol + ayakkabı-eğitim / diyabetik ayak polikliniğine sevk / aynı gün sevk (enfekte ülser, iskemi).

**Hasta akışı**
- Türkiye'de erişkin diyabet sıklığı %13,7 (TURDEP-II). Bilinen diyabetlilerin büyük kısmı ASM'de izleniyor.
- Yıllık monofilaman muayenesinin yapılma oranı için Türkiye verisi bulunamadı [doğrulanmadı]. Klinik deneyimde nadir yapılıyor.

**Telefonda nasıl çalışır**
1. **İki ayak fotoğrafı (taban + sırt, flaşlı):** AI şunları işaretler: nasır/kallus, deformite (halluks valgus, pençe parmak), ülser, onikomikoz, renk/atrofi.
2. **Haptik titreşim eşiği:** Telefon halluks ve 1. metatars başına dayanır. Artan genlikte titreşim verilir; hasta gözü kapalı "hissettim" der, hekim dokunur. **Sahte uyaran** (titreşimsiz) denemeleri yalancı cevabı yakalar.
3. **IWGDF soruları:** Önceki ülser, amputasyon, klodikasyon.
4. **Çıktı:** Risk kategorisi, sevk ve kontrol aralığı. 01 AyakPPG modülü bu fikirde **çıkarıldı** (kanıtı yok); nabız hekim eliyle palpe edilir.
5. Süre: ~3 dk.

**Kanıt**
- **Haptik:**
  - Stanford medRxiv 2025 (71 hasta; hakemli değil, duyarlılık erişilemedi).
  - Bournemouth prototipleri: frekans/genlik nörotansiyometreye yakın ama 3D baskılı prob eki kullanıyor → brif kuralına göre **ek donanımsız sürümün kanıtı yok**.
  - Karşılaştırma: ayrı cihaz olan Vibrasense biyotesiometreye göre duyarlılık %87,9, özgüllük %86,8 (n=562). Telefon için bu rakam **yok**.
- **Ayak fotoğrafı AI:** Ülser tespitinde araştırmalar var (DFUC yarışma veri setleri) [doğrulanmadı: duyarlılık]. Ön ülser bulgularında **kanıt zayıf**.
- **Sonuç:** Kanıt düşük; asıl değer, muayenenin **yapılmasını ve belgelenmesini sağlamak**.

**Mevcut uygulamalar ve fark**
- **Zaten var:**
  - Bournemouth akıllı nörotesiometre (ek prob).
  - VibraTip (cihaz).
  - Hasta tarafı ayak fotoğrafı uygulamaları: MyFootCare, ayrıca 04 DiyabetikAyak-ASM (yara ölçümü).
- **Fark:** Hekim akışında fotoğraf + haptik + IWGDF'yi tek risk kategorisine bağlayan araç yok.
- **Çakışma:** 02 HaptikAyak, 14 Titreşim-Ayak ve 19 HaptikNöro aynı sensörü öneriyor. Bu fikir, onları yıllık diyabet izleminin "kontrol listesi kapatıcısı" olarak birleştirir.

**Teknik zorluklar ve çözüm**
- **Telefon motor genliği farklılığı:** Cihaz başına kalibrasyon tablosu, ya da yalnız "hissetti/hissetmedi" ikili sınıfı.
- **Ayak fotoğrafında kötü ışık:** Flaş + gri kart.
- **Hijyen:** Telefon şeffaf tek kullanımlık poşet içinde kullanılır (rutin sarf, ek cihaz değil). Titreşimi biraz sönümler → kalibrasyon poşetle yapılır.

**Regülasyon**
- Risk kategorisi + sevk → IIa.
- KVKK: Ayak fotoğrafı düşük kimliklendirici, yine de kasada saklanır.

**Riskler**
- **Yanlış negatif:** Nöropatiyi "normal" göstermek, ayakkabı/eğitim kaçırılır. Önlem: monofilaman varsa onunla birlikte kullanılır; uygulama bunun yerine geçmez.
- **Yanlış pozitif:** Gereksiz podiyatri sevki. Zararı düşük.

**Puan:** Teknik 6 | Kanıt 4 | Etki 8 | Yenilik 6 | Düşük risk 8 | İş akışına uyum 8 | **TOPLAM 40/60**

---

### Fikir 6: ASİE-Ölç — aşı sonrası lokal reaksiyon, BCG lenfadenit ve abse için fotoğrafla çap/alan ölçümü + Bakanlık ASİE vaka tanımı eşlemesi + HSYS bildirim taslağı

**Klinik soru ve hedef karar**
- Soru: "Aşı yerindeki şişlik veya kızarıklık ASİE vaka tanımına uyuyor mu (lenfadenit ≥1,5 cm, abse, ciddi lokal reaksiyon), sevk veya bildirim gerekiyor mu?"
- Karar: izlem / aspirasyon için çocuk enfeksiyon sevki / ASİE bildirimi.

**Hasta akışı**
- Her ASM'de haftalık aşı günleri var. BCG sonrası lenfadenit literatürde %0,x ile %7 arasında değişiyor (İran çalışmasında ~%7; Türkiye verisi bulunamadı [doğrulanmadı]).
- Ebeveyn kaygısıyla sık başvuru oluyor, ölçüm genelde yapılmıyor.

**Telefonda nasıl çalışır**
1. Ölçek referansıyla (cetvel sticker veya bilinen boyutlu nesne) flaşlı fotoğraf çekilir.
2. Eritem ve şişlik sınırı segmente edilir; en büyük çap (mm) ve alan hesaplanır.
3. Bakanlığın ASİE Ek-2 vaka tanımlarıyla eşlenir: zaman penceresi (BCG lenfadenit 2 hafta–6 ay; abse 2–7 gün) + boyut + akıntı ve ateş soruları.
4. Seri fotoğrafla büyüme/küçülme izlenir. Ebeveyn evde çekip gönderebilir; karar yine hekimde.
5. HSYS ASİE formu için taslak doldurulur.
6. Süre: ≤1 dk.

**Kanıt**
- Aşı yeri eritemi için telefonla ölçüm doğrulaması **bulunamadı (kanıt yok)**.
- Dolaylı kanıt: genel fotoğraf planimetrisi (imitoMeasure ICC 0,97). Klinik araştırmalar hâlâ cetvel ve şablon kartla ölçüyor.
- Palpe edilen lenf bezinin çapı (cilt altındaki şişlik) fotoğraftan **güvenilir ölçülemez**. Yalnız görünür kabarıklık ölçülür; derin bez için hekim palpasyonu esastır. Bu önemli bir sınır.

**Mevcut uygulamalar ve fark**
- Yok. Aşı takip uygulamaları yalnız takvim tutuyor. Fark, vaka tanımına bağlı nesnel ölçüm ve bildirim taslağı.

**Teknik zorluklar ve çözüm**
- Koyu ciltte eritem görünürlüğü düşük → renk yerine kabarıklık/gölge analizi ve hekim çizimi seçeneği.
- Bebek hareketi → seri çekimden en net kare seçilir.

**Regülasyon**
- Ölçüm + vaka tanımı eşlemesi → sınıf I–IIa sınırı.
- Bildirim taslağı tıbbi cihaz değil.

**Riskler**
- **Yanlış negatif:** Abse "normal" denip gecikmeli drenaj. Önlem: dalgalanma/akıntı sorusu pozitifse ölçümden bağımsız sevk.
- **Yanlış pozitif:** Gereksiz sevk; ebeveyn kaygısı.

**Puan:** Teknik 7 | Kanıt 3 | Etki 5 | Yenilik 8 | Düşük risk 8 | İş akışına uyum 9 | **TOPLAM 40/60**

---

### Fikir 7: KlinikKasa — hekimin kişisel telefonunda KVKK uyumlu klinik görüntü kasası (galeriden yalıtılmış, şifreli, TCKN eşlemeli, süreli silme) ve tüm fikirlerin ortak altyapısı

**Klinik soru ve hedef karar**
- Bu bir tanı aracı değil; **etkinleştirici altyapı**. Brif kuralı 3'e göre "salt kayıt" ana hedef değildir, bu nedenle puan ayrı yorumlanmalı.
- Ama Fikir 1–6 ve branş fikirlerinin ASM'de yasal olarak kullanılabilmesinin ön koşuludur.

**Sorun**
- Hekimler bugün döküntü, yara ve EKG fotoğraflarını kişisel galeriye çekip WhatsApp ile uzman arkadaşına gönderiyor [doğrulanmadı: Türkiye anketi bulunamadı; dünyada yaygınlığı yayımlanmış].
- Bu görüntüler iCloud/Google Fotoğraflar'a otomatik yedeklendiğinde **yurt dışına aktarılmış özel nitelikli veri** olur (KVKK md. 6 ve 9).
- Hasta fotoğrafları özel nitelikli kişisel veridir. İzinsiz kullanımda TCK 134/136 cezai sorumluluğu doğabilir (hukuk yazısı).
- KVKK Kurulu, hastasına telefonla izinsiz ileti gönderen hekime "gerekli teknik ve idari tedbirleri almama" gerekçesiyle 50 bin TL ceza verdi (2022/923).

**Telefonda nasıl çalışır**
- Uygulama içi kamera kullanılır; görüntü **asla galeriye düşmez**.
- Cihazda AES şifreleme, biyometrik kilit.
- Hasta TCKN veya AHBS protokol numarası ile eşleme.
- Yüz/dövme/kimlik algılandığında otomatik bulanıklaştırma önerisi.
- Aydınlatma metni ekranı ve rıza kaydı.
- Yalnızca yurt içi sunucuya (ASM/Bakanlık tescilli sistem) senkronizasyon; sonra cihazdan silme.
- Tanımlı saklama süresinden sonra imha günlüğü.
- Fikir 3'teki e-konsültasyon paketinin taşıyıcısıdır.

**Kanıt**
- Teknik standart sorunu, klinik doğruluk kanıtı gerekmez.
- Mevzuat:
  - 6698 sayılı KVKK md. 6: sağlık verisi, kamu sağlığının korunması, koruyucu hekimlik, tıbbi teşhis ve tedavi amacıyla sır saklama yükümlülüğü altındaki kişilerce işlenebilir. 2024 değişikliği bu çerçeveyi korudu [doğrulanmadı: güncel madde metni çekilemedi].
  - Kişisel Sağlık Verileri Hakkında Yönetmelik (2019) [doğrulanmadı].

**Mevcut uygulamalar ve fark**
- **Dünyada:**
  - Hastane ölçeğinde güvenli klinik fotoğraf uygulamaları var: Epic Haiku/Rover medya yakalama, Cerner, Imprivata Cortext, "Clinical Photo" türleri; Almanya'da Siilo (güvenli tıbbi mesajlaşma).
- **Türkiye'de:**
  - AHBS'lerin mobil fotoğraf modülü olup olmadığı **doğrulanamadı**.
  - Yurt içi barındırmalı, AHBS'ye bağlı, ASM ölçeğinde bir çözüm bilinmiyor.

**Teknik zorluklar ve çözüm**
- AHBS firmalarıyla entegrasyon için API standardı yok → FHIR DocumentReference önerisi.
- Kişisel cihaz ile kurumsal veri ayrımı → Android Work Profile / iOS Managed Apple ID.

**Regülasyon**
- Tıbbi cihaz değil.
- KVKK veri sorumlusu ASM hekimi (aile hekimi, sözleşmeli işletme) olur. VERBİS kaydı ve aydınlatma yükümlülüğü gerekir.

**Riskler**
- Klinik risk yok.
- Hukuki risk azalır.
- Kullanılmama riski: hız WhatsApp'tan yavaşsa kimse kullanmaz. Çekim → gönderim ≤10 sn olmalı.

**Puan:** Teknik 9 | Kanıt 5 | Etki 7 | Yenilik 5 | Düşük risk 10 | İş akışına uyum 8 | **TOPLAM 44/60** (tanı aracı değil; "en iyi 3" sıralamasına alınmadı)

---

### Fikir 8: OkulTarama-TekOturum — okul/sınıf taramasında görme + işitme + skolyoz + duruş için tek telefonla istasyon akışı ve sınıf listesi bazlı sevk raporu

**Klinik soru ve hedef karar**
- Soru: "Bu sınıftaki hangi çocuklar göz, KBB veya ortopedi sevki almalı?"
- Karar: sevk listesi + veliye yazı.

**Hasta akışı**
- Okul sağlığı taramaları ASM'nin görev tanımında. Kampanya bazlı yapılıyor [doğrulanmadı: güncel Bakanlık–MEB protokolündeki yaş/sıklık].

**Telefonda nasıl çalışır**
1. Sınıf listesi içe aktarılır.
2. Her çocuk için ~3 dk:
   - Görme keskinliği: ekran E-optotipi, ön kamera ile mesafe denetimi.
   - Kırmızı refle/Hirschberg flaş fotoğrafı (05, 13 modülleri).
   - Kulaklıkla sayılar-gürültüde testi (06 Türkçe DIN). Kulaklık okulda zaten varsa; yoksa yalnız hoparlör, daha zayıf.
   - IMU skolyometre (telefon sırta konur) + sırt fotoğrafı (07).
3. Çıktı: sevk listesi.

**Kanıt**
- Bileşenler ayrı ayrı doğrulanmış:
  - Peek Acuity: Kenya okul çalışmaları [doğrulanmadı: duyarlılık burada yeniden çekilmedi].
  - hearWHO / DIN.
  - Telefon skolyometresi okul taramasında fiziksel skolyometreye benzer sonuç verdi (Hindistan, 1000 öğrenci: >7° %1'e karşı %0,7). Etiyopya'da uygulama Adams'tan daha çok pozitif buldu (%3,3'e karşı %1,8; yanlış pozitif riski).
- Birleşik oturumun doğrulaması **yok**.

**Mevcut uygulamalar ve fark**
- **Zaten var:** Peek (görme, okul modülü dahil), hearWHO/hearX (işitme; hearX okul tarama ürünü var), Scoliometer/ScolioTrack (skolyoz).
- **Fark:** Yalnızca entegrasyon ve sınıf listesi akışı → **düşük yenilik**. Brif kuralı 4'e göre sınırda.

**Teknik zorluklar ve çözüm**
- Okul gürültüsü işitme testini bozar → gürültü ölçüm kapısı.
- Çok sayıda çocuk → ekip modu.

**Regülasyon**
- Tarama/triyaj IIa.
- Çocuk verisi: veli rızası ve okul protokolü.

**Riskler**
- Yanlış pozitif skolyoz sevkleri (Etiyopya verisi).
- Ambliyopide yanlış negatif.

**Puan:** Teknik 7 | Kanıt 6 | Etki 6 | Yenilik 3 | Düşük risk 7 | İş akışına uyum 6 | **TOPLAM 35/60**

## 3. Alanın en iyi 3 fikri ve gerekçe

1. **SevkÖncesi (45/60).** Aile hekimliğine özgü, branşlar arası ve Türkiye'de boş olan alan.
   - Kanıt sistem düzeyinde güçlü: PERFECT D'de önlenebilir sevk %39'a karşı %18; Champlain'de %57.
   - Uzaktan Sağlık Yönetmeliği (2022) yasal zemini sağlıyor.
   - Telefonun katkısı: gerçek zamanlı görüntü kalite kontrolü ve sensör modüllerinin pakete girmesi.
   - Darboğaz: uzman tarafının teşviki ve sistem tescili.
2. **VitalAkış (45/60).** En sık atlanan ölçüm olan solunum sayısını 60 saniyede, en sağlam telefon kanıtıyla ölçüyor.
   - Kanıt: Google 2022'de SS MAE 0,78/dk, nabız MAPE %1,6.
   - Diğer tüm branş algoritmalarına ortak giriş verisi sağlıyor.
   - Yenilik ölçümde değil, akışta ve kararda. Bu yüzden ürünleşmesi en hızlı fikir.
3. **AkutEnfeksiyon-Karar (44/60).** ASM'nin 1. sıradaki tanısında, Türkiye'nin en büyük akılcı ilaç sorununa (OECD'de birinci basamakta antibiyotik kullanımında 1. sıra) dokunuyor.
   - Karar kuralı kanıtı güçlü: normal vital bulgular + normal akciğer muayenesi ile LR− 0,10 (Marchello 2019).
   - Eksik kanıt: birleşik akışın antibiyotik reçetesine etkisi. Bu, küme RCT ile test edilmeli.

KlinikKasa (44/60) tanı aracı olmadığı için sıralamaya alınmadı. Ama 1–3'ün ASM'de yasal kullanılabilmesinin ön koşulu ve **ilk yazılması gereken modül**.

## 4. Elenenler

- **Sigara/alkol nesnel ölçümü (CO ölçer yerine telefon):** Yapılamaz. Telefonla nefeste CO ölçümü için hiçbir çalışma yok; tüm uygulamalar (COach2Quit, STEADES) ayrı sensör kullanıyor. Alkolde 03 "Ayık mı?" yeterli.
- **İş sağlığı odyometrisi:** Yasal periyodik muayene kalibre odyometre ister. Telefon tarama sınıfında kalır, hearWHO/hearX zaten var. Ek değer yok.
- **Kamera ile manşet yerleşim doğrulaması (ayrı fikir olarak):** 01 ManşonKoç ile aynı. Kamera ile manşet konumunu doğrulayan çalışma bulunamadı; Dartmouth sensörlü manşet prototipi ek donanım kullanıyor. Kardiyolojiye bırakıldı.
- **Telefon PPG ile tansiyon ya da SpO2 içeren "tam vital paket":** Güvenilir değil. AHA, parmak-PPG tansiyonu doğrulanmamış sayıyor. VitalAkış'tan bilinçli olarak çıkarıldı.
- **Gebe izlemi akışı:** 12'deki PE-Triyaj, LohusaKan ve FetoTon fikirleri yeterli. Akış katmanı VitalAkış ve SevkÖncesi ile sağlanır.
- **Bebek izlemi "tur" uygulaması:** 13 (BiliSkler, KırmızıRefle, BakışTara) ve 05 modüllerinin sıralanması. Ayrı yenilik yok, Fikir 8 mantığıyla birleştirilebilir.
- **Yaşlı izlemi düşme/biliş:** 14 ve 07 (IMU-TUG, Saat-Foto) yeterli. Ortostatik bileşen VitalAkış'a eklendi.
- **Ada/Isabel tipi Türkçe semptom denetleyicisi:** Zaten var. Ada'nın Türkçe sürümü var [doğrulanmadı]. Isabel hekim ayırıcı tanı aracıdır. Sensör katmıyor, brif kuralı 3'e göre salt anket.
- **Dehidratasyonu ağız/dil fotoğrafından tahmin:** Kanıt yok. Fikir 4'te yalnız yardımcı veri olarak kaldı.
- **Laboratuvar sonucu yorumlama:** Telefon sensörü katmıyor.

## 5. Kaynaklar

Türkiye — başvuru, tanı dağılımı, sevk:
- OMÜ / Uludağ / Marmara aile hekimliği tanı dağılımları: https://acikerisim.omu.edu.tr/entities/publication/75e7131b-5569-478d-bc7a-a4514838428e ; https://acikerisim.uludag.edu.tr/items/cd8662f6-c082-4aaf-a1f0-0ab6e137b9ba ; https://openaccess.marmara.edu.tr/entities/publication/3b3a7501-b6ce-4458-87c4-fd99b89e057a
- Ankara aile hekimleri ICD dağılımı tezi (tam metin çekilemedi [doğrulanmadı]): https://tezara.org/theses/448776
- 2023 aile hekimine 416,8 milyon başvuru; kişi başı müracaat 11,4: https://cnnturk.com/ekonomi/galeri/turkiye-saglik-verileri-kisi-basina-hekime-muracaat-sayisi-11-4e-ulasti-2246822
- 2./3. basamak başvuru payı (yıl belirsiz [doğrulanmadı]): https://www.sozcu.com.tr/aile-hekimlerine-basvurmadik-wp691943
- Sevk zorunluluğu tezi: https://acikbilim.yok.gov.tr/handle/20.500.12812/170296
- Ortopedi başvurularında ASM'de yönetilebilirlik %17,3: https://dergipark.org.tr/tr/pub/smj/article/1377754
- Acil servis başvurularının %72,2'si birinci basamak niteliğinde: https://abakus.inonu.edu.tr/items/7e30f0fc-dc55-4f3d-a59f-f3d2ec32f8f7/full
- Uzman hekimlerin sevk görüşleri (2023): https://turkiyeklinikleri.com/article/en-sehir-hastanelerinde-gorev-yapmakta-olan-uzman-hekimlerin-sevk-sistemi-hakkindaki-dusunceleri-uzerine-tanimlayici-calisma-111640.html

Türkiye — antibiyotik:
- Antibiyotik reçete oranı %34,94 → %23,87 (2011–2019) ve il farkları (veri haber ve makale aktarımı; birincil tablo [doğrulanmadı]): https://jrespharm.com/pdf.php?id=302 ; https://www.ntv.com.tr/saglik/turkiyede-hekimlerin-antibiyotik-recetelemesi-yuzde-31-azaldi,6bm0drlGzkWWa7DdSIcbHQ
- ÜSYE'de antibiyotik yazımı tezi: https://acikbilim.yok.gov.tr/handle/20.500.12812/108189

Türkiye — evde sağlık:
- Evde sağlık acil başvuruları (Kırklareli): https://turkiyeklinikleri.com/article/en-evde-saglik-hizmeti-alan-hastalarin-acil-servis-basvurularinin-incelenmesi-kesitsel-arastirma-110635.html
- İstanbul evde sağlık profili: https://acikerisimarsivi.gelisim.edu.tr/items/ce29505b-f555-4c3c-9597-4eb0f61f85df
- Evde bakım yardımı 569.627 kişi: https://j-humansciences.com/ojs/index.php/IJHS/article/download/6485/3634/27458
- Türkiye evde bası yarası uygulama denemeleri: https://clinicaltrials.gov/study/NCT06848049 ; https://clinicaltrials.gov/study/NCT07565233

Türkiye — mevzuat, aşı, diyabet:
- Uzaktan Sağlık Hizmetlerinin Sunumu Hakkında Yönetmelik (RG 31746, 10.02.2022): https://www.erdem-erdem.av.tr/uzaktan-saglik-hizmetlerinin-sunumu-hakkinda-yonetmelik-yayimlandi ; https://webrazzi.com/2022/02/10/saglik-bakanligi-nin-teletip-hizmetleri-yonetmeligine-dair-detaylar/
- Teletıp sistemi: https://www.ntv.com.tr/saglik/teletip-sistemi-nedir-teletip-uygulamasi-nasil-kullanilir,t_ia5LiL_EODneOalOu-jQ
- Türkiye hasta destekli teledermatoloji pilotu: https://avesis.atauni.edu.tr/yayin/80cdaae3-6f4d-4655-8186-575c578fe8a7/investigating-the-factors-enabling-the-accurate-implementation-of-the-patient-assisted-teledermatology-model-during-the-pandemic-in-turkey-a-pilot-study
- KVKK Kurul kararı 2022/923: https://www.kvkk.gov.tr/Icerik/7587/2022-923
- Hasta fotoğrafları ve özel nitelikli veri: https://www.akademikhukuk.org/hasta-fotograflarini-izinsiz-kullanma
- ASİE vaka tanımları (Sağlık Bakanlığı Ek-2): https://hsgm.saglik.gov.tr/depo/birimler/asi-ile-onlenebilir-hastaliklar-db/dokumanlar/ASIE/Ek-2_Vaka_Tanimlari_.pdf
- BCG reaksiyonları (Türk kaynağı): https://cocukenfeksiyondergisi.org/upload/2021-01/54-56%20Ates%20Kara.pdf
- TURDEP-II ve diyabetik ayak sunumları: https://www.klimik.org.tr/wp-content/uploads/2014/06/1.-Prof.-Dr.-%C4%B0lhan-SATMAN.pdf

Dünya — vital ölçüm ve pnömoni kuralı:
- Google Health telefon nabız/SS prospektif doğrulama (Bae 2022): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9053269/
- Marchello 2019, normal vital bulgular ve pnömoni meta-analizi: https://www.jabfm.org/content/32/2/234
- Metlay 1997 JAMA (özet; LR değeri ikincil kaynaktan [doğrulanmadı]): https://www.ovid.com/journals/jama/fulltext/00005407-199711050-00033~does-this-patient-have-community-acquired-pneumonia

Dünya — teledermatoloji ve e-konsültasyon:
- PERFECT D / Eminovic 2009: https://researchinformation.umcutrecht.nl/en/publications/teledermatologic-consultation-and-reduction-in-referrals-to-derma/ ; https://www.isrctn.com/ISRCTN57478950
- Whited 2002: https://digital.ahrq.gov/health-it-tools-and-resources/workflow-assessment-health-it-toolkit/research/whited-j-et-al-2002
- TeleDerm protokolü (sonuç bulunamadı): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6201508/
- Champlain BASE beyin cerrahisi e-konsültasyonu: https://resolve.cambridge.org/core/journals/canadian-journal-of-neurological-sciences/article/p216-improving-access-to-neurosurgeons-through-an-electronic-consultation-service/A62863C4F4584641113618A87BDB50EA ; genel: https://pmc.ncbi.nlm.nih.gov/articles/PMC5542837

Dünya — semptom denetleyicileri:
- Ada vinyet çalışması (BMJ Open 2020): https://www.medrxiv.org/content/10.1101/2020.05.07.20093872v1 ; https://www.healthcareitnews.com/news/primary-care-docs-outperform-symptom-checking-apps-some-apps-come-close
- Babylon GP at Hand değerlendirmesi: https://mobihealthnews.com/node/146361

Dünya — yara, kapiller dolum, nöropati:
- imitoMeasure (Do Khac 2021): https://pmc.ncbi.nlm.nih.gov/articles/PMC7943335
- AI bası yarası evreleme uygulaması: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9541137/
- CRTApp ve Cap App kapiller dolum kayıtları: https://clinicaltrials.gov/study/NCT07473869 ; https://cdn.clinicaltrials.gov/large-docs/16/NCT05472116/Prot_SAP_000.pdf
- Bournemouth telefon titreşim prototipi: https://eprints.bournemouth.ac.uk/29027/
- Vibrasense: https://doaj.org/article/08f43c117d814d8484f4cee7ff9bdc87

Dünya — tansiyon, sigara, okul taraması:
- Dartmouth sensörlü tansiyon pozisyon sistemi: https://www.cs.dartmouth.edu/dfk/research/smithayer-thesis/index.html
- AHA'nın telefon tansiyonuna uyarısı: https://www.aerzteblatt.de/nachrichten/101420/US-Kardiologen-Neue-Methoden-und-alte-Fehler-bei-der-Blutdruckmessung
- Nefeste CO ölçümü için ayrı cihaz gerektiren uygulamalar: https://pmc.ncbi.nlm.nih.gov/articles/PMC6821366 ; https://doaj.org/article/8369cfa9076246e1942abb3396d16790
- Okul skolyoz taraması (Etiyopya, Hindistan): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8212494/ ; https://www.ijcmph.com/index.php/ijcmph/article/view/1355

Doğrulanmadı (bu turda kaynakla teyit edilemedi): Binah.ai, Lifelight ve Anura'nın güncel düzenleyici sınıfları; Ada'nın MDR sınıfı ve Türkçe sürümü; Peek okul duyarlılığı; AHBS mobil fotoğraf modülleri; KVKK md. 6'nın 2024 metni; okul tarama protokolü; Türkiye'de ASİE ve monofilaman oranları.
