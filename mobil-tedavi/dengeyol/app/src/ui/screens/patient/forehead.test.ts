import { describe, expect, it } from 'vitest';
import { RAD, vec, type Vec3 } from '../../../core/geometry';
import { ForeheadDetector, HOLD_MS, tiltFromVertical } from './forehead';

/** Dikeyden (y ekseni) z yönüne `deg` derece geriye yatık yerçekimi (m/s²); sign: iOS'taki ters işaret. */
const tilt = (deg: number, sign = 1): Vec3 => vec(0, sign * 9.81 * Math.cos(deg * RAD), 9.81 * Math.sin(deg * RAD));

function feed(det: ForeheadDetector, g: (t: number) => Vec3, from: number, to: number): number | null {
  for (let t = from; t <= to; t += 20) if (det.push(g(t), t)) return t;
  return null;
}

describe('telefonun alına konduğunu sezme (L5-4, y07)', () => {
  it('dik ve sabit telefon HOLD_MS sonra alında sayılır (iOS ters işaretinde de)', () => {
    for (const sign of [1, -1]) {
      const det = new ForeheadDetector();
      const t = feed(det, (t) => tilt(5 + Math.sin(t / 60), sign), 0, 4000);
      expect(t).not.toBeNull();
      expect(t!).toBeGreaterThanOrEqual(HOLD_MS);
    }
  });

  it('elde okuma duruşu (40° geriye yatık) ve masada yatay telefon alında sayılmaz', () => {
    expect(feed(new ForeheadDetector(), () => tilt(40), 0, 5000)).toBeNull();
    expect(feed(new ForeheadDetector(), () => tilt(88), 0, 5000)).toBeNull();
    expect(tiltFromVertical(tilt(40))).toBeCloseTo(40, 5);
  });

  it('dik ama sallanan telefon (elde yürürken) sabit sayılmaz; telefon alından inince hemen çıkar', () => {
    expect(feed(new ForeheadDetector(), (t) => tilt(t % 400 < 200 ? 2 : 14), 0, 5000)).toBeNull();
    const det = new ForeheadDetector();
    feed(det, () => tilt(3), 0, 2000);
    expect(det.active).toBe(true);
    // Küçük kıpırtı (20°) eşiği aşmaz; 40° (ekrana bakmak için indirme) çıkarır.
    expect(det.push(tilt(20), 2020)).toBe(true);
    expect(det.push(tilt(40), 2040)).toBe(false);
    expect(det.active).toBe(false);
  });

  it('geçersiz örnek durumu değiştirmez', () => {
    const det = new ForeheadDetector();
    expect(det.push(vec(NaN, 1, 0), 0)).toBe(false);
    expect(det.push(vec(0, 0, 0), 20)).toBe(false);
  });
});
