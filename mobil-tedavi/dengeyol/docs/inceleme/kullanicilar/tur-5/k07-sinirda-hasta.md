# Tur 5 — k07 sınırda hasta (Ahmet, 68)

## 1. Ben kimim, ne yapmaya çalıştım
Ahmet'im: boyun fıtığı (başımı geriye atmakta zorlanırım), bel ağrısı, AF için apiksaban, tansiyon ilacı, 2 yıllık kalça protezi;
sol arka kanal BPPV hekim tanılı. Pixel 7, Büyük yazı, sunucu `localhost:4182`. 4. kullanımdaki isteklerimi denedim. 4. turdaki
"anlık 16° savrulma" denemesini taraf testinde ve Epley'de tekrarladım. Kurulum kapısını, boyun kısıtlı sensör denemesini (dışarıdan,
sınırdan, geç zorlayarak), duraklatmayı ve zorlayarak tam Epley'yi yeniden yaptım.

## 2. Yaşadıklarım
- **Kurulum:** Beş senaryo önceki gibi doğru davrandı. Uygunluk notu artık tansiyon ilacı kullananlara da sesleniyor: "Tansiyon ilacı
  kullanıyorsanız: her atakta ayağa kalkınca göz kararması da sorulur; varsa uygulama manevrayı durdurur ve hekime yönlendirir.
  Bunu hekiminize önceden sorun." Tam istediğim cümle; atak gelmeden önce öğrenmiş oluyorum.
