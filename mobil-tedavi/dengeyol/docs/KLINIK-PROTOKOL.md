# Klinik protokol ve gerekçeleri

Bu belge, `app/src/core/` altındaki klinik kuralların **neden** öyle olduğunu açıklar. Adım adım sayısal değerler için
[PROTOKOL-TABLOSU.md](PROTOKOL-TABLOSU.md) (koddan otomatik üretilir), literatüre karşı bağımsız doğrulama için
[KLINIK-INCELEME.md](KLINIK-INCELEME.md).

## 1. Açı ölçümü

Telefon alna düz yaslanır (önerilen: ekran dışa, üst kenar başın tepesine doğru). Telefonun ivmeölçeri yerçekimi yönünü verir.
BPPV manevralarının bütün pozisyonları başın **yerçekimine göre** yönüyle tanımlıdır; bu yüzden tek bir yerçekimi vektörü
yeterlidir (pusula/manyetometre kullanılmaz; yatak yayları ve metal karyola manyetik ölçümü bozar).

**Baş koordinatları:** x = sağ kulak, y = başın tepesi, z = burun.

| Parametre | Ne zaman | Tanım |
|---|---|---|
| θ | Yatarken | Beden ekseni etrafında baş dönüşü. 0 = yüz tavana, +90 = sağ kulak altta, −90 = sol kulak altta, ±180 = yüz yere |
| φ | Yatarken | Ekstansiyon. + = baş geriye sarkık (tepe yatak düzleminin altında), − = çene göğse |
| ψ | Otururken | Öne eğilme. + = çene göğse, − = tavana bakış |

**Sınır:** Otururken başın sağa/sola çevrilmesi (dikey eksen etrafında dönüş) yerçekimini değiştirmez; sensörle doğrulanamaz.
Bu yüzden "oturup başı 45° çevir" adımı yalnızca yönergeyle yapılır ve **bir sonraki adımda** (sırtüstü yatınca) θ = ±45° olarak
doğrulanır. Hasta başını çevirmeyi unutursa yatınca θ ≈ 0 ölçülür ve uygulama "başınızı sağa çevirin" der.

**Kalibrasyon (her seans, ~20 s):**
1. Telefon elde, okuma duruşunda → ivmeölçer işaret kuralı (Android ve iOS tarayıcıları ters işaret verebilir).
2. Telefon alında, dik oturuş ve karşıya bakış → nötr referans.
3. Başı geriye yatırıp tavana bakış → ekranın içe mi dışa mı baktığı ve telefonun alındaki eğikliği.
İki ölçümden TRIAD yöntemiyle düzeltme rotasyonu hesaplanır; alın eğimi ve telefonun alındaki küçük dönüklüğü otomatik
düzeltilir. Telefon dikeyden 40°'den fazla eğikse, ters tutuluyorsa ya da tavana bakış yetersizse yeniden yerleştirme istenir.
Testler 5 farklı telefon/yerleşim modelinde sağ/sol, sarkık ve yüz yere pozlarının 0,5°'den küçük hatayla geri kazanıldığını doğrular
(`calibration.test.ts`). **Gerçek telefonlarda doğruluk henüz ölçülmedi** (Faz A, [YOL-HARITASI.md](YOL-HARITASI.md)).

## 2. Toleranslar

| Değer | Seçim | Gerekçe |
|---|---|---|
| θ toleransı (kritik dönüş) | ±10° | IMU sesli geri bildirimli kendi kendine Epley'de mutlak hata ~7,6° (Sci Rep 2023 pilot); <15° sapmanın 1 haftalık sonucu değiştirmediği bildirilmiştir (Audiol Neurotol RKÇ; tam metin görülemedi) |
| θ toleransı (yüz yere 45° adımı) | ±15° | En çok hata yapılan adım; aynı kaynaklar |
| Dix-Hallpike/Epley sarkıklık φ | 15…40° | Kılavuz 20–30°; ölçüm ve alın eğimi payı |
| Pozisyon onayı | Hedefte 1 s kesintisiz | Geçerken yanlışlıkla "tamam" denmesini önler |
| Kısa taşma toleransı | 2 s | Küçük kıpırdamalarda sayacın sürekli durmasını önler; daha uzunsa sayaç durur ve ipucu verilir |

## 3. Süreler

- **Epley:** her pozisyonda en az 45 s; baş dönmesi işaretlendiyse geçtikten sonra en az 30 s daha. Kılavuz 20–30 s der;
  uzatmanın zararı yoktur, kısaltma risklidir. Son oturuş 60 s.
