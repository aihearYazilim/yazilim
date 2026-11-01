/**
 * Hasta atak akışı (yeniden tasarım: kilit yok, cesur tanı ve manevra, akışkan; docs/inceleme/yeniden-tasarim/BRIEF.md).
 * Modlar:
 *   start    — yeni atak (ya da yarım kalan ataka devam): güvenlik listesi → (alt tip) → hazırlık → tanıtma → iki taraflı
 *              test → uygulamanın kararı → manevra → sonrası
 *   retest   — 1 saat / sabah tekrar testi: (güvenlik listesi) → hazırlık → tanıtma → tekrar testi → sonuç
 *   treat    — tekrar testi pozitifken yeniden manevra
 *   practice — deneme manevrası (atak kaydı tutulmaz)
 *
 * Hiçbir ekran kullanıcıyı kilitlemez: eski engeller (kırmızı bayrak, kontrendikasyon, doz, hekime yönlendirme, taraf
 * çelişkisi, iki taraf/tetiklenmeme/atipik süre) uyarı + "Yine de devam et"tir ve her aşma `logOverride` ile atağa yazılır.
 * Uygulamanın kendi kararları da `APP_DECISION` olarak yazılır (klinik araştırmada incelenir).
 */
import { unreachableStopDetail } from './reportText';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Calibration } from '../../../core/calibration';
import { rxCanalOf, rxPcManeuver, rxProtocolId } from '../../../core/prescription';
import type { ProtocolId, Side } from '../../../core/protocols';
import { sideName } from '../../../core/protocols';
import { SAFETY_STOP_TEXT, stopTextFor, vertigoSummary } from '../../../core/runner';
import {
  contraindicationsFor,
  evaluateRedFlags,
  RED_FLAGS,
  redFlagReferText,
  type RedFlagQuestion,
  type SideDecision,
  type SideTestResult,
  type StopAction
} from '../../../core/safety';
import {
  decideHorizontal,
  decidePosterior,
  decisionLogDetail,
  episodeCanal,
  HC_PROTOCOLS,
  HC_TEST,
  isClean,
  maneuverFor,
  retestFor,
  rollResults,
  sideOrder,
  type BoldDecision,
  type HomeCanal
} from '../../../core/patientDecision';
import {
  doseFor,
  doseLimitText,
  dxSideCheck,
  dxWarnText,
  episodeSide,
  rememberAnswered,
  formatDateTime,
  formatTime,
  EARLY_RETEST_MS,
  nightNote,
  needsRedFlags,
  nextAction,
  nextMorning,
  pendingReferral,
  doseLimitsFor,
  recentKnownSide,
  recurrenceWarning,
  reopenEpisode,
  rxFirstEpisode,
  practiceAllowed,
  PRACTICE_PER_DAY,
  sameDayReopenable,
  startBlockedByPlan,
  startDose,
  subtypeRemembered,
  totalPauses,
  type NextAction,
  lastBadMoment,
  resumeTarget,
  type ResumeTarget,
  singleSideTestSide,
  vomitPause,
  VOMITING_OVERRIDE_KIND,
  episodeStamp,
  saveManeuverCheckpoint,
  withoutCheckpoint
} from '../../../state/episodes';
import { logOverride } from '../../../state/overrides';
import { ackNeuroAlert, emergencyOverridden, neuroAlertFor } from '../../../state/neuroAlert';
import { NeuroAlertStrip } from './NeuroAlert';
import { activeEpisode, store, uid, useData } from '../../../state/store';
import type { Episode, ManeuverLog } from '../../../state/types';
import { CheckList, Choice, choiceSpeech, ListenAgain, Segmented, takeTapRect, useTapLock } from '../../components/Controls';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Calibrate } from '../Calibrate';
import { HoldButton, RunnerView, type RunnerOutcome } from '../RunnerView';
import { BedSetup } from '../Illustrations';
import { speech } from '../../../platform/speech';
import { unlockAudio } from '../../../platform/feedback';
import { useMotion } from '../../../platform/MotionContext';
import { PhoneLiftDetector } from './phoneLift';
import { keepAwake, releaseAwake } from '../../../platform/wakeLock';
import { haptics } from '../../../platform/haptics';
import { tones } from '../../../platform/tones';
import { downloadReminder } from '../../../platform/reminders';
import { HapticLegend } from '../../components/HapticLegend';
import {
  AFTER_SEVERE_SPOKEN,
  afterManeuverSpoken,
  chainGateText,
  choiceSpeechParts,
  CONFIRM_GAP_PX,
  confirmBackPad,
  confirmPlacement,
  CONTRA_WARN_SPOKEN,
  CONTRA_WARN_TITLE,
  contraWarnText,
  decisionScreen,
  EMERGENCY_REMINDER_SPOKEN,
  EMERGENCY_REMINDER_TEXT,
  NEURO_END_SPOKEN,
  NEURO_END_TEXT,
  NEURO_END_TITLE,
  NOT_TRIGGERED_NOTE,
  overrideCountdownLabel,
  RED_FLAG_OVERRIDE_MIN_MS,
  redFlagIcon,
  DOSE_WARN_TITLE,
  doseWarnSpoken,
  LONG_IN_MANEUVER_NOTE,
  LOOK_AT_SCREEN,
  nextSideGateText,
  planWarn,
  PREP_HELPER_ITEMS,
  prepHearingText,
  prepItems,
  prepSpokenFull,
  prepSpokenShort,
  RED_FLAG_WARN_TITLE,
  redFlagAnswers,
  RED_FLAG_CONFIRM_CONSEQUENCE,
  redFlagCheckSub,
  redFlagCheckText,
  redFlagToggleSpoken,
  RED_FLAGS_SPOKEN,
  RED_FLAGS_TITLE,
  redFlagsSpokenFull,
  redFlagWarnSpoken,
  RETEST_LONG_SPOKEN,
  RETEST_LONG_TEXT,
  safetyStopSpoken,
  safetyStopTextFor,
  type DecisionChoice,
  type SpokenOption,
  SUBTYPE_OPTIONS,
  SUBTYPE_TITLE,
  type SubtypeAnswer,
  unreachableStopSpoken,
  UNWELL_END_TITLE,
  unwellEndSpoken,
  unwellEndText,
  withoutBppv,
  feelCheckLead,
  feelCheckSpoken,
  feelCheckTitle,
  resumeManeuverNote,
  resumeSideNote,
  RETRY_AFTER_LONG_NOTE,
  singleSideNote,
  STILL_UNWELL_SPOKEN,
  STILL_UNWELL_TEXT,
  STILL_UNWELL_TITLE,
  VOMIT_WARN_TITLE,
  vomitWarnSpoken,
  vomitWarnText
} from './flowText';
import { ForeheadTap } from '../../components/ForeheadTap';

type Mode = 'start' | 'retest' | 'treat' | 'practice';

/** Yürütücü sahneleri (telefon alında). */
/** note: yürütücü başında okunan ve ekranda gösterilen kısa not (kaldığınız yerden, tek taraf testi; L5-3, L5-7). */
type RunStage =
  | { k: 'sideRun'; order: Side[]; results: SideTestResult[]; chained?: boolean; auto?: boolean; note?: string }
  /** Yatay kanal testi (sırtüstü baş çevirme; iki yan tek koşuda). */
  | { k: 'rollRun'; chained?: boolean; auto?: boolean }
  /** then: iki tarafa sırayla manevrada sonraki taraf. */
  | { k: 'maneuver'; side: Side; protocolId: ProtocolId; then?: Side; chained?: boolean; auto?: boolean; note?: string }
  | { k: 'retestRun'; side: Side; protocolId: ProtocolId; chained?: boolean; auto?: boolean };

type Stage =
  | RunStage
  /** Kurulumda işaretlenen kontrendikasyon: uyarı + "Yine de devam et". */
  | { k: 'contra' }
  | { k: 'practiceLimit' }
  /** Manevra yapılmış atakta sıradaki adım (tekrar testi) bekleniyor: uyarı + "Yine de manevra yap". */
  | { k: 'plan'; na: NextAction }
  /** Kusma bildirilen günde (sabaha dek) manevra uyarısı + "Yine de devam et" (L5-1; aşma `VOMITING`). */
  | { k: 'vomit'; until: number; next?: Stage; look?: boolean }
  /** Kötü andan sonra yeniden başlarken "Geçti mi?" (L5-2). */
  | { k: 'feelCheck'; kind: 'unwell' | 'vertigoLong'; what: 'maneuver' | 'side' | 'retest' }
  /** Doz/gün sınırı: uyarı + "Yine de devam et". next: devam edilince (yoksa giriş denetimleri sürer). */
  | { k: 'dose'; text: string; reason: string; next?: Stage; look?: boolean }
  /** Güvenlik soruları: tek ekran işaret listesi. */
  | { k: 'redflags' }
  /** Kırmızı bayrak uyarısı (112/hekim bilgisi) + "Yine de devam et". after: manevra sonrası yeni belirti. */
  | { k: 'stop'; action: StopAction; triggered: RedFlagQuestion[]; after?: boolean }
  /** Tek hazırlık ekranı; ardından telefon alna ve kesintisiz akış. */
  | { k: 'prep' }
  /** saved: kayıtlı tanıtma kullanılacak (sahneye girerken belirlenir). */
  | { k: 'calibrate'; saved: boolean }
  /** Alt tip: tek soru (varsayılan arka kanal). */
  | { k: 'subtype' }
  /** Geçerli reçete varken: bu, muayene edilen baş dönmesinin devamı mı (testsiz kısa yol yalnız o zaman)? */
  | { k: 'rxSame' }
  | { k: 'sideRest'; order: Side[]; results: SideTestResult[] }
  /** Temiz karar: telefon alından inmeden manevraya geçiş (tek dokunuş, ekranın her yeri). */
  | { k: 'chainGate'; d: BoldDecision; dxWarn?: string | null }
  /** İki tarafa sırayla manevrada ikinci tarafa geçiş. */
  | { k: 'nextSideGate'; side: Side; protocolId: ProtocolId }
  | { k: 'stronger'; canal: HomeCanal; results: SideTestResult[] }
  /** Uyarılı karar ya da taraf seçimi. look: telefon alında olabilir ("Telefonu alın" önce söylenir). */
  | { k: 'decision'; d: BoldDecision; look: boolean; single?: SideTestResult }
  | { k: 'practiceSide' }
  | { k: 'after'; side: Side }
  /** Bugün manevrayla kapatılmış atak yeniden açılıyor (yeni atak açılmaz; 1 saatlik test korunur). */
  | { k: 'reopen'; id: string }
  | {
      k: 'end';
      tone: 'ok' | 'warn' | 'danger' | 'info';
      title: string;
      text: string;
      testid: string;
      /** treat: yeniden manevra düğmesi; rest: 10 dk dinlenme sayacı (manevra sonrası). */
      extra?: 'treat' | 'rest';
      /** treat düğmesine basılınca yazılacak aşma kaydı (ör. uzun baş dönmesine rağmen tekrar). */
      treatOverride?: string;
      remindAt?: number;
      remindTitle?: string;
      /** Ekran açılınca okunan kısa metin; tam metin ekranda ve "Ayrıntıyı dinle"de. */
      spoken?: string;
      /** Kartın altında ek uyarı (ör. manevrada uzun baş dönmesi). */
      note?: string;
      /** Güvenlik durdurmasından sonra "Yeniden dene": aynı test/manevra; aşma kaydı `kind`. */
      retry?: { run: RunStage; kind: string };
      /** Büyük "112'yi ara" düğmesi (manevra sonrası yeni belirti uyarısı aşıldı; L2-1). */
      call112?: boolean;
      /** "Yeniden dene"nin üstündeki kısa uyarı (uzun baş dönmesiyle durdurma; L5-2). */
      retryNote?: string;
      /** "Yine de devam et" (ör. "Hâlâ kötüyüm"den sonra): giriş denetimleri sürer; aşma `kind` ile yazılır. */
      override?: { label: string; testid: string; kind: string; detail: string };
    };

function updateEpisode(id: string, fn: (e: Episode) => Episode) {
  store.update((d) => ({ ...d, episodes: d.episodes.map((e) => (e.id === id ? fn(e) : e)) }));
}

const isRun = (s: Stage): s is RunStage => s.k === 'sideRun' || s.k === 'rollRun' || s.k === 'maneuver' || s.k === 'retestRun';

