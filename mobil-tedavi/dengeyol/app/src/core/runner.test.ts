import { describe, expect, it } from 'vitest';
import { poseFromUp, upFromLying, upFromSitting, type HeadPose } from './geometry';
import { protocolForMode, resolveProtocol, type Target } from './protocols';
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
    protocol: protocolForMode(resolveProtocol(protocolId, 'R'), mode),
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
    // "Tamam, böyle kalın" doğrulanan her adımda söylenir; otururken baş çevirme (doğrulanamaz) adımında dürüst cümle
    expect(x.cues.filter((c) => c.kind === 'speak' && c.text === 'Tamam, böyle kalın.').length).toBe(4);
    expect(x.cues.some((c) => c.kind === 'speak' && c.text.startsWith('Başınızı sağa çevirdiyseniz öyle kalın'))).toBe(true);
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
  it('baş dönmesi işaretliyken 15 sn\'de, sonra 30 sn arayla "geçtiyse dokunun" hatırlatılır, durdurma kuralı aynen kalır', () => {
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
    // 15, 45, 75 ve 105. saniyede; 120 s sınırında hatırlatma yerine durdurma gelir.
    expect(reminders.length).toBe(4);
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
    expect(x.cues.filter((c) => c.kind === 'speak' && c.text.startsWith('Baş dönmesi geçtiyse')).length).toBe(4);
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

describe('tur 3 kod denetimi', () => {
  it('duraklatma süresi baş dönmesi kaydına (süre) eklenmez', () => {
    const x = sim('epley');
    send(x, { type: 'start' });
    while (x.s.stepIndex < 1) {
      x.t += 100;
      send(x, { type: 'tick', pose: ideal(x.cfg.protocol.steps[x.s.stepIndex]!.target) });
    }
    send(x, { type: 'vertigoToggle' });
    x.t += 5000;
    send(x, { type: 'pause' });
    x.t += 70000;
    send(x, { type: 'resume' });
    x.t += 8000;
    send(x, { type: 'vertigoToggle' });
    const rec = x.s.records[x.s.records.length - 1]!;
    expect(vertigoSummary(rec)!.durationSec).toBe(13);
  });
  it('sensörsüz hasta modunda pozisyon yönergeden sonra kendiliğinden onaylanır', () => {
    const x = sim('epley');
    x.cfg = { ...x.cfg, sensorless: true };
    send(x, { type: 'start' });
    for (let i = 0; i < 600; i++) {
      x.t += 100;
      send(x, { type: 'tick', pose: null });
    }
    expect(x.s.records[0]!.manual).toBe(true);
    expect(x.cues.some((c) => c.kind === 'speak' && c.text.startsWith('Sensörden veri'))).toBe(false);
  });
});

describe('son kullanıcı turu düzeltmeleri', () => {
  it('sesli sayım tek kaynaktan: baş dönmesi sürerken sayılmaz, bittikten sonra kalan bekleme sayılır', () => {
    const x = sim('epley');
    x.cfg = { ...x.cfg, countEverySec: 10 };
    send(x, { type: 'start' });
    const counts: { phase: 'before' | 'during' | 'after'; left: number }[] = [];
    let state: 'before' | 'during' | 'after' = 'before';
    while (x.t < 400000) {
      x.t += 100;
      const st = x.cfg.protocol.steps[x.s.stepIndex]!;
      const n = x.cues.length;
      send(x, { type: 'tick', pose: ideal(st.target) });
      const inStep = (x.t - x.s.stepStartedAt) / 1000;
      if (x.s.stepIndex === 1) {
        for (const c of x.cues.slice(n)) {
          const m = c.kind === 'speak' ? /^(\d+) saniye kaldı\.$/.exec(c.text) : null;
          if (m) counts.push({ phase: state, left: Number(m[1]) });
        }
        if (state === 'before' && inStep > 10) {
          send(x, { type: 'vertigoToggle' });
          state = 'during';
        } else if (state === 'during' && inStep > 40) {
          send(x, { type: 'vertigoToggle' });
          state = 'after';
        }
      }
      if (x.s.phase === 'done') break;
    }
    expect(counts.filter((c) => c.phase === 'during')).toHaveLength(0);
    const after = counts.filter((c) => c.phase === 'after').map((c) => c.left);
    expect(after.length).toBeGreaterThan(0);
    // "Geçti" sonrası 30 s bekleme: sayım 30'u aşmaz, azalır ve 0 söylenmez.
    expect(Math.max(...after)).toBeLessThanOrEqual(30);
    expect(after).toEqual([...after].sort((a, b) => b - a));
    expect(after.every((v) => v >= 5)).toBe(true);
  });

  it('45 s adımda son "5 saniye kaldı" da söylenir (sessizlik 10 s\'yi geçmez)', () => {
    const x = sim('epley');
    x.cfg = { ...x.cfg, countEverySec: 10 };
    run(x);
    const texts = x.cues.filter((c) => c.kind === 'speak').map((c) => (c as { text: string }).text);
    expect(texts).toContain('5 saniye kaldı.');
  });

  it('"Manevra tamamlandı" yürütücüde kısa; dinlenme önerisi bitiş ekranına kalır', () => {
    const x = sim('epley');
    run(x);
    expect(x.s.phase).toBe('done');
    expect(x.cues.some((c) => c.kind === 'speak' && c.text === 'Manevra tamamlandı.')).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------
// Kullanıcı turu 1 — D1 (yürütücü ve manevra)
// ---------------------------------------------------------------------------------------------
const spoken = (x: Sim) => x.cues.filter((c) => c.kind === 'speak').map((c) => (c as { text: string }).text);
const hapticsOf = (cues: Cue[]) => cues.filter((c) => c.kind === 'haptic').map((c) => (c as { pattern: string }).pattern);

/** Epley: 0. adım ideal, 1. adımda (sarkık) verilen poz. */
function epleyStuck(x: Sim, stuck: HeadPose, maxSec: number) {
  const s0 = x.cfg.protocol.steps[0]!.target;
  run(x, { maxSec, poseOverride: (idx, t) => (idx === 0 || t <= 1 ? ideal(s0) : stuck) });
}

describe('tur 1 D1-1: hedefe gelemeyen hasta (hedef gevşetilmez)', () => {
  it('2 zorlama ipucundan sonra "Daha fazla zorlamayın"; ~60 s sonra durur, kayda "pozisyona gelinemedi" yazılır', () => {
    const x = sim('epley');
    epleyStuck(x, poseFromUp(upFromLying(45, 8)), 400);
    expect(x.s.phase).toBe('safetyStop');
    expect(x.s.stopReason).toBe('POSITION_UNREACHABLE');
    const rec = x.s.records[1]!;
    expect(rec.unreachable).toBe(true);
    // Hedef gevşetilmedi: pozisyon hiç "tamam" sayılmadı, sayaç başlamadı.
    expect(rec.reachedAt).toBeNull();
    expect(rec.holdSec).toBe(0);
    const texts = spoken(x);
    const strainAt = texts.findIndex((t) => t.startsWith('Daha fazla zorlamayın'));
    expect(strainAt).toBeGreaterThan(-1);
    expect(texts.slice(0, strainAt).filter((t) => t === 'Başınızı biraz daha geriye bırakın.')).toHaveLength(2);
    // Sınırsız tekrar yok (önceden 100 s'de 20 kez); uyarıdan sonra seyrek ve yumuşak.
    expect(texts.filter((t) => /biraz daha geriye/.test(t)).length).toBeLessThanOrEqual(5);
    expect(texts.slice(strainAt + 1).every((t) => !t.startsWith('Başınızı biraz daha geriye'))).toBe(true);
    const dur = ((rec.endedAt ?? 0) - rec.startedAt) / 1000;
    expect(dur).toBeGreaterThanOrEqual(60);
    expect(dur).toBeLessThan(70);
    expect(hapticsOf(x.cues)).toContain('alarm');
    expect(texts[texts.length - 1]).toMatch(/gelinemedi.*hekiminize danışın/);
  });

  it('klinisyen modunda kendiliğinden durdurulmaz', () => {
    const x = sim('epley', 'clinician');
    epleyStuck(x, poseFromUp(upFromLying(45, 8)), 200);
    expect(x.s.phase).toBe('seeking');
    expect(x.s.stopReason).toBeNull();
  });

  it('henüz yatmamış hasta (duruş) bu kuralla durdurulmaz', () => {
    const x = sim('epley');
    epleyStuck(x, ideal(x.cfg.protocol.steps[0]!.target), 150);
    expect(x.s.phase).toBe('seeking');
  });

  it('baş dönmesi işaretliyken gelinemedi süresi işlemez (2 dk kuralı geçerli)', () => {
    const x = sim('epley');
    const s0 = x.cfg.protocol.steps[0]!.target;
    const stuck = poseFromUp(upFromLying(45, 8));
    send(x, { type: 'start' });
    let marked = false;
    while (x.t < 400000 && x.s.phase !== 'safetyStop') {
      x.t += 100;
      const inStep = (x.t - x.s.stepStartedAt) / 1000;
      send(x, { type: 'tick', pose: x.s.stepIndex === 0 || inStep <= 1 ? ideal(s0) : stuck });
      if (x.s.stepIndex === 1 && inStep > 5 && !marked) {
        send(x, { type: 'vertigoToggle' });
        marked = true;
      }
    }
    expect(x.s.stopReason).toBe('VERTIGO_TOO_LONG');
  });

  it('duraklatmada "Pozisyona gelemiyorum / boynum ağrıyor": durdurur, kaydeder, hekime yönlendirir', () => {
    const x = sim('epley');
    send(x, { type: 'start' });
    while (x.s.stepIndex < 1) {
      x.t += 100;
      send(x, { type: 'tick', pose: ideal(x.cfg.protocol.steps[x.s.stepIndex]!.target) });
    }
    send(x, { type: 'pause' });
    expect(x.s.records[1]!.pauses).toBe(1);
    send(x, { type: 'abort', reason: 'POSITION_UNREACHABLE' });
    expect(x.s.phase).toBe('safetyStop');
    expect(x.s.stopReason).toBe('POSITION_UNREACHABLE');
    expect(x.s.records[1]!.unreachable).toBe(true);
  });

  it('hiç sarkmıyorsa (yastık başın altında) bir kez yastık ipucu', () => {
    const x = sim('epley');
    epleyStuck(x, poseFromUp(upFromLying(45, 1)), 40);
    const texts = spoken(x);
    expect(texts.filter((t) => t.startsWith('Yastık başınızın altında olabilir'))).toHaveLength(1);
  });
});

describe('tur 1 D1-2: baş dönmesi işaretliyken hatırlatma', () => {
  it('ilk hatırlatma 15 s\'de, işaretin kendi titreşimiyle ve sonucunu söyler', () => {
    const x = sim('epley');
    send(x, { type: 'start' });
    while (x.s.stepIndex < 1 || x.s.phase !== 'holding') {
      x.t += 100;
      send(x, { type: 'tick', pose: ideal(x.cfg.protocol.steps[x.s.stepIndex]!.target) });
    }
    send(x, { type: 'vertigoToggle' });
    const n = x.cues.length;
    for (let i = 0; i < 145; i++) {
      x.t += 100;
      send(x, { type: 'tick', pose: ideal(x.cfg.protocol.steps[1]!.target) });
    }
    expect(spoken({ ...x, cues: x.cues.slice(n) }).some((t) => t.startsWith('Baş dönmesi geçtiyse'))).toBe(false);
    for (let i = 0; i < 10; i++) {
      x.t += 100;
      send(x, { type: 'tick', pose: ideal(x.cfg.protocol.steps[1]!.target) });
    }
    const after = x.cues.slice(n);
    const rem = spoken({ ...x, cues: after }).find((t) => t.startsWith('Baş dönmesi geçtiyse'));
    expect(rem).toBe(
      'Baş dönmesi geçtiyse ekrana dokunun; sürüyorsa böyle kalın. Dokunmazsanız 105 saniye sonra durdurup sizi hekime yönlendireceğim.'
    );
    expect(hapticsOf(after)).toEqual(['markOn']);
  });
});

describe('tur 1 D1-6: doğrulanamayan oturuş/baş çevirme adımı', () => {
  it('erken "Tamam" ve "doğru" titreşimi yok; dürüst cümle ve en az 7 s', () => {
    const x = sim('epley');
    send(x, { type: 'start' });
    while (x.s.stepIndex < 1) {
      x.t += 100;
      send(x, { type: 'tick', pose: ideal(x.cfg.protocol.steps[x.s.stepIndex]!.target) });
    }
    const texts = spoken(x);
    expect(texts).not.toContain('Tamam, böyle kalın.');
    expect(texts).toContain('Başınızı sağa çevirdiyseniz öyle kalın; birazdan yatacağız.');
    expect(hapticsOf(x.cues)).not.toContain('reached');
    expect(x.s.records[0]!.holdSec).toBeGreaterThanOrEqual(7 - 0.11);
  });
});

describe('tur 1 D1-7: yönergenin gerçek bitişi beklenir', () => {
  function seq(introSpokenAtSec: number | null, stepIndex = 0) {
    const x = sim('epley');
    x.cfg = { ...x.cfg, introSecFor: () => 10, awaitSpeechEnd: true };
    const pose = ideal(x.cfg.protocol.steps[0]!.target);
    const phaseAt: Record<number, string> = {};
    send(x, { type: 'start' });
    for (let i = 1; i <= 300; i++) {
      x.t = i * 100;
      if (introSpokenAtSec !== null && x.t === introSpokenAtSec * 1000) send(x, { type: 'introSpoken', stepIndex });
      send(x, { type: 'tick', pose });
      phaseAt[x.t] = x.s.phase;
    }
    return phaseAt;
  }
  it('bitiş olayı tahminden geç gelirse sayaç ondan önce başlamaz', () => {
    const p = seq(15);
    expect(p[14900]).toBe('settling');
    expect(p[15100]).toBe('holding');
  });
  it('bitiş erken gelirse tahminin %60\'ından önce bitmez', () => {
    const p = seq(4);
    expect(p[5900]).toBe('settling');
    expect(p[6100]).toBe('holding');
  });
  it('olay hiç gelmezse üst sınır tahmin×2+3 s', () => {
    const p = seq(null);
    expect(p[22900]).toBe('settling');
    expect(p[23100]).toBe('holding');
  });
  it('başka adımın geç gelen bitiş olayı yok sayılır', () => {
    const p = seq(4, 3);
    expect(p[22900]).toBe('settling');
  });
  it('kapalıyken (test/simülasyon) yalnız tahmin: belirlenimci', () => {
    const x = sim('epley');
    x.cfg = { ...x.cfg, introSecFor: () => 10 };
    send(x, { type: 'start' });
    send(x, { type: 'introSpoken', stepIndex: 0, now: 2000 });
    for (let i = 1; i <= 101; i++) {
      x.t = i * 100;
      send(x, { type: 'tick', pose: ideal(x.cfg.protocol.steps[0]!.target) });
      if (x.t === 9900) expect(x.s.phase).toBe('settling');
    }
    expect(x.s.phase).toBe('holding');
  });
  it('adım yönergesi konuşması etiketlidir (arayüz bitişini bildirsin)', () => {
    const x = sim('epley');
    send(x, { type: 'start' });
    const c = x.cues.find((q) => q.kind === 'speak');
    expect(c).toMatchObject({ kind: 'speak', tag: 'stepIntro', stepIndex: 0 });
  });
});

describe('tur 1 D1-8: sarkma sınırında histerezis', () => {
  it('sınırda gürültü "bozuldu/düzeldi" gidip gelmesi yapmaz; gerçek kayma yine yakalanır', () => {
    const x = sim('epley');
    const st = x.cfg.protocol.steps;
    run(x, {
      maxSec: 400,
      poseOverride: (idx, t) => {
        if (idx !== 1) return ideal(st[idx]!.target);
        if (t <= 1) return ideal(st[0]!.target);
        if (t < 10) return ideal(st[1]!.target);
        if (t < 30) return poseFromUp(upFromLying(45, Math.floor(t * 10) % 6 < 3 ? 13 : 16)); // sınırda gürültü
        if (t < 38) return poseFromUp(upFromLying(45, 8)); // gerçek kayma
        return ideal(st[1]!.target);
      }
    });
    expect(x.s.phase).toBe('done');
    expect(x.s.records[1]!.driftCount).toBe(1);
    expect(spoken(x).filter((t) => t.startsWith('Pozisyonu koruyun'))).toHaveLength(1);
    // Rapor için sarkma özeti tutulur (tam aralıkla).
    expect(x.s.records[1]!.minPhi!).toBeLessThan(9);
  });
});

describe('tur 1 D1-10: Semont geçişi "3-2-1 şimdi" ile', () => {
  it('yönergeden sonra sayım; hareket "şimdi" ile; hızlı geçişte uyarı yok', () => {
    const x = sim('semont');
    const steps = x.cfg.protocol.steps;
    run(x, {
      maxSec: 600,
      poseOverride: (idx, t) => {
        if (idx === 2) return t < 7 ? ideal(steps[1]!.target) : ideal(steps[2]!.target);
        return t > 1 || idx === 0 ? ideal(steps[idx]!.target) : ideal(steps[Math.max(0, idx - 1)]!.target);
      }
    });
    const texts = spoken(x);
    const i3 = texts.indexOf('Üç.');
    expect(i3).toBeGreaterThan(-1);
    expect(texts.slice(i3, i3 + 4)).toEqual(['Üç.', 'İki.', 'Bir.', 'Şimdi!']);
    const rec = x.s.records[2]!;
    expect(((rec.reachedAt ?? 0) - rec.startedAt) / 1000).toBeGreaterThanOrEqual(6); // yönerge 3 s + sayım 3 s
    expect(rec.transitionSec!).toBeLessThanOrEqual(2);
    expect(rec.slowTransition).toBeUndefined();
    // "Şimdi" ile birlikte hareket titreşimi
    const iNow = x.cues.findIndex((c) => c.kind === 'speak' && c.text === 'Şimdi!');
    expect(x.cues.slice(iNow - 2, iNow).some((c) => c.kind === 'haptic' && c.pattern === 'move')).toBe(true);
  });

  it('yavaş geçiş hastaya söylenir ve kayda geçer', () => {
    const x = sim('semont');
    const steps = x.cfg.protocol.steps;
    run(x, {
      maxSec: 600,
      poseOverride: (idx, t) => {
        if (idx === 2) {
          if (t < 6) return ideal(steps[1]!.target);
          if (t < 11) return poseFromUp(upFromSitting(0));
          return ideal(steps[2]!.target);
        }
        return t > 1 || idx === 0 ? ideal(steps[idx]!.target) : ideal(steps[Math.max(0, idx - 1)]!.target);
      }
    });
    const rec = x.s.records[2]!;
    expect(rec.slowTransition).toBe(true);
    expect(rec.transitionSec!).toBeGreaterThan(2);
    expect(spoken(x).some((t) => /^Geçiş \d+ saniye sürdü; bir dahaki sefere tek hamlede/.test(t))).toBe(true);
  });
});

describe('tur 1 D1-5: yardımcı modu', () => {
  it('yönerge ve ipuçları yardımcıya, "hastanın sağı/solu" ile', () => {
    const x = sim('epley');
    x.cfg = { ...x.cfg, helper: true };
    const s0 = x.cfg.protocol.steps[0]!.target;
    run(x, { maxSec: 40, poseOverride: (idx, t) => (idx === 0 || t <= 1 ? ideal(s0) : poseFromUp(upFromLying(-30, 25))) });
    const texts = spoken(x);
    expect(texts[0]).toMatch(/hastanın sağına çevirin/);
    expect(texts).toContain('Başı hastanın sağına biraz daha çevirin.');
    expect(texts.some((t) => /^Başınızı/.test(t))).toBe(false);
  });
});

describe('tur 1 D1-13: klinisyen', () => {
  it('en az süre dolmadan geçilen adım "erken bitirildi" kaydı alır', () => {
    const x = sim('epley', 'clinician');
    send(x, { type: 'start' });
    send(x, { type: 'manualConfirm' });
    x.t += 1000;
    send(x, { type: 'tick', pose: null });
    send(x, { type: 'skipStep' });
    expect(x.s.records[0]!.endedEarly).toBe(true);
  });
  it('BBQ roll klinisyende adım başına en çok 30 s', () => {
    const p = protocolForMode(resolveProtocol('bbq-roll', 'R'), 'clinician');
    expect(Math.max(...p.steps.map((s) => s.minHoldSec))).toBe(30);
  });
});
