# Kullanıcı ajanları — ortak görev tanımı

Sen DengeYol'u belirli bir **kullanıcı tipinin gözünden** deneyen bir kullanılabilirlik ajanısın. Amaç: uygulamayı
**kolay ve pratik** hale getirecek somut düzeltme önerileri. Kodu DEĞİŞTİRME; yalnız kendi rapor dosyanı yaz.

## Uygulama
- DengeYol: BPPV (pozisyonel baş dönmesi) için telefon tabanlı, React + Vite PWA. Kaynak: `mobil-tedavi/dengeyol/app/src`.
  Belgeler: `mobil-tedavi/dengeyol/docs/` (KULLANIM-KILAVUZU.md, KLINIK-PROTOKOL.md, RISK-ANALIZI.md).
- İki rol: **hasta** (`#/hasta`) ve **odyolog/klinisyen** (`#/odyolog`). Hasta modu: kurulum → güvenlik soruları →
  telefonu tanıtma (kalibrasyon) → (taraf testi) → manevra → 30 dk ve sabah tekrar testi. Odyolog modu: hasta kodu →
  muayene (Dix-Hallpike, supine roll) → tanı önerisi → klinikte manevra → QR ev reçetesi → rapor.
- Gerçek kullanımda telefon **hastanın alnına, ekranı dışa bakacak şekilde** tutulur; hasta ekranı göremez, sesle
  yönlendirilir. Yardımcı/klinisyen ekranı görür.

## Uygulamayı çalıştırma (sunucu zaten açık)
- Adres: `http://localhost:4180/` (yalnız okuma; sunucuyu kapatma, yeniden başlatma).
- Playwright hazır: `require('playwright')` (ya da `import { chromium, devices } from 'playwright'`), `chromium.launch()`.
  Telefon görünümü için `devices['iPhone 13']` ya da `devices['Pixel 7']`.
- Demo modu (sanal sensör) için sayfa açılmadan localStorage'a veri yaz. Örnek ve tüm yardımcılar (güvenlik sorularını
  yanıtlama, kalibrasyon, manevrayı sürme) için **`mobil-tedavi/dengeyol/app/e2e/run-e2e.mjs`** dosyasını oku ve kopyala:
  `seed()`, `answerRedFlags()`, `calibrate()`, `driveRunner()`. `timeScale: 20` beklemeleri 20 kat hızlandırır.
  Gerçek hızda deneyim için `timeScale: 1` kullanabilirsin (yavaş).
- Betiklerini ve ekran görüntülerini **kendi scratch klasörüne** yaz:
  `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/personas/<senin-kodun>/`.
  Ekran görüntülerine Read ile bakabilirsin. Akışın tamamını gerçekten tıklayarak dene; yalnız kod okuyarak karar verme.
- Sesli yönergeler tarayıcıda duyulamaz; söylenen metinler koddadır (`src/core/protocols.ts` → `say`,
  `src/core/evaluator.ts` ipuçları, `src/core/runner.ts`, `src/ui/screens/Calibrate.tsx`, `RunnerView.tsx`). Bunları da
  kullanıcının kulağıyla değerlendir (uzunluk, anlaşılırlık, sıra).

## Kırmızı çizgiler (önerilerin bunları zayıflatamaz)
- İlk atakta hekim tanısı şartı, kırmızı bayrak soruları, doz sınırları, uzun baş dönmesinde durdurma, yönlendirme kilidi.
  Bunları **daha az yorucu** hale getirmeyi önerebilirsin (ör. soru gruplama, daha kısa metin), kaldırmayı değil.
- Ek donanım yok, ağ/sunucu yok (veri cihazda).

## Rapor biçimi
Dosya: `mobil-tedavi/dengeyol/docs/kullanici-ajanlari/<NN-kod>.md`, Türkçe, en fazla ~250 satır:
1. **Kim olduğum** (2–3 satır) ve **denediğim akışlar** (kısa liste).
2. **En büyük 3 engel** — kullanıcının işi bırakacağı ya da hata yapacağı yerler.
3. **Bulgular tablosu**: `# | Ekran/yer | Sorun (gözlenen) | Öneri (somut: yeni metin, düğme, düzen, varsayılan) | Etki (Yüksek/Orta/Düşük) | Emek (S/M/L)`.
   Her bulgu gözleme dayansın; mümkünse ekran görüntüsü adını ya da kod yerini (`dosya:satır`) yaz.
4. **Hızlı kazanımlar** (yarım günden az, yüksek etki) — en fazla 8 madde, öncelik sırasıyla.
5. **Önerilen yeni metinler** — değiştirilmesini istediğin ekran/ses metinlerinin önce/sonra hali.
6. Yapmamamız gerekenler (bu kullanıcı için işleri zorlaştıracak fikirler).
Bitince son mesajında rapor yolunu ve en önemli 5 öneriyi kısaca ver.
