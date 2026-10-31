# Tur 2 · k06 · Can (31, yazılımcı, sabırsız tekrarlayan kullanıcı)

## 1. Ben kimim, ne yapmaya çalıştım
Aynı Can'ım: travma sonrası BPPV, 6 ayda 4. atak, sağ arka kanal tanılı, iPhone 13, koyu tema, metin okumuyorum. 1. turdaki
12 isteğimin karşılanıp karşılanmadığına kendi gözümle baktım. Süre ve dokunuş ölçümünü gerçek hızda tekrarladım, aynı kenar
durumlarını yeniden denedim.

Test koşulu 1. turla aynı: tohumlanmış geçmiş (3 eski atak, kayıtlı kalibrasyon), demo sanal sensör, ses kaydı. Bu kez
dokunuşlar insan hızında (350 ms arayla, ham dokunuş) yapıldı ve boşa gidenler ayrıca sayıldı. Betikler ve ekran görüntüleri:
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-2/k06-genc-sabirsiz/`
(`main.mjs`, `edges.mjs`, `dose3.mjs`, `close-limit.mjs`; `ekran/`, `main-speech.json`, `edges.json`, `main-marks.json`).

## 2. Yaşadıklarım (gerçek hız)
| Saniye | Etkin dokunuş | Ne oldu |
|---|---|---|
| 0 | 1 | "Baş dönmem başladı". |
| 0,7 | – | 1. sorunun üstünde yeni bir uyarı var ve sesle de okunuyor: "Son 6 ayda 4 atak yaşadınız… hekiminizle görüşün". Doğru ve yerinde. Ama uyarı soruyu aşağı itiyor: "Hayır" düğmesi ekranın altında kaldı (y=702, görünür alan 664). Düğme göremedim, **kaydırmam gerekti**. |
| 11,2 | 15 | 14 güvenlik sorusu (11'den 14'e çıkmış). Kilit artık görünüyor: düğmeler 0,6 sn soluk. Erken bastığımda neden tepki olmadığını anlıyorum. |
| 13,3 | 17 | İki alt tip sorusu. Bunlar da sesle okunuyor, seçenekler 0,8 sn soluk. |
| 14,5 | 19 | Taraf sorusu ("Sağ yanıma yatınca"), sonra "Hazırım". |
| 167 | 19 | ~30 sn yerleştirme ölçümü, ardından sol test. Oturuş adımında artık dürüst bir cümle var: "Başınızı sola çevirdiyseniz öyle kalın". |
| 199 | 20 | 30 sn dinlenme. Bu kez nedeni söyleniyor: "Baş dönmesi tamamen sönsün diye otuz saniye bekliyoruz". Yine 10 kez boşa vurdum ama artık sinirlenmedim. |
| 324 | 22 | Sağ testte baş dönmesini işaretledim (2 dokunuş). |
| **330,5** | **23** | Geçiş ekranında tek dokunuş verdim, Epley 1. adım başladı. **5 dk 30 sn, 23 etkin dokunuş ve 1 kaydırma.** 1. turda 5 dk 26 sn ve 20 dokunuştu; fark 3 yeni güvenlik sorusundan geliyor. Boşa giden dokunuş sayım: Hazırım'a kadar 16, dinlenmede 10. |
| 604 | 24 | "Şu an nasılsınız?" ekranında "İyiyim" dedim. Bitiş ekranında 10 dk dinlenme sayacı, 1 saat sonraki test saati ve takvim düğmesi var. |

Ses: telefon alındayken 10 sn'den uzun sessizlik olmadı. Seçenekli sorular artık seçenekleriyle birlikte okunuyor ("Birinci: …").
Her ekranda "Tekrar dinle" düğmesi var.

## 3. Sorunlar ve 1. kullanımdaki isteklerim
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Orta | 1. kullanımdaki isteğim #1 "Şu an nasılsınız?" kör dokunuşu: **kısmen** (`EpisodeFlow.tsx:1453`, `:1465`) | Açılıştaki 1 sn kilit ilk kör dokunuşu yuttu. "Yeni belirti" için onay ekranı geliyor. Ama onay ekranındaki "Evet, doğru" düğmesi (y=421–493) tam "Yeni belirti" seçeneğinin (y=404–529) yerinde. Aynı noktaya 1 sn arayla iki kör dokunuş yine acil kaydı ve kilidi yazdı. | Onay ekranında parmağın altına "Yanlış dokundum, soruya dön" gelsin; "Evet, doğru" başka bir yerde dursun. Ya da "Evet" basılı tutularak verilsin. Onaylanınca yol aynen acil kalsın. | Evet (`edges.mjs` A) |
| 2 | Orta | YENİ: 1. soru ekranı (`EpisodeFlow.tsx:813`) | Sık tekrar uyarısı 1. sorunun üstüne konunca iPhone 13'te Evet/Hayır görünür alanın dışına düşüyor. Benim gibi 6 ayda 4 atağı olan herkes her atakta önce kaydırmak zorunda. Uyarı sesle de 1. sorudan önce okunuyor; dinleyen biri en kritik soruyu ~12 sn geç duyar. | Uyarı tek satıra insin ya da soruların altına konsun. Sesli hâli 1. sorudan sonra ya da bitiş ekranında söylensin (bitişte zaten ana ekranda duruyor). | Evet (`edges.mjs` 1, `ekran/01-dbg.png`) |
| 3 | Düşük | YENİ: sınır doluyken atağı kapatınca ana ekran (`PatientHome.tsx:79`, `EpisodeFlow.tsx:139`) | Ana ekranda sınır kartı yerine "Baş dönmem başladı · Bugünkü atağınıza devam edilir" düğmesi çıkıyor. Basınca "ana ekrandaki Manevrayı tekrarla düğmesiyle yeniden yapabilirsiniz" deniyor, oysa o düğme yok. Döngü değil; bir dokunuş sonra doğru sınır metni görünüyor. | Yeniden açılabilir atakta da sınır doluysa sınır kartı gösterilsin; "Manevrayı tekrarla" cümlesi yalnız izin varken söylensin. | Evet (`close-limit.mjs`) |
| 4 | – | İsteğim #2 doz sınırı önceden gösterilsin: **karşılandı** | Ana ekranda "Bugünlük manevra sınırı doldu… en erken 01 Kasım 06:00", başlat düğmesi yok. Adresle girince de soru sorulmadan sınır söyleniyor. Gün sınırında "Evde manevra sınırı doldu" çıkıyor. | – | Evet (`dose3.mjs`, `edges.mjs` 9) |
| 5 | – | İsteğim #3 "Ataka devam et" çıkmazı: **karşılandı** | Sınırda boş atak açılmıyor. Aktif atakta sınır dolunca "Manevrayı tekrarla" yerine sınır metni ve bir sonraki izinli zaman yazıyor. | – | Evet (`edges.mjs` 10) |
| 6 | – | İsteğim #4 seçeneklerde çift dokunuş: **karşılandı** | 5 farklı seçimde ve son güvenlik sorusunda çift dokunuşun ikincisi yutuldu; sonraki soru yanıtsız açıldı. | – | Evet (`edges.mjs` 2, 2c) |
| 7 | – | İsteğim #5 aynı gün kapat-yeniden aç: **karşılandı** | Kapatıp "Baş dönmem başladı"ya basınca aynı atak yeniden açıldı: "Aynı atağa devam ediyoruz… 01:26'da tekrar testi". Yeni atak ya da sahte sayım oluşmadı. | – | Evet (`edges.mjs` 6) |
| 8 | – | İsteğim #6 güvenlik sorularında geri tuşu: **karşılandı** | 6. soruda sistem geri tuşu bir önceki soruya döndü, yanıtlar korundu, akıştan çıkmadı. | – | Evet (`edges.mjs` 3) |
| 9 | – | İsteğim #7 sık tekrar uyarısı: **karşılandı** (yan etkisi #2'de) | "Son 6 ayda 4 atak" artık çıkıyor: ana ekranda ve akışın başında sesle. | – | Evet |
| 10 | – | İsteğim #8 Evet/Hayır kilidi görünsün: **karşılandı** | Kilitliyken opaklık 0,55, sonra 1. | – | Evet (`edges.mjs` 1) |
| 11 | Düşük | İsteğim #9 devamda alt tip soruları yeniden soruluyor: **karşılanmadı** (sentezde yok) | Yarıda bırakıp "Ataka devam et" deyince iki alt tip sorusu yine geldi; teste 5 dokunuşta dönüyorum. Güvenlik soruları haklı olarak sorulmuyor. | Aynı atakta 6 saat içinde verilen alt tip yanıtları hatırlansın. | Evet (`edges.mjs` 5) |
| 12 | – | İsteğim #10 testsiz "Taraf: Sağ": **karşılandı** | Kartta artık "Henüz test edilmedi (son tanı: sağ)" yazıyor. | – | Evet |
| 13 | – | İsteğim #11 `#/hasta/atak/treat` adresi: **karşılandı** | Epley'den sonra bu adres "Aynı atağa devam ediyoruz… tekrar testi 01:26" diyor, manevra açmıyor. | – | Evet (`edges.mjs` 6) |
| 14 | – | İsteğim #12 dinlenmenin nedeni: **karşılandı** | Ses ve ekran nedeni söylüyor. | – | Evet (`main-speech.json`) |

