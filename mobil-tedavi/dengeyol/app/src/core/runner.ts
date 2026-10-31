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
 * hekime yönlendirilir (safetyStop / POSITION_UNREACHABLE). Bu süre hedefe tek an değmekle değil, yalnız pozisyon
 * doğrulanınca sıfırlanır. Hedef ASLA gevşetilmez; yalnız tutma sırasında sarkma sınırında birkaç derecelik histerezis
 * vardır (bkz. HOLD_HYSTERESIS_DEG). Yan yatış hedefinde karşı yana geçen hastaya "önce sırtüstüne" denir; hedefe
 * yüzüstü üzerinden gelinmesi kabul edilmez (bkz. evaluator `sideGuarded`).
 */
import type { HeadPose } from './geometry';
import {
  evaluate,
  type Evaluation,
  HINT_TEXT_CLINICIAN,
  HINT_TEXT_HELPER,
  HINT_TEXT_PATIENT,
  HOLD_HYSTERESIS_DEG,
  type HintKey,
  LYING_MIN_TILT,
  onWrongSide,
  SITTING_MAX_TILT,
  sideGuarded,
  SUPINE_ZONE_DEG
} from './evaluator';
import { angleDiff, wrapDeg } from './geometry';
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
  /**
   * Klinisyen modunda sesli yönerge: telefon hastanın alnında, cümleler klinisyene (k08, tur 2).
   *   full  — tam klinisyen yönergesi ve düzeltme ipuçları
   *   short — yalnız kısa komut (adım başlığı), "pozisyon doğru/bozuldu", sayım, "süre doldu" (varsayılan)
   *   off   — konuşma yok; ton ve titreşim sürer
   */
  clinicianVoice?: ClinicianVoice;
}

export type ClinicianVoice = 'full' | 'short' | 'off';

/** Sensörsüz hasta modunda yönergeden sonra pozisyona geçmek için tanınan süre (s). */
export const SENSORLESS_SETTLE_SEC = 10;
/** Hasta modunda ilk sesli düzeltme ipucu: yönerge bittikten bu kadar sonra (s). Hasta ekranı göremez (k10, tur 1). */
export const PATIENT_FIRST_HINT_DELAY_SEC = 3;
/** Bu kadar zorlama ipucundan (sarkma/dönüş) sonra "Daha fazla zorlamayın" denir. */
export const STRAIN_AFTER_HINTS = 2;
/**
 * "Biraz daha geriye" (sarkma) ipucu bir adımda en çok bu kadar söylenir; sonraki sarkma ipucu, hasta ilerliyor olsa da
 * "Daha fazla zorlamayın" olur (boynu kısıtlı hasta ilerledikçe itilmesin; k07, tur 3). Dönüş ipucunda ilerleme kuralı kalır.
 */
export const HANG_MORE_MAX_HINTS = 3;
/** Aynı ipucu, önceki ipucu cümlesi bittikten en az bu kadar sonra (s) yinelenir; kendi kendini kesmez (k02, tur 3). */
export const HINT_AFTER_SPEECH_GAP_SEC = 2;
/** Kısa "Dur! Yanlış taraf." uyarısından sonra tam yönergeye geçmeden önceki kısa ara (s). */
export const WRONG_SIDE_FOLLOW_GAP_SEC = 0.3;
/** Yanlış taraf kısa uyarısı, sırtüstüne dönülüp yeniden yanlış yana geçilse de bu süreden (s) sık verilmez. */
export const WRONG_SIDE_REALERT_SEC = 5;
/**
 * "Daha fazla zorlamayın" yalnız açı bu süre (s) ilerlemediyse söylenir: yavaş ama ilerleyen hasta korkutulmaz (k01, tur 2).
 * İlerleme: hedefe uzaklığın en az PROGRESS_MIN_DEG azalması.
 */
export const STRAIN_NO_PROGRESS_SEC = 10;
export const PROGRESS_MIN_DEG = 3;
/** Yastık ipucundan sonra yeni ipucuna kadar sessiz bekleme (s): baş dönen hasta yastığı 5 s'de düzeltemez (k10, tur 2). */
export const PILLOW_WAIT_SEC = 25;
/**
 * Semont geçişinde oturuştan geçildi sayılması için başın dikeyden sapmasının inmesi gereken üst sınır (°). Sırtüstü
 * yuvarlanmada baş yatık kalır (çene göğüste bile ≳60°); hızlı oturuşta dikleşir. Hızlı geçişte doğru yapan hastayı
 * yanlışlıkla uyarmamak için oturuş sınırı kullanılır (k10 ~30° önerdi; ölçüm gürültüsüne pay; tur 2).
 */
export const SIT_THROUGH_MAX_TILT = SITTING_MAX_TILT;
/** Tutma örneklerinin bu yüzdesinden azı tam hedefteyse adım kayda "sınırda tutuldu" yazılır (k10, tur 2). */
export const BORDERLINE_IN_RANGE_PCT = 50;
/** Yatarak doğru duruşta ama hedef açılara bu süre (s) gelinemezse adım durur ve hekime yönlendirilir (hasta modu). */
export const UNREACHABLE_SEC = 60;
/** Sarkma bu açının altında kalırsa (°) yastık yanlış yerde olabilir: yastık ipucu bir kez verilir. */
export const PILLOW_PHI_DEG = 5;
/** Hızlı geçiş adımında yönergeden sonra "Üç, iki, bir, şimdi!" sayımı (s). */
export const GO_COUNT_SEC = 3;
/**
 * Semont'ta komuttan önce yatan hastanın pozisyonu doğrulama süresi (confirmSec) + bu kadar (s) içinde doğrulanmazsa
 * "Zaten yattınız" tek başına söylenir; doğrulanırsa doğrulama cümlesiyle birleşir.
 */
export const EARLY_MOVE_SAY_AFTER_SEC = 1;
/**
 * "En iyi ulaşılan açı" tek ölçümden değil, bu kadar (s) kesintisiz ölçümün ortancasından (medyan; sağlam bir ortalama)
 * alınır: başın bir an hedefe savrulması (hızla yatarken) "baş ~16° sarktı … gelinemedi" diye çelişkili kayıt üretmesin
 * (k07, tur 4).
 */
export const REACH_AVG_SEC = 1.5;
/** Hedefe yalnız bir an değilip tutulamadığında rapor/özet cümlesi (k07, tur 4). */
export const REACH_TOUCHED_ONLY_TEXT = 'hedefe yalnız bir an değdi, tutulamadı';
/** Hedef açıya yüzüstünden geçilerek gelindiğinde (kabul edilmez) rapor/özet cümlesi (k02, tur 4). */
export const PRONE_ARRIVAL_TEXT = 'yüzüstünden geçilerek gelindi, kabul edilmedi';
/** Aynı durumda ekrandaki bilgi notu (yürütücü `notice`). */
export const PRONE_ARRIVAL_NOTICE = 'Hedef açıya yüzüstünden geçilerek gelindi; kabul edilmedi. Önce sırtüstüne, sonra doğru yana.';
/**
 * Klinisyen kısa seste aynı yön ipucu art arda bu kadar söylendikten sonra seyrekleşir (k10, tur 4): sonraki yinelemeler en
 * az SAME_HINT_THIN_EVERY_SEC arayla. Yanlış taraf yönergesi seyrekleşmez (güvenlik).
 */
export const SAME_HINT_THIN_AFTER = 3;
export const SAME_HINT_THIN_EVERY_SEC = 10;

/**
 * Süreyi sesli okunacak biçimde yazar: "s"/"sn" kısaltması kullanılmaz (Türkçe ses "yetmiş iki s" okur; k07, tur 4).
 * Bir dakikadan uzunsa sade "bir dakikadan uzun süre", değilse "N saniye".
 */
export function spokenDuration(sec: number): string {
  const n = Math.max(0, Math.round(sec));
  return n > 60 ? 'bir dakikadan uzun süre' : `${n} saniye`;
}

/**
 * Sesli okunacak metinde sayıdan sonra gelen saniye kısaltmasını ("72 s", "4 sn", "8,5 s") "saniye"ye açar; ekrandaki metin
 * değişmez. Rapor/bitiş metni sesli okunmadan önce bundan geçirilir (k07, tur 4).
 */
