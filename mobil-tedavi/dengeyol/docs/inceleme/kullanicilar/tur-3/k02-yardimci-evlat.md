# Tur 3 — k02 yardımcı evlat (Elif, 44, bankacı)

## 1. Ben kimim, ne yapmaya çalıştım
Annem 74 yaşında; sol arka kanal BPPV, hasta kodlu (KBB-1042) Epley reçetesi var. Annemin iPhone'una (iPhone 13 öykünümü, boş
localStorage) yeniden baştan kurdum. Manevrayı başucunda durup başını iki elimle çevirerek ben yaptırdım. Ertesi gün tekrar
testini yaptım ve raporu gönderdim. 2. turdaki isteklerimi, en çok da "yanlış yana yuvarlama"yı, kendi gözümle denedim.

## 2. Yaşadıklarım (kısa günlük)
- **Reçete kartı**:
  - Uyarı artık durumumu kapsıyor: "hekiminiz size **ya da yakınınıza** kendisi verdiyse kabul edin".
  - iPhone notu **kabulden önce** geliyor ("önce ana ekrana ekleyin, bağlantıyı orada açın").
  - Kart sesli okunuyor; geçerlilik "13 Kasım (dahil)" diye yazıyor.
- **Kurulum**:
  - Yeni "Hasta adına, onun bilgisi ve isteğiyle bir yakını olarak kuruyorum" kutusunu işaretledim. Onay metni de "Hasta adına…"
    diye değişti ve "Kim yapıyor?" kendiliğinden "Bir yakınımla" geldi.
  - Olası yan etkiler ve seçenekler (hekimde manevra, beklemek) kısa ve sakin yazılmış.
  - Uygunluk listesi ise hâlâ birinci tekil ("Boynumda hastalık var…"); ben annem adına okuyup işaretliyorum.
- **Ana ekran**: "14 güvenlik sorusu ve manevra · ~8 dk (gerekirse kısa test)". Doğru.
- **Telefonu tanıtma ve manevra (çevrik ekran)**: 2. turdaki gibi. Ses bana, anneme tek cümle; başlıklar, kısa talimat satırı
  ve sağ/sol okları tutarlı. 1. adımda yine "Başı hastanın soluna çevirdiyseniz öyle tutun" deniyor.
- **Duraklatma sayfası**:
  - Artık benim dilimde: "Hasta kendini kötü hissediyor", "Bu pozisyona gelemiyor / boynu ağrıyor", "Şimdilik bırak (hasta iyi)".
  - Ses de bana konuşuyor: "Hastanın boynu ağrıyorsa onu yavaşça oturtabilirsiniz; devam için ekrana iki saniye basılı tutun".
  - Paniğe kapılıp "Şimdilik bırak"ın üstüne 2,5 sn bastım: manevra bitmedi, devam etti. Uzun basış düğme seçmiyor; doğru.
- **4. adımda yanlış yana yuvarlama** (asıl kaygım):
  - Annemi soluna (θ −90°) yuvarladım. Ekranda hemen kırmızı bir kutu çıktı: "DUR — yanlış taraf. Önce sırtüstüne, sonra HASTANIN
    SAĞ YANINA (yüzüstünden değil)". Ok da doğru tarafı gösteriyor.
  - Ses: "Durun, yanlış taraf. Hastayı önce sırtüstüne getirin, sonra bütün vücuduyla sağ yanına çevirin." Sırtüstüne getirince
    "Gövdeyi hastanın sağına çevirin" deniyor, sağ yana gelince adım sorunsuz tamamlandı.
  - Yüzüstünden geçerek hedefe gelmeyi denedim (θ −90 → −175 → 175 → 135): kabul edilmedi. Raporda adıma "önce yanlış tarafa
    dönüldü" yazıldı. Bu kısım tam istediğim gibi.
  - **Ama gerçek hızda (×1) sesli uyarı geç geliyor:** annem yanlış yana geldikten **~10 sn sonra**. Bu adımda ekran yatağa
    bakıyor ve uygulama "ekranı göremezsiniz, sesi dinleyin" diyor; yani 10 sn boyunca yanlış yöne devam ediyor olabilirim.
  - **Uyarı her 5 sn'de bir yeniden başlıyor ve önceki uyarıyı yarıda kesiyor.** Cümle ~7 sn sürüyor; 2. tekrardan sonra
    "…sonra bütün vücuduyla **sağ yanına**" kısmını hiç duyamıyorum.
