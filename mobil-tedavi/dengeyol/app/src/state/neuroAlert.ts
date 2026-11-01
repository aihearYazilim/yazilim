/**
 * Kırmızı 112 şeridi (yeni kullanıcı turu 1, L2-1; y05): manevradan sonra "Yeni belirti" (konuşma bozukluğu, güçsüzlük,
 * çift görme, şiddetli baş ağrısı) bildirilince, kişi acil uyarısını aşsa da olağan "Manevra tamamlandı" akışı
 * (rahatlatıcı metin, tekrar testi, hatırlatıcı) gösterilmez; akışta ve ana ekranda kırmızı 112 şeridi görünür. Şerit kişi
 * "Belirtiler geçti, iyiyim" ya da "112'yi aradım" diyene dek ya da 24 saat görünür. Kilit değildir: "Başım dönüyor" çalışır.
 *
 * Ayrıca güvenlik listesindeki acil belirti (112) uyarısı aşıldıysa yürütücüde ve karar ekranında kısa kırmızı hatırlatma
 * gösterilir (L2-2): `emergencyOverridden`.
 */
import { evaluateRedFlags } from '../core/safety';
import type { AppData, Episode } from './types';

/** Şeridin en uzun görünme süresi (ms). */
export const NEURO_ALERT_MS = 24 * 3600_000;

export interface NeuroAlert {
  episodeId: string;
  /** Belirtinin bildirildiği manevranın zamanı (ms). */
  at: number;
}

/** Son 24 saatte manevra sonrası yeni nörolojik belirti bildirildiyse ve henüz yanıtlanmadıysa en yenisi; yoksa null. */
export function neuroAlertFor(d: Pick<AppData, 'episodes'>, now: number): NeuroAlert | null {
  let best: NeuroAlert | null = null;
  for (const e of d.episodes) {
    for (const m of e.maneuvers) {
      if (m.afterSymptoms !== 'neuro') continue;
      if (now - m.at > NEURO_ALERT_MS) continue;
      if (e.neuroAlertAck && e.neuroAlertAck.at >= m.at) continue;
      if (!best || m.at > best.at) best = { episodeId: e.id, at: m.at };
    }
  }
  return best;
}

/** "Belirtiler geçti, iyiyim" ya da "112'yi aradım": şeridi kapatır (yanıt atağa yazılır; rapora yansıyabilir). */
export function ackNeuroAlert(d: AppData, episodeId: string, by: 'ok' | 'called112', now: number = Date.now()): AppData {
  return { ...d, episodes: d.episodes.map((e) => (e.id === episodeId ? { ...e, neuroAlertAck: { at: now, by } } : e)) };
}

/**
 * Bu atakta acil (112) uyarısı "Yine de devam et" ile aşıldı mı: güvenlik listesindeki acil belirti ya da manevra sonrası
 * yeni belirti. Yürütücüde ve karar ekranında kısa kırmızı hatırlatma için.
 */
export function emergencyOverridden(ep: Episode | null | undefined): boolean {
  if (!ep) return false;
  const overrides = (ep.overrides ?? []).filter((o) => o.kind === 'RED_FLAG');
  if (overrides.length === 0) return false;
  if (ep.maneuvers.some((m) => m.afterSymptoms === 'neuro')) return true;
  return ep.redFlags.some((r) => (r.stopped || r.continued) && evaluateRedFlags(r.answers).action === 'emergency' && overrides.some((o) => o.at >= r.at));
}
