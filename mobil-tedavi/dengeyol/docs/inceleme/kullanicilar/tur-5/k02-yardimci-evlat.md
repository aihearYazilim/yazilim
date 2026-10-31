# Tur 5 — k02 yardımcı evlat (Elif, 44, bankacı)

## 1. Ben kimim, ne yapmaya çalıştım
Annem 74 yaşında; sol arka kanal BPPV, hasta kodlu (KBB-1042) Epley reçetesi var. Annemin iPhone'una (iPhone 13 öykünümü, boş
localStorage, sunucu 4182) yeniden baştan kurdum. Manevrayı başucundan ben yaptırdım, ertesi gün tekrar testini yaptım, raporu
gönderdim. Kurulum ve manevra **gerçek hızda (×1)**; ses, titreşim ve bipleri zamanlarıyla kaydettim. Ek denemelerde uzun
beklemeleri ×5 ile kısalttım, ama yanlış taraf anlarını yine ×1'de ölçtüm. 4. turdaki isteklerimi tek tek denedim.

## 2. Yaşadıklarım (kısa günlük)
- **Kurulum**: "Hasta adına yakını olarak kuruyorum"u işaretleyince hemen altında "**Hastanın başucunda duracağım (ekranı bana
  göre çevir)**" çıktı. İkisini birlikte işaretledim; ilk atakta hazırlıkta yeniden işaretlemem gerekmedi. Uygunluk ekranındaki
  işitme notu da yardımcıya göre ("Hastanın işitme kaybı varsa da kullanılabilir: yönergeler size söylenir…").
- **Hazırlık**: işitme cihazı notu artık şöyle: "**Hastanın işitme cihazı varsa**: yönergeler size söylenir, hastanın duyması
  gerekmez. Cihaz yatarken kayabilir; sabitleyin." Doğru. Maddeler bana göre; yalnız yastık cümlesi hem listede hem yardımcı
  kartında, iki kez geçiyor.
- **Manevra (çevrik ekran, ×1)**: Önceki turlardaki iyi şeylerin hepsi duruyor:
  - ses bana, anneme tek cümle;
  - "HASTANIN SAĞI/SOLU" okları doğru;
  - oturuşta "çevirdiyseniz öyle tutun";
  - Duraklat'a basılı tutmak, geri tuşu ve uzun basışa dayanıklı duraklatma sayfası çalışıyor.
  - Bitiş ekranına yeni bir cümle eklenmiş: "Uyku pozisyonu kısıtlaması ya da boyunluk gerekmez."
- **4. adımda yanlış yana yuvarlama, yavaş ve titrek (×1, θ 0 → −90°, ±3°)**: Annem −30° sınırını geçince **aynı anda** altı kesik
  titreşim, iki tonlu bip ve "Dur! Yanlış taraf." geldi. 1,7 sn sonra tam yönerge okundu, kesilmedi; yinelemeler cümle bittikten
  sonra geldi.
- **Sırtüstüne dönüş**: Uyarıdan sonra annemi sırtüstüne getirince 2 uzun titreşimle "**Tamam, şimdi hastanın sağ yanına.**"
  dendi, ardından "Hastayı bütün vücuduyla sağ yanına çevirin…". Tam istediğim gibi. Adım normal tamamlandı; raporda "önce yanlış
  tarafa dönüldü" yazıyor.
- **Bir pürüz (yeni)**: Ana manevrada başı +45°'den tek seferde −30°'ye (sınırın tam üstüne) getirdim, sonra −90°'ye götürdüm.
  Sırasıyla şunlar oldu:
  - "Dur! Yanlış taraf." 0,1 sn içinde "Tamam, şimdi hastanın sağ yanına." ile kesildi.
  - 0,7 sn sonra annem gerçekten yanlış yana (−90°) geçti; ama **kısa uyarı, titreşim ve iki tonlu bip yeniden gelmedi**.
  - Yalnız ~4,5 sn sonra uzun cümle ("Hastayı önce sırtüstüne getirin…") okundu.
  - Sebep: sırtüstü sınırı 30°'de bir gecikme payı (histerezis) olmadan çalışıyor, kısa uyarı da 5 sn içinde yinelenmiyor
    (`core/runner.ts:1284-1306`, `WRONG_SIDE_REALERT_SEC`).
  - Yavaş ve titrek yuvarlanmada bu olmadı. Ama "yanlışa başladım, fark edip geri döndüm, sonra yine yanlış döndüm" gibi gerçek
    bir durumda olabilir.
- **Yüzüstünden geçme denemesi**:
  - Kabul edilmedi. 72 sn sonra durdu; ses ve **bitiş ekranı** bu kez bana konuşuyor: "Hastayı önce sırtüstüne getirin, sonra
    yavaşça oturtun… Bu, hastanın boyun ya da bel sorunu olduğu anlamına gelmez."
  - "Durulan yer" satırında "~90° uzak" yanılgısı yok, yerine "yanlış taraftan geçilerek gelinen açı kabul edilmez" yazıyor.
  - Hekime giden raporda da durum "Hekime yönlendirildi — hasta yanlış tarafa döndü (döndürüldü) ve doğru yana getirilemedi",
    manevra satırında "durduruldu: yanlış tarafa dönüldü, doğru yana gelinemedi" ve adımda "POZİSYONA GELİNEMEDİ · önce yanlış
    tarafa dönüldü" var.