export function speakableSeconds(text: string): string {
  return text.replace(/(\d)\s*(?:sn|s)(?![\p{L}\p{N}'’])/gu, '$1 saniye');
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

export type StopReason = 'VERTIGO_TOO_LONG' | 'POSITION_UNREACHABLE' | 'USER_ABORT' | 'USER_FEELS_UNWELL' | 'INTERRUPTED';

/** Durma nedenlerinin kısa Türkçe karşılığı (geçmiş, rapor). */
export const STOP_REASON_TEXT: Record<StopReason, string> = {
  VERTIGO_TOO_LONG: 'durduruldu: baş dönmesi 2 dakikadan uzun sürdü',
  POSITION_UNREACHABLE: 'durduruldu: pozisyona gelinemedi',
  USER_ABORT: 'yarıda bırakıldı',
  USER_FEELS_UNWELL: 'durduruldu: kendini iyi hissetmedi',
  INTERRUPTED: 'kesildi: uygulamadan çıkıldı'
};

/**
 * Yanlış tarafta kalındığı için (yüzüstünden geçme denemesi ya da doğru yana getirilemeyen hasta) "pozisyona gelinemedi"
 * durdurmasının kısa karşılığı (geçmiş, rapor). Neden kodu aynıdır (POSITION_UNREACHABLE); ayrım adım kaydındadır
 * (`wrongSideStop`). Bkz. `stopReasonTextFor`.
 */
export const WRONG_SIDE_STOP_REASON_TEXT = 'durduruldu: yanlış tarafa dönüldü, doğru yana gelinemedi';

/** Güvenlik durdurması bitiş ekranı metinleri (hasta modu). Durdurma kuralları ve yönlendirme kilidi aynen kalır. */
export const SAFETY_STOP_TEXT: Record<'VERTIGO_TOO_LONG' | 'POSITION_UNREACHABLE' | 'WRONG_SIDE', string> = {
  VERTIGO_TOO_LONG:
    'Baş dönmeniz 2 dakikadan uzun sürdü ya da geçtiği işaretlenmedi. Bu, tipik arka kanal BPPV\'ye uymuyor. Lütfen hekiminize ya da odyoloğunuza başvurun. Konuşma bozukluğu, güçsüzlük ya da çift görme olursa hemen 112\'yi arayın.',
  POSITION_UNREACHABLE:
    'Manevranın bir pozisyonuna gelinemedi (örneğin baş yeterince geriye sarkamadı ya da çevrilemedi). Zorlayarak yeniden denemeyin. Hekiminize ya da odyoloğunuza başvurun; boyun ya da bel hareketiniz kısıtlıysa manevranın değiştirilmiş biçimini ya da kendi gözetiminde yapılmasını önerebilir.',
  /** Yanlış tarafta kalındı (k02, tur 3): gerekçe boyun/bel değil; kilit aynen kalır. */
  WRONG_SIDE:
    'Manevrada yanlış tarafa dönüldü ve doğru yana gelinemedi (örneğin yüzüstünden geçilmeye çalışıldı). Bu, boyun ya da bel sorunu olduğu anlamına gelmez. Önce sırtüstüne dönün, sonra yavaşça oturun. Bugün yeniden denemeden önce hekiminize ya da odyoloğunuza danışın; manevrayı birlikte gözden geçirsinler.'
};

/** Durdurulan adım yanlış tarafta kalındığı için mi durdu (otomatik "gelinemedi" + kayıtta yanlış taraf)? */
function stoppedOnWrongSide(records: readonly StepRecord[]): boolean {
  return records.some((r) => r.unreachable && r.wrongSideStop);
}

/**
 * Güvenlik durdurması bitiş ekranı metni: "pozisyona gelinemedi" yanlış tarafta kalındığı için olduysa ayrı gerekçe
 * (k02, tur 3). Hasta akışı `SAFETY_STOP_TEXT.POSITION_UNREACHABLE` yerine bunu çağırır.
 */
export function stopTextFor(
  reason: 'VERTIGO_TOO_LONG' | 'POSITION_UNREACHABLE',
  records: readonly StepRecord[],
  opts: { helper?: boolean } = {}
): string {
  if (reason === 'POSITION_UNREACHABLE' && stoppedOnWrongSide(records)) {
    return opts.helper ? SAFETY_STOP_TEXT_WRONG_SIDE_HELPER : SAFETY_STOP_TEXT.WRONG_SIDE;
  }
  return SAFETY_STOP_TEXT[reason];
}

/** Yanlış taraf bitiş metninin yakını modundaki biçimi: ekran da sesle aynı kişiye konuşur (k02, tur 4). Kilit aynen. */
export const SAFETY_STOP_TEXT_WRONG_SIDE_HELPER =
  'Manevrada yanlış tarafa dönüldü ve hasta doğru yana getirilemedi (örneğin yüzüstünden geçilmeye çalışıldı). Bu, boyun ya da bel sorunu olduğu anlamına gelmez. Hastayı önce sırtüstüne getirin, sonra yavaşça oturtun. Bugün yeniden denemeden önce hekime ya da odyoloğa danışın; manevrayı birlikte gözden geçirsinler.';

/** Durma nedeninin kısa karşılığı (geçmiş, rapor): `STOP_REASON_TEXT` ile aynı; yanlış tarafta kalınmışsa ayrı gerekçe. */
export function stopReasonTextFor(reason: StopReason, records: readonly StepRecord[]): string {
  if (reason === 'POSITION_UNREACHABLE' && stoppedOnWrongSide(records)) return WRONG_SIDE_STOP_REASON_TEXT;
  return STOP_REASON_TEXT[reason];
}

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
  /** Semont: hasta "Şimdi!" komutundan önce yeni yana yattı (sayım iptal edildi). */
  movedBeforeCommand?: boolean;
  /** Semont: geçişte oturuştan geçilmedi (ör. sırtüstü yuvarlanma); hastaya da söylendi. */
  noSitThrough?: boolean;
  /** Yan yatış adımında hasta karşı yana döndü; "önce sırtüstüne dönün" denildi. */
  wrongSide?: boolean;
  /**
   * "Pozisyona gelinemedi" durdurması yanlış tarafta kalındığı için oldu (otomatik 60 s kuralı ya da düğme, hasta o an
   * yanlış yandayken). Bitiş/rapor metni buna göre seçilir: `stopTextFor`, `stopReasonTextFor`.
   */
  wrongSideStop?: boolean;
  /**
   * Hedef aranırken (pozisyon doğrulanmadan önce) ulaşılan en iyi açılar (°): sarkma (φ) ve dönüş (θ) ayrı ayrı hedefe en
   * yakın değer. "Pozisyona gelinemedi"de raporda "baş en çok ~8° sarktı (hedef 15–40°)" yazılabilsin (k07, tur 3).
   * Bkz. `reachSummary`.
   * Değerler tek ölçüm değil, REACH_AVG_SEC'lik kesintisiz ölçüm penceresinin ortancasıdır (k07, tur 4). `touchedOnly`: "pozisyona
   * gelinemedi" durdurmasında hedefe bir an değildi (ya da bildirilen ortalama hedef aralığında) ama pozisyon hiç
   * doğrulanmadı; rapor "hedefe yalnız bir an değdi, tutulamadı" yazar (REACH_TOUCHED_ONLY_TEXT).
   */
  reach?: { phi: number | null; theta: number | null; touchedOnly?: boolean };
  /**
   * Hedef açıya yüzüstünden geçilerek gelindi (yanlış taraf kilidi sürerken); kabul edilmedi. Rapor "dönüş hedefe uzak kaldı"
   * yerine bunu yazar (PRONE_ARRIVAL_TEXT; k02, tur 4).
   */
  proneArrival?: boolean;
  /** Adım tamamlandı ama tutma süresinin yarısından azında tam hedefteydi (histerezis payıyla): "sınırda tutuldu". */
  borderline?: boolean;
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
  /** Hasta yan yatış hedefinin karşı yanına geçti; sırtüstüne ya da oturuşa dönene dek hedef kabul edilmez. */
  wrongSideLatched: boolean;
  /** Hedefe en küçük uzaklık (°) ve son ilerleme anı (ms): zorlama uyarısı yalnız ilerleme durunca. */
  bestErrDeg: number | null;
  progressAt: number | null;
  /** Bu ana dek (ms) yeni düzeltme ipucu verilmez (ör. yastık ipucundan sonra). */
  hintQuietUntil: number | null;
  /** Hızlı geçiş adımında başın dikeyden en küçük sapması (°; oturuştan geçildi mi). */
  minTiltInStep: number | null;
  /** Semont: hasta komuttan önce yeni yana yattı (ms); sayım iptal edildi. */
  earlyMoveAt: number | null;
  /** "Zaten yattınız" ayrı söylendi mi (pozisyon hemen doğrulanmadıysa); söylenmediyse doğrulama cümlesiyle birleşir. */
  earlyMoveSaid: boolean;
  /** Bu adımda söylenen "biraz daha geriye" (sarkma) ipucu sayısı; bkz. HANG_MORE_MAX_HINTS. */
  hangHints: number;
  /** Bu yanlış taraf geçişinde kısa "Dur! Yanlış taraf." uyarısı verildi mi (sırtüstüne dönülünce sıfırlanır). */
  wrongSideAlerted: boolean;
  /** Son kısa yanlış taraf uyarısının anı (ms). */
  wrongSideAlertAt: number | null;
  /**
   * Son düzeltme ipucu / uyarı cümlesi: kimliği, bittiği varsayılan an (ms) ve ardından yeni ipucuna kadar ara (ms).
   * Gerçek bitiş `cueSpoken` olayıyla gelir; gelmezse tahmin kullanılır. Bu süre dolmadan yeni ipucu söylenmez.
   */
  hintUtter: { id: number; until: number; gapMs: number } | null;
  /** Konuşma kimliği sayacı (`Cue.utterId`). */
  utterSeq: number;
  /** En iyi açı ortalaması için son ölçümler (yatar, doğru yan, pozisyon doğrulanmadan önce) ve kesintisiz dizinin başı. */
  reachBuf: { t: number; phi: number; theta: number }[];
  reachRunStart: number | null;
  /** Yanlış yandan sırtüstüne gelince verilen "Tamam, şimdi … yanınıza." anı (ms; k04, tur 4). */
  supineCueAt: number | null;
  /** Bu ölçümde hedef açıdaydı ama yüzüstünden gelindiği için kabul edilmedi. */
  proneAtTarget: boolean;
  /** "Yüzüstünden geçilerek gelindi" bu yanlış taraf geçişinde söylendi mi (sırtüstüne dönülünce sıfırlanır). */
  proneSaid: boolean;
  /** Son söylenen düzeltme ipucunun anahtarı ve art arda kaç kez söylendiği (klinisyen kısa seste seyrekleşme). */
  lastHintKey: HintKey | null;
  sameHintRun: number;
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
  | { type: 'introSpoken'; now: number; stepIndex: number }
  /** `utterId` taşıyan cümlenin konuşması bitti ya da kesildi (arayüz, `speech.speak` bitiş geri çağrısından). */
  | { type: 'cueSpoken'; now: number; utterId: number };

export type Cue =
  /** `tag: 'stepIntro'`: adım yönergesi; arayüz bitişini `introSpoken` olayıyla bildirir. */
  /**
   * `tag: 'count'`: "… saniye kaldı"; arayüz, konuşma sürüyorsa okumaz (geç okunan sayım yanlış süre söyler).
   * `tag: 'hint'`: düzeltme ipucu (klinisyen kısa seste 2–3 kelimelik biçimi).
   * `tag: 'alert'`: kısa "Dur! Yanlış taraf." uyarısı.
   * `utterId`: arayüz, bu cümlenin bitişini (ya da kesilişini) `cueSpoken` olayıyla bildirir (ipucu kendini kesmesin).
   */
  | {
      kind: 'speak';
      text: string;
      priority: 'high' | 'normal';
      tag?: 'stepIntro' | 'count' | 'hint' | 'alert';
      stepIndex?: number;
      utterId?: number;
    }
  | {
      kind: 'haptic';
      pattern:
        | 'reached'
        | 'drift'
        | 'stepDone'
        | 'done'
        | 'alarm'
        | 'tap'
        | 'move'
        | 'markOn'
        | 'markOff'
        | 'pause'
        | 'ready'
        | 'wrongSide';
    }
  | {
      kind: 'tone';
      pattern: 'reached' | 'stepDone' | 'countdown' | 'done' | 'alarm' | 'move' | 'drift' | 'markOn' | 'markOff' | 'pause' | 'wrongSide';
    };

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
    goCount: 0,
    wrongSideLatched: false,
    bestErrDeg: null,
    progressAt: null,
    hintQuietUntil: null,
    minTiltInStep: null,
    earlyMoveAt: null,
    earlyMoveSaid: false,
    hangHints: 0,
    wrongSideAlerted: false,
    wrongSideAlertAt: null,
    hintUtter: null,
    utterSeq: 0,
    ...stepScratch()
  };
}

/** Her adım başında sıfırlanan ek alanlar (en iyi açı ortalaması, yanlış taraf sırtüstü/yüzüstü sözleri, ipucu dizisi). */
function stepScratch() {
  return {
    reachBuf: [] as RunnerState['reachBuf'],
    reachRunStart: null,
    supineCueAt: null,
    proneAtTarget: false,
    proneSaid: false,
    lastHintKey: null,
    sameHintRun: 0
  } satisfies Partial<RunnerState>;
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
  /** Zorlama uyarısından sonra eski "biraz daha" ipucu yerine (çelişmesin: "öyle kalın" denildi; k07, tur 2). */
  strainHold: {
    patient: 'Zorlamayın; rahat olduğunuz yerde kalın.',
    helper: 'Zorlamayın; baş rahat olduğu yerde kalsın.',
    clinician: ''
  },
  pillow: {
    patient: 'Yastık başınızın altında olabilir. Biraz yukarı kayın; yastık omuzlarınızın altına gelsin, başınız yastıktan geriye sarksın.',
    helper: 'Yastık hastanın başının altında olabilir. Hastayı biraz yukarı kaydırın; yastık omuzlarının altına gelsin, baş yastıktan geriye sarksın.',
    clinician: ''
  },
  /** Yastık ipucundan sonra hâlâ hiç sarkmıyorsa: zorlama uyarısı değil (sorun boyun değil, yastık; k10, tur 2). */
  pillowWait: {
    patient: 'Yastığı düzeltince devam ederiz. Yastık omuzlarınızın altında olsun, başınız geriye sarkabilsin.',
    helper: 'Yastığı düzeltince devam ederiz. Yastık hastanın omuzlarının altında olsun, baş geriye sarkabilsin.',
    clinician: ''
  },
  /** Semont: hasta "Şimdi!"den önce yeni yana yattı; sayım iptal (yatmış hastaya hareket komutu verilmez; k10, tur 2). */
  earlyMove: {
    patient: 'Zaten yattınız; sayımı bırakıyoruz. Böyle kalın, kıpırdamayın.',
    helper: 'Hasta zaten yattı; sayımı bırakıyoruz. Böyle tutun.',
    clinician: 'Komuttan önce geçildi.'
  },
  unreachable: {
    patient: 'Bu pozisyona gelinemedi. Daha fazla zorlamayın; burada bırakıyoruz. Yavaşça oturun. Tekrar denemeden önce hekiminize danışın.',
    helper: 'Bu pozisyona gelinemedi. Daha fazla zorlamayın; burada bırakıyoruz. Hastayı yavaşça oturtun. Tekrar denemeden önce hekime danışın.',
    clinician: 'Pozisyona gelinemedi; durduruldu.'
  },
  /** Yanlış tarafta kalındığı için durduruldu (k02, tur 3): gerekçe boyun değil. */
  unreachableWrongSide: {
    patient: 'Yanlış taraftan doğru yana gelinemedi; burada bırakıyoruz. Önce sırtüstüne dönün, sonra yavaşça oturun. Tekrar denemeden önce hekiminize danışın.',
    helper: 'Hasta yanlış taraftan doğru yana getirilemedi; burada bırakıyoruz. Hastayı önce sırtüstüne getirin, sonra yavaşça oturtun. Tekrar denemeden önce hekime danışın.',
    clinician: 'Yanlış taraf; doğru yana gelinemedi, durduruldu.'
  },
  /** Yanlış taraf algılanır algılanmaz (k02, tur 3): kısa, ayrı titreşim ve tonla; ardından tam yönerge. */
  wrongSideAlert: { patient: 'Dur! Yanlış taraf.', helper: 'Dur! Yanlış taraf.', clinician: 'Dur! Yanlış taraf.' }
} as const;

/** Klinisyen kısa seste düzeltme ipuçları: 2–3 kelime, yön hastaya göre (k10, tur 3). Uzun biçim "açık" seste. */
export const HINT_TEXT_CLINICIAN_SHORT: Record<HintKey, string> = {
  LIE_DOWN: 'Hastayı yatırın.',
  SIT_UP: 'Hastayı oturtun.',
  TURN_RIGHT: 'Hastanın sağına.',
  TURN_LEFT: 'Hastanın soluna.',
  TURN_BODY_RIGHT: 'Gövdeyi sağına.',
  TURN_BODY_LEFT: 'Gövdeyi soluna.',
  WRONG_SIDE_RIGHT: 'Sırtüstünden hastanın sağına.',
  WRONG_SIDE_LEFT: 'Sırtüstünden hastanın soluna.',
  HANG_MORE: 'Daha sarkık.',
  HANG_LESS: 'Daha az sarkık.',
  CHIN_DOWN: 'Çene aşağı.',
  CHIN_UP: 'Çene yukarı.',
  HEAD_STRAIGHT: 'Başı düzleştirin.'
};

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
  const base = introEndSec(cfg, s, step) + (hasGoCount(cfg, step) ? GO_COUNT_SEC : 0);
  // Komuttan önce yeni yana yatan hasta (sayım iptal) yönerge sonunu beklemez: zaten yatıyor.
  return s.earlyMoveAt !== null ? Math.min(base, sec(s.earlyMoveAt - s.stepStartedAt)) : base;
}

const clinicianVoice = (cfg: RunnerConfig): ClinicianVoice => cfg.clinicianVoice ?? 'short';
/** Klinisyen kısa (ya da kapalı) seste mi: kısa komutlar, 2–3 kelimelik yön ipuçları ve sayım. */
const clinicianShort = (cfg: RunnerConfig) => cfg.mode === 'clinician' && clinicianVoice(cfg) !== 'full';
/** Klinisyen sesi kapalı mı: hiç konuşma yok ("Başlıyoruz" dahil), alt yazı da gösterilmez; ton ve titreşim sürer (k08, tur 3). */
export const clinicianSilent = (cfg: RunnerConfig): boolean => cfg.mode === 'clinician' && clinicianVoice(cfg) === 'off';

function hintText(cfg: RunnerConfig, key: HintKey, step?: StepDef): string {
  const v = voice(cfg);
  const short = clinicianShort(cfg);
  // Semont: hasta hâlâ önceki yanda. Yol oturuştandır, sırtüstü yuvarlanma değil.
  if (step?.fastTransitionSec !== undefined && (key === 'WRONG_SIDE_RIGHT' || key === 'WRONG_SIDE_LEFT')) {
    const right = key === 'WRONG_SIDE_RIGHT';
    return pick(cfg, {
      patient: `Hâlâ öbür yandasınız. Oturarak geçip tek hamlede ${right ? 'sağ' : 'sol'} yanınıza yatın.`,
      helper: `Hasta hâlâ öbür yanda. Oturuştan geçirip tek hamlede ${right ? 'sağ' : 'sol'} yanına yatırın.`,
      clinician: short
        ? `Oturuştan hastanın ${right ? 'sağına' : 'soluna'}.`
        : `Hasta hâlâ öbür yanda: oturuştan geçirerek hastanın ${right ? 'sağına' : 'soluna'}.`
    });
  }
  if (v === 'clinician') return short ? HINT_TEXT_CLINICIAN_SHORT[key] : HINT_TEXT_CLINICIAN[key];
  return v === 'helper' ? HINT_TEXT_HELPER[key] : HINT_TEXT_PATIENT[key];
}

/**
 * Yanlış yandan sırtüstüne gelindi: "2 uzun" (hareket) titreşimiyle kısa "şimdi doğru yana" (k04, tur 4). Sesi duymayan
 * hasta da "sırtüstüne geldim, şimdi dönebilirim" bilgisini alır.
 */
export function supineNowText(cfg: RunnerConfig, step: StepDef): string {
  const right = step.target.kind === 'lying' && step.target.theta > 0;
  const side = right ? 'sağ' : 'sol';
  return pick(cfg, {
    patient: `Tamam, şimdi ${side} yanınıza.`,
    helper: `Tamam, şimdi hastanın ${side} yanına.`,
    clinician: clinicianShort(cfg)
      ? `Şimdi hastanın ${right ? 'sağına' : 'soluna'}.`
      : `Hasta sırtüstünde; şimdi bütün vücuduyla hastanın ${right ? 'sağına' : 'soluna'} çevirin.`
  });
}

/** Hedef açıya yüzüstünden geçilerek gelindi (kabul edilmez): açık söz, ardından "önce sırtüstüne" yönergesi (k02, tur 4). */
function proneArrivalText(cfg: RunnerConfig, key: HintKey, step: StepDef): string {
  if (clinicianShort(cfg)) return 'Yüzüstünden geldi; geçersiz.';
  return `Yüzüstünden geçilerek gelindi; kabul edilmedi. ${hintText(cfg, key, step)}`;
}

/**
 * Başlarken söylenen cümle (3 s'lik sayımdan önce). Klinisyen sesi kapalıyken null: hiç konuşulmaz (k08, tur 3).
 * Hasta modunda varsa giriş notu (ör. "Önce sol tarafı…") başa eklenir.
 */
export function startSpeechText(cfg: RunnerConfig, startNote?: string): string | null {
  if (cfg.mode === 'clinician') return clinicianSilent(cfg) ? null : 'Başlıyoruz.';
  // Yardımcı modunda yönergeler yakına; hastaya tek cümle söylenir.
  const core = cfg.helper
    ? 'Başlıyoruz. Yönergeleri yakınınıza söyleyeceğim. Siz kıpırdamayın; başınızı yakınınız çevirecek.'
    : cfg.sensorless
      ? 'Başlıyoruz.'
      : 'Başlıyoruz. Yönergeleri dinleyin.';
  return `${startNote ? `${startNote} ` : ''}${core}`;
}

/**
 * Duraklatma sesi. Hasta ekranı göremez: önce asıl eylem, devam yolu söylenir (ekrana basılı tutmak; k04, tur 3); baş dönmesi
 * işaretliyse "bir kez dokunun" hemen ardından (tek dokunuş baş dönmesi bitişidir). Varsayılan (`full` false) yalnız bu ilk
 * iki cümle (+ baş dönmesi notu): yatarken uzun gelmesin (k04, tur 4). Ayrıntı — boynu ağrıyan hastaya "olduğunuz yerde
 * kalın" denmez, "Pozisyona gelemiyorum" yolu söylenir (k07, tur 2); bu düğme ekranın üstündeki "Evet" ile onaylanır
 * (k01, tur 3) — duraklatma sayfasındaki "Tekrar dinle"de (`full` true).
 */
export function pauseSpeech(cfg: RunnerConfig, vertigoActive: boolean, full: boolean): string {
  const vNote = vertigoActive ? ' Baş dönmesi geçtiyse ekrana bir kez dokunun.' : '';
  const head = `Duraklatıldı. Devam için ekrana iki saniye basılı tutun.${vNote}`;
  // Kısa seste de güvenlik cümlesi kalır: telefon alındayken "Tekrar dinle" görülemez (k07, tur 5).
  const neckP = ' Boynunuz ağrıyorsa yavaşça oturun.';
  const neckH = ' Hastanın boynu ağrıyorsa onu yavaşça oturtun.';
  if (!full) return pick(cfg, { patient: head + neckP, helper: head + neckH, clinician: 'Duraklatıldı.' });
  return pick(cfg, {
    patient: `${head} Boynunuz ağrıyorsa yavaşça oturabilirsiniz. Bu pozisyona gelemiyorsanız telefonu alıp "Pozisyona gelemiyorum" düğmesine dokunun ve onaylayın.`,
    helper: `${head} Hastanın boynu ağrıyorsa onu yavaşça oturtabilirsiniz. Hasta bu pozisyona gelemiyorsa "Bu pozisyona gelemiyor" düğmesine dokunun ve onaylayın.`,
    clinician: 'Duraklatıldı.'
  });
}

/** Adım yönergesi: hastaya, yardımcıya (varsa yardımcı metni) ya da klinisyene (kısa seste yalnız adım başlığı). */
export function stepSpeech(cfg: RunnerConfig, step: StepDef): string {
  if (cfg.mode !== 'patient') {
    // Başlığın yardımcı biçimi yönü hastaya göre söyler ("baş hastanın sağına 45°"; k10, tur 2).
    return clinicianShort(cfg) ? `${step.helperTitle ?? step.title}.` : step.clinician;
  }
  return cfg.helper && step.helperSay ? step.helperSay : step.say;
}

/**
 * Doğrulanamayan oturuş adımında en az bekleme: dürüst cümle ("çevirdiyseniz öyle kalın…") "Bu adım tamam" ile
 * kesilmesin diye cümlenin tahmini süresi + 3 s'den kısa olmaz (k01, k04; tur 2).
 */
export function effectiveMinHoldSec(cfg: RunnerConfig, step: StepDef): number {
  if (cfg.mode === 'patient' && step.unverifiable && step.reachedSay) {
    return Math.max(step.minHoldSec, Math.ceil(cfg.introSecFor(reachedText(cfg, step, false)) + 3));
  }
  return step.minHoldSec;
}

/** Pozisyon doğrulanınca söylenen söz. Doğrulanamayan (otururken baş çevirme) adımda dürüst cümle. */
function reachedText(cfg: RunnerConfig, step: StepDef, manual: boolean): string {
  if (cfg.mode === 'patient' && step.unverifiable && step.reachedSay) {
    return cfg.helper && step.helperReachedSay ? step.helperReachedSay : step.reachedSay;
  }
  return pick(cfg, manual ? TXT.reachedManual : TXT.reached);
}

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
function holdComplete(cfg: RunnerConfig, s: RunnerState, step: StepDef, now: number): boolean {
  if (s.holdSec < effectiveMinHoldSec(cfg, step)) return false;
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
    wrongSideLatched: false,
    bestErrDeg: null,
    progressAt: null,
    hintQuietUntil: null,
    minTiltInStep: null,
    earlyMoveAt: null,
    earlyMoveSaid: false,
    hangHints: 0,
    wrongSideAlerted: false,
    wrongSideAlertAt: null,
    hintUtter: null,
    ...stepScratch(),
    records: [...s.records, newRecord(step, now)]
  };
}

