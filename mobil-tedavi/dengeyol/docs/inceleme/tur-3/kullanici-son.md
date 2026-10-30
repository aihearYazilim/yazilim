# Tur 3 — Kullanılabilirlik laboratuvarı, son kontrol (kullanici-son)

## 1. Kapsam
- **Ne:** Üç uçtan uca senaryo, Playwright, demo sensör, **timeScale 1 (gerçek hız), üç senaryonun tamamı**. `speechSynthesis` sahte bir motorla değiştirildi (13 krk/s); söylenen, kesilen ve düşürülen her cümle zaman damgasıyla kaydedildi. Titreşim, ton ve ekran durumu da kaydedildi. Zaman, `Date` kaydırılarak ileri alındı (+1 saat, ertesi sabah 07:40, +3 hafta, +2 gün). `navigator.share` yakalandı.
  - **S1:** 66 yaşında, ilk kez kullanan hasta. Pixel 7, "Büyük" yazı. Kurulum → atak → ilk tanıtma → iki taraf testi → Epley → 1 saat sonra tekrar testi → sabah testi → atağı kapatma → "Hekime gönder".
  - **S2:** Aynı hasta 3 hafta sonra, kızıyla. iPhone 13 (titreşim yok), "Bir yakınımla", başucunda ekran çevrik, kayıtlı tanıtma. Duraklat'a bir kısa ve bir uzun kazara basış, bir de geri tuşu.
  - **S3:** Aile hekimi: profil → muayene → sensörlü sağ Dix-Hallpike → sol Dix-Hallpike elle → tanı → Epley → QR reçete. Ardından hasta reçeteyi kendi telefonunda (Pixel 7) açıyor, 2 gün sonra ilk atağını reçeteyle yapıyor.
- **Derleme:** Sonuçlar **HEAD 30a2348** (4180, 22:07 derlemesi) içindir. Üç senaryo bu derlemede yeniden yürütüldü. 1a0f0aa derlemesindeki ilk koşular `eski-1a0f0aa/` altında; aynı ölçümleri verdiler. 184 birim testi geçti.
- **Dosyalar:** `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/inceleme/tur-3/kullanici-son/`
  - Betikler: `scen1.mjs`, `scen2.mjs`, `scen3.mjs`, `gateback.mjs`, `lib.mjs`
  - Kayıtlar: `s1-log.json`, `s2-log.json`, `s3-*-log.json`; zaman çizelgesi `node timeline.cjs <log>`, ölçümler `node m3.cjs <log>`
  - Paylaşılan rapor metni: `s1-shared.txt`; ekran görüntüleri: `shots/`
- **Uyarı (D1):** Demo kipinde yerleştirme yönergeleri seslendirilmiyor. Bu yüzden her yürütücü başında 28,6 sn'lik sessizlik ölçüldü. Gerçek kipte `speakAsync` konuşuyor; bu sessizlik aşağıdaki sayılara katılmadı.

### Ölçümler (gerçek hız, HEAD)
| Senaryo | Süre | Dokunuş | Telefon alında | Ekrana bakmak zorunda kalınan an | Kesilen cümle | Sessizlik >8 sn (alında) |
|---|---|---|---|---|---|---|
| S1 atak ("Baş dönmem başladı" → "Nasılsınız") | 12,6 dk. Sorular 96 sn, alt tip ve taraf 11 sn, Hazırlık 13 sn, tanıtma girişi 13 sn, 1. test 127 sn, dinlenme 37 sn, 2. test 128 sn, geçiş 15 sn, Epley 287 sn | 26 | **10,4 dk kesintisiz**, yalnız 6 kör dokunuş | **0** | 4: tanıtma sonu, sıra notu, 2 × "Test tamamlandı" | 21 kez; çoğu 13,5 sn. En uzunları 23,0 sn (dinlenme) ve 17,7 sn |
| S1 +1 saat tekrar testi | 3 dk | 3 | 2,6 dk | 0 | 0 | 5 × 13,5 sn |
| S1 sabah testi | 4,6 dk (11 soru dahil) | 14 | 2,6 dk | 0 | 0 | 5 × 13,5 sn |
| S1 kapatma ve "Hekime gönder" | 7 sn | 4 | — | — | — | — |
| S1 toplam (kurulum hızlı okundu) | 21,7 dk | 57 | — | — | — | — |
| S2 (kızıyla, iPhone) | 13,5 dk; alında 10,6 dk | 29: 6 kör, 2 kazara, 2 bakarak "Devam et" | 10,6 dk | 2 (duraklatma ve geri tuşundan sonra "Devam et"; yakın yaptı) | 3 | 22 kez (çoğu 13,5 sn); en uzunu 23,0 sn |
| S3 hekim | 5,4 dk: Dix-Hallpike 133 sn, Epley 163 sn, diğer işler ~25 sn | 26 (2 metin girişi) | — | — | 9 klinisyen yönergesi | — |
| S3 hasta (reçete → kurulum → ilk atak) | 8,4 dk; atak 7,3 dk | 23 | 5,3 dk | 0 | 1 | 11 kez (13,3–17,7 sn) |

