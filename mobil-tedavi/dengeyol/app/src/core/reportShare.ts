/**
 * Ev dönemi raporu: hastanın bir reçete dönemindeki ataklarının kısa özeti, ağsız olarak (QR kod / bağlantı) klinisyene
 * aktarılır (kullanıcı turu 3, F4; k09 Y2, k10 #12). Sunucu yok: verinin tamamı bağlantının içindedir. Klinisyen modunda
 * `/odyolog/ev-raporu/:token` açılınca çözülür ve aynı hasta koduyla muayeneye "ev dönemi" olarak eklenir.
 *
 * Biçim: <base64url(JSON)>.<FNV-1a 32 bit sağlama toplamı (hex)>; sağlama toplamı "E" öneki + gövde üzerinden alınır. Böylece
 * reçete bağlantısı (önek yok) hasta raporu sanılmaz, yapıştırılırsa "bu bir reçete" denir. Sağlama toplamı yazım/kopyalama
 * hatalarını yakalar; güvenlik imzası DEĞİLDİR (rapor hastanın kendi beyanıdır, klinisyen öyle okur).
 *
 * Boyut: QR'a sığsın diye anahtarlar kısa, zamanlar dakika, atak içi zamanlar atak başına göre dakika farkıdır. Bağlantı
 * REPORT_TOKEN_BUDGET karakteri aşarsa önce adım ayrıntısı, sonra en eski ataklar, sonra en eski manevralar çıkarılır ve
 * bu raporda işaretlenir (klinisyen eksik olduğunu görür). Çözücü REPORT_TOKEN_MAX'tan uzun bağlantıyı reddeder.
 *
 * Sürümler: v1 ilk biçim. Yeni alanlar isteğe bağlı eklenir (v1 çözücü tanımadığı alanı yok sayar); anlamı değişen bir
 * değişiklik sürümü artırır. Uygulamanın tanımadığı (daha yeni) sürüm "uygulamayı güncelleyin" hatasıyla reddedilir.
 */
import { fnv1a, PID_MAX_LEN, type Prescription, rxCode, rxIssuedAt, rxValidUntil } from './prescription';
import { PROTOCOLS, type ProtocolId, resolveProtocol, type Side } from './protocols';
import { type StepRecord, type StopReason, vertigoSummary } from './runner';
import type { SideDecision, SideTestResult } from './safety';
// Yalnız tür içe aktarımı (çalışma zamanında core → state bağımlılığı yok).
import type { AppData, Episode, EpisodeStatus, ManeuverLog, RetestLog } from '../state/types';

export const REPORT_SHARE_VERSION = 1;
/** Bu uygulamanın çözebildiği sürümler. */
const SUPPORTED_VERSIONS = [1];
/** Üretilen bağlantının hedef üst sınırı (karakter): QR (hata düzeltme L) telefon ekranından rahat okunsun. */
export const REPORT_TOKEN_BUDGET = 1400;
/** Çözücünün kabul ettiği en uzun bağlantı (karakter); daha uzunu bozuk/elle üretilmiş sayılır. */
export const REPORT_TOKEN_MAX = 2400;

/** Dizilerin üst sınırları (çözücü daha uzununu reddeder; kodlayıcı aşmaz). */
const MAX_EPISODES = 30;
const MAX_MANEUVERS = 60;
const MAX_SIDE_TESTS = 20;
const MAX_RETESTS = 20;
const MAX_STEPS = 12;
const NOTE_MAX = 60;
const MIN = 60_000;

// ---- Çözülmüş (okunur) biçim ---------------------------------------------------------------------------

export type StepFlag =
  | 'endedEarly'
  | 'slowTransition'
  | 'movedBeforeCommand'
  | 'noSitThrough'
  | 'wrongSide'
  | 'borderline'
  | 'unreachable'
  | 'manual';

/** Bayrakların kodlamadaki bit sırası (değiştirilmez; yeni bayrak sona eklenir). */
const FLAG_BITS: StepFlag[] = ['endedEarly', 'slowTransition', 'movedBeforeCommand', 'noSitThrough', 'wrongSide', 'borderline', 'unreachable', 'manual'];

export interface HomeStep {
  /**
   * Protokoldeki adım sırası (0'dan). Yürütücü adımları sırayla kaydettiği için kayıttaki sıradır; bağlantıya yazılmaz.
   */
  index: number;
  title: string;
  holdSec: number;
  flags: StepFlag[];
  /** Yalnız yavaş geçişte (s, 0.1 duyarlık). */
  transitionSec: number | null;
  /** Baş dönmesi işareti: pozisyona gelişten gecikme, en uzun süre (bitişi işaretlenmediyse null), işaret sayısı. */
  vertigo: { latencySec: number; durationSec: number | null; marks: number } | null;
}

