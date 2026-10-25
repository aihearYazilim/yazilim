# Dermatoloji ve Plastik Cerrahi — Cihazla tedavi edilen hastalıklar ve telefonla tedavi fikirleri

> Yöntem notu: Bu turda ortak web-arama bütçesi dolu olduğu için arama motoru kullanılamadı; yalnızca doğrudan bilinen sayfalar (JAMA Dermatology, PMC, Omnilux, HabitAware, Wikipedia vb.) WebFetch ile okunarak doğrulandı. Doğrulanamayan her iddia **[doğrulanmadı]** diye işaretlendi. Telefon ışık değerleri ölçülmedi; fizik hesabıyla (varsayımlar açık) tahmin edildi ve **[hesaplanmış tahmin]** olarak işaretlendi.

## 0. Ön hesap: Telefonun ekranı ve flaşı terapötik ışık dozlarına ne kadar uzak?

**Referans cihazlar (doğrulandı):**
- Akne mavi ışık: 415 nm, 40 mW/cm², seans başına 48 J/cm² (Ablon 2018 derlemesi, PMC5843358). Ev cihazı Omnilux Clear: 415 nm + 633 nm, çıkış 44 mW/cm², haftada 4 seans, 6 hafta, FDA onaylı (omniluxled.com). 48 J/cm² için 44 mW/cm²'de süre ≈ **18 dakika**.
- Saç LLLT (düşük düzey lazer/ışık tedavisi): yaygın cihazlar 630–670 nm, **3–90 mW/cm²**, seans başına **1–10 J/cm²**; Kim 2013 çalışması 92 mW/cm², 47,9 J/cm², 18 dk/gün (Avci ve ark. 2013, PMC3944668).
- Psoriasis/vitiligo/AD fototerapi: dar bant UVB 311–313 nm; eksimer 308 nm (Wikipedia "Light therapy"). Dozlar yüzlerce mJ/cm² ama dalga boyu UV.

**Telefon ekranı [hesaplanmış tahmin]** — varsayımlar: tam ekran 1000 nit (BRIEF: 500–1500 nit), Lambertian yayıcı, cilde temas halinde (uzaklaşınca düşer):
| Mod | Temas halinde aydınlık | Radyometrik irradyans | Not |
|---|---|---|---|
| Beyaz ekran | ≈3.100 lux | ≈1,1 mW/cm² (tüm görünür) | LER ≈ 280 lm/W varsayımı |
| Yalnızca mavi alt piksel (R=G=0) | ≈220 lux | **≈0,3–0,55 mW/cm²**, tepe ≈455–465 nm | OLED mavi tepe 415 nm **değil**; porfirin Soret bandı (405–420 nm) için 460 nm'de soğurma ~5–10 kat düşük |
| Yalnızca kırmızı alt piksel | ≈670 lux | **≈0,3 mW/cm²**, tepe ≈620–630 nm | LLLT penceresi (630–670 nm) içinde sayılır |

**Sonuç — akne:** Ekran mavi irradyansı Omnilux'a göre **~80–150 kat** düşük; dalga boyu uyumsuzluğu eklenince etkin irradyans **~1.000 kat** düşük. 48 J/cm² için ekranı cilde yapıştırarak seans başına **≈27 saat** (ham) / **≈270 saat** (spektral düzeltmeyle) gerekir; cihazda 18 dk. Ayrıca ekran (~100 cm²) yüzün bir kısmını kaplar. → **Mümkün değil.**

**Sonuç — saç LLLT:** Kırmızı ekran ≈0,3 mW/cm²; en düşük cihaz irradyansının (3 mW/cm²) 10 katı, Kim 2013'ün 300 katı altında. 4 J/cm² için seans ≈ **3,7 saat** ekranı kafa derisine basarak; saç kılları ışığı ayrıca engeller. → **Fizik olarak "zayıf", pratik olarak mümkün değil.**

