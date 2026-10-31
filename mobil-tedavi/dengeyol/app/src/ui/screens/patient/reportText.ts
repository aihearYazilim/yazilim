/**
 * Hasta atak raporunun metinleri (ekran raporu ve hekime gönderilen düz metin aynı kaynaktan).
 * İç kodlar (endNote, StopReason, kırmızı bayrak kimliği) burada Türkçe cümleye çevrilir; ham kod rapora yazılmaz.
 */
import { type Prescription, rxCode, rxIssuedAt, rxLastValidDay, rxValidAt, rxValidityLabel, rxValidUntil } from '../../../core/prescription';
import { wrapDeg } from '../../../core/geometry';
import { capitalizeTr, type ProtocolId, PROTOCOLS, resolveProtocol, type Side, sideName, type StepDef } from '../../../core/protocols';
import { recordStats, STOP_REASON_TEXT, type StepRecord, type StopReason, vertigoSummary, stopReasonTextFor } from '../../../core/runner';
import { clampDose, DEFAULT_DOSE, type DoseLimits, localDayKey, RED_FLAGS, type SideDecision } from '../../../core/safety';
import { formatDate, formatDateTimeYear, lastEpisodeOutcome, TREATMENT_WINDOW_DAYS } from '../../../state/episodes';
import type { AppData, Episode, EpisodeStatus, ManeuverLog, PatientProfile, Settings } from '../../../state/types';
import { consentLine } from './consent';

export const STATUS_LABEL: Record<EpisodeStatus, string> = {
  active: 'Şu anki atak (sürüyor)',
  resolved: 'Düzeldi',
  referred: 'Hekime yönlendirildi',
  emergency: 'Acil yönlendirme',
  closed: 'Kapatıldı'
};

/** Yönlendirme/kapanış kodlarının rapordaki kısa karşılığı. */
const CODE_TEXT: Record<string, string> = {
  ATYPICAL_LONG: 'baş dönmesi bir dakikadan uzun sürdü ya da bitişi işaretlenmedi (tipik arka kanal BPPV\'ye uymuyor)',
  BOTH_SIDES: 'iki tarafa yatınca da baş dönmesi oldu (yatay kanal ya da iki taraflı BPPV olabilir)',
  SIDE_CONFLICT: 'baş dönmesi hekimin belirlediği taraftan farklı tarafta tetiklendi',
  INCOMPLETE: 'taraf testi tamamlanmadı',
  VERTIGO_TOO_LONG: 'manevrada baş dönmesi 2 dakikadan uzun sürdü ya da bitişi işaretlenmedi; güvenlik nedeniyle durduruldu',
  USER_FEELS_UNWELL: 'hasta kendini iyi hissetmedi',
  USER_ABORT: 'hasta manevrayı yarıda bıraktı',
  INTERRUPTED: 'uygulamadan çıkıldı',
  POSITION_UNREACHABLE: 'manevranın bir pozisyonuna gelinemedi (baş yeterince sarkamadı ya da çevrilemedi); zorlamadan hekime yönlendirildi'
};

/** Atağın kapanış notunu (endNote) Türkçe cümleye çevirir. */
export function endNoteText(note: string): string {
  const n = note.trim();
  if (!n) return '';
  if (n in CODE_TEXT) return CODE_TEXT[n]!;
  // Kırmızı bayrak kimlikleri virgülle birleştirilmiş olarak saklanır ("ear" ya da "ear, fever").
  const parts = n.split(/\s*,\s*/);
  if (parts.every((x) => /^[a-z][a-zA-Z0-9_]*$/.test(x))) {
    const texts = parts.map((id) => RED_FLAGS.find((q) => q.id === id)?.text);
    const known = texts.filter((t): t is string => !!t);
    if (known.length === 0) return 'güvenlik sorularından birine verilen yanıt';
    return `güvenlik sorusu yanıtı: ${known.map((t) => `"${t}"`).join(' · ')}`;
  }
  // Bilinmeyen büyük harfli iç kod: ham kod yazılmaz.
  if (/^[A-Z][A-Z0-9_]+$/.test(n)) return 'uygulamanın güvenlik kuralı gereği';
  return n;
}

export function stopReasonText(r: string | null, records: readonly StepRecord[] = []): string {
  // Yanlış tarafta kalındığı için durdurulduysa gerekçe bu olur (stopReasonTextFor, k02).
  return r && r in STOP_REASON_TEXT ? stopReasonTextFor(r as StopReason, records) : 'yarıda bırakıldı';
}

