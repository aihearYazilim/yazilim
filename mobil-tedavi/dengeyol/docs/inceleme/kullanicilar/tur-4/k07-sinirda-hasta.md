# Tur 4 (son) — k07 sınırda hasta (Ahmet, 68)

## 1. Ben kimim, ne yapmaya çalıştım
Ahmet'im: boyun fıtığı (başımı geriye atmakta zorlanırım), bel ağrısı, AF için apiksaban, tansiyon ilacı, 2 yıllık kalça protezi;
sol arka kanal BPPV hekim tanılı. Pixel 7, Büyük yazı, sunucu `localhost:4181`. 3. kullanımdaki isteklerimi denedim. Kurulum kapısını
yeniden geçtim. Boyun kısıtlı sensör denemesini taraf testinde ve Epley'de, dışarıdan ve sınırdan başlayarak 10 kez daha yaptım.

## 2. Yaşadıklarım
- **Kurulum kapısı:** Önceki turla aynı ve doğru. Boyun (tek başına, kan sulandırıcıyla ya da belle) işaretlenince adıyla ve hekime
  sorularla kapanıyor. Yalnız kan sulandırıcıda ve yalnız kalça protezinde açık kalıyor. Konsol hatası yok.
- **Taraf testinde boynum yetmedi (φ≈8°):** "biraz daha geriye" ×2 → "Daha fazla zorlamayın…" → "Zorlamayın; rahat olduğunuz yerde kalın" geldi, sonra durdu.
  Bitiş ekranı ve ses artık nerede durduğumu söylüyor: *"Durulan yer: Sağ taraf testi, 'Sırtüstü, baş sağa 45° ve sarkık' adımı:
  baş en çok ~8° geriye sarkabildi (hedef 15–40°); 72 s içinde gelinemedi."* Raporda ayrı bir "Durulan yer" satırı var.
  "Manevra: yapılmadı (planlanan: Epley)" yazıyor; artık yanıltmıyor. Hekimime göstereceğim şey tam bu.
- **Epley'de boynum yetmedi:** Bitiş ekranı ve rapor "Epley sol manevrası, 2. adım … baş en çok ~8° geriye sarkabildi (hedef 15–40°); 71 s
  içinde gelinemedi" diyor. Adım satırında da "POZİSYONA GELİNEMEDİ (baş en çok ~8°…)" yazıyor.
- **"Biraz daha geriye" sınırı:** Başımı 8°'den 14°'ye, ya da 3°'ten 11°'ye getirerek ilerleme yaptığım denemelerde en çok 3 kez "biraz daha" dendi, sonra
  "zorlamayın" geldi; ~60 sn'de durdu. 55. sn'de sınıra (15°) zorlayınca 65. sn'de "Tamam" geldi. 2. turdaki uzayan döngü hiç yok.
- **"ör." → "örneğin":** Ekranda ve seste "örneğin" yazıyor/okunuyor.
- **Zorlayarak tam Epley:** Tamamlandı. Raporda sarkık adımlar "hedefte %59/%56 · sarkma ort. 15°" diye görünüyor.
- **Yeni gördüğüm bir pürüz:** İlk denemede betiğim, telefonu "hedefe git" ile bir anlığına doğru açıya getirip hemen 8°'ye indirdi.
  Bu, hızla yatarken başın bir an aşağı savrulmasına benziyor. Rapor bu anlık değeri aldı ve *"baş ~16° geriye sarktı (hedef
  15–40°); 73 s içinde gelinemedi"* yazdı. 16° hedefin içinde; aynı cümlede "gelinemedi" deyince hekim kafası karışır.
  Başı hiç hedefe uğramadan 8°'de tutan temiz denemede doğru değer (~8°) yazıldı. "En iyi açı" tek bir ölçümden alınıyor gibi.
- **Sesli metinde** "72 s içinde" geçiyor; Türkçe ses bunu "yetmiş iki s" diye okuyabilir.