**Telefon flaşı (torç modu) [hesaplanmış tahmin]** — varsayım: sürekli 30–70 lm (ısıl kısıtlı), 1 cm'de ≈3 cm² leke, fosforlu beyaz LED (mavi pompa ≈450 nm, radyometrik gücün ≈%20'si):
- Toplam irradyans 1 cm'de ≈ 30–80 mW/cm²; mavi bileşen ≈ **6–17 mW/cm²** (450 nm, 415 değil).
- 48 J/cm² mavi için leke başına ≈ **50–130 dakika**; yüz ≈ 400 cm² → ≈130 leke → **100–280 saat/seans**. LED yüzeyi ısınır, telefon kısar (throttling), cilt ısı riski.
- 5 cm uzaklıkta leke ≈ 30 cm², irradyans ≈ 10 kat düşer (≈1 mW/cm² mavi).
→ **Mümkün değil** (nokta dozu şaşırtıcı biçimde yakın ama alan, dalga boyu ve ısı nedeniyle kullanılamaz).

**UV (UVB/eksimer), kızılötesi 1072 nm (herpes cihazları), ısı (Bite Away ~51 °C), elektrik (iyontoforez), ultrason, vakum (NPWT), basınç (skar giysisi), soğuk (kriyo):** Telefon **hiçbirini** üretemez (cam ve OLED <400 nm yaymaz; flaş >700 nm ihmal edilebilir).

## 1. Alanda cihazla tedavi edilen hastalıklar (envanter)

| Hastalık | Kullanılan cihaz | Etki mekanizması | Telefon üretebilir mi? | Not |
|---|---|---|---|---|
| Psoriasis (sedef) | Dar bant UVB kabin, eksimer lazer/lamba 308 nm, ev UVB paneli | UV ile T-hücre apoptozu, immünsüpresyon | **Hayır** | Ekran/flaş UV yaymaz |
| Vitiligo | Eksimer 308 nm, NB-UVB | UV ile melanosit uyarımı | **Hayır** | — |
| Atopik dermatit (AD, egzama) — fototerapi | NB-UVB, UVA1 | UV immünmodülasyon | **Hayır** | Çocukta kanser riski nedeniyle zaten kısıtlı (Wikipedia AD) |
| AD — kaşıma davranışı | Giyilebilir kaşıma takibi (Apple Watch tabanlı "Itch Tracker" vb.) [doğrulanmadı], internet tabanlı BDT | Farkındalık + alışkanlık tersine çevirme + maruz bırakma | **Birebir (davranışsal kısım)**, **zayıf (sensör kısmı)** | Hedman-Lagerlöf 2021 iCBT RCT: d=0,75 (doğrulandı) |
| Akne vulgaris | Mavi 415 nm / kırmızı 633 nm LED (Omnilux, maske), PDT, IPL | Porfirin fotoeksitasyonu → C. acnes ölümü; anti-inflamasyon | **Hayır** (bkz. §0: 1.000 kat zayıf, yanlış dalga boyu) | "Mavi ekran akne" uygulamaları kanıtsız |
| Aktinik keratoz, yüzeysel BCC | Fotodinamik tedavi (PDT) lambası + MAL/ALA krem | İlaç + ışık | **Hayır** | İlaç gerekir, ışık yetersiz |
| Androgenetik alopesi (kalıtsal saç dökülmesi) | LLLT tarak/kask (HairMax, iRestore; FDA onaylı) | 630–670 nm fotobiyomodülasyon, mitokondri uyarımı | **Zayıf** (0,3 mW/cm², 3,7 saat/seans) | Pratik değil |
| Alopesi areata | Eksimer, LLLT, kriyo | UV/ışık/soğuk | **Hayır** | — |
| Hiperhidroz (aşırı terleme) | Musluk suyu iyontoforezi, miraDry mikrodalga, botoks | Elektrik akımı ile ter bezi kanal tıkanması; termoliz | **Hayır** | İyontoforez ~%80 azaltma (Wikipedia) |
| Siğil, molluskum, seboreik keratoz | Kriyoterapi, elektrokoter, lazer | Dondurma/yakma | **Hayır** | — |
| Kronik yara (diyabetik ayak, venöz ülser, bası yarası) | Negatif basınçlı yara tedavisi (NPWT), kompresyon bandajı, hiperbarik O2, ultrason debridman, elektrik stimülasyonu | Vakum, basınç, oksijen | **Hayır (fizik)** / **Zayıf (kapalı döngü davranışsal: yük bindirmeme, elevasyon, pansuman uyumu)** | Yara fotoğraf ölçümü (Swift Skin & Wound) yalnızca dokümantasyon, tedavi değil (doğrulandı) |
| Hipertrofik skar / keloid / yanık skarı | Basınç giysisi, silikon tabaka, lazer, kriyo, intralezyonel steroid | Mekanik basınç, oklüzyon, ısı | **Hayır** | Skar masajı yönlendirmesi mümkün ama kanıt zayıf |
| Rozase, telanjiektazi, port-wine | IPL, PDL lazer | Selektif fototermoliz | **Hayır** | — |
| Onikomikoz | Lazer 1064 nm | Isı | **Hayır** | — |
| Herpes labialis | 1072 nm kızılötesi cihaz (Virulite) [doğrulanmadı], LLLT | Fotobiyomodülasyon | **Hayır** | Flaş IR yaymaz |
| Böcek ısırığı / kaşıntılı papül | Isı kalemi (Bite Away ~51 °C) | Lokal ısı ile histamin/kaşıntı azaltma | **Hayır** | Telefon kontrollü ısı veremez |
| Kronik prürit (kaşıntı), nörodermatit, liken simpleks kronikus, prurigo nodularis | NB-UVB; davranışsal: alışkanlık tersine çevirme (HRT), BDT; karşı-uyarım (soğuk, titreşim, sürtme) | UV / davranışsal / kapı-kontrol tipi nöromodülasyon | **Hayır (UV)** / **Birebir (HRT/BDT)** / **Zayıf–orta (haptik karşı-uyarım)** | Ağrılı karşı-uyarımın kaşıntıyı bastırdığı gösterilmiş (Yosipovitch 2005, Ward 1996 — Wikipedia "Itch" üzerinden doğrulandı); titreşime özgü kanıt [doğrulanmadı] |
| Trikotillomani (saç yolma), dermatillomani (deri yolma), onikofaji (tırnak yeme) | Hareket algılayan titreşimli bileklik (HabitAware Keen2/Keen3 — donanım, doğrulandı); HRT/BDT | Farkındalık uyarısı + yarışan tepki | **Birebir (HRT)** / **Orta (kamera ile algılama; bileklik yerine)** | HRT en yüksek başarı oranlı tedavi (Wikipedia TTM) |
| Pediküloz (bit) | Sıcak hava cihazı (AirAllé) [doğrulanmadı] | Kurutma | **Hayır** | — |
| Fotodermatozlar (PMLE), kronik ürtiker | "Hardening" NB-UVB; antihistaminik | UV tolerans | **Hayır** | Korunma uygulamaları tedavi değil |
| Cilt yaşlanması, melazma | LED, lazer, RF | Isı/ışık | **Hayır** | Estetik; kapsam dışı |

