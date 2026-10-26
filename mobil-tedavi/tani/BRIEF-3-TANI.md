# BRIEF-3 — Aile hekimi için TANI uygulaması fikirleri (tüm branş ajanları bunu okur)

## Amaç
Türkiye'de bir **aile hekiminin** (Aile Sağlığı Merkezi, ~10 dakikalık muayene, günde 60–100 hasta, yanında uzman yok,
görüntüleme/laboratuvar çoğunlukla dışarıda) **kendi cep telefonuyla, ek hiçbir donanım olmadan** muayene sırasında
kullanabileceği, **tanı koymasına ya da doğru sevk/tedavi kararı vermesine yardım eden**, henüz var olmayan mobil yazılım
fikirlerini her branş için bulmak.

## Kesin kurallar
1. **Ek donanım yok.** Telefona takılan dermatoskop, otoskop, lens, stetoskop başlığı, ECG elektrodu, prob, kağıt huni,
   test şeridi okuyucu düzeneği yok. Telefon tek başına (kamera, flaş, mikrofon, hoparlör, IMU, ekran, dokunmatik, işlemci).
   Hekimin normal muayenesi (eli, gözü, sorusu) ve ASM'de zaten bulunan rutin araçlar (tansiyon aleti, glukometre, tartı,
   mezura) elbette var; ama **uygulamanın ölçtüğü şey telefondan gelmeli.** Uygulamaya elle sayı girmek (ör. tansiyon)
   serbest; o sayıları başka bir cihaz üretmişse bu "telefonla ölçüm" sayılmaz, karar desteği sayılır.
2. **Kullanıcı hekimdir, hasta değil.** Hasta karşısında, muayene sırasında ≤2–3 dakikada sonuç vermeli.
3. **Tanı / triyaj / sevk kararı** hedeflenir: "bu hastayı bugün acile mi, 2 hafta içinde uzmana mı, yoksa ben mi
   izleyeyim?" sorusuna sensör verisiyle cevap. Salt eğitim, salt anket/skor hesaplayıcı (MDCalc tipi — zaten var),
   salt kayıt uygulamaları ana hedef değildir; anket + sensör birleşimi olabilir.
4. **Mevcut olmayan** bir yazılım olmalı. Aynı işi yapan ürün varsa (ör. FibriCheck kamera-PPG AF taraması CE'li;
   Peek Acuity görme keskinliği; hearWHO işitme; CRADLE/White Eye Detector beyaz pupil; SkinVision lezyon; Sway Medical
   IMU denge; ResApp öksürük; Healthy.io idrar şeridi — şerit okuyucu kutu gerektirir) adıyla yaz, "zaten var" de;
   farkı yoksa önerme. "Araştırma düzeyinde var, ürün yok" ayrı bir kategori — belirt.
5. **Dürüstlük.** Doğruluk (duyarlılık/özgüllük) rakamları gerçek çalışmadan gelmeli; yoksa "kanıt yok" yaz. Telefonun
   yapamadığını (SpO2 güvenilir değil, tansiyon PPG ile güvenilir değil, glukoz imkânsız, otoskopi lenssiz imkânsız,
   fundus imkânsız, oskültasyon mikrofonla stetoskop düzeyinde değil — sınırını yaz) açıkça söyle.
6. Dil: Türkçe; tıbbi terimlerin yanına kısa açıklama.

