/**
 * Manevra/test yürütücüsü — saf durum makinesi.
 *
 * Arayüzden bağımsızdır: zaman `now` (ms) olarak olaylarla gelir; çıktı yeni durum + "ipuçları" (konuşma,
 * titreşim, ton) listesidir. Bu sayede gerçek zamanlı akış birim testlerinde hızlandırılmış olarak denenebilir.
 *
 * Adım yaşam döngüsü:
 *   intro (yönerge okunur) → seeking (hedef aranır) → settling (hedefte 1 s doğrulama) → holding (sayaç)
 *   → [hedef dışına çıkılırsa: drifting, sayaç durur] → stepDone → sonraki adımın introsu … → done
 *
 * Hasta modunda hedefe ~60 s gelinemezse (boyun kısıtlı vb.) adım durur, kayda "pozisyona gelinemedi" yazılır ve
 * hekime yönlendirilir (safetyStop / POSITION_UNREACHABLE). Hedef ASLA gevşetilmez; yalnız tutma sırasında sarkma
 * sınırında birkaç derecelik histerezis vardır (bkz. HOLD_HYSTERESIS_DEG).
 */
import type { HeadPose } from './geometry';
import {
  evaluate,
  type Evaluation,
  HINT_TEXT_CLINICIAN,
  HINT_TEXT_HELPER,
  HINT_TEXT_PATIENT,
  HOLD_HYSTERESIS_DEG,
  type HintKey
} from './evaluator';
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
  /**
   * Sensörsüz hasta modu: açı ölçülmez. Hasta ekranı göremediği ve ekrana dokunuş baş dönmesi işareti olduğu için pozisyon
   * yönerge bittikten sonra sabit bir yerleşme süresiyle kendiliğinden "tamam" sayılır.
   */
  sensorless?: boolean;
  /**
   * Yönergenin gerçek bitişi beklenir: arayüz konuşma bitince `introSpoken` olayı gönderir. Giriş, tahminin %60'ı ile
   * gerçek bitişin geç olanında biter; olay hiç gelmezse tahmin×2+3 s üst sınırdır. Kapalıyken (testler, simülasyon)
   * yalnız tahmin kullanılır ve akış belirlenimci kalır.
   */
  awaitSpeechEnd?: boolean;
  /** Hasta modunda manevrayı yakını yaptırıyor: sesli yönergeler yardımcıya ("hastanın sağı/solu"). */
  helper?: boolean;
}

/** Sensörsüz hasta modunda yönergeden sonra pozisyona geçmek için tanınan süre (s). */
export const SENSORLESS_SETTLE_SEC = 10;
/** Hasta modunda ilk sesli düzeltme ipucu: yönerge bittikten bu kadar sonra (s). Hasta ekranı göremez (k10, tur 1). */
export const PATIENT_FIRST_HINT_DELAY_SEC = 3;
/** Bu kadar zorlama ipucundan (sarkma/dönüş) sonra "Daha fazla zorlamayın" denir. */
export const STRAIN_AFTER_HINTS = 2;
/** Yatarak doğru duruşta ama hedef açılara bu süre (s) gelinemezse adım durur ve hekime yönlendirilir (hasta modu). */
export const UNREACHABLE_SEC = 60;
/** Sarkma bu açının altında kalırsa (°) yastık yanlış yerde olabilir: yastık ipucu bir kez verilir. */
export const PILLOW_PHI_DEG = 5;
/** Hızlı geçiş adımında yönergeden sonra "Üç, iki, bir, şimdi!" sayımı (s). */
export const GO_COUNT_SEC = 3;

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

export type StopReason = 'VERTIGO_TOO_LONG' | 'POSITION_UNREACHABLE' | 'USER_ABORT' | 'USER_FEELS_UNWELL' | 'INTERRUPTED';

/** Durma nedenlerinin kısa Türkçe karşılığı (geçmiş, rapor). */
export const STOP_REASON_TEXT: Record<StopReason, string> = {
  VERTIGO_TOO_LONG: 'durduruldu: baş dönmesi 2 dakikadan uzun sürdü',
  POSITION_UNREACHABLE: 'durduruldu: pozisyona gelinemedi',
  USER_ABORT: 'yarıda bırakıldı',
  USER_FEELS_UNWELL: 'durduruldu: kendini iyi hissetmedi',
  INTERRUPTED: 'kesildi: uygulamadan çıkıldı'
};

