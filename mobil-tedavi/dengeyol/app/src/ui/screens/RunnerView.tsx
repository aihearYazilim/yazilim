/**
 * Manevra / test yürütme ekranı (hasta ve klinisyen ortak).
 * Telefon alındayken ekran dışa baktığı için yardımcı kişi ya da klinisyen ekranı görebilir; hasta sesle yönlendirilir.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CALIBRATION_ERROR_TEXT, computeCalibration, residualUprightDeg, type Calibration } from '../../core/calibration';
import { HINT_TEXT_CLINICIAN, HINT_TEXT_HELPER, HINT_TEXT_PATIENT, type HintKey } from '../../core/evaluator';
import { protocolForMode, resolveProtocol, type ProtocolId, type ResolvedProtocol, type Side, sideName, type StepDef } from '../../core/protocols';
import {
  type ClinicianVoice,
  clinicianSilent,
  type Cue,
  DEFAULT_RUNNER_CONFIG,
  effectiveMinHoldSec,
  estimateSpeechSec,
  initialRunnerState,
  PATIENT_FIRST_HINT_DELAY_SEC,
  pauseReturnSpeech,
  pauseSpeech,
  type RunnerConfig,
  type RunnerEvent,
  type RunnerMode,
  type RunnerState,
  runnerStep,
  safetyHoldDetail,
  safetyHoldText,
  startSpeechText
} from '../../core/runner';
import {
  armedChoice,
  confirmDeadline,
  confirmPromptSpoken,
  CONFIRM_PROMPT,
  initialPauseSheet,
  type PauseChoice,
  type PauseSheetState,
  pauseSheetHold,
  pauseSheetStopSpoken,
  pauseSheetTap,
  type SheetTarget,
  startStopCountdown,
  STOP_COUNT_WORDS,
  STOP_UNDO_PROMPT,
  type StopCountdown,
  stopCountSchedule,
  stopDeadline,
  stopPromptSpoken,
  stopSecondsLeft
} from '../../core/pauseSheet';
import { applySettings, playCues, unlockAudio } from '../../platform/feedback';
import { useMotion } from '../../platform/MotionContext';
import { collectSamples, PoseTracker } from '../../platform/pose';
import { speech } from '../../platform/speech';
import { tones } from '../../platform/tones';
import { haptics } from '../../platform/haptics';
import { keepAwake, releaseAwake, wakeLockSupported } from '../../platform/wakeLock';
import { logOverride } from '../../state/overrides';
import { store, useData } from '../../state/store';
import { Segmented, StepDots, useTapLock } from '../components/Controls';
import { HangBar, HeadGauge, HoldRing } from '../components/Gauges';
import { Icon } from '../components/Icon';
import { publishSimTarget, useSimAuto } from '../components/SimPanel';
import { BedSetup } from './Illustrations';
import { CAL_LOOKUP_SPOKEN, calibratedThisSession, noteSessionCalibration } from './Calibrate';


/** Zincirde telefonun yerinde sayılması için dik duruşta kayıtlı yerleşime göre en fazla sapma (°). */
export const CHAIN_MOUNT_TOLERANCE_DEG = 12;
/**
 * Hasta modunda ekrana bu kadar basılı tutmak (ms; sesle "iki saniye"): manevra sürerken duraklatır; duraklatma sayfasında ve
 * güvenlik uyarısında HER ZAMAN durdurur (5 s içinde "Devam et" geri alır; N2-1). Hiçbir ekranda "devam" anlamına gelmez.
 */
export const LONG_PRESS_MS = 2000;
/**
 * Duraklatma sayfasındaki düğmeler yalnız kısa dokunuşla çalışır: bu kadar (ms) ya da daha uzun basış hiçbir düğmeyi
 * seçmez. Ekrana bakmadan "iki saniye basılı tutun" diyen hasta düğmeye denk gelirse test bitmesin (k01, tur 2).
 */
export const SHEET_TAP_MAX_MS = 600;

/** Klinisyen sesli yönerge seçenekleri (başlıktaki simge düğme sırayla değiştirir; durum aria-label ve rozette). */
const CLINICIAN_VOICE_LABEL: Record<ClinicianVoice, string> = { full: 'Ses: açık', short: 'Ses: kısa', off: 'Ses: kapalı' };
const CLINICIAN_VOICE_BADGE: Record<ClinicianVoice, string> = { full: 'A', short: 'K', off: '×' };
const CLINICIAN_VOICE_NEXT: Record<ClinicianVoice, ClinicianVoice> = { short: 'full', full: 'off', off: 'short' };

/** Konuşma motoru şu an konuşuyor ya da kuyrukta bekleyen cümle var mı (yoksa ya da hata verirse false). */
function speechBusy(): boolean {
  try {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
    return !!synth && (synth.speaking || synth.pending);
  } catch {
    return false;
  }
}

export interface RunnerOutcome {
  /** Yürütücü hiç başlatılmadan kapatıldıysa false: kayıt yazılmamalı. */
  started?: boolean;
  phase: 'done' | 'aborted' | 'safetyStop';
  state: RunnerState;
  protocol: ResolvedProtocol;
  manual: boolean;
}

/** Güvenlik uyarısı açıldıktan sonra seçim düğmelerinin (ve "basılı tut = Durdur"un) kilitli kaldığı süre (ms). */
const SAFETY_HOLD_LOCK_MS = 1000;
/**
 * "Devam et"ten (duraklatma ya da güvenlik uyarısı) sonra bu kadar (ms, gerçek zaman) baş dönmesi dokunuşu alınmaz: çift
 * dokunuşun ikincisi yürütücüye düşüp sahte baş dönmesi kaydı açmasın (y06, yeni kullanıcı turu 1). Yürütücüdeki aynı kural
 * (RESUME_TAP_GUARD_SEC) yürütücü saatiyle çalışır; bu, demo hızlandırmasında da gerçek dokunuş aralığını korur.
 */
export const RESUME_TAP_GUARD_MS = 1000;

/**
 * Acil belirti uyarısı aşıldıysa yürütücü başlığının altında duran kısa kırmızı satır (M2-1; y05, tur 2): başta söylenen
 * hatırlatma test ve manevra boyunca ekranda da görünsün.
 */
