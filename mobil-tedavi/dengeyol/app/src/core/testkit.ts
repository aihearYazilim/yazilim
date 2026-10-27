/** Test yardımcıları: gerçek baş pozundan telefonun ham ivme okumasını üreten ileri model. */
import { type Mat3, mulMatVec, normalize, scale, type Vec3, vec } from './geometry';
import { phoneToProvisionalHead, type Facing } from './calibration';

export function rotX(deg: number): Mat3 {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [1, 0, 0, 0, c, -s, 0, s, c];
}
export function rotY(deg: number): Mat3 {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
}
export function rotZ(deg: number): Mat3 {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}
export function mul(a: Mat3, b: Mat3): Mat3 {
  const m: number[] = [];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      let s = 0;
      for (let k = 0; k < 3; k++) s += a[i * 3 + k]! * b[k * 3 + j]!;
      m.push(s);
    }
  return m as Mat3;
}

export interface PhoneModel {
  /** İvmeölçer işaret kuralı: +1 Android/W3C (tepki kuvveti yukarı), −1 ters. */
  sign: 1 | -1;
  facing: Facing;
  /** Telefonun alındaki takılma rotasyonu (baş çerçevesinde). */
  mount: Mat3;
}

/** Baş çerçevesindeki dünya-yukarı vektöründen ham ivme okuması (m/s²). */
export function rawFromHeadUp(uHead: Vec3, m: PhoneModel): Vec3 {
  const provisional = mulMatVec(m.mount, normalize(uHead));
  const phoneUp = phoneToProvisionalHead(provisional, m.facing); // M kendi tersidir
  return scale(phoneUp, 9.81 * m.sign);
}

/** Okuma duruşu: telefon elde, ekran yüze dönük, ~40° geriye yatık (telefon çerçevesinde). */
export function readingRaw(sign: 1 | -1): Vec3 {
  return scale(vec(0, Math.cos((40 * Math.PI) / 180), Math.sin((40 * Math.PI) / 180)), 9.81 * sign);
}
