# Kullanıcı turu 4 (son) — sentez ve son düzeltmeler

Puanlar (1 → 2 → 3 → 4. tur): k01 7→8→8,5→9 · k02 7→8→9→9,5 · k03 6→8→9→9 · k04 6→8→9→9,5 · k05 6→7→8→9 ·
k06 7→8→8→9 · k07 5→8→9→9 · k08 7→8→9→9 · k09 7→8→9→9 · k10 7→8→9→9. Ortalama 6,5 → 7,9 → 8,75 → **9,1**.
"Önerir miyim / klinikte kullanır mıyım": **Evet** k01, k02, k03, k04, k06, k07, k08 (koşullu evet) · **Koşullu** k05 (ilk
kurulum bir yakınla), k09 (etik kurullu pilot, gerçek telefonda açı doğruluğu), k10 (ev raporu başlıkları — bu turda düzeltildi,
gerçek telefonda açı). Ortak koşul: gerçek Android/iPhone'da açı, ses ve titreşim doğrulaması ve pilot (yazılım dışı).

Turda düzeltilenler: ev raporu adım başlıklarında "{Aya}" şablonu (k10, k09; çözümleme raporu açarken yapıldığı için eski
bağlantılarda da doğru görünür); bitiş ekranında "uyku pozisyonu kısıtlaması ya da boyunluk gerekmez" (k10, AAO-HNS 2017).

## G1 — Yürütücü (runner.ts, evaluator.ts, pauseSheet.ts, RunnerView.tsx, protocols.ts)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Orta–Yüksek | Duraklatma onayı: "Evet" penceresi onay cümlesi bittikten sonra başlar ve ≥15 s sürer; onay cümlesi kısa ("Eminseniz üstteki Evet'e dokunun."); kör ikinci dokunuş koruması aynen | k01 |
| 2 | Orta | Yanlış taraftan sırtüstüne gelince "2 uzun" (hareket) titreşimi ve kısa "Tamam, şimdi sağ yanınıza." | k04 |
| 3 | Orta | "Pozisyona gelinemedi"de en iyi açı 1–2 s'lik ortalamadan; değer hedef aralığına düşüyorsa "hedefe yalnız bir an değdi, tutulamadı" | k07 |
| 4 | Düşük | Sesli metinlerde "72 s" yerine "saniye" / "bir dakikadan uzun"; duraklatma sesi ilk iki cümleden sonra kısalsın (ayrıntı "Tekrar dinle"); kısa seste aynı yön ipucu 3. tekrardan sonra seyrekleşsin; yüzüstünden geçilerek gelinen hedef için "yüzüstünden geçilerek gelindi, kabul edilmedi" | k07, k04, k10, k02 |

## G2 — Hasta akışı ve rapor (EpisodeFlow.tsx, PatientHome.tsx, Onboarding.tsx, History.tsx, reportText.ts, PrescriptionImport.tsx, flowText.ts)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Orta | "Şu an nasılsınız?" telefon alından inince / ilk dokunuşta bir kez sesli okunur (doğrula, eksikse düzelt) | k01 |
| 2 | Düşük | Dönem raporu: sonuç satırı önce son atağın sonucunu yazar; sayfada QR kartı | k09 |
| 3 | Düşük | Yakını modunda: yanlış taraf bitiş ekranı ve hazırlıktaki işitme cihazı notu yardımcıya göre; kurulumda "yakını olarak kuruyorum" seçilince "başucunda duracağım (ekranı çevir)" | k02 |
| 4 | Düşük | Reçete kartında ekran da "kristal oynaması (BPPV)"; kurulum uygunluk listesi sesli okumada önce kısa giriş, tam liste "Tekrar dinle"de; "Son 2 hafta içinde" seçim tarihi süre dolmadan da görünür; kan sulandırıcı kurulum notunda tansiyon ilacı için "ayağa kalkınca göz kararması olursa uygulama durdurur; hekiminize önceden sorun" | k05, k01, k03, k07 |

## G3 — Klinisyen ve testler (clinician/*, styles.css klinisyen baskı bölümü, e2e/run-e2e.mjs)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Düşük | Ev raporu bağlantısı Safari'de açılınca (iPhone'da kayıtlar uygulamadan ayrı) "bağlantıyı kopyalayıp uygulamadaki 'Hastanın ev raporu' alanına yapıştırın" yönergesi ve kopyala düğmesi; yapıştırma alanına reçete bağlantısı girilince açık "bu bir ev reçetesi bağlantısı" mesajı | k08, k09 |
| 2 | Düşük | Ses kipi klinisyen profilinde de seçilebilir; basılı raporda reçete+QR+imza bloğu bölünmez; başlıkta dönem bitişi "reçete geçerliliği" diye etiketlenir | k08 |
| 3 | Orta | 2. ve 3. turda düzelen davranışlar uçtan uca testlere bağlanır: kör dokunuşa dayanıklı acil onayı, aynı gün yeniden açma, sınır kartı, soru başına okuma kilidi hafızası, duraklatma onayı, yanlış taraf uyarısı | k06 |

## Yapılmayanlar
- Güvenlik sorularının sesli gövdesinden "… sayılmaz" açıklamalarının çıkarılması ve ortostatik/kulak sorularında "bilinen, değişmeyen" belirti ayrımı (k04, k07): klinik ekip kararı; sorular güvenli yönde kalır.
- "Hekime söyleyecekleriniz" listesini uygulamada yanıtlama (k03), taraf sorusunda "geçen sefer" notu ve hazırlık listesinin katlanması (k06): isteğe bağlı konfor; sonraki sürüm.
- Hatırlatıcıda bildirim (k05): ağsız PWA'da güvenilir değil.

## Uygulama durumu (son düzeltmeler sonunda)
G1–G3'ün bütün maddeleri uygulandı ve birleştirildi. 466 birim testi ve 21/21 uçtan uca senaryo geçiyor (7'si 2.–3. tur
davranışlarını kilitleyen yeni senaryo). Yapılmayanlar yukarıda gerekçeleriyle.
