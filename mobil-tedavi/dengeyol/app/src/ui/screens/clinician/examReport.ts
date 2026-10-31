/**
 * Klinik muayene raporu ve HBYS notu için saf yardımcılar (arayüzden bağımsız; birim testli).
 */
import {
  type Finding,
  type Findings,
  keyLabel,
  MECHANISM_LABEL,
  NYSTAGMUS_LABEL,
  type ObservationMethod,
  OBSERVATION_METHODS,
  rxFindingLock
} from '../../../core/diagnosis';
import { decodePrescription, rxValidUntil as rxValidUntilMs } from '../../../core/prescription';
import { type Canal, type FindingKey, PROTOCOLS, type ProtocolId, type Side, sideName } from '../../../core/protocols';
import { recordStats, STOP_REASON_TEXT, vertigoSummary } from '../../../core/runner';
import { RX_VALID_DAYS } from '../../../state/episodes';
import type { ClinicExam, ConfirmedDiagnosis, ManeuverLog } from '../../../state/types';

// ---- Tanı geçerliliği ------------------------------------------------------------------------------

/**
 * Bulguların sıralı imzası: onaylı tanının hangi bulgulara dayandığını izlemek için. Serbest not ve gözlem yöntemi
 * tanıyı etkilemez, imzaya girmez (not düzeltmek tanıyı geçersiz kılmasın). Diğer alanlar kayıttaki sırasıyla kalır:
 * eski kayıtların imzası değişmez.
 */
export function findingsKeyOf(f: Findings): string {
  return JSON.stringify(
    Object.keys(f)
      .sort()
      .map((k) => {
        const v = f[k as FindingKey];
        if (!v) return [k, v];
        const { note, method, ...rest } = v;
        return [k, rest];
      })
  );
}

/** Onaylı tanı hâlâ geçerli mi (onaydan sonra bulgu değiştiyse hayır). */
export function dxValid(exam: ClinicExam): boolean {
  const dx = exam.diagnosis;
  if (!dx) return false;
  // Eski sürümde onaylanmış (imzasız) tanı: hangi bulgulara dayandığı bilinmez → yeniden onay istenir.
  return dx.findingsKey !== undefined && dx.findingsKey === findingsKeyOf(exam.findings);
}

/**
 * Verilmiş reçete hâlâ geçerli tanıya mı dayanıyor ve şu an kilit yok mu? Reçeteden sonra eklenen bir bulgu (ör. tekrar
 * testte ≥1 dk yanıt) kilit doğurursa eski QR rapora/nota yazılmaz.
 */
export function rxCurrent(exam: ClinicExam): boolean {
  return (
    !!exam.prescriptionToken &&
    dxValid(exam) &&
    exam.prescriptionFindingsKey === exam.diagnosis?.findingsKey &&
    rxBlockReason(exam) === null
  );
}

// ---- Ev reçetesi kilidi --------------------------------------------------------------------------------

/**
 * Ev reçetesini engelleyen durum (null → verilebilir). Onaylı tanıya EK OLARAK bulgulara da bakar: elle girilen tanı
 * (ör. "kanalolitiazis") bulguda ≥1 dk yanıt ya da çok kanallı tutulum varken kilidi açmaz.
 */
export function rxBlockReason(exam: ClinicExam): string | null {
  const dx = exam.diagnosis;
  if (!dx) return 'Ev reçetesi için önce Tanı sekmesinde arka kanal tanısını onaylayın.';
  if (!dxValid(exam)) return 'Bulgular tanı onaylandıktan sonra değişti. Tanıyı yeniden onaylayın.';
  if (dx.canal !== 'PC') return 'Ev reçetesi yalnızca arka kanal BPPV için verilebilir. Yatay ve ön kanal manevraları klinikte yapılmalıdır.';
  if (!dx.side) return 'Onaylı tanıda taraf yok. Ev reçetesi için tarafı belli bir arka kanal tanısı onaylayın.';
  const lock = rxFindingLock(exam.findings, exam.retestFindings);
  if (lock) return lock.message;
  if (dx.mechanism === 'cupulolithiasis') {
    return 'Kupulolitiazis şüphesinde baş dönmesi 1 dakikadan uzun sürer; evde güvenlik kuralı her manevrada hastayı hekime yönlendirir. Ev reçetesi verilmez, tedaviyi klinikte yapın.';
  }
  return null;
}

