# Aile Hekimliği, Koruyucu Hekimlik ve Halk Sağlığı — Cihazla tedavi edilen hastalıklar ve telefonla tedavi fikirleri

> Yöntem notu: Bu rapor için 25 Ekim 2026'da 28 web araması yapıldı; cihaz onayları, pivotal çalışmalar, mevcut uygulamalar ve
> prevalans rakamları bu aramalarla teyit edildi (Bölüm 5). Aramayla teyit edilemeyen her rakam/ad **"doğrulanmadı"** diye
> işaretlendi; uydurma kaynak yoktur. Alanın özelliği: birinci basamaktaki "cihazlar" çoğunlukla **ölçüm cihazıdır** (tansiyon
> aleti, CO ölçer, tartı, alkolmetre, hap kutusu) ve tedavi edici etki **davranış değişikliği + ilaç titrasyonu** üzerinden gelir.
> Bu yüzden telefonun şansı, ölçümü "taklit etmek"ten çok, **ölç → anında müdahale et** döngüsünü ek donanımsız kurmaktır.
>
> **Kamera-PPG ile tansiyon ölçümü (dürüst özet):** Hiçbir hakemli çalışma, telefon kamerasıyla manşetsiz tansiyon ölçümünün
> AAMI/ISO 81060-2 veya ESH manşetsiz-cihaz standardını karşıladığını göstermemiştir. 2024 arXiv çalışmasında hata ~9–10 mmHg
> ve sistematik sapma vardı; yazarlar "geleneksel cihazın yerini alamaz" dedi [1]. Health Technology Wales (2024) tek
> doğrulama çalışmasında yüksek tansiyonu saptama duyarlılığı %70, özgüllüğü %72 buldu [2]. 2025 derlemesi piyasadaki
> kamera-tansiyon uygulamalarının ESH standardıyla doğrulanmadığını ve manşetle periyodik kalibrasyon isteyen PPG cihazlarının
> zamanla kötü performans gösterdiğini not etti [3]. AlwaysBP (JMIR 2023, n=87) kamera + hareket sensörüyle "kabul edilebilir"
> doğruluk bildirdi ama küçük ve tek merkezli [4]. **Sonuç:** Kamera-PPG'den **nabız ve HRV (kalp hızı değişkenliği)**
> güvenilir biçimde alınır (RMSSD için ECG ile ICC > 0,90 [5]); **tansiyon değeri alınamaz**. Bu raporda hiçbir fikir
> tedavi kararını kamera-tansiyonuna dayandırmaz; tansiyon sonucu, hastanın zaten evde olan manşetli cihazıyla elle girilir.

## 1. Alanda cihazla tedavi edilen hastalıklar (envanter)

