# Tur 2 — Yaşlı hasta ve yakını (geriatri hemşiresi gözüyle kullanılabilirlik)

## 1. Kapsam
- **Kişiler:** (1) Fatma Hanım, 74 yaşında, yalnız yaşıyor, hafif işitme kaybı var. Pixel 7, "Büyük" yazı, ilk kullanım: kurulum, atak,
  11 soru, alt tip, taraf sorusu, Hazırlık, ilk tanıtma, iki taraf testi (arada dinlenme), tek dokunuşla manevraya geçiş, Epley, sonrası.
  (2) Annesine manevrayı yaptıran kızı. iPhone 13 (titreşim yok), "Bir yakınımla", başucunda durup ekranı çeviriyor. İkinci kullanım,
  yani kayıtlı tanıtma ve yerleştirme ölçümü var.
- **Yöntem:** Playwright, demo sensör, **timeScale 1 (gerçek hız)**. `speechSynthesis` sahte bir motorla değiştirildi: 13 krk/s hızında
  konuşuyor, `cancel` ile kesilen ya da düşürülen her cümleyi zaman damgasıyla kaydediyor. Titreşim, ton ve ekran durumu da kaydedildi.
  Telefon alındaki hasta yalnızca **ekranın ortasına kör dokunuş** yaptı. Yönergenin başlamasından 3 sn sonra pozisyona geçti.
- **Derlemeler:** Önce 4180'deki derleme denendi (20:07, ffafa35). Denetim sürerken 8af369c ve 0612364 işlendi. HEAD (0612364) scratchpad'e
  derlendi ve 4182'de iki kişi gerçek hızda yeniden yürütüldü. Aksi yazılmadıkça bulgular HEAD içindir.
- **Betikler, kayıtlar, ekran görüntüleri:** `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/inceleme/tur-2/yasli-ve-yakini/`
  - Betikler: `fatma.mjs`, `zeynep.mjs`, `repro.mjs`, `novoice.mjs`
  - Kayıtlar: `*-log.json`, `*-timeline.txt` (HEAD koşuları `fatmaH-*` ve `zeynepH-*`; 4180 koşuları `eski/`)
  - Ekran görüntüleri: `shots/` (4180 koşuları `shots/eski/`)

### Ölçümler (gerçek hız)
| Koşu | Toplam | Dokunuş | Telefon alındayken | Konuşma | Kesilen cümle |
|---|---|---|---|---|---|
| Fatma, HEAD | 13,2 dk. Kurulum 0,5 dk (betikle hızlı okundu; gerçekte +3 dk). Atak 12,6 dk | 35: kurulum 10 + atak 25 | Kesintisiz 10,4 dk. Yalnız **6 kör dokunuş**: 2 geçiş + 4 baş dönmesi işareti | 81 cümle, 391 sn | 20 |
| Fatma, 4180 | 14,0 dk | 37 | K1 nedeniyle bir kez ekrana bakmak zorunda | 80 cümle | 20 |
| Kızı, HEAD | 12,7 dk | 25 (1 "Ekranı çevir" dahil) | 10,3 dk. Titreşim 0, ton 71 | 72 cümle, 362 sn | 18 |

**Fatma, HEAD bölüm süreleri:**
- Sorular: 95 sn
- Alt tip ve taraf sorusu: 9 sn
- Hazırlık: 10 sn
- Tanıtma ("Başla"dan teste): 31 sn
- 1. test: 127 sn
- Dinlenme: 37 sn
- 2. test: 128 sn
- Geçiş: 15 sn
- Epley: 288 sn

Hazırlık ekranındaki "yaklaşık 12–15 dakika" bilgisi ölçümle tutarlı.

**Ekrana bakmadan gidilebiliyor mu?** HEAD'de evet: tanıtmada "Başla"ya dokunduktan sonra manevranın sonuna kadar ekrana bakmak gerekmiyor
(6 kör dokunuş). Hasta şu durumlarda ekrana bakmak zorunda kalıyor:
- Manevra sonundaki "Şu an nasılsınız?" sorusu sesle sorulmuyor (O6).
- Yerleştirme ölçümü başarısız olursa Başlat ekranı açılıyor.
- Duraklatmadan çıkmak için "Devam et"e dokunmak gerekiyor.
- 4180 derlemesinde ilk tanıtmadan sonra (K1).

