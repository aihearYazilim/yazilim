import { describe, expect, it } from 'vitest';
import type { StepRecord } from './runner';
import type { SideTestResult } from './safety';
import {
  decideHorizontal,
  decidePosterior,
  decisionLogDetail,
  episodeCanal,
  isClean,
  longerSide,
  maneuverFor,
  retestFor,
  rollResults,
  sideOrder
} from './patientDecision';

const res = (side: 'R' | 'L', durationSec: number | null | false, extra: Partial<SideTestResult> = {}): SideTestResult => ({
  side,
  vertigo: durationSec !== false,
  latencySec: durationSec === false ? null : 3,
  durationSec: durationSec === false ? null : durationSec,
  safetyStopped: false,
  ...extra
});

describe('arka kanal: cesur karar (BRIEF §2b)', () => {
  it('tek taraf pozitif → o taraf, temiz karar (telefon alında manevraya geçilir)', () => {
    const d = decidePosterior([res('R', false), res('L', 20)]);
    expect(d).toMatchObject({ canal: 'PC', side: 'L', warn: null });
    expect(isClean(d)).toBe(true);
    expect(d.reason).toMatch(/sol yanınıza yatınca/);
  });

  it('iki taraf pozitif, süre belirgin farklı → uzun süren taraf; iki taraf uyarısıyla', () => {
    const d = decidePosterior([res('R', 30), res('L', 10)]);
    expect(d).toMatchObject({ side: 'R', warn: 'BOTH_SIDES' });
    expect(d.ask).toBeUndefined();
    expect(d.reason).toMatch(/Sağ tarafta baş dönmesi daha uzun/);
  });

  it('iki taraf pozitif, süre benzer → "hangisi daha şiddetliydi" sorulur; yanıtla taraf seçilir', () => {
    const d = decidePosterior([res('R', 12), res('L', 10)]);
    expect(d.ask).toBe(true);
    expect(isClean(d)).toBe(false);
    const d2 = decidePosterior([res('R', 12), res('L', 10)], { stronger: 'L' });
    expect(d2).toMatchObject({ side: 'L', warn: 'BOTH_SIDES' });
  });

  it('"aşağı yukarı aynı": bilinen taraf varsa o; yoksa iki tarafa sırayla', () => {
    expect(decidePosterior([res('R', 12), res('L', 10)], { stronger: 'equal', suggested: 'L' })).toMatchObject({ side: 'L', warn: 'BOTH_SIDES' });
    const both = decidePosterior([res('R', 12), res('L', 10)], { stronger: 'equal' });
    expect(both).toMatchObject({ side: 'R', both: true, warn: 'BOTH_SIDES' });
    expect(decisionLogDetail(both)).toMatch(/^Uygulamanın kararı: iki tarafa sırayla/);
  });

  it('tetiklenmedi → öneri bilinen taraf (yoksa taraf seçimi kullanıcıda)', () => {
    expect(decidePosterior([res('R', false), res('L', false)], { suggested: 'R' })).toMatchObject({ side: 'R', warn: 'NOT_TRIGGERED' });
    expect(decidePosterior([res('R', false), res('L', false)])).toMatchObject({ side: null, warn: 'NOT_TRIGGERED' });
  });

  it('tek taraf testi (hekimin dediği taraf) tetiklemedi → önerilen yol öbür tarafın testi; bilinen tarafa testsiz manevra önerilmez (M1-2)', () => {
    const d = decidePosterior([res('L', false)], { suggested: 'L' });
    expect(d).toMatchObject({ side: 'L', warn: 'NOT_TRIGGERED', testOther: 'R' });
    expect(isClean(d)).toBe(false);
    expect(d.reason).toBe('Sol tarafta baş dönmesi başlamadı; sağ taraf henüz test edilmedi.');
    expect(decisionLogDetail(d)).toMatch(/^Uygulamanın kararı: önce sağ taraf da test edilsin/);
    // İki taraf da test edilip tetiklemediyse öbür taraf önerilmez.
    expect(decidePosterior([res('R', false), res('L', false)], { suggested: 'L' }).testOther).toBeUndefined();
    // Tek tarafta uzun baş dönmesiyle durdurma (pozitif) öbür tarafın testi değildir.
    expect(decidePosterior([res('R', null, { safetyStopped: true })]).testOther).toBeUndefined();
  });

  it('atipik süre (≥ 60 s, bitişi işaretlenmemiş ya da durdurulmuş) → uyarı ama karar yine verilir', () => {
    expect(decidePosterior([res('R', false), res('L', 75)])).toMatchObject({ side: 'L', warn: 'ATYPICAL_LONG' });
    expect(decidePosterior([res('R', null), res('L', false)])).toMatchObject({ side: 'R', warn: 'ATYPICAL_LONG' });
    // İlk testte uzun baş dönmesiyle durduruldu, öbür taraf test edilmedi.
    const stopped = decidePosterior([res('R', null, { safetyStopped: true })]);
    expect(stopped).toMatchObject({ side: 'R', warn: 'ATYPICAL_LONG' });
    expect(stopped.reason).toMatch(/Öbür taraf test edilmedi/);
  });

  it('hekimin dediği tarafla çelişki → SIDE_CONFLICT; seçim kullanıcıda (test tarafı / hekimin tarafı)', () => {
    const d = decidePosterior([res('R', 15), res('L', false)], { doctorSide: 'L' });
    expect(d).toMatchObject({ side: 'R', doctorSide: 'L', warn: 'SIDE_CONFLICT' });
    expect(decidePosterior([res('R', 15), res('L', false)], { doctorSide: 'R' })).toMatchObject({ side: 'R', warn: null });
  });
});

