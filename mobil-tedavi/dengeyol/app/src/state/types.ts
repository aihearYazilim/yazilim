import type { Calibration } from '../core/calibration';
import type { Findings } from '../core/diagnosis';
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
  clinician: { name?: string; clinic?: string; /** VNG/Frenzel kullanılıyor: testler varsayılan olarak sensörsüz. */ sensorless?: boolean };
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
