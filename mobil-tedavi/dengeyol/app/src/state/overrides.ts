/**
 * Araştırma kaydı: kullanıcı bir uyarıyı "Yine de devam et" ile aştığında atağa yazılır (yeniden tasarım; klinik
 * araştırmada hangi uyarının ne sıklıkla aşıldığı ölçülür). Aktif atak yoksa (ör. kurulumda) son atağa da yazılmaz;
 * çağıran gerekirse önce atağı açar.
 */
import { activeEpisode, store } from './store';
import type { Episode } from './types';

export type OverrideEntry = NonNullable<Episode['overrides']>[number];

/** Atağa bir aşma kaydı ekler; atak yoksa false döner. */
export function logOverride(kind: string, detail?: string, episodeId?: string, now: number = Date.now()): boolean {
  const d = store.get();
  const ep = episodeId ? d.episodes.find((e) => e.id === episodeId) : activeEpisode(d);
  if (!ep) return false;
  const entry: OverrideEntry = detail ? { at: now, kind, detail } : { at: now, kind };
  store.update((x) => ({
    ...x,
    episodes: x.episodes.map((e) => (e.id === ep.id ? { ...e, overrides: [...(e.overrides ?? []), entry] } : e))
  }));
  return true;
}
