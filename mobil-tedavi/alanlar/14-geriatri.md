# Geriatri — Cihazla tedavi edilen hastalıklar ve telefonla tedavi fikirleri

> Not: Bu rapordaki web doğrulaması sınırlı bir arama bütçesiyle yapıldı (yaklaşık 16 arama + birkaç sayfa çekimi). Doğrulanamayan her sayı/çalışma **"doğrulanmadı"** diye işaretlendi. Doğrulanan kaynaklar 5. bölümde.

## 0. Tasarım kısıtı: Yaşlı kullanıcı ve telefon

Bu alandaki her fikir, aşağıdaki kısıtlara uymazsa kâğıt üstünde kalır. Bunlar "ek özellik" değil, **çekirdek gereksinim**dir.

| Kısıt | Kaynağı | Tasarım kuralı |
|---|---|---|
| Görme (presbiyopi, katarakt, makula dejenerasyonu, kontrast duyarlılığı kaybı) | 60+ yaşta hemen herkeste presbiyopi; 65+ %15–30 katarakt (doğrulanmadı, kaba) | Yazı ≥ 18 pt, kontrast ≥ 7:1, mavi-mor ayrımı kullanma, tek ekranda tek mesaj, ekran sarı/koyu tema seçeneği |
| El becerisi (artrit, tremor, kuru parmak ucu → dokunmatik tanımıyor) | Esansiyel tremor 65+ %4–5, osteoartrit eller %10–15 (doğrulanmadı) | Dokunma hedefi ≥ 48×48 dp, sürükleme/çift dokunma/sıkıştırma yok, "basılı tut" yerine tek dokunuş, sesle komut birincil |
| İşitme (presbiakuzi) | 65+ %30–40, 75+ %50+ işitme kaybı (ACHIEVE ve WHO genel verileri) | Ses + görsel + titreşim üçlü geri bildirim, konuşma 1–3 kHz'i öne çıkar, erkek/alçak ses tercihi, hız yavaş |
| Biliş (hafif bilişsel bozukluk, demans) | 65+ HBB %10–20 (doğrulanmadı) | Zaman aşımı yok, menü derinliği ≤ 2, her oturumda aynı sıra, bakıcı (yakın) modu ile uzaktan kurulum |
| Dijital okuryazarlık | TÜİK 2025: 65+ nüfus 9,58 milyon; 65–74 yaş internet kullanımı 16–74'ün çok altında (TÜİK BT Kullanım Araştırması; oran doğrulanmadı — sayfa çekilemedi) | Hesap açma yok, şifre yok, mağaza indirmesi yakını yapar, ilk kurulumda "yakın kurulum QR'ı", uygulama kendi kendine başlar (alarm gibi) |
| Donanım | Yaşlılar genelde eski/ucuz Android (doğrulanmadı) | 60 Hz ekran, düşük RAM, eski kamera varsayılır; 120 Hz gerektiren özellikler (40 Hz flicker) "varsa" çalışır |
| Fiziksel güvenlik | Düşme egzersizi sırasında düşme riski | Her denge görevi "sandalye/tezgah yanında" talimatıyla başlar; IMU ile ani düşüş algılanırsa oturum durur, acil kişi aranır |
| Telefonun vücutta yeri | IMU verisi için telefon sabit olmalı | Pantolon cebi (ön) veya bel lastiği altı; aksesuar yok. Kalibrasyon her oturumda 3 sn "dik dur" ile yapılır |

## 1. Alanda cihazla tedavi edilen hastalıklar (envanter)