| Hastalık / durum | Kullanılan cihaz | Etki mekanizması | Telefon bu mekanizmayı üretebilir mi? | Not |
|---|---|---|---|---|
| Hipertansiyon (yüksek tansiyon) | Ev tansiyon ölçer (manşetli, osilometrik) + kendi kendine izleme ve ilaç titrasyonu | Biofeedback (ölç → ilaç/yaşam tarzı ayarla) | **Hayır** (manşet şart; kamera-PPG tansiyon klinik güvenilirlikte değil [1–3]) / **birebir** (ölçülen değeri alıp titrasyon ve davranış döngüsünü yürütme) | TASMINH4 (Lancet 2018, 142 aile hekimliği, n≈1.182): kendi kendine izleme 12. ayda sistolik −3,5 mmHg, tele-izleme −4,7 mmHg; etki daha fazla ilaç reçetesinden [6]. |
| Hipertansiyon | **RESPeRATE** (cihaz-rehberli yavaş solunum; FDA onaylı, göğüs kayışı + kulaklık) | Solunum eğitimi: <10 nefes/dk → sempatik tonus ↓, baroreflex | **Birebir** (ekran/hoparlör/haptik ile ritim; kamera-PPG ile nabız/HRV geri bildirimi; göğüs kayışı yerine IMU ile nefes algılama) | Mahtani 2012 meta-analizi (8 çalışma, n=494): bazı çalışmalar olumlu, bazıları değil; rutin kullanım için kanıt yetersiz [7]. Tension Tamer (telefon kamera-PPG'li nefes meditasyonu): 6 aylık doz-yanıt pilotunda SBP düşüşü [8]; evre-1 HT alt grubunda (n=30) 3. ayda −8,0 vs −1,9 mmHg [9]; 12 aylık tam RCT sonucu yayımlanmış bulunamadı. |
| Hipertansiyon | İzometrik el kavrama cihazı (**Zona Plus** — doğrulanmadı), duvar çömelmesi protokolleri | Motor egzersiz: izometrik kasılma → vasküler/otonomik adaptasyon | **Birebir** (egzersiz hastadan gelir; telefon kamera-poz tahmini + IMU ile süre/açı denetler; cihaz ek direnç vermez) | Edwards 2023 BJSM ağ meta-analizi (270 RCT, n=15.827): izometrik egzersiz SBP −8,24 / DBP −4,00 mmHg, duvar çömelmesi en etkili (SUCRA %90) [10]. El kavrama için bazı çalışmalar sıfır etki [10]. |
| Hipertansiyon / stres | HRV biofeedback cihazları (emWave, Inner Balance, parmak PPG sensörleri) | Biofeedback + rezonans frekansı solunumu | **Birebir/zayıf** (kamera-PPG ile RMSSD doğru; sürekli ölçüm yok, parmak temas gerekir) | Nakao 2003 meta-analizi (22 RCT): biofeedback vs kontrol SBP −7,3 mmHg, sham'a karşı −3,9 mmHg (anlamsız) [11]. |
| Sigara bağımlılığı | **iCO Smokerlyzer / iCOquit** (Bedfont, telefon bağlantılı CO ölçer) | Biofeedback (biyokimyasal geri bildirim → motivasyon) | **Hayır** (CO ölçümü için elektrokimyasal sensör şart; telefon yapamaz) | COach2Quit pilot RCT (n=102): 30. günde her kolda 1 kişi bıraktı, fark yok [12]. Klinikte CO ölçümü motivasyonu kısa süreli artırır. |
| Sigara bağımlılığı | Nikotin replasmanı (bant, sakız) — ilaç; elektronik sigara | Farmakolojik | **Hayır** | Telefon yalnızca davranışsal bileşeni ve ilaç uyumunu taşır. |
| Sigara bağımlılığı | Dijital davranışsal programlar (Smoke Free, Quit Sense, Smart-T) | Davranışsal terapi, "tam zamanında" müdahale (JITAI) | **Birebir** (zaten telefon) | Smoke Free pragmatik RCT (n=3.143): teklif edilen kolda 6 aylık sürekli bırakma %6,8 vs %7,0 (fark yok); indirenlerde %12,7 vs %7,0 [13]. Quit Sense fizibilite RCT (n=209, konum-tetikli): 6 ayda ~4 kat bırakma, küçük örneklem [14]. |
| Alkol kullanım bozukluğu | Uzaktan alkolmetre (**Soberlink**, **BACtrack**) + koşullu ödül (contingency management) | Biyokimyasal doğrulama + ödül (davranışsal) | **Hayır** (BAC ölçümü yok) / **zayıf** (IMU yürüyüş sapması ile sarhoşluk tahmini; Suffoletto 2020 n=17, BrAC >0,08 için doğruluk %92,5, laboratuvar [15]) | Soberlink RCT (n=40): koşullu ödülle abstinens %85 vs %38 [16]. Telefon doğrulamayı yapamadığı için ödül programı kurulamaz. |
| Riskli içicilik (bağımlılık öncesi) | Dijital kısa müdahale (Drink Less, Try Dry) | Davranışsal | **Birebir** | Drink Less RCT (n=5.602, eClinicalMedicine 2024): 6 ayda haftada ~2 birim ek azalma [17]. **Zaten var.** |
| Obezite / fazla kilo | Akıllı tartı (Omada tartı verir), kalori/aktivite takipçileri | Biofeedback + davranışsal (öz-izleme) | **Zayıf** (tartı yok; kilo elle girilir) / **birebir** (davranışsal program) | Noom RCT (n=427, 2026): 68. haftada −%4,1 vs +%1,5 [18]. **Zaten var** (Noom, WW, Omada). |
| Prediyabet | Diyabet Önleme Programı (DPP) dijital versiyonları — **Omada** (tartı + koç) | Davranışsal (yoğun yaşam tarzı) | **Birebir** (tartı dışında) | PREDICTS RCT (n=599): 12. ayda kilo −%5,4 vs −%2,0; HbA1c −0,23 vs −0,15 [19]. Türkiye: TURDEP-II'de izole IFG %14,7, IGT %7,9, kombine %8,2 (~%30 prediyabet), diyabet %16,5 [20]. **Zaten var** (yurt dışı). |
| Fiziksel hareketsizlik | Pedometre, aktivite bilekliği | Biofeedback (adım sayısı) + hedef/geri bildirim | **Birebir** (IMU adım sayar) | Laranjo 2021 BJSM meta-analizi (28 RCT, n=7.454): uygulama/takipçi +1.850 adım/gün [21]. Paluch 2022 (15 kohort, n=47.471): adım ↑ → mortalite ↓ [22]. **Zaten var** (Google Fit, Apple Health, Samsung Health). |
| Hareketsizlik (oturma süresi) | Masa başı hatırlatıcı cihazlar, akıllı saat "ayağa kalk" | Davranışsal uyarı | **Birebir** (IMU ile oturma algılama + bildirim) | Rise & Recharge (yarı-randomize, n≈56): 60 dk'da bir uyarı → günde ~70 dk daha az oturma, kardiyometabolik değişim yok [23]. |
| Mevsimsel depresyon (kış depresyonu) | Işık kutusu (10.000 lux, 30 dk) | Işık → sirkadiyen/serotonerjik etki | **Hayır / çok zayıf** — 1.000 nit ekran, 15 cm'de ~400 lux, 30 cm'de ~100 lux verir (hesap; doğrulanmadı); etkili eşik ≥1.000 lux × 30 dk [24]. 6 saat/gün oda aydınlatması (BROAD çalışması) kutuyla eşdeğerdi [24]. | Telefon ışık tedavisi yapamaz; sabah gün ışığına çıkma koçluğu ve ortam ışığı sensörüyle "doz" takibi yapabilir (sensör mutlak lux için güvenilmez, göreli için kullanılabilir [25]). |
| Uykusuzluk | CBT-I dijital terapötikleri (Sleepio, Somryst — FDA), ışık/ses cihazları | Davranışsal | **Birebir** | **Zaten var**; ayrı alan raporunda. |
| Kronik ağrı (bel/boyun, baş ağrısı) | TENS, ısı, Cefaly (eTNS), biofeedback | Elektrik akımı (hayır); biofeedback/davranışsal (evet) | **Hayır / birebir** | FTR, algoloji ve nöroloji raporlarında ayrıntılı. Burada tekrar edilmedi. |
| Düşme riski (yaşlı) | Denge platformu, StandingTall (tablet), Nymbl, kalça koruyucu | Motor öğrenme (denge egzersizi) | **Birebir** (egzersiz yönlendirme; IMU/kamera ile denge testi) | StandingTall RCT (BMJ 2021, n=503): 12 ayda anlamsız; 24 ayda düşme −%16 [26]. **Zaten var** (tablet programı). |
| İlaç uyumsuzluğu | Akıllı hap kutusu/şişe (AdhereTech, MEMS kapak), Hero dağıtıcı, AiCure (kamera ile yutma doğrulama) | Hatırlatma + izleme | **Birebir** (bildirim; kamera ile hap/yutma doğrulama) | Penn RCT (n=1.509, MI sonrası): akıllı şişe + ödül → uyum farkı yok [27]. REMIND (n=53.480): ucuz hatırlatıcı cihazlar etkisiz [27]. Uygulama meta-analizi (Armitage 2020): öz-bildirim uyumu OR 2,12 [28]. **Zaten var** (Medisafe, MyTherapy). |
| Yaygın anksiyete / stres | **Muse** (EEG bant), **HeartMath Inner Balance** (kulak PPG), Apollo Neuro (titreşim), Alpha-Stim (CES — akım) | Nörofeedback / HRV biofeedback / haptik / elektrik | EEG: **hayır**. HRV-BF: **birebir** (kamera-PPG). Haptik: **zayıf**. CES: **hayır** | Goessl 2017 meta-analizi (24 çalışma, n=484): HRV-BF stres/anksiyete g=0,83 [29]. Muse için tek randomize veri n=21 tez, biofeedback etkisi yok [30]. HeartMath için bağımsız RCT bulunamadı [30]. Kamera-PPG ile HRV-BF uygulaması **zaten var** (HRV4Biofeedback — doğrulanmadı). |
| Mide ekşimesi (GÖRH) | Diyafragma nefes eğitimi (insentif spirometre, fizyoterapist), LINX (cerrahi) | Solunum eğitimi: kurral diyafragmanın alt özofagus sfinkterini desteklemesi | **Birebir** (ekranla koçluk; karın üstüne konan telefonun IMU'su karın vs göğüs solunumunu ayırır — Landreani 2017, karın yerleşiminde hata <%2 [31]) | Niu 2024 RCT (n=60, reflü-öksürük): derin diyafragma nefesi + ilaç etkili [32]. NCT04120025 (n=192) sonuç yayımlanmamış [32]. Uygulama RCT'si (Fooyin, NCT07744815) tamamlandı, sonuç yok [32]. |
| Kabızlık | Vibrant kapsül, anorektal biofeedback | Mekanik/biofeedback | **Hayır** | Gastroenteroloji raporunda. |
| D vitamini eksikliği | UV-B lambası, güneş maruziyeti | UV-B ile deride sentez | **Hayır** (flaş UV içermez) | Telefon yalnızca "güneşe çık" zamanlaması ve ortam ışığıyla maruziyet tahmini yapabilir; D vitamini üretimi iddia edilemez. |
| Boyun/bel ağrısı — duruş | Duruş sensörü (Upright Go) | Haptik hatırlatma + motor öğrenme | **Zayıf** (telefon vücuda sabit değil; ön kamera ile masa başında baş-boyun açısı izlenebilir) | FTR raporunda. |

**Mevcut uygulamalar (kontrol listesi):** Smoke Free (UCL, RCT [13]), Quit Sense (UEA, araştırma [14]), Smart-T (araştırma, iCO ile), QuitNow, Drink Less [17], Try Dry (Alcohol Change UK; %70 azalma iddiası doğrulanmadı), Noom [18], Omada [19], WW, Breathe2Relax (DoD; kendi RCT'si yok, karşılaştırma kolu olarak kullanılıyor [33]), Calm/Headspace, HeartMath Inner Balance (sensör şart), Welltory (kamera HRV; 26 bisikletçide ECG ile r=0,77–0,94 [34]), HRV4Biofeedback (kamera HRV biofeedback — doğrulanmadı), KardiaMobile (tek derivasyon EKG donanımı, FDA 510(k) [35]), Tension Tamer (MUSC, araştırma [8,9]), StandingTall [26], Nymbl, Medisafe, MyTherapy, Sleepio, Somryst, Lux Therapy (ortam ışığı; kanıt yok [25]), Lifelight/Binah.ai (kamera tansiyon; ESH doğrulaması yok [2,3]). Türkiye: Sağlık Bakanlığı **ALO 171** hattı (2025'te 420.651 görüşme), MHRS üzerinden sigara bırakma poliklinikleri, havanikoru.saglik.gov.tr; ulusal bir sigara bırakma **uygulaması** bulunamadı [36].

## 2. Proje fikirleri (telefon tek başına)

### Fikir 1: DuvarKoçu — Kamera ve IMU ile denetlenen izometrik duvar çömelmesi programı (hipertansiyon)
- **Hedef hastalık ve hasta sayısı:** Hipertansiyon. Dünya: 1,28 milyar erişkin (WHO, 30–79 yaş) [37]. Türkiye: ulusal anketlerde ~%30 (PatenT2 2012 %30,3 — doğrulanmadı) ≈ 15–18 milyon erişkin [38]. Birincil hedef: evre 1 HT ve yüksek-normal tansiyon (ilaç başlamadan önce yaşam tarzı aşaması) + ilaçla tam kontrol edilemeyenler.
- **Taklit edilen cihaz ve mekanizma:** Zona Plus tipi izometrik el kavrama cihazı (süre/kuvvet denetimli izometrik egzersiz) ve klinik duvar çömelmesi protokolü (4 × 2 dk, 2 dk dinlenme, haftada 3 gün, 8–12 hafta). Mekanizma: izometrik kasılma → endotel işlevi, otonomik modülasyon → istirahat tansiyonu ↓. Cihaz burada yalnızca **doz denetimi** yapar; telefon aynı işi görür.
- **Telefonda nasıl çalışır:** (1) Arka kamera + cihaz-içi poz tahmini (MediaPipe/ML Kit) ile diz açısını (hedef 95°–135°, kişiye göre RPE'ye ayarlı) ve duvara sırt temasını denetler; (2) alternatif olarak telefon cebe/bel bandına konur, IMU ile uyluk açısı ve sabitlik ölçülür; (3) hoparlör/haptik ile 2 dk sayaç, "nefesini tutma" uyarısı (Valsalva önleme); (4) kamera-PPG ile seans öncesi/sonrası nabız ve 1 dk'lık RMSSD (toparlanma ölçütü); (5) haftalık manşetli ev tansiyonu **elle girilir** (kamera-tansiyon kullanılmaz); 4 haftalık ortalama düşmüyorsa doz artırılır, hasta aile hekimine yönlendirilir. Süre: haftada 3 × ~14 dk, 12 hafta, sonra idame.
- **Kanıt:** Cihaz/protokol için: Edwards 2023 BJSM ağ meta-analizi, 270 RCT, izometrik egzersiz SBP −8,24 / DBP −4,00 mmHg; duvar çömelmesi en etkili [10]. Telefon tabanlı versiyon: **yok** (aramada duvar çömelmesini kamera/IMU ile denetleyen RCT bulunamadı).
- **Mevcut uygulamalar:** Genel egzersiz uygulamalarında "wall sit" zamanlayıcı var; hipertansiyon endikasyonlu, doz-titrasyonlu, açı denetimli, tansiyon kapalı döngülü bir ürün bulunamadı. Zona Plus donanımdır. Fark: ek donanımsız doz denetimi + aile hekimliğine entegre titrasyon.
- **Teknik zorluklar ve çözüm:** Poz tahmini yan profil ister → ekran yönlendirmesi ve otomatik kadraj; düşük ışıkta IMU moduna geçiş. Diz ağrısı/yanlış form → ilk 2 hafta 30 sn'lik kademeli protokol. Tansiyon verisi elle girişte hata → fotoğraftan OCR ile cihaz ekranı okuma (yardımcı, zorunlu değil).
- **Regülasyon:** "Hipertansiyonda tansiyonu düşürür" iddiasıyla SaMD; FDA Sınıf II (RESPeRATE emsali), CE-MDR Kural 11 Sınıf IIa, TİTCK MDR'ı izler. Klinik çalışma gerekir (sham-egzersiz veya bekleme listesi kontrollü, 12 hafta, ev tansiyonu birincil sonlanım).
- **Riskler / kontrendikasyonlar:** İzometrik egzersiz sırasında geçici tansiyon artışı → kontrolsüz HT (>160/100), yakın MI, anevrizma, ileri diz OA, gebelik dışlanır; Valsalva uyarısı; semptom (göğüs ağrısı, baş dönmesi) → durdur ve 112 bilgisi.
- **Puanlama:** Teknik 8 | Kanıt 7 | Etki 9 | Yenilik 7 | Düşük risk 7 | **TOPLAM 38/50**

### Fikir 2: NefesRezonans-HT — Kamera-PPG ve IMU ile kapalı döngü rezonans solunum eğitimi (hipertansiyon + stres)
- **Hedef hastalık ve hasta sayısı:** Hipertansiyon (1,28 milyar [37]; Türkiye ~15–18 milyon [38]) ve yaygın stres/anksiyete (anksiyete bozuklukları dünyada ~301 milyon, WHO 2019 — doğrulanmadı).
- **Taklit edilen cihaz ve mekanizma:** RESPeRATE (göğüs kayışıyla nefes algılayıp müzikle 10 nefes/dk altına yavaşlatır) + HRV biofeedback cihazları (emWave/Inner Balance: parmak/kulak PPG ile rezonans frekansı ≈6 nefes/dk eğitimi). Mekanizma: solunum eğitimi + biofeedback → baroreflex kazancı ↑, sempatik tonus ↓.
- **Telefonda nasıl çalışır:** (1) İlk hafta "rezonans frekansı tarama": 4,5–6,5 nefes/dk'da 2'şer dk, parmak arka kamerada; en yüksek düşük-frekans HRV genliği veren hız seçilir (kamera-PPG RMSSD/LF için ≥2 dk kayıt yeterli [5]); (2) günlük 2 × 10 dk seans: ekran daire animasyonu + titreşim motoru ritmi (göz kapalı kullanım için haptik inhalasyon/ekshalasyon) + hoparlör tonu; (3) telefon sırtüstü yatarken karın üstüne konursa IMU nefes hızını kayışsız ölçer (karın yerleşiminde hata <%2 [31]) ve hedefe göre ritmi **gerçek zamanlı yavaşlatır** (RESPeRATE'in kapalı döngüsü); (4) seans sonunda 1 dk kamera-PPG ile RMSSD gösterilir (biofeedback); (5) haftalık manşetli tansiyon elle girilir, 8 hafta.
- **Kanıt:** Cihaz için: Mahtani 2012 (8 RCT, n=494) çelişkili, rutin önerilmez [7]; Nakao 2003 biofeedback sham'a karşı anlamsız [11]; HRV-BF stres/anksiyete g=0,83 [29]. Telefon versiyonu: Tension Tamer (kamera-PPG'li nefes meditasyonu) 6 aylık pilotta SBP düşüşü ve doz-yanıt [8], evre-1 HT alt grubunda 3. ayda −8,0 vs −1,9 mmHg (n=30) [9]; 12 aylık tam RCT (NCT03168789, n=80) tamamlandı, sonuç yayını bulunamadı. Kamera-PPG ile HRV-BF'nin hipertansiyonda RCT'si **yok**.
- **Mevcut uygulamalar:** Breathe2Relax, Calm, Apple "Breathe" (açık döngü, nefes algılamaz); HRV4Biofeedback (kamera HRV-BF, stres amaçlı — doğrulanmadı); Welltory (ölçer, eğitmez); RESPeRATE donanım. Fark: kayışsız kapalı döngü (IMU nefes algılama) + kişiye özel rezonans frekansı + hipertansiyon endikasyonu ve tansiyon titrasyon döngüsü.
- **Teknik zorluklar ve çözüm:** Parmak PPG sürekli olamaz → yalnızca seans başı/sonu ölçüm; IMU karın sinyali kalın giyside zayıf → doğrudan tişört üstü; gürültülü ortam → haptik ritim; cilt tonu/soğuk parmak → sinyal kalitesi göstergesi ve yeniden deneme.
- **Regülasyon:** Stres/gevşeme iddiasıyla genel sağlık ürünü (SaMD dışı); "tansiyonu düşürür" iddiasıyla FDA Sınıf II / CE Sınıf IIa, klinik çalışma şart.
- **Riskler:** Düşük. Hiperventilasyon/baş dönmesi (derin nefes), panik bozuklukta içsel duyum hassasiyeti; ciddi aritmi varsa HRV yorumu geçersiz.
- **Puanlama:** Teknik 9 | Kanıt 6 | Etki 8 | Yenilik 6 | Düşük risk 9 | **TOPLAM 38/50**

### Fikir 3: Nöbetçi — Sensör-bağlamlı sigara bırakma JITAI'si (tam zamanında uyarlanabilir müdahale)
- **Hedef hastalık ve hasta sayısı:** Tütün bağımlılığı. Dünya: ~1,3 milyar tütün kullanıcısı (WHO, 2020 verisi) [39]. Türkiye: 15+ yaşta her gün tütün kullananlar %30,1 (TÜİK 2025) ≈ 19–20 milyon kişi [40].
- **Taklit edilen cihaz ve mekanizma:** iCO Smokerlyzer'ın biyokimyasal geri bildirim mekanizması **üretilemez** (CO sensörü yok). Taklit edilen asıl şey, araştırma düzeyindeki sensörlü JITAI'ler (Sense2Stop: göğüs/bilek sensörüyle stres algılayıp müdahale [41]; Quit Sense: konum-tetikli [14]). Mekanizma: davranışsal terapi + yüksek riskli anda uyarı (lapse önleme) + istek dalgasını geçirme becerisi.
- **Telefonda nasıl çalışır:** (1) İlk 3 gün "sigara haritası": her sigarada tek dokunuş; GPS/Wi-Fi/saat/ hareket durumu (IMU: yürüyüş, araç, masa) ve telefon kullanım ritmi ile kişisel risk modeli; (2) bırakma gününden sonra risk ≥ eşik olunca (örn. iş çıkışı + kafe yakını + 2 saat sigarasız) 30 sn'lik bildirim: "4 dk'lık istek dalgası" — ekran+haptik ritimli yavaş nefes, 60 sn oyun (dikkat dağıtma), kişisel sebep kartı; (3) istek anında isteğe bağlı 60 sn kamera-PPG: nabız yüksekse "stres kaynaklı" protokol (nefes), değilse "alışkanlık" protokolü (ortam değiştir); (4) NRT/vareniklin ilaç saati hatırlatıcı (ilaç telefonla verilemez, uyum artırılır); (5) ALO 171 ve MHRS poliklinik entegrasyonu. Süre: 4 hafta yoğun, 12 hafta idame.
- **Kanıt:** Cihaz tarafı: COach2Quit (iCO + uygulama, n=102) fark yok [12]. Telefon/JITAI tarafı: Quit Sense fizibilite RCT (n=209) 6 ayda tükürükle doğrulanmış bırakma ~4 kat (küçük örneklem, fizibilite) [14]; Smoke Free pragmatik RCT (n=3.143) ITT'de fark yok, indirenlerde RR 1,80 [13]; Sense2Stop mikro-randomize çalışma sonuç yayını bulunamadı [41]. Uygulamayla bırakma için Cochrane düzeyinde kanıt genel olarak orta-düşük (doğrulanmadı).
- **Mevcut uygulamalar:** Smoke Free (zaman/konum bağlamı yok), QuitNow, Kwit; Quit Sense (yalnızca konum, araştırma sürümü, mağazada değil — doğrulanmadı); Smart-T (araştırma, EMA anket tabanlı). Fark: GPS + IMU + telefon kullanım ritmi + kamera-PPG ile çok sensörlü risk modeli, Türkçe ve ALO 171/MHRS'ye bağlı. Yenilik orta: kavram var, telefon-tek ürün yok.
- **Teknik zorluklar ve çözüm:** Pil (sürekli GPS) → geofence + önemli konum API'leri; yanlış pozitif bildirim yorgunluğu → mikro-randomize öğrenme ile kişi başı eşik; CO doğrulaması yok → birincil sonlanım öz-bildirim + isteğe bağlı poliklinik CO ölçümü.
- **Regülasyon:** Davranışsal sigara bırakma desteği çoğu yetkide düşük risk (FDA'da "genel sağlık"/Sınıf I; CE-MDR'da Kural 11 Sınıf I–IIa tartışmalı). Etkinlik iddiası için RCT önerilir, zorunlu değil.
- **Riskler:** Düşük; konum verisi gizliliği (cihaz-içi işleme, sunucuya gönderme yok); bildirim yorgunluğu.
- **Puanlama:** Teknik 8 | Kanıt 6 | Etki 9 | Yenilik 5 | Düşük risk 9 | **TOPLAM 37/50**

### Fikir 4: KarınNefesi-Reflü — IMU ile doğrulanan diyafragma nefes eğitimi (GÖRH)
- **Hedef hastalık ve hasta sayısı:** Gastroözofageal reflü hastalığı (mide ekşimesi). Dünya: erişkinlerin ~%13–20'si (doğrulanmadı). Türkiye: ~%20 (Bor 2005 — doğrulanmadı) ≈ 10+ milyon. Hedef: PPİ (mide asidi ilacı) azaltmak isteyen hafif-orta GÖRH ve reflü-öksürük.
- **Taklit edilen cihaz ve mekanizma:** Fizyoterapist eşliğinde/insentif spirometreyle diyafragma nefes eğitimi. Mekanizma: solunum eğitimi — kurral diyafragma tonusu ↑ → alt özofagus sfinkteri desteği, geçici gevşeme sıklığı ↓.
- **Telefonda nasıl çalışır:** Hasta sırtüstü yatar, telefonu göbeğin üstüne koyar; IMU z-ekseni karın hareketini, ön kamera (isteğe bağlı) göğüs kafesini izler. Hedef: karın genliği ↑, göğüs genliği ↓ (karın/göğüs oranı). Haptik ile nefes alma süresi uzatılır, hoparlörle "karnı şişir" geri bildirimi. Günde 2 × 10 dk, 4 hafta, sonra yemek sonrası 5 dk idame. Semptom günlüğü (GERD-Q) ve PPİ kullanımı izlenir; 4 haftada yanıt yoksa aile hekimine yönlendirir.
- **Kanıt:** Cihaz/protokol için: Niu 2024 RCT (n=60, reflü-öksürük): ilaç + derin diyafragma nefesi etkili [32]; Eherer 2012 (Am J Gastroenterol, n=19, PPİ kullanımı azaldı) — bu oturumda **doğrulanmadı**; NCT04120025 (n=192) sonuç yayımlanmamış [32]. Telefon versiyonu: Fooyin Üniv. uygulama RCT'si (NCT07744815) tamamlandı, sonuç yok [32]; IMU ile karın solunumu ölçümü teknik olarak doğrulanmış (hata <%2 [31]).
- **Mevcut uygulamalar:** Genel nefes uygulamaları (açık döngü); reflü endikasyonlu, karın hareketini IMU ile doğrulayan uygulama bulunamadı.
- **Teknik zorluklar ve çözüm:** Telefon kayması → kaymaz kılıf önerisi ve sinyal kalitesi uyarısı; obezitede karın sinyali farklı → kişisel kalibrasyon; oturarak egzersiz için ön kamera modu.
- **Regülasyon:** Semptom yönetimi iddiasıyla CE-MDR Sınıf I/IIa; FDA genel sağlık sınırında. Küçük RCT yeterli.
- **Riskler:** Çok düşük. Alarm semptomları (disfaji, kilo kaybı, kanama) olan hasta uygulamaya alınmaz, hekime yönlendirilir.
- **Puanlama:** Teknik 9 | Kanıt 5 | Etki 6 | Yenilik 8 | Düşük risk 10 | **TOPLAM 38/50**

### Fikir 5: OturmaKırıcı-HT — IMU ile oturma algılayan "egzersiz atıştırmalığı" döngüsü (hareketsizlik + tansiyon)
- **Hedef hastalık ve hasta sayısı:** Fiziksel hareketsizlik. Türkiye: 15+ yaşta spor/egzersiz yapmayanlar %86,6 (TÜİK 2025) [40]. Dünya: erişkinlerin ~%31'i yetersiz aktif (WHO 2024 — doğrulanmadı). Eş hedef: hipertansiyon ve prediyabet.
- **Taklit edilen cihaz ve mekanizma:** Akıllı saat "ayağa kalk" uyarısı ve masa başı hatırlatıcı cihazlar; pedometre. Mekanizma: davranışsal uyarı + kısa egzersizin akut glisemi/tansiyon etkisi.
- **Telefonda nasıl çalışır:** Telefon cepte/masada; IMU + ekran-açık durumu ile 60 dk kesintisiz oturma algılanır → 1 dk'lık "atıştırmalık" (merdiven, 20 çömelme, 1 dk yürüme) haptik/sesle yönlendirilir; IMU tekrar sayar; günlük adım hedefi kişiye göre +500/hafta artırılır (Laranjo: +1.850 adım/gün [21]). Hipertansif kullanıcıda haftalık manşet tansiyonu elle girilir.
- **Kanıt:** Rise & Recharge (yarı-randomize, n≈56): 60 dk'lık uyarı → günde ~70 dk daha az oturma, kardiyometabolik değişim yok [23]; Wits RCT (n=20) oturma ↓ [23]; SMART-STEP (n=136) sonuç bulunamadı. Egzersiz atıştırmalığı için tansiyon RCT'si **yok** (doğrulanmadı).
- **Mevcut uygulamalar:** Google Fit/Apple Health (adım), Stand Up!, akıllı saat uyarıları (saat = ek donanım). Telefon-tek IMU ile oturma algılayıp egzersiz sayan ve tansiyon/prediyabet endikasyonu taşıyan ürün bulunamadı; ancak kavram sıradan.
- **Teknik zorluklar:** Telefon masada iken oturma/ayakta ayrımı belirsiz → ekran etkileşimi + Wi-Fi/konum sabitliği ile birleşik model; yanlış uyarılar.
- **Regülasyon:** Genel sağlık; SaMD değil.
- **Riskler:** Düşük; düşme riski olan yaşlıda merdiven önerisi kapatılır.
- **Puanlama:** Teknik 8 | Kanıt 5 | Etki 7 | Yenilik 4 | Düşük risk 10 | **TOPLAM 34/50**

### Fikir 6: SabahIşığı — Ortam ışığı sensörü ve GPS ile "ışık dozu" koçluğu (kış depresyonu, uyku fazı)
- **Hedef hastalık ve hasta sayısı:** Mevsimsel duygudurum bozukluğu ve alt-eşik kış depresyonu (enlemle değişir; Türkiye için güvenilir rakam bulunamadı).
- **Taklit edilen cihaz:** 10.000 lux ışık kutusu. **Telefon bunu üretemez** (ekran 15 cm'de ~400 lux — hesap, doğrulanmadı; eşik ≥1.000 lux × 30 dk [24]). Üretilen mekanizma: davranışsal — sabah gün ışığına çıkma (açık havada bulutlu gün bile 1.000–10.000 lux, doğrulanmadı) zamanlaması ve dozu.
- **Telefonda nasıl çalışır:** Ortam ışığı sensörü (mutlak lux için güvenilmez [25]; "iç/dış mekân" sınıflaması için yeterli) + GPS (açık hava) ile sabah 30 dk'lık dış ışık süresi takip edilir; uyanma saatine göre kişisel "ışık penceresi" ve haptik hatırlatma; akşam ekran sıcaklığını otomatik düşürme. 6 hafta.
- **Kanıt:** Işık tedavisi için kanıt iyi [24]; "telefonla dış ışık koçluğu" için RCT **yok**.
- **Mevcut uygulamalar:** Lux Therapy (ölçer, D vitamini tahmini, kanıt yok [25]); Rise/Timeshifter (uyku). Fark: ışık dozu kapalı döngüsü ve SAD endikasyonu.
- **Teknik zorluklar:** Sensör cepte kapalı → yalnızca telefon dışarıdayken ölçüm, GPS/hava durumu ile tamamlama; kalibrasyon farkı → cihaz-özel eğri.
- **Regülasyon:** Genel sağlık; depresyon iddiasıyla SaMD.
- **Riskler:** Bipolar bozuklukta sabah ışığı ile hipomani (ışık kutusunda bilinen risk; dış ışık için düşük).
- **Puanlama:** Teknik 7 | Kanıt 4 | Etki 5 | Yenilik 7 | Düşük risk 9 | **TOPLAM 32/50**

### Fikir 7: AdımKoru — Alkolde yürüyüş-temelli zarar azaltma uyarısı (riskli içicilik)
- **Hedef:** Riskli içicilik / alkol kullanım bozukluğu (dünyada ~400 milyon, WHO 2024 — doğrulanmadı; Türkiye'de düşük prevalans).
- **Taklit edilen cihaz:** Soberlink/BACtrack alkolmetre + koşullu ödül. **CM'nin çekirdeği (biyokimyasal doğrulama) üretilemez.** Üretilen: IMU yürüyüş sapmasıyla sarhoşluk tahmini (Suffoletto 2020, n=17, laboratuvar, %92,5 [15]) → araç kullanma uyarısı, güvenli dönüş, ertesi sabah kısa müdahale (Drink Less tipi [17]).
- **Kanıt:** Algılama ön-çalışma düzeyinde, gerçek dünya doğrulaması yok; müdahale kısmı Drink Less'te küçük etki [17].
- **Mevcut uygulamalar:** Drink Less, Try Dry (sensörsüz). Fark: pasif IMU tetiği.
- **Zorluklar:** Telefon cepte sabit değil, yanlış pozitif; etik (dolaylı sarhoşluk tespiti).
- **Regülasyon:** Genel sağlık. **Riskler:** Yanlış güvence ("telefon uyarmadı, sürebilirim") — tersine zarar riski yüksek.
- **Puanlama:** Teknik 5 | Kanıt 3 | Etki 5 | Yenilik 7 | Düşük risk 5 | **TOPLAM 25/50**

## 3. Alanın en iyi 3 fikri (sıralı) ve gerekçe

1. **Fikir 1 — DuvarKoçu (38/50):** En güçlü cihaz-dışı kanıt (270 RCT, −8/−4 mmHg [10]) ve en büyük hasta kitlesi; telefon egzersizi "üretmez", dozu denetler — bu tam telefonun iyi yaptığı iştir. Ticari eşdeğer yok. Risk yönetimi (tansiyon >160/100 dışlama, Valsalva uyarısı) ürün tasarımına gömülmeli.
2. **Fikir 2 — NefesRezonans-HT (38/50):** Teknik olarak en olgun (kamera-PPG HRV doğrulanmış [5], IMU nefes algılama doğrulanmış [31]); RESPeRATE'in kapalı döngüsünü kayışsız kurar. Kanıt zayıf noktası: cihaz-rehberli solunumun kendi kanıtı çelişkili [7]; bu yüzden Fikir 1 ile **tek üründe birleştirilmesi** önerilir (egzersiz + solunum + ev tansiyonu titrasyonu = "aile hekimliği hipertansiyon paketi").
3. **Fikir 4 — KarınNefesi-Reflü (38/50):** Etki puanı daha düşük ama yenilik ve güvenlik en yüksek; IMU ile karın solunumu doğrulaması gerçek bir teknik fark yaratır; PPİ azaltma hedefi birinci basamakta somut bir klinik değer.

(Fikir 3 Nöbetçi 37/50 ile hemen arkada; Türkiye'de ulusal bir sigara uygulaması olmaması ve ALO 171 altyapısı nedeniyle **halk sağlığı ölçeğinde** en hızlı yayılabilecek fikir budur, ancak yenilik puanı Quit Sense/Smoke Free nedeniyle düşük.)

## 4. "Yapılamaz" diye elenenler (bir satır gerekçe)
- **Kamera-PPG ile tansiyon ölçüp ilaç titre etmek:** Hata ~9–10 mmHg, AAMI/ESH standartlarını karşılayan çalışma yok [1–3]; tedavi kararı bu ölçüme dayandırılamaz.
- **Telefonla CO (karbonmonoksit) ölçümü / iCO taklidi:** Elektrokimyasal sensör gerekir; telefonda yok.
- **Telefonla alkolmetre / koşullu ödül programı:** BAC ölçümü yok; yürüyüş tahmini doğrulama yerine geçmez [15].
- **Ekranla ışık tedavisi (SAD):** ~100–400 lux (hesap), eşik ≥1.000 lux, standart 10.000 lux [24]; fizik olarak yetersiz.
- **D vitamini için flaş/ekran UV-B:** Telefon UV yaymaz.
- **Akıllı tartı taklidi:** Telefon kilo ölçemez; kilo elle girilir (davranışsal programlar zaten var: Noom/Omada [18,19]).
- **EEG nörofeedback (Muse taklidi):** Telefonun EEG elektrodu yok; Muse'un kendi kanıtı da zayıf [30].
- **Alpha-Stim CES, TENS, Cefaly:** Elektrik akımı; telefon üretemez.
- **Akıllı hap kutusu taklidi (hatırlatıcı uygulama):** Zaten var (Medisafe, MyTherapy); RCT'lerde donanımlı versiyon bile etkisiz [27].
- **Dijital DPP / kilo programı / CBT-I / adım sayar / düşme önleme egzersizi:** Zaten var (Omada, Noom, Sleepio/Somryst, Google Fit, StandingTall/Nymbl).

## 5. Kaynaklar (URL)
1. arXiv 2401.11117 — Smartphone PPG waveform cuffless BP, hata ~9–10 mmHg: https://arxiv.org/pdf/2401.11117v2
2. Health Technology Wales TER540 Lifelight (2024): https://healthtechnology.wales/wp-content/uploads/TER540-Lifelight.pdf
3. arXiv 2503.00890 — Kamera ile BP, ESH doğrulama eksikliği: https://arxiv.org/pdf/2503.00890
4. AlwaysBP, JMIR mHealth 2023: https://mhealth.jmir.org/2023/1/e44147/PDF
5. Kamera-PPG HRV ECG doğrulaması (ICC>0,90): https://research.vu.nl/en/publications/validation-of-photoplethysmography-using-a-mobile-phone-applicati/ ; https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5832098/
6. TASMINH4 (NIHR özeti): https://evidence.nihr.ac.uk/alert/self-monitoring-improves-control-of-high-blood-pressure-compared-with-gp-monitoring-alone/
7. Mahtani 2012 device-guided breathing meta-analizi: https://ora.ox.ac.uk/objects/uuid:0952a574-7489-4906-84a3-f433032f14f6 ; Mayo Clinic RESPeRATE: https://mayoclinic.org/diseases-conditions/high-blood-pressure/expert-answers/resperate/faq-20057998
8. Tension Tamer doz-yanıt fizibilite: https://scholarworks.iupui.edu/handle/1805/21542
9. Tension Tamer 12 ay, evre-1 HT alt analizi (PMC7143262): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7143262/ ; NCT03168789: https://clinicaltrials.gov/study/NCT03168789
10. İzometrik egzersiz ve tansiyon (Edwards 2023 BJSM ikincil kaynak + 2022 J Hypertens): https://training-conditioning.com/news/isometric-exercises-blood-pressure-study/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC10085809
11. Nakao 2003 biofeedback-HT meta-analizi: https://www.jstage.jst.go.jp/article/hypres/26/1/26_1_37/_article ; Jenkins 2024: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11458477/
12. COach2Quit iCO pilot RCT (NTR 2019): https://academic.oup.com/ntr/article/21/11/1573/5086248
13. Smoke Free pragmatik RCT (Jackson 2024, JMIR): https://jmir.org/2024/1/e50963 ; Crane 2019: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6347038/
14. Quit Sense (ISRCTN12326962; UEA): https://www.isrctn.com/ISRCTN12326962 ; https://www.uea.ac.uk/news/-/article/how-ai-and-a-mobile-phone-app-could-help-you-quit-smoking
15. Suffoletto 2020 yürüyüş-alkol: https://www.federvini.it/images/jsad.2020.81.505.pdf
16. Soberlink CM RCT (n=40): https://vtechworks.lib.vt.edu/items/5924d56a-4751-41c1-a731-a13e14930e79 ; BACtrack pilot: https://scholar.usuhs.edu/en/publications/pilot-study-of-an-integrated-smartphone-and-breathalyzer-continge/fingerprints/
17. Drink Less RCT (UCL haberi, eClinicalMedicine 2024): https://www.ucl.ac.uk/news/2024/mar/app-can-help-people-reduce-their-alcohol-intake
18. Noom RCT (n=427): https://www.noom.com/research/publications/ ; protokol: https://researchprotocols.org/2022/8/e37541/PDF
19. Omada PREDICTS RCT: https://www.omadahealth.com/resource-center/omada-digital-diabetes-prevention-program-shows-sustained-hba1c-reduction-and-weight-loss-in-randomized-control-trial
20. TURDEP-II: https://pmc.ncbi.nlm.nih.gov/articles/PMC3604592
21. Laranjo 2021 BJSM: https://bjsm.bmj.com/content/55/8/422
22. Paluch 2022 Lancet Public Health: https://discovery.ucl.ac.uk/id/eprint/10170017/1/1-s2.0-S2468266721003029-main.pdf
23. Rise & Recharge: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7764765/ ; Wits tezi: https://wiredspace.wits.ac.za/items/07d1ae40-426d-4a36-ad73-66e284a40647
24. BROAD ışık çalışması (medRxiv) ve ışık tedavisi derlemesi: https://www.medrxiv.org/content/10.1101/2021.10.29.21265530v2 ; https://evidencebasedliving.human.cornell.edu/blog/does-light-therapy-work-for-seasonal-depression
25. Telefon ışık sensörü güvenilirliği: https://www.daaam.info/Downloads/Pdfs/science_books_pdfs/2022/Sc_Book_2022-003.pdf ; Lux Therapy: https://apps.apple.com/us/app/id6747880435
26. StandingTall BMJ 2021: https://www.bmj.com/content/373/bmj.n740
27. Akıllı şişe RCT (Penn) ve REMIND: https://www.fiercehealthcare.com/mobile/smart-pill-bottles-didn-t-improve-adherence-for-heart-attack-patients-but-researchers-say ; https://pmc.ncbi.nlm.nih.gov/articles/PMC5470369
28. Armitage 2020 BMJ Open: https://bmjopen.bmj.com/content/10/1/e032045
29. Goessl 2017 Psychol Med: https://www.cambridge.org/core/journals/psychological-medicine/article/effect-of-heart-rate-variability-biofeedback-training-on-stress-and-anxiety-a-metaanalysis/A839E9C968E54774DF5C8FB186764EF0
30. Muse tez (n=21): https://ir.lib.uwo.ca/psych_uht/85 ; Muse NCT05972486: https://cdn.clinicaltrials.gov/large-docs/86/NCT05972486/Prot_SAP_000.pdf
31. Landreani 2017 telefon IMU solunum: https://re.public.polimi.it/bitstream/11311/1045105/1/137-402_Landreani.pdf ; Cinotti 2025 Sensors: https://doaj.org/article/69a76d01586247d79ffaa80b19bcc6d9
32. Niu 2024 diyafragma nefesi RCT: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11027235/ ; NCT04120025: https://clinicaltrials.gov/study/NCT04120025 ; NCT07744815: https://trial.medpath.com/zh/clinical-trial/b94fe4fd61239959/nct07744815-mobile-app-gastroesophageal-reflux-disease-symptom-recurrence
33. Breathe2Relax karşılaştırma kolu (NCT05305235): https://cdn.clinicaltrials.gov/large-docs/35/NCT05305235/Prot_SAP_000.pdf
34. Welltory bisikletçi doğrulaması: https://produccioncientifica.ugr.es/documentos/620b673f99a2203d59cd2975 ; https://help.welltory.com/articles/4412277
35. KardiaMobile FDA: https://fdanews.com/articles/print/206470-fda-clears-alivecors-credit-card-sized-personal-ecg
36. Türkiye ALO 171 ve poliklinikler: https://www.dha.com.tr/politika/bakan-memisoglu-arzumuz-sigarasiz-bir-turkiyeye-ulasmak-2744707 ; https://www.turkgun.com/saglik/sigara-birakmada-yeni-donem-timler-ve-mobil-poliklinikler-81-ilde-sahada/321015
37. WHO hipertansiyon 1,28 milyar: https://www.who.int/data/gho/data/themes/topics/noncommunicable-diseases-risk-factors ; https://nutritioninsight.com/news/over-700-million-people-living-with-untreated-hypertension-says-who.html
38. Türkiye hipertansiyon ~%30 (DAHUDER 2025): https://avesis.istanbul.edu.tr/yayin/ac6941f5-699f-4bb6-8fab-77c4e424c3ce/hidden-burden-of-hypertension-in-turkiye-a-multi-center-dahuder-world-hypertension-day-study-reveals-gaps-in-awareness-adherence-and-control
39. WHO tütün 1,3 milyar (2020): https://www.downtoearth.org.in/news/health/number-of-tobacco-users-continues-to-decrease-globally-who-80235
40. TÜİK Sağlık Araştırması 2025 (obezite %21,8; günlük tütün %30,1; hareketsizlik %86,6): https://www.benguturk.com/saglik/tuik-acikladi-turkiyede-obezite-ve-sigara-kullanimi-alarm-veriyor-270605h ; https://www.ekonomist.com.tr/saglik/turkiye-nin-saglik-karnesi-belli-oldu-obezite-yukseldi-fiziksel-aktivite-dusuk-kaldi-74988
41. Sense2Stop protokolü (PMC8556307): https://pmc.ncbi.nlm.nih.gov/articles/PMC8556307
