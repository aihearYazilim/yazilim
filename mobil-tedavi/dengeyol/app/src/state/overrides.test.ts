import { beforeEach, describe, expect, it } from 'vitest';
import { logOverride } from './overrides';
import { store } from './store';
import { emptyData, type Episode } from './types';

const ep = (p: Partial<Episode>): Episode => ({
  id: 'e',
  startedAt: 1000,
  side: null,
  protocolId: 'epley',
  redFlags: [],
  sideTests: [],
  maneuvers: [],
  retests: [],
  status: 'active',
  ...p
});

describe('araştırma kaydı (logOverride)', () => {
  beforeEach(() => store.update(() => emptyData()));

  it('aktif atağa sırayla yazar; açıklama yoksa alan da yok', () => {
    store.update((d) => ({ ...d, episodes: [ep({ id: 'a', status: 'closed', endedAt: 500 }), ep({ id: 'b' })] }));
    expect(logOverride('VERTIGO_TOO_LONG', 'Epley · sağ, adım 2/5: baş dönmesi 2 dakikayı aştı', undefined, 2000)).toBe(true);
    expect(logOverride('DOSE', undefined, undefined, 3000)).toBe(true);
    const b = store.get().episodes.find((e) => e.id === 'b')!;
    expect(b.overrides).toEqual([
      { at: 2000, kind: 'VERTIGO_TOO_LONG', detail: 'Epley · sağ, adım 2/5: baş dönmesi 2 dakikayı aştı' },
      { at: 3000, kind: 'DOSE' }
    ]);
    expect(store.get().episodes.find((e) => e.id === 'a')!.overrides).toBeUndefined();
  });

  it('kimlikle kapanmış atağa da yazar (hekime yönlendirmeden sonra yeni atak); atak yoksa false', () => {
    expect(logOverride('REFERRAL')).toBe(false);
    store.update((d) => ({ ...d, episodes: [ep({ id: 'r', status: 'referred', endedAt: 500 })] }));
    expect(logOverride('REFERRAL', 'Yönlendirmeden sonra yeni atak başlatıldı', 'r', 900)).toBe(true);
    expect(store.get().episodes[0]!.overrides).toEqual([{ at: 900, kind: 'REFERRAL', detail: 'Yönlendirmeden sonra yeni atak başlatıldı' }]);
    expect(logOverride('REFERRAL', undefined, 'yok')).toBe(false);
  });
});
