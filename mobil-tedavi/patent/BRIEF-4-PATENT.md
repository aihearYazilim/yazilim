# BRIEF-4 — 20 projenin patentlenebilirlik araştırması

## Amaç
Önceki turlarda seçilen 20 mobil uygulama projesinden hangilerinin **patentlenebilir** olduğunu, hangi **istem (claim)
stratejisiyle** korunabileceğini ve hangilerinde **başkasının patentini ihlal etme (FTO — freedom to operate) riski**
olduğunu araştırmak. Hedef ülkeler: **Türkiye (TÜRKPATENT, 6769 sayılı SMK)**, **Avrupa (EPO/EPC)**, **ABD (USPTO)**;
PCT yolu.

Bu bir hukuki görüş değildir; çıktı, bir patent vekiline götürülecek **ön araştırma dosyasıdır**. Bunu her raporda bir kez
yaz, sonra işini yap.

## 20 proje
### Tedavi (anında / 1–2 seans) — ayrıntı: `mobil-tedavi/aninda/`
| # | Ad | Özü | Ayrıntılı plan |
|---|---|---|---|
| T1 | İlkSaat | Travma sonrası ilk 6–72 saatte tek seanslık görsel-uzamsal görev (özgün blok oyunu) + anı hatırlatma ile girici anı önleme | `aninda/proje-B-ilksaat.md` |
| T2 | Bayılma Kalkanı | Presenkopta sesli/haptik karşı-basınç manevrası rehberi; kan alırken uygulamalı kas gerimi; IMU duruş tespiti; isteğe bağlı kamera-PPG | `aninda/proje-C-atak-ani.md` |
| T3 | DengeYol-Anında (BPPV) | Kırmızı bayrak anketi + taraf anketi + telefon alına dayalı jiroskop güdümlü Epley + sesli/haptik açı geri bildirimi + tekrar-test; 2. faz ön kamera nistagmus | `aninda/proje-A-bppv-dengeyol.md` |
| T4 | TekAtış-Uyku | Akut insomni için tek seanslık CBT-I, geriye dönük 7 gece girdisinden uyku penceresi hesabı | `aninda/proje-D-tekatis-uyku.md` |
| T5 | HipoDurdur | Hipoglisemide 15-15 rehberi, zamanlayıcı, dokunma/ses yanıt testi, yanıt yoksa kaçış/bakıcı çağrısı | `aninda/proje-C-atak-ani.md` |
| T6 | İğneAnı | Aşı/kan alma anında titreşim + nefesle kontrol edilen dikkat dağıtma (mikrofon) | `aninda/tarama-B.md`, `tarama-D.md` |
| T7 | Acil-Enjeksiyon | Anafilaksi oto-enjektör / glukagon sesli acil rehberi | `aninda/tarama-D.md` |
| T8 | Bulantı-Anı | P6 parmak basıncı + nefes + IMU görsel ipucu | `aninda/tarama-D.md`, `tarama-C.md` |
| T9 | KoltukSakin | Diş koltuğunda müzik + haptik nefes ile tek seans anksiyete | `aninda/tarama-B.md` |
| T10 | İstekDalgası-3dk | Sigara isteği anında 3 dk görsel-uzamsal görev / IMU egzersiz | `aninda/tarama-D.md` |
Sıralama ve özetler: `aninda/00-DEGERLENDIRME-ANINDA.md`.

### Tanı (aile hekimi kullanır) — ayrıntı: `mobil-tedavi/tani/`
| # | Ad | Özü | Kaynak rapor |
|---|---|---|---|
| D1 | ÇocukGöz-Tarama | Flaşlı Hirschberg fotoğrafı + kapama testi videosu + kırmızı refle → şaşılık/ambliyopi sevk | `tani/alanlar/05-oftalmoloji.md`, `13-pediatri.md` |
| D2 | SoluSay / VitalAkış | Kamera videosundan solunum sayısı + göğüs çekilmesi + parmak-PPG nabız → pnömoni/NEWS2 triyajı | `08-gogus`, `13-pediatri`, `22-acil-tip`, `24-aile-hekimligi` |
| D3 | Dikkat Işığı | Ekran/hoparlör dikkat testi + 4AT → deliryum | `03-psikiyatri`, `14-geriatri` |
| D4 | SternumSCG | Telefon sternumda, ivmeölçer/jiroskop seismokardiyografi → kalp yetmezliği ön taraması | `01-kardiyoloji` |
| D5 | SkleraBil | Aksesuarsız sklera fotoğrafından bilirubin tahmini | `09-gastroenteroloji`, `15-onkoloji`, `20-nefroloji-hematoloji` |
| D6 | Kalk-Yürü-Otur | Cepte IMU ile TUG + masadaki kamera ile 5×STS + SARC-F → düşme/sarkopeni | `07-ftr-ortopedi`, `14-geriatri` |
| D7 | LensBak | Flaş fotoğrafla katarakt AI + görme keskinliği + Amsler → yaşlıda sevk önceliği | `05-oftalmoloji` |
| D8 | SesSpiro | Mikrofonla zorlu ekspirasyondan FEV1/FVC oranı + GOLD anketi → spirometri sevk önceliği | `08-gogus-hastaliklari` |
| D9 | OrtoNabız | Yatar→ayakta kamera-PPG nabız artışı + ESC bayılma bayrakları → OH/POTS/hipovolemi triyajı | `01-kardiyoloji`, `09`, `20`, `22`, `24` |
| D10 | ElSinovit | Standart el fotoğrafı CNN sinovit + yumruk kapama videosu kinetiği + EULAR sevk kuralı | `16-romatoloji` |
Sıralama ve özetler: `tani/00-DEGERLENDIRME-TANI.md` (bölüm "İlk 10").
Tüm yollar `/home/user/yazilim/mobil-tedavi/` altındadır.

