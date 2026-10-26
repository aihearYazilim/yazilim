# Psikiyatri — Aile hekimi için telefonla tanı/triyaj fikirleri

> Hazırlayan: psikiyatri araştırma ajanı. Tarih: 2026-10-26.
> Yöntem notu: Web arama kotası ilk 8 sorgudan sonra doldu; kalan doğrulamalar Europe PMC REST API ve doğrudan makale erişimiyle (WebFetch) yapıldı.
> Doğrulanamayan rakamlar **[doğrulanmadı]** olarak işaretlendi. PubMed/PMC sayfaları captcha nedeniyle açılamadı; özetler Europe PMC'den alındı.

## 0. Genel yargı (özet)

Psikiyatri, "anketin zaten iyi çalıştığı" bir alan: PHQ-9, GAD-7, EPDS, MDQ, AUDIT, SCOFF, 4AT, C-SSRS/ASQ aile hekiminin elinde ve çoğu 2–3 dakikada biter. Telefon sensörünün **gerçekten** katkı sağlayabileceği yerler, anketin uygulanamadığı ya da güvenilmediği üç durum:

1. **Hastanın soruya cevap veremediği durum** → yaşlıda deliryum (dikkat testi ekranda/hoparlörle). Kanıt en güçlü burası.
2. **Hastanın soruyu yanlı cevapladığı/okuyamadığı durum** → depresyon ve postpartum depresyonda ses biyobelirteci (ikinci kat, PHQ-9/EPDS'nin yerine değil).
3. **Çocuk/erişkinde davranış gözlemi gereken durum** → DEHB için kısa dokunmatik sürekli performans testi + ön kamera/IMU hareketlilik.

Bipolar ayrımı, intihar riski, yeme bozukluğu, somatizasyon, anksiyete ve psikoz erken belirtilerinde ise sensörün 10 dakikalık muayenede anketin/klinik görüşmenin ötesine geçtiğine dair kanıt yok ya da zayıf; bunları "sensör değer katmıyor" diye açıkça yazdım.

---

## 1. Aile hekiminin bu alanda en sık karşılaştığı tanı/sevk kararları (envanter)

| Durum | ASM'de sıklık (kaynaklı, kaba) | Bugün nasıl karar veriyor | Yaygın hata/eksik | Telefon sensörü ne katabilir | Mevcut ürün/araştırma |
|---|---|---|---|---|---|
| Depresyon / anksiyete taraması | Türkiye WMH 2026 (CIDI-5, n=1790): 12 aylık herhangi bir bozukluk %23,9; anksiyete %17,2; duygudurum %12,4; tedavi alan yalnızca %20,9 [Türkiye WMH, 2026] | PHQ-9 / GAD-7, klinik görüşme | Yaşlı/okuryazar olmayan/inkâr eden hastada atlanma; somatik yakınma arkasında gizlenme | Mikrofon: 60 sn serbest konuşmadan ses biyobelirteci (PHQ-9'a ikinci kat); ön kamera: yüz ifadesi/psikomotor yavaşlama (kanıt zayıf) | Kintsugi Voice (ABD, FDA başvurusu süreçte; sens %71/spec %74), Ellipsis Health (AUC 0,79–0,83), Sonde Health; Türkçe ürün yok |
| İntihar riski | Depresif hastanın önemli bölümü; ASM'de doğrudan sorulmuyor | Doğrudan soru, C-SSRS/ASQ | Sorulmaması; yanlış güvence | Ses: küçük örneklem AUC 0,79–0,81 — **sensör değer katmıyor**, risk kabul edilemez | Araştırma düzeyi (JMIR Form Res 2026; PLOS Digit Health 2026) |
| Bipolar vs unipolar depresyon (sevk) | Depresif hastaların kabaca %10–20'sinde bipolar spektrum [doğrulanmadı] | MDQ, aile öyküsü, hipomani sorgusu | Antidepresanla manik kayma; geç tanı | Ses özellikleri UD-BD ayrımında AUC 0,58 (Faurholt-Jepsen 2022) — **sensör değer katmıyor** | MDQ: özgüllük 0,85, duyarlılık 0,62 (Wang 2015 meta-analiz) |
| DEHB (çocuk/erişkin) sevk kararı | Denizli okul öncesi: %9,3 (bozulma ölçütüyle) [Başay 2026]; erişkin ~%2,5 [doğrulanmadı] | Ebeveyn/öğretmen ölçekleri (Turgay/SNAP-IV, ASRS), sevk | Ölçek öznel; çocuk psikiyatri kuyruğu uzun; gereksiz sevk | Ekran+dokunmatik CPT (dikkat/dürtüsellik) + ön kamera/IMU hareket sayısı | QbTest (klinik, kamera-kızılötesi), QbCheck (web+webcam; sens 82,6/spec 79,5, geliştirici çalışması); akıllı telefon CPT araştırması (Casals 2025) |
| Alkol/madde kullanımı; akut intoksikasyon | Türkiye'de alkol kullanım bozukluğu düşük prevalanslı [prevalans doğrulanamadı] | AUDIT/AUDIT-C, klinik gözlem | Sorulmaması; intoksike hastanın başka tanıyla (hipoglisemi, inme, kafa travması) karışması | Mikrofon (tekerleme okuma), IMU yürüyüş, ön kamera göz (nistagmus/konverjans) — hepsi laboratuvar düzeyi | Suffoletto 2020 (yürüyüş, n=17), 2023 (ses, n=18); Front Neurosci 2024 (göz, ilaçlar) |
| Psikoz erken belirtileri | Nadir (yıllık insidans ~15–30/100.000) [doğrulanmadı] | Klinik şüphe, acil psikiyatri sevki | Geç tanı, uzun tedavisiz psikoz süresi | Konuşma tutarlılığı (NLP) — İngilizce küçük kohortlarda %79–100; Türkçe model yok | Bedi 2015, Corcoran 2018; TRUSTING protokolü (2026) |
| Deliryum (yaşlı; ev ziyareti, ASM) | Evde yaşayan yaşlıda %0,2–8,3; kırılgan/evde bakım/aile hekimine başvuranda %1,4–44,1 [sistematik derleme 2025]; demanslıda toplumda %30 (DSD meta-analiz 2026) | Klinik izlenim, bazen 4AT | Hipoaktif deliryumun "demans/depresyon" sanılması; acil sevkin gecikmesi | Ekran + hoparlör ile nesnel dikkat testi (DelApp benzeri): AUC 0,89 | DelApp (Edinburgh; araştırma aracı, Türkçe/ASM sürümü yok); 4AT (anket, AUC 0,90) |
| Yeme bozukluğu | Ergen kızlarda ~%1–3 [doğrulanmadı] | SCOFF, BKİ, nabız/tansiyon | Atlanma; tıbbi instabilitenin fark edilmemesi | Kamera-PPG ile bradikardi/ortostatik nabız — ASM'de nabız zaten ölçülüyor → **sensör değer katmıyor** | — |
| Somatizasyon vs organik | Birinci basamak başvurularının önemli kısmı tıbben açıklanamayan yakınma [doğrulanmadı] | Dışlama, zamanla izlem | Aşırı tetkik; ya da organik tanının atlanması | **Sensör değer katmıyor** (organik dışlama diğer branş ajanlarının sensör fikirlerine kalıyor) | PHQ-15 (anket) |
| Postpartum depresyon | Türkiye havuzlanmış prevalans %17,8 (34 çalışma, n=10.236; Karaçam 2025); Türkiye'de yılda ~950 bin doğum [doğrulanmadı] | EPDS (bebek izlem vizitinde, çoğu zaman uygulanmıyor) | Annenin damgalanma korkusuyla düşük puan vermesi; EPDS'nin hiç sorulmaması | Mikrofon: bebek izlem vizitinde 60 sn serbest konuşma → EPDS'yi tamamlayan ses skoru | Videra Health (ABD; AUC 0,886); Japon tek merkez (AUC 0,82, n=43 test); prenatal ön-kayıtlı çalışma AUC ≈0,5 (olumsuz) |

---

## 2. Proje fikirleri (telefon tek başına, hekim kullanır)

### Fikir 1: "Dikkat Işığı" — yaşlıda deliryum için ekran/hoparlör dikkat testi (DelApp mantığı, ASM/ev ziyareti sürümü)

- **Klinik soru:** "Bu yaşlı hastanın bugünkü kafa karışıklığı deliryum mu (→ bugün acil/organik neden araması), yoksa bilinen demans/depresyon mu (→ ben izleyeyim)?" Hedef karar: acile sevk vs izlem.
- **Hasta akışı:** Evde yaşayan yaşlılarda deliryum prevalansı %0,2–8,3; kırılgan, evde bakım alan ya da aile hekimine başvuran yaşlılarda %1,4–44,1 (sistematik derleme, 2025). Toplumda yaşayan demanslılarda deliryum süperpoze %30,2 (meta-analiz 2026). Türkiye'de 65+ nüfus ~9 milyon [doğrulanmadı]; evde sağlık hizmeti ve ASM yaşlı izlemleri bu grubu rutin görüyor.
- **Telefonda nasıl çalışır:** (1) Uyarılabilirlik (arousal) basamağı: hekim 0–4 puanlık gözlem maddelerini dokunarak işaretler (10 sn). (2) Dikkat görevi: ekranda sırayla yanıp sönen ışıklar; hasta kaç kez yandığını söyler/dokunur; hoparlörden yönerge Türkçe okunur; 5–7 deneme, toplam ~90 sn. (3) Uygulama 4AT maddelerini (yaş, doğum tarihi, yer, yıl; ayları tersten sayma — hoparlör üzerinden standart) ekleyip tek rapor üretir: "deliryum olası → bugün organik neden ara/sevk" veya "dikkat korunmuş → izlem". Toplam ≤3 dk, tek elle, hekim telefonu tutar.
- **Kanıt:** DelApp (Tieges ve ark., PLoS ONE 2020; n=187 yaşlı yatan hasta, 61 deliryum/61 demans/65 normal): AUC 0,89 (%95 GA 0,84–0,94); kesim ≤8'de duyarlılık %91,7, özgüllük %74,2; deliryum–demans ayrımında özgüllük %68,3. Geliştirme çalışması (2015, n=156): AUC 0,93 (deliryum vs demans), 0,99 (vs kontrol). DelApp-ICU (2018): gün-1 duyarlılık %100/özgüllük %96 (küçük). Referans standart DSM-5. **Sınır:** vaka-kontrol tasarımı, hastane örneklemi; ev/ASM ortamında ve Türkçe'de doğrulama yok. Karşılaştırma: 4AT (anket) çok merkezli randomize çalışmada duyarlılık %76, özgüllük %94, AUC 0,90 (2019); demanslılarda havuzlanmış duyarlılık %88/özgüllük %79 (2026).
- **Mevcut uygulamalar ve fark:** DelApp Edinburgh Üniversitesi'nin araştırma aracı; ticari/Türkçe/ASM sürümü yok. Fark: aile hekimi–ev ziyareti senaryosu, 4AT ile birleşik tek rapor, Türkçe sesli yönerge, demans bilinen hastada "temel hattan sapma" kaydı (önceki skorla karşılaştırma).
- **Teknik zorluklar + çözüm:** Ekran parlaklığı/görme bozukluğu → büyük, yüksek kontrastlı uyaran, işitsel alternatif (bip sayma). İşitme kaybı → görsel yol. Hastanın hiç cevap vermemesi (uyarılabilirlik çok düşük) → otomatik "deliryum lehine" sonuç (DelApp'ta da böyle). Cihaz çeşitliliği önemsiz (zamanlama ms hassasiyeti gerekmez). Türkçe veri gerekmiyor; yalnızca klinik doğrulama çalışması (ASM+evde sağlık, DSM-5 referans, ~300 hasta) gerekir.
- **Regülasyon:** MDR Kural 11 → tanısal karar bilgisi sağlayan yazılım, sınıf IIa (deliryum atlandığında ciddi kötüleşme riski savunulursa IIb). TİTCK Tıbbi Cihaz Yönetmeliği (MDR uyumlu). "Dikkat ölçümü/triyaj desteği; tanı hekimindir" konumlandırması. KVKK: kimlik verisi tutulmadan, ses kaydı yapılmadan (yalnızca puan) çalışabilir → en düşük veri riski.
- **Riskler:** Yanlış negatif: hipoaktif deliryumun atlanması → organik nedenin (enfeksiyon, ilaç, metabolik) gecikmesi; önlem: uyarılabilirlik basamağının tek başına pozitiflik üretmesi, 4AT ile birleşim. Yanlış pozitif (özellikle demanslıda özgüllük %68): gereksiz acil sevk; önlem: demanslı hastada temel hat kaydı ve "değişim" yorumu.
- **Puan:** Teknik 9 | Kanıt 7 | Etki 7 | Yenilik 6 | Düşük risk 7 | İş akışına uyum 8 | **TOPLAM 44/60**

### Fikir 2: "Bir Dakika Konuş" — PHQ-9'a ikinci kat olarak ses biyobelirteci (depresyon)

- **Klinik soru:** "PHQ-9'u güvenilir dolduramayan ya da yakınmasını somatize eden bu hastada orta-ağır depresyon olasılığı yüksek mi (→ tedavi başla/psikiyatri sevki)?" Hedef: tedavi başlama/sevk eşiğinin netleşmesi.
- **Hasta akışı:** Türkiye WMH 2026: 12 aylık duygudurum bozukluğu %12,4, anksiyete %17,2; bozukluğu olanların yalnızca %20,9'u tedavi alıyor. Aile hekimi günde 60–100 hastanın en az 5–10'unda depresyon/anksiyete olasılığıyla karşılaşıyor (kaba tahmin).
- **Telefonda nasıl çalışır:** Hekim telefonu masaya koyar, uygulama tek standart soru sorar ("Son bir haftanız nasıl geçti, anlatır mısınız?"); 45–60 sn serbest konuşma mikrofona kaydedilir; cihaz üstü model (akustik: prozodi, duraklama, F0 değişkenliği, konuşma hızı; isteğe bağlı Türkçe ASR + dil özellikleri) 0–100 "depresyon olasılığı" verir ve PHQ-9 puanıyla aynı ekranda gösterir. Uyumsuzluk (PHQ-9 düşük, ses yüksek) hekime "daha fazla sor" uyarısı. Toplam ≤2 dk.
- **Kanıt:** Meta-analiz (JMIR Mental Health 2025, 105 çalışma): havuzlanmış duyarlılık 0,84 (0,81–0,86) / özgüllük 0,83 (0,79–0,86) en yüksek bildirilen değerlerle; en düşük değerlerle 0,63/0,60; yazarlar "tek başına klinik kullanıma hazır değil, tamamlayıcı". İkinci meta-analiz (2025, 25 çalışma): geleneksel ML AUC 0,89; derin öğrenme AUC 0,91. Donaghy 2024 derlemesi: ortalama duyarlılık ~0,78, **PHQ-9'dan düşük**. Ürün düzeyinde: Kintsugi Voice v1 (Mazur 2025, n=14.898, PHQ-9≥10 referans): duyarlılık %71,3, özgüllük %73,5; Ellipsis Health (Karlin 2025, n=2.086 çağrı kaydı, PHQ-8): AUC 0,79–0,83. Akıllı telefon anlatısı (Kim 2026, Sci Rep, n=119, iki 1 dk anlatı, PHQ-9≥10): ROC-AUC 0,86, doğruluk 0,79 — küçük örneklem. Referans standart çoğunlukla PHQ-9 (anket), SCID değil; Kintsugi'nin SCID-5 referanslı pivotal çalışması (NCT06809907) sonuçları yayımlanmamış. **Türkçe konuşma veri seti ve Türkçe doğrulama: yok.**
- **Mevcut uygulamalar ve fark:** Kintsugi, Ellipsis, Sonde (İngilizce, ABD; klinisyen/ödeyici odaklı). Türkçe ürün yok. Fark: aile hekimi muayenesine gömülü, PHQ-9 ile yan yana "uyumsuzluk" mantığı, cihaz üstü işleme (ses kaydı telefonu terk etmez).
- **Teknik zorluklar + çözüm:** Ortam gürültüsü (ASM koridoru) → gürültü eşiği, kayıt kalitesi göstergesi. Cihaz mikrofon farkı → cihaz-bağımsız özellikler (prozodi), eşik kalibrasyonu. **Türkçe veri:** en büyük engel; çözüm: çok merkezli ASM kayıt çalışması (hedef ~1.000 hasta, SCID/MINI referans), dil-bağımsız akustik modelle başlayıp Türkçe ince ayar. Yaşlı sesi, sigara, KOAH, Parkinson gibi karıştırıcılar → bu gruplarda "güvenilmez" uyarısı.
- **Regülasyon:** MDR Kural 11 sınıf IIa ("tarama destek"); Kintsugi'nin FDA'ya "Breakthrough" statüsüyle gittiği biliniyor [doğrulanmadı]. KVKK: ses kaydı kişisel veri, açık rıza; cihaz üstü işleme ve kaydın silinmesi şart; biyometrik veri tartışması (ses) için hukuki görüş gerekir.
- **Riskler:** Yanlış negatif: ses "normal" diye PHQ-9 pozitif hasta ihmal edilir — kural: ses skoru PHQ-9'u asla düşüremez, yalnızca yükseltebilir. Yanlış pozitif (~%27 özgüllük kaybı): gereksiz ek görüşme — maliyeti düşük (ek 2–3 soru). **Dürüst not:** PHQ-9 uygulanabildiği hastada sensör ölçülebilir değer katmıyor; katkı yalnızca uyumsuzluk/tarama-reddi senaryosunda.
- **Puan:** Teknik 6 | Kanıt 5 | Etki 8 | Yenilik 6 | Düşük risk 6 | İş akışına uyum 7 | **TOPLAM 38/60**

### Fikir 3: "Bebek Vizitinde Anneyi Dinle" — postpartum depresyon için EPDS + ses

- **Klinik soru:** "1–2. ay bebek izlemine gelen bu annede postpartum depresyon olasılığı yüksek mi (→ EPDS tamamla, psikiyatri/psikolog sevki)?"
- **Hasta akışı:** Türkiye'de yılda ~950 bin doğum [doğrulanmadı]; havuzlanmış olası PPD prevalansı %17,8 (Karaçam 2025, 34 çalışma). Aile hekimi bebeği ilk yıl 9 kez görür (TC Sağlık Bakanlığı izlem protokolü) — annenin ruhsal taraması çoğu zaman yapılmıyor.
- **Telefonda nasıl çalışır:** Bebek muayenesi sırasında telefon masada; hekim "Doğumdan beri günleriniz nasıl geçiyor?" diye sorar; 60 sn kayıt; akustik(+Türkçe dil) model EPDS tahmini verir; ≥10 eşik için "EPDS'yi tamamla/sevk" önerisi. ≤2 dk; annenin ayrıca form doldurması gerekmez.
- **Kanıt (çelişkili):** Griffin 2026 (Women's Health Reports; Videra Health, n=275, EPDS≥10): AUC 0,886, duyarlılık %84,4, özgüllük %76,9 — şirket çalışması, doğrulama yöntemi belirsiz. Japon tek merkez (2025, n=172, test seti 43/6 vaka): ses AUC 0,82 vs EPDS AUC 0,74 — çok küçük, tablo tutarsızlıkları var. **Olumsuz kanıt:** ABD ön-kayıtlı prenatal çalışma (arXiv 2505.06412, n=316): PHQ-8 için AUC 0,51 (şans düzeyi), mEPDS-9 için 0,645. Yani prenatal dönemde genel popülasyon modelleri **çalışmıyor**; postpartumda tek olumlu bağımsız veri yok. Referans standart her çalışmada anket (EPDS), SCID değil.
- **Mevcut uygulamalar ve fark:** Videra Health (ABD, video/ses anketi). Türkçe ürün yok. Fark: bebek izlem vizitine gömülü, hekim kullanır, anne form doldurmaz.
- **Teknik zorluklar + çözüm:** Bebek ağlaması/ortam gürültüsü → ses ayrıştırma; Türkçe postpartum ses verisi yok → ASM tabanlı toplama (EPDS+MINI referans). Fikir 2 ile aynı altyapı; ayrı model.
- **Regülasyon:** MDR IIa; KVKK açık rıza; anne-bebek verisi hassasiyeti.
- **Riskler:** Yanlış negatif: EPDS atlanırsa tehlikeli → kural: ses yalnızca EPDS'yi tetikler, yerine geçmez. Yanlış pozitif: ek 2 dk EPDS — maliyet düşük.
- **Puan:** Teknik 6 | Kanıt 4 | Etki 7 | Yenilik 7 | Düşük risk 6 | İş akışına uyum 7 | **TOPLAM 37/60**

### Fikir 4: "5 Dakika Dikkat" — DEHB sevk kararı için telefon CPT + ön kamera/IMU hareketlilik

- **Klinik soru:** "Ebeveyn/öğretmenin 'dikkatsiz, hareketli' dediği bu çocuk (veya 'odaklanamıyorum' diyen erişkin) çocuk/erişkin psikiyatriye sevk edilmeli mi, yoksa önce okul/uyku/ekran düzenlemesiyle izlenmeli mi?"
- **Hasta akışı:** Denizli okul öncesi iki aşamalı çalışma: DEHB %9,3 (bozulma ölçütüyle; Başay 2026). Okul çağı Türkiye çalışmaları %5–8 [doğrulanmadı]. Çocuk psikiyatri randevu süreleri aylar.
- **Telefonda nasıl çalışır:** Telefon masada standa dayalı, ön kamera açık. Ekranda 4–5 dk kısa CPT (hedef uyaran geldiğinde dokun, hedef olmayana dokunma): omisyon (dikkatsizlik), komisyon (dürtüsellik), tepki süresi değişkenliği hesaplanır. Ön kamera baş/gövde hareket miktarını (QbTest'in kızılötesi kamera mantığı) ölçer; isteğe bağlı olarak ikinci telefon/aynı telefon cebe konularak IMU hareketlilik. Çıktı: yaş normuna göre z-skorları + ebeveyn ölçeğiyle (Turgay/SNAP-IV, uygulama içinde) birleşik "sevk önerisi". Hekim için 1 dk kurulum, çocuk 5 dk test — iş akışı sınırını zorluyor; hemşire odasında yapılabilir.
- **Kanıt:** QbTest meta-analizi (Bellato 2024, 15 çalışma, n=2.058): toplam skor duyarlılık 0,78 (0,69–0,85), özgüllük 0,70 (0,57–0,81); "tek başına tarama/tanı aracı olarak kullanılmamalı", klinik değerlendirmeye eklendiğinde tanı süresini kısaltıyor. QbCheck (web+webcam, geliştirici çalışması, n=142): duyarlılık 82,6 / özgüllük 79,5. **Akıllı telefon CPT:** Casals ve ark. 2025 (Front Psychiatry; 952 nörotipik, 292 ilaçsız DEHB; 6–11 ve 12–60 yaş): demografik+CPT+yüz+hareket özellikleriyle duyarlılık 0,808, PR-AUC 0,799 (özgüllük özette okunamıyor; erratum yayımlanmış). Tablet bimodal CPT BOKE STARS (2026, n=100 vaka-kontrol, 6–12 yaş): toplam skor AUC 0,96 — vaka-kontrol tasarımı iyimser. Referans standart klinik DEHB tanısı. Türkçe/Türkiye verisi yok.
- **Mevcut uygulamalar ve fark:** QbTest/QbCheck (Qbtech; FDA/CE'li; klinik cihaz ya da bilgisayar+webcam, 15–20 dk, lisans ücretli). **Zaten var** sayılabilir; fark: telefon, 5 dk kısa sürüm, aile hekimi sevk filtresi olarak konumlanma, Türkçe normlar. Bu farkın kanıtı yok; 5 dk'lık kısaltmanın doğruluğu ayrıca gösterilmeli.
- **Teknik zorluklar + çözüm:** Dokunmatik gecikme/cihaz farkı → tepki süresi değişkenliği (mutlak değil) kullan; ön kamera hareket ölçümü ışığa/ mesafeye bağlı → yüz kutusu normalize edilmiş hareket; çocuk motivasyonu → oyunlaştırma; Türkçe yaş normları → ASM tabanlı norm çalışması (~1.000 çocuk).
- **Regülasyon:** MDR IIa ("sevk karar desteği"). Çocuk verisi; kamera görüntüsü cihazda işlenip silinir (yalnızca hareket indeksleri saklanır).
- **Riskler:** Yanlış negatif (özellikle dikkatsiz tip kız çocuklarında): sevkin gecikmesi → ebeveyn ölçeği yüksekse CPT "normal" olsa da sevk kuralı. Yanlış pozitif: özgüllük %70 → gereksiz sevk; anksiyete, uyku bozukluğu, öğrenme güçlüğü de CPT'yi bozar — uygulama bu karıştırıcıları ekranda sorar.
- **Puan:** Teknik 7 | Kanıt 6 | Etki 7 | Yenilik 4 | Düşük risk 5 | İş akışına uyum 5 | **TOPLAM 34/60**

### Fikir 5: "Ayık mı?" — akut alkol intoksikasyonu için tekerleme + yürüyüş + göz testi

- **Klinik soru:** "Konuşması bozuk/sendeleyen bu hasta alkol/madde etkisinde mi, yoksa inme/hipoglisemi/kafa travması mı?" Hedef: acil sevk yönü.
- **Hasta akışı:** ASM'de nadir; Türkiye'de alkol kullanım bozukluğu prevalansı düşük [doğrulanamadı]. Yıllık vaka sayısı hekim başına tek haneli.
- **Telefonda nasıl çalışır:** 20 sn tekerleme okuma (mikrofon), 10 adım git-gel (telefon cepte/belde, IMU), ön kamerayla yatay bakış takibi (horizontal gaze nystagmus) ve konverjans. ≤2 dk; "intoksikasyonla uyumlu/uyumsuz" çıktı.
- **Kanıt:** Ses: Suffoletto 2023 (J Stud Alcohol Drugs; n=18, laboratuvar, BrAC >%0,08): doğruluk %98, duyarlılık 0,98, özgüllük 0,97 — 1 sn pencerelerle, aynı kişiler eğitimde; gerçek dünya doğrulaması yok. Yürüyüş: Suffoletto 2020 (n=17, telefon belde, laboratuvar): doğruluk %92,5, duyarlılık 0,89, özgüllük 0,92; 2018 saha çalışması yalnızca korelasyon. Göz: Front Neurosci 2024 (n=48, oksikodon/lorazepam/lisdexamfetamin/esrar): telefon videosuyla nistagmus, konverjans, pupil refleksi anlamlı değişiyor; **doğruluk bildirilmemiş**; alkol için telefon-nistagmus doğruluğu bulunamadı. Hiçbir çalışmada referans standart "intoksikasyon vs nörolojik acil" ayrımı değil, "içmiş vs içmemiş".
- **Mevcut uygulamalar ve fark:** Ürün yok; araştırma düzeyi. Fark: ayırıcı tanı (inme/hipoglisemi) sorusu — ama bu soruyu cevaplayan kanıt yok.
- **Teknik zorluklar:** Dizartri/ataksinin nörolojik nedenlerle ayrılamaması; Türkçe tekerleme normu; telefon konumu.
- **Regülasyon:** Tıbbi-yasal çatışma (adli kullanım riski) → "yalnızca klinik" ibaresi; IIa.
- **Riskler:** Yanlış pozitif = inmenin "sarhoş" sanılması: **kabul edilemez**; uygulama hiçbir zaman "nörolojik aciliyeti dışla" diyemez. Bu nedenle hekime kattığı değer tartışmalı; alkol kokusu/öykü zaten var, glukometre/FAST zaten ASM'de.
- **Puan:** Teknik 6 | Kanıt 4 | Etki 3 | Yenilik 7 | Düşük risk 3 | İş akışına uyum 6 | **TOPLAM 29/60**

### Fikir 6: "Düşünce Tutarlılığı" — psikoz erken belirtileri için Türkçe konuşma analizi (araştırma düzeyi, aile hekimi için erken)

- **Klinik soru:** "Bu genç hastanın tuhaf, dağınık konuşması psikoz prodromu mu (→ acil psikiyatri sevki)?"
- **Hasta akışı:** Psikoz insidansı düşük; aile hekimi yılda belki 1–3 şüpheli olgu görür.
- **Telefonda nasıl çalışır:** 2 dk serbest anlatı → Türkçe ASR → anlamsal tutarlılık (cümle gömlemeleri arası benzerlik), cümle karmaşıklığı, duraklama dinamikleri → "tutarlılık z-skoru".
- **Kanıt:** Bedi 2015 (n=34 CHR, 5 geçiş): %100 doğruluk (aşırı küçük); Corcoran/Bilgrami çapraz-protokol doğrulama: %79–83. Sistematik derleme (2026, 15 çalışma, n=1.313): doğruluk %79–100 ancak "temkinli yorumlanmalı". Şizofreni spektrumu konuşma meta-analizi (2026, 16 çalışma): havuzlanmış AUC ≈0,84. Hepsi **klinik yüksek risk kohortlarında**, uzman kliniklerde, İngilizce ağırlıklı; birinci basamak tarama ortamında ve Türkçe'de kanıt yok; LLM-gömleme yöntemlerinin Türkçe'de tutarlılık ölçümü doğrulanmamış.
- **Mevcut uygulamalar:** Ürün yok (Winterlight benzerleri demans/depresyon odaklı); TRUSTING (AB, relaps tahmini protokolü, 2026).
- **Teknik zorluklar:** Türkçe ASR hata oranı, eklemeli dil için gömleme modelleri; düşük taban oranında yanlış pozitif bolluğu.
- **Regülasyon:** IIa–IIb (psikoz atlanması ciddi); damgalanma riski.
- **Riskler:** Düşük prevalansta yanlış pozitif çoğunluğu, damgalama; yanlış negatifte tedavisiz psikoz süresinin uzaması.
- **Puan:** Teknik 4 | Kanıt 4 | Etki 4 | Yenilik 8 | Düşük risk 3 | İş akışına uyum 5 | **TOPLAM 28/60**

### Fikir 7 (fikir değil, "sensör değer katmıyor" kararları — kısa gerekçeler)

- **İntihar riski:** Akıllı telefon ses modeli AUC 0,81 (n=96 öğrenci, 2026), MDD içinde çok-modlu AUC 0,79 (n=99, 2026), ergen ses+LLM doğruluk 0,81 (Cell Rep Med 2026, n=1.223+460 dış doğrulama). Bu doğruluklar 10 dakikalık muayenede **doğrudan sormanın** (C-SSRS tarama, ASQ) yerini tutamaz; yanlış negatifin bedeli ölüm. Olası tek yer: ses skorunun "mutlaka sor" hatırlatıcısı olması — bu da Fikir 2'ye gömülebilir.
- **Bipolar ayrımı:** Telefon görüşmelerinden ses özellikleri UD–BD ayrımında AUC 0,58, depresif UD vs depresif BD AUC 0,48 (Faurholt-Jepsen 2022, n=169, 115 bin kayıt) — yazarlar "klinik kullanımı desteklemiyor". MDQ (özgüllük 0,85) + aile öyküsü + hipomani sorgusu + antidepresan yanıtı öyküsü yeterli ve 2 dk. Uzun süreli aktigrafi/IMU "mani uyarısı" izlem alanıdır, tanı anında değil.
- **Yeme bozukluğu:** SCOFF (1 dk) tarama; tıbbi instabilite için nabız/tansiyon/ortostatik ölçüm ASM'de zaten var (tansiyon aleti, pulse oksimetre). Kamera-PPG nabız aynı şeyi daha kötü ölçer.
- **Somatizasyon vs organik:** Organik dışlama diğer branş ajanlarının sensör fikirlerine (nöroloji, kardiyoloji, GİS) aittir; psikiyatrik tarafta PHQ-15/anksiyete anketi yeterli.
- **Anksiyete/panik:** Kamera-PPG HRV ile anksiyete tanısı için birinci basamak doğruluk çalışması bulunamadı; GAD-7 yeterli.
- **Yüz ifadesi / psikomotor yavaşlama (depresyon):** Tek-kohort videolarda AUC 0,93 (n=76 mahkûm, 2026), POV gözlük çok-modlu doğruluk %84,7 (n=85); **sızıntı kontrollü** değerlendirmede (DAIC-WOZ/E-DAIC) üç-modlu füzyon AUC yalnızca 0,68 (2026). Işık, kamera, kültürel ifade farkı; Türkçe/Türk yüz verisi yok; klinik ileriye dönük doğrulama yok. Araştırma düzeyi; Fikir 2'ye ileride modalite olarak eklenebilir, bugün ürün temeli olamaz.
- **Bilişsel tarama (demans/MCI, saat çizme, iz sürme):** Psikiyatrinin değil nöroloji/geriatri ajanının kapsamı; burada yalnızca deliryum–demans ayrımı (Fikir 1) ele alındı.

---

## 3. Alanın en iyi 3 fikri ve gerekçe

1. **Fikir 1 — "Dikkat Işığı" deliryum dikkat testi (44/60).** Psikiyatride anketin *uygulanamadığı* tek büyük senaryo bu: hasta soruya cevap veremez, hekim "demans mı deliryum mu" ikilemini bugün göz kararıyla çözüyor. Kanıt (AUC 0,89; duyarlılık %92) bir araştırma aracından (DelApp) geliyor ve ASM/evde sağlık için Türkçe ürün yok; Türkçe veri seti gerekmiyor, yalnızca klinik doğrulama. Karar değeri yüksek (bugün acile mi?), uygulama 3 dk, ses kaydı yok → KVKK riski en düşük.
2. **Fikir 2 — "Bir Dakika Konuş" ses biyobelirteci (38/60).** En yüksek hasta hacmi; kanıt orta (meta-analiz duyarlılık/özgüllük ~0,84/0,83 en iyi, ürün düzeyinde ~0,71/0,74); dürüst konumlandırma "PHQ-9'un yerine değil, uyumsuzluk uyarısı". Türkçe veri seti kurmak projenin asıl maliyeti ve aynı altyapı Fikir 3'ü de besliyor.
3. **Fikir 3 — Postpartum "Anneyi Dinle" (37/60).** Hacim büyük (yılda ~950 bin doğum, PPD %17,8), bebek izlem viziti doğal temas noktası, EPDS çoğu yerde hiç uygulanmıyor. Kanıt çelişkili (bir şirket çalışmasında AUC 0,886; ön-kayıtlı prenatal çalışmada ≈0,5) → önce Türkçe ASM pilotu ile "işe yarıyor mu" sorusu cevaplanmalı; ürün vaadi değil araştırma vaadi.

DEHB telefon CPT'si (34/60) dördüncü: etki iyi ama QbCheck zaten var, 5 dk kısaltmanın kanıtı yok ve test 5 dk tutuyor.

---

## 4. Elenenler

- Ses ile bipolar–unipolar ayrımı: kanıt olumsuz (AUC 0,58) → sensör değer katmıyor.
- Ses/yüz ile intihar riski: küçük örneklem AUC ~0,8; yanlış negatif bedeli ölüm; doğrudan sorma üstün → sensör değer katmıyor.
- Kamera-PPG ile yeme bozukluğunda bradikardi/ortostatik nabız: ASM'de nabız zaten ölçülüyor → değer katmıyor.
- Somatizasyon–organik ayrımı: psikiyatrik sensör yok; organik dışlama diğer branşlara ait.
- Kamera-PPG HRV ile anksiyete: kanıt yok.
- Yüz ifadesi/psikomotor yavaşlama videosu ile depresyon: sızıntısız AUC 0,68; Türkçe/klinik doğrulama yok → araştırma düzeyi, ürün yok.
- Alkol intoksikasyonu (ses/yürüyüş/göz): laboratuvar düzeyi (n=17–18); inme/hipoglisemiyle ayrım kanıtı yok; tıbbi-yasal risk → düşük öncelik (29/60).
- Psikoz konuşma tutarlılığı: Türkçe model yok, düşük taban oranı, damgalama → araştırma düzeyi (28/60).
- Uzun süreli pasif izlem (adım/uyku/telefon kullanımıyla relaps tahmini, AUC 0,70–0,88): hasta uygulaması, hekim muayenesine uymuyor (Brief kural 2).
- Demans/MCI dokunmatik bilişsel testler: nöroloji/geriatri ajanının kapsamı.

---

## 5. Kaynaklar (URL; doğrulanmayanlar işaretli)

Doğrulanan (Europe PMC özeti veya doğrudan erişim):
- Türkiye WMH Survey 2026 — 12 aylık DSM-5 prevalansı (CIDI-5, n=1790): Europe PMC arama kaydı; https://www.ebi.ac.uk/europepmc/ (makale ID özetten alındı, DOI doğrulanmadı)
- Karaçam Z ve ark. 2025, Soc Psychiatry Psychiatr Epidemiol, Türkiye PPD meta-analizi, PMID 40268787 — https://europepmc.org/abstract/MED/40268787
- Deliryum evde yaşayan yaşlılarda sistematik derleme 2025 ve demansta deliryum meta-analizi 2026 — Europe PMC özetleri (PMID'ler özetten alınamadı) [kısmen doğrulandı]
- Tieges Z ve ark. 2020, PLoS ONE, DelApp vaka-kontrol — https://pmc.ncbi.nlm.nih.gov/articles/PMC6980392 ve https://doaj.org/article/68871db2709540aba168239979e04c30
- DelApp geliştirme 2015; DelApp-ICU 2018; DelApp protokolü BMC Geriatrics 2018 — https://link.springer.com/article/10.1186/s12877-018-0901-5
- 4AT vs CAM 2019 (n=785) ve 4AT meta-analizleri 2026 — Europe PMC özetleri
- JMIR Mental Health 2025;12:e67802, "Performance of Automatic Speech Analysis in Detecting Depression" — https://mental.jmir.org/2025/1/e67802
- Konuşma özellikleriyle depresyon tanısal doğruluk meta-analizi 2025 (25 çalışma; AUC 0,89/0,91) — Europe PMC özeti
- Donaghy P ve ark. 2024, J Technol Behav Sci — https://pure.ulster.ac.uk/ws/files/216029300/P_Donaghy_published_version.pdf
- Briganti & Lechien 2025, J Voice — https://orbi.umons.ac.be/handle/20.500.12907/53444
- Mazur A ve ark. 2025, Kintsugi Voice v1 (n=14.898) — Europe PMC özeti; Kintsugi pivotal NCT06809907 — https://clinicaltrials.gov/study/NCT06809907 (sonuç yok)
- Karlin ve ark. 2025 (Ellipsis Health, AUC 0,79–0,83) — Europe PMC özeti
- Kim AY ve ark. 2026, Sci Rep 16:22741 (WavLM, n=119) — Europe PMC özeti
- Griffin J ve ark. 2026, Women's Health Reports (Videra; AUC 0,886) — Europe PMC özeti
- Japon perinatal ses çalışması 2025 — https://pmc.ncbi.nlm.nih.gov/articles/PMC11806126/
- Prenatal ön-kayıtlı ses çalışması (AUC 0,51/0,645) — https://arxiv.org/abs/2505.06412
- Bellato A ve ark. 2024, JCPP, QbTest meta-analizi — https://nottingham-repository.worktribe.com/output/24417573
- Ulberstad F ve ark. 2020, QbCheck — https://www.qbtech.com/wp-content/uploads/2024/04/Ulberstad_etal_IJMPR_2020-1.pdf
- Casals, Larsson, Hansen 2025, Front Psychiatry, akıllı telefon CPT — Europe PMC özeti (erratum 2026;16:1771553)
- BOKE STARS 2026, JMIR Form Res 10:e82164 — Europe PMC özeti
- Başay ve ark. 2026, Türk okul öncesi DEHB prevalansı — Europe PMC özeti
- Suffoletto B ve ark. 2020, J Stud Alcohol Drugs 81:505 (yürüyüş) — https://www.federvini.it/images/jsad.2020.81.505.pdf
- Suffoletto B ve ark. 2023, J Stud Alcohol Drugs 84:808 (ses), PMID 37306378 — https://europepmc.org/abstract/MED/37306378
- Göz tepkileri ve madde, Front Neurosci 2024, PMID 39840007 — https://europepmc.org/abstract/MED/39840007
- Faurholt-Jepsen M ve ark. 2022, Acta Psychiatr Scand (UD/BD ses, AUC 0,58) ve 2021 Int J Bipolar Disord — Europe PMC özetleri
- Wang 2015 MDQ meta-analizi (Depress Anxiety) — Europe PMC özeti
- Akıllı telefon akustik intihar düşüncesi 2026, JMIR Form Res, PMID 42743592; Man ve ark. 2026 PLOS Digit Health; Lei ve ark. 2026 Cell Rep Med, PMID 42155450 — Europe PMC özetleri
- Bedi G ve ark. 2015, npj Schizophrenia — https://scholars.mssm.edu/en/publications/automated-analysis-of-free-speech-predicts-psychosis-onset-in-hig-2/ ; Corcoran/Bilgrami çapraz-protokol — https://researcher.draco.res.ibm.com/publications/prediction-of-psychosis-across-protocols-and-risk-cohorts-using-automated-language-analysis
- ARMS dil belirteçleri sistematik derleme 2026; şizofreni spektrumu konuşma meta-analizi 2026 (AUC ≈0,84) — Europe PMC özetleri
- Sızıntısız çok-modlu depresyon taraması 2026 (AUC 0,676) ve yüz-video LSTM 2026 (AUC 0,934) — Europe PMC özetleri
- Yüz ifadesi LSTM (Chulalongkorn) — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10708765/

Doğrulanamayan / hafızadan [doğrulanmadı]:
- Türkiye yıllık doğum sayısı (~950 bin, TÜİK 2023); Türkiye 65+ nüfus (~9 milyon); erişkin DEHB prevalansı (~%2,5); okul çağı DEHB Türkiye %5–8; depresif hastalarda bipolar spektrum oranı %10–20; psikoz insidansı; Türkiye alkol kullanım bozukluğu prevalansı; ergen yeme bozukluğu prevalansı; Kintsugi FDA Breakthrough statüsü; Levis 2019 BMJ PHQ-9 ≥10 duyarlılık/özgüllük (0,88/0,85); PubMed/PMC sayfaları captcha nedeniyle doğrudan okunamadı.
