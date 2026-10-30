# Tur 1 — k10 Fizyoterapist (Burak, 39, vestibüler rehabilitasyon)

## 1. Ben kimim, ne yapmaya çalıştım
Özel klinikte vestibüler rehabilitasyon yapan fizyoterapistim; hastaları hekimden yönlendirmeli alıyorum. Klinikte
manevrayı yapıyor, evde Epley/Semont veriyorum; hastalar evde baş açısını, sarkmayı ve Semont hızını sık sık tutturamıyor.
iPhone 13 öykünümü + demo sensörle, hem klinisyen modunu (DH → tanı → Epley/Semont → rapor/reçete) hem de verdiğim
Semont reçetesiyle hastanın evdeki akışını (gerçek hız, ×1) ve deneme Epley'de tipik ev hatalarını (×5) denedim.

## 2. Yaşadıklarım (kısa günlük)
- **Kurulum/muayene:** Ad-kurum, hasta kodu FZT-0412, "Sağ DH → Telefonla yap", ~20 s kalibrasyon. Sorunsuz ve hızlı.
- **DH sınır denemeleri:** 30° dönüş → reddetti, büyük okla "Başı HASTANIN SAĞINA biraz daha çevirin" (⟲ ile çevirince ok
  doğru tarafa geçti; başucundan bakınca yön doğru). 10° sarkma → "Ekstansiyonu artırın". **15° sarkma → kabul** (alt sınır).
  58° dönüş → "HASTANIN SOLUNA". Tam 15°'de kalınca ses "Pozisyon bozuldu… / Pozisyon düzeldi" diye gidip geldi.
- **Nistagmus işareti:** Ekrana dokunmak pratik; işaretten sonra üstte "Gözlemi bitir → sonraki adım" çıktı. Bulgu formu
  nistagmus tipini seçtiriyor (iyi). Tanı önerisi "Gecikme >20 s (tipik değil)" notunu doğru koydu.
- **Klinik Epley:** 2. adımda yalnız 30° → "Başı HASTANIN SOLUNA…"; ekstansiyon kaybı (φ 0) → doğru uyarı. 3. adımda
  hastayı **gövdesini döndürmeden** yalnız başını çevirmiş gibi koydum (θ −95°): uyarı yine "Başı sola çevirin" oldu.
- **Klinik Semont:** Yavaş geçişte (6,5 s) ekranda "Geçiş 6.5 saniye sürdü (hedef 2 sn altı)" çıktı — güzel. Ama oturuştan
  geçmeden sırtüstü yuvarlanarak 1,5 s'de karşı tarafa geçtim, "hızlı Semont" olarak sorunsuz kabul edildi. Sırtüstü + baş
  sağa 45° pozisyonu 1. adım ("Sağ yan, burun yukarı") olarak kabul edildi (yerçekimine göre aynı vektör; anlaşılır).
- **Rapor:** Adım başına süre, %hedefte, θ sapması var. **Sarkma (φ), Semont geçiş süresi, manevra içi nistagmus işaretleri
  yok.** Adımları "Adımı bitir" ile 0–1 s'de geçtiğim Semont da "tamamlandı" yazıyor; HBYS notunda da öyle.
- **Reçete → hasta:** QR bağlantısı sorunsuz açıldı, notum kartta görünüyor. Ana ekranda reçete özeti var.
- **Hasta evde Semont (×1, ses kaydıyla):** Hazırlık ekranı Epley/DH için: "yastık omuz altında, baş geriye sarkar"
  resmi ve maddesi; Semont'un "yatağın uzun kenarı, bacaklar aşağı, iki yanda yer" hazırlığı ancak telefon alındayken sesle
  geliyor. 1. adımda baş fazla tavana dönükken (θ 25°) ekranda ok hemen çıktı ama **sesli düzeltme ~20 s gelmedi**
  (yönerge ~15 s + 7 s bekleme); hasta ekranı göremiyor. 1→2 geçişinde "Bu adım tamam" + 3 bip, sonra 13 s'lik yönerge
  "Şimdi tek, hızlı…" ile başlıyor; hasta harekete geçerken cümle hâlâ sürüyor. **4,1 s'lik yavaş geçişi uygulama hastaya
  hiç söylemedi** (yalnız ekranda), ardından "Tamam, böyle kalın" dedi; hasta raporunda da geçiş süresi yok.