- **Semont:** 60 s + baş dönmesi geçince 30 s. Ara geçişin hızı ölçülür (hedef ≤2 s; birincil kaynakta sayı doğrulanamadı,
  bu yüzden yalnızca geri bildirim verilir, adımı engellemez).
- **Dix-Hallpike (test):** 60 s gözlem penceresi (gecikme nadiren 1 dakikaya uzayabilir).
- **Gufoni apogeotropik:** sabit 60 s + 120 s (Kim 2012 protokolü); baş dönmesine göre uzatılmaz.
- Diğerleri: [PROTOKOL-TABLOSU.md](PROTOKOL-TABLOSU.md).

## 4. Hasta modu güvenlik kuralları

**Tanı kapısı (kurulumda):**
- Hekim/odyolog tanısı yoksa (ilk atak) manevralar kilitli. İlk baş dönmesinin başka ve ciddi nedenleri olabilir.
- Yatay kanal tanısı → kilitli (evde yatay kanal manevrası bu sürümde yok; odyolog modunda var).
- Kontrendikasyonlardan biri işaretliyse kilitli (boyun/omurga hastalığı, karotis darlığı/dengesiz kalp hastalığı, inme,
  retina/göz ameliyatı, ileri gebelik, hareket kısıtlılığı, sesli yönergeyi takip edememe, bilişsel güçlük).
- Odyolog reçetesi, tanı yerine geçer (taraf, kanal = arka, manevra ve doz reçeteden gelir).

**Kırmızı bayrak soruları (her seans; 6 saatten eskiyse yeniden):** sürekli baş dönmesi; nörolojik belirti ("5D");
yeni şiddetli baş/boyun ağrısı; göğüs ağrısı/çarpıntı/bayılma; kan sulandırıcı + baş ağrısı/çarpma; kendiliğinden gelen
uzun ataklar; yakın kafa travması; ani işitme kaybı/kulak belirtisi; boyun travması/manipülasyonu; ateş/sıvı alamama;
"bu, önceki BPPV'nizle aynı mı?". Acil olanlarda 112 ekranı, diğerlerinde hekime yönlendirme.

**Seans içi:** Bir pozisyonda baş dönmesi 2 dakikayı aşarsa manevra durur ve hekime yönlendirilir (tipik BPPV <1 dk).
Hasta "kendimi iyi hissetmiyorum" ile istediği an durdurabilir. Uygulama arka plana geçerse manevra otomatik duraklar.

**Hastanın kendi taraf testi:** Önce şüpheli olmayan taraf, sonra şüpheli taraf; her birinde baş dönmesinin başlangıç/bitişi
ekrana dokunarak işaretlenir. Karar: tek taraf pozitif ve <1 dk → o tarafa manevra; hekim tarafıyla çelişki → hekime;
iki taraf da pozitif → hangisinin daha şiddetli olduğu sorulur, eşitse ya da hekim tarafıyla uyuşmazsa hekime; ≥1 dk ya da
bitişi işaretlenmemiş → hekime; hiç tetiklenmezse manevra yapılmaz.

**Doz:** Reçetesiz günde en fazla 3, en fazla 3 gün, toplam 9 manevra; sonra hekime. Reçeteyle en fazla günde 3 × 7 gün.
Manevradan 30 dk sonra tekrar testi; negatifse ertesi sabah 06:00'dan sonra ikinci test; ikisi de negatifse atak kapatılabilir.
Son 30 günde 3+ atak → hekim önerisi.

## 5. Odyolog modu tanı önerisi

Bárány Derneği 2015 ölçütleri (von Brevern ve ark.) ve AAO-HNSF 2017 kılavuzuna göre: arka kanal (yukarı vuran + torsiyonel,
<1 dk; ≥1 dk → kupulolitiyazis olası, Semont önce önerilir), yatay kanal geotropik (güçlü taraf hasta), apogeotropik (zayıf
taraf hasta; kupulolitiyazis ya da ön kol kanalitiyazisi), ön kanal (aşağı vuran + torsiyonel → olası; santral neden uyarısı),
saf aşağı vuran / atipik desen → santral uyarısı, nistagmussuz pozisyonel vertigo → Bárány kategorileri klinisyene bırakılır.
Uygulama yalnızca öneri sunar; tanıyı klinisyen onaylar ya da elle girer.

## 6. Bilinçli olarak yapılmayanlar

- Kamera ile nistagmus tespiti (pilot kanıt düzeyinde; torsiyonel bileşen ölçülemez) → 2. faz.
- Evde yatay ve ön kanal manevraları.
- Santral/periferik ayrımı (HINTS kendi kendine yapılamaz); uygulama yalnızca "dur" kararı verir.