export type AfterSymptoms = NonNullable<ManeuverLog['afterSymptoms']>;

export interface HomeManeuver {
  at: number;
  protocolId: ProtocolId;
  side: Side | null;
  completed: boolean;
  stopReason: StopReason | null;
  pauses: number;
  assisted?: boolean;
  manual: boolean;
  afterSymptoms?: AfterSymptoms;
  /** Kayıtlı adım sayısı (adım ayrıntısı çıkarılsa da korunur). */
  stepCount: number;
  /** Adım ayrıntısı; boyut nedeniyle çıkarıldıysa null. */
  steps: HomeStep[] | null;
}

export type SideCell = Omit<SideTestResult, 'side'>;

export interface HomeSideTest {
  at: number;
  R: SideCell | null;
  L: SideCell | null;
  decision: SideDecision;
}

export interface HomeRetest {
  at: number;
  kind: RetestLog['kind'];
  side: Side;
  vertigo: boolean;
  latencySec: number | null;
  durationSec: number | null;
}

export interface HomeEpisode {
  startedAt: number;
  endedAt?: number;
  status: EpisodeStatus;
  endNote?: string;
  side: Side | null;
  rxShortcut?: boolean;
  sideTests: HomeSideTest[];
  maneuvers: HomeManeuver[];
  retests: HomeRetest[];
}

export interface HomeReport {
  v: number;
  generatedAt: number;
  /** Reçetedeki hasta kodu (klinisyenin verdiği). */
  pid?: string;
  /** Reçete kodu (klinisyenin HBYS notundaki kod). */
  rxCode?: string;
  rx?: Pick<Prescription, 'date' | 'side' | 'maneuver' | 'perDay' | 'days'>;
  /** Raporlanan dönem (ms): reçete varsa reçete dönemi (son geçerli gün dahil). */
  period: { from: number; to: number };
  episodes: HomeEpisode[];
  /** Boyut nedeniyle yapılan kısaltmalar (klinisyene gösterilir). */
  stepsDropped: boolean;
  episodesOmitted: number;
  maneuversOmitted: number;
}

// ---- Hasta verisinden rapor ------------------------------------------------------------------------------

function stepFlags(r: StepRecord): StepFlag[] {
  return FLAG_BITS.filter((f) => !!r[f]);
}

/** Adım başlığı tarafı doldurulmuş biçimde ("Oturuş, baş sağa 45°"); taraf bilinmiyorsa "{…}" belirteçleri yazılmaz. */
function stepTitle(protocolId: ProtocolId, side: Side | null, index: number): string | null {
  const def = PROTOCOLS[protocolId];
  if (!def) return null;
  try {
    const t = resolveProtocol(protocolId, side).steps[index]?.title;
    if (t) return t;
  } catch {
    /* taraflı protokolde taraf yok */
  }
  const raw = def.steps[index]?.title;
  return raw && !raw.includes('{') ? raw : null;
}

export function homeStepOf(protocolId: ProtocolId, r: StepRecord, index: number, side: Side | null = null): HomeStep {
  const v = vertigoSummary(r);
  return {
    index,
    title: stepTitle(protocolId, side, index) ?? r.title,
    holdSec: Math.max(0, Math.round(r.holdSec)),
    flags: stepFlags(r),
    transitionSec: r.slowTransition && r.transitionSec != null ? Math.round(r.transitionSec * 10) / 10 : null,
    vertigo: v ? { latencySec: v.latencySec, durationSec: v.durationSec, marks: r.vertigoMarks.length } : null
  };
}

export function homeManeuverOf(m: ManeuverLog): HomeManeuver {
  const pauses = typeof m.pauses === 'number' ? m.pauses : m.records.reduce((s, r) => s + (r.pauses ?? 0), 0);
  const out: HomeManeuver = {
    at: m.at,
    protocolId: m.protocolId,
    side: m.side,
    completed: m.completed,
    stopReason: m.stopReason,
    pauses,
    manual: m.manual,
    stepCount: m.records.length,
    steps: m.records.slice(0, MAX_STEPS).map((r, i) => homeStepOf(m.protocolId, r, i, m.side))
  };
  if (m.assisted !== undefined) out.assisted = m.assisted;
  if (m.afterSymptoms) out.afterSymptoms = m.afterSymptoms;
  return out;
}