## 2. Proje fikirleri (telefon tek başına)

### Fikir 1: "Elini Çek" — Kamera tabanlı vücut odaklı tekrarlayıcı davranış (BFRB) tespiti + tam zamanında alışkanlık tersine çevirme terapisi
- **Hedef hastalık ve hasta sayısı:** Trikotillomani (yaşam boyu %0,6–4,0), dermatillomani (%1,4–5,4), onikofaji. Türkiye (~85 M): trikotillomani ≈0,5–3 M, dermatillomani ≈1,2–4,6 M; dünya: sırasıyla ≈50–300 M ve ≈110–430 M (prevalans Wikipedia "Trichotillomania", "Excoriation disorder" sayfalarından doğrulandı; nüfus çarpımları kaba tahmin).
- **Taklit edilen cihaz ve mekanizma:** HabitAware Keen bilekliği (el hareketi algılar, titreşimle uyarır) ve HRT'nin "farkındalık eğitimi + yarışan tepki" bileşenleri. Mekanizma: davranışsal/bilişsel terapi + tam zamanında uyarı.
- **Telefonda nasıl çalışır:** Hasta yüksek riskli ortamlarda (ders/çalışma masası, TV, ayna başı, yatakta telefon) telefonu masaya/yastığa yaslar ("nöbetçi mod"); ön/arka kamera cihaz içi el ve yüz nirengi (MediaPipe Hands/FaceMesh benzeri) ile el-saç/el-yüz/el-tırnak temasını izler; >2 s temas veya tekrarlayan "yolma" el kinematiği → titreşim + kısa ses + ekranda yarışan tepki komutu (60 s yumruk sıkma / elleri oturma, "urge surfing" nefes). Ek olarak "ayna modu": dermatillomani hastaları için ön kamera aynaya dönüşür, yolma başlayınca görüntü bulanıklaşıp seans kapanır (uyaran kontrolü). Günlük 5–10 dk ACT/HRT mikro-modül, haftalık olay haritası (saat, yer, duygu). Protokol 8–12 hafta. Görüntü asla kaydedilmez; yalnızca nirengi noktaları cihazda işlenir.
- **Kanıt:** HRT/BDT trikotillomani ve dermatillomanide en iyi kanıtlı tedavi (Wikipedia; Woods & Twohig 2008 HRT kılavuzu [doğrulanmadı]). Bileklik için üretici verisi var, bağımsız RCT [doğrulanmadı]. Telefon kamerasıyla BFRB tespiti: COVID döneminde web kamerasıyla "yüze dokunma" tespiti prototipleri yayımlandı [doğrulanmadı]; klinik sonuç çalışması **yok**.
- **Mevcut uygulamalar:** Keen (bileklik gerektirir — doğrulandı). Günlük/BDT uygulamaları (TrichStop, SkinPick çevrimiçi programları; "Liberate" uygulaması) [doğrulanmadı] var, ancak bunlar **gerçek zamanlı algılama yapmaz**. Fark: ek donanımsız, kameraya dayalı, davranış anında müdahale + uyaran kontrolü (ayna modu).
- **Teknik zorluklar ve çözüm:** (1) Pil/ısı: kamera sürekli açık → 5–10 fps, düşük çözünürlük, yalnızca kullanıcı başlattığında; (2) saç dokunma vs. yolma ayrımı → temas süresi + parmak kapanma kinematiği + kullanıcı etiketlemeli kişisel model; (3) telefon cepteyken çalışmaz → IMU ile "telefon elde/masada" ayrımı, elde iken yalnızca planlı HRT; (4) gizlilik → tamamen cihaz içi işleme, görüntü saklanmaz.
- **Regülasyon:** Tedavi iddiasıyla SaMD: FDA Class II (De Novo, reSET benzeri dijital terapötik yolu), CE-MDR Kural 11 → Sınıf IIa, TİTCK MDR'yi izler. Pazar iddiası için 8–12 haftalık RCT (MGH-HPS, SPS ölçekleri) gerekir; "wellness" sürümü önce çıkabilir.
- **Riskler / kontrendikasyonlar:** Yanlış pozitif uyarı → bıkkınlık; utanç/suçluluk artışı (ACT dili şart); gizlilik algısı; 12 yaş altında ebeveyn modu. Fotosensitif epilepsi riski yok.
- **Puanlama:** Teknik 8 | Kanıt 6 | Etki 7 | Yenilik 8 | Düşük risk 9 | **TOPLAM 38/50**

