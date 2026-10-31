# Tur 5 — k04: Kemal, 66, işitme cihazlı (Pixel 7)

## 1. Ben kimim, ne yapmaya çalıştım
Emekli teknisyenim. İki kulağımda orta-ileri işitme kaybı var, Bluetooth işitme cihazı kullanıyorum. Yatarken cihaz kayıyor,
bazen ıslık çalıyor. Sol arka kanal BPPV tanım var. 4. turdaki isteklerimin yapılıp yapılmadığına kendim baktım. Sonra boş bir
telefonla kurulumdan manevra sonrasına kadar her şeyi yeniden yaptım. Sunucu: `http://localhost:4182/`.

## 2. Yaşadıklarım
Nasıl denedim: Pixel 7 öykünümü, demo modu kapalı. Gerçek sensör yolunu `devicemotion` olaylarıyla taklit ettim. Konuşma hızı
**Çok yavaş** (0,65); sahte TTS bu hızda saniyede 6,5 harf okudu. Kullanım sınırı yüzünden iş yarıda kesildi. Kesilmeden önce
üç betik de tamamlanmıştı; kayıtları yeniden çalıştırmadan inceledim.

- **Kurulum:**
  - Uygunluk sayfası artık kısa bir girişle okunuyor; tam liste "Tekrar dinle"de.
  - "Titreşimleri tanı"daki 11 desenin hepsi doğru çaldı.
- **Güvenlik soruları:** 4. turla aynı. Çok yavaş hızda ilk soru 29 s, ortostatik 21 s, kan sulandırıcı 35 s, kulak 25 s,
  "farklı mı" 29 s sürüyor. Bu bilerek yapılmadı (klinik ekip kararı).
- **Seçenekli ekranlar:** Okunan kısa biçim yerinde duruyor: 33, 28 ve 23 s.
- **Hazırlık:** Ekran kısa hâliyle okunuyor (19 s). "Titreşimleri tanı" yerinde açılıyor.
- **Testler:** Önceki turlarda düzelenlerin hepsi yerinde:
  - "Doğru" titreşimi yönerge bitince geliyor.
  - Oturuş cümlesi tam okunuyor.
  - Ara ve karar ekranlarında "iki kısa" titreşim var.
  - Süresi geçmiş sayım yok.
- **Epley sol:**
  - **Kayma:** Cihaz ıslık çalınca başım kaydı. Vızıltı ve düzeltme cümlesi geldi. Geri dönünce 0,3 s içinde "1 uzun" ve
    "Tamam, böyle kalın" geldi.
  - **Yanlış taraf:** Sol yanıma yuvarlandım. 0,2 s sonra "altı kesik vuruş", "Dur! Yanlış taraf." ve ardından "Önce
    sırtüstüne dönün…" geldi.
  - **Sırtüstüne dönüş (4. turdaki isteğim):** Sırtüstüne geldiğim anda (0,3 s) **"2 uzun"** titreşim geldi ve kısa
    **"Tamam, şimdi sağ yanınıza."** (4 s) söylendi. Eski yönerge kesildi. Sesi duymasam da "şimdi hareket et" titreşimiyle
    doğru yana dönebilirdim. Doğru yana geçince "1 uzun" ve "Tamam" geldi.
  - **Duraklatma (geri tuşu):** Ses artık yalnız "Duraklatıldı. Devam için ekrana iki saniye basılı tutun." (56 harf, 8,9 s).
    Sayfada **"Tekrar dinle (ayrıntılı)"** düğmesi var. Ona dokununca boyun ağrısı ve "Pozisyona gelemiyorum" yolunu anlatan
    tam metin okundu (31 s). Ardından basılı tutunca devam etti.
- **Manevra sonrası:**
  - Telefon alnımdayken yalnız "Telefonu alnınızdan alın ve ekrana bakın." söylendi.
  - "Şu an nasılsınız?" ben dokunmadan, kısa süre sonra kendiliğinden okundu (36 s; telefon artık elimde).
  - Dinlenme cümlesi 12 s.
  - Bitiş ekranında yeni bir satır var: "Uyku pozisyonu kısıtlaması ya da boyunluk gerekmez."
- **İşitme cihazım çıktı ve ekrana kazara dokundum:**
  - Ritmi bilen Kemal: 15. saniyede "kısa-kısa-UZUN"u tanıdı, dokundu ve manevrayı bitirdi.
  - Ritmi bilmeyen Kemal: 2. dakikada durdurma ve hekim kilidi geldi. Son hatırlatma, durdurma cümlesinden önce bitiyor.
