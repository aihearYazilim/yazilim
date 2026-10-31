import { describe, expect, it } from 'vitest';
import { evaluate } from './evaluator';
import { poseFromUp, upFromLying, upFromSitting } from './geometry';
import { PROTOCOLS, resolveProtocol, type ProtocolId, type Target } from './protocols';

function idealPose(t: Target) {
  if (t.kind === 'sitting') return poseFromUp(upFromSitting((t.psiMin + t.psiMax) / 2));
  return poseFromUp(upFromLying(t.theta, (t.phiMin + t.phiMax) / 2));
}

const ids = Object.keys(PROTOCOLS) as ProtocolId[];

describe('protokol bütünlüğü', () => {
  it.each(ids)('%s: her adımın ideal pozu kendi hedefinde', (id) => {
    const sides = PROTOCOLS[id].sided ? (['R', 'L'] as const) : ([null] as const);
    for (const side of sides) {
      const p = resolveProtocol(id, side);
      for (const st of p.steps) {
        expect(evaluate(idealPose(st.target), st.target).inRange, `${id} ${side} ${st.id}`).toBe(true);
      }
    }
  });

  it.each(ids)('%s: metinlerde doldurulmamış belirteç kalmaz', (id) => {
    const sides = PROTOCOLS[id].sided ? (['R', 'L'] as const) : ([null] as const);
    for (const side of sides) {
      const p = resolveProtocol(id, side);
      for (const st of p.steps) {
        const extra = [st.reachedSay, st.short, st.helperTitle, st.helperSay, st.helperShort, st.helperReachedSay];
        for (const t of [st.title, st.say, st.clinician, st.unverifiable ?? '', ...extra.map((e) => e ?? '')]) expect(t).not.toMatch(/\{|\}/);
      }
    }
  });

  it.each(ids)('%s: ardışık adımlar birbirinin hedefinde değil (adım atlanamaz)', (id) => {
    const sides = PROTOCOLS[id].sided ? (['R'] as const) : ([null] as const);
    for (const side of sides) {
      const p = resolveProtocol(id, side);
      for (let i = 1; i < p.steps.length; i++) {
        const prev = p.steps[i - 1]!;
        const cur = p.steps[i]!;
        // Önceki adımın ideal pozu bir sonraki adımın hedefini karşılamamalı (ör. hareket etmeden "tamam" denmemeli).
        if (prev.target.kind === 'sitting' && cur.target.kind === 'sitting') continue;
        expect(evaluate(idealPose(prev.target), cur.target).inRange, `${id} ${prev.id}→${cur.id}`).toBe(false);
      }
    }
  });
});

describe('tur 1 (D1): hasta modundaki protokollerde yardımcı ve kısa metinler', () => {
  const patientIds = ids.filter((id) => PROTOCOLS[id].patient !== 'no');
  it('hasta modu protokolleri: Dix-Hallpike, Epley, Semont', () => {
    expect(patientIds.sort()).toEqual(['dix-hallpike', 'epley', 'semont']);
  });
  it.each(patientIds)('%s: her adımda yardımcı başlığı/yönergesi/özeti ve hasta özeti var', (id) => {
    for (const side of ['R', 'L'] as const) {
      const p = resolveProtocol(id, side);
      for (const st of p.steps) {
        expect(st.helperTitle, `${id} ${st.id}`).toBeTruthy();
        expect(st.helperSay, `${id} ${st.id}`).toBeTruthy();
        expect(st.helperShort, `${id} ${st.id}`).toBeTruthy();
        expect(st.short, `${id} ${st.id}`).toBeTruthy();
        // Yardımcı metni hastaya ikinci şahısla ("Başınızı") hitap etmez.
        expect(st.helperSay).not.toMatch(/\b(Başınızı|başınızı|yatın\.|oturun\.)/);
        if (st.unverifiable) {
          expect(st.reachedSay).toBeTruthy();
          expect(st.helperReachedSay).toBeTruthy();
        }
      }
    }
  });
  it('yön sözleri "hastanın sağı/solu" ile doldurulur (sol Epley)', () => {
    const p = resolveProtocol('epley', 'L');
    expect(p.steps[1]!.helperTitle).toBe('Sırtüstü, baş hastanın soluna 45° ve sarkık');
    expect(p.steps[2]!.helperSay).toMatch(/hastanın sağına doğru çevirin/);
    expect(p.steps[3]!.helperSay).toMatch(/ekranı göremezsiniz; sesi dinleyin/);
  });
});

describe('Epley açıları (sağ)', () => {
  const p = resolveProtocol('epley', 'R');
  it('Dix-Hallpike pozisyonu: baş sağa 45°, sarkık', () => {
    const t = p.steps[1]!.target;
    expect(t).toMatchObject({ kind: 'lying', theta: 45 });
  });
  it('ikinci pozisyon: baş sola 45°', () => {
    expect(p.steps[2]!.target).toMatchObject({ kind: 'lying', theta: -45 });
  });
  it('üçüncü pozisyon: sol yan, yüz yere 45° (θ = −135)', () => {
    expect(p.steps[3]!.target).toMatchObject({ kind: 'lying', theta: -135 });
  });
  it('sol Epley aynalanır', () => {
    const l = resolveProtocol('epley', 'L');
    expect(l.steps.map((s) => (s.target.kind === 'lying' ? s.target.theta : null))).toEqual([null, -45, 45, 135, null]);
    expect(l.steps[1]!.say).toContain('sola');
    expect(l.steps[3]!.say).toContain('sağ yanınıza');
  });
});

describe('Semont açıları (sağ)', () => {
  const p = resolveProtocol('semont', 'R');
  it('sağ yana yat, burun yukarı 45° (θ=+45, sarkma yok)', () => {
    expect(p.steps[1]!.target).toMatchObject({ kind: 'lying', theta: 45 });
    const t = p.steps[1]!.target;
    if (t.kind === 'lying') expect(t.phiMax).toBeLessThanOrEqual(30);
  });
  it('sol yana geç, burun yere 45° (θ=−135), hızlı geçiş', () => {
    expect(p.steps[2]!.target).toMatchObject({ kind: 'lying', theta: -135 });
    expect(p.steps[2]!.fastTransitionSec).toBeDefined();
  });
  it('başlangıçta baş sağlam (sol) tarafa çevrilir', () => {
    expect(p.steps[0]!.say).toContain('sola');
  });
});

describe('BBQ roll yönü', () => {
  it('sağ BBQ, sağlam (sol) tarafa doğru 90°lik adımlarla 360° döner', () => {
    const p = resolveProtocol('bbq-roll', 'R');
    const thetas = p.steps.filter((s) => s.target.kind === 'lying').map((s) => (s.target as { theta: number }).theta);
    expect(thetas).toEqual([90, 0, -90, 180, 90, 0]);
  });
});

describe('Dix-Hallpike bulgu anahtarı', () => {
  it('sol testte dhL yazılır', () => {
    expect(resolveProtocol('dix-hallpike', 'L').steps[1]!.finding).toBe('dhL');
    expect(resolveProtocol('dix-hallpike', 'R').steps[1]!.finding).toBe('dhR');
  });
});
