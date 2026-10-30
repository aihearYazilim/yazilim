/**
 * Manevra/test yürütücüsü — saf durum makinesi.
 *
 * Arayüzden bağımsızdır: zaman `now` (ms) olarak olaylarla gelir; çıktı yeni durum + "ipuçları" (konuşma,
 * titreşim, ton) listesidir. Bu sayede gerçek zamanlı akış birim testlerinde hızlandırılmış olarak denenebilir.
 *
 * Adım yaşam döngüsü:
 *   intro (yönerge okunur) → seeking (hedef aranır) → settling (hedefte 1 s doğrulama) → holding (sayaç)
 *   → [hedef dışına çıkılırsa: drifting, sayaç durur] → stepDone → sonraki adımın introsu … → done
 */
import type { HeadPose } from './geometry';
import { evaluate, type Evaluation, HINT_TEXT_CLINICIAN, HINT_TEXT_PATIENT, type HintKey } from './evaluator';
import { LIMITS, type ResolvedProtocol, type StepDef, type Target } from './protocols';

export type RunnerMode = 'patient' | 'clinician';

export interface RunnerConfig {
  mode: RunnerMode;
  protocol: ResolvedProtocol;
  /** Hedefte kesintisiz kalınması gereken süre (s). */
  confirmSec: number;
  /** Hedef dışına kısa taşmalarda sayacın durmadan önceki tolerans süresi (s). */
  driftGraceSec: number;
  /** Yönerge okunduktan sonra ilk düzeltme ipucuna kadar bekleme (s). */
  firstHintDelaySec: number;
  /** Düzeltme ipuçları arası en az süre (s). */
  hintEverySec: number;
  /** Bekleme sırasında sesli sayım aralığı (s). */
  countEverySec: number;
  /** Adımlar arası hazırlık süresi (s). */
  betweenStepsSec: number;
  /** Sensör verisi bu süreden eskiyse "veri yok" sayılır (s). */
  staleSensorSec: number;
  /**
   * Yönergenin sesli okunması için tahmini süre (s). Bu süre dolmadan pozisyon "tamam" sayılmaz ve sayaç başlamaz;
   * böylece kullanıcı yönergeyi sonuna kadar dinler. Klinisyen modunda 0 verilebilir.
   */
  introSecFor: (text: string) => number;
}

/** Türkçe TTS için kaba konuşma süresi tahmini: ~13 karakter/saniye (hız 1,0). */
export function estimateSpeechSec(text: string, rate = 1): number {
  return Math.min(25, text.length / (13 * Math.max(0.5, rate)));
}

export const DEFAULT_RUNNER_CONFIG: Omit<RunnerConfig, 'mode' | 'protocol'> = {
  confirmSec: 1,
  driftGraceSec: 2,
  firstHintDelaySec: 7,
  hintEverySec: 5,
  countEverySec: 15,
  betweenStepsSec: 4,
  staleSensorSec: 1.5,
  introSecFor: (t: string) => estimateSpeechSec(t)
};

export type Phase =
  | 'idle'
  | 'intro'
  | 'seeking'
  | 'settling'
  | 'holding'
  | 'drifting'
  | 'between'
  | 'paused'
  | 'done'
  | 'aborted'
  | 'safetyStop';

export type StopReason = 'VERTIGO_TOO_LONG' | 'USER_ABORT' | 'USER_FEELS_UNWELL' | 'INTERRUPTED';

export interface StepRecord {
  stepId: string;
  title: string;
  /** Adım başlangıcı (ms). */
  startedAt: number;
  /** Hedef aralığına ilk giriş (ms) — baş dönmesi gecikmesi buna göre ölçülür. */
  firstInRangeAt: number | null;
  /** Pozisyonun doğrulandığı an (ms). */
  reachedAt: number | null;
  endedAt: number | null;
  /** Sayılan bekleme süresi (s). */
  holdSec: number;
  /** Bekleme boyunca örnek sayıları. */
  samples: number;
  inRangeSamples: number;
  /** Yatar adımlarda |θ hatası| toplamı ve en büyüğü. */
  sumAbsThetaErr: number;
  maxAbsThetaErr: number;
  thetaSamples: number;
  /** Baş dönmesi işaretleri: adım başlangıcına göre saniye. */
  vertigoMarks: { start: number; end: number | null }[];
  /** Hedefe ulaşmadan önceki geçiş süresi (s) — hızlı geçiş gereken adımlarda. */
  transitionSec: number | null;
  /** Hedef sensörle değil elle onaylandı mı? */
  manual: boolean;
  /** Pozisyondan kayma (drift) sayısı. */
  driftCount: number;
}