- **Ertesi gün tekrar testi ve rapor**: "Yakınımla" ve "çevir" hatırlanmıştı. Dix-Hallpike negatif çıktı, "yarın sabah bir kez
  daha bakalım" dendi. Raporda hasta/reçete kodu, "yakını eşliğinde", "2 kez duraklatıldı", "önce yanlış tarafa dönüldü" ve
  baş dönmesi "gecikme 9 s, süre 3 s" var; QR ile gösterme de mevcut.

## 3. Sorunlar ve 4. kullanımdaki isteklerim
| # | Önem | Yer (ekran/adım, dosya:satır) | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| T4-1 | — | Yakını modunda yanlış taraf bitiş ekranı (`core/runner.ts:243`) | **4. kullanımdaki isteğim: karşılandı.** Ekran metni de yardımcıya göre ("Hastayı… getirin… oturtun", "hastanın hekimine") | — | Evet (p4, p7 ekran metni) |
| T4-2 | — | Yüzüstünden gelinen hedefin yazılışı (ekran ve rapor) | **Karşılandı.** "~90° uzak" yanılgısı yok, yerine "yanlış taraftan geçilerek gelinen açı kabul edilmez"; rapor durumu ve adım satırı doğru | (İsteğe bağlı) kural yerine olay: "hedef açıya yüzüstünden geçilerek gelindi" | Evet (p7 rapor) |
| T4-3 | — | Hazırlıktaki işitme cihazı notu (`flowText.ts:143`) | **Karşılandı.** "Hastanın işitme cihazı varsa: yönergeler size söylenir…" | — | Evet (p2 PREP) |
| T4-4 | — | Kurulumda "yakını olarak kuruyorum" → ekranı çevir | **Karşılandı.** Seçenek kurulumda çıkıyor, ayar kaydediliyor | — | Evet (p1, SETTINGS `screenFlip: true`) |
| T4-5 | — | Sırtüstüne dönüşte "Tamam, şimdi hastanın sağ yanına" | **Karşılandı.** 2 uzun titreşim + kısa cümle, ardından tam yönerge | — | Evet (ses-p2w: 257,3 sn) |
| Y1 | Düşük | Yanlış taraf / sırtüstü sınırı (`core/runner.ts:1284-1306`, `evaluator.ts:62` SUPINE_ZONE_DEG = 30) | Sınırın tam üstüne gelen tek bir sıçramada "Dur! Yanlış taraf." 0,1 sn'de "Tamam, şimdi hastanın sağ yanına" ile kesildi. Hemen ardından gerçekten yanlış yana geçilince kısa uyarı, titreşim ve bip 5 sn bastırıldı; yalnız ~4,5 sn sonra uzun cümle geldi | Sınıra gecikme payı (ör. yanlış taraf ≥ 30°, sırtüstü sayılması ≤ 20°); "Tamam, şimdi…" ancak ~1 sn sırtüstünde kalınca; kısa uyarının 5 sn bastırması, arada gerçek bir sırtüstü dönüşü olmadıysa uygulanmasın | Evet (ses-p2w: 240,6–245,8 sn); yavaş ve titrek yuvarlanmada (p6) olmadı |
| Y2 | Düşük | Hazırlık, yakını modu | Yastık cümlesi hem hazırlık listesinde hem yardımcı kartında; uzun sayfada tekrar | Yakını modunda yardımcı kartında yalnız listede olmayanlar (başucu, iki elle tutma, dokunma) | Evet (p2 PREP) |

Not: Bu turda kapsayıcı bir kez yeniden başladı. Kurulum ve manevra (p1, p2), yanlış taraf ölçümleri (p2, p4, p6) ×1'de, tekrar
testi ve yüzüstü raporu (p3, p7) ×5'te yapıldı.

## 4. Sevdiklerim (bozulmasın)
1. Yanlış yana yuvarlanınca **anında** ayrı titreşim, bip ve "Dur! Yanlış taraf."; sırtüstüne gelince "Tamam, şimdi hastanın sağ
   yanına". Ekranı göremediğim adımda tam yönlendirme.
2. Kurulumdan bitiş ekranına kadar her yerde bana (yardımcıya) konuşulması; kurulumda "yakını olarak kuruyorum + ekranı çevir".
3. Hekime giden rapor: hasta/reçete kodu, "yakını eşliğinde", duraklatmalar, yanlış taraf, durulan yer, QR.

## 5. Memnuniyet
**9,5/10** (7 → 8 → 9 → 9,5 → 9,5). 4. turdaki beş isteğimin beşi de yapılmış ve doğru çalışıyor. Puanı 10 yapmamın önündeki tek
şey, sırtüstü sınırındaki küçük pürüz (Y1); bu da yalnız ani bir sıçramada çıkıyor.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Evet.** Koşulu: hastanın hekim tanısı ve reçetesi olsun, yanında
bir yakını bulunsun ve atak gelmeden önce bir kez "Deneme manevrası" yapılsın. Kendi deneyimimin dışında bir not: açı ölçümü ve
demo kapalıyken hastaya söylenen başlangıç cümlesi gerçek telefonda pilotta doğrulanmalı (ben yalnız öykünüm ve sanal sensörle
denedim).

Betikler, ses/titreşim/ton kayıtları ve ekran görüntüleri:
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-5/k02-yardimci-evlat/`
(p1 kurulum, p2 manevra ×1, p3 ertesi gün ve rapor, p4 yüzüstü ×1, p6 yavaş ve titrek yuvarlanma ×1, p7 yüzüstü + rapor;
`ses-p*.txt`, `notlar-p*.txt`, `shots/`).
