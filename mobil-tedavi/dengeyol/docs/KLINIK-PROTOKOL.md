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

**Tanıtma (yalnız ilk kullanımda, ~30 s) ve yerleştirme (her test/manevra başında, ~15–30 s):**
1. Telefon elde, okuma duruşunda → ivmeölçer işaret kuralı (Android ve iOS tarayıcıları ters işaret verebilir). Kaydedilir.
2. Telefon alında, dik oturuş ve karşıya bakış → nötr referans.
3. Başı geriye yatırıp tavana bakış (en az 25°) → ekranın içe mi dışa mı baktığı ve kulaktan kulağa eksen.
İki ölçümden TRIAD yöntemiyle düzeltme rotasyonu hesaplanır; alın eğimi ve telefonun alındaki küçük dönüklüğü düzeltilir.
Tavana bakarken baş yana da yatarsa kulak ekseni kayar ve yatar adımların hepsinde aynı yönde dönüş hatası oluşur
(≈ atan(yana yatma / bakış); 25° bakış + 5° yana yatma ≈ 11°). Bu yüzden ölçülen "örtük yana dönüklük" 10°'yi aşarsa
ölçüm tekrarlanır ("telefonu alnın ortasına düz yaslayın, başı yana yatırmadan tavana bakın"). Telefon dikeyden 40°'den
fazla eğikse, ters tutuluyorsa ya da tavana bakış yetersizse de yeniden yerleştirme istenir. Ölçümler, sesli yönergenin
bitmesi (konuşma motorunun "bitti" olayı) beklendikten sonra başlar.
Testler 5 farklı telefon/yerleşim modelinde sağ/sol, sarkık ve yüz yere pozlarının 0,5°'den küçük hatayla geri kazanıldığını,
yana yatmalı bakışın reddedildiğini doğrular (`calibration.test.ts`). **Gerçek telefonlarda doğruluk henüz ölçülmedi**
(Faz A, [YOL-HARITASI.md](YOL-HARITASI.md)).

## 2. Toleranslar

| Değer | Seçim | Gerekçe |
|---|---|---|
| θ toleransı (kritik dönüş) | ±10° | IMU sesli geri bildirimli kendi kendine Epley'de ortalama mutlak hata 7,6° (Callejas Pastor CA ve ark. Sci Rep 2023;13:3169; sağlıklı ≥60 yaş gönüllüler, n=19); <15° sapmanın 1 haftalık sonucu değiştirmediği bildirilmiştir (Chowsilpa S ve ark. Audiol Neurotol 2025;30(3):272–281, n=31; tam metin görülemedi) |
| θ toleransı (yüz yere 45° adımı) | ±15° | En çok hata yapılan adım; aynı kaynaklar |
| Dix-Hallpike/Epley sarkıklık φ | 15…40° | Kılavuz 20–30°; ölçüm ve alın eğimi payı |
| Pozisyon onayı | Hedefte 1 s kesintisiz | Geçerken yanlışlıkla "tamam" denmesini önler |
| Kısa taşma toleransı | 2 s | Küçük kıpırdamalarda sayacın sürekli durmasını önler; daha uzunsa sayaç durur ve ipucu verilir |

## 3. Süreler

- **Epley:** her pozisyonda en az 45 s; baş dönmesi işaretlendiyse geçtikten sonra en az 30 s daha. Kılavuz 20–30 s der;
  daha uzun bekleme için bildirilmiş bir zarar yoktur; kılavuz alt sınırının altına inilmez. Son oturuş 60 s.
- **Semont:** 60 s + baş dönmesi geçince 30 s. Ara geçişin hızı ölçülür (hedef ≤2 s; birincil kaynakta sayı doğrulanamadı,
  bu yüzden yalnızca geri bildirim verilir, adımı engellemez).
- **Dix-Hallpike (test):** 60 s gözlem penceresi (gecikme nadiren 1 dakikaya uzayabilir).
- **Gufoni apogeotropik:** sabit 60 s + 120 s (Kim 2012 protokolü); baş dönmesine göre uzatılmaz.
- Diğerleri: [PROTOKOL-TABLOSU.md](PROTOKOL-TABLOSU.md).

## 4. Hasta modu güvenlik kuralları

