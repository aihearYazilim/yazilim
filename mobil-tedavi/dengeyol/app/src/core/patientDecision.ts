/**
 * Hasta modunda cesur tanı ve manevra kararı (yeniden tasarım, BRIEF §2b).
 *
 * Uygulama kararsız kaldığı yerde hekime göndermek yerine en olası tanıyı koyar ve uygun manevrayı önerir; gerekçeyi tek
 * cümleyle söyler ve kayda yazar. Uyarı gerektiren durumlarda (atipik süre, iki taraf, taraf çelişkisi, tetiklenmeme) karar
 * yine verilir ama `warn` dolu döner: akış uyarıyı gösterir, kullanıcı "Yine de devam et" ya da başka taraf seçer.
 *
 * Saf fonksiyonlar (React ve kayıt deposundan bağımsız); birim testleri: patientDecision.test.ts.
 */
import type { ProtocolId, Side } from './protocols';
import { vertigoSummary, type StepRecord } from './runner';
import type { SideTestResult } from './safety';

/** Evde ayırt edilen kanal: arka (Dix-Hallpike → Epley/Semont) ya da yatay (sırtüstü baş çevirme → BBQ roll). */
export type HomeCanal = 'PC' | 'HC';

/** Bu süreyi aşan (ya da bitişi işaretlenmeyen) baş dönmesi kanalolitiazise uymaz (Bárány 2015: <1 dk). */
export const ATYPICAL_SEC = 60;

/** İki pozitif tarafın süresi en az bu kadar farklıysa uzun süren taraf daha şiddetli sayılır (s). */
export const STRONGER_DIFF_SEC = 5;

/** Yatay kanal (geotropik varsayım) için evde yapılan manevra. */
export const HC_MANEUVER: ProtocolId = 'bbq-roll';
/** Yatay kanal testi. */
export const HC_TEST: ProtocolId = 'supine-roll';
/** Yatay kanal manevraları (kayıttan kanalı çıkarmak için). */
export const HC_PROTOCOLS: readonly ProtocolId[] = ['bbq-roll', 'gufoni-geo', 'gufoni-apo', 'supine-roll'];

export type DecisionWarn = 'ATYPICAL_LONG' | 'BOTH_SIDES' | 'SIDE_CONFLICT' | 'NOT_TRIGGERED';

export interface BoldDecision {
  canal: HomeCanal;
  /** Uygulamanın önerdiği taraf; null: önerilecek taraf yok (kullanıcı seçer). */
  side: Side | null;
  /** Şiddet ayırt edilemedi: iki tarafa sırayla manevra önerilir (yalnız arka kanal). */
  both?: boolean;
  /** Gösterilecek uyarı (aşılırsa kayıt: `REFER_<warn>`; taraf çelişkisinde `SIDE_CONFLICT`). null: temiz karar. */
  warn: DecisionWarn | null;
  /** İki taraf pozitif ve şiddet ölçümden ayırt edilemedi: "hangisi daha şiddetliydi" sorulsun. */
  ask?: boolean;
  /** Hekimin (reçete ya da kurulumdaki tanı) dediği taraf testle çelişiyorsa o taraf. */
  doctorSide?: Side;
  /** Kararın tek cümlelik gerekçesi (ekranda, seste ve kayıtta). */
  reason: string;
}

export interface DecisionContext {
  /** Hasta "hangisi daha şiddetliydi" sorusuna yanıt verdiyse. */
  stronger?: Side | 'equal' | null;
  /** Hekimin dediği taraf (geçerli reçete ya da kurulumdaki tanı). Testle çelişirse uyarı. */
  doctorSide?: Side | null;
  /** Test tetiklemezse önerilecek taraf (hekim tanısı, son atak). */
  suggested?: Side | null;
}

const NAME: Record<Side, string> = { R: 'sağ', L: 'sol' };
const DATIVE: Record<Side, string> = { R: 'sağa', L: 'sola' };
const otherOf = (s: Side): Side => (s === 'R' ? 'L' : 'R');

/** Temiz karar mı (uyarı yok, soru yok, tek taraf): telefon alında kalır, tek dokunuşla manevraya geçilir. */
export function isClean(d: BoldDecision): boolean {
  return !d.warn && !d.ask && !!d.side && !d.both;
}

function isAtypical(x: SideTestResult): boolean {
  return x.safetyStopped || (x.vertigo && (x.durationSec === null || x.durationSec >= ATYPICAL_SEC));
}