Ayrıca yeniden denediklerim (değişmemiş, iyi):
- Testte geri tuşu yürütücüyü duraklatıyor.
- Arka plana alınınca yürütücü duraklıyor. Yeni bir sesli yol var: "Devam etmek için ekrana iki saniye basılı tutun". Böylece
  telefonu alnımdan indirmeden devam edebiliyorum.
- Sayfayı kapatırken tarayıcı uyarıyor.

## 4. Sevdiklerim
- Sınırlar artık beni boşuna yormuyor: ana ekran "bugün doldu, en erken yarın 06:00" diyor. Kapat-aç yapınca aynı atağa ve
  1 saatlik teste dönülüyor. Akıllıca, yasakçı değil.
- Kilitler artık görünür (soluk) ve seçenek ekranlarında da var. Hızlı dokunuşlarım yanlış yanıta dönüşmüyor.
- Telefon alındayken akış yine baştan sona sesle yürüyor. Dinlenmenin nedeni ve "basılı tutarak devam" gibi yeni cümleler
  yerinde.

## 5. Memnuniyet
**8/10** (1. turda 7). Karşılananlar: 12 isteğimden 10'u tam, 1'i kısmen (kör dokunuşta onay düğmesi hâlâ parmağın altında), 1'i
hiç (devamda alt tip soruları). Puanı düşüren yeni şey, sık tekrar uyarısının 1. sorudaki düğmeleri ekran dışına itmesi. Yakınıma
öneririm.