export function EpisodeFlow() {
  const { mode: modeParam } = useParams();
  const mode = (['start', 'retest', 'treat', 'practice'].includes(modeParam ?? '') ? modeParam : 'start') as Mode;
  const d = useData();
  const nav = useNavigate();
  const profile = d.patient;
  const [episodeId, setEpisodeId] = useState<string | null>(() => activeEpisode(d)?.id ?? null);
  const [cal, setCal] = useState<Calibration | null>(null);
  /** Son yerleştirme ölçümü: zincirdeki (telefon alından inmeden) sonraki test/manevra bunu kullanır. */
  const [placed, setPlaced] = useState<{ cal: Calibration; at: number } | null>(null);
  const onPlaced = (c: Calibration) => {
    setCal(c);
    setPlaced({ cal: c, at: Date.now() });
  };
  const CHAIN_MAX_MS = 10 * 60 * 1000;
  /** Yürütücü bayrakları: zincir (telefon alında, ölçüm az önce yapıldı) ya da hazırlıktan sonra kendiliğinden başlama. */
  const runFlags = (st: { chained?: boolean; auto?: boolean }): { chained: boolean; autoStart: boolean; calibration: Calibration | null } =>
    st.chained && (!cal || (placed && Date.now() - placed.at < CHAIN_MAX_MS))
      ? { chained: true, autoStart: false, calibration: placed?.cal ?? cal }
      : { chained: false, autoStart: !!st.auto || !!st.chained, calibration: cal };
  /** Bu akışta tanıtma/yerleştirme yapıldıysa (sonraki test/manevra hazırlıksız başlar). */
  const calibratedRef = useRef(false);
  /** Hazırlık ekranından geçildi: sonraki ilk yürütücü kendiliğinden başlar. */
  const fromPrepRef = useRef(false);
  /** Az önce ayrı tanıtma ekranında ölçüldü (telefon alında): yerleştirme ölçümü tekrarlanmaz. */
  const freshCalRef = useRef(false);
  /** Hazırlık ve tanıtmadan sonra başlayacak ilk yürütücü sahnesi. */
  const nextRunRef = useRef<RunStage | null>(null);
  const practiceSideRef = useRef<Side | null>(null);
  /** afterCalibration'dan çıkan ilk yürütücü sahnesinin bayrakları. */
  const firstRunFlags = (): { chained?: boolean; auto?: boolean } => {
    if (!fromPrepRef.current) return {};
    fromPrepRef.current = false;
    const fresh = freshCalRef.current;
    freshCalRef.current = false;
    return fresh ? { chained: true } : { auto: true };
  };
  /** Kayıtlı kalibrasyon varken tanıtma ekranı atlanır (telefon her manevra başında yine yerleştirilip ölçülür). */
  const [forceCal, setForceCal] = useState(false);
  /** Yeniden tanıtmadan sonra dönülecek sahne (ör. 2. taraf testi: 1. tarafın sonucu kaybolmasın). */
  const resumeRef = useRef<Stage | null>(null);
  /** afterCalibration bu tanıtma sahnesinde çalıştı mı (tek sefer). */
  const calHandledRef = useRef(false);
  /** Manevrada ≥1 dk baş dönmesi oldu: manevra sonu ekranında not. */
  const longVertigoRef = useRef(false);
  /** Bu akışta aşılan giriş uyarıları (bir kez sorulur). */
  const contraOkRef = useRef(false);
  const doseOkRef = useRef(false);
  const planOkRef = useRef(false);
  const practiceOkRef = useRef(false);
  /** Kusma uyarısı aşıldı (L5-1). */
  const vomitOkRef = useRef(false);
  /** "Geçti mi?" yanıtlandı ya da aşıldı (L5-2). */
  const feelOkRef = useRef(false);
  /** Atak açılmadan önce yazılmak istenen kayıtlar (atak açılınca yazılır). */
  const pendingLogsRef = useRef<{ kind: string; detail?: string }[]>([]);
  const recalibrate = () => {
    resumeRef.current = stage;
    setForceCal(true);
    setStage({ k: 'calibrate', saved: false });
  };
  /** Yürütücü hiç başlatılmadan kapatıldı: kayıt yazma, ana ekrana dön. */
  const notStarted = (o: RunnerOutcome) => {
    if (o.started !== false) return false;
    nav('/hasta', { replace: true });
    return true;
  };

  // Deneme manevrasında "aynı baş dönmesi mi" anlamsızdır; tanısı olmayan kişiye de sorulmaz (karşılaştıracağı tanı yok).
  const diagnosed = !!profile?.diagnosedByDoctor || !!profile?.prescription;
  const flags = mode === 'practice' || !diagnosed ? RED_FLAGS.filter((q) => q.id !== 'same') : RED_FLAGS;

  /** Reçeteli kısa yol yalnız muayene edilen baş dönmesinin devamıysa (hasta "geçip yeniden başladı" derse tam akış). */
  const rxBypassRef = useRef(false);

  // Arka kanal yolu: reçetedeki arka kanal manevrası ya da Epley (yatay kanal reçetesinde de arka kanal yolu Epley'dir).
  const pcManeuver: 'epley' | 'semont' = rxPcManeuver(profile?.prescription);

  /** Atağın manevrası: son manevra, yoksa kanala göre. */
  const episodeProtocol = (ep: Episode | null | undefined): ProtocolId => {
    const last = ep?.maneuvers[ep.maneuvers.length - 1];
    if (last) return last.protocolId;
    // Reçeteli kısa yolda manevra reçetenin manevrasıdır (yatay kanal reçetesinde BBQ roll), ilk manevra yazılmadan önce de.
    if (ep?.rxShortcut && profile?.prescription) return rxProtocolId(profile.prescription);
    return maneuverFor(episodeCanal(ep), pcManeuver);
  };

  /** Bilinen (şüpheli) taraf: reçete, kurulumdaki tanı ya da son atak. Test sırası ve tetiklenmeyen testte öneri. */
  const knownSide = (): Side | null => {
    const cur = store.get();
    const p = cur.patient;
    const rx = recentKnownSide(p);
    if (rx) return rx;
    if (p && p.side !== 'unknown') return p.side;
    const last = [...cur.episodes].sort((a, b) => b.startedAt - a.startedAt).find((e) => e.side);
    return last?.side ?? null;
  };

  /** Araştırma kaydı. Deneme manevrasında atak yok: yazılmaz. Atak yoksa açılınca yazılır. */
  const note = (kind: string, detail?: string) => {
    if (mode === 'practice') return;
    if (!logOverride(kind, detail)) pendingLogsRef.current.push({ kind, detail });
  };

  const ensureEpisode = (): string => {
    const cur = store.get();
    const existing = activeEpisode(cur);
    let id: string;
    if (existing) id = existing.id;
    else {
      const e: Episode = {
        id: uid(),
        startedAt: Date.now(),
        side: null,
        protocolId: pcManeuver,
        redFlags: [],
        sideTests: [],
        maneuvers: [],
        retests: [],
        status: 'active',
        // Araştırma kaydı: sürüm ve demo modu (yeni kullanıcı turu 1, y04 #6).
        ...episodeStamp(cur.settings)
      };
      // Eski kilitlerin yerine bilgi kayıtları (atak açılırken bir kez): tanısız kullanım, yatay kanal tanısı, bekleyen
      // hekime yönlendirme.
      const p = cur.patient;
      const info: { kind: string; detail?: string }[] = [];
      if (p && !p.diagnosedByDoctor && !p.prescription) info.push({ kind: 'NO_DIAGNOSIS', detail: 'Hekim tanısı olmadan kullanım' });
      if (p?.diagnosedByDoctor && p.canal === 'HC') info.push({ kind: 'GATE_HORIZONTAL_CANAL', detail: 'Hekim tanısı yatay kanal; evde yatay kanal testi ve BBQ roll' });
      const ref = pendingReferral(cur);
      if (ref) info.push({ kind: 'REFERRAL', detail: `Önceki atak: ${ref.status}${ref.endNote ? ` (${ref.endNote})` : ''}` });
      pendingLogsRef.current = [...info, ...pendingLogsRef.current];
      store.update((x) => ({ ...x, episodes: [...x.episodes, e] }));
      id = e.id;
    }
    setEpisodeId(id);
    const queued = pendingLogsRef.current;
    pendingLogsRef.current = [];
    for (const q of queued) logOverride(q.kind, q.detail, id);
    return id;
  };

  const setEpisodeSide = (s: Side) => {
    if (mode === 'practice') return;
    const id = ensureEpisode();
    updateEpisode(id, (e) => ({ ...e, side: s }));
  };

  // ---- Giriş denetimleri: her biri uyarı + "Yine de devam et" (bir kez) ---------------------------------------------

  /** Doz/gün sınırı (yan etkisiz). */
  const doseWarnStage = (next?: Stage, look = false): Stage | null => {
    const cur = store.get();
    const now = Date.now();
    // Kusma bildirilen günde önce kusma uyarısı (doz uyarısı değil; y07).
    if (!vomitOkRef.current) {
      const vp = vomitPause(cur, now);
      if (vp) return { k: 'vomit', until: vp.until, next, look };
    }
    if (doseOkRef.current) return null;
    const ep = activeEpisode(cur);
    const ds = ep && mode !== 'practice' ? doseFor(cur, ep, now) : startDose(cur, now);
    if (ds.allowed) return null;
    return { k: 'dose', text: doseLimitText(ds, cur, now), reason: ds.reason, next, look };
  };

  /** Manevradan önce doz denetimi: sınır doluysa uyarı ekranı (devam edilince `next`). */
  const doseGate = (next: Stage, look = false): boolean => {
    const w = doseWarnStage(next, look);
    if (!w) return true;
    setStage(w);
    return false;
  };

  /** Akışa girişte sırayla: deneme sınırı, aynı gün yeniden açma, bekleyen tekrar testi, kontrendikasyon, doz, güvenlik listesi. */
  const entryStage = (): Stage => {
    const cur = store.get();
    const now = Date.now();
    const ep = activeEpisode(cur);
    if (mode === 'practice' && !practiceOkRef.current && !practiceAllowed(cur, now)) return { k: 'practiceLimit' };
    if (mode === 'start' || mode === 'treat') {
      const re = !ep && mode === 'start' ? sameDayReopenable(cur, now) : null;
      if (re) return { k: 'reopen', id: re.id };
      const plan = startBlockedByPlan(ep, now);
      // Kusmadan sonra: gerekçe kusma, sabah testi saati ana ekrandakiyle aynı (L5-1; y07).
      if (plan && plan.kind === 'morning-retest' && plan.afterVomit && !vomitOkRef.current && !planOkRef.current) return { k: 'vomit', until: plan.at };
      if (plan && plan.kind !== 'treat-again' && !planOkRef.current) return { k: 'plan', na: plan };
    }
    // Kötü andan (kötü hissetme, uzun baş dönmesiyle durdurma) sonra yeniden başlarken önce "Geçti mi?" (L5-2; y07).
    if (mode !== 'practice' && ep && !feelOkRef.current) {
      const bad = lastBadMoment(ep);
      if (bad) return { k: 'feelCheck', kind: bad.kind, what: bad.what };
    }
    const contra = cur.patient?.contraindications ?? [];
    const contraLogged = !!ep?.overrides?.some((o) => o.kind === 'CONTRAINDICATION');
    if (contra.length > 0 && !contraOkRef.current && (mode === 'practice' || !contraLogged)) return { k: 'contra' };
    if (mode !== 'retest') {
      const w = doseWarnStage();
      if (w) return w;
    }
    if (mode === 'practice' || needsRedFlags(ep, now)) return { k: 'redflags' };
    return afterSafetyStage();
  };

  /** Telefon henüz alna konmadıysa hazırlık; konduysa (bu akışta tanıtıldı) yürütücü kendiliğinden başlar. */
  const prepFor = (run: RunStage): Stage => {
    if (calibratedRef.current) return { ...run, auto: true };
    nextRunRef.current = run;
    return { k: 'prep' };
  };

  /** Yakın tarihli hekim tanısında yalnız o taraf test edilir (L5-7; y02); yoksa iki taraf. */
  const testRunFor = (canal: HomeCanal): RunStage => {
    if (canal === 'HC') return { k: 'rollRun' };
    const single = mode === 'practice' ? null : singleSideTestSide(store.get().patient);
    return single ? { k: 'sideRun', order: [single], results: [], note: singleSideNote(single) } : { k: 'sideRun', order: sideOrder(knownSide()), results: [] };
  };

  /**
   * Kaldığınız yerden (L5-3; y07, y01): hazırlık ekranı yeniden gösterilmez. Kayıtlı tanıtma varsa yürütücü "Başlat"
   * düğmesiyle açılır (dokunuş: ses ve hareket izni); yoksa yalnız tanıtma, ardından telefon alında kendiliğinden sürer.
   */
  const resumeEntry = (rt: ResumeTarget): Stage => {
    const run: RunStage =
      rt.kind === 'maneuver'
        ? { k: 'maneuver', side: rt.side, protocolId: rt.protocolId, note: resumeManeuverNote(rt.side) }
        : { k: 'sideRun', order: rt.order, results: rt.results, note: resumeSideNote(rt.results[rt.results.length - 1]!.side, rt.order[rt.results.length]!) };
    if (calibratedRef.current) return { ...run, auto: true };
    nextRunRef.current = run;
    const saved = !!store.get().patient?.calibration && !forceCal;
    fromPrepRef.current = !saved;
    return { k: 'calibrate', saved };
  };

  /** Güvenlik listesinden sonra (yan etkisiz; ilk sahne hesabında da çağrılır). */
  const afterSafetyStage = (): Stage => {
    const cur = store.get();
    const ep = activeEpisode(cur);
    const p = cur.patient;
    if (mode === 'practice') {
      const known = p?.prescription?.side ?? (p && p.side !== 'unknown' ? p.side : null);
      if (!known) return { k: 'practiceSide' };
      practiceSideRef.current = known;
      return prepFor({ k: 'maneuver', side: known, protocolId: pcManeuver });
    }
    if (mode === 'retest') {
      const na = ep ? nextAction(ep, Date.now()) : null;
      const canal = episodeCanal(ep);
      // Taraf henüz belirlenmediyse ya da hiç manevra yapılmadıysa iki yönlü test.
      if (ep && ((na?.kind === 'morning-retest' && na.needsSideTest) || ep.maneuvers.length === 0)) return prepFor(testRunFor(canal));
      const s = ep ? episodeSide(ep, p) : null;
      if (!s) return noSideStage();
      return prepFor({ k: 'retestRun', side: s, protocolId: retestFor(canal) });
    }
    const rt = resumeTarget(ep, Date.now());
    if (rt) return resumeEntry(rt);
    if (ep && ep.side) return prepFor({ k: 'maneuver', side: ep.side, protocolId: episodeProtocol(ep) });
    if (mode === 'treat') {
      const s = ep ? episodeSide(ep, p) : null;
      if (s) return prepFor({ k: 'maneuver', side: s, protocolId: episodeProtocol(ep) });
    }
    // Önceki test tetiklemedi (sabah yeniden test): aynı kanalın testi.
    if (ep && ep.sideTests.length > 0) return prepFor(testRunFor(episodeCanal(ep)));
    if (rxFirstEpisode(cur) && !rxBypassRef.current) return { k: 'rxSame' };
    return subtypeStage();
  };

  /** Alt tip: bu atakta yanıtlandıysa ya da hekim tanısında kanal biliniyorsa sorulmaz. */
  const subtypeStage = (): Stage => {
    const cur = store.get();
    const ep = activeEpisode(cur);
    const p = cur.patient;
    if (subtypeRemembered(ep, Date.now())) return prepFor(testRunFor(episodeCanal(ep)));
    if (p?.diagnosedByDoctor && (p.canal === 'PC' || p.canal === 'HC')) return prepFor(testRunFor(p.canal));
    return { k: 'subtype' };
  };

  const noSideStage = (): Stage => ({
    k: 'end',
    tone: 'warn',
    title: 'Taraf belirlenmemiş',
    text: 'Bu atakta tedavi edilen taraf bulunamadı. Ana ekrandan atağa yeniden başlayın; kısa test tarafı bulur.',
    testid: 'end-noside'
  });

  const [stage, setStage] = useState<Stage>(entryStage);
  // Sık nüks uyarısı: yeni atağın başında gösterilir. Bu atak da sayılır.
  const [recur] = useState(() =>
    mode === 'start' && !activeEpisode(store.get())
      ? recurrenceWarning([...store.get().episodes.map((e) => e.startedAt), Date.now()], Date.now())
      : null
  );
  // Akıştan çıkınca ekranı açık tutma bırakılır (Bitir/ana ekran).
  useEffect(() => () => void releaseAwake(), []);
  // Akış içinden başka moda geçilince (ör. "Tekrar testini yap") giriş denetimleri baştan.
  const modeRef = useRef(mode);
  useEffect(() => {
    if (modeRef.current === mode) return;
    modeRef.current = mode;
    calibratedRef.current = false;
    nextRunRef.current = null;
    setStage(entryStage());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (stage.k === 'calibrate') calHandledRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage.k]);

  // ---- Kurulum yapılmamış: tek ekranlık kurulum (onam) ----------------------------------------------------------------
  if (!profile?.consentAt) {
    return (
      <Screen title="DengeYol" back="/hasta">
        <div className="card tint-warn stack" data-testid="flow-gate-blocked">
          <p>Önce kısa kurulumu tamamlayın (tek ekran).</p>
        </div>
        <button className="btn primary block" onClick={() => nav('/hasta/kurulum')}>
          Kuruluma git
        </button>
      </Screen>
    );
  }

  // ---- Akış geçişleri --------------------------------------------------------------------------
  /**
   * Tanıtmadan (ya da kayıtlı tanıtmayla) sonra ilk yürütücü sahnesi. c = null: sensör yok, hasta sensörsüz (elle onaylı)
   * devam etmeyi seçti. fresh: ayrı tanıtma ekranında az önce ölçüldü (telefon hâlâ alında).
   */
  const afterCalibration = (c: Calibration | null, fresh = false) => {
    if (calHandledRef.current) return;
    calHandledRef.current = true;
    setCal(c);
    calibratedRef.current = true;
    freshCalRef.current = fresh;
    if (c) store.update((x) => ({ ...x, patient: x.patient ? { ...x.patient, calibration: c } : x.patient }));
    if (c && fresh) setPlaced({ cal: c, at: Date.now() });
    if (resumeRef.current) {
      // Yeniden tanıtmadan dön: telefon alında, ölçüm taze → kaldığı test/manevra kendiliğinden ve ölçümsüz başlar.
      const back = resumeRef.current;
      resumeRef.current = null;
      fromPrepRef.current = false;
      setStage(isRun(back) ? { ...back, chained: fresh, auto: true } : back);
      return;
    }
    const fl = firstRunFlags();
    const run = nextRunRef.current;
    nextRunRef.current = null;
    if (!run) {
      setStage(noSideStage());
      return;
    }
    setStage({ ...run, ...fl });
  };

  /** Manevraya geç (doz denetimiyle). Taraf atağa yazılır. */
  const startManeuver = (side: Side, protocolId: ProtocolId, then?: Side, fl: { chained?: boolean; auto?: boolean } = {}) => {
    setEpisodeSide(side);
    const run: Stage = { k: 'maneuver', side, protocolId, ...(then ? { then } : {}), ...fl };
    if (!doseGate(run, !!fl.chained)) return;
    setStage(run);
  };

  /** Uyarısız güvenlik listesi bitti ya da uyarı aşıldı. */
  const onRedFlagsDone = (checked: string[]) => {
    const answers = redFlagAnswers(flags, checked);
    // Bu cihazda bu metinler yanıtlandı (eski "ilk okunuş kilidi" kaydı; rapor ve ayarlarla uyumlu kalsın).
    store.update((x) => flags.reduce((acc, q) => rememberAnswered(acc, q), x));
    const out = evaluateRedFlags(answers);
    if (mode !== 'practice') {
      const id = ensureEpisode();
      updateEpisode(id, (e) => ({ ...e, redFlags: [...e.redFlags, { at: Date.now(), answers, stopped: out.stop }] }));
    }
    if (out.stop && out.action) setStage({ k: 'stop', action: out.action, triggered: out.triggered });
    else setStage(afterSafetyStage());
  };

  const logSideTest = (results: SideTestResult[], stronger: Side | 'equal' | null, dec: BoldDecision) => {
    if (mode === 'practice') return;
    const id = ensureEpisode();
    // Raporda uygulamanın kararı (taraf ve gerekçe; uyarı varsa adı). Kullanıcının başka seçimi ayrı kayıtta (overrides).
    const decision: SideDecision =
      dec.warn === 'NOT_TRIGGERED'
        ? { kind: 'NOT_TRIGGERED' }
        : dec.side
          ? { kind: 'TREAT', side: dec.side, note: `${dec.warn ? `${DECISION_WARN_NOTE[dec.warn]}. ` : ''}${decisionLogDetail(dec)}` }
          : { kind: 'REFER', reason: 'BOTH_SIDES' };
    // Yarım test kaydı (kaldığınız yerden; L5-3) son taraf testi yazılınca silinir.
    updateEpisode(id, (e) => ({ ...e, sideProgress: undefined, sideTests: [...e.sideTests, { at: Date.now(), results, stronger, decision, canal: dec.canal }] }));
  };

  /**
   * Test sonucundan uygulamanın kararı (BRIEF §2b). Temiz karar: telefon alındaysa tek dokunuşla manevraya geçiş; uyarılı
   * karar: karar ekranı ("Yine de devam et", başka taraf, öbür test, durdur). phoneOn: telefon hâlâ alında.
   */
  const decideAndApply = (canal: HomeCanal, results: SideTestResult[], stronger: Side | 'equal' | null, phoneOn: boolean, single = false) => {
    // Reçete tarafı yalnız aynı kanalın testinde karşılaştırılır (yatay kanal reçetesi → sırtüstü baş çevirme testi).
    const rxSide = profile?.prescription && rxCanalOf(profile.prescription) === canal ? recentKnownSide(profile) : null;
    let dec = (canal === 'PC' ? decidePosterior : decideHorizontal)(results, { stronger, doctorSide: rxSide, suggested: knownSide() });
    if (dec.ask) {
      setStage({ k: 'stronger', canal, results });
      return;
    }
    // Kurulumdaki hekim tanısıyla çelişki (reçete yokken): yakın tarihli tanıda taraf seçimi, eski tanıda kısa uyarı.
    let dxWarn: string | null = null;
    if (canal === 'PC' && dec.side && !dec.both && !rxSide) {
      const chk = dxSideCheck(profile, dec.side);
      if (chk.kind !== 'ok') {
        const id = ensureEpisode();
        updateEpisode(id, (e) => ({ ...e, sideConflictNote: chk.note }));
        if (chk.kind === 'refer' && profile.side !== 'unknown') dec = { ...dec, warn: dec.warn ?? 'SIDE_CONFLICT', doctorSide: profile.side };
        else if (chk.kind === 'warn') dxWarn = dxWarnText(chk.dxSide, dec.side);
      }
    }
    logSideTest(results, stronger, dec);
    note('APP_DECISION', decisionLogDetail(dec));
    if (isClean(dec)) {
      if (phoneOn) {
        setEpisodeSide(dec.side!);
        setStage({ k: 'chainGate', d: dec, dxWarn });
      } else startManeuver(dec.side!, maneuverFor(canal, pcManeuver), undefined, { auto: true });
      return;
    }
    // Tek taraf testi (hekim tanısı; L5-7) tetiklemediyse karar ekranında "Öbür tarafı da test et" de sunulur.
    const one = single && results.length === 1 && !results[0]!.safetyStopped ? results[0] : undefined;
    setStage({ k: 'decision', d: dec, look: phoneOn, ...(one ? { single: one } : {}) });
  };

  /** Karar ekranında seçim. Uyarı aşıldıysa REFER_<neden> / SIDE_CONFLICT; öneriden farklı seçim USER_CHOICE. */
  const onDecision = (v: DecisionChoice, dec: BoldDecision, single?: SideTestResult) => {
    const warnKind = dec.warn === 'SIDE_CONFLICT' ? 'SIDE_CONFLICT' : dec.warn ? `REFER_${dec.warn}` : null;
    const protocolId = maneuverFor(dec.canal, pcManeuver);
    if (v === 'go:R' || v === 'go:L') {
      const s: Side = v === 'go:R' ? 'R' : 'L';
      const differs = !!dec.side && s !== dec.side;
      const detail =
        dec.warn === 'SIDE_CONFLICT'
          ? `${s === dec.side ? 'Test tarafı' : 'Hekimin dediği taraf'}: ${sideName(s)}`
          : `${sideName(s)} taraf${differs ? ` (uygulamanın önerisi: ${sideName(dec.side!)})` : ''}`;
      if (warnKind) note(warnKind, detail);
      else if (differs || !dec.side) note('USER_CHOICE', detail);
      // Seçimden sonra manevra doğrudan başlar (ayrı "Başlat" ekranı ve ikinci "Kim yapıyor" sorusu yok; y01).
      startManeuver(s, protocolId, undefined, { auto: true });
      return;
    }
    if (v === 'both') {
      const first: Side = dec.side ?? 'R';
      const second: Side = first === 'R' ? 'L' : 'R';
      note(warnKind ?? 'USER_CHOICE', `İki tarafa sırayla: önce ${sideName(first)}, sonra ${sideName(second)}`);
      startManeuver(first, protocolId, second, { auto: true });
      return;
    }
    if (v === 'test:other' && single) {
      // Tek taraf testi tetiklemedi: öbür taraf da test edilir; karar iki sonuçla verilir (L5-7).
      const other: Side = single.side === 'R' ? 'L' : 'R';
      note('USER_CHOICE', `Hekimin dediği taraf tetiklemedi; ${sideName(other)} taraf da test edildi`);
      setStage(prepFor({ k: 'sideRun', order: [single.side, other], results: [single] }));
      return;
    }
    if (v === 'test:PC' || v === 'test:HC') {
      const canal: HomeCanal = v === 'test:HC' ? 'HC' : 'PC';
      note('USER_CHOICE', canal === 'HC' ? 'Yatay kanal testine geçildi' : 'Arka kanal (yatarak) testine geçildi');
      setStage(prepFor(testRunFor(canal)));
      return;
    }
    // Durdur
    if (dec.warn === 'NOT_TRIGGERED') {
      setStage({
        k: 'end',
        tone: 'info',
        title: 'Bugün baş dönmesi başlamadı',
        remindAt: nextMorning(Date.now()),
        remindTitle: 'DengeYol: sabah testi',
        text: `${NOT_TRIGGERED_NOTE} Kristaller kendiliğinden yerine oturmuş da olabilir: yarın sabah yeniden test edelim.`,
        testid: 'end-not-triggered'
      });
      return;
    }
    setStage({
      k: 'end',
      tone: 'warn',
      title: 'Manevra yapılmadı',
      text: 'Hazır olduğunuzda ana ekrandan yeniden başlayabilirsiniz. Baş dönmesi sürerse hekiminize ya da odyoloğunuza başvurun; raporunuzu götürün.',
      testid: 'end-decision-stop'
    });
  };

  /** Pozisyona gelinemedi: test/manevra durdu. Nerede durulduğu rapora yazılır; kilit yok. */
  const unreachable = (o: RunnerOutcome) => o.phase === 'safetyStop' && o.state.stopReason === 'POSITION_UNREACHABLE';
  const stopUnreachable = (o: RunnerOutcome, test: 'side' | 'maneuver' | 'retest', protocolId: ProtocolId, side: Side, retry: RunStage) => {
    const recs = o.state.records;
    const record = recs.find((r) => r.unreachable) ?? recs[recs.length - 1];
    const now = Date.now();
    const stopDetail = unreachableStopDetail(test === 'side' ? 'side-test' : test, protocolId, side, recs);
    const ep = activeEpisode(store.get());
    if (mode !== 'practice' && ep) {
      const where = { at: now, test, protocolId, side, ...(record ? { record } : {}) };
      updateEpisode(ep.id, (e) => ({ ...e, unreachableAt: where, stopDetail }));
    }
    const helper = store.get().settings.assist === 'helper';
    const stopText = stopTextFor('POSITION_UNREACHABLE', recs);
    setStage({
      k: 'end',
      tone: 'warn',
      title: 'Pozisyona gelinemedi',
      text: `${safetyStopTextFor(stopText, helper)} Durulan yer: ${stopDetail}.`,
      testid: 'end-unreachable',
      spoken: unreachableStopSpoken(stopText, helper),
      retry: { run: retry, kind: 'POSITION_UNREACHABLE' }
    });
  };

  /** Test "Kendimi kötü hissediyorum" ile durduruldu: "Dinlenin" ekranı; atağa yazılır (atak açık kalır). */
  const stopUnwell = (test: 'side' | 'retest', side: Side) => {
    if (mode !== 'practice') {
      const id = test === 'side' ? ensureEpisode() : activeEpisode(store.get())?.id;
      if (id) updateEpisode(id, (e) => ({ ...e, testStops: [...(e.testStops ?? []), { at: Date.now(), test, side, reason: 'USER_FEELS_UNWELL' as const }] }));
    }
    setStage({ k: 'end', tone: 'warn', title: UNWELL_END_TITLE, text: unwellEndText('test'), testid: 'end-unwell', spoken: unwellEndSpoken('test') });
  };

  const abortedEnd = (what: 'Test' | 'Manevra', extraNote?: string): Stage => ({
    k: 'end',
    tone: 'info',
    title: `${what} yarıda bırakıldı`,
    text: 'Hazır olduğunuzda ana ekrandan yeniden başlayabilirsiniz.',
    testid: 'end-aborted',
    ...(extraNote ? { note: extraNote } : {})
  });

  const onSideRunExit = (o: RunnerOutcome, order: Side[], results: SideTestResult[]) => {
    if (notStarted(o)) return;
    const side = order[results.length]!;
    if (unreachable(o)) return stopUnreachable(o, 'side', 'dix-hallpike', side, { k: 'sideRun', order, results });
    if (o.phase === 'aborted' && o.state.stopReason === 'USER_FEELS_UNWELL') return stopUnwell('side', side);
    if (o.phase === 'aborted') return setStage(abortedEnd('Test'));
    const rec = o.state.records.find((r) => r.stepId === 'dh-lie');
    const v = rec ? vertigoSummary(rec) : null;
    const res: SideTestResult = {
      side,
      vertigo: !!v,
      latencySec: v?.latencySec ?? null,
      durationSec: v?.durationSec ?? null,
      safetyStopped: o.phase === 'safetyStop'
    };
    const all = [...results, res];
    if (o.phase === 'safetyStop') {
      // Uzun baş dönmesiyle durduruldu: öbür taraf test edilmeden karar (uyarılı; kullanıcı ekrana bakıyor).
      decideAndApply('PC', all, null, false);
      return;
    }
    if (all.length < order.length) {
      // Yapılmış taraf testi uygulamadan çıkılınca kaybolmasın (L5-3; y07): ikinci testle sürülür.
      if (mode !== 'practice') {
        const id = ensureEpisode();
        updateEpisode(id, (e) => ({ ...e, sideProgress: { at: Date.now(), order, results: all } }));
      }
      setStage({ k: 'sideRest', order, results: all });
    } else decideAndApply('PC', all, null, true, order.length === 1);
  };

  const onRollExit = (o: RunnerOutcome) => {
    if (notStarted(o)) return;
    if (unreachable(o)) return stopUnreachable(o, 'side', HC_TEST, 'R', { k: 'rollRun' });
    if (o.phase === 'aborted' && o.state.stopReason === 'USER_FEELS_UNWELL') return stopUnwell('side', 'R');
    if (o.phase === 'aborted') return setStage(abortedEnd('Test'));
    decideAndApply('HC', rollResults(o.state.records), null, o.phase !== 'safetyStop');
  };

  const logManeuver = (o: RunnerOutcome, side: Side, protocolId: ProtocolId) => {
    if (mode === 'practice') {
      if (o.phase === 'done' || o.state.records.length > 1) {
        store.update((x) => ({ ...x, practiceLog: [...(x.practiceLog ?? []).slice(-20), Date.now()] }));
      }
      return;
    }
    const id = ensureEpisode();
    const log: ManeuverLog = {
      id: uid(),
      at: Date.now(),
      protocolId,
      side,
      completed: o.phase === 'done',
      stopReason: o.state.stopReason,
      records: o.state.records,
      manual: o.manual,
      // Raporda "yakını yaptırdı": o anki ayar manevrayla birlikte saklanır.
      assisted: store.get().settings.assist === 'helper',
      // Raporda "N kez duraklatıldı".
      pauses: totalPauses(o.state.records)
    };
    // Atağın manevrası yapılana göre güncellenir (yatay kanalda BBQ roll; yeni kullanıcı turu 1, y04 #2); ara kayıt silinir.
    const sim = store.get().settings.simulation;
    updateEpisode(id, (e) => ({ ...withoutCheckpoint(e), side, protocolId, ...(sim ? { simulation: true } : {}), maneuvers: [...e.maneuvers, log] }));
  };

  const onManeuverExit = (o: RunnerOutcome, st: Extract<Stage, { k: 'maneuver' }>) => {
    if (notStarted(o)) return;
    const { side, protocolId } = st;
    logManeuver(o, side, protocolId);
    const again: RunStage = { k: 'maneuver', side, protocolId, ...(st.then ? { then: st.then } : {}) };
    if (unreachable(o)) return stopUnreachable(o, 'maneuver', protocolId, side, again);
    // Herhangi bir pozisyonda ≥1 dk baş dönmesi: atipik. Kilit yok; manevra sonu ekranında uyarı notu.
    const long = o.state.records.some((r) => {
      const v = vertigoSummary(r);
      if (!v) return false;
      return v.durationSec === null ? o.phase === 'done' : v.durationSec >= ATYPICAL_VERTIGO_SEC;
    });
    if (long && mode !== 'practice') longVertigoRef.current = true;
    // Deneme manevrasında baş dönmesi işaretlendiyse: deneme tedavi yolu değildir, gerçek akışa yönlendir (kilit yok).
    if (mode === 'practice' && (o.phase === 'safetyStop' || o.state.records.some((r) => r.vertigoMarks.length > 0))) {
      setStage({ k: 'end', tone: 'warn', title: 'Deneme sırasında baş dönmesi oldu', text: PRACTICE_VERTIGO_TEXT, testid: 'end-practice-vertigo' });
      return;
    }
    if (o.phase === 'done') {
      if (st.then) {
        // İki tarafa sırayla: telefon alında, ikinci tarafa geçiş.
        const next: Stage = { k: 'nextSideGate', side: st.then, protocolId };
        if (doseGate(next, true)) setStage(next);
        return;
      }
      setStage({ k: 'after', side });
    } else if (o.phase === 'safetyStop') {
      const helper = store.get().settings.assist === 'helper';
      setStage({
        k: 'end',
        tone: 'warn',
        title: 'Manevra durduruldu',
        text: safetyStopTextFor(SAFETY_STOP_TEXT.VERTIGO_TOO_LONG, helper),
        testid: 'end-safety',
        spoken: safetyStopSpoken('VERTIGO_TOO_LONG', helper),
        retry: { run: again, kind: 'VERTIGO_TOO_LONG' },
        retryNote: RETRY_AFTER_LONG_NOTE
      });
    } else if (o.state.stopReason === 'USER_FEELS_UNWELL') {
      setStage({ k: 'end', tone: 'warn', title: UNWELL_END_TITLE, text: unwellEndText('maneuver'), testid: 'end-unwell', spoken: unwellEndSpoken('maneuver') });
    } else {
      setStage(abortedEnd('Manevra', long ? LONG_IN_MANEUVER_NOTE : undefined));
    }
  };

  /** Manevra tamamlandı ekranı (10 dk dinlenme, tekrar testi saati). */
  const maneuverDoneStage = (sev: 'none' | 'mild'): Stage => {
    const long = longVertigoRef.current;
    longVertigoRef.current = false;
    if (mode === 'practice') {
      return {
        k: 'end',
        tone: 'ok',
        title: 'Deneme tamamlandı',
        text: 'Artık adımları biliyorsunuz. Baş dönmeniz başladığında aynı yönergelerle yapacaksınız.',
        testid: 'end-maneuver-done'
      };
    }
    const mild =
      sev === 'mild'
        ? 'Hafif baş dönmesi ve bulantı manevradan sonra birkaç dakika, bazen birkaç saat sürebilir; bu beklenen bir durumdur. Geçmezse ya da artarsa manevrayı tekrarlamayın; kusma başlarsa bugün yeniden manevra yapmayın ve hekiminize danışın. '
        : '';
    const retestAt = Date.now() + EARLY_RETEST_MS;
    return {
      k: 'end',
      tone: long ? 'warn' : sev === 'none' ? 'ok' : 'info',
      title: 'Manevra tamamlandı',
      text: `${mild}10 dakika oturarak dinlenin: baş dönmesi tamamen sönsün ve dengeniz yerine gelsin. Kalkarken önce yatağın kenarında oturun, bir yere tutunun; gece ise ışığı açın. ${formatTime(retestAt)} civarında ana ekrandan tekrar testini yapın. Uyku pozisyonu kısıtlaması ya da boyunluk gerekmez.`,
      testid: 'end-maneuver-done',
      extra: 'rest',
      remindAt: retestAt,
      remindTitle: 'DengeYol: tekrar testi',
      spoken: afterManeuverSpoken(sev, formatTime(retestAt), !!nightNote(retestAt)),
      ...(long ? { note: LONG_IN_MANEUVER_NOTE } : {})
    };
  };

  /**
   * Manevra sonrası "Yeni belirti" uyarısı aşıldı (L2-1; y05): olağan "Manevra tamamlandı" (rahatlatıcı metin, dinlenme
   * sayacı, tekrar testi saati, hatırlatıcı) gösterilmez; kırmızı 112 ekranı. Kilit yok: ana ekrana dönülebilir.
   */
  const neuroEndStage = (): Stage => {
    longVertigoRef.current = false;
    return { k: 'end', tone: 'danger', title: NEURO_END_TITLE, text: NEURO_END_TEXT, testid: 'end-neuro', spoken: NEURO_END_SPOKEN, call112: true };
  };

  const onRetestExit = (o: RunnerOutcome, side: Side, protocolId: ProtocolId) => {
    if (notStarted(o)) return;
    if (o.phase === 'aborted' && o.state.stopReason === 'USER_FEELS_UNWELL') return stopUnwell('retest', side);
    if (o.phase === 'aborted') {
      setStage({ k: 'end', tone: 'info', title: 'Test yarıda bırakıldı', text: 'Hazır olduğunuzda ana ekrandan yeniden deneyin.', testid: 'end-aborted' });
      return;
    }
    // Pozisyona gelinemedi: test sonucu "baş dönmesi var" sayılmaz.
    if (unreachable(o)) return stopUnreachable(o, 'retest', protocolId, side, { k: 'retestRun', side, protocolId });
    const ep = activeEpisode(store.get());
    // Yatay kanalda iki yandan herhangi birinde baş dönmesi; arka kanalda sarkık baş adımı.
    const results = protocolId === HC_TEST ? rollResults(o.state.records) : [];
    const pcRec = o.state.records.find((r) => r.stepId === 'dh-lie');
    const pcV = pcRec ? vertigoSummary(pcRec) : null;
    const pos = protocolId === HC_TEST ? results.filter((r) => r.vertigo) : [];
    const v: { latencySec: number | null; durationSec: number | null } | null =
      protocolId === HC_TEST
        ? pos.length
          ? { latencySec: Math.min(...pos.map((r) => r.latencySec ?? 0)), durationSec: pos.some((r) => r.durationSec === null) ? null : Math.max(...pos.map((r) => r.durationSec!)) }
          : null
        : pcV;
    const na = ep ? nextAction(ep, Date.now()) : null;
    const kind = na?.kind === 'morning-retest' ? 'morning' : na?.kind === 'early-retest' ? 'early' : 'other';
    if (ep) {
      updateEpisode(ep.id, (e) => ({
        ...e,
        retests: [...e.retests, { at: Date.now(), kind, side, vertigo: !!v || o.phase === 'safetyStop', latencySec: v?.latencySec ?? null, durationSec: v?.durationSec ?? null }]
      }));
    }
    if (o.phase === 'safetyStop' || (v && (v.durationSec === null || v.durationSec >= ATYPICAL_VERTIGO_SEC))) {
      setStage({
        k: 'end',
        tone: 'warn',
        title: 'Baş dönmesi uzun sürdü',
        text: RETEST_LONG_TEXT,
        testid: 'end-retest-long',
        spoken: RETEST_LONG_SPOKEN,
        extra: 'treat',
        treatOverride: 'REFER_ATYPICAL_LONG'
      });
      return;
    }
    if (!v) {
      setStage(
        kind === 'morning'
          ? {
              k: 'end',
              tone: 'ok',
              title: 'Düzelmiş görünüyor',
              text: 'Sabah testinde de baş dönmesi başlamadı. Ana ekrandan atağı kapatabilirsiniz. Baş dönmesi yeniden başlarsa uygulamayı tekrar kullanabilirsiniz.',
              testid: 'end-resolved'
            }
          : {
              k: 'end',
              tone: 'ok',
              title: 'Baş dönmesi gelmedi',
              text: 'Yarın sabah bir kez daha bakalım: kristallerin yerinde kaldığını görmek için kısa bir test daha yapacağız.',
              testid: 'end-retest-negative',
              remindAt: nextMorning(Date.now()),
              remindTitle: 'DengeYol: sabah testi'
            }
      );
      return;
    }
    setStage({
      k: 'end',
      tone: 'warn',
      title: 'Baş dönmesi hâlâ başlıyor',
      text: `Manevrayı yeniden yapabilirsiniz (önerilen: günde en fazla ${doseLimitsFor(profile).maxPerDay} manevra).`,
      testid: 'end-retest-positive',
      extra: 'treat'
    });
  };

  // ---- Görünüm ------------------------------------------------------------------------------------
  // Manevra sonrası yeni belirti (24 saat ya da yanıtlanana dek): akışın ekranlarında kırmızı 112 şeridi (L2-1).
  const neuroAlert = mode === 'practice' ? null : neuroAlertFor(d, Date.now());
  // Acil uyarısı aşıldıysa yürütücüde ve karar ekranında kısa kırmızı hatırlatma (L2-2).
  const emergencyReminder = mode !== 'practice' && (!!neuroAlert || emergencyOverridden(activeEpisode(d)));
  const reminderNotice = emergencyReminder ? (
    <div className="notice danger" data-testid="emergency-reminder">
      <Icon name="alert" />
      <span>{EMERGENCY_REMINDER_TEXT}</span>
    </div>
  ) : null;
  /** Yürütücünün giriş notu: varsa kırmızı hatırlatma önce. */
  const withReminder = (intro: React.ReactNode) =>
    reminderNotice ? (
      <>
        {reminderNotice}
        {intro}
      </>
    ) : (
      intro
    );
  /** Yürütücü başında okunan not: varsa kırmızı hatırlatma önce. */
  const reminderNote = (note?: string) => (emergencyReminder ? [EMERGENCY_REMINDER_SPOKEN, note].filter(Boolean).join(' ') : note);
  const showStrip = !!neuroAlert && !isRun(stage) && stage.k !== 'stop' && !(stage.k === 'end' && stage.call112) && stage.k !== 'chainGate' && stage.k !== 'nextSideGate' && stage.k !== 'sideRest';
  const renderStage = (): React.ReactElement | null => {
  switch (stage.k) {
    case 'practiceLimit':
      return (
        <Screen title="Deneme manevrası" back="/hasta">
          <SpeakOnce text={`Bugünlük deneme yeterli. Deneme günde en fazla ${PRACTICE_PER_DAY} kez önerilir.`} />
          <div className="card tint-accent stack" data-testid="blocked-practice">
            <h2>Bugünlük deneme yeterli</h2>
            <p>Deneme manevrası günde en fazla {PRACTICE_PER_DAY} kez önerilir. İsterseniz yine de deneyebilirsiniz.</p>
          </div>
          <HomeButton primary onClick={() => nav('/hasta', { replace: true })} />
          <OverrideButton
            testid="practice-override"
            onClick={() => {
              practiceOkRef.current = true;
              setStage(entryStage());
            }}
          >
            Yine de dene
          </OverrideButton>
        </Screen>
      );

    case 'reopen':
      return (
        <RunOnce
          key="reopen"
          run={() => {
            store.update((x) => reopenEpisode(x, stage.id));
            setEpisodeId(stage.id);
            setStage(entryStage());
          }}
        />
      );

    case 'plan': {
      const na = stage.na;
      const at = 'at' in na ? na.at : null;
      const ready = 'ready' in na ? na.ready : false;
      const kind = na.kind === 'early-retest' || na.kind === 'morning-retest' || na.kind === 'resolved-suggest' ? na.kind : 'none';
      const w = planWarn(kind, ready, at ? (na.kind === 'morning-retest' ? formatDateTime(at) : formatTime(at)) : null);
      return (
        <Screen title="DengeYol" back="/hasta">
          <SpeakOnce text={`${w.title}. ${w.text}`} />
          <div className="card tint-accent stack" data-testid="plan-warn">
            <h1>{w.title}</h1>
            <p className="lead">{w.text}</p>
          </div>
          {/* Önerilen yol büyük dolu düğme (tekrar testi ya da ana ekran); "Yine de manevra yap" çerçeveli ikincil (y06). */}
          {w.retestReady ? (
            <button className="btn primary block xl" onClick={() => nav('/hasta/atak/retest', { replace: true })} data-testid="plan-retest">
              Tekrar testini yap
            </button>
          ) : (
            <HomeButton primary onClick={() => nav('/hasta', { replace: true })} />
          )}
          <OverrideButton
            testid="plan-override"
            onClick={() => {
              planOkRef.current = true;
              note('EARLY_REPEAT', `Sıradaki adım: ${na.kind}${at ? ` (${formatDateTime(at)})` : ''}`);
              setStage(entryStage());
            }}
          >
            Yine de manevra yap
          </OverrideButton>
          {w.retestReady && <HomeButton onClick={() => nav('/hasta', { replace: true })} />}
        </Screen>
      );
    }

    case 'contra': {
      const ids = profile.contraindications;
      const labels = contraindicationsFor(ids).map((c) => c.label);
      const text = contraWarnText(labels.length ? labels : ids);
      return (
        <Screen title="Dikkat" back="/hasta">
          <SpeakOnce text={CONTRA_WARN_SPOKEN} priority="high" />
          <div className="card tint-warn stack" data-testid="contra-warn">
            <div className="card-title">
              <Icon name="alert" />
              <h2>{CONTRA_WARN_TITLE}</h2>
            </div>
            <p>{text}</p>
          </div>
          <ListenAgain text={text} label="Ayrıntıyı dinle" slower />
          <HomeButton primary label="Durdur, ana ekrana dön" onClick={() => nav('/hasta', { replace: true })} />
          <OverrideButton
            testid="contra-override"
            onClick={() => {
              contraOkRef.current = true;
              note('CONTRAINDICATION', (labels.length ? labels : ids).join(', '));
              setStage(entryStage());
            }}
          >
            Yine de devam et
          </OverrideButton>
        </Screen>
      );
    }

    case 'vomit': {
      const until = formatDateTime(stage.until);
      const text = vomitWarnText(until);
      return (
        <Screen title="DengeYol" back="/hasta">
          <SpeakOnce text={vomitWarnSpoken(until, !!stage.look)} priority="high" />
          <div className="card tint-warn stack" data-testid="vomit-warn">
            <div className="card-title">
              <Icon name="alert" />
              <h2>{VOMIT_WARN_TITLE}</h2>
            </div>
            <p>{text}</p>
          </div>
          <ListenAgain text={`${VOMIT_WARN_TITLE}. ${text}`} label="Ayrıntıyı dinle" slower />
          <HomeButton primary label="Ana ekran (manevra yok)" onClick={() => nav('/hasta', { replace: true })} />
          <OverrideButton
            testid="vomit-override"
            onClick={() => {
              vomitOkRef.current = true;
              // Sıradaki adım da sabah testi: ikinci bir "Sabah testi bekleniyor" uyarısı sorulmaz.
              planOkRef.current = true;
              note(VOMITING_OVERRIDE_KIND, `Kusma bildirildikten sonra yeniden manevra (önerilen sabah testi: ${until})`);
              setStage(stage.next ?? entryStage());
            }}
          >
            Kusma geçti, yine de devam et
          </OverrideButton>
        </Screen>
      );
    }

    case 'feelCheck':
      return (
        <FeelCheck
          kind={stage.kind}
          what={stage.what}
          onOk={() => {
            const id = activeEpisode(store.get())?.id;
            if (id) updateEpisode(id, (e) => ({ ...e, feelBetterAt: Date.now() }));
            feelOkRef.current = true;
            setStage(entryStage());
          }}
          onNot={() =>
            setStage({
              k: 'end',
              tone: 'warn',
              title: STILL_UNWELL_TITLE,
              text: STILL_UNWELL_TEXT,
              spoken: STILL_UNWELL_SPOKEN,
              testid: 'end-still-unwell',
              override: {
                label: 'Yine de devam et',
                testid: 'still-unwell-override',
                kind: 'STILL_UNWELL',
                detail: stage.kind === 'vertigoLong' ? 'Uzun baş dönmesinin geçmediğini söyledi; yine de devam etti' : 'Kötü hissetmenin geçmediğini söyledi; yine de devam etti'
              }
            })
          }
        />
      );

    case 'dose':
      return (
        <Screen title="DengeYol" back="/hasta">
          <SpeakOnce text={doseWarnSpoken(!!stage.look)} priority="high" />
          <div className="card tint-warn stack" data-testid="dose-warn">
            <div className="card-title">
              <Icon name="alert" />
              <h2>{DOSE_WARN_TITLE}</h2>
            </div>
            <p>{stage.text}</p>
          </div>
          <ListenAgain text={`${DOSE_WARN_TITLE}. ${stage.text}`} label="Ayrıntıyı dinle" slower />
          <HomeButton primary label="Durdur, ana ekrana dön" onClick={() => nav('/hasta', { replace: true })} />
          <OverrideButton
            testid="dose-override"
            onClick={() => {
              doseOkRef.current = true;
              note('DOSE', stage.reason);
              setStage(stage.next ?? entryStage());
            }}
          >
            Yine de devam et
          </OverrideButton>
        </Screen>
      );

    case 'redflags':
      return <RedFlagsScreen flags={flags} recur={recur} onDone={onRedFlagsDone} />;

    case 'stop': {
      const emergency = stage.action === 'emergency';
      const title = RED_FLAG_WARN_TITLE[stage.action];
      const whys = stage.triggered.length === 0 ? [AFTER_NEURO_TEXT] : stage.triggered.map((q) => q.why);
      const todo = redFlagReferText(stage.action, stage.triggered);
      const spokenStop = redFlagWarnSpoken(stage.action, stage.triggered, AFTER_NEURO_SPOKEN);
      const fullStop = withoutBppv(`${title}. ${whys.join(' ')} ${todo}`);
      const hasReport = !!episodeId && mode !== 'practice';
      const st = store.get().settings;
      const minWait = RED_FLAG_OVERRIDE_MIN_MS / (st.simulation ? st.timeScale : 1);
      return (
        <Screen title={emergency ? 'Acil uyarı' : 'Uyarı'} back="/hasta">
          {/* 112/hekim cümlesi açılışta okunur; bitene dek (en az 5 s) "Yine de devam et" basılamaz (RedFlagOverride). */}
          <div className={`card ${emergency ? 'tint-danger' : 'tint-warn'} stack`} data-testid={`stop-${stage.action}`}>
            <div className="card-title">
              <Icon name="alert" />
              <h2>{title}</h2>
            </div>
            {whys.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
          </div>
          {emergency ? (
            <a className="btn danger block xl" href="tel:112" data-testid="call-112">
              <Icon name="phone" /> 112'yi ara
            </a>
          ) : (
            <div className="card soft small">
              <p>{todo}</p>
            </div>
          )}
          <ListenAgain text={fullStop} label="Ayrıntıyı dinle" slower />
          {/* Güvenli yol: acilde 112 (yukarıda, kırmızı); hekim uyarısında "Durdur" dolu birincil. "Yine de" çerçeveli ikincil. */}
          <button
            className={`btn ${emergency ? 'secondary' : 'primary xl'} block`}
            data-testid="redflag-stop"
            onClick={() => {
              // Kullanıcı durmayı seçti: atak yönlendirmeyle kapanır (ana ekranda bilgi satırı; kilit yok).
              const id = episodeId ?? activeEpisode(store.get())?.id;
              if (id && mode !== 'practice') {
                updateEpisode(id, (e) => ({
                  ...e,
                  status: emergency ? 'emergency' : 'referred',
                  endedAt: Date.now(),
                  endNote: stage.after ? 'Manevra sonrası yeni nörolojik belirti' : stage.triggered.map((q) => q.id).join(', ')
                }));
              }
              nav(hasReport ? `/hasta/rapor/${id}` : '/hasta', { replace: true });
            }}
          >
            Durdur{hasReport ? ' ve raporu göster' : ''}
          </button>
          <RedFlagOverride
            key={`${stage.action}-${stage.after ? 'after' : stage.triggered.map((q) => q.id).join(',')}`}
            spoken={spokenStop}
            minMs={minWait}
            onClick={() => {
              note('RED_FLAG', stage.after ? 'Manevra sonrası yeni belirti' : stage.triggered.map((q) => q.id).join(', '));
              // Manevra sonrası yeni belirti: olağan "tamamlandı" ekranı yerine kırmızı 112 ekranı (L2-1).
              setStage(stage.after ? neuroEndStage() : afterSafetyStage());
            }}
          />
        </Screen>
      );
    }

    case 'prep': {
      const run = nextRunRef.current;
      const hc = !!run && ((run.k === 'maneuver' && HC_PROTOCOLS.includes(run.protocolId)) || run.k === 'rollRun' || (run.k === 'retestRun' && run.protocolId === HC_TEST));
      const kind: PrepKind = !run ? 'maneuver' : run.k === 'sideRun' ? 'tests' : run.k === 'rollRun' ? 'roll' : run.k === 'retestRun' ? 'retest' : 'maneuver';
      return (
        <PrepScreen
          kind={kind}
          hc={hc}
          maneuverId={pcManeuver}
          single={run?.k === 'sideRun' && run.order.length === 1}
          onReady={() => {
            fromPrepRef.current = true;
            setStage({ k: 'calibrate', saved: !!store.get().patient?.calibration && !forceCal });
          }}
        />
      );
    }

    case 'calibrate':
      if (stage.saved && profile.calibration) return <RunOnce key="saved-cal" run={() => afterCalibration(profile.calibration!, false)} />;
      return (
        <Screen title="Telefonu tanıtma" back="/hasta">
          <Calibrate
            audience="patient"
            foreheadTap
            onDone={(c) => afterCalibration(c, true)}
            onCancel={() => nav('/hasta')}
            onNoSensor={() => afterCalibration(null)}
          />
        </Screen>
      );

    case 'rxSame':
      return (
        <Screen title="Baş dönmeniz" back="/hasta">
          <ChoiceQuestion
            title="Muayeneden bu yana baş dönmeniz hiç tamamen geçti mi?"
            name="Reçete atağı"
            lockKey="rxSame"
            onChange={(v: 'same' | 'new' | 'unsure') => {
              const epId = ensureEpisode();
              updateEpisode(epId, (e) => ({ ...e, rxShortcut: v === 'same' }));
              if (v === 'same') {
                const s = profile.prescription!.side;
                setEpisodeSide(s);
                // Reçetenin manevrası: arka kanalda Epley/Semont, yatay kanalda BBQ roll.
                const next = prepFor({ k: 'maneuver', side: s, protocolId: rxProtocolId(profile.prescription!) });
                if (doseGate(next)) setStage(next);
              } else {
                // Geçip yeniden başladıysa nüks: tip ve taraf yeniden belirlenir.
                rxBypassRef.current = true;
                setStage(subtypeStage());
              }
            }}
            options={[
              { value: 'same', label: 'Hayır, muayeneden beri hiç geçmedi', sub: 'Reçetedeki tarafa doğrudan manevra.', testid: 'rx-same' },
              { value: 'new', label: 'Evet, geçmişti; yeniden başladı', sub: 'Kısa test.', testid: 'rx-new' },
              { value: 'unsure', label: 'Emin değilim', sub: 'Kısa test.', testid: 'rx-unsure' }
            ]}
          />
        </Screen>
      );

    case 'subtype':
      return (
        <Screen title="Baş dönmeniz" back="/hasta">
          <ChoiceQuestion
            title={SUBTYPE_TITLE}
            name="Tetikleyen hareket"
            lockKey="subtype"
            onChange={(v: SubtypeAnswer) => {
              const id = ensureEpisode();
              updateEpisode(id, (e) => ({ ...e, subtype: { at: Date.now(), trigger: v, duration: 'unsure' } }));
              const canal: HomeCanal = v === 'turn' ? 'HC' : 'PC';
              // Eskiden yatay kanal şüphesi hekime yönlendirirdi; artık evde yatay kanal testi ve BBQ roll.
              if (canal === 'HC') note('SUBTYPE', 'Yatakta dönünce başlıyor: yatay kanal testi ve BBQ roll');
              setStage(prepFor(testRunFor(canal)));
            }}
            options={SUBTYPE_OPTIONS}
          />
        </Screen>
      );

    case 'sideRun': {
      const side = stage.order[stage.results.length]!;
      const other = stage.order[1];
      const ch = runFlags(stage);
      const first = stage.results.length === 0 && !!other;
      return (
        <RunnerView
          key={`side-${side}`}
          protocolId="dix-hallpike"
          side={side}
          mode="patient"
          calibration={ch.calibration}
          chained={ch.chained}
          autoStart={ch.autoStart}
          startNote={reminderNote(stage.note ?? (first ? `Önce ${sideName(side)}, sonra ${sideName(other!)} tarafı test ediyoruz.` : undefined))}
          emergency={emergencyReminder}
          onPlaced={onPlaced}
          onSensorless={() => {
            setCal(null);
            setPlaced(null);
          }}
          onRecalibrate={recalibrate}
          onExit={(o) => onSideRunExit(o, stage.order, stage.results)}
          intro={withReminder(
            <>
              {stage.note && (
                <div className="notice info" data-testid="run-note">
                  <Icon name="info" />
                  <span>{stage.note}</span>
                </div>
              )}
              <div className="notice info">
                <Icon name="info" />
                <span>
                  Test {stage.results.length + 1} / {stage.order.length}: <strong>{sideName(side)}</strong> taraf.
                  {first ? ` Önce ${sideName(side)}, sonra ${sideName(other!)} tarafı deniyoruz; telefon iki test boyunca alnınızda kalacak.` : ''}
                </span>
              </div>
            </>
          )}
        />
      );
    }

    case 'rollRun': {
      const ch = runFlags(stage);
      return (
        <RunnerView
          key="roll"
          protocolId={HC_TEST}
          side={null}
          mode="patient"
          calibration={ch.calibration}
          chained={ch.chained}
          autoStart={ch.autoStart}
          startNote={reminderNote('Sırtüstü yatıp başınızı önce sağa, sonra sola çevireceğiz.')}
          emergency={emergencyReminder}
          onPlaced={onPlaced}
          onSensorless={() => {
            setCal(null);
            setPlaced(null);
          }}
          onRecalibrate={recalibrate}
          onExit={onRollExit}
          intro={withReminder(
            <div className="notice info" data-testid="roll-intro">
              <Icon name="info" />
              <span>Yatay kanal testi: sırtüstü yatıp başınızı hızla önce sağa, sonra sola çevireceksiniz. Baş dönmesi başlarsa ekrana dokunun.</span>
            </div>
          )}
        />
      );
    }

    case 'sideRest':
      return (
        <RestBetween
          onContinue={() => setStage({ k: 'sideRun', order: stage.order, results: stage.results, chained: true })}
          onExit={() => setStage(abortedEnd('Test'))}
          next={stage.order[stage.results.length]!}
        />
      );

    case 'chainGate': {
      const t = chainGateText(stage.d, stage.dxWarn);
      const s = stage.d.side!;
      return (
        <TapGate
          testid="chain-continue"
          title={t.title}
          text={t.text}
          alert={emergencyReminder ? EMERGENCY_REMINDER_TEXT : undefined}
          onTap={() => {
            const run: Stage = { k: 'maneuver', side: s, protocolId: maneuverFor(stage.d.canal, pcManeuver), chained: true };
            if (doseGate(run, true)) setStage(run);
          }}
          onChoose={() => setStage({ k: 'decision', d: stage.d, look: true })}
          onExit={() =>
            setStage({ k: 'end', tone: 'info', title: 'Manevra başlatılmadı', text: 'Hazır olduğunuzda ana ekrandan devam edebilirsiniz; taraf kaydedildi.', testid: 'end-aborted' })
          }
        />
      );
    }

    case 'nextSideGate': {
      const t = nextSideGateText(stage.side);
      return (
        <TapGate
          testid="next-side-continue"
          title={t.title}
          text={t.text}
          onTap={() => setStage({ k: 'maneuver', side: stage.side, protocolId: stage.protocolId, chained: true })}
          onExit={() => setStage({ k: 'after', side: stage.side === 'R' ? 'L' : 'R' })}
        />
      );
    }

    case 'decision': {
      const sc = decisionScreen(stage.d, stage.single ? { otherSide: stage.single.side === 'R' ? 'L' : 'R' } : undefined);
      return (
        <Screen title="Uygulamanın kararı" back="/hasta">
          <div className="stack" data-testid="decision" data-warn={stage.d.warn ?? 'none'}>
            {reminderNotice}
            <ChoiceQuestion
              title={sc.title}
              lead={sc.lead}
              spokenLead={sc.spokenLead}
              deferPrompt={stage.look ? LOOK_AT_SCREEN : undefined}
              priority="normal"
              name="Karar"
              lockKey={`decision-${stage.d.warn ?? 'none'}`}
              lockMs={1000}
              onChange={(v: DecisionChoice) => onDecision(v, stage.d, stage.single)}
              options={sc.options}
            />
          </div>
        </Screen>
      );
    }

    case 'stronger': {
      const hc = stage.canal === 'HC';
      return (
        <Screen title="İki tarafta da baş dönmesi" back="/hasta">
          {/* Normal öncelik: yürütücünün son cümlesini kesmez. */}
          <ChoiceQuestion
            title={hc ? 'Hangi yana çevirince baş dönmesi daha şiddetliydi?' : 'Hangisinde baş dönmesi daha şiddetliydi?'}
            deferPrompt={`İki tarafta da baş dönmesi oldu. ${LOOK_AT_SCREEN}`}
            priority="normal"
            name="Şiddetli taraf"
            lockKey="stronger"
            lockMs={1000}
            onChange={(v: 'R' | 'L' | 'equal') => decideAndApply(stage.canal, stage.results, v, false)}
            options={[
              { value: 'R', label: hc ? 'Sağa çevirince' : 'Sağ tarafa yatınca', testid: 'stronger-R' },
              { value: 'L', label: hc ? 'Sola çevirince' : 'Sol tarafa yatınca', testid: 'stronger-L' },
              { value: 'equal', label: 'Aşağı yukarı aynı', testid: 'stronger-equal' }
            ]}
          />
        </Screen>
      );
    }

    case 'practiceSide':
      return (
        <Screen title="Deneme manevrası" back="/hasta">
          <ChoiceQuestion
            title="Hangi taraf için denemek istersiniz?"
            name="Deneme tarafı"
            lockKey="practiceSide"
            onChange={(v: Side) => {
              practiceSideRef.current = v;
              setStage(prepFor({ k: 'maneuver', side: v, protocolId: pcManeuver }));
            }}
            options={[
              { value: 'R', label: 'Sağ', testid: 'practice-R' },
              { value: 'L', label: 'Sol', testid: 'practice-L' }
            ]}
          />
        </Screen>
      );

    case 'maneuver': {
      const hc = HC_PROTOCOLS.includes(stage.protocolId);
      return (
        <RunnerView
          key={`man-${stage.protocolId}-${stage.side}`}
          protocolId={stage.protocolId}
          side={stage.side}
          mode="patient"
          {...runFlags(stage)}
          onPlaced={onPlaced}
          onSensorless={() => {
            setCal(null);
            setPlaced(null);
          }}
          onRecalibrate={recalibrate}
          onExit={(o) => onManeuverExit(o, stage)}
          onProgress={(p) => {
            // Ara kayıt: uygulama manevra sürerken kapanırsa açılışta "yarıda kaldı (adım n)" yazılır (y01 #6).
            if (mode === 'practice') return;
            store.update((x) =>
              saveManeuverCheckpoint(x, { protocolId: stage.protocolId, side: stage.side, records: p.records, manual: p.manual, assisted: x.settings.assist === 'helper' }, Date.now())
            );
          }}
          startNote={reminderNote(stage.note)}
          emergency={emergencyReminder}
          intro={withReminder(
            stage.note ? (
              <div className="notice info" data-testid="run-note">
                <Icon name="info" />
                <span>{stage.note}</span>
              </div>
            ) : mode === 'practice' ? (
              <div className="notice info">
                <Icon name="info" />
                <span>Deneme manevrası: atağa kaydedilmez ama günlük/toplam manevra sayısına sayılır.</span>
              </div>
            ) : hc ? (
              <div className="notice info" data-testid="bbq-intro">
                <Icon name="info" />
                <span>Yatakta dönme manevrası (BBQ roll): sırtüstünden başlayıp aynı yöne adım adım tam bir tur döneceksiniz; bir adımda yüzüstü, dirsekleriniz üzerinde kalacaksınız.</span>
              </div>
            ) : undefined
          )}
        />
      );
    }

    case 'after':
      return (
        <AfterManeuver
          practice={mode === 'practice'}
          onDone={(sev) => {
            if (mode !== 'practice') {
              const epId = episodeId ?? activeEpisode(store.get())?.id;
              if (epId) {
                updateEpisode(epId, (e) => {
                  const ms = e.maneuvers.slice();
                  const last = ms[ms.length - 1];
                  if (last) ms[ms.length - 1] = { ...last, afterSymptoms: sev };
                  return { ...e, maneuvers: ms };
                });
              }
            }
            if (sev === 'neuro') {
              // Yeni nörolojik belirti: acil uyarısı (112). Kilit yok: "Yine de devam et" kayda geçer.
              setStage({ k: 'stop', action: 'emergency', triggered: [], after: true });
            } else if (sev === 'severe') {
              longVertigoRef.current = false;
              setStage({
                k: 'end',
                tone: 'warn',
                title: 'Bugün manevrayı tekrarlamayın',
                text: 'Oturarak dinlenin ve küçük yudumlarla su için. Sıvı alamayacak kadar kusma sürerse hekiminize başvurun. Konuşma bozukluğu, güçsüzlük, çift görme ya da şiddetli baş ağrısı olursa hemen 112\'yi arayın.',
                testid: 'end-severe',
                spoken: AFTER_SEVERE_SPOKEN
              });
            } else setStage(maneuverDoneStage(sev));
          }}
        />
      );

    case 'retestRun': {
      const hc = stage.protocolId === HC_TEST;
      return (
        <RunnerView
          key="retest"
          protocolId={stage.protocolId}
          side={hc ? null : stage.side}
          mode="patient"
          {...runFlags(stage)}
          onPlaced={onPlaced}
          onSensorless={() => {
            setCal(null);
            setPlaced(null);
          }}
          onRecalibrate={recalibrate}
          onExit={(o) => onRetestExit(o, stage.side, stage.protocolId)}
          startNote={reminderNote()}
          emergency={emergencyReminder}
          intro={withReminder(
            <div className="notice info">
              <Icon name="info" />
              <span>
                {hc ? 'Tekrar testi: başınızı sağa ve sola çevireceğiz.' : <>Tekrar testi: tedavi edilen <strong>{sideName(stage.side)}</strong> taraf.</>} Baş dönmesi başlarsa ekrana dokunun.
              </span>
            </div>
          )}
        />
      );
    }

    case 'end': {
      const ep = activeEpisode(d);
      const side = ep ? episodeSide(ep, profile) : null;
      const doseNow = stage.extra === 'treat' && ep ? doseFor(d, ep, Date.now()) : null;
      const doseText = doseNow && !doseNow.allowed ? doseLimitText(doseNow, d, Date.now()) : null;
      // Test saati geceye düşüyorsa "uyanınca yapın".
      const night = stage.remindAt ? nightNote(stage.remindAt) : null;
      const recurEnd = recur && stage.testid !== 'end-dose' ? recur : null;
      // "Manevra tamamlandı" yürütücüde söylendi; burada yalnız öneri okunur.
      const endFull = withoutBppv(
        [stage.testid === 'end-maneuver-done' ? stage.text : `${stage.title}. ${stage.text}`, stage.note, night, recurEnd?.text].filter(Boolean).join(' ')
      );
      const endSpoken = stage.spoken ? withoutBppv([stage.spoken, stage.note ? 'Ekranda bir uyarı notu var.' : '', recurEnd?.text].filter(Boolean).join(' ')) : endFull;
      // "Yine de" tekrar / yeniden deneme varsa önerilen yol "Ana ekran" dolu düğmedir (L2-2).
      const risky = !!stage.treatOverride || !!doseText || !!stage.retry || !!stage.override;
      return (
        <Screen title="DengeYol" back="/hasta">
          <SpeakOnce text={endSpoken} />
          <div className={`card tint-${stage.tone === 'info' ? 'accent' : stage.tone === 'danger' ? 'danger' : stage.tone} stack`} data-testid={stage.testid}>
            <h1>{stage.title}</h1>
            <p className="lead">{stage.text}</p>
          </div>
          {stage.call112 && (
            <a className="btn danger block xl" href="tel:112" data-testid="end-call-112">
              <Icon name="phone" /> 112'yi ara
            </a>
          )}
          {stage.call112 && neuroAlert && (
            <div className="row wrap" data-testid="end-neuro-ack">
              <NeuroAckButtons episodeId={neuroAlert.episodeId} />
            </div>
          )}
          {stage.note && (
            <div className="notice danger" data-testid="end-note">
              <Icon name="alert" />
              <span>{stage.note}</span>
            </div>
          )}
          {stage.extra === 'rest' && <RestTimer />}
          {night && (
            <div className="notice info" data-testid="end-night">
              <Icon name="timer" />
              <span>{night}</span>
            </div>
          )}
          {recurEnd && (
            <div className="notice" data-testid="end-recurrence">
              <Icon name="alert" />
              <span>{recurEnd.text}</span>
            </div>
          )}
          <ListenAgain text={endFull} label={stage.spoken ? 'Ayrıntıyı dinle' : undefined} slower />
          {stage.extra === 'treat' && doseText && (
            <div className="notice danger" data-testid="end-dose-note">
              <Icon name="alert" />
              <span>{doseText}</span>
            </div>
          )}
          {stage.extra === 'treat' && side && (
            <button
              // Uyarılı tekrar ("yine de"): çerçeveli ikincil; önerilen yol (ana ekran) aşağıda dolu düğme.
              className={risky ? 'btn override block' : 'btn primary block xl'}
              onClick={() => {
                if (stage.treatOverride) note(stage.treatOverride, 'Tekrar testinden sonra manevra');
                if (doseNow && !doseNow.allowed) {
                  note('DOSE', doseNow.reason);
                  doseOkRef.current = true;
                }
                startManeuver(side, episodeProtocol(ep));
              }}
              data-testid="treat-now"
            >
              {stage.treatOverride || doseText ? 'Manevrayı yine de tekrarla' : 'Manevrayı şimdi tekrarla'}
            </button>
          )}
          {stage.retry && stage.retryNote && (
            <div className="notice" data-testid="end-retry-note">
              <Icon name="alert" />
              <span>{stage.retryNote}</span>
            </div>
          )}
          {stage.override && (
            <OverrideButton
              testid={stage.override.testid}
              onClick={() => {
                const o = stage.override!;
                note(o.kind, o.detail);
                feelOkRef.current = true;
                setStage(entryStage());
              }}
            >
              {stage.override.label}
            </OverrideButton>
          )}
          {stage.retry && (
            <OverrideButton
              testid="end-retry"
              onClick={() => {
                const r = stage.retry!;
                note(r.kind, 'Durdurmadan sonra yeniden denendi');
                if (r.run.k === 'maneuver' && !doseGate(r.run)) return;
                setStage(r.run);
              }}
            >
              Yeniden dene
            </OverrideButton>
          )}
          {stage.remindAt && (
            <button
              className="btn primary block"
              onClick={() => downloadReminder(stage.remindAt!, stage.remindTitle ?? 'DengeYol', 'DengeYol uygulamasını açıp ana ekrandaki testi yapın.')}
              data-testid="add-reminder"
            >
              <Icon name="calendar" /> Takvime hatırlatıcı ekle ({formatTime(stage.remindAt)})
            </button>
          )}
          {stage.remindAt && (
            <p className="small muted center">Takvim açılmazsa telefonunuzun saat uygulamasında {formatTime(stage.remindAt)} için alarm kurun.</p>
          )}
          <button
            className={`btn ${risky || stage.call112 ? 'primary xl' : 'secondary'} block`}
            onClick={() => nav('/hasta', { replace: true })}
            data-testid="go-home"
          >
            Ana ekran
          </button>
          {/* Rapor uyarılı sonuçlarda öne çıkar (hekime götürülebilir); diğer durumlarda ana ekran/geçmişten açılır. */}
          {episodeId && mode !== 'practice' && (stage.tone === 'warn' || stage.tone === 'danger') && (
            <button className="btn ghost" onClick={() => nav(`/hasta/rapor/${episodeId}`)}>
              <Icon name="print" /> Hekime götürülecek rapor
            </button>
          )}
        </Screen>
      );
    }
  }
  };

  const view = renderStage();
  return showStrip ? (
    <>
      <NeuroAlertStrip alert={neuroAlert!} standalone />
      {view}
    </>
  ) : (
    view
  );
}

/**
 * "Yine de …" düğmesi: her zaman çerçeveli ikincil (önerilen yol büyük dolu düğmedir; yeni kullanıcı turu 1, L2-2: y03,
 * y05, y06 dolu renkli "Yine de"ye basıyordu). Açılışta kısa dokunuş kilidi (önceki ekranın çift dokunuşu uyarıyı aşmasın).
 */
function OverrideButton({ testid, onClick, children }: { testid: string; onClick: () => void; children: React.ReactNode }) {
  const locked = useTapLock(testid, 800);
  return (
    <button
      className="btn override block"
      style={locked ? { opacity: 0.55 } : undefined}
      aria-disabled={locked || undefined}
      data-locked={locked || undefined}
      onClick={() => !locked && onClick()}
      data-testid={testid}
    >
      {children}
    </button>
  );
}

/** "Ana ekran": uyarı ekranlarında önerilen yol olduğunda büyük dolu düğme (primary). */
function HomeButton({ onClick, primary, label = 'Ana ekran' }: { onClick: () => void; primary?: boolean; label?: string }) {
  return (
    <button className={primary ? 'btn primary block xl' : 'btn ghost'} onClick={onClick} data-testid="go-home">
      {label}
    </button>
  );
}

/**
 * Kırmızı bayrak uyarısında "Yine de devam et" (L2-2; y05): kilit değil, yavaşlatma. Uyarı cümlesi (112/hekim) açılışta
 * okunur; cümle bitene ve en az `minMs` geçene dek düğme görünür ama basılamaz, üzerinde geri sayım vardır. Pasif düğmeye
 * dokunuş konuşmayı kesmez (SpeechHush pasif düğmeyi yok sayar). Geri sayım zamanlayıcıyla ilerler (sahte saatle sınanır).
 */
function RedFlagOverride({ spoken, minMs, onClick }: { spoken: string; minMs: number; onClick: () => void }) {
  const TICK = 250;
  const [left, setLeft] = useState(minMs);
  const [said, setSaid] = useState(false);
  useEffect(() => {
    let alive = true;
    speech.speak(spoken, 'high', () => {
      if (alive) setSaid(true);
    });
    const id = setInterval(() => setLeft((l) => Math.max(0, l - TICK)), TICK);
    // Ses motorunun bitiş olayı hiç gelmezse düğme kilit olmasın: en geç bu sürede basılabilir.
    const fallback = setTimeout(() => alive && setSaid(true), SPOKEN_WAIT_MAX_MS);
    return () => {
      alive = false;
      clearInterval(id);
      clearTimeout(fallback);
    };
  }, [spoken]);
  const waiting = left > 0 || !said;
  const secs = Math.ceil(left / 1000);
  return (
    <button
      className="btn override block"
      disabled={waiting}
      aria-disabled={waiting || undefined}
      data-locked={waiting || undefined}
      onClick={() => !waiting && onClick()}
      data-testid="redflag-override"
    >
      {overrideCountdownLabel('Yine de devam et', waiting ? Math.max(1, secs) : 0)}
    </button>
  );
}

/** Kırmızı bayrak uyarı cümlesinin bitişi gelmezse "Yine de devam et" en geç bu sürede basılabilir (ms). */
const SPOKEN_WAIT_MAX_MS = 15000;

/** Kırmızı 112 ekranında "112'yi aradım" / "Belirtiler geçti, iyiyim" (şerit kapanır). */
function NeuroAckButtons({ episodeId }: { episodeId: string }) {
  const ack = (by: 'ok' | 'called112') => store.update((x) => ackNeuroAlert(x, episodeId, by));
  return (
    <>
      <button type="button" className="btn ghost grow" onClick={() => ack('called112')} data-testid="end-neuro-called">
        112'yi aradım
      </button>
      <button type="button" className="btn ghost grow" onClick={() => ack('ok')} data-testid="end-neuro-ok">
        Belirtiler geçti, iyiyim
      </button>
    </>
  );
}

/**
 * Güvenlik soruları tek ekranda (BRIEF §2): bütün belirtiler işaret listesinde; büyük "Hiçbiri yok, devam" ekranın altında
 * hep görünür. Bir belirti işaretlenince düğme "İşaretlediklerimle devam" olur (uyarı ekranı gelir; orada da devam edilebilir).
 * Açılışta kısa ses (liste ekranda ve "Listeyi dinle"de).
 * Yeni kullanıcı turu 1 (y02, titreyen el; y03): "Listeyi dinle" listenin üstünde; her işaret sesle söylenir ("İşaretlendi:
 * …"); düğmenin "İşaretlediklerimle devam"a dönüşü renk, simge ve sesle fark edilir; acil (112) uyarısından önce tek bir
 * "doğru mu?" onayı (kilit değil, yanlış dokunuş koruması). Maddelerin başında simge (L2-6).
 */
function RedFlagsScreen({
  flags,
  recur,
  onDone
}: {
  flags: RedFlagQuestion[];
  recur: { last30: number; last180: number } | null;
  onDone: (checked: string[]) => void;
}) {
  const [checked, setChecked] = useState<string[]>([]);
  /** Acil belirti işaretlendi: uyarıdan önce "doğru mu?" onayı. */
  const [confirm, setConfirm] = useState(false);
  /** Onaydan listeye dönüldü: açılış cümlesi yeniden okunmaz. */
  const [returned, setReturned] = useState(false);
  // Ana ekrandaki dokunuşun ikincisi "Hiçbiri yok"a düşmesin. Kilit görünmez (L2-6; y03: gri düğmeyi kapalı sandı).
  const locked = useTapLock('redflags', 800);
  const full = redFlagsSpokenFull(flags);
  const any = checked.length > 0;
  const toggle = (v: string) => {
    const q = flags.find((x) => x.id === v);
    const on = !checked.includes(v);
    const next = on ? [...checked, v] : checked.filter((x) => x !== v);
    setChecked(next);
    if (q) speech.speak(redFlagToggleSpoken(redFlagCheckText(q), on, next.length), 'high');
  };
  const proceed = () => {
    if (locked) return;
    const emergency = evaluateRedFlags(redFlagAnswers(flags, checked)).triggered.filter((q) => q.action === 'emergency');
    if (emergency.length > 0) setConfirm(true);
    else onDone(checked);
  };
  if (confirm) {
    const items = flags.filter((q) => checked.includes(q.id) && q.action === 'emergency').map((q) => redFlagCheckText(q));
    const headline = items.join('; ');
    return (
      <ConfirmAnswer
        title="Güvenlik soruları"
        headline={headline}
        question={RED_FLAGS_TITLE}
        answer={headline}
        consequence={RED_FLAG_CONFIRM_CONSEQUENCE}
        danger
        testid="redflags-confirm"
        onConfirm={() => onDone(checked)}
        onBack={() => {
          setReturned(true);
          setConfirm(false);
        }}
      />
    );
  }
  return (
    <Screen title="Güvenlik soruları" back="/hasta">
      {!returned && <SpeakOnce text={RED_FLAGS_SPOKEN} priority="high" />}
      <h1 data-testid="redflags-title">{RED_FLAGS_TITLE}</h1>
      <p className="small muted">Yalnız şu anda ya da bu atakta olanları işaretleyin.</p>
      {/* "Listeyi dinle" listenin üstünde: kaydırmadan görünür (y02). */}
      <ListenAgain text={full} label="Listeyi dinle" slower />
      <div data-testid="redflags">
        <CheckList
          label="Güvenlik belirtileri"
          testidPrefix="rf"
          keepSpeech
          values={checked}
          onToggle={toggle}
          options={flags.map((q) => ({ value: q.id, label: redFlagCheckText(q), sub: redFlagCheckSub(q), icon: redFlagIcon(q) }))}
        />
      </div>
      {recur && (
        <p className="small muted" data-testid="recurrence-warning">
          <Icon name="alert" size={16} /> {recurShort(recur)}
        </p>
      )}
      <div className="sticky-actions" data-locked={locked || undefined}>
        <button
          // Biçim değişince (Hiçbiri yok ↔ İşaretlediklerimle devam) düğme bir kez belirgince yanıp söner (y02).
          key={any ? 'any' : 'none'}
          className={`btn ${any ? 'warn changed' : 'primary'} block xl`}
          aria-disabled={locked || undefined}
          onClick={proceed}
          data-testid={any ? 'redflags-continue' : 'redflags-none'}
        >
          {any && <Icon name="alert" />}
          {any ? `İşaretlediklerimle devam (${checked.length})` : 'Hiçbiri yok, devam'}
        </button>
      </div>
    </Screen>
  );
}

/** Sık tekrar uyarısının kısa satırı (güvenlik listesinin altında). */
function recurShort(r: { last30: number; last180: number }): string {
  const span = r.last30 >= 3 ? `Son 30 günde ${r.last30}` : `Son 6 ayda ${r.last180}`;
  return `${span} atak yaşadınız: sık tekrarladığı için hekiminizle görüşün (ayrıntı sonda).`;
}

/**
 * İki taraf testi arası: telefon alında kalır. 30 s sesli geri sayım, sonra "baş dönmeniz geçtiyse ekrana dokunun".
 * Ekranın her yeri dokunma alanıdır (hasta ekranı görmez); köşedeki "Bitir" basılı tutularak akıştan çıkar.
 */
function RestBetween({ onContinue, onExit, next }: { onContinue: () => void; onExit: () => void; next: Side }) {
  const [left, setLeft] = useState(30);
  const st = store.get().settings;
  const step = st.simulation ? st.timeScale : 1;
  /** Giriş cümlesi bitti mi: bitmeden gelen sayım kuyrukta bekleyip geç (yanlış süreyle) okunmasın (k01, k04). */
  const introDone = useRef(false);
  useEffect(() => {
    void keepAwake();
    introDone.current = false;
    // Normal öncelik: yürütücünün "Test tamamlandı" cümlesini kesmez, ardından okunur.
    // Beklemenin nedeni de söylenir (sayaç sırasında dokunuşlara tepki yok; hasta bozuk sanmasın).
    speech.speak(
      `Oturun ve dinlenin. Telefon alnınızda kalsın. Baş dönmesi tamamen sönsün diye otuz saniye bekliyoruz; sonra ${sideName(next)} tarafı test edeceğiz.`,
      'normal',
      () => {
        introDone.current = true;
      }
    );
    const id = setInterval(() => setLeft((l) => Math.max(0, l - step)), 1000);
    return () => clearInterval(id);
  }, [step, next]);
  // Hasta ekranı görmez: uzun sessizlik olmasın (20 ve 10 s kala).
  const spokenMarks = useRef(new Set<number>());
  useEffect(() => {
    const m = [10, 20].find((x) => left > 0 && left <= x && !spokenMarks.current.has(x));
    if (m === undefined) return;
    [10, 20].filter((x) => x >= m).forEach((x) => spokenMarks.current.add(x));
    // Giriş cümlesi hâlâ okunuyorsa bu sayım atlanır (süresi geçmiş sayı okunmaz); okunursa o anki gerçek değer söylenir.
    if (!introDone.current) return;
    speech.speak(`${Math.ceil(left)} saniye.`, 'normal');
  }, [left]);
  const ready = left <= 0;
  useEffect(() => {
    if (!ready) return;
    haptics.play('ready'); // "Hazırsanız dokunun": hareket et (move) titreşiminden ayrı desen.
    tones.play('move');
    speech.speak(`Baş dönmeniz geçtiyse ekranın herhangi bir yerine dokunun; ${sideName(next)} tarafı test edeceğiz.`, 'high');
  }, [ready, next]);
  return (
    <TapSurface testid="rest-continue" enabled={ready} onTap={onContinue} onExit={onExit}>
      <span className="tap-gate-title">Oturun ve dinlenin</span>
      <span className="tap-gate-count" aria-live="polite">
        {ready ? 'Hazırsanız dokunun' : left}
      </span>
      <span className="tap-gate-text">
        Baş dönmesi tamamen sönsün diye bekliyoruz. Telefon alnınızda kalsın. Ardından {sideName(next)} tarafı test edeceğiz.
      </span>
    </TapSurface>
  );
}

/** Tek dokunuşla geçiş ekranı (ekranın her yeri düğme); metni sesli okur. */
function TapGate({
  title,
  text,
  onTap,
  onExit,
  onChoose,
  testid,
  alert
}: {
  title: string;
  text: string;
  /** Kısa kırmızı hatırlatma (acil uyarısı aşıldıysa; yalnız ekranda). */
  alert?: string;
  onTap: () => void;
  onExit: () => void;
  /** Uygulamanın kararı yerine başka taraf/manevra seçmek (köşede basılı tutulur). */
  onChoose?: () => void;
  testid: string;
}) {
  useEffect(() => {
    void keepAwake();
    haptics.play('ready'); // "Hazırsanız dokunun": hareket et (move) titreşiminden ayrı desen.
    tones.play('move');
    speech.speak(`${title}. ${text}`, 'normal');
  }, [title, text]);
  return (
    <TapSurface testid={testid} enabled onTap={onTap} onExit={onExit} onChoose={onChoose}>
      {alert && (
        <span className="tap-gate-alert" data-testid="emergency-reminder">
          {alert}
        </span>
      )}
      <span className="tap-gate-title">{title}</span>
      <span className="tap-gate-text">{text}</span>
      <span className="tap-gate-count">Dokunun</span>
    </TapSurface>
  );
}

/** Tam ekran dokunma yüzeyi + köşede basılı tutmalı çıkış (kazara çıkılmasın; kötü hisseden hasta/yardımcı durabilsin). */
function TapSurface({
  testid,
  enabled,
  onTap,
  onExit,
  onChoose,
  children
}: {
  testid: string;
  enabled: boolean;
  onTap: () => void;
  onExit: () => void;
  onChoose?: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Başucundaki yardımcı için yürütücüyle aynı yönde dursun.
  const flipped = !!useData().settings.screenFlip;
  useEffect(() => {
    ref.current?.focus();
    // Telefon alındayken kenardan kaydırma/geri tuşu akışı sessizce kapatmasın (1. taraf sonucu kaybolmasın): yok sayılır;
    // çıkmak için "Bitir" basılı tutulur.
    const marker = { dengeyolGate: true };
    window.history.pushState(marker, '');
    const onPop = () => window.history.pushState(marker, '');
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if ((window.history.state as { dengeyolGate?: boolean } | null)?.dengeyolGate) window.history.back();
    };
  }, []);
  return (
    <div
      ref={ref}
      className={`tap-gate${flipped ? ' flipped' : ''}`}
      // Köşedeki "Bitir" ile metin çakışmasın (kullanıcı turu 2, k03): üstte Bitir'e yer bırakılır.
      style={{ paddingTop: 'calc(84px + env(safe-area-inset-top))', overflowY: 'auto' }}
      role="button"
      tabIndex={0}
      aria-disabled={!enabled}
      data-testid={testid}
      data-enabled={enabled || undefined}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('.tap-exit')) return;
        if (enabled) onTap();
      }}
      onKeyDown={(e) => {
        if (enabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onTap();
        }
      }}
    >
      <span className="tap-exit">
        <HoldButton ms={700} onHold={onExit} label="Bitir (basılı tutun)" className="btn ghost" testid={`${testid}-exit`}>
          <Icon name="close" /> Bitir
        </HoldButton>
      </span>
      {onChoose && (
        <span className="tap-exit" style={{ left: 'auto', right: 12 }}>
          <HoldButton ms={700} onHold={onChoose} label="Başka taraf (basılı tutun)" className="btn ghost" testid={`${testid}-choose`}>
            Başka taraf
          </HoldButton>
        </span>
      )}
      {children}
    </div>
  );
}

