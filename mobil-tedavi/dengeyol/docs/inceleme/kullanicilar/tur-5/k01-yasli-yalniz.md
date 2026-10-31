# k01 — Hatice (72, yalnız yaşıyor) · tur-5

## 1. Ben kimim, ne yapmaya çalıştım
72 yaşında emekli öğretmenim, yalnız yaşıyorum. Sağ arka kanal BPPV'm var; hekimim "2 hafta önce" tanı koydu ama reçete bağlantısı
vermedi. Pixel 7 kullanıyorum; yazı "Büyük", konuşma "Yavaş". Telefon verisini silip ilk kurulumdan başladım ve gerçek hızda (×1)
baştan sona kullandım: kurulum → 14 güvenlik sorusu → iki taraf testi → Epley → 1 saat sonra tekrar testi → rapor. Ardından duraklatma
sayfasında kör dokunuşu ve "gerçekten kötüyüm" yolunu bilerek denedim. (Kullanım sınırı yüzünden bir kez kesildim; kaldığım yerden sürdürdüm.)

## 2. Yaşadıklarım (günlük)
- **Kurulum:** Uygunluk ekranı artık kısa bir girişle okunuyor (20 s): "Size uyan varsa işaretleyin; hiçbiri uymuyorsa en alttakini…
  hepsini dinlemek için Tekrar dinle". Tanı zamanında "Hekiminiz '2 hafta önce' dediyse de bunu seçin" notu duruyor; 14 gün önceki
  tarihi girdim, sorun çıkmadı.
- **Güvenlik soruları, alt tip ve taraf:** 4. turdaki gibi kısa ve anlaşılır. Alt tip 24 s, süre 22 s, taraf 18 s; hazırlık ekranı
  kısaca okunuyor.
- **İki taraf testi ve Epley (×1):** Davranış 4. turla aynı ve iyi:
  - Pozisyona gelince "Tamam, böyle kalın" 1 s içinde söyleniyor ve eski ipucunu kesiyor.
  - "Zorlamayın" uyarısı ancak ~10 s ilerleme olmayınca geliyor.
  - Baş dönmesinin 15. saniyesinde sakin bir hatırlatma var; dokununca "Geçti olarak işaretlendi" anında söyleniyor.
  - En uzun sessizlik 8,6 s.
- **Sonrası:**
  - "Telefonu alnınızdan alın ve ekrana bakın." dendi. Telefonu indirip ekrana bir kez dokununca **"Şu an nasılsınız?" ve seçenekler
    sesli okundu.** Gözlüksüz de yanıtlayabildim. "Yavaş" seste 28 s sürdü; "Yeni belirti" seçeneğinin belirtileri de okunuyor,
    bence yerinde.
  - "Hafif" dedim; kısa ses geldi (13 s): "On dakika oturun; tutunarak kalkın…", ekranda 10 dakikalık sayaç var.
- **1 saat sonra:** Tekrar testinde baş dönmesi gelmedi, sabah testi önerildi. Rapor düz ve okunur; tanı tarihi ve doz özeti var.
- **Duraklatma (×1):**
  - **B1 — düğmeye kör basılı tutma:** "Şimdilik bırak"ın üstüne 2,3 s basılı tuttum; manevra devam etti.
  - **B2 — baş dönmesi işaretliyken kör dokunuş:** Parmağım "Pozisyona gelemiyorum"a denk geldi; yalnız **"geçti"** sayıldı. Basılı
    tutunca devam etti.
  - **B3 — onaylı düğmeye kör dokunuş:** "Kendimi kötü hissediyorum"a kör dokundum. Ses kısa: **"Eminseniz üstteki 'Evet'e dokunun."**
    (3,8 s). Aynı yere ikinci kör dokunuş hiçbir şey yapmadı.
  - Duraklatma sesi de kısalmış: "Duraklatıldı. Devam için ekrana iki saniye basılı tutun." (6,5 s).
  - **B4 — gerçekten kötüyken onay:** "Kendimi kötü hissediyorum"a bilerek dokundum, sesi dinledim, sonra **10 s daha** bekledim.
    "Evet" düğmesi hâlâ üstteydi, onaylayabildim. 4. turdaki sorunum çözülmüş.
  - **Ama:** Bu, taraf testinin oturuş adımındaydı. Onaydan sonra ses "Durduruldu. Yavaşça oturun ve dinlenin." dedi; ekranda yalnız
    **"Test yarıda bırakıldı. Hazır olduğunuzda ana ekrandan yeniden başlayabilirsiniz."** yazıyordu. Kötü hisseden, yalnız biri olarak
    şunları bilmek isterdim: dinleneyim mi, su içeyim mi, ne zaman hekime gideyim, hangi belirtide 112'yi arayayım. Manevrada bu
    bilgiler var; testte yok.
