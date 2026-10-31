/**
 * Sesli yönerge (Web Speech API, Türkçe). Ses yoksa sessizce görsel moda düşer.
 * Not: Yerel uygulama sürümünde önceden kaydedilmiş insan sesi kullanılması önerilir (docs/YOL-HARITASI.md).
 */
/**
 * Konuşma hızı seçenekleri (Ayarlar ve kurulum). "Çok yavaş", ağır işiten/yavaş okuyan kullanıcılar içindir (k04, k01);
 * yürütücü süreleri hıza göre tahmin edildiğinden (estimateSpeechSec) ek ayar gerekmez.
 */
export const SPEECH_RATES: { value: number; label: string }[] = [
  { value: 0.65, label: 'Çok yavaş' },
  { value: 0.8, label: 'Yavaş' },
  { value: 1, label: 'Normal' },
  { value: 1.15, label: 'Hızlı' }
];

/** Hız denemesinde okunan örnek yönerge (gerçek bir manevra cümlesine benzer). */
export const SPEECH_SAMPLE =
  'Ses denemesi. Manevrada yönergeleri bu hızda duyacaksınız. Örneğin: Şimdi başınızı sağa çevirin ve yavaşça sırtüstü yatın.';

export class Speech {
  enabled = true;
  rate = 1;
  private voice: SpeechSynthesisVoice | null = null;
  private queueLen = 0;

  constructor() {
    if (!Speech.supported()) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      this.voice =
        voices.find((v) => v.lang?.toLowerCase().startsWith('tr') && v.localService) ??
        voices.find((v) => v.lang?.toLowerCase().startsWith('tr')) ??
        null;
    };
    pick();
    window.speechSynthesis.addEventListener?.('voiceschanged', pick);
  }

  static supported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  hasTurkishVoice(): boolean {
    return !!this.voice;
  }

  /** iOS/Safari: ilk konuşma kullanıcı dokunuşu içinde başlatılmalıdır. */
  unlock(): void {
    if (!Speech.supported()) return;
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      u.lang = 'tr-TR';
      window.speechSynthesis.speak(u);
    } catch {
      /* yok say */
    }
  }

  /** Türkçe sesli okuma gerçekten kullanılabilir mi? (ses kapalıysa ya da Türkçe ses yoksa false) */
  usable(): boolean {
    return this.enabled && Speech.supported() && !!this.voice;
  }

  /**
   * Söyler ve konuşma bitince çözülür (onend/onerror). Ses yoksa hemen; olay hiç gelmezse `maxMs` sonra çözülür.
   * Ölçüm yönergenin bitmesini beklesin diye: yavaş bir ses tahmini süreyi aşabilir.
   */
  speakAsync(text: string, maxMs: number): Promise<void> {
    if (!this.enabled || !Speech.supported() || !text) return Promise.resolve();
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      setTimeout(finish, maxMs);
      this.speak(text, 'high', finish);
    });
  }

  speak(text: string, priority: 'high' | 'normal' = 'normal', onDone?: () => void): void {
    try {
      this.speakInner(text, priority, onDone);
    } catch {
      // Konuşma motoru hatası uygulamayı düşürmesin: sesi kapat, görsel/ton yönlendirmeyle devam et.
      this.enabled = false;
      onDone?.();
    }
  }

  private speakInner(text: string, priority: 'high' | 'normal', onDone?: () => void): void {
    if (!this.enabled || !Speech.supported() || !text) return;
    const synth = window.speechSynthesis;
    if (priority === 'high') {
      synth.cancel();
      this.queueLen = 0;
    } else if (this.queueLen >= 2) {
      // Eski ipuçlarını biriktirme
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'tr-TR';
    if (this.voice) u.voice = this.voice;
    u.rate = this.rate;
    this.queueLen++;
    const done = () => {
      this.queueLen = Math.max(0, this.queueLen - 1);
      onDone?.();
    };
    u.onend = done;
    u.onerror = done;
    synth.speak(u);
  }

  cancel(): void {
    if (!Speech.supported()) return;
    window.speechSynthesis.cancel();
    this.queueLen = 0;
  }
}

export const speech = new Speech();
