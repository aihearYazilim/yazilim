# Tur 4 (son) — k10 Fizyoterapist (Burak, 39, vestibüler rehabilitasyon)

## 1. Ben kimim, ne yapmaya çalıştım
Hekimden yönlendirmeli BPPV hastalarına klinikte manevra yapan, evde Epley/Semont veren fizyoterapistim. 3. turdaki
isteklerimi (`tur-3/00-SENTEZ.md`) kendi gözümle kontrol ettim. Aynı sınır denemelerini yeniden yaptım: 30°/58° dönüş,
10/13/14/15° sarkma, yavaş, yuvarlanarak ve doğru-hızlı Semont, gövdesini döndürmeyen hasta. Hasta Semont'unu gerçek
hızda (×1) yaptım; hasta "Şimdi!" komutundan önce hareket etti. Bu tur ilk kez baştan sona tam döngüyü denedim:
reçete → hastanın evdeki raporu → QR bağlantısıyla aynı hasta koduna "ev dönemi" olarak eklenmesi → HBYS notu.
Sunucu: `http://localhost:4181/`, iPhone 13 öykünümü, demo sensör, ses kaydı.

## 2. Yaşadıklarım (kısa günlük)
- **Klinik DH / Epley ("Ses: kısa", varsayılan):** Kısa seste yön artık söyleniyor: "Hastanın sağına.", "Daha sarkık.",
  "Pozisyon bozuldu. Hastanın soluna.". θ −95° ve −60°'ta "Gövdeyi soluna.", −175°'te "Hastanın sağına.". İki elim
  hastanın başındayken ekrana bakmam gerekmiyor. Sınırlar tutarlı: 15°'de giriş, 13°'te tutma, 10°'de bozulma.
- **Üst çubuk:** Ses düğmesi simgeye inmiş (K rozeti), başlık iki satır ("Epley · sağ — Adım 4/5"). Tutma sırasında
  baş göstergesi, sayaç ve sarkma çubuğu tam görünüyor. Düzeltme sırasında afiş ve sayı kartı göstergeyi yine aşağı
  itiyor; ama sesli yön ve sayı kartı bu anda yetiyor.
- **Klinik Semont:** "Geçiş 6 saniye, yavaş." ve "Oturuştan geçilmedi." sesli. Doğru-hızlı Semont'ta yanlış alarm yok.
- **Klinik rapor tablosu:** Adım hücresinde "hedef sınırında" (Epley 2. adım, φ ort. 14°) ve "oturuştan geçilmedi"
  etiketleri var; "erken bitirildi" ve "kısaltılmış" yerinde. HBYS notu kısa ve aynı işaretleri taşıyor.
- **Hasta Semont (×1):** Hasta "Kıpırdamayın…" yönergesi sürerken yattı. Tek, kesilmeyen bir cümle geldi: "Zaten
  yattınız; sayımı bırakıyoruz. Geçiş 4 saniye sürdü; bir dahaki sefere 'şimdi'yi bekleyip tek hamlede geçin. Böyle
  kalın, kıpırdamayın." Hasta raporunda: "yavaş geçiş 4.1 s · komuttan önce hareket edildi".
- **Ev raporu → klinik:** Hasta raporunun sonunda "Hekiminize QR kodla gösterin" kartı var ("internet gerekmez", 345
  karakterlik bağlantı). Klinisyen telefonunda açınca reçete kodu "bu hastaya 31 Ekim muayenesinde verdiğiniz reçete"
  olarak eşleşti. Hasta kodu ve muayene önceden seçili geldi. "Ev dönemi olarak ekle" ile muayeneye eklendi; HBYS
  notunda tek satır: "Ev dönemi … 1 atak · 1 manevra · adım işaretleri: yavaş geçiş 4.1 s, komuttan önce hareket".
  Üç turdur istediğim kontrol muayenesi akışı bu. **Ama** ev raporundaki adım başlıklarında doldurulmamış şablon
  belirteçleri görünüyor: "Oturuş, baş **{Hya}** 45°", "**{A}** yan, burun yukarı", "**{H}** yan, burun yere (tek hızlı
  hareket)". Hem içe aktarma ekranında hem muayene raporunda böyle.
