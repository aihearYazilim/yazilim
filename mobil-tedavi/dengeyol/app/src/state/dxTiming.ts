/**
 * Hastanın beyan ettiği hekim tanısının zamanı (kurulumda zorunlu seçim: "Son 2 hafta içinde / Daha önce / Tarihi
 * biliyorum"). Beyan doğrulanamadığı için yalnız daha sıkı yönde kullanılır: belirsizlikte tanı YAKIN TARİHLİ sayılır
 * (taraf testi çelişirse hekime yönlendirilir; hiçbir zaman testsiz manevraya izin vermez).
 */
import type { PatientProfile } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Tanı `recentDays` gün içinde mi?
 * - dxWhen 'older' ("Daha önce") → hayır.
 * - dxWhen 'recent' ("Son 2 hafta içinde", tarih yok) → yanıtın verildiği andan (dxWhenAt) bu yana `recentDays` gün
 *   geçmediyse evet (yanıt zamanı yoksa evet).
 * - Tarih (dxDate) varsa: tarih son `recentDays` gün içindeyse ya da ileri bir tarihse (yazım hatası olabilir) evet.
 * - Hiçbir bilgi yoksa (eski kayıt) ya da tarih okunamıyorsa evet (daha sıkı yön).
 */
export function dxIsRecent(
  p: Pick<PatientProfile, 'dxWhen' | 'dxWhenAt' | 'dxDate'> | undefined,
  now: number = Date.now(),
  recentDays: number = 14
): boolean {
  if (!p) return true;
  if (p.dxWhen === 'older') return false;
  if (p.dxWhen === 'recent' && !p.dxDate) {
    return typeof p.dxWhenAt !== 'number' || now - p.dxWhenAt <= recentDays * DAY_MS;
  }
  if (p.dxDate) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(p.dxDate);
    if (!m) return true;
    const t = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
    if (!Number.isFinite(t)) return true;
    return now - t <= recentDays * DAY_MS;
  }
  return true;
}