/** Şiddet ölçüsü (s): süre; bitişi işaretlenmediyse ya da güvenlik durdurmasıysa sonsuz (hâlâ sürüyordu). */
function strengthOf(x: SideTestResult): number {
  if (!x.vertigo && !x.safetyStopped) return 0;
  if (x.safetyStopped || x.durationSec === null) return Number.POSITIVE_INFINITY;
  return x.durationSec;
}

/** İki pozitif taraftan belirgin uzun süreni (yoksa null). */
export function longerSide(r: SideTestResult, l: SideTestResult, minDiff: number = STRONGER_DIFF_SEC): Side | null {
  const a = strengthOf(r);
  const b = strengthOf(l);
  if (a === b) return null;
  if (a === Number.POSITIVE_INFINITY) return 'R';
  if (b === Number.POSITIVE_INFINITY) return 'L';
  if (Math.abs(a - b) < minDiff) return null;
  return a > b ? 'R' : 'L';
}

const blank = (side: Side): SideTestResult => ({ side, vertigo: false, latencySec: null, durationSec: null, safetyStopped: false });

/**
 * İki pozitif tarafta taraf seçimi: hastanın yanıtı, ölçülen süre, hekimin dediği taraf; hiçbiri yoksa soru (ya da arka
 * kanalda iki tarafa sırayla).
 */
function pickOfTwo(
  r: SideTestResult,
  l: SideTestResult,
  ctx: DecisionContext,
  canal: HomeCanal
): { side: Side | null; both?: boolean; ask?: boolean; why: string } {
  if (ctx.stronger === 'R' || ctx.stronger === 'L') return { side: ctx.stronger, why: `${NAME[ctx.stronger]} tarafı daha şiddetli dediniz` };
  const longer = longerSide(r, l);
  if (longer) return { side: longer, why: `${NAME[longer]} tarafta baş dönmesi daha uzun sürdü` };
  if (ctx.stronger === undefined || ctx.stronger === null) return { side: null, ask: true, why: 'iki tarafta da benzer baş dönmesi oldu' };
  // "Aşağı yukarı aynı"
  const known = ctx.doctorSide ?? ctx.suggested ?? null;
  if (known) return { side: known, why: `şiddet aynıydı; daha önce bilinen taraf ${NAME[known]}` };
  if (canal === 'PC') return { side: 'R', both: true, why: 'şiddet aynıydı; iki tarafa sırayla manevra yapılabilir' };
  return { side: null, why: 'şiddet aynıydı; tarafı siz seçin' };
}

/**
 * Arka kanal kararı (iki taraflı Dix-Hallpike). Baş dönmesi olan taraf etkilenen taraftır; iki taraf pozitifse daha
 * şiddetli taraf; tetiklenmediyse bilinen tarafa öneri; atipik süre ve hekim tarafıyla çelişki uyarıyla devam eder.
 */
export function decidePosterior(results: SideTestResult[], ctx: DecisionContext = {}): BoldDecision {
  const r0 = results.find((x) => x.side === 'R');
  const l0 = results.find((x) => x.side === 'L');
  const d = decideTwoSides('PC', r0 ?? blank('R'), l0 ?? blank('L'), ctx);
  // Uzun baş dönmesiyle durdurulup öbür taraf test edilmediyse gerekçede söylenir.
  return r0 && l0 ? d : { ...d, reason: `${d.reason} Öbür taraf test edilmedi.` };
}

/**
 * Yatay kanal kararı (sırtüstü baş çevirme testi): daha şiddetli taraf etkilenen taraf kabul edilir (geotropik varsayım,
 * en sık biçim) → BBQ roll. Varsayım gerekçede söylenir.
 */
export function decideHorizontal(results: SideTestResult[], ctx: DecisionContext = {}): BoldDecision {
  const r = results.find((x) => x.side === 'R') ?? blank('R');
  const l = results.find((x) => x.side === 'L') ?? blank('L');
  return decideTwoSides('HC', r, l, ctx);
}

