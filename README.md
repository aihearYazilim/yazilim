# Strateji Araştırması: "Ayda net %10" hedefi

**Tarih:** 17 Ekim 2026 · **Veri:** 2019 – 16 Ekim 2026, günlük kapanış
**Evren:** 36 büyük kripto para (Binance USDT) + 56 büyük BIST hissesi + XU100

## Hedef
- Ayda net en az %10 (yılda ~%214) kazanç
- Faizin en az 2 katı. Politika faizi %37, yani aylık ~%2,7; iki katı aylık ~%5,3 eder.
- Komisyon, kayma ve vergi düşüldükten sonra, özellikle son 12 ayda

## Yöntem
- Ağırlıklar t günü kapanışında belirlenir ve t+1 getirisine uygulanır. Geleceği görme (look-ahead) yoktur.
- Maliyetler:
  - Kripto spot: işlem başı %0,15
  - Kripto vadeli: işlem başı %0,10, ayrıca yıllık %10 fonlama
  - BIST: işlem başı %0,14
- BIST'te boşta kalan TL, para piyasası fonunda bekler (politika faizinin ~%90'ı kadar getiri).
- **Geçmiş (IS):** 2019/2020 – Eki 2025. **Son 12 ay (OOS):** 17 Eki 2025 – 16 Eki 2026.
- Toplam 178 parametre kombinasyonu test edildi:
  - trend (SMA)
  - kesitsel momentum rotasyonu (piyasa rejimi filtreli ve filtresiz)
  - Donchian kırılımı
  - kaldıraçlı uzun/kısa
  - kesitsel uzun/kısa

## Sonuç: Hedef tutmuyor

| | Kombinasyon | Son 12 ayda aylık ≥%10 olan | Son 12 ayın en iyisi (aylık) | Geçmişin en iyisinin son 12 ayı |
|---|---|---|---|---|
| Kripto (uzun) | 74 | 0 | %1,1 | **%-1,9** |
| Kripto (uzun/kısa, kaldıraç) | 22 | 0 | %5,75 (*) | **%-2,6** |
| BIST | 82 | 0 | %2,5 | **%2,3** |
| Referans: para piyasası fonu | – | – | %1,77 | – |

(*) ETH uzun/kısa SMA50, 2x kaldıraç. Son 12 ayda +%107 yaptı. Ama aynı strateji önceki 5 yılda sermayenin **%99,7'sini** kaybettirdi ve son 12 ayda bile en kötü ayı %-45 oldu. Bu bir strateji değil, geriye bakarak yapılmış bir seçim (overfitting).

**Önemli bir bulgu daha var:** 92 varlığın **hiçbiri** son 12 ayda %214 yükselmedi.

| Piyasa | Son 12 ayın en iyileri | Medyan |
|---|---|---|
| BIST | TKFEN %151, TUPRS %126 | %+11 |
| Kripto | NEAR %126 | %-42 |

Yani en iyi hisseyi baştan bilip alıp tutmak bile aylık %10'a yetmezdi.

## Gerçekçi en iyi aday (kâhinlik olmadan seçilebilen)
**BIST momentum: XU100 > SMA50 iken son 250 günün en güçlü 3 hissesi**
- Haftalık yeniden dengeleme
- Endeks SMA50'nin altına inince para piyasası fonuna geçilir

| Dönem | Aylık geometrik | Max düşüş |
|---|---|---|
| Geçmiş (2019–2025) | %5,2 | %-41 |
| Son 12 ay | %2,3 (yıllık +%34) | %-21 |

Bu sonuç faizin (%1,8/ay net) biraz üstünde. Ama 2 katı bile değil; %10'a ise hiç yakın değil.

## Dürüst değerlendirme
1. Komisyon ve vergi sonrası istikrarlı şekilde **ayda %10 net** kazandıran, halka açık veriyle bulunabilen bir strateji yok. Bunu vaat eden sinyal grupları, robotlar ve "garantili" fonlar dolandırıcılık riski taşır.
2. Çok sayıda parametre denenirse son 12 ayda harika görünen bir kombinasyon mutlaka çıkar. Bu, şans eseri bulunmuş bir sonuçtur ve gelecekte tekrarlanmaz.
3. Gerçekçi hedef: TL bazında **faiz + yıllık birkaç puan**. Risk düşüşü %20–40 olacaktır.

## Çalıştırma
```bash
python3 src/fetch_data.py          # verileri indir
python3 src/research_crypto.py     # kripto uzun-only
python3 src/research_crypto_ls.py  # kripto uzun/kısa
python3 src/research_bist.py       # BIST
```
Sonuç tabloları `results/` klasöründe.

**Uyarılar:**
- Kripto evreni bugün hayatta olan coinlerden oluşur. Bu "hayatta kalan yanlılığı" yaratır ve geçmiş sonuçlar olduğundan iyi görünür.
- Faiz serisi yaklaşıktır.
- Bu çalışma yatırım tavsiyesi değildir.
