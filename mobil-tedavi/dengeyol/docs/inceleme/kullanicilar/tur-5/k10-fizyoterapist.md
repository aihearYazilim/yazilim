# Tur 5 — k10 Fizyoterapist (Burak, 39, vestibüler rehabilitasyon)

## 1. Ben kimim, ne yapmaya çalıştım
Hekimden yönlendirmeli BPPV hastalarına klinikte manevra yapan, evde Epley/Semont veren fizyoterapistim. 4. turdaki
isteklerimi (`tur-4/00-SENTEZ.md`) kontrol ettim, aynı sınır denemelerini tekrarladım ve yeni bir deneme ekledim: Epley'in
yüz-yere adımında hasta yanlış yana yuvarlanıp yüzüstünden geçerek hedef açıya geliyor. Tam döngüyü (reçete → evde ×1
Semont → ev raporu QR → klinisyen içe aktarımı) yeniden başlattım. Sunucu `http://localhost:4182/`, iPhone 13 öykünümü.

## 2. Yaşadıklarım (kısa günlük)
- **Klinik sınırlar (kısa ses):** Önceki turlarla aynı ve tutarlı. 30° → "Hastanın sağına.", 10° → "Daha sarkık."; tutarken
  13°'te kalınıyor, 10°'de "Pozisyon bozuldu. Daha sarkık."
- **Tekrar seyrekleşmesi:** θ −95°'te ~40 s (sanal) beklettim. "Gövdeyi soluna." ilk üç kez 5 s arayla, sonra 10 s
  arayla söylendi. İstediğim buydu.
- **Yanlış taraf / yüzüstünden gelme:** Hasta sağ yana (+100°) dönünce ses "Dur! Yanlış taraf.", ardından "Sırtüstünden
  hastanın soluna." dedi. Afişte "DUR — yanlış taraf. Önce sırtüstüne…" yazdı. Yüzüstünden geçerek −135°'e geldim:
  "Yüzüstünden geldi; geçersiz." dendi ve pozisyon kabul edilmedi. Sırtüstüne dönüp doğru yoldan gelince "Şimdi hastanın
  soluna." → "Pozisyon doğru.". Rapor tablosunda ve HBYS notunda "4. adımda önce yanlış taraf" yazıyor.
  Klinik açıdan doğru ve güvenli.
- **Semont (klinik):** "Geçiş 7 saniye, yavaş.", "Oturuştan geçilmedi."; doğru-hızlı Semont'ta yanlış alarm yok.
- **Hasta Semont (×1):** Komuttan önce hareket edince tek cümle geldi: "Zaten yattınız; sayımı bırakıyoruz. Geçiş 4
  saniye sürdü; … 'şimdi'yi bekleyip tek hamlede geçin. Böyle kalın, kıpırdamayın."
- **Ev raporu başlıkları:** Başlık artık `resolveProtocol(protocolId, side)` ile taraf doldurularak üretiliyor
  (`core/reportShare.ts:146`). Bu çalıştırmada içe aktarma ekranına varmadan rapor süresi doldu (aşağıda);
  4. turdaki "{Hya}/{A}/{H}" hatası kodda giderilmiş.
- **Bitiş ekranı:** Metne "Uyku pozisyonu kısıtlaması ya da boyunluk gerekmez." eklenmiş (`EpisodeFlow.tsx:1298`, AAO-HNS 2017).

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | — | 4. kullanımdaki isteğim #1 (ev raporu adım başlıklarında taraf) | **Karşılandı (kodda).** Başlıklar taraf doldurularak üretiliyor. | — | Kod incelemesi; bu turdaki uçtan uca çalıştırma rapor yazılırken bitmemişti |
| 2 | — | İsteğim #2 ("uyku pozisyonu kısıtlaması ya da boyunluk gerekmez") | **Karşılandı.** Bitiş metninde var. | — | Kod incelemesi |
| 3 | — | İsteğim #3 (kısa seste aynı ipucunun 3. tekrardan sonra seyrekleşmesi) | **Karşılandı.** İlk üçü 5 s arayla, sonrası 10 s arayla. | — | Evet (ses kaydı) |
| 4 | — | Yüzüstünden geçilerek gelinen hedefin işlenmesi | **Karşılandı.** Sesle "geçersiz" deniyor, pozisyon kabul edilmiyor, kayıtta "önce yanlış taraf" yazıyor. Hasta durdurmasında tam metin "yüzüstünden geçilerek gelindi, kabul edilmedi". | İsteğe bağlı: klinisyen tablosunda da "yüzüstünden gelme reddedildi" yazsın. | Evet |
| N1 | Düşük | Yanlış taraf ipucu (kısa ses) | "Sırtüstünden hastanın soluna." 9 kez art arda (5 s'de bir) söylendi; yön ipuçlarındaki seyrekleşme burada uygulanmıyor. | Aynı seyrekleşme kuralı (3. tekrardan sonra 10 s) yanlış taraf ipucuna da uygulansın; "Dur!" ilk anda kalsın. | Evet (×5 ses kaydı) |

## 4. Sevdiklerim
- Elim hastanın başındayken kısa ses ("Hastanın sağına.", "Daha sarkık.", "Gövdeyi soluna.", "Dur! Yanlış taraf.") ile
  ekrana bakmadan Epley ve Semont yaptırabiliyorum.
- Evde Semont'un hataları (yavaş geçiş, yuvarlanma, komuttan önce hareket) ve Epley'de yanlış taraf ya da yüzüstünden gelme
  sesle düzeltiliyor, raporda görünüyor. Hedefler hiçbir yerde gevşetilmemiş.
- Reçete → ev raporu QR → kontrol muayenesi döngüsü ağsız çalışıyor; HBYS notu kısa ve işaretleri taşıyor.

## 5. Memnuniyet
**9,5/10** (7 → 8 → 9 → 9 → 9,5). Bütün klinik isteklerim karşılandı; geriye yalnız bir ses tekrarı ayrıntısı kaldı.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Evet (koşullu).** Klinikte Epley/Semont yönlendirmesi
ve ölçümü için, evde de hekim tanısı ve QR reçetesiyle kullanırım. **Koşul:** Açıların gerçek telefonlarda, alında ve
birkaç modelde, küçük bir pilotla bir kez doğrulanması. Ben yalnız demo sensörle ölçtüm; bu doğrulama yazılımın dışında.

Betikler ve kayıtlar: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-5/k10-fizyoterapist/`