/** Adımdaki baş dönmesi: pozisyona gelişe göre gecikme ve süre (vertigoSummary). Yoksa null. */
export function symptomText(r: StepRecord): string | null {
  const vs = vertigoSummary(r);
  if (!vs) return null;
  const n = r.vertigoMarks.length;
  const dur = vs.durationSec === null ? 'bitişi işaretlenmedi' : `süre ${vs.durationSec} s`;
  return `baş dönmesi: gecikme ${vs.latencySec} s (pozisyona gelişten), ${dur}${n > 1 ? ` · ${n} kez işaretlendi, en uzunu` : ''}`;
}

// ---------------------------------------------------------------------------------------------
// "Pozisyona gelinemedi": nerede durulduğu ve ulaşılan en iyi açı (kullanıcı turu 3, k07, k02)
// ---------------------------------------------------------------------------------------------

/** Arama sırasında ulaşılan en iyi açı (yürütücü kaydı; F1 `StepRecord.reach`). Eski kayıtlarda yok. */
type Reach = { phi: number | null; theta: number | null };

function readReach(r: StepRecord): Reach | null {
  const reach = r.reach;
  if (!reach || (reach.phi === null && reach.theta === null)) return null;
  return reach;
}

/**
 * Gelinemeyen adımda ulaşılan en iyi açının kısa metni: "baş en çok ~8° geriye sarkabildi (hedef 15–40°)",
 * "dönüş hedefe ~25° uzak kaldı (izin ±10°)". Kayıtta açı yoksa ya da adım bilinmiyorsa null.
 * Yanlış tarafta kalınarak durdurulan adımda (`wrongSideStop`) dönüş uzaklığı yazılmaz (kullanıcı turu 4, k02): yanlış
 * taraftan (örneğin yüzüstünden geçilerek) gelinen açı kabul edilmediği için "~90° uzak kaldı" yanıltıcıdır.
 */
export function reachText(r: StepRecord, step: StepDef | undefined): string | null {
  const reach = readReach(r);
  if (!reach || !step || step.target.kind !== 'lying') return null;
  const t = step.target;
  const parts: string[] = [];
  if (reach.phi !== null) {
    const phi = Math.round(reach.phi);
    if (t.phiMin > 0) {
      // Sarkık baş adımı: asıl ölçü geriye sarkma.
      parts.push(
        phi < t.phiMin
          ? `baş en çok ~${phi}° geriye sarkabildi (hedef ${t.phiMin}–${t.phiMax}°)`
          : `baş ~${phi}° geriye sarktı (hedef ${t.phiMin}–${t.phiMax}°)`
      );
    } else if (phi < t.phiMin || phi > t.phiMax) {
      parts.push(`baş eğimi ~${phi}° (hedef ${t.phiMin}–${t.phiMax}°)`);
    }
  }
  if (reach.theta !== null && !r.wrongSideStop) {
    const err = Math.round(Math.abs(wrapDeg(reach.theta - t.theta)));
    if (err > t.thetaTol) parts.push(`dönüş hedefe en yakın ~${err}° uzak kaldı (izin ±${t.thetaTol}°)`);
  }
  return parts.length ? parts.join(', ') : null;
}

/** Kaydın protokoldeki adım tanımı (taraf aynalanmış). Bulunamazsa undefined. */
export function stepDefFor(protocolId: ProtocolId, side: Side | null, stepId: string): StepDef | undefined {
  try {
    return resolveProtocol(protocolId, side).steps.find((s) => s.id === stepId);
  } catch {
    return undefined;
  }
}

/** Gelinemeyen adımın kaydı (adım kaydında `unreachable`); yoksa null. */
function unreachableRecord(records: StepRecord[]): StepRecord | null {
  return [...records].reverse().find((r) => r.unreachable) ?? null;
}

/**
 * "Pozisyona gelinemedi" durdurmasının ayrıntı cümlesi. Taraf testi ya da tekrar testi durdurulduğunda
 * `Episode.stopDetail` buradan doldurulur (test kayıtları manevra gibi saklanmaz); manevrada rapor kayıttan çıkarır.
 * Ör.: 'Sağ taraf testi, "Sırtüstü, baş sağa 45° ve sarkık" adımı: baş en çok ~8° geriye sarkabildi (hedef 15–40°);
 * 60 s içinde gelinemedi'.
 */
