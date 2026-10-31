# Tur 3 — k04: Kemal, 66, işitme cihazlı (Pixel 7)

## 1. Ben kimim, ne yapmaya çalıştım
Emekli teknisyenim; iki kulakta orta-ileri işitme kaybı var, Bluetooth işitme cihazı kullanıyorum. Yatınca cihaz kayar ya da
ıslık çalar. Sol arka kanal BPPV tanım var. 2. turdaki isteklerimin karşılanıp karşılanmadığına kendim baktım. Sonra boş bir
telefonla kurulumdan manevra sonrasına kadar her şeyi yeniden yaptım.

## 2. Yaşadıklarım
Nasıl denedim: Pixel 7 öykünümü, demo modu kapalı. Gerçek sensör yolu `devicemotion` ile taklit edildi; hareket sensörü izni
verildi. Konuşma hızı **Çok yavaş** (0,65), sahte yavaş TTS ile bu hızda 6,5 harf/s.

- **Kurulum:** Tanı zamanı artık zorunlu bir seçim; "Daha önce"yi seçtim ve "her atakta iki taraf test edilir" açıklaması
  çıktı. Onam metnine riskler eklenmiş. Uygunluk listesi sesli okunuyor. "Titreşimleri tanı"da yeni "İki kısa: hazırsanız
  ekrana dokunun" deseni var; 10 düğmenin hepsi doğru ritmi çaldı.
- **Güvenlik soruları (14):** Bazıları sesli okurken kısalmış:
  - "BPPV'den farklı mı": 42 → 21 saniye.
  - Kan sulandırıcı: ilaç adları artık yalnız ekranda ("İlaç adları ekranda yazıyor").
  - Ortostatik soru: açıklama eklendiği için 11 → 21 saniye uzamış.
  - Seçenekli ekranlar (alt tip, süre, taraf) hâlâ 37–44 saniye.
  - Soru bölümü yine yaklaşık 5,5 dakika sürdü.
- **Testler:** Oturuş cümlesi ("…birazdan yatacağız") üç seferde de **sonuna kadar** okundu, ardından "Bu adım tamam" geldi.
  Ara dinlenmede süresi geçmiş bir sayım okunmadı. Ara ekranında ve karar ekranında "dokunun" anlarında artık **"iki kısa"**
  (ready) titreşimi geliyor; "hareket et" desenine karışmıyor.
- **Epley sol:** Yatış yönergesi artık eylemle başlıyor ("Başınız sola dönük kalsın; hızla sırtüstü yatın…"); 221 harften
  137 harfe, Çok yavaşta 34 saniyeden 21 saniyeye indi. "45 derece" yerine "yarıya kadar" deniyor. Her adımda "doğru" titreşimi
  yine yönergenin gerçek bitişinden sonra geldi.
- **İşitme cihazı ıslık çaldı, düzeltirken başım kaydı:** 2,3 saniye sonra vızıltı ve "Pozisyonu koruyun…" geldi. Geri döndüğüm
  anda (0,4 s içinde) **"1 uzun" titreşim** geldi, eski düzeltme cümlesi kesildi, kuyruktaki "biraz daha sola" silindi ve
  **"Tamam, böyle kalın." hemen** söylendi. 2. turdaki sorunum tamamen gitti.
- **Geri tuşu ve duraklatma:** "1 çok uzun" titreşim geldi. Duraklatma sesi artık boyun ağrısı ve "pozisyona gelemiyorum" yolunu
  da anlatıyor, ama 185 harf ve Çok yavaşta 28,7 saniye sürüyor. "İki saniye basılı tutun" talimatı üçüncü cümlede geliyor.
  Basılı tutunca devam etti; alttaki düğmeler tetiklenmedi.
- **Manevra sonrası:** Telefon alnımdayken yalnız "Telefonu alnınızdan alın ve ekrana bakın." dendi (6,6 s). Telefonu alıp
  ekrana dokununca soru ve seçenekler okundu (50 s, ama telefon artık elimde ve yazıyı da okuyabiliyorum).
