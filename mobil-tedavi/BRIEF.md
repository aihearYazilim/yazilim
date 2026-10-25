# BRIEF — Cep Telefonuyla Tedavi Projesi (tüm ajanlar bunu okur)

## Amaç
Bugün bir **tıbbi cihazla** tedavi edilebilen hastalıkları, **ek hiçbir donanım olmadan**, yalnızca sıradan bir akıllı telefonun
sensörleri ve çıkış birimleriyle (ekran, hoparlör, titreşim motoru, kamera, flaş, mikrofon, IMU...) çalışan **bir mobil yazılımla**
tedavi etmenin mümkün olup olmadığını alan alan araştırmak; **henüz var olmayan**, teknik olarak **gerçekten yapılabilir** ve
**en çok insana** fayda sağlayacak proje fikirlerini çıkarmak.

Kesin kurallar:
1. **Ek donanım yok.** Kulaklık, bileklik, VR gözlüğü, saat, yama, kablo, aksesuar yok. Telefon tek başına çalışmalı.
   (Kulaklık yalnızca "isteğe bağlı iyileştirme" olarak not edilebilir; çekirdek etki telefon hoparlörüyle sağlanmalı.)
2. **Tedavi** hedeflenir; yalnızca "ölçme/izleme/teşhis" uygulamaları ana hedef değildir. İzleme ancak kapalı döngü bir
   tedavinin parçasıysa (ölç → müdahale et) sayılır.
3. **Mevcut olmayan** bir yazılım olmalı. App Store / Google Play'de ya da FDA/CE onaylı dijital terapötikler arasında zaten
   aynı işi yapan bir ürün varsa bunu açıkça yaz ve o fikri "zaten var" diye işaretle; farkı yoksa önerme.
4. **Dürüstlük.** Kanıt uydurma. Çalışma, cihaz veya uygulama adı veriyorsan gerçek olmalı; emin değilsen "doğrulanmadı" yaz.
   Fizik olarak telefonun yapamayacağı şeyi (ör. terapötik dozda UV, ultrason, TENS akımı, 1000 lux ışık tedavisi) yapabilir
   gibi gösterme; sınırı sayıyla belirt.
5. Dil: **Türkçe.** Tıbbi terimlerin yanına kısa açıklama ekle.

## Telefonun eline ne var? (envanter — buna sadık kal)
| Birim | Yapabildiği | Fiziksel sınır |
|---|---|---|
| Ekran | Renk, parlaklık, desen, 60–120 Hz titreşim/flicker, görsel egzersiz, dikroptik (iki göz ayrı) **yalnızca** tek ekranda zaman/konum bölerek | Parlaklık tipik 500–1500 nit; terapötik ışık kutusunun 10.000 lux değerini göz hizasında ancak çok yakından ve kısmen verir |
| Hoparlör | 20 Hz–20 kHz ses, pembe/beyaz gürültü, binaural vuru (kulaklıksız zayıf), ritmik işitsel uyarı, ses terapisi, konuşma geri bildirimi | Düşük frekans (<100 Hz) çok zayıf; bas ve yüksek SPL yok |
| Titreşim motoru (LRA/ERM) | ~80–300 Hz haptik, ritmik dokunsal uyarı, elde/cepte/ciltte temas | Genlik düşük; derin doku uyarımı yok |
| Kamera (ön/arka) + flaş | PPG (parmak nabzı, HRV), yüz PPG, cilt görüntüsü, pupil, göz hareketi, hareket analizi, pozlama, yara/egzama takibi, yürüyüş/duruş videosu | Flaş ışığı zayıf, UV yok, kızılötesi yok |
| Mikrofon | Nefes, öksürük, horlama, konuşma, ses titremesi, kekemelik, ağlama analizi | Ortam gürültüsüne duyarlı |
| IMU (ivmeölçer, jiroskop, manyetometre) | Tremor, yürüyüş, denge, duruş, uyku hareketi, egzersiz sayımı, nöbet hareketi | Telefon vücutta sabit değil |
| GPS, barometre, ortam ışığı, yakınlık | Konum, kat/yükseklik, ışık maruziyeti, yüze yakınlık | — |
| Dokunmatik ekran | İnce motor beceri, reaksiyon süresi, bilişsel görevler, yazma analizi | Basınç ölçümü çoğu telefonda yok |
| İşlemci + bildirim + yapay zekâ | Kapalı döngü (ölç→müdahale), davranışsal terapi, kişiselleştirme, zamanlama, "tam zamanında" müdahale | — |

