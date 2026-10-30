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
  episodeSide,
  formatTime,
  EARLY_RETEST_MS,
  needsRedFlags,
  nextAction,
  nextMorning,
  pendingReferral,
  doseLimitsFor,
  recentKnownSide,
  rxFirstEpisode,
  practiceAllowed,
  PRACTICE_PER_DAY
} from '../../../state/episodes';
import { activeEpisode, store, uid, useData } from '../../../state/store';
import type { Episode, ManeuverLog } from '../../../state/types';
import { Choice, Segmented, StepDots, YesNo as YesNoButtons } from '../../components/Controls';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Calibrate } from '../Calibrate';
import { HelperCard, RunnerView, type RunnerOutcome } from '../RunnerView';
import { BedSetup } from '../Illustrations';
import { speech } from '../../../platform/speech';
import { DoctorClearance } from './PatientHome';
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
  | { k: 'calibrate' }
  /** Alt tip soruları (Kim HJ ve ark. JAMA Neurol 2023): yatay kanal ve uzun atak şüphesi hekime yönlendirir. */
  | { k: 'subtype'; q: 1 | 2 | 'hcConfirm' }
  | { k: 'sideQ' }
  | { k: 'sideRun'; order: Side[]; results: SideTestResult[]; chained?: boolean; auto?: boolean }
  /** Taraf testinden sonra, telefon alından inmeden manevraya geçiş (tek dokunuş, ekranın her yeri). */
  | { k: 'chainGate'; side: Side }
  | { k: 'sideRest'; order: Side[]; results: SideTestResult[] }
  | { k: 'stronger'; results: SideTestResult[] }
  | { k: 'practiceSide' }
  | { k: 'maneuver'; side: Side; chained?: boolean; auto?: boolean }
  | { k: 'after'; side: Side }
  | { k: 'retestRun'; side: Side; chained?: boolean; auto?: boolean }
  | { k: 'end'; tone: 'ok' | 'warn' | 'danger' | 'info'; title: string; text: string; testid: string; extra?: 'treat'; remindAt?: number; remindTitle?: string };

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
  /** Manevrada ≥1 dk baş dönmesi oldu: "nasılsınız" sorusundan sonra hekime yönlendirme ekranı. */
  const longVertigoRef = useRef(false);
  const recalibrate = () => {
    resumeRef.current = stage;
    setForceCal(true);
    setStage({ k: 'calibrate' });
  };
  /** Yürütücü hiç başlatılmadan kapatıldı: kayıt yazma, ana ekrana dön. */
  const notStarted = (o: RunnerOutcome) => {
    if (o.started !== false) return false;
    nav('/hasta', { replace: true });
    return true;
  };

  // Deneme manevrasında "aynı baş dönmesi mi" sorusu anlamsızdır; diğer güvenlik soruları her seferinde sorulur.
  const flags = mode === 'practice' ? RED_FLAGS.filter((q) => q.id !== 'same') : RED_FLAGS;

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
    if (mode === 'treat') return { k: 'prep' };
    if (ep && (ep.side || ep.sideTests.length > 0)) return { k: 'prep' };
    if (rxFirstEpisode(cur)) return { k: 'prep' };
    return { k: 'subtype', q: 1 };
  };

  const initialStage = (): Stage => {
    const cur = store.get();
    const ep = activeEpisode(cur);
    if (!ep && pendingReferral(cur)) return { k: 'blocked', why: 'referral' };
    if (mode === 'practice') {
      if (!practiceAllowed(cur, Date.now())) return { k: 'blocked', why: 'practiceLimit' };
      return { k: 'redflags', i: 0, answers: {} };
    }
    if (needsRedFlags(ep, Date.now())) return { k: 'redflags', i: 0, answers: {} };
    return afterSafetyStage();
  };
  const [stage, setStage] = useState<Stage>(initialStage);
  useEffect(() => {
    window.scrollTo(0, 0);
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
    return (
      <Screen title="DengeYol" back="/hasta">
        <div className="card tint-warn">
          <p>Önce kurulumu tamamlayın. Kurulum, manevranın sizin için uygun olup olmadığını kontrol eder.</p>
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
    if (rxFirstEpisode(store.get()) && !testedBefore) {
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
    const ds = doseFor(store.get(), ep, Date.now());
    if (!ds.allowed) {
      if (ds.reason !== 'DAILY_LIMIT') {
        updateEpisode(ep.id, (e) => ({ ...e, status: 'referred', endedAt: Date.now(), endNote: DOSE_TEXT[ds.reason] }));
      }
      setStage({ k: 'end', tone: 'warn', title: 'Manevra sınırına ulaşıldı', text: DOSE_TEXT[ds.reason], testid: 'end-dose' });
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
    const dec = interpretSideTests(results, knownSideForConflict(), stronger);
    if (dec.kind === 'ASK_STRONGER') {
      setStage({ k: 'stronger', results });
      return;
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
      setStage(stronger === null ? { k: 'chainGate', side: dec.side } : { k: 'maneuver', side: dec.side });
    } else if (dec.kind === 'NOT_TRIGGERED') {
      setStage({
        k: 'end',
        tone: 'info',
        title: 'Bugün baş dönmesi tetiklenmedi',
        text: 'Pozisyon testleri baş dönmesini başlatmadı; bu durumda manevra yapılmaz. Kristaller kendiliğinden yerine oturmuş olabilir. Yarın sabah bir kez daha test edelim. Yatarken ya da yatakta dönerken baş dönmeniz sürüyorsa bu, evde test edilemeyen yatay kanal BPPV olabilir; hekiminize başvurun.',
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
      manual: o.manual
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
              <div className="card tint-warn stack" data-testid="blocked-referral">
                <div className="card-title">
                  <Icon name="alert" />
                  <h2>Önce hekiminizle görüşün</h2>
                </div>
                <p>
                  Son atağınız hekime ya da acile yönlendirmeyle sonlandı. Yeni bir manevra yapmadan önce bu durumu hekiminizle konuşmanız gerekir.
                </p>
              </div>
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

    case 'redflags': {
      const q = flags[stage.i]!;
      const answer = (v: YesNo) => {
        const answers = { ...stage.answers, [q.id]: v };
        if (v === q.stopsOn) setStage({ k: 'redflagConfirm', i: stage.i, answers });
        else if (stage.i === flags.length - 1) onRedFlagsDone(answers);
        else setStage({ k: 'redflags', i: stage.i + 1, answers });
      };
      return (
        <Screen
          title="Güvenlik soruları"
          onBack={() => (stage.i === 0 ? nav('/hasta') : setStage({ k: 'redflags', i: stage.i - 1, answers: stage.answers }))}
        >
          <StepDots total={flags.length} index={stage.i} />
          <p className="small muted">
            Soru {stage.i + 1} / {flags.length}
          </p>
          <SpokenQuestion text={q.text} qid={q.id} />
          <div className="spacer" />
          <YesNoButtons onAnswer={answer} value={stage.answers[q.id]} yesLabel={q.yesLabel ?? 'Evet, var'} noLabel={q.noLabel ?? 'Hayır, yok'} lockKey={q.id} />
        </Screen>
      );
    }

    case 'redflagConfirm': {
      const q = flags[stage.i]!;
      const back = () => {
        const answers = { ...stage.answers };
        delete answers[q.id];
        setStage({ k: 'redflags', i: stage.i, answers });
      };
      return (
        <Screen title="Güvenlik soruları" onBack={back}>
          <div className="card tint-warn stack" data-testid="redflag-confirm">
            <p className="small muted">Yanıtınız:</p>
            <h2>{q.text}</h2>
            <p className="lead">
              <strong>{q.yesLabel ?? 'Evet, var'}</strong>
            </p>
            <p>Bu yanıt nedeniyle manevra yapılmayacak. Doğru mu?</p>
          </div>
          <button className="btn warn block xl" onClick={() => onRedFlagsDone(stage.answers)} data-testid="redflag-confirm-yes">
            Evet, doğru
          </button>
          <button className="btn secondary block xl" onClick={back} data-testid="redflag-confirm-back">
            Yanlış dokundum, soruya dön
          </button>
        </Screen>
      );
    }

    case 'stop':
      return (
        <Screen title={stage.action === 'emergency' ? 'Acil değerlendirme gerekli' : 'Hekiminize başvurun'} back="/hasta">
          <div className={`card ${stage.action === 'emergency' ? 'tint-danger' : 'tint-warn'} stack`} data-testid={`stop-${stage.action}`}>
            <div className="card-title">
              <Icon name="alert" />
              <h2>{stage.action === 'emergency' ? 'Manevra yapmayın, hemen yardım isteyin' : 'Manevra yapmayın'}</h2>
            </div>
            {stage.triggered.length === 0 && (
              <p>Yeni bir nörolojik belirti bildirdiniz. Bu, BPPV'ye bağlı değildir ve acil değerlendirme gerektirir.</p>
            )}
            {stage.triggered.length === 0 && (
              <p>Yeni bir nörolojik belirti bildirdiniz. Bu, BPPV'ye bağlı değildir ve acil değerlendirme gerektirir.</p>
            )}
            {stage.triggered.map((q) => (
              <p key={q.id}>{q.why}</p>
            ))}
          </div>
          {stage.action === 'emergency' ? (
            <a className="btn danger block xl" href="tel:112">
              <Icon name="phone" /> 112'yi ara
            </a>
          ) : (
            <div className="card soft small">
              <p>Hekiminize ya da odyoloğunuza başvurun. Aşağıdaki rapor, verdiğiniz yanıtları içerir.</p>
            </div>
          )}
          {episodeId && (
            <button className="btn secondary block" onClick={() => nav(`/hasta/rapor/${episodeId}`)}>
              <Icon name="print" /> Raporu göster
            </button>
          )}
          <button className="btn ghost" onClick={() => nav('/hasta', { replace: true })}>
            Ana ekran
          </button>
        </Screen>
      );

    case 'prep':
      return (
        <PrepScreen
          mode={mode}
          sideTest={!!sideOrderRef.current}
          onReady={() => {
            fromPrepRef.current = true;
            setStage({ k: 'calibrate' });
          }}
        />
      );

    case 'calibrate':
      if (profile.calibration && !forceCal) return <RunOnce key="saved-cal" run={() => afterCalibration(profile.calibration!, false)} />;
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

    case 'subtype': {
      const refer = (title: string, text: string, note: string) => {
        const id = ensureEpisode();
        updateEpisode(id, (e) => ({ ...e, status: 'referred', endedAt: Date.now(), endNote: note }));
        setStage({ k: 'end', tone: 'warn', title, text, testid: 'end-refer' });
      };
      if (stage.q === 'hcConfirm') {
        return (
          <Screen title="Baş dönmeniz" onBack={() => setStage({ k: 'subtype', q: 1 })}>
            <div className="card tint-warn stack" data-testid="subtype-hc-confirm">
              <h2>En çok yatakta sağa-sola dönerken mi?</h2>
              <p>
                Bu, evde tedavi edilemeyen yatay kanal BPPV'yi düşündürür. Bu yanıtla manevra yapılmaz ve hekiminize ya da odyoloğunuza
                yönlendirilirsiniz. Yatıp kalkmak da en az o kadar baş dönmesi yapıyorsa "Emin değilim"i seçin; kısa bir testle bakalım.
              </p>
            </div>
            <button
              className="btn warn block xl"
              onClick={() =>
                refer('Hekiminize ya da odyoloğunuza başvurun', SUBTYPE_HC_TEXT, 'Alt tip sorusu: sırtüstü baş çevirmeyle (yatay kanal şüphesi)')
              }
              data-testid="subtype-hc-yes"
            >
              Evet, en çok dönerken
            </button>
            <button className="btn secondary block xl" onClick={() => setStage({ k: 'subtype', q: 2 })} data-testid="subtype-hc-unsure">
              Emin değilim, kısa testle bakalım
            </button>
          </Screen>
        );
      }
      return stage.q === 1 ? (
        <Screen title="Baş dönmeniz" back="/hasta">
          <StepDots total={2} index={0} />
          <h1>Baş dönmesini en çok hangisi başlatıyor?</h1>
          <Choice
            name="Tetikleyen hareket"
            value={null}
            onChange={(v: 'liedown' | 'turn' | 'unsure') => {
              // Yönlendirme kalıcı kilit koyar: tek dokunuşla olmasın, onay istenir.
              if (v === 'turn') setStage({ k: 'subtype', q: 'hcConfirm' });
              else setStage({ k: 'subtype', q: 2 });
            }}
            options={[
              // Kim HJ ve ark. JAMA Neurol 2023, 4. soru: karşılaştırmalı. "Yatakta dönmek" yatay kanalı düşündürür.
              { value: 'liedown', label: 'Yatarken ya da yataktan kalkarken (ya da yukarı bakınca)' },
              { value: 'turn', label: 'Yatakta sağa-sola dönerken', sub: 'Yatıp kalkmaktan daha çok.' },
              { value: 'unsure', label: 'İkisi de / emin değilim' }
            ]}
          />
        </Screen>
      ) : (
        <Screen title="Baş dönmeniz" onBack={() => setStage({ k: 'subtype', q: 1 })}>
          <StepDots total={2} index={1} />
          <h1>Dönme hissi her seferinde ne kadar sürüyor?</h1>
          <p className="lead">Yalnız etrafın dönmesini sayın; sonrasında kalan sersemlik ve bulantı hariç.</p>
          <Choice
            name="Süre"
            value={null}
            onChange={(v: 'short' | 'long' | 'unsure') => {
              if (v === 'long') refer('Hekiminize başvurun', REFER_TEXT.ATYPICAL_LONG, 'Alt tip sorusu: baş dönmesi 1 dakikadan uzun');
              else setStage({ k: 'sideQ' });
            }}
            options={[
              { value: 'short', label: '1 dakikadan kısa (saniyeler)' },
              { value: 'long', label: '1 dakikadan uzun' },
              { value: 'unsure', label: 'Bilmiyorum', sub: 'Birazdan yapacağımız kısa test bunu ölçer.' }
            ]}
          />
        </Screen>
      );
    }

    case 'sideQ':
      return (
        <Screen title="Taraf testi" back="/hasta">
          <h1>Yatakta hangi tarafa döndüğünüzde baş dönmesi daha çok oluyor?</h1>
          <p className="lead">Ardından her iki tarafı kısa bir testle deneyeceğiz. Test baş dönmesini tetikleyebilir; bu beklenen bir durumdur.</p>
          <Choice
            name="Şüpheli taraf"
            value={null}
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
              { value: 'R', label: 'Sağa dönünce' },
              { value: 'L', label: 'Sola dönünce' },
              { value: 'both', label: 'İki tarafta da / bilmiyorum' }
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
          onPlaced={onPlaced}
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
          next={stage.order[stage.results.length]!}
        />
      );

    case 'chainGate':
      return (
        <TapGate
          testid="chain-continue"
          title={`${sideName(stage.side).charAt(0).toLocaleUpperCase('tr-TR') + sideName(stage.side).slice(1)} tarafta baş dönmesi oldu`}
          text={`Şimdi ${sideName(stage.side)} taraf için manevrayı yapacağız. Telefon alnınızda kalsın. Baş dönmeniz geçtiyse ve hazırsanız ekranın herhangi bir yerine dokunun.`}
          onTap={() => setStage({ k: 'maneuver', side: stage.side, chained: true })}
        />
      );

    case 'stronger':
      return (
        <Screen title="İki tarafta da baş dönmesi" back="/hasta">
          <h1>Hangisinde baş dönmesi daha şiddetliydi?</h1>
          <Choice
            name="Şiddetli taraf"
            value={null}
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
          <h1>Hangi taraf için denemek istersiniz?</h1>
          <Choice
            name="Deneme tarafı"
            value={null}
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
          const ep = activeEpisode(store.get());
          if (ep) {
            updateEpisode(ep.id, (e) => {
              const ms = e.maneuvers.slice();
              const last = ms[ms.length - 1];
              if (last) ms[ms.length - 1] = { ...last, afterSymptoms: sev };
              return { ...e, maneuvers: ms };
            });
          }
        }
        if (longVertigoRef.current && mode !== 'practice') {
          longVertigoRef.current = false;
          setStage({ k: 'end', tone: 'warn', title: 'Manevra tamamlandı — hekiminize başvurun', text: LONG_IN_MANEUVER_TEXT, testid: 'end-refer' });
        } else if (sev === 'neuro') {
          // Yeni nörolojik belirti: acil. Atak kilitlenir (hekimle görüşülene kadar yeni manevra yok).
          const ep = activeEpisode(store.get());
          if (ep && mode !== 'practice') updateEpisode(ep.id, (e) => ({ ...e, status: 'emergency', endedAt: Date.now(), endNote: 'Manevra sonrası yeni nörolojik belirti' }));
          setStage({ k: 'stop', action: 'emergency', triggered: [] });
        } else if (sev === 'severe') {
          setStage({
            k: 'end',
            tone: 'warn',
            title: 'Bugün manevrayı tekrarlamayın',
            text: 'Oturarak dinlenin ve küçük yudumlarla su için. Sıvı alamayacak kadar kusma sürerse hekiminize başvurun. Konuşma bozukluğu, güçsüzlük, çift görme ya da şiddetli baş ağrısı olursa hemen 112\'yi arayın.',
            testid: 'end-severe'
          });
        } else {
          setStage({
            k: 'end',
            tone: 'ok',
            title: mode === 'practice' ? 'Deneme tamamlandı' : 'Manevra tamamlandı',
            text:
              mode === 'practice'
                ? 'Artık adımları biliyorsunuz. Baş dönmeniz başladığında aynı yönergelerle yapacaksınız.'
                : `10 dakika oturarak dinlenin; kalkarken dikkatli olun. ${formatTime(Date.now() + EARLY_RETEST_MS)} civarında ana ekrandan tekrar testini yapın.`,
            testid: 'end-maneuver-done',
            ...(mode === 'practice' ? {} : { remindAt: Date.now() + EARLY_RETEST_MS, remindTitle: 'DengeYol: tekrar testi' })
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
      return (
        <Screen title="DengeYol" back="/hasta">
          <div className={`card tint-${stage.tone === 'info' ? 'accent' : stage.tone === 'danger' ? 'danger' : stage.tone} stack`} data-testid={stage.testid}>
            <h1>{stage.title}</h1>
            <p className="lead">{stage.text}</p>
          </div>
          {canTreat && side && (
            <button className="btn primary block xl" onClick={() => setStage({ k: 'maneuver', side })} data-testid="treat-now">
              Manevrayı şimdi tekrarla
            </button>
          )}
          {stage.extra === 'treat' && !canTreat && ep && (
            <div className="notice danger">
              <Icon name="alert" />
              <span>{(() => { const ds = doseFor(d, ep, Date.now()); return ds.allowed ? '' : DOSE_TEXT[ds.reason]; })()}</span>
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
 * Ekranın her yeri dokunma alanıdır (hasta ekranı görmez).
 */
function RestBetween({ onContinue, next }: { onContinue: () => void; next: Side }) {
  const [left, setLeft] = useState(30);
  const st = store.get().settings;
  const step = st.simulation ? st.timeScale : 1;
  useEffect(() => {
    speech.speak(`Oturun ve dinlenin. Telefon alnınızda kalsın. Otuz saniye sonra ${sideName(next)} tarafı test edeceğiz.`, 'high');
    const id = setInterval(() => setLeft((l) => Math.max(0, l - step)), 1000);
    return () => clearInterval(id);
  }, [step, next]);
  const ready = left <= 0;
  useEffect(() => {
    if (!ready) return;
    haptics.play('move');
    tones.play('move');
    speech.speak(`Baş dönmeniz geçtiyse ekranın herhangi bir yerine dokunun; ${sideName(next)} tarafı test edeceğiz.`, 'high');
  }, [ready, next]);
  return (
    <button className="tap-gate" disabled={!ready} onClick={onContinue} data-testid="rest-continue">
      <span className="tap-gate-title">Oturun ve dinlenin</span>
      <span className="tap-gate-count" aria-live="polite">
        {ready ? 'Hazırsanız dokunun' : left}
      </span>
      <span className="tap-gate-text">Telefon alnınızda kalsın. Ardından {sideName(next)} tarafı test edeceğiz.</span>
    </button>
  );
}

/** Tek dokunuşla geçiş ekranı (ekranın her yeri düğme); metni sesli okur. */
function TapGate({ title, text, onTap, testid }: { title: string; text: string; onTap: () => void; testid: string }) {
  useEffect(() => {
    haptics.play('move');
    tones.play('move');
    speech.speak(`${title}. ${text}`, 'high');
  }, [title, text]);
  return (
    <button className="tap-gate" onClick={onTap} data-testid={testid}>
      <span className="tap-gate-title">{title}</span>
      <span className="tap-gate-text">{text}</span>
      <span className="tap-gate-count">Dokunun</span>
    </button>
  );
}

function AfterManeuver({ onDone, practice }: { onDone: (sev: 'none' | 'mild' | 'severe' | 'neuro') => void; practice: boolean }) {
  return (
    <Screen title={practice ? 'Deneme bitti' : 'Manevra bitti'}>
      <h1>Şu an nasılsınız?</h1>
      <Choice
        name="Manevra sonrası"
        value={null}
        onChange={onDone}
        options={[
          { value: 'none', label: 'İyiyim' },
          { value: 'mild', label: 'Hafif baş dönmesi ya da bulantı var', sub: 'Manevradan sonra birkaç dakika sürebilir.' },
          { value: 'severe', label: 'Kusma ya da şiddetli bulantı var' },
          { value: 'neuro', label: 'Yeni belirti var', sub: 'Konuşma bozukluğu, yüzde/kolda güçsüzlük, çift görme ya da şiddetli baş ağrısı.' }
        ]}
      />
    </Screen>
  );
}

/** Soruyu ekranda gösterir ve (ses açıksa) bir kez sesli okur. */
function SpokenQuestion({ text, qid }: { text: string; qid: string }) {
  useEffect(() => {
    speech.speak(text, 'high');
  }, [text]);
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

const PRACTICE_VERTIGO_TEXT =
  'Deneme manevrası, baş dönmesi yokken adımları öğrenmek içindir ve tedavi yerine geçmez. Baş dönmeniz varsa ana ekrandaki "Baş dönmem başladı" ile ilerleyin: güvenlik soruları ve kısa bir test yapılır.';

const LONG_IN_MANEUVER_TEXT =
  'Manevra sırasında baş dönmesi 1 dakikadan uzun sürdü. Bu, tipik BPPV\'ye uymaz. Manevrayı tekrarlamayın; hekiminize ya da odyoloğunuza başvurun. Acil belirtilerde 112\'yi arayın.';

/** Tek hazırlık ekranı: yatak ve yastık, ses, kim yapıyor. Sonrasında telefon alnadır ve akış dokunmadan ilerler. */
function PrepScreen({ mode, sideTest, onReady }: { mode: Mode; sideTest: boolean; onReady: () => void }) {
  const d = useData();
  const helper = d.settings.assist === 'helper';
  const setAssist = (v: 'self' | 'helper') => store.update((x) => ({ ...x, settings: { ...x.settings, assist: v } }));
  const duration =
    mode === 'retest' && !sideTest
      ? 'yaklaşık 3 dakika'
      : sideTest
        ? 'yaklaşık 12–15 dakika (iki kısa test ve manevra)'
        : 'yaklaşık 6–8 dakika';
  return (
    <Screen title="Hazırlık" back="/hasta">
      <BedSetup />
      <ol className="stack" style={{ margin: 0, paddingLeft: 22 }} data-testid="prep">
        <li>Yatağın üzerine oturun; yastık, sırtüstü yattığınızda omuzlarınızın altına gelsin.</li>
        <li>Sesi açın, sessiz modu kapatın.</li>
        <li>Telefonu alnınıza koyduktan sonra her şeyi sesle söyleyeceğim. Baş dönmesi olursa ekranın herhangi bir yerine dokunun.</li>
      </ol>
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
      </div>
      <p className="small muted">Süre: {duration}.</p>
      <button className="btn primary block xl" onClick={onReady} data-testid="prep-ready">
        Hazırım
      </button>
    </Screen>
  );
}
