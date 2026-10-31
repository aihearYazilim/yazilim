# DengeYol

**BPPV (iyi huylu paroksismal pozisyonel vertigo) için telefon sensörlü manevra rehberi.**
Telefon alına yaslanır; ivmeölçer başın yerçekimine göre açısını ölçer. Uygulama her adımı sesli anlatır, baş doğru açıya
gelince haber verir, pozisyon bozulursa sayacı durdurur ve hangi yöne düzeltileceğini söyler. Ek donanım gerekmez.

İki kullanıcısı vardır:

| Mod | Kim için | Ne yapar |
|---|---|---|
| **Hasta** | Daha önce hekim/odyolog tanısı almış, BPPV atağı tekrarlayan yetişkin | Her seansta güvenlik soruları → telefonu başa tanıtma (kalibrasyon) → gerekirse iki yönlü kısa test ile taraf belirleme → açı ölçümlü Epley (reçeteyle Semont) → 1 saat sonra ve ertesi sabah tekrar testi → hekime götürülecek rapor |
| **Odyolog / hekim** | Klinikte BPPV muayenesi yapan | Telefon hastanın alnında, ekran klinisyene bakar: Dix-Hallpike ve supine roll testleri açı doğrulamalı, nistagmus başlangıç/bitiş işaretleme, Bárány 2015 ölçütlerine dayalı tanı önerisi, 6 manevra (Epley, Semont, BBQ roll, Gufoni geotropik/apogeotropik, Yacovino), tekrar test, **QR kodlu ev reçetesi**, yazdırılabilir rapor ve kısa HBYS notu. VNG/Frenzel ile çalışılıyorsa telefon alna konmaz, zamanlayıcı olarak kullanılır; bulgular forma yazılır |

> **Önemli:** Bu bir araştırma prototipidir; tıbbi cihaz onayı yoktur. Tanı koymaz, hekim muayenesinin yerine geçmez.
> Klinik kullanım öncesinde klinik doğrulama ve yasal uygunluk (TİTCK / MDR, SaMD) değerlendirmesi gerekir.

## Durum

| Alan | Durum |
|---|---|
| Klinik çekirdek (açı geometrisi, kalibrasyon, protokoller, yürütücü, tanı önerisi, güvenlik, reçete) | Tamam · 466 birim testi |
| Bağımsız klinik inceleme | Yapıldı, düzeltmeler uygulandı — [docs/KLINIK-INCELEME.md](docs/KLINIK-INCELEME.md) |
| Hasta modu ve odyolog modu arayüzü | Tamam |
| Uçtan uca testler (gerçek Chromium, telefon boyutu, sanal sensör) | 12/12 senaryo geçiyor |
| Gerçek telefonlarda açı doğruluğu ölçümü (Faz A) | **Yapılmadı** — [docs/YOL-HARITASI.md](docs/YOL-HARITASI.md) |
| Hasta ile klinik pilot | **Yapılmadı** |

## Belgeler

| Belge | İçerik |
|---|---|
| [docs/KULLANIM-KILAVUZU.md](docs/KULLANIM-KILAVUZU.md) | Hasta ve odyolog için adım adım kullanım |
| [docs/KLINIK-PROTOKOL.md](docs/KLINIK-PROTOKOL.md) | Açı tanımları, toleranslar, süreler, güvenlik kuralları ve gerekçeleri |
| [docs/PROTOKOL-TABLOSU.md](docs/PROTOKOL-TABLOSU.md) | Her manevranın her adımı (koddan otomatik üretilir) |
| [docs/KLINIK-INCELEME.md](docs/KLINIK-INCELEME.md) | Bağımsız klinik inceleme raporu (literatüre karşı doğrulama) |
| [docs/RISK-ANALIZI.md](docs/RISK-ANALIZI.md) | Tehlikeler, nedenler, azaltıcı önlemler, bilinen sınırlar |
| [docs/YOL-HARITASI.md](docs/YOL-HARITASI.md) | Saha doğrulaması, yerel uygulama sürümü, klinik pilot |

## Çalıştırma

Gereksinim: Node.js 20+.

```bash
cd mobil-tedavi/dengeyol/app
npm install
npm run dev          # geliştirme sunucusu
npm test             # birim testleri (vitest)
npm run build        # üretim derlemesi → dist/
npm run e2e          # uçtan uca testler (önce build; Playwright + Chromium gerekir)
npm run docs:protocols   # protokol tablosunu koddan yeniden üret
```

**Telefonda denemek:** Tarayıcılar hareket sensörünü yalnızca **HTTPS** üzerinden verir. `dist/` klasörünü herhangi bir
HTTPS statik barındırıcıya (GitHub Pages, Netlify, Cloudflare Pages vb.) yükleyin ve telefondan açın. Uygulama göreli yollarla
derlenir, alt klasörde de çalışır. "Ana ekrana ekle" ile kurulur ve çevrimdışı çalışır.

**Bilgisayarda denemek:** Ayarlar → Demo modu. Gerçek sensör yerine ekrandan kontrol edilen sanal bir baş kullanılır
("Hedef pozisyona git" ve ×5/×20 zaman hızlandırma). Ekranın üstünde kalıcı "DEMO MODU" şeridi görünür.

## Mimari

```
app/src/
  core/        Saf TypeScript; arayüzden bağımsız, tamamı birim testli
    geometry.ts      Baş koordinatları, θ/φ/ψ, vektör/matris
    calibration.ts   İşaret kuralı (iOS/Android), ekran içe/dışa, alın eğimi düzeltmesi (TRIAD)
    protocols.ts     8 protokol: adım hedefleri, toleranslar, süreler, metinler; sol taraf aynalama
    evaluator.ts     Anlık poz ↔ hedef karşılaştırma, düzeltme ipucu
    runner.ts        Manevra yürütücüsü (saf durum makinesi; zaman olaylarla gelir)
    diagnosis.ts     Odyolog modu tanı önerisi (Bárány 2015)
    safety.ts        Kırmızı bayraklar, kontrendikasyonlar, tanı kapısı, doz sınırları, hasta testi yorumu
    prescription.ts  Ev reçetesi bağlantısı (base64url + sağlama toplamı)
  platform/    Tarayıcı API sarmalayıcıları: DeviceMotion, konuşma (TTS), titreşim, ton, ekran açık tutma, demo sensörü
  state/       Yerel depo (localStorage), atak kuralları
  ui/          React ekranları ve tasarım sistemi
e2e/           Playwright uçtan uca senaryoları
```

**Gizlilik:** Hiçbir veri ağa gönderilmez; analitik yoktur. Sensör verisi kaydedilmez, yalnızca adım özetleri (süre, hedefte
kalma yüzdesi, ortalama açı hatası, belirti işaretleri) cihazda tutulur. Ayarlar'dan dışa aktarılabilir ya da silinebilir.