export function homeEpisodeOf(e: Episode): HomeEpisode {
  const cell = (t: Episode['sideTests'][number], s: Side): SideCell | null => {
    const r = t.results.find((x) => x.side === s);
    return r ? { vertigo: r.vertigo, latencySec: r.latencySec, durationSec: r.durationSec, safetyStopped: r.safetyStopped } : null;
  };
  const out: HomeEpisode = {
    startedAt: e.startedAt,
    status: e.status,
    side: e.side,
    sideTests: e.sideTests.slice(-MAX_SIDE_TESTS).map((t) => ({ at: t.at, R: cell(t, 'R'), L: cell(t, 'L'), decision: t.decision })),
    maneuvers: e.maneuvers.slice(-MAX_MANEUVERS).map(homeManeuverOf),
    retests: e.retests.slice(-MAX_RETESTS).map((r) => ({
      at: r.at,
      kind: r.kind,
      side: r.side,
      vertigo: r.vertigo,
      latencySec: r.latencySec,
      durationSec: r.durationSec
    }))
  };
  if (e.endedAt !== undefined) out.endedAt = e.endedAt;
  const note = cleanNote(e.endNote);
  if (note) out.endNote = note;
  if (e.rxShortcut) out.rxShortcut = true;
  return out;
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * Raporlanacak dönem ve ataklar. Reçete varsa ve odaktaki atak (yoksa şu an) reçete döneminin içindeyse reçete dönemindeki
 * bütün ataklar; değilse yalnız odaktaki atak; o da yoksa son 14 gün.
 */
export function selectReportEpisodes(d: AppData, now: number, focusEpisodeId?: string): { episodes: Episode[]; period: { from: number; to: number } } {
  const rx = d.patient?.prescription;
  const focus = focusEpisodeId ? d.episodes.find((e) => e.id === focusEpisodeId) : undefined;
  const issued = rx ? rxIssuedAt(rx) : null;
  const until = rx ? rxValidUntil(rx) : null;
  const ref = focus?.startedAt ?? now;
  const byStart = (a: Episode, b: Episode) => a.startedAt - b.startedAt;
  if (issued !== null && until !== null && ref >= issued && ref < until) {
    return {
      episodes: d.episodes.filter((e) => e.startedAt >= issued && e.startedAt < until).sort(byStart),
      period: { from: issued, to: until - 1 }
    };
  }
  if (focus) return { episodes: [focus], period: { from: focus.startedAt, to: focus.endedAt ?? now } };
  const from = now - 14 * DAY;
  return { episodes: d.episodes.filter((e) => e.startedAt >= from && e.startedAt <= now).sort(byStart), period: { from, to: now } };
}

/** Hasta verisinden ev dönemi raporu (kodlanmadan önce; kısaltma yok). `episodes` verilirse dönem onlardan çıkarılır. */
export function buildHomeReport(d: AppData, opts: { now?: number; focusEpisodeId?: string; episodes?: Episode[] } = {}): HomeReport {
  const now = opts.now ?? Date.now();
  let sel = selectReportEpisodes(d, now, opts.focusEpisodeId);
  if (opts.episodes) {
    const eps = [...opts.episodes].sort((a, b) => a.startedAt - b.startedAt);
    const from = eps[0]?.startedAt ?? now;
    const to = Math.max(from, ...eps.map((e) => e.endedAt ?? now));
    sel = { episodes: eps, period: { from, to } };
  }
  const p = d.patient;
  const rx = p?.prescription;
  const out: HomeReport = {
    v: REPORT_SHARE_VERSION,
    // Dakikaya yuvarlanır (bağlantıdaki duyarlık): ekranda gösterilen rapor çözülenle aynı olsun.
    generatedAt: toMin(now) * MIN,
    period: { from: toMin(sel.period.from) * MIN, to: toMin(sel.period.to) * MIN },
    episodes: sel.episodes.slice(-MAX_EPISODES).map(homeEpisodeOf),
    stepsDropped: false,
    episodesOmitted: Math.max(0, sel.episodes.length - MAX_EPISODES),
    maneuversOmitted: sel.episodes.slice(-MAX_EPISODES).reduce((n, e) => n + Math.max(0, e.maneuvers.length - MAX_MANEUVERS), 0)
  };
  if (rx) {
    const code = rxCode(p?.prescriptionToken ?? rx) || rxCode(rx);
    if (code) out.rxCode = code;
    if (rx.pid) out.pid = rx.pid;
    out.rx = { date: rx.date, side: rx.side, maneuver: rx.maneuver, perDay: rx.perDay, days: rx.days };
  }
  return out;
}

// ---- Kodlama ---------------------------------------------------------------------------------------------

const STATUS_CODE: Record<EpisodeStatus, string> = { active: 'a', resolved: 'r', referred: 'f', emergency: 'e', closed: 'c' };
const STOP_CODE: Record<StopReason, string> = {
  VERTIGO_TOO_LONG: 'V',
  POSITION_UNREACHABLE: 'P',
  USER_ABORT: 'A',
  USER_FEELS_UNWELL: 'U',
  INTERRUPTED: 'I'
};
const AFTER_CODE: Record<AfterSymptoms, string> = { none: 'n', mild: 'm', severe: 's', neuro: 'x' };
const KIND_CODE: Record<RetestLog['kind'], string> = { early: 'e', morning: 'm', other: 'o' };
const REFER_CODE: Record<Extract<SideDecision, { kind: 'REFER' }>['reason'], string> = {
  ATYPICAL_LONG: 'FL',
  BOTH_SIDES: 'FB',
  SIDE_CONFLICT: 'FC',
  INCOMPLETE: 'FI'
};
const invert = <K extends string>(m: Record<K, string>): Record<string, K> =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k])) as Record<string, K>;
const STATUS_OF = invert(STATUS_CODE);
const STOP_OF = invert(STOP_CODE);
const AFTER_OF = invert(AFTER_CODE);
const KIND_OF = invert(KIND_CODE);
const REFER_OF = invert(REFER_CODE);

