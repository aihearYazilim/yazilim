/**
 * Atak (episode) iş kuralları — saf fonksiyonlar.
 *
 * Yeniden tasarım (BRIEF §1): doz/gün sınırı, hekime yönlendirme ve taraf çelişkisi artık engel değildir. Buradaki işlevler
 * durumu yine bildirir (uyarı metni için); çağıran "Yine de devam et" sunar ve aşmayı `logOverride` ile kaydeder
 * (state/overrides.ts). Kayıt açıklamaları: `doseOverrideDetail`, `sideConflictOverrideDetail`, `referralOverrideDetail`.
 */
import { dxIsRecent } from './dxTiming';
import type { Side } from '../core/protocols';
import {
  clampDose,
  DEFAULT_DOSE,
  DOSE_OVERRIDE_DETAIL,
  DOSE_TEXT,
  type DoseLimits,
  doseStatus,
  localDayKey,
  type DoseStatus,
  RED_FLAGS,
  type RedFlagQuestion
} from '../core/safety';
import type { StepRecord } from '../core/runner';
import type { AppData, Episode, EpisodeStatus, ManeuverLog, PatientProfile, Settings } from './types';

/**
 * Erken tekrar testi için manevradan sonra beklenecek süre (ms): 1 saat. Yayımlanmış manevra çalışmalarında erken
 * değerlendirme 1. saatte yapılmıştır (Kim HJ 2023; Mandalà 2012; Kim JS 2012; Callejas Pastor 2023).
 */
export const EARLY_RETEST_MS = 60 * 60 * 1000;
/** Kırmızı bayraklar bu süreden eskiyse yeniden sorulur (ms). */
export const REDFLAG_VALID_MS = 6 * 60 * 60 * 1000;
/** Sabah testi en erken saat. */
export const MORNING_HOUR = 6;

// Reçete geçerliliğinin tek tanımı core/prescription.ts'tedir (RX_VALID_DAYS, rxValidAt, rxValidityLabel): D tarihli
// reçete D+13 gününün sonuna kadar (dahil) geçerlidir. Sabit buradan da dışa aktarılır (eski içe aktarmalar bozulmasın).
import { fnv1a, rxIssuedAt, rxValidAt, rxValidUntil } from '../core/prescription';
export { RX_VALID_DAYS } from '../core/prescription';

/**
 * Reçete bu atak için hâlâ geçerli mi? D tarihli reçete D günü 00:00'dan D+13 gününün sonuna kadar (yerel saat) geçerlidir;
 * D+14 günü 00:00'da biter. Gelecek tarihli reçete geçerli sayılmaz.
 */
export function rxActive(profile: PatientProfile | undefined, now: number = Date.now()): boolean {
  const rx = profile?.prescription;
  return !!rx && rxValidAt(rx, now);
}

/**
 * Yakın zamanda bilinen taraf (yalnız geçerli klinisyen reçetesi): taraf testiyle çelişirse hekime yönlendirmek için.
 * Hastanın kendi girdiği tanı tarihi/tarafı burada kullanılmaz (doğrulanamaz; iki taraf pozitifken tedaviye izin vermesin);
 * o beyan yalnız daha sıkı yönde, `dxSideCheck` ile çelişki yönlendirmesi/uyarısı için kullanılır.
 */
export function recentKnownSide(profile: PatientProfile | undefined, now: number = Date.now()): Side | null {
  return profile && rxActive(profile, now) ? profile.prescription!.side : null;
}

/**
 * Hastanın kurulumda girdiği hekim tanısı bu kadar gün içindeyse, testle çelişen taraf reçetedeki gibi hekime yönlendirir;
 * daha eskiyse (nükste taraf değişebilir; Kim HJ ve ark. JAMA Neurol 2023) uyarılır ve rapora not düşülür.
 */
export const DX_SIDE_RECENT_DAYS = 14;

/**
 * Taraf çelişkisi. 'refer': yakın tarihli (ya da tarihi bilinmeyen) tanıyla çelişki — güçlü uyarı, hekime danışma önerilir;
 * 'warn': eski tanıyla çelişki — kısa uyarı. İkisi de engel değildir: kullanıcı "Test tarafına devam" ya da "Hekimin
 * dediği tarafa devam" seçer (aşma `logOverride('SIDE_CONFLICT', sideConflictOverrideDetail(…))`).
 */
export type DxSideCheck = { kind: 'ok' } | { kind: 'refer'; dxSide: Side; note: string } | { kind: 'warn'; dxSide: Side; note: string };

/**
 * Taraf testinin bulduğu taraf, hastanın beyan ettiği hekim tanısındaki tarafla çelişiyor mu? Geçerli reçete varsa bu
 * denetim yapılmaz (reçete tarafı `interpretSideTests` içinde zaten SIDE_CONFLICT üretir). Beyan doğrulanamadığı için
 * yalnız daha sıkı yönde kullanılır: yönlendirme ya da uyarı ekler, hiçbir zaman testsiz manevraya izin vermez.
 * Tanı tarihi girilmemişse tanı yakın tarihli sayılır (kullanıcı turu 2, k03: bugün tanı alan kişi tarihi boş bırakıp
 * hekiminin söylediğinin tersine manevraya gitmesin); yalnız kurulumda açıkça "daha önce" (dxWhen 'older') seçildiyse uyarılır.
 */
