# Yeni kullanıcı turu 3 — sentez ve düzeltmeler

Puanlar (sezgisellik / memnuniyet, tur 1 → 2 → 3): y01 6/7 → 8/8 → **9/8** · y02 5/6 → 7/7 → **8/8** ·
y03 5/6 → 7/8 → **8/9** · y04 7/4 → 8/7 → **9/8** · y05 7/5 → 8/7 → **9/8** · y06 6/6 → 8/8 → **7/7** ·
y07 5/5 → 7/7 → **8/7** · y08 7/7 → 8/8 → **9/9**. Ortalama sezgisellik 6,0 → 7,6 → **8,4**, memnuniyet 5,75 → 7,5 → **8,0**.
"Ne yapacağımı bilemedim": y01 3→0→0, y02 7→3→1, y03 10→5→3, y08 7→2→0. Tur 2 Kritik'i (kulak düğmeleri) karşılandı.

Tek düşüş y06: tur 2'de duraklatmaya eklenen "çift dokunuş = Kendimi kötü hissediyorum" ve "2 sn basılı tut" hareketinin
bağlama göre "devam" ya da "durdur" anlamına gelmesi, hızlı dokunan kişinin manevrasını haksız yere durdurdu (y06, Kritik);
aynı tasarım, onayı geç veren y07'nin manevrasını sürdürdü (y07, Yüksek). Karar: **yürütücüde tek ve sabit kural** —
"Devam et" düğmesine her dokunuş devam eder; **ekrana 2 sn basılı tutmak her zaman durdurur** (uzun baş dönmesi uyarısı,
duraklatma, "kötüyüm"); çift dokunuşun özel anlamı kalkar; durdurma 5 s sesli geri sayımla geri alınabilir
("Durduruyorum. Yanlışsa Devam et'e dokunun").

## N2 — Yürütücü ve ses (core/runner.ts, core/pauseSheet.ts, RunnerView.tsx, Calibrate.tsx, protocols.ts, Gauges.tsx, platform/speech.ts)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Kritik | Yukarıdaki tek kural: "Devam et"e tek/çift dokunuş = devam; 2 sn basılı = durdur (her ekranda aynı); çift dokunuş özel anlamı kalkar; durdurma 5 s geri alınabilir (ses + "Devam et"); duraklatma sesi bu kuralı söyler, "devam için basılı tutun" cümlesi kalkar | y06, y07 |
| 2 | Orta | Bu oturumda kalibrasyon yapıldıysa test/manevra başı yerleştirmede baş geriye yatırma istenmez, yalnız dik duruş | y07 |
| 3 | Düşük | Hasta modunda gösterge yazıları gündelik ("sağa 45°" → "sağa yarıya kadar", "Baş sarkıklığı", "Çene göğse" sade karşılık) | y03, y01 |
| 4 | Düşük | 2 dk uyarı sesi kısa: önce "Durdurmak için ekrana iki saniye basılı tutun", sonra gerisi | y07 |
| 5 | Düşük | Klinisyende "Kalibrasyon tamam" kesilmesin; kalibrasyonda "(cihazın yön kuralı ölçülür)" → "(telefonun nasıl tutulduğunu öğrenir)"; ses metninde ".." çift nokta tek | y05, y08 |

