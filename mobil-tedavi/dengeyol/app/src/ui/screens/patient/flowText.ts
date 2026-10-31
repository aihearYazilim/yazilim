/**
 * Hasta atak akışının (EpisodeFlow) saf metin ve yerleşim yardımcıları: birim testlerle sınanır, React'e bağlı değildir.
 * Kullanıcı turu 3 (F2): sesli okuma kısalır (ayrıntı ekranda ve "Tekrar dinle"de), "Doğru mu?" onayında yanıt en üstte,
 * hazırlık maddeleri yakını modunda yardımcıya göre.
 */
import { SAFETY_STOP_TEXT, SAFETY_STOP_TEXT_WRONG_SIDE_HELPER } from '../../../core/runner';
import { REFER_TEXT, type RedFlagQuestion } from '../../../core/safety';

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
}

/** Hazırlık maddeleri; yakını modunda yardımcıya göre ("Hastayı yatağa oturtun…"; kullanıcı turu 3, k02). */
export function prepItems({ helper, semontOnly, semontAfterTests }: PrepTextInput): string[] {
  const bed = semontOnly
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

const PREP_READY = 'Hazırsanız ekrandaki Hazırım düğmesine dokunun.';

/** Hazırlık ekranı açılınca okunan kısa hâl (kullanıcı turu 3, k05): yatak ve yastık, ses, "Hazırım". */
export function prepSpokenShort({ helper, semontOnly }: PrepTextInput): string {
  const bed = semontOnly
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

export const REFER_SPOKEN: Record<keyof typeof REFER_TEXT, string | null> = {
  ATYPICAL_LONG: `Baş dönmesi uzun sürdü. Manevra yapmayın; hekiminize ya da odyoloğunuza başvurun. ${EMERGENCY_SIGNS}`,
  BOTH_SIDES: 'Manevra yapmayın. İki tarafta da baş dönmesi oldu; bu evde ayırt edilemez. Hekiminize ya da odyoloğunuza başvurun.',
  SIDE_CONFLICT: 'Manevra yapmayın. Baş dönmesi hekiminizin belirlediğinden farklı tarafta başladı. Hekiminize ya da odyoloğunuza başvurun.',
  // Zaten kısa: tam metin okunur.
  INCOMPLETE: null
};

/** Manevrada ≥1 dk baş dönmesi (EpisodeFlow `LONG_IN_MANEUVER_TEXT`) için kısa ses. */
export const LONG_IN_MANEUVER_SPOKEN = `Baş dönmesi uzun sürdü. Manevrayı tekrarlamayın; hekiminize ya da odyoloğunuza başvurun. ${EMERGENCY_SIGNS}`;

/** Alt tip sorusunda "her seferinde 3 dakikadan uzun" yanıtı için kısa ses. */
export const SUBTYPE_LONG_SPOKEN = `Bu uzunlukta dönme hissi kristal oynamasına uymaz. Manevra yapmayın; hekiminize başvurun. ${EMERGENCY_SIGNS}`;

/** Yatay kanal şüphesi (alt tip) için kısa ses. */
export const SUBTYPE_HC_SPOKEN = 'Manevra yapmayın. Bu baş dönmesi evde tedavi edilemeyen bir tip olabilir. Hekiminize ya da odyoloğunuza başvurun.';

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
