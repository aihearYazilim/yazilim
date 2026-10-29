# 03 — Hasta yakını (yardımcı) gözünden DengeYol

## 1. Kim olduğum ve ne denedim
**Zeynep, 38 yaşında.** 70 yaşındaki annemin hekim tanılı sağ arka kanal BPPV'si var. Manevrayı ona ben yaptıracağım:
annemi yatakta döndüreceğim, başını tutacağım, bir yandan da alnındaki telefonun ekranına bakacağım. Ellerim dolu.

Denediğim akışlar (Pixel 7, demo sensörü, ×20 hız; betik ve ekran görüntüleri:
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/personas/03-hasta-yakini/`):
- Hasta ana ekranı → 11 güvenlik sorusu → telefonu tanıtma → taraf sorusu → Epley hazır ekranı → 5 adımın hepsi
  (pozisyon arama, tutma, baş dönmesi işaretleme, pozisyon bozulması, duraklatma) → "Şu an nasılsınız?" (`normal-*.png`).
- Aynı akış yatay ekranda (`landscape-*.png`). Telefon yatarken kendiliğinden yataya dönebilir, bu yüzden denedim.
- Ekranı başucundan ve yandan görecek biri için 180° ve 90° döndürdüğüm kopyalar (`yardimci-bas-ucundan-adim4.png`,
  `yardimci-yandan-adim4.png`).
- Kontrol: "ekranın herhangi bir yerine dokunun" metni doğru mu? Göstergeye dokundum, baş dönmesi **işaretlenmedi**
  (`aria-pressed=false`).

## 2. En büyük 3 engel

1. **Başucunda durduğumda ekran ters, sağ ile sol da yer değiştiriyor.** Epley'de yardımcı hastanın başucunda durur ve
   başı iki eliyle tutar. Telefonun üst kenarı annemin başının tepesine bakıyor, yani bana dönük. Bu yüzden bütün yazılar
   bana baş aşağı görünüyor. Gösterge hastanın başının tepesinden ayaklara bakılarak çizilmiş
   (`Gauges.tsx:2-5`). Ama ekran ters durunca göstergedeki **"SAĞ" yazısı benim solumda kalıyor**, oysa annemin sağı
   benim sağımda (`yardimci-bas-ucundan-adim4.png`). "Biraz daha sola" derken yanlış yöne çevirme riski var. Yatağın
   yanında durursam da ekran 90° yan duruyor. Uygulamada ekranı çevirme ya da yön kilitleme yok: `requestFullscreen`
   veya `orientation.lock` hiç geçmiyor. Manifest'teki `portrait` ayarı (`vite.config.ts:24`) yalnız ana ekrana
   eklenmiş uygulamada geçerli.
2. **Telefon yataya dönünce gösterge, durum etiketi ve sayaç ekrandan kayboluyor.** Yatay görünümde yalnız yönerge
   metniyle "Baş dönmesi başladıysa dokunun" alanı görünüyor (`landscape-12-adim2-tutuyor.png`). Annem yan yattığında
   (Epley 4. adım) telefon kendiliğinden yataya dönebilir. Tam yardıma muhtaç olduğum anda ne yapacağımı gösteren her
   şey kayboluyor.
3. **Ekran yardımcıya değil hastaya yazılmış ve ne yapacağımı söylemiyor.** Hazır ekranındaki kart "Ekranı görmeniz
   gerekmez" diyor (`RunnerView.tsx:340-345`). Adım metinleri annem için yazılmış: "Başınızın yönünü bozmadan…". Hasta
   modunda düzeltme ipucu ekranda yazmıyor. "Başınızı biraz daha sola çevirin" yalnız sesle söyleniyor
   (`evaluator.ts:109-119`, `runner.ts` ipucu sesleri). Ekranda yalnız "Pozisyon aranıyor" ya da "Pozisyon bozuldu"
   yazıyor (`RunnerView.tsx:433-445`), bir de −45° gibi eksi açılar (`adim4-ariyor.png`). Yardımcıya bir bakışta
   "annenizin başını SOLUNA doğru biraz daha çevirin" diyen bir şey yok. Ayrıca kim telefonu tutacak, ben nerede
   duracağım, baş dönmesini kim işaretleyecek, bunlar hiçbir yerde anlatılmıyor. Kılavuzda tek satır var
   (`KULLANIM-KILAVUZU.md:31`).

## 3. Bulgular

| # | Ekran/yer | Sorun (gözlenen) | Öneri (somut) | Etki | Emek |
|---|---|---|---|---|---|
| 1 | Yürütücü, yatar adımlar | Ekran başucundaki yardımcıya ters görünüyor; gösterge sağ/sol yazıları ters tarafa düşüyor (`yardimci-bas-ucundan-adim4.png`). | **Yardımcı modu**nda yatar adımlarda yürütücü içeriğini 180° çevir (`.runner.flip {transform: rotate(180deg)}`). Uygulama yatışı zaten biliyor (`tiltFromUpright ≥ 45`). Başlıkta elle **"Ekranı çevir ⟲"** düğmesi olsun; seçim hatırlansın. Göstergenin altına "Siz başucundasınız: annenizin sağı = sizin sağınız" yazısı. | Yüksek | M |
| 2 | Yürütücü, yatay ekran | Yatay görünümde gösterge, durum ve sayaç görünmüyor (`landscape-12-*.png`). | Başlat'a basınca `requestFullscreen()` ve ardından `screen.orientation.lock('portrait')` dene. Olmazsa yatay için iki sütunlu düzen: solda gösterge ve sayaç, sağda durum ve dokunma alanı. Sabit yükseklik `@media (orientation: landscape)`. | Yüksek | M |
| 3 | Yürütücü, durum etiketi | Hasta modunda düzeltme yönü ekranda yazmıyor, yalnız sesle söyleniyor (`RunnerView.tsx:495-517` yalnız klinisyende). | Durum etiketinin altına büyük ok ve tek satır yönerge ekle: "← Başı annenizin SOLUNA biraz daha çevirin", "Başı biraz daha geriye bırakın". Hasta modunda da `ev.hint` gösterilsin. Yardımcı modunda üçüncü şahıs metin kullanılsın. | Yüksek | S |
| 4 | Hazır ekranı ve yönerge metni | "Baş dönmesi başlarsa **ekranın herhangi bir yerine** dokunun" yazıyor (`RunnerView.tsx:344`), ama yalnız alttaki alan çalışıyor. Göstergeye dokununca işaretlenmedi. | Hasta ve yardımcı modunda gövdenin tamamını (duraklat düğmesi hariç) baş dönmesi alanı yap. Ya da metni "ekranın alt yarısına dokunun" diye düzelt. Ben ilkini öneririm: telefon alında, dokunuş körlemesine yapılıyor. | Yüksek | S |
| 5 | Hazır ekranı | Yardımcı için hazırlık yok. Kart hastaya hitap ediyor: "Ekranı görmeniz gerekmez". | Hazır ekranına **"Kim yapıyor? [Kendim] [Bir yakınımla]"** seçimi ekle. "Bir yakınımla" seçilince 5 maddelik **Yardımcı hazırlığı** kartı çıksın (bkz. §5). Seçim ayarda saklansın. | Yüksek | M |
| 6 | Hazır ekranı, `BedSetup` | Yatak ve yastık çizimi okunamayacak kadar küçük (yaklaşık 75 px; `07-normal-manevra-hazir.png`). Çizim esnek sütunda küçülüyor. | `.illus { flex-shrink: 0; }` ekle. Çizime yardımcının duracağı yeri (başucu), yatak kenarı/ayak ucu ve "baş yatağın kenarından 20–30° sarkacak" yazısını ekle. | Orta | S |
| 7 | Yatak yerleşimi metni | "Yastığı omuzlarınızın altına koyun" deniyor. Ama evde yatağın başı duvara dayalı; yardımcı başucunda duramaz. | Hazırlığa ekle: "Yatağın başı duvara dayalıysa annenizi **ters** oturtun, başı yatağın ayak ucuna gelsin. Siz o uçta durun." | Orta | S |
| 8 | Telefonu kim tutar | Kurulumda telefonu tutma işi hep hastaya veriliyor ("alnınıza yaslayın"). Benim iki elim başı tutuyor; telefonu nasıl tutacağımı bilmiyorum. | Yardımcı modunda açıkça yaz: "**Telefonu anneniz kendi eliyle alnında tutsun. Siz iki elinizle başını tutun.**" Başlangıç kontrolünde sesli yönerge de buna göre olsun. | Yüksek | S |
| 9 | Baş dönmesi işareti | Telefon alında, ellerim başta. Kimin dokunacağı belli değil. Hastanın kör dokunuşu duraklat düğmesine gelebilir (sol üst, alına yakın). | Yardımcı modunda kural: "Anneniz 'dönüyor' desin, **siz** ekranın herhangi bir yerine dokunun." Yönerge sesi hastaya: "Baş dönmesi başlarsa söyleyin." Duraklat düğmesine kör dokunuşu engellemek için duraklatma uzun basışla ya da onaylı olsun (bkz. #11). | Yüksek | S |
| 10 | Sayaç halkası | Pozisyon bozulduğunda sayaç "34 sn kaldı" diye donuk kalıyor (`16-…-pozisyon-bozuldu.png`). Ararken "— pozisyon" yazıyor; anlamı belirsiz. | Bozulunca halka gri olsun ve "DURDU — düzeltin" yazsın. Ararken "Pozisyona getirin" yazsın. Geri sayım rakamı en büyük öğe olsun (şu an 116 px). | Orta | S |
| 11 | Duraklatma ve acil durdurma | Duraklat, etiketsiz küçük bir simge (`RunnerView.tsx:451`). Durdurmak iki adım istiyor: duraklat, sonra "Kendimi iyi hissetmiyorum". Demo düğmesi sayfanın bu kısmını kapatıyor. | Başlıkta yazılı, büyük **"Duraklat"** düğmesi (en az 56 px). Duraklatma ekranında "Kendimi iyi hissetmiyorum — durdur" en üstte dursun. Yardımcı modunda sesli "durduruldu, annenizi yavaşça oturtun" yönergesi ver. | Orta | S |
| 12 | Gösterge sayıları | "−45°", "−135°" gibi eksi açılar halk için anlamsız (`17-normal-adim4-ariyor.png`). | Hasta ve yardımcı modunda sayı yerine yazı: "Sağa 45°", "Sola, yüz yere". Kulak çemberlerinden biri "S" (sağ kulak) olarak işaretlensin. | Orta | S |
| 13 | Adım metinleri | Metinler ekranda hastaya hitap ediyor ("Bütün vücudunuzla sol yanınıza dönün"). Yardımcıya nasıl yardım edeceğini söylemiyor. | `StepDef`'e `helper` alanı ekle (ör. ep-3: "Annenizi omzundan ve kalçasından tutup SOL yanına döndürün; başını da birlikte çevirin, burnu yere baksın"). Ses hastaya, ekran yardımcıya. | Yüksek | M |
| 14 | Adımlar arası | Sonraki adım için 4 sn hazırlık kısa. Başlık "Sırada: …" iyi, ama yardımcı uzun metni okuyamıyor. | Hazırlıkta yalnız kısa başlık ve büyük ok göster. Yardımcı modunda hazırlık 6 sn olsun ya da "Hazırım" dokunuşuyla geçilsin. Bu bir güvenlik sınırı değil. | Düşük | S |
| 15 | Kalibrasyon | Metin hastaya yazılmış ("Telefonu normal tutun… alnınıza yaslayın"). Yardımcı "Başla"ya basıp telefonu 7,5 sn içinde annesinin alnına yerleştirmeli; bunu bilmiyor. | Yardımcı modunda: "Başla'ya basın, telefonu annenizin alnına ekranı dışa bakacak şekilde yaslayın; anneniz telefonu tutsun ve karşıya baksın." Bekleme 7,5 sn yerine 10 sn olsun. | Orta | S |
| 16 | Güvenlik soruları | Sorular hastaya yazılmış. Yardımcı annesine sesli soracak; bu sorun değil, sadece yön gösterilmiyor. | Yardımcı modunda üstte küçük bir not: "Soruları annenize sorun; yanıtı onun versin." Sorular aynen kalsın. | Düşük | S |
| 17 | Son adım (oturma) | "Yavaşça doğrulup yatağın kenarına oturun." Düşme anında yardımcıya yönerge yok. | Yardımcı metni: "Annenizi omzundan destekleyerek oturtun. 1 dakika yanında kalın; tek başına kalkmasın." | Orta | S |
| 18 | Deneme manevrası | Ana ekranda var ve iyi. Ama yardımcıya önerilmiyor. | Deneme kartına "Yakınınızla birlikte bir kez prova edin" alt yazısı. Yardımcı modunda varsayılan olarak önerilsin. | Düşük | S |

## 4. Hızlı kazanımlar (öncelik sırasıyla)
1. Hasta modunda düzeltme ipucunu (`ev.hint`) ekranda büyük ok ve tek satırla göster (#3).
2. Gövdenin tamamını baş dönmesi alanı yap, "ekranın herhangi bir yerine" sözü doğru çıksın (#4).
3. Elle **"Ekranı çevir ⟲"** düğmesi: CSS ile 180° döndürme, tercih saklanır (#1'in hızlı hali).
4. `.illus { flex-shrink: 0 }` ile yatak çizimi okunur hale gelsin; yardımcının yeri de eklensin (#6).
5. Hazır ekranına "Bir yakınımla yapıyorum" seçimi ve 5 maddelik yardımcı hazırlık kartı (#5, #8, #9).
6. Pozisyon bozulunca halkada "DURDU — düzeltin" yazsın, eksi açılar yerine "Sağa/Sola" yazılsın (#10, #12).
7. Yazılı, büyük "Duraklat" düğmesi (#11).
8. Yatayda gösterge kaybolmasın: tam ekran ve dikey kilit denemesi, olmazsa iki sütunlu yedek düzen (#2).

## 5. Önerilen yeni metinler

**Hazır ekranı, yeni seçim**
- Önce: (yok)
- Sonra: **"Bu manevrayı kim yapıyor?"** — [Kendim] [Bir yakınımın yardımıyla]

**Yardımcı hazırlığı kartı (yeni, "Bir yakınımın yardımıyla" seçilince)**
> **Yardımcı için 1 dakikalık hazırlık**
> 1. Yatak: Yastığı, anneniz sırtüstü yatınca **omuzlarının altına** gelecek yere koyun; başı yastıktan geriye sarksın.
>    Yatağın başı duvara dayalıysa anneniz ters otursun, başı yatağın ayak ucuna gelsin.
> 2. Siz: **Başucunda** durun. Ekran size dönük olacak; uygulama yazıları sizin için çevirir.
> 3. Telefon: **Anneniz kendi eliyle** alnında tutsun, ekran dışa baksın. Siz iki elinizle başını tutun.
> 4. Baş dönmesi: Anneniz **"dönüyor"** desin, siz ekranın herhangi bir yerine dokunun. Geçince yine dokunun.
> 5. Durdurmak: Üstteki **Duraklat**'a basın. Kendini kötü hissederse "Durdur"a basın ve onu yavaşça oturtun.

**Hazır ekranı kartı (`RunnerView.tsx:340-345`, yardımcı modu)**
- Önce: "Ekranı görmeniz gerekmez — Her adımı sesli anlatacağım… ekranın herhangi bir yerine dokunun…"
- Sonra: "**Ekran size, ses annenize konuşur.** Yeşil 'Doğru — böyle kalın' görünce başı sabit tutun. Ok çıkarsa başı
  okun yönüne yavaşça çevirin."

**Durum etiketi ve ipucu (hasta ya da yardımcı modu, yeni ikinci satır)**
- Önce: "Pozisyon aranıyor" / "Pozisyon bozuldu"
- Sonra: "Pozisyon aranıyor — **← Başı annenizin SOLUNA biraz daha çevirin**" /
  "Pozisyon bozuldu — **Başı biraz daha geriye bırakın**" (hastaya: "Başınızı biraz daha sola çevirin")

**Sayaç halkası**
- Önce: "—  pozisyon" / bozulunca "34 sn kaldı"
- Sonra: "Pozisyona getirin" / "DURDU · düzeltin"

**Ses: baş dönmesi işaretleme (yardımcı modu, `runner.ts` vertigoToggle)**
- Önce: "Baş dönmesi işaretlendi. Gözlerinizi açık tutmaya çalışın ve pozisyonu bozmayın. Geçince ekrana tekrar dokunun."
- Sonra: "Baş dönmesi işaretlendi. Gözlerinizi açık tutun, kıpırdamayın. Geçince söyleyin."

**Adım yönergesi, yardımcı metni (yeni `helper` alanı; ses yine hastaya)**
- ep-1: "Başı SAĞA 45° çevrili tutarak annenizi hızla sırtüstü yatırın; başı yastıktan 20–30° geriye sarksın. Başı iki
  elinizle destekleyin."
- ep-2: "Başı yastıktan kaldırmadan yavaşça SOLA çevirin; başı sola 45° baksın."
- ep-3: "Annenizi omzundan ve kalçasından tutup SOL yanına döndürün; başını birlikte çevirin, burnu yere baksın."
- ep-4: "Annenizi sol tarafından destekleyerek yavaşça oturtun, çenesi hafif aşağıda olsun. 1 dakika yanında kalın."

**Kalibrasyon (yardımcı modu)**
- Önce: "Şimdi telefonu normal tutun ve 'Başla'ya dokunun."
- Sonra: "Başla'ya basın, sonra telefonu annenizin alnına ekranı dışa bakacak şekilde yaslayın. Telefonu anneniz tutsun,
  karşıya baksın."

**Duraklat düğmesi**
- Önce: yalnız ‖ simgesi
- Sonra: "‖ Duraklat" (yazılı, en az 56 px)

## 6. Yapmamamız gerekenler
- **Baş dönmesini yalnız yardımcıya işaretletmek.** Hasta yalnızken de yapabilmeli; yardımcı modu yalnız ek kolaylık olsun.
- **Ses tanıma ile "başladı/geçti"** demek. Tarayıcıda çoğu zaman sunucuya gider; "ağ yok" kuralını çiğner.
- **Telefona hafifçe vurarak işaretleme.** Darbe algılama zaten "telefon yerinden oynadı" uyarısı veriyor; ikisi karışır.
- **Uzun baş dönmesinde otomatik durdurmayı yardımcı modunda kapatmak** ya da "yardımcı var" diye doz sınırlarını
  gevşetmek. Bunlar kırmızı çizgi.
- **Ekrana daha çok sayı ve çizgi koymak** (θ/φ gibi). Yardımcı bir bakışta "hangi yöne, ne kadar" bilmek ister;
  açı değil ok ve kısa söz gerekir.
- **Ekranı otomatik çevirip elle geri alma imkânı vermemek.** Bazı yardımcılar yatağın yanında durur; "Ekranı çevir"
  hep elde olmalı.
- **Ses yönergelerini yardımcıya göre üçüncü şahsa çevirmek.** Anneme "annenizin başını çevirin" dendiğini duymak
  kafasını karıştırır. Ses hastaya, ekran yardımcıya konuşsun.