type AfterSev = 'none' | 'mild' | 'severe' | 'neuro';

/**
 * Manevra sonrası "Şu an nasılsınız?". Açılışta ~1 s dokunuş kilidi (telefonu alından alırken kör dokunuş seçim yapmasın);
 * "Kusma" ve "Yeni belirti" kalıcı sonuç doğurduğu için (bugün manevra yok / acil kilidi) "Doğru mu?" onayı istenir.
 * Onaylanınca yol aynıdır. Telefon alındayken yalnız "telefonu alın" denir; soru ve seçenekler ekrana dokununca (ya da kısa
 * süre sonra) okunur (kullanıcı turu 2, k04, k01).
 */
function AfterManeuver({ onDone, practice }: { onDone: (sev: AfterSev) => void; practice: boolean }) {
  const [confirm, setConfirm] = useState<'severe' | 'neuro' | null>(null);
  /** Onaydan geri dönüldü: kullanıcı ekrana bakıyor, soru hemen okunur. */
  const [looking, setLooking] = useState(false);
  const options: ({ value: AfterSev } & SpokenOption)[] = [
    { value: 'none', label: 'İyiyim' },
    { value: 'mild', label: 'Hafif baş dönmesi ya da bulantı var', spokenLabel: 'Hafif baş dönmesi ya da bulantı', sub: 'Manevradan sonra birkaç dakika sürebilir.' },
    { value: 'severe', label: 'Kusma ya da şiddetli bulantı var', spokenLabel: 'Kusma ya da şiddetli bulantı' },
    // "Yeni belirti"nin ne olduğu güvenlik için gerekli: alt açıklaması varsayılan okunuşta da okunur.
    {
      value: 'neuro',
      label: 'Yeni belirti var',
      spokenLabel: 'Yeni belirti',
      sub: 'Konuşma bozukluğu, yüzde/kolda güçsüzlük, çift görme ya da şiddetli baş ağrısı.',
      subAlways: true
    }
  ];
  if (confirm) {
    const o = options.find((x) => x.value === confirm)!;
    return (
      <ConfirmAnswer
        title={practice ? 'Deneme bitti' : 'Manevra bitti'}
        headline={o.label}
        question="Şu an nasılsınız?"
        answer={o.sub ? `${o.label}: ${o.sub}` : o.label}
        consequence={confirm === 'neuro' ? 'Bu yanıtla acil uyarısı gösterilecek.' : 'Bu yanıtla bugün başka manevra önerilmeyecek.'}
        danger={confirm === 'neuro'}
        testid="after-confirm"
        onConfirm={() => onDone(confirm)}
        onBack={() => {
          setLooking(true);
          setConfirm(null);
        }}
      />
    );
  }
  return (
    <Screen title={practice ? 'Deneme bitti' : 'Manevra bitti'}>
      {/* İlk açılışta normal öncelik: yürütücünün "Manevra tamamlandı" cümlesini kesmez. */}
      <ChoiceQuestion
        title="Şu an nasılsınız?"
        lead="Oturmaya devam edin; kalkarken dikkatli olun."
        deferPrompt={looking ? undefined : LOOK_AT_SCREEN}
        priority={looking ? 'high' : 'normal'}
        name="Manevra sonrası"
        lockKey="after"
        lockMs={1000}
        onChange={(v: AfterSev) => (v === 'severe' || v === 'neuro' ? setConfirm(v) : onDone(v))}
        options={options}
      />
    </Screen>
  );
}