const toMin = (t: number) => Math.floor(t / MIN);
const off = (t: number, base: number) => Math.max(0, toMin(t) - toMin(base));

function cleanNote(s: unknown): string | undefined {
  if (typeof s !== 'string') return undefined;
  const t = s.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, NOTE_MAX).trim();
  return t.length ? t : undefined;
}

type WireCell = [number, number | null, number | null] | null;
/** Adım: [bekleme s, bayrak bitleri] (+ [geçiş×10 | null] + [gecikme, süre | null] + [işaret sayısı > 1]). Uzunluk 2, 3, 5 ya da 6. */
type WireStep = (number | null)[];
/**
 * Manevra: [başa göre dakika, protokol ('e' Epley, 's' Semont, diğerleri tam kimlik), taraf ('R'/'L'/0), durum harfleri,
 * duraklatma, kayıtlı adım sayısı, adımlar?]. Durum harfleri: ilk harf 'c' tamamlandı / durma kodu (V,P,A,U,I) / '-' yarıda;
 * sonra isteğe bağlı 'h' yakını yaptırdı ya da 'o' kendi başına, 'w' sensörsüz, sonrası belirti (n,m,s,x).
 */
type WireManeuver = [number, string, Side | 0, string, number, number, WireStep[]?];
interface WireEpisode {
  s: number;
  z?: number;
  u: string;
  n?: string;
  d?: Side;
  k?: 1;
  t?: [number, WireCell, WireCell, string][];
  m?: WireManeuver[];
  q?: [number, string, Side, 0 | 1, number | null, number | null][];
}
interface Wire {
  v: number;
  g: number;
  p?: string;
  c?: string;
  r?: [string, Side, 'e' | 's', number, number];
  a: number;
  b: number;
  e: WireEpisode[];
  x?: 1;
  o?: number;
  q?: number;
}

function wireCell(c: SideCell | null): WireCell {
  if (!c) return null;
  return [c.safetyStopped ? 2 : c.vertigo ? 1 : 0, c.latencySec, c.durationSec];
}

function wireDecision(d: SideDecision): string {
  switch (d.kind) {
    case 'TREAT':
      return `T${d.side}`;
    case 'NOT_TRIGGERED':
      return 'N';
    case 'ASK_STRONGER':
      return 'A';
    case 'REFER':
      return REFER_CODE[d.reason];
  }
}

function wireStep(s: HomeStep): WireStep {
  const flags = FLAG_BITS.reduce((acc, f, i) => (s.flags.includes(f) ? acc | (1 << i) : acc), 0);
  const out: WireStep = [s.holdSec, flags];
  if (s.transitionSec !== null || s.vertigo) out.push(s.transitionSec !== null ? Math.round(s.transitionSec * 10) : null);
  if (s.vertigo) {
    out.push(s.vertigo.latencySec, s.vertigo.durationSec);
    if (s.vertigo.marks > 1) out.push(s.vertigo.marks);
  }
  return out;
}

