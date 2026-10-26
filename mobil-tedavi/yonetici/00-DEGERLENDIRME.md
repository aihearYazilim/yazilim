# 00 — Yönetici Değerlendirmesi: 24 alan, 198 fikir → 6 finalist

Tarih: 26 Ekim 2026. Girdi: `BRIEF.md`, `yonetici/aday-havuzu.md` (198 fikir) ve `alanlar/` altındaki 24 raporun tamamı (toplam ~95 bin kelime; hepsi okundu, özet geçilmedi). Kullanıcı ölçütleri: (1) teknik olarak gerçekten mümkün, (2) en çok insana fayda, (3) gerçek tedavi (yalnız izleme değil), (4) herhangi bir tıp alanı, (5) yalnızca telefon, (6) hâlihazırda mevcut değil.

Bu belgedeki her sayı ve ürün adı ya alan raporlarından alınmıştır (dosya adı + Fikir no ile) ya da benim kendi bilgimden gelir; emin olmadığım yerlerde **"doğrulanmadı"** yazdım. Bu turda web araması yapılmadı; alan ajanlarının da büyük bölümü arama kotası dolmuşken mağaza taraması yapamadığını not etmişti. Dolayısıyla "mevcut değil" ifadeleri **mağaza taraması yapılmadan** verilmiştir ve ilk 90 günde doğrulanmalıdır.

---

## 0. Kararın özeti

| # | Finalist | Ağırlıklı puan (/70) | Birleştirilen kaynak fikirler | Mekanizma |
|---|---|---|---|---|
| 1 | **DuvarKoçu** — kamera/IMU denetimli izometrik duvar çömelmesi (hipertansiyon) | **57,0** | 01-kardiyoloji F1 + 24-aile-hekimligi F1 | Egzersiz, doz denetimi |
| 2 | **HareketDöngüsü** — yemek sonrası 10 dk yürüyüş + her 30 dk'da 3 dk (T2D/prediyabet/HT) | **56,0** | 10-endokrinoloji F1 + F2, 24-aile F5, 20-nefroloji F6 | IMU ile doğrulanan "tam zamanında" aktivite |
| 3 | **Nefes Platformu** — ortak nefes/HRV çekirdeği + hastalık modülleri (astım, GÖRH, anksiyete/HT, KOAH, panik) | **54,0** (astım modülü; modüller 52–54) | 08-gogus F2 + 21-enfeksiyon F1 (astım); 09-gastro F1 + 24-aile F4 (GÖRH); 03-psikiyatri F1 + 24-aile F2 + 01-kardiyo F6 + 19-algoloji F2 + 16-romatoloji F3 + 02-noroloji F5 (HRV); 08-gogus F5 (KOAH şarkı); 22-acil F1 + 03-psik F4 + 08-gogus F6 (panik); 12-kadin F1, 01-kardiyo F4 (ek modüller) | Solunum eğitimi + biofeedback |
| 4 | **KarınSakin** — çocuk fonksiyonel karın ağrısı/İBS için bağırsak odaklı hipnoterapi | **54,0** | 13-pediatri F1 (+ 09-gastro F3 yetişkin/JIT uzantısı) | Davranışsal/psikolojik (hoparlör) |
| 5 | **Yaşlı Hareket Koçu** — IMU denge biofeedback + kamera kalkma gücü + RAS yürüyüş + CIPN modülü | **51,0** (denge çekirdeği; modüller 47–51) | 07-ftr F1 + 14-geriatri F1 (denge); 14-geriatri F2 (KalkGüç); 02-noroloji F1 + 07-ftr F2 + 14-geriatri F3 + 16-romatoloji F5 + 23-spor F2 (RAS); 15-onkoloji F3 (CIPN); 23-spor F6; 02-noroloji F7 | Motor öğrenme + biofeedback + ritmik uyarı |
| 6 | **Kamera-Alışkanlık Platformu** — kamera ile "tam zamanında" alışkanlık tersine çevirme (saç/deri yolma, tik, gündüz bruksizmi) | **50,0** | 04-dermatoloji F1 + 17-dis F1 + 13-pediatri F2 (+ 04-derma F2/F3, 20-nefro F5 kaşıntı modülleri) | Davranışsal (HRT/CBIT) + kamera tespiti |

