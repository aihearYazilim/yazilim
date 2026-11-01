# y03 — Türkçesi zayıf kullanıcı (Rania, 38, terzi) · tur-3

## 1. Ben kimim, ne yapmaya çalıştım
Aynı Rania'yım: konuşulan Türkçeyi anlarım, yavaş okurum, simgeye ve renge güvenirim; hekim tanısı yazmadı. Son sürümü Pixel 7
öykünümünde baştan sona yeniden kullandım (ilk açılış → kurulum → atak → iki test → Epley → sonrası → rapor). Ana koşu demo paneli
olmadan, gerçek sensör yolunda yapıldı: `devicemotion` olayları üreten sanal bir baş kullandım; önce sesi dinledim, sonra hareket ettim.
Betikler `scratchpad/yeni-kullanicilar/tur-3/y03-turkcesi-zayif/` altında: `person.cjs` (panelsiz koşu, `shots-p1/`), `drive.cjs`
(demo; `shots-a/`, test hiç tetiklenmeyen koşu `shots-neg*/`), `extra.cjs` (hata denemeleri, `shots-b/`), `tani.cjs` (ana ekrandaki kulak sorusu).

## 2. Akış günlüğü (❓ = ne yapacağımı bilemedim)
1. **Karşılama ve kurulum.** Ses neye dokunacağımı söylüyor. Tek onay kutusu var, "Başla" kutu işaretlenene kadar soluk. 3 dokunuşta geçtim.
2. **Ana ekran.** Kulak sorusu artık küçük bir "Doktorum tanı koydu" bağlantısının arkasında. Açınca ses "Sağ kulak, sol kulak ya da doktor söylemedi" diye soruyor; "Doktor söylemedi" kartı kapatıyor. Yanlışlıkla "Sol kulak"a dokundum: ekran ve ses "Sol kulak dediniz, doğru mu? Evet / Hayır" diye sordu. Çok iyi; korkmadım. "Tanı girilmedi" cümlesi kalkmış.
3. **Güvenlik soruları.** İlk ses artık maddelerin kısa adlarını kendisi sayıyor (~21 sn): "sürekli dönme, çift görme, … kulakta yeni sorun, ateş, çok kusma". Ekrandaki simgelerle birlikte anlıyorum. Tam listeyi "🐢 Daha yavaş" ile dinlemek yine 70 sn sürüyor; ama artık gerek kalmıyor. Kulak maddesini işaretlediğimde uyarı ekranında yeni bir "Yanlış dokundum, listeye dön" düğmesi vardı. Tur-1'deki hatamı tam bu düzeltiyor. Uyarı metni hâlâ uzun (70 kelime, "KBB", "aciliyete").
4. **Alt tip ve hazırlık.** Sesle anlaşılıyor. Seçeneklerde kilit sırasında yeşil bir dolma çubuğu çıkıyor. Hazırlık ekranında "Hazırım" altta sabit.
5. **Telefonu tanıtma.** Sesle, bakmadan geçtim.
6. **İki test.** Başlıklar gündelik dilde: "Baş dönmesi testi · sağ", "Oturun, başınızı sağa çevirin", "Hızla sırtüstü yatın", "Yavaşça oturun". Yeni bir cümle var: "Yatağın ortasında oturun; düşmemek için kenara yakın olmayın." Yalnız yaşayan biri için iyi. "Baş dönmesi başlarsa ekrana dokunun" en başta söyleniyor, varışta da hatırlatılıyor. **86 cümlenin hiçbiri kesilmedi.**
7. **Karar ve manevra.** "Sağ tarafta baş dönmesi oldu… Dokunun". Manevra başlıkları da gündelik ("Manevra · sağ", "Sol yanınıza dönün", "SOLUNUZA biraz daha çevirin →"). Ayrıca testte hiç dokunmadığım bir koşu denedim. Karar ekranında tek büyük, numaralı önerilen düğme çıktı ("① Hangi yan bilmiyorum: iki tarafa sırayla manevra"); öteki seçenekler "Başka seçenekler (4)" altında katlı. Ses kısa: "Önerim: iki tarafa sırayla manevra. Test baş dönmesi yapmadı; kristal oynaması olmayabilir. Büyük düğmeye dokunun."
8. **Sonrası.** "Şu an nasılsınız?" seçenekleri numaralı ve yüz simgeli: ① 🙂 İyiyim, ② 😐, ③ 🤢, ④ ⚠️. Hiç okumadan seçtim. Bitiş ekranında saat simgeli tek satır var: "Tekrar testi 23:14 — uyanınca 'Başım dönüyor'a basın". Aynı cümle ana ekrandaki büyük düğmenin altında da yazıyor. ❓ Saat 22:13 idi; 23:14'te uyanık olacağım. "Uyanınca" sözü yüzünden sabahı mı bekleyeceğim, o saatte mi yapacağım, anlamadım. ❓ Ana ekranda "Bugün: 1 manevra tamamlandı · önerilen en fazla 3" ile "Gün: 1. gün (önerilen en fazla 3)" alt alta duruyor. İki ayrı "en fazla 3" görünce bugün tekrar yapmam mı gerektiğini düşündüm. Yeşil karttaki "Uyku pozisyonu kısıtlaması ya da boyunluk gerekmez" cümlesini yine anlamadım.
9. **Rapor.** "Uyarıya rağmen devam: yok", "Uygulamanın kararları" ayrı ve artık tek satır. QR ile hekime göstermek kolay.
10. **Hata denemeleri.** Çift dokunuş korunuyor. Yürütücüde geri tuşu sesle duraklatıyor. ❓ (küçük) Tanıtma ekranında geri tuşuna basıp "Kal" deyince ölçüm yine sıfırlanıyor ve "Başla"ya yeniden dokunmak gerekiyor.

