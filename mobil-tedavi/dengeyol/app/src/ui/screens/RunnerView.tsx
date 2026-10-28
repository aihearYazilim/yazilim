/**
 * Manevra / test yürütme ekranı (hasta ve klinisyen ortak).
 * Telefon alındayken ekran dışa baktığı için yardımcı kişi ya da klinisyen ekranı görebilir; hasta sesle yönlendirilir.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CALIBRATION_ERROR_TEXT, computeCalibration, residualUprightDeg, type Calibration } from '../../core/calibration';
import { HINT_TEXT_CLINICIAN } from '../../core/evaluator';
import { resolveProtocol, type ProtocolId, type ResolvedProtocol, type Side, sideName } from '../../core/protocols';
import {
  DEFAULT_RUNNER_CONFIG,
  estimateSpeechSec,
  initialRunnerState,
  type RunnerConfig,
  type RunnerEvent,
  type RunnerMode,
  type RunnerState,
  runnerStep
} from '../../core/runner';
import { applySettings, playCues, unlockAudio } from '../../platform/feedback';
import { useMotion } from '../../platform/MotionContext';
import { collectSamples, PoseTracker } from '../../platform/pose';
import { speech } from '../../platform/speech';
import { tones } from '../../platform/tones';
import { haptics } from '../../platform/haptics';
import { keepAwake, releaseAwake, wakeLockSupported } from '../../platform/wakeLock';
import { useData } from '../../state/store';
import { StepDots } from '../components/Controls';
import { HangBar, HeadGauge, HoldRing } from '../components/Gauges';
import { Icon } from '../components/Icon';
import { publishSimTarget, useSimAuto } from '../components/SimPanel';
import { BedSetup } from './Illustrations';

/** Başlangıç kontrolünde telefonun alındaki yeri bu açıdan fazla değişmişse hızlı yeniden tanıtma yapılır. */
export const REMOUNT_TOLERANCE_DEG = 10;

export interface RunnerOutcome {
  phase: 'done' | 'aborted' | 'safetyStop';
  state: RunnerState;
  protocol: ResolvedProtocol;
  manual: boolean;
}

