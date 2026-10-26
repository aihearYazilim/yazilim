# Geriatri — Aile hekimi için telefonla tanı/triyaj fikirleri

> Ajan notu: Web araması bu turda kota sınırına takıldı (paylaşımlı 200 arama). İlk 8 arama ve ~10 sayfa çekimi
> tamamlandı; sonrası için bilinen makale sayfaları doğrudan çekildi, bir kısmı (TÜİK bülteni, Sensors 2022,
> Gait&Posture 2012, PLoS ONE tam metin, Nature) 403/boş döndü. Doğrulanamayan rakam ve ürünler **[doğrulanmadı]**
> ile işaretlidir. Doğrulanan kaynaklar bölüm 5'te.

Kısa tanımlar: **TUG** = Timed Up and Go (sandalyeden kalk, 3 m yürü, dön, otur; süre). **5xSTS** = beş kez
sandalyeden kalkma testi. **EWGSOP2** = Avrupa sarkopeni (kas kaybı) tanı ölçütleri. **Mini-Cog** = 3 kelime hatırlama +
saat çizme. **MoCA** = Montreal Bilişsel Değerlendirme. **4AT** = deliryum (akut bilinç bulanıklığı) tarama ölçeği.
**OH** = ortostatik hipotansiyon (ayağa kalkınca tansiyon düşmesi). **NPH** = normal basınçlı hidrosefali.
**DPN** = diyabetik periferik nöropati (sinir hasarı). **IMU** = telefonun ivmeölçer+jiroskopu.

## 1. Aile hekiminin bu alanda en sık karşılaştığı tanı/sevk kararları (envanter)

Bağlam: Türkiye'de 65+ nüfus 2024'te ~9,1 milyon, toplam nüfusun ~%10,6'sı (TÜİK "İstatistiklerle Yaşlılar 2024"
[doğrulanmadı — sayfa çekilemedi]); ASM'lerde 65+ hastalar vizitlerin kabaca dörtte bir–üçte birini oluşturur (kaba
tahmin, Türkiye'ye özgü kaynak bulunamadı). Yaşlıların yaklaşık üçte biri yılda en az bir kez düşer (WHO küresel düşme
raporu; Türkiye toplum çalışmaları %25–40 aralığı [doğrulanmadı]).

