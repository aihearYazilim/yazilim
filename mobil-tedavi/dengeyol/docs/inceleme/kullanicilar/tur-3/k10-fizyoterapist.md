# Tur 3 — k10 Fizyoterapist (Burak, 39, vestibüler rehabilitasyon)

## 1. Ben kimim, ne yapmaya çalıştım
Hekimden yönlendirmeli BPPV hastalarına klinikte manevra yapan, evde Epley/Semont veren fizyoterapistim. 2. turdaki
isteklerimi (`tur-2/00-SENTEZ.md`) kendi gözümle kontrol ettim. Aynı sınır denemelerini yeniden yaptım: 30°/58° dönüş,
10/13/14/15° sarkma, yavaş, yuvarlanarak ve doğru-hızlı Semont, gövdesini döndürmeyen hasta. Hasta modunda Semont'u
gerçek hızda (×1) yaptım; hasta "Şimdi!" komutundan önce hareket etti. Yastık hatasını ×1, Epley hatalarını ×5 denedim.
iPhone 13 öykünümü, demo sensör, ses kaydı.

## 2. Yaşadıklarım (kısa günlük)
- **Klinik DH:** Sınırlar aynı ve tutarlı (30° ve 10° reddedildi, 15° kabul edildi, 13°'te tutmaya devam, 10°'de "bozuldu").
  Sayı kartı ve afiş artık "Başı hastanın sağına/soluna çevirin" diyor. Adım başlıkları da sesle "Sırtüstü, baş
  hastanın sağına 45° ve sarkık" diye okunuyor. Başucunda kimin sağı olduğu artık belirsiz değil.
- **Ama varsayılan "Ses: kısa":** Düzeltme ipuçları hiç seslendirilmiyor. 30° dönüşte, θ −95°'te gövde dönmediğinde ve
  sarkma kaybında yalnız "Pozisyon bozuldu." deniyor, yön söylenmiyor. Hastanın başını iki elimle tutarken ekrana
  bakamıyorum; baş göstergesi de hâlâ ekranın altında. Başlıktaki "Ses: kısa" düğmesi yüzünden üst satır sıkıştı:
  "Epley · sağ — Adım 4/5" 5 satıra bölünüyor.
- **Klinik Semont:** Yavaş geçişte ses "Pozisyon doğru. Geçiş 6 saniye, yavaş." diyor. Yuvarlanarak geçişte "Pozisyon
  doğru. Oturuştan geçilmedi." diyor; ekranda not çıkıyor ve HBYS notuna "3. adımda oturuştan geçilmedi" yazılıyor. Oturuştan
  120 ms'de geçen doğru-hızlı Semont'ta uyarı yok: yanlış alarm vermiyor.
- **Klinik rapor:** Tabloda φ, geçiş, nistagmus ve "erken bitirildi" var. HBYS notu kısalmış ama işaretleri taşıyor:
  "2. adım hedef sınırında", "oturuştan geçilmedi", "yavaş geçiş 6 s". **Basılı/ekrandaki raporun tablosunda** ise "hedef
  sınırında", "oturuştan geçilmedi" ve "komuttan önce hareket" işaretleri görünmüyor; yalnız "%2" ve φ ort. 14° var.
- **Hasta Semont (×1):** Yönerge artık "Kıpırdamayın; 'şimdi' dediğimde hareket edeceksiniz…" ile başlıyor ve kısalmış
  (~10 s). Hasta yine yönerge sürerken yattı. Uygulama fark etti ve yönergeyi kesip "Zaten yattınız; sayımı bırakıyoruz…"
  dedi. **"Şimdi!" söylenmedi.** Bu cümle 1 s sonra "Geçiş 4 saniye sürdü; bir dahaki sefere tek hamlede… Şimdi böyle
  kalın." ile kesildi. Hasta raporunda "yavaş geçiş 4.1 s · komuttan önce hareket edildi" yazıyor.
- **Yastık (×1, Epley 1):** "Başınızı biraz daha geriye bırakın" → 5 s → yastık ipucu → **25 s sessizlik** → "Yastığı
  düzeltince devam ederiz…". "Daha fazla zorlamayın" bu sırada gelmedi. Düzeltince "Tamam, böyle kalın" hemen geldi.