export function RunnerView({
  protocolId,
  side,
  mode,
  calibration: initialCalibration,
  onExit,
  intro
}: {
  protocolId: ProtocolId;
  side: Side | null;
  mode: RunnerMode;
  /** null → sensörsüz (yalnız zamanlayıcı, elle onay). */
  calibration: Calibration | null;
  onExit: (o: RunnerOutcome) => void;
  /** Başlamadan önce gösterilecek ek bilgi. */
  intro?: React.ReactNode;
}) {
  const { settings } = useData();
  const { source } = useMotion();
  const protocol = useMemo(() => resolveProtocol(protocolId, side), [protocolId, side]);
  const sim = useSimAuto();
  const [calibration, setCalibration] = useState<Calibration | null>(initialCalibration);
  const manual = calibration === null;
  const P = mode === 'patient';

  const cfg: RunnerConfig = useMemo(
    () => ({
      ...DEFAULT_RUNNER_CONFIG,
      mode,
      protocol,
      introSecFor: (t: string) => (P ? (settings.speech ? estimateSpeechSec(t, settings.speechRate) : 4) : 1.5)
    }),
    [mode, protocol, P, settings.speech, settings.speechRate]
  );

  const [started, setStarted] = useState(false);
  const [preCount, setPreCount] = useState(0);
  /** Başlangıç kontrolü: telefonun alındaki yeri (hasta modu). */
  const [prep, setPrep] = useState<null | 'place' | 'lookup'>(null);
  const [prepError, setPrepError] = useState<string | null>(null);
  const busy = useRef(false);
  const alive = useRef(true);
  const [state, setState] = useState<RunnerState>(initialRunnerState);
  const sRef = useRef(state);
  const trackerRef = useRef<PoseTracker | null>(null);
  const exited = useRef(false);
  /** onExit gerçekten çağrıldı mı (bileşen kapanırken bekleyen bitiş kaybolmasın). */
  const delivered = useRef(false);
  const timeScale = settings.simulation ? settings.timeScale : 1;
  const clock = useRef({ perf0: performance.now(), virt0: Date.now(), scale: timeScale });

  useEffect(() => {
    // Zaman ölçeği değişirse saati sürekli tut
    const c = clock.current;
    const nowV = c.virt0 + (performance.now() - c.perf0) * c.scale;
    clock.current = { perf0: performance.now(), virt0: nowV, scale: timeScale };
  }, [timeScale]);

  const now = () => {
    const c = clock.current;
    return c.virt0 + (performance.now() - c.perf0) * c.scale;
  };

  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  const dispatch = useCallback(
    (ev: RunnerEvent) => {
      const r = runnerStep(cfg, sRef.current, ev);
      sRef.current = r.state;
      playCues(r.cues);
      setState(r.state);
    },
    [cfg]
  );

  // Sensör izleyici
  useEffect(() => {
    if (!started || manual || !calibration) return;
    const tr = new PoseTracker(source, calibration);
    tr.start();
    const off = tr.onShock(() => dispatch({ type: 'shock', now: now() }));
    trackerRef.current = tr;
    return () => {
      off();
      tr.stop();
      trackerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, manual, calibration, source, dispatch]);

  // Saat
  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => {
      const pose = trackerRef.current?.pose() ?? null;
      dispatch({ type: 'tick', now: now(), pose });
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, dispatch]);

  // Arka plana geçince güvenlik için duraklat
  useEffect(() => {
    if (!started) return;
    const onVis = () => {
      if (document.visibilityState === 'hidden') dispatch({ type: 'pause', now: now() });
      // Tarayıcı, sayfa gizlenince ekran kilidini bırakır; geri gelince yeniden iste.
      else void keepAwake();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, dispatch]);

  // Çalışırken sayfa kapatılmak/yenilenmek istenirse uyar
  const running = started && !['done', 'aborted', 'safetyStop'].includes(state.phase);
  useEffect(() => {
    if (!running) return;
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBefore);
    return () => window.removeEventListener('beforeunload', onBefore);
  }, [running]);

  // Yaklaşma tonu ve demo hedefi
  const step = protocol.steps[state.stepIndex];
  useEffect(() => {
    publishSimTarget(started && step ? step.target : null);
    const guiding =
      P && !manual && (state.phase === 'seeking' || state.phase === 'settling' || state.phase === 'drifting');
    tones.setGuidance(guiding ? (state.evaluation?.closeness ?? 0) : null);
  }, [started, step, state.phase, state.evaluation, P, manual]);

  // Bitiş (onExit referansı değişse bile tek sefer ve iptal edilmeden çağrılır)
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;
  useEffect(() => {
    if (exited.current) return;
    if (state.phase === 'done' || state.phase === 'aborted' || state.phase === 'safetyStop') {
      exited.current = true;
      tones.stopGuidance();
      const phase = state.phase;
      const t = setTimeout(() => {
        if (delivered.current) return;
        delivered.current = true;
        onExitRef.current({ phase, state: sRef.current, protocol, manual });
      }, phase === 'done' ? 1200 : 300);
      return () => clearTimeout(t);
    }
    // Yalnızca faz değişiminde çalışır; terminal fazdan sonra faz bir daha değişmez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      tones.stopGuidance();
      publishSimTarget(null);
      void releaseAwake();
      // Ekran çalışırken kapatıldıysa (geri tuşu vb.) yapılan kısım kayıt dışı kalmasın: kesildi olarak bildir.
      if (!delivered.current && sRef.current.phase !== 'idle') {
        delivered.current = true;
        exited.current = true;
        const cur = sRef.current;
        if (cur.phase === 'done' || cur.phase === 'aborted' || cur.phase === 'safetyStop') {
          onExitRef.current({ phase: cur.phase, state: cur, protocol, manual: manualRef.current });
        } else {
          const r = runnerStep(cfgRef.current, cur, { type: 'abort', now: now(), reason: 'INTERRUPTED' });
          onExitRef.current({ phase: 'aborted', state: r.state, protocol, manual: manualRef.current });
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;
  const manualRef = useRef(manual);
  manualRef.current = manual;

  const scaled = (ms: number) => ms / Math.max(1, timeScale);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, scaled(ms)));

  /**
   * Hasta modu başlangıç kontrolü: telefon kalibrasyondan sonra alından alınıp yeniden takılmış olabilir.
   * Dik duruşta artık hata küçükse mevcut kalibrasyon kullanılır; büyükse "tavana bak" adımıyla hızlıca yeniden tanıtılır
   * (işaret kuralı cihaza özgüdür, yeniden ölçülmez).
   */
  async function checkMount(c: Calibration): Promise<Calibration | null> {
    const fail = (msg: string) => {
      setPrep(null);
      setPrepError(msg);
      tones.play('alarm');
      speech.speak(msg, 'high');
      sim.upright();
      return null;
    };
    if ((await source.start()) !== 'ok') return fail('Hareket sensöründen veri alınamadı. Telefonu tanıtma adımını yeniden yapın.');
    sim.upright();
    setPrep('place');
    speech.speak('Telefonu ekranı dışa bakacak şekilde alnınıza yaslayın. Dik oturun, tam karşıya bakın ve kıpırdamayın.', 'high');
    await sleep(6500);
    if (!alive.current) return null;
    const up = await collectSamples(source, Math.max(400, scaled(1500)));
    if (!alive.current) return null;
    if (!up || up.maxDevDeg > 6) return fail('Telefon ölçüm sırasında kıpırdadı. Tamamen hareketsiz kalıp yeniden Başlat\'a basın.');
    if (residualUprightDeg(up.mean, c) <= REMOUNT_TOLERANCE_DEG) {
      haptics.play('tap');
      setPrep(null);
      return c;
    }
    setPrep('lookup');
    speech.speak('Telefonun yeri biraz değişmiş. Başınızı yavaşça geriye yatırın ve tavana bakın. Öyle kalın.', 'high');
    sim.lookUp();
    await sleep(3500);
    if (!alive.current) return null;
    const lu = await collectSamples(source, Math.max(400, scaled(1200)));
    sim.upright();
    if (!alive.current) return null;
    if (!lu || lu.maxDevDeg > 8) return fail('Telefon ölçüm sırasında kıpırdadı. Yeniden Başlat\'a basın.');
    const res = computeCalibration(c.sign, up.mean, lu.mean);
    if (!res.ok) return fail(CALIBRATION_ERROR_TEXT[res.error]);
    haptics.play('tap');
    speech.speak('Tamam. Başınızı düzeltip karşıya bakın.', 'high');
    await sleep(2000);
    setPrep(null);
    return res.calibration;
  }

  async function begin() {
    if (busy.current) return;
    busy.current = true;
    try {
      await beginInner();
    } finally {
      busy.current = false;
    }
  }

  async function beginInner() {
    unlockAudio();
    void keepAwake();
    setPrepError(null);
    if (P && calibration) {
      const c = await checkMount(calibration);
      if (!c || !alive.current) return;
      setCalibration(c);
    }
    speech.speak(
      P
        ? manual
          ? 'Başlıyoruz.'
          : 'Başlıyoruz. Telefonu alnınızda tutun ve yönergeleri dinleyin.'
        : 'Başlıyoruz.',
      'high'
    );
    for (let i = 3; i > 0; i--) {
      setPreCount(i);
      tones.play('countdown');
      await new Promise((r) => setTimeout(r, 1000 / Math.max(1, timeScale)));
      if (!alive.current) return;
    }
    setPreCount(0);
    clock.current = { perf0: performance.now(), virt0: Date.now(), scale: timeScale };
    setStarted(true);
    dispatch({ type: 'start', now: now() });
  }

  // --- Başlamadan önce ---------------------------------------------------------------------
  if (!started) {
    return (
      <div className="runner" data-testid="runner-ready">
        <div className="runner-head">
          <button className="btn icon" aria-label="Kapat" onClick={() => {
              exited.current = true;
              delivered.current = true;
              onExit({ phase: 'aborted', state: sRef.current, protocol, manual });
            }}>
            <Icon name="close" />
          </button>
          <strong className="grow">
            {protocol.shortName}
            {protocol.side ? ` · ${sideName(protocol.side)}` : ''}
          </strong>
        </div>
        <div className="runner-body">
          <h1>{protocol.name}</h1>
          <p className="lead">{protocol.summary}</p>
          {protocol.canal === 'PC' && <BedSetup />}
          {intro}
          <div className="card soft stack">
            <div className="row">
              <Icon name="volume" />
              <strong>{P ? 'Ekranı görmeniz gerekmez' : 'Ekran hastanın alnında, size bakar'}</strong>
            </div>
            <p className="small">
              {P
                ? 'Her adımı sesli anlatacağım. Doğru pozisyona gelince "Tamam, böyle kalın" diyeceğim ve telefon titreyecek. Baş dönmesi başlarsa ekranın herhangi bir yerine dokunun, geçince yeniden dokunun.'
                : 'Pozisyon doğruysa gösterge yeşile döner ve sayaç başlar. Nistagmus başlangıç ve bitişini alttaki alana dokunarak işaretleyin.'}
            </p>
            {manual && (
              <p className="small">
                <strong>Sensörsüz mod:</strong> açı ölçülmez; her pozisyonu siz onaylarsınız.
              </p>
            )}
            {P && !haptics.supported() && <p className="small muted">Bu cihazda titreşim desteklenmiyor; sesli ve tonlu uyarılar kullanılacak.</p>}
            {!wakeLockSupported() && (
              <p className="small muted">
                Bu tarayıcı ekranı açık tutmayı desteklemiyor. Manevra sırasında ekran kararmasın diye telefonun ekran zaman aşımını en az 5 dakikaya çıkarın.
              </p>
            )}
            {P && !manual && (
              <p className="small muted">Başlat'a basınca önce telefonun alnınızdaki yerini birkaç saniyede kontrol edeceğim.</p>
            )}
          </div>
          {prepError && (
            <div className="notice danger" role="alert" data-testid="runner-prep-error">
              <Icon name="alert" />
              <span>{prepError}</span>
            </div>
          )}
          {protocol.cautions.length > 0 && (
            <div className="notice">
              <Icon name="alert" />
              <span className="small">{protocol.cautions[0]}</span>
            </div>
          )}
        </div>
        <div style={{ padding: '0 16px calc(16px + env(safe-area-inset-bottom))', maxWidth: 640, width: '100%', margin: '0 auto' }}>
          {prep ? (
            <div className="btn secondary block xl" aria-live="assertive" data-testid="runner-prep">
              {prep === 'place' ? 'Dik oturun, karşıya bakın…' : 'Tavana bakın…'}
            </div>
          ) : preCount > 0 ? (
            <div className="btn primary block xl" aria-live="assertive">
              {preCount}
            </div>
          ) : (
            <button className="btn primary block xl" onClick={() => void begin()} data-testid="runner-start">
              <Icon name="play" /> Başlat
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- Çalışırken ---------------------------------------------------------------------------
  const ev = state.evaluation;
  const pose = trackerRef.current?.pose() ?? null;
  const tNow = now();
  let ringLabel = '—';
  let ringSub = 'pozisyon';
  let ringVal = 0;
  let ringMax = 1;
  if (step && (state.phase === 'holding' || state.phase === 'drifting')) {
    const remHold = Math.max(0, step.minHoldSec - state.holdSec);
    const remAfter =
      state.vertigoEndedAt !== null ? Math.max(0, step.afterVertigoSec - (tNow - state.vertigoEndedAt) / 1000) : 0;
    if (state.vertigoActive && remHold <= 0) {
      ringLabel = '…';
      ringSub = 'geçmesini bekle';
      ringVal = 1;
    } else {
      const rem = Math.max(remHold, remAfter);
      ringLabel = String(Math.ceil(rem));
      ringSub = 'sn kaldı';
      ringMax = Math.max(step.minHoldSec, rem + state.holdSec);
      ringVal = ringMax - rem;
    }
  } else if (state.phase === 'between') {
    const left = Math.max(0, cfg.betweenStepsSec - (tNow - state.phaseSince) / 1000);
    ringLabel = String(Math.ceil(left));
    ringSub = 'hazırlan';
    ringVal = cfg.betweenStepsSec - left;
    ringMax = cfg.betweenStepsSec;
  }

  const statusClass =
    state.phase === 'holding'
      ? 'holding'
      : state.phase === 'drifting'
        ? 'drifting'
        : state.phase === 'between' || state.phase === 'done'
          ? 'between'
          : 'seeking';
  const statusText: Record<string, string> = {
    intro: 'Yönergeyi dinleyin',
    seeking: manual ? 'Pozisyonu onaylayın' : 'Pozisyon aranıyor',
    settling: 'Doğrulanıyor…',
    holding: 'Doğru — böyle kalın',
    drifting: 'Pozisyon bozuldu',
    between: 'Sıradaki adıma hazırlanın',
    paused: 'Duraklatıldı',
    done: 'Tamamlandı',
    aborted: 'Durduruldu',
    safetyStop: 'Güvenlik için durduruldu',
    idle: ''
  };
  const nextStep = protocol.steps[state.stepIndex + 1];

  return (
    <div className="runner" data-testid="runner" data-phase={state.phase} data-step={state.stepIndex}>
      <div className="runner-head">
        <button className="btn icon" aria-label="Duraklat" onClick={() => dispatch({ type: 'pause', now: now() })} data-testid="runner-pause">
          <Icon name="pause" />
        </button>
        <div className="grow stack" style={{ gap: 6 }}>
          <strong>
            {protocol.shortName}
            {protocol.side ? ` · ${sideName(protocol.side)}` : ''} — Adım {state.stepIndex + 1}/{protocol.steps.length}
          </strong>
          <StepDots total={protocol.steps.length} index={state.stepIndex} />
        </div>
      </div>

      <div className="runner-body">
        <div className="runner-title" data-testid="runner-step-title">
          {state.phase === 'between' && nextStep ? `Sırada: ${nextStep.title}` : step?.title}
        </div>
        <p className="runner-instr">{state.phase === 'between' && nextStep ? (P ? nextStep.say : nextStep.clinician) : step ? (P ? step.say : step.clinician) : ''}</p>
        {step?.unverifiable && state.phase !== 'between' && <p className="small muted">{step.unverifiable}</p>}

        <div className="row">
          <span className={`status-pill ${statusClass}`} aria-live="polite" data-testid="runner-status">
            {statusText[state.phase]}
          </span>
        </div>

        {step && state.phase !== 'between' && (
          <div className="runner-visual">
            {manual ? (
              <div className="card soft center">
                <p className="small">Sensörsüz mod — açı ölçülmüyor.</p>
              </div>
            ) : (
              <HeadGauge target={step.target} pose={pose} inRange={!!ev?.inRange} />
            )}
            <HoldRing value={ringVal} max={ringMax} label={ringLabel} sub={ringSub} />
          </div>
        )}
        {step && state.phase === 'between' && (
          <div className="row" style={{ justifyContent: 'center' }}>
            <HoldRing value={ringVal} max={ringMax} label={ringLabel} sub={ringSub} />
          </div>
        )}
        {!manual && step && state.phase !== 'between' && <HangBar target={step.target} pose={pose} />}

        {!P && !manual && step && state.phase !== 'between' && (
          <div className="card soft small" data-testid="runner-numbers">
            <div className="row wrap" style={{ gap: 14 }}>
              {pose && step.target.kind === 'lying' && (
                <>
                  <span>
                    θ <strong>{Math.round(pose.theta)}°</strong> (hedef {step.target.theta}±{step.target.thetaTol}°)
                  </span>
                  <span>
                    φ <strong>{Math.round(pose.phi)}°</strong> (hedef {step.target.phiMin}…{step.target.phiMax}°)
                  </span>
                </>
              )}
              {pose && step.target.kind === 'sitting' && (
                <span>
                  ψ <strong>{Math.round(pose.psi)}°</strong> (hedef {step.target.psiMin}…{step.target.psiMax}°)
                </span>
              )}
              {!pose && <span>Sensör verisi yok</span>}
            </div>
            {ev?.hint && <div style={{ marginTop: 6 }}>{HINT_TEXT_CLINICIAN[ev.hint]}</div>}
          </div>
        )}

        {state.notice && (
          <div className="notice" role="status">
            <Icon name="alert" />
            <span>{state.notice}</span>
          </div>
        )}

        {!P && state.phase !== 'between' && (
          <div className="row wrap">
            {(state.phase === 'seeking' || state.phase === 'settling' || state.phase === 'drifting' || state.phase === 'intro') && (
              <button className="btn secondary grow" onClick={() => dispatch({ type: 'manualConfirm', now: now() })} data-testid="runner-manual">
                <Icon name="check" /> Pozisyon doğru (elle onay)
              </button>
            )}
            <button className="btn ghost" onClick={() => dispatch({ type: 'skipStep', now: now() })} data-testid="runner-skip">
              Adımı bitir
            </button>
          </div>
        )}
        {P && manual && (state.phase === 'seeking' || state.phase === 'intro') && (
          <button className="btn secondary block" onClick={() => dispatch({ type: 'manualConfirm', now: now() })} data-testid="runner-manual">
            <Icon name="check" /> Pozisyondayım
          </button>
        )}
      </div>

      {step?.observe !== false && state.phase !== 'between' && (
        <button
          className={`vertigo-pad${state.vertigoActive ? ' active' : ''}`}
          onClick={() => dispatch({ type: 'vertigoToggle', now: now() })}
          data-testid="vertigo-pad"
          aria-pressed={state.vertigoActive}
        >
          {P
            ? state.vertigoActive
              ? 'Baş dönmesi geçti — dokunun'
              : 'Baş dönmesi başladıysa dokunun'
            : state.vertigoActive
              ? 'Nistagmus / belirti BİTTİ'
              : 'Nistagmus / belirti BAŞLADI'}
        </button>
      )}

      {state.phase === 'paused' && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Duraklatıldı">
          <div className="sheet">
            <h2>Duraklatıldı</h2>
            <p className="muted">
              {P
                ? 'Devam ettiğinizde aynı adımdan, pozisyonunuz yeniden doğrulanarak sürer.'
                : 'Devam edildiğinde pozisyon yeniden doğrulanır.'}
            </p>
            <button
              className="btn primary block"
              onClick={() => {
                void keepAwake();
                dispatch({ type: 'resume', now: now() });
              }}
              data-testid="runner-resume"
            >
              <Icon name="play" /> Devam et
            </button>
            {P && (
              <button className="btn warn block" onClick={() => dispatch({ type: 'abort', now: now(), reason: 'USER_FEELS_UNWELL' })}>
                Kendimi iyi hissetmiyorum — durdur
              </button>
            )}
            <button className="btn secondary block" onClick={() => dispatch({ type: 'abort', now: now(), reason: 'USER_ABORT' })} data-testid="runner-abort">
              <Icon name="stop" /> Sonlandır
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
