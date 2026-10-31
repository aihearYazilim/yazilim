# Tur 4 (son) · k06 · Can (31, yazılımcı, sabırsız tekrarlayan kullanıcı)

## 1. Ben kimim, ne yapmaya çalıştım
Aynı Can'ım: travma sonrası BPPV, 6 ayda 4. atak, sağ arka kanal tanılı, iPhone 13, koyu tema, metin okumuyorum. 3. turdaki
isteklerime kendi gözümle baktım; özellikle 2,5 sn'lik okuma kilidinin yalnız ilk sorulan soruda olup olmadığına. Bunun için
aynı cihazda iki atak yaşadım:
- 1. atak: bu sürümle ilk karşılaşma (×20 hız).
- 2. atak: iki gün sonra, aynı localStorage ile, gerçek hızda ölçüm.

Önceki turlarda düzelenlerin bozulmadığını da aynı kenar durumlarıyla yeniden denedim. Sunucu `http://localhost:4181/`.
Test koşulu öncekilerle aynı: tohumlanmış geçmiş, kayıtlı kalibrasyon, demo sensör, kaydedilen ses, 350 ms arayla ham
dokunuşlar. Betikler ve ekran görüntüleri:
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-4/k06-genc-sabirsiz/`
(`main4.mjs` iki ataklı ölçüm, `edges.mjs`, `after2.mjs`, `dose3.mjs`, `close-limit.mjs`; `ekran/`, `a1-*`/`a2-*` kayıtları).

## 2. Yaşadıklarım
**1. atak (bu sürümde ilk kez):** 14 güvenlik sorusu yine ~38 sn sürdü; düğmeler soru okunurken kilitli ve soluk. Bunu
beklenen davranış olarak kabul ediyorum: sorular bu sürümde yenilendi ve ben ilk kez duyuyorum. Uygulama hangi soruyu hangi
metinle yanıtladığımı kaydetti (14 soru, sürüm imzasıyla).

**2. atak (aynı cihaz, gerçek hız):**
| Saniye | Etkin dokunuş | Ne oldu |
|---|---|---|
| 0 | 1 | "Baş dönmem başladı". |
| **12,1** | 15 | 14 güvenlik sorusu. Okuma kilidi yok, yalnız kısa çift dokunuş kilidi kaldı. 3. turda bu bölüm 38 sn sürmüştü, 2. turda 11 sn. Sabırsız hâlimle 13 dokunuşum boşa gitti; bunlar çift dokunuş korumasının yuttuğu dokunuşlar, ki o koruma dursun. |
| 14,3 | 17 | İki alt tip sorusu. |
| 15,7 | 19 | Taraf sorusu, sonra "Hazırım". |
| 167 | 19 | Yerleştirme ölçümü ve sol test. |
| 199 | 20 | 30 sn dinlenme; nedeni söyleniyor. |
| 324 | 22 | Sağ testte baş dönmesi işareti (2 dokunuş). |
| **329,9** | **23** | Tek dokunuşla Epley başladı. **5 dk 30 sn, 23 etkin dokunuş, 0 kaydırma.** 3. turda 5 dk 56 sn'ydi; 2. turdaki en iyi değere döndüm. |
| 594 | 24 | Manevra bitince önce "Telefonu alnınızdan alın ve ekrana bakın" deniyor, sonra "İyiyim" dedim. Bitiş sesi kısalmış ("On dakika oturun; tutunarak kalkın. Saat 13:31 civarında tekrar test edeceğiz.") ve sık tekrar uyarısı doğru sayıyla ("Son 6 ayda 5 atak") en sonda okunuyor. |

Kalan süre (~5 dk) iki taraf testi, yerleştirme ölçümü ve 30 sn dinlenmeden geliyor. Bunlar klinik olarak gerekli; dokunulmasını
istemiyorum.

## 3. Sorunlar ve 3. kullanımdaki isteklerim
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | – | 3. kullanımdaki isteğim #1, okuma kilidi yalnız ilk sorulan soruda: **karşılandı** (`state/episodes.ts` `firstReadLockNeeded`) | Aynı cihazda 2. atakta 14 soru 12,1 sn sürdü (ilk karşılaşmada 38 sn). Sorular ve yanıtlar aynen duruyor. Soru metni değişirse kilit yalnız o soruya geri geliyor (sürüm imzası). | – | Evet (`main4.mjs`, `main.log`) |
| 2 | – | 3. kullanımdaki isteğim #2, "Doğru mu?" başlığında yanıt: **karşılandı** | Başlık "Yeni belirti var — doğru mu?", altında yanıt ve sonucu, ardından "Evet, doğru". Kaydırmadan görünüyor. "Yanlış dokundum" hâlâ dokunduğum yerde (y=478–602); aynı yere tekrarlanan kör dokunuşlar acil kaydı oluşturmadı. "Kusma" yolunda da aynı. | – | Evet (`after2.mjs`, `ekran/01-after2-y540.png`, `edges.mjs` A) |
| 3 | – | 3. kullanımdaki isteğim #3, önceki düzeltmeler bozulmasın: **karşılandı** | Seçenek ve son soruda çift dokunuş yutuluyor; kilit soluk görünüyor. Sistem geri tuşu önceki soruya dönüyor; testte geri tuşu duraklatıyor. Arka plana alınca yürütücü duraklıyor (sesli "2 sn basılı tutun"). Kapatırken uyarı geliyor; devamda alt tip soruları hatırlanıyor (teste 3 dokunuş). Aynı gün kapat-aç aynı atağa ve 1 saatlik teste dönüyor; `#/hasta/atak/treat` manevra açmıyor. Günlük ve gün sınırı ana ekranda; sınır doluyken kapatılan atakta sınır kartı çıkıyor; aktif atakta sınırda "Manevrayı tekrarla" yok. 1. soruda düğmeler görünür alanda. | – | Evet (`edges.mjs` 1–10, `close-limit.mjs`, `dose3.mjs`) |
| 4 | Düşük | Taraf sorusu (her atakta) | Yalnız test sırasını belirliyor ama her atakta sıfırdan soruluyor. | Son atağın test tarafı seçeneklerde üstte ve "geçen sefer: sağ" notuyla dursun; seçim yine kullanıcıda olsun ve iki taraf yine test edilsin. | Evet (gözlem) |
| 5 | Düşük | Hazırlık ekranı (tekrarlayan kullanıcı) | Beşinci atağımda da aynı uzun liste ve yatak resmi geliyor; tek gerekli dokunuş "Hazırım". | Daha önce manevra yapmış kullanıcıda liste katlanmış gelsin ("Hazırlığı göster"); "Hazırım" ilk ekranda kalsın. | Evet (gözlem) |

