import { describe, expect, it } from 'vitest';
import { type Finding, suggestDiagnosis } from './diagnosis';

const f = (p: Partial<Finding>): Finding => ({
  nystagmus: 'none',
  latencySec: null,
  durationSec: null,
  intensity: 0,
  vertigo: false,
  ...p
});

describe('tanı önerisi', () => {
  it('tipik sağ arka kanal', () => {
    const r = suggestDiagnosis({
      dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 3, durationSec: 20, vertigo: true }),
      dhL: f({})
    });
    expect(r.suggestions[0]).toMatchObject({ canal: 'PC', side: 'R', mechanism: 'canalithiasis', confidence: 'tipik' });
    expect(r.suggestions[0]!.maneuvers[0]).toBe('epley');
  });

  it('≥1 dk süren arka kanal → kupulolitiyazis (olası)', () => {
    const r = suggestDiagnosis({ dhL: f({ nystagmus: 'upbeat-torsional', latencySec: 1, durationSec: 90 }), dhR: f({}) });
    expect(r.suggestions[0]).toMatchObject({ canal: 'PC', side: 'L', mechanism: 'cupulolithiasis', confidence: 'olası' });
  });

  it('geotropik yatay kanal: güçlü taraf hasta', () => {
    const r = suggestDiagnosis({
      rollR: f({ nystagmus: 'horizontal-geotropic', intensity: 3, durationSec: 30 }),
      rollL: f({ nystagmus: 'horizontal-geotropic', intensity: 1, durationSec: 20 })
    });
    expect(r.suggestions[0]).toMatchObject({ canal: 'HC', side: 'R', mechanism: 'canalithiasis' });
    expect(r.suggestions[0]!.maneuvers).toContain('bbq-roll');
  });

  it('apogeotropik yatay kanal: zayıf taraf hasta', () => {
    const r = suggestDiagnosis({
      rollR: f({ nystagmus: 'horizontal-apogeotropic', intensity: 3, durationSec: 90 }),
      rollL: f({ nystagmus: 'horizontal-apogeotropic', intensity: 1, durationSec: 90 })
    });
    expect(r.suggestions[0]).toMatchObject({ canal: 'HC', side: 'L', mechanism: 'cupulolithiasis' });
    expect(r.suggestions[0]!.maneuvers).toEqual(['gufoni-apo']);
  });

  it('eşit şiddet → taraf belirsiz, manevra önerilmez', () => {
    const r = suggestDiagnosis({
      rollR: f({ nystagmus: 'horizontal-geotropic', intensity: 2 }),
      rollL: f({ nystagmus: 'horizontal-geotropic', intensity: 2 })
    });
    expect(r.suggestions[0]!.side).toBeNull();
    expect(r.suggestions[0]!.maneuvers).toEqual([]);
  });

  it('saf aşağı vuran nistagmus santral uyarısı üretir', () => {
    const r = suggestDiagnosis({ dhR: f({ nystagmus: 'downbeat-pure', durationSec: 120 }) });
    expect(r.warnings.join(' ')).toMatch(/[Ss]antral/);
  });

  it('ön kanal → olası, Yacovino, santral uyarısı', () => {
    const r = suggestDiagnosis({ dhR: f({ nystagmus: 'downbeat-torsional', durationSec: 20 }) });
    expect(r.suggestions[0]).toMatchObject({ canal: 'AC', confidence: 'olası' });
    expect(r.suggestions[0]!.maneuvers).toEqual(['yacovino']);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('karışık yatay desen → belirsiz + uyarı', () => {
    const r = suggestDiagnosis({
      rollR: f({ nystagmus: 'horizontal-geotropic', intensity: 2 }),
      rollL: f({ nystagmus: 'horizontal-apogeotropic', intensity: 2 })
    });
    expect(r.suggestions[0]!.confidence).toBe('belirsiz');
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('nistagmussuz tek taraflı vertigo → subjektif BPPV olasılığı', () => {
    const r = suggestDiagnosis({ dhR: f({ vertigo: true }), dhL: f({}) });
    expect(r.suggestions[0]!.label).toMatch(/Nistagmussuz/);
    expect(r.suggestions[0]!.side).toBe('R');
  });

  it('tamamen negatif', () => {
    const r = suggestDiagnosis({ dhR: f({}), dhL: f({}) });
    expect(r.negative).toBe(true);
    expect(r.suggestions).toHaveLength(0);
  });
});