- **Yanlış tarafta kalınca (yüzüstünden denemede ~60 sn)** manevra durdu. Ekran ve ses şunu söyledi: "Manevranın bir pozisyonuna
  gelinemedi (ör. baş yeterince geriye sarkamadı ya da çevrilemedi)… boyun ya da bel hareketiniz kısıtlıysa…". Atak "hekime
  başvurun" kilidine girdi. Durdurmasını doğru buluyorum, ama gerekçe benim yaptığım hatayı anlatmıyor. Annemin boynunda sorun var
  sanıp boşuna korkarım; hekime de yanlış bilgi giderdi.
- **Sonrası**: dinlenme sayacı ve hatırlatıcı çalıştı. Ertesi gün "yakınımla + çevir" seçimleri hatırlanmıştı. Dix-Hallpike
  yardımcı diliyle ilerledi, sonuç "Baş dönmesi gelmedi, yarın sabah bir kez daha bakalım" (gündelik dil, iyi).
- **Rapor (paylaşılan metin)**:
  - Başta hasta kodu, reçete kodu ve hekim adı var; altında "Hastanın telefonunda, **yakını eşliğinde** oluşturuldu".
  - Kısa yolun kullanıldığı yazıyor; 14 günlük doz özeti var.
  - "Onam: … hasta adına yakını onayladı" satırı var.
  - Manevrada "yakını yaptırdı · **2 kez duraklatıldı**" ve 4. adımda "önce yanlış tarafa dönüldü" yazıyor.
  - Hekimin görmesini istediğim her şey raporda.

