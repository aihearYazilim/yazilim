/**
 * Hasta modu güvenlik kuralları.
 * Kaynak: docs/KLINIK-PROTOKOL.md §Güvenlik (proje planı §1.2, §2.3, §2.4).
 */
import type { Side } from './protocols';

// ---------------------------------------------------------------------------------------------
// Kırmızı bayraklar (her seansta)
// ---------------------------------------------------------------------------------------------

export type StopAction = 'emergency' | 'doctor';

export interface RedFlagQuestion {
  id: string;
  /** Ekrandaki tam soru (ilaç adları, parantezli açıklamalar dahil). */
  text: string;
  /**
   * Sesli okunan kısa biçim (kullanıcı turu 2: ilaç listesi ve parantezler yalnız ekranda; "/" okunmaz). Yoksa `text` okunur.
   * Kısa biçim sorunun her belirtisini yine anar; yalnız örnekler ve açıklamalar ekranda kalır.
   */
  spoken?: string;
  /** Kısa ad (kilit kartında "durdurma nedeni" ve hekime sorulacak cümlede). */
  label: string;
  /** Sorunun altında, ekranda gösterilen açıklama (ör. KBB değerlendirmesinden sonra nasıl yanıtlanır). */
  hint?: string;
  /** Hangi yanıt durdurur? */
  stopsOn: 'yes' | 'no';
  action: StopAction;
  /** Durunca kullanıcıya gösterilecek açıklama. */
  why: string;
  /** Hekime yönlendirmede kime başvurulacağı (durdurma ekranının alt satırı; `why` ile tutarlı). Yoksa genel metin. */
  refer?: string;
  /** Kilit kartında önerilen, hekime sorulacak cümle. Yoksa `redFlagDoctorAsk` genel cümle kurar. */
  doctorAsk?: string;
  /** Soruya uyan yanıt etiketleri (varsayılan "Evet, var" / "Hayır, yok"). */
  yesLabel?: string;
  noLabel?: string;
}

/**
 * Soru dili (kullanıcı turu 1): her soru olumlu kurulur ve "Evet" her zaman "bu belirti bende var" demektir (çift olumsuz
 * yok); uzun sorular kısa sorulara bölünür (bölünen soru, eski sorunun her belirtisini korur). Güvenli yanıt hep "Hayır"dır.
 * Kullanıcı turu 2: BPPV hastası kendi baş dönmesini işaretleyip gereksiz yere kilitlenmesin diye ortostatik ve yürüme
 * sorularına niteleyici eklendi (belirti düşmedi; durdurma anlamı aynı).
 */
