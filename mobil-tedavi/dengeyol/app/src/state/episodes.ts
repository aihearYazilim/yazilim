/**
 * Atak (episode) iş kuralları — saf fonksiyonlar.
 */
import type { Side } from '../core/protocols';
import { clampDose, DEFAULT_DOSE, type DoseLimits, doseStatus, localDayKey, type DoseStatus } from '../core/safety';
import type { Episode, PatientProfile } from './types';

/** Tekrar testi için manevradan sonra beklenecek süre (ms). Plan §2.3: 30 dk. */
export const EARLY_RETEST_MS = 30 * 60 * 1000;
/** Kırmızı bayraklar bu süreden eskiyse yeniden sorulur (ms). */
export const REDFLAG_VALID_MS = 6 * 60 * 60 * 1000;
/** Sabah testi en erken saat. */
export const MORNING_HOUR = 6;

export function doseLimitsFor(profile: PatientProfile | undefined): DoseLimits {
  if (profile?.prescription) return clampDose({ maxPerDay: profile.prescription.perDay, maxDays: profile.prescription.days });
  return DEFAULT_DOSE;
}

export function episodeDose(e: Episode, profile: PatientProfile | undefined, now: number): DoseStatus {
  const times = e.maneuvers.filter((m) => m.completed || m.records.length > 1).map((m) => m.at);
  return doseStatus(times, e.startedAt, now, doseLimitsFor(profile));
}

export function needsRedFlags(e: Episode | null, now: number): boolean {
  if (!e) return true;
  const last = e.redFlags[e.redFlags.length - 1];
  return !last || last.stopped || now - last.at > REDFLAG_VALID_MS;
}

export type NextAction =
  | { kind: 'early-retest'; at: number; ready: boolean }
  | { kind: 'morning-retest'; at: number; ready: boolean }
  | { kind: 'treat-again' }
  | { kind: 'retry-side-test' }
  | { kind: 'resolved-suggest' }
  | { kind: 'none' };

function nextMorning(t: number): number {
  const d = new Date(t);
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, MORNING_HOUR, 0, 0, 0);
  return m.getTime();
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
      return { kind: 'morning-retest', at, ready: now >= at };
    }
    return { kind: 'retry-side-test' };
  }
  const retestsAfter = e.retests.filter((r) => r.at > lastMan.at);
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
  return { kind: 'morning-retest', at, ready: now >= at };
}

export function maneuversToday(e: Episode, now: number): number {
  const k = localDayKey(now);
  return e.maneuvers.filter((m) => m.completed && localDayKey(m.at) === k).length;
}

/** Hangi taraf tedavi edilir? Reçete/profil tarafı ya da bu ataktaki test sonucu. */
export function episodeSide(e: Episode, profile: PatientProfile | undefined): Side | null {
  if (e.side) return e.side;
  if (profile?.prescription) return profile.prescription.side;
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
