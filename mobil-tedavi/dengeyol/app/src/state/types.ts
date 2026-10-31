import type { Calibration } from '../core/calibration';
import type { Findings, ObservationMethod } from '../core/diagnosis';
import type { Prescription } from '../core/prescription';
import type { Canal, ProtocolId, Side } from '../core/protocols';
import type { StepRecord, StopReason } from '../core/runner';
import type { CanalAnswer, SideAnswer, SideDecision, SideTestResult, YesNo } from '../core/safety';

export type Role = 'patient' | 'clinician';

export interface Settings {
  role: Role | null;
  speech: boolean;
  speechRate: number;
  haptics: boolean;
  guidanceTone: boolean;
  fontScale: 'normal' | 'large' | 'xlarge';
  theme: 'auto' | 'light' | 'dark';
  /** Demo/simülasyon: gerçek sensör yerine ekrandan kontrol edilen sanal baş. */
  simulation: boolean;
  /** Yalnızca simülasyonda: zaman hızlandırma. */
  timeScale: 1 | 5 | 20;
  /** Manevra ekranı 180° çevrik (yardımcı/klinisyen başucunda duruyor). */
  screenFlip?: boolean;
  /** Hasta modunda manevrayı kim yaptırıyor. */
  assist?: 'self' | 'helper';
  /**
   * Klinisyen modunda sesli yönerge (telefon hastanın alnında): tam, kısa (yalnız kısa komut ve sayım) ya da kapalı.
   * Yoksa 'short'. Manevra ekranının başlığından değiştirilir.
   */
  clinicianVoice?: 'full' | 'short' | 'off';
  /**
   * Bu cihazda yanıtlanmış güvenlik soruları: soru kimliği → soru metninin sürümü (redFlagVersion, state/episodes.ts).
   * Uzun ilk okunuş kilidi yalnız hiç yanıtlanmamış ya da metni değişmiş soruda uygulanır (kullanıcı turu 3, k06);
   * çift dokunuş kilidi her zaman kalır. Sorular yine her atakta sorulur.
   */
  answeredQuestions?: Record<string, string>;
}

export interface PatientProfile {
  /** Bilgilendirilmiş onay zamanı; yoksa kurulum tamamlanmamıştır. */
  consentAt?: string;
  diagnosedByDoctor: boolean;
  dxDate?: string;
  dxBy?: string;
  canal: CanalAnswer;
  side: SideAnswer;
  contraindications: string[];
  prescription?: Prescription;
  calibration?: Calibration;
  practiceDone?: boolean;
  /** Hekime/acile yönlendirilen bir ataktan sonra hastanın "hekimimle görüştüm" onayı (ms). */
  doctorClearedAt?: number;
  /**
   * Tanı zamanı (kurulumda zorunlu seçim): 'recent' "Son 2 hafta içinde" (tarih girilmedi; yanıt zamanı dxWhenAt),
   * 'older' "Daha önce", 'date' tarih biliniyor (dxDate). Eski kayıtlarda yok. Yakınlık hesabı: dxIsRecent (state/dxTiming.ts).
   */
  dxWhen?: 'recent' | 'older' | 'date';
  /** dxWhen === 'recent' yanıtının verildiği an (ms): "son 2 hafta" bu andan geriye sayılır. */
  dxWhenAt?: number;
  /** İçe aktarılan reçete bağlantısı (token): raporda reçete kodu klinisyenin HBYS notundakiyle aynı çıksın. */
  prescriptionToken?: string;
  /** Onaylanan bilgilendirme/onam metninin sürümü (CONSENT_VERSION); eski kayıtlarda yok (1. sürüm). */
  consentVersion?: string;
  /** Kurulumu ve onamı kim yaptı: hastanın kendisi ya da hasta adına, onun bilgisiyle bir yakını. */
  consentBy?: 'self' | 'helper';
}

export interface ManeuverLog {
  id: string;
  at: number;
  protocolId: ProtocolId;
  side: Side | null;
  completed: boolean;
  stopReason: StopReason | null;
  records: StepRecord[];
  /** Sensörsüz/elle onaylı mı? */
  manual: boolean;
  afterSymptoms?: 'none' | 'mild' | 'severe' | 'neuro';
  /** Manevrayı bir yakını yaptırdı mı (kayıt anındaki settings.assist === 'helper'); eski kayıtlarda yok. */
  assisted?: boolean;
  /** Manevra sırasında kaç kez duraklatıldı (geri tuşu, duraklat düğmesi); kaydedilmediyse yok. */
  pauses?: number;
}

export interface SideTestLog {
  at: number;
  results: SideTestResult[];
  stronger: Side | 'equal' | null;
  decision: SideDecision;
}

export interface RetestLog {
  at: number;
  kind: 'early' | 'morning' | 'other';
  side: Side;
  vertigo: boolean;
  latencySec: number | null;
  durationSec: number | null;
}

