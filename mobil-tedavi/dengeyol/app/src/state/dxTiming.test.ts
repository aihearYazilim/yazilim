import { describe, expect, it } from 'vitest';
import { calendarDaysBetween, dxIsRecent, dxRecentAnswerExpired } from './dxTiming';

const day = 24 * 60 * 60 * 1000;
const now = new Date('2026-10-31T12:00:00').getTime();

describe('tanı zamanı (dxIsRecent)', () => {
  it('"Son 2 hafta içinde" (tarihsiz): yanıt gününden sonraki 15 takvim günü yakın, 16. gün değil', () => {
    expect(dxIsRecent({ dxWhen: 'recent', dxWhenAt: now }, now)).toBe(true);
    expect(dxIsRecent({ dxWhen: 'recent', dxWhenAt: now - 13 * day }, now)).toBe(true);
    expect(dxIsRecent({ dxWhen: 'recent', dxWhenAt: now - 15 * day }, now)).toBe(true);
    expect(dxIsRecent({ dxWhen: 'recent', dxWhenAt: now - 16 * day }, now)).toBe(false);
    expect(dxIsRecent({ dxWhen: 'recent' }, now)).toBe(true);
  });
  it('takvim günü sayılır: yanıt sabah, şimdi akşam olsa da gün farkı değişmez', () => {
    const at = new Date('2026-10-16T07:00:00').getTime();
    expect(dxIsRecent({ dxWhen: 'recent', dxWhenAt: at }, new Date('2026-10-31T23:30:00').getTime())).toBe(true);
    expect(dxIsRecent({ dxWhen: 'recent', dxWhenAt: at }, new Date('2026-11-01T00:30:00').getTime())).toBe(false);
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
  it('sınır (k01): hekimin "2 hafta önce" dediği gün (17 Ekim) ve bir gün öncesi yakın; 16 gün önce değil', () => {
    // Günün saati ne olursa olsun (sabah 00:30 ya da gece 23:59) aynı sonuç.
    for (const t of ['2026-10-31T00:30:00', '2026-10-31T23:59:00']) {
      const n = new Date(t).getTime();
      expect(dxIsRecent({ dxWhen: 'date', dxDate: '2026-10-17' }, n)).toBe(true);
      expect(dxIsRecent({ dxWhen: 'date', dxDate: '2026-10-16' }, n)).toBe(true);
      expect(dxIsRecent({ dxWhen: 'date', dxDate: '2026-10-15' }, n)).toBe(false);
    }
  });
  it('takvim günü farkı yaz saati geçişinden etkilenmez', () => {
    expect(calendarDaysBetween(new Date('2026-10-24T23:00:00').getTime(), new Date('2026-10-26T01:00:00').getTime())).toBe(2);
    expect(calendarDaysBetween(now, now)).toBe(0);
  });
});

describe('düzenleme ekranı: eskimiş "Son 2 hafta içinde" yanıtı', () => {
  it('yanıttan sonra sınır aşılınca "eskidi" sayılır; tarihli ya da "Daha önce" yanıtlar etkilenmez', () => {
    expect(dxRecentAnswerExpired({ dxWhen: 'recent', dxWhenAt: now - 40 * day }, now)).toBe(true);
    expect(dxRecentAnswerExpired({ dxWhen: 'recent', dxWhenAt: now - 3 * day }, now)).toBe(false);
    expect(dxRecentAnswerExpired({ dxWhen: 'recent' }, now)).toBe(false);
    expect(dxRecentAnswerExpired({ dxWhen: 'older' }, now)).toBe(false);
    expect(dxRecentAnswerExpired({ dxWhen: 'date', dxDate: '2026-01-01' }, now)).toBe(false);
    expect(dxRecentAnswerExpired(undefined, now)).toBe(false);
  });
});
