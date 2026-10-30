/**
 * Klinik muayene raporu ve HBYS notu için saf yardımcılar (arayüzden bağımsız; birim testli).
 */
import { type Finding, type Findings, keyLabel, MECHANISM_LABEL, NYSTAGMUS_LABEL, rxFindingLock } from '../../../core/diagnosis';
import { decodePrescription } from '../../../core/prescription';
import { type Canal, type FindingKey, PROTOCOLS, type ProtocolId, type Side, sideName } from '../../../core/protocols';
import { recordStats, type StepRecord, vertigoSummary } from '../../../core/runner';
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
 */
export function findingSummary(f: Finding | undefined, full = false): string {
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
  if (full && f.method) parts.push(`gözlem: ${f.method}`);
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

// ---- Manevra adımları ---------------------------------------------------------------------------------

/**
 * Sarkma (φ) sapması istatistikleri. Yürütücü kaydı (StepRecord) bunları henüz tutmuyor; D1 θ alanlarıyla aynı biçimde
 * eklediğinde raporda kendiliğinden görünür.
 */
type PhiFields = { sumAbsPhiErr?: number; maxAbsPhiErr?: number; phiSamples?: number };

export interface StepLine {
  title: string;
  holdSec: number;
  targetSec: number | null;
  inRangePct: number | null;
  manual: boolean;
  theta: { mean: number; max: number } | null;
  phi: { mean: number; max: number } | null;
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
    const p = r as StepRecord & PhiFields;
    const phi =
      p.phiSamples && p.phiSamples > 0 && p.sumAbsPhiErr !== undefined && p.maxAbsPhiErr !== undefined
        ? { mean: round1(p.sumAbsPhiErr / p.phiSamples), max: round1(p.maxAbsPhiErr) }
        : null;
    const v = vertigoSummary(r);
    const nystagmus = v
      ? `nistagmus gecikme ${v.latencySec} s, ${v.durationSec !== null ? `süre ${v.durationSec} s` : 'bitişi işaretlenmedi'}${r.vertigoMarks.length > 1 ? ` (${r.vertigoMarks.length} işaret)` : ''}`
      : null;
    // Yarıda kalan manevranın son (kesilen) adımı "erken bitirildi" sayılmaz: o zaten "yarıda" yazılır.
    const interrupted = !m.completed && i === m.records.length - 1;
    const early = !interrupted && r.endedAt !== null && targetSec !== null && targetSec >= 3 && r.holdSec <= EARLY_END_SEC;
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

/** Adımın tek satırlık metni (HBYS notu). */
export function stepLineText(s: StepLine, index: number): string {
  const parts = [`${index + 1}. ${s.title}: ${s.holdSec}${s.targetSec !== null ? `/${s.targetSec}` : ''} s`];
  if (s.early) parts.push('ERKEN BİTİRİLDİ');
  if (s.inRangePct !== null) parts.push(`hedefte %${s.inRangePct}`);
  else if (s.manual) parts.push('elle onay');
  if (s.theta) parts.push(`θ sapma ort. ${s.theta.mean}° / en çok ${s.theta.max}°`);
  if (s.phi) parts.push(`φ (sarkma) sapma ort. ${s.phi.mean}° / en çok ${s.phi.max}°`);
  if (s.transitionSec !== null) {
    parts.push(
      `geçiş ${s.transitionSec} s${s.fastTargetSec !== null ? (s.transitionSec > s.fastTargetSec ? ` (yavaş; hedef <${s.fastTargetSec} s)` : ` (hedef <${s.fastTargetSec} s)`) : ''}`
    );
  }
  if (s.nystagmus) parts.push(s.nystagmus);
  return parts.join(' · ');
}

export function maneuverStatus(m: ManeuverLog, lines: StepLine[] = stepLines(m)): string {
  const early = lines.filter((l) => l.early).length;
  if (!m.completed) return 'yarıda kaldı';
  return early ? `kısaltılmış (${early} adım erken bitirildi)` : 'tamamlandı';
}

// ---- Reçete --------------------------------------------------------------------------------------------

/** Reçetenin son geçerli günü (YYYY-AA-GG → yerel takvim; yaz saati kayması etkilemez). Hasta tarafı RX_VALID_DAYS kullanır. */
export function rxValidUntil(dateKey: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + RX_VALID_DAYS);
}

export function shortDate(d: Date): string {
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function rxValidityText(dateKey: string): string {
  const until = rxValidUntil(dateKey);
  return `Geçerlilik: ${RX_VALID_DAYS} gün${until ? `, ${shortDate(until)} tarihine kadar` : ''}. Testsiz kısa yol yalnız muayene edilen baş dönmesi sürerken; süre dolunca uygulama her atakta iki tarafı test eder.`;
}

/** Reçete kodu: bağlantıdaki sağlama toplamı (hasta raporundaki kodla karşılaştırmak için). */
export function rxCode(token: string): string {
  return token.split('.')[1] ?? '';
}

// ---- HBYS notu ------------------------------------------------------------------------------------------

const fullDate = (t: number) =>
  new Date(t).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** HBYS / e-Nabız muayene notuna yapıştırılacak düz metin: her test ve her adım ayrı satırda. */
export function examNoteText(exam: ClinicExam, code: string | undefined, clinician: { name?: string; clinic?: string }): string {
  const lines: string[] = [];
  lines.push(`Pozisyonel vertigo değerlendirmesi (DengeYol) — ${fullDate(exam.at)}${code ? ` — hasta kodu ${code}` : ''}`);
  const methods = methodsOf(exam.findings, exam.retestFindings);
  if (methods.length) lines.push(`Gözlem yöntemi: ${methods.join(', ')}.`);
  const keys = Object.keys(exam.findings) as FindingKey[];
  if (keys.length) {
    lines.push('Testler:');
    for (const k of keys) lines.push(`- ${keyLabel(k)}: ${findingSummary(exam.findings[k], true)}`);
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
    for (const m of exam.maneuvers) {
      const sl = stepLines(m);
      lines.push(
        `- ${PROTOCOLS[m.protocolId].shortName}${m.side ? ` ${sideName(m.side)}` : ''} — ${maneuverStatus(m, sl)}${m.manual ? ' · elle onaylı' : ''}`
      );
      sl.forEach((s, i) => lines.push(`  ${stepLineText(s, i)}`));
    }
  }
  const rk = Object.keys(exam.retestFindings) as FindingKey[];
  if (rk.length) {
    lines.push('Tekrar test:');
    for (const k of rk) lines.push(`- ${keyLabel(k)}: ${findingSummary(exam.retestFindings[k], true)}`);
  }
  if (exam.prescriptionToken && rxCurrent(exam)) {
    const r = decodePrescription(exam.prescriptionToken);
    if (r.ok) {
      lines.push(
        `Ev reçetesi: ${sideName(r.value.side)} ${r.value.maneuver === 'epley' ? 'Epley' : 'Semont'}, günde en fazla ${r.value.perDay}, ${r.value.days} gün (DengeYol uygulaması, QR ile verildi; reçete kodu ${rxCode(exam.prescriptionToken)}).`
      );
      lines.push(rxValidityText(r.value.date));
    }
  }
  if (exam.notes?.trim()) lines.push(`Not: ${exam.notes.trim()}`);
  if (clinician.name) lines.push(`${clinician.name}${clinician.clinic ? `, ${clinician.clinic}` : ''}`);
  return lines.join('\n');
}
