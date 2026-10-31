# k01 — Hatice (72, yalnız yaşıyor) · tur-6

## 1. Ben kimim, ne yapmaya çalıştım
72 yaşında emekli bir öğretmenim, yalnız yaşıyorum. Sağ arka kanal BPPV'm var; hekimim "2 hafta önce" tanı koydu ama reçete bağlantısı
vermedi. Pixel 7 kullanıyorum; yazı "Büyük", konuşma "Yavaş". Telefon verisini silip ilk kurulumdan başladım ve gerçek hızda (×1)
baştan sona kullandım: kurulum → 14 güvenlik sorusu → iki taraf testi → Epley → 1 saat sonra tekrar testi → rapor. Bu kez gece
kullandım (saat 00:10–01:40). Ardından taraf testinde ve tekrar testinde "Kendimi kötü hissediyorum" yolunu bilerek denedim.

## 2. Yaşadıklarım (günlük)
- **Kurulum ve güvenlik soruları:** 5. turdaki gibi. Ses denemesi yaptım, "Yavaş" seçtim. Uygunluk listesi kısa girişle okunuyor.
  "Hekiminiz '2 hafta önce' dediyse de bunu seçin" notu duruyor. Sorular anlaşılır; alt tip 24 s, süre 22 s, taraf 18 s.
- **İki taraf testi ve Epley (×1):** Değişmemiş ve iyi.
  - Pozisyona gelince "Tamam, böyle kalın" hemen söyleniyor.
  - "Zorlamayın" uyarısı yalnız ~10 s takılınca geliyor; düzeltince kesiliyor.
  - Baş dönmesinin 15. saniyesinde sakin bir hatırlatma geliyor; dokununca "Geçti" anında söyleniyor.
  - En uzun sessizlik ~8 s.
