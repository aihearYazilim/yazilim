# k05 — Fatma, 61, köyde, okuması yavaş (tur-5)

## 1. Ben kimim, ne yapmaya çalıştım
Fatma'yım. Yavaş okurum, doktor kelimelerini bilmem; oğlum şehirde, yalnızım. KBB doktorunun verdiği QR'la uygulamayı **yeni baştan**
ucuz, yavaş telefonda kurdum. İnternet yokken baş dönmemde manevrayı tek başıma yaptım, 1 saat sonra testi yaptım.
Reçetesiz kurulumu da denedim (tanı zamanı seçimi ve boyun kilidi). 4. kullanımdaki isteklerime kendim baktım.

## 2. Yaşadıklarım (Pixel 7 öykünümü, CPU 4 kat yavaş, yavaş ağ ve sonra ağ yok, yazı "Çok büyük", ses "Yavaş", sahte Türkçe ses kaydı; sunucu 4182)
1. **QR → reçete (5,3 s):** Kartta artık **"SAĞ kulak — arka kanal kristal oynaması (BPPV)"** yazıyor. Ses de aynısını söylüyor ("Tanı: sağ kulak, arka kanal kristal oynaması"). Ekranla ses uyuştu.
2. **Kurulum (reçeteli):** Yazıyı büyüttüm, sesi "Yavaş" yapıp denedim.
   - "Sizin için uygun mu?" artık **kısa girişle** okunuyor (18 s): "Ekrandaki durumlardan size uyan varsa işaretleyin; hiçbiri uymuyorsa en alttaki seçeneği işaretleyin. Maddelerin hepsini dinlemek için Tekrar dinle düğmesine dokunun."
   - En üstte **"Tekrar dinle (bütün maddeler)"** düğmesi var; basınca 11 maddenin hepsini kısa adlarla okudu (76 s). Maddelerin başındaki kalın kısa adlar duruyor.
   - Ama kısa girişte ekrandaki **"Emin olmadığınız bir madde varsa işaretleyin ve doktorunuza sorun"** cümlesi yok. Yalnız dinleyen biri "hiçbiri uymuyorsa en alttakini" duyar; emin olmadığında ne yapacağını duymaz (tam listede var).
3. **Reçetesiz kurulum:**
   - "Tanınız" ekranı (tanı kondu mu, kanal, kulak, "Tanı ne zaman kondu?") hâlâ **sesli okunmuyor**; "posterior/lateral, Barbekü/Gufoni" kelimeleri duruyor.
   - Boyun kireçlenmesini işaretleyince çıkan kilit ekranı ("Sizi engelleyen durum: Boyun sorunu" ve doktora sorulacaklar) da **sesli değil**.
   - Reçeteyle gelen bu ekranların hiçbirini görmüyor.
4. **İnternet yokken:** Uygulama 0,5 s'de açıldı, her şey ağsız çalıştı.
5. **14 güvenlik sorusu (gerçek hızda, sesi bekleyerek 3 dk 13 s):**
   - Sorular kısa ve benim dilimde okunuyor.
   - Yanlışlıkla "Evet" deyince "Doğru mu?" ekranında yanıtım en üstte; "Evet, doğru" altında, "Yanlış dokundum" parmağımın altında.
   - Geri tuşu önceki soruya götürüyor.
6. **"Muayeneden beri geçti mi?"** kısa okunuyor. **Hazırlık** kendiliğinden kısa hâliyle okunuyor (11 s); tam metin "Tekrar dinle"de.
7. **Tanıtma ve manevra (gerçek hız):** Yönergeler 10–13 s, "yarıya kadar" deniyor, yönerge kesilmiyor. Gecikince gelen yardım cümleleri, pozisyona gelince "Tamam, böyle kalın"la kesiliyor; doğru davranış.
8. **Sonrası:**
   - "Telefonu alnınızdan alın ve ekrana bakın" deniyor, ardından soru ve seçenekler okunuyor. "Hafif"e basınca ses kesildi ve 10 s'lik sonuç okundu: "Hafif baş dönmesi normaldir. On dakika oturun; tutunarak kalkın. Saat 17:38 civarında tekrar test edeceğiz."
   - Ekranda ayrıntı ve "Ayrıntıyı dinle" düğmesi var; 10 dakika sayacı çalışıyor.
9. **1 saat sonra:** "Baş dönmesi gelmedi. Yarın sabah bir kez daha bakalım." Konsol hatası yok.

