/**
 * Hasta atak akışı.
 * Modlar:
 *   start    — yeni atak (ya da yarım kalan ataka devam): kırmızı bayrak → kalibrasyon → taraf → manevra → sonrası
 *   retest   — 1 saat / sabah tekrar testi: (kırmızı bayrak) → kalibrasyon → Dix-Hallpike (tedavi edilen taraf) → sonuç
 *   treat    — pozitif tekrar testi sonrası yeniden manevra
 *   practice — deneme manevrası (atak kaydı tutulmaz; güvenlik soruları sorulur, günde en fazla 2)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Calibration } from '../../../core/calibration';
import type { Side } from '../../../core/protocols';
import { sideName } from '../../../core/protocols';
import { vertigoSummary } from '../../../core/runner';
import {
  diagnosisGate,
  DOSE_TEXT,
  evaluateRedFlags,
  GATE_TEXT,
  interpretSideTests,
  RED_FLAGS,
  REFER_TEXT,
  type RedFlagQuestion,
  type SideDecision,
  type SideTestResult,
  type StopAction,
  type YesNo
} from '../../../core/safety';
import {
  doseFor,
  doseLimitText,
  dxSideCheck,
  episodeSide,
  formatDateTime,
  formatTime,
  EARLY_RETEST_MS,
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
  type NextAction
} from '../../../state/episodes';
import { activeEpisode, store, uid, useData } from '../../../state/store';
import type { Episode, ManeuverLog } from '../../../state/types';
import { Choice, choiceSpeech, ListenAgain, Segmented, StepDots, useTapLock, YesNo as YesNoButtons } from '../../components/Controls';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Calibrate } from '../Calibrate';
import { HelperCard, HoldButton, RunnerView, type RunnerOutcome } from '../RunnerView';
import { BedSetup } from '../Illustrations';
import { speech } from '../../../platform/speech';
import { unlockAudio } from '../../../platform/feedback';
import { useMotion } from '../../../platform/MotionContext';
import { keepAwake, releaseAwake } from '../../../platform/wakeLock';
import { DoctorClearance, UrgencyLadder } from './PatientHome';
import { haptics } from '../../../platform/haptics';
import { tones } from '../../../platform/tones';
import { downloadReminder } from '../../../platform/reminders';

type Mode = 'start' | 'retest' | 'treat' | 'practice';

type Stage =
  | { k: 'blocked'; why: 'referral' | 'practiceLimit' }
  | { k: 'redflags'; i: number; answers: Record<string, YesNo> }
  /** Durduran yanıttan sonra onay: yanlış dokunuş bir atağı hekime yönlendirmesin. */
  | { k: 'redflagConfirm'; i: number; answers: Record<string, YesNo> }
  | { k: 'stop'; action: StopAction; triggered: RedFlagQuestion[] }
  /** Tek hazırlık ekranı (yatak, yastık, kim yapıyor); ardından telefon alna ve kesintisiz akış. */
  | { k: 'prep' }
  /** saved: kayıtlı tanıtma kullanılacak (sahneye girerken belirlenir; tanıtma sırasında kaydedilen yeni değer yarış yaratmasın). */
  | { k: 'calibrate'; saved: boolean }
  /** Alt tip soruları (Kim HJ ve ark. JAMA Neurol 2023): yatay kanal ve uzun atak şüphesi hekime yönlendirir. */
  | { k: 'subtype'; q: 1 | 2 | 'hcConfirm' }
  /** Geçerli reçete varken: bu, muayene edilen baş dönmesinin devamı mı (testsiz kısa yol yalnız o zaman)? */
  | { k: 'rxSame' }
  | { k: 'sideQ' }
  | { k: 'sideRun'; order: Side[]; results: SideTestResult[]; chained?: boolean; auto?: boolean }
  /** Taraf testinden sonra, telefon alından inmeden manevraya geçiş (tek dokunuş, ekranın her yeri). */
  | { k: 'chainGate'; side: Side; /** Eski hekim tanısındaki taraf testle çelişti: geçişte sesli uyarı. */ dxWarn?: Side | null }
  | { k: 'sideRest'; order: Side[]; results: SideTestResult[] }
  | { k: 'stronger'; results: SideTestResult[] }
  | { k: 'practiceSide' }
  | { k: 'maneuver'; side: Side; chained?: boolean; auto?: boolean }
  | { k: 'after'; side: Side }
  | { k: 'retestRun'; side: Side; chained?: boolean; auto?: boolean }
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
      remindAt?: number;
      remindTitle?: string;
    };

/** Aktif atakta manevra yapıldıysa yeni test/manevra yerine sıradaki adımı söyleyen ekran. */
function planStage(na: NextAction): Stage {
  const lead = 'Manevra yaptığınız atağa devam ediyoruz; yeni atak açılmaz.';
  switch (na.kind) {
    case 'early-retest':
      return na.ready
        ? { k: 'end', tone: 'info', title: 'Tekrar testinin zamanı geldi', text: `${lead} Ana ekrandaki "Tekrar testini yap" düğmesiyle manevranın işe yarayıp yaramadığına bakalım.`, testid: 'end-plan' }
        : {
            k: 'end',
            tone: 'info',
            title: 'Aynı atağa devam ediyoruz',
            text: `${lead} Manevranın etkisini görmek için ${formatTime(na.at)} civarında kısa bir tekrar testi yapacağız. O zamana kadar manevrayı tekrarlamayın; oturun ve dinlenin.`,
            testid: 'end-plan',
            remindAt: na.at,
            remindTitle: 'DengeYol: tekrar testi'
          };
    case 'morning-retest':
      return na.ready
        ? { k: 'end', tone: 'info', title: 'Sabah testinin zamanı geldi', text: 'Ana ekrandaki "Sabah testini yap" düğmesiyle kısa testi yapın.', testid: 'end-plan' }
        : {
            k: 'end',
            tone: 'info',
            title: 'Sabah testi bekleniyor',
            text: `${lead} Kristallerin yerinde kaldığını görmek için ${formatDateTime(na.at)} sonrasında kısa bir test yapacağız.`,
            testid: 'end-plan',
            remindAt: na.at,
            remindTitle: 'DengeYol: sabah testi'
          };
    case 'treat-again':
      return { k: 'end', tone: 'info', title: 'Baş dönmesi hâlâ tetikleniyordu', text: `${lead} Son tekrar testi baş dönmesini tetikledi; ana ekrandaki "Manevrayı tekrarla" düğmesiyle manevrayı yeniden yapabilirsiniz.`, testid: 'end-plan' };
    default:
      return { k: 'end', tone: 'ok', title: 'Düzelmiş görünüyor', text: 'Tekrar testleri baş dönmesini tetiklemedi. Ana ekrandan atağı kapatabilirsiniz.', testid: 'end-plan' };
  }
}