## 3. Sorunlar ve 2. kullanımdaki isteklerim
| # | Önem | Yer (ekran/adım, dosya:satır) | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| T2-Y1 | — | Epley 4. adım yanlış yana yuvarlanma (`core/evaluator.ts:146-156`) | **2. kullanımdaki isteğim: karşılandı.** Ekranda "DUR — yanlış taraf…", ses doğru yönü söylüyor, yüzüstünden geçiş kabul edilmiyor, olay rapora geçiyor | Sesli uyarının zamanlaması için bkz. Y1 | Evet (b26, p4, p5) |
| T2-1 | — | Duraklatmalar rapora | **Karşılandı.** "2 kez duraklatıldı" | — | Evet (paylaşılan metin) |
| T2-2 | — | "Yakını eşliğinde" | **Karşılandı.** Rapor üstbilgisi ve onam satırı | — | Evet |
| T2-3 | — | Duraklatma sayfası yardımcı dili | **Karşılandı.** Düğmeler ve ses yardımcıya göre; uzun basış düğme tetiklemiyor | — | Evet (b21, p4) |
| T2-4 | — | Ana ekran süre metni | **Karşılandı.** "~8 dk (gerekirse kısa test)" | — | Evet (a05) |
| T2-5 | — | iPhone "önce ana ekrana ekleyin" | **Karşılandı.** Reçete kartında kabul düğmesinden önce | — | Evet (a01) |
| T2-6 | — | Kurulumda "yakını olarak kuruyorum" | **Karşılandı.** Kutu var; onay metni ve "Kim yapıyor" buna göre değişiyor | (İsteğe bağlı) "ekranı çevir" de burada sorulsun | Evet (a03) |
| T2-7 | — | Reçete uyarısı "size ya da yakınınıza" | **Karşılandı** | — | Evet |
| Y1 | **Yüksek** | 4. adım, yanlış taraf sesli uyarısı (`core/runner.ts:120-121` firstHintDelaySec 7 / hintEverySec 5, `runner.ts:1192` yüksek öncelik) | Gerçek hızda ses, yanlış yana gelişten ~10 sn sonra başlıyor; ekran bu adımda görülmüyor. Uyarı 5 sn'de bir kendini kesiyor (cümle ~7 sn; uygulamanın kendi tahmini 95/13 ≈ 7,3 sn), "sağ yanına" kısmı duyulmuyor | Yanlış taraf algılanır algılanmaz (≤ 1–2 sn) kısa bir "**Dur! Yanlış taraf.**" söylensin, ayrı titreşim/bip gelsin; ardından "Sırtüstüne getirin" söylensin. Uyarı biri bitmeden yinelenmesin (en az cümle süresi + 2 sn) | Evet (p5: MARK 98,5 s → ses 108,8 s; 113,8 / 118,8 / 123,8 sn'de CUT) |
| Y2 | Orta | Yanlış tarafta kalınca durdurma metni (`core/runner.ts:157`, `reportText.ts:31`) | Durdurma doğru ama gerekçe "baş sarkamadı ya da çevrilemedi… boyun/bel kısıtlıysa" diyor. Asıl olan "hasta yanlış yana / yüzüstünden döndürüldü"; hekime giden raporda da gerekçe yanlış görünür | Adım kaydında `wrongSide` varsa ayrı gerekçe yazılsın: "Hasta yanlış tarafa döndürüldü ve doğru yana getirilemedi. Hastayı sırtüstü, sonra oturtun. Bugün yeniden denemeden önce hekime danışın" (kilit aynen kalsın) | Evet (p4, e-serisi) |
| Y3 | Düşük | Kurulum uygunluk listesi ve hazırlık maddeleri, yakını modunda | "Boynumda hastalık var", "Yatağın üzerine oturun" gibi birinci tekil ifadeler kalmış | "Yakını olarak kuruyorum" işaretliyse "Hastanın boynunda…", "Hastayı yatağa oturtun…" | Evet (a04, b05) |

Not: ×5 demo hızında uyarı her ~1 sn kesiliyor (24 kez); bunu hız ayarından kaynaklandığı için sorun saymadım. ×1'deki ölçüm
Y1'de.

## 4. Sevdiklerim (bozulmasın)
1. Yanlış yanda **kırmızı "DUR — yanlış taraf"** kutusu, yüzüstünden geçişin kabul edilmemesi ve bunun rapora yazılması.
2. Bütün akışın yardımcı diliyle konuşması: kurulumdan duraklatma sayfasına ve tekrar testine kadar; anneme tek cümle.
3. Rapor: hasta kodu, reçete kodu, "yakını eşliğinde", "2 kez duraklatıldı", doz özeti. Hekime WhatsApp'tan gönül rahatlığıyla atarım.

## 5. Memnuniyet
**9/10** (1. tur 7 → 2. tur 8 → 3. tur 9). Bütün isteklerim yerine gelmiş ve en büyük korkum olan yanlış yöne yuvarlamayı uygulama
artık yakalıyor. Puanı 10 yapmamamın tek nedeni, ekranın görülmediği o adımda sesli uyarının geç gelmesi ve kendini kesmesi.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Koşullu.** Hekim tanısı ve reçetesi olan, yanında bir yakını
bulunan kişiye öneririm. Y1 (yanlış taraf sesli uyarısının hemen ve kesilmeden söylenmesi) düzelince koşulsuz "Evet".

Betikler, ses kayıtları ve ekran görüntüleri:
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-3/k02-yardimci-evlat/`
(p1 kurulum, p2 manevra, p3 ertesi gün ve rapor, p4 uzun basış ve yüzüstünden geçiş, p5 gerçek hızda yanlış taraf; `ses-p*.txt`,
`notlar-p*.txt`, `shots/`).
