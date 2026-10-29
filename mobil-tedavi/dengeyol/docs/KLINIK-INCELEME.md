# DengeYol: bağımsız klinik içerik incelemesi

**İncelenen dosyalar:** `app/src/core/geometry.ts`, `protocols.ts`, `diagnosis.ts`, `safety.ts`; bağlam olarak `aninda/proje-A-bppv-dengeyol.md` §1–2.
**Tarih:** 2026-10-27
**Yöntem:** Her manevra adımının θ/φ hedefi `geometry.ts` tanımıyla fiziksel pozisyona çevrildi ve birincil kaynakların (kılavuz tabloları, RKÇ protokol metinleri, PubMed özetleri) adım tanımlarıyla karşılaştırıldı. Hiçbir kaynak dosyası değiştirilmedi.

**Durum etiketleri:**
- **DOĞRU:** Kaynakla uyumlu.
- **DÜZELTİLMELİ:** Değişiklik önerilir. Dosya, adım ve önerilen değer belirtilmiştir.
- **BELİRSİZ:** Kaynaklar arasında görüş ayrılığı var, kanıt zayıf ya da birincil metin görülemedi. Klinik danışman karar vermelidir.

> **Not:** Kodda gerekçe kaynağı olarak gösterilen `docs/KLINIK-PROTOKOL.md` dosyası depoda yok. Bu dosyanın oluşturulması ya da kod yorumlarındaki atıfların güncellenmesi gerekir.

---

## 0. Kullanılan birincil kaynaklar ve erişim düzeyi

| # | Kaynak | Bağlantı | Erişim |
|---|---|---|---|
| K1 | Bhattacharyya N ve ark. Clinical Practice Guideline: BPPV (Update). *Otolaryngol Head Neck Surg* 2017;156(3S):S1–S47 | https://doi.org/10.1177/0194599816689667 · PubMed 28248609 | **Tam metin okundu.** Yayıncı PDF'inin kopyası kullanıldı: https://www.rcot.org/2021/pdf/CPG-BPPV08-05-2017.pdf. Okunan bölümler: Tablo 6, 7, 10, 11, 13, 14, 15; Dix-Hallpike ve supine roll anlatımı; kontrendikasyon/dikkat listesi; santral bulgular. |
| K2 | von Brevern M ve ark. BPPV: Diagnostic criteria (Bárány ICVD). *J Vestib Res* 2015;25:105–117 | https://doi.org/10.3233/VES-150553 | **Tam metne erişilemedi** (ödeme duvarı). Ölçütler, onları aynen aktaran ikincil kaynaklardan doğrulandı (K2a, K2b). |
| K2a | Wu J ve ark. *Front Neurol* 2024;15:1413929 (Bárány PC-ca ve PC-cu ölçütlerini aktarıyor) | https://doi.org/10.3389/fneur.2024.1413929 | Tam metin |
| K2b | Ling X ve ark. *Front Neurol* 2020;11:602 (Bárány kategorileri özeti) | https://pmc.ncbi.nlm.nih.gov/articles/PMC7350517/ | Tam metin |
| K3 | Kim JS ve ark. RKÇ, **apogeotropik** HC-BPPV. *Neurology* 2012;**78(3):159–166** | PubMed 22170885 · https://clinicaltrials.gov/study/NCT00810641 | Özet ve **kayıtlı protokol metni** (manevra tanımı aynen) |
| K4 | Kim JS ve ark. RKÇ, **geotropik** HC-BPPV. *Neurology* 2012;**79(7):700–707** | PubMed 22855868 · https://clinicaltrials.gov/study/NCT01366430 | Özet ve **kayıtlı protokol metni** (manevra tanımı aynen) |
| K5 | Appiani GC ve ark. *Otol Neurotol* 2005;26(2):257–260 | https://iris.uniroma1.it/handle/11573/93563 (DOI 10.1097/00129492-200503000-00022) | Özet. Manevra adımları K5a'dan alındı. |
| K5a | Alvarez de Linera-Alperi M ve ark. Zuma e Maia vs Appiani. *Audiol Res* 2022;12(3):337–346 | https://pmc.ncbi.nlm.nih.gov/articles/PMC9220154/ | Tam metin (Appiani adımları) |
| K6 | Gufoni M ve ark. *Acta Otorhinolaryngol Ital* 1998;18(6):363–367 | https://pubmed.ncbi.nlm.nih.gov/10388148/ | Yalnızca İtalyanca özet. Adım ayrıntısı K1 Tablo 14/15'ten alındı. |
| K7 | Lempert T, Tiel-Wilck K. *Laryngoscope* 1996;106:476–478 | https://pubmed.ncbi.nlm.nih.gov/8614224/ | Özet |
| K8 | Mandalà M ve ark. *J Neurol* 2012;259(5):882–885 | https://pubmed.ncbi.nlm.nih.gov/22008871/ | Özet (bekleme süreleri özette yok) |
| K9 | Semont A ve ark. *Adv Otorhinolaryngol* 1988;42:290–293 | https://pubmed.ncbi.nlm.nih.gov/3213745/ | **Özet yok, tam metin görülemedi** |
| K10 | Yacovino DA ve ark. *J Neurol* 2009;256:1851–1855 | https://pubmed.ncbi.nlm.nih.gov/19536580/ | Özet |
| K10a | Bhandari A ve ark. *Front Neurol* 2021;12:740599 (AC manevraları 3B simülasyonu) | https://doi.org/10.3389/fneur.2021.740599 | Tam metin |
| K11 | Radtke A ve ark. *Neurology* 2004;63:150–152 | https://pubmed.ncbi.nlm.nih.gov/15249626/ | Özet |
| K12 | Kim HJ ve ark. *JAMA Neurol* 2023;80:244–250 | https://pmc.ncbi.nlm.nih.gov/articles/PMC10011937/ | Tam metin |
| K13 | Strupp M ve ark. SémontPLUS vs Sémont. *Front Neurol* 2021;12:652573 | https://pmc.ncbi.nlm.nih.gov/articles/PMC8079727/ | Tam metin |
| K14 | Hilton MP, Pinder DK. *Cochrane* 2014;CD003162 | https://pubmed.ncbi.nlm.nih.gov/25485940/ | Künye doğrulandı |
| K15 | Epley'de tam açı ile tahmini açının karşılaştırıldığı RKÇ. *Audiol Neurotol* 2025;30(3):272–281 | https://karger.com/aud/article/30/3/272/919260/ | Yalnızca özet ve ikincil özet. İlk yazarın adı kaynaklarda tutarsız geçiyor, doğrulanamadı. |