// ---- Bulgu ve tanı metinleri ---------------------------------------------------------------------------

const cap = (s: string) => s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);

export function torsionText(s: Side): string {
  return `torsiyon ${sideName(s)} kulağa`;
}

/**
 * Bulgu özeti. `full`: rapor/HBYS için ek alanlar (torsiyon, yorulma, oturunca ters nistagmus, yöntem, not) da yazılır.
 * `baseMethod`: başlıkta bir kez yazılan muayene yöntemi; satırda yalnız bundan farklı yöntem yazılır (tekrar etmesin).
 */
export function findingSummary(f: Finding | undefined, full = false, baseMethod?: string | null): string {
  if (!f) return '—';
  const parts: string[] = [];
  if (f.nystagmus === 'none') parts.push(f.vertigo ? 'Nistagmus yok, baş dönmesi var' : 'Negatif');
  else {
    parts.push(NYSTAGMUS_LABEL[f.nystagmus]);
    if (f.latencySec !== null) parts.push(`gecikme ${f.latencySec} s`);
    if (f.durationSec !== null) parts.push(`süre ${f.durationSec} s`);
    if (f.intensity) parts.push(`şiddet ${f.intensity}/3`);
    if (f.torsionToward) parts.push(torsionText(f.torsionToward));
    if (full) {
      if (f.fatigue !== undefined) parts.push(f.fatigue ? 'yorulma var' : 'yorulma yok');
      if (f.reversalOnSitting !== undefined) parts.push(f.reversalOnSitting ? 'oturunca ters nistagmus var' : 'oturunca ters nistagmus yok');
      if (f.vertigo) parts.push('baş dönmesi var');
    }
  }
  if (full && f.method && f.method !== baseMethod) parts.push(`gözlem: ${f.method}`);
  if (full && f.note) parts.push(`not: ${f.note}`);
  return parts.join(' · ');
}

export function canalText(c: Canal): string {
  return c === 'PC' ? 'arka kanal' : c === 'HC' ? 'yatay kanal' : 'ön kanal';
}

/** Elle girilen tanının etiketi: mekanizma her zaman yazılır (HBYS notunda da görünsün). */
export function manualDxLabel(canal: Canal, side: Side | null, mechanism: ConfirmedDiagnosis['mechanism']): string {
  return `${side ? cap(sideName(side)) + ' ' : ''}${canalText(canal)} BPPV — ${MECHANISM_LABEL[mechanism]} (elle)`;
}

/** Tanı metni + mekanizma (eski elle tanı etiketlerinde mekanizma yoktu). */
export function dxText(dx: ConfirmedDiagnosis): string {
  const mech = MECHANISM_LABEL[dx.mechanism];
  const hasMech = /kanalolitiazis|kupulolitiazis|mekanizma/.test(dx.label);
  return hasMech || !dx.canal ? dx.label : `${dx.label} — ${mech}`;
}

/** Tek muayenede kullanılan gözlem yöntemleri (kayıt sırasıyla, tekrarsız). */
export function methodsOf(...fs: Findings[]): string[] {
  const out: string[] = [];
  for (const f of fs) for (const v of Object.values(f)) if (v?.method && !out.includes(v.method)) out.push(v.method);
  return out;
}

/** Muayenenin ana gözlem yöntemi (en çok kullanılan; eşitlikte ilk kullanılan). Başlıkta bir kez yazılır. */
export function primaryMethod(...fs: Findings[]): string | null {
  const count = new Map<string, number>();
  for (const f of fs) for (const v of Object.values(f)) if (v?.method) count.set(v.method, (count.get(v.method) ?? 0) + 1);
  let best: string | null = null;
  for (const [m, n] of count) if (best === null || n > count.get(best)!) best = m;
  return best;
}