export function unreachableStopDetail(
  kind: 'side-test' | 'retest' | 'maneuver',
  protocolId: ProtocolId,
  side: Side | null,
  records: StepRecord[]
): string {
  const where =
    kind === 'side-test'
      ? `${side ? capitalizeTr(sideName(side)) + ' taraf' : 'Taraf'} testi`
      : kind === 'retest'
        ? `Tekrar testi${side ? ` (${sideName(side)})` : ''}`
        : `${PROTOCOLS[protocolId].shortName}${side ? ` ${sideName(side)}` : ''} manevrası`;
  const r = unreachableRecord(records) ?? records[records.length - 1] ?? null;
  if (!r) return `${where} (adım kaydı yok)`;
  const step = stepDefFor(protocolId, side, r.stepId);
  const idx = records.indexOf(r);
  const parts = [`${where}, ${kind === 'maneuver' && idx >= 0 ? `${idx + 1}. adım ` : ''}"${r.title}"${kind === 'maneuver' ? '' : ' adımı'}`];
  const details: string[] = [];
  if (r.wrongSide) details.push('önce yanlış tarafa dönüldü, doğru yana gelinemedi');
  if (r.wrongSideStop) details.push('yanlış taraftan geçilerek gelinen açı kabul edilmez');
  const reach = reachText(r, step);
  if (reach) details.push(reach);
  else if (!r.wrongSide) details.push('ulaşılan açı kaydedilmedi');
  if (r.endedAt !== null && r.endedAt >= r.startedAt) details.push(`${Math.round((r.endedAt - r.startedAt) / 1000)} s içinde gelinemedi`);
  return `${parts[0]}: ${details.join('; ')}`;
}

/** Atakta "pozisyona gelinemedi" ile durdurulan manevra (son), yoksa null. */
function unreachableManeuver(e: Episode): ManeuverLog | null {
  return [...e.maneuvers].reverse().find((m) => m.stopReason === 'POSITION_UNREACHABLE') ?? null;
}

/**
 * Raporun "Durulan yer" satırı: yalnız "pozisyona gelinemedi" ile kapanan atakta. Önce kayıttaki açıklama
 * (stopDetail, taraf/tekrar testi), sonra manevra kaydı; ikisi de yoksa nerede olduğu bilinen kadarı yazılır.
 */
export function stopWhereText(e: Episode): string | null {
  if (e.endNote !== 'POSITION_UNREACHABLE') return null;
  if (e.stopDetail) return e.stopDetail;
  const m = unreachableManeuver(e);
  if (m) return unreachableStopDetail('maneuver', m.protocolId, m.side, m.records);
  return e.maneuvers.length === 0
    ? 'taraf testi sırasında (adım ve ulaşılan açı kaydedilmedi)'
    : 'test sırasında (taraf ya da tekrar testi; adım ve ulaşılan açı kaydedilmedi)';
}

/**
 * Atağın kapanış nedeni: endNoteText; ancak gelinemeyen adımda hasta önce yanlış tarafa döndüyse gerekçe bu olur
 * (k02: "baş sarkamadı" değil, "yanlış tarafa döndürüldü, doğru yana getirilemedi").
 */
export function episodeEndNoteText(e: Episode): string {
  if (!e.endNote) return '';
  if (e.endNote === 'POSITION_UNREACHABLE') {
    const m = unreachableManeuver(e);
    const r = m ? unreachableRecord(m.records) : null;
    if (r?.wrongSideStop || (e.stopDetail && /yanlış tarafa/.test(e.stopDetail))) {
      return 'hasta yanlış tarafa döndü (döndürüldü) ve doğru yana getirilemedi; zorlamadan hekime yönlendirildi';
    }
  }
  return endNoteText(e.endNote);
}

/** "Manevra" satırı: hiç manevra yapılmadıysa planlanan manevra olduğu açıkça yazılır (k07). */
export function maneuverHeadText(e: Episode): string {
  const name = PROTOCOLS[e.protocolId].shortName;
  return e.maneuvers.length > 0 ? name : `yapılmadı (planlanan: ${name})`;
}

/** Adımın tek satırlık özeti (başlık hariç). Adım tanımı verilirse gelinemeyen adımda ulaşılan en iyi açı da yazılır. */
export function stepSummary(r: StepRecord, step?: StepDef): string {
  const st = recordStats(r);
  const parts = [`${Math.round(r.holdSec)} s`];
  if (st.inRangePct !== null) parts.push(`hedefte %${st.inRangePct}`);
  if (st.meanAbsThetaErr !== null) parts.push(`sapma ort. ${st.meanAbsThetaErr}° / en çok ${st.maxAbsThetaErr}°`);
  if (st.meanPhi !== null) parts.push(`sarkma ort. ${st.meanPhi}°`);
  if (r.manual) parts.push('elle onaylandı');
  if (r.unreachable) {
    const reach = reachText(r, step);
    parts.push(reach ? `POZİSYONA GELİNEMEDİ (${reach})` : 'POZİSYONA GELİNEMEDİ');
  }
  if (r.endedEarly) parts.push('süre dolmadan geçildi');
  if (r.slowTransition && r.transitionSec != null) parts.push(`yavaş geçiş ${Math.round(r.transitionSec * 10) / 10} s`);
  if (r.movedBeforeCommand) parts.push('komuttan önce hareket edildi');
  if (r.noSitThrough) parts.push('oturuştan geçilmedi');
  if (r.wrongSide) parts.push('önce yanlış tarafa dönüldü');
  if (r.borderline) parts.push('hedefin sınırında tutuldu');
  parts.push(symptomText(r) ?? 'baş dönmesi işaretlenmedi');
  return parts.join(' · ');
}

