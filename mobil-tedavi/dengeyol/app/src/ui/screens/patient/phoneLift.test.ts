import { describe, expect, it } from 'vitest';
import { RAD, vec, type Vec3 } from '../../../core/geometry';
import { LIFT_ANGLE_DEG, LIFT_HOLD_MS, LIFT_REF_MS, PhoneLiftDetector } from './phoneLift';

/** y ekseninden x yönüne `deg` derece eğik yerçekimi (m/s²). */
const tilt = (deg: number): Vec3 => vec(9.81 * Math.sin(deg * RAD), 9.81 * Math.cos(deg * RAD), 0);

/** `from`–`to` ms arasında 20 ms arayla örnek verir; ilk true dönüşün anını döndürür (yoksa null). */
function feed(det: PhoneLiftDetector, g: (t: number) => Vec3, from: number, to: number): number | null {
  for (let t = from; t <= to; t += 20) if (det.push(g(t), t)) return t;
  return null;
}

describe('telefonun alından alınması (kullanıcı turu 4, k01)', () => {
  it('alında dururken (küçük titreşim) sezilmez', () => {
    const det = new PhoneLiftDetector();
    expect(feed(det, (t) => tilt(Math.sin(t / 50) * 4), 0, 5000)).toBeNull();
  });

  it('elde ekrana bakılacak biçimde eğilince, eğim sürerse bir kez sezilir', () => {
    const det = new PhoneLiftDetector();
    expect(feed(det, () => tilt(0), 0, 1000)).toBeNull();
    const at = feed(det, () => tilt(LIFT_ANGLE_DEG + 20), 1020, 3000);
    expect(at).not.toBeNull();
    expect(at! - 1020).toBeGreaterThanOrEqual(LIFT_HOLD_MS);
    // Bir kez: sonra hep false.
    expect(feed(det, () => tilt(80), 3020, 4000)).toBeNull();
  });

  it('kısa baş hareketi (eşikten kısa süre) sayılmaz', () => {
    const det = new PhoneLiftDetector();
    feed(det, () => tilt(0), 0, 1000);
    expect(feed(det, () => tilt(60), 1020, 1020 + LIFT_HOLD_MS - 100)).toBeNull();
    expect(feed(det, () => tilt(2), 1500, 3000)).toBeNull();
  });

  it('dayanak ilk örneklerin ortalaması: telefon yatay tutulmuşsa da eğim farkı sayılır', () => {
    const det = new PhoneLiftDetector();
    const onForehead = vec(9.81, 0, 0);
    expect(feed(det, () => onForehead, 0, LIFT_REF_MS + 200)).toBeNull();
    expect(feed(det, () => tilt(30), LIFT_REF_MS + 220, LIFT_REF_MS + 2000)).not.toBeNull();
  });

  it('geçersiz örnek yok sayılır', () => {
    const det = new PhoneLiftDetector();
    expect(det.push(vec(0, 0, 0), 0)).toBe(false);
    expect(det.push(vec(Number.NaN, 1, 0), 10)).toBe(false);
  });
});