/** Güvenlik durdurması bitiş ekranı metinleri (hasta modu). Durdurma kuralları ve yönlendirme kilidi aynen kalır. */
export const SAFETY_STOP_TEXT: Record<'VERTIGO_TOO_LONG' | 'POSITION_UNREACHABLE', string> = {
  VERTIGO_TOO_LONG:
    'Baş dönmeniz 2 dakikadan uzun sürdü ya da geçtiği işaretlenmedi. Bu, tipik arka kanal BPPV\'ye uymuyor. Lütfen hekiminize ya da odyoloğunuza başvurun. Konuşma bozukluğu, güçsüzlük ya da çift görme olursa hemen 112\'yi arayın.',
  POSITION_UNREACHABLE:
    'Manevranın bir pozisyonuna gelinemedi (ör. baş yeterince geriye sarkamadı ya da çevrilemedi). Zorlayarak yeniden denemeyin. Hekiminize ya da odyoloğunuza başvurun; boyun ya da bel hareketiniz kısıtlıysa manevranın değiştirilmiş biçimini ya da kendi gözetiminde yapılmasını önerebilir.'
};

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
  /** Hızlı geçiş adımında geçiş hedeften uzun sürdü (hastaya da söylendi). */
  slowTransition?: boolean;
  /** Bu adımın pozisyonuna gelinemedi (adım durdu, hekime yönlendirildi). */
  unreachable?: boolean;
  /** Klinisyen adımı en az süre dolmadan bitirdi ("erken bitirildi"; holdSec / minHoldSec raporda gösterilebilir). */
  endedEarly?: boolean;
  /** Bu adımda kaç kez duraklatıldı. */
  pauses?: number;
  /** Yatar adımlarda bekleme boyunca sarkma (φ) toplamı, en küçüğü ve örnek sayısı. */
  sumPhi?: number;
  minPhi?: number | null;
  phiSamples?: number;
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
  /** Adım yönergesinin gerçekten söylenip bittiği an (ms; `introSpoken` olayı). */
  introSpokenAt: number | null;
  /** Bu adımda verilen zorlama (sarkma/dönüş) ipucu sayısı. */
  pushHints: number;
  /** "Daha fazla zorlamayın" söylendi mi? */
  strainWarned: boolean;
  /** Yastık ipucu söylendi mi? */
  pillowSaid: boolean;
  /** Yatar duruşta hedef açıların dışında kalınan sürenin başlangıcı (pozisyona gelinemedi ölçümü). */
  unreachSince: number | null;
  /** Hızlı geçiş sayımında söylenen son sözcük (0 = yok, 1 = "Üç" … 4 = "Şimdi"). */
  goCount: number;
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
  | { type: 'shock'; now: number }
  /** Adım yönergesinin konuşması gerçekten bitti (arayüz, `speech.speak` bitiş geri çağrısından). */
  | { type: 'introSpoken'; now: number; stepIndex: number };

export type Cue =
  /** `tag: 'stepIntro'`: adım yönergesi; arayüz bitişini `introSpoken` olayıyla bildirir. */
  | { kind: 'speak'; text: string; priority: 'high' | 'normal'; tag?: 'stepIntro'; stepIndex?: number }
  | { kind: 'haptic'; pattern: 'reached' | 'drift' | 'stepDone' | 'done' | 'alarm' | 'tap' | 'move' | 'markOn' | 'markOff' | 'pause' }
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
    notice: null,
    introSpokenAt: null,
    pushHints: 0,
    strainWarned: false,
    pillowSaid: false,
    unreachSince: null,
    goCount: 0
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
    driftCount: 0,
    pauses: 0,
    sumPhi: 0,
    minPhi: null,
    phiSamples: 0
  };
}

// --- Söz seçimi ---------------------------------------------------------------------------------
/** Kime konuşuluyor: hasta, yardımcı (hasta modunda yakını) ya da klinisyen. */
type Voice = 'patient' | 'helper' | 'clinician';
function voice(cfg: RunnerConfig): Voice {
  if (cfg.mode === 'clinician') return 'clinician';
  return cfg.helper ? 'helper' : 'patient';
}
const pick = (cfg: RunnerConfig, t: Record<Voice, string>): string => t[voice(cfg)];

const TXT = {
  stopped: {
    patient: 'Durduruldu. Yavaşça oturun ve dinlenin.',
    helper: 'Durduruldu. Hastayı yavaşça oturtun ve dinlenmesini sağlayın.',
    clinician: 'Durduruldu.'
  },
  reached: { patient: 'Tamam, böyle kalın.', helper: 'Tamam, böyle tutun.', clinician: 'Pozisyon doğru.' },
  reachedManual: { patient: 'Tamam, böyle kalın.', helper: 'Tamam, böyle tutun.', clinician: 'Pozisyon elle onaylandı.' },
  recovered: { patient: 'Tamam, böyle kalın.', helper: 'Tamam, böyle tutun.', clinician: 'Pozisyon düzeldi.' },
  shock: {
    patient: 'Telefon yerinden oynadı. Telefonu alnınıza geri yaslayın.',
    helper: 'Telefon yerinden oynadı. Telefonu hastanın alnına geri yaslayın.',
    clinician: 'Telefon yerinden oynadı; alına geri yerleştirin.'
  },
  markOn: {
    patient: 'Baş dönmesi işaretlendi. Gözlerinizi açık tutmaya çalışın ve pozisyonu bozmayın. Geçince ekrana tekrar dokunun.',
    helper: 'Baş dönmesi işaretlendi. Hasta gözlerini açık tutmaya çalışsın; pozisyonu bozmayın. Hasta "geçti" deyince ekrana tekrar dokunun.',
    clinician: 'Başlangıç işaretlendi.'
  },
  noSensor: {
    patient: 'Sensörden veri alınamıyor. Telefonu alnınıza yaslı tutun.',
    helper: 'Sensörden veri alınamıyor. Telefonu hastanın alnına yaslı tutun.',
    clinician: 'Sensör verisi yok; elle onaylayabilirsiniz.'
  },
  vertigoTooLong: {
    patient: 'Baş dönmesi beklenenden uzun sürdü. Manevrayı burada bırakıyoruz. Yavaşça oturun ve dinlenin.',
    helper: 'Baş dönmesi beklenenden uzun sürdü. Manevrayı burada bırakıyoruz. Hastayı yavaşça oturtun ve dinlendirin.',
    clinician: 'Uyarı: belirti iki dakikayı aştı. Atipik yanıt olabilir.'
  },
  waitingVertigo: {
    patient: 'Süre doldu ama baş dönmesi sürüyor. Geçince ekrana dokunun.',
    helper: 'Süre doldu ama baş dönmesi sürüyor. Hasta "geçti" deyince ekrana dokunun.',
    clinician: 'Süre doldu; belirti sürüyor. Bitişi işaretleyin.'
  },
  strain: {
    patient:
      'Daha fazla zorlamayın. Boynunuz ağrıyorsa ya da daha fazla gidemiyorsanız öyle kalın; bu pozisyona gelinemezse birazdan durduracağım. Duraklatmak için ekrana iki saniye basılı tutun.',
    helper:
      'Daha fazla zorlamayın. Hastanın boynu ağrıyorsa ya da baş daha fazla gitmiyorsa öyle tutun; bu pozisyona gelinemezse birazdan durduracağım. Duraklatmak için ekrana iki saniye basılı tutun.',
    clinician: ''
  },
  pillow: {
    patient: 'Yastık başınızın altında olabilir. Biraz yukarı kayın; yastık omuzlarınızın altına gelsin, başınız yastıktan geriye sarksın.',
    helper: 'Yastık hastanın başının altında olabilir. Hastayı biraz yukarı kaydırın; yastık omuzlarının altına gelsin, baş yastıktan geriye sarksın.',
    clinician: ''
  },
  unreachable: {
    patient: 'Bu pozisyona gelinemedi. Daha fazla zorlamayın; burada bırakıyoruz. Yavaşça oturun. Tekrar denemeden önce hekiminize danışın.',
    helper: 'Bu pozisyona gelinemedi. Daha fazla zorlamayın; burada bırakıyoruz. Hastayı yavaşça oturtun. Tekrar denemeden önce hekime danışın.',
    clinician: 'Pozisyona gelinemedi; durduruldu.'
  }
} as const;

