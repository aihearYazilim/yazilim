# Tur 1 — k04: Kemal, 66, işitme cihazlı (Pixel 7)

## 1. Ben kimim, ne yapmaya çalıştım
Emekli teknisyenim. İki kulağımda orta-ileri sensörinöral işitme kaybı var; Bluetooth işitme cihazı takıyorum. Telefon sesi doğrudan
cihaza geliyor ama hızlı konuşmayı ve arka arkaya gelen cümleleri kaçırıyorum. Yatınca cihaz yastığa sürtünüp ıslık çalıyor ya da
kayıyor. Hekimim sol arka kanal BPPV dedi. Uygulamayı kurdum, konuşmayı "Yavaş"a aldım, bir atakta testleri ve sol Epley'i yaptım.
Asıl merak ettiğim şuydu: Sesi kaçırırsam yalnız titreşimden ne yapacağımı anlayabilir miyim?

## 2. Yaşadıklarım (Playwright, Pixel 7, demo sensör, gerçek hız ×1; söylenenleri `speechSynthesis` sarmalayıcısıyla kaydettim)
- **Kurulum (~1 dk):** Yazıyı "Büyük" yaptım. Uygunluk sayfasında "İşitme kaybınız varsa da kullanabilirsiniz… titreşim ve bip
  sesleri ne zaman hareket edeceğinizi bildirir" yazısını görünce içim rahatladı. Ama hangi titreşimin ne anlama geldiğini
  uygulamanın hiçbir yerinde öğrenemedim. Ritim tablosu yalnız kılavuzda var.
- **Ayarlar:** Konuşma hızında en yavaş seçenek "Yavaş" (0,8). "Sesi dene" bir bip, tek titreşim ve bir cümle çalıyor; titreşim
  ritimlerini tanıtmıyor. Yaklaşma sesi ve titreşim varsayılan olarak açıktı.
- **Güvenlik soruları (11 soru, Yavaş hızda ~2 dk):** Her soru hem ekranda yazılı hem sesli okunuyor; bu iyi. Ama sorular uzun ve
  "ya da"larla dolu: 6 ile 16 saniye arası sürüyor. En uzunu "Bu baş dönmesi… FARKLI mı? (BPPV: …)" 174 harf, 15,8 saniye.
  Kaçırdığım soruyu yeniden dinletecek bir düğme yok, ekrandan okudum. Yanlışlıkla "Evet"e bastım; çıkan onay ekranı sesli
  okunmadı. "Yanlış dokundum" deyince soru yeniden okundu.
- **Telefon tanıtma (~45 s):** Yönergeler bitmeden ölçüm başlamadı, 3-2-1 sayımı bip ve sesle geldi. Güzeldi.
- **İki taraf testi ve ara:** "Doğru pozisyon" titreşimi her adımda yönerge bittikten 0,7 ile 1,4 saniye sonra geldi. 10 saniyede
  bir "… saniye kaldı" diyor; kısa, yetişebildim. 30 saniyelik arada "20 saniye", "10 saniye" deniyor, sonunda "iki uzun"
  titreşim geliyor. Sol tarafta baş dönmesini ekrana dokunarak işaretledim; karar ekranı "Sol tarafta baş dönmesi oldu" dedi.
- **Epley sol (~5 dk):** Sırtüstü adımının yönergesi 221 harf; Yavaş hızda 20 saniye sürdü (daha yavaş bir seste 28 saniye).
  İlk cümlede "hızla sırtüstü yatın" dendiği için yönergenin kalanını yatarken, yastık cihaza sürtünürken dinledim; ortasını
  kaçırdım. Başka bir adımda işitme cihazımı düzeltirken başım kaydı. 2 saniye sonra "hızlı üçlü" titreşim ve "Pozisyonu koruyun.
  Başınızı biraz daha sola çevirin." geldi, 5 saniye sonra tekrarlandı. Yön bilgisi yalnız seste var. Geri tuşuna yanlışlıkla
  bastım; uygulama manevrayı kapatmadı, duraklattı. Devam edince pozisyonumu yeniden doğruladı. Manevra bitti, "Şu an
  nasılsınız?" ve "10 dakika oturun, 00:25'te tekrar testi" geldi.
- **Daha yavaş bir TTS sesiyle (10 harf/s × 0,8):** Sayaç ve "doğru" titreşimi, yönerge bitmeden 3,5 ile 6,6 saniye önce
  başladı (ep-1: 6,6 s; ep-2: 4,2 s; ep-3: 4,1 s; ep-4: 3,5 s). "Tamam, böyle kalın" cümlesi yönergenin arkasından kuyruğa girdi.
