import { describe, expect, it } from 'vitest';
import {
  clampDose,
  DEFAULT_DOSE,
  diagnosisGate,
  doseStatus,
  episodeDay,
  evaluateRedFlags,
  interpretSideTests,
  RED_FLAGS,
  type SideTestResult
} from './safety';

const allSafe = () => Object.fromEntries(RED_FLAGS.map((q) => [q.id, q.stopsOn === 'yes' ? 'no' : 'yes'])) as Record<string, 'yes' | 'no'>;

describe('kırmızı bayraklar', () => {
  it('hepsi güvenli yanıtlanırsa devam', () => {
    expect(evaluateRedFlags(allSafe()).stop).toBe(false);
  });
  it('nörolojik belirti → acil', () => {
    const a = allSafe();
    a.neuro = 'yes';
    expect(evaluateRedFlags(a)).toMatchObject({ stop: true, action: 'emergency' });
  });
  it('"aynı baş dönmesi mi?" sorusuna hayır → hekim', () => {
    const a = allSafe();
    a.same = 'no';
    expect(evaluateRedFlags(a)).toMatchObject({ stop: true, action: 'doctor' });
  });
  it('acil + hekim birlikte → acil öncelikli', () => {
    const a = allSafe();
    a.ear = 'yes';
    a.continuous = 'yes';
    expect(evaluateRedFlags(a).action).toBe('emergency');
  });
});

describe('tanı kapısı', () => {
  const base = { diagnosedByDoctor: true, canal: 'PC' as const, side: 'R' as const, hasPrescription: false, contraindications: [] };
  it('tanılı arka kanal → izin, taraf testi gerekmez', () => {
    expect(diagnosisGate(base)).toEqual({ ok: true, requireSideTest: false });
  });
  it('tanı yok → kilit', () => {
    expect(diagnosisGate({ ...base, diagnosedByDoctor: false })).toEqual({ ok: false, reason: 'NO_DIAGNOSIS' });
  });
  it('reçete tanı yerine geçer', () => {
    expect(diagnosisGate({ ...base, diagnosedByDoctor: false, hasPrescription: true }).ok).toBe(true);
  });
  it('yatay kanal → kilit', () => {
    expect(diagnosisGate({ ...base, canal: 'HC' })).toEqual({ ok: false, reason: 'HORIZONTAL_CANAL' });
  });
  it('kontrendikasyon → kilit', () => {
    expect(diagnosisGate({ ...base, contraindications: ['neck'] })).toEqual({ ok: false, reason: 'CONTRAINDICATION' });
  });
  it('taraf bilinmiyorsa semptom testi zorunlu', () => {
    expect(diagnosisGate({ ...base, side: 'unknown' })).toEqual({ ok: true, requireSideTest: true });
  });
});

describe('doz sınırları', () => {
  const start = new Date(2026, 9, 27, 9, 0).getTime();
  const h = 3600 * 1000;
  it('günde 3 manevra', () => {
    const times = [start, start + h, start + 2 * h];
    expect(doseStatus(times, start, start + 3 * h, DEFAULT_DOSE)).toMatchObject({ allowed: false, reason: 'DAILY_LIMIT' });
    expect(doseStatus(times.slice(0, 2), start, start + 3 * h, DEFAULT_DOSE)).toMatchObject({ allowed: true, remainingToday: 1 });
  });
  it('ertesi gün yeniden izin', () => {
    const times = [start, start + h, start + 2 * h];
    expect(doseStatus(times, start, start + 24 * h, DEFAULT_DOSE).allowed).toBe(true);
  });
  it('4. gün kilit (varsayılan 3 gün)', () => {
    expect(doseStatus([start], start, start + 3 * 24 * h, DEFAULT_DOSE)).toMatchObject({ allowed: false, reason: 'DAY_LIMIT' });
  });
  it('reçete dozu en fazla günde 3 × 7 gün', () => {
    expect(clampDose({ maxPerDay: 10, maxDays: 30 })).toEqual({ maxPerDay: 3, maxDays: 7, maxTotal: 21 });
  });
  it('atak günü takvim gününe göre', () => {
    expect(episodeDay(start, start + 14 * h)).toBe(1);
    expect(episodeDay(start, start + 16 * h)).toBe(2);
  });
});

describe('hasta semptom testi yorumu', () => {
  const r = (side: 'R' | 'L', p: Partial<SideTestResult> = {}): SideTestResult => ({
    side,
    vertigo: false,
    latencySec: null,
    durationSec: null,
    safetyStopped: false,
    ...p
  });
  it('yalnız sağ pozitif → sağ tedavi', () => {
    expect(interpretSideTests([r('R', { vertigo: true, latencySec: 3, durationSec: 20 }), r('L')], null, null)).toEqual({
      kind: 'TREAT',
      side: 'R',
      note: null
    });
  });
  it('hekim tarafıyla çelişki → yönlendir', () => {
    expect(interpretSideTests([r('R'), r('L', { vertigo: true, durationSec: 15 })], 'R', null)).toEqual({
      kind: 'REFER',
      reason: 'SIDE_CONFLICT'
    });
  });
  it('uzun baş dönmesi → yönlendir', () => {
    expect(interpretSideTests([r('R', { vertigo: true, durationSec: 75 }), r('L')], null, null)).toMatchObject({ kind: 'REFER', reason: 'ATYPICAL_LONG' });
  });
  it('bitişi işaretlenmemiş baş dönmesi → yönlendir', () => {
    expect(interpretSideTests([r('R', { vertigo: true, durationSec: null }), r('L')], null, null)).toMatchObject({ kind: 'REFER' });
  });
  it('iki taraf pozitif → önce hangisi şiddetli sorulur', () => {
    const both = [r('R', { vertigo: true, durationSec: 20 }), r('L', { vertigo: true, durationSec: 10 })];
    expect(interpretSideTests(both, 'R', null)).toEqual({ kind: 'ASK_STRONGER' });
    expect(interpretSideTests(both, 'R', 'equal')).toMatchObject({ kind: 'REFER', reason: 'BOTH_SIDES' });
    expect(interpretSideTests(both, null, 'R')).toMatchObject({ kind: 'REFER', reason: 'BOTH_SIDES' });
    expect(interpretSideTests(both, 'R', 'R')).toMatchObject({ kind: 'TREAT', side: 'R' });
  });
  it('hiç tetiklenmedi', () => {
    expect(interpretSideTests([r('R'), r('L')], 'R', null)).toEqual({ kind: 'NOT_TRIGGERED' });
  });
});
