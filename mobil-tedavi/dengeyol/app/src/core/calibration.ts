/**
 * Telefon → baş kalibrasyonu.
 *
 * Sorunlar ve çözümler:
 * 1) İşaret kuralı: Android Chrome düz duran telefonda accelerationIncludingGravity.z ≈ +9,8 verir (W3C);
 *    iOS Safari tarihsel olarak ters işaret verir. Çözüm: kullanıcı ekranı normal okurken (telefonun üst kenarı
 *    alt kenarından yüksekken) alınan örnekte y bileşeninin işareti, "yukarı" yönün işaretini belirler.
 * 2) Ekran yönü: Telefon alna ekran dışa (önerilen) ya da ekran içe dayanabilir. Çözüm: kullanıcı dik otururken
 *    bir örnek, sonra başını geriye yatırıp tavana bakarken ikinci örnek. Tavana bakınca dünya-yukarı yönü burna
 *    yaklaşır; z bileşeninin hangi yönde arttığı ekranın yönünü verir.
 * 3) Alın eğimi ve telefonun alındaki küçük dönüklüğü: İki örnekten (TRIAD yöntemi) bir düzeltme rotasyonu
 *    hesaplanır; böylece "dik ve düz bakış" tam olarak baş nötr pozisyonu sayılır.
 */
import {
  angleBetween,
  cross,
  DEG,
  dot,
  type Mat3,
  mulMatVec,
  normalize,
  outerBasis,
  sub,
  scale,
  vec,
  type Vec3
} from './geometry';

export type Facing = 'outward' | 'inward';

export interface Calibration {
  /** Ham ivme vektörünü "dünya-yukarı" yönüne çeviren işaret. */
  sign: 1 | -1;
  facing: Facing;
  /** Geçici baş çerçevesinden gerçek baş çerçevesine düzeltme. */
  matrix: Mat3;
  /** Telefonun alındaki eğikliği (bilgi amaçlı, derece). */
  mountTiltDeg: number;
  createdAt: string;
}

export type CalibrationError =
  | 'NO_DATA'
  | 'SIGN_AMBIGUOUS'
  | 'PHONE_UPSIDE_DOWN'
  | 'PHONE_NOT_VERTICAL'
  | 'NOT_ENOUGH_TILT'
  | 'TOO_MUCH_TILT'
  | 'SIDEWAYS_TILT';

export type CalibrationResult =
  | { ok: true; calibration: Calibration }
  | { ok: false; error: CalibrationError };

export const CALIBRATION_LIMITS = {
  /** Okuma duruşunda y bileşeninin en az bu oranda olması gerekir (işaret belirleme). */
  signMinFraction: 0.35,
  /** Alındaki telefonun dikeyle yaptığı açı bundan büyükse tekrar yerleştirilmesi istenir. */
  maxMountTiltDeg: 40,
  /** Tavana bakış en az bu kadar baş hareketi üretmeli. */
  minLookUpDeg: 15,
  maxLookUpDeg: 85,
  /** Tavana bakarken yana kayma bu oranı geçmemeli (başı yana yatırmış olabilir). */
  maxSidewaysFraction: 0.6
} as const;

/** Okuma duruşundaki örnekten işaret kuralını belirler. */
export function detectSign(readingSample: Vec3): 1 | -1 | null {
  const n = Math.hypot(readingSample.x, readingSample.y, readingSample.z);
  if (!(n > 1)) return null;
  const fy = readingSample.y / n;
  if (Math.abs(fy) < CALIBRATION_LIMITS.signMinFraction) return null;
  return fy > 0 ? 1 : -1;
}

/** Telefon çerçevesindeki "yukarı" vektörünü ekran yönüne göre geçici baş çerçevesine çevirir. */
export function phoneToProvisionalHead(p: Vec3, facing: Facing): Vec3 {
  // Ekran dışa: telefon z = burun, y = tepe, x = hastanın SOL kulağı (karşıdan bakan kişinin sağı).
  // Ekran içe: telefon z = başın içine (−burun), y = tepe, x = hastanın SAĞ kulağı.
  return facing === 'outward' ? vec(-p.x, p.y, p.z) : vec(p.x, p.y, -p.z);
}

