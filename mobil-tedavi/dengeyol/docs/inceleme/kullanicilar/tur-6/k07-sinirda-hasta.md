# Tur 6 — k07 sınırda hasta (Ahmet, 68)

## 1. Ben kimim, ne yapmaya çalıştım
Ahmet'im: boyun fıtığı (başımı geriye atmakta zorlanırım), bel ağrısı, AF için apiksaban, tansiyon ilacı, 2 yıllık kalça protezi;
sol arka kanal BPPV hekim tanılı. Pixel 7, Büyük yazı, sunucu `localhost:4183`. 5. kullanımdaki iki isteğimi denedim: kısa duraklatma
sesinde boyun cümlesi ve savrulmada en iyi açı. 5. turdaki 14°/10° savrulma denemesini taraf testinde ve Epley'de tekrarladım.
Kurulum kapısını, duraklatmayı, "biraz daha geriye" sınırını, durağan kalıp sonra düşen başı ve zorlayarak tam Epley'yi yeniden yaptım.

## 2. Yaşadıklarım
- **Kurulum:** Beş senaryo yine doğru: boyun işaretlenince adıyla ve sorularla kapanıyor; kan sulandırıcı ve kalça protezi tek başına açık. Konsol hatası yok.
- **Duraklatma:** Ses artık "Duraklatıldı. Devam için ekrana iki saniye basılı tutun. **Boynunuz ağrıyorsa yavaşça oturun.**" diyor.
  Kısa ama aradığım cümle içinde. "Pozisyona gelemiyorum"u onaylayınca durulan yer ve açıyla durdurdu.
- **Savrulma denemesi (baş bir an hedefe değip 8°'de kaldı):**
  - Taraf testinde "baş en çok ~8° … hedefe yalnız bir an değdi, tutulamadı".
  - Epley'de de "~8° … hedefe yalnız bir an değdi, tutulamadı".
  - 5. turdaki 14° ve 10° fazla tahmin bitti; gerçekte tutabildiğim açı yazılıyor ve "bir an değdi" bilgisi de duruyor.
- **Temiz deneme (hiç hedefe uğramadan 8°):** "~8° (hedef 15–40°); 73 s içinde gelinemedi". Ses "73 saniye" diyor.
- **Başım bir süre durağan kalıp sonra düşünce:** 12°'de 10 sn kalıp 8°'e inince "~12°", 13°'te 15 sn kalıp inince "~13°" yazıldı.
  8°'den 14°'ye çıkıp orada kalınca "~14°" yazıldı. Durağan anlar doğru alınıyor.
- **"Biraz daha geriye":** En çok 3 kez söylendi, sonra "zorlamayın" ve "rahat olduğunuz yerde kalın" geldi, ~60 sn'de durdu.
  55. sn'de sınıra (15°) zorlayınca 62. sn'de "Tamam" geldi.
- **Zorlayarak tam Epley:** Testler sınırda tutuldu. Epley 2. adımda sınıra ancak 50. sn'de gelebildim ve orada titredim; 60 sn
  kuralıyla durduruldu. Benim için doğru karar: zaten zorluyordum. Rapor yalnız "hedefe yalnız bir an değdi, tutulamadı" diyor, açı
  yazmıyor. Kodda bu bilerek böyle: açı hedef aralığındaysa çelişki olmasın diye sayı atlanıyor. Yine de hekimim "başı alt sınıra
  (~15°) kadar geldi ama orada tutulamadı" bilgisini görse, değiştirilmiş manevraya daha kolay karar verir.

### Durum tablosu (kurulum kapısı, tur 6)
| Senaryo | Sonuç | Değerlendirme |
|---|---|---|
| Yalnız boyun | Kapandı; adıyla, 3 soru | Doğru |
| Yalnız kan sulandırıcı | Açık; not kanama ve tansiyon ilacı durdurmasını önceden söylüyor | Doğru |
| İkisi birden | Kapandı | Doğru |
| Yalnız kalça protezi | Açık | Doğru |
| Boyun + bel | Kapandı; iki ad | Doğru |

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| — | — | 5. kullanım #1 (kısa duraklatma sesinde boyun cümlesi) | "Boynunuz ağrıyorsa yavaşça oturun." kısa seste | **Karşılandı** | Evet (`pause.out`) |
| — | — | 5. kullanım #2 (en iyi açı durağan anlardan) | Savrulmada ~8° (önce 14°/10°); durağan 12/13/14° doğru | **Karşılandı** | Evet (`strict.out`, `mstop.out`, `edge2b-*.out`) |
| — | — | 5. kullanım #3 (ortostatik) | Klinik ekip kararı; değişiklik istemedim | **Karşılandı** (istek yoktu) | — |
| 1 | Düşük | Rapor, sınırda kalınıp gelinemeyen adım (`core/runner.ts` `reachSummary`) | Baş alt sınıra (~15°) gelip orada titreyince rapor yalnız "hedefe yalnız bir an değdi, tutulamadı" diyor; açı yok. | Açı aralıktaysa "baş hedefin alt sınırına (~15°) kadar geldi, orada tutulamadı" yazılsın; çelişki de olmaz. | Evet (`force.out`) |
| 2 | Düşük | Sesli metin | Durdurma cümlesi uzun: "Hekiminize başvurun… Durulan yer: Sağ taraf testi, '…' adımı: …" Yatarken baştan sona dinlemek yorucu. | Seste önce "Durduk. Yavaşça oturun. Hekiminize başvurun." denilsin; durulan yer ve açı ekranda ve "Tekrar dinle"de kalsın. | Ses kaydı |

## 4. Sevdiklerim
- "Biraz daha geriye" ×2–3 → "Daha fazla zorlamayın" → "rahat olduğunuz yerde kalın" → ~60 sn'de durdurma ve hekime yönlendirme. Altı turdur tutarlı; bozulmasın.
- Bitiş ekranı ve raporda "Durulan yer … baş en çok ~8° (hedef 15–40°)". Değer artık gerçekte tutabildiğim açı.
- Duraklatınca "Boynunuz ağrıyorsa yavaşça oturun" ve kurulumda engelin adıyla, hekime sorularla söylenmesi.

## 5. Memnuniyet
**9,5/10** (turlar: 5 → 8 → 9 → 9 → 9 → 9,5). İsteklerimin hepsi karşılandı. Boyun kısıtlı biri olarak beni zorlamıyor, doğru yerde
durduruyor ve hekime götüreceğim bilgiyi doğru veriyor. Kalan iki madde rapor ve ses inceliği.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Evet, şu koşullarla.**
- Yakınımın hekim tanısı olmalı ve kurulumdaki boyun/omurga sorusunu dürüst yanıtlamalı. Boyun sorunu varsa uygulama kapanır ve ne soracağını söyler.
- Tansiyon ilacı kullanıyorsa, göz kararmasında durduracağını bilmeli; kurulum bunu zaten söylüyor.
- Klinikte boyun kısıtı sınırda olan hastada kullanırım: zorlamaz, gelemezse 1 dakikada durdurur, raporda başının kaç derecede kaldığını görürüm.
- Sensörlü kullanımın gerçek telefonda (pilot) bir kez doğrulanmasını beklerim; benim denemelerim sanal sensörle.

Kanıtlar: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-6/k07-sinirda-hasta/`
(`onboard.json`, `strict.out`, `strict-clean.out`, `mstop.out`, `pause.out`, `edge2-*.out`, `edge2b-*.out`, `force.out`, ekran görüntüleri).
