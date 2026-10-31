import { describe, expect, it } from 'vitest';
import {
  evaluate,
  HINT_TEXT_CLINICIAN,
  HINT_TEXT_HELPER,
  HINT_TEXT_PATIENT,
  HOLD_HYSTERESIS_DEG,
  onWrongSide,
  sideGuarded
} from './evaluator';
import { poseFromUp, upFromLying } from './geometry';
import { LIMITS, resolveProtocol } from './protocols';

describe('tur 1 (D1): sarkma histerezisi', () => {
  const t = resolveProtocol('epley', 'R').steps[1]!.target;
  it('hedefe giriş tam aralık ister; pay yalnız tutma sırasında', () => {
    const p = poseFromUp(upFromLying(45, LIMITS.hangPhiMin - 2));
    expect(evaluate(p, t).inRange).toBe(false);
    expect(evaluate(p, t).hint).toBe('HANG_MORE');
    expect(evaluate(p, t, { holdMarginDeg: HOLD_HYSTERESIS_DEG }).inRange).toBe(true);
  });
  it('pay küçüktür: sınırın 3°ten fazla altı tutmada da hedef dışı', () => {
    const p = poseFromUp(upFromLying(45, LIMITS.hangPhiMin - HOLD_HYSTERESIS_DEG - 1.5));
    expect(evaluate(p, t, { holdMarginDeg: HOLD_HYSTERESIS_DEG }).inRange).toBe(false);
  });
  it('dönüş toleransı paydan etkilenmez', () => {
    const p = poseFromUp(upFromLying(45 + LIMITS.thetaTol + 2, 25));
    expect(evaluate(p, t, { holdMarginDeg: HOLD_HYSTERESIS_DEG }).inRange).toBe(false);
  });
});

describe('tur 1 (D1): gövde dönmeden yüz yere (Epley 3)', () => {
  const ep3 = resolveProtocol('epley', 'R').steps[3]!.target; // sol yan, burun yere (θ −135)
  it('baş −95°te (gövde dönmemiş) "bütün vücudunuzla dönün" ipucu', () => {
    expect(evaluate(poseFromUp(upFromLying(-95, 0)), ep3).hint).toBe('TURN_BODY_LEFT');
    expect(evaluate(poseFromUp(upFromLying(-45, 20)), ep3).hint).toBe('TURN_BODY_LEFT');
  });
  it('gövde dönmüş, baş biraz eksik → olağan dönüş ipucu', () => {
    expect(evaluate(poseFromUp(upFromLying(-115, 0)), ep3).hint).toBe('TURN_LEFT');
  });
  it('sağ taraf aynalanır', () => {
    const ep3L = resolveProtocol('epley', 'L').steps[3]!.target;
    expect(evaluate(poseFromUp(upFromLying(95, 0)), ep3L).hint).toBe('TURN_BODY_RIGHT');
  });
  it('yan yatıştan baş çevirilen hedefte (Gufoni) gövde ipucu verilmez', () => {
    const gg2 = resolveProtocol('gufoni-geo', 'R').steps[2]!.target;
    expect(evaluate(poseFromUp(upFromLying(-90, 0)), gg2).hint).toBe('TURN_LEFT');
  });
  it('yardımcı metinleri "hastanın sağı/solu" der', () => {
    expect(HINT_TEXT_HELPER.TURN_LEFT).toMatch(/hastanın soluna/);
    expect(HINT_TEXT_HELPER.TURN_RIGHT).toMatch(/hastanın sağına/);
  });
});

describe('tur 2 (E1-1): yan yatış hedefinde yanlış taraf (yüzüstünden geçirilmez)', () => {
  // Sol arka kanal Epley 3. adım: hedef hastanın SAĞ yanı, burun yere (θ +135); k02'nin denediği açılar.
  const ep3L = resolveProtocol('epley', 'L').steps[3]!.target;
  const at = (theta: number, phi = 0, latched = false) =>
    evaluate(poseFromUp(upFromLying(theta, phi)), ep3L, { wrongSideLatched: latched });
  it('karşı yanda (θ −30…−160) en kısa açıyla yön verilmez: "önce sırtüstüne" ipucu', () => {
    for (const th of [-30, -50, -90, -150]) {
      const e = at(th);
      expect(e.hint, `θ ${th}`).toBe('WRONG_SIDE_RIGHT');
      expect(e.wrongSide).toBe(true);
      expect(e.inRange).toBe(false);
    }
  });
  it('sırtüstüne yakın karşı yanda yön hedefe doğrudur (sırtüstünden geçer)', () => {
    expect(at(-10).hint).toBe('TURN_BODY_RIGHT');
    expect(at(20).hint).toBe('TURN_BODY_RIGHT');
  });
  it('yüzüstü üzerinden gelen (kilitli) hasta hedefte bile kabul edilmez; sırtüstüne yakınken kilit işlemez', () => {
    expect(at(170).hint).toBe('TURN_LEFT');
    expect(at(170, 0, true).hint).toBe('WRONG_SIDE_RIGHT');
    expect(at(135, 0, true).inRange).toBe(false);
    expect(at(135, 0, false).inRange).toBe(true);
    expect(at(10, 0, true).wrongSide).toBeUndefined();
  });
  it('metinler: hasta, yardımcı ve klinisyen ("hastanın sağına")', () => {
    expect(HINT_TEXT_PATIENT.WRONG_SIDE_RIGHT).toMatch(/yanlış taraf.*sırtüstüne.*sağ yanınıza/);
    expect(HINT_TEXT_HELPER.WRONG_SIDE_LEFT).toMatch(/sırtüstüne getirin.*sol yanına/);
    expect(HINT_TEXT_CLINICIAN.WRONG_SIDE_RIGHT).toMatch(/hastanın sağına/);
    expect(HINT_TEXT_CLINICIAN.TURN_RIGHT).toMatch(/hastanın sağına/);
    expect(HINT_TEXT_CLINICIAN.TURN_LEFT).toMatch(/hastanın soluna/);
  });
  it('hangi hedefler: yan yatış (gövdeyle, Gufoni, Semont 2) evet; sırtüstü 45° ve yüzüstü/yüzüstünden gelinen BBQ hayır', () => {
    expect(sideGuarded(ep3L)).toBe(true);
    expect(sideGuarded(resolveProtocol('gufoni-geo', 'R').steps[1]!.target)).toBe(true);
    expect(sideGuarded(resolveProtocol('semont', 'R').steps[2]!.target)).toBe(true);
    expect(sideGuarded(resolveProtocol('epley', 'R').steps[1]!.target)).toBe(false);
    expect(sideGuarded(resolveProtocol('bbq-roll', 'R').steps[3]!.target)).toBe(false);
    const bbq4 = resolveProtocol('bbq-roll', 'R').steps[4]!.target;
    expect(sideGuarded(bbq4)).toBe(false);
    expect(onWrongSide(poseFromUp(upFromLying(-175, 0)), bbq4)).toBe(false);
  });
});