const PROTO_CODE: Partial<Record<ProtocolId, string>> = { epley: 'e', semont: 's' };
const PROTO_OF: Record<string, ProtocolId> = { e: 'epley', s: 'semont' };

function wireManeuver(m: HomeManeuver, base: number, withSteps: boolean): WireManeuver {
  let state = m.completed ? 'c' : m.stopReason ? STOP_CODE[m.stopReason] : '-';
  if (m.assisted !== undefined) state += m.assisted ? 'h' : 'o';
  if (m.manual) state += 'w';
  if (m.afterSymptoms) state += AFTER_CODE[m.afterSymptoms];
  const w: WireManeuver = [off(m.at, base), PROTO_CODE[m.protocolId] ?? m.protocolId, m.side ?? 0, state, m.pauses, m.stepCount];
  if (withSteps && m.steps?.length) w.push(m.steps.map(wireStep));
  return w;
}

function wireEpisode(e: HomeEpisode, withSteps: boolean): WireEpisode {
  const b = e.startedAt;
  const w: WireEpisode = { s: toMin(b), u: STATUS_CODE[e.status] };
  if (e.endedAt !== undefined) w.z = off(e.endedAt, b);
  if (e.endNote) w.n = e.endNote;
  if (e.side) w.d = e.side;
  if (e.rxShortcut) w.k = 1;
  if (e.sideTests.length) w.t = e.sideTests.map((t) => [off(t.at, b), wireCell(t.R), wireCell(t.L), wireDecision(t.decision)]);
  if (e.maneuvers.length) w.m = e.maneuvers.map((m) => wireManeuver(m, b, withSteps));
  if (e.retests.length) w.q = e.retests.map((r) => [off(r.at, b), KIND_CODE[r.kind], r.side, r.vertigo ? 1 : 0, r.latencySec, r.durationSec]);
  return w;
}

function toWire(r: HomeReport): Wire {
  const w: Wire = { v: REPORT_SHARE_VERSION, g: toMin(r.generatedAt), a: toMin(r.period.from), b: toMin(r.period.to), e: [] };
  if (r.pid) w.p = r.pid.slice(0, PID_MAX_LEN);
  if (r.rxCode) w.c = r.rxCode;
  if (r.rx) w.r = [r.rx.date, r.rx.side, r.rx.maneuver === 'epley' ? 'e' : 's', r.rx.perDay, r.rx.days];
  w.e = r.episodes.map((e) => wireEpisode(e, !r.stepsDropped));
  if (r.stepsDropped) w.x = 1;
  if (r.episodesOmitted > 0) w.o = r.episodesOmitted;
  if (r.maneuversOmitted > 0) w.q = r.maneuversOmitted;
  return w;
}

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

/** Rapor sağlama toplamı: "E" öneki reçete bağlantısıyla karışmasın diye. */
const reportSum = (body: string) => fnv1a(`E${body}`);

/** Kısaltma yapmadan kodlar (testler ve iç kullanım). */
export function encodeHomeReportRaw(r: HomeReport): string {
  const body = toBase64Url(JSON.stringify(toWire(r)));
  return `${body}.${reportSum(body)}`;
}

/**
 * Raporu bütçeye sığdırarak kodlar. Sıra: (1) adım ayrıntısı çıkarılır, (2) en eski ataklar çıkarılır (en az biri kalır),
 * (3) kalan ataklarda en eski manevralar çıkarılır, (4) en eski taraf/tekrar testleri çıkarılır. Dönen `report` gerçekte
 * kodlanan (kısaltılmış) rapordur; ekranda ne gönderildiği ondan gösterilir.
 */
export function encodeHomeReport(r: HomeReport, budget: number = REPORT_TOKEN_BUDGET): { token: string; report: HomeReport; truncated: boolean } {
  let cur: HomeReport = r;
  let token = encodeHomeReportRaw(cur);
  const fits = () => token.length <= budget;
  const retry = (next: HomeReport) => {
    cur = next;
    token = encodeHomeReportRaw(cur);
  };
  if (!fits() && !cur.stepsDropped && cur.episodes.some((e) => e.maneuvers.some((m) => m.steps?.length))) {
    retry({ ...cur, stepsDropped: true, episodes: cur.episodes.map((e) => ({ ...e, maneuvers: e.maneuvers.map((m) => ({ ...m, steps: null })) })) });
  }
  while (!fits() && cur.episodes.length > 1) {
    retry({ ...cur, episodes: cur.episodes.slice(1), episodesOmitted: cur.episodesOmitted + 1 });
  }
  // Kalan ataklarda (en eskiden başlayarak) en eski manevra çıkarılır.
  while (!fits() && cur.episodes.some((e) => e.maneuvers.length > 0)) {
    const i = cur.episodes.findIndex((e) => e.maneuvers.length > 0);
    const eps = cur.episodes.map((e, j) => (j === i ? { ...e, maneuvers: e.maneuvers.slice(1) } : e));
    retry({ ...cur, episodes: eps, maneuversOmitted: cur.maneuversOmitted + 1 });
  }
  while (!fits() && cur.episodes.some((e) => e.sideTests.length > 1 || e.retests.length > 1)) {
    const eps = cur.episodes.map((e) => ({
      ...e,
      sideTests: e.sideTests.length > 1 ? e.sideTests.slice(1) : e.sideTests,
      retests: e.retests.length > 1 ? e.retests.slice(1) : e.retests
    }));
    retry({ ...cur, episodes: eps });
  }
  return { token, report: cur, truncated: cur !== r };
}

