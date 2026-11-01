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
 *
 * v2 (kullanıcı turu 6; k09, k02, k10): adım bayraklarına "yüzüstünden gelme" (`proneArrival`, 9. bit) ve atağa testte
 * durdurma kayıtları (`testStops`, "y" anahtarı) eklendi. v1 çözücü 9. biti geçersiz sayar (FIELDS: "eksik ya da geçersiz
 * bilgi") ve "y"yi sessizce atar; bu yüzden ikisi ancak sürüm 2 ile yazılır. Kodlayıcı v2'yi YALNIZ bu bilgilerden biri
 * bağlantıya girecekse yazar; değilse bağlantı bayt bayt v1'dir. Gerekçe: muayenehanedeki eski klinisyen uygulamaları
 * bilinmeyen sürümü reddeder; raporların çoğunda (yüzüstünden gelme ve testte durdurma olmayan) eski sürüm de raporu
 * okumaya devam eder. v2'ye özgü bilgi varsa eski sürüm "uygulamayı güncelleyin" der; bu, bilginin sessizce kaybolmasından
 * iyidir (k09 #4).
 *
 * v3 (yeni kullanıcı turu 1; y04 #1–#7, y05 #7): araştırma kaydı klinisyene ulaşır. Ataklara aşma/karar/bilgi kayıtları
 * (`o`), güvenlik sorularının işaretlenen yanıtları ve devam edilip edilmediği (`f`), demo modu (`S`), taraf testinin türü
 * (`t` kaydının 5. öğesi 'H' = sırtüstü baş çevirme testi); rapora kurulumda işaretlenen kontrendikasyonlar (`k`) ve çalışma
 * katılımcı no (`i`) eklendi; reçete manevrasında 'b' (BBQ roll, yatay kanal reçetesi) yalnız v3'te geçerlidir (eski
 * çözücü bilinmeyen harfi Semont sayardı). v1/v2 çözücü 5 öğeli test kaydını geçersiz sayar, öbürlerini sessizce atar: bu yüzden bunlar
 * ancak sürüm 3 ile yazılır ve kodlayıcı v3'ü YALNIZ bu bilgilerden biri varsa yazar (eski uygulama "güncelleyin" der).
 * Uygulama ve karar kuralı sürümü (`w`) her sürümde yazılır (eski çözücü yok sayar; yeni çözücü her sürümde okur). `w`
 * varsa rapor araştırma kaydını taşıyan bir uygulamadan gelmiştir: kayıt yoksa "aşma yok" demektir; `w` yoksa (eski
 * uygulama) araştırma kaydı bilinmiyor. Bu sürüm v1, v2 ve v3'ü okur.
 *
 * v3 eki (yeni kullanıcı turu 2; y04 #1–#4): atağa belirti şiddeti (VAS 0–10, önce/sonra; `v` anahtarı) eklendi ve araştırma
 * kaydı açıklamaları kısaltılmadan (en çok OVERRIDE_DETAIL_FULL_MAX) yazılır; bağlantı bütçeyi aşarsa önce OVERRIDE_DETAIL_MAX'a
 * kısaltılır. İkisi de sürümü değiştirmez: önceki v3 çözücü `v`yi yok sayar ve uzun açıklamayı kendi sınırında keser.
 *
 * Ek (yeni kullanıcı turu 3; y04 #1–#2): (1) olayların saniyesi (`ss` anahtarı: her olay dizisi için dakika içi saniye 0–59;
 * yalnız sıfırdan farklı saniye varsa yazılır). Böylece aynı dakikadaki olayların (test, karar, manevra, aşma) sırası
 * korunur; çalışma CSV'si saniyeli zaman ve atak içi sıra numarası yazar. (2) Manevra başına belirti şiddeti (`mv`:
 * manevralarla aynı sırada VAS 0–10 ya da null; ManeuverLog.vasAfter), yalnız v3'te. İkisi de isteğe bağlıdır ve sürümü
 * değiştirmez: önceki çözücüler tanımadıkları anahtarı yok sayar (zamanlar dakikada, VAS atak düzeyinde kalır); eski
 * bağlantılar okunmaya devam eder. Bağlantı bütçeyi aşarsa saniyeler (dakikaya yuvarlanarak) çıkarılır.
 */
import { fnv1a, PID_MAX_LEN, type Prescription, rxCode, rxIssuedAt, rxLastValidDay, rxManeuverFromWire, rxManeuverWire, rxValidUntil } from './prescription';
import { PROTOCOLS, type ProtocolId, resolveProtocol, type Side } from './protocols';
import { type StepRecord, type StopReason, vertigoSummary } from './runner';
import { APP_VERSION, DECISION_RULES_VERSION } from './version';
import { RED_FLAGS, type SideDecision, type SideTestResult } from './safety';
// Yalnız tür içe aktarımı (çalışma zamanında core → state bağımlılığı yok).
import type { AppData, Episode, EpisodeStatus, ManeuverLog, RetestLog } from '../state/types';

/** Bu uygulamanın yazabildiği en yeni sürüm (v3/v2'ye özgü bilgi yoksa daha eski sürüm yazılır: `homeReportVersion`). */
export const REPORT_SHARE_VERSION = 3;
/** Bu uygulamanın çözebildiği sürümler. */
const SUPPORTED_VERSIONS = [1, 2, 3];
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
const MAX_TEST_STOPS = 20;
const MAX_RED_FLAGS = 20;
const MAX_OVERRIDES = 40;
const MAX_CONTRA = 20;
const NOTE_MAX = 60;
/**
 * Bütçe aşılınca araştırma kaydı açıklamasının kısaltıldığı uzunluk (karakter); yine sığmazsa 40'a, sonra çıkarılır. Önceki
 * sürümlerin çözücüsü açıklamayı bu uzunlukta keser.
 */
export const OVERRIDE_DETAIL_MAX = 90;
/** Araştırma kaydı açıklamasının bağlantıdaki en uzun hâli (kısaltılmamış gerekçe; yeni kullanıcı turu 2, y04 #4). */
export const OVERRIDE_DETAIL_FULL_MAX = 300;
const VERSION_MAX = 16;
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
  | 'manual'
  /** v2: hedef açıya yüzüstünden geçilerek gelindi, kabul edilmedi. */
  | 'proneArrival';

/** Bayrakların kodlamadaki bit sırası (değiştirilmez; yeni bayrak sona eklenir). */
const FLAG_BITS: StepFlag[] = ['endedEarly', 'slowTransition', 'movedBeforeCommand', 'noSitThrough', 'wrongSide', 'borderline', 'unreachable', 'manual', 'proneArrival'];
/** v1'deki bayrak sayısı (v1 bağlantısında daha yüksek bit geçersizdir). */
const V1_FLAG_COUNT = 8;

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
  /** v3 eki: bu manevradan sonraki belirti şiddeti (VAS 0–10; ManeuverLog.vasAfter). */
  vasAfter?: number;
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
  /** v3: 'HC' sırtüstü baş çevirme testi; yoksa Dix-Hallpike (arka kanal; v1/v2 bağlantısında hep böyle). */
  canal?: 'PC' | 'HC';
}

/** v3: güvenlik sorularında işaretlenen (durdurma öneren) yanıtlar ve kullanıcının uyarıdan sonra devam edip etmediği. */
export interface HomeRedFlag {
  at: number;
  /** İşaretlenen soruların kimlikleri (core/safety RED_FLAGS). */
  ids: string[];
  continued: boolean;
}

/** v3: araştırma kaydı (Episode.overrides): aşılan uyarı, uygulamanın kararı ya da bilgi kaydı. */
export interface HomeOverride {
  at: number;
  kind: string;
  detail?: string;
}

export interface HomeRetest {
  at: number;
  kind: RetestLog['kind'];
  side: Side;
  vertigo: boolean;
  latencySec: number | null;
  durationSec: number | null;
}

/** v2: taraf testi ya da tekrar testi "Kendimi kötü hissediyorum" ile durduruldu (Episode.testStops). */
export type HomeTestStop = NonNullable<Episode['testStops']>[number];

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
  /** v2: testte durdurmalar (yalnız varsa; v1 bağlantısında yok). */
  testStops?: HomeTestStop[];
  /** v3: atak demo modunda (sanal sensör) yürütüldü. */
  simulation?: boolean;
  /** v3: güvenlik sorularında işaretlenen yanıtlar (yalnız işaretlenen kayıtlar). */
  redFlags?: HomeRedFlag[];
  /** v3: araştırma kaydı. */
  overrides?: HomeOverride[];
  /** Atağı açan uygulamanın sürümü, raporu üretenden farklıysa (`w`; her sürümde, eski çözücü yok sayar). */
  appVersion?: string;
  rulesVersion?: string;
  /** v3: manevra sonrası yeni belirtide kırmızı 112 şeridine yanıt (Episode.neuroAlertAck). */
  neuroAck?: NonNullable<Episode['neuroAlertAck']>;
  /** v3: manevralarda hızlı çift dokunuşla geri alınan baş dönmesi işaretlerinin toplamı (StepRecord.vertigoTapCancels). */
  vertigoTapCancels?: number;
  /** v3: belirti şiddeti 0–10 (Episode.vas): atak başında ve manevradan sonra; yalnız girilen değer. */
  vas?: { before?: number; after?: number };
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
  /** Raporu üreten uygulamanın sürümü ve karar kuralı sürümü. Yoksa rapor araştırma kaydı taşımayan eski bir uygulamadandır. */
  appVersion?: string;
  rulesVersion?: string;
  /** v3: çalışma katılımcı no (PatientProfile.studyId; reçetedeki hasta kodundan ayrı). */
  studyId?: string;
  /** v3: kurulumda işaretlenen kontrendikasyonlar (core/safety CONTRAINDICATIONS kimlikleri). */
  contraindications?: string[];
  /** v3: araştırma kaydı açıklamaları boyut nedeniyle çıkarıldı (kodlar kaldı). */
  overrideDetailsDropped?: boolean;
}