| Durum | ASM'de sıklık (kaba) | Bugün nasıl karar veriyor | Yaygın hata/eksik | Telefon sensörü ne katabilir | Mevcut ürün/araştırma |
|---|---|---|---|---|---|
| Düşme riski | 65+ hastaların ~1/3'ü yılda düşer; her periyodik muayenede sorulmalı | "Son 1 yılda düştünüz mü?" + bazen TUG kronometre | TUG çoğunlukla yapılmıyor (zaman); yapılırsa sadece süre, kalite yok; kronometre hatası | IMU ile TUG alt-fazları (kalkma, dönüş), yürüyüş değişkenliği; kamera ile yürüyüş hızı | Sway Medical (IMU denge, FDA II — var); Lindera L.Care (kamera yürüyüş, CE sınıf I — var); sTUG araştırmaları |
| Kırılganlık (frailty) | 65+ toplumda %10–25 [doğrulanmadı] | FRAIL/Edmonton anketi, nadiren yürüme hızı | Kavrama gücü dinamometre ASM'de yok; yürüme hızı ölçülmüyor | Yürüme hızı (IMU/kamera) ve 5xSTS süresi; **kavrama gücü telefonla ölçülemez** (ekran basınç sensörü standart değil, kanıt yok) | Yok (anket uygulamaları var) |
| Sarkopeni | 65+ toplumda %5–15 [doğrulanmadı] | SARC-F anketi, baldır çevresi mezura | Tanı için DXA/BIA ve dinamometre yok → hiç konulmuyor | Kamera ile 5xSTS kalkış gücü (W/kg) — doğrulanmış (Ruiz-Cárdenas 2023, AUC 0,80–0,87) | "Sit to Stand" app (Murcia; tripod+240 fps+etiket ister — araştırma ürünü) |
| Bilişsel tarama | 65+ demans ~%7–8, HBB ~%15 [doğrulanmadı] | Mini-Mental, kağıt saat çizme, klinik izlenim | Puanlama değişkenliği, zaman yok, HBB atlanıyor | Ekran/kağıt saat çizme AI puanlama; konuşma analizi (araştırma) | MoCA App (tablet, lisanslı), Linus Health DCTclock (iPad+kalem), Cognetivity CognICA (CE IIa), kağıt CDT-AI araştırma (AUC 0,81–0,92) |
| Deliryum | ASM'de nadir; evde sağlık/huzurevi ziyaretlerinde sık (yatan yaşlıda %20–30) | 4AT/CAM; çoğunlukla "demans alevlendi" sanılıyor | Hipoaktif deliryum atlanır → enfeksiyon/ilaç nedeni kaçar | Ekran tabanlı dikkat testi (DelApp: AUC 0,89) | DelApp (Edinburgh, araştırma; ticari durum belirsiz) |
| Yaşlı depresyonu | 65+ %10–20 depresif belirti [doğrulanmadı] | GDS-15 anketi | Somatik yakınma ardında kaçırılıyor | Ses biyobelirteçleri (araştırma, yaşlı-Türkçe veri yok) | Kintsugi, Ellipsis (İngilizce, ses; yaşlıya özgü kanıt sınırlı) — anket uygulamaları var |
| İşitme / görme | 65+ %30–40 işitme kaybı; görme bozukluğu %10+ | Fısıltı testi, Snellen | Nadiren yapılıyor | Hoparlör saf ses/konuşma-gürültü; ekran keskinlik | hearWHO, Peek Acuity — **zaten var** |
| Polifarmasi | 65+ hastaların ~%30–50'si ≥5 ilaç | TIME kriterleri, STOPP/START (çoğunlukla bakılmıyor) | Antikolinerjik yük, düşme ilaçları | Sensör yok; karar desteği | TIME-to-STOP/START uygulaması (Türkiye), MedStopper, Anticholinergic Burden calc — **zaten var** |
| Ortostatik hipotansiyon | Düşen/baş dönmeli yaşlıda %20–30 | Nadiren yapılıyor (3 dk bekleme zaman alıyor) | Hiç ölçülmüyor; sadece yatarak TA | PPG ile nabız yanıtı + zamanlayıcı; **tansiyon PPG ile ölçülemez** | Araştırma/ürün bulunamadı (sadece PPG-nabız doğrulaması) |
| Ev ortamı düşme riski | Evde sağlık ziyaretlerinde | HOME FAST/kontrol listesi | Yapılmıyor | Oda fotoğrafı → nesne tanıma (halı, kablo, eşik, tutamak yokluğu) | SafeHome AI (2026, ABD web uygulaması, doğrulama yok); hakemli kanıt yok |
| Yürüyüş bozukluğu ayrımı (Parkinson / NPH / nöropati / antaljik) | Yaşlı hastaların ~%30'unda yürüyüş bozukluğu | Gözlem; sevk | Parkinson geç tanı, NPH (tedavi edilebilir demans) kaçırılıyor | Kamera poz kestirimi: adım uzunluğu, kol salınımı, geniş taban, kademeli dönüş | Parkinson için çok sayıda akıllı telefon video araştırması; NPH ayrımı için kanıt bulunamadı |
| Diyabetik periferik nöropati | Diyabetli 65+ hastaların ~%40–50'si | Monofilaman (varsa), diyapazon (nadir) | Ayak muayenesi yapılmıyor | Haptik motor titreşim eşiği (araştırma) | medRxiv 2025 Stanford uygulaması (71 kişi; duyarlılık verilmemiş), Bournemouth prototip |
| Malnütrisyon | 65+ toplumda risk %20–30 | MNA-SF, kilo | Kilo takibi düzensiz | Fotoğraftan baldır çevresi? — **kanıt yok** | Yok |
| Bası yarası | Yatağa bağımlı hastalarda | Göz, cetvel | Evre/ölçüm standardize değil | Fotoğraf ölçüm + evreleme AI | Swift Skin&Wound, imitoMeasure, Tissue Analytics — **zaten var** (çoğu kalibrasyon etiketi ister) |
| İnkontinans | 65+ kadınların %30+ | Anket, günlük | Sorulmuyor | Erkekte ses-üroflovmetri (var); kadında sensör ölçümü yok | proUro/MenHealth (ses akım) — var; kadın için fikir yok |
| Yaşlı istismarı | %10–15 [doğrulanmadı] | EASI anketi (nadir) | Sorulmuyor | Sensörle ölçülebilir bir şey yok (morluk fotoğraf AI kanıtı yok) | Yok |

## 2. Proje fikirleri (telefon tek başına, hekim kullanır)