export function dxSideCheck(profile: PatientProfile | undefined, testedSide: Side, now: number = Date.now()): DxSideCheck {
  if (!profile || !profile.diagnosedByDoctor || profile.side === 'unknown' || profile.side === testedSide) return { kind: 'ok' };
  if (rxActive(profile, now)) return { kind: 'ok' };
  const dxSide = profile.side;
  const dated = !!profile.dxDate && Number.isFinite(new Date(`${profile.dxDate}T00:00:00`).getTime());
  // Kurulumdaki tanı zamanı seçimiyle aynı kural (belirsizlikte yakın tarihli sayılır → yönlendirme).
  const recent = dxIsRecent(profile, now, DX_SIDE_RECENT_DAYS);
  const name = (s: Side) => (s === 'R' ? 'sağ' : 'sol');
  const when = dated
    ? ` (${profile.dxDate})`
    : profile.dxWhen === 'older'
      ? ' (2 haftadan eski)'
      : profile.dxWhen === 'recent'
        ? ' (son 2 hafta içinde, tarih girilmemiş)'
        : ' (tarih girilmemiş)';
  if (recent) {
    const why = dated || profile.dxWhen === 'recent' ? 'Yakın tarihli tanıyla' : 'Tanı tarihi bilinmediği için yakın tarihli sayılan tanıyla';
    return {
      kind: 'refer',
      dxSide,
      note: `Hekim tanısı${when}: ${name(dxSide)}; taraf testi: ${name(testedSide)}. ${why} çelişiyor; hastaya hekime danışması önerildi.`
    };
  }
  return {
    kind: 'warn',
    dxSide,
    note: `Hekim tanısı${when}: ${name(dxSide)}; bu atakta taraf testi: ${name(testedSide)}. Tanı ${DX_SIDE_RECENT_DAYS} günden eski olduğu için hasta uyarıldı; manevra test tarafı için önerildi.`
  };
}

/** Taraf çelişkisinde kullanıcının seçimi için araştırma kaydı açıklaması ("Hekim: sağ, test: sol; test tarafına devam"). */
export function sideConflictOverrideDetail(dxSide: Side, testedSide: Side, chosen: Side): string {
  const name = (s: Side) => (s === 'R' ? 'sağ' : 'sol');
  return `Hekim: ${name(dxSide)}, test: ${name(testedSide)}; ${chosen === testedSide ? 'test tarafına' : 'hekimin dediği tarafa'} (${name(chosen)}) devam`;
}

/** Eski tanıyla taraf çelişkisinde geçiş ekranının kısa uyarısı (ayrıntı rapora yazılır). */
export function dxWarnText(dxSide: Side, testedSide: Side): string {
  const name = (s: Side) => (s === 'R' ? 'sağ' : 'sol');
  return `Hekiminiz ${name(dxSide)} demişti, test ${name(testedSide)} gösterdi. Manevra yapmak istemiyorsanız telefonu alıp köşedeki Bitir'i basılı tutun.`;
}

/**
 * Reçeteli kısa yol (taraf testi yapmadan reçetedeki tarafa manevra) yalnız reçetenin verildiği atak içindir: reçete
 * geçerliyken ve reçete tarihinden sonra başlayıp kapanmış başka bir atak yokken. Sonraki atak (nüks) test edilir.
 */
export function rxFirstEpisode(d: AppData, now: number = Date.now()): boolean {
  const p = d.patient;
  if (!p?.prescription || !rxActive(p, now)) return false;
  const issued = new Date(`${p.prescription.date}T00:00:00`).getTime();
  return !d.episodes.some((e) => e.status !== 'active' && e.startedAt >= issued);
}

export function doseLimitsFor(profile: PatientProfile | undefined, now: number = Date.now()): DoseLimits {
  if (profile?.prescription && rxActive(profile, now)) {
    return clampDose({ maxPerDay: profile.prescription.perDay, maxDays: profile.prescription.days });
  }
  return DEFAULT_DOSE;
}

/** Sayılan manevra: tamamlanmış ya da en az bir pozisyon adımına geçilmiş (yarıda bırakılsa da baş hareketi yapılmış). */
function countedTimes(episodes: Episode[]): number[] {
  return episodes.flatMap((e) => e.maneuvers.filter((m) => m.completed || m.records.length > 1).map((m) => m.at));
}

/**
 * Tedavi dönemi (gün): doz sınırları bu kayan pencerede, TÜM ataklar ve deneme manevraları birlikte sayılır. Böylece atak
 * kapatılıp yeniden açılarak sınır aşılamaz (ör. günde 3 × her gün). Pencereden önceki manevralar yeni bir atağı kısıtlamaz.
 */
export const TREATMENT_WINDOW_DAYS = 14;

/**
 * Doz durumu: günlük sınır takvim gününe; toplam sınır ve "manevra yapılan gün" sınırı son 14 günlük tedavi dönemine göre;
 * ayrıca bu atağın başlangıcından itibaren gün sınırı.
 */
export function episodeDose(
  e: Episode,
  profile: PatientProfile | undefined,
  now: number,
  allEpisodes: Episode[] = [e],
  extraTimes: number[] = []
): DoseStatus {
  const limits = doseLimitsFor(profile, now);
  const windowMs = TREATMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const eps = allEpisodes.some((x) => x.id === e.id) ? allEpisodes : [...allEpisodes, e];
  const times = [...countedTimes(eps), ...extraTimes].filter((t) => now - t < windowMs && t <= now);
  const st = doseStatus(times, e.startedAt, now, limits);
  if (!st.allowed) return st;
  // Manevradan sonra kusma bildirildiyse ertesi sabaha dek manevra önerilmez; bu doz sınırı değildir (yeni kullanıcı turu 1,
  // L5-1; y07: uyarı "sayı doldu" diyor, kayda DOSE:DAILY_LIMIT yazılıyordu): `vomitPause`.
  // Tedavi döneminde manevra yapılan farklı gün sayısı (bugün yeni bir gün olacaksa o da sayılır).
  const days = new Set(times.map(localDayKey));
  const daysUsed = days.size + (days.has(localDayKey(now)) ? 0 : 1);
  if (daysUsed > limits.maxDays) return { allowed: false, reason: 'DAY_LIMIT', day: st.day };
  return st;
}

/**
 * Bugünkü manevraların ana ekrandaki sayımı (M1-8; y07: kötü hissedip durdurulan ve yarıda kalan manevralar "2 / 3"
 * diye tamamlanmış gibi görünüyordu): tamamlanan ve yarıda kalan (en az bir pozisyon adımına geçilmiş) ayrı. Önerilen
 * sınır (doseFor) yarıda kalanları da sayar; ekranda bu açıkça yazılır. Deneme manevraları sayılmaz.
 */
