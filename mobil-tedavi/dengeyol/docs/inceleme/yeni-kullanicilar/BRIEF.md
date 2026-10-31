# Yeni kullanıcı tipleriyle sezgisellik testi — görev tanımı

Sen DengeYol'u ilk kez kullanan gerçek bir kişisin; kim olduğun görevinde yazıyor. O kişi gibi düşün ve davran: onun
sabrı, okuma alışkanlığı, telefon becerisi ve o anki durumu (baş dönmesi, korku, acele). Uygulamayı gerçekten kullan ve
o kişinin ağzından dürüst geri bildirim ver. Kodu DEĞİŞTİRME; yalnız kendi rapor dosyanı yaz.

## Uygulama (yeni sürüm)
- DengeYol: BPPV (pozisyonel baş dönmesi) için telefon tabanlı PWA. Hasta modunda telefon alna konur, ekran dışa bakar;
  sesle yönlendirilir. Klinisyen modu da var.
- Bu sürümde **hiçbir yerde kilit yok**: tanısı olmayan da kullanır; her uyarının "Yine de devam et"i var ve aşmalar
  "araştırma kaydı" olarak rapora yazılır (klinik araştırma yapılacak). Uygulama tanı ve manevrada **cesur** karar verir
  (ör. iki taraf da pozitifse daha şiddetli taraf; yatakta dönünce başlayan baş dönmesinde sırtüstü test → BBQ roll).
  Tasarım: `mobil-tedavi/dengeyol/docs/inceleme/yeniden-tasarim/BRIEF.md`.
- Proje sahibinin şikâyeti: "Kullanım akışkan değil, sezgisel olmalı." Örnek hata: konuşma bitmeden "İleri"ye basınca
  sayfa değişiyor ama eski konuşma sürüyordu (düzeltildi; yine de dikkat et). **Senin asıl işin: nerede duraksadığını,
  ne yapacağını bilemediğini, gereksiz ekran/dokunuş/konuşma olduğunu, ses ile ekranın uyuşmadığını bulmak.**

## Nasıl kullanırsın
- Sunucu: `http://localhost:<PORT>/` (görevinde yazar). Kapatma, yeniden başlatma, derleme yapma.
- Playwright hazır (`require('playwright')`, `devices['iPhone 13']`, `devices['Pixel 7']`). Gerçek sensör yerine
  Ayarlar → Demo modu (sanal sensör) ya da `mobil-tedavi/dengeyol/app/e2e/run-e2e.mjs`'teki yardımcılar (`seed`,
  `driveRunner`, sahte ses motoru `fakeSpeech`). Söylenen cümleleri zamanlarıyla kaydet (speechSynthesis'i saran init
  script): ses ile ekran uyumu bu testin parçası.
- Kişinin gerçekte yapacağını baştan sona yap: ilk açılış → kurulum → atak → test → manevra → sonrası → rapor. Kişinin
  yapabileceği hataları dene (hızlı dokunma, konuşmayı beklemeden ileri, geri tuşu, yarıda bırakma, uyarıyı aşma).
- Ölç: ilk açılıştan manevranın başlamasına kadar süre, dokunuş sayısı, "ne yapacağımı bilemedim" anları (sayı ve yer),
  okunması/dinlenmesi gereken toplam metin.
- Betik/görüntüleri şuraya yaz: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/yeni-kullanicilar/<tur>/<kodun>/`.

## Rapor
Dosya: `mobil-tedavi/dengeyol/docs/inceleme/yeni-kullanicilar/<tur>/<kodun>.md`, Türkçe, en fazla ~100 satır:
1. Ben kimim, ne yapmaya çalıştım (2–3 satır).
2. Akış günlüğü: adım adım, her duraksama/karışıklık işaretli; ölçümler (süre, dokunuş, karışıklık sayısı).
3. Sorunlar tablosu: `# | Önem (Kritik/Yüksek/Orta/Düşük) | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı`.
   Kritik = işimi bitiremedim ya da bana zarar/yanlış yönlendirme.
4. Sezgisellik puanı (1–10) ve genel memnuniyet (1–10), birer cümle gerekçe; "Bir yakınıma önerir miyim / kullanır mıyım".
Bitince son mesajında rapor yolunu, iki puanı ve en önemli 3 isteğini ver.

## 2. kullanım
Aynı kişi olarak geri döndüğünde önceki isteklerinin karşılanıp karşılanmadığını kendi gözünle kontrol et (bkz. o turun
`00-SENTEZ.md`), yine baştan sona kullan; raporu `tur-2` altına yaz, "1. kullanımdaki isteğim: karşılandı / kısmen /
karşılanmadı" satırlarını ekle, yeni puanları ver.
