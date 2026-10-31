import { describe, expect, it } from 'vitest';
import {
  decodePrescription,
  encodePrescription,
  fnv1a,
  PID_MAX_LEN,
  type Prescription,
  prescriptionUrl,
  RX_VALID_DAYS,
  rxCode,
  rxLastValidDay,
  rxValidAt,
  rxValidityLabel,
  rxValidUntil
} from './prescription';

/** Tarayıcıdaki gibi base64url (Node Buffer'a bağlı kalmasın). */
const b64u = (json: string) => {
  let bin = '';
  for (const b of new TextEncoder().encode(json)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64u = (s: string) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

const p: Prescription = {
  v: 1,
  side: 'L',
  canal: 'PC',
  maneuver: 'epley',
  date: '2026-10-27',
  by: 'Odyolog Ayşe Yılmaz',
  clinic: 'Örnek KBB Kliniği',
  perDay: 3,
  days: 5,
  note: 'Sabah ve akşam'
};

describe('reçete', () => {
  it('gidiş-dönüş (Türkçe karakterler korunur)', () => {
    const d = decodePrescription(encodePrescription(p));
    expect(d).toEqual({ ok: true, value: p });
  });
  it('değiştirilmiş bağlantı reddedilir', () => {
    const tok = encodePrescription(p);
    const bad = tok.slice(0, 5) + (tok[5] === 'A' ? 'B' : 'A') + tok.slice(6);
    expect(decodePrescription(bad)).toMatchObject({ ok: false, error: 'CHECKSUM' });
  });
  it('doz üst sınıra çekilir', () => {
    const d = decodePrescription(encodePrescription({ ...p, perDay: 9, days: 20 }));
    expect(d.ok && d.value.perDay).toBe(3);
    expect(d.ok && d.value.days).toBe(7);
  });
  it('biçimsiz giriş', () => {
    expect(decodePrescription('abc')).toMatchObject({ ok: false, error: 'FORMAT' });
  });
  it('URL üretimi mevcut hash\'i atar', () => {
    expect(prescriptionUrl('https://x.org/app/#/hasta', p)).toMatch(/^https:\/\/x\.org\/app\/#\/recete\//);
  });

  // --- Hasta kodu (v2) ve sürüm uyumluluğu ---
  it('hasta kodsuz reçete v1 olarak üretilir (eski uygulamalar da okur)', () => {
    const tok = encodePrescription(p);
    const body = JSON.parse(unb64u(tok.split('.')[0]!));
    expect(body.v).toBe(1);
    expect('pid' in body).toBe(false);
  });
  it('hasta kodlu reçete v2 olarak gidiş-dönüş yapar', () => {
    const d = decodePrescription(encodePrescription({ ...p, pid: '  NO-2611  ' }));
    expect(d).toEqual({ ok: true, value: { ...p, v: 2, pid: 'NO-2611' } });
  });
  it('hasta kodu kısaltılır, denetim karakterleri temizlenir, boşsa v1 kalır', () => {
    const long = 'A'.repeat(PID_MAX_LEN + 10);
    const d = decodePrescription(encodePrescription({ ...p, pid: long }));
    expect(d.ok && d.value.pid).toBe('A'.repeat(PID_MAX_LEN));
    const e = decodePrescription(encodePrescription({ ...p, pid: 'NO\n2611' }));
    expect(e.ok && e.value.pid).toBe('NO 2611');
    const f = decodePrescription(encodePrescription({ ...p, pid: '   ' }));
    expect(f).toEqual({ ok: true, value: p });
  });
  it('eski (v1) bağlantı aynen çözülür', () => {
    // Bu sürümden önce üretilmiş bir bağlantının gövdesi (alan sırası eski kodla aynı).
    const json = JSON.stringify({ v: 1, side: 'R', canal: 'PC', maneuver: 'semont', date: '2026-09-01', by: 'Dr. X', perDay: 2, days: 3 });
    const body = b64u(json);
    const d = decodePrescription(`${body}.${fnv1a(body)}`);
    expect(d).toEqual({
      ok: true,
      value: { v: 1, side: 'R', canal: 'PC', maneuver: 'semont', date: '2026-09-01', by: 'Dr. X', clinic: undefined, perDay: 2, days: 3, note: undefined }
    });
  });
  it('v1 gövdesindeki pid yok sayılır; bilinmeyen sürüm reddedilir', () => {
    const mk = (o: object) => {
      const body = b64u(JSON.stringify(o));
      return `${body}.${fnv1a(body)}`;
    };
    const base = { side: 'L', canal: 'PC', maneuver: 'epley', date: '2026-10-27', perDay: 3, days: 5 };
    const d = decodePrescription(mk({ v: 1, ...base, pid: 'X-1' }));
    expect(d.ok && d.value.pid).toBeUndefined();
    expect(d.ok && d.value.v).toBe(1);
    expect(decodePrescription(mk({ v: 3, ...base }))).toMatchObject({ ok: false, error: 'VERSION' });
  });
  it('geçerlilik bitişi: muayene günü + gün sayısı (dışlayıcı an)', () => {
    const until = rxValidUntil({ date: '2026-10-30' }, 14);
    expect(until).toBe(new Date('2026-11-13T00:00:00').getTime());
    expect(rxValidUntil('2026-10-30')).toBe(until);
    expect(rxValidUntil({ date: 'bozuk' }, 14)).toBeNull();
    expect(rxValidUntil('2026-13-01')).toBeNull();
  });
  it('son geçerli gün D+13 (dahil); hasta ve klinisyen metni aynı günü yazar', () => {
    expect(RX_VALID_DAYS).toBe(14);
    expect(rxLastValidDay('2026-10-31')?.getTime()).toBe(new Date('2026-11-13T00:00:00').getTime());
    expect(rxValidityLabel('2026-10-31')).toBe('13 Kasım 2026 tarihine kadar (dahil)');
    expect(rxValidityLabel({ date: '2026-10-31' }, 'short')).toBe('13.11.2026 tarihine kadar (dahil)');
    expect(rxValidityLabel('bozuk')).toBeNull();
    // Ay sonu ve yıl geçişi yerel takvimle.
    expect(rxValidityLabel('2026-12-25', 'short')).toBe('07.01.2027 tarihine kadar (dahil)');
  });
  it('geçerlilik sınırları: D 00:00 geçerli, D+13 23:59 geçerli, D+14 00:00 geçersiz, gelecek tarih geçersiz', () => {
    const d = '2026-10-17';
    expect(rxValidAt(d, new Date('2026-10-16T23:59:59').getTime())).toBe(false);
    expect(rxValidAt(d, new Date('2026-10-17T00:00:00').getTime())).toBe(true);
    expect(rxValidAt(d, new Date('2026-10-30T23:59:59').getTime())).toBe(true);
    expect(rxValidAt(d, new Date('2026-10-31T00:00:00').getTime())).toBe(false);
    expect(rxValidAt('2026-11-02', new Date('2026-10-31T12:00:00').getTime())).toBe(false);
    expect(rxValidAt('bozuk', Date.now())).toBe(false);
  });
  it('reçete kodu: bağlantının sağlama toplamı; çözülen reçeteden yeniden kodlanınca aynı', () => {
    const tok = encodePrescription({ ...p, pid: 'NO-2611' });
    const code = rxCode(tok);
    expect(code).toMatch(/^[0-9a-f]{8}$/);
    expect(code).toBe(tok.split('.')[1]);
    const d = decodePrescription(tok);
    expect(d.ok && rxCode(d.value)).toBe(code);
    expect(rxCode('bozuk')).toBe('');
  });
});