function introSec(cfg: RunnerConfig, step: StepDef): number {
  return cfg.introSecFor(stepSpeech(cfg, step));
}

/**
 * Yönerge evresinin bitişi (adım başından saniye). Gerçek bitiş bekleniyorsa: tahminin %60'ı ile gerçek bitişin geç olanı;
 * bitiş olayı gelmediyse tahmin×2+3 s (üst sınır).
 */
export function introEndSec(cfg: RunnerConfig, s: RunnerState, step: StepDef): number {
  const est = introSec(cfg, step);
  if (!cfg.awaitSpeechEnd) return est;
  const cap = est * 2 + 3;
  if (s.introSpokenAt === null) return cap;
  return Math.min(cap, Math.max(est * 0.6, sec(s.introSpokenAt - s.stepStartedAt)));
}

/** Hasta modunda hızlı geçiş adımı: yönergeden sonra "Üç, iki, bir, şimdi!" sayılır. */
function hasGoCount(cfg: RunnerConfig, step: StepDef): boolean {
  return cfg.mode === 'patient' && step.fastTransitionSec !== undefined;
}

/** Pozisyonun "tamam" sayılabileceği en erken an (adım başından saniye): yönerge (+ varsa sayım) bitmiş olmalı. */
function readySec(cfg: RunnerConfig, s: RunnerState, step: StepDef): number {
  return introEndSec(cfg, s, step) + (hasGoCount(cfg, step) ? GO_COUNT_SEC : 0);
}

function hintText(cfg: RunnerConfig, key: HintKey): string {
  const v = voice(cfg);
  return v === 'clinician' ? HINT_TEXT_CLINICIAN[key] : v === 'helper' ? HINT_TEXT_HELPER[key] : HINT_TEXT_PATIENT[key];
}

/** Adım yönergesi: hastaya, yardımcıya (varsa yardımcı metni) ya da klinisyene. */
export function stepSpeech(cfg: RunnerConfig, step: StepDef): string {
  if (cfg.mode !== 'patient') return step.clinician;
  return cfg.helper && step.helperSay ? step.helperSay : step.say;
}

/** Pozisyon doğrulanınca söylenen söz. Doğrulanamayan (otururken baş çevirme) adımda dürüst cümle. */
function reachedText(cfg: RunnerConfig, step: StepDef, manual: boolean): string {
  if (cfg.mode === 'patient' && step.unverifiable && step.reachedSay) {
    return cfg.helper && step.helperReachedSay ? step.helperReachedSay : step.reachedSay;
  }
  return pick(cfg, manual ? TXT.reachedManual : TXT.reached);
}

/** "Başınızı …" → "başınızı …" (ön ek için). */
const lowerFirst = (t: string) => (t.length ? t.charAt(0).toLocaleLowerCase('tr-TR') + t.slice(1) : t);

/** Zorlama ipucu mu (boyun yükü): daha fazla sarkma ve baş dönüşü. */
const isPushHint = (h: HintKey | null) =>
  h === 'HANG_MORE' || h === 'TURN_RIGHT' || h === 'TURN_LEFT' || h === 'TURN_BODY_RIGHT' || h === 'TURN_BODY_LEFT';

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

