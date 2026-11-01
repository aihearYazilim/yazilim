/**
 * Hasta atak akışının (EpisodeFlow) saf metin ve yerleşim yardımcıları: birim testlerle sınanır, React'e bağlı değildir.
 * Kullanıcı turu 3 (F2): sesli okuma kısalır (ayrıntı ekranda ve "Tekrar dinle"de), "Doğru mu?" onayında yanıt en üstte,
 * hazırlık maddeleri yakını modunda yardımcıya göre.
 */
import { SAFETY_STOP_TEXT, SAFETY_STOP_TEXT_WRONG_SIDE_HELPER } from '../../../core/runner';
import type { BoldDecision } from '../../../core/patientDecision';
import type { Side } from '../../../core/protocols';
import type { RedFlagQuestion, StopAction, YesNo } from '../../../core/safety';

// ---- Seçenekli sorular: varsayılan sesli biçim kısa, "Tekrar dinle" tam -----------------------------------------------

const ORDINALS = ['Birinci', 'İkinci', 'Üçüncü', 'Dördüncü', 'Beşinci', 'Altıncı'];

/** "/" bazı seslerde "bölü" okunur: "ya da". */
const sayable = (s: string) => s.replace(/\s*\/\s*/g, ' ya da ');

function ordinalList(title: string, options: string[]): string {
  return [title, ...options.map((o, i) => `${ORDINALS[i] ?? `${i + 1}.`}: ${o.replace(/\.+$/, '')}.`)].join(' ');
}

export interface SpokenOption {
  label: string;
  /**
   * Varsayılan okunuşta seçeneğin kısa adı (kullanıcı turu 6, k05): sıra sayısı kalır, "var" gibi dolgu düşer ("İkinci: Hafif
   * baş dönmesi ya da bulantı."). Yoksa label. "Tekrar dinle"de ve ekranda label.
   */
  spokenLabel?: string;
  sub?: string;
  /**
   * Alt açıklama güvenlik için anlam taşıyor (ör. "Yeni belirti": hangi belirtiler): varsayılan okunuşta da okunur.
   * Diğer alt açıklamalar yalnız "Tekrar dinle"de okunur.
   */
  subAlways?: boolean;
}

/**
 * Seçenekli ekranın iki sesli biçimi (kullanıcı turu 3, k01, k04, k05): `short` ekran açılınca okunur (soru ve seçenek
 * adları; açıklama satırı yerine varsa `spokenLead`), `full` "Tekrar dinle"de okunur (soru, açıklama satırı ve seçeneklerin
 * alt açıklamaları). Ekranda her şey yazılı kalır; hiçbir seçenek düşmez. Seçenekler her iki biçimde de sıra sayısıyla
 * ("Birinci: … İkinci: …"): kullanıcı turu 6 (k05) — sıra sayısız tek cümlede seçeneklerin sınırı duyulmuyordu; kısalık
 * `spokenLabel` ile korunur.
 */
export function choiceSpeechParts(
  q: { title: string; spokenTitle?: string; lead?: string; spokenLead?: string; prefix?: string },
  options: SpokenOption[]
): { short: string; full: string } {
  const head = (title: string, lead?: string) => [q.prefix, title, lead].filter(Boolean).join(' ');
  const shortOptions = options.map((o) => {
    const name = o.spokenLabel ?? o.label;
    return sayable(o.sub && o.subAlways ? `${name}: ${o.sub}` : name);
  });
  const short = ordinalList(head(q.spokenTitle ?? q.title, q.spokenLead), shortOptions);
  const full = ordinalList(
    head(q.title, q.lead),
    options.map((o) => sayable(o.sub ? `${o.label}. ${o.sub}` : o.label))
  );
  return { short, full };
}

// ---- "Doğru mu?" onayı -----------------------------------------------------------------------------------------------

/** Güvenlik sorusunda durduran yanıtın onay başlığı: "Çift görme, konuşma ya da yutma bozukluğu var". */
export function redFlagConfirmHeadline(q: Pick<RedFlagQuestion, 'label'>): string {
  const l = q.label.trim();
  return `${l.charAt(0).toLocaleUpperCase('tr-TR')}${l.slice(1)} var`;
}

/** Onay ekranında "Evet, doğru" ile dokunulan yer arasında en az bu kadar boşluk (px). */
export const CONFIRM_GAP_PX = 32;

/**
 * "Doğru mu?" onayının yerleşimi (kullanıcı turu 3, k05, k06). Sıra: yanıt kartı (başlıkta yanıt) en üstte, hemen altında
 * "Evet, doğru"; "Yanlış dokundum, soruya dön" dokunulan seçeneğin tam yerinde (aynı yere ikinci kör dokunuş onay değil
 * geri dönüş olsun). Kart ve "Evet" dokunulan yerin üstüne sığmıyorsa ('yesBelow'): kart yine en üstte, "Yanlış dokundum"
 * dokunulan yerde (kart oraya taşıyorsa kartın hemen altında; dokunuş kartın üstüne düşer, zararsız), "Evet, doğru" en altta.
 * Her iki durumda "Evet" dokunulan yerin en az `gap` px dışında kalır.
 *
 * yesBottom: "Evet" kartın hemen altındayken alt kenarı (belge koordinatı). tapTop: dokunulan düğmenin üst kenarı.
 */
export function confirmPlacement(tapTop: number, yesBottom: number, gap: number = CONFIRM_GAP_PX): 'yesAbove' | 'yesBelow' {
  return tapTop >= yesBottom + gap ? 'yesAbove' : 'yesBelow';
}

/** "Yanlış dokundum" düğmesinin üst boşluğu: doğal yeri dokunulan yerin üstündeyse aradaki fark, değilse 0. */
export function confirmBackPad(tapTop: number, naturalTop: number): number {
  return Math.max(0, Math.round(tapTop - naturalTop));
}

/** İki dikey aralık çakışıyor mu (en az `gap` px boşluk yoksa çakışık sayılır). */
export function verticalOverlap(a: { top: number; bottom: number }, b: { top: number; bottom: number }, gap = 0): boolean {
  return a.top < b.bottom + gap && b.top < a.bottom + gap;
}

// ---- Hazırlık ekranı -------------------------------------------------------------------------------------------------

