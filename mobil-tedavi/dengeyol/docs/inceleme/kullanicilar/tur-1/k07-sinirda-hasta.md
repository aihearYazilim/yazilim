# Tur 1 — k07 sınırda hasta (Ahmet, 68)

## 1. Ben kimim, ne yapmaya çalıştım
68 yaşındayım; boyun fıtığım var, başımı geriye atmakta zorlanırım, belim de ağrır. Atriyal fibrilasyon için apiksaban ve
tansiyon ilacı kullanıyorum; 2 yıl önce kalça protezi takıldı. KBB hekimim sol arka kanal BPPV dedi. Pixel 7'de (Büyük yazı)
uygulamayı kurdum; hangi durumumun engel olduğunu bilmiyordum, her birini ayrı ayrı denedim, sonra engellenmeyen yoldan atak→manevra yaptım.

## 2. Yaşadıklarım
- **Kurulum:** Yazı boyutu, onay, tanı (Evet / Arka kanal / Sol kulak) kolaydı. "Sizin için uygun mu?" listesinde 11 madde var.
  Boyun maddesi ("boyun fıtığı nedeniyle hareket kısıtlılığı") bana birebir uydu. Kan sulandırıcı ve kalça protezi için madde yok;
  "acaba yazmam gereken bir yer mi var" diye listeyi iki kez okudum. "Ciddi bel/sırt sorunu" beni kararsız bıraktı: belim ağrıyor ama ciddi mi, bilmiyorum.
- **Engellenince:** "Önce hekiminize danışın — İşaretlediğiniz durum nedeniyle… güvenli olmayabilir." Hangi durum? Hekime ne
  soracağım? Yazmıyor. Altında "Hekiminiz bir reçete bağlantısı verirse manevralar açılır" yazıyor. Hekimimden reçete aldım (notunda
  "boyun kısıtlı, baş az sarkıtılsın"), kabul ettim: ana ekran yine "Manevralar şu an kapalı". Tek çıkış yolu boyun kutusunun
  işaretini kaldırmak, yani yalan söylemek.
- **Engellenmeyen yol (yalnız kan sulandırıcı):** 11 güvenlik sorusu sesle okundu; "Kan sulandırıcı kullanıyorsanız: yeni baş ağrısı / başınızı
  çarptınız mı?" sorusu tam bana göreydi, sevindim. Telefon tanıtma adımında "başınızı yavaşça geriye yatırın, tavana bakın" dendi; boynum için biraz zorladı ama yapabildim.
- **Boyun ~20° eksik sarkarken (sensörlü yönlendirme):** Dix-Hallpike'ın sarkık adımında başım ~8°'de kaldı (hedef 15–40°).
  Uygulama yaklaşık 100 sanal saniye boyunca, her 5 saniyede bir, **20 kez üst üste** "Başınızı biraz daha geriye bırakın." dedi. Sayaç
  hiç başlamadı; "gelemiyorsanız zorlamayın" ya da "durun" gibi bir cümle hiç gelmedi. Ekranı göremediğim için çıkış yolum yok.
  Duraklat'ı basılı tutunca "Devam et / Kendimi kötü hissediyorum / Şimdilik bırak (iyiyim)" seçenekleri çıktı; "Bu pozisyona gelemiyorum" seçeneği yok.
  Bıraktım: "Test yarıda bırakıldı. Hazır olduğunuzda yeniden başlayabilirsiniz." Bu ekran beni tekrar denemeye çağırıyor; hekime yönlendirmiyor.
- **Zorlayınca:** İkinci denemede boynumu zorlayıp sınırda (15°) tuttum. Bu kez her birkaç saniyede bir "Pozisyonu koruyun. Başınızı biraz
  daha geriye bırakın." ve "Tamam, böyle kalın." **sırayla tekrarlandı** (Epley adım 2'de 45 s içinde 6 kez). Tam sınırdayken sürekli
  daha fazlasına itildim. Sonunda iki test ve Epley "tamamlandı" sayıldı. Geçmiş'te hedefte kalma oranı %40 civarında görünüyor; boynun yetmediği ise hiçbir yerde açıkça yazmıyor.
- Sesli yönergeler zamanında geldi, ara sayımlar ("40 saniye kaldı") iyiydi. Bip/titreşim ritmi anlaşılır.

