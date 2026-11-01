import { describe, expect, it } from 'vitest';
import {
  DECODE_ERROR_TEXT,
  decodePrescription,
  encodePrescription,
  fnv1a,
  normalizePrescription,
  OV_MAX_LEN,
  PID_MAX_LEN,
  type Prescription,
  prescriptionUrl,
  rxCanalName,
  rxCanalOf,
  rxManeuverFromWire,
  rxManeuverName,
  rxManeuverWire,
  rxDoseLine,
  rxPcManeuver,
  rxPossibleDx,
  rxProtocolId,
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
    expect(decodePrescription(mk({ v: 4, ...base }))).toMatchObject({ ok: false, error: 'VERSION' });
    // Yatay kanal yalnız v3'te; kanal ile manevra tutarlı olmalı.
    expect(decodePrescription(mk({ v: 2, ...base, canal: 'HC', maneuver: 'bbq-roll' }))).toMatchObject({ ok: false, error: 'FIELDS' });
    expect(decodePrescription(mk({ v: 3, ...base, canal: 'HC', maneuver: 'epley' }))).toMatchObject({ ok: false, error: 'FIELDS' });
    expect(decodePrescription(mk({ v: 3, ...base, canal: 'PC', maneuver: 'bbq-roll' }))).toMatchObject({ ok: false, error: 'FIELDS' });
    expect(decodePrescription(mk({ v: 3, ...base, canal: 'HC', maneuver: 'gufoni-geo' }))).toMatchObject({ ok: false, error: 'FIELDS' });
  });

  // --- Yatay kanal ve uyarı notu (v3; kullanıcı turu yeni-1, L4-1/L4-2) ---
  it('yatay kanal reçetesi v3 olarak üretilir ve gidiş-dönüş yapar (BBQ roll)', () => {
    const hc: Prescription = { ...p, canal: 'HC', maneuver: 'bbq-roll' };
    const tok = encodePrescription(hc);
    expect(JSON.parse(unb64u(tok.split('.')[0]!)).v).toBe(3);
    const d = decodePrescription(tok);
    expect(d).toEqual({ ok: true, value: { ...hc, v: 3 } });
    expect(d.ok && rxCanalOf(d.value)).toBe('HC');
    expect(d.ok && rxManeuverName(d.value)).toBe('BBQ roll');
    expect(d.ok && rxCanalName(d.value)).toBe('yatay kanal');
    expect(d.ok && rxProtocolId(d.value)).toBe('bbq-roll');
    expect(d.ok && rxPcManeuver(d.value)).toBe('epley');
  });
  it('kanal manevradan çıkarılır (tutarsız giriş normalleştirilir)', () => {
    const d = decodePrescription(encodePrescription({ ...p, canal: 'PC', maneuver: 'bbq-roll' }));
    expect(d.ok && d.value.canal).toBe('HC');
    expect(normalizePrescription({ ...p, canal: 'HC', maneuver: 'semont' }).canal).toBe('PC');
  });
  it('uyarıya rağmen verilen arka kanal reçetesi v3 (eski uygulama notu sessizce düşürmesin); not temizlenir ve kısaltılır', () => {
    const tok = encodePrescription({ ...p, pid: 'K-7', ov: '  beyin kaynaklı\nşüphe  ' });
    expect(JSON.parse(unb64u(tok.split('.')[0]!)).v).toBe(3);
    const d = decodePrescription(tok);
    expect(d.ok && d.value).toMatchObject({ v: 3, canal: 'PC', maneuver: 'epley', pid: 'K-7', ov: 'beyin kaynaklı şüphe' });
    const long = decodePrescription(encodePrescription({ ...p, ov: 'x'.repeat(OV_MAX_LEN + 20) }));
    expect(long.ok && long.value.ov).toBe('x'.repeat(OV_MAX_LEN));
    // Uyarısız arka kanal reçetesi v1/v2 kalır.
    expect(JSON.parse(unb64u(encodePrescription({ ...p, ov: '   ' }).split('.')[0]!)).v).toBe(1);
  });
  it('uyarı türü (ovk) yalnız notla birlikte taşınır; santral/güvenlik kontrolü uyarısında tanı "olası" (yeni kullanıcı turu 3, y05 #2)', () => {
    const d = decodePrescription(encodePrescription({ ...p, ov: 'muayenede nörolojik bulgu vardı', ovk: 'SAFETY_CHECK' }));
    expect(d.ok && d.value).toMatchObject({ v: 3, ov: 'muayenede nörolojik bulgu vardı', ovk: 'SAFETY_CHECK' });
    expect(d.ok && rxPossibleDx(d.value)).toBe(true);
    expect(rxPossibleDx({ ov: 'x', ovk: 'CENTRAL' })).toBe(true);
    expect(rxPossibleDx({ ov: 'tanı uygulamada onaylanmadan verildi', ovk: 'NO_DIAGNOSIS' })).toBe(false);
    // Uyarı türü alanından önceki santral reçetesi hasta metninden tanınır.
    expect(rxPossibleDx({ ov: 'muayene bulgusu beyin kaynaklı baş dönmesini de düşündürüyor' })).toBe(true);
    expect(rxPossibleDx({ ovk: 'CENTRAL' })).toBe(false);
    // Notsuz ya da biçimsiz tür atılır.
    expect(normalizePrescription({ ...p, ovk: 'CENTRAL' }).ovk).toBeUndefined();
    expect(normalizePrescription({ ...p, ov: 'x', ovk: 'kötü tür' }).ovk).toBeUndefined();
  });
  it('tek süre cümlesi: tedavi gün sayısı ve son geçerli gün (yeni kullanıcı turu 3, y04 #5)', () => {
    expect(rxDoseLine({ perDay: 3, days: 5, date: '2026-11-01' }, 'short')).toBe('5 gün, günde en çok 3 manevra. Reçete 14.11.2026 tarihine kadar (dahil) geçerli.');
    expect(rxDoseLine({ perDay: 2, days: 3, date: '2026-11-01' })).toBe('3 gün, günde en çok 2 manevra. Reçete 14 Kasım 2026 tarihine kadar (dahil) geçerli.');
    expect(rxDoseLine({ perDay: 2, days: 3, date: 'bozuk' })).toBe('3 gün, günde en çok 2 manevra.');
  });
  it('v1/v2 gövdesindeki ov yok sayılır', () => {
    const body = b64u(JSON.stringify({ v: 2, side: 'L', canal: 'PC', maneuver: 'epley', date: '2026-10-27', perDay: 3, days: 5, pid: 'A', ov: 'x' }));
    const d = decodePrescription(`${body}.${fnv1a(body)}`);
    expect(d.ok && d.value.ov).toBeUndefined();
    expect(d.ok && d.value.v).toBe(2);
  });
  it('eski uygulama yeni biçimi görünce anlaşılır mesaj: güncelleme ve yeniden açma', () => {
    expect(DECODE_ERROR_TEXT.VERSION).toMatch(/daha yeni bir sürümüyle/);
    expect(DECODE_ERROR_TEXT.VERSION).toMatch(/Uygulamayı güncelleyin/);
  });
  it('ev raporu manevra kodu: e/s/b gidiş-dönüş; bilinmeyen harf Semont (eski davranış)', () => {
    for (const m of ['epley', 'semont', 'bbq-roll'] as const) expect(rxManeuverFromWire(rxManeuverWire(m))).toBe(m);
    expect(rxManeuverFromWire('z')).toBe('semont');
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