### Durum tablosu (kurulum kapısı, tur 4)
| Senaryo | Sonuç | Değerlendirme |
|---|---|---|
| Yalnız boyun | Kapandı; adıyla, 3 soru (kurulum + ana ekran) | Doğru |
| Yalnız kan sulandırıcı | Açık; atakta kanama/baş çarpması sorusu | Doğru |
| İkisi birden | Kapandı | Doğru |
| Yalnız kalça protezi | Açık | Doğru |
| Boyun + bel | Kapandı; iki ad | Doğru |

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| — | — | 3. kullanım #1 (durulan yer ve açı) | Taraf testinde ve manevrada bitiş ekranı, ses ve rapor test/adım, ulaşılan açı ve hedefi yazıyor | **Karşılandı** (anlık değer için #1'e bakın) | Evet (`strict-clean.out`, `mstop-clean.out`) |
| — | — | 3. kullanım #2 ("biraz daha" en çok 3) | İlerlemede de en çok 3, sonra "zorlamayın" | **Karşılandı** | Evet (`edge2-*.out`) |
| — | — | 3. kullanım #3 ("ör." → "örneğin") | Ekranda ve seste "örneğin" | **Karşılandı** | Ses kaydı |
| — | — | 3. kullanım #4 (ortostatik, bilinen/değişmeyen) | Bilerek yapılmadı; sentezde gerekçeli (sorular güvenli yönde kalır) | **Karşılanmadı (bilerek)**; gerekçeyi kabul ediyorum | `tur-3/00-SENTEZ.md` |
| 1 | Orta | "Gelinemedi" en iyi açı kaydı (`StepRecord.reach`, `reportText.ts:96`) | Hedefe bir an değen tek ölçüm "en iyi açı" sayılıyor. Rapor "baş ~16° sarktı (hedef 15–40°); … gelinemedi" diyor: kendi içinde çelişkili. | En iyi açı 1–2 sn süren ortalamadan alınsın. Değer hedef aralığına düşüyorsa "hedefe yalnız bir an değdi, tutulamadı" yazılsın. | Evet (`strict.out`, `mstop.out` ve temiz tekrarı) |
| 2 | Düşük | Durdurma sesi | "72 s içinde" kısaltması sesle okunuyor. | Seste "72 saniye", ya da sade "bir dakikadan uzun süre". | Ses kaydında |
| 3 | Düşük (klinik karar) | Kırmızı bayrak `orthostatic` | Tansiyon ilacıyla bilinen hafif kararma her atakta durdurur (bilerek). | Kural kalsın. Kurulumdaki "engel değildir" notu tansiyon ilacı kullananlara "ayağa kalkınca göz kararması olursa uygulama durdurur; hekiminize önceden sorun" desin. | Önceki tur |

## 4. Sevdiklerim
- "Daha fazla zorlamayın" → "rahat olduğunuz yerde kalın" → ~60 sn'de durdurma ve hekime yönlendirme. Dört turda en çok güvendiğim yer oldu.
- Bitiş ekranı ve rapordaki "Durulan yer: … baş en çok ~8° (hedef 15–40°)": hekimim değiştirilmiş manevraya buna bakarak karar verebilir.
- Kapı ekranında ve ana ekranda engelin adı, hekime sorulacak sorular; reçete kartının bunları önceden söylemesi.

## 5. Memnuniyet
**9/10** (turlar: 5 → 8 → 9 → 9). Boyun kısıtlı biri olarak beni doğru yerde durduruyor, zorlamıyor ve hekime götüreceğim bilgiyi
veriyor. 10 vermememin nedeni rapordaki anlık açının bazen hedefin içinde görünüp kendisiyle çelişmesi.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Evet (koşullu değil, kullanım koşuluyla).**
Koşul:
- Yakınımın hekim tanısı olmalı ve kurulumdaki boyun/omurga sorusunu dürüst yanıtlamalı. Boyun sorunu varsa uygulama zaten kapanır ve ne soracağını söyler.
- Tansiyon ilacı kullanıyorsa ayağa kalkınca göz kararmasında uygulamanın durduracağını bilmeli.
- Klinikte boyun kısıtı sınırda olan hastaya "zorlamaz, gelemezsen durdurur, raporda kaç derecede kaldığını görürüm" diyerek kullanırım.
  Rapordaki açı hedef aralığında görünürse ve "gelinemedi" yazıyorsa, bunu "bir an değdi" diye okurum (#1 düzelene dek).

Kanıtlar: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-4/k07-sinirda-hasta/`
(`onboard.json`, `strict.out`, `strict-clean.out`, `mstop.out`, `mstop-clean.out`, `edge2-*.out`, `force.out`, ekran görüntüleri).