### Fikir 1: "Kalk-Yürü-Otur" — tek akışta IMU-TUG + kamera 5xSTS ile düşme/sarkopeni/kırılganlık triyajı
- **Klinik soru:** "Bu 65+ hasta düşme riski yüksek ve/veya olası sarkopenik mi; fizyoterapi/geriatri sevki ve egzersiz-beslenme reçetesi gerekli mi?" Hedef karar: geriatri/fizik tedavi sevki vs ASM'de egzersiz + D vit + protein + ilaç gözden geçirme ile izlem.
- **Hasta akışı:** Türkiye'de 65+ ~9,1 milyon kişi; 2024 Aile Hekimliği Periyodik Muayene rehberi 65+ için yılda düşme sorgusu önerir. Kabaca ASM başına yılda birkaç yüz 65+ periyodik muayene; ülke çapında milyonlarca vizit (kaba tahmin).
- **Telefonda nasıl çalışır:** (1) Telefon hastanın bel hizasında cebine/kemer kılıfına konur, hekim "başla" der; IMU ile TUG süresi, kalkma süresi, dönüş süresi, adım düzensizliği çıkar (~20 sn). (2) Telefon masaya yan konur (hastanın yanından, ~2–3 m), hasta kollar göğüste 5 kez kalkar; cihaz üstü poz kestirimi (MediaPipe/MoveNet) ile toplam süre ve kalkış hızı → dikey güç (W/kg) hesaplanır; femur uzunluğu için kameradan piksel/kalça-diz oranı kullanılır ya da hekim boyu girer (~30 sn). (3) Hekim SARC-F'nin 2 sorusunu ve düşme öyküsünü dokunarak işaretler. Çıktı: "Düşme riski: yüksek/orta/düşük" + "Sarkopeni olasılığı: düşük/olası (baldır çevresi ölçün)" + öneri (sevk / egzersiz reçetesi / ilaç gözden geçir). Toplam ≤ 90 sn.
- **Kanıt:**
  - Kamera 5xSTS → sarkopeni: Ruiz-Cárdenas ve ark., *J Med Internet Res* 2023;25:e47873 — 686 toplumda yaşayan 60–88 yaş; EWGSOP2 referans (dinamometre + DXA). Video kalkış gücü + baldır çevresi: AUC %80,5–87,1; duyarlılık %70–83, özgüllük %77–95, NPV %95–99 (ölçüt kombinasyonuna/cinsiyete göre). **Ama** çalışma tripod, 240 fps, trokanter üzerine renkli etiket ve elle seçilen kare kullanmış; etiketsiz/el kamerası poz kestirimi için doğruluk **kanıtı yok** (geliştirilmesi gereken fark).
  - Akıllı telefon STS videosu poz kestirimi: Boswell ve ark., *npj Digital Medicine* 2023 — 405 video (18–96 yaş), OpenPose, 45° açı; video süresi hareket yakalama ile r = 0,997 (11 kişi); %17 video kayıt hatası nedeniyle dışlandı (uzun duraksama, kol kullanımı, kadraj).
  - IMU-TUG: Telefon sensörü ile düşme riski (PPA referanslı) çalışması, 65 kişi >55 yaş, parametre ICC ~0,9 (PMC10385364, 2023; tam metin reCAPTCHA nedeniyle çekilemedi — abstract düzeyinde). Mellone ve ark. 2012 *Gait & Posture* "sTUG" doğrulaması [doğrulanmadı — 403]. Prospektif düşme sonlanımı için akıllı telefon TUG'un duyarlılık/özgüllüğü **yayımlanmamış**; geleneksel bilişsel-TUG için %80 duyarlılık / %93 özgüllük bildirilmiş (derleme).
- **Mevcut ürünler ve fark:** Sway Medical (FDA Class II; IMU postural salınım + reaksiyon; sporcu/beyin sarsıntısı odaklı, düşme riski "kullanım alanı" olarak; TUG/STS gücü yok). Lindera L.Care/L.Gait (CE Class I; bakımevi bakıcısı 30–40 sn yürüyüş videosu + anket; JMIR Aging 2022 keşif çalışması, tam metin çekilemedi; hekim muayenesi için değil, Almanca pazar). "Sit to Stand" araştırma uygulaması (tripod/etiket/elle kare). Fark: ASM'de hekimin masasından, etiketsiz, 90 sn'de TUG + STS gücü + anketi tek sevk kararına bağlayan, Türkçe normlu uygulama yok.
- **Teknik zorluklar + çözüm:** Kamera açısı/mesafe standardizasyonu → ekranda kılavuz çerçeve ve "femur görünüyor" denetimi; fps düşük (30–60) → kalkış süresi hatası; çözüm: kalça eklemi dikey hız eğrisinden kalkış başlangıç/bitişi otomatik, 60 fps modu zorunlu; cihaz çeşitliliği IMU → 50 Hz normalize; Türkçe normlar yok → ilk 1000 hastada yerel kesim noktaları.
- **Regülasyon:** MDR Kural 11 → sınıf IIa (tanısal bilgi sağlayan SaMD); "düşme ve sarkopeni ön tarama, karar desteği" olarak konumlandırma; video cihazda işlenip silinir (KVKK özel nitelikli veri), bulut yok.
- **Riskler:** Yanlış negatif: kalkış gücü normal ama denge bozuk hasta (nörolojik) → düşme atlanır; anket + öykü ile telafi. Yanlış pozitif: obez/diz artrozlu hastada düşük güç → gereksiz sarkopeni sevki; NPV yüksek, PPV düşük (%10–40) → "olası" dili ve baldır çevresi doğrulama şartı.
- **Puan:** Teknik 7 | Kanıt 7 | Etki 9 | Yenilik 5 | Düşük risk 8 | İş akışı 7 | **TOPLAM 43/60**

