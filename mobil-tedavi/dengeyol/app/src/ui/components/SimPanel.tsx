/**
 * Demo/simülasyon paneli: gerçek sensör olmadan uygulamayı denemek ve otomatik testler için.
 * Ekranda açıkça "DEMO" etiketi gösterilir.
 */
import { useEffect, useState } from 'react';
import { upFromLying, upFromSitting } from '../../core/geometry';
import type { Target } from '../../core/protocols';
import { useMotion } from '../../platform/MotionContext';
import { store, useData } from '../../state/store';
import { Icon } from './Icon';

type Listener = (t: Target | null) => void;
let currentTarget: Target | null = null;
const listeners = new Set<Listener>();

/** Yürütücü, o anki adımın hedefini buraya bildirir (yalnızca demo "Hedefe git" düğmesi için). */
export function publishSimTarget(t: Target | null) {
  currentTarget = t;
  listeners.forEach((l) => l(t));
}

type ForeheadListener = (on: boolean) => void;
let foreheadReady = 0;
const foreheadListeners = new Set<ForeheadListener>();

/**
 * "Telefon alındayken ekranın her yeri" bekleyen bir ekran açık (hazırlık, telefonu tanıtma girişi; ForeheadTap). Demo
 * modunda sanal baş paneli bu ekranlarda da açılabilsin: yoksa sanal telefon alına konamıyor, ekranın her yerine dokunma
 * demo yolunda hiç denenemiyordu (yeni kullanıcı turu 2, M2-5; y07, y02).
 */
export function publishSimForehead(on: boolean) {
  foreheadReady = Math.max(0, foreheadReady + (on ? 1 : -1));
  foreheadListeners.forEach((l) => l(foreheadReady > 0));
}

export function SimPanel() {
  const { simulated } = useMotion();
  const { settings } = useData();
  const [open, setOpen] = useState(false);
  const [posture, setPosture] = useState<'sit' | 'lie'>('sit');
  const [theta, setTheta] = useState(0);
  const [phi, setPhi] = useState(0);
  const [psi, setPsi] = useState(0);
  const [reading, setReading] = useState(true);
  const [target, setTarget] = useState<Target | null>(currentTarget);
  const [forehead, setForehead] = useState(foreheadReady > 0);

  useEffect(() => {
    const l: Listener = (t) => {
      setTarget(t);
      // Yürütücü bitince panel kendiliğinden kapanır; ekrandaki düğmelerin üstünü örtmez.
      if (!t) setOpen(false);
    };
    listeners.add(l);
    const f: ForeheadListener = (on) => {
      setForehead(on);
      if (!on && !currentTarget) setOpen(false);
    };
    foreheadListeners.add(f);
    // Kardeş bileşen (ForeheadTap) bu etkiden önce bildirmiş olabilir: o anki durum alınır.
    setForehead(foreheadReady > 0);
    return () => {
      listeners.delete(l);
      foreheadListeners.delete(f);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('sim-on', !!simulated);
    return () => document.documentElement.classList.remove('sim-on');
  }, [simulated]);

  useEffect(() => {
    if (!simulated) return;
    simulated.reading = reading;
    simulated.setHeadUp(posture === 'sit' ? upFromSitting(psi) : upFromLying(theta, phi));
  }, [simulated, posture, theta, phi, psi, reading]);

  if (!simulated) return null;

  /** Sanal telefonu alına koy: dik oturuş, karşıya bakış (ForeheadTap ekranlarında). */
  const putOnForehead = () => {
    // Doğrudan da ayarlanır: panelin durumu (ör. önceki manevradan) zaten "dik oturuş" olabilir; o zaman etki yeniden çalışmaz.
    simulated.reading = false;
    simulated.setHeadUp(upFromSitting(0));
    setPosture('sit');
    setPsi(0);
    setReading(false);
  };

  const goTarget = () => {
    if (!target) return;
    setReading(false);
    if (target.kind === 'sitting') {
      setPosture('sit');
      setPsi(Math.round((target.psiMin + target.psiMax) / 2));
    } else {
      setPosture('lie');
      setTheta(target.theta);
      setPhi(Math.round((target.phiMin + target.phiMax) / 2));
    }
  };

  return (
    <>
      <div className="sim-badge" role="status">DEMO MODU · sanal sensör · tedavi amaçlı değildir</div>
      {/* Demo paneline dokunmak süren yönergeyi susturmaz (data-keep-speech): incelemelerde panelin kestiği cümle
          uygulamanın kesmesi sanılıyordu (yeni kullanıcı turu 1, y03/y07). */}
      {!target && !forehead ? null : !open ? (
        <button className={`btn secondary sim-toggle${target ? '' : ' at-top'}`} onClick={() => setOpen(true)} data-testid="sim-open" aria-label="Demo panelini aç" data-keep-speech data-sim-control>
          <Icon name="head" /> Sanal baş
        </button>
      ) : (
        <div className={`sim-panel${target ? '' : ' at-top'}`} data-testid="sim-panel" data-keep-speech data-sim-control>
          <div className="row">
            <strong className="grow">Sanal baş (demo)</strong>
            <button className="btn icon" onClick={() => setOpen(false)} aria-label="Kapat">
              <Icon name="close" />
            </button>
          </div>
          <label className="row">
            <input type="checkbox" checked={reading} onChange={(e) => setReading(e.target.checked)} /> Telefon elde (okuma)
          </label>
          <div className="seg">
            <button aria-pressed={posture === 'sit'} onClick={() => { setPosture('sit'); setReading(false); }}>Oturur</button>
            <button aria-pressed={posture === 'lie'} onClick={() => { setPosture('lie'); setReading(false); }}>Yatar</button>
          </div>
          {posture === 'lie' ? (
            <>
              <label>θ dönüş {theta}° (+ sağ kulak altta)</label>
              <input type="range" min={-180} max={180} value={theta} onChange={(e) => setTheta(+e.target.value)} />
              <label>φ sarkıklık {phi}°</label>
              <input type="range" min={-60} max={60} value={phi} onChange={(e) => setPhi(+e.target.value)} />
            </>
          ) : (
            <>
              <label>ψ çene {psi}° (+ aşağı, − tavana)</label>
              <input type="range" min={-45} max={60} value={psi} onChange={(e) => setPsi(+e.target.value)} />
            </>
          )}
          {target ? (
            <button className="btn primary" onClick={goTarget} data-testid="sim-goto">
              Hedef pozisyona git
            </button>
          ) : (
            <button className="btn primary" onClick={putOnForehead} data-testid="sim-forehead" aria-pressed={!reading}>
              Telefonu alına koy (dik otur)
            </button>
          )}
          <label>Zaman hızı</label>
          <div className="seg">
            {([1, 5, 20] as const).map((v) => (
              <button
                key={v}
                aria-pressed={settings.timeScale === v}
                onClick={() => store.update((d) => ({ ...d, settings: { ...d.settings, timeScale: v } }))}
              >
                ×{v}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/** Kalibrasyon sırasında demo başını otomatik ayarlamak için. */
export function useSimAuto() {
  const { simulated } = useMotion();
  return {
    reading: () => {
      if (simulated) simulated.reading = true;
    },
    upright: () => {
      if (simulated) {
        simulated.reading = false;
        simulated.setHeadUp(upFromSitting(0));
      }
    },
    lookUp: () => {
      if (simulated) {
        simulated.reading = false;
        simulated.setHeadUp(upFromSitting(-35));
      }
    }
  };
}