**Sesli yönergelerin kesişmesi.** Hasta modunda adım yönergesi hiç kesilmedi; 2. turdaki Y1 düzeltilmiş ("Tamam, böyle kalın" kuyruğa giriyor). Kalan kesişmeler 2. bölümdeki O1, O3 ve D2'de.

## 2. Bulgular
| # | Önem | Yer | Sorun (gözlem) | Öneri (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Orta | `runner.ts` vertigoToggle "Geçti…" + sesli sayım (`holdingTick`) | Baş dönmesi geçtikten sonra söylenen süreler birbirini tutmuyor. S1: "Geçti… **34 saniye** daha" deniyor, 5 sn sonra "**30 saniye kaldı**" geliyor; gerçekte 28 sn kalmış. S3: "**30 saniye** daha" deniyor, 11 sn sonra "**15 saniye kaldı**" geliyor; gerçekte 19 sn kalmış, ardından 17,7 sn sessizlik. Sayım `minHold−hold` değerini kullanıyor, `afterVertigoSec`'i hesaba katmıyor (2. tur O5 sürüyor). | Tek değer kullanılsın: `kalan = max(minHold−hold, afterVertigo−geçen)`. Önce: "Geçti olarak işaretlendi. 34 saniye daha bu pozisyonda bekleyin." → Sonra: "Geçti. 34 saniye daha böyle kalın." Sonraki sayım da aynı değerden ("20 saniye kaldı"). | Evet (`s1-log`, `s3-hasta-log`) |
| 2 | Orta | `protocols.ts:139` dh-sit, `:283` ep-sit | Yastık talimatı telefon alındayken her atakta 3 kez söyleniyor (10,5 + 10,5 + 14,7 sn). Hazırlık ekranının 1. maddesi bunu zaten söylüyor (2. tur O2 sürüyor). | Önce: "Yatağın üzerinde oturun. Yastığı, yattığınızda omuzlarınızın altına gelecek yere koyun. Başınızı sağa doğru yaklaşık 45 derece çevirin." → Sonra: "Başınızı sağa çevirin; çeneniz sağ omzunuza doğru yarı yolda." (~4,5 sn) | Evet |
| 3 | Orta | `EpisodeFlow.tsx` `RestBetween`, `TapGate`; `RunnerView` `runner-ready` | **Ekranı çevir** yalnız yürütücüye uygulanıyor. Başucundaki yakın; dinlenme ("Oturun ve dinlenin 29"), geçiş ("Sol tarafta baş dönmesi oldu… Dokunun") ve "Başlıyoruz…" ekranlarını ters görüyor (`shots/s2-08-dinlenme-cevrik.png`, `eski-1a0f0aa/dbg2-09`). Yardımcı kartının 2. maddesi hâlâ "⟲ Ekranı çevir düğmesine basın" diyor; Hazırlık'taki onay kutusuyla iki ayrı yol oluyor (2. tur O8 kısmen düzeltilmiş). | `screenFlip` açıkken `.tap-gate` ve `runner-ready` de 180° döndürülsün. Kart önce: "Başucundaysanız ekrandaki ⟲ Ekranı çevir düğmesine basın; yazılar size düz görünür." → Sonra: "Başucundaysanız aşağıdaki kutuyu işaretleyin; tüm ekranlar size göre döner." | Evet (ekran görüntüsü) |
| 4 | Orta | `runner.ts` `countEverySec: 15`; `RestBetween` | Telefon alındayken her bekleme pozisyonunda **13,5 sn'lik sessizlikler** var (S1: 21, S2: 22). Dinlenmede 23 sn hiç ses yok. Gözü kapalı, başı sarkık ve baş dönmesi olan hasta "uygulama durdu mu?" diye kıpırdayabilir. | Hasta kipinde `countEverySec` 10 olsun. Önce: "45 saniye kaldı." … 13,5 sn sessizlik … "30 saniye kaldı." → Sonra: "40 saniye kaldı." … 8,6 sn … "30 saniye kaldı." Dinlenmede "20 saniye." ve "10 saniye." söylensin. | Evet |
| 5 | Orta | `PatientHome.tsx` ActiveEpisodeCard ("Atağı kapat" ve "Atak geçti, kapat"); `History.tsx` | Sabah testinden sonra aynı ekranda **iki ayrı kapatma düğmesi** var (`dbg1-30`). Kapatınca "Rapor" düğmesi de kayboluyor. S1'deki "Hekime gönder" görevi yalnız etiketsiz saat simgesi (Geçmiş) → kayıt → "Hekime gönder" yoluyla yapılabildi. 66 yaşındaki kullanıcı simgeyi büyük olasılıkla bulamaz (doğrulanmadı: gerçek kişi). "Rapor" düğmesinde hâlâ yazıcı simgesi var. | `resolved-suggest` görünürken "Atak geçti, kapat" gizlensin. Kapattıktan sonra kart önce: (kart yok) → Sonra: "Atak kapatıldı. [Raporu hekime gönder]". Önce: "🖨 Rapor" → Sonra: "Rapor / hekime gönder". | Evet (akışta) |
| 6 | Orta | `Onboarding.tsx` uygunluk adımı, yapışkan alt düğme | "Hiçbiri bana uymuyor, devam" düğmesi hiçbir madde görülmeden ve "Hiçbiri" işaretlenmeden etkin. Liste ekranın altına taşıyor (Büyük yazıda 3. madde görünmüyor, `dbg1-04`). Tek dokunuş, okunmamış karşı-endikasyonları "yok" diye kaydediyor. | Düğme, `ob-none` işaretlenene ya da liste sonuna kaydırılana kadar "Önce listeye bakın ↓" yazsın ve kaydırsın (güvenliği artırır). | Evet (ekran) |
| 7 | Düşük | `Calibrate.tsx:159-166` | İlk tanıtmanın son cümlesi "Tamam, telefon tanındı. Başınızı düzeltin ve telefonu alnınızda tutun; başlıyoruz." 1,5 sn'de kesiliyor (5,0/6,5 sn eksik, S1 ve S3). Hasta "telefonu alnınızda tutun" kısmını duymuyor (2. tur O3 sürüyor). | Önce: (6,5 sn, kesik) → Sonra: "Telefon tanındı. Alnınızda tutun." `finish` bu cümle bitince (`speakAsync`) çağrılsın. | Evet |
| 8 | Düşük | `RunnerView.tsx:392` (startNote + 3 sn sabit geri sayım) | "Önce sol, sonra sağ tarafı test ediyoruz. Başlıyoruz. Yönergeleri dinleyin." 3,0 sn'de 1. adım yönergesiyle kesiliyor; sıra bilgisi duyuluyor, kalan kısım kayboluyor (2. tur O1 düzeltmesinin yan etkisi). | Önce: (5,9 sn, kesik) → Sonra: "Önce sol, sonra sağ taraf." Geri sayım konuşma bitince başlasın. | Evet |
| 9 | Düşük | `runner.ts` finishStep; `EpisodeFlow` bitiş ekranı | "Test tamamlandı." her testte 1,2 sn'de kesiliyor (D2 sürüyor). "Manevra tamamlandı. 10 dakika oturarak dinlenin…" iki kez söyleniyor: önce yürütücüde, sonra "Nasılsınız"ın ardından bitiş ekranında (O6 kısmen). | "Test tamamlandı." kaldırılsın. Bitiş ekranı yalnız şunu söylesin: "Tekrar testi saat 23:24'te." | Evet |
| 10 | Düşük | 11. kırmızı bayrak sorusu + `rxSame` (yeni) | Reçeteli ilk atakta art arda iki benzer soru var: "…BPPV'den FARKLI mı?" ve "Bu, hekiminizin muayene ettiği baş dönmesinin devamı mı?" (S3). | İkisi aynı ekranda sorulsun ya da `rxSame` metni farkı belirtsin: "Muayeneden bu yana baş dönmeniz hiç geçti mi?" (Hayır → reçetedeki tarafa). | Evet |
| 11 | Düşük | `History.tsx` ShareReport metni | Paylaşılan metinde yıl yok ("30 Ekim 22:12"; B13 sürüyor). "Hedeften sapma (ort. / en çok)" başlığının altında tek değer var. Hasta adı ya da kodu yok; hekim WhatsApp'ta kimin raporu olduğunu ayırt edemez. | `formatDateTime` yılı yazsın. Başlık "Hedeften sapma (ort.)" olsun. Metnin başına isteğe bağlı "Hasta: ____" satırı eklensin. | Evet (`s1-shared.txt`) |
| 12 | Düşük | Klinisyen yürütücüsü | "Pozisyon doğru" (yüksek öncelik) klinisyen yönergesini 9 kez kesiyor. "Nistagmusu gözleyin; başlangıç ve bitişi işaretleyin." hiç duyulmuyor. | Klinisyen kipinde de "Pozisyon doğru" `normal` öncelikle söylensin. | Evet |
| 13 | Düşük | Ana ekran büyük düğme | "Birkaç soru, kısa test ve manevra" yazıyor; gerçekte 11 soru ve ~13 dk (B10 kısmen). | Önce: "Birkaç soru, kısa test ve manevra; sesle yönlendirilirsiniz" → Sonra: "11 güvenlik sorusu, iki kısa test ve manevra · ~15 dk" | Evet |
| 14 | Düşük | Demo kipi `sayAndWait` | Yerleştirme yönergesi demoda seslendirilmiyor (28,6 sn sessizlik). e2e ve ses denetimleri bu bölümü göremiyor (D1 sürüyor). | Demoda da `speech.speak(text)` çağrılsın. | Evet |