- **Ses yeterli mi?** Evet. Kesilen cümlelerin hepsi istenen kesmeler (pozisyona gelince ipucu, dokununca hatırlatma) ya da demo modunun
  tahmini süreleri ("Başlıyoruz…" ve tanıtma cümleleri). Bunlar gerçek sensörde konuşma bitişini bekliyor (kod); gerçek modda doğrulayamadım.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Orta | Taraf testi ve tekrar testinde "Kendimi kötü hissediyorum"; `ui/screens/patient/EpisodeFlow.tsx:641-642` (`onSideRunExit`), `:753-754` (`onRetestExit`) | Onaydan sonra yalnız "Test yarıda bırakıldı. Hazır olduğunuzda yeniden başlayabilirsiniz." deniyor. Manevradaki "Dinlenin… su için… hekiminize başvurun; acil belirtilerde 112" yönlendirmesi (`EpisodeFlow.tsx:738`) yok. Kötü durum kayda da düşmüyor olabilir. | Testlerde de `USER_FEELS_UNWELL` aynı "Dinlenin" ekranına ve sesine gitsin; raporda "kendini iyi hissetmedi" yazsın. | Evet (taraf testinde ×1); tekrar testi için kod |
| 2 | Düşük | "Şu an nasılsınız?" sesli okunuşu | "Yavaş" seste 28 s. Kabul edilebilir, ama sondaki belirti listesi uzun. | Belirti listesi kalsın; seçenek adları "Birinci/İkinci" olmadan tek cümle akabilir. | Evet |
| 3 | Düşük | Gerçek sensör | Demo modunda "Başlıyoruz. Yönergeleri dinleyin." ve tanıtma cümleleri hâlâ kesiliyor. Kod gerçek sensörde bitişi bekliyor, ama ben göremedim. | Pilot öncesi gerçek bir Android'de, gerçek sensör ve "Yavaş" sesle bir tam tur kaydı. | Hayır (demo ortamı) |

**4. kullanımdaki isteklerim**
| Tur-4 # | İsteğim | Durum | Not |
|---|---|---|---|
| 1 | "Kendimi kötü hissediyorum" onayı: süre cümle bittikten sonra başlasın, ≥15 s sürsün; cümle kısalsın | Karşılandı | Cümle 3,8 s. Ses bitince 10 s bekledikten sonra "Evet" hâlâ açıktı ve onayladım. Kör ikinci dokunuş koruması duruyor. |
| 2 | "Şu an nasılsınız?" telefon alından inince / ilk dokunuşta okunsun | Karşılandı | Ekrana ilk dokunuşta soru ve seçenekler okundu; kod, telefon kalkınca ve 3,5 s sonra da okuyor. |
| 3 | Uygunluk listesi kısa girişle okunsun | Karşılandı | 20 s'lik giriş okunuyor; tam liste "Tekrar dinle"de. |
| 4 | Duraklatma sesi kısalsın (Düşük) | Karşılandı | "Duraklatıldı. Devam için ekrana iki saniye basılı tutun." (6,5 s). |
| (önceki turlar) | Kör basılı tutma, baş dönmesinde kör dokunuş, "Tamam"/"Geçti" zamanlaması, hatırlatmalar, "2 hafta önce" | Korunmuş | B1–B3 ve ×1 kayıtta yeniden doğrulandı. |

## 4. Sevdiklerim
- Duraklatma sayfası artık kör kullanıma tam dayanıklı: basılı tutmak devam ettiriyor, baş dönmesinde ilk dokunuş "geçti" sayılıyor,
  kalıcı seçimler kısa ve rahat bir onay istiyor.
- Ses doğru anda ve kısa konuşuyor: "Tamam" hemen geliyor, "Geçti" hemen geliyor; soru, telefonu indirip dokununca okunuyor.
- Ekranı göremesem de yanımda biri varmış gibi: 10 saniyede bir kalan süre, dinlenme sayacı, "tutunarak kalkın".

## 5. Memnuniyet
**9,5/10.** Beş turda bütün isteklerim yerine geldi. Tek başıma, gece, gözüm kapalı manevrayı bitirebiliyorum; yanlış dokunuş beni artık
ne kilitliyor ne de korkutuyor. Yarım puanı kırmamın nedeni: testte "Kendimi kötü hissediyorum" dediğimde ne yapacağım söylenmiyor.

**Bu sürümü bir yakınıma önerir miyim: Evet**, şu koşulla: ilk kullanımdan önce baş dönmesi yokken bir kez "Deneme manevrası" yapsın
ve sesin dediklerine alışsın. Testte kötü hissederse (#1 düzelene dek) oturup dinlensin; acil belirti olursa 112'yi arasın.

Betikler, ses dökümleri (`p2-ses.txt` gerçek hız ve yavaş ses, `p4pause-ses.txt`) ve ekran görüntüleri:
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-5/k01-yasli-yalniz/`
