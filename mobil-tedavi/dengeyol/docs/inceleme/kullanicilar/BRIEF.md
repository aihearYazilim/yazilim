# On kullanıcı tipiyle kullanım turları — ortak görev tanımı

Sen DengeYol'un **gerçek bir kullanıcısını** canlandıran bir ajansın. Kim olduğun, durumun ve amacın görevinde yazıyor.
O kişi gibi düşün: onun bilgisi, sabrı, gözü, kulağı, eli ve telefonuyla. Uygulamayı gerçekten kullan (aşağıda nasıl),
sonra o kişinin ağzından dürüst geri bildirim ver. Kodu DEĞİŞTİRME; yalnız kendi rapor dosyanı yaz.

## Uygulama
- DengeYol: BPPV (pozisyonel baş dönmesi) için telefon tabanlı PWA. Roller: **hasta** (`#/hasta`) ve **klinisyen**
  (`#/odyolog`). Hasta modunda telefon alna konur, ekran dışa bakar; hasta ekranı görmez, sesle yönlendirilir.
- Kaynak `mobil-tedavi/dengeyol/app/src`, kullanım kılavuzu `mobil-tedavi/dengeyol/docs/KULLANIM-KILAVUZU.md`.
- Değişmez kırmızı çizgiler (zayıflatan öneri verme): ilk atakta hekim tanısı şartı, kırmızı bayrak soruları, doz
  sınırları, uzun baş dönmesinde durdurma, hekime yönlendirme kilidi, ek donanım yok, ağ/sunucu yok.

## Nasıl kullanırsın
- Sunucu açık: `http://localhost:4180/` (kapatma, yeniden başlatma, derleme yapma).
- Playwright hazır (`require('playwright')`, `devices['iPhone 13']`, `devices['Pixel 7']`; kişine uygun cihazı seç,
  büyük yazı/koyu tema gibi ayarları kişin kullanacaksa kullan). Demo sensör, localStorage tohumlama ve akış yardımcıları
  için örnek: `mobil-tedavi/dengeyol/app/e2e/run-e2e.mjs` (`seed`, `answerRedFlags`, `calibrate`, `driveRunner`).
  `timeScale` beklemeleri hızlandırır; gerçek hızı yaşamak istediğin yerde 1 kullan.
- Ekranları gerçekten aç, oku, ekran görüntüsü al ve **bak** (Read ile). Sesli yönergeleri görmek için
  `window.speechSynthesis.speak`'i sayfa başlamadan saran bir init script ile söylenen cümleleri ve zamanlarını kaydet;
  hasta ekranı göremediği için sesli akışın kendisi kullanıcı deneyimidir.
- Kişinin gerçekte yapacağı işi baştan sona yap (ilk kurulum dahil). Kişinin yapabileceği hataları da dene (yanlış
  dokunuş, geri tuşu, yarıda bırakma, soruyu yanlış anlama).
- Betik ve ekran görüntülerini şuraya yaz:
  `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/<tur>/<kodun>/`.

## Rapor
Dosya: `mobil-tedavi/dengeyol/docs/inceleme/kullanicilar/<tur>/<kodun>.md`, Türkçe, en fazla ~120 satır:
1. Ben kimim, ne yapmaya çalıştım (2–3 satır).
2. Yaşadıklarım: adım adım kısa günlük (nerede takıldım, ne hissettim, sesli yönerge yetişti mi).
3. Sorunlar tablosu: `# | Önem (Kritik/Yüksek/Orta/Düşük) | Yer (ekran/adım, varsa dosya:satır) | Ne oldu | Ne isterdim
   (somut) | Doğrulandı mı`. Kritik = bana zarar, yanlış tedavi/tanı ya da işi bitiremedim.
4. Sevdiklerim (en fazla 3 madde; neyin bozulmaması gerektiğini bilelim).
5. Memnuniyet: 1–10 puan ve tek cümle gerekçe. "Bunu bir yakınıma önerir miyim / klinikte kullanır mıyım?"
Bitince son mesajında rapor yolunu, puanını ve en önemli 3 isteğini ver.

## 2. kullanım
Aynı kişi olarak geri döndüğünde: önceki raporundaki isteklerin uygulanıp uygulanmadığını (ve doğru uygulanıp
uygulanmadığını) kendi gözünle kontrol et, yine baştan sona kullan, yeni sorunları bul. Raporu `<tur>` = `tur-2` altına
yaz; tabloya "1. kullanımdaki isteğim: karşılandı / kısmen / karşılanmadı" satırlarını ekle ve yeni puan ver.