function finishStep(cfg: RunnerConfig, s: RunnerState, now: number, cues: Cue[]): RunnerState {
  let next = updateRecord(s, (r) => {
    // Hedefin kıyısında (histerezis payında) tutulan adım tamamlanır ama kayda "sınırda tutuldu" yazılır (k10, tur 2).
    const borderline = !r.manual && r.samples > 0 && (100 * r.inRangeSamples) / r.samples < BORDERLINE_IN_RANGE_PCT;
    return { ...r, endedAt: now, holdSec: s.holdSec, ...(borderline ? { borderline: true } : {}) };
  });
  const finished = cfg.protocol.steps[s.stepIndex];
  const honest = cfg.mode === 'patient' && !!finished?.unverifiable && !!finished.reachedSay;
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
    // Kısa: adımlar arası 4 s içinde biter, sıradaki yönergeyle kesilmez. Doğrulanamayan oturuş adımında dürüst cümleyi
    // kesmez (kuyruğa girer; k01, k04; tur 2).
    text: cfg.mode === 'patient' ? 'Bu adım tamam.' : 'Adım tamam. Sıradaki adım.',
    priority: honest ? 'normal' : 'high'
  });
  next = { ...next, phase: 'between', phaseSince: now };
  return next;
}

/**
 * Pozisyona gelinemedi: adım durur, kayda yazılır, hekime yönlendirilir. Hedef gevşetilmez; hasta zorlanmaz.
 * (Otomatik: hasta modunda ~60 s; elle: duraklatma ekranındaki "Pozisyona gelemiyorum / boynum ağrıyor".)
 * Adımda yanlış tarafa dönüldüyse (otomatik durdurma) ya da hasta o an yanlış yandaysa gerekçe "yanlış taraf"tır,
 * boyun/bel değil (k02, tur 3): kayda `wrongSideStop` yazılır, söz ve bitiş metni buna göre seçilir.
 */