/**
 * Reçete kodu (klinisyenin raporu ve HBYS notundaki kodla aynı): içe aktarılan bağlantı saklandıysa ondan, yoksa
 * reçeteden yeniden kodlanarak. Reçete yoksa null.
 */
export function profileRxCode(p: Pick<PatientProfile, 'prescription' | 'prescriptionToken'> | undefined): string | null {
  if (!p?.prescription) return null;
  const code = rxCode(p.prescriptionToken ?? p.prescription);
  return code || rxCode(p.prescription) || null;
}

/** Rapor başı: "Hasta kodu X · reçete 30 Ekim 2026 · reçete kodu 1a2b3c4d · Dr. Y, Kurum". Reçete yoksa null. */
export function rxHeaderLine(rx: Prescription | undefined, code: string | null = rx ? rxCode(rx) : null): string | null {
  if (!rx) return null;
  const parts: string[] = [];
  if (rx.pid) parts.push(`Hasta kodu ${rx.pid}`);
  const issued = rxIssuedAt(rx);
  parts.push(`reçete ${issued !== null ? formatDate(issued) : rx.date}`);
  if (code) parts.push(`reçete kodu ${code}`);
  const who = [rx.by, rx.clinic].filter(Boolean).join(', ');
  if (who) parts.push(who);
  return parts.join(' · ');
}

/** "12 Kasım 2026 tarihine kadar (dahil) geçerli" (+ " · süresi doldu"). Tarih okunamazsa null. */
export function rxValidityText(rx: Prescription, now: number): string | null {
  const label = rxValidityLabel(rx);
  const until = rxValidUntil(rx);
  if (!label || until === null) return null;
  return `${label} geçerli${now >= until ? ' · süresi doldu' : ''}`;
}

const DX_WHEN_TEXT: Record<NonNullable<PatientProfile['dxWhen']>, string> = {
  recent: 'son 2 hafta içinde',
  older: '2 haftadan önce',
  date: ''
};

export function priorDiagnosisText(p: PatientProfile | undefined): string {
  if (p?.prescription) {
    const rx = p.prescription;
    return `Reçete: ${sideName(rx.side)} arka kanal, ${PROTOCOLS[rx.maneuver].shortName}, günde en çok ${rx.perDay}, ${rx.days} gün`;
  }
  if (p?.diagnosedByDoctor) {
    const canal = p.canal === 'PC' ? 'arka kanal' : p.canal === 'HC' ? 'yatay kanal' : 'kanal bilinmiyor';
    const side = p.side === 'R' ? 'sağ' : p.side === 'L' ? 'sol' : 'taraf bilinmiyor';
    const when = p.dxDate
      ? `, tanı tarihi ${p.dxDate}`
      : p.dxWhen && DX_WHEN_TEXT[p.dxWhen]
        ? `, tanı ${DX_WHEN_TEXT[p.dxWhen]}${p.dxWhen === 'recent' && p.dxWhenAt ? ` (${formatDate(p.dxWhenAt)} tarihli beyan)` : ''}`
        : '';
    return `Hekim tanısı (hastanın beyanı: ${canal}, ${side}${when})`;
  }
  return '—';
}

/** Raporun kaynağı: herhangi bir manevrayı yakını yaptırdıysa "yakını eşliğinde". */
export function reportOriginText(e: Episode): string {
  return e.maneuvers.some((m) => m.assisted === true)
    ? 'Hastanın telefonunda, yakını eşliğinde oluşturuldu'
    : 'Hastanın kendi kullanımıyla oluşturuldu';
}

/**
 * Reçeteli kısa yol (taraf testi yapmadan reçete tarafına manevra) bu atakta kullanıldı mı? Kayıtta (Episode.rxShortcut)
 * varsa o; yoksa kayıtlardan çıkarılır: atak başında reçete geçerliydi, taraf testi yok ve manevra reçete tarafına yapıldı.
 * Reçete atak başında geçerli değilse ya da karar verilemiyorsa null (rapora yazılmaz).
 */