- **Toplam:**
  - Oturum 21,6 dakika sürdü; bunun 17,5 dakikası konuşma (108 cümle). Soru ve seçim bölümü 7 dakika.
  - 7 cümle kesildi. Hepsi yerinde: daha önemli bir uyarı geldiği ya da ben dokunduğum için kesildiler.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| — | — | **4. kullanımdaki isteklerim** | | | |
| 1 | Orta→ | Kırmızı bayrak sesli biçimi | **Karşılanmadı (bilerek; klinik ekip kararı).** Dört soru Çok yavaşta hâlâ 21–35 s sürüyor. Gerekçeyi kabul ediyorum, ama benim için en uzun bölüm burası. | Klinik ekip ileride değerlendirsin: "… sayılmaz" açıklamaları yalnız ekranda kalsın, soru gövdesi okunsun. | Evet (`r2-run.txt`) |
| 2 | Düşük→ | Yanlış taraftan sırtüstüne dönüş | **Karşılandı.** 0,3 s'de "2 uzun" titreşim ve "Tamam, şimdi sağ yanınıza." | — | Evet (`r2-log.json` 1060,6–1060,9 s) |
| 3 | Düşük→ | Duraklatma sesi | **Karşılandı.** Kısa sesi 8,9 s; ayrıntı "Tekrar dinle (ayrıntılı)" düğmesinde (31 s). | — | Evet (1071–1080 s, `r2-13-duraklatildi.png`) |
| — | — | **Kalan küçük konular** | | | |
| 4 | Düşük | Seçenekli ekranlar ve "Şu an nasılsınız?" | Seçeneklerin kısa adları okunuyor: Çok yavaşta 23–36 s. Telefon elimde, yazıyı da okuyabildiğim için sorun küçük. | Seçim yapılınca ses hemen kesilsin (2. turda istenmişti; bu turda denemedim). Bu ekranlarda seçenek listesi yalnız "Tekrar dinle"de okunsun. | Kısmen (süre doğrulandı, kesilme denenmedi) |
| 5 | — | Yazılım dışı | Gerçek telefonda alındaki titreşimin ayırt edilebilirliği ve Bluetooth işitme cihazında gerçek TTS hızı denenmedi. | Pilotta bir işitme cihazlı kullanıcıyla gerçek cihazda bir deneme. | Hayır (öykünüm) |

## 4. Sevdiklerim
- Titreşimin tam bir dili var; işitme cihazım çıksa bile her anı anlıyorum: hareket et, doğru, bozuldu, adım bitti, bitti,
  hazırsan dokun, işaretli, geçti, duraklatıldı, yanlış taraf, dur. Bunlara yeni eklenen "sırtüstüne geldin, şimdi doğru yana"
  da var.
- Sesler kısa ve eylemle başlıyor; ayrıntı isteyen "Tekrar dinle"ye basıyor.
- Kırmızı çizgiler hiç gevşemedi. Kazara dokunuş bile ancak ritmi tanıyıp dokununca güvenle çözülüyor.

## 5. Memnuniyet: 9,5/10 (6 → 8 → 9 → 9,5 → 9,5)
4. turdaki iki somut isteğim tam ve doğru yapıldı. Kalan tek konu, güvenlik sorularının Çok yavaş hızdaki uzunluğu. Bu klinik
bir karar ve bilerek bırakıldı. Puanı o yüzden 10 vermiyorum.

**Bu sürümü bir yakınıma önerir miyim: Evet. Koşulu:**
- İlk kurulumda "Titreşimleri tanı" bir kez birlikte denensin.
- İşitme cihazı Bluetooth'la bağlıyken "Sesi dene" ile hız seçilsin.
- Titreşimlerin alında gerçekten ayırt edilebildiği gerçek bir telefonda bir kez doğrulansın (pilot).

---
Kanıtlar: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-5/k04-isitme-cihazli/`
- `r1-*`: kurulum.
- `r2-*`: gerçek sensör yolu, tam atak; kayma, yanlış taraf, sırtüstüne dönüş ve duraklatma dahil.
- `b-*` / `b2-*`: işitme cihazı çıktı; ritmi bilmeyen ve ritmi bilen Kemal.
- `*-log.json`: `analiz.cjs` ile okunur.