export interface PrepTextInput {
  helper: boolean;
  /** Yalnız Semont yapılacak (test yok): yastıksız, yatağın uzun kenarı. */
  semontOnly: boolean;
  /** Testlerden sonra Semont yapılacak. */
  semontAfterTests: boolean;
  /** Yatay kanal yolu (sırtüstü baş çevirme testi ve BBQ roll): yastık başın altında, iki yana ve yüzüstü dönecek yer. */
  hc?: boolean;
}

/** Hazırlık maddeleri; yakını modunda yardımcıya göre ("Hastayı yatağa oturtun…"; kullanıcı turu 3, k02). */
export function prepItems({ helper, semontOnly, semontAfterTests, hc }: PrepTextInput): string[] {
  const bed = hc
    ? helper
      ? 'Hastayı yatağın ortasına oturtun; yastık, hasta yatınca başının altına gelsin. Hastanın iki yana ve yüzüstü dönecek yeri olsun.'
      : 'Yatağın ortasına oturun; yastık, yatınca başınızın altına gelsin. İki yana ve yüzüstü dönecek yeriniz olsun.'
    : semontOnly
    ? helper
      ? 'Hastayı yatağın uzun kenarının ortasına oturtun, bacakları yataktan aşağı sarksın; iki yanında yatacak kadar yer olsun. Yastık gerekmez.'
      : 'Yatağın uzun kenarının ortasına oturun, bacaklarınız yataktan aşağı sarksın; iki yanınızda yatacak kadar yer olsun. Yastık gerekmez.'
    : helper
      ? 'Hastayı yatağın üzerine oturtun; yastık, hasta sırtüstü yattığında omuzlarının altına gelsin.'
      : 'Yatağın üzerine oturun; yastık, sırtüstü yattığınızda omuzlarınızın altına gelsin.';
  return [
    bed,
    ...(semontAfterTests
      ? [
          helper
            ? 'Testlerden sonraki Semont manevrası için hastayı yatağın uzun kenarının ortasına geçireceğiz; sırası gelince sesle söyleyeceğim.'
            : 'Testlerden sonraki Semont manevrası için yatağın uzun kenarının ortasına geçeceğiz; sırası gelince sesle söyleyeceğim.'
        ]
      : []),
    'Sesi açın, sessiz modu kapatın.',
    helper
      ? 'Telefonu yan kenarlarından parmak uçlarınızla hastanın alnına bastırın; avucunuz ekrana değmesin.'
      : 'Telefonu yan kenarlarından parmak uçlarınızla tutun; avucunuz ekrana değmesin.',
    helper
      ? 'Telefon hastanın alnına konduktan sonra her şeyi sesle söyleyeceğim. Hastanın başı dönerse ekranın herhangi bir yerine siz dokunun.'
      : 'Telefonu alnınıza koyduktan sonra her şeyi sesle söyleyeceğim. Baş dönmesi olursa ekranın herhangi bir yerine dokunun.'
  ];
}

/**
 * Hazırlıktaki yardımcı kartı (yakını modu): yalnız hazırlık listesinde olmayanlar (kullanıcı turu 5, k02). Yastık,
 * telefonun parmak uçlarıyla tutulması ve "başı dönerse siz dokunun" listede yazılı; burada tekrarlanmaz. Yürütücü
 * ekranındaki yardımcı kartı (RunnerView `HelperCard`) bütün maddeleri gösterir (orada liste yok).
 */
export const PREP_HELPER_ITEMS: readonly string[] = [
  'Hastanın başucunda ya da yanında durun. Başucundaysanız ekranı size göre çevirin (aşağıdaki kutu); sonraki tüm ekranlar da size göre döner.',
  'Başı iki elle tutup çevirin; ekran dokunuşu baş dönmesi işaretidir.',
  'Hasta "dönüyor" deyince ekrana dokunun; geçince yeniden dokunun.',
  'Ekrandaki ok ve yazı, başı hangi yöne çevireceğinizi söyler ("hastanın sağı/solu"). Durdurmak için "Duraklat"ı basılı tutun.',
  'Telefonun otomatik ekran döndürmesini kapatın; yan yatışlarda yazılar yer değiştirmesin.'
];

const PREP_READY = 'Hazırsanız ekranın altındaki Hazırım düğmesine dokunun.';

/** Hazırlık ekranı açılınca okunan kısa hâl (kullanıcı turu 3, k05): yatak ve yastık, ses, "Hazırım". */
export function prepSpokenShort({ helper, semontOnly, hc }: PrepTextInput): string {
  const bed = hc
    ? helper
      ? 'Hastayı yatağın ortasına oturtun; yastık başının altına gelsin.'
      : 'Yatağın ortasına oturun; yastık başınızın altına gelsin.'
    : semontOnly
    ? helper
      ? 'Hastayı yatağın uzun kenarının ortasına oturtun.'
      : 'Yatağın uzun kenarının ortasına oturun.'
    : helper
      ? 'Hastayı yatağa oturtun; yastık omuzlarının altına gelsin.'
      : 'Yatağa oturun; yastık omuzlarınızın altına gelsin.';
  return `Hazırlık. ${bed} Sesi açın. ${PREP_READY}`;
}

/**
 * Hazırlıktaki işitme cihazı notu. Yakını modunda (kullanıcı turu 4, k02) yardımcıya göre: yönergeler zaten yardımcıya
 * söylenir; "bir yakınınızla yapın" yakını olan kişiye söylenmez.
 */
export function prepHearingText(helper: boolean): string {
  return helper
    ? 'Hastanın işitme cihazı varsa: yönergeler size söylenir, hastanın duyması gerekmez. Cihaz yatarken kayabilir; sabitleyin. Sesi kaçırırsanız titreşim ve bip sesleri hastayı ne zaman hareket ettireceğinizi bildirir.'
    : 'İşitme cihazı kullanıyorsanız: telefonla Bluetooth bağlantısını kontrol edin ve sesi deneyin. Cihaz yatarken kayabilir; sabitleyin ya da bir yakınınızla yapın. Sesi kaçırırsanız titreşim ve bip sesleri ne zaman hareket edeceğinizi bildirir.';
}