export interface RunnerState {
  phase: Phase;
  /** Duraklatılmadan önceki faz. */
  pausedFrom: Phase | null;
  stepIndex: number;
  phaseSince: number;
  stepStartedAt: number;
  holdSec: number;
  lastTickAt: number | null;
  lastPoseAt: number | null;
  settlingSince: number | null;
  outOfRangeSince: number | null;
  lastHintAt: number | null;
  lastCountMark: number;
  vertigoActive: boolean;
  /** Son baş dönmesi dokunuşu (ms) — kazara çift dokunuşu yok saymak için. */
  lastVertigoToggleAt: number | null;
  vertigoSince: number | null;
  vertigoEndedAt: number | null;
  vertigoLongWarned: boolean;
  waitingVertigoAnnounced: boolean;
  /** Baş dönmesi hatırlatmalarından en son söyleneni (s). */
  vertigoRemindMark: number;
  /** Önceki adımın hedefinden ayrılma anı (hızlı geçiş ölçümü). */
  leftPreviousAt: number | null;
  manualStep: boolean;
  evaluation: Evaluation | null;
  records: StepRecord[];
  stopReason: StopReason | null;
  /** Bilgi mesajı (ör. "Telefon yerinden oynadı"). */
  notice: string | null;
}

export type RunnerEvent =
  | { type: 'start'; now: number }
  | { type: 'tick'; now: number; pose: HeadPose | null }
  | { type: 'vertigoToggle'; now: number }
  | { type: 'manualConfirm'; now: number }
  | { type: 'skipStep'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'abort'; now: number; reason: StopReason }
  | { type: 'shock'; now: number };

export type Cue =
  | { kind: 'speak'; text: string; priority: 'high' | 'normal' }
  | { kind: 'haptic'; pattern: 'reached' | 'drift' | 'stepDone' | 'alarm' | 'tap' | 'move' | 'markOn' | 'markOff' | 'pause' }
  | { kind: 'tone'; pattern: 'reached' | 'stepDone' | 'countdown' | 'done' | 'alarm' | 'move' | 'drift' | 'markOn' | 'markOff' | 'pause' };

export interface StepResult {
  state: RunnerState;
  cues: Cue[];
}

export function initialRunnerState(): RunnerState {
  return {
    phase: 'idle',
    pausedFrom: null,
    stepIndex: 0,
    phaseSince: 0,
    stepStartedAt: 0,
    holdSec: 0,
    lastTickAt: null,
    lastPoseAt: null,
    settlingSince: null,
    outOfRangeSince: null,
    lastHintAt: null,
    lastCountMark: 0,
    vertigoActive: false,
    lastVertigoToggleAt: null,
    vertigoSince: null,
    vertigoEndedAt: null,
    vertigoLongWarned: false,
    waitingVertigoAnnounced: false,
    vertigoRemindMark: 0,
    leftPreviousAt: null,
    manualStep: false,
    evaluation: null,
    records: [],
    stopReason: null,
    notice: null
  };
}

export const currentStep = (cfg: RunnerConfig, s: RunnerState): StepDef | undefined => cfg.protocol.steps[s.stepIndex];

const sec = (ms: number) => ms / 1000;

function newRecord(step: StepDef, now: number): StepRecord {
  return {
    stepId: step.id,
    title: step.title,
    startedAt: now,
    firstInRangeAt: null,
    reachedAt: null,
    endedAt: null,
    holdSec: 0,
    samples: 0,
    inRangeSamples: 0,
    sumAbsThetaErr: 0,
    maxAbsThetaErr: 0,
    thetaSamples: 0,
    vertigoMarks: [],
    transitionSec: null,
    manual: false,
    driftCount: 0
  };
}

function introSec(cfg: RunnerConfig, step: StepDef): number {
  return cfg.introSecFor(stepSpeech(cfg, step));
}

function hintText(cfg: RunnerConfig, key: HintKey): string {
  return cfg.mode === 'patient' ? HINT_TEXT_PATIENT[key] : HINT_TEXT_CLINICIAN[key];
}

