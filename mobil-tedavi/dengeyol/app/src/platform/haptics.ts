/** Titreşim kalıpları (Android tarayıcıları; iOS Safari titreşim API'sini desteklemez → yalnız ses/ton). */
export type HapticPattern = 'reached' | 'drift' | 'stepDone' | 'alarm' | 'tap';

const PATTERNS: Record<HapticPattern, number[]> = {
  reached: [400],
  drift: [90, 80, 90],
  stepDone: [80, 60, 80, 60, 80],
  alarm: [600, 200, 600, 200, 600],
  tap: [30]
};

export const haptics = {
  enabled: true,
  supported(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  },
  play(p: HapticPattern) {
    if (!this.enabled || !this.supported()) return;
    try {
      navigator.vibrate(PATTERNS[p]);
    } catch {
      /* yok say */
    }
  },
  stop() {
    if (this.supported()) navigator.vibrate(0);
  }
};