/**
 * Kalıcı sonuç doğuran yanıtın onayı ("Doğru mu?"). Onaylanınca yol aynıdır.
 * - Düğmeler açılışta kısa süre kilitli: önceki ekrandaki çift dokunuşun ikincisi onayı da vermesin (her zaman).
 * - Kullanıcı turu 2 (k06): "Yanlış dokundum, soruya dön" tam dokunulan seçeneğin yerinde (en az onun yüksekliğinde):
 *   aynı noktaya ikinci kör dokunuş onay değil geri dönüştür.
 * - Kullanıcı turu 3 (k05, k06): yanıt kartı en üstte ve başlığında yanıtın kendisi ("Yeni belirti var — doğru mu?");
 *   "Evet, doğru" kartın hemen altında. Kart ve "Evet" dokunulan yerin üstüne sığmazsa "Evet" en alta iner (confirmPlacement):
 *   "Evet" hiçbir durumda dokunulan yerle çakışmaz.
 */
function ConfirmAnswer({
  title,
  headline,
  question,
  answer,
  consequence,
  danger,
  testid,
  onConfirm,
  onBack
}: {
  title: string;
  /** Yanıtın kısa adı; kart başlığı "<headline> — doğru mu?". */
  headline: string;
  question: string;
  /** Verilen yanıtın tam metni (başlıktan farklıysa kartta ayrıca yazılır). */
  answer: string;
  consequence: string;
  danger?: boolean;
  testid: string;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const locked = useTapLock(testid, 800);
  // Seste de yanıtın ne olduğu duyulsun: tam yanıt başlığı içermiyorsa (ör. "Evet, var") başlık da söylenir.
  const spokenAnswer = answer.startsWith(headline) ? answer : headline;
  const spoken = choiceSpeech(`Yanıtınız: ${spokenAnswer}. ${consequence} Doğru mu?`, ['Evet, doğru', 'Yanlış dokundum, soruya dön']);
  /** Dokunulan yanıt düğmesinin görünür alandaki yeri (yoksa düz düzen). */
  const [tap] = useState(() => takeTapRect());
  const [yesAbove, setYesAbove] = useState(true);
  const [pad, setPad] = useState(0);
  const yesRef = useRef<HTMLButtonElement | null>(null);
  const backRef = useRef<HTMLButtonElement | null>(null);
  // Sayfa başa alınır: belge konumu = dokunuş anındaki görünür alan konumu.
  useLayoutEffect(() => {
    if (tap) window.scrollTo(0, 0);
  }, [tap]);
  useLayoutEffect(() => {
    if (!tap || !backRef.current) return;
    const docTop = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY;
    if (yesAbove && yesRef.current) {
      const yesBottom = yesRef.current.getBoundingClientRect().bottom + window.scrollY;
      if (confirmPlacement(tap.top, yesBottom) === 'yesBelow') {
        setYesAbove(false);
        setPad(0);
        return;
      }
    }
    const need = confirmBackPad(tap.top, docTop(backRef.current) - pad);
    if (Math.abs(need - pad) > 1) setPad(need);
  }, [tap, yesAbove, pad]);
  const lockStyle = locked ? { opacity: 0.55 } : undefined;
  const card = (
    <div className={`card ${danger ? 'tint-danger' : 'tint-warn'} stack`} data-testid={testid}>
      <h2 data-testid={`${testid}-title`}>{headline} — doğru mu?</h2>
      {answer !== headline && (
        <p>
          Yanıtınız: <strong>{answer}</strong>
        </p>
      )}
      <p className="small">{consequence}</p>
    </div>
  );
  /** Sorunun kendisi: kart kısa kalsın diye düğmelerin altında (yerleşimi değiştirmez). */
  const questionLine = (
    <p className="small muted" data-testid={`${testid}-question`}>
      Soru: {question}
    </p>
  );
  const yesBtn = (
    <button
      ref={yesRef}
      className={`btn ${danger ? 'danger' : 'warn'} block xl`}
      style={{ ...lockStyle, ...(tap && !yesAbove ? { marginTop: CONFIRM_GAP_PX } : {}) }}
      aria-disabled={locked || undefined}
      onClick={() => {
        if (locked) return;
        // Yanıt verilince onay ekranının okunuşu kesilir (sonraki ekran baştan okunur).
        speech.cancel();
        onConfirm();
      }}
      data-testid={`${testid}-yes`}
    >
      Evet, doğru
    </button>
  );
  const backBtn = (
    <button
      ref={backRef}
      className="btn secondary block xl"
      style={{ ...lockStyle, ...(tap ? { marginTop: pad, minHeight: Math.max(56, Math.round(tap.height)) } : {}) }}
      aria-disabled={locked || undefined}
      onClick={() => {
        if (locked) return;
        speech.cancel();
        onBack();
      }}
      data-testid={`${testid}-back`}
    >
      Yanlış dokundum, soruya dön
    </button>
  );
  return (
    <Screen title={title} onBack={onBack}>
      <SpeakOnce text={spoken} priority="high" />
      {tap ? (
        <>
          {card}
          {yesAbove && yesBtn}
          {backBtn}
          {!yesAbove && yesBtn}
          {questionLine}
          {/* Kilit göstergesi (testler ve erişilebilirlik): düğmeler soluk. */}
          {locked && <span data-locked hidden />}
        </>
      ) : (
        <>
          {card}
          <div className="stack" data-locked={locked || undefined}>
            {yesBtn}
            {backBtn}
          </div>
          {questionLine}
        </>
      )}
      <ListenAgain text={spoken} />
    </Screen>
  );
}

/**
 * "Telefonu alın" cümlesi bittikten bu kadar sonra soru kendiliğinden okunur (dokunulmadıysa, telefonun alındığı
 * sezilmediyse). Kullanıcı turu 4 (k01): 6 s'de, telefonu alıp hemen yanıtlayan kişi soruyu hiç duymuyordu.
 */
const DEFER_READ_AFTER_MS = 3500;
/** "Telefonu alın" cümlesinin bitişi hiç gelmezse (ses motoru olayı) en geç bu sürede okunur. */
const DEFER_READ_MAX_MS = 15000;

/**
 * Ekranın sesli okunuşu. prompt yoksa metin hemen okunur. prompt varsa (telefon hâlâ alında): önce yalnız prompt; tam
 * metin (soru ve seçenekler) bir kez okunur: telefon alından inince (hareket sensörü, `PhoneLiftDetector`), kullanıcı
 * ekrana ilk dokununca ya da prompt bittikten kısa süre sonra; hangisi önce olursa (kullanıcı turu 4, k01). Yanıt
 * düğmesine (kilit açıkken) ya da "Tekrar dinle"ye dokunuşta okunmaz: yanıt ya da düğme kendisi konuşur.
 */
function useDeferredRead(prompt: string | undefined, full: string, priority: 'high' | 'normal') {
  const { source } = useMotion();
  useEffect(() => {
    if (!prompt) {
      speech.speak(full, priority);
      return;
    }
    let read = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Telefon alından inince soru okunur. Prompt sürerken sezilirse de okunur (kullanıcı zaten ekrana bakıyor).
    const lift = new PhoneLiftDetector();
    const offMotion = source.subscribe((s) => {
      if (lift.push(s.gravity, s.t)) readNow();
    });
    const stop = () => {
      read = true;
      document.removeEventListener('pointerdown', onTouch, true);
      offMotion();
      timers.forEach(clearTimeout);
    };
    const readNow = () => {
      if (read) return;
      stop();
      speech.speak(full, 'high');
    };
    function onTouch(e: Event) {
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest('[data-testid="listen-again"]') || (t?.closest('[role="radio"]') && !t.closest('[data-locked]'))) {
        stop();
        return;
      }
      readNow();
    }
    document.addEventListener('pointerdown', onTouch, true);
    speech.speak(prompt, priority, () => {
      if (!read) timers.push(setTimeout(readNow, DEFER_READ_AFTER_MS));
    });
    timers.push(setTimeout(readNow, DEFER_READ_MAX_MS));
    return stop;
  }, [prompt, full, priority, source]);
}