| Hastalık / sorun | Kullanılan cihaz | Etki mekanizması | Telefon bu mekanizmayı üretebilir mi? | Not |
|---|---|---|---|---|
| Düşme riski / denge bozukluğu | Kuvvet platformu biofeedback (Biodex Balance, NeuroCom), pertürbasyon platformları, tablet denge programları (StandingTall), app (Nymbl) | Motor öğrenme + görsel/işitsel biofeedback (salınımı ölç → göster) + ilerleyen zorluk; Otago tipi kuvvet-denge egzersizi | **Zayıf ama anlamlı**: IMU ile gövde salınımı ölçülebilir, kuvvet platformunun basınç merkezi ölçülemez; biofeedback ses/haptikle verilebilir | StandingTall RCT (BMJ 2021, tablet, ~500 kişi, 2 yıl) düşmeleri azalttı; sayı "~%16–20" (basından; tam IRR doğrulanmadı). Nymbl: retrospektif kohort, yalnızca önceden düşenlerde etki |
| Yürüyüş bozukluğu (yaşlanma, Parkinson, inme) | Ritmik işitsel uyarım (RAS) cihazları/metronom, koşu bandı, egzoskeleton | Ritmik duyusal uyarım → motor senkronizasyon (nöromodülasyon) | **Birebir** (hoparlörle metronom) + IMU ile kadans ölçümü | Metronom RAS düşmeye eğilimli yaşlılarda tek seansta bile yürüyüşü düzeltir (derleme); düşme sonlanımlı RCT yok |
| Sarkopeni (yaşa bağlı kas kaybı) | Tüm vücut titreşim (WBV) platformu, direnç makineleri, NMES (elektrik kas uyarımı) | WBV: mekanik titreşim → tonik vibrasyon refleksi; direnç: mekanik yük → hipertrofi; NMES: elektrik | WBV **hayır** (telefon titreşimi 80–300 Hz ama genlik mikrometre, platform 2–5 mm); direnç **zayıf ama anlamlı** (vücut ağırlığı + sandalye egzersizi, kamerayla sayım/güç ölçümü); NMES **hayır** | WBV meta-analizi: sarkopenide alt ekstremite kuvveti SMD 0,69 (6 çalışma, n=223), düşük kalite; direnç egzersizi altın standart |
| Osteoporoz | WBV, LIPUS (düşük yoğunluklu ultrason, kırık iyileşmesi), vertebroplasti, egzersiz | Mekanik yük → osteojenik uyarı | WBV/LIPUS **hayır**; yüksek etkili egzersiz (topuk düşürme, zıplama) **zayıf ama anlamlı**: IMU ile tepe ivme (g) ölçülür, doz izlenir | LIFTMOR RCT (Watson 2018, yüksek yoğunluklu direnç+etki, doğrulanmadı) kemik yoğunluğunu artırdı |
| Demans / Alzheimer (bilişsel) | Bilgisayarlı bilişsel eğitim (BrainHQ, CogniFit), 40 Hz gamma duyusal uyarım (Cognito Spectris, FDA Breakthrough), tDCS/TMS | Bilişsel eğitim: nöroplastisite; 40 Hz: ışık+ses ile gamma salınımı tetikleme; tDCS/TMS: elektrik/manyetik | Bilişsel eğitim **birebir** (zaten var); 40 Hz **zayıf ama anlamlı** (120 Hz ekranda 40 Hz flicker, hoparlörle 40 Hz klik treni; göz hizası parlaklık ve kulaklıksız ses gözlük/kulaklıktan zayıf); tDCS/TMS **hayır** | Cognito OVERTURE (n=74) güvenli, post-hoc yavaşlama; HOPE pivotal (n=670) sonuçları bu araştırmada bulunamadı (doğrulanmadı) |
| Sundowning (akşam ajitasyonu) / demansta uyku | Parlak ışık kutusu (10.000 lux), dinamik aydınlatma, melatonin | Sirkadiyen ritim sıfırlama (ipRGC → SCN) | **Zayıf**: telefon ekranı 1000 nit, ~6,5" alan → 20 cm'de yaklaşık 250 lux, 30 cm'de ~110 lux (hesap: L×A/d²). 10.000 lux'ün %2–3'ü | Meta-analiz (Fong 2023, 11 RCT): uyanma sayısını azaltır, ajitasyon/depresyonda etkisiz; sundowning için 2 RCT, etkisiz; Cochrane (Forbes) etkisiz |
| Deliryum önleme (hastane/YBÜ/ameliyat sonrası) | Dinamik ışık (YBÜ), gürültü azaltma, reoryantasyon araçları (saat/takvim panosu), HELP programı | Sirkadiyen düzen + uyku koruma + bilişsel oryantasyon + tanıdık uyaran | Işık **zayıf**; reoryantasyon, uyku hijyeni, tanıdık ses/yüz **birebir** (hoparlör/ekran) | Dinamik ışık RCT (Simons 2016, Lancet Respir Med, n=734): deliryum insidansını azaltmadı. 10.000 lux pilot (Zhang 2021, n=108) sonuç net değil. Aile sesiyle reoryantasyon küçük RCT'lerde olumlu (doğrulanmadı) |
| İşitme kaybı ve bilişsel düşüş | İşitme cihazı, koklear implant, OTC işitme cihazları, AirPods Pro "işitme cihazı" özelliği | Akustik amplifikasyon + iletişim/sosyal işlev | Amplifikasyon **hayır** (kulaklık = ek donanım; hoparlörle amplifikasyon geri besleme yapar); altyazı/konuşma eğitimi **birebir** (Live Transcribe zaten var) | ACHIEVE (Lancet 2023, n=977): birincil sonlanım negatif; yüksek riskli alt grupta %48 yavaşlama; iletişim ve yalnızlık her grupta düzeldi |
| Kronik ağrı (osteoartrit, bel) | TENS, PEMF, ultrason, ısı/soğuk, dijital CBT (ör. FDA onaylı "RelieVRx" VR — ek donanım) | Elektrik/manyetik/termal → nosiseptif kapı; CBT → santral işleme | TENS/PEMF/US/ısı **hayır**; CBT/ağrı eğitimi **birebir** (zaten var: Kaia, Hinge — bazıları sensörlü); haptik dikkat dağıtma **zayıf** | Elendi (bkz. §4) |
| Presbiyopi | Multifokal gözlük/lens, pilokarpin damla (Vuity), perseptüel öğrenme (GlassesOff) | Optik düzeltme / farmakolojik miyozis / kortikal kontrast işleme eğitimi | Optik **hayır**; perseptüel öğrenme **birebir** ama **zaten var** ve kanıt zayıf | Elendi |
| İdrar inkontinansı (stres/urge/karışık) | Pelvik taban biofeedback cihazları (vajinal prob, EMG), elektrik uyarımı, PTNS (tibial sinir), Tät uygulaması | Pelvik taban kas eğitimi (motor öğrenme) + mesane eğitimi (davranışsal) | Biofeedback probu **hayır**; kas/mesane eğitimi **birebir** (zamanlayıcı, günlük, hatırlatma) — **zaten var** (Tät, Tät II RCT'leri JMIR 2021) | Yaşlıya özgü sürüm (sesli, bakıcı destekli "zamanlı işeme") boşluk olabilir; yenilik düşük |
| Yalnızlık / geç yaş depresyonu | Sosyal robot (ElliQ), dijital CBT, telefonla davranışsal aktivasyon, grup programları | Sosyal bağ + davranışsal aktivasyon + bilişsel yeniden yapılandırma | **Birebir** (konuşma, bildirim, görüntülü arama köprüsü) | ElliQ: NY eyalet pilotu "%95" basın verisi, kontrollü çalışma yok. Yaşlıya özel ses-öncelikli DA uygulaması boşluk |
| İlaç uyumsuzluğu | Akıllı hap kutuları (Hero, MedMinder), blister sensörleri, Medisafe app, kameralı doğrulama (AiCure — doğrulanmadı) | Hatırlatma + doğrulama + bakıcı bildirimi (davranışsal) | **Birebir** (bildirim, kamerayla hap doğrulama) — **zaten var** | Meta-analiz (9 RCT): öz bildirimli uyum OR 2,12; yaşlı derlemesi (2026, 35 çalışma): çoklu strateji işe yarar, salt hatırlatma yetersiz. Yenilik düşük |
| Kırılganlık (frailty) / fiziksel işlev kaybı | Egzersiz programları (Otago, Vivifrail), tele-rehabilitasyon | Motor öğrenme + kuvvet | **Zayıf ama anlamlı** (kamera/IMU ile yönlendirme ve ilerleme) | Otago app RCT'leri sürüyor (NCT07433153, 2026); etkinlik verisi henüz yok |
| Vertigo / vestibüler (BPPV, yaşlı dengesizliği) | Epley manevrası, vestibüler rehabilitasyon (VOR egzersizleri), vestibüler uyarım cihazları (GVS) | Otolit repozisyon; vestibüler adaptasyon; galvanik uyarı | Manevra yönlendirme ve VOR egzersizi **birebir** (IMU ile baş açısı, ekranda hedef); GVS **hayır** | Nöroloji/KBB alanının konusu; burada yalnızca not |

## 2. Proje fikirleri (telefon tek başına)

### Fikir 1: DengeDöngü — IMU ile ev içi kapalı döngü denge ve yürüme eğitimi
- **Hedef hastalık ve hasta sayısı:** Düşme riski / denge bozukluğu, 65+. Türkiye 65+ nüfus 9,58 milyon (TÜİK 2025); yılda yaklaşık üçte biri düşer (WHO genel verisi, %28–35) → Türkiye'de yılda ~3 milyon düşen kişi. Dünya: 2023'te ~842.000 düşme ölümü, %71'i 60+ (WHO düşme bilgi notu, 2026). Hedef kitle: bağımsız yaşayan, yürüyebilen, düşme öyküsü/korkusu olan 65+ (Türkiye ~2–3 milyon, dünya ~200–300 milyon, kaba).
- **Taklit edilen cihaz ve mekanizma:** Kuvvet platformu biofeedback denge eğitimi (Biodex/NeuroCom) + Otago/StandingTall programı. Mekanizma: salınımı ölç → anında geri bildir → zorluğu kademeli artır (motor öğrenme + biofeedback).
- **Telefonda nasıl çalışır:** Telefon ön pantolon cebinde veya bel lastiği altında (aksesuar yok). İvmeölçer+jiroskop ile gövde salınımı (RMS, yol uzunluğu, ML/AP yön) hesaplanır; egzersizler: ayakta durma (ayaklar bitişik → tandem → tek ayak → gözler kapalı), ağırlık aktarma, topuk-burun yürüyüş, sandalyeden kalkma, ikili görev (sesli sayım/kelime oyunu ile yürüyüş). Geri bildirim: hoparlörden "iyi, sabit" / ton yüksekliği salınımla değişir, titreşim motoru tolerans aşıldığında uyarır. Zorluk algoritması: salınım hedefin %80'i altında 2 seansta kalırsa seviye atlar. Düşme algılama: >3 g darbe + hareketsizlik → oturum durur, yakın aranır. Protokol: günde 15–20 dk, haftada 5 gün, 24 hafta; StandingTall'ın 2 saat/hafta dozu hedeflenir. Yakın modu: uzaktan kurulum, haftalık rapor.
- **Kanıt:** Cihaz tarafı: denge/kuvvet egzersizi düşmeleri ~%23 azaltır (Cochrane Sherrington 2019, doğrulanmadı sayı); StandingTall tablet RCT (BMJ 2021) düşmeleri azalttı. Telefon tarafı: TOGETHER fizibilite RCT (n=50, İngiltere) telefonla ölçüm ikincil; NCT05140044 (n=31) telefonla denge değerlendirme + müdahale fizibilitesi; Nymbl retrospektif kohort (3.735 kullanıcı vs 114.219): yalnızca düşme öyküsü olanlarda düşme yaralanmasında 4,24 puan azalma. **IMU biofeedback'li kapalı döngü ev programı için RCT yok.**
- **Mevcut uygulamalar:** Nymbl (ABD, video+bilişsel oyun; sensör geri bildirimi yok), StandingTall (tablet, sensör yok, araştırma ürünü), Mais Equilíbrio (Brezilya, Otago, kullanılabilirlik aşaması), SWAY Balance (ölçüm, klinisyen aracı, tedavi değil). **Fark:** gerçek zamanlı IMU biofeedback, otomatik ilerleme, düşme güvenlik kilidi, ses-öncelikli yaşlı arayüzü.
- **Teknik zorluklar ve çözüm:** (1) Telefon konumu değişken → her oturum 3 sn dik durma kalibrasyonu + yerçekimi vektörüne göre eksen döndürme. (2) Cep yerine elde tutma → yakınlık/ortam ışığı sensörüyle "cepte mi" kontrolü. (3) Salınım ölçümünün kuvvet platformuyla uyumu → literatürde bel IMU'su ile COP korelasyonu orta-iyi (r≈0,6–0,8, doğrulanmadı); klinik ölçüm değil, kişi içi ilerleme ölçüsü olarak kullanılır. (4) Eski telefonlarda örnekleme 50 Hz → yeterli (salınım <5 Hz).
- **Regülasyon:** Düşme riskinde egzersiz yönlendirme + fizyolojik ölçüm → FDA Class II (SaMD, muhtemelen 510(k) "düşme riski değerlendirme/egzersiz"), CE-MDR Class IIa, TİTCK aynı. Düşme sonlanımlı RCT gerekir (geri ödeme için); "genel sağlık" olarak başlayıp klinik çalışmayı paralel yürütmek mümkün.
- **Riskler / kontrendikasyonlar:** Egzersiz sırasında düşme (sandalye/tezgah zorunluluğu, ilk 2 hafta yakın eşliğinde); ortostatik hipotansiyon, kontrolsüz kalp hastalığı, akut vertigo → tarama anketi; yanlış güven ("uygulama var, bastona gerek yok") → mesajlaşma.
- **Puanlama:** Teknik 8 | Kanıt 7 | Etki 9 | Yenilik 6 | Düşük risk 7 | **TOPLAM 37/50**

### Fikir 2: KalkGüç — Kamerayla sandalyeden kalkma gücü eğitimi (sarkopeni/kırılganlık)
- **Hedef hastalık ve hasta sayısı:** Sarkopeni ve kırılganlık. Prevalans 65+ %10–27 (tanıma göre; Petermann-Rocha 2022 meta-analizi, doğrulanmadı), huzurevinde %68 (Türkiye çok merkezli, el kavrama). Türkiye: ~1–2,5 milyon; dünya: 60+ ~1,1 milyar × %10–27 → 100–300 milyon.
- **Taklit edilen cihaz ve mekanizma:** Direnç eğitimi makineleri + klinik STS (sit-to-stand) güç testi (kuvvet platformu / optik hareket yakalama). Mekanizma: progresif mekanik yük → kas hipertrofisi ve güç; kalkma gücü, bacak kas gücünün en işlevsel göstergesi.
- **Telefonda nasıl çalışır:** Telefon masaya/rafa yaslanır, ön kamera 2–3 m'den profil görüntüsü alır; cihaz içi 2D poz kestirimi (MoveNet/BlazePose) ile kalça-diz-ayak bileği açıları ve gövde dikey hızı → her tekrarda **kalkma gücü (W/kg)** hesaplanır (Alcazar denklemi, doğrulanmadı ad). Egzersiz: 5×STS, 30 sn STS, kollu/kolsuz, tempo kontrollü, ilerleme: yavaş eksantrik → hızlı konsantrik → tek bacak destekli → sırt çantalı (ev eşyası). Hoparlör sesle sayar, tempo verir, "daha hızlı kalk" der. Günde 10–15 dk, haftada 3 gün, 12 hafta; her hafta güç eğrisi gösterilir. Ek modül: duvar şınavı ve topuk kaldırma sayımı.
- **Kanıt:** Cihaz tarafı: progresif direnç eğitimi sarkopenide kuvvet/işlevi artırır (çok sayıda meta-analiz, A düzeyi). Telefon tarafı: 2D poz kestirimi ile STS gücü (n=129, 71,8 yaş; 20 kişide kuvvet platformu/optik yakalama ile doğrulama; PMC 2026), Mahidol STS uygulaması vs optik yakalama R²=0,92–0,96 (2025), Sensors 2021 (n=40, ICC 0,92–0,97 zamanlama), evde öz-kayıt videolarıyla sağlık sonlanımı tahmini (Springer Nature). **Kapalı döngü eğitim (ölç→doz artır) için çalışma yok**; hepsi ölçüm.
- **Mevcut uygulamalar:** STS ölçüm uygulamaları (araştırma), genel fitness poz uygulamaları (Kemtai, Zenia — yaşlıya göre değil), Vivifrail (PDF/web, sensörsüz). **Fark:** güç ölçümü temelli otomatik doz; sarkopeni odağı; yaşlı arayüzü.
- **Teknik zorluklar ve çözüm:** (1) Ev ışığı/dağınık arka plan → sade duvar, otomatik pozlama uyarısı; (2) eski telefonlarda poz modeli 10–15 fps → zamanlama için yeterli, güç için kalça merkezi dikey hız yeterince düzgün; (3) kamera açısı/mesafe → ilk çerçevede boy kalibrasyonu (kullanıcı boyunu girer, piksel/metre); (4) gizlilik → tüm işleme cihazda, video saklanmaz.
- **Regülasyon:** Egzersiz yönlendirme + işlev ölçümü: CE-MDR Class I–IIa, FDA "genel sağlık" veya Class II; sarkopeni iddiası için klinik çalışma gerekir.
- **Riskler / kontrendikasyonlar:** Kalkarken denge kaybı (kollu sandalye, duvara yakın); diz protezi erken dönemi, kontrolsüz hipertansiyon; aşırı yüklenme → haftalık artış ≤%10.
- **Puanlama:** Teknik 7 | Kanıt 6 | Etki 8 | Yenilik 8 | Düşük risk 8 | **TOPLAM 37/50**

### Fikir 3: Ritimli Adım — Hoparlörden ritmik işitsel uyarım + IMU kadans kapalı döngüsü
- **Hedef hastalık ve hasta sayısı:** Yaşa bağlı yürüyüş yavaşlaması ve değişkenliği (düşme öngörücüsü), Parkinson ve inme sonrası yürüyüş. 65+'ta yürüyüş hızı <0,8 m/s %20–30 (doğrulanmadı). Türkiye ~2 milyon, dünya ~200 milyon (kaba).
- **Taklit edilen cihaz ve mekanizma:** RAS cihazları/metronom tabanlı yürüyüş eğitimi, akıllı metronom ayakkabıları. Mekanizma: ritmik duyusal uyarım → işitsel-motor senkronizasyon (serebellum/bazal ganglion döngüsü), adım değişkenliğini azaltma.
- **Telefonda nasıl çalışır:** Telefon cepte; IMU ile adım tespiti ve kadans (adım/dk), adım süresi değişkenliği (CV) hesaplanır. Hoparlör (kulaklık isteğe bağlı iyileştirme) metronom/müzik tempo verir; **kapalı döngü**: başlangıç kadansı +5–10% hedef, kullanıcı tutturursa tempo artar, değişkenlik yükselirse düşer. Pembe gürültü benzeri "doğal değişkenlik" modu (Omaha posteri, doğrulanmadı etkinlik). Protokol: günde 2×10 dk ev içi/koridor yürüyüşü, 8 hafta; sabit ses seviyesi ortam gürültüsüne göre mikrofonla otomatik.
- **Kanıt:** Cihaz tarafı: Parkinson'da RAS kadans ve hızı artırır (meta-analizler, A/B düzeyi; Ghai 2018 doğrulanmadı); yaşlılarda metronoma adım atma tek seansta yürüyüşü düzeltir (derleme, PMC6970979); 2025 Hindistan RCT (n=60, sonuç görülmedi); NCT06085248 sürüyor. **Telefon RAS programının düşmeyi azalttığına dair çalışma yok.**
- **Mevcut uygulamalar:** Parkinson için "Beats Medical", "Walk with Path" (ayakkabı lazer — donanım), genel metronom uygulamaları; IMU ile kapalı döngü tempo ayarı yapan yaşlı odaklı uygulama bulunamadı (doğrulanmadı — Northumbria önerisi prototip aşamasında). **Fark:** otomatik tempo uyarlama, değişkenlik hedefi, düşme riski odağı.
- **Teknik zorluklar ve çözüm:** Hoparlör sesi cepte boğuk → 1–2 kHz tık sesi (telefon hoparlörünün güçlü bandı), cep dışı tutuluyorsa titreşim motoru ile haptik metronom; adım tespiti gürültülü → tepe algılama + 0,5–3 Hz bant geçiren filtre; Parkinson'da donma → ses ipucunu "başlat" komutuyla tetikleme.
- **Regülasyon:** Yürüyüş rehabilitasyonu: CE Class I–IIa; Parkinson iddiası için nöroloji RCT. Yaşlı genel kullanım için "sağlıklı yaşam" başlangıcı olur.
- **Riskler / kontrendikasyonlar:** Tempoyu zorlarken düşme → artış sınırı %10, koridor/destek yakınında; işitme kaybında ses duyulmaz → haptik mod; ciddi aritmi/senkop öyküsü tarama.
- **Puanlama:** Teknik 9 | Kanıt 5 | Etki 7 | Yenilik 7 | Düşük risk 8 | **TOPLAM 36/50**

### Fikir 4: Tanıdık Ses — Deliryum önleme için aile sesiyle reoryantasyon + uyku/ışık düzeni
- **Hedef hastalık ve hasta sayısı:** Hastane yatışı ve ameliyat sonrası deliryum, 65+. Hastaneye yatan yaşlıların %20–30'u, kalça kırığı sonrası %50'ye kadar (Inouye 2014 Lancet, doğrulanmadı sayı). Türkiye'de yılda yüz binlerce yaşlı yatışı (kaba); dünya on milyonlarca.
- **Taklit edilen cihaz ve mekanizma:** HELP (Hospital Elder Life Program) çok bileşenli protokol, YBÜ dinamik aydınlatma, reoryantasyon panoları, gürültü/uyku koruma. Mekanizma: bilişsel oryantasyon + tanıdık uyaran + sirkadiyen düzen + uyku koruma (davranışsal/duyusal).
- **Telefonda nasıl çalışır:** Yakın, yatıştan önce 6–8 kısa ses kaydı yapar ("Anne, bugün Salı, hastanedesin, ameliyatın iyi geçti, akşam geleceğim"). Uygulama hastanın başucundaki telefondan saatli oryantasyon mesajlarını (sabah/öğle/akşam) tarih-saat-yer bilgisiyle dinamik olarak birleştirip çalar; ekranda büyük saat, gün, yer, yakın fotoğrafı. Gece: ekran kapalı, hoparlörden pembe gürültü (ortam gürültüsünü maskeleme), gece bildirimleri yok; sabah: ekran en parlak, kullanıcıya pencere yanına taşıma hatırlatması (ortam ışığı sensörü <500 lux ise). Bilişsel aktivasyon: günde 2×5 dk konuşma oyunu (sesli). Gece hareket (IMU, yatak üstünde) ve ses analizi ile uyku bozulması → yakına/hemşireye uyarı (isteğe bağlı). Süre: yatış boyunca, taburculuk sonrası 2 hafta.
- **Kanıt:** Cihaz/protokol tarafı: HELP deliryumu ~%40 azaltır (meta-analiz, Hshieh 2015, doğrulanmadı sayı); aile sesiyle reoryantasyon küçük RCT'lerde deliryum süresini azalttı (Munro 2017, YBÜ, doğrulanmadı); dinamik ışık RCT negatif (Simons 2016, n=734). Telefon tarafı: **yok**.
- **Mevcut uygulamalar:** Bulunamadı; bazı hastanelerde tablet reoryantasyon pilotları (doğrulanmadı). **Fark:** aile sesi + dinamik oryantasyon + uyku koruma tek pakette, sıfır kurulum (yakın telefonundan yapılır).
- **Teknik zorluklar ve çözüm:** Hastane gürültüsü, hoparlör sesi başkalarını rahatsız eder → kısık ses + yakın yerleşim; hastanın telefonu kullanması beklenmez (pasif cihaz); şarj → yakın sorumluluğu; metin-konuşma ile aile sesini klonlamak etik/gizlilik riski → yalnızca gerçek kayıtlar birleştirilir.
- **Regülasyon:** Deliryum önleme iddiası → SaMD Class IIa (CE), FDA Class II olası; hastane RCT'si gerekir. "Oryantasyon yardımcısı" olarak Class I/genel sağlık başlangıcı.
- **Riskler / kontrendikasyonlar:** Yanlış tarih/saat → kafa karışıklığı (otomatik senkron); gece sesi uykuyu bozmamalı; ağır işitme kaybında etkisiz; ilaç/metabolik nedenleri gizlememeli (yalnızca ek önlem).
- **Puanlama:** Teknik 9 | Kanıt 4 | Etki 6 | Yenilik 8 | Düşük risk 8 | **TOPLAM 35/50**

### Fikir 5: Sirkadiyen Pencere — Demansta sundowning/uyku için ışık zamanlama + ekran ışığı + davranışsal düzen
- **Hedef hastalık ve hasta sayısı:** Demansta uyku-uyanıklık bozukluğu ve akşam ajitasyonu (demans hastalarının %20–45'i, doğrulanmadı). Dünya demans ~55–57 milyon (WHO), Türkiye tahmini 600 bin–1 milyon (doğrulanmadı). Hedef: evde bakıcısı olan hasta.
- **Taklit edilen cihaz ve mekanizma:** 10.000 lux ışık kutusu, dinamik aydınlatma. Mekanizma: sabah parlak ışık → sirkadiyen faz ilerletme; akşam loş/kırmızı → melatonin baskılanmasını önleme; düzenli zamanlama.
- **Telefonda nasıl çalışır:** **Dürüst sınır:** telefon ekranı 20 cm'de ~250 lux verir; 10.000 lux kutusunun yerine geçmez. Bu yüzden ana mekanizma **ışık zamanlama koçluğu**dur: ortam ışığı sensörü gün boyu lux'ü kaydeder; sabah 9–11 arası toplam ışık dozu düşükse bakıcıya "pencere kenarı/balkon 30 dk" ister; dış ışık (10.000–100.000 lux) asıl terapötik kaynak. Ekran katkısı: sabah 30 dk kahvaltıda masa üstü telefon en parlak beyaz, 20 cm (~250 lux, hafif ek doz); akşam 18:00 sonrası sıcak/karanlık tema ve tüm bildirim sessiz. Davranışsal: sabit yatma/kalkma saati, akşam yatıştırıcı müzik listesi (hoparlör), ajitasyon günlüğü (bakıcı tek dokunuş). Kapalı döngü: ajitasyon/uyku günlüğü kötüleşirse sabah ışık hedefi artırılır. 8–12 hafta.
- **Kanıt:** Cihaz tarafı: ışık tedavisi uykuda uyanmaları azaltır (Fong 2023, 11 RCT), ajitasyonda etkisiz; sundowning için 2 RCT negatif; Cochrane negatif → kanıt zayıf-karışık. Telefon tarafı: yok. Dış ışık maruziyeti + uyku rutini (davranışsal) için bakım evi çalışmaları olumlu (doğrulanmadı).
- **Mevcut uygulamalar:** Genel sirkadiyen uygulamaları (Timeshifter — jet lag; f.lux/Night Shift — işletim sistemi), demans-özgü yok (doğrulanmadı). **Fark:** bakıcı odaklı, ortam ışığı sensörüyle doz takibi, demans ajitasyon günlüğü ile kapalı döngü.
- **Teknik zorluklar ve çözüm:** Ortam ışığı sensörü telefon cepte iken ışık görmez → masa üstü/yatak başı sabit telefon (ikinci/eski telefon) önerilir; lux ölçümü kalibrasyonsuz → bağıl eşikler.
- **Regülasyon:** Davranışsal/koçluk → genel sağlık veya Class I. Ajitasyon azaltma iddiası için RCT.
- **Riskler / kontrendikasyonlar:** Fotosensitif epilepsi (sabit ışık, flicker yok → düşük); bipolar bozuklukta sabah ışığı mani tetikleyebilir; retina hastalığı (ekran ışığı düzeyinde ihmal edilebilir).
- **Puanlama:** Teknik 8 | Kanıt 4 | Etki 6 | Yenilik 7 | Düşük risk 8 | **TOPLAM 33/50**

### Fikir 6: KemikDozu — IMU ile ölçülen etki yüklemesi (topuk düşürme/zıplama) ile osteoporoz egzersiz dozlama
- **Hedef hastalık ve hasta sayısı:** Osteopeni/osteoporoz, 50+ kadın %20–30, erkek %5–10 (doğrulanmadı). Türkiye ~3–4 milyon, dünya ~200 milyon (IOF, doğrulanmadı).
- **Taklit edilen cihaz ve mekanizma:** WBV platformu (yapılamaz), yüksek etkili egzersiz protokolleri (LIFTMOR, topuk düşürme/zıplama). Mekanizma: osteojenik mekanik yük (tepe ivme ≥3–4 g eşiği, doğrulanmadı) → kemik oluşumu.
- **Telefonda nasıl çalışır:** Telefon bel lastiği/cepte; IMU dikey tepe ivmeyi her topuk düşürme/zıplamada ölçer; günlük hedef "N tekrar ≥ X g" (ör. 50 tekrar ≥ 3 g), eşik altı tekrarlar sayılmaz ve sesle "daha sert in" denir; haftada 3–5 gün, 10 dk, 6–12 ay. Duvar/tezgah desteği zorunlu. Kalça kırığı riski için güvenlik taraması.
- **Kanıt:** Cihaz tarafı: yüksek etkili/direnç egzersizi kemik yoğunluğunu korur/artırır (LIFTMOR 2018; Cochrane Howe 2011, doğrulanmadı). IMU ile osteojenik indeks ölçümü araştırma literatüründe var (doğrulanmadı). Telefon tarafı: yok.
- **Mevcut uygulamalar:** Genel osteoporoz egzersiz uygulamaları (sensörsüz); ivme dozlayan yok (doğrulanmadı).
- **Teknik zorluklar ve çözüm:** Cepte telefon gevşek → ivme yanlış; bel lastiği altı daha iyi; kişisel kalibrasyon ile bağıl eşik.
- **Regülasyon:** Class I–IIa; BMD sonlanımlı 12 aylık RCT gerekir (pahalı).
- **Riskler / kontrendikasyonlar:** Vertebra kırığı, ileri osteoporoz (T<-3), diz/kalça protezi, denge bozukluğu → topuk düşürme yalnız, zıplama yok. Düşük risk puanı buradan.
- **Puanlama:** Teknik 7 | Kanıt 5 | Etki 7 | Yenilik 7 | Düşük risk 5 | **TOPLAM 31/50**

### Fikir 7: Sesli Yoldaş — Yaşlıya özgü ses-öncelikli davranışsal aktivasyon ve sosyal bağ programı
- **Hedef hastalık ve hasta sayısı:** Yalnızlık ve geç yaş depresyonu. 60+ %25 yalnızlık (WHO Sosyal Bağlantı Komisyonu, doğrulanmadı), depresif belirtiler %10–20. Türkiye 1–2 milyon, dünya 250+ milyon.
- **Taklit edilen cihaz ve mekanizma:** ElliQ sosyal robot; dijital CBT/davranışsal aktivasyon (DA). Mekanizma: planlı keyifli/sosyal aktivite (DA) + günlük sosyal temas köprüsü + hatırlatma.
- **Telefonda nasıl çalışır:** Tamamen sesli (yazı yok): sabah 3 dk "bugün ne yapacağız" planı (DA menüsü: komşu, cami/park, torun araması), akşam "nasıl geçti" puanı; telefon kişilerden "bu hafta aramadığın yakın" önerir ve tek dokunuşla arar; yerel yapay zekâ ile kısa sohbet (sınırlı, yönlendirici); adım sayısı (IMU) ile aktivite hedefi. 8 hafta DA protokolü; sonrası bakım modu.
- **Kanıt:** Cihaz tarafı: DA geç yaş depresyonunda etkili (meta-analizler, doğrulanmadı); ElliQ kontrollü çalışma yok; dijital CBT yaşlıda orta kanıt. Telefon tarafı: sohbet ajanı RCT'leri genç erişkinde (Woebot); yaşlı RCT bulunamadı (arama yapılamadı).
- **Mevcut uygulamalar:** Woebot, Wysa (metin, genç), ElliQ (donanım), Papa (insan eşlik hizmeti). **Fark:** sesli, yaşlı arayüzü, gerçek sosyal ağı harekete geçirme (robotla değil insanla bağ).
- **Teknik zorluklar ve çözüm:** Türkçe yaşlı konuşma tanıma (aksan, yavaş) → cihaz içi model + onay sorusu; LLM güvenliği → yalnızca kapalı senaryolar; intihar riski taraması → acil yönlendirme.
- **Regülasyon:** Depresyon iddiası → SaMD Class IIa, RCT gerekir; "iyilik hali" olarak başlanır.
- **Riskler:** Robot/uygulamaya bağımlılık, insan temasının yerine geçme; yanlış yatıştırma; gizlilik (kişi listesi).
- **Puanlama:** Teknik 8 | Kanıt 5 | Etki 7 | Yenilik 5 | Düşük risk 8 | **TOPLAM 33/50**

### Fikir 8: Gama40 — Telefonla 40 Hz ışık+ses uyarımı (Alzheimer)
- **Hedef hastalık ve hasta sayısı:** Hafif-orta Alzheimer. Dünya ~55 milyon demans, Türkiye 600 bin–1 milyon (doğrulanmadı).
- **Taklit edilen cihaz ve mekanizma:** Cognito Spectris (gözlük+kulaklık, 40 Hz ışık+ses, 1 saat/gün). Mekanizma: gamma bandı nöral senkronizasyon → mikroglia/glimfatik etki (fare verisi güçlü, insan verisi erken).
- **Telefonda nasıl çalışır:** 120 Hz ekranlarda 40 Hz kare dalga (1 kare açık/2 kapalı, %33 görev döngüsü; 60 Hz ekranda **yapılamaz** — 30 Hz olur); hoparlörden 40 Hz klik treni (klik geniş bantlı olduğu için hoparlör üretebilir; 40 Hz saf ton üretemez). Telefon 30–40 cm göz önünde standda, 1 saat/gün, 6 ay. Gözlükten farklı olarak retina aydınlatması çok daha düşük (periferik görme alanı dolmaz).
- **Kanıt:** Cihaz tarafı: OVERTURE (n=74) güvenli, post-hoc yavaşlama; HOPE (n=670) sonuçları bu araştırmada bulunamadı (doğrulanmadı); henüz onaylı tedavi değil. Telefon tarafı: yok (arama bütçesi bitti; "40Hz" uygulamaları/videoları mağazada olabilir, doğrulanmadı).
- **Mevcut uygulamalar:** Muhtemelen genel amaçlı 40 Hz ses/ışık uygulamaları var (doğrulanmadı); klinik sürüm yok.
- **Teknik zorluklar:** Ekran zamanlama kararlılığı (çerçeve düşmesi → frekans kayması), parlaklık yetersizliği, kullanıcı mesafesi/adherans, gözlerin 1 saat ekrana bakması.
- **Regülasyon:** Alzheimer tedavi iddiası → Class II/IIa, uzun RCT; mekanizma onaylanmadan pazarlanamaz.
- **Riskler / kontrendikasyonlar:** **Fotosensitif epilepsi** (40 Hz tipik tetik bandı dışında ama risk var), migren, bulantı; demans hastasının 1 saat uyumu.
- **Puanlama:** Teknik 6 | Kanıt 3 | Etki 6 | Yenilik 5 | Düşük risk 4 | **TOPLAM 24/50**

### Fikir 9 (zaten var — sınırlı fark): Pelvik taban + zamanlı işeme, yaşlı/bakıcı sürümü
- Tät ve Tät II (JMIR 2021 RCT, 18+ kadın) aynı işi yapıyor; 27–72 yaş aralığı. Yaşlıya özgü fark: sesli yönlendirme, bakıcı eşliğinde "prompted voiding" (zamanlı işeme, demansta kanıtlı davranışsal yöntem), düşme riskiyle bağlantılı gece işeme planı. **Yenilik 3**, puanlanmadı; yalnızca Tät'ın Türkçe/yaşlı uyarlaması olarak düşünülmeli.

## 3. Alanın en iyi 3 fikri (sıralı) ve gerekçe

1. **DengeDöngü (37/50)** — En büyük hasta havuzu (her yıl 3 milyon Türk yaşlı düşüyor), cihaz tarafında A düzeyi kanıt (denge/kuvvet egzersizi düşmeyi azaltır), tablet programı RCT'si (StandingTall) zaten pozitif; telefonun IMU'su biofeedback ve otomatik ilerlemeyi mevcut uygulamalardan (Nymbl, StandingTall) farklılaştırır. Risk yönetilebilir (düşme kilidi, destek zorunluluğu).
2. **KalkGüç (37/50)** — Kamerayla kalkma gücü ölçümü 2025–2026 çalışmalarıyla doğrulanmış (R² 0,92–0,96); bunu ölçümden **dozlanmış eğitime** çeviren ürün yok. Sarkopeni tedavisinin altın standardı (direnç egzersizi) telefonun yönlendirebileceği tek mekanizma. Fikir 1 ile aynı uygulamada modül olabilir.
3. **Ritimli Adım (36/50)** — Teknik olarak en kolay (hoparlör + adım sayımı), mekanizma birebir üretilir; kanıt Parkinson'da güçlü, yaşlıda orta; kapalı döngü tempo uyarlaması yeni. Fikir 1'in yürüyüş modülü olarak birleştirilebilir.

Öneri: üçünü tek bir "Yaşlı Hareket Koçu" uygulamasında birleştirmek; ortak IMU/kamera altyapısı, tek yaşlı arayüzü, tek klinik çalışma (düşme + STS gücü + yürüyüş hızı sonlanımları).

## 4. "Yapılamaz" diye elenenler (bir satır gerekçe)

- **Tüm vücut titreşim (sarkopeni/osteoporoz):** Telefon titreşimi mikrometre genlikli, platform milimetre/çoklu g; derin doku uyarımı yok.
- **LIPUS / ultrason, TENS, NMES, PEMF, tDCS/TMS, GVS:** Elektrik/ultrason/manyetik alan telefonda yok.
- **İşitme amplifikasyonu kulaklıksız:** Hoparlörle amplifikasyon akustik geri besleme yapar; AirPods/işitme cihazı = ek donanım. Altyazı (Live Transcribe) zaten var.
- **10.000 lux ışık tedavisi:** Ekran 20 cm'de ~250 lux; yalnızca zamanlama koçluğu olarak kullanıldı (Fikir 5).
- **Presbiyopi:** Optik/farmakolojik düzeltme yapılamaz; perseptüel öğrenme (GlassesOff) zaten var, kanıt zayıf.
- **Kronik ağrı:** Fiziksel modaliteler yapılamaz; CBT/ağrı eğitimi uygulamaları (Kaia vb.) zaten var.
- **Bilişsel eğitim (BrainHQ, CogniFit):** Zaten var; fark üretilemedi.
- **İlaç uyumu (Medisafe, kameralı doğrulama):** Zaten var; yaşlı arayüzü farkı tek başına ürün değil.
- **Pelvik taban biofeedback (prob/EMG):** Donanım gerekir; uygulama tarafı (Tät) zaten var.
- **Kalça koruyucu/airbag, düşme algılama saati:** Ek donanım; düşme algılama telefonda var ama tedavi değil.

## 5. Kaynaklar (URL)

Doğrulanan (bu araştırmada arama/çekim ile görülen):
- WHO Düşme bilgi notu (21 Ekim 2026): https://www.who.int/news-room/fact-sheets/detail/falls
- TÜİK 2025 yaşlı nüfus (9.583.059, %11,1) haberleri: https://www.birgun.net/haber/tuik-verileri-turkiyede-yasli-nufus-artiyor-692990 ; https://www.cnbce.com/veriler/turkiyede-yasli-nufus-tarihi-zirvede-10-milyona-yaklasti-h26611
- TOGETHER fizibilite RCT protokolü: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6756425/
- Telefonla denge değerlendirme ve müdahale (NCT05140044): https://clinicaltrials.gov/study/NCT05140044
- StandingTall basın haberi (%20'ye kadar azalma): https://www.thesenior.com.au/story/7211890/balance-app-prevents-falls-in-older-people-by-20-per-cent/ (BMJ makalesi tam metni çekilemedi; IRR doğrulanmadı)
- Nymbl retrospektif kohort (medRxiv 2025; JAGS 10.1111/jgs.70544): https://www.medrxiv.org/content/10.1101/2025.09.09.25335337v1
- Otago telefon vs toplum RCT (sürüyor): https://clinicaltrials.gov/study/NCT07433153 ; Mais Equilíbrio (JMIR Aging 2025): https://aging.jmir.org/2025/1/e80724/PDF
- STS gücü 2D poz kestirimi (n=129): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12834695/ ; Mahidol STS uygulaması: https://repository.li.mahidol.ac.th/handle/123456789/112726 ; Sensors 2021 STS zamanlama: https://0-doi-org.brum.beds.ac.uk/10.3390/s21062050 ; evde öz-kayıt video: https://communities.springernature.com/posts/predicting-health-outcomes-from-smartphone-videos
- RAS yaşlı derlemesi: https://pmc.ncbi.nlm.nih.gov/articles/PMC6970979 ; RAS yanıtlayıcılar çalışması: https://clinicaltrials.gov/study/NCT06085248 ; Northumbria telefon RAS önerisi: https://researchportal.northumbria.ac.uk/en/publications/a-proposed-pervasive-smartphone-application-for-personalised-gait/
- WBV sarkopeni meta-analizi (SMD 0,69): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7499918/ ; WBV yaşlı 34 çalışma: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10342949/
- Cognito OVERTURE / Spectris: https://www.frontiersin.org/journals/neurology/articles/10.3389/fneur.2024.1343588/epub ; https://www.clinicaltrialsarena.com/news/cognitos-sensory-stimulation-device-slows-decline-in-alzheimers/
- ACHIEVE (Lancet 2023) özetleri: https://bulletin.entnet.org/clinical-patient-care/article/22873554/hearing-loss-and-cognitive-decline-results-of-the-achieve-study ; https://www.audiology-worldnews.com/research/4908-what-has-achieve-achieved
- Işık tedavisi demans meta-analizi (Fong 2023) ve sundowning derlemesi (2024): https://pmc.ncbi.nlm.nih.gov/articles/PMC10578524 ; https://neurology-asia.org/system/index.php/neuro/article/view/1620
- Deliryum dinamik ışık RCT (Simons 2016) özeti: https://www.thebottomline.org.uk/summaries/icm/dynamic-light-application-therapy-to-reduce-the-incidence-and-duration-of-delirium-in-intensive-care-patients-a-randomised-controlled-trial/ ; YBÜ 10.000 lux pilot (Zhang 2021): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8093111/
- Tät II RCT (JMIR 2021): https://clinicaltrials.gov/study/NCT03097549 ; https://link.springer.com/article/10.1007/s00192-021-04755-5
- ElliQ (Broadbent 2024): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10917141/ ; NY eyalet pilotu: https://aging.ny.gov/news/nysofas-rollout-ai-companion-robot-elliq-shows-95-reduction-loneliness
- İlaç uyumu uygulama meta-analizi (9 RCT): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7045248/ ; yaşlı dijital müdahale derlemesi (2026): https://www.citedrive.com/en/discovery/impact-of-mhealth-on-medication-adherence-in-older-adults-with-chronic-diseases-facing-treatment-burden-a-systematic-review/
- Türkiye huzurevi sarkopeni (%68): https://ftrdergisi.com/pdf.php?id=4169 (özet arama sonucundan; tam metin görülmedi)

Doğrulanmadı (bellekten, kontrol edilmeli): Sherrington 2019 Cochrane düşme egzersizi; Petermann-Rocha 2022 sarkopeni prevalansı; Inouye 2014 deliryum; Hshieh 2015 HELP meta-analizi; Munro 2017 aile sesi reoryantasyon; Watson 2018 LIFTMOR; Ghai 2018 RAS Parkinson; Delbaere 2021 StandingTall tam sayılar; TÜİK 65–74 internet kullanım oranı; AiCure; Cognito HOPE sonucu.