/**
 * Raporda araştırma kaydı bilgisi var mı: rapor araştırma kaydı taşıyan bir uygulamadan geldiyse (sürüm yazılıysa) true.
 * false ise (eski uygulama) aşma olmadığı söylenemez; klinisyen ekranı bunu yazar.
 */
export function homeReportHasResearch(r: Pick<HomeReport, 'appVersion' | 'v'>): boolean {
  return r.v >= 3 || !!r.appVersion;
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
  if (isVas(m.vasAfter)) out.vasAfter = m.vasAfter;
  return out;
}

/**
 * Güvenlik sorusu kaydından sonra kullanıcı uyarıyı aşıp devam etti mi (yeni kullanıcı turu 1, y04 #3)? Kayıttaki `stopped`
 * uygulamanın durdurma önerisidir. Ölçüt: bu kayıttan sonra (bir sonraki güvenlik sorusu kaydına kadar) RED_FLAG aşma kaydı
 * (manevra sonrası yeni belirti kaydı hariç) ya da test/manevra/tekrar testi kaydı var. Durdurma önermeyen kayıtta true.
 */
export function redFlagContinuedIn(
  e: Pick<Episode, 'redFlags' | 'overrides' | 'sideTests' | 'maneuvers' | 'retests'>,
  r: Episode['redFlags'][number]
): boolean {
  if (!r.stopped) return true;
  const next = e.redFlags.filter((x) => x.at > r.at).sort((a, b) => a.at - b.at)[0];
  const end = next?.at ?? Number.POSITIVE_INFINITY;
  if ((e.overrides ?? []).some((o) => o.kind === 'RED_FLAG' && o.at >= r.at && o.at < end && !/^Manevra sonrası/.test(o.detail ?? ''))) return true;
  return [...e.sideTests, ...e.maneuvers, ...e.retests].some((x) => x.at > r.at && x.at < end);
}

/** Güvenlik sorusu kaydında işaretlenen (durdurma öneren) soruların kimlikleri. */
export function triggeredRedFlagIds(r: Episode['redFlags'][number]): string[] {
  return RED_FLAGS.filter((q) => r.answers[q.id] === q.stopsOn).map((q) => q.id);
}