export interface RedFlagLog {
  at: number;
  answers: Record<string, YesNo>;
  stopped: boolean;
}

export type EpisodeStatus = 'active' | 'resolved' | 'referred' | 'emergency' | 'closed';

export interface Episode {
  id: string;
  startedAt: number;
  side: Side | null;
  protocolId: 'epley' | 'semont';
  redFlags: RedFlagLog[];
  sideTests: SideTestLog[];
  maneuvers: ManeuverLog[];
  retests: RetestLog[];
  status: EpisodeStatus;
  endedAt?: number;
  endNote?: string;
  /**
   * Taraf testi, hastanın kurulumda girdiği hekim tanısındaki taraftan farklı çıktıysa açıklama (rapora yazılır). Yakın
   * tarihli tanıda atak SIDE_CONFLICT ile yönlendirilir; eski tanıda uyarılır ve test tarafına manevra yapılır.
   */
  sideConflictNote?: string;
  /**
   * Reçeteli kısa yol kullanıldı mı (hasta "muayeneden beri hiç geçmedi" dedi; taraf testi yapılmadan reçete tarafına
   * manevra). Eski kayıtlarda yok: rapor o zaman kayıtlardan çıkarır (rxShortcutUsed, reportText.ts).
   */
  rxShortcut?: boolean;
  /**
   * Bu atakta verilen alt tip yanıtları (kullanıcı turu 2, k06): 6 saat içinde atağa devam edilirse yeniden sorulmaz.
   * trigger: 'turnUnsure' = yatay kanal onayında "Emin değilim".
   */
  subtype?: { at: number; trigger: 'liedown' | 'unsure' | 'turnUnsure'; duration: 'short' | 'mid' | 'unsure' };
  /**
   * "Pozisyona gelinemedi" durdurmasında nerede durulduğu (kullanıcı turu 3, k07): hangi test/manevra, taraf ve durulan
   * adımın kaydı. Taraf testi ve tekrar testi kayıtları başka yerde saklanmadığı için rapor ("baş en çok ~8°, hedef 15–40°")
   * bunu kullanır. Eski kayıtlarda yok.
   */
  unreachableAt?: { at: number; test: 'side' | 'maneuver' | 'retest' | 'practice'; protocolId: ProtocolId; side: Side; record?: StepRecord };
}

export interface ClinicPatient {
  id: string;
  code: string;
  birthYear?: number;
  sex?: 'K' | 'E' | '-';
  note?: string;
  createdAt: number;
}

export interface ConfirmedDiagnosis {
  canal: Canal | null;
  side: Side | null;
  mechanism: 'canalithiasis' | 'cupulolithiasis' | 'unknown';
  label: string;
  fromSuggestion: boolean;
  /** Öneriden onaylandıysa güven düzeyi. */
  confidence?: 'tipik' | 'olası' | 'belirsiz';
  /** Onay anında ekranda olan uyarılar (rapora yazılır). */
  warnings?: string[];
  /** Onay anındaki bulguların imzası; bulgular sonradan değişirse tanı geçersiz sayılır. */
  findingsKey?: string;
  /** Elle girilen tanıda, o anda karar desteğinin önerdiği tanılar (HBYS notunda "öneri X idi" satırı). */
  suggestedLabels?: string[];
}

export interface ClinicExam {
  id: string;
  patientId: string;
  at: number;
  findings: Findings;
  diagnosis?: ConfirmedDiagnosis;
  maneuvers: ManeuverLog[];
  retestFindings: Findings;
  prescriptionToken?: string;
  /** Reçetenin dayandığı tanının bulgu imzası: tanı değişirse eski QR gösterilmez. */
  prescriptionFindingsKey?: string;
  notes?: string;
}

export interface AppData {
  version: 1;
  settings: Settings;
  patient?: PatientProfile;
  episodes: Episode[];
  clinician: {
    name?: string;
    clinic?: string;
    /** VNG/Frenzel kullanılıyor: testler varsayılan olarak sensörsüz. */
    sensorless?: boolean;
    /** Bulgu formunda varsayılan gözlem yöntemi (yoksa son muayenedeki yöntem). */
    method?: ObservationMethod;
  };
  clinicPatients: ClinicPatient[];
  clinicExams: ClinicExam[];
  /** Deneme manevrası zamanları (günlük sınır için). */
  practiceLog?: number[];
}

export const DEFAULT_SETTINGS: Settings = {
  role: null,
  speech: true,
  speechRate: 1,
  haptics: true,
  guidanceTone: true,
  fontScale: 'normal',
  theme: 'auto',
  simulation: false,
  timeScale: 1
};

export const emptyData = (): AppData => ({
  version: 1,
  settings: { ...DEFAULT_SETTINGS },
  episodes: [],
  clinician: {},
  clinicPatients: [],
  clinicExams: []
});