export const RED_FLAGS: RedFlagQuestion[] = [
  {
    id: 'continuous',
    text: 'Hiç kıpırdamadan otururken ya da yatarken bile etrafınız saatlerdir dönüyor mu, ya da saatlerdir ayakta duramayacak kadar dengesiz misiniz? (Ataktan sonra kalan hafif sersemlik sayılmaz.)',
    spoken:
      'Hiç kıpırdamadan otururken ya da yatarken bile etrafınız saatlerdir dönüyor mu, ya da saatlerdir ayakta duramayacak kadar dengesiz misiniz? Ataktan sonra kalan hafif sersemlik sayılmaz.',
    label: 'sürekli baş dönmesi ya da dengesizlik',
    stopsOn: 'yes',
    action: 'emergency',
    why: 'BPPV baş dönmesi yalnızca baş hareketiyle başlar ve saniyeler sürer. Sürekli baş dönmesi başka, acil bir nedene bağlı olabilir.'
  },
  // Eski tek "nörolojik belirti" sorusu üçe bölündü (çift görme/konuşma/yutma · güçsüzlük/uyuşma · yürüyememe).
  {
    id: 'neuro',
    text: 'Gözünüz çift görüyor mu, ya da konuşmanız veya yutmanız bozuldu mu?',
    label: 'çift görme, konuşma ya da yutma bozukluğu',
    stopsOn: 'yes',
    action: 'emergency',
    why: 'Çift görme, konuşma ya da yutma bozukluğu inme gibi acil bir durumun işareti olabilir. Hemen 112\'yi arayın.'
  },
  {
    id: 'neuroWeak',
    text: 'Yüzünüzde, kolunuzda ya da bacağınızda güçsüzlük ya da uyuşma var mı?',
    label: 'yüzde, kolda ya da bacakta güçsüzlük veya uyuşma',
    stopsOn: 'yes',
    action: 'emergency',
    why: 'Yüzde, kolda ya da bacakta güçsüzlük veya uyuşma inme gibi acil bir durumun işareti olabilir. Hemen 112\'yi arayın.'
  },
  {
    // Kullanıcı turu 2 (k09): şiddetli BPPV atağının ilk dakikalarında hasta da "yürüyemiyorum" der. Gövde ataksisi baş
    // dönmesinden bağımsızdır: "kıpırdamadan dururken ya da baş dönmesi olmadığı anlarda bile" niteleyicisi (soru kalır).
    id: 'neuroGait',
    text: 'Yürüyemeyecek kadar dengeniz bozuldu mu: başınızı kıpırdatmadan dururken ya da baş dönmesi olmadığı anlarda bile?',
    label: 'baş dönmesi yokken de yürüyememe',
    stopsOn: 'yes',
    action: 'emergency',
    why: 'Baş dönmesi olmadığı anlarda bile yürüyemeyecek kadar denge bozukluğu inme gibi acil bir durumun işareti olabilir. Hemen 112\'yi arayın.'
  },
  {
    id: 'headache',
    text: 'Yeni başlayan ve şiddetli bir baş ağrısı ya da boyun ağrısı var mı?',
    label: 'yeni ve şiddetli baş ya da boyun ağrısı',
    stopsOn: 'yes',
    action: 'emergency',
    why: 'Baş dönmesiyle birlikte yeni ve şiddetli baş ya da boyun ağrısı acil değerlendirme gerektirir.'
  },
  {
    id: 'cardiac',
    text: 'Bu baş dönmesiyle birlikte göğüs ağrısı, çarpıntı ya da bayılma oldu mu?',
    label: 'göğüs ağrısı, çarpıntı ya da bayılma',
    stopsOn: 'yes',
    action: 'emergency',
    why: 'Bu belirtiler kalple ilgili olabilir ve acil değerlendirme gerektirir.'
  },
  {
    // Ortostatik hipotansiyon/presenkop: yaşlıda en sık BPPV taklitçisi (AAO-HNSF 2017 ayırıcı tanı; Bhattacharyya ve ark.
    // Otolaryngol Head Neck Surg 2017;156(3S):S1–S47). Kullanıcı turu 2 (k01, k05, k09): ayırıcı nitelik dönme hissinin
    // YOKLUĞUDUR; yataktan kalkarken başı dönen BPPV hastası "Evet" deyip gereksiz yere kilitlenmesin.
    id: 'orthostatic',
    text: 'Ayağa kalkınca, etrafınız dönmeden gözleriniz kararıyor ya da bayılacak gibi oluyor musunuz? (Yataktan kalkarken etrafın dönmesi sayılmaz; burada dönme hissini değil, göz kararmasını soruyoruz.)',
    spoken: 'Ayağa kalkınca, etrafınız dönmeden gözleriniz kararıyor ya da bayılacak gibi oluyor musunuz? Yataktan kalkarken etrafın dönmesi sayılmaz.',
    label: 'ayağa kalkınca dönme olmadan göz kararması ya da bayılacak gibi olma',
    stopsOn: 'yes',
    action: 'doctor',
    why: 'Ayağa kalkınca etraf dönmeden göz kararması ve bayılacak gibi olma, tansiyon düşmesi ya da kalp ritmiyle ilgili olabilir; kristal oynamasına (BPPV) bağlı değildir. Birkaç gün içinde aile hekiminize ya da dahiliye hekimine başvurun; o zamana kadar yavaş kalkın ve bir yere tutunun. Bayılırsanız ya da göğüs ağrısı olursa hemen 112\'yi arayın.',
    refer: 'Aile hekiminize ya da dahiliye hekimine başvurun ve ayağa kalkınca gözlerinizin karardığını söyleyin.',
    doctorAsk:
      'Ayağa kalkınca, etraf dönmeden gözlerim kararıyor; DengeYol bu yüzden manevrayı durdurdu. Bunun nedeni nedir ve baş dönmem için evde manevra yapmamda sakınca var mı?'
  },
  {
    id: 'anticoag',
    text: 'Kan sulandırıcı ilaç kullanıyorsanız (aspirin/Coraspin, Plavix, Coumadin, Xarelto, Eliquis, Lixiana, Pradaxa gibi): yeni bir baş ağrınız var mı ya da yakın zamanda başınızı çarptınız mı?',
    // İlaç adları yalnız ekranda (k01, k05, k09): seste "aspirin dahil" yeterli.
    spoken: 'Aspirin dahil kan sulandırıcı bir ilaç kullanıyorsanız: yeni bir baş ağrınız var mı, ya da yakın zamanda başınızı çarptınız mı? İlaç adları ekranda yazıyor.',
    label: 'kan sulandırıcı kullanırken yeni baş ağrısı ya da baş çarpması',
    stopsOn: 'yes',
    action: 'emergency',
    noLabel: 'Hayır / bu ilaçları kullanmıyorum',
    why: 'Kan sulandırıcı kullananlarda yeni baş ağrısı ya da baş çarpması kanama açısından acil değerlendirilmelidir.'
  },
  {
    id: 'spontaneous',
    text: 'Başınızı hiç hareket ettirmeden, kendiliğinden başlayan ve dakikalar ya da saatler süren baş dönmesi atakları oluyor mu?',
    label: 'kendiliğinden başlayan uzun baş dönmesi atakları',
    stopsOn: 'yes',
    action: 'doctor',
    why: 'Kendiliğinden gelen ve uzun süren ataklar BPPV\'ye uymaz; Meniere hastalığı ya da vestibüler migren gibi başka nedenler açısından değerlendirilmelisiniz.'
  },
  {
    id: 'headTrauma',
    text: 'Son birkaç hafta içinde başınızı çarptınız mı ya da bir kaza geçirdiniz mi?',
    label: 'son haftalarda baş çarpması ya da kaza',
    stopsOn: 'yes',
    action: 'doctor',
    why: 'Kafa travması sonrası baş dönmesi hekim tarafından değerlendirilmelidir.'
  },
  {
    id: 'ear',
    text: 'Bir kulağınızda YENİ ya da ani başlayan işitme kaybı, dolgunluk (tıkanma), çınlama, kulak ağrısı ya da kulak akıntısı var mı? (Uzun süredir olan ve değişmeyen çınlama sayılmaz.)',
    spoken:
      'Bir kulağınızda yeni ya da ani başlayan işitme kaybı, tıkanma, çınlama, kulak ağrısı ya da kulak akıntısı var mı? Uzun süredir olan ve değişmeyen çınlama sayılmaz.',
    label: 'yeni kulak belirtisi (işitme kaybı, tıkanma, çınlama, ağrı ya da akıntı)',
    // Kullanıcı turu 2 (k03): KBB değerlendirmesinden sonra ne yanıtlanacağı. "Yeni" sözünün anlamını açar; durdurma aynı.
    hint: 'Bir KBB hekimi bu kulak belirtinize baktıysa ve o günden beri artmadıysa artık yeni sayılmaz: "Hayır" deyin. Belirti arttıysa, değiştiyse ya da yeni bir kulak belirtisi eklendiyse "Evet" deyin.',
    stopsOn: 'yes',
    action: 'doctor',
    why: 'Yeni kulak belirtileri kristal oynaması (BPPV) dışında bir kulak sorununu gösterebilir. Ani işitme kaybı ya da yeni kulak dolgunluğu varsa BUGÜN bir KBB hekimine ya da KBB hekimi olan bir hastanenin acil servisine başvurun: erken tedavi işitmeyi kurtarabilir. Yalnız yeni çınlama, ağrı ya da akıntı varsa birkaç gün içinde KBB hekimine başvurun ve bu belirtiyi söyleyin. Manevrayı KBB değerlendirmesinden sonra yapın.',
    refer: 'Yukarıdaki aciliyete göre bir KBB hekimine başvurun ve kulak belirtinizi söyleyin.',
    doctorAsk:
      'Kulağımda yeni bir belirti var (işitme azalması, tıkanma, çınlama, ağrı ya da akıntı); DengeYol bu yüzden manevrayı durdurdu. Bu belirtiyle evde manevra yapabilir miyim? Belirti değişmedikçe uygulamadaki kulak sorusuna "Hayır" diyebilir miyim?'
  },
  {
    id: 'neck',
    text: 'Son bir ay içinde boynunuzu incittiniz mi, boyun travması ya da boyun manipülasyonu (çıtlatma) oldu mu?',
    spoken: 'Son bir ay içinde boynunuzu incittiniz mi, boyun travması ya da boyun çıtlatma oldu mu?',
    label: 'son bir ayda boyun incinmesi, travması ya da çıtlatma',
    stopsOn: 'yes',
    action: 'doctor',
    why: 'Yakın zamanda boyun travması olanlarda baş-boyun manevraları güvenli olmayabilir.'
  },
  {
    // Olumlu kurulur ("…sıvı alamıyor musunuz?" sorusunda "Hayır" iki anlama gelebiliyordu).
    id: 'fever',
    text: 'Bugün ateşiniz var mı, ya da içtiğiniz suyu bile kusuyor musunuz?',
    label: 'ateş ya da su bile içilemeyecek kadar kusma',
    stopsOn: 'yes',
    action: 'doctor',
    why: 'Ateş ya da su bile içilemeyecek kadar kusma, kristal oynaması (BPPV) dışı bir nedeni ya da tedavi gerektiren bir durumu gösterebilir. Bugün hekiminize ya da acil servise başvurun.',
    refer: 'Bugün hekiminize ya da acil servise başvurun ve ateşinizi ya da kusmanızı söyleyin.'
  },
  {
    id: 'same',
    // Soru "farklı mı" diye sorulur: böylece her soruda güvenli yanıt "Hayır" olur (alışkanlıkla yanlış basmayı önler).
    text: 'Bu baş dönmesi, hekiminizin daha önce "kristal oynaması (BPPV)" dediği baş dönmesinden FARKLI mı? Kristal oynamasında dönme hissi yatarken, yataktan kalkarken, yatakta yana dönerken ya da yukarı bakarken başlar ve kısa sürer.',
    // Kısa biçim (k05, k09): açıklama ekranda kalır.
    spoken: 'Bu baş dönmesi, hekiminizin daha önce kristal oynaması dediği baş dönmesinden farklı mı?',
    label: 'öncekinden farklı baş dönmesi',
    stopsOn: 'yes',
    action: 'doctor',
    yesLabel: 'Evet, farklı',
    noLabel: 'Hayır, aynı',
    why: 'Baş dönmeniz, hekiminizin kristal oynaması (BPPV) dediği önceki baş dönmesinden farklıysa yeni bir değerlendirme gerekir.'
  }
];