**Tanı kapısı (kurulumda):**
- Hekim/odyolog tanısı yoksa (ilk atak) manevralar kilitli. İlk baş dönmesinin başka ve ciddi nedenleri olabilir.
- Yatay kanal tanısı → kilitli (evde yatay kanal manevrası bu sürümde yok; klinisyen modunda var).
- Kontrendikasyonlardan biri işaretliyse kilitli (boyun/omurga hastalığı, karotis darlığı/dengesiz kalp hastalığı, inme,
  retina/göz ameliyatı, ileri gebelik, yardımcısız hareket kısıtlılığı, sesli yönergeyi hiçbir yolla duyamama ve yardımcı
  yokluğu, bilişsel güçlük). İşitme kaybı tek başına kapatmaz (Bluetooth cihaz/kulaklık/yardımcı; titreşim, ton, altyazı).

**Her atakta akış (telefona dokunmadan önce sorular, sonra kesintisiz):**
1. **Kırmızı bayrak soruları** (her seans; 6 saatten eskiyse yeniden; kaynak `core/safety.ts` `RED_FLAGS`). 14 soru; her
   soruda güvenli yanıt "Hayır"dır (son soru "önceki BPPV'den farklı mı?"). Sorular sesli okunur; düğmeler ilk okunuşta kısa
   süre kilitli; durduran yanıtta "Yanlış dokundum" onayı. Ayırıcı tanı dayanağı: AAO-HNSF 2017 (Bhattacharyya ve ark.) ve
   inme/santral neden belirtileri.

   | # | Soru (özet) | Yanıt "Evet" ise |
   |---|---|---|
   | 1 | Kıpırdamadan dururken bile saatlerdir süren dönme ya da ayakta duramama (sürekli baş dönmesi) | 112 |
   | 2 | Çift görme, konuşma ya da yutma bozukluğu | 112 |
   | 3 | Yüz, kol ya da bacakta güçsüzlük veya uyuşma | 112 |
   | 4 | Baş dönmesi olmadığı anlarda bile yürüyememe (gövde ataksisi; BPPV atağının ilk dakikaları sayılmaz) | 112 |
   | 5 | Yeni ve şiddetli baş ya da boyun ağrısı | 112 |
   | 6 | Baş dönmesiyle birlikte göğüs ağrısı, çarpıntı ya da bayılma | 112 |
   | 7 | Ayağa kalkınca, etraf dönmeden göz kararması ya da bayılacak gibi olma (ortostatik; yataktan kalkarken dönme sayılmaz) | Aile hekimi / dahiliye |
   | 8 | Kan sulandırıcı kullanırken yeni baş ağrısı ya da yakın baş çarpması | 112 |
   | 9 | Baş hareketi olmadan gelen, dakikalar–saatler süren ataklar | Hekim |
   | 10 | Son birkaç haftada kafa travması ya da kaza | Hekim |
   | 11 | Bir kulakta yeni/ani işitme kaybı, dolgunluk, çınlama, ağrı ya da akıntı | Ani işitme kaybı/dolgunlukta **bugün** KBB; diğerlerinde birkaç gün içinde KBB |
   | 12 | Son bir ayda boyun travması ya da manipülasyonu | Hekim |
   | 13 | Ateş ya da su bile içilemeyecek kadar kusma | Bugün hekim / acil |
   | 14 | Önceki BPPV atağından farklı mı? | Hekim |

   Yönlendirmeyle biten her yanıt hekime yönlendirme kilidini koyar (aşağıda).
