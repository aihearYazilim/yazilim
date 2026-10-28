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

  useEffect(() => {
    const l: Listener = (t) => {
      setTarget(t);
      // Yürütücü bitince panel kendiliğinden kapanır; ekrandaki düğmelerin üstünü örtmez.
      if (!t) setOpen(false);
    };
    listeners.add(l);
    return () => {
      listeners.delete(l);
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
      {!target ? null : !open ? (
        <button className="btn secondary sim-toggle" onClick={() => setOpen(true)} data-testid="sim-open" aria-label="Demo panelini aç">
          <Icon name="head" /> Sanal baş
        </button>
      ) : (
        <div className="sim-panel" data-testid="sim-panel">
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
          <button className="btn primary" onClick={goTarget} disabled={!target} data-testid="sim-goto">
            Hedef pozisyona git
          </button>
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