/** Adımın bitmesine kalan süre (s); baş dönmesi sürerken bilinmez (null). */
export function remainingHoldSec(s: RunnerState, step: StepDef, now: number): number | null {
  if (s.vertigoActive) return null;
  const afterEnd = s.vertigoEndedAt !== null ? step.afterVertigoSec - sec(now - s.vertigoEndedAt) : 0;
  return Math.max(0, step.minHoldSec - s.holdSec, afterEnd);
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
  // Hızlı geçiş adımında hareket "şimdi" komutuyladır; adım başında "hareket et" verilmez.
  if (index > 0 && !hasGoCount(cfg, step)) {
    cues.push({ kind: 'haptic', pattern: 'move' });
    cues.push({ kind: 'tone', pattern: 'move' });
  }
  cues.push({ kind: 'speak', text: stepSpeech(cfg, step), priority: 'high', tag: 'stepIntro', stepIndex: index });
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
    introSpokenAt: null,
    pushHints: 0,
    strainWarned: false,
    pillowSaid: false,
    unreachSince: null,
    goCount: 0,
    records: [...s.records, newRecord(step, now)]
  };
}

function finishStep(cfg: RunnerConfig, s: RunnerState, now: number, cues: Cue[]): RunnerState {
  let next = updateRecord(s, (r) => ({ ...r, endedAt: now, holdSec: s.holdSec }));
  const isLast = s.stepIndex >= cfg.protocol.steps.length - 1;
  if (isLast) {
    // Manevra/test bitişinin kendi titreşimi var (adım bitişiyle karışmasın).
    cues.push({ kind: 'haptic', pattern: 'done' });
    cues.push({ kind: 'tone', pattern: 'done' });
    cues.push({
      kind: 'speak',
      text:
        cfg.protocol.kind === 'maneuver'
          ? // Dinlenme önerisi bitiş ekranında okunur; burada tekrarlanmaz.
            'Manevra tamamlandı.'
          : 'Test tamamlandı.',
      priority: 'high'
    });
    return { ...next, phase: 'done', phaseSince: now, evaluation: null };
  }
  cues.push({ kind: 'haptic', pattern: 'stepDone' });
  cues.push({ kind: 'tone', pattern: 'stepDone' });
  cues.push({
    kind: 'speak',
    // Kısa: adımlar arası 4 s içinde biter, sıradaki yönergeyle kesilmez.
    text: cfg.mode === 'patient' ? 'Bu adım tamam.' : 'Adım tamam. Sıradaki adım.',
    priority: 'high'
  });
  next = { ...next, phase: 'between', phaseSince: now };
  return next;
}

/**
 * Pozisyona gelinemedi: adım durur, kayda yazılır, hekime yönlendirilir. Hedef gevşetilmez; hasta zorlanmaz.
 * (Otomatik: hasta modunda ~60 s; elle: duraklatma ekranındaki "Pozisyona gelemiyorum / boynum ağrıyor".)
 */
function unreachableStop(cfg: RunnerConfig, s: RunnerState, now: number, cues: Cue[]): StepResult {
  cues.push({ kind: 'haptic', pattern: 'alarm' });
  cues.push({ kind: 'tone', pattern: 'alarm' });
  cues.push({ kind: 'speak', text: pick(cfg, TXT.unreachable), priority: 'high' });
  const st = updateRecord(s, (r) => ({ ...r, endedAt: r.endedAt ?? now, holdSec: s.holdSec, unreachable: true }));
  return {
    state: { ...st, phase: 'safetyStop', phaseSince: now, stopReason: 'POSITION_UNREACHABLE', notice: 'Pozisyona gelinemedi.' },
    cues
  };
}

function targetSatisfiedLoose(pose: HeadPose, target: Target): boolean {
  // Hızlı geçiş ölçümü için önceki hedefin geniş (±25°) bölgesinde mi?
  const e = evaluate(pose, target);
  return e.postureOk && e.errorDeg <= 25;
}

