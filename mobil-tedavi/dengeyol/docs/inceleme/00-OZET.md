# Tekrarlı bağımsız denetim: özet

Uygulama, her turda farklı uzmanlıktaki bağımsız ajanlarla üç tur denetlendi. Her turun bulguları doğrulanıp düzeltildi ve
bir sonraki tur hem düzeltmeleri hem yeni sorunları denetledi. Görev tanımı: [BRIEF.md](BRIEF.md).

| Tur | Denetçiler | Bulgu | Öne çıkanlar |
|---|---|---|---|
| 1 | Klinik-bilimsel, kod hata avcısı, akış/minimalizm, cihaz/sağlamlık, ilk kez kullanan hasta | 91 | Her atakta iki taraflı test ve alt tip soruları (Kim 2023); tavana bakışta baş yana yatınca ~11° sabit açı hatası; gösterge ve sayacın dokunma alanı arkasında kalması; telefonun alna 3–4 kez konması → tek hazırlık ve kesintisiz akış; bir hafta sonraki atağın eski atağa takılması |
| 2 | Kod (taze göz), klinik güvenlik, yaşlı hasta ve yakını (gerçek hız), klinisyen, tasarım/erişilebilirlik | 89 | Atak kapatıp açarak doz sınırının aşılması → 14 günlük tedavi dönemi; ilk tanıtmadan sonra akışın geri sarılması (iki ajan bağımsız buldu); tek taraflı roll kaydında yanlış Gufoni; alt tip sorusunun Kim 2023'e ters kurulması; zincirde telefon yerinin denetlenmemesi |
| 3 | Bütünsel kod/gerileme, klinik son onay, gerçek kullanıcı son simülasyonu | 17 + 14 | Uzun baş dönmesi yolunda nörolojik belirtinin acile gitmemesi; duraklatmanın baş dönmesi süresini şişirmesi; sensörsüz çıkmaz; süre sorusunda eşik (>3 dk); doz denetiminin testten önceye alınması. Son kullanıcı turu (kritik/yüksek yok): tek kaynaklı sesli sayım (10 s), kesilen cümleler, tüm tam ekranların çevrilmesi, tek kapatma düğmesi ve kapanış sonrası "Raporu hekime gönder", kontrendikasyonda açık "Hiçbiri" onayı |

Her turun raporları: [tur-1](tur-1/), [tur-2](tur-2/), [tur-3](tur-3/).

## Son durum
- 188 birim testi, 12/12 uçtan uca senaryo (gerçek Chromium, telefon boyutu, sanal sensör; hasta akışları tanıtmada dokunmadan).
- Klinik son onay: **Koşullu** — genel yayına değil; etik kurul ve TİTCK onayıyla, klinikte gözetimli bir pilota uygun.
  En büyük açık, belirtiye dayalı taraf testinin nistagmusla karşılaştırılmamış olmasıdır; pilotta (Aşama A, VNG/Frenzel
  eşliğinde) ölçülmelidir.
- Bütünsel kod denetimi: **Koşullu** — dokuz akışın hepsi uçtan uca geçti, gerileme bulunmadı; bildirilen üç sorun düzeltildi.
- Gerçek kullanıcı son simülasyonu: **Koşullu** — kritik/yüksek bulgu yok; 14 iyileştirmenin 13'ü uygulandı (rapora hasta kimliği
  eklenemedi: uygulama bilerek ad/kimlik tutmuyor; rapora yıl ve reçeteyi yazan klinik eklendi).
- Gerçek telefonlarda (özellikle iPhone ses davranışı, düşük segment Android sensörleri) doğrulama henüz yapılmadı.

## Pilot için önerilen koşullar (klinik onay raporundan)
- Dahil etme: hekim tanılı arka kanal BPPV nüksü, ≥18 yaş, kontrendikasyon yok.
- Aşama A (klinikte, gözetimli): taraf testinin nistagmusa göre duyarlılık/özgüllüğü, dokunuşla ölçülen sürenin doğruluğu,
  açı doğruluğu (VNG/Frenzel ve gözlemci karşılaştırması).
- Aşama B (evde): 1–3. gün telefon görüşmesi, 7. gün kontrolde Dix-Hallpike (Kim 2023 benzeri); yönlendirme nedenlerinin
  ve sıklığının kaydı (aşırı yönlendirme ölçümü); güvenlik sonlanımları (düşme, acil başvuru).
