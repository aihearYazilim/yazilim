# Kullanıcı turu 3 — sentez ve iş bölümü

Aynı on kullanıcı üçüncü kez kullandı. Puanlar (1 → 2 → 3. tur): k01 7→8→8,5 · k02 7→8→9 · k03 6→8→9 · k04 6→8→9 ·
k05 6→7→8 · k06 7→8→8 · k07 5→8→9 · k08 7→8→9 · k09 7→8→9 · k10 7→8→9. Ortalama 6,5 → 7,9 → **8,75**.
"Önerir miyim / klinikte kullanır mıyım": **Evet** k03, k04, k06, k08, k10 · **Koşullu** k01, k02, k05, k07, k09.
Koşulların çoğu aşağıdaki Yüksek maddelere bağlı (k01: duraklatma düğmeleri; k02: yanlış taraf sesi; k07: raporda durulan
yer). k09'un koşulu (etik kurullu pilot, gerçek telefonda açı doğruluğu) yazılımın dışında.

## F1 — Yürütücü (runner.ts, evaluator.ts, protocols.ts, haptics.ts, RunnerView.tsx)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Yüksek | Duraklatma sayfasında kalıcı sonuçlu düğmeler ("Pozisyona gelemiyorum", "Kendimi kötü hissediyorum", "Şimdilik bırak") tek kör dokunuşla tetiklenmez: ikinci bir onay ister. Baş dönmesi işaretliyken sayfadaki ilk tek dokunuş nereye denk gelirse gelsin "geçti" sayılır | k01 |
| 2 | Yüksek | Yanlış taraf: algılanınca 1–2 s içinde kısa "Dur! Yanlış taraf." + ayrı titreşim/bip, ardından "Sırtüstüne getirin…"; uyarı önceki cümle bitmeden yinelenmez. Yanlış tarafta kalındığı için durdurmada gerekçe "yanlış tarafa döndü, doğru yana gelinemedi" | k02 |
| 3 | Orta | "Pozisyona gelinemedi"de aramada ulaşılan en iyi açı kayda geçer (rapor "baş en çok ~8° (hedef 15–40°)" yazabilsin); "biraz daha geriye" en çok 3 kez, sonra "zorlamayın" | k07 |
| 4 | Orta | Klinisyen üst çubuğu: ses düğmesi simge; "Ekranı çevir" ≥44 px ve tamamen görünür; başlık ≤2 satır; baş göstergesi görünür. Kısa seste 2–3 kelimelik yön ipuçları ("Hastanın sağına.", "Daha sarkık.", "Gövdeyi soluna."); "kapalı" tamamen sessiz ("Başlıyoruz" dahil), alt yazı da gizlenir | k08, k10 |
| 5 | Orta | Duraklatma sesi önce eylemi söyler ("Devam için ekrana iki saniye basılı tutun."); "Zaten yattınız" cümlesi yavaş geçiş cümlesiyle kesilmez (tek cümlede birleşir); son baş dönmesi hatırlatması 120 s durdurma cümlesiyle kesilmez | k04, k10, k01 |

## F2 — Hasta akışı (EpisodeFlow.tsx, PatientHome.tsx, Controls.tsx, episodes.ts, safety.ts kırmızı bayraklar)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Orta | Sesli okuma kısalır: seçenekli ekranlarda soru okunur, seçenek alt açıklamaları yalnız "Tekrar dinle"de; manevra sonu sesli metni ≤10 s; hazırlık ekranı açılınca kısa hâli okunur; "BPPV'den farklı mı" sesli biçiminde "yatarken/kalkarken başlayan, saniyeler süren" ölçütü kalır | k04, k05, k01, k09 |
| 2 | Orta | "Doğru mu?" onayı: yanıt kartı ve başlık en üstte ("Yeni belirti var — doğru mu?"), "Evet, doğru" hemen altında; "Yanlış dokundum" dokunulan yerde kalır | k05, k06 |
| 3 | Orta | 2,5 s okuma kilidi yalnız soru bu kişiye ilk kez sorulurken ya da metni değiştiğinde; daha önce yanıtlanmışsa yalnız çift dokunuş kilidi | k06 |
| 4 | Düşük | Reçete bitimi kartı dönemdeki bütün atakları açar (dönem raporu) ve başta tek satır sonuç; hazırlıktaki işitme cihazı notunda "Titreşimleri tanı" bağlantısı; yakını modunda hazırlık maddeleri yardımcıya göre | k09, k04, k02 |

## F3 — Kurulum, rapor, ses (Onboarding.tsx, History.tsx, reportText.ts, Settings.tsx, speech.ts, dxTiming.ts, consent.ts)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Orta | Tanı zamanı sınırı takvim günüyle ve güvenli yönde (hekimin "2 hafta önce" dediği gün yakın sayılır); "Son 2 hafta içinde" seçimi 14 gün sonra düzenlemede "Daha önce" olarak görünür ya da seçildiği tarih yazılır | k01, k03 |
| 2 | Orta | Rapor: "pozisyona gelinemedi"de nerede durulduğu (test/adım, ulaşılan açı, hedef); yanlış taraf gerekçesi; dönem raporu görünümü (F2'nin kartı açar) | k07, k02, k09 |
| 3 | Düşük | Onam: "Olası yan etkiler" ve "Seçenekleriniz" katlanabilir; yakını modunda uygunluk listesi yardımcıya göre; sesli okumada "ör." → "örneğin"; uygunluk listesinde her maddenin başında sesteki kısa ad kalın | k03, k02, k07, k05 |

## F4 — Klinisyen ve rapor aktarımı (ui/screens/clinician/*, examReport.ts, yeni core/reportShare.ts, yeni ReportQr.tsx)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Orta | Hasta raporu ağsız QR/bağlantı olarak klinisyene aktarılır; klinisyen modunda aynı hasta koduyla muayeneye "ev dönemi" olarak eklenir (üç turdur istenen; ağ yok, veri bağlantının içinde) | k09, k10 |
| 2 | Düşük | Klinisyen basılı/ekran rapor tablosunda "hedef sınırında", "oturuştan geçilmedi", "komuttan önce hareket", "yanlış taraf" etiketleri | k10 |

## Klinik ekibin kararı gereken (uygulanmadı)
- Ortostatik ve kulak sorularında "bilinen, değişmeyen" belirtinin ayrımı (k07, k03): sorular güvenli yönde kalır.
- Gerçek telefonlarda açı doğruluğu ve etik kurullu pilot (k09).