2. **Alt tip soruları** (Kim HJ ve ark. JAMA Neurol 2023;80:244–250): (a) "En çok hangisi başlatıyor: yatarken/kalkarken mi,
   yatakta sağa-sola dönerken mi?" — "dönerken" yatay kanalı düşündürür; onaydan sonra hekime yönlendirilir. (b) "Dönme hissi
   ne kadar sürüyor?" (sersemlik/bulantı hariç) — "3 dakikadan uzun" hekime yönlendirir (Kim 2023 tarama ölçütü <3 dk);
   "1–3 dakika" teste gider ve test süreyi ölçer (≥1 dk ölçülürse yönlendirilir). Nükste BPPV tipi ve tarafı sıklıkla
   değişir (Kim 2023: kontrol kolu hastalarının %56'sında farklı); bu yüzden her atakta yeniden belirlenir.
3. **Taraf sorusu** ("hangi tarafa dönünce daha çok?"): yalnız test sırasını belirler (önce şüpheli olmayan taraf).
4. **Hazırlık** (yatak, yastık, telefonun tutuluşu, kim yapıyor, süre). "Hazırım" dokunuşu ses kilidini, iOS hareket iznini ve
   ekranı açık tutmayı başlatır. Sonra telefon alna konur ve akış dokunmadan ilerler: (ilk kez) tanıtma → 1. taraf testi →
   30 s dinlenme → 2. taraf testi → karar → tek dokunuşla manevra. Zincirdeki her adımdan önce 1 s'lik sessiz yer kontrolü
   yapılır; telefon 12°'den fazla kaymışsa tam yerleştirme ölçümü istenir.
5. **Reçeteli kısa yol:** Klinisyen reçetesi 14 gün geçerlidir (doz ve taraf çelişkisi denetimi bu süre boyunca); hasta ve
   klinisyen ekranı son geçerli günü aynı sınırdan "… dahil" diye yazar. Testsiz kısa
   yol yalnız reçetenin verildiği atak içindir: hasta "muayeneden beri hiç geçmedi" derse reçetedeki tarafa manevra yapılır;
   "geçip yeniden başladı" ya da "emin değilim" derse ve reçeteden sonra kapanmış bir atak varsa tam akış uygulanır.
6. **Doz denetimi atak başında:** Sınır dolduysa provokatif testler yapılmadan söylenir. Manevra sonrası kusma bildirilirse o gün
   başka manevra ve erken tekrar testi yapılmaz (ertesi sabah test).
7. **İki taraf pozitif ve geçerli reçete yoksa** "hangisi daha şiddetli" sorulmadan hekime yönlendirilir.

**Taraf testinin yorumu:** Tek taraf pozitif ve <1 dk → o tarafa manevra; geçerli reçetenin tarafıyla çelişki → hekime;
iki taraf da pozitif → hangisinin daha şiddetli olduğu sorulur, eşitse hekime; ≥1 dk ya da bitişi işaretlenmemiş → hekime;
hiç tetiklenmezse manevra yapılmaz ve ertesi sabah yeniden test önerilir; ikinci kez de tetiklenmezse atak kapanır ve
"baş dönmesi sürüyorsa hekime başvurun (evde test edilemeyen yatay kanal olabilir)" denir (kilit konmaz).

**Seans içi:** Hasta modunda her gözlem adımında baş dönmesi 2 dakikayı aşarsa manevra durur ve hekime yönlendirilir
(tipik BPPV <1 dk). Baş dönmesi işaretliyken ilk "geçtiyse dokunun" hatırlatması 15 s'de, sonra aralıklı yapılır; duraklatmada
"geçti" işaretlenebilir ve duraklatma süresi sınıra sayılmaz. Manevranın herhangi bir pozisyonunda tek bir baş dönmesi dalgası
≥1 dk sürdüyse (tamamlanan ya da yarıda bırakılan manevrada) hekime yönlendirilir. Süre en uzun tek dalgadır (aralıklı kısa
dalgalar toplanmaz). Ekrana bakmadan duraklatma: ekranın herhangi bir yerine 2 s basılı tutmak duraklatır, duraklatmada
düğmelerin dışına 2 s basılı tutmak devam ettirir (uzun basış alttaki düğmeleri seçmez); geri tuşu manevrayı bitirmez,
duraklatır. Duraklatma seçenekleri: devam, "baş dönmesi geçti", "Kendimi kötü hissediyorum", "Pozisyona gelemiyorum / boynum
ağrıyor", "Şimdilik bırak (iyiyim)". Ekran kapatılırsa yapılan kısım "kesildi" olarak kaydedilir ve doza sayılır. Manevra
sonrası "yeni nörolojik belirti" yanıtı acil ekranı açar ve kilit koyar.

**Pozisyona gelinemedi:** Hasta modunda bir pozisyona 60 s içinde gelinip doğrulanamazsa ya da duraklatmada "Pozisyona
gelemiyorum / boynum ağrıyor" seçilirse manevra durur, kayda "pozisyona gelinemedi" yazılır ve hekime yönlendirilir (yönlendirme
kilidi). Hedef açı gevşetilmez; hasta zorlanmaz. Gerekçe: boyun/bel kısıtlılığında değiştirilmiş manevra ya da gözetimli
uygulama gerekir.

**Doz (14 günlük tedavi dönemi):** Reçetesiz günde en fazla 3 manevra, en fazla 3 farklı gün, toplam 9; reçeteyle günde en
fazla 3, en fazla 7 gün, toplam 21. Sınırlar son 14 günde TÜM ataklar ve deneme manevraları birlikte sayılır; atağı kapatıp
açmak sınırı sıfırlamaz. Yarıda bırakılan ama pozisyon değiştirilmiş manevra da sayılır. 3 günden uzun süre işlem görmeyen
aktif atak kendiliğinden kapanır (doz sayımı etkilenmez).

