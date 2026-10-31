/**
 * Telefonun alından alındığını hareket sensöründen sezme (kullanıcı turu 4, k01): manevra ya da test bitince "Telefonu
 * alnınızdan alın ve ekrana bakın" denir; soru ve seçenekler telefon alından inince (ya da ekrana ilk dokunuşta, ya da kısa
 * süre sonra) bir kez okunur. Saf sınıf: React'e ve tarayıcıya bağlı değildir, birim testlerle sınanır.
 *
 * Yöntem: ekran açıldıktan sonraki ilk örneklerin yerçekimi yönü (telefon hâlâ alında, hasta oturuyor) dayanak alınır.
 * Telefon elde ekrana bakılacak biçimde tutulunca eğimi belirgin biçimde değişir (alında dik ya da yatay; elde arkaya yatık
 * ya da dikey). Yerçekimi yönü dayanaktan `LIFT_ANGLE_DEG` kadar `LIFT_HOLD_MS` boyunca uzak kalırsa "alındı" sayılır.
 * Kısa baş hareketi (ani eğilme) sayılmaz. Yanlış sezme zararsızdır: yalnız soru biraz erken okunur.
 */
import { angleBetween, norm, type Vec3 } from '../../../core/geometry';

/** Dayanak yönden bu kadar (derece) sapma telefonun alından alındığını gösterir. */
export const LIFT_ANGLE_DEG = 30;
/** Sapma en az bu kadar (ms) sürmeli (kısa baş hareketi sayılmaz). */
export const LIFT_HOLD_MS = 500;
/** Dayanak yön, ilk örnekten sonraki bu süredeki (ms) örneklerin ortalamasıdır. */
export const LIFT_REF_MS = 400;

export class PhoneLiftDetector {
  private refSum: Vec3 = { x: 0, y: 0, z: 0 };
  private refStart: number | null = null;
  private ref: Vec3 | null = null;
  private farSince: number | null = null;
  private fired = false;

  /** Örnek ekler; telefon alından alındıysa (ilk kez) true döner. Sonraki çağrılar hep false. */
  push(gravity: Vec3, t: number): boolean {
    if (this.fired) return false;
    if (!Number.isFinite(gravity.x) || !Number.isFinite(gravity.y) || !Number.isFinite(gravity.z) || norm(gravity) < 1e-6) return false;
    if (!this.ref) {
      if (this.refStart === null) this.refStart = t;
      this.refSum = { x: this.refSum.x + gravity.x, y: this.refSum.y + gravity.y, z: this.refSum.z + gravity.z };
      if (t - this.refStart >= LIFT_REF_MS) this.ref = this.refSum;
      return false;
    }
    if (angleBetween(this.ref, gravity) >= LIFT_ANGLE_DEG) {
      if (this.farSince === null) this.farSince = t;
      if (t - this.farSince >= LIFT_HOLD_MS) {
        this.fired = true;
        return true;
      }
    } else {
      this.farSince = null;
    }
    return false;
  }
}