- **Sonrası:**
  - Telefonu indirip ekrana dokununca "Şu an nasılsınız?" artık **tek akıcı cümleyle** okunuyor ("İyiyim; hafif baş dönmesi ya da
    bulantı var; …; yeni belirti var: konuşma bozukluğu…"). Süre 28 s'den 23 s'ye indi.
  - "Hafif" dedim. Ses: "On dakika oturun; tutunarak kalkın. **Tekrar testi saat 02:27; uyuyacaksanız uyanınca yapın.**"
  - Ekranda da "Test saati (02:27) gece… alarm kurmanız gerekmez, uyanınca yapın" yazıyor. Altı turdur istediğim gece notunu ilk kez
    kendi gözümle gördüm; çok rahatladım.
- **1 saat sonra:** Tekrar testinde baş dönmesi gelmedi, sabah testi önerildi. "Hekime gönder" ile giden rapor düz ve okunur.
- **Duraklatma ve "kötüyüm" yolu (×1):**
  - **Önceki turlarda düzelenler aynen duruyor:**
    - Düğmenin üstüne kör basılı tutunca manevra devam ediyor.
    - Baş dönmesi işaretliyken kör dokunuş, "Pozisyona gelemiyorum" düğmesine denk gelse bile yalnız "geçti" sayılıyor.
    - Onaylı düğmeye ikinci kör dokunuş hiçbir şey yapmıyor.
    - "Evet" düğmesi, ses bittikten 10 s sonra bile açık.
  - **Taraf testinde "Kendimi kötü hissediyorum" + onay:** Bu kez **"Dinlenin"** ekranı geldi: "Testi durdurdunuz. Yavaşça oturun,
    dinlenin ve su için. Kendinizi iyi hissetmiyorsanız ya da yeni bir belirti varsa hekiminize başvurun; acil belirtilerde 112'yi
    arayın." Aynısı sesli okundu (20 s). Raporda "Testte durdurma — sol taraf testi durduruldu: hasta kendini iyi hissetmedi" yazıyor.
  - **Tekrar testinde aynı yol:** Sırtüstü sarkıkken midem bulandı. Telefonu alıp "Duraklat"ı basılı tuttum, "Kendimi kötü
    hissediyorum"a dokunup onayladım. Yine "Dinlenin" ekranı ve sesi geldi; raporda "tekrar testi (sağ) durduruldu: hasta kendini iyi
    hissetmedi" satırı var.
  - **Küçük bir şey:** "Dinlenin" ekranından ana ekrana dönünce hemen büyük düğmeyle "Tekrar testini yap" (taraf testinden sonra
    "Ataka devam et") önerildi. Az önce kötü olmuş biri olarak "iyi hissettiğinizde" gibi bir not beklerdim.
- **Ses yeterli mi?** Evet. Kesilmeler ya istenen kesmeler (pozisyona gelince ipucu, dokununca hatırlatma) ya da demo modunun tahmini
  süreleri ("Başlıyoruz…" ve tanıtma cümleleri). Gerçek sensörde konuşmanın bitişi bekleniyor (kod), bunu gerçek modda doğrulayamadım.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Düşük | Testte "kötüyüm" durdurmasından sonra ana ekran (`PatientHome.tsx`, aktif atak kartı) | Ana ekran hemen "Tekrar testini yap" / "Ataka devam et" diyor; az önceki kötü hissetme anılmıyor. | Kartta tek satır: "Son test, siz kötü hissettiğiniz için durdu. Kendinizi iyi hissettiğinizde yapın; geçmiyorsa hekiminize başvurun." Düğme kalabilir. | Evet (taraf testi ve tekrar testi, ×1) |
| 2 | Düşük | "Yavaş" seste güvenlik soruları | 14 sorunun sesli okunuşu toplam ~3,5 dk. | Klinik ekibin kararını bekliyor (sentezde gerekçeli). Ekranda tam metin kalsın; seste kısa biçim düşünülsün. | Evet |
| 3 | Düşük | Gerçek telefon | Demo modunda "Başlıyoruz. Yönergeleri dinleyin." ve tanıtma cümleleri kesik. Gerçek sensörde bitişi bekleniyor, ama görmedim. | Pilotta gerçek Android'de "Yavaş" sesle bir tam tur kaydı. | Hayır (yazılım dışı) |

**5. kullanımdaki isteklerim**
| Tur-5 # | İsteğim | Durum | Not |
|---|---|---|---|
| 1 | Taraf testinde ve tekrar testinde "Kendimi kötü hissediyorum" → "Dinlenin" ekranı ve sesi; raporda satır | Karşılandı | İkisi de ×1'de denendi: ekran, 20 s'lik ses ve rapordaki "hasta kendini iyi hissetmedi" satırı var. |
| 2 | "Şu an nasılsınız?" okunuşu kısalsın, belirti listesi kalsın | Karşılandı | Tek akıcı cümle, 23 s; "yeni belirti" listesi okunuyor. |
| 3 | Gerçek Android'de "Yavaş" sesle tam tur | Bilerek yapılmadı | Yazılım dışı, pilota bırakıldı (sentez). |
| (tur-1 #5) | Gece hatırlatıcısı "uyanınca yapın" | Karşılandı | Gece kullanımında seste ve ekranda gördüm. |
| (önceki turlar) | Duraklatmada kör basma/dokunma, onay süresi, "Tamam"/"Geçti" zamanlaması, hatırlatmalar | Korunmuş | B1–B4 yeniden doğrulandı. |

## 4. Sevdiklerim
- Kötü hissettiğimde artık ne yapacağımı biliyorum: kısa bir onay, ardından "oturun, dinlenin, su için; geçmezse hekim, acil
  belirtide 112". Hekimime giden raporda da yazıyor.
- Gece düşünülmüş: "uyuyacaksanız uyanınca yapın" ve "gece ise ışığı açın". Yalnız yaşayan biri için bu cümleler çok değerli.
- Ekrana bakmadan, yavaş seste, yanlış dokunuştan korkmadan baştan sona gidebilmek.

## 5. Memnuniyet
**9,5/10.** Beş turdaki bütün isteklerim yerine geldi; kalanlar küçük ve çoğu yazılım dışı. Tam puanı, gerçek telefonumda gerçek
sensörle bir kez deneyince veririm.

**Bu sürümü bir yakınıma önerir miyim: Evet**, şu koşulla: ilk kullanımdan önce baş dönmesi yokken bir kez "Deneme manevrası"
yapıp sese ve dokunuşlara alışsın. Uygulamanın gerçek telefondaki doğrulaması (pilot) ekibin işi; benim tavsiyem ona bağlı değil
ama tam puanım bağlı.

Betikler, ses dökümleri (`p2-ses.txt` gerçek hız ve yavaş ses, `p4pause-ses.txt`, `p5-ses.txt` tekrar testinde "kötüyüm") ve ekran
görüntüleri: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-6/k01-yasli-yalniz/`
