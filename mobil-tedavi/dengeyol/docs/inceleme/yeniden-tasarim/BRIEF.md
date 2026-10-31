# Yeniden tasarım — kısıtlar kalkar, akış sezgisel olur

Proje sahibinin kararı (klinik araştırma yapılacak): uygulama **hiçbir yerde kullanıcıyı kilitlemez**. Tanısı olmayan da
kullanır. Bütün engeller, **"Yine de devam et"** ile aşılabilen açık uyarılara dönüşür ve her aşma araştırma kaydı olarak
atağa yazılır (`Episode.overrides`, `src/state/types.ts`). Kullanım **akışkan ve sezgisel** olmalı: ekran ve dokunuş sayısı
azalır, her ekran tek bir iş yapar, metin kısa ve gündelik dilde olur.

## 1. Kısıtların kaldırılması (hepsi uyarı + "Yine de devam et" + kayıt)
| Bugünkü engel | Yeni davranış | `overrides.kind` |
|---|---|---|
| İlk atakta hekim tanısı şartı (diagnosisGate NO_DIAGNOSIS) | Yok. Tanısız kişi doğrudan iki taraflı teste, sonra manevraya geçer. Tanı bilgisi isteğe bağlı | `NO_DIAGNOSIS` (yalnız bilgi kaydı; uyarı ekranı yok ya da tek satır) |
| Yatay kanal / bilinmeyen kanal kapısı | Uyarı + devam | `GATE_<neden>` |
| Kontrendikasyon kapısı | Uyarı (madde adıyla) + "Yine de devam et" | `CONTRAINDICATION` |
| Kırmızı bayrak durdurması (acil ve hekime) | Uyarı ekranı 112/hekim bilgisini gösterir; altında "Yine de devam et" | `RED_FLAG` |
| Hekime yönlendirme kilidi (ana ekran, yeni atak) | Kilit yok; ana ekranda bilgi satırı + normal başlat | `REFERRAL` |
| Doz/gün sınırı | Uyarı + devam | `DOSE` |
| Taraf çelişkisi (SIDE_CONFLICT) yönlendirmesi | Uyarı + "Test tarafına devam" / "Hekimin dediği tarafa devam" | `SIDE_CONFLICT` |
| Alt tip ile yatay kanal / uzun süre yönlendirmesi | Uyarı + devam | `SUBTYPE` |
| İki taraf da pozitif / test tetiklemedi / atipik süre (REFER kararları) | Uyarı + kullanıcı taraf seçip devam edebilir | `REFER_<neden>` |
| Yürütücüde 120 s uzun baş dönmesi durdurması | Uyarı (ses + ekran): "Devam et" / "Durdur" | `VERTIGO_TOO_LONG` |
| Yürütücüde 60 s pozisyona gelinemedi durdurması | Uyarı: "Devam et" / "Durdur" | `POSITION_UNREACHABLE` |
| Klinisyende reçete kilidi (tanı onaysız, kupulolitiazis, çok kanal) | Uyarı + "Yine de reçete yaz" (gerekçe metni reçete notuna) | `RX_<neden>` (muayene notuna) |

Güvenlik bilgisi kaybolmaz: 112/hekim cümleleri, uyarıların gerekçesi ve raporda "araştırma kaydı" bölümü kalır.

## 2. Akış (hasta)
Hedef: ana ekrandan manevraya en az dokunuş, en kısa süre; hiçbir ekranda ne yapacağını düşünmek gerekmesin.
- **Kurulum tek ekran:** onay kutusu + "Başla". Tanı, kanal, taraf, kontrendikasyon, konuşma hızı ayarları isteğe bağlı ve
  sonradan Ayarlar'da. Reçete QR ile gelen için reçete bilgisi kendiliğinden dolar.
- **Ana ekran:** tek büyük düğme ("Başım dönüyor"). Altında yalnız gerekli olan tek satır durum (ör. "1 saat sonra tekrar testi").
- **Güvenlik soruları tek ekran:** bütün belirtiler tek listede, büyük "Hiçbiri yok, devam" düğmesi; işaretlenen varsa uyarı
  ekranı (+ "Yine de devam et"). Sesli okuma kısa.
- **Alt tip soruları:** en çok tek ekran, varsayılanı arka kanal; ya da test sonucuna bırakılır.
- **Hazırlık + tanıtma + iki taraf testi + manevra:** telefon alında kesintisiz; ara ekranlar kendiliğinden geçer.
- **Sonrası:** tek soru, tek ekran.
Sesli yönlendirme, titreşim, yardımcı modu, rapor, QR aktarım, klinisyen modu korunur.

## 3. Kabul
- Tanısız yeni kullanıcı kurulumdan manevraya kilitlenmeden ulaşır.
- Hiçbir ekranda "yalnız geri dön" seçeneği kalmaz; her uyarının "Yine de devam et"i vardır ve kayda geçer.
- Birim testleri ve uçtan uca senaryolar yeni davranışa göre güncellenir ve geçer.
