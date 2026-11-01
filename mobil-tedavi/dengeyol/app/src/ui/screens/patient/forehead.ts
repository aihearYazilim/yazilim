/**
 * Telefonun alına konduğunu hareket sensöründen sezme (yeni kullanıcı turu 1, L5-4; y07: başı dönen, gözü kapalı kişi
 * hazırlıktaki "Hazırım"ı ve tanıtma girişindeki "Başla"yı ekrana bakarak arıyordu). Saf sınıf: React'e ve tarayıcıya
 * bağlı değildir, birim testlerle sınanır.
 *
 * Yöntem: alındaki telefon dik durur (üst kenar yukarıda, ekran karşıya); yerçekimi neredeyse tamamen telefonun y ekseni
 * boyuncadır. Elde okurken telefon çoğunlukla 30–60° geriye yatıktır, masada yatay durur. Yerçekimi dikeyden en çok
 * `ON_TILT_DEG` sapıyor ve yönü `HOLD_MS` boyunca `STEADY_DEG` içinde sabit kalıyorsa "alında" sayılır; dikeyden
 * `OFF_TILT_DEG`'den çok sapınca hemen "alında değil". Yanlış sezmeye karşı: yalnız sabit ve dik duruşta açılır; ekrandaki
 * olağan düğmeler yine çalışır. İşaret kuralı (iOS/Android) önemsizdir: |y| kullanılır.
 */
import { angleBetween, norm, type Vec3 } from '../../../core/geometry';

/**
 * Dikeyden en çok bu kadar sapma "dik" sayılır (derece). Alın geriye eğimlidir (yetişkinde çoğunlukla 10–25°; kalibrasyon
 * 40°'ye dek kabul eder): alına yaslanan telefon da o kadar yatık durur. Eski eşik 18° eğimli alında hiç açılmıyordu
 * (yeni kullanıcı turu 2, M2-5). Elde okurken telefon çoğunlukla 35–60° yatıktır.
 */
export const ON_TILT_DEG = 26;
/** "Alında" durumundan çıkış eşiği (derece; gidip gelme olmasın). Ekrana bakmak için indirince (≥ 35–40°) kapanır. */
export const OFF_TILT_DEG = 32;
/** Yön bu kadar süre sabit kalmalı (ms). */
export const HOLD_MS = 1500;
/** Sabitlik: dayanak yönden en çok bu kadar sapma (derece). */
export const STEADY_DEG = 6;

/** Yerçekiminin telefonun y ekseniyle (dikey) yaptığı açı (derece). */
export function tiltFromVertical(g: Vec3): number {
  const n = norm(g);
  if (!(n > 1e-6)) return 90;
  return (Math.acos(Math.min(1, Math.abs(g.y) / n)) * 180) / Math.PI;
}

export class ForeheadDetector {
  private since: number | null = null;
  private ref: Vec3 | null = null;
  private on = false;

  /** Örnek ekler; telefon şu an alında sayılıyorsa true. */
  push(gravity: Vec3, t: number): boolean {
    if (!Number.isFinite(gravity.x) || !Number.isFinite(gravity.y) || !Number.isFinite(gravity.z) || norm(gravity) < 1e-6) return this.on;
    const tilt = tiltFromVertical(gravity);
    if (this.on) {
      if (tilt > OFF_TILT_DEG) this.reset();
      return this.on;
    }
    if (tilt > ON_TILT_DEG) {
      this.reset();
      return false;
    }
    if (!this.ref || this.since === null || angleBetween(this.ref, gravity) > STEADY_DEG) {
      this.ref = gravity;
      this.since = t;
      return false;
    }
    if (t - this.since >= HOLD_MS) this.on = true;
    return this.on;
  }

  get active(): boolean {
    return this.on;
  }

  private reset() {
    this.on = false;
    this.since = null;
    this.ref = null;
  }
}