export function rxShortcutUsed(e: Episode, p: PatientProfile | undefined): boolean | null {
  const rx = p?.prescription;
  if (!rx || !rxValidAt(rx, e.startedAt)) return typeof e.rxShortcut === 'boolean' ? e.rxShortcut : null;
  if (typeof e.rxShortcut === 'boolean') return e.rxShortcut;
  if (e.sideTests.length > 0) return false;
  if (e.maneuvers.length === 0) return null;
  return e.maneuvers.every((m) => m.side === rx.side);
}

export function rxShortcutText(used: boolean): string {
  return used
    ? 'evet (hasta "muayeneden beri hiç geçmedi" dedi; taraf testi yapılmadan reçete tarafına manevra)'
    : 'hayır (taraf testi yapıldı)';
}

/** Doza sayılan manevra: tamamlanmış ya da en az bir pozisyon adımına geçilmiş (state/episodes.ts ile aynı kural). */
function counted(m: ManeuverLog): boolean {
  return m.completed || m.records.length > 1;
}

/**
 * Tedavi dönemi doz özeti: atak başında reçete geçerliyse reçete dönemi (muayene günü → son geçerli gün), değilse son 14 gün.
 * Tüm ataklar ve deneme manevraları birlikte sayılır (doz sınırı da böyle sayar).
 * Ör.: "Reçete dönemi (30 Ekim 2026 – 12 Kasım 2026): 4/15 manevra, 2/5 gün (günde en çok 3; 1 deneme dahil)".
 */
export function doseSummaryText(e: Episode, d: AppData, now: number): string {
  return doseSummaryAt(e.startedAt, Math.min(now, e.endedAt ?? now), d);
}

/** Doz özeti: `at` anında reçete geçerliyse reçete dönemi, değilse `end`'e kadar son 14 gün (doseSummaryText). */
function doseSummaryAt(at: number, end: number, d: AppData): string {
  const rx = d.patient?.prescription;
  let from: number;
  let to: number;
  let label: string;
  let limits: DoseLimits;
  const rxFrom = rx ? rxIssuedAt(rx) : null;
  const rxTo = rx ? rxValidUntil(rx) : null;
  const rxLast = rx ? rxLastValidDay(rx) : null;
  if (rx && rxFrom !== null && rxTo !== null && rxLast && rxValidAt(rx, at)) {
    from = rxFrom;
    to = Math.min(end, rxTo - 1);
    label = `Reçete dönemi (${formatDate(rxFrom)} – ${formatDate(rxLast.getTime())})`;
    limits = clampDose({ maxPerDay: rx.perDay, maxDays: rx.days });
  } else {
    to = end;
    from = end - TREATMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    label = `Son ${TREATMENT_WINDOW_DAYS} gün`;
    limits = DEFAULT_DOSE;
  }
  const inRange = (t: number) => t >= from && t <= to;
  const times = d.episodes.flatMap((x) => x.maneuvers.filter(counted).map((m) => m.at)).filter(inRange);
  const practice = (d.practiceLog ?? []).filter(inRange);
  const all = [...times, ...practice];
  const days = new Set(all.map(localDayKey)).size;
  return `${label}: ${all.length}/${limits.maxTotal} manevra, ${days}/${limits.maxDays} gün (günde en çok ${limits.maxPerDay}${practice.length ? `; ${practice.length} deneme dahil` : ''})`;
}

/** Manevradaki duraklatma sayısı: manevra kaydında yoksa adım kayıtlarındaki duraklatmaların toplamı. */
export function maneuverPauses(m: ManeuverLog): number {
  if (typeof m.pauses === 'number') return m.pauses;
  return m.records.reduce((s, r) => s + (r.pauses ?? 0), 0);
}

export function decisionText(d: SideDecision): string {
  switch (d.kind) {
    case 'TREAT':
      return `${sideName(d.side)} tarafa manevra`;
    case 'NOT_TRIGGERED':
      return 'baş dönmesi gelmedi';
    case 'ASK_STRONGER':
      return 'hangi tarafın daha şiddetli olduğu soruldu';
    case 'REFER':
      return `hekime yönlendirildi: ${endNoteText(d.reason)}`;
  }
}

/** Manevra rozetleri (yardımcı, duraklatma, sonrası). */
export function maneuverTags(m: ManeuverLog): string[] {
  const tags: string[] = [];
  if (m.assisted === true) tags.push('yakını yaptırdı');
  else if (m.assisted === false) tags.push('kendi başına');
  if (m.manual) tags.push('sensörsüz');
  const pauses = maneuverPauses(m);
  if (pauses > 0) tags.push(`${pauses} kez duraklatıldı`);
  if (m.afterSymptoms) {
    tags.push(
      m.afterSymptoms === 'none'
        ? 'sonrası: iyi'
        : m.afterSymptoms === 'mild'
          ? 'sonrası: hafif belirti'
          : m.afterSymptoms === 'neuro'
            ? 'sonrası: yeni nörolojik belirti'
            : 'sonrası: şiddetli belirti'
    );
  }
  return tags;
}

