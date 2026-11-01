/**
 * Yeni kullanıcı turu 3 (N2-3; y01, y03): hasta kendisi yapıyorken yürütücü göstergesindeki yazılar gündelik — derece yok
 * ("sağa 45°" → "sağa yarıya kadar"), "Baş sarkıklığı / Çene göğse" yerine "Baş önde / Düz / Baş geride". Yardımcı ve
 * klinisyen göstergesi değişmez.
 */
import { describe, expect, it } from 'vitest';
import { hangBarLabels, turnDegText, turnPlainText, turnPlainWords } from './Gauges';

describe('gösterge yazıları (N2-3)', () => {
  it('hasta: dönüş derecesiz ve gündelik', () => {
    expect(turnPlainText(45)).toBe('sağa yarıya kadar');
    expect(turnPlainText(-45)).toBe('sola yarıya kadar');
    expect(turnPlainText(2)).toBe('düz');
    expect(turnPlainText(-8)).toBe('düz');
    expect(turnPlainText(20)).toBe('sağa biraz');
    expect(turnPlainText(90)).toBe('sağa tam yana');
    expect(turnPlainText(-135)).toBe('sola yüz yere doğru');
    expect(turnPlainText(178)).toBe('yüz yere');
    expect(turnPlainWords(45)).toEqual({ dir: 'sağa', amount: 'yarıya kadar' });
    for (let t = -180; t <= 180; t += 5) expect(turnPlainText(t), String(t)).not.toMatch(/°|\d/);
  });

  it('yardımcı/klinisyen: derece aynen', () => {
    expect(turnDegText(45)).toBe('sağa 45°');
    expect(turnDegText(-2)).toBe('düz');
  });

  it('baş öne/geriye çubuğu: hasta gündelik, diğerleri teknik', () => {
    expect(hangBarLabels(true)).toEqual(['Baş önde', 'Düz', 'Baş geride']);
    expect(hangBarLabels(true).join(' ')).not.toMatch(/sarkık|Çene/);
    expect(hangBarLabels(false)).toEqual(['Çene göğse', 'Baş sarkıklığı', 'Geriye sarkık']);
  });
});
