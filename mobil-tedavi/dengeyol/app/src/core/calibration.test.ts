import { describe, expect, it } from 'vitest';
import { computeCalibration, detectSign, rawToHeadUp } from './calibration';
import { angleBetween, IDENTITY, poseFromUp, upFromLying, upFromSitting, vec } from './geometry';
import { mul, rawFromHeadUp, readingRaw, rotX, rotY, rotZ, type PhoneModel } from './testkit';

const models: [string, PhoneModel][] = [
  ['Android, ekran dışa, düz', { sign: 1, facing: 'outward', mount: IDENTITY }],
  ['iOS (ters işaret), ekran dışa, düz', { sign: -1, facing: 'outward', mount: IDENTITY }],
  ['Android, ekran dışa, alın eğimi 20° + bükülme 10° + dönüklük 8°', { sign: 1, facing: 'outward', mount: mul(rotX(20), mul(rotZ(10), rotY(8))) }],
  ['iOS, ekran içe, eğik', { sign: -1, facing: 'inward', mount: mul(rotX(-15), mul(rotZ(-12), rotY(-6))) }],
  ['Android, ekran içe, düz', { sign: 1, facing: 'inward', mount: IDENTITY }]
];

describe.each(models)('%s', (_name, model) => {
  const sign = detectSign(readingRaw(model.sign));
  it('işaret kuralı okuma duruşundan doğru bulunur', () => {
    expect(sign).toBe(model.sign);
  });

  const upright = rawFromHeadUp(upFromSitting(0), model);
  const lookUp = rawFromHeadUp(upFromSitting(-35), model);
  const res = computeCalibration(sign!, upright, lookUp);

  it('kalibrasyon başarılı ve ekran yönü doğru', () => {
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.calibration.facing).toBe(model.facing);
  });

  it.each([
    [45, 25],
    [-45, 25],
    [-135, 0],
    [90, -20],
    [180, 0]
  ])('yatar θ=%d φ=%d doğru geri kazanılır (<0,5°)', (theta, phi) => {
    if (!res.ok) throw new Error('kalibrasyon başarısız');
    const truth = upFromLying(theta, phi);
    const est = rawToHeadUp(rawFromHeadUp(truth, model), res.calibration);
    expect(angleBetween(truth, est)).toBeLessThan(0.5);
  });
});

describe('kalibrasyon hata durumları', () => {
  const m: PhoneModel = { sign: 1, facing: 'outward', mount: IDENTITY };
  it('ters telefon', () => {
    const r = computeCalibration(1, vec(0, -9.81, 0), vec(0, -8, 5));
    expect(r).toEqual({ ok: false, error: 'PHONE_UPSIDE_DOWN' });
  });
  it('çok eğik telefon', () => {
    const r = computeCalibration(1, rawFromHeadUp(upFromSitting(0), { ...m, mount: rotX(60) }), rawFromHeadUp(upFromSitting(-35), { ...m, mount: rotX(60) }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('PHONE_NOT_VERTICAL');
  });
  it('yetersiz geriye bakış', () => {
    const r = computeCalibration(1, rawFromHeadUp(upFromSitting(0), m), rawFromHeadUp(upFromSitting(-8), m));
    expect(r).toEqual({ ok: false, error: 'NOT_ENOUGH_TILT' });
  });
  it('yana yatırma', () => {
    const r = computeCalibration(1, rawFromHeadUp(upFromSitting(0), m), rawFromHeadUp(upFromSitting(0, 35), m));
    expect(r).toEqual({ ok: false, error: 'SIDEWAYS_TILT' });
  });
  it('okuma duruşu belirsizse işaret bulunmaz', () => {
    expect(detectSign(vec(0, 0.5, 9.8))).toBeNull();
  });
});

describe('tavana bakışta başın yana yatması (tur 1 cihaz denetimi)', () => {
  const flat = { sign: 1 as const, facing: 'outward' as const, mount: rotX(0) };
  const rollUp = (look: number, roll: number) => {
    const u = upFromSitting(-look);
    const r = (roll * Math.PI) / 180;
    return { x: u.x * Math.cos(r) - u.y * Math.sin(r), y: u.x * Math.sin(r) + u.y * Math.cos(r), z: u.z };
  };
  const upright = rawFromHeadUp(upFromSitting(0), flat);
  it('25° bakışta 5° yana yatma (≈11° dönüş hatası üretirdi) reddedilir', () => {
    const r = computeCalibration(1, upright, rawFromHeadUp(rollUp(25, 5), flat));
    expect(r).toEqual({ ok: false, error: 'SIDEWAYS_TILT' });
  });
  it('35° bakışta 3° yana yatma kabul edilir ve dönüş hatası 10° altında kalır', () => {
    const r = computeCalibration(1, upright, rawFromHeadUp(rollUp(35, 3), flat));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const p = poseFromUp(rawToHeadUp(rawFromHeadUp(upFromLying(45, 25), flat), r.calibration));
    expect(Math.abs(p.theta - 45)).toBeLessThan(10);
  });
  it('20° bakış yetersiz sayılır (en az 25°)', () => {
    expect(computeCalibration(1, upright, rawFromHeadUp(upFromSitting(-20), flat))).toEqual({ ok: false, error: 'NOT_ENOUGH_TILT' });
  });
});