/** Baş dönmesi dokunuşları arasında en az süre (s). */
export const VERTIGO_DEBOUNCE_SEC = 1;
/** Baş dönmesi işaretliyken ilk "geçtiyse dokunun" hatırlatması (s; hasta modu). Kazara dokunuş erken fark edilsin. */
export const VERTIGO_FIRST_REMIND_SEC = 15;
/** Sonraki hatırlatmaların aralığı (s). */
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

    case 'introSpoken': {
      // Geç gelen (önceki adımın) bitiş olayı yok sayılır.
      if (ev.stepIndex !== s.stepIndex || s.introSpokenAt !== null || s.phase === 'idle' || s.phase === 'between') {
        return { state: s, cues };
      }
      return { state: { ...s, introSpokenAt: now }, cues };
    }

    case 'abort': {
      // "Pozisyona gelemiyorum / boynum ağrıyor": yarıda bırakma değil, yönlendirmeli durdurma.
      if (ev.reason === 'POSITION_UNREACHABLE') {
        if (s.phase === 'idle') return { state: s, cues };
        return unreachableStop(cfg, s, now, cues);
      }
      cues.push({ kind: 'haptic', pattern: 'alarm' });
      cues.push({ kind: 'speak', text: pick(cfg, TXT.stopped), priority: 'high' });
      const st = updateRecord(s, (r) => ({ ...r, endedAt: r.endedAt ?? now, holdSec: s.holdSec }));
      return { state: { ...st, phase: 'aborted', phaseSince: now, stopReason: ev.reason }, cues };
    }

    case 'pause': {
      if (s.phase === 'paused' || s.phase === 'idle') return { state: s, cues };
      cues.push({ kind: 'haptic', pattern: 'pause' });
      cues.push({ kind: 'tone', pattern: 'pause' });
      // Hasta ekranı göremez: devam yolu sesle söylenir (ekrana basılı tutmak); tek dokunuş baş dönmesi bitişidir.
      const vNote = s.vertigoActive ? ' Baş dönmesi geçtiyse ekrana bir kez dokunun.' : '';
      cues.push({
        kind: 'speak',
        text:
          cfg.mode === 'patient'
            ? `Duraklatıldı. ${cfg.helper ? 'Hasta olduğu yerde kalsın.' : 'Olduğunuz yerde kalın.'}${vNote} Devam etmek için ekrana iki saniye basılı tutun.`
            : 'Duraklatıldı.',
        priority: 'high'
      });
      const st = updateRecord(s, (r) => ({ ...r, pauses: (r.pauses ?? 0) + 1 }));
      return { state: { ...st, phase: 'paused', pausedFrom: s.phase, phaseSince: now }, cues };
    }

    case 'resume': {
      if (s.phase !== 'paused') return { state: s, cues };
      const back = s.pausedFrom ?? 'seeking';
      // Bekleme sırasında duraklatıldıysa, sensörle tekrar doğrulamak için arama fazına dön.
      // Elle onaylanmış adımda sensör doğrulaması yoktur → doğrudan beklemeye dön.
      const wasHolding = back === 'holding' || back === 'drifting' || back === 'settling';
      const phase: Phase = wasHolding ? (s.manualStep ? 'holding' : 'seeking') : back;
      cues.push({ kind: 'speak', text: 'Devam ediyoruz.', priority: 'high' });
      // Duraklatmada geçen süre baş dönmesi süre sınırına sayılmaz (devamda yanlış güvenlik durdurması olmasın).
      const pausedMs = Math.max(0, now - s.phaseSince);
      const vertigoSince = s.vertigoActive && s.vertigoSince !== null ? s.vertigoSince + pausedMs : s.vertigoSince;
      // Adım saati de kaydırılır: baş dönmesi işaretlerinin süresi (kayıt ve ≥1 dk kuralı) duraklatmayı içermesin.
      const stepStartedAt = s.stepStartedAt + pausedMs;
      const introSpokenAt = s.introSpokenAt !== null ? s.introSpokenAt + pausedMs : null;
      return {
        state: {
          ...s,
          phase,
          pausedFrom: null,
          phaseSince: now,
          settlingSince: null,
          outOfRangeSince: null,
          lastTickAt: now,
          vertigoSince,
          stepStartedAt,
          introSpokenAt,
          // "Pozisyona gelinemedi" süresi duraklatmadan sonra baştan ölçülür.
          unreachSince: null
        },
        cues
      };
    }

    case 'skipStep': {
      if (cfg.mode !== 'clinician') return { state: s, cues };
      if (s.phase === 'idle' || s.phase === 'paused') return { state: s, cues };
      if (s.phase === 'between') {
        return { state: startStep(cfg, s, s.stepIndex + 1, now, cues), cues };
      }
      const step = currentStep(cfg, s);
      // En az süre dolmadan bitirilen adım raporda "erken bitirildi" görünür (manevra yine tamamlandı sayılır).
      const early = !!step && s.holdSec < step.minHoldSec;
      const st = early ? updateRecord(s, (r) => ({ ...r, endedEarly: true })) : s;
      return { state: finishStep(cfg, { ...st, vertigoActive: false }, now, cues), cues };
    }

    case 'manualConfirm': {
      if (s.phase !== 'intro' && s.phase !== 'seeking' && s.phase !== 'settling' && s.phase !== 'drifting') {
        return { state: s, cues };
      }
      const step = currentStep(cfg, s);
      const honest = cfg.mode === 'patient' && !!step?.unverifiable;
      // Doğrulanamayan adımda "doğru" titreşimi verilmez (hasta doğru yaptığını sanmasın).
      if (!honest) {
        cues.push({ kind: 'haptic', pattern: 'reached' });
        cues.push({ kind: 'tone', pattern: 'reached' });
      }
      cues.push({ kind: 'speak', text: step ? reachedText(cfg, step, true) : pick(cfg, TXT.reachedManual), priority: 'high' });
      const st = updateRecord(s, (r) => ({ ...r, manual: true, reachedAt: r.reachedAt ?? now }));
      return {
        state: { ...st, phase: 'holding', phaseSince: now, manualStep: true, outOfRangeSince: null, lastTickAt: now },
        cues
      };
    }

    case 'shock': {
      if (s.phase !== 'holding' || s.manualStep) return { state: s, cues };
      cues.push({ kind: 'haptic', pattern: 'drift' });
      cues.push({ kind: 'speak', text: pick(cfg, TXT.shock), priority: 'high' });
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
        cues.push({ kind: 'speak', text: pick(cfg, TXT.markOn), priority: 'normal' });
        const st = updateRecord(s, (r) => ({ ...r, vertigoMarks: [...r.vertigoMarks, { start: rel, end: null }] }));
        return { state: { ...st, vertigoActive: true, vertigoSince: now, vertigoLongWarned: false, vertigoRemindMark: 0 }, cues };
      }
      cues.push({ kind: 'haptic', pattern: 'markOff' });
      cues.push({ kind: 'tone', pattern: 'markOff' });
      const wait = Math.max(step.afterVertigoSec, Math.ceil(step.minHoldSec - s.holdSec));
      cues.push({
        kind: 'speak',
        text: pick(cfg, {
          patient: `Geçti olarak işaretlendi. ${wait} saniye daha bu pozisyonda bekleyin.`,
          helper: `Geçti olarak işaretlendi. ${wait} saniye daha bu pozisyonda tutun.`,
          clinician: 'Bitiş işaretlendi.'
        }),
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

/** Baş dönmesi hatırlatması: sonucu da söyler (dokunulmazsa ne olacağı). */
function vertigoReminderText(cfg: RunnerConfig, leftSec: number | null): string {
  const tail = leftSec !== null ? ` Dokunmazsanız ${leftSec} saniye sonra durdurup ${cfg.helper ? 'hekime' : 'sizi hekime'} yönlendireceğim.` : '';
  return cfg.helper
    ? `Hasta "geçti" derse ekrana dokunun; sürüyorsa böyle tutun.${tail}`
    : `Baş dönmesi geçtiyse ekrana dokunun; sürüyorsa böyle kalın.${tail}`;
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
        cues.push({ kind: 'speak', text: pick(cfg, TXT.vertigoTooLong), priority: 'high' });
        const st = updateRecord(s, (r) => ({ ...r, endedAt: now, holdSec: s.holdSec }));
        return { state: { ...st, phase: 'safetyStop', phaseSince: now, stopReason: 'VERTIGO_TOO_LONG' }, cues };
      }
      if (!s.vertigoLongWarned) {
        cues.push({ kind: 'speak', text: TXT.vertigoTooLong.clinician, priority: 'high' });
        s.vertigoLongWarned = true;
        s.notice = 'Belirti uzun sürüyor (atipik olabilir).';
      }
    }
    // Hasta "geçti" dokunuşunu unutmasın: ilk kez 15 s'de, sonra 30 s arayla, işaretin kendi titreşimiyle (kısa-kısa-uzun)
    // hatırlat ve sonucu söyle. Durdurma kuralı aynen kalır.
    if (cfg.mode === 'patient') {
      const next = s.vertigoRemindMark === 0 ? VERTIGO_FIRST_REMIND_SEC : s.vertigoRemindMark + VERTIGO_REMIND_EVERY_SEC;
      if (vSec >= next && (vertigoLimit === null || next < vertigoLimit)) {
        s.vertigoRemindMark = next;
        cues.push({ kind: 'haptic', pattern: 'markOn' });
        cues.push({ kind: 'tone', pattern: 'markOn' });
        cues.push({
          kind: 'speak',
          text: vertigoReminderText(cfg, vertigoLimit !== null ? Math.round(vertigoLimit - next) : null),
          priority: 'normal'
        });
      }
    }
  }

  const ready = readySec(cfg, s, step);
  const sinceStart = sec(now - s.stepStartedAt);

  // Hızlı geçiş adımı (Semont): yönergeden sonra "Üç, iki, bir, şimdi!" — hareket bu komutla yapılır.
  if (hasGoCount(cfg, step) && s.goCount < 4) {
    const introEnd = introEndSec(cfg, s, step);
    const due = sinceStart >= introEnd ? Math.min(4, Math.floor(sinceStart - introEnd) + 1) : 0;
    if (due > s.goCount) {
      s.goCount = due;
      if (due < 4) {
        cues.push({ kind: 'tone', pattern: 'countdown' });
        cues.push({ kind: 'speak', text: ['Üç.', 'İki.', 'Bir.'][due - 1]!, priority: 'high' });
      } else {
        cues.push({ kind: 'haptic', pattern: 'move' });
        cues.push({ kind: 'tone', pattern: 'move' });
        cues.push({ kind: 'speak', text: 'Şimdi!', priority: 'high' });
      }
    }
  }

  // Sensörsüz hasta modu: yönerge + yerleşme süresi dolunca pozisyon kendiliğinden onaylanır.
  if (cfg.sensorless && cfg.mode === 'patient' && (s.phase === 'intro' || s.phase === 'seeking')) {
    if (sinceStart >= ready + SENSORLESS_SETTLE_SEC) {
      const r = runnerStep(cfg, s, { type: 'manualConfirm', now });
      return { state: r.state, cues: [...cues, ...r.cues] };
    }
    return { state: s, cues };
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
    return holdingTick(cfg, s, step, now, dt, null, null, pose, cues);
  }

  if (s.phase === 'seeking' || s.phase === 'settling') {
    if (ev && ev.inRange) {
      s.unreachSince = null;
      if (s.settlingSince === null) {
        s.settlingSince = now;
        s.phase = 'settling';
      }
      const settlingSince: number = s.settlingSince;
      if (s.records[s.records.length - 1]?.firstInRangeAt === null) {
        s = updateRecord(s, (r) => ({ ...r, firstInRangeAt: now }));
      }
      if (sinceStart >= ready && sec(now - settlingSince) >= cfg.confirmSec) {
        s.phase = 'holding';
        s.phaseSince = now;
        s.outOfRangeSince = null;
        const transition =
          step.fastTransitionSec !== undefined && s.leftPreviousAt !== null ? sec(settlingSince - s.leftPreviousAt) : null;
        const slow = transition !== null && step.fastTransitionSec !== undefined && transition > step.fastTransitionSec;
        const honest = cfg.mode === 'patient' && !!step.unverifiable;
        // Doğrulanamayan adımda "doğru" titreşim/tonu verilmez; söz de dürüsttür (baş çevirme ölçülemez).
        if (!honest) {
          cues.push({ kind: 'haptic', pattern: 'reached' });
          cues.push({ kind: 'tone', pattern: 'reached' });
        }
        let text = reachedText(cfg, step, false);
        if (slow && cfg.mode === 'patient') {
          // Evde Semont'un ana hatası yavaş geçiş: hastaya da söylenir, kayda geçer (k10, tur 1).
          const t = Math.round(transition);
          text = cfg.helper
            ? `Geçiş ${t} saniye sürdü; bir dahaki sefere tek hamlede, daha hızlı geçirin. Şimdi böyle tutun.`
            : `Geçiş ${t} saniye sürdü; bir dahaki sefere tek hamlede, daha hızlı geçin. Şimdi böyle kalın.`;
        }
        cues.push({
          kind: 'speak',
          text,
          // Hastada adım yönergesini kesmesin (kuyruğa girer; "doğru" bilgisi titreşim ve tonla hemen verilir). Klinisyende
          // uzun yönerge kuyruğu doldurup nistagmus işaret onayını düşürmesin diye kesilir.
          priority: cfg.mode === 'patient' ? 'normal' : 'high'
        });
        s = updateRecord(s, (r) => ({
          ...r,
          reachedAt: r.reachedAt ?? now,
          transitionSec: transition,
          ...(slow ? { slowTransition: true } : {})
        }));
        if (slow && step.fastTransitionSec !== undefined && transition !== null) {
          s.notice = `Geçiş ${transition.toFixed(1).replace('.', ',')} saniye sürdü (hedef ${step.fastTransitionSec} sn altı). Bir dahaki sefere daha hızlı geçin.`;
        }
      }
    } else {
      s.settlingSince = null;
      s.phase = 'seeking';
      const r = outOfTarget(cfg, s, step, now, ev, pose, sinceStart >= ready, sinceStart >= ready + cfg.firstHintDelaySec, cues);
      if (r) return r;
    }
    return { state: s, cues };
  }

  if (s.phase === 'holding' || s.phase === 'drifting') {
    // Tutma sırasında sarkma sınırında histerezis: sınırda gürültüyle "bozuldu/düzeldi" gidip gelmesin. Bozulduktan sonra
    // (drifting) düzelmiş sayılmak için tam aralık gerekir. İstatistik her zaman tam aralıkla tutulur.
    const evGate = ev && pose && s.phase === 'holding' ? evaluate(pose, step.target, { holdMarginDeg: HOLD_HYSTERESIS_DEG }) : ev;
    if (evGate) s.evaluation = evGate;
    return holdingTick(cfg, s, step, now, dt, ev, evGate, pose, cues);
  }

  return { state: s, cues };
}

