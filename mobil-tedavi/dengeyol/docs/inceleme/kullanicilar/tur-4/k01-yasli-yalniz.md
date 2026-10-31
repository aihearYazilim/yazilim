# k01 — Hatice (72, yalnız yaşıyor) · tur-4 (son)

## 1. Ben kimim, ne yapmaya çalıştım
72 yaşında emekli bir öğretmenim, yalnız yaşıyorum. Sağ arka kanal BPPV'm var; hekimim "2 hafta önce" tanı koydu, reçete bağlantısı vermedi.
Pixel 7 kullanıyorum; yazı "Büyük", konuşma "Yavaş". Telefon verisini silip ilk kurulumdan başladım ve gerçek hızda (×1) baştan sona
kullandım: kurulum, 14 güvenlik sorusu, iki taraf testi, Epley, 1 saat sonra tekrar testi, rapor. 3. turda istediklerimi bilerek yeniden
denedim: baş dönmesi sırasında duraklatma sayfasına kör dokunuş, kalıcı düğmeler, son hatırlatma.

## 2. Yaşadıklarım (günlük)
- **Kurulum:**
  - "Tanı ne zaman kondu?" sorusunda "Son 2 hafta içinde" seçeneğinin altında **"Hekiminiz '2 hafta önce' dediyse de bunu seçin"**
    yazıyor; artık duraksamadım. Kâğıttaki tarihi (bugünden tam 14 gün önce) girdiğimde "2 haftadan eskiyse…" notu çıkmadı.
  - Uygunluk listesi kısa adlarla okunuyor ("Boyun sorunu", "Retina sorunu…"), ama "Yavaş" seste hâlâ ~90 s. Ben okurken dokununca susuyor.