/** Uygulamanın kendi adresine göre ev raporu bağlantısı (klinisyen modunda açılır). */
export function homeReportUrl(baseUrl: string, token: string): string {
  return `${baseUrl.split('#')[0]!}#/odyolog/ev-raporu/${token}`;
}

/** Raporun kimliği (yinelenen içe aktarmayı tanımak için): sağlama toplamı. */
export function homeReportId(token: string): string {
  return (token.trim().split('.')[1] ?? '').toLowerCase();
}

/** Yapıştırılan metinden rapor bağlantısını (token) çıkarır; tam bağlantı ya da yalnız token kabul edilir. */
export function extractReportToken(text: string): string | null {
  const t = text.trim();
  const m = /ev-raporu\/([A-Za-z0-9_-]+\.[0-9a-fA-F]{8})/.exec(t) ?? /^([A-Za-z0-9_-]+\.[0-9a-fA-F]{8})$/.exec(t);
  return m ? m[1]! : null;
}

// ---- Çözme -----------------------------------------------------------------------------------------------

export type ReportDecodeError = 'FORMAT' | 'SIZE' | 'CHECKSUM' | 'KIND' | 'VERSION' | 'FIELDS';

export const REPORT_DECODE_ERROR_TEXT: Record<ReportDecodeError, string> = {
  FORMAT: 'Hasta raporu bağlantısı okunamadı. Bağlantının tamamının kopyalandığından emin olun ya da QR kodu yeniden okutun.',
  SIZE: 'Hasta raporu bağlantısı beklenenden uzun; bozulmuş ya da başka bir uygulamaca üretilmiş olabilir.',
  CHECKSUM: 'Hasta raporu bağlantısı bozulmuş ya da eksik. QR kodu yeniden okutun ya da hastadan bağlantıyı yeniden isteyin.',
  KIND: 'Bu bir ev reçetesi bağlantısı, hasta raporu değil.',
  VERSION: 'Bu rapor uygulamanın daha yeni bir sürümüyle oluşturulmuş. Uygulamayı güncelleyin.',
  FIELDS: 'Hasta raporunda eksik ya da geçersiz bilgi var. Hastadan raporu yeniden göstermesini isteyin.'
};

class FieldError extends Error {}
const fail = (): never => {
  throw new FieldError();
};
const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
function int(x: unknown, min: number, max: number): number {
  if (typeof x !== 'number' || !Number.isInteger(x) || x < min || x > max) fail();
  return x as number;
}
function optInt(x: unknown, min: number, max: number): number | null {
  return x === null || x === undefined ? null : int(x, min, max);
}
function arr(x: unknown, max: number): unknown[] {
  if (x === undefined) return [];
  if (!Array.isArray(x) || x.length > max) fail();
  return x as unknown[];
}
function side(x: unknown): Side {
  if (x !== 'R' && x !== 'L') fail();
  return x as Side;
}
/** Nesnenin kendi anahtarı mı ("toString" gibi kalıtılan adlar kabul edilmesin). */
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
function code<T>(map: Record<string, T>, x: unknown): T {
  if (typeof x !== 'string' || !own(map, x)) fail();
  return map[x as string]!;
}
/** Dakika cinsinden zaman (2000–2100 arası). */
const MIN_LO = toMin(Date.UTC(2000, 0, 1));
const MIN_HI = toMin(Date.UTC(2100, 0, 1));
const OFF_MAX = 366 * 24 * 60;
const SEC_MAX = 24 * 60 * 60;

