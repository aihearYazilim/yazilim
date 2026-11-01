# y03 — Türkçesi zayıf kullanıcı (Rania, 38, terzi) · tur-2

## 1. Ben kimim, ne yapmaya çalıştım
Aynı Rania'yım: konuşulan Türkçeyi anlarım, yavaş okurum, simgeye ve renge güvenirim. Tanım yok; ASM hekimi "BPPV olabilir" dedi.
Yeni sürümü Pixel 7 öykünümünde baştan sona yine kullandım: ilk açılış, kurulum, atak, iki test, Epley, sonrası ve rapor.
Bu kez **demo paneli olmadan**, gerçek sensör yoluyla denedim: `devicemotion` olayları üreten bir "sanal baş" kullandım. Rania gibi sesi dinledim, sonra hareket ettim.
Betikler `scratchpad/yeni-kullanicilar/tur-2/y03-turkcesi-zayif/` altında:
- `person.cjs`: panelsiz uçtan uca koşu (`shots-p5/`).
- `drive.cjs`: demo modunda koşu (`shots-rt/`).
- `extra.cjs`: hata denemeleri (`shots-b/`).
- `bilmiyorum.cjs`: ana ekrandaki "Bilmiyorum" bağlantısı.

## 2. Akış günlüğü (❓ = ne yapacağımı bilemedim)
1. **Karşılama.** Ses "Baş dönmesi yaşıyorsanız üstteki büyük düğmeye dokunun" diyor. Kartta da "Tanınız olmasa da kullanabilirsiniz" yazıyor. Duraksamadım.
2. **Kurulum.** Ses ne yapacağımı söylüyor. Tek onay kutusu "Başla"nın hemen üstünde. "Başla" kutu işaretlenmeden soluk görünüyor. Yine de dokundum; bu kez onay kutusu renklenip gösterildi. 3 dokunuşta geçtim, boşa giden yok. (Küçük not: kutuda "Yukarıdaki metni okudum" yazıyor ama uzun metin kutunun altında kalıyor.)
3. **Ana ekran.** Büyük "Başım dönüyor" yine iyi. ❓ Yeni "Doktorunuz hangi kulak dedi? Sağ kulak / Sol kulak / Bilmiyorum" kartı var. Doktorum kulak söylemedi, "Bilmiyorum"a dokundum. Beni koca Ayarlar sayfasına götürdü (konuşma hızı, tema, demo modu, yedek…); kayboldum, geri tuşuyla döndüm. ❓ "Deneme manevrası (baş dönmesi yokken)" yazısının ne olduğunu hâlâ bilmiyorum.
4. **Güvenlik soruları.** Her maddenin başında simge var (👁️ 💪 ❤️ 👂 💊 🌡️) ve kelimeler gündelik ("yutkunmada zorluk", "kanı sulandıran ilaç", "kulaktan sıvı gelmesi"). Çoğunu anladım. "🐢 Daha yavaş" ile listeyi dinledim: 71 sn, 13 madde, yine uzun. Bir maddeyi işaretleyince ses "İşaretlendi: …" diye söylüyor; çok iyi. Uyarı ekranında büyük yeşil düğme artık "Durdur ve raporu göster". "Yine de devam et" çerçeveli, ikincil ve konuşma bitene dek geri sayıyor. Renge bakınca doğru düğmeyi buldum. Uyarı metni hâlâ 70 kelime: "KBB", "aciliyete", "değerlendirmesinden".
5. **"Ne başlatıyor?" sorusu.** İlk saniyelerde seçenekler artık gri değil; altta yeşil bir dolma çubuğu var, "bekle" demek olduğunu anladım. Resim hâlâ yok ama sesli okuma yetti.
6. **Hazırlık.** Çizim, kısa 4 madde, altta sabit "Hazırım". "Kim yapıyor", işitme cihazı gibi ayrıntılar katlanmış. İyi.
7. **Telefonu tanıtma.** Sesi dinleyip yaptım: alnıma koydum, 3-2-1, başımı geriye yatırdım, 2-1, "telefon tanındı". Hiç bakmadan geçtim.
8. **İki test.** Yatma talimatı artık **"Baş dönmesi başlarsa ekrana dokunun…"** ile başlıyor. Yattığımda da "Tamam, böyle kalın. Baş dönerse ekrana dokunun." diyor. Başım dönünce ne yapacağımı biliyordum; dokundum, "Baş dönmesi işaretlendi" dedi. Panelsiz koşuda **hiçbir cümle kesilmedi** (87 cümlenin 0'ı). "Önce sağ, sonra sol tarafı test ediyoruz…" girişi de sonuna kadar okundu.
9. **Karar ve Epley.** "Sağ tarafta baş dönmesi oldu… ekranın herhangi bir yerine dokunun" ve kocaman "Dokunun": kolay. Manevra adımları sesle, kesilmeden geldi.
10. **Sonrası.** ❓ "Şu an nasılsınız?" seçeneklerinde hâlâ yüz simgesi ya da renk yok. "Manevra tamamlandı" ekranı yine uzun ("05:44 civarında… Test saati gece… uyuyacaksanız…"). Ses kısaldı: "Saat 06:21 civarında tekrar test edeceğiz." ❓ Ana ekranda "1 / 3 manevra" ve "1. gün (önerilen en fazla 3)" yine yazıyor; bugün tekrar mı yapacağım, bilmiyorum.
11. **Rapor.** "Uyarıya rağmen devam: yok" ve ayrı bir "Uygulamanın kararları" bölümü var; korkutmuyor. Aynı karar iki kez yazılmış ama bu benim için önemsiz.
12. **Hata denemeleri.** Çift dokunuş korunuyor. Yürütücüde geri tuşu manevrayı sesle duraklatıyor. Tanıtma ekranında geri tuşunda "Kal" deyince ölçüm yine baştan başlıyor ve "Başla"ya yeniden dokunmak gerekiyor (değişmemiş).

**Ölçümler** (panelsiz koşu, gerçek zaman, sahte ses 65 ms/karakter):
- **Süre:** ilk açılıştan "Başım dönüyor"a 49 sn. Oradan manevra başına 380 sn; 🐢 ile liste dinlemesi eklenince ≈ 450 sn. İlk açılıştan manevraya toplam **≈ 8 dk**; tur-1'de tahminim 11–12 dk idi.
- **Dokunuş:** ilk açılıştan manevraya **13** (tur-1'de 15/16). Boşa giden 1: kapalı "Başla".
- **Karışıklık:** **5 an** (tur-1'de 10).
- **Ses:** 87 cümle, 627 kelime, **0 kesilme**. Demo modundaki koşuda yalnız giriş cümlesi kesildi (KES@3,0 sn): demo modunda başlangıç cümlesi beklenmiyor. Bu, demo yoluna özgü.
- **Hâlâ anlamadığım kelimeler:** BPPV, manevra, odyolog, KBB, aciliyet, değerlendirme, sırtüstü, sarkık/sarksın, doğrulup, sönsün, Dix-Hallpike, Epley, "45°", "HASTANIN SAĞI", uyku pozisyonu kısıtlaması, boyunluk.

## 3. 1. kullanımdaki isteklerim
| # | 1. kullanımdaki isteğim | Durum | Kendi gözümle |
|---|---|---|---|
| 1 | Yatma talimatı kesilmesin, "dokun" önce söylensin | **Karşılandı** | Talimat "dokunun" ile başlıyor, varışta hatırlatılıyor; panelsiz koşuda 0 kesilme |
| 2 | Uyarıda güvenli seçenek dolu ve renkli, "Yine de" ikincil | **Kısmen** | Renk ve sıra doğru, geri sayım var; metin hâlâ 70 kelime, tek kısa cümle yok |
| 3 | Güvenlik listesine simge, gündelik dil, madde madde sorma | **Kısmen** | Simgeler, gündelik dil ve "İşaretlendi: …" sesi var; madde sayısı hâlâ 13, yavaş dinleme 71 sn, madde madde "Var/Yok" yok |
| 4 | Kurulumda soluk "Başla", tek kutu, kısa onay | **Karşılandı** | Tek kutu, soluk düğme, dokununca kutu gösteriliyor |
| 5 | Karşılama ve ana ekranda "tanı şart değil" | **Kısmen** | Karşılama düzeldi; ana ekranda "Tanı girilmedi" duruyor ve "Bilmiyorum" Ayarlar'a atıyor (yeni sorun) |
| 6 | Seçeneklere resim, yüz simgesi; kilitte gri görünmesin | **Kısmen** | Gri yerine dolma çubuğu geldi; resim ve yüz simgesi yok |
| 7 | Sonrası ve ana ekranda tek satır tekrar test, sayaçlar yerine yönerge | **Karşılanmadı** | Ekran metni aynı; "1 / 3 manevra, 1. gün (en fazla 3)" duruyor (yalnız ses kısaldı) |
| 8 | Yürütücü başlığında teknik adlar yerine çizim | **Karşılanmadı** | "Dix-Hallpike · sağ", "45°", "HASTANIN SAĞI" duruyor |
| 9 | Giriş cümlesi kesilmesin | **Karşılandı** | Gerçek sensör yolunda sonuna kadar okunuyor (demo modunda hâlâ kesiliyor) |
| 10 | Raporda "uyarıya rağmen" ile uygulama kararı ayrı yazılsın | **Karşılandı** | "Uyarıya rağmen: yok" ve ayrı "Uygulamanın kararları" bölümü |
| 11 | Tanıtmada "Kal" kaldığı yerden sürsün | **Karşılanmadı** | Hâlâ "Başla"ya yeniden dokunmak gerekiyor |
| 12 | Akışta "daha yavaş konuş", Arapça | **Kısmen** | Her ekranda "🐢 Daha yavaş" var ve çok işe yarıyor; Arapça yok |

## 4. Kalan ve yeni sorunlar
| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Orta | Ana ekran, tanı kartı | "Doktorunuz hangi kulak dedi?" kartındaki "Bilmiyorum / diğer tanı bilgileri" bağlantısı tam Ayarlar sayfasını açıyor; kayboldum. "Tanı girilmedi… hekime görünmeniz önerilir" cümlesi de duruyor. | "Doktor söylemedi" düğmesi kartı kapatsın. Ayrıntılı tanı girişi ayrı ve küçük bir bağlantı olsun. | Evet (`bilmiyorum.cjs`) |
| 2 | Orta | Sonrası ve ana ekran | Uzun saat metni ("Test saati gece… uyuyacaksanız…") ve "1 / 3 manevra", "1. gün (önerilen en fazla 3)" yazıları. | Saat simgesiyle tek satır: "Tekrar test 06:21 (uyuyorsan sabah)". Sayaçların yerine "Bugün başka manevra yok, önce test". | Evet |
| 3 | Orta | Uyarı ekranı ve güvenlik listesi | Uyarı metni 70 kelime. Liste 13 madde, yavaş okunuşu 71 sn. | Uyarının en üstünde tek kısa cümle ("Bugün kulak doktoruna git"), ayrıntısı katlanmış. Listede ilk 5 hayati madde, gerisi "Başka bir şey var mı?" altında. | Evet |
| 4 | Düşük | "Şu an nasılsınız?", alt tip sorusu | Seçeneklerde yüz simgesi ya da çizim yok. | 🙂 yeşil, 😐 sarı, 🤢, ⚠ kırmızı simgeler; alt tipte yatma ve dönme çizimi. | Evet |
| 5 | Düşük | Yürütücü başlığı | "Dix-Hallpike · sağ", "Epley", "45°", "HASTANIN SAĞI" yazıları var; bitince bakınca anlamıyorum. | Adım çizimi ve "Adım 2/5"; teknik adlar rapora kalsın. | Evet |
| 6 | Düşük | Tanıtmada geri tuşu | "Kal" seçince ölçüm sıfırlanıyor, "Başla" yeniden isteniyor. | "Kal" ölçümü kendiliğinden sürdürsün. | Evet |
| 7 | Düşük | Kurulum | Kutu "Yukarıdaki metni okudum" diyor ama uzun onay metni kutunun altında kalıyor. | Kutu "Bu metni okudum" desin ya da metin kutunun üstüne gelsin. | Evet (görüntü) |
| 8 | Düşük | Demo modu | Demo modunda "Önce sağ, sonra sol…" girişi 3. saniyede kesiliyor (gerçek sensörde kesilmiyor). | Demo yolu da başlangıç cümlesini beklesin (tanıtım ve eğitimde aynı deneyim). | Evet (`drive.cjs`) |

Not: Yürütücüdeki "Ekran açık tutulamıyor" uyarısını yine test ortamında gördüm (wake lock yok); gerçek telefonda doğrulanmadı.

## 5. Puanlar
- **Sezgisellik: 7/10** (tur-1: 5). Telefon alında geçen bölümün tamamı artık sesle ve kesintisiz anlaşılıyor; renkler doğru yolu gösteriyor. Yazı yoğun yerler (ana ekran tanı kartı, sonrası, uyarı metni) hâlâ zor.
- **Genel memnuniyet: 8/10** (tur-1: 6). En korktuğum şey düzeldi: "Başın dönerse dokun" sözünü duydum ve testi doğru yaptım. 🐢 düğmesi benim için çok değerli.
- **Bir yakınıma önerir miyim, kullanır mıyım?** Evet, kullanırım. Türkçesi benim gibi olan bir arkadaşıma da öneririm; yalnız "ana ekrandaki kulak sorusunu boş geç" diye söylerim.