### Fikir 2: "Saat-Foto" — kağıda çizilen saatin fotoğrafından AI puanlama + Mini-Cog ile 2 dakikalık bilişsel triyaj
- **Klinik soru:** "Bu unutkanlık yakınması olan (ya da 75+ periyodik muayenedeki) hasta nöroloji/geriatri sevki gerektiren bilişsel bozukluk taşıyor mu?"
- **Hasta akışı:** Türkiye'de 65+ demans prevalansı ~%7–8 → ~600–700 bin kişi [doğrulanmadı]; 75+ periyodik muayene rehberinde bilişsel tarama yer alır; ASM'de haftada birkaç hasta.
- **Telefonda nasıl çalışır:** Hekim 3 kelimeyi söyler (uygulama Türkçe standardize listeyi gösterir, 30 sn), hasta kağıda "11'i 10 geçe"yi gösteren saat çizer (hasta için en doğal ortam; parmakla ekrana çizme yaşlıda yapaylık yaratır ve kanıtı yok), hekim kağıdı **fotoğraflar**; AI (CNN) saati 0–2/0–5 puanlar ve hangi öğenin bozuk olduğunu işaretler (sayı yerleşimi, ibre, kontur); hatırlama 3 kelime dokunarak girilir. Çıktı: Mini-Cog puanı + "tarama pozitif → MoCA/sevk" veya "negatif → 1 yıl sonra tekrar". Toplam ≤ 2 dk.
- **Kanıt:** Kağıt saat çizmelerinin derin öğrenme ile sınıflanması: Framingham Kalp Çalışması (Boston Üniversitesi, medRxiv 2021/NSF) 3.263 normal + 160 bozuk; yalnız görüntü AUC 0,813 ± 0,043, yaş+eğitim eklenince AUC 0,919. RF-VAE denetimsiz model: demans vs normal AUC 0,86 (demografi ile 0,96). Sci Rep 2020 (FAU, Almanya) kağıt CDT derin öğrenme: tarama doğruluğu %96,65, puanlama %98,54; yazarlar "mobil cihazla taranabilir" diyor — fakat **telefon kamerasıyla çekilmiş fotoğrafta, ASM ışığında** doğruluk çalışması **yok**. Mini-Cog'un demans için duyarlılık ~%76–99, özgüllük ~%83–93 (Borson 2003 vb. [doğrulanmadı]). Referans standart: nöropsikolojik batarya/klinik tanı.
- **Mevcut ürünler ve fark:** Linus Health DCTclock (dijital kalem/iPad, ABD, FDA 510(k) — ekran/kalem ister, Türkçe yok); MoCA App (tablet, kurum lisansı, puanlama klinisyen); Cognetivity CognICA (CE IIa, görsel kategorizasyon, saat yok); BrainCheck (ABD). Kağıt saat fotoğrafını puanlayan, Türkçe Mini-Cog'la birleşik, hekimin cebindeki uygulama **yok**.
- **Teknik zorluklar + çözüm:** Perspektif/gölge → otomatik kağıt köşe tespiti ve düzleştirme; kalem çeşitliliği → ikili eşikleme + augmentasyon; Türkiye'de eğitim düzeyi düşük yaşlılarda saat çizme yanlış pozitif yüksek → eğitim yılı girdisi ve yerel kalibrasyon (1–2 bin etiketli Türkçe çizim); açıklanabilirlik → hatalı öğeyi işaretleyen ısı haritası.
- **Regülasyon:** MDR Kural 11 → IIa; "bilişsel tarama puanlama yardımı" olarak konumlandırma; fotoğraf cihazda kalır, anonim özellik vektörü saklanır (KVKK).
- **Riskler:** Yanlış negatif: erken amnestik HBB saat çizmede normal → kelime hatırlama ile kısmen yakalanır; her iki yılda tekrar. Yanlış pozitif: görme/el titremesi/okuryazarlık → gereksiz nöroloji sevki; uygulama "sevk öncesi MoCA" basamağı önerir.
- **Puan:** Teknik 8 | Kanıt 6 | Etki 8 | Yenilik 6 | Düşük risk 8 | İş akışı 9 | **TOPLAM 45/60**

### Fikir 3: "Titreşim-Ayak" — telefon haptik motoruyla diyabetik periferik nöropati taraması
- **Klinik soru:** "Bu diyabetli yaşlı hastada koruyucu duyu kaybı var mı — ayak bakımı/podoloji/ayakkabı programı ve yıllık yerine 3 aylık ayak kontrolü gerekli mi?"
- **Hasta akışı:** Türkiye'de erişkin diyabet prevalansı ~%13,7 (TURDEP-II, 2010; [doğrulanmadı]) → ~8–9 milyon; 65+'ta %25–30; DPN diyabetlilerin %40–50'sinde. ASM'de diyabet izlemi en sık kronik hastalık vizitidir; ayak muayenesi oranı düşük.
- **Telefonda nasıl çalışır:** Telefon arka yüzü hastanın ayak başparmağı sırtına / 1. metatars başına dayanır; uygulama rastgele zamanlamayla (sahte uyaran dahil) artan genlikte titreşim verir, hasta "hissettim" dediğinde hekim dokunur; 4–6 uyaranla eşik ve yanlış-pozitif oranı hesaplanır. 10-g monofilaman sonucu (varsa) elle girilir. Çıktı: "Koruyucu duyu kaybı: olası/olasılık düşük" + ayak riski kategorisi (IWGDF). ≤ 90 sn, iki ayak.
- **Kanıt:** Stanford grubu, medRxiv 2025 (Ağustos; hakemli değil): 71 prediyabet/diyabetli hastada telefon titreşim eşiği diyapazon ile karşılaştırılmış; büyük lif duyu kaybını saptadığı bildiriliyor, **duyarlılık/özgüllük PDF'de erişilemedi (403)**. Bournemouth prototipi (ASME 2017) nörotansiyometreye frekans/genlikte yakın, tanısal veri yok. Endonezya pilotu (37 yara hastası): değerlendiriciler arası kappa 0,97 ama hastaların ~%70'i titreşimi hiç hissetmedi (genlik yetersizliği olasılığı). Sonuç: **kanıt araştırma düzeyinde, zayıf**; referans standart diyapazon/nörotansiyometre/monofilaman.
- **Mevcut ürünler ve fark:** Ticari ürün yok (VibraTip, Neurothesiometer ek donanım). Sahte uyaranlı, hekim-uygulamalı, ayak risk kategorisi veren telefon uygulaması yok.
- **Teknik zorluklar + çözüm:** Haptik genlik cihaza göre çok farklı ve çoğu telefonda 128 Hz'de kalibre edilemez → cihaz başına fabrika titreşim profili (iOS Core Haptics / Android VibrationEffect genlik desteği olan cihaz listesi), ivmeölçerle kendi titreşimini ölçüp öz-kalibrasyon; temas basıncı → hekimin eli ile sabit tutma yönergesi; mutlak eşik yerine "hissetme / hissetmeme + sahte uyaranla tutarlılık" ikili çıktısı.
- **Regülasyon:** MDR Kural 11 → IIa; "monofilamana ek tarama"; KVKK düşük risk (sağlık verisi az).
- **Riskler:** Yanlış negatif (en önemli): zayıf titreşim cihazda eşik "normal" görünür → ülser riski atlanır; çözüm: kalibre edilemeyen cihazda uygulama kendini kapatır, monofilaman zorunlu. Yanlış pozitif: kalın cilt/nasır → gereksiz podoloji sevki (düşük maliyet).
- **Puan:** Teknik 5 | Kanıt 4 | Etki 8 | Yenilik 7 | Düşük risk 7 | İş akışı 9 | **TOPLAM 40/60**

