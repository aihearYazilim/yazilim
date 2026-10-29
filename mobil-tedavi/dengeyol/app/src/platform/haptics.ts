/** Titreşim kalıpları (Android tarayıcıları; iOS Safari titreşim API'sini desteklemez → yalnız ses/ton). */
export type HapticPattern = 'reached' | 'drift' | 'stepDone' | 'alarm' | 'tap' | 'move' | 'markOn' | 'markOff' | 'pause';

/**
 * Az sayıda, ritimle ayrılan kalıp (sesi duyamayan kullanıcı için "ne zaman" bilgisi; yön bilgisi taşımaz):
 *   move    uzun-uzun        → şimdi hareket edin (yeni adım)
 *   reached tek uzun         → doğru, böyle kalın
 *   drift   hızlı üçlü       → pozisyon bozuldu
 *   stepDone kısa beşli      → adım bitti
 *   alarm   uzun üçlü        → dur
 * Kullanıcı dokunuşu onayları: markOn tek orta (baş dönmesi başladı), markOff çift orta (geçti), pause iki uzun.
 */
const PATTERNS: Record<HapticPattern, number[]> = {
  reached: [400],
  drift: [90, 80, 90, 80, 90],
  stepDone: [80, 60, 80, 60, 80],
  alarm: [600, 200, 600, 200, 600],
  tap: [30],
  move: [250, 150, 250],
  markOn: [180],
  markOff: [150, 120, 150],
  pause: [350, 200, 350]
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