- **Ev Epley hataları (deneme):** Sarkmama → "Başınızı biraz daha geriye bırakın" (yastık yanlış yerdeyse hasta bunu
  yapamaz). 3. adımda gövde dönmeyince sesle "Başınızı biraz daha sola çevirin" → evde boyun zorlanır. Son oturuşta başı
  geriye atınca "Çenenizi biraz göğsünüze doğru indirin" — doğru.
- **Sonrası:** "Şu an nasılsınız?" → "10 dk oturarak dinlenin; kalkarken dikkatli olun; 1 saat sonra tekrar testi"
  (+ takvim hatırlatıcısı). **Brandt-Daroff yok, uyku/baş pozisyonu kısıtlaması yok, boyunluk yok** — kılavuzla uyumlu.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Yüksek | Hasta Semont 2. adım; `core/runner.ts:611-613` | Yavaş geçiş (4,1 s) yalnız `notice` olarak ekranda; hastaya söylenmedi, "Tamam, böyle kalın" dendi. Hasta raporunda da yok. Evde Semont'un ana hata noktası bu. | Hasta modunda sesli geri bildirim ("Geçiş yavaştı; bir dahaki sefere tek hamlede") + hasta raporuna "geçiş X s" sütunu; tekrar eden yavaş geçişte Epley'e geçmeyi/klinisyene danışmayı öner. | Evet (×1 ses kaydı) |
