/**
 * Klinik muayene raporu ve HBYS notu için saf yardımcılar (arayüzden bağımsız; birim testli).
 */
import {
  centralFindings,
  type Finding,
  type Findings,
  keyLabel,
  MECHANISM_LABEL,
  NYSTAGMUS_LABEL,
  type ObservationMethod,
  OBSERVATION_METHODS,
  rxFindingWarning,
  RX_OVERRIDE_HINT,
  suggestDiagnosis
} from '../../../core/diagnosis';
import {
  decodePrescription,
  type Prescription,
  rxCanalOf,
  rxIssuedAt as rxIssuedAtMs,
  rxManeuverName,
  rxValidUntil as rxValidUntilMs
} from '../../../core/prescription';
import { type Canal, type FindingKey, PROTOCOLS, type ProtocolId, type Side, sideName } from '../../../core/protocols';
import { recordStats, type StepRecord, STOP_REASON_TEXT, vertigoSummary, stopReasonTextFor } from '../../../core/runner';
import {
  decodeHomeReport,
  type HomeEpisode,
  type HomeManeuver,
  type HomeRedFlag,
  type HomeReport,
  type HomeRetest,
  type HomeSideTest,
  type HomeStep,
  type HomeTestStop,
  homeReportDatesText,
  homeReportHasResearch,
  REPORT_DECODE_ERROR_TEXT
} from '../../../core/reportShare';
import { contraindicationsFor, RED_FLAGS } from '../../../core/safety';
import { versionText } from '../../../state/episodes';
import { extractRxToken } from '../../../platform/reminders';
import { RX_VALID_DAYS } from '../../../state/episodes';
import type { ClinicExam, ConfirmedDiagnosis, ManeuverLog } from '../../../state/types';
import {
  decisionText,
  endNoteText,
  protocolReportName,
  type ResearchEntry,
  researchEntries,
  sideCellLabel,
  sideTestName,
  STATUS_LABEL
} from '../patient/reportText';

// ---- Test sonrası bulgu formu ve muayene başı kontrol ------------------------------------------------------

/**
 * Telefonla yapılan testin adım kaydından bulgu formunun başlangıç değerleri: gecikme ve süre işaretlerden; işaret konduysa
 * "Hasta baş dönmesi bildirdi" işaretli gelir (hekim kaldırabilir; yeni kullanıcı turu 2, y08 #2). Nistagmus tipi her zaman
 * bilinçli seçilir ("Yok" önceden seçili gelmez: tek dokunuşla yanlış negatif olmasın).
 */
export function testFindingInitial(rec: StepRecord | undefined): Finding & { nystagmusUnset: true } {
  const v = rec ? vertigoSummary(rec) : null;
  return {
    nystagmus: 'none',
    latencySec: v?.latencySec ?? null,
    durationSec: v?.durationSec ?? null,
    intensity: 0,
    vertigo: v !== null,
    nystagmusUnset: true
  };
}

export type SafetyItem = 'spontaneous' | 'neuro' | 'neck';
export const SAFETY_ITEMS: SafetyItem[] = ['spontaneous', 'neuro', 'neck'];

/**
 * Teste başlamadan 3 maddelik kontrol (yeni kullanıcı turu 2, y08 #3, y05 #4): soru, kısa ad ve "var" yanıtında gösterilen
 * uyarı. Uyarıdır, testleri engellemez.
 */
export const SAFETY_CHECK: Record<SafetyItem, { q: string; name: string; warn: string; patient: string }> = {
  spontaneous: {
    q: 'Spontan nistagmus (oturur, düz bakarken)',
    name: 'spontan nistagmus',
    patient: 'spontan göz titremesi',
    warn: 'Spontan nistagmus: pozisyonel bulguyu yorumlamak güçleşir; vestibüler nörit ve santral nedenleri (HINTS) değerlendirin.'
  },
  neuro: {
    q: 'Nörolojik bulgu (çift görme, konuşma bozukluğu, güçsüzlük, ataksi)',
    name: 'nörolojik bulgu',
    patient: 'nörolojik bulgu',
    warn: 'Nörolojik bulgu: santral neden düşünün; acil nörolojik değerlendirme önerilir. Pozisyon testlerini ertelemeyi düşünün.'
  },
  neck: {
    q: 'Boyun sorunu (fıtık, travma, ileri hareket kısıtlılığı)',
    name: 'boyun sorunu',
    patient: 'boyun sorunu',
    warn: 'Boyun sorunu: Dix-Hallpike\'ta başı geriye sarkıtmayın; yan yatış testi ya da sırtüstü baş çevirme ile değiştirin.'
  }
};

/** Kontrolde "var" denen maddelerin uyarıları (yoksa boş). */
export function safetyWarnings(c: ClinicExam['safetyCheck']): string[] {
  return SAFETY_ITEMS.filter((k) => c?.[k] === true).map((k) => SAFETY_CHECK[k].warn);
}

/** Kontrolde "var" denen maddeler (sabit sırada). */
export function safetyFlagged(c: ClinicExam['safetyCheck']): SafetyItem[] {
  return SAFETY_ITEMS.filter((k) => c?.[k] === true);
}