function decideTwoSides(canal: HomeCanal, r: SideTestResult, l: SideTestResult, ctx: DecisionContext): BoldDecision {
  const pos = [r, l].filter((x) => x.vertigo || x.safetyStopped);
  const assume = canal === 'HC' ? ' Yatay kanalda daha şiddetli taraf etkilenen taraf kabul edilir (en sık biçim).' : '';
  if (pos.length === 0) {
    const s = ctx.suggested ?? ctx.doctorSide ?? null;
    return {
      canal,
      side: s,
      warn: 'NOT_TRIGGERED',
      reason: s ? `Testte baş dönmesi başlamadı; bilinen taraf ${NAME[s]}.` : 'Testte baş dönmesi başlamadı.'
    };
  }
  let side: Side | null;
  let both: boolean | undefined;
  let ask: boolean | undefined;
  let why: string;
  if (pos.length === 1) {
    side = pos[0]!.side;
    why = canal === 'HC' ? `yalnız başınızı ${DATIVE[side]} çevirince baş dönmesi oldu` : `yalnız ${NAME[side]} yanınıza yatınca baş dönmesi oldu`;
  } else {
    const p = pickOfTwo(r, l, ctx, canal);
    side = p.side;
    both = p.both;
    ask = p.ask;
    why = p.why;
  }
  const atypical = isAtypical(r) || isAtypical(l);
  const doctorSide = ctx.doctorSide && side && ctx.doctorSide !== side && !both ? ctx.doctorSide : undefined;
  const warn: DecisionWarn | null = ask
    ? null
    : atypical
      ? 'ATYPICAL_LONG'
      : doctorSide
        ? 'SIDE_CONFLICT'
        : pos.length === 2 && canal === 'PC'
          ? 'BOTH_SIDES'
          : !side
            ? 'BOTH_SIDES'
            : null;
  const cap = why.charAt(0).toLocaleUpperCase('tr-TR') + why.slice(1);
  return {
    canal,
    side,
    ...(both ? { both } : {}),
    ...(ask ? { ask } : {}),
    ...(doctorSide ? { doctorSide } : {}),
    warn,
    reason: `${cap}.${canal === 'HC' && side ? assume : ''}`
  };
}

/** Bir adım kaydından taraf testi sonucu (baş dönmesi işareti, gecikme, süre). */
export function resultFromRecord(side: Side, rec: StepRecord | undefined, safetyStopped = false): SideTestResult {
  const v = rec ? vertigoSummary(rec) : null;
  return { side, vertigo: !!v, latencySec: v?.latencySec ?? null, durationSec: v?.durationSec ?? null, safetyStopped };
}

/** Sırtüstü baş çevirme testinin kayıtlarından iki tarafın sonucu (sağa çevirme → sağ, sola çevirme → sol). */
export function rollResults(records: StepRecord[]): SideTestResult[] {
  return [resultFromRecord('R', records.find((r) => r.stepId === 'roll-right')), resultFromRecord('L', records.find((r) => r.stepId === 'roll-left'))];
}

/** Atak kaydının kanala bakan alanları (core, state türlerine bağlı olmasın diye yapısal). */
export interface EpisodeCanalInfo {
  maneuvers: { protocolId: ProtocolId }[];
  sideTests: { canal?: HomeCanal }[];
  subtype?: { trigger: string };
}

/**
 * Atağın kanalı: son manevra, yoksa son taraf testi, yoksa alt tip yanıtı ("yatakta dönünce" → yatay). Varsayılan arka kanal.
 */
export function episodeCanal(e: EpisodeCanalInfo | null | undefined): HomeCanal {
  if (!e) return 'PC';
  const lastMan = e.maneuvers[e.maneuvers.length - 1];
  if (lastMan) return HC_PROTOCOLS.includes(lastMan.protocolId) ? 'HC' : 'PC';
  const lastTest = e.sideTests[e.sideTests.length - 1];
  if (lastTest) return lastTest.canal ?? 'PC';
  return e.subtype?.trigger === 'turn' ? 'HC' : 'PC';
}

/** Kanala göre manevra (arka kanalda reçetedeki manevra ya da Epley). */
export function maneuverFor(canal: HomeCanal, pcManeuver: 'epley' | 'semont' = 'epley'): ProtocolId {
  return canal === 'HC' ? HC_MANEUVER : pcManeuver;
}

/** Kanala göre tekrar testi. */
export function retestFor(canal: HomeCanal): ProtocolId {
  return canal === 'HC' ? HC_TEST : 'dix-hallpike';
}

/** Taraf testi sırası: bilinen (şüpheli) taraf varsa önce öbür taraf; yoksa sağ, sonra sol. */
export function sideOrder(known: Side | null | undefined): Side[] {
  return known ? [otherOf(known), known] : ['R', 'L'];
}

/** Kayıt için tek satır: "Uygulamanın kararı: …". */
export function decisionLogDetail(d: BoldDecision): string {
  const what = d.both ? 'iki tarafa sırayla' : d.side ? `${NAME[d.side]} taraf` : 'taraf seçilmedi';
  const man = d.canal === 'HC' ? 'BBQ roll (yatay kanal, geotropik varsayım)' : 'arka kanal manevrası';
  return `Uygulamanın kararı: ${what}, ${man}. ${d.reason}`;
}