- **İşitme cihazı çıktı ve ekrana kazara dokundum:**
  - Ritmi bilmeyen Kemal: hatırlatmalar daha az korkutucu ("15 s: geçince dokunun"; "45 s: bir dakikayı geçerse hekime danışmak
    gerekir"). Durdurma 2 dakikada geldi ve hekim kilidi korunuyor.
  - Ritmi bilen Kemal: 15. saniyede kısa-kısa-UZUN'u tanıdı ve dokundu; manevra tamamlandı, kilit yok.
- **Toplam:** Oturum 22 dakika, bunun 17,7 dakikası konuşma (103 cümle). Kesilen 5 cümlenin hepsi benim dokunuşum ya da yeni
  bir öncelikli bildirim yüzünden kesildi; düşen tek cümle, silinmesini istediğim eski ipucu.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| — | — | **2. kullanımdaki isteklerim** | | | |
| 1 | Orta→ | Kaymadan dönüş | **Karşılandı.** "1 uzun" titreşim, eski ipucu kesilip silindi, "Tamam" hemen söylendi. | — | Evet (`r2-log.json` 1004–1013 s) |
| 2 | Orta→ | Konuşma yükü | **Kısmen.** Telefon alındayken tek kısa cümle ✓, Epley yatış 34 → 21 s ✓, bazı sorular kısaldı ✓. Seçenekli ekranlar hâlâ 37–44 s, ortostatik soru uzadı (21 s), oturumun %80'i konuşma. | Bkz. 9. | Evet |
| 3 | Düşük→ | Süresi geçmiş sayım | **Karşılandı.** | — | Evet |
| 4 | Düşük→ | Oturuş cümlesinin kesilmesi | **Karşılandı** (3/3 tam okundu). | — | Evet |
| 5 | Düşük→ | "Dokunun" anları için titreşim | **Karşılandı.** "İki kısa" (ready) ara ve karar ekranında çalıyor ve tanıtımda var. | — | Evet (688 s, 846 s) |
| 6 | Orta→ | Uzun yönergenin kısa eylemle başlaması | **Karşılandı.** | — | Evet |
| 7 | Orta→ | Ses çıkışı değişince duraklatma | **Karşılanmadı (bilerek; tarayıcı API'si güvenilir değil).** Gerekçeyi kabul ediyorum; titreşimler artık bu açığı büyük ölçüde kapatıyor. | — | — |
| 8 | Düşük→ | Hazırlıkta "Titreşimleri tanı" bağlantısı | **Karşılanmadı.** Hazırlık ekranında işitme notu var, ama titreşim tanıtımına bağlantı yok. | Not satırına "Titreşimleri tanı" düğmesi. | Evet (kod araması) |
| — | — | **Yeni ya da kalan sorunlar** | | | |
| 9 | Orta | Seçenekli soru ekranları; kırmızı bayrak sesli okuma | Çok yavaşta alt tip, süre ve taraf ekranları 37–44 s; kan sulandırıcı sorusu seçenekleriyle 35 s, kulak 25 s, ortostatik 21 s. Telefon elimde olsa da bu kadar uzun bir cümlede sonunu kaçırıyorum. | Seçim ekranlarında yalnız soru okunsun, seçenekler ilk "Tekrar dinle"de okunsun (ya da yalnız kısa adlarıyla). Açıklayıcı cümleler ("Yataktan kalkarken … sayılmaz", "Uzun süredir … sayılmaz") ekranda kalsın. | Evet |
| 10 | Düşük | Duraklatma sesi | 185 harf, Çok yavaşta 28,7 s. Asıl yapılacak iş ("2 saniye basılı tutun") üçüncü cümlede. | Önce "Duraklatıldı. Devam için ekrana iki saniye basılı tutun." söylensin; boyun ağrısı ve "gelemiyorum" yolu ondan sonra gelsin. | Evet (1074 s) |

## 4. Sevdiklerim
- Kaymadan döndüğüm anda "1 uzun" titreşim ve hemen "Tamam": yanlış bir ipucuyla aşırı dönme korkum kalmadı.
- Titreşimlerin bir dili var: hareket et, doğru, bozuldu, adım bitti, bitti, işaretli, geçti, duraklatıldı, dur ve hazırsan dokun.
  Cihazım çıksa bile manevrayı bitirebiliyorum.
- Yönerge bitmeden sayaç başlamıyor; telefon alnımdayken seçenek listesi okunmuyor.

## 5. Memnuniyet: 9/10 (1. tur 6 → 2. tur 8 → 3. tur 9)
İşitme cihazlı biri olarak istediğim her kritik ve yüksek önemli değişiklik doğru yapıldı ve kendi denememde çalıştı. Kalan
sorun yalnız Çok yavaş hızda soru ekranlarının uzunluğu.

**Bu sürümü bir yakınıma önerir miyim: Evet.** İşitme cihazlı bir arkadaşıma, kurulumdaki "Titreşimleri tanı"yı bir kez
birlikte deneyerek öneririm.

---
Kanıtlar: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-3/k04-isitme-cihazli/`
(`r1-*`: kurulum ve ayarlar; `r2-*`: gerçek sensör yolu, tam atak; `b-*` ve `b2-*`: işitme cihazı çıktı, ritmi bilmeyen ve
bilen Kemal; `*-log.json` dosyaları `analiz.cjs` ile okunur). Not: gerçek titreşim hissi, Bluetooth yönlendirmesi ve gerçek
Türkçe TTS hızı cihazda denenmedi.