export const RUNNER_EMERGENCY_LINE = "Acil belirti bildirdiniz: kötüleşirse durun ve 112'yi arayın.";

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
  onPlaced,
  onSensorless,
  startNote,
  emergency = false,
  onProgress
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
  /** Kullanıcı bu ekranda "Sensörsüz devam et"i seçti: akışın geri kalanı da sensörsüz sürsün. */
  onSensorless?: () => void;
  /** Başlarken söylenecek ek bilgi (ör. "Önce sol tarafı, sonra sağ tarafı test ediyoruz."). */
  startNote?: string;
  /**
   * Acil belirti uyarısı aşıldı (hasta akışı): başlığın altında kısa kırmızı 112 satırı (RUNNER_EMERGENCY_LINE). Sesli
   * hatırlatma `startNote` ile gelir; başlangıç cümlesi sonuna dek okunur, ilk adım komutu onu kesmez (M2-1).
   */
  emergency?: boolean;
  /**
   * Her adım başında süren kaydı bildirir (yeni kullanıcı turu 1, y01 #6): akış ara kayıt yazar; uygulama manevra sürerken
   * kapanırsa yeniden açılışta "yarıda kaldı (adım n)" olarak kaydedilir.
   */
  onProgress?: (p: { records: RunnerState['records']; manual: boolean }) => void;
}) {
  const { settings } = useData();
  const { source } = useMotion();
  const protocol = useMemo(() => protocolForMode(resolveProtocol(protocolId, side), mode), [protocolId, side, mode]);
  const sim = useSimAuto();
  const [calibration, setCalibration] = useState<Calibration | null>(initialCalibration);
  const manual = calibration === null;
  const P = mode === 'patient';
  /** Hasta modunda yakını yaptırıyor: ses ve başlıklar yardımcıya. */
  const helperVoice = P && settings.assist === 'helper';

  const cfg: RunnerConfig = useMemo(
    () => ({
      ...DEFAULT_RUNNER_CONFIG,
      mode,
      protocol,
      // Hasta ekranı görmez: sessizlik 10 s'yi geçmesin; ilk sesli düzeltme yönergeden hemen sonra gelsin.
      countEverySec: P ? 10 : DEFAULT_RUNNER_CONFIG.countEverySec,
      firstHintDelaySec: P ? PATIENT_FIRST_HINT_DELAY_SEC : DEFAULT_RUNNER_CONFIG.firstHintDelaySec,
      introSecFor: (t: string) => (P ? (settings.speech ? estimateSpeechSec(t, settings.speechRate) : 4) : 1.5),
      // Yönergenin gerçek bitişi beklenir (yavaş seslerde tahmin yetmez). Demo modunda da (M2-6; y01, y02, y03): sesli
      // okuma yoksa (uçtan uca testler) belirlenimci tahmin kullanılır.
      awaitSpeechEnd: P && settings.speech && speech.usable(),
      helper: helperVoice,
      sensorless: manual,
      // Klinisyende telefon hastanın alnında: varsayılan kısa (yalnız kısa komut ve sayım; k08, tur 2).
      clinicianVoice: settings.clinicianVoice ?? 'short'
    }),
    [mode, protocol, P, settings.speech, settings.speechRate, helperVoice, manual, settings.clinicianVoice]
  );

  const [started, setStarted] = useState(false);
  const [preCount, setPreCount] = useState(0);
  /** Başlangıç kontrolü: telefonun alındaki yeri (hasta modu). */
  const [prep, setPrep] = useState<null | 'place' | 'lookup'>(null);
  const [prepError, setPrepError] = useState<null | { text: string; sensor: boolean }>(null);
  /** Kendiliğinden başlama bir kez başarısız olduysa olağan (Başlat düğmeli) ekrana dönülür; ekran "Başlıyoruz…"da donmaz. */
  const [autoFailed, setAutoFailed] = useState(false);
  /** Son söylenen cümle (altyazı): sesi duyamayan hasta ya da yardımcı ekrandan okuyabilsin. */
  const [caption, setCaption] = useState<string | null>(null);
  /** Ekran açık tutulamadı (API yok ya da istek reddedildi): kullanıcı ekran zaman aşımını artırmalı. */
  const [wakeFailed, setWakeFailed] = useState(false);
  const flipped = !!settings.screenFlip;
  const helper = settings.assist === 'helper';
  const setFlip = (v: boolean) => store.update((x) => ({ ...x, settings: { ...x.settings, screenFlip: v } }));
  const setAssist = (v: 'self' | 'helper') => store.update((x) => ({ ...x, settings: { ...x.settings, assist: v } }));
  const cVoice: ClinicianVoice = settings.clinicianVoice ?? 'short';
  const setClinicianVoice = (v: ClinicianVoice) => {
    // Kapatınca o an okunan cümle de susar; alt yazı da kalkar (söyleniyormuş izlenimi vermesin; k08, tur 3).
    if (v === 'off') {
      speech.cancel();
      setCaption(null);
    }
    store.update((x) => ({ ...x, settings: { ...x.settings, clinicianVoice: v } }));
  };
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

  const dispatchRef = useRef<(ev: RunnerEvent) => void>(() => undefined);
  const dispatch = useCallback(
    (ev: RunnerEvent) => {
      const r = runnerStep(cfg, sRef.current, ev);
      sRef.current = r.state;
      for (const c of r.cues) {
        // Adım yönergesi: konuşma gerçekten bitince yürütücüye bildirilir (giriş, gerçek bitişi bekler).
        if (c.kind === 'speak' && c.tag === 'stepIntro' && cfg.awaitSpeechEnd) {
          const idx = c.stepIndex ?? sRef.current.stepIndex;
          speech.speak(c.text, c.priority, () => {
            if (alive.current) dispatchRef.current({ type: 'introSpoken', now: now(), stepIndex: idx });
          });
        } else if (c.kind === 'speak' && c.tag === 'count' && speechBusy()) {
          // Kuyrukta bekleyen sayım geç okunur ve yanlış süre söyler (k04, tur 2): konuşma sürüyorsa bu sayım atlanır.
          continue;
        } else if (c.kind === 'speak' && c.utterId !== undefined && cfg.awaitSpeechEnd) {
          // İpucu/uyarı: gerçek bitiş (ya da kesiliş) bildirilir; aynı ipucu bitmeden yinelenmez (k02, tur 3).
          const id = c.utterId;
          speech.speak(c.text, c.priority, () => {
            if (alive.current) dispatchRef.current({ type: 'cueSpoken', now: now(), utterId: id });
          });
        } else playCues([c] as Cue[]);
      }
      const spoken = r.cues.filter((c) => c.kind === 'speak');
      const last = spoken[spoken.length - 1];
      if (last && last.kind === 'speak') setCaption(last.text);
      setState(r.state);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cfg]
  );
  dispatchRef.current = dispatch;

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
      if (document.visibilityState === 'hidden') {
        dispatch({ type: 'pause', now: now() });
        return;
      }
      // Tarayıcı, sayfa gizlenince ekran kilidini bırakır; geri gelince yeniden iste.
      void keepAwake();
      // Duraklatma sesi sayfa gizliyken söylenmiş olabilir: dönüşte kısa tekrar (M2-3; y06). Klinisyende yok.
      const cur = sRef.current;
      const back = cur.phase === 'paused' ? pauseReturnSpeech(cfg, cur.vertigoActive) : null;
      if (back) {
        speech.speak(back, 'high');
        setCaption(back);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, dispatch]);

  // Çalışırken sayfa kapatılmak/yenilenmek istenirse uyar
  const running = started && !['done', 'aborted', 'safetyStop'].includes(state.phase);

  // Adım başında ara kayıt (onProgress): sayfa kapanırsa yapılan kısım kaybolmasın.
  const progressRef = useRef(onProgress);
  progressRef.current = onProgress;
  useEffect(() => {
    if (running && state.records.length > 0) progressRef.current?.({ records: state.records, manual });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, state.stepIndex, state.records.length]);

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
      if (ph !== 'done' && ph !== 'safetyStop' && ph !== 'aborted') speech.cancel();
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
    // Demo modunda da söylenir ve bitişi beklenir (M2-6; y01: yerleştirme cümleleri demo modunda sessizdi). Sesli okuma
    // yoksa (uçtan uca testler) tahmini süre hızlandırılmış saatle beklenir.
    if (settings.simulation && !speech.usable()) await sleep(est);
    else await speech.speakAsync(text, est * 2 + 2000);
    await sleep(extraMs);
  };

  /**
   * Hasta modu başlangıç yerleştirmesi (her manevra/test başında, ~15 s): telefon kalibrasyondan sonra alından alınıp
   * yeniden takılmış, hatta ekranı içe dönük takılmış olabilir. Bu yüzden dik duruş + "tavana bak" ölçülür (yalnız dik duruş,
   * içe/dışa dönüklüğü ayırt edemez → sağ/sol karışabilir). İşaret kuralı cihaza özgüdür, kayıtlı olan kullanılır.
   * Bu oturumda tam ölçüm yapıldıysa (N2-2; y07: bulantılı hastada her başlangıçta tavana bakma tetikliyordu) yalnız dik duruş
   * ölçülür: telefon kayıtlı yerinde sayılırsa (dik duruşta sapma ≤ CHAIN_MOUNT_TOLERANCE_DEG; zincirdeki kontrolle aynı ölçüt)
   * kayıtlı tanıtma kullanılır ve baş geriye yatırılmaz; yer değişmişse tavana bakışla tam ölçüme geçilir.
   */
  async function placePhone(c: Calibration): Promise<Calibration | null> {
    const uprightOnly = calibratedThisSession();
    const fail = (text: string, sensor = false) => {
      setPrep(null);
      setAutoFailed(true);
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
    if (uprightOnly && residualUprightDeg(up.mean, c) <= CHAIN_MOUNT_TOLERANCE_DEG) {
      haptics.play('reached');
      tones.play('reached');
      await sayAndWait('Tamam. Telefonu alnınızda tutun.', 500);
      setPrep(null);
      return c;
    }
    haptics.play('move');
    tones.play('move');
    setPrep('lookup');
    sim.lookUp();
    // Başı dönen kişi için yumuşak: yavaşça, zorlamadan, rahat olduğu kadar (M2-5; kalibrasyondaki cümle).
    await sayAndWait(CAL_LOOKUP_SPOKEN, 1500);
    if (!alive.current) return null;
    const lu = await collectSamples(source, Math.max(400, scaled(1200)));
    sim.upright();
    if (!alive.current) return null;
    if (!lu || lu.maxDevDeg > 8) return fail('Telefon ölçüm sırasında kıpırdadı. Yeniden Başlat\'a basın.');
    const res = computeCalibration(c.sign, up.mean, lu.mean);
    if (!res.ok) return fail(CALIBRATION_ERROR_TEXT[res.error]);
    haptics.play('reached');
    tones.play('reached');
    noteSessionCalibration();
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
        // Bu cümle yerleştirme yönergesiyle kesilmesin: bitişi beklenir.
        if (chained) await sayAndWait('Telefonun yeri değişmiş olabilir. Yeniden yerleştirelim.', 0);
        if (!alive.current) return;
        const c = await placePhone(calibration);
        if (!c || !alive.current) return;
        setCalibration(c);
        onPlaced?.(c);
      }
    }
    // Yardımcı modunda yönergeler yakına; hastaya tek cümle söylenir. Klinisyen sesi kapalıyken hiç konuşulmaz (k08, tur 3).
    const startText = startSpeechText(cfg, startNote);
    if (startText !== null) {
      if (P && (!settings.simulation || speech.usable())) {
        // Başlangıç cümlesi (ve varsa giriş notu, ör. acil belirti hatırlatması) 3 s'lik sayımda ilk yönergeyle kesilmesin:
        // önce sonuna kadar okunur. Demo modunda da (M2-1, M2-6; y05: hatırlatma 0,2 s'de adım komutuyla kesiliyordu).
        setCaption(startText);
        await speech.speakAsync(startText, estimateSpeechSec(startText, settings.speechRate) * 2000 + 2000);
        if (!alive.current) return;
      } else {
        // Klinisyende "Başlıyoruz." kuyruğa girer: kalibrasyonun "Kalibrasyon tamam." onayı kesilmesin (N2-5; y05).
        speech.speak(startText, P ? 'high' : 'normal');
      }
    }
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

  // Ekrana bakmadan: ekranın herhangi bir yerine 2 s basılı tutmak (hasta modu) manevra sürerken duraklatır; duraklatma
  // sayfasında ve güvenlik uyarısında geri alınabilir durdurmayı başlatır (N2-1). Tek dokunuş baş dönmesi işaretidir; uzun
  // basıştan sonra parmak kalkınca gelen "click" işaret sayılmaz.
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClick = useRef(false);
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };
  const startPress = (onLong: () => void) => {
    cancelPress();
    pressTimer.current = setTimeout(() => {
      pressTimer.current = null;
      suppressClick.current = true;
      onLong();
    }, LONG_PRESS_MS);
  };
  useEffect(() => cancelPress, []);
  /** Uzun basıştan sonraki tek "click"i yut. */
  const swallowClick = () => {
    if (!suppressClick.current) return false;
    suppressClick.current = false;
    return true;
  };
  /** Son "Devam et" anı (performance.now; duraklatma ya da güvenlik uyarısı). */
  const resumedAt = useRef<number | null>(null);
  /** "Devam et"e çift dokunuşun ikincisi mi (RESUME_TAP_GUARD_MS içinde gelen baş dönmesi dokunuşu yok sayılır)? */
  const tapGuarded = () => resumedAt.current !== null && performance.now() - resumedAt.current < RESUME_TAP_GUARD_MS;
  /** Duraklatma sayfasında basışın başladığı an (performance.now). */
  const sheetDownAt = useRef<number | null>(null);
  /**
   * Duraklatma sayfasında bu "click" kısa bir dokunuş mu? Uzun basış (≥ SHEET_TAP_MAX_MS) ya da 2 s basılı tutmanın
   * ardından gelen click hiçbir şey seçmez. Klavye (Enter/Boşluk: detail 0) her zaman çalışır.
   */
  const sheetTap = (e: React.MouseEvent) => {
    const t0 = sheetDownAt.current;
    sheetDownAt.current = null;
    if (swallowClick()) return false;
    if (e.detail === 0) return true;
    return t0 === null || performance.now() - t0 < SHEET_TAP_MAX_MS;
  };
  /** Duraklatma sayfası onay durumu (kalıcı sonuçlu düğmeler iki adımda; bkz. core/pauseSheet). */
  const [sheet, setSheetState] = useState<PauseSheetState>(initialPauseSheet);
  const sheetRef = useRef(sheet);
  const setSheet = (st: PauseSheetState) => {
    sheetRef.current = st;
    setSheetState(st);
  };
  // Onay süresi dolunca "Evet … eminim" düğmesi kalkar. Süre onay cümlesi bittikten sonra başlar (bitiş gelince yeniden kurulur).
  useEffect(() => {
    const deadline = confirmDeadline(sheet);
    if (deadline === null) return;
    const t = setTimeout(() => setSheet(initialPauseSheet()), Math.max(0, deadline - performance.now()));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet.armed, sheet.armedAt, sheet.promptDoneAt]);
  // Duraklatmadan çıkınca kurulmuş onay ve geri sayım kalkar (bir sonraki duraklatma temiz açılır).
  useEffect(() => {
    if (state.phase !== 'paused' && (sheetRef.current.armed !== null || sheetRef.current.stopping)) setSheet(initialPauseSheet());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);
  /** Duraklatma sayfasında bir kısa dokunuşu işler (kural: core/pauseSheet). */
  const onSheetTap = (target: SheetTarget) => {
    // Onay cümlesinin bitiş olayı gelmezse (ses kapalı ya da olay kayboldu) tahmini bitişi; ses yoksa pencere hemen başlar.
    const speaking = settings.speech && speech.usable();
    const promptMs = speaking ? estimateSpeechSec(CONFIRM_PROMPT, settings.speechRate) * 2000 + 2000 : 0;
    const r = pauseSheetTap(sheetRef.current, target, {
      now: performance.now(),
      vertigoActive: sRef.current.vertigoActive,
      patient: P,
      promptMs
    });
    setSheet(r.state);
    const a = r.action;
    if (a.kind === 'vertigoEnd') dispatch({ type: 'vertigoToggle', now: now() });
    else if (a.kind === 'resume') resumeNow();
    else if (a.kind === 'replay') {
      // Ayrıntılı duraklatma sesi (ilk okunuş yalnız eylemdi; k04, tur 4). Kurulmuş onay bozulmaz.
      const full = pauseSpeech(cfg, sRef.current.vertigoActive, true);
      speech.speak(full, 'high');
      setCaption(full);
    } else if (a.kind === 'arm') announceArm(CONFIRM_PROMPT, r.state.armedAt);
    else if (a.kind === 'commit') commitChoice(a.choice);
  };
  /**
   * Seçim kuruldu: ekrana bakmadan dokunan da bir şey olduğunu bilsin — "hazırsanız dokunun" titreşimi ve kısa söz. Onay süresi
   * bu söz bittikten sonra başlar (k01, tur 4); bitiş olayı bu kuruluşa bağlanır (eski kuruluşunki yok sayılır).
   */
  const announceArm = (text: string, armedAt: number | null) => {
    haptics.play('ready');
    speech.speak(text, 'high', () => {
      if (!alive.current || armedAt === null) return;
      const next = confirmPromptSpoken(sheetRef.current, armedAt, performance.now());
      if (next !== sheetRef.current) setSheet(next);
    });
    setCaption(text);
  };
  const commitChoice = (choice: PauseChoice) => {
    const reason = choice === 'unwell' ? 'USER_FEELS_UNWELL' : choice === 'unreachable' ? 'POSITION_UNREACHABLE' : 'USER_ABORT';
    dispatch({ type: 'abort', now: now(), reason });
  };
  /**
   * Basılı tutmayla başlayan, geri alınabilir durdurma (N2-1): "Durduruyorum. Yanlışsa ekrandaki Devam et'e dokunun." ve
   * cümle bitince 5'ten geriye sesli sayım; süre dolunca `commit` çalışır. Duraklatma sayfasında sayfa durumunun içinde
   * (sheet.stopping), güvenlik uyarısında ayrı (holdStopping) tutulur; söyleme ve sayma ikisinde de aynı.
   */
  const stopPromptMs = () =>
    settings.speech && speech.usable() ? estimateSpeechSec(STOP_UNDO_PROMPT, settings.speechRate) * 2000 + 2000 : 0;
  /** Söylenen son geri sayım sayısı (aynı sayı iki kez söylenmesin); geri sayım başlangıcına bağlı. */
  const spokenCount = useRef<{ at: number; n: number } | null>(null);
  const announceStop = (at: number, onSpoken: (at: number, now: number) => void) => {
    haptics.play('alarm');
    spokenCount.current = { at, n: 6 };
    speech.speak(STOP_UNDO_PROMPT, 'high', () => {
      if (alive.current) onSpoken(at, performance.now());
    });
    setCaption(STOP_UNDO_PROMPT);
  };
  /** Geri sayımı yürütür: sayıları söyler, süre dolunca `onDue` (iptal işlevi döner). */
  const runCountdown = (c: StopCountdown, isCurrent: () => boolean, onDue: () => void) => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const t = performance.now();
    for (const { n, at } of stopCountSchedule(c)) {
      timers.push(
        setTimeout(() => {
          if (!alive.current || !isCurrent()) return;
          const last = spokenCount.current;
          if (last && last.at === c.at && last.n <= n) return;
          spokenCount.current = { at: c.at, n };
          tones.play('countdown');
          const word = STOP_COUNT_WORDS[n] ?? String(n);
          speech.speak(word, 'high');
          setCaption(`${STOP_UNDO_PROMPT} ${word}…`);
        }, Math.max(0, at - t))
      );
    }
    timers.push(
      setTimeout(() => {
        if (alive.current && isCurrent()) onDue();
      }, Math.max(0, stopDeadline(c) - t))
    );
    return () => timers.forEach(clearTimeout);
  };
  // Duraklatma sayfasındaki geri sayım: süre dolunca "kendini iyi hissetmedi" nedeniyle durur.
  useEffect(() => {
    const c = sheet.stopping;
    if (!c || state.phase !== 'paused') return;
    return runCountdown(
      c,
      () => sheetRef.current.stopping?.at === c.at && sRef.current.phase === 'paused',
      () => {
        setSheet(initialPauseSheet());
        commitChoice('unwell');
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet.stopping?.at, sheet.stopping?.promptDoneAt, state.phase]);
  /** Duraklatma sayfasında ekrana 2 s basılı tutmak: HER ZAMAN geri alınabilir durdurma (N2-1; bkz. core/pauseSheet). */
  const onSheetHold = () => {
    if (sRef.current.phase !== 'paused') return;
    const r = pauseSheetHold(sheetRef.current, { now: performance.now(), patient: P, promptMs: stopPromptMs() });
    if (r.action.kind !== 'stopStart' || !r.state.stopping) return;
    setSheet(r.state);
    announceStop(r.state.stopping.at, (at, now) => {
      const next = pauseSheetStopSpoken(sheetRef.current, at, now);
      if (next !== sheetRef.current) setSheet(next);
    });
  };
  /** Güvenlik uyarısında basılı tutmayla başlayan, geri alınabilir durdurma (N2-1). */
  const [holdStopping, setHoldStoppingState] = useState<StopCountdown | null>(null);
  const holdStoppingRef = useRef<StopCountdown | null>(null);
  const setHoldStopping = (c: StopCountdown | null) => {
    holdStoppingRef.current = c;
    setHoldStoppingState(c);
  };
  useEffect(() => {
    if (state.phase !== 'safetyHold' && holdStoppingRef.current) setHoldStopping(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);
  // Güvenlik uyarısındaki geri sayım: süre dolunca "Durdur" (bugünkü durdurma sonucu; uzun baş dönmesinde VERTIGO_TOO_LONG).
  useEffect(() => {
    const c = holdStopping;
    if (!c || state.phase !== 'safetyHold') return;
    return runCountdown(
      c,
      () => holdStoppingRef.current?.at === c.at && sRef.current.phase === 'safetyHold',
      () => {
        setHoldStopping(null);
        cancelPress();
        dispatch({ type: 'safetyChoice', now: now(), choice: 'stop' });
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdStopping?.at, holdStopping?.promptDoneAt, state.phase]);
  /** Güvenlik uyarısında ekrana 2 s basılı tutmak: geri alınabilir durdurma başlar (süren sayımı yeniden başlatmaz). */
  const onSafetyHoldPress = () => {
    if (!P || sRef.current.phase !== 'safetyHold' || holdStoppingRef.current) return;
    const c = startStopCountdown(performance.now(), stopPromptMs());
    setHoldStopping(c);
    announceStop(c.at, (at, t) => {
      const cur = holdStoppingRef.current;
      if (!cur) return;
      const next = stopPromptSpoken(cur, at, t);
      if (next !== cur) setHoldStopping(next);
    });
  };
  /** Duraklatma sayfasında kısa dokunuş: hemen işlenir (bekleme ve çift dokunuş anlamı yok; N2-1). */
  const sheetShortTap = (target: SheetTarget) => onSheetTap(target);
  const sheetButton = (target: SheetTarget) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sheetTap(e)) sheetShortTap(target);
  };

  /** Ekrandaki başlık / yönerge / kısa özet: yardımcı modunda yardımcıya, klinisyende klinisyen metni. */
  // Hasta kendisi yapıyorsa gündelik başlık (derece ve teknik ad yok; M2-2); yardımcı ve klinisyen başlıkları değişmez.
  const titleOf = (st: StepDef) =>
    helperVoice && st.helperTitle ? st.helperTitle : P && !helperVoice && st.patientTitle ? st.patientTitle : st.title;
  const sayOf = (st: StepDef) => (!P ? st.clinician : helperVoice && st.helperSay ? st.helperSay : st.say);
  const shortOf = (st: StepDef) => (!P ? undefined : helperVoice && st.helperShort ? st.helperShort : st.short);

  /**
   * Güvenlik uyarısı (safetyHold) açılınca seçim düğmeleri kısa süre kilitli: baş dönmesinin geçtiğini işaretlemek için
   * alındaki telefona körlemesine dokunan hasta, tam o anda açılan uyarıda "Durdur"u ya da "Devam et"i seçmesin
   * (manevra sonrası soru ve "Yine de devam et" düğmeleriyle aynı kural).
   */
  const holdLocked = useTapLock(state.phase === 'safetyHold' && state.safetyHold ? state.safetyHold.at : undefined, SAFETY_HOLD_LOCK_MS);

  // --- Başlamadan önce ---------------------------------------------------------------------
  if (!started && auto && !autoFailed) {
    return (
      <div className={`runner${flipped ? ' flipped' : ''}`} data-testid="runner-ready">
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
                  <strong>{titleOf(st)}</strong>
                  {st.minHoldSec > 0 ? ` · en az ${st.minHoldSec} sn` : ''}
                  <div className="muted">{sayOf(st)}</div>
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
              {!P && (
                <p>
                  {manual
                    ? 'Telefon alna konmaz; zamanlayıcı olarak kullanılır. Pozisyonu onayladığınızda sayaç başlar.'
                    : 'Pozisyon doğruysa gösterge yeşile döner ve sayaç başlar.'}{' '}
                  Nistagmus başlangıç ve bitişini ekranın herhangi bir yerine dokunarak işaretleyin.
                </p>
              )}
              {manual && (
                <p>
                  <strong>Sensörsüz mod:</strong> açı ölçülmez.{' '}
                  {P ? 'Her yönergeden sonra pozisyona geçmeniz için 10 saniye tanınır; sonra süre kendiliğinden başlar.' : 'Her pozisyonu siz onaylarsınız.'}
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
                      onSensorless?.();
                    }}
                    data-testid="runner-go-manual"
                  >
                    Sensörsüz devam et (açı ölçülmez; yönergeyle ilerlenir)
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
    const minHold = effectiveMinHoldSec(cfg, step);
    const remHold = Math.max(0, minHold - state.holdSec);
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
      ringMax = Math.max(minHold, rem + state.holdSec);
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
    safetyHold: 'Güvenlik uyarısı: seçim bekleniyor',
    idle: ''
  };
  const nextStep = protocol.steps[state.stepIndex + 1];
  const shownStep = state.phase === 'between' && nextStep ? nextStep : step;
  const instrText = screenText(shownStep ? sayOf(shownStep) : '');
  const shortText = shownStep ? shortOf(shownStep) : undefined;
  const hintTexts = !P ? HINT_TEXT_CLINICIAN : helperVoice ? HINT_TEXT_HELPER : HINT_TEXT_PATIENT;

  const terminal = state.phase === 'done' || state.phase === 'aborted' || state.phase === 'safetyStop';
  const holding = state.phase === 'safetyHold';
  const canMark = step?.observe !== false && state.phase !== 'between' && state.phase !== 'paused' && !holding && !terminal;
  // Ekranın herhangi bir yerine dokunmak baş dönmesini işaretler (alındaki telefona körlemesine dokunuş için);
  // düğmeler kendi işini yapar.
  const onBodyTap = (e: React.MouseEvent) => {
    if (swallowClick()) return;
    if (!canMark || tapGuarded()) return;
    if ((e.target as HTMLElement).closest('button, a, input, select, label, summary')) return;
    dispatch({ type: 'vertigoToggle', now: now() });
  };
  /**
   * Güvenlik uyarısında seçim (yeniden tasarım: kilit yok). "Devam et" araştırma kaydına yazılır (Episode.overrides);
   * "Durdur" bugünkü durdurma sonucunu verir. Kendiliğinden hiçbir seçim yapılmaz.
   */
  const chooseSafety = (choice: 'continue' | 'stop') => {
    const cur = sRef.current;
    if (cur.phase !== 'safetyHold' || !cur.safetyHold || holdLocked) return;
    cancelPress();
    // Geri sayım sürerken "Devam et" durdurmayı geri alır ve devam eder; "Durdur" hemen durdurur (N2-1).
    if (holdStoppingRef.current) setHoldStopping(null);
    if (choice === 'continue') {
      unlockAudio();
      void keepAwake();
      logOverride(cur.safetyHold.reason, safetyHoldDetail(protocol, cur) ?? undefined);
      resumedAt.current = performance.now();
    }
    dispatch({ type: 'safetyChoice', now: now(), choice });
  };
  const resumeNow = () => {
    // Arama/arka plandan sonra ses motorları yeniden açılır (bu dokunuş iOS için gereklidir).
    unlockAudio();
    void keepAwake();
    resumedAt.current = performance.now();
    dispatch({ type: 'resume', now: now() });
  };
  /** Uzun basışın başlamayacağı denetimler (baş dönmesi alanı ekranın parçası sayılır). */
  const isControl = (t: EventTarget) =>
    !!(t as HTMLElement).closest('button:not(.vertigo-pad), a, input, select, label, summary, .overlay');
  const guiding = !manual && ev?.hint && (state.phase === 'seeking' || state.phase === 'settling' || state.phase === 'drifting');
  /**
   * Düzeltme ipucu afişi görünüyor: yerleşim sıkışır (afiş ve açı satırı küçülür, gösterge küçülür), baş göstergesi ve
   * sayaç 390×664'te de alttaki işaret alanının üstünde kalır (k08, tur 5).
   */
  const showHint = !!(guiding && ev?.hint);
  /** Onayı beklenen kalıcı seçim (süresi dolmadıysa). */
  const armed = state.phase === 'paused' ? armedChoice(sheet, performance.now()) : null;
  /** Kurulan seçimin yerinde dokunulamayan not durur (aynı yere ikinci kör dokunuş onaylamaz); diğerleri düğmedir. */
  const sheetChoice = (choice: PauseChoice, btn: React.ReactNode) =>
    armed === choice ? (
      <div className="sheet-armed" role="status" data-testid={`runner-armed-${choice}`} key={choice}>
        Onaylamak için yukarıdaki kırmızı "Evet" düğmesine dokunun. Vazgeçmek için bir şey yapmayın.
      </div>
    ) : (
      btn
    );
  const observeDone = !P && step?.observe !== false && !state.vertigoActive && state.vertigoEndedAt !== null;
  /** Basılı tutmayla başlayan durdurma sürüyorsa ekranda kalan saniye ve uyarı şeridi (N2-1). */
  const stopping = state.phase === 'paused' ? (sheet.stopping ?? null) : holding ? holdStopping : null;
  const stopBanner = stopping && (
    <div className="notice danger stack" role="alert" aria-live="assertive" data-testid="runner-stopping" data-left={stopSecondsLeft(stopping, performance.now())}>
      <strong>Durduruluyor… {stopSecondsLeft(stopping, performance.now())}</strong>
      <span className="small">Yanlışsa aşağıdaki "Devam et"e dokunun.</span>
    </div>
  );

  return (
    <div
      className={`runner${flipped ? ' flipped' : ''}${P ? ' press-surface' : ' clinician'}${showHint ? ' hinting' : ''}`}
      data-testid="runner"
      data-phase={state.phase}
      data-step={state.stepIndex}
      onClick={onBodyTap}
      onPointerDownCapture={() => {
        suppressClick.current = false;
      }}
      onPointerDown={(e) => {
        if (!P || terminal || state.phase === 'paused' || holding || isControl(e.target)) return;
        startPress(() => {
          if (sRef.current.phase !== 'paused') dispatch({ type: 'pause', now: now() });
        });
      }}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      onContextMenu={(e) => {
        if (P) e.preventDefault();
      }}
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
        <div className="grow stack runner-head-title" style={{ gap: 6 }}>
          {/* En çok iki satır (390 px'te de; k08, tur 3). */}
          <strong>
            {protocol.shortName}
            {protocol.side ? ` · ${sideName(protocol.side)}` : ''} — Adım {state.stepIndex + 1}/{protocol.steps.length}
          </strong>
          <StepDots total={protocol.steps.length} index={state.stepIndex} />
        </div>
        {!P && (
          // Klinisyen sesli yönergesi: kısa → açık → kapalı (telefon hastanın alnında; k08, tur 2). Yalnız simge + rozet:
          // başlığı sıkıştırıp "Ekranı çevir"i taşırmasın (k08, k10; tur 3). Durum aria-label ve title'da.
          <button
            className="btn icon runner-voice"
            aria-label={`Sesli yönerge: ${CLINICIAN_VOICE_LABEL[cVoice]}. Değiştirmek için dokunun.`}
            title={CLINICIAN_VOICE_LABEL[cVoice]}
            onClick={() => setClinicianVoice(CLINICIAN_VOICE_NEXT[cVoice])}
            data-testid="runner-clinician-voice"
            data-voice={cVoice}
          >
            <Icon name="volume" size={20} />
            <span className="runner-voice-badge" aria-hidden="true">
              {CLINICIAN_VOICE_BADGE[cVoice]}
            </span>
          </button>
        )}
        <button
          className="btn icon runner-flip"
          aria-label="Ekranı çevir"
          aria-pressed={flipped}
          title="Ekranı 180° çevir (başucunda duruyorsanız)"
          onClick={() => setFlip(!flipped)}
          data-testid="runner-flip"
        >
          <Icon name="rotate" />
        </button>
      </div>
      {/* Acil belirti aşıldıysa başlığın altında kısa kırmızı 112 satırı (M2-1; y05). */}
      {P && emergency && (
        <div className="runner-emergency" role="note" data-testid="runner-emergency">
          <Icon name="alert" size={18} />
          <span>{RUNNER_EMERGENCY_LINE}</span>
        </div>
      )}

      {/* Klinisyen eylemleri üstte: alttaki işaret alanına körlemesine dokunuş gözlemi kazara bitirmesin. */}
      {!P && state.phase !== 'between' && !terminal && (
        <div className="runner-actions" data-testid="runner-actions">
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

      <div className="runner-body">
        <div className="runner-title" data-testid="runner-step-title">
          {state.phase === 'between' && nextStep ? `Sırada: ${titleOf(nextStep)}` : step ? titleOf(step) : ''}
        </div>
        {/* Kritik eylemin kısa hâli başlığın hemen altında: çevrik ekranda ya da uzaktan da görünür kalır. */}
        {shortText && !terminal && (
          <p className="runner-short" data-testid="runner-short">
            {shortText}
          </p>
        )}

        {showHint && ev?.hint ? (
          <HintBanner hint={ev.hint} flipped={flipped} texts={hintTexts} self={P && !helperVoice} />
        ) : (
          <div className="row">
            <span className={`status-pill ${statusClass}`} aria-live="polite" data-testid="runner-status">
              {statusText[state.phase]}
            </span>
          </div>
        )}

        {/* Klinisyen: açı sayıları göstergeden önce (küçük ekranda ve büyük yazıda da görünür kalsın). */}
        {!P && !manual && step && state.phase !== 'between' && (
          <div className="card soft small runner-numbers" data-testid="runner-numbers">
            <div className="row wrap runner-numbers-row">
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
            {/* İpucu afişi görünürken aynı söz kartta yinelenmez (gösterge ilk ekranda kalsın; k08, tur 5). */}
            {ev?.hint && !showHint && <div style={{ marginTop: 6 }}>{HINT_TEXT_CLINICIAN[ev.hint]}</div>}
          </div>
        )}

        {wakeFailed && P && (
          <div className="notice" role="status">
            <Icon name="alert" />
            <span>Ekran açık tutulamıyor. Ekran kararırsa manevra duraklar; telefonun ekran zaman aşımını en az 5 dakikaya çıkarın.</span>
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
              <HeadGauge target={step.target} pose={pose} inRange={!!ev?.inRange} flipped={flipped} self={P && !helperVoice} />
            )}
            <HoldRing value={ringVal} max={ringMax} label={ringLabel} sub={ringSub} />
          </div>
        )}
        {step && state.phase === 'between' && (
          <div className="row" style={{ justifyContent: 'center' }}>
            <HoldRing value={ringVal} max={ringMax} label={ringLabel} sub={ringSub} />
          </div>
        )}
        {!manual && step && state.phase !== 'between' && <HangBar target={step.target} pose={pose} self={P && !helperVoice} />}

        {caption && !clinicianSilent(cfg) && caption !== instrText && !(guiding && ev?.hint && caption.includes(hintTexts[ev.hint])) && (
          <p className="caption" aria-live="polite" data-testid="runner-caption">
            <Icon name="volume" size={18} /> {caption}
          </p>
        )}

        {/* Yönerge: yeni adımın başında tam, sonra kısaltılmış (ses zaten söyledi; ekran göstergeye yer açar). */}
        <p className={`runner-instr${state.phase === 'intro' || state.phase === 'between' ? '' : ' compact'}`}>{instrText}</p>
        {step?.unverifiable && state.phase !== 'between' && (!P || helperVoice) && <p className="small muted">{step.unverifiable}</p>}

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

      {canMark && (
        <button
          className={`vertigo-pad${state.vertigoActive ? ' active' : ''}`}
          onClick={() => {
            if (swallowClick() || tapGuarded()) return;
            dispatch({ type: 'vertigoToggle', now: now() });
          }}
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

      {holding && state.safetyHold && (
        <div
          className="overlay"
          role="alertdialog"
          aria-modal="true"
          aria-label="Güvenlik uyarısı"
          data-testid="runner-safety-hold"
          data-reason={state.safetyHold.reason}
          // Açılıştaki kör dokunuş (SAFETY_HOLD_LOCK_MS kilidi) ve kısa kör dokunuş hiçbir seçimi yapmaz. Ekrana bakmadan
          // seçim (y07, yeni kullanıcı turu 1): hasta modunda ekranın herhangi bir yerine (düğmenin üstü de) 2 s basılı tutmak
          // önerilen yolu, "Durdur"u seçer; kilit sürerken başlayan basış saymaz. "Devam et" yalnız düğmeyle.
          onPointerDownCapture={() => {
            sheetDownAt.current = performance.now();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (!P || holdLocked) return;
            startPress(onSafetyHoldPress);
          }}
          onPointerUp={cancelPress}
          onPointerLeave={cancelPress}
          onPointerCancel={cancelPress}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sheet" data-locked={holdLocked || undefined} style={holdLocked ? { opacity: 0.85 } : undefined}>
            {stopBanner}
            <h2>{state.safetyHold.reason === 'VERTIGO_TOO_LONG' ? 'Baş dönmesi uzun sürdü' : 'Pozisyona gelinemedi'}</h2>
            <p data-testid="runner-safety-hold-text">{safetyHoldText(state)}</p>
            <p className="small muted">Manevra bekliyor; siz seçmeden devam etmez.</p>
            {P && (
              <p className="small" data-testid="runner-safety-hold-hint">
                Ekrana bakmadan: durdurmak için ekranın herhangi bir yerine 2 saniye basılı tutun (5 saniye içinde "Devam et"e
                dokunursanız durmaz). Devam etmek için alttaki "Devam et" düğmesine dokunun.
              </p>
            )}
            {P && settings.speech && (
              <button
                className="btn ghost block sheet-replay"
                onClick={(e) => {
                  e.stopPropagation();
                  const t = safetyHoldText(sRef.current);
                  if (t) {
                    speech.speak(t, 'high');
                    setCaption(t);
                  }
                }}
                data-testid="runner-safety-hold-replay"
              >
                <Icon name="volume" /> Tekrar dinle
              </button>
            )}
            {/* Önerilen yol büyük dolu birincil düğme; aşma (devam) çerçeveli ikincil ve kayda geçer (BRIEF; y03, y05). */}
            <button
              className="btn primary block xl"
              onClick={(e) => {
                e.stopPropagation();
                if (sheetTap(e)) chooseSafety('stop');
              }}
              data-testid="runner-hold-stop"
              data-variant="primary"
            >
              <Icon name="stop" /> Durdur
            </button>
            <button
              className="btn secondary block"
              data-variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                if (sheetTap(e)) chooseSafety('continue');
              }}
              data-testid="runner-hold-continue"
            >
              <Icon name="play" /> Devam et
            </button>
            {state.safetyHold.reason === 'VERTIGO_TOO_LONG' && (
              <a className="btn danger block" href="tel:112" onClick={(e) => e.stopPropagation()} data-testid="runner-hold-112">
                <Icon name="phone" /> 112'yi ara
              </a>
            )}
          </div>
        </div>
      )}

      {state.phase === 'paused' && (
        <div
          className="overlay press-surface"
          role="dialog"
          aria-modal="true"
          aria-label="Duraklatıldı"
          data-testid="runner-paused"
          // Tek ve sabit kural (N2-1): NERESİ olursa olsun (düğmenin üstü de) 2 s basılı tutmak durdurur (5 s içinde "Devam et"
          // geri alır); uzun basış hiçbir düğmeyi seçmez (k01, tur 2). "Devam et"e kısa dokunuş hemen devam eder. Baş dönmesi
          // işaretliyken "Devam et" dışındaki ilk kısa dokunuş, nereye denk gelirse gelsin "geçti"dir (k01, tur 3).
          onPointerDownCapture={() => {
            sheetDownAt.current = performance.now();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (!P) return;
            startPress(onSheetHold);
          }}
          onPointerUp={cancelPress}
          onPointerLeave={cancelPress}
          onPointerCancel={cancelPress}
          onClick={(e) => {
            e.stopPropagation();
            if ((e.target as HTMLElement).closest('button')) return;
            if (!sheetTap(e)) return;
            sheetShortTap('background');
          }}
        >
          <div className="sheet" data-armed={armed ?? undefined} data-stopping={stopping ? true : undefined}>
            {stopBanner}
            {/* Onay düğmesi seçim düğmelerinden uzakta, sayfanın üstünde: aynı yere ikinci kör dokunuş onaylamaz. */}
            {armed && !stopping && (
              <button
                className="btn danger block sheet-confirm"
                onClick={sheetButton('confirm')}
                data-testid="runner-confirm"
                data-choice={armed}
              >
                {confirmLabel(armed, helperVoice)}
              </button>
            )}
            <h2>Duraklatıldı</h2>
            <p className="muted">
              {P
                ? helperVoice
                  ? 'Devam ettiğinizde aynı adımdan, hastanın pozisyonu yeniden doğrulanarak sürer.'
                  : 'Devam ettiğinizde aynı adımdan, pozisyonunuz yeniden doğrulanarak sürer.'
                : 'Devam edildiğinde pozisyon yeniden doğrulanır.'}
            </p>
            {P && (
              <p className="small" data-testid="runner-paused-hint">
                Devam etmek için "Devam et"e dokunun.
                {helperVoice
                  ? ' Hasta kötüyse durdurmak için ekranın herhangi bir yerine 2 saniye basılı tutun'
                  : ' Kendinizi kötü hissediyorsanız durdurmak için ekranın herhangi bir yerine 2 saniye basılı tutun'}
                {' (5 saniye içinde "Devam et"e dokunursanız durmaz).'}
                {state.vertigoActive
                  ? ' Baş dönmesi geçtiyse boş bir yere bir kez dokunun; bu ilk dokunuş hiçbir düğmeyi seçmez.'
                  : ' Aşağıdaki kırmızı ve gri düğmeler bir onay daha ister.'}
              </p>
            )}
            {P && settings.speech && (
              // İlk okunuş yalnız eylemi söyler; boyun ağrısı ve "Pozisyona gelemiyorum" yolu burada (k04, tur 4). Kalıcı sonucu yok.
              <button className="btn ghost block sheet-replay" onClick={sheetButton('replay')} data-testid="runner-paused-replay">
                <Icon name="volume" /> Tekrar dinle (ayrıntılı)
              </button>
            )}
            {state.vertigoActive && (
              <button
                autoFocus
                className="btn warn block"
                onClick={sheetButton('vertigoEnd')}
                data-testid="runner-paused-vertigo-end"
              >
                {P ? (helperVoice ? 'Hastanın baş dönmesi geçti' : 'Baş dönmesi geçti') : 'Belirti / nistagmus bitti'}
              </button>
            )}
            <button
              className="btn primary block"
              autoFocus={!state.vertigoActive}
              onClick={sheetButton('resume')}
              data-testid="runner-resume"
            >
              <Icon name="play" /> Devam et
            </button>
            {P &&
              sheetChoice(
                'unwell',
                <button className="btn warn block" onClick={sheetButton('unwell')} data-testid="runner-unwell">
                  {helperVoice ? 'Hasta kendini kötü hissediyor' : 'Kendimi kötü hissediyorum'}
                </button>
              )}
            {P &&
              // Zorlamadan gelinemeyen pozisyon: yarıda bırakma değil; kaydedilir ve hekime yönlendirilir (hedef gevşetilmez).
              sheetChoice(
                'unreachable',
                <button className="btn warn block" onClick={sheetButton('unreachable')} data-testid="runner-unreachable">
                  {helperVoice ? 'Bu pozisyona gelemiyor / boynu ağrıyor' : 'Pozisyona gelemiyorum / boynum ağrıyor'}
                </button>
              )}
            {sheetChoice(
              'abort',
              <button className="btn secondary block" onClick={sheetButton('abort')} data-testid="runner-abort">
                <Icon name="stop" /> {P ? (helperVoice ? 'Şimdilik bırak (hasta iyi)' : 'Şimdilik bırak (iyiyim)') : 'Sonlandır'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Onay düğmesi yazısı: ne onaylandığı açıkça ve "eminim" ile. */
function confirmLabel(choice: PauseChoice, helper: boolean): string {
  if (choice === 'unwell') return helper ? 'Evet, hasta kötü — eminim' : 'Evet, kendimi kötü hissediyorum — eminim';
  if (choice === 'unreachable') return helper ? 'Evet, bu pozisyona gelemiyor — eminim' : 'Evet, pozisyona gelemiyorum — eminim';
  return helper ? 'Evet, şimdilik bırak — eminim' : 'Evet, şimdilik bırakıyorum — eminim';
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
function HintBanner({ hint, flipped, texts, self = false }: { hint: HintKey; flipped: boolean; texts: Record<HintKey, string>; self?: boolean }) {
  const right = hint === 'TURN_RIGHT' || hint === 'TURN_BODY_RIGHT';
  const left = hint === 'TURN_LEFT' || hint === 'TURN_BODY_LEFT';
  // Yanlış taraf: ok yok (en kısa yön yüzüstünden geçirir); önce sırtüstü (k02, tur 2).
  const wrong = hint === 'WRONG_SIDE_RIGHT' || hint === 'WRONG_SIDE_LEFT';
  const toRightOfScreen = right ? flipped : left ? !flipped : null;
  const arrow = toRightOfScreen === null ? null : toRightOfScreen ? '→' : '←';
  // Ekran yardımcıya/klinisyene bakar: yön sözü kişiye göre ("hastanın sağına") yazılır; ses kendi kipindeki sözle söyler.
  // Hasta kendisi yapıyorsa gündelik: "SAĞINIZA" (M2-2; y01).
  const text = self
    ? hintSelfText(hint, texts)
    : hint === 'TURN_RIGHT'
      ? 'Başı HASTANIN SAĞINA biraz daha çevirin'
      : hint === 'TURN_LEFT'
        ? 'Başı HASTANIN SOLUNA biraz daha çevirin'
        : hint === 'TURN_BODY_RIGHT'
          ? 'Gövdeyi HASTANIN SAĞINA çevirin (yalnız baş değil)'
          : hint === 'TURN_BODY_LEFT'
            ? 'Gövdeyi HASTANIN SOLUNA çevirin (yalnız baş değil)'
            : wrong
              ? `DUR — yanlış taraf. Önce sırtüstüne, sonra HASTANIN ${hint === 'WRONG_SIDE_RIGHT' ? 'SAĞ' : 'SOL'} YANINA (yüzüstünden değil)`
              : texts[hint];
  return (
    <div className={`hint-banner${wrong ? ' wrong' : ''}`} role="status" data-testid="runner-hint" data-hint={hint}>
      {arrow && toRightOfScreen === false && <span className="hint-arrow" aria-hidden="true">{arrow}</span>}
      <span className="grow">{text}</span>
      {arrow && toRightOfScreen === true && <span className="hint-arrow" aria-hidden="true">{arrow}</span>}
    </div>
  );
}

/** Hasta kendisi yapıyorken ipucu afişi: yön sözü ikinci şahısla ("SAĞINIZA"); diğer ipuçları hasta metniyle. */
export function hintSelfText(hint: HintKey, texts: Record<HintKey, string>): string {
  switch (hint) {
    case 'TURN_RIGHT':
      return 'Başınızı SAĞINIZA biraz daha çevirin';
    case 'TURN_LEFT':
      return 'Başınızı SOLUNUZA biraz daha çevirin';
    case 'TURN_BODY_RIGHT':
      return 'Bütün vücudunuzla SAĞINIZA dönün (yalnız baş değil)';
    case 'TURN_BODY_LEFT':
      return 'Bütün vücudunuzla SOLUNUZA dönün (yalnız baş değil)';
    case 'WRONG_SIDE_RIGHT':
    case 'WRONG_SIDE_LEFT':
      return `DUR — yanlış taraf. Önce sırtüstüne, sonra ${hint === 'WRONG_SIDE_RIGHT' ? 'SAĞ' : 'SOL'} YANINIZA (yüzüstünden değil)`;
    default:
      return texts[hint];
  }
}

/** Basılı tutunca çalışan düğme (hasta modunda kazara duraklatmayı önler). Klavyeyle Enter/Boşluk hemen çalıştırır. */
export function HoldButton({
  ms,
  onHold,
  children,
  testid,
  label = 'Duraklat (basılı tutun)',
  className = 'btn secondary'
}: {
  ms: number;
  onHold: () => void;
  children: React.ReactNode;
  testid?: string;
  label?: string;
  className?: string;
}) {
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
      className={`${className} hold-btn${pressing ? ' pressing' : ''}`}
      style={{ ['--hold-ms' as string]: `${ms}ms` }}
      aria-label={label}
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
      <li>Hastanın başucunda ya da yanında durun. Başucundaysanız ekranı size göre çevirin (<strong>⟲ Ekranı çevir</strong>); sonraki tüm ekranlar da size göre döner.</li>
      <li>Telefonu iki yan kenarından parmak uçlarıyla alna bastırın (avuç ekrana değmesin; ekran dokunuşu baş dönmesi işaretidir). Başı iki elle tutup çevirin.</li>
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
    .filter((x) => !/ekrana (siz )?(tekrar |yeniden )?dokunun/i.test(x) &&!/^Baş dönmesi olabilir, bu beklenen bir durumdur\.?$/i.test(x))
    .join(' ');
}