function unreachableStop(cfg: RunnerConfig, s: RunnerState, now: number, cues: Cue[], auto: boolean): StepResult {
  const rec = s.records[s.records.length - 1];
  const wrongSideStop = !!rec?.wrongSide && (auto || s.wrongSideLatched);
  cues.push({ kind: 'haptic', pattern: 'alarm' });
  cues.push({ kind: 'tone', pattern: 'alarm' });
  cues.push({ kind: 'speak', text: pick(cfg, wrongSideStop ? TXT.unreachableWrongSide : TXT.unreachable), priority: 'high' });
  const step = currentStep(cfg, s);
  const st = updateRecord(s, (r) => {
    const reach = finalReach(s, r, step);
    return {
      ...r,
      endedAt: r.endedAt ?? now,
      holdSec: s.holdSec,
      unreachable: true,
      ...(reach ? { reach } : {}),
      ...(wrongSideStop ? { wrongSideStop: true } : {})
    };
  });
  return {
    state: {
      ...st,
      phase: 'safetyStop',
      phaseSince: now,
      stopReason: 'POSITION_UNREACHABLE',
      notice: wrongSideStop ? 'Yanlış taraftan doğru yana gelinemedi.' : 'Pozisyona gelinemedi.'
    },
    cues
  };
}

/** Hasta yeni hedefin yanında yatıyor mu (Semont erken hareket): yatıyor, karşı yanda değil, hedef dönüşe ≤60° yakın. */
function arrivedOnTargetSide(pose: HeadPose, target: Target, ev: Evaluation): boolean {
  if (target.kind !== 'lying' || !ev.postureOk || ev.wrongSide) return false;
  return Math.abs(angleDiff(target.theta, pose.theta)) <= 60;
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
  const r = runnerStepInner(cfg, s, ev);
  if (cfg.mode !== 'clinician') return r;
  // Klinisyen sesi (k08, k10; tur 2–3): telefon hastanın alnında. Kısa seste ipuçları 2–3 kelimelik yön ("Hastanın sağına.");
  // kapalıyken hiç konuşma yok, ton ve titreşim sürer. Boş söz (klinisyende karşılığı olmayan hasta cümlesi) okunmaz.
  const v = clinicianVoice(cfg);
  return { state: r.state, cues: r.cues.filter((c) => c.kind !== 'speak' || (v !== 'off' && c.text !== '')) };
}

