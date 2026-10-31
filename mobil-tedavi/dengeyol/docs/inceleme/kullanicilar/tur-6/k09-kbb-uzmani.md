# Tur 6 · k09 · KBB uzmanı (Doç. Dr. Serkan, 52, nörootoloji polikliniği)

## 1. Ben kimim, ne yapmaya çalıştım
Aynı KBB uzmanıyım. Bu tur sunucu `localhost:4183`. Önce 5. raporumdaki iki isteği kontrol ettim:
- klinisyen içe aktarma ekranı ve HBYS satırı önce son atağın sonucunu yazıyor mu,
- adlandırılmış tarihler QR kartında, içe aktarma ekranında ve HBYS'de aynı mı.

Sonra kapalı döngüyü iki ayrı telefonla (Pixel 7 öykünümü) yeniden yaşadım:
1. Klinisyen telefonunda muayene ve QR reçete.
2. Hasta telefonunda içe aktarma ve gerçek hızda (timeScale 1) atak; ardından 1. saat tekrar testi ve rapor QR'ı.
3. Klinisyen telefonunda içe aktarma, "ev dönemi" ekleme ve HBYS notu.

Ayrıca iki ataklı (biri hekime yönlendirilmiş) kurgulanmış bir reçete dönemini klinisyene aktarıp HBYS'ye ekledim. 4. turdaki
eski derlemeyle üretilmiş bağlantıyı, ret durumlarını ve yapıştırma alanını yeniden denedim.

## 2. Yaşadıklarım (kısa günlük)
- **Döngü:** Reçete, atak ve tekrar testi değişmeden sorunsuz. "Farklı mı?" sorusu seste ölçütüyle okunuyor.
- **Açık atakta klinisyen ekranı:** Başlık "Ev dönemi · Reçete 31.10 (geçerlilik 13.11 dahil) · atak 31.10 · rapor 31.10". Sonuç satırı
  "Son atak (31.10) — atak açık: 1. saat tekrar testi negatif, sabah testi bekleniyor · 1 atak · 1 manevra…" diye başlıyor. Artık
  belirsiz "sürüyor" yerine tam olarak bilmem gereken şeyi söylüyor: erken test negatif, kesin sonuç sabah.
- **Açık atakta HBYS:** Satır aynı sırayı izliyor: "Ev dönemi (…): Son atak (31.10) — atak açık: … · reçete 31.10 (geçerlilik 13.11
  dahil) · atak 31.10 · rapor 31.10 · reçete kodu 443c91d0 (bu muayenenin reçetesi)."
- **Kurgulanmış dönem (1. atak düzeldi, 2. atak yönlendirildi):**
  - QR kartı: "Reçete 16.10 (geçerlilik 29.10 dahil) · ataklar 17.10–25.10 · rapor 31.10: 2 atak, 3 manevra · hasta kodu NO-2611".
  - Klinisyen başlığı aynı tarih dizisini veriyor. Sonuç satırı "Son atak (25.10): hekime yönlendirildi — baş dönmesi bir dakikadan
    uzun sürdü…" diye başlıyor.
  - HBYS satırı da aynı sonuçla başlıyor ve aynı adlandırılmış tarihleri içeriyor.
  - Üç yerde tarihler birebir aynı.
- **Eski bağlantı:** 4. turdaki eski derlemeyle üretilmiş bağlantı da yeni başlık biçimiyle ve doğru taraflı adım başlıklarıyla açılıyor.
- **Ret ve güvenlik denemeleri:** Hepsi önceki turdaki gibi çalışıyor.
  - Yanlış hasta seçilince kod uyuşmazlığı uyarısı; aynı rapor ikinci kez eklenemiyor.
  - Reçete, bozuk ve kesik bağlantı ayrı mesajlarla reddediliyor.
  - Yapıştırma alanında reçete bağlantısı için açık mesaj, serbest metin için "benzemiyor".
  - Hasta telefonunda rapor bağlantısı "bu sayfa hekiminiz içindir" diyor.
