import { describe, expect, it } from 'vitest';
import { poseFromUp, upFromLying, upFromSitting, type HeadPose } from './geometry';
import { resolveProtocol, type Target } from './protocols';
import {
  type Cue,
  DEFAULT_RUNNER_CONFIG,
  initialRunnerState,
  type RunnerConfig,
  type RunnerEvent,
  type RunnerState,
  runnerStep,
  vertigoSummary
} from './runner';

function ideal(t: Target): HeadPose {
  if (t.kind === 'sitting') return poseFromUp(upFromSitting((t.psiMin + t.psiMax) / 2));
  return poseFromUp(upFromLying(t.theta, (t.phiMin + t.phiMax) / 2));
}

interface Sim {
  cfg: RunnerConfig;
  s: RunnerState;
  t: number;
  cues: Cue[];
}

function sim(protocolId: 'epley' | 'semont' | 'dix-hallpike', mode: 'patient' | 'clinician' = 'patient'): Sim {
  const cfg: RunnerConfig = {
    ...DEFAULT_RUNNER_CONFIG,
    mode,
    protocol: resolveProtocol(protocolId, 'R'),
    introSecFor: () => 3
  };
  return { cfg, s: initialRunnerState(), t: 0, cues: [] };
}

type EventInput = RunnerEvent extends infer E ? (E extends RunnerEvent ? Omit<E, 'now'> & { now?: number } : never) : never;

function send(x: Sim, ev: EventInput) {
  const r = runnerStep(x.cfg, x.s, { ...ev, now: ev.now ?? x.t } as RunnerEvent);
  x.s = r.state;
  x.cues.push(...r.cues);
}

/** Hasta modeli: her adım başladıktan `reactSec` sonra hedef poza geçer. */
function run(x: Sim, opts: { reactSec?: number; maxSec?: number; poseOverride?: (stepIdx: number, tInStep: number) => HeadPose | null } = {}) {
  const react = opts.reactSec ?? 2;
  const maxSec = opts.maxSec ?? 1200;
  send(x, { type: 'start' });
  let prevPose = ideal(x.cfg.protocol.steps[0]!.target);
  while (x.t < maxSec * 1000) {
    x.t += 100;
    const step = x.cfg.protocol.steps[x.s.stepIndex]!;
    const inStep = (x.t - x.s.stepStartedAt) / 1000;
    let pose: HeadPose | null;
    if (opts.poseOverride) pose = opts.poseOverride(x.s.stepIndex, inStep);
    else pose = x.s.phase === 'between' ? prevPose : inStep >= react ? ideal(step.target) : prevPose;
    if (pose) prevPose = pose;
    send(x, { type: 'tick', pose });
    if (x.s.phase === 'done' || x.s.phase === 'aborted' || x.s.phase === 'safetyStop') break;
  }
}

