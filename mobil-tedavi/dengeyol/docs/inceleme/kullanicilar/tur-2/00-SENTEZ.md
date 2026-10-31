# Kullanıcı turu 2 — sentez ve iş bölümü

Aynı on kullanıcı düzeltilmiş sürümü yeniden kullandı. Puanlar (1. tur → 2. tur): k01 7→8, k02 7→8, k03 6→8, k04 6→8,
k05 6→7, k06 7→8, k07 5→8, k08 7→8, k09 7→8, k10 7→8. Ortalama 6,5 → 7,9. 1. turdaki isteklerin çoğu "karşılandı";
kalanlar ve yeni bulgular aşağıda. Kırmızı çizgiler (hekim tanısı şartı, kırmızı bayraklar, doz sınırı, 2 dk durdurma,
yönlendirme kilidi, ağsızlık) zayıflatılmaz.

## E1 — Yürütücü ve manevra (core/runner.ts, core/evaluator.ts, core/protocols.ts, platform/haptics.ts, ui/screens/RunnerView.tsx)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Yüksek | Gövdeyle dönülen adımda (Epley 4, burun yere) hasta yanlış yana yuvarlanınca yön en kısa açıyla hesaplanıp yüzüstü üzerinden devam ettiriliyor. Yanlış taraf algılanınca "Dur, yanlış taraf: sırtüstüne dönün, sonra …" denir; yüzüstü üzerinden hedefe gelme kabul edilmez | k02 |
| 2 | Yüksek | "Pozisyona gelinemedi" sayacı hedefe tek an değen ölçümle sıfırlanmasın (yalnız pozisyon doğrulanınca ya da hedef dışı süre toplamla); 60 s kuralı aynen | k07 |
| 3 | Yüksek | Duraklatma sayfasında 2 s basılı tutarak devam, alttaki düğmeleri (Şimdilik bırak, Pozisyona gelemiyorum…) tetiklememeli: uzun basış hiçbir düğmeyi seçmez | k01 |
| 4 | Yüksek | Semont: hasta "Şimdi!"den önce yatarsa sayım iptal, "Zaten yattınız, böyle kalın", kayda "komuttan önce hareket"; yönerge "Kıpırdamayın." ile başlar. Geçişte oturuştan geçilmediyse (sırtüstü yuvarlanma) uyarı ve kayıt | k10 |
| 5 | Orta | "Daha fazla zorlamayın / birazdan durduracağım" yalnız açı ~10 s ilerlemiyorsa; yastık ipucundan sonra 20–30 s beklenir; "öyle kalın"dan sonra eski düzeltme ipucu gelmez | k01, k10, k07 |
| 6 | Orta | Baş dönmesi hatırlatmaları 60 s eşiğiyle tutarlı ve korkutmadan: 15 s "geçince dokunun"; 45 s "bir dakikayı geçerse hekime danışmak gerekir; geçtiyse şimdi dokunun"; 120 s durdurma aynen | k01 |
| 7 | Orta | Konuşma kuyruğu: pozisyona (yeniden) gelince bekleyen eski ipuçları silinir, "Tamam, böyle kalın" kesin ve hemen söylenir, dönüşte "doğru" titreşimi; "Geçti olarak işaretlendi" gecikmez; süresi geçmiş sayımlar okunmaz; oturuş adımı cümlesi "Bu adım tamam" ile kesilmez | k01, k04 |
| 8 | Orta | Duraklatma sesi "Pozisyona gelemiyorum" yolunu ve "boynunuz ağrıyorsa yavaşça oturabilirsiniz"i söyler ("olduğunuz yerde kalın" değil); yardımcı modunda düğme dili yakına göre | k07, k02 |
| 9 | Orta | Klinisyen modunda sesli yönerge "açık / kısa / kapalı" (varsayılan kısa: yalnız kısa komutlar ve sayım); klinisyen cümleleri "hastanın sağına/soluna"; yavaş Semont geçişi klinisyene de söylenir | k08, k10 |
| 10 | Orta | Hasta konuşma metinleri: Epley yatış yönergesi kısa eylem cümlesiyle başlar; "45 derece" yerine "yarıya kadar"; yönerge ~10–12 s'yi geçmez, ayrıntı ekranda | k05, k04 |
| 11 | Düşük | "Hazırsanız dokunun" anları için ayrı titreşim deseni ('ready'); hedefin kıyısında (%50'nin altında hedefte) tamamlanan adım kayda "sınırda tutuldu" | k04, k10 |

## E2 — Hasta akışı (EpisodeFlow.tsx, PatientHome.tsx, state/episodes.ts [rxActive hariç], ui/components/Controls.tsx, core/safety.ts kırmızı bayraklar)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Yüksek | "Şu an nasılsınız?" onayında parmağın altına "Yanlış dokundum, soruya dön" gelir; "Evet, doğru" başka yerde (ör. üstte) ya da basılı tutularak; onaylanınca yol aynen | k06 |
| 2 | Yüksek | Ortostatik soru BPPV'yi dışarıda bırakacak biçimde: "etraf dönmeden göz kararması/bayılacak gibi olma (yataktan kalkarken etrafın dönmesi sayılmaz)"; durdurma metni gerekçeyle tutarlı. Yürüyemezlik sorusuna "baş dönmesi olmadığı anlarda bile" niteleyicisi. Sorular kalır | k05, k09, k07, k01 |
| 3 | Yüksek | Taraf çelişkisinde tanı tarihi boşsa tanı yakın tarihli sayılır (yönlendirme); uyarı kısa ("Hekiminiz sağ demişti, test sol gösterdi…"), ilk atakta "tekrarlayan" denmez, "Bitir" ile çakışmaz | k03 |
| 4 | Orta | Seçim yapılınca ekranın sesi kesilir; Evet/Hayır kilidi ilk okunuşta ses bitene ya da en çok 2,5 s'ye dek; telefon alındayken seçenek listesi okunmaz (önce "telefonu alın", dokununca soru); kırmızı bayrak soruları sesli okumada kısa biçim (ilaç adları, parantezler ekranda) | k05, k04, k01, k06 |
| 5 | Orta | Sık tekrar uyarısı 1. sorunun düğmelerini ekran dışına itmez (kısa satır, soruların altında); sesli hâli sorulardan sonra | k06 |
| 6 | Orta | Aynı atakta 6 saat içinde verilen alt tip yanıtları hatırlanır; yeniden açılabilir atakta sınır doluysa ana ekranda sınır kartı | k06 |
| 7 | Orta | Manevra kaydına duraklatma toplamı (adım kayıtlarındaki `pauses`); "hazırsanız dokunun" anlarında E1'in 'ready' titreşimi (birleşimde bağlanacak) | k02, k09, k04 |
| 8 | Orta | Kulak sorusu kilit kartı hangi yanıtla durdurulduğunu ve hekime sorulacak cümleyi yazar; KBB değerlendirmesinden sonra nasıl yanıtlanacağı açıklanır; tanısız kişiye paylaşılabilir "hekime söyleyecekleriniz" notu | k03 |
| 9 | Düşük | Ana ekran: reçeteli yolda süre metni doğru; 112 kartı tam nörolojik liste; kapalı kart madde adlarını gösterir; reçete bitiminde "raporu hekiminize gönderin"; hatırlatıcı gece saatine düşerse "uyanınca"; "tetiklemedi", "Aktif atak" gündelik dile; dinlenme sayımı geç okunmaz | k02, k03, k07, k09, k01, k05 |

## E3 — Kurulum, rapor, reçete, ses (Onboarding.tsx, History.tsx, reportText.ts, PrescriptionImport.tsx, core/prescription.ts, Settings.tsx, Calibrate.tsx, platform/speech.ts, state/episodes.ts yalnız rxActive)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Orta | Reçete geçerliliği tek anlamlı: son geçerli gün "… dahil" yazılır, hasta/klinisyen ekranı ve rxActive aynı sınırı kullanır | k09 |
| 2 | Orta | Kurulumda tanı zamanı zorunlu seçim: "Son 2 hafta içinde / Daha önce / Tarihi biliyorum" | k03 |
| 3 | Orta | Rapor: başlıkta reçete kodu (HBYS'dekiyle aynı), kısa yol kullanıldı mı, 14 günlük doz özeti, duraklatmalar, yakını yaptırdıysa "yakını eşliğinde"; onam sürümü | k09, k02 |
| 4 | Orta | Onam metnine riskler (geçici baş dönmesi/bulantı, düşme, kanal değişimi) ve seçenekler (hekimde manevra, bekleme) eklenir | k09 |
| 5 | Orta | Sesli okuma: kurulum uygunluk listesi ve reçete kartı açılınca okunur; konuşma metninde "/" "ya da" olarak okunur (speech.ts) | k05, k03, k01 |
| 6 | Düşük | Reçete kartı: "imzasız" uyarısı korkutmadan ("Bu bağlantıyı yalnız hekiminizden ya da onun size/yakınınıza verdiği QR'dan açın"); kabulden önce reçetenin kontrendikasyonu açmayacağı; iPhone'da "önce ana ekrana ekleyin" kabulden önce | k05, k02, k07 |
| 7 | Düşük | Kurulumda "Hasta adına yakını olarak kuruyorum" (assist = helper); tanısız kapı ekranında aciliyet kartı (PatientHome'daki UrgencyLadder) | k02, k03 |

## E4 — Klinisyen ve belgeler (ui/screens/clinician/*, core/diagnosis.ts, docs/*.md)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Orta | HBYS notu kısa: manevra tek satır, açı istatistikleri yalnız basılı raporda, gözlem yöntemi bir kez | k08 |
| 2 | Düşük | Gözlem yöntemi profilden/son muayeneden dolu gelir; PDF'deki boş 2. sayfa | k08 |
| 3 | Orta | Belgeler: KLINIK-PROTOKOL ve RISK-ANALIZI 14 soruya göre; RISK #2 "yanlış taraf Epley genellikle zararsız; kanal değişimi bildirilmiştir"; KULLANIM-KILAVUZU yeni özellikler (titreşim tablosu, duraklatma, yardımcı modu, pozisyona gelinemedi, VNG değerini forma yazma yolu) | k09, k08 |

## Bu turda yapılmayanlar (gerekçeli)
- Ev kaydının kliniğe QR ile aktarılması (k09, k10): kapsam büyük; pilot öncesi ayrı iş.
- Ses çıkışı değişince (işitme cihazı koptu) otomatik duraklatma (k04): tarayıcı API'si güvenilir değil.
- Hatırlatıcı için .ics yerine bildirim (k01, k05): ağsız PWA'da arka plan bildirimi güvenilir değil; metin ve "uyanınca" seçeneği iyileştirilir.

## Uygulama durumu (2. düzeltme turu sonunda)
E1–E4'ün bütün maddeleri uygulandı ve birleştirildi; birleşim bağlantıları ('ready' titreşimi, yeni adım işaretleri →
hasta ve klinisyen raporu, tanı zamanı → taraf çelişkisi, ortak reçete geçerlilik etiketi, reçeteli kısa yol kaydı) yapıldı.
346 birim testi ve 13/13 uçtan uca senaryo geçiyor.