/**
 * Seçenekli soru: soru ve seçenek adları bir kez sesli okunur ("Birinci: …"), büyük "Tekrar dinle" düğmesi ve çift dokunuş
 * kilidi. Kullanıcı turu 3 (k01, k04, k05): açıklama satırı (lead) ve seçeneklerin alt açıklamaları yalnız "Tekrar dinle"de
 * okunur (ekranda hep yazılı); `spokenTitle`/`spokenLead` varsayılan okunuşun kısa biçimi, `subAlways` güvenlik için
 * gerekli alt açıklama. priority "high": önceki sorunun yarım kalan okunuşunu keser; yürütücüden hemen sonra "normal" (son
 * cümlesi kesilmesin). deferPrompt: telefon alındayken yalnız bu kısa cümle söylenir; soru telefon alından inince, ilk
 * dokunuşta ya da kısa süre sonra bir kez okunur (useDeferredRead). Seçim
 * yapılınca okuma kesilir (kalan seçenekler yanıttan sonra duyulmasın; kullanıcı turu 2, k05).
 */
function ChoiceQuestion<T extends string>({
  title,
  spokenTitle,
  lead,
  spokenLead,
  spokenPrefix,
  deferPrompt,
  priority = 'high',
  name,
  options,
  onChange,
  lockKey,
  lockMs = 800
}: {
  title: string;
  /** Varsayılan okunuştaki soru (parantezsiz kısa biçim); yoksa title. */
  spokenTitle?: string;
  lead?: string;
  /** Varsayılan okunuşta lead yerine okunacak kısa cümle; yoksa lead yalnız "Tekrar dinle"de. */
  spokenLead?: string;
  spokenPrefix?: string;
  deferPrompt?: string;
  priority?: 'high' | 'normal';
  name: string;
  options: ({ value: T; testid?: string; primary?: boolean } & SpokenOption)[];
  onChange: (v: T) => void;
  lockKey: string;
  lockMs?: number;
}) {
  const { short, full } = choiceSpeechParts({ title, spokenTitle, lead, spokenLead, prefix: spokenPrefix }, options);
  useDeferredRead(deferPrompt, short, priority);
  return (
    <>
      <h1>{title}</h1>
      {lead && <p className="lead">{lead}</p>}
      <Choice name={name} value={null} onChange={onChange} options={options} lockKey={lockKey} lockMs={lockMs} hushOnAnswer />
      <ListenAgain text={full} slower />
    </>
  );
}