### Fikir 2: "Gece Kaşıma Döngüsü" — Egzama/kronik kaşıntıda akustik gece kaşıma tespiti + sabah geri bildirim + gündüz HRT/iBDT
- **Hedef hastalık ve hasta sayısı:** Atopik dermatit (yaşam boyu ~%20; erişkin %3–5; çocuk %15–30 — Wikipedia AD) ve kronik prürit (dünyada ≈280 M kaşıntı — Wikipedia "Itch"). Türkiye: erişkin AD ≈2–3 M, çocuk ≈2–4 M; dünya: AD ≈200 M+.
- **Taklit edilen cihaz ve mekanizma:** Giyilebilir kaşıma takip cihazları (akıllı saat tabanlı) + terapist destekli internet BDT. Mekanizma: biofeedback (ölç-göster) + davranışsal terapi (HRT, maruz bırakma) + uyaran kontrolü.
- **Telefonda nasıl çalışır:** Telefon komodine konur; mikrofon cihaz içi ses sınıflandırıcıyla (kaşıma = 0,5–5 Hz tekrarlayan geniş bantlı sürtme; öksürük/dönme ayrımı) gece kaşıma epizotlarını sayar; kayıt yapılmaz, yalnızca sınıf çıktısı saklanır. Kapalı döngü: (a) sabah "kaşıma yükü" + tetikleyici analizi (oda sıcaklığı tahmini için barometre/saat, akşam duş/nemlendirici kaydı); (b) gece kaşıma kümesi algılanınca **isteğe bağlı** düşük sesli, uyandırmayan "hatırlatma tonu" (uyku bozmadan kaşımayı kısaltma; kanıt yok, A/B ile test edilir); (c) gündüz 12 haftalık HRT + maruz bırakma tabanlı BDT programı (Hedman-Lagerlöf protokolünün uygulama uyarlaması), nemlendirici zamanlayıcı. Günde 10–15 dk, 12 hafta.
- **Kanıt:** İnternet tabanlı maruz bırakma BDT, AD'de POEM'de Cohen d=0,75 (Hedman-Lagerlöf ve ark., JAMA Dermatol 2021;157:796-804; n=102 — **doğrulandı**). HRT + topikal steroid kombinasyonu (Norén & Melin 1989) [doğrulanmadı]. Telefon mikrofonuyla gece kaşıma tespiti: bildiğim bir yayın yok → **yok/doğrulanmadı**; akıllı saat ivmeölçeriyle tespit çalışmaları var [doğrulanmadı].
- **Mevcut uygulamalar:** Nia (Almanya, AD günlüğü/eğitim — site doğrulandı, özellik detayı doğrulanamadı), EczemaWise [doğrulanmadı], Itch Tracker (Apple Watch gerektirir) [doğrulanmadı], Eczema Care Online (web, İngiltere) [doğrulanmadı]. Hiçbiri **telefon mikrofonuyla gece kaşıma ölçüp** bunu HRT'ye bağlamıyor. Fark: donanımsız objektif ölçüm + kanıtlı BDT'nin kapalı döngüsü.
- **Teknik zorluklar ve çözüm:** Yatak partneri/çocuk odası karışıklığı → kullanıcı kalibrasyonu + yorgan altı kaşıma sesinin zayıflığı için yastık yakınına yerleştirme; gürültülü ortamda duyarlılık düşer → yalnızca sessiz gecelerde güven skoru; gece tonu uykuyu bozabilir → varsayılan kapalı. Klinik doğrulama için videolu polisomnografi altın standardı.
- **Regülasyon:** Semptom azaltma iddiasıyla CE-MDR Sınıf IIa / FDA Class II (dijital terapötik); yalnızca günlük+eğitim olarak Sınıf I. Pazar iddiası için RCT gerekir (POEM, gece kaşıma süresi).
- **Riskler:** Yanlış güven (kötüleşen AD'de ilaç tedavisinin gecikmesi) → kırmızı bayrak tarama; gizlilik (ses) → cihaz içi sınıflandırma; çocuklarda ebeveyn arayüzü.
- **Puanlama:** Teknik 6 | Kanıt 6 | Etki 8 | Yenilik 7 | Düşük risk 8 | **TOPLAM 35/50**

### Fikir 3: "Kaşıma Yerine Titreşim" — Kaşıntı atağında haptik karşı-uyarım + kaşıma ikamesi
- **Hedef hastalık ve hasta sayısı:** Kronik prürit (AD, ürtiker, kserozis, üremik/kolestatik kaşıntı, nörodermatit); dünyada kaşıntı ≈280 M (%4). Türkiye ≈3 M+.
- **Taklit edilen cihaz ve mekanizma:** Karşı-uyarım (soğuk, sürtme, ısı kalemi) ve kapı-kontrol tipi nöromodülasyon: kaşıntı, ağrılı/mekanik karşı-uyaranla baskılanır (Yosipovitch 2005; Ward 1996 — doğrulandı). Titreşim (Pacini/Meissner, Aβ lifleri) cildi yırtmadan benzer inhibisyon sağlayabilir [titreşime özgü kanıt doğrulanmadı].
- **Telefonda nasıl çalışır:** Kaşıntı başlayınca kullanıcı telefonun arkasını kaşınan bölgeye bastırır; uygulama 30–90 s boyunca 150–250 Hz'de kesikli haptik desen üretir (LRA motorlar bu bantta en güçlü); eşzamanlı 4-7-8 nefes/dikkat dağıtma; epizot günlüğü (zaman, bölge, şiddet 0–10) → günlük kaşıntı haritası ve HRT yarışan tepki alışkanlığı ("kaşıma yerine telefonu bastır"). Günde ihtiyaç halinde, 4–8 hafta alışkanlık oluşturma.
- **Kanıt:** Cihaz tarafında mekanik/termal karşı-uyarım deneysel kanıtı var; titreşimli ev cihazı yok. Telefon tabanlı versiyon: **yok**.
- **Mevcut uygulamalar:** Bildiğim kadarıyla yok [doğrulanmadı]. Fark: tamamen yeni kullanım; sıfır maliyet.
- **Teknik zorluklar ve çözüm:** Telefonun titreşim genliği düşük (BRIEF) → kasaya değil cilde doğrudan temas, yoğun desen; ulaşılamayan bölgeler (sırt) → uzun deri/kalın giysi üstünden etkisizleşir; etki süresi kısa (dakikalar) → amaç kaşıma-cilt hasarı döngüsünü kırmak, kaşıntıyı iyileştirmek değil. Önce 20 kişilik histamin-iyontoforez deneyi (araştırma ortamında) ile etki büyüklüğü ölçülmeli.
- **Regülasyon:** Semptom rahatlatma, invaziv değil → CE Sınıf I/IIa sınırı; FDA genel wellness olabilir. Küçük RCT yeterli.
- **Riskler:** Açık yara/enfekte cilde temas (hijyen uyarısı), telefon ısınması; etkisiz bulunursa hayal kırıklığı. Ciddi risk yok.
- **Puanlama:** Teknik 9 | Kanıt 3 | Etki 6 | Yenilik 8 | Düşük risk 9 | **TOPLAM 35/50**

### Fikir 4: "Yara Döngüsü" — Kronik yarada kamera ölçümü + IMU tabanlı yük bindirmeme ve bakım uyumu kapalı döngüsü
- **Hedef hastalık ve hasta sayısı:** Diyabetik ayak ülseri (diyabetlilerin yaşam boyu %19–34'ü [doğrulanmadı]), venöz bacak ülseri, bası yarası. Türkiye'de diyabetli ≈9 M → aktif ülser ≈100–200 bin [kaba tahmin]; dünya kronik yara ≈ nüfusun %1–2'si [doğrulanmadı].
- **Taklit edilen cihaz ve mekanizma:** NPWT ve kompresyon fizik olarak taklit edilemez; taklit edilen, **yük bindirmeme (offloading) uyumu izleyen akıllı ayakkabı/basınç sensörleri** ve yara ölçüm uygulamaları. Mekanizma: biofeedback + davranışsal uyum + erken kötüleşme tespiti.
- **Telefonda nasıl çalışır:** Haftada 2–3 kez kamera ile yara fotoğrafı; ölçek için telefonun derinlik/AR özelliği (ARKit/ARCore) ya da sabit mesafe rehberi; alan, kızarıklık, eksüda rengi takibi. Gün içinde IMU adım sayımı: diyabetik ayakta günlük adım hedefi aşılınca uyarı; venöz ülserde elevasyon ve kompresyon bandajı hatırlatmaları; bası yarasında pozisyon değiştirme zamanlayıcısı. Yara alanı 4 haftada %40 küçülmezse veya enfeksiyon işareti → teletıp sevk. Süre: iyileşene kadar (8–20 hafta).
- **Kanıt:** Offloading uyumu düşük ve uyum ile iyileşme ilişkili [doğrulanmadı]; yara fotoğrafı ile telemonitörizasyonun yüz yüze bakıma eşdeğerliği [doğrulanmadı]. Telefon-only tedavi versiyonu: **yok**.
- **Mevcut uygulamalar:** Swift Skin & Wound (ölçüm/dokümantasyon, tedavi değil — doğrulandı; işaret etiketi gerektirdiği [doğrulanmadı]), imitoWound, Tissue Analytics [doğrulanmadı]. Fark: hasta tarafında kapalı döngü davranışsal müdahale (adım/elevasyon/pansuman).
- **Teknik zorluklar ve çözüm:** Ölçek ve ışık standardizasyonu → AR derinlik veya referans nesne; adım sayımı telefon cepteyken ancak ölçülür; yaşlı/az okuryazar kullanıcı → sesli yönlendirme, bakıcı hesabı.
- **Regülasyon:** Yara ölçümü + karar desteği → CE Sınıf IIa, FDA Class II; klinik performans çalışması gerekir.
- **Riskler:** Enfeksiyonu kaçırma (yanlış güven) → kural tabanlı sevk eşikleri; fotoğraf gizliliği.
- **Puanlama:** Teknik 6 | Kanıt 5 | Etki 7 | Yenilik 5 | Düşük risk 6 | **TOPLAM 29/50**

### Fikir 5: "Akne Uyum Döngüsü" — Fotoğrafla akne sayımı + topikal tedavi uyum ve bekleme-öfke yönetimi
- **Hedef:** Akne (2015'te dünyada ≈633 M — doğrulandı; Türkiye ergen ≈10 M, orta-şiddetli ≈1,5–2 M [tahmin]).
- **Taklit edilen cihaz:** Cihaz değil; ışık cihazlarının yerini tutmaz. Mekanizma: davranışsal (topikal retinoid/BPO uyumu %50'nin altında [doğrulanmadı]) + kapalı döngü ilerleme görselleştirme.
- **Telefonda:** Haftalık standart pozlu yüz fotoğrafı (ön kamera, flaş sabit), cihaz içi lezyon sayımı, tahriş yönetimi, akşam hatırlatıcı, 12 hafta.
- **Kanıt:** Hatırlatıcıların akne uyumunu artırdığı küçük RCT'ler [doğrulanmadı]. 
- **Mevcut:** MDacne, Curology (teledermatoloji + ürün satışı) [doğrulanmadı]. Fark küçük → **"zaten var"a yakın**; yalnızca kayıt için.
- **Puanlama:** Teknik 8 | Kanıt 5 | Etki 6 | Yenilik 3 | Düşük risk 9 | **TOPLAM 31/50**

### Fikir 6: "Soğukkanlı Avuç" — Duygusal hiperhidrozda kamera-PPG HRV biofeedback + nefes eğitimi
- **Hedef:** Fokal hiperhidroz (ABD'de %2,8 — doğrulandı; Türkiye ≈2,4 M).
- **Taklit edilen cihaz:** İyontoforez taklit edilemez; taklit edilen, biofeedback cihazları. Mekanizma: sempatik aktivasyonu azaltma (HRV biofeedback, yavaş nefes).
- **Telefonda:** Parmak kamera-PPG ile HRV, 6 nefes/dk rezonans eğitimi, terleme tetikleyen durum öncesi 5 dk; 8 hafta.
- **Kanıt:** Biofeedback/hipnoz için hiperhidrozda eski küçük seriler [doğrulanmadı]; telefon versiyonu yok. Fizyolojik mantık zayıf: primer hiperhidroz çoğunlukla duygusal tetikleyiciden bağımsızdır.
- **Mevcut:** Genel HRV uygulamaları var; hiperhidroza özel yok.
- **Puanlama:** Teknik 8 | Kanıt 2 | Etki 4 | Yenilik 6 | Düşük risk 9 | **TOPLAM 29/50**

## 3. Alanın en iyi 3 fikri (sıralı) ve gerekçe
1. **Fikir 1 — "Elini Çek" (38/50):** Tek pazarda var olan çözüm bir bileklik; HRT kanıtı sağlam; kamera nirengi teknolojisi olgun; milyonlarca hasta tedavi görmüyor (utanç/erişim). Telefon kamerasının bileklik yerine geçebildiği ilk uygulama olur.
2. **Fikir 2 — "Gece Kaşıma Döngüsü" (35/50):** Davranışsal kısmı JAMA Dermatology 2021 RCT ile kanıtlı; gece kaşıma ölçümünün donanımsız yapılabilmesi yeni; AD hasta havuzu çok büyük. Sensör kısmı doğrulama çalışması ister.
3. **Fikir 3 — "Kaşıma Yerine Titreşim" (35/50):** Kanıt zayıf ama maliyet sıfır, risk yok, 2 haftalık deneyle test edilebilir; olumluysa kronik kaşıntıda kaşıma-hasar döngüsünü kıran ilk donanımsız araç olur. Fikir 2'nin içine modül olarak da gömülebilir.

## 4. "Yapılamaz" diye elenenler
- **Ekran/flaş ile mavi ışık akne tedavisi:** 0,3–0,55 mW/cm² (ekran) vs 44 mW/cm²; 460 nm vs 415 nm; 48 J/cm² için 27–270 saat. Mağazadaki "mavi ekran akne" uygulamaları kanıtsız → "zaten var ama işe yaramaz".
- **Ekran ile saç LLLT:** 0,3 mW/cm², seans 3,7 saat, saç engeli.
- **Flaş ile fotodinamik tedavi:** İlaç gerekir; ışık alan/ısı kısıtı.
- **NB-UVB / eksimer (psoriasis, vitiligo, AD, PMLE):** Telefon UV yaymaz.
- **İyontoforez / miraDry (hiperhidroz):** Elektrik/mikrodalga yok.
- **Kriyoterapi (siğil, molluskum):** Soğuk yok.
- **NPWT, kompresyon, hiperbarik O2 (yara):** Vakum/basınç/oksijen yok.
- **Basınç giysisi, silikon (skar):** Basınç/oklüzyon yok; masaj yönlendirmesinin kanıtı yetersiz.
- **Isı kalemi (böcek ısırığı), 1072 nm (herpes), lazerler (rozase, onikomikoz):** Kontrollü ısı/IR yok.
- **Sıcak hava (bit):** Yok.
- **Telefonun ısınan arkasıyla siğil hipertermisi (44 °C):** Kontrol edilemez, güvensiz → elendi.

## 5. Kaynaklar (URL)
Doğrulananlar (bu turda okundu):
- Hedman-Lagerlöf E ve ark. Internet-Delivered CBT for Atopic Dermatitis: RCT. JAMA Dermatol 2021;157(7):796-804 — https://jamanetwork.com/journals/jamadermatology/fullarticle/2779785
- Ablon G. Phototherapy with LEDs… J Clin Aesthet Dermatol 2018;11(2):21-27 (415 nm, 40 mW/cm², 48 J/cm²) — https://pmc.ncbi.nlm.nih.gov/articles/PMC5843358/
- Avci P ve ark. LLLT for Treatment of Hair Loss. Lasers Surg Med 2014 (3–90 mW/cm², 1–10 J/cm²) — https://pmc.ncbi.nlm.nih.gov/articles/PMC3944668/
- Omnilux Clear ürün sayfası (415/633 nm, 44 mW/cm², FDA) — https://omniluxled.com/products/omnilux-clear
- HabitAware Keen2/Keen3 (bileklik; TTM, dermatillomani, onikofaji) — https://habitaware.com/
- Swift Skin & Wound (ölçüm/dokümantasyon) — https://swiftmedical.com/
- Nia (AD uygulaması, Almanya) — https://www.nia-health.de/
- Wikipedia: Trichotillomania (prevalans, HRT) — https://en.wikipedia.org/wiki/Trichotillomania
- Wikipedia: Excoriation disorder (prevalans %1,4–5,4) — https://en.wikipedia.org/wiki/Excoriation_disorder
- Wikipedia: Atopic dermatitis (prevalans, fototerapi) — https://en.wikipedia.org/wiki/Atopic_dermatitis
- Wikipedia: Acne (2015: 633 M) — https://en.wikipedia.org/wiki/Acne
- Wikipedia: Itch (karşı-uyarım; ≈280 M) — https://en.wikipedia.org/wiki/Itch
- Wikipedia: Pattern hair loss (prevalans, LLLT) — https://en.wikipedia.org/wiki/Pattern_hair_loss
- Wikipedia: Hyperhidrosis (%2,8; iyontoforez ≈%80) — https://en.wikipedia.org/wiki/Hyperhidrosis
- Wikipedia: Light therapy (NB-UVB 311–313 nm, eksimer) — https://en.wikipedia.org/wiki/Light_therapy

Doğrulanamayanlar (bu turda erişilemedi; adı/yılı hafızadan, dikkatli kullanın):
- Norén P, Melin L. Br J Dermatol 1989 (HRT + topikal steroid, AD) — [doğrulanmadı]
- Woods DW, Twohig MP. Trichotillomania: An ACT-enhanced Behavior Therapy Approach, 2008 — [doğrulanmadı]
- Santer M ve ark. Eczema Care Online RCT, BMJ 2022 — [doğrulanmadı]
- Maruho "Itch Tracker" (Apple Watch), EczemaWise, TrichStop, SkinPick, Liberate, imitoWound, Tissue Analytics, MDacne, Curology, Virulite, Bite Away, AirAllé — ürün adları [doğrulanmadı]
- Telefon ekranı/flaşı irradyans değerleri — ölçülmedi, §0'daki varsayımlarla [hesaplanmış tahmin]