export function computeCalibration(
  sign: 1 | -1,
  uprightSample: Vec3,
  lookUpSample: Vec3,
  now: Date = new Date()
): CalibrationResult {
  if (!(Math.hypot(uprightSample.x, uprightSample.y, uprightSample.z) > 1)) return { ok: false, error: 'NO_DATA' };
  if (!(Math.hypot(lookUpSample.x, lookUpSample.y, lookUpSample.z) > 1)) return { ok: false, error: 'NO_DATA' };

  const up1 = normalize(scale(uprightSample, sign));
  const up2 = normalize(scale(lookUpSample, sign));

  if (up1.y < 0) return { ok: false, error: 'PHONE_UPSIDE_DOWN' };
  const mountTilt = Math.acos(Math.min(1, up1.y)) * DEG;
  if (mountTilt > CALIBRATION_LIMITS.maxMountTiltDeg) return { ok: false, error: 'PHONE_NOT_VERTICAL' };

  const lookAngle = angleBetween(up1, up2);
  if (lookAngle < CALIBRATION_LIMITS.minLookUpDeg) return { ok: false, error: 'NOT_ENOUGH_TILT' };
  if (lookAngle > CALIBRATION_LIMITS.maxLookUpDeg) return { ok: false, error: 'TOO_MUCH_TILT' };

  // Tavana bakınca yukarı vektörü telefonun z ekseni boyunca hangi yöne kaydı?
  const delta = sub(up2, up1);
  const deltaN = Math.hypot(delta.x, delta.y, delta.z);
  if (Math.abs(delta.x) / deltaN > CALIBRATION_LIMITS.maxSidewaysFraction) {
    return { ok: false, error: 'SIDEWAYS_TILT' };
  }
  const facing: Facing = delta.z > 0 ? 'outward' : 'inward';

  const h1 = phoneToProvisionalHead(up1, facing);
  const h2 = phoneToProvisionalHead(up2, facing);

  // TRIAD: ölçülen üçlü (t) → referans üçlü (r).
  const t1 = h1;
  const t2 = normalize(cross(h1, h2));
  const t3 = cross(t1, t2);
  const r1 = vec(0, 1, 0);
  const r2 = vec(1, 0, 0);
  const r3 = cross(r1, r2); // (0,0,−1)
  const matrix = outerBasis(r1, r2, r3, t1, t2, t3);

  return {
    ok: true,
    calibration: { sign, facing, matrix, mountTiltDeg: Math.round(mountTilt), createdAt: now.toISOString() }
  };
}

/** Ham ivme (yerçekimi dahil) → baş koordinatlarında dünya-yukarı birim vektörü. */
export function rawToHeadUp(raw: Vec3, cal: Calibration): Vec3 {
  const up = normalize(scale(raw, cal.sign));
  return normalize(mulMatVec(cal.matrix, phoneToProvisionalHead(up, cal.facing)));
}

/** Kalibrasyon sonrası nötr duruşta artık hata (test ve kalite kontrol için). */
export function residualUprightDeg(raw: Vec3, cal: Calibration): number {
  const h = rawToHeadUp(raw, cal);
  return Math.acos(Math.max(-1, Math.min(1, dot(h, vec(0, 1, 0))))) * DEG;
}

export const CALIBRATION_ERROR_TEXT: Record<CalibrationError, string> = {
  NO_DATA: 'Sensörden veri gelmedi. Telefonun hareket sensörüne izin verdiğinizden emin olun.',
  SIGN_AMBIGUOUS: 'Telefonu ekranı size dönük, üst kenarı yukarıda olacak şekilde normal tutun ve tekrar deneyin.',
  PHONE_UPSIDE_DOWN: 'Telefon ters duruyor. Üst kenarı başınızın tepesine bakacak şekilde alnınıza koyun.',
  PHONE_NOT_VERTICAL:
    'Telefon alnınızda çok eğik duruyor. Telefonun sırtını alnınıza düz yaslayın, uzun kenarı dik olsun.',
  NOT_ENOUGH_TILT: 'Başınızı biraz daha geriye yatırıp tavana bakın, sonra tekrar deneyin.',
  TOO_MUCH_TILT: 'Başınızı çok fazla geriye yatırdınız. Rahat bir şekilde tavana bakmanız yeterli.',
  SIDEWAYS_TILT: 'Tavana bakarken başınızı yana yatırmayın; yalnızca geriye doğru yatırın.'
};