/** Sesli okunacak soru: kısa biçim ya da tam metin; "/" "ya da" diye okunur (bazı sesler "bölü" der). */
export function redFlagSpoken(q: RedFlagQuestion): string {
  return (q.spoken ?? q.text).replace(/\s*\/\s*/g, ' ya da ');
}

/** Hekime yönlendirmede (acil değilse) varsayılan alt satır. */
export const RED_FLAG_DEFAULT_REFER = 'Hekiminize ya da odyoloğunuza başvurun ve işaretlediğiniz belirtiyi söyleyin.';

/** Durdurma ekranının "ne yapmalı" satırı: acilde 112; değilse durduran soruların `refer` satırları (tekrarsız). */
export function redFlagReferText(action: StopAction, triggered: RedFlagQuestion[]): string {
  if (action === 'emergency') return 'Hemen 112\'yi arayın.';
  const lines = [...new Set(triggered.filter((q) => q.action === 'doctor').map((q) => q.refer ?? RED_FLAG_DEFAULT_REFER))];
  return lines.length ? lines.join(' ') : RED_FLAG_DEFAULT_REFER;
}

/** Kilit kartında hekime sorulacak cümle. */
export function redFlagDoctorAsk(q: RedFlagQuestion): string {
  return (
    q.doctorAsk ??
    `Güvenlik sorusunda "${q.label}" için "Evet" dedim; DengeYol bu yüzden manevrayı durdurdu. Bu durumla evde manevra yapmamda sakınca var mı?`
  );
}