| 2 | Yüksek | Epley 3. adım / Semont 2. adım; `core/evaluator.ts:117` | θ −95°'te (gövde dönmemiş) ses "Başınızı biraz daha sola çevirin" diyor; tek başına boyunla −135°'e varılamaz, yaşlı hasta boynunu zorlar. | |θ| 60–110° iken hedef ±135° ise ayrı ipucu: "Bütün vücudunuzla yanınıza dönün, sonra burnunuzu yere çevirin" (klinisyende "Gövdeyi yana çevirin"). | Evet (klinik + hasta) |
| 3 | Yüksek | Klinisyen raporu; `ui/screens/clinician/Exam.tsx:892-913`, `:123` | Rapor yalnız θ sapması gösteriyor: sarkma (φ ort./en az), Semont geçiş süresi, manevra içi nistagmus işaretleri yok. "Adımı bitir" ile 0–1 s'de geçilen adımlar olsa da manevra "tamamlandı"; HBYS notu da öyle. | Tabloya φ sütunu, geçiş süresi, belirti/nistagmus (hasta raporundaki "Belirti" sütunu gibi), "erken bitirildi (X/Y s)" işareti; notta "kısaltılmış" yazsın. | Evet |
| 4 | Orta | Hasta modu ilk ipucu; `core/runner.ts:57, 620` | Yanlış pozisyonda ilk sesli düzeltme yönerge bitiminden 7 s sonra geliyor (×1'de ~20 s); ekran oku hemen çıkıyor ama hasta göremiyor. Nistagmusun en yoğun olduğu ilk saniyeler kaçıyor. | Hasta modunda yönerge bittikten 2–3 s sonra ilk ipucu; yönerge çok uzunsa hedefe yakınlık tonu (guidanceTone) varsayılan açık. | Evet (×1) |
| 5 | Orta | Semont hazırlık ekranı; `ui/screens/patient/EpisodeFlow.tsx:1298` | Semont reçetesinde de "yastık omuz altında, baş geriye sarkar" resmi/maddesi; Semont'un oturuş yeri telefon alındayken söyleniyor. | Manevraya göre hazırlık: Semont'ta "yatağın uzun kenarının ortası, bacaklar aşağı, iki yanda yer; yastık gerekmez" + uygun çizim. | Evet |
| 6 | Orta | Semont 1→2 geçişi | "Bu adım tamam" + bip, sonra 13 s'lik yönerge "Şimdi…" ile başlıyor; hareket anı ile yönergenin bitişi çakışıyor, "başınızın yönünü değiştirmeyin" uyarısı hareketten sonra geliyor. | Geçiş yönergesini 1. adımın son ~15 s'sinde önceden anlat; sonra net "3, 2, 1 — ŞİMDİ!" komutu ve ölçüm o andan başlasın. | Evet (ses kaydı) |
| 7 | Orta | Semont geçiş yolu | Oturuştan geçmeden sırtüstü yuvarlanma (θ 50→0→−135) 1,5 s'lik geçerli Semont sayıldı. | Geçişte baş dikliği (tiltFromUpright) en az ~30°'ye inmediyse "oturuştan geçmediniz" uyarısı ve kayıtta işaret. | Evet (klinik) |
| 8 | Orta | Sarkma sınırı; `core/protocols.ts:98` + tutma | 15° kabul ediliyor (kılavuz 20–30°); tam sınırda gürültüyle "bozuldu/düzeldi" sesleri tekrar ediyor. | Tutma sırasında histerezis (±3°); 15–20° arası sayaç sürsün ama bir kez "biraz daha geriye" denilsin, raporda "sınırda sarkma" görülsün. | Evet (klinik ses kaydı) |
| 9 | Orta | Hasta "geriye bırakın" ipucu | Sarkmama çoğu zaman yastığın yanlış yerde olmasından; hasta başını "bırakamaz". | φ < 5° sürerse: "Yastık başınızın altında olabilir; biraz yukarı kayın, yastık omuzlarınızın altına gelsin." | Kısmen (ses kaydı; neden çıkarımı benim) |
| 10 | Düşük | Klinisyen sesi/sayı kartı; `evaluator.ts:125-135` | Afiş "Başı HASTANIN SAĞINA" derken ses ve sayı kartı "Başı sağa çevirin" diyor (başucunda kimin sağı belirsiz). | Klinisyen metinlerinde de "hastanın sağına/soluna". | Evet |
| 11 | Düşük | Klinisyen yürütücü düzeni (iPhone 13) | Baş göstergesi büyük ölçüde "Nistagmus BAŞLADI" alanının altında kalıyor; iki elim hastanın başındayken kaydıramam. Ekranı çevirmek için ⟲'ye dokunmam gerekiyor. | Klinisyende göstergeyi küçültüp sabitle; "hasta yatınca ekranı başucuna göre otomatik çevir" seçeneği. | Evet (ekran görüntüsü) |
| 12 | Düşük | Evden kliniğe veri | "Hekime gönder" tablonun düz metnini paylaşıyor; klinik modunda o hasta koduna eklenemiyor. | Hasta raporuna küçük bir QR/kod; klinisyen modunda "ev kaydını içe aktar" (ağsız). | Evet (kod incelemesi) |
| 13 | Düşük | Manevra sonrası öneriler | Kısıtlama/Brandt-Daroff önermemesi doğru; ama hastalar internetten "2 gece dik yat, boyunluk" duymuş geliyor. | Bitiş ekranına tek cümle: "Uyku pozisyonu kısıtlaması ya da boyunluk gerekmez." | Evet |

## 4. Sevdiklerim
- Sensör güdümü gerçekten işe yarıyor: 30° dönüşü ve 10° sarkmayı yakaladı; afişteki "HASTANIN SAĞI/SOLU" + ok, ⟲ ile
  başucundan bakınca da doğru. Ölçümün yerçekimine göre yapılması (kanal için önemli olan bu) doğru seçim.
- Manevra sonrası öneriler kanıta dayalı: Brandt-Daroff ve gereksiz kısıtlama yok; 1 saat + ertesi sabah tekrar testi var.
- Reçete akışı (onaylı tanıdan taraf, doz/gün sınırı, QR, 14 gün geçerlilik, "muayeneden beri geçmedi mi?") sağlam.

## 5. Memnuniyet
**7/10** — Klinikte açı göstergesi ve sapma uyarıları hemen kullanılabilir, ama evde Semont'un en önemli hatası (yavaş/yanlış
yoldan geçiş) hastaya söylenmiyor, gövdesini döndürmeyen hastaya boyun ipucu veriliyor ve rapor sarkma/geçiş/nistagmus
verisini saklamıyor. Klinikte Epley için kullanırım; Semont'u evde, bu geri bildirimler eklenmeden reçete etmem.

Betikler ve ekran görüntüleri: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-1/k10-fizyoterapist/`
