# Yol haritası

## Faz A — Teknik doğrulama (0–3 ay)
1. **Açı doğruluğu:** 20 gönüllü (10'u ≥60 yaş), 20 telefon modeli (≥4 düşük segment Android). Referans: kafa bandına sabit ikinci
   IMU ya da klinikteki VNG baş sensörü, statik pozlarda gonyometre. Kabul: statik medyan hata ≤5°, adım sonu 90. yüzdelik ≤10°,
   seans başına temas kaybı <1. Tutuş A (alında) ile tutuş B (şakakta) karşılaştırılır.
2. **Kullanılabilirlik:** ≥65 yaş 10 kişide yardımsız tamamlama ≥%80, SUS ≥70.
3. **Ses:** Türkçe TTS yerine stüdyo kaydı yönergeler (iOS sessiz anahtarda da çalan yerel ses kanalı).

## Faz B — Yerel uygulama (2–4 ay)
- Capacitor ile iOS/Android paketleme; çekirdek (`src/core`) aynen kalır. Kazanımlar: iOS titreşimi, sessiz modda ses,
  kilit ekranından hızlı açılış, yerel bildirimle 30 dk / sabah hatırlatması, yakınlık sensörüyle "telefon alında" doğrulaması.
- Cihaz içi şifreli depolama; kurumsal reçetede dijital imza.

## Faz C — Klinik pilot (4–9 ay)
- Tek merkez KBB/odyoloji, n=40, randomize 1:1, değerlendirici kör: uygulama rehberli ev Epley'i vs basılı broşür; birincil
  sonlanım 7. günde Dix-Hallpike negatifliği (ayrıntı: `../../aninda/proje-A-bppv-dengeyol.md` §5).
- Ardından çok merkezli RKÇ.

## Faz D — Düzenleyici
- SaMD sınıflandırması (MDR Kural 11 → büyük olasılıkla IIa), IEC 62304 yazılım yaşam döngüsü, ISO 14971 risk dosyası, klinik
  değerlendirme raporu, KVKK aydınlatma ve açık rıza metinleri.

## 2. faz özellikler
- Ön kamerayla nistagmus kaydı ve analizi (klinisyen modunda önce; VNG'ye karşı ≥100 hastada doğrulama şartı).
- Evde yatay kanal manevraları (klinik doğrulamadan sonra).
- İngilizce ve diğer diller (`protocols.ts` metinleri tek yerde).