export type YesNo = 'yes' | 'no';

export interface RedFlagOutcome {
  stop: boolean;
  action: StopAction | null;
  triggered: RedFlagQuestion[];
}

export function evaluateRedFlags(answers: Record<string, YesNo | undefined>): RedFlagOutcome {
  const triggered = RED_FLAGS.filter((q) => answers[q.id] === q.stopsOn);
  const action: StopAction | null = triggered.some((q) => q.action === 'emergency')
    ? 'emergency'
    : triggered.length > 0
      ? 'doctor'
      : null;
  return { stop: triggered.length > 0, action, triggered };
}

// ---------------------------------------------------------------------------------------------
// Kontrendikasyonlar (ilk kullanımda ve profil değiştiğinde)
// ---------------------------------------------------------------------------------------------

export interface Contraindication {
  id: string;
  /** Kısa ad: kapı ekranında "sizi engelleyen durum" olarak gösterilir. */
  label: string;
  /** Kurulum listesindeki madde (gündelik dil; tıbbi terim parantez içinde). */
  text: string;
  /**
   * Hasta adına yakını kuruyorsa (yardımcı modu) aynı maddenin yardımcıya göre yazılmış hâli ("Hastanın boynunda…";
   * kullanıcı turu 3, k02). Anlamı `text` ile aynıdır; yalnız özne değişir. Yoksa `text` gösterilir.
   */
  helperText?: string;
  /** Bu maddeye özgü, hekime sorulacak soru. */
  ask: string;
}