function stepSpeech(cfg: RunnerConfig, step: StepDef): string {
  return cfg.mode === 'patient' ? step.say : step.clinician;
}

function updateRecord(s: RunnerState, fn: (r: StepRecord) => StepRecord): RunnerState {
  const records = s.records.slice();
  const last = records[records.length - 1];
  if (last) records[records.length - 1] = fn(last);
  return { ...s, records };
}

/** Bir adımın tamamlanıp tamamlanmadığı. */
function holdComplete(s: RunnerState, step: StepDef, now: number): boolean {
  if (s.holdSec < step.minHoldSec) return false;
  if (s.vertigoActive) return false;
  if (s.vertigoEndedAt !== null && sec(now - s.vertigoEndedAt) < step.afterVertigoSec) return false;
  return true;
}

/** Adımın baş dönmesi üst sınırı (s); hasta modunda gözlem adımlarında hiçbir zaman sınırsız değildir. */
export function vertigoLimitFor(cfg: RunnerConfig, step: StepDef): number | null {
  if (step.maxVertigoSec !== null) return step.maxVertigoSec;
  return cfg.mode === 'patient' && step.observe !== false ? LIMITS.maxVertigoSec : null;
}

function startStep(cfg: RunnerConfig, s: RunnerState, index: number, now: number, cues: Cue[]): RunnerState {
  const step = cfg.protocol.steps[index];
  if (!step) return s;
  // Yeni adım: sesi duyamayan kullanıcı için "şimdi hareket et" titreşim ve tonu (ilk adım hariç: zaten geri sayım var).
  if (index > 0) {
    cues.push({ kind: 'haptic', pattern: 'move' });
    cues.push({ kind: 'tone', pattern: 'move' });
  }
  cues.push({ kind: 'speak', text: stepSpeech(cfg, step), priority: 'high' });
  return {
    ...s,
    phase: 'intro',
    stepIndex: index,
    phaseSince: now,
    stepStartedAt: now,
    holdSec: 0,
    settlingSince: null,
    outOfRangeSince: null,
    lastHintAt: null,
    lastCountMark: 0,
    vertigoActive: false,
    lastVertigoToggleAt: null,
    vertigoSince: null,
    vertigoEndedAt: null,
    vertigoLongWarned: false,
    waitingVertigoAnnounced: false,
    vertigoRemindMark: 0,
    leftPreviousAt: null,
    manualStep: false,
    evaluation: null,
    notice: null,
    records: [...s.records, newRecord(step, now)]
  };
}

function finishStep(cfg: RunnerConfig, s: RunnerState, now: number, cues: Cue[]): RunnerState {
  let next = updateRecord(s, (r) => ({ ...r, endedAt: now, holdSec: s.holdSec }));
  const isLast = s.stepIndex >= cfg.protocol.steps.length - 1;
  if (isLast) {
    cues.push({ kind: 'haptic', pattern: 'stepDone' });
    cues.push({ kind: 'tone', pattern: 'done' });
    cues.push({
      kind: 'speak',
      text:
        cfg.protocol.kind === 'maneuver'
          ? cfg.mode === 'patient'
            ? 'Manevra tamamlandı. 10 dakika oturarak dinlenin; kalkarken dikkatli olun.'
            : 'Manevra tamamlandı.'
          : cfg.mode === 'patient'
            ? 'Test tamamlandı.'
            : 'Test tamamlandı.',
      priority: 'high'
    });
    return { ...next, phase: 'done', phaseSince: now, evaluation: null };
  }
  cues.push({ kind: 'haptic', pattern: 'stepDone' });
  cues.push({ kind: 'tone', pattern: 'stepDone' });
  cues.push({
    kind: 'speak',
    text: cfg.mode === 'patient' ? 'Bu adım tamam. Bir sonraki hareket için hazır olun.' : 'Adım tamam. Sıradaki adım.',
    priority: 'high'
  });
  next = { ...next, phase: 'between', phaseSince: now };
  return next;
}

function targetSatisfiedLoose(pose: HeadPose, target: Target): boolean {
  // Hızlı geçiş ölçümü için önceki hedefin geniş (±25°) bölgesinde mi?
  const e = evaluate(pose, target);
  return e.postureOk && e.errorDeg <= 25;
}

