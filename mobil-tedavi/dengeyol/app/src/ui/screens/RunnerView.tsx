/**
 * Manevra / test yürütme ekranı (hasta ve klinisyen ortak).
 * Telefon alındayken ekran dışa baktığı için yardımcı kişi ya da klinisyen ekranı görebilir; hasta sesle yönlendirilir.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CALIBRATION_ERROR_TEXT, computeCalibration, residualUprightDeg, type Calibration } from '../../core/calibration';
import { HINT_TEXT_CLINICIAN, HINT_TEXT_PATIENT, type HintKey } from '../../core/evaluator';
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
import { store, useData } from '../../state/store';
import { Segmented, StepDots } from '../components/Controls';
import { HangBar, HeadGauge, HoldRing } from '../components/Gauges';
import { Icon } from '../components/Icon';
import { publishSimTarget, useSimAuto } from '../components/SimPanel';
import { BedSetup } from './Illustrations';


/** Zincirde telefonun yerinde sayılması için dik duruşta kayıtlı yerleşime göre en fazla sapma (°). */
export const CHAIN_MOUNT_TOLERANCE_DEG = 12;

export interface RunnerOutcome {
  /** Yürütücü hiç başlatılmadan kapatıldıysa false: kayıt yazılmamalı. */
  started?: boolean;
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
  intro,
  onRecalibrate,
  chained = false,
  autoStart = false,
  onPlaced
}: {
  protocolId: ProtocolId;
  side: Side | null;
  mode: RunnerMode;
  /** null → sensörsüz (yalnız zamanlayıcı, elle onay). */
  calibration: Calibration | null;
  onExit: (o: RunnerOutcome) => void;
  /** Başlamadan önce gösterilecek ek bilgi. */
  intro?: React.ReactNode;
  /** Hasta modu: kayıtlı kalibrasyon bu telefonda tutmuyorsa baştan tanıtma ekranına dön. */
  onRecalibrate?: () => void;
  /**
   * Zincir: önceki test/manevradan hemen sonra, telefon alından inmeden devam. Başlat beklenmez ve yerleştirme ölçümü
   * tekrarlanmaz (verilen kalibrasyon az önce ölçüldü).
   */
  chained?: boolean;
  /** Başlat beklenmeden kendiliğinden başla (hazırlık ekranından gelindi); yerleştirme ölçümü yapılır. */
  autoStart?: boolean;
  /** Hasta modunda yerleştirme ölçümü yapılınca yeni kalibrasyonu bildirir (zincirdeki sonraki adım için). */
  onPlaced?: (c: Calibration) => void;
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
  const [prepError, setPrepError] = useState<null | { text: string; sensor: boolean }>(null);
  /** Son söylenen cümle (altyazı): sesi duyamayan hasta ya da yardımcı ekrandan okuyabilsin. */
  const [caption, setCaption] = useState<string | null>(null);
  /** Ekran açık tutulamadı (API yok ya da istek reddedildi): kullanıcı ekran zaman aşımını artırmalı. */
  const [wakeFailed, setWakeFailed] = useState(false);
  const flipped = !!settings.screenFlip;
  const helper = settings.assist === 'helper';
  const setFlip = (v: boolean) => store.update((x) => ({ ...x, settings: { ...x.settings, screenFlip: v } }));
  const setAssist = (v: 'self' | 'helper') => store.update((x) => ({ ...x, settings: { ...x.settings, assist: v } }));
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
      const spoken = r.cues.filter((c) => c.kind === 'speak');
      const last = spoken[spoken.length - 1];
      if (last && last.kind === 'speak') setCaption(last.text);
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

  // Geri tuşu / kenardan kaydırma manevrayı onaysız bitirmesin: geçmişe bir girdi eklenir, geri gelince duraklatılır.
  useEffect(() => {
    if (!running) return;
    const marker = { dengeyolRunner: true };
    window.history.pushState(marker, '');
    const onPop = () => {
      dispatch({ type: 'pause', now: now() });
      window.history.pushState(marker, '');
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      // Kendi girdimiz hâlâ en üstteyse temizle (adres değişmez).
      if ((window.history.state as { dengeyolRunner?: boolean } | null)?.dengeyolRunner) window.history.back();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);
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
      // Başlamadan ya da yarıda kapanırsa kuyruktaki yönerge ("başınızı geriye yatırın") ana ekranda söylenmesin;
      // olağan bitişteki son cümle ("10 dakika dinlenin") kesilmez.
      const ph = sRef.current.phase;
      if (ph !== 'done' && ph !== 'safetyStop') speech.cancel();
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

  /** Zincir için sessiz yer kontrolü: ~1 s dik duruş örneği kayıtlı yerleşime göre 12°'den az sapıyorsa telefon yerinde. */
  async function quickMountCheck(c: Calibration): Promise<boolean> {
    if ((await source.start()) !== 'ok') return false;
    sim.upright();
    const up = await collectSamples(source, Math.max(400, scaled(1000)));
    return !!up && up.maxDevDeg <= 8 && residualUprightDeg(up.mean, c) <= CHAIN_MOUNT_TOLERANCE_DEG;
  }

  /** Söyler ve konuşmanın bitmesini (tahmini süre) artı ek süreyi bekler: ölçüm, yönerge bitmeden başlamasın. */
  const sayAndWait = async (text: string, extraMs: number) => {
    setCaption(text);
    // Konuşmanın gerçek bitişi beklenir (yavaş seslerde tahmin yetmez); olay gelmezse tahminin 2 katı + 2 s sonra devam.
    const est = settings.speech ? estimateSpeechSec(text, settings.speechRate) * 1000 : 0;
    if (settings.simulation) await sleep(est);
    else await speech.speakAsync(text, est * 2 + 2000);
    await sleep(extraMs);
  };

  /**
   * Hasta modu başlangıç yerleştirmesi (her manevra/test başında, ~15 s): telefon kalibrasyondan sonra alından alınıp
   * yeniden takılmış, hatta ekranı içe dönük takılmış olabilir. Bu yüzden dik duruş + "tavana bak" her seferinde ölçülür
   * (yalnız dik duruş, içe/dışa dönüklüğü ayırt edemez → sağ/sol karışabilir). İşaret kuralı cihaza özgüdür, kayıtlı olan kullanılır.
   */
  async function placePhone(c: Calibration): Promise<Calibration | null> {
    const fail = (text: string, sensor = false) => {
      setPrep(null);
      setPrepError({ text, sensor });
      haptics.play('alarm');
      tones.play('alarm');
      speech.speak(text, 'high');
      setCaption(text);
      sim.upright();
      return null;
    };
    if ((await source.start()) !== 'ok') return fail('Hareket sensöründen veri alınamadı.', true);
    sim.upright();
    setPrep('place');
    await sayAndWait(
      'Telefonun arkasını alnınıza yaslayın; ekranı karşıya baksın, üst kenarı saçlarınıza doğru olsun. Dik oturun ve tam karşıya bakın.',
      2500
    );
    if (!alive.current) return null;
    await sayAndWait('Kıpırdamayın.', 400);
    const up = await collectSamples(source, Math.max(400, scaled(1500)));
    if (!alive.current) return null;
    if (!up || up.maxDevDeg > 6) return fail('Telefon ölçüm sırasında kıpırdadı. Tamamen hareketsiz kalıp yeniden Başlat\'a basın.');
    haptics.play('move');
    tones.play('move');
    setPrep('lookup');
    sim.lookUp();
    await sayAndWait('Şimdi başınızı yavaşça geriye yatırın ve tavana bakın. Öyle kalın.', 1500);
    if (!alive.current) return null;
    const lu = await collectSamples(source, Math.max(400, scaled(1200)));
    sim.upright();
    if (!alive.current) return null;
    if (!lu || lu.maxDevDeg > 8) return fail('Telefon ölçüm sırasında kıpırdadı. Yeniden Başlat\'a basın.');
    const res = computeCalibration(c.sign, up.mean, lu.mean);
    if (!res.ok) return fail(CALIBRATION_ERROR_TEXT[res.error]);
    haptics.play('reached');
    tones.play('reached');
    await sayAndWait('Tamam. Başınızı düzeltip karşıya bakın. Telefonu alnınızda tutun.', 500);
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
    void keepAwake().then((ok) => setWakeFailed(!ok));
    setPrepError(null);
    // Android'de (yüklü uygulama/tam ekran) dikey kilit denenir; desteklenmezse sessizce geçilir.
    try {
      void (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('portrait')?.catch(() => undefined);
    } catch {
      /* desteklenmiyor */
    }
    if (P && calibration) {
      // Zincirde (telefon alında kaldı) önce sessiz, kısa bir kontrol: telefon kaymış, düşmüş ya da yeniden takılmışsa
      // tam yerleştirme ölçümü yapılır. Dik duruş kontrolü ters/içe takılmayı ayırt edemez; o durumda hedefe ulaşılamaz.
      const stillPlaced = chained && (await quickMountCheck(calibration));
      if (!alive.current) return;
      if (!stillPlaced) {
        if (chained) speech.speak('Telefonun yeri değişmiş olabilir. Yeniden yerleştirelim.', 'high');
        const c = await placePhone(calibration);
        if (!c || !alive.current) return;
        setCalibration(c);
        onPlaced?.(c);
      }
    }
    speech.speak(P ? (manual ? 'Başlıyoruz.' : 'Başlıyoruz. Yönergeleri dinleyin.') : 'Başlıyoruz.', 'high');
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

  // Zincirde ya da hazırlıktan sonra kendiliğinden başla (StrictMode çift effect'inde zamanlayıcı iptal edilir, tek başlatma olur).
  const auto = chained || autoStart;
  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => void begin(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Başlamadan önce ---------------------------------------------------------------------
  if (!started && auto && !prepError) {
    return (
      <div className="runner" data-testid="runner-ready">
        <div className="runner-body" style={{ justifyContent: 'center' }}>
          <h1>{protocol.shortName}{protocol.side ? ` — ${sideName(protocol.side)}` : ''}</h1>
          {intro}
          <div className="btn primary block xl" aria-live="assertive" data-testid={prep ? 'runner-prep' : undefined}>
            {prep ? (prep === 'place' ? 'Telefonu alnınıza yaslayın, karşıya bakın…' : 'Tavana bakın…') : preCount > 0 ? preCount : 'Başlıyoruz…'}
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="runner" data-testid="runner-ready">
        <div className="runner-head">
          <button className="btn icon" aria-label="Kapat" onClick={() => {
              exited.current = true;
              delivered.current = true;
              onExit({ started: false, phase: 'aborted', state: sRef.current, protocol, manual });
            }}>
            <Icon name="close" />
          </button>
          <strong className="grow">
            {protocol.shortName}
            {protocol.side ? ` · ${sideName(protocol.side)}` : ''}
          </strong>
        </div>
        <div className="runner-body">
          <h1>{P ? `${protocol.shortName}${protocol.side ? ` — ${sideName(protocol.side)}` : ''}` : protocol.name}</h1>
          <p className="lead">{P ? protocol.patientSummary ?? protocol.summary : protocol.summary}</p>
          {protocol.canal === 'PC' && <BedSetup />}
          {intro}
          <details className="card soft" data-testid="runner-steps-preview">
            <summary>
              <strong>Adımları önceden gör ({protocol.steps.length} adım)</strong>
            </summary>
            <ol className="stack small" style={{ margin: '10px 0 0', paddingLeft: 22, gap: 8 }}>
              {protocol.steps.map((st) => (
                <li key={st.id}>
                  <strong>{st.title}</strong>
                  {st.minHoldSec > 0 ? ` · en az ${st.minHoldSec} sn` : ''}
                  <div className="muted">{P ? st.say : st.clinician}</div>
                </li>
              ))}
            </ol>
          </details>
          {P && (
            <div className="card stack" data-testid="runner-assist">
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
          )}
          {/* Yalnız duruma özgü notlar (hasta modunda genel anlatım sesle yapılır; tekrar yazılmaz). */}
          {(!P || manual || !haptics.supported() || !speech.usable() || !wakeLockSupported()) && (
            <div className="card soft stack small">
              {!P && <p>Pozisyon doğruysa gösterge yeşile döner ve sayaç başlar. Nistagmus başlangıç ve bitişini ekranın herhangi bir yerine dokunarak işaretleyin.</p>}
              {manual && (
                <p>
                  <strong>Sensörsüz mod:</strong> açı ölçülmez; her pozisyonu siz onaylarsınız.
                </p>
              )}
              {P && !haptics.supported() && (
                <p className="muted">Bu telefonda titreşim yok; uyarılar ses ve bip ile verilir. iPhone'da sessiz anahtarı kapalı ve sesi yüksek tutun.</p>
              )}
              {P && !speech.usable() && (
                <p style={{ color: 'var(--warn)' }} data-testid="runner-no-voice">
                  <strong>Bu telefonda Türkçe sesli okuma bulunamadı.</strong> Manevrayı bir yakınınızla yapın; yönergeleri ekrandan okusun.
                </p>
              )}
              {!wakeLockSupported() && (
                <p className="muted">Bu tarayıcı ekranı açık tutamıyor. Telefonun ekran zaman aşımını en az 5 dakikaya çıkarın.</p>
              )}
            </div>
          )}
          {prepError && (
            <div className="notice danger stack" role="alert" data-testid="runner-prep-error">
              <div className="row">
                <Icon name="alert" />
                <span>{prepError.text}</span>
              </div>
              <div className="row wrap">
                {onRecalibrate && !prepError.sensor && (
                  <button className="btn secondary" onClick={onRecalibrate}>
                    Telefonu baştan tanıt
                  </button>
                )}
                {prepError.sensor && (
                  <button
                    className="btn secondary"
                    onClick={() => {
                      setCalibration(null);
                      setPrepError(null);
                    }}
                    data-testid="runner-go-manual"
                  >
                    Sensörsüz devam et (her pozisyonu siz onaylarsınız)
                  </button>
                )}
              </div>
            </div>
          )}
          {!P && protocol.cautions.length > 0 && (
            <div className="notice">
              <Icon name="alert" />
              <span className="small">{protocol.cautions[0]}</span>
            </div>
          )}
        </div>
        <div style={{ padding: '0 16px calc(16px + env(safe-area-inset-bottom))', maxWidth: 640, width: '100%', margin: '0 auto' }}>
          {prep ? (
            <div className="btn secondary block xl" aria-live="assertive" data-testid="runner-prep">
              {prep === 'place' ? 'Telefonu alnınıza yaslayın, karşıya bakın…' : 'Tavana bakın…'}
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
      ringSub = state.phase === 'drifting' ? 'DURDU — düzeltin' : 'sn kaldı';
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
  const instrText = screenText(
    state.phase === 'between' && nextStep ? (P ? nextStep.say : nextStep.clinician) : step ? (P ? step.say : step.clinician) : ''
  );

  const terminal = state.phase === 'done' || state.phase === 'aborted' || state.phase === 'safetyStop';
  const canMark = step?.observe !== false && state.phase !== 'between' && state.phase !== 'paused' && !terminal;
  // Ekranın herhangi bir yerine dokunmak baş dönmesini işaretler (alındaki telefona körlemesine dokunuş için);
  // düğmeler kendi işini yapar.
  const onBodyTap = (e: React.MouseEvent) => {
    if (!canMark) return;
    if ((e.target as HTMLElement).closest('button, a, input, select, label, summary')) return;
    dispatch({ type: 'vertigoToggle', now: now() });
  };
  const guiding = !manual && ev?.hint && (state.phase === 'seeking' || state.phase === 'settling' || state.phase === 'drifting');
  const observeDone = !P && step?.observe !== false && !state.vertigoActive && state.vertigoEndedAt !== null;

  return (
    <div
      className={`runner${flipped ? ' flipped' : ''}`}
      data-testid="runner"
      data-phase={state.phase}
      data-step={state.stepIndex}
      onClick={onBodyTap}
    >
      <div className="runner-head">
        {P ? (
          <HoldButton ms={700} onHold={() => dispatch({ type: 'pause', now: now() })} testid="runner-pause">
            <Icon name="pause" /> Duraklat
          </HoldButton>
        ) : (
          <button className="btn secondary" aria-label="Duraklat" onClick={() => dispatch({ type: 'pause', now: now() })} data-testid="runner-pause">
            <Icon name="pause" /> Duraklat
          </button>
        )}
        <div className="grow stack" style={{ gap: 6 }}>
          <strong>
            {protocol.shortName}
            {protocol.side ? ` · ${sideName(protocol.side)}` : ''} — Adım {state.stepIndex + 1}/{protocol.steps.length}
          </strong>
          <StepDots total={protocol.steps.length} index={state.stepIndex} />
        </div>
        <button
          className="btn icon"
          aria-label="Ekranı çevir"
          aria-pressed={flipped}
          title="Ekranı 180° çevir (başucunda duruyorsanız)"
          onClick={() => setFlip(!flipped)}
          data-testid="runner-flip"
        >
          <Icon name="rotate" />
        </button>
      </div>

      <div className="runner-body">
        <div className="runner-title" data-testid="runner-step-title">
          {state.phase === 'between' && nextStep ? `Sırada: ${nextStep.title}` : step?.title}
        </div>

        {guiding && ev?.hint ? (
          <HintBanner hint={ev.hint} flipped={flipped} patient={P} />
        ) : (
          <div className="row">
            <span className={`status-pill ${statusClass}`} aria-live="polite" data-testid="runner-status">
              {statusText[state.phase]}
            </span>
          </div>
        )}

        {/* Gösterge ve sayaç önce: yardımcı/klinisyen kaydırmadan görsün (alttaki dokunma alanının üstünde kalır). */}
        {step && state.phase !== 'between' && (
          <div className="runner-visual">
            {manual ? (
              <div className="card soft center">
                <p className="small">Sensörsüz mod — açı ölçülmüyor.</p>
              </div>
            ) : (
              <HeadGauge target={step.target} pose={pose} inRange={!!ev?.inRange} flipped={flipped} />
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

        {caption && caption !== instrText && !(guiding && ev?.hint && caption.includes(HINT_TEXT_PATIENT[ev.hint])) && (
          <p className="caption" aria-live="polite" data-testid="runner-caption">
            <Icon name="volume" size={18} /> {caption}
          </p>
        )}

        {/* Yönerge: yeni adımın başında tam, sonra kısaltılmış (ses zaten söyledi; ekran göstergeye yer açar). */}
        <p className={`runner-instr${state.phase === 'intro' || state.phase === 'between' ? '' : ' compact'}`}>{instrText}</p>
        {step?.unverifiable && state.phase !== 'between' && <p className="small muted">{step.unverifiable}</p>}

        {!P && !manual && step && state.phase !== 'between' && (
          <div className="card soft small" data-testid="runner-numbers">
            <div className="row wrap" style={{ gap: 14 }}>
              {pose && step.target.kind === 'lying' && (
                <>
                  <span>
                    Dönüş <strong>{turnText(pose.theta)}</strong> (hedef {turnText(step.target.theta)} ±{step.target.thetaTol}°)
                  </span>
                  <span>
                    Sarkma <strong>{Math.round(pose.phi)}°</strong> (hedef {step.target.phiMin}…{step.target.phiMax}°)
                  </span>
                </>
              )}
              {pose && step.target.kind === 'sitting' && (
                <span>
                  Çene eğimi <strong>{Math.round(pose.psi)}°</strong> (hedef {step.target.psiMin}…{step.target.psiMax}°)
                </span>
              )}
              {!pose && <span>Sensör verisi yok</span>}
            </div>
            {ev?.hint && <div style={{ marginTop: 6 }}>{HINT_TEXT_CLINICIAN[ev.hint]}</div>}
          </div>
        )}

        {wakeFailed && P && (
          <div className="notice" role="status">
            <Icon name="alert" />
            <span>Ekran açık tutulamıyor. Ekran kararırsa manevra duraklar; telefonun ekran zaman aşımını en az 5 dakikaya çıkarın.</span>
          </div>
        )}

        {state.notice && (
          <div className="notice" role="status">
            <Icon name="alert" />
            <span>{state.notice}</span>
          </div>
        )}

        {P && manual && (state.phase === 'seeking' || state.phase === 'intro') && (
          <button className="btn secondary block xl" onClick={() => dispatch({ type: 'manualConfirm', now: now() })} data-testid="runner-manual">
            <Icon name="check" /> Pozisyondayım
          </button>
        )}
      </div>

      {!P && state.phase !== 'between' && !terminal && (
        <div className="runner-actions">
          {(state.phase === 'seeking' || state.phase === 'settling' || state.phase === 'drifting' || state.phase === 'intro') && (
            <button className="btn secondary grow" onClick={() => dispatch({ type: 'manualConfirm', now: now() })} data-testid="runner-manual">
              <Icon name="check" /> Pozisyon doğru (elle onay)
            </button>
          )}
          <button
            className={`btn ${observeDone ? 'primary' : 'ghost'} grow`}
            onClick={() => dispatch({ type: 'skipStep', now: now() })}
            data-testid="runner-skip"
          >
            {observeDone ? 'Gözlemi bitir → sonraki adım' : 'Adımı bitir'}
          </button>
        </div>
      )}

      {canMark && (
        <button
          className={`vertigo-pad${state.vertigoActive ? ' active' : ''}`}
          onClick={() => dispatch({ type: 'vertigoToggle', now: now() })}
          data-testid="vertigo-pad"
          aria-pressed={state.vertigoActive}
        >
          {P
            ? state.vertigoActive
              ? 'Baş dönmesi geçti — ekrana dokunun'
              : 'Baş dönmesi başladıysa ekrana dokunun'
            : state.vertigoActive
              ? 'Nistagmus / belirti BİTTİ (ekrana dokunun)'
              : 'Nistagmus / belirti BAŞLADI (ekrana dokunun)'}
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
            {state.vertigoActive && (
              <button
                className="btn secondary block"
                onClick={() => dispatch({ type: 'vertigoToggle', now: now() })}
                data-testid="runner-paused-vertigo-end"
              >
                {P ? 'Baş dönmesi geçti' : 'Belirti / nistagmus bitti'}
              </button>
            )}
            <button
              className="btn primary block"
              autoFocus
              onClick={() => {
                // Arama/arka plandan sonra ses motorları yeniden açılır (bu dokunuş iOS için gereklidir).
                unlockAudio();
                void keepAwake();
                dispatch({ type: 'resume', now: now() });
              }}
              data-testid="runner-resume"
            >
              <Icon name="play" /> Devam et
            </button>
            {P && (
              <button className="btn warn block" onClick={() => dispatch({ type: 'abort', now: now(), reason: 'USER_FEELS_UNWELL' })}>
                Kendimi kötü hissediyorum
              </button>
            )}
            <button className="btn secondary block" onClick={() => dispatch({ type: 'abort', now: now(), reason: 'USER_ABORT' })} data-testid="runner-abort">
              <Icon name="stop" /> {P ? 'Şimdilik bırak (iyiyim)' : 'Sonlandır'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Açıyı kişiye göre söz: +θ = hastanın sağına. */
export function turnText(theta: number): string {
  const a = Math.round(Math.abs(theta));
  if (a <= 3) return 'düz';
  return `${theta > 0 ? 'sağa' : 'sola'} ${a}°`;
}

/**
 * Düzeltme yönü: büyük ok + tek satır. Ok, telefonun alındaki fiziksel yerine göre çizilir:
 * ekran düz dururken (karşıdan bakış) hastanın sağı ekranın solundadır; ekran çevrilince sağdadır.
 */
function HintBanner({ hint, flipped, patient }: { hint: HintKey; flipped: boolean; patient: boolean }) {
  const toRightOfScreen = hint === 'TURN_RIGHT' ? flipped : hint === 'TURN_LEFT' ? !flipped : null;
  const arrow = toRightOfScreen === null ? null : toRightOfScreen ? '→' : '←';
  const text = patient ? HINT_TEXT_PATIENT[hint] : HINT_TEXT_CLINICIAN[hint];
  return (
    <div className="hint-banner" role="status" data-testid="runner-hint" data-hint={hint}>
      {arrow && toRightOfScreen === false && <span className="hint-arrow" aria-hidden="true">{arrow}</span>}
      <span className="grow">{text}</span>
      {arrow && toRightOfScreen === true && <span className="hint-arrow" aria-hidden="true">{arrow}</span>}
    </div>
  );
}

/** Basılı tutunca çalışan düğme (hasta modunda kazara duraklatmayı önler). Klavyeyle Enter/Boşluk hemen çalıştırır. */
function HoldButton({ ms, onHold, children, testid }: { ms: number; onHold: () => void; children: React.ReactNode; testid?: string }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressing, setPressing] = useState(false);
  const cancel = () => {
    setPressing(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => cancel, []);
  return (
    <button
      type="button"
      className={`btn secondary hold-btn${pressing ? ' pressing' : ''}`}
      style={{ ['--hold-ms' as string]: `${ms}ms` }}
      aria-label="Duraklat (basılı tutun)"
      onPointerDown={() => {
        cancel();
        setPressing(true);
        timer.current = setTimeout(() => {
          setPressing(false);
          timer.current = null;
          onHold();
        }, ms);
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onHold();
        }
      }}
      data-testid={testid}
    >
      {children}
      <span className="small">basılı tut</span>
    </button>
  );
}

/** Yardımcıyla yapma: kısa hazırlık kartı. */
export function HelperCard() {
  return (
    <ol className="small stack" style={{ margin: 0, paddingLeft: 20, gap: 6 }} data-testid="helper-card">
      <li>Yastığı, hasta yattığında omuzlarının altına gelecek şekilde koyun; baş yastıktan geriye sarkabilsin.</li>
      <li>Hastanın başucunda ya da yanında durun. Başucundaysanız ekrandaki <strong>⟲ Ekranı çevir</strong> düğmesine basın; yazılar size düz görünür.</li>
      <li>Telefonu hasta kendi eliyle alnına bastırsın; siz iki elinizle başını tutup çevirin.</li>
      <li>Hasta "dönüyor" deyince ekranın herhangi bir yerine siz dokunun; geçince yeniden dokunun.</li>
      <li>Ekrandaki ok ve yazı, başı hangi yöne çevireceğinizi söyler ("hastanın sağı/solu"). Durdurmak için "Duraklat"ı basılı tutun.</li>
      <li>Telefonun otomatik ekran döndürmesini kapatın; yan yatışlarda yazılar yer değiştirmesin.</li>
    </ol>
  );
}

/** Ekranda gösterilecek yönerge: "ekrana dokunun" cümleleri alttaki alanda zaten yazıyor; sesli yönergede kalır. */
function screenText(t: string): string {
  return t
    .split(/(?<=[.!?])\s+/)
    .filter((x) => !/ekrana (tekrar |yeniden )?dokunun/i.test(x) && !/^Baş dönmesi olabilir, bu beklenen bir durumdur\.?$/i.test(x))
    .join(' ');
}
