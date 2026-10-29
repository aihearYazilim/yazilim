# Kullanıcı ajanları: sentez ve uygulama durumu

Altı kullanıcı tipi ajanı uygulamayı gerçek tarayıcıda (telefon görünümü, demo sensör) baştan sona kullanıp rapor yazdı:

| Kod | Kullanıcı | Rapor |
|---|---|---|
| 01 | Ayşe Hanım, 72, yalnız yaşayan hasta, Android | [01-yasli-hasta.md](01-yasli-hasta.md) |
| 02 | Mehmet Bey, 45, yılda 2–3 atak, sabırsız, iPhone | [02-tekrarlayan-hasta.md](02-tekrarlayan-hasta.md) |
| 03 | Zeynep, 38, annesine manevra yaptıran yakın | [03-hasta-yakini.md](03-hasta-yakini.md) |
| 04 | Odyolog Elif, yoğun hastane kliniği | [04-odyolog.md](04-odyolog.md) |
| 05 | Dr. Can, aile hekimi (5–7 dk muayene) | [05-hekim.md](05-hekim.md) |
| 06 | Hasan Bey, 64, ileri işitme kaybı, el titremesi | [06-isitme-erisilebilirlik.md](06-isitme-erisilebilirlik.md) |

## Birden çok ajanın bulduğu ortak sorunlar

1. **Gösterge sağ/solu fiziksel olarak tersti (03, 05).** Telefon alında ve ekran dışa dönükken ekrandaki "SAĞ" yazısı hastanın
   soluna düşüyordu. Ayrıca başucundaki kişi ekranı ters görüyordu.
2. **"Ekranın herhangi bir yerine dokunun" yazıyordu ama yalnız alttaki şerit çalışıyordu (01, 02, 03, 04, 06).** Ekranı
   göremeyen biri için tek kritik etkileşim buydu.
3. **Son güvenlik sorusunda güvenli yanıt tersine dönüyordu (01, 06).** Alışkanlıkla "Hayır"a basmak atağı hekime yönlendirip
   kilitliyordu.
4. **Düzeltme yönü hasta modunda yalnız sesle söyleniyordu (03, 06).** Yardımcı ve işitme kayıplı kullanıcı okuyamıyordu.
5. **Telefon iki kez alna konuyordu; ölçüm sesli yönerge bitmeden başlıyordu (01, 02).**
6. **İşitme kaybı maddesi kapıyı tamamen kapatıyordu (01, 06).**
7. **Klinisyen tarafında tanı riskleri (04, 05):** uyarı varken "tipik" etiketi, bulgu değişince eski tanı, varsayılan "Sağ",
   tanısız reçete, unutulan şiddet nedeniyle yanlış taraf.

## Uygulananlar

### Güvenlik ve doğruluk
- Gösterge karşıdan bakışa göre (ayna) çiziliyor; etiketler "HASTANIN SAĞI / SOLU". Açılar "sağa 45°" biçiminde, eksi açı yok.
  Başucunda duran için elle **⟲ Ekranı çevir** (ekran 180° döner, gösterge tepeden bakışa geçer; yönler fiziksel olarak doğru
  kalır). Otomatik döndürme yok (04).
- Her manevra başında dik duruş **ve** "tavana bak" ölçülüyor (02: yalnız dik duruş, içe takılan telefonu yakalamazdı).
- Güvenlik soruları: hepsinde güvenli yanıt "Hayır, yok"; son soru "önceki BPPV'den farklı mı?". Düğmeler her soruda 0,6 s
  kilitli. Durduran yanıtta onay ekranı ve "Yanlış dokundum". Sorular sesli okunuyor.
- Tanı: herhangi bir uyarı varsa hiçbir öneri "tipik" değil. Arka kanal kupulolitiazisinde uyarı eklendi. Onay düğmesi
  "Uyarıları okudum, yine de onayla". Uyarılar rapora ve muayene notuna yazılıyor. Bulgu değişince tanı geçersiz.
  Yatay nistagmusta şiddet zorunlu; şiddeti girilmemiş tarafta taraf seçilmiyor. Tedavide varsayılan taraf yok. Reçete yalnız
  geçerli, taraflı arka kanal tanısında açılıyor; uyarılı tanıda ek onay kutusu isteniyor.
- Terimler: kanalolitiazis / kupulolitiazis, Semont (serbestleştirici), null nokta, öne eğilme–geriye eğilme. Rapordaki maksimum
  hata yuvarlaması düzeltildi.

### Kolay ve pratik kullanım
- **Ekranın tamamı** baş dönmesi işaret alanı (düğmeler hariç), hasta ve klinisyen modunda.
- Baş dönmesi işaretliyken her 30 s'de "geçtiyse dokunun" hatırlatması (durdurma kuralı aynen).
- Düzeltme yönü ekranda büyük **ok + tek satır**. Söylenen her cümle **altyazı** olarak ekranda.
- Pozisyon bozulunca halkada "DURDU — düzeltin".
- Ritimle ayrılan titreşim/ton dili: hareket et, kal, bozuldu, bitti, dur, ayrıca baş dönmesi başladı/geçti ve duraklatma.
  Tonlar daha pes (≤ 1 kHz) ve daha yüksek. iOS'ta `audioSession = playback` ile sessiz anahtar sorunu azaltıldı.