/**
 * Hedef dışındayken (seeking ya da drifting) sesli ipucu, zorlama uyarısı, yastık ipucu ve "pozisyona gelinemedi"
 * ölçümü. `s` yerinde güncellenir; durdurma olursa sonuç döner.
 */
function outOfTarget(
  cfg: RunnerConfig,
  s: RunnerState,
  step: StepDef,
  now: number,
  ev: Evaluation | null,
  pose: HeadPose | null,
  ready: boolean,
  hintsDue: boolean,
  cues: Cue[]
): StepResult | null {
  const patient = cfg.mode === 'patient';
  // Yatar hedefte duruş doğru (yatıyor) ama açılar tutmuyor: boyun/bel kısıtı olabilir.
  const anglesOff = !!ev && ev.postureOk && !ev.inRange && step.target.kind === 'lying';
  if (patient && !cfg.sensorless && ready && anglesOff && !s.vertigoActive) {
    if (s.unreachSince === null) s.unreachSince = now;
    // Hedef gevşetilmez: süre dolunca durdurulur ve hekime yönlendirilir.
    if (sec(now - s.unreachSince) >= UNREACHABLE_SEC) return unreachableStop(cfg, s, now, cues);
  } else if (!anglesOff || s.vertigoActive) {
    s.unreachSince = null;
  }

  if (!hintsDue) return null;
  const sinceHint = s.lastHintAt === null ? Infinity : sec(now - s.lastHintAt);
  // Zorlama uyarısından sonra ipuçları seyrekleşir ve yumuşar ("Zorlamadan, …").
  const every = s.strainWarned ? cfg.hintEverySec * 3 : cfg.hintEverySec;
  if (sinceHint < every) return null;
  if (ev && ev.hint) {
    const push = isPushHint(ev.hint);
    let text = hintText(cfg, ev.hint);
    if (patient && push && !s.strainWarned && s.pushHints >= STRAIN_AFTER_HINTS) {
      text = pick(cfg, TXT.strain);
      s.strainWarned = true;
    } else if (patient && ev.hint === 'HANG_MORE' && pose && pose.phi < PILLOW_PHI_DEG && s.pushHints >= 1 && !s.pillowSaid) {
      // Hiç sarkmıyorsa çoğu zaman yastık başın altındadır; hasta başını "bırakamaz".
      text = pick(cfg, TXT.pillow);
      s.pillowSaid = true;
    } else if (patient && push && s.strainWarned) {
      text = `Zorlamadan, ${lowerFirst(text)}`;
    }
    if (s.phase === 'drifting') cues.push({ kind: 'haptic', pattern: 'drift' });
    cues.push({ kind: 'speak', text, priority: 'normal' });
    s.lastHintAt = now;
    if (push) s.pushHints += 1;
  } else if (!ev && (patient || s.phase === 'drifting') && !s.manualStep) {
    cues.push({ kind: 'speak', text: pick(cfg, TXT.noSensor), priority: 'normal' });
    s.lastHintAt = now;
  }
  return null;
}

