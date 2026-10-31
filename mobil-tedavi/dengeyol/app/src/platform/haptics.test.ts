import { describe, expect, it } from 'vitest';
import { HAPTIC_LEGEND, hapticTimings, type HapticPattern } from './haptics';

/** Titreşim sayısı ve en uzun/en kısa titreşim süresi. */
function shape(p: HapticPattern) {
  const t = hapticTimings(p);
  const on = t.filter((_, i) => i % 2 === 0);
  return { count: on.length, max: Math.max(...on), min: Math.min(...on), total: t.reduce((a, b) => a + b, 0) };
}

describe('tur 1 (D1): titreşim desenleri ayırt edilebilir', () => {
  it('tanıtılan her anlamın kendi deseni var', () => {
    const ps = HAPTIC_LEGEND.map((x) => x.pattern);
    expect(new Set(ps).size).toBe(ps.length);
    for (const need of ['move', 'reached', 'drift', 'stepDone', 'done', 'pause', 'markOn', 'markOff', 'alarm'] as HapticPattern[]) {
      expect(ps).toContain(need);
    }
  });

  it('aynı sayıda titreşimi olan iki desen süreyle (≥2 kat) ya da ritimle (uzun vuruşun yeri) ayrılır', () => {
    const ps = HAPTIC_LEGEND.map((x) => x.pattern);
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const a = shape(ps[i]!);
        const b = shape(ps[j]!);
        if (a.count !== b.count) continue;
        const ta = hapticTimings(ps[i]!);
        const tb = hapticTimings(ps[j]!);
        const longFirstA = ta[0]! > ta[ta.length - 1]!;
        const longFirstB = tb[0]! > tb[tb.length - 1]!;
        const ratio = Math.max(a.max, b.max) / Math.min(a.max, b.max);
        const rhythmDiffers = a.max / a.min !== b.max / b.min || longFirstA !== longFirstB;
        expect(ratio >= 2 || rhythmDiffers, `${ps[i]} ~ ${ps[j]}`).toBe(true);
      }
    }
  });

  it('tur 2 (E1-11): "hazırsanız dokunun" kendi desenine sahip, "hareket edin"den ayrı', () => {
    expect(HAPTIC_LEGEND.map((x) => x.pattern)).toContain('ready');
    expect(shape('ready').count).toBe(shape('move').count);
    expect(shape('move').max / shape('ready').max).toBeGreaterThanOrEqual(3);
    expect(shape('ready').count).not.toBe(shape('stepDone').count);
  });

  it('tur 3 (F1-2): "dur, yanlış taraf" kendi desenine sahip ve tanıtılır; başka hiçbir desenle aynı sayıda vuruşu yok', () => {
    const ps = HAPTIC_LEGEND.map((x) => x.pattern);
    expect(ps).toContain('wrongSide');
    expect(HAPTIC_LEGEND.find((x) => x.pattern === 'wrongSide')!.label).toMatch(/yanlış taraf/);
    for (const p of ps.filter((p) => p !== 'wrongSide')) expect(shape(p).count, p).not.toBe(shape('wrongSide').count);
    // "Bozuldu" vızıltısından seyrek ve uzun vuruşlu.
    expect(shape('wrongSide').min).toBeGreaterThanOrEqual(3 * shape('drift').max);
  });

  it('adım bitti ile manevra bitti farklı; bozuldu sürekli vızıltıdır (~1,5 s)', () => {
    expect(shape('stepDone').count).not.toBe(shape('done').count);
    expect(shape('drift').count).toBeGreaterThanOrEqual(10);
    expect(shape('drift').total).toBeGreaterThanOrEqual(1300);
    expect(shape('pause').count).not.toBe(shape('move').count);
  });
});