## Telefonun tanıda yapabildikleri (envanter)
| Birim | Tanısal kullanım | Sınır |
|---|---|---|
| Arka kamera + flaş | Cilt/tırnak/saçlı deri/yara/döküntü fotoğrafı ve AI sınıflandırma; sklera/konjonktiva/tırnak yatağı rengi (sarılık, anemi, siyanoz); boğaz/bademcik/dil/diş fotoğrafı; göz ön segment (kızarıklık, pupil, katarakt refleksi, şaşılık kapama testi, kırmızı refle); yürüyüş/duruş/skolyoz/eklem hareket açıklığı/el şişliği videosu; kapiller dolum; ödem; tremor videosu; yüz asimetrisi (fasiyal paralizi, inme); solunum sayısı (göğüs videosu) | Lens yok → otoskopi, fundus, dermatoskopi büyütmesi yok (bazı telefonlarda makro kamera var — belirt); renk kalibrasyonu ortam ışığına bağlı; SpO2/tansiyon güvenilir değil |
| Ön kamera | Göz hareketi, nistagmus, pupil, göz kırpma, yüz ifadesi, bakış takibi (otizm taraması araştırmaları), ekran testlerinde mesafe ölçümü | Çözünürlük/kare hızı sınırlı; torsiyonel nistagmus ölçülemez |
| Kamera-PPG (parmak + flaş) | Nabız, ritim düzensizliği (AF taraması — zaten var), ortostatik nabız testi (POTS/ortostatik hipotansiyon tarama), HRV, solunum hızı | SVT/flutter/VT ayrımı güvenilir değil; tansiyon ve SpO2 yok |
| Mikrofon | Öksürük sesi sınıflandırma (kuru/yaş, krup, boğmaca, TB/KOAH araştırma), hırıltı/stridor, horlama, ses/konuşma (disfoni, dizartri, afazi, Parkinson hipofonisi, depresyon ses biyobelirteçleri), idrar akımı sesi (ses-üroflovmetri), göğse dayalı telefonla kalp/akciğer sesi (araştırma; stetoskop düzeyinde değil), hırıltılı solunum, işitme taraması (hoparlörle) | Ortam gürültüsü; standardizasyon; kalp sesi düşük frekansta zayıf |
| Hoparlör | İşitme taraması (saf ses/konuşma-gürültü — hearWHO var), vestibüler/kalorik yok | Kalibrasyon cihaza bağlı |
| IMU | Tremor frekans/genlik, yürüyüş hızı/asimetri, denge/Romberg/TUG, skolyometre (telefon sırta konur — var), eklem açısı (gonyometre — var), parmak vuruşu bradikinezi, baş hareketi (HINTS'in baş itme testi?), nöbet hareketi | Telefon vücuda sabit değil |
| Haptik motor | Periferik nöropati titreşim duyusu taraması (128 Hz diyapazon yerine — araştırma var) | Genlik kalibrasyonu cihaza bağlı |
| Ekran + dokunmatik | Görme keskinliği, renk görme, Amsler, kontrast, şaşılık; bilişsel testler (MoCA/saat çizme/iz sürme), ince motor (Parkinson spiral), reaksiyon süresi, çocuk gelişim/otizm görsel tarama | Parlaklık/mesafe kalibrasyonu |
| İşlemci + AI | Çok sensörlü karar desteği (anket + görüntü + ses), kılavuz tabanlı sevk önerisi, risk puanı | Türkçe veri seti azlığı; regülasyon |

## Her ajanın çıktı şablonu (`mobil-tedavi/tani/alanlar/NN-alan-adi.md`)
```
# <Alan> — Aile hekimi için telefonla tanı/triyaj fikirleri

## 1. Aile hekiminin bu alanda en sık karşılaştığı tanı/sevk kararları (envanter)
Tablo: Durum | ASM'de sıklık (kaynaklı, kaba) | Bugün nasıl karar veriyor | Hangi hata/eksik yaygın (geç tanı, gereksiz sevk...) | Telefon sensörü bu karara ne katabilir | Mevcut ürün/araştırma

## 2. Proje fikirleri (telefon tek başına, hekim kullanır)
### Fikir N: <ad>
- Klinik soru (tek cümle: "Bu hasta ... mı?") ve hedef karar (sevk/tedavi/izlem)
- Hasta akışı (aile hekimliğinde yıllık kaç vizit, Türkiye/dünya, kaynaklı)
- Telefonda nasıl çalışır (sensör, protokol, ≤ kaç saniye/dakika, hekim ne yapar, çıktı ne)
- Kanıt: aynı ölçümün akıllı telefonla doğruluğu (duyarlılık/özgüllük, AUC; çalışma adı, yıl); yoksa "kanıt yok"; referans standart
- Mevcut uygulamalar/araştırmalar (ad) ve fark
- Teknik zorluklar + çözüm (ışık, cihaz çeşitliliği, Türkçe veri, kalibrasyon)
- Regülasyon: tanı amaçlı SaMD sınıfı (MDR Kural 11 → genelde IIa/IIb), "triyaj/karar desteği" olarak konumlandırma, KVKK
- Riskler: yanlış negatif (atlanan tanı) ve yanlış pozitif (gereksiz sevk) sonuçları
- Puan (0–10): Teknik | Kanıt | Etki (sıklık × kararın değeri) | Yenilik | Düşük risk | İş akışına uyum (≤2 dk, tek elle) | TOPLAM/60

## 3. Alanın en iyi 3 fikri ve gerekçe
## 4. Elenenler (bir satır: yapılamaz / zaten var / kanıt yok / hekime değer katmıyor)
## 5. Kaynaklar (URL; doğrulanmayanlar işaretli)
```
Uzunluk 2000–4500 kelime. Web araması için ToolSearch ile WebSearch yükle; mevcut ürünleri ve doğruluk çalışmalarını doğrula;
kota doluysa belirt ve "doğrulanmadı" işaretle.