- **Savrulma denemesi (baş bir an hedefe değip 8°'de kaldı):**
  - Taraf testinde: "baş en çok ~14° geriye sarkabildi (hedef 15–40°), hedefe yalnız bir an değdi, tutulamadı".
  - Epley'de: "~10°, hedefe yalnız bir an değdi, tutulamadı".
  - 4. turdaki "~16° sarktı … gelinemedi" çelişkisi bitti. Hekim artık başımın hedefe yalnız bir an değdiğini anlıyor.
  - Değer gerçekte tutabildiğim 8°'den 2–6° yüksek çıkıyor. Ortanca penceresi savrulmanın sönen kuyruğunu da içine alıyor; küçük bir fark.
- **Temiz deneme (hiç hedefe uğramadan 8°):** Taraf testinde ve Epley'de "baş en çok ~8° geriye sarkabildi (hedef 15–40°)". Doğru.
- **Ses:** Durdurma cümlesi "…; 72 saniye içinde gelinemedi" diye okunuyor (ekranda "72 s"). "örneğin" de doğru okunuyor.
- **"Biraz daha geriye":** 8°→14° denemesinde 2 kez söylendi, sonra "Daha fazla zorlamayın" ve "rahat olduğunuz yerde kalın" geldi;
  ~60 sn'de durdu. 57. sn'de sınıra zorlayınca 60. sn'de "Tamam" geldi.
- **Zorlayarak tam Epley:** Tamamlandı. Raporda sarkık adımlar "hedefte %63 / %51 · sarkma ort. 15°" görünüyor.
- **Duraklatma (yeni gördüğüm geri adım):** Duraklat'ı basılı tuttum. Ses yalnız "Duraklatıldı. Devam için ekrana iki saniye basılı tutun."
  dedi. 2. turda istediğim ve 3. turda gelen "Boynunuz ağrıyorsa yavaşça oturabilirsiniz" ile "Pozisyona gelemiyorum" yolu artık
  varsayılan seste yok; yalnız ekrandaki "Tekrar dinle (ayrıntılı)" düğmesinde var. Telefon alnımdayken o düğmeyi göremem.
  Boynu ağrıyan biri olarak duraklattığımda en çok duymak istediğim cümle "oturabilirsiniz". Sentezde gerekçesi yazıyor:
  başka bir kullanıcı (k04) yatarken uzun sesten yakınmış. Anlıyorum, ama bu tek cümle kısa sese de sığar.
  "Pozisyona gelemiyorum" artık ikinci onay istiyor ("Evet, pozisyona gelemiyorum — eminim" üstte çıkıyor; ses "Eminseniz üstteki 'Evet'e
  dokunun" diyor). Onaylayınca durulan yer ve açıyla doğru durdurma geldi. Kazara dokunmaya karşı mantıklı; telefonu zaten elime
  almışken iki dokunuş sorun değil.

### Durum tablosu (kurulum kapısı, tur 5)
| Senaryo | Sonuç | Değerlendirme |
|---|---|---|
| Yalnız boyun | Kapandı; adıyla, 3 soru (kurulum + ana ekran) | Doğru |
| Yalnız kan sulandırıcı | Açık; not kanama sorusunu ve tansiyon ilacı durdurmasını önceden söylüyor | Doğru |
| İkisi birden | Kapandı | Doğru |
| Yalnız kalça protezi | Açık | Doğru |
| Boyun + bel | Kapandı; iki ad | Doğru |

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| — | — | 4. kullanım #1 (en iyi açı ortancadan; "bir an değdi") | Savrulmada "en çok ~14° / ~10°, hedefe yalnız bir an değdi, tutulamadı"; temizde ~8°. Çelişki bitti. | **Karşılandı** (küçük fazla tahmin için #2'ye bakın) | Evet (`strict.out`, `mstop.out`, `*-clean.out`) |
| — | — | 4. kullanım #2 (seste "saniye") | "72 saniye içinde gelinemedi" | **Karşılandı** | Ses kaydı |
| — | — | 4. kullanım #3 (tansiyon ilacı notu) | Uygunluk notunda var, önceden söylüyor | **Karşılandı** | Evet (`onboard.json`) |
| 1 | Orta | Duraklatma sesi (`core/runner.ts:751–758`, `pauseSpeech`) | Varsayılan ses "boynunuz ağrıyorsa yavaşça oturabilirsiniz" ve "Pozisyona gelemiyorum" yolunu artık söylemiyor; yalnız ekrandaki "Tekrar dinle"de var (2. tur isteğimin geri adımı). | Kısa sese tek cümle eklensin: "Duraklatıldı. Boynunuz ağrıyorsa yavaşça oturun. Devam için ekrana iki saniye basılı tutun." "Gelemiyorum" ayrıntısı "Tekrar dinle"de kalabilir. | Evet (`pause.out`) |
| 2 | Düşük | "Gelinemedi" en iyi açısı | Savrulmada değer gerçekte tutulandan 2–6° yüksek (14° / 10° ↔ 8°). | Ortanca penceresi açı hedeften uzaklaşırken değil, durağan anlarda (örneğin açı değişimi < 2°/s) alınsın. | Evet |
| 3 | Düşük (klinik karar) | Kırmızı bayrak `orthostatic` | Bilinen kararma her atakta durdurur (bilerek); kurulum notu artık önceden söylüyor. | Kural kalsın; ek istek yok. | Önceki turlar |

## 4. Sevdiklerim
- "Zorlamayın → rahat olduğunuz yerde kalın → ~60 sn'de durdur, hekime yönlendir": beş turdur en güvendiğim yer; bozulmasın.
- Bitiş ekranında, seste ve raporda "Durulan yer … baş en çok ~8° (hedef 15–40°)" ve "hedefe yalnız bir an değdi": hekimim neye karar vereceğini biliyor.
- Kurulumda engelin adı, hekime sorular ve tansiyon ilacı uyarısının atak gelmeden söylenmesi.

## 5. Memnuniyet
**9/10** (turlar: 5 → 8 → 9 → 9 → 9). İsteklerimin üçü de karşılandı. 10 vermememin nedeni duraklatınca boynu ağrıyan
hastaya "oturabilirsiniz" denmemesi; bu cümle 3. turda vardı ve bu turda varsayılan sesten çıktı.

**Bu sürümü bir yakınıma önerir miyim / klinikte kullanır mıyım: Evet, şu koşullarla.**
- Yakınımın hekim tanısı olmalı ve kurulumdaki boyun/omurga sorusunu dürüst yanıtlamalı. Boyun sorunu varsa uygulama kapanır ve ne soracağını söyler.
- Tansiyon ilacı kullanıyorsa, göz kararmasında durduracağını kurulumda zaten okuyacak.
- Boynu sınırda olan hastama bir şeyi önceden söylerim: "duraklattığında boynun ağrıyorsa yavaşça otur; uygulama zaten 1 dakikada durdurur". Bu cümle varsayılan sese dönerse bu ek uyarıya gerek kalmaz.

Kanıtlar: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-5/k07-sinirda-hasta/`
(`onboard.json`, `strict.out`, `strict-clean.out`, `mstop.out`, `mstop-clean.out`, `edge2-*.out`, `pause.out`, `force.out`, ekran görüntüleri).
