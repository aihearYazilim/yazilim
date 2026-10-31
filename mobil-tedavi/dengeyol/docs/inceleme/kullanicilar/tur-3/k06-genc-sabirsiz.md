# Tur 3 · k06 · Can (31, yazılımcı, sabırsız tekrarlayan kullanıcı)

## 1. Ben kimim, ne yapmaya çalıştım
Aynı Can'ım: travma sonrası BPPV, 6 ayda 4. atak, sağ arka kanal tanılı, iPhone 13, koyu tema, metin okumuyorum. 2. turdaki
isteklerime kendi gözümle baktım. Süre ve dokunuş ölçümünü gerçek hızda tekrarladım; aynı kenar durumlarını yeniden denedim.

Test koşulu öncekilerle aynı: tohumlanmış geçmiş, kayıtlı kalibrasyon, demo sanal sensör, kaydedilen ses (~13 karakter/sn),
insan hızında (350 ms arayla) ham dokunuşlar. Betikler ve ekran görüntüleri:
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-3/k06-genc-sabirsiz/`
(`main.mjs`, `edges.mjs`, `after2.mjs`, `dose3.mjs`, `close-limit.mjs`; `ekran/`, `main-speech.json`, `edges.json`).

## 2. Yaşadıklarım (gerçek hız)
| Saniye | Etkin dokunuş | Ne oldu |
|---|---|---|
| 0 | 1 | "Baş dönmem başladı". |
| 0,8 | – | 1. soru: Evet/Hayır artık ekranda; kaydırma gerekmedi. Sık tekrar uyarısı en altta tek satır: "Son 6 ayda 4 atak yaşadınız… (ayrıntı sonda)". |
| **37,8** | 15 | 14 güvenlik sorusu. Her soruda düğmeler soru okunurken (en çok 2,5 sn) soluk ve kilitli. **Tur 2'de 11 sn sürmüştü, şimdi 38 sn.** Hızlı bastığım için 81 dokunuşum boşa gitti. Soruları ezbere bilen tekrarlayan kullanıcı olarak, her atakta 14 kez 2,5 sn beklemek beni bu turda en çok sinirlendiren şey oldu. |
| 40,0 | 17 | İki alt tip sorusu. Seçince ses hemen kesiliyor; bu iyi. |
| 41,2 | 19 | Taraf sorusu, sonra "Hazırım". |
| 193 | 19 | Yerleştirme ölçümü (~30 sn), ardından sol test. Yönergeler kısalmış ("yarıya kadar gelsin"). |
| 225 | 20 | 30 sn dinlenme; nedeni yine söyleniyor. |
| 349 | 22 | Sağ testte baş dönmesini işaretledim (2 dokunuş). |
| **355,6** | **23** | Geçiş ekranında tek dokunuşla Epley başladı. **5 dk 56 sn, 23 etkin dokunuş, 0 kaydırma.** Tur 2: 5 dk 30 sn / 23 / 1 kaydırma. Tur 1: 5 dk 26 sn / 20. Aradaki ~26 sn tamamen sorulardaki okuma kilidinden geliyor. |
| 620 | 24 | Manevra bitince önce yalnız "Telefonu alnınızdan alın ve ekrana bakın" deniyor; soru dokununca okunuyor. "İyiyim" dedim. Bitiş ekranında 10 dk dinlenme sayacı var; sık tekrar uyarısı burada hem yazılı hem sesli. Doğru yer. |

## 3. Sorunlar ve 2. kullanımdaki isteklerim
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Orta | YENİ: güvenlik soruları, ilk okunuş kilidi (`Controls.tsx` `useReadLock`, `FIRST_READ_LOCK_MAX_MS` = 2500) | Her soruda kilit ses bitene ya da 2,5 sn dolana kadar sürüyor. 14 soru tur 2'de 11 sn sürmüştü, şimdi 38 sn; insan hızında 81 dokunuşum boşa gitti. Yaşlı ya da yavaş okuyan biri için anlıyorum, ama tekrarlayan kullanıcıyı her atakta aynı yavaşlıkta tutuyor. | Sorular ve yanıtlar aynen kalsın (kırmızı çizgi). Uzun okuma kilidi yalnız bu kişiye o soru ilk kez sorulurken ya da soru metni değişmişse uygulansın. Daha önce aynı metni yanıtlamış kişide kilit eski 0,6 sn'ye dönsün; "Tekrar dinle" yine dursun. | Evet (`main.mjs`, `main-speech.json`: soru başına ~2,7 sn) |
| 2 | Düşük | YENİ: "Doğru mu?" onay ekranı (`EpisodeFlow.tsx` ConfirmAnswer) | Yeni yerleşimde "Evet, doğru" üstte, "Yanlış dokundum" dokunduğum yerde. Ama onaylanan yanıtın kendisi ekranın altına itilmiş: "Yanıtınız aşağıda yazıyor" yazıyor, ortada boş alan var. Neyi onayladığımı görmek için kaydırmam gerekiyor; yalnız sesle duyuluyor. | Yanıtın kısa adı en üst satırda dursun: "Yeni belirti var — doğru mu?". Düğme yerleşimi aynen kalsın. | Evet (`ekran/01-after2-y540.png`) |
| 3 | – | 2. kullanımdaki isteğim #1 "Şu an nasılsınız?" onayında iki kör dokunuş: **karşılandı** | "Yeni belirti" yerine 1,1 sn arayla tekrar tekrar kör dokundum. Ekran hep onay ile soru arasında gidip geldi; acil kaydı ya da kilit oluşmadı. "Kusma" yerinde de aynı sonuç. Açılıştaki ilk dokunuş yine yutuluyor. | – | Evet (`after2.mjs`, `edges.mjs` A) |
| 4 | – | 2. kullanımdaki isteğim #2 sık tekrar uyarısının yeri: **karşılandı** | 1. soruda en altta tek satır; düğmeler görünür alanda. Sesli hâli 1. sorudan önce değil, bitiş ekranında okunuyor. | – | Evet (`ekran/02-soru-1.png`, `main-speech.json`) |
| 5 | – | 2. kullanımdaki isteğim #3 alt tip yanıtlarının hatırlanması: **karşılandı** | Yarıda bırakıp "Ataka devam et" deyince doğrudan taraf sorusu geldi; teste 3 dokunuşta döndüm (tur 2'de 5). | – | Evet (`edges.mjs` 5) |
| 6 | – | 2. kullanımdaki isteğim #4 sınır doluyken yeniden açılabilir atak: **karşılandı** | Atağı kapatınca ana ekranda "Bugünlük manevra sınırı doldu… en erken 01 Kasım 06:00" kartı çıkıyor, başlat düğmesi yok. Çelişkili "Manevrayı tekrarla" cümlesi kalktı. | – | Evet (`close-limit.mjs`, `edges.mjs` 8) |
| 7 | – | Önceki turlardan korunanlar | Seçeneklerde çift dokunuş yutuluyor. Aynı gün kapat-aç aynı atağa ve tekrar testine dönüyor. `#/hasta/atak/treat` manevra açmıyor. Aktif atakta sınır doluyken "Manevrayı tekrarla" yok. Gün sınırı ana ekranda. Sistem geri tuşu önceki soruya dönüyor. Arka plana alınca yürütücü duraklıyor; sesli "boynunuz ağrıyorsa oturabilirsiniz, devam için 2 sn basılı tutun" yönergesi var. Kapatırken uyarı geliyor. | – | Evet (`edges.mjs` 2, 3, 4, 6, 9, 10) |

