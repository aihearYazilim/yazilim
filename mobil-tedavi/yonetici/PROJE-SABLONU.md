# Proje derinleştirme şablonu (finalist ajanları bunu izler)

Amaç: Yönetici raporunda seçilen finalisti, bir ekibin yarın sabah başlayabileceği kadar somut, **gerçekten yapılabilir** bir
proje planına dönüştürmek. Her iddia alan raporlarından, yönetici raporundan ya da doğrulanmış kaynaktan gelmeli;
emin olunmayan her şey "doğrulanmadı" diye işaretlenmeli. Uydurma yok. Telefon dışı donanım yok.

Dosya: `mobil-tedavi/yonetici/proje-N-<ad>.md` — Türkçe, 4000–7000 kelime, tablo ağırlıklı.

## Bölümler
0. **Tek sayfalık özet** — ne, kim için, hangi klinik sonlanım, neden telefonla olur, neden şimdi, 12 ayda nereye varır.
1. **Klinik hedef ve hasta** — hedef hastalık, dahil etme / hariç tutma ölçütleri, birincil ve ikincil sonlanımlar, "tedavi"
   iddiasının sınırı (ilacın yanında mı, yerine mi; hekim gözetimi gerekir mi), hasta sayısı (Türkiye / dünya, kaynaklı).
2. **Klinik protokol** — seans yapısı, doz (dakika × gün × hafta), ilerleme kuralları, durdurma/güvenlik kuralları,
   kontrendikasyonlar, hangi cihaz/protokolden türetildiği (RKÇ atfı), telefon sürümünün orijinalden sapmaları ve
   bu sapmaların etkiyi neden bozmayacağına dair gerekçe.
3. **Teknik mimari** — kullanılan sensör/çıkışlar; her ölçüm için algoritma (ör. MediaPipe Pose ile diz açısı; kamera-PPG
   sinyal işleme zinciri; IMU adım/duruş tespiti; mikrofon solunum hızı), beklenen doğruluk ve referans cihaza karşı
   doğrulama planı; iOS/Android API'leri ve kısıtları (arka plan çalışma, pil, kamera izinleri, cihaz çeşitliliği);
   cihaz içi ML vs sunucu; çevrimdışı çalışma; veri modeli. Bilinen teknik riskler ve ölçülebilir kabul ölçütleri
   (ör. "diz açısı hatası < 5° referansa göre, 20 telefon modelinde").
4. **Ürün ve kullanıcı akışı** — MVP ekran listesi, ilk kullanım (onboarding), günlük akış, geri bildirim tasarımı,
   uyum (adherence) mekanizmaları, erişilebilirlik, Türkçe/çok dil.
5. **Kanıt haritası ve klinik çalışma planı** — mevcut kanıt (cihaz/protokol düzeyinde ve uygulama düzeyinde),
   kanıt boşlukları, Faz A (teknik doğrulama, n, süre), Faz B (tek kollu pilot: n, sonlanım, süre), Faz C (RKÇ: tasarım,
   karşılaştırıcı, n için kaba güç hesabı, süre, maliyet tahmini), etik kurul yolu.
6. **Regülasyon ve veri** — SaMD sınıfı (TİTCK / CE-MDR / FDA) ve gerekçesi; "sağlıklı yaşam" vs "tıbbi iddia" stratejisi
   ve hangi noktada geçileceği; KVKK/GDPR, kamera/mikrofon verisinin cihazda kalması; IEC 62304/ISO 14971 asgari gerekler.
7. **"Zaten var mı?" doğrulaması** — rakip/benzer uygulamalar (alan raporlarındaki liste + kendi bilgin), tam olarak hangi
   farkla "mevcut değil" iddiası savunulabilir; ilk hafta yapılacak mağaza taraması listesi (arama terimleri).
8. **Riskler ve azaltma** — klinik, teknik, regülasyon, benimseme, ticari; her biri için azaltıcı eylem.
9. **Yol haritası ve ekip** — 0–3 / 3–6 / 6–12 ay kilometre taşları, go/no-go ölçütleri, ekip (rol × kişi), kaba bütçe.
10. **Açık sorular** — kullanıcının (proje sahibi) karar vermesi gereken noktalar.
11. **Kaynaklar** — URL listesi; doğrulanmamışlar işaretli.