describe('Epley yürütücüsü (hasta modu)', () => {
  it('ideal hasta ile tüm adımları tamamlar; süreler en azından minimum', () => {
    const x = sim('epley');
    run(x);
    expect(x.s.phase).toBe('done');
    expect(x.s.records).toHaveLength(5);
    x.cfg.protocol.steps.forEach((st, i) => {
      expect(x.s.records[i]!.holdSec).toBeGreaterThanOrEqual(st.minHoldSec - 0.11);
      expect(x.s.records[i]!.reachedAt).not.toBeNull();
    });
    const total = x.t / 1000;
    expect(total).toBeGreaterThan(5 + 45 * 3 + 60);
    expect(total).toBeLessThan(400);
    // "Tamam, böyle kalın" her adımda söylenir
    expect(x.cues.filter((c) => c.kind === 'speak' && c.text === 'Tamam, böyle kalın.').length).toBe(5);
  });

  it('hasta yanlış tarafa dönerse adım ilerlemez ve doğru yönü söyler', () => {
    const x = sim('epley');
    run(x, {
      maxSec: 60,
      poseOverride: (idx, t) => (idx === 0 ? ideal(x.cfg.protocol.steps[0]!.target) : t > 1 ? poseFromUp(upFromLying(-45, 25)) : null)
    });
    expect(x.s.stepIndex).toBe(1);
    expect(x.s.phase).toBe('seeking');
    expect(x.cues.some((c) => c.kind === 'speak' && c.text.includes('sağa çevirin'))).toBe(true);
  });

  it('bekleme sırasında pozisyon bozulursa sayaç durur, düzelince devam eder', () => {
    const x = sim('epley');
    const good = ideal(x.cfg.protocol.steps[1]!.target);
    const bad = poseFromUp(upFromLying(0, 25));
    run(x, {
      maxSec: 400,
      poseOverride: (idx, t) => {
        const st = x.cfg.protocol.steps[idx]!;
        if (idx === 1 && t > 20 && t < 35) return bad; // 15 s kayma
        return t > 1 ? ideal(st.target) : idx === 0 ? ideal(st.target) : good;
      }
    });
    expect(x.s.phase).toBe('done');
    const rec = x.s.records[1]!;
    expect(rec.driftCount).toBeGreaterThanOrEqual(1);
    // Adım süresi, kayma süresi kadar uzamış olmalı
    expect(((rec.endedAt ?? 0) - rec.startedAt) / 1000).toBeGreaterThan(45 + 12);
    expect(x.cues.some((c) => c.kind === 'speak' && c.text.startsWith('Pozisyonu koruyun'))).toBe(true);
  });

  it('baş dönmesi işaretlenirse bitişten sonra 30 s daha bekler', () => {
    const x = sim('epley');
    send(x, { type: 'start' });
    let marked = false;
    let ended = false;
    while (x.t < 400000) {
      x.t += 100;
      const st = x.cfg.protocol.steps[x.s.stepIndex]!;
      send(x, { type: 'tick', pose: ideal(st.target) });
      const inStep = (x.t - x.s.stepStartedAt) / 1000;
      if (x.s.stepIndex === 1 && !marked && inStep > 10) {
        send(x, { type: 'vertigoToggle' });
        marked = true;
      }
      if (x.s.stepIndex === 1 && marked && !ended && inStep > 40) {
        send(x, { type: 'vertigoToggle' });
        ended = true;
      }
      if (x.s.phase === 'done') break;
    }
    const rec = x.s.records[1]!;
    const dur = ((rec.endedAt ?? 0) - rec.startedAt) / 1000;
    expect(dur).toBeGreaterThanOrEqual(70); // 40 s'de bitti + 30 s
    expect(rec.vertigoMarks).toHaveLength(1);
    const v = vertigoSummary(rec)!;
    expect(v.durationSec).toBe(30);
  });

  it('baş dönmesi 2 dakikayı aşarsa hasta modunda güvenlik durdurması', () => {
    const x = sim('epley');
    send(x, { type: 'start' });
    let marked = false;
    while (x.t < 400000) {
      x.t += 100;
      const st = x.cfg.protocol.steps[x.s.stepIndex]!;
      send(x, { type: 'tick', pose: ideal(st.target) });
      if (x.s.stepIndex === 1 && !marked) {
        send(x, { type: 'vertigoToggle' });
        marked = true;
      }
      if (x.s.phase === 'safetyStop') break;
    }
    expect(x.s.phase).toBe('safetyStop');
    expect(x.s.stopReason).toBe('VERTIGO_TOO_LONG');
  });

  it('klinisyen modunda uzun baş dönmesi yalnızca uyarı verir, durdurmaz', () => {
    const x = sim('epley', 'clinician');
    send(x, { type: 'start' });
    let marked = false;
    while (x.t < 200000) {
      x.t += 100;
      const st = x.cfg.protocol.steps[x.s.stepIndex]!;
      send(x, { type: 'tick', pose: ideal(st.target) });
      if (x.s.stepIndex === 1 && !marked) {
        send(x, { type: 'vertigoToggle' });
        marked = true;
      }
    }
    expect(x.s.phase).not.toBe('safetyStop');
    expect(x.s.notice).toMatch(/atipik/);
  });

  it('sensör verisi yoksa hedef onaylanmaz; elle onay ile sayaç çalışır', () => {
    const x = sim('epley', 'clinician');
    send(x, { type: 'start' });
    for (let i = 0; i < 100; i++) {
      x.t += 100;
      send(x, { type: 'tick', pose: null });
    }
    expect(x.s.phase).toBe('seeking');
    send(x, { type: 'manualConfirm' });
    expect(x.s.phase).toBe('holding');
    // 5 s bekleme + 4 s adımlar arası hazırlık
    for (let i = 0; i < 100; i++) {
      x.t += 100;
      send(x, { type: 'tick', pose: null });
    }
    expect(x.s.stepIndex).toBe(1);
    expect(x.s.records[0]!.manual).toBe(true);
  });

  it('yönerge okunurken pozisyon "tamam" sayılmaz', () => {
    const x = sim('epley');
    x.cfg = { ...x.cfg, introSecFor: () => 10 };
    send(x, { type: 'start' });
    for (let i = 0; i < 50; i++) {
      x.t += 100;
      send(x, { type: 'tick', pose: ideal(x.cfg.protocol.steps[0]!.target) });
    }
    expect(x.s.phase).toBe('settling');
    for (let i = 0; i < 60; i++) {
      x.t += 100;
      send(x, { type: 'tick', pose: ideal(x.cfg.protocol.steps[0]!.target) });
    }
    expect(['holding', 'between']).toContain(x.s.phase);
  });

  it('duraklat / devam: devamda pozisyon yeniden doğrulanır', () => {
    const x = sim('epley');
    send(x, { type: 'start' });
    for (let i = 0; i < 80; i++) {
      x.t += 100;
      send(x, { type: 'tick', pose: ideal(x.cfg.protocol.steps[0]!.target) });
    }
    send(x, { type: 'pause' });
    expect(x.s.phase).toBe('paused');
    const held = x.s.holdSec;
    for (let i = 0; i < 50; i++) {
      x.t += 100;
      send(x, { type: 'tick', pose: ideal(x.cfg.protocol.steps[0]!.target) });
    }
    expect(x.s.holdSec).toBe(held);
    send(x, { type: 'resume' });
    expect(x.s.phase).toBe('seeking');
  });

  it('kullanıcı durdurursa aborted', () => {
    const x = sim('epley');
    send(x, { type: 'start' });
    send(x, { type: 'abort', reason: 'USER_ABORT' });
    expect(x.s.phase).toBe('aborted');
  });
});