function holdingTick(
  cfg: RunnerConfig,
  s0: RunnerState,
  step: StepDef,
  now: number,
  dt: number,
  ev: Evaluation | null,
  evGate: Evaluation | null,
  pose: HeadPose | null,
  cues: Cue[]
): StepResult {
  let s = { ...s0 };
  const inRange = s.manualStep || (evGate?.inRange ?? false);

  if (inRange) {
    if (s.phase === 'drifting') {
      cues.push({ kind: 'speak', text: pick(cfg, TXT.recovered), priority: 'normal' });
      s.phase = 'holding';
      s.notice = null;
    }
    s.outOfRangeSince = null;
    s.unreachSince = null;
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
          text: pick(cfg, {
            patient: `Pozisyonu koruyun. ${hint}`.trim(),
            helper: `Pozisyon bozuldu. ${hint}`.trim(),
            clinician: `Pozisyon bozuldu. ${hint}`.trim()
          }),
          priority: 'high'
        });
        s.lastHintAt = now;
        if (ev?.hint && isPushHint(ev.hint)) s.pushHints += 1;
      } else {
        // Uzun süre geri gelinemezse aynı kurallar: seyrekleşen ipucu, zorlama uyarısı, ~60 s'de durdurma.
        const r = outOfTarget(cfg, s, step, now, ev, pose, true, true, cues);
        if (r) return r;
      }
    }
  }

  // İstatistik (tam hedef aralığıyla)
  if (ev) {
    s = updateRecord(s, (r) => {
      const absTheta = ev.thetaErr !== null ? Math.abs(ev.thetaErr) : null;
      const phi = pose && step.target.kind === 'lying' ? pose.phi : null;
      return {
        ...r,
        samples: r.samples + 1,
        inRangeSamples: r.inRangeSamples + (ev.inRange ? 1 : 0),
        sumAbsThetaErr: r.sumAbsThetaErr + (absTheta ?? 0),
        thetaSamples: r.thetaSamples + (absTheta !== null ? 1 : 0),
        maxAbsThetaErr: absTheta !== null ? Math.max(r.maxAbsThetaErr, absTheta) : r.maxAbsThetaErr,
        ...(phi !== null
          ? {
              sumPhi: (r.sumPhi ?? 0) + phi,
              phiSamples: (r.phiSamples ?? 0) + 1,
              minPhi: r.minPhi === null || r.minPhi === undefined ? phi : Math.min(r.minPhi, phi)
            }
          : {})
      };
    });
  }

  // Sesli sayım: kalan süre tek kaynaktan (en az bekleme ve "geçti" sonrası bekleme hangisi uzunsa). Baş dönmesi sürerken sayılmaz.
  const mark = Math.floor(s.holdSec / cfg.countEverySec) * cfg.countEverySec;
  if (mark > 0 && mark > s.lastCountMark) {
    s.lastCountMark = mark;
    const left = remainingHoldSec(s, step, now);
    const rounded = left !== null ? Math.round(left / 5) * 5 : 0;
    if (!s.vertigoActive && rounded >= 5) {
      cues.push({ kind: 'speak', text: `${rounded} saniye kaldı.`, priority: 'normal' });
    }
  }

  // En az süre doldu ama baş dönmesi sürüyor
  if (s.holdSec >= step.minHoldSec && s.vertigoActive && !s.waitingVertigoAnnounced) {
    s.waitingVertigoAnnounced = true;
    cues.push({ kind: 'haptic', pattern: 'markOn' });
    cues.push({ kind: 'speak', text: pick(cfg, TXT.waitingVertigo), priority: 'normal' });
  }

  if (s.phase === 'holding' && holdComplete(s, step, now)) {
    return { state: finishStep(cfg, s, now, cues), cues };
  }
  return { state: s, cues };
}

