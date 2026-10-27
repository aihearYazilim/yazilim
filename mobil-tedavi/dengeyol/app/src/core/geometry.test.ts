import { describe, expect, it } from 'vitest';
import { angleBetween, angleDiff, poseFromUp, upFromLying, upFromSitting, vec, wrapDeg } from './geometry';

describe('açı yardımcıları', () => {
  it('wrapDeg (−180,180] aralığına sarar', () => {
    expect(wrapDeg(190)).toBe(-170);
    expect(wrapDeg(-190)).toBe(170);
    expect(wrapDeg(180)).toBe(180);
    expect(wrapDeg(-180)).toBe(180);
    expect(wrapDeg(540)).toBe(180);
  });
  it('angleDiff en kısa yolu verir', () => {
    expect(angleDiff(-135, 170)).toBe(55);
    expect(angleDiff(170, -135)).toBe(-55);
    expect(angleDiff(45, -45)).toBe(90);
  });
});

describe('poz hesaplama', () => {
  const cases: [number, number][] = [
    [0, 0],
    [45, 20],
    [-45, 25],
    [-135, 0],
    [135, -10],
    [90, -30],
    [-90, 10],
    [180, 0]
  ];
  it.each(cases)('yatar θ=%d φ=%d gidiş-dönüş', (theta, phi) => {
    const p = poseFromUp(upFromLying(theta, phi));
    expect(p.phi).toBeCloseTo(phi, 6);
    expect(Math.abs(angleDiff(theta, p.theta))).toBeLessThan(1e-6);
    expect(p.tiltFromUpright).toBeGreaterThan(45);
  });

  it('sırtüstü, baş sağa çevrili: dünya-yukarı sol kulak ile burun arasında', () => {
    const u = upFromLying(45, 0);
    expect(u.x).toBeLessThan(0); // sol kulak yönü
    expect(u.z).toBeGreaterThan(0); // burun yönü
  });

  it('sarkık baş: yukarı vektörü çeneye doğru eğilir', () => {
    expect(upFromLying(0, 20).y).toBeLessThan(0);
  });

  it('oturur ψ gidiş-dönüş ve diklik', () => {
    for (const psi of [-30, 0, 20, 40]) {
      const p = poseFromUp(upFromSitting(psi));
      expect(p.psi).toBeCloseTo(psi, 6);
      expect(p.tiltFromUpright).toBeCloseTo(Math.abs(psi), 6);
    }
  });

  it('çene göğse (oturur ψ>0): yukarı vektörü başın arkasına eğilir', () => {
    expect(upFromSitting(30).z).toBeLessThan(0);
  });

  it('angleBetween', () => {
    expect(angleBetween(vec(1, 0, 0), vec(0, 1, 0))).toBeCloseTo(90, 6);
  });
});
