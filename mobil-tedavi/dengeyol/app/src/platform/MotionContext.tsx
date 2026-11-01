import { createContext, type ReactNode, useContext, useEffect, useMemo } from 'react';
import { useData } from '../state/store';
import { type MotionSource, SimulatedMotionSource, WebMotionSource } from './motion';

interface MotionCtx {
  source: MotionSource;
  simulated: SimulatedMotionSource | null;
}

const Ctx = createContext<MotionCtx | null>(null);

const device = new WebMotionSource();
const sim = new SimulatedMotionSource();

export function MotionProvider({ children }: { children: ReactNode }) {
  const { settings } = useData();
  const value = useMemo<MotionCtx>(
    () => (settings.simulation ? { source: sim, simulated: sim } : { source: device, simulated: null }),
    [settings.simulation]
  );
  useEffect(() => {
    if (settings.simulation) void sim.start();
    else sim.stop();
    // Yalnız demo modunda: uçtan uca testler sanal telefonu panel açılmadan alına koyabilsin (L5-4).
    const w = window as unknown as { __dengeyolSim?: { upright: () => void; reading: () => void } };
    if (settings.simulation) {
      w.__dengeyolSim = {
        upright: () => {
          sim.reading = false;
          sim.setHeadUp({ x: 0, y: 1, z: 0 });
        },
        reading: () => {
          sim.reading = true;
        }
      };
    } else delete w.__dengeyolSim;
  }, [settings.simulation]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMotion(): MotionCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('MotionProvider eksik');
  return c;
}
