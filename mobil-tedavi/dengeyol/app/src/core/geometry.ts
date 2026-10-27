/**
 * Baş yönü geometrisi.
 *
 * BAŞ KOORDİNAT SİSTEMİ (hastanın kendi bedenine göre):
 *   x → sağ kulak yönü
 *   y → başın tepesi (vertex) yönü
 *   z → burun yönü (yüzün baktığı yön)
 *
 * Telefon yalnızca yerçekimini ölçer. "up" vektörü = dünyanın yukarı yönünün baş koordinatlarındaki ifadesi.
 * Bütün manevra pozisyonları yerçekimine göre tanımlıdır; bu yüzden tek bir up vektörü yeterlidir.
 *
 * YATAR POZİSYON PARAMETRELERİ
 *   θ (theta): beden ekseni etrafında baş dönüşü. 0 = yüz tavana, +90 = sağ kulak altta,
 *              −90 = sol kulak altta, ±180 = yüz yere. Pozitif yön = "sağa çevirme".
 *   φ (phi):   baş ekstansiyonu. + = baş geriye sarkık (tepe yataktan aşağıda), − = çene göğse (fleksiyon).
 *   up = (−sinθ·cosφ, −sinφ, cosθ·cosφ)
 *
 * OTURUR POZİSYON PARAMETRELERİ
 *   ψ (psi): öne eğilme. + = çene göğse, − = tavana bakma.   up = (0, cosψ, −sinψ)
 *   λ (lambda): yana eğilme. + = sağ kulak omza.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const DEG = 180 / Math.PI;
export const RAD = Math.PI / 180;

export const vec = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
export const add = (a: Vec3, b: Vec3): Vec3 => vec(a.x + b.x, a.y + b.y, a.z + b.z);
export const sub = (a: Vec3, b: Vec3): Vec3 => vec(a.x - b.x, a.y - b.y, a.z - b.z);
export const scale = (a: Vec3, k: number): Vec3 => vec(a.x * k, a.y * k, a.z * k);
export const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a: Vec3, b: Vec3): Vec3 =>
  vec(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
export const norm = (a: Vec3): number => Math.hypot(a.x, a.y, a.z);

export function normalize(a: Vec3): Vec3 {
  const n = norm(a);
  if (!(n > 1e-9)) throw new Error('Sıfır uzunlukta vektör normalize edilemez');
  return scale(a, 1 / n);
}

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** İki vektör arasındaki açı (derece, 0–180). */
export function angleBetween(a: Vec3, b: Vec3): number {
  return Math.acos(clamp(dot(normalize(a), normalize(b)), -1, 1)) * DEG;
}

/** Açıyı (−180, 180] aralığına sarar. */
export function wrapDeg(a: number): number {
  let r = (((a + 180) % 360) + 360) % 360 - 180;
  if (r === -180) r = 180;
  return r;
}

/** current'tan target'a en kısa yoldan işaretli fark (derece). Pozitif = θ artmalı (sağa çevir). */
export function angleDiff(target: number, current: number): number {
  return wrapDeg(target - current);
}

export interface HeadPose {
  /** Dünyanın yukarı yönü, baş koordinatlarında (birim vektör). */
  up: Vec3;
  /** Yatar θ (derece, (−180,180]). Baş dik dururken anlamsızdır. */
  theta: number;
  /** Yatar φ (derece). */
  phi: number;
  /** Oturur ψ (derece). */
  psi: number;
  /** Oturur λ (derece). */
  lambda: number;
  /** Başın dikliği: tepe ile dünya-yukarı arasındaki açı (0 = tam dik, 90 = yatay, 180 = baş aşağı). */
  tiltFromUpright: number;
}

export function poseFromUp(upRaw: Vec3): HeadPose {
  const u = normalize(upRaw);
  const phi = Math.asin(clamp(-u.y, -1, 1)) * DEG;
  const horiz = Math.hypot(u.x, u.z);
  const theta = horiz < 1e-6 ? 0 : wrapDeg(Math.atan2(-u.x, u.z) * DEG);
  const psi = Math.atan2(-u.z, u.y) * DEG;
  const lambda = Math.atan2(-u.x, u.y) * DEG;
  const tiltFromUpright = Math.acos(clamp(u.y, -1, 1)) * DEG;
  return { up: u, theta, phi, psi, lambda, tiltFromUpright };
}

/** Yatar pozisyon için up vektörü (testlerde ve hedef tanımında kullanılır). */
export function upFromLying(thetaDeg: number, phiDeg: number): Vec3 {
  const t = thetaDeg * RAD;
  const p = phiDeg * RAD;
  return vec(-Math.sin(t) * Math.cos(p), -Math.sin(p), Math.cos(t) * Math.cos(p));
}

/** Oturur pozisyon için up vektörü. */
export function upFromSitting(psiDeg: number, lambdaDeg = 0): Vec3 {
  const p = psiDeg * RAD;
  const l = lambdaDeg * RAD;
  // Önce öne eğilme (x ekseni etrafında), sonra yana eğilme (z ekseni etrafında) — küçük açılar için yeterli.
  const base = vec(0, Math.cos(p), -Math.sin(p));
  return normalize(vec(-Math.sin(l) * base.y, Math.cos(l) * base.y, base.z));
}

/** 3×3 matris (satır öncelikli). */
export type Mat3 = [number, number, number, number, number, number, number, number, number];

export const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export function mulMatVec(m: Mat3, v: Vec3): Vec3 {
  return vec(
    m[0] * v.x + m[1] * v.y + m[2] * v.z,
    m[3] * v.x + m[4] * v.y + m[5] * v.z,
    m[6] * v.x + m[7] * v.y + m[8] * v.z
  );
}

/** Sütunları a,b,c olan matris ile sütunları d,e,f olan matrisin devriğinin çarpımı: [a b c]·[d e f]ᵀ */
export function outerBasis(a: Vec3, b: Vec3, c: Vec3, d: Vec3, e: Vec3, f: Vec3): Mat3 {
  const cols = [a, b, c];
  const rows = [d, e, f];
  const m: number[] = [];
  const comp = (v: Vec3, i: number) => (i === 0 ? v.x : i === 1 ? v.y : v.z);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let s = 0;
      for (let k = 0; k < 3; k++) s += comp(cols[k]!, i) * comp(rows[k]!, j);
      m.push(s);
    }
  }
  return m as Mat3;
}

/** Üstel düşük geçiren süzgeç (yerçekimi tahmini için). */
export class LowPassVec {
  private state: Vec3 | null = null;
  constructor(private readonly alpha: number) {}
  push(v: Vec3): Vec3 {
    this.state = this.state ? add(scale(this.state, 1 - this.alpha), scale(v, this.alpha)) : v;
    return this.state;
  }
  reset(): void {
    this.state = null;
  }
  get value(): Vec3 | null {
    return this.state;
  }
}
