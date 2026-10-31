# Tur 4 (son) — k02 yardımcı evlat (Elif, 44, bankacı)

## 1. Ben kimim, ne yapmaya çalıştım
Annem 74 yaşında; sol arka kanal BPPV, hasta kodlu (KBB-1042) Epley reçetesi var. Annemin iPhone'una (iPhone 13 öykünümü, boş
localStorage, sunucu 4181) baştan kurdum. Bu kez her şeyi **gerçek hızda (×1)** yaptım: kurulum, 14 soru, kalibrasyon, Epley,
ertesi gün tekrar testi, rapor. Ses, titreşim ve bipleri zamanlarıyla kaydettim. 3. turdaki isteklerimi, en çok da yanlış yana
yuvarlamayı, yeniden denedim.

## 2. Yaşadıklarım (kısa günlük)
- **Reçete ve kurulum**:
  - "Hasta adına yakını olarak kuruyorum" kutusunu işaretleyince uygunluk ekranının başlığı "**Hasta için uygun mu?**" oldu.
  - Maddeler hastaya göre yazılmış ("Boyun sorunu: Hastanın boynunda hastalık var…"); her maddenin başında kısa ad var.
  - Ana ekranda "~8 dk (gerekirse kısa test)" yazıyor; doğru.
- **Hazırlık** artık bana göre yazılmış: "Hastayı yatağın üzerine oturtun", "Telefonu … hastanın alnına bastırın", "Hastanın başı
  dönerse ekrana siz dokunun". Yalnız işitme cihazı notu hâlâ "İşitme cihazı kullanıyorsanız… ya da bir yakınınızla yapın" diyor;
  zaten yakını benim.
- **Manevra (çevrik ekran, ×1)**: Ses ve başlıklar 3. turdaki gibi bana konuşuyor. Sağ/sol okları her adımda doğru. Oturuş
  adımında "çevirdiyseniz öyle tutun" deniyor, ~9 sn bekleniyor. Baş dönmesi işareti, Duraklat (kısa dokunuş durdurmuyor, basılı
  tutunca duruyor) ve geri tuşu (duraklatıyor, çıkmıyor) çalışıyor. Duraklatma sayfası yardımcı dilinde; "Şimdilik bırak" üstünde
  2,5 sn basılı tutmak manevrayı bitirmedi, devam etti.
- **4. adımda yanlış yana yuvarlama (gerçek hız)**: Annemi soluna (θ −90°) çevirdim. Kayıtta olanlar:
  - **Aynı anda (0,0 sn)**: altı kesik titreşim `[220,110…]`, iki tonlu ayrı bip (698/466 Hz) ve hemen "**Dur! Yanlış taraf.**"
    (~1,3 sn). Ekranda da kırmızı "DUR — yanlış taraf" kutusu.
  - **+1,7 sn**: "Hastayı önce sırtüstüne getirin, sonra bütün vücuduyla sağ yanına çevirin." Bu cümle **sonuna kadar okundu**.
    Yinelemeler ancak önceki cümle bittikten ~2,5 sn sonra geliyor; hiç kesilmedi.
  - Sırtüstüne getirince "Hastayı bütün vücuduyla sağ yanına çevirin" dendi; sağ yana gelince adım normal tamamlandı. Raporda
    adıma "önce yanlış tarafa dönüldü" yazıldı.
- **Yüzüstünden geçme denemesi (×1)**: kabul edilmedi. Uyarı ~7,7 sn arayla tam cümle olarak yinelendi. 71 sn sonra uzun
  titreşimle durduruldu ve ses bana göre konuştu: "Hasta yanlış taraftan doğru yana getirilemedi; burada bırakıyoruz. Hastayı
  önce sırtüstüne getirin, sonra yavaşça oturtun." Bitiş ekranı da doğru gerekçeyi yazıyor:
  - "Manevrada yanlış tarafa dönüldü… **Bu, boyun ya da bel sorunu olduğu anlamına gelmez**."
  - "Durulan yer: Epley sol, 4. adım…"
  - İki küçük pürüz: ekrandaki metin hastaya hitap ediyor ("Önce sırtüstüne **dönün**, sonra yavaşça **oturun**"). "Dönüş hedefe
    en yakın ~90° uzak kaldı" yazıyor; oysa yüzüstünden geçerek hedef açıya gelmiştim, kabul edilmemişti.
- **Sonrası**: "Şu an nasılsınız?", 10 dk dinlenme sayacı ve takvim hatırlatıcısı çalıştı.
- **Ertesi gün tekrar testi**: seçimlerim hatırlanmıştı. Dix-Hallpike yardımcı diliyle ilerledi; başı düz bıraktığımda
  "[←] HASTANIN SOLUNA" dedi, doğru. Sonuç: "Baş dönmesi gelmedi, yarın sabah bir kez daha bakalım."
- **Rapor**:
  - Hasta kodu, reçete kodu ve "yakını eşliğinde" yazıyor; "2 kez duraklatıldı" ve "önce yanlış tarafa dönüldü" de var.
  - Baş dönmesi "gecikme 8 s, süre 3 s" olarak kayıtlı; ekranda işaretlediğim süreyle tutuyor.
  - Yeni: rapor hekime **QR kodla** gösterilebiliyor ("internet gerekmez").

