import { describe, expect, it } from 'vitest';
import { EARLY_RETEST_MS, nextAction } from './episodes';
import type { Episode, ManeuverLog } from './types';

const base = new Date(2026, 9, 27, 10, 0).getTime();
const man = (at: number, completed = true): ManeuverLog => ({
  id: 'm' + at,
  at,
  protocolId: 'epley',
  side: 'R',
  completed,
  stopReason: null,
  records: [],
  manual: false
});
const ep = (p: Partial<Episode>): Episode => ({
  id: 'e',
  startedAt: base,
  side: 'R',
  protocolId: 'epley',
  redFlags: [],
  sideTests: [],
  maneuvers: [],
  retests: [],
  status: 'active',
  ...p
});

describe('sıradaki eylem', () => {
  it('manevradan sonra 30 dk tekrar testi', () => {
    const e = ep({ maneuvers: [man(base)] });
    expect(nextAction(e, base + 10 * 60000)).toMatchObject({ kind: 'early-retest', ready: false });
    expect(nextAction(e, base + EARLY_RETEST_MS)).toMatchObject({ kind: 'early-retest', ready: true });
  });
  it('erken test pozitif → yeniden manevra', () => {
    const e = ep({ maneuvers: [man(base)], retests: [{ at: base + EARLY_RETEST_MS, kind: 'early', side: 'R', vertigo: true, latencySec: 2, durationSec: 15 }] });
    expect(nextAction(e, base + EARLY_RETEST_MS + 1000).kind).toBe('treat-again');
  });
  it('erken test negatif → ertesi sabah 06:00 testi', () => {
    const e = ep({ maneuvers: [man(base)], retests: [{ at: base + EARLY_RETEST_MS, kind: 'early', side: 'R', vertigo: false, latencySec: null, durationSec: null }] });
    const na = nextAction(e, base + EARLY_RETEST_MS + 1000);
    expect(na.kind).toBe('morning-retest');
    if (na.kind === 'morning-retest') {
      expect(new Date(na.at).getHours()).toBe(6);
      expect(new Date(na.at).getDate()).toBe(28);
      expect(na.ready).toBe(false);
    }
  });
  it('sabah testi de negatif → düzeldi önerisi', () => {
    const e = ep({
      maneuvers: [man(base)],
      retests: [
        { at: base + EARLY_RETEST_MS, kind: 'early', side: 'R', vertigo: false, latencySec: null, durationSec: null },
        { at: base + 21 * 3600000, kind: 'morning', side: 'R', vertigo: false, latencySec: null, durationSec: null }
      ]
    });
    expect(nextAction(e, base + 22 * 3600000).kind).toBe('resolved-suggest');
  });
});