/** Baş dönmesi dokunuşları arasında en az süre (s). */
export const VERTIGO_DEBOUNCE_SEC = 1;
/** Baş dönmesi işaretliyken "geçtiyse dokunun" hatırlatma aralığı (hasta modu). */
export const VERTIGO_REMIND_EVERY_SEC = 30;

export function runnerStep(cfg: RunnerConfig, s: RunnerState, ev: RunnerEvent): StepResult {
  const cues: Cue[] = [];
  const now = ev.now;

  // Bitmiş durumlarda yalnızca yok say.
  if (s.phase === 'done' || s.phase === 'aborted' || s.phase === 'safetyStop') {
    return { state: s, cues };
  }

  switch (ev.type) {
    case 'start': {
      if (s.phase !== 'idle') return { state: s, cues };
      return { state: startStep(cfg, { ...s }, 0, now, cues), cues };
    }

    case 'abort': {
      cues.push({ kind: 'haptic', pattern: 'alarm' });
      cues.push({
        kind: 'speak',
        text: cfg.mode === 'patient' ? 'Durduruldu. Yavaşça oturun ve dinlenin.' : 'Durduruldu.',
        priority: 'high'
      });
      const st = updateRecord(s, (r) => ({ ...r, endedAt: r.endedAt ?? now, holdSec: s.holdSec }));
      return { state: { ...st, phase: 'aborted', phaseSince: now, stopReason: ev.reason }, cues };
    }

    case 'pause': {
      if (s.phase === 'paused' || s.phase === 'idle') return { state: s, cues };
      cues.push({ kind: 'haptic', pattern: 'pause' });
      cues.push({ kind: 'tone', pattern: 'pause' });
      cues.push({
        kind: 'speak',
        text: cfg.mode === 'patient' ? 'Duraklatıldı. Olduğunuz yerde kalın. Devam etmek için ekrandaki Devam düğmesine basın.' : 'Duraklatıldı.',
        priority: 'high'
      });
      return { state: { ...s, phase: 'paused', pausedFrom: s.phase, phaseSince: now }, cues };
    }

    case 'resume': {
      if (s.phase !== 'paused') return { state: s, cues };
      const back = s.pausedFrom ?? 'seeking';
      // Bekleme sırasında duraklatıldıysa, sensörle tekrar doğrulamak için arama fazına dön.
      // Elle onaylanmış adımda sensör doğrulaması yoktur → doğrudan beklemeye dön.
      const wasHolding = back === 'holding' || back === 'drifting' || back === 'settling';
      const phase: Phase = wasHolding ? (s.manualStep ? 'holding' : 'seeking') : back;
      cues.push({ kind: 'speak', text: 'Devam ediyoruz.', priority: 'high' });
      return {
        state: { ...s, phase, pausedFrom: null, phaseSince: now, settlingSince: null, outOfRangeSince: null, lastTickAt: now },
        cues
      };
    }

    case 'skipStep': {
      if (cfg.mode !== 'clinician') return { state: s, cues };
      if (s.phase === 'idle' || s.phase === 'paused') return { state: s, cues };
      if (s.phase === 'between') {
        return { state: startStep(cfg, s, s.stepIndex + 1, now, cues), cues };
      }
      return { state: finishStep(cfg, { ...s, vertigoActive: false }, now, cues), cues };
    }

    case 'manualConfirm': {
      if (s.phase !== 'intro' && s.phase !== 'seeking' && s.phase !== 'settling' && s.phase !== 'drifting') {
        return { state: s, cues };
      }
      cues.push({ kind: 'haptic', pattern: 'reached' });
      cues.push({ kind: 'tone', pattern: 'reached' });
      cues.push({
        kind: 'speak',
        text: cfg.mode === 'patient' ? 'Tamam, böyle kalın.' : 'Pozisyon elle onaylandı.',
        priority: 'high'
      });
      const st = updateRecord(s, (r) => ({ ...r, manual: true, reachedAt: r.reachedAt ?? now }));
      return {
        state: { ...st, phase: 'holding', phaseSince: now, manualStep: true, outOfRangeSince: null, lastTickAt: now },
        cues
      };
    }

    case 'shock': {
      if (s.phase !== 'holding' || s.manualStep) return { state: s, cues };
      cues.push({ kind: 'haptic', pattern: 'drift' });
      cues.push({
        kind: 'speak',
        text:
          cfg.mode === 'patient'
            ? 'Telefon yerinden oynadı. Telefonu alnınıza geri yaslayın.'
            : 'Telefon yerinden oynadı; alına geri yerleştirin.',
        priority: 'high'
      });
      const st = updateRecord(s, (r) => ({ ...r, driftCount: r.driftCount + 1 }));
      return {
        state: { ...st, phase: 'drifting', phaseSince: now, outOfRangeSince: now, notice: 'Telefon yerinden oynadı.' },
        cues
      };
    }

    case 'vertigoToggle': {
      if (s.phase === 'idle' || s.phase === 'between') return { state: s, cues };
      // Duraklatmadayken yalnız "geçti" işaretine izin verilir (duraklatma süresi baş dönmesi süresine sayılır;
      // geçtiği işaretlenemezse devamda yanlış güvenlik durdurması olurdu).
      if (s.phase === 'paused' && !s.vertigoActive) return { state: s, cues };
      const step = currentStep(cfg, s);
      if (!step) return { state: s, cues };
      // Alındaki telefona körlemesine yapılan kazara çift dokunuşu yok say.
      if (s.lastVertigoToggleAt !== null && sec(now - s.lastVertigoToggleAt) < VERTIGO_DEBOUNCE_SEC) return { state: s, cues };
      s = { ...s, lastVertigoToggleAt: now };
      const rel = sec(now - s.stepStartedAt);
      if (!s.vertigoActive) {
        cues.push({ kind: 'haptic', pattern: 'markOn' });
        cues.push({ kind: 'tone', pattern: 'markOn' });
        cues.push({
          kind: 'speak',
          text:
            cfg.mode === 'patient'
              ? 'Baş dönmesi işaretlendi. Gözlerinizi açık tutmaya çalışın ve pozisyonu bozmayın. Geçince ekrana tekrar dokunun.'
              : 'Başlangıç işaretlendi.',
          priority: 'normal'
        });
        const st = updateRecord(s, (r) => ({ ...r, vertigoMarks: [...r.vertigoMarks, { start: rel, end: null }] }));
        return { state: { ...st, vertigoActive: true, vertigoSince: now, vertigoLongWarned: false, vertigoRemindMark: 0 }, cues };
      }
      cues.push({ kind: 'haptic', pattern: 'markOff' });
      cues.push({ kind: 'tone', pattern: 'markOff' });
      cues.push({
        kind: 'speak',
        text:
          cfg.mode === 'patient'
            ? `Geçti olarak işaretlendi. ${step.afterVertigoSec} saniye daha bu pozisyonda bekleyin.`
            : 'Bitiş işaretlendi.',
        priority: 'normal'
      });
      const st = updateRecord(s, (r) => {
        const marks = r.vertigoMarks.slice();
        const last = marks[marks.length - 1];
        if (last && last.end === null) marks[marks.length - 1] = { ...last, end: rel };
        return { ...r, vertigoMarks: marks };
      });
      return { state: { ...st, vertigoActive: false, vertigoSince: null, vertigoEndedAt: now }, cues };
    }

    case 'tick':
      return tick(cfg, s, now, ev.pose, cues);
  }
}