export const CONTRAINDICATIONS: Contraindication[] = [
  {
    id: 'age',
    label: '18 yaşından küçük olmak',
    text: '18 yaşından küçüğüm.',
    helperText: 'Hasta 18 yaşından küçük.',
    ask: 'Çocuklarda bu baş dönmesi nasıl tedavi edilir; manevrayı muayenede siz yapabilir misiniz?'
  },
  {
    id: 'neck',
    label: 'Boyun sorunu',
    text: 'Boynumda hastalık var ya da boynumu rahat çeviremiyorum: ör. boyun fıtığı nedeniyle hareket kısıtlılığı, boyun kemiklerinde gevşeklik/kayma (instabilite), ileri kireçlenme ya da yakın zamanda boyun ameliyatı.',
    helperText: 'Hastanın boynunda hastalık var ya da hasta boynunu rahat çeviremiyor: ör. boyun fıtığı nedeniyle hareket kısıtlılığı, boyun kemiklerinde gevşeklik/kayma (instabilite), ileri kireçlenme ya da yakın zamanda boyun ameliyatı.',
    ask: 'Boynumla Epley/Semont yapabilir miyim? Başımı ne kadar çevirip geriye bırakabilirim; değiştirilmiş bir biçim gerekir mi?'
  },
  {
    id: 'spine',
    label: 'Bel/sırt (omurga) sorunu',
    text: 'Bel ya da sırt omurgamda ciddi bir sorun var: ör. omurganın sertleşip kaynaşması (ankilozan spondilit), ağır romatizma (romatoid artrit), ileri kamburluk (kifoskolyoz), omurilik yaralanması ya da yatıp kalkmamı, yan dönmemi kısıtlayan bel/sırt sorunu.',
    helperText: 'Hastanın bel ya da sırt omurgasında ciddi bir sorun var: ör. omurganın sertleşip kaynaşması (ankilozan spondilit), ağır romatizma (romatoid artrit), ileri kamburluk (kifoskolyoz), omurilik yaralanması ya da yatıp kalkmasını, yan dönmesini kısıtlayan bel/sırt sorunu.',
    ask: 'Bel/sırt sorunumla hızlı yatıp kalkmam ve yan dönmem uygun mu?'
  },
  {
    id: 'vascular',
    label: 'Şah damarı darlığı ya da dengesiz kalp hastalığı',
    text: 'Hekimimin bildiği ciddi şah damarı (boyundaki ana damar, karotis) darlığım ya da kontrol altında olmayan (dengesiz) kalp hastalığım var.',
    helperText: 'Hastanın, hekiminin bildiği ciddi şah damarı (boyundaki ana damar, karotis) darlığı ya da kontrol altında olmayan (dengesiz) kalp hastalığı var.',
    ask: 'Damar ya da kalp durumumla başımı çevirip geriye bırakmam güvenli mi?'
  },
  {
    id: 'stroke',
    label: 'Geçirilmiş inme ya da beyin damarı hastalığı',
    text: 'Daha önce inme (felç) geçirdim ya da beyin damarı hastalığım var.',
    helperText: 'Hasta daha önce inme (felç) geçirdi ya da beyin damarı hastalığı var.',
    ask: 'Baş dönmemin başka bir nedeni olabilir mi; manevrayı muayenede mi yapmalıyız?'
  },
  {
    id: 'obesity',
    label: 'Kilo nedeniyle hızlı dönememe',
    text: 'Kilom nedeniyle yatakta hızla yan dönmem ve yüzüstü dönmem çok zor.',
    helperText: 'Kilosu nedeniyle hastanın yatakta hızla yan dönmesi ve yüzüstü dönmesi çok zor.',
    ask: 'Kilom nedeniyle hangi manevra bana uygun; yardımla mı yapmalıyım?'
  },
  {
    id: 'cognition',
    label: 'Yönergeleri takip etmekte güçlük',
    text: 'Unutkanlık ya da dikkat sorunu nedeniyle adım adım verilen yönergeleri takip etmekte zorlanıyorum.',
    helperText: 'Hasta, unutkanlık ya da dikkat sorunu nedeniyle adım adım verilen yönergeleri takip etmekte zorlanıyor.',
    ask: 'Manevrayı bir yakınımla mı, yoksa sizin yanınızda mı yapmalıyım?'
  },
  {
    id: 'eye',
    label: 'Retina sorunu ya da yakın zamanda göz ameliyatı',
    text: 'Gözümde retina yırtılması ya da ayrılması (dekolman) oldu ya da son birkaç ay içinde göz ameliyatı geçirdim.',
    helperText: 'Hastanın gözünde retina yırtılması ya da ayrılması (dekolman) oldu ya da hasta son birkaç ay içinde göz ameliyatı geçirdi.',
    ask: 'Göz durumum hızlı baş hareketlerine engel mi?'
  },
  {
    id: 'pregnancy',
    label: 'İleri dönem gebelik',
    text: 'Hamileliğimin son aylarındayım (ileri dönem gebelik).',
    helperText: 'Hasta hamileliğinin son aylarında (ileri dönem gebelik).',
    ask: 'Gebeliğimde manevrayı hangi biçimde ve nerede yapmalıyım?'
  },
  {
    id: 'mobility',
    label: 'Yardımsız hareket güçlüğü',
    text: 'Yatağa yatıp kalkmakta, yan dönmekte ya da başımı çevirmekte çok zorlanıyorum ve yanımda yardım edecek kimse yok.',
    helperText: 'Hasta yatağa yatıp kalkmakta, yan dönmekte ya da başını çevirmekte sizin yardımınızla da çok zorlanıyor.',
    ask: 'Manevrayı bir yardımcıyla yapabilir miyim, yoksa muayenede mi yapmalıyız?'
  },
  {
    // İşitme kaybı tek başına engel değildir: işitme cihazı/kulaklık (Bluetooth), yardımcı, titreşim ve bip sesleri
    // yönlendirmeyi taşır. Yalnız bunların hiçbiri yoksa kapı kapanır.
    id: 'hearing',
    label: 'Sesli yönergeleri duyamama (yardımcı yok)',
    text: 'Telefondan gelen sesli yönergeleri duyamıyorum; işitme cihazımla ya da kulaklıkla da duyamıyorum ve yanımda yardım edecek kimse yok.',
    helperText: 'Telefondan gelen sesli yönergeleri ne hasta ne de siz duyabiliyorsunuz (işitme cihazı ya da kulaklıkla da).',
    ask: 'Manevrayı yanımda biri varken mi, yoksa muayenede mi yapmalıyım?'
  }
];

