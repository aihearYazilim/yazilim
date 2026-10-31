# Tur 2 — k07 sınırda hasta (Ahmet, 68)

## 1. Ben kimim, ne yapmaya çalıştım
Yine Ahmet'im: boyun fıtığı (başımı geriye atmakta zorlanırım), bel ağrısı, AF için apiksaban, tansiyon ilacı, 2 yıllık kalça
protezi; sol arka kanal BPPV hekim tanılı. Pixel 7, Büyük yazı. 1. turdaki isteklerimin yapılıp yapılmadığını kendi gözümle denedim.
Kurulum kapısını dört durum için yeniden denedim, hekim reçetesini denedim. Boynumun ~20° eksik sarktığı sensörlü yönlendirmeyi üç biçimde yaşadım:
zorlamadım, kendim durdurdum, sınıra kadar zorladım. Ek olarak hedefin tam kıyısında kalan boyunu denedim.

## 2. Yaşadıklarım
- **Kurulum listesi:** Boyun maddesi gündelik dille yazılmış ("boynumu rahat çeviremiyorum"), hemen buldum. Bel maddesi artık
  "yatıp kalkmamı, yan dönmemi kısıtlayan" diye açıklıyor. Benim bel ağrım bunu kısıtlamıyor, kararsız kalmadım. Listenin altındaki
  "Kan sulandırıcı (… apiksaban), tansiyon ilacı ve kalça/diz protezi tek başına engel değildir" notu tam aradığım cevaptı.