---

## 1. Manevraların adım dizisi ve yönleri

Geometri kontrolü: `upFromLying(θ, φ)` = (−sinθ·cosφ, −sinφ, cosθ·cosφ). Bu formül, gövde sırtüstüyken başın önce gövde uzun ekseni etrafında θ kadar çevrilmesine, ardından gövdenin sağ-sol ekseni etrafında φ kadar ekstansiyona getirilmesine karşılık gelir. Bu, Dix-Hallpike'ın klinik tarifiyle (K1 Şekil 1: "baş 45° çevrilir, sırtüstü yatırılır, boyun 20° ekstansiyona getirilir") birebir aynı sıradır. θ=+90 iken sağ kulak altta kalır. **Koordinat tanımı DOĞRU.**

Aynalama da kontrol edildi: `mirrorTarget` θ'yı −θ yapar ve `wrapDeg(−180)` sonucu 180 olur. Sol taraf metinleri `fillText` ile dolduruluyor. **DOĞRU.**

### 1.0 Dix-Hallpike (`dix-hallpike`): DOĞRU
- `dh-sit` → `dh-lie` (θ=+45, φ 15–40) → `dh-up`. K1 Şekil 1 ile örtüşüyor: baş test tarafına 45° çevrilir, sırtüstü yatılır, boyun 20° ekstansiyona getirilir.

### 1.0b Supine roll testi (`supine-roll`): DOĞRU (küçük not)
- Merkez → sağa 90° → merkez → sola 90° → merkez. K1 sırası da aynıdır: önce bir taraf, nistagmus sönünce yüz tavana, sonra diğer taraf.
- Not: K1 başlangıç pozisyonunu "head in neutral position" olarak tanımlar. Kod ise yaklaşık 30° fleksiyon (`roll-center` φ −45…−10) istiyor. Pagnini-McClure testi yaygın olarak 30° fleksiyonla yapılır ve bu yanlış değildir. Yine de kılavuzdaki tanımdan bir sapmadır. **BELİRSİZ, düşük öncelik.**

### 1.a Sağ Semont (`semont`): DOĞRU
- Kod: `se-sit` (baş sağlam tarafa 45°) → `se-1` θ=+45 (sağ yan, burun 45° yukarı) → `se-2` θ=−135 (sol yan, burun 45° yere, hızlı geçiş) → `se-3` otur.
- K1 Tablo 11 (sağ kulak): *"Start … with the head turned away from the affected side. Quickly put the patient into the side-lying position, toward the affected side, with the head turned up … Quickly move the patient … through the sitting position so that he or she is in the opposite side-lying position with the head facing down (head did not turn during the position change)."*
- Fiziksel karşılık: sağ yana yatılır ve baş gövdeye göre 45° sola çevrilidir; bu durumda yüz tavana doğru 45° bakar ve θ=+45 olur. Sola geçildiğinde baş-gövde ilişkisi korunur; bu durumda yüz yere doğru 45° bakar ve θ=−135 olur. İki değer de doğru. K13 de aynı sırayı tarif eder: "head turned toward the unaffected side" ve her pozisyonda 60 s.

### 1.b Sağ Epley (`epley`): DOĞRU
- Kod: θ = +45 (sarkık) → −45 (sarkık) → −135 → oturma.
- K1 Tablo 10: baş etkilenen kulağa 45° çevrilir; sırtüstü yatılır ve baş 20° sarkıtılır; baş 90° karşı tarafa çevrilir; 90° daha çevrilir ve gövde yan yatar, yüz "nearly facedown" olur; ardından oturulur. θ dizisi bu tarifle birebir uyumlu.

