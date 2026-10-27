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
  text: string;
  /** Hangi yanıt durdurur? */
  stopsOn: 'yes' | 'no';
  action: StopAction;
  /** Durunca kullanıcıya gösterilecek açıklama. */
  why: string;
}

export const RED_FLAGS: RedFlagQuestion[] = [
  {
    id: 'continuous',
    text: 'Baş dönmesi, hiç kıpırdamasanız bile dakikalarca ya da saatlerce sürekli devam ediyor mu?',
    stopsOn: 'yes',
    action: 'emergency',
    why: 'BPPV baş dönmesi yalnızca baş hareketiyle başlar ve saniyeler sürer. Sürekli baş dönmesi başka, acil bir nedene bağlı olabilir.'
  },
  {
    id: 'neuro',
    text: 'Çift görme, konuşma ya da yutma güçlüğü, yüzünüzde, kolunuzda ya da bacağınızda güçsüzlük veya uyuşma, ya da yürüyememe var mı?',
    stopsOn: 'yes',
    action: 'emergency',
    why: 'Bu belirtiler inme gibi acil bir durumun işareti olabilir. Hemen 112\'yi arayın.'
  },
  {
    id: 'headache',
    text: 'Yeni başlayan ve şiddetli bir baş ağrısı ya da boyun ağrısı var mı?',
    stopsOn: 'yes',
    action: 'emergency',
    why: 'Baş dönmesiyle birlikte yeni ve şiddetli baş ya da boyun ağrısı acil değerlendirme gerektirir.'
  },
  {
    id: 'cardiac',
    text: 'Göğüs ağrısı, çarpıntı ya da bayılma oldu mu?',
    stopsOn: 'yes',
    action: 'emergency',
    why: 'Bu belirtiler kalple ilgili olabilir ve acil değerlendirme gerektirir.'
  },
  {
    id: 'anticoag',
    text: 'Kan sulandırıcı ilaç kullanıyorsunuz ve yeni bir baş ağrınız ya da yakın zamanda başınızı çarptığınız bir olay var mı?',
    stopsOn: 'yes',
    action: 'emergency',
    why: 'Kan sulandırıcı kullananlarda yeni baş ağrısı ya da baş çarpması kanama açısından acil değerlendirilmelidir.'
  },
  {
    id: 'ear',
    text: 'Ani işitme kaybı, yeni başlayan kulak çınlaması, kulak ağrısı ya da kulak akıntısı var mı?',
    stopsOn: 'yes',
    action: 'doctor',
    why: 'Ani işitme kaybı ya da kulak belirtileri BPPV dışı bir kulak sorununu gösterebilir. Ani işitme kaybı aynı gün değerlendirilmelidir.'
  },
  {
    id: 'neck',
    text: 'Son bir ay içinde boynunuzu incittiniz mi, boyun travması ya da boyun manipülasyonu (çıtlatma) oldu mu?',
    stopsOn: 'yes',
    action: 'doctor',
    why: 'Yakın zamanda boyun travması olanlarda baş-boyun manevraları güvenli olmayabilir.'
  },
  {
    id: 'fever',
    text: 'Bugün ateşiniz var mı ya da kusma nedeniyle hiç sıvı alamıyor musunuz?',
    stopsOn: 'yes',
    action: 'doctor',
    why: 'Ateş ya da sıvı alamayacak kadar kusma, BPPV dışı bir nedeni ya da tedavi gerektiren bir durumu gösterebilir.'
  },
  {
    id: 'same',
    text: 'Bu baş dönmesi, daha önce hekiminizin BPPV tanısı koyduğu baş dönmesiyle aynı mı? (Yatarken, yatakta dönerken ya da yukarı bakarken başlayan, kısa süren dönme hissi)',
    stopsOn: 'no',
    action: 'doctor',
    why: 'Baş dönmeniz önceki BPPV atağından farklıysa yeni bir değerlendirme gerekir.'
  }
];

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
  text: string;
}

export const CONTRAINDICATIONS: Contraindication[] = [
  { id: 'age', text: '18 yaşından küçüğüm.' },
  {
    id: 'neck',
    text: 'Boyun omurgası hastalığım (boyun fıtığı nedeniyle hareket kısıtlılığı, boyun instabilitesi, ileri kireçlenme) ya da yakın zamanda boyun ameliyatım var.'
  },
  { id: 'vascular', text: 'Hekimimin bildiği ciddi şah damarı (karotis) darlığım ya da dengesiz kalp hastalığım var.' },
  { id: 'eye', text: 'Geçirilmiş retina yırtılması/dekolmanı ya da son birkaç ay içinde göz ameliyatım oldu.' },
  { id: 'pregnancy', text: 'İleri dönem gebeyim.' },
  {
    id: 'mobility',
    text: 'Yatağa yatıp kalkmakta, yan dönmekte ya da başımı çevirmekte ciddi güçlük çekiyorum ve yanımda yardım edecek kimse yok.'
  },
  { id: 'hearing', text: 'Telefondan gelen sesli yönergeleri duyup takip etmekte güçlük çekiyorum.' }
];

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
    'DengeYol, daha önce hekim ya da odyolog muayenesiyle BPPV tanısı almış kişilerde atak tekrarladığında kullanılır. İlk kez yaşadığınız bir baş dönmesinde önce hekim muayenesi gerekir; çünkü baş dönmesinin başka, ciddi nedenleri olabilir.',
  HORIZONTAL_CANAL:
    'Yatay kanal BPPV\'nin evde kendi kendine tedavisi bu sürümde desteklenmiyor. Manevrayı odyolog ya da hekiminizin yapması gerekir. Odyologunuz DengeYol\'un odyolog modunu kullanabilir.',
  CONTRAINDICATION:
    'İşaretlediğiniz durum nedeniyle manevraları kendi başınıza yapmanız güvenli olmayabilir. Lütfen önce hekiminize danışın.'
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
/** Reçeteyle verilebilecek üst sınırlar (Radtke 2004: günde 3, 1 hafta). */
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
    'Bu atak için önerilen toplam manevra sayısına ulaştınız ve baş dönmeniz sürüyor. Lütfen hekiminize ya da odyologunuza başvurun; raporunuzu yanınızda götürün.',
  DAY_LIMIT:
    'Bu atak, önerilen süreden uzun sürdü. Lütfen hekiminize ya da odyologunuza başvurun; raporunuzu yanınızda götürün.'
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
    'Baş dönmeniz bir dakikadan uzun sürdü ya da bitişi işaretlenmedi. Bu, tipik arka kanal BPPV\'ye uymuyor. Lütfen hekiminize ya da odyologunuza başvurun.',
  BOTH_SIDES:
    'Her iki tarafa yattığınızda da benzer baş dönmesi oldu. Bu, yatay kanal BPPV ya da başka bir neden olabilir ve evde güvenle ayırt edilemez. Lütfen odyologunuza ya da hekiminize başvurun.',
  SIDE_CONFLICT:
    'Baş dönmesi bu kez hekiminizin belirlediği taraftan farklı tarafta tetiklendi. Tarafın yeniden muayeneyle belirlenmesi gerekir. Lütfen hekiminize ya da odyologunuza başvurun.',
  INCOMPLETE: 'Test tamamlanmadı. Her iki taraf test edilmeden manevra yapılmaz.'
};

/** Son 30 günde kaç atak? Sık nüks → hekim önerisi. */
export function frequentRecurrence(episodeStarts: number[], now: number): boolean {
  const recent = episodeStarts.filter((t) => now - t <= 30 * DAY_MS);
  return recent.length >= 3;
}
