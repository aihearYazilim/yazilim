import { describe, expect, it } from 'vitest';
import {
  closeStaleEpisodes,
  doseLimitsFor,
  doseNextAllowedAt,
  doseFor,
  dxSideCheck,
  dxWarnText,
  EARLY_RETEST_MS,
  episodeDose,
  isNightTime,
  nextAction,
  nextMorning,
  nightNote,
  pendingReferral,
  referralFlags,
  recentKnownSide,
  recurrenceWarning,
  reopenEpisode,
  rxActive,
  rxFirstEpisode,
  sameDayReopenable,
  startBlockedByPlan,
  startDose,
  SUBTYPE_VALID_MS,
  subtypeRemembered,
  totalPauses
} from './episodes';
import type { StepRecord } from '../core/runner';
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
  it('sınır: D+13 günü 23:59 geçerli, D+14 günü 00:00 geçersiz; muayene günü 00:00 geçerli, gelecek tarih geçersiz', () => {
    // date 2026-10-01 → son geçerli gün 14 Ekim (dahil).
    expect(rxActive(profile, new Date('2026-10-14T23:59:59').getTime())).toBe(true);
    expect(rxActive(profile, new Date('2026-10-15T00:00:00').getTime())).toBe(false);
    expect(rxActive(profile, new Date('2026-10-01T00:00:00').getTime())).toBe(true);
    expect(rxActive(profile, new Date('2026-09-30T23:59:00').getTime())).toBe(false);
    expect(rxActive({ ...profile, prescription: { ...rx, date: 'bozuk' } }, new Date('2026-10-05T12:00:00').getTime())).toBe(false);
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

describe('manevra sonrası kusma', () => {
  it('aynı gün yeni manevra yok ve erken tekrar testi yerine sabah testi', () => {
    const m = { ...man(base), afterSymptoms: 'severe' as const };
    const e = ep({ maneuvers: [m] });
    expect(episodeDose(e, undefined, base + 3600e3, [e])).toMatchObject({ allowed: false, reason: 'DAILY_LIMIT' });
    expect(nextAction(e, base + 2 * 3600e3)).toMatchObject({ kind: 'morning-retest' });
  });
});

describe('hekim tanısındaki tarafla çelişki (kullanıcı turu 1)', () => {
  const now = new Date('2026-10-20T10:00:00').getTime();
  const prof = (p: Record<string, unknown> = {}) => ({ contraindications: [], diagnosedByDoctor: true, canal: 'PC' as const, side: 'R' as const, ...p });
  it('aynı taraf ya da taraf bilinmiyor → sorun yok', () => {
    expect(dxSideCheck(prof({ dxDate: '2026-10-15' }), 'R', now).kind).toBe('ok');
    expect(dxSideCheck(prof({ side: 'unknown' }), 'L', now).kind).toBe('ok');
    expect(dxSideCheck(prof({ diagnosedByDoctor: false }), 'L', now).kind).toBe('ok');
  });
  it('14 gün içindeki tanıyla çelişki → yönlendir', () => {
    expect(dxSideCheck(prof({ dxDate: '2026-10-10' }), 'L', now)).toMatchObject({ kind: 'refer' });
  });
  it('eski tanıyla çelişki → uyarı ve not', () => {
    const old = dxSideCheck(prof({ dxDate: '2026-07-01' }), 'L', now);
    expect(old).toMatchObject({ kind: 'warn', dxSide: 'R' });
    if (old.kind === 'warn') expect(old.note).toMatch(/sağ.*sol/);
    // Tarih yok ama kurulumda açıkça "daha önce" seçilmiş: uyarı.
    expect(dxSideCheck(prof({ dxWhen: 'older' }), 'L', now).kind).toBe('warn');
  });
  it('tanı tarihi boşsa tanı yakın tarihli sayılır → yönlendir (kullanıcı turu 2, k03)', () => {
    const r = dxSideCheck(prof(), 'L', now);
    expect(r.kind).toBe('refer');
    if (r.kind === 'refer') expect(r.note).toMatch(/tarih girilmemiş/);
    expect(dxSideCheck(prof({ dxWhen: 'recent' }), 'L', now).kind).toBe('refer');
    // Geçersiz tarih metni de boş sayılır.
    expect(dxSideCheck(prof({ dxDate: 'abc' }), 'L', now).kind).toBe('refer');
  });
  it('geçiş ekranı uyarısı kısa: "tekrarlayan" demez, Bitir yolunu söyler', () => {
    const t = dxWarnText('R', 'L');
    expect(t).toMatch(/^Hekiminiz sağ demişti, test sol gösterdi\./);
    expect(t).toMatch(/Bitir/);
    expect(t).not.toMatch(/[Tt]ekrarlayan/);
    expect(t.length).toBeLessThan(160);
  });
  it('geçerli reçete varsa denetim reçeteye bırakılır', () => {
    const rx = { v: 1 as const, side: 'R' as const, canal: 'PC' as const, maneuver: 'epley' as const, date: '2026-10-15', perDay: 3, days: 7 };
    expect(dxSideCheck(prof({ dxDate: '2026-10-15', prescription: rx }), 'L', now).kind).toBe('ok');
  });
});

describe('sık nüks uyarısı', () => {
  const day = 24 * 3600e3;
  it('aynı gün açılan ataklar tek atak sayılır', () => {
    expect(recurrenceWarning([base, base + 3600e3, base + 7200e3], base + 8000e3)).toBeNull();
  });
  it('30 günde 3 ayrı atak → uyarı', () => {
    expect(recurrenceWarning([base, base + 10 * day, base + 20 * day], base + 21 * day)).toMatchObject({ last30: 3 });
  });
  it('6 ayda 4 atak → uyarı; 6 ayda 3 atak (seyrek) → yok', () => {
    const four = [base, base + 50 * day, base + 100 * day, base + 150 * day];
    expect(recurrenceWarning(four, base + 160 * day)).toMatchObject({ last180: 4 });
    expect(recurrenceWarning(four.slice(1), base + 160 * day)).toBeNull();
  });
});

describe('aynı gün yeniden açma ve doz sınırı ana ekranda', () => {
  it('bugün manevrayla kapatılan atak yeniden açılır, 1 saatlik test korunur', () => {
    const d = emptyData();
    d.episodes = [ep({ id: 'a', status: 'closed', endedAt: base + 600e3, maneuvers: [man(base)] })];
    const re = sameDayReopenable(d, base + 900e3);
    expect(re?.id).toBe('a');
    const out = reopenEpisode(d, 'a');
    const e = out.episodes[0]!;
    expect(e.status).toBe('active');
    expect(startBlockedByPlan(e, base + 900e3)).toMatchObject({ kind: 'early-retest', ready: false });
  });
  it('yönlendirilmiş, dünkü ya da manevrasız atak yeniden açılmaz', () => {
    const d = emptyData();
    d.episodes = [ep({ id: 'a', status: 'referred', endedAt: base + 600e3, maneuvers: [man(base)] })];
    expect(sameDayReopenable(d, base + 900e3)).toBeNull();
    d.episodes = [ep({ id: 'a', status: 'closed', endedAt: base + 600e3, maneuvers: [man(base)] })];
    expect(sameDayReopenable(d, base + 24 * 3600e3)).toBeNull();
    d.episodes = [ep({ id: 'a', status: 'closed', endedAt: base + 600e3 })];
    expect(sameDayReopenable(d, base + 900e3)).toBeNull();
  });
  it('günlük sınır doluyken yeni atak başlatılamaz; bir sonraki izin ertesi sabah', () => {
    const d = emptyData();
    d.episodes = [ep({ id: 'a', status: 'closed', endedAt: base + 8000e3, maneuvers: [man(base), man(base + 3600e3), man(base + 7200e3)] })];
    const now = base + 9000e3;
    expect(startDose(d, now)).toMatchObject({ allowed: false, reason: 'DAILY_LIMIT' });
    const next = new Date(doseNextAllowedAt(d, now)!);
    expect([next.getDate(), next.getHours()]).toEqual([28, 6]);
  });
  it('yeniden açılacak atakta sınır doluysa ana ekran sınırı gösterir (kullanıcı turu 2, k06)', () => {
    const d = emptyData();
    d.episodes = [ep({ id: 'a', status: 'closed', endedAt: base + 8000e3, maneuvers: [man(base), man(base + 3600e3), man(base + 7200e3)] })];
    const now = base + 9000e3;
    expect(sameDayReopenable(d, now)?.id).toBe('a');
    expect(startDose(d, now)).toMatchObject({ allowed: false, reason: 'DAILY_LIMIT' });
    // Sınır dolmamışsa yeniden açılacak atakla aynı doz.
    d.episodes = [ep({ id: 'a', status: 'closed', endedAt: base + 600e3, maneuvers: [man(base)] })];
    expect(startDose(d, base + 900e3)).toEqual(doseFor(d, d.episodes[0]!, base + 900e3));
    expect(startDose(d, base + 900e3).allowed).toBe(true);
  });
  it('manevrasız atakta plan engeli yok (taraf testi sürebilir)', () => {
    expect(startBlockedByPlan(ep({ side: null }), base)).toBeNull();
    expect(startBlockedByPlan(null, base)).toBeNull();
  });
});

describe('kullanıcı turu 2: hasta akışı', () => {
  it('alt tip yanıtları aynı atakta 6 saat hatırlanır', () => {
    const e = ep({ subtype: { at: base, trigger: 'liedown', duration: 'short' } });
    expect(subtypeRemembered(e, base + 3600e3)).toBe(true);
    expect(subtypeRemembered(e, base + SUBTYPE_VALID_MS + 1)).toBe(false);
    expect(subtypeRemembered(ep({}), base)).toBe(false);
    expect(subtypeRemembered(null, base)).toBe(false);
  });
  it('manevra kaydının duraklatma toplamı adım kayıtlarından', () => {
    const rec = (pauses?: number) => ({ pauses }) as unknown as StepRecord;
    expect(totalPauses([rec(1), rec(), rec(2)])).toBe(3);
    expect(totalPauses([])).toBe(0);
  });
  it('gece saati: 22:00–06:00 arası "uyanınca" notu', () => {
    expect(isNightTime(new Date(2026, 9, 27, 1, 26).getTime())).toBe(true);
    expect(isNightTime(new Date(2026, 9, 27, 22, 30).getTime())).toBe(true);
    expect(isNightTime(new Date(2026, 9, 27, 6, 0).getTime())).toBe(false);
    expect(isNightTime(new Date(2026, 9, 27, 14, 0).getTime())).toBe(false);
    expect(nightNote(new Date(2026, 9, 27, 1, 26).getTime())).toMatch(/uyanınca/);
    expect(nightNote(new Date(2026, 9, 27, 14, 0).getTime())).toBeNull();
  });
  it('kilit kartı: atağı durduran güvenlik soruları', () => {
    const answers = { ear: 'yes' as const, neuro: 'no' as const };
    const e = ep({ status: 'referred', redFlags: [{ at: base, answers, stopped: true }] });
    expect(referralFlags(e).map((q) => q.id)).toEqual(['ear']);
    expect(referralFlags(ep({ status: 'referred', endNote: 'ATYPICAL_LONG' }))).toEqual([]);
  });
});