- Hasta modunda **Duraklat** yazılı ve basılı tutmalı (kazara duraklatma yok). Duraklatınca ses, titreşim ve ton veriliyor.
  Diyalog açılınca odak "Devam et"te.
- Kayıtlı tanıtma varsa ayrı tanıtma ekranı atlanıyor; telefon yalnız manevra başında bir kez yerleştiriliyor.
  Ölçümler konuşma bitince başlıyor. Tanıtma girişinde "Sesi dene: beni duyuyor musunuz?". "Ekran dışa bakacak" yerine
  "telefonun arkasını alnınıza yaslayın, ekranı karşıya baksın".
- Hazır ekranı: **"Kim yapıyor? Kendim / Bir yakınımla"** ve yakın için 5 maddelik hazırlık kartı; **"Adımları önceden gör"**;
  sade dilli manevra özeti; titreşim yoksa çelişkili "telefon titreyecek" yazısı kaldırıldı.
- Kurulumun ilk ekranında yazı boyutu seçimi. İşitme maddesi "duyamıyorum, cihaz/kulaklıkla da duyamıyorum ve yardımcım yok"
  biçimine getirildi; diğer işitme kayıplılar için Bluetooth/kulaklık/yardımcı yönlendirmesi.
- **Takvime hatırlatıcı ekle (.ics)**: 30 dk ve sabah testi (sunucu ve bildirim izni gerekmez).
- "Atak geçti, kapat" için onay. Ana ekranda **ana ekrana ekleme rehberi** (iPhone'daki Safari/ana ekran veri ayrımı dahil),
  **reçete bağlantısını yapıştırma** alanı, `navigator.storage.persist()`.
- Yatay ekranda iki sütunlu düzen, Android'de dikey kilit denemesi. Yatak çizimi küçülmüyor.
- Kontrast: soluk yazı ve uyarı rengi koyulaştırıldı; koyu temada kırmızı/turuncu düğme yazısı koyu. Onay kutuları 24 px;
  "Düzenle" bağlantısı düğme oldu.

### Klinisyen pratikliği
- Altta sabit eylem çubuğu: "Pozisyon doğru (elle onay)" ve "Adımı bitir"; nistagmus bitişi işaretlenince
  **"Gözlemi bitir → sonraki adım"**.
- Profilde kalıcı **VNG/Frenzel (sensörsüz)** seçeneği.
- Hasta kodu araması; aynı kod yeni hasta açmıyor, muayene mevcut hastaya ekleniyor.
- Rapor: tam tarih (yıl), tanının kaynağı, uyarılar, reçete ayrıntısı, imza satırı. Yazdırırken düğme ve sekmeler basılmıyor.
  **"Muayene notunu kopyala (HBYS / e-Nabız)"** ICD-10 önerisiyle.
- Tanı ekranında "Bu öneri neye dayanır, neye dayanmaz?" kutusu ve sevk ölçütleri.
- Rol adı "Klinisyen (odyolog / hekim)"; reçete başlığı "Ev manevrası reçetesi".

## Bilerek uygulanmayanlar ya da sonraya kalanlar

| Öneri | Neden |
|---|---|
| Güvenlik sorularını 3 ekranda gruplama (02) | Tek tek sorma + sesli okuma + giriş kilidi + onay ekranı, yaşlı ve titreyen el için daha güvenli bulundu (01, 06). Gerçek kullanıcı testinden sonra yeniden değerlendirilecek. |
| Pozisyona girilir girilmez sayacın başlaması (02) | Yürütücünün durum makinesinde değişiklik; konuşma ile "tamam, kalın" sesinin çakışma riski. Gerçek cihaz ölçümünden sonra. |
| Adım adım resimli önizleme (06, 05) | Metinli önizleme eklendi; adım başına çizimler tasarım işi (L). |
| Duyma testi (sayı tanıma) (06) | Uyarlama yönlendirmesi eklendi; test için gerçek kullanıcı verisi gerekli. |
| Ton yüksekliği/pes ayarı (06) | Tonlar varsayılan olarak pes ve yüksek yapıldı; ayar ekranı sonraki sürüm. |
| Torsiyon yönü alanı, ayrıntılı bulgu (04) | Odyolog "zorunlu alanlarla doldurmayın" dedi; isteğe bağlı alan olarak sonraki sürüm. |
| Yardımcıya özel ekran metinleri (03) | Ses hastaya konuşur; ekranda kişiye göre ("hastanın sağı") yön ve ok gösteriliyor. Ayrı metin seti sonraki sürüm. |
| Aynı hastada kalibrasyonu muayeneler arasında saklama (05) | Yerleşim her takışta değişir; güvenli tarafta kalındı. |
| Ses tanıma ile "başladı/geçti" (03'ün "yapmayın" listesi) | Ağ gerektirir; yapılmadı. |

## Doğrulama
- 156 birim testi, 11/11 uçtan uca senaryo. Yeni senaryolar:
  - Hasta tarafı: yanlış dokunuş onayı, yardımcı kartı, ekranı çevirme, ekrana dokunarak işaretleme.
  - Klinisyen tarafı: tanısız reçete kilidi, aynı kodla ikinci hasta açılmaması.
- Gerçek telefonda ve gerçek kullanıcıyla deneme henüz yapılmadı. Özellikle iPhone ses davranışı ve yatay ekran gerçek cihazda
  doğrulanmalı.