- **İşitme cihazım yatarken çıktı (ayrı deneme):** Epley'in sırtüstü adımında cihaz çıktı. Tutmaya çalışırken telefona kazara
  dokundum ve bu "baş dönmesi başladı" olarak işaretlendi. Bundan sonra hiçbir şey duymadım. Yalnız 30 saniyede bir tek kısa
  titreşim geldi (5 kez). Bunları "Tamam, böyle kalın"daki tek uzun titreşimden ayıramadım; "doğru yerdeyim" sanıp bekledim.
  2 dakika sonra uzun üçlü alarm geldi: "Manevra durduruldu, hekiminize başvurun". Ana ekranda da "Önce hekiminizle görüşün"
  kilidi açıldı. Kural doğru işledi, ama tedavim bir kazara dokunuş ve duyamadığım bir cümle yüzünden yarıda kaldı.
- **Sayılar:** Ana turda 82 cümle, toplam 408 saniye konuşma ve 12 cümle 10 saniyeden uzundu. Ölçülen 37 titreşim yalnız
  7 farklı desenden oluşuyordu; bunların çoğu birbirine çok benziyor (aşağıda).

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Kritik | Manevra, baş dönmesi işareti; `core/runner.ts:544`, `platform/haptics.ts:14,20` | Cihaz çıkıp kazara dokununca işaretli kaldı. Hatırlatma yalnız sesli ve tek kısa titreşimle geldi; bunu "doğru, böyle kalın"dan ayıramadım. 120 s sonra güvenlik durdurması ve hekim kilidi. Tedaviyi bitiremedim. | Durdurma kuralı ve kilit aynen kalsın. Ama "baş dönmesi işaretli" durumunun **kendine özgü** bir titreşimi olsun (ör. kısa-kısa-uzun), hatırlatma bu desenle ve ilk kez 15 s'de gelsin. Ekran, işaretliyken titreşimle "geçtiyse dokunun" desenini düzenli tekrarlasın. | Evet (`b-log.json`, `b-02-sonuc.png`, `b-04-ana.png`) |
| 2 | Yüksek | Titreşim desenleri; `platform/haptics.ts:14-22` | "Pozisyon bozuldu" [90,80,90,80,90] ile "adım bitti" [80,60,80,60,80] elde aynı. "Şimdi hareket et" [250,150,250], "duraklatıldı" [350,200,350] ve "geçti" [150,120,150] hepsi çift titreşim. "Doğru" [400] ile "işaretlendi/hatırlatma" [180] ikisi de tek titreşim. Manevranın bitişi ile adım bitişinin titreşimi aynı. | En çok 5 desen olsun ve süre/sayıyla kesin ayrılsın (ör. bozuldu = sürekli hızlı vızıltı 1,5 s; bitti = 3 uzun; dur = çok uzun tek). "Duraklatıldı" deseni "hareket et"ten ayrı olsun. Manevra bitişinin ayrı bir deseni olsun. | Evet (kod ve kayıt) |
| 3 | Yüksek | Kurulum / Ayarlar | Titreşim ritim tablosu uygulamada yok, yalnız kılavuzda var. "Sesi dene" desenleri tanıtmıyor. | Ayarlar'a ve uygunluk sayfasındaki işitme notunun altına **"Titreşimleri tanı"** ekranı: her deseni anlamıyla tek tek çalan düğmeler. Hazırlık ekranında da tek satırlık hatırlatma. | Evet (`grep`, `a1-08-ayarlar-yavas.png`) |
| 4 | Orta | Yürütücü giriş süresi; `core/runner.ts:594`, `ui/screens/RunnerView.tsx:103` | Sayaç tahmini konuşma süresiyle (13 harf/s) başlıyor. Daha yavaş bir seste yönerge bitmeden 3,5-6,6 s önce "doğru" titreşimi geliyor ve sayaç başlıyor. Tanıtma ve yerleştirme gerçek bitişi bekliyor (`RunnerView.tsx:305`), adımlar beklemiyor. | Adım girişi de konuşmanın gerçek bitişini (`onend`) beklesin. Olay gelmezse şimdiki tahmin üst sınır olsun. | Evet (`a3-log.json`, sahte TTS 10 harf/s ile) |
| 5 | Orta | Adım yönergeleri; `core/protocols.ts:295,307,319` | Sırtüstü yönergesi 221 harf (Yavaş hızda 20-28 s). Eylem ilk cümlede, ayrıntılar yatarken geliyor; yastık sesi ve ıslık sırasında kaçırıyorum. | Önce kısa eylem cümlesi ("Hızla sırtüstü yatın, baş sola dönük"), 1 s ara, sonra ayrıntı. Pozisyon doğrulanınca ana eylemin 3-4 kelimelik özeti bir kez daha söylensin. | Evet (`a2-log.json`) |
| 6 | Orta | Ayarlar, konuşma hızı; `ui/screens/Settings.tsx:64` | En yavaş seçenek 0,8; benim için yetmiyor. | "Çok yavaş" (≈0,65) seçeneği ve "Sesi dene"de seçili hızla örnek bir yönerge. | Evet |
| 7 | Orta | Hazırlık ekranı | İşitme cihazı kullananlara hiçbir hatırlatma yok (Bluetooth bağlı mı, yatarken kayabilir, yakınla yapmak). Cihaz yatarken çıkarsa uygulama bunu bilemiyor; ses telefonun hoparlörüne geçer ve alnımdaki telefondan zor duyarım. | Hazırlıkta "İşitme cihazı kullanıyorum" seçeneği: Bluetooth'u kontrol ettirsin, cihaz/kulaklığı sabitlemeyi ve yakınla yapmayı önersin, titreşim tablosunu göstersin. Ses çıkışı değişince (`devicechange` olayı, mümkünse) duraklatsın ve alarm titreşimi versin. | Kısmen (ekran doğrulandı; `devicechange` davranışı cihazda denenmedi) |
| 8 | Düşük | Güvenlik soruları; `EpisodeFlow.tsx:1242` | Sorular 6-16 s sürüyor; kaçırınca yeniden dinletme yok. "Evet" onay ekranı sesli okunmuyor. | Her soruda "🔊 Tekrar dinle" düğmesi. Onay ekranı da okunsun. Parantezli açıklamalar ayrı satıra alınsın. | Evet |
| 9 | Düşük | Ara ve karar ekranları; `EpisodeFlow.tsx:1129,1148` | "Dokunarak devam et" anlamında da "şimdi hareket et" deseni (iki uzun) çalıyor. Sesi duymazsam hareket etmem gerektiğini sanabilirim. | "Hazırsanız dokunun" için ayrı bir desen (ör. tek uzun + kısa). | Evet |
| 10 | Düşük | Başlangıç; `RunnerView.tsx:396` | Yavaş hızda "Başlıyoruz. Yönergeleri dinleyin." 3 s sayımla %94'te kesiliyor (son kelime gidiyor). | Sayım, cümlenin gerçek bitişinden sonra başlasın. | Evet (demo modunda; giriş notlu cümle gerçek cihazda bekletiliyor) |

