# Tur 6 — k02 yardımcı evlat (Elif, 44, bankacı)

## 1. Ben kimim, ne yapmaya çalıştım
Annem 74 yaşında; sol arka kanal BPPV, hasta kodlu (KBB-1042) Epley reçetesi var. Annemin iPhone'una (iPhone 13 öykünümü, boş
localStorage, sunucu 4183) yeniden baştan kurdum. Manevrayı başucundan ben yaptırdım, ertesi gün tekrar testini yaptım, raporu
gönderdim. Uzun beklemeleri ×5 ile kısalttım. Yanlış taraf anlarını, özellikle 5. turda pürüz çıkan "tek seferde −30°, sonra
−90°" denemesini, **gerçek hızda (×1)** ses, titreşim ve bip kaydıyla tekrarladım.

## 2. Yaşadıklarım (kısa günlük)
- **Kurulum**: Reçete kartı, "yakını olarak kuruyorum" ve "başucunda duracağım (ekranı bana göre çevir)" seçenekleri, hastaya göre
  yazılmış uygunluk listesi ve "~8 dk" süre önceki turdaki gibi doğru.
- **Hazırlık**: Yardımcı kartı artık listeyi tekrarlamıyor. Yastık cümlesi bir kez geçiyor; kartta yalnız benim işim var:
  - başucunda durup ekranı çevirmek ("aşağıdaki kutu"),
  - başı iki elle tutup çevirmek,
  - hasta "dönüyor" deyince ekrana dokunmak,
  - okların anlamı,
  - otomatik döndürmeyi kapatmak.

  İşitme cihazı notu "Hastanın işitme cihazı varsa…" diye yazılmış.
- **Manevra (çevrik ekran)**: Ses bana, anneme tek cümle. Sağ/sol okları, oturuşta "çevirdiyseniz öyle tutun", baş dönmesi
  işareti, duraklatma (2 kez) ve geri tuşu eskisi gibi doğru çalışıyor.
- **Sırtüstü sınırı, tek seferde −30° (×1)**: 5. turdaki denemeyi aynen tekrarladım: baş sırtüstündeyken tek seferde −30°'ye,
  0,7 sn sonra −90°'ye.
  - Bu kez "Dur! Yanlış taraf." −90°'ye geçtiğim anda geldi; altı kesik titreşim ve iki tonlu bip de yanında.
  - Araya yanlışlıkla "Tamam, şimdi…" girmedi, uyarı bastırılmadı.
  - 1,7 sn sonra tam yönerge kesilmeden okundu; yinelemeler cümle bittikten sonra geldi.
- **Sırtüstüne dönüş**: Annemi sırtüstüne getirip orada tuttuğumda iki uzun titreşimle "**Tamam, şimdi hastanın sağ yanına.**"
  dendi. Sağ yana gelince adım normal tamamlandı; raporda "önce yanlış tarafa dönüldü" yazıyor.
- **Yüzüstünden geçme denemesi**: Kabul edilmedi; 72 sn sonra durdu.
  - Bitiş ekranı bana konuşuyor: "Hastayı önce sırtüstüne getirin, sonra yavaşça oturtun… hastanın boyun ya da bel sorunu
    olduğu anlamına gelmez".
  - "Durulan yer" satırında artık olay yazıyor: "**hedef açıya yüzüstünden geçilerek gelindi; kabul edilmedi**; 72 s içinde
    gelinemedi". Hekime giden raporda da aynı satır var; durum "hasta yanlış tarafa döndü (döndürüldü) ve doğru yana
    getirilemedi".
- **Sonrası**: Dinlenme sayacı çalıştı. Yeni ve hoş bir şey var: test saati gece yarısına denk geldiği için "Uyanıksanız o saatte
  yapın; uyuyacaksanız alarm kurmanız gerekmez, uyanınca yapın" dendi. Annemi gece uyandırmak istemem, bu çok işime yaradı.
