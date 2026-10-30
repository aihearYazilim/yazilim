# Tekrarlı denetim — ortak görev tanımı

Sen DengeYol'u bağımsız denetleyen bir uzmansın. Hedef: uygulama **akışkan, bilimsel olarak doğru, minimalist, kolay
kullanılır ve gerçekten faydalı** olsun. Kodu DEĞİŞTİRME; yalnız kendi rapor dosyanı yaz. Bulguların doğrulanabilir olsun:
her bulguda gözlem (ekran görüntüsü adı, adım, ya da `dosya:satır`) ve somut düzeltme önerisi ver. Tahmin ettiğin ama
doğrulamadığın şeyleri "doğrulanmadı" diye işaretle. Övgü yazma; yalnız sorun ve öneri.

## Uygulama
- DengeYol: BPPV (pozisyonel baş dönmesi) için telefon tabanlı PWA (React + Vite). Kaynak: `mobil-tedavi/dengeyol/app/src`.
  Belgeler: `mobil-tedavi/dengeyol/docs/` (KULLANIM-KILAVUZU, KLINIK-PROTOKOL, KLINIK-INCELEME, RISK-ANALIZI, PROTOKOL-TABLOSU),
  önceki kullanıcı ajanı raporları ve sentezi: `docs/kullanici-ajanlari/` (oradaki sorunların çoğu düzeltildi; tekrar etme,
  düzeltmenin doğru olup olmadığını denetle).
- Roller: **hasta** (`#/hasta`) ve **klinisyen** (`#/odyolog`). Telefon hastanın alnına, ekranı dışa bakacak şekilde konur;
  hasta ekranı görmez, sesle yönlendirilir.
- Değişmez kırmızı çizgiler: ilk atakta hekim tanısı şartı, kırmızı bayrak soruları, doz sınırları, uzun baş dönmesinde
  durdurma, hekime yönlendirme kilidi, ek donanım yok, ağ/sunucu yok. Bunları zayıflatan öneri verme.

## Çalıştırma
- Sunucu açık: `http://localhost:4180/` (kapatma/yeniden başlatma).
- Playwright hazır (`require('playwright')`, `devices['iPhone 13']`, `devices['Pixel 7']`). Demo sensör için localStorage
  tohumlama ve yardımcılar: `mobil-tedavi/dengeyol/app/e2e/run-e2e.mjs` (`seed`, `answerRedFlags`, `calibrate`,
  `driveRunner`, `PATIENT_OK`). `timeScale: 20` beklemeleri hızlandırır.
- Betik/ekran görüntülerini şuraya yaz: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/inceleme/<tur>/<kodun>/`.
- Birim testleri: `cd mobil-tedavi/dengeyol/app && npx vitest run`.

## Rapor
Dosya: `mobil-tedavi/dengeyol/docs/inceleme/<tur>/<kod>.md`, Türkçe, en fazla ~150 satır:
1. Kapsam (ne denetledin, nasıl) — 3–5 satır.
2. Bulgular tablosu: `# | Önem (Kritik/Yüksek/Orta/Düşük) | Yer | Sorun (gözlem) | Öneri (somut) | Doğrulandı mı`.
   Kritik = hastaya zarar ya da yanlış tedavi/tanı riski veya akışı kıran hata.
3. Kaldırılabilecekler (minimalizm: gereksiz ekran, metin, düğme, ayar).
4. En önemli 5 madde.
Bitince son mesajında rapor yolunu ve en önemli 5 maddeyi ver.

## 2. tur notu
1. turun raporları `docs/inceleme/tur-1/` altında; bulguların neredeyse tamamı uygulandı (commit geçmişi:
`git -C /home/user/yazilim log --oneline -8`). Bu turda: (a) 1. tur düzeltmelerinin gerçekten doğru ve yan etkisiz olduğunu
doğrula, (b) özellikle yeni eklenen akışı denetle: soru → taraf sorusu → **Hazırlık** ekranı → (ilk kez) tanıtma → testler ve
manevra **telefon alında kesintisiz** (kendiliğinden başlama, zincir, tek dokunuş geçiş ekranları), (c) yeni sorunları bul.
Raporun 2. bölümüne "1. tur düzeltmesi doğrulandı / hatalı" satırlarını da ekle. Raporu `docs/inceleme/tur-2/<kod>.md` yaz.

## 3. tur notu (son kontrol)
1. ve 2. tur raporları `docs/inceleme/tur-1/` ve `tur-2/` altında; bulguların neredeyse tamamı uygulandı
(`git -C /home/user/yazilim log --oneline -12`). Bu son turda amaç **yayına hazır mı?** sorusunu yanıtlamak: kalan
Kritik/Yüksek sorunları bul, önceki düzeltmelerin birbirini bozmadığını (gerileme) doğrula, uygulama gerçekten akışkan,
bilimsel, minimalist, kolay ve faydalı mı? Raporu `docs/inceleme/tur-3/<kod>.md` yaz; sonuna "Yayına hazır mı: Evet /
Koşullu / Hayır" ve gerekçesini ekle. Sunucu `http://localhost:4180/` güncel HEAD derlemesini sunar.