- **Güvenlik soruları:** Ortostatik ve kan sulandırıcı soruları anlaşılır. "Farklı mı?" sorusunda ölçüt de söyleniyor ("yatarken ya da
  kalkarken başlayan, saniyeler süren"); 21 s, ama bence gerekli.
- **Alt tip, süre, taraf:** Artık yalnız soru ve seçenek adları okunuyor: 24 s, 22 s ve 18 s (3. turda 27, 32 ve 33 s).
  Hazırlık ekranı da kısaca okunuyor ("Yatağa oturun; yastık omuzlarınızın altına gelsin. Sesi açın…").
- **İki taraf testi ve Epley (×1):** 3. turdaki iyi davranışlar korunmuş.
  - Pozisyona gelince "Tamam, böyle kalın" 1 s içinde geliyor ve eski ipucunu kesiyor.
  - "Zorlamayın" uyarısı yalnız ben ~10 s kıpırdamadan bekleyince geldi; düzeltince hemen kesildi.
  - Baş dönmesinin 15. saniyesinde sakin bir hatırlatma geliyor; dokununca "Geçti olarak işaretlendi" anında söyleniyor.
  - En uzun sessizlik ~8 s.
- **Sonrası:**
  - "Telefonu alnınızdan alın ve ekrana bakın." dendi; "Şu an nasılsınız?" sorusunu ekrandan okudum (sesli okunmadı).
  - "Hafif" dedim. Ses artık kısa (13 s): "Hafif baş dönmesi normaldir. On dakika oturun; tutunarak kalkın. Saat 16:36 civarında tekrar
    test edeceğiz." Ayrıntısı ekranda ve "Ayrıntıyı dinle" düğmesinde.
- **1 saat sonra:** Tekrar testinde baş dönmesi gelmedi, sabah testi önerildi. Raporda tanı tarihi, doz özeti ve onam sürümü var;
  paylaşılan metin düz ve okunur.
- **Hatalar (×1):**
  - **B1 — düğmeye kör basılı tutma:** Geri tuşuyla duraklattım, gözüm kapalı "Şimdilik bırak" düğmesine 2,3 s basılı tuttum.
    Manevra **devam etti** (3. turdaki düzeltme korunmuş).
  - **B2 — baş dönmesi işaretliyken kör dokunuş:** Başım dönerken duraklattım. Ses önce eylemi söyledi ("Devam için ekrana iki saniye
    basılı tutun. Baş dönmesi geçtiyse ekrana bir kez dokunun…"). Geçince gözüm kapalı bir kez dokundum; parmağım yine
    "Pozisyona gelemiyorum" düğmesine denk geldi. Bu kez yalnız **"geçti"** sayıldı: test bitmedi, kilit yok. Sonra 2 s basılı tuttum,
    devam etti. 3. turdaki en büyük sorunum çözülmüş.
  - **B3 — onay isteyen düğmeye kör dokunuş:** Baş dönmesi yokken "Kendimi kötü hissediyorum"a kör dokundum. Uygulama "Emin misiniz?
    Onaylamak için ekranın üstündeki 'Evet' düğmesine dokunun…" dedi; aynı yere ikinci kör dokunuşum hiçbir şey yapmadı. Güvenli.
  - **B4 — gerçekten kötüyken onay:** Bu kez gerçekten kötüymüş gibi "Kendimi kötü hissediyorum"a bilerek dokundum. "Yavaş" seste
    onay cümlesi **12,8 s** sürüyor. Cümleyi sonuna kadar dinleyip ekrana baktığımda **"Evet" düğmesi kaybolmuştu**; onay süresi
    5 s (`core/pauseSheet.ts`, `CONFIRM_WINDOW_MS = 5000`). Yavaş biri, gerçekten kötüyken bu yolu ilk denemede kullanamaz.
  - **Unutulan dokunuş:** Hatırlatmalar 15, 45, 75 ve 105. saniyede geliyor. Son hatırlatma artık kısa ("…15 saniye içinde dokunulmazsa
    manevrayı durduracağım", 10,5 s) ve 120. saniyedeki durdurma cümlesinden önce bitiyor.
- **Ses yeterli mi?** Evet. Demo modunda kalan kesilmeler ("Başlıyoruz…", tanıtma cümleleri) tahmini sürelerden kaynaklanıyor; gerçek
  sensörde konuşmanın bitişi bekleniyor (kod), bunu gerçek modda doğrulayamadım.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Orta–Yüksek | Duraklatma, "Kendimi kötü hissediyorum" onayı; `core/pauseSheet.ts` (`CONFIRM_WINDOW_MS = 5000`) | Onay cümlesi "Yavaş" seste 12,8 s; "Evet" düğmesi 5 s sonra kayboluyor. Talimatı dinleyen yavaş, gerçekten kötü olan hasta onaylayamıyor. | Onay süresi cümle bittikten sonra başlasın ve en az 15 s sürsün; ya da cümle kısalsın ("Eminseniz üstteki Evet'e dokunun"). Kör ikinci dokunuş koruması aynen kalsın. | Evet (×1, 0,8 hız) |
| 2 | Düşük | Manevra sonrası "Şu an nasılsınız?" | Telefonu alınca soru sesli okunmuyor; gözlüksüz okumak zor ("Tekrar dinle" var). | Telefon alından inince ya da ekrana ilk dokunuşta soru ve kısa seçenekler bir kez okunsun. | Evet (ses kaydı) |
| 3 | Düşük | Kurulum uygunluk listesi | "Yavaş" seste ~90 s. | Önce "Size uyan varsa işaretleyin; hiçbiri uymuyorsa en alttakini seçin" denip tam liste "Tekrar dinle"de okunsun. | Evet |
| 4 | Düşük | Duraklatma sesi | Eylemle başlıyor (iyi) ama "Yavaş" seste 21,6 s; dokununca kesiliyor, sorun değil. | Ek bilgi ikinci cümlede kalabilir; şimdiki hâli de kabul edilebilir. | Evet |

**3. kullanımdaki isteklerim**
| Tur-3 # | İsteğim | Durum | Not |
|---|---|---|---|
| 1 | Duraklatma sayfasında kalıcı düğmeler kör tek dokunuşla tetiklenmesin; baş dönmesi işaretliyken ilk dokunuş "geçti" sayılsın | Karşılandı | B2: "Pozisyona gelemiyorum" üstüne kör dokunuş yalnız "geçti" oldu. B3: ilk dokunuş onay istedi, ikinci kör dokunuş onaylamadı. B1 korunmuş. Onay süresi yavaş kullanıcıya kısa (#1). |
| 2 | Hekimin "2 hafta önce" dediği tanı yakın sayılsın | Karşılandı | Seçeneğin altında açık not var; 14 gün önceki tarih "eski" notu çıkarmadı. |
| 3 | "Yavaş" seste uzun sesli metinler kısalsın | Büyük ölçüde karşılandı | Alt tip/süre/taraf 24, 22 ve 18 s; manevra sonrası 13 s; hazırlık kısa okunuyor. Kurulum uygunluk listesi hâlâ ~90 s (#3). |
| 4 | Son hatırlatma 120 s durdurma cümlesiyle kesilmesin | Karşılandı | 10,5 s'lik kısa cümle durdurmadan önce bitiyor. |
| 5 | Manevra sonrası soru, telefon alınınca sesli okunsun | Karşılanmadı | Sentezde yok; "Tekrar dinle" ile dinlenebiliyor (#2). |
| (eski) | Hatırlatıcı .ics | Bilerek kaldı | Gerekçe sentezde (ağsız PWA). Düğme metni ve gece notu iyileşti. |

## 4. Sevdiklerim
- Duraklatma sayfasının artık kör kullanıma dayanıklı olması: basılı tutmak hep "devam", baş dönmesinde ilk dokunuş hep "geçti",
  kalıcı seçimler onay istiyor.
- Sesin zamanlaması: "Tamam" hemen, "Geçti" hemen; "zorlamayın" yalnız gerçekten takılınca; hatırlatmalar korkutmadan ve dürüst.
- Kısalan sesli metinler ve "Ayrıntıyı dinle / Tekrar dinle": yavaş seste bile soruyu unutmadan yanıtlayabiliyorum.

## 5. Memnuniyet
**9/10.** Dört turda beni korkutan ya da yanlış yere kilitleyen bütün yollar kapandı. Tek başıma, gece, ekrana bakmadan manevrayı
bitirebiliyorum. Tam puan vermiyorum, çünkü gerçekten kötü hissettiğimde "Kendimi kötü hissediyorum"u yavaş seste onaylayamadım
(süre, talimat bitmeden doluyor).

**Bu sürümü bir yakınıma önerir miyim: Evet**, şu koşulla: ilk kullanımdan önce baş dönmesi yokken bir kez "Deneme manevrası" yapsın.
O sırada kötü hissederse telefonu alnından alıp ekrandaki üstteki "Evet"e hemen dokunması gerektiğini öğrensin. Bu durum, yukarıdaki
#1 düzeltilene kadar geçerli.

Betikler, ses dökümleri (`p2-ses.txt` gerçek hız ve yavaş ses, `p4pause-ses.txt`, `p4tap-ses.txt`) ve ekran görüntüleri:
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-4/k01-yasli-yalniz/`