/**
 * Tek başına engel OLMAYAN durumlar (kurulum listesinin altında ve kapı ekranında). Kan sulandırıcı kullanan hastaya her
 * atakta ayrıca kanama/baş çarpması kırmızı bayrağı sorulur (RED_FLAGS).
 */
export const CONTRA_NOT_BLOCKING_TEXT =
  'Kan sulandırıcı ilaç (ör. aspirin, varfarin, apiksaban), tansiyon ilacı ve kalça ya da diz protezi tek başına engel değildir. Kan sulandırıcı kullanıyorsanız her atakta ayrıca kanama ve başınızı çarpma sorulur. Düşmemek için manevraları yatakta yapın.';

/** CONTRA_NOT_BLOCKING_TEXT'in yardımcı modu (hasta adına yakını kuruyor). */
export const CONTRA_NOT_BLOCKING_TEXT_HELPER =
  'Kan sulandırıcı ilaç (ör. aspirin, varfarin, apiksaban), tansiyon ilacı ve kalça ya da diz protezi tek başına engel değildir. Hasta kan sulandırıcı kullanıyorsa her atakta ayrıca kanama ve başını çarpma sorulur. Düşmemesi için manevraları yatakta yapın.';

/** Kurulum listesindeki madde metni: yardımcı modunda yardımcıya göre yazılmış hâli. */
export function contraText(c: Contraindication, helper: boolean): string {
  return helper && c.helperText ? c.helperText : c.text;
}

/** Her kontrendikasyonda hekime sorulabilecek genel sorular. */
export const CONTRA_GENERAL_QUESTIONS: string[] = [
  'Bu durumumla ev manevrası yapabilir miyim? Değiştirilmiş bir biçimde mi, sizin gözetiminizde mi yapılmalı?',
  'Manevrayı muayenede siz yapabilir misiniz? Baş dönmesi yeniden başlarsa ne yapmalıyım, nereye başvurmalıyım?'
];

/** İşaretlenen kimliklerden bilinen kontrendikasyonlar (liste sırasıyla; bilinmeyen kimlikler atlanır). */
export function contraindicationsFor(ids: string[]): Contraindication[] {
  return CONTRAINDICATIONS.filter((c) => ids.includes(c.id));
}

/** Kapı ekranı için hekime sorulacak 2–3 soru: önce maddeye özgü (en çok 2), sonra genel sorular. */
export function contraDoctorQuestions(ids: string[]): string[] {
  const specific = contraindicationsFor(ids)
    .map((c) => c.ask)
    .slice(0, 2);
  return [...specific, ...CONTRA_GENERAL_QUESTIONS].slice(0, 3);
}

// ---------------------------------------------------------------------------------------------
// Tanı kapısı ve doz sınırları
// ---------------------------------------------------------------------------------------------

export type CanalAnswer = 'PC' | 'HC' | 'unknown';
export type SideAnswer = Side | 'unknown';

export interface DiagnosisGateInput {
  diagnosedByDoctor: boolean;
  canal: CanalAnswer;
  side: SideAnswer;
  hasPrescription: boolean;
  contraindications: string[];
}

export type GateResult =
  | { ok: true; requireSideTest: boolean }
  | { ok: false; reason: 'NO_DIAGNOSIS' | 'HORIZONTAL_CANAL' | 'CONTRAINDICATION' };