### 1.c Sağ geotropik BBQ roll (`bbq-roll`): DOĞRU (iki küçük öneriyle)
- Kod: θ = +90 → 0 → −90 → 180 → +90 → 0 → otur. Her adımda θ 90° azalıyor, yani dönüş hep aynı yönde, sağlam tarafa doğru.
- K1 Tablo 13 (sağ, geotropik): *"Start from the supine position. OR Some recommend rolling to start on the involved side. Roll … to the unaffected side. Keep rolling in the same direction until … nose down or prone. Some recommend ending the maneuver here … (270° roll) … As originally published, however, complete the final roll (full 360°), and return to sitting."* Her pozisyon *"15-30 seconds or until nystagmus stops"* tutulur.
- K7 (Lempert 1996 özgün tanımı): başlangıç sırtüstüdür ve sağlam kulağa doğru üç kez 90° dönülür (270°).
- K4 (Kim 2012 geotropik RKÇ protokolü): sırtüstü → sağlam kulak altta → yüz yere → etkilenen kulak altta → oturma. Her adım 30–60 s.
- Sonuç: Kodun "etkilenen kulak altta başla, 360° dön, sonra otur" dizisi K1'in kabul ettiği varyantların birleşimidir. Yön doğrudur.
- Küçük not 1: Kodda son adımda (+90 → 0) etkilenen kulak altta kaldıktan sonra sırtüstüne dönülüyor. Başlangıç noktası (+90) sayılırsa toplam dönüş 450°, sırtüstünden sayılırsa 360°'dir. Bu fazladan adım zararsız, çünkü dönüş aynı yönde sürüyor. Ancak `bbq-4` ve `bbq-5` başlıklarındaki "toplam 270°" ve "toplam 360°" ifadeleri, sayımın sırtüstünden başladığını varsayıyor. Bu durum klinisyeni karıştırabilir (bkz. §6).

### 1.d Geotropik Gufoni (`gufoni-geo`): DOĞRU
- Kod: sağlam yana yatılır (θ=−90), ardından baş 45° yere çevrilir (θ=−135).
- K4 protokol metni (aynen): *"the patient was quickly brought down on the healthy side from the sitting position, and the head was then turned about 45 degree down, so that the nose was on the bed. After 2 minutes in this position, the patient was returned to the upright position."*
- K1 Tablo 14: sağlam yana yaklaşık 30 s düz yatılır; baş hızla 45–60° yere çevrilir ve 1–2 dk tutulur. Hasta otururken baş, ayağa kalkana kadar sağlam omuza çevrili tutulur, sonra düzeltilir. Oturma adımının metni için bkz. §6, madde 6.3.

### 1.e Apogeotropik Gufoni (`gufoni-apo`): DOĞRU. En kritik soru, kesin yanıt aşağıda.
- Kod: sağ etkilenen için etkilenen yana yatılır (θ=+90), ardından baş 45° **tavana** çevrilir (θ=+45, burun yukarı).
- **K3, Kim 2012 apogeotropik RKÇ'sinin ClinicalTrials.gov'a kayıtlı protokol metni (aynen):** *"For Gufoni maneuver, the patient was quickly brought down to the side-lying position on the affected ear from the sitting position. After one minute in this position, the head of the patient was quickly turned 45° upward, so that the nose directed upward. Approximately 2 minutes later, the patient was returned to the upright position."* Makalenin özeti de aynı şeyi söyler: *"ipsilesional side-lying and upward head-turn"*.
- **K5a, Appiani manevrasının tarifi:** *"briskly move the patient to lie on the affected side … maintained for 2 min … the head is quickly turned upwards by 45°"*. Makaleye göre Appiani, Gufoni'yi "turning the head upwards instead of downwards" biçiminde değiştirmiştir.
- **K1 Tablo 15** iki varyantı birlikte verir. Her ikisinde de etkilenen yana yatılır. Varyant 1 (kılavuzun Şekil 7'sinde çizilen) burnu **yere** 45–60° çevirir; amaç, kupulanın utrikül tarafındaki debrisi serbestleştirmektir. Varyant 2 burnu **yukarı** 45–60° çevirir; amaç, kanal tarafındaki ya da ön koldaki debrisi serbestleştirmektir.
- **Kesin yanıt:** Appiani (2005) ve Kim (2012) versiyonlarında baş **tavana (burun yukarı)** çevrilir. Kodun θ=+45 değeri her iki birincil tarifle örtüşüyor. "Etkilenen yana yat, baş yere" biçimi farklı bir varyanttır (K1 Tablo 15 varyant 1). Kodun izlediği versiyon apogeotropik form için yapılmış **tek RKÇ'nin** (K3: %73,1'e karşı sham %34,7) kullandığı versiyondur. Bu yüzden doğru tercih budur.
- Ek kontroller:
  - Apogeotropik formda "etkilenen taraf = nistagmusun zayıf olduğu taraf" (K1 Tablo 7). `diagnosis.ts` de bu kuralı uyguluyor ve taraf, `gufoni-apo` adımlarına doğru aktarılıyor.
  - **Kaynak künyesi YANLIŞ (DÜZELTİLMELİ):** `GUFONI_APO.sources` apogeotropik çalışmayı "Neurology 2012;79:700–707" olarak veriyor. Bu künye geotropik çalışmaya aittir. Apogeotropik çalışmanın künyesi **78(3):159–166**'dır. `BBQ_ROLL.sources` ve `GUFONI_GEO.sources`'ta ise tersi yazılmış. PubMed 22170885 ve 22855868 ile doğrulandı. Bkz. Düzeltme tablosu, D1.
  - Appiani'nin amacı apogeotropik formu geotropiğe dönüştürmek, ardından geotropik Gufoni uygulamaktır (K5 özeti: *"then given Gufoni's liberatory maneuver for the geotropic variant"*). Kodun `cautions` bölümü dönüşümü anıyor. Ancak dönüşüm olduktan sonra aynı taraf için `gufoni-geo` ya da `bbq-roll` önerilmesi akışta tanımlı değil. Öneri: Tekrar testinde geotropiğe dönüşme görülürse, aynı etkilenen taraf için geotropik manevra önerilsin. **BELİRSİZ, akış önerisi.**
  - Kılavuzun Şekil 7'si burun-yere varyantını gösterdiği için klinisyenler karışıklık yaşayabilir. Bu yüzden ad alanında varyant açıkça yazılmalı: "Gufoni-Appiani (burun yukarı) varyantı". Bkz. §6.

