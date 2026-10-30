# Tur 1 · k06 · Can (31, yazılımcı, sabırsız tekrarlayan kullanıcı)

## 1. Ben kimim, ne yapmaya çalıştım
Bisiklet kazasındaki hafif kafa travmasından sonra BPPV başladı; son 6 ayda 4. atağım. KBB tanısı var (sağ arka kanal),
bilgilerimi 3 ay önce girdim, telefonu da o zaman tanıttım. iPhone 13, koyu tema. Metin okumam, en kısa yoldan manevraya
gitmek isterim. Bu kez de "Baş dönmem başladı"dan Epley'e kaç dokunuş ve kaç saniye sürdüğünü ölçtüm, sonra uygulamayı zorladım.

Test koşulu: tohumlanmış localStorage (3 kapanmış eski atak, kayıtlı kalibrasyon), demo sanal sensör. Ana tur gerçek hızda
(`timeScale` 1), kenar durumları ×20 hızda. Ses motoru bir init script ile kaydedildi. Betikler ve ekran görüntüleri:
`/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-1/k06-genc-sabirsiz/`
(`main.mjs`, `edges.mjs`, `after.mjs`, `dose2.mjs`, `treat.mjs`; `ekran/`, `main-speech.json`, `edges.json`).

## 2. Yaşadıklarım (gerçek hız)
| Saniye | Dokunuş | Ne oldu |
|---|---|---|
| 0 | 1 | Ana ekranda dev "Baş dönmem başladı". Bastım. |
| 9,9 | 12 | 11 güvenlik sorusu, hep "Hayır". "Hayır" düğmesi hep aynı yerde (y=624), güzel. İnsan hızında (~350 ms) bastığımda dokunuşların yarısı (22'de 11) sessizce boşa gitti: 600 ms kilidi var ama ekranda belli olmuyor. |
| 10,4 | 14 | İki alt tip sorusu (ne başlatıyor, ne kadar sürüyor). 3 ay önce de cevaplamıştım. |
| 10,9 | 16 | Taraf sorusu ("Sağa dönünce"), sonra Hazırlık ekranında "Hazırım". |
| ~40 | 16 | Kayıtlı kalibrasyon sayesinde tanıtma ekranı atlandı. Yine de yaklaşık 28 sn yerleştirme ölçümü var. Gerekli olduğunu anladım: telefonun alına içe mi dışa mı takıldığını ayırıyor. |
| 160 | 16 | Sol Dix-Hallpike: sesli, geri sayımlı, ekrana bakmadım. Baş dönmesi olmadı. |
| 197 | 28 | 30 sn dinlenme. Sayaç bitene kadar ekrana 11 kez vurdum, hiçbir şey olmadı. Sonra "dokunun" dendi, tek dokunuşla geçtim. |
| 320 | 30 | Sağ test: baş dönmesini 2 dokunuşla işaretledim (başladı ve bitti). "Geçti olarak işaretlendi, 45 saniye daha" sesi iyi. |
| **325,6** | **20 etkin** | "Sağ tarafta baş dönmesi oldu" ekranında tek dokunuş verdim, Epley 1. adım başladı. **Manevraya 5 dk 26 sn'de ve 20 etkin dokunuşla ulaştım** (boşa giden dokunuşlar hariç). |
| 596 | 21 | Epley bitti, "Şu an nasılsınız?" sorusuna "İyiyim" dedim. Bitiş ekranında 1 saat sonraki test saati ve "Takvime ekle" var. |

Ses: telefon alındayken akış baştan sona sesle yürüdü, 10 sn'den uzun sessizlik olmadı. Güvenlik soruları ben bastıkça kesiliyor;
benim için sorun değil. Not: demo modunda yerleştirme yönergeleri yalnız ekrana yazılıyor, okunmuyor. Bu demo farkı, hata saymadım.
Yavaşlatan şey sorular değil, iki test ile 30 sn dinlenme. Bunların nedenini biliyorum (nükste taraf değişebiliyor), kabul.

Kenar durumları (×20):
- **Çift dokunuş:** "Baş dönmem başladı" ve Evet/Hayır düğmelerinde çift dokunuş zararsız, kilit onu yutuyor. Seçenek listelerinde
  (Choice) kilit yok. "İkisi de"ye çift dokununca süre sorusu ekranı görmeden "1–3 dakika" diye yanıtlandı. Süre sorusunda
  "1 dakikadan kısa"ya çift dokununca taraf sorusu kendiliğinden "Sağa dönünce" oldu ve Hazırlık açıldı.
- **Manevradan hemen sonra kör dokunuş:** Telefonu alnımdan alırken ekranın ortasına tek dokunuş (195,460) "Yeni belirti var"ı
  seçti. Onay sorulmadan acil ekranı açıldı, atak "emergency" olarak kilitlendi ve kayda "neuro" yazıldı. Manevra boyunca
  "ekranın her yerine dokun" dendiği için bu dokunuş çok olası.
- **Geri tuşu:** Testte, dinlenmede, geçiş ekranında ve manevrada sistem geri tuşu akışı bitirmiyor. Ya duraklatıyor ya da
  yok sayılıyor; üç kez üst üste bastım, yine duraklattı. Güvenlik sorularının 6.'sında bastığımda ise ana ekrana attı,
  yanıtlar kayboldu ve 1. sorudan başladım.
- **Arka plana alma:** Test sırasında yürütücü duraklıyor, ses "Duraklatıldı… Devam düğmesine basın" diyor. Dinlenme sayacı
  arka planda da işliyor; bu doğru.
- **Yarıda bırakma:** Sayfayı kapatırken tarayıcı "çıkılsın mı" diye uyardı. Döndüğümde ana ekranda "Ataka devam et" vardı.
  Güvenlik soruları (6 saat içinde olduğum için) haklı olarak yeniden sorulmadı, ama alt tip soruları yeniden soruldu: teste
  5 dokunuşta döndüm. "Duraklat"ı basılı tutup "Şimdilik bırak" deyince temiz bir "Test yarıda bırakıldı" ekranı geldi.
- **Aynı gün yeniden deneme:** Manevradan sonra ana ekran yalnız "Test saati 00:13" gösteriyor; tekrar yapamıyorum, doğru.
  Ama "Atak geçti, kapat" deyip yeni atak açınca dakikalar içinde 2. ve 3. Epley'i yapabildim. 4.'de günlük sınır tuttu. Bu
  arada bir günde açtığım 3 "atak" yüzünden ana ekranda "Son 30 günde 3 atak" uyarısı çıktı.
- **Doz sınırı:** Bugün 3 manevra yapılmışken ana ekranda hiçbir uyarı yok. 11 soruyu (12 dokunuş, ~10 sn) yanıtladıktan
  sonra "Manevra sınırına ulaşıldı" geldi. Sonra ana ekranda boş bir aktif atak ve dev "Ataka devam et" kaldı. Ona her
  bastığımda aynı sınır ekranı geliyor; döngü. Gün sınırında (14 günde 3 gün) da aynı şey oluyor.
- **Sık tekrar uyarısı:** Benim gerçek geçmişimde (6 ayda 4 atak, travma sonrası) hiç çıkmadı; kural 30 günde 3 atak. 30 günde 3
  atakla tohumladığımda uyarı yalnız yeni atak açıldıktan sonra, yalnız ana ekranda çıktı. Akışta sesli söylenmiyor.

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Yüksek | "Şu an nasılsınız?" (`EpisodeFlow.tsx` AfterManeuver; `Controls.tsx:23` Choice) | Manevra bitince ekran ortasına tek kör dokunuş "Yeni belirti var"ı seçiyor: acil ekranı açılıyor, atak kilitleniyor, kayda nörolojik belirti yazılıyor. | Ekran açılınca ~1 sn dokunuş kilidi olsun. "Yeni belirti" ve "Kusma" için güvenlik sorularındaki gibi bir "Doğru mu?" onayı olsun (onaylanınca yine acil). | Evet (`after.mjs`) |
| 2 | Yüksek | Doz sınırı (`EpisodeFlow.tsx:184`, `:205`; ana ekran) | Günlük ya da gün sınırı doluyken ana ekran bunu söylemiyor. 11 soru yanıtlatılıp ancak sonra "sınır" deniyor. | Ana ekranda "Bugün 3/3 manevra yapıldı, yarın sabah" yazsın. Büyük düğme bu bilgiyle değişsin. Sınır, sorulardan önce söylensin. | Evet (`edges.mjs` 6, 8, 9) |
| 3 | Yüksek | Sınırdan sonraki ana ekran (`PatientHome.tsx:278`) | Boş aktif atak kalıyor; "Ataka devam et" her basışta aynı sınır ekranına götürüyor. Çıkmaz döngü. | Sınır doluyken düğme yerine sınır metni ve bir sonraki izinli zaman görünsün. Boş atak açık kalmasın. | Evet (`dose2.mjs`) |
| 4 | Orta | Seçenek ekranları (`Controls.tsx:23`) | Çift dokunuşun ikincisi sonraki soruyu görmeden yanıtlıyor (süre sorusuna "1–3 dk", taraf sorusuna "Sağa"). | Evet/Hayır'daki kilit (`lockKey`) Choice'a da eklensin. | Evet (`edges.mjs` 2, 2b) |
| 5 | Orta | "Atak geçti, kapat" sonrası yeni atak | Aynı gün kapatıp yeniden açınca 1 saatlik tekrar testi atlanıyor; 3 Epley art arda yapılabiliyor. Sahte "3 atak" uyarısı çıkıyor. Günlük sınır yine tutuyor. | Bugün manevralı bir atak kapandıysa yeni atak açılmasın; aynı atağa dönülsün ya da "tekrar testi 00:13'te" gösterilsin. Aynı gün açılan ataklar sık tekrar sayımına girmesin. | Evet (`edges.mjs` 6) |
| 6 | Orta | Güvenlik soruları, sistem geri tuşu (`EpisodeFlow.tsx:630` yalnız üst çubuk) | 6. soruda sistem geri tuşu ana ekrana atıyor, yanıtlar kayboluyor, 1. sorudan başlıyorum. | Sistem geri tuşu da üst çubuktaki gibi önceki soruya gitsin. | Evet (`edges.mjs` 3) |
| 7 | Orta | Sık tekrar uyarısı (`safety.ts:330`, `PatientHome.tsx:68`) | 6 ayda 4 atak (travma sonrası) hiç uyarı üretmiyor. Uyarı yalnız ana ekranda çıkıyor, sesli söylenmiyor. | Ölçüt genişletilsin (ör. 6 ayda 3 atak da hekim önerisi). Bitiş ekranında bir kez okunsun. (Güvenliği artırır.) | Evet (kural kodda; 30 günde 3 atak tohumuyla görüldü) |
| 8 | Düşük | Evet/Hayır kilidi (`Controls.tsx:94`) | 600 ms kilit görünmüyor; hızlı basınca dokunuşlar sessizce yutuluyor, bozuk sanıyorum. | Kilit süresince düğmeler soluk görünsün. Kilit kalsın. | Evet (`edges.mjs` 1) |
| 9 | Düşük | Yarıda bırakılan ataka devam (`EpisodeFlow.tsx:191`) | Dakikalar önce yanıtladığım alt tip soruları yeniden soruluyor. | Aynı atakta 6 saat içinde verilen alt tip yanıtları hatırlansın (güvenlik soruları gibi). | Evet (`edges.mjs` 5) |
| 10 | Düşük | Aktif atak kartı (`episodes.ts` episodeSide) | Taraf testi yapılmadan "Taraf: Sağ" yazıyor (3 ay önceki profilden). Testi gereksiz sanabilirim. | "Henüz test edilmedi (son tanı: sağ)" yazsın. | Evet (`ekran/11-k5-donus-ana.png`) |
| 11 | Düşük | `#/hasta/atak/treat` adresi (`EpisodeFlow.tsx:186`) | Epley'den 5 dk sonra bu adres doğrudan yeni bir Epley başlatıyor, 1 saatlik test atlanıyor (doz sınırı tutuyor). Yalnız adres ya da geçmişle erişilebiliyor. | "treat" kipi yalnız `nextAction` "treat-again" iken açılsın; değilse ana ekrana dönsün. | Evet (`treat.mjs`) |
| 12 | Düşük | 30 sn dinlenme | Sayaç süresince dokunuşlara tepki yok, neden beklediğim söylenmiyor. | Başta tek cümle söylensin: "Baş dönmesi tamamen sönsün diye bekliyoruz." | Evet |

Gereksiz gelen ama dokunulmaması gerekenler: 11 güvenlik sorusu (~10 sn, kırmızı çizgi), iki taraflı test, yerleştirme ölçümü,
30 sn dinlenme. Hepsi makul. Gerçekten gereksiz olanlar: devamda alt tip sorularını yeniden sormak, sınır doluyken soru
sordurmak ve çıkmaz "Ataka devam et" düğmesi.

## 4. Sevdiklerim
- Telefon alındayken hiç ekrana bakmadım. Taraf testinden manevraya ve dinlenmeden ikinci teste geçiş tek dokunuş.
  Geri sayım sesleri sabırsız birini bile tutuyor.
- Geri tuşu ve arka plana alma manevrayı bitirmiyor, duraklatıyor ve sesle söylüyor. Kapatırken tarayıcı uyarıyor; bitişten
  geri tuşu ana ekrana dönüyor, akışa yeniden girmiyor.
- Doz sınırı ataktan bağımsız sayılıyor: kapat-aç hilesiyle 4. manevra engellendi. 6 saat içinde güvenlik soruları yeniden
  sorulmuyor. Kayıtlı kalibrasyon tanıtmayı atlatıyor.

## 5. Memnuniyet
**7/10.** Tekrarlayan kullanıcı olarak 5,5 dakikada ve 20 dokunuşla, ekrana bakmadan manevraya ulaştım. Puanı düşüren üç şey
var: manevradan hemen sonra tek kör dokunuşun beni acile kilitleyebilmesi, sınır doluyken önce 11 soru sordurup sonra çıkmaz
bir "Ataka devam et" bırakması ve seçenek ekranlarında çift dokunuş koruması olmaması. Yakınıma öneririm; 1 numaralı sorun
düzelirse çekinmeden.
