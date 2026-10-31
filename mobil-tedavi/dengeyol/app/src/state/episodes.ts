/**
 * Atak (episode) iş kuralları — saf fonksiyonlar.
 */
import type { Side } from '../core/protocols';
import { clampDose, DEFAULT_DOSE, DOSE_TEXT, type DoseLimits, doseStatus, localDayKey, type DoseStatus } from '../core/safety';
import type { AppData, Episode, PatientProfile } from './types';

/**
 * Erken tekrar testi için manevradan sonra beklenecek süre (ms): 1 saat. Yayımlanmış manevra çalışmalarında erken
 * değerlendirme 1. saatte yapılmıştır (Kim HJ 2023; Mandalà 2012; Kim JS 2012; Callejas Pastor 2023).
 */
export const EARLY_RETEST_MS = 60 * 60 * 1000;
/** Kırmızı bayraklar bu süreden eskiyse yeniden sorulur (ms). */
export const REDFLAG_VALID_MS = 6 * 60 * 60 * 1000;
/** Sabah testi en erken saat. */
export const MORNING_HOUR = 6;

/**
 * Reçetenin geçerlilik süresi (muayene tarihinden itibaren gün). Reçete o muayenedeki atak içindir: nükste BPPV tipi ve
 * tarafı sıklıkla değişir (Kim HJ ve ark. JAMA Neurol 2023;80:244–250: nükslerin %56'sı ilk tanıdan farklı). Süre dolunca
 * varsayılan doz ve her atakta iki taraflı test uygulanır. Değer klinik danışmanla gözden geçirilmelidir.
 */
export const RX_VALID_DAYS = 14;