**Önceki düzeltmelerin denetimi (gerileme yok)**

| Kaynak | Konu | Sonuç |
|---|---|---|
| tur-1 B1 | Eski atak yeni atağı kilitliyor | Düzeltildi: `closeStaleEpisodes` (72 saat). S2'de 3 hafta sonra yeni atak normal açıldı. |
| tur-1 B2 | Alt tip tek dokunuşla kilit | Düzeltildi: onay ekranı (`hcConfirm`). |
| tur-1 B3, tur-2 K1 | Zincir kendiliğinden başlamıyor | Düzeltildi: S1/S2/S3'te telefon alında 10,4 / 10,6 / 5,3 dk kesintisiz, ekrana bakma 0. |
| tur-1 B4 | Hekime gönder | Düzeltildi: Web Share ile 930 krk metin. Erişim yolu sorunlu (#5). |
| tur-1 B5 | Hatırlatıcı | Kısmen: hâlâ yalnız `.ics` dosyası ve "saat uygulamasında alarm kurun" yazısı. |
| tur-1 B8, B9 | Hazırlık önce; telefon bir kez takılıyor | Düzeltildi. |
| tur-1 B10 | Süre bilgisi | Hazırlık'ta doğru (12–15 dk; ölçülen 12,6). Ana ekranda eksik (#13). |
| tur-1 B13 | Rapor tarihi | Sürüyor (#11). |
| tur-2 Y1 | Adım yönergesi kesiliyor | **Düzeltildi:** hasta kipinde 0 kesik yönerge. |
| tur-2 Y2 | Avuç ekrana değiyor | Düzeltildi: Hazırlık 3. madde ve yardımcı kartı. |
| tur-2 Y3 | Türkçe ses yok uyarısı | Kodda düzeltildi (`prep-no-voice`); koşuda denenmedi. |
| tur-2 O1 | Taraf sırası sesle söylenmiyor | Düzeltildi; kesilme yan etkisi var (#8). |
| tur-2 O2, O3, O5 | Yastık cümlesi, tanıtma sonu, süreler | Sürüyor (#2, #7, #1). |
| tur-2 O4 | "Bu adım tamam" | Düzeltildi (1,2 sn, kesilmiyor). |
| tur-2 O6 | Telefonu indir ve nasılsınız sorusu | Düzeltildi; tekrar okuma kaldı (#9). |
| tur-2 O7 | Banner metni | Düzeltildi: "Başı HASTANIN SAĞINA…". |
| tur-2 O8 | Ekranı çevir | Kısmen (#3). |
| 3. tur yeni | Geri tuşu ve duraklatma | Doğrulandı: kısa dokunuş duraklatmıyor; 900 ms basış duraklatıyor; geri tuşu yürütücüyü duraklatıyor; dinlenme ve geçiş ekranlarında geri yok sayılıyor (`gateback.mjs`). Acil ekranındaki yinelenen paragraf giderildi. |

## 3. Kaldırılabilecekler
- dh-sit ve ep-sit yönergelerindeki yastık cümlesi (#2): her atakta ~18 sn kazanılır.
- "Test tamamlandı." ve bitiş ekranında "Manevra tamamlandı…" cümlesinin ikinci kez okunması (#9).
- Sabah testinden sonra ikinci kapatma düğmesi ("Atak geçti, kapat"), "Atağı kapat" görünürken (#5).
- İlk kullanımda ayrı "Telefonu tanıtma" giriş ekranı. "Hazırım"a dokunuş zaten telefon eldeyken yapılıyor; tanıtma doğrudan başlayabilir. "Sesi dene" Hazırlık'a taşınsın. Kazanç: 1 ekran, 1 dokunuş, ~10 sn.
- Yardımcı kartındaki "⟲ Ekranı çevir düğmesine basın" maddesi (#3); yürütücünün Başlat'lı ekranındaki ikinci "Kim yapıyor?" seçicisi.
- Uygunluk ekranındaki 49 kelimelik işitme paragrafı. Yalnız işitmeyle ilgili madde işaretlenince gösterilsin.

## 4. En önemli 5 madde
1. **#1 Kalan süre tek kaynaktan söylensin.** Önce: "Geçti… 34 saniye daha bu pozisyonda bekleyin." → 5 sn sonra "30 saniye kaldı." → Sonra: "Geçti. 34 saniye daha böyle kalın." → "20 saniye kaldı." Hastanın tek bilgi kanalı ses; çelişen sayılar güveni kırıyor.
2. **#2 Telefon alındayken yastık talimatı kalksın.** Önce (10,5 sn): "Yatağın üzerinde oturun. Yastığı, yattığınızda omuzlarınızın altına gelecek yere koyun. Başınızı sağa doğru yaklaşık 45 derece çevirin." → Sonra (~4,5 sn): "Başınızı sağa çevirin; çeneniz sağ omzunuza doğru yarı yolda."
3. **#3 Başucundaki yakın için tüm tam ekranlar çevrilsin.** Önce: dinlenme, geçiş ve "Başlıyoruz…" ekranları ters; kartta "⟲ Ekranı çevir düğmesine basın". → Sonra: `screenFlip` bu ekranlara da uygulansın; kart: "Başucundaysanız aşağıdaki kutuyu işaretleyin; tüm ekranlar size göre döner."
4. **#4 13,5 sn'lik sessizlikler kısalsın.** Önce: "45 saniye kaldı." … 13,5 sn … "30 saniye kaldı."; dinlenmede 23 sn sessizlik. → Sonra: "40 saniye kaldı." … 8,6 sn … "30 saniye kaldı."; dinlenmede "20 saniye." ve "10 saniye.".
5. **#5 Atak kapanınca rapor kaybolmasın.** Önce: "[Atağı kapat]" ve "[Atak geçti, kapat]" yan yana; kapatınca rapor yalnız etiketsiz Geçmiş simgesinden açılıyor. → Sonra: tek "Atağı kapat", ardından "Atak kapatıldı. [Raporu hekime gönder]".

## Hüküm: faydalı, akışkan, minimalist, kolay mı?
- **Faydalı: Evet.** Taraf iki testle belirleniyor (S1, S2). Manevra açı ölçümüyle ve süreleri sayılarak yapılıyor. Tekrar ve sabah testleri bir yapıya oturuyor. Hekim 5,4 dakikada test, tanı, Epley ve reçeteyi bitirdi. Reçeteli hasta ilk atağını 7,3 dakikada yaptı.
- **Akışkan: Evet.** Telefon alındayken üç senaryoda da ekrana bakmak hiç gerekmedi; S1'de 10,4 dk boyunca yalnız 6 kör dokunuş vardı. Ekrana bakılan iki an kazara duraklatmadan sonra geldi; bu tasarım gereği. Akışı kesen kalan şeyler sözel: #1, #4, #7, #8.
- **Minimalist: Büyük ölçüde.** Kalan fazlalıklar: yastık cümlesi (3 kez), iki kez okunan bitiş cümlesi, iki kapatma düğmesi, ilk kullanımdaki ayrı tanıtma giriş ekranı.
- **Kolay: Hasta için evet. Yakın için orta** (#3). Raporu göndermek için Geçmiş simgesini bulmak gerekiyor (#5).

**Yayına hazır mı: Koşullu.** Kritik ya da Yüksek önemde bulgu yok ve önceki düzeltmelerde gerileme görülmedi. Koşullar:
- #1–#5 düzeltilsin (hepsi metin ya da küçük kod değişikliği).
- En az bir gerçek Android ve bir gerçek iPhone'da şunlar doğrulansın:
  - Gerçek Türkçe ses: konuşma hızı, `onend` olayı ve yerleştirme yönergesi (demoda seslendirilmiyor, #14).
  - Ekranı açık tutma (headless'ta "Ekran açık tutulamıyor" kartı çıktı; cihazda doğrulanmadı).
  - Yan yatışta otomatik döndürme.