/** Yöntem başlık satırı ("Gözlem yöntemi: VNG."); farklı yöntem kullanılan test kendi satırında belirtilir. */
export function methodHeader(...fs: Findings[]): string | null {
  const base = primaryMethod(...fs);
  if (!base) return null;
  return `Gözlem yöntemi: ${base}${methodsOf(...fs).length > 1 ? ' (farklı yöntem kullanılan test kendi satırında belirtildi)' : ''}.`;
}

const isMethod = (m: string | undefined): m is ObservationMethod => !!m && (OBSERVATION_METHODS as string[]).includes(m);

/**
 * Bulgu formunda varsayılan gözlem yöntemi: bu muayenede en son kullanılan → klinisyen profilindeki → klinisyenin önceki
 * son muayenesindeki. Yöntem tanı imzasına girmez; yalnız dokunuş azaltır.
 */
export function defaultObservationMethod(
  exam: ClinicExam,
  profileMethod: ObservationMethod | undefined,
  allExams: readonly ClinicExam[]
): ObservationMethod | undefined {
  const own = methodsOf(exam.findings, exam.retestFindings);
  const last = own[own.length - 1];
  if (isMethod(last)) return last;
  if (profileMethod) return profileMethod;
  const prev = allExams.filter((e) => e.id !== exam.id && e.at <= exam.at).sort((a, b) => b.at - a.at);
  for (const e of prev) {
    const ms = methodsOf(e.findings, e.retestFindings);
    const m = ms[ms.length - 1];
    if (isMethod(m)) return m;
  }
  return undefined;
}

// ---- Manevra adımları ---------------------------------------------------------------------------------

/**
 * Sarkma (φ) sapması istatistikleri. Yürütücü kaydı (StepRecord) bunları henüz tutmuyor; D1 θ alanlarıyla aynı biçimde
 * eklediğinde raporda kendiliğinden görünür.
 */

export interface StepLine {
  title: string;
  holdSec: number;
  targetSec: number | null;
  inRangePct: number | null;
  manual: boolean;
  theta: { mean: number; max: number } | null;
  /** Sarkma açısı (φ): adımdaki ortalama ve en düşük değer (yürütücü kaydı). */
  phi: { mean: number; min: number } | null;
  transitionSec: number | null;
  fastTargetSec: number | null;
  /** Nistagmus/belirti işareti özeti (gecikme pozisyona girişten). */
  nystagmus: string | null;
  /** Pozisyona gelinip ~1 s içinde bitirildi. */
  early: boolean;
}

/** Erken bitirme eşiği (s): pozisyona gelindikten sonra bu kadar ya da daha az beklenip adım geçildiyse. */
export const EARLY_END_SEC = 1.5;

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function stepLines(m: ManeuverLog): StepLine[] {
  const def = PROTOCOLS[m.protocolId as ProtocolId];
  return m.records.map((r, i) => {
    const st = def?.steps.find((s) => s.id === r.stepId);
    const targetSec = st ? (st.clinicianMinHoldSec ?? st.minHoldSec) : null;
    const stats = recordStats(r);
    const phi = stats.meanPhi !== null && stats.minPhi !== null ? { mean: stats.meanPhi, min: stats.minPhi } : null;
    const v = vertigoSummary(r);
    const nystagmus = v
      ? `nistagmus gecikme ${v.latencySec} s, ${v.durationSec !== null ? `süre ${v.durationSec} s` : 'bitişi işaretlenmedi'}${r.vertigoMarks.length > 1 ? ` (${r.vertigoMarks.length} işaret)` : ''}`
      : null;
    // Yarıda kalan manevranın son (kesilen) adımı "erken bitirildi" sayılmaz: o zaten "yarıda" yazılır.
    const interrupted = !m.completed && i === m.records.length - 1;
    const early = !interrupted && (!!r.endedEarly || (r.endedAt !== null && targetSec !== null && targetSec >= 3 && r.holdSec <= EARLY_END_SEC));
    return {
      title: r.title,
      holdSec: Math.round(r.holdSec),
      targetSec,
      inRangePct: stats.inRangePct,
      manual: r.manual,
      theta: stats.meanAbsThetaErr !== null && stats.maxAbsThetaErr !== null ? { mean: stats.meanAbsThetaErr, max: stats.maxAbsThetaErr } : null,
      phi,
      transitionSec: r.transitionSec !== null ? round1(r.transitionSec) : null,
      fastTargetSec: st?.fastTransitionSec ?? null,
      nystagmus,
      early
    };
  });
}