/** "a", "a ve b", "a, b ve c". */
const andList = (xs: string[]) => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} ve ${xs[xs.length - 1]}`);

/**
 * Muayene başı kontrolde "var" yanıtı Tanı ve Tedavi sekmelerinde santral örüntüdeki gibi kırmızı satır olur (yeni kullanıcı
 * turu 3, y05 #1): "Teste başlamadan kontrolde VAR: nörolojik bulgu. Nörolojik bulgu: santral neden düşünün; …". Tanı onayında
 * uyarı olarak kaydedilir (raporda "Uyarılar:"; ICD önerisi yazılmaz). "Var" yoksa null.
 */
export function safetyRedLine(c: ClinicExam['safetyCheck']): string | null {
  const ks = safetyFlagged(c);
  if (!ks.length) return null;
  return `Teste başlamadan kontrolde VAR: ${andList(ks.map((k) => SAFETY_CHECK[k].name))}. ${ks.map((k) => SAFETY_CHECK[k].warn).join(' ')}`;
}

/**
 * Hastanın reçete kartındaki uyarı adı (Prescription.ov): "muayenede nörolojik bulgu vardı; nörolojik değerlendirme
 * önerildi". Kart "Hekim uyarıya rağmen verdi: …" diye okur. "Var" yoksa null.
 */
export function safetyPatientLabel(c: ClinicExam['safetyCheck']): string | null {
  const ks = safetyFlagged(c);
  if (!ks.length) return null;
  const neuro = ks.includes('neuro') || ks.includes('spontaneous');
  return `muayenede ${andList(ks.map((k) => SAFETY_CHECK[k].patient))} vardı${neuro ? '; nörolojik değerlendirme önerildi' : ''}`;
}

/**
 * Tanı sekmesinin uyarıları: pozisyon bulgularından (suggestDiagnosis) ve muayene başı kontrolden. Onayda tanıya yazılır;
 * reçetenin ek onay kutusu da bunlara bakar.
 */
export function dxWarningsOf(exam: Pick<ClinicExam, 'findings' | 'safetyCheck'>): string[] {
  const safety = safetyRedLine(exam.safetyCheck);
  return [...suggestDiagnosis(exam.findings).warnings, ...(safety ? [safety] : [])];
}

/**
 * Rapor ve HBYS satırı: "spontan nistagmus yok, nörolojik bulgu VAR, boyun sorunu yok"; yanıtlanmayan madde
 * "değerlendirilmedi". Kontrol hiç yapılmadıysa null.
 */
export function safetyCheckText(c: ClinicExam['safetyCheck']): string | null {
  if (!c || SAFETY_ITEMS.every((k) => c[k] === undefined)) return null;
  return SAFETY_ITEMS.map((k) => `${SAFETY_CHECK[k].name} ${c[k] === undefined ? 'değerlendirilmedi' : c[k] ? 'VAR' : 'yok'}`).join(', ');
}

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
 * Verilmiş reçete hâlâ güncel mi: dayandığı bulgu/tanı değişmedi, kesin engel yok ve şu anki uyarı (varsa) gerekçeyle
 * aşılmış. Reçeteden sonra eklenen bir bulgu (ör. tekrar testte ≥1 dk yanıt) yeni bir uyarı doğurursa eski QR rapora/nota
 * yazılmaz; klinisyen uyarıyı görüp yeniden karar verir.
 */
export function rxCurrent(exam: ClinicExam): boolean {
  if (!exam.prescriptionToken || rxBlockReason(exam) !== null) return false;
  const dx = exam.diagnosis;
  if (dx) {
    // rxBlockReason null → tanı geçerli (bulgular onaydan sonra değişmedi).
    if (exam.prescriptionFindingsKey !== dx.findingsKey) return false;
    // Tanısız yazılmış reçeteden sonra başka tarafa tanı onaylandıysa reçete o tanıya dayanmaz.
    const r = decodePrescription(exam.prescriptionToken);
    if (dx.side && (!r.ok || r.value.side !== dx.side)) return false;
    // Reçete kanalı onaylı tanının kanalıyla (arka/yatay) uyuşmalı; ön kanal/bilinmeyen tanıda kanal uyarıyla seçilir.
    const dc = rxDxCanal(dx);
    if (dc && (!r.ok || rxCanalOf(r.value) !== dc)) return false;
  } else if (exam.prescriptionFindingsKey !== findingsKeyOf(exam.findings)) return false;
  const w = rxWarning(exam);
  return !w || rxOverrideCovers(exam, w);
}

// ---- Ev reçetesi: kesin engel ve uyarı ------------------------------------------------------------------

/**
 * Onaylı tanının reçeteye taşınabilen kanalı: arka ya da yatay kanal; ön kanal ve kanalı belirsiz tanıda null (reçete
 * kanalı uyarıyla klinisyence seçilir).
 */
export function rxDxCanal(dx: ConfirmedDiagnosis | undefined): 'PC' | 'HC' | null {
  return dx?.canal === 'PC' || dx?.canal === 'HC' ? dx.canal : null;
}

/**
 * Ev reçetesini gerçekten engelleyen durum (null → form açılır). Yeniden tasarımda (kilit yok) yalnız tek bir tutarlılık
 * şartı kalır: bulgular onaydan sonra değiştiyse tanı yeniden onaylanır (Reçete sekmesinde tek dokunuş). Tanısızlık,
 * kupulolitiazis, ≥1 dk yanıt, santral örüntü, çok kanal ve ön kanal/bilinmeyen kanal uyarıdır (rxWarning). Yatay kanal
 * tanısında reçete BBQ roll taşır (kullanıcı turu yeni-1, L4-1).
 */
export function rxBlockReason(exam: ClinicExam): string | null {
  const dx = exam.diagnosis;
  if (!dx) return null;
  if (!dxValid(exam)) return 'Bulgular tanı onaylandıktan sonra değişti. Tanıyı yeniden onaylayın.';
  return null;
}

export type RxWarnCode = 'NO_DIAGNOSIS' | 'NO_SIDE' | 'CENTRAL' | 'SAFETY_CHECK' | 'LONG_RESPONSE' | 'MULTI_CANAL' | 'CUPULOLITHIASIS' | 'CANAL';

export interface RxWarning {
  code: RxWarnCode;
  /** Muayeneye yazılan aşma kaydının türü: `RX_<neden>` (BRIEF §1). */
  kind: `RX_${RxWarnCode}`;
  /** Kısa ad (HBYS satırında parantez içinde). */
  label: string;
  /** Kartın başlığı (santral örüntüde bulgunun adıyla). */
  title: string;
  message: string;
  /** Hastanın reçete kartına giden kısa ad (Prescription.ov): "Hekim uyarıya rağmen verdi: …". */
  patient: string;
}

const RX_WARN_LABEL: Record<RxWarnCode, string> = {
  NO_DIAGNOSIS: 'onaylı tanı yok',
  NO_SIDE: 'onaylı tanıda taraf yok',
  CENTRAL: 'santral örüntü',
  SAFETY_CHECK: 'muayene başı kontrolde bulgu',
  LONG_RESPONSE: '≥1 dk nistagmus',
  MULTI_CANAL: 'çok kanallı tutulum',
  CUPULOLITHIASIS: 'kupulolitiazis',
  CANAL: 'tanı arka ya da yatay kanal değil'
};

/**
 * Hastanın reçete kartına giden kısa ad (Prescription.ov): "Hekim uyarıya rağmen verdi: …" (kullanıcı turu yeni-1, L4-2).
 * Gündelik dil; tıbbi terim yalnız parantez içinde.
 */
export const RX_WARN_PATIENT_LABEL: Record<RxWarnCode, string> = {
  NO_DIAGNOSIS: 'tanı uygulamada onaylanmadan verildi',
  NO_SIDE: 'etkilenen kulak muayenede kesinleşmedi',
  CENTRAL: 'muayene bulgusu beyin kaynaklı baş dönmesini de düşündürüyor; nörolojik değerlendirme önerildi',
  SAFETY_CHECK: 'muayenede güvenlik kontrolünde bulgu vardı',
  LONG_RESPONSE: 'muayenede göz titremesi 1 dakikadan uzun sürdü',
  MULTI_CANAL: 'birden çok kanal etkilenmiş olabilir',
  CUPULOLITHIASIS: 'kristaller kanal zarına yapışmış olabilir (kupulolitiazis)',
  CANAL: 'tanı, evde yapılan manevraların kanalına tam uymuyor'
};

/** Uyarıya rağmen reçetede gerekçenin en kısa uzunluğu (karakter; tek harf gerekçe kabul edilmez). */
export const RX_REASON_MIN = 10;

/**
 * Ev reçetesi uyarısı (null → uyarısız reçete). Eskiden kilitti (yeniden tasarım, BRIEF §1 son satır): klinisyen
 * "Yine de reçete yaz" ile gerekçe yazarak reçete verebilir. Onaylı tanıya EK OLARAK bulgulara da bakar: elle girilen tanı
 * (ör. "kanalolitiazis") bulguda ≥1 dk yanıt ya da çok kanallı tutulum varken uyarıyı kaldırmaz. Santral örüntü (saf aşağı
 * vuran ya da atipik nistagmus) tanıdan da önce gelir ve bulguyu adıyla söyler (kullanıcı turu yeni-1, L4-2).
 */
export function rxWarning(exam: ClinicExam): RxWarning | null {
  const w = (code: RxWarnCode, message: string, title = 'Ev reçetesi önerilmiyor', more: Partial<Pick<RxWarning, 'label' | 'patient'>> = {}): RxWarning => ({
    code,
    kind: `RX_${code}`,
    label: RX_WARN_LABEL[code],
    title,
    message,
    patient: RX_WARN_PATIENT_LABEL[code],
    ...more
  });
  const dx = exam.diagnosis;
  const central = centralFindings(exam.findings, exam.retestFindings).filter((c) => c.kind !== 'long');
  if (central.length) {
    const names = central.map((c) => c.name).join('; ');
    return w(
      'CENTRAL',
      `${names}. Santral pozisyonel nistagmus (serebellum/beyin sapı) dışlanmalı: nörolojik değerlendirme, gerekirse MR. Ev reçetesi önerilmez. Gerekçe yazarak yine de reçete verebilirsiniz; hastanın reçete kartında "Hekim uyarıya rağmen verdi" satırı görünür.`,
      `Santral örüntü: ${central[0]!.kind === 'downbeat-pure' ? 'saf aşağı vuran nistagmus' : 'atipik nistagmus'} — ev reçetesi önerilmiyor`
    );
  }
  // Muayene başı güvenlik kontrolünde "var" (spontan nistagmus, nörolojik bulgu, boyun sorunu): santral örüntüdeki gibi
  // uyarı, ≥10 karakter gerekçe ve hastanın kartında "Hekim uyarıya rağmen verdi: muayenede …" (yeni kullanıcı turu 3, y05 #1).
  const flagged = safetyFlagged(exam.safetyCheck);
  if (flagged.length) {
    const names = andList(flagged.map((k) => SAFETY_CHECK[k].name));
    return w(
      'SAFETY_CHECK',
      `Teste başlamadan kontrolde VAR: ${names}. ${flagged.map((k) => SAFETY_CHECK[k].warn).join(' ')} Ev reçetesi önerilmez. Gerekçe yazarak yine de reçete verebilirsiniz; hastanın reçete kartında "Hekim uyarıya rağmen verdi" satırı görünür.`,
      `Teste başlamadan kontrol: ${names} VAR — ev reçetesi önerilmiyor`,
      { label: `muayene başı kontrolde ${names}`, patient: safetyPatientLabel(exam.safetyCheck)! }
    );
  }
  if (!dx) return w('NO_DIAGNOSIS', 'Tanı sekmesinde onaylı tanı yok; ev reçetesi önerilmez. Kanalı ve tarafı seçip gerekçe yazarak yine de reçete verebilirsiniz.');
  const lock = rxFindingWarning(exam.findings, exam.retestFindings);
  if (lock) return w(lock.code === 'long-response' ? 'LONG_RESPONSE' : 'MULTI_CANAL', lock.message);
  if (!rxDxCanal(dx)) {
    return w(
      'CANAL',
      `Onaylı tanı ${dx.canal === 'AC' ? 'ön kanal' : 'kanalı belirsiz'}. Ev reçetesi arka kanal (Epley/Semont) ya da yatay kanal (BBQ roll) manevrası taşır; ${dx.canal === 'AC' ? 'ön kanal manevrası (Yacovino) klinikte yapılmalıdır' : 'kanal belirlenmeden evde manevra önerilmez'}. ${RX_OVERRIDE_HINT}`
    );
  }
  if (dx.mechanism === 'cupulolithiasis') {
    return w(
      'CUPULOLITHIASIS',
      `Kupulolitiazis şüphesinde baş dönmesi 1 dakikadan uzun sürer; evde 2 dakikalık güvenlik uyarısı her manevrada çıkabilir. Ev reçetesi önerilmez, tedaviyi klinikte yapmanız önerilir. ${RX_OVERRIDE_HINT}`
    );
  }
  if (!dx.side) return w('NO_SIDE', 'Onaylı tanıda taraf yok; ev reçetesi önerilmez. Tarafı seçip gerekçe yazarak yine de reçete verebilirsiniz.');
  return null;
}

/** Reçete satırı (HBYS notu): "sol Epley", "sağ BBQ roll (yatay kanal)". */
export function rxLineName(p: Pick<Prescription, 'side' | 'maneuver'>): string {
  return `${sideName(p.side)} ${rxManeuverName(p)}${rxCanalOf(p) === 'HC' ? ' (yatay kanal)' : ''}`;
}

/** Kayıt (HBYS notu, basılı rapor) için uyarı metni: ekrana yönelik "gerekçe yazarak yine de…" cümlesi çıkar. */
export function recordText(message: string): string {
  return message
    .replace(` ${RX_OVERRIDE_HINT}`, '')
    .replace(/ Gerekçe yazarak yine de reçete verebilirsiniz[^.]*\./, '')
    .trim();
}

/** Muayenedeki aşma kaydı bu uyarıyı karşılıyor mu (aynı neden; yeni bir uyarı doğarsa yeniden karar gerekir). */
export function rxOverrideCovers(exam: ClinicExam, w: RxWarning | null = rxWarning(exam)): boolean {
  return !!w && !!exam.rxOverride && exam.rxOverride.kind === w.kind && exam.rxOverride.reason.trim().length > 0;
}

/** "Uyarıya rağmen reçete: <gerekçe> (uyarı: <kısa ad>)." — HBYS notu ve basılı rapor; güncel reçete yoksa null. */
export function rxOverrideLine(exam: ClinicExam): string | null {
  if (!rxCurrent(exam)) return null;
  const w = rxWarning(exam);
  if (!w || !rxOverrideCovers(exam, w)) return null;
  const reason = exam.rxOverride!.reason.trim().replace(/[.\s]+$/, '');
  return `Uyarıya rağmen reçete: ${reason} (uyarı: ${w.label}).`;
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
  /**
   * Yürütücünün adım işaretlerinin rapor tablosundaki etiketleri ("hedef sınırında", "oturuştan geçilmedi", "komuttan önce
   * hareket", "önce yanlış taraf"); HBYS notundaki işaretlerle aynı kayıttan (kullanıcı turu 3, k10 #4).
   */
  flags: string[];
}

/** Yürütücü adım işaretlerinin kısa etiketleri (klinisyen raporu tablosu; ev dönemi raporu da kullanır). */
export const STEP_FLAG_LABEL = {
  movedBeforeCommand: 'komuttan önce hareket',
  noSitThrough: 'oturuştan geçilmedi',
  wrongSide: 'önce yanlış taraf',
  borderline: 'hedef sınırında'
} as const;

/**
 * Hedef açıya yüzüstünden geçilerek gelindi ve kabul edilmedi (yürütücü kaydında `proneArrival`). Klinisyen tablosunda ve HBYS
 * notunda düz "önce yanlış taraf" yerine bu yazılır (kullanıcı turu 5, k10 #4). Ev raporu bağlantısı bu bayrağı biçim
 * sürümü 2'den beri taşır (kullanıcı turu 6, k09/k02); eski (v1) bağlantılarda yine "önce yanlış taraf" görünür.
 */
export const PRONE_ARRIVAL_LABEL = 'yüzüstünden gelme reddedildi';

export type StepFlagKey = keyof typeof STEP_FLAG_LABEL;
const STEP_FLAG_ORDER: StepFlagKey[] = ['movedBeforeCommand', 'noSitThrough', 'wrongSide', 'borderline'];

/**
 * Adım kaydındaki işaretlerin etiketleri (sabit sırada). Yüzüstünden gelme yanlış taraf kilidi sürerken olur; o adımda
 * "önce yanlış taraf" yerine (aynı sırada) "yüzüstünden gelme reddedildi" yazılır.
 */
export function stepFlagLabels(r: Partial<Record<StepFlagKey | 'proneArrival', boolean | undefined>>): string[] {
  return STEP_FLAG_ORDER.flatMap((k) => {
    if (k === 'wrongSide' && r.proneArrival) return [PRONE_ARRIVAL_LABEL];
    return r[k] ? [STEP_FLAG_LABEL[k]] : [];
  });
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
      early,
      flags: stepFlagLabels(r)
    };
  });
}

export function maneuverStatus(m: ManeuverLog, lines: StepLine[] = stepLines(m)): string {
  const early = lines.filter((l) => l.early).length;
  if (!m.completed) return m.stopReason ? stopReasonTextFor(m.stopReason, m.records) : 'yarıda kaldı';
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
    ...(r.proneArrival ? [`${i + 1}. adımda ${PRONE_ARRIVAL_LABEL}`] : r.wrongSide ? [`${i + 1}. adımda önce yanlış taraf`] : []),
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

/**
 * "Reçete 12.11.2026 tarihine kadar (dahil) geçerli" (HBYS notunun reçete satırı). Gün sayısıyla karışmasın diye geçerlilik
 * gün sayısı değil son geçerli gün olarak yazılır (yeni kullanıcı turu 2, y08 #6).
 */
export function rxValidityShort(dateKey: string): string {
  const last = rxLastValidDay(dateKey);
  return last ? `Reçete ${shortDate(last)} tarihine kadar (dahil) geçerli` : `Reçete ${RX_VALID_DAYS} gün geçerli`;
}

/** Geçerlilik cümlesi (reçete ekranı, basılı rapor). Testsiz kısa yolun açıklaması ayrı ve katlanır: RX_SHORTCUT_HELP. */
export function rxValidityText(dateKey: string): string {
  return `${rxValidityShort(dateKey)}.`;
}

/** Reçete formunun tek süre satırı: "5 gün, günde en çok 3 manevra. Reçete 12.11.2026 tarihine kadar (dahil) geçerli." */
export function rxDoseText(perDay: number, days: number, dateKey: string): string {
  return `${days} gün, günde en çok ${perDay} manevra. ${rxValidityText(dateKey)}`;
}

/** Testsiz kısa yolun açıklaması (reçete ekranında katlanır bölümde; y05 #6, y08 #6). */
export const RX_SHORTCUT_HELP =
  'Reçete geçerliyken hasta, muayene edilen baş dönmesi hiç geçmediyse taraf testi yapmadan reçetedeki tarafa manevra yapar. Baş dönmesi geçip yeniden başlarsa ya da reçetenin süresi dolunca uygulama her atakta önce iki tarafı test eder.';

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
  const safety = safetyCheckText(exam.safetyCheck);
  if (safety) lines.push(`Teste başlamadan kontrol: ${safety}.`);
  const dhi = dhiText(exam.dhi);
  if (dhi) lines.push(`${dhi}.`);
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
  const lock = rxFindingWarning(exam.findings, exam.retestFindings);
  if (lock) lines.push(`Ev reçetesi uyarısı: ${recordText(lock.message)}`);
  // Santral örüntü (saf aşağı vuran/atipik) tanı onaylanmadıysa da nota adıyla girer (onaylı tanıda "Uyarılar:" satırında).
  const central = centralFindings(exam.findings, exam.retestFindings).filter((c) => c.kind !== 'long');
  if (central.length && !(dx && dxValid(exam) && dx.warnings?.length)) {
    lines.push(`Santral örüntü: ${central.map((c) => c.name).join('; ')}. Santral pozisyonel nistagmus dışlanmalı.`);
  }
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
        // Süre, reçete ekranındaki tek cümleyle aynı (rxDoseText); testsiz kısa yol notta ayrıca anlatılmaz (y05 #3).
        `Ev reçetesi: ${rxLineName(r.value)} (DengeYol, QR ile verildi; reçete kodu ${rxCode(exam.prescriptionToken)}). ${rxDoseText(r.value.perDay, r.value.days, r.value.date)}`
      );
      const ov = rxOverrideLine(exam);
      if (ov) lines.push(ov);
    }
  }
  for (const h of exam.homeReports ?? []) {
    const r = decodeHomeReport(h.token);
    if (r.ok) lines.push(homeReportNoteLine(r.value, exam.prescriptionToken ? rxCode(exam.prescriptionToken) : null));
  }
  if (exam.notes?.trim()) lines.push(`Not: ${exam.notes.trim()}`);
  if (clinician.name) lines.push(`${clinician.name}${clinician.clinic ? `, ${clinician.clinic}` : ''}`);
  return lines.join('\n');
}


// ---- Ev dönemi raporu (hastanın QR/bağlantıyla getirdiği; core/reportShare.ts) -----------------------------------

/** "01.11" (yerel ayar gün-ay biçimini "01/11" yazabildiği için elle). */
const dayMonth = (t: number) => {
  const d = new Date(t);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const dateTime = (t: number) =>
  new Date(t).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Ev adımı işaretlerinin etiketleri (klinisyen tablosuyla aynı sözcükler). */
const HOME_FLAG_LABEL: Record<HomeStep['flags'][number], string> = {
  endedEarly: 'süre dolmadan geçildi',
  slowTransition: 'yavaş geçiş',
  ...STEP_FLAG_LABEL,
  unreachable: 'POZİSYONA GELİNEMEDİ',
  manual: 'elle onaylandı',
  proneArrival: PRONE_ARRIVAL_LABEL
};

/**
 * Ev adımının gösterilecek işaretleri: yüzüstünden gelme yanlış taraf kilidi sürerken olur; o adımda "önce yanlış taraf"
 * yerine (aynı sırada) yalnız "yüzüstünden gelme reddedildi" yazılır (klinisyen tablosundaki `stepFlagLabels` gibi).
 */
function homeStepFlags(st: HomeStep): HomeStep['flags'] {
  if (!st.flags.includes('proneArrival')) return st.flags;
  return st.flags.flatMap((f) => (f === 'wrongSide' ? ['proneArrival' as const] : f === 'proneArrival' ? [] : [f]));
}

/**
 * Yapıştırılan metin bir ev reçetesi bağlantısı mı (hasta raporu değil)? Doğrudan açılan reçete bağlantısındaki açık mesaj
 * yapıştırma alanında da verilsin (kullanıcı turu 4, k09).
 */
export function looksLikeRxLink(text: string): boolean {
  const t = text.trim();
  return /#\/recete\//.test(t) && extractRxToken(t) !== null;
}

/** Rapor yapıştırma alanının ret metni: reçete bağlantısı tanınır, diğerleri genel mesaj. */
export function reportPasteErrorText(text: string): string {
  return looksLikeRxLink(text)
    ? `${REPORT_DECODE_ERROR_TEXT.KIND} Hastanın raporu, uygulamadaki rapor ekranının sonundaki "Hekime QR kodla gösterin" kartındadır.`
    : 'Bu bir hasta raporu bağlantısına benzemiyor.';
}

/**
 * Ev dönemi başlığının tarihleri, her biri kendi adıyla (kullanıcı turu 5, k09 #6): "Reçete 16.10 (geçerlilik 29.10 dahil) ·
 * ataklar 17.10–25.10 · rapor 31.10". Hasta tarafındaki QR kartıyla aynı metin (core/reportShare.ts `homeReportDatesText`).
 */
export function homePeriodText(r: HomeReport): string {
  return cap(homeReportDatesText(r));
}

export function homeCounts(r: HomeReport): { episodes: number; maneuvers: number; completed: number } {
  const ms = r.episodes.flatMap((e) => e.maneuvers);
  return { episodes: r.episodes.length, maneuvers: ms.length, completed: ms.filter((m) => m.completed).length };
}

const RETEST_KIND: Record<HomeRetest['kind'], string> = { early: 'erken (1. saat)', morning: 'sabah', other: 'diğer' };

export function homeRetestText(t: HomeRetest): string {
  const res = t.vertigo ? `baş dönmesi var (gecikme ${t.latencySec ?? '?'} s, süre ${t.durationSec ?? '?'} s)` : 'baş dönmesi gelmedi';
  return `${RETEST_KIND[t.kind]}, ${sideName(t.side)}: ${res}`;
}

function cellText(c: HomeSideTest['R']): string {
  if (!c) return 'yapılmadı';
  if (c.safetyStopped) return 'durduruldu (baş dönmesi 2 dakikadan uzun)';
  return c.vertigo ? `baş dönmesi, gecikme ${c.latencySec ?? '?'} s, süre ${c.durationSec ?? '?'} s` : 'baş dönmesi yok';
}

/**
 * "Dix-Hallpike (belirtiyle) — Sağ: …; Sol: … → karar". Biçim v3'te test türü bağlantıdadır (sırtüstü baş çevirme testinde
 * hücreler "Başı sağa çevirince"); v1/v2'de arka kanal varsayılır (yeni kullanıcı turu 1, y04 ⚠6).
 */
export function homeSideTestText(t: HomeSideTest): string {
  return `${sideTestName(t.canal)} — ${sideCellLabel(t.canal, 'R')}: ${cellText(t.R)}; ${sideCellLabel(t.canal, 'L')}: ${cellText(t.L)} → ${decisionText(t.decision)}`;
}

export function homeStepText(st: HomeStep): string {
  const parts = [`${st.holdSec} s`];
  for (const f of homeStepFlags(st)) parts.push(f === 'slowTransition' && st.transitionSec !== null ? `yavaş geçiş ${st.transitionSec} s` : HOME_FLAG_LABEL[f]);
  if (st.vertigo) {
    parts.push(
      `baş dönmesi: gecikme ${st.vertigo.latencySec} s, ${st.vertigo.durationSec !== null ? `süre ${st.vertigo.durationSec} s` : 'bitişi işaretlenmedi'}${st.vertigo.marks > 1 ? ` (${st.vertigo.marks} işaret)` : ''}`
    );
  }
  return parts.join(' · ');
}

const AFTER_TEXT: Record<NonNullable<HomeManeuver['afterSymptoms']>, string> = {
  none: 'sonrası: iyi',
  mild: 'sonrası: hafif belirti',
  severe: 'sonrası: şiddetli belirti',
  neuro: 'sonrası: yeni nörolojik belirti'
};

/** "Epley sağ: tamamlandı (5/5 adım) · yakını yaptırdı · 1 kez duraklatıldı · sonrası: iyi" */
export function homeManeuverText(m: HomeManeuver): string {
  const def = PROTOCOLS[m.protocolId];
  const total = def?.steps.length;
  const status = m.completed
    ? 'tamamlandı'
    : m.stopReason === 'INTERRUPTED'
      ? `yarıda kaldı: ${m.stepCount}. adımda uygulama kapandı ya da yenilendi`
      : m.stopReason
        ? STOP_REASON_TEXT[m.stopReason]
        : 'yarıda kaldı';
  const parts = [`${def ? protocolReportName(m.protocolId) : m.protocolId}${m.side ? ` ${sideName(m.side)}` : ''}: ${status}${total ? ` (${m.stepCount}/${total} adım)` : ''}`];
  if (m.assisted === true) parts.push('yakını yaptırdı');
  else if (m.assisted === false) parts.push('kendi başına');
  if (m.manual) parts.push('sensörsüz');
  if (m.pauses > 0) parts.push(`${m.pauses} kez duraklatıldı`);
  if (m.afterSymptoms) parts.push(AFTER_TEXT[m.afterSymptoms]);
  // Manevra başına belirti şiddeti (yeni kullanıcı turu 3, y04 #2).
  if (m.vasAfter !== undefined) parts.push(`belirti şiddeti sonra: ${m.vasAfter}/10`);
  return parts.join(' · ');
}

const TEST_STOP_REASON: Record<HomeTestStop['reason'], string> = { USER_FEELS_UNWELL: 'hasta kendini iyi hissetmedi' };

/** Durdurulan test: "sağ taraf testi" ya da "tekrar testi (sol)". */
function testStopWhat(t: HomeTestStop): string {
  return t.test === 'side' ? `${sideName(t.side)} taraf testi` : `tekrar testi (${sideName(t.side)})`;
}

/**
 * Testte durdurma (biçim v2; kullanıcı turu 6, k01/k09): "sağ taraf testi durduruldu — hasta kendini iyi hissetmedi". Yarım
 * test sonuç sayılmaz; atak açık kalır.
 */
export function homeTestStopText(t: HomeTestStop): string {
  return `${testStopWhat(t)} durduruldu — ${TEST_STOP_REASON[t.reason]}`;
}

/** HBYS satırı için kısa özet: "testte durdurma: sağ taraf testi 31.10 (hasta kendini iyi hissetmedi)"; yoksa null. */
export function homeTestStopsShort(r: HomeReport): string | null {
  const all = r.episodes.flatMap((e) => e.testStops ?? []).sort((a, b) => a.at - b.at);
  if (!all.length) return null;
  const shown = all.slice(-3).map((t) => `${testStopWhat(t)} ${dayMonth(t.at)}`);
  const more = all.length > shown.length ? `${all.length} kez, son: ` : '';
  const reasons = [...new Set(all.map((t) => TEST_STOP_REASON[t.reason]))].join(', ');
  return `testte durdurma: ${more}${shown.join(', ')} (${reasons})`;
}

/** Ev manevrasının adım işaretleri özeti (adım ayrıntısı yoksa boş): "2. adımda oturuştan geçilmedi". */
export function homeManeuverFlags(m: HomeManeuver): string[] {
  return (m.steps ?? []).flatMap((st, i) =>
    homeStepFlags(st).filter((f) => f !== 'manual').map((f) => `${i + 1}. adımda ${f === 'slowTransition' && st.transitionSec !== null ? `yavaş geçiş ${st.transitionSec} s` : HOME_FLAG_LABEL[f]}`)
  );
}

/**
 * "Atak 31.10.2026 09:12 — Düzeldi" (+ kapanış notu). Açık atakta "sürüyor" yalnız belirti sürüyorsa; 1. saat tekrar testi
 * negatifse "Atak açık: 1. saat tekrar testi negatif, sabah testi bekleniyor" (kullanıcı turu 5, k08 #6).
 */
export function homeEpisodeTitle(e: HomeEpisode): string {
  if (e.status === 'active') return `Atak ${dateTime(e.startedAt)} — ${cap(homeOpenEpisodeText(e))}`;
  const note = e.endNote ? endNoteText(e.endNote) : '';
  return `Atak ${dateTime(e.startedAt)} — ${STATUS_LABEL[e.status]}${note ? ` (${note})` : ''}`;
}

function lastRetest(r: HomeReport): HomeRetest | null {
  const all = r.episodes.flatMap((e) => e.retests).sort((a, b) => a.at - b.at);
  return all[all.length - 1] ?? null;
}

/** Kapanmış atağın sonucunun kısa adı (hasta tarafındaki dönem özetiyle aynı sözcükler). */
const HOME_OUTCOME: Record<Exclude<HomeEpisode['status'], 'active'>, string> = {
  resolved: 'düzeldi',
  referred: 'hekime yönlendirildi',
  emergency: 'acile yönlendirildi',
  closed: 'kapatıldı'
};

const RETEST_NAME: Record<HomeRetest['kind'], string> = { early: '1. saat tekrar testi', morning: 'sabah testi', other: 'tekrar testi' };

/**
 * Açık (kapatılmamış) atağın durumu. "Sürüyor" yalnız belirti sürüyorsa (son tekrar testi pozitif ya da hiç test/manevra
 * yok) yazılır: 1. saat tekrar testi negatifken atak yalnız sabah testi beklendiği için açıktır (kullanıcı turu 5, k08 #6).
 */
export function homeOpenEpisodeText(e: HomeEpisode): string {
  const rt = [...e.retests].sort((a, b) => a.at - b.at)[e.retests.length - 1];
  if (rt?.vertigo) return `sürüyor: ${RETEST_NAME[rt.kind]} pozitif (baş dönmesi var)`;
  if (rt?.kind === 'early') return 'atak açık: 1. saat tekrar testi negatif, sabah testi bekleniyor';
  if (rt) return `atak açık: ${RETEST_NAME[rt.kind]} negatif`;
  if (e.maneuvers.length) return 'atak açık: manevra sonrası tekrar testi yapılmadı';
  return 'sürüyor';
}

/** Yönlendirme nedeninin kısa hâli: güvenlik sorusunda sorunun kısa adı, diğerlerinde cümlenin ilk bölümü. */
function homeEndNoteShort(note: string): string {
  const ids = note.split(/\s*,\s*/);
  const flags = ids.map((id) => RED_FLAGS.find((q) => q.id === id));
  if (flags.every((q) => q)) return `güvenlik sorusu: ${flags.map((q) => q!.label).join(', ')}`;
  return endNoteText(note).split(';')[0]!.trim();
}

/**
 * Son atağın sonucu, ev dönemi özetinin ve HBYS satırının başı (kullanıcı turu 5, k09 #5; hasta tarafındaki dönem özetiyle
 * aynı sıra): "son atak (25.10): hekime yönlendirildi — baş dönmesi bir dakikadan uzun sürdü…"; açık atakta
 * "son atak (31.10) — atak açık: 1. saat tekrar testi negatif, sabah testi bekleniyor". Atak yoksa null.
 */
export function homeLastOutcomeText(r: HomeReport): string | null {
  const last = [...r.episodes].sort((a, b) => a.startedAt - b.startedAt)[r.episodes.length - 1];
  if (!last) return null;
  const head = `son atak (${dayMonth(last.startedAt)})`;
  if (last.status === 'active') return `${head} — ${homeOpenEpisodeText(last)}`;
  const note = (last.status === 'referred' || last.status === 'emergency') && last.endNote ? homeEndNoteShort(last.endNote) : '';
  return `${head}: ${HOME_OUTCOME[last.status]}${note ? ` — ${note}` : ''}`;
}

/**
 * Baştaki sonuç (açık atağın durumu) bu tekrar testini zaten söylüyor mu? Açık son atağın son tekrar testi, raporun son
 * tekrar testiyse evet: "atak açık: 1. saat tekrar testi negatif…" yazıldıktan sonra aynı test bir daha yazılmaz.
 */
function leadCoversRetest(r: HomeReport, rt: HomeRetest): boolean {
  const last = [...r.episodes].sort((a, b) => a.startedAt - b.startedAt)[r.episodes.length - 1];
  return !!last && last.status === 'active' && last.retests.includes(rt);
}

/**
 * Kısa sonuç satırı, önce son atağın sonucu: "Son atak (02.11): düzeldi · 2 atak · 4 manevra (3 tamamlandı) · son tekrar test
 * (02.11) sabah, sağ: baş dönmesi gelmedi". Açık atakta baştaki sonuç son tekrar testini zaten söylüyorsa test bir daha
 * yazılmaz (kullanıcı turu 6, k08 #4); pozitif testte yalnız söylenmeyen kısım (taraf, gecikme, süre) eklenir.
 */
export function homeReportHeadline(r: HomeReport, opts: { alert?: boolean } = {}): string {
  const c = homeCounts(r);
  const lead = homeLastOutcomeText(r);
  // Kırmızı bayrak aşıldıysa ya da yeni nörolojik belirti bildirildiyse ilk söz bu (yeni kullanıcı turu 2, y05 #3). Ekran
  // uyarıyı ayrı kırmızı satırda gösterir (`alert: false`); HBYS satırı başta yazar.
  const alert = opts.alert === false ? null : homeReportAlert(r);
  const parts = [...(alert ? [alert] : []), ...(lead ? [cap(lead)] : []), `${c.episodes} atak`, `${c.maneuvers} manevra (${c.completed} tamamlandı)`];
  const referred = r.episodes.filter((e) => e.status === 'referred' || e.status === 'emergency').length;
  if (referred) parts.push(`${referred} atakta hekime/acile yönlendirildi`);
  const rt = lastRetest(r);
  if (rt && !leadCoversRetest(r, rt)) parts.push(`son tekrar test (${dayMonth(rt.at)}) ${homeRetestText(rt)}`);
  else if (rt?.vertigo) parts.push(`son tekrar test ${sideName(rt.side)}: gecikme ${rt.latencySec ?? '?'} s, süre ${rt.durationSec ?? '?'} s`);
  return parts.join(' · ');
}

const flagLabels = (ids: string[]) => ids.map((id) => RED_FLAGS.find((q) => q.id === id)?.label ?? 'güvenlik sorusu');
const isEmergencyFlag = (id: string) => RED_FLAGS.find((q) => q.id === id)?.action === 'emergency';

/**
 * Ev raporunun ilk satırı olacak alarm (yeni kullanıcı turu 2, y05 #3, y08): manevra sonrası yeni nörolojik belirti (112
 * şeridine yanıtıyla) ve aşılan kırmızı bayrak (güvenlik sorusunda işaretlenip uyarıya rağmen devam edilen) ya da acil
 * belirtiyle durdurulan atak. Yoksa null. Demo atağında "(demo kaydı)" eklenir.
 */
export function homeReportAlert(r: Pick<HomeReport, 'episodes'>): string | null {
  const parts: string[] = [];
  const eps = [...r.episodes].sort((a, b) => a.startedAt - b.startedAt);
  const demo = (e: HomeEpisode) => (e.simulation ? ' (demo kaydı)' : '');
  const neuro = eps.flatMap((e) => e.maneuvers.filter((m) => m.afterSymptoms === 'neuro').map((m) => ({ e, m }))).sort((a, b) => a.m.at - b.m.at);
  const lastNeuro = neuro[neuro.length - 1];
  if (lastNeuro) {
    const { e, m } = lastNeuro;
    const ack = e.neuroAck && e.neuroAck.at >= m.at ? e.neuroAck : null;
    const resp = !ack ? '112 uyarısına yanıt yok' : ack.by === 'called112' ? 'kişi "112\'yi aradım" dedi' : 'kişi "belirtiler geçti, iyiyim" dedi';
    parts.push(`Manevra sonrası yeni nörolojik belirti bildirildi (${dayMonth(m.at)}${neuro.length > 1 ? `, ${neuro.length} kez` : ''}); ${resp}${demo(e)}`);
  }
  const flags = eps.flatMap((e) => (e.redFlags ?? []).map((f) => ({ e, f })));
  const passed = flags.filter((x) => x.f.continued);
  if (passed.length) {
    const labels = [...new Set(passed.flatMap((x) => flagLabels(x.f.ids)))];
    const last = passed[passed.length - 1]!;
    parts.push(`Kırmızı bayrak aşıldı: ${labels.join(', ')} işaretlendi, uyarıya rağmen devam edildi (${dayMonth(last.f.at)})${demo(last.e)}`);
  }
  const stopped = flags.filter((x) => !x.f.continued && x.f.ids.some(isEmergencyFlag));
  if (stopped.length) {
    const labels = [...new Set(stopped.flatMap((x) => flagLabels(x.f.ids.filter(isEmergencyFlag))))];
    const last = stopped[stopped.length - 1]!;
    parts.push(`Acil belirti işaretlendi: ${labels.join(', ')}; atak durduruldu (${dayMonth(last.f.at)})${demo(last.e)}`);
  }
  return parts.length ? parts.join(' · ') : null;
}

/**
 * Muayene listesinin ev dönemi özeti (yeni kullanıcı turu 2, y04 #5): eklenen ev raporlarındaki manevra ve aşılan uyarı
 * sayısı, "ev: 2 manevra, 3 aşma" (aşma yalnız araştırma kaydı taşıyan raporda). Ev raporu yoksa ya da hiçbiri okunamıyorsa null.
 */
export function homeListSummary(exam: Pick<ClinicExam, 'homeReports'>): string | null {
  let maneuvers = 0;
  let overrides = 0;
  let any = false;
  let research = false;
  for (const h of exam.homeReports ?? []) {
    const r = decodeHomeReport(h.token);
    if (!r.ok) continue;
    any = true;
    maneuvers += homeCounts(r.value).maneuvers;
    if (homeReportHasResearch(r.value)) {
      research = true;
      overrides += homeOverrideCount(r.value);
    }
  }
  // Araştırma kaydı taşımayan (eski uygulamanın) raporunda aşma sayısı bilinmez: yazılmaz.
  return any ? `ev: ${maneuvers} manevra${research ? `, ${overrides} aşma` : ''}` : null;
}

// ---- Kontrol muayenesi (yeni kullanıcı turu 3, y08 #2) ve DHI (y04 #3) ------------------------------------------

/** DHI toplam puanı geçerli mi (0–100 tam sayı). */
export function isDhi(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 100;
}

/** "DHI toplam puanı: 42/100"; girilmediyse null. */
export function dhiText(dhi: number | undefined): string | null {
  return isDhi(dhi) ? `DHI toplam puanı: ${dhi}/100` : null;
}

/**
 * Aynı hastanın bu muayeneden önceki son dolu muayenesi (bulgu, tanı ya da reçete taşıyan); yoksa undefined.
 */
export function previousExam(exam: Pick<ClinicExam, 'id' | 'patientId' | 'at'>, all: readonly ClinicExam[]): ClinicExam | undefined {
  return all
    .filter(
      (e) =>
        e.id !== exam.id &&
        e.patientId === exam.patientId &&
        e.at < exam.at &&
        (!!e.diagnosis || !!e.prescriptionToken || Object.keys(e.findings).length > 0)
    )
    .sort((a, b) => b.at - a.at)[0];
}

/** Muayeneye eklenmiş ev raporlarından en son üretilen (okunabilen). */
function latestHomeReport(exam: Pick<ClinicExam, 'homeReports'>): HomeReport | null {
  let best: HomeReport | null = null;
  for (const h of exam.homeReports ?? []) {
    const r = decodeHomeReport(h.token);
    if (r.ok && (!best || r.value.generatedAt >= best.generatedAt)) best = r.value;
  }
  return best;
}

export interface ControlSummary {
  /** "Önceki muayene (01.11): Sağ arka kanal BPPV — kanalolitiazis · reçete: sağ Epley, 5 gün, günde en fazla 3". */
  previous: string | null;
  /** Önceki tanının kısa adı (liste satırı için); bilinmiyorsa null. */
  previousDx: string | null;
  /** "Ev dönemi: … · 1 atak · 1 manevra (1 tamamlandı) · tekrar testi yok"; ev raporu yoksa null. */
  home: string | null;
  /** Tek öneri cümlesi. */
  advice: string;
}

/**
 * Kontrol muayenesinin özet kartı (Testler sekmesinin üstünde): önceki tanı ve reçete, ev dönemi özeti, öneri cümlesi. Aynı
 * hastanın önceki dolu muayenesi ya da eklenmiş ev raporu yoksa (ilk muayene) null.
 */
export function controlSummary(exam: ClinicExam, all: readonly ClinicExam[]): ControlSummary | null {
  const prev = previousExam(exam, all);
  const report = latestHomeReport(exam);
  if (!prev && !report) return null;
  let previous: string | null = null;
  let previousDx: string | null = null;
  if (prev) {
    const dx = prev.diagnosis && dxValid(prev) ? prev.diagnosis : null;
    previousDx = dx ? dxText(dx) : null;
    const rx = prev.prescriptionToken && rxCurrent(prev) ? decodePrescription(prev.prescriptionToken) : null;
    const rxPart = rx?.ok ? `reçete: ${rxLineName(rx.value)}, ${rx.value.days} gün, günde en fazla ${rx.value.perDay}` : 'reçete verilmedi';
    previous = `Önceki muayene (${dayMonth(prev.at)}): ${previousDx ?? 'tanı girilmedi'} · ${rxPart}`;
  } else if (report?.rx) {
    // Muayene bu telefonda yok (başka cihazda ya da başka hekimce): reçete bilgisi rapordan.
    const rx = report.rx;
    previousDx = `${cap(sideName(rx.side))} ${rxCanalOf(rx) === 'HC' ? 'yatay' : 'arka'} kanal (reçeteden)`;
    previous = `Reçete (hastanın raporundan, ${dayMonth(rxIssuedAtMs(rx.date) ?? report.generatedAt)}): ${rxLineName(rx)}, ${rx.days} gün, günde en fazla ${rx.perDay}`;
  }
  let home: string | null = null;
  if (report) {
    const retests = report.episodes.reduce((n, e) => n + e.retests.length, 0);
    home = `Ev dönemi: ${homeReportHeadline(report)}${retests ? '' : ' · tekrar testi yok'}`;
  }
  const advice = report
    ? homeReportAdvice(report)
    : 'Ev raporu eklenmedi: hastanın uygulamasındaki rapor QR kodunu okutun; pozisyon testini tekrarlayın.';
  return { previous, previousDx, home, advice };
}

/**
 * Muayene listesindeki tanı parçası: kontrol muayenesinde "kontrol · önceki tanı: …" (kendi tanısı yoksa), ilk muayenede
 * tanı ya da "tanı girilmedi".
 */
export function examListDx(exam: ClinicExam, all: readonly ClinicExam[]): string {
  const c = controlSummary(exam, all);
  if (exam.diagnosis) return `${c ? 'kontrol · ' : ''}${exam.diagnosis.label}`;
  if (c) return `kontrol · önceki tanı: ${c.previousDx ?? 'girilmedi'}`;
  return 'tanı girilmedi';
}

/** Atağın belirti şiddeti (VAS 0–10; biçim v3): "başta 7, manevradan sonra 3"; girilmediyse null. */
export function homeVasText(e: Pick<HomeEpisode, 'vas'>): string | null {
  const v = e.vas;
  if (!v || (v.before === undefined && v.after === undefined)) return null;
  const parts = [...(v.before !== undefined ? [`başta ${v.before}`] : []), ...(v.after !== undefined ? [`manevradan sonra ${v.after}`] : [])];
  return parts.join(', ');
}

/** Boyut nedeniyle kısaltma uyarısı (yoksa null). */
export function homeTruncationText(r: HomeReport): string | null {
  const parts: string[] = [];
  if (r.stepsDropped) parts.push('adım ayrıntısı çıkarıldı');
  if (r.episodesOmitted) parts.push(`en eski ${r.episodesOmitted} atak çıkarıldı`);
  if (r.maneuversOmitted) parts.push(`en eski ${r.maneuversOmitted} manevra çıkarıldı`);
  return parts.length ? `QR kodu küçük kalsın diye ${parts.join(', ')}; ayrıntı hastanın metin raporundadır.` : null;
}

/**
 * HBYS notunun ev dönemi satırı. `examRxCode`: bu muayenede verilen reçetenin kodu (eşleşirse belirtilir).
 */
export function homeReportNoteLine(r: HomeReport, examRxCode: string | null = null): string {
  // Önce son atağın sonucu ve sayılar (karar bilgisi), sonra adlandırılmış tarihler ve kodlar (kullanıcı turu 5, k09 #5–6).
  const parts = [`Ev dönemi (hastanın DengeYol raporu, QR ile aktarıldı): ${homeReportHeadline(r)}`];
  parts.push(homeReportDatesText(r));
  if (r.rxCode) parts.push(`reçete kodu ${r.rxCode}${examRxCode && examRxCode === r.rxCode ? ' (bu muayenenin reçetesi)' : ''}`);
  const flags = r.episodes.flatMap((e) => e.maneuvers.flatMap(homeManeuverFlags));
  if (flags.length) parts.push(`adım işaretleri: ${[...new Set(flags.map((f) => f.replace(/^\d+\. adımda /, '')))].join(', ')}`);
  const stops = homeTestStopsShort(r);
  if (stops) parts.push(stops);
  parts.push(homeResearchNote(r));
  const trunc = homeTruncationText(r);
  if (trunc) parts.push('kısaltılmış rapor');
  return parts.join(' · ') + '.';
}

// ---- Ev raporunun araştırma kaydı (biçim v3; yeni kullanıcı turu 1, y04 #1, y05 #7) ------------------------------------

/** Ev atağının araştırma kaydı, bölümlenmiş (hasta raporuyla aynı sınıflama: reportText `researchEntries`). */
export function homeResearchEntries(e: HomeEpisode): ResearchEntry[] {
  return researchEntries(e);
}

/** Kullanıcının aştığı uyarı sayısı (raporun bütün ataklarında). */
export function homeOverrideCount(r: Pick<HomeReport, 'episodes'>): number {
  return r.episodes
    .flatMap((e) => researchEntries(e))
    .filter((x) => x.group === 'override')
    .reduce((n, x) => n + x.count, 0);
}

/** Aşılan uyarının HBYS satırındaki kısa adı (ham kod yazılmaz). */
export function overrideShortName(kind: string): string {
  const known: Record<string, string> = {
    RED_FLAG: 'güvenlik sorusu (kırmızı bayrak)',
    CONTRAINDICATION: 'kontrendikasyon',
    DOSE: 'manevra sınırı',
    EARLY_REPEAT: 'tekrar testi beklenmeden manevra',
    VERTIGO_TOO_LONG: '2 dakikayı aşan baş dönmesi',
    POSITION_UNREACHABLE: 'pozisyona gelinemedi',
    SIDE_CONFLICT: 'taraf çelişkisi',
    REFERRAL: 'yönlendirmeden sonra yeni atak',
    REFER_NOT_TRIGGERED: 'test tetiklemeden manevra',
    VOMITING: 'kusmaya rağmen yeniden deneme',
    STILL_UNWELL: 'hâlâ kötü hissederken devam',
    NEURO_ALERT: 'yeni nörolojik belirtiden sonra manevra'
  };
  if (known[kind]) return known[kind]!;
  if (/^REFER_/.test(kind)) return 'yönlendirme önerisi';
  return 'diğer uyarı';
}

/** İşaretlenen güvenlik sorusu: "Çift görme / konuşma bozukluğu — uyarı gösterildi, devam edildi". */
export function homeRedFlagText(f: HomeRedFlag): string {
  const labels = f.ids.map((id) => RED_FLAGS.find((q) => q.id === id)?.label ?? 'güvenlik sorusu').join(', ');
  return `${cap(labels)} — ${f.continued ? 'uyarı gösterildi, devam edildi' : 'atak durduruldu (hekime/acile yönlendirme)'}`;
}

/**
 * Manevra sonrası yeni nörolojik belirtide 112 şeridine yanıt: "112'yi aradım dedi" / "belirtiler geçti dedi" / "yanıt
 * vermedi". Bu atakta böyle bir belirti yoksa null.
 */
export function homeNeuroAckText(e: HomeEpisode): string | null {
  const m = e.maneuvers.filter((x) => x.afterSymptoms === 'neuro').sort((a, b) => b.at - a.at)[0];
  if (!m) return null;
  const ack = e.neuroAck && e.neuroAck.at >= m.at ? e.neuroAck : null;
  if (!ack) return '112 uyarısı gösterildi, kişi yanıt vermedi';
  return `112 uyarısı gösterildi, kişi ${ack.by === 'called112' ? '"112\'yi aradım"' : '"belirtiler geçti, iyiyim"'} dedi (${dateTime(ack.at)})`;
}

/** Kurulumda işaretlenen kontrendikasyonların adları ("Boyun fıtığı …"); yoksa null. */
export function homeContraText(r: Pick<HomeReport, 'contraindications'>): string | null {
  const ids = r.contraindications ?? [];
  if (!ids.length) return null;
  const known = contraindicationsFor(ids).map((c) => c.label);
  const unknown = ids.length - known.length;
  return [...known, ...(unknown > 0 ? [`${unknown} tanınmayan madde`] : [])].join(', ');
}

/** Raporun kayıt kaynağı: "DengeYol 0.1.0 · karar kuralları k1"; sürüm yoksa (eski uygulama) null. */
export function homeVersionText(r: Pick<HomeReport, 'appVersion' | 'rulesVersion'>): string | null {
  return versionText(r.appVersion, r.rulesVersion);
}

/**
 * HBYS satırının araştırma kaydı parçası: "araştırma kaydı — uyarıya rağmen devam: 2 (güvenlik sorusu (kırmızı bayrak),
 * kontrendikasyon); güvenlik sorusu işaretli: Çift görme (devam edildi); …". Eski uygulamanın raporunda kayıt olmadığı söylenir.
 */
export function homeResearchNote(r: HomeReport): string {
  if (!homeReportHasResearch(r)) return 'araştırma kaydı yok (raporu üreten uygulama eski sürüm)';
  const parts: string[] = [];
  const ov = r.episodes.flatMap((e) => researchEntries(e)).filter((x) => x.group === 'override');
  const n = ov.reduce((k, x) => k + x.count, 0);
  parts.push(`uyarıya rağmen devam: ${n}${n ? ` (${[...new Set(ov.map((x) => overrideShortName(x.kind)))].join(', ')})` : ''}`);
  const flags = r.episodes.flatMap((e) => e.redFlags ?? []);
  if (flags.length) {
    parts.push(
      `güvenlik sorusu işaretli: ${flags
        .map((f) => `${f.ids.map((id) => RED_FLAGS.find((q) => q.id === id)?.label ?? 'güvenlik sorusu').join(', ')} (${f.continued ? 'devam edildi' : 'durdu'})`)
        .join('; ')}`
    );
  }
  const contra = homeContraText(r);
  if (contra) parts.push(`kontrendikasyon: ${contra}`);
  const acks = r.episodes.map((e) => homeNeuroAckText(e)).filter((x): x is string => !!x);
  if (acks.length) parts.push(`yeni belirti: ${acks.join('; ')}`);
  const taps = r.episodes.reduce((n, e) => n + (e.vertigoTapCancels ?? 0), 0);
  if (taps) parts.push(`çift dokunuşla geri alınan baş dönmesi işareti: ${taps}`);
  const decisions = r.episodes.flatMap((e) => researchEntries(e)).filter((x) => x.group === 'decision').reduce((k, x) => k + x.count, 0);
  if (decisions) parts.push(`uygulama kararı: ${decisions}`);
  const hc = r.episodes.some((e) => e.sideTests.some((t) => t.canal === 'HC'));
  if (hc) parts.push('sırtüstü baş çevirme testi yapıldı');
  const demo = r.episodes.filter((e) => e.simulation).length;
  if (demo) parts.push(`DEMO MODU: ${demo} atak (eğitim kaydı)`);
  if (r.studyId) parts.push(`katılımcı no ${r.studyId}`);
  const ver = homeVersionText(r);
  if (ver) parts.push(ver);
  return `araştırma kaydı — ${parts.join('; ')}`;
}

/** Ev raporunun ilk okunuşta gösterilen eşleşme kodu: reçetedeki hasta kodu, yoksa çalışma katılımcı no. */
export function homeMatchCode(r: Pick<HomeReport, 'pid' | 'studyId'>): string | undefined {
  return r.pid ?? r.studyId;
}

const isAtypicalCell = (c: HomeSideTest['R']) => !!c && (c.safetyStopped || (c.vertigo && (c.durationSec === null || c.durationSec >= 60)));

/**
 * Ev raporu açılınca gösterilen tek cümlelik klinik öneri (yeni kullanıcı turu 1, y08 #3). Karar desteğidir, hasta beyanına
 * dayanır; öncelik sırası (demo kaydında başta demo notu): acil belirti, hekime yönlendiren yanıt, atipik süre, manevraya yanıt, test tetiklenmemesi.
 */
export function homeReportAdvice(r: HomeReport): string {
  const eps = r.episodes;
  if (eps.length === 0) return 'Raporda atak yok: muayene bulgusuna göre ilerleyin.';
  // Demo kaydında da öneri gösterilir (uygulamayı deneyen hekim öneriyi görsün), demo notuyla (yeni kullanıcı turu 2, y08 #5).
  if (eps.every((e) => e.simulation)) return `${DEMO_ADVICE_NOTE} ${clinicalAdvice(eps)}`;
  return clinicalAdvice(eps);
}

/** Bütünüyle demo modunda üretilen raporun öneri satırının başı. */
export const DEMO_ADVICE_NOTE = 'Bu rapor demo modunda (sanal sensörle) üretildi; gerçek tedavi kaydı değildir. Kayıt gerçek olsaydı öneri:';

function clinicalAdvice(eps: HomeEpisode[]): string {
  const flags = eps.flatMap((e) => e.redFlags ?? []);
  const emergencyFlag = flags.some((f) => f.ids.some((id) => RED_FLAGS.find((q) => q.id === id)?.action === 'emergency'));
  const neuroAfter = eps.some((e) => e.maneuvers.some((m) => m.afterSymptoms === 'neuro'));
  if (emergencyFlag || neuroAfter || eps.some((e) => e.status === 'emergency')) {
    return 'Evde acil (nörolojik) belirti bildirildi: önce nörolojik değerlendirme yapın; santral neden dışlanmadan manevra önermeyin.';
  }
  if (flags.length || eps.some((e) => e.status === 'referred')) {
    return 'Evde hekime yönlendiren bir yanıt ya da durum kaydedildi: bunu muayenede sorgulayın, sonra pozisyon testini tekrarlayın.';
  }
  const atypical =
    eps.some((e) => e.sideTests.some((t) => isAtypicalCell(t.R) || isAtypicalCell(t.L))) ||
    eps.some((e) => e.retests.some((x) => x.vertigo && (x.durationSec === null || x.durationSec >= 60))) ||
    eps.some((e) => e.endNote === 'ATYPICAL_LONG' || e.maneuvers.some((m) => m.stopReason === 'VERTIGO_TOO_LONG'));
  if (atypical) return 'Evde 1 dakikadan uzun baş dönmesi kaydedildi: santral pozisyonel nistagmusu dışlamak için testi muayenede gözlemle tekrarlayın.';
  const completed = eps.flatMap((e) => e.maneuvers.filter((m) => m.completed)).sort((a, b) => a.at - b.at);
  const retests = eps.flatMap((e) => e.retests).sort((a, b) => a.at - b.at);
  const last = retests[retests.length - 1];
  const lastMan = completed[completed.length - 1];
  if (lastMan && (!last || last.at < lastMan.at)) {
    return 'Manevra sonrası tekrar testi yapılmamış: muayenede pozisyon testini tekrarlayın; 2–3 doğru manevraya yanıt yoksa sevk düşünün.';
  }
  if (last?.vertigo) {
    return completed.length >= 3
      ? `${completed.length} manevraya karşın tekrar testi hâlâ pozitif: kanalı ve tarafı (yatay kanal, kupulolitiazis) yeniden değerlendirin; yanıtsızlık sürerse ileri değerlendirmeye yönlendirin.`
      : 'Tekrar testi hâlâ pozitif: tanıyı (taraf ve kanal) muayenede doğrulayıp manevrayı tekrarlayın.';
  }
  if (last && last.kind === 'morning') return 'Sabah testi negatif, düzelmiş görünüyor: muayenede test de negatifse tedaviyi sonlandırabilirsiniz.';
  if (last) return 'Yalnız 1. saat tekrar testi negatif: muayenede pozisyon testini tekrarlayıp düzelmeyi doğrulayın.';
  if (eps.some((e) => e.sideTests.some((t) => t.decision.kind === 'NOT_TRIGGERED')) && completed.length === 0) {
    return 'Evde test baş dönmesi başlatmadı: muayenede testi tekrarlayın; negatifse BPPV dışı nedenleri düşünün.';
  }
  return 'Ev kaydını muayene bulgusuyla karşılaştırın: pozisyon testini tekrarlayın.';
}
