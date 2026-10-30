# Kullanıcı turu 1 — sentez ve iş bölümü

On kullanıcı (k01–k10) uygulamayı uçtan uca kullandı. Puanlar: 7, 7, 6, 6, 6, 7, 5, 7, 7, 7 (ortalama 6,5).
Raporlar bu klasörde. Aşağıda birleştirilmiş, önceliklendirilmiş istekler ve her birinin hangi düzenleyiciye (D1–D4)
verildiği yer alır. Kırmızı çizgiler (hekim tanısı şartı, kırmızı bayraklar, doz sınırı, 2 dk durdurma, yönlendirme
kilidi, ağsızlık) zayıflatılmaz.

## D1 — Yürütücü ve manevra (core/runner.ts, core/evaluator.ts, core/protocols.ts, platform/haptics.ts, ui/screens/RunnerView.tsx)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Kritik | Hedefe gelemeyen (boyun kısıtlı) hasta: 2–3 düzeltme ipucundan sonra "Daha fazla zorlamayın"; ~60 s'de hedefe gelinemezse adım durur, kayda "pozisyona gelinemedi" yazılır, hekime yönlendirilir (hedef gevşetilmez). Duraklatma ekranına "Pozisyona gelemiyorum / boynum ağrıyor" | k07 |
| 2 | Yüksek | Baş dönmesi işaretliyken kendine özgü titreşim; ilk hatırlatma 15 s; hatırlatma sonucu söyler ("dokunmazsanız … saniye sonra durdurup hekime yönlendireceğim"); "bir dakikadan uzun" metni 2 dk sınırıyla uyumlu | k04, k01 |
| 3 | Yüksek | Titreşim desenleri ayırt edilebilir: hareket et / doğru / bozuldu / adım bitti / manevra bitti / duraklatıldı / işaret açık–kapalı | k04 |
| 4 | Yüksek | Duraklatınca ekrana bakmadan devam: sesle söylenen tek yol (ör. ekrana basılı tutarak devam); tek dokunuş baş dönmesi bitişi işlevini korur | k01 |
| 5 | Yüksek | Yardımcı modunda ses ve başlıklar yardımcıya konuşur ("Başını hastanın soluna çevirin; hasta dönüyor derse ekrana siz dokunun"); hastaya tek cümle | k02 |
| 6 | Orta | Sensörle doğrulanamayan oturuş/baş çevirme adımında erken "Tamam, böyle kalın" yerine dürüst cümle ve 5–8 s süre | k01, k02 |
| 7 | Orta | Adım yönergesi konuşmanın gerçek bitişini bekler (tahminden önce sayaç başlamaz); "Başlıyoruz. Yönergeleri dinleyin." sayımla kesilmez | k04, k01 |
| 8 | Orta | Sarkma sınırında histerezis (tutarken birkaç derece pay); "bozuldu/düzeldi" gidip gelmesi biter | k10, k07 |
| 9 | Orta | Gövde dönmediğinde (Epley 3. adım) "Bütün vücudunuzla yanınıza dönün" ipucu; sarkma yetersizse yastık konumu ipucu | k10 |
| 10 | Orta | Semont geçişi: hastaya "3-2-1 şimdi" komutu, yavaş geçiş sesli söylenir ve kayda/rapora geçer | k10 |
| 11 | Orta | İlk sesli düzeltme ipucu yönergeden sonra daha erken (hasta ekranı görmez) | k10 |
| 12 | Orta | Çevrik ekranda kritik talimatın kısa hâli görünür alanda; yatış adımlarında "ekranı göremezsiniz, sesi dinleyin" (yardımcı) | k02 |
| 13 | Düşük | Klinisyen: BBQ adım süresi 30 s; sensörsüz modda "alna yaslayın" metni yok; 0–1 s'de geçilen adım "erken bitirildi" kaydı | k08, k10 |

## D2 — Hasta akışı (EpisodeFlow.tsx, PatientHome.tsx, state/episodes.ts, ui/components/Controls.tsx, core/safety.ts kırmızı bayrak bölümü)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Yüksek | "Şu an nasılsınız?": açılışta ~1 s dokunuş kilidi; "Yeni belirti" ve "Kusma" için "Doğru mu?" onayı (onaylanınca aynen acil/şiddetli yol) | k06 |
| 2 | Yüksek | Hekimin söylediği taraf testle çelişirse uyar/yönlendir (reçetedeki SIDE_CONFLICT gibi; yakın tarihli tanıda yönlendirme, eski tanıda uyarı + rapora not) | k03 |
| 3 | Yüksek | Doz/gün sınırı doluyken ana ekranda baştan gösterilir, 11 soru sorulmaz; sınırdan sonra "Ataka devam et" çıkmaz döngüsü kalkar | k06 |
| 4 | Yüksek | Tüm soru/seçim ekranları sesli okunur (başlık + seçenekler), "Tekrar dinle" düğmesi; Choice'a çift dokunuş kilidi | k05, k06 |
| 5 | Yüksek | Kırmızı bayrak dili: ateş/kusma sorusu olumlu kurulsun; nörolojik soru 2–3 kısa soruya bölünsün; kan sulandırıcıya ilaç örnekleri (aspirin dahil); "BPPV'den farklı mı" gündelik dille; ortostatik/bayılma hissi sorusu; kulak sorusu "YENİ/ani" işitme kaybı odaklı ve durdurma ekranı ne yapılacağını söylesin | k05, k01, k09, k03 |
| 6 | Orta | Alt tip "yatakta dönerken" ile taraf sorusu "yatakta hangi tarafa dönünce" çelişkisi: ifadeler ayrışsın | k03, k01, k05 |
| 7 | Orta | Aynı gün manevrayla kapanan ataktan sonra yeni atak açılmaz, aynı ataka ve 1 saatlik teste dönülür; aynı günün atakları sık tekrar uyarısını şişirmez; 6 ayda ≥4 atak da uyarı | k06 |
| 8 | Orta | Güvenlik sorularında geri tuşu yanıtları sessizce silmez (onay sorar) | k05, k06 |
| 9 | Orta | Tanısız ilk atak: sakinleştirici iki cümle + aciliyet basamakları (112 / bugün acil / bugün KBB / birkaç gün içinde KBB) | k03 |
| 10 | Düşük | Manevra sonrası 10 dk dinlenme sayacı; "hafif baş dönmesi" sonrası ekran farklı; hazırlıkta işitme cihazı notu; Semont hazırlığında Epley yastık resmi gösterilmesin; dinlenmenin nedeni söylenir; deneme durdurma ekranında olmayan rapordan söz edilmez | k01, k04, k10, k06, k03 |