/** "Tekrar dinle": bütün maddeler. */
export function prepSpokenFull(input: PrepTextInput): string {
  return `Hazırlık. ${prepItems(input).join(' ')} ${PREP_READY}`;
}

// ---- Manevra sonu -----------------------------------------------------------------------------------------------------

/** Manevra sonu sesli metninin hedef üst sınırı (karakter): normal hızda ~10 s (≈13 karakter/s). */
export const AFTER_SPOKEN_MAX_CHARS = 135;

/**
 * Manevra tamamlandıktan sonra ekran açılınca okunan kısa metin (kullanıcı turu 3, k01, k05: ≤ ~10 s). Ayrıntı (bulantının
 * ne kadar sürebileceği, kusmada ne yapılacağı, gece ışığı) ekranda ve "Ayrıntıyı dinle"de.
 * time: tekrar testi saati ("15:03"); night: test saati geceye düşüyor.
 */
export function afterManeuverSpoken(sev: 'none' | 'mild', time: string, night: boolean): string {
  const mild = sev === 'mild' ? 'Hafif baş dönmesi normaldir. ' : '';
  const retest = night ? `Tekrar testi saat ${time}; uyuyacaksanız uyanınca yapın.` : `Saat ${time} civarında tekrar test edeceğiz.`;
  return `${mild}On dakika oturun; tutunarak kalkın. ${retest}`;
}

/** Kusma/şiddetli bulantı yanıtından sonraki kısa sesli metin (112 uyarısı kalır). */
export const AFTER_SEVERE_SPOKEN =
  "Bugün manevrayı tekrarlamayın. Oturun, küçük yudumlarla su için. Konuşma bozukluğu, güçsüzlük, çift görme ya da şiddetli baş ağrısı olursa 112'yi arayın.";

// ---- "Kendimi kötü hissediyorum" bitiş ekranı ---------------------------------------------------------------------------

/**
 * "Kendimi kötü hissediyorum" ile durdurulunca bitiş ekranının ("Dinlenin") metni. Manevrada, taraf testinde ve tekrar
 * testinde aynı yönlendirme (kullanıcı turu 5, k01): oturun, dinlenin, su için; geçmiyorsa hekim, acil belirtide 112.
 */
export function unwellEndText(what: 'maneuver' | 'test'): string {
  return `${what === 'maneuver' ? 'Manevrayı' : 'Testi'} durdurdunuz. Yavaşça oturun, dinlenin ve su için. Kendinizi iyi hissetmiyorsanız ya da yeni bir belirti varsa hekiminize başvurun; acil belirtilerde 112'yi arayın.`;
}

/** "Dinlenin" ekranının başlığı (manevra ve testlerde aynı). */
export const UNWELL_END_TITLE = 'Dinlenin';

// ---- Güvenlik durdurması bitiş ekranı, yakını modu -------------------------------------------------------------------

/**
 * Güvenlik durdurması bitiş metinlerinin (core/runner `SAFETY_STOP_TEXT`) yakını modundaki karşılıkları (kullanıcı turu 4,
 * k02): durdurma sesi yardımcıya konuşuyordu ("Hastayı… oturtun"), ekran metni hastaya ("dönün… oturun"). Yalnız hitap
 * değişir; durdurma kuralı, yönlendirme ve kilit aynıdır.
 */
export const SAFETY_STOP_TEXT_HELPER: Record<keyof typeof SAFETY_STOP_TEXT, string> = {
  VERTIGO_TOO_LONG:
    "Hastanın baş dönmesi 2 dakikadan uzun sürdü ya da geçtiği işaretlenmedi. Bu, tipik arka kanal BPPV'ye uymuyor. Hastanın hekimine ya da odyoloğuna başvurun. Konuşma bozukluğu, güçsüzlük ya da çift görme olursa hemen 112'yi arayın.",
  POSITION_UNREACHABLE:
    'Manevranın bir pozisyonuna gelinemedi (örneğin hastanın başı yeterince geriye sarkamadı ya da çevrilemedi). Zorlayarak yeniden denemeyin. Hastanın hekimine ya da odyoloğuna başvurun; boyun ya da bel hareketi kısıtlıysa manevranın değiştirilmiş biçimini ya da kendi gözetiminde yapılmasını önerebilir.',
  WRONG_SIDE:
    'Manevrada hasta yanlış tarafa döndü (döndürüldü) ve doğru yana getirilemedi (örneğin yüzüstünden geçilmeye çalışıldı). Bu, hastanın boyun ya da bel sorunu olduğu anlamına gelmez. Hastayı önce sırtüstüne getirin, sonra yavaşça oturtun. Bugün yeniden denemeden önce hastanın hekimine ya da odyoloğuna danışın; manevrayı birlikte gözden geçirsinler.'
};

/**
 * Bitiş ekranında gösterilecek güvenlik durdurması metni: yakını modunda `SAFETY_STOP_TEXT` metninin yardımcıya göre
 * yazılmış karşılığı, değilse metnin kendisi. Metin `SAFETY_STOP_TEXT` değerlerinden biri değilse olduğu gibi döner.
 */
export function safetyStopTextFor(text: string, helper: boolean): string {
  if (!helper) return text;
  const key = (Object.keys(SAFETY_STOP_TEXT) as (keyof typeof SAFETY_STOP_TEXT)[]).find((k) => SAFETY_STOP_TEXT[k] === text);
  return key ? SAFETY_STOP_TEXT_HELPER[key] : text;
}

// ---- Durdurma ekranlarının sesi: önce kısa biçim, ayrıntı ekranda ve "Ayrıntıyı dinle"de -------------------------------

/**
 * Seste "BPPV" harf harf okunmaz (kullanıcı turu 6, k05): "kristal oynaması" denir. Ekrandaki metin değişmez.
 * - "kristal oynaması (BPPV)", "(yatay kanal BPPV)" gibi ayraçlar atılır (yanındaki "kristal oynaması" zaten söylenir),
 * - kalan "BPPV" ekiyle birlikte çevrilir: "BPPV'ye" → "kristal oynamasına", "yatay kanal BPPV" → "yatay kanal kristal
 *   oynaması"; "BPPV baş dönmesi" → "Kristal oynamasında baş dönmesi".
 */
