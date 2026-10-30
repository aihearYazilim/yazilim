/**
 * Atak (episode) iş kuralları — saf fonksiyonlar.
 */
import type { Side } from '../core/protocols';
import { clampDose, DEFAULT_DOSE, type DoseLimits, doseStatus, localDayKey, type DoseStatus } from '../core/safety';
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
 * Hastanın kendi girdiği tanı tarihi/tarafı kullanılmaz (doğrulanamaz); eski tanıdaki taraf nükste değişebilir.
 */
export function recentKnownSide(profile: PatientProfile | undefined, now: number = Date.now()): Side | null {
  return profile && rxActive(profile, now) ? profile.prescription!.side : null;
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

export function formatDate(t: number): string {
  return new Date(t).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
}