function readCell(x: unknown): SideCell | null {
  if (x === null || x === undefined) return null;
  if (!Array.isArray(x) || x.length !== 3) fail();
  const a = x as unknown[];
  const f = int(a[0], 0, 2);
  return { vertigo: f >= 1, safetyStopped: f === 2, latencySec: optInt(a[1], 0, SEC_MAX), durationSec: optInt(a[2], 0, SEC_MAX) };
}

function readDecision(x: unknown): SideDecision {
  if (x === 'TR' || x === 'TL') return { kind: 'TREAT', side: x === 'TR' ? 'R' : 'L', note: null };
  if (x === 'N') return { kind: 'NOT_TRIGGERED' };
  if (x === 'A') return { kind: 'ASK_STRONGER' };
  return { kind: 'REFER', reason: code(REFER_OF, x) };
}

function readStep(x: unknown, protocolId: ProtocolId, index: number, side: Side | null): HomeStep {
  if (!Array.isArray(x) || x.length < 2 || x.length === 4 || x.length > 6) fail();
  const a = x as unknown[];
  const flagsN = int(a[1], 0, (1 << FLAG_BITS.length) - 1);
  const tr = optInt(a[2], 0, 36000);
  const hasV = a.length >= 5;
  return {
    index,
    title: stepTitle(protocolId, side, index) ?? `${index + 1}. adım`,
    holdSec: int(a[0], 0, SEC_MAX),
    flags: FLAG_BITS.filter((_, i) => flagsN & (1 << i)),
    transitionSec: tr !== null ? tr / 10 : null,
    vertigo: hasV ? { latencySec: int(a[3], 0, SEC_MAX), durationSec: optInt(a[4], 0, SEC_MAX), marks: a.length === 6 ? int(a[5], 2, 999) : 1 } : null
  };
}

function readState(x: unknown): Pick<HomeManeuver, 'completed' | 'stopReason' | 'manual' | 'assisted' | 'afterSymptoms'> {
  if (typeof x !== 'string' || x.length < 1 || x.length > 4) fail();
  const s = x as string;
  const first = s[0]!;
  const out: Pick<HomeManeuver, 'completed' | 'stopReason' | 'manual' | 'assisted' | 'afterSymptoms'> = {
    completed: first === 'c',
    stopReason: first === 'c' || first === '-' ? null : code(STOP_OF, first),
    manual: false
  };
  // Sıra sabittir: yardım (h/o), sensörsüz (w), sonrası (n/m/s/x); her biri en çok bir kez.
  let i = 1;
  if (s[i] === 'h' || s[i] === 'o') out.assisted = s[i++] === 'h';
  if (s[i] === 'w') {
    out.manual = true;
    i++;
  }
  if (i < s.length) out.afterSymptoms = code(AFTER_OF, s[i++]);
  if (i !== s.length) fail();
  return out;
}

function readManeuver(x: unknown, base: number): HomeManeuver {
  if (!Array.isArray(x) || x.length < 6 || x.length > 7) fail();
  const a = x as unknown[];
  if (typeof a[1] !== 'string') fail();
  const pc = a[1] as string;
  // Epley/Semont yalnız kısa koduyla yazılır; diğer protokoller tam kimlikle.
  const protocolId: ProtocolId = own(PROTO_OF, pc) ? PROTO_OF[pc]! : own(PROTOCOLS, pc) && !PROTO_CODE[pc as ProtocolId] ? (pc as ProtocolId) : fail();
  const st = readState(a[3]);
  const mSide = a[2] === 0 ? null : side(a[2]);
  const out: HomeManeuver = {
    at: base + int(a[0], 0, OFF_MAX) * MIN,
    protocolId,
    side: mSide,
    completed: st.completed,
    stopReason: st.stopReason,
    pauses: int(a[4], 0, 999),
    manual: st.manual,
    stepCount: int(a[5], 0, 99),
    steps: a.length === 7 ? arr(a[6], MAX_STEPS).map((s, i) => readStep(s, protocolId, i, mSide)) : []
  };
  if (st.assisted !== undefined) out.assisted = st.assisted;
  if (st.afterSymptoms !== undefined) out.afterSymptoms = st.afterSymptoms;
  return out;
}

