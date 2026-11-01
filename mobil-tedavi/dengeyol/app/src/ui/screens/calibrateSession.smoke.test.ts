// @vitest-environment jsdom
/**
 * Yeni kullanıcı turu 3 (N2-2; y07): bu oturumda tam tanıtma (tavana bakışlı) yapıldıysa yürütücü başındaki yerleştirmede baş
 * geriye yatırılmaz. "Bu oturum" = bu sekme (sessionStorage), son SESSION_CAL_MAX_MS içinde. N2-5 (y08): kalibrasyon metni.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { calibratedThisSession, noteSessionCalibration, SESSION_CAL_MAX_MS } from './Calibrate';

describe('bu oturumda tanıtma (N2-2)', () => {
  it('tanıtma yapılmadan false; yapılınca süre içinde true, süre dolunca false; sekme deposunda tutulur', () => {
    sessionStorage.clear();
    expect(calibratedThisSession(1_000)).toBe(false);
    noteSessionCalibration(10_000);
    expect(calibratedThisSession(10_000)).toBe(true);
    expect(calibratedThisSession(10_000 + SESSION_CAL_MAX_MS - 1)).toBe(true);
    expect(calibratedThisSession(10_000 + SESSION_CAL_MAX_MS)).toBe(false);
    expect(sessionStorage.getItem('dengeyol:calSession')).toBe('10000');
    expect(SESSION_CAL_MAX_MS).toBeLessThanOrEqual(3 * 60 * 60 * 1000);
  });
});

describe('kalibrasyon metni (N2-5; y08)', () => {
  it('"cihazın yön kuralı" yerine gündelik açıklama; klinisyende "Devam" sesi susturmaz', () => {
    const src = readFileSync(join(__dirname, 'Calibrate.tsx'), 'utf8');
    expect(src).not.toMatch(/yön kuralı ölçülür/);
    expect(src).toMatch(/\(telefonun nasıl tutulduğunu öğrenir\)/);
    expect(src).toMatch(/data-testid="cal-continue" data-keep-speech/);
  });
});