export function todayManeuverCounts(episodes: Episode[], now: number): { completed: number; partial: number } {
  const today = localDayKey(now);
  let completed = 0;
  let partial = 0;
  for (const e of episodes) {
    for (const m of e.maneuvers) {
      if (m.at > now || localDayKey(m.at) !== today) continue;
      if (m.completed) completed += 1;
      else if (m.records.length > 1) partial += 1;
    }
  }
  return { completed, partial };
}

/** Uygulama verisiyle doz: tüm ataklar ve deneme manevraları. */
export function doseFor(d: AppData, e: Episode, now: number): DoseStatus {
  return episodeDose(e, d.patient, now, d.episodes, d.practiceLog ?? []);
}

/**
 * Şu an yeni bir manevra yapılabilir mi (aktif atak varsa ona, bugün manevrayla kapatılmış ve yeniden açılacak atak varsa
 * ona, yoksa şimdi açılacak bir atağa göre)? Ana ekran ve atak
 * başı bunu güvenlik sorularından önce gösterir: sınır doluyken soru sordurup sonra "sınır" denmez.
 */
export function startDose(d: AppData, now: number): DoseStatus {
  // Bugün manevrayla kapatılmış atak "Baş dönmem başladı" ile yeniden açılır: sınır o atağa göre (kullanıcı turu 2, k06).
  const ep = d.episodes.find((e) => e.status === 'active') ?? sameDayReopenable(d, now) ?? undefined;
  const probe: Episode = ep ?? {
    id: '__probe',
    startedAt: now,
    side: null,
    protocolId: 'epley',
    redFlags: [],
    sideTests: [],
    maneuvers: [],
    retests: [],
    status: 'active'
  };
  return doseFor(d, probe, now);
}

/**
 * Sınır doluyken bir sonraki manevranın en erken zamanı (sabah 06:00'ya yuvarlanmış). Aktif atağın kendi gün sınırı
 * dolduysa ya da 16 gün içinde izin çıkmıyorsa null (hekime başvurulmalı).
 */
export function doseNextAllowedAt(d: AppData, now: number): number | null {
  const ep = d.episodes.find((e) => e.status === 'active');
  const base = new Date(now);
  for (let k = 0; k <= 16; k++) {
    const t = new Date(base.getFullYear(), base.getMonth(), base.getDate() + k, MORNING_HOUR, 0, 0, 0).getTime();
    if (t <= now) continue;
    // Aktif atak varsa ona göre; yoksa o gün açılacak yeni bir atak.
    const st = ep ? doseFor(d, ep, t) : startDose(d, t);
    if (st.allowed) return t;
  }
  return null;
}

/**
 * Doz uyarısı metni: neden, günlük sınırda önerilen sonraki zaman ve acil uyarısı. Engel değildir: yanında "Yine de devam
 * et" sunulur.
 */
export function doseLimitText(ds: Extract<DoseStatus, { allowed: false }>, d: AppData, now: number): string {
  const next = ds.reason === 'DAILY_LIMIT' ? doseNextAllowedAt(d, now) : null;
  return `${DOSE_TEXT[ds.reason]}${next ? ` Önerilen sonraki manevra: ${formatDateTime(next)}.` : ''} Acil belirtilerde 112'yi arayın.`;
}

/** Doz uyarısı aşıldığında araştırma kaydı açıklaması ("günlük manevra sınırı doluydu (2. gün)"). */
export function doseOverrideDetail(ds: Extract<DoseStatus, { allowed: false }>): string {
  return `${DOSE_OVERRIDE_DETAIL[ds.reason]} (${ds.day}. gün)`;
}

/**
 * Bugün manevrayla (tamamlanmış) kapatılmış atak: "Baş dönmem başladı" yeni atak açmaz, bu atak yeniden açılır ve 1 saatlik
 * tekrar testi korunur (kapat-aç ile tekrar testi atlanıp art arda manevra yapılmasın; sık tekrar sayımı şişmesin).
 */
export function sameDayReopenable(d: AppData, now: number): Episode | null {
  if (d.episodes.some((e) => e.status === 'active')) return null;
  const ended = d.episodes.filter((e) => e.endedAt).sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0));
  const last = ended[0];
  if (!last || (last.status !== 'closed' && last.status !== 'resolved')) return null;
  const today = localDayKey(now);
  return last.maneuvers.some((m) => m.completed && localDayKey(m.at) === today) ? last : null;
}

export function reopenEpisode(d: AppData, id: string): AppData {
  return {
    ...d,
    episodes: d.episodes.map((e) => (e.id === id ? { ...e, status: 'active' as const, endedAt: undefined, endNote: undefined } : e))
  };
}

/**
 * Sık nüks uyarısı: son 30 günde ≥3 ya da son 6 ayda ≥4 atak. Birbirine 24 saatten yakın başlayan ataklar tek atak sayılır
 * (aynı gün kapatılıp yeniden açılan ataklar sayımı şişirmesin). Uyarı yoksa null.
 */
export function recurrenceWarning(episodeStarts: number[], now: number): { last30: number; last180: number; text: string } | null {
  const dayMs = 24 * 60 * 60 * 1000;
  const starts = episodeStarts.filter((t) => t <= now && now - t <= 180 * dayMs).sort((a, b) => a - b);
  const distinct: number[] = [];
  for (const t of starts) {
    const prev = distinct[distinct.length - 1];
    if (prev === undefined || t - prev >= dayMs) distinct.push(t);
  }
  const last30 = distinct.filter((t) => now - t <= 30 * dayMs).length;
  const last180 = distinct.length;
  if (last30 < 3 && last180 < 4) return null;
  const span = last30 >= 3 ? `Son 30 günde ${last30}` : `Son 6 ayda ${last180}`;
  return {
    last30,
    last180,
    text: `${span} atak yaşadınız. Sık tekrarlayan kristal oynamasında (BPPV) hekiminizle görüşün; hekiminiz nedeni araştırabilir, D vitamini düzeyinize de bakabilir.`
  };
}