## N1 — Hasta akışı ve ana ekran (PatientHome.tsx, EpisodeFlow.tsx, flowText.ts, reportText.ts, state/*)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Yüksek | Ana ekran açılınca bir kez kısa konuşsun: "Başınız dönüyorsa üstteki büyük düğmeye dokunun." (tanı varsa ek cümle yok; dokununca susar) | y02, y06 |
| 2 | Orta | Güvenlik listesi açılış sesi tek cümle (~6 s): "Şu an bunlardan biri varsa işaretleyin; yoksa Hiçbiri yok'a dokunun. Maddeleri dinlemek için Listeyi dinle'ye dokunun."; konuşma hızı Yavaş ya da yazı büyükse kısa madde adları da okunur. İşaretleme sonrası "İşaretlendi: …" bitene dek (≈1,5 s) büyük düğme kilitli; "Yanlış dokundum"dan sonra açılış sesi baştan okunmaz, "Düzeltildi. Başka yoksa Hiçbiri yok'a dokunun." | y01, y02, y07 |
| 3 | Orta | Taraf çelişkisi ekranında "Yanlış girmişim, doktor sağ dedi: kaydı düzelt" seçeneği; ilk ses "Önerim: test tarafına devam" | y02 |
| 4 | Orta | Manevra sayfası doğrudan yenilenince de "n. adımda yarıda kaldı" sorusu (hazırlık ve yerleştirme baştan gelmez) | y01 |
| 5 | Orta | Ana ekran atak kartı tek satır: "Bugün başka manevra yok; önce tekrar testi" (iki ayrı "önerilen en fazla 3" satırı kalkar); sonraki adım "Tekrar testi 23:14'te (uyuyorsanız uyanınca)"; ana ekrandaki tekrar testi kartı tekrarı kalkar; saat bitiş ve ana ekranda aynı (aynı yuvarlama) | y03, y01, y02 |
| 6 | Orta | Manevra sonrası "Şu an nasılsınız?" sorusu telefon alından inince ya da 3 s sonra seçenekleriyle okunsun (demo modunda da) | y07, y02 |
| 7 | Düşük | Bitiş ekranı üstte iki satır ("10 dakika oturun." / "Kalkarken tutunun.") + tekrar testi satırı, paragraf katlı; uyarı ekranlarının üstünde tek kısa cümle, "KBB" yerine "kulak doktoru"; kulak onayında "Evet"/"Hayır" eşit görünüm; negatif test metnindeki çelişki ("sağ tarafı da test edelim" + "kristal oynamasından olmayabilir") giderilsin | y01, y03, y06, y02 |
| 8 | Orta | VAS manevra başına: `ManeuverLog.vasAfter?: number` (atakta yalnız `vas.before`); hastanın kendi raporunda VAS görünür; manevra yapılmadan yazılan `VOMITING` aşma sayılmaz; raporda "sonrası: kusma ya da şiddetli bulantı"; yedekte devam edilen kırmızı bayrak `stopped: true` yazmasın | y04, y07 |

## N3 — Klinisyen ve araştırma verisi (clinician/*, core/diagnosis.ts, core/prescription.ts, core/reportShare.ts, PrescriptionImport.tsx)
| # | Önem | İstek | Kaynak |
|---|---|---|---|
| 1 | Yüksek | Muayene başı güvenlik kontrolünde "Var" (spontan nistagmus / nörolojik bulgu / boyun) varsa santral örüntüdeki gibi: Tanı ve Tedavi'de kırmızı satır, Reçete'de "ev reçetesi önerilmiyor" + ≥10 karakter gerekçe (`RX_SAFETY_CHECK`), hasta kartında "Hekim uyarıya rağmen verdi: muayenede …"; santral ya da güvenlik uyarılı reçetede hasta kartı tanı satırı "Olası BPPV (hekim uyarısıyla)" | y05 |
| 2 | Orta | Kontrol muayenesinin üstünde tek özet kartı: önceki tanı ve reçete, ev dönemi özeti, öneri cümlesi; listede "kontrol · önceki tanı: …" | y08 |
| 3 | Orta | Bulgu taslağı uygulama kapanıp açılınca da korunsun (muayeneye bağlı kalıcı; kaydedilince silinir) | y08 |
| 4 | Orta | CSV: atak içi olay sıra numarası (`sira`) ve saniyeli zaman; manevra satırında `vasAfter`; isteğe bağlı DHI (0–100) kontrol muayenesine alan, rapor ve CSV muayene satırı | y04 |
| 5 | Düşük | Klinisyen ana ekranında araştırma/CSV bloğu katlı; HBYS'deki eski "testsiz kısa yol" cümlesi reçete ekranındaki tek cümleyle aynı; hastanın reçete kartında tek süre ("en fazla 3 gün" ile "(14 gün)" yan yana değil) | y08, y05, y04 |

## Yapılmayanlar
- Güvenlik listesinin madde sayısı ve uyarı metinlerinin klinik içeriği (y03): klinik ekip kararı.
- "Geçti mi?" ve yarım manevra soruları için kör yol (y07): sonraki sürüm; N1-6 ile en azından sesli okunur.