export function diagnosisGate(i: DiagnosisGateInput): GateResult {
  if (i.contraindications.length > 0) return { ok: false, reason: 'CONTRAINDICATION' };
  if (!i.diagnosedByDoctor && !i.hasPrescription) return { ok: false, reason: 'NO_DIAGNOSIS' };
  if (i.canal === 'HC') return { ok: false, reason: 'HORIZONTAL_CANAL' };
  return { ok: true, requireSideTest: i.side === 'unknown' || i.canal === 'unknown' };
}

export const GATE_TEXT: Record<'NO_DIAGNOSIS' | 'HORIZONTAL_CANAL' | 'CONTRAINDICATION', string> = {
  NO_DIAGNOSIS:
    'DengeYol, daha önce hekim ya da odyolog (işitme uzmanı) muayenesiyle kristal oynaması (BPPV) tanısı almış kişilerde, baş dönmesi yeniden başladığında kullanılır. İlk kez yaşadığınız bir baş dönmesinde önce hekim muayenesi gerekir; çünkü baş dönmesinin başka, ciddi nedenleri de olabilir.',
  HORIZONTAL_CANAL:
    'Yatay kanal tipi kristal oynamasının (yatay kanal BPPV) evde kendi kendine tedavisi bu sürümde yok. Manevrayı hekiminizin ya da odyoloğunuzun (işitme uzmanı) yapması gerekir; isterlerse DengeYol\'un klinisyen modunu kullanabilirler.',
  CONTRAINDICATION:
    'İşaretlediğiniz durum nedeniyle baş çevirme hareketlerini (manevraları) evde kendi başınıza yapmanız güvenli olmayabilir. Hekiminiz manevrayı muayenede, kendi gözetiminde ya da size uygun değiştirilmiş bir biçimde yapmayı önerebilir. Bu durumda uygulamadaki ev manevraları kapalı kalır; hekim reçetesi (bağlantı ya da QR) de bunları açmaz.'
};

export interface DoseLimits {
  maxPerDay: number;
  /** Atak başına en fazla gün (bu günden sonra manevra kilitlenir). */
  maxDays: number;
  /** Atak başına en fazla manevra. */
  maxTotal: number;
}

/** Varsayılan (reçetesiz) sınırlar: günde 3, 3 gün, toplam 9 manevra; sonra hekime. */
export const DEFAULT_DOSE: DoseLimits = { maxPerDay: 3, maxDays: 3, maxTotal: 9 };
/**
 * Reçeteyle verilebilecek üst sınırlar. Radtke 2004 ev Epley'ini 1 hafta uygulatmıştır; günde 3 kez dozlama
 * yaygın klinik uygulamadır ancak birincil kaynaktan doğrulanamamıştır (docs/KLINIK-INCELEME.md).
 */
export const MAX_PRESCRIBED_DOSE: DoseLimits = { maxPerDay: 3, maxDays: 7, maxTotal: 21 };

