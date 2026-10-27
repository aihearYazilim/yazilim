/**
 * Hareket sensörü kaynakları.
 *
 * WebMotionSource: DeviceMotionEvent (accelerationIncludingGravity). Destekleyen cihazlarda `acceleration`
 * (yerçekimsiz) de verilir; yerçekimi = toplam − doğrusal ivme olarak temiz biçimde ayrıştırılır. Yoksa
 * düşük geçiren süzgeç kullanılır. iOS 13+ izin ister (kullanıcı dokunuşuyla).
 *
 * SimulatedMotionSource: Demo ve testler için; ekrandaki kontrollerle sanal bir baş pozu üretir.
 */
import { add, LowPassVec, norm, scale, sub, type Vec3, vec } from '../core/geometry';
import { phoneToProvisionalHead } from '../core/calibration';

export interface MotionSample {
  /** Yerçekimi tepki vektörü (telefon çerçevesi, m/s²; işaret kuralı cihaza bağlı). */
  gravity: Vec3;
  /** Doğrusal ivme büyüklüğü (m/s²) — sarsıntı tespiti için; bilinmiyorsa null. */
  linearMag: number | null;
  t: number;
}

export type StartResult = 'ok' | 'denied' | 'unsupported' | 'no-data';

export interface MotionSource {
  readonly kind: 'device' | 'simulated';
  start(): Promise<StartResult>;
  stop(): void;
  subscribe(cb: (s: MotionSample) => void): () => void;
  /** Son örnek. */
  latest(): MotionSample | null;
}

type PermissionFn = () => Promise<'granted' | 'denied'>;

/** iOS'ta hareket sensörü izni gerekir mi? */
export function motionPermissionRequired(): boolean {
  const D = (globalThis as unknown as { DeviceMotionEvent?: { requestPermission?: PermissionFn } }).DeviceMotionEvent;
  return typeof D?.requestPermission === 'function';
}

/** Kullanıcı dokunuşu içinde çağrılmalıdır. */
export async function requestMotionPermission(): Promise<boolean> {
  const D = (globalThis as unknown as { DeviceMotionEvent?: { requestPermission?: PermissionFn } }).DeviceMotionEvent;
  if (typeof D?.requestPermission !== 'function') return true;
  try {
    return (await D.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

export class WebMotionSource implements MotionSource {
  readonly kind = 'device' as const;
  private listeners = new Set<(s: MotionSample) => void>();
  private last: MotionSample | null = null;
  private lp = new LowPassVec(0.15);
  private handler = (e: DeviceMotionEvent) => this.onEvent(e);
  private running = false;

  async start(): Promise<StartResult> {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return 'unsupported';
    if (motionPermissionRequired()) {
      const ok = await requestMotionPermission();
      if (!ok) return 'denied';
    }
    if (!this.running) {
      window.addEventListener('devicemotion', this.handler);
      this.running = true;
    }
    // Veri geliyor mu? (Masaüstü tarayıcılar olayı destekler ama veri göndermez.)
    const got = await new Promise<boolean>((resolve) => {
      if (this.last) return resolve(true);
      const timer = setTimeout(() => {
        off();
        resolve(false);
      }, 1500);
      const off = this.subscribe(() => {
        clearTimeout(timer);
        off();
        resolve(true);
      });
    });
    return got ? 'ok' : 'no-data';
  }

  stop(): void {
    if (this.running) window.removeEventListener('devicemotion', this.handler);
    this.running = false;
  }

  subscribe(cb: (s: MotionSample) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  latest(): MotionSample | null {
    return this.last;
  }

  private onEvent(e: DeviceMotionEvent) {
    const g = e.accelerationIncludingGravity;
    if (!g || g.x === null || g.y === null || g.z === null) return;
    const total = vec(g.x, g.y, g.z);
    const a = e.acceleration;
    let gravity: Vec3;
    let linearMag: number | null = null;
    if (a && a.x !== null && a.y !== null && a.z !== null) {
      const lin = vec(a.x, a.y, a.z);
      linearMag = norm(lin);
      // accelerationIncludingGravity = acceleration + yerçekimi tepkisi (işaret kuralından bağımsız tutarlıdır)
      gravity = this.lp.push(sub(total, lin));
    } else {
      gravity = this.lp.push(total);
    }
    if (!(norm(gravity) > 1)) return;
    const sample: MotionSample = { gravity, linearMag, t: performance.now() };
    this.last = sample;
    this.listeners.forEach((l) => l(sample));
  }
}

/** Sanal baş: dünya-yukarı vektörü baş çerçevesinde ayarlanır; telefon ekranı dışa, işaret +1 kabul edilir. */
export class SimulatedMotionSource implements MotionSource {
  readonly kind = 'simulated' as const;
  private listeners = new Set<(s: MotionSample) => void>();
  private last: MotionSample | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  /** "Okuma" kipi: telefon elde, ekran yüze dönük (kalibrasyonda işaret belirleme). */
  reading = true;
  private headUp: Vec3 = vec(0, 1, 0);
  private jitterDeg = 0.6;

  setHeadUp(u: Vec3) {
    this.headUp = u;
  }

  getHeadUp(): Vec3 {
    return this.headUp;
  }

  async start(): Promise<StartResult> {
    if (!this.timer) this.timer = setInterval(() => this.emit(), 33);
    return 'ok';
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  subscribe(cb: (s: MotionSample) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  latest(): MotionSample | null {
    return this.last;
  }

  private emit() {
    let phoneUp: Vec3;
    if (this.reading) {
      phoneUp = vec(0, Math.cos(0.7), Math.sin(0.7));
    } else {
      phoneUp = phoneToProvisionalHead(this.headUp, 'outward');
    }
    const j = (this.jitterDeg * Math.PI) / 180;
    const noise = vec((Math.random() - 0.5) * j, (Math.random() - 0.5) * j, (Math.random() - 0.5) * j);
    const gravity = scale(add(phoneUp, noise), 9.81);
    const sample: MotionSample = { gravity, linearMag: 0.05, t: performance.now() };
    this.last = sample;
    this.listeners.forEach((l) => l(sample));
  }
}