/**
 * Araştırma kaydı açıklamasının bağlantıdaki kısa hâli: kodla aynı anlamdaki sabit açıklamalar yazılmaz, uygulamanın kararında
 * "Uygulamanın kararı:" öneki atılır; uzun açıklama cümle (yoksa sözcük) sınırında `max` karaktere kısaltılır.
 */
export function compactOverrideDetail(kind: string, detail: string | undefined, max: number = OVERRIDE_DETAIL_MAX): string | undefined {
  let d = (detail ?? '').replace(/[\u0000-\u001f]/g, ' ').trim();
  if (kind === 'NO_DIAGNOSIS' || kind === 'GATE_HORIZONTAL_CANAL') return undefined;
  if (kind === 'APP_DECISION') d = d.replace(/^Uygulamanın kararı:\s*/, '');
  if (!d) return undefined;
  if (d.length <= max) return d;
  const cut = d.slice(0, max);
  const sentence = cut.lastIndexOf('. ');
  if (sentence >= max / 3) return cut.slice(0, sentence + 1);
  const word = cut.lastIndexOf(' ');
  return `${(word > max / 3 ? cut.slice(0, word) : cut.slice(0, max - 1)).replace(/[,;:\s]+$/, '')}…`;
}

export function homeEpisodeOf(e: Episode, reportVersion: { app?: string; rules?: string } = {}): HomeEpisode {
  const cell = (t: Episode['sideTests'][number], s: Side): SideCell | null => {
    const r = t.results.find((x) => x.side === s);
    return r ? { vertigo: r.vertigo, latencySec: r.latencySec, durationSec: r.durationSec, safetyStopped: r.safetyStopped } : null;
  };
  const out: HomeEpisode = {
    startedAt: e.startedAt,
    status: e.status,
    side: e.side,
    sideTests: e.sideTests.slice(-MAX_SIDE_TESTS).map((t) => ({
      at: t.at,
      R: cell(t, 'R'),
      L: cell(t, 'L'),
      decision: t.decision,
      ...(t.canal === 'HC' ? { canal: 'HC' as const } : {})
    })),
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
  const stops = (e.testStops ?? []).slice(-MAX_TEST_STOPS).map((t) => ({ at: t.at, test: t.test, side: t.side, reason: t.reason }));
  if (stops.length) out.testStops = stops;
  if (e.simulation) out.simulation = true;
  const flags = e.redFlags
    .map((r) => ({ at: r.at, ids: triggeredRedFlagIds(r), continued: redFlagContinuedIn(e, r) }))
    .filter((r) => r.ids.length > 0)
    .slice(-MAX_RED_FLAGS);
  if (flags.length) out.redFlags = flags;
  const ov = [...(e.overrides ?? [])]
    .sort((a, b) => a.at - b.at)
    .slice(-MAX_OVERRIDES)
    .map((o): HomeOverride => {
      const detail = compactOverrideDetail(o.kind, o.detail, OVERRIDE_DETAIL_FULL_MAX);
      return detail ? { at: o.at, kind: o.kind, detail } : { at: o.at, kind: o.kind };
    });
  if (ov.length) out.overrides = ov;
  const vas = cleanVas(e.vas);
  if (vas) out.vas = vas;
  if (e.neuroAlertAck) out.neuroAck = { at: e.neuroAlertAck.at, by: e.neuroAlertAck.by };
  const taps = e.maneuvers.reduce((n, m) => n + m.records.reduce((k, r) => k + (r.vertigoTapCancels ?? 0), 0), 0);
  if (taps > 0) out.vertigoTapCancels = taps;
  if ((e.appVersion || e.rulesVersion) && (e.appVersion !== reportVersion.app || e.rulesVersion !== reportVersion.rules)) {
    if (e.appVersion) out.appVersion = e.appVersion.slice(0, VERSION_MAX);
    if (e.rulesVersion) out.rulesVersion = e.rulesVersion.slice(0, VERSION_MAX);
  }
  return out;
}

/**
 * Raporun bağlantıya yazılacağı sürüm: v3'e özgü bilgi (araştırma kaydı, işaretlenen güvenlik sorusu, demo modu, sırtüstü
 * baş çevirme testi, kontrendikasyon, katılımcı no, yatay kanal reçetesi) varsa 3; v2'ye özgü bilgi (testte durdurma ya da, adım ayrıntısı
 * bağlantıdaysa, yüzüstünden gelme bayrağı) varsa 2; yoksa 1 (eski klinisyen uygulamaları okuyabilsin; bkz. dosya başı).
 */
export function homeReportVersion(r: Pick<HomeReport, 'episodes' | 'stepsDropped' | 'studyId' | 'contraindications' | 'rx'>): number {
  const v3 =
    !!r.studyId ||
    // Yatay kanal reçetesi ('b'): eski çözücü bilinmeyen manevra harfini Semont sayardı; v3'te "güncelleyin" der.
    (!!r.rx && r.rx.maneuver !== 'epley' && r.rx.maneuver !== 'semont') ||
    (r.contraindications?.length ?? 0) > 0 ||
    r.episodes.some(
      (e) =>
        !!e.simulation ||
        !!e.neuroAck ||
        !!e.vertigoTapCancels ||
        !!e.vas ||
        e.maneuvers.some((m) => m.vasAfter !== undefined) ||
        (e.redFlags?.length ?? 0) > 0 ||
        (e.overrides?.length ?? 0) > 0 ||
        e.sideTests.some((t) => t.canal === 'HC')
    );
  if (v3) return 3;
  const v2 = r.episodes.some(
    (e) => (e.testStops?.length ?? 0) > 0 || (!r.stepsDropped && e.maneuvers.some((m) => m.steps?.some((st) => st.flags.includes('proneArrival'))))
  );
  return v2 ? 2 : 1;
}

const DAY = 24 * 60 * 60 * 1000;

const isVas = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 10;
/** Geçerli (0–10 tam sayı) VAS değerleri; hiçbiri yoksa undefined. */
function cleanVas(v: Episode['vas']): HomeEpisode['vas'] {
  if (!v) return undefined;
  const out: NonNullable<HomeEpisode['vas']> = {};
  if (isVas(v.before)) out.before = v.before;
  if (isVas(v.after)) out.after = v.after;
  return out.before !== undefined || out.after !== undefined ? out : undefined;
}

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
  const ver = { app: APP_VERSION, rules: DECISION_RULES_VERSION };
  const out: HomeReport = {
    v: 1,
    // Dakikaya yuvarlanır (bağlantıdaki duyarlık): ekranda gösterilen rapor çözülenle aynı olsun.
    generatedAt: toMin(now) * MIN,
    period: { from: toMin(sel.period.from) * MIN, to: toMin(sel.period.to) * MIN },
    episodes: sel.episodes.slice(-MAX_EPISODES).map((e) => homeEpisodeOf(e, ver)),
    stepsDropped: false,
    episodesOmitted: Math.max(0, sel.episodes.length - MAX_EPISODES),
    maneuversOmitted: sel.episodes.slice(-MAX_EPISODES).reduce((n, e) => n + Math.max(0, e.maneuvers.length - MAX_MANEUVERS), 0),
    appVersion: ver.app.slice(0, VERSION_MAX),
    rulesVersion: ver.rules.slice(0, VERSION_MAX)
  };
  const studyId = cleanNote(p?.studyId)?.slice(0, PID_MAX_LEN);
  if (studyId) out.studyId = studyId;
  const contra = (p?.contraindications ?? []).filter((c) => CONTRA_ID.test(c)).slice(0, MAX_CONTRA);
  if (contra.length) out.contraindications = contra;
  if (rx) {
    const code = rxCode(p?.prescriptionToken ?? rx) || rxCode(rx);
    if (code) out.rxCode = code;
    if (rx.pid) out.pid = rx.pid;
    out.rx = { date: rx.date, side: rx.side, maneuver: rx.maneuver, perDay: rx.perDay, days: rx.days };
  }
  out.v = homeReportVersion(out);
  return out;
}

