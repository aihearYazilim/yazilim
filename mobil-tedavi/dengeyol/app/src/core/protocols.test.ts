import { describe, expect, it } from 'vitest';
import { evaluate } from './evaluator';
import { poseFromUp, upFromLying, upFromSitting } from './geometry';
import { MID_BED, PROTOCOLS, protocolForMode, resolveProtocol, type ProtocolId, type Target } from './protocols';

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
  it('hasta modu protokolleri: Dix-Hallpike, Epley, Semont; yatay kanal için sırtüstü baş çevirme ve BBQ roll (yeniden tasarım)', () => {
    expect(patientIds.sort()).toEqual(['bbq-roll', 'dix-hallpike', 'epley', 'semont', 'supine-roll']);
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

describe('tur 2 (E1-10): hasta konuşma metinleri kısa ve derecesiz', () => {
  it('Epley/Dix-Hallpike/Semont hasta yönergeleri ~12 s\'yi geçmez, "derece" ve "yarı yolda" yok', () => {
    for (const id of ['epley', 'dix-hallpike', 'semont'] as const) {
      for (const st of resolveProtocol(id, 'R').steps) {
        expect(st.say, `${id} ${st.id}`).not.toMatch(/derece|yarı yolda/);
        // 13 karakter/s (hız 1,0): Semont geçiş yönergesi iki parçalıdır (bekle + nasıl), biraz uzun.
        expect(st.say.length / 13, `${id} ${st.id}`).toBeLessThanOrEqual(id === 'semont' && st.id === 'se-2' ? 15 : 12.5);
      }
    }
  });
  it('Epley yatış yönergesi kısa dokunma talimatıyla, ardından kısa eylem cümlesiyle başlar', () => {
    // Dokunma talimatı en başta (hızla yatan hasta yönergenin sonunu beklemez; y03, y06 — yeni kullanıcı turu 1).
    const [first, second] = resolveProtocol('epley', 'R').steps[1]!.say.split('.');
    expect(first!.length).toBeLessThanOrEqual(50);
    expect(first).toMatch(/ekrana dokunun/);
    expect(second!.trim().length).toBeLessThanOrEqual(60);
    expect(second).toMatch(/^ Şimdi .*yatın/);
  });
  it('"ekrana dokunun" diyen her gözlem yönergesi bu talimatla başlar (hasta ve yardımcı)', () => {
    for (const id of ['dix-hallpike', 'supine-roll', 'epley', 'semont', 'bbq-roll'] as const) {
      for (const st of resolveProtocol(id, 'R').steps) {
        for (const t of [st.say, st.helperSay]) {
          if (!t || !/ekrana (siz )?dokunun/.test(t)) continue;
          expect(t.split('.')[0], t).toMatch(/ekrana (siz )?dokunun/);
        }
      }
    }
  });
});

describe('Dix-Hallpike bulgu anahtarı', () => {
  it('sol testte dhL yazılır', () => {
    expect(resolveProtocol('dix-hallpike', 'L').steps[1]!.finding).toBe('dhL');
    expect(resolveProtocol('dix-hallpike', 'R').steps[1]!.finding).toBe('dhR');
  });
});

describe('yeni kullanıcı turu 2 (M2-2, M2-7): hasta modunda gündelik başlıklar', () => {
  const patientIds = ids.filter((id) => PROTOCOLS[id].patient !== 'no');
  it.each(patientIds)('%s: hasta başlığı her adımda var; derece, teknik ad ve küçük harfle başlama yok', (id) => {
    for (const side of ['R', 'L'] as const) {
      const p = resolveProtocol(id, side);
      for (const st of p.steps) {
        expect(st.patientTitle, `${id} ${st.id}`).toBeTruthy();
        for (const t of [st.patientTitle!, st.short ?? '']) {
          expect(t, `${id} ${st.id}`).not.toMatch(/°|\d|Dix|Hallpike|Epley|Semont|BBQ|roll/i);
          expect(t.charAt(0), t).toBe(t.charAt(0).toLocaleUpperCase('tr-TR'));
        }
        // Yönergeler (ses ve ekran) büyük harfle başlar ("sol yanınızdan…" değil; y06).
        for (const t of [st.say, st.helperSay ?? '', st.reachedSay ?? '']) expect(t.charAt(0), t).toBe(t.charAt(0).toLocaleUpperCase('tr-TR'));
      }
      // Yürütücü başlığındaki kısa ad gündelik (teknik adlar kayıt, rapor ve klinisyende kalır).
      const pm = protocolForMode(p, 'patient');
      expect(pm.shortName, id).not.toMatch(/Dix|Hallpike|Epley|Semont|BBQ|roll/i);
      expect(protocolForMode(p, 'clinician').shortName).toBe(PROTOCOLS[id].shortName);
    }
  });

  it('başlıklar yöne göre aynalanır; teknik başlık (kayıt, klinisyen, yardımcı) değişmez', () => {
    const r = resolveProtocol('bbq-roll', 'R');
    const l = resolveProtocol('bbq-roll', 'L');
    expect(r.steps[4]!.patientTitle).toBe('Sağ yanınıza dönün');
    expect(l.steps[4]!.patientTitle).toBe('Sol yanınıza dönün');
    expect(r.steps[4]!.title).toBe('Sağ yanına (sırtüstünden 270°)');
    expect(resolveProtocol('epley', 'R').steps[3]!.patientTitle).toBe('Sol yanınıza dönün');
    expect(resolveProtocol('epley', 'R').steps[1]!.title).toBe('Sırtüstü, baş sağa 45° ve sarkık');
    // y06: "{H} yanınızdan dönerek…" artık büyük harfle.
    expect(r.steps[3]!.say.startsWith('Sol yanınızdan dönerek')).toBe(true);
  });

  it('M2-7: hızla yatılan adımdan önceki oturuşta (Dix-Hallpike, Epley) "yatağın ortasında" cümlesi; yardımcı metninde ve Semont\'ta yok', () => {
    for (const id of ['dix-hallpike', 'epley'] as const) {
      for (const side of ['R', 'L'] as const) {
        const p = resolveProtocol(id, side);
        expect(p.steps[0]!.say.startsWith(MID_BED), `${id} ${side}`).toBe(true);
        expect(p.steps[1]!.say).toMatch(/hızla sırtüstü yatın/);
        expect(p.steps[0]!.helperSay).not.toContain(MID_BED);
      }
    }
    expect(MID_BED).toBe('Yatağın ortasında oturun; düşmemek için kenara yakın olmayın.');
    expect(resolveProtocol('semont', 'R').steps[0]!.say).not.toContain(MID_BED);
  });
});
