# k05 — Fatma, 61, köyde, okuması yavaş (tur-1)

## 1. Ben kimim, ne yapmaya çalıştım
Fatma'yım. İlkokul mezunuyum, yavaş okurum, doktor kelimelerini bilmem. Kasabadaki KBB doktoru "sağ arka kanal BPPV" dedi,
reçete QR'ı verdi. Oğlum kurdu, şimdi şehirde. Ucuz Android telefonla, interneti kesik kesik çeken evde baş dönmem tutunca tek başıma manevrayı yapmak istedim.

## 2. Yaşadıklarım (Pixel 7 öykünümü, CPU 4 kat yavaş, yavaş ağ, sonra ağ yok, yazı "Çok büyük", sahte Türkçe ses kaydı)
1. **QR → reçete ekranı** (yavaş ağda 4,3 s'de açıldı). "SAĞ arka kanal BPPV", "Epley", "Doz" yazıyor; anlamadım ama doktorun adını görünce "Reçeteyi kabul et"e bastım.
2. **Kurulum 1:** Yazıyı "Çok büyük" yaptım, iyi oldu. Kutuyu görmeden "Devam"a bastım; sayfa onay kutusuna kaydı, yeşil düğmenin altında
   "onay kutusunu işaretleyin" yazıyor. Onay cümlesi 6 satır: "odyolog", "tıbbi cihaz onayı", "araştırma prototipi"… Okuyamadan işaretledim.
3. **Kurulum 2 "Sizin için uygun mu?"**: 11 madde, çok uzun sayfa. "Ankilozan spondilit, kifoskolyoz, karotis, retina dekolmanı,
   instabilite, gebe"yi bilmiyorum. Boynumda kireçlenme var ama "ileri" mi bilmem. Alttaki yazı "Hiçbiri bana uymuyor'u işaretleyin" deyince onu işaretledim.
   Bu ekranların hiçbiri sesli okunmuyor.
4. **İnternet yokken:** Uygulama hem yeniden yüklemede hem yeni sekmede açıldı (0,2 s), atak ve manevra ağsız sonuna kadar gitti. Çok iyi.
5. **"Baş dönmem başladı" → 11 güvenlik sorusu:** Her soru sesli okunuyor; buna sevindim. Ama "Hayır, yok" düğmesine 0,6 s sonra
   basılabiliyor; ben alışıp ses bitmeden basınca soru %10'unda kesilip sonrakine geçti (a-ses.txt). Soruyu yeniden dinletecek düğme yok.
   5. soruda yanlışlıkla "Evet"e bastım: "Yanlış dokundum, soruya dön" beni kurtardı (bu ekran sesli değil).
   7. soruda telefonun **geri tuşuna** bastım: ana ekrana attı, 6 yanıtım gitti, 11 soruya baştan başladım; hiç uyarı yok.
6. **"Muayeneden bu yana baş dönmeniz hiç tamamen geçti mi?"** (sesli değil): "hiç… tamamen… geçti mi" karıştı; "Hayır, hiç geçmedi"yi seçtim → test yok, doğrudan manevra.
7. **Hazırlık** (sesli değil): Resim iyi. 4 madde okuyup "Hazırım". **Tanıtma**: "Başla"dan sonra her şey sesli; "Sesi dene" düğmesi iyi.
8. **Manevra (gerçek hız, b-ses.txt):** Telefon alnımdayken hiçbir cümle kesilmedi, sessiz boşluk yok, her adımdan sonra "Bu adım tamam",
   10 s'de bir "… saniye kaldı". Baş dönmemde ekrana dokundum, "geçti olarak işaretlendi, 30 saniye daha" dendi. Ama 2. adım cümlesi 17 s ve 4 iş
   birden istiyor; "45 derece", "sarkık", "yarı yolda" kafamı karıştırdı (titreyerek yatıyorum, aklımda tutamam).
9. **Sonrası:** "Ekrandaki soruyu yanıtlayın: şu an nasılsınız?" deniyor; 4 seçenek **okunmuyor**, gözlüğümü arayıp okudum.
   "Manevra tamamlandı… 03:10 civarında tekrar testi" ekranı okunuyor. "Takvime hatırlatıcı ekle" bir dosya indiriyor; ne olduğunu bilmem, alarm kuramam.
10. **1 saat sonra tekrar testi:** Ana ekranda büyük düğme, kısa test, "Test baş dönmesini tetiklemedi. Şimdilik … tetiklenmedi" (iki kez aynı şey; "tetiklemek"i bilmem).
11. **Yanlış anlama denemeleri (c-*.png):** "Yatakta sağa-sola dönerken" seçince (benim baş dönmem gerçekten yatakta dönerken başlıyor) turuncu
    büyük "Evet, en çok dönerken" düğmesi öne çıkıyor → bassam hekime kilit. Son soruda "BPPV'den FARKLI mı?"ya "Evet, farklı" deyince
    (BPPV'yi bilmediğim için) atak kilitlendi, "Önce hekiminizle görüşün" kaldı. "Manevra yapmayın / 112" ekranları da **sesli değil**.

## 3. Sorunlar

| # | Önem | Yer | Ne oldu | Ne isterdim (somut) | Doğrulandı mı |
|---|---|---|---|---|---|
| 1 | Yüksek | Kırmızı bayrak `fever` (safety.ts:91) | "…sıvı alamıyor **musunuz**?" olumsuz soru; köyde "Hayır" = "hayır, alamıyorum" diye de denir → asıl tehlikeli yönde (kusan hasta "Hayır, yok") yanlış yanıt riski | Olumlu kur: "Bugün ateşiniz var mı, ya da içtiğiniz suyu bile kusuyor musunuz?" | Evet (ekran c-03) / yorum |
| 2 | Yüksek | `neuro` (safety.ts:35) | Tek soruda 6 belirti; yavaş okuyan biri birini kaçırır, ses de kesilirse "Hayır"a basar (az yönlendirme riski) | 2–3 kısa soruya böl ("Gözünüz çift görüyor mu?", "Konuşmanız ya da yutmanız bozuldu mu?", "Yüzünüzde, kolunuzda, bacağınızda güçsüzlük/uyuşma var mı?") ya da her belirtiyi resimle göster | Evet (a-09) |
| 3 | Yüksek | `anticoag` (safety.ts:56) | "Kan sulandırıcı ilaç kullanıyorsanız:" koşullu; aspirin/Coraspin kullandığımı "kan sulandırıcı" saymam → yanlış "Hayır" | Örnek ilaç adları ekle ("Coraspin/aspirin, Coumadin, Xarelto, Eliquis gibi"); kullanmıyorsa ne diyeceği belli olsun | Evet (a-12) |
| 4 | Yüksek | Soru ekranları (EpisodeFlow.tsx:636, Controls.tsx:74) | Ses bitmeden 0,6 s sonra yanıt verilebiliyor; alışkanlıkla "Hayır" basınca soru %9–28'de kesiliyor; yeniden dinleme yok | Büyük "Soruyu tekrar dinle (hoparlör simgesi)" düğmesi; ilk okumada yanıt düğmeleri ses bitene dek (ya da en az 3 s) soluk | Evet (a-ses.txt CUT satırları) |
| 5 | Yüksek | Sesli olmayan ekranlar: kurulum, `rxSame`(730), alt tip (754), taraf sorusu, hazırlık (705), `redflagConfirm` (643), `stop` (670), "Şu an nasılsınız?" seçenekleri (1221) | Okuyamayan kişi tam karar anlarında yalnız kalıyor; özellikle 112/hekim ekranı sessiz | Her soru/seçim ekranında başlık + seçenekler sesli okunsun ("Birinci: İyiyim. İkinci: …"); durdurma ekranı "Manevra yapmayın, 112'yi arayın" diye konuşsun | Evet (ses kaydında bu ekranlarda konuşma yok) |
| 6 | Orta | `same` (safety.ts:100) | "BPPV" bilmiyorum, "FARKLI mı?" ters soru; "Evet, farklı" dersem atak kilitlenir, tek başıma tedavi bitiremem | BPPV yerine "doktorun kristal oynaması dediği baş dönmesi"; parantezi kısa ayrı cümle yap | Evet (c-04, c-15) |
| 7 | Orta | Alt tip "Yatakta sağa-sola dönerken" (EpisodeFlow.tsx:800) ve onay ekranı | Arka kanal hastası da "yatakta dönünce" der; onayda turuncu büyük düğme "Evet, en çok dönerken" → gereksiz kilit; "yatay kanal BPPV", "odyolog" anlaşılmıyor | Seçeneği somutlaştır: "Sırtüstü yatarken yalnız başımı sağa-sola çevirince" ; onayda iki düğme aynı görünüşte, metin sade | Evet (c-05, c-06) |
| 8 | Orta | `continuous` (safety.ts:28) | Atak sonrası saatlerce süren sersemliği "şiddetli dengesizlik saatlerdir" sanıp "Evet" → acil + kilit | "Hiç kıpırdamadan otururken bile etraf saatlerdir dönüyor mu? (Atak sonrası hafif sersemlik sayılmaz)" | Hayır (yorum) |
| 9 | Orta | Kurulum "Sizin için uygun mu?" (Onboarding.tsx:254) | 11 tıbbi madde, sesli değil; ipucu "Hiçbiri bana uymuyor'u işaretleyin" anlamadan geçmeye itiyor | Maddeleri gündelik dille ("Boyun ameliyatı oldum ya da boynumu çeviremiyorum" vb.) ve sesli; ipucu "Size uyan yoksa en alttakini seçin; emin değilseniz doktorunuza sorun" | Evet (a-05) |
| 10 | Orta | Soru akışında telefon geri tuşu | 7. soruda geri tuşu ana ekrana attı, 6 yanıt silindi, uyarısız | Geri tuşu bir önceki soruya dönsün (ekrandaki ‹ gibi) ya da "Sorulardan çıkılsın mı?" sorsun | Evet (a-16) |
| 11 | Orta | Manevra cümleleri (protocols.ts ep-1, ep-2, ep-3) | 17 s'lik cümleler, "45 derece", "sarkık", "yarı yolda"; adımın hepsini aklımda tutamıyorum | Cümleyi 2–3 kısa parçaya böl, her biri sonrası kısa ara; derece yerine "çeneniz omzunuza doğru, yarıya kadar" gibi tarif | Evet (b-ses.txt) |
| 12 | Düşük | Hatırlatıcı (reminders.ts:60) | .ics dosyası iniyor; ne yapacağımı bilmiyorum | "Saat 03:10'da alarm kurmak için dokunun" (Android'de saat uygulaması intent'i) ya da uygulama açıkken sesli/titreşimli bildirim | Kısmen (kod) |
| 13 | Düşük | Sonuç metinleri | "tetiklemedi", "Aktif atak", "Taraf", "odyoloğunuz" | "Baş dönmesi gelmedi", "Şu anki atak", "Hasta kulak: sağ", "doktorunuz" | Evet |
| 14 | Düşük | Ses hızı varsayılanı (types.ts:147) | Konuşma hızı "Normal"; kurulumda sorulmuyor | İlk kurulumda yazı boyutunun yanında "Konuşma hızı: Yavaş / Normal" ve örnek ses | Evet |

**Anlamadığım kelimeler → yerine:** kontrendikasyon (ekranda yok, iyi) · BPPV → "kristal oynaması" · kanal/arka kanal → (hiç gösterme) ·
taraf → "hangi kulak" · manevra → "baş çevirme hareketi" · odyolog → "kulak doktoru / işitme uzmanı" · tetiklemek → "başlatmak" ·
kalibrasyon/tanıtma → "telefonu alnınıza alıştıralım" (bu iyi) · sensör → "telefon" · sarkık → "başınız yastıktan biraz aşağı düşsün" ·
45 derece → "yarıya kadar" · instabilite, ankilozan spondilit, kifoskolyoz, karotis, retina dekolmanı, gebe → gündelik karşılıklar ·
nistagmus (hastada yok, iyi) · "prototip", "tıbbi cihaz onayı" → "Bu uygulama doktorun yerine geçmez; deneme aşamasında".

## 4. Sevdiklerim
- Telefon alnımdayken her şey sesli, gerçek hızda **hiç cümle kesilmedi**, sessiz boşluk yok; "ekranın her yerine dokun" çok kolay.
- **İnternet yokken de** açılıp manevrayı sonuna kadar yaptırdı.
- "Yanlış dokundum, soruya dön" ve yazı boyutunun ilk ekranda sorulması.

## 5. Memnuniyet: 6/10
Manevrayı sesle sonuna kadar yaptırıyor ve internetsiz çalışıyor; ama karar anlarındaki soru ekranları okunmuyor ve tıbbi kelimelerle dolu,
yanlış yanıt verip ya kilitlenirim ya da tehlikeli bir belirtiyi kaçırırım. Bir yakınıma "yanında biri varken" öneririm, tek başına değil.

Ekran görüntüleri ve betikler: `scratchpad/kullanicilar/tur-1/k05-okuma-guclugu/` (a-akis, b-gercek-hiz, c-yeni-atak; *-ses.txt ses kayıtları).