**Önerilen başlangıç:** DuvarKoçu (tek başına en yüksek beklenen değer: 270 RKÇ'lik ağ meta-analizi, −8/−4 mmHg, 1,28 milyar hasta, 12 haftalık ucuz RKÇ). Aynı kod tabanına ("Hareket Çekirdeği": IMU + kamera poz tahmini) 2. finalist ve sonra 5. finalist eklenir. Nefes Platformu ikinci kod tabanıdır; KarınSakin içerik ağırlıklı, bağımsız ve en hızlı üretilebilen projedir. Ayrıntı §6.

---

## 1. Puan normalizasyonu

### 1.1 Alan ajanları ne kadar cömertti?

Havuzdaki 198 fikrin alan bazında ortalama/maksimum toplam puanı (0–50):

| Alan | Fikir sayısı | Ortalama | Maks | Min |
|---|---|---|---|---|
| 08-gogus-hastaliklari | 8 | **36,2** | 39 | 33 |
| 15-onkoloji | 8 | 35,6 | 39 | 31 |
| 13-pediatri | 12 | 34,7 | **42** | 31 |
| 11-uroloji | 8 | 34,6 | 37 | 32 |
| 24-aile-hekimligi | 7 | 34,6 | 38 | 25 |
| 19-algoloji | 7 | 34,3 | 37 | 27 |
| 23-spor-hekimligi | 9 | 34,3 | 37 | 31 |
| 17-dis-hekimligi | 8 | 34,0 | 37 | 28 |
| 03-psikiyatri | 8 | 33,6 | 39 | 31 |
| 10-endokrinoloji | 8 | 33,4 | 40 | 27 |
| 09-gastroenteroloji | 8 | 33,2 | 37 | 29 |
| 14-geriatri | 8 | 33,2 | 37 | 24 |
| 12-kadin-dogum | 7 | 33,1 | 38 | 27 |
| 04-dermatoloji | 6 | 32,8 | 38 | 29 |
| 01-kardiyoloji | 9 | 32,6 | 39 | 28 |
| 02-noroloji | 8 | 32,5 | 35 | 25 |
| 07-ftr-ortopedi | 9 | 32,3 | 37 | 29 |
| 05-oftalmoloji | 8 | 32,2 | 36 | 25 |
| 16-romatoloji | 10 | 32,1 | 39 | 27 |
| 18-uyku-tibbi | 10 | 32,1 | 38 | 26 |
| 20-nefroloji-hematoloji | 7 | 31,6 | 35 | 26 |
| 21-enfeksiyon-alerji | 8 | 31,6 | 39 | 28 |
| 06-kbb-odyoloji | 8 | 31,4 | 36 | 28 |
| 22-acil-anestezi | 8 | **29,6** | 34 | 20 |

Yayılım dar (ortalamalar 29,6–36,2) ama sistematik sapmalar var: göğüs ve onkoloji ajanları "etki" puanını yüksek verdi (onkoloji ePRO'ya Etki 10, oysa sağkalım etkisi uygulamadan değil hemşire yanıtından gelir); pediatri ajanı içerik uygulamasına Teknik 10 + Kanıt 9 verdi (Teknik 10 haklı, Kanıt 9 CD için haklı ama uygulama için değil); kardiyoloji ve nöroloji ajanları kendi fikirlerinin "yenilik"ini düşük verme eğilimindeydi (dürüst). Acil-anestezi ajanı en katı puanlayan oldu. Bu farkları gidermek için her fikri aşağıdaki tek cetvelle yeniden puanladım.

### 1.2 Yeniden puanlama cetveli (0–10, beş boyut)

| Boyut | 9–10 | 7–8 | 5–6 | 3–4 | 0–2 |
|---|---|---|---|---|---|
| **Teknik** | Sensör yöntemi yayınla doğrulanmış (ör. kamera-PPG HRV, IMU adım/kadans, IMU karın solunumu); telefon sabit konumda ya da elde | Olgun ML aracı (MediaPipe poz/el/yüz) ile kaba ölçüm; kurulum sürtünmesi var | Sinyal zayıf/doğrulanmamış (kamera ile çene sıkma, ıkınma tespiti) ya da telefonun vücutta sabit olması gerekir | Fizik sınırda (yatakta pozisyon, gece nabız, 60 fps gereken göz hareketi) | Fizik olarak olmaz |
| **Kanıt** | Hem mekanizma için büyük RKÇ/meta-analiz **hem** dijital/uygulama sürümü için RKÇ | Mekanizma için büyük RKÇ/meta-analiz var, uygulama sürümü yok | Küçük RKÇ'ler ya da çelişkili meta-analiz | Pilot/vaka serisi/bellekten atıf | Kanıt yok ya da olumsuz |
| **Etki** | Yüz milyonlar × klinik anlamlı sonuç (ör. −8 mmHg) | Yüz milyonlar × mütevazı etki, ya da on milyonlar × büyük etki | Milyonlar | Yüz binler | On binler |
| **Yenilik** | Hiçbir benzer ürün yok, yeni kullanım | Benzer "ölçen" ürün var, "tedavi eden kapalı döngü" yok | Aynı işi yapan araştırma uygulaması var ya da fark yalnızca sensör doğrulaması | Ticari ürün var, fark yerelleştirme + küçük modül | Birebir var |
| **Düşük risk** | Davranışsal, fiziksel risk yok | Egzersiz riski ya da gizlilik | Düşme/akut tansiyon artışı, tanı kaçırma | Uyku yoksunluğu, opioid, acil durumu geciktirme | Yanlış güvence ile ölüm riski |

Şüphecilik kuralları: "Kanıt" için yalnızca gerçek RKÇ/meta-analiz atfı (yazar-yıl-dergi) kabul edildi; "bellekten/doğrulanmadı" işaretli atıflar bir puan düşürüldü. "Yenilik" için her raporun "mevcut uygulamalar" bölümü ile diğer raporların çapraz bilgisi kullanıldı (ör. 21-enfeksiyon raporu, 08 ve 13 raporlarının bilmediği **Kata Inhalations-App**'i buldu → inhaler koçu "zaten var"a düştü). "Teknik" için BRIEF envanteri uygulandı (kamera-PPG'den tansiyon ve glukoz alınamaz; telefon yatakta vücut pozisyonu ölçemez; gece nabız yok).

### 1.3 Ağırlık

Kullanıcı "en çok insana" ve "gerçekten yapılabilir"i öne koydu:

**Ağırlıklı puan = Teknik × 1,5 + Kanıt × 1,5 + Etki × 2 + Yenilik × 1 + Düşük risk × 1 (maks 70).**

Etki en ağır (×2), Teknik ve Kanıt onu izler (×1,5). Yenilik ve risk ×1 — ancak "zaten var" (Yenilik ≤2) ve "fizik olarak olmaz" (Teknik ≤2) fikirler puana bakılmaksızın elendi (§3).

---

## 2. Birleştirme ve tekilleştirme

Aynı mekanizmanın birden fazla alanda tekrar ettiği 12 küme buldum. Her küme için **ortak çekirdek** (bir kez yazılacak motor) ve **alan modülleri** (hastalığa özgü protokol/içerik/sonlanım) ayrıldı.

| Küme | Kaynak fikirler (dosya-F#) | Ortak çekirdek | Alan modülleri | Not |
|---|---|---|---|---|
| **A. İzometrik duvar squat** | 01-F1, 24-F1 | Kamera poz tahmini (diz açısı), IMU uyluk açısı, 2 dk sayaç, Valsalva uyarısı, manşetli ev tansiyonu elle giriş | Evre-1 HT, yüksek-normal, ilaçla kontrolsüz HT | İki rapor aynı protokolü (4×2 dk, haftada 3, Edwards 2023) tarif ediyor; tek ürün |
| **B. Aktivite tetikleme (JITAI)** | 10-F1, 10-F2, 24-F5, 20-F6 | IMU adım/kadans + oturma algılama + bildirim + tamamlanma doğrulaması | Yemek sonrası yürüyüş (T2D/GDM), oturma kırıcı (prediyabet/HT), VTE baldır pompası (hareketsizlik) | Endokrinoloji ajanı da F1+F2'yi tek üründe birleştirmeyi önermişti |
| **C. Nefes/HRV çekirdeği** | 03-F1, 24-F2, 01-F6, 19-F2, 16-F3, 02-F5 (HRV rezonans); 08-F2, 21-F1 (astım); 09-F1, 24-F4 (GÖRH); 22-F1, 03-F4, 08-F6 (panik/hiperventilasyon); 08-F5 (KOAH şarkı); 12-F1 (dismenore); 01-F4 (KY); 15-F2 (bulantı haptik nefes); 11-F1/F4 (ürolojide nefes modülü); 17-F2 (diş koltuk modu) | Nefes pacer (ekran+haptik+ses), IMU solunum hızı/karın-göğüs oranı (telefon göğüs/karın üstünde), mikrofon solunum/ses, kamera-PPG kalp hızı/HRV, rezonans frekansı tarama | Astım (BREATHE 4 modül), GÖRH (diyafragma, postprandiyal), anksiyete/stres (HRV-BF), HT (ikincil), panik (hız düşürme), KOAH (sürdürülen ses), dismenore, KY | **En çok tekrar eden küme (19 fikir)**; tek platform önerisi §5.3 |
| **D. IMU denge + düşme** | 07-F1, 14-F1, 15-F3, 23-F6, 02-F7 | IMU gövde salınımı (göğüs cebi), zorluk algoritması, düşme kilidi, yaşlı arayüzü | 65+ düşme önleme, CIPN sensorimotor eğitim, ayak bileği instabilitesi, nöropati | Geriatri ajanı "Yaşlı Hareket Koçu" birleşimini önerdi |
| **E. RAS yürüyüş** | 02-F1, 07-F2, 14-F3, 16-F5, 23-F2 | Hoparlör/haptik metronom + IMU kadans/asimetri, adaptif tempo, fading | PD donma (tetiklenen ipucu), inme asimetrisi (taraf-özel), yaşlı değişkenlik, diz OA kadans, koşucu PFA | D kümesinin yürüyüş modülü olarak aynı uygulamaya gömülür |
| **F. Kalkma gücü / sarkopeni** | 14-F2 | Kamera 2D poz ile STS gücü | Sarkopeni, kırılganlık | D ile aynı poz motoru |
| **G. İnhaler tekniği** | 08-F3, 13-F3 | Kamera + mikrofon aktüasyon/inhalasyon | Astım/KOAH erişkin, çocuk | **Elendi: Kata Inhalations-App (VisionHealth, Almanya) aynı işi yapıyor, RKÇ NCT06178341 sürüyor** (21-enfeksiyon raporu) |
| **H. Kamera ile alışkanlık tersine çevirme** | 04-F1 (BFRB), 17-F1 (gündüz bruksizm), 13-F2 (tik), 04-F2/F3 ve 20-F5 (kaşıntı), 21-F8 | Ön kamera yüz/el nirengi, cihaz içi olay sınıflandırıcı, haptik uyarı, HRT/CBIT müfredatı, EMA | Trikotillomani/dermatillomani (el-yüz teması), tik (yayınlanmış F1 %82), bruksizm (doğrulanmamış), gece kaşıma (mikrofon) | Tespit kolaylığı sırasıyla: el-yüz teması > tik > çene sıkma |
| **I. Pelvik taban teknik** | 11-F2, 12-F3 | IMU ıkınma tespiti, mikrofon nefes tutma | SUI kadın, prostatektomi sonrası, doğum sonrası | Cochrane 2025 (33 çalışma): biofeedback eklemek yaşam kalitesinde fark yaratmıyor → ürünün temel iddiası zayıf; Tät zaten var |
| **J. Miyofonksiyonel terapi** | 18-F1, 17-F3 | Kamera dudak/dil, mikrofon vokal egzersiz, gece horlama ölçümü | Horlama/hafif OSA erişkin, çocuk ağız solunumu | Airway Gym var (kamera yok); mHealth OMT RKÇ (n=78) yayımlanmış → yenilik orta |
| **K. Vestibüler / BPPV** | 02-F2, 06-F2, 06-F7, 23-F8 | Jiroskop baş açısı, kamera baş hızı, VOR hedef | BPPV Epley, vestibüler rehab, sarsıntı sonrası | DizzyFIX, Vestulon, VestAid var; tanı bileşeni inme kaçırma riski taşır |
| **L. Işık dozu koçluğu** | 03-F2, 18-F4, 24-F6, 14-F5, 15-F5, 10-F8 | Ortam ışığı + GPS "dış mekân dakikası", akşam karartma | Depresyon/kronoterapi, DSWPD, SAD, demans, kanser yorgunluğu | Ekran ışığı 10.000 lux'ün %1–5'i; yalnızca "ışığa yönlendirme" olabilir; kanıt uygulama için yok |

Diğer çift kayıtlar: panik nefes (03-F4 ≈ 22-F1 ≈ 08-F6), yeme hızı (10-F5 ≈ 03-F6 ≈ 09-F6), ayna/GMI (07-F4 ≈ 19-F1 ≈ 19-F6), deliryum (14-F4 ≈ 22-F3), osteoporoz darbe dozu (07-F3 ≈ 10-F6 ≈ 14-F6), çocuk kabızlığı (09-F4 ≈ 13-F8), disfaji (06-F8 ≈ 09-F5), hipofoni (02-F3 ≈ 06-F1), iğne ağrısı (19-F4 ≈ 13-F5), enürezis (11-F7 ≈ 13 envanter), uyku terörü (18-F5 ≈ 13-F11), pozisyonel terapi (18-F2 ≈ 06-F4), kaşıntı (04-F2 ≈ 21-F8 ≈ 20-F5). Hepsi tekilleştirildi; §4 tablosunda tek satır olarak görünür.

---

## 3. Elenenler

### 3.1 Fizik olarak telefonun yapamadığı mekanizmalar (birleşik liste)

Raporlar aynı sınırları tekrar tekrar hesapladı; birleştirilmiş sayılar:

| Mekanizma | Telefonun sınırı (raporlardaki sayı) | Elenen cihaz/fikir örnekleri |
|---|---|---|
| **Elektrik akımı / manyetik alan** | Telefonun hiçbir çıkışı doku içine akım veremez | TENS, NMES/FES, tDCS, TMS/EKT, CES (Alpha-Stim), VNS/DBS/SCS, Cefaly, gammaCore, Nerivio, Cala kIQ, Lenire dil uyarımı, eXciteOSA, PTNS/SNM, Enterra, Reliefband, Grindcare, GenNarino, Quell, Scrambler, TTFields, defibrilasyon, Monarch eTNS, Neupulse |
| **Terapötik ışık dozu** | Ekran 1000 nit → 15 cm'de ~400–450 lux, 30 cm'de ~100 lux (10.000 lux'ün %1–5'i); mavi alt piksel 0,3–0,55 mW/cm² (Omnilux 44 mW/cm²; 48 J/cm² için 27–270 saat); OLED kırmızı 620–630 nm, retinal ışınım RLRL'nin 2×10⁴–2×10⁷ katı altında; yenidoğan sarılığı ≤5 µW/cm²/nm (gereken ≥30) ve vücut yüzeyinin <%5'i; UV çıkışı 0 W | Işık kutusu (SAD, PMDD, demans, YBÜ), mavi ışık akne, saç LLLT, RLRL miyopi, fototerapi (sarılık), PBM (mukozit), rinofototerapi, 405 nm yara, NB-UVB/eksimer, IPL/LipiFlow, D vitamini UV-B |
| **40 Hz gama uyarımı** | Yalnızca 120 Hz panelde kare-kilitli üretilir; aydınlık Cognito'nun 1/2–1/7'si; fotosensitif epilepsi riski; tüketici uygulamaları (GammaBoost, AlzLife) zaten var | GAMA-40 (02-F6, 14-F8) |
| **Isı / soğuk** | İşlemci ısısı kontrolsüz 40–45 °C; soğutma yok | Isı yaması, Bite Away, parafin, Waon, soğuk başlık (Paxman), soğutma eldiveni (CIPN), Game Ready, kriyoterapi, Embr Wave, Ebb |
| **Basınç / mekanik kuvvet** | Telefon kuvvet/basınç üretemez ve ölçemez (basınç sensörü yok) | CPAP/EPAP, Threshold IMT (0 cmH₂O), PEP/OPEP, EECP, pnömatik kompresyon, NPWT, Meniett, korse/breys/traksiyon, CPM, WBV platformu (telefon motoru mg genlik, 200 g kütle), vakum, dilatör, intragastrik balon, SNOO, LifeVac, MAD, splint, TheraBite, izometrik el sıkma dozu, tremor sönümleme (2–4 N vs 1,5 kg kol) |
| **Ultrason / şok dalgası** | Hoparlör >20 kHz çıkamaz; SPL terapötik düzeyin binlerce kat altında | ESWT, LIPUS, ESWL/EPVL, MRgFUS, Li-ESWT |
| **Ölçüm sınırları (kapalı döngü kurulamaz)** | Kamera-PPG ile **tansiyon** (hata 9–10 mmHg, ESH/AAMI doğrulaması yok) ve **glukoz** (görünür bantta sinyal yok; FDA 2024 uyarısı); EtCO₂, CO, alkol, INR, EEG, EMG, ıslaklık (enürezis), termografi, SpO₂ klinik doğruluk altı, uyku evresi ±100 ms faz kilidi, gece nabız (parmak teması gerekir) | Kafsız tansiyon titrasyonu, donanımsız CGM/insülin dozu, Freespira birebir, iCO Smokerlyzer, Soberlink CM, nörofeedback (Prism/Muse), Dreem/Elemind faz-kilitli ses, NightWare nabız tetiği, enürezis alarmı, Podimetrics SmartMat |
| **Optik / akustik ayrım** | Tek ekranda gözlüksüz dikoptik görüntü yok (burun septum geometrisi 16–25 D akomodasyon ister); kulaklıksız binaural vuru ve işitme amplifikasyonu olmaz | Luminopia/CureSight ambliyopi, prizma, flipper, ortokeratoloji, binaural vuru uygulamaları, işitme cihazı |
| **İlaç / gaz / sıvı / hava** | Telefon salım, aerosol, hava akımı, sıvı üretemez | İnsülin pompası, oto-enjektör, nebülizer, oksijen, el fanı (dispne), burun irrigasyonu, nikotin replasmanı |

### 3.2 "Zaten var" diye elenenler (aynı işi yapan ürün)

| Elenen fikir(ler) | Mevcut ürün (raporun verdiği ad) |
|---|---|
| Kamera + mikrofon inhaler tekniği (08-F3, 13-F3) | **Kata Inhalations-App** (VisionHealth; RKÇ NCT06178341) — 21-enfeksiyon raporu |
| Kamerayla bel/diz egzersiz düzeltme (07 §1.1, 19-F7, 19-F5) | Kaia, Hinge Health, Kemtai, Exer, SWORD Thrive, Joint Academy, painTRAINER, selfBACK, Curable |
| Kamera ayna terapisi (07-F4 basit sürüm, 19-F6) | Phantom Mirror, Digital MT, AS-Mirror, Mirror Box |
| Yetişkin İBS hipnoterapi/BDT (09-F3'ün planlı seans kısmı) | Nerva, Regulora (FDA 510(k)), Mahana Parallel (De Novo), Zemedy |
| Sensörsüz PFMT ve OAB mesane eğitimi (11-F1'in omurgası, 11-F2, 12-F3, 14-F9) | Tät / Tät II (İsveç, RKÇ), INKA (Almanya), Squeezy (doğrulanmadı) |
| Dijital CBT-I, depresyon/anksiyete/OKB/DEHB CBT (03 §0, 15-F7, 18 "zaten var", 12-F8) | Somryst, SleepioRx, DaylightRx, Rejoyn, NOCD, EndeavorRx, MamaLift Plus, Sleepio (gebelik) |
| Fibromiyalji dijital ACT (16 envanter) | Stanza (FDA De Novo 2023) |
| HRV güdümlü antrenman, kamera HRV ölçümü (23 §4; 01-F6'nın ölçüm kısmı) | HRV4Training, Welltory, HRV4Biofeedback (doğrulanmadı) |
| Pozisyonel uyku terapisi yalnız pozisyonla (18-F2'nin çekirdeği, 06-F4) | SomnoPose, Apnea Sleep Position Trainer |
| Jet-lag zamanlama (18-F4'ün öneri kısmı) | Timeshifter, Entrain |
| Horlama/öksürük/bruksizm **sayımı** (izleme) | SnoreLab, Hyfe, BruxApp, Do I Snore or Grind |
| Tinnitus BDT, ses jeneratörü, işitsel eğitim | Kalmeda (DiGA), AngelSound, clEAR |
| Sigara bırakma davranışsal (24-F3'ün omurgası) | Smoke Free (RKÇ n=3.143, fark yok), Quit Sense (araştırma) |
| Riskli içicilik, kilo, DPP, adım sayar, ilaç hatırlatıcı | Drink Less, Noom, Omada, Google Fit/Apple Health, Medisafe/MyTherapy |
| Kardiyak rehabilitasyon, HT yaşam tarzı DTx | SMART-CR/SP, Corrie Health; CureApp HT/HERB (Japonya) |
| CPR geri bildirim uygulaması (22-F2'nin çekirdeği) | PocketCPR (Zoll; güncelliği doğrulanmadı), Song 2015 |
| AF tespiti | FibriCheck (tedavi değil) |
| TME egzersiz DTx (17-F4) | Clickless DTx TMD-01 (Kore, sham-RKÇ), Jawspace (İngiltere) |
| Vajinismus internet BDT (12-F5) | HelloBetter Vaginismus Plus (DiGA) |
| Erken boşalma, ED davranışsal (11-F5, 11 envanter) | Melonga, Kranus Edera (EDDIG RKÇ) |
| Göz kırpma hatırlatıcı, miyopi mesafe uyarısı (05-F2/F3'ün hatırlatıcı kısmı, 16-F8) | BlinkEasy, Eye Care 20 20 20, Plano, Apple Ekran Mesafesi |
| ePRO semptom takibi (15-F1'in anket kısmı) | Kaiku, Noona, Moovcare (CE) |
| Bilişsel eğitim, afazi, MS yorgunluğu, hemianopsi | BrainHQ/CogniFit, Constant Therapy, elevida, NeuroEyeCoach |
| Kadans metronomu (23-F2'nin metronom kısmı) | Runcadence, Runo, Garmin |
| Uzun COVID HRV/pacing, kaşıma takibi | Visible, Itch Tracker (Apple Watch) |
| VDOT, aşı hatırlatıcı, MASK-air | SureAdhere, e-Nabız, MASK-air |

### 3.3 Yalnızca izleme olduğu, kanıtı olumsuz olduğu ya da risk/fayda dengesi kötü olduğu için elenenler

- **Yalnız izleme:** FibriCheck, Sway, Canvas Dx, Baby Moves, Dental Monitoring, yara fotoğraf ölçümü (Swift), ateş tahmini (FeverPhone), idrar rengi, kamera termografi, bebek apne (22-F8: AAP 2022 ev monitörlerinin SIDS'i azaltmadığını söylüyor; yanlış güvence riski "yüksek").
- **Kanıt olumsuz:** Diyaliz CBT-I (SLEEP-HD plaseboya üstün değil), pacing (Pace Me n=250 negatif), ayak bileği egzersiz listesi uygulaması (van Reijen n=220 kitapçığı geçemedi), ultrasonik sivrisinek kovucu (Cochrane sıfır etki), paced respiration menopoz (Carpenter 2013, Huang 2015 negatif), cihaz-rehberli solunum HT'de bağımsız çalışmalarda etkisiz (Landman 2014).
- **Risk/fayda kötü:** Kronoterapi koçu (uyku yoksunluğu, mani, uykusuz sürüş — Düşük risk 4), Uyku-Drill ISR (epilepsi/bipolar), opioid titrasyon koçu, AdımKoru (sarhoşluk tespiti yanlış güvence), TurnikeNabız (soğuk parmakta PPG yanlış "nabız yok"), SVT Valsalva (VT'yi SVT sanma), BebekNefes.

---

## 4. Yeniden puanlanmış ilk 20 (tekilleştirilmiş)

63 aday (198 fikrin tekilleştirilmiş, "zaten var" ve "fizik olarak olmaz" olanları çıkarılmış hali) yeniden puanlandı. İlk 20:

| Sıra | Fikir (birleşik) | Kaynak (dosya-F#) | T | K | E | Y | R | **Ağırlıklı /70** |
|---|---|---|---|---|---|---|---|---|
| 1 | DuvarKoçu — izometrik duvar squat (HT) | 01-F1 + 24-F1 | 8 | 8 | 10 | 7 | 6 | **57,0** |
| 2 | HareketDöngüsü — yemek sonrası yürüyüş + sedanter kırıcı | 10-F1 + 10-F2 + 24-F5 + 20-F6 | 9 | 7 | 9 | 5 | 9 | **56,0** |
| 3 | NefesDüzeni — BREATHE astım, sensör doğrulamalı | 08-F2 + 21-F1 | 8 | 8 | 8 | 5 | 9 | **54,0** |
| 4 | KarınSakin — çocuk FKA/İBS hipnoterapi | 13-F1 (+09-F3) | 10 | 8 | 7 | 4 | 9 | **54,0** |
| 5 | NabızNefes — kamera-PPG rezonans HRV (anksiyete/HT/ağrı) | 03-F1 + 24-F2 + 01-F6 + 19-F2 + 16-F3 + 02-F5 | 9 | 6 | 9 | 4 | 9 | **53,5** |
| 6 | NefesŞarkı — KOAH mikrofonlu "Singing for Lung Health" | 08-F5 | 8 | 7 | 7 | 7 | 9 | **52,5** |
| 7 | Diyafram Koçu — GÖRH IMU diyafragma nefesi | 09-F1 + 24-F4 | 9 | 5 | 7 | 7 | 10 | **52,0** |
| 8 | DengeDöngü — IMU denge/düşme + CIPN | 07-F1 + 14-F1 + 15-F3 + 23-F6 + 02-F7 | 7 | 7 | 9 | 6 | 6 | **51,0** |
| 9 | Anlık Sıkışma Yardımcısı — OAB *(zaten var sınırında: Tät II/INKA)* | 11-F1 | 9 | 7 | 7 | 4 | 9 | **51,0** |
| 10 | Kamera-Alışkanlık platformu — BFRB + tik + gündüz bruksizm | 04-F1 + 17-F1 + 13-F2 | 6 | 6 | 7 | 9 | 9 | **50,0** |
| 11 | Cesur Diş — dental fobi maruz bırakma + PPG | 17-F2 | 8 | 6 | 7 | 6 | 8 | **49,0** |
| 12 | Ağrıyı Yeniden Yaz — dijital PRT + IMU *(Curable/Lin Health var)* | 19-F3 | 8 | 7 | 8 | 4 | 6 | **48,5** |
| 13 | SesKoçu — PD hipofoni/disfoni mesafe-normalize SPL + Lombard | 06-F1 + 02-F3 | 8 | 6 | 6 | 7 | 8 | **48,0** |
| 14 | NÖBETÇİ — onkoloji ePRO + pasif sensör *(ePRO var; klinik altyapı şart)* | 15-F1 | 7 | 7 | 8 | 5 | 6 | **48,0** |
| 15 | ÇeneFizyo-TR — TME egzersiz + kamera MMO *(Clickless/Jawspace var)* | 17-F4 | 8 | 7 | 7 | 3 | 8 | **47,5** |
| 16 | KalkGüç — kamera STS gücü, sarkopeni | 14-F2 | 7 | 6 | 7 | 7 | 7 | **47,5** |
| 17 | ElDöngü — RA el ROM kamera + SARAH | 16-F1 | 7 | 6 | 6 | 7 | 9 | **47,5** |
| 18 | Döngü Koçu — dismenore HRV + haptik | 12-F1 | 7 | 4 | 8 | 6 | 9 | **47,5** |
| 19 | DilKoçu — miyofonksiyonel terapi (horlama/OSA, çocuk) | 18-F1 + 17-F3 | 7 | 6 | 8 | 5 | 7 | **47,5** |
| 20 | Senkop Kalkanı — PCM eğitimi + tam zamanında | 01-F3 | 7 | 7 | 5 | 8 | 8 | **47,0** |

20. sırayı 47,0 ile paylaşanlar: RitimAdım (RAS; 02-F1 + 07-F2 + 14-F3 + 16-F5 + 23-F2), Nöbetçi-sigara (24-F3), Elini Çek tek başına (04-F1). 21–30: ÖksürükFreni 46,5; BULANTI SAATİ 46,5; ÇeneBoş tek başına 46,0; MiyoDoz 46,0; Klodikasyo 46,0; Kaka Zamanı 46,0; DengeYol 46,0; İğneDostu 45,5; TikGörü tek başına 45,5; Doğum Provası 45,5.

**Alan ajanlarının sıralamasından en belirgin düşüşler ve gerekçesi:**

| Fikir | Alan puanı /50 | Benim ağırlıklı /70 | Neden düştü |
|---|---|---|---|
| NÖBETÇİ (15-F1) | 39 (Etki 10) | 48,0 | Sağkalım etkisi (Basch 2017) ePRO'nun kendisinden değil hemşire yanıt sisteminden; ePRO ürünleri var; pasif katman için müdahale RKÇ'si yok; PROStep'te uyum %53–64 |
| İnhalerKoç (08-F3, 13-F3) | 38 / 36 | 43,5 → elendi | Kata Inhalations-App aynı işi yapıyor |
| ElDöngü (16-F1) | 39 | 47,5 | Kamera-ROM goniometreye karşı doğrulanmamış; deforme RA elinde landmark kaybı; el OA egzersiz kanıtı RA'dan zayıf |
| Anlık Sıkışma (11-F1) | 37 | 51,0 ama "zaten var" | Tät II (RKÇ) ve INKA aynı davranışsal paket; fark yalnızca JIT haptik modül + Türkçe |
| Kronoterapi Koçu (03-F2) | 36 | 43,0 | Yuen 2021 pilot anlamsız; bipolar/epilepsi/uykusuz sürüş riski |
| Pelvik Taban Teknik / Pelvik Ayna (11-F2, 12-F3) | 36 / 35 | 43,0 | Cochrane 2025: biofeedback eklemenin faydası yok → ürünün tezi kanıta ters |
| GAMA-40 (02-F6, 14-F8) | 25 / 24 | 31,0 | 120 Hz şartı, doz 1/2–1/7, n=15 pilot, GammaBoost var, epilepsi riski |

**Yükselenler:** HareketDöngüsü (10-F1 40 → 56,0; teknik en olgun, risk en düşük, kanıt üç bağımsız meta-analiz/RKÇ), NefesŞarkı (08-F5 39 → 52,5; Kaasgaard 2022 n=270 egzersize eşdeğerlik), Kamera-Alışkanlık platformu (üç alanın tekil 37–38'lik fikirleri birleşince yenilik ve etki büyüdü).

---

## 5. Altı finalist

### 5.1 Finalist 1 — DuvarKoçu (57,0) · 01-kardiyoloji F1 + 24-aile-hekimligi F1

**Neden seçildi.** Cihaz-dışı kanıtı en güçlü fikir: Edwards 2023 BJSM ağ meta-analizi (270 RKÇ, n=15.827) izometrik egzersizin istirahat tansiyonunu −8,24/−4,00 mmHg düşürdüğünü, alt modlar içinde duvar çömelmesinin en etkili olduğunu (SUCRA %90,4) gösteriyor; Lea 2024 (Eur J Appl Physiol) ev tabanlı, RPE-rehberli 4 haftalık programla SBP −9 ila −14 mmHg buldu. Bu etki büyüklüğü tek bir antihipertansif ilacınkine yakındır. Hasta kitlesi dünyada 1,28–1,4 milyar (WHO), Türkiye'de ~15–18 milyon; yalnızca %23'ü kontrol altında. Telefonun işi egzersizi "üretmek" değil, **dozu denetlemek**tir (diz açısı 90–135° arasında her 5° anlamlı — Goldring 2014; 2 dk × 4 set; Valsalva yasağı) — tam da kamera poz tahmini ve IMU'nun iyi yaptığı iş. İki bağımsız alan ajanı (kardiyoloji, aile hekimliği) aynı protokole, aynı kanıta ulaştı; ticari eşdeğer bulunamadı (Zona Plus donanımdır; fitness uygulamalarındaki "wall sit" zamanlayıcıları tıbbi doz/güvenlik içermez — mağaza taraması yapılmadı, doğrulanmadı). Tansiyon sonucu kullanıcının manşetli ev cihazından elle girilir; kamera-tansiyon **kullanılmaz**.

**En büyük risk.** Güvenlik: izometrik kasılma sırasında SBP 90° diz açısında ~196 mmHg'ye çıkabilir (Goldring 2014). Kontrolsüz HT (>160/100 veya >180/110), yakın MI, aort stenozu/anevrizma, retinopati, ileri diz OA, gebelik dışlanmalı; ilk seanslar hekim onaylı. İkinci risk: yan görüş kamera kurulumunun sürtünmesi (telefonu yere/sehpaya yaslama) ve 12 haftalık bağlılık. Üçüncü: "egzersiz uygulaması" ile "tıbbi cihaz" sınırı — tansiyon düşürme iddiası CE-MDR Kural 11 Sınıf IIa, FDA muhtemel Sınıf II.

**İlk 90 gün.** (1) Hafta 1–3: App Store/Google Play ve FDA/CE veritabanlarında "isometric wall squat hypertension" taraması; yenilik iddiasını yazılı doğrula. (2) Hafta 2–6: MediaPipe/ML Kit ile yan profil diz açısı ölçümünün goniometreye karşı ±5° doğruluğunu 20 gönüllüde test et; düşük ışık için IMU-uylukta yedek mod. (3) Hafta 4–8: Protokol motoru (4×2 dk, 2 dk dinlenme, RPE titrasyonu, Valsalva için mikrofonla "sesli say"), kontrendikasyon tarama anketi, manşetli tansiyon girişi (isteğe bağlı OCR). (4) Hafta 8–12: 30 kişilik, 4 haftalık tek kollu fizibilite (uyum, güvenlik olayları, ev SBP değişimi) ve 12 haftalık RKÇ protokolünün etik kurula sunumu (karşılaştırıcı: standart yaşam tarzı tavsiyesi; birincil sonlanım ev/ambulatuvar SBP). Aile hekimliği entegrasyonu (hekim onay akışı) tasarıma gömülür.

### 5.2 Finalist 2 — HareketDöngüsü (56,0) · 10-endokrinoloji F1 + F2, 24-aile F5, 20-nefroloji F6

**Neden seçildi.** Teknik olarak en olgun ve en düşük riskli finalist: IMU adım/kadans sayımı güvenilir, hiçbir yeni sensör yöntemi gerekmez. Kanıt üç bağımsız kaynaktan: Reynolds 2016 (Diabetologia, çapraz RKÇ, n=41) yemek sonrası 10 dk yürüyüşün postprandiyal glukozu serbest zamanlı 30 dk'ya göre %12 (akşam yemeğinde %22) düşürdüğünü; Engeroff 2023 (Sports Med meta-analiz) yemek-egzersiz aralığının anlamlı moderatör olduğunu; Buffey 2022 (Sports Med meta-analiz, 7 çalışma) hafif yürüyüş molalarının glukozu %17 düşürdüğünü; Dempsey 2016 (Diabetes Care, n=24; bellekten, doğrulanmadı) her 30 dk'da 3 dk'nın glukoz iAUC'yi ~%39 azalttığını gösteriyor. Hasta kitlesi: dünyada 589 milyon diyabetli (IDF 2025), Türkiye 9,6 milyon + TURDEP-II'ye göre ~%30 prediyabet. Mevcut ürünler (adım sayarlar, akıllı saat "ayağa kalk", CGM "glukoz yükseliyor" bildirimleri) ya donanım ister ya da yemek olayına bağlı değildir. Endokrinoloji ajanının önerdiği gibi "yemek sonrası 10 dk + her 30 dk'da 3 dk" tek üründe birleşir; nefroloji raporundaki VTE baldır pompası ve aile hekimliğindeki "egzersiz atıştırmalığı" aynı motorun modülleridir.

**En büyük risk.** Kanıtın tamamı **akut** (saatlik glukoz) sonlanımlıdır; uygulamayla tetiklenen yürüyüşün 12 haftada HbA1c'yi düşürdüğü gösterilmemiştir. Bağlılık aylar içinde düşer (bildirim yorgunluğu). Yenilik puanı düşük (kavram sıradan; fark kapalı döngü tetikleme). Güvenlik: insülin/sulfonilüre kullananlarda egzersiz hipoglisemisi, kalp yetmezliği/anjinada yemek sonrası efor, diyabetik ayak ülserinde yürüyüş yasağı (DuvarKoçu ve bu modül ters kilitlenmeli).

**İlk 90 gün.** (1) Yemek algılama tasarımı: tek dokunuş + öğrenen zaman penceresi + GPS/hareketsizlik vekili; yanlış pozitif oranı 20 kullanıcıda ölçülür. (2) IMU doğrulama: ≥8 dk, ≥80 adım/dk "tamamlandı" ölçütü cep/el konumunda kalibre edilir; yerinde yürüyüş ve merdiven (barometre) modu. (3) "Genel sağlık" konumlu MVP mağazaya çıkar (SaMD iddiası yok). (4) Hafta 8–12: Reynolds protokolüyle 2 haftalık CGM'li çapraz tasarım (n≈30, T2D) için etik kurul; birincil sonlanım postprandiyal iAUC. Bu çalışma ucuzdur ve 6 ayda "uygulama tetikli yürüyüş = gözetimli yürüyüş" eşdeğerliğini verebilir; 12 haftalık HbA1c çalışması ikinci yıl.

### 5.3 Finalist 3 — Nefes Platformu (54,0; modüller 52–54) · 19 fikrin birleşimi

**Neden seçildi — ve neden tek platform.** Dürüst olmak gerekirse, ilk 20'nin dördü (NefesDüzeni 54,0; NabızNefes 53,5; NefesŞarkı 52,5; Diyafram Koçu 52,0) ve 20 dışında beşi daha (panik nefes, dismenore, KY nefes, migren nefes, bulantı haptik nefes) **aynı teknik çekirdeği** paylaşıyor: nefes pacer (ekran dairesi + haptik inhale/ekshale + hoparlör tonu), telefon göğüs/karın üstündeyken IMU ile solunum hızı ve karın/göğüs oranı (Landreani 2017: karın yerleşiminde hata <%2 — 24-aile raporu), mikrofonla solunum/ses, parmak kamera-PPG ile kalp hızı ve HRV (RMSSD için EKG ile ICC >0,90 — 24-aile ve 19-algoloji raporları), kişiye özel rezonans frekansı taraması (4,5–6,5 nefes/dk). Bunları ayrı ayrı yapmak israf, tek bir "nefes motoru" üzerine hastalık modülleri koymak doğru mimaridir. Modül öncelik sırası kanıta göre:

| Modül | Kaynak | Kanıt (en güçlü) | Ağırlıklı | Sıra |
|---|---|---|---|---|
| **Astım — NefesDüzeni** | 08-F2 + 21-F1 | Bruton 2018 Lancet Respir Med, n=655: DVD+kitapçık = yüz yüze fizyoterapi, AQLQ +0,28; dijital sürüm (My Breathing Matters) fizibilite RKÇ | 54,0 | 1 |
| **Anksiyete/stres — NabızNefes** | 03-F1 + 24-F2 + 19-F2 + 16-F3 + 02-F5 + 01-F6 | Goessl 2017 meta-analiz (24 çalışma, n=484): HRV-BF stres/anksiyete g=0,83; Lehrer 2020: ağrıda d≈0,41; kamera-PPG HRV-BF RKÇ yok (Dolgilevica 2025 n=60 en yakın) | 53,5 | 2 |
| **KOAH — NefesŞarkı** | 08-F5 | Kaasgaard 2022 ERJ, n=270: SLH egzersiz eğitimine eşdeğer (6DYT fark 1 m); Philip 2024 çevrimiçi RKÇ | 52,5 | 3 |
| **GÖRH — Diyafram Koçu** | 09-F1 + 24-F4 | Eherer 2012 n=19, Ong 2018 n=36 (ikisi de doğrulanmadı), Niu 2024 n=60 reflü-öksürük; Fooyin uygulama RKÇ'si tamamlandı, sonuç yok | 52,0 | 4 |
| Panik/hiperventilasyon — NefesFreni | 22-F1 + 03-F4 + 08-F6 | Freespira açık etiketli; CO₂ ölçülemediği için mekanizma belirsiz (Meuret 2010) | 43,5 | 5 (araştırma) |
| Dismenore, KY, migren, bulantı | 12-F1, 01-F4, 02-F5, 15-F2 | Küçük/çelişkili | 43–48 | Sonra |

**Hipertansiyon iddiası bu platformda ikincildir:** cihaz-rehberli yavaş solunumun HT kanıtı çelişkilidir (Mahtani 2012 −3,7 mmHg ama üretici dışı çalışmalarda etki yok; Landman 2014 sham/müziğe karşı fark yok). Tension Tamer pilotu (evre-1 HT n=30, 3. ayda −8,0 vs −1,9 mmHg) umut verici ama tam RKÇ yayımlanmamış. HT için ana araç DuvarKoçu'dur; nefes modülü ona "ek" olarak sunulur.

**En büyük risk.** Pazar kalabalık: Breathwrk, Calm, Apple Breathe, Welltory, HRV4Biofeedback. Fark yalnızca (a) hastalığa özgü kanıtlı protokole sadakat, (b) sensörle "tekniğin gerçekten yapıldığının" doğrulanması, (c) Türkçe. Bu fark kullanıcıya görünür kılınmazsa ürün "bir nefes uygulaması daha" olur. İkinci risk: kamera-PPG'nin hareket/soğuk parmakta bozulması (sinyal kalite indeksi şart) ve her modül için ayrı RKÇ maliyeti.

**İlk 90 gün.** (1) Nefes motoru: pacer + IMU solunum (telefon göğüste/karında) + mikrofon hız + kamera-PPG HRV; 30 gönüllüde IMU solunum hızının kapnograf/solunum kemeriyle, PPG RMSSD'nin EKG ile uyumu. (2) İlk modül astım: BREATHE'in 4 modülünün Türkçe eşdeğeri (telif/lisans görüşmesi ya da fizyoterapistle yeniden yazım), ACT/AQLQ ölçümleri, "ilacını bırakma" uyarısı. (3) İkinci modül anksiyete: rezonans frekansı taraması + 8 haftalık 2×10 dk protokol; "genel sağlık" konumuyla mağaza. (4) Astım için eşdeğerlik RKÇ protokolü (karşılaştırıcı: BREATHE kitapçığı; birincil AQLQ) etik kurula.

### 5.4 Finalist 4 — KarınSakin (54,0) · 13-pediatri F1 (+ 09-gastro F3)

**Neden seçildi.** Kanıt düzeyi tüm havuzda en net olanlardan biri: Rutten 2017 JAMA Pediatr non-inferiority RKÇ (n=260, 8–18 yaş): evde hipnoterapi CD'si 1 yılda %62,1 tedavi başarısı vs terapist %71,0, non-inferior; Vlieger 2007 Gastroenterology RKÇ; Rexwinkel 2022 uzun dönem izlem. Mekanizma (hoparlörden yönlendirilmiş hipnoterapi senaryosu) telefonda **birebir**; teknik risk sıfıra yakın. Hasta kitlesi büyük: fonksiyonel karın ağrısı bozuklukları çocukların ~%13,5'i (Korterink 2015, bellekten) → Türkiye ~2 milyon, dünya ~250 milyon çocuk. Yetişkin için Nerva/Regulora var; **pediatrik ve Türkçe sürüm yok** (doğrulanmadı). Yenilik puanı bu yüzden düşük (4); seçilme nedeni yenilik değil, "en az maliyetle en kesin fayda". Gastroenteroloji raporundaki "Anında Bağırsak" (09-F3; HRV tetikli tam zamanında mikro-seans) ileride Nefes Platformu ile köprü kurar.

**En büyük risk.** (1) Organik hastalığın (çölyak, İBH) atlanması → uygulama yalnızca hekim tanısı sonrası, kırmızı bayrak taramasıyla açılmalı. (2) İçerik: Rutten'in CD içeriği lisans ister ya da klinik hipnoterapistle eşdeğer Türkçe senaryo üretilmeli; "eşdeğerlik" iddiası için küçük bir non-inferiority çalışması gerekir. (3) 12 hafta × ≥5 seans/hafta bağlılık (oyunlaştırma, ebeveyn modülü).

**İlk 90 gün.** (1) Hafta 1–4: Pediatrik gastroenterolog + klinik hipnoterapist ile 8–12 ve 13–18 yaş için iki senaryo seti (her biri 6–8 seans × 15–20 dk) yazılır/seslendirilir; lisans seçeneği paralel araştırılır. (2) Hafta 3–8: Uygulama: seans oynatıcı, günlük ağrı/okul devamsızlığı günlüğü, senaryo rotasyonu, ebeveyn raporu, kırmızı bayrak tarama; isteğe bağlı mikrofonla nefes ritmi. (3) Hafta 8–12: Tek merkezde 40 çocukluk pilot (uyum, 12 haftalık ağrı sıklık/şiddet değişimi) ve non-inferiority RKÇ (CD vs uygulama) protokolü. Regülasyon: düşük risk, Sınıf I–IIa; SGK geri ödemesi için RKÇ.

### 5.5 Finalist 5 — Yaşlı Hareket Koçu (51,0; modüller 47–51) · 07-ftr F1 + 14-geriatri F1 + F2 + F3 + 02-noroloji F1 + 07-ftr F2 + 15-onkoloji F3 + 16-romatoloji F5 + 23-spor F2/F6 + 02-noroloji F7

**Neden seçildi.** Dört alan (FTR, geriatri, nöroloji, onkoloji) birbirinden bağımsız olarak aynı IMU/kamera motorunu farklı hastalıklara uyguladı; geriatri ajanı üçünü "tek uygulama, tek klinik çalışma" olarak birleştirmeyi zaten önerdi. Kanıt cihaz/egzersiz tarafında güçlü: denge-kuvvet egzersizi düşmeleri ~%23 azaltır (Sherrington 2019 Cochrane, bellekten); StandingTall tablet RKÇ (BMJ 2021, n=503) 24 ayda düşmeleri ~%16–20 azalttı; Streckmann 2024 JAMA Intern Med (n=158) gözetimli sensorimotor eğitimin CIPN insidansını %70,6'dan %30,0'a düşürdüğünü gösterdi; RAS için Ghai 2018 meta-analizi (PD) ve telefon metronomu RKÇ'si (2012, n=20 inme); kamerayla sandalyeden kalkma gücü ölçümü 2025–26 çalışmalarında optik yakalamaya karşı R²=0,92–0,96. Hasta kitlesi: Türkiye 65+ 9,58 milyon (TÜİK 2025), yılda ~3 milyon düşme; dünyada 2023'te ~842.000 düşme ölümü (WHO). Mevcut ürünler (Nymbl, StandingTall) sensör geri bildirimi içermiyor; SWAY yalnızca ölçüyor.

**En büyük risk.** Düşme riski taşıyan kişiye evde, gözetimsiz denge egzersizi yaptırmak: sandalye/tezgah zorunluluğu, IMU düşme kilidi, ilk 2 hafta yakın eşliği tasarıma gömülmeli (Düşük risk 6). İkinci risk: telefonun vücutta sabit olmaması (göğüs cebi/bel lastiği; her oturumda 3 sn kalibrasyon) ve yaşlı kullanıcı/eski Android kısıtı (14-geriatri §0'daki tasarım kuralları çekirdek gereksinimdir). Üçüncü: düşme sonlanımlı RKÇ'nin uzun (12–24 ay) ve pahalı olması; bu yüzden ilk sonlanımlar STS gücü, yürüyüş hızı, salınım gibi vekiller olmalı.

**İlk 90 gün.** (1) IMU salınım ölçümünün kuvvet platformuyla korelasyonu (literatürde r≈0,6–0,8, doğrulanmadı) 20 yaşlıda test edilir; göğüs cebi vs bel lastiği karşılaştırılır. (2) Kamera STS gücü modülü (Alcazar tipi denklem — ad doğrulanmadı) ile 5×STS testi. (3) Ses-öncelikli, ≥18 pt, 2 derinlikli menü, yakın-kurulum QR'ı. (4) 30 kişilik 8 haftalık fizibilite (uyum, güvenlik, STS gücü/yürüyüş hızı değişimi). RAS modülü ve CIPN modülü ikinci yarıyıl; CIPN için onkoloji kliniğiyle kemoterapi takvimine bağlı pilot.

### 5.6 Finalist 6 — Kamera-Alışkanlık Platformu (50,0) · 04-dermatoloji F1 + 17-dis F1 + 13-pediatri F2 (+ kaşıntı modülleri)

**Neden seçildi.** Üç alanın birbirinden habersiz ürettiği fikir aynı: ön kamera + cihaz içi yüz/el nirengi ile istenmeyen davranışı anında yakala → haptik/görsel uyarı → yarışan tepki (habit reversal). Davranışsal kanıt güçlü: HRT, trikotillomani/dermatillomanide en iyi kanıtlı tedavi; CBIT/ERP için Hollis 2023 ORBIT RKÇ (n=224, etki −0,31, 18 ay kalıcı, maliyet-etkin); gündüz bruksizminde davranışsal yaklaşım ve EMA lehine 2026 derlemeleri. Tespit tarafı modüle göre değişir: el-saç/el-yüz teması kaba bir olaydır ve kolay yakalanır; motor tik için video tabanlı algılama yayımlanmış (Brügge 2023 F1 %82; Conelea 2024 göz tiki AUC 0,89); çene sıkma ise 4–12 piksellik doğrulanmamış bir sinyaldir. Etki kitlesi geniş: trikotillomani %0,6–4, dermatillomani %1,4–5,4 (dünya yüz milyonlar), tik bozuklukları okul çağının %1–3'ü, gündüz bruksizmi erişkinlerin ~%23'ü. Tek rakip HabitAware Keen (bileklik, donanım) ve BruxApp (yalnız EMA); kamera ile tam zamanında müdahale yapan ürün yok. Yenilik 9, risk 9 (yalnızca gizlilik ve bildirim yorgunluğu). Seçilme gerekçesi: diğer beş finalistten farklı bir mekanizma (kamera tespiti) ve en yüksek yenilik; puanı (50,0) 9. sıradaki OAB fikrinin (51,0) hemen altında, OAB ise Tät II/INKA nedeniyle "zaten var" sınırında.

**En büyük risk.** Teknik: kamera yalnızca telefon yüze dönükken (masa/ders/ekran kullanımı) çalışır; pil ve ısı için 1–10 fps; yanlış pozitifler kullanıcıyı bıktırır; çene sıkma tespiti için **hiç doğrulama verisi yok**. Gizlilik: görüntü asla cihazdan çıkmamalı, yalnızca nirengi vektörleri işlenmeli; çocuk modülünde KVKK/COPPA.

**İlk 90 gün.** (1) En kolay modülle başla: BFRB (el-yüz/el-saç teması >2 s) — 30 kişide eşzamanlı video etiketleme ile duyarlılık/özgüllük. (2) Tik modülü için Brügge/Conelea yaklaşımının cihaz içi hafif sürümü; ORBIT müfredatının Türkçe uyarlaması (ERP, 10 hafta). (3) Bruksizm için ürün değil **araştırma paketi**: 30–50 kişide eşzamanlı sEMG + ön kamera veri seti (17-dis raporunun önerisi); sınıflandırıcı doğrulanmadan bu modül yayınlanmaz. (4) Tümü için EMA taban çizgisi (günde 12 alert × 3 gün) ve 6 haftalık kapalı döngü protokolü; MGH-HPS / YGTSS / EMA sıkma sıklığı sonlanımlı pilot.

### 5.7 İlk altıya giremeyenler arasında not edilmesi gerekenler

- **Anlık Sıkışma Yardımcısı — OAB (51,0):** Puanı 6. finalistten yüksek ama Tät II/INKA ile aynı davranışsal omurga; yalnızca Türkçe + GPS/haptik "sıkışma anı" modülü farkı. Kural 6 nedeniyle finalist yapılmadı; Nefes Platformu'nun haptik pacer'ı ve HareketDöngüsü'nün bildirim motoru üzerine düşük maliyetli bir "yerelleştirme + JIT" projesi olarak ikinci yılda düşünülebilir.
- **Cesur Diş (49,0):** Dental anksiyete erişkinlerin %18'i; maruz bırakma BDT'nin kanıtı güçlü; hoparlör türbin sesini gerçekçi üretir. Nefes Platformu'nun PPG/pacer bileşenini kullanır; 7. sıra yedek.
- **SesKoçu (48,0):** Kamera ile mesafe-normalize SPL fikri özgün; LSVT kanıtı güçlü, PD COMM'un "daha ucuz dağıtım" çağrısına yanıt. Mikrofon motoru Nefes Platformu ile ortak.
- **ElDöngü (47,5) ve KalkGüç (47,5):** Aynı kamera poz/el motorunu kullanır; KalkGüç Finalist 5'e gömüldü, ElDöngü romatoloji modülü olarak Hareket Çekirdeği'ne eklenebilir.
- **Ağrıyı Yeniden Yaz (48,5):** Kanıt (Ashar 2022) güçlü ama Curable/Lin Health/Pathways var; Türkçe yerelleştirme + IMU maruz bırakma farkı küçük.
- **Senkop Kalkanı (47,0), ÖksürükFreni (46,5), BULANTI SAATİ (46,5):** Yenilik yüksek, kitle dar ya da kanıt küçük; ileri aday havuzu.

---

## 6. Önerilen sıralama ve strateji

### 6.1 Hangi projeyle başlanmalı?

**DuvarKoçu.** Gerekçe: (a) tek başına en yüksek ağırlıklı puan (57,0); (b) klinik sonlanım (istirahat SBP −8 mmHg) hem hastaya hem hekime hem geri ödeyiciye anlaşılır; (c) 12 haftalık, ev tansiyonu sonlanımlı RKÇ ucuz ve hızlı; (d) hasta kitlesi en büyük; (e) ticari rakip yok. HareketDöngüsü (56,0) teknik olarak daha kolay ve daha az riskli, ancak "tedavi" iddiası akut glukoz verisine dayanıyor ve yenilik algısı düşük; DuvarKoçu'nun ardından aynı kod tabanına ikinci modül olarak eklenmesi, iki ürünü ayrı ayrı yapmaktan daha değerli (HT ve T2D hastaları büyük ölçüde aynı kişiler).

Alternatif "en hızlı kazanım": **KarınSakin** teknik risk taşımadığı ve içerik ağırlıklı olduğu için küçük ayrı bir ekiple **paralel** başlatılmalı; ana mühendislik kapasitesini tüketmez.

### 6.2 Kod tabanı birleşimi

| Kod tabanı | Ortak motor | İçerdiği finalist/modüller | Paylaşılan bileşenler |
|---|---|---|---|
| **KT-1 "Hareket Çekirdeği"** | IMU (adım, kadans, oturma, salınım, ivme tepe) + kamera poz tahmini (diz açısı, STS, el) + bildirim/JITAI + manşetli tansiyon/glukoz elle giriş | F1 DuvarKoçu → F2 HareketDöngüsü → F5 Yaşlı Hareket Koçu (DengeDöngü, KalkGüç, RitimAdım, CIPN) → ElDöngü, Klodikasyo, Zıplama dozimetresi (ileride) | Poz motoru, IMU füzyonu (Madgwick), kontrendikasyon tarama, hekim onay akışı, yaşlı arayüzü |
| **KT-2 "Nefes Çekirdeği"** | Nefes pacer (ekran+haptik+ses) + IMU solunum + mikrofon + kamera-PPG HRV + rezonans frekansı | F3: astım → anksiyete → KOAH şarkı → GÖRH → panik → dismenore/KY/migren; Cesur Diş ve SesKoçu'nun PPG/mikrofon kısımları; OAB'nin haptik nefes modülü | PPG sinyal kalite indeksi, HRV hesabı, pacer, sesli rehber |
| **KT-3 "İçerik/Ses Terapisi"** | Ses oynatıcı + günlük + ebeveyn/hekim raporu | F4 KarınSakin (pediatrik hipnoterapi); ileride yetişkin "Anında Bağırsak" köprüsü KT-2 ile | KT-2'nin ses motoru ve günlük altyapısı yeniden kullanılır |
| **KT-4 "Kamera-Alışkanlık"** | Ön kamera yüz/el nirengi, cihaz içi olay sınıflandırıcı, EMA, haptik uyarı | F6: BFRB → tik → (doğrulama sonrası) bruksizm → gece kaşıma (mikrofon) | KT-1'in kamera/ML altyapısı ile ortak model çalışma zamanı |

Dört kod tabanı iki ML/sinyal altyapısını paylaşır: (i) cihaz içi görü (MediaPipe/ML Kit türü) KT-1 ve KT-4; (ii) PPG/IMU sinyal işleme KT-1 ve KT-2. Ortak bir "sensör kütüphanesi" ilk 90 günde yazılırsa dört ürün de ondan beslenir.

### 6.3 Zaman sırası (24 ay)

| Dönem | KT-1 Hareket | KT-2 Nefes | KT-3 İçerik | KT-4 Kamera-Alışkanlık |
|---|---|---|---|---|
| 0–3 ay | DuvarKoçu: poz doğrulama, protokol, fizibilite; ortak sensör kütüphanesi | Nefes motoru doğrulama (IMU solunum, PPG HRV) | KarınSakin senaryo üretimi + MVP | BFRB tespit doğrulama (30 kişi) |
| 3–6 ay | DuvarKoçu RKÇ başlangıcı; HareketDöngüsü "genel sağlık" MVP | Astım modülü MVP; anksiyete modülü | KarınSakin pilot (n=40) | Tik modülü; bruksizm sEMG+kamera veri seti |
| 6–12 ay | HareketDöngüsü CGM çapraz çalışması; Yaşlı Hareket Koçu denge+STS fizibilitesi | Astım eşdeğerlik RKÇ; KOAH şarkı ve GÖRH modülleri | Non-inferiority RKÇ | BFRB/tik pilot RKÇ |
| 12–24 ay | DuvarKoçu CE-MDR IIa dosyası; Yaşlı Hareket Koçu RAS+CIPN modülleri, vekil sonlanımlı RKÇ | Panik, dismenore modülleri; HT "ek" iddiası için Tension Tamer tipi çalışma | SGK geri ödeme başvurusu | Bruksizm modülü (yalnızca doğrulama olumluysa) |

### 6.4 Tek cümlelik strateji

İki platform (Hareket, Nefes) + bir hızlı içerik ürünü (KarınSakin) + bir yüksek yenilikli araştırma hattı (Kamera-Alışkanlık); ilk klinik iddia ve ilk regülasyon dosyası DuvarKoçu'na ait olmalı, çünkü kanıtı en sağlam, sonlanımı en anlaşılır, kitlesi en büyük.

---

## 7. Açık riskler ve doğrulanması gerekenler

1. **Mağaza taraması yapılmadı.** Hiçbir alan ajanı App Store/Google Play'i tarayamadı; "mevcut değil" ifadeleri literatür taramasına dayanır. İlk 90 günün ilk işi, altı finalist için İngilizce/Türkçe/Almanca mağaza ve FDA/CE/DiGA veritabanı taramasıdır. Özellikle: duvar squat/hipertansiyon uygulamaları, yemek-tetikli yürüyüş uygulamaları, pediatrik hipnoterapi uygulamaları, kamera tabanlı BFRB uygulamaları.
2. **Bellekten atıflar.** Dempsey 2016, Sherrington 2019, Eherer 2012, Ong 2018, Korterink 2015, Camacho 2015, Ghai 2018 etki büyüklükleri, Alcazar STS denklemi ve IMU–kuvvet platformu korelasyonu (r≈0,6–0,8) bu turda doğrulanmadı; kanıt puanlarında bir puan düşürülerek kullanıldı. Yayın önce teyit edilmeli.
3. **Hasta sayıları kaba tahmindir** (küresel prevalans × nüfus); yalnızca göreli karşılaştırma için anlamlıdır.
4. **Regülasyon:** Altı finalistten dördü (DuvarKoçu, Nefes-astım, Yaşlı Hareket, Kamera-Alışkanlık tedavi iddiasıyla) CE-MDR Kural 11 Sınıf IIa'ya düşer; TİTCK MDR'ı izler. "Genel sağlık" konumuyla başlayıp paralel RKÇ yürütmek önerilir; iddia dili her ekranda buna göre sınırlanmalıdır.
5. **Kamera-PPG ile tansiyon ve glukoz hiçbir üründe karar girdisi olmamalıdır** (24-aile §0, 10-endokrinoloji §0). Tüm finalistler bu kurala uyar.