function runnerStepInner(cfg: RunnerConfig, s: RunnerState, ev: RunnerEvent): StepResult {
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

    case 'cueSpoken': {
      // İpucu/uyarı cümlesi bitti ya da kesildi: sonraki ipucu artık bekleyebilir (tahmin yerine gerçek bitiş).
      if (!s.hintUtter || s.hintUtter.id !== ev.utterId || now >= s.hintUtter.until) return { state: s, cues };
      return { state: { ...s, hintUtter: { ...s.hintUtter, until: now } }, cues };
    }

    case 'abort': {
      // "Pozisyona gelemiyorum / boynum ağrıyor": yarıda bırakma değil, yönlendirmeli durdurma.
      if (ev.reason === 'POSITION_UNREACHABLE') {
        if (s.phase === 'idle') return { state: s, cues };
        return unreachableStop(cfg, s, now, cues, false);
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
      // Hasta ekranı göremez: yalnız eylem söylenir (kısa; k04, tur 4). Ayrıntı (boyun ağrısı, "Pozisyona gelemiyorum")
      // duraklatma sayfasındaki "Tekrar dinle"de: `pauseSpeech(cfg, vertigo, true)`.
      cues.push({ kind: 'speak', text: pauseSpeech(cfg, s.vertigoActive, false), priority: 'high' });
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
      const earlyMoveAt = s.earlyMoveAt !== null ? s.earlyMoveAt + pausedMs : null;
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
          earlyMoveAt,
          // "Pozisyona gelinemedi" süresi ve ilerleme ölçümü duraklatmadan sonra baştan.
          unreachSince: null,
          bestErrDeg: null,
          progressAt: null,
          hintQuietUntil: null,
          hintUtter: null,
          // Duraklatma boşluğu ortalamaya girmez.
          reachBuf: [],
          reachRunStart: null
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
        // Dokunuşun yanıtı gecikmesin: kuyruktaki hatırlatma cümlesinin arkasında beklemez (k01, tur 2).
        priority: 'high'
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

/** Bir dakikayı aşan baş dönmesi (manevra sonrası hekime danışma eşiği; EpisodeFlow ile aynı). */
export const VERTIGO_ATYPICAL_SEC = 60;

/**
 * Baş dönmesi hatırlatması (k01, tur 2): korkutmadan ve 60 s eşiğiyle tutarlı.
 *   eşikten önce, ilk  — yalnız "geçince dokunun" (hekim sözü yok)
 *   eşikten önceki son — "geçtiyse şimdi dokunun; bir dakikayı geçerse hekime danışmak gerekir"
 *   eşikten sonra      — dürüst: bir dakikayı geçti; dokunulmazsa ne zaman durdurulacağı (2 dk kuralı aynen)
 */
function vertigoReminderText(cfg: RunnerConfig, atSec: number, leftSec: number | null): string {
  const h = !!cfg.helper;
  if (atSec >= VERTIGO_ATYPICAL_SEC) {
    const stop = leftSec !== null ? ` ${leftSec} saniye içinde dokunulmazsa manevrayı durduracağım.` : '';
    return h
      ? `Baş dönmesi bir dakikayı geçti; bunu hekime söyleyeceğiz. Hasta "geçti" deyince ekrana dokunun.${stop}`
      : `Baş dönmesi bir dakikayı geçti; bunu hekiminize söyleyeceğiz. Geçince ekrana dokunun.${stop}`;
  }
  if (atSec + VERTIGO_REMIND_EVERY_SEC >= VERTIGO_ATYPICAL_SEC) {
    return h
      ? 'Hasta "geçti" dediyse şimdi ekrana dokunun. Bir dakikayı geçerse hekime danışmak gerekir.'
      : 'Baş dönmesi geçtiyse şimdi ekrana dokunun. Bir dakikayı geçerse hekime danışmak gerekir.';
  }
  return h
    ? 'Hasta "geçti" deyince ekrana dokunun; sürüyorsa böyle tutun.'
    : 'Baş dönmesi geçince ekrana dokunun; sürüyorsa böyle kalın.';
}

/**
 * Baş dönmesi hatırlatmasının zamanı ve sözü. Durdurmadan önceki son hatırlatma kısadır ve durdurma cümlesiyle kesilmesin
 * diye (yavaş seste de) sınırdan en az tahmini süresi + 2 s önce başlar (k01, tur 3).
 */
export function vertigoReminderPlan(
  cfg: RunnerConfig,
  next: number,
  prevMark: number,
  limit: number | null
): { atSec: number; text: string } {
  const isFinal = limit !== null && next >= VERTIGO_ATYPICAL_SEC && next + VERTIGO_REMIND_EVERY_SEC >= limit;
  if (!isFinal || limit === null) {
    return { atSec: next, text: vertigoReminderText(cfg, next, limit !== null ? Math.round(limit - next) : null) };
  }
  const finalText = (left: number) =>
    cfg.helper
      ? `Hasta "geçti" dediyse hemen ekrana dokunun. ${left} saniye içinde dokunulmazsa manevrayı durduracağım.`
      : `Baş dönmesi geçtiyse hemen ekrana dokunun. ${left} saniye içinde dokunulmazsa manevrayı durduracağım.`;
  const est = cfg.introSecFor(finalText(Math.round(limit - next)));
  const atSec = Math.max(prevMark + 1, Math.min(next, Math.floor(limit - est - 2)));
  return { atSec, text: finalText(Math.round(limit - atSec)) };
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
      const plan = vertigoLimit === null || next < vertigoLimit ? vertigoReminderPlan(cfg, next, s.vertigoRemindMark, vertigoLimit) : null;
      if (plan && vSec >= plan.atSec) {
        s.vertigoRemindMark = next;
        cues.push({ kind: 'haptic', pattern: 'markOn' });
        cues.push({ kind: 'tone', pattern: 'markOn' });
        cues.push({ kind: 'speak', text: plan.text, priority: 'normal' });
      }
    }
  }

  const sinceStart = sec(now - s.stepStartedAt);

  // Sensör verisi (sensörsüz hasta modunda açı ölçülmez)
  const measuring = !(cfg.sensorless && cfg.mode === 'patient');
  const stale = s.lastPoseAt === null || sec(now - s.lastPoseAt) > cfg.staleSensorSec;
  const livePose = measuring && pose && !stale ? pose : null;

  if (livePose && step.target.kind === 'lying' && sideGuarded(step.target) && step.fastTransitionSec === undefined) {
    // Yanlış taraf kilidi: karşı yana geçen hasta sırtüstüne (ya da oturuşa) dönene dek hedefe yüzüstünden gelemez (k02, tur 2).
    // Semont'ta hasta adım başında zaten önceki (karşı) yandadır; yol oturuştandır, kilit yoktur (ipucu yine "öbür yandasınız").
    if (livePose.tiltFromUpright < LYING_MIN_TILT || Math.abs(livePose.theta) < SUPINE_ZONE_DEG) {
      const wasLatched = s.wrongSideLatched;
      s.wrongSideLatched = false;
      // Sırtüstüne (ya da oturuşa) dönüldü: yeniden yanlış yana geçilirse kısa uyarı yine verilir.
      s.wrongSideAlerted = false;
      s.proneSaid = false;
      // Yanlış yandan SIRTÜSTÜNE gelindi (oturuş değil): "2 uzun" (hareket) titreşimi ve kısa "Tamam, şimdi sağ yanınıza."
      // (k04, tur 4). Sırtüstü sınırında gidip gelen hastaya sık yinelenmez.
      const seeking = s.phase === 'intro' || s.phase === 'seeking' || s.phase === 'settling' || s.phase === 'drifting';
      if (
        wasLatched &&
        seeking &&
        livePose.tiltFromUpright >= LYING_MIN_TILT &&
        (s.supineCueAt === null || sec(now - s.supineCueAt) >= WRONG_SIDE_REALERT_SEC)
      ) {
        s.supineCueAt = now;
        cues.push({ kind: 'haptic', pattern: 'move' });
        cues.push({ kind: 'tone', pattern: 'move' });
        // O an okunan "önce sırtüstüne" yönergesini keser (hasta zaten sırtüstünde); sonraki ipucu bu cümleden sonra.
        speakHint(cfg, s, now, cues, supineNowText(cfg, step), 'high', 'hint', HINT_AFTER_SPEECH_GAP_SEC);
        s.lastHintAt = now;
      }
    } else if (onWrongSide(livePose, step.target)) s.wrongSideLatched = true;
  }
  const ev = livePose ? evaluate(livePose, step.target, { wrongSideLatched: s.wrongSideLatched }) : null;
  if (measuring) s.evaluation = ev;
  // Hedef açıda ama yüzüstünden gelindiği için kabul edilmedi (kilit sürüyor): söz ve kayıt (k02, tur 4).
  s.proneAtTarget = !!(livePose && ev?.wrongSide && s.wrongSideLatched && evaluate(livePose, step.target).inRange);
  if (s.proneAtTarget && !s.records[s.records.length - 1]?.proneArrival) {
    s = updateRecord(s, (r) => ({ ...r, proneArrival: true }));
  }
  // Ekranda da (yakını/klinisyen görür): hedef açıda ama kabul edilmedi.
  if (s.proneAtTarget) s.notice = PRONE_ARRIVAL_NOTICE;
  else if (s.notice === PRONE_ARRIVAL_NOTICE) s.notice = null;

  // Hedef aranırken ulaşılan en iyi açılar (pozisyon doğrulanmadan önce; k07, tur 3): tek ölçüm değil, REACH_AVG_SEC'lik
  // kesintisiz ölçümün ortancası (bir anlık savrulma "en iyi" sayılmasın; k07, tur 4).
  const recNow = s.records[s.records.length - 1];
  if (livePose && ev && ev.postureOk && !ev.wrongSide && step.target.kind === 'lying' && recNow && recNow.reachedAt === null) {
    if (s.reachRunStart === null) s.reachRunStart = now;
    const from = now - REACH_AVG_SEC * 1000;
    s.reachBuf = [...s.reachBuf.filter((b) => b.t > from), { t: now, phi: livePose.phi, theta: livePose.theta }];
    if (now - s.reachRunStart >= REACH_AVG_SEC * 1000 - 1) {
      const avg = averageReach(s.reachBuf);
      const next = avg ? betterReach(recNow.reach, avg, step.target) : null;
      if (next) s = updateRecord(s, (r) => ({ ...r, reach: next }));
    }
  } else if (s.reachRunStart !== null || s.reachBuf.length) {
    // Dizi kesildi (oturdu, yanlış yana geçti, sensör kesildi ya da pozisyon doğrulandı): ortalama baştan.
    s.reachRunStart = null;
    s.reachBuf = [];
  }

  if (livePose && step.fastTransitionSec !== undefined && s.records[s.records.length - 1]?.reachedAt === null) {
    // Semont: geçişte oturuştan geçildi mi (baş dikleşti mi; k10, tur 2).
    s.minTiltInStep = s.minTiltInStep === null ? livePose.tiltFromUpright : Math.min(s.minTiltInStep, livePose.tiltFromUpright);
  }

  // Semont: hasta "Şimdi!"den önce yeni yana yattıysa sayım iptal; yatmış hastaya hareket komutu verilmez (k10, tur 2).
  // "Zaten yattınız" pozisyon doğrulanınca (≈1 s) geçiş geri bildirimiyle TEK cümlede söylenir; ayrı söylenip hemen ardından
  // yavaş geçiş cümlesiyle kesilmez (k10, tur 3). Doğrulama gecikirse kısa süre sonra tek başına söylenir.
  if (hasGoCount(cfg, step) && s.goCount < 4 && s.earlyMoveAt === null && livePose && ev && arrivedOnTargetSide(livePose, step.target, ev)) {
    s.goCount = 4;
    s.earlyMoveAt = now;
    s = updateRecord(s, (r) => ({ ...r, movedBeforeCommand: true }));
  }
  if (
    s.earlyMoveAt !== null &&
    !s.earlyMoveSaid &&
    s.records[s.records.length - 1]?.reachedAt === null &&
    sec(now - s.earlyMoveAt) >= cfg.confirmSec + EARLY_MOVE_SAY_AFTER_SEC
  ) {
    s.earlyMoveSaid = true;
    // Uzun yönergeyi keser: hasta zaten yatıyor.
    cues.push({ kind: 'speak', text: pick(cfg, TXT.earlyMove), priority: 'high' });
  }

  const ready = readySec(cfg, s, step);

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
      // "Pozisyona gelinemedi" süresi hedefe tek an değmekle sıfırlanmaz; yalnız pozisyon doğrulanınca (k07, tur 2).
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
        s.lastHintKey = null;
        s.sameHintRun = 0;
        // Doğrulanan pozisyon (≥ confirmSec kesintisiz hedefte) en iyi ulaşılan açıdır.
        if (livePose && step.target.kind === 'lying') {
          const best = betterReach(s.records[s.records.length - 1]?.reach, livePose, step.target);
          if (best) s = updateRecord(s, (r) => ({ ...r, reach: best }));
        }
        const transition =
          step.fastTransitionSec !== undefined && s.leftPreviousAt !== null ? sec(settlingSince - s.leftPreviousAt) : null;
        const slow = transition !== null && step.fastTransitionSec !== undefined && transition > step.fastTransitionSec;
        // Semont: baş geçişte hiç dikleşmediyse oturuştan geçilmemiştir (ör. sırtüstü yuvarlanma; k10, tur 2).
        const noSit =
          step.fastTransitionSec !== undefined && s.minTiltInStep !== null && s.minTiltInStep > SIT_THROUGH_MAX_TILT;
        const honest = cfg.mode === 'patient' && !!step.unverifiable;
        // Doğrulanamayan adımda "doğru" titreşim/tonu verilmez; söz de dürüsttür (baş çevirme ölçülemez).
        if (!honest) {
          cues.push({ kind: 'haptic', pattern: 'reached' });
          cues.push({ kind: 'tone', pattern: 'reached' });
        }
        let text = reachedText(cfg, step, false);
        const early = cfg.mode === 'patient' && s.earlyMoveAt !== null;
        if ((slow || noSit || early) && cfg.mode === 'patient') {
          // Evde Semont'un ana hataları yavaş geçiş, yuvarlanma ve komuttan önce hareket: hastaya da söylenir, kayda geçer
          // (k10, tur 1–2). Komuttan önce yatıldıysa "Zaten yattınız" bu cümlenin başındadır: iki cümle birbirini kesmez (k10, tur 3).
          const parts: string[] = [];
          if (early && !s.earlyMoveSaid) parts.push(cfg.helper ? 'Hasta zaten yattı; sayımı bırakıyoruz.' : 'Zaten yattınız; sayımı bırakıyoruz.');
          if (noSit) parts.push(cfg.helper ? 'Oturuştan geçirmediniz; bir dahaki sefere önce oturtun, sonra tek hamlede geçirin.' : 'Oturuştan geçmediniz; bir dahaki sefere önce oturun, sonra tek hamlede geçin.');
          if (slow && transition !== null) {
            const t = Math.round(transition);
            const how = early ? 'bir dahaki sefere "şimdi"yi bekleyip tek hamlede' : 'bir dahaki sefere tek hamlede, daha hızlı';
            parts.push(cfg.helper ? `Geçiş ${t} saniye sürdü; ${how} geçirin.` : `Geçiş ${t} saniye sürdü; ${how} geçin.`);
          }
          if (early) parts.push(cfg.helper ? 'Böyle tutun.' : 'Böyle kalın, kıpırdamayın.');
          else parts.push(cfg.helper ? 'Şimdi böyle tutun.' : 'Şimdi böyle kalın.');
          text = parts.join(' ');
        } else if ((slow || noSit) && cfg.mode === 'clinician') {
          // Klinisyen hastayı iki eliyle tutarken ekranı göremez: kısa sesli bilgi (k10, tur 2).
          if (slow && transition !== null) text += ` Geçiş ${Math.round(transition)} saniye, yavaş.`;
          if (noSit) text += ' Oturuştan geçilmedi.';
        }
        cues.push({
          kind: 'speak',
          text,
          // Kuyrukta bekleyen eski düzeltme ipuçları "Tamam"ı geciktirmesin (k01, k04; tur 2): ipucu verildiyse ya da yönerge
          // bittiği biliniyorsa keser. Yalnız yönerge hâlâ okunuyor olabilirse kuyruğa girer ("doğru" bilgisi titreşimle hemen).
          // "Zaten yattınız" ayrı söylendiyse (doğrulama gecikti) onu kesmez, ardına girer.
          priority: s.earlyMoveSaid
            ? 'normal'
            : cfg.mode !== 'patient' || s.lastHintAt !== null || s.earlyMoveAt !== null || (!!cfg.awaitSpeechEnd && s.introSpokenAt !== null)
              ? 'high'
              : 'normal'
        });
        s = updateRecord(s, (r) => ({
          ...r,
          reachedAt: r.reachedAt ?? now,
          transitionSec: transition,
          ...(slow ? { slowTransition: true } : {}),
          ...(noSit ? { noSitThrough: true } : {})
        }));
        const notes: string[] = [];
        if (noSit) notes.push('Geçişte oturuştan geçilmedi (yuvarlanma); bir dahaki sefere önce oturun.');
        if (slow && step.fastTransitionSec !== undefined && transition !== null) {
          notes.push(`Geçiş ${transition.toFixed(1).replace('.', ',')} saniye sürdü (hedef ${step.fastTransitionSec} sn altı). Bir dahaki sefere daha hızlı geçin.`);
        }
        if (notes.length) s.notice = notes.join(' ');
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
    const evGate =
      ev && livePose && s.phase === 'holding'
        ? evaluate(livePose, step.target, { holdMarginDeg: HOLD_HYSTERESIS_DEG, wrongSideLatched: s.wrongSideLatched })
        : ev;
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
    if (sec(now - s.unreachSince) >= UNREACHABLE_SEC) return unreachableStop(cfg, s, now, cues, true);
  } else if ((ev && !anglesOff) || s.vertigoActive) {
    // Oturdu ya da baş dönmesi işaretli: süre baştan. Hedefe tek an değmek (k07, tur 2) ve kısa sensör kesintisi sıfırlamaz.
    s.unreachSince = null;
  }

  // İlerleme ölçümü: hedefe uzaklık en az PROGRESS_MIN_DEG azaldıysa hasta hâlâ ilerliyor (zorlama uyarısı beklesin).
  if (anglesOff && ev && (s.bestErrDeg === null || ev.errorDeg <= s.bestErrDeg - PROGRESS_MIN_DEG)) {
    s.bestErrDeg = ev.errorDeg;
    s.progressAt = now;
  }

  // Yanlış taraf (yan yatış adımı; Semont'ta önceki yanda kalmak bu değildir): algılanır algılanmaz kısa "Dur! Yanlış taraf."
  // ve kendi titreşimi/tonu; tam yönerge onun ardından. Yönergenin ya da ipucu süresinin bitmesi beklenmez (k02, tur 3).
  const wrongSide = !!ev?.wrongSide && step.fastTransitionSec === undefined;
  if (wrongSide) {
    markWrongSide(s);
    if (wrongSideAlert(cfg, s, now, cues)) return null;
  } else {
    if (!hintsDue) return null;
    if (s.hintQuietUntil !== null && now < s.hintQuietUntil) return null;
  }
  // Hedef açıya yüzüstünden gelindi: ilk kez hemen ve açıkça söylenir (hasta "geldim" sanıp beklemesin; k02, tur 4).
  const proneFirst = wrongSide && s.proneAtTarget && !s.proneSaid;
  // Önceki ipucu cümlesi bitmeden (+ ara) yeni ipucu yok: kendi kendini kesmez, kuyrukta birikmez (k02, tur 3).
  if (!proneFirst && s.hintUtter && now < s.hintUtter.until + s.hintUtter.gapMs) return null;
  const sinceHint = s.lastHintAt === null ? Infinity : sec(now - s.lastHintAt);
  // Zorlama uyarısından ya da yastık ipucundan sonra ipuçları seyrekleşir.
  let every = !wrongSide && (s.strainWarned || s.pillowSaid) ? cfg.hintEverySec * 3 : cfg.hintEverySec;
  // Klinisyen kısa seste aynı yön art arda SAME_HINT_THIN_AFTER kez söylendiyse seyrekleşir (k10, tur 4); yanlış taraf hariç.
  if (clinicianShort(cfg) && !wrongSide && ev?.hint && ev.hint === s.lastHintKey && s.sameHintRun >= SAME_HINT_THIN_AFTER) {
    every = Math.max(every, SAME_HINT_THIN_EVERY_SEC);
  }
  // Kısa uyarının ardından ilk tam yönerge aralık beklemez.
  const firstAfterAlert =
    wrongSide && s.wrongSideAlertAt !== null && (s.lastHintAt === null || s.lastHintAt < s.wrongSideAlertAt);
  if (!firstAfterAlert && !proneFirst && sinceHint < every) return null;
  if (ev && ev.hint) {
    const push = isPushHint(ev.hint);
    let text = hintText(cfg, ev.hint, step);
    let plain = true;
    if (wrongSide && s.proneAtTarget && (proneFirst || !clinicianShort(cfg))) {
      // Kısa seste açıklama bir kez; sonra yalnız yön ("Sırtüstünden hastanın soluna.").
      text = proneArrivalText(cfg, ev.hint, step);
      s.proneSaid = true;
      plain = false;
    }
    // Hiç sarkmıyorsa çoğu zaman yastık başın altındadır; hasta başını "bırakamaz". Sorun boyun değil: zorlama uyarısı verilmez.
    const pillowCase = patient && ev.hint === 'HANG_MORE' && !!pose && pose.phi < PILLOW_PHI_DEG;
    const stalled = s.progressAt === null || sec(now - s.progressAt) >= STRAIN_NO_PROGRESS_SEC;
    // "Biraz daha geriye" en çok HANG_MORE_MAX_HINTS kez; sonra, hasta ilerliyor olsa da zorlama uyarısı (k07, tur 3).
    const hangCapped = ev.hint === 'HANG_MORE' && s.hangHints >= HANG_MORE_MAX_HINTS;
    if (pillowCase && s.pushHints >= 1 && !s.pillowSaid) {
      text = pick(cfg, TXT.pillow);
      s.pillowSaid = true;
      // Baş dönen hasta yastığı birkaç saniyede düzeltemez: bir süre yeni ipucu yok (k10, tur 2).
      s.hintQuietUntil = now + PILLOW_WAIT_SEC * 1000;
      plain = false;
    } else if (pillowCase && s.pillowSaid) {
      text = pick(cfg, TXT.pillowWait);
      plain = false;
    } else if (patient && push && !s.strainWarned && (hangCapped || (s.pushHints >= STRAIN_AFTER_HINTS && stalled))) {
      text = pick(cfg, TXT.strain);
      s.strainWarned = true;
      plain = false;
    } else if (patient && push && s.strainWarned) {
      // "Öyle kalın" denildi: eski "biraz daha" ipucu artık söylenmez (k07, tur 2).
      text = pick(cfg, TXT.strainHold);
      plain = false;
    }
    if (s.phase === 'drifting') cues.push({ kind: 'haptic', pattern: 'drift' });
    // Yanlış taraf yönergesi beklemez (hasta yüzüstüne doğru dönüyor olabilir); önceki cümle bittiği için onu kesmez.
    speakHint(cfg, s, now, cues, text, ev.wrongSide ? 'high' : 'normal', 'hint', HINT_AFTER_SPEECH_GAP_SEC);
    s.lastHintAt = now;
    noteHintKey(s, ev.hint);
    if (push) s.pushHints += 1;
    if (plain && ev.hint === 'HANG_MORE') s.hangHints += 1;
  } else if (!ev && (patient || s.phase === 'drifting') && !s.manualStep) {
    // Klinisyen kısa seste okunmaz (ekranda yazıyor; her 5 s yinelenmesin).
    if (!clinicianShort(cfg)) speakHint(cfg, s, now, cues, pick(cfg, TXT.noSensor), 'normal', 'hint', HINT_AFTER_SPEECH_GAP_SEC);
    s.lastHintAt = now;
  }
  return null;
}

