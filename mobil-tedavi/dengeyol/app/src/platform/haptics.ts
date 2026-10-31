/** Titreşim kalıpları (Android tarayıcıları; iOS Safari titreşim API'sini desteklemez → yalnız ses/ton). */
export type HapticPattern =
  | 'reached'
  | 'drift'
  | 'stepDone'
  | 'done'
  | 'alarm'
  | 'tap'
  | 'move'
  | 'markOn'
  | 'markOff'
  | 'pause';

/**
 * Sesi duyamayan kullanıcı için "ne zaman / ne oldu" bilgisi (yön bilgisi taşımaz). Her anlam SAYI ve SÜREYLE ayrılır;
 * aynı sayıda vuruşu olan iki kalıp süre bakımından en az ~2,5 kat farklıdır (k04, tur 1):
 *
 *   kalıp     ritim                              ms                          anlamı
 *   reached   1 uzun                             500                         doğru, böyle kalın
 *   pause     1 çok uzun                         1400                        duraklatıldı
 *   move      2 uzun                             450·450                     şimdi hareket edin (yeni adım / "şimdi!")
 *   stepDone  3 kısa                             120·120·120                 adım bitti
 *   done      3 kısa + 1 çok uzun                120·120·120·900             manevra/test bitti
 *   alarm     3 çok uzun                         1000·1000·1000              dur (güvenlik)
 *   markOn    kısa-kısa-UZUN                     100·100·700                 baş dönmesi işaretli (başladı; hatırlatma da bu)
 *   markOff   UZUN-kısa-kısa                     700·100·100                 baş dönmesi geçti
 *   drift     sürekli hızlı vızıltı (~1,5 s)     15 × 60                     pozisyon bozuldu
 *   tap       çok kısa                           30                          dokunuş alındı (anlam taşımaz)
 */
const PATTERNS: Record<HapticPattern, number[]> = {
  reached: [500],
  pause: [1400],
  move: [450, 250, 450],
  stepDone: [120, 120, 120, 120, 120],
  done: [120, 120, 120, 120, 120, 300, 900],
  alarm: [1000, 300, 1000, 300, 1000],
  markOn: [100, 120, 100, 120, 700],
  markOff: [700, 120, 100, 120, 100],
  drift: Array.from({ length: 29 }, (_, i) => (i % 2 === 0 ? 60 : 40)),
  tap: [30]
};

/** Kalıbın ham zamanlaması (titreşim, sessizlik, titreşim … ms) — "Titreşimleri tanı" ve testler için. */
export function hapticTimings(p: HapticPattern): readonly number[] {
  return PATTERNS[p];
}

/**
 * Kullanıcıya tanıtılan kalıplar (anlam sırasıyla). "Titreşimleri tanı" ekranı bu listeden üretilir; `tap` anlam
 * taşımadığı için yoktur.
 */
export const HAPTIC_LEGEND: { pattern: HapticPattern; label: string }[] = [
  { pattern: 'move', label: 'İki uzun: şimdi hareket edin' },
  { pattern: 'reached', label: 'Bir uzun: doğru, böyle kalın' },
  { pattern: 'drift', label: 'Hızlı, sürekli vızıltı: pozisyon bozuldu' },
  { pattern: 'stepDone', label: 'Üç kısa: bu adım bitti' },
  { pattern: 'done', label: 'Üç kısa ve bir çok uzun: manevra ya da test bitti' },
  { pattern: 'markOn', label: 'Kısa-kısa-uzun: baş dönmesi işaretli (geçince ekrana dokunun)' },
  { pattern: 'markOff', label: 'Uzun-kısa-kısa: baş dönmesi geçti olarak işaretlendi' },
  { pattern: 'pause', label: 'Bir çok uzun: duraklatıldı' },
  { pattern: 'alarm', label: 'Üç çok uzun: durun, güvenlik için durduruldu' }
];

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
