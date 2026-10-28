import { describe, expect, it } from 'vitest';
import { EARLY_RETEST_MS, episodeDose, nextAction, nextMorning, pendingReferral } from './episodes';
import { emptyData } from './types';
import type { Episode, ManeuverLog } from './types';

const base = new Date(2026, 9, 27, 10, 0).getTime();
const man = (at: number, completed = true): ManeuverLog => ({
  id: 'm' + at,
  at,
  protocolId: 'epley',
  side: 'R',
  completed,
  stopReason: null,
  records: [],
  manual: false
});
const ep = (p: Partial<Episode>): Episode => ({
  id: 'e',
  startedAt: base,
  side: 'R',
  protocolId: 'epley',
  redFlags: [],
  sideTests: [],
  maneuvers: [],
  retests: [],
  status: 'active',
  ...p
});

describe('sıradaki eylem', () => {
  it('manevradan sonra 30 dk tekrar testi', () => {
    const e = ep({ maneuvers: [man(base)] });
    expect(nextAction(e, base + 10 * 60000)).toMatchObject({ kind: 'early-retest', ready: false });
    expect(nextAction(e, base + EARLY_RETEST_MS)).toMatchObject({ kind: 'early-retest', ready: true });
  });
  it('erken test pozitif → yeniden manevra', () => {
    const e = ep({ maneuvers: [man(base)], retests: [{ at: base + EARLY_RETEST_MS, kind: 'early', side: 'R', vertigo: true, latencySec: 2, durationSec: 15 }] });
    expect(nextAction(e, base + EARLY_RETEST_MS + 1000).kind).toBe('treat-again');
  });
  it('erken test negatif → ertesi sabah 06:00 testi', () => {
    const e = ep({ maneuvers: [man(base)], retests: [{ at: base + EARLY_RETEST_MS, kind: 'early', side: 'R', vertigo: false, latencySec: null, durationSec: null }] });
    const na = nextAction(e, base + EARLY_RETEST_MS + 1000);
    expect(na.kind).toBe('morning-retest');
    if (na.kind === 'morning-retest') {
      expect(new Date(na.at).getHours()).toBe(6);
      expect(new Date(na.at).getDate()).toBe(28);
      expect(na.ready).toBe(false);
    }
  });
  it('sabah testi de negatif → düzeldi önerisi', () => {
    const e = ep({
      maneuvers: [man(base)],
      retests: [
        { at: base + EARLY_RETEST_MS, kind: 'early', side: 'R', vertigo: false, latencySec: null, durationSec: null },
        { at: base + 21 * 3600000, kind: 'morning', side: 'R', vertigo: false, latencySec: null, durationSec: null }
      ]
    });
    expect(nextAction(e, base + 22 * 3600000).kind).toBe('resolved-suggest');
  });
});

describe('sabah saati', () => {
  it('gece yarısından sonraki test aynı günün 06:00 sına atanır', () => {
    const t = new Date(2026, 9, 29, 0, 30).getTime();
    const m = new Date(nextMorning(t));
    expect([m.getDate(), m.getHours()]).toEqual([29, 6]);
  });
  it('öğleden sonraki test ertesi günün 06:00 sına atanır', () => {
    const m = new Date(nextMorning(new Date(2026, 9, 29, 15, 0).getTime()));
    expect([m.getDate(), m.getHours()]).toEqual([30, 6]);
  });
  it('tetiklenmeyen taraf testinden sonra sabah iki yönlü test istenir', () => {
    const e = ep({
      side: null,
      sideTests: [{ at: base, results: [], stronger: null, decision: { kind: 'NOT_TRIGGERED' } }]
    });
    expect(nextAction(e, base)).toMatchObject({ kind: 'morning-retest', needsSideTest: true });
  });
});

describe('doz atak kapatılarak sıfırlanamaz', () => {
  it('aynı gün yeni atakta günlük sınır önceki atağı da sayar', () => {
    const old = ep({ id: 'a', status: 'closed', maneuvers: [man(base), man(base + 3600e3), man(base + 7200e3)] });
    const fresh = ep({ id: 'b', startedAt: base + 8000e3 });
    expect(episodeDose(fresh, undefined, base + 9000e3, [old, fresh])).toMatchObject({ allowed: false, reason: 'DAILY_LIMIT' });
  });
  it('kayan pencerede toplam sınır', () => {
    const day = 24 * 3600e3;
    const old = ep({
      id: 'a',
      status: 'closed',
      maneuvers: [0, 1, 2].flatMap((dd) => [man(base + dd * day), man(base + dd * day + 3600e3), man(base + dd * day + 7200e3)])
    });
    const fresh = ep({ id: 'b', startedAt: base + 2 * day + 8000e3 });
    expect(episodeDose(fresh, undefined, base + 2 * day + 30000e3, [old, fresh]).allowed).toBe(false);
  });
});

describe('hekime yönlendirme kilidi', () => {
  it('yönlendirmeyle biten ataktan sonra onay olmadan kilit', () => {
    const d = emptyData();
    d.episodes = [ep({ status: 'referred', endedAt: base + 1000 })];
    expect(pendingReferral(d)).not.toBeNull();
    d.patient = { contraindications: [], diagnosedByDoctor: true, canal: 'PC', side: 'R', doctorClearedAt: base + 2000 };
    expect(pendingReferral(d)).toBeNull();
  });
});