/**
 * Manevra kayıtlarında yardım bilgisi yoksa (eski kayıt) şu anki ayar, açıkça "şu anki ayar" diye etiketlenerek gösterilir.
 * Kayıtta bilgi varsa ya da kişi kendi başına kullanıyorsa null.
 */
export function assistFallbackText(e: Episode, s: Settings): string | null {
  if (e.maneuvers.length === 0 || e.maneuvers.some((m) => m.assisted !== undefined)) return null;
  return s.assist === 'helper' ? 'yakını yaptırıyor (uygulamanın şu anki ayarı; manevra anındaki kayıt yok)' : null;
}

export function retestText(r: Episode['retests'][number]): string {
  const kind = r.kind === 'early' ? 'erken (1. saat)' : r.kind === 'morning' ? 'sabah' : 'diğer';
  const res = r.vertigo ? `baş dönmesi var (gecikme ${r.latencySec ?? '?'} s, süre ${r.durationSec ?? '?'} s)` : 'baş dönmesi gelmedi';
  return `${formatDateTimeYear(r.at)} — ${kind}, ${sideName(r.side)}: ${res}`;
}

export function sideCellText(t: Episode['sideTests'][number], s: 'R' | 'L'): string {
  const r = t.results.find((x) => x.side === s);
  if (!r) return 'yapılmadı';
  if (r.safetyStopped) return 'durduruldu (baş dönmesi 2 dakikadan uzun)';
  return r.vertigo ? `baş dönmesi, gecikme ${r.latencySec ?? '?'} s, süre ${r.durationSec ?? '?'} s` : 'baş dönmesi yok';
}


/** Atak satırları (Durum, durulan yer, taraf, manevra…); dönem raporunda ortak satırlar (tanı, doz, onam) bir kez yazılır. */
function episodeHeadLines(e: Episode, d: AppData, now: number, inPeriod: boolean): string[] {
  const p = d.patient;
  const L: string[] = [];
  L.push(`Atak başlangıcı: ${formatDateTimeYear(e.startedAt)}`);
  const note = episodeEndNoteText(e);
  L.push(`Durum: ${STATUS_LABEL[e.status]}${note ? ` — ${note}` : ''}`);
  const where = stopWhereText(e);
  if (where) L.push(`Durulan yer: ${where}`);
  L.push(`Tedavi edilen taraf: ${e.side ? sideName(e.side) : '—'}`);
  L.push(`Manevra: ${maneuverHeadText(e)}`);
  if (!inPeriod) L.push(`Önceki tanı: ${priorDiagnosisText(p)}`);
  const sc = rxShortcutUsed(e, p);
  if (sc !== null) L.push(`Reçeteli kısa yol: ${rxShortcutText(sc)}`);
  if (!inPeriod) L.push(`Doz: ${doseSummaryText(e, d, now)}`);
  if (e.sideConflictNote) L.push(`Taraf uyuşmazlığı: ${e.sideConflictNote}`);
  if (!inPeriod) {
    const cl = consentLine(p);
    if (cl) L.push(`Onam: ${cl}`);
  }
  const af = assistFallbackText(e, d.settings);
  if (af) L.push(`Manevrayı yaptıran: ${af}`);
  return L;
}

/** Atağın bölümleri: güvenlik soruları, taraf testleri, manevralar (adım adım), tekrar testleri. */
function episodeSectionLines(e: Episode): string[] {
  const L: string[] = [];
  if (e.redFlags.length > 0) {
    L.push('', 'GÜVENLİK SORULARI');
    for (const r of e.redFlags) {
      const pos = RED_FLAGS.filter((q) => r.answers[q.id] === q.stopsOn);
      L.push(`- ${formatDateTimeYear(r.at)}: ${pos.length === 0 ? 'tümü güvenli yanıtlandı' : 'DURDURULDU — ' + pos.map((q) => q.text).join(' | ')}`);
    }
  }
  if (e.sideTests.length > 0) {
    L.push('', 'TARAF TESTLERİ (belirtiyle Dix-Hallpike)');
    for (const t of e.sideTests) {
      L.push(`- ${formatDateTimeYear(t.at)}: Sağ: ${sideCellText(t, 'R')}; Sol: ${sideCellText(t, 'L')}. Karar: ${decisionText(t.decision)}`);
    }
  }
  if (e.maneuvers.length > 0) {
    L.push('', 'MANEVRALAR');
    e.maneuvers.forEach((m, i) => {
      const status = m.completed ? 'tamamlandı' : stopReasonText(m.stopReason, m.records);
      const tags = maneuverTags(m);
      L.push(
        `${i + 1}) ${formatDateTimeYear(m.at)} — ${PROTOCOLS[m.protocolId].shortName}${m.side ? ' ' + sideName(m.side) : ''} — ${status}${tags.length ? ' · ' + tags.join(' · ') : ''}`
      );
      for (const r of m.records) L.push(`   • ${r.title}: ${stepSummary(r, stepDefFor(m.protocolId, m.side, r.stepId))}`);
    });
  }
  if (e.retests.length > 0) {
    L.push('', 'TEKRAR TESTLERİ');
    for (const r of e.retests) L.push(`- ${retestText(r)}`);
  }
  return L;
}