function readEpisode(x: unknown, stepsDropped: boolean): HomeEpisode {
  if (!isObj(x)) fail();
  const o = x as Record<string, unknown>;
  const startedAt = int(o.s, MIN_LO, MIN_HI) * MIN;
  const out: HomeEpisode = {
    startedAt,
    status: code(STATUS_OF, o.u),
    side: o.d === undefined ? null : side(o.d),
    sideTests: arr(o.t, MAX_SIDE_TESTS).map((t) => {
      if (!Array.isArray(t) || t.length !== 4) fail();
      const a = t as unknown[];
      return { at: startedAt + int(a[0], 0, OFF_MAX) * MIN, R: readCell(a[1]), L: readCell(a[2]), decision: readDecision(a[3]) };
    }),
    maneuvers: arr(o.m, MAX_MANEUVERS).map((m) => {
      const hm = readManeuver(m, startedAt);
      return stepsDropped ? { ...hm, steps: null } : hm;
    }),
    retests: arr(o.q, MAX_RETESTS).map((r) => {
      if (!Array.isArray(r) || r.length !== 6) fail();
      const a = r as unknown[];
      return {
        at: startedAt + int(a[0], 0, OFF_MAX) * MIN,
        kind: code(KIND_OF, a[1]),
        side: side(a[2]),
        vertigo: int(a[3], 0, 1) === 1,
        latencySec: optInt(a[4], 0, SEC_MAX),
        durationSec: optInt(a[5], 0, SEC_MAX)
      };
    })
  };
  if (o.z !== undefined) out.endedAt = startedAt + int(o.z, 0, OFF_MAX) * MIN;
  if (o.n !== undefined) {
    const n = cleanNote(o.n);
    if (n) out.endNote = n;
  }
  if (o.k !== undefined) {
    if (o.k !== 1) fail();
    out.rxShortcut = true;
  }
  return out;
}

function readWire(o: Record<string, unknown>): HomeReport {
  if (!Array.isArray(o.e)) fail();
  const stepsDropped = o.x === undefined ? false : o.x === 1 ? true : fail();
  const out: HomeReport = {
    v: o.v as number,
    generatedAt: int(o.g, MIN_LO, MIN_HI) * MIN,
    period: { from: int(o.a, MIN_LO, MIN_HI) * MIN, to: int(o.b, MIN_LO, MIN_HI) * MIN },
    episodes: arr(o.e, MAX_EPISODES).map((e) => readEpisode(e, stepsDropped)),
    stepsDropped,
    episodesOmitted: o.o === undefined ? 0 : int(o.o, 1, 9999),
    maneuversOmitted: o.q === undefined ? 0 : int(o.q, 1, 9999)
  };
  if (o.p !== undefined) {
    if (typeof o.p !== 'string') fail();
    const pid = cleanNote(o.p)?.slice(0, PID_MAX_LEN);
    if (pid) out.pid = pid;
  }
  if (o.c !== undefined) {
    if (typeof o.c !== 'string' || !/^[0-9a-f]{8}$/.test(o.c)) fail();
    out.rxCode = o.c as string;
  }
  if (o.r !== undefined) {
    if (!Array.isArray(o.r) || o.r.length !== 5) fail();
    const a = o.r as unknown[];
    if (typeof a[0] !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(a[0])) fail();
    if (a[2] !== 'e' && a[2] !== 's') fail();
    out.rx = { date: a[0] as string, side: side(a[1]), maneuver: a[2] === 'e' ? 'epley' : 'semont', perDay: int(a[3], 1, 9), days: int(a[4], 1, 99) };
  }
  return out;
}

export function decodeHomeReport(token: string): { ok: true; value: HomeReport } | { ok: false; error: ReportDecodeError } {
  const t = token.trim();
  if (t.length > REPORT_TOKEN_MAX) return { ok: false, error: 'SIZE' };
  const parts = t.split('.');
  if (parts.length !== 2 || !parts[0] || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[0-9a-fA-F]{8}$/.test(parts[1] ?? '')) {
    return { ok: false, error: 'FORMAT' };
  }
  const [body, sum] = parts as [string, string];
  if (reportSum(body) !== sum.toLowerCase()) {
    // Reçete bağlantısının sağlama toplamı öneksizdir.
    return { ok: false, error: fnv1a(body) === sum.toLowerCase() ? 'KIND' : 'CHECKSUM' };
  }
  let obj: unknown;
  try {
    obj = JSON.parse(fromBase64Url(body));
  } catch {
    return { ok: false, error: 'FORMAT' };
  }
  if (!isObj(obj)) return { ok: false, error: 'FORMAT' };
  if (typeof obj.v !== 'number' || !SUPPORTED_VERSIONS.includes(obj.v)) return { ok: false, error: 'VERSION' };
  try {
    return { ok: true, value: readWire(obj) };
  } catch (e) {
    if (e instanceof FieldError) return { ok: false, error: 'FIELDS' };
    throw e;
  }
}
