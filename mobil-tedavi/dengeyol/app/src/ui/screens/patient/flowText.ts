/**
 * Hasta atak akışının (EpisodeFlow) saf metin ve yerleşim yardımcıları: birim testlerle sınanır, React'e bağlı değildir.
 * Kullanıcı turu 3 (F2): sesli okuma kısalır (ayrıntı ekranda ve "Tekrar dinle"de), "Doğru mu?" onayında yanıt en üstte,
 * hazırlık maddeleri yakını modunda yardımcıya göre.
 */
import type { RedFlagQuestion } from '../../../core/safety';

// ---- Seçenekli sorular: varsayılan sesli biçim kısa, "Tekrar dinle" tam -----------------------------------------------

const ORDINALS = ['Birinci', 'İkinci', 'Üçüncü', 'Dördüncü', 'Beşinci', 'Altıncı'];

/** "/" bazı seslerde "bölü" okunur: "ya da". */
const sayable = (s: string) => s.replace(/\s*\/\s*/g, ' ya da ');

function ordinalList(title: string, options: string[]): string {
  return [title, ...options.map((o, i) => `${ORDINALS[i] ?? `${i + 1}.`}: ${o.replace(/\.+$/, '')}.`)].join(' ');
}

export interface SpokenOption {
  label: string;
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
 * alt açıklamaları). Ekranda her şey yazılı kalır; hiçbir seçenek düşmez.
 */
export function choiceSpeechParts(
  q: { title: string; spokenTitle?: string; lead?: string; spokenLead?: string; prefix?: string },
  options: SpokenOption[]
): { short: string; full: string } {
  const head = (title: string, lead?: string) => [q.prefix, title, lead].filter(Boolean).join(' ');
  const short = ordinalList(
    head(q.spokenTitle ?? q.title, q.spokenLead),
    options.map((o) => sayable(o.sub && o.subAlways ? `${o.label}: ${o.sub}` : o.label))
  );
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