- **Tek tutarsızlık hasta tarafında:** Hastanın kendi dönem raporunda (ve "Hekime gönder" ile paylaşılan metinde) "Dönem" satırı
  hâlâ eski biçimde: "Reçete dönemi (16 Ekim 2026 – 29 Ekim 2026 ve sonrası, 31 Ekim 2026 tarihine kadar)" (#3).

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | — | 5. kullanımdaki isteğim #5 (klinisyen ekranı ve HBYS önce son atağın sonucunu yazsın) | **Karşılandı.** Yönlendirilmiş dönemde "Son atak (25.10): hekime yönlendirildi — …"; açık atakta "atak açık: 1. saat tekrar testi negatif, sabah testi bekleniyor". Hem içe aktarma ekranında hem HBYS'de önde. | — | Evet (gerçek döngü + kurgulanmış dönem) |
| 2 | — | 5. kullanımdaki isteğim #6 (adlandırılmış tarihler her yerde aynı) | **Kısmen.** QR kartı, klinisyen içe aktarma ekranı ve HBYS'de birebir aynı ("Reçete 16.10 (geçerlilik 29.10 dahil) · ataklar 17.10–25.10 · rapor 31.10"). Hastanın dönem raporu sayfasında ve paylaşılan metinde eski biçim kalmış (#3). | — | Evet |
| 3 | Düşük | Hasta dönem raporu ve paylaşılan metin: `reportText.ts:529-530`, `:625` ("Dönem:" satırı) | "Reçete dönemi (16 Ekim – 29 Ekim ve sonrası, 31 Ekim tarihine kadar)" yazıyor. WhatsApp metniyle gelen raporu QR'la gelenle karşılaştıran hekim iki farklı biçim görüyor. Klinik yanlışlık yok, yalnız tutarlılık sorunu. | Aynı adlandırılmış diziyi kullanın: "Reçete 16.10 (geçerlilik 29.10 dahil) · ataklar 17.10–25.10 · rapor 31.10". | Evet |
| 4 | — | Bilerek ertelenen (00-SENTEZ): ev raporu QR biçimine "yüzüstünden gelme" ve testte durdurma bilgisi | Biçim sürümü 2 gerektiği için ertelenmiş. Gerekçeyi kabul ediyorum: eski klinisyen sürümlerinin yeni bağlantıyı reddetmesi, eksik bilgiden daha kötü olurdu. Bu bilgiler hastanın metin raporunda zaten var. | Pilot öncesi biçim v2'ye geçilirken eklensin; eski sürüm "uygulamayı güncelleyin" desin. | Belge |

**Bilimsel kontrol:**
- Bu turda klinik kural değişmedi.
- Açık atak için yeni sonuç ifadesi ("1. saat tekrar testi negatif, sabah testi bekleniyor") protokolle uyumlu. Erken negatif test
  tek başına iyileşme sayılmıyor, sabah testiyle doğrulanıyor. Bu, erken değerlendirmenin geç değerlendirmeyle teyit edilmesi
  ilkesine uygun.
- Ev dönemi kaydının "hasta beyanı" etiketi ve AAO-HNSF 2017 ile uyumlu "postür kısıtlaması gerekmez" bitiş cümlesi korunmuş.
- Yeni bir bilimsel hata görmedim.

## 4. Sevdiklerim
1. Klinisyen ekranında ve HBYS'de karar bilgisinin en önde olması: "Son atak: hekime yönlendirildi" ya da "atak açık: sabah testi
   bekleniyor". Kontrol muayenesinde ilk okuduğum satır artık doğru satır.
2. Adlandırılmış tarih dizisi "reçete (geçerlilik … dahil) · ataklar · rapor". Medikolegal kayıtta hangi tarihin ne olduğu tartışmasız.
3. Altı tur boyunca güvenlik çizgileri ve geriye uyumluluk korunmuş. Eski bağlantılar hâlâ doğru okunuyor.

## 5. Memnuniyet
**9,5/10 (7 → 8 → 9 → 9 → 9 → 9,5).** Klinisyen tarafında istediğim her şey var. Kalan tek fark hasta raporundaki bir tarih
satırının biçimi. 10 için gerçek telefon ve gerçek hasta verisi gerekiyor; bu yazılımın dışında.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Koşullu.**
Koşullar:
- **(a) Hasta seçimi:** Yalnız kendi muayene ettiğim, tek taraflı arka kanal kanalolitiazisi Dix-Hallpike ile doğrulanmış,
  kontrendikasyonu olmayan hastalar; QR muayenede elden verilir.
- **(b) Pilot:** Etik kurul onaylı pilot çalışma içinde. Yazılı aydınlatılmış onam olur; reçete bitiminde ev dönemi QR'ı kontrol
  muayenesinde okutulur; yönlendirme oranı ve 1. hafta iyileşme ölçülür.
- **(c) Doğruluk:** Pilottan önce gerçek Android ve iPhone'larda açı, ses ve titreşim doğrulanmış (Faz A) olmalı.

Bu koşullar sağlanınca polikliniğimde kullanırım. Reçetesiz genel kullanım için o zamana kadar hayır.