export function maneuverStatus(m: ManeuverLog, lines: StepLine[] = stepLines(m)): string {
  const early = lines.filter((l) => l.early).length;
  if (!m.completed) return m.stopReason ? STOP_REASON_TEXT[m.stopReason] : 'yarıda kaldı';
  return early ? `kısaltılmış (${early} adım erken bitirildi)` : 'tamamlandı';
}

/**
 * Manevranın HBYS notundaki tek satırı: ad, taraf, durum, adım süreleri ve manevra sırasındaki nistagmus. Açı
 * istatistikleri (θ/φ sapması, hedefte kalma) yalnız yazdırılan raporda yer alır.
 */
export function maneuverLineText(m: ManeuverLog, lines: StepLine[] = stepLines(m)): string {
  const def = PROTOCOLS[m.protocolId as ProtocolId];
  const name = `${def?.shortName ?? m.protocolId}${m.side ? ` ${sideName(m.side)}` : ''}`;
  const total = def?.steps.length;
  const parts = [`${name}: ${maneuverStatus(m, lines)}${!m.completed && total ? ` (${lines.length}/${total} adım)` : ''}`];
  if (lines.length) parts.push(`adım süreleri ${lines.map((l) => `${l.holdSec}${l.early ? ' (erken)' : ''}`).join(', ')} s`);
  for (const l of lines) {
    if (l.transitionSec !== null && l.fastTargetSec !== null && l.transitionSec > l.fastTargetSec) {
      parts.push(`yavaş geçiş ${l.transitionSec} s (hedef <${l.fastTargetSec} s)`);
    }
  }
  // Yürütücünün adım işaretleri (Semont komuttan önce/oturuştan geçmeden, yanlış taraf, hedef sınırında tutma).
  const flags = m.records.flatMap((r, i) => [
    ...(r.movedBeforeCommand ? [`${i + 1}. adımda komuttan önce hareket`] : []),
    ...(r.noSitThrough ? [`${i + 1}. adımda oturuştan geçilmedi`] : []),
    ...(r.wrongSide ? [`${i + 1}. adımda önce yanlış taraf`] : []),
    ...(r.borderline ? [`${i + 1}. adım hedef sınırında`] : [])
  ]);
  if (flags.length) parts.push(flags.join('; '));
  if (m.manual) parts.push('elle onaylı');
  const nys = lines.flatMap((l, i) => (l.nystagmus ? [`${i + 1}. adımda ${l.nystagmus.replace(/^nistagmus /, '')}`] : []));
  parts.push(nys.length ? `nistagmus: ${nys.join('; ')}` : 'nistagmus işaretlenmedi');
  return parts.join(' · ');
}

// ---- Reçete --------------------------------------------------------------------------------------------

/**
 * Reçetenin son geçerli günü (dahil; yerel takvim). Sınır hasta tarafıyla aynı kaynaktan gelir: `core/prescription.ts`
 * `rxValidUntil` (rxActive ile aynı an). O andan hemen önceki gün yazılır; böylece aynı gün hem "… dahil" hem "süresi
 * doldu" görünmez.
 */