describe('inceleme sonrası düzeltmeler', () => {
  it('baş dönmesi süresi en uzun dalgadır (ikinci uzun dalga gizlenmez, kısa dalgalar toplanmaz)', () => {
    const r = {
      stepId: 'x', title: 'x', startedAt: 0, firstInRangeAt: 1000, reachedAt: 2000, endedAt: null, holdSec: 0, samples: 0,
      inRangeSamples: 0, sumAbsThetaErr: 0, maxAbsThetaErr: 0, thetaSamples: 0, transitionSec: null, manual: false, driftCount: 0,
      vertigoMarks: [{ start: 3, end: 5 }, { start: 8, end: 98 }]
    };
    // En uzun tek dalga (90 s) — uzun ikinci dalga gizlenmez
    expect(vertigoSummary(r)).toEqual({ latencySec: 2, durationSec: 90 });
    expect(vertigoSummary({ ...r, vertigoMarks: [{ start: 3, end: 5 }, { start: 8, end: null }] })!.durationSec).toBeNull();
  });

  it('kazara çift dokunuş (1 s içinde) yok sayılır', () => {
    const x = sim('epley');
    send(x, { type: 'start' });
    x.t += 500;
    send(x, { type: 'vertigoToggle' });
    x.t += 300;
    send(x, { type: 'vertigoToggle' });
    expect(x.s.vertigoActive).toBe(true);
    expect(x.s.records[0]!.vertigoMarks).toHaveLength(1);
  });

  it('elle onaylı adım duraklat/devam sonrası tamamlanır', () => {
    const x = sim('epley', 'clinician');
    send(x, { type: 'start' });
    send(x, { type: 'manualConfirm' });
    x.t += 1000;
    send(x, { type: 'tick', pose: null });
    send(x, { type: 'pause' });
    send(x, { type: 'resume' });
    expect(x.s.phase).toBe('holding');
    for (let i = 0; i < 100; i++) {
      x.t += 100;
      send(x, { type: 'tick', pose: null });
    }
    expect(x.s.stepIndex).toBe(1);
  });
});

