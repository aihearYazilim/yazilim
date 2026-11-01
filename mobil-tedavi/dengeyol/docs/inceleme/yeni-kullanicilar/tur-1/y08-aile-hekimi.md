# y08 — Dr. Gül, 45, ilçe aile hekimi (tur 1)

**Ben kimim:** İlçede aile hekimiyim. BPPV'yi bilirim, Dix-Hallpike'ı yılda birkaç kez yaparım. VNG'm yok, nistagmusu çıplak gözle zor görürüm.
**Ne yapmaya çalıştım:** DengeYol'u klinisyen modunda ilk kez, yardım almadan açtım. Akış: muayene → sağ/sol Dix-Hallpike → tanı → Epley → QR ile ev reçetesi → hastanın ev raporunu kontrolde almak.
Ayrıca 2 yan vaka denedim: "nistagmus göremedim ama hasta döndü dedi" ve "yatakta dönünce" (supine roll).
iPhone 13 öykünümü, Demo modu (sanal sensör), sahte ses motoru ile söylenenlerin zaman kaydı. Sağ DH ×1 hızda, sonrakiler ×5/×20 hızda.
Betik, görüntü ve kayıtlar: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/yeni-kullanicilar/tur-1/y08-aile-hekimi/`
(`screens.log`, `actions.log`, `speech.log`, 160 PNG).

## Akış günlüğü (⚠ = duraksadım, ✗ = ne yapacağımı bilemedim)
1. **İlk ekran:** "Klinisyenim (odyolog / hekim)" seçeneği net, 1 dokunuş. Aynı ekranda "DengeYol tanı koymaz" yazıyor, ama klinisyen modu tanı önerisi veriyor. Küçük bir çelişki.
2. **Profil** (ad, kurum, gözlem yöntemi "Çıplak göz", ses "Kısa"): 5 dokunuş, ~40 s. Anlaşılır.
   Profilde gözlem yöntemi sormak iyi fikir, ama aşağıdaki formlar çıplak göze göre uyarlanmıyor.
3. **Yeni muayene** (kod, doğum yılı, cinsiyet): 4 dokunuş. Kişisel veriyi azaltma notu iyi.
4. **Muayene ekranı:** sekmeler (Testler / Tanı / Tedavi / Reçete / Rapor) işin sırasını gösteriyor.
   ⚠ Öykü ve güvenlik kontrolü bölümü yok: spontan nistagmus, nörolojik bulgu, boyun sorunu sorulmuyor. Sadece test kartının dibinde tek satır var.
   ⚠ "kalibre değil" çipinin ne olduğunu ilk anda anlamadım.
5. **Kalibrasyon** (~25 s): üç adım ve resim anlaşılır. ⚠ "Cihazın yön kuralı ölçülür" ifadesi bana bir şey anlatmadı.
   ✗ Bir de şunu bilemedim: Dix-Hallpike'ta iki elim hastanın başında, telefon nasıl alında kalacak, ben nasıl "ekrana dokunacağım"? Bant mı kullanacağım, yardımcı mı tutacak? Yazmıyor.
6. **Sağ DH** (×1 hızda 102 s): yeşil gösterge, "Pozisyon doğru", 30/15/5 sn kaldı sesleri çok iyi.
   Baş dönüş ve sarkma açısını sayıyla görmek bana güven verdi. Hızlı yatırma sırasında ekrana bakamam, ama ses yetiyor.
   ⚠ Düğme "Nistagmus / belirti BAŞLADI" diyor. Nistagmusu görmeden, hasta "dönüyor" deyince de basmalı mıyım? Belirsiz.
   ⚠ Ses/ekran: 1. ve 3. adım "Oturuş". Hasta zaten oturduğu için konum hemen doğru sayılıyor ve "Oturuş, baş hastanın sağına 45°" cümlesi 0,3 s içinde "Pozisyon doğru" ile kesiliyor (`speech.log` 228,8→229,1 s; 304,2→304,4 s).
   Yani "başı sağa 45° çevir" komutunu duymadan geçiyorum.
7. **Bulgu formu:** gecikme ve süre işaretlerimden kendiliğinden doldu, çok iyi.
   "Yukarı vuran + torsiyonel" seçeneğini ders kitabından tanıdım. Seçince çıkan torsiyon sorusunun altındaki açıklama ("üst kutup alttaki kulağa vurur") işe yarar.
   ✗ Yine de çıplak gözle torsiyon yönünü bilemedim, "Belirlenmedi"de bıraktım.
   ⚠ İşaret koyduğum hâlde "Hasta baş dönmesi bildirdi" kutusu boş geliyor.
   ⚠ Sabit "Kaydet" çubuğu listenin son seçeneğini ("Diğer / atipik") ve "Gecikme/Süre" başlıklarını örtüyor.
8. **Sayfa yenilenince** (iOS sekmeyi kapatırsa olacağı gibi) ölçülen DH ve bulgu formu kayboldu. Testi baştan yaptım; kalibrasyon da sıfırlandı.
9. **Sol DH** (kalibrasyon bu kez sorulmadı, iyi): bulgu "Yok", 2 dokunuş.
   ✗ Sonra ekranda "Sıradaki: Sırtüstü baş çevirme (supine roll)" çıktı. Sağ DH tipik pozitifken roll da şart mı, yoksa Tanı'ya mı geçeyim? Bilemedim, Tanı'ya geçtim.
10. **Tanı:** "Sağ arka kanal BPPV (kanalolitiazis) · tipik", gerekçesiyle birlikte. "Bu öneri neye dayanır" bölümündeki sevk ölçütleri tam bana göre.
    ⚠ Onayladıktan sonra "Bu tanıyı onayla" düğmesi hâlâ duruyor. Onaylandı mı diye bir an tereddüt ettim.
11. **Tedavi:** Epley "önerilen" etiketli, tek dokunuşla başladı. 5 adım, her biri 30 s; bitince "Yapılan manevralar" listesine düştü. Kolay.
12. **Reçete:** varsayılan Epley, günde 3, 3 gün. Ben 5 güne çıkardım ve not ekledim; QR hemen çıktı.
    ⚠ Ekranda iki ayrı süre var: "5 gün" ve "Geçerlilik 14 gün". "Testsiz kısa yol yalnız muayene edilen baş dönmesi sürerken…" cümlesini iki kez okudum, hastaya anlatamam.
    ⚠ Varsayılan dozun neden 3×3 olduğu yazmıyor.
13. **Hasta tarafı** (QR'ı hastaya okutmuş gibi):
    ✗ Reçete ekranında "iPhone'da önce ana ekrana ekleyin… Safari'de kabul edilen reçeteyi ana ekrandaki uygulama görmez" uyarısı var.
    Poliklinikte 5 dakikam var. Yaşlı hastaya bunu ben mi yaptıracağım? Akışta en zor yer bu.
14. **Hasta raporu:** hastanın "Hekime gönder" QR'ı ve ev raporu açık. Ben bağlantıyı yapıştırıp açtım.
    Hasta kodu ve reçete kodu otomatik eşleşti, doğru muayene seçili geldi. Rapor 1 dokunuşla muayeneye eklendi.
    ✗ Raporda "tekrar testi yapılmadı" ve "manevrada baş dönmesi 27 s" yazıyor. Ama "şimdi ne yapmalıyım" diye bir öneri yok: DH'yi tekrarla mı, 2–3 manevraya yanıtsızsa sevk mi?
    ⚠ Ayrıca rapor, varsayılan olarak yeni bir kontrol muayenesine değil, 1. muayeneye ekleniyor. Böylece eski muayenenin basılı raporu değişiyor.
15. **Yan vaka A** (nistagmus yok, baş dönmesi var): "Nistagmussuz pozisyonel vertigo (subjektif BPPV olasılığı) · belirsiz" çıktı.
    Reçetede "Değerlendirdim, uygundur" onay kutusu var. Mantıklı ve bana göre.
    ⚠ Ama metinde İngilizce terimler var ("probable BPPV, spontaneously resolved", "possible BPPV") ve "kategoriyi öyküyle siz belirleyin" deniyor. Bu, uygulamanın kendi "cesur karar" ilkesiyle çelişiyor.
16. **Yan vaka B** (supine roll):
    ⚠ Giriş ekranında "Hasta modunda nistagmus gözlenemez…" diye bir hasta modu notu var.
    ⚠ Sağ formda "Kaydet" gri kaldı, nedenini yazmıyor. Sonradan "Şiddet (zorunlu)" alanını fark ettim. Şiddet nistagmusun mu, hastanın baş dönmesinin mi? Çıplak gözle hangisini puanlayacağım?
    Tanı doğru geldi: sağ geotropik yatay kanal → BBQ roll.
    ✗ Reçete sekmesinde ise "Ev reçetesi yalnızca arka kanal BPPV için verilebilir" yazıyor, devam düğmesi yok. Hasta modu evde BBQ roll yaptırıyorken ben reçete yazamıyorum. Hem kilit hem çelişki.
17. **Elle tanı:** "Kanalolitiazis / Kupulolitiazis / Bilinmiyor" seçeneklerinin hiçbir açıklaması yok. Uzman değilsem "Bilinmiyor"a basarım.
18. **Hata denemeleri:** test sırasında tarayıcı geri tuşu → yürütücü "Duraklatıldı", Devam / Sonlandır seçenekleriyle. Ses sustu, iyi.
    "Bu tanıyı onayla"ya çift dokunuş sorun çıkarmadı. Konsol hatası: 0.

**Ölçümler** (ilk açılış → Epley başlaması, tek oturum, ×1 hız tahmini): ~30 dokunuş, ~6–7 dk.
Dağılım: profil 1 dk; kalibrasyon 25 s; her DH ~100 s ve form ~20 s; tanı okuma ~40 s. Epley ×1 hızda ~2,5–3 dk.
Reçete + QR: 3 dokunuş. Ev raporunu eklemek: 3 dokunuş.
Duraksama (⚠): 14. Ne yapacağımı bilemediğim an (✗): 7 (kalibrasyonda telefonu tutmak, torsiyon yönü, roll gerekli mi, iPhone ana ekran, rapordan sonra ne yapmalı, yatay kanal reçetesi, elle tanı terimleri).
Ses: yalnız "Kısa" kipte bir DH için ~12 kısa cümle; okunacak metin ekran başına 2–6 satır. Uzman olmayan biri için yük makul.

## Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Yüksek | Reçete (yatay kanal tanısı) | "Yalnızca arka kanal" kilidi var, devam düğmesi yok. Hasta modu evde BBQ roll yaptırıyor | Ya BBQ roll/Gufoni reçetesi olsun ya da "Yine de reçete yaz" + gerekçe (RX_ kaydı) | Evet, ekran 162 |
| 2 | Yüksek | Hasta QR'ı (iPhone) | Safari'de kabul edilen reçete ana ekran uygulamasında görünmüyor; kısa poliklinikte hekim bunu anlatamaz | Hekim ekranında "Hastaya söyleyin: önce Ana Ekrana Ekle, sonra QR'ı uygulamada okut" kartı, ya da reçeteyi ana ekrandan açılınca tekrar yapıştırmadan alan bir yol | Evet, ekran 82/84 |
| 3 | Yüksek | Ev raporu → muayene | Rapor var ama yorum yok. Ayrıca varsayılan olarak eski muayeneye ekleniyor | Üstte tek cümle öneri: ör. "Tekrar test yok, manevrada baş dönmesi sürüyor → DH'yi tekrarlayın; 2–3 doğru manevraya yanıtsızsa sevk". Varsayılan: "Yeni kontrol muayenesi aç" | Evet |
| 4 | Orta | Bulgu formu (çıplak göz) | Torsiyon yönü ve nistagmus tipi uzman olmayana zor, yardım yok | Her seçeneğin yanında küçük şema/animasyon ya da tek satır "nasıl görünür". Profilde "Çıplak göz" seçiliyse "Emin değilim, baş dönmesi var" seçeneği öne gelsin | Evet |
| 5 | Orta | Yürütücü, adım 1/3 "Oturuş" | Hasta zaten oturduğu için komut cümlesi 0,3 s'de "Pozisyon doğru" ile kesiliyor; "baş sağa 45°" duyulmuyor | Komut cümlesi bitmeden "Pozisyon doğru" denmesin; otururken baş çevirme doğrulanamadığı için 2–3 s bekleme sayılsın | Kısmen (demo sensörü anında konum veriyor; gerçekte de hasta baştan oturuyor) |
| 6 | Orta | Testler, "Sıradaki" | Tipik pozitif sağ DH'den sonra da "Sıradaki: supine roll" çıkıyor | Tipik arka kanal bulgusunda "Sıradaki: Tanı" gelsin, roll "isteğe bağlı" yazsın | Evet |
| 7 | Orta | Sayfa yenilenmesi | Ölçülen test, bulgu kaydedilmeden yenilenirse kayboluyor; kalibrasyon da sıfırlanıyor | Bitmiş testin ölçümü taslak olarak saklansın, form yeniden açılsın | Evet |
| 8 | Orta | Roll formu | Kaydet gri, nedeni yazmıyor; "Şiddet"in neyi puanladığı belirsiz | Gri düğmenin altında "Şiddet seçin" yazsın; tanım: "baş dönmesi ya da nistagmus, iki yanı karşılaştırın" | Evet |
| 9 | Orta | Muayene başı | Güvenlik kontrolü yok (spontan nistagmus, nörolojik bulgu, boyun) | 3 maddelik "Teste başlamadan" kontrol listesi; işaretlenen madde rapora ve uyarıya yazılsın | Evet |
| 10 | Orta | Kalibrasyon / test girişi | Telefonun alında nasıl duracağı ve iki eli meşgul hekimin nasıl işaret koyacağı yazmıyor | "Bant/bandaj ya da yardımcı" önerisi; işareti sesle ya da ikinci kişinin dokunuşuyla koyma seçeneği | Hayır (gerçek sensörle denenmedi) |
| 11 | Düşük | Reçete metni | "5 gün" ile "14 gün geçerlilik" yan yana; "testsiz kısa yol" cümlesi anlaşılmıyor | "5 gün boyunca, günde en çok 3 kez. Reçete 14 Kasım'a dek geçerli." Kısa yol açıklaması katlanır bölüme | Evet |
| 12 | Düşük | Elle tanı | Kanalolitiazis/kupulolitiazis açıklamasız | Altına tek satır: "<1 dk sönen → kanalolitiazis; ≥1 dk süren → kupulolitiazis" | Evet |
| 13 | Düşük | Tanı, onay sonrası | "Bu tanıyı onayla" düğmesi ikinci kez görünüyor | Onaydan sonra düğme "Onaylandı ✓" olsun | Evet |
| 14 | Düşük | Formun sabit çubuğu | "Kaydet" çubuğu son seçeneği ve alan başlıklarını örtüyor | Alta boşluk eklensin ya da çubuk saydam olsun | Evet, ekran 29/144 |
| 15 | Düşük | Metin | Klinisyen roll girişinde "Hasta modunda…" notu var; DH girişinde "hekim gözetiminde" yazıyor (hekim benim); raporda "doz sınırları uygulanır" deniyor (artık kilit yok) | Klinisyene özel metin | Evet |
| 16 | Düşük | Tanı (subjektif BPPV) | İngilizce kategori adları, "siz belirleyin" ifadesi | Türkçe ve tek önerili: "Belirti tarafına deneme manevrası öneriyorum" | Evet |

## Puanlar
- **Sezgisellik: 7/10.** Sekmeler, sesli sayaç, kendiliğinden dolan gecikme/süre ve tanı önerisi beni adım adım götürdü. Puan şu yüzden düştü: çıplak gözle doldurulamayan terimler, "sırada ne var" önerisinin yanlış yöne çekmesi ve rapor ile reçetedeki iki çıkmaz.
- **Genel memnuniyet: 7/10.** Arka kanal BPPV'de muayene → Epley → QR reçete → ev raporu zinciri gerçekten çalışıyor; bunu bir ASM'de yapabilmek değerli. Yatay kanalda ise reçete kilidiyle yarı yolda kaldım.
- **Önerir miyim / kullanır mıyım:** Arka kanal şüphesinde kullanırım ve meslektaşlarıma öneririm. Ama önce iPhone hastalar için "ana ekrana ekle" adımı, kontrol vizitinde bir "ne yapmalı" önerisi ve çıplak göz için yardım gelmeli.

**En önemli 3 isteğim**
1. Yatay kanal tanısında da ev reçetesi (BBQ roll/Gufoni) ya da en azından "Yine de reçete yaz" (sorun 1).
2. Çıplak gözle muayene eden uzman olmayan hekim için bulgu formunda kısa "nasıl görünür" yardımı ve "Emin değilim, baş dönmesi var" seçeneği. Tipik arka kanal bulgusundan sonra "Sıradaki: Tanı" gelsin (sorun 4, 6).
3. Ev raporu açılınca tek cümlelik klinik öneri ve varsayılan "yeni kontrol muayenesi". Hekim ekranında hastaya iPhone için "önce Ana Ekrana Ekle" talimatı (sorun 2, 3).