export function rxLastValidDay(dateKey: string): Date | null {
  const until = rxValidUntilMs({ date: dateKey }, RX_VALID_DAYS);
  if (until === null) return null;
  const d = new Date(until - 1);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function shortDate(d: Date): string {
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** "Geçerlilik: 14 gün, 12.11.2026 dahil" (HBYS notunun reçete satırı). */
export function rxValidityShort(dateKey: string): string {
  const last = rxLastValidDay(dateKey);
  return `Geçerlilik: ${RX_VALID_DAYS} gün${last ? `, ${shortDate(last)} dahil` : ''}`;
}

/** Geçerlilik cümlesi (reçete ekranı, basılı rapor). */
export function rxValidityText(dateKey: string): string {
  return `${rxValidityShort(dateKey)}. Testsiz kısa yol yalnız muayene edilen baş dönmesi sürerken; süre dolunca uygulama her atakta iki tarafı test eder.`;
}

/** Reçete kodu: bağlantıdaki sağlama toplamı (hasta raporundaki kodla karşılaştırmak için). */
export function rxCode(token: string): string {
  return token.split('.')[1] ?? '';
}

// ---- HBYS notu ------------------------------------------------------------------------------------------

const fullDate = (t: number) =>
  new Date(t).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/**
 * HBYS / e-Nabız muayene notuna yapıştırılacak kısa düz metin: başlık, her test bir satır, tanı + mekanizma + karar desteği,
 * her manevra bir satır, reçete bir satır (kod ve geçerlilik). Gözlem yöntemi bir kez yazılır; açı istatistikleri yalnız
 * yazdırılan raporda.
 */
export function examNoteText(exam: ClinicExam, code: string | undefined, clinician: { name?: string; clinic?: string }): string {
  const lines: string[] = [];
  lines.push(`Pozisyonel vertigo değerlendirmesi (DengeYol) — ${fullDate(exam.at)}${code ? ` — hasta kodu ${code}` : ''}`);
  const header = methodHeader(exam.findings, exam.retestFindings);
  const base = primaryMethod(exam.findings, exam.retestFindings);
  if (header) lines.push(header);
  const keys = Object.keys(exam.findings) as FindingKey[];
  if (keys.length) {
    lines.push('Testler:');
    for (const k of keys) lines.push(`- ${keyLabel(k)}: ${findingSummary(exam.findings[k], true, base)}`);
  }
  const dx = exam.diagnosis;
  if (dx && dxValid(exam)) {
    // ICD-10 önerisi yalnız uyarısız (santral/atipik şüphe olmayan) BPPV tanısında.
    const icd = dx.canal && !dx.warnings?.length ? ' (ICD-10 öneri: H81.1 Benign paroksismal vertigo)' : '';
    lines.push(`Tanı: ${dxText(dx)}${dx.fromSuggestion ? ' — karar desteği önerisi klinisyence onaylandı' : ' — klinisyen girişi'}${icd}.`);
    if (!dx.fromSuggestion && dx.suggestedLabels?.length) {
      lines.push(`Karar desteği önerisi: ${dx.suggestedLabels.join('; ')}. Klinisyen tanıyı elle girdi.`);
    }
    if (dx.warnings?.length) lines.push(`Uyarılar: ${dx.warnings.join(' ')}`);
  } else if (dx) {
    lines.push('Tanı: bulgular onaydan sonra değişti; tanı yeniden onaylanmadı.');
  }
  const lock = rxFindingLock(exam.findings, exam.retestFindings);
  if (lock) lines.push(`Ev reçetesi kilidi: ${lock.message}`);
  if (exam.maneuvers.length) {
    lines.push('Manevralar:');
    for (const m of exam.maneuvers) lines.push(`- ${maneuverLineText(m)}`);
  }
  const rk = Object.keys(exam.retestFindings) as FindingKey[];
  if (rk.length) {
    lines.push('Tekrar test:');
    for (const k of rk) lines.push(`- ${keyLabel(k)}: ${findingSummary(exam.retestFindings[k], true, base)}`);
  }
  if (exam.prescriptionToken && rxCurrent(exam)) {
    const r = decodePrescription(exam.prescriptionToken);
    if (r.ok) {
      lines.push(
        `Ev reçetesi: ${sideName(r.value.side)} ${r.value.maneuver === 'epley' ? 'Epley' : 'Semont'}, günde en fazla ${r.value.perDay}, ${r.value.days} gün (DengeYol, QR ile verildi; reçete kodu ${rxCode(exam.prescriptionToken)}). ${rxValidityShort(r.value.date)}; testsiz kısa yol yalnız muayene edilen baş dönmesi sürerken.`
      );
    }
  }
  if (exam.notes?.trim()) lines.push(`Not: ${exam.notes.trim()}`);
  if (clinician.name) lines.push(`${clinician.name}${clinician.clinic ? `, ${clinician.clinic}` : ''}`);
  return lines.join('\n');
}
