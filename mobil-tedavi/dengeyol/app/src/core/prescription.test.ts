import { describe, expect, it } from 'vitest';
import { decodePrescription, encodePrescription, type Prescription, prescriptionUrl } from './prescription';

const p: Prescription = {
  v: 1,
  side: 'L',
  canal: 'PC',
  maneuver: 'epley',
  date: '2026-10-27',
  by: 'Odyolog Ayşe Yılmaz',
  clinic: 'Örnek KBB Kliniği',
  perDay: 3,
  days: 5,
  note: 'Sabah ve akşam'
};

describe('reçete', () => {
  it('gidiş-dönüş (Türkçe karakterler korunur)', () => {
    const d = decodePrescription(encodePrescription(p));
    expect(d).toEqual({ ok: true, value: p });
  });
  it('değiştirilmiş bağlantı reddedilir', () => {
    const tok = encodePrescription(p);
    const bad = tok.slice(0, 5) + (tok[5] === 'A' ? 'B' : 'A') + tok.slice(6);
    expect(decodePrescription(bad)).toMatchObject({ ok: false, error: 'CHECKSUM' });
  });
  it('doz üst sınıra çekilir', () => {
    const d = decodePrescription(encodePrescription({ ...p, perDay: 9, days: 20 }));
    expect(d.ok && d.value.perDay).toBe(3);
    expect(d.ok && d.value.days).toBe(7);
  });
  it('biçimsiz giriş', () => {
    expect(decodePrescription('abc')).toMatchObject({ ok: false, error: 'FORMAT' });
  });
  it('URL üretimi mevcut hash\'i atar', () => {
    expect(prescriptionUrl('https://x.org/app/#/hasta', p)).toMatch(/^https:\/\/x\.org\/app\/#\/recete\//);
  });
});