export const PRACTICE_PER_DAY = 2;

/**
 * Bu kadar süre hiçbir işlem yapılmamış aktif atak eski sayılır ve kendiliğinden kapanır: haftalar sonra gelen yeni bir
 * baş dönmesi eski atağın tekrar testine/gün sınırı uyarısına takılmasın. Doz sayımı ataktan bağımsızdır; hekime
 * yönlendirme bilgisi de etkilenmez (yalnız "active" ataklar kapanır).
 */
export const STALE_EPISODE_MS = 72 * 60 * 60 * 1000;

export function lastActivity(e: Episode): number {
  return Math.max(
    e.startedAt,
    ...e.maneuvers.map((m) => m.at),
    ...e.retests.map((r) => r.at),
    ...e.sideTests.map((t) => t.at),
    ...e.redFlags.map((r) => r.at)
  );
}

export function closeStaleEpisodes(d: AppData, now: number): AppData {
  const stale = d.episodes.some((e) => e.status === 'active' && now - lastActivity(e) > STALE_EPISODE_MS);
  if (!stale) return d;
  return {
    ...d,
    episodes: d.episodes.map((e) =>
      e.status === 'active' && now - lastActivity(e) > STALE_EPISODE_MS
        ? { ...e, status: 'closed', endedAt: lastActivity(e), endNote: '3 günden uzun süre işlem yapılmadı; kendiliğinden kapandı' }
        : e
    )
  };
}

export function practiceAllowed(d: AppData, now: number): boolean {
  const k = localDayKey(now);
  return (d.practiceLog ?? []).filter((t) => localDayKey(t) === k).length < PRACTICE_PER_DAY;
}

/**
 * Son kapanan atak hekime/acile yönlendirmeyle bittiyse ve hasta sonrasında ne "hekimimle görüştüm" dedi ne de "Yine de
 * başlat" ile devam etti: ana ekranda bilgi satırı gösterilir. Kilit değildir; yeni atak her zaman başlatılabilir.
 */
export function pendingReferral(d: AppData): Episode | null {
  const ended = d.episodes.filter((e) => e.status !== 'active' && e.endedAt).sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0));
  const last = ended[0];
  if (!last || (last.status !== 'referred' && last.status !== 'emergency')) return null;
  const cleared = d.patient?.doctorClearedAt;
  if (cleared && cleared > (last.endedAt ?? 0)) return null;
  if (referralOverridden(last)) return null;
  return last;
}

/** Araştırma kaydı kodu: hekime yönlendirmeden sonra yeni atak başlatıldı (kayıt yönlendirilen atağa yazılır). */
export const REFERRAL_OVERRIDE_KIND = 'REFERRAL';

/** Yönlendirilen atağın kaydında, kapandıktan sonra "yine de başlat" (REFERRAL) var mı? */
export function referralOverridden(e: Episode): boolean {
  return (e.overrides ?? []).some((o) => o.kind === REFERRAL_OVERRIDE_KIND && o.at >= (e.endedAt ?? 0));
}

/** Yönlendirmeden sonra yeni atak başlatılmasının kayıt açıklaması (durdurma nedeni varsa onunla). */
export function referralOverrideDetail(e: Episode): string {
  const flags = referralFlags(e);
  const why = flags.length ? `güvenlik sorusu: ${flags.map((q) => q.label).join(', ')}` : (e.endNote ?? (e.status === 'emergency' ? 'acile yönlendirme' : 'hekime yönlendirme'));
  return `Yönlendirmeden sonra yeni atak başlatıldı (${why})`;
}

/**
 * Atağı hekime/acile yönlendiren güvenlik soruları (son kırmızı bayrak kaydında durduran yanıtlar). Bilgi satırı hangi
 * yanıtla durdurulduğunu ve hekime sorulacak cümleyi bundan yazar. Başka nedenle (ör. uzun baş dönmesi) yönlendirildiyse boş.
 */
export function referralFlags(e: Episode): RedFlagQuestion[] {
  const last = e.redFlags[e.redFlags.length - 1];
  if (!last || !last.stopped) return [];
  return RED_FLAGS.filter((q) => last.answers[q.id] === q.stopsOn);
}

/** Alt tip yanıtları bu süre içinde aynı atakta yeniden sorulmaz (güvenlik sorularıyla aynı süre). */
export const SUBTYPE_VALID_MS = 6 * 60 * 60 * 1000;

/** Bu atakta alt tip soruları yakın zamanda yanıtlandı mı (yarıda bırakılıp devam edilen atakta yeniden sorulmasın)? */
export function subtypeRemembered(e: Episode | null | undefined, now: number): boolean {
  const s = e?.subtype;
  return !!s && now >= s.at && now - s.at <= SUBTYPE_VALID_MS;
}

/** Manevra kaydının duraklatma toplamı: yürütücü duraklatmaları adım kayıtlarına (`pauses`) yazar. */
export function totalPauses(records: StepRecord[]): number {
  return records.reduce((n, r) => n + (r.pauses ?? 0), 0);
}

/** Gece saati (22:00–06:00): hatırlatıcı bu saate düşerse "uyuyorsanız uyanınca yapın" denir. */
export function isNightTime(t: number): boolean {
  const h = new Date(t).getHours();
  return h >= 22 || h < MORNING_HOUR;
}

/** Test saati geceye düşüyorsa gösterilecek not; değilse null. */
export function nightNote(t: number): string | null {
  return isNightTime(t)
    ? `Test saati (${formatTime(t)}) gece. Uyanıksanız o saatte yapın; uyuyacaksanız alarm kurmanız gerekmez, uyanınca yapın.`
    : null;
}

export function needsRedFlags(e: Episode | null, now: number): boolean {
  if (!e) return true;
  const last = e.redFlags[e.redFlags.length - 1];
  // Uyarısı aşılan (continued) yanıt da bir sonraki girişte yeniden sorulur (eskiden `stopped: true` kalırdı; N1-8).
  return !last || last.stopped || !!last.continued || now - last.at > REDFLAG_VALID_MS;
}

