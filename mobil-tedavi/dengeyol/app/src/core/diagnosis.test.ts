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

  it('≥1 dk süren arka kanal → kupulolitiazis (olası)', () => {
    const r = suggestDiagnosis({ dhL: f({ nystagmus: 'upbeat-torsional', latencySec: 1, durationSec: 90 }), dhR: f({}) });
    expect(r.suggestions[0]).toMatchObject({ canal: 'PC', side: 'L', mechanism: 'cupulolithiasis', confidence: 'olası' });
    expect(r.suggestions[0]!.maneuvers[0]).toBe('semont');
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

describe('kullanıcı ajanı bulguları', () => {
  it('diğer tarafta saf aşağı vuran nistagmus varken arka kanal "tipik" sayılmaz', () => {
    const r = suggestDiagnosis({
      dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 3, durationSec: 20, vertigo: true }),
      dhL: f({ nystagmus: 'downbeat-pure' })
    });
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.suggestions.find((s) => s.canal === 'PC')!.confidence).toBe('olası');
  });
  it('gecikmesiz ve uzun arka kanal yanıtında uyarı verilir', () => {
    const r = suggestDiagnosis({ dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 0, durationSec: 95 }) });
    expect(r.warnings.some((w) => w.includes('kupulolitiazisi'))).toBe(true);
  });
  it('apogeotropik roll: bir tarafın şiddeti girilmemişse taraf seçilmez', () => {
    const r = suggestDiagnosis({
      rollR: f({ nystagmus: 'horizontal-apogeotropic', intensity: 2, durationSec: 70 }),
      rollL: f({ nystagmus: 'horizontal-apogeotropic', intensity: 0, durationSec: 70 })
    });
    const hc = r.suggestions.find((s) => s.canal === 'HC')!;
    expect(hc.side).toBeNull();
    expect(hc.maneuvers).toEqual([]);
  });
});

describe('tur 1 klinik denetim', () => {
  it('gecikmesi kaydedilmemiş arka kanal yanıtı "tipik" sayılmaz', () => {
    const r = suggestDiagnosis({ dhR: f({ nystagmus: 'upbeat-torsional', latencySec: null, durationSec: 20 }) });
    expect(r.suggestions[0]!.confidence).toBe('olası');
  });
  it('≥1 dk geotropik yatay nistagmus "tipik" değil ve uyarı verir', () => {
    const r = suggestDiagnosis({
      rollR: f({ nystagmus: 'horizontal-geotropic', intensity: 3, durationSec: 75 }),
      rollL: f({ nystagmus: 'horizontal-geotropic', intensity: 1, durationSec: 70 })
    });
    expect(r.suggestions[0]!.confidence).toBe('olası');
    expect(r.warnings.some((w) => w.includes('hafif kupula'))).toBe(true);
  });
  it('<1 dk apogeotropik nistagmus "tipik" değil', () => {
    const r = suggestDiagnosis({
      rollR: f({ nystagmus: 'horizontal-apogeotropic', intensity: 3, durationSec: 30 }),
      rollL: f({ nystagmus: 'horizontal-apogeotropic', intensity: 1, durationSec: 30 })
    });
    expect(r.suggestions[0]!.confidence).toBe('olası');
  });
  it('arka ve yatay kanal birlikte: çok kanallı uyarısı, hiçbiri tipik değil', () => {
    const r = suggestDiagnosis({
      dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 3, durationSec: 20 }),
      rollR: f({ nystagmus: 'horizontal-geotropic', intensity: 3, durationSec: 30 }),
      rollL: f({ nystagmus: 'horizontal-geotropic', intensity: 1, durationSec: 30 })
    });
    expect(r.warnings.some((w) => w.includes('çok kanallı'))).toBe(true);
    expect(r.suggestions.every((s) => s.confidence !== 'tipik')).toBe(true);
  });
});

describe('tur 2 klinisyen: yatay kanal tarafı', () => {
  it('yalnız bir tarafta apogeotropik nistagmus kaydedildiyse taraf seçilmez (yanlış Gufoni önlenir)', () => {
    const r = suggestDiagnosis({ rollR: f({ nystagmus: 'horizontal-apogeotropic', intensity: 2, durationSec: 70 }) });
    const hc = r.suggestions.find((s) => s.canal === 'HC')!;
    expect(hc.side).toBeNull();
    expect(hc.maneuvers).toEqual([]);
  });
  it('yalnız bir tarafta geotropik kayıt: taraf seçilmez', () => {
    const r = suggestDiagnosis({ rollR: f({ nystagmus: 'horizontal-geotropic', intensity: 3, durationSec: 30 }), rollL: f({}) });
    expect(r.suggestions.find((s) => s.canal === 'HC')!.side).toBeNull();
  });
});

describe('tur 3 klinik onay', () => {
  it('karşı taraf test edilmeden arka kanal "tipik" sayılmaz', () => {
    const r = suggestDiagnosis({ dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 3, durationSec: 20 }) });
    expect(r.suggestions[0]!.confidence).toBe('olası');
  });
  it('iki taraflı arka kanal dalında ≥1 dk yanıt uyarı verir', () => {
    const r = suggestDiagnosis({
      dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 3, durationSec: 80 }),
      dhL: f({ nystagmus: 'upbeat-torsional', latencySec: 3, durationSec: 20 })
    });
    expect(r.warnings.some((w) => w.includes('≥1 dk'))).toBe(true);
  });
  it('uyumsuz desen boş ekran bırakmaz', () => {
    const r = suggestDiagnosis({ rollR: f({ nystagmus: 'upbeat-torsional', durationSec: 20 }), rollL: f({}) });
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});