### Durum tablosu (kurulum kapısı)
| Senaryo | Ne işaretledim | Uygulama ne yaptı | Değerlendirmem |
|---|---|---|---|
| Yalnız boyun | Boyun maddesi | Kapattı; genel metin, hangi madde ve ne sorulacağı yok | Doğru yerde durdurdu; anlaşılır değil, çıkış yolu yanlış tarif ediliyor |
| Yalnız kan sulandırıcı | Uygun madde yok → "Hiçbiri" | Açtı; atakta kanama/baş çarpması kırmızı bayrak sorusu var | Doğru (antikoagülan tek başına manevra engeli değil); kurulumda kısa bilgi notu eksik |
| İkisi birden | Boyun maddesi | Kapattı (yalnız boyun gibi) | Doğru; kan sulandırıcı hiç anılmıyor |
| Yalnız kalça protezi | Uygun madde yok → "Hiçbiri" | Açtı | Doğru (2 yıllık protez Epley'e engel değil); Semont reçetesinde hızlı yana düşme için soru yok |
| Boyun + bel (gerçek ben) | Boyun + "ciddi bel/sırt" | Kapattı; yine tek genel cümle | Doğru; "ciddi" kelimesi kararsız bırakıyor |
| Boyun + hekim reçetesi | Boyun + reçete kabul | **Kapalı kaldı**; ekran "reçete açar" diyordu | Yanlış bilgi; hekim onayıyla da yol yok |

**Engellenince hekime ne soracağımı biliyor muyum?** Hayır. Uygulama "hekiminize danışın" diyor ama ne sorulacağı, hekimin neye karar
vereceği (değiştirilmiş manevra mı, klinikte mi) ve onay gelince ne yapacağım yazmıyor.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Kritik | Sensörlü yönlendirme, sarkık adımlar (`core/runner.ts:620`, `core/evaluator.ts:118`) | Boynu sarkamayan hastaya sınırsız "biraz daha geriye bırakın" (100 s'de 20 kez); sayaç başlamıyor, çıkış söylenmiyor. Boyun hastasını zorlamaya iter. | 2–3 HANG_MORE ipucundan sonra sesle "Daha fazla zorlamayın. Boynunuz ağrıyorsa ya da daha geriye gidemiyorsanız ekranı basılı tutun" deyin; ~60 s hedefe gelinemezse adımı durdurun, "boyun yeterince geriye gidemedi" diye kaydedip hekime yönlendirin (kırmızı çizgi korunur, hedef gevşetilmez). | Evet (Playwright, φ 28→8, `strict-log.txt`) |
| 2 | Yüksek | Kapı ekranı (`Onboarding.tsx:296`, `safety.ts:186`) | "Reçete verirse manevralar açılır" yazıyor ama kontrendikasyonda reçete kapıyı açmıyor. Tek yol kutuyu yalan yere kaldırmak. | Kontrendikasyonda bu cümleyi kaldırın ya da "Hekiminiz kendi gözetiminde yapmayı önerebilir" yazın. Hekim onaylı yol olacaksa klinisyen reçetesinde açık bir "kontrendikasyon değerlendirildi" alanı olsun; hasta kutuyu kaldırmak zorunda kalmasın. | Evet (`rx.json`, ekran 02-rx) |
| 3 | Yüksek | Kapı metni (`safety.ts:197`) | Hangi maddenin engellediği ve hekime ne sorulacağı yazmıyor. | İşaretlenen maddeyi adıyla gösterin; altına 2–3 soru: "Boynumla Epley yapabilir miyim? Değiştirilmiş biçimde mi, sizin gözetiminizde mi?" ve "Raporu hekime göster" düğmesi. | Evet |
| 4 | Yüksek | Sınırda tutma (holding/drifting) | Hedefin tam kenarında "Pozisyonu koruyun. Başınızı biraz daha geriye…" ve "Tamam, böyle kalın" art arda (45 s'de 6 kez); hasta daha çok zorlar. | Sarkma alt sınırına birkaç derecelik histerezis koyun; kayma uyarısı 2 s değil daha uzun süre dışarıda kalınca gelsin. | Evet (`force-log.txt`) |
| 5 | Orta | Duraklat sayfası (`RunnerView.tsx` ~800) | "Bu pozisyona gelemiyorum" seçeneği yok; "Şimdilik bırak" sonrası ekran tekrar denemeye çağırıyor. | "Pozisyona gelemiyorum / boynum ağrıyor" seçeneği: manevrayı bitirsin, kaydetsin, "tekrar denemeyin, hekiminize danışın" desin. | Evet |
| 6 | Orta | Uygunluk listesi | Kan sulandırıcı ve kalça protezi için hiçbir şey yok; "ciddi bel/sırt sorunu" belirsiz. | Listenin altına kısa not ekleyin: "Kan sulandırıcı, tansiyon ilacı ve kalça/diz protezi tek başına engel değildir; düşmemek için yatakta yapın". "Ciddi"yi örnekle açın. | Evet |
| 7 | Düşük | Telefon tanıtma (`Calibrate.tsx:142`) | Boyun hastasından "başınızı geriye yatırıp tavana bakın" isteniyor. | Bu adımda "rahat olduğunuz kadar" ekleyin. | Kodda + ses kaydında |
| 8 | Düşük | "Bilgilerimi düzenle" | Her düzenlemede baştaki onay ekranından yeniden geçiliyor. | Doğrudan uygunluk adımına götürün. | Evet |

## 4. Sevdiklerim
- Boyun fıtığını açıkça adıyla soran madde: kendimi hemen buldum, kapı doğru yerde kapandı.
- Atak başındaki "kan sulandırıcı + yeni baş ağrısı/baş çarpması" sorusu: tam bana göre, sesle okunuyor.
- Sesli sayım, bip/titreşim ve "Tamam, böyle kalın" geri bildirimi: ekranı görmeden ne yaptığımı anlıyorum.

## 5. Memnuniyet
**5/10.** Kapı doğru yerde kapandı ama nedenini ve çıkış yolunu anlatmıyor, yanlış bir umut veriyor; boynu yetmeyen hastayı da
durmadan zorluyor. Boyun sorunu olan bir yakınıma bu hâliyle önermem. Boyun sorunu olmayan yakınıma, hekim onayıyla, önerebilirim.

Kanıtlar: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-1/k07-sinirda-hasta/`
(`onboard.json`, `rx.json`, `strict-log.txt`, `force-log.txt`, `force-episode.json`, ekran görüntüleri).