function tick(cfg: RunnerConfig, s0: RunnerState, now: number, pose: HeadPose | null, cues: Cue[]): StepResult {
  let s: RunnerState = { ...s0 };
  const dt = s.lastTickAt === null ? 0 : Math.max(0, Math.min(1, sec(now - s.lastTickAt)));
  s.lastTickAt = now;
  if (pose) s.lastPoseAt = now;

  if (s.phase === 'idle' || s.phase === 'paused') return { state: s, cues };

  // Adımlar arası hazırlık
  if (s.phase === 'between') {
    const elapsed = sec(now - s.phaseSince);
    const left = cfg.betweenStepsSec - elapsed;
    if (left <= 3 && s.lastCountMark !== -3 && left > 2) {
      cues.push({ kind: 'tone', pattern: 'countdown' });
      s.lastCountMark = -3;
    } else if (left <= 2 && s.lastCountMark === -3 && left > 1) {
      cues.push({ kind: 'tone', pattern: 'countdown' });
      s.lastCountMark = -2;
    } else if (left <= 1 && s.lastCountMark === -2 && left > 0) {
      cues.push({ kind: 'tone', pattern: 'countdown' });
      s.lastCountMark = -1;
    }
    if (elapsed >= cfg.betweenStepsSec) {
      const prevTarget = cfg.protocol.steps[s.stepIndex]?.target ?? null;
      const next = startStep(cfg, s, s.stepIndex + 1, now, cues);
      // Önceki hedefte hâlâ mıyız? Değilsek ayrılma anını hemen işaretle.
      if (prevTarget && pose && !targetSatisfiedLoose(pose, prevTarget)) next.leftPreviousAt = now;
      return { state: next, cues };
    }
    return { state: s, cues };
  }

  const step = currentStep(cfg, s);
  if (!step) return { state: s, cues };

  // Baş dönmesi süresi güvenlik kontrolü. Hasta modunda sınırı tanımlanmamış gözlem adımlarına da (ör. Dix-Hallpike
  // sonrası oturma) aynı üst sınır uygulanır: "geçti" işareti unutulursa akış sonsuza dek beklemesin.
  const vertigoLimit = vertigoLimitFor(cfg, step);
  if (s.vertigoActive && s.vertigoSince !== null) {
    const vSec = sec(now - s.vertigoSince);
    if (vertigoLimit !== null && vSec > vertigoLimit) {
      if (cfg.mode === 'patient') {
        cues.push({ kind: 'haptic', pattern: 'alarm' });
        cues.push({ kind: 'tone', pattern: 'alarm' });
        cues.push({
          kind: 'speak',
          text: 'Baş dönmesi beklenenden uzun sürdü. Manevrayı burada bırakıyoruz. Yavaşça oturun ve dinlenin.',
          priority: 'high'
        });
        const st = updateRecord(s, (r) => ({ ...r, endedAt: now, holdSec: s.holdSec }));
        return { state: { ...st, phase: 'safetyStop', phaseSince: now, stopReason: 'VERTIGO_TOO_LONG' }, cues };
      }
      if (!s.vertigoLongWarned) {
        cues.push({ kind: 'speak', text: 'Uyarı: belirti iki dakikayı aştı. Atipik yanıt olabilir.', priority: 'high' });
        s.vertigoLongWarned = true;
        s.notice = 'Belirti uzun sürüyor (atipik olabilir).';
      }
    }
    // Hasta "geçti" dokunuşunu unutmasın: her 30 saniyede bir hatırlat (durdurma kuralı aynen kalır).
    if (cfg.mode === 'patient') {
      const mark = Math.floor(vSec / VERTIGO_REMIND_EVERY_SEC) * VERTIGO_REMIND_EVERY_SEC;
      if (mark > 0 && mark > s.vertigoRemindMark && (vertigoLimit === null || mark < vertigoLimit)) {
        s.vertigoRemindMark = mark;
        cues.push({ kind: 'haptic', pattern: 'markOn' });
        cues.push({ kind: 'speak', text: 'Baş dönmesi geçtiyse ekrana dokunun. Sürüyorsa böyle kalın.', priority: 'normal' });
      }
    }
  }

  // Sensör verisi
  const stale = s.lastPoseAt === null || sec(now - s.lastPoseAt) > cfg.staleSensorSec;
  const ev = pose && !stale ? evaluate(pose, step.target) : null;
  s.evaluation = ev;

  // Hızlı geçiş ölçümü: önceki hedeften ayrılma anı
  if (s.leftPreviousAt === null && pose && s.stepIndex > 0 && (s.phase === 'intro' || s.phase === 'seeking')) {
    const prev = cfg.protocol.steps[s.stepIndex - 1];
    if (prev && !targetSatisfiedLoose(pose, prev.target)) s.leftPreviousAt = now;
  }

  if (s.phase === 'intro') {
    // Yönerge söylenirken de hedef değerlendirilir; kullanıcı hemen hareket edebilir.
    s.phase = 'seeking';
    s.phaseSince = now;
  }

  if (s.manualStep) {
    // Elle onaylanan adım: yalnızca sayaç.
    return holdingTick(cfg, s, step, now, dt, null, cues);
  }

  if (s.phase === 'seeking' || s.phase === 'settling') {
    if (ev && ev.inRange) {
      if (s.settlingSince === null) {
        s.settlingSince = now;
        s.phase = 'settling';
      }
      const settlingSince: number = s.settlingSince;
      if (s.records[s.records.length - 1]?.firstInRangeAt === null) {
        s = updateRecord(s, (r) => ({ ...r, firstInRangeAt: now }));
      }
      const introDone = sec(now - s.stepStartedAt) >= introSec(cfg, step);
      if (introDone && sec(now - settlingSince) >= cfg.confirmSec) {
        s.phase = 'holding';
        s.phaseSince = now;
        s.outOfRangeSince = null;
        cues.push({ kind: 'haptic', pattern: 'reached' });
        cues.push({ kind: 'tone', pattern: 'reached' });
        cues.push({
          kind: 'speak',
          text: cfg.mode === 'patient' ? 'Tamam, böyle kalın.' : 'Pozisyon doğru.',
          priority: 'high'
        });
        const transition =
          step.fastTransitionSec !== undefined && s.leftPreviousAt !== null ? sec(settlingSince - s.leftPreviousAt) : null;
        s = updateRecord(s, (r) => ({ ...r, reachedAt: r.reachedAt ?? now, transitionSec: transition }));
        if (transition !== null && step.fastTransitionSec !== undefined && transition > step.fastTransitionSec) {
          s.notice = `Geçiş ${transition.toFixed(1)} saniye sürdü (hedef ${step.fastTransitionSec} sn altı). Bir dahaki sefere daha hızlı geçin.`;
        }
      }
    } else {
      s.settlingSince = null;
      s.phase = 'seeking';
      const sinceStart = sec(now - s.stepStartedAt);
      const sinceHint = s.lastHintAt === null ? Infinity : sec(now - s.lastHintAt);
      if (sinceStart >= introSec(cfg, step) + cfg.firstHintDelaySec && sinceHint >= cfg.hintEverySec) {
        if (ev && ev.hint) {
          cues.push({ kind: 'speak', text: hintText(cfg, ev.hint), priority: 'normal' });
          s.lastHintAt = now;
        } else if (!ev && cfg.mode === 'patient') {
          cues.push({
            kind: 'speak',
            text: 'Sensörden veri alınamıyor. Telefonu alnınıza yaslı tutun.',
            priority: 'normal'
          });
          s.lastHintAt = now;
        }
      }
    }
    return { state: s, cues };
  }

  if (s.phase === 'holding' || s.phase === 'drifting') {
    return holdingTick(cfg, s, step, now, dt, ev, cues);
  }

  return { state: s, cues };
}