### Fikir 4: "Dikkat-Işık" — evde sağlık/huzurevi ziyaretinde Türkçe ekran dikkat testiyle deliryum tespiti
- **Klinik soru:** "Bu demanslı/yaşlı hastadaki ani değişiklik deliryum mu (→ aynı gün enfeksiyon/ilaç/metabolik neden ara, gerekirse acil) yoksa demansın kendisi mi?"
- **Hasta akışı:** ASM poliklinik için nadir; evde sağlık birimleri ve ASM'nin huzurevi/yatağa bağımlı hasta ziyaretlerinde sık (yatan yaşlıda deliryum %20–30; Türkiye evde sağlık kayıtlı hasta ~1 milyon [doğrulanmadı]).
- **Telefonda nasıl çalışır:** DelApp mantığı: önce uyanıklık (0–4), sonra ekranda beliren ışık/sayı dizilerini sayma görevi (0–6); toplam 0–10, ≤8 pozitif. Türkçe yönerge, büyük kontrastlı ekran. ~2 dk. Çıktı: "deliryum olası → nedenleri tara (ilaç listesi, idrar, ateş), sevk eşiği" veya "olası değil".
- **Kanıt:** Tieges ve ark., *PLoS ONE* 2020 (DelApp, Edinburgh): 187 yatan hasta, ort. yaş 83,8; DSM-5 referans; AUC 0,89 (95% GA 0,84–0,94); ≤8 kesimde duyarlılık %91,7, özgüllük %74,2; demanstan ayrımda özgüllük %68,3. Seçilmemiş örneklem doğrulaması (NCT02590796) sürüyor. Birinci basamak/ev ortamında kanıt **yok**.
- **Mevcut ürünler ve fark:** DelApp (araştırma; ticari lisans durumu belirsiz, Türkçe yok). 4AT kağıt ölçeği (ücretsiz, 2 dk) güçlü rakip: uygulamanın katma değeri objektif dikkat ölçümü + ilaç/neden kontrol listesi.
- **Teknik zorluklar + çözüm:** Görme/işitme engeli → büyük uyaran, titreşimle de uyaran; ekran parlaklığı; hipoaktif hastada iş birliği → uyanıklık alt skoru.
- **Regülasyon:** MDR Kural 11 → IIa (acil karar etkileyebilir → IIb tartışmalı); "4AT'ye ek objektif dikkat ölçümü".
- **Riskler:** Yanlış negatif: hiperaktif deliryumda test tamamlanamaz → "tamamlanamadı = pozitif say" kuralı. Yanlış pozitif: ileri demans → gereksiz acil sevk; demans özgüllüğü düşük (%68) açıkça gösterilir.
- **Puan:** Teknik 8 | Kanıt 7 | Etki 5 | Yenilik 5 | Düşük risk 7 | İş akışı 7 | **TOPLAM 39/60**

