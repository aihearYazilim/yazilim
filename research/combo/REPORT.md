# Kombine portföy: Halka arz (A) + boştaki paranın değerlendirilmesi — Rapor

Protokol: `research/PROTOCOL.md`. IS = 2022-01-01..2025-10-16, OOS = 2025-10-17..2026-10-16. Her pencere sermaye C ile
**sıfırdan** başlatıldı. Getiriler **net TL, nominal** (komisyon, kayma, kol giriş/çıkış maliyeti, vergi varsayımları sonrası).
Hiçbir parametre/ağırlık OOS verisiyle seçilmedi; tüm hücreler (sermaye × hesap × kol × teminat modu) raporlanmıştır.

## Kısa sonuç (dürüst)

* **Aylık %10 net (OOS): 120 ana kombinasyonun hiçbirinde ulaşılmadı** (vergi %0 ve dengeleme-günü duyarlılıkları dahil
  296 simülasyonun hiçbirinde değil).
* **Aylık %5.3 (OOS): 120'nin 21'inde**; hepsi küçük hesap başı sermayede (100k/2–4 hesap, 250k/4 hesap; yani hesap başı
  25k–62.5k TL). 18'i IS'te de ≥%5.3. **Tek hesapta hiçbir kombinasyon ulaşmadı** (en yakın: KELLY-sell 100k/1 %5.297, eşiğin hemen altında);
  **500k ve 1M toplam sermayede hiçbir hesap sayısında ulaşılmadı.**
* Boştaki parayı riskli kola koymak **IS'te** getiriyi belirgin artırıyor (1M/1 hesap: PPF %2.14 → BIST %5.61, KELLY %7.29),
  ama **OOS'ta** riskli kollar zayıfladı (arzsız: BIST %2.65, KELLY %3.20 (vergi %20), PPF %2.45) ve büyük düşüş getirdi
  (KELLY ≈ -%35, BIST ≈ -%20). OOS'ta arz+PPF (maxDD ≈ %0-1) ile arz+riskli kol arasındaki fark, sermaye büyüdükçe
  +%0.2..+%0.8 puan/ay; bunun için -%20..-%36 düşüş kabul ediliyor.
* Arz katkısı hesap başı sabit TL'dir (OOS ≈ 23–30k TL/hesap/yıl); sermaye/hesap büyüdükçe yüzde katkısı sıfıra iner
  (1M/1: +%0.14–0.23 puan/ay; 100k/4: +%4.4–5.6 puan/ay; tablo aşağıda).

## İlk 3 (seçim kuralı OOS'a bakmadan, aşağıda)

Seçim kuralı: varyantlar (kol × teminat modu) 12 sermaye/hesap hücresinin **IS ortalama aylık geo**'suna göre sıralandı;
gerçekçi olmayan teminat varsayımı ('pledge' ile yurt dışı/USD kolu) elendi. Sonuç: KELLY-sell, MIX_SH-sell, MIX_IV-sell
(IS sırası 3, 5, 6; ilk sıradakiler 'pledge' = uygulanamaz). Her biri için 3 tipik hücre:

| # | Kombinasyon | Hücre | IS aylık geo | OOS aylık geo | IS maxDD | OOS maxDD | OOS en kötü ay | ≥%5.3? | ≥%10? |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Arz + KELLY B (sat-teminat) | 100k / 1 hesap | %7.22 | %5.30 (5.297) | -35.5% | -31.9% | -22.2% | hayır (eşik altı) | hayır |
|   |  | 100k / 4 hesap | %7.97 | %8.76 | -35.0% | -25.5% | -16.7% | evet | hayır |
|   |  | 1M / 1 hesap | %7.29 | %3.43 | -35.8% | -36.3% | -25.3% | hayır | hayır |
| 2 | Arz + MIX_SH (%45 BIST mom / %55 KELLY, sat-teminat) | 100k / 1 | %7.03 | %4.97 | -25.1% | -20.5% | -15.3% | hayır | hayır |
|   |  | 100k / 4 | %7.57 | %8.47 | -24.7% | -13.7% | -8.4% | evet | hayır |
|   |  | 1M / 1 | %6.93 | %3.32 | -25.3% | -23.4% | -18.4% | hayır | hayır |
| 3 | Arz + MIX_IV (%57.8 BIST / %42.2 KELLY, sat-teminat) | 100k / 1 | %6.86 | %4.84 | -22.1% | -17.2% | -13.4% | hayır | hayır |
|   |  | 100k / 4 | %7.37 | %8.35 | -21.7% | -10.4% | -6.1% | evet | hayır |
|   |  | 1M / 1 | %6.71 | %3.23 | -27.9% | -21.0% | -16.4% | hayır | hayır |
| ref | Arz + PPF (fon teminatı) | 100k / 1 · 100k / 4 · 1M / 1 | %3.10 · %4.44 · %2.14 | %3.99 · %7.40 · %2.61 | ≈-1% | ≈-1% | +%1.25 | 100k/4: evet | hayır |
| ref | Arz + BIST mom (sat-teminat) | 100k / 1 · 100k / 4 · 1M / 1 | %5.95 · %6.47 · %5.61 | %4.25 · %7.82 · %2.82 | -24..-41% | -10..-20% | +0.8..-9.9% | 100k/4: evet | hayır |