function holdingTick(
  cfg: RunnerConfig,
  s0: RunnerState,
  step: StepDef,
  now: number,
  dt: number,
  ev: Evaluation | null,
  cues: Cue[]
): StepResult {
  let s = { ...s0 };
  const inRange = s.manualStep || (ev?.inRange ?? false);

  if (inRange) {
    if (s.phase === 'drifting') {
      cues.push({ kind: 'speak', text: cfg.mode === 'patient' ? 'Tamam, böyle kalın.' : 'Pozisyon düzeldi.', priority: 'normal' });
      s.phase = 'holding';
      s.notice = null;
    }
    s.outOfRangeSince = null;
    s.holdSec += dt;
  } else {
    if (s.outOfRangeSince === null) s.outOfRangeSince = now;
    const outSec = sec(now - s.outOfRangeSince);
    if (outSec <= cfg.driftGraceSec && s.phase === 'holding') {
      s.holdSec += dt; // kısa taşma: sayaç devam
    } else {
      if (s.phase !== 'drifting') {
        s.phase = 'drifting';
        s = updateRecord(s, (r) => ({ ...r, driftCount: r.driftCount + 1 }));
        cues.push({ kind: 'haptic', pattern: 'drift' });
        cues.push({ kind: 'tone', pattern: 'drift' });
        const hint = ev?.hint ? hintText(cfg, ev.hint) : '';
        cues.push({
          kind: 'speak',
          text: cfg.mode === 'patient' ? `Pozisyonu koruyun. ${hint}`.trim() : `Pozisyon bozuldu. ${hint}`.trim(),
          priority: 'high'
        });
        s.lastHintAt = now;
      } else {
        const sinceHint = s.lastHintAt === null ? Infinity : sec(now - s.lastHintAt);
        if (sinceHint >= cfg.hintEverySec && ev?.hint) {
          cues.push({ kind: 'haptic', pattern: 'drift' });
          cues.push({ kind: 'speak', text: hintText(cfg, ev.hint), priority: 'normal' });
          s.lastHintAt = now;
        } else if (sinceHint >= cfg.hintEverySec && !ev && !s.manualStep) {
          cues.push({
            kind: 'speak',
            text:
              cfg.mode === 'patient'
                ? 'Sensörden veri alınamıyor. Telefonu alnınıza yaslı tutun.'
                : 'Sensör verisi yok; elle onaylayabilirsiniz.',
            priority: 'normal'
          });
          s.lastHintAt = now;
        }
      }
    }
  }

  // İstatistik
  if (ev) {
    s = updateRecord(s, (r) => {
      const absTheta = ev.thetaErr !== null ? Math.abs(ev.thetaErr) : null;
      return {
        ...r,
        samples: r.samples + 1,
        inRangeSamples: r.inRangeSamples + (ev.inRange ? 1 : 0),
        sumAbsThetaErr: r.sumAbsThetaErr + (absTheta ?? 0),
        thetaSamples: r.thetaSamples + (absTheta !== null ? 1 : 0),
        maxAbsThetaErr: absTheta !== null ? Math.max(r.maxAbsThetaErr, absTheta) : r.maxAbsThetaErr
      };
    });
  }

  // Sesli sayım
  const mark = Math.floor(s.holdSec / cfg.countEverySec) * cfg.countEverySec;
  if (mark > 0 && mark > s.lastCountMark && s.holdSec < step.minHoldSec) {
    s.lastCountMark = mark;
    const left = Math.max(0, Math.round(step.minHoldSec - s.holdSec));
    cues.push({
      kind: 'speak',
      text: left > 0 ? `${left} saniye kaldı.` : `${mark} saniye.`,
      priority: 'normal'
    });
  }

  // En az süre doldu ama baş dönmesi sürüyor
  if (s.holdSec >= step.minHoldSec && s.vertigoActive && !s.waitingVertigoAnnounced) {
    s.waitingVertigoAnnounced = true;
    cues.push({ kind: 'haptic', pattern: 'markOn' });
    cues.push({
      kind: 'speak',
      text:
        cfg.mode === 'patient'
          ? 'Süre doldu ama baş dönmesi sürüyor. Geçince ekrana dokunun.'
          : 'Süre doldu; belirti sürüyor. Bitişi işaretleyin.',
      priority: 'normal'
    });
  }

  if (s.phase === 'holding' && holdComplete(s, step, now)) {
    return { state: finishStep(cfg, s, now, cues), cues };
  }
  return { state: s, cues };
}

