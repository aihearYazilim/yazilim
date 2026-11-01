# y08 — Dr. Gül, 45, ilçe aile hekimi (tur 2)

**Ben kimim:** İlçede aile hekimiyim. BPPV'yi bilirim, Dix-Hallpike'ı yılda birkaç kez yaparım. VNG'm yok, nistagmusu çıplak gözle görmekte zorlanırım.
**Ne yaptım:** Yeni sürümü sıfırdan, temiz telefonla baştan sona kullandım. 1. kullanımdaki isteklerimi kendi gözümle kontrol ettim (tur-1 `00-SENTEZ.md`, L1#3, L3#8, L4#1–5).
Vakalar:
- **AY-1958:** sağ arka kanal. Akış: DH → Epley → QR reçete.
- **HD-1980:** yatakta dönünce gelen baş dönmesi. Akış: supine roll → BBQ roll reçetesi → hastanın evde BBQ roll'u → kontrolde ev raporu.
- **MK-1971:** "nistagmus göremedim, hasta döndü dedi".

iPhone 13 öykünümü, Demo modu, sahte ses motoruyla söylenenlerin zaman kaydı. Sağ DH normal hızda, kalanı ×5/×20 hızda.
Betik, görüntü ve kayıtlar: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/yeni-kullanicilar/tur-2/y08-aile-hekimi/`
(`screens.log`, `actions.log`, `speech.log`, 132 PNG).

## 1. kullanımdaki isteklerim
| İstek (tur 1) | Sonuç | Gördüğüm |
|---|---|---|
| Yatay kanal tanısında ev reçetesi (BBQ roll) | **karşılandı** | Reçete sekmesinde "Kanal: Yatay kanal · Manevra: BBQ roll". QR'ı okutan hasta evde "Yatakta dönme manevrası (BBQ roll) · sağ" yaptı; raporu bana geri geldi (ekran 75, 77, 123) |
| Bulgu formunda "nasıl görünür", "Emin değilim, baş dönmesi var" | **karşılandı** | En üstte "Emin değilim, hasta baş dönmesi bildirdi" var; "Nasıl görünür?" her deseni tek cümleyle anlatıyor. Gri "Kaydet"in altında "Kaydetmek için … seçin" yazıyor (ekran 27, 28) |
| Tipik arka kanal bulgusundan sonra "Sıradaki: Tanı" | **karşılandı** | Büyük yeşil "Sıradaki: Tanı" düğmesi; roll "(isteğe bağlı)" diye ikincil (ekran 36). Belirsiz bulguda roll önerisi yerinde kalıyor; doğru davranış |
| Ev raporuna tek cümle klinik öneri | **kısmen** | Gerçek kayıtta "Öneri: Manevra sonrası tekrar testi yapılmamış: … 2–3 doğru manevraya yanıt yoksa sevk düşünün" çıkıyor; tam istediğim buydu. Ama demo kaydında öneri yerine yalnız "demo modunda üretildi" yazıyor; uygulamayı denerken öneriyi hiç görmüyorum |
| Ev raporu varsayılan olarak yeni kontrol muayenesine | **karşılandı** | "Yeni kontrol muayenesi aç" seçili geliyor; ilk muayenenin raporu değişmiyor (3. muayene açıldı) |
| Reçete ekranında iPhone için "önce Ana Ekrana Ekle" | **karşılandı** | QR'ın altında "Hastaya söyleyin (iPhone)…" diye 3 adım; Android notu da var. Hastaya okuyabileceğim kadar kısa |
| Klinisyen testinde "Oturuş, baş sağa 45°" komutu kesilmesin | **karşılandı** | Cümle tamamlanıyor, sonra "Oturuş doğru." deniyor (`speech.log` 65,1→69,6 s) |
| Roll formunda şiddetin açıklaması, Kaydet neden kapalı | **karşılandı** | "Nistagmusun (göremediyseniz hastanın baş dönmesinin) yoğunluğu…" ve "Kaydetmek için şiddeti seçin." (ekran 72) |
| Kanalolitiazis / kupulolitiazis açıklaması | **karşılandı** | Elle tanıda iki cümlelik açıklama, "Süreyi ölçemediyseniz Bilinmiyor" |
| Yenilemede biten testin ölçümü kaybolmasın | **karşılanmadı** | DH bitip bulgu formu açıkken sayfa yenilenince ölçüm ve gecikme/süre gitti (ekran 17) |
| Muayene başında 3 maddelik güvenlik kontrolü | **karşılanmadı** | Muayene ekranı yine doğrudan testlerle başlıyor |
| Telefon alında nasıl duracak, iki eli meşgul hekim nasıl işaretleyecek | **karşılanmadı** | Kalibrasyon metni aynı ("cihazın yön kuralı ölçülür") |
| Reçete metni ("5 gün" ile "14 gün geçerlilik", "testsiz kısa yol") | **karşılanmadı** | Metin aynı |
| Onaydan sonra "Bu tanıyı onayla" yerine "Onaylandı ✓" | **karşılanmadı** | Düğme onay sonrası da duruyor |
| Klinisyene özel metinler | **kısmen** | Raporda "doz uyarıları uygulamada gösterilir" diye düzeltilmiş. Roll girişinde "Hasta modunda…" notu ve DH girişinde "hekim gözetiminde" ifadesi duruyor |
| Subjektif BPPV metni Türkçe ve tek önerili | **karşılanmadı** | Hâlâ "probable BPPV, spontaneously resolved" / "kategoriyi öyküyle siz belirleyin" |

## Akış günlüğü (⚠ = duraksadım, ✗ = ne yapacağımı bilemedim)
1. **İlk açılış:** "Klinisyenim"e dokununca "Hekim ya da odyolog musunuz?" onayı geldi; "Evet" ile 2 dokunuş. Ana ekranda "Hasta moduna dön" var. İyi.
2. **Profil, Demo modu, yeni muayene:** 1. kullanımla aynı, anlaşılır. ⚠ Muayene güvenlik sorusu sormadan doğrudan testlerle açılıyor.
3. **Sağ DH (105 s):**
   - Ses ile ekran uyumlu: komut cümlesi bitiyor, ardından "Oturuş doğru" deniyor.
   - "Sırtüstü, baş hastanın sağına 45° ve sarkık" cümlesi 1,7 s'de "Pozisyon doğru" ile kesildi. Bunun sebebi demo sensörünün konumu anında vermesi; gerçekte yatırmak 2–3 s sürer, doğrulanmadı.
   - ✗ Kalibrasyonda telefonun alında nasıl duracağı hâlâ yazmıyor.
4. **Bulgu formu:** "Nasıl görünür?"ü açınca "Yukarı vuran + torsiyonel: göz alına doğru vurur ve döner…" yazıyor. Desenleri ilk kez yardımla seçtim.
   - Torsiyon yönünde yine "Belirlenmedi"de kaldım, ama artık nedenini bilerek.
   - ⚠ İşaretlerimden gecikme/süre doluyor, ama "Hasta baş dönmesi bildirdi" kutusu boş geliyor. Raporda sağ DH satırında "baş dönmesi var" yazmadı (ekran 28; muayene raporu).
5. **Sol DH:** kalibrasyon bu oturumda tekrar sorulmadı. "Yok" → Kaydet. Hemen büyük "Sıradaki: Tanı" düğmesi çıktı; tereddüt etmedim.
6. **Tanı → onay → Tedaviye geç → Epley → Reçete → QR:** akıcı.
   - ⚠ Onaydan sonra da "Bu tanıyı onayla" düğmesi duruyor.
   - ⚠ "5 gün" ile "Geçerlilik 14 gün" yan yana ve "Testsiz kısa yol…" cümlesi duruyor.
   - iPhone talimatını hastaya okuyabilirim.
7. **HD-1980, yatay kanal:** DH ikisi negatif (elle girdim) → roll telefonla yapıldı. Üç form sırayla açıldı: nötr Yok; sağ geotropik, şiddet 3; sol geotropik, şiddet 1.
   - Şiddet açıklaması ve "Kaydetmek için şiddeti seçin" satırı sayesinde takılmadım.
   - Tanı "Sağ yatay kanal BPPV — geotropik". **Reçete sekmesinde artık BBQ roll var**; "Gufoni evde sunulmaz" diye açıkça yazıyor. 3 dokunuşla QR çıktı.
   - ⚠ Roll girişinde hâlâ "Hasta modunda nistagmus gözlenemez…" notu var.
8. **Hasta tarafı:**
   - Reçete kartında "SAĞ kulak — yatay kanal kristal oynaması · BBQ roll" yazıyor.
   - Hasta "muayeneden beri hiç geçmedi" deyince doğrudan "Yatakta dönme manevrası (BBQ roll) · sağ" başladı.
   - İlk denemede demo sürücüm pozisyona gelemedi ve manevra yarıda kaldı (test düzeneğinden kaynaklı). İkincisi tamamlandı. Rapor ikisini de dürüstçe yazdı ("yarıda kaldı (1. adım)").
9. **Kontrol:** hastanın bağlantısını yapıştırdım.
   - Hasta kodu ve reçete kodu otomatik eşleşti; varsayılan "Yeni kontrol muayenesi aç". 1 dokunuşla yeni muayene açıldı, ev dönemi raporu içinde.
   - ⚠ Demo raporunda "Öneri:" satırında yalnız "demo modunda üretildi" yazıyor. Demo bayrağı kaldırılmış kayıtta gerçek öneri çıktı ("…tekrar testi yapılmamış: pozisyon testini tekrarlayın; 2–3 doğru manevraya yanıt yoksa sevk düşünün"). Bu cümle bana ne yapacağımı söylüyor.
10. **MK-1971:** "Emin değilim, hasta baş dönmesi bildirdi" tek dokunuş. Test listesine "Nistagmus yok, baş dönmesi var" diye yazıldı.
    - ⚠ Tanı metni hâlâ İngilizce kategori adlarıyla geliyor ve "kategoriyi siz belirleyin" diyor.
    - Elle tanıda kanalolitiazis/kupulolitiazis açıklaması işime yaradı.
11. **Yenileme denemesi:** ✗ bulgu formu açıkken sayfa yenilendi; ölçülen DH kayboldu, testi baştan yaptım.

**Ölçümler** (ilk açılış → Epley başlaması, normal hız tahmini): ~31 dokunuş, ~6–7 dk. Dağılım: kalibrasyon 25 s; DH 105 s; formlar ~15 s; tanı ~20 s.
Yatay kanalda roll + 3 form + tanı + reçete: ~14 dokunuş. Ev raporunu eklemek: 3 dokunuş.
Duraksama (⚠): 8 (tur 1'de 14). Ne yapacağımı bilemediğim an (✗): 2 (tur 1'de 7): telefonun alında tutulması ve yenilemede kaybolan ölçüm.
Konsol hatası: 0.

## Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Orta | Bulgu formu / sayfa yenilenmesi | Biten testin ölçümü, bulgu kaydedilmeden yenilenirse kayboluyor | Bitmiş ölçüm taslak olarak saklansın, form yeniden açılsın | Evet, ekran 17 |
| 2 | Orta | Bulgu formu | Nistagmus/belirti işareti konduğu hâlde "Hasta baş dönmesi bildirdi" boş geliyor; rapora "baş dönmesi var" yazılmıyor | İşaret varsa kutu işaretli gelsin (hekim kaldırabilsin) | Evet (kayıtta `vertigo:false`) |
| 3 | Orta | Muayene başı | Güvenlik kontrolü yok | "Teste başlamadan" 3 madde (spontan nistagmus, nörolojik bulgu, boyun); rapora yazılsın | Evet |
| 4 | Orta | Kalibrasyon / test girişi | Telefon alında nasıl durur, iki eli meşgul hekim nasıl işaretler: yazmıyor | Bant/yardımcı önerisi; ikinci kişinin dokunuşu ya da sesle işaret | Hayır (gerçek sensörle denenmedi) |
| 5 | Düşük | Ev raporu, demo | Demo kaydında klinik öneri gizleniyor | Demo notu ile öneri birlikte gösterilsin | Evet |
| 6 | Düşük | Reçete metni | "5 gün" ile "14 gün geçerlilik", "testsiz kısa yol" | "5 gün, günde en çok 3. Reçete 14 Kasım'a dek geçerli." Kısa yol açıklaması katlanır bölüme | Evet |
| 7 | Düşük | Tanı (subjektif BPPV) | İngilizce kategori adları, "siz belirleyin" | Türkçe ve tek önerili: "Belirti tarafına deneme manevrası öneriyorum" | Evet |
| 8 | Düşük | Tanı, onay sonrası | "Bu tanıyı onayla" düğmesi yerinde duruyor | "Onaylandı ✓" | Evet |
| 9 | Düşük | Klinisyen metinleri | Roll girişinde "Hasta modunda…", DH girişinde "hekim gözetiminde" | Klinisyene özel metin | Evet |

## Puanlar
- **Sezgisellik: 8/10** (tur 1'de 7). En çok takıldığım üç yer düzelmiş: "Sıradaki: Tanı", formda "nasıl görünür / emin değilim", yatay kanal reçetesi. Kalan pürüzler metin ve kayıt düzeyinde.
- **Genel memnuniyet: 8/10** (tur 1'de 7). Arka kanalda da yatay kanalda da muayeneden ev reçetesine, oradan kontrolde ev raporuna kadar zincir kesintisiz. Kontrolde aldığım öneri cümlesi ASM'de tam ihtiyacım olan şey.
- **Önerir miyim / kullanır mıyım:** Evet, kullanırım ve ilçedeki aile hekimi meslektaşlarıma öneririm. Muayene başına güvenlik kontrolü gelirse uzman olmayan hekim için daha güvenli olur.

**Kalan en önemli 3 isteğim**
1. Biten testin ölçümü sayfa yenilenince kaybolmasın. İşaret konduysa "Hasta baş dönmesi bildirdi" kendiliğinden işaretli gelsin (sorun 1, 2).
2. Muayene başında 3 maddelik güvenlik kontrolü. Telefonun alında nasıl tutulacağı ve iki eli meşgul hekimin nasıl işaret koyacağı için kısa yönerge (sorun 3, 4).
3. Metinleri sadeleştirmek (sorun 6–9):
   - reçetede tek süre;
   - subjektif BPPV için Türkçe, tek önerili metin;
   - onaydan sonra "Onaylandı ✓";
   - klinisyen ekranlarından hasta modu notlarının çıkması.