- **Sonrası:** Dinlenme gerekçesi, düşme önlemi ve 10 dk sayaç var; Brandt-Daroff ya da kısıtlama önerilmiyor.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | — | 3. kullanımdaki isteğim N1 (kısa seste 2–3 kelimelik yön) | **Karşılandı.** "Hastanın sağına.", "Daha sarkık.", "Gövdeyi soluna." | — | Evet (ses kaydı) |
| 2 | — | İsteğim N2 (klinisyen üst çubuğu, baş göstergesi) | **Büyük ölçüde karşılandı.** Başlık 2 satır, ses düğmesi simge; tutmada gösterge tam görünüyor. Düzeltme sırasında afiş ve sayı kartı göstergeyi aşağı itiyor (sesle telafi ediliyor). | İsteğe bağlı: düzeltme sırasında göstergeyi küçük hâlde afişin yanına almak. | Evet (ekran) |
| 3 | — | İsteğim C/#3 (rapor tablosunda etiketler) | **Karşılandı.** "hedef sınırında", "oturuştan geçilmedi" tabloda; "komuttan önce hareket" hasta/ev raporunda ve HBYS'de. | — | Evet |
| 4 | — | İsteğim N3 ("Zaten yattınız" + yavaş geçiş tek cümle) | **Karşılandı.** Kesilme yok, tek cümle. | — | Evet (×1) |
| 5 | — | 1.–3. turdan kalan: ev kaydını kliniğe aktarma | **Karşılandı.** Ağsız QR/bağlantı, reçete kodu eşleşmesi, ev dönemi satırı, ikinci kez eklenmez. Başlık hatası için #N1. | — | Evet (uçtan uca) |
| 6 | — | 1.–3. turdan kalan: "kısıtlama/boyunluk gerekmez" cümlesi | **Karşılanmadı.** Yanlış öneri de yok. | Bitiş ekranına tek cümle: "Uyku pozisyonu kısıtlaması ya da boyunluk gerekmez." | Evet (kod araması) |
| N1 | Orta | Ev raporu içe aktarma ve muayene raporundaki ev dönemi; `core/reportShare.ts:145` ve `:535` | Adım başlıkları ham şablon: "{Hya} 45°", "{A} yan", "{H} yan". `PROTOCOLS[id].steps[i].title` taraf doldurulmadan kullanılıyor. Klinik kayıtta anlamsız ve özensiz görünüyor (taraf manevra satırında doğru yazılı). | `resolveProtocol(protocolId, side).steps[i].title` kullanılsın ("Oturuş, baş sola 45°", "Sağ yan, burun yukarı"). Birim testinde başlıkta `{` olmadığı denetlensin. | Evet (ekran + kod) |
| N2 | Düşük | Klinik kısa ses, düzeltme | "Daha sarkık." ve "Hastanın soluna." hedefe gelene dek her ipucu aralığında yineleniyor (×5'te saniyede bir). ×1'de 5 s'de bir; kabul edilebilir. | Aynı ipucu art arda üçüncüde seyrekleşsin (ör. 10 s). | Kısmen (×5) |

## 4. Sevdiklerim
- Klinikte "kısa" ses tam ihtiyacım olan şey: adım başlığı, 2–3 kelimelik yön, "Pozisyon doğru", geçiş uyarısı. Elim
  hastadayken ekrana bakmadan Epley/Semont yaptırabiliyorum.
- Evde Semont'un üç ana hatası (yavaş, yuvarlanma, komuttan önce) sesle düzeltiliyor, kaydediliyor ve kontrol
  muayenesinde QR ile önüme geliyor.
- Raporlar takipte işe yarıyor: φ, geçiş, nistagmus, erken bitirme, sınırda tutma etiketleri ve kısa HBYS notu.

## 5. Memnuniyet
**9/10** (1. tur 7, 2. tur 8, 3. tur 9). Bütün klinik isteklerim karşılandı ve ev → klinik döngüsü kapandı. Ev raporu
başlıklarındaki şablon hatası (#N1) düzelirse 10 veririm.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Koşullu (Evet'e çok yakın).**
- **Klinikte** Epley ve Semont yönlendirmesi ile ölçümü için bugün kullanırım.
- **Evde** Epley ve Semont reçete ederim; yakınıma da hekim tanısı ve QR reçetesiyle öneririm.
- **Koşul:** Ev raporunu hasta dosyasına eklemeden önce adım başlıklarındaki "{A}/{H}/{Hya}" hatası düzeltilmeli.
  Gerçek telefonlarda (alında, farklı modellerde) açı doğruluğu küçük bir pilotla bir kez doğrulanmalı. Demo sensörle
  sınırlar tutarlı, ama gerçek cihazda ölçmedim.

Betikler, ekran görüntüleri ve ses kayıtları: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-4/k10-fizyoterapist/`