describe('Semont hızlı geçiş ölçümü', () => {
  it('yavaş geçişte uyarı notu üretir', () => {
    const x = sim('semont');
    const steps = x.cfg.protocol.steps;
    run(x, {
      maxSec: 600,
      poseOverride: (idx, t) => {
        if (idx === 2) {
          // 2 s bekle, sonra 6 s boyunca oturur geçiş, sonra hedef
          if (t < 2) return ideal(steps[1]!.target);
          if (t < 8) return poseFromUp(upFromSitting(0));
          return ideal(steps[2]!.target);
        }
        return t > 1 || idx === 0 ? ideal(steps[idx]!.target) : ideal(steps[Math.max(0, idx - 1)]!.target);
      }
    });
    const rec = x.s.records[2]!;
    expect(rec.transitionSec).not.toBeNull();
    expect(rec.transitionSec!).toBeGreaterThan(2);
  });
});

describe('kullanıcı ajanı düzeltmeleri', () => {
  it('baş dönmesi işaretliyken 30 sn arayla "geçtiyse dokunun" hatırlatılır, durdurma kuralı aynen kalır', () => {
    const x = sim('epley');
    send(x, { type: 'start' });
    let markedAt: number | null = null;
    while (x.t < 400000 && x.s.phase !== 'safetyStop') {
      x.t += 100;
      const st = x.cfg.protocol.steps[x.s.stepIndex]!;
      send(x, { type: 'tick', pose: ideal(st.target) });
      if (x.s.stepIndex === 1 && markedAt === null) {
        send(x, { type: 'vertigoToggle' });
        markedAt = x.t;
      }
    }
    const reminders = x.cues.filter((c) => c.kind === 'speak' && c.text.startsWith('Baş dönmesi geçtiyse'));
    // 30, 60 ve 90. saniyede; 120 s sınırında hatırlatma yerine durdurma gelir.
    expect(reminders.length).toBe(3);
    expect(x.s.phase).toBe('safetyStop');
  });

  it('baş dönmesi başlangıcı ve bitişi farklı titreşimle bildirilir', () => {
    const x = sim('epley');
    send(x, { type: 'start' });
    x.t += 500;
    send(x, { type: 'vertigoToggle' });
    x.t += 2000;
    send(x, { type: 'vertigoToggle' });
    const h = x.cues.filter((c) => c.kind === 'haptic').map((c) => (c as { pattern: string }).pattern);
    expect(h).toContain('markOn');
    expect(h).toContain('markOff');
  });
});

describe('tur 1 denetim düzeltmeleri', () => {
  it('Dix-Hallpike oturma adımında da (sınırsız adım) hasta modunda hatırlatma ve üst sınır vardır', () => {
    const x = sim('dix-hallpike');
    send(x, { type: 'start' });
    let marked = false;
    while (x.t < 900000 && x.s.phase !== 'safetyStop' && x.s.phase !== 'done') {
      x.t += 100;
      const st = x.cfg.protocol.steps[x.s.stepIndex]!;
      send(x, { type: 'tick', pose: ideal(st.target) });
      if (st.id === 'dh-up' && !marked && x.s.phase === 'holding') {
        send(x, { type: 'vertigoToggle' });
        marked = true;
      }
    }
    expect(marked).toBe(true);
    expect(x.s.phase).toBe('safetyStop');
    expect(x.cues.filter((c) => c.kind === 'speak' && c.text.startsWith('Baş dönmesi geçtiyse')).length).toBe(3);
  });

  it('duraklatmadayken baş dönmesi "geçti" olarak işaretlenebilir; devamda yanlış durdurma olmaz', () => {
    const x = sim('epley');
    send(x, { type: 'start' });
    while (x.s.stepIndex < 1) {
      x.t += 100;
      send(x, { type: 'tick', pose: ideal(x.cfg.protocol.steps[x.s.stepIndex]!.target) });
    }
    send(x, { type: 'vertigoToggle' });
    x.t += 20000;
    send(x, { type: 'pause' });
    x.t += 30000;
    send(x, { type: 'vertigoToggle' });
    expect(x.s.vertigoActive).toBe(false);
    x.t += 80000;
    send(x, { type: 'resume' });
    x.t += 100;
    send(x, { type: 'tick', pose: ideal(x.cfg.protocol.steps[x.s.stepIndex]!.target) });
    expect(x.s.phase).not.toBe('safetyStop');
  });

  it('duraklatmadayken yeni baş dönmesi başlatılamaz (yalnız bitiş)', () => {
    const x = sim('epley');
    send(x, { type: 'start' });
    send(x, { type: 'pause' });
    send(x, { type: 'vertigoToggle' });
    expect(x.s.vertigoActive).toBe(false);
  });
});