Yeni bir hata bulamadım. Konsolda hata yok.

## 4. Sevdiklerim
- Hız ile güvenlik dengesi oturdu: sorular eksiksiz, ama bildiğim soruda beni bekletmiyor. Yeni ya da değişen soruda ise
  sonuna kadar dinletiyor.
- Kör dokunuşa dayanıklı acil onayı: başlık neyi onayladığımı söylüyor, parmağımın altında hep "Yanlış dokundum" var.
- Hiçbir yoldan (kapat-aç, adres, devam, geri tuşu) sınır ya da tekrar testi atlanamıyor, ama uygulama bunu suçlamadan, "ne
  zaman yapabilirsin" diyerek söylüyor.

## 5. Memnuniyet
**9/10.** 3. turdaki üç isteğimin üçü de karşılandı. Tekrarlayan atakta manevraya 5,5 dk ve 23 dokunuşla, ekrana bakmadan
ulaşıyorum; önceki düzeltmelerin hiçbiri bozulmamış. 10 olmamasının nedeni yalnız küçük konfor istekleri: her atakta sıfırdan
sorulan taraf sorusu ve hep uzun gelen hazırlık ekranı.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Evet.** Koşul, uygulamanın zaten şart koştuğu şey: hekim
tanısı konmuş, tekrarlayan arka kanal BPPV'si olan biri.
