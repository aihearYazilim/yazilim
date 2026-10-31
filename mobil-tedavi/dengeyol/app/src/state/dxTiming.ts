/**
 * Hastanın beyan ettiği hekim tanısının zamanı (kurulumda zorunlu seçim: "Son 2 hafta içinde / Daha önce / Tarihi
 * biliyorum"). Beyan doğrulanamadığı için yalnız daha sıkı yönde kullanılır: belirsizlikte tanı YAKIN TARİHLİ sayılır
 * (taraf testi çelişirse hekime yönlendirilir; hiçbir zaman testsiz manevraya izin vermez).
 *
 * Sınır takvim günüyle sayılır (saat farkı değil) ve güvenli yönde kapsayıcıdır (kullanıcı turu 3, k01): hekimin
 * "2 hafta önce" dediği gün (14 takvim günü önce) yakın sayılır; hasta günü bir gün kaydırmış olabileceği için
 * ("yaklaşık 2 hafta") bir gün pay eklenir. Böylece `recentDays` = 14 için bugünden geriye 0–15 takvim günü yakın,
 * 16. günden itibaren eskidir. Pay yalnız "yakın" yönüne çalışır: yakın sayılan tanıda taraf çelişkisi hekime
 * yönlendirir (daha sıkı), eski sayılan tanıda yalnız uyarılır.
 */
import type { PatientProfile } from './types';

/** "Yaklaşık 2 hafta": sınır gününe eklenen güvenli yön payı (takvim günü). */
export const DX_RECENT_GRACE_DAYS = 1;

/** Yerel takvim günü (yerel gece yarısı) → gün sayısı; yaz saati kaymasından etkilenmez. */
function dayNumber(y: number, m: number, d: number): number {
  return Math.round(Date.UTC(y, m, d) / 86_400_000);
}

function localDayNumber(t: number): number {
  const d = new Date(t);
  return dayNumber(d.getFullYear(), d.getMonth(), d.getDate());
}

/** İki an arasındaki yerel takvim günü farkı (`to` − `from`; aynı gün 0). */
export function calendarDaysBetween(from: number, to: number): number {
  return localDayNumber(to) - localDayNumber(from);
}

/** "YYYY-AA-GG" → yerel takvim günü sayısı; okunamazsa null. */
function isoDayNumber(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  if (mo < 0 || mo > 11 || d < 1 || d > 31) return null;
  return dayNumber(y, mo, d);
}

/**
 * Tanı `recentDays` gün içinde mi (takvim günüyle, kapsayıcı, artı DX_RECENT_GRACE_DAYS pay)?
 * - dxWhen 'older' ("Daha önce") → hayır.
 * - dxWhen 'recent' ("Son 2 hafta içinde", tarih yok) → yanıtın verildiği günden (dxWhenAt) bu yana en çok
 *   `recentDays` + pay takvim günü geçtiyse evet (yanıt zamanı yoksa evet).
 * - Tarih (dxDate) varsa: tarih bugünden en çok `recentDays` + pay takvim günü önceyse ya da ileri bir tarihse
 *   (yazım hatası olabilir) evet.
 * - Hiçbir bilgi yoksa (eski kayıt) ya da tarih okunamıyorsa evet (daha sıkı yön).
 */
export function dxIsRecent(
  p: Pick<PatientProfile, 'dxWhen' | 'dxWhenAt' | 'dxDate'> | undefined,
  now: number = Date.now(),
  recentDays: number = 14
): boolean {
  if (!p) return true;
  if (p.dxWhen === 'older') return false;
  const limit = recentDays + DX_RECENT_GRACE_DAYS;
  if (p.dxWhen === 'recent' && !p.dxDate) {
    if (typeof p.dxWhenAt !== 'number' || !Number.isFinite(p.dxWhenAt)) return true;
    return calendarDaysBetween(p.dxWhenAt, now) <= limit;
  }
  if (p.dxDate) {
    const day = isoDayNumber(p.dxDate);
    if (day === null) return true;
    return localDayNumber(now) - day <= limit;
  }
  return true;
}

/**
 * Düzenleme ekranı (k03): "Son 2 hafta içinde" yanıtı artık yakın sayılmıyorsa (yanıttan bu yana sınır aşıldı)
 * true. Ekranda seçim "Daha önce" olarak gösterilir ve yanıtın verildiği tarih yazılır.
 */
export function dxRecentAnswerExpired(p: Pick<PatientProfile, 'dxWhen' | 'dxWhenAt' | 'dxDate'> | undefined, now: number = Date.now()): boolean {
  return !!p && p.dxWhen === 'recent' && !p.dxDate && typeof p.dxWhenAt === 'number' && !dxIsRecent(p, now);
}