- **Ertesi gün tekrar testi ve rapor**: "Yakınımla" ve "çevir" hatırlanmıştı. Dix-Hallpike negatif çıktı, "yarın sabah bir kez daha
  bakalım" dendi. Rapor şunları içeriyor:
  - hasta ve reçete kodu, "yakını eşliğinde",
  - reçete dönemi doz özeti (1/15 manevra),
  - "2 kez duraklatıldı" ve baş dönmesi "gecikme 6 s, süre 18 s",
  - QR ile gösterme.

## 3. Sorunlar ve 5. kullanımdaki isteklerim
| # | Önem | Yer (ekran/adım, dosya:satır) | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| T5-1 | — | Sırtüstü sınırında gecikme payı (`core/runner.ts`, yanlış taraf / sırtüstü kilidi) | **5. kullanımdaki isteğim: karşılandı.** Tek seferde −30° → 0,7 sn sonra −90° denemesinde "Dur! Yanlış taraf." ve ayrı titreşim/bip −90°'de geldi; araya "Tamam, şimdi…" girmedi, bastırma olmadı. "Tamam, şimdi hastanın sağ yanına" ancak sırtüstünde kalınınca söylendi | — | Evet (ses-p2w: MARK 116,0 / 116,8 → uyarı 116,8; "Tamam" 134,7) |
| T5-2 | — | Raporda kural yerine olay | **Karşılandı.** "Hedef açıya yüzüstünden geçilerek gelindi; kabul edilmedi" hem bitiş ekranında hem hekime giden raporda | — | Evet (p7) |
| T5-3 | — | Yakını modunda yardımcı kartı | **Karşılandı.** Kart listeyi tekrarlamıyor; yastık cümlesi bir kez geçiyor | — | Evet (p2 PREP) |
| — | — | Yeni sorun | Bu turda yeni bir sorun bulmadım. Önceki turlarda düzelen davranışların hepsini yeniden denedim, hepsi duruyor | — | Evet |

Not: Demo modunda kalan iki şeyi yalnız gerçek telefon doğrulayabilir: açı ölçümünün gerçek sensörle doğruluğu ve demo kapalıyken
anneme söylenen başlangıç cümlesinin sonuna kadar okunması. Kodda bunun için bekleme var.

## 4. Sevdiklerim (bozulmasın)
1. Ekranın görülmediği yan yatış adımında **anında** "Dur! Yanlış taraf." (ayrı titreşim ve bip), sırtüstünde "Tamam, şimdi
   hastanın sağ yanına", yüzüstünden geçişin kabul edilmemesi.
2. Kurulumdan duraklatmaya, gece testi notuna ve durdurma ekranına kadar her şeyin bana (yardımcıya) söylenmesi; anneme tek cümle.
3. Hekime giden rapor: hasta/reçete kodu, "yakını eşliğinde", duraklatmalar, yanlış taraf ve durulan yer, QR.

## 5. Memnuniyet
**10/10** (7 → 8 → 9 → 9,5 → 9,5 → 10). Altı turda istediğim her şey yapıldı ve bu turda yeni bir pürüz bulamadım. Annemin başını
çevirirken korktuğum her an artık ya önleniyor ya da hemen sesle düzeltiliyor.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Evet.** Koşulu: hastanın hekim tanısı ve reçetesi olsun, yanında
bir yakını bulunsun ve atak gelmeden önce bir kez "Deneme manevrası" yapılsın. Ayrıca sensörlü kullanım, gerçek iPhone'larla
yapılacak pilotta (açı doğruluğu, demo kapalı ses akışı) doğrulanmalı.

Betikler, ses/titreşim/ton kayıtları ve ekran görüntüleri:
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-6/k02-yardimci-evlat/`
(p1 kurulum, p2 manevra ×5 + 4. adım ×1, p3 ertesi gün ve rapor, p7 yüzüstü + rapor; `ses-p*.txt`, `notlar-p*.txt`, `shots/`).
