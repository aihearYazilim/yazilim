# Protokol tablosu (koddan otomatik üretildi)

> Bu dosya `npm run docs:protocols` ile `src/core/protocols.ts` dosyasından üretilir; elle düzenlemeyin.
> Açı tanımları: yatar θ (0 = yüz tavana, +90 = sağ kulak altta, −90 = sol kulak altta, ±180 = yüz yere),
> φ (+ = baş geriye sarkık, − = çene göğse); oturur ψ (+ = çene göğse, − = tavana bakış).
> Tüm protokoller SAĞ taraf için gösterilir; sol tarafta θ işareti ters çevrilir.

## Dix-Hallpike testi

- Kanal: PC · Tür: test · Kullanım: hasta + klinisyen
- Özet: Arka kanal BPPV için tanı testi. Baş 45° test tarafına çevrili ve 20–30° sarkıkken sırtüstü yatılır; baş dönmesi/nistagmus gözlenir.
- Kanıt notu: Kılavuz tanımı.

| # | Adım | Hedef | En az bekleme | Belirti bitince + | Belirti üst sınırı (hasta) | Not |
|---|---|---|---|---|---|---|
| 1 | Otur, başını sağa çevir | Oturur, ψ -25…35° | 4 s | 0 s | —  | oturur baş dönüşü sensörle doğrulanamaz |
| 2 | Sırtüstü yat, baş sağa çevrili ve sarkık | Yatar, θ 45° ±10°, φ 15…40° | 60 s | 10 s | 120 s | bulgu: dhR |
| 3 | Yavaşça otur | Oturur, ψ -20…35° | 20 s | 5 s | —  |  |

Kaynaklar:
- Bhattacharyya N ve ark. Clinical Practice Guideline: BPPV (Update). Otolaryngol Head Neck Surg 2017;156(3_suppl):S1–S47.
- von Brevern M ve ark. BPPV: Diagnostic criteria (Bárány Society ICVD). J Vestib Res 2015;25:105–117.

Uyarılar:
- Boyun hareket kısıtlılığı ya da boyun hastalığı varsa test hekim gözetiminde ve değiştirilmiş biçimde (yan yatış testi) yapılmalıdır.

## Sırtüstü baş çevirme (supine roll) testi

- Kanal: HC · Tür: test · Kullanım: yalnız klinisyen
- Özet: Yatay kanal BPPV için tanı testi. Sırtüstü, baş ~30° fleksiyonda; baş hızla sağa ve sola 90° çevrilir; yatay nistagmusun yönü (geotropik/apogeotropik) ve şiddeti karşılaştırılır.
- Kanıt notu: Kılavuz tanımı.

| # | Adım | Hedef | En az bekleme | Belirti bitince + | Belirti üst sınırı (hasta) | Not |
|---|---|---|---|---|---|---|
| 1 | Sırtüstü, baş hafif öne eğik | Yatar, θ 0° ±15°, φ -42…-10° | 10 s | 0 s | —  | bulgu: rollCenter |
| 2 | Başı hızla sağa 90° çevir | Yatar, θ 90° ±15°, φ -42…15° | 45 s | 10 s | —  | bulgu: rollR |
| 3 | Başı ortaya getir | Yatar, θ 0° ±15°, φ -42…10° | 30 s | 10 s | —  |  |
| 4 | Başı hızla sola 90° çevir | Yatar, θ -90° ±15°, φ -42…15° | 45 s | 10 s | —  | bulgu: rollL |
| 5 | Başı ortaya getir | Yatar, θ 0° ±15°, φ -42…10° | 10 s | 5 s | —  |  |

Kaynaklar:
- Bhattacharyya N ve ark. Otolaryngol Head Neck Surg 2017 (supine roll test).
- von Brevern M ve ark. J Vestib Res 2015 (yatay kanal tanı ölçütleri).

Uyarılar:
- Yalnızca klinisyen tarafından yapılır.

## Epley manevrası (kanalit repozisyon)

- Kanal: PC · Tür: manevra · Kullanım: hasta + klinisyen
- Özet: Arka kanal BPPV tedavisi. Dix-Hallpike pozisyonundan başlayarak baş 90° karşı tarafa, ardından gövdeyle birlikte yüz yere 45° bakacak şekilde döndürülür ve oturulur.
- Kanıt notu: Kılavuz ve RKÇ kanıtı güçlü.

| # | Adım | Hedef | En az bekleme | Belirti bitince + | Belirti üst sınırı (hasta) | Not |
|---|---|---|---|---|---|---|
| 1 | Otur, başını sağa çevir | Oturur, ψ -25…35° | 5 s | 0 s | —  | oturur baş dönüşü sensörle doğrulanamaz |
| 2 | Sırtüstü yat, baş sağa çevrili ve sarkık | Yatar, θ 45° ±10°, φ 15…40° | 45 s | 30 s | 120 s |  |
| 3 | Başını sola çevir | Yatar, θ -45° ±10°, φ 15…40° | 45 s | 30 s | 120 s |  |
| 4 | Sol yanına dön, burnun yere baksın | Yatar, θ -135° ±15°, φ -25…30° | 45 s | 30 s | 120 s |  |
| 5 | Yavaşça otur, çene hafif aşağı | Oturur, ψ 5…45° | 60 s | 15 s | —  |  |