/** Söylenen ipucunun anahtarı: art arda aynıysa sayı artar (klinisyen kısa seste seyrekleşme). `s` yerinde. */
function noteHintKey(s: RunnerState, key: HintKey) {
  if (key === s.lastHintKey) s.sameHintRun += 1;
  else {
    s.lastHintKey = key;
    s.sameHintRun = 1;
  }
}

/** Bir cümlenin bittiği varsayılan an (ms): gerçek bitiş bekleniyorsa üst sınır (tahmin×2+3 s), yoksa tahmin. */
function utterEndAt(cfg: RunnerConfig, text: string, now: number): number {
  const est = cfg.introSecFor(text);
  return now + (cfg.awaitSpeechEnd ? est * 2 + 3 : est) * 1000;
}

/** İpucu/uyarı cümlesi: bitişi izlenir (`utterId` → `cueSpoken`); bitene dek (+ ara) yeni ipucu söylenmez. `s` yerinde güncellenir. */
function speakHint(
  cfg: RunnerConfig,
  s: RunnerState,
  now: number,
  cues: Cue[],
  text: string,
  priority: 'high' | 'normal',
  tag: 'hint' | 'alert' | undefined,
  gapSec: number
) {
  const id = s.utterSeq + 1;
  s.utterSeq = id;
  cues.push({ kind: 'speak', text, priority, ...(tag ? { tag } : {}), utterId: id });
  s.hintUtter = { id, until: utterEndAt(cfg, text, now), gapMs: gapSec * 1000 };
}