**Uyarılar (top-3'ün hepsi KELLY içerir):** (1) KELLY B, 13 varlıkta 4x'e kadar kaldıraç ister; VİOP/CME (mikro) kontrat
büyüklükleri nedeniyle hesap başı ~25k–250k TL ile **uygulanamaz** (yalnızca kesirli CFD/kaldıraçlı ürünlerle yaklaşık
kurulabilir; Türkiye'de bunların kendi kaldıraç/maliyet kısıtları var). Hesap başı küçük sermaye zaten yüksek OOS'un
kaynağı. (2) 'sell' modunun OOS'ta 'pledge'den iyi olması şans: küçük hesapta ortalama özsermayenin %11–28'i teminat
olarak PPF'ye geçiyor (talep dönemlerinde neredeyse tamamı); OOS'ta bu, KELLY'nin Kasım-2025 ve Mart/Haziran-2026
düşüşlerinden kısmen kaçırdı. IS'te tersi (sell < pledge). (3) KELLY vergisi varsayımdır (aşağıda).

Tamamen uygulanabilir (kaldıraçsız, yurt içi) en iyi seçenekler: **Arz + PPF** (OOS 100k/4: %7.40, DD ≈ -%1; 1M/1: %2.61)
ve **Arz + BIST momentum (sat-teminat)** (OOS 100k/4: %7.82, 1M/1: %2.82 ama -%20 DD). OOS'ta BIST kolu PPF'ye
+0.2–0.4 puan ekledi, karşılığında -%10..-20 düşüş.

## Kurulum

### Bileşenler (hiçbiri bu çalışmada yeniden ayarlanmadı)
* **Arz (A)** — `research/ipo` kuralı aynen (`simulate.ipo_trades(rows, N=999, 'close')`): her arza talep,
  R = max(5.000, 3 × önceki 6 arzın kişi başı pay TL'si); kişi başı lot = floor(bireysel lot / bireysel kişi), R ve
  hesabın kullanılabilir varlığıyla sınırlı; tavan serisi bozulduğu günün kapanışında sat. Komisyon %0.14 alış + %0.14 satış.
  180 arz (IS 140, OOS 40). Arz pozisyonları günlük kapanıştan **piyasa değeriyle** (MTM) değerlenir.
  Yeni: aynı anda açık talepler toplam teminatı hesap varlığını aşamaz (ipo raporu her arzı ayrı sınırlıyordu) →
  IS 100k/4 hesap %4.76 yerine %4.30 (nakit blokaj); OOS 100k/1 %3.75 (rapor %3.79), 100k/4 %6.90 (rapor %7.05). Mutabık.
* **(a) MM**: para piyasası fonu, `engine.cash_rate_daily` (politika faizi × 0.9, net), takvim günü bileşik.
* **(b) BIST**: momentum lb250 top3, 5 satırda bir dengeleme, XU100 > SMA50 değilse PPF; `research_bist.py` kurulumu
  aynen (aynı evren, aynı takvim — panelde USDTRY kaynaklı Pazar satırları var, bu yüzden "haftalık" tam 5 iş günü değil;
  korunmuştur, hafta sonu satırlarının getirisi sonraki iş gününe bileşiklenir), maliyet %0.14/ciro. Tek düzeltme: motor
  nakdi satır başına 1/365 faizlendiriyordu → takvim günü farkıyla bileşiklendi (engine.stats ile OOS %2.29 → %2.44,
  IS 2022+ %5.25 → %5.40). Evren bugünkü BIST büyük hisselerinden oluşuyor (hayatta kalma yanlılığı, IS'i şişirebilir).
* **(c) KELLY**: lev_trend 'B' = `KELLY|ALL|L=252|f=0.25|Lmax=4`, USD teminat; günlük seri `lev_trend/grid.pkl`'den
  (vergi öncesi; arzsız OOS engine.stats ile %4.04, TOP3 ile aynı).
* **(d) MIX**: BIST+KELLY, ay sonunda hedefe dengelenir (maliyetli). Ağırlıklar yalnızca IS günlük getirileriyle
  (2022-01-03..2025-10-16): **ters-oynaklık w_BIST = 0.578 (MIX_IV)**, **IS max-Sharpe w_BIST = 0.45 (MIX_SH)**
  (21 noktalı ızgara; Sharpe 0.40–0.55 aralığında düz: 1.95–1.97 → komşular sağlam; `results/mix_weight_IS_grid.csv`).

### Zaman çizelgesi (hesap başı, gün sonu)
sub_start'tan önceki iş günü teminat ayrılır → first_trade'den önceki iş günü tahsis ödenir (lot × fiyat × 1.0014),
artan teminat serbest → çıkış günü satış geliri (× 0.9986) kola geri yatırılır.

### Teminat modları (varsayım ve test)
* **pledge** (fon/varlık teminatı): kol varlıkları satılmadan teminat. **PPF için gerçekçi** — Türkiye'de birçok aracı kurum
  para piyasası/PPF fon paylarını satmadan halka arz talebinde teminat olarak kabul ediyor. Hisse için **kurum-bağımlı/iyimser**
  (çoğu kurumda talep için hisse satılmalı; bazıları kesintili hisse teminatı alıyor), yurt dışı USD/kaldıraçlı kol için
  **gerçekçi değil**. Sadece tahsis tutarı first_trade-1'de koldan satılır.
* **sell** (sat-teminat): R tutarı talep başında koldan **satılır** (BIST %0.14, KELLY %0.15 = vadeli %0.05 + USD/TRY makas
  %0.10), PPF'ye geçer ve PPF teminat olur (faiz kazanır); tahsisten sonra artan kısım kola geri alınır (aynı maliyet).
  T+2 takas riski ihmal edildi (satış talep başından 1 gün önce kapanışta).
* **cash** (sadece MM, ipo raporu ile mutabakat): R nakit bloke, faiz kazanmaz.

### Vergi varsayımları (bireysel, Türkiye mukimi)
* BIST payları ve arz hisseleri alım-satım kazancı: stopaj %0 (GVK geçici 67, BIST'te işlem gören paylar). Beyan yok.
* PPF: `cash_rate_daily` = politika × 0.9 "net" (stopaj + fon gideri yaklaşık; 2025 sonrası PPF stopajı %15–17.5 ve
  yönetim ücreti düşülünce gerçek net ~politika × 0.80–0.85 olabilir → MM ağırlıklı satırlar hafif iyimser).
* KELLY kolu: **taban tau = %20**, her takvim yılı sonunda ve pencere sonunda kolun o yılki pozitif kârından (zarar mahsubu/
  devri yok → muhafazakâr). Gerekçe: VİOP endeks vadeli %0, VİOP döviz/altın vadeli %10 stopaj, yurt dışı vadeli/ETF kazancı
  yıllık beyanname %15–40 artan oranlı, kripto şu an vergisiz → karma oran. Duyarlılık: tau = %0 (lev_trend raporu gibi).
* Enflasyon/ÜFE endekslemesi ve kur farkı vergisi detayları modellenmedi.

### Hesaplar
k aile hesabı = k ayrı yetişkin (TCKN), her biri C/k ile aynı stratejiyi uygular ve her arza ayrı talep verir.
Tüm hesaplar özdeş olduğundan toplam getiri = C/k sermayeli tek hesabın getirisi. Her hesabın riskli kolu da ayrı
açılmalıdır (KELLY için hesap başı minimum büyüklük sorunu, yukarıda).

## Kombinasyon sayısı (çoklu test)
* Ana ızgara: 4 sermaye × 3 hesap sayısı × (MM 2 mod + BIST/KELLY/MIX_IV/MIX_SH × 2 mod = 10) = **120**.
* Referans arzsız kollar: 8. Duyarlılık: KELLY vergisi %0: 72; BIST dengeleme günü kaydırma (phase 1–4): 96.
  Karışım ağırlığı adayları (IS): 21 + ters-oynaklık. **Toplam 296 portföy simülasyonu (× IS/OOS) + 22 ağırlık adayı.**
* Yukarı akış: arz 48, lev_trend 2144, BIST ızgarası ~90 kombinasyon (kendi raporlarında).

## Sonuç tabloları (tümü; satır = kol|mod, sütun = sermaye/hesap sayısı; 'real' = uygulanabilirlik: evet* = KELLY küçük hesapta kontrat büyüklüğü nedeniyle sorunlu)

#### IS aylık geo % (sermaye/hesap sayısı)

| sleeve | mode | 100k/1 | 100k/2 | 100k/4 | 250k/1 | 250k/2 | 250k/4 | 500k/1 | 500k/2 | 500k/4 | 1000k/1 | 1000k/2 | 1000k/4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BIST | pledge | 6.27 | 6.8 | 6.97 | 5.87 | 6.14 | 6.6 | 5.73 | 5.87 | 6.14 | 5.65 | 5.73 | 5.87 |
| BIST | sell | 5.95 | 6.34 | 6.47 | 5.73 | 5.88 | 6.17 | 5.65 | 5.73 | 5.88 | 5.61 | 5.65 | 5.73 |
| KELLY | pledge | 7.98 | 8.51 | 8.74 | 7.6 | 7.86 | 8.31 | 7.45 | 7.6 | 7.86 | 7.38 | 7.45 | 7.6 |
| KELLY | sell | 7.22 | 7.67 | 7.97 | 7.27 | 7.23 | 7.44 | 7.28 | 7.27 | 7.23 | 7.29 | 7.28 | 7.27 |
| MIX_IV | pledge | 7.36 | 7.88 | 8.05 | 6.98 | 7.24 | 7.69 | 6.84 | 6.98 | 7.24 | 6.77 | 6.84 | 6.98 |
| MIX_IV | sell | 6.86 | 7.21 | 7.37 | 6.76 | 6.82 | 7.03 | 6.73 | 6.76 | 6.82 | 6.71 | 6.73 | 6.76 |
| MIX_SH | pledge | 7.59 | 8.11 | 8.29 | 7.21 | 7.47 | 7.91 | 7.07 | 7.21 | 7.47 | 7.0 | 7.07 | 7.21 |
| MIX_SH | sell | 7.03 | 7.39 | 7.57 | 6.97 | 7.01 | 7.2 | 6.95 | 6.97 | 7.01 | 6.93 | 6.95 | 6.97 |
| MM | cash | 3.03 | 3.75 | 4.3 | 2.47 | 2.86 | 3.49 | 2.25 | 2.47 | 2.86 | 2.13 | 2.25 | 2.47 |
| MM | pledge | 3.1 | 3.84 | 4.44 | 2.51 | 2.92 | 3.57 | 2.27 | 2.51 | 2.92 | 2.14 | 2.27 | 2.51 |

#### OOS aylık geo % (sermaye/hesap sayısı)

| sleeve | mode | 100k/1 | 100k/2 | 100k/4 | 250k/1 | 250k/2 | 250k/4 | 500k/1 | 500k/2 | 500k/4 | 1000k/1 | 1000k/2 | 1000k/4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BIST | pledge | 4.03 | 5.24 | 7.16 | 3.22 | 3.77 | 4.77 | 2.94 | 3.22 | 3.77 | 2.79 | 2.94 | 3.22 |
| BIST | sell | 4.25 | 5.64 | 7.82 | 3.32 | 3.95 | 5.11 | 2.99 | 3.32 | 3.95 | 2.82 | 2.99 | 3.32 |
| KELLY | pledge | 4.54 | 5.69 | 7.58 | 3.76 | 4.28 | 5.25 | 3.49 | 3.76 | 4.28 | 3.35 | 3.49 | 3.76 |
| KELLY | sell | 5.3 | 6.64 | 8.76 | 4.1 | 4.91 | 6.16 | 3.66 | 4.1 | 4.91 | 3.43 | 3.66 | 4.1 |
| MIX_IV | pledge | 4.39 | 5.57 | 7.47 | 3.6 | 4.13 | 5.12 | 3.32 | 3.6 | 4.13 | 3.18 | 3.32 | 3.6 |
| MIX_IV | sell | 4.84 | 6.22 | 8.35 | 3.8 | 4.5 | 5.7 | 3.43 | 3.8 | 4.5 | 3.23 | 3.43 | 3.8 |
| MIX_SH | pledge | 4.46 | 5.64 | 7.52 | 3.67 | 4.2 | 5.18 | 3.4 | 3.67 | 4.2 | 3.26 | 3.4 | 3.67 |
| MIX_SH | sell | 4.97 | 6.35 | 8.47 | 3.9 | 4.63 | 5.83 | 3.52 | 3.9 | 4.63 | 3.32 | 3.52 | 3.9 |
| MM | cash | 3.75 | 4.93 | 6.9 | 2.99 | 3.5 | 4.47 | 2.72 | 2.99 | 3.5 | 2.59 | 2.72 | 2.99 |
| MM | pledge | 3.99 | 5.31 | 7.4 | 3.09 | 3.7 | 4.8 | 2.78 | 3.09 | 3.7 | 2.61 | 2.78 | 3.09 |

#### OOS maxDD % (sermaye/hesap sayısı)

| sleeve | mode | 100k/1 | 100k/2 | 100k/4 | 250k/1 | 250k/2 | 250k/4 | 500k/1 | 500k/2 | 500k/4 | 1000k/1 | 1000k/2 | 1000k/4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BIST | pledge | -15.77 | -12.6 | -11.45 | -18.77 | -16.74 | -13.31 | -19.85 | -18.77 | -16.74 | -20.4 | -19.85 | -18.77 |
| BIST | sell | -13.51 | -10.41 | -9.76 | -17.81 | -14.89 | -10.63 | -19.36 | -17.81 | -14.89 | -20.16 | -19.36 | -17.81 |
| KELLY | pledge | -33.55 | -31.87 | -29.35 | -35.54 | -34.2 | -32.44 | -36.23 | -35.54 | -34.2 | -36.58 | -36.23 | -35.54 |
| KELLY | sell | -31.93 | -29.3 | -25.45 | -34.45 | -32.5 | -30.34 | -35.67 | -34.45 | -32.5 | -36.3 | -35.67 | -34.45 |
| MIX_IV | pledge | -19.09 | -17.05 | -14.36 | -20.54 | -19.56 | -17.79 | -21.06 | -20.54 | -19.56 | -21.33 | -21.06 | -20.54 |
| MIX_IV | sell | -17.24 | -14.5 | -10.43 | -19.36 | -17.83 | -15.56 | -20.45 | -19.36 | -17.83 | -21.02 | -20.45 | -19.36 |
| MIX_SH | pledge | -21.92 | -20.37 | -17.72 | -22.96 | -22.25 | -20.97 | -23.46 | -22.96 | -22.25 | -23.72 | -23.46 | -22.96 |
| MIX_SH | sell | -20.53 | -17.81 | -13.71 | -22.35 | -21.11 | -18.86 | -23.01 | -22.35 | -21.11 | -23.4 | -23.01 | -22.35 |
| MM | cash | -0.38 | -0.82 | -1.19 | -0.1 | -0.29 | -0.64 | -0.01 | -0.1 | -0.29 | 0.0 | -0.01 | -0.1 |
| MM | pledge | -0.37 | -0.8 | -1.11 | -0.1 | -0.28 | -0.64 | -0.01 | -0.1 | -0.28 | 0.0 | -0.01 | -0.1 |

#### OOS en kötü ay % (sermaye/hesap sayısı)

| sleeve | mode | 100k/1 | 100k/2 | 100k/4 | 250k/1 | 250k/2 | 250k/4 | 500k/1 | 500k/2 | 500k/4 | 1000k/1 | 1000k/2 | 1000k/4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BIST | pledge | -8.23 | -6.47 | -3.43 | -9.4 | -8.61 | -7.14 | -9.82 | -9.4 | -8.61 | -10.03 | -9.82 | -9.4 |
| BIST | sell | -6.85 | -3.85 | 0.83 | -8.84 | -7.5 | -5.01 | -9.53 | -8.84 | -7.5 | -9.89 | -9.53 | -8.84 |
| KELLY | pledge | -23.63 | -21.88 | -18.87 | -24.8 | -24.01 | -22.56 | -25.21 | -24.8 | -24.01 | -25.42 | -25.21 | -24.8 |
| KELLY | sell | -22.24 | -19.31 | -16.66 | -24.17 | -22.85 | -20.46 | -24.88 | -24.17 | -22.85 | -25.25 | -24.88 | -24.17 |
| MIX_IV | pledge | -14.74 | -12.99 | -9.97 | -15.91 | -15.12 | -13.67 | -16.32 | -15.91 | -15.12 | -16.53 | -16.32 | -15.91 |
| MIX_IV | sell | -13.35 | -10.4 | -6.07 | -15.32 | -13.99 | -11.55 | -16.02 | -15.32 | -13.99 | -16.38 | -16.02 | -15.32 |
| MIX_SH | pledge | -16.71 | -14.97 | -11.95 | -17.88 | -17.09 | -15.64 | -18.29 | -17.88 | -17.09 | -18.5 | -18.29 | -17.88 |
| MIX_SH | sell | -15.32 | -12.38 | -8.41 | -17.29 | -15.95 | -13.52 | -17.99 | -17.29 | -15.95 | -18.35 | -17.99 | -17.29 |
| MM | cash | 0.89 | 0.51 | 0.41 | 1.11 | 0.96 | 0.66 | 1.18 | 1.11 | 0.96 | 1.22 | 1.18 | 1.11 |
| MM | pledge | 1.26 | 1.26 | 1.25 | 1.26 | 1.26 | 1.26 | 1.26 | 1.26 | 1.26 | 1.26 | 1.26 | 1.26 |

#### IS maxDD % (sermaye/hesap sayısı)

| sleeve | mode | 100k/1 | 100k/2 | 100k/4 | 250k/1 | 250k/2 | 250k/4 | 500k/1 | 500k/2 | 500k/4 | 1000k/1 | 1000k/2 | 1000k/4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BIST | pledge | -37.9 | -35.79 | -29.65 | -39.6 | -38.43 | -36.55 | -40.26 | -39.6 | -38.43 | -40.61 | -40.26 | -39.6 |
| BIST | sell | -36.31 | -32.43 | -23.69 | -39.06 | -37.21 | -33.8 | -40.01 | -39.06 | -37.21 | -40.5 | -40.01 | -39.06 |
| KELLY | pledge | -35.81 | -35.77 | -35.7 | -35.84 | -35.82 | -35.79 | -35.85 | -35.84 | -35.82 | -35.86 | -35.85 | -35.84 |
| KELLY | sell | -35.51 | -35.32 | -34.99 | -35.72 | -35.58 | -35.36 | -35.8 | -35.72 | -35.58 | -35.83 | -35.8 | -35.72 |
| MIX_IV | pledge | -24.82 | -22.93 | -22.07 | -26.87 | -25.45 | -23.44 | -27.66 | -26.87 | -25.45 | -28.08 | -27.66 | -26.87 |
| MIX_IV | sell | -22.12 | -21.88 | -21.65 | -26.03 | -23.45 | -21.91 | -27.28 | -26.03 | -23.45 | -27.9 | -27.28 | -26.03 |
| MIX_SH | pledge | -25.24 | -25.22 | -25.15 | -25.27 | -25.25 | -25.22 | -25.28 | -25.27 | -25.25 | -25.28 | -25.28 | -25.27 |
| MIX_SH | sell | -25.07 | -24.93 | -24.68 | -25.2 | -25.11 | -24.97 | -25.24 | -25.2 | -25.11 | -25.26 | -25.24 | -25.2 |
| MM | cash | -0.61 | -0.97 | -1.81 | -0.28 | -0.51 | -0.85 | -0.14 | -0.28 | -0.51 | -0.06 | -0.14 | -0.28 |
| MM | pledge | -0.6 | -0.95 | -1.74 | -0.28 | -0.5 | -0.83 | -0.14 | -0.28 | -0.5 | -0.06 | -0.14 | -0.28 |

#### OOS ort. teminat payı % (özsermayeye) (sermaye/hesap sayısı)

| sleeve | mode | 100k/1 | 100k/2 | 100k/4 | 250k/1 | 250k/2 | 250k/4 | 500k/1 | 500k/2 | 500k/4 | 1000k/1 | 1000k/2 | 1000k/4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BIST | pledge | 9.84 | 16.93 | 25.09 | 4.07 | 7.96 | 14.28 | 2.06 | 4.07 | 7.96 | 1.04 | 2.06 | 4.07 |
| BIST | sell | 11.35 | 19.23 | 27.72 | 4.72 | 9.19 | 16.3 | 2.39 | 4.72 | 9.19 | 1.2 | 2.39 | 4.72 |
| KELLY | pledge | 9.82 | 16.73 | 24.27 | 4.05 | 7.94 | 14.09 | 2.05 | 4.05 | 7.94 | 1.03 | 2.05 | 4.05 |
| KELLY | sell | 10.73 | 18.01 | 25.85 | 4.56 | 8.75 | 15.2 | 2.33 | 4.56 | 8.75 | 1.18 | 2.33 | 4.56 |
| MIX_IV | pledge | 9.75 | 16.7 | 24.61 | 4.03 | 7.88 | 14.08 | 2.04 | 4.03 | 7.88 | 1.02 | 2.04 | 4.03 |
| MIX_IV | sell | 10.98 | 18.51 | 26.71 | 4.61 | 8.92 | 15.67 | 2.34 | 4.61 | 8.92 | 1.18 | 2.34 | 4.61 |
| MIX_SH | pledge | 9.75 | 16.67 | 24.49 | 4.03 | 7.88 | 14.06 | 2.04 | 4.03 | 7.88 | 1.02 | 2.04 | 4.03 |
| MIX_SH | sell | 10.9 | 18.36 | 26.46 | 4.59 | 8.87 | 15.53 | 2.34 | 4.59 | 8.87 | 1.18 | 2.34 | 4.59 |
| MM | cash | 10.7 | 18.65 | 27.01 | 4.42 | 8.65 | 15.69 | 2.23 | 4.42 | 8.65 | 1.12 | 2.23 | 4.42 |
| MM | pledge | 10.56 | 18.24 | 26.51 | 4.39 | 8.55 | 15.39 | 2.23 | 4.39 | 8.55 | 1.12 | 2.23 | 4.39 |

#### Hedefler (ana ızgara, 120 kombinasyon)

* OOS >= %10/ay: **0**; OOS >= %5.3/ay: **21**; IS ve OOS ikisi de >= %5.3: **18**

OOS >= %5.3 olanlar:

| index | sleeve | mode | cell | real | geo_IS | geo_OOS | maxdd_OOS | worst_m_OOS |
|---|---|---|---|---|---|---|---|---|
| 38 | KELLY | sell | 100k/4 | evet* | 7.97 | 8.76 | -25.45 | -16.66 |
| 86 | MIX_SH | sell | 100k/4 | evet* | 7.57 | 8.47 | -13.71 | -8.41 |
| 62 | MIX_IV | sell | 100k/4 | evet* | 7.37 | 8.35 | -10.43 | -6.07 |
| 14 | BIST | sell | 100k/4 | evet | 6.47 | 7.82 | -9.76 | 0.83 |
| 26 | KELLY | pledge | 100k/4 | hayır | 8.74 | 7.58 | -29.35 | -18.87 |
| 74 | MIX_SH | pledge | 100k/4 | hayır | 8.29 | 7.52 | -17.72 | -11.95 |
| 50 | MIX_IV | pledge | 100k/4 | hayır | 8.05 | 7.47 | -14.36 | -9.97 |
| 110 | MM | pledge | 100k/4 | evet | 4.44 | 7.4 | -1.11 | 1.25 |
| 2 | BIST | pledge | 100k/4 | kurum-bağımlı | 6.97 | 7.16 | -11.45 | -3.43 |
| 98 | MM | cash | 100k/4 | evet | 4.3 | 6.9 | -1.19 | 0.41 |
| 37 | KELLY | sell | 100k/2 | evet* | 7.67 | 6.64 | -29.3 | -19.31 |
| 85 | MIX_SH | sell | 100k/2 | evet* | 7.39 | 6.35 | -17.81 | -12.38 |
| 61 | MIX_IV | sell | 100k/2 | evet* | 7.21 | 6.22 | -14.5 | -10.4 |
| 41 | KELLY | sell | 250k/4 | evet* | 7.44 | 6.16 | -30.34 | -20.46 |
| 89 | MIX_SH | sell | 250k/4 | evet* | 7.2 | 5.83 | -18.86 | -13.52 |
| 65 | MIX_IV | sell | 250k/4 | evet* | 7.03 | 5.7 | -15.56 | -11.55 |
| 25 | KELLY | pledge | 100k/2 | hayır | 8.51 | 5.69 | -31.87 | -21.88 |
| 13 | BIST | sell | 100k/2 | evet | 6.34 | 5.64 | -10.41 | -3.85 |
| 73 | MIX_SH | pledge | 100k/2 | hayır | 8.11 | 5.64 | -20.37 | -14.97 |
| 49 | MIX_IV | pledge | 100k/2 | hayır | 7.88 | 5.57 | -17.05 | -12.99 |
| 109 | MM | pledge | 100k/2 | evet | 3.84 | 5.31 | -0.8 | 1.26 |

#### Varyant sıralaması: 12 sermaye/hesap hücresinin IS ortalaması (seçim kuralı, OOS'a bakılmadan)

| index | sleeve | mode | IS_mean | OOS_mean | OOS_dd_mean | real | IS_rank_all |
|---|---|---|---|---|---|---|---|
| 2 | KELLY | pledge | 7.86 | 4.43 | -34.27 | hayır | 1 |
| 6 | MIX_SH | pledge | 7.47 | 4.36 | -22.08 | hayır | 2 |
| 3 | KELLY | sell | 7.37 | 4.98 | -32.75 | evet* | 3 |
| 4 | MIX_IV | pledge | 7.24 | 4.29 | -19.37 | hayır | 4 |
| 7 | MIX_SH | sell | 7.08 | 4.74 | -20.8 | evet* | 5 |
| 5 | MIX_IV | sell | 6.88 | 4.63 | -17.78 | evet* | 6 |
| 0 | BIST | pledge | 6.14 | 3.92 | -16.92 | kurum-bağımlı | 7 |
| 1 | BIST | sell | 5.9 | 4.12 | -15.54 | evet | 8 |
| 9 | MM | pledge | 2.91 | 3.86 | -0.32 | evet | 9 |
| 8 | MM | cash | 2.86 | 3.67 | -0.33 | evet | 10 |

#### Arzsız kollar (referans)

| group | sleeve | tau | geo_IS | geo_OOS | maxdd_IS | maxdd_OOS | worst_m_OOS | m10_OOS | neg_m_OOS |
|---|---|---|---|---|---|---|---|---|---|
| noIPO | BIST | 0.2 | 5.57 | 2.65 | -40.98 | -20.97 | -10.24 | 2.0 | 4.0 |
| noIPO | KELLY | 0.2 | 7.3 | 3.2 | -35.86 | -36.93 | -25.63 | 6.0 | 6.0 |
| noIPO | MIX_IV | 0.2 | 6.69 | 3.04 | -28.52 | -21.6 | -16.75 | 4.0 | 6.0 |
| noIPO | MIX_SH | 0.2 | 6.92 | 3.11 | -25.29 | -23.99 | -18.72 | 5.0 | 6.0 |
| noIPO | MM | 0.2 | 2.01 | 2.45 | 0.0 | 0.0 | 1.26 | 0.0 | 0.0 |
| noIPO_tax0 | KELLY | 0.0 | 8.45 | 3.92 | -35.86 | -36.93 | -25.63 | 6.0 | 6.0 |
| noIPO_tax0 | MIX_IV | 0.0 | 7.19 | 3.39 | -24.85 | -21.6 | -16.75 | 5.0 | 6.0 |
| noIPO_tax0 | MIX_SH | 0.0 | 7.56 | 3.56 | -25.29 | -23.99 | -18.72 | 6.0 | 6.0 |

#### Arz katkısı OOS: kombine aylık geo − aynı kolun arzsız aylık geo (puan)

| sleeve | mode | 100k/1 | 100k/2 | 100k/4 | 250k/1 | 250k/2 | 250k/4 | 500k/1 | 500k/2 | 500k/4 | 1000k/1 | 1000k/2 | 1000k/4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BIST | pledge | 1.38 | 2.59 | 4.51 | 0.58 | 1.12 | 2.13 | 0.29 | 0.58 | 1.12 | 0.15 | 0.29 | 0.58 |
| BIST | sell | 1.61 | 3.0 | 5.18 | 0.68 | 1.31 | 2.46 | 0.34 | 0.68 | 1.31 | 0.17 | 0.34 | 0.68 |
| KELLY | pledge | 1.33 | 2.48 | 4.38 | 0.56 | 1.08 | 2.05 | 0.28 | 0.56 | 1.08 | 0.14 | 0.28 | 0.56 |
| KELLY | sell | 2.09 | 3.44 | 5.55 | 0.89 | 1.71 | 2.95 | 0.46 | 0.89 | 1.71 | 0.23 | 0.46 | 0.89 |
| MIX_IV | pledge | 1.35 | 2.54 | 4.43 | 0.56 | 1.1 | 2.08 | 0.29 | 0.56 | 1.1 | 0.14 | 0.29 | 0.56 |
| MIX_IV | sell | 1.8 | 3.18 | 5.31 | 0.76 | 1.47 | 2.66 | 0.39 | 0.76 | 1.47 | 0.2 | 0.39 | 0.76 |
| MIX_SH | pledge | 1.35 | 2.52 | 4.41 | 0.56 | 1.09 | 2.07 | 0.28 | 0.56 | 1.09 | 0.14 | 0.28 | 0.56 |
| MIX_SH | sell | 1.86 | 3.24 | 5.36 | 0.79 | 1.52 | 2.72 | 0.4 | 0.79 | 1.52 | 0.2 | 0.4 | 0.79 |
| MM | cash | 1.3 | 2.48 | 4.45 | 0.54 | 1.06 | 2.02 | 0.28 | 0.54 | 1.06 | 0.14 | 0.28 | 0.54 |
| MM | pledge | 1.54 | 2.86 | 4.96 | 0.65 | 1.25 | 2.35 | 0.33 | 0.65 | 1.25 | 0.17 | 0.33 | 0.65 |

#### Duyarlılık: KELLY vergisi %0 (OOS aylık geo %)

| sleeve | mode | 100k/1 | 100k/2 | 100k/4 | 250k/1 | 250k/2 | 250k/4 | 500k/1 | 500k/2 | 500k/4 | 1000k/1 | 1000k/2 | 1000k/4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KELLY | pledge | 5.18 | 6.28 | 8.09 | 4.45 | 4.94 | 5.86 | 4.19 | 4.45 | 4.94 | 4.06 | 4.19 | 4.45 |
| KELLY | sell | 6.06 | 7.37 | 9.41 | 4.84 | 5.67 | 6.9 | 4.39 | 4.84 | 5.67 | 4.16 | 4.39 | 4.84 |
| MIX_IV | pledge | 4.71 | 5.87 | 7.72 | 3.94 | 4.46 | 5.42 | 3.67 | 3.94 | 4.46 | 3.53 | 3.67 | 3.94 |
| MIX_IV | sell | 5.21 | 6.57 | 8.66 | 4.16 | 4.87 | 6.06 | 3.79 | 4.16 | 4.87 | 3.59 | 3.79 | 4.16 |
| MIX_SH | pledge | 4.86 | 6.01 | 7.84 | 4.1 | 4.61 | 5.56 | 3.83 | 4.1 | 4.61 | 3.7 | 3.83 | 4.1 |
| MIX_SH | sell | 5.44 | 6.79 | 8.87 | 4.36 | 5.09 | 6.29 | 3.97 | 4.36 | 5.09 | 3.77 | 3.97 | 4.36 |

IS aylık geo % (vergi %0):

| sleeve | mode | 100k/1 | 100k/2 | 100k/4 | 250k/1 | 250k/2 | 250k/4 | 500k/1 | 500k/2 | 500k/4 | 1000k/1 | 1000k/2 | 1000k/4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KELLY | pledge | 9.09 | 9.61 | 9.8 | 8.73 | 8.98 | 9.41 | 8.59 | 8.73 | 8.98 | 8.52 | 8.59 | 8.73 |
| KELLY | sell | 8.23 | 8.65 | 8.91 | 8.36 | 8.28 | 8.42 | 8.4 | 8.36 | 8.28 | 8.43 | 8.4 | 8.36 |
| MIX_IV | pledge | 7.85 | 8.36 | 8.52 | 7.48 | 7.73 | 8.17 | 7.34 | 7.48 | 7.73 | 7.27 | 7.34 | 7.48 |
| MIX_IV | sell | 7.31 | 7.65 | 7.79 | 7.24 | 7.29 | 7.47 | 7.22 | 7.24 | 7.29 | 7.2 | 7.22 | 7.24 |
| MIX_SH | pledge | 8.21 | 8.72 | 8.88 | 7.85 | 8.1 | 8.53 | 7.71 | 7.85 | 8.1 | 7.64 | 7.71 | 7.85 |
| MIX_SH | sell | 7.61 | 7.95 | 8.11 | 7.58 | 7.6 | 7.77 | 7.57 | 7.58 | 7.6 | 7.57 | 7.57 | 7.58 |

#### Duyarlılık: BIST haftalık dengeleme günü (phase 0 = kanonik), OOS / IS aylık geo %, 100k/1 ve 1M/1

| sleeve  | mode  | geo_IS 1000k/1 | geo_IS 100k/1 | geo_IS 100k/4 | geo_OOS 1000k/1 | geo_OOS 100k/1 | geo_OOS 100k/4 |
|---|---|---|---|---|---|---|---|
| BIST | pledge | 5.65 | 6.27 | 6.97 | 2.79 | 4.03 | 7.16 |
| BIST | sell | 5.61 | 5.95 | 6.47 | 2.82 | 4.25 | 7.82 |
| BIST_ph1 | pledge | 5.8 | 6.4 | 7.1 | 4.02 | 5.14 | 8.05 |
| BIST_ph1 | sell | 5.76 | 6.06 | 6.45 | 4.03 | 5.23 | 8.41 |
| BIST_ph2 | pledge | 6.08 | 6.65 | 7.31 | 4.28 | 5.37 | 8.21 |
| BIST_ph2 | sell | 6.05 | 6.4 | 6.88 | 4.25 | 5.16 | 7.61 |
| BIST_ph3 | pledge | 4.75 | 5.34 | 6.04 | 4.41 | 5.54 | 8.44 |
| BIST_ph3 | sell | 4.71 | 5.04 | 5.58 | 4.41 | 5.51 | 8.07 |
| BIST_ph4 | pledge | 5.39 | 6.05 | 6.79 | 5.15 | 6.23 | 9.07 |
| BIST_ph4 | sell | 5.35 | 5.73 | 6.32 | 5.13 | 6.04 | 8.55 |

### BIST dengeleme günü duyarlılığı (önemli)
Kanonik BIST kolu (phase 0) OOS'ta 5 olası hafta-içi dengeleme gününün **en kötüsü**: arzsız OOS aylık geo phase 0..4 =
%2.44 / 3.58 / 3.82 / 3.95 / 4.63 (IS: 5.40 / 5.55 / 5.84 / 4.52 / 5.14; engine.stats). Yani BIST kolunun OOS sonucu
±1 puan "hangi gün dengelediğin" gürültüsü taşır; IS'te en iyi gün (phase 2) seçilseydi OOS %3.82 olurdu. Raporlanan ana sonuçlar
kanonik (önceden sabitlenmiş) phase 0'dır, seçim yapılmadı.

## Aylık getiri profili (OOS, net TL %, seçili hücreler)

| ay | MM pledge 100k 4acc | MM pledge 1000k 1acc | BIST sell 100k 4acc | BIST sell 1000k 1acc | KELLY sell 100k 1acc | KELLY sell 100k 4acc | KELLY sell 1000k 1acc | MIX_SH sell 100k 4acc | MIX_SH sell 1000k 1acc | MIX_IV sell 1000k 1acc |
|---|---|---|---|---|---|---|---|---|---|---|
| 2025-10 | 1.25 | 1.26 | 0.83 | 1.36 | -6.7 | -7.15 | -6.32 | -3.56 | -2.87 | -1.89 |
| 2025-11 | 10.71 | 2.36 | 10.66 | 2.47 | 20.5 | 29.56 | 8.75 | 20.94 | 5.9 | 5.1 |
| 2025-12 | 3.56 | 2.7 | 10.88 | 8.42 | 8.84 | 8.04 | 10.76 | 9.26 | 9.68 | 9.38 |
| 2026-01 | 12.33 | 2.39 | 19.16 | 15.7 | 17.75 | 22.31 | 16.43 | 20.98 | 16.1 | 16.01 |
| 2026-02 | 13.92 | 2.23 | 22.76 | 15.85 | 18.14 | 23.15 | 16.54 | 22.97 | 16.23 | 16.14 |
| 2026-03 | 10.78 | 2.55 | 1.4 | -9.89 | -22.24 | -14.29 | -25.25 | -7.27 | -18.35 | -16.38 |
| 2026-04 | 2.98 | 2.39 | 6.82 | 6.55 | 38.2 | 35.95 | 39.43 | 22.91 | 24.62 | 20.41 |
| 2026-05 | 3.2 | 2.31 | 7.67 | 5.65 | 17.72 | 18.68 | 17.42 | 13.66 | 12.11 | 10.61 |
| 2026-06 | 2.74 | 2.55 | 1.66 | 0.21 | -16.82 | -16.66 | -16.99 | -8.41 | -9.26 | -7.06 |
| 2026-07 | 11.89 | 2.47 | 3.78 | -8.72 | -1.58 | 9.21 | -6.02 | 6.59 | -7.24 | -7.59 |
| 2026-08 | 10.6 | 2.47 | 6.93 | -0.58 | 21.11 | 23.5 | 20.11 | 15.76 | 10.78 | 8.13 |
| 2026-09 | 4.61 | 2.39 | 2.3 | -1.03 | -4.96 | -2.22 | -6.35 | -0.13 | -3.96 | -3.28 |
| 2026-10 | 1.27 | 1.27 | 1.27 | 1.27 | -8.49 | -8.03 | -8.79 | -4.35 | -4.91 | -3.64 |

OOS'ta arz akışı Kasım-2025, Ocak–Mart 2026, Temmuz–Ağustos 2026'da yoğunlaştı (MM-100k/4'te +%10–14 aylar);
Nisan–Haziran 2026 neredeyse arzsız. KELLY kolu -%25 (Mart 2026) ve -%17 (Haziran 2026) aylar yaşadı.

## Dosyalar
* `sleeves.py` — kol günlük getirileri (MM, BIST, KELLY, BIST phase 1–4) → `results/sleeves.pkl`
* `combo.py` — hesap bazında günlük simülasyon + tüm ızgara → `results/all_results.csv`, `results/series.pkl`,
  `results/daily_returns_{IS,OOS}.csv`, `results/monthly_returns_{IS,OOS}.csv` (ana ızgara + arzsız kollar, net TL),
  `results/mix_weight_IS_grid.csv`, `results/mix_weights.json`, `results/run_log.txt`
* `analyze.py` — tablolar → `results/tables.md`, `results/summary_wide.csv`, `results/variant_rank.csv`
* Çalıştırma: `python3 sleeves.py && python3 combo.py && python3 analyze.py` (~1 dk).