export type NextAction =
  | { kind: 'early-retest'; at: number; ready: boolean }
  /** afterVomit: son manevradan sonra kusma bildirildi (o gün test ve manevra yok; L5-1). */
  | { kind: 'morning-retest'; at: number; ready: boolean; needsSideTest: boolean; afterVomit?: boolean }
  | { kind: 'treat-again' }
  | { kind: 'retry-side-test' }
  | { kind: 'resolved-suggest' }
  | { kind: 'none' };

/** t'den sonraki ilk sabah saati: gece yarısından sonra ve 06:00'dan önceyse aynı günün 06:00'sı. */
export function nextMorning(t: number): number {
  const d = new Date(t);
  const sameDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), MORNING_HOUR, 0, 0, 0);
  if (d.getHours() < MORNING_HOUR) return sameDay.getTime();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, MORNING_HOUR, 0, 0, 0).getTime();
}

/** Aktif atakta sıradaki önerilen eylem. */
export function nextAction(e: Episode, now: number): NextAction {
  const lastMan = [...e.maneuvers].reverse().find((m) => m.completed);
  const lastRetest = e.retests[e.retests.length - 1];
  if (!lastMan) {
    // Henüz manevra yok (ör. test tetiklemedi): ertesi sabah yeniden test.
    const lastTest = e.sideTests[e.sideTests.length - 1];
    if (lastTest && lastTest.decision.kind === 'NOT_TRIGGERED') {
      const at = nextMorning(lastTest.at);
      // Taraf henüz belirlenmedi → sabah iki yönlü taraf testi yapılır (tek taraflı tekrar testi değil).
      return { kind: 'morning-retest', at, ready: now >= at, needsSideTest: true };
    }
    return { kind: 'retry-side-test' };
  }
  const retestsAfter = e.retests.filter((r) => r.at > lastMan.at);
  // Kusma/şiddetli bulantı bildirildiyse o gün test ve manevra yok: ertesi sabah.
  if (retestsAfter.length === 0 && lastMan.afterSymptoms === 'severe') {
    const at = nextMorning(lastMan.at);
    return { kind: 'morning-retest', at, ready: now >= at, needsSideTest: false, afterVomit: true };
  }
  if (retestsAfter.length === 0) {
    const at = lastMan.at + EARLY_RETEST_MS;
    return { kind: 'early-retest', at, ready: now >= at };
  }
  if (lastRetest && lastRetest.vertigo) return { kind: 'treat-again' };
  // Son tekrar testi negatif
  const negativesAfter = retestsAfter.filter((r) => !r.vertigo);
  const morningNeg = negativesAfter.some((r) => r.kind === 'morning');
  if (morningNeg) return { kind: 'resolved-suggest' };
  const at = nextMorning(lastRetest!.at);
  return { kind: 'morning-retest', at, ready: now >= at, needsSideTest: false };
}

/**
 * Atağın son olayı, "Kendimi kötü hissediyorum" ile durdurulan bir test mi (kullanıcı turu 6, k01)? Durdurmadan sonra taraf
 * testi, manevra ya da tekrar testi kaydı yoksa o durdurma döner; ana ekran kartı "iyi hissettiğinizde yapın" der.
 */
export function lastUnwellTestStop(e: Episode): NonNullable<Episode['testStops']>[number] | null {
  const stops = e.testStops ?? [];
  const last = stops[stops.length - 1];
  if (!last) return null;
  const later = [...e.sideTests, ...e.maneuvers, ...e.retests].some((x) => x.at > last.at);
  return later ? null : last;
}

/** Testte "kötü hissediyorum" durdurmasından sonra ana ekrandaki atak kartında gösterilen satır (kullanıcı turu 6, k01). */
export const UNWELL_STOP_HOME_TEXT =
  'Son test, siz kötü hissettiğiniz için durdu. Kendinizi iyi hissettiğinizde yapın; geçmiyorsa hekiminize başvurun.';

// ---- Kötü an sonrası durum (yeni kullanıcı turu 1, L5; y07) -------------------------------------------------------------

/**
 * Manevradan sonra kusma ("Kusma ya da şiddetli bulantı") bildirildiyse manevra önerilmeyen dönem: ertesi sabah 06:00'ya
 * dek (`nextMorning`; gece yarısından sonra 06:00'dan önceyse aynı günün 06:00'sı). Ana ekrandaki sabah testi saati
 * (`nextAction`) ile aynı saat (y07: ana ekran 1 Kasım, uyarı 2 Kasım diyordu). Doz sınırı değildir: uyarı kusmayı söyler,
 * aşma `VOMITING` olarak yazılır (`DOSE:DAILY_LIMIT` değil). Bütün ataklar taranır (atak kapatılsa da geçerli).
 */
export function vomitPause(d: Pick<AppData, 'episodes'>, now: number): { at: number; until: number; episodeId: string } | null {
  let best: { at: number; until: number; episodeId: string } | null = null;
  for (const e of d.episodes) {
    for (const m of e.maneuvers) {
      if (m.afterSymptoms !== 'severe' || m.at > now) continue;
      const until = nextMorning(m.at);
      if (now < until && (!best || m.at > best.at)) best = { at: m.at, until, episodeId: e.id };
    }
  }
  return best;
}

/** Araştırma kaydı kodu: kusma bildirilen günde manevra uyarısı aşıldı. */
export const VOMITING_OVERRIDE_KIND = 'VOMITING';

/** Araştırma kaydı kodu: manevra sonrası yeni nörolojik belirtiden sonra "manevra önerilmiyor" uyarısı aşıldı (M1-5). */
export const NEURO_ALERT_OVERRIDE_KIND = 'NEURO_ALERT';

/**
 * Bilgi kaydı kodu: 112 dışı güvenlik sorusundaki işaret uyarı ekranında "Yanlış dokundum, listeye dön" ile geri alındı
 * (M1-4; y02). Yanıt kaydı silinir; rapor "düzeltildi" yazar (aşma sayılmaz).
 */
