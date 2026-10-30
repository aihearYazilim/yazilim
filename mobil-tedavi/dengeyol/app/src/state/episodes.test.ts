import { describe, expect, it } from 'vitest';
import { closeStaleEpisodes, rxFirstEpisode, doseLimitsFor, EARLY_RETEST_MS, episodeDose, nextAction, nextMorning, pendingReferral, recentKnownSide, rxActive } from './episodes';
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
  it('manevradan sonra erken (1 saat) tekrar testi', () => {
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

describe('reçete geçerlilik süresi', () => {
  const rx = { v: 1 as const, side: 'L' as const, canal: 'PC' as const, maneuver: 'epley' as const, date: '2026-10-01', perDay: 3, days: 7 };
  const profile = { contraindications: [], diagnosedByDoctor: true, canal: 'PC' as const, side: 'L' as const, prescription: rx };
  it('14 gün içinde geçerli: reçete dozu ve tarafı', () => {
    const now = new Date('2026-10-10T12:00:00').getTime();
    expect(rxActive(profile, now)).toBe(true);
    expect(doseLimitsFor(profile, now).maxDays).toBe(7);
    expect(recentKnownSide(profile, now)).toBe('L');
  });
  it('süresi dolunca varsayılan doz, taraf bilinmiyor sayılır', () => {
    const now = new Date('2026-11-20T12:00:00').getTime();
    expect(rxActive(profile, now)).toBe(false);
    expect(doseLimitsFor(profile, now).maxDays).toBe(3);
    expect(recentKnownSide(profile, now)).toBeNull();
  });
});

describe('eski aktif atak', () => {
  it('3 günden uzun süre işlem görmeyen aktif atak kendiliğinden kapanır; yönlendirilmiş atak etkilenmez', () => {
    const d = emptyData();
    d.episodes = [ep({ id: 'a', startedAt: base, maneuvers: [man(base)] }), ep({ id: 'b', status: 'referred', endedAt: base + 1000 })];
    const later = base + 7 * 24 * 3600e3;
    const out = closeStaleEpisodes(d, later);
    expect(out.episodes.find((e) => e.id === 'a')!.status).toBe('closed');
    expect(out.episodes.find((e) => e.id === 'b')!.status).toBe('referred');
    expect(closeStaleEpisodes(d, base + 3600e3)).toBe(d);
  });
});

describe('tedavi dönemi (tur 2 klinik güvenlik)', () => {
  it('her gün atak kapatıp açarak günde 3 manevra: 4. gün sınır (gün ya da toplam) devreye girer', () => {
    const day = 24 * 3600e3;
    const eps: Episode[] = [0, 1, 2].map((dd) =>
      ep({
        id: `e${dd}`,
        status: 'closed',
        startedAt: base + dd * day,
        maneuvers: [man(base + dd * day), man(base + dd * day + 3600e3), man(base + dd * day + 7200e3)]
      })
    );
    const fresh = ep({ id: 'new', startedAt: base + 3 * day });
    const st = episodeDose(fresh, undefined, base + 3 * day + 1000, [...eps, fresh]);
    expect(st.allowed).toBe(false);
  });
  it('3 gün manevra yapılmış ama toplam dolmamışsa 4. farklı gün yine engellenir (gün sınırı)', () => {
    const day = 24 * 3600e3;
    const eps: Episode[] = [0, 2, 4].map((dd) => ep({ id: `e${dd}`, status: 'closed', startedAt: base + dd * day, maneuvers: [man(base + dd * day)] }));
    const fresh = ep({ id: 'new', startedAt: base + 6 * day });
    expect(episodeDose(fresh, undefined, base + 6 * day + 1000, [...eps, fresh])).toMatchObject({ allowed: false, reason: 'DAY_LIMIT' });
  });
  it('deneme manevraları da doza sayılır', () => {
    const fresh = ep({ id: 'new', startedAt: base });
    expect(episodeDose(fresh, undefined, base + 9000e3, [fresh], [base + 1000, base + 2000, base + 3000]).allowed).toBe(false);
  });
  it('14 günden eski manevralar yeni atağı kısıtlamaz', () => {
    const day = 24 * 3600e3;
    const old = ep({ id: 'o', status: 'closed', maneuvers: [0, 1, 2].flatMap((dd) => [man(base + dd * day), man(base + dd * day + 3600e3), man(base + dd * day + 7200e3)]) });
    const fresh = ep({ id: 'new', startedAt: base + 20 * day });
    expect(episodeDose(fresh, undefined, base + 20 * day + 1000, [old, fresh]).allowed).toBe(true);
  });
});

describe('reçeteli kısa yol yalnız reçetenin atağı için', () => {
  it('reçeteden sonra kapanmış bir atak varsa (nüks) kısa yol kapanır; gelecek tarihli reçete geçersiz', () => {
    const d = emptyData();
    const rxDate = '2026-10-01';
    d.patient = {
      contraindications: [],
      diagnosedByDoctor: true,
      canal: 'PC',
      side: 'L',
      prescription: { v: 1, side: 'L', canal: 'PC', maneuver: 'epley', date: rxDate, perDay: 3, days: 7 }
    };
    const now = new Date('2026-10-05T10:00:00').getTime();
    expect(rxFirstEpisode(d, now)).toBe(true);
    d.episodes = [ep({ id: 'x', status: 'resolved', startedAt: new Date('2026-10-02T10:00:00').getTime(), endedAt: now - 1000 })];
    expect(rxFirstEpisode(d, now)).toBe(false);
    d.patient.prescription!.date = '2026-12-01';
    expect(rxActive(d.patient, now)).toBe(false);
  });
});