describe('yatay kanal: daha şiddetli taraf etkilenen taraf (geotropik varsayım) → BBQ roll', () => {
  it('iki yan pozitif, biri belirgin uzun → o taraf, temiz karar; varsayım gerekçede', () => {
    const d = decideHorizontal([res('R', 8), res('L', 25)]);
    expect(d).toMatchObject({ canal: 'HC', side: 'L', warn: null });
    expect(isClean(d)).toBe(true);
    expect(d.reason).toMatch(/daha şiddetli taraf etkilenen taraf kabul edilir/);
    expect(maneuverFor(d.canal)).toBe('bbq-roll');
    expect(decisionLogDetail(d)).toMatch(/BBQ roll \(yatay kanal, geotropik varsayım\)/);
  });

  it('tek yan pozitif → o taraf', () => {
    expect(decideHorizontal([res('R', 10), res('L', false)])).toMatchObject({ side: 'R', warn: null });
  });

  it('benzer şiddet → sorulur; "aynı" ve bilinen taraf yoksa taraf kullanıcıya bırakılır (BBQ iki yöne yapılmaz)', () => {
    expect(decideHorizontal([res('R', 10), res('L', 12)]).ask).toBe(true);
    const eq = decideHorizontal([res('R', 10), res('L', 12)], { stronger: 'equal' });
    expect(eq).toMatchObject({ side: null, warn: 'BOTH_SIDES' });
    expect(eq.both).toBeUndefined();
  });

  it('tetiklenmedi ve atipik süre', () => {
    expect(decideHorizontal([res('R', false), res('L', false)])).toMatchObject({ warn: 'NOT_TRIGGERED' });
    expect(decideHorizontal([res('R', 80), res('L', 20)])).toMatchObject({ side: 'R', warn: 'ATYPICAL_LONG' });
  });
});

describe('yardımcılar', () => {
  it('longerSide: bitişi işaretlenmemiş taraf daha şiddetli; fark eşiğin altındaysa null', () => {
    expect(longerSide(res('R', null), res('L', 50))).toBe('R');
    expect(longerSide(res('R', 10), res('L', 13))).toBeNull();
    expect(longerSide(res('R', 10), res('L', 20))).toBe('L');
  });

  it('sırtüstü baş çevirme kayıtlarından iki yan', () => {
    const rec = (stepId: string, marks: { start: number; end: number | null }[]): StepRecord =>
      ({ stepId, title: stepId, startedAt: 0, firstInRangeAt: 0, reachedAt: 0, endedAt: 60_000, holdSec: 45, samples: 0, inRangeSamples: 0, sumAbsThetaErr: 0, maxAbsThetaErr: 0, thetaSamples: 0, vertigoMarks: marks, transitionSec: null, manual: false, driftCount: 0 }) as StepRecord;
    const [r, l] = rollResults([rec('roll-center', []), rec('roll-right', [{ start: 2, end: 22 }]), rec('roll-back1', []), rec('roll-left', [])]);
    expect(r).toMatchObject({ side: 'R', vertigo: true, durationSec: 20 });
    expect(l).toMatchObject({ side: 'L', vertigo: false });
  });

  it('atağın kanalı: son manevra, son test, alt tip; tekrar testi kanala göre', () => {
    expect(episodeCanal(null)).toBe('PC');
    expect(episodeCanal({ maneuvers: [{ protocolId: 'bbq-roll' }], sideTests: [] })).toBe('HC');
    expect(episodeCanal({ maneuvers: [], sideTests: [{ canal: 'HC' }] })).toBe('HC');
    expect(episodeCanal({ maneuvers: [], sideTests: [{}] })).toBe('PC');
    expect(episodeCanal({ maneuvers: [], sideTests: [], subtype: { trigger: 'turn' } })).toBe('HC');
    expect(retestFor('HC')).toBe('supine-roll');
    expect(retestFor('PC')).toBe('dix-hallpike');
    expect(maneuverFor('PC', 'semont')).toBe('semont');
  });

  it('test sırası: bilinen taraf sonra', () => {
    expect(sideOrder('R')).toEqual(['L', 'R']);
    expect(sideOrder(null)).toEqual(['R', 'L']);
  });
});