Kaynaklar:
- Bhattacharyya N ve ark. Otolaryngol Head Neck Surg 2017 (CRP tanımı).
- Hilton MP, Pinder DK. Cochrane Database Syst Rev 2014;CD003162.
- Radtke A ve ark. Neurology 2004;63:150–152 (ev Epley).
- Kim HJ ve ark. JAMA Neurol 2023;80:244–250 (kendi kendine manevra RKÇ).

Uyarılar:
- Boyun hastalığı, yakın boyun cerrahisi/travması, ciddi karotis darlığı, kararsız kalp hastalığı olanlarda hekim kararı gerekir.

## Semont (kurtarıcı) manevrası

- Kanal: PC · Tür: manevra · Kullanım: klinisyen; hastada yalnız reçeteyle
- Özet: Arka kanal BPPV tedavisi. Baş sağlam tarafa 45° çevrilmişken etkilenen tarafa yan yatılır, ardından tek hızlı hareketle karşı tarafa geçilir.
- Kanıt notu: Sınıf I kanıt (Mandalà 2012).

| # | Adım | Hedef | En az bekleme | Belirti bitince + | Belirti üst sınırı (hasta) | Not |
|---|---|---|---|---|---|---|
| 1 | Yatak ortasında otur, başını sola çevir | Oturur, ψ -25…35° | 5 s | 0 s | —  | oturur baş dönüşü sensörle doğrulanamaz |
| 2 | Sağ yanına hızla yat, burun yukarı | Yatar, θ 45° ±12°, φ -30…30° | 60 s | 30 s | 120 s |  |
| 3 | Tek hızlı hareketle sol yanına geç | Yatar, θ -135° ±15°, φ -30…30° | 60 s | 30 s | 120 s | hızlı geçiş hedefi ≤2 s |
| 4 | Yavaşça otur | Oturur, ψ -15…35° | 60 s | 15 s | —  |  |

Kaynaklar:
- Semont A ve ark. Adv Otorhinolaryngol 1988;42:290–293.
- Mandalà M ve ark. J Neurol 2012;259:882–885 (sham kontrollü RKÇ).

Uyarılar:
- Hızlı geçiş gerektirir; yaşlı ya da hareket kısıtlılığı olan hastada yardımcı gerekir.
- Hasta modunda yalnızca odyolog/hekim reçetesiyle açılır.

## Barbekü (Lempert) roll manevrası

- Kanal: HC · Tür: manevra · Kullanım: yalnız klinisyen
- Özet: Yatay kanal (geotropik) BPPV tedavisi. Etkilenen kulak altta başlanır; sağlam tarafa doğru 90°lik adımlarla toplam 360° dönülür.
- Kanıt notu: Sınıf I kanıt (Kim 2012).

| # | Adım | Hedef | En az bekleme | Belirti bitince + | Belirti üst sınırı (hasta) | Not |
|---|---|---|---|---|---|---|
| 1 | Sırtüstü, baş sağa 90° | Yatar, θ 90° ±15°, φ -42…20° | 45 s | 15 s | —  |  |
| 2 | Yüz tavana | Yatar, θ 0° ±15°, φ -42…20° | 45 s | 15 s | —  |  |
| 3 | Baş sola 90° | Yatar, θ -90° ±15°, φ -42…20° | 45 s | 15 s | —  |  |
| 4 | Yüzüstü, dirsekler üzerinde | Yatar, θ 180° ±20°, φ -42…30° | 45 s | 15 s | —  |  |
| 5 | Sağ yanına (toplam 270°) | Yatar, θ 90° ±15°, φ -42…20° | 45 s | 15 s | —  |  |
| 6 | Sırtüstü (toplam 360°) | Yatar, θ 0° ±15°, φ -42…20° | 30 s | 15 s | —  |  |
| 7 | Yavaşça otur | Oturur, ψ -15…35° | 60 s | 15 s | —  |  |

Kaynaklar:
- Lempert T, Tiel-Wilck K. Laryngoscope 1996;106:476–478.
- Kim JS ve ark. Neurology 2012;79(7):700–707 (geotropik yatay kanal RKÇ: BBQ, Gufoni, sham; PMID 22855868).

Uyarılar:
- Yalnızca klinisyen modunda. Yüzüstü adım hastanın hareket kapasitesine göre uyarlanmalıdır.

## Gufoni manevrası (geotropik yatay kanal)

