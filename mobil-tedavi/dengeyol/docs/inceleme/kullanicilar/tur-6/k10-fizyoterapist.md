# Tur 6 — k10 Fizyoterapist (Burak, 39, vestibüler rehabilitasyon)

## 1. Ben kimim, ne yapmaya çalıştım
Hekimden yönlendirmeli BPPV hastalarına klinikte manevra yapan, evde Epley/Semont veren fizyoterapistim. 5. turdaki
isteklerimi (`tur-5/00-SENTEZ.md`) kontrol ettim. Aynı sınır denemelerini yaptım: 30°/58° dönüş, 10/13/15° sarkma, yavaş,
yuvarlanarak ve doğru-hızlı Semont, gövdesini döndürmeyen hasta, yanlış yana yuvarlanıp yüzüstünden gelen hasta. Tam
döngüyü bu kez sonuna kadar ekranda gördüm: reçete → evde gerçek hızda (×1) Semont → bitiş ekranı → ev raporu QR →
klinisyen içe aktarımı → HBYS. Sunucu `http://localhost:4183/`, iPhone 13 öykünümü.

## 2. Yaşadıklarım (kısa günlük)
- **Klinik sınırlar:** Önceki turlarla aynı. 30° → "Hastanın sağına.", 10° → "Daha sarkık.", 15°'de giriş, 13°'te tutma.
- **Yanlış taraf ipucu (kısa ses):** "Dur! Yanlış taraf." hemen geliyor. "Sırtüstünden hastanın soluna." ilk üç kez 5 s
  arayla, sonra 10 s arayla (1 s'lik gerçek aralık ×5 hızda 5 s'ye karşılık geliyor). "Gövdeyi soluna." da aynı biçimde
  seyrekleşiyor. Yüzüstünden −135°'e gelince "Yüzüstünden geldi; geçersiz.", sırtüstünden doğru gelince "Pozisyon doğru.".
- **Gösterge:** Düzeltme sırasında da (afiş + sayı kartı varken) baş göstergesi, sayaç ve sarkma çubuğu ekranda; "DUR —
  yanlış taraf" afişi kırmızı. Ekrana baktığımda her şeyi bir bakışta görüyorum.
- **Klinik rapor:** Epley 4. adımda "yüzüstünden gelme reddedildi", 2. adımda "hedef sınırında"; Semont'ta "yavaş geçiş",
  "oturuştan geçilmedi", "erken bitirildi". HBYS notu da aynı ifadeleri kullanıyor.
- **Hasta Semont (×1):** Komuttan önce harekette tek cümle; "Şimdi!" denmiyor; raporda "yavaş geçiş 4.1 s · komuttan
  önce hareket".
- **Bitiş ekranı (ekranda gördüm):** "…tekrar testini yapın. **Uyku pozisyonu kısıtlaması ya da boyunluk gerekmez.**"
  Gece saatine düşen testte "uyuyacaksanız alarm kurmanız gerekmez, uyanınca yapın" deniyor; makul.
- **Ev raporu içe aktarma (ekranda gördüm):** Adım başlıkları doğru: "Oturuş, baş sola 45°", "Sağ yan, burun yukarı",
  "Sol yan, burun yere (tek hızlı hareket)"; hiçbir yerde "{" yok. Başlıkta "Son atak — atak açık: manevra sonrası tekrar
  testi yapılmadı" yazıyor; kontrol muayenesinde ilk soracağım şey tam bu. Reçete kodu eşleşti, muayene önceden seçili geldi.
  HBYS notuna tek satır eklendi. e2e'de `{` denetimi var (`app/e2e/run-e2e.mjs:730`).

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | — | 5. kullanımdaki isteğim #2 (yanlış taraf ipucunda seyrekleşme) | **Karşılandı.** İlk "Dur!" hemen geliyor; ipucu 3 tekrardan sonra seyrekleşiyor. | — | Evet (ses kaydı) |
| 2 | — | İsteğim #3a ("yüzüstünden gelme reddedildi") | **Karşılandı.** Klinisyen tablosunda ve HBYS notunda bu ifade var. | — | Evet |
| 3 | — | İsteğim #3b (e2e'de "{" denetimi) | **Karşılandı.** Kendi döngümde de başlıklarda "{" yok. | — | Evet (ekran + e2e kodu) |
| 4 | — | 4. turdan: ev raporu başlıkları, bitiş cümlesi (bu kez ekranda) | **Karşılandı.** İkisini de ekranda gördüm. | — | Evet (ekran) |
| 5 | — | İsteğim #1 (gerçek telefonda açı doğrulaması / pilot) | **Karşılanmadı** (yazılım dışı; sentezde ortak koşul olarak duruyor). | Birkaç iPhone/Android modelinde, alında, gonyometre ya da IMU referansıyla küçük bir doğrulama. | — |

Yeni Kritik, Yüksek ya da Orta sorun bulmadım.

## 4. Sevdiklerim
- Kısa ses + görünür gösterge: elim hastanın başındayken sesle, gözüm boştayken ekranla aynı bilgiyi alıyorum.
- Ev hataları (yavaş/yuvarlanma/komuttan önce Semont, gövde dönmemesi, yanlış taraf ve yüzüstünden gelme, yastık) sesle
  düzeltiliyor ve kontrol muayenesinde önüme açık etiketlerle geliyor. Hiçbir hedef gevşetilmemiş.
- Reçete → ev raporu QR → muayene → HBYS döngüsü ağsız ve tutarlı. "Tekrar testi yapılmadı" bilgisi doğrudan
  karar verdiren bir satır.

## 5. Memnuniyet
**10/10** (7 → 8 → 9 → 9 → 9,5 → 10). Yazılımın içinde istediğim her şey karşılandı. Kalan tek koşul yazılımın dışında.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Evet (koşullu).** Klinikte Epley/Semont yönlendirmesi
ve ölçümü için, evde de hekim tanısı ve QR reçetesiyle kullanırım. **Koşul:** Rutin kullanıma geçmeden önce açıların
gerçek telefonlarda, alında ve birkaç modelde küçük bir pilotla doğrulanması. Ben bütün turlarda demo sensörle ölçtüm.

Betikler, ekran görüntüleri ve ses kayıtları: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-6/k10-fizyoterapist/`