/** Manevra sonrası 10 dakikalık oturarak dinlenme sayacı; bitince kalkma uyarısı okunur. */
function RestTimer() {
  const st = store.get().settings;
  const step = st.simulation ? st.timeScale : 1;
  const [left, setLeft] = useState(REST_AFTER_SEC);
  useEffect(() => {
    const id = setInterval(() => setLeft((l) => Math.max(0, l - step)), 1000);
    return () => clearInterval(id);
  }, [step]);
  const done = left <= 0;
  useEffect(() => {
    if (done) speech.speak('On dakikalık dinlenme bitti. Kalkarken önce yatağın kenarında oturun ve bir yere tutunarak yavaşça kalkın.', 'normal');
  }, [done]);
  const mm = Math.floor(left / 60);
  const ss = String(Math.floor(left % 60)).padStart(2, '0');
  return (
    <div className="notice info" data-testid="rest-timer" aria-live="off">
      <Icon name="timer" />
      <span>{done ? 'Dinlenme bitti. Yavaşça, tutunarak kalkın.' : `Oturarak dinlenme: ${mm}:${ss}`}</span>
    </div>
  );
}

/** Bir kez çalıştırır (render sırasında durum değiştirmemek için effect içinde). */
function RunOnce({ run }: { run: () => void }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    run();
  });
  return null;
}

