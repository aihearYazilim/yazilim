/**
 * Sensör örnekleri → kalibre baş pozu. Sarsıntı (telefonun alından kayması/düşmesi) tespiti.
 */
import { type Calibration, rawToHeadUp } from '../core/calibration';
import { type HeadPose, LowPassVec, poseFromUp, type Vec3 } from '../core/geometry';
import type { MotionSample, MotionSource } from './motion';

/** Doğrusal ivme bu değeri aşarsa (≈1,5 g) "sarsıntı" sayılır. */
export const SHOCK_THRESHOLD = 15;
/** Ham toplam ivme bunun altına düşerse serbest düşüş (telefon alından kaydı). */
export const FREE_FALL_MAX = 4;
/** Doğrusal ivme bilinmeyen cihazlarda: ham büyüklüğün 1 g'den bu kadar sapması çarpma sayılır. */
export const RAW_IMPACT_DEV = 8;

export class PoseTracker {
  private lp = new LowPassVec(0.35);
  private lastPose: HeadPose | null = null;
  private lastAt = 0;
  private shockListeners = new Set<() => void>();
  private unsub: (() => void) | null = null;
  private lastShockAt = 0;
  private lowCount = 0;

  constructor(
    private source: MotionSource,
    private cal: Calibration
  ) {}

  start() {
    this.unsub = this.source.subscribe((s) => this.onSample(s));
  }

  stop() {
    this.unsub?.();
    this.unsub = null;
  }

  onShock(cb: () => void) {
    this.shockListeners.add(cb);
    return () => this.shockListeners.delete(cb);
  }

  /** Son poz; 1,5 s'den eskiyse null. */
  pose(now = performance.now()): HeadPose | null {
    if (!this.lastPose || now - this.lastAt > 1500) return null;
    return this.lastPose;
  }

  private onSample(s: MotionSample) {
    let up: Vec3;
    try {
      up = rawToHeadUp(s.gravity, this.cal);
    } catch {
      return;
    }
    const sm = this.lp.push(up);
    try {
      this.lastPose = poseFromUp(sm);
      this.lastAt = s.t;
    } catch {
      /* yok say */
    }
    // Sarsıntı / düşme: doğrusal ivme yüksek, ya da (doğrusal ivme bilinmiyorsa) ham büyüklük 1 g'den çok sapmış,
    // ya da art arda örneklerde serbest düşüş. Yumuşak yatağa düşüş çarpması 15 m/s²'nin altında kalabilir; serbest düşüş yakalar.
    this.lowCount = s.rawMag !== undefined && s.rawMag < FREE_FALL_MAX ? this.lowCount + 1 : 0;
    const impact =
      (s.linearMag !== null && s.linearMag > SHOCK_THRESHOLD) ||
      (s.linearMag === null && s.rawMag !== undefined && Math.abs(s.rawMag - 9.81) > RAW_IMPACT_DEV) ||
      this.lowCount >= 3;
    if (impact && s.t - this.lastShockAt > 2000) {
      this.lastShockAt = s.t;
      this.shockListeners.forEach((l) => l());
    }
  }
}

/** Belirli süre boyunca örneklerin ortalamasını ve kararlılığını ölçer (kalibrasyon için). */
export function collectSamples(
  source: MotionSource,
  ms: number
): Promise<{ mean: Vec3; count: number; maxDevDeg: number } | null> {
  return new Promise((resolve) => {
    const samples: Vec3[] = [];
    const off = source.subscribe((s) => samples.push(s.gravity));
    setTimeout(() => {
      off();
      if (samples.length < 5) return resolve(null);
      const m = samples.reduce((a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }), { x: 0, y: 0, z: 0 });
      const mean = { x: m.x / samples.length, y: m.y / samples.length, z: m.z / samples.length };
      const mn = Math.hypot(mean.x, mean.y, mean.z);
      let maxDev = 0;
      for (const v of samples) {
        const vn = Math.hypot(v.x, v.y, v.z);
        const c = (v.x * mean.x + v.y * mean.y + v.z * mean.z) / (vn * mn);
        maxDev = Math.max(maxDev, (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI);
      }
      // Yavaş kayma: pencerenin başı ile sonu arasındaki açı da kararlılığa katılır (ör. 1,5 s'de 12° kayma reddedilsin).
      const k = Math.min(3, Math.floor(samples.length / 3));
      const avg = (arr: Vec3[]) => arr.reduce((a, b) => ({ x: a.x + b.x / arr.length, y: a.y + b.y / arr.length, z: a.z + b.z / arr.length }), { x: 0, y: 0, z: 0 });
      const a0 = avg(samples.slice(0, k));
      const a1 = avg(samples.slice(-k));
      const c01 = (a0.x * a1.x + a0.y * a1.y + a0.z * a1.z) / (Math.hypot(a0.x, a0.y, a0.z) * Math.hypot(a1.x, a1.y, a1.z));
      const drift = (Math.acos(Math.max(-1, Math.min(1, c01))) * 180) / Math.PI;
      resolve({ mean, count: samples.length, maxDevDeg: Math.max(maxDev, drift) });
    }, ms);
  });
}