export function withoutBppv(text: string): string {
  const WORD: Record<string, string> = {
    '': 'kristal oynaması',
    ye: 'kristal oynamasına',
    yi: 'kristal oynamasını',
    nin: 'kristal oynamasının',
    de: 'kristal oynamasında',
    den: 'kristal oynamasından',
    le: 'kristal oynamasıyla'
  };
  return text
    .replace(/\s*\([^()]*BPPV[^()]*\)/g, '')
    .replace(/BPPV baş dönmesi/g, 'kristal oynamasında baş dönmesi')
    .replace(/BPPV(?:'(ye|yi|nin|den|de|le))?(?![\p{L}])/gu, (_m, suf: string | undefined) => WORD[suf ?? '']!)
    .replace(/(^|[.!?]\s+)kristal/g, '$1Kristal')
    .replace(/\s{2,}/g, ' ');
}

/**
 * Durdurma ekranının kısa sesli biçimleri (kullanıcı turu 6, k05, k07; normal hızda ≤ ~12 s, `STOP_SPOKEN_MAX_CHARS`):
 * önce ne yapılacağı ("Durduk. Yavaşça oturun. Hekiminize başvurun."), durulan yer, açı ve gerekçenin tamamı ekranda ve
 * "Ayrıntıyı dinle"de. Durdurma kuralı ve yönlendirme değişmez.
 */
const EMERGENCY_SIGNS = "Konuşma bozukluğu, güçsüzlük ya da çift görme olursa 112'yi arayın.";

/**
 * Yürütücü güvenlik durdurmalarının (core/runner `SAFETY_STOP_TEXT`) kısa sesi; yakını modunda yardımcıya göre. Kullanıcı
 * turu 6 (k07): "Durduk. Yavaşça oturun. Hekiminize başvurun." önce; durulan yer ve açı ekranda ve "Ayrıntıyı dinle"de.
 */
export function safetyStopSpoken(kind: keyof typeof SAFETY_STOP_TEXT, helper: boolean): string {
  switch (kind) {
    case 'VERTIGO_TOO_LONG':
      return helper
        ? `Durduk. Baş dönmesi çok uzun sürdü. Hastayı yavaşça oturtun; hastanın hekimine başvurun. ${EMERGENCY_SIGNS}`
        : `Durduk. Baş dönmesi çok uzun sürdü. Yavaşça oturun; hekiminize başvurun. ${EMERGENCY_SIGNS}`;
    case 'POSITION_UNREACHABLE':
      return helper
        ? 'Durduk. Zorlamayın; hastayı yavaşça oturtun. Hastanın hekimine ya da odyoloğuna başvurun. Nerede durduğumuz ekranda yazıyor.'
        : 'Durduk. Zorlamayın; yavaşça oturun. Hekiminize ya da odyoloğunuza başvurun. Nerede durduğumuz ekranda yazıyor.';
    case 'WRONG_SIDE':
      return helper
        ? 'Durduk. Hastayı önce sırtüstüne getirin, sonra yavaşça oturtun. Bugün yeniden denemeden önce hastanın hekimine danışın.'
        : 'Durduk. Önce sırtüstüne gelin, sonra yavaşça oturun. Bugün yeniden denemeden önce hekiminize ya da odyoloğunuza danışın.';
  }
}

/** "Pozisyona gelinemedi" durdurmasında gösterilen metne göre kısa ses: yanlış tarafta kalındıysa WRONG_SIDE. */
export function unreachableStopSpoken(stopText: string, helper: boolean): string {
  const wrongSide = stopText === SAFETY_STOP_TEXT.WRONG_SIDE || stopText === SAFETY_STOP_TEXT_WRONG_SIDE_HELPER;
  return safetyStopSpoken(wrongSide ? 'WRONG_SIDE' : 'POSITION_UNREACHABLE', helper);
}

/** "Kendimi kötü hissediyorum" ("Dinlenin") ekranının kısa sesi (kullanıcı turu 5'te tam metin ~20 s'ydi). */
export function unwellEndSpoken(what: 'maneuver' | 'test'): string {
  return `${what === 'maneuver' ? 'Manevrayı' : 'Testi'} durdurdunuz. Yavaşça oturun, dinlenin, su için. Geçmezse hekiminize başvurun; acil belirtide 112'yi arayın.`;
}

// =====================================================================================================================
// Yeniden tasarım (BRIEF §1, §2, §2b): kilit yok; uyarı + "Yine de devam et"; tek ekran güvenlik listesi; cesur karar.
// =====================================================================================================================

const SIDE_NAME: Record<Side, string> = { R: 'sağ', L: 'sol' };
const SIDE_DATIVE: Record<Side, string> = { R: 'sağa', L: 'sola' };
const cap = (t: string) => t.charAt(0).toLocaleUpperCase('tr-TR') + t.slice(1);
const otherSideOf = (s: Side): Side => (s === 'R' ? 'L' : 'R');

/** Uyarılı ekranın sesinde telefonun alından alınması (telefon alındayken açılan ekranlar). */
export const LOOK_AT_SCREEN = 'Telefonu alnınızdan alın ve ekrana bakın.';

// ---- Güvenlik soruları: tek ekran, işaret listesi -------------------------------------------------------------------

/**
 * Güvenlik listesindeki her belirtinin kısa ve kesin ekran metni (soru yerine madde). Liste dışı (yeni eklenen) soruda
 * sorunun kısa adı kullanılır (`redFlagCheckText`).
 */
export const RED_FLAG_CHECK_TEXT: Record<string, string> = {
  continuous: 'Hiç kımıldamadan yatarken bile saatlerdir dönme ya da hiç ayakta duramama',
  neuro: 'Çift görme, konuşmada ya da yutkunmada zorluk',
  neuroWeak: 'Yüzde, kolda ya da bacakta güçsüzlük ya da uyuşma',
  neuroGait: 'Baş dönmesi yokken de yürüyememe',
  headache: 'Yeni ve çok şiddetli baş ya da boyun ağrısı',
  cardiac: 'Göğüs ağrısı, kalp çarpıntısı ya da bayılma',
  orthostatic: 'Ayağa kalkınca gözün önü kararıyor, bayılacak gibi oluyorsunuz (etraf dönmeden)',
  anticoag: 'Kanı sulandıran ilaç (aspirin dahil) alırken yeni baş ağrısı ya da başı çarpma',
  spontaneous: 'Baş hiç kımıldamadan, kendi kendine gelen ve dakikalarca ya da saatlerce süren dönme',
  headTrauma: 'Son haftalarda başı bir yere çarpma ya da kaza',
  ear: 'Bir kulakta yeni: az duyma, tıkanma, çınlama, ağrı ya da kulaktan sıvı gelmesi',
  neck: 'Son bir ayda boynu incitme ya da boyna darbe (kaza, düşme, boynu çıtlatma)',
  fever: 'Ateş ya da su bile içilemeyecek kadar kusma',
  same: 'Hekiminizin daha önce "kristal oynaması" dediğinden farklı bir baş dönmesi'
};

/** Maddenin altındaki küçük not: kristal oynaması hastası kendi belirtisini yanlışlıkla işaretlemesin. */
export const RED_FLAG_CHECK_SUB: Record<string, string> = {
  continuous: 'Ataktan sonra kalan hafif sersemlik sayılmaz.',
  orthostatic: 'Yataktan kalkarken etrafın dönmesi sayılmaz.',
  anticoag: 'Coraspin, Plavix, Coumadin, Xarelto, Eliquis, Lixiana, Pradaxa gibi.',
  ear: 'Uzun süredir değişmeyen çınlama sayılmaz; KBB hekiminin baktığı ve artmayan belirti de sayılmaz.',
  // y01: midesi bulanan kişi tereddüt etmesin.
  fever: 'Bulantı ve bir iki kez kusma bu baş dönmesinde olağandır; sayılmaz.'
};

/**
 * Güvenlik listesindeki her maddenin simgesi (yeni kullanıcı turu 1, L2-6; y03: okuması zayıf kişi simgeye bakar). Ekranda
 * maddenin başında, sesli okunmaz. Liste dışı (yeni eklenen) soruda genel uyarı simgesi.
 */
export const RED_FLAG_ICON: Record<string, string> = {
  continuous: '🌀',
  neuro: '👁️',
  neuroWeak: '💪',
  neuroGait: '🚶',
  headache: '🤕',
  cardiac: '❤️',
  orthostatic: '🌑',
  anticoag: '💊',
  spontaneous: '⏱️',
  headTrauma: '⛑️',
  ear: '👂',
  neck: '🦴',
  fever: '🌡️',
  same: '🩺'
};

export function redFlagIcon(q: Pick<RedFlagQuestion, 'id'>): string {
  return RED_FLAG_ICON[q.id] ?? '⚠️';
}

export function redFlagCheckText(q: Pick<RedFlagQuestion, 'id' | 'label'>): string {
  return RED_FLAG_CHECK_TEXT[q.id] ?? cap(q.label.trim());
}

export function redFlagCheckSub(q: Pick<RedFlagQuestion, 'id'>): string | undefined {
  return RED_FLAG_CHECK_SUB[q.id];
}

export const RED_FLAGS_TITLE = 'Bunlardan biri var mı?';

/** Ekran açılınca okunan kısa hâl (≤ ~8 s); maddeler ekranda ve "Listeyi dinle"de. */
export const RED_FLAGS_SPOKEN = 'Güvenlik soruları. Listedekilerden biri varsa işaretleyin. Hiçbiri yoksa, Hiçbiri yok düğmesine dokunun.';

/** "Listeyi dinle": bütün maddeler. */
export function redFlagsSpokenFull(qs: Pick<RedFlagQuestion, 'id' | 'label'>[]): string {
  return withoutBppv(`${RED_FLAGS_TITLE} ${qs.map((q) => `${redFlagCheckText(q).replace(/"/g, '')}.`).join(' ')} Hiçbiri yoksa, Hiçbiri yok düğmesine dokunun.`);
}

/**
 * Güvenlik listesinde işaret koyup kaldırınca kısa ses (y02: titreyen elle hangi maddeye dokunduğu duyulsun). İlk işarette
 * ve son işaret kalkınca alttaki düğmenin değiştiği de söylenir (y02: düğme sessizce değişiyordu).
 */
export function redFlagToggleSpoken(itemText: string, on: boolean, countAfter: number): string {
  const item = withoutBppv(itemText.replace(/"/g, ''));
  if (on) return `İşaretlendi: ${item}.${countAfter === 1 ? ' Alttaki düğme şimdi: İşaretlediklerimle devam.' : ''}`;
  return `İşaret kaldırıldı: ${item}.${countAfter === 0 ? ' Alttaki düğme yine: Hiçbiri yok.' : ''}`;
}

/** Acil belirti işaretlenince uyarıdan önceki "doğru mu?" onayında sonuç cümlesi (kilit değil; yanlış dokunuş koruması). */
export const RED_FLAG_CONFIRM_CONSEQUENCE = "Bu yanıtla acil (112) uyarısı gösterilecek.";

/** İşaret listesinden yanıt kaydı: işaretli madde durduran yanıt (`stopsOn`), işaretsiz madde güvenli yanıt. */
export function redFlagAnswers(qs: Pick<RedFlagQuestion, 'id' | 'stopsOn'>[], checked: readonly string[]): Record<string, YesNo> {
  const safe = (v: YesNo): YesNo => (v === 'yes' ? 'no' : 'yes');
  return Object.fromEntries(qs.map((q) => [q.id, checked.includes(q.id) ? q.stopsOn : safe(q.stopsOn)]));
}

/** Kırmızı bayrak uyarısının başlığı (kilit yok: altında "Yine de devam et"). */
export const RED_FLAG_WARN_TITLE: Record<StopAction, string> = {
  emergency: 'Acil belirti: hemen yardım isteyin',
  doctor: 'Önce hekime görünmeniz önerilir'
};

/**
 * Kırmızı bayrak uyarısının kısa sesi: başlık, ilk belirtinin kısa nedeni ve (acilde) 112. `fallback`: soru yoksa (manevra
 * sonrası yeni belirti). "Yine de devam et" seste önerilmez; ekranda durur.
 */
export function redFlagWarnSpoken(action: StopAction, triggered: Pick<RedFlagQuestion, 'action' | 'stopSpoken'>[], fallback?: string): string {
  const q = triggered.find((x) => x.action === action) ?? triggered[0];
  const why = q?.stopSpoken ?? fallback;
  return withoutBppv([`${RED_FLAG_WARN_TITLE[action]}.`, why, action === 'emergency' ? "Hemen 112'yi arayın." : ''].filter(Boolean).join(' '));
}

/**
 * Kırmızı bayrak uyarısında "Yine de devam et" en az bu süre (ve 112/hekim cümlesi bitene dek) basılamaz (yeni kullanıcı
 * turu 1, L2-2; y05: uyarı açılır açılmaz dokunulup 112 cümlesi 0,9 s'de kesiliyordu). Kilit değil, yalnız yavaşlatma:
 * düğme görünür ve geri sayım gösterir. Demo modunda zaman hızlandırmasına bölünür.
 */
export const RED_FLAG_OVERRIDE_MIN_MS = 5000;

/** Geri sayım sırasında "Yine de devam et" düğmesinin etiketi. */
export function overrideCountdownLabel(label: string, secondsLeft: number): string {
  return secondsLeft > 0 ? `${label} (${secondsLeft})` : label;
}

// ---- Manevra sonrası yeni belirti (inme): kırmızı 112 şeridi --------------------------------------------------------

/** Manevra sonrası "Yeni belirti" uyarısı aşılınca olağan "Manevra tamamlandı" yerine gösterilen ekran (L2-1; y05). */
export const NEURO_END_TITLE = "Yeni belirti bildirdiniz: 112'yi arayın";

export const NEURO_END_TEXT =
  "Manevradan sonra başlayan konuşma bozukluğu, yüzde ya da kolda güçsüzlük, çift görme ya da şiddetli baş ağrısı kristal oynamasına bağlı değildir; inme gibi acil bir durumun işareti olabilir. Hemen 112'yi arayın. Yalnız kalmayın, araç kullanmayın; bugün yeniden manevra yapmayın.";

export const NEURO_END_SPOKEN = "Yeni belirti bildirdiniz. Hemen 112'yi arayın. Yalnız kalmayın.";

/** Akışta ve ana ekranda kalıcı kırmızı şerit. */
export const NEURO_STRIP_TEXT = "Yeni nörolojik belirti bildirdiniz. Hemen 112'yi arayın.";

/** Acil uyarısı aşıldıktan sonra yürütücüde ve karar ekranında kısa kırmızı hatırlatma (L2-2; y05). */
export const EMERGENCY_REMINDER_TEXT = "Acil belirti bildirdiniz: kötüleşirse ya da yeni belirti olursa hemen durun ve 112'yi arayın.";

/** Aynı hatırlatmanın yürütücü başında okunan kısa sesi. */
export const EMERGENCY_REMINDER_SPOKEN = "Acil belirti bildirdiniz; kötüleşirse durun ve 112'yi arayın.";

// ---- Kontrendikasyon, doz, erken tekrar uyarıları --------------------------------------------------------------------

export const CONTRA_WARN_TITLE = 'Manevra sizin için riskli olabilir';

export function contraWarnText(labels: string[]): string {
  return `Kurulumda işaretlediğiniz durum: ${labels.join(', ')}. Bu durumda baş çevirme hareketleri güvenli olmayabilir; hekiminize danışmanız önerilir. Devam ederseniz yavaş hareket edin ve mümkünse bir yakınınızla yapın.`;
}

export const CONTRA_WARN_SPOKEN = 'Dikkat. İşaretlediğiniz durum nedeniyle manevra riskli olabilir; hekiminize danışmanız önerilir. Devam ederseniz yavaş hareket edin.';

export const DOSE_WARN_TITLE = 'Önerilen manevra sayısı doldu';

/** Doz uyarısının sesi (ekran açılınca). */
export function doseWarnSpoken(lookFirst: boolean): string {
  return `${lookFirst ? `${LOOK_AT_SCREEN} ` : ''}Önerilen manevra sayısı doldu. Devam etmeden önce ekrandaki açıklamayı okuyun.`;
}

export interface PlanWarn {
  title: string;
  text: string;
  /** Tekrar testinin zamanı geldi: "Tekrar testini yap" öne çıkar. */
  retestReady: boolean;
}

/**
 * Manevra yapılmış atakta "Başım dönüyor": sıradaki adım (tekrar testi) söylenir ama kilit yok, "Yine de manevra yap".
 * time: tekrar testi saati ("15:03").
 */
export function planWarn(kind: 'early-retest' | 'morning-retest' | 'resolved-suggest' | 'none', ready: boolean, time: string | null): PlanWarn {
  if ((kind === 'early-retest' || kind === 'morning-retest') && ready) {
    return {
      title: kind === 'early-retest' ? 'Tekrar testinin zamanı geldi' : 'Sabah testinin zamanı geldi',
      text: 'Önce kısa testi yapın: manevranın işe yarayıp yaramadığını gösterir. İsterseniz testsiz yine de manevra yapabilirsiniz.',
      retestReady: true
    };
  }
  if (kind === 'early-retest') {
    return {
      title: 'Manevra az önce yapıldı',
      text: `Tekrar testi ${time ?? 'biraz sonra'}. Manevrayı hemen tekrarlamak genelde gerekmez; isterseniz yine de yapabilirsiniz.`,
      retestReady: false
    };
  }
  if (kind === 'morning-retest') {
    return {
      title: 'Sabah testi bekleniyor',
      text: `Kısa test ${time ?? 'sabah'} sonrasında. Baş dönmeniz şimdi başladıysa yine de manevra yapabilirsiniz.`,
      retestReady: false
    };
  }
  return {
    title: 'Düzelmiş görünüyor',
    text: 'Tekrar testlerinde baş dönmesi başlamadı. Baş dönmesi yeniden başladıysa yine de manevra yapabilirsiniz.',
    retestReady: false
  };
}

// ---- Alt tip (tek ekran) ---------------------------------------------------------------------------------------------

export type SubtypeAnswer = 'liedown' | 'turn' | 'unsure';

export const SUBTYPE_TITLE = 'Baş dönmesini en çok ne başlatıyor?';

export const SUBTYPE_OPTIONS: ({ value: SubtypeAnswer; testid: string } & SpokenOption)[] = [
  { value: 'liedown', label: 'Yatarken, kalkarken ya da yukarı bakınca', testid: 'subtype-liedown' },
  { value: 'turn', label: 'Yatakta sağa-sola dönünce', sub: 'Yatıp kalkmaktan daha çok.', testid: 'subtype-turn' },
  { value: 'unsure', label: 'Emin değilim', sub: 'Yatarken testiyle başlarız.', testid: 'subtype-unsure' }
];

// ---- Cesur karar ekranları -------------------------------------------------------------------------------------------

/** Karar ekranının seçenek değerleri: manevra tarafı, iki tarafa sırayla, öbür kanalın testi, durdur. */
export type DecisionChoice = 'go:R' | 'go:L' | 'both' | 'test:PC' | 'test:HC' | 'end';

export interface DecisionScreen {
  title: string;
  lead: string;
  /** Varsayılan okunuşta lead yerine. */
  spokenLead: string;
  /** primary: uygulamanın önerdiği yol; büyük dolu düğme olarak gösterilir (L2-2; y01). */
  options: ({ value: DecisionChoice; testid: string; primary?: boolean } & SpokenOption)[];
}

/** Testin tetiklemediği kararın açıklaması (L2-7; y05): "BPPV olmayabilir" ve sürekli baş dönmesinde hekim/112. */
export const NOT_TRIGGERED_NOTE =
  "Test baş dönmesi yapmadı; baş dönmeniz kristal oynamasından olmayabilir. Baş dönmesi sürekliyse ya da yürüyemiyorsanız hekime başvurun; inme belirtisinde 112'yi arayın.";

const go = (s: Side): DecisionChoice => (s === 'R' ? 'go:R' : 'go:L');

/** İlk seçeneği önerilen yol (büyük dolu düğme) yapar. */
const withPrimary = (o: DecisionScreen['options']): DecisionScreen['options'] => o.map((x, i) => (i === 0 ? { ...x, primary: true } : x));

/**
 * Uyarılı kararın ekranı (BRIEF §2b): başlık uyarıyı, açıklama uygulamanın kararını ve gerekçesini söyler; ilk seçenek
 * uygulamanın önerisi ("Yine de devam et: … taraf"), sonra başka taraf/manevra/test ve "Durdur".
 */
export function decisionScreen(d: BoldDecision): DecisionScreen {
  const hc = d.canal === 'HC';
  const man = hc ? 'yatakta dönme manevrası' : 'manevra';
  /** "sağ taraf manevrası" kalıbı. */
  const manOf = hc ? 'yatakta dönme manevrası' : 'manevrası';
  const stop = { value: 'end' as const, label: 'Durdur', testid: 'decision-stop' };
  const sideOptions = (preferred: Side | null, continueLabel: (s: Side) => string): DecisionScreen['options'] =>
    preferred
      ? [
          { value: go(preferred), label: continueLabel(preferred), testid: 'decision-continue' },
          { value: go(otherSideOf(preferred)), label: `${cap(SIDE_NAME[otherSideOf(preferred)])} taraf ${manOf}`, testid: 'decision-other' }
        ]
      : (['R', 'L'] as Side[]).map((s) => ({
          value: go(s),
          label: hc ? `${cap(SIDE_DATIVE[s])} çevirince daha çok: ${SIDE_NAME[s]} taraf` : `${cap(SIDE_NAME[s])} yanıma yatınca: ${SIDE_NAME[s]} taraf`,
          testid: `decision-${s}`
        }));
  const otherTest = hc
    ? { value: 'test:PC' as const, label: 'Yatarken ya da kalkarken oluyor: yatarak test', testid: 'decision-test-pc' }
    : { value: 'test:HC' as const, label: 'Yatakta dönerken oluyor: yatay kanal testi', testid: 'decision-test-hc' };
  const both = { value: 'both' as const, label: 'İki tarafa sırayla manevra', testid: 'decision-both' };
  if (!d.warn && d.side && !d.both) {
    // Temiz karar, kullanıcı başka seçenek istedi (geçiş ekranında "Başka taraf").
    return {
      title: 'Başka bir seçenek',
      lead: `${d.reason} Uygulamanın önerisi: ${SIDE_NAME[d.side]} taraf ${manOf}.`,
      spokenLead: `Önerimiz ${SIDE_NAME[d.side]} taraf.`,
      options: [...withPrimary(sideOptions(d.side, (s) => `Öneriyle devam: ${SIDE_NAME[s]} taraf ${manOf}`)), ...(hc ? [] : [both]), otherTest, stop]
    };
  }
  switch (d.warn) {
    case 'ATYPICAL_LONG':
      return {
        title: 'Baş dönmesi uzun sürdü',
        lead: `${d.reason} Bir dakikadan uzun süren baş dönmesi kristal oynamasında beklenmez; düzelmezse hekime görünün. ${EMERGENCY_SIGNS}`,
        spokenLead: 'Bir dakikadan uzun sürdü; bu beklenmez. Düzelmezse hekime görünün.',
        options: [...sideOptions(d.side, (s) => `Yine de devam et: ${SIDE_NAME[s]} taraf ${manOf}`), stop]
      };
    case 'SIDE_CONFLICT': {
      const t = d.side!;
      const dr = d.doctorSide ?? otherSideOf(t);
      return {
        title: 'Taraf hekiminizin dediğinden farklı',
        lead: `Test ${SIDE_NAME[t]} tarafı gösterdi; hekiminiz ${SIDE_NAME[dr]} demişti. Hangisine devam edelim?`,
        spokenLead: `Test ${SIDE_NAME[t]}, hekiminiz ${SIDE_NAME[dr]} demişti.`,
        options: [
          { value: go(t), label: `Test tarafına devam (${SIDE_NAME[t]})`, testid: 'decision-test-side' },
          { value: go(dr), label: `Hekimin dediği tarafa devam (${SIDE_NAME[dr]})`, testid: 'decision-doctor-side' },
          stop
        ]
      };
    }
    case 'NOT_TRIGGERED': {
      // Önerilen yol tek büyük düğme (y01): bilinen taraf varsa o tarafa, yoksa (arka kanalda) iki tarafa sırayla manevra.
      const end = { value: 'end' as const, label: 'Bugünlük bitir (sabah yeniden test)', testid: 'decision-stop' };
      if (!d.side && !hc) {
        return {
          title: 'Testte baş dönmesi başlamadı',
          lead: `${NOT_TRIGGERED_NOTE} Baş dönmeniz sürüyorsa ve hangi yan olduğunu bilmiyorsanız iki tarafa sırayla manevra yapabiliriz.`,
          spokenLead: 'Test baş dönmesi yapmadı; kristal oynaması olmayabilir. Önerimiz: iki tarafa sırayla manevra.',
          options: [
            { ...both, label: 'Hangi yan bilmiyorum: iki tarafa sırayla manevra', spokenLabel: 'İki tarafa sırayla manevra', primary: true },
            ...sideOptions(null, () => ''),
            otherTest,
            end
          ]
        };
      }
      return {
        title: 'Testte baş dönmesi başlamadı',
        lead: d.side
          ? `${NOT_TRIGGERED_NOTE} Baş dönmeniz sürüyorsa yine de ${SIDE_NAME[d.side]} tarafa ${man} yapabiliriz.`
          : `${NOT_TRIGGERED_NOTE} Baş dönmesi hangi yana çevirince oluyorsa o tarafa ${man} yapabiliriz.`,
        spokenLead: d.side
          ? `Test baş dönmesi yapmadı; kristal oynaması olmayabilir. Önerimiz: ${SIDE_NAME[d.side]} tarafa ${man}.`
          : 'Test baş dönmesi yapmadı; kristal oynaması olmayabilir. Hangi yanda oluyorsa o tarafa manevra yapabiliriz.',
        options: [
          ...sideOptions(d.side, (s) => `${cap(SIDE_NAME[s])} tarafa ${man} yap`).map((o, i) => (d.side && i === 0 ? { ...o, primary: true } : o)),
          ...(hc ? [] : [both]),
          otherTest,
          end
        ]
      };
    }
    default: {
      // İki taraf (arka kanalda) ya da tarafı belirlenemeyen yatay kanal.
      const lead = d.both
        ? `${d.reason} İki tarafa sırayla manevra yapacağız. Düzelmezse hekime görünün.`
        : d.side
          ? `${d.reason} ${cap(man)} ${SIDE_NAME[d.side]} tarafa yapılacak. Düzelmezse hekime görünün.`
          : `${d.reason} Hangi yana ${hc ? 'çevirince' : 'yatınca'} daha çok dönüyorsa onu seçin.`;
      const options: DecisionScreen['options'] = d.both
        ? [{ ...both, testid: 'decision-continue', label: 'Devam et: iki tarafa sırayla', primary: true }, ...sideOptions(null, () => ''), otherTest, stop]
        : [...(d.side ? withPrimary : (o: DecisionScreen['options']) => o)(sideOptions(d.side, (s) => `Devam et: ${SIDE_NAME[s]} taraf ${manOf}`)), ...(hc ? [] : [both]), otherTest, stop];
      return {
        title: hc && !d.side ? 'Taraf belirlenemedi' : 'İki tarafta da baş dönmesi oldu',
        lead,
        spokenLead: d.both ? 'İki tarafa sırayla manevra öneriyoruz.' : d.side ? `${cap(SIDE_NAME[d.side])} tarafa ${man} öneriyoruz.` : 'Tarafı seçin.',
        options
      };
    }
  }
}

/** Temiz kararda (telefon alında) tek dokunuşla manevraya geçiş ekranı: başlık ve sesli metin. */
export function chainGateText(d: Pick<BoldDecision, 'canal' | 'side'>, dxWarn?: string | null): { title: string; text: string } {
  const s = d.side!;
  const tap = 'Telefon alnınızda kalsın. Baş dönmeniz geçtiyse ve hazırsanız ekranın herhangi bir yerine dokunun.';
  if (d.canal === 'HC') {
    return {
      title: `${cap(SIDE_DATIVE[s])} çevirince baş dönmesi daha güçlüydü`,
      text: `Yatay kanal, ${SIDE_NAME[s]} taraf kabul ediyoruz; en sık biçim budur. Şimdi yatakta dönme manevrasını yapacağız: aynı yöne adım adım tam bir tur döneceksiniz. ${tap}`
    };
  }
  return {
    title: `${cap(SIDE_NAME[s])} tarafta baş dönmesi oldu`,
    text: `${dxWarn ? `${dxWarn} ` : ''}Şimdi ${SIDE_NAME[s]} taraf için manevrayı yapacağız. ${tap}`
  };
}

/** İki tarafa sırayla manevrada ikinci manevraya geçiş. */
export function nextSideGateText(next: Side): { title: string; text: string } {
  return {
    title: 'Sıra öbür tarafta',
    text: `Şimdi ${SIDE_NAME[next]} taraf için manevrayı yapacağız. Telefon alnınızda kalsın. Hazırsanız ekranın herhangi bir yerine dokunun.`
  };
}

/** Manevrada ≥1 dk baş dönmesi: manevra sonu ekranındaki not (kilit yok; tekrar testi planı sürer). */
export const LONG_IN_MANEUVER_NOTE = `Manevra sırasında baş dönmesi 1 dakikadan uzun sürdü; bu tipik değil. Tekrar testinde yine uzun sürerse ya da düzelmezse hekiminize ya da odyoloğunuza başvurun. ${EMERGENCY_SIGNS}`;

/** Tekrar testinde uzun baş dönmesi: uyarı (kilit yok; "Manevrayı yine de tekrarla"). */
export const RETEST_LONG_TEXT = `Tekrar testinde baş dönmesi 1 dakikadan uzun sürdü ya da bitişi işaretlenmedi. Bu tipik değil; hekiminize ya da odyoloğunuza görünmeniz önerilir. İsterseniz manevrayı yine de tekrarlayabilirsiniz. ${EMERGENCY_SIGNS}`;

export const RETEST_LONG_SPOKEN = 'Baş dönmesi uzun sürdü. Hekime görünmeniz önerilir; isterseniz manevrayı yine de tekrarlayabilirsiniz.';