/** Reçete bu atak için hâlâ geçerli mi? */
export function rxActive(profile: PatientProfile | undefined, now: number = Date.now()): boolean {
  const rx = profile?.prescription;
  if (!rx) return false;
  const issued = new Date(`${rx.date}T00:00:00`).getTime();
  if (!Number.isFinite(issued)) return false;
  // Gelecek tarihli reçete geçerli sayılmaz (en çok 1 gün saat farkı payı).
  if (issued - now > 24 * 60 * 60 * 1000) return false;
  return now - issued <= RX_VALID_DAYS * 24 * 60 * 60 * 1000;
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

export type DxSideCheck = { kind: 'ok' } | { kind: 'refer'; note: string } | { kind: 'warn'; dxSide: Side; note: string };

/**
 * Taraf testinin bulduğu taraf, hastanın beyan ettiği hekim tanısındaki tarafla çelişiyor mu? Geçerli reçete varsa bu
 * denetim yapılmaz (reçete tarafı `interpretSideTests` içinde zaten SIDE_CONFLICT üretir). Beyan doğrulanamadığı için
 * yalnız daha sıkı yönde kullanılır: yönlendirme ya da uyarı ekler, hiçbir zaman testsiz manevraya izin vermez.
 */
export function dxSideCheck(profile: PatientProfile | undefined, testedSide: Side, now: number = Date.now()): DxSideCheck {
  if (!profile || !profile.diagnosedByDoctor || profile.side === 'unknown' || profile.side === testedSide) return { kind: 'ok' };
  if (rxActive(profile, now)) return { kind: 'ok' };
  const dxSide = profile.side;
  const t = profile.dxDate ? new Date(`${profile.dxDate}T00:00:00`).getTime() : NaN;
  const dayMs = 24 * 60 * 60 * 1000;
  const recent = Number.isFinite(t) && t - now <= dayMs && now - t <= DX_SIDE_RECENT_DAYS * dayMs;
  const name = (s: Side) => (s === 'R' ? 'sağ' : 'sol');
  const when = profile.dxDate ? ` (${profile.dxDate})` : ' (tarih girilmemiş)';
  if (recent) {
    return { kind: 'refer', note: `Hekim tanısı${when}: ${name(dxSide)}; taraf testi: ${name(testedSide)}. Yakın tarihli tanıyla çeliştiği için manevra yapılmadı, hekime yönlendirildi.` };
  }
  return {
    kind: 'warn',
    dxSide,
    note: `Hekim tanısı${when}: ${name(dxSide)}; bu atakta taraf testi: ${name(testedSide)}. Tanı ${DX_SIDE_RECENT_DAYS} günden eski olduğu için hasta uyarıldı; manevra test tarafı için önerildi.`
  };
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
  // Bugün manevradan sonra kusma/şiddetli bulantı bildirildiyse bugün başka manevra yok.
  const today = localDayKey(now);
  if (eps.some((x) => x.maneuvers.some((m) => m.afterSymptoms === 'severe' && localDayKey(m.at) === today))) {
    return { allowed: false, reason: 'DAILY_LIMIT', day: st.day };
  }
  // Tedavi döneminde manevra yapılan farklı gün sayısı (bugün yeni bir gün olacaksa o da sayılır).
  const days = new Set(times.map(localDayKey));
  const daysUsed = days.size + (days.has(localDayKey(now)) ? 0 : 1);
  if (daysUsed > limits.maxDays) return { allowed: false, reason: 'DAY_LIMIT', day: st.day };
  return st;
}

/** Uygulama verisiyle doz: tüm ataklar ve deneme manevraları. */
export function doseFor(d: AppData, e: Episode, now: number): DoseStatus {
  return episodeDose(e, d.patient, now, d.episodes, d.practiceLog ?? []);
}

/**
 * Şu an yeni bir manevra yapılabilir mi (aktif atak varsa ona, yoksa şimdi açılacak bir atağa göre)? Ana ekran ve atak
 * başı bunu güvenlik sorularından önce gösterir: sınır doluyken soru sordurup sonra "sınır" denmez.
 */
export function startDose(d: AppData, now: number): DoseStatus {
  const ep = d.episodes.find((e) => e.status === 'active');
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

/** Doz sınırı metni: neden, günlük sınırda bir sonraki izinli zaman ve acil uyarısı. */
export function doseLimitText(ds: Extract<DoseStatus, { allowed: false }>, d: AppData, now: number): string {
  const next = ds.reason === 'DAILY_LIMIT' ? doseNextAllowedAt(d, now) : null;
  return `${DOSE_TEXT[ds.reason]}${next ? ` Bir sonraki manevra en erken ${formatDateTime(next)}.` : ''} Acil belirtilerde 112'yi arayın.`;
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
 * baş dönmesi eski atağın tekrar testine/gün sınırına takılmasın. Doz sınırları ataktan bağımsız sayıldığı için güvenlik
 * gevşemez; hekime yönlendirme kilidi de etkilenmez (yalnız "active" ataklar kapanır).
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
 * Son kapanan atak hekime/acile yönlendirmeyle bittiyse ve hasta sonrasında "hekimimle görüştüm" onayı vermediyse,
 * yeni atak başlatılamaz.
 */
export function pendingReferral(d: AppData): Episode | null {
  const ended = d.episodes.filter((e) => e.status !== 'active' && e.endedAt).sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0));
  const last = ended[0];
  if (!last || (last.status !== 'referred' && last.status !== 'emergency')) return null;
  const cleared = d.patient?.doctorClearedAt;
  if (cleared && cleared > (last.endedAt ?? 0)) return null;
  return last;
}

export function needsRedFlags(e: Episode | null, now: number): boolean {
  if (!e) return true;
  const last = e.redFlags[e.redFlags.length - 1];
  return !last || last.stopped || now - last.at > REDFLAG_VALID_MS;
}

export type NextAction =
  | { kind: 'early-retest'; at: number; ready: boolean }
  | { kind: 'morning-retest'; at: number; ready: boolean; needsSideTest: boolean }
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
    return { kind: 'morning-retest', at, ready: now >= at, needsSideTest: false };
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

export function formatDateTime(t: number): string {
  return new Date(t).toLocaleString('tr-TR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
}

/** Yıllı tarih-saat (paylaşılan rapor: hekim ay sonra okuyabilir). */
export function formatDateTimeYear(t: number): string {
  return new Date(t).toLocaleString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatDate(t: number): string {
  return new Date(t).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
}