Not (sorun saymadım): Demo modunda anneme söylenen "Siz kıpırdamayın; başınızı yakınınız çevirecek" cümlesi ×1'de de 3 sn'de
ilk yönergeyle kesildi. Kodda gerçek kullanımda (demo kapalıyken) bu cümlenin sonuna kadar beklendiği görülüyor
(`RunnerView.tsx`, `!settings.simulation` dalı). Gerçek telefonda bir kez denenmeli.

## 3. Sorunlar ve 3. kullanımdaki isteklerim
| # | Önem | Yer (ekran/adım, dosya:satır) | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| T3-Y1 | — | Yanlış taraf sesli uyarısı (`core/runner.ts:94-99, 555`) | **3. kullanımdaki isteğim: karşılandı.** 0 sn'de ayrı titreşim, iki tonlu bip ve "Dur! Yanlış taraf."; 1,7 sn'de tam yönerge, kesilmeden; yinelemeler cümle bittikten sonra | — | Evet (×1 ses/titreşim/ton kaydı, p2 ve p4) |
| T3-Y2 | — | Yanlış tarafta durdurma gerekçesi (`core/runner.ts:169-200`) | **Karşılandı.** Ses ve ekranda "yanlış tarafa dönüldü, doğru yana gelinemedi; boyun/bel sorunu anlamına gelmez" + durulan yer | Küçük pürüzler için bkz. Y1 | Evet (e03) |
| T3-Y3 | — | Yakını modunda uygunluk listesi ve hazırlık | **Karşılandı.** "Hasta için uygun mu?", maddeler hastaya göre; hazırlık maddeleri yardımcıya göre | İşitme cihazı notu için bkz. Y2 | Evet (a04, b05) |
| Y1 | Düşük | Yanlış taraf bitiş ekranı (`core/runner.ts:183`) | Ses yardımcıya ("Hastayı… oturtun"), ekran metni hastaya ("dönün… oturun"). "Hedefe en yakın ~90° uzak kaldı" ifadesi, yüzüstünden geçerek hedef açıya gelinen durumda yanıltıcı | Yakını modunda ekran metni de "Hastayı önce sırtüstüne getirin, sonra yavaşça oturtun". Yüzüstünden gelindiyse "hedef açıya yüzüstünden geçilerek gelindi; kabul edilmedi" | Evet (e03, ses-p4) |
| Y2 | Düşük | Hazırlıktaki işitme cihazı notu, yakını modunda | "İşitme cihazı kullanıyorsanız… ya da bir yakınınızla yapın" hastaya konuşuyor; yakını zaten orada | "Hastanın işitme cihazı varsa…"; yakını modunda "bir yakınınızla yapın" kısmı çıkarılsın | Evet (b05) |
| Y3 | Düşük | Kurulum, "yakını olarak kuruyorum" | "Kim yapıyor" kendiliğinden "yakınımla" geliyor, ama "başucunda duracağım (ekranı çevir)" ilk atakta ayrıca işaretlenmeli | Bu kutu kurulumda yakını seçilince birlikte sorulsun | Evet (a03, b06) |

## 4. Sevdiklerim (bozulmasın)
1. Yanlış yana yuvarlanınca **aynı anda** gelen ayrı titreşim, iki tonlu bip ve "Dur! Yanlış taraf.", ardından kesilmeyen tam
   yönerge. Ekranı görmediğim adımda tek güvencem bu.
2. Kurulumdan duraklatma sayfasına, tekrar testine ve durdurma sesine kadar uygulamanın bana (yardımcıya) konuşması; anneme tek cümle.
3. Hekime giden rapor: hasta/reçete kodu, "yakını eşliğinde", duraklatmalar, yanlış taraf, durulan yer ve QR ile aktarım.

## 5. Memnuniyet
**9,5/10** (1. tur 7 → 2. tur 8 → 3. tur 9 → 4. tur 9,5). Dört turdur istediğim her şey yapıldı. En büyük korkum (yanlış yöne
çevirip anneme zarar vermek) artık anında, gözüm ekranda olmasa da yakalanıyor. Kalan üç madde yalnız metin pürüzü.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Evet.** Koşulu: hastanın hekim tanısı ve reçetesi olsun, yanında
bir yakını bulunsun ve atak gelmeden önce bir kez "Deneme manevrası" yapılsın. Ayrıca, kendi deneyimimin dışında bir not: açı
ölçümü gerçek telefonda henüz doğrulanmadı (öykünüm + demo sensör); bu da pilotta doğrulanmalı.

Betikler, ses/titreşim/ton kayıtları ve ekran görüntüleri:
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-4/k02-yardimci-evlat/`
(p1 kurulum, p2 manevra ×1, p3 ertesi gün ve rapor ×1, p4 uzun basış ve yüzüstünden geçiş ×1; `ses-p*.txt` içinde VIB/TONE/MARK
satırları).