/** Hekime gönderilen düz metin rapor (WhatsApp/e-posta: sekme ve tablo yok, satır satır okunur). */
export function reportPlainText(e: Episode, d: AppData, now: number = Date.now()): string {
  const p = d.patient;
  const L: string[] = [];
  L.push('DengeYol — BPPV atak raporu');
  const head = rxHeaderLine(p?.prescription, profileRxCode(p));
  if (head) L.push(head);
  if (p?.prescription) {
    const v = rxValidityText(p.prescription, now);
    if (v) L.push(`Reçete geçerliliği: ${v}`);
  }
  L.push(`(${reportOriginText(e)}; tanı belgesi değildir. Oluşturma: ${formatDateTimeYear(now)})`);
  L.push('');
  L.push(...episodeHeadLines(e, d, now, false));
  L.push(...episodeSectionLines(e));
  return L.join('\n');
}

// ---------------------------------------------------------------------------------------------
// Dönem raporu (kullanıcı turu 3, k09): reçete dönemindeki (yoksa son 14 gün) bütün ataklar tek raporda
// ---------------------------------------------------------------------------------------------

/** Dönem raporunun adresi (reçete bitimi kartı ve geçmiş listesi buraya açar). */
export const PERIOD_REPORT_PATH = '/hasta/rapor/donem';

export interface ReportPeriod {
  from: number;
  /** "Reçete dönemi (30 Ekim 2026 – 12 Kasım 2026)" ya da "Son 14 gün (17 Ekim 2026 – 31 Ekim 2026)". */
  label: string;
}

/**
 * Dönem: reçete varsa (geçerli ya da süresi dolmuş, son reçete) reçete tarihinden bugüne; yoksa son 14 gün.
 * Reçete dönemi bittikten sonraki ataklar da dahil edilir (hekim reçeteden sonra olan her şeyi görsün).
 */
export function reportPeriod(d: AppData, now: number): ReportPeriod {
  const rx = d.patient?.prescription;
  const rxFrom = rx ? rxIssuedAt(rx) : null;
  const rxLast = rx ? rxLastValidDay(rx) : null;
  if (rx && rxFrom !== null && rxLast) {
    const after = now > rxLast.getTime() + 24 * 60 * 60 * 1000 ? ` ve sonrası, ${formatDate(now)} tarihine kadar` : '';
    return { from: rxFrom, label: `Reçete dönemi (${formatDate(rxFrom)} – ${formatDate(rxLast.getTime())}${after})` };
  }
  const from = now - TREATMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return { from, label: `Son ${TREATMENT_WINDOW_DAYS} gün (${formatDate(from)} – ${formatDate(now)})` };
}

/** Dönemdeki ataklar (dönem içinde başlayan ya da dönem başında sürmekte olan), eskiden yeniye. */
export function periodEpisodes(d: AppData, now: number, period: ReportPeriod = reportPeriod(d, now)): Episode[] {
  return d.episodes
    .filter((e) => e.startedAt >= period.from || (e.endedAt ?? now) >= period.from)
    .sort((a, b) => a.startedAt - b.startedAt);
}

/**
 * Dönemin son atağının sonucu, satırın başı (kullanıcı turu 4, k09): "Son atak (25 Ekim): hekime yönlendirildi — <neden>".
 * Yönlendirmede neden de yazılır (hekim bir bakışta görsün). Atak yoksa null.
 */
export function periodLastOutcomeText(eps: readonly Episode[]): string | null {
  const lead = lastEpisodeOutcome(eps);
  if (!lead) return null;
  const last = [...eps].sort((a, b) => a.startedAt - b.startedAt)[eps.length - 1]!;
  const note = last.status === 'referred' || last.status === 'emergency' ? endNoteShortText(last) : '';
  return capitalizeTr(`${lead}${note ? ` — ${note}` : ''}`);
}

/**
 * Kapanış nedeninin kısa hâli (satır başında): güvenlik sorusunda sorunun kısa adı, diğerlerinde cümlenin ilk bölümü
 * (";" sonrası, örneğin "zorlamadan hekime yönlendirildi", zaten sonuçta yazılı).
 */
