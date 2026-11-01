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
  /**
   * Araştırma (isteğe bağlı; yeni kullanıcı turu 2, M1-11, y04): açıksa atak başında ve manevradan sonra belirti şiddeti
   * (0–10) tek satırla sorulur (`Episode.vas`). Varsayılan kapalı; kapalıyken hiç görünmez. Ayarlar → Klinik çalışma.
   */
  askVas?: boolean;
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
  /**
   * Klinik çalışma katılımcı numarası (isteğe bağlı; yeni kullanıcı turu 1, y04 #7). Reçetesiz katılımcının ev raporu
   * klinisyende bu numarayla eşleşir; raporda ve QR'da (biçim v3) taşınır. Ayarlar'dan girilir.
   */
  studyId?: string;
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
  /**
   * Uygulama manevra sürerken kapandı/yenilendi; kayıt yeniden açılışta ara kayıttan (Episode.pendingManeuver) kuruldu
   * (yeni kullanıcı turu 1, y01 #6). stopReason 'INTERRUPTED'; `records.length` yarıda kalınan adımdır.
   */
  recovered?: boolean;
  /**
   * Bu manevradan sonra sorulan belirti şiddeti 0–10 (yeni kullanıcı turu 3, N1-8; y04: iki manevralı atakta atak başına
   * tek `Episode.vas.after` ikinci yanıtla eziliyordu). settings.askVas açıkken "Şu an nasılsınız?"dan sonra sorulur; "Geç"
   * denirse yazılmaz. Eski kayıtlarda yok (o kayıtlarda `Episode.vas.after` okunur).
   */
  vasAfter?: number;
}

export interface SideTestLog {
  at: number;
  results: SideTestResult[];
  stronger: Side | 'equal' | null;
  decision: SideDecision;
  /** Hangi testle (PC: Dix-Hallpike, HC: sırtüstü baş çevirme) yapıldı; eski kayıtlarda yok (PC). */
  canal?: 'PC' | 'HC';
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
  /** Yanıt durdurma önerdi ve kişi durdu (ya da henüz karar vermedi). Uyarı aşılıp devam edildiyse false ve `continued`. */
  stopped: boolean;
  /**
   * Durdurma öneren yanıttan sonra uyarı "Yine de devam et" ile aşıldı (yeni kullanıcı turu 3, N1-8; y04: yedekte devam
   * edilen kayıt `stopped: true` görünüyordu). Eski kayıtlarda yok (o kayıtlarda devam, RED_FLAG aşma kaydından çıkarılır).
   */
  continued?: boolean;
}

export type EpisodeStatus = 'active' | 'resolved' | 'referred' | 'emergency' | 'closed';