- Kanal: HC · Tür: manevra · Kullanım: yalnız klinisyen
- Özet: Yatay kanal geotropik (kanalitiyazis) tedavisi. Sağlam tarafa hızla yan yatılır, ardından baş 45° yere doğru çevrilir.
- Kanıt notu: Sınıf I kanıt (Kim 2012).

| # | Adım | Hedef | En az bekleme | Belirti bitince + | Belirti üst sınırı (hasta) | Not |
|---|---|---|---|---|---|---|
| 1 | Yatak kenarında otur | Oturur, ψ -20…30° | 5 s | 0 s | —  |  |
| 2 | Hızla sol yanına yat | Yatar, θ -90° ±12°, φ -30…30° | 60 s | 60 s | —  |  |
| 3 | Başı 45° yere çevir | Yatar, θ -140° ±12°, φ -30…30° | 120 s | 30 s | —  |  |
| 4 | Yavaşça otur | Oturur, ψ -15…35° | 60 s | 15 s | —  |  |

Kaynaklar:
- Gufoni M ve ark. Acta Otorhinolaryngol Ital 1998;18:363–367.
- Kim JS ve ark. Neurology 2012;79(7):700–707 (geotropik yatay kanal RKÇ; PMID 22855868).
- Bhattacharyya N ve ark. AAO-HNSF BPPV kılavuzu 2017, Tablo 14.

Uyarılar:
- Yalnızca klinisyen modunda.

## Gufoni manevrası (apogeotropik yatay kanal) — burun-yukarı (Appiani / Kim) varyantı

- Kanal: HC · Tür: manevra · Kullanım: yalnız klinisyen
- Özet: Yatay kanal apogeotropik tedavisi, burun-yukarı varyantı (Appiani 2005; Kim 2012 RKÇ protokolü). Etkilenen tarafa hızla yan yatılır, 1 dk sonra baş 45° tavana doğru çevrilir ve ~2 dk beklenir. Kılavuzdaki burun-yere varyantı bu uygulamada yoktur.
- Kanıt notu: RKÇ kanıtı var; manevra varyantları kaynaklar arasında farklılık gösterir.

| # | Adım | Hedef | En az bekleme | Belirti bitince + | Belirti üst sınırı (hasta) | Not |
|---|---|---|---|---|---|---|
| 1 | Yatak kenarında otur | Oturur, ψ -20…30° | 5 s | 0 s | —  |  |
| 2 | Hızla sağ yanına yat | Yatar, θ 90° ±12°, φ -30…30° | 60 s | 0 s | —  |  |
| 3 | Başı 45° tavana çevir | Yatar, θ 45° ±12°, φ -30…30° | 120 s | 0 s | —  |  |
| 4 | Yavaşça otur | Oturur, ψ -15…35° | 60 s | 15 s | —  |  |

Kaynaklar:
- Appiani GC ve ark. Otol Neurotol 2005;26:257–260.
- Kim JS ve ark. Neurology 2012;78(3):159–166 (apogeotropik yatay kanal RKÇ; PMID 22170885; protokol NCT00810641).
- Bhattacharyya N ve ark. AAO-HNSF BPPV kılavuzu 2017, Tablo 15 (iki varyant; burun-yukarı varyantı RKÇ ile sınanmıştır).

Uyarılar:
- Yalnızca klinisyen modunda. Anlık etkinlik tutarsızdır; apogeotropik formun geotropiğe dönüşmesi beklenebilir.

## Yacovino (derin baş sarkıtma) manevrası

- Kanal: AC · Tür: manevra · Kullanım: yalnız klinisyen
- Özet: Ön kanal BPPV için taraf gerektirmeyen manevra: derin baş sarkıtma, sırtüstü çene göğse, çene göğüste oturma.
- Kanıt notu: Düşük kanıt; konsensüs yok.

| # | Adım | Hedef | En az bekleme | Belirti bitince + | Belirti üst sınırı (hasta) | Not |
|---|---|---|---|---|---|---|
| 1 | Otur | Oturur, ψ -20…30° | 5 s | 0 s | —  |  |
| 2 | Derin baş sarkıtma | Yatar, θ 0° ±15°, φ 30…65° | 30 s | 30 s | —  |  |
| 3 | Sırtüstü, çene göğse | Yatar, θ 0° ±15°, φ -42…-15° | 30 s | 0 s | —  |  |
| 4 | Çene göğüste otur | Oturur, ψ 15…60° | 30 s | 15 s | —  |  |

Kaynaklar:
- Yacovino DA ve ark. J Neurol 2009;256:1851–1855 (vaka serisi).

Uyarılar:
- Yalnızca klinisyen modunda. Kanıt düşük (vaka serisi); aşağı vuran pozisyonel nistagmusta santral nedenler dışlanmalıdır.
- Kanal dönüşümü (ön kanal → arka kanal) olabilir.