Not: Ekranın ortasına (y=300) kör bir dokunuş "Hafif baş dönmesi ya da bulantı var" olarak kaydedildi. Bu yanıt hiçbir şeyi
kilitlemiyor; zararsız buldum ve sorun saymadım.

## 4. Sevdiklerim
- Kör dokunuş korkum bitti: acil yanıtı artık yalnız bilerek, "Evet, doğru"ya ayrıca dokunarak veriliyor. Tekrar tekrar
  dokunmak beni hep soruya geri döndürüyor.
- Sınırlar ve plan her zaman önceden ve tek yerde: ana ekran ne zaman yapabileceğimi söylüyor. Kapat-aç, doğrudan adres ya da
  devam düğmesiyle sınır ya da tekrar testi atlanamıyor.
- Telefon alındayken akış sesle yürüyor. Manevra sonunda önce "telefonu alın" deniyor, soru sonra okunuyor; sık tekrar
  uyarısı da artık doğru yerde, en sonda.

## 5. Memnuniyet
**8/10.** 2. turdaki dört isteğimin dördü de karşılandı; güvenlik tarafında şikâyetim kalmadı. Puan 9 olmadı, çünkü
güvenlik sorularındaki yeni 2,5 sn'lik okuma kilidi beni her atakta ~26 sn fazladan bekletiyor ve 80 dokunuşumu boşa
çıkarıyor. Benim gibi tekrarlayan bir kullanıcı için bu tam olarak "mantıksız yavaşlatma".

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Evet.** Güvenli ve atlatılamıyor; yavaşlık sinir bozucu ama
zararsız.