## 2. Bulgular
| # | Önem | Yer | Sorun (gözlem) | Öneri (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| K1 | Kritik (4180) / HEAD'de düzeltilmiş | `EpisodeFlow.tsx` `afterCalibration` + `RunOnce` (ffafa35) | İlk tanıtmadan sonra akış **taraf sorusuna geri dönüyor**. Telefon alındayken hasta "Tamam, telefon tanındı. Başı…" cümlesinin 1,5 sn'sini duyuyor, ardından 42 sn sessizlik geliyor. Hasta telefonu indirip soruyu yeniden yanıtlamak, "Başlat"a basmak ve telefonu ikinci kez yerleştirmek zorunda kalıyor (+2 dokunuş, +~50 sn). Pixel ve iPhone'da her denemede tekrarlandı (`repro.mjs`, `shots/eski/repro-after-cal.png`). HEAD'deki `calHandledRef` ve `saved` düzeltmesiyle ilk tanıtmadan 1. teste geçiş kesintisiz (`fatmaH-timeline.txt` 186,9 sn). | 4180 sunucusu HEAD'den yeniden derlensin. e2e'ye "ilk tanıtma → `runner data-step=0`, taraf sorusu yok" denetimi eklensin. Mevcut e2e, düzenleme sürerken eski seçicilerle kırık (`Yatarken ya da…`). | Evet (4180'de hata, HEAD'de düzeltildi) |
| Y1 | Yüksek | `runner.ts:567` (`introDone`), `RunnerView.tsx:98` (`introSecFor` = 13 krk/s tahmini) | Yüksek öncelikli "Tamam, böyle kalın" adım yönergesini **her seferinde** kesiyor: 14/14 yönerge, son 0,1 sn'de. Ses tahminle aynı hızdayken bile pay yok. Ses %10 yavaşsa ya da motor 0,3 sn geç başlarsa ep-1'in (221 krk) son cümlesi kayboluyor; bu cümle tam da "Başlarsa ekrana dokunun, geçince yeniden dokunun." Kalibrasyon ve yerleştirme `speakAsync` ile düzeltildi, yürütücü yönergesi düzeltilmedi. | Yönerge `speech.speakAsync` ile söylensin, bitişi yürütücüye olay olarak gelsin (`introDone = konuşmaBitti \|\| t > tahmin×1,6`). "Tamam, böyle kalın" `normal` öncelikle kuyruğa girsin. Önemli bilgi başa alınsın (bkz. O2). | Evet (log); yavaş ses hesapla |
| Y2 | Yüksek | `HelperCard` (`RunnerView.tsx` "Telefonu hasta kendi eliyle alnına bastırsın"), `onBodyTap`; Hazırlık "Kendim" | Telefon ekranı dışa bakarken alna bastırılınca **avuç ekrana değiyor**. Ekranın her dokunuşu baş dönmesini işaretlediği için avucun değip kalkması işareti açıp kapatabilir. Yanlış uzun işaret, güvenlik durdurmasına ya da hekime yönlendirmeye yol açar. Avuç ekranı yardımcının görüşünden de kapatıyor. "Kendim" seçildiğinde telefonun nasıl tutulacağı hiç söylenmiyor. | Önce: "Telefonu hasta kendi eliyle alnına bastırsın" → Sonra: "Telefonu **iki yan kenarından** parmak uçlarıyla alna bastırın; avuç ekrana değmesin (varsa geniş saç bandı)." Aynı satır "Kendim" hazırlığına ve tanıtma sesine de eklensin. | Kodda evet; cihazda doğrulanmadı |
| Y3 | Yüksek | `PrepScreen` (`EpisodeFlow.tsx`); `RunnerView.tsx:477-493` notları yalnız Başlat'lı ekranda | Türkçe ses yoksa ya da ses kapalıysa, ikinci ve sonraki kullanımlarda (kayıtlı tanıtma, kendiliğinden başlama) **hiç uyarı çıkmıyor**. Ölçüm (`novoice.mjs`): Hazırlıkta ve yerleştirmede uyarı 0. Türkçe yönergeler varsayılan (yabancı) sesle okunuyor (16 cümle). iPhone'daki "titreşim yok, sessiz anahtarı kapatın" notu da bu yolda görünmüyor. | `PrepScreen`'de `!speech.usable()` ise turuncu kart gösterilsin: "Bu telefonda Türkçe sesli okuma yok. Manevrayı bir yakınınızla yapın; yönergeleri ekrandan okusun." Bu durumda "Bir yakınımla" kendiliğinden seçilsin. iPhone notu Hazırlık'a taşınsın. | Evet |
| O1 | Orta | Taraf testi girişi (`EpisodeFlow.tsx` `sideRun` intro) | Fatma "Sağa dönünce" dedi, ilk test **sol** tarafta başladı. Gerekçe yalnız ekranda yazıyor; seste yalnız "Başlıyoruz. Yönergeleri dinleyin." var. Ekranı göremeyen hasta "ben sağ dedim" diye kaygılanır. | Önce: "Başlıyoruz. Yönergeleri dinleyin." → Sonra (1. test): "Önce sol tarafı, sonra sağ tarafı deneyeceğiz. Başlıyoruz." | Evet |
| O2 | Orta | `protocols.ts:139` (dh-sit), `:283` (ep-sit) | Yastık talimatı telefon alındayken 3 kez daha söyleniyor (10,5 / 10,5 / 14,7 sn). Hazırlık ekranı bunu zaten söylüyor (01 #11 düzeltilmemiş). Her taraf testine ~6 sn boş konuşma ekliyor. | Önce: "Yatağın üzerinde oturun. Yastığı, yattığınızda omuzlarınızın altına gelecek yere koyun. Başınızı sağa doğru yaklaşık 45 derece çevirin." → Sonra: "Başınızı sağa çevirin; çeneniz sağ omzunuza doğru yarı yolda." | Evet |
| O3 | Orta | `Calibrate.tsx:159-166` | "Tamam, telefon tanındı. Başınızı düzeltin ve telefonu alnınızda tutun; başlıyoruz." cümlesi (6,5 sn) 1,5 sn'de kesiliyor; unmount sırasında `speech.cancel` çağrılıyor. Ardından hemen "Başlıyoruz. Yönergeleri dinleyin." geliyor. Hasta "telefonu alnınızda tutun" kısmını hiç duymuyor. | Önce: (6,5 sn, kesik) → Sonra: "Telefon tanındı. Alnınızda tutun." `finish` konuşma bitince çağrılsın (`speakAsync`). | Evet (log) |
| O4 | Orta | `runner.ts:302`, `betweenStepsSec: 4` | "Bu adım tamam. Bir sonraki hareket için hazır olun." (4,1 sn) 4 sn sonra gelen yönergeyle **her adımda** kesiliyor (5/5 ve 4/4). Bu cümle sürerken 3 geri sayım tonu ve "hareket" tonu da çalıyor. | Önce: (4,1 sn) → Sonra: "Bu adım tamam." (1,2 sn). Geri sayım tonları konuşma bittikten sonra başlasın. | Evet |
| O5 | Orta | `runner.ts:451` ve sayım (`:690-698`) | Taraf testinde "Geçti olarak işaretlendi. **10 saniye** daha bekleyin" deniyor, 5 sn sonra "**30 saniye** kaldı" geliyor. Epley'de "30 saniye daha" deniyor, 11 sn sonra "15 saniye kaldı" geliyor; gerçekte 19 sn kalmış (`fatmaH-timeline.txt` 415–433, 558–569). 01 #13 kısmen duruyor. | Kalan süre tek bir yerden hesaplansın: `max(minHold−hold, after−geçen)`. Önce: "Geçti olarak işaretlendi. 10 saniye daha bu pozisyonda bekleyin." → Sonra: "Geçti. 38 saniye daha böyle kalın." Sayım da aynı değeri kullansın. | Evet |
| O6 | Orta | `AfterManeuver`, bitiş ekranı (HEAD) | "Şu an nasılsınız?" sesle sorulmuyor ve telefonu indirmesi söylenmiyor. HEAD'de bitiş ekranı "Manevra tamamlandı. 10 dakika…" cümlesini ikinci kez okuyor ve ilkini kesiyor (2,0 sn eksik). | Önce: "Manevra tamamlandı. 10 dakika oturarak dinlenin; kalkarken dikkatli olun." → Sonra: "Manevra tamamlandı. Telefonu alnınızdan alın ve ekrandaki soruyu yanıtlayın: şu an nasılsınız?" Bitiş ekranı yalnız saati söylesin: "Tekrar testi saat 21:58'de." | Evet |
| O7 | Orta | `HintBanner` (`RunnerView.tsx`), `HINT_TEXT_PATIENT` | **Geometri doğru.** Başucundan bakan ve ekranı çeviren yardımcı için ← = yardımcının solu = hastanın solu; SAĞI/SOLU etiketleri ve burun da doğru yerde (`shots/zeynepH-ipucu-karsilastirma.png`). Metin ise hastaya yazılmış: "Başınızı biraz daha sola çevirin". Çevrilmemiş ekranda "sola" yazısının yanında **→** duruyor; fiziksel olarak doğru ama okuyana çelişkili görünüyor. Yardımcı kartı "hastanın sağı/solu" yazacağını söylüyor, banner bunu yazmıyor. | Banner metni (ses değil) önce: "Başınızı biraz daha sola çevirin." → sonra: "**HASTANIN SOLUNA** biraz daha çevirin". Ok aynı kalsın. | Evet |
| O8 | Orta | `runner-flip` (sağ üstte küçük simge), `PrepScreen` | Çevirme yalnız yürütücü çalışırken mümkün. Yardımcı ilk yatar adımda, iki eli hastanın başındayken, etiketsiz küçük bir simgeye basmak zorunda kalıyor. Yerleştirme, dinlenme ve geçiş ekranları hiç çevrilmiyor. | Hazırlık'ta "Bir yakınımla" seçilince "Nerede duracaksınız? [Başucunda] [Yanında]" sorulsun. "Başucunda" seçilirse `screenFlip` baştan açılsın ve tüm tam ekran yüzeylere uygulansın. Simgeye "Çevir" yazısı eklensin. | Evet |
| O9 | Orta | Epley 4. adım (ep-3, yan, burun yere) | Fiziksel durum: telefonun ekranı yatağa ya da yere bakıyor, yardımcı ekranı göremiyor. Android'in otomatik döndürmesi ekranı yataya da çevirir. Kartta yalnız döndürmeyi kapatma uyarısı var. | Yardımcı kartına eklensin: "4. adımda ekran yatağa bakar; sesi izleyin, başı yere 45° çevrik ve yanak yastığa yakın tutun." | Fiziksel çıkarım; cihazda doğrulanmadı |
| D1 | Düşük | `RunnerView.tsx:303` (`sayAndWait`, demo) | Demo modunda yerleştirme yönergeleri **hiç söylenmiyor**; ekranda yalnız yazıyla gösteriliyor ve 28,6 sn sessizlik oluyor. Tanıtma ekranı demoda konuşuyor. Bu fark demo ve e2e ses denetimlerini yanıltıyor; gerçek kipte `speakAsync` konuşuyor. | Demo kipinde de `speech.speak(text)` çağrılıp tahmin süresi beklensin (Calibrate'teki gibi). | Evet |
| D2 | Düşük | `runner.ts:296` "Test tamamlandı." | Dinlenme ya da geçiş sesi bu cümleyi 1,2 sn'de kesiyor (2/2). | Cümle kaldırılsın; sonraki ekran zaten konuşuyor. | Evet |
| D3 | Düşük | Sayaç halkası, arama sırasında | "— pozisyon" yazısı duruyor (03 #10). | "Pozisyona getirin". | Evet |
| D4 | Düşük | Hazırlık (ikinci ve sonraki kullanım) | "Sesi dene" yalnız ilk tanıtma ekranında var; sonraki ataklarda ses hiç denetlenmiyor. | Hazırlık'a "Sesi dene" bağlantısı eklensin. | Evet |
| D5 | Düşük | "Ekran açık tutulamıyor" uyarısı | Uyarı yürütücüde göstergenin üstüne çıkıyor ve göstergeyi kat çizgisinin altına itiyor (`zeynepH-09`). | Uyarı Hazırlık'ta bir kez gösterilsin; yürütücüde tek satırlık ikon olsun. | Headless'ta gözlendi; cihazda doğrulanmadı |

**1. tur ve kullanıcı ajanı düzeltmelerinin denetimi**
| Kaynak | Konu | Sonuç |
|---|---|---|
| 01 #1, 06 #20 | Son sorunun yönü ("FARKLI mı", "Evet, farklı / Hayır, aynı") | Doğrulandı: 11/11 soruda güvenli yanıt "Hayır". |
| 01 #2 | Sorular sesle okunuyor | Doğrulandı (en uzunu 13,5 sn). |
| 01 #5, 03 #4, 06 #8 | Ekranın her yeri baş dönmesi işareti | Doğrulandı: ortaya kör dokunuşta `aria-pressed=true`, 8/8. |
| 01 #7, cihaz #12 | Tanıtma ve yerleştirme konuşmanın bitişini bekliyor; sayım sesli | Doğrulandı (kodda `speakAsync`). Yürütücü yönergesinde **hatalı** (Y1). |
| 01 #8 | "Telefonun arkasını alnınıza…" | Doğrulandı. |
| 01 #10, ilk-kullanıcı B8/B9/B3 | Hazırlık önce; telefon bir kez takılıyor; zincir kendiliğinden başlıyor | HEAD'de doğrulandı (10,4 dk kesintisiz). 4180'de **hatalı** (K1). |
| 01 #11 | Yastık talimatı | **Düzeltilmemiş** (O2). |
| 01 #13 | Sayım | Tek sayı: doğrulandı. Baş dönmesi sonrası çelişki duruyor (O5). |
| 01 #19 | Ses denetimi | Kısmen: yalnız ilk tanıtmada (D4). |
| 03 #1 | Ekranı çevir | Geometri doğrulandı; kullanım akışı zayıf (O8). |
| 03 #3 | İpucu ekranda | Doğrulandı; metin hastaya yazılmış (O7). |
| 03 #5, #8, #9 | Kim yapıyor seçimi ve yardımcı kartı | Doğrulandı; "avuçla bastırma" sorunlu (Y2). |
| 03 #11, 06 #7 | Yazılı ve basılı tutmalı "Duraklat" | Doğrulandı. |
| 03 #12 | Eksi açılar | Doğrulandı ("sola 45°"). |
| 06 #3, #6 | Yeni adım ve baş dönmesi başı/sonu için ayrı titreşim ve ton | Doğrulandı: Pixel 38 titreşim ve 77 ton, iPhone 71 ton. |
| 06 #14 | Altyazı | Doğrulandı. |
| akış #13 | Dinlenme sonunda sesli soru ve tam ekran dokunma | Doğrulandı (30 sn, ardından ses ve kör dokunuş). |

## 3. Kaldırılabilecekler
- "Test tamamlandı." (D2) ve "Bir sonraki hareket için hazır olun." (O4). İkisi de her seferinde kesiliyor.
- dh-sit ve ep-sit seslerindeki yastık cümlesi (O2). Hazırlık bunu zaten söylüyor.
- "Başlıyoruz. Yönergeleri dinleyin." tanıtmanın hemen ardından gelince (O3). Tek cümle yeter: "Telefon tanındı. Alnınızda tutun."
- Bitiş ekranında aynı cümlenin ikinci kez okunması (O6).
- Yürütücüdeki ikinci "Kim yapıyor?" seçicisi (`RunnerView.tsx`, Başlat'lı ekran). Hazırlık'ta zaten soruluyor.
- Yürütücüde kalıcı "Ekran açık tutulamıyor" kartı (D5). Hazırlık'ta bir kez göstermek yeter.

## 4. En önemli 5 madde
1. **K1:** 4180 derlemesinde ilk tanıtmadan sonra akış taraf sorusuna geri dönüyor; telefon alındaki hasta sessizlikte kalıyor. HEAD'de düzeltilmiş ve gerçek hızda doğrulandı. 4180 yeniden derlensin ve e2e bu adımı denetlesin.
2. **Y1:** "Tamam, böyle kalın" her adım yönergesinin sonunu kesiyor (14/14, pay 0 sn). Kesilen kısım baş dönmesinde ne yapılacağını söyleyen cümle. Yönergenin bitişi gerçek `onend` olayına bağlansın.
3. **Y2:** "Telefonu avucuyla alnına bastırsın" talimatı, ekranın her yeri dokunma alanı olduğu için yanlış baş dönmesi işaretine yol açabilir. Telefon kenarlarından tutulsun; bu talimat "Kendim" hazırlığına da eklensin.
4. **Y3:** İkinci ve sonraki kullanımlarda Türkçe ses yoksa ya da ses kapalıysa hiçbir uyarı çıkmıyor; hasta alnında sessiz ya da yabancı sesli bir telefonla kalıyor. Uyarı Hazırlık'a taşınsın.
5. **O1, O5, O6 (ses dili):** Taraf sırası sesle açıklanmıyor. Baş dönmesi geçtikten sonra söylenen süreler çelişiyor. Manevra sonunda "telefonu indirip soruyu yanıtlayın" denmiyor. Bunlar ekranı göremeyen hasta için tek bilgi kanalı; önce/sonra metinleri tabloda.