## D3 — Kurulum, rapor, reçete, ayarlar (Onboarding.tsx, History.tsx, PrescriptionImport.tsx, core/prescription.ts, Settings.tsx, Calibrate.tsx, core/safety.ts kapı/kontrendikasyon bölümü)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Yüksek | Kontrendikasyon kapısı engelleyen maddeyi adıyla gösterir, hekime sorulacak 2–3 soruyu yazar; "reçete gelirse açılır" yanlış vaadi düzeltilir; "kan sulandırıcı, tansiyon ilacı, protez tek başına engel değildir" notu | k07 |
| 2 | Yüksek | Rapor: başta "hasta kodu · reçete tarihi · klinisyen" satırı (reçete isteğe bağlı hasta kodu taşır), "yakını yaptırdı", duraklatmalar, belirti sütunu gecikme/süre olarak (ham saniye aralığı değil), ham iç kodlar yerine Türkçe, reçete geçerlilik bitişi; paylaşılan metin düz ve okunur | k09, k02, k01 |
| 3 | Orta | Reçete içe aktarmada "imzasız; yalnız muayenede elden aldığınız QR'ı kabul edin" uyarısı; reçete kodu rapora | k09 |
| 4 | Orta | Kurulum onayı tanısı olmayana yanlış beyan işaretletmesin; düzenlemede onay kutusu dolu gelsin; "Bilgilerimi düzenle" ilgili adıma gitsin; kurulumu bitmiş kişiye "önce kurulum" denmesin | k03, k07 |
| 5 | Orta | Kurulumda konuşma hızı denemesi ve "Çok yavaş" (≈0,65); titreşim desenlerini tanıtan "Titreşimleri tanı" | k04, k01 |
| 6 | Orta | Kalibrasyonda geri tuşu korunur; kalibrasyon/yerleştirme ekranları ekran çevirme ayarına uyar | k02, k08 |
| 7 | Düşük | Kontrendikasyon ve kurulum metinlerinde gündelik dil (BPPV → "kristal oynaması (BPPV)" vb.) | k05 |

## D4 — Klinisyen (ui/screens/clinician/*, core/diagnosis.ts)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Yüksek | Kupulolitiazis bulgusunda (≥1 dk yanıt) reçete kilidi elle tanı girilerek aşılamaz; kilit bulguya da bakar; elle tanıda mekanizma etikete ve HBYS notuna yazılır | k08 |
| 2 | Orta | "Elle gir" formunda önceden seçili yanıt yok; Kaydet seçim yapılınca etkin | k08 |
| 3 | Orta | Bulgu formu: serbest not, gözlem yöntemi (VNG/Frenzel/çıplak göz), torsiyon yönü, yorulma, oturunca ters nistagmus; iki taraflı pozitifte torsiyonla taraf | k08 |
| 4 | Orta | Klinisyen raporu/HBYS notu: her test ayrı satır; sarkma (φ) sapması, Semont geçiş süresi, manevra sırasındaki nistagmus işaretleri, "erken bitirildi" adımlar; reçete geçerlilik bitişi | k10, k08, k09 |
| 5 | Düşük | Hasta kodu başlıkta kesilmez; reçete oluşunca QR görünür alana kayar; yazdırmada reçete+QR+imza tek sayfada; kalibrasyonda geri tuşu muayeneden çıkarmaz | k08 |

## Bu turda yapılmayanlar (gerekçeli)
- Kriptografik imzalı reçete: sunucu/anahtar altyapısı gerektirir (ağsızlık çizgisi). Yerine uyarı + rapor/HBYS'de reçete kodu.
- Reçeteyle kontrendikasyonun kaldırılması (k07): hekim gözetiminde manevra önerilir; ev kullanımında kilit kalır, metin düzeltilir.
- Hasta raporunun klinisyen modunda QR ile içe aktarılması (k09): 2. tura bırakıldı.