/** Adım kaydına "önce yanlış tarafa dönüldü" yazar (`s` yerinde). */
function markWrongSide(s: RunnerState) {
  const last = s.records[s.records.length - 1];
  if (last && !last.wrongSide) s.records = updateRecord(s, (r) => ({ ...r, wrongSide: true })).records;
}

/**
 * Yanlış taraf kısa uyarısı: "Dur! Yanlış taraf." + ayrı titreşim ve ton (yüksek öncelik; o an okunan yönergeyi keser).
 * Bu geçişte bir kez; sırtüstüne dönülüp yeniden yanlış yana geçilirse yine (en sık WRONG_SIDE_REALERT_SEC'de bir).
 * Verildiyse true. `s` yerinde güncellenir.
 */
function wrongSideAlert(cfg: RunnerConfig, s: RunnerState, now: number, cues: Cue[]): boolean {
  if (s.wrongSideAlerted) return false;
  s.wrongSideAlerted = true;
  if (s.wrongSideAlertAt !== null && sec(now - s.wrongSideAlertAt) < WRONG_SIDE_REALERT_SEC) return false;
  s.wrongSideAlertAt = now;
  cues.push({ kind: 'haptic', pattern: 'wrongSide' });
  cues.push({ kind: 'tone', pattern: 'wrongSide' });
  speakHint(cfg, s, now, cues, pick(cfg, TXT.wrongSideAlert), 'high', 'alert', WRONG_SIDE_FOLLOW_GAP_SEC);
  return true;
}

