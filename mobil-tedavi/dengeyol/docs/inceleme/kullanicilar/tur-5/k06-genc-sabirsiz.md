# Tur 5 · k06 · Can (31, yazılımcı, sabırsız tekrarlayan kullanıcı)

## 1. Ben kimim, ne yapmaya çalıştım
Aynı Can'ım: travma sonrası BPPV, 6 ayda 4. atak, sağ arka kanal tanılı, iPhone 13, koyu tema, metin okumuyorum. 4. turdaki üç
isteğime kendi gözümle baktım. `e2e/run-e2e.mjs` içindeki "Tur 2–3 kilidi" senaryolarını okuyup kendi kenar durumlarımla
karşılaştırdım. İki ataklı süre ve dokunuş ölçümünü tekrarladım: bu sürümde ilk kez (×20 hız), sonra aynı cihazda iki gün
sonra (gerçek hız). Bütün kenar durumlarını yeniden denedim.

Sunucu `http://localhost:4182/`. Kullanım sınırı nedeniyle tur yarıda kesildi; kesintiden önce bütün betikler bitmişti, çıktılar
eksiksizdi, yeniden çalıştırmak gerekmedi. Betikler ve ekran görüntüleri:
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-5/k06-genc-sabirsiz/`
(`main4.mjs`, `edges.mjs`, `after2.mjs`, `dose3.mjs`, `close-limit.mjs`; `main.log`, `edges.json`, `a1-*`, `a2-*`, `ekran/`).

## 2. Yaşadıklarım
**1. atak (bu sürümde ilk kez):** 14 güvenlik sorusu 38 sn sürdü; ilk okunuş kilidi beklendiği gibi açık. Yanıtladığım 14 soru,
soru sürümüyle birlikte kaydedildi.

**2. atak (aynı cihaz, iki gün sonra, gerçek hız):**
| Saniye | Etkin dokunuş | Ne oldu |
|---|---|---|
| 0 | 1 | "Baş dönmem başladı". |
| **11,1** | 15 | 14 güvenlik sorusu; yalnız kısa çift dokunuş kilidi var. Tur 4'te 12,1 sn'ydi. |
| 13,1 | 17 | İki alt tip sorusu. |
| 14,5 | 19 | Taraf sorusu, sonra "Hazırım". Hazırlık ekranı yine tam liste. |
| 166 | 19 | Yerleştirme ölçümü ve sol test. |
| 198 | 20 | 30 sn dinlenme. |
| 322 | 22 | Sağ testte baş dönmesi işareti (2 dokunuş). |
| **328,2** | **23** | Tek dokunuşla Epley başladı. **5 dk 28 sn, 23 etkin dokunuş, 0 kaydırma.** Tur 4: 5 dk 30 sn / 23. Tur 3: 5 dk 56 sn. |
| 592 | 24 | Önce "telefonu alın" deniyor, sonra "İyiyim" dedim. Bitişte 10 dk sayaç, tekrar testi saati, en sonda sık tekrar uyarısı. Konsolda hata yok. |

Hız artık sorulara değil, iki taraf testine, yerleştirme ölçümüne ve 30 sn dinlenmeye bağlı. Bunlar gerekli, dokunulmasını istemiyorum.

## 3. Sorunlar ve 4. kullanımdaki isteklerim
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Düşük | 4. kullanımdaki isteğim #1, taraf sorusunda "geçen sefer" notu: **karşılanmadı** (sentezde bilerek ertelenmiş: "isteğe bağlı konfor; sonraki sürüm") | Taraf sorusu her atakta sıfırdan soruluyor. Yalnız test sırasını belirlediği için yük 1 dokunuş. | Sonraki sürümde son atağın test tarafı "geçen sefer: sağ" notuyla üstte dursun; seçim ve iki taraflı test aynen kalsın. | Evet (`ekran/18-a2-taraf-sorusu.png`) |
| 2 | Düşük | 4. kullanımdaki isteğim #2, hazırlık listesinin katlanması: **karşılanmadı** (aynı gerekçeyle ertelenmiş) | Beşinci atağımda da tam liste, resim ve işitme cihazı notu geliyor. "Hazırım" ekranın altında; tek dokunuş, kaydırma gerekmedi. | Önceden manevra yapmış kullanıcıda liste "Hazırlığı göster" altında katlı gelsin. | Evet (`a2-prep.txt`) |
| 3 | – | 4. kullanımdaki isteğim #3, düzelen davranışlar uçtan uca testlerle korunsun: **karşılandı** | `run-e2e.mjs` içinde 6 "Tur 2–3 kilidi" senaryosu var: (a) "Şu an nasılsınız?"ta aynı yere çift ve aralı kör dokunuşlar (onay başlığı, "Evet"in dokunulan yerde olmaması, "Yanlış dokundum"un orada olması); (b) aynı gün yeniden açma ve adresle `treat`/`start`; (c) sınır kartı ve aktif atakta "Manevrayı tekrarla" olmaması; (d) okuma kilidinin soru başına hatırlanması (2. atakta yanıtlanmış soruda kısa, yeni soruda uzun kilit); (e) duraklatma onayı; (f) yanlış taraf uyarısı. Benim önceki isteklerimin hepsini kapsıyor. Testler benim betiklerimden daha sıkı: kilit sürelerini ölçüyor ve "Evet"in yerini koordinatla denetliyor. | – | Evet (testleri okudum; aynı durumları kendim de denedim, hepsi geçti) |
| 4 | Düşük | Uçtan uca testlerde olmayan, ama benim denediğim davranışlar | Hepsi bu sürümde de çalışıyor: seçenek ekranlarında ve son güvenlik sorusunda çift dokunuş kilidi; sistem geri tuşunun önceki soruya dönmesi; yarıda bırakılan atakta alt tip yanıtlarının hatırlanması (teste 3 dokunuş); ≥4 atakta 1. sorunun düğmelerinin görünür alanda kalması; gün sınırı (14 günde 3 gün) kartı; arka plana alınca duraklatma; kapatırken uyarı. Ancak bunları koruyan bir test yok. | Bu yedi davranış da "kilit" senaryolarına eklensin; özellikle Choice çift dokunuşu ve 1. soruda düğmelerin görünür alanda kalması, 1. ve 2. turlarda gerçekten bozuk bulduğum şeyler. | Evet (`edges.mjs` 1, 2, 2c, 3, 4, 5, 9) |
| 5 | – | Önceki turlarda düzelenler | Bozulma yok. Kör dokunuş acil kaydı açmıyor; "Kusma" ve "Yeni belirti" yollarında da durum "active" kaldı. "Doğru mu?" başlığında yanıt görünüyor. Aynı gün kapat-aç aynı atağa dönüyor, yeni atak açılmıyor. `#/hasta/atak/treat` manevra açmıyor. Günlük sınır kartı çıkıyor ve başlat düğmesi yok; kapatılan atakta da sınır kartı var. Aktif atakta sınırda yalnız "Rapor" ile "Atak geçti, kapat" var. Okuma kilidi 2. atakta yok. Kilit soluk görünüyor. | – | Evet (`after2.mjs`, `close-limit.mjs`, `dose3.mjs`, `edges.mjs`, `main4.mjs`) |

Yeni bir hata bulamadım.

## 4. Sevdiklerim
- Bildiğim sorularda beklemiyorum, yeni ya da değişen soruda sonuna kadar dinletiyor. Tekrarlayan atakta sorular 11 sn,
  manevraya toplam 5,5 dk ve 23 dokunuş.
- Kör dokunuşa, kapat-aç hilesine, doğrudan adrese ve geri tuşuna karşı sağlam. Artık bunların bir kısmı testle de kilitli.
- Sınırlar ve sıradaki adım her zaman ana ekranda, saatiyle yazılı. Uygulama beni boşuna soru yanıtlamaya zorlamıyor.

## 5. Memnuniyet
**9/10.** Kalan iki isteğim bilerek ertelenmiş küçük konfor işleri. Düzelen davranışların uçtan uca testlere bağlanması, bir
sonraki sürümde de aynı deneyimi yaşayacağıma dair güven veriyor. 10 olmamasının nedeni taraf sorusu, hazırlık listesi ve
testlerde henüz olmayan birkaç kenar durumu.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Evet.** Koşul, uygulamanın zaten şart koştuğu şey: hekim
tanısı konmuş, tekrarlayan arka kanal BPPV'si olan biri.
