/**
 * Sensör örnekleri → kalibre baş pozu. Sarsıntı (telefonun alından kayması/düşmesi) tespiti.
 */
import { type Calibration, rawToHeadUp } from '../core/calibration';
import { type HeadPose, LowPassVec, poseFromUp, type Vec3 } from '../core/geometry';
import type { MotionSample, MotionSource } from './motion';

/** Doğrusal ivme bu değeri aşarsa (≈1,5 g) "sarsıntı" sayılır. */
export const SHOCK_THRESHOLD = 15;

export class PoseTracker {
  private lp = new LowPassVec(0.35);
  private lastPose: HeadPose | null = null;
  private lastAt = 0;
  private shockListeners = new Set<() => void>();
  private unsub: (() => void) | null = null;
  private lastShockAt = 0;

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
    if (s.linearMag !== null && s.linearMag > SHOCK_THRESHOLD && s.t - this.lastShockAt > 2000) {
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
      resolve({ mean, count: samples.length, maxDevDeg: maxDev });
    }, ms);
  });
}
