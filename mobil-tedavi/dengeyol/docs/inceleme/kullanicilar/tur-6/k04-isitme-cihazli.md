# Tur 6 — k04: Kemal, 66, işitme cihazlı (Pixel 7)

## 1. Ben kimim, ne yapmaya çalıştım
Emekli teknisyenim. İki kulağımda orta-ileri işitme kaybı var, Bluetooth işitme cihazı kullanıyorum; yatarken cihaz kayıyor ya da
ıslık çalıyor. Sol arka kanal BPPV tanım var. 5. turdaki isteklerimi kendim kontrol ettim. Ardından boş bir telefonla kurulumdan
manevra sonrasına kadar her şeyi yeniden yaptım. Sunucu: `http://localhost:4183/`.

## 2. Yaşadıklarım
Nasıl denedim: Pixel 7 öykünümü, demo modu kapalı. Gerçek sensör yolunu `devicemotion` olaylarıyla taklit ettim. Konuşma hızı
**Çok yavaş** (0,65), sahte TTS ile 6,5 harf/s. Bu turda iki şeyi bilerek denedim: sesler bitmeden seçim yapmak ve manevra
sonrası soruyu ses sürerken yanıtlamak.

- **Kurulum:** Uygunluk sayfasının kısa sesli girişine "Emin değilseniz o maddeyi işaretleyin ve doktorunuza sorun." eklenmiş.
  "Titreşimleri tanı"daki 11 desenin hepsi doğru çaldı.
- **Güvenlik soruları:** Önceki turla aynı. Çok yavaş hızda ilk soru 29 s, ortostatik 21 s, kan sulandırıcı 35 s, kulak 25 s,
  "farklı mı" 29 s sürüyor. Bunun bir klinik ekip kararı olduğu yazılmış.
- **Seçenekli ekranlarda sesi kesme (5. turdaki isteğim):** Alt tip ekranında okunuşun 4. saniyesinde seçim yaptım. Ses %13'te
  **hemen kesildi**, sonraki ekran temiz başladı. Artık bildiğim yanıt için 33 saniye beklemem gerekmiyor.
- **Hazırlık ve testler:** Önceki turlardaki her şey yerinde duruyor:
  - Hazırlıkta "Titreşimleri tanı" var.
  - "Doğru" titreşimi yönerge bitince geliyor.
  - Oturuş cümlesi tam okunuyor.
  - "İki kısa" titreşim çalışıyor.
  - Süresi geçmiş sayım okunmuyor.
- **Epley sol:**
  - **Kayma:** Başım kayınca vızıltı ve düzeltme cümlesi geldi. Geri döndüğümde 0,3 s içinde "1 uzun" titreşim geldi ve
    "Tamam, böyle kalın." söylendi.
  - **Yanlış taraf:** 0,3 s'de "altı kesik vuruş" ve "Dur! Yanlış taraf." geldi. Sırtüstüne geldikten yaklaşık 1 saniye sonra
    "2 uzun" titreşim geldi ve "Tamam, şimdi sağ yanınıza." söylendi. Yeni bekleme payı beni sırtüstünde gerçekten "yerleşmiş"
    sayıyor; acele etmiyor.
  - **Duraklatma:** Kısa ses şöyle: "Duraklatıldı. Devam için ekrana iki saniye basılı tutun. Boynunuz ağrıyorsa yavaşça
    oturun." (14 s). Önce eylem söyleniyor, boyun cümlesi geri gelmiş. "Tekrar dinle (ayrıntılı)" 31 s'lik tam metni okudu.
    Ekrana basılı tutunca devam etti.