- **Engellenince:** Bu kez "Sizi engelleyen durum: Boyun sorunu" yazıyor. Altında hekime soracağım 3 soru var ("Boynumla Epley/Semont
  yapabilir miyim? Başımı ne kadar çevirip geriye bırakabilirim…") ve "Soruları kaydet / gönder" düğmesi. Reçetenin bunu
  açmayacağı da dürüstçe yazılmış. Hekime ne soracağımı artık biliyorum.
- **Reçete:** Hekimimin reçetesini ("boyun kısıtlı, baş az sarkıtılsın" notuyla) kabul ettim; manevralar yine kapalı kaldı. Ana ekran
  bunu açıkça söylüyor, gerekçesi 00-SENTEZ'de yazılı; kabul ediyorum. Yalnız reçete kartı, kabul etmeden önce bunu söylemiyor.
- **Zorlamadan (φ≈8°, hedef 15–40°):** İki kez "biraz daha geriye bırakın" dendi. Sonra "Daha fazla zorlamayın. Boynunuz ağrıyorsa
  … öyle kalın; bu pozisyona gelinemezse birazdan durduracağım" dendi. Yattıktan ~60 sn sonra durdu: "Bu pozisyona gelinemedi… Yavaşça
  oturun. Tekrar denemeden önce hekiminize danışın." Ekranda "Hekiminize başvurun" yazısı, "Tekrar dinle" ve "Hekime götürülecek
  rapor" düğmeleri var. Ana ekran yönlendirme kilidine geçti. Rahatladım.
  Tek pürüz: "öyle kalın" dedikten sonra üç kez daha "Zorlamadan, başınızı biraz daha geriye bırakın" geldi. Hem "kal" hem "biraz daha" duyunca ne yapacağımı şaşırdım.
- **Kendim durdurunca:** Duraklat'ı basılı tuttum. Ses "Duraklatıldı. Olduğunuz yerde kalın. Devam etmek için ekrana iki saniye basılı tutun." dedi.
  Ekranda "Pozisyona gelemiyorum / boynum ağrıyor" düğmesi var; bastım, aynı yönlendirmeli durdurma geldi. Ama ben ekranı göremiyorum.
  Ses bu seçeneği hiç söylemedi, üstelik boynum ağrırken "olduğunuz yerde kalın" dedi.
- **Sınıra kadar zorlayınca (φ=15°):** 1. turdaki "Tamam / Pozisyonu koruyun" gidip gelmesi bitti. Tutarken yalnız geri sayım
  duyuldu, histerezis işe yarıyor. Bir istisna: Epley 1. adımda zorlayıp tam sınıra geldikten sonra 84 sanal saniye boyunca, 15 saniyede
  bir "Zorlamadan, başınızı biraz daha geriye bırakın" dendi. Yattığımdan beri 60 saniyeyi aşmıştım ama durdurma gelmedi. Kodda baktım:
  hedefe tek bir an değen ölçüm "gelinemedi" sayacını sıfırlıyor (`core/runner.ts:849`, `:939`). Sensör gürültüsü sınırdaki hastada
  bu sayacı sürekli sıfırlayabilir. Sınırdan başlayan üç ayrı denemede ise 14–34 sn'de "Tamam" geldi. Durum değişken.
- **Rapor:** "Durum: Hekime yönlendirildi — manevranın bir pozisyonuna gelinemedi" yazıyor, iyi. Ama "Manevra: Epley" yazıyor;
  oysa ben sağ Dix-Hallpike testinde durdum. Başımın kaç derece eksik kaldığı da yok (kayıtta test adımı saklanmamış).
- **Yeni soru (ortostatik):** "Ayağa kalkınca gözleriniz kararıyor ya da bayılacak gibi oluyor musunuz?" Tansiyon ilacıyla ara sıra
  olur, hekimim de biliyor. Dürüstçe "Evet" dersem "Doğru mu?" onayından sonra manevra kapanıyor ve hekim kilidine giriyor.
  Açıklaması anlaşılır ve yerinde. Ama soru "yeni mi" diye sormuyor; her atakta beni durduracak.

### Durum tablosu (kurulum kapısı, tur 2)
| Senaryo | İşaretlediğim | Sonuç | Değerlendirme |
|---|---|---|---|
| Yalnız boyun | Boyun | Kapandı; "Boyun sorunu" adıyla, 3 soru, paylaşma | Doğru ve anlaşılır |
| Yalnız kan sulandırıcı | "Hiçbiri" (alttaki not bunu söylüyor) | Açık; atakta ilaç adlı kanama/baş çarpması sorusu | Doğru |
| İkisi birden | Boyun | Kapandı; not kan sulandırıcının engel olmadığını söylüyor | Doğru |
| Yalnız kalça protezi | "Hiçbiri" | Açık | Doğru |
| Boyun + bel | İkisi | Kapandı; iki durum adıyla, maddeye özgü 2 soru + genel soru | Doğru |
| Boyun + hekim reçetesi | Boyun + reçete | Kapalı; ana ekran "reçete de açmaz" diyor | Tutarlı (bilerek); reçete kartı önceden söylemiyor |

## 3. Sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| — | — | 1. kullanım #1 (sınırsız "daha geriye") | 2 ipucu → "Daha fazla zorlamayın" → ~60 sn'de durdurma, hekime yönlendirme ve kilit | **Karşılandı** (sınır durumu için #A'ya bakın) | Evet (`strict-log.txt`) |
| — | — | 1. kullanım #2 (reçete yanlış vaadi) | Yanlış vaat kalktı; "reçete de açmaz" açıkça yazıyor; reçeteyle açılmaması bilerek | **Karşılandı** | Evet (`rx.json`) |
| — | — | 1. kullanım #3 (madde adı + sorular) | Madde adı, 2–3 soru, kaydet/gönder var | **Karşılandı** (ana ekran kartında yok, #E) | Evet |
| — | — | 1. kullanım #4 (sınırda gidip gelme) | Tutarken histerezis; gidip gelme yok | **Karşılandı** | Evet (`force-log.txt`) |
| — | — | 1. kullanım #5 (duraklatmada "gelemiyorum") | Düğme var ve yönlendirmeli durdurma yapıyor; ses söylemiyor | **Kısmen** (#B) | Evet (`pause-log.txt`) |
| — | — | 1. kullanım #6 (engel olmayanlar notu, bel belirsizliği) | Not var; bel maddesi örnekli | **Karşılandı** | Evet |
| — | — | 1. kullanım #7 (tanıtmada "tavana bakın") | "zorlamadan, rahat olduğunuz kadar" eklendi | **Karşılandı** | Ses kaydı |
| — | — | 1. kullanım #8 (Bilgilerimi düzenle) | Doğrudan uygunluk adımına gidiyor | **Karşılandı** | Evet |
| A | Yüksek | `core/runner.ts:849`, `:939` | Hedefe tek an değen ölçüm "gelinemedi" sayacını sıfırlıyor. Sınırda zorlayan hastada 60 sn'yi aşan "Zorlamadan… biraz daha geriye" döngüsü oldu (84 sanal sn, Epley 1. adım). | Sayaç yalnız pozisyon doğrulanınca (holding) sıfırlansın ya da hedef dışı süre toplamla ölçülsün. Durdurma kuralının kendisi aynen kalsın. | Evet (bir kez gözlendi + kod); 3 denemede tekrarlanmadı |
| B | Orta | Duraklatma sesi (`RunnerView.tsx` duraklatma) | Ses "Olduğunuz yerde kalın" diyor ve "Pozisyona gelemiyorum" seçeneğini söylemiyor; alındaki telefonda düğmeyi göremem. | Duraklatınca: "Boynunuz ağrıyorsa yavaşça oturabilirsiniz. Pozisyona gelemiyorsanız … (sesle yapılabilir bir yol, ör. üç kez dokunun)". | Evet |
| C | Orta | Zorlama uyarısı sonrası ipucu (`runner.ts` outOfTarget) | "Öyle kalın" dendikten sonra "Zorlamadan, biraz daha geriye bırakın" 3 kez daha geliyor; çelişkili. | Zorlama uyarısından sonra HANG_MORE ipucu tekrarlanmasın; yalnız "Rahat olduğunuz yerde kalın, birazdan durduracağım" denilsin. | Evet |
| D | Orta | Rapor / atak kaydı | Durdurma Dix-Hallpike testinde olduğu hâlde raporda "Manevra: Epley" yazıyor; hangi adım ve kaç derece eksik kalındığı yok. | "Sağ taraf testi, sarkık adım: baş ~8° (hedef 15–40°), 60 sn'de gelinemedi" satırı. | Evet (`after.json`) |
| E | Düşük | Ana ekran kapalı kartı (`PatientHome.tsx`) | Ana ekranda engelleyen madde adı ve hekim soruları yok, yalnız genel metin var. Atak günü açtığımda soruları göremem. | Kapı ekranındaki madde adı ve soruların kısa hâli ana ekran kartında da görünsün. | Evet |
| F | Düşük | Reçete kartı (`PrescriptionImport.tsx`) | Kontrendikasyonum varken reçete kabul ediliyor, sonra kapalı çıkıyor. | Kabulden önce "Boyun sorunu işaretli olduğu için bu reçete ev manevralarını açmaz" uyarısı. | Evet |
| G | Orta (klinik karar) | Kırmızı bayrak `orthostatic` (`core/safety.ts:77`) | Tansiyon ilacı kullanan yaşlıda bilinen, eski hafif göz kararması her atakta durdurur; soru "yeni mi" ayrımı yapmıyor. | Soru kaldırılmasın. Klinik ekip, kulak sorusundaki gibi "yeni ya da arttı mı" ayrımının güvenli olup olmadığına karar versin. | Evet (`ortho.json`) |

## 4. Sevdiklerim
- 60 saniyede durdurup hekime yönlendirme ve "Daha fazla zorlamayın" cümlesi: bozulmasın, gevşetilmesin.
- Kapı ekranında madde adı, hekime sorulacak sorular ve "Soruları kaydet / gönder" düğmesi.
- "Kan sulandırıcı, tansiyon ilacı, protez tek başına engel değildir" notu ve ilaç adlarıyla sorulan kanama sorusu.

## 5. Memnuniyet
**8/10** (1. kullanımda 5). Artık doğru yerde, nedenini ve ne soracağımı söyleyerek durduruyor. Boynum yetmeyince beni zorlamak
yerine durduruyor. Kalan pürüzler sınırdaki sayaç, sesli "gelemiyorum" yolu ve rapordaki eksik derece bilgisi. Boyun sorunu olan bir yakınıma,
hekimi onaylarsa, artık önerirdim. Klinikte boyun kısıtlı hastaya "uygulama seni zorlamaz, durdurur" diyebilirim.

Kanıtlar: `/tmp/claude-0/-home-user-yazilim/6b1c7e6f-cd74-5916-b125-0ced4ed9bef3/scratchpad/kullanicilar/tur-2/k07-sinirda-hasta/`
(`onboard.json`, `rx.json`, `strict-log.txt`, `pause-log.txt`, `force-log.txt`, `edge-log.txt`, `after.json`, `ortho.json`, ekran görüntüleri).