## 3. Sorunlar (kalanlar; hiçbiri zarar ya da işi bitirememe değil)

| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Düşük–Orta | Uygunluk listesinin kısa sesli girişi | Ekrandaki "Emin olmadığınız bir madde varsa işaretleyin ve doktorunuza sorun" seste yok. Yalnız dinleyen biri "hiçbiri uymuyorsa en alttakini işaretleyin"i duyuyor; emin olmadığında ne yapacağını duymuyor | Kısa girişe tek cümle eklensin: "Emin değilseniz o maddeyi işaretleyin ve doktorunuza sorun." | Evet (d-ses.txt, c-ses.txt) |
| 2 | Düşük | Reçetesiz kurulum: "Tanınız" ve kilit ekranı | Sesli okunmuyor; "Arka (posterior) kanal", "Yatay (lateral) kanal, Barbekü ya da Gufoni" ağır (4. turdan kalan) | Soru ve seçenekler okunsun; kilit ekranı "Sizi engelleyen: Boyun sorunu. Doktorunuza şunları sorun…" diye okunsun | Evet (c-13…c-16, c-ses.txt) |
| 3 | Düşük | 14 güvenlik sorusu | Sesi bekleyince 3 dk 13 s; kan sulandırıcı 21 s, sürekli baş dönmesi 18 s ("… sayılmaz" açıklamaları klinik karar gereği kaldı) | Kabul ediyorum; ekranda "yaklaşık … dakika kaldı" yeterli olur | Evet (b-ses.txt) |

**4. kullanımdaki isteklerim:**

| 4. tur # | İstek | Durum |
|---|---|---|
| 1 | Reçetesiz "Tanınız" ve kilit ekranı sesli, kelimeler sade | **Karşılanmadı** (#2; sentezde yer almıyor) |
| 2 | 14 sorunun süresi / kalan süre | **Karşılanmadı (bilerek)**: "… sayılmaz" açıklamaları klinik karar gereği kaldı; kalan süre göstergesi yok |
| 3 | Uygunluk listesi tek parça değil: kısa giriş + tam liste ayrı | **Karşılandı**: kısa giriş 18 s; "Tekrar dinle (bütün maddeler)" tam listeyi okuyor. Kısa girişte "emin değilseniz" cümlesi eksik (#1) |
| 4 | Reçete kartında ekranda da "kristal oynaması (BPPV)" | **Karşılandı** ("SAĞ kulak — arka kanal kristal oynaması (BPPV)", ses de "sağ kulak" diyor) |
| — | Hatırlatıcı .ics yerine bildirim | **Karşılanmadı (bilerek, gerekçeli)**; ekrandaki alarm cümlesi yeterli |

## 4. Sevdiklerim
- QR'dan tekrar testine kadar okumadan yapılabiliyor. Her karar ekranı kısa konuşuyor, seçince susuyor, "Tekrar dinle" her yerde var. Uzun ayrıntılar "bütün maddeler" ya da "Ayrıntıyı dinle"ye ayrılmış.
- Telefon alındayken akış kusursuz ve internetsiz: "yarıya kadar", "Şimdi yatın", 10 s'lik bitiş cümlesi.
- Güvenlik soruları ve onay ekranları benim dilimde. Yanlış dokunuş beni hiçbir zaman sessizce kilitlemiyor.

## 5. Memnuniyet: 9/10 (6 → 7 → 8 → 9 → 9)
Reçeteyle gelen biri için okuma güçlüğü artık engel değil. Kalanlar reçetesiz kurulumda sessiz iki ekran ve uygunluk girişindeki eksik tek cümle; ikisi de küçük.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Koşullu (hafif koşul).**
- Koşul: Fatma gibi okuması zayıf biri doktordan **QR reçeteyle** gelsin.
- İlk kurulum ve baş dönmesi yokken bir "Deneme manevrası" bir kez bir yakınla ya da hekimin yanında yapılsın. Telefonun alna nasıl konacağını ve "ekrana dokun" alışkanlığını bir kez görmek yeter.
- Sonra ataklarda tek başına kullanabilir. Reçetesiz kurulum (sessiz "Tanınız" ekranı) okuyamayan biri için hâlâ bir yakın ister.

Betik, ekran görüntüsü ve ses kayıtları: `scratchpad/kullanicilar/tur-5/k05-okuma-guclugu/` (a-akis, b-gercek-hiz, c-yanlis-anlama, d-tum-maddeler; *-ses.txt).