/** Kayıt özetleri. */
export function recordStats(r: StepRecord) {
  const phiN = r.phiSamples ?? 0;
  return {
    inRangePct: r.samples > 0 ? Math.round((100 * r.inRangeSamples) / r.samples) : null,
    meanAbsThetaErr: r.thetaSamples > 0 ? Math.round((10 * r.sumAbsThetaErr) / r.thetaSamples) / 10 : null,
    maxAbsThetaErr: r.thetaSamples > 0 ? Math.round(10 * r.maxAbsThetaErr) / 10 : null,
    /** Yatar adımda ortalama ve en küçük sarkma (φ, °); yoksa null. */
    meanPhi: phiN > 0 ? Math.round((10 * (r.sumPhi ?? 0)) / phiN) / 10 : null,
    minPhi: phiN > 0 && r.minPhi !== null && r.minPhi !== undefined ? Math.round(10 * r.minPhi) / 10 : null
  };
}

/**
 * Bir adımdaki baş dönmesi işaretlerinin özeti (s).
 * Gecikme: pozisyona girişten ilk işarete. Süre: en uzun TEK dalga (Bárány: nistagmus süresi); aralıklı iki kısa dalga
 * toplanmaz (aşırı yönlendirmeyi önler), tek uzun dalga gizlenmez. Bitişi işaretlenmemiş bir işaret varsa süre bilinmez (null).
 */
export function vertigoSummary(r: StepRecord): { latencySec: number; durationSec: number | null } | null {
  const marks = r.vertigoMarks;
  const first = marks[0];
  if (!first) return null;
  const ref = r.firstInRangeAt ?? r.reachedAt;
  const reachedRel = ref !== null ? sec(ref - r.startedAt) : 0;
  const latencySec = Math.max(0, Math.round(first.start - reachedRel));
  const open = marks.some((m) => m.end === null);
  const longest = Math.max(...marks.map((m) => (m.end ?? m.start) - m.start));
  const durationSec = open ? null : Math.max(0, Math.round(longest));
  return { latencySec, durationSec };
}