## Tedavi cihazı → telefon eşleme mantığı
Her cihaz için **hangi fiziksel/psikolojik mekanizmayla** etki ettiğini yaz, sonra telefonun bu mekanizmayı
(a) **birebir**, (b) **zayıflatılmış ama anlamlı**, (c) **hiç** üretip üretemeyeceğini belirt. Tipik mekanizmalar:
ışık/görsel uyarı · ses/işitsel uyarı · titreşim/haptik · ritmik duyusal uyarım (nöromodülasyon) · biofeedback (ölç ve
göster) · davranışsal/bilişsel terapi (dijital terapötik) · motor öğrenme/egzersiz yönlendirme · solunum eğitimi ·
vestibüler/okülomotor egzersiz · zamanlı uyandırma/uyku manipülasyonu · maruz bırakma (exposure) terapisi.
Elektrik akımı, ultrason, manyetik alan, UV, ısı, basınç, ilaç salımı → telefon **yapamaz**; bunları "mümkün değil" diye kısa geç.

## Her ajanın çıktı şablonu (`mobil-tedavi/alanlar/NN-alan-adi.md`)
```
# <Alan adı> — Cihazla tedavi edilen hastalıklar ve telefonla tedavi fikirleri

## 1. Alanda cihazla tedavi edilen hastalıklar (envanter)
Tablo: Hastalık | Kullanılan cihaz | Etki mekanizması | Telefon bu mekanizmayı üretebilir mi? (birebir / zayıf / hayır) | Not

## 2. Proje fikirleri (telefon tek başına)
Her fikir için:
### Fikir N: <ad>
- Hedef hastalık ve hasta sayısı (Türkiye + dünya, kaba tahmin, kaynaklı)
- Taklit edilen cihaz ve mekanizma
- Telefonda nasıl çalışır (hangi sensör/çıkış, hangi protokol, günde kaç dakika, kaç hafta)
- Kanıt: cihaz için kanıt düzeyi + telefon/uygulama tabanlı versiyon için mevcut kanıt (gerçek çalışma adı/yıl; yoksa "yok")
- Mevcut uygulamalar: aynı işi yapan var mı? (ad ver) Fark ne?
- Teknik zorluklar ve çözüm önerisi
- Regülasyon: SaMD sınıfı tahmini (Türkiye TİTCK / FDA / CE-MDR), klinik çalışma gerekir mi
- Riskler / kontrendikasyonlar (ör. fotosensitif epilepsi)
- Puanlama (0–10): Teknik yapılabilirlik | Kanıt gücü | Etki (hasta sayısı × fayda) | Yenilik (mevcut yok) | Düşük risk | TOPLAM/50

## 3. Alanın en iyi 3 fikri (sıralı) ve gerekçe
## 4. "Yapılamaz" diye elenenler (bir satır gerekçe)
## 5. Kaynaklar (URL)
```

## Araştırma yöntemi
- Önce alandaki cihazların tam listesini çıkar (FDA/CE onaylı, klinikte kullanılan, evde kullanılan, dijital terapötik).
- Her cihaz için mekanizmaya in; "telefonla olur mu" sorusunu fizik ve klinik kanıtla cevapla.
- Web araması yapabiliyorsan (ToolSearch ile `WebSearch` yükle) mevcut uygulamaları ve klinik çalışmaları doğrula.
- Uzunluk: 1500–4000 kelime. Tablo ve kısa cümle; süslü anlatım yok.