function endNoteShortText(e: Episode): string {
  const n = e.endNote?.trim() ?? '';
  const ids = n.split(/\s*,\s*/);
  const flags = ids.map((id) => RED_FLAGS.find((q) => q.id === id));
  if (n && flags.every((q) => q)) return `güvenlik sorusu: ${flags.map((q) => q!.label).join(', ')}`;
  return episodeEndNoteText(e).split(';')[0]!.trim();
}

/** Dönemin sayıları: "2 atak · 4 manevra · son sabah testi negatif" (+ yönlendirme sayısı). */
export function periodCountsLine(eps: readonly Episode[]): string {
  if (eps.length === 0) return 'Bu dönemde kayıtlı atak yok';
  const parts: string[] = [`${eps.length} atak`];
  const mans = eps.flatMap((e) => e.maneuvers.filter(counted));
  const done = mans.filter((m) => m.completed).length;
  parts.push(`${mans.length} manevra${done < mans.length ? ` (${done} tamamlandı)` : ''}`);
  const retests = eps.flatMap((e) => e.retests).sort((a, b) => a.at - b.at);
  const morning = retests.filter((r) => r.kind === 'morning');
  const last = morning[morning.length - 1] ?? retests[retests.length - 1];
  if (last) {
    const kind = last.kind === 'morning' ? 'sabah testi' : last.kind === 'early' ? 'tekrar testi (1. saat)' : 'tekrar testi';
    parts.push(`son ${kind} ${last.vertigo ? 'pozitif (baş dönmesi var)' : 'negatif'}`);
  } else {
    parts.push('tekrar testi yok');
  }
  const referred = eps.filter((e) => e.status === 'referred' || e.status === 'emergency').length;
  if (referred > 0) parts.push(`${referred} hekime yönlendirme`);
  return parts.join(' · ');
}

/**
 * Dönemin tek satırlık sonucu: önce son atağın sonucu, sonra sayılar (kullanıcı turu 4, k09): "Son atak (25 Ekim): hekime
 * yönlendirildi — … · 2 atak · 4 manevra · son sabah testi negatif · 1 hekime yönlendirme".
 */
export function periodSummaryLine(eps: readonly Episode[]): string {
  return [periodLastOutcomeText(eps), periodCountsLine(eps)].filter(Boolean).join(' · ');
}

/** Dönem raporunun doz satırı: dönemin son atağının (yoksa bugünün) dozu. */
export function periodDoseText(d: AppData, now: number, eps: Episode[] = periodEpisodes(d, now)): string {
  const last = eps[eps.length - 1];
  return last ? doseSummaryText(last, d, now) : doseSummaryAt(now, now, d);
}

/** Dönem raporunun kaynağı: herhangi bir manevrayı yakını yaptırdıysa "yakını eşliğinde". */
function periodOriginText(eps: Episode[]): string {
  return eps.some((e) => e.maneuvers.some((m) => m.assisted === true))
    ? 'Hastanın telefonunda, yakını eşliğinde oluşturuldu'
    : 'Hastanın kendi kullanımıyla oluşturuldu';
}

/** Hekime gönderilen dönem raporu (düz metin; atak raporuyla aynı satırlar, ataklar sırayla). */
export function periodReportPlainText(d: AppData, now: number = Date.now()): string {
  const p = d.patient;
  const period = reportPeriod(d, now);
  const eps = periodEpisodes(d, now, period);
  const L: string[] = [];
  L.push('DengeYol — BPPV dönem raporu');
  const head = rxHeaderLine(p?.prescription, profileRxCode(p));
  if (head) L.push(head);
  if (p?.prescription) {
    const v = rxValidityText(p.prescription, now);
    if (v) L.push(`Reçete geçerliliği: ${v}`);
  }
  L.push(`(${periodOriginText(eps)}; tanı belgesi değildir. Oluşturma: ${formatDateTimeYear(now)})`);
  L.push('');
  L.push(`Sonuç: ${periodSummaryLine(eps)}`);
  L.push(`Dönem: ${period.label}`);
  L.push(`Önceki tanı: ${priorDiagnosisText(p)}`);
  L.push(`Doz: ${periodDoseText(d, now, eps)}`);
  const cl = consentLine(p);
  if (cl) L.push(`Onam: ${cl}`);
  eps.forEach((e, i) => {
    L.push('', `=== ${i + 1}. ATAK (${formatDateTimeYear(e.startedAt)}) ===`);
    L.push(...episodeHeadLines(e, d, now, true));
    L.push(...episodeSectionLines(e));
  });
  return L.join('\n');
}
