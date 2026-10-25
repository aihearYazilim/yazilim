# Psikiyatri — Cihazla tedavi edilen hastalıklar ve telefonla tedavi fikirleri

> Not (yöntem): Bu turda WebSearch kotası doluydu; doğrulama PubMed/Europe PMC sorguları ve üretici sayfalarının doğrudan
> çekilmesiyle yapıldı. Doğrulanamayan her iddia "**doğrulanmadı**" diye işaretlendi. Hasta sayıları WHO 2023 verisi
> (dünya) ve Türkiye nüfusu (~86 milyon) × küresel oran şeklinde **kaba tahmin**dir.

## 0. Önemli ön not: Dijital terapötik (DTx) alanı zaten kalabalık

Aşağıdaki ürünler **zaten var** ve onaylı; bunların kopyası önerilmez.

| Ürün | Şirket | Endikasyon | Durum (doğrulama) |
|---|---|---|---|
| reSET / reSET-O | Pear Therapeutics (2023'te iflas, varlıklar satıldı) | Madde kullanım bozukluğu / opioid | FDA De Novo 2017/2018 (genel bilgi; bu turda doğrulanmadı) |
| Somryst | Pear → Nox Health | Kronik insomni (CBT-I) | FDA 2020 (doğrulanmadı) |
| SleepioRx | Big Health | Kronik insomni, ≥18 yaş | FDA cleared (üretici sayfasından doğrulandı; yıl verilmemiş) |
| DaylightRx | Big Health | Yaygın anksiyete bozukluğu (YAB), ≥22 yaş | FDA cleared (üretici sayfasından doğrulandı) |
| EndeavorRx / EndeavorOTC | Akili | DEHB 8–17 yaş (dikkat); OTC yetişkin sürümü | FDA De Novo 2020; STARS-ADHD RCT (Kollins 2020, Lancet Digit Health, n=348, TOVA API fark ≈0,9 puan, d≈0,3) |
| Rejoyn (CT-152) | Otsuka + Click | Majör depresyon, ek tedavi | FDA cleared Nisan 2024 (Click sayfasından doğrulandı) |
| Motivista (CT-155) | Boehringer + Click | Şizofreni negatif belirtiler | FDA cleared Mayıs 2026 (Click sayfasından doğrulandı) |
| Freespira | Freespira Inc. | Panik bozukluğu ve TSSB (ek tedavi), 13–17 stres/anksiyete | FDA cleared; **kapnometre sensörü + tablet**, 28 gün, günde 2×17 dk (üretici sayfasından doğrulandı) |
| NightWare | NightWare Inc. | TSSB/kabus bozukluğu, ≥22 yaş | FDA De Novo Kasım 2020; **Apple Watch gerekir** |
| Prism | GrayMatters Health | TSSB (amigdala-EFP EEG nörofeedback), depresyon protokolü | FDA 510(k) 2023 (**doğrulanmadı**; sayfada yıl yok) |
| MamaLift Plus | Curio Digital | Doğum sonrası depresyon | FDA 2024 (**doğrulanmadı**) |
| deprexis | GAIA | Depresyon (CE / Almanya DiGA) | doğrulanmadı |
| NOCD, Personal Zen, Woebot, A-CHESS, FOCUS, TicHelper | çeşitli | OKB-ERP, dikkat yanlılığı, sohbet-CBT, alkol relaps, şizofreni öz-yönetim, tik-CBIT | Onaysız ya da araştırma uygulamaları; "aynı işi yapan var" listesinde kullanıldı |

Sonuç: **Salt CBT/psikoeğitim içerikli uygulama önermek anlamsız.** Fark yaratacak alan, telefonun **sensörlerini kapalı
döngüde** (ölç → tam zamanında müdahale et) kullanan ve bugün ek donanım gerektiren cihazların yerini alan yazılımlar.

## 1. Alanda cihazla tedavi edilen hastalıklar (envanter)

Mekanizma kısaltmaları: EM = elektrik/manyetik (telefon yapamaz), IŞ = ışık, SES = işitsel, HAP = haptik, BF = biofeedback,
DT = davranışsal/bilişsel dijital terapötik, SOL = solunum eğitimi, UYK = uyku/zamanlama manipülasyonu, MAR = maruz bırakma.

| Hastalık | Kullanılan cihaz | Etki mekanizması | Telefon üretebilir mi? | Not |
|---|---|---|---|---|
| Majör depresyon (MDB) | rTMS / derin TMS (BrainsWay), EKT, MST | EM: kortikal nöromodülasyon | **Hayır** | Manyetik alan/akım üretilemez |
| MDB | tDCS (Flow Neuroscience; üretici "FDA onaylı ev tipi tDCS" diyor, yıl sayfada yok) | EM: 2 mA DC akım | **Hayır** | — |
| MDB, anksiyete, insomni | Kraniyal elektroterapi (Alpha-Stim, Fisher Wallace) | EM: kulak memesi mikroakım | **Hayır** | Kanıt zayıf: Cochrane 2014 (Kavirajan), Brunyé 2021 "ciddi metodolojik sorunlar" |
| Dirençli MDB | Vagus sinir stimülatörü (LivaNova), DBS | EM | **Hayır** | — |
| MDB, mevsimsel depresyon (SAD) | 10.000 lux ışık kutusu, Luminette/Re-Timer gözlük | IŞ: sirkadiyen faz + melanopsin yolağı | **Zayıf** | 1000 nit ekran 20 cm'de ≈250–500 lux verir (fizik hesabı; ölçüm doğrulanmadı); 10.000 lux'ün ~%3–5'i. Ancak **şafak simülasyonu** (dawn simulation, 100–300 lux, Terman 2006 — doğrulanmadı) ekranla **anlamlı ölçüde** taklit edilebilir |
| MDB | Üçlü kronoterapi (uyanık kalma gecesi + uyku fazı öne alma + sabah ışığı) | UYK + IŞ | **Büyük ölçüde evet** (zamanlama birebir, ışık zayıf) | Yuen 2021 pilot RKÇ n=44, 1. hafta remisyon %25 vs %6,7 (anlamlı değil); Ferrara 2025/26 açık RKÇ sürüyor |
| MDB | Rejoyn (CT-152), deprexis, Prism-depresyon (EEG) | DT; EEG-NF | DT: **zaten var**; EEG: **Hayır** | — |
| Doğum sonrası depresyon | MamaLift Plus | DT | **Zaten var** | — |
| Bipolar depresyon / mani | Gündüz parlak ışık; "karanlık terapi" (amber gözlük) | IŞ | Işık zayıf; karanlık **Hayır** | Telefon odayı karartamaz; gece modu önemsiz etki |
| YAB, stres | HRV biofeedback cihazları (HeartMath Inner Balance, Moonbird el cihazı, Lief yama, RESPeRATE) | BF + SOL: rezonans frekansı (~6/dk) solunum → vagal tonus | **Birebir** (kamera PPG) | PPG-HRV vs EKG: RMSSD hata ~0,19 (Xu 2026 meta-analiz, havuzlanmış); PULSAR uygulaması depresyonda EKG'ye göre HRV'yi abartıyor (Comfort 2026) — ölçüm *göreli* takip için yeterli |
| YAB | DaylightRx; Personal Zen (dikkat yanlılığı değiştirme) | DT | **Zaten var** | Personal Zen: kontrolsüz pilotlar (Charvet 2021) |
| Panik bozukluğu | Freespira (kapnometre: end-tidal CO2 + solunum hızı) | BF + SOL: hipokapniyi düzeltme | **Zayıf** | CO2 ölçülemez; solunum hızı mikrofon/kamera/IMU ile ölçülür. Freespira kanıtı: Tolin 2017 çok merkezli açık çalışma, Cuyler 2022 gerçek yaşam n=1395 yanıt %65 (kontrolsüz); mekanizma RKÇ'si Meuret 2010 |
| Panik | İnteroseptif maruz bırakma (klinikte hiperventilasyon, dönme) | MAR | **Birebir** (protokol + HR geri bildirimi) | App sürümü için çalışma bulunamadı |
| TSSB | Prism (amigdala-EFP EEG nörofeedback) | BF (EEG) | **Hayır** | Prism'e özgü RKÇ bu turda bulunamadı; EEG-NF genel meta-analiz: düşük güven (Berman 2025) |
| TSSB kâbusları | NightWare (Apple Watch: kalp hızı + hareket → titreşim) | BF + UYK: uyandırmadan kâbusu bozma | **Zayıf-orta** (telefon yatakta IMU + mikrofon/sonar) | Sham-kontrollü RKÇ n=65 (Davenport 2023): gruplar arası fark anlamlı değil, yalnızca post-hoc |
| Kâbus bozukluğu | Hedefli bellek reaktivasyonu (TMR, Dreem bandı ile REM'de ses) + imgeleme prova terapisi (IRT) | SES + UYK | **Zayıf** (REM tespiti telefonla kaba) | Schwartz 2022 Curr Biol, n=36, TMR grubu daha az kâbus, 3 ayda sürdü |
| TSSB | EMDR ışık çubuğu / dokunsal "tapper" | Çift taraflı duyusal uyarım | **Birebir** | Ekran + titreşim; "RemotEMDR" vb. uygulamalar var (**adlar doğrulanmadı**) → zaten var |
| TSSB, fobiler | VR maruz bırakma (Bravemind) | MAR | **Zayıf** (düz ekran) | Gözlük yasak |
| TSSB/panik | Freespira (TSSB endikasyonu) | SOL | Zayıf | Jamison 2022 RKÇ (veteranlar) |
| OKB | Derin TMS (BrainsWay 2018), DBS (Reclaim HDE) | EM | **Hayır** | NOCD (ERP uygulaması) zaten var |
| DEHB | EndeavorRx, Monarch eTNS (trigeminal stim), EEG-NF | DT; EM; EEG | DT **zaten var**; EM/EEG **Hayır** | — |
| İnsomni | Somryst, SleepioRx; CES; akustik yavaş dalga uyarımı (bant); AVS | DT; EM; SES | DT zaten var; SES zayıf | Açık döngü AVS insomni (Tang 2016) kanıtı zayıf |
| Madde/alkol kullanım bozukluğu | reSET, reSET-O; derin TMS (sigara, 2020); Soberlink/alkolmetre tabanlı koşullu yönetim; A-CHESS (GPS) | DT; EM; BF | DT zaten var; EM hayır; **alkolmetre hayır** | Telefon alkolü ölçemez ama **yürüyüş** (Suffoletto 2020, n=17, %92,5 doğruluk) ve **ses** (Suffoletto 2023, lab, n=18, %98) ile sarhoşluğu tahmin edebilir |
| Şizofreni (işitsel halüsinasyon) | AVATAR terapisi (bilgisayar avatarı + terapist) | DT/MAR: sese karşı diyalog | **Birebir** (ekran + mikrofon + hoparlör) | AVATAR2 (Garety 2024 Nat Med, n=345): 16. haftada d=0,58 (uzun form), 28. haftada anlamlı değil |
| Şizofreni negatif belirti | Motivista (CT-155) | DT | **Zaten var** | — |
| Yeme bozuklukları (AN, BN, tıkınırcasına yeme) | Mandometer/Mandolean (tabak terazisi: yeme hızı geri bildirimi) | BF: yeme hızı eğrisi | **Zayıf-orta** (kamera ile lokma sayımı) | Bergh 2013 çok merkezli sonuçlar (tek araştırma grubu); Hamilton-Shield 2014 HTA pilot (çocuk obezitesi) |
| Tourette/tik | Neupulse (medyan sinir stim) | EM | **Hayır** | CBIT: TicHelper çevrimiçi var |
| Trikotillomani | HabitAware Keen bileklik | BF: el hareketi tespiti | Zayıf (kamera) | Telefon elde değilse göremez |

## 2. Proje fikirleri (telefon tek başına)

### Fikir 1: NabızNefes — Kamera PPG ile kapalı döngü HRV biofeedback ve haptik solunum pedalı
- **Hedef hastalık ve hasta sayısı:** Yaygın anksiyete bozukluğu, stres ilişkili bozukluklar, panik (yardımcı). Dünya: anksiyete bozuklukları 470 milyon (WHO 2023). Türkiye: ~%6 × 86 M ≈ 5 milyon (kaba).
- **Taklit edilen cihaz ve mekanizma:** HeartMath Inner Balance, Moonbird, Lief, RESPeRATE. Mekanizma: kişiye özel rezonans frekansında (4,5–6,5 nefes/dk) solunumla barorefleks kazancı ve vagal tonus artışı; "koherans" geri bildirimi.
- **Telefonda nasıl çalışır:** Parmak arka kameraya + flaşa konur; PPG'den RR aralıkları → gerçek zamanlı RMSSD/LF gücü. İlk 3 seans rezonans frekansı taraması (4,5–6,5/dk). Sonra telefon **avuçta/cepte** titreşim motoruyla nefes alma-verme ritmini verir (haptik pacer; ekrana bakmadan, göz kapalı), hoparlörden isteğe bağlı ses. Kapalı döngü: HRV genliği düşerse hız ayarlanır, puan verilir. Protokol: günde 2×10 dk, 8 hafta (HRVB literatür standardı). Ek: panik anı için 90 saniyelik "acil döngü".
- **Kanıt:** Cihaz tarafı: HRV biofeedback meta-analizleri anksiyete/stres için orta etki (Goessl 2017, Lehrer 2020 — bu turda doğrulanmadı). Telefon-kamera-biofeedback için RKÇ **bulunamadı** (Europe PMC taraması); en yakın: Dolgilevica 2025 (akıllı telefon HRVB, n=60, anksiyete azaldı; sensörün yalnızca kamera olup olmadığı belirsiz). Kamera-PPG HRV doğruluğu: Xu 2026 meta-analiz (RMSSD standart hata 0,19); Comfort 2026 (PULSAR, depresyonda abartı).
- **Mevcut uygulamalar:** Welltory, Camera HRV vb. **ölçüm** yapıyor (tedavi protokolü yok); HeartMath/Moonbird donanım ister. Rezonans frekansı kişiselleştirmeli, haptik pacer'lı, klinik dozlu (8 hafta) ve kapalı döngü *tedavi* uygulaması olarak bilinen onaylı ürün yok (**doğrulanmadı**: App Store'da kısmi örnekler olabilir).
- **Teknik zorluklar / çözüm:** Hareket artefaktı → sinyal kalitesi indeksi, kötü segmentleri at; soğuk parmak/koyu ten → flaş yoğunluğu ve kazanç adaptasyonu; parmak sabit tutma 10 dk yorucu → seansı 2×5 dk böl; HRV mutlak değer güvenilmez → yalnızca kişi-içi değişim kullan.
- **Regülasyon:** TİTCK/CE-MDR Sınıf IIa (anksiyete tedavi iddiası), FDA 510(k) veya De Novo (DaylightRx öncül). Yardımcı tedavi iddiası için en az bir RKÇ gerekir.
- **Riskler:** Düşük. Yavaş solunumla hiperventilasyon/baş dönmesi; ciddi aritmi/pacemaker'da yanlış HRV; panik sırasında tek başına kullanımın tedaviyi geciktirmesi.
- **Puanlama:** Teknik 8 | Kanıt 7 | Etki 9 | Yenilik 6 | Düşük risk 9 | **TOPLAM 39/50**

### Fikir 2: Kronoterapi Koçu — Telefon-yönetimli üçlü kronoterapi ve ışık dozu kapalı döngüsü (depresyon)
- **Hedef hastalık ve hasta sayısı:** Majör depresyon (unipolar), mevsimsel depresyon. Dünya: 322 milyon (WHO 2023). Türkiye: ~%4–5 × 86 M ≈ 3,5–4 milyon (kaba).
- **Taklit edilen cihaz ve mekanizma:** Işık kutusu + şafak simülatörü + klinikte uygulanan üçlü kronoterapi (TCT: 1 gece tam uyanık kalma → 3 gün uyku fazı öne alma → her sabah parlak ışık). Mekanizma: sirkadiyen faz ilerletme, uyku basıncı sıfırlama, hızlı antidepresan yanıt.
- **Telefonda nasıl çalışır:** (1) Hekim onayıyla TCT takvimi: uyanık kalma gecesinde her 20 dk aktivite görevi, uykuya dalmayı IMU/ekran etkileşimi ile tespit edip titreşim+ses ile önleme; (2) faz öne alma: yatış/kalkış saatleri, akşam ekran karartma, sabah "şafak" simülasyonu (yastık başında ekranda 30 dk boyunca 0→maks parlaklık; fiziksel sınır ≈250–500 lux); (3) **ışık dozu kapalı döngüsü**: ortam ışığı sensörü + GPS ile sabah 1 saat içinde ≥2500 lux (dış mekân) maruziyetini ölçer, yoksa dışarı çıkma uyarısı gönderir; akşam >100 lux maruziyeti uyarır. Ekranı ışık kutusu yerine **değil**, gerçek gün ışığına yönlendiren bir dozimetre olarak kullanır. Protokol: TCT 1 hafta + 6 hafta ışık/uyku koruması.
- **Kanıt:** Cihaz/klinik: uyku yoksunluğuna saatler içinde yanıt %45–60 (Geoffroy 2021 derleme); TCT pilot RKÇ Yuen 2021 (n=44, anlamlı değil, uygulanabilir); parlak ışık tedavisi MDB'de orta etki (çok sayıda meta-analiz; bu turda doğrulanmadı); şafak simülasyonu SAD'de ışık kutusuna yakın (Terman 2006 — doğrulanmadı). Telefon tabanlı TCT/ışık dozimetresi çalışması: **yok**.
- **Mevcut uygulamalar:** Uyku/ışık takip uygulamaları (ör. ışık ölçer) ve CBT-I var; evde TCT'yi yöneten ve ışık maruziyetini kapalı döngüyle koçlayan tedavi uygulaması bilinen yok (**doğrulanmadı**).
- **Teknik zorluklar / çözüm:** Ortam ışığı sensörü cepteyken ölçmez → kullanıcıdan "telefonu masaya/pencereye koy" periyotları + GPS dış mekân çıkarımı; uyanık kalma gecesi güvenlik → araç kullanma yasağı, uyku takibi; ekran lux'ü düşük → şafak simülasyonu rolüyle sınırla, iddiayı abartma.
- **Regülasyon:** Tedavi iddiası → CE-MDR Sınıf IIa, FDA De Novo (Rejoyn benzeri). Yalnızca hekim reçetesiyle. RKÇ şart.
- **Riskler:** Bipolar hastada mani kayması (tarama zorunlu), uyku yoksunluğunda nöbet eşiği düşmesi (epilepsi dışlanır), uykusuz araç kullanımı, intihar düşüncesi olan hastada denetimsiz uygulama.
- **Puanlama:** Teknik 9 | Kanıt 6 | Etki 8 | Yenilik 8 | Düşük risk 5 | **TOPLAM 36/50**

### Fikir 3: SesAyna — Mikrofon tabanlı konuşma/ses izleme ile tam zamanında davranışsal aktivasyon (depresyon JITAI)
- **Hedef hastalık ve hasta sayısı:** Majör depresyon, bipolar depresyon izlemi. Dünya 322 M + 36 M bipolar; Türkiye ≈4 M (kaba).
- **Taklit edilen cihaz ve mekanizma:** Doğrudan bir cihaz değil; ses biyobelirteç şirketlerinin (Kintsugi, Ellipsis Health, Sonde — yalnızca tespit) ölçümünü, Rejoyn/davranışsal aktivasyon içeriğiyle **kapalı döngüye** bağlar. Mekanizma: konuşma prozodisi (monotonluk, yavaşlama, duraklama, ses enerjisi) + klavye yazım hızı + GPS hareketsizlik + ekran kullanım ritmi → kötüleşme riski → aynı gün 5 dakikalık mikro-müdahale (davranışsal aktivasyon görevi, sosyal temas görevi, ruminasyonu kesme egzersizi).
- **Telefonda nasıl çalışır:** Günlük 30 saniyelik sesli günlük (isteğe bağlı: arama sırasında yalnızca cihaz-içi özellik çıkarımı, ham ses saklanmaz) + pasif sensörler. Cihaz-içi model kişi-içi sapmayı izler; eşik aşımında bildirim + görev; haftalık PHQ-9 ile kalibre. 12 hafta.
- **Kanıt:** Tespit tarafı: ses özellikleri bipolar duygudurumla ilişkili (Kutcher 2026 derleme), relaps tahmini AUC 0,70–0,88 (Fang 2026 derleme; çoğu iç doğrulama). Konuşmadan depresyon şiddeti için güvenilir doğruluk rakamı **bulunamadı**. JITAI tarafı: pilot RKÇ'ler (Wang 2023 ruminasyon-JITAI; Bell 2023 Mello) — sensör tetikli değil. Kapalı döngü ses→müdahale çalışması: **yok**.
- **Mevcut uygulamalar:** Kintsugi/Ellipsis/Sonde (tespit, B2B), mindLAMP/Beiwe (araştırma izleme), Woebot/Youper (müdahale ama sensörsüz). İkisini birleştiren onaylı ürün yok.
- **Teknik zorluklar / çözüm:** Ses belirteçlerinin kişiler arası güvenilmezliği → yalnızca kişi-içi temel çizgiye göre sapma; gizlilik → tüm işleme cihaz-içi, ham ses silinir; ortam gürültüsü → yalnızca kontrollü sesli günlük; yanlış alarm yorgunluğu → haftada en fazla 3 tetik.
- **Regülasyon:** Sınıf IIa/De Novo; tahmin algoritması için klinik doğrulama + müdahale için RKÇ. KVKK/GDPR ağır.
- **Riskler:** Yanlış negatif (kötüleşmeyi kaçırma) → intihar riski için uygulama *tek* güvence olmamalı; damgalama/gözetim hissi.
- **Puanlama:** Teknik 6 | Kanıt 4 | Etki 9 | Yenilik 8 | Düşük risk 7 | **TOPLAM 34/50**

### Fikir 4: Panik Nefes — Freespira'nın sensörsüz sürümü: solunum hızı + nabız geri bildirimli antihiperventilasyon eğitimi ve interoseptif maruz bırakma
- **Hedef hastalık ve hasta sayısı:** Panik bozukluğu (yaşam boyu ~%2–3; dünya ~150–200 M, Türkiye ≈2 M — kaba), TSSB hiperaruzal belirtileri.
- **Taklit edilen cihaz ve mekanizma:** Freespira (kapnometre + tablet, 28 gün, 2×17 dk). Mekanizma: hipokapniyi (düşük CO2) yavaş, sığ ve düzenli solunumla düzeltmek; solunum hızını 6–9/dk'ya indirmek.
- **Telefonda nasıl çalışır:** Telefon göğüs/karın üzerine yatırılır: IMU ile solunum dalgası; alternatif mikrofon (burun nefes sesi; Nam 2016) veya ön kamera göğüs hareketi. Parmak PPG ile nabız. Ekran/sesle hedef solunum ritmi; sapma anında haptik düzeltme. CO2 ölçülemediği için ikinci modül: **interoseptif maruz bırakma** (1 dk istemli hiperventilasyon, saman nefes, dönme) nabız eğrisi gösterilerek "semptom = tehlike değil" öğrenmesi. 28 gün, günde 2×15 dk.
- **Kanıt:** Freespira: Tolin 2017 (açık, çok merkezli), Cuyler 2022 (n=1395 gerçek yaşam, yanıt %65, kontrolsüz), Jamison 2022 (TSSB RKÇ). Mekanizma RKÇ'si: Meuret 2010 (CART vs bilişsel, n=41). **Uyarı:** Meuret'in bulguları etkinin CO2 normalizasyonu üzerinden olduğunu savunur; CO2 geri bildirimi olmadan yalnızca solunum hızı geri bildirimiyle aynı etkinin alınıp alınmayacağı **bilinmiyor**. App tabanlı interoseptif maruz bırakma RKÇ'si bulunamadı.
- **Mevcut uygulamalar:** Genel nefes uygulamaları (Breathe, Calm) ölçmez; Freespira donanım ister. Solunum hızını telefonla ölçüp kapalı döngü düzelten panik-protokollü uygulama yok (**doğrulanmadı**).
- **Teknik zorluklar / çözüm:** IMU solunum sinyali oturur pozisyonda zayıf → sırtüstü/yaslanmış kullanım; mikrofon gürültü → bant geçiren filtre ve ortam kalibrasyonu; CO2 yokluğu → dürüst etiket ("CO2 ölçmez"), solunum hızı+düzenlilik vekil ölçüt.
- **Regülasyon:** Sınıf IIa/De Novo (Freespira öncül olsa da sensör farklı → yeni klinik veri gerekir).
- **Riskler:** İnteroseptif maruz bırakma astım, kardiyak hastalık, gebelik, epilepside kontrendike; panik atak sırasında yanlış güven.
- **Puanlama:** Teknik 7 | Kanıt 5 | Etki 7 | Yenilik 7 | Düşük risk 7 | **TOPLAM 33/50**

### Fikir 5: Ses Avatarı — Telefonda AVATAR terapisi (işitsel halüsinasyonlara karşı diyalog)
- **Hedef hastalık ve hasta sayısı:** Şizofreni ve psikotik bozukluklarda ilaca dirençli sıkıntı verici sesler. Dünya şizofreni 27 M (WHO 2023), ~%25–30'u dirençli ses duyuyor → ~7 M; Türkiye ≈ 70–90 bin (kaba).
- **Taklit edilen cihaz ve mekanizma:** AVATAR terapisi (masaüstü yazılım + ses dönüştürücü + terapist, klinikte). Mekanizma: hastanın sesi için yüz ve ses tasarlayıp terapist eşliğinde ona karşı güç kazandığı yapılandırılmış diyalog (maruz bırakma + asertiflik).
- **Telefonda nasıl çalışır:** Hasta avatarın yüzünü ve ses tınısını telefonda seçer; terapist uzaktan video görüşmede avatarı konuşturur (gerçek zamanlı ses dönüşümü cihaz-içi). 6–12 haftalık seans + seans arası "avatar provası" (kayıtlı diyaloglar). Tamamen telefon mikrofon/hoparlör/ekran.
- **Kanıt:** Craig 2018 Lancet Psychiatry RKÇ; AVATAR2 Garety 2024 Nature Medicine (n=345): 16. haftada d=0,38 (kısa) / 0,58 (uzun), 28. haftada anlamlı değil; ciddi yan etki yok. Telefon sürümü çalışması: **yok**; "AVAtalk" adlı bir uygulama literatürde geçiyor (**doğrulanmadı**).
- **Mevcut uygulamalar:** FOCUS (öz-yönetim), Motivista (negatif belirti). Telefonda terapist destekli AVATAR ürünü bilinen yok.
- **Teknik zorluklar / çözüm:** Gerçek zamanlı ses dönüşümü gecikmesi → cihaz-içi hafif model; terapist eğitimi; psikoz hastalarında telefon kullanımı/paranoya → klinik yönlendirme.
- **Regülasyon:** Sınıf IIa; terapist eşliği zorunlu, RKÇ gerekir.
- **Riskler:** Distres artışı, psikoz alevlenmesi; terapistsiz kullanım yasak.
- **Puanlama:** Teknik 8 | Kanıt 7 | Etki 6 | Yenilik 6 | Düşük risk 5 | **TOPLAM 32/50**

### Fikir 6: Lokma Hızı — Kamera ile yeme hızı geri bildirimi (Mandometer taklidi)
- **Hedef hastalık ve hasta sayısı:** Anoreksiya/bulimiya (yeme hızını normalize etme), tıkınırcasına yeme ve obezite (yavaşlatma). Dünya yeme bozukluğu 18 M (WHO 2023); Türkiye ≈ 200 bin (kaba).
- **Taklit edilen cihaz ve mekanizma:** Mandometer/Mandolean (tabak terazisi + ekran: hedef yeme eğrisi). Mekanizma: yeme hızı ve tokluk eğrisinin görsel geri bildirimle yeniden öğrenilmesi.
- **Telefonda nasıl çalışır:** Telefon masada stand/yaslanmış; ön kamera el-ağız hareketi ve çiğneme (yüz nokta izleme) ile lokma sayar, tabak görüntüsünden kalan miktarı kabaca tahmin eder; ekranda hedef eğri vs gerçek eğri; sapmada ses/titreşim. Her ana öğün, 12–16 hafta.
- **Kanıt:** Mandometer: Bergh 2013 çok merkezli (tek grup), Zandian 2009 (hız-tokluk ilişkisi), Hamilton-Shield 2014 HTA pilot. Bağımsız RKÇ sınırlı. Kamera tabanlı sürüm: yok.
- **Mevcut uygulamalar:** Recovery Record (kayıt), Mandometer (donanım). Kamera ile kapalı döngü yok.
- **Teknik zorluklar / çözüm:** Lokma tespiti doğruluğu → el-yüz mesafe + çiğneme ritmi birleştirme; kalan miktar tahmini kaba → yalnızca hız/ritim geri bildirimi.
- **Regülasyon:** Sınıf IIa; RKÇ gerekir.
- **Riskler:** AN'de kalori odaklı geri bildirimin kaygıyı artırması; klinik eşlik gerekir.
- **Puanlama:** Teknik 6 | Kanıt 5 | Etki 6 | Yenilik 8 | Düşük risk 7 | **TOPLAM 32/50**

### Fikir 7: Gece Nöbetçisi — Yataktaki telefonla kâbus tespiti ve uyandırmadan bozma + TMR (TSSB kâbusları)
- **Hedef hastalık ve hasta sayısı:** TSSB (küresel yaygınlık ~%3,9; dünya ~300 M yaşam boyu, Türkiye ≈3 M — kaba) ve kâbus bozukluğu.
- **Taklit edilen cihaz ve mekanizma:** NightWare (saat: kalp hızı + hareket → titreşim) ve TMR bandı (Schwartz 2022). Mekanizma: otonom uyarılma tespit edilince düşük yoğunluklu uyaranla kâbusu kesmek; IRT'de öğrenilen olumlu senaryoya bağlanmış sesi REM'de çalmak.
- **Telefonda nasıl çalışır:** Telefon yatakta/yastık altında: IMU ile hareket, mikrofon ile solunum/inleme, hoparlör-mikrofon sonarı ile solunum hızı (ticari uyku uygulamalarının kullandığı yöntem). Solunum hızı + hareket ani artışı → yastık altı titreşim / düşük ses. REM vekili (düzensiz solunum, hareketsizlik) saptanınca IRT ses ipucu. Akşam 10 dk IRT.
- **Kanıt:** NightWare sham RKÇ (n=65): gruplar arası fark anlamlı değil; TMR n=36 olumlu. Telefon-tabanlı sürüm: yok. Telefon sonarıyla evre tespiti kaba.
- **Mevcut uygulamalar:** NightWare (saat gerekli). Telefon-only yok.
- **Teknik zorluklar / çözüm:** Nabız yok → solunum+hareket vekili; eş yatakta → tek kişi/konum filtreleme; yanlış tetik → eşik kişiselleştirme.
- **Regülasyon:** Sınıf IIa/De Novo.
- **Riskler:** Uyku bölünmesi, yanlış uyandırma.
- **Puanlama:** Teknik 5 | Kanıt 5 | Etki 7 | Yenilik 8 | Düşük risk 7 | **TOPLAM 32/50**

### Fikir 8: Sarhoş Adım — Yürüyüş/ses ile sarhoşluk tespiti ve tam zamanında relaps müdahalesi (alkol kullanım bozukluğu)
- **Hedef hastalık ve hasta sayısı:** Alkol kullanım bozukluğu (dünya ~400 M zararlı kullanım; Türkiye ≈1–1,5 M — kaba, doğrulanmadı).
- **Taklit edilen cihaz:** Soberlink/alkolmetre tabanlı izleme, A-CHESS (GPS). Mekanizma: içme anını/riskli konumu saptayıp destek (sponsor araması, güvenli ulaşım, başa çıkma görevi) sunmak; ertesi gün koşullu pekiştirme.
- **Telefonda nasıl çalışır:** IMU yürüyüş modeli (Suffoletto 2020: %92,5 doğruluk, n=17, lab) + sesli günlük (Suffoletto 2023: %98, lab) + GPS risk bölgeleri + saat → risk skoru → müdahale. 12 hafta.
- **Kanıt:** Tespit lab düzeyinde; gerçek yaşam doğrulaması yok; JITAI RKÇ yok.
- **Mevcut uygulamalar:** A-CHESS (GPS, RKÇ var), Drinker's Check-up, Reframe. Sensör-tetikli sarhoşluk tespiti yok.
- **Teknik zorluklar / çözüm:** Telefon cepte değilse yürüyüş yok; alkol dışı sendeleme → çoklu sinyal; gizlilik.
- **Regülasyon:** Sınıf IIa; RKÇ gerekir.
- **Riskler:** Yanlış pozitif damgalama; tespit edilince cezalandırıcı değil destekleyici tasarım zorunlu.
- **Puanlama:** Teknik 6 | Kanıt 4 | Etki 8 | Yenilik 7 | Düşük risk 6 | **TOPLAM 31/50**

## 3. Alanın en iyi 3 fikri (sıralı) ve gerekçe

1. **NabızNefes (39/50).** Mekanizma cihazla birebir (PPG zaten kamerayla yapılıyor), kanıt tabanı en güçlü (HRVB meta-analizleri), en büyük hasta kitlesi (470 M), risk neredeyse sıfır. Yenilik orta: ölçen uygulamalar var, ama kişiye özel rezonans frekansı + haptik pacer + klinik dozlu kapalı döngü *tedavi* ürünü yok.
2. **Kronoterapi Koçu (36/50).** Telefonun ışık *üretmesi* fizikçe yetersiz, ama ışık *dozunu ölçüp* hastayı gerçek gün ışığına yönlendirmesi ve TCT takvimini güvenle yürütmesi tamamen mümkün; hızlı etkili, ilaçsız ve bugün yalnızca yatan hasta servislerinde uygulanan bir tedaviyi eve taşır. Riskler (bipolar, uykusuz sürüş) nedeniyle reçeteli olmalı.
3. **SesAyna (34/50).** En yüksek yenilik ve etki potansiyeli; tespit şirketleri ile müdahale uygulamaları arasındaki boşluğu kapatır. Kanıt zayıf olduğundan önce tahmin algoritması doğrulanmalı.

## 4. "Yapılamaz" diye elenenler

- **TMS, EKT, tDCS, CES (Alpha-Stim), VNS, DBS, Monarch eTNS, Neupulse:** elektrik/manyetik alan; telefon üretemez.
- **Prism / EEG nörofeedback, Muse:** EEG kaydı yok. Kamera ile pupil çapı "uyarılma geri bildirimi" fikri kanıtsız; elendi.
- **Ekranı 10.000 lux ışık kutusu olarak kullanmak:** ≈250–500 lux; yalnızca şafak simülasyonu rolü (Fikir 2 içinde).
- **Karanlık terapi (mani):** telefon odayı karartamaz.
- **Freespira'nın birebir kopyası:** CO2 ölçülemez (Fikir 4'te dürüst vekil sürüm).
- **Kulaklıksız binaural vuru:** hoparlörle iki kulağa ayrı frekans verilemez; kanıt da zayıf.
- **Ekran flicker ile görsel-işitsel entrainment (AVE):** depresyon/anksiyete kanıtı yok (yalnızca pediatrik diş kaygısı RKÇ'si), fotosensitif epilepsi riski.
- **Akustik yavaş dalga uyarımı (insomni):** uyku evresi tespiti telefonla yetersiz; nöroloji/uyku alanına bırakıldı.
- **EMDR çift taraflı uyarım uygulaması:** zaten var.
- **VR maruz bırakma:** gözlük yasak; düz ekran "maruz bırakma" sıradan psikoeğitim uygulamalarından farksız.
- **Trikotillomani kamera bekçisi:** telefon sabit değil, kamera sürekli açık olamaz (pil/gizlilik).
- **Alkolmetre / CO sigara ölçümü:** telefonla gaz ölçülemez.
- **Salt CBT/ERP/CBT-I içerikli uygulamalar (depresyon, insomni, OKB, YAB, DEHB oyunu):** Rejoyn, SleepioRx/Somryst, NOCD, DaylightRx, EndeavorRx zaten var.

## 5. Kaynaklar (URL)

- WHO Mental disorders fact sheet (2023 verisi): https://www.who.int/news-room/fact-sheets/detail/mental-disorders
- Kollins SH et al. 2020, Lancet Digit Health (STARS-ADHD): https://pubmed.ncbi.nlm.nih.gov/?term=Kollins+AKL-T01+STARS-ADHD
- Garety P et al. 2024, Nature Medicine (AVATAR2): https://europepmc.org/search?query=Garety%20AVATAR2%20Nature%20Medicine%202024
- Craig TK et al. 2018, Lancet Psychiatry (AVATAR RKÇ), PMID 29175276
- Schwartz S, Clerget A, Perogamvros L 2022, Current Biology (TMR + IRT): https://europepmc.org/search?query=Schwartz%20Perogamvros%20targeted%20memory%20reactivation%20nightmare
- Davenport ND, Werner JK 2023, J Clin Sleep Med (NightWare sham RKÇ, NCT04040387)
- Yuen LD et al. 2021, J Affect Disord (üçlü kronoterapi pilot RKÇ), PMID 33601689
- Ferrara M et al. 2025/26, J Affect Disord (TCT açık RKÇ), PMID 41284534
- Geoffroy PA, Palagini L 2021, Prog Neuropsychopharmacol Biol Psychiatry (kronoterapi derleme), PMID 33152388
- Tolin DF et al. 2017; Cuyler RN et al. 2022 Front Digit Health; Jamison AL 2022 Psychol Trauma; Meuret AE 2010 JCCP (Freespira/CART): https://pubmed.ncbi.nlm.nih.gov/?term=Freespira+OR+capnometry-assisted+respiratory+training+panic
- Suffoletto B et al. 2020 J Stud Alcohol Drugs (yürüyüş, %92,5); Suffoletto B 2023 (ses, %98): https://europepmc.org/search?query=Suffoletto%20smartphone%20gait%20alcohol%20intoxication
- Xu S et al. 2026, Sensors (PPG-PRV vs EKG-HRV meta-analiz); Comfort LD et al. 2026, Eur Arch Psychiatry Clin Neurosci (PULSAR doğrulama)
- Dolgilevica K et al. 2025, Current Oncology (akıllı telefon HRVB RKÇ)
- Wang L 2023 JMIR Form Res; Bell I 2023 JMIR (JITAI pilot RKÇ'ler); Hilbert A 2025 (tıkınırcasına yeme JITAI)
- Kutcher TP 2026 JMIR Ment Health; Fang SS 2026 BMC Psychiatry (dijital fenotipleme derlemeleri)
- Brunyé TT 2021 (CES derleme, "ciddi metodolojik sorunlar"); Kavirajan HC 2014 Cochrane (CES depresyon); Berman DE 2025 Front Neurosci (TSSB nörofeedback meta-analiz)
- Bergh C 2013 Behav Neurosci; Zandian M 2009 Physiol Behav; Hamilton-Shield J 2014 HTA (Mandometer): https://pubmed.ncbi.nlm.nih.gov/?term=Mandometer+eating+rate+feedback
- Nam Y 2016 IEEE JBHI (mikrofonla solunum hızı)
- Tang HY 2016 Appl Psychophysiol Biofeedback (AVS insomni)
- Üretici sayfaları: https://www.clicktherapeutics.com/ (Rejoyn 2024, Motivista/CT-155 2026) · https://www.bighealth.com/ (SleepioRx, DaylightRx) · https://freespira.com/ · https://nightware.com/ · https://www.endeavorrx.com/ · https://www.graymatters-health.com/ · https://www.flowneuroscience.com/