- **Ev Epley (×5):** Gövde ipucu sağlam. Yönergeler kısalmış ve "45 derece" yerine "yarıya kadar" deniyor; hasta için daha anlaşılır.
- **Reçete/rapor:** Geçerlilik "13 Kasım (dahil)", reçete kodu, kısa yol kaydı, 14 günlük doz özeti var. Takip için hasta
  raporu artık bana yeterli bilgiyi veriyor.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | — | 2. kullanımdaki isteğim A (Semont: komuttan önce hareket) | **Karşılandı.** Sayım iptal ediliyor, "Şimdi!" denmiyor, yönerge "Kıpırdamayın" ile başlıyor, kayda geçiyor. | — (bkz. #N3) | Evet (×1 ses kaydı) |
| 2 | — | İsteğim #7 (oturuştan geçiş denetimi) | **Karşılandı.** Yuvarlanma hem sesle hem kayıtta işaretleniyor; doğru-hızlı Semont'ta yanlış alarm yok. | — | Evet |
| 3 | — | İsteğim B (yastık sonrası bekleme, "zorlamayın" zamanı) | **Karşılandı.** 25 s sessizlik var; yastık durumunda zorlama uyarısı verilmiyor. | — | Evet (×1) |
| 4 | — | İsteğim C (sınırda tutulan adımın işaretlenmesi) | **Kısmen.** HBYS notunda ve hasta raporunda var; klinisyenin basılı/ekran rapor tablosunda yok (`Exam.tsx` ~970-990). | Tabloya "sınırda", "oturuştan geçilmedi", "komuttan önce" etiketleri (erken bitirildi gibi). | Evet |
| 5 | — | İsteğim D (yavaş geçişin klinisyene sesle söylenmesi) | **Karşılandı.** "Geçiş 6 saniye, yavaş." / "Oturuştan geçilmedi." | — | Evet |
| 6 | — | İsteğim #10 (klinisyen sesi "hastanın sağına/soluna") | **Kısmen.** Kart, afiş ve adım başlıkları doğru. Varsayılan "kısa" seste düzeltme ipucu hiç okunmuyor (`runner.ts` 672-679); "açık" seste okunuyor. | bkz. #N1 | Evet |
| 7 | — | İsteğim #11 (gösterge yerleşimi, otomatik çevirme) | **Karşılanmadı**, biraz kötüleşti (#N2). | Klinisyende göstergeyi üstte küçük sabitle; yatınca başucuna çevirme seçeneği. | Evet (ekran) |
| 8 | — | İsteğim #12 (ev kaydını kliniğe aktarma) | **Karşılanmadı** (sentezde gerekçeyle pilot sonrasına bırakılmış). Hasta raporu artık metin olarak yeterli. | — | Sentez |
| 9 | — | İsteğim #13 ("kısıtlama/boyunluk gerekmez" cümlesi) | **Karşılanmadı.** Yanlış öneri de yok; dinlenmenin gerekçesi ve düşme önlemi iyi. | Bitiş ekranına tek cümle. | Evet |
| N1 | Orta | Klinisyen "Ses: kısa" (varsayılan); `core/runner.ts:672-679` | Kısa seste düzeltme yönü hiç söylenmiyor, yalnız "Pozisyon bozuldu.". İki elim hastanın başındayken ekranı göremiyorum ve gösterge ekranın dışında. | Kısa seste 2–3 kelimelik yön: "Hastanın sağına.", "Daha sarkık.", "Gövdeyi soluna." Uzun cümleler "açık"ta kalsın. | Evet (ses kaydı) |
| N2 | Düşük | Klinisyen yürütücü başlığı (iPhone 13) | "Ses: kısa" düğmesi başlığı sıkıştırıyor ("Epley · sağ — Adım 4/5" 5 satır); baş göstergesi tamamen ekran dışında kalıyor. | Ses düğmesini simgeye indir ya da alta al; göstergeyi küçültüp üst yarıya al. | Evet (ekran) |
| N3 | Düşük | Hasta Semont, komuttan önce hareket + yavaş geçiş | "Zaten yattınız; sayımı bırakıyoruz…" 1 s sonra yavaş geçiş cümlesiyle kesiliyor; hasta yarım cümle duyuyor. | İki durumu tek cümlede birleştir: "Zaten yattınız, böyle kalın. Geçiş 4 saniye sürdü; bir dahaki sefere 'şimdi'yi bekleyip tek hamlede geçin." | Evet (×1) |

## 4. Sevdiklerim
- Evde Semont'un üç ana hatası (yavaş geçiş, yuvarlanma, komuttan önce hareket) artık sesle düzeltiliyor ve raporda
  görünüyor. Doğru yapan hastaya yanlış alarm verilmiyor.
- Yastık, gövde dönüşü ve "pozisyona gelinemedi" kuralları gerçek ev hatalarına uyuyor; hedef hiçbir yerde gevşetilmemiş.
- Hasta raporu (reçete kodu, kısa yol, doz özeti, adım bayrakları) kontrol muayenesinde ne olduğunu bana anlatıyor.

## 5. Memnuniyet
**9/10** (1. tur 7, 2. tur 8) — Klinik açıdan önemli bütün Semont ve ev hatası isteklerim doğru uygulandı. Kalanlar
klinisyen arayüzüyle ilgili: kısa seste yön söylenmemesi ve göstergenin ekranda görünmemesi. Bunları da sesi "açık"a
alarak aşabiliyorum.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Evet.** Klinikte Epley/Semont yönlendirmesi için kullanırım
(sesi "açık"ta tutarak), evde Epley ve Semont reçete ederim. Hastaya, hekim tanısı ve QR reçetesiyle önerebilirim.

Betikler, ekran görüntüleri ve ses kayıtları: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-3/k10-fizyoterapist/`
