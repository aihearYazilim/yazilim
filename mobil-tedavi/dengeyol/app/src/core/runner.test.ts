import { describe, expect, it } from 'vitest';
import { poseFromUp, upFromLying, upFromSitting, type HeadPose } from './geometry';
import { protocolForMode, resolveProtocol, type Target } from './protocols';
import {
  clinicianSilent,
  type Cue,
  DEFAULT_RUNNER_CONFIG,
  HANG_MORE_MAX_HINTS,
  initialRunnerState,
  pauseSpeech,
  PRONE_ARRIVAL_NOTICE,
  PRONE_ARRIVAL_TEXT,
  REACH_TOUCHED_ONLY_TEXT,
  reachSummary,
  SAFETY_STOP_TEXT_WRONG_SIDE_HELPER,
  SAME_HINT_THIN_AFTER,
  SAME_HINT_THIN_EVERY_SEC,
  SUPINE_CONFIRM_SEC,
  speakableSeconds,
  spokenDuration,
  type RunnerConfig,
  type RunnerEvent,
  type RunnerState,
  runnerStep,
  SAFETY_STOP_TEXT,
  startSpeechText,
  stopReasonTextFor,
  stopTextFor,
  STOP_REASON_TEXT,
  vertigoSummary,
  WRONG_SIDE_STOP_REASON_TEXT
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
    const bad = poseFromUp(upFromLying(0, 25));
    run(x, {
      maxSec: 400,
      poseOverride: (idx, t) => {
        const st = x.cfg.protocol.steps[idx]!;
        if (idx === 1 && t > 20 && t < 35) return bad; // 15 s kayma
        // İlk 1 s önceki adımın pozunda (gerçekçi: hasta yeni yönergeyi dinlerken yerinde).
        return t > 1 ? ideal(st.target) : idx === 0 ? ideal(st.target) : ideal(x.cfg.protocol.steps[idx - 1]!.target);
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
    const reminders = x.cues.filter((c) => c.kind === 'speak' && /^Baş dönmesi (geç|bir dakikayı)/.test(c.text));
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
    expect(x.cues.filter((c) => c.kind === 'speak' && /^Baş dönmesi (geç|bir dakikayı)/.test(c.text)).length).toBe(4);
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
    expect(spoken({ ...x, cues: x.cues.slice(n) }).some((t) => t.startsWith('Baş dönmesi geç'))).toBe(false);
    for (let i = 0; i < 10; i++) {
      x.t += 100;
      send(x, { type: 'tick', pose: ideal(x.cfg.protocol.steps[1]!.target) });
    }
    const after = x.cues.slice(n);
    const rem = spoken({ ...x, cues: after }).find((t) => t.startsWith('Baş dönmesi geç'));
    // Tur 2 (k01): ilk hatırlatma korkutmaz, hekim sözü yok.
    expect(rem).toBe('Baş dönmesi geçince ekrana dokunun; sürüyorsa böyle kalın.');
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
        // "Şimdi!"den (6 s) sonra oturuştan geçerek hızlı geçiş.
        if (idx === 2) return t < 7 ? ideal(steps[1]!.target) : t < 7.5 ? poseFromUp(upFromSitting(0)) : ideal(steps[2]!.target);
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
    expect(rec.noSitThrough).toBeUndefined();
    expect(rec.movedBeforeCommand).toBeUndefined();
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

// ---------------------------------------------------------------------------------------------
// Kullanıcı turu 2 — E1 (yürütücü ve manevra)
// ---------------------------------------------------------------------------------------------
const speakCues = (cues: Cue[]) => cues.filter((c): c is Extract<Cue, { kind: 'speak' }> => c.kind === 'speak');

/** Zamanlı koşu: her tick'te yeni söylenenleri adım içi saniyesiyle toplar. */
function timedRun(x: Sim, poseAt: (idx: number, t: number) => HeadPose | null, maxSec: number) {
  const said: { idx: number; t: number; text: string; priority: string }[] = [];
  send(x, { type: 'start' });
  while (x.t < maxSec * 1000) {
    x.t += 100;
    const n = x.cues.length;
    const inStep = (x.t - x.s.stepStartedAt) / 1000;
    send(x, { type: 'tick', pose: poseAt(x.s.stepIndex, inStep) });
    for (const c of speakCues(x.cues.slice(n))) {
      said.push({ idx: x.s.stepIndex, t: (x.t - x.s.stepStartedAt) / 1000, text: c.text, priority: c.priority });
    }
    if (x.s.phase === 'done' || x.s.phase === 'aborted' || x.s.phase === 'safetyStop') break;
  }
  return said;
}

/** Olağan hasta: ilk 1 s önceki adımın pozunda, sonra hedefte; `idx` adımı için özel poz. */
function normalExcept(x: Sim, idx: number, special: (t: number) => HeadPose) {
  const steps = x.cfg.protocol.steps;
  return (i: number, t: number): HeadPose => {
    if (i === idx) return special(t);
    return t > 1 || i === 0 ? ideal(steps[i]!.target) : ideal(steps[i - 1]!.target);
  };
}

const lying = (theta: number, phi: number) => poseFromUp(upFromLying(theta, phi));

describe('tur 2 E1-1: gövdeyle dönülen adımda yanlış taraf', () => {
  it('karşı yana yuvarlanan hastaya "önce sırtüstüne" denir; yüzüstünden hedefe gelme kabul edilmez, sırtüstünden geçince kabul', () => {
    const x = sim('epley');
    const steps = x.cfg.protocol.steps; // sağ: 3. adım hedefi sol yan, burun yere (θ −135)
    const said = timedRun(
      x,
      normalExcept(x, 3, (t) => {
        if (t < 2) return ideal(steps[2]!.target);
        if (t < 14) return lying(90, 0); // yanlış (sağ) yan
        if (t < 16) return lying(175, 0); // yüzüstü
        if (t < 30) return lying(-135, 0); // yüzüstü üzerinden hedef açısında
        if (t < 32) return lying(0, 0); // sırtüstüne döndü
        return ideal(steps[3]!.target);
      }),
      600
    );
    expect(x.s.phase).toBe('done');
    const rec = x.s.records[3]!;
    expect(rec.wrongSide).toBe(true);
    // Yüzüstünden gelinen 16–30 s arasında doğrulanmadı; sırtüstünden geçtikten sonra doğrulandı.
    expect((rec.reachedAt! - rec.startedAt) / 1000).toBeGreaterThanOrEqual(32);
    const s3 = said.filter((w) => w.idx === 3);
    const wrong = s3.filter((w) => w.text.startsWith('Önce sırtüstüne dönün, sonra bütün vücudunuzla sol yanınıza'));
    expect(wrong.length).toBeGreaterThanOrEqual(3);
    expect(wrong.every((w) => w.priority === 'high')).toBe(true);
    // En kısa açı (yüzüstüne doğru "sağa") hiç söylenmez.
    expect(s3.some((w) => /sağa çevirin|sağ yanınıza dönün; sonra/.test(w.text))).toBe(false);
  });

  it('yardımcı modunda yardımcıya söylenir', () => {
    const x = sim('epley');
    x.cfg = { ...x.cfg, helper: true };
    const steps = x.cfg.protocol.steps;
    const said = timedRun(x, normalExcept(x, 3, (t) => (t < 2 ? ideal(steps[2]!.target) : lying(100, 0))), 260);
    expect(said.some((w) => w.text === 'Dur! Yanlış taraf.')).toBe(true);
    expect(said.some((w) => w.text.startsWith('Hastayı önce sırtüstüne getirin'))).toBe(true);
  });
});

describe('tur 2 E1-2: "pozisyona gelinemedi" sayacı hedefe tek an değmekle sıfırlanmaz', () => {
  it("sınırda gidip gelen (hiç doğrulanmayan) hasta yine ~60 s'de durdurulur", () => {
    const x = sim('epley');
    const s0 = x.cfg.protocol.steps[0]!.target;
    run(x, {
      maxSec: 300,
      // 0,4 s hedefte (φ 17), 1,6 s dışında (φ 12): doğrulama (1 s kesintisiz) hiç olmaz.
      poseOverride: (idx, t) => (idx === 0 || t <= 1 ? ideal(s0) : lying(45, Math.round(t * 10) % 20 < 4 ? 17 : 12))
    });
    expect(x.s.phase).toBe('safetyStop');
    expect(x.s.stopReason).toBe('POSITION_UNREACHABLE');
    const rec = x.s.records[1]!;
    expect(rec.firstInRangeAt).not.toBeNull();
    expect(rec.reachedAt).toBeNull();
    const dur = ((rec.endedAt ?? 0) - rec.startedAt) / 1000;
    expect(dur).toBeGreaterThanOrEqual(60);
    expect(dur).toBeLessThan(70);
  });
});

describe('tur 2 E1-4: Semont komuttan önce hareket ve oturuştan geçiş', () => {
  it('"Şimdi!"den önce yeni yana yatan hastaya sayım yapılmaz; "zaten yattınız" ve kayıt', () => {
    const x = sim('semont');
    const steps = x.cfg.protocol.steps;
    const said = timedRun(
      x,
      normalExcept(x, 2, (t) =>
        t < 1 ? ideal(steps[1]!.target) : t < 1.5 ? poseFromUp(upFromSitting(0)) : ideal(steps[2]!.target)
      ),
      600
    );
    expect(x.s.phase).toBe('done');
    const rec = x.s.records[2]!;
    expect(rec.movedBeforeCommand).toBe(true);
    expect(rec.noSitThrough).toBeUndefined();
    const texts = said.map((w) => w.text);
    expect(texts).not.toContain('Şimdi!');
    expect(texts).not.toContain('Üç.');
    const early = said.find((w) => w.text.startsWith('Zaten yattınız'));
    expect(early?.priority).toBe('high');
    // Yatmış hasta yönergenin sonunu ve sayımı beklemez.
    expect((rec.reachedAt! - rec.startedAt) / 1000).toBeLessThan(3.5);
  });

  it('yönerge "Kıpırdamayın" ile başlar', () => {
    const x = sim('semont');
    expect(x.cfg.protocol.steps[2]!.say.startsWith('Kıpırdamayın')).toBe(true);
  });

  it('sırtüstü yuvarlanarak (oturuştan geçmeden) geçiş: hastaya söylenir, kayda geçer', () => {
    const x = sim('semont');
    const steps = x.cfg.protocol.steps;
    const said = timedRun(
      x,
      normalExcept(x, 2, (t) => (t < 7 ? ideal(steps[1]!.target) : t < 7.6 ? lying(0, 0) : ideal(steps[2]!.target))),
      600
    );
    expect(x.s.phase).toBe('done');
    const rec = x.s.records[2]!;
    expect(rec.noSitThrough).toBe(true);
    expect(rec.slowTransition).toBeUndefined();
    expect(rec.movedBeforeCommand).toBeUndefined();
    expect(said.some((w) => w.text.startsWith('Oturuştan geçmediniz; bir dahaki sefere önce oturun'))).toBe(true);
  });

  it('klinisyende de kaydedilir ve kısa sesle söylenir', () => {
    const x = sim('semont', 'clinician');
    const steps = x.cfg.protocol.steps;
    const said = timedRun(
      x,
      normalExcept(x, 2, (t) => (t < 4 ? ideal(steps[1]!.target) : t < 4.6 ? lying(0, 0) : ideal(steps[2]!.target))),
      600
    );
    expect(x.s.records[2]!.noSitThrough).toBe(true);
    expect(said.map((w) => w.text)).toContain('Pozisyon doğru. Oturuştan geçilmedi.');
  });
});

describe('tur 2 E1-5: zorlama uyarısı, yastık ve "öyle kalın" sonrası', () => {
  it('yavaş ama ilerleyen hastaya "Daha fazla zorlamayın" denmez', () => {
    const x = sim('epley');
    const st = x.cfg.protocol.steps;
    // Baş 1°/s ile dönüyor: θ 0 → 40 (hedef 45 ± 10).
    const said = timedRun(
      x,
      (idx, t) => (idx === 0 || t <= 1 ? ideal(st[0]!.target) : idx === 1 ? lying(Math.min(40, t - 1), 25) : ideal(st[idx]!.target)),
      600
    );
    expect(x.s.phase).toBe('done');
    expect(said.filter((w) => w.text === 'Başınızı biraz daha sağa çevirin.').length).toBeGreaterThanOrEqual(2);
    expect(said.some((w) => w.text.startsWith('Daha fazla zorlamayın'))).toBe(false);
  });

  it('ilerlemeyen hastaya uyarı; sonra eski "biraz daha" ipucu yerine "rahat olduğunuz yerde kalın"', () => {
    const x = sim('epley');
    const s0 = x.cfg.protocol.steps[0]!.target;
    const said = timedRun(x, (idx, t) => (idx === 0 || t <= 1 ? ideal(s0) : lying(20, 25)), 300);
    expect(x.s.stopReason).toBe('POSITION_UNREACHABLE');
    const texts = said.map((w) => w.text);
    const at = texts.findIndex((t) => t.startsWith('Daha fazla zorlamayın'));
    expect(at).toBeGreaterThan(-1);
    const after = texts.slice(at + 1, -1);
    expect(after).toContain('Zorlamayın; rahat olduğunuz yerde kalın.');
    expect(after.some((t) => /biraz daha/.test(t))).toBe(false);
  });

  it('yastık ipucundan sonra 25 s sessiz beklenir; zorlama uyarısı verilmez', () => {
    const x = sim('epley');
    const s0 = x.cfg.protocol.steps[0]!.target;
    const said = timedRun(x, (idx, t) => (idx === 0 || t <= 1 ? ideal(s0) : lying(45, 1)), 300).filter((w) => w.idx === 1);
    const pillowAt = said.findIndex((w) => w.text.startsWith('Yastık başınızın altında olabilir'));
    expect(pillowAt).toBeGreaterThan(-1);
    const next = said[pillowAt + 1]!;
    expect(next.t - said[pillowAt]!.t).toBeGreaterThanOrEqual(25);
    expect(next.text.startsWith('Yastığı düzeltince devam ederiz')).toBe(true);
    expect(said.some((w) => w.text.startsWith('Daha fazla zorlamayın'))).toBe(false);
    // 60 s kuralı aynen.
    expect(x.s.stopReason).toBe('POSITION_UNREACHABLE');
  });
});

describe('tur 2 E1-6: baş dönmesi hatırlatmaları 60 s eşiğiyle tutarlı', () => {
  function remindersFor(helper: boolean) {
    const x = sim('epley');
    if (helper) x.cfg = { ...x.cfg, helper: true };
    send(x, { type: 'start' });
    while (x.s.stepIndex < 1 || x.s.phase !== 'holding') {
      x.t += 100;
      send(x, { type: 'tick', pose: ideal(x.cfg.protocol.steps[x.s.stepIndex]!.target) });
    }
    send(x, { type: 'vertigoToggle' });
    const n = x.cues.length;
    while (x.s.stopReason === null && x.t < 600000) {
      x.t += 100;
      send(x, { type: 'tick', pose: ideal(x.cfg.protocol.steps[1]!.target) });
    }
    const after = x.cues.slice(n);
    const idx = after.map((c, i) => (c.kind === 'haptic' && c.pattern === 'markOn' ? i : -1)).filter((i) => i >= 0);
    // "Süre doldu ama baş dönmesi sürüyor" da aynı titreşimle gelir; hatırlatma değildir.
    const texts = idx.map((i) => speakCues(after.slice(i))[0]!.text).filter((t) => !t.startsWith('Süre doldu'));
    return { x, texts };
  }
  it('15 s: yalnız "geçince dokunun"; 45 s: bir dakika eşiği; 75/105 s: dürüst; 2 dk durdurma aynen', () => {
    const { x, texts } = remindersFor(false);
    expect(texts).toHaveLength(4);
    expect(texts[0]).toBe('Baş dönmesi geçince ekrana dokunun; sürüyorsa böyle kalın.');
    expect(texts[1]).toBe('Baş dönmesi geçtiyse şimdi ekrana dokunun. Bir dakikayı geçerse hekime danışmak gerekir.');
    expect(texts[2]).toMatch(/^Baş dönmesi bir dakikayı geçti; bunu hekiminize söyleyeceğiz\..* 45 saniye içinde dokunulmazsa manevrayı durduracağım\.$/);
    expect(texts[3]).toMatch(/15 saniye içinde/);
    // İlk ikisi "durdurup hekime yönlendireceğim" diye korkutmaz.
    expect(texts.slice(0, 2).some((t) => /yönlendir|durdur/.test(t))).toBe(false);
    expect(x.s.stopReason).toBe('VERTIGO_TOO_LONG');
  });
  it('yardımcı modunda da aynı sıra', () => {
    const { texts } = remindersFor(true);
    expect(texts[0]).toBe('Hasta "geçti" deyince ekrana dokunun; sürüyorsa böyle tutun.');
    expect(texts[2]).toMatch(/bunu hekime söyleyeceğiz/);
  });
});

describe('tur 2 E1-7: konuşma kuyruğu', () => {
  it('kaymadan dönüşte "doğru" titreşimi ve "Tamam" yüksek öncelikle (eski ipuçlarını keser)', () => {
    const x = sim('epley');
    const st = x.cfg.protocol.steps;
    run(x, {
      maxSec: 400,
      poseOverride: (idx, t) => {
        if (idx === 1 && t > 20 && t < 30) return lying(0, 25);
        return t > 1 || idx === 0 ? ideal(st[idx]!.target) : ideal(st[idx - 1]!.target);
      }
    });
    const iDrift = x.cues.findIndex((c) => c.kind === 'speak' && c.text.startsWith('Pozisyonu koruyun'));
    const rest = x.cues.slice(iDrift + 1);
    const iBack = rest.findIndex((c) => c.kind === 'speak' && c.text === 'Tamam, böyle kalın.');
    expect(iBack).toBeGreaterThan(-1);
    expect(rest[iBack]).toMatchObject({ priority: 'high' });
    expect(hapticsOf(rest.slice(0, iBack))).toContain('reached');
  });

  it('ipucu verildiyse pozisyona gelince "Tamam" bekleyen ipucunu keser; ipucu yoksa yönergeyi kesmez', () => {
    const x = sim('epley');
    const st = x.cfg.protocol.steps;
    run(x, {
      maxSec: 400,
      poseOverride: (idx, t) =>
        idx === 1 && t > 1 && t < 16 ? lying(20, 25) : t > 1 || idx === 0 ? ideal(st[idx]!.target) : ideal(st[Math.max(0, idx - 1)]!.target)
    });
    const tamam = speakCues(x.cues).filter((c) => c.text === 'Tamam, böyle kalın.');
    expect(tamam[0]!.priority).toBe('high'); // 1. adım: ipucundan sonra
    expect(tamam[1]!.priority).toBe('normal'); // 2. adım: ipucu yok
  });

  it('sayım etiketlidir (arayüz geç kalmış sayımı okumaz); "geçti" yanıtı gecikmez', () => {
    const x = sim('epley');
    run(x);
    const counts = speakCues(x.cues).filter((c) => /saniye kaldı/.test(c.text));
    expect(counts.length).toBeGreaterThan(0);
    expect(counts.every((c) => c.tag === 'count')).toBe(true);
    const y = sim('epley');
    send(y, { type: 'start' });
    y.t += 500;
    send(y, { type: 'vertigoToggle' });
    y.t += 2000;
    send(y, { type: 'vertigoToggle' });
    expect(speakCues(y.cues).find((c) => c.text.startsWith('Geçti olarak işaretlendi'))?.priority).toBe('high');
  });

  it('oturuş adımının dürüst cümlesi "Bu adım tamam" ile kesilmez (yavaş seste bekleme uzar)', () => {
    const x = sim('epley');
    // Yavaş ses: ~8,5 karakter/s.
    x.cfg = { ...x.cfg, introSecFor: (t: string) => t.length / (13 * 0.65) };
    run(x, { maxSec: 600 });
    expect(x.s.phase).toBe('done');
    const honest = 'Başınızı sağa çevirdiyseniz öyle kalın; birazdan yatacağız.';
    expect(x.s.records[0]!.holdSec).toBeGreaterThanOrEqual(honest.length / (13 * 0.65) + 3 - 0.11);
    const done = speakCues(x.cues).filter((c) => c.text === 'Bu adım tamam.');
    expect(done[0]!.priority).toBe('normal'); // dürüst cümleden sonra kuyruğa
    expect(done[1]!.priority).toBe('high');
  });
});

describe('tur 2 E1-8: duraklatma sesi', () => {
  it('"olduğunuz yerde kalın" değil; boyun ağrısında oturma ve "Pozisyona gelemiyorum" yolu söylenir', () => {
    // Ayrıntı tur 4'ten beri "Tekrar dinle"de (pauseSpeech tam biçimi); ilk okunuş kısa (bkz. G1-4).
    const x = sim('epley');
    const t = pauseSpeech(x.cfg, false, true);
    expect(t).toMatch(/Boynunuz ağrıyorsa yavaşça oturabilirsiniz/);
    expect(t).toMatch(/"Pozisyona gelemiyorum"/);
    expect(t).toMatch(/iki saniye basılı tutun/);
    expect(t).not.toMatch(/Olduğunuz yerde/);
    const y = sim('epley');
    y.cfg = { ...y.cfg, helper: true };
    expect(pauseSpeech(y.cfg, false, true)).toMatch(/Hastanın boynu ağrıyorsa.*"Bu pozisyona gelemiyor"/);
  });
});

describe('tur 2 E1-9: klinisyen sesi açık / kısa / kapalı', () => {
  const offPose = (x: Sim) => (idx: number, t: number) =>
    idx === 1 && t < 20
      ? lying(10, 25)
      : t > 1 || idx === 0
        ? ideal(x.cfg.protocol.steps[idx]!.target)
        : ideal(x.cfg.protocol.steps[Math.max(0, idx - 1)]!.target);
  it('varsayılan kısa: adım başlığı (hastanın sağına), ipucu okunmaz, "Pozisyon doğru" ve sayım okunur', () => {
    const x = sim('epley', 'clinician');
    run(x, { maxSec: 600, poseOverride: offPose(x) });
    const texts = spoken(x);
    expect(texts[0]).toBe('Oturuş, baş hastanın sağına 45°.');
    expect(texts.some((t) => /çevirin/.test(t))).toBe(false);
    expect(texts).toContain('Pozisyon doğru.');
    expect(texts.some((t) => /saniye kaldı/.test(t))).toBe(true);
  });
  it('açık: tam yönerge ve ipuçları ("hastanın sağına"); kapalı: hiç konuşma', () => {
    const full = sim('epley', 'clinician');
    full.cfg = { ...full.cfg, clinicianVoice: 'full' };
    run(full, { maxSec: 600, poseOverride: offPose(full) });
    expect(spoken(full)[0]).toBe(full.cfg.protocol.steps[0]!.clinician);
    expect(spoken(full)).toContain('Başı hastanın sağına çevirin.');
    const off = sim('epley', 'clinician');
    off.cfg = { ...off.cfg, clinicianVoice: 'off' };
    run(off, { maxSec: 600, poseOverride: offPose(off) });
    expect(spoken(off)).toHaveLength(0);
    expect(hapticsOf(off.cues)).toContain('reached');
  });
});

describe('tur 2 E1-11: hedefin kıyısında tutulan adım', () => {
  it('tutmanın yarısından azı tam hedefteyse kayda "sınırda tutuldu"; ideal hastada yok', () => {
    const x = sim('epley');
    const st = x.cfg.protocol.steps;
    run(x, {
      maxSec: 600,
      poseOverride: (idx, t) => {
        if (idx === 1) return t <= 1 ? ideal(st[0]!.target) : t < 5 ? lying(45, 16) : lying(45, 13);
        return t > 1 || idx === 0 ? ideal(st[idx]!.target) : ideal(st[idx - 1]!.target);
      }
    });
    expect(x.s.phase).toBe('done');
    expect(x.s.records[1]!.borderline).toBe(true);
    const y = sim('epley');
    run(y);
    expect(y.s.records.some((r) => r.borderline)).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------
// Kullanıcı turu 3 — F1 (yürütücü)
// ---------------------------------------------------------------------------------------------
/** Gerçek hıza yakın konuşma süresi modeli (~13 karakter/s; k02'nin ölçtüğü uygulama tahmini). */
const realSpeech = (t: string) => t.length / 13;

/** Zamanlı koşu: bütün ipuçlarını (söz, titreşim, ton) adım içi saniyesiyle toplar. */
function cueRun(x: Sim, poseAt: (idx: number, t: number) => HeadPose | null, maxSec: number, onTick?: (x: Sim) => void) {
  const got: { idx: number; t: number; cue: Cue }[] = [];
  send(x, { type: 'start' });
  while (x.t < maxSec * 1000) {
    x.t += 100;
    const n = x.cues.length;
    const inStep = (x.t - x.s.stepStartedAt) / 1000;
    send(x, { type: 'tick', pose: poseAt(x.s.stepIndex, inStep) });
    onTick?.(x);
    for (const c of x.cues.slice(n)) got.push({ idx: x.s.stepIndex, t: (x.t - x.s.stepStartedAt) / 1000, cue: c });
    if (x.s.phase === 'done' || x.s.phase === 'aborted' || x.s.phase === 'safetyStop') break;
  }
  return got;
}
const speechOf = (got: { t: number; idx: number; cue: Cue }[]) =>
  got.filter((g) => g.cue.kind === 'speak').map((g) => ({ ...g, cue: g.cue as Extract<Cue, { kind: 'speak' }> }));

describe('tur 3 F1-2: yanlış taraf hemen ve kendini kesmeden söylenir', () => {
  /** Sağ Epley 4. adım (gövdeyle sol yan): 2. saniyede yanlış (sağ) yana yuvarlanır, 30. saniyede sırtüstüne döner. */
  const wrongThenOk = (x: Sim) => {
    const steps = x.cfg.protocol.steps;
    return normalExcept(x, 3, (t) => (t < 2 ? ideal(steps[2]!.target) : t < 30 ? lying(90, 0) : t < 32 ? lying(0, 0) : ideal(steps[3]!.target)));
  };

  it('≤1 s içinde kısa "Dur! Yanlış taraf." + kendi titreşimi ve tonu; ardından tam yönerge; yönerge bitmeden yinelenmez', () => {
    const x = sim('epley');
    x.cfg = { ...x.cfg, introSecFor: realSpeech };
    const got = cueRun(x, wrongThenOk(x), 900).filter((g) => g.idx === 3);
    expect(x.s.phase).toBe('done');
    const alertAt = got.find((g) => g.cue.kind === 'speak' && g.cue.text === 'Dur! Yanlış taraf.');
    expect(alertAt).toBeDefined();
    expect(alertAt!.t).toBeLessThanOrEqual(3); // yanlış yana 2. saniyede geçti
    expect(alertAt!.cue).toMatchObject({ priority: 'high', tag: 'alert' });
    // Aynı anda ayrı titreşim ve ton.
    const same = got.filter((g) => g.t === alertAt!.t).map((g) => g.cue);
    expect(same).toContainEqual({ kind: 'haptic', pattern: 'wrongSide' });
    expect(same).toContainEqual({ kind: 'tone', pattern: 'wrongSide' });
    // Kısa uyarı bu geçişte bir kez.
    expect(speechOf(got).filter((g) => g.cue.text === 'Dur! Yanlış taraf.')).toHaveLength(1);
    // Tam yönerge: kısa uyarı bitince (≤1 s gecikmeyle).
    const full = speechOf(got).filter((g) => g.cue.text.startsWith('Önce sırtüstüne dönün, sonra bütün vücudunuzla sol yanınıza'));
    expect(full.length).toBeGreaterThanOrEqual(2);
    const alertEnd = alertAt!.t + realSpeech('Dur! Yanlış taraf.');
    expect(full[0]!.t).toBeGreaterThanOrEqual(alertEnd);
    expect(full[0]!.t).toBeLessThanOrEqual(alertEnd + 1);
    // Kendini kesmez: her yineleme bir öncekinin bitişinden en az 2 s sonra.
    for (let i = 1; i < full.length; i++) {
      expect(full[i]!.t - full[i - 1]!.t).toBeGreaterThanOrEqual(realSpeech(full[i - 1]!.cue.text) + 2 - 0.01);
    }
    // Kayıt: önce yanlış tarafa dönüldü; sonra doğru yandan tamamlandı.
    expect(x.s.records[3]!.wrongSide).toBe(true);
    expect(x.s.records[3]!.wrongSideStop).toBeUndefined();
  });

  it('gerçek konuşma bitişi beklenir: bitiş olayı gelmeden tam yönerge başlamaz', () => {
    const x = sim('epley');
    x.cfg = { ...x.cfg, awaitSpeechEnd: true };
    const steps = x.cfg.protocol.steps;
    let alertId: number | null = null;
    let spokeAt: number | null = null;
    const got = cueRun(
      x,
      normalExcept(x, 3, (t) => (t < 2 ? ideal(steps[2]!.target) : lying(90, 0))),
      400,
      (y) => {
        if (alertId === null) {
          const a = y.cues.find((c) => c.kind === 'speak' && c.tag === 'alert');
          if (a && a.kind === 'speak') alertId = a.utterId ?? null;
        }
        // Kısa uyarı ~4 s sonra gerçekten bitti (tahmin 3 s; üst sınır 3×2+3 = 9 s).
        if (alertId !== null && spokeAt === null && y.s.stepIndex === 3 && (y.t - y.s.stepStartedAt) / 1000 >= 6.05) {
          send(y, { type: 'cueSpoken', utterId: alertId });
          spokeAt = (y.t - y.s.stepStartedAt) / 1000;
        }
      }
    );
    const full = speechOf(got).filter((g) => g.idx === 3 && g.cue.text.startsWith('Önce sırtüstüne'));
    expect(alertId).not.toBeNull();
    expect(full.length).toBeGreaterThan(0);
    expect(full[0]!.t).toBeGreaterThanOrEqual(spokeAt!);
    expect(full[0]!.t).toBeLessThanOrEqual(spokeAt! + 0.5);
    expect(full[0]!.cue.utterId).toBeDefined();
  });

  it("yanlış tarafta kalınca ~60 s'de durur; gerekçe \"yanlış taraf\" (boyun değil), kilit aynı", () => {
    const x = sim('epley');
    const steps = x.cfg.protocol.steps;
    run(x, { maxSec: 600, poseOverride: normalExcept(x, 3, (t) => (t < 2 ? ideal(steps[2]!.target) : lying(90, 0))) });
    expect(x.s.phase).toBe('safetyStop');
    expect(x.s.stopReason).toBe('POSITION_UNREACHABLE');
    const rec = x.s.records[3]!;
    expect(rec.unreachable).toBe(true);
    expect(rec.wrongSide).toBe(true);
    expect(rec.wrongSideStop).toBe(true);
    expect(stopTextFor('POSITION_UNREACHABLE', x.s.records)).toBe(SAFETY_STOP_TEXT.WRONG_SIDE);
    expect(SAFETY_STOP_TEXT.WRONG_SIDE).toMatch(/yanlış tarafa dönüldü/);
    expect(SAFETY_STOP_TEXT.WRONG_SIDE).not.toMatch(/ör\./);
    expect(stopReasonTextFor('POSITION_UNREACHABLE', x.s.records)).toBe(WRONG_SIDE_STOP_REASON_TEXT);
    expect(spoken(x).pop()).toMatch(/^Yanlış taraftan doğru yana gelinemedi/);
    expect(x.s.notice).toMatch(/Yanlış taraftan/);
  });

  it('boyun kısıtında gerekçe aynen kalır; duraklatma düğmesinde yanlış taraf yalnız hasta o an yanlış yandaysa', () => {
    const x = sim('epley');
    epleyStuck(x, poseFromUp(upFromLying(45, 8)), 400);
    expect(stopTextFor('POSITION_UNREACHABLE', x.s.records)).toBe(SAFETY_STOP_TEXT.POSITION_UNREACHABLE);
    expect(stopReasonTextFor('POSITION_UNREACHABLE', x.s.records)).toBe(STOP_REASON_TEXT.POSITION_UNREACHABLE);
    expect(stopTextFor('VERTIGO_TOO_LONG', x.s.records)).toBe(SAFETY_STOP_TEXT.VERTIGO_TOO_LONG);
    expect(SAFETY_STOP_TEXT.POSITION_UNREACHABLE).not.toMatch(/ör\./);

    // Yanlış yandayken "Pozisyona gelemiyorum": yanlış taraf gerekçesi.
    const y = sim('epley');
    const steps = y.cfg.protocol.steps;
    cueRun(y, normalExcept(y, 3, (t) => (t < 2 ? ideal(steps[2]!.target) : lying(90, 0))), 400, (z) => {
      if (z.s.stepIndex === 3 && z.s.phase !== 'paused' && (z.t - z.s.stepStartedAt) / 1000 >= 8) {
        send(z, { type: 'pause' });
        send(z, { type: 'abort', reason: 'POSITION_UNREACHABLE' });
      }
    });
    expect(y.s.records[3]!.wrongSideStop).toBe(true);

    // Sırtüstüne döndükten sonra düğme: boyun gerekçesi (hasta yanlış yanda değil).
    const z = sim('epley');
    const st = z.cfg.protocol.steps;
    cueRun(z, normalExcept(z, 3, (t) => (t < 2 ? ideal(st[2]!.target) : t < 6 ? lying(90, 0) : lying(0, 0))), 400, (w) => {
      if (w.s.stepIndex === 3 && w.s.phase !== 'paused' && (w.t - w.s.stepStartedAt) / 1000 >= 10) {
        send(w, { type: 'pause' });
        send(w, { type: 'abort', reason: 'POSITION_UNREACHABLE' });
      }
    });
    expect(z.s.records[3]!.wrongSide).toBe(true);
    expect(z.s.records[3]!.wrongSideStop).toBeUndefined();
    expect(stopTextFor('POSITION_UNREACHABLE', z.s.records)).toBe(SAFETY_STOP_TEXT.POSITION_UNREACHABLE);
  });

  it("Semont'ta önceki yanda kalmak yanlış taraf uyarısı değildir", () => {
    const x = sim('semont');
    const got = cueRun(x, (idx, t) => ideal(x.cfg.protocol.steps[idx === 2 && t < 8 ? 1 : idx]!.target), 600);
    expect(got.some((g) => g.cue.kind === 'haptic' && g.cue.pattern === 'wrongSide')).toBe(false);
    expect(speechOf(got).some((g) => g.cue.text === 'Dur! Yanlış taraf.')).toBe(false);
  });
});

describe('tur 3 F1-3: aramada ulaşılan en iyi açı ve "biraz daha geriye" sınırı', () => {
  it('sarkamayan hastada kayıtta en iyi sarkma; özet "baş en çok ~8° sarktı (hedef 15–40°)"', () => {
    const x = sim('epley');
    epleyStuck(x, poseFromUp(upFromLying(45, 8)), 400);
    const rec = x.s.records[1]!;
    expect(rec.unreachable).toBe(true);
    expect(rec.reach?.phi).toBeCloseTo(8, 0);
    expect(rec.reach?.theta).toBeCloseTo(45, 0);
    expect(reachSummary(rec, x.cfg.protocol.steps[1]!)).toBe('baş en çok ~8° sarktı (hedef 15–40°)');
  });

  it('dönemeyen hastada dönüş özeti; en iyi değer ilerlemeyle güncellenir', () => {
    const x = sim('epley');
    const s0 = x.cfg.protocol.steps[0]!.target;
    run(x, { maxSec: 400, poseOverride: (idx, t) => (idx === 0 || t <= 1 ? ideal(s0) : lying(Math.min(20, 5 + t), 25)) });
    expect(x.s.stopReason).toBe('POSITION_UNREACHABLE');
    const rec = x.s.records[1]!;
    expect(rec.reach?.theta).toBeCloseTo(20, 0);
    expect(reachSummary(rec, x.cfg.protocol.steps[1]!)).toBe('baş en çok sağa ~20° döndü (hedef sağa 45° ±10°)');
  });

  it('hedefe gelinen adımda özet yok; oturuş hedefinde de yok', () => {
    const x = sim('epley');
    run(x);
    x.cfg.protocol.steps.forEach((st, i) => expect(reachSummary(x.s.records[i]!, st)).toBeNull());
  });

  it('ilerleyen hastaya da "biraz daha geriye" en çok 3 kez, sonra "zorlamayın" (k07)', () => {
    const x = sim('epley');
    const s0 = x.cfg.protocol.steps[0]!.target;
    // 5,5°'den 3 s'de 1° ilerleyerek 14,5°'ye (hedef 15°) gelir ve orada kalır: her ~9 s'de 3° ilerleme (eski kuralda 4+ ipucu).
    const said = timedRun(
      x,
      (idx, t) => (idx === 0 || t <= 1 ? ideal(s0) : idx === 1 ? lying(45, Math.min(14.5, 5.5 + (t - 1) / 3)) : ideal(s0)),
      400
    );
    const texts = said.filter((w) => w.idx === 1).map((w) => w.text);
    const strainAt = texts.findIndex((t) => t.startsWith('Daha fazla zorlamayın'));
    expect(strainAt).toBeGreaterThan(-1);
    const before = texts.slice(0, strainAt).filter((t) => t === 'Başınızı biraz daha geriye bırakın.');
    expect(before.length).toBe(HANG_MORE_MAX_HINTS);
    expect(texts.slice(strainAt + 1).some((t) => /biraz daha geriye/.test(t))).toBe(false);
    expect(x.s.records[1]!.reach?.phi).toBeCloseTo(14.5, 0);
  });
});

describe('tur 3 F1-4: klinisyen sesi', () => {
  const offPose = (x: Sim) => (idx: number, t: number) =>
    idx === 1 && t < 20
      ? lying(10, 25)
      : idx === 2 && t > 25 && t < 32
        ? lying(-45, 5)
        : t > 1 || idx === 0
          ? ideal(x.cfg.protocol.steps[idx]!.target)
          : ideal(x.cfg.protocol.steps[Math.max(0, idx - 1)]!.target);

  it('kısa seste 2–3 kelimelik yön ipuçları ("Hastanın sağına.", "Pozisyon bozuldu. Daha sarkık."); uzun cümle yok', () => {
    const x = sim('epley', 'clinician');
    run(x, { maxSec: 600, poseOverride: offPose(x) });
    const texts = spoken(x);
    expect(texts).toContain('Hastanın sağına.');
    expect(texts).toContain('Pozisyon bozuldu. Daha sarkık.');
    expect(texts.some((t) => /çevirin|Ekstansiyon/.test(t))).toBe(false);
    const hints = speakCues(x.cues).filter((c) => c.tag === 'hint');
    expect(hints.length).toBeGreaterThan(0);
    for (const h of hints) {
      expect(h.text.split(/\s+/).length, h.text).toBeLessThanOrEqual(3);
    }
  });

  it('kısa seste yanlış taraf: kısa uyarı ve "Sırtüstünden hastanın soluna."; kapalıda hiç söz yok, titreşim sürer', () => {
    const x = sim('epley', 'clinician');
    const steps = x.cfg.protocol.steps;
    const pose = (y: Sim) =>
      normalExcept(y, 3, (t) => (t < 2 ? ideal(steps[2]!.target) : t < 20 ? lying(90, 0) : t < 22 ? lying(0, 0) : ideal(steps[3]!.target)));
    const said = timedRun(x, pose(x), 900).map((w) => w.text);
    expect(said).toContain('Dur! Yanlış taraf.');
    expect(said).toContain('Sırtüstünden hastanın soluna.');
    const off = sim('epley', 'clinician');
    off.cfg = { ...off.cfg, clinicianVoice: 'off' };
    const got = cueRun(off, pose(off), 900);
    expect(speechOf(got)).toHaveLength(0);
    expect(got.some((g) => g.cue.kind === 'haptic' && g.cue.pattern === 'wrongSide')).toBe(true);
  });

  it('kapalı: "Başlıyoruz" da söylenmez, alt yazı gizlenir; kısa/açık ve hasta başlangıç cümleleri', () => {
    const base = sim('epley', 'clinician').cfg;
    expect(startSpeechText({ ...base, clinicianVoice: 'off' })).toBeNull();
    expect(clinicianSilent({ ...base, clinicianVoice: 'off' })).toBe(true);
    expect(startSpeechText({ ...base, clinicianVoice: 'short' })).toBe('Başlıyoruz.');
    expect(clinicianSilent({ ...base, clinicianVoice: 'short' })).toBe(false);
    expect(startSpeechText(base)).toBe('Başlıyoruz.');
    const p = sim('epley').cfg;
    expect(clinicianSilent(p)).toBe(false);
    expect(startSpeechText(p)).toBe('Başlıyoruz. Yönergeleri dinleyin.');
    expect(startSpeechText({ ...p, sensorless: true }, 'Önce sol tarafı test ediyoruz.')).toBe('Önce sol tarafı test ediyoruz. Başlıyoruz.');
    expect(startSpeechText({ ...p, helper: true })).toMatch(/^Başlıyoruz\. Yönergeleri yakınınıza/);
  });
});

describe('tur 3 F1-5: sesli yönerge sırası', () => {
  it('duraklatma sesi önce eylemi söyler: "Devam için ekrana iki saniye basılı tutun."', () => {
    const x = sim('epley');
    send(x, { type: 'start' });
    send(x, { type: 'pause' });
    const t = speakCues(x.cues).pop()!.text;
    expect(t.startsWith('Duraklatıldı. Devam için ekrana iki saniye basılı tutun.')).toBe(true);
    expect(pauseSpeech(x.cfg, false, true)).toMatch(/"Pozisyona gelemiyorum" düğmesine dokunun ve onaylayın\.$/);
    // Baş dönmesi işaretliyken "bir kez dokunun" hemen eylemin ardından.
    const y = sim('epley');
    send(y, { type: 'start' });
    y.t += 500;
    send(y, { type: 'vertigoToggle' });
    send(y, { type: 'pause' });
    expect(speakCues(y.cues).pop()!.text).toBe(
      'Duraklatıldı. Devam için ekrana iki saniye basılı tutun. Baş dönmesi geçtiyse ekrana bir kez dokunun. Boynunuz ağrıyorsa yavaşça oturun.'
    );
    expect(pauseSpeech(y.cfg, true, true)).toMatch(
      /^Duraklatıldı\. Devam için ekrana iki saniye basılı tutun\. Baş dönmesi geçtiyse ekrana bir kez dokunun\. Boynunuz/
    );
  });

  it('Semont: komuttan önce yatan ve yavaş geçen hastaya TEK cümle ("Zaten yattınız" kesilmez)', () => {
    const x = sim('semont');
    const steps = x.cfg.protocol.steps;
    const said = timedRun(
      x,
      normalExcept(x, 2, (t) => (t < 0.3 ? ideal(steps[1]!.target) : t < 3.4 ? poseFromUp(upFromSitting(0)) : ideal(steps[2]!.target))),
      600
    );
    expect(x.s.phase).toBe('done');
    const rec = x.s.records[2]!;
    expect(rec.movedBeforeCommand).toBe(true);
    expect(rec.slowTransition).toBe(true);
    const s2 = said.filter((w) => w.idx === 2);
    const zaten = s2.filter((w) => /Zaten yattınız/.test(w.text));
    expect(zaten).toHaveLength(1);
    expect(zaten[0]!.text).toMatch(
      /^Zaten yattınız; sayımı bırakıyoruz\. Geçiş 3 saniye sürdü; bir dahaki sefere "şimdi"yi bekleyip tek hamlede geçin\. Böyle kalın, kıpırdamayın\.$/
    );
    expect(zaten[0]!.priority).toBe('high');
    // Ardından başka bir cümle onu kesmez.
    const after = s2.filter((w) => w.t > zaten[0]!.t && w.t < zaten[0]!.t + 3);
    expect(after.some((w) => w.priority === 'high')).toBe(false);
  });

  it('Semont: komuttan önce yatıp hemen doğrulanmayan hastaya "Zaten yattınız" tek başına; doğrulama onu kesmez', () => {
    const x = sim('semont');
    const steps = x.cfg.protocol.steps;
    const tgt = steps[2]!.target;
    // Hedef yanda ama 25° eksik dönük (geniş "yanına yattı" bölgesinde, hedef aralığın dışında).
    const near = tgt.kind === 'lying' ? lying(tgt.theta + (tgt.theta > 0 ? -25 : 25), 0) : ideal(tgt);
    const said = timedRun(
      x,
      normalExcept(x, 2, (t) => (t < 0.3 ? ideal(steps[1]!.target) : t < 1 ? poseFromUp(upFromSitting(0)) : t < 6 ? near : ideal(tgt))),
      600
    );
    expect(x.s.phase).toBe('done');
    const s2 = said.filter((w) => w.idx === 2);
    const early = s2.find((w) => w.text.startsWith('Zaten yattınız'));
    expect(early?.priority).toBe('high');
    const ok = s2.find((w) => w.t > early!.t && (w.text === 'Tamam, böyle kalın.' || /Geçiş|Oturuştan/.test(w.text)));
    expect(ok?.priority).toBe('normal');
    expect(ok?.text).not.toMatch(/Zaten/);
  });

  it('son baş dönmesi hatırlatması kısa ve yavaş seste de 2 dk durdurma cümlesinden önce biter', () => {
    for (const rate of [1, 0.8, 0.65]) {
      const x = sim('epley');
      x.cfg = { ...x.cfg, introSecFor: (t: string) => t.length / (13 * rate) };
      send(x, { type: 'start' });
      while (x.s.stepIndex < 1 || x.s.phase !== 'holding') {
        x.t += 100;
        send(x, { type: 'tick', pose: ideal(x.cfg.protocol.steps[x.s.stepIndex]!.target) });
      }
      send(x, { type: 'vertigoToggle' });
      const v0 = x.t;
      const reminders: { t: number; text: string }[] = [];
      while (x.s.stopReason === null && x.t < 600000) {
        x.t += 100;
        const n = x.cues.length;
        send(x, { type: 'tick', pose: ideal(x.cfg.protocol.steps[1]!.target) });
        const fresh = x.cues.slice(n);
        if (fresh.some((c) => c.kind === 'haptic' && c.pattern === 'markOn')) {
          const sp = speakCues(fresh)[0];
          if (sp && !sp.text.startsWith('Süre doldu')) reminders.push({ t: (x.t - v0) / 1000, text: sp.text });
        }
      }
      expect(x.s.stopReason).toBe('VERTIGO_TOO_LONG');
      const last = reminders[reminders.length - 1]!;
      expect(last.text).toMatch(/^Baş dönmesi geçtiyse hemen ekrana dokunun\. \d+ saniye içinde dokunulmazsa manevrayı durduracağım\.$/);
      expect(last.t + x.cfg.introSecFor(last.text)).toBeLessThanOrEqual(120 - 1.9);
      const left = Number(/(\d+) saniye/.exec(last.text)![1]);
      expect(Math.abs(last.t + left - 120)).toBeLessThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------------------------
// Kullanıcı turu 4 — G1 (yürütücü)
// ---------------------------------------------------------------------------------------------
describe('tur 4 G1-2: yanlış yandan sırtüstüne gelince "şimdi doğru yana" (k04)', () => {
  /** Sağ Epley 4. adım (gövdeyle sol yan): 2–12 s yanlış (sağ) yanda, 12–16 s sırtüstü, sonra hedefte. */
  const viaSupine = (x: Sim) => {
    const steps = x.cfg.protocol.steps;
    return normalExcept(x, 3, (t) => (t < 2 ? ideal(steps[2]!.target) : t < 12 ? lying(90, 0) : t < 16 ? lying(0, 0) : ideal(steps[3]!.target)));
  };

  it('sırtüstüne gelince "2 uzun" titreşim ve tonla kısa "Tamam, şimdi sol yanınıza."; sonra doğru yanda tamamlanır', () => {
    const x = sim('epley');
    const got = cueRun(x, viaSupine(x), 900);
    expect(x.s.phase).toBe('done');
    const s3 = got.filter((g) => g.idx === 3);
    const said = speechOf(s3).filter((g) => g.cue.text.startsWith('Tamam, şimdi'));
    expect(said.map((g) => g.cue.text)).toEqual(['Tamam, şimdi sol yanınıza.']);
    const cue = said[0]!;
    // Sırtüstüne 12. saniyede geldi; ~1 s orada kalınca (gecikme payı; k02, tur 5).
    expect(cue.t).toBeGreaterThanOrEqual(13);
    expect(cue.t).toBeLessThanOrEqual(13.5);
    // O an okunan "önce sırtüstüne" yönergesini keser (hasta zaten sırtüstünde).
    expect(cue.cue.priority).toBe('high');
    const same = s3.filter((g) => g.t === cue.t).map((g) => g.cue);
    expect(same).toContainEqual({ kind: 'haptic', pattern: 'move' });
    expect(same).toContainEqual({ kind: 'tone', pattern: 'move' });
    expect(x.s.records[3]!.wrongSide).toBe(true);
  });

  it('yakını ve klinisyen biçimi; oturuşa dönen ya da hiç yanlış yana geçmeyen hastaya söylenmez', () => {
    const h = sim('epley');
    h.cfg = { ...h.cfg, helper: true };
    expect(timedRun(h, viaSupine(h), 900).map((w) => w.text)).toContain('Tamam, şimdi hastanın sol yanına.');
    const c = sim('epley', 'clinician');
    expect(timedRun(c, viaSupine(c), 900).map((w) => w.text)).toContain('Şimdi hastanın soluna.');
    const sitUp = sim('epley');
    const st = sitUp.cfg.protocol.steps;
    const sat = cueRun(
      sitUp,
      normalExcept(sitUp, 3, (t) => (t < 2 ? ideal(st[2]!.target) : t < 12 ? lying(90, 0) : t < 16 ? poseFromUp(upFromSitting(0)) : ideal(st[3]!.target))),
      900
    );
    expect(speechOf(sat).some((g) => g.cue.text.startsWith('Tamam, şimdi'))).toBe(false);
    const ok = sim('epley');
    const all = cueRun(ok, (idx, t) => ideal(ok.cfg.protocol.steps[t > 1 || idx === 0 ? idx : idx - 1]!.target), 900);
    expect(speechOf(all).some((g) => g.cue.text.startsWith('Tamam, şimdi'))).toBe(false);
  });

  it("sırtüstü sınırında (25°↔35°) gidip gelen hastaya \"Tamam\" yok; gerçekten sırtüstüne dönüp gidene en sık 5 s'de bir", () => {
    const x = sim('epley');
    const steps = x.cfg.protocol.steps;
    const edge = cueRun(
      x,
      normalExcept(x, 3, (t) => (t < 2 ? ideal(steps[2]!.target) : t < 20 ? lying(Math.floor(t * 2) % 2 ? 35 : 25, 0) : ideal(steps[3]!.target))),
      900
    );
    const e3 = speechOf(edge).filter((g) => g.idx === 3);
    // Gecikme payı (k02, tur 5): 25° sırtüstü sayılmaz; kilit sürer, kısa uyarı bu geçişte bir kez.
    expect(e3.some((g) => g.cue.text.startsWith('Tamam, şimdi'))).toBe(false);
    expect(e3.filter((g) => g.cue.text === 'Dur! Yanlış taraf.')).toHaveLength(1);
    expect(x.s.phase).toBe('done');
    // Her 1,5 s'de bir sırtüstünde (0°) 1,5 s kalıp yeniden yanlış yana (35°) geçen hasta.
    const y = sim('epley');
    const st = y.cfg.protocol.steps;
    const got = cueRun(
      y,
      normalExcept(y, 3, (t) => (t < 2 ? ideal(st[2]!.target) : t < 20 ? lying(Math.floor(t / 1.5) % 2 ? 0 : 35, 0) : ideal(st[3]!.target))),
      900
    );
    const times = speechOf(got)
      .filter((g) => g.idx === 3 && g.cue.text === 'Tamam, şimdi sol yanınıza.')
      .map((g) => g.t);
    expect(times.length).toBeGreaterThan(0);
    for (let i = 1; i < times.length; i++) expect(times[i]! - times[i - 1]!).toBeGreaterThanOrEqual(5 - 0.01);
  });
});

describe('tur 4 G1-3: en iyi açı tek ölçümden değil; hedefe bir an değmek "tutulamadı" (k07)', () => {
  it('başın bir an hedefe savrulması en iyi açı sayılmaz: "~8° … hedefe yalnız bir an değdi, tutulamadı"', () => {
    const x = sim('epley');
    const s0 = x.cfg.protocol.steps[0]!.target;
    // Hızla yatarken baş 0,3 s 16°'ye (hedefte) savrulur, sonra 8°'de kalır (k07'nin ilk denemesi).
    run(x, { maxSec: 400, poseOverride: (idx, t) => (idx === 0 || t <= 1 ? ideal(s0) : t <= 1.3 ? lying(45, 16) : lying(45, 8)) });
    expect(x.s.stopReason).toBe('POSITION_UNREACHABLE');
    const rec = x.s.records[1]!;
    expect(rec.firstInRangeAt).not.toBeNull();
    expect(rec.reach?.phi).toBeCloseTo(8, 0);
    expect(rec.reach?.touchedOnly).toBe(true);
    expect(reachSummary(rec, x.cfg.protocol.steps[1]!)).toBe(`baş en çok ~8° sarktı (hedef 15–40°); ${REACH_TOUCHED_ONLY_TEXT}`);
    expect(REACH_TOUCHED_ONLY_TEXT).toBe('hedefe yalnız bir an değdi, tutulamadı');
  });

  it('hedefe hiç değmeyen temiz denemede işaret yok; sınırda gidip gelen hastada ortanca değer ve işaret', () => {
    const clean = sim('epley');
    epleyStuck(clean, lying(45, 8), 400);
    expect(clean.s.records[1]!.reach?.touchedOnly).toBeUndefined();
    expect(reachSummary(clean.s.records[1]!, clean.cfg.protocol.steps[1]!)).toBe('baş en çok ~8° sarktı (hedef 15–40°)');
    const edge = sim('epley');
    const s0 = edge.cfg.protocol.steps[0]!.target;
    // 0,4 s hedefte (φ 17), 1,6 s dışında (φ 12).
    run(edge, { maxSec: 300, poseOverride: (idx, t) => (idx === 0 || t <= 1 ? ideal(s0) : lying(45, Math.round(t * 10) % 20 < 4 ? 17 : 12)) });
    const rec = edge.s.records[1]!;
    expect(rec.unreachable).toBe(true);
    expect(rec.reach?.phi).toBeCloseTo(12, 0);
    expect(reachSummary(rec, edge.cfg.protocol.steps[1]!)).toBe(`baş en çok ~12° sarktı (hedef 15–40°); ${REACH_TOUCHED_ONLY_TEXT}`);
  });

  it('bildirilen değer hedef aralığındaysa yalnız "hedefe yalnız bir an değdi" (çelişkili "~16° sarktı … gelinemedi" yok)', () => {
    const x = sim('epley');
    // Yönerge çok uzun: hasta hedefte, ama pozisyon henüz doğrulanamadan "Pozisyona gelemiyorum" seçildi.
    x.cfg = { ...x.cfg, introSecFor: () => 30 };
    const s0 = x.cfg.protocol.steps[0]!.target;
    send(x, { type: 'start' });
    while (x.s.stepIndex < 1 || (x.t - x.s.stepStartedAt) / 1000 < 10) {
      x.t += 100;
      const inStep = (x.t - x.s.stepStartedAt) / 1000;
      send(x, { type: 'tick', pose: x.s.stepIndex === 0 ? ideal(s0) : inStep <= 1 ? ideal(s0) : lying(45, 20) });
    }
    send(x, { type: 'pause' });
    send(x, { type: 'abort', reason: 'POSITION_UNREACHABLE' });
    const rec = x.s.records[1]!;
    expect(rec.reachedAt).toBeNull();
    expect(rec.reach?.touchedOnly).toBe(true);
    expect(reachSummary(rec, x.cfg.protocol.steps[1]!)).toBe(REACH_TOUCHED_ONLY_TEXT);
  });

  it('kısa dizide (ortalama oluşmadan) durdurulursa eldeki ölçümlerden; tamamlanan adımda özet yine yok', () => {
    const x = sim('epley');
    send(x, { type: 'start' });
    while (x.s.stepIndex < 1) {
      x.t += 100;
      send(x, { type: 'tick', pose: ideal(x.cfg.protocol.steps[0]!.target) });
    }
    for (let i = 0; i < 8; i++) {
      x.t += 100;
      send(x, { type: 'tick', pose: lying(45, 6) });
    }
    send(x, { type: 'pause' });
    send(x, { type: 'abort', reason: 'POSITION_UNREACHABLE' });
    expect(x.s.records[1]!.reach?.phi).toBeCloseTo(6, 0);
    expect(x.s.records[1]!.reach?.touchedOnly).toBeUndefined();
    const ok = sim('epley');
    run(ok);
    ok.cfg.protocol.steps.forEach((st, i) => expect(reachSummary(ok.s.records[i]!, st)).toBeNull());
  });
});

describe('tur 4 G1-4: sesli metin, duraklatma sesi, kısa seste seyrekleşme, yüzüstünden gelme', () => {
  it('saniye kısaltması seste açılır; bir dakikadan uzun süre sade söylenir', () => {
    expect(speakableSeconds('Sağ taraf testi: baş en çok ~8° geriye sarkabildi (hedef 15–40°); 72 s içinde gelinemedi')).toBe(
      'Sağ taraf testi: baş en çok ~8° geriye sarkabildi (hedef 15–40°); 72 saniye içinde gelinemedi'
    );
    expect(speakableSeconds('geçiş 4 sn, 8,5 s sürdü; 3s.')).toBe('geçiş 4 saniye, 8,5 saniye sürdü; 3 saniye.');
    expect(speakableSeconds('2 saat sonra, 45° sola, Sağ yan, 1 sol')).toBe('2 saat sonra, 45° sola, Sağ yan, 1 sol');
    expect(spokenDuration(72)).toBe('bir dakikadan uzun süre');
    expect(spokenDuration(45.4)).toBe('45 saniye');
  });

  it('yürütücünün söylediği hiçbir cümlede "s"/"sn" kısaltması yok (hasta, yakını, klinisyen; durdurmalar dahil)', () => {
    const texts: string[] = [];
    const collect = (x: Sim) => texts.push(...spoken(x));
    for (const mode of ['patient', 'clinician'] as const) {
      for (const id of ['epley', 'semont', 'dix-hallpike'] as const) {
        const x = sim(id, mode);
        run(x, { reactSec: 4 });
        collect(x);
      }
    }
    const h = sim('epley');
    h.cfg = { ...h.cfg, helper: true };
    epleyStuck(h, lying(45, 8), 400);
    collect(h);
    const full = sim('epley', 'clinician');
    full.cfg = { ...full.cfg, clinicianVoice: 'full' };
    epleyStuck(full, lying(45, 8), 120);
    collect(full);
    const v = sim('epley');
    send(v, { type: 'start' });
    while (v.s.stepIndex < 1 || v.s.phase !== 'holding') {
      v.t += 100;
      send(v, { type: 'tick', pose: ideal(v.cfg.protocol.steps[v.s.stepIndex]!.target) });
    }
    send(v, { type: 'vertigoToggle' });
    while (v.s.stopReason === null && v.t < 600000) {
      v.t += 100;
      send(v, { type: 'tick', pose: ideal(v.cfg.protocol.steps[1]!.target) });
    }
    collect(v);
    texts.push(pauseSpeech(v.cfg, true, true));
    expect(texts.length).toBeGreaterThan(50);
    for (const t of texts) expect(t, t).not.toMatch(/\d\s*(s|sn)(?![\p{L}\p{N}])/u);
  });

  it('duraklatma sesi varsayılan kısa (eylem + varsa "bir kez dokunun" + boyun cümlesi); ayrıntı yalnız tam biçimde', () => {
    const x = sim('epley');
    send(x, { type: 'start' });
    send(x, { type: 'pause' });
    expect(speakCues(x.cues).pop()!.text).toBe('Duraklatıldı. Devam için ekrana iki saniye basılı tutun. Boynunuz ağrıyorsa yavaşça oturun.');
    expect(pauseSpeech(x.cfg, false, false)).toBe('Duraklatıldı. Devam için ekrana iki saniye basılı tutun. Boynunuz ağrıyorsa yavaşça oturun.');
    // Telefon alındayken "Tekrar dinle" görülemez: boyun güvenlik cümlesi kısa seste de kalır (k07, tur 5).
    expect(pauseSpeech({ ...x.cfg, helper: true }, false, false)).toMatch(/Hastanın boynu ağrıyorsa onu yavaşça oturtun\.$/);
    expect(pauseSpeech(x.cfg, false, true).startsWith('Duraklatıldı. Devam için ekrana iki saniye basılı tutun. Boynunuz')).toBe(true);
    expect(pauseSpeech({ ...x.cfg, helper: true }, false, true)).toMatch(/"Bu pozisyona gelemiyor" düğmesine dokunun ve onaylayın\.$/);
    const c = sim('epley', 'clinician');
    expect(pauseSpeech(c.cfg, true, true)).toBe('Duraklatıldı.');
  });

  it('klinisyen kısa seste aynı yön ipucu üçüncüden sonra seyrekleşir; açık seste değişmez (k10)', () => {
    const gaps = (voice: 'short' | 'full', text: string) => {
      const x = sim('epley', 'clinician');
      x.cfg = { ...x.cfg, clinicianVoice: voice };
      const s0 = x.cfg.protocol.steps[0]!.target;
      const said = timedRun(x, (idx, t) => (idx === 0 || t <= 1 ? ideal(s0) : lying(45, 8)), 120);
      const ts = said.filter((w) => w.idx === 1 && w.text === text).map((w) => w.t);
      return ts.slice(1).map((t, i) => t - ts[i]!);
    };
    const short = gaps('short', 'Daha sarkık.');
    expect(short.length).toBeGreaterThanOrEqual(5);
    // İlk üçü olağan aralıkla (~5 s), sonrakiler en az 10 s arayla.
    short.slice(0, SAME_HINT_THIN_AFTER - 1).forEach((g) => expect(g).toBeLessThan(SAME_HINT_THIN_EVERY_SEC));
    short.slice(SAME_HINT_THIN_AFTER - 1).forEach((g) => expect(g).toBeGreaterThanOrEqual(SAME_HINT_THIN_EVERY_SEC - 0.01));
    const full = gaps('full', 'Ekstansiyonu artırın (baş daha sarkık).');
    expect(full.length).toBeGreaterThanOrEqual(5);
    full.forEach((g) => expect(g).toBeLessThan(SAME_HINT_THIN_EVERY_SEC));
    // Yanlış taraf yönergesi de aynı kuralla seyrekleşir (k10, tur 5): bkz. "tur 5 H1-3".
  });

  it('hedef açıya yüzüstünden gelinince hemen ve açıkça söylenir, kayda geçer; sırtüstünden gelince kabul', () => {
    const x = sim('epley');
    const steps = x.cfg.protocol.steps;
    const said = timedRun(
      x,
      normalExcept(x, 3, (t) => {
        if (t < 2) return ideal(steps[2]!.target);
        if (t < 14) return lying(90, 0); // yanlış (sağ) yan
        if (t < 16) return lying(175, 0); // yüzüstü
        if (t < 30) return lying(-135, 0); // yüzüstü üzerinden hedef açısında
        if (t < 32) return lying(0, 0); // sırtüstü
        return ideal(steps[3]!.target);
      }),
      600
    );
    expect(x.s.phase).toBe('done');
    const rec = x.s.records[3]!;
    expect(rec.proneArrival).toBe(true);
    expect((rec.reachedAt! - rec.startedAt) / 1000).toBeGreaterThanOrEqual(32);
    const prone = said.filter((w) => w.idx === 3 && w.text.startsWith('Yüzüstünden geçilerek gelindi; kabul edilmedi.'));
    expect(prone.length).toBeGreaterThan(0);
    expect(prone[0]!.text).toBe(
      'Yüzüstünden geçilerek gelindi; kabul edilmedi. Önce sırtüstüne dönün, sonra bütün vücudunuzla sol yanınıza dönün.'
    );
    expect(prone[0]!.t).toBeGreaterThanOrEqual(16);
    expect(prone[0]!.t).toBeLessThanOrEqual(16.5);
    expect(prone[0]!.priority).toBe('high');
    // Sırtüstüne gelince "şimdi sol yanınıza".
    expect(said.some((w) => w.idx === 3 && w.text === 'Tamam, şimdi sol yanınıza.' && w.t >= 30)).toBe(true);
    // Ekranda da not; sırtüstüne dönünce kalkar.
    const y = sim('epley');
    const notes: { t: number; notice: string | null }[] = [];
    cueRun(
      y,
      normalExcept(y, 3, (t) => (t < 2 ? ideal(steps[2]!.target) : t < 6 ? lying(90, 0) : t < 8 ? lying(175, 0) : t < 20 ? lying(-135, 0) : t < 22 ? lying(0, 0) : ideal(steps[3]!.target))),
      600,
      (z) => {
        if (z.s.stepIndex === 3) notes.push({ t: (z.t - z.s.stepStartedAt) / 1000, notice: z.s.notice });
      }
    );
    expect(notes.find((n) => n.t > 10 && n.t < 19)?.notice).toBe(PRONE_ARRIVAL_NOTICE);
    expect(notes.find((n) => n.t > 21)?.notice).toBeNull();
  });

  it("yüzüstünden hedefte kalan hasta ~60 s'de durur; özet dönüş uzaklığı yerine \"yüzüstünden geçilerek gelindi\"; yakını bitiş metni", () => {
    const x = sim('epley');
    const steps = x.cfg.protocol.steps;
    run(x, {
      maxSec: 600,
      poseOverride: normalExcept(x, 3, (t) => (t < 2 ? ideal(steps[2]!.target) : t < 6 ? lying(90, 0) : t < 7 ? lying(175, 0) : lying(-135, 0)))
    });
    expect(x.s.stopReason).toBe('POSITION_UNREACHABLE');
    const rec = x.s.records[3]!;
    expect(rec.wrongSideStop).toBe(true);
    expect(rec.proneArrival).toBe(true);
    // Güvenlik kuralları aynen: hedef gevşetilmedi, ~60 s'de durdu.
    expect(rec.reachedAt).toBeNull();
    const dur = ((rec.endedAt ?? 0) - rec.startedAt) / 1000;
    expect(dur).toBeGreaterThanOrEqual(60);
    expect(dur).toBeLessThan(70);
    const sum = reachSummary(rec, steps[3]!)!;
    expect(sum).toContain(PRONE_ARRIVAL_TEXT);
    expect(sum).not.toMatch(/döndü|uzak/);
    expect(PRONE_ARRIVAL_TEXT).toBe('yüzüstünden geçilerek gelindi, kabul edilmedi');
    expect(stopTextFor('POSITION_UNREACHABLE', x.s.records)).toBe(SAFETY_STOP_TEXT.WRONG_SIDE);
    expect(stopTextFor('POSITION_UNREACHABLE', x.s.records, { helper: true })).toBe(SAFETY_STOP_TEXT_WRONG_SIDE_HELPER);
    expect(SAFETY_STOP_TEXT_WRONG_SIDE_HELPER).toMatch(/Hastayı önce sırtüstüne getirin, sonra yavaşça oturtun\./);
  });
});

// ---------------------------------------------------------------------------------------------
// Kullanıcı turu 5 — H1 (yürütücü)
// ---------------------------------------------------------------------------------------------
describe('tur 5 H1-1: yanlış taraf ↔ sırtüstü sınırında gecikme payı (k02)', () => {
  /**
   * Sağ Epley 4. adım (gövdeyle sol yan, θ −135): baş 2. saniyede tek seferde +30°'ye (sınırın tam üstü) gelir, 1 s boyunca
   * 28°/31° arasında titrer, sonra yanlış (sağ) yana (+90°) geçer; 20. saniyede sırtüstüne döner, 23. saniyede hedefe.
   */
  const jumpToEdge = (x: Sim) => {
    const steps = x.cfg.protocol.steps;
    return normalExcept(x, 3, (t) =>
      t < 2
        ? ideal(steps[2]!.target)
        : t < 3
          ? lying(Math.round(t * 10) % 2 ? 28 : 31, 0)
          : t < 20
            ? lying(90, 0)
            : t < 23
              ? lying(0, 0)
              : ideal(steps[3]!.target)
    );
  };

  it('sınırdaki sıçrama "Dur!"u "Tamam, şimdi …" ile kesmez; tam yönerge kısa uyarının hemen ardından gelir', () => {
    const x = sim('epley');
    x.cfg = { ...x.cfg, introSecFor: realSpeech };
    const got = cueRun(x, jumpToEdge(x), 900).filter((g) => g.idx === 3);
    expect(x.s.phase).toBe('done');
    const said = speechOf(got);
    const alerts = said.filter((g) => g.cue.text === 'Dur! Yanlış taraf.');
    // Kısa uyarı bir kez ve hemen (sınırı geçer geçmez); arada gerçek sırtüstü dönüşü yok, yinelenmesi de gerekmez.
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.t).toBeLessThanOrEqual(2.3);
    expect(got.filter((g) => g.cue.kind === 'haptic' && g.cue.pattern === 'wrongSide')).toHaveLength(1);
    // "Tamam, şimdi …" yalnız gerçek sırtüstü dönüşünden ~1 s sonra (20 + SUPINE_CONFIRM_SEC).
    const ok = said.filter((g) => g.cue.text.startsWith('Tamam, şimdi'));
    expect(ok).toHaveLength(1);
    expect(ok[0]!.t).toBeGreaterThanOrEqual(20 + SUPINE_CONFIRM_SEC);
    expect(ok[0]!.t).toBeLessThanOrEqual(20 + SUPINE_CONFIRM_SEC + 0.5);
    // Tam yönerge kısa uyarı bitince (~4,5 s beklemeden).
    const full = said.filter((g) => g.cue.text.startsWith('Önce sırtüstüne dönün, sonra bütün vücudunuzla sol yanınıza'));
    expect(full.length).toBeGreaterThan(0);
    expect(full[0]!.t).toBeLessThanOrEqual(alerts[0]!.t + realSpeech('Dur! Yanlış taraf.') + 1);
    expect(x.s.records[3]!.wrongSide).toBe(true);
  });

  it('sırtüstüne kısa bir an (< 1 s) inip yanlış yana dönen hastada kilit sürer: "Tamam" ve yeni "Dur!" yok', () => {
    const x = sim('epley');
    const steps = x.cfg.protocol.steps;
    const got = cueRun(
      x,
      normalExcept(x, 3, (t) =>
        t < 2
          ? ideal(steps[2]!.target)
          : t < 10
            ? lying(90, 0)
            : t < 10.6
              ? lying(10, 0)
              : t < 30
                ? lying(90, 0)
                : t < 32
                  ? lying(0, 0)
                  : ideal(steps[3]!.target)
      ),
      900
    );
    const s3 = speechOf(got).filter((g) => g.idx === 3);
    expect(s3.filter((g) => g.cue.text === 'Dur! Yanlış taraf.')).toHaveLength(1);
    const ok = s3.filter((g) => g.cue.text.startsWith('Tamam, şimdi'));
    expect(ok).toHaveLength(1);
    expect(ok[0]!.t).toBeGreaterThanOrEqual(31);
    // Sırtüstü beklenirken araya yön ipucu girmez.
    expect(s3.some((g) => g.t >= 10 && g.t < 10.7 && !g.cue.text.startsWith('Önce sırtüstüne'))).toBe(false);
    expect(x.s.phase).toBe('done');
  });

  it('kilitliyken karşı yanda 20–30° arası hâlâ yanlış taraf; ≤20° değil', () => {
    const x = sim('epley');
    const steps = x.cfg.protocol.steps;
    const seen: { t: number; wrong: boolean; latched: boolean }[] = [];
    cueRun(
      x,
      normalExcept(x, 3, (t) => (t < 2 ? ideal(steps[2]!.target) : t < 6 ? lying(90, 0) : t < 9 ? lying(25, 0) : t < 9.5 ? lying(15, 0) : lying(90, 0))),
      900,
      (y) => {
        const t = (y.t - y.s.stepStartedAt) / 1000;
        if (y.s.stepIndex === 3) seen.push({ t, wrong: !!y.s.evaluation?.wrongSide, latched: y.s.wrongSideLatched });
      }
    );
    const band = seen.filter((p) => p.t > 6.2 && p.t < 9);
    const dip = seen.filter((p) => p.t > 9.1 && p.t < 9.5);
    expect(band.length).toBeGreaterThan(20);
    expect(dip.length).toBeGreaterThan(2);
    expect(band.every((p) => p.wrong && p.latched)).toBe(true);
    expect(dip.every((p) => !p.wrong && p.latched)).toBe(true);
    // Yanlış yanda kalınca güvenlik kuralı aynen: ~60 s'de durur.
    expect(x.s.stopReason).toBe('POSITION_UNREACHABLE');
  });

  it('sırtüstünden geçip (beklemeden) doğru yana gelen hasta kabul edilir; seyrek ölçümde de (yüzüstünden değil)', () => {
    for (const path of [
      [90, 0, -135],
      [90, 40, -40, -135]
    ]) {
      const x = sim('epley');
      const steps = x.cfg.protocol.steps;
      const said = timedRun(
        x,
        normalExcept(x, 3, (t) => {
          if (t < 2) return ideal(steps[2]!.target);
          if (t < 10) return lying(path[0]!, 0);
          const i = Math.min(path.length - 1, 1 + Math.floor((t - 10) / 0.1));
          return i === path.length - 1 ? ideal(steps[3]!.target) : lying(path[i]!, 0);
        }),
        900
      );
      expect(x.s.phase, path.join('→')).toBe('done');
      const rec = x.s.records[3]!;
      expect((rec.reachedAt! - rec.startedAt) / 1000).toBeLessThan(13);
      expect(rec.proneArrival).toBeUndefined();
      expect(said.some((w) => w.idx === 3 && w.text.startsWith('Tamam, şimdi'))).toBe(false);
    }
  });
});

describe('tur 5 H1-2: en iyi açı yalnız başın durağan olduğu anlardan (k07)', () => {
  it('savrulma ve sönen kuyruğu en iyi açıyı yükseltmez: "~8°"', () => {
    const x = sim('epley');
    const s0 = x.cfg.protocol.steps[0]!.target;
    // Hızla yatarken baş 0,5 s 16°'ye (hedefte) savrulur, sonra 8°'ye doğru söner (τ 0,3 s) ve orada kalır.
    const phiAt = (t: number) => (t <= 1.5 ? 16 : 8 + 8 * Math.exp(-(t - 1.5) / 0.3));
    run(x, { maxSec: 400, poseOverride: (idx, t) => (idx === 0 || t <= 1 ? ideal(s0) : lying(45, phiAt(t))) });
    expect(x.s.stopReason).toBe('POSITION_UNREACHABLE');
    const rec = x.s.records[1]!;
    expect(rec.reach?.touchedOnly).toBe(true);
    expect(rec.reach!.phi!).toBeLessThan(8.5);
    expect(reachSummary(rec, x.cfg.protocol.steps[1]!)).toBe(`baş en çok ~8° sarktı (hedef 15–40°); ${REACH_TOUCHED_ONLY_TEXT}`);
  });

  it('titrek (±3°) ama durağan baş yine ölçülür; hiç durmayan başta yedek değer kullanılır', () => {
    const x = sim('epley');
    const s0 = x.cfg.protocol.steps[0]!.target;
    const jitter = [0, 3, -3, 2, -2, 1, -1, 3, -3, 0];
    let k = 0;
    run(x, { maxSec: 400, poseOverride: (idx, t) => (idx === 0 || t <= 1 ? ideal(s0) : lying(45, 8 + jitter[k++ % jitter.length]!)) });
    expect(x.s.records[1]!.reach?.phi).toBeCloseTo(8, 0);
    // Testere dişi: 3 s'de 0→9° yükselip düşer (durağan pencere yok ya da az); yine de bir değer yazılır.
    const m = sim('epley');
    const m0 = m.cfg.protocol.steps[0]!.target;
    run(m, { maxSec: 400, poseOverride: (idx, t) => (idx === 0 || t <= 1 ? ideal(m0) : lying(45, 3 * (t % 3))) });
    const r = m.s.records[1]!;
    expect(r.unreachable).toBe(true);
    expect(r.reach?.phi).toBeTypeOf('number');
    expect(r.reach!.phi!).toBeLessThan(15);
  });
});

describe('tur 5 H1-3: klinisyen kısa seste yanlış taraf yönergesi de seyrekleşir (k10)', () => {
  it('ilk "Dur!" hemen, ilk yönerge beklemeden; üçüncüden sonra en az 10 s arayla; yeni geçişte sayı baştan', () => {
    const w = sim('epley', 'clinician');
    const steps = w.cfg.protocol.steps;
    // 2–60 s yanlış (sağ) yanda; 60–63 s sırtüstü; 63–90 s yine yanlış yanda; sonra hedefte.
    const got = cueRun(
      w,
      normalExcept(w, 3, (t) =>
        t < 2 ? ideal(steps[2]!.target) : t < 60 ? lying(90, 0) : t < 63 ? lying(0, 0) : t < 90 ? lying(90, 0) : t < 92 ? lying(0, 0) : ideal(steps[3]!.target)
      ),
      900
    );
    const s3 = speechOf(got).filter((g) => g.idx === 3);
    const alerts = s3.filter((g) => g.cue.text === 'Dur! Yanlış taraf.').map((g) => g.t);
    expect(alerts).toHaveLength(2);
    expect(alerts[0]!).toBeLessThanOrEqual(2.2);
    expect(alerts[1]!).toBeLessThanOrEqual(63.2);
    const ws = s3.filter((g) => g.cue.text === 'Sırtüstünden hastanın soluna.').map((g) => g.t);
    const first = ws.filter((t) => t < 60);
    expect(first.length).toBeGreaterThanOrEqual(6);
    // İlk yönerge kısa uyarının ardından (beklemeden).
    expect(first[0]! - alerts[0]!).toBeLessThanOrEqual(DEFAULT_RUNNER_CONFIG.hintEverySec);
    const gaps = first.slice(1).map((t, i) => t - first[i]!);
    gaps.slice(0, SAME_HINT_THIN_AFTER - 1).forEach((g) => expect(g).toBeLessThan(SAME_HINT_THIN_EVERY_SEC));
    gaps.slice(SAME_HINT_THIN_AFTER - 1).forEach((g) => expect(g).toBeGreaterThanOrEqual(SAME_HINT_THIN_EVERY_SEC - 0.01));
    // Sırtüstüne dönüp yeniden yanlış yana geçince sayı baştan: ilk yinelemeler yine olağan aralıkla.
    const second = ws.filter((t) => t > 63 && t < 90);
    expect(second.length).toBeGreaterThanOrEqual(3);
    expect(second[1]! - second[0]!).toBeLessThan(SAME_HINT_THIN_EVERY_SEC);
    expect(w.s.phase).toBe('done');
  });

  it('hasta modunda ve klinisyen açık seste yanlış taraf yönergesi değişmez', () => {
    const cases = [
      { mode: 'patient', voice: null, text: 'Önce sırtüstüne dönün, sonra bütün vücudunuzla sol yanınıza dönün.' },
      {
        mode: 'clinician',
        voice: 'full',
        text: 'Yanlış taraf: hastayı önce sırtüstüne, sonra hastanın soluna çevirin (yüzüstünden geçirmeyin).'
      }
    ] as const;
    for (const c of cases) {
      const x = sim('epley', c.mode);
      if (c.voice) x.cfg = { ...x.cfg, clinicianVoice: c.voice };
      const steps = x.cfg.protocol.steps;
      const said = timedRun(x, normalExcept(x, 3, (t) => (t < 2 ? ideal(steps[2]!.target) : t < 50 ? lying(90, 0) : ideal(steps[3]!.target))), 900);
      const ts = said.filter((s) => s.idx === 3 && s.text === c.text).map((s) => s.t);
      expect(ts.length, c.mode).toBeGreaterThanOrEqual(5);
      ts.slice(1).forEach((t, i) => expect(t - ts[i]!).toBeLessThan(SAME_HINT_THIN_EVERY_SEC));
    }
  });
});