export const RED_FLAG_UNDO_KIND = 'RED_FLAG_UNDO';

/**
 * Atağın son "kötü anı" (L5-2; y07): "Kendimi kötü hissediyorum" ile durdurulan manevra ya da test, ya da uzun baş dönmesi
 * uyarısında "Durdur" ile biten manevra. Sonrasında taraf testi, manevra ya da tekrar testi yapıldıysa ya da kullanıcı
 * yeniden başlarken "Geçti" dediyse (`feelBetterAt`) null. Ana ekran not gösterir; akış yeniden başlarken "Geçti mi?" sorar.
 * Kusma burada değildir: onun ertesi sabaha dek kendi uyarısı var (`vomitPause`).
 */
export interface BadMoment {
  at: number;
  kind: 'unwell' | 'vertigoLong';
  what: 'maneuver' | 'side' | 'retest';
}

export function lastBadMoment(e: Episode): BadMoment | null {
  const cands: BadMoment[] = [
    ...(e.testStops ?? []).map((s) => ({ at: s.at, kind: 'unwell' as const, what: s.test })),
    ...e.maneuvers.flatMap((m): BadMoment[] =>
      m.completed
        ? []
        : m.stopReason === 'USER_FEELS_UNWELL'
          ? [{ at: m.at, kind: 'unwell', what: 'maneuver' }]
          : m.stopReason === 'VERTIGO_TOO_LONG'
            ? [{ at: m.at, kind: 'vertigoLong', what: 'maneuver' }]
            : []
    )
  ];
  const last = cands.sort((a, b) => a.at - b.at)[cands.length - 1];
  if (!last) return null;
  if ((e.feelBetterAt ?? 0) >= last.at) return null;
  const later = [...e.sideTests, ...e.maneuvers, ...e.retests].some((x) => x.at > last.at);
  return later ? null : last;
}

/** Kötü andan sonra ana ekrandaki atak kartında gösterilen not (L5-2). */
export function badMomentHomeText(b: BadMoment): string {
  if (b.kind === 'vertigoLong') {
    return "Son manevra, 2 dakikayı aşan baş dönmesi yüzünden durdu. Hekiminize danışmanız önerilir. Yeniden başlarken baş dönmesinin geçip geçmediğini soracağız. Acil belirtide 112'yi arayın.";
  }
  if (b.what !== 'maneuver') return UNWELL_STOP_HOME_TEXT;
  return 'Son manevra, siz kötü hissettiğiniz için durdu. Kendinizi iyi hissettiğinizde yeniden başlayın; geçmiyorsa hekiminize başvurun.';
}

/**
 * Bilinen hekim tanısı tarafı tek taraf testine yetiyor mu (L5-7; y02: "doktor sağ kulak dedi")? Yakın tarihli (ya da
 * tarihi girilmemiş; `dxIsRecent` ile aynı kural) arka kanal ya da kanalı bilinmeyen tanıda yalnız o taraf test edilir.
 * Eski tanıda (2 haftadan eski) nükste taraf değişebildiği için iki taraf test edilir; yatay kanal testi zaten iki yanı
 * tek koşuda dener.
 */
export function singleSideTestSide(profile: PatientProfile | undefined, now: number = Date.now()): Side | null {
  if (!profile?.diagnosedByDoctor || profile.side === 'unknown' || profile.canal === 'HC') return null;
  if (!dxIsRecent(profile, now, DX_SIDE_RECENT_DAYS)) return null;
  return profile.side;
}

/** Yarıda kalan test/manevraya bu süre içinde dönülürse kaldığı yerden sürer (L5-3; ms). */
export const RESUME_VALID_MS = 30 * 60 * 1000;

/**
 * Uygulamadan çıkılıp dönülünce kaldığı yer (L5-3; y07, y01): tamamlanmış birinci taraf testi (ikinci test kalır) ya da
 * yarıda kalan manevra (baştan yapılır; hazırlık ekranı yeniden gösterilmez). Yarıda kalan manevra, uygulama kapanınca
 * ara kayıttan kurulan (L3: `recoverInterruptedManeuvers`) ya da uygulamadan çıkılınca kesilen ('INTERRUPTED') son manevra
 * kaydıdır; ayrı kayıt tutulmaz. 30 dakikadan eskiyse ya da sonrasında başka bir iş varsa null.
 */
export type ResumeTarget =
  | { kind: 'side'; at: number; order: Side[]; results: NonNullable<Episode['sideProgress']>['results'] }
  /** step: yarıda kalınan adım (1'den; kayıttaki adım sayısı, en az 1). */
  | { kind: 'maneuver'; at: number; side: Side; protocolId: Episode['maneuvers'][number]['protocolId']; step: number };

export function resumeTarget(e: Episode | null | undefined, now: number): ResumeTarget | null {
  if (!e) return null;
  const fresh = (t: number) => t <= now && now - t <= RESUME_VALID_MS;
  // Yeni kullanıcı turu 3 (N1-4; y01): manevra sayfası doğrudan yenilenince akış, açılıştaki kurtarmadan
  // (`recoverInterruptedManeuvers`, App) önce kurulur; ara kayıt henüz manevra kaydına çevrilmemiştir. Ara kayıt da yarıda
  // kalan manevra sayılır (kurtarma aynı kaydı aynı zaman ve adımla yazar).
  const p0 = e.pendingManeuver;
  if (p0 && p0.side && p0.records.length > 0 && fresh(p0.at) && ![...e.sideTests, ...e.retests].some((x) => x.at > p0.at)) {
    return { kind: 'maneuver', at: p0.at, side: p0.side, protocolId: p0.protocolId, step: Math.max(1, p0.records.length) };
  }
  const last = [...e.maneuvers].sort((a, b) => a.at - b.at)[e.maneuvers.length - 1];
  if (last && !last.completed && last.stopReason === 'INTERRUPTED' && last.side && fresh(last.at)) {
    const later = [...e.sideTests, ...e.retests].some((x) => x.at > last.at);
    if (!later) return { kind: 'maneuver', at: last.at, side: last.side, protocolId: last.protocolId, step: Math.max(1, last.records.length) };
  }
  const p = e.sideProgress;
  if (p && fresh(p.at) && p.results.length > 0 && p.results.length < p.order.length && !e.sideTests.some((t) => t.at >= p.at)) {
    return { kind: 'side', at: p.at, order: p.order, results: p.results };
  }
  return null;
}

