// @vitest-environment jsdom
/**
 * Yeni kullanıcı turu 2 (M2-2; y01, y03): hasta kendisi yapıyorken yürütücü ekranındaki yön sözleri ikinci şahısla
 * ("SAĞINIZA"); yardımcı ve klinisyen afişi "HASTANIN SAĞINA" olarak kalır (RunnerView içindeki HintBanner).
 */
import { describe, expect, it } from 'vitest';
import { HINT_TEXT_PATIENT, type HintKey } from '../../core/evaluator';
import { hintSelfText, RUNNER_EMERGENCY_LINE } from './RunnerView';

describe('hasta yürütücüsünde gündelik yön sözleri (M2-2)', () => {
  it('yön ipuçları "SAĞINIZA / SOLUNUZA"; "HASTANIN" yok; diğer ipuçları hasta metniyle', () => {
    expect(hintSelfText('TURN_RIGHT', HINT_TEXT_PATIENT)).toBe('Başınızı SAĞINIZA biraz daha çevirin');
    expect(hintSelfText('TURN_LEFT', HINT_TEXT_PATIENT)).toBe('Başınızı SOLUNUZA biraz daha çevirin');
    expect(hintSelfText('WRONG_SIDE_LEFT', HINT_TEXT_PATIENT)).toMatch(/SOL YANINIZA/);
    for (const k of Object.keys(HINT_TEXT_PATIENT) as HintKey[]) expect(hintSelfText(k, HINT_TEXT_PATIENT)).not.toMatch(/HASTANIN|hastanın/);
    expect(hintSelfText('HANG_MORE', HINT_TEXT_PATIENT)).toBe(HINT_TEXT_PATIENT.HANG_MORE);
  });

  it('M2-1: yürütücüdeki kırmızı satır kısa ve 112 içerir', () => {
    expect(RUNNER_EMERGENCY_LINE).toMatch(/112/);
    expect(RUNNER_EMERGENCY_LINE.length).toBeLessThanOrEqual(70);
  });
});