export function clampDose(d: Partial<DoseLimits> | undefined): DoseLimits {
  const perDay = Math.min(MAX_PRESCRIBED_DOSE.maxPerDay, Math.max(1, Math.round(d?.maxPerDay ?? DEFAULT_DOSE.maxPerDay)));
  const days = Math.min(MAX_PRESCRIBED_DOSE.maxDays, Math.max(1, Math.round(d?.maxDays ?? DEFAULT_DOSE.maxDays)));
  return { maxPerDay: perDay, maxDays: days, maxTotal: perDay * days };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Yerel takvim günü anahtarı (YYYY-MM-DD). */
export function localDayKey(t: number): string {
  const d = new Date(t);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Atağın kaçıncı takvim günündeyiz (1'den başlar). */
export function episodeDay(startedAt: number, now: number): number {
  const a = new Date(startedAt);
  const b = new Date(now);
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.floor((b0 - a0) / DAY_MS + 0.5) + 1;
}

export type DoseStatus =
  | { allowed: true; remainingToday: number; remainingTotal: number; day: number }
  | { allowed: false; reason: 'DAILY_LIMIT' | 'TOTAL_LIMIT' | 'DAY_LIMIT'; day: number };

export function doseStatus(maneuverTimes: number[], episodeStart: number, now: number, limits: DoseLimits): DoseStatus {
  const day = episodeDay(episodeStart, now);
  if (day > limits.maxDays) return { allowed: false, reason: 'DAY_LIMIT', day };
  if (maneuverTimes.length >= limits.maxTotal) return { allowed: false, reason: 'TOTAL_LIMIT', day };
  const todayKey = localDayKey(now);
  const today = maneuverTimes.filter((t) => localDayKey(t) === todayKey).length;
  if (today >= limits.maxPerDay) return { allowed: false, reason: 'DAILY_LIMIT', day };
  return {
    allowed: true,
    remainingToday: limits.maxPerDay - today,
    remainingTotal: limits.maxTotal - maneuverTimes.length,
    day
  };
}

export const DOSE_TEXT: Record<'DAILY_LIMIT' | 'TOTAL_LIMIT' | 'DAY_LIMIT', string> = {
  DAILY_LIMIT: 'Bugün için önerilen en fazla manevra sayısına ulaştınız. Yarın sabah yeniden test edin.',
  TOTAL_LIMIT:
    'Son iki haftada önerilen toplam manevra sayısına ulaştınız ve baş dönmeniz sürüyor. Lütfen hekiminize ya da odyoloğunuza başvurun; raporunuzu yanınızda götürün.',
  DAY_LIMIT:
    'Son iki haftada evde manevra için önerilen gün sayısı doldu. Lütfen hekiminize ya da odyoloğunuza başvurun; raporunuzu yanınızda götürün.'
};

// ---------------------------------------------------------------------------------------------
// Hasta semptom testi (Dix-Hallpike, baş dönmesi işaretleriyle) yorumu
// ---------------------------------------------------------------------------------------------

export interface SideTestResult {
  side: Side;
  vertigo: boolean;
  latencySec: number | null;
  durationSec: number | null;
  /** Test güvenlik nedeniyle durdu mu (baş dönmesi > 2 dk)? */
  safetyStopped: boolean;
}

export type SideDecision =
  | { kind: 'TREAT'; side: Side; note: string | null }
  | { kind: 'NOT_TRIGGERED' }
  | { kind: 'ASK_STRONGER' }
  | { kind: 'REFER'; reason: 'ATYPICAL_LONG' | 'BOTH_SIDES' | 'SIDE_CONFLICT' | 'INCOMPLETE' };

export function interpretSideTests(
  results: SideTestResult[],
  knownSide: Side | null,
  stronger: Side | 'equal' | null
): SideDecision {
  const r = results.find((x) => x.side === 'R');
  const l = results.find((x) => x.side === 'L');
  if (!r || !l) return { kind: 'REFER', reason: 'INCOMPLETE' };
  if (r.safetyStopped || l.safetyStopped) return { kind: 'REFER', reason: 'ATYPICAL_LONG' };
  // Bitişi işaretlenmemiş baş dönmesi de süre bilinmediği için atipik sayılır.
  for (const x of [r, l]) {
    if (x.vertigo && (x.durationSec === null || x.durationSec >= 60)) return { kind: 'REFER', reason: 'ATYPICAL_LONG' };
  }
  const pos = [r, l].filter((x) => x.vertigo);
  if (pos.length === 0) return { kind: 'NOT_TRIGGERED' };
  if (pos.length === 1) {
    const side = pos[0]!.side;
    if (knownSide && knownSide !== side) return { kind: 'REFER', reason: 'SIDE_CONFLICT' };
    return { kind: 'TREAT', side, note: null };
  }
  // İki taraf da pozitif
  if (stronger === null) return { kind: 'ASK_STRONGER' };
  if (stronger === 'equal' || !knownSide) return { kind: 'REFER', reason: 'BOTH_SIDES' };
  if (stronger !== knownSide) return { kind: 'REFER', reason: 'SIDE_CONFLICT' };
  return {
    kind: 'TREAT',
    side: knownSide,
    note: 'İki tarafta da baş dönmesi oldu; daha şiddetli olan ve hekiminizin belirlediği tarafa manevra yapılacak. Düzelmezse hekiminize başvurun.'
  };
}

export const REFER_TEXT: Record<'ATYPICAL_LONG' | 'BOTH_SIDES' | 'SIDE_CONFLICT' | 'INCOMPLETE', string> = {
  ATYPICAL_LONG:
    'Baş dönmeniz bir dakikadan uzun sürdü ya da bitişi işaretlenmedi. Bu, tipik arka kanal BPPV\'ye uymuyor. Lütfen hekiminize ya da odyoloğunuza başvurun. Konuşma bozukluğu, güçsüzlük ya da çift görme olursa hemen 112\'yi arayın.',
  BOTH_SIDES:
    'İki tarafa yattığınızda da baş dönmesi oldu. Bu, yatay kanal ya da iki taraflı BPPV olabilir ve evde güvenle ayırt edilemez. Lütfen hekiminize ya da odyoloğunuza başvurun.',
  SIDE_CONFLICT:
    'Baş dönmesi bu kez hekiminizin belirlediği taraftan farklı tarafta tetiklendi. Tarafın yeniden muayeneyle belirlenmesi gerekir. Lütfen hekiminize ya da odyoloğunuza başvurun.',
  INCOMPLETE: 'Test tamamlanmadı. Her iki taraf test edilmeden manevra yapılmaz.'
};

