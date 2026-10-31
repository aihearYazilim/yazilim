# k05 — Fatma, 61, köyde, okuması yavaş (tur-6)

## 1. Ben kimim, ne yapmaya çalıştım
Fatma'yım. Yavaş okurum, doktor kelimelerini bilmem; oğlum şehirde, yalnızım. KBB doktorunun QR'ıyla uygulamayı **yeni baştan**
yavaş telefonda kurdum. İnternet yokken atakta manevrayı tek başıma yaptım, 1 saat sonra testi yaptım. Reçetesiz kurulumu ve
yanlış anlama yollarını yeniden denedim. 5. kullanımdaki isteklerime kendim baktım.

## 2. Yaşadıklarım (Pixel 7 öykünümü, CPU 4 kat yavaş, yavaş ağ ve sonra ağ yok, yazı "Çok büyük", ses "Yavaş", sahte Türkçe ses kaydı; sunucu 4183)
1. **QR → reçete (5,5 s):** Kart ve ses aynı: "sağ kulak, arka kanal kristal oynaması (BPPV)". Okunması 30 s.
2. **Kurulum:**
   - "Sizin için uygun mu?" kısa girişi artık şunu da söylüyor: **"Emin değilseniz o maddeyi işaretleyin ve doktorunuza sorun."** (24 s).
   - "Tekrar dinle (bütün maddeler)" ve kalın kısa adlar duruyor.
   - Reçetesiz yolda "Tanınız" ekranı hâlâ sessiz. Sentezde bilerek "sonraki sürüm"e bırakılmış.
3. **İnternet yokken:** Uygulama 0,7 s'de açıldı, her şey ağsız çalıştı.
4. **14 güvenlik sorusu (gerçek hızda, sesi bekleyerek 3 dk 13 s):**
   - Kısa ve anlaşılır; "Doğru mu?" ekranı yanıtı üstte gösteriyor ve okuyor; geri tuşu önceki soruya götürüyor.
   - Uzunluk klinik karar gereği kaldı; kabul.
5. **Hazırlık** kendiliğinden kısa okunuyor (11 s). **Manevra** gerçek hızda temiz: yönergeler 10–13 s, "yarıya kadar". Kesilen tek tük cümleler yerinde ("Tamam, böyle kalın" ipucunu kesiyor).
6. **Sonrası:**
   - "Şu an nasılsınız?" daha kısa okunuyor (19 s), ama **sıra sayıları kalkmış**: "İyiyim; hafif baş dönmesi ya da bulantı var; kusma ya da şiddetli bulantı var; yeni belirti var: …".
     Önceki "Birinci: İyiyim. İkinci: …" biçimi benim için ekrandaki kutuyu bulmayı kolaylaştırıyordu. Şimdi seçenekler birbirine karışıyor; "İyiyim, hafif baş dönmesi var" tek cümle gibi duyuluyor.
   - Bitiş 11 s: "On dakika oturun; tutunarak kalkın. Tekrar testi saat 02:11; uyuyacaksanız uyanınca yapın."
     Gece saati için **"uyanınca yapın"** demesi çok iyi; alarm kurmak zorunda kalmıyorum.
7. **1 saat sonra:** "Baş dönmesi gelmedi. Yarın sabah bir kez daha bakalım." Konsol hatası yok.
8. **Yanlış anlama yolları:**
   - "Kusma" onayı sesli ve doğru sırada.
   - Ayağa kalkınca sorusuna "Evet" deyince durdurma ekranı okunuyor, ama **35 s** sürüyor ve içinde "BPPV" harfleri okunuyor.

## 3. Sorunlar (kalanlar; hiçbiri zarar ya da işi bitirememe değil)

| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Düşük | "Şu an nasılsınız?" sesli okunuşu | Kısalırken "Birinci… İkinci…" sıra sayıları düştü; seçenekler noktalı virgülle art arda okunuyor, sınırları duyulmuyor | Kısa kalsın ama sıra sayıları geri gelsin: "Birinci: İyiyim. İkinci: Hafif baş dönmesi. Üçüncü: Kusma. Dördüncü: Yeni belirti: konuşma bozukluğu…" (diğer soru ekranlarıyla aynı biçim) | Evet (b-ses.txt 616 s) |
| 2 | Düşük | Durdurma ekranlarının sesi (ör. ayağa kalkınca "Evet") | 35 s; "kristal oynamasına, BPPV, bağlı değildir" gibi harf okuması var | Sesli hâli kısa: "Manevra yapmayın. Birkaç gün içinde aile hekiminize gidin; yavaş kalkın, tutunun. Bayılırsanız 112." Ayrıntı ekranda ve "Ayrıntıyı dinle"de | Evet (c-ses.txt 163 s) |
| 3 | Düşük | Reçetesiz "Tanınız" ekranı | Sessiz; "posterior/lateral, Barbekü/Gufoni" duruyor (bilerek sonraki sürüme) | Kabul; sonraki sürümde soru ve seçenekler okunsun | Evet (c-13, c-14) |

**5. kullanımdaki isteklerim:**

| 5. tur # | İstek | Durum |
|---|---|---|
| 1 | Uygunluk kısa girişine "Emin değilseniz o maddeyi işaretleyin ve doktorunuza sorun" | **Karşılandı** (seste ve ekranda) |
| 2 | Reçetesiz "Tanınız" ve kilit ekranı sesli | **Karşılanmadı (bilerek, "sonraki sürüm")** |
| 3 | Güvenlik sorularında kalan süre / kısalık | **Karşılanmadı (bilerek, klinik karar)**; kabul ediyorum |
| — | Önceki turların düzeltmeleri bozulmadı mı? | **Evet, bozulmadı**: reçete kartı, 10 s'lik bitiş, kendiliğinden okunan hazırlık, yanıt üstte onay, seçince susan ses, "yarıya kadar". Tek geri adım: "nasılsınız"da sıra sayıları (#1) |

## 4. Sevdiklerim
- QR'dan tekrar testine kadar okumadan, yalnız dinleyerek yapılabiliyor. "Emin değilseniz işaretleyin" artık sesle de söyleniyor.
- Gece saatine düşen tekrar testi için "uyuyacaksanız uyanınca yapın": yaşlı biri için tam doğru.
- Telefon alındayken akış kusursuz ve internetsiz; yanlış dokunuş beni hiçbir zaman sessizce kilitlemiyor.

## 5. Memnuniyet: 9/10 (6 → 7 → 8 → 9 → 9 → 9)
Reçeteyle gelen okuma güçlüğü olan biri için uygulama işini görüyor. Kalanlar seslerin biçimiyle ilgili küçük ayrıntılar.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Koşullu (hafif koşul).**
- Koşul: okuması zayıf kişi doktordan **QR reçeteyle** gelsin.
- İlk kurulum ve baş dönmesi yokken bir "Deneme manevrası" bir kez bir yakınla ya da hekimin yanında yapılsın. Telefonu alna koymayı ve "ekrana dokun"u bir kez görmek yeter.
- Sonra ataklarda tek başına kullanabilir. Reçetesiz kurulum okuyamayan biri için hâlâ bir yakın ister.

Betik, ekran görüntüsü ve ses kayıtları: `scratchpad/kullanicilar/tur-6/k05-okuma-guclugu/` (a-akis, b-gercek-hiz, c-yanlis-anlama; *-ses.txt).
