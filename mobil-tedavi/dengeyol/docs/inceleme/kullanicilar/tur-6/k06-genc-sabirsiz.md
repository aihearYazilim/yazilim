# Tur 6 · k06 · Can (31, yazılımcı, sabırsız tekrarlayan kullanıcı)

## 1. Ben kimim, ne yapmaya çalıştım
Aynı Can'ım: travma sonrası BPPV, 6 ayda 4. atak, sağ arka kanal tanılı, iPhone 13, koyu tema, metin okumuyorum. Bu turda üç şey yaptım:
- 5. turdaki üç isteğime kendi gözümle baktım.
- `e2e/run-e2e.mjs`'ye eklenen iki "Tur 5 kilidi" senaryosunu okuyup kendi kenar durumlarımla karşılaştırdım.
- İki ataklı ölçümü ve bütün kenar durumlarını yeniden denedim: önce bu sürümde ilk kez (×20 hız), sonra aynı cihazda iki gün
  sonra (gerçek hız).

Sunucu `http://localhost:4183/`. Betikler ve ekran görüntüleri:
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-6/k06-genc-sabirsiz/`
(`main4.mjs`, `edges.mjs`, `after2.mjs`, `dose3.mjs`, `close-limit.mjs`; `main.log`, `edges.json`, `a1-*`, `a2-*`, `ekran/`).

## 2. Yaşadıklarım
**1. atak (bu sürümde ilk kez):** 14 güvenlik sorusu 37 sn sürdü; ilk okunuş kilidi beklendiği gibi açık. Yanıtladığım sorular kaydedildi.

**2. atak (aynı cihaz, iki gün sonra, gerçek hız):**
| Saniye | Etkin dokunuş | Ne oldu |
|---|---|---|
| 0 | 1 | "Baş dönmem başladı". |
| **11,8** | 15 | 14 güvenlik sorusu; yalnız kısa çift dokunuş kilidi var. |
| 13,7 | 17 | İki alt tip sorusu. |
| 15,3 | 19 | Taraf sorusu (yine sıfırdan), Hazırlık (yine tam liste), "Hazırım". |
| 167 | 19 | Yerleştirme ölçümü ve sol test. |
| 199 | 20 | 30 sn dinlenme. |
| 323 | 22 | Sağ testte baş dönmesi işareti (2 dokunuş). |
| **329,3** | **23** | Tek dokunuşla Epley başladı. **5 dk 29 sn, 23 etkin dokunuş, 0 kaydırma.** Tur 5: 5 dk 28 sn; tur 4: 5 dk 30 sn. Sonuç kararlı. |
| 593 | 24 | Önce "telefonu alın", sonra "İyiyim". Bitişte 10 dk sayaç ve tekrar testi saati var. Konsolda hata yok. |

## 3. Sorunlar ve 5. kullanımdaki isteklerim
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Düşük | 5. kullanımdaki isteğim #1, testsiz yedi davranış da kilit senaryolarına: **kısmen** | İstediğim iki öncelikli davranış eklendi: (a) "Tur 5 kilidi: seçenek ekranlarında çift dokunuş" — son güvenlik sorusundan ilk seçeneğe ve seçenekten seçeneğe; görülmeden yanıtlanan soru olmadığını da denetliyor. (b) "Tur 5 kilidi: 1. soruda düğmeler görünür" — sık tekrar uyarısıyla iPhone 13'te Evet/Hayır'ın görünür alanda olduğunu ve sayfanın kaydırılmadan açıldığını denetliyor. Beşi hâlâ testsiz: sistem geri tuşunun önceki soruya dönmesi, devamda alt tip yanıtlarının hatırlanması, gün sınırı kartı, arka plana alınca duraklatma, kapatırken uyarı. | Kalan beşi de bir "kilit" senaryosuna bağlansın. Çift dokunuş senaryosuna "Süre"den taraf sorusuna geçiş de eklensin; o geçişi ben denedim ve çalışıyor. | Evet (testleri okudum; yedi davranışın yedisini de bu sürümde kendim denedim, hepsi çalışıyor: `edges.mjs` 1, 2, 2c, 3, 4, 5, 9) |
| 2 | Düşük | 5. kullanımdaki isteğim #2, taraf sorusunda "geçen sefer" notu: **karşılanmadı** (sentezde yine "sonraki sürüm") | Taraf sorusu her atakta sıfırdan soruluyor; yükü 1 dokunuş. | Sonraki sürümde son atağın test tarafı notla üstte dursun; seçim ve iki taraflı test aynen kalsın. | Evet (`ekran/18-a2-taraf-sorusu.png`) |
| 3 | Düşük | 5. kullanımdaki isteğim #3, hazırlık listesinin katlanması: **karşılanmadı** (aynı gerekçe) | Beşinci atakta da tam liste geliyor; "Hazırım" yine tek dokunuş ve kaydırma gerekmiyor. | Önceden manevra yapmış kullanıcıda liste katlı gelsin. | Evet (`a2-prep.txt`, `ekran/19-a2-hazirlik.png`) |
| 4 | – | Önceki turlarda düzelenler | Bozulma yok. Aynı yere kör dokunuşlar acil kaydı açmıyor; durum "active" kaldı ve "Yeni belirti var — doğru mu?" başlığı görünüyor. Seçeneklerde ve son soruda çift dokunuş yutuluyor. Kilit soluk görünüyor. 1. soruda düğmeler görünür alanda. Sistem geri tuşu önceki soruya dönüyor; testte duraklatıyor. Arka plana alınca yürütücü duraklıyor. Kapatırken uyarı geliyor; devamda teste 3 dokunuş. Aynı gün kapat-aç aynı atağa dönüyor ve yeni atak açılmıyor; `treat` adresi manevra açmıyor. Günlük ve gün sınırı kartları çıkıyor, başlat düğmesi yok; kapatılan atakta da sınır kartı var. Aktif atakta sınırda yalnız "Rapor" ile "Atak geçti, kapat" var. 2. atakta okuma kilidi yok. | – | Evet (`after2.mjs`, `close-limit.mjs`, `dose3.mjs`, `edges.mjs`, `main4.mjs`) |

Yeni bir hata bulamadım.

## 4. Sevdiklerim
- Tekrarlayan atakta sorular ~12 sn, manevraya ~5,5 dk ve 23 dokunuş. Üç turdur aynı; benim için "hızlı ama atlanamaz" dengesi oturdu.
- 1. ve 2. turlarda bulduğum hatalar (çift dokunuşun sonraki soruyu yanıtlaması, ekran dışında kalan düğme) artık otomatik testle
  korunuyor.
- Kör dokunuşa, kapat-aç hilesine, doğrudan adrese ve geri tuşuna karşı sağlam. Sınır ve sıradaki adım her zaman ana ekranda yazılı.

## 5. Memnuniyet
**9/10.** Kalan isteklerim düşük önemde, bilerek ertelenmiş konfor işleri ve birkaç testsiz kenar durumu. Davranış olarak hepsi
çalışıyor; güvenlikle ilgili bir eksiğim yok.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Evet.** Koşul, uygulamanın zaten şart koştuğu şey: hekim
tanısı konmuş, tekrarlayan arka kanal BPPV'si olan biri.