### Fikir 5: "Yürüyüş-Fenotip" — 10 sn yürüyüş videosundan Parkinson / NPH / nöropatik / antaljik yürüyüş ayrımı
- **Klinik soru:** "Bu yavaş yürüyen yaşlıda yürüyüş paterni nöroloji sevki (parkinsonizm, NPH şüphesi → BT/MR) gerektiriyor mu, yoksa kas-iskelet/ağrı kaynaklı mı?"
- **Hasta akışı:** 65+ hastaların ~%30'unda yürüyüş bozukluğu; Parkinson prevalansı 65+ ~%1–2; NPH ~%1–2 (80+) [doğrulanmadı].
- **Telefonda nasıl çalışır:** Hekim koridorda 4–5 m yürüyüş + dönüşü önden ve yandan çeker (2×10 sn); cihaz üstü poz kestirimi → adım uzunluğu, yürüme hızı, kadans, kol salınımı asimetrisi, taban genişliği, dönüş adım sayısı, ayak kaldırma yüksekliği. Çıktı: patern olasılıkları + "nöroloji sevki önerilir / ortopedi / izlem".
- **Kanıt:** Parkinson için akıllı telefon video + poz kestirimi çalışmaları çok sayıda (kol salınımı, bradikinezi; hasta-kontrol ayrımı AUC 0,8–0,9 düzeyinde [doğrulanmadı — bu turda aranamadı]). NPH–Parkinson video ayrımı, nöropatik yürüyüş için telefon kanıtı **bulunamadı**. Yürüme hızı 4 m kamera ölçümü doğruluğu için arama yapılamadı [doğrulanmadı].
- **Mevcut ürünler ve fark:** Lindera L.Gait (yürüyüş parametreleri; patern sınıflama yok), OneStep (IMU, fizyoterapi), ClearSky Kinesia (ek donanım). Patern-sınıflayıcı sevk aracı yok → araştırma projesi.
- **Teknik zorluklar + çözüm:** ASM koridor darlığı; kıyafet (uzun etek/palto) poz kestirimini bozar; etiketli Türkçe veri seti sıfır → üniversite nöroloji kliniğiyle 500+ video toplamak şart.
- **Regülasyon:** IIa; KVKK video.
- **Riskler:** Yanlış negatif: erken PD'de yürüyüş normal → el tremoru/parmak vuruşu modülüyle tamamlanmalı. Yanlış pozitif: artroz → gereksiz MR.
- **Puan:** Teknik 5 | Kanıt 3 | Etki 6 | Yenilik 8 | Düşük risk 6 | İş akışı 6 | **TOPLAM 34/60**