/** Uyarılı kararın rapordaki adı (taraf testi kaydının notunda). */
const DECISION_WARN_NOTE: Record<'ATYPICAL_LONG' | 'BOTH_SIDES' | 'SIDE_CONFLICT', string> = {
  ATYPICAL_LONG: 'Uyarı: baş dönmesi 1 dakikadan uzun sürdü',
  BOTH_SIDES: 'Uyarı: iki tarafta da baş dönmesi',
  SIDE_CONFLICT: 'Uyarı: hekimin dediği taraftan farklı'
};

/** Taraf testinde ya da manevrada bu süreyi aşan baş dönmesi BPPV kanalolitiazisine uymaz (Bárány 2015: <1 dk). */
const ATYPICAL_VERTIGO_SEC = 60;

const PRACTICE_VERTIGO_TEXT =
  'Deneme manevrası, baş dönmesi yokken adımları öğrenmek içindir ve tedavi yerine geçmez. Baş dönmeniz varsa ana ekrandaki "Baş dönmem başladı" ile ilerleyin: güvenlik soruları ve kısa bir test yapılır.';

const AFTER_NEURO_TEXT = 'Yeni bir nörolojik belirti bildirdiniz. Bu, kristal oynamasına (BPPV) bağlı değildir ve acil değerlendirme gerektirir.';