export interface Episode {
  id: string;
  startedAt: number;
  side: Side | null;
  /**
   * Atağın manevrası: açılışta planlanan (arka kanal: Epley/Semont), manevra yapılınca son yapılan manevra (yatay kanalda
   * 'bbq-roll'; yeni kullanıcı turu 1, y04 #2). Eski kayıtlarda yalnız 'epley' | 'semont' ve yapılan manevradan bağımsızdır:
   * rapor yapılan manevrayı manevra kayıtlarından yazar (maneuverHeadText).
   */
  protocolId: ProtocolId;
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
   * trigger: 'turnUnsure' = yatay kanal onayında "Emin değilim" (eski akış); 'turn' = yatakta dönünce (yatay kanal yolu).
   */
  subtype?: { at: number; trigger: 'liedown' | 'unsure' | 'turnUnsure' | 'turn'; duration: 'short' | 'mid' | 'unsure' };
  /**
   * Atak manevra dışında (taraf testi ya da tekrar testi) "pozisyona gelinemedi" ile durdurulduysa nerede durulduğu
   * (kullanıcı turu 3, k07): "Sağ taraf testi, "Sırtüstü…" adımı: baş en çok ~8° geriye sarkabildi (hedef 15–40°)…".
   * Test kayıtları manevra gibi saklanmadığı için rapora buradan yazılır; üretmek için unreachableStopDetail
   * (ui/screens/patient/reportText.ts). Manevrada durulduysa gerek yok: rapor manevra kaydından çıkarır.
   */
  stopDetail?: string;
  /**
   * "Pozisyona gelinemedi" durdurmasında nerede durulduğu (kullanıcı turu 3, k07): hangi test/manevra, taraf ve durulan
   * adımın kaydı. Taraf testi ve tekrar testi kayıtları başka yerde saklanmadığı için rapor ("baş en çok ~8°, hedef 15–40°")
   * bunu kullanır. Eski kayıtlarda yok.
   */
  unreachableAt?: { at: number; test: 'side' | 'maneuver' | 'retest' | 'practice'; protocolId: ProtocolId; side: Side; record?: StepRecord };
  /**
   * Taraf testi ya da tekrar testi "Kendimi kötü hissediyorum" ile durduruldu (kullanıcı turu 5, k01). Test kayıtları manevra
   * gibi saklanmadığı ve yarım test sonuç sayılmadığı için (tekrar testi listesine yazılırsa "negatif" sanılır) ayrı tutulur;
   * rapor "… durduruldu: hasta kendini iyi hissetmedi" yazar (testStopText, ui/screens/patient/reportText.ts). Atak açık kalır.
   * Eski kayıtlarda yok.
   */
  testStops?: { at: number; test: 'side' | 'retest'; side: Side; reason: 'USER_FEELS_UNWELL' }[];
  /**
   * Kötü andan (kötü hissetme ya da uzun baş dönmesiyle durdurma) sonra yeniden başlarken "Geçti mi?" sorusuna "Geçti"
   * yanıtının zamanı (yeni kullanıcı turu 1, L5-2; state/episodes.ts `lastBadMoment`). Eski kayıtlarda yok.
   */
  feelBetterAt?: number;
  /**
   * İki taraflı testte tamamlanan birinci taraf (L5-3): uygulamadan çıkılıp dönülünce yapılmış test kaybolmaz, ikinci
   * testle sürer (`resumeTarget`). Son taraf testi kaydı yazılınca silinir. Eski kayıtlarda yok.
   */
  sideProgress?: { at: number; order: Side[]; results: SideTestResult[] };
  /**
   * Araştırma kaydı: kullanıcının "Yine de devam et" ile aştığı uyarılar (klinik çalışmada hangi uyarının ne sıklıkla
   * aşıldığı ölçülür). kind: aşılan uyarının kodu (ör. 'NO_DIAGNOSIS', 'RED_FLAG', 'DOSE', 'REFERRAL', 'SIDE_CONFLICT',
   * 'CONTRAINDICATION', 'VERTIGO_TOO_LONG', 'POSITION_UNREACHABLE'); detail: kısa açıklama.
   */
  overrides?: { at: number; kind: string; detail?: string }[];
  /** Atak demo modunda (sanal sensör) yürütüldü (yeni kullanıcı turu 1, y04 #6): eğitim denemesi gerçek tedaviden ayrılsın. */
  simulation?: boolean;
  /** Atağı açan uygulamanın sürümü (package.json); eski kayıtlarda yok. */
  appVersion?: string;
  /** Atağı açan uygulamanın karar kuralları sürümü (DECISION_RULES_VERSION, state/episodes.ts); eski kayıtlarda yok. */
  rulesVersion?: string;
  /**
   * Süren manevranın ara kaydı (yeni kullanıcı turu 1, y01 #6): yürütücü her adımda yazar, manevra bitince silinir. Uygulama
   * manevra sürerken kapanırsa yeniden açılışta "yarıda kaldı (adım n)" manevra kaydına çevrilir (recoverInterruptedManeuvers).
   */
  pendingManeuver?: { at: number; protocolId: ProtocolId; side: Side | null; records: StepRecord[]; assisted?: boolean; manual?: boolean };
  /**
   * Manevra sonrası "Yeni belirti" (inme belirtisi) bildirildikten sonra ana ekrandaki ve akıştaki kırmızı 112 şeridini
   * kapatan yanıt (yeni kullanıcı turu 1, L2-1): 'ok' "Belirtiler geçti, iyiyim", 'called112' "112'yi aradım". Şerit bu
   * yanıta ya da 24 saate dek görünür (state/neuroAlert.ts). Eski kayıtlarda yok.
   */
  neuroAlertAck?: { at: number; by: 'ok' | 'called112' };
  /**
   * Belirti şiddeti 0 (yok) – 10 (en kötü), isteğe bağlı (yeni kullanıcı turu 2, M1-11; y04 #2): settings.askVas açıkken
   * atak başında (before, bir kez) sorulur; "Geç" denirse yazılmaz. Ev raporu v3'te taşınır, çalışma CSV'sine yazılır.
   * Eski kayıtlarda ve ayar kapalıyken yok. `after` yalnız eski kayıtlarda (geriye dönük okunur): yeni kayıtta manevradan
   * sonraki değer manevraya yazılır (`ManeuverLog.vasAfter`; N1-8).
   */
  vas?: { before?: number; after?: number };
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
  /** Reçetenin dayandığı bulgu imzası (tanı varsa tanının imzası): bulgu/tanı değişirse eski QR gösterilmez. */
  prescriptionFindingsKey?: string;
  /**
   * Reçete uyarısına rağmen yazıldı (yeniden tasarım: klinisyende reçete kilidi yok). kind: `RX_<neden>` (ör.
   * RX_NO_DIAGNOSIS, RX_LONG_RESPONSE); reason: klinisyenin gerekçesi. HBYS notuna ve rapora "Uyarıya rağmen reçete: …"
   * olarak yazılır. Hasta tarafında atak (Episode) olmadığı için kayıt muayenededir.
   */
  rxOverride?: { at: number; kind: string; reason: string };
  notes?: string;
  /**
   * Hastanın QR/bağlantıyla getirdiği ev dönemi raporları (core/reportShare.ts; kullanıcı turu 3, F4). Veri bağlantının
   * içindedir; bağlantı (token) aynen saklanır, ekranda ve HBYS notunda her seferinde çözülür. Eski kayıtlarda yok.
   */
  homeReports?: HomeReportRecord[];
  /**
   * Teste başlamadan güvenlik kontrolü (yeni kullanıcı turu 2, y08 #3, y05 #4): spontan nistagmus, nörolojik bulgu, boyun
   * sorunu. Uyarıdır, testleri engellemez; rapora ve HBYS notuna yazılır. Yanıtlanmayan maddenin alanı yoktur. Eski kayıtlarda yok.
   */
  safetyCheck?: { at: number; spontaneous?: boolean; neuro?: boolean; neck?: boolean };
}

/** Muayeneye eklenmiş ev dönemi raporu. */
export interface HomeReportRecord {
  /** Raporun kimliği (bağlantının sağlama toplamı): aynı rapor iki kez eklenmez. */
  id: string;
  token: string;
  importedAt: number;
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