### 1.f Yacovino (`yacovino`): DOĞRU
- Kod: oturma → derin baş sarkıtma (θ=0, φ 30–65) → sırtüstü, çene göğse (φ −65…−20) → çene göğüste oturma. Her adım 30 s.
- K10 özeti: *"supine with head hanging 30 degrees dependent with respect to the body, then supine with head inclined 30 degrees forward, and ending sitting with head 30 degrees forward."*
- K10a, özgün manevrayı her pozisyonda yaklaşık 30 s olarak aktarır (Hain 2005 ve Eggers & Zee 2010'a atıfla). Casani 2011 her pozisyonda 3 dk kullanmıştır.
- K10a'nın simülasyonunda çene-göğüs pozisyonunda debrisin arka kanala geçme (kanal dönüşümü) riski görüldü ve bu risk pozisyon uzadıkça arttı. Yazarlar çene-göğüs adımını atlayan "basitleştirilmiş" bir sürüm öneriyor. Bu bulgu yalnızca simülasyondan geliyor; RKÇ yok. Kodun `cautions` bölümü kanal dönüşümünü zaten anıyor. Süre önerisi için bkz. §2.

---

## 2. Bekleme süreleri

| Protokol / adım | Kod | Kaynak | Durum |
|---|---|---|---|
| Epley `ep-1…ep-3` | 45 s taban; baş dönmesi bitince +30 s | K1 Tablo 10: 20–30 s / ~20 s / 20–30 s | **DOĞRU.** Kılavuzdan uzun, ama süreyi uzatmanın zararı bildirilmemiş. Güvenli. |
| Epley `ep-4` | Oturarak 60 s | K1: süre belirtilmemiş | DOĞRU (güvenli) |
| Semont `se-1`, `se-2` | 60 s; baş dönmesi bitince +30 s | K1 Tablo 11: 1. pozisyon "nistagmus bittikten sonra ≥20 s (bazıları 1–2 dk)", 2. pozisyon "~30 s (bazıları 2–10 dk)". K13: her pozisyon 60 s. | **DOĞRU** |
| Semont `fastTransitionSec: 2` | ≤2 s | K1: "quickly", sayısal değer yok | **BELİRSİZ.** Sayısal değer birincil kaynakta doğrulanamadı. K8 ve K9'un tam metni görülemedi. |
| BBQ her adım | 45 s; baş dönmesi bitince +15 s | K1: 15–30 s ya da nistagmus bitene kadar; K4: 30–60 s | **DOĞRU** |
| Gufoni-geo `gg-1` | 60 s; baş dönmesi bitince +60 s | K1: ~30 s; K4: süre belirtilmemiş | DOĞRU (güvenli) |
| Gufoni-geo `gg-2` | 120 s | K1: 1–2 dk; K4: 2 dk | **DOĞRU** |
| Gufoni-apo `ga-1` | 60 s; baş dönmesi bitince +30 s | K3: **1 dk sabit**; K5a: 2 dk; K1: ~30 s | **DÜZELTİLMELİ** (bkz. D4) |
| Gufoni-apo `ga-2` | 120 s; baş dönmesi bitince +30 s | K3: ~2 dk sabit; K1: 1–2 dk | **DÜZELTİLMELİ** (bkz. D4) |
| Yacovino `ya-1…ya-3` | 30 s (+30 / +15 / +15 s) | K10a: özgün manevrada her pozisyon ~30 s | DOĞRU. `ya-2` için **BELİRSİZ** öneri: `afterVertigoSec` 15 → 0. Gerekçe: K10a'ya göre çene-göğüs pozisyonu uzadıkça kanal dönüşümü riski artıyor (yalnızca simülasyon kanıtı). |
| Dix-Hallpike `dh-lie` | 45 s taban | K1: tipik gecikme 5–20 s, *"In rare cases … as long as 1 minute"* | **BELİRSİZ.** 45 s pratikte yeterli. Klinisyen modunda gecikmesi uzun vakaları kaçırmamak için 60 s düşünülebilir. |

**D4 gerekçesi (apogeotropik Gufoni):** Apogeotropik formun çoğunda mekanizma kupulolitiazistir. Kupulolitiaziste nistagmus, provoke edici pozisyon korunduğu sürece devam eder (K1 Tablo 7 ve K2b: ≥1 dk). "Baş dönmesi bitince +30 s" kuralı bu nedenle adımı belirsiz süre uzatabilir. Ayrıca kod, RKÇ'de etkinliği gösterilmiş sabit zamanlamadan (K3: 1 dk + ~2 dk) sapmış olur. `maxVertigoSec` değeri null olduğu için bir üst sınır da yok.

---

## 3. Açı toleransları

| Parametre | Kod | Kaynak | Durum |
|---|---|---|---|
| Dix-Hallpike/Epley sarkıklığı | φ 15–40° | K1: 20° (Şekil 1), Tablo 10: "head-hanging 20°" | **DOĞRU (kabul edilebilir).** Alt sınır kılavuzun 5° altında, ama ölçüm gürültüsü payı için makul. φ yerçekimine göre ölçüldüğünden yastık nedeniyle gövdenin eğimi de bu değerin içinde kalıyor. |
| θ toleransı ±10° | `thetaTol: 10` | K15: tahmini açı grubunda <15° sapma, 1 haftalık sonucu değiştirmedi (n=31, küçük RKÇ). Sci Rep 2023 IMU hatası ~7–9° (proje dokümanında; bu incelemede yeniden açılmadı). | **DOĞRU.** K15'in kanıtı zayıf (n=31). |
| Yüz yere 45° adımı ±15° | `thetaTolFaceDown: 15` | K15 (<15°) | **DOĞRU** |
| Gufoni-geo `gg-2` | θ=−135 ±12 (yani 33–57° yere) | K1: 45–60° yere; K4: ~45° | **BELİRSİZ.** Alt uç (33°) kılavuz aralığının altında kalıyor. Öneri: hedef θ=−140, tolerans ±12 (38–62°). |
| Gufoni-apo `ga-2` | θ=+45 ±12 | K1 varyant 2: 45–60°; K3/K5a: 45° | DOĞRU. İsteğe bağlı öneri: θ=+40, tolerans ±12. |
| Semont `se-1` | θ=+45 ±12, φ −30…30 | K1/K13: baş yatay, 45° | DOĞRU |
| Yacovino `ya-1` | φ 30–65 | K10: "30° dependent" | DOĞRU. Üst sınır geniş ama derin sarkıtma hedefiyle uyumlu. |

---

## 4. `diagnosis.ts`: Bárány 2015 ve AAO-HNSF 2017 ile uyum

| Kural | Kod | Kaynak | Durum |
|---|---|---|---|
| PC kanalolitiazis | Yukarı vuran + torsiyonel; süre <60 s ise kanalolitiazis; gecikme ≤20 s ise "tipik" | K2a (Bárány PC-ca): *"latency of 1 or a few seconds … torsional … upper pole … toward the lower ear … upbeating … <1 min"*. K1 Tablo 6: gecikme 5–20 s, 60 s içinde düzelme. | **DOĞRU** |
| PC kupulolitiazis | Süre ≥60 s ise "kupulolitiazis (olası)" | K2a (Bárány PC-cu, "emerging"): *"brief or no latency … lasts more than 1 minute"* | **DOĞRU**, ancak önerilen manevra listesi düzeltilmeli (bkz. D2) |
| Gecikmesiz PC deseni uyarısı | latency=0 ve süre kısa ise santral uyarısı | K2a: kanalolitiazis gecikmelidir | DOĞRU |
| HC geotropik | Güçlü taraf hasta | K1 Tablo 7: *"Geotropic form: the side with the strongest nystagmus is the affected ear."* | **DOĞRU** |
| HC apogeotropik | Zayıf taraf hasta | K1 Tablo 7: *"Apogeotropic form: the side opposite the strongest nystagmus is the affected ear."* | **DOĞRU** |
| HC apogeotropik etiketi | "apogeotropik (kupulolitiazis)" | Bárány: apogeotropik ve ≥1 dk ise kupulolitiazis (K2b). Appiani'nin (K5) tezi ise ön kolda serbest debris, yani kanalolitiazis. K1 Tablo 15 de iki olasılığı birlikte anıyor. | **DÜZELTİLMELİ, etiket** (bkz. D5) |
| Geotropik ≥1 dk, apogeotropik <1 dk notları | Rationale metni | K2b | DOĞRU |
| İki tarafta farklı tipte yatay nistagmus | Tutarsız desen, santral uyarısı | K1 (santral bulgular) | DOĞRU (tutucu) |
| AC (aşağı vuran + torsiyonel) | Olası, taraf yok, santral uyarısı | K1: *"downbeating vertical component … could imply anterior canal … should be considered with caution because downbeating positional nystagmus related to brainstem or cerebellar lesion can produce a similar pattern"*. K2b: AC "emerging". | **DOĞRU** |
| Saf aşağı vuran nistagmus | Santral uyarısı, MR önerisi | K1: *"downbeating nystagmus on the Dix-Hallpike (particularly without the torsional component and particularly if not modified … by a positional maneuver)"* | **DOĞRU** |
| Sırtüstü nötr pozisyonda nistagmus | Uyarı | K1: *"baseline nystagmus manifesting without provocative maneuvers"* santral bulgulardan sayılır | DOĞRU |
| Nistagmussuz pozisyonel vertigo | "Olası BPPV" | K2b: Bárány'de "possible BPPV" ile "probable BPPV, spontaneously resolved" ayrı kategorilerdir. | **BELİRSİZ, terminoloji.** Türkçe "olası" kelimesi "probable" ile karışabilir. Öneri: "olası (possible) BPPV" yazılsın. Birincil metin görülemediği için alt kategori doğrulanamadı. |

**Eksik kurallar (öneri, BELİRSİZ):**
1. **Çok kanallı BPPV uyarısı:** Hem PC hem HC önerisi aynı anda çıkarsa ayrı bir uyarı yok. K1'e göre çift taraflı ya da çok kanallı tutulum özellikle kafa travmasından sonra görülür. K12 de çok kanallı BPPV'yi kendi kendine tedaviden dışlamıştır. Öneri: "Çok kanallı BPPV olasılığı: tedavi sırasını klinisyen belirlesin" uyarısı eklensin.
2. **Tedaviye yanıtsızlık:** K1, 2–3 manevraya yanıt yoksa santral nedenlerin araştırılmasını ve MR'ı önerir: *"especially after 2 or 3 attempted maneuvers … magnetic resonance imaging"*. Klinisyen modunda aynı tanıyla tekrar eden başarısız seanslar için bir uyarı eklenebilir.
3. **Aşağı vuran + torsiyonel desen için ayırıcı tanı:** Bu desen arka kanalın ampulla dışı kolundaki kanalolitiazisle de görülebilir ("apogeotropik PC" varyantı). Bu bilgi bu incelemede birincil kaynakla doğrulanamadı. Rationale metnine "ayırıcı tanı: atipik arka kanal varyantları" eklenmesi düşünülebilir.

---

## 5. Kırmızı bayraklar, kontrendikasyonlar ve doz (`safety.ts`)

### 5.1 Kırmızı bayrak soruları
| id | Durum | Not |
|---|---|---|
| `continuous` → acil | DOĞRU | Sürekli vertigo BPPV ile uyumsuzdur. Akut vestibüler sendromda inme olasılığı nedeniyle acil yönlendirme uygundur (K1 ayırıcı tanı). |
| `neuro` → acil | DOĞRU | K1: santral vertigo sıklıkla yürüme ve konuşma bozukluğuyla birliktedir. |
| `headache` → acil | DOĞRU | |
| `cardiac` → acil | DOĞRU | |
| `anticoag` → acil | DOĞRU | |
| `ear` → hekim | DOĞRU | |
| `neck` → hekim | DOĞRU | |
| `fever` → hekim | DOĞRU | |
| `same` (hayır ise) → hekim | DOĞRU | |
| **Eksik:** kan sulandırıcı kullanmayanlarda yakın zamanda kafa travması | **DÜZELTİLMELİ, ekleme** (D6) | K1: travma sonrası BPPV daha sık çift taraflıdır. K12: çok kanallı BPPV kendi kendine tedaviden dışlandı. |
| **Eksik:** baş hareketi olmadan gelen, dakikalar–saatler süren dönme atakları (Ménière, vestibüler migren) | **DÜZELTİLMELİ, ekleme** (D6) | `continuous` sorusu yalnızca kesintisiz baş dönmesini soruyor. Kendiliğinden gelen epizodik ataklar bu soruya yakalanmıyor. K1 ayırıcı tanısında vestibüler migren ve Ménière yer alıyor. K12'nin tarama soruları da *"dizzy mostly when your head is moved?"* ve *"last less than 3 minutes?"* sorularını içeriyor. |

### 5.2 Kontrendikasyonlar
- Mevcut maddeler: boyun, karotis/kalp, mobilite. Bunlar K1'in "dikkat" listesiyle uyumlu, **DOĞRU**.
- **Eksik (DÜZELTİLMELİ, ekleme, D7):** K1 s. S12'de şu durumlar ek olarak sayılıyor: *"severe kyphoscoliosis … Down's syndrome, severe rheumatoid arthritis, cervical radiculopathies, Paget's disease, ankylosing spondylitis, low back dysfunction, spinal cord injuries, and morbid obesity"* ve *"significant vascular disease"*. Uygulamada ankilozan spondilit, ağır romatoid artrit, ileri kifoskolyoz, ciddi bel sorunu, omurilik yaralanması, morbid obezite ve geçirilmiş inme/vertebrobaziler hastalık açıkça listelenmiyor. K12 ayrıca "spinal problems" ve bilişsel bozukluğu dışlama ölçütü olarak kullanmış. Bilişsel bozukluk proje dokümanında var, kodda yok.
- `eye` (retina dekolmanı / göz cerrahisi) ve `pregnancy` (ileri gebelik): Bu incelemede birincil kaynakla **doğrulanamadı** (proje dokümanı da retina maddesini doğrulanmamış olarak işaretlemiş). Maddeler tutucu oldukları için zararsız. **BELİRSİZ**, klinik danışman karar versin.
- `age` (<18 yaş): K12'nin alt yaş sınırı 20'dir. 18 makul. **DOĞRU.**

### 5.3 Doz sınırları
- Varsayılan doz: günde 3 × 3 gün, toplam 9 manevra. En fazla doz: günde 3 × 7 gün. K11: ev Epley'i ile 1 hafta sonunda %95 düzelme (dozlama özette yok). K12: manevra 1 saat sonra bir kez tekrarlandı; belirti sürerse hastaneye başvuruldu. K13: ev Semont'u günde 9 kez uygulandı. K1: 2–3 manevraya yanıt yoksa santral nedenler araştırılmalı. **Sonuç: Sınırlar yayımlanmış ev uygulamalarının içinde ve tutucu. DOĞRU.**
- `MAX_PRESCRIBED_DOSE` yorumundaki "Radtke 2004: günde 3, 1 hafta" ifadesi: 1 hafta, K11'in özetinde sonuç değerlendirme zamanı olarak geçiyor. Günde 3 kez dozlaması özette yok; ikincil kaynaklar bunu Radtke 1999 çalışmasına ve "24 saat semptomsuz olana kadar" kuralına bağlıyor. **BELİRSİZ.** Yorum "Radtke 2004 (1 haftalık sonlanım); dozlama ikincil kaynaklara dayanıyor" diye düzeltilmeli.
- Öneri (BELİRSİZ): K1'deki "2–3 manevra" eşiğine göre, ilk gün yapılan 3 manevranın hiçbirinden sonra kendi kendine testte **hiç** azalma yoksa, 3. gün beklenmeden hekime yönlendirilmesi düşünülebilir.

### 5.4 Hastanın kendi testinin yorumu (`interpretSideTests`)
- Baş dönmesinin ≥60 s sürmesi ya da bitişin işaretlenmemesi halinde hekime yönlendirme: **DOĞRU** (K1 Tablo 6, K2a). Tutucu bir kural.
- İki taraf pozitifse ve hangisinin daha şiddetli olduğu bilinmiyorsa hekime yönlendirme: **DOĞRU.**

---

## 6. Yönerge metinleri (Türkçe)

| # | Dosya / adım | Sorun | Öneri | Durum |
|---|---|---|---|---|
| 6.1 | `protocols.ts` `se-sit.say` | "Yatağın **ortasında**, bacaklarınız yataktan aşağı sarkacak şekilde oturun" çelişkili okunabilir: hem yatağın ortası hem kenarı. | "Yatağın uzun kenarının ortasına oturun; bacaklarınız yataktan aşağı sarksın. Her iki yanınıza da yatabilecek kadar yer olsun." | **DÜZELTİLMELİ** (D8) |
| 6.2 | `gg-2.say`, `ga-2.say` | "burnunuz yere baksın" ve "burnunuz yukarı baksın" ifadeleri hastayı 90°'lik tam dönüşe yöneltebilir: tamamen yüzüstü ya da tamamen sırtüstü. Hedef ise 45°. | `gg-2`: "Başınızı hızla yere doğru yarı yola kadar (yaklaşık 45 derece) çevirin; burnunuz yere doğru eğik baksın, yüzünüzü yastığa gömmeyin." `ga-2`: "Başınızı hızla tavana doğru yarı yola kadar (yaklaşık 45 derece) çevirin; burnunuz yukarı doğru eğik baksın, sırtüstü dönmeyin." | **DÜZELTİLMELİ** (D9) |
| 6.3 | `gg-3.say` / `clinician` | "Yavaşça oturun ve başınızı dik tutun." K1 Tablo 14 ise şöyle diyor: *"sits up again with the head held toward the left shoulder until fully upright and then may be straightened"*. | `say`: "Başınızı {H} omzunuza doğru çevrili tutarak yavaşça oturun; tam oturduktan sonra başınızı düzeltin." `clinician`: "Hasta, baş {H} omza çevrili kalarak oturtulur; tam dik olunca baş düzeltilir." | **DÜZELTİLMELİ** (D10) |
| 6.4 | `GUFONI_APO.name` / `summary` | Kılavuzun Şekil 7'si burun-yere varyantını gösterdiği için klinisyen yönü karıştırabilir. | Ad alanı "Gufoni-Appiani manevrası (apogeotropik; burun yukarı varyantı)" olsun. Özete şu cümle eklensin: "Kim 2012 RKÇ'sinde kullanılan varyant; kılavuz Tablo 15'teki burun-yere varyantından farklıdır." | **DÜZELTİLMELİ** (D11, metin) |
| 6.5 | `bbq-4.title`, `bbq-5.title` | "(toplam 270°)" ve "(toplam 360°)" sayımı sırtüstünden başlıyor. Oysa manevra `bbq-0` adımında etkilenen kulak altta başlıyor. | "(sırtüstünden itibaren 270°)" ve "(sırtüstünden itibaren 360°)" | BELİRSİZ, küçük |
| 6.6 | `bbq-1.say` | "Başınızı **yavaşça** ortaya getirin". K4: *"the head was rotated rapidly 90°"*. K7: dönüşler ardışık; hız belirtilmemiş. | "Başınızı kararlı ve hızlı bir hareketle ortaya getirin" ya da "yavaşça" sözcüğü çıkarılsın. Yavaş dönüşün etkisizliğine dair kanıt bulunamadı. | BELİRSİZ |
| 6.7 | Epley, Semont, Dix-Hallpike, BBQ ve Yacovino metinlerinin geri kalanı | Yön ve taraf belirteçleri ({A}, {H}, {Aya}, {Hya}) her adımda kontrol edildi. `ep-sit`'teki "çeneniz {A} omzunuza doğru yarı yolda" ifadesi 45° için iyi bir somutlaştırma. | — | **DOĞRU** |

---

## 7. DÜZELTİLMELİ maddeler: özet tablo

| ID | Dosya | Adım / alan | Mevcut | Önerilen | Kaynak |
|---|---|---|---|---|---|
| D1 | `protocols.ts` | `BBQ_ROLL.sources[1]`, `GUFONI_GEO.sources[1]` | "Kim JS ve ark. Neurology 2012;78:159–166 (geotropik…)" | "Kim JS ve ark. Neurology 2012;79(7):700–707 (geotropik HC RKÇ: BBQ, Gufoni, sham)" | PubMed 22855868 |
| D1 | `protocols.ts` | `GUFONI_APO.sources[1]` | "Kim JS ve ark. Neurology 2012;79:700–707 (apogeotropik…)" | "Kim JS ve ark. Neurology 2012;78(3):159–166 (apogeotropik HC RKÇ: Gufoni, baş sallama, sham)" | PubMed 22170885 |
| D2 | `diagnosis.ts` | PC önerisi, `maneuvers: maneuversFor('PC','canalithiasis')` (satır 128) | Kupulolitiazis olsa da ['epley','semont'] | `cupulo` ise ['semont','epley'] (`maneuversFor('PC', mech)` ve `protocols.ts` `maneuversFor` içinde `PC + cupulolithiasis → ['semont','epley']`) | K1: LM *"principally breaking the canaliths free from adherence to the cupula (cupulolithiasis)"*. Kanıt düzeyi düşük, öneri niteliğinde. |
| D4 | `protocols.ts` | `ga-1.afterVertigoSec`, `ga-2.afterVertigoSec` | 30, 30 | 0, 0 (sabit 60 s + 120 s). Alternatif: klinisyen el ile geçebilsin. | K3 protokolü: "after one minute … approximately 2 minutes later" |
| D5 | `diagnosis.ts` | HC apogeotropik `label` | "apogeotropik (kupulolitiazis)" | "apogeotropik (kupulolitiazis ya da ön kol kanalolitiazisi)". `maneuversFor` yönlendirmesi `gufoni-apo` olarak kalsın; `mechanism` 'unknown' yapılmasın, aksi halde geotropik manevralara yönlenir. | K5 (ön kol tezi), K1 Tablo 15 |
| D6 | `safety.ts` | `RED_FLAGS` | Yok | (a) `trauma`: "Son 2 hafta içinde başınızı çarptınız ya da kaza geçirdiniz mi?" → evet ise `doctor`. (b) `spontaneous`: "Baş dönmesi, başınızı hiç hareket ettirmeden kendiliğinden gelen ve dakikalar–saatler süren ataklar halinde mi?" → evet ise `doctor`. | K1 (travma ve çift taraflı tutulum; ayırıcı tanı), K12 tarama soruları |
| D7 | `safety.ts` | `CONTRAINDICATIONS` | Boyun, karotis/kalp, mobilite | Yeni madde: "Ankilozan spondilit, ağır romatoid artrit, ileri kifoskolyoz, ciddi bel sorunu, omurilik yaralanması, morbid obezite, geçirilmiş inme ya da beyin damar hastalığı". Ayrı madde: bilişsel bozukluk. | K1 s. S12; K12 dışlama ölçütleri |
| D8 | `protocols.ts` | `se-sit.say` | "Yatağın ortasında, bacaklarınız … sarkacak" | §6.1'deki metin | Açıklık |
| D9 | `protocols.ts` | `gg-2.say`, `ga-2.say` | "burnunuz yere baksın" / "burnunuz yukarı baksın" | §6.2'deki "yarı yol (45°)" metni | K1 Tablo 14/15 (45–60°), K3, K4 (45°) |
| D10 | `protocols.ts` | `gg-3.say`, `gg-3.clinician` | "başınızı dik tutun" | Baş {H} omza çevrili kalarak oturulur, sonra düzeltilir | K1 Tablo 14, adım 3 |
| D11 | `protocols.ts` | `GUFONI_APO.name/summary` | Varyant adı yok | "burun yukarı (Appiani/Kim) varyantı" ibaresi eklenir | K1 Tablo 15, K3, K5a |

**Doğrulanan kritik yön soruları (hepsi DOĞRU):**
- Sağ Semont: θ +45 → −135.
- Sağ Epley: +45 (sarkık) → −45 (sarkık) → −135 → oturma.
- BBQ: +90 → 0 → −90 → 180 → +90 → 0 → oturma.
- Gufoni-geo: −90 → −135.
- **Gufoni-apo: +90 → +45 (burun yukarı).** Kim 2012 RKÇ protokolü ve Appiani 2005 tarifiyle birebir aynı.
- Yacovino: dizi ve 30 s süreler.

## 8. Doğrulanamayanlar
- Bárány 2015 tam metni: ödeme duvarı nedeniyle açılamadı. Ölçütler ikincil kaynakların aynen aktarımından alındı (K2a, K2b).
- Semont 1988 ve Mandalà 2012 tam metinleri: Bu nedenle bekleme süreleri ve "≤2 s hızlı geçiş" sayısal değeri birincil kaynakta doğrulanamadı.
- Gufoni 1998 tam metni (İtalyanca): Adımlar kılavuzdan (K1) alındı.
- Radtke 2004 dozlaması (günde 3 kez): Yalnızca özet görüldü.
- Retina ve gebelik kontrendikasyonları için birincil kaynak bulunamadı.
- K15 RKÇ'sinin ilk yazar adı.
- Sci Rep 2023 IMU hatası: Proje dokümanındaki değer bu incelemede yeniden açılmadı.
