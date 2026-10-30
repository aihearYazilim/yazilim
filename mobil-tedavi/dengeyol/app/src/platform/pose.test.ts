import { describe, expect, it } from 'vitest';
import { computeCalibration } from '../core/calibration';
import { upFromSitting, vec } from '../core/geometry';
import { rawFromHeadUp, rotX } from '../core/testkit';
import type { MotionSample, MotionSource } from './motion';
import { PoseTracker } from './pose';

function fakeSource() {
  const ls = new Set<(s: MotionSample) => void>();
  const src = {
    kind: 'device',
    start: async () => 'ok',
    stop: () => undefined,
    latest: () => null,
    subscribe: (cb: (s: MotionSample) => void) => {
      ls.add(cb);
      return () => ls.delete(cb);
    }
  } as unknown as MotionSource;
  return { src, emit: (s: MotionSample) => ls.forEach((l) => l(s)) };
}

const m = { sign: 1 as const, facing: 'outward' as const, mount: rotX(0) };
const cal = (() => {
  const r = computeCalibration(1, rawFromHeadUp(upFromSitting(0), m), rawFromHeadUp(upFromSitting(-35), m));
  if (!r.ok) throw new Error('kalibrasyon');
  return r.calibration;
})();

describe('düşme ve sarsıntı algılama', () => {
  it('serbest düşüş (ham ivme ≈0) art arda 3 örnekte sarsıntı sayılır', () => {
    const { src, emit } = fakeSource();
    const tr = new PoseTracker(src, cal);
    tr.start();
    let shocks = 0;
    tr.onShock(() => shocks++);
    const g = rawFromHeadUp(upFromSitting(0), m);
    for (let i = 0; i < 3; i++) emit({ gravity: g, linearMag: 0.1, rawMag: 0.5, t: 3000 + i * 16 });
    expect(shocks).toBe(1);
  });
  it('doğrusal ivmesi bilinmeyen cihazda ham büyüklükteki büyük sapma sarsıntı sayılır', () => {
    const { src, emit } = fakeSource();
    const tr = new PoseTracker(src, cal);
    tr.start();
    let shocks = 0;
    tr.onShock(() => shocks++);
    emit({ gravity: vec(0, 9.81, 0), linearMag: null, rawMag: 19, t: 3000 });
    expect(shocks).toBe(1);
  });
  it('olağan hareket sarsıntı sayılmaz', () => {
    const { src, emit } = fakeSource();
    const tr = new PoseTracker(src, cal);
    tr.start();
    let shocks = 0;
    tr.onShock(() => shocks++);
    for (let i = 0; i < 20; i++) emit({ gravity: vec(0, 9.81, 0), linearMag: 1.5, rawMag: 10.5, t: 3000 + i * 16 });
    expect(shocks).toBe(0);
  });
});