- **Manevra sonrası:**
  - Telefon alnımdayken yalnız "Telefonu alnınızdan alın ve ekrana bakın." dendi.
  - "Şu an nasılsınız?" tek cümle olmuş: seçenekler noktalı virgülle sıralanıyor, "Birinci/İkinci" yok. Süre 36 s'den 31 s'ye
    indi.
  - "İyiyim"e ses sürerken (3,5 s'de) dokundum. Ses %17'de kesildi ve hemen kısa dinlenme cümlesi geldi: "On dakika oturun;
    tutunarak kalkın. Tekrar testi saat 23:29; uyuyacaksanız uyanınca yapın."
- **İşitme cihazım çıktı ve ekrana kazara dokundum:**
  - Ritmi bilen Kemal 15. saniyede kısa-kısa-UZUN'u tanıyıp dokundu; manevra tamamlandı.
  - Ritmi bilmeyen Kemal'de 2. dakikada durdurma ve hekim kilidi devreye girdi. Kırmızı çizgi korunuyor.
- **Toplam:** Oturum 20,7 dakika sürdü (önceki turda 21,6); bunun 17,5 dakikası konuşma. Kesilen 9 cümlenin hepsi benim seçimim,
  dokunuşum ya da daha önemli bir uyarı yüzünden kesildi.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| — | — | **5. kullanımdaki isteklerim** | | | |
| 1 | Orta→ | Kırmızı bayrak sorularının sesli biçimi | **Karşılanmadı (bilerek; klinik ekip kararı).** Dört soru Çok yavaşta 21–35 s sürüyor. Gerekçeyi kabul ediyorum. | Klinik ekip ileride değerlendirsin. | Evet |
| 2 | Düşük→ | Seçenekli ekranlar ve "Şu an nasılsınız?" | **Karşılandı.** Seçim yapınca ses hemen kesiliyor (alt tipte %13'te, "İyiyim"de %17'de). "Şu an nasılsınız?" tek cümle oldu (31 s). Seçenekler hâlâ okunuyor ama seçince kesildiği için beni artık bekletmiyor. | — | Evet (`r2-log.json` 323 s, 1229 s) |
| 3 | — | Gerçek cihazda doğrulama | **Yazılım dışı; açık.** Alında titreşimin ayırt edilebilirliği ve Bluetooth işitme cihazında gerçek TTS hızı denenmedi. | Pilotta bir işitme cihazlı kullanıcıyla deneme. | Hayır (öykünüm) |
| — | — | **Bu turun kontrolü** | | | |
| — | — | Duraklatma sesindeki boyun cümlesi | **Geri gelmiş.** Eylem önce, sonra "Boynunuz ağrıyorsa yavaşça oturun." (14 s). | — | Evet (1042,8 s) |
| — | — | Yeni sorun | Yok. Yeni bir Kritik, Yüksek, Orta ya da Düşük sorun bulmadım. | — | — |

## 4. Sevdiklerim
- Titreşim dili eksiksiz. İşitme cihazım çıksa bile her anı alnımda hissediyorum: hareket et, doğru, bozuldu, adım bitti, bitti,
  hazırsan dokun, işaretli, geçti, duraklatıldı, yanlış taraf, dur.
- Ses benim hızıma uyuyor: yönergenin bitmesini bekliyor, seçince susuyor, ayrıntıyı ancak istersem okuyor.
- Kırmızı çizgiler altı turdur hiç gevşemedi.

## 5. Memnuniyet: 9,5/10 (6 → 8 → 9 → 9,5 → 9,5 → 9,5)
5. turdaki yazılım isteğim (seçince ses kesilsin, sonrası kısalsın) tam olarak yapıldı ve bu turda yeni bir sorun bulmadım.
Puanı 10 yapmamamın tek nedeni, güvenlik sorularının Çok yavaş hızda uzun sürmesi. Bu bilerek bırakılmış bir klinik karar.

**Bu sürümü bir yakınıma önerir miyim: Evet. Koşulu:**
- İlk kurulumda "Titreşimleri tanı" bir kez birlikte denensin.
- İşitme cihazı Bluetooth'la bağlıyken "Sesi dene" ile hız seçilsin.
- Titreşimlerin alında gerçekten ayırt edilebildiği gerçek bir telefonda bir kez doğrulansın (pilot).

---
Kanıtlar: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-6/k04-isitme-cihazli/`
- `r1-*`: kurulum.
- `r2-*`: gerçek sensör yolunda tam atak; ses sürerken seçim, kayma, yanlış taraf, duraklatma dahil.
- `b-*` / `b2-*`: işitme cihazı çıktı (ritmi bilmeyen / ritmi bilen Kemal).
- `*-log.json`: `analiz.cjs` ile okunur.