**Hekime yönlendirme kilidi:** Hekime ya da acile yönlendirmeyle biten bir ataktan sonra yeni atak ve deneme manevrası, hasta
iki adımlı onayla "hekimim evde manevra yapmamda sakınca olmadığını söyledi" diyene kadar açılmaz (beyana dayalıdır).

**Tekrar testleri:** Manevradan 1 saat sonra (yayımlanmış çalışmalardaki erken değerlendirme zamanı); negatifse ertesi sabah
06:00'dan sonra; ikisi de negatifse atak kapatılabilir. Takvime hatırlatıcı (.ics) eklenebilir.

**Deneme manevrası:** Baş dönmesi yokken adımları öğrenmek için; atağa kaydedilmez ama doz sınırına sayılır. Kırmızı bayrak
soruları ("farklı mı" hariç) sorulur; günde en fazla 2. Deneme sırasında baş dönmesi işaretlenirse gerçek akışa yönlendirilir.

Son 30 günde 3+ atak → hekim önerisi (D vitamini düzeyine bakılabilir; Jeong SH ve ark. Neurology 2020).

## 5. Klinisyen modu tanı önerisi

Bárány Derneği 2015 ölçütleri (von Brevern ve ark.) ve AAO-HNSF 2017 kılavuzuna göre: arka kanal (yukarı vuran + torsiyonel,
<1 dk; ≥1 dk → kupulolitiazis olası, Semont önce önerilir), yatay kanal geotropik (güçlü taraf hasta), apogeotropik (zayıf
taraf hasta; kupulolitiazis ya da ön kol kanalolitiazisi), ön kanal (aşağı vuran + torsiyonel → olası; santral neden uyarısı),
saf aşağı vuran / atipik desen → santral uyarısı, nistagmussuz pozisyonel vertigo → Bárány kategorileri klinisyene bırakılır.
Uygulama yalnızca öneri sunar; tanıyı klinisyen onaylar ya da elle girer.

Ek kurallar: "tipik" için gecikme (1–20 s) ve süre kaydı şarttır; herhangi bir uyarı varsa hiçbir öneri "tipik" sayılmaz ve
onay "Uyarıları okudum, yine de onayla" olur (uyarılar rapora yazılır). Süre-desen uyumsuzluğu (≥1 dk geotropik, <1 dk
apogeotropik) en fazla "olası"dır. Yatay kanalda taraf yalnız iki tarafta da yatay nistagmus görülüp ikisinin şiddeti
girilmişken belirlenir. Birden çok kanalda öneri → çok kanallı uyarısı. Bulgu değişince onaylı tanı geçersizdir.
Ev reçetesi yalnız geçerli, taraflı arka kanal kanalolitiazisi tanısında verilir (çok kanallı ya da kupulolitiazis şüphesinde
verilmez; uyarılı ya da "belirsiz" tanıda ek onay); taraf tanıdan gelir. Klinikte Epley pozisyonları en az 30 s (AAO-HNSF
2017: 20–30 s ya da nistagmus sönene kadar); hasta modunda 45 s.

Bulguya dayanan reçete kilidi: herhangi bir testte (tekrar test dahil) ≥1 dk yanıt ya da çok kanallı tutulum varsa, tanı elle
"kanalolitiazis" girilse de ev reçetesi verilmez; kilit gerekçesi rapora ve HBYS notuna yazılır.

**Kayıt:** Gözlem yöntemi (VNG / Frenzel / çıplak göz) bulgu formunda seçilir; profildeki ya da son muayenedeki yöntemle dolu
gelir ve tanı imzasına girmez. HBYS notu kısadır: başlık, yöntem bir kez, test başına bir satır, tanı + mekanizma + karar
desteği (öneri / klinisyen girişi), manevra başına bir satır (ad, taraf, tamamlandı / kısaltılmış / durma nedeni, adım süreleri,
manevra sırasındaki nistagmus), reçete satırı (kod, son geçerli gün). Açı istatistikleri (θ/φ sapması, hedefte kalma) yalnız
yazdırılan raporda yer alır.

## 6. Bilinçli olarak yapılmayanlar

- Kamera ile nistagmus tespiti (pilot kanıt düzeyinde; torsiyonel bileşen ölçülemez) → 2. faz.
- Evde yatay ve ön kanal manevraları.
- Santral/periferik ayrımı (HINTS kendi kendine yapılamaz); uygulama yalnızca "dur" kararı verir.