**Ölçümler** (panelsiz koşu, gerçek zaman, sahte ses 65 ms/karakter):
- **Süre:** ilk açılıştan manevra başlangıcına 9,3 dk. Bunun içinde tam listeyi yavaş dinlemek var (70 sn). "🐢" bir kez basılınca sonraki bütün konuşmalar ~%25 yavaşladı; bu benim için iyi ama süreyi uzattı. Tam listeyi dinlemeseydim yaklaşık **8 dk** sürerdi (tur-2: ≈8 dk).
- **Dokunuş:** ilk açılıştan manevraya **13** (🐢 dahil, boşa giden yok).
- **Karışıklık:** **3 an** (tur-1: 10, tur-2: 5).
- **Ses:** 86 cümle, 808 kelime, **0 kesilme**. Demo modundaki koşuda da test giriş cümlesi artık kesilmiyor.
- **Hâlâ zor kelimeler:** KBB, aciliyet, değerlendirme, sırtüstü, sarkık, doğrulup, sönsün, "uyku pozisyonu kısıtlaması", boyunluk. Yürütücü göstergesinde "sağa 45°", "Baş sarkıklığı", "Çene göğse" yazıları da duruyor.

## 3. 2. kullanımdaki isteklerim
| # | 2. kullanımdaki isteğim | Durum | Kendi gözümle |
|---|---|---|---|
| 1 | Ana ekran tanı kartı: "Bilmiyorum" Ayarlar'a atmasın, "Tanı girilmedi" kalksın | **Karşılandı** | Kart bağlantının arkasında; "Doktor söylemedi" kartı kapatıyor; kulak seçimi sesli onay istiyor |
| 2 | Sonrası/ana ekran: tek satır sonraki adım, sayaçlar yerine yönerge | **Kısmen** | Tek satır "Tekrar testi 23:14 — uyanınca…" geldi (büyük düğmede de); ama iki ayrı "önerilen en fazla 3" satırı ve uzun yeşil paragraf duruyor |
| 3 | Uyarı en üstte tek kısa cümle; liste kısa | **Kısmen** | Listenin ilk sesi kısa ve otomatik; "Yanlış dokundum, listeye dön" eklendi. Uyarı metni hâlâ 70 kelime. 5 maddeye indirme klinik ekip kararıyla yapılmadı |
| 4 | "Nasılsınız"a yüz simgesi ve numara; alt tipe çizim | **Karşılandı** (alt tip çizimi hariç) | ① 🙂 ② 😐 ③ 🤢 ④ ⚠️ var; alt tip sorusunda çizim yok, ama ses yetiyor |
| 5 | Yürütücü başlıkları gündelik | **Karşılandı** | "Manevra · sağ", "Sol yanınıza dönün", "SAĞINIZ / SOLUNUZ". Göstergede "sağa 45°" artığı kaldı |
| 6 | Tanıtmada "Kal" kaldığı yerden sürsün | **Karşılanmadı** | Hâlâ "Başla"ya yeniden dokunmak gerekiyor |
| 7 | Kurulumda "Yukarıdaki metni okudum" ↔ metin altta | **Karşılanmadı** | Uzun onay metni hâlâ kutunun altında |
| 8 | Demo modunda giriş cümlesi kesilmesin | **Karşılandı** | Demo koşusunda "Önce sağ, sonra sol…" kesilmeden okundu |
| — | Arapça (tur-1'den) | Karşılanmadı | Sentezde "sonraki sürüm" diye yazılmış |

## 4. Kalan ve yeni sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Orta | Ana ekran atak kartı | "Bugün: 1 manevra tamamlandı · önerilen en fazla 3" ile "Gün: 1. gün (önerilen en fazla 3)" alt alta duruyor; bugün tekrar yapmam gerektiğini sandım. | Tek satır yeter: "Bugün başka manevra yok; önce tekrar testi". Gün ve doz sayıları rapora kalsın. | Evet (`shots-a/32`) |
| 2 | Düşük | Sonraki adım satırı (bitiş ekranı ve ana ekran düğmesi) | 22:13'te "Tekrar testi 23:14 — uyanınca 'Başım dönüyor'a basın" yazıyor. Uyanık olan biri sabahı bekleyebilir. | "23:14'te (uyuyorsanız uyanınca) 'Başım dönüyor'a basın". | Evet |
| 3 | Düşük | Uyarı ekranı (kulak) | 70 kelimelik metin. KBB ve aciliyet sözcükleri var. | En üstte tek cümle: "Bugün kulak doktoruna gidin", ayrıntı katlı. "KBB" yerine "kulak doktoru". | Evet (`shots-b/03`) |
| 4 | Düşük | Bitiş ekranının yeşil kartı | Paragraf uzun: "Uyku pozisyonu kısıtlaması ya da boyunluk gerekmez" gibi cümleler var. | İki kısa satır: "10 dakika oturun." / "Kalkarken tutunun." Gerisi "Ayrıntıyı dinle" altında. | Evet |
| 5 | Düşük | Yürütücü göstergesi | Başlıklar düzelmiş; ama göstergede "sağa 45°", "Baş sarkıklığı", "Çene göğse" yazıyor. | Göstergede "sağa yarım", "baş geride" gibi gündelik sözler ya da yalnız ok. | Evet (`shots-a/27`) |
| 6 | Düşük | Tanıtma ekranında geri tuşu | "Kal" seçince ölçüm sıfırlanıyor. | "Kal" ölçümü kendiliğinden yeniden başlatsın. | Evet |
| 7 | Düşük | Kurulum | Kutu "Yukarıdaki metni okudum" diyor ama uzun onay metni kutunun altında kalıyor. | "Bu metni okudum" denmeli, ya da metin kutunun üstüne alınmalı. | Evet |

Not: Yürütücüdeki "Ekran açık tutulamıyor" uyarısını yine test ortamında gördüm (ekranı açık tutma desteği yok); gerçek telefonda doğrulanmadı.

## 5. Puanlar
- **Sezgisellik: 8/10** (tur-1: 5, tur-2: 7). Birçok ekranda sesin ne yapacağımı söylemesi ve doğru düğmenin büyük, yeşil ve numaralı olması yetti. Okumak zorunda kaldığım tek yer ana ekrandaki sayaçlar ve uyarı metni.
- **Genel memnuniyet: 9/10** (tur-1: 6, tur-2: 8). Yanlış dokunuşlarım için "Evet / Hayır" onayı ve "Yanlış dokundum" düğmesi var; testte hiçbir talimat kesilmedi; sonrası yüz simgeli.
- **Bir yakınıma önerir miyim, kullanır mıyım?** Evet, kullanırım. Türkçesi zayıf arkadaşlarıma da tek başına kullanmaları için öneririm. Arapça gelirse daha da iyi olur.