## 4. Sevdiklerim
- Söylenen her cümle ekranda da yazılı ve sorular hem sesli hem yazılı. Ses perdesi düşük bipler (≤ ~800 Hz) kulağıma uygun.
- Yönergeler 10 saniyede bir kısa "… saniye kaldı" ile bölünüyor; uzun sessizlik yok. Geri tuşu manevrayı bitirmiyor, duraklatıyor;
  devamda pozisyonumu yeniden doğruluyor.
- Uzun baş dönmesinde durdurma ve hekim kilidi kesin işledi; bu bozulmasın. Benim isteğim yalnız bu duruma kazara düşmemek.

## 5. Memnuniyet: 6/10
Cihazım takılıyken ve sesi duyduğum sürece akış sakin ve iyi zamanlanmış. Ama sesi kaçırdığım anda titreşimler "doğru mu,
bozuldu mu, bitti mi, sorun mu var" sorusunu tek başına cevaplamıyor; tek bir kazara dokunuşla tedavim hekim kilidine düştü.
Yakınıma önerir miyim? Bir yakınıyla birlikte yapacaksa evet. Tek başına yapacak işitme cihazlı birine, 1-3 numaralı istekler
yapılana kadar hayır.

---
Kanıtlar: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-1/k04-isitme-cihazli/`
(`a1-*`: kurulum/ayarlar; `a2-*`: gerçek hızda atak, 14 harf/s; `a3-*`: Epley sonu, 10 harf/s; `b-*`: cihaz çıktı + kazara dokunuş;
`*-log.json`: ses/titreşim/bip zaman kayıtları, `analiz.cjs` ile okunur). Not: demo modu; gerçek titreşim hissi, Bluetooth
yönlendirmesi ve gerçek Türkçe TTS hızı cihazda denenmedi. TTS süreleri sahte motorla modellendi.