/** Kayıt özetleri. */
export function recordStats(r: StepRecord) {
  return {
    inRangePct: r.samples > 0 ? Math.round((100 * r.inRangeSamples) / r.samples) : null,
    meanAbsThetaErr: r.thetaSamples > 0 ? Math.round((10 * r.sumAbsThetaErr) / r.thetaSamples) / 10 : null,
    maxAbsThetaErr: r.thetaSamples > 0 ? Math.round(10 * r.maxAbsThetaErr) / 10 : null
  };
}

/**
 * Bir adımdaki baş dönmesi işaretlerinin özeti (s).
 * Gecikme: pozisyona girişten ilk işarete. Süre: ilk başlangıçtan SON bitişe kadar olan toplam yayılım
 * (iki dalga ya da yeniden işaretleme olursa uzun süre gizlenmez). Bitişi işaretlenmemiş bir işaret varsa süre bilinmez (null).
 */
export function vertigoSummary(r: StepRecord): { latencySec: number; durationSec: number | null } | null {
  const marks = r.vertigoMarks;
  const first = marks[0];
  if (!first) return null;
  const ref = r.firstInRangeAt ?? r.reachedAt;
  const reachedRel = ref !== null ? sec(ref - r.startedAt) : 0;
  const latencySec = Math.max(0, Math.round(first.start - reachedRel));
  const open = marks.some((m) => m.end === null);
  const lastEnd = Math.max(...marks.map((m) => m.end ?? -Infinity));
  const durationSec = open ? null : Math.max(0, Math.round(lastEnd - first.start));
  return { latencySec, durationSec };
}