### Fikir 6: "Ev-Göz" — evde sağlık ziyaretinde oda fotoğraflarından düşme tehlikesi tespiti
- **Klinik soru:** "Bu düşmüş/düşme riskli hastanın evinde hangi düzeltilebilir tehlikeler var; ergoterapi/belediye ev düzenleme sevki gerekli mi?"
- **Hasta akışı:** Evde sağlık ziyaretleri; düşme sonrası vizitler.
- **Telefonda nasıl çalışır:** Hekim/hemşire banyo, yatak odası, koridor fotoğrafı çeker; nesne tanıma (gevşek halı, kablo, eşik, tutamak/kaymaz paspas yokluğu, loş ışık, yüksek yatak) HOME FAST maddelerine eşlenir; 2 dk; çıktı: öncelikli düzeltme listesi + sevk.
- **Kanıt:** Hakemli doğrulama **yok**. SafeHome AI (ABD, Temmuz 2026 web uygulaması; fotoğraf + anket; doğrulama verisi yok). Tayvan NSTC projesi (AI+AR ev tehlikesi, 2024'te bitti, sonuç yayımlanmamış). HOME FAST'ın kendisi doğrulanmış kontrol listesi.
- **Mevcut ürünler ve fark:** SafeHome AI (web, İngilizce, doğrulanmamış). Türkçe, evde sağlık iş akışına gömülü, HOME FAST puanı veren uygulama yok.
- **Teknik zorluklar:** Ev çeşitliliği, ışık; genel nesne tespiti modelleri "tutamak yokluğu" gibi negatif bulguları zor saptar.
- **Regülasyon:** Tıbbi cihaz olmayabilir (çevre değerlendirmesi) → sınıf I ya da kapsam dışı; KVKK: ev fotoğrafı kişisel veri.
- **Riskler:** Yanlış negatif düşük maliyet (kontrol listesi yine doldurulur); yanlış pozitif zararsız.
- **Puan:** Teknik 5 | Kanıt 2 | Etki 5 | Yenilik 7 | Düşük risk 8 | İş akışı 4 | **TOPLAM 31/60**

### Fikir 7: "Ayağa Kalk" — IMU + kamera-PPG ile ortostatik test asistanı (tansiyon elle girilir)
- **Klinik soru:** "Bu baş dönmesi/düşme/senkoplu yaşlıda ortostatik hipotansiyon veya belirgin kronotropik yanıt var mı; ilaç azaltma/kardiyoloji?"
- **Telefonda nasıl çalışır:** Hasta 5 dk yatar (uygulama zamanlar), parmak flaş-kamerada; IMU ayağa kalkışı otomatik saptar ve 0/1/3 dk işaretlerini sesle hatırlatır; hekim o anlarda tansiyon aletiyle ölçüp girer; PPG nabız yanıtı (POTS tipi ≥30/dk artış, ya da nabız artmayan OH → nörojenik ipucu) hesaplanır. Çıktı: OH / nörojenik OH şüphesi / POTS / normal + ilaç gözden geçirme listesi. ~5–6 dk (ASM için uzun).
- **Kanıt:** Kamera-PPG nabız/HRV doğruluğu iyi (Cardiio doğrulaması, JMIR mHealth 2017); **tansiyon PPG ile güvenilir değil** (küçük, düşük kaliteli çalışmalar — sistematik derleme, Arterial Hypertension). Akıllı telefon PPG ile OH tespiti çalışması **bulunamadı → kanıt yok**. Geriatrik perspektif: nabız yanıtının OH'da nörojenik–nörojenik olmayan ayrımı (ΔKH/ΔSKB oranı) literatürde var (Norcliffe-Kaufmann 2018 [doğrulanmadı]) ama telefonla değil.
- **Mevcut ürünler ve fark:** Kardiyoloji ajanı ile çakışır; geriatrik fark = ilaç listesi + düşme bağlamı. Ürün yok.
- **Zorluklar:** Parmağı 5 dk flaşta tutmak; hareket artefaktı kalkış anında.
- **Regülasyon:** Karar desteği + nabız ölçümü → IIa.
- **Riskler:** Yanlış negatif: ölçüm anı kaçırılırsa OH atlanır; yanlış pozitif: hareket artefaktı.
- **Puan:** Teknik 6 | Kanıt 3 | Etki 7 | Yenilik 4 | Düşük risk 6 | İş akışı 5 | **TOPLAM 31/60**

### Fikir 8: "Konuş-Analiz" — 60 sn Türkçe resim anlatımından bilişsel bozukluk/depresyon ses biyobelirteci
- **Klinik soru:** "Bu hastada konuşma özellikleri (duraksama, sözcük bulma, prozodi) HBB/demans veya depresyon için sevk/ileri tarama gerektiriyor mu?"
- **Telefonda nasıl çalışır:** Hekim ekranda standart resmi gösterir, hasta 60 sn anlatır; cihaz üstü ASR + akustik/dilsel öznitelikler → risk puanı.
- **Kanıt:** İngilizce/Almanca'da Winterlight, ki:elements, Canary Speech çalışmaları (HBB ayrımında AUC 0,7–0,9 bildirilir [doğrulanmadı — aranamadı]); depresyon sesi: Kintsugi (ABD, FDA Breakthrough [doğrulanmadı]). **Türkçe yaşlı konuşma veri seti ve doğrulama yok → kanıt yok (araştırma düzeyi).**
- **Mevcut ürünler ve fark:** Yukarıdakiler İngilizce; Türkçe yok.
- **Zorluklar:** ASM gürültüsü, lehçe, eğitim düzeyi, Türkçe ASR hataları.
- **Regülasyon:** IIa; ses kaydı KVKK biyometrik veri tartışması.
- **Riskler:** Düşük eğitimli yaşlıda yanlış pozitif.
- **Puan:** Teknik 4 | Kanıt 3 | Etki 7 | Yenilik 7 | Düşük risk 6 | İş akışı 5 | **TOPLAM 32/60**

## 3. Alanın en iyi 3 fikri ve gerekçe
1. **Fikir 2 — Saat-Foto (45/60).** En düşük teknik risk (fotoğraf + CNN), kağıt saat çizme AI'ının hakemli kanıtı güçlü
   (AUC 0,81–0,96), hekim iş akışına sıfır ek yük (zaten kağıda çizdiriyor), 2 dk; Türkçe/eğitim-düzeyi kalibrasyonu
   tek büyük iş. Mevcut ürünler tablet/kalem veya lisans ister; telefon-kağıt kombinasyonu boş alan.
2. **Fikir 1 — Kalk-Yürü-Otur (43/60).** Düşme + sarkopeni + kırılganlık aile hekiminin en sık geriatrik kararı;
   kamera-STS gücüyle sarkopeni için 686 kişilik diagnostik doğruluk çalışması var (AUC ~0,85, NPV >%95); IMU-TUG
   güvenilirliği yüksek. Rakipler (Sway, Lindera) hekim muayenesine ve sarkopeniye odaklı değil. Etiketsiz/tripodsuz poz
   kestiriminin doğrulanması gerekiyor.
3. **Fikir 3 — Titreşim-Ayak (40/60).** Diyabet izlemi ASM'nin en yoğun kronik vizitidir, ayak muayenesi en çok atlanan
   adımdır; ticari rakip yok. Kanıt zayıf (ön baskı) ve haptik kalibrasyon ciddi engel — bu yüzden "kalibre edilemeyen
   cihazda kapan" kuralıyla yalnız monofilamana ek tarama olarak konumlanmalı. Fikir 4 (Deliryum, 39) kanıtı daha güçlü
   ama ASM polikliniğinde sıklığı düşük; evde sağlık birimleri hedeflenirse öne geçebilir.

## 4. Elenenler
- **Kavrama gücü telefonla:** Ekran/kasa basınç sensörü standart değil, doğrulanmış yöntem yok → yapılamaz; 5xSTS alternatif (Fikir 1).
- **Kamera-PPG ile ortostatik tansiyon:** Tansiyon PPG'den güvenilir ölçülemez → yalnız nabız yanıtı (Fikir 7, düşük puan).
- **İşitme taraması:** hearWHO / çeşitli saf ses uygulamaları → zaten var.
- **Görme keskinliği:** Peek Acuity → zaten var.
- **Polifarmasi karar desteği:** TIME-to-STOP/START (Türkiye), STOPP/START, antikolinerjik yük hesaplayıcılar → zaten var; sensör yok.
- **Bası yarası ölçüm/evreleme:** Swift Skin & Wound, imitoMeasure, Tissue Analytics → zaten var (çoğu kalibrasyon etiketi ister; etiketsiz ölçüm için "ek donanım" tartışması ayrı).
- **Erkek üroflovmetri sesi:** proUro/MenHealth → zaten var; **kadın inkontinans** telefon sensörüyle ölçülemez → anket (ICIQ) zaten var.
- **Malnütrisyon fotoğraf antropometri:** Baldır/üst kol çevresinin fotoğraftan kestirimi için yaşlıda doğrulama bulunamadı → kanıt yok; mezura 10 sn sürer, hekime değer katmıyor.
- **Yaşlı istismarı:** Sensörle ölçülebilir bulgu yok; morluk fotoğrafı AI kanıtı yok; EASI anketi var → hekime sensör değeri yok.
- **MoCA'nın tam ekran sürümü:** MoCA App lisanslı/tablet → zaten var; ayrıca 10 dk ASM'ye sığmaz.
- **Ekrana parmakla saat çizme:** Yaşlıda yapay, kanıtı yok → kağıt+fotoğraf tercih edildi (Fikir 2).
- **Yaşlı depresyonu ses biyobelirteci (tek başına):** Türkçe/yaşlı kanıtı yok → Fikir 8'e araştırma olarak katlandı.

## 5. Kaynaklar (URL; doğrulanmayanlar işaretli)
Doğrulananlar (bu turda çekildi/okundu):
- Ruiz-Cárdenas JD ve ark. Sit-to-Stand Video Analysis–Based App for Diagnosing Sarcopenia… J Med Internet Res 2023;25:e47873. https://pmc.ncbi.nlm.nih.gov/articles/PMC10746979/
- Boswell MA ve ark. Smartphone videos of the sit-to-stand test predict osteoarthritis and health outcomes. npj Digit Med 2023. https://pmc.ncbi.nlm.nih.gov/articles/PMC9985590
- Tieges Z ve ark. A smartphone-based test for the assessment of attention deficits in delirium (DelApp). PLoS ONE 2020. https://pmc.ncbi.nlm.nih.gov/articles/PMC6980392 ; https://clinicaltrials.gov/study/NCT02590796
- Akıllı telefon sensörleriyle düşme riski vs PPA (ICC ~0,9), 2023. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10385364/ (yalnız özet; tam metin reCAPTCHA)
- Lindera Mobility Analysis keşif doğrulaması, JMIR Aging 2022;5(3):e36872. https://aging.jmir.org/2022/3/e36872 (tam metin çekilemedi — özet düzeyi) ; Lindera ürün/CE sınıf I: https://www.lindera.de/en ; haber: https://www.mobihealthnews.com/news/emea/german-based-lindera-secures-eu6m-series-investment
- Sway Medical (FDA Class II, IMU denge/biliş): https://swaymedical.com/
- MoCA App (tablet): https://mocacognition.com/
- Kağıt saat çizme derin öğrenme, Framingham (AUC 0,813 → 0,919): https://www.medrxiv.org/content/10.1101/2021.03.06.21253047v1.full.pdf+html ; https://par.nsf.gov/servlets/purl/10303611
- Sci Rep 2020 kağıt CDT derin öğrenme (%96,65): https://doaj.org/article/9f0d1d30af9e414fa28b0c8df1841884 ; FAU: https://open.fau.de/items/7a7e3ede-656a-444d-866a-165b3ae4ac2f/full
- Dijital tablet CDT (AUC 0,78–0,92): https://www.benthamscience.com/article/119349
- Telefon titreşim DPN, medRxiv 2025 (Stanford): https://www.medrxiv.org/content/10.1101/2025.08.28.25333808.full.pdf (PDF 403 — yalnız arama özeti) ; Bournemouth: https://eprints.bournemouth.ac.uk/29027/ ; Endonezya pilotu: https://garuda.kemdikbud.go.id/documents/detail/2098155
- Kamera-PPG nabız doğrulaması (Cardiio), JMIR mHealth 2017: https://mhealth.jmir.org/2017/3/e33/PDF ; PPG tansiyon kanıt zayıflığı: https://journals.viamedica.pl/arterial_hypertension/article/view/94874
- SafeHome AI (ev fotoğrafı, doğrulama yok): https://www.ageinplacetech.com/node/5467 ; Tayvan projesi: https://pure.lib.cgu.edu.tw/en/projects/developing-an-artificial-intelligence-enabled-smart-phone-applica/
- IMU Mini-BESTest LSTM %88,55: https://doaj.org/article/9cb26070a3a84d83a36c5d603f67e842
- Bakımevi IMU-TUG (Sensors 2022): https://doaj.org/article/efe99347d54c458194f0eaa06e68dd24 (değerler çekilemedi)

Doğrulanmayanlar [arama kotası/erişim nedeniyle]:
- TÜİK İstatistiklerle Yaşlılar 2024 (65+ ~9,1 milyon, %10,6): https://veriportali.tuik.gov.tr/Bulten/Index?p=Istatistiklerle-Yaslilar-2024-53710 [doğrulanmadı]
- Mellone S ve ark. sTUG, Gait & Posture 2012 [doğrulanmadı]
- Borson S, Mini-Cog duyarlılık/özgüllük [doğrulanmadı]
- TURDEP-II diyabet prevalansı [doğrulanmadı]; Türkiye demans/sarkopeni/kırılganlık prevalansları [doğrulanmadı]
- Winterlight / ki:elements / Canary Speech / Kintsugi / Linus Health DCTclock / Cognetivity / Swift / imito / TIME kriterleri uygulaması / proUro — ürün varlığı bilinen, bu turda sayfaları çekilemedi [doğrulanmadı]
- Parkinson akıllı telefon video poz kestirimi çalışmaları; Norcliffe-Kaufmann ΔKH/ΔSKB [doğrulanmadı]