## Patentlenebilirlik ölçütleri (her proje için ayrı ayrı uygula)
1. **Konu uygunluğu:**
   - TR SMK md. 82/2 ve EPC md. 52(2)–(3): bilgisayar programları "**as such**" patentlenemez; **teknik etki / teknik
     karakter** gerekir (EPO "any hardware" yaklaşımı ve COMVIK; G 1/19). İş yöntemi, oyun kuralı, zihinsel faaliyet,
     bilgi sunumu da hariç.
   - TR SMK md. 82/3(b)? ve EPC md. 53(c): **insan vücuduna uygulanan cerrahi/tedavi yöntemleri ve vücut üzerinde
     uygulanan teşhis yöntemleri patentlenemez**; ancak bu yöntemlerde kullanılan **ürün/cihaz/sistem** patentlenebilir.
     (Madde numaralarını doğrula.) G 1/04 teşhis yöntemi ölçütleri.
   - ABD 35 USC 101 + **Alice/Mayo** testi (soyut fikir, doğa yasası); 2024 USPTO AI rehberi; tedavi yöntemi ABD'de
     patentlenebilir.
2. **Yenilik:** Önceki teknikte (patent + makale + mevcut uygulama + yayımlanmış klinik protokol) aynı birleşim var mı?
3. **Buluş basamağı / aşikâr olmama:** En yakın önceki teknik + fark + objektif teknik problem (EPO problem-çözüm).
   Bilinen bir klinik protokolü (Epley, 15-15, Hirschberg, TUG, 4AT) telefona taşımak tek başına aşikâr sayılabilir —
   aşikâr olmayan **teknik** farkı bul (sensör füzyonu, kalibrasyon yöntemi, tek kamerayla aynı anda iki ölçüm,
   kalite kontrol, artefakt reddi vb.).
4. **Sanayiye uygulanabilirlik:** genelde sorun değil.
5. **Önceki teknik araştırması:** Google Patents (patents.google.com), Espacenet (worldwide.espacenet.com), WIPO
   Patentscope, TÜRKPATENT. CPC sınıflarını kullan (ör. A61B 5/08 solunum, A61B 5/024 nabız, A61B 5/0205, A61B 5/11
   hareket, A61B 3/ göz, A61B 5/103, A61B 5/7267 ML, G16H 50/20, G16H 20/30–70, A61H, A63F). Her proje için en az
   5 en yakın patent/başvuru bul: numara, başlık, sahip, öncelik tarihi, durum (verildi/başvuru/düştü/süresi doldu),
   bağımsız istemin özü, bizim fikirle örtüşme. Makaleleri ve mevcut ürünleri de önceki teknik olarak yaz
   (alan raporlarında çoğu zaten var).
6. **FTO (ihlal riski):** Yürürlükte olan ve bizim ürünü kapsayabilecek patent var mı (ör. BPPV için DZMED; Tetris
   ticari takdim/telif; kamera-PPG için Philips/Cardiio/Binah; SCG için Haddad/Stanford?; sklera bilirubin için
   BiliScreen/UW; spirometri için SpiroSmart/UW). Hangi ülkede yürürlükte?
7. **Patentlenebilir çekirdek:** Somut bir **bağımsız istem taslağı** yaz (sistem/cihaz istemi tercihen; TR/EP'de
   tedavi/teşhis yöntemi istemi YAZMA ya da neden yazılamayacağını belirt). 2–4 bağımlı istem önerisi.
8. **Patent dışı koruma** (patent zayıfsa): ticari sır (model ağırlıkları, veri seti), telif (kod, içerik, oyun), marka,
   endüstriyel tasarım (arayüz), faydalı model (TR'de faydalı model: inceleme yok, 10 yıl — **yazılımda kullanılabilirliği
   doğrula**).

## Puan (her proje)
Yenilik (0–10) | Buluş basamağı (0–10) | Konu uygunluğu TR/EP (0–10) | ABD uygunluğu (0–10) | FTO güvenliği (0–10;
10 = engel yok) | Ticari değer (0–10) | **TOPLAM/60** ve tek kelimelik karar: **GÜÇLÜ / ORTA / ZAYIF / YOK**.

## Çıktı
Her ajan `mobil-tedavi/patent/projeler/<grup>.md`. Proje başına bölüm: (a) patentlenebilir teknik çekirdek, (b) önceki
teknik tablosu (≥5 kalem, numara + bağlantı), (c) yenilik/buluş basamağı analizi, (d) konu uygunluğu TR/EP/ABD,
(e) FTO riskleri, (f) bağımsız istem taslağı + bağımlı istemler, (g) patent dışı koruma, (h) puan ve karar.
Türkçe. Uydurma yok: patent numarası, sahip ve tarih ancak gerçekten bulduysan; bulamadıysan "bulunamadı" ya da
"doğrulanmadı" yaz. Web için ToolSearch ile WebSearch ve WebFetch yükle (Google Patents sayfaları WebFetch ile okunabilir).