/**
 * Pencerenin tipik değeri: her eksende ortanca (medyan). Gürültüde ortalama gibidir, ama pencerenin yarısından kısa süren
 * bir savrulma (hızla yatarken başın bir an hedefe düşmesi) sonucu hiç değiştirmez (k07, tur 4). θ çevreseldir: ilk ölçüme
 * göre açılıp alınır (BBQ'da ±180° sınırı). Ölçüm yoksa null.
 */
function averageReach(buf: readonly { phi: number; theta: number }[]): { phi: number; theta: number } | null {
  const first = buf[0];
  if (!first) return null;
  const median = (xs: number[]) => {
    const a = xs.slice().sort((p, q) => p - q);
    const m = a.length >> 1;
    return a.length % 2 ? a[m]! : (a[m - 1]! + a[m]!) / 2;
  };
  const phi = median(buf.map((b) => b.phi));
  const d = median(buf.map((b) => angleDiff(first.theta, b.theta)));
  return { phi, theta: wrapDeg(first.theta - d) };
}

/** Hedefe daha yakın açı geldiyse yeni "en iyi ulaşılan" değerleri; değişiklik yoksa null. */
function betterReach(
  prev: StepRecord['reach'],
  at: { phi: number; theta: number },
  target: Target
): NonNullable<StepRecord['reach']> | null {
  if (target.kind !== 'lying') return null;
  const phiDist = (p: number) => (p < target.phiMin ? target.phiMin - p : p > target.phiMax ? p - target.phiMax : 0);
  const thetaDist = (t: number) => Math.abs(angleDiff(target.theta, t));
  const phi = Math.round(at.phi * 10) / 10;
  const theta = Math.round(at.theta * 10) / 10;
  let nPhi = prev?.phi ?? null;
  let nTheta = prev?.theta ?? null;
  let changed = false;
  if (nPhi === null || phiDist(phi) < phiDist(nPhi)) {
    nPhi = phi;
    changed = true;
  }
  if (nTheta === null || thetaDist(theta) < thetaDist(nTheta)) {
    nTheta = theta;
    changed = true;
  }
  return changed ? { ...prev, phi: nPhi, theta: nTheta } : null;
}

/** Bildirilen en iyi açılar hedef aralığında mı (iki eksen de; yatar hedef)? */
function reachInTarget(reach: StepRecord['reach'], target: Target): boolean {
  if (!reach || target.kind !== 'lying' || reach.phi === null || reach.theta === null) return false;
  return (
    reach.phi >= target.phiMin &&
    reach.phi <= target.phiMax &&
    Math.abs(angleDiff(target.theta, reach.theta)) <= target.thetaTol
  );
}

/**
 * "Pozisyona gelinemedi" durdurmasında en iyi açı kaydının son hâli: ortalama hiç oluşmadıysa eldeki kısa dizinin
 * ortalaması; hedefe bir an değilip (ya da ortalama hedefteyken) pozisyon hiç doğrulanmadıysa `touchedOnly` (k07, tur 4).
 */
function finalReach(s: RunnerState, rec: StepRecord, step: StepDef | undefined): StepRecord['reach'] {
  if (!step || step.target.kind !== 'lying') return rec.reach;
  let reach = rec.reach;
  if (!reach && rec.reachedAt === null) {
    const avg = averageReach(s.reachBuf);
    if (avg) reach = betterReach(undefined, avg, step.target) ?? undefined;
  }
  if (!reach) return reach;
  const touched = rec.reachedAt === null && (rec.firstInRangeAt !== null || reachInTarget(reach, step.target));
  return touched ? { ...reach, touchedOnly: true } : reach;
}

/** Dönüş sözü: +θ = hastanın sağı. */
function turnWord(theta: number, approx: boolean): string {
  const a = Math.round(Math.abs(theta));
  if (a <= 3) return 'düz';
  return `${theta > 0 ? 'sağa' : 'sola'} ${approx ? '~' : ''}${a}°`;
}

/**
 * "Pozisyona gelinemedi" adımında aramada ulaşılan en iyi açının kısa özeti (rapor): hedefe gelinemeyen eksen(ler),
 * örneğin "baş en çok ~8° sarktı (hedef 15–40°)" ya da "baş en çok sola ~20° döndü (hedef sola 45° ±10°)". Kayıt yoksa,
 * hedef yatar değilse ya da ulaşılan açılar hedefteyse null (k07, tur 3).
 * Hedefe yalnız bir an değildiyse (`reach.touchedOnly`) sona "hedefe yalnız bir an değdi, tutulamadı" eklenir; bildirilen
 * açı hedef aralığındaysa yalnız bu söylenir (çelişkili "~16° sarktı … gelinemedi" olmasın; k07, tur 4). Hedef açıya
 * yüzüstünden gelindiyse (`proneArrival`) dönüş uzaklığı yerine "yüzüstünden geçilerek gelindi, kabul edilmedi" (k02, tur 4).
 */
export function reachSummary(record: StepRecord, step: StepDef): string | null {
  const reach = record.reach;
  const t = step.target;
  if (t.kind !== 'lying') return null;
  const tail: string[] = [];
  if (record.proneArrival) tail.push(PRONE_ARRIVAL_TEXT);
  if (reach?.touchedOnly) tail.push(REACH_TOUCHED_ONLY_TEXT);
  if (!reach) return tail.length ? tail.join('; ') : null;
  const parts: string[] = [];
  if (!record.proneArrival && reach.theta !== null && Math.abs(angleDiff(t.theta, reach.theta)) > t.thetaTol) {
    const w = turnWord(reach.theta, true);
    parts.push(`${w === 'düz' ? 'baş hiç çevrilemedi' : `baş en çok ${w} döndü`} (hedef ${turnWord(t.theta, false)} ±${t.thetaTol}°)`);
  }
  if (reach.phi !== null) {
    const p = Math.round(reach.phi);
    const hedef =
      t.phiMin >= 0
        ? `hedef ${t.phiMin}–${t.phiMax}°`
        : t.phiMax <= 0
          ? `hedef ${-t.phiMax}–${-t.phiMin}° öne eğik`
          : `hedef ${-t.phiMin}° öne eğik ile ${t.phiMax}° sarkık arası`;
    if (reach.phi < t.phiMin) {
      parts.push(p > 0 ? `baş en çok ~${p}° sarktı (${hedef})` : `baş hiç sarkmadı, ~${-p}° öne eğik kaldı (${hedef})`);
    } else if (reach.phi > t.phiMax) {
      parts.push(p > 0 ? `baş en az ~${p}° sarkık kaldı (${hedef})` : `baş en çok ~${-p}° öne eğildi (${hedef})`);
    }
  }
  const all = [...parts, ...tail];
  return all.length ? all.join('; ') : null;
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
      // Dönüş: "doğru" titreşimi ve tonu; bekleyen eski düzeltme ipuçları kesilir, "Tamam" hemen söylenir (k04, tur 2).
      cues.push({ kind: 'haptic', pattern: 'reached' });
      cues.push({ kind: 'tone', pattern: 'reached' });
      cues.push({ kind: 'speak', text: pick(cfg, TXT.recovered), priority: 'high' });
      s.phase = 'holding';
      s.notice = null;
      s.lastHintKey = null;
      s.sameHintRun = 0;
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
        const wrong = !!ev?.wrongSide && step.fastTransitionSec === undefined;
        if (wrong) markWrongSide(s);
        // Yanlış yana geçildiyse "bozuldu" yerine kısa yanlış taraf uyarısı (tam yönerge ardından gelir).
        if (!(wrong && wrongSideAlert(cfg, s, now, cues))) {
          cues.push({ kind: 'haptic', pattern: 'drift' });
          cues.push({ kind: 'tone', pattern: 'drift' });
          // Klinisyen kısa seste "Pozisyon bozuldu." + 2–3 kelimelik yön ("Daha sarkık."; k10, tur 3).
          const hint = ev?.hint ? hintText(cfg, ev.hint, step) : '';
          const text = pick(cfg, {
            patient: `Pozisyonu koruyun. ${hint}`.trim(),
            helper: `Pozisyon bozuldu. ${hint}`.trim(),
            clinician: `Pozisyon bozuldu. ${hint}`.trim()
          });
          speakHint(cfg, s, now, cues, text, 'high', undefined, HINT_AFTER_SPEECH_GAP_SEC);
          s.lastHintAt = now;
          if (ev?.hint) noteHintKey(s, ev.hint);
          if (ev?.hint && isPushHint(ev.hint)) s.pushHints += 1;
          if (ev?.hint === 'HANG_MORE') s.hangHints += 1;
        }
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
      cues.push({ kind: 'speak', text: `${rounded} saniye kaldı.`, priority: 'normal', tag: 'count' });
    }
  }

  // En az süre doldu ama baş dönmesi sürüyor
  if (s.holdSec >= step.minHoldSec && s.vertigoActive && !s.waitingVertigoAnnounced) {
    s.waitingVertigoAnnounced = true;
    cues.push({ kind: 'haptic', pattern: 'markOn' });
    cues.push({ kind: 'speak', text: pick(cfg, TXT.waitingVertigo), priority: 'normal' });
  }

  if (s.phase === 'holding' && holdComplete(cfg, s, step, now)) {
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