function updateEpisode(id: string, fn: (e: Episode) => Episode) {
  store.update((d) => ({ ...d, episodes: d.episodes.map((e) => (e.id === id ? fn(e) : e)) }));
}

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
  /** Bu akışta tanıtma/yerleştirme yapıldıysa (sonraki sorular ekrana bakarak yanıtlanır, telefon iner). */
  const calibratedRef = useRef(false);
  /** Hazırlık ekranından geçildi: sonraki ilk yürütücü kendiliğinden başlar. */
  const fromPrepRef = useRef(false);
  /** Az önce ayrı tanıtma ekranında ölçüldü (telefon alında): yerleştirme ölçümü tekrarlanmaz. */
  const freshCalRef = useRef(false);
  const sideOrderRef = useRef<Side[] | null>(null);
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
  /** Manevrada ≥1 dk baş dönmesi oldu: "nasılsınız" sorusundan sonra hekime yönlendirme ekranı. */
  const longVertigoRef = useRef(false);
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

  // Deneme manevrasında "aynı baş dönmesi mi" sorusu anlamsızdır; diğer güvenlik soruları her seferinde sorulur.
  const flags = mode === 'practice' ? RED_FLAGS.filter((q) => q.id !== 'same') : RED_FLAGS;

  /** Reçeteli kısa yol yalnız muayene edilen baş dönmesinin devamıysa (hasta "geçip yeniden başladı" derse tam akış). */
  const rxBypassRef = useRef(false);
  const rxShortcutApplies = (cur = store.get()) => rxFirstEpisode(cur) && !rxBypassRef.current;

  /** Atak başında doz denetimi (test yapmadan önce). Sınır dolduysa bitiş sahnesi. */
  const doseBlockStage = (): Stage | null => {
    const cur = store.get();
    const now = Date.now();
    const ds = startDose(cur, now);
    if (ds.allowed) return null;
    // Yan etkisiz (ilk sahne hesabında çağrılabilir): yönlendirme kaydı manevra öncesi denetimde (checkDose) yazılır.
    return { k: 'end', tone: 'warn', title: 'Manevra sınırına ulaşıldı', text: doseLimitText(ds, cur, now), testid: 'end-dose' };
  };

  /** Güvenlik sorularından sonra: yeni bir atakta önce alt tip soruları, sonra telefon. */
  const afterSafetyStage = (): Stage => {
    const cur = store.get();
    const ep = activeEpisode(cur);
    const p = cur.patient;
    if (mode === 'practice') {
      const known = p?.prescription?.side ?? (p && p.side !== 'unknown' ? p.side : null);
      if (known) practiceSideRef.current = known;
      return known ? { k: 'prep' } : { k: 'practiceSide' };
    }
    if (mode === 'retest') {
      const na = ep ? nextAction(ep, Date.now()) : null;
      // Taraf henüz belirlenmediyse ya da hiç manevra yapılmadıysa iki yönlü taraf testi (soru telefondan önce).
      if (ep && ((na?.kind === 'morning-retest' && na.needsSideTest) || ep.maneuvers.length === 0)) return { k: 'sideQ' };
      return { k: 'prep' };
    }
    // Doz/gün sınırı dolduysa provokatif testler yapılmadan söylenir.
    const blocked = doseBlockStage();
    if (blocked) return blocked;
    if (mode === 'treat') return { k: 'prep' };
    if (ep && ep.side) return { k: 'prep' };
    // Önceki taraf testi tetiklemedi (sabah yeniden test): taraf sorusu telefondan önce, sonra hazırlık.
    if (ep && ep.sideTests.length > 0) return { k: 'sideQ' };
    if (rxFirstEpisode(cur)) return { k: 'rxSame' };
    return { k: 'subtype', q: 1 };
  };

  const initialStage = (): Stage => {
    const cur = store.get();
    const now = Date.now();
    const ep = activeEpisode(cur);
    if (!ep && pendingReferral(cur)) return { k: 'blocked', why: 'referral' };
    if (mode === 'practice') {
      if (!practiceAllowed(cur, now)) return { k: 'blocked', why: 'practiceLimit' };
      // Deneme de doza sayılır: sınır doluyken deneme de yapılmaz.
      const blocked = doseBlockStage();
      if (blocked) return blocked;
      return { k: 'redflags', i: 0, answers: {} };
    }
    if (mode === 'start' || mode === 'treat') {
      // Bugün manevrayla kapatılmış atak: yeni atak açılmaz, o atak yeniden açılır (1 saatlik tekrar testi korunur).
      const re = !ep && mode === 'start' ? sameDayReopenable(cur, now) : null;
      if (re) return { k: 'reopen', id: re.id };
      // Manevra yapılmış atakta (adresle gelinse de) yeni test/manevra açılmaz: sıradaki adım söylenir. Yeniden manevra
      // yalnız tekrar testi pozitifken.
      const plan = startBlockedByPlan(ep, now);
      if (mode === 'treat' ? plan?.kind !== 'treat-again' : plan) return plan ? planStage(plan) : { k: 'end', tone: 'info', title: 'Manevra şu an önerilmiyor', text: 'Ana ekrandaki sıradaki adımı izleyin.', testid: 'end-plan' };
      // Doz/gün sınırı doluyken güvenlik soruları sordurulmaz: sınır ve bir sonraki izinli zaman hemen söylenir.
      const blocked = doseBlockStage();
      if (blocked) return blocked;
    }
    if (needsRedFlags(ep, now)) return { k: 'redflags', i: 0, answers: {} };
    return afterSafetyStage();
  };
  const [stage, setStage] = useState<Stage>(initialStage);
  // Sık nüks uyarısı: yeni atağın başında (ilk güvenlik sorusunda) bir kez gösterilir ve okunur. Bu atak da sayılır.
  const [recur] = useState(() =>
    mode === 'start' && !activeEpisode(store.get())
      ? recurrenceWarning([...store.get().episodes.map((e) => e.startedAt), Date.now()], Date.now())
      : null
  );
  // Akıştan çıkınca ekranı açık tutma bırakılır (Bitir/ana ekran).
  useEffect(() => () => void releaseAwake(), []);

  // Güvenlik sorularında sistem geri tuşu/kenardan kaydırma yanıtları sessizce silmesin: üst çubuktaki geri gibi önceki
  // soruya döner; ilk soruda yanıt varsa çıkmadan önce sorar.
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const [leaveAsk, setLeaveAsk] = useState(false);
  const inQuestions = stage.k === 'redflags' || stage.k === 'redflagConfirm';
  useEffect(() => {
    if (!inQuestions) return;
    const marker = { dengeyolQ: true };
    window.history.pushState(marker, '');
    const onPop = (ev: PopStateEvent) => {
      // Başka bir işaret kaydına düşüldüyse (ör. önceki işaretin geri alınması) kullanıcı geri tuşu değildir.
      if ((ev.state as { dengeyolQ?: boolean } | null)?.dengeyolQ) return;
      const st = stageRef.current;
      if (st.k === 'redflagConfirm') {
        const answers = { ...st.answers };
        delete answers[flags[st.i]!.id];
        setStage({ k: 'redflags', i: st.i, answers });
      } else if (st.k === 'redflags' && st.i > 0) {
        setStage({ k: 'redflags', i: st.i - 1, answers: st.answers });
      } else if (st.k === 'redflags' && Object.keys(st.answers).length === 0) {
        nav('/hasta', { replace: true });
        return;
      } else {
        setLeaveAsk(true);
      }
      window.history.pushState(marker, '');
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if ((window.history.state as { dengeyolQ?: boolean } | null)?.dengeyolQ) window.history.back();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inQuestions]);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (stage.k === 'calibrate') calHandledRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage.k]);

  const gate = profile
    ? diagnosisGate({
        diagnosedByDoctor: profile.diagnosedByDoctor,
        canal: profile.canal,
        side: profile.side,
        hasPrescription: !!profile.prescription,
        contraindications: profile.contraindications
      })
    : null;

  const maneuverId = profile?.prescription?.maneuver ?? 'epley';

  const ensureEpisode = useCallback((): string => {
    const existing = activeEpisode(store.get());
    if (existing) {
      setEpisodeId(existing.id);
      return existing.id;
    }
    const e: Episode = {
      id: uid(),
      startedAt: Date.now(),
      side: null,
      protocolId: maneuverId,
      redFlags: [],
      sideTests: [],
      maneuvers: [],
      retests: [],
      status: 'active'
    };
    store.update((x) => ({ ...x, episodes: [...x.episodes, e] }));
    setEpisodeId(e.id);
    return e.id;
  }, [maneuverId]);

  // ---- Kilit: kurulum yapılmamış ya da kapı kapalı --------------------------------------------
  if (!profile?.consentAt || !gate || !gate.ok) {
    // Kurulumu bitmiş kişiye "önce kurulum" denmez: kapının gerçek nedeni (ve tanısızsa nereye, ne kadar acil) söylenir.
    const reason = profile?.consentAt && gate && !gate.ok ? gate.reason : null;
    return (
      <Screen title="DengeYol" back="/hasta">
        <div className="card tint-warn stack" data-testid="flow-gate-blocked">
          <p>{reason ? GATE_TEXT[reason] : 'Önce kurulumu tamamlayın. Kurulum, manevranın sizin için uygun olup olmadığını kontrol eder.'}</p>
        </div>
        {reason === 'NO_DIAGNOSIS' && <UrgencyLadder />}
        <button className="btn primary block" onClick={() => nav('/hasta/kurulum')}>
          {reason ? 'Bilgilerimi düzenle' : 'Kuruluma git'}
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
    // Aynı tanıtma sahnesi için yalnız bir kez (yeniden çizimde ikinci kez çalışıp akışı geri sarmasın).
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
      setStage(back.k === 'sideRun' || back.k === 'maneuver' || back.k === 'retestRun' ? { ...back, chained: fresh, auto: true } : back);
      return;
    }
    const flags = firstRunFlags();
    if (mode === 'practice') {
      const s = practiceSideRef.current;
      if (s) setStage({ k: 'maneuver', side: s, ...flags });
      else setStage({ k: 'practiceSide' });
      return;
    }
    const ep = activeEpisode(store.get());
    if (sideOrderRef.current && (mode === 'start' || mode === 'retest')) {
      const order = sideOrderRef.current;
      sideOrderRef.current = null;
      setStage({ k: 'sideRun', order, results: [], ...flags });
      return;
    }
    if (mode === 'retest') {
      const s = ep ? episodeSide(ep, profile) : null;
      if (!s) return toStart();
      setStage({ k: 'retestRun', side: s, ...flags });
      return;
    }
    if (mode === 'treat') {
      const s = ep ? episodeSide(ep, profile) : null;
      if (!s) return toStart();
      if (!checkDose()) return;
      setStage({ k: 'maneuver', side: s, ...flags });
      return;
    }
    // start
    if (ep && ep.side) {
      if (!checkDose()) return;
      setStage({ k: 'maneuver', side: ep.side, ...flags });
      return;
    }
    // Geçerli (son 14 gün) klinisyen reçetesi aynı atağı tanımlar: taraf testi yapılmadan reçetedeki tarafa manevra.
    // Diğer her atakta iki taraflı test yapılır (nükste taraf/tip sıklıkla değişir).
    const testedBefore = !!ep && ep.sideTests.length > 0;
    if (rxShortcutApplies() && !testedBefore) {
      const s = profile.prescription!.side;
      const id = ensureEpisode();
      updateEpisode(id, (e) => ({ ...e, side: s }));
      if (!checkDose()) return;
      setStage({ k: 'maneuver', side: s, ...flags });
      return;
    }
    setStage({ k: 'sideQ' });
  };

  const toStart = () => {
    setStage({
      k: 'end',
      tone: 'warn',
      title: 'Taraf belirlenmemiş',
      text: 'Bu atakta tedavi edilen taraf bulunamadı. Ana ekrandan atağa yeniden başlayın.',
      testid: 'end-noside'
    });
  };

  const checkDose = (): boolean => {
    const ep = activeEpisode(store.get());
    if (!ep) return true;
    const now = Date.now();
    const ds = doseFor(store.get(), ep, now);
    if (!ds.allowed) {
      if (ds.reason !== 'DAILY_LIMIT') {
        updateEpisode(ep.id, (e) => ({ ...e, status: 'referred', endedAt: now, endNote: DOSE_TEXT[ds.reason] }));
      }
      setStage({ k: 'end', tone: 'warn', title: 'Manevra sınırına ulaşıldı', text: doseLimitText(ds, store.get(), now), testid: 'end-dose' });
      return false;
    }
    return true;
  };

  const onRedFlagsDone = (answers: Record<string, YesNo>) => {
    const out = evaluateRedFlags(answers);
    if (mode === 'practice' && out.stop && out.action) {
      setStage({ k: 'stop', action: out.action, triggered: out.triggered });
      return;
    }
    if (mode !== 'practice') {
      const id = ensureEpisode();
      updateEpisode(id, (e) => ({ ...e, redFlags: [...e.redFlags, { at: Date.now(), answers, stopped: out.stop }] }));
      if (out.stop) {
        updateEpisode(id, (e) => ({
          ...e,
          status: out.action === 'emergency' ? 'emergency' : 'referred',
          endedAt: Date.now(),
          endNote: out.triggered.map((q) => q.id).join(', ')
        }));
      }
    }
    if (out.stop && out.action) setStage({ k: 'stop', action: out.action, triggered: out.triggered });
    else setStage(afterSafetyStage());
  };

  const logSideTest = (results: SideTestResult[], stronger: Side | 'equal' | null, decision: SideDecision) => {
    const id = ensureEpisode();
    updateEpisode(id, (e) => ({
      ...e,
      side: decision.kind === 'TREAT' ? decision.side : e.side,
      sideTests: [...e.sideTests, { at: Date.now(), results, stronger, decision }],
      ...(decision.kind === 'REFER' ? { status: 'referred' as const, endedAt: Date.now(), endNote: decision.reason } : {})
    }));
  };

  const knownSideForConflict = (): Side | null => recentKnownSide(profile);

  const decide = (results: SideTestResult[], stronger: Side | 'equal' | null) => {
    let dec = interpretSideTests(results, knownSideForConflict(), stronger);
    if (dec.kind === 'ASK_STRONGER') {
      // Bilinen (reçete) taraf yoksa her yanıt yönlendirmeyle biter: soru sorulmaz, telefon indirilmez.
      if (!knownSideForConflict()) return decide(results, 'equal');
      setStage({ k: 'stronger', results });
      return;
    }
    // Kurulumda girilen hekim tanısındaki tarafla çelişki (reçete yokken): yakın tarihli tanıda reçetedeki gibi yönlendir,
    // eski tanıda uyar ve rapora not düş.
    let dxWarn: Side | null = null;
    if (dec.kind === 'TREAT') {
      const chk = dxSideCheck(profile, dec.side);
      if (chk.kind !== 'ok') {
        const id = ensureEpisode();
        updateEpisode(id, (e) => ({ ...e, sideConflictNote: chk.note }));
        if (chk.kind === 'refer') dec = { kind: 'REFER', reason: 'SIDE_CONFLICT' };
        else dxWarn = chk.dxSide;
      }
    }
    const triggeredNotBefore = !!activeEpisode(store.get())?.sideTests.some((t) => t.decision.kind === 'NOT_TRIGGERED');
    logSideTest(results, stronger, dec);
    if (dec.kind === 'NOT_TRIGGERED' && triggeredNotBefore) {
      // İkinci kez tetiklenmedi: arka kanal testi negatif pozisyonel baş dönmesi evde değerlendirilemez (yatay kanal?).
      const ep = activeEpisode(store.get());
      // Kilit konmaz (manevra yapılmadı; kendiliğinden düzelmiş olabilir): atak kapanır, sürüyorsa hekime başvurması söylenir.
      if (ep) updateEpisode(ep.id, (e) => ({ ...e, status: 'closed', endedAt: Date.now(), endNote: 'Taraf testi iki kez baş dönmesini tetiklemedi' }));
      setStage({ k: 'end', tone: 'info', title: 'Baş dönmesi yine tetiklenmedi', text: NOT_TRIGGERED_TWICE_TEXT, testid: 'end-not-triggered-twice' });
      return;
    }
    if (dec.kind === 'TREAT') {
      if (!checkDose()) return;
      // Ekrana bakılmadan karar verildiyse (şiddet sorusu sorulmadı) telefon alında: zincirle manevraya geç.
      setStage(stronger === null ? { k: 'chainGate', side: dec.side, dxWarn } : { k: 'maneuver', side: dec.side });
    } else if (dec.kind === 'NOT_TRIGGERED') {
      setStage({
        k: 'end',
        tone: 'info',
        title: 'Bugün baş dönmesi tetiklenmedi',
        remindAt: nextMorning(Date.now()),
        remindTitle: 'DengeYol: sabah testi',
        text: 'Pozisyon testleri baş dönmesini başlatmadı; bu durumda manevra yapılmaz. Kristaller kendiliğinden yerine oturmuş olabilir. Yarın sabah yeniden test edelim. Bu arada yatakta dönerken baş dönmesi sürerse hekiminize başvurun.',
        testid: 'end-not-triggered'
      });
    } else if (dec.kind === 'REFER') {
      setStage({ k: 'end', tone: 'warn', title: 'Hekiminize ya da odyoloğunuza başvurun', text: REFER_TEXT[dec.reason], testid: 'end-refer' });
    }
  };

  const onSideRunExit = (o: RunnerOutcome, order: Side[], results: SideTestResult[]) => {
    if (notStarted(o)) return;
    const side = order[results.length]!;
    if (o.phase === 'aborted') {
      setStage({ k: 'end', tone: 'info', title: 'Test yarıda bırakıldı', text: 'Hazır olduğunuzda ana ekrandan yeniden başlayabilirsiniz.', testid: 'end-aborted' });
      return;
    }
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
      // Diğer tarafı test etmeden yönlendir
      const filled = (['R', 'L'] as Side[]).map(
        (s) => all.find((x) => x.side === s) ?? { side: s, vertigo: false, latencySec: null, durationSec: null, safetyStopped: false }
      );
      decide(filled, null);
      return;
    }
    if (all.length < order.length) setStage({ k: 'sideRest', order, results: all });
    else decide(all, null);
  };

  const logManeuver = (o: RunnerOutcome, side: Side) => {
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
      protocolId: maneuverId,
      side,
      completed: o.phase === 'done',
      stopReason: o.state.stopReason,
      records: o.state.records,
      manual: o.manual,
      // Raporda "yakını yaptırdı": o anki ayar manevrayla birlikte saklanır.
      assisted: store.get().settings.assist === 'helper'
    };
    updateEpisode(id, (e) => ({ ...e, side, maneuvers: [...e.maneuvers, log] }));
  };

  const onManeuverExit = (o: RunnerOutcome, side: Side) => {
    if (notStarted(o)) return;
    logManeuver(o, side);
    // Manevranın herhangi bir pozisyonunda baş dönmesi ≥1 dk sürdüyse (taraf testiyle aynı eşik): atipik → hekime.
    // Tamamlanan manevrada bitişi işaretlenmemiş uzun işaret olamaz; yarıda bırakılanda yalnız kapanmış işaretler sayılır.
    const long = mode !== 'practice' && o.state.records.some((r) => {
      const v = vertigoSummary(r);
      if (!v) return false;
      return v.durationSec === null ? o.phase === 'done' : v.durationSec >= ATYPICAL_VERTIGO_SEC;
    });
    if (long && (o.phase === 'done' || o.phase === 'aborted')) {
      const ep = activeEpisode(store.get());
      if (ep) updateEpisode(ep.id, (e) => ({ ...e, status: 'referred', endedAt: Date.now(), endNote: 'ATYPICAL_LONG' }));
      if (o.phase === 'aborted') {
        setStage({ k: 'end', tone: 'warn', title: 'Hekiminize başvurun', text: LONG_IN_MANEUVER_TEXT, testid: 'end-refer' });
        return;
      }
      longVertigoRef.current = true;
    }
    // Deneme manevrasında baş dönmesi işaretlendiyse: deneme tedavi yolu değildir, gerçek akışa yönlendir.
    if (mode === 'practice' && (o.phase === 'safetyStop' || long || o.state.records.some((r) => (vertigoSummary(r)?.durationSec ?? 0) >= ATYPICAL_VERTIGO_SEC))) {
      // Denemede uzun baş dönmesi: gerçek atakta olduğu gibi yönlendirme kaydı ve kilit.
      store.update((x) => ({
        ...x,
        episodes: [
          ...x.episodes,
          { id: uid(), startedAt: Date.now(), side: null, protocolId: maneuverId, redFlags: [], sideTests: [], maneuvers: [], retests: [], status: 'referred', endedAt: Date.now(), endNote: 'Deneme manevrasında uzun baş dönmesi' }
        ]
      }));
      setStage({ k: 'end', tone: 'warn', title: 'Hekiminize başvurun', text: LONG_IN_MANEUVER_TEXT, testid: 'end-refer' });
      return;
    }
    if (mode === 'practice' && o.state.records.some((r) => r.vertigoMarks.length > 0)) {
      setStage({ k: 'end', tone: 'warn', title: 'Deneme sırasında baş dönmesi oldu', text: PRACTICE_VERTIGO_TEXT, testid: 'end-practice-vertigo' });
      return;
    }
    if (o.phase === 'done') {
      setStage({ k: 'after', side });
    } else if (o.phase === 'safetyStop') {
      const ep = activeEpisode(store.get());
      if (ep && mode !== 'practice') updateEpisode(ep.id, (e) => ({ ...e, status: 'referred', endedAt: Date.now(), endNote: 'VERTIGO_TOO_LONG' }));
      setStage({ k: 'end', tone: 'warn', title: 'Manevra durduruldu', text: REFER_TEXT.ATYPICAL_LONG, testid: 'end-safety' });
    } else if (o.state.stopReason === 'USER_FEELS_UNWELL') {
      setStage({
        k: 'end',
        tone: 'warn',
        title: 'Dinlenin',
        text: 'Manevrayı durdurdunuz. Yavaşça oturun, dinlenin ve su için. Kendinizi iyi hissetmiyorsanız ya da yeni bir belirti varsa hekiminize başvurun; acil belirtilerde 112\'yi arayın.',
        testid: 'end-unwell'
      });
    } else {
      setStage({ k: 'end', tone: 'info', title: 'Manevra yarıda bırakıldı', text: 'Hazır olduğunuzda ana ekrandan yeniden başlayabilirsiniz.', testid: 'end-aborted' });
    }
  };

  const onRetestExit = (o: RunnerOutcome, side: Side) => {
    if (notStarted(o)) return;
    if (o.phase === 'aborted') {
      setStage({ k: 'end', tone: 'info', title: 'Test yarıda bırakıldı', text: 'Hazır olduğunuzda ana ekrandan yeniden deneyin.', testid: 'end-aborted' });
      return;
    }
    const ep = activeEpisode(store.get());
    const rec = o.state.records.find((r) => r.stepId === 'dh-lie');
    const v = rec ? vertigoSummary(rec) : null;
    const na = ep ? nextAction(ep, Date.now()) : null;
    const kind = na?.kind === 'morning-retest' ? 'morning' : na?.kind === 'early-retest' ? 'early' : 'other';
    if (ep) {
      updateEpisode(ep.id, (e) => ({
        ...e,
        retests: [...e.retests, { at: Date.now(), kind, side, vertigo: !!v || o.phase === 'safetyStop', latencySec: v?.latencySec ?? null, durationSec: v?.durationSec ?? null }]
      }));
    }
    if (o.phase === 'safetyStop' || (v && (v.durationSec === null || v.durationSec >= 60))) {
      if (ep) updateEpisode(ep.id, (e) => ({ ...e, status: 'referred', endedAt: Date.now(), endNote: 'ATYPICAL_LONG' }));
      setStage({ k: 'end', tone: 'warn', title: 'Hekiminize başvurun', text: REFER_TEXT.ATYPICAL_LONG, testid: 'end-refer' });
      return;
    }
    if (!v) {
      setStage(
        kind === 'morning'
          ? {
              k: 'end',
              tone: 'ok',
              title: 'Düzelmiş görünüyor',
              text: 'Sabah testi de baş dönmesini tetiklemedi. Ana ekrandan atağı kapatabilirsiniz. Baş dönmesi yeniden başlarsa uygulamayı tekrar kullanabilirsiniz.',
              testid: 'end-resolved'
            }
          : {
              k: 'end',
              tone: 'ok',
              title: 'Test baş dönmesini tetiklemedi',
              text: 'Şimdilik baş dönmesi tetiklenmedi. Kristallerin yerinde kaldığını görmek için yarın sabah bir kez daha test edelim.',
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
      title: 'Baş dönmesi hâlâ tetikleniyor',
      text: `Manevrayı yeniden yapabilirsiniz (günde en fazla ${doseLimitsFor(profile).maxPerDay} manevra).`,
      testid: 'end-retest-positive',
      extra: 'treat'
    });
  };

  // ---- Görünüm ------------------------------------------------------------------------------------
  switch (stage.k) {
    case 'blocked':
      return (
        <Screen title="DengeYol" back="/hasta">
          {stage.why === 'referral' ? (
            <>
              <SpeakOnce text={BLOCKED_REFERRAL_TEXT} />
              <div className="card tint-warn stack" data-testid="blocked-referral">
                <div className="card-title">
                  <Icon name="alert" />
                  <h2>Önce hekiminizle görüşün</h2>
                </div>
                <p>
                  Son atağınız hekime ya da acile yönlendirmeyle sonlandı. Yeni bir manevra yapmadan önce bu durumu hekiminizle konuşmanız gerekir.
                </p>
              </div>
              <ListenAgain text={BLOCKED_REFERRAL_TEXT} />
              <DoctorClearance testid="doctor-cleared" onCleared={() => setStage(initialStage())} />
            </>
          ) : (
            <div className="card tint-accent stack" data-testid="blocked-practice">
              <h2>Bugünlük deneme yeterli</h2>
              <p>Deneme manevrası günde en fazla {PRACTICE_PER_DAY} kez yapılabilir. Yarın yeniden deneyebilirsiniz.</p>
            </div>
          )}
          <button className="btn ghost" onClick={() => nav('/hasta', { replace: true })}>
            Ana ekran
          </button>
        </Screen>
      );

    case 'reopen':
      return (
        <RunOnce
          key="reopen"
          run={() => {
            store.update((x) => reopenEpisode(x, stage.id));
            setEpisodeId(stage.id);
            const ep = activeEpisode(store.get());
            const plan = startBlockedByPlan(ep, Date.now());
            setStage(plan ? planStage(plan) : initialStage());
          }}
        />
      );

    case 'redflags': {
      const q = flags[stage.i]!;
      const answer = (v: YesNo) => {
        const answers = { ...stage.answers, [q.id]: v };
        setLeaveAsk(false);
        if (v === q.stopsOn) setStage({ k: 'redflagConfirm', i: stage.i, answers });
        else if (stage.i === flags.length - 1) onRedFlagsDone(answers);
        else setStage({ k: 'redflags', i: stage.i + 1, answers });
      };
      const yes = q.yesLabel ?? 'Evet, var';
      const no = q.noLabel ?? 'Hayır, yok';
      // Özel yanıt etiketleri ("Evet, farklı / Hayır, aynı") de okunur: hangi yanıtın ne demek olduğu duyulsun.
      const spoken = q.yesLabel || q.noLabel ? choiceSpeech(q.text, [yes, no].map((s) => s.replace(' / ', ' ya da '))) : q.text;
      const intro = stage.i === 0 && recur ? `${recur.text} Şimdi güvenlik soruları.` : undefined;
      return (
        <Screen
          title="Güvenlik soruları"
          onBack={() => (stage.i === 0 ? nav('/hasta') : setStage({ k: 'redflags', i: stage.i - 1, answers: stage.answers }))}
        >
          <StepDots total={flags.length} index={stage.i} />
          {intro && (
            <div className="notice" data-testid="recurrence-warning">
              <Icon name="alert" />
              <span>{recur!.text}</span>
            </div>
          )}
          <p className="small muted">
            Soru {stage.i + 1} / {flags.length}
          </p>
          <SpokenQuestion text={q.text} spoken={intro ? `${intro} ${spoken}` : spoken} qid={q.id} />
          <div className="spacer" />
          <YesNoButtons onAnswer={answer} value={stage.answers[q.id]} yesLabel={yes} noLabel={no} lockKey={q.id} />
          <ListenAgain text={spoken} />
          {leaveAsk && (
            <div className="card tint-warn stack" data-testid="redflag-leave">
              <strong>Sorulardan çıkılsın mı? Verdiğiniz yanıtlar silinir.</strong>
              <button className="btn secondary block" onClick={() => setLeaveAsk(false)} data-testid="redflag-leave-no">
                Hayır, sorulara devam
              </button>
              <button className="btn ghost block" onClick={() => nav('/hasta', { replace: true })} data-testid="redflag-leave-yes">
                Evet, çık
              </button>
            </div>
          )}
        </Screen>
      );
    }

    case 'redflagConfirm':
      return <RedFlagConfirm q={flags[stage.i]!} onConfirm={() => onRedFlagsDone(stage.answers)} onBack={() => {
        const answers = { ...stage.answers };
        delete answers[flags[stage.i]!.id];
        setStage({ k: 'redflags', i: stage.i, answers });
      }} />;

    case 'stop': {
      const emergency = stage.action === 'emergency';
      const title = emergency ? 'Manevra yapmayın, hemen yardım isteyin' : 'Manevra yapmayın';
      const whys = stage.triggered.length === 0 ? [AFTER_NEURO_TEXT] : stage.triggered.map((q) => q.why);
      const todo = emergency ? 'Hemen 112\'yi arayın.' : 'Hekiminize ya da odyoloğunuza başvurun ve işaretlediğiniz belirtiyi söyleyin.';
      const spokenStop = `${title}. ${whys.join(' ')} ${todo}`;
      // Rapor yalnız atak kaydı olan gerçek akışta var (denemede rapor yok).
      const hasReport = !!episodeId && mode !== 'practice';
      return (
        <Screen title={emergency ? 'Acil değerlendirme gerekli' : 'Hekiminize başvurun'} back="/hasta">
          <SpeakOnce text={spokenStop} priority="high" />
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
            <a className="btn danger block xl" href="tel:112">
              <Icon name="phone" /> 112'yi ara
            </a>
          ) : (
            <div className="card soft small">
              <p>
                {todo}
                {hasReport ? ' Aşağıdaki rapor, verdiğiniz yanıtları içerir; yanınızda götürün.' : ''}
              </p>
            </div>
          )}
          <ListenAgain text={spokenStop} />
          {hasReport && (
            <button className="btn secondary block" onClick={() => nav(`/hasta/rapor/${episodeId}`)}>
              <Icon name="print" /> Raporu göster
            </button>
          )}
          <button className="btn ghost" onClick={() => nav('/hasta', { replace: true })}>
            Ana ekran
          </button>
        </Screen>
      );
    }

    case 'prep':
      return (
        <PrepScreen
          mode={mode}
          maneuverId={maneuverId}
          sideTest={!!sideOrderRef.current}
          onReady={() => {
            fromPrepRef.current = true;
            setStage({ k: 'calibrate', saved: !!store.get().patient?.calibration && !forceCal });
          }}
        />
      );

    case 'calibrate':
      if (stage.saved && profile.calibration) return <RunOnce key="saved-cal" run={() => afterCalibration(profile.calibration!, false)} />;
      return (
        <Screen title="Telefonu tanıtma" back="/hasta">
          <Calibrate
            audience="patient"
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
              if (v === 'same') setStage({ k: 'prep' });
              else {
                // Geçip yeniden başladıysa nüks: tip ve taraf yeniden belirlenir.
                rxBypassRef.current = true;
                setStage({ k: 'subtype', q: 1 });
              }
            }}
            options={[
              { value: 'same', label: 'Hayır, muayeneden beri hiç geçmedi', sub: 'Reçetedeki tarafa doğrudan manevra.' },
              { value: 'new', label: 'Evet, geçmişti; yeniden başladı', sub: 'Kısa sorular ve iki taraflı test.' },
              { value: 'unsure', label: 'Emin değilim', sub: 'Kısa sorular ve iki taraflı test.' }
            ]}
          />
        </Screen>
      );

    case 'subtype': {
      const refer = (title: string, text: string, note: string) => {
        const id = ensureEpisode();
        updateEpisode(id, (e) => ({ ...e, status: 'referred', endedAt: Date.now(), endNote: note }));
        setStage({ k: 'end', tone: 'warn', title, text, testid: 'end-refer' });
      };
      if (stage.q === 'hcConfirm') {
        return (
          <HcConfirm
            onBack={() => setStage({ k: 'subtype', q: 1 })}
            onYes={() => refer('Hekiminize ya da odyoloğunuza başvurun', SUBTYPE_HC_TEXT, 'Alt tip sorusu: sırtüstü baş çevirmeyle (yatay kanal şüphesi)')}
            onUnsure={() => setStage({ k: 'subtype', q: 2 })}
          />
        );
      }
      return stage.q === 1 ? (
        <Screen title="Baş dönmeniz" back="/hasta">
          <StepDots total={2} index={0} />
          <ChoiceQuestion
            title="Baş dönmesini en çok hangisi başlatıyor?"
            name="Tetikleyen hareket"
            lockKey="subtype-1"
            onChange={(v: 'liedown' | 'turn' | 'unsure') => {
              // Yönlendirme kalıcı kilit koyar: tek dokunuşla olmasın, onay istenir.
              if (v === 'turn') setStage({ k: 'subtype', q: 'hcConfirm' });
              else setStage({ k: 'subtype', q: 2 });
            }}
            options={[
              // Kim HJ ve ark. JAMA Neurol 2023, 4. soru: karşılaştırmalı. Sırtüstü yatarken sağa-sola dönmek (baş çevirmek)
              // yatay kanalı düşündürür. Taraf sorusu "dönmek" değil "yana yatmak" sözüyle sorulur (ifadeler karışmasın).
              { value: 'liedown', label: 'Yatarken ya da yataktan kalkarken (ya da yukarı bakınca)' },
              { value: 'turn', label: 'Sırtüstü yatarken sağa-sola dönünce ya da başımı çevirince', sub: 'Yatıp kalkmaktan daha çok.' },
              { value: 'unsure', label: 'İkisi de / emin değilim' }
            ]}
          />
        </Screen>
      ) : (
        <Screen title="Baş dönmeniz" onBack={() => setStage({ k: 'subtype', q: 1 })}>
          <StepDots total={2} index={1} />
          <ChoiceQuestion
            title="Dönme hissi her seferinde ne kadar sürüyor?"
            lead="Yalnız etrafın dönmesini sayın; sonrasında kalan sersemlik ve bulantı hariç."
            name="Süre"
            lockKey="subtype-2"
            onChange={(v: 'short' | 'mid' | 'long' | 'unsure') => {
              // Kim 2023 tarama ölçütü: <3 dk. Hastalar süreyi sık fazla tahmin eder; 1–3 dk teste gider, test süreyi ölçer
              // (≥1 dk ölçülürse yine hekime yönlendirilir).
              if (v === 'long') refer('Hekiminize başvurun', SUBTYPE_LONG_TEXT, 'Alt tip sorusu: dönme hissi 3 dakikadan uzun');
              else setStage({ k: 'sideQ' });
            }}
            options={[
              { value: 'short', label: '1 dakikadan kısa (saniyeler)' },
              { value: 'mid', label: '1–3 dakika' },
              { value: 'long', label: '3 dakikadan uzun' },
              { value: 'unsure', label: 'Bilmiyorum', sub: 'Birazdan yapacağımız kısa test bunu ölçer.' }
            ]}
          />
        </Screen>
      );
    }

    case 'sideQ':
      return (
        <Screen title="Taraf testi" back="/hasta">
          <ChoiceQuestion
            title="Hangi yanınıza yatınca (hangi kulağınız alttayken) baş dönmesi daha çok oluyor?"
            lead="Ardından her iki tarafı kısa bir testle deneyeceğiz. Test baş dönmesini başlatabilir; bu beklenen bir durumdur."
            name="Şüpheli taraf"
            lockKey="sideQ"
            onChange={(v: 'R' | 'L' | 'both') => {
              // Önce şüpheli olmayan taraf test edilir.
              const order: Side[] = v === 'R' ? ['L', 'R'] : v === 'L' ? ['R', 'L'] : ['R', 'L'];
              // Telefon henüz alna konmadıysa önce hazırlık; tanıtmadan sonra soruluyorsa doğrudan test.
              if (calibratedRef.current) setStage({ k: 'sideRun', order, results: [] });
              else {
                sideOrderRef.current = order;
                setStage({ k: 'prep' });
              }
            }}
            options={[
              { value: 'R', label: 'Sağ yanıma yatınca' },
              { value: 'L', label: 'Sol yanıma yatınca' },
              { value: 'both', label: 'İki yanda da / bilmiyorum' }
            ]}
          />
        </Screen>
      );

    case 'sideRun': {
      const side = stage.order[stage.results.length]!;
      const other = stage.order[1]!;
      const ch = runFlags(stage);
      return (
        <RunnerView
          key={`side-${side}`}
          protocolId="dix-hallpike"
          side={side}
          mode="patient"
          calibration={ch.calibration}
          chained={ch.chained}
          autoStart={ch.autoStart}
          startNote={stage.results.length === 0 ? `Önce ${sideName(side)}, sonra ${sideName(other)} tarafı test ediyoruz.` : undefined}
          onPlaced={onPlaced}
          onSensorless={() => {
            setCal(null);
            setPlaced(null);
          }}
          onRecalibrate={recalibrate}
          onExit={(o) => onSideRunExit(o, stage.order, stage.results)}
          intro={
            <div className="notice info">
              <Icon name="info" />
              <span>
                Test {stage.results.length + 1} / 2: <strong>{sideName(side)}</strong> taraf.
                {stage.results.length === 0 ? ` Önce ${sideName(side)}, sonra ${sideName(other)} tarafı deniyoruz; telefon iki test boyunca alnınızda kalacak.` : ''}
              </span>
            </div>
          }
        />
      );
    }

    case 'sideRest':
      return (
        <RestBetween
          onContinue={() => setStage({ k: 'sideRun', order: stage.order, results: stage.results, chained: true })}
          onExit={() =>
            setStage({ k: 'end', tone: 'info', title: 'Test yarıda bırakıldı', text: 'Hazır olduğunuzda ana ekrandan yeniden başlayabilirsiniz.', testid: 'end-aborted' })
          }
          next={stage.order[stage.results.length]!}
        />
      );

    case 'chainGate':
      return (
        <TapGate
          testid="chain-continue"
          title={`${sideName(stage.side).charAt(0).toLocaleUpperCase('tr-TR') + sideName(stage.side).slice(1)} tarafta baş dönmesi oldu`}
          text={`${
            stage.dxWarn
              ? `Dikkat: hekiminiz daha önce ${sideName(stage.dxWarn)} taraf demişti; bu kez ${sideName(stage.side)} tarafta baş dönmesi oldu. Tekrarlayan atakta taraf değişebilir. Bu durum raporunuza yazıldı; bir sonraki muayenede hekiminize söyleyin. Manevra yapmak istemiyorsanız telefonu alnınızdan alın, köşedeki Bitir düğmesini basılı tutun ve hekiminize danışın. `
              : ''
          }Şimdi ${sideName(stage.side)} taraf için manevrayı yapacağız. Telefon alnınızda kalsın. Baş dönmeniz geçtiyse ve hazırsanız ekranın herhangi bir yerine dokunun.`}
          onTap={() => setStage({ k: 'maneuver', side: stage.side, chained: true })}
          onExit={() =>
            setStage({ k: 'end', tone: 'info', title: 'Manevra başlatılmadı', text: 'Hazır olduğunuzda ana ekrandan devam edebilirsiniz; taraf kaydedildi.', testid: 'end-aborted' })
          }
        />
      );

    case 'stronger':
      return (
        <Screen title="İki tarafta da baş dönmesi" back="/hasta">
          {/* Normal öncelik: yürütücünün son cümlesini kesmez. */}
          <ChoiceQuestion
            title="Hangisinde baş dönmesi daha şiddetliydi?"
            spokenPrefix="İki tarafta da baş dönmesi oldu. Telefonu alnınızdan alıp ekrandaki soruyu yanıtlayın."
            priority="normal"
            name="Şiddetli taraf"
            lockKey="stronger"
            lockMs={1000}
            onChange={(v: 'R' | 'L' | 'equal') => decide(stage.results, v)}
            options={[
              { value: 'R', label: 'Sağ tarafa yatınca' },
              { value: 'L', label: 'Sol tarafa yatınca' },
              { value: 'equal', label: 'Aşağı yukarı aynı' }
            ]}
          />
        </Screen>
      );

    case 'practiceSide':
      return (
        <Screen title="Deneme manevrası" back="/hasta">
          <ChoiceQuestion
            title="Hangi taraf için denemek istersiniz?"
            name="Deneme tarafı"
            lockKey="practiceSide"
            onChange={(v: Side) => {
              practiceSideRef.current = v;
              setStage(calibratedRef.current ? { k: 'maneuver', side: v } : { k: 'prep' });
            }}
            options={[
              { value: 'R', label: 'Sağ' },
              { value: 'L', label: 'Sol' }
            ]}
          />
        </Screen>
      );

    case 'maneuver':
      return (
        <RunnerView
          key={`man-${stage.side}`}
          protocolId={maneuverId}
          side={stage.side}
          mode="patient"
          {...runFlags(stage)}
          onPlaced={onPlaced}
          onSensorless={() => {
            setCal(null);
            setPlaced(null);
          }}
          onRecalibrate={recalibrate}
          onExit={(o) => onManeuverExit(o, stage.side)}
          intro={
            mode === 'practice' ? (
              <div className="notice info">
                <Icon name="info" />
                <span>Deneme manevrası: atağa kaydedilmez ama günlük/toplam manevra sınırına sayılır.</span>
              </div>
            ) : undefined
          }
        />
      );

    case 'after':
      return <AfterManeuver practice={mode === 'practice'} onDone={(sev) => {
        if (mode !== 'practice') {
          // Uzun baş dönmesi yolunda atak "referred" olmuştur; kayıt yine bu atağa yazılsın (aktif atak aranmaz).
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
          // Yeni nörolojik belirti: her şeyden önce acil (uzun baş dönmesi yolunda da). Atak kilitlenir.
          longVertigoRef.current = false;
          const epId = episodeId ?? activeEpisode(store.get())?.id;
          if (epId && mode !== 'practice') updateEpisode(epId, (e) => ({ ...e, status: 'emergency', endedAt: Date.now(), endNote: 'Manevra sonrası yeni nörolojik belirti' }));
          setStage({ k: 'stop', action: 'emergency', triggered: [] });
        } else if (longVertigoRef.current && mode !== 'practice') {
          longVertigoRef.current = false;
          setStage({ k: 'end', tone: 'warn', title: 'Manevra tamamlandı — hekiminize başvurun', text: LONG_IN_MANEUVER_TEXT, testid: 'end-refer' });
        } else if (sev === 'severe') {
          setStage({
            k: 'end',
            tone: 'warn',
            title: 'Bugün manevrayı tekrarlamayın',
            text: 'Oturarak dinlenin ve küçük yudumlarla su için. Sıvı alamayacak kadar kusma sürerse hekiminize başvurun. Konuşma bozukluğu, güçsüzlük, çift görme ya da şiddetli baş ağrısı olursa hemen 112\'yi arayın.',
            testid: 'end-severe'
          });
        } else {
          const mild =
            sev === 'mild'
              ? 'Hafif baş dönmesi ve bulantı manevradan sonra birkaç dakika, bazen birkaç saat sürebilir; bu beklenen bir durumdur. Geçmezse ya da artarsa manevrayı tekrarlamayın; kusma başlarsa bugün yeniden manevra yapmayın ve hekiminize danışın. '
              : '';
          setStage({
            k: 'end',
            tone: mode === 'practice' || sev === 'none' ? 'ok' : 'info',
            title: mode === 'practice' ? 'Deneme tamamlandı' : 'Manevra tamamlandı',
            text:
              mode === 'practice'
                ? 'Artık adımları biliyorsunuz. Baş dönmeniz başladığında aynı yönergelerle yapacaksınız.'
                : `${mild}10 dakika oturarak dinlenin: baş dönmesi tamamen sönsün ve dengeniz yerine gelsin. Kalkarken önce yatağın kenarında oturun, bir yere tutunun; gece ise ışığı açın. ${formatTime(Date.now() + EARLY_RETEST_MS)} civarında ana ekrandan tekrar testini yapın.`,
            testid: 'end-maneuver-done',
            ...(mode === 'practice' ? {} : { extra: 'rest' as const, remindAt: Date.now() + EARLY_RETEST_MS, remindTitle: 'DengeYol: tekrar testi' })
          });
        }
      }} />;

    case 'retestRun':
      return (
        <RunnerView
          key="retest"
          protocolId="dix-hallpike"
          side={stage.side}
          mode="patient"
          {...runFlags(stage)}
          onPlaced={onPlaced}
          onSensorless={() => {
            setCal(null);
            setPlaced(null);
          }}
          onRecalibrate={recalibrate}
          onExit={(o) => onRetestExit(o, stage.side)}
          intro={
            <div className="notice info">
              <Icon name="info" />
              <span>
                Tekrar testi: tedavi edilen <strong>{sideName(stage.side)}</strong> taraf. Baş dönmesi başlarsa ekrana dokunun.
              </span>
            </div>
          }
        />
      );

    case 'end': {
      const canTreat = stage.extra === 'treat' && (() => {
        const ep = activeEpisode(d);
        return ep ? doseFor(d, ep, Date.now()).allowed : false;
      })();
      const ep = activeEpisode(d);
      const side = ep ? episodeSide(ep, profile) : null;
      // "Manevra tamamlandı" yürütücüde söylendi; burada yalnız öneri okunur.
      const endSpoken = stage.testid === 'end-maneuver-done' ? stage.text : `${stage.title}. ${stage.text}`;
      return (
        <Screen title="DengeYol" back="/hasta">
          <SpeakOnce text={endSpoken} />
          <div className={`card tint-${stage.tone === 'info' ? 'accent' : stage.tone === 'danger' ? 'danger' : stage.tone} stack`} data-testid={stage.testid}>
            <h1>{stage.title}</h1>
            <p className="lead">{stage.text}</p>
          </div>
          {stage.extra === 'rest' && <RestTimer />}
          <ListenAgain text={endSpoken} />
          {canTreat && side && (
            <button className="btn primary block xl" onClick={() => setStage({ k: 'maneuver', side })} data-testid="treat-now">
              Manevrayı şimdi tekrarla
            </button>
          )}
          {stage.extra === 'treat' && !canTreat && ep && (
            <div className="notice danger">
              <Icon name="alert" />
              <span>{(() => { const now = Date.now(); const ds = doseFor(d, ep, now); return ds.allowed ? '' : doseLimitText(ds, d, now); })()}</span>
            </div>
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
          <button className="btn secondary block" onClick={() => nav('/hasta', { replace: true })} data-testid="go-home">
            Ana ekran
          </button>
          {/* Rapor yalnız hekime yönlendirmede öne çıkar (götürülecek); diğer durumlarda ana ekran/geçmişten açılır. */}
          {episodeId && mode !== 'practice' && stage.tone === 'warn' && (
            <button className="btn ghost" onClick={() => nav(`/hasta/rapor/${episodeId}`)}>
              <Icon name="print" /> Hekime götürülecek rapor
            </button>
          )}
        </Screen>
      );
    }
  }
}

