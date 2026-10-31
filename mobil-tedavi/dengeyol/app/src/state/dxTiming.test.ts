import { describe, expect, it } from 'vitest';
import { dxIsRecent } from './dxTiming';

const day = 24 * 60 * 60 * 1000;
const now = new Date('2026-10-31T12:00:00').getTime();

describe('tanı zamanı (dxIsRecent)', () => {
  it('"Son 2 hafta içinde" (tarihsiz): yanıttan sonraki 14 gün yakın, sonra değil', () => {
    expect(dxIsRecent({ dxWhen: 'recent', dxWhenAt: now }, now)).toBe(true);
    expect(dxIsRecent({ dxWhen: 'recent', dxWhenAt: now - 13 * day }, now)).toBe(true);
    expect(dxIsRecent({ dxWhen: 'recent', dxWhenAt: now - 15 * day }, now)).toBe(false);
    expect(dxIsRecent({ dxWhen: 'recent' }, now)).toBe(true);
  });
  it('"Daha önce" yakın değil; bilgi yoksa (eski kayıt) yakın sayılır', () => {
    expect(dxIsRecent({ dxWhen: 'older' }, now)).toBe(false);
    expect(dxIsRecent({}, now)).toBe(true);
    expect(dxIsRecent(undefined, now)).toBe(true);
  });
  it('tarih: son 14 gün ve ileri tarih yakın; eski tarih değil; okunamayan tarih yakın', () => {
    expect(dxIsRecent({ dxWhen: 'date', dxDate: '2026-10-31' }, now)).toBe(true);
    expect(dxIsRecent({ dxWhen: 'date', dxDate: '2026-10-20' }, now)).toBe(true);
    expect(dxIsRecent({ dxWhen: 'date', dxDate: '2026-09-01' }, now)).toBe(false);
    expect(dxIsRecent({ dxWhen: 'date', dxDate: '2026-11-05' }, now)).toBe(true);
    expect(dxIsRecent({ dxDate: '2026-09-01' }, now)).toBe(false);
    expect(dxIsRecent({ dxWhen: 'date', dxDate: 'bozuk' }, now)).toBe(true);
  });
});