/**
 * Yeni atağı başlatmak yerine söylenecek bekleme durumu: aktif atakta manevra yapılmışsa "Baş dönmem başladı"/devam yeni
 * test ya da manevra açmaz; sıradaki eylem (1 saat ya da sabah testi, yeniden manevra) gösterilir. null: akış sürebilir.
 */
export function startBlockedByPlan(e: Episode | null, now: number): NextAction | null {
  if (!e || !e.maneuvers.some((m) => m.completed)) return null;
  const na = nextAction(e, now);
  return na.kind === 'retry-side-test' ? null : na;
}

/** Hangi taraf tedavi edilir? Reçete/profil tarafı ya da bu ataktaki test sonucu. */
export function episodeSide(e: Episode, profile: PatientProfile | undefined): Side | null {
  if (e.side) return e.side;
  if (profile?.prescription && rxActive(profile)) return profile.prescription.side;
  if (profile && profile.side !== 'unknown') return profile.side;
  return null;
}

export function formatTime(t: number): string {
  return new Date(t).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

/** Gün başında sıfır olmadan: "8 Kasım 14:05" (kullanıcı turu 5, k03; diğer tarih biçimleri de böyle). */
export function formatDateTime(t: number): string {
  return new Date(t).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

/** Yıllı tarih-saat (paylaşılan rapor: hekim ay sonra okuyabilir). */
export function formatDateTimeYear(t: number): string {
  return new Date(t).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatDate(t: number): string {
  return new Date(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ---- Güvenlik sorularının ilk okunuş kilidi (kullanıcı turu 3, k06) ------------------------------------------------------

/**
 * Soru metninin sürümü: ekrandaki metin, sesli biçim, açıklama ve yanıt etiketlerinin özeti. Metin değişince sürüm de
 * değişir ve soru bu cihazda "ilk kez soruluyor" sayılır.
 */
export function redFlagVersion(q: Pick<RedFlagQuestion, 'text' | 'spoken' | 'hint' | 'yesLabel' | 'noLabel'>): string {
  return fnv1a([q.text, q.spoken ?? '', q.hint ?? '', q.yesLabel ?? '', q.noLabel ?? ''].join('\u241e'));
}

/**
 * Soru okunurken uzun ilk okunuş kilidi gerekli mi? Yalnız bu cihazda hiç yanıtlanmamış ya da metni o günden beri değişmiş
 * soruda. Daha önce aynı metni yanıtlayan kişide yalnız kısa çift dokunuş kilidi kalır (o kilit her zaman uygulanır).
 */
export function firstReadLockNeeded(settings: Pick<Settings, 'answeredQuestions'>, q: RedFlagQuestion): boolean {
  return settings.answeredQuestions?.[q.id] !== redFlagVersion(q);
}

/** Yanıtlanan sorunun sürümünü cihaz ayarlarına yazar (yanıt ne olursa olsun). */
export function rememberAnswered(d: AppData, q: RedFlagQuestion): AppData {
  const v = redFlagVersion(q);
  if (d.settings.answeredQuestions?.[q.id] === v) return d;
  return { ...d, settings: { ...d.settings, answeredQuestions: { ...(d.settings.answeredQuestions ?? {}), [q.id]: v } } };
}

// ---- Reçete dönemi (kullanıcı turu 3, k09) ------------------------------------------------------------------------------

/**
 * Reçete döneminin (verildiği gün 00:00 ≤ başlangıç < geçerliliğin bittiği an) kapanmış atakları, eskiden yeniye. Reçete
 * yoksa ya da tarihi okunamıyorsa boş.
 */
export function rxPeriodEpisodes(d: AppData): Episode[] {
  const rx = d.patient?.prescription;
  if (!rx) return [];
  const from = rxIssuedAt(rx);
  const until = rxValidUntil(rx);
  if (from === null || until === null) return [];
  return d.episodes.filter((e) => e.startedAt >= from && e.startedAt < until && e.status !== 'active').sort((a, b) => a.startedAt - b.startedAt);
}

/** Atağın sonucunun kısa adı (dönem özetinin başı). */
export const EPISODE_OUTCOME: Record<EpisodeStatus, string> = {
  active: 'sürüyor',
  resolved: 'düzeldi',
  referred: 'hekime yönlendirildi',
  emergency: 'acile yönlendirildi',
  closed: 'kapatıldı'
};

/** Gün ve ay ("25 Ekim"): dönem içindeki tarih (yıl başlıkta). */
export function formatDayMonth(t: number): string {
  return new Date(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

/**
 * Dönemin son atağının sonucu: "son atak (25 Ekim): hekime yönlendirildi" (kullanıcı turu 4, k09). Dönem özeti bununla
 * başlar: dönemin son durumu yönlendirmeyse önce "son sabah testi negatif" okunup yanlış izlenim edinilmesin. Atak yoksa null.
 */
export function lastEpisodeOutcome(episodes: readonly Episode[]): string | null {
  const last = [...episodes].sort((a, b) => a.startedAt - b.startedAt)[episodes.length - 1];
  return last ? `son atak (${formatDayMonth(last.startedAt)}): ${EPISODE_OUTCOME[last.status]}` : null;
}

/**
 * Dönem raporunun başındaki tek satırlık sonuç: "son atak (25 Ekim): hekime yönlendirildi · 2 atak · 4 manevra · son
 * sabah testi negatif". Hekim bir bakışta görsün; ayrıntı raporda. Önce son atağın sonucu (kullanıcı turu 4, k09), sonra
 * sayılar; yönlendirmeyle biten atak varsa ayrıca söylenir.
 */
export function rxPeriodSummary(episodes: Episode[]): string {
  const lead = lastEpisodeOutcome(episodes);
  const maneuvers = episodes.reduce((n, e) => n + e.maneuvers.filter((m) => m.completed).length, 0);
  const halfDone = episodes.reduce((n, e) => n + e.maneuvers.filter((m) => !m.completed).length, 0);
  const parts = [`${episodes.length} atak`, `${maneuvers} manevra${halfDone ? ` (+${halfDone} yarım)` : ''}`];
  const retests = episodes.flatMap((e) => e.retests).sort((a, b) => a.at - b.at);
  const last = retests[retests.length - 1];
  if (last) {
    const name = last.kind === 'morning' ? 'sabah testi' : 'tekrar testi';
    parts.push(`son ${name} ${last.vertigo ? 'pozitif (baş dönmesi başladı)' : 'negatif'}`);
  } else if (maneuvers > 0) {
    parts.push('tekrar testi yapılmadı');
  }
  const referred = episodes.filter((e) => e.status === 'referred' || e.status === 'emergency').length;
  if (referred) parts.push(`${referred} atak hekime ya da acile yönlendirildi`);
  if (lead) parts.unshift(lead);
  return parts.join(' · ');
}

// ---- Araştırma kaydı: sürüm, demo damgası, yarıda kalan manevra (yeni kullanıcı turu 1, y04 #6, y01 #6) ------------------

import { APP_VERSION, DECISION_RULES_VERSION } from '../core/version';
export { APP_VERSION, DECISION_RULES_VERSION };

/** Yeni atağa yazılacak damga: uygulama ve kural sürümü, demo modundaysa `simulation: true`. */
export function episodeStamp(settings: Pick<Settings, 'simulation'>): Pick<Episode, 'appVersion' | 'rulesVersion' | 'simulation'> {
  return { appVersion: APP_VERSION, rulesVersion: DECISION_RULES_VERSION, ...(settings.simulation ? { simulation: true } : {}) };
}

/** Sürüm metni: "DengeYol 0.1.0 · karar kuralları k1"; sürüm bilinmiyorsa (eski kayıt) null. */
export function versionText(appVersion: string | undefined, rulesVersion: string | undefined): string | null {
  if (!appVersion && !rulesVersion) return null;
  return [appVersion ? `DengeYol ${appVersion}` : null, rulesVersion ? `karar kuralları ${rulesVersion}` : null].filter(Boolean).join(' · ');
}

/**
 * Süren manevranın ara kaydını aktif atağa yazar (yürütücü her adım başında bildirir). Aktif atak yoksa veri değişmez.
 * Aynı manevranın sonraki adımlarında ilk yazılış zamanı korunur.
 */
export function saveManeuverCheckpoint(
  d: AppData,
  cp: { protocolId: Episode['protocolId']; side: Side | null; records: StepRecord[]; assisted?: boolean; manual?: boolean },
  now: number
): AppData {
  const ep = d.episodes.find((e) => e.status === 'active');
  if (!ep) return d;
  const prev = ep.pendingManeuver;
  const at = prev && prev.protocolId === cp.protocolId && prev.side === cp.side && prev.records.length <= cp.records.length ? prev.at : now;
  return { ...d, episodes: d.episodes.map((e) => (e.id === ep.id ? { ...e, pendingManeuver: { at, ...cp } } : e)) };
}

/**
 * Manevradan sonra sorulan belirti şiddetini (0–10) atağın en son manevrasına yazar (yeni kullanıcı turu 3, N1-8; y04: iki
 * manevralı atakta atak başına tek `vas.after` ikinci yanıtla eziliyordu). Manevra yoksa atak aynen döner.
 */
export function withLastManeuverVas(e: Episode, v: number): Episode {
  if (e.maneuvers.length === 0) return e;
  const i = e.maneuvers.reduce((best, m, j) => (m.at >= e.maneuvers[best]!.at ? j : best), 0);
  return { ...e, maneuvers: e.maneuvers.map((m, j) => (j === i ? { ...m, vasAfter: v } : m)) };
}

/** Ara kaydı silinmiş atak (manevra olağan biçimde kaydedilince). */
export function withoutCheckpoint(e: Episode): Episode {
  if (!e.pendingManeuver) return e;
  const rest = { ...e };
  delete rest.pendingManeuver;
  return rest;
}

/**
 * Açılışta: ara kaydı kalmış (manevra sürerken uygulama kapanmış) ataklara "yarıda kaldı" manevra kaydı yazılır. Kayıt
 * ara kayıttaki adımları taşır (`records.length` yarıda kalınan adım), stopReason 'INTERRUPTED', `recovered: true`. Doz
 * sayımı olağan kurala uyar (bir pozisyon adımına geçildiyse sayılır). Ara kaydı olmayan veri aynen döner.
 */
export function recoverInterruptedManeuvers(d: AppData, newId: () => string): AppData {
  if (!d.episodes.some((e) => e.pendingManeuver)) return d;
  return {
    ...d,
    episodes: d.episodes.map((e) => {
      const p = e.pendingManeuver;
      if (!p) return e;
      const rest = withoutCheckpoint(e);
      if (p.records.length === 0) return rest;
      const log: ManeuverLog = {
        id: newId(),
        at: p.at,
        protocolId: p.protocolId,
        side: p.side,
        completed: false,
        stopReason: 'INTERRUPTED',
        records: p.records,
        manual: !!p.manual,
        ...(p.assisted !== undefined ? { assisted: p.assisted } : {}),
        pauses: totalPauses(p.records),
        recovered: true
      };
      const maneuvers = [...e.maneuvers, log].sort((a, b) => a.at - b.at);
      return { ...rest, maneuvers, protocolId: p.protocolId, ...(p.side && !e.side ? { side: p.side } : {}) };
    })
  };
}
