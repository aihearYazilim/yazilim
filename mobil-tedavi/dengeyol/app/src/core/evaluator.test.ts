import { describe, expect, it } from 'vitest';
import { evaluate, HINT_TEXT_HELPER, HOLD_HYSTERESIS_DEG } from './evaluator';
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
