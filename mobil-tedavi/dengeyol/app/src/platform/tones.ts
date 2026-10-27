/**
 * Ses tonları (Web Audio): olay bipleri ve "park sensörü" tarzı yaklaşma sesi.
 * Yaklaşma sesi: hedefe yaklaştıkça bipler sıklaşır ve tizleşir; hedefe girince susar.
 */
type ToneName = 'reached' | 'stepDone' | 'countdown' | 'done' | 'alarm' | 'test';

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

  private beep(freq: number, ms: number, when = 0, gain = 0.18) {
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
        this.beep(880, 180);
        this.beep(1175, 260, 0.18);
        break;
      case 'stepDone':
        this.beep(660, 120);
        this.beep(880, 120, 0.15);
        this.beep(1320, 220, 0.3);
        break;
      case 'countdown':
        this.beep(740, 120);
        break;
      case 'done':
        [523, 659, 784, 1047].forEach((f, i) => this.beep(f, 200, i * 0.16));
        break;
      case 'alarm':
        [0, 0.35, 0.7].forEach((w) => this.beep(440, 250, w, 0.3));
        break;
      case 'test':
        this.beep(660, 200);
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
