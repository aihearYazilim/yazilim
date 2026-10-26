# Proje C — "Atak Anı" platformu: Bayılma Kalkanı + HipoDurdur (ortak tempo motoru, modüler atak-anı rehberi)

> Tarih: 26 Ekim 2026. Girdi: BRIEF, BRIEF-2, PROJE-SABLONU, 00-DEGERLENDIRME-ANINDA (§4.2, §4.5, §5.2), tarama-A (Fikir 2, 3, 4, 7, 8, 9), tarama-D (Fikir 1, 2, 4, 5, 6, 7), tarama-C (Fikir 3). Bu oturumda 26 web araması + 2 sayfa okuması yapıldı; sonuçlar "(bu turda teyit)" ya da "doğrulanmadı" diye işaretli. Web kotası dolmadı; mağaza (App Store / Google Play) içi arama bu ortamdan yapılamadı, §7'de ilk hafta görevi olarak bırakıldı.
> Rol: baş mimar + klinik araştırma lideri. Her sayı kaynaklı; emin olunmayan "doğrulanmadı". Telefon dışı donanım yok (hastanın kendi glukometresi/CGM'i **ölçüm** için kullanılır, uygulama ölçüm iddiası taşımaz).
> Kısaltmalar: PCM = fiziksel karşı-basınç manevrası; AMT = uygulamalı kas gerimi (applied muscle tension); VVS = vazovagal senkop (refleks bayılma); OH = ortostatik hipotansiyon (ayağa kalkınca tansiyon düşmesi); VVR = vazovagal reaksiyon (kan alma sırasında bayılma refleksi); T1D/T2D = tip 1/2 diyabet; CGM = sürekli glukoz ölçer; IMU = ivmeölçer+jiroskop; PPG = kamera-flaşla nabız; SaMD = tıbbi cihaz niteliğinde yazılım; RKÇ = randomize kontrollü çalışma.

---

## 0. Tek sayfalık özet

| Soru | Yanıt |
|---|---|
| **Ne** | Tek kod tabanlı, çevrimdışı, 3 saniyede açılan bir "atak anı" uygulaması. Ortak çekirdek: sesli adım adım yönlendirme (telefon elde ya da cepte, gözler kapalı), haptik tempo, zamanlayıcı, IMU ile duruş/yatış/kalkış tespiti, isteğe bağlı 30–60 s kamera-PPG nabız, kırmızı bayrak soruları → 112 + konum. Üstüne takılan modüller: **Bayılma Kalkanı** (vazovagal presenkop/OH için PCM; iğne/kan alma için AMT; hekim kilitli 500 mL su bolusu) ve **HipoDurdur** (bilinci açık hipoglisemide 15-15 kuralı: doz kartı, 15 dk sayaç, tekrar ölçüm, yanıt testi + kaçış araması, bakıcı kartı). Sonraki modüller kısa: Acil-Enjeksiyon, Bulantı-Anı, Kramp Çözücü, PanikDur/DispneAcil; SVT ve FOG yalnız hekim reçeteli ve koşullu. |
| **Kim için** | (a) Hekim tanılı, prodromlu (öncü belirtili) tekrarlayan VVS/OH hastaları ve kan bağışçıları/iğne korkusu olanlar; (b) insülin ya da sulfonilüre kullanan diyabetliler ve bakıcıları. |
| **Klinik sonlanım** | Bayılma Kalkanı: kan bağışı merkezinde VVR oranı (birincil, RKÇ); VVS hastasında 3–6 aylık senkop/presenkop sayısı (ikincil, pilot). HipoDurdur: atağın çözülme süresi (CGM ile <70 → ≥70 mg/dL), 15. dakikada çözülme oranı, 1 saat içinde tekrarlayan hipoglisemi, aşırı tedavi (2 saat içinde >180 mg/dL). |
| **Neden telefonla olur** | İki müdahale de **ilaçsız, cihazsız, hastanın kendi bedeniyle** yapılır (kas kasma; şeker yeme). Cihaz yerine geçilen şey yok; **yerine geçilen şey hekimin/hemşirenin poliklinikte bir kez anlattığı protokolün atak anında kulağa fısıldanması**. Telefonun hoparlörü, titreşim motoru, zamanlayıcısı ve IMU'su bunun için yeterli ve fazlası. |
| **Neden şimdi** | PCM için RKÇ 20 yıldır var (PC-Trial 2006) ama hastaya ulaşmıyor; AMT için 4.320 donörlük RKÇ (Meher 2024) var ama Türkiye'de kan merkezi dışında kimse bilmiyor. 15-15 kuralı standart bakım ama ilk dozla hastaların ~1/3'ü düzelmiyor, ikinci tur ve zamanlama kaçırılıyor. iOS 18 kilit ekranı kontrolleri ve Android 16 QPR2 kilit ekranı widget'ları "3 saniyede aç" hedefini ilk kez gerçekçi kıldı (bu turda teyit). |
| **Kanıt sınırı (dürüst)** | Manevra/protokol düzeyinde kanıt orta-güçlü; **telefon sürümü için hiçbir RKÇ yok** (bu turda yeniden arandı: senkop PCM uygulaması ve 15-15 zamanlayıcı uygulaması çalışması bulunamadı). "Anında" iddiası: PCM saniyeler içinde kan basıncını yükseltir (Krediet 2002, n=21); hipoglisemi 10–20 dk'da çözülür. İkisi de **geçici**: atağı bitirir/önler, hastalığı tedavi etmez. |
| **12 ayda nereye varır** | Ay 3: Bayılma Kalkanı MVP + ortak motor, 20 cihazda teknik doğrulama. Ay 6: Kızılay/üniversite kan merkezinde RKÇ başladı (n≈2.100–2.300, 2 kol); HipoDurdur MVP ve 40 hastalık T1D pilotu etik onayında. Ay 9: HipoDurdur pilot verisi; Acil-Enjeksiyon "Acil Anı" ayrı paket olarak IIa yoluna girdi. Ay 12: RKÇ ara analizi (n≈%50); mağazada Sınıf I "Atak Anı" (Bayılma Kalkanı + HipoDurdur + Bulantı/Kramp "deneysel"); go/no-go: VVR'de anlamlı düşüş ya da en az "tüm kullanıcılarda manevra uyumu >%70". |

---

## 1. Klinik hedef ve hasta

### 1.1 Modül A — Bayılma Kalkanı

| Başlık | İçerik |
|---|---|
| **Hedef durumlar** | (A1) Prodromlu tekrarlayan vazovagal (refleks) senkop/presenkop; (A2) ortostatik hipotansiyon ve yemek sonrası hipotansiyon (yaşlı, Parkinson, diyabetik otonom nöropati, ilaç kaynaklı); (A3) kan bağışı / flebotomi / aşı / damar yolu sırasında vazovagal reaksiyon (VVR) ve kan-iğne korkusu. |
| **Dahil etme** | A1–A2: **hekim tanısı** (senkop polikliniği, kardiyoloji, nöroloji, geriatri, aile hekimi) + tanınabilir prodrom (baş dönmesi, sıcak basması, terleme, bulantı, görme kararması, kulak çınlaması) + ≥1 atak/yıl. A3: 18+ (çocukta ebeveyn/sağlıkçı tetikli), kan merkezine başvuran herkes; iğne modu için tanı gerekmez (AMT sağlıklı kişide de kullanılır). |
| **Hariç tutma** | Kırmızı bayrak (§2.1 tablo): eforla ya da sırtüstü senkop, çarpıntıyla senkop, prodromsuz ani bayılma, ani kardiyak ölüm aile öyküsü (<40 yaş), bilinen yapısal kalp hastalığı (aort stenozu, HOCM, KY), EKG anormalliği öyküsü, yeni nörolojik belirti → uygulama "hekime git" der, ilerlemez. Su bolusu alt modülü: kalp yetmezliği, ileri böbrek yetmezliği/diyaliz, hiponatremi, sıvı kısıtı → **hekim kilidi** kapalı kalır. |
| **Birincil sonlanım** | A3 RKÇ: bağış sırasında/sonrasında **VVR oranı** (merkezin standart hemovijilans tanımı; hafif+orta+ağır). A1 pilot: 3 aylık senkop + presenkop sayısı (günlük). |
| **İkincil** | Manevra başlatma gecikmesi (prodrom → ilk komut, s), manevra uyumu (IMU'da ≥30 s kasma örüntüsü), kullanıcı bildirimli "bayılma iptal oldu" oranı, SUS kullanılabilirlik, yanlış tetik oranı; A3'te bağışı tamamlama ve tekrar bağışa dönüş. |
| **"Tedavi" iddiasının sınırı** | Atağı **önler/sonlandırır**; hastalığı iyileştirmez. PC-Trial'daki 14 aylık nüks azalması (%50,9 → %31,6) bir **eğitim** etkisidir; uygulama bunu "nüksü azaltabilir" diye ancak kendi RKÇ'siyle söyleyebilir. İlacın yerine değil (VVS'de ilaç zaten birinci basamak değil); hekim tanısı şart, manevra kendi kendine. |
| **Hasta sayısı** | Yaşam boyu senkop kümülatif insidansı ~%35 (Ganzeboom 2006 — **doğrulanmadı**, bu turda bulunamadı). 65+ OH prevalansı ~%20 (doğrulanmadı); Türkiye 65+ 9,58 M → 1–2 M (tarama-D). Türk Kızılay 2024'te ~2,7 M, 2025'te 3.041.277 ünite kan topladı (Genel Sekreter açıklaması, bu turda teyit — resmi faaliyet raporu görülmedi). Konya (NEÜ Transfüzyon Merkezi, n=742, 2024): VVR %4,9 (bu turda teyit) → Türkiye'de yılda kabaca 75–150 bin VVR olayı (kendi hesabım; merkezler arası fark büyük). |

### 1.2 Modül B — HipoDurdur

| Başlık | İçerik |
|---|---|
| **Hedef durum** | İnsülin ya da sulfonilüre/glinid kullanan diyabetlide **bilinci açık, yutabilen** hipoglisemi atağı (Düzey 1: 54–69 mg/dL; Düzey 2: <54 mg/dL — ADA tanımı, bu turda teyit). Düzey 3 (bilinç değişikliği, yardım gerektirir) → bakıcı kartı + 112; uygulama hastaya "ağızdan verme" der. |
| **Dahil etme** | Hekim/diyabet hemşiresi tarafından 15-15 eğitimi almış, hipoglisemi riski olan ilaç kullanan 12+ yaş (çocukta ebeveyn profili); kendi glukometresi ya da CGM'i olan. "Ölçemiyorum ama belirtim var" seçeneği ADA'ya uygun olarak açık. |
| **Hariç tutma** | Hipoglisemi farkındasızlığı olan ve yalnız yaşayan hastada uygulama tek güvenlik aracı olamaz (CGM + bakıcı şart; uygulama bunu onboarding'de söyler). Gebelik, böbrek yetmezliği, sulfonilüre → **uzamış hipoglisemi uyarısı** ve daha sıkı tekrar ölçüm (sulfonilüre hipoglisemisinde 12–24 saat gözlem literatürü — bu turda teyit, resmi kılavuz değil toksikoloji derlemeleri). |
| **Birincil sonlanım (pilot)** | CGM'de atak çözülme süresi (<70 mg/dL'den ≥70'e, dk) ve 15. dakikada çözülme oranı; literatür temel değeri %58–71 (T1D derlemesi, tarama-D [1]). |
| **İkincil** | 60 dk içinde tekrarlayan hipoglisemi; 2 saatte >180 mg/dL (aşırı tedavi); uygulama açma gecikmesi; yanıt testi yanlış alarm oranı; bakıcı arama sayısı; kullanıcı güveni/anksiyete (HFS-II). |
| **İddia sınırı** | **Atağı bitirir** (o atak için kalıcı); diyabeti tedavi etmez. Standart bakımın (ADA/ISPAD) uygulanmasını kolaylaştırır; **ölçüm yapmaz, ilaç önermez**. Doz kartı hekim onaylı sınırlar içindedir. Hekim gözetimi gerekmez (hasta eğitimi niteliği), ama doz hesabı regülasyonda "karar desteği" sayılabilir (§6). |
| **Hasta sayısı** | Türkiye 8,7–9,6 M diyabetli (TÜSEB 2019 / IDF 2025, tarama-D); insülin kullanan oran kaba %20–25 → ~2 M (**doğrulanmadı**). 20 yaş altı T1D >26.000 (TÜSEB 2019, bu turda teyit). HAT çalışması (Khunti 2016, 27.585 kişi, 24 ülke): T1D'de 4 haftalık prospektif dönemde %83, insülinli T2D'de %46,5 en az bir hipoglisemi bildirdi (bu turda teyit); T1D'de yıllık 22–73 olay/hasta-yıl aralığı (karşılaştırma yazısı, bu turda teyit). Yani T1D hastası haftada kabaca 0,4–1,4 atak yaşar → uygulama "ayda birkaç kez" kullanılır. |

### 1.3 Diğer modüller (kısa)

| Modül | Hedef | Dahil/hariç kritik kural | Sonlanım |
|---|---|---|---|
| Acil-Enjeksiyon (anafilaksi, hidrokortizon, glukagon) | Oto-enjektör reçeteli kişi + bakıcı/okul | Hekim eylem planı yüklü; ilk komut 2 s içinde "ŞİMDİ ENJEKTE ET" | Simülasyonda adım doğruluğu ve enjeksiyon gecikmesi (RKÇ etik olarak zor) |
| Bulantı-Anı (P6 parmak + 6/dk nefes + IMU görsel ipucu) | Kemoterapi, PONV, gebelik, taşıt | "İlaç yerine değil, ilaca ek"; 3 dk'da düzelmezse antiemetik basamağı | NRS bulantı 0–10 önce/sonra; sham-kontrollü (haptik açık/kapalı) mini RKÇ |
| Kramp Çözücü | Gece/egzersiz krampı | DVT/kompartman uyarısı; yatakta yap | Çözülme süresi (kullanıcı bildirimi) |
| PanikDur / DispneAcil (solunum alt-motoru) | Panik/hiperventilasyon; KOAH dispne krizi | Astım/kardiyak dispne "panik" sanılmasın → kırmızı bayrak; 6/dk altına inilmez | Atak süresi; eskalasyon oranı |
| SVT Durdurucu (koşullu) | Hekim tanılı PSVT, "evde Valsalva deneyin" denmiş hasta | **Tanı koymaz**; PPG yalnız "nabız" etiketi; 2 başarısız → 112 | Hekim profilli, ayrı reçete kodu ile açılır |
| Donma-Kırıcı FOG (koşullu) | Parkinson FOG | Cepte sürekli IMU → pil/izin; yalnız "Parkinson modu" | Donma süresi (video) |

---

## 2. Klinik protokol

### 2.1 Bayılma Kalkanı — protokol

**Türetildiği kaynaklar:** PC-Trial (van Dijk 2006, JACC 48:1652; n=223; eğitim = bacak çaprazlama + kas gerimi, el kavrama, kol gerimi; nüks %50,9 → %31,6, RRR %39, yan etki yok — bu turda teyit); tilt çalışmaları (Krediet 2002: bacak çaprazlama + kasma ile prodrom tüm hastalarda kayboldu; Brignole 2002: kol gerimi ile %63 vs %11 asemptomatik — tarama-A/D); AMT: Ditto 2003 (n=37), Meher 2024 (Transfusion Medicine 34:20; 4 kol × ~1.080; VVR kontrol %2,5, su+AMT %0,9; su-yalnız ve AMT-yalnız kol oranları özette yok — bu turda teyit; 2023 meta-analiz, 3 RKÇ, AMT RR 0,51 [0,37–0,69] — bu turda teyit); su bolusu: Lu 2003 (Circulation 108:2660; n=22 sağlıklı, 473 mL su tiltten 5 dk önce; ilk 30 dk'da presenkop 8/22 → 1/22, tilt toleransı +%26 — bu turda teyit), Schroeder 2002 (500 mL, +5 dk), Jordan 2000 (otonom yetmezlikte SKB +33–37 mmHg, tepe 30–35 dk). ESC 2018 senkop kılavuzu PCM'yi prodromlu refleks senkopta önerir (sınıf IIa, B — bellekten, **doğrulanmadı**; kılavuz tablosu bu turda okunamadı).

**Seans A0 — tek seanslık eğitim (12–15 dk, onboarding'de zorunlu):**

| Adım | Süre | İçerik | Doğrulama |
|---|---|---|---|
| 1 | 2 dk | Prodrom tanıma: 8 belirti kartı; kullanıcı kendi "ilk üç belirtisini" seçer, sıralar; "ilk belirtide başla, bekleme" kuralı | Seçim kaydedilir, atak modunda ilk soru olur |
| 2 | 3 dk | Manevra 1: bacak çaprazlama + uyluk/kalça/karın kasma — ayakta, oturarak ve yatarak üç varyant | IMU: telefon elde/cepte iken kasma sırasındaki 0,5–3 Hz mikro-titreşim artışı ve gövde sabitliği (kabul ölçütü §3) |
| 3 | 2 dk | Manevra 2: kol gerimi (eller kenetli, kollar dışa çekilir) | Haptik 1 Hz tempo ile 15 s tut / 5 s bırak × 2 |
| 4 | 2 dk | Manevra 3: el kavrama (yumruk/top sıkma) | Aynı tempo |
| 5 | 3 dk | **İsteğe bağlı biofeedback:** parmak arka kamera-PPG 30 s dinlenim → 30 s kasma: nabız ve PPG genliği değişimi gösterilir ("kasınca vücudun yanıt veriyor") | PPG yalnız nabız sayısı; tansiyon iddiası yok (telefon TA ölçemez) |
| 6 | 1 dk | Güvenlik: "otur ya da yat, yere yakın ol; manevra 2 dk'da geçmezse yat, bacakları kaldır; bilinç kaybı/çarpıntı/göğüs ağrısı → 112" | Kırmızı bayrak kartı kabulü |

**Atak modu (A1/A2):**

| t | Komut (sesli + ekranda tek satır büyük yazı + haptik) | IMU / sensör | Dal |
|---|---|---|---|
| 0 s | "Bayılma Kalkanı. Oturabiliyorsan otur. Bacaklarını çaprazla, SIK." | Açılışta telefonun yönü/hareketi okunur; yürüyorsa "dur, otur" ilk komut | — |
| 0–30 s | "Sık… sık… sık…" 1 Hz haptik; 10. saniyede "nefesini tutma, sayarak sık" (Valsalva önleme — PC-Trial eğitiminin parçası) | Gövde hareketsizliği; kasma örüntüsü algılanmazsa 15. saniyede "daha sert, uyluk ve karın" | — |
| 30 s | "Geçti mi? Evet için ekrana bir kez dokun / 'geçti' de. Geçmediyse devam." | Dokunma yoksa 10 s sonra otomatik devam | Geçti → 60 s "otur, bekle" + yavaş kalkış rehberi (IMU: kalkış >1,2 m/s² ise "daha yavaş") |
| 30–90 s | "Kollarını kenetle, dışa çek" / "ellerini sık" (kullanıcının eğitimde seçtiği 2. manevra) | — | — |
| 90 s | "Hâlâ kötüyse YAT. Bacaklarını yükselt. Telefonu yanına koy." | IMU: yatay pozisyon algılanır → sayaç 2 dk | Yatıştan 3 dk sonra düzelme yok ya da yanıt yok → §2.4 eskalasyon |
| Sonrası | 30 s olay kaydı: tetik (ayakta durma, sıcak, kan görme, ağrı, öğün atlama), süre, bayıldı mı? | — | Hekime PDF (isteğe bağlı) |

**A2 sabah protokolü (OH; hekim kilidi "su bolusu" açıksa):** yatakta 1 dk otur → 500 mL su (bardak görseli; 5 dk içinde) → 5 dk bekle (Lu 2003'te etki 5 dk'da başlıyor, Jordan 2000'de tepe 30–35 dk) → bacak çaprazlama 30 s → "yavaş kalk" (IMU). Yemek sonrası modu: büyük öğünden sonra 30–60 dk "oturarak kal; kalkarken PCM" hatırlatması (tek seferlik, günlük rutin değil — hasta isterse kapatır).

**A3 iğne/kan bağışı modu (AMT):** "Kan vereceğim/iğne olacağım" → iğneden 2 dk önce başla → 5 s kas (kol dışı tüm büyük kaslar: bacak, kalça, karın, serbest kol) / 5 s gevşe haptik döngüsü; iğne girerken, çıkarılırken ve kalkmadan önce vurgulu döngü; telefon cepte ya da serbest elde, ekran bakılmaz (Lifeblood/Meher protokolü; Öst'ün applied tension'ı: kasmayı yüzde sıcaklık hissedene kadar sürdür, 20–30 s ara, 5 tekrar — ikincil kaynak, bu turda teyit). Su: bağıştan 30 dk önce 500 mL (Meher 2024 kombine kol; sağlıklıda kontrendikasyon yok; kalp/böbrek sorusu yine sorulur). Süre: işlem + 5 dk.

**Sapmalar ve gerekçe:** PC-Trial'da eğitim hekim/hemşire tarafından poliklinikte verildi ve hastalar manevrayı evde kendileri yaptı — yani asıl müdahale zaten kendi kendine; uygulama yalnız eğitimi standartlaştırır ve atak anında hatırlatır. Sapma: **biofeedback'in kamera-PPG ile verilmesi** (PC-Trial'da TA ölçümüyle). PPG nabız/genlik değişimi TA'nın vekili değildir; bu yüzden "isteğe bağlı" ve iddiasızdır. AMT'de Meher 2024'ün donör merkezinde personel eğitimi vardı; uygulama bunu yerinde sesli-haptik yapar — bu dağıtım farkı RKÇ'de test edilecek şeyin ta kendisidir.

### 2.2 HipoDurdur — protokol

**Türetildiği kaynaklar:** ADA Standards of Care 2025 §6 (15 g hızlı karbonhidrat, 15 dk'da tekrar ölç, düzelene kadar tekrarla; glukagon insülin kullanan herkese reçete; bilinci kapalıya ağızdan verme — ADA materyalleri bu turda teyit; birincil metin okunmadı). ISPAD 2022 (Abraham ve ark., Pediatr Diabetes, doi 10.1111/pedi.13443): ~0,3 g/kg oral glukoz (30 kg çocuk 9 g; >50 kg 15 g), 15 dk'da tekrar ölç, otomatik insülin sistemi kullananlarda 5–10 g ile daha az doz (bu turda teyit). T1D sistematik derlemesi: 15 g ile 10 dk'da %63, 0,3 g/kg ile %71 çözülme (tarama-D [1]). Hastane retrospektifi (57.629 olay): sabit 15 g ile 45 dk'da %67,5 hedefte (tarama-D [2]).

| Adım | Süre | İçerik | Güvenlik kuralı |
|---|---|---|---|
| 0 | 0–3 s | Kilit ekranı/ widget "ŞEKERİM DÜŞTÜ" → tam ekran, hoparlör açık, parlaklık tam | Bilişsel yavaşlama için tek soru/tek ekran; her şey sesli okunur |
| 1 | 10 s | "Yutabiliyor musun, bilincin açık mı?" (büyük EVET / BAKICI). BAKICI → §2.3 | Hayır/yanıt yok → bakıcı kartı |
| 2 | 15 s | "Ölçtün mü?" → değer girişi büyük tuşlar; "ölçemiyorum, belirtim var" → tedaviye geç (ADA) | <54 mg/dL ya da belirti ağır (konfüzyon, konuşma bozukluğu) → "yanında biri var mı?" + yanıt testi sıklaştır |
| 3 | 30 s | **Doz kartı**: profilde kilo/yaş → hedef gram: yetişkin 15 g (ADA); çocuk ≈0,3 g/kg, en az 5 g, en fazla 15 g (ISPAD); pompa/hibrit kapalı döngü kullanan: 5–10 g (ISPAD) — **hekim onaylı profil**. Türkiye eşdeğerleri (etiketten doğrulanacak, §10): 4 glukoz tableti (4 g'lık) ≈ 3–4 kesme şeker (≈4 g/adet, **doğrulanmadı**; etiket) ≈ 150–200 mL meyve suyu (100 mL'de 10–13 g; Migros etiketleri, bu turda teyit) ≈ 1 yemek kaşığı bal (~17 g, **doğrulanmadı**) ≈ yarım kutu normal kola. Sesli: "Elindekini söyle" → tek seçim | Çikolata/süt/kuruyemiş "yavaş, bunu değil" uyarısı; aşırı tedavi uyarısı |
| 4 | 15 dk | Geri sayım: ekranda büyük sayaç + her 5 dk haptik; sesli "araç kullanma, yatma, insülin yapma, yalnız kalma" | **Yanıt testi:** 5. ve 10. dakikada "ekrana dokun / 'buradayım' de"; 20 s'de yanıt yoksa tekrar; iki ardışık yanıtsızlık → §2.4 eskalasyon |
| 5 | 1 dk | "Tekrar ölç." ≥70 ve belirti yok → adım 6; <70 ya da belirti sürüyor → adım 3 (2. tur); 3. turda da <70 → "yakınını ara, 112'yi düşün" (ADA/CDC: tekrarla; çözülmeyen hipoglisemi tıbbi yardım gerektirir) | Sulfonilüre profili: "24 saat tekrar riski; 1–2 saatte bir ölç" uyarısı (toksikoloji derlemeleri, bu turda teyit) |
| 6 | 1 dk | Uzun etkili atıştırmalık hatırlatması (öğün >1 saat uzaktaysa); **sürüş uyarısı**: "45 dakika araç kullanma" (DVLA/İngiltere kuralı: finger-prick ≥5,0 mmol/L (90 mg/dL) olduktan 45 dk sonra — bu turda teyit; ADA'da süre belirtilmiyor; Türkiye Karayolları Trafik mevzuatında eşdeğer kural **doğrulanmadı** → hekim onayıyla metin) | — |
| 7 | 30 s | Olay kaydı: saat, değer(ler), doz, neden (egzersiz/doz/öğün atlama/alkol), tekrar sayısı → hekime PDF/CSV | Rebound hiperglisemi uyarısı |

**Sapmalar ve gerekçe:** Protokol birebir ADA/ISPAD; tek ekleme **yanıt testi + kaçış araması** ve kiloya göre doz kartıdır. Yanıt testi tıbbi müdahale değil, güvenlik ağıdır; yanlış alarm (hasta telefonu bırakıp mutfağa gitti) → eskalasyon kademeli (önce sesli uyarı 30 s, sonra yakına SMS, 112 yalnız kullanıcı onayıyla, §3.6).

### 2.3 Bakıcı kartı (HipoDurdur içinde) ve glukagon

"Bilinci kapalı / yutamıyor" → hoparlör: (1) "Ağızdan hiçbir şey verme." (2) "Yan yatır." (3) "112'yi ara" (tek dokunuşla arama ekranı). (4) "Glukagon var mı?" → **ürün prospektüsünün** sesli özeti: GlucaGen HypoKit (Türkiye'de ruhsatlı, TİTCK KÜB 2019 — bu turda teyit; çocukta <25 kg 0,5 mg, >25 kg 1 mg): tozu çözücüyle karıştır, uyluk/kol kasına enjekte et; burun içi Baqsimi: Türkiye ruhsatı **doğrulanmadı** (EMA onaylı, 2019) → yalnız "varsa" dalı. (5) "10–15 dk'da uyanmazsa 112'ye tekrar bildir; uyanınca ağızdan şeker + öğün." Bu kart hasta eğitimi içeriğidir; **adım adım ilaç uygulama rehberi** (ikinci doz zamanlayıcısı vb.) regülasyon gereği "Acil Anı" paketinde (§6).

### 2.4 Ortak eskalasyon ve kırmızı bayrak motoru

| Tetik | Eylem |
|---|---|
| Onboarding kırmızı bayrağı (Bayılma: eforla/sırtüstü/çarpıntılı senkop, prodromsuz, aile öyküsü, yapısal kalp hastalığı; Hipo: yalnız yaşayan + farkındasızlık; SVT/FOG: hekim kodu yok) | Modül kilitli kalır; "hekimine danış" + yazdırılabilir özet |
| Atak sırasında: göğüs ağrısı, nefes darlığı, çarpıntı, tek taraflı güçsüzlük/konuşma bozukluğu (hipoglisemi vs inme!), bilinç kaybı bildirimi, nöbet | Manevra durdurulur, "112'yi ara" tam ekran; tek dokunuşla arama ekranı + konum metni panoya |
| Yanıt testi: 2 ardışık yanıtsızlık (HipoDurdur) ya da yatış pozisyonunda 3 dk hareketsizlik + yanıt yok (Bayılma) | 30 s yüksek sesli uyarı → önceden tanımlı yakına SMS + konum (kullanıcı önceden izin verdi) → ekranda "112" düğmesi (otomatik arama **yapılamaz**, §3.6) |
| IMU ani darbe (>3 g) + 10 s hareketsizlik (telefon cepte/elde iken) | "İyi misin?" sesli; 30 s yanıt yoksa yakına SMS. Telefon masadaysa algılanmaz → onboarding'de açıkça söylenir ("isteğe bağlı, güvenilir değil") |
| 3 tur 15-15 sonrası <70; 3 dk yatışa rağmen presenkop; manevra sırasında bayılma | "Yardım çağır" + yakın + 112 düğmesi |

Kontrendikasyonlar: PCM'de yok (PC-Trial: yan etki yok); **Valsalva'dan kaçın** (nefes tutarak ıkınma). Su bolusu: KY, ileri KBY, hiponatremi, sıvı kısıtı. AMT: yok (kan alınan kolu kasma). 15-15: bilinci kapalı/yutamayan; çiğneme/yutma güçlüğü; ağızdan beslenemeyen.

---

## 3. Teknik mimari

### 3.1 Katmanlar

```
[Kilit ekranı girişleri] iOS: Lock Screen Control (iOS 18), Action Button (15 Pro+), Back Tap, Siri App Shortcut
                         Android: Lock screen widget (16 QPR2+), Quick Settings Tile (TileService), ana ekran widget, Assistant App Action, çift güç tuşu (OEM)
          │
[Launcher] 3 s bütçe: soğuk başlatma ≤1,2 s; modül seçimi ≤0,5 s; ilk sesli komut ≤3 s (ölçülecek, §3.7)
          │
[Ortak motor — "AtakCore" (Kotlin Multiplatform + ortak protokol DSL)]
   ├─ ProtocolRunner: JSON/DSL ile tanımlı adım makinesi (komut, süre, dal, soru, sensör koşulu)
   ├─ VoiceOut: önceden kaydedilmiş Türkçe ses dosyaları (TTS'e bağımlı değil; çevrimdışı; kadın/erkek; 1,0×/0,8× hız)
   ├─ Haptics: tempo motoru (1 Hz kasma, 0,1 Hz = 6/dk nefes, 5 s/5 s AMT, 15 dk sayaç vuruşu); iOS CoreHaptics / Android VibrationEffect.createWaveform
   ├─ Timers: ön planda sayaç + arka plan bildirimi (ekran kapansa da 15 dk sayacı devam; local notification)
   ├─ Posture (IMU 50–100 Hz): dik/oturur/yatar; kalkış hızı; darbe+hareketsizlik; kasma mikro-titreşimi (deneysel)
   ├─ PPG (isteğe bağlı): arka kamera + flaş 30–60 s → nabız (bpm) + genlik; "ritim" yok
   ├─ Escalation: kırmızı bayrak soruları, yakın SMS + konum, 112 ekranı
   ├─ EventLog: olay kaydı (yerel, şifreli), hekim PDF/CSV dışa aktarımı
   └─ Profile: hekim kilitleri (su bolusu, doz sınırı, SVT/FOG kodu), kontrendikasyon anketi
          │
[Modüller — her biri bir protokol paketi + içerik]: BayilmaKalkani, HipoDurdur, BulantiAni, Kramp, PanikDur/DispneAcil, (AcilAnı paketi: AcilEnjeksiyon, NobetYaninda, CPR/Heimlich, YerdenKalk), (koşullu: SVT, FOG)
```

Teknoloji kararı: **native iki uygulama + paylaşılan Kotlin Multiplatform çekirdek** (protokol makinesi, sensör işleme, günlük) — kilit ekranı/haptik/ses/arka plan API'leri her platformda native gerektirir; Flutter/RN'de kilit ekranı kontrolleri ve CoreHaptics sarmalayıcıları eksik. Alternatif: Flutter + platform kanalları (daha hızlı MVP, daha fazla teknik borç). Proje sahibi kararı (§10).

### 3.2 "3 saniyede aç" — platform kısıtları (bu turda teyit edilenler)

| Platform | Yol | Gerçek | Kısıt |
|---|---|---|---|
| iOS 18+ | **Kilit ekranı kontrolleri**: Fener/Kamera yerine üçüncü taraf kontrol; "herhangi bir uygulamayı aç" kontrolü var (MacRumors/MacStories, bu turda teyit) | Dokun → Face ID otomatik → uygulama açık ≈1–2 s | Uygulama açılması **kilit açmayı gerektirir** (Face ID/Touch ID anında); geliştirici forumlarında kilitli cihazda App Intent çalıştırmanın desteklenmediği bildiriliyor (bu turda teyit). Yüz tanıma başarısız (karanlık, yatıyor) → parola → 5–8 s |
| iOS | Action Button (iPhone 15 Pro ve sonrası), Back Tap (erişilebilirlik; arka kapağa 2–3 vuruş → Kısayol) | Fiziksel/dokunsal tetik, ekrana bakmadan | Cihaz alt kümesi; Back Tap kılıfla güvenilmez |
| iOS | Siri App Shortcut: "Hey Siri, Bayılma Kalkanı" | Eller serbest | Kilitliyken üçüncü taraf uygulama açma kısıtlı; gürültülü ortam |
| Android 16 QPR2+ | **Kilit ekranı widget'ları** (Pixel'de Ayarlar > Ekran > Kilit ekranı; sola kaydır; sayfa başına 3 widget) (Android Authority, bu turda teyit) | Dokun → etkinlik | Widget'tan uygulama başlatma **kimlik doğrulama ister**; geliştirici kendi etkinliğinde `android:showWhenLocked="true"` ile kilit üstünde gösterebilir (bu turda teyit; davranış OEM'e göre değişir — Samsung/Xiaomi testi şart) |
| Android 7+ | **Quick Settings Tile** (TileService): bildirim gölgesinden tek dokunuş; `startActivityAndCollapse(PendingIntent)` (API 34+; Intent sürümü kullanımdan kalktı); kilitliyse `isLocked()`/`isSecure()` kontrolü ve `showWhenLocked` etkinlik, yoksa `unlockAndRun` (bu turda teyit) | Kilit ekranından 2 kaydırma + 1 dokunuş ≈ 2 s | Kullanıcı tile'ı bir kez eklemeli; onboarding'de rehber |
| Android | Ana ekran widget (1×1 "ATAK"), Assistant App Actions, OEM çift güç tuşu/yan tuş ataması (Samsung) | — | OEM'e bağlı |
| Her ikisi | **"Hazır ol" modu**: kan bağışı/aşı öncesi ya da "bugün kötüyüm" → uygulama açık, ekran kapanmaz (`isIdleTimerDisabled` / `FLAG_KEEP_SCREEN_ON`), tek dokunuş | En güvenilir yol | Pil; yalnız kullanıcı başlatırsa |

Sonuç: "3 s" hedefi **iOS 18 kilit ekranı kontrolü + Android Quick Settings tile** ile çoğu cihazda tutturulabilir; eski cihazlarda ana ekran widget'ı 4–6 s. Kabul ölçütü §3.7. Prodrom 10–30 s olduğundan, Bayılma Kalkanı'nın asıl değeri eğitim + "hazır ol" modudur; atak modu "mümkünse" katmanıdır (00-DEGERLENDIRME §4.2 ile uyumlu).

### 3.3 Sensör algoritmaları ve beklenen doğruluk

| Ölçüm | Algoritma | Beklenen doğruluk | Referans doğrulama |
|---|---|---|---|
| Duruş (dik/oturur/yatar) | İvmeölçer yerçekimi vektörü (düşük geçiren 1 Hz) → gövde açısı; telefon elde/cepte ayrımı için 5 s pencere varyansı | Yatış tespiti >%95 (cepte); elde belirsiz | 20 gönüllü × 5 pozisyon × 3 taşıma biçimi; hedef: yatış duyarlılık ≥%90 |
| Kalkış hızı | Dikey ivme integrali 2 s pencerede (jiroskop ile yön düzeltme) | ±%20 | Video (30 fps) ile 20 kalkış × 10 kişi |
| Darbe + hareketsizlik | |a| > 3 g tepe + 10 s içinde RMS <0,1 g | Yanlış pozitif: telefon düşürme | "İsteğe bağlı, güvenilmez" etiketi; yalnız SMS, 112 yok |
| Kasma örüntüsü (deneysel) | Elde/cepte telefon: izometrik kasılma sırasında 5–15 Hz fizyolojik tremor artışı; RMS eşik | **Bilinmiyor** — literatür yok (doğrulanmadı) | Faz A'da 20 kişide EMG'siz, görsel gözlemle; başarısızsa kaldırılır, uyum kullanıcı dokunuşuyla ölçülür |
| Kamera-PPG nabız | Arka kamera + flaş, yeşil kanal ortalama, 30 s, bant geçiren 0,7–3 Hz, tepe sayımı | Dinlenimde EKG'ye göre ±2–5 bpm (2018 doğrulama, tarama-A) | Pulse oksimetre ile 30 kişi; hedef MAE <5 bpm; "ritim/tansiyon" iddiası yok |
| Solunum hızı (PanikDur; sonraki faz) | Mikrofon 10–15 s nazal/trakeal ses zarfı | r²≈0,97 küçük çalışmalar (tarama-A) | Sonraki faz |
| Hipoglisemi tespiti | **Yapılmaz** (telefon glukoz ölçemez; tarama-D) | — | Ürün iddiası yok |

### 3.4 Çevrimdışı ve arka plan

- Tüm içerik (ses dosyaları ~40 MB, protokoller, kartlar) uygulama paketinde; ağ yalnız SMS/arama/PDF paylaşımı için. İlk açılışta indirme yok.
- 15 dk sayacı: ön planda ekran açık tutulur; kullanıcı kilitlese bile yerel bildirim + haptik ile 5/10/15. dakika; iOS'ta arka plan ses oturumu (sessiz ses) ile sayaç ve sesli komut sürdürülür (App Store inceleme riski: "background audio" gerekçesi belgelenmeli). Android: Foreground Service (`mediaPlayback` türü) + tam ekran bildirim.
- IMU dinleme yalnız atak modunda (dakikalar); sürekli dinleme **yok** (FOG modülü hariç — bu yüzden koşullu).
- Pil: atak modu 5 dk'da ≈%1; PPG 60 s flaşla ≈%0,5 (tahmin; ölçülecek).

### 3.5 Veri modeli (yerel, şifreli)

| Varlık | Alanlar | Not |
|---|---|---|
| Profile | yaş aralığı, kilo (HipoDurdur), tanı etiketi (hekim girişi/serbest), hekim kilitleri {su_bolusu, doz_siniri, svt_kodu, fog_kodu}, kontrendikasyon yanıtları, yakın kişiler (ad, telefon, izin) | Hekim kilidi: hekimin uygulamada ürettiği 6 haneli kod ya da basılı reçete QR'ı (MVP: kod) |
| Episode | modül, başlangıç/bitiş, tetik, adımlar + zaman damgaları, kullanıcı yanıtları, sensör özetleri (ham IMU saklanmaz), sonuç (geçti/bayıldı/eskalasyon), NRS | Hekim PDF'ine girer |
| Escalation | tür (SMS/112 ekranı), zaman, konum (yalnız gönderilirse) | 30 gün sonra silinir |
| Consent | KVKK aydınlatma sürümü, izinler, tarih | — |

Ham kamera/mikrofon verisi hiç kaydedilmez; PPG'den yalnız bpm/genlik özetleri. Sunucu: MVP'de **yok** (klinik çalışmada ayrı, anonim e-CRF; uygulama CSV dışa aktarır).

### 3.6 112 ve konum — kısıtlar

- **Android:** üçüncü taraf uygulamalar `ACTION_CALL` ile acil numara (112) **arayamaz**; yalnız `ACTION_DIAL` ile arama ekranı açılır, kullanıcı tuşa basar (AOSP kaynak yorumları, bu turda teyit). **iOS:** `tel:` URL'si sistem onay diyaloğu açar; otomatik arama yok (Apple belgesi bu turda okunmadı — **bellekten**, davranış yaygın bilinir). Sonuç: "112'yi otomatik arar" **vaat edilemez**; "tek dokunuşla 112 ekranı + konum metni panoda" vaat edilir.
- Yakın SMS: Android `SmsManager` ile izinle gönderilebilir; iOS'ta programatik SMS yok → `MFMessageCompose` (kullanıcı gönder'e basar) ya da sunucu üzerinden SMS/push (sunucu gerektirir, MVP sonrası). Bu asimetri onboarding'de açıkça yazılır.
- Konum: yalnız eskalasyon anında tek seferlik (`WhenInUse`); arka plan konum izni istenmez.

### 3.7 Teknik riskler ve kabul ölçütleri

| Risk | Kabul ölçütü | Ölçüm |
|---|---|---|
| Açılış süresi | Kilit ekranı girişinden ilk sesli komuta ≤3,0 s (medyan), ≤5 s (p90), **20 cihaz modelinde** (iOS 16–18 × 6 model; Android 12–16 × 14 model: Samsung A/S, Xiaomi/Redmi, Oppo, Huawei (HMS!), Pixel, General Mobile) | Otomatik test + kronometre video |
| OEM pil kısıtı (Xiaomi/Huawei arka plan öldürme) | 15 dk sayacı 20/20 cihazda tamamlanır; sesli komut ekran kilitliyken duyulur | Cihaz çiftliği |
| Ses duyulabilirliği | Telefon cepte, hoparlör aşağı: komutlar 1 m'de anlaşılır (%≥90 kelime anlaşılırlığı, 5 dinleyici) | Sessiz oda + 60 dB ortam |
| Haptik tempo | 1 Hz tempo sapması <50 ms; cepte hissedilir (10/10 kullanıcı) | — |
| Yatış tespiti | Duyarlılık ≥%90, özgüllük ≥%90 (cepte); elde "belirsiz" etiketi | §3.3 |
| PPG | MAE <5 bpm, 30 kişi, 3 cilt tonu grubu; başarısız sinyal oranı <%20 | Pulse oksimetre |
| Yanıt testi yanlış alarmı | Pilotta yakına gönderilen SMS'lerin ≤%20'si "gereksiz" | Kullanıcı günlüğü |
| Huawei (HMS, Google servisleri yok) | Kritik yol (ses/haptik/sayaç/SMS) Google servisi gerektirmez | — |

---

## 4. Ürün ve kullanıcı akışı

### 4.1 MVP ekran listesi (Bayılma Kalkanı + ortak motor; HipoDurdur 2. sürüm)

| # | Ekran | İçerik |
|---|---|---|
| 1 | Karşılama + KVKK + "acil tıbbi yardım yerine geçmez" kabulü | Tek sayfa, büyük yazı |
| 2 | Modül seçimi (ilk kurulumda): Bayılma / Şeker düşmesi / (diğerleri "yakında") | Birden çok seçilebilir |
| 3 | Güvenlik anketi (modül bazlı kırmızı bayrak) | Kilitleme kararı burada |
| 4 | Hekim bilgisi ve kilitler (isteğe bağlı kod) | Su bolusu, doz sınırı, SVT/FOG |
| 5 | Eğitim seansı A0 (12–15 dk) / HipoDurdur 5 dk eğitim | Tamamlanmadan atak modu açılmaz |
| 6 | Kilit ekranı kurulum rehberi (platforma özel ekran görüntüleri) | Başarı testi: "şimdi kilitle ve aç" |
| 7 | Yakın kişi + izinler (SMS/konum/bildirim/kamera-isteğe bağlı) | — |
| 8 | **Ana ekran**: 1–2 dev düğme ("BAŞIM DÖNÜYOR", "ŞEKERİM DÜŞTÜ"), altta "Hazır ol" ve "İğne/Kan vereceğim" | Kontrast yüksek, tek elle |
| 9 | Atak ekranı: tek satır komut, dev sayaç, "GEÇTİ" / "KÖTÜLEŞTİM" iki düğme | Gözler kapalıyken sesle yeter |
| 10 | Eskalasyon ekranı: "112" (arama ekranı), "YAKINI ARA", konum metni | Kırmızı, tam ekran |
| 11 | Olay sonrası 30 s günlük | Atlanabilir |
| 12 | Geçmiş + hekim PDF | — |
| 13 | Ayarlar: ses/hız/haptik şiddeti, dil, kilitler | — |

### 4.2 İlk kullanım (onboarding) süresi: 15–20 dk — bilinçli olarak uzun

Bu bir "atak anı" ürünü ama değeri eğitimde; PC-Trial'ın etkisi eğitimden geldi. Onboarding'i kısaltmak etkiyi öldürür. Karşılık: eğitim tek seferlik, 3 ayda bir 2 dakikalık "tazeleme" önerisi (isteğe bağlı; günlük rutin değil).

### 4.3 Atak akışı ilkeleri

- **Ekrana bakmadan kullanılabilir**: her adım sesli; dokunma gereken yerde "ekranın herhangi bir yerine dokun" (hedef arama yok). Sesle yanıt ("geçti", "kötüyüm") MVP sonrası (gürültü, izin).
- **Telefon cepte**: AMT ve PCM döngüleri cepte titreşim + hoparlör ile sürer; ekran kapanmaz.
- **Geri bildirim**: her 30 s'de kısa durum sorusu; sonunda "bu atak X saniye sürdü, Y kez bayılma iptal" özeti; PC-Trial'daki "kontrol bende" hissi (self-efficacy) hedeflenir.
- **Uyum (adherence)**: günlük rutin yok; ölçülen şey atakta kullanım oranı (olay/ay) ve manevra tamamlama; aylık özetle "kaç atak, kaçı bayılmasız" — hekime gösterilecek kanıt kullanıcı için motivasyon.
- **Erişilebilirlik**: WCAG AA kontrast, dinamik yazı, VoiceOver/TalkBack, renk körlüğü, tek el; yaşlı modu (daha yavaş ses, daha büyük düğme); işitme engelli için tam ekran yazı + güçlü haptik.
- **Dil**: Türkçe öncelik; ses dosyaları profesyonel seslendirme; ikinci dil Arapça/İngilizce (Türkiye'deki göçmen nüfus ve ihracat), protokol DSL'i dil-bağımsız.

---

## 5. Kanıt haritası ve klinik çalışma planı

### 5.1 Kanıt haritası

| Bileşen | Protokol düzeyi kanıt | Uygulama düzeyi kanıt | Boşluk |
|---|---|---|---|
| PCM (VVS) | PC-Trial n=223 RKÇ (nüks %50,9→%31,6; bu turda teyit); tilt çalışmaları n=21/n=98 (2002); 2022 meta-analiz (45 çalışma; "gerçek dünya verisi sınırlı" notu — bu turda teyit) | **Yok** (bu turda yeniden arandı) | Atak anında telefonla komutun manevra uyumunu/başlatma gecikmesini iyileştirdiği; "nüksü azaltır" iddiası |
| AMT (kan bağışı) | Meher 2024 n=4.320 (kontrol %2,5 → kombine %0,9; bu turda teyit); 2023 meta-analiz RR 0,51 (bu turda teyit); Avustralya RKÇ n=736; Ditto 2003 n=37 (video eğitimi) | **Yok** | Donörün kendi telefonuyla AMT'nin personel eğitimine eşdeğerliği |
| Su bolusu | Lu 2003 n=22 (bu turda teyit), Schroeder 2002, Jordan 2000 n=47 (otonom yetmezlik) | Yok | Küçük örneklemler; OH'de rutin kullanım kanıtı sınırlı |
| 15-15 | ADA 2025 / ISPAD 2022 standart bakım (bu turda teyit); çözülme %58–71 (derleme); hastane n=57.629 retrospektif | **Yok** (bu turda arandı: HypoMap pilot, "Ana wa Soukari" RKÇ n=62 eğitim uygulaması, Hypo-METRICS EMA — hiçbiri tedavi rehberi değil; bu turda teyit) | Zamanlayıcı/doz kartı/yanıt testinin çözülme süresine etkisi |
| Glukagon bakıcı rehberi | Kılavuz düzeyi; uygulamayla adım doğruluğu %63,6 vs %18,2 (n=22 pilot, anafilaksi — tarama-D) | Pilot | Simülasyon çalışması |
| Yanıt testi/eskalasyon | Yok (mühendislik güvenlik özelliği) | Yok | Yanlış alarm oranı |

### 5.2 Faz A — teknik doğrulama (ay 1–3; n=30; 20 cihaz)

§3.7 ölçütleri. Ek: 10 VVS hastası + 10 sağlıklıda eğitim seansı kullanılabilirliği (SUS ≥70; manevrayı video ile doğru yapma ≥%80, kardiyolog değerlendirir). Çıktı: teknik doğrulama raporu (IEC 62304 doğrulama dosyasına girer).

### 5.3 Faz B1 — Bayılma Kalkanı, kan bağışı RKÇ (ay 4–12) — **ilk klinik çalışma**

| Öğe | Tasarım |
|---|---|
| Merkez | Türk Kızılay bölge kan merkezi (Ankara/İstanbul) ya da üniversite transfüzyon merkezi (ör. NEÜ Konya; VVR %4,9 temel değeri yayımlı — bu turda teyit). İki merkez ideal. |
| Tasarım | Bireysel randomizasyonlu, 2 kollu, açık etiketli (kör mümkün değil), sonuç değerlendirici kör (VVR'yi kaydeden hemşire kol bilmez — pratikte zor; hemovijilans formu standart). Kollar: **(K) standart bakım** (merkezin mevcut bilgilendirmesi + su) vs **(U) standart bakım + Atak Anı iğne modu** (bekleme salonunda 3 dk eğitim videosu + iğne sırasında 5 s/5 s haptik-sesli AMT döngüsü; su hatırlatması). Üçüncü kol (broşür+video AMT, uygulamasız) bütçe varsa — telefonun artımlı katkısını ayırır; önerilir ama n'yi %50 artırır. |
| Birincil sonlanım | Bağış sırasında ve 15 dk gözlemde VVR (hemovijilans; hafif+orta+ağır, bayılma dahil). |
| İkincil | Ağır VVR (bilinç kaybı), bağışın tamamlanması, bağışçı anksiyetesi (VAS), AMT uyumu (gözlemci), 8 haftada tekrar bağışa dönüş, SUS. |
| Güç hesabı (iki oranlı, α=0,05 iki yönlü, güç %80, +%10 kayıp) | Senaryo 1 — temel %2,5 (Meher kontrol), AMT RR 0,51 → %1,3: **2.031/kol, toplam ≈4.470**. Senaryo 2 — temel %4,9 (Konya), RR 0,51 → %2,5: **970/kol, toplam ≈2.130**. Senaryo 3 — %4,9 → %1,8 (Meher kombine kol oranı ölçeklenmiş): 528/kol, ≈1.160. **Karar: Senaryo 2 (n≈2.200)**; merkez temel VVR oranı ilk 4 haftada doğrulanır, düşükse n büyütülür (uyarlamalı örneklem yeniden tahmini, kör). Büyük bir kan merkezi günde 100–300 bağış alır → 2–4 ayda kayıt. |
| Süre | Etik + Kızılay protokol anlaşması 2–3 ay; kayıt 3–4 ay; analiz 1 ay. |
| Maliyet (kaba) | 2 araştırma hemşiresi × 6 ay, veri yönetimi, 50 ödünç telefon (bağışçının kendi telefonu ana yol; QR ile anlık kurulum), biyoistatistik: **1,5–2,5 M TL** (doğrulanmadı; 2026 fiyatları). |
| Etik | Üniversite etik kurulu + Kızılay Kan Hizmetleri araştırma onayı; TİTCK klinik araştırma başvurusu: Sınıf I iddiasız yazılım için "tıbbi cihaz klinik araştırması" kapsamı danışılmalı (§6). |
| Neden ilk bu | Ucuz, hızlı, sonlanım merkezde zaten kaydediliyor, tek seferlik kullanım (uyum sorunu yok), sonucu doğrudan Kızılay'a satış argümanı; VVS pilotundaki "prodromda telefona ulaşamama" belirsizliğini taşımaz. |

### 5.4 Faz B2 — VVS/OH hastasında pilot (ay 6–12; n=40)

Kardiyoloji senkop polikliniği; hekim tanılı prodromlu VVS (n=30) + OH (n=10, su bolusu kilidi hekim açar). Tek kollu ön-son (3 ay önce günlük vs 3 ay uygulama) ya da 2 kollu (uygulama vs broşür, n=20/20) — ikincisi önerilir ama güç düşük (hipotez üretici). Sonlanım: senkop+presenkop/ay, manevra başlatma gecikmesi (uygulama logu), "bayılma iptal" oranı, SUS, hekim geri bildirimi. Sonuç → Faz C tasarımı.

### 5.5 Faz B3 — HipoDurdur pilot (ay 7–12; n=40)

| Öğe | Tasarım |
|---|---|
| Merkez | Üniversite endokrinoloji/T1D kliniği + diyabet eğitim hemşiresi; çocuk endokrin alt grubu (n=10, ebeveyn profili) |
| Tasarım | Çapraz (crossover) ya da ön-son: 4 hafta standart bakım (CGM ile tüm hipoglisemi olayları kaydedilir, hasta bildiği gibi tedavi eder) → 4 hafta HipoDurdur. CGM zaten kullanan hastalar seçilir (ölçüm aracı; uygulama CGM'e bağlanmaz — MVP'de). Olay tanımı: CGM <70 mg/dL ≥15 dk. |
| Sonlanım | Birincil: olay başına çözülme süresi (CGM; <70'ten ≥70'e). İkincil: 15 dk'da çözülme oranı (temel %60 varsayımı; %75'e çıkışı 2 kollu görmek için ~150/kol gerekir — pilotun gücü yetmez, **etki büyüklüğü tahmini** amaçlıdır), 1 saatte tekrarlayan olay, 2 saatte >180 mg/dL, uygulama kullanım oranı (olayların %'si), yanıt testi yanlış alarm, HFS-II korku ölçeği, SUS. |
| Güvenlik | Her hipoglisemi olayı hemşire tarafından 48 saatte gözden geçirilir; Düzey 3 olay → DSMB benzeri bağımsız gözden geçirme. |
| Süre/maliyet | 8 hafta hasta başı; toplam 5 ay; 0,5–0,8 M TL (doğrulanmadı). |
| Sonrası | Olumluysa Faz C: 2 kollu RKÇ, n≈300 (150/kol; %60→%75 çözülme), 12 hafta, çok merkezli; ya da CGM entegrasyonlu sürüm (Dexcom/Libre API — iş ortaklığı gerektirir, "ek donanım" değil çünkü hasta zaten kullanıyor; ama BRIEF'in ruhuna göre CGM'siz çalışma korunur). |

### 5.6 Faz C — Bayılma Kalkanı VVS pragmatik RKÇ (yıl 2)

Uygulama + standart eğitim vs standart eğitim; birincil sonlanım 12 ayda senkop nüksü; PC-Trial etkisi (%51→%32) üstüne artımlı etki küçük olacağından (ör. %32→%22) n≈300/kol; çok merkezli; "nüksü azaltır" iddiası için gerekli. Maliyet 5–8 M TL (doğrulanmadı). Go/no-go: B1 ve B2 sonuçlarına bağlı.

---

## 6. Regülasyon ve veri

### 6.1 Çerçeve

Türkiye: **Tıbbi Cihaz Yönetmeliği** (RG 2 Haziran 2021, 31499 mükerrer; AB MDR 2017/745 ile uyumlu; sınıflandırma Ek VIII; TİTCK, MDCG 2019-11 yazılım kalifikasyon/sınıflandırma rehberinin Türkçesini yayımladı — bu turda teyit). Yazılım için **Kural 11**: tanı/tedavi kararı için bilgi sağlayan yazılım varsayılan **Sınıf IIa**; ölüm/geri dönüşsüz bozulma riski → III; ciddi bozulma/cerrahi → IIb; diğer yazılımlar Sınıf I. Not: Aralık 2025'te AB'de SaMD sınıflandırmasını gevşeten reform önerisi tartışılıyor (bu turda görüldü; **doğrulanmadı**, yürürlükte değil).

### 6.2 Modül bazında sınıf tahmini ve paketleme

| Modül | İşlev | Tahmini sınıf (MDR/TİTCK) | Gerekçe | Paket |
|---|---|---|---|---|
| Ortak motor (tempo, sayaç, sesli rehber, günlük) | Eğitim/hatırlatma | Sınıf I (ya da tıbbi cihaz dışı "sağlıklı yaşam") | Karar vermez, ölçüm iddiası yok | Atak Anı |
| Bayılma Kalkanı (PCM/AMT rehberi) | Hekim tanılı hastada kılavuz manevrasının rehberi | **Sınıf I** | MDCG 2019-11: salt bilgi/eğitim; ancak "atak anında kullanılan" ve kırmızı bayrakla 112'ye yönlendiren yazılım "tedavi kararı" sayılırsa IIa — danışmanlık görüşü şart | Atak Anı |
| Su bolusu (hekim kilitli) | Hekim reçetesinin hatırlatıcısı | Sınıf I | Reçete hekimden | Atak Anı |
| HipoDurdur — sabit 15 g + sayaç + tekrar ölçüm | Standart hasta eğitimi | Sınıf I | ADA broşürünün sesli hali | Atak Anı |
| HipoDurdur — **kiloya göre doz hesabı** | Tedavi kararı için hesaplanmış bilgi | **IIa riski** | Kural 11 birinci cümle | MVP'de: yetişkin sabit 15 g; çocuk/pompa dozu **hekimin profile yazdığı sabit gram** (uygulama hesaplamaz, gösterir) → Sınıf I'de kalma stratejisi |
| HipoDurdur — yanıt testi + yakın SMS | Güvenlik/iletişim | Sınıf I | Tıbbi karar değil | Atak Anı |
| Bakıcı kartı (ilk yardım + prospektüs özeti) | İlk yardım bilgisi | Sınıf I (sınırda) | Prospektüs içeriği | Atak Anı |
| Acil-Enjeksiyon (adrenalin/glukagon/hidrokortizon adım adım + ikinci doz zamanlayıcısı) | Acil tedavi karar desteği | **IIa** (ciddi/ölümcül durum → IIb tartışılır) | Kural 11 | **Acil Anı (ayrı mağaza girişi)** |
| NöbetYanında, CPR/Heimlich, YerdenKalk | İlk yardım rehberi | I–IIa | Kızılay ilk yardım uygulamaları benzer içeriği tıbbi cihaz dışı sunuyor (doğrulanmadı) | Acil Anı |
| SVT Durdurucu | Hekim reçeteli manevra + PPG | **IIa** (PPG "nabız" bile olsa fizyolojik parametre izleme → Kural 11 ikinci fıkra) | — | Ayrı, reçeteli |
| FOG | Sürekli IMU + ipucu | IIa | Fizyolojik izleme | Ayrı "Parkinson" |
| Bulantı, kramp, panik/dispne | Semptomatik rehber | I ("deneysel" etiketi) | — | Atak Anı |

**Strateji:** (1) "Atak Anı" = Sınıf I modüller, üretici öz-beyanı + TİTCK ÜTS kaydı; iddialar "manevrayı/kuralı hatırlatır, eğitir"; "nüksü azaltır / atağı bitirir" iddiası **RKÇ sonucuna kadar yok**. (2) "Acil Anı" = IIa; onaylanmış kuruluş CE (Türkiye'de atanmış onaylanmış kuruluş var mı, süresi — **doğrulanmadı**); yıl 2. (3) Tek kod tabanı, iki mağaza girişi; Acil Anı modülleri Atak Anı'nda görünmez (feature flag + ayrı paket kimliği). (4) Hangi noktada IIa'ya geçilir: HipoDurdur'a gerçek doz hesabı ya da CGM entegrasyonu eklendiğinde, ya da "nüksü azaltır" iddiası yapıldığında. Regülasyon danışmanı ay 1'de (bütçe §9).

### 6.3 Asgari kalite sistemi

ISO 13485 (Sınıf I için zorunlu değil ama IIa'ya geçiş için baştan), IEC 62304 (yazılım yaşam döngüsü; güvenlik sınıfı: Atak Anı B, Acil Anı C), ISO 14971 risk yönetimi (tehlike listesi: yanlış tanı, geciken 112, yanlış doz kartı, ses duyulmaması, sayaç durması, yanlış alarm), IEC 62366-1 kullanılabilirlik mühendisliği (atak anı = "kritik görev"; formatif/summatif testler Faz A'da), ISO 27001-lite bilgi güvenliği.

### 6.4 KVKK / GDPR

Sağlık verisi = özel nitelikli (KVKK m.6): açık rıza, aydınlatma metni, veri cihazda şifreli (iOS Data Protection / Android Keystore), sunucu yok (MVP). Konum yalnız eskalasyonda ve yalnız yakına gönderilen mesajda. Kamera/mikrofon ham verisi hiç saklanmaz; PPG özetleri yerel. Klinik çalışma verisi anonim e-CRF'de, VERBİS kaydı, etik kurul onayı. Yakın kişinin telefon numarası = üçüncü kişi verisi → kullanıcı bilgilendirir (metin hazır). Çocuk kullanıcı (HipoDurdur) → veli rızası.

---

## 7. "Zaten var mı?" doğrulaması

| Alan | Bulunan (bu turda) | Fark |
|---|---|---|
| VVS/PCM uygulaması | **Bulunamadı** (web araması; mağaza içi arama yapılamadı). Klinik dünyada PCM eğitimi broşür/video (DETECT-ED pediatrik ED çalışması video+broşür kullanıyor — bu turda teyit) | Atak anında sesli-haptik rehber + eğitim + IMU/eskalasyon bütünü yok |
| Kan bağışı AMT | Kızılay Mobil Kan Bağışı: randevu, bağış geçmişi, noktalar (App Store listesi, bu turda teyit); AMT/su rehberi **yok** (doğrulanmadı — uygulama kurulmadı). Lifeblood (Avustralya) AMT'yi web/video ile öğretiyor | Kızılay uygulamasına **modül olarak** entegre edilebilir (B2B yolu) |
| Hipoglisemi 15-15 | 15-15 zamanlayıcı uygulaması **bulunamadı** (web); mySugr, Diabetes:M günlük; Dexcom G7 "Urgent Low Soon" 20 dk önceden uyarır ama tedavi rehberi içerdiğine dair belge bulunamadı (bu turda teyit); HypoMap (pilot, günlük), Hypo-METRICS (araştırma EMA), HypoPAST (çevrimiçi eğitim programı) | Atak anı doz kartı + sayaç + tekrar ölçüm + yanıt testi + bakıcı kartı bütünü yok |
| Glukagon/anafilaksi rehberi | Rescufy (2016; güncel durum doğrulanmadı), Auvi-Q (donanım, ABD), AllergiSense (araştırma) | Türkçe, kilit ekranından, çok ilaçlı — Acil Anı |
| Panik/nefes | Rootd, Dare, Calm, Breathe2Relax (açık döngü) → **kısmen var**; PanikDur yeniliği düşük (00-DEGERLENDIRME) | Düşük öncelik |
| CPR/Heimlich | PocketCPR, Kızılay ilk yardım → kısmen var | En sona |

**İlk hafta mağaza taraması (App Store TR/US, Google Play TR/US; Türkçe + İngilizce):** "bayılma", "senkop", "syncope", "vasovagal", "counterpressure", "faint", "presyncope", "orthostatic", "POTS", "blood donation faint", "applied tension", "needle phobia", "hipoglisemi", "hypoglycemia", "15-15", "rule of 15", "low blood sugar timer", "hypo treatment", "glucagon", "glukagon", "diabetes emergency", "anafilaksi", "epipen app", "acil enjeksiyon", "seizure first aid", "febril konvülziyon", "kramp", "cramp", "nausea P6", "mide bulantısı". Her sonuç: ad, geliştirici, son güncelleme, indirme, atak-anı işlevi var/yok, Türkçe var/yok. Ayrıca FDA 510(k)/De Novo ve EUDAMED'de "syncope", "hypoglycemia" yazılımı taraması; DiGA listesi (Almanya).

---

## 8. Riskler ve azaltma

| # | Risk | Tür | Olasılık/etki | Azaltma |
|---|---|---|---|---|
| 1 | **Kardiyak senkop "vazovagal" sanılır**, hasta manevra yaparken aritmi/aort stenozu atlanır | Klinik | Düşük/çok yüksek | Hekim tanısı zorunlu; onboarding + her atakta kırmızı bayrak; eforla/çarpıntılı senkop → kilit; "bayıldım" bildiriminden sonra uygulama "hekime git" der; ISO 14971 en üst tehlike |
| 2 | **Hipoglisemi ile inme/kardiyak olay karışır** (konuşma bozukluğu, güçsüzlük); ya da hasta "uygulama düzeldi dedi" diye tekrar ölçmez | Klinik | Orta/yüksek | Tek taraflı belirti sorusu → 112 ekranı; "düzeldi" yalnız ikinci ölçümle; sulfonilüre uyarısı; her ekranda "ölçüm sizin cihazınızdan" |
| 3 | **Prodrom çok kısa, telefona ulaşılamıyor** → atak modu kullanılmaz, ürün "işe yaramadı" algısı | Benimseme/klinik | Yüksek/orta | Değer merkezini eğitim + "hazır ol" moduna koy; kilit ekranı girişleri; pilotta başlatma gecikmesini ölç; mesaj "öğren, hazırlan, gerektiğinde dinle" |
| 4 | **Yanlış alarm/eskalasyon** (yanıt testi, düşme algısı) yakınları yorar, 112'yi meşgul eder | Teknik/etik | Orta/orta | 112 otomatik aranmaz (zaten platform engelliyor); kademeli eskalasyon; düşme algısı yalnız SMS; yanlış alarm oranı kabul ölçütü ≤%20 |
| 5 | **Regülasyon sınıfı** beklenenden yüksek (Kural 11 yorumunda "atak anı rehberi" = IIa) | Regülasyon | Orta/yüksek | Ay 1'de danışman görüşü; doz hesabını hekim girişine çevir; IIa'ya hazır dosya (62304/14971) baştan; Acil Anı ayrı |
| 6 | **OEM arka plan kısıtı** sayacı/sesi öldürür (Xiaomi, Huawei) | Teknik | Yüksek/orta | Foreground service + pil optimizasyonu muafiyeti rehberi; 20 cihaz testi; desteklenmeyen cihaz listesi mağazada |
| 7 | **Kızılay/kan merkezi iş akışına girememe** (personel yükü, prosedür) | Benimseme | Orta/yüksek | Bağışçının kendi telefonu + bekleme salonunda QR; çalışma hemşiresi; sonuç Kızılay'a ücretsiz lisans teklifi |
| 8 | **Kanıt üretilemezse** pazarlama "eğitim uygulaması" düzeyinde kalır, farklılaşma zayıf | Ticari | Orta/orta | B1 RKÇ ucuz ve hızlı; olumsuzsa B2B (kan merkezleri, diyabet klinikleri) eğitim aracı olarak yaşar |
| 9 | **Çocuk/ebeveyn kullanımı** (HipoDurdur) — doz kartı hatası | Klinik | Düşük/yüksek | Çocuk dozu yalnız hekim girişiyle; ebeveyn profili; ISPAD alt sınırı |
| 10 | **Ses duyulmuyor** (sessiz mod, cepte) | Teknik | Orta/orta | iOS'ta sessiz anahtarı aşan "alarm" ses sınıfı yok → uygulama açıkken `AVAudioSessionCategoryPlayback` sessiz anahtarı yok sayar (bellekten; doğrulanacak); Android `STREAM_ALARM`; haptik yedek |
| 11 | **Ticari**: ücretli tüketici uygulaması olarak gelir düşük | Ticari | Yüksek/orta | B2B (Kızılay, SGK diyabet eğitim programları, özel hastane grupları, ilaç firmaları — glukagon/insülin üreticileri hasta destek programları), ihracat (Arapça, İngilizce) |

---

## 9. Yol haritası ve ekip

### 9.1 Kilometre taşları

| Dönem | İş | Go/no-go |
|---|---|---|
| **Ay 0–3** | Regülasyon danışmanı görüşü (sınıf + paketleme); klinik ortaklar (kardiyoloji senkop polikliniği, kan merkezi, endokrin); mağaza taraması raporu; ortak motor (ProtocolRunner, VoiceOut, Haptics, Timers, Posture) + Bayılma Kalkanı A0/A1/A3; seslendirme; kilit ekranı girişleri; Faz A 20 cihaz testi; B1 etik + Kızılay başvurusu; ISO 14971 risk dosyası v1 | Go: açılış ≤3 s medyan 20 cihazda; SUS ≥70; kan merkezi yazılı niyet mektubu; sınıf I yolu danışman onaylı |
| **Ay 3–6** | B1 RKÇ kayıt başlar; HipoDurdur MVP (sabit doz + hekim girişli çocuk dozu, sayaç, yanıt testi, bakıcı kartı); B3 etik; B2 pilot başlar; PPG isteğe bağlı modül; Türkçe porsiyon kartı diyabet hemşiresi onayı; Bulantı/Kramp "deneysel" | Go: B1 ilk 500 bağışçıda uyum ≥%70 ve temel VVR oranı tahmini; HipoDurdur kullanılabilirlik 10 hastada SUS ≥70 |
| **Ay 6–9** | B3 pilot kayıt; B1 ara analiz (n %50, yalnız güvenlik/uyum — etkinlik kör); mağaza yayını (Sınıf I, ÜTS kaydı) "Atak Anı v1"; Acil Anı tasarım + IIa dosya başlangıcı; B2B görüşmeleri | Go: ciddi olumsuz olay yok; yanlış alarm ≤%20; mağaza onayı (background audio gerekçesi kabul) |
| **Ay 9–12** | B1 tamamlanır (n≈2.200) ve analiz; B3 sonuçları; v1.1 (PanikDur/DispneAcil solunum alt-motoru); Faz C ve CGM entegrasyonu kararı; Acil Anı onaylanmış kuruluş başvurusu | Go (yıl 2): B1'de VVR anlamlı düşüş **ya da** uyum ≥%70 + anksiyete düşüşü; B3'te çözülme süresi kısalma sinyali; en az bir B2B sözleşme |

### 9.2 Ekip

| Rol | Kişi | Not |
|---|---|---|
| Ürün/proje lideri (klinik arka planlı) | 1 | Protokol DSL sahibi |
| Mobil geliştirici (iOS native) | 1 | Kilit ekranı, CoreHaptics, arka plan ses |
| Mobil geliştirici (Android native) | 1 | TileService, showWhenLocked, OEM testleri |
| KMP/çekirdek + sinyal işleme (IMU/PPG) | 1 | Faz A doğrulama |
| UX/erişilebilirlik tasarımcısı | 1 (yarı zamanlı) | 62366 kullanılabilirlik dosyası |
| Klinik araştırma koordinatörü + 2 araştırma hemşiresi (B1) | 1 + 2 | Kan merkezinde |
| Klinik danışmanlar: kardiyolog (senkop), endokrinolog + diyabet eğitim hemşiresi, transfüzyon uzmanı, acil tıp | 4 (danışman) | Protokol/içerik onayı |
| Regülasyon/kalite danışmanı (13485/62304/14971) | 1 (dış) | Ay 1'den |
| Biyoistatistikçi | 1 (dış) | Güç hesabı, SAP, ara analiz |
| Seslendirme + içerik editörü | dış | — |

### 9.3 Kaba bütçe (12 ay; 2026 TL; **doğrulanmadı**, sıra büyüklüğü)

Yazılım ekibi (4 kişi × 12 ay) 8–12 M; tasarım/içerik/seslendirme 0,8 M; cihaz çiftliği (20 cihaz) 0,4 M; regülasyon/kalite danışmanlığı 0,8–1,2 M; B1 RKÇ 1,5–2,5 M; B2 + B3 pilotlar 1–1,5 M; etik/kayıt/sigorta 0,3 M; genel gider %15. **Toplam ≈ 15–21 M TL.** TÜBİTAK 1507/1501, KOSGEB, Türkiye Sağlık Enstitüleri (TÜSEB) çağrıları ve Kızılay ortaklığı ile kısmen karşılanabilir (uygunluk doğrulanmadı).

---

## 10. Açık sorular (proje sahibinin kararı)

1. **Önce hangi modül, tek ekip mi?** 00-DEGERLENDIRME BPPV'yi ana proje, Atak Anı'nı paralel önerdi. Tek ekip varsa Atak Anı için öneri: önce Bayılma Kalkanı (B1 RKÇ'si ucuz), HipoDurdur ay 4'te. Kabul?
2. **Teknoloji:** native ×2 + KMP (önerilen; kilit ekranı/haptik/arka plan için) mi, Flutter (hızlı MVP) mi?
3. **Paketleme:** "Atak Anı" (Sınıf I) + "Acil Anı" (IIa, yıl 2) iki mağaza girişi; glukagon adım adım rehberinin Acil Anı'da kalması HipoDurdur bakıcısı için eksiklik — kabul mü, yoksa baştan tek IIa paket (onaylanmış kuruluş maliyeti + 6–12 ay) mi?
4. **Doz hesabı:** HipoDurdur'da kiloya göre otomatik hesap (IIa riski) mi, hekim girişli sabit gram (Sınıf I) mi? Önerim ikincisi (MVP).
5. **SVT ve FOG:** R=4 risk kabul edilip hekim reçeteli ayrı ürün olarak yıl 2'ye alınsın mı, tamamen çıkarılsın mı?
6. **B1 RKÇ'de üçüncü kol** (video/broşür AMT, uygulamasız): telefonun artımlı katkısını ayırır, n'yi ~3.300'e çıkarır. İstenir mi?
7. **Kızılay mı üniversite kan merkezi mi:** Kızılay ölçek ve B2B getirir ama kurumsal onay yavaş; üniversite hızlı. İkisi paralel mi?
8. **Ses kimliği ve dil:** profesyonel seslendirme (kadın/erkek) + Arapça/İngilizce ikinci dil bütçesi?
9. **CGM entegrasyonu** (Dexcom/Libre API) yıl 2'de istenir mi? BRIEF "ek donanım yok" der; CGM hastanın zaten kullandığı cihaz — sınır kararı sizde.
10. **Sürüş uyarısı metni:** Türkiye'de resmi kural bulunamadı; DVLA'nın 45 dk kuralı mı, hekim onaylı yumuşatılmış metin mi?
11. **Türkiye gıda eşdeğerleri:** kesme şeker/bal/meyve suyu gramajları etiketlerden ve Türkiye Diyabet Vakfı/TEMD materyalinden doğrulanacak; kim onaylar (diyabet hemşiresi + diyetisyen)?

---

## 11. Kaynaklar

**Bu turda teyit edilenler**
- PC-Trial, van Dijk 2006 JACC 48:1652 — https://www.acc.org/latest-in-cardiology/clinical-trials/2010/02/23/19/15/pctrial ; https://pure.amsterdamumc.nl/en/publications/effectiveness-of-physical-counterpressure-maneuvers-in-preventing/ ; https://www.qxmd.com/r/17045903
- Meher 2024, Transfusion Medicine 34:20, dört kollu RKÇ n=4.320 — https://nutrition-evidence.com/article/499189/prevention-strategies-for-vasovagal-reaction-in-whole-blood-donors-a-quadri-armed-randomised-control-trial (kol bazlı su-yalnız/AMT-yalnız oranları özette yok; özetteki bazı GA'lar hatalı görünüyor)
- AMT 2023 meta-analizi (3 RKÇ, RR 0,51) — https://doaj.org/article/6846587657e54172a2f93bf0286cbd71 ; Ditto 2003 — https://pubmed.ncbi.nlm.nih.gov/12690946/ ; Lifeblood RKÇ — https://www.donateblood.com.au/research/stories/improving-donor-safety-study
- Lu 2003 Circulation 108:2660 — https://nutrition-evidence.com/article/54400/water-ingestion-as-prophylaxis-against-syncope ; https://news.vumc.org/?p=347745 (PubMed künyesi bu turda doğrudan açılmadı) ; Schroeder 2002 — https://pubmed.ncbi.nlm.nih.gov/12451007/
- PCM meta-analizi 2022 (45 çalışma) — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9606335/ ; DETECT-ED pediatrik senkop çalışması — https://clinicaltrials.gov/study/NCT05555771
- ISPAD 2022 hipoglisemi (Abraham ve ark., doi 10.1111/pedi.13443) — https://www.ispad.org/asset/7C4CB688%2D460C%2D425D%2DB2687C005B8E2B41 (çeviri/ikincil kopyalar üzerinden; birincil metin okunmadı)
- ADA 2025 hipoglisemi materyalleri — https://professional.diabetes.org/sites/dpro/files/2025-05/hypoglycemia-hcp-5-27-25.pdf ; https://www.linksmedicus.com/news/comprehensive-glycemic-goals-and-hypoglycemia-management-in-diabetes-2025-ada-standards/ ; CDC 15-15 — https://www.cdc.gov/diabetes/treatment/treatment-low-blood-sugar-hypoglycemia.html
- HAT çalışması (Khunti 2016) — https://www.lmc.ca/wp-content/uploads/2017/08/Diabetes-Obes-Metab-2016-HAT.pdf ; karşılaştırma yazısı — https://figshare.le.ac.uk/articles/journal_contribution/Comparison_of_the_HAT_study_the_largest_global_hypoglycaemia_study_to_date_with_similar_large_real-world_studies_/10201043
- DVLA insülin ve sürüş (INF294) — https://mydiabetesmyway.scot.nhs.uk/media/1219/inf294-a-guide-to-insulin-treated-diabetes-and-driving-1.pdf
- Sulfonilüre hipoglisemisi gözlem süresi (BJCP 2016 derleme; Medscape) — https://pmc.ncbi.nlm.nih.gov/articles/PMC7001685 ; https://img.medscape.com/pi/iphone/medscapeapp/html/A1010629-business.html
- Hipoglisemi uygulamaları: HypoMap — https://pmc.ncbi.nlm.nih.gov/articles/PMC6232741 ; Ana wa Soukari RKÇ — https://pmc.ncbi.nlm.nih.gov/articles/PMC8808414 ; Hypo-METRICS — https://diabetes.jmir.org/2023/1/e42100/citations ; HypoPAST protokolü — https://eprints.whiterose.ac.uk/183661/1/e051651.full.pdf
- Dexcom G7 Urgent Low Soon — https://ca.provider.dexcom.com/articles/latest-data-shows-dexcom-g7-urgent-low-soon-alert-reduces-hypoglycemia
- GlucaGen HypoKit TİTCK KÜB (2019) — https://titck.gov.tr/storage/Archive/2019/kubKtAttachments/ ; Baqsimi EMA — https://www.ema.europa.eu/en/medicines/human/EPAR/baqsimi
- Konya NEÜ VVR %4,9 (n=742) — https://www.spandidos-publications.com/10.3892/mi.2025.221/download ; VVR risk faktörleri meta-analizi — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11747113/
- Türk Kızılay bağış sayıları (haber) — https://www.ensonhaber.com/gundem/kizilaya-2024te-2-milyon-uniteyi-askin-kan-bagisi-yapildi ; https://www.bursahakimiyet.com.tr/saglik/turk-kizilay-in-kan-bagisinda-bu-yil-da-3-milyon-uniteyi-asmayi-planliyor ; Kızılay Mobil Kan Bağışı (App Store) — https://apps.apple.com/us/app/t%C3%BCrk-k%C4%B1z%C4%B1lay-mobil-kan-ba%C4%9F%C4%B1%C5%9F%C4%B1/id1570115004
- TÜSEB Dünya Diyabet Günü 2019 (T1D <20 yaş >26.000) — https://files.tuseb.gov.tr/tuhke/files/yayinlar/2024-11-29-14-54-51.pdf
- Tıbbi Cihaz Yönetmeliği (RG 31499, 2.6.2021) — https://titck.gov.tr/storage/Archive/2021/contentFile/T%C4%B1bbi%20Cihaz%20Y%C3%B6netmeli%C4%9Fi_91969c4b-58b3-48cb-adfb-03c2cacd5632.pdf ; MDR Kural 11 açıklaması — https://s3connectedhealth.com/blog/mdr-rule-11-what-the-change-means-for-medical-device-companies ; TİTCK MDCG 2019-11 Türkçe (hukuk sitesi aktarımı) — https://hukukcularevi.com/tibbi-cihaz-yazilimlari-ne-zaman-tibbi-cihaz-sayilir/
- iOS 18 kilit ekranı kontrolleri — https://macrumors.com/guide/ios-18-control-center ; https://www.macstories.net/stories/ios-and-ipados-18-the-macstories-review/4/ ; kilitli cihazda App Intent kısıtı (Apple forum) — https://developer.apple.com/forums/thread/738252 ; https://developer.apple.com/forums/thread/764212
- Android 16 QPR2 kilit ekranı widget'ları — https://www.androidauthority.com/android-16-qpr2-lock-screen-widgets-phones-how-use-3621781 ; https://tech.yahoo.com/phones/articles/android-finally-lock-screen-widgets-120015688.html ; TileService — https://developer.android.com/reference/android/service/quicksettings/TileService ; AOSP startActivityAndCollapse değişikliği — https://android.googlesource.com/platform/frameworks/base/+/3576834649d7%5E%21/
- Android acil arama kısıtı (AOSP) — https://android.googlesource.com/platform/packages/apps/Phone/+/a42348f%5E%21 ; https://android.googlesource.com/platform/packages/services/Telecomm/+/f7a075b/AndroidManifest.xml
- Öst 1991 applied tension (ikincil) — https://en.wikipedia.org/wiki/Blood_phobia ; Wannemueller 2018 tek seans AT — https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2018.01534/pdf
- Meyve suyu karbonhidrat etiketleri (Migros) — https://www.migros.com.tr/hemen/elite-organik-sikma-elma-portakal-havuc-suyu-200-ml-p-8ae2fc

**Alan taramalarından devralınan (orada doğrulanmış):** tarama-A §5 (REVERT, PPG doğrulamaları, DeFOG, CPR ±4 mm, Kim 2012 panik), tarama-D §5 [1]–[3], [13]–[20], [25]–[28], tarama-C (BMJ Best Practice kramp, Miller 2010).

**Doğrulanmayanlar (metinde işaretli):** Ganzeboom 2006 %35 yaşam boyu senkop; 65+ OH prevalansı; Türkiye insülin kullanıcı sayısı; ESC 2018 PCM öneri sınıfı (IIa/B); Meher 2024 AMT-yalnız kol oranı; Baqsimi Türkiye ruhsatı; kesme şeker/bal gramajları; Türkiye sürüş-hipoglisemi mevzuatı; iOS `tel:` onay davranışı ve sessiz anahtar/ses sınıfı davranışı; Türkiye'de atanmış onaylanmış kuruluş; AB Aralık 2025 SaMD reform önerisi; Kızılay uygulamasında AMT/su rehberi olmadığı; mağaza içi rakip taraması; bütçe rakamları; Rescufy güncel durumu.