/** Manevra sonrası "Yeni belirti" uyarısının sesli kısa nedeni. */
const AFTER_NEURO_SPOKEN = 'Yeni bir belirti bildirdiniz; acil değerlendirme gerekir.';

/** Manevra sonrası oturarak dinlenme (saniye). */
const REST_AFTER_SEC = 10 * 60;

type PrepKind = 'tests' | 'roll' | 'maneuver' | 'retest';

/** Tek hazırlık ekranı: yatak ve yastık, ses, kim yapıyor. Sonrasında telefon alnadır ve akış dokunmadan ilerler. */
function PrepScreen({
  kind,
  hc,
  maneuverId,
  onReady,
  single = false
}: {
  kind: PrepKind;
  hc: boolean;
  maneuverId: 'epley' | 'semont';
  onReady: () => void;
  /** Yalnız hekimin dediği taraf test edilecek (L5-7). */
  single?: boolean;
}) {
  const d = useData();
  const { source } = useMotion();
  const helper = d.settings.assist === 'helper';
  const setAssist = (v: 'self' | 'helper') => store.update((x) => ({ ...x, settings: { ...x.settings, assist: v } }));
  const duration =
    kind === 'retest'
      ? hc
        ? 'yaklaşık 4 dakika'
        : 'yaklaşık 3 dakika'
      : kind === 'tests'
        ? single
          ? 'yaklaşık 9–11 dakika (kısa test ve manevra)'
          : 'yaklaşık 12–15 dakika (iki kısa test ve manevra)'
        : kind === 'roll'
          ? 'yaklaşık 10 dakika (kısa test ve manevra)'
          : hc
            ? 'yaklaşık 6 dakika'
            : 'yaklaşık 6–8 dakika';
  // Yalnız Semont yapılacaksa (test yok) yastıklı Epley/Dix-Hallpike çizimi ve maddesi gösterilmez.
  const semontOnly = !hc && maneuverId === 'semont' && kind === 'maneuver';
  // Yakını modunda maddeler yardımcıya göre; seçim değişince liste de değişir.
  const prepInput = { helper, semontOnly, semontAfterTests: !hc && maneuverId === 'semont' && kind === 'tests', hc };
  const items = prepItems(prepInput);
  const spoken = prepSpokenFull(prepInput);
  // Ekran açılınca kısa hâli bir kez okunur; tam hâl "Tekrar dinle"de. "Kim yapıyor" değişince yeniden okunmaz.
  const spokenOnOpen = useRef(prepSpokenShort(prepInput));
  /** Ayrıntılar yakını modu seçiliyse açık gelir (yalnız ilk açılışta; sonra kişinin açıp kapatması korunur). */
  const [detailsOpen] = useState(helper);
  useEffect(() => {
    speech.speak(spokenOnOpen.current, 'normal');
  }, []);
  const ready = () => {
    // Bu dokunuş içinde: ses kilidi (iOS), hareket izni (iOS) ve ekranı açık tutma; sonraki akış dokunuşsuz ilerler.
    unlockAudio();
    void source.start();
    void keepAwake();
    onReady();
  };
  return (
    <Screen title="Hazırlık" back="/hasta">
      {/* Telefon alındayken ekranın her yeri "Hazırım" (L5-4; y07: gözü kapalı kişi düğmeyi arıyordu). */}
      <ForeheadTap enabled onTap={ready} testid="prep-forehead" />
      {hc && (
        <div className="notice info" data-testid="prep-hc">
          <Icon name="info" />
          <span>Yatay kanal: sırtüstü baş çevirme testi ve yatakta dönme manevrası (BBQ roll) yapacağız.</span>
        </div>
      )}
      {!semontOnly && !hc && <BedSetup />}
      <ol className="stack" style={{ margin: 0, paddingLeft: 22 }} data-testid="prep">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ol>
      {!speech.usable() && (
        <div className="notice" data-testid="prep-no-voice">
          <Icon name="alert" />
          <span>Bu telefonda Türkçe sesli okuma bulunamadı. Manevrayı bir yakınınızla yapın; yönergeleri ekrandan okusun.</span>
        </div>
      )}
      <ListenAgain text={spoken} slower />
      <p className="small muted">Süre: {duration}.</p>
      {/* İşitme cihazı, titreşimler ve "Kim yapıyor" katlanır (y01, y06: "Hazırım" ilk ekranda görünmüyordu). Yakını modu
          seçiliyse açık gelir. */}
      <details className="card soft" data-testid="prep-details" open={detailsOpen}>
        <summary>
          <strong>Ayrıntılar</strong>
          <span className="small muted" style={{ display: 'block' }}>
            İşitme cihazı, titreşimler, kim yapıyor ({helper ? 'bir yakınım' : 'kendim'})
          </span>
        </summary>
        <div className="stack" style={{ marginTop: 10 }}>
          <div className="stack" data-testid="prep-hearing">
            <p className="small muted" style={{ margin: 0 }}>
              {/* Yakını modunda yardımcıya göre (kullanıcı turu 4, k02). */}
              {prepHearingText(helper)}
            </p>
            {/* "Titreşimleri tanı" burada açılır (k04): Ayarlar'a gitmek akışı (taraf sırası, hazırlık) sıfırlardı. Aynı
                tanıtım Ayarlar > "Titreşimleri tanı"da da var (/ayarlar, #titresimler). */}
            <details data-testid="prep-haptic-legend">
              <summary>
                <strong>Titreşimleri tanı</strong>
              </summary>
              <HapticLegend />
            </details>
          </div>
          {!haptics.supported() && (
            <p className="small muted">Bu telefonda titreşim yok; uyarılar ses ve bip ile verilir. iPhone'da sessiz anahtarı kapalı ve sesi yüksek tutun.</p>
          )}
          <div className="stack">
            <strong>Kim yapıyor?</strong>
            <Segmented
              label="Kim yapıyor"
              value={helper ? 'helper' : 'self'}
              onChange={setAssist}
              options={[
                { value: 'self', label: 'Kendim' },
                { value: 'helper', label: 'Bir yakınımla' }
              ]}
            />
            {helper && (
              // Yalnız listede olmayanlar (kullanıcı turu 5, k02): yastık ve telefonu tutuş yukarıdaki maddelerde yazılı.
              <ol className="small stack" style={{ margin: 0, paddingLeft: 20, gap: 6 }} data-testid="helper-card">
                {PREP_HELPER_ITEMS.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
            )}
            {helper && (
              <label className="row">
                <input
                  type="checkbox"
                  checked={!!d.settings.screenFlip}
                  onChange={(e) => store.update((x) => ({ ...x, settings: { ...x.settings, screenFlip: e.target.checked } }))}
                  data-testid="prep-flip"
                />
                <span>Hastanın başucunda duracağım (ekranı bana göre çevir)</span>
              </label>
            )}
          </div>
        </div>
      </details>
      {/* "Hazırım" ekranın altında hep görünür (güvenlik listesindeki gibi; y01, y06). */}
      <div className="sticky-actions">
        <button className="btn primary block xl" onClick={ready} data-testid="prep-ready">
          Hazırım
        </button>
      </div>
    </Screen>
  );
}

/**
 * Kötü andan sonra yeniden başlarken "Geçti mi?" (L5-2; y07: kusma isteğiyle durduktan 1 dk sonra "Başım dönüyor" doğrudan
 * yeni manevraya sokuyordu). Önerilen yol büyük dolu düğme ("Geçti, devam et"); "Hâlâ kötüyüm" dinlenme ekranına götürür
 * (orada da "Yine de devam et" var; kilit yok). Açılışta kısa dokunuş kilidi (ana ekrandaki çift dokunuş yanıt sayılmasın).
 */
function FeelCheck({
  kind,
  what,
  onOk,
  onNot
}: {
  kind: 'unwell' | 'vertigoLong';
  what: 'maneuver' | 'side' | 'retest';
  onOk: () => void;
  onNot: () => void;
}) {
  const locked = useTapLock('feelCheck', 800);
  const title = feelCheckTitle(kind);
  const lead = feelCheckLead(kind, what);
  const lockStyle = locked ? { opacity: 0.55 } : undefined;
  return (
    <Screen title="Nasılsınız?" back="/hasta">
      <SpeakOnce text={feelCheckSpoken(kind)} priority="high" />
      <div className="card tint-accent stack" data-testid="feel-check" data-kind={kind}>
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
      </div>
      <div className="stack" data-locked={locked || undefined}>
        <button className="btn primary block xl" style={lockStyle} aria-disabled={locked || undefined} onClick={() => !locked && onOk()} data-testid="feel-ok">
          Evet, geçti; devam et
        </button>
        <button className="btn secondary block xl" style={lockStyle} aria-disabled={locked || undefined} onClick={() => !locked && onNot()} data-testid="feel-not">
          Hayır, hâlâ kötüyüm
        </button>
      </div>
      <ListenAgain text={`${title} ${lead}`} slower />
    </Screen>
  );
}

/**
 * Ekran açıldığında metni bir kez sesli okur (zincirden sonra telefon alındayken hasta sessiz kalmasın). Normal öncelik:
 * yürütücünün son cümlesini ("Test tamamlandı") kesmez, ardından okunur.
 */
function SpeakOnce({ text, priority = 'normal' }: { text: string; priority?: 'high' | 'normal' }) {
  useEffect(() => {
    speech.speak(text, priority);
  }, [text, priority]);
  return null;
}