/**
 * İki taraf testi arası: telefon alında kalır. 30 s sesli geri sayım, sonra "baş dönmeniz geçtiyse ekrana dokunun".
 * Ekranın her yeri dokunma alanıdır (hasta ekranı görmez); köşedeki "Bitir" basılı tutularak akıştan çıkar.
 */
function RestBetween({ onContinue, onExit, next }: { onContinue: () => void; onExit: () => void; next: Side }) {
  const [left, setLeft] = useState(30);
  const st = store.get().settings;
  const step = st.simulation ? st.timeScale : 1;
  useEffect(() => {
    void keepAwake();
    // Normal öncelik: yürütücünün "Test tamamlandı" cümlesini kesmez, ardından okunur.
    // Beklemenin nedeni de söylenir (sayaç sırasında dokunuşlara tepki yok; hasta bozuk sanmasın).
    speech.speak(
      `Oturun ve dinlenin. Telefon alnınızda kalsın. Baş dönmesi tamamen sönsün diye otuz saniye bekliyoruz; sonra ${sideName(next)} tarafı test edeceğiz.`,
      'normal'
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
    speech.speak(`${Math.ceil(left)} saniye.`, 'normal');
  }, [left]);
  const ready = left <= 0;
  useEffect(() => {
    if (!ready) return;
    haptics.play('move');
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
function TapGate({ title, text, onTap, onExit, testid }: { title: string; text: string; onTap: () => void; onExit: () => void; testid: string }) {
  useEffect(() => {
    void keepAwake();
    haptics.play('move');
    tones.play('move');
    speech.speak(`${title}. ${text}`, 'normal');
  }, [title, text]);
  return (
    <TapSurface testid={testid} enabled onTap={onTap} onExit={onExit}>
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
  children
}: {
  testid: string;
  enabled: boolean;
  onTap: () => void;
  onExit: () => void;
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
      {children}
    </div>
  );
}

type AfterSev = 'none' | 'mild' | 'severe' | 'neuro';

/**
 * Manevra sonrası "Şu an nasılsınız?". Açılışta ~1 s dokunuş kilidi (telefonu alından alırken kör dokunuş seçim yapmasın);
 * "Kusma" ve "Yeni belirti" kalıcı sonuç doğurduğu için (bugün manevra yok / acil kilidi) "Doğru mu?" onayı istenir.
 * Onaylanınca yol aynıdır.
 */
function AfterManeuver({ onDone, practice }: { onDone: (sev: AfterSev) => void; practice: boolean }) {
  const [confirm, setConfirm] = useState<'severe' | 'neuro' | null>(null);
  const options: { value: AfterSev; label: string; sub?: string }[] = [
    { value: 'none', label: 'İyiyim' },
    { value: 'mild', label: 'Hafif baş dönmesi ya da bulantı var', sub: 'Manevradan sonra birkaç dakika sürebilir.' },
    { value: 'severe', label: 'Kusma ya da şiddetli bulantı var' },
    { value: 'neuro', label: 'Yeni belirti var', sub: 'Konuşma bozukluğu, yüzde/kolda güçsüzlük, çift görme ya da şiddetli baş ağrısı.' }
  ];
  if (confirm) {
    const o = options.find((x) => x.value === confirm)!;
    return (
      <ConfirmAnswer
        title={practice ? 'Deneme bitti' : 'Manevra bitti'}
        question="Şu an nasılsınız?"
        answer={o.sub ? `${o.label}: ${o.sub}` : o.label}
        consequence={confirm === 'neuro' ? 'Bu yanıtla acil değerlendirme önerilecek ve atak kilitlenecek.' : 'Bu yanıtla bugün başka manevra yapılmayacak.'}
        danger={confirm === 'neuro'}
        testid="after-confirm"
        onConfirm={() => onDone(confirm)}
        onBack={() => setConfirm(null)}
      />
    );
  }
  return (
    <Screen title={practice ? 'Deneme bitti' : 'Manevra bitti'}>
      {/* Normal öncelik: yürütücünün "Manevra tamamlandı" cümlesini kesmez. */}
      <ChoiceQuestion
        title="Şu an nasılsınız?"
        spokenPrefix="Oturmaya devam edin; kalkarken dikkatli olun. Yavaşça telefonu alnınızdan alın ve ekrandaki soruyu yanıtlayın."
        priority="normal"
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
 * Kalıcı sonuç doğuran yanıtın onayı ("Doğru mu?"). Düğmeler açılışta kısa süre kilitli: önceki ekrandaki çift dokunuşun
 * ikincisi onayı da vermesin.
 */
function ConfirmAnswer({
  title,
  question,
  answer,
  consequence,
  danger,
  testid,
  onConfirm,
  onBack
}: {
  title: string;
  question: string;
  answer: string;
  consequence: string;
  danger?: boolean;
  testid: string;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const locked = useTapLock(testid, 800);
  const spoken = choiceSpeech(`Yanıtınız: ${answer}. ${consequence} Doğru mu?`, ['Evet, doğru', 'Yanlış dokundum, soruya dön']);
  return (
    <Screen title={title} onBack={onBack}>
      <SpeakOnce text={spoken} priority="high" />
      <div className={`card ${danger ? 'tint-danger' : 'tint-warn'} stack`} data-testid={testid}>
        <p className="small muted">Yanıtınız:</p>
        <h2>{question}</h2>
        <p className="lead">
          <strong>{answer}</strong>
        </p>
        <p>{consequence} Doğru mu?</p>
      </div>
      <div className="stack" data-locked={locked || undefined} style={locked ? { opacity: 0.55 } : undefined}>
        <button
          className={`btn ${danger ? 'danger' : 'warn'} block xl`}
          aria-disabled={locked || undefined}
          onClick={() => !locked && onConfirm()}
          data-testid={`${testid}-yes`}
        >
          Evet, doğru
        </button>
        <button className="btn secondary block xl" aria-disabled={locked || undefined} onClick={() => !locked && onBack()} data-testid={`${testid}-back`}>
          Yanlış dokundum, soruya dön
        </button>
      </div>
      <ListenAgain text={spoken} />
    </Screen>
  );
}

/** Güvenlik sorusunda durduran yanıtın onayı. */
function RedFlagConfirm({ q, onConfirm, onBack }: { q: RedFlagQuestion; onConfirm: () => void; onBack: () => void }) {
  return (
    <ConfirmAnswer
      title="Güvenlik soruları"
      question={q.text}
      answer={q.yesLabel ?? 'Evet, var'}
      consequence="Bu yanıt nedeniyle manevra yapılmayacak."
      danger={q.action === 'emergency'}
      testid="redflag-confirm"
      onConfirm={onConfirm}
      onBack={onBack}
    />
  );
}

/**
 * Seçenekli soru: başlık + seçenekler bir kez sesli okunur ("Birinci: …"), büyük "Tekrar dinle" düğmesi ve çift dokunuş
 * kilidi. priority "high": önceki sorunun yarım kalan okunuşunu keser; yürütücüden hemen sonra "normal" (son cümlesi
 * kesilmesin).
 */
function ChoiceQuestion<T extends string>({
  title,
  lead,
  spokenPrefix,
  priority = 'high',
  name,
  options,
  onChange,
  lockKey,
  lockMs = 800
}: {
  title: string;
  lead?: string;
  spokenPrefix?: string;
  priority?: 'high' | 'normal';
  name: string;
  options: { value: T; label: string; sub?: string }[];
  onChange: (v: T) => void;
  lockKey: string;
  lockMs?: number;
}) {
  const spoken = choiceSpeech(
    [spokenPrefix, title, lead].filter(Boolean).join(' '),
    options.map((o) => (o.sub ? `${o.label}. ${o.sub}` : o.label).replace(/ \/ /g, ' ya da '))
  );
  return (
    <>
      <SpeakOnce text={spoken} priority={priority} />
      <h1>{title}</h1>
      {lead && <p className="lead">{lead}</p>}
      <Choice name={name} value={null} onChange={onChange} options={options} lockKey={lockKey} lockMs={lockMs} />
      <ListenAgain text={spoken} />
    </>
  );
}

/**
 * Yatay kanal şüphesi onayı. İki düğme aynı görünüşte: öne çıkan renkli düğme alışkanlıkla basılıp kalıcı yönlendirmeye
 * yol açmasın.
 */
function HcConfirm({ onBack, onYes, onUnsure }: { onBack: () => void; onYes: () => void; onUnsure: () => void }) {
  const locked = useTapLock('hc', 800);
  const title = 'En çok sırtüstü yatarken sağa-sola dönünce ya da başınızı çevirince mi?';
  const text =
    'Bu, evde tedavi edilemeyen bir kristal oynaması tipini (yatay kanal) düşündürür. Bu yanıtla manevra yapılmaz ve hekiminize ya da odyoloğunuza yönlendirilirsiniz. Yatıp kalkmak da en az o kadar baş dönmesi yapıyorsa "Emin değilim"i seçin; kısa bir testle bakalım.';
  const spoken = choiceSpeech(`${title} ${text}`, ['Evet, en çok dönünce', 'Emin değilim, kısa testle bakalım']);
  return (
    <Screen title="Baş dönmeniz" onBack={onBack}>
      <SpeakOnce text={spoken} priority="high" />
      <div className="card tint-warn stack" data-testid="subtype-hc-confirm">
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <div className="stack" data-locked={locked || undefined} style={locked ? { opacity: 0.55 } : undefined}>
        <button className="btn secondary block xl" aria-disabled={locked || undefined} onClick={() => !locked && onYes()} data-testid="subtype-hc-yes">
          Evet, en çok dönünce
        </button>
        <button className="btn secondary block xl" aria-disabled={locked || undefined} onClick={() => !locked && onUnsure()} data-testid="subtype-hc-unsure">
          Emin değilim, kısa testle bakalım
        </button>
      </div>
      <ListenAgain text={spoken} />
    </Screen>
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

/** Soruyu ekranda gösterir ve (ses açıksa) bir kez sesli okur. spoken: okunacak metin (varsayılan soru metni). */
function SpokenQuestion({ text, spoken, qid }: { text: string; spoken?: string; qid: string }) {
  const say = spoken ?? text;
  useEffect(() => {
    speech.speak(say, 'high');
  }, [say]);
  return (
    <h1 data-testid="redflag-question" data-qid={qid}>
      {text}
    </h1>
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

/** Taraf testinde ya da manevrada bu süreyi aşan baş dönmesi BPPV kanalolitiazisine uymaz (Bárány 2015: <1 dk). */
const ATYPICAL_VERTIGO_SEC = 60;

const SUBTYPE_HC_TEXT =
  'Sırtüstü yatarken başınızı sağa-sola çevirince başlayan baş dönmesi, evde tedavi edilemeyen yatay kanal BPPV olabilir. Bu tip farklı bir manevrayla klinikte tedavi edilir. Odyoloğunuz ya da hekiminiz DengeYol klinisyen moduyla yardımcı olabilir.';

const NOT_TRIGGERED_TWICE_TEXT =
  'Pozisyon testi iki kez baş dönmesini tetiklemedi. Baş dönmeniz sürüyorsa bu, evde test edilemeyen yatay kanal BPPV ya da başka bir neden olabilir. Hekiminize ya da odyoloğunuza başvurun.';

const SUBTYPE_LONG_TEXT =
  'Her seferinde 3 dakikadan uzun süren dönme hissi BPPV\'ye uymaz. Evde manevra yapmayın; hekiminize ya da odyoloğunuza başvurun. Konuşma bozukluğu, güçsüzlük ya da çift görme olursa hemen 112\'yi arayın.';

const PRACTICE_VERTIGO_TEXT =
  'Deneme manevrası, baş dönmesi yokken adımları öğrenmek içindir ve tedavi yerine geçmez. Baş dönmeniz varsa ana ekrandaki "Baş dönmem başladı" ile ilerleyin: güvenlik soruları ve kısa bir test yapılır.';

const AFTER_NEURO_TEXT = 'Yeni bir nörolojik belirti bildirdiniz. Bu, kristal oynamasına (BPPV) bağlı değildir ve acil değerlendirme gerektirir.';

const BLOCKED_REFERRAL_TEXT =
  'Önce hekiminizle görüşün. Son atağınız hekime ya da acile yönlendirmeyle sonlandı. Yeni bir manevra yapmadan önce bu durumu hekiminizle konuşmanız gerekir.';

/** Manevra sonrası oturarak dinlenme (saniye). */
const REST_AFTER_SEC = 10 * 60;

const LONG_IN_MANEUVER_TEXT =
  'Manevra sırasında baş dönmesi 1 dakikadan uzun sürdü. Bu, tipik BPPV\'ye uymaz. Manevrayı tekrarlamayın; hekiminize ya da odyoloğunuza başvurun. Acil belirtilerde 112\'yi arayın.';

/** Tek hazırlık ekranı: yatak ve yastık, ses, kim yapıyor. Sonrasında telefon alnadır ve akış dokunmadan ilerler. */
function PrepScreen({ mode, maneuverId, sideTest, onReady }: { mode: Mode; maneuverId: 'epley' | 'semont'; sideTest: boolean; onReady: () => void }) {
  const d = useData();
  const { source } = useMotion();
  const helper = d.settings.assist === 'helper';
  const setAssist = (v: 'self' | 'helper') => store.update((x) => ({ ...x, settings: { ...x.settings, assist: v } }));
  const duration =
    mode === 'retest' && !sideTest
      ? 'yaklaşık 3 dakika'
      : sideTest
        ? 'yaklaşık 12–15 dakika (iki kısa test ve manevra)'
        : 'yaklaşık 6–8 dakika';
  // Yalnız Semont yapılacaksa (test yok) yastıklı Epley/Dix-Hallpike çizimi ve maddesi gösterilmez.
  const semontOnly = maneuverId === 'semont' && !sideTest && mode !== 'retest';
  const bedItem = semontOnly
    ? 'Yatağın uzun kenarının ortasına oturun, bacaklarınız yataktan aşağı sarksın; iki yanınızda yatacak kadar yer olsun. Yastık gerekmez.'
    : 'Yatağın üzerine oturun; yastık, sırtüstü yattığınızda omuzlarınızın altına gelsin.';
  const items = [
    bedItem,
    ...(maneuverId === 'semont' && sideTest
      ? ['Testlerden sonraki Semont manevrası için yatağın uzun kenarının ortasına geçeceğiz; sırası gelince sesle söyleyeceğim.']
      : []),
    'Sesi açın, sessiz modu kapatın.',
    'Telefonu yan kenarlarından parmak uçlarınızla tutun; avucunuz ekrana değmesin.',
    'Telefonu alnınıza koyduktan sonra her şeyi sesle söyleyeceğim. Baş dönmesi olursa ekranın herhangi bir yerine dokunun.'
  ];
  const spoken = `Hazırlık. ${items.join(' ')} Hazırsanız ekrandaki Hazırım düğmesine dokunun.`;
  return (
    <Screen title="Hazırlık" back="/hasta">
      {!semontOnly && <BedSetup />}
      <ol className="stack" style={{ margin: 0, paddingLeft: 22 }} data-testid="prep">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ol>
      <ListenAgain text={spoken} />
      <p className="small muted" data-testid="prep-hearing">
        İşitme cihazı kullanıyorsanız: telefonla Bluetooth bağlantısını kontrol edin ve sesi deneyin. Cihaz yatarken kayabilir;
        sabitleyin ya da bir yakınınızla yapın. Sesi kaçırırsanız titreşim ve bip sesleri ne zaman hareket edeceğinizi bildirir.
      </p>
      {!speech.usable() && (
        <div className="notice" data-testid="prep-no-voice">
          <Icon name="alert" />
          <span>Bu telefonda Türkçe sesli okuma bulunamadı. Manevrayı bir yakınınızla yapın; yönergeleri ekrandan okusun.</span>
        </div>
      )}
      {!haptics.supported() && (
        <p className="small muted">Bu telefonda titreşim yok; uyarılar ses ve bip ile verilir. iPhone'da sessiz anahtarı kapalı ve sesi yüksek tutun.</p>
      )}
      <div className="card stack">
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
        {helper && <HelperCard />}
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
      <p className="small muted">Süre: {duration}.</p>
      <button
        className="btn primary block xl"
        onClick={() => {
          // Bu dokunuş içinde: ses kilidi (iOS), hareket izni (iOS) ve ekranı açık tutma; sonraki akış dokunuşsuz ilerler.
          unlockAudio();
          void source.start();
          void keepAwake();
          onReady();
        }}
        data-testid="prep-ready"
      >
        Hazırım
      </button>
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