// ---- Tarih aralıkları (okunur) ------------------------------------------------------------------------------

/**
 * Raporun tarihleri, her biri kendi adıyla (kullanıcı turu 5, k09 #6): "reçete 16.10 (geçerlilik 29.10 dahil) · ataklar
 * 17.10–25.10 · rapor 31.10". Aynı dönemin farklı aralıklarla ama hep "Reçete dönemi"/"Ev dönemi" diye etiketlenmesi hekimi
 * düşündürüyordu; artık reçete tarihi + son geçerli gün, atakların başlangıç tarihleri ve raporun oluşturulduğu gün ayrı
 * yazılır. Hasta tarafındaki QR kartı, klinisyenin içe aktarma ekranı ve HBYS satırı bu tek metni kullanır.
 *
 * Gün.ay yazılır; tarihlerden biri rapor yılından farklı yıldaysa hepsi gün.ay.yıl. Reçetesiz raporda reçete parçası yoktur.
 * Küçük harfle başlar (satır içinde kullanılır); satır başında büyütülür.
 */
export function homeReportDatesText(r: Pick<HomeReport, 'generatedAt' | 'rx' | 'episodes'>): string {
  const issued = r.rx ? rxIssuedAt(r.rx.date) : null;
  const last = r.rx ? (rxLastValidDay(r.rx.date)?.getTime() ?? null) : null;
  const starts = r.episodes.map((e) => e.startedAt).sort((a, b) => a - b);
  const year = new Date(r.generatedAt).getFullYear();
  const all = [r.generatedAt, ...starts, ...(issued !== null ? [issued] : []), ...(last !== null ? [last] : [])];
  const withYear = all.some((t) => new Date(t).getFullYear() !== year);
  const f = (t: number) => {
    const d = new Date(t);
    const dm = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    return withYear ? `${dm}.${d.getFullYear()}` : dm;
  };
  const parts: string[] = [];
  if (issued !== null) parts.push(`reçete ${f(issued)}${last !== null ? ` (geçerlilik ${f(last)} dahil)` : ''}`);
  const first = starts[0];
  const lastStart = starts[starts.length - 1];
  if (first === undefined || lastStart === undefined) parts.push('atak yok');
  else if (starts.length === 1) parts.push(`atak ${f(first)}`);
  else parts.push(f(first) === f(lastStart) ? `ataklar ${f(first)}` : `ataklar ${f(first)}–${f(lastStart)}`);
  parts.push(`rapor ${f(r.generatedAt)}`);
  return parts.join(' · ');
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
const TEST_CODE: Record<HomeTestStop['test'], string> = { side: 's', retest: 'r' };
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
const TEST_OF = invert(TEST_CODE);
const TEST_STOP_OF: Record<string, HomeTestStop['reason']> = { U: 'USER_FEELS_UNWELL' };
const REFER_OF = invert(REFER_CODE);

const toMin = (t: number) => Math.floor(t / MIN);
/** Güvenlik sorusu ve kontrendikasyon kimliği biçimi. */
const CONTRA_ID = /^[a-z][a-zA-Z0-9_]{0,23}$/;
const FLAG_ID = CONTRA_ID;
/** Araştırma kaydı kodlarının kısa karşılıkları (bağlantı küçük kalsın); listede olmayan kod tam yazılır (≥3 karakter). */
const OVERRIDE_CODE: Record<string, string> = {
  NO_DIAGNOSIS: 'N',
  APP_DECISION: 'D',
  USER_CHOICE: 'U',
  CONTRAINDICATION: 'C',
  RED_FLAG: 'R',
  REFERRAL: 'F',
  DOSE: 'Q',
  SIDE_CONFLICT: 'S',
  SUBTYPE: 'T',
  VERTIGO_TOO_LONG: 'V',
  POSITION_UNREACHABLE: 'P',
  EARLY_REPEAT: 'E',
  GATE_HORIZONTAL_CANAL: 'G',
  REFER_ATYPICAL_LONG: 'RL',
  REFER_BOTH_SIDES: 'RB',
  REFER_NOT_TRIGGERED: 'RN',
  REFER_SIDE_CONFLICT: 'RC',
  VOMITING: 'K'
};
const OVERRIDE_OF = invert(OVERRIDE_CODE);
const OVERRIDE_KIND = /^[A-Z][A-Z0-9_]{2,40}$/;
const off = (t: number, base: number) => Math.max(0, toMin(t) - toMin(base));
/** Dakika içi saniye (0–59). */
const secOf = (t: number) => Math.floor((((t % MIN) + MIN) % MIN) / 1000);
/** Olay saniyeleri; hepsi sıfırsa yazılmaz. */
function wireSeconds(e: HomeEpisode): WireSeconds | undefined {
  const w: WireSeconds = {};
  let any = false;
  const one = (k: 's' | 'z' | 'a', t: number | undefined) => {
    if (t === undefined) return;
    const x = secOf(t);
    if (x) {
      w[k] = x;
      any = true;
    }
  };
  const list = (k: 't' | 'm' | 'q' | 'y' | 'f' | 'o', xs: { at: number }[] | undefined) => {
    if (!xs?.length) return;
    const v = xs.map((x) => secOf(x.at));
    if (v.some((x) => x)) {
      w[k] = v;
      any = true;
    }
  };
  one('s', e.startedAt);
  one('z', e.endedAt);
  one('a', e.neuroAck?.at);
  list('t', e.sideTests);
  list('m', e.maneuvers);
  list('q', e.retests);
  list('y', e.testStops);
  list('f', e.redFlags);
  list('o', e.overrides);
  return any ? w : undefined;
}

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
  /** Taraf testi [başa göre dakika, sağ, sol, karar] (+ v3: 'H' sırtüstü baş çevirme testi). */
  t?: ([number, WireCell, WireCell, string] | [number, WireCell, WireCell, string, 'H'])[];
  m?: WireManeuver[];
  q?: [number, string, Side, 0 | 1, number | null, number | null][];
  /** v2: testte durdurma [başa göre dakika, 's' taraf testi / 'r' tekrar testi, taraf, neden kodu ('U')]. */
  y?: [number, string, Side, string][];
  /** v3: demo modu. */
  S?: 1;
  /** v3: işaretlenen güvenlik soruları [başa göre dakika, "id,id", 1 devam edildi / 0 durdu]. */
  f?: [number, string, 0 | 1][];
  /** v3: araştırma kaydı [başa göre dakika, kod (OVERRIDE_CODE ya da tam kod), açıklama?]. */
  o?: ([number, string] | [number, string, string])[];
  /** Atağı açan uygulamanın sürümü [uygulama, kural] (raporu üretenden farklıysa; her sürümde). */
  w?: [string, string];
  /** v3: 112 şeridine yanıt [başa göre dakika, 'o' iyiyim / 'c' 112'yi aradım]. */
  a?: [number, 'o' | 'c'];
  /** v3: çift dokunuşla geri alınan baş dönmesi işareti sayısı. */
  c?: number;
  /** v3: belirti şiddeti [önce | null, sonra | null] (0–10). */
  v?: [number | null, number | null];
  /** v3 eki: manevra başına belirti şiddeti (m ile aynı sırada; 0–10 ya da null). */
  mv?: (number | null)[];
  /** Ek: olayların dakika içi saniyesi (0–59); her dizi ilgili olay dizisiyle aynı uzunlukta. */
  ss?: WireSeconds;
}
/** Olay saniyeleri: s başlangıç, z bitiş, a 112 yanıtı; diziler t/m/q/y/f/o ile aynı sırada. */
interface WireSeconds {
  s?: number;
  z?: number;
  a?: number;
  t?: number[];
  m?: number[];
  q?: number[];
  y?: number[];
  f?: number[];
  o?: number[];
}
interface Wire {
  v: number;
  g: number;
  p?: string;
  c?: string;
  r?: [string, Side, 'e' | 's' | 'b', number, number];
  a: number;
  b: number;
  e: WireEpisode[];
  x?: 1;
  o?: number;
  q?: number;
  /** Uygulama ve karar kuralı sürümü [uygulama, kural] (her sürümde; eski çözücü yok sayar). */
  w?: [string, string];
  /** v3: çalışma katılımcı no. */
  i?: string;
  /** v3: kontrendikasyon kimlikleri ("neck,spine"). */
  k?: string;
  /** v3: araştırma kaydı açıklamaları boyut nedeniyle çıkarıldı. */
  xo?: 1;
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

function wireEpisode(e: HomeEpisode, withSteps: boolean, v3: boolean): WireEpisode {
  const b = e.startedAt;
  const w: WireEpisode = { s: toMin(b), u: STATUS_CODE[e.status] };
  if (e.endedAt !== undefined) w.z = off(e.endedAt, b);
  if (e.endNote) w.n = e.endNote;
  if (e.side) w.d = e.side;
  if (e.rxShortcut) w.k = 1;
  if (e.sideTests.length) {
    w.t = e.sideTests.map((t) =>
      v3 && t.canal === 'HC'
        ? [off(t.at, b), wireCell(t.R), wireCell(t.L), wireDecision(t.decision), 'H']
        : [off(t.at, b), wireCell(t.R), wireCell(t.L), wireDecision(t.decision)]
    );
  }
  if (e.maneuvers.length) w.m = e.maneuvers.map((m) => wireManeuver(m, b, withSteps));
  if (e.retests.length) w.q = e.retests.map((r) => [off(r.at, b), KIND_CODE[r.kind], r.side, r.vertigo ? 1 : 0, r.latencySec, r.durationSec]);
  if (e.testStops?.length) w.y = e.testStops.map((t) => [off(t.at, b), TEST_CODE[t.test], t.side, STOP_CODE[t.reason]]);
  if (v3) {
    if (e.simulation) w.S = 1;
    if (e.neuroAck) w.a = [off(e.neuroAck.at, b), e.neuroAck.by === 'called112' ? 'c' : 'o'];
    if (e.vertigoTapCancels) w.c = e.vertigoTapCancels;
    if (e.vas) w.v = [e.vas.before ?? null, e.vas.after ?? null];
    if (e.redFlags?.length) w.f = e.redFlags.map((r) => [off(r.at, b), r.ids.join(','), r.continued ? 1 : 0]);
    if (e.overrides?.length) {
      w.o = e.overrides.map((o) => {
        const k = OVERRIDE_CODE[o.kind] ?? o.kind;
        return o.detail ? [off(o.at, b), k, o.detail] : [off(o.at, b), k];
      });
    }
  }
  if (v3 && e.maneuvers.some((m) => m.vasAfter !== undefined)) w.mv = e.maneuvers.map((m) => m.vasAfter ?? null);
  if (e.appVersion || e.rulesVersion) w.w = [e.appVersion ?? '', e.rulesVersion ?? ''];
  const ss = wireSeconds(e);
  if (ss) w.ss = ss;
  return w;
}

function toWire(r: HomeReport): Wire {
  const v = homeReportVersion(r);
  const v3 = v >= 3;
  const w: Wire = { v, g: toMin(r.generatedAt), a: toMin(r.period.from), b: toMin(r.period.to), e: [] };
  if (r.pid) w.p = r.pid.slice(0, PID_MAX_LEN);
  if (r.rxCode) w.c = r.rxCode;
  if (r.rx) w.r = [r.rx.date, r.rx.side, rxManeuverWire(r.rx.maneuver), r.rx.perDay, r.rx.days];
  w.e = r.episodes.map((e) => wireEpisode(e, !r.stepsDropped, v3));
  if (r.stepsDropped) w.x = 1;
  if (r.episodesOmitted > 0) w.o = r.episodesOmitted;
  if (r.maneuversOmitted > 0) w.q = r.maneuversOmitted;
  if (r.appVersion || r.rulesVersion) w.w = [r.appVersion ?? '', r.rulesVersion ?? ''];
  if (v3) {
    if (r.studyId) w.i = r.studyId.slice(0, PID_MAX_LEN);
    if (r.contraindications?.length) w.k = r.contraindications.join(',');
    if (r.overrideDetailsDropped) w.xo = 1;
  }
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

/** Araştırma kaydı açıklamaları `max` karaktere kısaltılmış (0: çıkarılmış) rapor. */
function withOverrideDetails(r: HomeReport, max: number): HomeReport {
  return {
    ...r,
    ...(max === 0 ? { overrideDetailsDropped: true } : {}),
    episodes: r.episodes.map((e) =>
      e.overrides
        ? {
            ...e,
            overrides: e.overrides.map((o) => {
              const detail = max === 0 ? undefined : compactOverrideDetail(o.kind, o.detail, max);
              return detail ? { at: o.at, kind: o.kind, detail } : { at: o.at, kind: o.kind };
            })
          }
        : e
    )
  };
}

/** Bütün olay zamanları dakikaya yuvarlanmış rapor (bütçe aşılınca saniyeler çıkarılır). */
function withoutSeconds(r: HomeReport): HomeReport {
  const f = (t: number) => toMin(t) * MIN;
  const at = <T extends { at: number }>(x: T): T => ({ ...x, at: f(x.at) });
  return {
    ...r,
    episodes: r.episodes.map((e) => {
      const out: HomeEpisode = {
        ...e,
        startedAt: f(e.startedAt),
        sideTests: e.sideTests.map(at),
        maneuvers: e.maneuvers.map(at),
        retests: e.retests.map(at)
      };
      if (e.endedAt !== undefined) out.endedAt = f(e.endedAt);
      if (e.testStops) out.testStops = e.testStops.map(at);
      if (e.redFlags) out.redFlags = e.redFlags.map(at);
      if (e.overrides) out.overrides = e.overrides.map(at);
      if (e.neuroAck) out.neuroAck = at(e.neuroAck);
      return out;
    })
  };
}
const hasSeconds = (r: HomeReport) => r.episodes.some((e) => wireSeconds(e) !== undefined);

/**
 * Raporu bütçeye sığdırarak kodlar. Sıra: (1) adım ayrıntısı çıkarılır, (2) araştırma kaydı açıklamaları 90 karaktere kısaltılır,
 * olay saniyeleri çıkarılır (zamanlar dakikaya yuvarlanır), açıklamalar 40 karaktere kısaltılır, sonra
 * çıkarılır (kodlar, yani hangi uyarının aşıldığı, kalır), (3) en eski ataklar çıkarılır (en az biri kalır), (4) kalan
 * ataklarda en eski manevralar çıkarılır, (5) en eski taraf/tekrar testleri çıkarılır. Dönen `report` gerçekte kodlanan
 * (kısaltılmış) rapordur; ekranda ne gönderildiği ondan gösterilir.
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
  const hasDetails = () => cur.episodes.some((e) => e.overrides?.some((o) => o.detail));
  const longDetails = () => cur.episodes.some((e) => e.overrides?.some((o) => (o.detail?.length ?? 0) > OVERRIDE_DETAIL_MAX));
  if (!fits() && longDetails()) retry(withOverrideDetails(cur, OVERRIDE_DETAIL_MAX));
  if (!fits() && hasSeconds(cur)) retry(withoutSeconds(cur));
  if (!fits() && hasDetails()) retry(withOverrideDetails(cur, 40));
  if (!fits() && hasDetails()) retry(withOverrideDetails(cur, 0));
  while (!fits() && cur.episodes.length > 1) {
    retry({ ...cur, episodes: cur.episodes.slice(1), episodesOmitted: cur.episodesOmitted + 1 });
  }
  // Kalan ataklarda (en eskiden başlayarak) en eski manevra çıkarılır.
  while (!fits() && cur.episodes.some((e) => e.maneuvers.length > 0)) {
    const i = cur.episodes.findIndex((e) => e.maneuvers.length > 0);
    const eps = cur.episodes.map((e, j) => (j === i ? { ...e, maneuvers: e.maneuvers.slice(1) } : e));
    retry({ ...cur, episodes: eps, maneuversOmitted: cur.maneuversOmitted + 1 });
  }
  while (!fits() && cur.episodes.some((e) => e.sideTests.length > 1 || e.retests.length > 1 || (e.testStops?.length ?? 0) > 1)) {
    const eps = cur.episodes.map((e) => {
      const next: HomeEpisode = {
        ...e,
        sideTests: e.sideTests.length > 1 ? e.sideTests.slice(1) : e.sideTests,
        retests: e.retests.length > 1 ? e.retests.slice(1) : e.retests
      };
      if (e.testStops && e.testStops.length > 1) next.testStops = e.testStops.slice(1);
      return next;
    });
    retry({ ...cur, episodes: eps });
  }
  const truncated = cur !== r;
  // Dönen rapor bağlantıdaki sürümü taşır (adım ayrıntısı çıkınca yüzüstü bayrağı da çıkar; v2 gerekmeyebilir).
  const v = homeReportVersion(cur);
  return { token, report: cur.v === v ? cur : { ...cur, v }, truncated };
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
  VERSION:
    "Bu hasta raporu DengeYol'un daha yeni bir sürümüyle oluşturulmuş; bu sürüm okuyamıyor. Uygulamayı güncelleyin: internete bağlıyken uygulamayı kapatıp yeniden açın (ya da sayfayı yenileyin), sonra QR kodu yeniden okutun.",
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

function readStep(x: unknown, protocolId: ProtocolId, index: number, side: Side | null, v: number): HomeStep {
  if (!Array.isArray(x) || x.length < 2 || x.length === 4 || x.length > 6) fail();
  const a = x as unknown[];
  const flagsN = int(a[1], 0, (1 << (v >= 2 ? FLAG_BITS.length : V1_FLAG_COUNT)) - 1);
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

function readManeuver(x: unknown, base: number, v: number): HomeManeuver {
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
    steps: a.length === 7 ? arr(a[6], MAX_STEPS).map((s, i) => readStep(s, protocolId, i, mSide, v)) : []
  };
  if (st.assisted !== undefined) out.assisted = st.assisted;
  if (st.afterSymptoms !== undefined) out.afterSymptoms = st.afterSymptoms;
  return out;
}

/** Olay saniyeleri (`ss`): bilinmeyen anahtar yok sayılır; dizi uzunluğu olay sayısıyla aynı olmalı. */
function readSeconds(x: unknown): WireSeconds {
  if (x === undefined) return {};
  if (!isObj(x)) fail();
  const o = x as Record<string, unknown>;
  const out: WireSeconds = {};
  for (const k of ['s', 'z', 'a'] as const) if (o[k] !== undefined) out[k] = int(o[k], 0, 59);
  for (const k of ['t', 'm', 'q', 'y', 'f', 'o'] as const) {
    if (o[k] !== undefined) out[k] = arr(o[k], MAX_OVERRIDES + MAX_MANEUVERS).map((n) => int(n, 0, 59));
  }
  return out;
}

/** `ss` dizisinden i. olayın saniyesi (ms); dizi yoksa 0, uzunluk tutmuyorsa geçersiz. */
function secAt(list: number[] | undefined, count: number, i: number): number {
  if (!list) return 0;
  if (list.length !== count) fail();
  return list[i]! * 1000;
}

function readEpisode(x: unknown, stepsDropped: boolean, v: number): HomeEpisode {
  if (!isObj(x)) fail();
  const o = x as Record<string, unknown>;
  const ss = readSeconds(o.ss);
  // Olay zamanları atağın başladığı dakikaya göredir; başlangıcın saniyesi ayrıca eklenir.
  const baseMin = int(o.s, MIN_LO, MIN_HI) * MIN;
  const startedAt = baseMin + (ss.s ?? 0) * 1000;
  const tList = arr(o.t, MAX_SIDE_TESTS);
  const mList = arr(o.m, MAX_MANEUVERS);
  const qList = arr(o.q, MAX_RETESTS);
  const out: HomeEpisode = {
    startedAt,
    status: code(STATUS_OF, o.u),
    side: o.d === undefined ? null : side(o.d),
    sideTests: tList.map((t, i) => {
      // v3: 5. öğe 'H' (sırtüstü baş çevirme testi); v1/v2'de yalnız 4 öğe.
      if (!Array.isArray(t) || !(t.length === 4 || (v >= 3 && t.length === 5 && t[4] === 'H'))) fail();
      const a = t as unknown[];
      const st: HomeSideTest = {
        at: baseMin + int(a[0], 0, OFF_MAX) * MIN + secAt(ss.t, tList.length, i),
        R: readCell(a[1]),
        L: readCell(a[2]),
        decision: readDecision(a[3])
      };
      if (a.length === 5) st.canal = 'HC';
      return st;
    }),
    maneuvers: mList.map((m, i) => {
      const hm = readManeuver(m, baseMin, v);
      hm.at += secAt(ss.m, mList.length, i);
      return stepsDropped ? { ...hm, steps: null } : hm;
    }),
    retests: qList.map((r, i) => {
      if (!Array.isArray(r) || r.length !== 6) fail();
      const a = r as unknown[];
      return {
        at: baseMin + int(a[0], 0, OFF_MAX) * MIN + secAt(ss.q, qList.length, i),
        kind: code(KIND_OF, a[1]),
        side: side(a[2]),
        vertigo: int(a[3], 0, 1) === 1,
        latencySec: optInt(a[4], 0, SEC_MAX),
        durationSec: optInt(a[5], 0, SEC_MAX)
      };
    })
  };
  if (o.z !== undefined) out.endedAt = baseMin + int(o.z, 0, OFF_MAX) * MIN + (ss.z ?? 0) * 1000;
  if (o.n !== undefined) {
    const n = cleanNote(o.n);
    if (n) out.endNote = n;
  }
  if (o.k !== undefined) {
    if (o.k !== 1) fail();
    out.rxShortcut = true;
  }
  // v1 çözücü "y"yi tanımaz ve yok sayar; burada da yalnız v2'de okunur.
  if (v >= 2 && o.y !== undefined) {
    const yList = arr(o.y, MAX_TEST_STOPS);
    const stops = yList.map((t, i): HomeTestStop => {
      if (!Array.isArray(t) || t.length !== 4) fail();
      const a = t as unknown[];
      return { at: baseMin + int(a[0], 0, OFF_MAX) * MIN + secAt(ss.y, yList.length, i), test: code(TEST_OF, a[1]), side: side(a[2]), reason: code(TEST_STOP_OF, a[3]) };
    });
    if (stops.length) out.testStops = stops;
  }
  // v3: demo, işaretlenen güvenlik soruları, araştırma kaydı (v1/v2'de yok sayılır).
  if (v >= 3) {
    if (o.S !== undefined) {
      if (o.S !== 1) fail();
      out.simulation = true;
    }
    if (o.a !== undefined) {
      if (!Array.isArray(o.a) || o.a.length !== 2 || (o.a[1] !== 'o' && o.a[1] !== 'c')) fail();
      const a = o.a as unknown[];
      out.neuroAck = { at: baseMin + int(a[0], 0, OFF_MAX) * MIN + (ss.a ?? 0) * 1000, by: a[1] === 'c' ? 'called112' : 'ok' };
    }
    if (o.c !== undefined) out.vertigoTapCancels = int(o.c, 1, 999);
    if (o.v !== undefined) {
      if (!Array.isArray(o.v) || o.v.length !== 2) fail();
      const a = o.v as unknown[];
      const before = optInt(a[0], 0, 10);
      const after = optInt(a[1], 0, 10);
      if (before === null && after === null) fail();
      out.vas = { ...(before !== null ? { before } : {}), ...(after !== null ? { after } : {}) };
    }
    if (o.mv !== undefined) {
      const mv = arr(o.mv, MAX_MANEUVERS);
      if (mv.length !== out.maneuvers.length) fail();
      mv.forEach((x, i) => {
        const n = optInt(x, 0, 10);
        if (n !== null) out.maneuvers[i]!.vasAfter = n;
      });
    }
    const fList = arr(o.f, MAX_RED_FLAGS);
    const flags = fList.map((f, i): HomeRedFlag => {
      if (!Array.isArray(f) || f.length !== 3 || typeof f[1] !== 'string') fail();
      const a = f as unknown[];
      const ids = (a[1] as string).split(',');
      if (!ids.length || ids.length > RED_FLAGS.length + 4 || !ids.every((x) => FLAG_ID.test(x))) fail();
      return { at: baseMin + int(a[0], 0, OFF_MAX) * MIN + secAt(ss.f, fList.length, i), ids, continued: int(a[2], 0, 1) === 1 };
    });
    if (flags.length) out.redFlags = flags;
    const oList = arr(o.o, MAX_OVERRIDES);
    const ov = oList.map((x, i): HomeOverride => {
      if (!Array.isArray(x) || x.length < 2 || x.length > 3 || typeof x[1] !== 'string') fail();
      const a = x as unknown[];
      const k = a[1] as string;
      const kind = own(OVERRIDE_OF, k) ? OVERRIDE_OF[k]! : OVERRIDE_KIND.test(k) && !own(OVERRIDE_CODE, k) ? k : fail();
      const at = baseMin + int(a[0], 0, OFF_MAX) * MIN + secAt(ss.o, oList.length, i);
      if (a.length === 3) {
        if (typeof a[2] !== 'string') fail();
        const detail = cleanText(a[2] as string, OVERRIDE_DETAIL_FULL_MAX);
        if (detail) return { at, kind, detail };
      }
      return { at, kind };
    });
    if (ov.length) out.overrides = ov;
  }
  if (o.w !== undefined) {
    const ver = readVersion(o.w);
    if (ver.app) out.appVersion = ver.app;
    if (ver.rules) out.rulesVersion = ver.rules;
  }
  return out;
}

/** Sürüm alanı [uygulama, kural]: kısa, yazdırılabilir metinler. */
function readVersion(x: unknown): { app?: string; rules?: string } {
  if (!Array.isArray(x) || x.length !== 2 || typeof x[0] !== 'string' || typeof x[1] !== 'string') fail();
  const a = x as string[];
  if (!a.every((t) => t.length <= VERSION_MAX && /^[0-9A-Za-z.+_-]*$/.test(t))) fail();
  const out: { app?: string; rules?: string } = {};
  if (a[0]) out.app = a[0];
  if (a[1]) out.rules = a[1];
  return out;
}

/** Denetim karakteri temizlenmiş, `max` karaktere kesilmiş metin; boşsa undefined. */
function cleanText(s: string, max: number): string | undefined {
  const t = s.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max).trim();
  return t.length ? t : undefined;
}

function readWire(o: Record<string, unknown>): HomeReport {
  if (!Array.isArray(o.e)) fail();
  const stepsDropped = o.x === undefined ? false : o.x === 1 ? true : fail();
  const v = o.v as number;
  const out: HomeReport = {
    v,
    generatedAt: int(o.g, MIN_LO, MIN_HI) * MIN,
    period: { from: int(o.a, MIN_LO, MIN_HI) * MIN, to: int(o.b, MIN_LO, MIN_HI) * MIN },
    episodes: arr(o.e, MAX_EPISODES).map((e) => readEpisode(e, stepsDropped, v)),
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
  if (o.w !== undefined) {
    const ver = readVersion(o.w);
    if (ver.app) out.appVersion = ver.app;
    if (ver.rules) out.rulesVersion = ver.rules;
  }
  if (v >= 3) {
    if (o.i !== undefined) {
      if (typeof o.i !== 'string') fail();
      const sid = cleanText(o.i as string, PID_MAX_LEN);
      if (sid) out.studyId = sid;
    }
    if (o.k !== undefined) {
      if (typeof o.k !== 'string') fail();
      const ids = (o.k as string).split(',');
      if (ids.length > MAX_CONTRA || !ids.every((x) => CONTRA_ID.test(x))) fail();
      out.contraindications = ids;
    }
    if (o.xo !== undefined) {
      if (o.xo !== 1) fail();
      out.overrideDetailsDropped = true;
    }
  }
  if (o.r !== undefined) {
    if (!Array.isArray(o.r) || o.r.length !== 5) fail();
    const a = o.r as unknown[];
    if (typeof a[0] !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(a[0])) fail();
    // 'b' (BBQ roll, yatay kanal reçetesi) yalnız v3'te: eski çözücü bilinmeyen harfi Semont sanmasın diye v3 ile yazılır.
    if (a[2] !== 'e' && a[2] !== 's' && !(v >= 3 && a[2] === 'b')) fail();
    out.rx = { date: a[0] as string, side: side(a[1]), maneuver: rxManeuverFromWire(a[2]), perDay: int(a[3], 1, 9), days: int(a[4], 1, 99) };
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
