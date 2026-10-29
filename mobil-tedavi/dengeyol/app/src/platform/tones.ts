/**
 * Ses tonları (Web Audio): olay bipleri ve "park sensörü" tarzı yaklaşma sesi.
 * Yaklaşma sesi: hedefe yaklaştıkça bipler sıklaşır ve tizleşir; hedefe girince susar.
 */
export type ToneName =
  | 'reached'
  | 'stepDone'
  | 'countdown'
  | 'done'
  | 'alarm'
  | 'test'
  | 'move'
  | 'drift'
  | 'markOn'
  | 'markOff'
  | 'pause';

class Tones {
  enabled = true;
  guidance = true;
  private ctx: AudioContext | null = null;
  private guideTimer: ReturnType<typeof setTimeout> | null = null;
  private closeness: number | null = null;

  /** Kullanıcı dokunuşu içinde çağrılmalı (iOS). */
  unlock() {
    try {
      if (!this.ctx) {
        const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!C) return;
        this.ctx = new C();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  /** Tonlar bilerek pes (≤ 1 kHz) ve yüksektir: yaşa bağlı işitme kaybı önce tizleri etkiler. */
  private beep(freq: number, ms: number, when = 0, gain = 0.3) {
    if (!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
    o.connect(g).connect(this.ctx.destination);
    o.start(t0);
    o.stop(t0 + ms / 1000 + 0.02);
  }

  play(name: ToneName) {
    switch (name) {
      case 'reached':
        this.beep(523, 200);
        this.beep(784, 400, 0.22);
        break;
      case 'stepDone':
        this.beep(440, 120);
        this.beep(587, 120, 0.15);
        this.beep(784, 220, 0.3);
        break;
      case 'countdown':
        this.beep(587, 140);
        break;
      case 'done':
        [392, 494, 587, 784].forEach((f, i) => this.beep(f, 220, i * 0.18));
        break;
      case 'alarm':
        [0, 0.35, 0.7].forEach((w) => this.beep(392, 280, w, 0.4));
        break;
      case 'test':
        this.beep(523, 250);
        break;
      case 'move':
        this.beep(440, 260);
        this.beep(440, 260, 0.42);
        break;
      case 'drift':
        [0, 0.16, 0.32].forEach((w) => this.beep(330, 110, w, 0.35));
        break;
      case 'markOn':
        this.beep(660, 220);
        break;
      case 'markOff':
        this.beep(660, 140);
        this.beep(440, 200, 0.2);
        break;
      case 'pause':
        this.beep(392, 350);
        this.beep(330, 350, 0.45);
        break;
    }
  }

  /** null → yaklaşma sesi kapalı. 0..1 → yakınlık. 1 → hedefte (sessiz). */
  setGuidance(c: number | null) {
    this.closeness = this.guidance ? c : null;
    if (this.closeness === null || this.closeness >= 1) {
      if (this.guideTimer) clearTimeout(this.guideTimer);
      this.guideTimer = null;
      return;
    }
    if (!this.guideTimer) this.loop();
  }

  private loop = () => {
    const c = this.closeness;
    if (c === null || c >= 1) {
      this.guideTimer = null;
      return;
    }
    this.beep(380 + 520 * c, 70, 0, 0.12);
    const interval = 1100 - 900 * c;
    this.guideTimer = setTimeout(this.loop, interval);
  };

  stopGuidance() {
    this.setGuidance(null);
  }
}

export const tones = new Tones();
